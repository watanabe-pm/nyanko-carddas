// UI描画・イベント処理
// 各画面の表示切替と、ユーザー操作のハンドリングを担当

// ===== 画面切替 =====

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(el => {
    el.classList.remove('active');
  });
  const target = document.getElementById(id);
  if (target) {
    target.classList.add('active');
    window.scrollTo(0, 0);
  }
}

// ===== 猫カードHTML生成 =====

function createCatCardEl(card, options = {}) {
  const el = document.createElement('div');
  el.className = 'cat-card';
  el.dataset.id = card.id;
  el.dataset.rarity = card.rarity;

  if (card.image) {
    el.classList.add('has-image');
    const img = document.createElement('img');
    img.className = 'card-image';
    img.src = card.image;
    img.alt = card.name;
    img.onerror = () => {
      el.classList.remove('has-image');
      el.innerHTML = `<div class="card-rarity">${card.rarity}</div><div class="card-placeholder">🐱</div>`;
    };
    el.appendChild(img);
  } else {
    el.innerHTML = `
      <div class="card-rarity">${card.rarity}</div>
      <div class="card-placeholder">🐱</div>
    `;
  }

  // HP表示オプション
  if (options.showHp && card.hp !== undefined && card.maxHp !== undefined) {
    const hpPct = Math.max(0, (card.hp / card.maxHp) * 100);
    const hpWrap = document.createElement('div');
    hpWrap.className = 'card-hp-wrap';
    hpWrap.innerHTML = `
      <span class="card-hp-label">HP</span>
      <div class="gauge-bar">
        <div class="gauge-fill hp-fill" style="width:${hpPct}%"></div>
      </div>
      <span class="card-hp-text">${card.hp}/${card.maxHp}</span>
    `;
    el.appendChild(hpWrap);
    el.classList.add('has-hp');
  }

  if (options.isKo) el.classList.add('ko');
  return el;
}

// ===== タイトル画面 =====

document.getElementById('btn-start').addEventListener('click', () => {
  startGame();
  renderDrawScreen();
  showScreen('screen-draw');
});

// ===== カードドロー画面 =====

function showFlash(type) {
  const el = document.createElement('div');
  el.className = `flash-overlay flash-${type}`;
  document.body.appendChild(el);
  el.addEventListener('animationend', () => el.remove());
}

function showParticles() {
  const count = 24;
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'particle';
    const size = 4 + Math.random() * 8;
    el.style.width = size + 'px';
    el.style.height = size + 'px';
    el.style.left = (10 + Math.random() * 80) + 'vw';
    el.style.top = (30 + Math.random() * 40) + 'vh';
    el.style.animationDelay = (Math.random() * 0.4) + 's';
    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }
}

function renderDrawScreen() {
  const list = document.getElementById('draw-card-list');
  list.innerHTML = '';
  document.getElementById('draw-item-points').textContent = GameState.itemPoints;

  const topRow = document.createElement('div');
  topRow.className = 'draw-row';
  const bottomRow = document.createElement('div');
  bottomRow.className = 'draw-row';
  list.appendChild(topRow);
  list.appendChild(bottomRow);

  let delay = 0;

  GameState.deck.forEach((card, index) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'card-flip-wrapper';

    const inner = document.createElement('div');
    inner.className = 'card-flip-inner';

    const back = document.createElement('div');
    back.className = 'card-flip-back';

    const front = createCatCardEl(card);

    inner.appendChild(back);
    inner.appendChild(front);
    wrapper.appendChild(inner);

    const row = index < 3 ? topRow : bottomRow;
    row.appendChild(wrapper);

    const isSR = card.rarity === 'SR';
    const isLR = card.rarity === 'LR';
    const cardDelay = delay;

    setTimeout(() => {
      wrapper.classList.add('revealed');

      if (isSR || isLR) {
        setTimeout(() => {
          showFlash(isLR ? 'lr' : 'sr');
          if (isLR) showParticles();
          setTimeout(() => {
            wrapper.classList.add('flipped');
          }, 400);
        }, 150);
      } else {
        setTimeout(() => {
          wrapper.classList.add('flipped');
        }, 200);
      }
    }, cardDelay);

    delay += isLR ? 2000 : isSR ? 1500 : 600;
  });
}

