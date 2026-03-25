// レポート型定義

import type { MonthlyPL, BalanceSheet, MonthlyComparison, AnomalyDetection } from './accounting.js';
import type { FinancialMetrics, CashFlowAnalysis, BankingMetrics } from './finance.js';

/** 評価結果 */
export type EvaluationLevel = 'excellent' | 'good' | 'fair' | 'warning' | 'critical';

/** 評価項目 */
export interface Evaluation {
  category: EvaluationCategory;
  level: EvaluationLevel;
  score: number;        // 0-100
  summary: string;
  details: string;
}

export type EvaluationCategory =
  | 'profit'          // 利益
  | 'cash_flow'       // 資金繰り
  | 'fixed_cost'      // 固定費負担
  | 'revenue_dependency' // 売上依存
  | 'banking';        // 銀行評価

/** 経営コメント */
export interface ManagementCommentary {
  executiveSummary: string;
  profitComment: string;
  cashFlowComment: string;
  fixedCostComment: string;
  revenueDependencyComment: string;
  bankingComment: string;
  positivePoints: string[];
  negativePoints: string[];
  actionItems: string[];
  dataLimitations: string[];
}

/** 完全レポート */
export interface FullReport {
  meta: ReportMeta;
  executiveSummary: ExecutiveSummary;
  monthlyPL: MonthlyPL;
  balanceSheet: BalanceSheet;
  comparison: MonthlyComparison;
  financialMetrics: FinancialMetrics;
  cashFlowAnalysis: CashFlowAnalysis;
  bankingMetrics: BankingMetrics;
  evaluations: Evaluation[];
  anomalies: AnomalyDetection[];
  commentary: ManagementCommentary;
}

/** レポートメタ情報 */
export interface ReportMeta {
  companyId: number;
  companyName: string;
  reportMonth: string;    // YYYY-MM
  generatedAt: string;    // ISO8601
  version: string;
}

/** 経営サマリー */
export interface ExecutiveSummary {
  monthlyRevenue: number;
  monthlyExpenses: number;
  monthlyProfit: number;
  cashBalance: number;
  revenueChangeRate: number | null;
  profitChangeRate: number | null;
  overallAssessment: EvaluationLevel;
  keyMessage: string;
}
