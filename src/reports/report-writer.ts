import fs from 'fs';
import path from 'path';
import type { FullReport } from '../types/report.js';
import { renderMarkdown } from './markdown-renderer.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

/**
 * レポートをファイルに出力する
 */
export class ReportWriter {
  private outputDir: string;

  constructor(outputDir?: string) {
    this.outputDir = outputDir ?? config.output.dir;
  }

  async write(report: FullReport): Promise<{ jsonPath?: string; mdPath?: string }> {
    // 出力ディレクトリを作成
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    const baseName = `monthly-report-${report.meta.reportMonth}`;
    const result: { jsonPath?: string; mdPath?: string } = {};
    const format = config.output.format;

    // JSON出力
    if (format === 'json' || format === 'both') {
      const jsonPath = path.join(this.outputDir, `${baseName}.json`);
      fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf-8');
      result.jsonPath = jsonPath;
      logger.info(`JSONレポートを出力しました: ${jsonPath}`);
    }

    // Markdown出力
    if (format === 'markdown' || format === 'both') {
      const mdPath = path.join(this.outputDir, `${baseName}.md`);
      const markdown = renderMarkdown(report);
      fs.writeFileSync(mdPath, markdown, 'utf-8');
      result.mdPath = mdPath;
      logger.info(`Markdownレポートを出力しました: ${mdPath}`);
    }

    return result;
  }
}
