/** 数値をカンマ区切りで表示 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('ja-JP').format(Math.round(value));
}

/** 数値を円表示 */
export function formatCurrency(value: number): string {
  return `${formatNumber(value)}円`;
}

/** パーセント表示 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/** 変動率を±表示 */
export function formatChangeRate(rate: number): string {
  const sign = rate >= 0 ? '+' : '';
  return `${sign}${(rate * 100).toFixed(1)}%`;
}

/** YYYY-MM形式 */
export function formatMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

/** 日本語の月表示 */
export function formatMonthJP(year: number, month: number): string {
  return `${year}年${month}月`;
}

/** 安全な除算（ゼロ除算防止） */
export function safeDivide(numerator: number, denominator: number): number | null {
  if (denominator === 0) return null;
  return numerator / denominator;
}

/** 変動率計算 */
export function calcChangeRate(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return (current - previous) / Math.abs(previous);
}
