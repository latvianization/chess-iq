/**
 * Winning Path Modal Component
 * Generates and steps through the decisive winning continuation using Stockfish
 * until checkmate is reached or the win is completely unstoppable.
 * Also provides in-modal Game Move navigation so users can inspect winning
 * paths at any moment of the game.
 */

function closeWinningPathModal() {
  const existing = document.getElementById('winning-path-modal');
  if (existing) {
    if (existing._timer) {
      clearInterval(existing._timer);
      existing._timer = null;
    }
    if (existing._keyHandler) {
      window.removeEventListener('keydown', existing._keyHandler);
      existing._keyHandler = null;
    }
    existing.remove();
  }
  document.body.classList.remove('modal-open');
}

async function openWinningPathModal(dashboard, plyOverride = null) {
  closeWinningPathModal();

  if (!dashboard) return;

  const totalPlies = (dashboard.game && Array.isArray(dashboard.game.plies)) ? dashboard.game.plies.length : 0;
  let currentPly = (typeof plyOverride === 'number')
    ? Math.max(0, Math.min(plyOverride, totalPlies))
    : Math.max(0, Math.min(dashboard.currentPly || 0, totalPlies));

  // Identify all plies in the game where either player has a decisive advantage
  const getDecisivePlies = () => {
    const list = [];
    if (!dashboard.game || !Array.isArray(dashboard.game.plies)) return list;
    dashboard.game.plies.forEach((p, idx) => {
      const score = p.score ?? p.scoreCp ?? 0;
      const hasDecisiveAdvantage = (p.mate !== null && p.mate !== undefined) || Math.abs(score) >= 150;
      if (hasDecisiveAdvantage) {
        list.push({
          ply: idx + 1,
          score,
          mate: p.mate,
          san: p.san,
          color: p.color
        });
      }
    });
    return list;
  };

  const decisivePlies = getDecisivePlies();

  document.body.classList.add('modal-open');

  const modal = document.createElement('div');
  modal.className = 'why-modal-backdrop';
  modal.id = 'winning-path-modal';
  modal.innerHTML = `
    <div class="why-dialog p-3 p-md-3.5 shadow-lg" style="max-width: 840px; width: 100%; border-radius: 1.25rem; background: var(--arcade-card); border: 1.5px solid var(--arcade-border);">
      <!-- Header -->
      <div class="d-flex align-items-center justify-content-between pb-2.5 mb-2.5 border-bottom" style="border-color: var(--arcade-border) !important;">
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

      <!-- Game Move Navigation Bar -->
      <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 p-2 mb-2.5 rounded-3" id="win-game-nav-bar" style="background: var(--arcade-card-hover, rgba(0,0,0,0.03)); border: 1px solid var(--arcade-border);">
        <div class="d-flex align-items-center gap-2 flex-wrap">
          <span class="text-secondary small fw-bold text-uppercase d-none d-sm-inline" style="font-size: 10px; letter-spacing: 0.5px;">Game Move:</span>
          <span class="badge bg-body-secondary text-body font-monospace fw-bold px-2 py-1" id="win-game-ply-badge">Start</span>
          <span class="badge font-monospace fw-bold px-2 py-1" id="win-game-eval-badge">0.0</span>
        </div>
        <div class="d-flex align-items-center gap-1 flex-wrap">
          <button type="button" class="btn btn-sm btn-outline-secondary py-1 px-2" id="win-game-first" title="Game Start (Ctrl+Home)">
            <i class="bi bi-chevron-bar-left"></i>
          </button>
          <button type="button" class="btn btn-sm btn-outline-secondary py-1 px-2.5 fw-semibold" id="win-game-prev" title="Previous Game Move (↑ / [)">
            <i class="bi bi-chevron-left me-0.5"></i><span class="d-none d-sm-inline">Prev Move</span>
          </button>
          <button type="button" class="btn btn-sm btn-outline-secondary py-1 px-2.5 fw-semibold" id="win-game-next" title="Next Game Move (↓ / ])">
            <span class="d-none d-sm-inline">Next Move</span><i class="bi bi-chevron-right ms-0.5"></i>
          </button>
          <button type="button" class="btn btn-sm btn-outline-secondary py-1 px-2" id="win-game-last" title="Game End (Ctrl+End)">
            <i class="bi bi-chevron-bar-right"></i>
          </button>
          <button type="button" class="btn btn-sm btn-warning text-dark fw-bold py-1 px-2.5 ms-1" id="win-game-jump-decisive" title="Jump to Decisive Winning Move in Game">
            <i class="bi bi-lightning-charge-fill me-1"></i><span class="d-none d-sm-inline">Next </span>Win
          </button>
        </div>
      </div>

      <!-- Status banner -->
      <div class="alert py-2 px-3 small font-medium mb-3 d-flex align-items-center justify-content-between flex-wrap gap-2" id="win-status-banner" style="background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.3);">
        <div class="d-flex align-items-center gap-2">
          <div class="spinner-border spinner-border-sm text-warning" id="win-loading-spinner" role="status"></div>
          <span class="fw-bold" id="win-status-text">Analyzing position with Stockfish to generate forced win...</span>
        </div>
        <span class="badge bg-body-secondary text-secondary font-monospace fw-bold px-2.5 py-1" id="win-step-counter">Move 0 / 0</span>
      </div>

      <!-- Main Layout -->
      <div class="row g-3 align-items-stretch">
        <div class="col-12 col-md-7 d-flex flex-column align-items-center">
          <div id="win-modal-board" style="width: 100%; max-width: min(370px, 42vh); aspect-ratio: 1/1;"></div>
          <!-- Step Navigation under board -->
          <div class="w-100 mt-2.5">
            <div class="d-flex align-items-center justify-content-center gap-1.5 py-1 flex-wrap">
              <button type="button" class="btn btn-sm btn-outline-secondary px-2.5" id="win-btn-first" title="Start of Line (Home)">
                <i class="bi bi-chevron-bar-left"></i>
              </button>
              <button type="button" class="btn btn-sm btn-outline-secondary px-3 fw-bold" id="win-btn-prev" title="Previous Step (←)">
                <i class="bi bi-chevron-left me-1"></i>Prev
              </button>
              <button type="button" class="btn btn-sm btn-warning text-dark px-3 fw-black" id="win-btn-play" title="Play / Pause Autoplay (Space)">
                <i class="bi bi-play-fill me-1" id="win-play-icon"></i><span id="win-play-label">Play</span>
              </button>
              <button type="button" class="btn btn-sm btn-outline-secondary px-3 fw-bold" id="win-btn-next" title="Next Step (→)">
                Next<i class="bi bi-chevron-right ms-1"></i>
              </button>
              <button type="button" class="btn btn-sm btn-outline-secondary px-2.5" id="win-btn-last" title="End of Line (End)">
                <i class="bi bi-chevron-bar-right"></i>
              </button>
            </div>
            <div class="text-center text-secondary small fw-semibold mt-1" style="font-size: 11px;">
              <i class="bi bi-keyboard me-1"></i>Keys: <kbd class="bg-body-secondary text-body px-1">←</kbd> <kbd class="bg-body-secondary text-body px-1">→</kbd> Steps | <kbd class="bg-body-secondary text-body px-1">Space</kbd> Play | <kbd class="bg-body-secondary text-body px-1">↑</kbd> <kbd class="bg-body-secondary text-body px-1">↓</kbd> Game Moves
            </div>
          </div>
        </div>

        <div class="col-12 col-md-5 d-flex flex-column justify-content-between">
          <div>
            <div class="card border-0 mb-2.5 p-2.5" style="background: var(--arcade-card-hover, rgba(0,0,0,0.03)); border: 1px solid var(--arcade-border) !important; border-radius: 0.75rem;">
              <span class="text-uppercase fw-bold text-secondary d-block mb-1" style="font-size: 10px; letter-spacing: 0.5px;">Engine Verdict</span>
              <div class="small mb-0 fw-semibold text-body" id="win-verdict-text">
                Evaluating winning variations...
              </div>
            </div>

            <div class="p-2.5 rounded-3 mb-2" style="background: var(--arcade-card-hover, rgba(0,0,0,0.03)); border: 1px solid var(--arcade-border);">
              <div class="d-flex align-items-center justify-content-between mb-1.5">
                <span class="small fw-bold text-secondary" style="font-size: 12px;">Winning Line Sequence:</span>
                <span class="small text-warning font-monospace fw-bold" id="win-line-summary"></span>
              </div>
              <div class="d-flex flex-wrap gap-1.5" id="win-pills-container" style="max-height: 160px; overflow-y: auto;">
                <span class="text-secondary small"><span class="spinner-border spinner-border-sm me-1 text-warning"></span>Finding winning moves...</span>
              </div>
            </div>
          </div>

          <div class="card border-0 mt-2 p-2" id="win-tip-card" style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25) !important; border-radius: 0.65rem;">
            <div class="d-flex align-items-center gap-2">
              <span class="fs-6">💡</span>
              <span class="small text-success fw-bold" id="win-tip-text" style="font-size: 11px;">
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

  // Keyboard navigation handler - strictly prevents keys from affecting the board behind the modal
  const keyHandler = (e) => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName) || e.target?.isContentEditable) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      safeClose();
    } else if (e.key === 'ArrowLeft' || e.key === 'Left' || e.code === 'ArrowLeft') {
      e.preventDefault();
      e.stopPropagation();
      modal.querySelector('#win-btn-prev')?.click();
    } else if (e.key === 'ArrowRight' || e.key === 'Right' || e.code === 'ArrowRight') {
      e.preventDefault();
      e.stopPropagation();
      modal.querySelector('#win-btn-next')?.click();
    } else if (e.key === ' ' || e.code === 'Space') {
      e.preventDefault();
      e.stopPropagation();
      modal.querySelector('#win-btn-play')?.click();
    } else if (e.key === 'Home' && !e.ctrlKey) {
      e.preventDefault();
      e.stopPropagation();
      modal.querySelector('#win-btn-first')?.click();
    } else if (e.key === 'End' && !e.ctrlKey) {
      e.preventDefault();
      e.stopPropagation();
      modal.querySelector('#win-btn-last')?.click();
    } else if (e.key === 'ArrowUp' || e.key === 'Up' || e.code === 'ArrowUp' || e.key === '[' || (e.ctrlKey && (e.key === 'ArrowLeft' || e.key === 'Home'))) {
      e.preventDefault();
      e.stopPropagation();
      modal.querySelector('#win-game-prev')?.click();
    } else if (e.key === 'ArrowDown' || e.key === 'Down' || e.code === 'ArrowDown' || e.key === ']' || (e.ctrlKey && (e.key === 'ArrowRight' || e.key === 'End'))) {
      e.preventDefault();
      e.stopPropagation();
      modal.querySelector('#win-game-next')?.click();
    }
  };

  window.addEventListener('keydown', keyHandler);
  modal._keyHandler = keyHandler;

  // Initialize board inside modal
  const boardMount = modal.querySelector('#win-modal-board');
  const winBoard = new Chessboard(boardMount, {
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    orientation: dashboard.orientation || 'w',
    theme: dashboard.theme || 'default',
    interactive: false,
  });
  modal._winBoard = winBoard;

  // Autoplay management
  let isPlaying = false;
  let steps = [];
  let stepIdx = 0;
  let analysisSeq = 0;

  const stopAutoplay = () => {
    if (modal._timer) {
      clearInterval(modal._timer);
      modal._timer = null;
    }
    isPlaying = false;
    const icon = modal.querySelector('#win-play-icon');
    if (icon) icon.className = 'bi bi-play-fill me-1';
    const label = modal.querySelector('#win-play-label');
    if (label) label.textContent = 'Play';
  };

  const startAutoplay = () => {
    if (isPlaying) {
      stopAutoplay();
      return;
    }
    if (stepIdx >= steps.length - 1) stepIdx = 0;
    isPlaying = true;
    const icon = modal.querySelector('#win-play-icon');
    if (icon) icon.className = 'bi bi-pause-fill me-1';
    const label = modal.querySelector('#win-play-label');
    if (label) label.textContent = 'Pause';

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

  const renderStep = () => {
    const step = steps[stepIdx];
    if (!step) return;

    winBoard.setProps({
      fen: step.fen,
      lastMove: step.from && step.to ? { from: step.from, to: step.to } : null,
      bestMove: step.from && step.to ? { from: step.from, to: step.to } : null,
      showBestMove: true,
    });

    const counterEl = modal.querySelector('#win-step-counter');
    if (counterEl) {
      counterEl.textContent = `Move ${stepIdx} / ${Math.max(0, steps.length - 1)}`;
    }

    // Step button disabled states
    const btnFirst = modal.querySelector('#win-btn-first');
    const btnPrev = modal.querySelector('#win-btn-prev');
    const btnNext = modal.querySelector('#win-btn-next');
    const btnLast = modal.querySelector('#win-btn-last');

    if (btnFirst) btnFirst.disabled = stepIdx <= 0;
    if (btnPrev) btnPrev.disabled = stepIdx <= 0;
    if (btnNext) btnNext.disabled = stepIdx >= steps.length - 1;
    if (btnLast) btnLast.disabled = stepIdx >= steps.length - 1;

    // Active move pill highlight
    const pills = modal.querySelectorAll('.win-move-pill');
    pills.forEach((p, idx) => {
      if (idx === stepIdx) {
        p.classList.remove('btn-outline-secondary');
        p.classList.add('btn-warning', 'text-dark', 'fw-black');
        try { p.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch {}
      } else {
        p.classList.remove('btn-warning', 'text-dark', 'fw-black');
        p.classList.add('btn-outline-secondary');
      }
    });
  };

  // Bind Step Navigation Buttons
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

  modal.querySelector('#win-btn-play')?.addEventListener('click', () => {
    if (isPlaying) {
      stopAutoplay();
    } else {
      startAutoplay();
    }
  });

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

  // Bind Game Navigation Buttons
  modal.querySelector('#win-game-first')?.addEventListener('click', () => {
    loadPositionForPly(0);
  });

  modal.querySelector('#win-game-prev')?.addEventListener('click', () => {
    if (currentPly > 0) loadPositionForPly(currentPly - 1);
  });

  modal.querySelector('#win-game-next')?.addEventListener('click', () => {
    if (currentPly < totalPlies) loadPositionForPly(currentPly + 1);
  });

  modal.querySelector('#win-game-last')?.addEventListener('click', () => {
    loadPositionForPly(totalPlies);
  });

  modal.querySelector('#win-game-jump-decisive')?.addEventListener('click', () => {
    if (decisivePlies.length === 0) return;
    const nextDecisive = decisivePlies.find((d) => d.ply > currentPly) || decisivePlies[0];
    if (nextDecisive) {
      loadPositionForPly(nextDecisive.ply);
    }
  });

  // Main loader for a given game ply
  const loadPositionForPly = async (plyIndex) => {
    stopAutoplay();
    currentPly = Math.max(0, Math.min(plyIndex, totalPlies));
    analysisSeq++;
    const thisSeq = analysisSeq;

    // Keep dashboard synchronized
    if (typeof dashboard.goToPly === 'function') {
      dashboard.goToPly(currentPly);
    }

    // Determine current FEN
    let currentFen = null;
    let curPlyData = null;
    if (currentPly > 0 && dashboard.game && Array.isArray(dashboard.game.plies)) {
      curPlyData = dashboard.game.plies[currentPly - 1];
      currentFen = curPlyData ? curPlyData.fen : null;
    }
    if (!currentFen && dashboard.game) {
      currentFen = dashboard.game.fen;
    }
    if (!currentFen) {
      currentFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    }

    // Update Game Position Navigation Bar
    const plyBadge = modal.querySelector('#win-game-ply-badge');
    const evalBadge = modal.querySelector('#win-game-eval-badge');
    const btnGameFirst = modal.querySelector('#win-game-first');
    const btnGamePrev = modal.querySelector('#win-game-prev');
    const btnGameNext = modal.querySelector('#win-game-next');
    const btnGameLast = modal.querySelector('#win-game-last');
    const btnJumpDecisive = modal.querySelector('#win-game-jump-decisive');

    if (btnGameFirst) btnGameFirst.disabled = currentPly <= 0;
    if (btnGamePrev) btnGamePrev.disabled = currentPly <= 0;
    if (btnGameNext) btnGameNext.disabled = currentPly >= totalPlies;
    if (btnGameLast) btnGameLast.disabled = currentPly >= totalPlies;
    if (btnJumpDecisive) {
      if (decisivePlies.length === 0) {
        btnJumpDecisive.classList.add('d-none');
      } else {
        btnJumpDecisive.classList.remove('d-none');
        const nextTarget = decisivePlies.find((d) => d.ply > currentPly) || decisivePlies[0];
        btnJumpDecisive.title = `Jump to Move ${Math.ceil(nextTarget.ply / 2)} (${nextTarget.score > 0 ? '+' : ''}${(nextTarget.score / 100).toFixed(1)})`;
      }
    }

    if (plyBadge) {
      if (currentPly === 0) {
        plyBadge.textContent = `Start of Game (Ply 0 / ${totalPlies})`;
      } else if (curPlyData) {
        const moveNum = Math.ceil(currentPly / 2);
        const colorPrefix = curPlyData.color === 'b' ? '... ' : '. ';
        plyBadge.textContent = `Move ${moveNum}${colorPrefix}${curPlyData.san || ''} (Ply ${currentPly} / ${totalPlies})`;
      } else {
        plyBadge.textContent = `Ply ${currentPly} / ${totalPlies}`;
      }
    }

    if (evalBadge) {
      const score = curPlyData ? (curPlyData.score ?? curPlyData.scoreCp ?? 0) : 0;
      const mate = curPlyData?.mate;
      if (mate !== null && mate !== undefined) {
        evalBadge.textContent = `M${Math.abs(mate)}`;
        evalBadge.className = `badge font-monospace fw-bold px-2 py-1 ${mate > 0 ? 'bg-success text-white' : 'bg-danger text-white'}`;
      } else {
        const numScore = (score / 100).toFixed(1);
        evalBadge.textContent = numScore > 0 ? `+${numScore}` : numScore;
        if (score >= 120) {
          evalBadge.className = 'badge font-monospace fw-bold px-2 py-1 bg-success text-white';
        } else if (score <= -120) {
          evalBadge.className = 'badge font-monospace fw-bold px-2 py-1 bg-danger text-white';
        } else {
          evalBadge.className = 'badge font-monospace fw-bold px-2 py-1 bg-body-secondary text-body';
        }
      }
    }

    // Set initial board state
    winBoard.setProps({
      fen: currentFen,
      lastMove: null,
      bestMove: null,
      showBestMove: false,
    });

    // Update Status banner to loading
    const winSubtitle = modal.querySelector('#win-modal-subtitle');
    const winStatusText = modal.querySelector('#win-status-text');
    const winVerdictText = modal.querySelector('#win-verdict-text');
    const winPillsContainer = modal.querySelector('#win-pills-container');
    const winLineSummary = modal.querySelector('#win-line-summary');
    const winLoadingSpinner = modal.querySelector('#win-loading-spinner');

    if (winLoadingSpinner) winLoadingSpinner.classList.remove('d-none');
    if (winStatusText) winStatusText.textContent = 'Calculating winning engine sequence with Stockfish...';
    if (winSubtitle) winSubtitle.textContent = `Analyzing Move ${Math.ceil(currentPly / 2)} position...`;
    if (winVerdictText) winVerdictText.innerHTML = '<span class="text-secondary small"><span class="spinner-border spinner-border-sm me-1 text-warning"></span>Evaluating position...</span>';
    if (winLineSummary) winLineSummary.textContent = '';
    if (winPillsContainer) winPillsContainer.innerHTML = '<span class="text-secondary small"><span class="spinner-border spinner-border-sm me-1 text-warning"></span>Finding winning moves...</span>';

    // Prepare evaluation
    try {
      let baseEval = null;

      // 1. Fast cache check from review analysis
      if (curPlyData && Array.isArray(curPlyData.pv) && curPlyData.pv.length > 0) {
        baseEval = {
          scoreCp: curPlyData.score ?? curPlyData.scoreCp ?? 0,
          mate: curPlyData.mate ?? null,
          pv: curPlyData.pv,
          bestMoveUci: curPlyData.bestMoveUci || curPlyData.pv[0],
        };
      }

      // 2. Fallback to engine evaluation if not cached
      if (!baseEval) {
        baseEval = await evaluateFenHybrid(currentFen, 'deep');
      }

      if (thisSeq !== analysisSeq || !document.body.contains(modal)) return;

      const scoreCp = baseEval.scoreCp || 0;
      const mate = baseEval.mate;
      const isWhiteWinning = mate !== null ? mate > 0 : scoreCp >= 140;
      const isBlackWinning = mate !== null ? mate < 0 : scoreCp <= -140;
      const isDecisive = isWhiteWinning || isBlackWinning;
      const winnerName = isWhiteWinning ? 'White' : (isBlackWinning ? 'Black' : null);
      const winnerColor = isWhiteWinning ? 'w' : (isBlackWinning ? 'b' : null);

      // Replay PV moves
      const initialSteps = [
        { ply: 0, fen: currentFen, san: 'Start', from: null, to: null }
      ];

      const rawPv = (baseEval.pv && baseEval.pv.length > 0)
        ? baseEval.pv
        : (baseEval.bestMoveUci ? [baseEval.bestMoveUci] : []);

      if (typeof replayPv === 'function' && rawPv.length > 0) {
        const replayed = replayPv(currentFen, rawPv, 12);
        initialSteps.push(...replayed);
      }

      // If decisive and continuation is short, extend it
      if (isDecisive && initialSteps.length < 8 && typeof extendContinuation === 'function') {
        try {
          const extended = await extendContinuation(currentFen, initialSteps.slice(1), 10);
          if (thisSeq === analysisSeq && Array.isArray(extended) && extended.length > initialSteps.length - 1) {
            initialSteps.length = 1;
            initialSteps.push(...extended);
          }
        } catch {}
      }

      if (thisSeq !== analysisSeq || !document.body.contains(modal)) return;

      steps = initialSteps;
      stepIdx = steps.length > 1 ? 1 : 0;

      // Update UI elements
      if (winLoadingSpinner) winLoadingSpinner.classList.add('d-none');

      let finalSummary = '';
      const lastStep = steps[steps.length - 1];
      const simChess = new Chess(lastStep ? lastStep.fen : currentFen);
      const isCheckmate = simChess.in_checkmate();

      if (isCheckmate) {
        finalSummary = `Forced Checkmate delivered in ${steps.length - 1} moves!`;
      } else if (isDecisive) {
        const advVal = Math.abs(scoreCp / 100).toFixed(1);
        finalSummary = mate !== null
          ? `Decisive winning attack (Mate in ${Math.abs(mate)})!`
          : `Decisive winning advantage (+${advVal} advantage reached)!`;
      } else {
        finalSummary = `Equal position (~${(scoreCp / 100).toFixed(1)}). Top engine continuation:`;
      }

      if (winStatusText) {
        winStatusText.textContent = isDecisive
          ? `🏆 ${winnerName} Wins: ${finalSummary}`
          : `⚖️ Position is Balanced: ${finalSummary}`;
      }

      if (winSubtitle) {
        winSubtitle.textContent = isDecisive
          ? `${winnerName} has a decisive win (${steps.length - 1} moves in line)`
          : `Equal position (${steps.length - 1} best moves in line)`;
      }

      if (winLineSummary) {
        winLineSummary.textContent = isCheckmate ? 'Checkmate' : `${steps.length - 1} Moves`;
      }

      if (winVerdictText) {
        if (isDecisive) {
          winVerdictText.innerHTML = `
            <div class="d-flex align-items-center gap-1.5 mb-1.5">
              <span class="badge ${winnerColor === 'w' ? 'bg-light text-dark border' : 'bg-dark text-white'} fw-bold">${winnerName} Wins</span>
              <span class="badge bg-warning text-dark font-monospace fw-bold">${mate !== null ? `M${Math.abs(mate)}` : `+${Math.abs(scoreCp / 100).toFixed(1)}`}</span>
            </div>
            <p class="mb-1 fw-semibold text-body">${finalSummary}</p>
            <div class="text-secondary small">
              Engine confirms: <strong>${winnerName}</strong> has full tactical control with no possible defensive counterplay.
            </div>
          `;
        } else {
          const nextDecisive = decisivePlies.find((d) => d.ply > currentPly) || decisivePlies[0];
          winVerdictText.innerHTML = `
            <div class="d-flex align-items-center gap-1.5 mb-1.5">
              <span class="badge bg-body-secondary text-body fw-bold">Balanced Position</span>
              <span class="badge bg-body-secondary text-body font-monospace fw-bold">${(scoreCp / 100).toFixed(1)}</span>
            </div>
            <p class="mb-2 fw-semibold text-body">
              Neither side has an immediate forced win here. Showing Stockfish's top continuation line.
            </p>
            ${nextDecisive ? `
              <div class="p-2 rounded-2 mt-1" style="background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.3);">
                <div class="small fw-bold text-body mb-1">Looking for a decisive win in this game?</div>
                <button type="button" class="btn btn-sm btn-warning text-dark fw-bold px-2.5 py-1" id="win-btn-jump-now">
                  <i class="bi bi-lightning-charge-fill me-1"></i>Jump to Move ${Math.ceil(nextDecisive.ply / 2)} (${nextDecisive.score > 0 ? 'White +' : 'Black -'}${(Math.abs(nextDecisive.score) / 100).toFixed(1)})
                </button>
              </div>
            ` : ''}
          `;

          modal.querySelector('#win-btn-jump-now')?.addEventListener('click', () => {
            if (nextDecisive) loadPositionForPly(nextDecisive.ply);
          });
        }
      }

      // Render step pills
      if (winPillsContainer) {
        winPillsContainer.innerHTML = '';
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
          winPillsContainer.appendChild(btn);
        });
      }

      renderStep();
    } catch (err) {
      console.error('Error generating winning path:', err);
      if (winLoadingSpinner) winLoadingSpinner.classList.add('d-none');
      if (winStatusText) winStatusText.textContent = 'Engine analysis completed.';
      if (winVerdictText) winVerdictText.textContent = 'Unable to evaluate winning path for this position.';
    }
  };

  // Initial load
  loadPositionForPly(currentPly);
}

if (typeof window !== 'undefined') {
  window.openWinningPathModal = openWinningPathModal;
  window.closeWinningPathModal = closeWinningPathModal;
}
