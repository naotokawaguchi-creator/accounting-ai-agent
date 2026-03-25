import type { MonthlyPL, BalanceSheet, MonthlyComparison, AnomalyDetection } from '../types/accounting.js';
import type { FinancialMetrics, CashFlowAnalysis, BankingMetrics } from '../types/finance.js';
import type { Evaluation, ManagementCommentary } from '../types/report.js';
import { formatCurrency, formatPercent, formatChangeRate, formatMonthJP } from '../utils/format.js';

/** コメント生成の入力データ */
export interface CommentaryInput {
  currentPL: MonthlyPL;
  previousPL: MonthlyPL | null;
  balanceSheet: BalanceSheet;
  comparison: MonthlyComparison;
  financialMetrics: FinancialMetrics;
  cashFlowAnalysis: CashFlowAnalysis;
  bankingMetrics: BankingMetrics;
  evaluations: Evaluation[];
  anomalies: AnomalyDetection[];
}

/** コメント生成インターフェース（将来LLM差し替え可能） */
export interface CommentaryProvider {
  generate(input: CommentaryInput): Promise<ManagementCommentary>;
}

/**
 * テンプレートベースのコメント生成
 *
 * 数値と評価結果から定型コメントを生成する。
 * 将来的にはAnthropicAPI等のLLM接続に差し替え可能。
 */
export class TemplateCommentaryProvider implements CommentaryProvider {
  async generate(input: CommentaryInput): Promise<ManagementCommentary> {
    const { currentPL, previousPL, balanceSheet, comparison, financialMetrics, cashFlowAnalysis, bankingMetrics, evaluations, anomalies } = input;
    const monthLabel = formatMonthJP(currentPL.year, currentPL.month);

    // 経営サマリー
    const executiveSummary = this.generateExecutiveSummary(monthLabel, currentPL, comparison, cashFlowAnalysis);

    // 各カテゴリコメント
    const profitEval = evaluations.find(e => e.category === 'profit');
    const cashFlowEval = evaluations.find(e => e.category === 'cash_flow');
    const fixedCostEval = evaluations.find(e => e.category === 'fixed_cost');
    const revenueEval = evaluations.find(e => e.category === 'revenue_dependency');
    const bankingEval = evaluations.find(e => e.category === 'banking');

    const profitComment = this.generateProfitComment(currentPL, previousPL, financialMetrics, profitEval);
    const cashFlowComment = this.generateCashFlowComment(cashFlowAnalysis, cashFlowEval);
    const fixedCostComment = fixedCostEval?.summary ?? '固定費の評価データが不足しています。';
    const revenueDependencyComment = revenueEval?.summary ?? '売上依存度の評価データが不足しています。';
    const bankingComment = bankingEval?.summary ?? '銀行評価の算出データが不足しています。';

    // 良い点・悪い点・アクション
    const positivePoints = this.extractPositivePoints(evaluations, currentPL, previousPL);
    const negativePoints = this.extractNegativePoints(evaluations, anomalies);
    const actionItems = this.generateActionItems(evaluations, anomalies);
    const dataLimitations = this.checkDataLimitations(previousPL, cashFlowAnalysis);

    return {
      executiveSummary,
      profitComment,
      cashFlowComment,
      fixedCostComment,
      revenueDependencyComment,
      bankingComment,
      positivePoints,
      negativePoints,
      actionItems,
      dataLimitations,
    };
  }

  private generateExecutiveSummary(
    monthLabel: string,
    pl: MonthlyPL,
    comparison: MonthlyComparison,
    cashFlow: CashFlowAnalysis
  ): string {
    const parts: string[] = [];
    parts.push(`${monthLabel}の経営状況をご報告いたします。`);
    parts.push(`売上高は${formatCurrency(pl.revenue)}、経常利益は${formatCurrency(pl.ordinaryIncome)}でした。`);

    if (comparison.changes) {
      const rc = comparison.changes.revenueChangeRate;
      if (rc > 0.05) {
        parts.push(`売上は前月比${formatChangeRate(rc)}と増加しています。`);
      } else if (rc < -0.05) {
        parts.push(`売上は前月比${formatChangeRate(rc)}と減少しています。`);
      } else {
        parts.push('売上は前月とほぼ同水準です。');
      }
    }

    parts.push(`現預金残高は${formatCurrency(cashFlow.currentCash)}で、固定費の約${cashFlow.cashRunwayMonths >= 999 ? '十分な' : cashFlow.cashRunwayMonths.toFixed(1) + 'か月分の'}余力があります。`);

    return parts.join('');
  }

