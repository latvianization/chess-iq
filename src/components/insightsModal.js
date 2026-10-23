import { COMIC_DICTIONARY } from '../services/comicBadges.js';
import { clearInsights, isInsightsFresh, loadInsights, runInsights } from '../services/insightsService.js';
import { INS_COLORS, insBarChart, insDonut, insEscape, insLineChart, insScatter, insStackedBar } from './insightsCharts.js';

const INSIGHTS_MODAL_ID = 'insights-modal';
const INSIGHTS_MOVE_CLASSES = ['brilliant', 'great', 'best', 'excellent', 'good', 'inaccuracy', 'mistake', 'blunder', 'missed_win'];
const INSIGHTS_CARD_STYLE = 'background: var(--arcade-card-hover); border: 1px solid var(--arcade-border); border-radius: 0.75rem;';

function insFormatDuration(ms) {
  if (ms === null || ms === undefined) return 'estimating...';
  const minutes = Math.round(ms / 60000);
  if (minutes < 1) return 'less than a minute';
  if (minutes < 90) return `~${minutes} min`;
  return `~${(minutes / 60).toFixed(1)} h`;
}

function insFormatValue(value, suffix = '') {
  return value === null || value === undefined ? '—' : `${value}${suffix}`;
}

function insKpi(label, value, sub = '') {
  return `<div class="col-6 col-md-3">
    <div class="p-2 h-100" style="${INSIGHTS_CARD_STYLE}">
      <div class="text-secondary text-uppercase fw-bold" style="font-size: 10px; letter-spacing: 0.5px;">${label}</div>
      <div class="fw-black fs-4 font-monospace lh-1 my-1">${value}</div>
      <div class="text-secondary" style="font-size: 11px;">${sub}</div>
    </div>
  </div>`;
}

function insCard(title, body, columns = 'col-12 col-md-6') {
  return `<div class="${columns}">
    <div class="p-3 h-100" style="${INSIGHTS_CARD_STYLE}">
      <div class="fw-black small mb-2">${title}</div>
      ${body}
    </div>
  </div>`;
}

function insRecordRow(label, stats) {
  return `<div class="mb-2">
    <div class="d-flex justify-content-between small mb-1">
      <span class="fw-bold">${label}</span>
      <span class="text-secondary font-monospace">${stats.record.w}W ${stats.record.d}D ${stats.record.l}L · ${insFormatValue(stats.score, '%')}</span>
    </div>
    ${insStackedBar(stats.record)}
  </div>`;
}

function insHighlightList(items, emptyText) {
  if (items.length === 0) return `<div class="text-secondary small">${emptyText}</div>`;
  return items.map((h, idx) => `
    <div class="d-flex align-items-center justify-content-between gap-2 py-1 border-bottom" style="border-color: var(--arcade-border) !important;">
      <div class="min-w-0">
        <div class="fw-bold small text-truncate">vs ${insEscape(h.oppName)} <span class="text-secondary font-monospace">(${h.oppElo})</span></div>
        <div class="text-secondary" style="font-size: 11px;">${insEscape(h.date)} · ${h.color === 'w' ? 'White' : 'Black'} · ${h.acc}% accuracy</div>
      </div>
      <button type="button" class="btn btn-sm btn-outline-warning fw-bold py-0 px-2" data-highlight="${idx}">Review</button>
    </div>`).join('');
}

function insNotesList(notes, type, emptyText) {
  const items = notes.filter((n) => n.type === type);
  if (items.length === 0) return `<div class="text-secondary small">${emptyText}</div>`;
  const icon = type === 'strength' ? 'bi-check-circle-fill text-success' : 'bi-exclamation-triangle-fill text-danger';
  return items.map((n) => `<div class="d-flex gap-2 small mb-2"><i class="bi ${icon} mt-1"></i><span>${insEscape(n.text)}</span></div>`).join('');
}

function insOpeningsTable(openings) {
  if (openings.length === 0) return '<div class="text-secondary small">Not enough data.</div>';
  const rows = openings.map((o) => `<tr>
    <td class="text-truncate" style="max-width: 190px;">${insEscape(o.name)}</td>
    <td class="text-end font-monospace">${o.games}</td>
    <td class="text-end font-monospace">${o.record.w}/${o.record.d}/${o.record.l}</td>
    <td class="text-end font-monospace">${insFormatValue(o.score, '%')}</td>
    <td class="text-end font-monospace">${insFormatValue(o.accuracy, '%')}</td>
  </tr>`).join('');
  return `<table class="table table-sm align-middle mb-0" style="font-size: 12px;">
    <thead><tr><th>Opening</th><th class="text-end">Games</th><th class="text-end">W/D/L</th><th class="text-end">Score</th><th class="text-end">Acc</th></tr></thead>
    <tbody>${rows}</tbody></table>`;
}

