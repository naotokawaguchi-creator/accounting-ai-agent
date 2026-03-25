import { FreeeApiClient } from '../clients/freee-api.js';
import { FreeeAuthClient } from '../clients/freee-auth.js';
import { logger } from '../utils/logger.js';
import { parsePLResponse } from '../domain/accounting/pl-parser.js';
import { parseBSResponse } from '../domain/accounting/bs-parser.js';
import type {
  FreeeCompany,
  FreeeAccountItem,
  FreeePLResponse,
  FreeeBSResponse,
} from '../types/freee.js';
import type { TrendData, MonthlySnapshot } from '../types/trend.js';

export interface FreeeRawData {
  company: FreeeCompany;
  accountItems: FreeeAccountItem[];
  currentMonthPL: FreeePLResponse;
  previousMonthPL: FreeePLResponse;
  prevPrevMonthPL: FreeePLResponse | null;  // 前々月PL（単月算出用）
  currentMonthBS: FreeeBSResponse;
  previousMonthBS: FreeeBSResponse;
}

/**
 * freee APIからのデータ取得を統括するサービス層
 *
 * APIクライアントを使い、レポート生成に必要なデータをまとめて取得する。
 */
export class FreeeService {
  private apiClient: FreeeApiClient;

  constructor(authClient: FreeeAuthClient) {
    this.apiClient = new FreeeApiClient(authClient);
  }

  /** 事業所一覧を取得 */
  async getCompanies(): Promise<FreeeCompany[]> {
    const response = await this.apiClient.getCompanies();
    return response.companies;
  }

  /** 事業所詳細（会計年度情報含む）を取得 */
  async getCompanyDetail(companyId: number): Promise<any> {
    return this.apiClient.getCompanyDetail(companyId);
  }

  /** 月次レポートに必要なデータを一括取得 */
  async fetchMonthlyData(companyId: number, year: number, month: number): Promise<FreeeRawData> {
    logger.info(`=== ${year}年${month}月のデータ取得を開始 ===`);

    // 事業所情報を取得
    const companies = await this.getCompanies();
    const company = companies.find((c) => c.id === companyId);
    if (!company) {
      throw new Error(`事業所ID ${companyId} が見つかりません。`);
    }
    logger.info(`事業所: ${company.display_name}`);

    // 勘定科目を取得
    const accountItemsResponse = await this.apiClient.getAccountItems(companyId);

    // 事業所の会計年度を自動検出
    const companyDetail = await this.apiClient.getCompanyDetail(companyId);
    const fiscalYears: Array<{ start_date: string; end_date: string }> = companyDetail.fiscal_years || [];

    // 指定月が含まれる会計年度を探す。見つからなければ最新の会計年度を使用
    let fiscalYear = year;
    if (fiscalYears.length > 0) {
      const targetDate = `${year}-${String(month).padStart(2, '0')}-15`;
      const matched = fiscalYears.find(fy => targetDate >= fy.start_date && targetDate <= fy.end_date);
      if (matched) {
        fiscalYear = parseInt(matched.start_date.substring(0, 4));
      } else {
        // 指定期間がなければ最新の会計年度で取得
        const latest = fiscalYears.sort((a, b) => b.start_date.localeCompare(a.start_date))[0];
        fiscalYear = parseInt(latest.start_date.substring(0, 4));
        // 月も会計年度内に収める
        const endMonth = parseInt(latest.end_date.substring(5, 7));
        if (month > endMonth || year > parseInt(latest.end_date.substring(0, 4))) {
          month = endMonth;
          year = parseInt(latest.end_date.substring(0, 4));
        }
        logger.info(`指定期間にデータなし。最新の会計年度 ${latest.start_date}〜${latest.end_date} を使用`);
      }
    }
    logger.info(`会計年度: ${fiscalYear}年 対象月: ${year}年${month}月`);

    // 前月・前々月の年月を計算
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevFiscalYear = prevMonth === 12 && month === 1 ? fiscalYear - 1 : fiscalYear;

    const ppMonth = prevMonth === 1 ? 12 : prevMonth - 1;
    const ppFiscalYear = ppMonth === 12 && prevMonth === 1 ? prevFiscalYear - 1 : prevFiscalYear;

    // 当月・前月・前々月のPL + BS を並列取得
    const [currentMonthPL, previousMonthPL, prevPrevMonthPL, currentMonthBS, previousMonthBS] = await Promise.all([
      this.apiClient.getTrialPL(companyId, fiscalYear, month, month),
      this.apiClient.getTrialPL(companyId, prevFiscalYear, prevMonth, prevMonth),
      this.apiClient.getTrialPL(companyId, ppFiscalYear, ppMonth, ppMonth).catch(() => null),
      this.apiClient.getTrialBS(companyId, fiscalYear, month, month),
      this.apiClient.getTrialBS(companyId, prevFiscalYear, prevMonth, prevMonth),
    ]);

    logger.info('=== データ取得完了 ===');

    return {
      company,
      accountItems: accountItemsResponse.account_items,
      currentMonthPL,
      previousMonthPL,
      prevPrevMonthPL,
      currentMonthBS,
      previousMonthBS,
    };
  }

