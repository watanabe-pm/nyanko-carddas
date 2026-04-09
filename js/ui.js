// UI描画・イベント処理
// 各画面の表示切替と、ユーザー操作のハンドリングを担当

// ===== 画面切替 =====

// 指定IDの画面のみ表示する
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

// カードオブジェクトからカード要素を生成して返す
function createCatCardEl(card, options = {}) {
  const el = document.createElement('div');
  el.className = 'cat-card';
  el.dataset.id = card.id;
  el.dataset.rarity = card.rarity;

  // 現在HPをバトル中の値で表示（渡された場合）
  const currentHp = options.currentHp !== undefined ? options.currentHp : card.hp;

  el.innerHTML = `
    <div class="card-rarity">${card.rarity}</div>
    <div class="card-name">${card.name}</div>
    <div class="card-stats">
      <span><em>HP</em><strong>${currentHp}/${card.maxHp}</strong></span>
      <span><em>ATK</em><strong>${card.atk}</strong></span>
      <span><em>CHARM</em><strong>${card.charm}</strong></span>
      <span><em>SPD</em><strong>${card.spd}</strong></span>
    </div>
  `;

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

// 画面フラッシュエフェクト（SR: 白、LR: 金）
function showFlash(type) {
  const el = document.createElement('div');
  el.className = `flash-overlay flash-${type}`;
  document.body.appendChild(el);
  el.addEventListener('animationend', () => el.remove());
}

// 金色パーティクルエフェクト（LR専用）
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

  // 上段3枚・下段2枚のレイアウト用の行を用意
  const topRow = document.createElement('div');
  topRow.className = 'draw-row';
  const bottomRow = document.createElement('div');
  bottomRow.className = 'draw-row';
  list.appendChild(topRow);
  list.appendChild(bottomRow);

  // SR/LRはフリップ前に演出を挟むため累積ディレイで管理
  let delay = 0;

  GameState.deck.forEach((card, index) => {
    // フリップ構造を構築
    const wrapper = document.createElement('div');
    wrapper.className = 'card-flip-wrapper';

    const inner = document.createElement('div');
    inner.className = 'card-flip-inner';

    // 裏面
    const back = document.createElement('div');
    back.className = 'card-flip-back';

    // 表面（既存の関数で生成）
    const front = createCatCardEl(card);

    inner.appendChild(back);
    inner.appendChild(front);
    wrapper.appendChild(inner);

    // 0〜2枚目は上段、3〜4枚目は下段
    const row = index < 3 ? topRow : bottomRow;
    row.appendChild(wrapper);

    const isSR = card.rarity === 'SR';
    const isLR = card.rarity === 'LR';
    const cardDelay = delay;

    setTimeout(() => {
      // 裏向きで出現
      wrapper.classList.add('revealed');

      if (isSR || isLR) {
        // レアリティ演出：出現150ms後にフラッシュ→400ms後にフリップ
        setTimeout(() => {
          showFlash(isLR ? 'lr' : 'sr');
          if (isLR) showParticles();
          setTimeout(() => {
            wrapper.classList.add('flipped');
          }, 400);
        }, 150);
      } else {
        // N/R：200ms後に即フリップ
        setTimeout(() => {
          wrapper.classList.add('flipped');
        }, 200);
      }
    }, cardDelay);

    // レアリティに応じて次のカードまでの間隔を設定
    delay += isLR ? 2000 : isSR ? 1500 : 600;
  });
}

document.getElementById('btn-draw-next').addEventListener('click', () => {
  // ステージ1のみ猫選択画面へ、2戦目以降はスキップ
  if (GameState.selectedCatIds.length === 0) {
    renderCatSelectScreen();
    showScreen('screen-cat-select');
  } else {
    renderStageStartScreen();
    showScreen('screen-stage-start');
  }
});

// ===== 猫選択画面 =====

// 選択中のカードIDセット（猫選択画面専用）
let catSelectIds = new Set();

// 選択済みカードをプレビューエリアに表示
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

function renderCatSelectScreen() {
  catSelectIds = new Set();
  updateCatSelectConfirmBtn();
  renderCatSelectPreview();

  const list = document.getElementById('cat-select-list');
  list.innerHTML = '';

  // 上段3枚・下段2枚のレイアウト
  const topRow = document.createElement('div');
  topRow.className = 'draw-row';
  const bottomRow = document.createElement('div');
  bottomRow.className = 'draw-row';
  list.appendChild(topRow);
  list.appendChild(bottomRow);

  GameState.deck.forEach((card, index) => {
    const el = createCatCardEl(card);
    el.addEventListener('click', () => {
      if (catSelectIds.has(card.id)) {
        catSelectIds.delete(card.id);
        el.classList.remove('selected');
      } else {
        if (catSelectIds.size >= 3) return;
        catSelectIds.add(card.id);
        el.classList.add('selected');
      }
      updateCatSelectConfirmBtn();
      renderCatSelectPreview();
    });
    const row = index < 3 ? topRow : bottomRow;
    row.appendChild(el);
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

// 選択中のカードIDセット
let prepSelectedIds = new Set();
// 各カードの行動 { cardId: 'attack' | 'charm' }
let prepCatActions = {};
// 各カードのアイテム装備 { cardId: itemId | null }
let prepEquippedItems = {};
// 購入済みアイテム在庫数 { itemId: count }
let purchasedItems = {};
// チーム全体の行動（'attack' | 'charm'）
let prepTeamAction = 'attack';

function renderBattlePrepScreen() {
  // 猫選択画面で選んだ3匹を固定で使用
  prepSelectedIds = new Set(GameState.selectedCatIds);
  prepCatActions = {};
  prepEquippedItems = {};
  prepTeamAction = 'attack'; // デフォルトは攻撃主体
  purchasedItems = {};

  // 選択済みの3匹を1行で表示（選択操作なし）
  const list = document.getElementById('prep-card-list');
  list.innerHTML = '';
  const row = document.createElement('div');
  row.className = 'draw-row';
  list.appendChild(row);

  GameState.selectedCatIds.forEach(id => {
    const card = GameState.deck.find(c => c.id === id);
    const el = createCatCardEl(card);
    row.appendChild(el);
  });

  renderPrepItemShop();
  renderPrepEquipArea();
  renderPrepActionList();
  updateBattleStartBtn();
}

// カード選択トグル
function togglePrepCardSelect(cardId) {
  if (prepSelectedIds.has(cardId)) {
    prepSelectedIds.delete(cardId);
  } else {
    if (prepSelectedIds.size >= 3) return; // 3匹まで
    prepSelectedIds.add(cardId);
  }
  // 選択状態をDOMに反映
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

// アイテムショップ表示
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
        renderPrepItemShop();   // ポイント更新後に再描画
        renderPrepEquipArea();  // 装備セレクト更新
      }
    });
    shop.appendChild(btn);
  });
}

