import { COMIC_DICTIONARY } from '../services/comicBadges.js';

export function createCurvedPath(points) {
  if (!points || points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }

  return path;
}

export function updateAdvantageScrubber(dashboard) {
  if (!dashboard || !dashboard.game || !dashboard.advantagePoints || dashboard.advantagePoints.length === 0) return;
  const group = dashboard.container.querySelector('#advantage-scrubber-group');
  const line = dashboard.container.querySelector('#scrubber-line');
  const circle = dashboard.container.querySelector('#scrubber-circle');
  if (!group || !line || !circle) return;

  if (dashboard.currentPly > 0 && dashboard.currentPly <= dashboard.advantagePoints.length) {
    const pt = dashboard.advantagePoints[dashboard.currentPly - 1];
    group.style.display = 'inline';
    line.setAttribute('x1', pt.x);
    line.setAttribute('x2', pt.x);
    circle.setAttribute('cx', pt.x);
    circle.setAttribute('cy', pt.y);
  } else if (dashboard.currentPly === 0 && dashboard.advantagePoints.length > 0) {
    const pt = dashboard.advantagePoints[0];
    group.style.display = 'inline';
    line.setAttribute('x1', pt.x);
    line.setAttribute('x2', pt.x);
    circle.setAttribute('cx', pt.x);
    circle.setAttribute('cy', dashboard.advantageMidY || 42);
  } else {
    group.style.display = 'none';
  }
}

