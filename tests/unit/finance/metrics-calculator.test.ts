import { describe, it, expect } from 'vitest';
import { calculateFinancialMetrics } from '../../../src/domain/finance/metrics-calculator.js';
import type { MonthlyPL } from '../../../src/types/accounting.js';
import type { BalanceSheet } from '../../../src/types/accounting.js';

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
    expenseBreakdown: [],
    ...overrides,
  };
}

function makeBS(overrides: Partial<BalanceSheet> = {}): BalanceSheet {
  return {
    year: 2026,
    month: 2,
    currentAssets: 18_950_000,
    fixedAssets: 6_800_000,
    totalAssets: 25_750_000,
    currentLiabilities: 6_850_000,
    fixedLiabilities: 8_000_000,
    totalLiabilities: 14_850_000,
    netAssets: 10_900_000,
    cashAndDeposits: 13_150_000,
    totalLiabilitiesAndNetAssets: 25_750_000,
    ...overrides,
  };
}

describe('calculateFinancialMetrics', () => {
  describe('profitability metrics', () => {
    it('should calculate grossProfitMargin correctly', () => {
      const pl = makePL();
      const bs = makeBS();
      const metrics = calculateFinancialMetrics(pl, bs);

      // grossProfitMargin = grossProfit / revenue = 5_700_000 / 8_500_000
      expect(metrics.profitability.grossProfitMargin).toBeCloseTo(5_700_000 / 8_500_000, 5);
    });

    it('should calculate operatingProfitMargin correctly', () => {
      const pl = makePL();
      const bs = makeBS();
      const metrics = calculateFinancialMetrics(pl, bs);

      // operatingProfitMargin = operatingIncome / revenue = 1_390_000 / 8_500_000
      expect(metrics.profitability.operatingProfitMargin).toBeCloseTo(1_390_000 / 8_500_000, 5);
    });

    it('should calculate ordinaryProfitMargin correctly', () => {
      const pl = makePL();
      const bs = makeBS();
      const metrics = calculateFinancialMetrics(pl, bs);

      // ordinaryProfitMargin = ordinaryIncome / revenue = 1_320_000 / 8_500_000
      expect(metrics.profitability.ordinaryProfitMargin).toBeCloseTo(1_320_000 / 8_500_000, 5);
    });

    it('should calculate ROA as annualized ordinaryIncome / totalAssets', () => {
      const pl = makePL();
      const bs = makeBS();
      const metrics = calculateFinancialMetrics(pl, bs);

      // roa = (ordinaryIncome * 12) / totalAssets = (1_320_000 * 12) / 25_750_000
      expect(metrics.profitability.roa).toBeCloseTo((1_320_000 * 12) / 25_750_000, 5);
    });

    it('should return 0 margins when revenue is zero', () => {
      const pl = makePL({
        revenue: 0,
        grossProfit: 0,
        operatingIncome: 0,
        ordinaryIncome: 0,
      });
      const bs = makeBS();
      const metrics = calculateFinancialMetrics(pl, bs);

      expect(metrics.profitability.grossProfitMargin).toBe(0);
      expect(metrics.profitability.operatingProfitMargin).toBe(0);
      expect(metrics.profitability.ordinaryProfitMargin).toBe(0);
    });
  });

  describe('safety metrics', () => {
    it('should calculate currentRatio as percentage', () => {
      const pl = makePL();
      const bs = makeBS();
      const metrics = calculateFinancialMetrics(pl, bs);

      // currentRatio = (currentAssets / currentLiabilities) * 100
      // = (18_950_000 / 6_850_000) * 100
      expect(metrics.safety.currentRatio).toBeCloseTo((18_950_000 / 6_850_000) * 100, 1);
    });

    it('should calculate equityRatio as percentage', () => {
      const pl = makePL();
      const bs = makeBS();
      const metrics = calculateFinancialMetrics(pl, bs);

      // equityRatio = (netAssets / totalAssets) * 100
      // = (10_900_000 / 25_750_000) * 100
      expect(metrics.safety.equityRatio).toBeCloseTo((10_900_000 / 25_750_000) * 100, 1);
    });

    it('should calculate cashMonthsRatio correctly', () => {
      const pl = makePL();
      const bs = makeBS();
      const metrics = calculateFinancialMetrics(pl, bs);

      // cashMonthsRatio = cashAndDeposits / revenue = 13_150_000 / 8_500_000
      expect(metrics.safety.cashMonthsRatio).toBeCloseTo(13_150_000 / 8_500_000, 3);
    });

    it('should calculate debtRepaymentYears correctly', () => {
      const pl = makePL();
      const bs = makeBS();
      const metrics = calculateFinancialMetrics(pl, bs);

      // debtRepaymentYears = totalLiabilities / (operatingIncome * 12)
      // = 14_850_000 / (1_390_000 * 12)
      expect(metrics.safety.debtRepaymentYears).toBeCloseTo(14_850_000 / (1_390_000 * 12), 3);
    });

    it('should return null debtRepaymentYears when operatingIncome is zero', () => {
      const pl = makePL({ operatingIncome: 0 });
      const bs = makeBS();
      const metrics = calculateFinancialMetrics(pl, bs);

      expect(metrics.safety.debtRepaymentYears).toBeNull();
    });

    it('should return null debtRepaymentYears when operatingIncome is negative', () => {
      const pl = makePL({ operatingIncome: -100_000 });
      const bs = makeBS();
      const metrics = calculateFinancialMetrics(pl, bs);

      expect(metrics.safety.debtRepaymentYears).toBeNull();
    });

    it('should return 0 for currentRatio when currentLiabilities is zero', () => {
      const pl = makePL();
      const bs = makeBS({ currentLiabilities: 0 });
      const metrics = calculateFinancialMetrics(pl, bs);

      expect(metrics.safety.currentRatio).toBe(0);
    });

    it('should return 0 for equityRatio when totalAssets is zero', () => {
      const pl = makePL();
      const bs = makeBS({ totalAssets: 0 });
      const metrics = calculateFinancialMetrics(pl, bs);

      expect(metrics.safety.equityRatio).toBe(0);
    });

    it('should return 0 cashMonthsRatio when revenue is zero', () => {
      const pl = makePL({ revenue: 0 });
      const bs = makeBS();
      const metrics = calculateFinancialMetrics(pl, bs);

      expect(metrics.safety.cashMonthsRatio).toBe(0);
    });
  });
});
