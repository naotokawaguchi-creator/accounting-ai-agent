import { describe, it, expect } from 'vitest';
import { parseBSResponse } from '../../../src/domain/accounting/bs-parser.js';
import type { FreeeBSResponse, FreeeBSBalance } from '../../../src/types/freee.js';
import { createMockRawData } from '../../fixtures/mock-data.js';

function makeBSBalance(
  overrides: Partial<FreeeBSBalance> & Pick<FreeeBSBalance, 'account_item_name' | 'closing_balance'>,
): FreeeBSBalance {
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

describe('parseBSResponse', () => {
  it('should extract currentAssets from total_line', () => {
    const rawData = createMockRawData();
    const result = parseBSResponse(rawData.currentMonthBS, 2026, 2);

    expect(result.currentAssets).toBe(18_950_000);
  });

  it('should extract fixedAssets from total_line', () => {
    const rawData = createMockRawData();
    const result = parseBSResponse(rawData.currentMonthBS, 2026, 2);

    expect(result.fixedAssets).toBe(6_800_000);
  });

  it('should calculate totalAssets as currentAssets + fixedAssets', () => {
    const rawData = createMockRawData();
    const result = parseBSResponse(rawData.currentMonthBS, 2026, 2);

    expect(result.totalAssets).toBe(18_950_000 + 6_800_000);
  });

  it('should extract currentLiabilities and fixedLiabilities', () => {
    const rawData = createMockRawData();
    const result = parseBSResponse(rawData.currentMonthBS, 2026, 2);

    expect(result.currentLiabilities).toBe(6_850_000);
    expect(result.fixedLiabilities).toBe(8_000_000);
  });

  it('should calculate totalLiabilities correctly', () => {
    const rawData = createMockRawData();
    const result = parseBSResponse(rawData.currentMonthBS, 2026, 2);

    expect(result.totalLiabilities).toBe(6_850_000 + 8_000_000);
  });

  it('should extract netAssets from total_line', () => {
    const rawData = createMockRawData();
    const result = parseBSResponse(rawData.currentMonthBS, 2026, 2);

    expect(result.netAssets).toBe(10_900_000);
  });

  it('should extract cashAndDeposits by summing cash-related items', () => {
    const rawData = createMockRawData();
    const result = parseBSResponse(rawData.currentMonthBS, 2026, 2);

    // 現金 (850,000) + 普通預金 (12,300,000) = 13,150,000
    expect(result.cashAndDeposits).toBe(850_000 + 12_300_000);
  });

  it('should calculate totalLiabilitiesAndNetAssets', () => {
    const rawData = createMockRawData();
    const result = parseBSResponse(rawData.currentMonthBS, 2026, 2);

    expect(result.totalLiabilitiesAndNetAssets).toBe(result.totalLiabilities + result.netAssets);
  });

  it('should set year and month correctly', () => {
    const rawData = createMockRawData();
    const result = parseBSResponse(rawData.currentMonthBS, 2026, 2);

    expect(result.year).toBe(2026);
    expect(result.month).toBe(2);
  });

  it('should parse previous month BS data correctly', () => {
    const rawData = createMockRawData();
    const result = parseBSResponse(rawData.previousMonthBS, 2026, 1);

    expect(result.currentAssets).toBe(17_800_000);
    expect(result.fixedAssets).toBe(6_980_000);
    expect(result.currentLiabilities).toBe(6_480_000);
    expect(result.fixedLiabilities).toBe(8_200_000);
    expect(result.netAssets).toBe(10_100_000);
    // 現金 (920,000) + 普通預金 (11,500,000) = 12,420,000
    expect(result.cashAndDeposits).toBe(920_000 + 11_500_000);
  });

  it('should return 0 for cashAndDeposits when no cash items found', () => {
    const bsResponse: FreeeBSResponse = {
      trial_bs: {
        company_id: 1,
        fiscal_year: 2026,
        start_month: 1,
        end_month: 1,
        start_date: '2026-01-01',
        end_date: '2026-01-31',
        balances: [
          makeBSBalance({
            account_item_name: '流動資産',
            account_category_name: '流動資産',
            total_line: true,
            closing_balance: 5_000_000,
          }),
          makeBSBalance({
            account_item_name: '売掛金',
            account_category_name: '流動資産',
            parent_account_category_name: '流動資産',
            closing_balance: 5_000_000,
          }),
        ],
      },
    };

    const result = parseBSResponse(bsResponse, 2026, 1);
    expect(result.cashAndDeposits).toBe(0);
  });

  it('should fallback netAssets to totalAssets - totalLiabilities when no pure total_line', () => {
    const bsResponse: FreeeBSResponse = {
      trial_bs: {
        company_id: 1,
        fiscal_year: 2026,
        start_month: 1,
        end_month: 1,
        start_date: '2026-01-01',
        end_date: '2026-01-31',
        balances: [
          makeBSBalance({
            account_item_name: '流動資産',
            account_category_name: '流動資産',
            total_line: true,
            closing_balance: 10_000_000,
          }),
          makeBSBalance({
            account_item_name: '流動負債',
            account_category_name: '流動負債',
            total_line: true,
            closing_balance: 3_000_000,
          }),
        ],
      },
    };

    const result = parseBSResponse(bsResponse, 2026, 1);
    // No 純資産 total_line, so netAssets = totalAssets - totalLiabilities
    expect(result.netAssets).toBe(10_000_000 - 3_000_000);
  });
});
