/**
 * Mock freee API response data for testing without API access.
 *
 * Company: テスト株式会社 (id: 12345)
 * A small Japanese company with realistic accounting data.
 */

import type { FreeeRawData } from '../../src/services/freee-service.js';
import type {
  FreeeCompany,
  FreeeAccountItem,
  FreeePLResponse,
  FreeeBSResponse,
  FreeePLBalance,
  FreeeBSBalance,
} from '../../src/types/freee.js';

// ---------------------------------------------------------------------------
// Helper: sequential ID generator
// ---------------------------------------------------------------------------
let _nextId = 1000;
function nextId(): number {
  return _nextId++;
}

// ---------------------------------------------------------------------------
// Company
// ---------------------------------------------------------------------------
const mockCompany: FreeeCompany = {
  id: 12345,
  name: 'テスト株式会社',
  name_kana: 'テストカブシキガイシャ',
  display_name: 'テスト株式会社',
  role: 'admin',
};

// ---------------------------------------------------------------------------
// Account Items (subset relevant for PL/BS)
// ---------------------------------------------------------------------------
const mockAccountItems: FreeeAccountItem[] = [
  // Revenue
  makeAccountItem('売上高', '売上高', 100),
  // COGS
  makeAccountItem('仕入高', '売上原価', 200),
  makeAccountItem('外注費', '売上原価', 201),
  // SGA
  makeAccountItem('給与手当', '販売費及び一般管理費', 300),
  makeAccountItem('地代家賃', '販売費及び一般管理費', 301),
  makeAccountItem('水道光熱費', '販売費及び一般管理費', 302),
  makeAccountItem('通信費', '販売費及び一般管理費', 303),
  makeAccountItem('広告宣伝費', '販売費及び一般管理費', 304),
  makeAccountItem('支払手数料', '販売費及び一般管理費', 305),
  makeAccountItem('減価償却費', '販売費及び一般管理費', 306),
  makeAccountItem('消耗品費', '販売費及び一般管理費', 307),
  makeAccountItem('旅費交通費', '販売費及び一般管理費', 308),
  makeAccountItem('接待交際費', '販売費及び一般管理費', 309),
  makeAccountItem('福利厚生費', '販売費及び一般管理費', 310),
  makeAccountItem('法定福利費', '販売費及び一般管理費', 311),
  makeAccountItem('保険料', '販売費及び一般管理費', 312),
  makeAccountItem('租税公課', '販売費及び一般管理費', 313),
  // Non-operating income/expense
  makeAccountItem('受取利息', '営業外収益', 400),
  makeAccountItem('雑収入', '営業外収益', 401),
  makeAccountItem('支払利息', '営業外費用', 500),
  // BS items
  makeAccountItem('現金', '流動資産', 600),
  makeAccountItem('普通預金', '流動資産', 601),
  makeAccountItem('売掛金', '流動資産', 602),
  makeAccountItem('前払費用', '流動資産', 603),
  makeAccountItem('未収入金', '流動資産', 604),
  makeAccountItem('建物', '固定資産', 700),
  makeAccountItem('工具器具備品', '固定資産', 701),
  makeAccountItem('ソフトウェア', '固定資産', 702),
  makeAccountItem('買掛金', '流動負債', 800),
  makeAccountItem('未払金', '流動負債', 801),
  makeAccountItem('未払費用', '流動負債', 802),
  makeAccountItem('預り金', '流動負債', 803),
  makeAccountItem('未払法人税等', '流動負債', 804),
  makeAccountItem('未払消費税等', '流動負債', 805),
  makeAccountItem('長期借入金', '固定負債', 900),
  makeAccountItem('資本金', '純資産', 950),
  makeAccountItem('繰越利益剰余金', '純資産', 951),
];

function makeAccountItem(
  name: string,
  category: string,
  idSuffix: number,
): FreeeAccountItem {
  return {
    id: idSuffix,
    name,
    shortcut: null,
    shortcut_num: null,
    tax_code: null,
    default_tax_id: null,
    default_tax_code: 0,
    account_category: category,
    account_category_id: idSuffix,
    categories: [category],
    available: true,
    walletable_id: null,
    group_name: null,
    corresponding_income_name: null,
    corresponding_expense_name: null,
  };
}

