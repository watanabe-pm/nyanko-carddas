// ============================================================
// ui.js  ─  UI 描画・イベント処理
// ============================================================

function renderUI() {
  renderStatus();
  renderBattleArea();
  renderHand();
  renderLog();
  renderResult();
}

// ── ステータス表示 ────────────────────────────────────────
function renderStatus() {
  const p = state.player;
  const c = state.cpu;

  // HP バー
  setHpBar('player', p.hp);
  setHpBar('cpu',    c.hp);

  // 数値
  setText('player-hp',   p.hp);
  setText('player-mp',   p.mp);
  setText('player-deck', p.deck.length);
  setText('cpu-hp',      c.hp);
  setText('cpu-mp',      c.mp);
  setText('cpu-deck',    c.deck.length);
  setText('turn-num',    state.turn);

  // 毒アイコン
  show('player-poison', p.poisonTurns > 0);
  show('cpu-poison',    c.poisonTurns > 0);
}

function setHpBar(who, hp) {
  const bar = document.getElementById(`${who}-hp-bar`);
  if (!bar) return;
  const pct = Math.max(0, Math.min(100, hp));
  bar.style.width = `${pct}%`;
  bar.classList.toggle('danger', pct <= 30);
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function show(id, visible) {
  const el = document.getElementById(id);
  if (el) el.style.display = visible ? 'inline-block' : 'none';
}

// ── バトルエリア ──────────────────────────────────────────
function renderBattleArea() {
  const pcEl = document.getElementById('player-battle-card');
  const ccEl = document.getElementById('cpu-battle-card');

  pcEl.innerHTML = state.playerCard
    ? cardHTML(state.playerCard, false)
    : `<div class="empty-slot">カードを<br>選んでください</div>`;

  ccEl.innerHTML = state.cpuCard
    ? cardHTML(state.cpuCard, false)
    : `<div class="empty-slot">待機中…</div>`;
}

// ── 手札 ─────────────────────────────────────────────────
function renderHand() {
  const handEl = document.getElementById('player-hand');
  handEl.innerHTML = '';

  state.player.hand.forEach((card, idx) => {
    const canPlay = card.cost <= state.player.mp && state.phase === 'player';
    const el = document.createElement('div');
    el.className = `hand-card rarity-${card.rarity.toLowerCase()} ${canPlay ? 'playable' : 'disabled'}`;
    el.innerHTML = cardHTML(card, true);
    if (canPlay) el.addEventListener('click', () => playerPlayCard(idx));
    handEl.appendChild(el);
  });

  const skipBtn = document.getElementById('skip-btn');
  if (skipBtn) skipBtn.disabled = state.phase !== 'player';
}

// ── カード HTML ────────────────────────────────────────────
function cardHTML(card, showCost) {
  const effName = card.effect !== 'NONE' ? EFFECT_NAMES[card.effect] : '';
  const effDesc = card.effect !== 'NONE' ? EFFECT_DESC[card.effect]  : '';
  return `
    <div class="card-inner">
      ${showCost ? `<div class="card-cost">MP ${card.cost}</div>` : ''}
      <div class="card-name">${card.name}</div>
      <div class="card-emoji">${card.emoji}</div>
      <div class="card-stats">
        <span class="atk">ATK ${card.atk}</span>
        <span class="def">DEF ${card.def}</span>
      </div>
      ${effName ? `<div class="card-effect" title="${effDesc}">${effName}</div>` : ''}
    </div>
  `;
}

// ── ログ ─────────────────────────────────────────────────
function renderLog() {
  const logEl = document.getElementById('battle-log');
  if (!logEl) return;
  logEl.innerHTML = state.log
    .map(l => `<div class="log-line">${l}</div>`)
    .join('');
}

// ── リザルトオーバーレイ ──────────────────────────────────
function renderResult() {
  const overlay = document.getElementById('result-overlay');
  if (!overlay) return;

  if (state.phase !== 'result') {
    overlay.style.display = 'none';
    return;
  }
  overlay.style.display = 'flex';

  const map = {
    win:  { title: '🎉 勝利！',    sub: '見事な戦いだった！', cls: 'win'  },
    lose: { title: '💀 敗北…',    sub: 'また挑戦しよう',     cls: 'lose' },
    draw: { title: '🤝 引き分け', sub: 'いい勝負だった',     cls: 'draw' },
  };
  const r = map[state.battleResult] || map.draw;
  overlay.className = `result-overlay ${r.cls}`;
  setText('result-title', r.title);
  setText('result-sub',   r.sub);
}

// ── イベント初期化 ────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('skip-btn')
    ?.addEventListener('click', skipTurn);

  document.getElementById('restart-btn')
    ?.addEventListener('click', () => { initGame(); renderUI(); });

  initGame();
  renderUI();
});
