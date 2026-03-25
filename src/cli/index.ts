import dotenv from 'dotenv';
dotenv.config();

import { FreeeAuthClient } from '../clients/freee-auth.js';
import { FreeeService } from '../services/freee-service.js';
import { ReportBuilder } from '../reports/report-builder.js';
import { ReportWriter } from '../reports/report-writer.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

async function main() {
  const args = parseArgs(process.argv.slice(2));

  console.log('========================================');
  console.log('  経理・財務AIエージェント v0.1.0');
  console.log('========================================');
  console.log('');

  // モックモード判定
  const useMock = args.mock || !config.freee.accessToken;

  if (useMock) {
    console.log('📋 モックデータモードで実行します');
    console.log('  （実際のfreee APIに接続するには .env にアクセストークンを設定してください）');
    console.log('');
    await runWithMockData(args);
  } else {
    await runWithFreeeApi(args);
  }
}

async function runWithMockData(args: ParsedArgs) {
  const { createMockRawData } = await import('../../tests/fixtures/mock-data.js');
  const rawData = createMockRawData();

  const year = args.year ?? 2026;
  const month = args.month ?? 2;

  console.log(`📊 ${year}年${month}月のレポートを生成中...`);
  console.log('');

  const builder = new ReportBuilder();
  const report = await builder.build(rawData, year, month);

  const writer = new ReportWriter(args.outputDir);
  const result = await writer.write(report);

  console.log('');
  console.log('✅ レポート生成完了');
  if (result.jsonPath) console.log(`  JSON: ${result.jsonPath}`);
  if (result.mdPath) console.log(`  Markdown: ${result.mdPath}`);
  console.log('');
}

async function runWithFreeeApi(args: ParsedArgs) {
  const auth = new FreeeAuthClient();

  if (!auth.hasValidToken()) {
    console.error('❌ アクセストークンが設定されていません。');
    console.error('  .env ファイルに FREEE_ACCESS_TOKEN を設定してください。');
    console.error('');
    console.error('  初回認証URL:');
    console.error(`  ${auth.getAuthorizationUrl()}`);
    process.exit(1);
  }

  const service = new FreeeService(auth);

  // 事業所ID
  let companyId = args.companyId ?? config.freee.companyId;
  if (!companyId) {
    console.log('事業所一覧を取得中...');
    const companies = await service.getCompanies();
    if (companies.length === 0) {
      console.error('❌ 事業所が見つかりません。');
      process.exit(1);
    }
    console.log('利用可能な事業所:');
    companies.forEach((c) => {
      console.log(`  ID: ${c.id} - ${c.display_name}`);
    });
    companyId = companies[0].id;
    console.log(`事業所 "${companies[0].display_name}" (ID: ${companyId}) を使用します`);
  }

  const now = new Date();
  const year = args.year ?? now.getFullYear();
  const month = args.month ?? now.getMonth(); // 前月をデフォルト

  console.log(`📊 ${year}年${month}月のレポートを生成中...`);

  try {
    const rawData = await service.fetchMonthlyData(companyId, year, month);
    const builder = new ReportBuilder();
    const report = await builder.build(rawData, year, month);

    const writer = new ReportWriter(args.outputDir);
    const result = await writer.write(report);

    console.log('');
    console.log('✅ レポート生成完了');
    if (result.jsonPath) console.log(`  JSON: ${result.jsonPath}`);
    if (result.mdPath) console.log(`  Markdown: ${result.mdPath}`);
  } catch (error) {
    console.error('❌ レポート生成に失敗しました:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

interface ParsedArgs {
  companyId?: number;
  year?: number;
  month?: number;
  mock?: boolean;
  outputDir?: string;
}

function parseArgs(args: string[]): ParsedArgs {
  const parsed: ParsedArgs = {};

  for (const arg of args) {
    if (arg.startsWith('--companyId=')) {
      parsed.companyId = Number(arg.split('=')[1]);
    } else if (arg.startsWith('--month=')) {
      const value = arg.split('=')[1];
      if (value.includes('-')) {
        // YYYY-MM format
        const [y, m] = value.split('-').map(Number);
        parsed.year = y;
        parsed.month = m;
      } else {
        parsed.month = Number(value);
      }
    } else if (arg.startsWith('--year=')) {
      parsed.year = Number(arg.split('=')[1]);
    } else if (arg === '--mock') {
      parsed.mock = true;
    } else if (arg.startsWith('--output=')) {
      parsed.outputDir = arg.split('=')[1];
    }
  }

  return parsed;
}

main().catch((error) => {
  console.error('予期しないエラーが発生しました:', error);
  process.exit(1);
});