document.getElementById('btn-draw-next').addEventListener('click', () => {
  if (GameState.selectedCatIds.length === 0) {
    renderCatSelectScreen();
    showScreen('screen-cat-select');
  } else {
    renderStageStartScreen();
    showScreen('screen-stage-start');
  }
});

// ===== 猫選択画面 =====

let catSelectIds = new Set();

function renderCatSelectPreview() {
  const area = document.getElementById('cat-select-preview');
  area.innerHTML = '';
  if (catSelectIds.size === 0) return;

  const label = document.createElement('p');
  label.className = 'cat-select-preview-label';
  label.textContent = `選択中 ${catSelectIds.size} / 3`;
  area.appendChild(label);

  catSelectIds.forEach(id => {
    const card = GameState.deck.find(c => c.id === id);
    area.appendChild(createCatCardEl(card));
  });
}

function createCatSelectFlipEl(card) {
  const wrapper = document.createElement('div');
  wrapper.className = 'cat-select-flip';
  wrapper.dataset.id = card.id;
  wrapper.dataset.rarity = card.rarity;

  const inner = document.createElement('div');
  inner.className = 'cat-select-inner';

  const front = document.createElement('div');
  front.className = 'cat-select-front';

  if (card.image) {
    const img = document.createElement('img');
    img.src = card.image;
    img.alt = card.name;
    img.onerror = () => {
      front.innerHTML = `<div class="csf-placeholder">${card.rarity}<br>🐱<br><span>${card.name}</span></div>`;
    };
    front.appendChild(img);
  } else {
    front.innerHTML = `<div class="csf-placeholder">${card.rarity}<br>🐱<br><span>${card.name}</span></div>`;
  }

  const back = document.createElement('div');
  back.className = 'cat-select-back';
  back.dataset.rarity = card.rarity;

  const selectBtn = document.createElement('button');
  selectBtn.className = 'csb-select-btn';
  selectBtn.textContent = '選択する';

  back.innerHTML = `
    <div class="csb-scroll-area">
      <div class="csb-rarity">${card.rarity}</div>
      <div class="csb-name">${card.name}</div>
      <div class="csb-stats">
        <span><em>HP</em><strong>${card.hp}/${card.maxHp}</strong></span>
        <span><em>ATK</em><strong>${card.atk}</strong></span>
        <span><em>CHARM</em><strong>${card.charm}</strong></span>
        <span><em>SPD</em><strong>${card.spd}</strong></span>
      </div>
      ${card.description ? `<p class="csb-desc">${card.description}</p>` : ''}
    </div>
  `;
  back.appendChild(selectBtn);

  inner.appendChild(front);
  inner.appendChild(back);
  wrapper.appendChild(inner);

  return { wrapper, selectBtn };
}

function renderCatSelectScreen() {
  catSelectIds = new Set();
  updateCatSelectConfirmBtn();
  renderCatSelectPreview();

  const list = document.getElementById('cat-select-list');
  list.innerHTML = '';

  const topRow = document.createElement('div');
  topRow.className = 'draw-row';
  const bottomRow = document.createElement('div');
  bottomRow.className = 'draw-row';
  list.appendChild(topRow);
  list.appendChild(bottomRow);

  GameState.deck.forEach((card, index) => {
    const { wrapper, selectBtn } = createCatSelectFlipEl(card);

    wrapper.addEventListener('click', () => {
      wrapper.classList.toggle('flipped');
    });

    selectBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (catSelectIds.has(card.id)) {
        catSelectIds.delete(card.id);
        wrapper.classList.remove('selected');
        selectBtn.textContent = '選択する';
      } else {
        if (catSelectIds.size >= 3) return;
        catSelectIds.add(card.id);
        wrapper.classList.add('selected');
        selectBtn.textContent = '選択解除';
      }
      updateCatSelectConfirmBtn();
      renderCatSelectPreview();
    });

    const row = index < 3 ? topRow : bottomRow;
    row.appendChild(wrapper);
  });
}

