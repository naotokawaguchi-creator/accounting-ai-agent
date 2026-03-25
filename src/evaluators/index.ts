import type { MonthlyPL } from '../types/accounting.js';
import type { FinancialMetrics, CashFlowAnalysis, BankingMetrics } from '../types/finance.js';
import type { Evaluation } from '../types/report.js';
import { evaluateProfit } from './profit-evaluator.js';
import { evaluateCashFlow } from './cashflow-evaluator.js';
import { evaluateFixedCost } from './fixed-cost-evaluator.js';
import { evaluateRevenueDependency } from './revenue-evaluator.js';
import { evaluateBanking } from './banking-evaluator.js';

export interface EvaluationInput {
  currentPL: MonthlyPL;
  previousPL: MonthlyPL | null;
  financialMetrics: FinancialMetrics;
  cashFlowAnalysis: CashFlowAnalysis;
  bankingMetrics: BankingMetrics;
}

/**
 * 全評価カテゴリの評価を実行する
 */
export function runAllEvaluations(input: EvaluationInput): Evaluation[] {
  return [
    evaluateProfit(input.currentPL, input.financialMetrics),
    evaluateCashFlow(input.cashFlowAnalysis),
    evaluateFixedCost(input.currentPL),
    evaluateRevenueDependency(input.currentPL, input.previousPL),
    evaluateBanking(input.bankingMetrics),
  ];
}

export { evaluateProfit } from './profit-evaluator.js';
export { evaluateCashFlow } from './cashflow-evaluator.js';
export { evaluateFixedCost } from './fixed-cost-evaluator.js';
export { evaluateRevenueDependency } from './revenue-evaluator.js';
export { evaluateBanking } from './banking-evaluator.js';
