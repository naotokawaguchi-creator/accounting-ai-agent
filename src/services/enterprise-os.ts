import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger.js';

/**
 * 企業AI OSからデータを読み込むサービス
 *
 * 企業の第一次情報（理念、サービス、顧客、ナレッジ等）を
 * 構造化された形で提供し、各AIエージェントが参照できるようにする。
 */

const OS_BASE_PATH = path.resolve(process.env.ENTERPRISE_OS_PATH || `${process.env.HOME}/Desktop/企業AI OS/企業AI_OS`);

export interface OSCategory {
  id: string;      // "01_企業基盤"
  name: string;    // "企業基盤"
  files: OSFile[];
}

export interface OSFile {
  name: string;     // "会社理念"
  path: string;     // full path
  content: string;  // file content
}

/** 企業AI OSが存在するか */
export function isEnterpriseOSAvailable(): boolean {
  return fs.existsSync(OS_BASE_PATH);
}

/** 全カテゴリとファイルを読み込む */
export function loadAllCategories(): OSCategory[] {
  if (!isEnterpriseOSAvailable()) return [];

  try {
    const dirs = fs.readdirSync(OS_BASE_PATH)
      .filter(d => /^\d{2}_/.test(d))
      .sort();

    return dirs.map(dir => {
      const dirPath = path.join(OS_BASE_PATH, dir);
      if (!fs.statSync(dirPath).isDirectory()) return null;

      const name = dir.replace(/^\d{2}_/, '');
      const files = fs.readdirSync(dirPath)
        .filter(f => f.endsWith('.txt') || f.endsWith('.md'))
        .map(f => {
          const filePath = path.join(dirPath, f);
          try {
            return {
              name: path.basename(f, path.extname(f)),
              path: filePath,
              content: fs.readFileSync(filePath, 'utf-8').trim(),
            };
          } catch {
            return null;
          }
        })
        .filter((f): f is OSFile => f !== null && f.content.length > 0);

      return { id: dir, name, files };
    }).filter((c): c is OSCategory => c !== null && c.files.length > 0);
  } catch (error) {
    logger.warn('企業AI OSの読み込みに失敗:', error instanceof Error ? error.message : error);
    return [];
  }
}

/** カテゴリ一覧の概要を返す（UI表示用） */
export function getOSSummary(): Array<{ id: string; name: string; fileCount: number; fileNames: string[] }> {
  const categories = loadAllCategories();
  return categories.map(c => ({
    id: c.id,
    name: c.name,
    fileCount: c.files.length,
    fileNames: c.files.map(f => f.name),
  }));
}

/** カテゴリIDとディレクトリ名のマッピング */
const CATEGORY_DIRS: Record<string, string> = {
  '企業基盤': '01_企業基盤',
  '事業・サービス': '02_事業・サービス',
  '顧客情報': '03_顧客情報',
  '業務プロセス': '04_業務プロセス',
  'ナレッジ': '05_ナレッジ',
  'マーケティング': '06_マーケティング',
  '営業': '07_営業',
  'バックオフィス': '08_バックオフィス',
  '成功事例': '09_成功事例',
  'AIエージェント': '10_AIエージェント',
};

/**
 * 企業AI OSにナレッジを保存する
 *
 * チャットで得られた情報を適切なカテゴリのファイルに追記する。
 * ファイルが存在しない場合は新規作成する。
 */
export function saveKnowledge(category: string, fileName: string, content: string): { success: boolean; path: string; message: string } {
  const dirName = CATEGORY_DIRS[category];
  if (!dirName) {
    return { success: false, path: '', message: `不明なカテゴリ: ${category}` };
  }

  // 企業AI OSフォルダがなければ作成
  if (!isEnterpriseOSAvailable()) {
    fs.mkdirSync(OS_BASE_PATH, { recursive: true });
    logger.info(`企業AI OSフォルダを作成しました: ${OS_BASE_PATH}`);
  }

  const dirPath = path.join(OS_BASE_PATH, dirName);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  const safeName = fileName.replace(/[/\\:*?"<>|]/g, '_');
  const filePath = path.join(dirPath, `${safeName}.txt`);
  const today = new Date().toISOString().split('T')[0];

  if (fs.existsSync(filePath)) {
    // 既存ファイルに追記
    const existing = fs.readFileSync(filePath, 'utf-8');

    // 「詳細」セクションの末尾に追記
    const detailMatch = existing.match(/(詳細\n)([\s\S]*?)(\n\nAIに覚えさせたい要点)/);
    if (detailMatch) {
      const updated = existing.replace(
        detailMatch[0],
        `${detailMatch[1]}${detailMatch[2]}\n・ ${content}${detailMatch[3]}`
      );
      // 更新日を更新
      const withDate = updated.replace(/更新日\n・\s*[\d-]+/, `更新日\n・ ${today}`);
      fs.writeFileSync(filePath, withDate, 'utf-8');
    } else {
      // セクション構造がない場合は末尾に追記
      fs.appendFileSync(filePath, `\n\n【${today} チャットから追記】\n${content}\n`);
    }
    logger.info(`企業AI OSに追記: ${dirName}/${safeName}.txt`);
  } else {
    // 新規ファイル作成
    const template = `${safeName}

概要
チャットから自動保存されたナレッジ

詳細
・ ${content}

AIに覚えさせたい要点
・ ${content}

関連する他フォルダ
・

更新日
・ ${today}
`;
    fs.writeFileSync(filePath, template, 'utf-8');
    logger.info(`企業AI OSに新規作成: ${dirName}/${safeName}.txt`);
  }

  return { success: true, path: filePath, message: `${dirName}/${safeName}.txt に保存しました` };
}

/** 利用可能なカテゴリ名一覧を返す */
export function getAvailableCategories(): string[] {
  return Object.keys(CATEGORY_DIRS);
}

/** AIプロンプト用に全データをテキストに変換 */
export function buildOSContext(): string {
  const categories = loadAllCategories();
  if (categories.length === 0) return '';

  const sections = categories.map(cat => {
    const files = cat.files.map(f => {
      // 「AIに覚えさせたい要点」セクションがあればそこを優先
      const keyPointsMatch = f.content.match(/AIに覚えさせたい要点[\s\S]*?(?=\n(?:関連|更新日|$))/);
      const summary = keyPointsMatch ? keyPointsMatch[0].trim() : f.content.slice(0, 500);
      return `### ${f.name}\n${summary}`;
    }).join('\n\n');

    return `## ${cat.id} ${cat.name}\n${files}`;
  }).join('\n\n---\n\n');

  return `# 企業AI OS（企業の第一次情報）\n\n${sections}`;
}
