// Weeks — your life in weeks, one dot per week.
// No build step, no server, no storage: the whole state is the URL query string.

const DAY = 86_400_000;
const WEEK = 7 * DAY;

const COLORS = {
  past: '#5b2fa3',
  future: '#ff4370',
  today: '#30f0ff',
  bg: '#1a0b2e',
};

// Default colours offered to new periods, in fixed order. Validated (all pairs,
// dark surface, incl. past/future) for colour-vision deficiency separation.
const PRESET = ['#ffb340', '#22c9a8', '#4f9df9', '#f0f0f5', '#b45309'];

const DEFAULT_YEARS = 80;

// ---------------------------------------------------------------------------
// Dates. Every date is a UTC-midnight timestamp so that day arithmetic is exact
// regardless of the viewer's time zone or daylight-saving transitions.
// ---------------------------------------------------------------------------

function parseISO(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
  if (!m) return null;
  const [y, mo, d] = [+m[1], +m[2], +m[3]];
  const t = Date.UTC(y, mo - 1, d);
  const back = new Date(t);
  // Reject dates that "rolled over" (e.g. 2023-02-31 -> March 3rd).
  if (back.getUTCFullYear() !== y || back.getUTCMonth() !== mo - 1 || back.getUTCDate() !== d) return null;
  return t;
}

function toISO(t) {
  return new Date(t).toISOString().slice(0, 10);
}

function todayUTC() {
  const d = new Date();
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
}

function addYears(t, years) {
  const d = new Date(t);
  return Date.UTC(d.getUTCFullYear() + years, d.getUTCMonth(), d.getUTCDate());
}

