/**
 * Interactive Review Training & Board Modes
 * What-If Sandbox Mode and Vision Overlays.
 */

async function handleReviewBoardMove(dashboard, from, to) {
  if (!dashboard || !dashboard.game) return;

  // Interactive What-If Sandbox Mode
  try {
    if (!dashboard.sandboxState || !Array.isArray(dashboard.sandboxState.history)) {
      const baseFen = dashboard.getActiveBoardFen();
      const curEval = dashboard.getCurrentEval();
      const baseEval = curEval
        ? { scoreCp: curEval.scoreCp, mate: curEval.mate, bestMoveUci: curEval.bestMoveUci, bestMoveSan: curEval.bestMoveSan }
        : (typeof localEvaluation === 'function' ? localEvaluation(baseFen, 2) : null);
      const baseStep = {
        fen: baseFen,
        lastMove: curEval ? { from: curEval.from, to: curEval.to } : null,
        san: null,
        evalResult: baseEval,
        isEvaluating: false
      };
      dashboard.sandboxState = {
        basePly: dashboard.currentPly,
        sandboxIndex: 0,
        history: [baseStep]
      };
    }

    const currentStep = dashboard.sandboxState.history[dashboard.sandboxState.sandboxIndex] || dashboard.sandboxState.history[0];
    const c = new Chess(currentStep.fen);
    const move = c.move({ from, to, promotion: 'q' });
    if (!move) return;

    if (move.captured) soundService.playCapture();
    else soundService.playMove();

    const newFen = c.fen();
    const instantEval = typeof localEvaluation === 'function' ? localEvaluation(newFen, 2) : null;
    const newStep = {
      fen: newFen,
      lastMove: { from: move.from, to: move.to },
      san: move.san,
      evalResult: instantEval,
      isEvaluating: true
    };

    dashboard.sandboxState.history = dashboard.sandboxState.history.slice(0, dashboard.sandboxState.sandboxIndex + 1);
    dashboard.sandboxState.history.push(newStep);
    dashboard.sandboxState.sandboxIndex = dashboard.sandboxState.history.length - 1;
    if (typeof dashboard.syncSandboxState === 'function') {
      dashboard.syncSandboxState();
    }
    dashboard.updateBoardAndControls();

    if (typeof evaluateFenHybrid === 'function') {
      try {
        const evalRes = await evaluateFenHybrid(newFen, false);
        if (dashboard.sandboxState) {
          if (evalRes && evalRes.bestMoveUci && !evalRes.bestMoveSan) {
            try {
              const c2 = new Chess(newFen);
              const m = c2.move({
                from: evalRes.bestMoveUci.slice(0, 2),
                to: evalRes.bestMoveUci.slice(2, 4),
                promotion: evalRes.bestMoveUci[4] || 'q'
              });
              if (m) evalRes.bestMoveSan = m.san;
            } catch {}
          }
          newStep.evalResult = evalRes || newStep.evalResult;
          newStep.isEvaluating = false;
          if (dashboard.sandboxState.history[dashboard.sandboxState.sandboxIndex] === newStep) {
            if (typeof dashboard.syncSandboxState === 'function') {
              dashboard.syncSandboxState();
            }
            dashboard.updateBoardAndControls();
          }
        }
      } catch {
        newStep.isEvaluating = false;
      }
    } else {
      newStep.isEvaluating = false;
    }
  } catch {}
}

function exitSpecialMode(dashboard) {
  if (!dashboard) return;
  dashboard.sandboxState = null;
  if (dashboard.board) dashboard.board.userHighlights.clear();
  dashboard.updateBoardAndControls();
}

function toggleVisionOverlay(dashboard, mode) {
  if (!dashboard) return;
  if (mode === 'loose') {
    dashboard.showLoosePieces = !dashboard.showLoosePieces;
  } else {
    dashboard.visionOverlay = dashboard.visionOverlay === mode ? 'none' : mode;
  }
  dashboard.updateBoardAndControls();
}

function playFromCurrentPosition(dashboard, overridePly = null) {
  if (!dashboard || !dashboard.game) return;
  const targetPly = typeof overridePly === 'number' ? overridePly : (dashboard.currentPly || 0);
  const fen = typeof overridePly === 'number'
    ? (targetPly === 0
        ? (dashboard.game.initialFen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
        : (dashboard.game.plies[targetPly - 1]?.fen || dashboard.getActiveBoardFen()))
    : dashboard.getActiveBoardFen();
  const userColor = dashboard.game.userColor || 'w';
  const targetElo = dashboard.game.userGameElo || (userColor === 'w' ? dashboard.game.whiteElo : dashboard.game.blackElo) || 1200;
  if (typeof dashboard.onPlayFromFen === 'function') {
    dashboard.onPlayFromFen(fen, userColor, targetElo);
  } else if (typeof dashboard.onSwitchToBots === 'function') {
    dashboard.onSwitchToBots(fen, userColor, targetElo);
  }
}

function updateModeBanner(dashboard, cur) {
  if (!dashboard || !dashboard.container) return;
  const bannerEl = dashboard.container.querySelector('#sandbox-banner') || dashboard.container.querySelector('#pv-banner-area');
  if (!bannerEl) return;

  if (dashboard.sandboxState) {
    const sb = dashboard.sandboxState;
    const sbIdx = sb.sandboxIndex || 0;
    const sbTotal = Math.max(0, (sb.history?.length || 1) - 1);
    const movesArr = sb.history?.slice(1) || [];
    const movesHtml = movesArr.map((h, i) => {
      const stepNum = i + 1;
      const isCurrent = stepNum === sbIdx;
      return `<button type="button" class="btn btn-xs ${isCurrent ? 'btn-info fw-black text-dark border border-dark' : 'btn-dark text-light border border-secondary opacity-75'} font-monospace px-1.5 py-0.5" data-sb-step="${stepNum}">${insEscape(h.san)}</button>`;
    }).join('<span class="text-secondary mx-0.5">→</span>');

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
            <span class="badge bg-secondary font-monospace fw-bold">Step ${sbIdx} of ${sbTotal}</span>
            <button type="button" class="btn btn-xs ${sbIdx === 0 ? 'btn-info fw-black text-dark border border-dark' : 'btn-outline-secondary text-secondary'} font-monospace px-1.5 py-0.5" id="btn-sb-step-0" title="Starting Position of Sandbox">Start</button>
            ${movesHtml ? `<span class="text-secondary mx-0.5">→</span><div class="d-inline-flex align-items-center flex-wrap gap-1">${movesHtml}</div>` : ''}
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
    bannerEl.querySelector('#btn-sb-step-0')?.addEventListener('click', () => {
      if (typeof dashboard.goToSandboxStep === 'function') dashboard.goToSandboxStep(0);
    });
    bannerEl.querySelectorAll('[data-sb-step]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const stepNum = parseInt(btn.getAttribute('data-sb-step'), 10);
        if (!isNaN(stepNum) && typeof dashboard.goToSandboxStep === 'function') {
          dashboard.goToSandboxStep(stepNum);
        }
      });
    });
    return;
  }

  bannerEl.classList.add('d-none');
  bannerEl.innerHTML = '';
}
