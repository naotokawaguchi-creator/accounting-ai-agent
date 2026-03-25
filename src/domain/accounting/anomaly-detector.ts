import type { MonthlyPL, BalanceSheet, AnomalyDetection } from '../../types/accounting.js';
import { thresholds } from '../../config/index.js';
import { formatCurrency, formatChangeRate, calcChangeRate } from '../../utils/format.js';

/**
 * 異常検知を実行する
 *
 * 前月比や絶対値ベースで、経営上注意すべき変動を検出する。
 */
export function detectAnomalies(
  currentPL: MonthlyPL,
  previousPL: MonthlyPL | null,
  currentBS: BalanceSheet,
  previousBS: BalanceSheet | null
): AnomalyDetection[] {
  const anomalies: AnomalyDetection[] = [];

  if (previousPL) {
    // 売上急減
    const revenueChangeRate = calcChangeRate(currentPL.revenue, previousPL.revenue);
    if (revenueChangeRate !== null && revenueChangeRate <= thresholds.revenueDropRate) {
      anomalies.push({
        type: 'revenue_drop',
        severity: revenueChangeRate <= -0.4 ? 'critical' : 'warning',
        accountName: null,
        currentValue: currentPL.revenue,
        previousValue: previousPL.revenue,
        changeRate: revenueChangeRate,
        message: `売上高が前月比${formatChangeRate(revenueChangeRate)}（${formatCurrency(currentPL.revenue)}）と大幅に減少しています。`,
      });
    }

    // 単月赤字転落
    if (currentPL.ordinaryIncome < 0 && previousPL.ordinaryIncome >= 0) {
      anomalies.push({
        type: 'loss_turnaround',
        severity: 'critical',
        accountName: null,
        currentValue: currentPL.ordinaryIncome,
        previousValue: previousPL.ordinaryIncome,
        changeRate: null,
        message: `経常利益が${formatCurrency(currentPL.ordinaryIncome)}と赤字に転落しました。前月は${formatCurrency(previousPL.ordinaryIncome)}でした。`,
      });
    }

    // 費用科目の急増
    for (const currentItem of currentPL.expenseBreakdown) {
      const prevItem = previousPL.expenseBreakdown.find(
        (p) => p.accountName === currentItem.accountName
      );
      if (!prevItem || prevItem.amount === 0) continue;

      const changeRate = calcChangeRate(currentItem.amount, prevItem.amount);
      if (changeRate !== null && changeRate >= thresholds.expenseChangeRate) {
        anomalies.push({
          type: 'expense_surge',
          severity: changeRate >= 0.5 ? 'warning' : 'info',
          accountName: currentItem.accountName,
          currentValue: currentItem.amount,
          previousValue: prevItem.amount,
          changeRate,
          message: `「${currentItem.accountName}」が前月比${formatChangeRate(changeRate)}（${formatCurrency(currentItem.amount)}）と増加しています。`,
        });
      }
    }
  }

  // 現預金の減少
  if (previousBS) {
    const cashChangeRate = calcChangeRate(currentBS.cashAndDeposits, previousBS.cashAndDeposits);
    if (cashChangeRate !== null && cashChangeRate <= thresholds.cashDeclineRate) {
      anomalies.push({
        type: 'cash_decline',
        severity: cashChangeRate <= -0.3 ? 'critical' : 'warning',
        accountName: null,
        currentValue: currentBS.cashAndDeposits,
        previousValue: previousBS.cashAndDeposits,
        changeRate: cashChangeRate,
        message: `現預金が前月比${formatChangeRate(cashChangeRate)}（${formatCurrency(currentBS.cashAndDeposits)}）と減少しています。`,
      });
    }
  }

  // 固定費過大（売上に対する販管費比率）
  if (currentPL.revenue > 0) {
    const fixedCostRatio = currentPL.sgaExpenses / currentPL.revenue;
    if (fixedCostRatio >= thresholds.fixedCostRatio) {
      anomalies.push({
        type: 'fixed_cost_overload',
        severity: fixedCostRatio >= 0.9 ? 'critical' : 'warning',
        accountName: null,
        currentValue: fixedCostRatio,
        previousValue: null,
        changeRate: null,
        message: `販売管理費率が${(fixedCostRatio * 100).toFixed(1)}%と高い水準です。売上に対する固定費負担が重くなっています。`,
      });
    }
  }

  // 費用科目への集中リスク
  const totalExpenses = currentPL.expenseBreakdown.reduce((sum, item) => sum + Math.abs(item.amount), 0);
  if (totalExpenses > 0) {
    for (const item of currentPL.expenseBreakdown) {
      const ratio = Math.abs(item.amount) / totalExpenses;
      if (ratio >= thresholds.concentrationRatio) {
        anomalies.push({
          type: 'concentration_risk',
          severity: 'info',
          accountName: item.accountName,
          currentValue: item.amount,
          previousValue: null,
          changeRate: ratio,
          message: `「${item.accountName}」が費用全体の${(ratio * 100).toFixed(1)}%を占めています。`,
        });
      }
    }
  }

  // 重要度順にソート
  const severityOrder = { critical: 0, warning: 1, info: 2 };
  return anomalies.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}