// 指定カード以外の装備を除いた残り在庫数を返す
function getItemAvailableCount(itemId, excludeCardId) {
  const total = purchasedItems[itemId] || 0;
  const usedByOthers = [...prepSelectedIds]
    .filter(id => id !== excludeCardId && prepEquippedItems[id] === itemId)
    .length;
  return total - usedByOthers;
}

// 装備エリア表示（選択中の猫ごとにセレクトボックス）
function renderPrepEquipArea() {
  const area = document.getElementById('prep-equip-area');
  area.innerHTML = '';
  if (prepSelectedIds.size === 0) return;

  prepSelectedIds.forEach(cardId => {
    const card = GameState.deck.find(c => c.id === cardId);
    const row = document.createElement('div');
    row.className = 'equip-row';

    const nameEl = document.createElement('span');
    nameEl.className = 'equip-cat-name';
    nameEl.textContent = card.name;

    const select = document.createElement('select');
    // 「なし」オプション
    const noneOpt = document.createElement('option');
    noneOpt.value = '';
    noneOpt.textContent = 'アイテムなし';
    select.appendChild(noneOpt);

    // 在庫があるアイテムのみ選択肢に追加（自分が装備中のものは常に表示）
    Object.keys(purchasedItems).forEach(itemId => {
      const isEquippedHere = prepEquippedItems[cardId] === itemId;
      const available = getItemAvailableCount(itemId, cardId);
      // 在庫ゼロかつ自分が装備していない場合はスキップ
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
      // 他の猫の選択肢に在庫変更を反映する
      renderPrepEquipArea();
    });

    // 初期値反映
    if (prepEquippedItems[cardId] === undefined) prepEquippedItems[cardId] = null;

    row.appendChild(nameEl);
    row.appendChild(select);
    area.appendChild(row);
  });
}

// 行動選択エリア表示（チーム全体で1択）
function renderPrepActionList() {
  // 全員の catActions を現在のチーム行動で更新
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

// バトル開始ボタンの活性制御
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

  // 敵情報
  document.getElementById('battle-enemy-name').textContent = b.enemy.name;
  updateEnemyGauges();

  // 猫ステータス
  renderBattleCats();

  // ログクリア
  const logEl = document.getElementById('battle-log');
  logEl.innerHTML = '';

  // 初期ログ（アイテム発動等）を順番に表示してから最初のラウンドを開始
  const initLogs = [...b.log];
  b.log = [];
  displayLogsSequentially(initLogs, () => {
    setTimeout(runNextRound, 600);
  });
}

// 敵HPゲージ・魅了度ゲージを更新
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

// バトル中の猫カードを描画
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

// ログ行を1行ずつ500ms間隔で追記し、完了後にコールバックを呼ぶ
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
    if (line.startsWith('===')) p.className = 'log-round';
    p.textContent = line;
    logEl.appendChild(p);
    logEl.scrollTop = logEl.scrollHeight;
    setTimeout(showNext, 500);
  }
  showNext();
}

// 1ラウンド実行してログ逐次表示→次ラウンドまたは終了処理
function runNextRound() {
  const b = GameState.battle;
  if (!b || b.result) return;

  executeRound();

  const logs = [...b.log];
  b.log = [];

  displayLogsSequentially(logs, () => {
    updateEnemyGauges();
    renderBattleCats();

    if (b.result) {
      handleBattleEnd();
    } else {
      // 次のラウンドまで少し間隔を空ける
      setTimeout(runNextRound, 600);
    }
  });
}

// バトル終了時の画面遷移
function handleBattleEnd() {
  const b = GameState.battle;
  if (b.result === 'win_hp' || b.result === 'win_charm') {
    setTimeout(() => {
      // ステージ5クリアはクリア画面をスキップしてエンディングへ
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

  // 出撃した3匹をバトル後のHPで表示
  const area = document.getElementById('stage-clear-cats');
  area.innerHTML = '';
  const row = document.createElement('div');
  row.className = 'draw-row';
  area.appendChild(row);

  GameState.selectedCatIds.forEach(id => {
    const battleCat = b.cats.find(c => c.id === id);
    row.appendChild(createCatCardEl(battleCat));
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

// 報酬選択後の遷移
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
