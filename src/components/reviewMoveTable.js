/**
 * Move History Table & Filter Badges Component
 * Interactive moves list, move cell annotations, classifications, and summary badges.
 */

function bindMoveTableRowClicks(dashboard) {
  if (!dashboard || !dashboard.container) return;
  dashboard.container.querySelectorAll('[data-row-ply]').forEach((el) => {
    el.addEventListener('click', () => {
      if (dashboard.sandboxState || dashboard.retryPuzzleState?.active || dashboard.guessMoveState?.active) return;
      const ply = parseInt(el.getAttribute('data-row-ply'), 10);
      if (!isNaN(ply)) dashboard.goToPly(ply);
    });
  });
}

function matchesMoveFilter(dashboard, plyObj) {
  if (!dashboard || !plyObj) return false;
  const f = dashboard.moveFilter || 'all';
  if (f === 'all') return true;
  if (f === 'key') return ['brilliant', 'great', 'inaccuracy', 'mistake', 'blunder', 'missed_win'].includes(plyObj.classification);
  if (f === 'errors' || f === 'blunders') return ['inaccuracy', 'mistake', 'blunder', 'missed_win'].includes(plyObj.classification);
  if (f === 'brilliant') return ['brilliant', 'great', 'best'].includes(plyObj.classification);
  if (f === 'inaccuracies') return plyObj.classification === 'inaccuracy';
  if (f === 'user') return plyObj.color === (dashboard.game?.userColor || 'w');
  return true;
}

function renderMoveCellContent(dashboard, plyObj) {
  if (!plyObj) return '';
  if (plyObj.isForced === undefined && plyObj.fenBefore && typeof isForcedMove === 'function') {
    plyObj.isForced = isForcedMove(plyObj.fenBefore);
  }
  const cls = (plyObj.isForced || plyObj.classification === 'forced') ? 'forced' : (plyObj.classification || 'good');
  const comic = typeof getComicBadge === 'function' ? getComicBadge(cls, plyObj.san) : null;
  const isSelected = Boolean(dashboard && dashboard.currentPly === plyObj.ply);
  const matchesFilter = !dashboard || dashboard.moveFilter === 'all' || matchesMoveFilter(dashboard, plyObj);
  const dimClass = !matchesFilter ? 'opacity-50' : '';

  const rawClock = plyObj.clockFormatted || (dashboard && typeof dashboard.formatClock === 'function' ? dashboard.formatClock(plyObj.clockSeconds ?? plyObj.clock) : null);
  const clockHtml = rawClock
    ? `<span class="move-cell-clock font-monospace text-secondary" title="Remaining Clock: ${rawClock}">${rawClock}</span>`
    : '';

  const showPillBadge = ['brilliant', 'great', 'best', 'book', 'forced', 'inaccuracy', 'mistake', 'blunder', 'missed_win'].includes(cls);
  const symbolStr = comic ? (comic.badgeLabel || comic.symbol || '') : '';
  const isMultiChar = String(symbolStr).length > 1;

  const badgeHtml = comic && showPillBadge
    ? `<span class="mini-move-badge rounded-circle d-inline-flex align-items-center justify-content-center fw-black flex-shrink-0 ${isMultiChar ? 'multi-char' : ''}" style="background-color: ${comic.bg}; color: ${comic.text};" title="${comic.term}">${symbolStr}</span>`
    : (comic ? `<span class="classification-dot flex-shrink-0" style="background-color: ${comic.bg};" title="${comic.term}"></span>` : '');

  return `
    <div class="d-flex align-items-center justify-content-between w-100 px-2 py-1 rounded-2 cursor-pointer move-cell ${isSelected ? 'active-cell' : ''} ${dimClass}" data-row-ply="${plyObj.ply}">
      <span class="d-flex align-items-center gap-1.5 font-monospace fw-bold text-truncate">
        ${badgeHtml}
        <span>${plyObj.san}</span>
      </span>
      <div class="d-flex align-items-center gap-1 ms-1 flex-shrink-0">
        ${clockHtml}
      </div>
    </div>
  `;
}

