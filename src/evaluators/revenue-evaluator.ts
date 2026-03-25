import type { MonthlyPL } from '../types/accounting.js';
import type { Evaluation, EvaluationLevel } from '../types/report.js';
import { formatPercent, formatCurrency } from '../utils/format.js';

/**
 * 売上依存度に関する評価を行う
 *
 * 売上の安定性を前月比や費用科目集中度から評価する。
 * 将来的に取引先別売上データが取れれば、特定顧客依存度も評価可能。
 */
export function evaluateRevenueDependency(
  currentPL: MonthlyPL,
  previousPL: MonthlyPL | null
): Evaluation {
  let level: EvaluationLevel = 'good';
  let score = 70;
  const issues: string[] = [];

  if (previousPL) {
    const changeRate = previousPL.revenue > 0
      ? (currentPL.revenue - previousPL.revenue) / previousPL.revenue
      : 0;

    if (changeRate <= -0.3) {
      level = 'critical';
      score = 20;
      issues.push(`売上が前月比${formatPercent(Math.abs(changeRate))}減少しています`);
    } else if (changeRate <= -0.15) {
      level = 'warning';
      score = 40;
      issues.push(`売上が前月比${formatPercent(Math.abs(changeRate))}減少しています`);
    } else if (changeRate <= -0.05) {
      level = 'fair';
      score = 55;
      issues.push(`売上がやや減少傾向です（前月比${formatPercent(Math.abs(changeRate))}減）`);
    } else if (changeRate >= 0.1) {
      level = 'excellent';
      score = 90;
    }
  } else {
    level = 'fair';
    score = 50;
    issues.push('前月データがないため、推移の評価ができません');
  }

  // TODO: 取引先別の売上集中度の評価を追加（freee APIから取引先別データ取得が必要）

  const summary = issues.length > 0
    ? issues[0]
    : `売上は安定しています（${formatCurrency(currentPL.revenue)}）。`;

  const details = [
    `当月売上高: ${formatCurrency(currentPL.revenue)}`,
    previousPL ? `前月売上高: ${formatCurrency(previousPL.revenue)}` : '前月データなし',
  ].join('\n');

  return {
    category: 'revenue_dependency',
    level,
    score,
    summary,
    details,
  };
}
