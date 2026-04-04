// アイテムデータ定義
// 仕様書 spec-v0.4.md のアイテム一覧表に準拠

const ITEMS = [
  {
    id: 'mouse_toy',
    name: 'ねずみのおもちゃ',
    description: 'SPD +5（戦闘開始時）',
    effect: { stat: 'spd', value: 5 },
    trigger: 'battle_start', // 戦闘開始時に発動
    cost: 3,
  },
  {
    id: 'scratching_post',
    name: '爪とぎ',
    description: 'ATK +5（戦闘開始時）',
    effect: { stat: 'atk', value: 5 },
    trigger: 'battle_start',
    cost: 3,
  },
  {
    id: 'matatabi',
    name: 'またたび',
    description: 'CHARM +5（戦闘開始時）',
    effect: { stat: 'charm', value: 5 },
    trigger: 'battle_start',
    cost: 3,
  },
  {
    id: 'cat_tower',
    name: 'キャットタワー',
    description: '攻撃を1回回避',
    effect: { type: 'dodge', count: 1 },
    trigger: 'on_hit', // 攻撃を受けたとき
    cost: 5,
  },
  {
    id: 'omamori',
    name: 'お守り',
    description: '追加効果を1回無効',
    effect: { type: 'nullify_debuff', count: 1 },
    trigger: 'on_hit',
    cost: 5,
  },
  {
    id: 'churu',
    name: 'ちゅーる',
    description: '戦闘不能時にHP全回復',
    effect: { type: 'revive' },
    trigger: 'on_ko', // 戦闘不能時
    cost: 6,
  },
  {
    id: 'collar',
    name: 'カラー',
    description: '攻撃を3回反射',
    effect: { type: 'reflect', count: 3 },
    trigger: 'on_hit',
    cost: 8,
  },
];

// アイテムIDからアイテムデータを取得（ディープコピーして返す）
function getItemById(id) {
  const item = ITEMS.find(i => i.id === id);
  return item ? JSON.parse(JSON.stringify(item)) : null;
}

// 購入可能なアイテム一覧を返す（保有ポイント以下のもの）
function getAffordableItems(points) {
  return ITEMS.filter(i => i.cost <= points);
}
