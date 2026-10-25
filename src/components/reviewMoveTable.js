/**
 * Move History Table & Filter Badges Component
 * Interactive moves list, move cell annotations, classifications, and summary badges.
 */

function bindMoveTableRowClicks(dashboard) {
  if (!dashboard || !dashboard.container) return;
  dashboard.container.querySelectorAll('[data-row-ply]').forEach((el) => {
    el.addEventListener('click', () => {
      const ply = parseInt(el.getAttribute('data-row-ply'), 10);
      if (!isNaN(ply)) dashboard.goToPly(ply);
    });
  });
}

function matchesMoveFilter(dashboard, plyObj) {
  if (!dashboard || !plyObj) return false;
  const f = dashboard.moveFilter || 'all';
  if (f === 'all') return true;
  if (f === 'blunders') return ['blunder', 'mistake', 'missed_win'].includes(plyObj.classification);
  if (f === 'brilliant') return ['brilliant', 'great', 'best'].includes(plyObj.classification);
  if (f === 'inaccuracies') return plyObj.classification === 'inaccuracy';
  if (f === 'user') return plyObj.color === (dashboard.game?.userColor || 'w');
  return true;
}

function renderMoveCellContent(dashboard, plyObj) {
  if (!plyObj) return '';
  const comic = typeof getComicBadge === 'function' ? getComicBadge(plyObj.classification, plyObj.san) : null;
  const icon = comic ? comic.icon : '';
  const isSelected = dashboard && dashboard.currentPly === plyObj.ply;
  const badgeCls = `move-badge-${plyObj.classification || 'normal'}`;

  const clockHtml = plyObj.clockFormatted
    ? `<span class="badge bg-secondary-subtle text-secondary font-monospace ms-auto" style="font-size: 9px; padding: 1px 4px;" title="Remaining Clock: ${plyObj.clockFormatted}">⏱ ${plyObj.clockFormatted}</span>`
    : '';

  return `
    <div class="d-flex align-items-center justify-content-between w-100 px-1 py-0.5 rounded cursor-pointer move-cell ${isSelected ? 'active-cell' : ''}" data-row-ply="${plyObj.ply}">
      <span class="d-flex align-items-center gap-1 font-monospace fw-bold" style="font-size: 12px;">
        <span class="classification-dot ${badgeCls}"></span>
        <span>${plyObj.san}</span>
      </span>
      <div class="d-flex align-items-center gap-1">
        ${clockHtml}
        ${icon ? `<span class="classification-badge ${badgeCls}" title="${plyObj.classification}">${icon}</span>` : ''}
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

    const whiteActive = dashboard.currentPly === (m - 1) * 2 + 1;
    const blackActive = dashboard.currentPly === (m - 1) * 2 + 2;

    rows += `
      <tr class="move-table-row ${whiteActive || blackActive ? 'table-row-selected' : ''}">
        <td class="text-secondary font-monospace small px-2 py-1" style="width: 38px; vertical-align: middle;">${m}.</td>
        <td class="px-1 py-0.5 ${whiteActive ? 'bg-primary-subtle' : ''}" style="width: 48%;">
          ${whitePly ? renderMoveCellContent(dashboard, whitePly) : ''}
        </td>
        <td class="px-1 py-0.5 ${blackActive ? 'bg-primary-subtle' : ''}" style="width: 48%;">
          ${blackPly ? renderMoveCellContent(dashboard, blackPly) : ''}
        </td>
      </tr>
    `;
  }

  return rows;
}

function renderMiniBadge(cls) {
  const meta = typeof getComicBadge === 'function' ? getComicBadge(cls, '') : { icon: '•', title: cls, color: '#94a3b8' };
  const label = cls.replace('_', ' ');
  return `
    <span class="d-inline-flex align-items-center gap-1 px-1.5 py-0.5 rounded text-white small" style="background: ${meta.color}; font-size: 10px; font-weight: 700;" title="${label}">
      <span>${meta.icon}</span>
      <span class="text-capitalize">${label}</span>
    </span>
  `;
}

function buildBadgesSummary(dashboard) {
  if (!dashboard || !dashboard.game) return '';
  const counts = dashboard.game.classificationCounts || {};
  const userColor = dashboard.game.userColor || 'w';
  const userCounts = counts[userColor] || {};

  const order = ['brilliant', 'great', 'best', 'excellent', 'good', 'book', 'inaccuracy', 'mistake', 'missed_win', 'blunder'];

  return `
    <div class="d-flex align-items-center flex-wrap gap-1.5 p-2 rounded" style="background: var(--arcade-surface, rgba(0,0,0,0.03)); border: 1px solid var(--arcade-border);">
      ${order.map((cls) => {
        const count = userCounts[cls] || 0;
        if (count === 0) return '';
        const meta = typeof getComicBadge === 'function' ? getComicBadge(cls, '') : { icon: '•', title: cls, color: '#94a3b8' };
        return `
          <div class="d-flex align-items-center gap-1 px-2 py-1 rounded shadow-xs" style="background: var(--arcade-card); border: 1px solid var(--arcade-border); font-size: 11px;">
            <span>${meta.icon}</span>
            <span class="fw-bold text-capitalize">${cls.replace('_', ' ')}:</span>
            <span class="badge bg-secondary font-monospace">${count}</span>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

