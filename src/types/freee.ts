// freee API レスポンス型定義

export interface FreeeCompany {
  id: number;
  name: string;
  name_kana: string;
  display_name: string;
  role: string;
}

export interface FreeeCompaniesResponse {
  companies: FreeeCompany[];
}

export interface FreeeAccountItem {
  id: number;
  name: string;
  shortcut: string | null;
  shortcut_num: string | null;
  tax_code: number | null;
  default_tax_id: number | null;
  default_tax_code: number;
  account_category: string;
  account_category_id: number;
  categories: string[];
  available: boolean;
  walletable_id: number | null;
  group_name: string | null;
  corresponding_income_name: string | null;
  corresponding_expense_name: string | null;
}

export interface FreeeAccountItemsResponse {
  account_items: FreeeAccountItem[];
}

// 試算表（PL）
export interface FreeePLBalance {
  account_item_id: number;
  account_item_name: string;
  account_category_name: string;
  total_line: boolean;
  hierarchy_level: number;
  parent_account_category_name: string | null;
  opening_balance: number;
  debit_amount: number;
  credit_amount: number;
  closing_balance: number;
  composition_ratio: number | null;
}

export interface FreeePLResponse {
  trial_pl: {
    company_id: number;
    fiscal_year: number;
    start_month: number;
    end_month: number;
    start_date: string;
    end_date: string;
    balances: FreeePLBalance[];
  };
}

// 試算表（BS）
export interface FreeeBSBalance {
  account_item_id: number;
  account_item_name: string;
  account_category_name: string;
  total_line: boolean;
  hierarchy_level: number;
  parent_account_category_name: string | null;
  opening_balance: number;
  debit_amount: number;
  credit_amount: number;
  closing_balance: number;
  composition_ratio: number | null;
}

export interface FreeeBSResponse {
  trial_bs: {
    company_id: number;
    fiscal_year: number;
    start_month: number;
    end_month: number;
    start_date: string;
    end_date: string;
    balances: FreeeBSBalance[];
  };
}

// 取引
export interface FreeeTransaction {
  id: number;
  company_id: number;
  issue_date: string;
  due_date: string | null;
  amount: number;
  due_amount: number;
  type: 'income' | 'expense';
  partner_id: number | null;
  partner_name: string | null;
  ref_number: string | null;
  status: string;
  details: FreeeTransactionDetail[];
}

export interface FreeeTransactionDetail {
  id: number;
  account_item_id: number;
  account_item_name: string;
  tax_code: number;
  amount: number;
  vat: number;
  description: string | null;
  tag_ids: number[];
  tag_names: string[];
  section_id: number | null;
  section_name: string | null;
}

export interface FreeeTransactionsResponse {
  deals: FreeeTransaction[];
  meta: {
    total_count: number;
  };
}

// 月次推移試算表
export interface FreeePLSectionBalance {
  account_item_id: number;
  account_item_name: string;
  account_category_name: string;
  total_line: boolean;
  hierarchy_level: number;
  parent_account_category_name: string | null;
  sections: Array<{
    id: number | null;
    name: string | null;
  }>;
  monthly_balances: Array<{
    year: number;
    month: number;
    opening_balance: number;
    debit_amount: number;
    credit_amount: number;
    closing_balance: number;
  }>;
}

export interface FreeePLSectionsResponse {
  trial_pl_sections: {
    company_id: number;
    fiscal_year: number;
    balances: FreeePLSectionBalance[];
  };
}