function insTimeControlTable(rows) {
  if (rows.length === 0) return '<div class="text-secondary small">Not enough data.</div>';
  return rows.map((t) => insRecordRow(`${t.label} · ${t.games} games · ${insFormatValue(t.accuracy, '% acc')}`, t)).join('');
}

function insMoveQualityChart(report) {
  const items = INSIGHTS_MOVE_CLASSES.map((cls) => ({
    label: COMIC_DICTIONARY[cls]?.words[0].split(' ')[0] || cls,
    value: report.moves.totals[cls] || 0,
    color: COMIC_DICTIONARY[cls]?.bg
  }));
  return insBarChart(items, { height: 170 });
}

function insReportHtml(entry, username, partial) {
  const r = entry.report;
  const eloDiff = r.avgOpponentElo - r.avgOwnElo;
  const eloTrend = r.currentElo - r.startElo;
  const range = [r.firstDate, r.lastDate];

  const kpis = [
    insKpi('Games', r.games, `${insEscape(r.firstDate)} → ${insEscape(r.lastDate)}`),
    insKpi('Record', `${r.record.w}-${r.record.d}-${r.record.l}`, `${r.winRate}% wins · ${r.score}% score`),
    insKpi('Accuracy', `${r.avgAccuracy}%`, `Opponents: ${insFormatValue(r.avgOpponentAccuracy, '%')}`),
    insKpi('Performance', r.avgPerformanceElo, 'Avg game performance Elo'),
    insKpi('Avg rating', r.avgOwnElo, `Now ${r.currentElo} (${eloTrend >= 0 ? '+' : ''}${eloTrend}) · Peak ${r.peakElo}`),
    insKpi('Avg opponent', r.avgOpponentElo, `${eloDiff >= 0 ? '+' : ''}${eloDiff} vs your average`),
    insKpi('Game length', `${r.avgGameLength}`, 'Average moves per game'),
    insKpi('Streaks', `${r.streaks.bestWin}W / ${r.streaks.worstLoss}L`, 'Best win / worst loss streak')
  ].join('');

  const resultSlices = [
    { label: 'Wins', value: r.record.w, color: INS_COLORS.win },
    { label: 'Draws', value: r.record.d, color: INS_COLORS.draw },
    { label: 'Losses', value: r.record.l, color: INS_COLORS.loss }
  ];

  const phaseItems = ['opening', 'middlegame', 'endgame'].map((p) => ({
    label: p[0].toUpperCase() + p.slice(1),
    value: r.phaseAccuracy[p],
    color: p === 'opening' ? INS_COLORS.blue : p === 'middlegame' ? INS_COLORS.accent : INS_COLORS.win
  }));
  const phaseErrorItems = ['opening', 'middlegame', 'endgame'].map((p) => ({
    label: p[0].toUpperCase() + p.slice(1),
    value: r.phaseErrorsPer100[p],
    color: INS_COLORS.loss
  }));

  const resultColor = { w: INS_COLORS.win, d: INS_COLORS.draw, l: INS_COLORS.loss };
  const scatterPoints = r.timeline.map((t) => ({ x: t.oppElo, y: t.acc, color: resultColor[t.result] }));

  const charts = [
    insCard('Rating over time', `${insLineChart([
      { values: r.timeline.map((t) => t.ownElo), color: INS_COLORS.accent },
      { values: r.timeline.map((t) => t.oppElo), color: INS_COLORS.draw },
      { values: r.timeline.map((t) => t.perf), color: INS_COLORS.purple }
    ], { xLabels: range })}
      <div class="small text-secondary mt-1"><span style="color:${INS_COLORS.accent}">■</span> You <span style="color:${INS_COLORS.draw}">■</span> Opponent <span style="color:${INS_COLORS.purple}">■</span> Performance</div>`),
    insCard('Accuracy over time', insLineChart([
      { values: r.timeline.map((t) => t.acc), color: INS_COLORS.win }
    ], { xLabels: range, yFormat: (v) => `${Math.round(v)}%` })),
    insCard('Results', `<div class="d-flex align-items-center gap-3">
        ${insDonut(resultSlices, `${r.winRate}%`, 'win rate')}
        <div class="flex-grow-1">
          ${insRecordRow('As White', r.byColor.w)}
          ${insRecordRow('As Black', r.byColor.b)}
        </div>
      </div>`),
    insCard('Results vs opponent strength', `
      ${insRecordRow(`Stronger opponents (+50) · ${r.byOpponentStrength.stronger.games} games`, r.byOpponentStrength.stronger)}
      ${insRecordRow(`Similar rating · ${r.byOpponentStrength.equal.games} games`, r.byOpponentStrength.equal)}
      ${insRecordRow(`Weaker opponents (-50) · ${r.byOpponentStrength.weaker.games} games`, r.byOpponentStrength.weaker)}`),
    insCard('Accuracy by phase', insBarChart(phaseItems, { max: 100, unit: '%' })),
    insCard('Mistakes + blunders per 100 moves, by phase', insBarChart(phaseErrorItems)),
    insCard('Move quality totals', `${insMoveQualityChart(r)}
      <div class="small text-secondary mt-1">${r.moves.brilliantPerGame} brilliant and ${r.moves.greatPerGame} great moves per game · ${r.moves.blunderRate}% blunders · ${r.moves.mistakeRate}% mistakes</div>`),
    insCard('Accuracy vs opponent rating', `${insScatter(scatterPoints, { xLabel: 'Opponent rating', yLabel: 'Accuracy %' })}
      <div class="small text-secondary mt-1"><span style="color:${INS_COLORS.win}">●</span> Win <span style="color:${INS_COLORS.draw}">●</span> Draw <span style="color:${INS_COLORS.loss}">●</span> Loss</div>`),
    insCard('Accuracy distribution (games)', insBarChart(r.accuracyHistogram, { color: INS_COLORS.blue })),
    insCard('Time controls', insTimeControlTable(r.byTimeControl)),
    insCard('Most played openings', insOpeningsTable(r.openings), 'col-12')
  ].join('');

  return `
    <div class="d-flex align-items-start justify-content-between gap-2 mb-3">
      <div>
        <h5 class="fw-black mb-0"><i class="bi bi-graph-up-arrow text-warning me-1"></i>In-depth Insights · ${insEscape(username)}</h5>
        <div class="text-secondary small">${partial ? 'Partial report (analysis stopped early)' : `Updated ${new Date(entry.generatedAt).toLocaleString()}`} · ${r.games} games analyzed at deep engine depth</div>
      </div>
      <div class="d-flex gap-2 flex-shrink-0">
        <button type="button" class="btn btn-sm btn-outline-warning fw-bold" id="insights-refresh"><i class="bi bi-arrow-repeat me-1"></i>${partial ? 'Continue' : 'Refresh'}</button>
        <button type="button" class="btn btn-sm btn-outline-danger fw-bold" id="insights-clear"><i class="bi bi-trash3 me-1"></i>Clear</button>
        <button type="button" class="btn-close" id="insights-close" aria-label="Close"></button>
      </div>
    </div>
    <div class="row g-2 mb-3">${kpis}</div>
    <div class="row g-3 mb-3">
      ${insCard('<i class="bi bi-check-circle-fill text-success me-1"></i>Strengths', insNotesList(r.notes, 'strength', 'Play more games to reveal strengths.'))}
      ${insCard('<i class="bi bi-exclamation-triangle-fill text-danger me-1"></i>Weaknesses', insNotesList(r.notes, 'weakness', 'No clear weaknesses found.'))}
    </div>
    <div class="row g-3 mb-3">${charts}</div>
    <div class="row g-3">
      ${insCard('<i class="bi bi-trophy-fill text-warning me-1"></i>Best wins (highest-rated opponents)', `<div data-list="wins">${insHighlightList(r.bestWins, 'No wins yet.')}</div>`)}
      ${insCard('<i class="bi bi-emoji-frown-fill text-danger me-1"></i>Worst losses (lowest-rated opponents)', `<div data-list="losses">${insHighlightList(r.worstLosses, 'No losses. Impressive!')}</div>`)}
      ${insCard('Most accurate game', `<div data-list="best">${insHighlightList([r.bestAccuracyGame], '')}</div>`)}
      ${insCard('Least accurate game', `<div data-list="worst">${insHighlightList([r.worstAccuracyGame], '')}</div>`)}
    </div>`;
}