function ageAt(birth, t) {
  const b = new Date(birth), d = new Date(t);
  let age = d.getUTCFullYear() - b.getUTCFullYear();
  const beforeBirthday =
    d.getUTCMonth() < b.getUTCMonth() ||
    (d.getUTCMonth() === b.getUTCMonth() && d.getUTCDate() < b.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age;
}

const fmtDate = new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
const fmtInt = new Intl.NumberFormat(undefined);

// ---------------------------------------------------------------------------
// State <-> URL
//   ?b=1990-01-01&l=80&r=2008-09-01~2013-06-30~ffb340~University&r=...
//   A period is start~end~rrggbb~label; empty end means "still ongoing".
// ---------------------------------------------------------------------------

const state = {
  birth: null,       // UTC ts | null
  years: DEFAULT_YEARS,
  ranges: [],        // { start: ts|null, end: ts|null, color: '#rrggbb', label: string }
};

function readURL() {
  const p = new URLSearchParams(location.search);
  state.birth = parseISO(p.get('b'));
  const l = parseInt(p.get('l'), 10);
  state.years = Number.isFinite(l) ? clamp(l, 1, 150) : DEFAULT_YEARS;
  state.ranges = p.getAll('r').map(decodeRange).filter(Boolean);
}

function decodeRange(s) {
  const [start, end, color, ...rest] = s.split('~');
  const st = parseISO(start);
  if (st === null) return null;
  const en = end ? parseISO(end) : null;
  const col = /^[0-9a-f]{6}$/i.test(color) ? '#' + color.toLowerCase() : PRESET[0];
  return { start: st, end: en, color: col, label: rest.join('~') };
}

function writeURL() {
  const parts = [];
  if (state.birth !== null) parts.push('b=' + toISO(state.birth));
  if (state.years !== DEFAULT_YEARS) parts.push('l=' + state.years);
  for (const r of state.ranges) {
    if (r.start === null) continue;
    parts.push('r=' + [
      toISO(r.start),
      r.end === null ? '' : toISO(r.end),
      r.color.slice(1),
      encodeURIComponent(r.label).replace(/~/g, '%7E'),
    ].join('~'));
  }
  const qs = parts.length ? '?' + parts.join('&') : '';
  history.replaceState(null, '', location.pathname + qs + location.hash);
}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// ---------------------------------------------------------------------------
// Model: which week is which colour
// ---------------------------------------------------------------------------

function computeModel() {
  if (state.birth === null) return null;
  const birth = state.birth;
  const death = addYears(birth, state.years);
  const total = Math.max(1, Math.floor((death - birth) / WEEK));
  const today = todayUTC();
  const weekOf = (t) => Math.floor((t - birth) / WEEK);
  const cur = weekOf(today);             // may be < 0 or >= total

  const colors = new Array(total);
  for (let i = 0; i < total; i++) colors[i] = i < cur ? COLORS.past : COLORS.future;

  // Period coverage, in list order so later periods paint over earlier ones.
  const covering = new Array(total);     // week -> [range, ...] for the tooltip
  for (const r of state.ranges) {
    if (r.start === null) continue;
    const endT = r.end === null ? today : r.end;
    if (endT < r.start) continue;
    const a = clamp(weekOf(r.start), 0, total - 1);
    const b = clamp(weekOf(endT), 0, total - 1);
    if (weekOf(endT) < 0 || weekOf(r.start) > total - 1) continue;
    for (let i = a; i <= b; i++) {
      colors[i] = r.color;
      (covering[i] ||= []).push(r);
    }
  }

  const lived = clamp(cur, 0, total);
  return { birth, death, total, today, cur, lived, left: total - lived, colors, covering, weekOf };
}

// ---------------------------------------------------------------------------
// Layout: the densest grid of n square cells that fits a W x H box.
// Iterating over column counts is O(n) with n ~ 4–8k — instant.
// ---------------------------------------------------------------------------

function bestGrid(n, W, H) {
  let best = { cols: 1, rows: n, cell: 0 };
  for (let cols = 1; cols <= n; cols++) {
    const rows = Math.ceil(n / cols);
    const cell = Math.min(W / cols, H / rows);
    if (cell > best.cell) best = { cols, rows, cell };
    if (W / cols < best.cell) break;          // cells only get narrower from here
  }
  return best;
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

const canvas = document.getElementById('grid');
const ctx = canvas.getContext('2d');
const statsEl = document.getElementById('stats');
const legendEl = document.getElementById('legend');
const tipEl = document.getElementById('tip');

let model = null;
let geo = null;   // { ox, oy, cols, rows, cell, r } of the last draw, for hit-testing

function draw() {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const w = Math.max(1, Math.round(rect.width));
  const h = Math.max(1, Math.round(rect.height));
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  geo = null;

  if (!model) {
    ctx.fillStyle = 'rgba(244,239,250,0.5)';
    ctx.font = '500 15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Set your date of birth to see your weeks', w / 2, h / 2);
    return;
  }

  const pad = 14;
  const top = 30;                          // room for the TODAY flag on row 0
  const W = Math.max(1, w - pad * 2);
  const H = Math.max(1, h - pad - top);
  const { cols, rows, cell } = bestGrid(model.total, W, H);
  const ox = pad + (W - cols * cell) / 2;
  const oy = top + (H - rows * cell) / 2;
  const r = cell * 0.36;
  geo = { ox, oy, cols, rows, cell, r };

  // Group dots by colour so the canvas changes fillStyle a handful of times, not thousands.
  const groups = new Map();
  for (let i = 0; i < model.total; i++) {
    const c = model.colors[i];
    let arr = groups.get(c);
    if (!arr) groups.set(c, (arr = []));
    arr.push(i);
  }
  for (const [color, idx] of groups) {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (const i of idx) {
      const cx = ox + (i % cols) * cell + cell / 2;
      const cy = oy + Math.floor(i / cols) * cell + cell / 2;
      ctx.moveTo(cx + r, cy);
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
    }
    ctx.fill();
  }

  // Today: a brighter dot with a glow and a small flag.
  const t = model.cur;
  if (t >= 0 && t < model.total) {
    const cx = ox + (t % cols) * cell + cell / 2;
    const cy = oy + Math.floor(t / cols) * cell + cell / 2;
    ctx.save();
    ctx.shadowColor = COLORS.today;
    ctx.shadowBlur = Math.max(6, r * 2.5);
    ctx.fillStyle = COLORS.today;
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(r * 1.15, 2.2), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    drawFlag(cx, cy, r, w);
  }
}

function drawFlag(cx, cy, r, w) {
  const label = 'TODAY';
  ctx.font = '700 11px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const tw = ctx.measureText(label).width;
  const bw = tw + 16, bh = 20, tri = 5, gap = 4;
  const above = cy - r - gap - tri - bh >= 2;
  const by = above ? cy - r - gap - tri - bh : cy + r + gap + tri;
  const bx = clamp(cx - bw / 2, 4, w - bw - 4);

  ctx.fillStyle = COLORS.bg;
  ctx.strokeStyle = COLORS.future;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, bh, 4);
  ctx.fill();
  ctx.stroke();

  // pointer triangle
  ctx.beginPath();
  if (above) {
    ctx.moveTo(cx - tri, by + bh);
    ctx.lineTo(cx + tri, by + bh);
    ctx.lineTo(cx, by + bh + tri);
  } else {
    ctx.moveTo(cx - tri, by);
    ctx.lineTo(cx + tri, by);
    ctx.lineTo(cx, by - tri);
  }
  ctx.closePath();
  ctx.fillStyle = COLORS.future;
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.fillText(label, bx + bw / 2, by + bh / 2 + 0.5);
}