  /**
   * 複数月のPL/BSを取得してトレンドデータを生成する
   *
   * ダッシュボードのグラフ（売上・利益推移、現預金推移、費用推移）で使用。
   * 指定月から遡って monthCount 分のデータを並列取得する。
   */
  async fetchTrendData(companyId: number, endYear: number, endMonth: number, monthCount: number = 6): Promise<TrendData> {
    logger.info(`=== トレンドデータ取得開始: ${endYear}年${endMonth}月から${monthCount}か月分 ===`);

    // 事業所の会計年度情報を取得
    const companyDetail = await this.apiClient.getCompanyDetail(companyId);
    const fiscalYears: Array<{ start_date: string; end_date: string }> = companyDetail.fiscal_years || [];

    // 対象月のリストを生成（過去→現在の順）
    const targetMonths: Array<{ year: number; month: number }> = [];
    for (let i = monthCount - 1; i >= 0; i--) {
      let m = endMonth - i;
      let y = endYear;
      while (m <= 0) { m += 12; y -= 1; }
      targetMonths.push({ year: y, month: m });
    }

    // 各月のPL/BSを取得（レート制限回避のため2か月ずつ順次取得）
    const fetchMonth = async ({ year, month }: { year: number; month: number }): Promise<MonthlySnapshot | null> => {
      // 会計年度を判定
      let fiscalYear = year;
      if (fiscalYears.length > 0) {
        const targetDate = `${year}-${String(month).padStart(2, '0')}-15`;
        const matched = fiscalYears.find(fy => targetDate >= fy.start_date && targetDate <= fy.end_date);
        if (matched) {
          fiscalYear = parseInt(matched.start_date.substring(0, 4));
        }
      }

      try {
        logger.info(`  ${year}年${month}月 取得中 (fiscal_year=${fiscalYear})...`);
        const [plRes, bsRes] = await Promise.all([
          this.apiClient.getTrialPL(companyId, fiscalYear, month, month),
          this.apiClient.getTrialBS(companyId, fiscalYear, month, month),
        ]);

        const pl = parsePLResponse(plRes, year, month);
        const bs = parseBSResponse(bsRes, year, month);

        return {
          year,
          month,
          revenue: pl.revenue,
          costOfSales: pl.costOfSales,
          grossProfit: pl.grossProfit,
          sgaExpenses: pl.sgaExpenses,
          operatingIncome: pl.operatingIncome,
          ordinaryIncome: pl.ordinaryIncome,
          cashAndDeposits: bs.cashAndDeposits,
          currentAssets: bs.currentAssets,
          currentLiabilities: bs.currentLiabilities,
          totalAssets: bs.totalAssets,
          netAssets: bs.netAssets,
        };
      } catch (error) {
        logger.warn(`${year}年${month}月のデータ取得に失敗:`, error instanceof Error ? error.message : error);
        return null;
      }
    };

    // 2か月ずつバッチ処理（freee APIレート制限: 5リクエスト/秒）
    const results: (MonthlySnapshot | null)[] = [];
    const batchSize = 2;
    for (let i = 0; i < targetMonths.length; i += batchSize) {
      const batch = targetMonths.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(fetchMonth));
      results.push(...batchResults);
      // 次のバッチの前に少し待つ（レート制限回避）
      if (i + batchSize < targetMonths.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    const cumulativeMonths = results.filter((r): r is MonthlySnapshot => r !== null);

    // freeeのclosing_balanceは期首からの累計値のため、前月との差分で単月値を算出
    // BSの残高項目（現預金、資産、負債、純資産）はそのまま使用（ストック値）
    const months: MonthlySnapshot[] = cumulativeMonths.map((current, index) => {
      if (index === 0) {
        // 最初の月は期首からの累計がそのまま単月値
        // ただし期首月でない場合は前月データがないため累計のまま
        // → 前月の累計を取得して差分を出すのが理想だが、ここでは近似値として扱う
        return current;
      }
      const prev = cumulativeMonths[index - 1];
      return {
        year: current.year,
        month: current.month,
        // PL項目: 累計の差分 = 単月値
        revenue: current.revenue - prev.revenue,
        costOfSales: current.costOfSales - prev.costOfSales,
        grossProfit: current.grossProfit - prev.grossProfit,
        sgaExpenses: current.sgaExpenses - prev.sgaExpenses,
        operatingIncome: current.operatingIncome - prev.operatingIncome,
        ordinaryIncome: current.ordinaryIncome - prev.ordinaryIncome,
        // BS項目: ストック値なのでそのまま
        cashAndDeposits: current.cashAndDeposits,
        currentAssets: current.currentAssets,
        currentLiabilities: current.currentLiabilities,
        totalAssets: current.totalAssets,
        netAssets: current.netAssets,
      };
    });

    logger.info(`=== トレンドデータ取得完了: ${months.length}/${monthCount}か月分 ===`);

    // 目標データは現時点では空（将来的に事業計画から取得）
    return { months, targets: [] };
  }
}