// ---------------------------------------------------------------------------
// PL Helpers
// ---------------------------------------------------------------------------
function plBalance(
  overrides: Partial<FreeePLBalance> & Pick<FreeePLBalance, 'account_item_name' | 'closing_balance'>,
): FreeePLBalance {
  return {
    account_item_id: nextId(),
    account_item_name: overrides.account_item_name,
    account_category_name: overrides.account_category_name ?? '',
    total_line: overrides.total_line ?? false,
    hierarchy_level: overrides.hierarchy_level ?? 3,
    parent_account_category_name: overrides.parent_account_category_name ?? null,
    opening_balance: overrides.opening_balance ?? 0,
    debit_amount: overrides.debit_amount ?? 0,
    credit_amount: overrides.credit_amount ?? 0,
    closing_balance: overrides.closing_balance,
    composition_ratio: overrides.composition_ratio ?? null,
  };
}

// ---------------------------------------------------------------------------
// BS Helpers
// ---------------------------------------------------------------------------
function bsBalance(
  overrides: Partial<FreeeBSBalance> & Pick<FreeeBSBalance, 'account_item_name' | 'closing_balance'>,
): FreeeBSBalance {
  return {
    account_item_id: nextId(),
    account_item_name: overrides.account_item_name,
    account_category_name: overrides.account_category_name ?? '',
    total_line: overrides.total_line ?? false,
    hierarchy_level: overrides.hierarchy_level ?? 3,
    parent_account_category_name: overrides.parent_account_category_name ?? null,
    opening_balance: overrides.opening_balance ?? 0,
    debit_amount: overrides.debit_amount ?? 0,
    credit_amount: overrides.credit_amount ?? 0,
    closing_balance: overrides.closing_balance,
    composition_ratio: overrides.composition_ratio ?? null,
  };
}

