/**
 * Positional Pillars Component & Guide Modal
 * Evaluates Material, Piece Activity, King Safety, and Pawn Structure.
 */

function buildPositionalPillarsHtml(fen) {
  if (typeof computePositionalPillars !== 'function' || !fen) return '';
  const p = computePositionalPillars(fen);
  const items = [
    { key: 'material', icon: '⚖️', title: 'Material', tipKey: 'pillar_material', data: p.material },
    { key: 'activity', icon: '⚡', title: 'Piece Activity', tipKey: 'pillar_activity', data: p.activity },
    { key: 'kingSafety', icon: '🛡️', title: 'King Safety', tipKey: 'pillar_king_safety', data: p.kingSafety },
    { key: 'pawnStructure', icon: '♟️', title: 'Pawn Structure', tipKey: 'pillar_pawn_structure', data: p.pawnStructure }
  ];

  return `
    <div class="d-flex align-items-center justify-content-between mb-1.5 px-1">
      <div class="d-flex align-items-center gap-1.5">
        <span class="small fw-black text-uppercase" style="font-size: 10px; letter-spacing: 0.5px;">
          <i class="bi bi-sliders me-1 text-info"></i>4-Pillar Positional X-Ray
        </span>
        <button type="button" class="btn btn-sm btn-link p-0 text-info fw-bold text-decoration-none d-inline-flex align-items-center gap-1" id="btn-pillars-guide" data-iq-tip="card_positional_pillars" title="Learn what these bars mean and how they are calculated">
          <i class="bi bi-info-circle-fill" style="font-size: 11px;"></i>
          <span class="d-none d-sm-inline" style="font-size: 10px; opacity: 0.9;">How it works</span>
        </button>
      </div>
      <span class="text-secondary font-monospace" style="font-size: 10px;">⚪ White vs ⚫ Black</span>
    </div>
    <div class="row g-1.5">
      ${items.map((it) => `
        <div class="col-6">
          <div class="p-1.5 rounded positional-pillar-card" data-iq-tip="${it.tipKey}" data-pillar-key="${it.key}" title="Click to view full calculation guide" style="background: var(--arcade-card-hover, rgba(0,0,0,0.03)); border: 1px solid var(--arcade-border);">
            <div class="d-flex align-items-center justify-content-between mb-1" style="font-size: 10px;">
              <span class="fw-bold d-flex align-items-center gap-1">
                <span>${it.icon}</span>
                <span class="text-truncate" style="max-width: 82px;">${it.title}</span>
                <i class="bi bi-question-circle text-secondary opacity-50" style="font-size: 9px;"></i>
              </span>
              <span class="font-monospace text-secondary fw-semibold">${insEscape(it.data.label)}</span>
            </div>
            <div class="positional-pillar-track" title="White: ${it.data.white}% vs Black: ${it.data.black}%">
              <div class="positional-pillar-white" style="width: ${it.data.white}%;"></div>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function bindPositionalPillarsEvents(dashboard, el) {
  if (!el || !dashboard) return;
  el.querySelector('#btn-pillars-guide')?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (typeof dashboard.openPillarsGuideModal === 'function') {
      dashboard.openPillarsGuideModal();
    } else {
      openPillarsGuideModal(dashboard);
    }
  });

  el.querySelectorAll('.positional-pillar-card').forEach((card) => {
    card.addEventListener('click', () => {
      const key = card.getAttribute('data-pillar-key');
      if (typeof dashboard.openPillarsGuideModal === 'function') {
        dashboard.openPillarsGuideModal(key);
      } else {
        openPillarsGuideModal(dashboard, key);
      }
    });
  });
}

function updatePositionalPillars(dashboard, fen) {
  if (!dashboard || !dashboard.container) return;
  const el = dashboard.container.querySelector('#positional-pillars-area');
  if (!el || typeof computePositionalPillars !== 'function') return;
  dashboard.lastRenderedFen = fen;
  el.innerHTML = typeof dashboard.buildPositionalPillarsHtml === 'function'
    ? dashboard.buildPositionalPillarsHtml(fen)
    : buildPositionalPillarsHtml(fen);
  if (typeof dashboard.bindPositionalPillarsEvents === 'function') {
    dashboard.bindPositionalPillarsEvents(el);
  } else {
    bindPositionalPillarsEvents(dashboard, el);
  }
}

function closePillarsGuideModal() {
  const existing = document.getElementById('positional-pillars-modal');
  if (existing) existing.remove();
  document.body.classList.remove('modal-open');
}

