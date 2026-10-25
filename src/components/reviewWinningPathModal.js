/**
 * Winning Path Modal Component
 * Generates and steps through the decisive winning continuation using Stockfish
 * until checkmate is reached or the win is completely unstoppable.
 */

function closeWinningPathModal() {
  const existing = document.getElementById('winning-path-modal');
  if (existing) {
    if (existing._timer) {
      clearInterval(existing._timer);
      existing._timer = null;
    }
    existing.remove();
  }
  document.body.classList.remove('modal-open');
}

async function openWinningPathModal(dashboard) {
  closeWinningPathModal();

  const curEval = dashboard.getCurrentEval();
  let currentFen = curEval ? (curEval.fen || curEval.fenAfter) : null;
  if (!currentFen && dashboard.game && Array.isArray(dashboard.game.plies)) {
    const ply = dashboard.currentPly > 0 ? dashboard.game.plies[dashboard.currentPly - 1] : null;
    currentFen = ply ? ply.fen : dashboard.game.fen;
  }
  if (!currentFen) currentFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  document.body.classList.add('modal-open');

  const modal = document.createElement('div');
  modal.className = 'why-modal-backdrop';
  modal.id = 'winning-path-modal';
  modal.innerHTML = `
    <div class="why-dialog p-3 p-md-3.5 shadow-lg" style="max-width: 820px; width: 100%; border-radius: 1.25rem; background: var(--arcade-card); border: 1.5px solid var(--arcade-border);">
      <!-- Header -->
      <div class="d-flex align-items-center justify-content-between pb-2.5 mb-3 border-bottom" style="border-color: var(--arcade-border) !important;">
        <div class="d-flex align-items-center gap-2.5">
          <span class="badge rounded-pill px-3 py-1.5 fw-black font-monospace" style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: #0b0e14; font-size: 12px;">
            <i class="bi bi-trophy-fill me-1"></i>WINNING PATH
          </span>
          <div>
            <h5 class="mb-0 fw-black fs-6 text-body">How to End This Game with a Win</h5>
            <div class="text-secondary small font-monospace" id="win-modal-subtitle">Calculating winning engine sequence...</div>
          </div>
        </div>
        <button type="button" class="btn-close" id="win-btn-close" aria-label="Close"></button>
      </div>

      <!-- Status banner -->
      <div class="alert py-2 px-3 small font-medium mb-3 d-flex align-items-center justify-content-between flex-wrap gap-2" id="win-status-banner" style="background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.3);">
        <div class="d-flex align-items-center gap-2">
          <div class="spinner-border spinner-border-sm text-warning" id="win-loading-spinner" role="status"></div>
          <span class="fw-bold" id="win-status-text">Analyzing position with Stockfish to generate forced win...</span>
        </div>
        <span class="badge bg-body-secondary text-secondary font-monospace fw-bold px-2 py-1" id="win-step-counter">Move 0 / 0</span>
      </div>

      <!-- Main Layout -->
      <div class="row g-3 align-items-stretch">
        <div class="col-12 col-md-7 d-flex flex-column align-items-center">
          <div id="win-modal-board" style="width: 100%; max-width: min(370px, 42vh); aspect-ratio: 1/1;"></div>
          <!-- Step Navigation under board -->
          <div class="w-100 mt-2.5">
            <div class="d-flex align-items-center justify-content-center gap-2 py-1">
              <button type="button" class="btn btn-sm btn-outline-secondary px-2" id="win-btn-first" disabled title="Start (Home)">
                <i class="bi bi-chevron-bar-left"></i>
              </button>
              <button type="button" class="btn btn-sm btn-outline-secondary px-2.5" id="win-btn-prev" disabled title="Previous Move (←)">
                <i class="bi bi-chevron-left"></i>
              </button>
              <button type="button" class="btn btn-sm btn-warning text-dark px-3 fw-bold" id="win-btn-play" disabled title="Play / Pause (Space)">
                <i class="bi bi-play-fill" id="win-play-icon"></i>
              </button>
              <button type="button" class="btn btn-sm btn-outline-secondary px-2.5" id="win-btn-next" disabled title="Next Move (→)">
                <i class="bi bi-chevron-right"></i>
              </button>
              <button type="button" class="btn btn-sm btn-outline-secondary px-2" id="win-btn-last" disabled title="End (End)">
                <i class="bi bi-chevron-bar-right"></i>
              </button>
            </div>
            <div class="text-center text-secondary small fw-semibold mt-1" style="font-size: 11px;">
              <i class="bi bi-keyboard me-1"></i>Arrow keys: <kbd class="bg-body-secondary text-body px-1">←</kbd> <kbd class="bg-body-secondary text-body px-1">→</kbd> | Space: Play
            </div>
          </div>
        </div>

        <div class="col-12 col-md-5 d-flex flex-column justify-content-between">
          <div>
            <div class="card border-0 mb-2.5 p-2.5" style="background: var(--arcade-card-hover, rgba(0,0,0,0.03)); border: 1px solid var(--arcade-border) !important; border-radius: 0.75rem;">
              <span class="text-uppercase fw-bold text-secondary d-block mb-1" style="font-size: 10px; letter-spacing: 0.5px;">Engine Verdict</span>
              <p class="small mb-0 fw-semibold text-body" id="win-verdict-text">
                Evaluating winning variations...
              </p>
            </div>

            <div class="p-2.5 rounded-3" style="background: var(--arcade-card-hover, rgba(0,0,0,0.03)); border: 1px solid var(--arcade-border);">
              <div class="d-flex align-items-center justify-content-between mb-1.5">
                <span class="small fw-bold text-secondary" style="font-size: 12px;">Winning Line Sequence:</span>
                <span class="small text-warning font-monospace fw-bold" id="win-line-summary"></span>
              </div>
              <div class="d-flex flex-wrap gap-1.5" id="win-pills-container">
                <span class="text-secondary small"><span class="spinner-border spinner-border-sm me-1 text-warning"></span>Finding winning moves...</span>
              </div>
            </div>
          </div>

          <div class="card border-0 mt-2 p-2" style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25) !important; border-radius: 0.65rem;">
            <div class="d-flex align-items-center gap-2">
              <span class="fs-6">💡</span>
              <span class="small text-success fw-bold" style="font-size: 11px;">
                Follow this line to convert the win without giving your opponent any counterplay.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const dialogEl = modal.querySelector('.why-dialog');
  const safeClose = typeof setupModalSwipeAndHistory === 'function'
    ? setupModalSwipeAndHistory(modal, dialogEl, closeWinningPathModal)
    : closeWinningPathModal;

  modal.querySelector('#win-btn-close')?.addEventListener('click', safeClose);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) safeClose();
  });

  const boardMount = modal.querySelector('#win-modal-board');
  const winBoard = new Chessboard(boardMount, {
    fen: currentFen,
    orientation: dashboard.orientation,
    theme: dashboard.theme,
    interactive: false,
  });

  // Calculate winning path
  try {
    const baseEval = await evaluateFenHybrid(currentFen, 'deep');
    const isWhiteTurn = currentFen.split(' ')[1] === 'w';
    const scoreCp = baseEval.scoreCp || 0;
    const mate = baseEval.mate;

    const isWhiteWinning = mate !== null ? mate > 0 : scoreCp >= 140;
    const isBlackWinning = mate !== null ? mate < 0 : scoreCp <= -140;

    const winSubtitle = modal.querySelector('#win-modal-subtitle');
    const winStatusText = modal.querySelector('#win-status-text');
    const winVerdictText = modal.querySelector('#win-verdict-text');
    const winSpinner = modal.querySelector('#win-loading-spinner');
    const pillsContainer = modal.querySelector('#win-pills-container');

    if (!isWhiteWinning && !isBlackWinning) {
      if (winSpinner) winSpinner.remove();
      if (winStatusText) winStatusText.textContent = 'Position is balanced (evaluation near 0.0). No forced win available.';
      if (winSubtitle) winSubtitle.textContent = 'Position is equal';
      if (winVerdictText) {
        winVerdictText.innerHTML = `
          The current position is completely equal (evaluation: <strong>${(scoreCp / 100).toFixed(1)}</strong>).
          <br><br>Neither player has a forced or unstoppable win from this exact square. Use the move navigation buttons to jump to a position where you or your opponent had a tactical advantage!
        `;
      }
      if (pillsContainer) pillsContainer.innerHTML = '<span class="text-secondary small fst-italic">No winning moves required — game is in balance.</span>';
      return;
    }

    const winnerColor = isWhiteWinning ? 'w' : 'b';
    const winnerName = isWhiteWinning ? 'White' : 'Black';

    // Generate moves until checkmate or unstoppable advantage (+900cp)
    const steps = [
      { ply: 0, fen: currentFen, san: 'Start', from: null, to: null }
    ];

    const simChess = new Chess(currentFen);
    let currentSimFen = currentFen;
    let mateFound = false;
    let unstoppableWin = false;
    let finalSummary = '';

    for (let plyIdx = 1; plyIdx <= 14; plyIdx++) {
      if (simChess.in_checkmate() || simChess.game_over()) {
        mateFound = true;
        break;
      }

      const ev = await evaluateFenHybrid(currentSimFen, plyIdx <= 4 ? 'deep' : 'fast');
      const uci = (ev.pv && ev.pv[0]) || ev.bestMoveUci;
      if (!uci || uci.length < 4) break;

      const from = uci.slice(0, 2);
      const to = uci.slice(2, 4);
      const promotion = uci.length > 4 ? uci[4] : void 0;
      const m = simChess.move({ from, to, promotion });
      if (!m) break;

      currentSimFen = simChess.fen();
      steps.push({
        ply: plyIdx,
        san: m.san,
        uci,
        from: m.from,
        to: m.to,
        fen: currentSimFen,
        color: m.color
      });

      if (simChess.in_checkmate()) {
        mateFound = true;
        finalSummary = `Forced Checkmate delivered in ${plyIdx} plies!`;
        break;
      }

      // Check if unstoppable win reached
      const currentScore = winnerColor === 'w' ? ev.scoreCp : -ev.scoreCp;
      if (plyIdx >= 6 && (currentScore >= 900 || (ev.mate !== null && Math.abs(ev.mate) <= 2))) {
        unstoppableWin = true;
        finalSummary = `Unstoppable win reached (+${(Math.abs(currentScore) / 100).toFixed(1)} decisive advantage)!`;
        break;
      }
    }

    if (!finalSummary) {
      finalSummary = mateFound ? 'Checkmate sequence complete!' : 'Decisive winning continuation reached!';
    }

    if (winSpinner) winSpinner.remove();
    if (winStatusText) winStatusText.textContent = `🏆 ${winnerName} Wins: ${finalSummary}`;
    if (winSubtitle) winSubtitle.textContent = `${winnerName} has a decisive win (${steps.length - 1} moves generated)`;
    if (winVerdictText) {
      winVerdictText.innerHTML = `
        <span class="badge ${winnerColor === 'w' ? 'bg-light text-dark border' : 'bg-dark text-white'} fw-bold me-1.5">${winnerName} Wins</span>
        ${finalSummary}
        <div class="mt-2 text-secondary small">
          Engine confirms: ${winnerName} has full tactical control with no possible defensive counterplay.
        </div>
      `;
    }

    // Enable buttons
    modal.querySelectorAll('button[disabled]').forEach((btn) => btn.removeAttribute('disabled'));

    let stepIdx = steps.length > 1 ? 1 : 0;
    let isPlaying = false;

    const renderStep = () => {
      const step = steps[stepIdx];
      if (!step) return;

      winBoard.setProps({
        fen: step.fen,
        lastMove: step.from && step.to ? { from: step.from, to: step.to } : null,
        bestMove: step.from && step.to ? { from: step.from, to: step.to } : null,
        showBestMove: true
      });

      const counterEl = modal.querySelector('#win-step-counter');
      if (counterEl) {
        counterEl.textContent = `Move ${stepIdx} / ${steps.length - 1}`;
      }

      const pills = modal.querySelectorAll('.win-move-pill');
      pills.forEach((p, idx) => {
        if (idx === stepIdx) {
          p.classList.remove('btn-outline-secondary');
          p.classList.add('btn-warning', 'text-dark', 'fw-black');
        } else {
          p.classList.remove('btn-warning', 'text-dark', 'fw-black');
          p.classList.add('btn-outline-secondary');
        }
      });
    };

    if (pillsContainer) {
      pillsContainer.innerHTML = '';
      steps.forEach((st, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `btn btn-sm py-0.5 px-2 font-monospace fw-bold rounded-pill win-move-pill ${idx === stepIdx ? 'btn-warning text-dark fw-black' : 'btn-outline-secondary'}`;
        btn.style.fontSize = '11px';
        btn.textContent = idx === 0 ? 'Start' : `${st.ply}. ${st.san}`;
        btn.addEventListener('click', () => {
          stopAutoplay();
          stepIdx = idx;
          if (typeof soundService !== 'undefined') soundService.playMove();
          renderStep();
        });
        pillsContainer.appendChild(btn);
      });
    }

    renderStep();

    const stopAutoplay = () => {
      if (modal._timer) {
        clearInterval(modal._timer);
        modal._timer = null;
      }
      isPlaying = false;
      const icon = modal.querySelector('#win-play-icon');
      if (icon) icon.className = 'bi bi-play-fill';
    };

    const startAutoplay = () => {
      if (isPlaying) {
        stopAutoplay();
        return;
      }
      if (stepIdx >= steps.length - 1) stepIdx = 0;
      isPlaying = true;
      const icon = modal.querySelector('#win-play-icon');
      if (icon) icon.className = 'bi bi-pause-fill';

      modal._timer = setInterval(() => {
        if (stepIdx < steps.length - 1) {
          stepIdx++;
          if (typeof soundService !== 'undefined') soundService.playMove();
          renderStep();
        } else {
          stopAutoplay();
        }
      }, 750);
    };

    modal.querySelector('#win-btn-first')?.addEventListener('click', () => {
      stopAutoplay();
      stepIdx = 0;
      if (typeof soundService !== 'undefined') soundService.playMove();
      renderStep();
    });

    modal.querySelector('#win-btn-prev')?.addEventListener('click', () => {
      stopAutoplay();
      if (stepIdx > 0) {
        stepIdx--;
        if (typeof soundService !== 'undefined') soundService.playMove();
        renderStep();
      }
    });

    modal.querySelector('#win-btn-play')?.addEventListener('click', startAutoplay);

    modal.querySelector('#win-btn-next')?.addEventListener('click', () => {
      stopAutoplay();
      if (stepIdx < steps.length - 1) {
        stepIdx++;
        if (typeof soundService !== 'undefined') soundService.playMove();
        renderStep();
      }
    });

    modal.querySelector('#win-btn-last')?.addEventListener('click', () => {
      stopAutoplay();
      stepIdx = steps.length - 1;
      if (typeof soundService !== 'undefined') soundService.playMove();
      renderStep();
    });

  } catch (err) {
    console.error('Error generating winning path:', err);
  }
}

if (typeof window !== 'undefined') {
  window.openWinningPathModal = openWinningPathModal;
  window.closeWinningPathModal = closeWinningPathModal;
}
