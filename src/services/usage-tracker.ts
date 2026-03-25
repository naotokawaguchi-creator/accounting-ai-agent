/**
 * Anthropic API使用量トラッカー
 *
 * APIリクエストごとのトークン消費を記録し、
 * 累計コストを算出する。
 */

interface UsageRecord {
  timestamp: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  purpose: string;
}

// Claude Sonnet 4の料金（2026年3月時点）
const PRICING: Record<string, { input: number; output: number }> = {
  'claude-sonnet-4-20250514': { input: 3.0 / 1_000_000, output: 15.0 / 1_000_000 },
  'claude-opus-4-20250514': { input: 15.0 / 1_000_000, output: 75.0 / 1_000_000 },
  'default': { input: 3.0 / 1_000_000, output: 15.0 / 1_000_000 },
};

class UsageTracker {
  private records: UsageRecord[] = [];
  private totalInputTokens = 0;
  private totalOutputTokens = 0;
  private totalCost = 0;

  /** APIレスポンスのusageを記録 */
  record(model: string, inputTokens: number, outputTokens: number, purpose: string): void {
    const pricing = PRICING[model] || PRICING['default'];
    const cost = (inputTokens * pricing.input) + (outputTokens * pricing.output);

    this.totalInputTokens += inputTokens;
    this.totalOutputTokens += outputTokens;
    this.totalCost += cost;

    this.records.push({
      timestamp: new Date().toISOString(),
      model,
      inputTokens,
      outputTokens,
      cost,
      purpose,
    });
  }

  /** 現在の累計 */
  getSummary() {
    return {
      totalInputTokens: this.totalInputTokens,
      totalOutputTokens: this.totalOutputTokens,
      totalTokens: this.totalInputTokens + this.totalOutputTokens,
      totalCost: this.totalCost,
      totalCostYen: this.totalCost * 150, // 概算レート
      requestCount: this.records.length,
      records: this.records,
    };
  }

  /** フォーマット済みサマリー */
  getFormattedSummary() {
    const s = this.getSummary();
    return {
      totalTokens: s.totalTokens.toLocaleString('ja-JP'),
      inputTokens: s.totalInputTokens.toLocaleString('ja-JP'),
      outputTokens: s.totalOutputTokens.toLocaleString('ja-JP'),
      costUSD: `$${s.totalCost.toFixed(4)}`,
      costYen: `約${Math.ceil(s.totalCostYen)}円`,
      requestCount: s.requestCount,
    };
  }
}

// シングルトン
export const usageTracker = new UsageTracker();
