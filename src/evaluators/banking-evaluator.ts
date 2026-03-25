import type { BankingMetrics, BankingScore } from '../types/finance.js';
import type { Evaluation, EvaluationLevel } from '../types/report.js';
import { formatPercent } from '../utils/format.js';

/**
 * 銀行評価の観点での総合評価を行う
 */
export function evaluateBanking(bankingMetrics: BankingMetrics): Evaluation {
  const scoreMap: Record<BankingScore, EvaluationLevel> = {
    excellent: 'excellent',
    good: 'good',
    fair: 'fair',
    poor: 'warning',
    critical: 'critical',
  };

  const level = scoreMap[bankingMetrics.overallScore];
  const score = bankingScoreToNumber(bankingMetrics.overallScore);

  const summary = generateBankingSummary(level, bankingMetrics);
  const details = generateBankingDetails(bankingMetrics);

  return {
    category: 'banking',
    level,
    score,
    summary,
    details,
  };
}

function bankingScoreToNumber(score: BankingScore): number {
  switch (score) {
    case 'excellent': return 90;
    case 'good': return 70;
    case 'fair': return 50;
    case 'poor': return 30;
    case 'critical': return 10;
  }
}

function generateBankingSummary(level: EvaluationLevel, m: BankingMetrics): string {
  switch (level) {
    case 'excellent':
      return '金融機関から見て優良な財務状態です。融資条件の改善交渉も検討できます。';
    case 'good':
      return '金融機関からの評価は良好です。現在の水準を維持しましょう。';
    case 'fair':
      return '金融機関からの評価は普通です。主要指標の改善を意識しましょう。';
    case 'warning':
      return '金融機関からの評価が低い可能性があります。財務体質の改善が必要です。';
    case 'critical':
      return '金融機関からの評価が厳しい状態です。自己資本の充実と収益力の改善が急務です。';
  }
}

function generateBankingDetails(m: BankingMetrics): string {
  const lines = [
    `自己資本比率: ${m.equityRatio.toFixed(1)}%`,
    `債務償還年数: ${m.debtRepaymentYears !== null ? `${m.debtRepaymentYears.toFixed(1)}年` : '算出不可'}`,
    `月商倍率（現預金）: ${m.cashToMonthlyRevenue.toFixed(1)}倍`,
    `営業利益率: ${formatPercent(m.operatingProfitMargin)}`,
    `総合評価: ${m.overallScore}`,
  ];
  return lines.join('\n');
}
