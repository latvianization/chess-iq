/**
 * Full Game Performance & Executive Report Modal
 * Phase Elos, accuracy breakdown, move classification, time management audit, and motifs.
 */

function closeFullReportModal() {
  const existing = document.getElementById('review-detailed-modal');
  if (existing) existing.remove();
  document.body.classList.remove('modal-open');
}

function closeDetailedPerformanceModal() {
  closeFullReportModal();
}

function buildDetailedPerformanceHtml(dashboard) {
  if (!dashboard || !dashboard.game) return '';
  const userColor = dashboard.game.userColor || 'w';
  const isWhiteUser = userColor === 'w';

  const userAcc = Number(dashboard.game.userAccuracy ?? dashboard.game.accuracy ?? dashboard.game.overallAccuracy ?? 85).toFixed(1);
  const oppAcc = Number(dashboard.game.opponentAccuracy ?? 85).toFixed(1);

  const userPhases = dashboard.game.userPhaseElos || dashboard.game.phaseElos || {};
  const oppPhases = dashboard.game.opponentPhaseElos || {};

  const userPhaseAcc = dashboard.game.userPhaseAccuracy || {};
  const oppPhaseAcc = dashboard.game.opponentPhaseAccuracy || {};

  const userOpeningAcc = userPhaseAcc.opening !== null && userPhaseAcc.opening !== undefined ? `${userPhaseAcc.opening}%` : '—';
  const userMiddleAcc = userPhaseAcc.middlegame !== null && userPhaseAcc.middlegame !== undefined ? `${userPhaseAcc.middlegame}%` : '—';
  const userEndAcc = userPhaseAcc.endgame !== null && userPhaseAcc.endgame !== undefined ? `${userPhaseAcc.endgame}%` : '—';

  const oppOpeningAcc = oppPhaseAcc.opening !== null && oppPhaseAcc.opening !== undefined ? `${oppPhaseAcc.opening}%` : '—';
  const oppMiddleAcc = oppPhaseAcc.middlegame !== null && oppPhaseAcc.middlegame !== undefined ? `${oppPhaseAcc.middlegame}%` : '—';
  const oppEndAcc = oppPhaseAcc.endgame !== null && oppPhaseAcc.endgame !== undefined ? `${oppPhaseAcc.endgame}%` : '—';

  const userOpeningElo = userPhases.opening ?? 1500;
  const userMiddlegameElo = userPhases.middlegame ?? 1500;
  const userEndgameElo = userPhases.endgame ?? 1500;

  const oppOpeningElo = oppPhases.opening ?? 1500;
  const oppMiddlegameElo = oppPhases.middlegame ?? 1500;
  const oppEndgameElo = oppPhases.endgame ?? 1500;

  return `
    <!-- Dual Accuracy Comparison -->
    <div class="row g-2 mb-2">
      <div class="col-6">
        <div class="arcade-stat-chip p-2 text-start cursor-help" data-iq-tip="stat_accuracy">
          <div class="d-flex align-items-center justify-content-between mb-1">
            <span class="fw-bold text-truncate" style="font-size: 11px;">${isWhiteUser ? '⚪ White' : '⚫ Black'} (You)</span>
            <span class="badge bg-success text-white font-monospace fw-black px-1.5 py-0.5 rounded-pill" style="font-size: 9px;">YOU</span>
          </div>
          <div class="d-flex align-items-baseline gap-1.5">
            <span class="fw-black fs-4 text-emerald font-monospace">${userAcc}%</span>
            <span class="small fw-bold text-uppercase" style="font-size: 10px; color: var(--arcade-text-muted);">Accuracy</span>
          </div>
        </div>
      </div>
      <div class="col-6">
        <div class="arcade-stat-chip p-2 text-start cursor-help" data-iq-tip="stat_accuracy">
          <div class="d-flex align-items-center justify-content-between mb-1">
            <span class="fw-bold text-truncate" style="font-size: 11px;">${isWhiteUser ? '⚫ Black' : '⚪ White'}</span>
            <span class="badge bg-primary text-white font-monospace fw-black px-1.5 py-0.5 rounded-pill" style="font-size: 9px;">OPP</span>
          </div>
          <div class="d-flex align-items-baseline gap-1.5">
            <span class="fw-black fs-4 text-cyan font-monospace">${oppAcc}%</span>
            <span class="small fw-bold text-uppercase" style="font-size: 10px; color: var(--arcade-text-muted);">Accuracy</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Phase Rating & Accuracy Comparison (Opening, Middle, Endgame) -->
    <div class="row g-1.5 text-center mb-2">
      <div class="col-4">
        <div class="arcade-stat-chip p-1.5 cursor-help" data-iq-tip="phase_opening">
          <span class="small d-block fw-black mb-1 text-uppercase" style="font-size: 10.5px; letter-spacing: 0.5px;"><i class="bi bi-compass me-1 text-primary"></i>Opening</span>
          <div class="d-flex justify-content-around align-items-center">
            <div class="text-center">
              <span class="d-block text-warning fw-black" style="font-size: 9px;">YOU</span>
              <span class="fw-black fs-6 text-primary font-monospace d-block">${userOpeningAcc}</span>
              <span class="badge phase-elo-chip font-monospace mt-0.5" style="font-size: 9.5px;" title="Opening Phase Rating">${userOpeningElo} Elo</span>
            </div>
            <div class="vr opacity-25 my-auto" style="height: 32px;"></div>
            <div class="text-center">
              <span class="d-block text-cyan fw-black" style="font-size: 9px;">OPP</span>
              <span class="fw-black fs-6 text-cyan font-monospace d-block">${oppOpeningAcc}</span>
              <span class="badge phase-elo-chip font-monospace mt-0.5" style="font-size: 9.5px;" title="Opponent Opening Phase Rating">${oppOpeningElo} Elo</span>
            </div>
          </div>
        </div>
      </div>
      <div class="col-4">
        <div class="arcade-stat-chip p-1.5 cursor-help" data-iq-tip="phase_middle">
          <span class="small d-block fw-black mb-1 text-uppercase" style="font-size: 10.5px; letter-spacing: 0.5px;"><i class="bi bi-shield-shaded me-1 text-warning"></i>Middle</span>
          <div class="d-flex justify-content-around align-items-center">
            <div class="text-center">
              <span class="d-block text-warning fw-black" style="font-size: 9px;">YOU</span>
              <span class="fw-black fs-6 text-warning font-monospace d-block">${userMiddleAcc}</span>
              <span class="badge phase-elo-chip font-monospace mt-0.5" style="font-size: 9.5px;" title="Middlegame Phase Rating">${userMiddlegameElo} Elo</span>
            </div>
            <div class="vr opacity-25 my-auto" style="height: 32px;"></div>
            <div class="text-center">
              <span class="d-block text-cyan fw-black" style="font-size: 9px;">OPP</span>
              <span class="fw-black fs-6 text-cyan font-monospace d-block">${oppMiddleAcc}</span>
              <span class="badge phase-elo-chip font-monospace mt-0.5" style="font-size: 9.5px;" title="Opponent Middlegame Phase Rating">${oppMiddlegameElo} Elo</span>
            </div>
          </div>
        </div>
      </div>
      <div class="col-4">
        <div class="arcade-stat-chip p-1.5 cursor-help" data-iq-tip="phase_endgame">
          <span class="small d-block fw-black mb-1 text-uppercase" style="font-size: 10.5px; letter-spacing: 0.5px;"><i class="bi bi-flag-fill me-1 text-success"></i>Endgame</span>
          <div class="d-flex justify-content-around align-items-center">
            <div class="text-center">
              <span class="d-block text-warning fw-black" style="font-size: 9px;">YOU</span>
              <span class="fw-black fs-6 text-success font-monospace d-block">${userEndAcc}</span>
              <span class="badge phase-elo-chip font-monospace mt-0.5" style="font-size: 9.5px;" title="Endgame Phase Rating">${userEndgameElo} Elo</span>
            </div>
            <div class="vr opacity-25 my-auto" style="height: 32px;"></div>
            <div class="text-center">
              <span class="d-block text-cyan fw-black" style="font-size: 9px;">OPP</span>
              <span class="fw-black fs-6 text-cyan font-monospace d-block">${oppEndAcc}</span>
              <span class="badge phase-elo-chip font-monospace mt-0.5" style="font-size: 9.5px;" title="Opponent Endgame Phase Rating">${oppEndgameElo} Elo</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Move Classification Breakdown (Player vs Opponent) -->
    <div class="border-top pt-2">
      <div class="d-flex align-items-center justify-content-between px-2 pb-1" style="font-size: 10.5px; font-weight: 800; letter-spacing: 0.5px;">
        <span style="width: 42px;" class="text-end text-warning fw-black">YOU</span>
        <span class="text-uppercase fw-bold" style="color: var(--arcade-text-muted);">MOVE QUALITY</span>
        <span style="width: 42px;" class="text-start text-cyan fw-black">OPP</span>
      </div>
      <div class="d-flex flex-column gap-1">
        ${(typeof dashboard.buildBadgesSummary === 'function' ? dashboard.buildBadgesSummary() : buildBadgesSummary(dashboard))}
      </div>
    </div>
  `;
}