// ---------------------------------------------------------------------------
// PL Data — Current Month (2026-02)
// ---------------------------------------------------------------------------
function buildCurrentMonthPLBalances(): FreeePLBalance[] {
  return [
    // ── Revenue ──
    plBalance({
      account_item_name: '売上高',
      account_category_name: '売上高',
      total_line: true,
      hierarchy_level: 1,
      closing_balance: 8_500_000,
      credit_amount: 8_500_000,
    }),
    plBalance({
      account_item_name: '売上高',
      account_category_name: '売上高',
      total_line: false,
      hierarchy_level: 3,
      parent_account_category_name: '売上高',
      closing_balance: 8_500_000,
      credit_amount: 8_500_000,
    }),

    // ── COGS ──
    plBalance({
      account_item_name: '売上原価',
      account_category_name: '売上原価',
      total_line: true,
      hierarchy_level: 1,
      closing_balance: 2_800_000,
      debit_amount: 2_800_000,
    }),
    plBalance({
      account_item_name: '仕入高',
      account_category_name: '売上原価',
      hierarchy_level: 3,
      parent_account_category_name: '売上原価',
      closing_balance: 1_800_000,
      debit_amount: 1_800_000,
    }),
    plBalance({
      account_item_name: '外注費',
      account_category_name: '売上原価',
      hierarchy_level: 3,
      parent_account_category_name: '売上原価',
      closing_balance: 1_000_000,
      debit_amount: 1_000_000,
    }),

    // ── SGA ──
    plBalance({
      account_item_name: '販売費及び一般管理費',
      account_category_name: '販売費及び一般管理費',
      total_line: true,
      hierarchy_level: 1,
      closing_balance: 4_310_000,
      debit_amount: 4_310_000,
    }),
    plBalance({
      account_item_name: '給与手当',
      account_category_name: '販売費及び一般管理費',
      parent_account_category_name: '販売費及び一般管理費',
      closing_balance: 2_500_000,
      debit_amount: 2_500_000,
    }),
    plBalance({
      account_item_name: '法定福利費',
      account_category_name: '販売費及び一般管理費',
      parent_account_category_name: '販売費及び一般管理費',
      closing_balance: 380_000,
      debit_amount: 380_000,
    }),
    plBalance({
      account_item_name: '福利厚生費',
      account_category_name: '販売費及び一般管理費',
      parent_account_category_name: '販売費及び一般管理費',
      closing_balance: 50_000,
      debit_amount: 50_000,
    }),
    plBalance({
      account_item_name: '地代家賃',
      account_category_name: '販売費及び一般管理費',
      parent_account_category_name: '販売費及び一般管理費',
      closing_balance: 350_000,
      debit_amount: 350_000,
    }),
    plBalance({
      account_item_name: '水道光熱費',
      account_category_name: '販売費及び一般管理費',
      parent_account_category_name: '販売費及び一般管理費',
      closing_balance: 45_000,
      debit_amount: 45_000,
    }),
    plBalance({
      account_item_name: '通信費',
      account_category_name: '販売費及び一般管理費',
      parent_account_category_name: '販売費及び一般管理費',
      closing_balance: 85_000,
      debit_amount: 85_000,
    }),
    plBalance({
      account_item_name: '広告宣伝費',
      account_category_name: '販売費及び一般管理費',
      parent_account_category_name: '販売費及び一般管理費',
      closing_balance: 200_000,
      debit_amount: 200_000,
    }),
    plBalance({
      account_item_name: '支払手数料',
      account_category_name: '販売費及び一般管理費',
      parent_account_category_name: '販売費及び一般管理費',
      closing_balance: 120_000,
      debit_amount: 120_000,
    }),
    plBalance({
      account_item_name: '減価償却費',
      account_category_name: '販売費及び一般管理費',
      parent_account_category_name: '販売費及び一般管理費',
      closing_balance: 180_000,
      debit_amount: 180_000,
    }),
    plBalance({
      account_item_name: '消耗品費',
      account_category_name: '販売費及び一般管理費',
      parent_account_category_name: '販売費及び一般管理費',
      closing_balance: 65_000,
      debit_amount: 65_000,
    }),
    plBalance({
      account_item_name: '旅費交通費',
      account_category_name: '販売費及び一般管理費',
      parent_account_category_name: '販売費及び一般管理費',
      closing_balance: 95_000,
      debit_amount: 95_000,
    }),
    plBalance({
      account_item_name: '接待交際費',
      account_category_name: '販売費及び一般管理費',
      parent_account_category_name: '販売費及び一般管理費',
      closing_balance: 30_000,
      debit_amount: 30_000,
    }),
    plBalance({
      account_item_name: '保険料',
      account_category_name: '販売費及び一般管理費',
      parent_account_category_name: '販売費及び一般管理費',
      closing_balance: 60_000,
      debit_amount: 60_000,
    }),
    plBalance({
      account_item_name: '租税公課',
      account_category_name: '販売費及び一般管理費',
      parent_account_category_name: '販売費及び一般管理費',
      closing_balance: 150_000,
      debit_amount: 150_000,
    }),

    // ── Non-operating income ──
    plBalance({
      account_item_name: '営業外収益',
      account_category_name: '営業外収益',
      total_line: true,
      hierarchy_level: 1,
      closing_balance: 15_000,
      credit_amount: 15_000,
    }),
    plBalance({
      account_item_name: '受取利息',
      account_category_name: '営業外収益',
      parent_account_category_name: '営業外収益',
      closing_balance: 5_000,
      credit_amount: 5_000,
    }),
    plBalance({
      account_item_name: '雑収入',
      account_category_name: '営業外収益',
      parent_account_category_name: '営業外収益',
      closing_balance: 10_000,
      credit_amount: 10_000,
    }),

    // ── Non-operating expense ──
    plBalance({
      account_item_name: '営業外費用',
      account_category_name: '営業外費用',
      total_line: true,
      hierarchy_level: 1,
      closing_balance: 85_000,
      debit_amount: 85_000,
    }),
    plBalance({
      account_item_name: '支払利息',
      account_category_name: '営業外費用',
      parent_account_category_name: '営業外費用',
      closing_balance: 85_000,
      debit_amount: 85_000,
    }),
  ];
}

