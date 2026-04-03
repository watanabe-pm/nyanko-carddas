// ============================================================
// game.js  ─  ゲームロジック（UIに依存しない）
// ============================================================

const MAX_HP      = 100;
const MAX_MP      = 10;
const MP_REGEN    = 3;
const HAND_LIMIT  = 5;
const POISON_DMG  = 5;
const POISON_TURN = 3;

let state = {};

// ── ユーティリティ ────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildDeck() {
  const ns  = CARDS.filter(c => c.rarity === 'N');
  const rs  = CARDS.filter(c => c.rarity === 'R');
  const srs = CARDS.filter(c => c.rarity === 'SR');
  // N×8, R×8, SR×4 = 20枚
  const deck = [
    ...shuffle(ns),
    ...shuffle(ns).slice(0, 1),   // N は重複1枚追加
    ...shuffle(rs),
    ...shuffle(rs).slice(0, 1),   // R は重複1枚追加
    ...shuffle(srs).slice(0, 4),
  ];
  return shuffle(deck).slice(0, 20);
}

function drawCards(actor, count) {
  for (let i = 0; i < count; i++) {
    if (actor.deck.length === 0) break;
    if (actor.hand.length >= HAND_LIMIT) break;
    actor.hand.push(actor.deck.shift());
  }
}

function addLog(msg) {
  state.log.unshift(msg);
  if (state.log.length > 30) state.log.pop();
}

// ── 初期化 ────────────────────────────────────────────────
function initGame() {
  state = {
    turn: 1,
    phase: 'player',       // 'player' | 'result'
    player: {
      hp: MAX_HP, mp: 5,
      deck: shuffle(buildDeck()),
      hand: [],
      poisonTurns: 0,
      shieldActive: false,
    },
    cpu: {
      hp: MAX_HP, mp: 5,
      deck: shuffle(buildDeck()),
      hand: [],
      poisonTurns: 0,
      shieldActive: false,
    },
    log: [],
    battleResult: null,
    playerCard: null,
    cpuCard: null,
  };

  drawCards(state.player, HAND_LIMIT);
  drawCards(state.cpu,    HAND_LIMIT);

  addLog('⚔️ バトル開始！');
  addLog(`── ターン ${state.turn}：あなたのターン ──`);
}

// ── ダメージ計算 ──────────────────────────────────────────
function calcDamage(atk, def, pierce, shielded) {
  const d = pierce ? Math.max(1, atk) : Math.max(1, atk - def);
  return shielded ? Math.max(1, Math.floor(d / 2)) : d;
}

// ── 効果発動 ──────────────────────────────────────────────
function applyEffect(effect, actor, target) {
  switch (effect) {
    case 'HEAL':
      actor.hp = Math.min(MAX_HP, actor.hp + 10);
      addLog('💚 ひなたぼっこ！HP +10 回復');
      break;
    case 'DRAW':
      drawCards(actor, 2);
      addLog('📖 好奇心！2枚追加ドロー');
      break;
    case 'SHIELD':
      actor.shieldActive = true;
      addLog('🛡️ まるまり！このターン被ダメ 50%軽減');
      break;
    case 'POISON':
      target.poisonTurns = POISON_TURN;
      addLog('☠️ 毛玉！相手に毒を付与（3ターン）');
      break;
  }
}

// ── プレイヤーがカードを使う ──────────────────────────────
function playerPlayCard(cardIndex) {
  if (state.phase !== 'player') return;

  const card = state.player.hand[cardIndex];
  if (!card) return;
  if (card.cost > state.player.mp) {
    addLog('⚠️ MPが足りない！');
    renderUI();
    return;
  }

  state.player.hand.splice(cardIndex, 1);
  state.player.mp -= card.cost;
  state.player.shieldActive = false;
  state.playerCard = card;

  addLog(`🐱 あなた：「${card.name}」を使用！`);
  applyEffect(card.effect, state.player, state.cpu);

  cpuSelectCard();
  resolveBattle();
}

// ── スキップ ─────────────────────────────────────────────
function skipTurn() {
  if (state.phase !== 'player') return;
  addLog('⏭️ あなたはスキップ');
  state.playerCard = null;
  state.player.shieldActive = false;
  cpuSelectCard();
  resolveBattle();
}

