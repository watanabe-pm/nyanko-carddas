const CARDS = [
  { id: 'cat_001', name: 'たまにゃ',          emoji: '🐱', atk: 10, def:  5, cost: 1, rarity: 'N',  effect: 'NONE'   },
  { id: 'cat_002', name: 'しろにゃ',          emoji: '🐈', atk:  8, def: 10, cost: 1, rarity: 'N',  effect: 'NONE'   },
  { id: 'cat_003', name: 'くろにゃ',          emoji: '🐈‍⬛', atk: 12, def:  3, cost: 2, rarity: 'N',  effect: 'NONE'   },
  { id: 'cat_004', name: 'みけにゃ',          emoji: '🐾', atk:  9, def:  8, cost: 2, rarity: 'N',  effect: 'HEAL'   },
  { id: 'cat_005', name: 'とらにゃ',          emoji: '🐯', atk: 15, def:  6, cost: 2, rarity: 'N',  effect: 'NONE'   },
  { id: 'cat_006', name: 'さびにゃ',          emoji: '🌿', atk:  7, def: 12, cost: 2, rarity: 'N',  effect: 'SHIELD' },
  { id: 'cat_007', name: 'ちゃにゃ',          emoji: '☕', atk: 11, def:  7, cost: 2, rarity: 'N',  effect: 'NONE'   },
  { id: 'cat_008', name: 'はちわれ卿',        emoji: '⚔️', atk: 18, def:  8, cost: 3, rarity: 'R',  effect: 'DOUBLE' },
  { id: 'cat_009', name: 'アビシニアン侯爵',  emoji: '🏛️', atk: 14, def: 14, cost: 3, rarity: 'R',  effect: 'NONE'   },
  { id: 'cat_010', name: 'マンチカン男爵',    emoji: '📖', atk: 10, def: 10, cost: 3, rarity: 'R',  effect: 'DRAW'   },
  { id: 'cat_011', name: 'スコティッシュ公爵',emoji: '🛡️', atk: 16, def: 12, cost: 3, rarity: 'R',  effect: 'SHIELD' },
  { id: 'cat_012', name: 'ペルシャ卿',        emoji: '🌸', atk: 12, def: 18, cost: 3, rarity: 'R',  effect: 'HEAL'   },
  { id: 'cat_013', name: 'ラグドール将軍',    emoji: '🗡️', atk: 20, def:  8, cost: 4, rarity: 'R',  effect: 'PIERCE' },
  { id: 'cat_014', name: 'ベンガル騎士',      emoji: '⚡', atk: 22, def:  5, cost: 4, rarity: 'R',  effect: 'DOUBLE' },
  { id: 'cat_015', name: 'ソマリ魔道士',      emoji: '☠️', atk:  8, def:  8, cost: 4, rarity: 'R',  effect: 'POISON' },
  { id: 'cat_016', name: 'ノルウェー大公',    emoji: '❄️', atk: 18, def: 16, cost: 4, rarity: 'SR', effect: 'NONE'   },
  { id: 'cat_017', name: 'オシキャット王',    emoji: '🔥', atk: 25, def: 10, cost: 5, rarity: 'SR', effect: 'PIERCE' },
  { id: 'cat_018', name: 'バーミラン皇帝',    emoji: '💥', atk: 15, def: 15, cost: 5, rarity: 'SR', effect: 'DOUBLE' },
  { id: 'cat_019', name: 'ターキッシュ聖王',  emoji: '✨', atk: 20, def: 20, cost: 5, rarity: 'SR', effect: 'SHIELD' },
  { id: 'cat_020', name: '最強のたまにゃ',    emoji: '🌟', atk: 30, def: 30, cost: 5, rarity: 'SR', effect: 'HEAL'   },
];

const EFFECT_NAMES = {
  NONE:   'なし',
  HEAL:   'ひなたぼっこ',
  DRAW:   '好奇心',
  PIERCE: '爪とぎ',
  DOUBLE: 'ねこパンチ連打',
  POISON: '毛玉',
  SHIELD: 'まるまり',
};

const EFFECT_DESC = {
  NONE:   '',
  HEAL:   'HP +10 回復',
  DRAW:   '2枚追加ドロー',
  PIERCE: 'DEFを無視して攻撃',
  DOUBLE: '2回攻撃',
  POISON: '相手に毒 (3T×5ダメ)',
  SHIELD: 'このターン被ダメ 50%軽減',
};
