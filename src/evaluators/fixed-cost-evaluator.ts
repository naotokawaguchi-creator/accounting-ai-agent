import type { MonthlyPL } from '../types/accounting.js';
import type { Evaluation, EvaluationLevel } from '../types/report.js';
import { formatPercent, formatCurrency, safeDivide } from '../utils/format.js';

/**
 * 固定費負担に関する評価を行う
 */
export function evaluateFixedCost(pl: MonthlyPL): Evaluation {
  const fixedCostRatio = safeDivide(pl.sgaExpenses, pl.revenue) ?? 0;

  let level: EvaluationLevel;
  if (fixedCostRatio <= 0.3) level = 'excellent';
  else if (fixedCostRatio <= 0.5) level = 'good';
  else if (fixedCostRatio <= 0.65) level = 'fair';
  else if (fixedCostRatio <= 0.8) level = 'warning';
  else level = 'critical';

  const score = Math.min(100, Math.max(0, (1 - fixedCostRatio) * 100));

  const summary = generateSummary(level, fixedCostRatio);
  const details = [
    `販売管理費: ${formatCurrency(pl.sgaExpenses)}`,
    `売上高: ${formatCurrency(pl.revenue)}`,
    `販管費率: ${formatPercent(fixedCostRatio)}`,
  ].join('\n');

  return {
    category: 'fixed_cost',
    level,
    score,
    summary,
    details,
  };
}

function generateSummary(level: EvaluationLevel, ratio: number): string {
  const ratioStr = formatPercent(ratio);
  switch (level) {
    case 'excellent':
      return `販管費率${ratioStr}と効率的な費用構造です。`;
    case 'good':
      return `販管費率${ratioStr}と適正な水準です。`;
    case 'fair':
      return `販管費率${ratioStr}。やや費用負担が大きくなっています。`;
    case 'warning':
      return `販管費率${ratioStr}と高い水準です。固定費の見直しを検討してください。`;
    case 'critical':
      return `販管費率${ratioStr}。売上に対して固定費が非常に重い状態です。至急の対策が必要です。`;
  }
}
