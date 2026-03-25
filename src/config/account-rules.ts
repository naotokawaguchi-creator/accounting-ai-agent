/**
 * 勘定科目ルール一覧
 *
 * AIによる仕訳生成時に、このルールに基づいて勘定科目を判定する。
 * ルールの追加・変更はこのファイルを編集するだけで反映される。
 */

export interface AccountRule {
  /** 勘定科目名 */
  account: string;
  /** 説明 */
  description: string;
  /** 判定キーワード・条件 */
  keywords: string[];
  /** 金額条件（任意） */
  amountCondition?: {
    type: 'perPerson' | 'perItem' | 'total';
    threshold: number;
    operator: 'lt' | 'gte';
  };
  /** 具体例 */
  examples: string[];
}

export const ACCOUNT_RULES: AccountRule[] = [
  {
    account: '仕入',
    description: '販売目的で外部から物を仕入れた時にかかった費用。商品や原材料の購入代金',
    keywords: ['仕入', '原材料', '商品購入', '卸', '問屋'],
    examples: ['商品仕入', '原材料購入'],
  },
  {
    account: '減価償却費',
    description: '10万円以上の物。車、パソコンなど',
    keywords: ['車', 'パソコン', 'PC', '機械', '設備'],
    amountCondition: { type: 'perItem', threshold: 100_000, operator: 'gte' },
    examples: ['パソコン購入（10万円以上）', '車両購入', '業務用機械'],
  },
  {
    account: '消耗品費',
    description: '日用品、備品、文具、用紙、名刺。1つ10万円未満のもの',
    keywords: ['文具', '用紙', 'コピー用紙', 'トナー', 'インク', '電池', '掃除用品', '日用品', '備品', 'USB', 'ケーブル', '名刺'],
    amountCondition: { type: 'perItem', threshold: 100_000, operator: 'lt' },
    examples: ['ボールペン', 'A4用紙', 'USBメモリ', '名刺印刷'],
  },
  {
    account: '新聞図書費',
    description: '新聞、本、雑誌',
    keywords: ['新聞', '書籍', '本', '雑誌', '図書', 'kindle', 'Amazon.*本', '専門書'],
    examples: ['日経新聞', 'ビジネス書', '業界誌'],
  },
  {
    account: '会議費',
    description: 'お茶代などの1人9,999円以下の飲食費',
    keywords: ['カフェ', 'コーヒー', 'スタバ', 'タリーズ', 'ドトール', 'お茶', '打ち合わせ', 'ランチ', '弁当'],
    amountCondition: { type: 'perPerson', threshold: 10_000, operator: 'lt' },
    examples: ['打ち合わせ時のカフェ代', '会議用弁当', '来客用お茶'],
  },
  {
    account: '接待交際費',
    description: '1人10,000円以上の飲食費。カラオケやボーリングなどの付き合い。お土産、贈答品、祝い金、香典',
    keywords: ['居酒屋', '焼肉', '寿司', '懇親会', '歓迎会', '送別会', 'カラオケ', 'ボーリング', 'お土産', '贈答', '祝い金', '香典', 'お中元', 'お歳暮', 'ギフト'],
    amountCondition: { type: 'perPerson', threshold: 10_000, operator: 'gte' },
    examples: ['取引先との会食', 'お歳暮', '香典', '接待ゴルフ'],
  },
  {
    account: '旅費交通費',
    description: 'タクシー、電車、バス、新幹線、飛行機などの移動費',
    keywords: ['タクシー', '電車', 'バス', '新幹線', '飛行機', 'JR', '地下鉄', 'Suica', 'PASMO', 'ICOCA', '航空券', '出張', '交通'],
    examples: ['電車代', 'タクシー代', '出張の新幹線', '航空券'],
  },
  {
    account: '水道光熱費',
    description: '電気、ガス、水道。居住用兼用の場合は電気のみ。事業使用が明らかならガス・水道も可',
    keywords: ['電気', 'ガス', '水道', '東京電力', '関西電力', '東京ガス', '光熱'],
    examples: ['電気代', 'ガス代', '水道代'],
  },
  {
    account: '地代家賃',
    description: '家賃、月極など固定の駐車場',
    keywords: ['家賃', '月極駐車場', '事務所賃料', 'テナント', '倉庫賃料'],
    examples: ['事務所家賃', '月極駐車場代'],
  },
  {
    account: '車両費',
    description: '車に使った費用。ガソリン代、一時的な駐車場、車検、高速、オイル交換',
    keywords: ['ガソリン', '軽油', '駐車場', 'パーキング', '車検', '高速', 'ETC', 'オイル交換', '洗車', 'タイヤ', 'エネオス', '出光', 'コスモ'],
    examples: ['ガソリン代', 'コインパーキング', '高速代', '車検費用'],
  },
  {
    account: '損害保険料',
    description: '自動車保険、火災保険',
    keywords: ['自動車保険', '火災保険', '損害保険', '賠償保険'],
    examples: ['自動車保険料', '事務所火災保険'],
  },
  {
    account: '修繕費',
    description: '車両、備品、建物、機械などの修理費用',
    keywords: ['修理', '修繕', '補修', 'メンテナンス', '修復'],
    examples: ['パソコン修理', '事務所の修繕', '機械メンテナンス'],
  },
  {
    account: '広告宣伝費',
    description: '名刺、チラシ、広告のために使った費用',
    keywords: ['広告', 'チラシ', 'ポスター', '看板', 'Google広告', 'Facebook広告', 'SNS広告', 'リスティング', 'SEO', 'PR'],
    examples: ['Google広告費', 'チラシ印刷', 'Web広告'],
  },
  {
    account: '支払手数料',
    description: '銀行の振込手数料、専門家への手数料、クリーニング',
    keywords: ['振込手数料', '手数料', 'クリーニング', '税理士', '弁護士', '司法書士', '行政書士', '顧問料', 'コンサル'],
    examples: ['銀行振込手数料', 'クリーニング代', '税理士顧問料'],
  },
  {
    account: '荷造運賃',
    description: '引越し代、宅配便',
    keywords: ['宅配', '宅急便', '引越', 'ヤマト', '佐川', '日本郵便', 'ゆうパック', '配送'],
    examples: ['宅配便代', '引越し費用', '商品発送料'],
  },
  {
    account: '通信費',
    description: '携帯、Wi-Fi、インターネット回線、郵便関連（切手、はがき）',
    keywords: ['携帯', 'スマホ', 'Wi-Fi', 'インターネット', '回線', 'NTT', '切手', 'はがき', 'レターパック', 'ドコモ', 'au', 'ソフトバンク', 'サーバー', 'ドメイン'],
    examples: ['携帯電話代', 'インターネット回線', '切手代', 'サーバー費用'],
  },
  {
    account: '販売促進費',
    description: '直接的な販売促進のためにかかった費用。サンプル、おまけ、試供品で使う商品など',
    keywords: ['サンプル', '試供品', 'おまけ', 'ノベルティ', '販促', 'キャンペーン'],
    examples: ['試供品配布', 'ノベルティ製作', '販促キャンペーン'],
  },
  {
    account: '諸会費',
    description: '町内会費、カード年会費、各種組合費',
    keywords: ['会費', '年会費', '町内会', '組合費', '商工会', '協会'],
    examples: ['商工会議所年会費', 'カード年会費', '業界団体会費'],
  },
  {
    account: '租税公課',
    description: '収入印紙、自動車税、固定資産税、償却資産税、事業税',
    keywords: ['印紙', '自動車税', '固定資産税', '事業税', '償却資産税', '登録免許税', '不動産取得税'],
    examples: ['収入印紙', '自動車税', '固定資産税'],
  },
  {
    account: '支払利息',
    description: '借入金の利息部分',
    keywords: ['利息', '金利', 'ローン利息'],
    examples: ['銀行借入の利息', '事業ローン利息'],
  },
  {
    account: '業務委託費',
    description: '業務を外部へ委託した費用',
    keywords: ['業務委託', '外注', '委託', 'アウトソーシング', 'フリーランス'],
    examples: ['デザイン外注', 'システム開発委託', '清掃業務委託'],
  },
  {
    account: '賃借料',
    description: '貸会議室、会場代',
    keywords: ['貸会議室', '会場', 'レンタルスペース', 'コワーキング', 'レンタル'],
    examples: ['貸会議室代', 'イベント会場費', 'レンタルスペース'],
  },
  {
    account: '福利厚生費',
    description: '従業員の福利厚生のための支出。慰安旅行、健康診断など',
    keywords: ['健康診断', '慰安旅行', '社員旅行', '忘年会', '新年会', 'レクリエーション', '福利厚生'],
    examples: ['健康診断費用', '社員旅行', '忘年会費用'],
  },
  {
    account: '研修費',
    description: 'セミナー、資格取得など。スキルアップのための費用',
    keywords: ['セミナー', '研修', '資格', '講習', '勉強会', 'スクール', '受験料', '講座'],
    examples: ['ビジネスセミナー参加費', '資格受験料', 'オンライン講座'],
  },
];

/**
 * AI仕訳プロンプト用にルールをテキスト化
 */
export function accountRulesToPrompt(): string {
  return ACCOUNT_RULES.map((rule, i) => {
    let text = `${i + 1}. ${rule.account}\n`;
    text += `   説明: ${rule.description}\n`;
    if (rule.amountCondition) {
      const { type, threshold, operator } = rule.amountCondition;
      const typeLabel = type === 'perPerson' ? '1人あたり' : type === 'perItem' ? '1つあたり' : '合計';
      const opLabel = operator === 'lt' ? '未満' : '以上';
      text += `   金額条件: ${typeLabel}${threshold.toLocaleString()}円${opLabel}\n`;
    }
    text += `   具体例: ${rule.examples.join('、')}`;
    return text;
  }).join('\n\n');
}
