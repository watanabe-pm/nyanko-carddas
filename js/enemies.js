// 人間キャラクターデータ定義
// 仕様書 spec-v0.4.md の人間キャラクター表・攻撃効果表に準拠

// 人間の攻撃定義
const HUMAN_ATTACKS = {
  shampoo: {
    id: 'shampoo',
    name: 'シャンプー攻撃',
    // 対象猫のHPを-8
    effect: { type: 'damage_hp', value: 8 },
  },
  nail_clip: {
    id: 'nail_clip',
    name: '爪切り攻撃',
    // 対象猫のATKを-3（2ラウンド継続デバフ）
    effect: { type: 'debuff_atk', value: -3, duration: 2 },
  },
  vacuum: {
    id: 'vacuum',
    name: '掃除機攻撃',
    // 対象猫のHPを-15
    effect: { type: 'damage_hp', value: 15 },
  },
  ignore: {
    id: 'ignore',
    name: '無視攻撃',
    // 対象猫のCHARMを-5（2ラウンド継続デバフ）
    effect: { type: 'debuff_charm', value: -5, duration: 2 },
  },
  stench: {
    id: 'stench',
    name: '悪臭攻撃',
    // 人間の魅了度を-8（猫側が積み上げた魅了度を減らす）
    effect: { type: 'damage_charm_meter', value: 8 },
  },
  annoying: {
    id: 'annoying',
    name: 'ウザイ絡み攻撃',
    // 効果なし
    effect: { type: 'none' },
  },
  loud_noise: {
    id: 'loud_noise',
    name: '爆音攻撃',
    // 対象猫のSPDを-4（2ラウンド継続デバフ）
    effect: { type: 'debuff_spd', value: -4, duration: 2 },
  },
};

// 5ステージ分の人間キャラクター
const ENEMIES = [
  {
    stage: 1,
    id: 'mother',
    name: 'マザー・グルーミング',
    hp: 50,
    maxHp: 50,
    initialCharmMeter: 60, // 魅了度初期値（この値からスタートして100で魅了勝利）
    spd: 8,
    attacks: [
      HUMAN_ATTACKS.shampoo,
      HUMAN_ATTACKS.nail_clip,
      HUMAN_ATTACKS.vacuum,
    ],
    special: null,
  },
  {
    stage: 2,
    id: 'father',
    name: 'ファザー・ムスクス',
    hp: 100,
    maxHp: 100,
    initialCharmMeter: 70,
    spd: 10,
    attacks: [
      HUMAN_ATTACKS.stench,
      HUMAN_ATTACKS.annoying,
    ],
    special: null,
  },
  {
    stage: 3,
    id: 'brother',
    name: 'ブラザー・デシベル',
    hp: 60,
    maxHp: 60,
    initialCharmMeter: 30,
    spd: 15,
    attacks: [
      HUMAN_ATTACKS.loud_noise,
      HUMAN_ATTACKS.ignore,
    ],
    special: null,
  },
  {
    stage: 4,
    id: 'sister',
    name: 'シスター・クリッパー',
    hp: 70,
    maxHp: 70,
    initialCharmMeter: 50,
    spd: 12,
    attacks: [
      HUMAN_ATTACKS.nail_clip,
      HUMAN_ATTACKS.ignore,
    ],
    special: null,
  },
  {
    stage: 5,
    id: 'child',
    name: 'チャイルド・カオティカ',
    hp: 20,
    maxHp: 20,
    initialCharmMeter: 20,
    spd: 0,
    attacks: [
      HUMAN_ATTACKS.stench,
      HUMAN_ATTACKS.loud_noise,
    ],
    // 物理攻撃無効：攻撃を選んだ猫はそのターン失敗し、以降魅了に強制変更
    special: 'physical_immune',
  },
];

// ステージ番号（1始まり）から敵データを取得（ディープコピー）
function getEnemyByStage(stage) {
  const enemy = ENEMIES.find(e => e.stage === stage);
  return enemy ? JSON.parse(JSON.stringify(enemy)) : null;
}