// ── CPU カード選択（簡易AI） ─────────────────────────────
function cpuSelectCard() {
  state.cpu.shieldActive = false;
  const playable = state.cpu.hand.filter(c => c.cost <= state.cpu.mp);

  if (playable.length === 0) {
    state.cpuCard = null;
    addLog('😺 CPU：スキップ');
    return;
  }

  // HPが低ければHEAL優先
  let selected = null;
  if (state.cpu.hp <= 30) {
    selected = playable.find(c => c.effect === 'HEAL') || null;
  }

  if (!selected) {
    const priority = ['DOUBLE', 'PIERCE', 'POISON'];
    for (const eff of priority) {
      const found = playable.find(c => c.effect === eff);
      if (found) { selected = found; break; }
    }
  }

  if (!selected) {
    selected = playable.reduce((best, c) => c.atk > best.atk ? c : best, playable[0]);
  }

  state.cpu.hand.splice(state.cpu.hand.indexOf(selected), 1);
  state.cpu.mp -= selected.cost;
  state.cpuCard = selected;

  addLog(`😼 CPU：「${selected.name}」を使用！`);
  applyEffect(selected.effect, state.cpu, state.player);
}

// ── バトル解決 ────────────────────────────────────────────
function resolveBattle() {
  const pc = state.playerCard;
  const cc = state.cpuCard;

  if (pc && cc) {
    // プレイヤー → CPU
    const pd = calcDamage(pc.atk, cc.def, pc.effect === 'PIERCE', state.cpu.shieldActive);
    state.cpu.hp -= pd;
    addLog(`💥 あなた→CPU: ${pd} ダメージ！`);
    if (pc.effect === 'DOUBLE') {
      state.cpu.hp -= pd;
      addLog(`💥 ねこパンチ連打！さらに ${pd} ダメージ！`);
    }

    // CPU → プレイヤー
    const cd = calcDamage(cc.atk, pc.def, cc.effect === 'PIERCE', state.player.shieldActive);
    state.player.hp -= cd;
    addLog(`💢 CPU→あなた: ${cd} ダメージ！`);
    if (cc.effect === 'DOUBLE') {
      state.player.hp -= cd;
      addLog(`💢 ねこパンチ連打！さらに ${cd} ダメージ！`);
    }
  } else if (pc && !cc) {
    const pd = Math.max(1, pc.atk);
    state.cpu.hp -= pd;
    addLog(`💥 CPU はスキップ中：${pd} ダメージ！`);
  } else if (!pc && cc) {
    const cd = Math.max(1, cc.atk);
    state.player.hp -= cd;
    addLog(`💢 あなたはスキップ中：${cd} ダメージ！`);
  }

  // HP クランプ
  state.player.hp = Math.max(0, state.player.hp);
  state.cpu.hp    = Math.max(0, state.cpu.hp);

  if (checkGameOver()) return;
  endTurn();
}

// ── 勝敗判定 ──────────────────────────────────────────────
function checkGameOver() {
  if (state.player.hp <= 0 && state.cpu.hp <= 0) {
    return endGame('draw', '🤝 引き分け！');
  }
  if (state.player.hp <= 0) {
    return endGame('lose', '💀 あなたの負け…');
  }
  if (state.cpu.hp <= 0) {
    return endGame('win', '🎉 あなたの勝利！');
  }
  return false;
}

function endGame(result, msg) {
  state.battleResult = result;
  state.phase = 'result';
  addLog(msg);
  renderUI();
  return true;
}

// ── ターン終了処理 ────────────────────────────────────────
function endTurn() {
  state.turn++;

  // 毒ダメージ
  if (state.player.poisonTurns > 0) {
    state.player.hp = Math.max(0, state.player.hp - POISON_DMG);
    state.player.poisonTurns--;
    addLog(`☠️ 毒：あなたに ${POISON_DMG} ダメージ（残 ${state.player.poisonTurns}T）`);
  }
  if (state.cpu.poisonTurns > 0) {
    state.cpu.hp = Math.max(0, state.cpu.hp - POISON_DMG);
    state.cpu.poisonTurns--;
    addLog(`☠️ 毒：CPU に ${POISON_DMG} ダメージ（残 ${state.cpu.poisonTurns}T）`);
  }

  if (checkGameOver()) return;

  // MP 回復・ドロー
  state.player.mp = Math.min(MAX_MP, state.player.mp + MP_REGEN);
  state.cpu.mp    = Math.min(MAX_MP, state.cpu.mp    + MP_REGEN);
  drawCards(state.player, 1);
  drawCards(state.cpu,    1);

  // バトルカードリセット
  state.playerCard = null;
  state.cpuCard    = null;

  // デッキ切れチェック
  if (state.player.deck.length === 0 && state.player.hand.length === 0) {
    return endGame('lose', '📭 デッキ切れ！あなたの負け…');
  }

  state.phase = 'player';
  addLog(`── ターン ${state.turn}：あなたのターン ──`);
  renderUI();
}
