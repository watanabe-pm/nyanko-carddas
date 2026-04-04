// カードデータ定義
// 仕様書 spec-v0.4.md のカード一覧表に準拠

const CARDS = [
  // ===== N レアリティ =====
  {
    id: 'mikeneko',
    name: '三毛猫',
    rarity: 'N',
    hp: 25,
    maxHp: 25,
    atk: 10,
    charm: 12,
    spd: 8,
  },
  {
    id: 'kuroneko',
    name: '黒猫',
    rarity: 'N',
    hp: 20,
    maxHp: 20,
    atk: 12,
    charm: 8,
    spd: 12,
  },
  {
    id: 'shironeko',
    name: '白猫',
    rarity: 'N',
    hp: 30,
    maxHp: 30,
    atk: 8,
    charm: 10,
    spd: 10,
  },
  {
    id: 'toraneko',
    name: 'トラ猫',
    rarity: 'N',
    hp: 22,
    maxHp: 22,
    atk: 12,
    charm: 8,
    spd: 10,
  },
  {
    id: 'sabineko',
    name: 'サビ猫',
    rarity: 'N',
    hp: 28,
    maxHp: 28,
    atk: 8,
    charm: 12,
    spd: 9,
  },
  {
    id: 'hachiware',
    name: 'ハチワレ',
    rarity: 'N',
    hp: 25,
    maxHp: 25,
    atk: 10,
    charm: 10,
    spd: 10,
  },
  {
    id: 'chatoraneko',
    name: 'チャトラ',
    rarity: 'N',
    hp: 22,
    maxHp: 22,
    atk: 11,
    charm: 9,
    spd: 11,
  },
  {
    id: 'kijitoraneko',
    name: 'キジトラ',
    rarity: 'N',
    hp: 20,
    maxHp: 20,
    atk: 12,
    charm: 8,
    spd: 12,
  },

  // ===== R レアリティ =====
  {
    id: 'american_shorthair',
    name: 'アメショ',
    rarity: 'R',
    hp: 35,
    maxHp: 35,
    atk: 15,
    charm: 15,
    spd: 15,
  },
  {
    id: 'russian_blue',
    name: 'ロシアンブルー',
    rarity: 'R',
    hp: 40,
    maxHp: 40,
    atk: 13,
    charm: 18,
    spd: 13,
  },
  {
    id: 'bengal',
    name: 'ベンガル',
    rarity: 'R',
    hp: 30,
    maxHp: 30,
    atk: 18,
    charm: 13,
    spd: 18,
  },
  {
    id: 'norwegian',
    name: 'ノルウェージャン',
    rarity: 'R',
    hp: 40,
    maxHp: 40,
    atk: 15,
    charm: 15,
    spd: 13,
  },
  {
    id: 'ragdoll',
    name: 'ラグドール',
    rarity: 'R',
    hp: 38,
    maxHp: 38,
    atk: 13,
    charm: 18,
    spd: 14,
  },

  // ===== SR レアリティ =====
  {
    id: 'lion',
    name: 'ライオン',
    rarity: 'SR',
    hp: 45,
    maxHp: 45,
    atk: 30,
    charm: 15,
    spd: 18,
  },
  {
    id: 'munchkin',
    name: 'マンチカン',
    rarity: 'SR',
    hp: 45,
    maxHp: 45,
    atk: 15,
    charm: 30,
    spd: 18,
  },

  // ===== LR レアリティ =====
  {
    id: 'maneki_neko',
    name: '招き猫',
    rarity: 'LR',
    hp: 60,
    maxHp: 60,
    atk: 35,
    charm: 35,
    spd: 25,
  },
];

// レアリティごとのドロー時アイテムポイント
const RARITY_ITEM_POINTS = {
  N: 3,
  R: 5,
  SR: 8,
  LR: 12,
};

// カードIDからカードデータを取得（ディープコピーして返す）
function getCardById(id) {
  const card = CARDS.find(c => c.id === id);
  return card ? JSON.parse(JSON.stringify(card)) : null;
}

// 全16種からランダムで指定枚数をドローする（重複なし）
function drawCards(count) {
  const shuffled = [...CARDS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map(c => JSON.parse(JSON.stringify(c)));
}
