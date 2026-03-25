// 財務指標型定義

/** 財務指標 */
export interface FinancialMetrics {
  // 収益性
  profitability: ProfitabilityMetrics;
  // 安全性
  safety: SafetyMetrics;
  // 効率性（将来拡張）
  efficiency?: EfficiencyMetrics;
}

/** 収益性指標 */
export interface ProfitabilityMetrics {
  grossProfitMargin: number;       // 売上総利益率
  operatingProfitMargin: number;   // 営業利益率
  ordinaryProfitMargin: number;    // 経常利益率
  roa: number | null;              // ROA（総資産利益率）
}

/** 安全性指標 */
export interface SafetyMetrics {
  currentRatio: number;            // 流動比率
  equityRatio: number;             // 自己資本比率
  cashMonthsRatio: number;         // 現預金月商倍率
  debtRepaymentYears: number | null; // 債務償還年数
}

/** 効率性指標（将来拡張） */
export interface EfficiencyMetrics {
  totalAssetTurnover?: number;     // 総資産回転率
  receivableTurnover?: number;     // 売上債権回転率
}

/** 資金繰り分析 */
export interface CashFlowAnalysis {
  currentCash: number;              // 現預金残高
  monthlyBurnRate: number;          // 月次固定費
  cashRunwayMonths: number;         // 資金繰り余力（月数）
  cashChangeFromPrevMonth: number;  // 前月比増減
  cashChangeRate: number;           // 前月比増減率
  shortageRisk: CashShortageRisk;
}

export type CashShortageRisk = 'safe' | 'caution' | 'warning' | 'danger';

/** 銀行評価指標 */
export interface BankingMetrics {
  equityRatio: number;
  debtRepaymentYears: number | null;
  cashToMonthlyRevenue: number;
  operatingProfitMargin: number;
  overallScore: BankingScore;
}

export type BankingScore = 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