export function renderAdvantageChart(dashboard) {
  const chartArea = dashboard.container.querySelector('#advantage-chart-area');
  if (!chartArea || !dashboard.game || !dashboard.game.plies || dashboard.game.plies.length === 0) {
    if (chartArea) chartArea.innerHTML = '';
    return;
  }

  const totalPlies = dashboard.game.plies.length;
  const width = 1000;
  const height = 84;
  const midY = height / 2;
  const padX = 12;
  const padY = 10;

  dashboard.advantageMidY = midY;
  dashboard.advantagePoints = dashboard.game.plies.map((ply, i) => {
    const x = padX + (i / (totalPlies - 1 || 1)) * (width - padX * 2);
    const prob = typeof ply.winProb === 'number' && !isNaN(ply.winProb) ? ply.winProb : 0.5;
    const y = padY + (1 - prob) * (height - padY * 2);
    return { x, y, ply };
  });

  const curveD = createCurvedPath(dashboard.advantagePoints);
  const firstX = dashboard.advantagePoints[0].x;
  const lastX = dashboard.advantagePoints[dashboard.advantagePoints.length - 1].x;
  const areaD = `${curveD} L ${lastX} ${midY} L ${firstX} ${midY} Z`;

  const selectedPoint = (dashboard.currentPly > 0 && dashboard.currentPly <= totalPlies)
    ? dashboard.advantagePoints[dashboard.currentPly - 1]
    : (dashboard.advantagePoints[0] || null);

  const mgPly = dashboard.game.middlegameStartPly;
  const egPly = dashboard.game.endgameStartPly;

  let phaseMarkersSvg = '';
  if (mgPly > 1 && mgPly <= totalPlies) {
    const mgPt = dashboard.advantagePoints[mgPly - 1];
    phaseMarkersSvg += `
      <line x1="${mgPt.x}" y1="6" x2="${mgPt.x}" y2="${height - 6}" stroke="#60a5fa" stroke-width="1.2" stroke-dasharray="3,3" opacity="0.65" />
      <text x="${mgPt.x}" y="12" fill="#93c5fd" font-size="9" font-weight="700" font-family="JetBrains Mono, monospace" text-anchor="middle">Middle</text>
    `;
  }
  if (egPly > 1 && egPly <= totalPlies) {
    const egPt = dashboard.advantagePoints[egPly - 1];
    phaseMarkersSvg += `
      <line x1="${egPt.x}" y1="6" x2="${egPt.x}" y2="${height - 6}" stroke="#34d399" stroke-width="1.2" stroke-dasharray="3,3" opacity="0.65" />
      <text x="${egPt.x}" y="12" fill="#6ee7b7" font-size="9" font-weight="700" font-family="JetBrains Mono, monospace" text-anchor="middle">Endgame</text>
    `;
  }

  chartArea.innerHTML = `
    <div class="d-flex align-items-center justify-content-between px-1 pb-1 mb-1 border-bottom border-secondary border-opacity-25">
      <div class="d-flex align-items-center gap-1.5">
        <i class="bi bi-graph-up text-primary small"></i>
        <span class="small fw-black" style="font-size: 11px;">Advantage Timeline</span>
      </div>
      <div class="d-flex align-items-center gap-2 font-monospace" style="font-size: 10px;">
        <span class="d-flex align-items-center gap-1 text-info"><span class="rounded-circle d-inline-block bg-info" style="width: 6px; height: 6px;"></span>White+</span>
        <span class="d-flex align-items-center gap-1 text-secondary"><span class="rounded-circle d-inline-block bg-secondary" style="width: 6px; height: 6px;"></span>Black+</span>
      </div>
    </div>
    <div class="advantage-chart-canvas position-relative" id="advantage-chart-canvas">
      <svg class="w-100 h-100" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" style="display: block;">
        <defs>
          <linearGradient id="advWhiteGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.3" />
            <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.02" />
          </linearGradient>
        </defs>
        <!-- 50% Equality Line -->
        <line x1="0" y1="${midY}" x2="${width}" y2="${midY}" stroke="#475569" stroke-width="1" stroke-dasharray="4,4" opacity="0.5" />
        <!-- Gradient Area -->
        <path d="${areaD}" fill="url(#advWhiteGrad)" />
        <!-- Main Advantage Spline -->
        <path d="${curveD}" fill="none" stroke="#38bdf8" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
        <!-- Phase Markers -->
        ${phaseMarkersSvg}
        <!-- Active Move Scrubber -->
        <g id="advantage-scrubber-group" style="display: ${selectedPoint ? 'inline' : 'none'};">
          <line id="scrubber-line" x1="${selectedPoint?.x || 0}" y1="0" x2="${selectedPoint?.x || 0}" y2="${height}" stroke="#fbbf24" stroke-width="1.8" opacity="0.9" />
          <circle id="scrubber-circle" cx="${selectedPoint?.x || 0}" cy="${dashboard.currentPly === 0 ? midY : (selectedPoint?.y || midY)}" r="4" fill="#fbbf24" stroke="#0f172a" stroke-width="1.5" />
        </g>
      </svg>
      <div id="advantage-chart-tooltip" class="position-absolute d-none px-2 py-1 rounded bg-dark border border-secondary shadow text-white small" style="pointer-events: none; z-index: 10; font-size: 11px;"></div>
    </div>
  `;

  const canvas = chartArea.querySelector('#advantage-chart-canvas');
  const tooltip = chartArea.querySelector('#advantage-chart-tooltip');
  if (canvas) {
    const handleInteraction = (clientX) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0) return;
      const relX = clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, relX / rect.width));
      const targetPly = Math.max(1, Math.min(totalPlies, Math.round(ratio * (totalPlies - 1)) + 1));
      dashboard.goToPly(targetPly);
    };

    canvas.addEventListener('click', (e) => handleInteraction(e.clientX));

    let isDragging = false;
    canvas.addEventListener('mousedown', (e) => {
      isDragging = true;
      handleInteraction(e.clientX);
    });
    window.addEventListener('mousemove', (e) => {
      if (isDragging) handleInteraction(e.clientX);
    });
    window.addEventListener('mouseup', () => {
      isDragging = false;
    });

    canvas.addEventListener('mousemove', (e) => {
      if (!tooltip || !dashboard.game || !dashboard.game.plies.length) return;
      const rect = canvas.getBoundingClientRect();
      const relX = e.clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, relX / rect.width));
      const idx = Math.max(0, Math.min(totalPlies - 1, Math.round(ratio * (totalPlies - 1))));
      const ply = dashboard.game.plies[idx];
      if (!ply) return;

      const dict = COMIC_DICTIONARY[ply.classification] || COMIC_DICTIONARY['good'];
      const evalStr = ply.mate !== null && typeof ply.mate !== 'undefined'
        ? `M${Math.abs(ply.mate)}`
        : (ply.scoreCp > 0 ? `+${(ply.scoreCp / 100).toFixed(1)}` : (ply.scoreCp / 100).toFixed(1));

      tooltip.innerHTML = `
        <div class="d-flex align-items-center gap-1.5 font-monospace">
          <span class="badge border border-dark rounded-circle" style="background:${dict.bg}; color:${dict.text}; width:16px; height:16px; padding:0; display:inline-flex; align-items:center; justify-content:center; font-size:9px;">
            ${dict.symbol}
          </span>
          <span class="fw-bold">${ply.ply}. ${ply.san}</span>
          <span class="text-info fw-bold">(${evalStr})</span>
        </div>
      `;
      tooltip.classList.remove('d-none');
      const tipWidth = tooltip.offsetWidth || 120;
      const leftPos = Math.max(8, Math.min(rect.width - tipWidth - 8, relX + 10));
      tooltip.style.left = `${leftPos}px`;
      tooltip.style.top = `6px`;
    });

    canvas.addEventListener('mouseleave', () => {
      if (tooltip) tooltip.classList.add('d-none');
    });
  }
}