// ---------------------------------------------------------------------------
// PL Data — Previous Month (2026-01)
// ---------------------------------------------------------------------------
function buildPreviousMonthPLBalances(): FreeePLBalance[] {
  return [
    // ── Revenue ──
    plBalance({
      account_item_name: '売上高',
      account_category_name: '売上高',
      total_line: true,
      hierarchy_level: 1,
      closing_balance: 7_800_000,
      credit_amount: 7_800_000,
    }),
    plBalance({
      account_item_name: '売上高',
      account_category_name: '売上高',
      total_line: false,
      hierarchy_level: 3,
      parent_account_category_name: '売上高',
      closing_balance: 7_800_000,
      credit_amount: 7_800_000,
    }),

    // ── COGS ──
    plBalance({
      account_item_name: '売上原価',
      account_category_name: '売上原価',
      total_line: true,
      hierarchy_level: 1,
      closing_balance: 2_600_000,
      debit_amount: 2_600_000,
    }),
    plBalance({
      account_item_name: '仕入高',
      account_category_name: '売上原価',
      hierarchy_level: 3,
      parent_account_category_name: '売上原価',
      closing_balance: 1_700_000,
      debit_amount: 1_700_000,
    }),
    plBalance({
      account_item_name: '外注費',
      account_category_name: '売上原価',
      hierarchy_level: 3,
      parent_account_category_name: '売上原価',
      closing_balance: 900_000,
      debit_amount: 900_000,
    }),

    // ── SGA ──
    plBalance({
      account_item_name: '販売費及び一般管理費',
      account_category_name: '販売費及び一般管理費',
      total_line: true,
      hierarchy_level: 1,
      closing_balance: 4_180_000,
      debit_amount: 4_180_000,
    }),
    plBalance({
      account_item_name: '給与手当',
      account_category_name: '販売費及び一般管理費',
      parent_account_category_name: '販売費及び一般管理費',
      closing_balance: 2_500_000,
      debit_amount: 2_500_000,
    }),
    plBalance({
      account_item_name: '法定福利費',
      account_category_name: '販売費及び一般管理費',
      parent_account_category_name: '販売費及び一般管理費',
      closing_balance: 380_000,
      debit_amount: 380_000,
    }),
    plBalance({
      account_item_name: '福利厚生費',
      account_category_name: '販売費及び一般管理費',
      parent_account_category_name: '販売費及び一般管理費',
      closing_balance: 40_000,
      debit_amount: 40_000,
    }),
    plBalance({
      account_item_name: '地代家賃',
      account_category_name: '販売費及び一般管理費',
      parent_account_category_name: '販売費及び一般管理費',
      closing_balance: 350_000,
      debit_amount: 350_000,
    }),
    plBalance({
      account_item_name: '水道光熱費',
      account_category_name: '販売費及び一般管理費',
      parent_account_category_name: '販売費及び一般管理費',
      closing_balance: 52_000,
      debit_amount: 52_000,
    }),
    plBalance({
      account_item_name: '通信費',
      account_category_name: '販売費及び一般管理費',
      parent_account_category_name: '販売費及び一般管理費',
      closing_balance: 78_000,
      debit_amount: 78_000,
    }),
    plBalance({
      account_item_name: '広告宣伝費',
      account_category_name: '販売費及び一般管理費',
      parent_account_category_name: '販売費及び一般管理費',
      closing_balance: 150_000,
      debit_amount: 150_000,
    }),
    plBalance({
      account_item_name: '支払手数料',
      account_category_name: '販売費及び一般管理費',
      parent_account_category_name: '販売費及び一般管理費',
      closing_balance: 110_000,
      debit_amount: 110_000,
    }),
    plBalance({
      account_item_name: '減価償却費',
      account_category_name: '販売費及び一般管理費',
      parent_account_category_name: '販売費及び一般管理費',
      closing_balance: 180_000,
      debit_amount: 180_000,
    }),
    plBalance({
      account_item_name: '消耗品費',
      account_category_name: '販売費及び一般管理費',
      parent_account_category_name: '販売費及び一般管理費',
      closing_balance: 42_000,
      debit_amount: 42_000,
    }),
    plBalance({
      account_item_name: '旅費交通費',
      account_category_name: '販売費及び一般管理費',
      parent_account_category_name: '販売費及び一般管理費',
      closing_balance: 88_000,
      debit_amount: 88_000,
    }),
    plBalance({
      account_item_name: '接待交際費',
      account_category_name: '販売費及び一般管理費',
      parent_account_category_name: '販売費及び一般管理費',
      closing_balance: 55_000,
      debit_amount: 55_000,
    }),
    plBalance({
      account_item_name: '保険料',
      account_category_name: '販売費及び一般管理費',
      parent_account_category_name: '販売費及び一般管理費',
      closing_balance: 60_000,
      debit_amount: 60_000,
    }),
    plBalance({
      account_item_name: '租税公課',
      account_category_name: '販売費及び一般管理費',
      parent_account_category_name: '販売費及び一般管理費',
      closing_balance: 95_000,
      debit_amount: 95_000,
    }),

    // ── Non-operating income ──
    plBalance({
      account_item_name: '営業外収益',
      account_category_name: '営業外収益',
      total_line: true,
      hierarchy_level: 1,
      closing_balance: 12_000,
      credit_amount: 12_000,
    }),
    plBalance({
      account_item_name: '受取利息',
      account_category_name: '営業外収益',
      parent_account_category_name: '営業外収益',
      closing_balance: 5_000,
      credit_amount: 5_000,
    }),
    plBalance({
      account_item_name: '雑収入',
      account_category_name: '営業外収益',
      parent_account_category_name: '営業外収益',
      closing_balance: 7_000,
      credit_amount: 7_000,
    }),

    // ── Non-operating expense ──
    plBalance({
      account_item_name: '営業外費用',
      account_category_name: '営業外費用',
      total_line: true,
      hierarchy_level: 1,
      closing_balance: 88_000,
      debit_amount: 88_000,
    }),
    plBalance({
      account_item_name: '支払利息',
      account_category_name: '営業外費用',
      parent_account_category_name: '営業外費用',
      closing_balance: 88_000,
      debit_amount: 88_000,
    }),
  ];
}

