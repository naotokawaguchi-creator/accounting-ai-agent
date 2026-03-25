import type { MonthlySnapshot, MonthlyTarget, TrendData } from '../../src/types/trend.js';

/**
 * 6か月分の月次推移モックデータ（2025年9月〜2026年2月）
 * リアルな中小企業の季節変動を反映
 */
export function createMockTrendData(): TrendData {
  const months: MonthlySnapshot[] = [
    {
      year: 2025, month: 9,
      revenue: 7_200_000,
      costOfSales: 2_400_000,
      grossProfit: 4_800_000,
      sgaExpenses: 4_050_000,
      operatingIncome: 750_000,
      ordinaryIncome: 680_000,
      cashAndDeposits: 11_800_000,
      currentAssets: 18_200_000,
      currentLiabilities: 7_600_000,
      totalAssets: 28_500_000,
      netAssets: 12_000_000,
    },
    {
      year: 2025, month: 10,
      revenue: 7_600_000,
      costOfSales: 2_500_000,
      grossProfit: 5_100_000,
      sgaExpenses: 4_100_000,
      operatingIncome: 1_000_000,
      ordinaryIncome: 920_000,
      cashAndDeposits: 11_500_000,
      currentAssets: 18_000_000,
      currentLiabilities: 7_400_000,
      totalAssets: 28_800_000,
      netAssets: 12_200_000,
    },
    {
      year: 2025, month: 11,
      revenue: 8_100_000,
      costOfSales: 2_650_000,
      grossProfit: 5_450_000,
      sgaExpenses: 4_120_000,
      operatingIncome: 1_330_000,
      ordinaryIncome: 1_250_000,
      cashAndDeposits: 12_000_000,
      currentAssets: 18_800_000,
      currentLiabilities: 7_500_000,
      totalAssets: 29_200_000,
      netAssets: 12_500_000,
    },
    {
      year: 2025, month: 12,
      revenue: 9_200_000,
      costOfSales: 3_000_000,
      grossProfit: 6_200_000,
      sgaExpenses: 4_300_000,
      operatingIncome: 1_900_000,
      ordinaryIncome: 1_800_000,
      cashAndDeposits: 12_800_000,
      currentAssets: 19_500_000,
      currentLiabilities: 7_800_000,
      totalAssets: 30_000_000,
      netAssets: 13_000_000,
    },
    {
      year: 2026, month: 1,
      revenue: 7_800_000,
      costOfSales: 2_600_000,
      grossProfit: 5_200_000,
      sgaExpenses: 4_180_000,
      operatingIncome: 1_020_000,
      ordinaryIncome: 944_000,
      cashAndDeposits: 12_420_000,
      currentAssets: 19_000_000,
      currentLiabilities: 7_200_000,
      totalAssets: 29_800_000,
      netAssets: 12_800_000,
    },
    {
      year: 2026, month: 2,
      revenue: 8_500_000,
      costOfSales: 2_800_000,
      grossProfit: 5_700_000,
      sgaExpenses: 4_310_000,
      operatingIncome: 1_390_000,
      ordinaryIncome: 1_320_000,
      cashAndDeposits: 13_150_000,
      currentAssets: 19_600_000,
      currentLiabilities: 7_100_000,
      totalAssets: 30_500_000,
      netAssets: 13_200_000,
    },
  ];

  // 月次目標（事業計画ベース）
  // 実績より少し高めに設定し、ギャップが見えるようにする
  const targets: MonthlyTarget[] = [
    { year: 2025, month: 9,  revenue: 8_000_000, grossProfit: 5_400_000, ordinaryIncome: 1_000_000 },
    { year: 2025, month: 10, revenue: 8_200_000, grossProfit: 5_500_000, ordinaryIncome: 1_100_000 },
    { year: 2025, month: 11, revenue: 8_500_000, grossProfit: 5_700_000, ordinaryIncome: 1_300_000 },
    { year: 2025, month: 12, revenue: 9_000_000, grossProfit: 6_000_000, ordinaryIncome: 1_600_000 },
    { year: 2026, month: 1,  revenue: 8_500_000, grossProfit: 5_700_000, ordinaryIncome: 1_300_000 },
    { year: 2026, month: 2,  revenue: 9_000_000, grossProfit: 6_000_000, ordinaryIncome: 1_500_000 },
  ];

  return { months, targets };
}
