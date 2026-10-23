const Chess = window.Chess;
import { Chessboard } from './board.js';
import { soundService } from '../services/sound.js';
import { getComicBadge } from '../services/comicBadges.js';
import { getDeepContinuation, summarizePunishment } from '../services/engine.js';

export function closeWhyModal(dashboard) {
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

export async function openWhyModal(dashboard, targetEval = null) {
  const cur = targetEval || dashboard.getCurrentEval();
  if (!cur) return;

  closeWhyModal(dashboard);

  const comic = getComicBadge(cur.classification, cur.san);
  const classificationName = cur.classification.replace('_', ' ');

  const modal = document.createElement('div');
  modal.className = 'why-modal-backdrop';
  modal.id = 'why-blunder-modal';
  modal.innerHTML = `
    <div class="why-dialog comic-card p-3 p-md-4 border border-3 border-dark shadow-lg" style="max-width: 780px; width: 100%; max-height: 94vh; overflow-y: auto; border-radius: 1.25rem; background: var(--bs-body-bg, #fff);">
      <div class="d-flex align-items-center justify-content-between pb-2 mb-3 border-bottom border-2 border-dark">
        <div class="d-flex align-items-center gap-2">
          <span class="badge border border-dark rounded-pill px-2.5 py-1" style="background-color: ${comic.bg}; color: ${comic.text}; font-weight: 900; font-size: 11px;">
            ${comic.symbol} ${comic.term}
          </span>
          <h5 class="mb-0 fw-black font-monospace fs-6">Why was ${cur.san} a ${classificationName}?</h5>
        </div>
        <button type="button" class="btn btn-sm btn-outline-dark comic-btn rounded-circle px-2 py-1" id="why-btn-close" aria-label="Close">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>

      <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
        <div class="btn-group btn-group-sm" role="group">
          <button type="button" class="btn btn-danger active fw-bold comic-btn" id="why-tab-punishment">
            <i class="bi bi-lightning-charge-fill me-1"></i>Opponent's Punishment
          </button>
          <button type="button" class="btn btn-outline-success fw-bold comic-btn" id="why-tab-best">
            <i class="bi bi-star-fill me-1"></i>Best Alternative (${cur.bestMoveSan || 'Top Move'})
          </button>
        </div>
        <span class="badge bg-body-secondary text-secondary font-monospace fw-bold px-2 py-1" id="why-step-counter">Move 0 / 0</span>
      </div>

      <div class="row g-3 align-items-stretch">
        <div class="col-12 col-md-7 d-flex justify-content-center">
          <div id="why-modal-board" style="width: 100%; max-width: 380px; aspect-ratio: 1/1;"></div>
        </div>
        <div class="col-12 col-md-5 d-flex flex-column justify-content-between">
          <div>
            <div class="card border border-2 border-dark mb-2 shadow-sm">
              <div class="card-body p-2.5">
                <div class="d-flex align-items-center justify-content-between mb-1">
                  <span class="text-uppercase fw-black small text-secondary" style="font-size: 11px;">Tactical Consequence</span>
                  <span class="badge bg-danger-subtle text-danger border border-danger-subtle font-monospace" id="why-line-tag">Punishment</span>
                </div>
                <div class="fw-bold small text-body" id="why-summary-text">
                  <span class="spinner-border spinner-border-sm me-1 text-danger"></span>Calculating continuation...
                </div>
              </div>
            </div>

            <div class="border border-2 border-dark rounded p-2 bg-body-tertiary mb-3" style="max-height: 140px; overflow-y: auto;">
              <div class="small fw-black text-secondary mb-1" style="font-size: 11px;">Continuation Line (Next 10 Moves):</div>
              <div class="d-flex flex-wrap gap-1" id="why-pills-container">
                <span class="text-secondary small fst-italic">Loading line...</span>
              </div>
            </div>
          </div>

          <div>
            <div class="d-flex align-items-center justify-content-center gap-1.5 py-1">
              <button type="button" class="btn btn-outline-dark btn-sm comic-btn px-2" id="why-btn-first" title="Start">
                <i class="bi bi-chevron-bar-left"></i>
              </button>
              <button type="button" class="btn btn-outline-dark btn-sm comic-btn px-2.5" id="why-btn-prev" title="Previous Move">
                <i class="bi bi-chevron-left"></i>
              </button>
              <button type="button" class="btn btn-primary btn-sm comic-btn px-3" id="why-btn-play" title="Play / Pause">
                <i class="bi bi-play-fill" id="why-play-icon"></i>
              </button>
              <button type="button" class="btn btn-outline-dark btn-sm comic-btn px-2.5" id="why-btn-next" title="Next Move">
                <i class="bi bi-chevron-right"></i>
              </button>
              <button type="button" class="btn btn-outline-dark btn-sm comic-btn px-2" id="why-btn-last" title="End">
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

  let punishmentSteps = cur.explanation?.punishmentSteps;
  let punishmentSummary = cur.explanation?.punishmentSummary;
  let bestSteps = cur.explanation?.bestSteps;
  let bestSummary = cur.explanation?.bestSummary;

  if (!punishmentSteps || !bestSteps) {
    punishmentSteps = [
      { ply: 0, fen: cur.fen, from: cur.from, to: cur.to, san: cur.san }
    ];
    const deepPunish = await getDeepContinuation(cur.fen, 10);
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
          const deepBest = await getDeepContinuation(cBest.fen(), 9);
          bestSteps.push(...deepBest);
          bestSummary = `Playing ${cur.bestMoveSan || m.san} retains full equality or advantage with no tactical loss.`;
        }
      }
    } catch {
    }

    cur.explanation = { punishmentSteps, punishmentSummary, bestSteps, bestSummary };
  }

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
        p.classList.remove('btn-outline-dark', 'btn-outline-secondary');
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
      btn.className = `btn btn-sm py-0.5 px-1.5 font-monospace fw-bold rounded-pill why-move-pill ${idx === stepIdx ? 'btn-primary text-white' : 'btn-outline-secondary'}`;
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
      btnPunish?.classList.add('active', 'btn-danger');
      btnPunish?.classList.remove('btn-outline-danger');
      btnBest?.classList.remove('active', 'btn-success');
      btnBest?.classList.add('btn-outline-success');

      if (tagEl) {
        tagEl.className = 'badge bg-danger-subtle text-danger border border-danger-subtle font-monospace';
        tagEl.textContent = 'Punishment';
      }
      if (summaryEl) summaryEl.textContent = punishmentSummary;
    } else {
      currentSteps = bestSteps;
      btnBest?.classList.add('active', 'btn-success');
      btnBest?.classList.remove('btn-outline-success');
      btnPunish?.classList.remove('active', 'btn-danger');
      btnPunish?.classList.add('btn-outline-danger');

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

  modal.querySelector('#why-btn-close')?.addEventListener('click', () => closeWhyModal(dashboard));
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeWhyModal(dashboard);
  });

  dashboard.whyKeyHandler = (e) => {
    if (e.key === 'Escape') {
      closeWhyModal(dashboard);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      modal.querySelector('#why-btn-prev')?.click();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      modal.querySelector('#why-btn-next')?.click();
    } else if (e.key === ' ') {
      e.preventDefault();
      modal.querySelector('#why-btn-play')?.click();
    }
  };
  window.addEventListener('keydown', dashboard.whyKeyHandler);

  setTab('punishment');
}
