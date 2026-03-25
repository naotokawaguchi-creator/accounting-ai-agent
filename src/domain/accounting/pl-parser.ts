import type { FreeePLResponse, FreeePLBalance } from '../../types/freee.js';
import type { MonthlyPL, ExpenseItem } from '../../types/accounting.js';

/**
 * freee試算表(PL)レスポンスを内部MonthlyPL型に変換する
 *
 * freeeのPLは勘定科目ごとのbalancesとして返される。
 * total_line=true の行が合計行で、account_category_nameで分類を判定する。
 */
export function parsePLResponse(plResponse: FreeePLResponse, year: number, month: number): MonthlyPL {
  const balances = plResponse.trial_pl.balances;

  const revenue = findTotalByCategory(balances, '売上高') ?? 0;
  const costOfSales = findTotalByCategory(balances, '売上原価') ?? 0;
  const grossProfit = revenue - costOfSales;

  const sgaExpenses = findTotalByCategory(balances, '販売費及び一般管理費')
    ?? findTotalByCategory(balances, '販売管理費') ?? 0;
  const operatingIncome = grossProfit - sgaExpenses;

  const nonOperatingIncome = findTotalByCategory(balances, '営業外収益') ?? 0;
  const nonOperatingExpenses = findTotalByCategory(balances, '営業外費用') ?? 0;
  const ordinaryIncome = operatingIncome + nonOperatingIncome - nonOperatingExpenses;

  const extraordinaryIncome = findTotalByCategory(balances, '特別利益') ?? 0;
  const extraordinaryLoss = findTotalByCategory(balances, '特別損失') ?? 0;
  const netIncome = ordinaryIncome + extraordinaryIncome - extraordinaryLoss;

  // 費用科目の内訳を抽出（販管費の明細）
  const expenseBreakdown = extractExpenseItems(balances);

  return {
    year,
    month,
    revenue,
    costOfSales,
    grossProfit,
    sgaExpenses,
    operatingIncome,
    nonOperatingIncome,
    nonOperatingExpenses,
    ordinaryIncome,
    extraordinaryIncome,
    extraordinaryLoss,
    netIncome,
    expenseBreakdown,
  };
}

/**
 * カテゴリ名で合計行のclosing_balanceを取得
 *
 * TODO: freee APIの実際のaccount_category_nameの値を確認して調整が必要
 * 現在は一般的な日本語名で検索している
 */
function findTotalByCategory(balances: FreeePLBalance[], categoryName: string): number | null {
  // まず完全一致のtotal_lineを探す
  const totalLine = balances.find(
    (b) => b.total_line && b.account_category_name === categoryName
  );
  if (totalLine) return totalLine.closing_balance;

  // total_lineがない場合、個別科目の合計を計算
  const items = balances.filter(
    (b) => !b.total_line && b.account_category_name === categoryName
  );
  if (items.length > 0) {
    return items.reduce((sum, item) => sum + item.closing_balance, 0);
  }

  // parent_account_category_nameでも検索
  const parentItems = balances.filter(
    (b) => b.total_line && b.parent_account_category_name === categoryName
  );
  if (parentItems.length > 0) {
    return parentItems.reduce((sum, item) => sum + item.closing_balance, 0);
  }

  return null;
}

/** 費用科目の内訳を抽出 */
function extractExpenseItems(balances: FreeePLBalance[]): ExpenseItem[] {
  return balances
    .filter((b) => !b.total_line && isCostCategory(b.account_category_name))
    .map((b) => ({
      accountId: b.account_item_id,
      accountName: b.account_item_name,
      categoryName: b.account_category_name,
      amount: b.closing_balance,
    }))
    .filter((item) => item.amount !== 0)
    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
}

function isCostCategory(categoryName: string): boolean {
  const costCategories = [
    '売上原価',
    '販売費及び一般管理費',
    '販売管理費',
    '営業外費用',
    '特別損失',
  ];
  return costCategories.includes(categoryName);
}
