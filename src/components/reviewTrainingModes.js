/**
 * Interactive Review Training & Board Modes
 * Retry Mistakes Puzzle Mode, Guess-the-Move Active Mode, What-If Sandbox Mode, and Vision Overlays.
 */

async function handleReviewBoardMove(dashboard, from, to) {
  if (!dashboard || !dashboard.game) return;
  // 1. Retry Mistakes Puzzle Mode
  if (dashboard.retryPuzzleState?.active && !dashboard.retryPuzzleState.solved) {
    const cur = dashboard.getCurrentEval();
    if (!cur) return;
    try {
      const c = new Chess(cur.fenBefore);
      const move = c.move({ from, to, promotion: 'q' });
      if (!move) return;

      const playedUci = `${move.from}${move.to}`;
      const bestPrefix = (cur.bestMoveUci || '').slice(0, 4).toLowerCase();
      const isCorrect = playedUci.toLowerCase() === bestPrefix || move.san === cur.bestMoveSan;

      if (isCorrect) {
        dashboard.retryPuzzleState.solved = true;
        dashboard.retryPuzzleState.boardFen = c.fen();
        dashboard.retryPuzzleState.lastMove = { from: move.from, to: move.to };
        dashboard.retryPuzzleState.message = `✅ Found it! ${move.san} is the top engine move.`;
        dashboard.retryPuzzleState.isError = false;
        if (dashboard.board) dashboard.board.userHighlights.clear();
        soundService.playBrilliant();
      } else {
        dashboard.retryPuzzleState.message = `❌ ${move.san} is not the best move here — try again or use Hint!`;
        dashboard.retryPuzzleState.isError = true;
        soundService.playBlunder();
      }
      dashboard.updateBoardAndControls();
    } catch {}
    return;
  }

  // 2. Guess the Move Active Mode
  if (dashboard.guessMoveState?.active && !dashboard.guessMoveState.answered) {
    const cur = dashboard.getCurrentEval();
    if (!cur) return;
    try {
      const c = new Chess(cur.fenBefore);
      const move = c.move({ from, to, promotion: 'q' });
      if (!move) return;

      const playedUci = `${move.from}${move.to}`.toLowerCase();
      const bestPrefix = (cur.bestMoveUci || '').slice(0, 4).toLowerCase();
      const secondPrefix = (cur.secondBestMoveUci || '').slice(0, 4).toLowerCase();
      const actualGameSan = cur.san;

      dashboard.guessMoveState.answered = true;
      dashboard.guessMoveState.boardFen = c.fen();
      dashboard.guessMoveState.lastMove = { from: move.from, to: move.to };
      dashboard.guessMoveState.maxScore += 3;

      if (playedUci === bestPrefix || move.san === cur.bestMoveSan) {
        dashboard.guessMoveState.score += 3;
        dashboard.guessMoveState.grade = '⭐⭐⭐ Engine #1!';
        dashboard.guessMoveState.isError = false;
        dashboard.guessMoveState.message = `Spot on! ${move.san} is Stockfish's #1 choice (in the game you played ${actualGameSan}).`;
        soundService.playBrilliant();
      } else if (playedUci === secondPrefix || move.san === cur.secondBestMoveSan || (move.san === actualGameSan && ['best', 'excellent', 'great', 'good'].includes(cur.classification))) {
        dashboard.guessMoveState.score += 2;
        dashboard.guessMoveState.grade = '⭐⭐ Solid Move';
        dashboard.guessMoveState.isError = false;
        dashboard.guessMoveState.message = `Good choice! ${move.san} is a strong continuation (Engine #1: ${cur.bestMoveSan}, game move: ${actualGameSan}).`;
        soundService.playMove();
      } else {
        dashboard.guessMoveState.grade = '⚠️ Inaccurate';
        dashboard.guessMoveState.isError = true;
        dashboard.guessMoveState.message = `You guessed ${move.san}. Engine preferred ${cur.bestMoveSan} (in the game you played ${actualGameSan}).`;
        soundService.playBlunder();
      }
      dashboard.updateBoardAndControls();
    } catch {}
    return;
  }

  // 3. Interactive What-If Sandbox Mode
  try {
    const baseFen = dashboard.getActiveBoardFen();
    const c = new Chess(baseFen);
    const move = c.move({ from, to, promotion: 'q' });
    if (!move) return;

    if (move.captured) soundService.playCapture();
    else soundService.playMove();

    const newFen = c.fen();
    const prevMoves = dashboard.sandboxState?.moveHistorySan || [];
    dashboard.sandboxState = {
      fen: newFen,
      lastMove: { from: move.from, to: move.to },
      moveHistorySan: [...prevMoves, move.san],
      evalResult: null,
      isEvaluating: true
    };
    dashboard.updateBoardAndControls();

    const evalRes = await evaluateFenHybrid(newFen, false);
    if (dashboard.sandboxState && dashboard.sandboxState.fen === newFen) {
      dashboard.sandboxState.evalResult = evalRes;
      dashboard.sandboxState.isEvaluating = false;
      dashboard.updateBoardAndControls();
    }
  } catch {}
}

