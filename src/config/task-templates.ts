/**
 * 経理・財務の定型業務タスクテンプレート
 *
 * 月初〜月末の時系列で並べた経理業務フローをタスクとして生成する。
 * 月次の目標設定→週次の記帳・確認→月末締め→分析・報告の流れ。
 */

export interface TaskTemplate {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: 'finance' | 'accounting' | 'cashflow' | 'plan' | 'general';
  /** 月初からの日数（目安） */
  dayOffset: number;
  /** 繰り返し: monthly=月1回, weekly=週1回, once=初回のみ */
  recurrence: 'monthly' | 'weekly' | 'once';
  /** 週番号（weeklyの場合。1=第1週, 2=第2週...） */
  weekNumber?: number;
}

/**
 * 月次経理・財務業務テンプレート（時系列順）
 */
export const MONTHLY_TASK_TEMPLATES: TaskTemplate[] = [
  // ===== 月初（1日〜3日）=====
  {
    title: '月次目標数字の設定・確認',
    description: '当月の売上目標・利益目標・経費予算を設定する。事業計画との整合性を確認。\n\n【確認項目】\n- 売上目標額\n- 粗利目標\n- 経常利益目標\n- 主要経費の予算枠\n- 前月の目標達成率の振り返り',
    priority: 'high',
    category: 'plan',
    dayOffset: 1,
    recurrence: 'monthly',
  },
  {
    title: '前月の売上・入金確認',
    description: '前月末の売上計上と入金状況を確認。売掛金の残高を確認し、未入金があれば請求フォローを行う。',
    priority: 'high',
    category: 'accounting',
    dayOffset: 1,
    recurrence: 'monthly',
  },
  {
    title: '前月の経費精算・未払計上',
    description: '前月分の経費精算を完了させる。未払金・未払費用の計上漏れがないか確認。\n領収書・レシートの整理と会計ソフトへの登録。',
    priority: 'high',
    category: 'accounting',
    dayOffset: 2,
    recurrence: 'monthly',
  },
  {
    title: '預金残高の照合',
    description: '銀行の預金残高と帳簿残高を照合する。不一致がないか確認し、差異があれば原因を調査。',
    priority: 'high',
    category: 'accounting',
    dayOffset: 3,
    recurrence: 'monthly',
  },
  {
    title: '資金繰り表の更新',
    description: '当月の入出金予定を更新。大口の支払予定、入金予定を確認し、資金ショートのリスクがないかチェック。',
    priority: 'high',
    category: 'cashflow',
    dayOffset: 3,
    recurrence: 'monthly',
  },

  // ===== 第1週（記帳・確認）=====
  {
    title: '【第1週】記帳・仕訳入力',
    description: '週次の取引を会計ソフトに入力する。\n\n【チェックリスト】\n- 売上の計上\n- 仕入・外注費の計上\n- 経費の入力（領収書ベース）\n- 銀行明細との照合\n- クレジットカード明細の確認',
    priority: 'medium',
    category: 'accounting',
    dayOffset: 7,
    recurrence: 'weekly',
    weekNumber: 1,
  },
  {
    title: '【第1週】売上進捗の確認',
    description: '月次売上目標に対する第1週の進捗を確認。目標に対して順調かどうかを判断し、遅れている場合は対策を検討。',
    priority: 'medium',
    category: 'plan',
    dayOffset: 7,
    recurrence: 'weekly',
    weekNumber: 1,
  },

  // ===== 第2週 =====
  {
    title: '【第2週】記帳・仕訳入力',
    description: '第2週分の取引を会計ソフトに入力する。\n前週の入力漏れがないかも合わせて確認。',
    priority: 'medium',
    category: 'accounting',
    dayOffset: 14,
    recurrence: 'weekly',
    weekNumber: 2,
  },
  {
    title: '【第2週】売上・経費の中間確認',
    description: '月の折り返し地点での売上・経費の進捗確認。\n\n- 売上目標の達成率（50%ラインの確認）\n- 経費の使いすぎがないか\n- 異常な支出がないか',
    priority: 'medium',
    category: 'plan',
    dayOffset: 14,
    recurrence: 'weekly',
    weekNumber: 2,
  },
  {
    title: '請求書の発行',
    description: '当月分の請求書を発行する。請求漏れがないか取引先一覧と照合。\n\n- 請求書の作成・送付\n- インボイス番号の確認\n- 支払期日の設定',
    priority: 'high',
    category: 'accounting',
    dayOffset: 15,
    recurrence: 'monthly',
  },

  // ===== 第3週 =====
  {
    title: '【第3週】記帳・仕訳入力',
    description: '第3週分の取引を会計ソフトに入力する。',
    priority: 'medium',
    category: 'accounting',
    dayOffset: 21,
    recurrence: 'weekly',
    weekNumber: 3,
  },
  {
    title: '【第3週】目標達成見込みの判断',
    description: '月次目標の達成見込みを判断する。\n\n- 残り1週間で必要な売上額の算出\n- 達成が難しい場合の対策検討\n- 経費の着地見込み確認',
    priority: 'medium',
    category: 'plan',
    dayOffset: 21,
    recurrence: 'weekly',
    weekNumber: 3,
  },
  {
    title: '給与計算の準備',
    description: '当月分の給与計算に必要なデータを整理する。\n\n- 勤怠データの確認\n- 残業時間の集計\n- 社会保険料の確認\n- 所得税の確認',
    priority: 'high',
    category: 'accounting',
    dayOffset: 20,
    recurrence: 'monthly',
  },

  // ===== 第4週〜月末 =====
  {
    title: '【第4週】記帳・仕訳入力',
    description: '第4週分の取引を会計ソフトに入力する。月末の取引は漏れなく計上。',
    priority: 'medium',
    category: 'accounting',
    dayOffset: 28,
    recurrence: 'weekly',
    weekNumber: 4,
  },
  {
    title: '給与の支払い',
    description: '当月分の給与を支払う。振込手続きと給与明細の配布。\n源泉所得税・住民税の預り金を計上。',
    priority: 'high',
    category: 'accounting',
    dayOffset: 25,
    recurrence: 'monthly',
  },
  {
    title: '買掛金・未払金の支払い',
    description: '当月支払期日の買掛金・未払金を支払う。支払一覧と請求書を照合し、振込手続き。',
    priority: 'high',
    category: 'accounting',
    dayOffset: 25,
    recurrence: 'monthly',
  },
  {
    title: '月次締め処理',
    description: '当月の会計データを締める。\n\n【チェックリスト】\n- 全取引の入力完了確認\n- 売掛金・買掛金の残高確認\n- 現金・預金残高の照合\n- 仮払金・仮受金の精算\n- 減価償却費の計上\n- 前払費用・未払費用の計上',
    priority: 'high',
    category: 'accounting',
    dayOffset: 28,
    recurrence: 'monthly',
  },

  // ===== 月末〜翌月初 =====
  {
    title: '月次決算・試算表の確認',
    description: '月次の試算表（PL/BS）を出力し、異常値がないか確認する。\n\n- 売上高の妥当性\n- 粗利率の変動\n- 経費の前月比較\n- 残高の整合性',
    priority: 'high',
    category: 'finance',
    dayOffset: 29,
    recurrence: 'monthly',
  },
  {
    title: '月次目標の達成度確認',
    description: '月初に設定した目標数字との比較。\n\n- 売上目標 vs 実績\n- 利益目標 vs 実績\n- 経費予算 vs 実績\n- 未達の場合の原因分析\n- 翌月の目標への反映',
    priority: 'high',
    category: 'plan',
    dayOffset: 30,
    recurrence: 'monthly',
  },
  {
    title: '経営レポートの出力・確認',
    description: 'AI CFOでレポートを出力し、経営者に報告する。\n\n- ダッシュボードの確認\n- レポートPDFの出力\n- 異常値・リスクアラートの確認\n- 経営者への報告・共有',
    priority: 'medium',
    category: 'finance',
    dayOffset: 30,
    recurrence: 'monthly',
  },
  {
    title: '消費税の中間確認',
    description: '消費税の仮受・仮払の状況を確認。インボイスの保存状況もチェック。',
    priority: 'low',
    category: 'accounting',
    dayOffset: 30,
    recurrence: 'monthly',
  },
  {
    title: '翌月の資金繰り計画',
    description: '翌月の入出金予定を確認し、資金繰り計画を作成する。\n大口の支払いや入金予定を整理。',
    priority: 'medium',
    category: 'cashflow',
    dayOffset: 30,
    recurrence: 'monthly',
  },
];

/**
 * 指定月のタスクを生成する
 */
export function generateMonthlyTasks(year: number, month: number): {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: 'finance' | 'accounting' | 'cashflow' | 'plan' | 'general';
  dueDate: string;
  source: 'manual';
  status: 'todo';
}[] {
  const lastDay = new Date(year, month, 0).getDate();

  return MONTHLY_TASK_TEMPLATES.map(t => {
    const day = Math.min(t.dayOffset, lastDay);
    const dueDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    return {
      title: `[${year}/${month}月] ${t.title}`,
      description: t.description,
      priority: t.priority,
      category: t.category,
      dueDate,
      source: 'manual' as const,
      status: 'todo' as const,
    };
  });
}
