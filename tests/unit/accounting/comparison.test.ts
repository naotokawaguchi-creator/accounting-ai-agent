import { describe, it, expect } from 'vitest';
import { createMonthlyComparison } from '../../../src/domain/accounting/comparison.js';
import type { MonthlyPL } from '../../../src/types/accounting.js';

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
      { accountId: 3, accountName: '広告宣伝費', categoryName: '販売費及び一般管理費', amount: 200_000 },
    ],
    ...overrides,
  };
}

describe('createMonthlyComparison', () => {
  it('should return null changes when previous is null', () => {
    const current = makePL();
    const result = createMonthlyComparison(current, null);

    expect(result.current).toBe(current);
    expect(result.previous).toBeNull();
    expect(result.changes).toBeNull();
  });

  it('should calculate revenue change correctly', () => {
    const current = makePL({ revenue: 8_500_000 });
    const previous = makePL({
      year: 2026,
      month: 1,
      revenue: 7_800_000,
      grossProfit: 5_200_000,
      operatingIncome: 1_020_000,
      ordinaryIncome: 944_000,
    });

    const result = createMonthlyComparison(current, previous);

    expect(result.changes).not.toBeNull();
    expect(result.changes!.revenueChange).toBe(8_500_000 - 7_800_000);
    expect(result.changes!.revenueChangeRate).toBeCloseTo((8_500_000 - 7_800_000) / 7_800_000, 5);
  });

  it('should calculate grossProfit change correctly', () => {
    const current = makePL({ grossProfit: 5_700_000 });
    const previous = makePL({ month: 1, grossProfit: 5_200_000 });

    const result = createMonthlyComparison(current, previous);

    expect(result.changes!.grossProfitChange).toBe(500_000);
    expect(result.changes!.grossProfitChangeRate).toBeCloseTo(500_000 / 5_200_000, 5);
  });

  it('should calculate operatingIncome change correctly', () => {
    const current = makePL({ operatingIncome: 1_390_000 });
    const previous = makePL({ month: 1, operatingIncome: 1_020_000 });

    const result = createMonthlyComparison(current, previous);

    expect(result.changes!.operatingIncomeChange).toBe(370_000);
    expect(result.changes!.operatingIncomeChangeRate).toBeCloseTo(370_000 / 1_020_000, 5);
  });

  it('should calculate ordinaryIncome change correctly', () => {
    const current = makePL({ ordinaryIncome: 1_320_000 });
    const previous = makePL({ month: 1, ordinaryIncome: 944_000 });

    const result = createMonthlyComparison(current, previous);

    expect(result.changes!.ordinaryIncomeChange).toBe(376_000);
    expect(result.changes!.ordinaryIncomeChangeRate).toBeCloseTo(376_000 / 944_000, 5);
  });

  it('should detect significant expense changes (>= 30% change)', () => {
    const current = makePL({
      expenseBreakdown: [
        { accountId: 1, accountName: '給与手当', categoryName: '販売費及び一般管理費', amount: 2_500_000 },
        { accountId: 3, accountName: '広告宣伝費', categoryName: '販売費及び一般管理費', amount: 400_000 },
      ],
    });
    const previous = makePL({
      month: 1,
      expenseBreakdown: [
        { accountId: 1, accountName: '給与手当', categoryName: '販売費及び一般管理費', amount: 2_500_000 },
        { accountId: 3, accountName: '広告宣伝費', categoryName: '販売費及び一般管理費', amount: 200_000 },
      ],
    });

    const result = createMonthlyComparison(current, previous);

    expect(result.changes!.significantExpenseChanges.length).toBeGreaterThanOrEqual(1);

    const adChange = result.changes!.significantExpenseChanges.find(
      (c) => c.accountName === '広告宣伝費',
    );
    expect(adChange).toBeDefined();
    expect(adChange!.changeAmount).toBe(200_000);
    expect(adChange!.changeRate).toBeCloseTo(1.0, 5); // 100% increase
  });

  it('should not include expense changes below 30% threshold', () => {
    const current = makePL({
      expenseBreakdown: [
        { accountId: 1, accountName: '給与手当', categoryName: '販売費及び一般管理費', amount: 2_500_000 },
      ],
    });
    const previous = makePL({
      month: 1,
      expenseBreakdown: [
        { accountId: 1, accountName: '給与手当', categoryName: '販売費及び一般管理費', amount: 2_400_000 },
      ],
    });

    const result = createMonthlyComparison(current, previous);

    // ~4% change, below 30% threshold
    const salaryChange = result.changes!.significantExpenseChanges.find(
      (c) => c.accountName === '給与手当',
    );
    expect(salaryChange).toBeUndefined();
  });

  it('should sort significant expense changes by absolute changeAmount descending', () => {
    const current = makePL({
      expenseBreakdown: [
        { accountId: 1, accountName: '広告宣伝費', categoryName: '販売費及び一般管理費', amount: 500_000 },
        { accountId: 2, accountName: '接待交際費', categoryName: '販売費及び一般管理費', amount: 300_000 },
      ],
    });
    const previous = makePL({
      month: 1,
      expenseBreakdown: [
        { accountId: 1, accountName: '広告宣伝費', categoryName: '販売費及び一般管理費', amount: 200_000 },
        { accountId: 2, accountName: '接待交際費', categoryName: '販売費及び一般管理費', amount: 100_000 },
      ],
    });

    const result = createMonthlyComparison(current, previous);

    const changes = result.changes!.significantExpenseChanges;
    expect(changes.length).toBe(2);
    // 広告宣伝費: +300,000, 接待交際費: +200,000
    expect(changes[0].accountName).toBe('広告宣伝費');
    expect(changes[1].accountName).toBe('接待交際費');
  });

  it('should reference the same current and previous objects', () => {
    const current = makePL();
    const previous = makePL({ month: 1 });

    const result = createMonthlyComparison(current, previous);

    expect(result.current).toBe(current);
    expect(result.previous).toBe(previous);
  });
});