function renderStats() {
  if (!model) {
    statsEl.innerHTML = 'One dot per week. <b>Tap the button to begin.</b>';
    legendEl.replaceChildren();
    return;
  }
  const pct = Math.round((model.lived / model.total) * 100);
  statsEl.innerHTML =
    `<b>${fmtInt.format(model.lived)}</b> weeks lived · ` +
    `<b>${fmtInt.format(model.left)}</b> left · ` +
    `${pct}% of ${fmtInt.format(model.total)}`;

  legendEl.replaceChildren(...state.ranges
    .filter(r => r.start !== null)
    .map(r => {
      const li = document.createElement('li');
      li.style.setProperty('--c', r.color);
      li.textContent = r.label || `${fmtDate.format(r.start)} – ${r.end === null ? 'now' : fmtDate.format(r.end)}`;
      return li;
    }));
}

function render() {
  model = computeModel();
  renderStats();
  writeURL();
  // The footer may have wrapped to a new line; let layout settle before measuring.
  requestAnimationFrame(draw);
}

// Redraw whenever the canvas box changes (rotation, address-bar collapse, resize).
let raf = 0;
new ResizeObserver(() => {
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(draw);
}).observe(canvas);

// ---------------------------------------------------------------------------
// Tooltip (hover on desktop, tap on touch)
// ---------------------------------------------------------------------------

function weekAtPoint(clientX, clientY) {
  if (!geo || !model) return -1;
  const rect = canvas.getBoundingClientRect();
  const x = clientX - rect.left - geo.ox;
  const y = clientY - rect.top - geo.oy;
  if (x < 0 || y < 0) return -1;
  const col = Math.floor(x / geo.cell), row = Math.floor(y / geo.cell);
  if (col >= geo.cols || row >= geo.rows) return -1;
  const i = row * geo.cols + col;
  return i < model.total ? i : -1;
}

function showTip(i, clientX, clientY) {
  const start = model.birth + i * WEEK;
  const end = start + 6 * DAY;
  const status = i < model.cur ? 'lived' : i === model.cur ? 'this week' : 'ahead';
  const tags = (model.covering[i] || [])
    .map(r => `<span style="--c:${r.color}">${escapeHTML(r.label || 'Untitled period')}</span>`)
    .join('');
  tipEl.innerHTML =
    `<b>Week ${fmtInt.format(i + 1)}</b> of ${fmtInt.format(model.total)} · ${status}<br>` +
    `${fmtDate.format(start)} – ${fmtDate.format(end)} · age ${ageAt(model.birth, start)}` +
    (tags ? `<div class="tags">${tags}</div>` : '');
  tipEl.hidden = false;
  const tw = tipEl.offsetWidth, th = tipEl.offsetHeight;
  const x = clamp(clientX + 14, 8, window.innerWidth - tw - 8);
  const y = clientY + 18 + th > window.innerHeight - 8 ? clientY - th - 12 : clientY + 18;
  tipEl.style.left = x + 'px';
  tipEl.style.top = y + 'px';
}

function hideTip() { tipEl.hidden = true; }

let tipTimer = 0;
canvas.addEventListener('pointermove', (e) => {
  if (e.pointerType === 'touch') return;
  const i = weekAtPoint(e.clientX, e.clientY);
  i < 0 ? hideTip() : showTip(i, e.clientX, e.clientY);
});
canvas.addEventListener('pointerleave', hideTip);
canvas.addEventListener('pointerdown', (e) => {
  if (e.pointerType !== 'touch') return;
  const i = weekAtPoint(e.clientX, e.clientY);
  clearTimeout(tipTimer);
  if (i < 0) return hideTip();
  showTip(i, e.clientX, e.clientY);
  tipTimer = setTimeout(hideTip, 2500);
});