function updateCatSelectConfirmBtn() {
  document.getElementById('btn-cat-select-confirm').disabled = catSelectIds.size < 3;
}

document.getElementById('btn-cat-select-confirm').addEventListener('click', () => {
  GameState.selectedCatIds = [...catSelectIds];
  renderStageStartScreen();
  showScreen('screen-stage-start');
});

// ===== ステージ開始画面 =====

function renderStageStartScreen() {
  const stage = GameState.currentStage;
  const enemy = getEnemyByStage(stage);

  document.getElementById('stage-number').textContent = stage;
  document.getElementById('stage-enemy-name').textContent = enemy.name;
  document.getElementById('stage-enemy-stats').innerHTML =
    `HP: ${enemy.hp} ／ 魅了度初期値: ${enemy.initialCharmMeter} ／ SPD: ${enemy.spd}` +
    (enemy.special === 'physical_immune' ? '<br><strong>特殊：物理攻撃無効</strong>' : '');
}

document.getElementById('btn-stage-to-prep').addEventListener('click', () => {
  renderBattlePrepScreen();
  showScreen('screen-battle-prep');
});

// ===== バトル準備画面 =====

let prepSelectedIds = new Set();
let prepCatActions = {};
let prepEquippedItems = {};
let purchasedItems = {};
let prepTeamAction = 'attack';

function renderBattlePrepScreen() {
  prepSelectedIds = new Set(GameState.selectedCatIds);
  prepCatActions = {};
  prepEquippedItems = {};
  prepTeamAction = 'attack';
  purchasedItems = {};

  renderPrepItemShop();
  renderPrepEquipArea();
  renderPrepActionList();
  updateBattleStartBtn();
}

function togglePrepCardSelect(cardId) {
  if (prepSelectedIds.has(cardId)) {
    prepSelectedIds.delete(cardId);
  } else {
    if (prepSelectedIds.size >= 3) return;
    prepSelectedIds.add(cardId);
  }
  document.querySelectorAll('#prep-card-list .cat-card').forEach(el => {
    if (prepSelectedIds.has(el.dataset.id)) {
      el.classList.add('selected');
    } else {
      el.classList.remove('selected');
    }
  });

  renderPrepEquipArea();
  renderPrepActionList();
  updateBattleStartBtn();
}

function renderPrepItemShop() {
  const shop = document.getElementById('prep-item-shop');
  shop.innerHTML = '';
  document.getElementById('prep-item-points').textContent = GameState.itemPoints;

  ITEMS.forEach(item => {
    const btn = document.createElement('button');
    btn.className = 'item-btn';
    btn.disabled = item.cost > GameState.itemPoints;
    const owned = purchasedItems[item.id] || 0;
    btn.innerHTML =
      `<strong>${item.name}</strong><br>${item.description}<br>` +
      `<span class="item-cost">${item.cost}pt</span>` +
      `<span class="item-owned">所持: ${owned}個</span>`;
    btn.addEventListener('click', () => {
      if (buyItem(item.id)) {
        purchasedItems[item.id] = (purchasedItems[item.id] || 0) + 1;
        document.getElementById('prep-item-points').textContent = GameState.itemPoints;
        renderPrepItemShop();
        renderPrepEquipArea();
      }
    });
    shop.appendChild(btn);
  });
}

function getItemAvailableCount(itemId, excludeCardId) {
  const total = purchasedItems[itemId] || 0;
  const usedByOthers = [...prepSelectedIds]
    .filter(id => id !== excludeCardId && prepEquippedItems[id] === itemId)
    .length;
  return total - usedByOthers;
}