function openDetailedPerformanceModal(dashboard) {
  openFullReportModal(dashboard);
}

function openFullReportModal(dashboard) {
  if (!dashboard || !dashboard.game) return;
  closeFullReportModal();
  const userColor = dashboard.game.userColor || 'w';
  const isWhiteUser = userColor === 'w';

  const whiteName = insEscape(dashboard.game.white || 'White');
  const blackName = insEscape(dashboard.game.black || 'Black');
  const whiteElo = dashboard.game.whiteElo || 1500;
  const blackElo = dashboard.game.blackElo || 1500;

  const userAcc = Number(dashboard.game.userAccuracy ?? dashboard.game.accuracy ?? dashboard.game.overallAccuracy ?? 85).toFixed(1);
  const oppAcc = Number(dashboard.game.opponentAccuracy ?? 85).toFixed(1);
  const whiteAcc = isWhiteUser ? userAcc : oppAcc;
  const blackAcc = isWhiteUser ? oppAcc : userAcc;

  const userGameElo = dashboard.game.userGameElo || dashboard.game.overallGameElo || (isWhiteUser ? whiteElo : blackElo);
  const oppGameElo = dashboard.game.oppGameElo || dashboard.game.opponentGameElo || (isWhiteUser ? blackElo : whiteElo);
  const whiteGameElo = isWhiteUser ? userGameElo : oppGameElo;
  const blackGameElo = isWhiteUser ? oppGameElo : userGameElo;

  const userPhases = dashboard.game.userPhaseElos || dashboard.game.phaseElos || {};
  const oppPhases = dashboard.game.opponentPhaseElos || {};
  const userPhaseAcc = dashboard.game.userPhaseAccuracy || {};
  const oppPhaseAcc = dashboard.game.opponentPhaseAccuracy || {};

  const whitePhaseAcc = isWhiteUser ? userPhaseAcc : oppPhaseAcc;
  const blackPhaseAcc = isWhiteUser ? oppPhaseAcc : userPhaseAcc;
  const whitePhaseElos = isWhiteUser ? userPhases : oppPhases;
  const blackPhaseElos = isWhiteUser ? oppPhases : userPhases;

  const whiteOpeningAcc = whitePhaseAcc.opening !== null && whitePhaseAcc.opening !== undefined ? `${whitePhaseAcc.opening}%` : '—';
  const whiteMiddleAcc = whitePhaseAcc.middlegame !== null && whitePhaseAcc.middlegame !== undefined ? `${whitePhaseAcc.middlegame}%` : '—';
  const whiteEndAcc = whitePhaseAcc.endgame !== null && whitePhaseAcc.endgame !== undefined ? `${whitePhaseAcc.endgame}%` : '—';

  const blackOpeningAcc = blackPhaseAcc.opening !== null && blackPhaseAcc.opening !== undefined ? `${blackPhaseAcc.opening}%` : '—';
  const blackMiddleAcc = blackPhaseAcc.middlegame !== null && blackPhaseAcc.middlegame !== undefined ? `${blackPhaseAcc.middlegame}%` : '—';
  const blackEndAcc = blackPhaseAcc.endgame !== null && blackPhaseAcc.endgame !== undefined ? `${blackPhaseAcc.endgame}%` : '—';

  const whiteOpeningElo = whitePhaseElos.opening ?? whiteElo;
  const whiteMiddleElo = whitePhaseElos.middlegame ?? whiteElo;
  const whiteEndElo = whitePhaseElos.endgame ?? whiteElo;

  const blackOpeningElo = blackPhaseElos.opening ?? blackElo;
  const blackMiddleElo = blackPhaseElos.middlegame ?? blackElo;
  const blackEndElo = blackPhaseElos.endgame ?? blackElo;

  const getAccuracyTier = (acc) => {
    const n = parseFloat(acc);
    if (n >= 96) return { label: 'Grandmaster Precision', color: '#10b981', icon: '💎' };
    if (n >= 88) return { label: 'Master Execution', color: '#06b6d4', icon: '⭐' };
    if (n >= 80) return { label: 'Solid Tactical Play', color: '#fbbf24', icon: '🎯' };
    if (n >= 70) return { label: 'Fighting Game', color: '#f59e0b', icon: '⚔️' };
    return { label: 'Volatile Battle', color: '#f43f5e', icon: '🌪️' };
  };

  const whiteTier = getAccuracyTier(whiteAcc);
  const blackTier = getAccuracyTier(blackAcc);

  let resTitle = 'Match Drawn (½-½)';
  let whiteBadge = '<span class="badge bg-secondary font-monospace fw-bold px-2 py-1">DRAW</span>';
  let blackBadge = '<span class="badge bg-secondary font-monospace fw-bold px-2 py-1">DRAW</span>';
  if (dashboard.game.result === '1-0') {
    resTitle = `${whiteName} Won (1-0)`;
    whiteBadge = '<span class="badge bg-success text-white font-monospace fw-black px-2 py-1">VICTORY</span>';
    blackBadge = '<span class="badge bg-danger text-white font-monospace fw-black px-2 py-1">DEFEAT</span>';
  } else if (dashboard.game.result === '0-1') {
    resTitle = `${blackName} Won (0-1)`;
    whiteBadge = '<span class="badge bg-danger text-white font-monospace fw-black px-2 py-1">DEFEAT</span>';
    blackBadge = '<span class="badge bg-success text-white font-monospace fw-black px-2 py-1">VICTORY</span>';
  }

  let userCounts = dashboard.game.userCounts;
  let oppCounts = dashboard.game.opponentCounts;
  if (!userCounts || !oppCounts) {
    userCounts = {};
    oppCounts = {};
    (dashboard.game.plies || []).forEach((p) => {
      if (!p) return;
      const isUser = p.color ? (p.color === userColor) : (p.ply % 2 === (userColor === 'w' ? 1 : 0));
      const target = isUser ? userCounts : oppCounts;
      target[p.classification] = (target[p.classification] || 0) + 1;
    });
  }
  const whiteCounts = isWhiteUser ? userCounts : oppCounts;
  const blackCounts = isWhiteUser ? oppCounts : userCounts;

  const totalPlies = (dashboard.game.plies || []).length;
  const totalMoves = Math.ceil(totalPlies / 2);
  const whiteMovesCount = (dashboard.game.plies || []).filter((p) => p && p.color === 'w').length || 1;
  const blackMovesCount = (dashboard.game.plies || []).filter((p) => p && p.color === 'b').length || 1;

  const whiteOptCount = (whiteCounts.brilliant || 0) + (whiteCounts.great || 0) + (whiteCounts.best || 0);
  const blackOptCount = (blackCounts.brilliant || 0) + (blackCounts.great || 0) + (blackCounts.best || 0);
  const whiteErrCount = (whiteCounts.inaccuracy || 0) + (whiteCounts.mistake || 0) + (whiteCounts.blunder || 0) + (whiteCounts.missed_win || 0);
  const blackErrCount = (blackCounts.inaccuracy || 0) + (blackCounts.mistake || 0) + (blackCounts.blunder || 0) + (blackCounts.missed_win || 0);

  const tp = dashboard.game.turningPoint;
  const od = dashboard.game.openingDeviation;

  // Critical user mistakes
  const userMistakes = (dashboard.game.plies || [])
    .filter((p) => p && p.color === userColor && ['blunder', 'missed_win', 'mistake', 'inaccuracy'].includes(p.classification))
    .sort((a, b) => {
      const dropA = Math.abs((a.winProbBefore ?? 0.5) - (a.winProb ?? 0.5));
      const dropB = Math.abs((b.winProbBefore ?? 0.5) - (b.winProb ?? 0.5));
      return dropB - dropA;
    });

  // Time & Clock Stats
  let whiteTimeTotal = 0, whiteTimeMoves = 0;
  let blackTimeTotal = 0, blackTimeMoves = 0;
  let fastestMove = null, slowestMove = null;
  let timeTroubleCount = 0, impulsiveCount = 0;

  (dashboard.game.plies || []).forEach((p) => {
    if (!p) return;
    if (typeof p.timeSpent === 'number' && p.timeSpent > 0) {
      if (p.color === 'w') {
        whiteTimeTotal += p.timeSpent;
        whiteTimeMoves++;
      } else {
        blackTimeTotal += p.timeSpent;
        blackTimeMoves++;
      }
      if (!fastestMove || p.timeSpent < fastestMove.timeSpent) fastestMove = p;
      if (!slowestMove || p.timeSpent > slowestMove.timeSpent) slowestMove = p;
    }
    if (p.isTimeTrouble) timeTroubleCount++;
    if (p.isImpulsive) impulsiveCount++;
  });

  const whiteAvgTime = whiteTimeMoves > 0 ? (whiteTimeTotal / whiteTimeMoves).toFixed(1) + 's' : null;
  const blackAvgTime = blackTimeMoves > 0 ? (blackTimeTotal / blackTimeMoves).toFixed(1) + 's' : null;

  // Tactical Motifs
  const motifMap = {};
  (dashboard.game.plies || []).forEach((p) => {
    if (!p || !Array.isArray(p.motifs)) return;
    p.motifs.forEach((m) => {
      const key = m.label || m.name || m;
      if (!motifMap[key]) {
        motifMap[key] = { label: key, count: 0, icon: m.icon || '⚡', coachTip: m.coachTip || '' };
      }
      motifMap[key].count++;
    });
  });
  const detectedMotifs = Object.values(motifMap).sort((a, b) => b.count - a.count);

  // Dynamic executive narrative
  let executiveNarrative = `A dynamic match fought in the <strong>${insEscape(dashboard.game.ecoName || dashboard.game.ecoCode || 'standard lines')}</strong>. `;
  if (dashboard.game.result === '1-0') {
    executiveNarrative += isWhiteUser
      ? `You seized the initiative with ${whiteAcc}% accuracy, converting your advantage to claim victory in ${totalMoves} moves.`
      : `White played with strong precision (${whiteAcc}%), leveraging critical tactical turns to seal victory in ${totalMoves} moves.`;
  } else if (dashboard.game.result === '0-1') {
    executiveNarrative += !isWhiteUser
      ? `You navigated key complications with ${blackAcc}% accuracy, outplaying White to secure victory in ${totalMoves} moves.`
      : `Black demonstrated clinical accuracy (${blackAcc}%), capitalizing on open lines to achieve victory in ${totalMoves} moves.`;
  } else {
    executiveNarrative += `Both sides battled to a hard-fought draw with well-matched accuracy (${whiteAcc}% White vs ${blackAcc}% Black) over ${totalMoves} moves.`;
  }

  // Coach Study Plan stats
  const summary = dashboard.game.gameCoachSummary || {};
  const bankStats = typeof getBlunderBankStats === 'function' ? getBlunderBankStats() : { total: 0, due: 0 };
  let priorityTitle = 'Solid Positional Consistency';
  let priorityDesc = 'You played a clean game with very few tactical oversights. Use Guess-the-Move mode to sharpen your grandmaster calculation!';
  let priorityIcon = '🏆';

  if (summary.topMotifId && typeof TACTICAL_MOTIF_CATALOG !== 'undefined' && TACTICAL_MOTIF_CATALOG[summary.topMotifId]) {
    const cat = TACTICAL_MOTIF_CATALOG[summary.topMotifId];
    priorityIcon = cat.icon;
    priorityTitle = `Pattern Alert: ${cat.label} (${summary.topMotifCount}× in this game)`;
    priorityDesc = cat.coachTip;
  } else if ((dashboard.game.impulsiveBlunders || 0) >= 1) {
    priorityIcon = '⚡';
    priorityTitle = `Clock Discipline: ${dashboard.game.impulsiveBlunders} Rushed Mistake${dashboard.game.impulsiveBlunders > 1 ? 's' : ''}`;
    priorityDesc = 'You played critical mistakes in under 2 seconds despite having plenty of clock time. Take a deep breath and sit on your hands for 5 seconds before capturing or responding to threats!';
  } else if (summary.weakestPhase && summary.weakestPhaseAcc < 78) {
    priorityIcon = '📉';
    const phCap = summary.weakestPhase.charAt(0).toUpperCase() + summary.weakestPhase.slice(1);
    priorityTitle = `${phCap} Precision (${summary.weakestPhaseAcc}% Accuracy)`;
    priorityDesc = `Your accuracy dipped most during the ${summary.weakestPhase}. Practice critical transitions from this phase against an Elo-matched bot!`;
  } else if (userMistakes.length > 0) {
    priorityIcon = '🎯';
    priorityTitle = `Tactical Calculation (${userMistakes.length} Key Error${userMistakes.length > 1 ? 's' : ''})`;
    priorityDesc = 'Re-play your mistakes on the board right now in puzzle workout mode to build muscle memory for the correct tactical continuation.';
  }

  const modal = document.createElement('div');
  modal.id = 'review-detailed-modal';
  modal.className = 'why-modal-backdrop';
  modal.innerHTML = `
    <div class="why-dialog full-report-dialog comic-card p-3 p-sm-4 shadow-2xl" style="max-width: 980px; width: 100%; max-height: min(94vh, 920px); overflow-y: auto;">
      <!-- 1. Report Header & Utility Actions -->
      <div class="d-flex align-items-center justify-content-between pb-2 mb-3 border-bottom flex-wrap gap-2" style="border-color: var(--arcade-border) !important;">
        <div class="d-flex align-items-center gap-2 flex-wrap min-w-0">
          <span class="badge bg-warning text-dark font-monospace fw-black px-2.5 py-1.5 fs-6">
            <i class="bi bi-file-earmark-bar-graph-fill me-1.5"></i>Full Game Report
          </span>
          <button type="button" class="eco-interactive-btn cursor-pointer" id="btn-report-open-eco" data-iq-tip="eco_opening" title="Click to view Opening theory & ECO details">
            <span class="badge bg-secondary font-monospace eco-code-badge">${dashboard.game.ecoCode || 'PGN'}</span>
            <span class="fw-black text-truncate eco-name-label" style="max-width: 280px; font-size: 14px;">${insEscape(dashboard.game.ecoName || 'Chess Match')}</span>
            <i class="bi bi-info-circle text-secondary" style="font-size: 11px;"></i>
          </button>
        </div>
        <div class="d-flex align-items-center gap-1.5 no-print flex-shrink-0">
          <button type="button" class="btn btn-sm btn-outline-warning comic-btn fw-bold px-2.5 py-1" id="btn-report-share" title="Share Game Review Link">
            <i class="bi bi-share-fill me-1"></i>Share Link
          </button>
          <button type="button" class="btn btn-sm btn-outline-secondary comic-btn fw-bold px-2.5 py-1" id="btn-report-copy" title="Copy Full Report Summary to Clipboard">
            <i class="bi bi-clipboard-check me-1"></i>Copy Summary
          </button>
          <button type="button" class="btn btn-sm btn-dark comic-btn py-1 px-2.5 fw-bold" id="btn-close-perf-modal" title="Close Report">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
      </div>

      <!-- Metadata Strip -->
      <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 p-2 rounded mb-3" style="background: var(--arcade-card-hover, rgba(0,0,0,0.03)); border: 1px solid var(--arcade-border); font-size: 11.5px;">
        <div class="d-flex align-items-center gap-2 flex-wrap">
          <span><i class="bi bi-calendar3 me-1 text-secondary"></i><strong class="font-monospace">${dashboard.game.date || 'Recent Match'}</strong></span>
          <span class="text-secondary opacity-50">·</span>
          ${dashboard.game.isBotGame ? `
            <span><i class="bi bi-robot me-1 text-secondary"></i><strong class="font-monospace">Untimed</strong></span>
          ` : `
            <span><i class="bi bi-stopwatch me-1 text-secondary"></i><strong class="font-monospace">${dashboard.game.timeControl || 'Standard'}</strong></span>
          `}
          <span class="text-secondary opacity-50">·</span>
          <span><i class="bi bi-trophy-fill me-1 text-warning"></i><strong class="font-monospace">${resTitle}</strong></span>
        </div>
        <div class="d-flex align-items-center gap-2 font-monospace">
          <span><i class="bi bi-hash me-0.5 text-secondary"></i><strong>${totalMoves} moves (${totalPlies} plies)</strong></span>
          <span class="text-secondary opacity-50">·</span>
          <span class="badge bg-secondary-subtle text-secondary border font-monospace text-uppercase">${dashboard.game.platform || 'PGN'}</span>
        </div>
      </div>

      <div class="d-flex flex-column gap-3">
        <!-- 2. Executive Head-to-Head Player Overview -->
        <div class="row g-2.5">
          <!-- White Player Card -->
          <div class="col-12 col-md-6">
            <div class="report-metric-card h-100 ${isWhiteUser ? 'border-warning' : ''}">
              <div class="d-flex align-items-center justify-content-between mb-2 pb-1.5 border-bottom border-opacity-10" style="border-color: var(--arcade-border) !important;">
                <div class="d-flex align-items-center gap-1.5 min-w-0">
                  <span class="lh-1 fs-5">⚪</span>
                  <span class="fw-black fs-6 text-truncate ${isWhiteUser ? 'text-warning' : ''}">${whiteName}</span>
                  <span class="badge bg-secondary font-monospace" style="font-size: 10px;">${whiteElo}</span>
                </div>
                <div class="d-flex align-items-center gap-1">
                  ${isWhiteUser ? '<span class="badge bg-warning text-dark font-monospace fw-black px-1.5 py-0.5 rounded-pill" style="font-size: 9px;">YOU</span>' : ''}
                  ${whiteBadge}
                </div>
              </div>

              <div class="row g-2 align-items-baseline mb-2">
                <div class="col-6">
                  <span class="small text-secondary fw-bold text-uppercase d-block" style="font-size: 10px;">Move Accuracy</span>
                  <span class="fw-black fs-2 text-emerald font-monospace">${whiteAcc}%</span>
                </div>
                <div class="col-6">
                  <span class="small text-secondary fw-bold text-uppercase d-block" style="font-size: 10px;">Performance Rating</span>
                  <span class="fw-black fs-3 font-monospace text-warning">${whiteGameElo} <span class="fs-6 text-secondary fw-normal">Elo</span></span>
                </div>
              </div>

              <div class="d-flex align-items-center justify-content-between flex-wrap gap-1 pt-1.5 border-top border-opacity-10" style="border-color: var(--arcade-border) !important; font-size: 11px;">
                <span class="badge rounded-pill fw-bold" style="background: ${whiteTier.color}20; color: ${whiteTier.color}; border: 1px solid ${whiteTier.color}50;">
                  ${whiteTier.icon} ${whiteTier.label}
                </span>
                <span class="text-secondary font-monospace">
                  <strong class="text-success">${whiteOptCount}</strong> best · <strong class="text-danger">${whiteErrCount}</strong> errors
                </span>
              </div>
            </div>
          </div>

          <!-- Black Player Card -->
          <div class="col-12 col-md-6">
            <div class="report-metric-card h-100 ${!isWhiteUser ? 'border-warning' : ''}">
              <div class="d-flex align-items-center justify-content-between mb-2 pb-1.5 border-bottom border-opacity-10" style="border-color: var(--arcade-border) !important;">
                <div class="d-flex align-items-center gap-1.5 min-w-0">
                  <span class="lh-1 fs-5">⚫</span>
                  <span class="fw-black fs-6 text-truncate ${!isWhiteUser ? 'text-warning' : ''}">${blackName}</span>
                  <span class="badge bg-secondary font-monospace" style="font-size: 10px;">${blackElo}</span>
                </div>
                <div class="d-flex align-items-center gap-1">
                  ${!isWhiteUser ? '<span class="badge bg-warning text-dark font-monospace fw-black px-1.5 py-0.5 rounded-pill" style="font-size: 9px;">YOU</span>' : ''}
                  ${blackBadge}
                </div>
              </div>

              <div class="row g-2 align-items-baseline mb-2">
                <div class="col-6">
                  <span class="small text-secondary fw-bold text-uppercase d-block" style="font-size: 10px;">Move Accuracy</span>
                  <span class="fw-black fs-2 text-cyan font-monospace">${blackAcc}%</span>
                </div>
                <div class="col-6">
                  <span class="small text-secondary fw-bold text-uppercase d-block" style="font-size: 10px;">Performance Rating</span>
                  <span class="fw-black fs-3 font-monospace text-info">${blackGameElo} <span class="fs-6 text-secondary fw-normal">Elo</span></span>
                </div>
              </div>

              <div class="d-flex align-items-center justify-content-between flex-wrap gap-1 pt-1.5 border-top border-opacity-10" style="border-color: var(--arcade-border) !important; font-size: 11px;">
                <span class="badge rounded-pill fw-bold" style="background: ${blackTier.color}20; color: ${blackTier.color}; border: 1px solid ${blackTier.color}50;">
                  ${blackTier.icon} ${blackTier.label}
                </span>
                <span class="text-secondary font-monospace">
                  <strong class="text-success">${blackOptCount}</strong> best · <strong class="text-danger">${blackErrCount}</strong> errors
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Executive Match Narrative -->
        <div class="p-2.5 rounded" style="background: rgba(251, 191, 36, 0.08); border-left: 4px solid var(--arcade-gold); font-size: 12.5px;">
          <div class="d-flex align-items-center gap-1.5 mb-1">
            <i class="bi bi-journal-text text-warning"></i>
            <strong class="text-warning text-uppercase" style="font-size: 11px; letter-spacing: 0.5px;">Executive Match Verdict</strong>
          </div>
          <div class="text-body">${executiveNarrative}</div>
        </div>

        <!-- 3. Phase-by-Phase Breakdown (Opening, Middlegame, Endgame) -->
        <div>
          <div class="d-flex align-items-center justify-content-between mb-2">
            <h6 class="fw-black mb-0 d-flex align-items-center gap-1.5">
              <i class="bi bi-compass text-warning"></i>Phase-by-Phase Mastery
            </h6>
            <span class="text-secondary font-monospace" style="font-size: 11px;">⚪ White vs ⚫ Black</span>
          </div>
          <div class="row g-2">
            <!-- Opening -->
            <div class="col-12 col-md-4">
              <div class="report-phase-card d-flex flex-column justify-content-between">
                <div>
                  <div class="d-flex align-items-center justify-content-between mb-2">
                    <span class="fw-black text-uppercase text-primary" style="font-size: 11px;"><i class="bi bi-compass me-1"></i>Opening</span>
                    <span class="badge bg-secondary font-monospace" style="font-size: 9.5px;">Moves 1–${Math.ceil((dashboard.game.middlegameStartPly || 20) / 2)}</span>
                  </div>
                  <div class="d-flex justify-content-around align-items-center py-1 mb-2 rounded" style="background: var(--arcade-card-hover, rgba(0,0,0,0.03));">
                    <div class="text-center">
                      <span class="d-block text-secondary small" style="font-size: 9.5px;">⚪ White</span>
                      <span class="fw-black font-monospace text-primary fs-5">${whiteOpeningAcc}</span>
                      <span class="badge phase-elo-chip font-monospace" style="font-size: 9px;">${whiteOpeningElo} Elo</span>
                    </div>
                    <div class="vr opacity-25 my-auto" style="height: 30px;"></div>
                    <div class="text-center">
                      <span class="d-block text-secondary small" style="font-size: 9.5px;">⚫ Black</span>
                      <span class="fw-black font-monospace text-cyan fs-5">${blackOpeningAcc}</span>
                      <span class="badge phase-elo-chip font-monospace" style="font-size: 9px;">${blackOpeningElo} Elo</span>
                    </div>
                  </div>
                </div>
                <div class="small pt-1.5 border-top border-opacity-10 text-secondary" style="border-color: var(--arcade-border) !important; font-size: 11px;">
                  ${od ? `
                    <div class="d-flex align-items-center justify-content-between gap-1 flex-wrap">
                      <span>Left book move ${Math.ceil(od.ply / 2)} (<strong class="font-monospace">${insEscape(od.san)}</strong>)</span>
                      <button type="button" class="btn btn-xs btn-outline-warning comic-btn py-0 px-1.5 fw-bold" data-report-jump="${od.ply}">Jump</button>
                    </div>
                  ` : `
                    <span>Adhered to established book theory.</span>
                  `}
                </div>
              </div>
            </div>

            <!-- Middlegame -->
            <div class="col-12 col-md-4">
              <div class="report-phase-card d-flex flex-column justify-content-between">
                <div>
                  <div class="d-flex align-items-center justify-content-between mb-2">
                    <span class="fw-black text-uppercase text-warning" style="font-size: 11px;"><i class="bi bi-shield-shaded me-1"></i>Middlegame</span>
                    <span class="badge bg-secondary font-monospace" style="font-size: 9.5px;">Moves ${Math.ceil((dashboard.game.middlegameStartPly || 20) / 2)}–${Math.ceil((dashboard.game.endgameStartPly || 50) / 2)}</span>
                  </div>
                  <div class="d-flex justify-content-around align-items-center py-1 mb-2 rounded" style="background: var(--arcade-card-hover, rgba(0,0,0,0.03));">
                    <div class="text-center">
                      <span class="d-block text-secondary small" style="font-size: 9.5px;">⚪ White</span>
                      <span class="fw-black font-monospace text-warning fs-5">${whiteMiddleAcc}</span>
                      <span class="badge phase-elo-chip font-monospace" style="font-size: 9px;">${whiteMiddleElo} Elo</span>
                    </div>
                    <div class="vr opacity-25 my-auto" style="height: 30px;"></div>
                    <div class="text-center">
                      <span class="d-block text-secondary small" style="font-size: 9.5px;">⚫ Black</span>
                      <span class="fw-black font-monospace text-cyan fs-5">${blackMiddleAcc}</span>
                      <span class="badge phase-elo-chip font-monospace" style="font-size: 9px;">${blackMiddleElo} Elo</span>
                    </div>
                  </div>
                </div>
                <div class="small pt-1.5 border-top border-opacity-10 text-secondary" style="border-color: var(--arcade-border) !important; font-size: 11px;">
                  ${tp && tp.ply >= (dashboard.game.middlegameStartPly || 20) && tp.ply <= (dashboard.game.endgameStartPly || 50) ? `
                    <div class="d-flex align-items-center justify-content-between gap-1 flex-wrap">
                      <span class="text-danger fw-bold">Turning point at move ${Math.ceil(tp.ply / 2)}</span>
                      <button type="button" class="btn btn-xs btn-outline-danger comic-btn py-0 px-1.5 fw-bold" data-report-jump="${tp.ply}">Jump</button>
                    </div>
                  ` : `
                    <span>Complicated tactical maneuvering and piece trades.</span>
                  `}
                </div>
              </div>
            </div>

            <!-- Endgame -->
            <div class="col-12 col-md-4">
              <div class="report-phase-card d-flex flex-column justify-content-between">
                <div>
                  <div class="d-flex align-items-center justify-content-between mb-2">
                    <span class="fw-black text-uppercase text-success" style="font-size: 11px;"><i class="bi bi-flag-fill me-1"></i>Endgame</span>
                    <span class="badge bg-secondary font-monospace" style="font-size: 9.5px;">Moves ${Math.ceil((dashboard.game.endgameStartPly || 50) / 2)}+</span>
                  </div>
                  <div class="d-flex justify-content-around align-items-center py-1 mb-2 rounded" style="background: var(--arcade-card-hover, rgba(0,0,0,0.03));">
                    <div class="text-center">
                      <span class="d-block text-secondary small" style="font-size: 9.5px;">⚪ White</span>
                      <span class="fw-black font-monospace text-success fs-5">${whiteEndAcc}</span>
                      <span class="badge phase-elo-chip font-monospace" style="font-size: 9px;">${whiteEndElo} Elo</span>
                    </div>
                    <div class="vr opacity-25 my-auto" style="height: 30px;"></div>
                    <div class="text-center">
                      <span class="d-block text-secondary small" style="font-size: 9.5px;">⚫ Black</span>
                      <span class="fw-black font-monospace text-cyan fs-5">${blackEndAcc}</span>
                      <span class="badge phase-elo-chip font-monospace" style="font-size: 9px;">${blackEndElo} Elo</span>
                    </div>
                  </div>
                </div>
                <div class="small pt-1.5 border-top border-opacity-10 text-secondary" style="border-color: var(--arcade-border) !important; font-size: 11px;">
                  ${totalPlies >= (dashboard.game.endgameStartPly || 50) ? `
                    <span>Pawn promotion and king conversion endgame technique.</span>
                  ` : `
                    <span>Game concluded before the technical endgame phase.</span>
                  `}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 4. Move Quality & Classification Matrix -->
        <div>
          <div class="d-flex align-items-center justify-content-between mb-2">
            <h6 class="fw-black mb-0 d-flex align-items-center gap-1.5">
              <i class="bi bi-bar-chart-steps text-warning"></i>Move Quality & Classification Breakdown
            </h6>
            <span class="text-secondary font-monospace" style="font-size: 11px;">White vs Black Distribution</span>
          </div>
          <div class="comic-card p-2.5">
            <div class="d-flex align-items-center justify-content-between px-2 pb-1.5 border-bottom border-opacity-10 font-monospace" style="border-color: var(--arcade-border) !important; font-size: 11px; font-weight: 800;">
              <span style="width: 80px;" class="text-start text-warning">⚪ White</span>
              <span class="text-uppercase text-secondary fw-bold">Classification</span>
              <span style="width: 80px;" class="text-end text-cyan">⚫ Black</span>
            </div>
            <div class="d-flex flex-column gap-1.5 pt-2">
              ${['brilliant', 'great', 'best', 'excellent', 'good', 'book', 'inaccuracy', 'mistake', 'blunder', 'missed_win'].map((cls) => {
                const dict = COMIC_DICTIONARY[cls];
                if (!dict) return '';
                const wCnt = whiteCounts[cls] || 0;
                const bCnt = blackCounts[cls] || 0;
                const wPct = whiteMovesCount > 0 ? Math.round((wCnt / whiteMovesCount) * 100) : 0;
                const bPct = blackMovesCount > 0 ? Math.round((bCnt / blackMovesCount) * 100) : 0;
                const sumCnt = wCnt + bCnt;
                const wBarPct = sumCnt > 0 ? Math.round((wCnt / sumCnt) * 100) : 50;
                const bBarPct = sumCnt > 0 ? 100 - wBarPct : 50;

                return `
                  <div class="p-1.5 rounded" style="background: var(--arcade-card-hover, rgba(0,0,0,0.02)); border: 1px solid var(--arcade-border);">
                    <div class="d-flex align-items-center justify-content-between gap-2 mb-1">
                      <div style="width: 90px;" class="d-flex align-items-baseline gap-1">
                        <strong class="font-monospace fs-6 ${wCnt > 0 ? 'text-warning' : 'text-secondary opacity-50'}">${wCnt}</strong>
                        <span class="text-secondary small font-monospace" style="font-size: 10px;">(${wPct}%)</span>
                      </div>

                      <span class="badge rounded-pill d-inline-flex align-items-center gap-1 px-2.5 py-1" style="background-color: ${dict.bg}; color: ${dict.text}; font-weight: 800; font-size: 11px;">
                        <span>${dict.symbol}</span>
                        <span>${dict.words[0]}</span>
                      </span>

                      <div style="width: 90px;" class="d-flex align-items-baseline justify-content-end gap-1 text-end">
                        <span class="text-secondary small font-monospace" style="font-size: 10px;">(${bPct}%)</span>
                        <strong class="font-monospace fs-6 ${bCnt > 0 ? 'text-cyan' : 'text-secondary opacity-50'}">${bCnt}</strong>
                      </div>
                    </div>

                    ${sumCnt > 0 ? `
                      <div class="report-dual-bar-track" title="White: ${wCnt} (${wBarPct}%) vs Black: ${bCnt} (${bBarPct}%)">
                        <div class="report-dual-bar-white" style="width: ${wBarPct}%;"></div>
                        <div class="report-dual-bar-black" style="width: ${bBarPct}%;"></div>
                      </div>
                    ` : ''}
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>

        <!-- 5. Tactical Highlights: Turning Point & Top Mistakes -->
        <div>
          <h6 class="fw-black mb-2 d-flex align-items-center gap-1.5">
            <i class="bi bi-lightning-charge-fill text-danger"></i>Critical Turning Points & Tactical Highlights
          </h6>
          <div class="row g-2.5">
            ${tp ? `
              <div class="col-12 ${userMistakes.length > 0 ? 'col-lg-6' : ''}">
                <div class="report-metric-card border-danger h-100 d-flex flex-column justify-content-between">
                  <div>
                    <div class="d-flex align-items-center justify-content-between mb-1.5">
                      <span class="badge bg-danger text-white fw-black" style="font-size: 10px;">
                        <i class="bi bi-lightning-fill me-1"></i>GAME TURNING POINT
                      </span>
                      <span class="badge bg-body-secondary text-secondary font-monospace" style="font-size: 10px;">Move ${Math.ceil(tp.ply / 2)}${tp.color === 'b' ? '...' : '.'}${insEscape(tp.san)}</span>
                    </div>
                    <div class="small fw-bold mb-1.5">
                      ${tp.isUserMove ? 'Your' : "Opponent's"} <span class="text-danger font-monospace fw-black">${Math.ceil(tp.ply / 2)}${tp.color === 'b' ? '...' : '.'}${insEscape(tp.san)}</span> shifted win probability by <span class="text-danger fw-black">${tp.swingPct}%</span> (${Math.round((tp.prevWinProb ?? 0.5) * 100)}% → ${Math.round((tp.winProb ?? 0.5) * 100)}% White).
                    </div>
                    ${tp.bestMoveSan ? `
                      <div class="text-secondary small mb-2">
                        <i class="bi bi-check2-circle text-success me-1"></i>Stockfish recommended <strong class="font-monospace text-success">${insEscape(tp.bestMoveSan)}</strong>
                      </div>
                    ` : ''}
                  </div>
                  <button type="button" class="btn btn-sm btn-outline-danger comic-btn fw-bold w-100 py-1" data-report-jump="${tp.ply}">
                    <i class="bi bi-crosshair me-1"></i>View Turning Point on Board
                  </button>
                </div>
              </div>
            ` : ''}

            <!-- Top Mistakes List -->
            <div class="col-12 ${tp ? 'col-lg-6' : ''}">
              <div class="report-metric-card h-100 d-flex flex-column justify-content-between">
                <div>
                  <div class="d-flex align-items-center justify-content-between mb-2">
                    <span class="small fw-black text-uppercase text-danger" style="font-size: 10.5px;">
                      <i class="bi bi-exclamation-triangle-fill me-1"></i>Key Blunders & Missed Wins
                    </span>
                    <span class="badge bg-secondary font-monospace" style="font-size: 9.5px;">${userMistakes.length} error${userMistakes.length === 1 ? '' : 's'}</span>
                  </div>

                  ${userMistakes.length > 0 ? `
                    <div class="d-flex flex-column gap-1.5 mb-2">
                      ${userMistakes.slice(0, 4).map((m) => {
                        const moveNum = Math.ceil(m.ply / 2);
                        const dots = m.color === 'b' ? '...' : '.';
                        const comic = getComicBadge(m.classification, m.san);
                        const bestSan = m.bestMoveSan || (m.bestMoveUci ? `${m.bestMoveUci.slice(0, 2)}-${m.bestMoveUci.slice(2, 4)}` : '');
                        return `
                          <div class="report-blunder-row d-flex align-items-center justify-content-between gap-1.5">
                            <div class="d-flex align-items-center gap-1.5 min-w-0">
                              <span class="badge" style="background-color: ${comic.bg}; color: ${comic.text}; font-size: 10px; font-weight: 800;">
                                ${comic.symbol}
                              </span>
                              <span class="font-monospace fw-black small">${moveNum}${dots}${insEscape(m.san)}</span>
                              ${bestSan ? `<span class="text-secondary small font-monospace d-none d-sm-inline">→ <strong class="text-success">${insEscape(bestSan)}</strong></span>` : ''}
                            </div>
                            <button type="button" class="btn btn-xs btn-outline-secondary comic-btn py-0.5 px-2 fw-bold flex-shrink-0" data-report-jump="${m.ply}">
                              View <i class="bi bi-arrow-right ms-0.5"></i>
                            </button>
                          </div>
                        `;
                      }).join('')}
                    </div>
                  ` : `
                    <div class="text-secondary small py-3 text-center">
                      <i class="bi bi-shield-check text-success fs-4 d-block mb-1"></i>
                      No critical blunders or missed wins found! Clean tactical game.
                    </div>
                  `}
                </div>

                ${userMistakes.length > 0 ? `
                  <button type="button" class="btn btn-sm btn-danger comic-btn fw-black w-100 py-1" id="btn-report-retry-mistakes">
                    <i class="bi bi-bullseye me-1"></i>Retry All Mistakes in Puzzle Workout (${userMistakes.length})
                  </button>
                ` : ''}
              </div>
            </div>
          </div>
        </div>

        <!-- 6. Tactical Motifs Diagnosed -->
        ${detectedMotifs.length > 0 ? `
          <div>
            <div class="d-flex align-items-center justify-content-between mb-2">
              <h6 class="fw-black mb-0 d-flex align-items-center gap-1.5">
                <i class="bi bi-puzzle-fill text-warning"></i>Tactical Motifs Diagnosed in this Game
              </h6>
              <span class="badge bg-secondary font-monospace" style="font-size: 10px;">${detectedMotifs.length} motifs detected</span>
            </div>
            <div class="row g-2">
              ${detectedMotifs.slice(0, 6).map((m) => `
                <div class="col-12 col-sm-6 col-md-4">
                  <div class="report-metric-card p-2 h-100">
                    <div class="d-flex align-items-center justify-content-between mb-1">
                      <span class="fw-black small d-flex align-items-center gap-1">
                        <span>${m.icon}</span>
                        <span>${insEscape(m.label)}</span>
                      </span>
                      <span class="badge bg-warning-subtle text-warning border border-warning-subtle font-monospace fw-black" style="font-size: 9.5px;">${m.count}×</span>
                    </div>
                    ${m.coachTip ? `<div class="text-secondary small" style="font-size: 11px;">${insEscape(m.coachTip)}</div>` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- 7. Time Management & Clock Discipline -->
        ${whiteAvgTime || blackAvgTime ? `
          <div>
            <h6 class="fw-black mb-2 d-flex align-items-center gap-1.5">
              <i class="bi bi-clock-history text-info"></i>Time Management & Clock Discipline
            </h6>
            <div class="row g-2">
              <div class="col-6 col-md-3">
                <div class="report-metric-card text-center p-2">
                  <span class="text-secondary text-uppercase fw-bold d-block" style="font-size: 9.5px;">⚪ White Avg Time</span>
                  <strong class="fs-5 font-monospace text-warning">${whiteAvgTime || '—'}</strong>
                </div>
              </div>
              <div class="col-6 col-md-3">
                <div class="report-metric-card text-center p-2">
                  <span class="text-secondary text-uppercase fw-bold d-block" style="font-size: 9.5px;">⚫ Black Avg Time</span>
                  <strong class="fs-5 font-monospace text-cyan">${blackAvgTime || '—'}</strong>
                </div>
              </div>
              <div class="col-6 col-md-3">
                <div class="report-metric-card text-center p-2">
                  <span class="text-secondary text-uppercase fw-bold d-block" style="font-size: 9.5px;">⚡ Rushed Moves (&lt;2s)</span>
                  <strong class="fs-5 font-monospace text-danger">${impulsiveCount}</strong>
                </div>
              </div>
              <div class="col-6 col-md-3">
                <div class="report-metric-card text-center p-2">
                  <span class="text-secondary text-uppercase fw-bold d-block" style="font-size: 9.5px;">🔥 Time Trouble (&lt;20s)</span>
                  <strong class="fs-5 font-monospace text-warning">${timeTroubleCount}</strong>
                </div>
              </div>
            </div>
          </div>
        ` : ''}

        <!-- 8. Positional Pillars Profile -->
        <div>
          <div class="d-flex align-items-center justify-content-between mb-2">
            <h6 class="fw-black mb-0 d-flex align-items-center gap-1.5">
              <i class="bi bi-sliders text-info"></i>4-Pillar Positional Assessment
            </h6>
            <span class="text-secondary font-monospace" style="font-size: 11px;">Material · Activity · King Safety · Structure</span>
          </div>
          <div class="row g-2">
            <div class="col-6 col-md-3">
              <div class="report-metric-card p-2">
                <div class="d-flex align-items-center gap-1.5 mb-1">
                  <span class="fs-5">⚖️</span>
                  <div>
                    <strong class="d-block small fw-black">Material</strong>
                    <span class="text-secondary font-monospace" style="font-size: 9.5px;">Piece exchanges</span>
                  </div>
                </div>
                <div class="text-secondary" style="font-size: 11px;">Evaluates pawn units, minor piece trades, and unbalanced piece trades.</div>
              </div>
            </div>
            <div class="col-6 col-md-3">
              <div class="report-metric-card p-2">
                <div class="d-flex align-items-center gap-1.5 mb-1">
                  <span class="fs-5">⚡</span>
                  <div>
                    <strong class="d-block small fw-black">Piece Activity</strong>
                    <span class="text-secondary font-monospace" style="font-size: 9.5px;">Square control</span>
                  </div>
                </div>
                <div class="text-secondary" style="font-size: 11px;">Measures center attacks, mobility, open lines, and pressure on enemy squares.</div>
              </div>
            </div>
            <div class="col-6 col-md-3">
              <div class="report-metric-card p-2">
                <div class="d-flex align-items-center gap-1.5 mb-1">
                  <span class="fs-5">🛡️</span>
                  <div>
                    <strong class="d-block small fw-black">King Safety</strong>
                    <span class="text-secondary font-monospace" style="font-size: 9.5px;">Shield & shelter</span>
                  </div>
                </div>
                <div class="text-secondary" style="font-size: 11px;">Evaluates pawn shelter intactness, castling security, and open files toward the king.</div>
              </div>
            </div>
            <div class="col-6 col-md-3">
              <div class="report-metric-card p-2">
                <div class="d-flex align-items-center gap-1.5 mb-1">
                  <span class="fs-5">♟️</span>
                  <div>
                    <strong class="d-block small fw-black">Pawn Structure</strong>
                    <span class="text-secondary font-monospace" style="font-size: 9.5px;">Islands & chains</span>
                  </div>
                </div>
                <div class="text-secondary" style="font-size: 11px;">Monitors doubled pawns, isolated pawns, backward weaknesses, and passed pawns.</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 9. Personalized Coach Study Plan & Drills -->
        <div class="border-top pt-3" style="border-color: var(--arcade-border) !important;">
          <div class="comic-card p-3 coach-plan-card">
            <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2 pb-2 border-bottom" style="border-color: var(--arcade-border) !important;">
              <div class="d-flex align-items-center gap-2">
                <span class="badge bg-warning text-dark border border-dark fw-black px-2 py-1" style="font-size: 11px;">
                  🎓 COACH'S STUDY PLAN
                </span>
                <span class="small fw-bold text-secondary">Personalized Takeaways & Active Drills</span>
              </div>
              ${summary.brightestMove ? `
                <button type="button" class="btn btn-xs btn-outline-info comic-btn fw-bold py-0.5 px-2" data-report-jump="${summary.brightestMove.ply}" title="Jump to your highest-rated move">
                  ✨ Best Moment: Move ${Math.ceil(summary.brightestMove.ply / 2)} (${insEscape(summary.brightestMove.san)})
                </button>
              ` : ''}
            </div>

            <div class="d-flex align-items-start gap-2.5 mb-3">
              <div class="fs-3 lh-1 mt-0.5">${priorityIcon}</div>
              <div class="flex-grow-1">
                <div class="fw-black small text-warning mb-0.5">${insEscape(priorityTitle)}</div>
                <div class="text-secondary small" style="font-size: 12px;">${insEscape(priorityDesc)}</div>
              </div>
            </div>

            <div class="d-flex align-items-center flex-wrap gap-2 pt-1 border-top border-opacity-10" style="border-color: var(--arcade-border) !important;">
              <button type="button" class="btn btn-sm btn-primary comic-btn fw-black py-1 px-2.5 flex-grow-1" id="btn-coach-guess-move" style="font-size: 11px;">
                <i class="bi bi-question-diamond-fill me-1"></i>Guess the Move Workout
              </button>
              <button type="button" class="btn btn-sm btn-warning text-dark comic-btn fw-black py-1 px-2.5 flex-grow-1" id="btn-coach-blunder-bank" style="font-size: 11px;">
                <i class="bi bi-bank2 me-1"></i>Open Blunder Bank (${bankStats.total})
              </button>
            </div>
          </div>
        </div>

        <!-- 10. Footer Utility Actions -->
        <div class="d-flex align-items-center justify-content-between pt-2 border-top no-print flex-wrap gap-2" style="border-color: var(--arcade-border) !important;">
          <div class="d-flex align-items-center gap-2">
            <button type="button" class="btn btn-sm btn-outline-warning comic-btn fw-bold px-3 py-1" id="btn-report-copy-footer">
              <i class="bi bi-clipboard-check me-1"></i>Copy Report Summary
            </button>
          </div>
          <button type="button" class="btn btn-sm btn-dark comic-btn px-4 py-1 fw-bold" id="btn-report-close-footer">
            Close Report
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  document.body.classList.add('modal-open');

  const closeFn = () => {
    modal.remove();
    document.body.classList.remove('modal-open');
  };

  const dialogEl = modal.querySelector('.full-report-dialog') || modal.querySelector('.why-dialog');
  const safeClose = typeof setupModalSwipeAndHistory === 'function'
    ? setupModalSwipeAndHistory(modal, dialogEl, closeFn)
    : closeFn;

  modal.querySelector('#btn-close-perf-modal')?.addEventListener('click', safeClose);
  modal.querySelector('#btn-report-close-footer')?.addEventListener('click', safeClose);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) safeClose();
  });
  modal.querySelector('#btn-report-share')?.addEventListener('click', (e) => {
    dashboard.shareGameReviewLink(e.currentTarget);
  });
  modal.querySelector('#btn-report-open-eco')?.addEventListener('click', () => {
    safeClose();
    dashboard.openOpeningModal();
  });

  // Copy Summary Helper
  const copyReportSummary = (btn) => {
    const summaryText = `⚡ CHESS IQ COMPREHENSIVE GAME REPORT
Match: ${dashboard.game.white || 'White'} (${whiteElo}) vs ${dashboard.game.black || 'Black'} (${blackElo})
Result: ${resTitle}
ECO: ${dashboard.game.ecoCode || 'PGN'} · ${dashboard.game.ecoName || 'Chess Match'}
Date: ${dashboard.game.date || 'Recent Match'} | Time Control: ${dashboard.game.isBotGame ? 'Untimed (No limit)' : (dashboard.game.timeControl || 'Standard')}
Moves: ${totalMoves} moves (${totalPlies} plies)

📊 PERFORMANCE & ACCURACY:
• White (${whiteName}): ${whiteAcc}% Accuracy | ${whiteGameElo} Performance Elo (${whiteTier.label})
• Black (${blackName}): ${blackAcc}% Accuracy | ${blackGameElo} Performance Elo (${blackTier.label})

🧭 PHASE BREAKDOWN:
• Opening: White ${whiteOpeningAcc} (${whiteOpeningElo} Elo) vs Black ${blackOpeningAcc} (${blackOpeningElo} Elo)
• Middlegame: White ${whiteMiddleAcc} (${whiteMiddleElo} Elo) vs Black ${blackMiddleAcc} (${blackMiddleElo} Elo)
• Endgame: White ${whiteEndAcc} (${whiteEndElo} Elo) vs Black ${blackEndAcc} (${blackEndElo} Elo)
${tp ? `
⚡ TURNING POINT:
Move ${Math.ceil(tp.ply / 2)}${tp.color === 'b' ? '...' : '.'}${tp.san} swung win probability by ${tp.swingPct}% (${Math.round((tp.prevWinProb ?? 0.5) * 100)}% → ${Math.round((tp.winProb ?? 0.5) * 100)}% White).
${tp.bestMoveSan ? `Stockfish Recommended: ${tp.bestMoveSan}` : ''}` : ''}

🎓 COACH TAKEAWAY:
${priorityTitle}
${priorityDesc}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(summaryText).then(() => {
        if (btn) {
          const orig = btn.innerHTML;
          btn.innerHTML = `<i class="bi bi-check2 me-1"></i>Copied!`;
          setTimeout(() => { btn.innerHTML = orig; }, 2000);
        }
      });
    }
  };

  modal.querySelector('#btn-report-copy')?.addEventListener('click', (e) => copyReportSummary(e.currentTarget));
  modal.querySelector('#btn-report-copy-footer')?.addEventListener('click', (e) => copyReportSummary(e.currentTarget));

  modal.querySelector('#btn-coach-guess-move')?.addEventListener('click', () => {
    safeClose();
    dashboard.startGuessTheMove();
  });
  modal.querySelector('#btn-coach-blunder-bank')?.addEventListener('click', () => {
    safeClose();
    dashboard.openBlunderBankModal('all');
  });
  modal.querySelector('#btn-report-retry-mistakes')?.addEventListener('click', () => {
    safeClose();
    dashboard.startRetryMistakes();
  });

  modal.querySelectorAll('[data-report-jump]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const ply = parseInt(btn.getAttribute('data-report-jump'), 10);
      if (!isNaN(ply)) {
        closeFn();
        dashboard.goToPly(ply);
      }
    });
  });
}
