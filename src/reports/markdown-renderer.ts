import type { FullReport } from '../types/report.js';
import { formatCurrency, formatPercent, formatChangeRate, formatMonthJP } from '../utils/format.js';

/**
 * FullReportをMarkdown形式に変換する
 */
export function renderMarkdown(report: FullReport): string {
  const { meta, executiveSummary: es, monthlyPL: pl, balanceSheet: bs, comparison, financialMetrics: fm, cashFlowAnalysis: cf, bankingMetrics: bm, evaluations, anomalies, commentary } = report;
  const monthLabel = formatMonthJP(pl.year, pl.month);

  const sections: string[] = [];

  // ヘッダー
  sections.push(`# ${meta.companyName} ${monthLabel} 月次経営レポート`);
  sections.push(`> 生成日時: ${new Date(meta.generatedAt).toLocaleString('ja-JP')}`);
  sections.push('');

  // 1. 結論サマリー
  sections.push('## 1. 結論サマリー');
  sections.push('');
  sections.push(commentary.executiveSummary);
  sections.push('');
  sections.push(`**総合評価: ${levelToJapanese(es.overallAssessment)}**`);
  sections.push('');

  // 2. 主要KPI
  sections.push('## 2. 主要KPI');
  sections.push('');
  sections.push('| 指標 | 金額 | 前月比 |');
  sections.push('|------|------|--------|');
  sections.push(`| 売上高 | ${formatCurrency(es.monthlyRevenue)} | ${es.revenueChangeRate !== null ? formatChangeRate(es.revenueChangeRate) : '-'} |`);
  sections.push(`| 経常利益 | ${formatCurrency(es.monthlyProfit)} | ${es.profitChangeRate !== null ? formatChangeRate(es.profitChangeRate) : '-'} |`);
  sections.push(`| 現預金残高 | ${formatCurrency(es.cashBalance)} | ${cf.cashChangeFromPrevMonth !== 0 ? formatCurrency(cf.cashChangeFromPrevMonth) : '-'} |`);
  sections.push('');

  // 3. 前月比較
  sections.push('## 3. 損益計算書（前月比較）');
  sections.push('');
  sections.push('| 科目 | 当月 | 前月 | 増減 |');
  sections.push('|------|------|------|------|');
  if (comparison.previous) {
    const prev = comparison.previous;
    sections.push(`| 売上高 | ${formatCurrency(pl.revenue)} | ${formatCurrency(prev.revenue)} | ${formatCurrency(pl.revenue - prev.revenue)} |`);
    sections.push(`| 売上総利益 | ${formatCurrency(pl.grossProfit)} | ${formatCurrency(prev.grossProfit)} | ${formatCurrency(pl.grossProfit - prev.grossProfit)} |`);
    sections.push(`| 販売管理費 | ${formatCurrency(pl.sgaExpenses)} | ${formatCurrency(prev.sgaExpenses)} | ${formatCurrency(pl.sgaExpenses - prev.sgaExpenses)} |`);
    sections.push(`| 営業利益 | ${formatCurrency(pl.operatingIncome)} | ${formatCurrency(prev.operatingIncome)} | ${formatCurrency(pl.operatingIncome - prev.operatingIncome)} |`);
    sections.push(`| 経常利益 | ${formatCurrency(pl.ordinaryIncome)} | ${formatCurrency(prev.ordinaryIncome)} | ${formatCurrency(pl.ordinaryIncome - prev.ordinaryIncome)} |`);
  } else {
    sections.push(`| 売上高 | ${formatCurrency(pl.revenue)} | - | - |`);
    sections.push(`| 売上総利益 | ${formatCurrency(pl.grossProfit)} | - | - |`);
    sections.push(`| 販売管理費 | ${formatCurrency(pl.sgaExpenses)} | - | - |`);
    sections.push(`| 営業利益 | ${formatCurrency(pl.operatingIncome)} | - | - |`);
    sections.push(`| 経常利益 | ${formatCurrency(pl.ordinaryIncome)} | - | - |`);
  }
  sections.push('');

  // 4. 科目別の特徴（主要費用トップ5）
  sections.push('## 4. 主要費用科目');
  sections.push('');
  const topExpenses = pl.expenseBreakdown.slice(0, 5);
  if (topExpenses.length > 0) {
    sections.push('| 順位 | 科目名 | 金額 |');
    sections.push('|------|--------|------|');
    topExpenses.forEach((e, i) => {
      sections.push(`| ${i + 1} | ${e.accountName} | ${formatCurrency(e.amount)} |`);
    });
  }
  sections.push('');

  // 前月比で大きく変動した費用
  if (comparison.changes && comparison.changes.significantExpenseChanges.length > 0) {
    sections.push('### 前月比で大きく変動した費用科目');
    sections.push('');
    sections.push('| 科目名 | 当月 | 前月 | 変動率 |');
    sections.push('|--------|------|------|--------|');
    for (const change of comparison.changes.significantExpenseChanges.slice(0, 5)) {
      sections.push(`| ${change.accountName} | ${formatCurrency(change.currentAmount)} | ${formatCurrency(change.previousAmount)} | ${formatChangeRate(change.changeRate)} |`);
    }
    sections.push('');
  }

  // 5. 資金繰りの見立て
  sections.push('## 5. 資金繰りの見立て');
  sections.push('');
  sections.push(commentary.cashFlowComment);
  sections.push('');
  sections.push('| 指標 | 値 |');
  sections.push('|------|-----|');
  sections.push(`| 現預金残高 | ${formatCurrency(cf.currentCash)} |`);
  sections.push(`| 月次固定費 | ${formatCurrency(cf.monthlyBurnRate)} |`);
  sections.push(`| 資金繰り余力 | ${cf.cashRunwayMonths >= 999 ? '十分' : cf.cashRunwayMonths.toFixed(1) + 'か月'} |`);
  sections.push(`| リスク判定 | ${riskToJapanese(cf.shortageRisk)} |`);
  sections.push('');

  // 6. 銀行評価の見立て
  sections.push('## 6. 銀行評価の見立て');
  sections.push('');
  sections.push(commentary.bankingComment);
  sections.push('');
  sections.push('| 指標 | 値 |');
  sections.push('|------|-----|');
  sections.push(`| 自己資本比率 | ${bm.equityRatio.toFixed(1)}% |`);
  sections.push(`| 債務償還年数 | ${bm.debtRepaymentYears !== null ? bm.debtRepaymentYears.toFixed(1) + '年' : '算出不可'} |`);
  sections.push(`| 月商倍率 | ${bm.cashToMonthlyRevenue.toFixed(1)}倍 |`);
  sections.push(`| 営業利益率 | ${formatPercent(bm.operatingProfitMargin)} |`);
  sections.push(`| 総合スコア | ${bm.overallScore} |`);
  sections.push('');

  // 7. 財務指標
  sections.push('## 7. 財務指標');
  sections.push('');
  sections.push('### 収益性');
  sections.push(`- 売上総利益率: ${formatPercent(fm.profitability.grossProfitMargin)}`);
  sections.push(`- 営業利益率: ${formatPercent(fm.profitability.operatingProfitMargin)}`);
  sections.push(`- 経常利益率: ${formatPercent(fm.profitability.ordinaryProfitMargin)}`);
  sections.push(`- ROA: ${fm.profitability.roa !== null ? formatPercent(fm.profitability.roa) : '算出不可'}`);
  sections.push('');
  sections.push('### 安全性');
  sections.push(`- 流動比率: ${fm.safety.currentRatio.toFixed(1)}%`);
  sections.push(`- 自己資本比率: ${fm.safety.equityRatio.toFixed(1)}%`);
  sections.push(`- 現預金月商倍率: ${fm.safety.cashMonthsRatio.toFixed(1)}倍`);
  sections.push('');

  // 8. リスクアラート
  sections.push('## 8. リスクアラート');
  sections.push('');
  if (anomalies.length === 0) {
    sections.push('特筆すべき異常は検出されませんでした。');
  } else {
    for (const anomaly of anomalies) {
      const icon = anomaly.severity === 'critical' ? '🔴' : anomaly.severity === 'warning' ? '🟡' : '🔵';
      sections.push(`- ${icon} ${anomaly.message}`);
    }
  }
  sections.push('');

  // 9. 経営者への示唆
  sections.push('## 9. 経営者への示唆');
  sections.push('');

  if (commentary.positivePoints.length > 0) {
    sections.push('### 良い点');
    commentary.positivePoints.forEach(p => sections.push(`- ${p}`));
    sections.push('');
  }

  if (commentary.negativePoints.length > 0) {
    sections.push('### 注意すべき点');
    commentary.negativePoints.forEach(p => sections.push(`- ${p}`));
    sections.push('');
  }

  sections.push('### 次に取るべきアクション');
  commentary.actionItems.forEach(a => sections.push(`- ${a}`));
  sections.push('');

  // 補足
  if (commentary.dataLimitations.length > 0) {
    sections.push('## 10. 補足・データの制約');
    sections.push('');
    commentary.dataLimitations.forEach(l => sections.push(`- ${l}`));
    sections.push('');
  }

  // 各カテゴリ評価サマリー
  sections.push('## 評価サマリー');
  sections.push('');
  sections.push('| カテゴリ | 評価 | スコア |');
  sections.push('|----------|------|--------|');
  for (const eval_ of evaluations) {
    sections.push(`| ${categoryToJapanese(eval_.category)} | ${levelToJapanese(eval_.level)} | ${eval_.score.toFixed(0)}/100 |`);
  }
  sections.push('');
  sections.push('---');
  sections.push(`*このレポートは accounting-ai-agent v${report.meta.version} により自動生成されました。*`);

  return sections.join('\n');
}

function levelToJapanese(level: string): string {
  const map: Record<string, string> = {
    excellent: '優良',
    good: '良好',
    fair: '普通',
    warning: '注意',
    critical: '危険',
  };
  return map[level] ?? level;
}

function categoryToJapanese(category: string): string {
  const map: Record<string, string> = {
    profit: '利益',
    cash_flow: '資金繰り',
    fixed_cost: '固定費負担',
    revenue_dependency: '売上依存',
    banking: '銀行評価',
  };
  return map[category] ?? category;
}

function riskToJapanese(risk: string): string {
  const map: Record<string, string> = {
    safe: '安全',
    caution: '注意',
    warning: '警戒',
    danger: '危険',
  };
  return map[risk] ?? risk;
}