function startRetryMistakes(dashboard) {
  if (!dashboard) return;
  const mistakes = dashboard.getUserMistakePlies();
  if (mistakes.length === 0) return;
  dashboard.sandboxState = null;
  dashboard.guessMoveState = null;
  if (dashboard.board) dashboard.board.userHighlights.clear();
  const first = mistakes[0];
  dashboard.currentPly = first.ply;
  dashboard.retryPuzzleState = {
    active: true,
    mistakes,
    currentIndex: 0,
    solved: false,
    hintShown: false,
    boardFen: first.fenBefore,
    lastMove: null,
    message: `You played ${first.san} (${first.classification.replace('_', ' ')}). Drag the best move on the board!`,
    isError: false
  };
  dashboard.updateBoardAndControls();
}

function loadMistakeAtIndex(dashboard, idx) {
  if (!dashboard || !dashboard.retryPuzzleState?.active) return;
  const mistakes = dashboard.retryPuzzleState.mistakes;
  if (idx < 0 || idx >= mistakes.length) return;
  if (dashboard.board) dashboard.board.userHighlights.clear();
  const target = mistakes[idx];
  dashboard.currentPly = target.ply;
  dashboard.retryPuzzleState.currentIndex = idx;
  dashboard.retryPuzzleState.solved = false;
  dashboard.retryPuzzleState.hintShown = false;
  dashboard.retryPuzzleState.boardFen = target.fenBefore;
  dashboard.retryPuzzleState.lastMove = null;
  dashboard.retryPuzzleState.message = `You played ${target.san} (${target.classification.replace('_', ' ')}). Drag the best move on the board!`;
  dashboard.retryPuzzleState.isError = false;
  dashboard.updateBoardAndControls();
}

function showPuzzleHint(dashboard) {
  if (!dashboard || !dashboard.retryPuzzleState?.active) return;
  const cur = dashboard.getCurrentEval();
  if (!cur || !cur.bestMoveUci || cur.bestMoveUci.length < 4) return;
  const fromSq = cur.bestMoveUci.slice(0, 2);
  dashboard.retryPuzzleState.hintShown = true;
  dashboard.retryPuzzleState.message = `💡 Hint: Move the piece on ${fromSq.toUpperCase()}!`;
  dashboard.retryPuzzleState.isError = false;
  if (dashboard.board) {
    dashboard.board.userHighlights.clear();
    dashboard.board.userHighlights.add(fromSq);
  }
  dashboard.updateBoardAndControls();
}

function revealPuzzleSolution(dashboard) {
  if (!dashboard || !dashboard.retryPuzzleState?.active) return;
  const cur = dashboard.getCurrentEval();
  if (!cur) return;
  dashboard.retryPuzzleState.solved = true;
  dashboard.retryPuzzleState.boardFen = cur.fen;
  dashboard.retryPuzzleState.lastMove = { from: cur.from, to: cur.to };
  dashboard.retryPuzzleState.message = `👁 Solution: ${cur.bestMoveSan} was the best move (you played ${cur.san}).`;
  dashboard.retryPuzzleState.isError = false;
  if (dashboard.board) dashboard.board.userHighlights.clear();
  dashboard.updateBoardAndControls();
}