function insProgressHtml(username, hasReport) {
  return `
    <div class="text-center py-5 px-3">
      <div class="spinner-border text-warning mb-3" style="width: 3rem; height: 3rem;" role="status"></div>
      <h5 class="fw-black mb-1">Analyzing last 100 games for ${insEscape(username)}</h5>
      <p class="text-secondary small mb-3" id="insights-status">Fetching games...</p>
      <div class="progress mx-auto mb-2" style="max-width: 420px; height: 12px;">
        <div class="progress-bar progress-bar-striped progress-bar-animated bg-warning" id="insights-bar" style="width: 3%"></div>
      </div>
      <div class="small font-monospace text-secondary mb-3" id="insights-eta"></div>
      <p class="text-secondary small mx-auto" style="max-width: 440px;">Deep analysis takes a while. Finished games are saved as they complete, so you can stop and continue later.</p>
      <button type="button" class="btn btn-outline-secondary fw-bold" id="insights-stop">${hasReport ? 'Stop and view report' : 'Stop'}</button>
    </div>`;
}

export function closeInsights() {
  document.getElementById(INSIGHTS_MODAL_ID)?.remove();
}

export async function openInsights({ platform, username, onSelectGame }) {
  closeInsights();

  const overlay = document.createElement('div');
  overlay.className = 'why-modal-backdrop';
  overlay.id = INSIGHTS_MODAL_ID;
  overlay.innerHTML = '<div class="why-dialog p-3 p-md-4 shadow-lg" id="insights-dialog" style="max-width: 1040px; width: 100%; max-height: 94vh; overflow-y: auto; border-radius: 1.25rem; background: var(--arcade-card); border: 1px solid var(--arcade-border);"></div>';
  document.body.appendChild(overlay);
  const dialog = overlay.querySelector('#insights-dialog');

  let cancelRequested = false;
  let activeEntry = null;

  const bindReport = (entry, partial) => {
    activeEntry = entry;
    dialog.innerHTML = insReportHtml(entry, username, partial);
    dialog.querySelector('#insights-close')?.addEventListener('click', closeInsights);
    dialog.querySelector('#insights-refresh')?.addEventListener('click', () => startRun(true));
    dialog.querySelector('#insights-clear')?.addEventListener('click', () => {
      clearInsights(platform, username);
      closeInsights();
    });

    const groups = {
      wins: entry.report.bestWins,
      losses: entry.report.worstLosses,
      best: [entry.report.bestAccuracyGame],
      worst: [entry.report.worstAccuracyGame]
    };
    dialog.querySelectorAll('[data-list]').forEach((listEl) => {
      listEl.querySelectorAll('[data-highlight]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const item = groups[listEl.dataset.list][Number(btn.dataset.highlight)];
          closeInsights();
          if (item && onSelectGame) onSelectGame(item.pgn, item.color);
        });
      });
    });
  };

  const showMessage = (html) => {
    dialog.innerHTML = `<div class="text-center py-5">${html}
      <div class="mt-3"><button type="button" class="btn btn-outline-secondary fw-bold" id="insights-close">Close</button></div></div>`;
    dialog.querySelector('#insights-close')?.addEventListener('click', closeInsights);
  };

  const updateStatus = (status) => {
    const statusEl = dialog.querySelector('#insights-status');
    const barEl = dialog.querySelector('#insights-bar');
    const etaEl = dialog.querySelector('#insights-eta');
    if (!statusEl || status.stage === 'fetching') return;
    const done = status.done;
    const plyFraction = status.plyTotal ? status.ply / status.plyTotal : 0;
    const progress = status.total ? ((done + plyFraction) / status.total) * 100 : 0;
    statusEl.textContent = `Game ${done + 1} of ${status.total}: vs ${status.game.white.toLowerCase() === username.trim().toLowerCase() ? status.game.black : status.game.white}${status.plyTotal ? ` · move ${Math.ceil(status.ply / 2)}/${Math.ceil(status.plyTotal / 2)}` : ''}`;
    if (barEl) barEl.style.width = `${Math.max(3, progress)}%`;
    if (etaEl) etaEl.textContent = `Time remaining: ${insFormatDuration(status.etaMs)}`;
  };

  const startRun = async (force) => {
    cancelRequested = false;
    dialog.innerHTML = insProgressHtml(username, Boolean(activeEntry?.report));
    dialog.querySelector('#insights-stop')?.addEventListener('click', () => {
      cancelRequested = true;
      const stopBtn = dialog.querySelector('#insights-stop');
      if (stopBtn) stopBtn.disabled = true;
    });

    try {
      const { entry, cancelled } = await runInsights({
        platform,
        username,
        force,
        onStatus: updateStatus,
        shouldCancel: () => cancelRequested || !document.getElementById(INSIGHTS_MODAL_ID)
      });
      if (!document.getElementById(INSIGHTS_MODAL_ID)) return;
      if (entry.report) bindReport(entry, cancelled);
      else showMessage('<i class="bi bi-info-circle fs-1 text-secondary"></i><p class="mt-2 mb-0">No analyzable rated games were found for this player.</p>');
    } catch (err) {
      if (!document.getElementById(INSIGHTS_MODAL_ID)) return;
      showMessage(`<i class="bi bi-exclamation-octagon fs-1 text-danger"></i><p class="mt-2 mb-0">${insEscape(err.message || 'Failed to build insights.')}</p>`);
    }
  };

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay && !dialog.querySelector('#insights-stop')) closeInsights();
  });

  const cached = loadInsights(platform, username);
  if (isInsightsFresh(cached)) {
    bindReport(cached, false);
  } else {
    activeEntry = cached;
    startRun(false);
  }
}
