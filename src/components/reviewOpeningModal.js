/**
 * Opening Explorer & ECO Book Deviation Modal
 * Displays opening repertoire, canonical theoretical sequence, and deviation point.
 */

function closeOpeningModal() {
  const existing = document.getElementById('opening-explorer-modal');
  if (existing) existing.remove();
  document.body.classList.remove('modal-open');
}

function openOpeningModal(dashboard) {
  if (!dashboard || !dashboard.game) return;
  closeOpeningModal();
  const ecoCode = dashboard.game.ecoCode || 'PGN';
  const ecoName = dashboard.game.ecoName || 'Chess Opening';
  const ecoMeta = (typeof getEcoMetadata === 'function')
    ? getEcoMetadata(ecoCode, ecoName)
    : {
        code: ecoCode,
        name: ecoName,
        volume: 'Encyclopaedia of Chess Openings',
        category: 'Standard Chess Opening',
        theme: 'Standard opening classification in the ECO encyclopedia.',
        strategicSummary: 'Classical opening principles: contest central squares, develop knights and bishops actively, and secure king safety through castling.',
        canonicalMoves: [],
        canonicalMovesStr: '',
        links: {
          chess365: `https://www.365chess.com/eco/${encodeURIComponent(ecoCode)}`,
          lichess: `https://lichess.org/analysis`,
          chessCom: `https://www.chess.com/openings`
        }
      };

  const od = dashboard.game.openingDeviation;
  const middlegameMove = Math.ceil((dashboard.game.middlegameStartPly || 20) / 2);

  const modal = document.createElement('div');
  modal.id = 'opening-explorer-modal';
  modal.className = 'why-modal-backdrop';
  modal.innerHTML = `
    <div class="why-dialog opening-explorer-dialog comic-card p-3 p-sm-4 shadow-2xl">
      <!-- Header -->
      <div class="d-flex align-items-center justify-content-between pb-2 mb-3 border-bottom" style="border-color: var(--arcade-border) !important;">
        <div class="d-flex align-items-center gap-2 flex-wrap min-w-0">
          <span class="badge bg-warning text-dark font-monospace fw-black px-2.5 py-1.5 fs-6">${insEscape(ecoMeta.code)}</span>
          <div class="min-w-0">
            <h5 class="fw-black mb-0 text-truncate" style="font-size: 16px;">${insEscape(ecoMeta.name)}</h5>
            <span class="text-secondary small font-monospace">${insEscape(ecoMeta.volume)} · ${insEscape(ecoMeta.category)}</span>
          </div>
        </div>
        <button type="button" class="btn btn-sm btn-dark comic-btn py-1 px-2.5 fw-bold" id="btn-close-opening-modal" title="Close">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>

      <!-- Body -->
      <div class="d-flex flex-column gap-2.5">
        <!-- Strategic Theme Card -->
        <div class="p-2.5 rounded" style="background: var(--arcade-card); border: 1px solid var(--arcade-border);">
          <div class="d-flex align-items-center gap-1.5 mb-1.5">
            <i class="bi bi-compass-fill text-warning fs-6"></i>
            <strong class="small fw-black text-uppercase" style="letter-spacing: 0.5px;">Opening Strategic Theme</strong>
          </div>
          <p class="mb-1.5 small text-body" style="line-height: 1.5;">${insEscape(ecoMeta.theme)}</p>
          <p class="mb-0 small text-secondary fst-italic" style="font-size: 11.5px; line-height: 1.4;">${insEscape(ecoMeta.strategicSummary)}</p>
        </div>

        <!-- Theoretical Move Sequence -->
        ${ecoMeta.canonicalMovesStr ? `
          <div class="p-2.5 rounded" style="background: var(--arcade-card); border: 1px solid var(--arcade-border);">
            <div class="d-flex align-items-center justify-content-between mb-1.5">
              <span class="small fw-black text-uppercase text-secondary" style="font-size: 10.5px; letter-spacing: 0.5px;">
                <i class="bi bi-book-half text-primary me-1"></i>Canonical Starting Moves
              </span>
              <span class="badge bg-secondary font-monospace" style="font-size: 10px;">${ecoMeta.canonicalMoves.length} plies</span>
            </div>
            <div class="font-monospace fw-bold p-2 rounded text-primary" style="background: var(--arcade-surface, rgba(0,0,0,0.06)); font-size: 13px; word-break: break-word;">
              ${insEscape(ecoMeta.canonicalMovesStr)}
            </div>
          </div>
        ` : ''}

        <!-- Game Theory Connection -->
        <div class="p-2.5 rounded" style="background: var(--arcade-card); border: 1px solid var(--arcade-border);">
          <div class="d-flex align-items-center justify-content-between mb-1">
            <span class="small fw-black text-uppercase text-secondary" style="font-size: 10.5px; letter-spacing: 0.5px;">
              <i class="bi bi-shield-check text-success me-1"></i>Match Opening Trajectory
            </span>
            <span class="badge bg-secondary font-monospace" style="font-size: 10px;">Phase: Moves 1-${middlegameMove}</span>
          </div>
          ${od ? `
            <div class="small mb-2">
              The game followed standard theoretical opening lines until <strong>Move ${Math.ceil(od.ply / 2)}${od.ply % 2 === 1 ? '.' : '...'} ${insEscape(od.san)}</strong> (Ply ${od.ply}), where play branched from established theory.
            </div>
            <button type="button" class="btn btn-sm btn-outline-warning comic-btn fw-bold py-1 px-2.5 w-100" id="btn-jump-opening-dev" data-dev-ply="${od.ply}">
              <i class="bi bi-crosshair me-1"></i>Jump to Book Departure on Board (Move ${Math.ceil(od.ply / 2)})
            </button>
          ` : `
            <div class="small text-secondary">
              Both players transitioned smoothly from the opening into the middlegame phase at Move ${middlegameMove}.
            </div>
          `}
        </div>

        <!-- Why ECO Codes Exist Explanation -->
        <div class="p-2.5 rounded" style="background: rgba(251, 191, 36, 0.08); border: 1px dashed rgba(245, 158, 11, 0.4);">
          <div class="d-flex align-items-center gap-1.5 mb-1">
            <i class="bi bi-lightbulb-fill text-warning"></i>
            <strong class="small fw-black text-warning text-uppercase" style="font-size: 11px;">What is an ECO Code?</strong>
          </div>
          <p class="small mb-0 text-body" style="font-size: 11.5px; line-height: 1.45;">
            ECO stands for <strong>Encyclopaedia of Chess Openings</strong>. It is an international 5-volume classification system (A00–E99) used by FIDE, Chess.com, and Lichess. Because openings have varied names across languages, ECO codes provide a universal, unambiguous catalog number to study master win rates, opening traps, and pawn structures.
          </p>
        </div>

        <!-- External Research Links -->
        <div class="pt-1">
          <span class="text-secondary small fw-bold text-uppercase d-block mb-1.5" style="font-size: 10px;">
            <i class="bi bi-box-arrow-up-right me-1"></i>Study Master Games in External Databases:
          </span>
          <div class="d-flex align-items-center gap-1.5 flex-wrap">
            <a href="${ecoMeta.links.chess365}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline-secondary comic-btn fw-bold flex-grow-1 py-1" style="font-size: 11px;">
              <i class="bi bi-database me-1"></i>365Chess (${insEscape(ecoMeta.code)})
            </a>
            <a href="${ecoMeta.links.lichess}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline-secondary comic-btn fw-bold flex-grow-1 py-1" style="font-size: 11px;">
              <i class="bi bi-globe me-1"></i>Lichess Explorer
            </a>
            <a href="${ecoMeta.links.chessCom}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline-secondary comic-btn fw-bold flex-grow-1 py-1" style="font-size: 11px;">
              <i class="bi bi-book me-1"></i>Chess.com Openings
            </a>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="mt-3 pt-2 border-top d-flex justify-content-end" style="border-color: var(--arcade-border) !important;">
        <button type="button" class="btn btn-sm btn-secondary comic-btn fw-bold px-3 py-1" id="btn-close-opening-modal-footer">
          Close
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  document.body.classList.add('modal-open');

  const safeClose = () => {
    modal.remove();
    document.body.classList.remove('modal-open');
  };

  modal.querySelector('#btn-close-opening-modal')?.addEventListener('click', safeClose);
  modal.querySelector('#btn-close-opening-modal-footer')?.addEventListener('click', safeClose);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) safeClose();
  });

  modal.querySelector('#btn-jump-opening-dev')?.addEventListener('click', (e) => {
    const ply = parseInt(e.currentTarget.getAttribute('data-dev-ply'), 10);
    safeClose();
    if (!isNaN(ply)) {
      dashboard.goToPly.bind(dashboard)(ply);
    }
  });

  const escHandler = (e) => {
    if (e.key === 'Escape') {
      safeClose();
      window.removeEventListener('keydown', escHandler);
    }
  };
  window.addEventListener('keydown', escHandler);
}
