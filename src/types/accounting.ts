// 内部会計ドメイン型定義

/** 月次PL（損益計算書）データ */
export interface MonthlyPL {
  year: number;
  month: number;
  revenue: number;           // 売上高
  costOfSales: number;       // 売上原価
  grossProfit: number;       // 売上総利益
  sgaExpenses: number;       // 販売管理費
  operatingIncome: number;   // 営業利益
  nonOperatingIncome: number;  // 営業外収益
  nonOperatingExpenses: number; // 営業外費用
  ordinaryIncome: number;    // 経常利益
  extraordinaryIncome: number; // 特別利益
  extraordinaryLoss: number;   // 特別損失
  netIncome: number;         // 当期純利益
  expenseBreakdown: ExpenseItem[]; // 費用科目内訳
}

/** 費用科目 */
export interface ExpenseItem {
  accountId: number;
  accountName: string;
  categoryName: string;
  amount: number;
}

/** 貸借対照表データ */
export interface BalanceSheet {
  year: number;
  month: number;
  currentAssets: number;     // 流動資産
  fixedAssets: number;       // 固定資産
  totalAssets: number;       // 資産合計
  currentLiabilities: number;  // 流動負債
  fixedLiabilities: number;    // 固定負債
  totalLiabilities: number;    // 負債合計
  netAssets: number;           // 純資産
  cashAndDeposits: number;     // 現金預金
  totalLiabilitiesAndNetAssets: number; // 負債純資産合計
}

/** 月次比較データ */
export interface MonthlyComparison {
  current: MonthlyPL;
  previous: MonthlyPL | null;
  changes: MonthlyChanges | null;
}

/** 月次変動 */
export interface MonthlyChanges {
  revenueChange: number;
  revenueChangeRate: number;
  grossProfitChange: number;
  grossProfitChangeRate: number;
  operatingIncomeChange: number;
  operatingIncomeChangeRate: number;
  ordinaryIncomeChange: number;
  ordinaryIncomeChangeRate: number;
  significantExpenseChanges: ExpenseChange[];
}

/** 費用変動 */
export interface ExpenseChange {
  accountName: string;
  currentAmount: number;
  previousAmount: number;
  changeAmount: number;
  changeRate: number;
}

/** 異常検知結果 */
export interface AnomalyDetection {
  type: AnomalyType;
  severity: 'critical' | 'warning' | 'info';
  accountName: string | null;
  currentValue: number;
  previousValue: number | null;
  changeRate: number | null;
  message: string;
}

export type AnomalyType =
  | 'expense_surge'        // 費用急増
  | 'revenue_drop'         // 売上急減
  | 'cash_decline'         // 現預金減少
  | 'loss_turnaround'      // 赤字転落
  | 'fixed_cost_overload'  // 固定費過大
  | 'concentration_risk'   // 科目偏り
  | 'debt_dependency';     // 借入依存

/** 月次集計データ（3か月推移用） */
export interface MonthlyTrend {
  months: MonthlyPL[];
  balanceSheets: BalanceSheet[];
}
