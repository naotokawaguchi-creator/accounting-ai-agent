import type { CashFlowAnalysis } from '../types/finance.js';
import type { Evaluation, EvaluationLevel } from '../types/report.js';
import { evaluationThresholds } from '../config/index.js';
import { formatCurrency, formatChangeRate } from '../utils/format.js';

/**
 * 資金繰りに関する評価を行う
 */
export function evaluateCashFlow(cashFlow: CashFlowAnalysis): Evaluation {
  const months = cashFlow.cashRunwayMonths;
  const t = evaluationThresholds.cashMonths;

  let level: EvaluationLevel;
  if (months >= t.excellent) level = 'excellent';
  else if (months >= t.good) level = 'good';
  else if (months >= t.fair) level = 'fair';
  else if (months >= t.warning) level = 'warning';
  else level = 'critical';

  // リスクレベルでさらに調整
  if (cashFlow.shortageRisk === 'danger') level = 'critical';
  else if (cashFlow.shortageRisk === 'warning' && level !== 'critical') level = 'warning';

  const score = Math.min(100, Math.max(0, months * 15));

  const summary = generateCashFlowSummary(level, cashFlow);
  const details = generateCashFlowDetails(cashFlow);

  return {
    category: 'cash_flow',
    level,
    score,
    summary,
    details,
  };
}

function generateCashFlowSummary(level: EvaluationLevel, cf: CashFlowAnalysis): string {
  const months = cf.cashRunwayMonths >= 999 ? '十分' : `約${cf.cashRunwayMonths.toFixed(1)}か月分`;
  switch (level) {
    case 'excellent':
      return `現預金${formatCurrency(cf.currentCash)}。固定費の${months}の余力があり、安定しています。`;
    case 'good':
      return `現預金${formatCurrency(cf.currentCash)}。${months}の余力があります。`;
    case 'fair':
      return `現預金${formatCurrency(cf.currentCash)}。余力が${months}とやや心許ない水準です。`;
    case 'warning':
      return `現預金${formatCurrency(cf.currentCash)}。余力が${months}しかなく、注意が必要です。`;
    case 'critical':
      return `現預金${formatCurrency(cf.currentCash)}。資金繰りが逼迫しており、緊急の対応が必要です。`;
  }
}

function generateCashFlowDetails(cf: CashFlowAnalysis): string {
  const lines = [
    `現預金残高: ${formatCurrency(cf.currentCash)}`,
    `月次固定費: ${formatCurrency(cf.monthlyBurnRate)}`,
    `資金繰り余力: ${cf.cashRunwayMonths >= 999 ? '十分' : `${cf.cashRunwayMonths.toFixed(1)}か月`}`,
  ];
  if (cf.cashChangeFromPrevMonth !== 0) {
    lines.push(`前月比増減: ${formatCurrency(cf.cashChangeFromPrevMonth)}（${formatChangeRate(cf.cashChangeRate)}）`);
  }
  return lines.join('\n');
}
