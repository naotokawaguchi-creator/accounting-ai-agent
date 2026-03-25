/** 月次推移データ（ダッシュボード用） */
export interface MonthlySnapshot {
  year: number;
  month: number;
  revenue: number;
  costOfSales: number;
  grossProfit: number;
  sgaExpenses: number;
  operatingIncome: number;
  ordinaryIncome: number;
  cashAndDeposits: number;
  currentAssets: number;
  currentLiabilities: number;
  totalAssets: number;
  netAssets: number;
}

/** 月次目標データ */
export interface MonthlyTarget {
  year: number;
  month: number;
  revenue: number;
  grossProfit: number;
  ordinaryIncome: number;
}

export interface TrendData {
  months: MonthlySnapshot[];
  targets: MonthlyTarget[];
}