function buildMoveTableRows(dashboard) {
  if (!dashboard || !dashboard.game || !Array.isArray(dashboard.game.plies)) return '';
  const plies = dashboard.game.plies;
  const totalMoves = Math.ceil(plies.length / 2);
  let rows = '';

  for (let m = 1; m <= totalMoves; m++) {
    const whitePly = plies[(m - 1) * 2];
    const blackPly = plies[(m - 1) * 2 + 1];

    const matchWhite = whitePly && matchesMoveFilter(dashboard, whitePly);
    const matchBlack = blackPly && matchesMoveFilter(dashboard, blackPly);

    if (dashboard.moveFilter && dashboard.moveFilter !== 'all' && !matchWhite && !matchBlack) {
      continue;
    }

    const whitePlyNum = (m - 1) * 2 + 1;
    const blackPlyNum = (m - 1) * 2 + 2;
    const whiteActive = dashboard.currentPly === whitePlyNum;
    const blackActive = dashboard.currentPly === blackPlyNum;

    rows += `
      <tr class="move-table-row ${whiteActive || blackActive ? 'table-row-selected' : ''}" data-move-num="${m}">
        <td class="text-secondary font-monospace small px-2 py-1 text-end user-select-none" style="width: 36px; vertical-align: middle;">${m}.</td>
        <td class="p-0.5" style="width: 48%; vertical-align: middle;">
          ${whitePly ? renderMoveCellContent(dashboard, whitePly) : ''}
        </td>
        <td class="p-0.5" style="width: 48%; vertical-align: middle;">
          ${blackPly ? renderMoveCellContent(dashboard, blackPly) : ''}
        </td>
      </tr>
    `;
  }

  if (!rows) {
    return `
      <tr>
        <td colspan="3" class="text-center text-secondary py-4 small">
          <i class="bi bi-check2-circle text-success d-block fs-5 mb-1"></i>
          No moves match the <strong>${dashboard.moveFilter}</strong> filter in this game.
        </td>
      </tr>
    `;
  }

  return rows;
}

function renderMiniBadge(cls) {
  const meta = typeof getComicBadge === 'function' ? getComicBadge(cls, '') : { symbol: '•', term: cls, bg: '#94a3b8', text: '#ffffff' };
  const label = cls.replace('_', ' ');
  return `
    <span class="d-inline-flex align-items-center gap-1 px-1.5 py-0.5 rounded text-white small" style="background: ${meta.bg}; color: ${meta.text}; font-size: 10px; font-weight: 700;" title="${label}">
      <span>${meta.symbol}</span>
      <span class="text-capitalize">${label}</span>
    </span>
  `;
}

function buildBadgesSummary(dashboard) {
  if (!dashboard || !dashboard.game) return '';
  const userColor = dashboard.game.userColor || 'w';
  const userCounts = dashboard.game.userCounts || (dashboard.game.classificationCounts && dashboard.game.classificationCounts[userColor]) || {};

  const order = ['brilliant', 'great', 'best', 'excellent', 'good', 'book', 'forced', 'inaccuracy', 'mistake', 'missed_win', 'blunder'];

  return `
    <div class="d-flex align-items-center flex-wrap gap-1.5 p-2 rounded" style="background: var(--arcade-surface, rgba(0,0,0,0.03)); border: 1px solid var(--arcade-border);">
      ${order.map((cls) => {
        const count = userCounts[cls] || 0;
        if (count === 0) return '';
        const meta = typeof getComicBadge === 'function' ? getComicBadge(cls, '') : { symbol: '•', term: cls, bg: '#94a3b8' };
        return `
          <div class="d-flex align-items-center gap-1 px-2 py-1 rounded shadow-xs" style="background: var(--arcade-card); border: 1px solid var(--arcade-border); font-size: 11px;">
            <span>${meta.symbol}</span>
            <span class="fw-bold text-capitalize">${cls.replace('_', ' ')}:</span>
            <span class="badge bg-secondary font-monospace">${count}</span>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

