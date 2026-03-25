import { describe, it, expect } from 'vitest';
import { detectAnomalies } from '../../../src/domain/accounting/anomaly-detector.js';
import type { MonthlyPL, BalanceSheet } from '../../../src/types/accounting.js';

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
      { accountId: 2, accountName: '地代家賃', categoryName: '販売費及び一般管理費', amount: 350_000 },
    ],
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

describe('detectAnomalies', () => {
  describe('revenue_drop detection', () => {
    it('should detect revenue drop exceeding 20% threshold', () => {
      const currentPL = makePL({ revenue: 6_000_000 });
      const previousPL = makePL({ month: 1, revenue: 8_000_000 }); // -25%
      const currentBS = makeBS();
      const previousBS = makeBS({ month: 1 });

      const anomalies = detectAnomalies(currentPL, previousPL, currentBS, previousBS);

      const revenueDrop = anomalies.find((a) => a.type === 'revenue_drop');
      expect(revenueDrop).toBeDefined();
      expect(revenueDrop!.severity).toBe('warning');
      expect(revenueDrop!.currentValue).toBe(6_000_000);
      expect(revenueDrop!.previousValue).toBe(8_000_000);
    });

    it('should mark revenue drop as critical when >= 40%', () => {
      const currentPL = makePL({ revenue: 4_500_000 });
      const previousPL = makePL({ month: 1, revenue: 8_000_000 }); // -43.75%
      const currentBS = makeBS();
      const previousBS = makeBS({ month: 1 });

      const anomalies = detectAnomalies(currentPL, previousPL, currentBS, previousBS);

      const revenueDrop = anomalies.find((a) => a.type === 'revenue_drop');
      expect(revenueDrop).toBeDefined();
      expect(revenueDrop!.severity).toBe('critical');
    });

    it('should not detect revenue drop when change is within threshold', () => {
      const currentPL = makePL({ revenue: 7_500_000 });
      const previousPL = makePL({ month: 1, revenue: 8_000_000 }); // -6.25%
      const currentBS = makeBS();
      const previousBS = makeBS({ month: 1 });

      const anomalies = detectAnomalies(currentPL, previousPL, currentBS, previousBS);

      const revenueDrop = anomalies.find((a) => a.type === 'revenue_drop');
      expect(revenueDrop).toBeUndefined();
    });
  });

  describe('loss_turnaround detection', () => {
    it('should detect when ordinaryIncome turns negative from positive', () => {
      const currentPL = makePL({ ordinaryIncome: -500_000 });
      const previousPL = makePL({ month: 1, ordinaryIncome: 200_000 });
      const currentBS = makeBS();
      const previousBS = makeBS({ month: 1 });

      const anomalies = detectAnomalies(currentPL, previousPL, currentBS, previousBS);

      const lossTurnaround = anomalies.find((a) => a.type === 'loss_turnaround');
      expect(lossTurnaround).toBeDefined();
      expect(lossTurnaround!.severity).toBe('critical');
      expect(lossTurnaround!.currentValue).toBe(-500_000);
      expect(lossTurnaround!.previousValue).toBe(200_000);
    });

    it('should not detect loss turnaround when both months are negative', () => {
      const currentPL = makePL({ ordinaryIncome: -500_000 });
      const previousPL = makePL({ month: 1, ordinaryIncome: -100_000 });
      const currentBS = makeBS();
      const previousBS = makeBS({ month: 1 });

      const anomalies = detectAnomalies(currentPL, previousPL, currentBS, previousBS);

      const lossTurnaround = anomalies.find((a) => a.type === 'loss_turnaround');
      expect(lossTurnaround).toBeUndefined();
    });

    it('should not detect loss turnaround when current is positive', () => {
      const currentPL = makePL({ ordinaryIncome: 100_000 });
      const previousPL = makePL({ month: 1, ordinaryIncome: 200_000 });
      const currentBS = makeBS();
      const previousBS = makeBS({ month: 1 });

      const anomalies = detectAnomalies(currentPL, previousPL, currentBS, previousBS);

      const lossTurnaround = anomalies.find((a) => a.type === 'loss_turnaround');
      expect(lossTurnaround).toBeUndefined();
    });
  });

  describe('expense_surge detection', () => {
    it('should detect expense item increase exceeding 30% threshold', () => {
      const currentPL = makePL({
        expenseBreakdown: [
          { accountId: 1, accountName: '広告宣伝費', categoryName: '販売費及び一般管理費', amount: 500_000 },
        ],
      });
      const previousPL = makePL({
        month: 1,
        expenseBreakdown: [
          { accountId: 1, accountName: '広告宣伝費', categoryName: '販売費及び一般管理費', amount: 200_000 },
        ],
      });
      const currentBS = makeBS();
      const previousBS = makeBS({ month: 1 });

      const anomalies = detectAnomalies(currentPL, previousPL, currentBS, previousBS);

      const expenseSurge = anomalies.find(
        (a) => a.type === 'expense_surge' && a.accountName === '広告宣伝費',
      );
      expect(expenseSurge).toBeDefined();
      expect(expenseSurge!.currentValue).toBe(500_000);
      expect(expenseSurge!.previousValue).toBe(200_000);
    });

    it('should mark expense surge as warning when change >= 50%', () => {
      const currentPL = makePL({
        expenseBreakdown: [
          { accountId: 1, accountName: '広告宣伝費', categoryName: '販売費及び一般管理費', amount: 400_000 },
        ],
      });
      const previousPL = makePL({
        month: 1,
        expenseBreakdown: [
          { accountId: 1, accountName: '広告宣伝費', categoryName: '販売費及び一般管理費', amount: 200_000 },
        ],
      });
      const currentBS = makeBS();
      const previousBS = makeBS({ month: 1 });

      const anomalies = detectAnomalies(currentPL, previousPL, currentBS, previousBS);

      const expenseSurge = anomalies.find(
        (a) => a.type === 'expense_surge' && a.accountName === '広告宣伝費',
      );
      expect(expenseSurge).toBeDefined();
      expect(expenseSurge!.severity).toBe('warning'); // 100% >= 50%
    });

    it('should skip expense items with zero previous amount', () => {
      const currentPL = makePL({
        expenseBreakdown: [
          { accountId: 1, accountName: '新規費用', categoryName: '販売費及び一般管理費', amount: 500_000 },
        ],
      });
      const previousPL = makePL({
        month: 1,
        expenseBreakdown: [],
      });
      const currentBS = makeBS();
      const previousBS = makeBS({ month: 1 });

      const anomalies = detectAnomalies(currentPL, previousPL, currentBS, previousBS);

      const expenseSurge = anomalies.find(
        (a) => a.type === 'expense_surge' && a.accountName === '新規費用',
      );
      expect(expenseSurge).toBeUndefined();
    });
  });

  describe('cash_decline detection', () => {
    it('should detect cash decline exceeding 20% threshold', () => {
      const currentPL = makePL();
      const previousPL = makePL({ month: 1 });
      const currentBS = makeBS({ cashAndDeposits: 7_000_000 });
      const previousBS = makeBS({ month: 1, cashAndDeposits: 10_000_000 }); // -30%

      const anomalies = detectAnomalies(currentPL, previousPL, currentBS, previousBS);

      const cashDecline = anomalies.find((a) => a.type === 'cash_decline');
      expect(cashDecline).toBeDefined();
      expect(cashDecline!.severity).toBe('critical'); // -30% <= -30%
    });

    it('should mark cash decline as warning when between -20% and -30%', () => {
      const currentPL = makePL();
      const previousPL = makePL({ month: 1 });
      const currentBS = makeBS({ cashAndDeposits: 7_500_000 });
      const previousBS = makeBS({ month: 1, cashAndDeposits: 10_000_000 }); // -25%

      const anomalies = detectAnomalies(currentPL, previousPL, currentBS, previousBS);

      const cashDecline = anomalies.find((a) => a.type === 'cash_decline');
      expect(cashDecline).toBeDefined();
      expect(cashDecline!.severity).toBe('warning');
    });

    it('should not detect cash decline when no previous BS', () => {
      const currentPL = makePL();
      const previousPL = makePL({ month: 1 });
      const currentBS = makeBS({ cashAndDeposits: 5_000_000 });

      const anomalies = detectAnomalies(currentPL, previousPL, currentBS, null);

      const cashDecline = anomalies.find((a) => a.type === 'cash_decline');
      expect(cashDecline).toBeUndefined();
    });
  });

  describe('fixed_cost_overload detection', () => {
    it('should detect when sgaExpenses/revenue >= 70%', () => {
      const currentPL = makePL({
        revenue: 5_000_000,
        sgaExpenses: 4_000_000, // 80%
      });
      const currentBS = makeBS();

      const anomalies = detectAnomalies(currentPL, null, currentBS, null);

      const fixedCost = anomalies.find((a) => a.type === 'fixed_cost_overload');
      expect(fixedCost).toBeDefined();
      expect(fixedCost!.severity).toBe('warning');
    });

    it('should mark fixed cost overload as critical when >= 90%', () => {
      const currentPL = makePL({
        revenue: 5_000_000,
        sgaExpenses: 4_600_000, // 92%
      });
      const currentBS = makeBS();

      const anomalies = detectAnomalies(currentPL, null, currentBS, null);

      const fixedCost = anomalies.find((a) => a.type === 'fixed_cost_overload');
      expect(fixedCost).toBeDefined();
      expect(fixedCost!.severity).toBe('critical');
    });
  });

  describe('sorting', () => {
    it('should sort anomalies by severity: critical > warning > info', () => {
      const currentPL = makePL({
        revenue: 4_000_000,
        ordinaryIncome: -500_000,
        sgaExpenses: 3_800_000, // 95% -> critical fixed_cost_overload
        expenseBreakdown: [
          { accountId: 1, accountName: '広告宣伝費', categoryName: '販売費及び一般管理費', amount: 300_000 },
        ],
      });
      const previousPL = makePL({
        month: 1,
        revenue: 8_000_000, // -50% -> critical revenue_drop
        ordinaryIncome: 200_000, // loss turnaround -> critical
        expenseBreakdown: [
          { accountId: 1, accountName: '広告宣伝費', categoryName: '販売費及び一般管理費', amount: 200_000 },
        ],
      });
      const currentBS = makeBS();
      const previousBS = makeBS({ month: 1 });

      const anomalies = detectAnomalies(currentPL, previousPL, currentBS, previousBS);

      // Verify all critical items come before warning/info
      const criticalIdx = anomalies.findIndex((a) => a.severity === 'critical');
      const lastCriticalIdx = anomalies.reduce(
        (last, a, i) => (a.severity === 'critical' ? i : last),
        -1,
      );
      const firstNonCriticalIdx = anomalies.findIndex((a) => a.severity !== 'critical');

      if (criticalIdx >= 0 && firstNonCriticalIdx >= 0) {
        expect(lastCriticalIdx).toBeLessThan(firstNonCriticalIdx);
      }
    });
  });

  describe('no previous data', () => {
    it('should still detect non-comparison anomalies without previous data', () => {
      const currentPL = makePL({
        revenue: 5_000_000,
        sgaExpenses: 4_500_000, // 90% -> critical
      });
      const currentBS = makeBS();

      const anomalies = detectAnomalies(currentPL, null, currentBS, null);

      // Should still detect fixed_cost_overload
      const fixedCost = anomalies.find((a) => a.type === 'fixed_cost_overload');
      expect(fixedCost).toBeDefined();

      // Should not detect comparison-based anomalies
      const revenueDrop = anomalies.find((a) => a.type === 'revenue_drop');
      expect(revenueDrop).toBeUndefined();
    });
  });
});