  private generateProfitComment(
    pl: MonthlyPL,
    prevPL: MonthlyPL | null,
    metrics: FinancialMetrics,
    eval_: Evaluation | undefined
  ): string {
    const parts: string[] = [];
    if (eval_) parts.push(eval_.summary);

    if (prevPL) {
      const change = pl.ordinaryIncome - prevPL.ordinaryIncome;
      if (Math.abs(change) > 0) {
        const direction = change > 0 ? '改善' : '悪化';
        parts.push(`前月比で${formatCurrency(Math.abs(change))}${direction}しています。`);
      }
    }

    // 主要費用のトップ3を言及
    const topExpenses = pl.expenseBreakdown.slice(0, 3);
    if (topExpenses.length > 0) {
      const expStr = topExpenses.map(e => `${e.accountName}（${formatCurrency(e.amount)}）`).join('、');
      parts.push(`主な費用項目は${expStr}です。`);
    }

    return parts.join('');
  }

  private generateCashFlowComment(cashFlow: CashFlowAnalysis, eval_: Evaluation | undefined): string {
    const parts: string[] = [];
    if (eval_) parts.push(eval_.summary);

    if (cashFlow.cashChangeFromPrevMonth !== 0) {
      const direction = cashFlow.cashChangeFromPrevMonth > 0 ? '増加' : '減少';
      parts.push(`前月から${formatCurrency(Math.abs(cashFlow.cashChangeFromPrevMonth))}${direction}しました。`);
    }

    if (cashFlow.shortageRisk === 'danger') {
      parts.push('至急の資金手当てを検討してください。');
    } else if (cashFlow.shortageRisk === 'warning') {
      parts.push('今後の入出金予定を確認し、必要に応じて資金調達を検討してください。');
    }

    return parts.join('');
  }

  private extractPositivePoints(evaluations: Evaluation[], pl: MonthlyPL, prevPL: MonthlyPL | null): string[] {
    const points: string[] = [];
    for (const eval_ of evaluations) {
      if (eval_.level === 'excellent' || eval_.level === 'good') {
        points.push(eval_.summary);
      }
    }
    if (prevPL && pl.revenue > prevPL.revenue) {
      points.push('売上高が前月を上回りました。');
    }
    if (points.length === 0) {
      points.push('現時点で特筆すべき好材料はありません。今後の推移を注視してください。');
    }
    return points;
  }

  private extractNegativePoints(evaluations: Evaluation[], anomalies: AnomalyDetection[]): string[] {
    const points: string[] = [];
    for (const eval_ of evaluations) {
      if (eval_.level === 'critical' || eval_.level === 'warning') {
        points.push(eval_.summary);
      }
    }
    for (const anomaly of anomalies.filter(a => a.severity === 'critical')) {
      points.push(anomaly.message);
    }
    return points;
  }

  private generateActionItems(evaluations: Evaluation[], anomalies: AnomalyDetection[]): string[] {
    const items: string[] = [];

    const criticalEvals = evaluations.filter(e => e.level === 'critical');
    const warningEvals = evaluations.filter(e => e.level === 'warning');

    if (criticalEvals.some(e => e.category === 'profit')) {
      items.push('赤字の原因を特定し、費用削減または売上増加策を早急に検討してください。');
    }
    if (criticalEvals.some(e => e.category === 'cash_flow')) {
      items.push('資金繰り表を作成し、今後3か月の入出金を精査してください。');
    }
    if (warningEvals.some(e => e.category === 'fixed_cost')) {
      items.push('固定費の内訳を確認し、削減可能な項目がないか検討してください。');
    }
    if (anomalies.some(a => a.type === 'expense_surge')) {
      items.push('前月比で大幅に増加した費用科目の内容を確認してください。');
    }

    if (items.length === 0) {
      items.push('現時点で緊急の対応事項はありません。引き続き月次の推移を確認してください。');
    }

    return items;
  }

  private checkDataLimitations(prevPL: MonthlyPL | null, cashFlow: CashFlowAnalysis): string[] {
    const limitations: string[] = [];
    if (!prevPL) {
      limitations.push('前月データが取得できないため、前月比較および推移の評価は行っていません。');
    }
    limitations.push('固定費・変動費の区分は簡易的な推定です。正確な区分には個別科目の性質分析が必要です。');
    limitations.push('債務償還年数は有利子負債ではなく総負債で簡易計算しています。');
    return limitations;
  }
}
