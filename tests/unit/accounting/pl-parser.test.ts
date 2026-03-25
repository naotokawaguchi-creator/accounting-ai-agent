import { describe, it, expect } from 'vitest';
import { parsePLResponse } from '../../../src/domain/accounting/pl-parser.js';
import type { FreeePLResponse, FreeePLBalance } from '../../../src/types/freee.js';
import { createMockRawData } from '../../fixtures/mock-data.js';

function makePLBalance(
  overrides: Partial<FreeePLBalance> & Pick<FreeePLBalance, 'account_item_name' | 'closing_balance'>,
): FreeePLBalance {
  return {
    account_item_id: overrides.account_item_id ?? 1,
    account_item_name: overrides.account_item_name,
    account_category_name: overrides.account_category_name ?? '',
    total_line: overrides.total_line ?? false,
    hierarchy_level: overrides.hierarchy_level ?? 3,
    parent_account_category_name: overrides.parent_account_category_name ?? null,
    opening_balance: overrides.opening_balance ?? 0,
    debit_amount: overrides.debit_amount ?? 0,
    credit_amount: overrides.credit_amount ?? 0,
    closing_balance: overrides.closing_balance,
    composition_ratio: overrides.composition_ratio ?? null,
  };
}

describe('parsePLResponse', () => {
  it('should extract revenue from total_line', () => {
    const rawData = createMockRawData();
    const result = parsePLResponse(rawData.currentMonthPL, 2026, 2);

    expect(result.revenue).toBe(8_500_000);
  });

  it('should extract costOfSales from total_line', () => {
    const rawData = createMockRawData();
    const result = parsePLResponse(rawData.currentMonthPL, 2026, 2);

    expect(result.costOfSales).toBe(2_800_000);
  });

  it('should calculate grossProfit as revenue - costOfSales', () => {
    const rawData = createMockRawData();
    const result = parsePLResponse(rawData.currentMonthPL, 2026, 2);

    expect(result.grossProfit).toBe(8_500_000 - 2_800_000);
  });

  it('should extract sgaExpenses from total_line', () => {
    const rawData = createMockRawData();
    const result = parsePLResponse(rawData.currentMonthPL, 2026, 2);

    expect(result.sgaExpenses).toBe(4_310_000);
  });

  it('should calculate operatingIncome as grossProfit - sgaExpenses', () => {
    const rawData = createMockRawData();
    const result = parsePLResponse(rawData.currentMonthPL, 2026, 2);

    // grossProfit = 8_500_000 - 2_800_000 = 5_700_000
    // operatingIncome = 5_700_000 - 4_310_000 = 1_390_000
    expect(result.operatingIncome).toBe(1_390_000);
  });

  it('should extract nonOperatingIncome and nonOperatingExpenses', () => {
    const rawData = createMockRawData();
    const result = parsePLResponse(rawData.currentMonthPL, 2026, 2);

    expect(result.nonOperatingIncome).toBe(15_000);
    expect(result.nonOperatingExpenses).toBe(85_000);
  });

  it('should calculate ordinaryIncome correctly', () => {
    const rawData = createMockRawData();
    const result = parsePLResponse(rawData.currentMonthPL, 2026, 2);

    // ordinaryIncome = operatingIncome + nonOperatingIncome - nonOperatingExpenses
    // = 1_390_000 + 15_000 - 85_000 = 1_320_000
    expect(result.ordinaryIncome).toBe(1_320_000);
  });

  it('should calculate netIncome correctly (no extraordinary items in mock)', () => {
    const rawData = createMockRawData();
    const result = parsePLResponse(rawData.currentMonthPL, 2026, 2);

    // No extraordinary items in the mock data, so netIncome = ordinaryIncome
    expect(result.netIncome).toBe(result.ordinaryIncome);
  });

  it('should set year and month correctly', () => {
    const rawData = createMockRawData();
    const result = parsePLResponse(rawData.currentMonthPL, 2026, 2);

    expect(result.year).toBe(2026);
    expect(result.month).toBe(2);
  });

  it('should extract expense breakdown items', () => {
    const rawData = createMockRawData();
    const result = parsePLResponse(rawData.currentMonthPL, 2026, 2);

    expect(result.expenseBreakdown.length).toBeGreaterThan(0);

    // The breakdown should include cost categories (売上原価, 販売費及び一般管理費, 営業外費用)
    const salaryItem = result.expenseBreakdown.find((e) => e.accountName === '給与手当');
    expect(salaryItem).toBeDefined();
    expect(salaryItem!.amount).toBe(2_500_000);

    const rentItem = result.expenseBreakdown.find((e) => e.accountName === '地代家賃');
    expect(rentItem).toBeDefined();
    expect(rentItem!.amount).toBe(350_000);
  });

  it('should sort expense breakdown by absolute amount descending', () => {
    const rawData = createMockRawData();
    const result = parsePLResponse(rawData.currentMonthPL, 2026, 2);

    for (let i = 1; i < result.expenseBreakdown.length; i++) {
      expect(Math.abs(result.expenseBreakdown[i - 1].amount)).toBeGreaterThanOrEqual(
        Math.abs(result.expenseBreakdown[i].amount),
      );
    }
  });

  it('should exclude items with zero amount from expense breakdown', () => {
    const plResponse: FreeePLResponse = {
      trial_pl: {
        company_id: 1,
        fiscal_year: 2026,
        start_month: 1,
        end_month: 1,
        start_date: '2026-01-01',
        end_date: '2026-01-31',
        balances: [
          makePLBalance({
            account_item_name: '売上高',
            account_category_name: '売上高',
            total_line: true,
            closing_balance: 1_000_000,
          }),
          makePLBalance({
            account_item_name: '消耗品費',
            account_category_name: '販売費及び一般管理費',
            closing_balance: 0,
          }),
          makePLBalance({
            account_item_name: '給与手当',
            account_category_name: '販売費及び一般管理費',
            closing_balance: 500_000,
          }),
        ],
      },
    };

    const result = parsePLResponse(plResponse, 2026, 1);
    const zeroItem = result.expenseBreakdown.find((e) => e.accountName === '消耗品費');
    expect(zeroItem).toBeUndefined();
  });

  it('should handle previous month PL data correctly', () => {
    const rawData = createMockRawData();
    const result = parsePLResponse(rawData.previousMonthPL, 2026, 1);

    expect(result.revenue).toBe(7_800_000);
    expect(result.costOfSales).toBe(2_600_000);
    expect(result.sgaExpenses).toBe(4_180_000);
  });

  it('should fallback to summing individual items when no total_line exists', () => {
    const plResponse: FreeePLResponse = {
      trial_pl: {
        company_id: 1,
        fiscal_year: 2026,
        start_month: 1,
        end_month: 1,
        start_date: '2026-01-01',
        end_date: '2026-01-31',
        balances: [
          makePLBalance({
            account_item_name: '商品売上',
            account_category_name: '売上高',
            total_line: false,
            closing_balance: 3_000_000,
          }),
          makePLBalance({
            account_item_name: 'サービス売上',
            account_category_name: '売上高',
            total_line: false,
            closing_balance: 2_000_000,
          }),
        ],
      },
    };

    const result = parsePLResponse(plResponse, 2026, 1);
    expect(result.revenue).toBe(5_000_000);
  });
});
