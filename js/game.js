// ゲームロジック管理
// 仕様書 spec-v0.4.md のバトルシステムに準拠

// ===== ゲーム状態 =====

const GameState = {
  // デッキ（5枚の手持ちカード）
  deck: [],
  // アイテムポイント残高
  itemPoints: 0,
  // 現在のステージ（1〜5）
  currentStage: 1,
  // 各カードに装備中のアイテム { cardId: itemId }
  equippedItems: {},
  // バトル中の状態
  battle: null,
};

// ===== バトル中の状態構造 =====
// {
//   enemy: {...},           // 現在の敵データ（HPなど可変）
//   enemyCharmMeter: number,// 魅了度（100で魅了勝利）
//   cats: [...],            // 出撃中の3匹（可変ステータス込み）
//   catActions: {},         // { cardId: 'attack' | 'charm' }
//   catDebuffs: {},         // { cardId: [{type, value, remaining}] }
//   itemState: {},          // { cardId: { used, charges } } アイテム使用状態
//   turnOrder: [],          // 現ラウンドのSPD順行動リスト
//   roundCount: number,
//   log: [],                // バトルログ文字列配列
//   result: null | 'win_hp' | 'win_charm' | 'lose',
// }

// ===== 初期化 =====

function startGame() {
  // 全16種からランダムで5枚ドロー
  const drawnCards = drawCards(5);

  // ドロー枚数に応じてアイテムポイントを計算
  const points = drawnCards.reduce((sum, card) => {
    return sum + RARITY_ITEM_POINTS[card.rarity];
  }, 0);

  GameState.deck = drawnCards;
  GameState.itemPoints = points;
  GameState.currentStage = 1;
  GameState.equippedItems = {};
  GameState.battle = null;
}

// ===== バトル準備 =====

// selectedCardIds: 選択した3枚のカードID配列
// catActions: { cardId: 'attack' | 'charm' }
// equippedItems: { cardId: itemId | null }
function prepareBattle(selectedCardIds, catActions, equippedItemsMap) {
  const enemy = getEnemyByStage(GameState.currentStage);
  if (!enemy) return;

  // 選択された3匹の現在状態を取得（deck内のオブジェクトをコピー）
  const cats = selectedCardIds.map(id => {
    const card = GameState.deck.find(c => c.id === id);
    return JSON.parse(JSON.stringify(card));
  });

  // アイテム装備状態を初期化
  const itemState = {};
  selectedCardIds.forEach(id => {
    const itemId = equippedItemsMap[id] || null;
    itemState[id] = {
      itemId,
      used: false,
      charges: getInitialCharges(itemId),
    };
  });

  // 装備情報をGameStateに保存
  GameState.equippedItems = equippedItemsMap;

  // バトル状態を初期化
  GameState.battle = {
    enemy,
    enemyCharmMeter: enemy.initialCharmMeter,
    cats,
    catActions: { ...catActions },
    catDebuffs: Object.fromEntries(selectedCardIds.map(id => [id, []])),
    itemState,
    turnOrder: [],
    roundCount: 0,
    log: [],
    result: null,
  };

  // 戦闘開始時アイテムを発動
  applyBattleStartItems();
}

// アイテムの初期チャージ数（回数制限があるもの）
function getInitialCharges(itemId) {
  if (!itemId) return 0;
  const item = getItemById(itemId);
  if (!item) return 0;
  if (item.effect.count !== undefined) return item.effect.count;
  return 1; // reviveなど1回発動系
}

// 戦闘開始時発動アイテムを適用（SPD/ATK/CHARM強化）
function applyBattleStartItems() {
  const { cats, itemState } = GameState.battle;
  cats.forEach(cat => {
    const state = itemState[cat.id];
    if (!state || !state.itemId) return;
    const item = getItemById(state.itemId);
    if (!item || item.trigger !== 'battle_start') return;

    // ステータスを加算
    const stat = item.effect.stat;
    cat[stat] = (cat[stat] || 0) + item.effect.value;
    state.used = true;
    GameState.battle.log.push(
      `${cat.name}は${item.name}を使った！ ${stat.toUpperCase()} +${item.effect.value}`
    );
  });
}

