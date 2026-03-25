import { describe, it, expect } from 'vitest';
import { evaluateProfit } from '../../../src/evaluators/profit-evaluator.js';
import { evaluateCashFlow } from '../../../src/evaluators/cashflow-evaluator.js';
import { runAllEvaluations } from '../../../src/evaluators/index.js';
import type { MonthlyPL } from '../../../src/types/accounting.js';
import type { FinancialMetrics, CashFlowAnalysis, BankingMetrics } from '../../../src/types/finance.js';

function makePL(overrides: Partial<MonthlyPL> = {}): MonthlyPL {
  return {
    year: 2026,
    month: 2,
    revenue: 8_500_000,
    costOfSales: 2_800_000,
    grossProfit: 5_700_000,
    sgaExpenses: 4_310_000,
    operatingIncome: 1_390_000,
    nonOperatingIncome: 15_000,
    nonOperatingExpenses: 85_000,
    ordinaryIncome: 1_320_000,
    extraordinaryIncome: 0,
    extraordinaryLoss: 0,
    netIncome: 1_320_000,
    expenseBreakdown: [
      { accountId: 1, accountName: '給与手当', categoryName: '販売費及び一般管理費', amount: 2_500_000 },
    ],
    ...overrides,
  };
}

function makeMetrics(overrides: Partial<FinancialMetrics> = {}): FinancialMetrics {
  return {
    profitability: {
      grossProfitMargin: 0.67,
      operatingProfitMargin: 0.16,
      ordinaryProfitMargin: 0.155,
      roa: 0.06,
      ...overrides.profitability,
    },
    safety: {
      currentRatio: 276.6,
      equityRatio: 42.3,
      cashMonthsRatio: 1.55,
      debtRepaymentYears: 0.89,
      ...overrides.safety,
    },
    ...overrides,
  };
}

function makeCashFlow(overrides: Partial<CashFlowAnalysis> = {}): CashFlowAnalysis {
  return {
    currentCash: 13_150_000,
    monthlyBurnRate: 4_310_000,
    cashRunwayMonths: 3.05,
    cashChangeFromPrevMonth: 730_000,
    cashChangeRate: 0.059,
    shortageRisk: 'safe',
    ...overrides,
  };
}

function makeBankingMetrics(overrides: Partial<BankingMetrics> = {}): BankingMetrics {
  return {
    equityRatio: 42.3,
    debtRepaymentYears: 0.89,
    cashToMonthlyRevenue: 1.55,
    operatingProfitMargin: 0.16,
    overallScore: 'good',
    ...overrides,
  };
}