// カード行とアイテム選択行を分離して描画
function renderPrepEquipArea() {
  const list = document.getElementById('prep-card-list');
  list.innerHTML = '';

  // ── カード行 ──
  const cardRow = document.createElement('div');
  cardRow.className = 'draw-row';

  // ── アイテム選択行 ──
  const itemRow = document.createElement('div');
  itemRow.className = 'draw-row prep-item-row';

  list.appendChild(cardRow);
  list.appendChild(itemRow);

  GameState.selectedCatIds.forEach(cardId => {
    const card = GameState.deck.find(c => c.id === cardId);

    // カード（HP表示あり）
    cardRow.appendChild(createCatCardEl(card, { showHp: true }));

    // アイテム選択
    const itemWrap = document.createElement('div');
    itemWrap.className = 'prep-item-wrap';

    const select = document.createElement('select');
    select.className = 'equip-select';

    const noneOpt = document.createElement('option');
    noneOpt.value = '';
    noneOpt.textContent = 'アイテムなし';
    select.appendChild(noneOpt);

    Object.keys(purchasedItems).forEach(itemId => {
      const isEquippedHere = prepEquippedItems[cardId] === itemId;
      const available = getItemAvailableCount(itemId, cardId);
      if (available <= 0 && !isEquippedHere) return;

      const item = getItemById(itemId);
      const opt = document.createElement('option');
      opt.value = itemId;
      opt.textContent = available > 1 ? `${item.name}（残り${available}）` : item.name;
      if (isEquippedHere) opt.selected = true;
      select.appendChild(opt);
    });

    select.addEventListener('change', () => {
      prepEquippedItems[cardId] = select.value || null;
      renderPrepEquipArea();
    });

    if (prepEquippedItems[cardId] === undefined) prepEquippedItems[cardId] = null;

    itemWrap.appendChild(select);
    itemRow.appendChild(itemWrap);
  });
}

function renderPrepActionList() {
  prepSelectedIds.forEach(id => {
    prepCatActions[id] = prepTeamAction;
  });

  const list = document.getElementById('prep-action-list');
  list.innerHTML = '';

  const toggle = document.createElement('div');
  toggle.className = 'action-toggle';

  const atkBtn = document.createElement('button');
  atkBtn.textContent = '攻撃主体';
  atkBtn.className = prepTeamAction === 'attack' ? 'active-attack' : '';

  const charmBtn = document.createElement('button');
  charmBtn.textContent = '魅了主体';
  charmBtn.className = prepTeamAction === 'charm' ? 'active-charm' : '';

  atkBtn.addEventListener('click', () => {
    prepTeamAction = 'attack';
    prepSelectedIds.forEach(id => { prepCatActions[id] = 'attack'; });
    renderPrepActionList();
  });

  charmBtn.addEventListener('click', () => {
    prepTeamAction = 'charm';
    prepSelectedIds.forEach(id => { prepCatActions[id] = 'charm'; });
    renderPrepActionList();
  });

  toggle.appendChild(atkBtn);
  toggle.appendChild(charmBtn);
  list.appendChild(toggle);
}

function updateBattleStartBtn() {
  const btn = document.getElementById('btn-battle-start');
  btn.disabled = prepSelectedIds.size < 3;
}

document.getElementById('btn-battle-start').addEventListener('click', () => {
  const selectedIds = [...prepSelectedIds];
  prepareBattle(selectedIds, prepCatActions, prepEquippedItems);
  renderBattleScreen();
  showScreen('screen-battle');
});

// ===== バトル画面 =====

function renderBattleScreen() {
  const b = GameState.battle;

  document.getElementById('battle-enemy-name').textContent = b.enemy.name;
  updateEnemyGauges();

  renderBattleCats();

  const logEl = document.getElementById('battle-log');
  logEl.innerHTML = '';

  const initLogs = [...b.log];
  b.log = [];
  displayLogsSequentially(initLogs, () => {
    setTimeout(startBattleLoop, 600);
  });
}

function updateEnemyGauges() {
  const b = GameState.battle;

  const hpPct = Math.max(0, (b.enemy.hp / b.enemy.maxHp) * 100);
  document.getElementById('battle-enemy-hp-bar').style.width = hpPct + '%';
  document.getElementById('battle-enemy-hp-text').textContent =
    `${b.enemy.hp}/${b.enemy.maxHp}`;

  const charmPct = Math.min(100, b.enemyCharmMeter);
  document.getElementById('battle-enemy-charm-bar').style.width = charmPct + '%';
  document.getElementById('battle-enemy-charm-text').textContent =
    `${b.enemyCharmMeter}/100`;
}