// ---------------------------------------------------------------------------
// BS Data — Current Month End (2026-02-28)
// ---------------------------------------------------------------------------
function buildCurrentMonthBSBalances(): FreeeBSBalance[] {
  return [
    // ── 流動資産 ──
    bsBalance({
      account_item_name: '流動資産',
      account_category_name: '流動資産',
      total_line: true,
      hierarchy_level: 1,
      closing_balance: 18_950_000,
    }),
    bsBalance({
      account_item_name: '現金',
      account_category_name: '流動資産',
      parent_account_category_name: '流動資産',
      closing_balance: 850_000,
    }),
    bsBalance({
      account_item_name: '普通預金',
      account_category_name: '流動資産',
      parent_account_category_name: '流動資産',
      closing_balance: 12_300_000,
    }),
    bsBalance({
      account_item_name: '売掛金',
      account_category_name: '流動資産',
      parent_account_category_name: '流動資産',
      closing_balance: 5_200_000,
    }),
    bsBalance({
      account_item_name: '前払費用',
      account_category_name: '流動資産',
      parent_account_category_name: '流動資産',
      closing_balance: 350_000,
    }),
    bsBalance({
      account_item_name: '未収入金',
      account_category_name: '流動資産',
      parent_account_category_name: '流動資産',
      closing_balance: 250_000,
    }),

    // ── 固定資産 ──
    bsBalance({
      account_item_name: '固定資産',
      account_category_name: '固定資産',
      total_line: true,
      hierarchy_level: 1,
      closing_balance: 6_800_000,
    }),
    bsBalance({
      account_item_name: '建物',
      account_category_name: '固定資産',
      parent_account_category_name: '固定資産',
      closing_balance: 3_200_000,
    }),
    bsBalance({
      account_item_name: '工具器具備品',
      account_category_name: '固定資産',
      parent_account_category_name: '固定資産',
      closing_balance: 1_800_000,
    }),
    bsBalance({
      account_item_name: 'ソフトウェア',
      account_category_name: '固定資産',
      parent_account_category_name: '固定資産',
      closing_balance: 1_800_000,
    }),

    // ── 流動負債 ──
    bsBalance({
      account_item_name: '流動負債',
      account_category_name: '流動負債',
      total_line: true,
      hierarchy_level: 1,
      closing_balance: 6_850_000,
    }),
    bsBalance({
      account_item_name: '買掛金',
      account_category_name: '流動負債',
      parent_account_category_name: '流動負債',
      closing_balance: 2_100_000,
    }),
    bsBalance({
      account_item_name: '未払金',
      account_category_name: '流動負債',
      parent_account_category_name: '流動負債',
      closing_balance: 1_800_000,
    }),
    bsBalance({
      account_item_name: '未払費用',
      account_category_name: '流動負債',
      parent_account_category_name: '流動負債',
      closing_balance: 950_000,
    }),
    bsBalance({
      account_item_name: '預り金',
      account_category_name: '流動負債',
      parent_account_category_name: '流動負債',
      closing_balance: 420_000,
    }),
    bsBalance({
      account_item_name: '未払法人税等',
      account_category_name: '流動負債',
      parent_account_category_name: '流動負債',
      closing_balance: 880_000,
    }),
    bsBalance({
      account_item_name: '未払消費税等',
      account_category_name: '流動負債',
      parent_account_category_name: '流動負債',
      closing_balance: 700_000,
    }),

    // ── 固定負債 ──
    bsBalance({
      account_item_name: '固定負債',
      account_category_name: '固定負債',
      total_line: true,
      hierarchy_level: 1,
      closing_balance: 8_000_000,
    }),
    bsBalance({
      account_item_name: '長期借入金',
      account_category_name: '固定負債',
      parent_account_category_name: '固定負債',
      closing_balance: 8_000_000,
    }),

    // ── 純資産 ──
    bsBalance({
      account_item_name: '純資産',
      account_category_name: '純資産',
      total_line: true,
      hierarchy_level: 1,
      closing_balance: 10_900_000,
    }),
    bsBalance({
      account_item_name: '資本金',
      account_category_name: '純資産',
      parent_account_category_name: '純資産',
      closing_balance: 5_000_000,
    }),
    bsBalance({
      account_item_name: '繰越利益剰余金',
      account_category_name: '純資産',
      parent_account_category_name: '純資産',
      closing_balance: 5_900_000,
    }),
  ];
}

