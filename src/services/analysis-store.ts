import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger.js';
import type { BankRatingResult, AdditionalMetrics, RatingInput } from '../types/bank-rating.js';

const STORE_DIR = path.resolve('data/analyses');

export interface SavedAnalysis {
  id: string;
  createdAt: string;
  fileName: string | null;
  source: 'upload' | 'freee' | 'mock';
  ratingInput: RatingInput;
  rating: BankRatingResult;
  additional: AdditionalMetrics;
  aiCommentary: string | null;
  extractionNotes: string[];
}

export interface AnalysisSummary {
  id: string;
  createdAt: string;
  fileName: string | null;
  source: string;
  totalScore: number;
  rank: string;
  rankLabel: string;
  revenue: number;
  ordinaryIncome: number;
}

/**
 * 分析結果の保存・読み込み
 */
export class AnalysisStore {
  constructor() {
    if (!fs.existsSync(STORE_DIR)) {
      fs.mkdirSync(STORE_DIR, { recursive: true });
    }
  }

  /** 分析結果を保存し、IDを返す */
  save(data: Omit<SavedAnalysis, 'id' | 'createdAt'>): string {
    const id = `analysis-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const record: SavedAnalysis = {
      id,
      createdAt: new Date().toISOString(),
      ...data,
    };

    const filePath = path.join(STORE_DIR, `${id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(record, null, 2), 'utf-8');
    logger.info(`分析結果を保存しました: ${id}`);
    return id;
  }

  /** IDで分析結果を取得 */
  get(id: string): SavedAnalysis | null {
    const filePath = path.join(STORE_DIR, `${id}.json`);
    if (!fs.existsSync(filePath)) return null;
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  }

  /** 全分析結果の一覧（新しい順） */
  list(): AnalysisSummary[] {
    const files = fs.readdirSync(STORE_DIR)
      .filter(f => f.endsWith('.json'))
      .sort().reverse();

    return files.map(f => {
      try {
        const data: SavedAnalysis = JSON.parse(fs.readFileSync(path.join(STORE_DIR, f), 'utf-8'));
        return {
          id: data.id,
          createdAt: data.createdAt,
          fileName: data.fileName,
          source: data.source,
          totalScore: data.rating.totalScore,
          rank: data.rating.rank,
          rankLabel: data.rating.rankLabel,
          revenue: data.ratingInput.revenue,
          ordinaryIncome: data.ratingInput.ordinaryIncome,
        };
      } catch {
        return null;
      }
    }).filter((s): s is AnalysisSummary => s !== null);
  }

  /** 削除 */
  delete(id: string): boolean {
    const filePath = path.join(STORE_DIR, `${id}.json`);
    if (!fs.existsSync(filePath)) return false;
    fs.unlinkSync(filePath);
    logger.info(`分析結果を削除しました: ${id}`);
    return true;
  }
}

export const analysisStore = new AnalysisStore();