function openPillarsGuideModal(dashboard, activeKey = null) {
  closePillarsGuideModal();
  if (!dashboard) return;

  const fen = dashboard.lastRenderedFen || (dashboard.board ? dashboard.board.fen : null);
  const p = typeof computePositionalPillars === 'function' && fen ? computePositionalPillars(fen) : null;
  const curMove = dashboard.game && dashboard.currentPly > 0 ? dashboard.game.moves[dashboard.currentPly - 1] : null;
  const moveInfo = curMove ? `Move ${Math.ceil(dashboard.currentPly / 2)}${curMove.color === 'b' ? '...' : '.'} ${curMove.san}` : 'Current Position';

  const modal = document.createElement('div');
  modal.className = 'why-modal-backdrop';
  modal.id = 'positional-pillars-modal';

  const pillars = [
    {
      key: 'activity',
      icon: '⚡',
      title: 'Piece Activity & Board Control',
      badge: 'DYNAMIC MOBILITY',
      badgeClass: 'bg-warning text-dark',
      summary: 'Measures how actively pieces are deployed across the chessboard and how much territory they dominate.',
      why: 'Pieces stuck on back ranks or corners have low mobility. Active pieces control key squares, restrict enemy pieces to passive defense, and create unstoppable tactical combinations.',
      liveData: p?.activity,
      calculation: [
        {
          label: 'Square Influence Count',
          text: 'Counts the total number of squares currently attacked, protected, or reachable by each side\'s pieces across all 64 squares.'
        },
        {
          label: '1.5× Center Dominance Multiplier',
          text: 'Squares located in the central 4×4 box (c3–f6, including d4, e4, d5, e5) receive a 1.5× multiplier bonus. Central real estate is strategically paramount because pieces in the center can swiftly pivot to either wing.'
        },
        {
          label: 'Tug-of-War Balance Ratio',
          text: 'Calculates the difference between White\'s weighted square attacks and Black\'s, converting it into a 0–100% comparative split (scaled with a 0.85 factor centered at 50%).'
        }
      ],
      tip: 'Develop knights toward the center (e.g. Nf3/Nc3, not Nh3/Na3) and open diagonal highways for your bishops early in the opening.'
    },
    {
      key: 'kingSafety',
      icon: '🛡️',
      title: 'King Safety & Shelter',
      badge: 'ATTACK ZONE SECURITY',
      badgeClass: 'bg-danger text-white',
      summary: 'Evaluates the defensive resilience of each king against opponent tactical invasions, checks, and mating nets.',
      why: 'King safety supersedes all other advantages. Even if you are up a queen in material, having an exposed king will lead to checkmate or devastating double attacks.',
      liveData: p?.kingSafety,
      calculation: [
        {
          label: 'Baseline Fortress Score (78 pts)',
          text: 'Both kings begin with a baseline safety score of 78 points.'
        },
        {
          label: '+12 Points Castled Bonus',
          text: 'Kings castled behind a pawn wall to the safety of the corners (g1 or c1 for White, g8 or c8 for Black) receive a +12 point castle bonus.'
        },
        {
          label: '−9 Points per King Ring Attacker',
          text: 'Evaluates the 3×3 "King Ring" (the king\'s square and all 8 surrounding neighbor squares). Every enemy piece exerting an attack on any square in this ring subtracts 9 points from the king\'s safety score.'
        },
        {
          label: 'Score Clamping & Tug-of-War',
          text: 'Raw safety scores are clamped between 10 (mating danger) and 98 (impenetrable fortress). The relative difference is mapped onto the 0–100% White vs Black balance bar.'
        }
      ],
      tip: 'Castle within the first 10 moves. Never advance pawns directly in front of your castled king unless forced, as pawn moves create permanent holes.'
    },
    {
      key: 'material',
      icon: '⚖️',
      title: 'Material Balance',
      badge: 'PIECE VALUE COUNT',
      badgeClass: 'bg-primary text-white',
      summary: 'The total fighting force and piece point valuation remaining on the board.',
      why: 'Material superiority is the most reliable path to victory. Being ahead in material lets you force piece simplifications into an easily winning endgame.',
      liveData: p?.material,
      calculation: [
        {
          label: 'Standard Piece Values',
          text: 'Pawn = 1.0 · Knight = 3.0 · Bishop = 3.15 · Rook = 5.0 · Queen = 9.0 points.'
        },
        {
          label: '+0.5 Bishop Pair Bonus',
          text: 'Holding both light- and dark-squared bishops grants an extra +0.5 point bonus for long-range complementary diagonal control.'
        },
        {
          label: 'Advantage Bar',
          text: 'The net difference between White and Black material is scaled into the balance percentage and displayed with the exact point lead (e.g., White +2).'
        }
      ],
      tip: 'When ahead in material, trade pieces (queens, rooks, minor pieces) to extinguish counterplay, but keep pawns on the board to promote.'
    },
    {
      key: 'pawnStructure',
      icon: '♟️',
      title: 'Pawn Structure Health',
      badge: 'CHAIN INTEGRITY',
      badgeClass: 'bg-secondary text-white',
      summary: 'Analyzes the compactness, cohesion, and vulnerability of the pawn skeleton.',
      why: 'Pawns can never move backwards. Every pawn weakness—such as doubled or isolated pawns—remains a permanent target for enemy rooks and knights to exploit.',
      liveData: p?.pawnStructure,
      calculation: [
        {
          label: '−12 Points Doubled Pawns Penalty',
          text: 'Deducts 12 points for each additional pawn stacked vertically on the same column (file). Stacked pawns block each other\'s movement and cannot defend one another.'
        },
        {
          label: '−8 Points Isolated Pawns Penalty',
          text: 'Deducts 8 points for any pawn with zero friendly pawns on adjacent files. Isolated pawns require babysitting by heavy pieces and cannot be defended by fellow pawns.'
        },
        {
          label: 'Comparative Cleanliness',
          text: 'The structural health scores of both sides are balanced against each other to compute the percentage bar (e.g., White Cleaner).'
        }
      ],
      tip: 'Keep your pawn chains connected. Avoid creating doubled or isolated pawns unless you get open files or active attacking piece play in return.'
    }
  ];

  modal.innerHTML = `
    <div class="why-dialog p-3 p-md-4 shadow-lg" style="max-width: 760px; width: 100%; border-radius: 1.25rem; background: var(--arcade-card); border: 1.5px solid var(--arcade-border);">
      <!-- Modal Header -->
      <div class="d-flex align-items-center justify-content-between pb-2.5 mb-3 border-bottom" style="border-color: var(--arcade-border) !important;">
        <div class="d-flex align-items-center gap-2">
          <span class="badge bg-info text-dark border border-dark px-2.5 py-1.5 fw-black">
            <i class="bi bi-sliders me-1"></i>4-PILLAR POSITIONAL X-RAY
          </span>
          <span class="text-secondary small fw-bold d-none d-sm-inline">How Metrics Are Calculated</span>
        </div>
        <button type="button" class="btn-close" id="pillars-modal-close" aria-label="Close"></button>
      </div>

      <!-- Tug of War Visual Guide Box -->
      <div class="p-3 rounded mb-3" style="background: var(--arcade-card-hover, rgba(0,0,0,0.03)); border: 1px solid var(--arcade-border);">
        <div class="d-flex align-items-center justify-content-between mb-1.5 flex-wrap gap-1">
          <span class="fw-bold small d-flex align-items-center gap-1.5">
            <i class="bi bi-info-circle-fill text-info"></i>
            How the Tug-of-War Balance Bars Work
          </span>
          ${p ? `<span class="badge bg-body-secondary text-secondary font-monospace" style="font-size: 10px;">${insEscape(moveInfo)}</span>` : ''}
        </div>
        <p class="small text-secondary mb-2" style="font-size: 11.5px; line-height: 1.45;">
          Each bar measures the real-time strategic balance between <strong>⚪ White</strong> and <strong>⚫ Black</strong>:
        </p>
        <div class="positional-pillar-track mb-1.5" style="height: 10px;">
          <div class="positional-pillar-white" style="width: 50%;"></div>
        </div>
        <div class="d-flex justify-content-between font-monospace text-secondary" style="font-size: 10.5px;">
          <span>⚪ 0% (Black Dominates)</span>
          <span class="fw-bold text-body">50% (Equal / Balanced)</span>
          <span>(White Dominates) 100% ⚫</span>
        </div>
      </div>

      <!-- Pillar Detailed Cards List -->
      <div class="d-flex flex-column gap-3" id="pillars-list-container">
        ${pillars.map((pil) => {
          const isTarget = activeKey === pil.key;
          return `
            <div class="p-3 rounded ${isTarget ? 'pillar-guide-highlight' : ''}" id="pillar-card-${pil.key}" style="background: var(--arcade-card); border: 1.5px solid ${isTarget ? '#38bdf8' : 'var(--arcade-border)'}; transition: border-color 0.2s ease, box-shadow 0.2s ease;">
              <!-- Pillar Header Row -->
              <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2 pb-2 border-bottom" style="border-color: var(--arcade-border) !important;">
                <div class="d-flex align-items-center gap-2">
                  <span class="fs-5">${pil.icon}</span>
                  <h6 class="fw-black mb-0 text-body" style="font-size: 14px;">${insEscape(pil.title)}</h6>
                  <span class="badge ${pil.badgeClass} font-monospace" style="font-size: 9px;">${insEscape(pil.badge)}</span>
                </div>
                ${pil.liveData ? `
                  <div class="d-flex align-items-center gap-1.5 font-monospace small">
                    <span class="text-secondary" style="font-size: 11px;">Current:</span>
                    <span class="badge bg-secondary-subtle text-body border border-secondary-subtle fw-bold" style="font-size: 11px;">
                      ${insEscape(pil.liveData.label)} (${pil.liveData.white}% White)
                    </span>
                  </div>
                ` : ''}
              </div>

              <!-- What & Why Summary -->
              <div class="mb-2.5">
                <div class="small mb-1 text-body" style="font-size: 12px; line-height: 1.45;">
                  <strong class="text-warning">What it means:</strong> ${insEscape(pil.summary)}
                </div>
                <div class="small text-secondary" style="font-size: 11.5px; line-height: 1.4;">
                  <strong class="text-info">Strategic Importance:</strong> ${insEscape(pil.why)}
                </div>
              </div>

              <!-- How it is Calculated Details -->
              <div class="p-2.5 rounded mb-2.5" style="background: var(--arcade-card-hover, rgba(0,0,0,0.02)); border: 1px solid var(--arcade-border);">
                <div class="small fw-bold text-success mb-1.5 d-flex align-items-center gap-1" style="font-size: 11px;">
                  <i class="bi bi-calculator-fill"></i>
                  <span>HOW IT IS CALCULATED:</span>
                </div>
                <ul class="list-unstyled mb-0 d-flex flex-column gap-1.5" style="font-size: 11px; line-height: 1.4;">
                  ${pil.calculation.map((c) => `
                    <li class="d-flex align-items-start gap-1.5">
                      <i class="bi bi-check-circle-fill text-success mt-0.5" style="font-size: 10px; flex-shrink: 0;"></i>
                      <div>
                        <strong>${insEscape(c.label)}:</strong>
                        <span class="text-secondary">${insEscape(c.text)}</span>
                      </div>
                    </li>
                  `).join('')}
                </ul>
              </div>

              <!-- Pro Tip -->
              <div class="small text-body-secondary d-flex align-items-center gap-1.5 pt-1 fst-italic" style="font-size: 11px;">
                <i class="bi bi-lightbulb-fill text-warning flex-shrink-0"></i>
                <span><strong>Coach Tip:</strong> ${insEscape(pil.tip)}</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Footer -->
      <div class="pt-3 mt-3 border-top d-flex justify-content-between align-items-center flex-wrap gap-2" style="border-color: var(--arcade-border) !important;">
        <span class="small text-secondary" style="font-size: 11px;">
          <i class="bi bi-cpu me-1 text-info"></i>Evaluated via hybrid attack maps & Stockfish positional heuristics.
        </span>
        <button type="button" class="btn btn-sm btn-outline-secondary comic-btn px-4 fw-bold" id="pillars-modal-ok-btn">
          Got It
        </button>
      </div>
    </div>
  `;

  const closeModal = () => {
    modal.remove();
    document.removeEventListener('keydown', handleKeyDown);
    document.body.classList.remove('modal-open');
  };

  const dialogEl = modal.querySelector('.why-dialog');
  const safeClose = typeof setupModalSwipeAndHistory === 'function'
    ? setupModalSwipeAndHistory(modal, dialogEl, closeModal)
    : closeModal;

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      safeClose();
    }
  };
  document.addEventListener('keydown', handleKeyDown);

  modal.querySelector('#pillars-modal-close')?.addEventListener('click', safeClose);
  modal.querySelector('#pillars-modal-ok-btn')?.addEventListener('click', safeClose);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      safeClose();
    }
  });

  document.body.classList.add('modal-open');
  document.body.appendChild(modal);

  if (activeKey) {
    setTimeout(() => {
      modal.querySelector(`#pillar-card-${activeKey}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);
  }
}
