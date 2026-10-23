const INS_COLORS = {
  win: '#10b981',
  draw: '#94a3b8',
  loss: '#f43f5e',
  accent: '#fbbf24',
  blue: '#3b82f6',
  purple: '#8b5cf6'
};

function insEscape(text) {
  return String(text ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function insScale(value, min, max, outMin, outMax) {
  if (max === min) return (outMin + outMax) / 2;
  return outMin + ((value - min) / (max - min)) * (outMax - outMin);
}

function insLineChart(series, { height = 160, yFormat = (v) => Math.round(v), xLabels = [] } = {}) {
  const width = 400;
  const pad = { left: 38, right: 10, top: 10, bottom: 22 };
  const allValues = series.flatMap((s) => s.values).filter((v) => typeof v === 'number');
  if (allValues.length < 2) return '<div class="text-secondary small">Not enough data.</div>';

  const rawMin = Math.min(...allValues);
  const rawMax = Math.max(...allValues);
  const margin = Math.max((rawMax - rawMin) * 0.1, 1);
  const yMin = rawMin - margin;
  const yMax = rawMax + margin;
  const count = Math.max(...series.map((s) => s.values.length));
  const xAt = (i) => insScale(i, 0, count - 1, pad.left, width - pad.right);
  const yAt = (v) => insScale(v, yMin, yMax, height - pad.bottom, pad.top);

  const grid = [0, 0.5, 1].map((t) => {
    const value = yMin + (yMax - yMin) * t;
    const y = yAt(value);
    return `<line x1="${pad.left}" x2="${width - pad.right}" y1="${y}" y2="${y}" stroke="currentColor" stroke-opacity="0.12"/>
      <text x="${pad.left - 5}" y="${y + 3}" text-anchor="end" font-size="9" fill="currentColor" fill-opacity="0.6">${yFormat(value)}</text>`;
  }).join('');

  const lines = series.map((s) => {
    const points = s.values.map((v, i) => (typeof v === 'number' ? `${xAt(i).toFixed(1)},${yAt(v).toFixed(1)}` : null)).filter(Boolean);
    return `<polyline points="${points.join(' ')}" fill="none" stroke="${s.color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
  }).join('');

  const labels = xLabels.length === 2
    ? `<text x="${pad.left}" y="${height - 6}" font-size="9" fill="currentColor" fill-opacity="0.6">${insEscape(xLabels[0])}</text>
       <text x="${width - pad.right}" y="${height - 6}" text-anchor="end" font-size="9" fill="currentColor" fill-opacity="0.6">${insEscape(xLabels[1])}</text>`
    : '';

  return `<svg viewBox="0 0 ${width} ${height}" width="100%" role="img">${grid}${lines}${labels}</svg>`;
}

function insBarChart(items, { height = 150, max = null, unit = '', color = INS_COLORS.accent } = {}) {
  if (items.length === 0) return '<div class="text-secondary small">Not enough data.</div>';
  const width = 400;
  const pad = { left: 10, right: 10, top: 18, bottom: 24 };
  const peak = max ?? Math.max(...items.map((i) => i.value ?? 0), 1);
  const slot = (width - pad.left - pad.right) / items.length;
  const barWidth = Math.min(46, slot * 0.6);

  const bars = items.map((item, idx) => {
    const value = item.value ?? 0;
    const barHeight = insScale(value, 0, peak, 0, height - pad.top - pad.bottom);
    const x = pad.left + slot * idx + (slot - barWidth) / 2;
    const y = height - pad.bottom - barHeight;
    return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barWidth.toFixed(1)}" height="${Math.max(barHeight, 1).toFixed(1)}" rx="4" fill="${item.color || color}"/>
      <text x="${(x + barWidth / 2).toFixed(1)}" y="${(y - 4).toFixed(1)}" text-anchor="middle" font-size="10" font-weight="700" fill="currentColor">${item.value === null || item.value === undefined ? '—' : `${item.value}${unit}`}</text>
      <text x="${(x + barWidth / 2).toFixed(1)}" y="${height - 8}" text-anchor="middle" font-size="9" fill="currentColor" fill-opacity="0.7">${insEscape(item.label)}</text>`;
  }).join('');

  return `<svg viewBox="0 0 ${width} ${height}" width="100%" role="img">${bars}</svg>`;
}

function insDonut(slices, centerLabel = '', centerSub = '') {
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) return '<div class="text-secondary small">Not enough data.</div>';
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  const arcs = slices.filter((s) => s.value > 0).map((s) => {
    const length = (s.value / total) * circumference;
    const arc = `<circle cx="60" cy="60" r="${radius}" fill="none" stroke="${s.color}" stroke-width="16"
      stroke-dasharray="${length.toFixed(2)} ${(circumference - length).toFixed(2)}" stroke-dashoffset="${(-offset).toFixed(2)}" transform="rotate(-90 60 60)"/>`;
    offset += length;
    return arc;
  }).join('');

  return `<svg viewBox="0 0 120 120" width="100%" style="max-width:150px" role="img">${arcs}
    <text x="60" y="60" text-anchor="middle" font-size="16" font-weight="800" fill="currentColor">${insEscape(centerLabel)}</text>
    <text x="60" y="74" text-anchor="middle" font-size="8" fill="currentColor" fill-opacity="0.65">${insEscape(centerSub)}</text></svg>`;
}

function insScatter(points, { height = 170, xLabel = '', yLabel = '' } = {}) {
  if (points.length < 2) return '<div class="text-secondary small">Not enough data.</div>';
  const width = 400;
  const pad = { left: 38, right: 10, top: 10, bottom: 26 };
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const xMin = Math.min(...xs) - 20;
  const xMax = Math.max(...xs) + 20;
  const yMin = Math.max(0, Math.min(...ys) - 5);
  const yMax = Math.min(100, Math.max(...ys) + 5);

  const dots = points.map((p) => {
    const cx = insScale(p.x, xMin, xMax, pad.left, width - pad.right);
    const cy = insScale(p.y, yMin, yMax, height - pad.bottom, pad.top);
    return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="4" fill="${p.color}" fill-opacity="0.8"/>`;
  }).join('');

  const axis = `<line x1="${pad.left}" x2="${width - pad.right}" y1="${height - pad.bottom}" y2="${height - pad.bottom}" stroke="currentColor" stroke-opacity="0.25"/>
    <line x1="${pad.left}" x2="${pad.left}" y1="${pad.top}" y2="${height - pad.bottom}" stroke="currentColor" stroke-opacity="0.25"/>
    <text x="${pad.left}" y="${height - 14}" font-size="9" fill="currentColor" fill-opacity="0.6">${Math.round(xMin)}</text>
    <text x="${width - pad.right}" y="${height - 14}" text-anchor="end" font-size="9" fill="currentColor" fill-opacity="0.6">${Math.round(xMax)}</text>
    <text x="${(pad.left + width - pad.right) / 2}" y="${height - 3}" text-anchor="middle" font-size="9" fill="currentColor" fill-opacity="0.7">${insEscape(xLabel)}</text>
    <text x="${pad.left - 5}" y="${pad.top + 8}" text-anchor="end" font-size="9" fill="currentColor" fill-opacity="0.6">${Math.round(yMax)}</text>
    <text x="${pad.left - 5}" y="${height - pad.bottom}" text-anchor="end" font-size="9" fill="currentColor" fill-opacity="0.6">${Math.round(yMin)}</text>
    <text x="4" y="${height / 2}" font-size="9" fill="currentColor" fill-opacity="0.7" transform="rotate(-90 4 ${height / 2})">${insEscape(yLabel)}</text>`;

  return `<svg viewBox="0 0 ${width} ${height}" width="100%" role="img">${axis}${dots}</svg>`;
}

function insStackedBar(record) {
  const total = record.w + record.d + record.l;
  if (total === 0) return '<div class="text-secondary small">—</div>';
  const part = (value, color) => (value > 0
    ? `<div style="width:${(value / total) * 100}%;background:${color}" title="${value}"></div>`
    : '');
  return `<div class="d-flex rounded-pill overflow-hidden" style="height:10px;background:rgba(128,128,128,0.15)">
    ${part(record.w, INS_COLORS.win)}${part(record.d, INS_COLORS.draw)}${part(record.l, INS_COLORS.loss)}</div>`;
}