// ===== 1ラウンド実行 =====

function executeRound() {
  const b = GameState.battle;
  if (!b || b.result) return;

  b.roundCount++;
  b.log.push(`=== ラウンド ${b.roundCount} ===`);

  // SPD順ターン順を構築（デバフ適用後の実効SPDで計算）
  buildTurnOrder();

  // 各アクターのターンを順番に実行
  for (const actor of b.turnOrder) {
    if (b.result) break; // バトル終了済みならスキップ

    if (actor.type === 'cat') {
      executeCatTurn(actor.id);
    } else if (actor.type === 'enemy') {
      executeEnemyTurn();
    }

    // 勝敗チェック
    checkBattleResult();
  }

  // ラウンド終了時：デバフの残りターンを減らす
  tickDebuffs();
}

// SPD順でターン順リストを構築
function buildTurnOrder() {
  const b = GameState.battle;
  const actors = [];

  // 生存中の猫を追加
  b.cats.forEach(cat => {
    if (cat.hp > 0) {
      actors.push({
        type: 'cat',
        id: cat.id,
        effectiveSpd: getEffectiveSpd(cat),
      });
    }
  });

  // 人間を追加
  actors.push({
    type: 'enemy',
    id: b.enemy.id,
    effectiveSpd: b.enemy.spd,
  });

  // SPD降順ソート（同値の場合はランダム）
  actors.sort((a, b) => {
    if (b.effectiveSpd !== a.effectiveSpd) return b.effectiveSpd - a.effectiveSpd;
    return Math.random() - 0.5;
  });

  b.turnOrder = actors;
}

// デバフ適用後の実効SPDを取得
function getEffectiveSpd(cat) {
  const b = GameState.battle;
  const debuffs = b.catDebuffs[cat.id] || [];
  const spdDebuff = debuffs
    .filter(d => d.type === 'debuff_spd')
    .reduce((sum, d) => sum + d.value, 0);
  return Math.max(0, cat.spd + spdDebuff);
}

// デバフ適用後の実効ATKを取得
function getEffectiveAtk(cat) {
  const b = GameState.battle;
  const debuffs = b.catDebuffs[cat.id] || [];
  const atkDebuff = debuffs
    .filter(d => d.type === 'debuff_atk')
    .reduce((sum, d) => sum + d.value, 0);
  return Math.max(0, cat.atk + atkDebuff);
}

// デバフ適用後の実効CHARMを取得
function getEffectiveCharm(cat) {
  const b = GameState.battle;
  const debuffs = b.catDebuffs[cat.id] || [];
  const charmDebuff = debuffs
    .filter(d => d.type === 'debuff_charm')
    .reduce((sum, d) => sum + d.value, 0);
  return Math.max(0, cat.charm + charmDebuff);
}

// ===== 猫のターン処理 =====

function executeCatTurn(catId) {
  const b = GameState.battle;
  const cat = b.cats.find(c => c.id === catId);
  if (!cat || cat.hp <= 0) return;

  const action = b.catActions[catId];

  // チャイルド・カオティカ（物理無効）に対して攻撃した場合の特殊処理
  if (action === 'attack' && b.enemy.special === 'physical_immune') {
    b.log.push(`${cat.name}が攻撃しようとしたが、チャイルドには効かない！`);
    // 以降のターンは魅了に強制変更
    b.catActions[catId] = 'charm';
    return;
  }

  if (action === 'attack') {
    // 攻撃：実効ATKで敵HPを削る
    const dmg = getEffectiveAtk(cat);
    b.enemy.hp = Math.max(0, b.enemy.hp - dmg);
    b.log.push(`${cat.name}が攻撃！ 敵に ${dmg} ダメージ（残りHP: ${b.enemy.hp}）`);
  } else {
    // 魅了：実効CHARMで魅了度を上げる
    const charmValue = getEffectiveCharm(cat);
    b.enemyCharmMeter = Math.min(100, b.enemyCharmMeter + charmValue);
    b.log.push(`${cat.name}が魅了！ 魅了度 +${charmValue}（合計: ${b.enemyCharmMeter}）`);
  }
}

