import type { MonthlyPL, BalanceSheet } from '../../types/accounting.js';
import type { FinancialMetrics, ProfitabilityMetrics, SafetyMetrics } from '../../types/finance.js';
import { safeDivide } from '../../utils/format.js';

/**
 * 財務指標を計算する
 *
 * PLとBSから各種財務指標を算出する。
 * 個別指標の計算は独立した関数に分離し、後から追加しやすくしている。
 */
export function calculateFinancialMetrics(pl: MonthlyPL, bs: BalanceSheet): FinancialMetrics {
  return {
    profitability: calculateProfitability(pl, bs),
    safety: calculateSafety(pl, bs),
  };
}

/** 収益性指標 */
function calculateProfitability(pl: MonthlyPL, bs: BalanceSheet): ProfitabilityMetrics {
  return {
    grossProfitMargin: safeDivide(pl.grossProfit, pl.revenue) ?? 0,
    operatingProfitMargin: safeDivide(pl.operatingIncome, pl.revenue) ?? 0,
    ordinaryProfitMargin: safeDivide(pl.ordinaryIncome, pl.revenue) ?? 0,
    roa: safeDivide(pl.ordinaryIncome * 12, bs.totalAssets),  // 年換算
  };
}

/** 安全性指標 */
function calculateSafety(pl: MonthlyPL, bs: BalanceSheet): SafetyMetrics {
  const monthlyRevenue = pl.revenue;
  const cashMonthsRatio = monthlyRevenue > 0
    ? bs.cashAndDeposits / monthlyRevenue
    : 0;

  // 債務償還年数 = 有利子負債 / 営業利益（年換算）
  // TODO: 有利子負債の正確な算出にはBS明細が必要。暫定的に総負債を使用
  const annualOperatingIncome = pl.operatingIncome * 12;
  const debtRepaymentYears = annualOperatingIncome > 0
    ? safeDivide(bs.totalLiabilities, annualOperatingIncome)
    : null;

  return {
    currentRatio: safeDivide(bs.currentAssets, bs.currentLiabilities) ?
      (bs.currentAssets / bs.currentLiabilities) * 100 : 0,
    equityRatio: safeDivide(bs.netAssets, bs.totalAssets) ?
      (bs.netAssets / bs.totalAssets) * 100 : 0,
    cashMonthsRatio,
    debtRepaymentYears,
  };
}
