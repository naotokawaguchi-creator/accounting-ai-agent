/**
 * 銀行格付スコアリング（129点満点）型定義
 */

/** 個別指標の評価結果 */
export interface RatingMetric {
  id: string;
  name: string;
  category: RatingCategory;
  value: number | null;
  unit: string;
  score: number;
  maxScore: number;
  comment: string;
  level: MetricLevel;
}

export type RatingCategory = 'stability' | 'profitability' | 'growth' | 'repayment';
export type MetricLevel = 'excellent' | 'good' | 'fair' | 'warning' | 'danger';

/** 格付ランク */
export type RatingRank = 'A' | 'B' | 'C' | 'D' | 'E';

/** 銀行格付の全体結果 */
export interface BankRatingResult {
  totalScore: number;
  maxScore: 129;
  rank: RatingRank;
  rankLabel: string;
  metrics: RatingMetric[];

  // カテゴリ別スコア
  stabilityScore: number;
  stabilityMax: number;
  profitabilityScore: number;
  profitabilityMax: number;
  growthScore: number;
  growthMax: number;
  repaymentScore: number;
  repaymentMax: number;

  // 銀行視点の見解
  positives: string[];
  negatives: string[];
  cautions: string[];

  // 改善アクション
  actions: ImprovementAction[];

  // 経営者向け要約
  executiveSummary: string[];

  // 深掘り質問
  deepDiveQuestions: string[];
}

/** 改善アクション */
export interface ImprovementAction {
  priority: 'high' | 'medium' | 'low';
  content: string;
  effect: string;
  timeframe: string;
}

/** 追加指標（格付点数に含めない） */
export interface AdditionalMetrics {
  totalAssetTurnover: number | null;
  totalAssetTurnoverComment: string;
  simpleCashFlow: number | null;
  simpleCashFlowComment: string;
  simpleCashFlowNote: string;
}

/** 格付計算に必要な入力データ */
export interface RatingInput {
  // BS
  totalAssets: number;
  currentAssets: number;
  fixedAssets: number;
  currentLiabilities: number;
  fixedLiabilities: number;
  netAssets: number;
  interestBearingDebt: number;   // 有利子負債
  cashAndDeposits: number;

  // PL
  revenue: number;
  operatingIncome: number;
  ordinaryIncome: number;
  netIncome: number;
  interestExpense: number;       // 支払利息
  interestIncome: number;        // 受取利息等
  depreciation: number;          // 減価償却費

  // 前期データ
  prevOrdinaryIncome: number | null;
  prevTotalAssets: number | null;

  // 返済データ（任意）
  annualDebtRepayment: number | null; // 年間返済元本

  // 収益フロー（3期分の経常利益符号）
  profitFlowHistory: ('positive' | 'negative' | 'zero')[];
}