function renderBattleCats() {
  const b = GameState.battle;
  const area = document.getElementById('battle-cat-area');
  area.innerHTML = '';

  b.cats.forEach(cat => {
    const isKo = cat.hp <= 0;
    const action = b.catActions[cat.id];
    const hpPct = Math.max(0, (cat.hp / cat.maxHp) * 100);

    const div = document.createElement('div');
    div.className = 'battle-cat-card' + (isKo ? ' ko' : '');
    div.innerHTML = `
      <div class="bcat-name">${cat.name}</div>
      <div class="bcat-hp-wrap">
        <span>HP</span>
        <div class="gauge-bar" style="flex:1">
          <div class="gauge-fill hp-fill" style="width:${hpPct}%"></div>
        </div>
        <span>${cat.hp}/${cat.maxHp}</span>
      </div>
      <div class="bcat-action">行動: ${action === 'attack' ? '攻撃' : '魅了'}${isKo ? '（戦闘不能）' : ''}</div>
    `;
    area.appendChild(div);
  });
}

function displayLogsSequentially(lines, onComplete) {
  if (lines.length === 0) {
    onComplete();
    return;
  }
  const logEl = document.getElementById('battle-log');
  let i = 0;
  function showNext() {
    if (i >= lines.length) {
      onComplete();
      return;
    }
    const line = lines[i++];
    const p = document.createElement('p');
    p.textContent = line;
    logEl.appendChild(p);
    logEl.scrollTop = logEl.scrollHeight;
    setTimeout(showNext, 500);
  }
  showNext();
}

function startBattleLoop() {
  startNewRound();
  processNextAction();
}

function processNextAction() {
  const b = GameState.battle;
  if (!b) return;

  const status = executeOneAction();

  const logs = [...b.log];
  b.log = [];

  displayLogsSequentially(logs, () => {
    updateEnemyGauges();
    renderBattleCats();

    if (status === 'battle_end') {
      handleBattleEnd();
    } else if (status === 'round_end') {
      setTimeout(() => {
        startNewRound();
        processNextAction();
      }, 600);
    } else {
      setTimeout(processNextAction, 200);
    }
  });
}

function handleBattleEnd() {
  const b = GameState.battle;
  if (b.result === 'win_hp' || b.result === 'win_charm') {
    setTimeout(() => {
      if (GameState.currentStage === 5) {
        showScreen('screen-ending');
      } else {
        renderStageClearScreen();
        showScreen('screen-stage-clear');
      }
    }, 1200);
  } else if (b.result === 'lose') {
    setTimeout(() => {
      showScreen('screen-gameover');
    }, 1200);
  }
}

// ===== ステージクリア画面 =====

function renderStageClearScreen() {
  const b = GameState.battle;
  const winMsg = b.result === 'win_charm'
    ? `${b.enemy.name}を魅了した！`
    : `${b.enemy.name}を撃破した！`;
  document.getElementById('stage-clear-msg').textContent = winMsg;

  const area = document.getElementById('stage-clear-cats');
  area.innerHTML = '';
  const row = document.createElement('div');
  row.className = 'draw-row';
  area.appendChild(row);

  GameState.selectedCatIds.forEach(id => {
    const battleCat = b.cats.find(c => c.id === id);
    // HP表示あり
    row.appendChild(createCatCardEl(battleCat, { showHp: true }));
  });
}

document.getElementById('btn-reward-hp').addEventListener('click', () => {
  applyStageReward('hp');
  advanceToNextStageOrEnding();
});

document.getElementById('btn-reward-points').addEventListener('click', () => {
  applyStageReward('points');
  advanceToNextStageOrEnding();
});

function advanceToNextStageOrEnding() {
  advanceStage();
  if (isGameClear()) {
    showScreen('screen-ending');
  } else {
    renderStageStartScreen();
    showScreen('screen-stage-start');
  }
}

// ===== ゲームオーバー画面 =====

document.getElementById('btn-retry').addEventListener('click', () => {
  showScreen('screen-title');
});

// ===== エンディング画面 =====

document.getElementById('btn-ending-title').addEventListener('click', () => {
  showScreen('screen-title');
});