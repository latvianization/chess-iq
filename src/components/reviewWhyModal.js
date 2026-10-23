function closeWhyModal(dashboard) {
  if (dashboard.whyTimer) {
    clearInterval(dashboard.whyTimer);
    dashboard.whyTimer = null;
  }
  if (dashboard.whyKeyHandler) {
    window.removeEventListener('keydown', dashboard.whyKeyHandler);
    dashboard.whyKeyHandler = null;
  }
  const existing = document.getElementById('why-blunder-modal');
  if (existing) existing.remove();
  dashboard.whyBoard = null;
}

async function openWhyModal(dashboard, targetEval = null) {
  const cur = targetEval || dashboard.getCurrentEval();
  if (!cur) return;

  closeWhyModal(dashboard);

  const comic = getComicBadge(cur.classification, cur.san);
  const classificationName = cur.classification.replace('_', ' ');

  const winProbBeforePct = Math.round((cur.moverWinProbBefore ?? cur.winProbBefore ?? 0.5) * 100);
  const winProbAfterPct = Math.round((cur.moverWinProbAfter ?? cur.winProb ?? 0.5) * 100);
  const winLossPct = Math.max(0, winProbBeforePct - winProbAfterPct);

  const evalBefore = cur.scoreBefore !== undefined ? (cur.scoreBefore / 100).toFixed(1) : null;
  const evalAfter = cur.scoreAfter !== undefined ? (cur.scoreAfter / 100).toFixed(1) : null;

  const modal = document.createElement('div');
  modal.className = 'why-modal-backdrop';
  modal.id = 'why-blunder-modal';
  modal.innerHTML = `
    <div class="why-dialog p-3 p-md-4 shadow-lg" style="max-width: 820px; width: 100%; max-height: 94vh; overflow-y: auto; border-radius: 1.25rem; background: var(--arcade-card); border: 1px solid var(--arcade-border);">
      <div class="d-flex align-items-center justify-content-between pb-2.5 mb-3 border-bottom" style="border-color: var(--arcade-border) !important;">
        <div class="d-flex align-items-center gap-2.5">
          <span class="badge rounded-pill px-3 py-1.5" style="background-color: ${comic.bg}; color: ${comic.text}; font-weight: 800; font-size: 12px;">
            ${comic.symbol} ${comic.term}
          </span>
          <div>
            <h5 class="mb-0 fw-black fs-6">Why was ${cur.san} a ${classificationName}?</h5>
            <div class="text-secondary small font-monospace" style="font-size: 11px;">Move ${Math.ceil((cur.ply || 1) / 2)}${cur.color === 'b' ? '... ' : '. '}${cur.san}</div>
          </div>
        </div>
        <button type="button" class="btn-close" id="why-btn-close" aria-label="Close"></button>
      </div>

      <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
        <div class="arcade-mode-pills" role="group">
          <button type="button" class="arcade-pill active" id="why-tab-punishment" disabled>
            <i class="bi bi-lightning-charge-fill me-1 text-danger"></i>Opponent's Punishment
          </button>
          <button type="button" class="arcade-pill" id="why-tab-best" disabled>
            <i class="bi bi-star-fill me-1 text-success"></i>Best Alternative (${cur.bestMoveSan || 'Top Move'})
          </button>
        </div>
        <span class="badge bg-body-secondary text-secondary font-monospace fw-bold px-2.5 py-1.5" id="why-step-counter">Move 0 / 0</span>
      </div>

      <div class="row g-3 align-items-stretch">
        <div class="col-12 col-md-7 d-flex justify-content-center">
          <div id="why-modal-board" style="width: 100%; max-width: 380px; aspect-ratio: 1/1;"></div>
        </div>
        <div class="col-12 col-md-5 d-flex flex-column justify-content-between">
          <div>
            <div class="card border-0 mb-2 p-2.5" style="background: var(--arcade-card-hover, rgba(0,0,0,0.03)); border: 1px solid var(--arcade-border) !important; border-radius: 0.75rem;">
              <div class="d-flex align-items-center justify-content-between mb-1.5">
                <span class="text-uppercase fw-bold text-secondary" style="font-size: 10px; letter-spacing: 0.5px;">Evaluation Impact</span>
                <span class="badge bg-danger-subtle text-danger border border-danger-subtle font-monospace" id="why-line-tag">Punishment</span>
              </div>
              <div class="d-flex align-items-center gap-3">
                <div>
                  <span class="text-secondary small d-block" style="font-size: 10px;">Win Chance</span>
                  <span class="fw-black font-monospace fs-6">${winProbBeforePct}% → ${winProbAfterPct}%</span>
                  <span class="badge bg-danger text-white font-monospace ms-1" style="font-size: 10px;">-${winLossPct}%</span>
                </div>
                ${evalBefore !== null && evalAfter !== null ? `
                <div class="vr opacity-25"></div>
                <div>
                  <span class="text-secondary small d-block" style="font-size: 10px;">Engine Score</span>
                  <span class="fw-black font-monospace fs-6">${Number(evalBefore) > 0 ? '+' + evalBefore : evalBefore} → ${Number(evalAfter) > 0 ? '+' + evalAfter : evalAfter}</span>
                </div>
                ` : ''}
              </div>
            </div>

            <div class="card border-0 mb-3 p-2.5" style="background: var(--arcade-card-hover, rgba(0,0,0,0.03)); border: 1px solid var(--arcade-border) !important; border-radius: 0.75rem;">
              <div class="d-flex align-items-start gap-2">
                <i class="bi bi-shield-exclamation text-danger fs-5 lh-1 mt-0.5"></i>
                <div>
                  <span class="fw-bold small d-block text-body" id="why-summary-text"><span class="spinner-border spinner-border-sm text-danger me-2" role="status"></span>Calculating what happens next...</span>
                </div>
              </div>
            </div>

            <div class="p-2 mb-3" style="background: var(--arcade-card-hover, rgba(0,0,0,0.03)); border: 1px solid var(--arcade-border); border-radius: 0.75rem; max-height: 140px; overflow-y: auto;">
              <div class="small fw-bold text-secondary mb-1.5" style="font-size: 11px;">Tactical Continuation (5 Moves):</div>
              <div class="d-flex flex-wrap gap-1.5" id="why-pills-container">
                <span class="text-secondary small"><span class="spinner-border spinner-border-sm me-2" role="status"></span>Loading line...</span>
              </div>
            </div>
          </div>

          <div>
            <div class="d-flex align-items-center justify-content-center gap-2 py-1">
              <button type="button" class="btn btn-sm btn-outline-secondary px-2" id="why-btn-first" disabled title="Start">
                <i class="bi bi-chevron-bar-left"></i>
              </button>
              <button type="button" class="btn btn-sm btn-outline-secondary px-2.5" id="why-btn-prev" disabled title="Previous Move">
                <i class="bi bi-chevron-left"></i>
              </button>
              <button type="button" class="btn btn-sm btn-primary px-3 fw-bold" id="why-btn-play" disabled title="Play / Pause">
                <i class="bi bi-play-fill" id="why-play-icon"></i>
              </button>
              <button type="button" class="btn btn-sm btn-outline-secondary px-2.5" id="why-btn-next" disabled title="Next Move">
                <i class="bi bi-chevron-right"></i>
              </button>
              <button type="button" class="btn btn-sm btn-outline-secondary px-2" id="why-btn-last" disabled title="End">
                <i class="bi bi-chevron-bar-right"></i>
              </button>
            </div>
            <div class="text-center text-secondary small fw-semibold mt-1" style="font-size: 11px;">
              <i class="bi bi-keyboard me-1"></i>Arrow keys: <kbd class="bg-body-secondary text-body px-1">←</kbd> <kbd class="bg-body-secondary text-body px-1">→</kbd> | Space: Play
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const boardMount = modal.querySelector('#why-modal-board');
  dashboard.whyBoard = new Chessboard(boardMount, {
    fen: cur.fen,
    orientation: dashboard.orientation,
    theme: dashboard.theme,
    interactive: false,
  });

  modal.querySelector('#why-btn-close')?.addEventListener('click', () => closeWhyModal(dashboard));
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeWhyModal(dashboard);
  });

  dashboard.whyKeyHandler = (e) => {
    if (e.key === 'Escape') {
      closeWhyModal(dashboard);
    } else if (e.key === 'ArrowLeft' || e.key === 'Left' || e.code === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'Up' || e.code === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      modal.querySelector('#why-btn-prev')?.click();
    } else if (e.key === 'ArrowRight' || e.key === 'Right' || e.code === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'Down' || e.code === 'ArrowDown') {
      e.preventDefault();
      e.stopPropagation();
      modal.querySelector('#why-btn-next')?.click();
    } else if (e.key === ' ' || e.code === 'Space') {
      e.preventDefault();
      e.stopPropagation();
      modal.querySelector('#why-btn-play')?.click();
    }
  };
  window.addEventListener('keydown', dashboard.whyKeyHandler);

  if (!cur.explanation) {
    await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
    if (!document.body.contains(modal)) return;
  }

  let punishmentSteps = cur.explanation?.punishmentSteps;
  let punishmentSummary = cur.explanation?.punishmentSummary;
  let bestSteps = cur.explanation?.bestSteps;
  let bestSummary = cur.explanation?.bestSummary;

  if (!punishmentSteps || !bestSteps) {
    punishmentSteps = [
      { ply: 0, fen: cur.fen, from: cur.from, to: cur.to, san: cur.san }
    ];
    const deepPunish = await getDeepContinuation(cur.fen, 5);
    punishmentSteps.push(...deepPunish);
    const endFen = punishmentSteps[punishmentSteps.length - 1].fen;
    punishmentSummary = summarizePunishment(cur.fen, endFen, cur.color);

    bestSteps = [
      { ply: 0, fen: cur.fenBefore, from: null, to: null, san: 'Start' }
    ];
    bestSummary = 'Maintains a solid position and prevents opponent tactical counterplay.';

    try {
      const cBest = new Chess(cur.fenBefore);
      const bUci = cur.bestMoveUci;
      if (bUci && bUci.length >= 4) {
        const from = bUci.slice(0, 2);
        const to = bUci.slice(2, 4);
        const promotion = bUci.length > 4 ? bUci[4] : void 0;
        const m = cBest.move({ from, to, promotion });
        if (m) {
          bestSteps.push({
            ply: 1,
            san: m.san,
            uci: bUci,
            from: m.from,
            to: m.to,
            fen: cBest.fen(),
            color: m.color
          });
          const deepBest = await getDeepContinuation(cBest.fen(), 4);
          bestSteps.push(...deepBest);
          bestSummary = `Playing ${cur.bestMoveSan || m.san} retains full equality or advantage with no tactical loss.`;
        }
      }
    } catch {
    }

    cur.explanation = { punishmentSteps, punishmentSummary, bestSteps, bestSummary };
  }

  if (!document.body.contains(modal)) return;
  modal.querySelectorAll('button[disabled]').forEach((btn) => btn.removeAttribute('disabled'));

  let activeTab = 'punishment';
  let currentSteps = punishmentSteps;
  let stepIdx = 0;
  let isPlaying = false;

  const renderActiveStep = () => {
    const step = currentSteps[stepIdx];
    if (!step) return;

    dashboard.whyBoard?.setProps({
      fen: step.fen,
      lastMove: step.from ? { from: step.from, to: step.to } : null,
    });

    const counterEl = modal.querySelector('#why-step-counter');
    if (counterEl) {
      counterEl.textContent = `Move ${stepIdx} / ${currentSteps.length - 1}`;
    }

    const pills = modal.querySelectorAll('.why-move-pill');
    pills.forEach((p, idx) => {
      if (idx === stepIdx) {
        p.classList.remove('btn-outline-secondary');
        p.classList.add('btn-primary', 'text-white');
      } else {
        p.classList.remove('btn-primary', 'text-white');
        p.classList.add('btn-outline-secondary');
      }
    });
  };

  const updatePills = () => {
    const pillsContainer = modal.querySelector('#why-pills-container');
    if (!pillsContainer) return;
    pillsContainer.innerHTML = '';

    currentSteps.forEach((st, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `btn btn-sm py-0.5 px-2 font-monospace fw-bold rounded-pill why-move-pill ${idx === stepIdx ? 'btn-primary text-white' : 'btn-outline-secondary'}`;
      btn.style.fontSize = '11px';
      btn.textContent = idx === 0 ? (activeTab === 'punishment' ? `${st.san}` : 'Start') : `${st.ply}. ${st.san}`;
      btn.addEventListener('click', () => {
        stopAutoplay();
        stepIdx = idx;
        soundService.playMove();
        renderActiveStep();
      });
      pillsContainer.appendChild(btn);
    });
  };

  const setTab = (tab) => {
    stopAutoplay();
    activeTab = tab;
    stepIdx = 0;

    const btnPunish = modal.querySelector('#why-tab-punishment');
    const btnBest = modal.querySelector('#why-tab-best');
    const tagEl = modal.querySelector('#why-line-tag');
    const summaryEl = modal.querySelector('#why-summary-text');

    if (tab === 'punishment') {
      currentSteps = punishmentSteps;
      btnPunish?.classList.add('active');
      btnBest?.classList.remove('active');

      if (tagEl) {
        tagEl.className = 'badge bg-danger-subtle text-danger border border-danger-subtle font-monospace';
        tagEl.textContent = 'Punishment';
      }
      if (summaryEl) summaryEl.textContent = punishmentSummary;
    } else {
      currentSteps = bestSteps;
      btnBest?.classList.add('active');
      btnPunish?.classList.remove('active');

      if (tagEl) {
        tagEl.className = 'badge bg-success-subtle text-success border border-success-subtle font-monospace';
        tagEl.textContent = 'Best Line';
      }
      if (summaryEl) summaryEl.textContent = bestSummary;
    }

    updatePills();
    renderActiveStep();
  };

  const stopAutoplay = () => {
    if (dashboard.whyTimer) {
      clearInterval(dashboard.whyTimer);
      dashboard.whyTimer = null;
    }
    isPlaying = false;
    const icon = modal.querySelector('#why-play-icon');
    if (icon) {
      icon.className = 'bi bi-play-fill';
    }
  };

  const startAutoplay = () => {
    if (isPlaying) {
      stopAutoplay();
      return;
    }
    if (stepIdx >= currentSteps.length - 1) {
      stepIdx = 0;
    }
    isPlaying = true;
    const icon = modal.querySelector('#why-play-icon');
    if (icon) {
      icon.className = 'bi bi-pause-fill';
    }

    dashboard.whyTimer = setInterval(() => {
      if (stepIdx < currentSteps.length - 1) {
        stepIdx++;
        soundService.playMove();
        renderActiveStep();
      } else {
        stopAutoplay();
      }
    }, 750);
  };

  modal.querySelector('#why-tab-punishment')?.addEventListener('click', () => setTab('punishment'));
  modal.querySelector('#why-tab-best')?.addEventListener('click', () => setTab('best'));

  modal.querySelector('#why-btn-first')?.addEventListener('click', () => {
    stopAutoplay();
    stepIdx = 0;
    soundService.playMove();
    renderActiveStep();
  });

  modal.querySelector('#why-btn-prev')?.addEventListener('click', () => {
    stopAutoplay();
    if (stepIdx > 0) {
      stepIdx--;
      soundService.playMove();
      renderActiveStep();
    }
  });

  modal.querySelector('#why-btn-next')?.addEventListener('click', () => {
    stopAutoplay();
    if (stepIdx < currentSteps.length - 1) {
      stepIdx++;
      soundService.playMove();
      renderActiveStep();
    }
  });

  modal.querySelector('#why-btn-last')?.addEventListener('click', () => {
    stopAutoplay();
    stepIdx = currentSteps.length - 1;
    soundService.playMove();
    renderActiveStep();
  });

  modal.querySelector('#why-btn-play')?.addEventListener('click', () => {
    startAutoplay();
  });



  setTab('punishment');

  const needsLongerLines = punishmentSteps.length - 1 < MIN_CONTINUATION_PLIES || bestSteps.length - 1 < MIN_CONTINUATION_PLIES;
  if (needsLongerLines) {
    modal.querySelector('#why-pills-container')?.insertAdjacentHTML('beforeend', '<span class="spinner-border spinner-border-sm text-secondary align-self-center" role="status"></span>');
    const [punishTail, bestTail] = await Promise.all([
      extendContinuation(cur.fen, punishmentSteps.slice(1)),
      extendContinuation(cur.fenBefore, bestSteps.slice(1))
    ]);
    if (!document.body.contains(modal)) return;
    punishmentSteps.splice(1, punishmentSteps.length - 1, ...punishTail);
    bestSteps.splice(1, bestSteps.length - 1, ...bestTail);
    updatePills();
    renderActiveStep();
  }
}