function escapeHTML(s) {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ---------------------------------------------------------------------------
// Settings panel
// ---------------------------------------------------------------------------

const panel = document.getElementById('panel');
const fab = document.getElementById('fab');
const birthIn = document.getElementById('birth');
const yearsIn = document.getElementById('years');
const totalHint = document.getElementById('total-hint');
const rangesEl = document.getElementById('ranges');
const rowTpl = document.getElementById('range-row');

function openPanel() {
  syncForm();
  panel.hidden = false;
  fab.setAttribute('aria-expanded', 'true');
  hideTip();
  (state.birth === null ? birthIn : document.getElementById('close')).focus({ preventScroll: true });
}

function closePanel() {
  panel.hidden = true;
  fab.setAttribute('aria-expanded', 'false');
  fab.focus({ preventScroll: true });
}

function syncForm() {
  birthIn.value = state.birth === null ? '' : toISO(state.birth);
  birthIn.max = toISO(todayUTC());
  yearsIn.value = state.years;
  updateTotalHint();
  rangesEl.replaceChildren(...state.ranges.map(buildRow));
  if (!state.ranges.length) {
    const p = document.createElement('p');
    p.className = 'empty';
    p.textContent = 'No periods yet.';
    rangesEl.append(p);
  }
}

function updateTotalHint() {
  if (state.birth === null) { totalHint.textContent = ''; return; }
  const m = computeModel();
  totalHint.textContent = `${fmtInt.format(m.total)} weeks in total; ${fmtInt.format(m.left)} still ahead.`;
}

function buildRow(r) {
  const li = rowTpl.content.firstElementChild.cloneNode(true);
  const color = li.querySelector('.r-color');
  const label = li.querySelector('.r-label');
  const start = li.querySelector('.r-start');
  const end = li.querySelector('.r-end');

  color.value = r.color;
  label.value = r.label;
  start.value = r.start === null ? '' : toISO(r.start);
  end.value = r.end === null ? '' : toISO(r.end);

  color.addEventListener('input', () => { r.color = color.value; render(); });
  label.addEventListener('input', () => { r.label = label.value; render(); });
  start.addEventListener('change', () => { r.start = parseISO(start.value); render(); });
  end.addEventListener('change', () => { r.end = parseISO(end.value); render(); });
  li.querySelector('.r-del').addEventListener('click', () => {
    state.ranges.splice(state.ranges.indexOf(r), 1);
    syncForm();
    render();
  });
  return li;
}

birthIn.addEventListener('change', () => {
  state.birth = parseISO(birthIn.value);
  updateTotalHint();
  render();
});

yearsIn.addEventListener('input', () => {
  const v = parseInt(yearsIn.value, 10);
  if (!Number.isFinite(v)) return;
  state.years = clamp(v, 1, 150);
  updateTotalHint();
  render();
});

document.getElementById('add').addEventListener('click', () => {
  const used = new Set(state.ranges.map(r => r.color));
  const color = PRESET.find(c => !used.has(c)) || PRESET[state.ranges.length % PRESET.length];
  const today = todayUTC();
  const r = { start: addYears(today, -1), end: null, color, label: '' };
  state.ranges.push(r);
  syncForm();
  render();
  rangesEl.lastElementChild.querySelector('.r-label').focus({ preventScroll: true });
  rangesEl.lastElementChild.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
});

document.getElementById('copy').addEventListener('click', async (e) => {
  const btn = e.currentTarget;
  const old = btn.textContent;
  try {
    await navigator.clipboard.writeText(location.href);
    btn.textContent = 'Copied!';
  } catch {
    // Clipboard blocked (insecure context or permission) — fall back to a prompt-free selection.
    btn.textContent = 'Copy from the address bar';
  }
  setTimeout(() => { btn.textContent = old; }, 1800);
});

document.getElementById('reset').addEventListener('click', () => {
  state.birth = null;
  state.years = DEFAULT_YEARS;
  state.ranges = [];
  syncForm();
  render();
  birthIn.focus({ preventScroll: true });
});

fab.addEventListener('click', openPanel);
document.getElementById('close').addEventListener('click', closePanel);
document.getElementById('backdrop').addEventListener('click', closePanel);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !panel.hidden) closePanel();
});

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

readURL();
render();
if (state.birth === null) openPanel();

// Midnight rollover: if the tab stays open past the week boundary, refresh "today".
setInterval(() => {
  if (model && todayUTC() !== model.today) render();
}, 60_000);