// ---------------------------------------------------------------------------
// BS Data — Previous Month End (2026-01-31)
// ---------------------------------------------------------------------------
function buildPreviousMonthBSBalances(): FreeeBSBalance[] {
  return [
    // ── 流動資産 ──
    bsBalance({
      account_item_name: '流動資産',
      account_category_name: '流動資産',
      total_line: true,
      hierarchy_level: 1,
      closing_balance: 17_800_000,
    }),
    bsBalance({
      account_item_name: '現金',
      account_category_name: '流動資産',
      parent_account_category_name: '流動資産',
      closing_balance: 920_000,
    }),
    bsBalance({
      account_item_name: '普通預金',
      account_category_name: '流動資産',
      parent_account_category_name: '流動資産',
      closing_balance: 11_500_000,
    }),
    bsBalance({
      account_item_name: '売掛金',
      account_category_name: '流動資産',
      parent_account_category_name: '流動資産',
      closing_balance: 4_800_000,
    }),
    bsBalance({
      account_item_name: '前払費用',
      account_category_name: '流動資産',
      parent_account_category_name: '流動資産',
      closing_balance: 330_000,
    }),
    bsBalance({
      account_item_name: '未収入金',
      account_category_name: '流動資産',
      parent_account_category_name: '流動資産',
      closing_balance: 250_000,
    }),

    // ── 固定資産 ──
    bsBalance({
      account_item_name: '固定資産',
      account_category_name: '固定資産',
      total_line: true,
      hierarchy_level: 1,
      closing_balance: 6_980_000,
    }),
    bsBalance({
      account_item_name: '建物',
      account_category_name: '固定資産',
      parent_account_category_name: '固定資産',
      closing_balance: 3_280_000,
    }),
    bsBalance({
      account_item_name: '工具器具備品',
      account_category_name: '固定資産',
      parent_account_category_name: '固定資産',
      closing_balance: 1_880_000,
    }),
    bsBalance({
      account_item_name: 'ソフトウェア',
      account_category_name: '固定資産',
      parent_account_category_name: '固定資産',
      closing_balance: 1_820_000,
    }),

    // ── 流動負債 ──
    bsBalance({
      account_item_name: '流動負債',
      account_category_name: '流動負債',
      total_line: true,
      hierarchy_level: 1,
      closing_balance: 6_480_000,
    }),
    bsBalance({
      account_item_name: '買掛金',
      account_category_name: '流動負債',
      parent_account_category_name: '流動負債',
      closing_balance: 1_950_000,
    }),
    bsBalance({
      account_item_name: '未払金',
      account_category_name: '流動負債',
      parent_account_category_name: '流動負債',
      closing_balance: 1_700_000,
    }),
    bsBalance({
      account_item_name: '未払費用',
      account_category_name: '流動負債',
      parent_account_category_name: '流動負債',
      closing_balance: 880_000,
    }),
    bsBalance({
      account_item_name: '預り金',
      account_category_name: '流動負債',
      parent_account_category_name: '流動負債',
      closing_balance: 400_000,
    }),
    bsBalance({
      account_item_name: '未払法人税等',
      account_category_name: '流動負債',
      parent_account_category_name: '流動負債',
      closing_balance: 850_000,
    }),
    bsBalance({
      account_item_name: '未払消費税等',
      account_category_name: '流動負債',
      parent_account_category_name: '流動負債',
      closing_balance: 700_000,
    }),

    // ── 固定負債 ──
    bsBalance({
      account_item_name: '固定負債',
      account_category_name: '固定負債',
      total_line: true,
      hierarchy_level: 1,
      closing_balance: 8_200_000,
    }),
    bsBalance({
      account_item_name: '長期借入金',
      account_category_name: '固定負債',
      parent_account_category_name: '固定負債',
      closing_balance: 8_200_000,
    }),

    // ── 純資産 ──
    bsBalance({
      account_item_name: '純資産',
      account_category_name: '純資産',
      total_line: true,
      hierarchy_level: 1,
      closing_balance: 10_100_000,
    }),
    bsBalance({
      account_item_name: '資本金',
      account_category_name: '純資産',
      parent_account_category_name: '純資産',
      closing_balance: 5_000_000,
    }),
    bsBalance({
      account_item_name: '繰越利益剰余金',
      account_category_name: '純資産',
      parent_account_category_name: '純資産',
      closing_balance: 5_100_000,
    }),
  ];
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Create a complete mock FreeeRawData object for testing.
 *
 * Current month: 2026-02 (revenue 8,500,000)
 * Previous month: 2026-01 (revenue 7,800,000)
 */
export function createMockRawData(): FreeeRawData {
  // Reset the ID counter so data is deterministic across calls
  _nextId = 1000;

  const currentMonthPL: FreeePLResponse = {
    trial_pl: {
      company_id: 12345,
      fiscal_year: 2026,
      start_month: 2,
      end_month: 2,
      start_date: '2026-02-01',
      end_date: '2026-02-28',
      balances: buildCurrentMonthPLBalances(),
    },
  };

  const previousMonthPL: FreeePLResponse = {
    trial_pl: {
      company_id: 12345,
      fiscal_year: 2026,
      start_month: 1,
      end_month: 1,
      start_date: '2026-01-01',
      end_date: '2026-01-31',
      balances: buildPreviousMonthPLBalances(),
    },
  };

  const currentMonthBS: FreeeBSResponse = {
    trial_bs: {
      company_id: 12345,
      fiscal_year: 2026,
      start_month: 2,
      end_month: 2,
      start_date: '2026-02-01',
      end_date: '2026-02-28',
      balances: buildCurrentMonthBSBalances(),
    },
  };

  const previousMonthBS: FreeeBSResponse = {
    trial_bs: {
      company_id: 12345,
      fiscal_year: 2026,
      start_month: 1,
      end_month: 1,
      start_date: '2026-01-01',
      end_date: '2026-01-31',
      balances: buildPreviousMonthBSBalances(),
    },
  };

  return {
    company: mockCompany,
    accountItems: mockAccountItems,
    currentMonthPL,
    previousMonthPL,
    prevPrevMonthPL: null,
    currentMonthBS,
    previousMonthBS,
  };
}
