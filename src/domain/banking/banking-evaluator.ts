import type { FinancialMetrics, BankingMetrics, BankingScore } from '../../types/finance.js';
import type { MonthlyPL, BalanceSheet } from '../../types/accounting.js';
import { safeDivide } from '../../utils/format.js';

/**
 * 銀行評価指標を算出する
 *
 * 金融機関が融資判断に使用する主要指標を計算し、
 * 簡易スコアリングを行う。
 *
 * 将来的に格付け相当のスコアリングや、
 * 金融機関説明資料の自動生成に拡張する想定。
 */
export function calculateBankingMetrics(
  pl: MonthlyPL,
  bs: BalanceSheet,
  financialMetrics: FinancialMetrics
): BankingMetrics {
  const cashToMonthlyRevenue = pl.revenue > 0
    ? bs.cashAndDeposits / pl.revenue
    : 0;

  const scores: number[] = [];

  // 自己資本比率のスコア
  scores.push(scoreEquityRatio(financialMetrics.safety.equityRatio));
  // 債務償還年数のスコア
  scores.push(scoreDebtRepayment(financialMetrics.safety.debtRepaymentYears));
  // 営業利益率のスコア
  scores.push(scoreProfitMargin(financialMetrics.profitability.operatingProfitMargin));
  // 月商倍率のスコア
  scores.push(scoreCashRatio(cashToMonthlyRevenue));

  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const overallScore = determineOverallScore(avgScore);

  return {
    equityRatio: financialMetrics.safety.equityRatio,
    debtRepaymentYears: financialMetrics.safety.debtRepaymentYears,
    cashToMonthlyRevenue,
    operatingProfitMargin: financialMetrics.profitability.operatingProfitMargin,
    overallScore,
  };
}

function scoreEquityRatio(ratio: number): number {
  if (ratio >= 50) return 5;
  if (ratio >= 30) return 4;
  if (ratio >= 20) return 3;
  if (ratio >= 10) return 2;
  return 1;
}

function scoreDebtRepayment(years: number | null): number {
  if (years === null) return 1;
  if (years <= 5) return 5;
  if (years <= 10) return 4;
  if (years <= 15) return 3;
  if (years <= 20) return 2;
  return 1;
}

function scoreProfitMargin(margin: number): number {
  if (margin >= 0.10) return 5;
  if (margin >= 0.05) return 4;
  if (margin >= 0.02) return 3;
  if (margin >= 0) return 2;
  return 1;
}

function scoreCashRatio(ratio: number): number {
  if (ratio >= 3) return 5;
  if (ratio >= 2) return 4;
  if (ratio >= 1.5) return 3;
  if (ratio >= 1) return 2;
  return 1;
}

function determineOverallScore(avgScore: number): BankingScore {
  if (avgScore >= 4.5) return 'excellent';
  if (avgScore >= 3.5) return 'good';
  if (avgScore >= 2.5) return 'fair';
  if (avgScore >= 1.5) return 'poor';
  return 'critical';
}
