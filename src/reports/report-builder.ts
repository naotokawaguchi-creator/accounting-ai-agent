import type { FreeeRawData } from '../services/freee-service.js';
import type { FullReport, ExecutiveSummary, EvaluationLevel } from '../types/report.js';
import type { MonthlyPL } from '../types/accounting.js';
import { parsePLResponse } from '../domain/accounting/pl-parser.js';
import { parseBSResponse } from '../domain/accounting/bs-parser.js';
import { createMonthlyComparison } from '../domain/accounting/comparison.js';
import { detectAnomalies } from '../domain/accounting/anomaly-detector.js';
import { calculateFinancialMetrics } from '../domain/finance/metrics-calculator.js';
import { analyzeCashFlow } from '../domain/cashflow/cashflow-analyzer.js';
import { calculateBankingMetrics } from '../domain/banking/banking-evaluator.js';
import { runAllEvaluations } from '../evaluators/index.js';
import { TemplateCommentaryProvider } from '../commentary/commentary-generator.js';
import { logger } from '../utils/logger.js';

const VERSION = '0.1.0';

/**
 * レポートビルダー
 *
 * freee APIの生データから、各ドメインモジュールを順に呼び出し、
 * 最終的なFullReportを組み立てる。
 */
export class ReportBuilder {
  private commentaryProvider = new TemplateCommentaryProvider();

  async build(rawData: FreeeRawData, year: number, month: number): Promise<FullReport> {
    logger.info('レポート生成を開始します...');

    // 1. データ整形
    // freeeのclosing_balanceは期首からの累計値
    // 当月PL(累計) - 前月PL(累計) = 当月単月PL
    const currentCumulativePL = parsePLResponse(rawData.currentMonthPL, year, month);
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const previousCumulativePL = parsePLResponse(rawData.previousMonthPL, prevYear, prevMonth);
    const currentBS = parseBSResponse(rawData.currentMonthBS, year, month);
    const previousBS = parseBSResponse(rawData.previousMonthBS, prevYear, prevMonth);

    // 累計PLの差分で単月PLを算出
    const currentPL = subtractPL(currentCumulativePL, previousCumulativePL);

    // 前月単月 = 前月累計 - 前々月累計
    let previousPL: MonthlyPL;
    if (rawData.prevPrevMonthPL) {
      const ppMonth2 = prevMonth === 1 ? 12 : prevMonth - 1;
      const ppYear2 = prevMonth === 1 ? prevYear - 1 : prevYear;
      const prevPrevCumulativePL = parsePLResponse(rawData.prevPrevMonthPL, ppYear2, ppMonth2);
      previousPL = subtractPL(previousCumulativePL, prevPrevCumulativePL);
    } else {
      // 前々月データなし（期首月など）→ 前月累計がそのまま単月
      previousPL = previousCumulativePL;
    }
    logger.info(`データ整形完了 (当月単月売上=${currentPL.revenue}, 前月単月売上=${previousPL.revenue})`);

    // 2. 月次比較
    const comparison = createMonthlyComparison(currentPL, previousPL);
    logger.info('月次比較完了');

    // 3. 財務指標計算
    const financialMetrics = calculateFinancialMetrics(currentPL, currentBS);
    logger.info('財務指標計算完了');

    // 4. 資金繰り分析
    const cashFlowAnalysis = analyzeCashFlow(currentPL, currentBS, previousBS);
    logger.info('資金繰り分析完了');

    // 5. 銀行評価
    const bankingMetrics = calculateBankingMetrics(currentPL, currentBS, financialMetrics);
    logger.info('銀行評価完了');

    // 6. 異常検知
    const anomalies = detectAnomalies(currentPL, previousPL, currentBS, previousBS);
    logger.info(`異常検知完了: ${anomalies.length}件検出`);

    // 7. 評価
    const evaluations = runAllEvaluations({
      currentPL,
      previousPL,
      financialMetrics,
      cashFlowAnalysis,
      bankingMetrics,
    });
    logger.info('評価完了');

    // 8. コメント生成
    const commentary = await this.commentaryProvider.generate({
      currentPL,
      previousPL,
      balanceSheet: currentBS,
      comparison,
      financialMetrics,
      cashFlowAnalysis,
      bankingMetrics,
      evaluations,
      anomalies,
    });
    logger.info('コメント生成完了');

    // 9. エグゼクティブサマリー
    const overallLevel = determineOverallLevel(evaluations.map(e => e.level));
    const executiveSummary: ExecutiveSummary = {
      monthlyRevenue: currentPL.revenue,
      monthlyExpenses: currentPL.costOfSales + currentPL.sgaExpenses,
      monthlyProfit: currentPL.ordinaryIncome,
      cashBalance: currentBS.cashAndDeposits,
      revenueChangeRate: comparison.changes?.revenueChangeRate ?? null,
      profitChangeRate: comparison.changes?.ordinaryIncomeChangeRate ?? null,
      overallAssessment: overallLevel,
      keyMessage: commentary.executiveSummary,
    };

    const report: FullReport = {
      meta: {
        companyId: rawData.company.id,
        companyName: rawData.company.display_name,
        reportMonth: `${year}-${String(month).padStart(2, '0')}`,
        generatedAt: new Date().toISOString(),
        version: VERSION,
      },
      executiveSummary,
      monthlyPL: currentPL,
      balanceSheet: currentBS,
      comparison,
      financialMetrics,
      cashFlowAnalysis,
      bankingMetrics,
      evaluations,
      anomalies,
      commentary,
    };

    logger.info('レポート生成完了');
    return report;
  }
}

function determineOverallLevel(levels: EvaluationLevel[]): EvaluationLevel {
  const order: EvaluationLevel[] = ['critical', 'warning', 'fair', 'good', 'excellent'];
  for (const level of order) {
    if (levels.includes(level)) return level;
  }
  return 'fair';
}

/**
 * 2つの累計PLの差分を取って単月PLを算出する
 *
 * freeeのtrial_pl APIは期首からの累計値を返すため、
 * 当月単月 = 当月累計 - 前月累計 で算出する
 */
function subtractPL(current: MonthlyPL, previous: MonthlyPL): MonthlyPL {
  return {
    year: current.year,
    month: current.month,
    revenue: current.revenue - previous.revenue,
    costOfSales: current.costOfSales - previous.costOfSales,
    grossProfit: current.grossProfit - previous.grossProfit,
    sgaExpenses: current.sgaExpenses - previous.sgaExpenses,
    operatingIncome: current.operatingIncome - previous.operatingIncome,
    nonOperatingIncome: current.nonOperatingIncome - previous.nonOperatingIncome,
    nonOperatingExpenses: current.nonOperatingExpenses - previous.nonOperatingExpenses,
    ordinaryIncome: current.ordinaryIncome - previous.ordinaryIncome,
    extraordinaryIncome: current.extraordinaryIncome - previous.extraordinaryIncome,
    extraordinaryLoss: current.extraordinaryLoss - previous.extraordinaryLoss,
    netIncome: current.netIncome - previous.netIncome,
    // 費用内訳も差分
    expenseBreakdown: current.expenseBreakdown.map(item => {
      const prevItem = previous.expenseBreakdown.find(p => p.accountId === item.accountId);
      return {
        ...item,
        amount: prevItem ? item.amount - prevItem.amount : item.amount,
      };
    }).filter(item => item.amount !== 0),
  };
}
