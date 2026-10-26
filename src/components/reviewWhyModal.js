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
  document.body.classList.remove('modal-open');
}

async function openWhyModal(dashboard, targetEval = null) {
  const cur = targetEval || dashboard.getCurrentEval();
  if (!cur) return;

  closeWhyModal(dashboard);
  document.body.classList.add('modal-open');

  const isBrilliant = cur.classification === 'brilliant';
  const comic = getComicBadge(cur.classification, cur.san);
  const classificationName = isBrilliant ? 'Brilliant Move' : cur.classification.replace('_', ' ');

  const winProbBeforePct = Math.round((cur.moverWinProbBefore ?? cur.winProbBefore ?? 0.5) * 100);
  const winProbAfterPct = Math.round((cur.moverWinProbAfter ?? cur.winProb ?? 0.5) * 100);
  const winLossPct = Math.max(0, winProbBeforePct - winProbAfterPct);
  const winGainPct = Math.max(0, winProbAfterPct - winProbBeforePct);

  const evalBefore = cur.scoreBefore !== undefined ? (cur.scoreBefore / 100).toFixed(1) : null;
  const evalAfter = cur.scoreAfter !== undefined ? (cur.scoreAfter / 100).toFixed(1) : null;

  const motifs = (Array.isArray(cur.motifs) && cur.motifs.length > 0)
    ? cur.motifs
    : (typeof detectTacticalMotifs === 'function'
        ? detectTacticalMotifs(cur.fenBefore, cur.fen, { color: cur.color }, cur.bestMoveUci, cur.pv, cur.mate, cur.classification, cur.ply)
        : []);

  const motifBadgesHtml = motifs.length > 0
    ? `<div class="d-flex align-items-center flex-wrap gap-1.5 mt-1">
        ${motifs.map((m) => `<span class="motif-pill" style="border-color: ${m.color}; color: ${m.color}; background: ${m.color}18;">${m.icon} ${m.label}</span>`).join('')}
       </div>`
    : '';

  const modal = document.createElement('div');
  modal.className = 'why-modal-backdrop';
  modal.id = 'why-blunder-modal';
  modal.innerHTML = `
    <div class="why-dialog p-3 p-md-3.5 shadow-lg" style="max-width: 820px; width: 100%; border-radius: 1.25rem; background: var(--arcade-card); border: 1px solid var(--arcade-border);">
      <div class="d-flex align-items-center justify-content-between pb-2.5 mb-3 border-bottom" style="border-color: var(--arcade-border) !important;">
        <div class="d-flex align-items-center gap-2.5">
          <span class="badge rounded-pill px-3 py-1.5" style="background-color: ${comic.bg}; color: ${comic.text}; font-weight: 800; font-size: 12px;">
            ${comic.symbol} ${comic.term}
          </span>
          <div>
            <h5 class="mb-0 fw-black fs-6">${isBrilliant ? `Why was ${cur.san} Brilliant?` : `Why was ${cur.san} a ${classificationName}?`}</h5>
            <div class="text-secondary small font-monospace" style="font-size: 11px;">Move ${Math.ceil((cur.ply || 1) / 2)}${cur.color === 'b' ? '... ' : '. '}${cur.san}</div>
            ${motifBadgesHtml}
          </div>
        </div>
        <button type="button" class="btn-close" id="why-btn-close" aria-label="Close"></button>
      </div>

      <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
        <div class="arcade-mode-pills" role="group">
          <button type="button" class="arcade-pill active" id="why-tab-punishment" disabled>
            ${isBrilliant ? '<i class="bi bi-gem me-1" style="color: #06b6d4;"></i>Winning Follow-up' : '<i class="bi bi-lightning-charge-fill me-1 text-danger"></i>Opponent\'s Punishment'}
          </button>
          <button type="button" class="arcade-pill" id="why-tab-best" disabled>
            ${isBrilliant ? `<i class="bi bi-shuffle me-1 text-secondary"></i>Quiet Alternative (${cur.secondBestMoveSan || 'Alternative'})` : `<i class="bi bi-star-fill me-1 text-success"></i>Best Alternative (${cur.bestMoveSan || 'Top Move'})`}
          </button>
        </div>
        <span class="badge bg-body-secondary text-secondary font-monospace fw-bold px-2.5 py-1.5" id="why-step-counter">Move 0 / 0</span>
      </div>

      <div class="row g-3 align-items-stretch">
        <div class="col-12 col-md-7 d-flex flex-column align-items-center">
          <div id="why-modal-board" class="modal-board-container"></div>
          <div class="w-100 mt-1.5">
            <div class="d-flex align-items-center justify-content-center gap-1.5 py-1 flex-wrap">
              <button type="button" class="btn btn-sm btn-outline-secondary px-2.5" id="why-btn-first" disabled title="Start (Home)">
                <i class="bi bi-chevron-bar-left"></i>
              </button>
              <button type="button" class="btn btn-sm btn-outline-secondary px-3 fw-bold" id="why-btn-prev" disabled title="Previous Move (←)">
                <i class="bi bi-chevron-left me-1"></i>Prev
              </button>
              <button type="button" class="btn btn-sm btn-primary px-3 fw-bold" id="why-btn-play" disabled title="Play / Pause (Space)">
                <i class="bi bi-play-fill me-1" id="why-play-icon"></i><span id="why-play-label">Play</span>
              </button>
              <button type="button" class="btn btn-sm btn-outline-secondary px-3 fw-bold" id="why-btn-next" disabled title="Next Move (→)">
                Next<i class="bi bi-chevron-right ms-1"></i>
              </button>
              <button type="button" class="btn btn-sm btn-outline-secondary px-2.5" id="why-btn-last" disabled title="End (End)">
                <i class="bi bi-chevron-bar-right"></i>
              </button>
            </div>
            <div class="text-center text-secondary small fw-semibold mt-1" style="font-size: 11px;">
              <i class="bi bi-keyboard me-1"></i>Arrow keys: <kbd class="bg-body-secondary text-body px-1">←</kbd> <kbd class="bg-body-secondary text-body px-1">→</kbd> | Space: Play
            </div>
          </div>
        </div>
        <div class="col-12 col-md-5 d-flex flex-column justify-content-start">
          <div>
            <div class="card border-0 mb-2 p-2.5" style="background: var(--arcade-card-hover, rgba(0,0,0,0.03)); border: 1px solid var(--arcade-border) !important; border-radius: 0.75rem;">
              <div class="d-flex align-items-center justify-content-between mb-1.5">
                <span class="text-uppercase fw-bold text-secondary" style="font-size: 11px; letter-spacing: 0.5px;">Evaluation Impact</span>
                <span class="badge ${isBrilliant ? '' : 'bg-danger text-white'} font-monospace" id="why-line-tag" ${isBrilliant ? 'style="background: rgba(6,182,212,0.18); color: #0891b2; border: 1px solid rgba(6,182,212,0.4);"' : ''}>${isBrilliant ? 'Winning Line' : 'Punishment'}</span>
              </div>
              <div class="d-flex align-items-center gap-3">
                <div>
                  <span class="text-secondary small d-block fw-bold" style="font-size: 11px;">Win Chance</span>
                  <span class="fw-black font-monospace fs-6">${winProbBeforePct}% → ${winProbAfterPct}%</span>
                  ${isBrilliant ? (winGainPct > 0 ? `<span class="badge font-monospace ms-1" style="background: rgba(6,182,212,0.2); color: #0891b2; font-size: 11px;">+${winGainPct}%</span>` : `<span class="badge bg-success text-white font-monospace ms-1" style="font-size: 11px;">Solid</span>`) : `<span class="badge bg-danger text-white font-monospace ms-1" style="font-size: 11px;">-${winLossPct}%</span>`}
                </div>
                ${evalBefore !== null && evalAfter !== null ? `
                <div class="vr opacity-25"></div>
                <div>
                  <span class="text-secondary small d-block fw-bold" style="font-size: 11px;">Engine Score</span>
                  <span class="fw-black font-monospace fs-6">${Number(evalBefore) > 0 ? '+' + evalBefore : evalBefore} → ${Number(evalAfter) > 0 ? '+' + evalAfter : evalAfter}</span>
                </div>
                ` : ''}
              </div>
            </div>

            <div class="card border-0 mb-2 p-2.5" style="background: var(--arcade-card-hover, rgba(0,0,0,0.03)); border: 1px solid var(--arcade-border) !important; border-radius: 0.75rem;">
              <div class="d-flex align-items-start gap-2">
                <i class="bi ${isBrilliant ? 'bi-gem' : 'bi-shield-exclamation text-danger'} fs-5 lh-1 mt-0.5" ${isBrilliant ? 'style="color: #0891b2;"' : ''}></i>
                <div>
                  <span class="fw-bold small d-block text-body" id="why-summary-text"><span class="spinner-border spinner-border-sm ${isBrilliant ? '' : 'text-danger'} me-2" ${isBrilliant ? 'style="color: #0891b2;"' : ''} role="status"></span>Calculating what happens next...</span>
                </div>
              </div>
            </div>

            <div class="p-2.5 mb-2.5 rounded-3" style="background: var(--arcade-card-hover, rgba(0,0,0,0.03)); border: 1px solid var(--arcade-border);">
              <div class="d-flex align-items-center justify-content-between mb-1.5">
                <span class="small fw-bold text-secondary" style="font-size: 12px;" id="why-continuation-title">Tactical Continuation (5 Moves):</span>
                <span class="small text-secondary font-monospace" style="font-size: 10px;" id="why-positional-hint"></span>
              </div>
              <div class="d-flex flex-wrap gap-1.5" id="why-pills-container">
                <span class="text-secondary small"><span class="spinner-border spinner-border-sm me-2" role="status"></span>Loading line...</span>
              </div>
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

  const dialogEl = modal.querySelector('.why-dialog');
  const safeClose = typeof setupModalSwipeAndHistory === 'function'
    ? setupModalSwipeAndHistory(modal, dialogEl, () => closeWhyModal(dashboard))
    : () => closeWhyModal(dashboard);

  modal.querySelector('#why-btn-close')?.addEventListener('click', safeClose);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) safeClose();
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
    } else if (e.key === 'Home') {
      e.preventDefault();
      e.stopPropagation();
      modal.querySelector('#why-btn-first')?.click();
    } else if (e.key === 'End') {
      e.preventDefault();
      e.stopPropagation();
      modal.querySelector('#why-btn-last')?.click();
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

  const hasValidPunish = Array.isArray(punishmentSteps) && punishmentSteps.length > 1;
  const hasValidBest = Array.isArray(bestSteps) && bestSteps.length > 1;

  if (!hasValidPunish || !hasValidBest) {
    if (!hasValidPunish) {
      punishmentSteps = [
        { ply: 0, fen: cur.fen, from: cur.from, to: cur.to, san: cur.san }
      ];
      const deepPunish = await getDeepContinuation(cur.fen, 5);
      punishmentSteps.push(...deepPunish);
      const endFen = punishmentSteps[punishmentSteps.length - 1].fen;
      punishmentSummary = isBrilliant
        ? summarizeBrilliant(cur.fen, endFen, cur.color)
        : summarizePunishment(cur.fen, endFen, cur.color, cur.classification);
    }

    if (!hasValidBest) {
      bestSteps = [
        { ply: 0, fen: cur.fenBefore, from: null, to: null, san: 'Start' }
      ];
      bestSummary = isBrilliant
        ? 'A quiet alternative that misses the decisive tactical breakthrough.'
        : 'Maintains a solid position and prevents opponent tactical counterplay.';

      try {
        const cBest = new Chess(cur.fenBefore);
        let bUci = isBrilliant ? (cur.secondBestMoveUci || findBestMoveLocal(cur.fenBefore, 2).secondBestMoveUci || findBestMoveLocal(cur.fenBefore, 2).bestMoveUci) : cur.bestMoveUci;
        if (!bUci) {
          const localBest = findBestMoveLocal(cur.fenBefore, 2);
          bUci = isBrilliant ? (localBest.secondBestMoveUci || localBest.bestMoveUci) : localBest.bestMoveUci;
        }
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
            bestSummary = isBrilliant
              ? `Playing ${cur.secondBestMoveSan || m.san} is a quieter alternative that misses the tactical breakthrough.`
              : `Playing ${cur.bestMoveSan || m.san} retains full equality or advantage with no tactical loss.`;
          }
        }
      } catch {
      }
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

    let arrowMove = null;
    if (activeTab === 'best') {
      if (stepIdx === 0 && bestSteps && bestSteps.length > 1 && bestSteps[1]?.from && bestSteps[1]?.to) {
        arrowMove = { from: bestSteps[1].from, to: bestSteps[1].to };
      } else if (step.from && step.to) {
        arrowMove = { from: step.from, to: step.to };
      }
    }

    dashboard.whyBoard?.setProps({
      fen: step.fen,
      lastMove: step.from ? { from: step.from, to: step.to } : null,
      bestMove: arrowMove,
      showBestMove: Boolean(arrowMove),
    });

    const counterEl = modal.querySelector('#why-step-counter');
    if (counterEl) {
      counterEl.textContent = `Move ${stepIdx} / ${currentSteps.length - 1}`;
    }

    const btnFirst = modal.querySelector('#why-btn-first');
    const btnPrev = modal.querySelector('#why-btn-prev');
    const btnNext = modal.querySelector('#why-btn-next');
    const btnLast = modal.querySelector('#why-btn-last');
    if (btnFirst) btnFirst.disabled = stepIdx <= 0;
    if (btnPrev) btnPrev.disabled = stepIdx <= 0;
    if (btnNext) btnNext.disabled = stepIdx >= currentSteps.length - 1;
    if (btnLast) btnLast.disabled = stepIdx >= currentSteps.length - 1;

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

    if (!currentSteps || currentSteps.length === 0) {
      pillsContainer.innerHTML = '<span class="text-secondary small fst-italic">No tactical continuation available.</span>';
      return;
    }

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

    if (currentSteps.length === 1 && activeTab === 'punishment') {
      const note = document.createElement('span');
      note.className = 'text-secondary small fst-italic align-self-center ms-1';
      note.style.fontSize = '11px';
      note.textContent = '(Position offers no forcing reply)';
      pillsContainer.appendChild(note);
    }
  };

  const setTab = (tab) => {
    stopAutoplay();
    activeTab = tab;
    stepIdx = 0;

    const btnPunish = modal.querySelector('#why-tab-punishment');
    const btnBest = modal.querySelector('#why-tab-best');
    const tagEl = modal.querySelector('#why-line-tag');
    const summaryEl = modal.querySelector('#why-summary-text');
    const continuationTitleEl = modal.querySelector('#why-continuation-title');
    const positionalHintEl = modal.querySelector('#why-positional-hint');

    const hasMaterialLoss = (() => {
      try {
        if (!punishmentSteps || punishmentSteps.length < 2) return false;
        const cStart = new Chess(punishmentSteps[0].fen);
        const cEnd = new Chess(punishmentSteps[punishmentSteps.length - 1].fen);
        return typeof getMaterialDiffInPawns === 'function'
          ? (getMaterialDiffInPawns(cStart, cur.color) - getMaterialDiffInPawns(cEnd, cur.color)) >= 1
          : false;
      } catch { return false; }
    })();

    if (tab === 'punishment') {
      currentSteps = punishmentSteps;
      stepIdx = 0;
      btnPunish?.classList.add('active');
      btnBest?.classList.remove('active');

      if (tagEl) {
        if (isBrilliant) {
          tagEl.className = 'badge font-monospace';
          tagEl.style.cssText = 'background: rgba(6,182,212,0.15); color: #06b6d4; border: 1px solid rgba(6,182,212,0.3);';
          tagEl.textContent = 'Winning Line';
        } else if (!hasMaterialLoss) {
          tagEl.className = 'badge bg-info-subtle text-info border border-info-subtle font-monospace';
          tagEl.style.cssText = '';
          tagEl.textContent = cur.classification === 'inaccuracy' ? 'Positional Edge' : 'Positional Shift';
        } else {
          tagEl.className = 'badge bg-danger-subtle text-danger border border-danger-subtle font-monospace';
          tagEl.style.cssText = '';
          tagEl.textContent = 'Tactical Punishment';
        }
      }
      if (summaryEl) summaryEl.textContent = punishmentSummary;
      if (continuationTitleEl) {
        continuationTitleEl.textContent = hasMaterialLoss ? 'Tactical Line (5 Moves):' : 'Strategic Follow-up (5 Moves):';
      }
      if (positionalHintEl) {
        positionalHintEl.textContent = (!hasMaterialLoss && !isBrilliant) ? 'No material lost · Look for piece activity' : '';
      }
    } else {
      currentSteps = bestSteps;
      stepIdx = bestSteps && bestSteps.length > 1 ? 1 : 0;
      btnBest?.classList.add('active');
      btnPunish?.classList.remove('active');

      if (tagEl) {
        if (isBrilliant) {
          tagEl.className = 'badge bg-secondary-subtle text-secondary border border-secondary-subtle font-monospace';
          tagEl.style.cssText = '';
          tagEl.textContent = 'Quiet Alternative';
        } else {
          tagEl.className = 'badge bg-success-subtle text-success border border-success-subtle font-monospace';
          tagEl.style.cssText = '';
          tagEl.textContent = 'Best Line';
        }
      }
      if (summaryEl) summaryEl.textContent = bestSummary;
      if (continuationTitleEl) {
        continuationTitleEl.textContent = 'Optimal Engine Line (5 Moves):';
      }
      if (positionalHintEl) {
        positionalHintEl.textContent = 'Maintains balance & piece harmony';
      }
    }

    updatePills();
    renderActiveStep();
    if (tab === 'best' && stepIdx > 0 && typeof soundService !== 'undefined') {
      soundService.playMove();
    }
  };

  const stopAutoplay = () => {
    if (dashboard.whyTimer) {
      clearInterval(dashboard.whyTimer);
      dashboard.whyTimer = null;
    }
    isPlaying = false;
    const icon = modal.querySelector('#why-play-icon');
    if (icon) {
      icon.className = 'bi bi-play-fill me-1';
    }
    const label = modal.querySelector('#why-play-label');
    if (label) {
      label.textContent = 'Play';
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
      icon.className = 'bi bi-pause-fill me-1';
    }
    const label = modal.querySelector('#why-play-label');
    if (label) {
      label.textContent = 'Pause';
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
    modal.querySelector('#why-pills-container')?.insertAdjacentHTML('beforeend', '<span class="spinner-border spinner-border-sm text-secondary align-self-center ms-1" id="why-pills-spinner" role="status"></span>');
    try {
      const [punishTail, bestTail] = await Promise.all([
        extendContinuation(cur.fen, punishmentSteps.slice(1)),
        extendContinuation(cur.fenBefore, bestSteps.slice(1))
      ]);
      if (!document.body.contains(modal)) return;
      if (punishTail && punishTail.length > 0) {
        punishmentSteps.splice(1, punishmentSteps.length - 1, ...punishTail);
      }
      if (bestTail && bestTail.length > 0) {
        bestSteps.splice(1, bestSteps.length - 1, ...bestTail);
      }
      cur.explanation = { punishmentSteps, punishmentSummary, bestSteps, bestSummary };
    } catch (err) {
      console.warn('[WhyModal] Error extending lines:', err);
    } finally {
      modal.querySelector('#why-pills-spinner')?.remove();
      updatePills();
      renderActiveStep();
    }
  }
}