function startGuessTheMove(dashboard) {
  if (!dashboard || !dashboard.game || !Array.isArray(dashboard.game.plies)) return;
  const userColor = dashboard.game.userColor || 'w';
  const userTurns = dashboard.game.plies.filter((p) => p && p.color === userColor && p.ply > 6 && p.classification !== 'book');
  if (userTurns.length === 0) return;

  dashboard.sandboxState = null;
  dashboard.retryPuzzleState = null;
  if (dashboard.board) dashboard.board.userHighlights.clear();

  const firstTurn = userTurns[0];
  dashboard.currentPly = firstTurn.ply;
  dashboard.guessMoveState = {
    active: true,
    turns: userTurns,
    currentIndex: 0,
    answered: false,
    score: 0,
    maxScore: 0,
    grade: '',
    boardFen: firstTurn.fenBefore,
    lastMove: null,
    message: `Guess ${userColor === 'w' ? 'White' : 'Black'}'s next move! Drag your best piece on the board.`,
    isError: false
  };
  dashboard.updateBoardAndControls();
}

function loadGuessTurnAtIndex(dashboard, idx) {
  if (!dashboard || !dashboard.guessMoveState?.active) return;
  const turns = dashboard.guessMoveState.turns;
  if (idx < 0 || idx >= turns.length) return;
  if (dashboard.board) dashboard.board.userHighlights.clear();
  const target = turns[idx];
  dashboard.currentPly = target.ply;
  dashboard.guessMoveState.currentIndex = idx;
  dashboard.guessMoveState.answered = false;
  dashboard.guessMoveState.grade = '';
  dashboard.guessMoveState.boardFen = target.fenBefore;
  dashboard.guessMoveState.lastMove = null;
  dashboard.guessMoveState.message = `Turn ${idx + 1} of ${turns.length}: What is the best move here?`;
  dashboard.guessMoveState.isError = false;
  dashboard.updateBoardAndControls();
}

function exitSpecialMode(dashboard) {
  if (!dashboard) return;
  dashboard.retryPuzzleState = null;
  dashboard.guessMoveState = null;
  dashboard.sandboxState = null;
  if (dashboard.board) dashboard.board.userHighlights.clear();
  dashboard.updateBoardAndControls();
}

function toggleVisionOverlay(dashboard, mode) {
  if (!dashboard) return;
  dashboard.visionMode = dashboard.visionMode === mode ? 'none' : mode;
  dashboard.updateBoardAndControls();
}

