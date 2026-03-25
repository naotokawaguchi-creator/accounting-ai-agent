import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { usageTracker } from './usage-tracker.js';
import { accountRulesToPrompt } from '../config/account-rules.js';

/** 仕訳データ */
export interface JournalEntry {
  date: string;           // YYYY-MM-DD
  debitAccount: string;   // 借方勘定科目
  creditAccount: string;  // 貸方勘定科目
  amount: number;
  taxRate: number;        // 消費税率 (0, 8, 10)
  taxAmount: number;
  description: string;    // 摘要
  partnerName: string;    // 取引先名
  receiptType: string;    // 領収書 / レシート / 請求書
}

/** 領収書解析結果 */
export interface ReceiptAnalysis {
  entries: JournalEntry[];
  rawText: string;
  confidence: 'high' | 'medium' | 'low';
  notes: string[];
}

/**
 * 領収書・レシートをAIで解析し、仕訳データを生成するサービス
 */
export class ReceiptService {
  private client: Anthropic | null = null;

  constructor() {
    const apiKey = config.ai.anthropicApiKey;
    if (apiKey) {
      this.client = new Anthropic({ apiKey });
    }
  }

  isAvailable(): boolean {
    return this.client !== null;
  }

  /**
   * 画像（領収書・レシート）から仕訳データを生成
   */
  async analyzeReceiptImage(imageBuffer: Buffer, mimeType: string, fileName: string): Promise<ReceiptAnalysis> {
    if (!this.client) throw new Error('APIキーが未設定です');

    const base64 = imageBuffer.toString('base64');
    logger.info(`領収書画像を解析中: ${fileName}`);

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp', data: base64 },
          },
          { type: 'text', text: RECEIPT_PROMPT },
        ],
      }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    usageTracker.record(response.model, response.usage.input_tokens, response.usage.output_tokens, '領収書解析');
    return this.parseResponse(text);
  }

  /**
   * PDFの領収書・請求書から仕訳データを生成
   */
  async analyzeReceiptPDF(pdfBuffer: Buffer, fileName: string): Promise<ReceiptAnalysis> {
    if (!this.client) throw new Error('APIキーが未設定です');

    const base64 = pdfBuffer.toString('base64');
    logger.info(`領収書PDFを解析中: ${fileName}`);

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: base64 },
          },
          { type: 'text', text: RECEIPT_PROMPT },
        ],
      }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    usageTracker.record(response.model, response.usage.input_tokens, response.usage.output_tokens, '領収書PDF解析');
    return this.parseResponse(text);
  }

  /**
   * 動画のフレームから領収書を解析
   * 動画は直接解析できないため、静止画フレームとして処理する想定
   * フロントで動画からキャプチャした画像を送る
   */
  async analyzeVideoFrames(frames: { buffer: Buffer; mimeType: string }[]): Promise<ReceiptAnalysis> {
    if (!this.client) throw new Error('APIキーが未設定です');

    logger.info(`動画フレーム${frames.length}枚を解析中...`);

    const imageContents = frames.map(f => ({
      type: 'image' as const,
      source: { type: 'base64' as const, media_type: f.mimeType as 'image/jpeg', data: f.buffer.toString('base64') },
    }));

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: [
          ...imageContents,
          { type: 'text', text: `これらは領収書・レシートを撮影した動画から抽出したフレームです。
各フレームに写っている領収書・レシートを全て読み取り、仕訳データを生成してください。
同じ領収書が複数フレームに写っている場合は1件にまとめてください。\n\n${RECEIPT_PROMPT}` },
        ],
      }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    usageTracker.record(response.model, response.usage.input_tokens, response.usage.output_tokens, '動画フレーム解析');
    return this.parseResponse(text);
  }

  /** 仕訳データをCSV文字列に変換 */
  toCSV(entries: JournalEntry[]): string {
    const header = '日付,借方勘定科目,貸方勘定科目,金額,消費税率,消費税額,摘要,取引先名,種別';
    const rows = entries.map(e =>
      `${e.date},${e.debitAccount},${e.creditAccount},${e.amount},${e.taxRate}%,${e.taxAmount},"${e.description}","${e.partnerName}",${e.receiptType}`
    );
    return [header, ...rows].join('\n');
  }

  /** freee API用の仕訳パラメータに変換 */
  toFreeeParams(entry: JournalEntry, companyId: number) {
    return {
      company_id: companyId,
      issue_date: entry.date,
      type: entry.debitAccount.includes('仕入') || entry.debitAccount.includes('費') ? 'expense' : 'income',
      details: [{
        account_item_name: entry.debitAccount,
        amount: entry.amount,
        tax_code: entry.taxRate === 10 ? 21 : entry.taxRate === 8 ? 23 : 0, // TODO: 正確なtax_code対応
        description: `${entry.description} (${entry.partnerName})`,
      }],
      // TODO: partner_id の解決（取引先名→IDマッピング）
    };
  }

  private parseResponse(text: string): ReceiptAnalysis {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('JSON not found');
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        entries: (parsed.entries || []).map((e: any) => ({
          date: e.date || new Date().toISOString().slice(0, 10),
          debitAccount: e.debitAccount || '未分類',
          creditAccount: e.creditAccount || '現金',
          amount: Number(e.amount) || 0,
          taxRate: Number(e.taxRate) || 10,
          taxAmount: Number(e.taxAmount) || 0,
          description: e.description || '',
          partnerName: e.partnerName || '',
          receiptType: e.receiptType || '領収書',
        })),
        rawText: text,
        confidence: parsed.confidence || 'medium',
        notes: parsed.notes || [],
      };
    } catch {
      return { entries: [], rawText: text, confidence: 'low', notes: ['AIレスポンスの解析に失敗しました'] };
    }
  }
}

// プロンプトはルール一覧から動的に生成
function getReceiptPrompt(): string {
  const rules = accountRulesToPrompt();
  return `この領収書・レシートの内容を読み取り、以下のJSON形式で仕訳データを生成してください。

【基本ルール】
- 日付はYYYY-MM-DD形式
- 借方（debitAccount）は以下の勘定科目ルールに従って選択すること
- 貸方（creditAccount）は支払方法（現金/普通預金/クレジットカード等）。レシートから判別できない場合は「現金」
- 消費税は内税前提で計算。税込金額から逆算すること
- 軽減税率8%対象（食料品・飲料 ※酒類除く）は taxRate: 8 とする
- 複数品目がある場合も1仕訳にまとめてよい（合計金額で）
- 読み取れない項目は推定し、notesに記載

【重要：飲食費の判定】
- 1人あたり10,000円未満 → 会議費
- 1人あたり10,000円以上 → 接待交際費
- 人数が不明な場合は金額から推定（5,000円以下→会議費が無難）

【重要：金額による科目判定】
- 1つ10万円以上の物品 → 減価償却費（資産計上）
- 1つ10万円未満の物品 → 消耗品費

【勘定科目ルール一覧】
${rules}

JSONのみ返してください：
{
  "entries": [
    {
      "date": "YYYY-MM-DD",
      "debitAccount": "上記ルールに基づく借方勘定科目",
      "creditAccount": "現金",
      "amount": 税込金額,
      "taxRate": 10,
      "taxAmount": 消費税額,
      "description": "摘要（店名＋購入内容の要約）",
      "partnerName": "取引先名（店名・会社名）",
      "receiptType": "領収書 or レシート or 請求書"
    }
  ],
  "confidence": "high/medium/low",
  "notes": ["読み取り時の注意点や推定した項目"]
}`;
}

const RECEIPT_PROMPT = getReceiptPrompt();

export const receiptService = new ReceiptService();
