import type { MonthlyPL } from '../types/accounting.js';
import type { FinancialMetrics } from '../types/finance.js';
import type { Evaluation, EvaluationLevel } from '../types/report.js';
import { evaluationThresholds } from '../config/index.js';
import { formatPercent, formatCurrency } from '../utils/format.js';

/**
 * 利益に関する評価を行う
 */
export function evaluateProfit(pl: MonthlyPL, metrics: FinancialMetrics): Evaluation {
  const margin = metrics.profitability.ordinaryProfitMargin;
  const t = evaluationThresholds.profit;

  let level: EvaluationLevel;
  if (margin >= t.excellent) level = 'excellent';
  else if (margin >= t.good) level = 'good';
  else if (margin >= t.fair) level = 'fair';
  else if (margin >= t.warning) level = 'warning';
  else level = 'critical';

  const score = Math.min(100, Math.max(0, margin * 500 + 50));

  const summary = generateProfitSummary(level, pl, margin);
  const details = generateProfitDetails(pl, metrics);

  return {
    category: 'profit',
    level,
    score,
    summary,
    details,
  };
}

function generateProfitSummary(level: EvaluationLevel, pl: MonthlyPL, margin: number): string {
  const marginStr = formatPercent(margin);
  switch (level) {
    case 'excellent':
      return `経常利益率${marginStr}と優良な収益水準です。`;
    case 'good':
      return `経常利益率${marginStr}と安定した収益を確保しています。`;
    case 'fair':
      return `経常利益率${marginStr}。収益力の改善余地があります。`;
    case 'warning':
      return `経常利益率${marginStr}と低水準です。費用構造の見直しが必要です。`;
    case 'critical':
      return `経常利益が赤字（${formatCurrency(pl.ordinaryIncome)}）です。早急な対策が必要です。`;
  }
}

function generateProfitDetails(pl: MonthlyPL, metrics: FinancialMetrics): string {
  const lines = [
    `売上高: ${formatCurrency(pl.revenue)}`,
    `売上総利益: ${formatCurrency(pl.grossProfit)}（粗利率 ${formatPercent(metrics.profitability.grossProfitMargin)}）`,
    `営業利益: ${formatCurrency(pl.operatingIncome)}（営業利益率 ${formatPercent(metrics.profitability.operatingProfitMargin)}）`,
    `経常利益: ${formatCurrency(pl.ordinaryIncome)}（経常利益率 ${formatPercent(metrics.profitability.ordinaryProfitMargin)}）`,
  ];
  return lines.join('\n');
}
