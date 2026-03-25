import type { RatingInput } from '../../src/types/bank-rating.js';

/**
 * 銀行格付用モック入力データ
 * テスト株式会社（中小企業）の決算データ
 */
export function createMockRatingInput(): RatingInput {
  return {
    // BS
    totalAssets: 30_500_000,
    currentAssets: 19_600_000,
    fixedAssets: 10_900_000,
    currentLiabilities: 7_100_000,
    fixedLiabilities: 10_200_000,
    netAssets: 13_200_000,
    interestBearingDebt: 8_000_000,
    cashAndDeposits: 13_150_000,

    // PL（年換算）
    revenue: 8_500_000 * 12,       // 月次×12
    operatingIncome: 1_390_000 * 12,
    ordinaryIncome: 1_320_000 * 12,
    netIncome: 950_000 * 12,
    interestExpense: 85_000 * 12,
    interestIncome: 15_000 * 12,
    depreciation: 180_000 * 12,

    // 前期
    prevOrdinaryIncome: 944_000 * 12,
    prevTotalAssets: 29_800_000,

    // 返済
    annualDebtRepayment: 2_000_000,

    // 収益フロー（3期分）
    profitFlowHistory: ['positive', 'positive', 'positive'],
  };
}
