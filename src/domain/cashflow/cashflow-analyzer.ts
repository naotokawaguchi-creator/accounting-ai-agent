import type { MonthlyPL, BalanceSheet } from '../../types/accounting.js';
import type { CashFlowAnalysis, CashShortageRisk } from '../../types/finance.js';
import { calcChangeRate } from '../../utils/format.js';

/**
 * 資金繰り分析を行う
 *
 * 現預金残高と月次固定費から資金繰り余力を算出する。
 * 将来的にはキャッシュフロー計算書ベースの分析に拡張予定。
 */
export function analyzeCashFlow(
  currentPL: MonthlyPL,
  currentBS: BalanceSheet,
  previousBS: BalanceSheet | null
): CashFlowAnalysis {
  const currentCash = currentBS.cashAndDeposits;

  // 月次固定費（販管費を近似値として使用）
  // TODO: 変動費と固定費の分離が必要。現在は販管費全額を固定費扱い
  const monthlyBurnRate = currentPL.sgaExpenses;

  // 資金繰り余力（月数）
  const cashRunwayMonths = monthlyBurnRate > 0
    ? currentCash / monthlyBurnRate
    : currentCash > 0 ? 999 : 0;

  // 前月比増減
  const cashChangeFromPrevMonth = previousBS
    ? currentCash - previousBS.cashAndDeposits
    : 0;
  const cashChangeRate = previousBS
    ? (calcChangeRate(currentCash, previousBS.cashAndDeposits) ?? 0)
    : 0;

  // リスク判定
  const shortageRisk = assessShortageRisk(cashRunwayMonths, cashChangeRate);

  return {
    currentCash,
    monthlyBurnRate,
    cashRunwayMonths,
    cashChangeFromPrevMonth,
    cashChangeRate,
    shortageRisk,
  };
}

function assessShortageRisk(runwayMonths: number, changeRate: number): CashShortageRisk {
  if (runwayMonths < 1) return 'danger';
  if (runwayMonths < 2 || changeRate <= -0.3) return 'warning';
  if (runwayMonths < 3 || changeRate <= -0.15) return 'caution';
  return 'safe';
}
