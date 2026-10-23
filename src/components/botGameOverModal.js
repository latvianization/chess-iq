export function closeGameOverModal() {
  const existing = document.getElementById('bot-game-over-modal');
  if (existing) existing.remove();
}

export function getBotRecords() {
  try {
    return JSON.parse(localStorage.getItem('chess_iq_bot_records') || '{}');
  } catch {
    return {};
  }
}

export function recordBotResult(botId, result) {
  try {
    const records = getBotRecords();
    if (!records[botId]) records[botId] = { wins: 0, losses: 0, draws: 0 };
    if (result === 'win') records[botId].wins = (records[botId].wins || 0) + 1;
    else if (result === 'loss') records[botId].losses = (records[botId].losses || 0) + 1;
    else if (result === 'draw') records[botId].draws = (records[botId].draws || 0) + 1;
    localStorage.setItem('chess_iq_bot_records', JSON.stringify(records));
  } catch {}
}

export function showGameOverModal(arena, reason = 'Game Completed') {
  closeGameOverModal();

  const isWin = arena.gameResult === 'win';
  const isLoss = arena.gameResult === 'loss';

  let resultTitle = 'DRAW';
  let resultIcon = '🤝';
  if (isWin) {
    resultTitle = 'VICTORY!';
    resultIcon = '🏆';
  } else if (isLoss) {
    resultTitle = 'DEFEAT';
    resultIcon = '💀';
  }

  const durationSec = Math.max(1, Math.floor((Date.now() - arena.gameStartTime) / 1000));
  const mins = Math.floor(durationSec / 60);
  const secs = durationSec % 60;
  const durationStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  const moveCount = Math.ceil(arena.chess.history().length / 2);

  const modal = document.createElement('div');
  modal.className = 'game-over-modal-backdrop';
  modal.id = 'bot-game-over-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(5,7,12,0.85);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);display:flex;align-items:center;justify-content:center;padding:1rem;';
  modal.innerHTML = `
    <div class="game-over-dialog comic-card p-4 text-center border-0 shadow-lg" style="max-width: 460px; width: 100%; border-radius: 1.5rem; background: var(--arcade-card); border: 1px solid var(--arcade-border);">
      <div class="mb-3">
        <div class="d-inline-flex align-items-center justify-content-center p-3 rounded-circle mb-2" style="background: ${isWin ? 'rgba(16,185,129,0.15)' : (isLoss ? 'rgba(239,68,68,0.15)' : 'rgba(148,163,184,0.15)')};">
          <span style="font-size: 3rem; line-height: 1;">${resultIcon}</span>
        </div>
        <h2 class="fw-black mb-1 tracking-tight ${isWin ? 'text-success' : (isLoss ? 'text-danger' : 'text-body')}">${resultTitle}</h2>
        <div class="text-secondary small fw-bold">Game Over · ${reason}</div>
      </div>

      <div class="d-flex align-items-center justify-content-center gap-3 p-3 rounded-3 mb-3" style="background: rgba(0,0,0,0.04); border: 1px solid rgba(0,0,0,0.08);">
        <span class="fs-1">${arena.selectedBot.avatar}</span>
        <div class="text-start">
          <div class="fw-black fs-5">${arena.selectedBot.name}</div>
          <div class="d-flex align-items-center gap-1.5 mt-0.5">
            <span class="badge bg-warning text-dark fw-bold">${arena.selectedBot.elo} Elo</span>
            <span class="badge bg-secondary">${arena.selectedBot.title}</span>
          </div>
        </div>
      </div>

      <div class="row g-2 mb-4 text-center">
        <div class="col-4">
          <div class="p-2.5 rounded-3" style="background: rgba(0,0,0,0.03); border: 1px solid rgba(0,0,0,0.06);">
            <div class="text-secondary small fw-bold">Moves</div>
            <div class="fw-black fs-5">${moveCount}</div>
          </div>
        </div>
        <div class="col-4">
          <div class="p-2.5 rounded-3" style="background: rgba(0,0,0,0.03); border: 1px solid rgba(0,0,0,0.06);">
            <div class="text-secondary small fw-bold">Time</div>
            <div class="fw-black fs-5">${durationStr}</div>
          </div>
        </div>
        <div class="col-4">
          <div class="p-2.5 rounded-3" style="background: rgba(0,0,0,0.03); border: 1px solid rgba(0,0,0,0.06);">
            <div class="text-secondary small fw-bold">Side</div>
            <div class="fw-black fs-5">${arena.userColor === 'w' ? '⚪ White' : '⚫ Black'}</div>
          </div>
        </div>
      </div>

      <div class="d-flex flex-column gap-2">
        <button type="button" class="arcade-btn-primary py-2.5 fw-black fs-6 w-100 d-flex align-items-center justify-content-center gap-2" id="modal-btn-review">
          <i class="bi bi-lightning-charge-fill"></i> Review Game with Stockfish ⚡
        </button>
        <div class="d-flex gap-2">
          <button type="button" class="btn btn-light comic-btn flex-grow-1 py-2 fw-bold" id="modal-btn-rematch">
            <i class="bi bi-arrow-repeat me-1"></i> Rematch
          </button>
          <button type="button" class="btn btn-outline-secondary comic-btn flex-grow-1 py-2 fw-bold" id="modal-btn-close">
            <i class="bi bi-x-lg me-1"></i> Close
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector('#modal-btn-review')?.addEventListener('click', (e) => {
    const btn = e.currentTarget;
    if (btn) {
      btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Preparing Review...`;
      btn.classList.add('disabled');
    }
    closeGameOverModal();
    if (arena.onAnalyzeGame) {
      arena.onAnalyzeGame(arena.getEnrichedPgn(), arena.userColor);
    }
  });

  modal.querySelector('#modal-btn-rematch')?.addEventListener('click', () => {
    closeGameOverModal();
    arena.startNewGame();
  });

  modal.querySelector('#modal-btn-close')?.addEventListener('click', () => {
    closeGameOverModal();
  });
}