// ===== 人間のターン処理 =====

function executeEnemyTurn() {
  const b = GameState.battle;

  // 生存猫からランダムで攻撃対象を選ぶ
  const aliveCats = b.cats.filter(c => c.hp > 0);
  if (aliveCats.length === 0) return;

  const target = aliveCats[Math.floor(Math.random() * aliveCats.length)];

  // ランダムで攻撃を選択
  const attack = b.enemy.attacks[Math.floor(Math.random() * b.enemy.attacks.length)];

  b.log.push(`${b.enemy.name}が${attack.name}！ 対象: ${target.name}`);

  applyHumanAttack(attack, target);
}

// 人間の攻撃効果を適用（アイテム判定含む）
function applyHumanAttack(attack, targetCat) {
  const b = GameState.battle;
  const itemSt = b.itemState[targetCat.id];
  const item = itemSt && itemSt.itemId ? getItemById(itemSt.itemId) : null;

  // カラー（反射）チェック
  if (item && item.id === 'collar' && !itemSt.used && itemSt.charges > 0) {
    itemSt.charges--;
    if (itemSt.charges === 0) itemSt.used = true;
    // 反射：ダメージ系攻撃なら敵に同ダメージ
    b.log.push(`${targetCat.name}のカラーが反射！`);
    if (attack.effect.type === 'damage_hp') {
      b.enemy.hp = Math.max(0, b.enemy.hp - attack.effect.value);
      b.log.push(`敵に ${attack.effect.value} ダメージ（残りHP: ${b.enemy.hp}）`);
    }
    return;
  }

  // キャットタワー（回避）チェック
  if (item && item.id === 'cat_tower' && !itemSt.used && itemSt.charges > 0) {
    itemSt.charges--;
    if (itemSt.charges === 0) itemSt.used = true;
    b.log.push(`${targetCat.name}はキャットタワーで回避！`);
    return;
  }

  // 攻撃効果を適用
  const effect = attack.effect;

  if (effect.type === 'damage_hp') {
    // ちゅーる（戦闘不能時復活）の判定は適用後に行う
    targetCat.hp = Math.max(0, targetCat.hp - effect.value);
    b.log.push(`${targetCat.name}に ${effect.value} ダメージ（残りHP: ${targetCat.hp}）`);
    // 戦闘不能になったらちゅーるチェック
    if (targetCat.hp === 0) {
      tryChuru(targetCat);
    }
  } else if (effect.type === 'damage_charm_meter') {
    b.enemyCharmMeter = Math.max(0, b.enemyCharmMeter - effect.value);
    b.log.push(`魅了度が -${effect.value}（合計: ${b.enemyCharmMeter}）`);
  } else if (
    effect.type === 'debuff_atk' ||
    effect.type === 'debuff_charm' ||
    effect.type === 'debuff_spd'
  ) {
    // お守り（追加効果無効）チェック
    if (item && item.id === 'omamori' && !itemSt.used && itemSt.charges > 0) {
      itemSt.charges--;
      if (itemSt.charges === 0) itemSt.used = true;
      b.log.push(`${targetCat.name}のお守りがデバフを無効化！`);
      return;
    }
    // デバフを付与
    b.catDebuffs[targetCat.id].push({
      type: effect.type,
      value: effect.value,
      remaining: effect.duration,
    });
    b.log.push(
      `${targetCat.name}に${getDebuffLabel(effect.type)} ${effect.value}（${effect.duration}ラウンド）`
    );
  } else if (effect.type === 'none') {
    b.log.push('効果なし…');
  }
}

