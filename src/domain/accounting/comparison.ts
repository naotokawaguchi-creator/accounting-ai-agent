import type { MonthlyPL, MonthlyComparison, MonthlyChanges, ExpenseChange } from '../../types/accounting.js';
import { calcChangeRate } from '../../utils/format.js';

/**
 * 月次比較データを生成する
 */
export function createMonthlyComparison(current: MonthlyPL, previous: MonthlyPL | null): MonthlyComparison {
  if (!previous) {
    return { current, previous: null, changes: null };
  }

  const changes: MonthlyChanges = {
    revenueChange: current.revenue - previous.revenue,
    revenueChangeRate: calcChangeRate(current.revenue, previous.revenue) ?? 0,
    grossProfitChange: current.grossProfit - previous.grossProfit,
    grossProfitChangeRate: calcChangeRate(current.grossProfit, previous.grossProfit) ?? 0,
    operatingIncomeChange: current.operatingIncome - previous.operatingIncome,
    operatingIncomeChangeRate: calcChangeRate(current.operatingIncome, previous.operatingIncome) ?? 0,
    ordinaryIncomeChange: current.ordinaryIncome - previous.ordinaryIncome,
    ordinaryIncomeChangeRate: calcChangeRate(current.ordinaryIncome, previous.ordinaryIncome) ?? 0,
    significantExpenseChanges: findSignificantExpenseChanges(current, previous),
  };

  return { current, previous, changes };
}

/**
 * 前月比で大きく変動した費用科目を検出
 */
function findSignificantExpenseChanges(current: MonthlyPL, previous: MonthlyPL): ExpenseChange[] {
  const changes: ExpenseChange[] = [];
  const THRESHOLD = 0.3; // 30%以上の変動

  for (const currentItem of current.expenseBreakdown) {
    const prevItem = previous.expenseBreakdown.find(
      (p) => p.accountName === currentItem.accountName
    );
    const previousAmount = prevItem?.amount ?? 0;

    if (previousAmount === 0 && currentItem.amount === 0) continue;

    const changeAmount = currentItem.amount - previousAmount;
    const changeRate = calcChangeRate(currentItem.amount, previousAmount);

    if (changeRate !== null && Math.abs(changeRate) >= THRESHOLD) {
      changes.push({
        accountName: currentItem.accountName,
        currentAmount: currentItem.amount,
        previousAmount,
        changeAmount,
        changeRate,
      });
    }
  }

  return changes.sort((a, b) => Math.abs(b.changeAmount) - Math.abs(a.changeAmount));
}