describe('evaluateProfit', () => {
  it('should return excellent level for high profit margin (>= 10%)', () => {
    const pl = makePL({ ordinaryIncome: 1_000_000, revenue: 5_000_000 }); // 20% margin
    const metrics = makeMetrics({
      profitability: {
        grossProfitMargin: 0.7,
        operatingProfitMargin: 0.25,
        ordinaryProfitMargin: 0.20,
        roa: 0.1,
      },
    });

    const result = evaluateProfit(pl, metrics);
    expect(result.level).toBe('excellent');
    expect(result.category).toBe('profit');
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('should return good level for profit margin >= 5%', () => {
    const pl = makePL();
    const metrics = makeMetrics({
      profitability: {
        grossProfitMargin: 0.5,
        operatingProfitMargin: 0.08,
        ordinaryProfitMargin: 0.07,
        roa: 0.04,
      },
    });

    const result = evaluateProfit(pl, metrics);
    expect(result.level).toBe('good');
  });

  it('should return fair level for profit margin >= 2%', () => {
    const pl = makePL();
    const metrics = makeMetrics({
      profitability: {
        grossProfitMargin: 0.3,
        operatingProfitMargin: 0.04,
        ordinaryProfitMargin: 0.03,
        roa: 0.02,
      },
    });

    const result = evaluateProfit(pl, metrics);
    expect(result.level).toBe('fair');
  });

  it('should return warning level for profit margin >= 0%', () => {
    const pl = makePL();
    const metrics = makeMetrics({
      profitability: {
        grossProfitMargin: 0.2,
        operatingProfitMargin: 0.01,
        ordinaryProfitMargin: 0.005,
        roa: 0.003,
      },
    });

    const result = evaluateProfit(pl, metrics);
    expect(result.level).toBe('warning');
  });

  it('should return critical level for negative profit margin', () => {
    const pl = makePL({ ordinaryIncome: -500_000 });
    const metrics = makeMetrics({
      profitability: {
        grossProfitMargin: 0.1,
        operatingProfitMargin: -0.02,
        ordinaryProfitMargin: -0.05,
        roa: -0.02,
      },
    });

    const result = evaluateProfit(pl, metrics);
    expect(result.level).toBe('critical');
  });

  it('should include summary and details strings', () => {
    const pl = makePL();
    const metrics = makeMetrics();

    const result = evaluateProfit(pl, metrics);

    expect(result.summary).toBeTruthy();
    expect(result.details).toBeTruthy();
    expect(result.details).toContain('売上高');
    expect(result.details).toContain('経常利益');
  });

  it('should clamp score between 0 and 100', () => {
    const pl = makePL();
    // Very high margin
    const highMetrics = makeMetrics({
      profitability: {
        grossProfitMargin: 0.9,
        operatingProfitMargin: 0.5,
        ordinaryProfitMargin: 0.5,
        roa: 0.3,
      },
    });
    const resultHigh = evaluateProfit(pl, highMetrics);
    expect(resultHigh.score).toBeLessThanOrEqual(100);

    // Very negative margin
    const lowMetrics = makeMetrics({
      profitability: {
        grossProfitMargin: 0.1,
        operatingProfitMargin: -0.5,
        ordinaryProfitMargin: -0.5,
        roa: -0.3,
      },
    });
    const resultLow = evaluateProfit(pl, lowMetrics);
    expect(resultLow.score).toBeGreaterThanOrEqual(0);
  });
});

describe('evaluateCashFlow', () => {
  it('should return excellent for >= 6 months runway', () => {
    const cf = makeCashFlow({ cashRunwayMonths: 8, shortageRisk: 'safe' });
    const result = evaluateCashFlow(cf);

    expect(result.level).toBe('excellent');
    expect(result.category).toBe('cash_flow');
  });

  it('should return good for >= 3 months runway', () => {
    const cf = makeCashFlow({ cashRunwayMonths: 4, shortageRisk: 'safe' });
    const result = evaluateCashFlow(cf);

    expect(result.level).toBe('good');
  });

  it('should return fair for >= 2 months runway', () => {
    const cf = makeCashFlow({ cashRunwayMonths: 2.5, shortageRisk: 'safe' });
    const result = evaluateCashFlow(cf);

    expect(result.level).toBe('fair');
  });

  it('should return warning for >= 1 month runway', () => {
    const cf = makeCashFlow({ cashRunwayMonths: 1.5, shortageRisk: 'caution' });
    const result = evaluateCashFlow(cf);

    expect(result.level).toBe('warning');
  });

  it('should return critical for < 1 month runway', () => {
    const cf = makeCashFlow({ cashRunwayMonths: 0.5, shortageRisk: 'danger' });
    const result = evaluateCashFlow(cf);

    expect(result.level).toBe('critical');
  });

  it('should override to critical when shortageRisk is danger', () => {
    const cf = makeCashFlow({ cashRunwayMonths: 5, shortageRisk: 'danger' });
    const result = evaluateCashFlow(cf);

    expect(result.level).toBe('critical');
  });

  it('should override to warning when shortageRisk is warning', () => {
    const cf = makeCashFlow({ cashRunwayMonths: 8, shortageRisk: 'warning' });
    const result = evaluateCashFlow(cf);

    expect(result.level).toBe('warning');
  });

  it('should include summary and details', () => {
    const cf = makeCashFlow();
    const result = evaluateCashFlow(cf);

    expect(result.summary).toBeTruthy();
    expect(result.details).toContain('現預金残高');
    expect(result.details).toContain('月次固定費');
  });
});

describe('runAllEvaluations', () => {
  it('should return exactly 5 evaluations', () => {
    const input = {
      currentPL: makePL(),
      previousPL: makePL({ month: 1 }),
      financialMetrics: makeMetrics(),
      cashFlowAnalysis: makeCashFlow(),
      bankingMetrics: makeBankingMetrics(),
    };

    const results = runAllEvaluations(input);

    expect(results).toHaveLength(5);
  });

  it('should include all evaluation categories', () => {
    const input = {
      currentPL: makePL(),
      previousPL: makePL({ month: 1 }),
      financialMetrics: makeMetrics(),
      cashFlowAnalysis: makeCashFlow(),
      bankingMetrics: makeBankingMetrics(),
    };

    const results = runAllEvaluations(input);
    const categories = results.map((r) => r.category);

    expect(categories).toContain('profit');
    expect(categories).toContain('cash_flow');
    expect(categories).toContain('fixed_cost');
    expect(categories).toContain('revenue_dependency');
    expect(categories).toContain('banking');
  });

  it('should return valid scores for all evaluations', () => {
    const input = {
      currentPL: makePL(),
      previousPL: makePL({ month: 1 }),
      financialMetrics: makeMetrics(),
      cashFlowAnalysis: makeCashFlow(),
      bankingMetrics: makeBankingMetrics(),
    };

    const results = runAllEvaluations(input);

    for (const result of results) {
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.summary).toBeTruthy();
      expect(result.details).toBeTruthy();
      expect(['excellent', 'good', 'fair', 'warning', 'critical']).toContain(result.level);
    }
  });

  it('should handle null previousPL', () => {
    const input = {
      currentPL: makePL(),
      previousPL: null,
      financialMetrics: makeMetrics(),
      cashFlowAnalysis: makeCashFlow(),
      bankingMetrics: makeBankingMetrics(),
    };

    const results = runAllEvaluations(input);
    expect(results).toHaveLength(5);

    // revenue_dependency should still work with null previous
    const revDep = results.find((r) => r.category === 'revenue_dependency');
    expect(revDep).toBeDefined();
    expect(revDep!.level).toBe('fair'); // no previous data -> fair
  });
});
