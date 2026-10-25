/**
 * Blunder Bank Spaced Repetition Practice Modal
 * Interactive puzzle flashcards reviewing mistakes, blunders, and missed wins.
 */

function closeBlunderBankModal() {
  const existing = document.getElementById('blunder-bank-modal');
  if (existing) existing.remove();
  document.body.classList.remove('modal-open');
}

function openBlunderBankModal(dashboard, initialFilter = 'all') {
  closeBlunderBankModal();
  if (!dashboard) return;
  let currentFilter = initialFilter;
  let puzzles = typeof getBlunderBankPuzzles === 'function' ? getBlunderBankPuzzles(currentFilter) : [];
  let currentIdx = 0;
  let solved = false;
  let feedback = '';
  let isErr = false;
  let modalBoard = null;

  const modal = document.createElement('div');
  modal.className = 'why-modal-backdrop';
  modal.id = 'blunder-bank-modal';

  const renderModalContent = () => {
    const stats = typeof getBlunderBankStats === 'function' ? getBlunderBankStats() : { total: 0, mastered: 0, due: 0, motifCounts: {} };
    puzzles = typeof getBlunderBankPuzzles === 'function' ? getBlunderBankPuzzles(currentFilter) : [];
    if (currentIdx >= puzzles.length) currentIdx = 0;
    const curPuzzle = puzzles[currentIdx] || null;

    const motifFilters = [
      { id: 'all', label: `All (${stats.total})` },
      { id: 'unmastered', label: `Due (${stats.due})` },
      ...Object.entries(stats.motifCounts || {}).map(([mId, cnt]) => {
        const cat = (typeof TACTICAL_MOTIF_CATALOG !== 'undefined' && TACTICAL_MOTIF_CATALOG[mId]) || { icon: '⚡', label: mId };
        return { id: mId, label: `${cat.icon} ${cat.label} (${cnt})` };
      })
    ];

    modal.innerHTML = `
      <div class="why-dialog p-3 p-md-4 shadow-lg" style="max-width: 780px; width: 100%; border-radius: 1.25rem; background: var(--arcade-card); border: 1px solid var(--arcade-border);">
        <div class="d-flex align-items-center justify-content-between pb-2.5 mb-3 border-bottom" style="border-color: var(--arcade-border) !important;">
          <div class="d-flex align-items-center gap-2">
            <span class="badge bg-warning text-dark border border-dark px-2.5 py-1.5 fw-black">🧠 PERSONAL BLUNDER BANK</span>
            <span class="badge bg-success-subtle text-success border border-success-subtle font-monospace fw-bold">
              Mastered: ${stats.mastered} / ${stats.total}
            </span>
          </div>
          <button type="button" class="btn-close" id="bb-btn-close" aria-label="Close"></button>
        </div>

        <div class="d-flex align-items-center flex-wrap gap-1.5 mb-3">
          ${motifFilters.map((f) => `
            <button type="button" class="btn btn-xs move-filter-pill ${currentFilter === f.id ? 'active' : ''}" data-bb-filter="${f.id}">
              ${f.label}
            </button>
          `).join('')}
        </div>

        ${!curPuzzle ? `
          <div class="text-center py-5 text-secondary">
            <div class="fs-1 mb-2">🎉</div>
            <h6 class="fw-black text-body">No Puzzles in This Filter!</h6>
            <p class="small mb-0">Analyze games to automatically populate your personal Blunder Bank with mistakes from your own matches.</p>
          </div>
        ` : `
          <div class="row g-3 align-items-stretch">
            <div class="col-12 col-md-7 d-flex justify-content-center">
              <div id="bb-modal-board" style="width: 100%; max-width: 360px; aspect-ratio: 1/1;"></div>
            </div>
            <div class="col-12 col-md-5 d-flex flex-column justify-content-between">
              <div>
                <div class="d-flex align-items-center justify-content-between mb-2">
                  <span class="badge bg-secondary font-monospace">Puzzle ${currentIdx + 1} of ${puzzles.length}</span>
                  <div class="d-flex align-items-center gap-1.5">
                    ${curPuzzle.mastered ? `<span class="badge bg-success"><i class="bi bi-check2-all me-1"></i>Mastered</span>` : `<span class="badge bg-warning text-dark">Needs Practice</span>`}
                    <button type="button" class="btn btn-outline-danger btn-sm p-1 py-0.5 comic-btn" id="bb-btn-delete-puzzle" title="Remove this move/puzzle from Blunder Bank" style="font-size: 11px;">
                      <i class="bi bi-trash3"></i>
                    </button>
                  </div>
                </div>
                <div class="p-2.5 rounded mb-2" style="background: var(--arcade-card-hover, rgba(0,0,0,0.03)); border: 1px solid var(--arcade-border);">
                  <div class="small fw-bold mb-1">${insEscape(curPuzzle.white)} vs ${insEscape(curPuzzle.black)}</div>
                  <div class="text-secondary small" style="font-size: 11px;">
                    Move ${Math.ceil((curPuzzle.ply || 1) / 2)} · In the game you played <span class="text-danger font-monospace fw-black">${insEscape(curPuzzle.playedSan)}</span> (${insEscape(curPuzzle.classification)})
                  </div>
                </div>
                <div class="alert ${solved ? 'alert-success' : (isErr ? 'alert-danger' : 'alert-warning')} py-2 px-2.5 small fw-bold mb-2">
                  ${insEscape(feedback || `Playing as ${curPuzzle.userColor === 'w' ? 'White' : 'Black'}: Find the best move on the board!`)}
                </div>
              </div>

              <div class="d-flex flex-column gap-2">
                <div class="d-flex align-items-center gap-1.5">
                  <button type="button" class="btn btn-sm btn-outline-warning comic-btn flex-grow-1 fw-bold" id="bb-btn-hint">
                    <i class="bi bi-lightbulb-fill me-1"></i>Hint
                  </button>
                  <button type="button" class="btn btn-sm btn-outline-secondary comic-btn flex-grow-1 fw-bold" id="bb-btn-solution">
                    <i class="bi bi-eye-fill me-1"></i>Solution
                  </button>
                </div>
                <div class="d-flex align-items-center justify-content-between gap-2">
                  <button type="button" class="btn btn-sm btn-light comic-btn px-3 fw-bold" id="bb-btn-prev" ${puzzles.length <= 1 ? 'disabled' : ''}>
                    <i class="bi bi-chevron-left me-1"></i>Prev
                  </button>
                  <button type="button" class="btn btn-sm btn-warning text-dark comic-btn flex-grow-1 fw-black" id="bb-btn-next" ${puzzles.length <= 1 ? 'disabled' : ''}>
                    Next Puzzle <i class="bi bi-chevron-right ms-1"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        `}
      </div>
    `;

    modal.querySelector('#bb-btn-close')?.addEventListener('click', () => modal.remove());
    modal.querySelectorAll('[data-bb-filter]').forEach((btn) => {
      btn.addEventListener('click', () => {
        currentFilter = btn.getAttribute('data-bb-filter') || 'all';
        currentIdx = 0;
        solved = false;
        feedback = '';
        isErr = false;
        renderModalContent();
      });
    });

    if (curPuzzle) {
      const mount = modal.querySelector('#bb-modal-board');
      const bestMoveArrow = solved && curPuzzle.bestMoveUci && curPuzzle.bestMoveUci.length >= 4
        ? { from: curPuzzle.bestMoveUci.slice(0, 2), to: curPuzzle.bestMoveUci.slice(2, 4) }
        : null;

      modalBoard = new Chessboard(mount, {
        fen: curPuzzle.fenBefore,
        orientation: curPuzzle.userColor || 'w',
        theme: this.theme,
        interactive: !solved,
        bestMove: bestMoveArrow,
        showPlayerBars: false,
        legalMovesFrom: (sq) => {
          try {
            const c = new Chess(curPuzzle.fenBefore);
            return c.moves({ square: sq, verbose: true }).map((m) => m.to);
          } catch {
            return [];
          }
        },
        onMove: (from, to) => {
          try {
            const c = new Chess(curPuzzle.fenBefore);
            const m = c.move({ from, to, promotion: 'q' });
            if (!m) return;
            const uci = `${m.from}${m.to}`.toLowerCase();
            const targetPrefix = (curPuzzle.bestMoveUci || '').slice(0, 4).toLowerCase();
            if (uci === targetPrefix || m.san === curPuzzle.bestMoveSan) {
              solved = true;
              isErr = false;
              feedback = `✅ Mastered! ${m.san} is the top move.`;
              if (typeof recordBlunderBankAttempt === 'function') recordBlunderBankAttempt(curPuzzle.id, true);
              soundService.playBrilliant();
            } else {
              isErr = true;
              feedback = `❌ ${m.san} is not the best move — try again!`;
              if (typeof recordBlunderBankAttempt === 'function') recordBlunderBankAttempt(curPuzzle.id, false);
              soundService.playBlunder();
            }
            renderModalContent();
          } catch {}
        }
      });

      modal.querySelector('#bb-btn-delete-puzzle')?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (curPuzzle && typeof removeBlunderBankItem === 'function') {
          removeBlunderBankItem(curPuzzle.id);
          feedback = 'Puzzle removed from your Blunder Bank.';
          solved = false;
          isErr = false;
          renderModalContent();
        }
      });

      modal.querySelector('#bb-btn-hint')?.addEventListener('click', () => {
        const fromSq = (curPuzzle.bestMoveUci || '').slice(0, 2);
        if (fromSq && modalBoard) {
          modalBoard.userHighlights.clear();
          modalBoard.userHighlights.add(fromSq);
          modalBoard.render();
          feedback = `💡 Hint: Move the piece on ${fromSq.toUpperCase()}!`;
          isErr = false;
        }
      });

      modal.querySelector('#bb-btn-solution')?.addEventListener('click', () => {
        solved = true;
        isErr = false;
        feedback = `👁 Solution: ${curPuzzle.bestMoveSan} was the best move.`;
        renderModalContent();
      });

      modal.querySelector('#bb-btn-prev')?.addEventListener('click', () => {
        currentIdx = (currentIdx - 1 + puzzles.length) % puzzles.length;
        solved = false;
        feedback = '';
        isErr = false;
        renderModalContent();
      });

      modal.querySelector('#bb-btn-next')?.addEventListener('click', () => {
        currentIdx = (currentIdx + 1) % puzzles.length;
        solved = false;
        feedback = '';
        isErr = false;
        renderModalContent();
      });
    }
  };

  const closeBlunderBank = () => {
    modal.remove();
    document.body.classList.remove('modal-open');
  };

  const dialogEl = modal.querySelector('.why-dialog');
  const safeClose = typeof setupModalSwipeAndHistory === 'function'
    ? setupModalSwipeAndHistory(modal, dialogEl, closeBlunderBank)
    : closeBlunderBank;

  modal.querySelector('#bb-btn-close')?.addEventListener('click', safeClose);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) safeClose();
  });

  document.body.classList.add('modal-open');
  document.body.appendChild(modal);
  renderModalContent();
}