// ちゅーる発動チェック（戦闘不能時HP全回復）
function tryChuru(cat) {
  const b = GameState.battle;
  const itemSt = b.itemState[cat.id];
  if (!itemSt || itemSt.itemId !== 'churu' || itemSt.used) return;

  itemSt.used = true;
  cat.hp = cat.maxHp;
  b.log.push(`${cat.name}はちゅーるでHPが全回復！（HP: ${cat.hp}）`);
}

// デバフ種別の日本語ラベル
function getDebuffLabel(type) {
  const map = {
    debuff_atk: 'ATKデバフ',
    debuff_charm: 'CHARMデバフ',
    debuff_spd: 'SPDデバフ',
  };
  return map[type] || type;
}

// ===== 勝敗チェック =====

function checkBattleResult() {
  const b = GameState.battle;

  // 魅了勝利
  if (b.enemyCharmMeter >= 100) {
    b.result = 'win_charm';
    b.log.push(`${b.enemy.name}を魅了した！ 魅了勝利！`);
    return;
  }

  // HP勝利
  if (b.enemy.hp <= 0) {
    b.result = 'win_hp';
    b.log.push(`${b.enemy.name}のHPが0になった！ 撃破勝利！`);
    return;
  }

  // 全滅チェック
  const aliveCats = b.cats.filter(c => c.hp > 0);
  if (aliveCats.length === 0) {
    b.result = 'lose';
    b.log.push('猫が全滅した… ゲームオーバー');
  }
}

// ===== ラウンド終了：デバフのカウントダウン =====

function tickDebuffs() {
  const b = GameState.battle;
  Object.keys(b.catDebuffs).forEach(catId => {
    b.catDebuffs[catId] = b.catDebuffs[catId]
      .map(d => ({ ...d, remaining: d.remaining - 1 }))
      .filter(d => d.remaining > 0);
  });
}

// ===== ステージクリア後処理 =====

// choice: 'hp' (HP50%回復) | 'points' (アイテムポイント+8)
function applyStageReward(choice) {
  if (choice === 'hp') {
    // 出撃した3匹（deck内の該当カード）のHPを50%回復
    GameState.battle.cats.forEach(battleCat => {
      const deckCard = GameState.deck.find(c => c.id === battleCat.id);
      if (deckCard) {
        const heal = Math.floor(deckCard.maxHp * 0.5);
        deckCard.hp = Math.min(deckCard.maxHp, battleCat.hp + heal);
      }
    });
  } else if (choice === 'points') {
    GameState.itemPoints += 8;
  }

  // ステージクリア後アイテム効果リセット（再利用可能に）
  resetItemStates();
}

// アイテム使用状態をリセット（全カード対象）
function resetItemStates() {
  // equippedItemsの装備情報は維持したまま、使用フラグだけリセット
  // 次のバトル準備時にitemStateを再構築するため、ここでは特に何もしない
  // （prepareBattleで毎回初期化されるため）
}

// 次のステージへ進む
function advanceStage() {
  GameState.currentStage++;
  GameState.battle = null;
}

// ===== ユーティリティ =====

// バトル中の猫の現在状態を取得
function getBattleCat(catId) {
  if (!GameState.battle) return null;
  return GameState.battle.cats.find(c => c.id === catId) || null;
}

// アイテムを購入してdeck全体に装備可能状態にする
// （実際の装備はバトル準備画面でユーザーが選択）
function buyItem(itemId) {
  const item = getItemById(itemId);
  if (!item) return false;
  if (GameState.itemPoints < item.cost) return false;
  GameState.itemPoints -= item.cost;
  return true;
}

// ゲームが終了しているか（全5ステージクリア）
function isGameClear() {
  return GameState.currentStage > 5 && !GameState.battle;
}