function playFromCurrentPosition(dashboard, overridePly = null) {
  if (!dashboard || !dashboard.game) return;
  const targetPly = typeof overridePly === 'number' ? overridePly : (dashboard.currentPly || 0);
  const fen = targetPly === 0 ? (dashboard.game.initialFen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1') : (dashboard.game.plies[targetPly - 1]?.fen || dashboard.getActiveBoardFen());
  if (typeof dashboard.onSwitchToBots === 'function') {
    dashboard.onSwitchToBots(fen, dashboard.game.userColor || 'w');
  }
}

function updateModeBanner(dashboard, cur) {
  if (!dashboard || !dashboard.container) return;
  const bannerEl = dashboard.container.querySelector('#sandbox-banner');
  if (!bannerEl) return;

  if (dashboard.retryPuzzleState?.active) {
    const st = dashboard.retryPuzzleState;
    const target = st.mistakes[st.currentIndex];
    const total = st.mistakes.length;
    const idx = st.currentIndex;

    let statusAlert = '';
    if (st.solved) {
      statusAlert = `
        <div class="alert alert-success py-1.5 px-2.5 mb-0 mt-2 d-flex align-items-center justify-content-between small fw-bold">
          <span>${insEscape(st.message || 'Correct move!')}</span>
          <div class="d-flex align-items-center gap-1.5">
            ${idx + 1 < total ? `
              <button type="button" class="btn btn-xs btn-success comic-btn fw-black py-0.5 px-2" id="btn-puzzle-next">
                Next Mistake <i class="bi bi-arrow-right ms-1"></i>
              </button>
            ` : `
              <button type="button" class="btn btn-xs btn-dark comic-btn fw-black py-0.5 px-2" id="btn-puzzle-finish">
                Done <i class="bi bi-trophy-fill ms-1 text-warning"></i>
              </button>
            `}
          </div>
        </div>
      `;
    } else if (st.isError) {
      statusAlert = `
        <div class="alert alert-danger py-1.5 px-2.5 mb-0 mt-2 d-flex align-items-center justify-content-between small fw-bold">
          <span>${insEscape(st.message || 'Try another move!')}</span>
        </div>
      `;
    } else if (st.message) {
      statusAlert = `<div class="small fw-semibold text-secondary mt-1">${insEscape(st.message)}</div>`;
    }

    bannerEl.classList.remove('d-none');
    bannerEl.innerHTML = `
      <div class="comic-card-sm p-2.5 mb-2 border-2 border-warning" style="background: rgba(245, 158, 11, 0.1);">
        <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div class="d-flex align-items-center gap-2">
            <span class="badge bg-warning text-dark border border-dark fw-black">🎯 RETRY MISTAKE ${idx + 1} / ${total}</span>
            ${typeof renderInfoIcon === 'function' ? renderInfoIcon('ctrl_retry_mistakes') : ''}
            <span class="small fw-bold">Move ${Math.ceil((target?.ply || 1) / 2)}: You played <span class="text-danger font-monospace fw-black">${insEscape(target?.san || '?')}</span></span>
          </div>
          <div class="d-flex align-items-center gap-1.5">
            <button type="button" class="btn btn-sm btn-outline-warning comic-btn py-0.5 px-2 fw-bold" id="btn-puzzle-hint" style="font-size: 11px;">
              <i class="bi bi-lightbulb-fill me-1"></i>Hint
            </button>
            <button type="button" class="btn btn-sm btn-outline-secondary comic-btn py-0.5 px-2 fw-bold" id="btn-puzzle-solution" style="font-size: 11px;">
              <i class="bi bi-eye-fill me-1"></i>Solution
            </button>
            <button type="button" class="btn btn-sm btn-dark comic-btn py-0.5 px-2 fw-bold" id="btn-puzzle-exit" title="Exit Workout" aria-label="Exit Workout" style="font-size: 11px;">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
        </div>
        ${statusAlert}
      </div>
    `;

    bannerEl.querySelector('#btn-puzzle-hint')?.addEventListener('click', () => (typeof dashboard.showPuzzleHint === 'function' ? dashboard.showPuzzleHint() : showPuzzleHint(dashboard)));
    bannerEl.querySelector('#btn-puzzle-solution')?.addEventListener('click', () => (typeof dashboard.revealPuzzleSolution === 'function' ? dashboard.revealPuzzleSolution() : revealPuzzleSolution(dashboard)));
    bannerEl.querySelector('#btn-puzzle-exit')?.addEventListener('click', () => (typeof dashboard.exitSpecialMode === 'function' ? dashboard.exitSpecialMode() : exitSpecialMode(dashboard)));
    bannerEl.querySelector('#btn-puzzle-next')?.addEventListener('click', () => (typeof dashboard.loadMistakeAtIndex === 'function' ? dashboard.loadMistakeAtIndex : (i) => loadMistakeAtIndex(dashboard, i))(idx + 1));
    bannerEl.querySelector('#btn-puzzle-finish')?.addEventListener('click', () => (typeof dashboard.exitSpecialMode === 'function' ? dashboard.exitSpecialMode() : exitSpecialMode(dashboard)));
    return;
  }

  if (dashboard.guessMoveState?.active) {
    const gm = dashboard.guessMoveState;
    const total = gm.turns.length;
    const idx = gm.currentIndex;

    bannerEl.classList.remove('d-none');
    bannerEl.innerHTML = `
      <div class="comic-card-sm p-2.5 mb-2 border-2 border-primary" style="background: rgba(59, 130, 246, 0.1);">
        <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div class="d-flex align-items-center gap-2">
            <span class="badge bg-primary text-white border border-dark fw-black">🤔 GUESS THE MOVE ${idx + 1} / ${total}</span>
            <span class="badge bg-warning text-dark font-monospace fw-bold">Score: ${gm.score} / ${gm.maxScore}</span>
            ${gm.grade ? `<span class="badge ${gm.isError ? 'bg-danger' : 'bg-success'} fw-black">${gm.grade}</span>` : ''}
          </div>
          <div class="d-flex align-items-center gap-1.5">
            ${gm.answered && idx + 1 < total ? `
              <button type="button" class="btn btn-sm btn-primary comic-btn py-0.5 px-2.5 fw-black" id="btn-guess-next" style="font-size: 11px;">
                Next Turn <i class="bi bi-arrow-right ms-1"></i>
              </button>
            ` : ''}
            <button type="button" class="btn btn-sm btn-dark comic-btn py-0.5 px-2 fw-bold" id="btn-guess-exit" style="font-size: 11px;">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
        </div>
        <div class="small fw-bold mt-1.5 ${gm.isError ? 'text-danger' : (gm.answered ? 'text-success' : 'text-body')}">
          ${insEscape(gm.message)}
        </div>
      </div>
    `;
    bannerEl.querySelector('#btn-guess-next')?.addEventListener('click', () => (typeof dashboard.loadGuessTurnAtIndex === 'function' ? dashboard.loadGuessTurnAtIndex : (i) => loadGuessTurnAtIndex(dashboard, i))(idx + 1));
    bannerEl.querySelector('#btn-guess-exit')?.addEventListener('click', () => (typeof dashboard.exitSpecialMode === 'function' ? dashboard.exitSpecialMode() : exitSpecialMode(dashboard)));
    return;
  }

  if (dashboard.sandboxState) {
    const sb = dashboard.sandboxState;
    const movesArr = sb.moveHistorySan || sb.moves || [];
    const movesStr = movesArr.join(' → ');
    let evalBadge = '';
    if (sb.isEvaluating || sb.evaluating) {
      evalBadge = `<span class="badge bg-secondary font-monospace"><span class="spinner-border spinner-border-sm me-1" style="width: 10px; height: 10px;"></span>Stockfish thinking...</span>`;
    } else if (sb.evalResult) {
      const cp = (sb.evalResult.scoreCp || 0) / 100;
      const cpStr = sb.evalResult.mate !== null && sb.evalResult.mate !== undefined
        ? `M${Math.abs(sb.evalResult.mate)}`
        : (cp > 0 ? `+${cp.toFixed(1)}` : cp.toFixed(1));
      const bestSan = sb.evalResult.bestMoveSan ? ` · Best next: ${sb.evalResult.bestMoveSan}` : '';
      evalBadge = `<span class="badge bg-info text-dark border border-dark font-monospace fw-bold">Eval: ${cpStr}${insEscape(bestSan)}</span>`;
    }

    bannerEl.classList.remove('d-none');
    bannerEl.innerHTML = `
      <div class="comic-card-sm p-2.5 mb-2 border-2 border-info" style="background: rgba(6, 182, 212, 0.1);">
        <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div class="d-flex align-items-center gap-2 flex-wrap">
            <span class="badge bg-info text-dark border border-dark fw-black"><i class="bi bi-compass-fill me-1"></i>WHAT-IF SANDBOX</span>
            <span class="small font-monospace fw-bold">${insEscape(movesStr)}</span>
            ${evalBadge}
          </div>
          <div class="d-flex align-items-center gap-1.5">
            <button type="button" class="btn btn-sm btn-warning comic-btn py-0.5 px-2.5 fw-black" id="btn-sandbox-reset" style="font-size: 11px;">
              <i class="bi bi-arrow-counterclockwise me-1"></i>Return to Game
            </button>
          </div>
        </div>
      </div>
    `;
    bannerEl.querySelector('#btn-sandbox-reset')?.addEventListener('click', () => (typeof dashboard.exitSpecialMode === 'function' ? dashboard.exitSpecialMode() : exitSpecialMode(dashboard)));
    return;
  }

  bannerEl.classList.add('d-none');
  bannerEl.innerHTML = '';
}
