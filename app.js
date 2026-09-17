// Weeks — your life in weeks, one dot per week.
// No build step, no server, no storage: the whole state is the URL query string.

const DAY = 86_400_000;
const WEEK = 7 * DAY;
const DEFAULT_YEARS = 80;
const DEFAULT_THEME = 'dusk';

// Each theme: surfaces, ink, the past/future base dots, the "today" dot, the
// accent used for the FAB / buttons / TODAY flag, and the default colours
// offered to new periods and dates. Every preset list was validated all-pairs
// (together with past + future, on that theme's background) for colour-vision
// deficiency and normal-vision separation.
const THEMES = {
  dusk:  { name: 'Dusk',  bg: '#1a0b2e', panel: '#24123d', ink: '#f4effa', past: '#5b2fa3', future: '#ff4370', today: '#30f0ff', accent: '#ff4370', onAccent: '#ffffff',
           presets: ['#ffb340', '#22c9a8', '#4f9df9', '#f0f0f5', '#b45309'] },
  slate: { name: 'Slate', bg: '#2e3440', panel: '#3b4252', ink: '#eceff4', past: '#4c566a', future: '#d8dee9', today: '#88c0d0', accent: '#88c0d0', onAccent: '#2e3440',
           presets: ['#c1666b', '#5b8def', '#e6b450', '#5fb3a1'] },
  moss:  { name: 'Moss',  bg: '#121c17', panel: '#1a2721', ink: '#e8efe9', past: '#2f4a3f', future: '#d9e2d3', today: '#f5d76e', accent: '#8fbf9f', onAccent: '#121c17',
           presets: ['#c1666b', '#d4a017', '#5b8def', '#5fb3a1'] },
  ink:   { name: 'Ink',   bg: '#141418', panel: '#1c1c22', ink: '#ececf0', past: '#2c2c34', future: '#b8b8c4', today: '#ff7a59', accent: '#ff7a59', onAccent: '#141418',
           presets: ['#d4a017', '#5b8def', '#3fa7a0', '#bf616a', '#eceff4'] },
  paper: { name: 'Paper', bg: '#f5f0e6', panel: '#fffdf8', ink: '#2a2a33', past: '#d3c9b8', future: '#3b3946', today: '#d9534f', accent: '#d9534f', onAccent: '#ffffff', light: true,
           presets: ['#2f6b2f', '#a67c00', '#4f74a8', '#b0417a', '#7c3aed'] },
};

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

const toISO = (t) => new Date(t).toISOString().slice(0, 10);

function todayUTC() {
  const d = new Date();
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
}

function addYears(t, years) {
  const d = new Date(t);
  return Date.UTC(d.getUTCFullYear() + years, d.getUTCMonth(), d.getUTCDate());
}

const daysInMonth = (y, m1) => new Date(Date.UTC(y, m1, 0)).getUTCDate();   // m1 = 1..12

function ageAt(birth, t) {
  const b = new Date(birth), d = new Date(t);
  let age = d.getUTCFullYear() - b.getUTCFullYear();
  const beforeBirthday =
    d.getUTCMonth() < b.getUTCMonth() ||
    (d.getUTCMonth() === b.getUTCMonth() && d.getUTCDate() < b.getUTCDate());
  return beforeBirthday ? age - 1 : age;
}

const fmtDate = new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
const fmtMonth = new Intl.DateTimeFormat(undefined, { month: 'short', timeZone: 'UTC' });
const fmtInt = new Intl.NumberFormat(undefined);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// ---------------------------------------------------------------------------
// State <-> URL
//   ?b=1990-01-01&l=80&t=slate
//    &r=2008-09-01~2013-06-30~ffb340~University   (period; empty end = ongoing)
//    &d=2015-08-22~22c9a8~Wedding                 (single date, drawn as a ring)
// ---------------------------------------------------------------------------

const state = {
  birth: null,        // UTC ts | null
  years: DEFAULT_YEARS,
  theme: DEFAULT_THEME,
  ranges: [],         // { start: ts|null, end: ts|null, color, label }
  events: [],         // { date: ts, color, label }
};

const theme = () => THEMES[state.theme];

function readURL() {
  const p = new URLSearchParams(location.search);
  state.birth = parseISO(p.get('b'));
  const l = parseInt(p.get('l'), 10);
  state.years = Number.isFinite(l) ? clamp(l, 1, 150) : DEFAULT_YEARS;
  state.theme = THEMES[p.get('t')] ? p.get('t') : DEFAULT_THEME;
  state.ranges = p.getAll('r').map(decodeRange).filter(Boolean);
  state.events = p.getAll('d').map(decodeEvent).filter(Boolean);
}

const parseColor = (c, fallback) => /^[0-9a-f]{6}$/i.test(c || '') ? '#' + c.toLowerCase() : fallback;

function decodeRange(s) {
  const [start, end, color, ...rest] = s.split('~');
  const st = parseISO(start);
  if (st === null) return null;
  return { start: st, end: end ? parseISO(end) : null, color: parseColor(color, theme().presets[0]), label: rest.join('~') };
}

function decodeEvent(s) {
  const [date, color, ...rest] = s.split('~');
  const t = parseISO(date);
  if (t === null) return null;
  return { date: t, color: parseColor(color, theme().presets[0]), label: rest.join('~') };
}

const encLabel = (s) => encodeURIComponent(s).replace(/~/g, '%7E');

function writeURL() {
  const parts = [];
  if (state.birth !== null) parts.push('b=' + toISO(state.birth));
  if (state.years !== DEFAULT_YEARS) parts.push('l=' + state.years);
  if (state.theme !== DEFAULT_THEME) parts.push('t=' + state.theme);
  for (const r of state.ranges) {
    if (r.start === null) continue;
    parts.push('r=' + [toISO(r.start), r.end === null ? '' : toISO(r.end), r.color.slice(1), encLabel(r.label)].join('~'));
  }
  for (const e of state.events) {
    parts.push('d=' + [toISO(e.date), e.color.slice(1), encLabel(e.label)].join('~'));
  }
  const qs = parts.length ? '?' + parts.join('&') : '';
  history.replaceState(null, '', location.pathname + qs + location.hash);
}

// ---------------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------------

function applyTheme() {
  const t = theme();
  const s = document.documentElement.style;
  s.setProperty('--bg', t.bg);
  s.setProperty('--bg-2', t.panel);
  s.setProperty('--ink', t.ink);
  s.setProperty('--accent', t.accent);
  s.setProperty('--on-accent', t.onAccent);
  s.setProperty('--today', t.today);
  s.colorScheme = t.light ? 'light' : 'dark';
  document.querySelector('meta[name="theme-color"]').content = t.bg;
  document.querySelector('meta[name="color-scheme"]').content = t.light ? 'light' : 'dark';
}

// Switching theme: colours that were one of the old theme's presets follow to
// the corresponding preset of the new theme; anything hand-picked is left alone.
function switchTheme(name) {
  const from = theme().presets, to = THEMES[name].presets;
  const remap = (c) => { const i = from.indexOf(c); return i < 0 ? c : to[i % to.length]; };
  for (const r of state.ranges) r.color = remap(r.color);
  for (const e of state.events) e.color = remap(e.color);
  state.theme = name;
  applyTheme();
}

function nextPreset() {
  const used = new Set([...state.ranges, ...state.events].map(x => x.color));
  const p = theme().presets;
  return p.find(c => !used.has(c)) || p[(state.ranges.length + state.events.length) % p.length];
}

// ---------------------------------------------------------------------------
// Model: which week is which colour
// ---------------------------------------------------------------------------

function computeModel() {
  if (state.birth === null) return null;
  const t = theme();
  const birth = state.birth;
  const death = addYears(birth, state.years);
  const total = Math.max(1, Math.floor((death - birth) / WEEK));
  const today = todayUTC();
  const weekOf = (ts) => Math.floor((ts - birth) / WEEK);
  const cur = weekOf(today);              // may be < 0 or >= total

  const colors = new Array(total);
  for (let i = 0; i < total; i++) colors[i] = i < cur ? t.past : t.future;

  // Period coverage in list order, so later periods paint over earlier ones.
  const covering = new Array(total);      // week -> [range, ...] for the tooltip
  for (const r of state.ranges) {
    if (r.start === null) continue;
    const endT = r.end === null ? today : r.end;
    if (endT < r.start) continue;
    const a = weekOf(r.start), b = weekOf(endT);
    if (b < 0 || a > total - 1) continue;
    for (let i = clamp(a, 0, total - 1); i <= clamp(b, 0, total - 1); i++) {
      colors[i] = r.color;
      (covering[i] ||= []).push(r);
    }
  }

  const marks = new Array(total);         // week -> [event, ...]
  for (const e of state.events) {
    const w = weekOf(e.date);
    if (w >= 0 && w < total) (marks[w] ||= []).push(e);
  }

  const lived = clamp(cur, 0, total);
  return { birth, death, total, today, cur, lived, left: total - lived, colors, covering, marks, weekOf };
}

// ---------------------------------------------------------------------------
// Layout: the densest grid of n square cells that fits a W x H box.
// ---------------------------------------------------------------------------

function bestGrid(n, W, H) {
  let best = { cols: 1, rows: n, cell: 0 };
  for (let cols = 1; cols <= n; cols++) {
    const rows = Math.ceil(n / cols);
    const cell = Math.min(W / cols, H / rows);
    if (cell > best.cell) best = { cols, rows, cell };
    if (W / cols < best.cell) break;      // cells only get narrower from here
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
  const t = theme();
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
    ctx.fillStyle = t.ink;
    ctx.globalAlpha = 0.55;
    ctx.font = '500 15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Set your date of birth to see your weeks', w / 2, h / 2);
    ctx.globalAlpha = 1;
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
  const centre = (i) => [ox + (i % cols) * cell + cell / 2, oy + Math.floor(i / cols) * cell + cell / 2];

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
      const [cx, cy] = centre(i);
      ctx.moveTo(cx + r, cy);
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
    }
    ctx.fill();
  }

  // Today: a brighter dot with a glow and a small flag.
  const cur = model.cur;
  if (cur >= 0 && cur < model.total) {
    const [cx, cy] = centre(cur);
    ctx.save();
    ctx.shadowColor = t.today;
    ctx.shadowBlur = Math.max(6, r * 2.5);
    ctx.fillStyle = t.today;
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(r * 1.15, 2.2), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Single dates: a ring in the gap around the dot, so the dot's own colour stays visible.
  const lw = Math.max(2, cell * 0.14);
  const ringR = Math.min(r + lw / 2, cell / 2 - lw / 2);
  ctx.lineWidth = lw;
  for (let i = 0; i < model.total; i++) {
    const evs = model.marks[i];
    if (!evs) continue;
    const [cx, cy] = centre(i);
    ctx.strokeStyle = evs[evs.length - 1].color;
    ctx.beginPath();
    ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (cur >= 0 && cur < model.total) drawFlag(...centre(cur), r, w);
}

function drawFlag(cx, cy, r, w) {
  const t = theme();
  const label = 'TODAY';
  ctx.font = '700 11px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const tw = ctx.measureText(label).width;
  const bw = tw + 16, bh = 20, tri = 5, gap = 4;
  const above = cy - r - gap - tri - bh >= 2;
  const by = above ? cy - r - gap - tri - bh : cy + r + gap + tri;
  const bx = clamp(cx - bw / 2, 4, w - bw - 4);

  ctx.fillStyle = t.bg;
  ctx.strokeStyle = t.accent;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, bh, 4);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  if (above) {
    ctx.moveTo(cx - tri, by + bh); ctx.lineTo(cx + tri, by + bh); ctx.lineTo(cx, by + bh + tri);
  } else {
    ctx.moveTo(cx - tri, by); ctx.lineTo(cx + tri, by); ctx.lineTo(cx, by - tri);
  }
  ctx.closePath();
  ctx.fillStyle = t.accent;
  ctx.fill();

  ctx.fillStyle = t.ink;
  ctx.fillText(label, bx + bw / 2, by + bh / 2 + 0.5);
}

function legendItem(color, text, isEvent) {
  const li = document.createElement('li');
  li.style.setProperty('--c', color);
  if (isEvent) li.className = 'ev';
  li.textContent = text;
  return li;
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

  legendEl.replaceChildren(
    ...state.ranges.filter(r => r.start !== null).map(r =>
      legendItem(r.color, r.label || `${fmtDate.format(r.start)} – ${r.end === null ? 'now' : fmtDate.format(r.end)}`, false)),
    ...state.events.map(e => legendItem(e.color, e.label || fmtDate.format(e.date), true)),
  );
}

function render() {
  model = computeModel();
  renderStats();
  writeURL();
  // The footer may have wrapped to a new line; let layout settle before measuring.
  requestAnimationFrame(draw);
}

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

const escapeHTML = (s) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function showTip(i, clientX, clientY) {
  const start = model.birth + i * WEEK;
  const end = start + 6 * DAY;
  const status = i < model.cur ? 'lived' : i === model.cur ? 'this week' : 'ahead';
  const tags = [
    ...(model.covering[i] || []).map(r => `<span style="--c:${r.color}">${escapeHTML(r.label || 'Untitled period')}</span>`),
    ...(model.marks[i] || []).map(e => `<span class="ev" style="--c:${e.color}">${escapeHTML(e.label || 'Untitled date')} · ${fmtDate.format(e.date)}</span>`),
  ].join('');
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
  canvas.style.cursor = i < 0 ? '' : 'pointer';
  i < 0 ? hideTip() : showTip(i, e.clientX, e.clientY);
});
canvas.addEventListener('pointerleave', () => { hideTip(); canvas.style.cursor = ''; });
canvas.addEventListener('pointerdown', (e) => {
  if (e.pointerType !== 'touch') return;
  const i = weekAtPoint(e.clientX, e.clientY);
  clearTimeout(tipTimer);
  if (i < 0) return hideTip();
  showTip(i, e.clientX, e.clientY);
  tipTimer = setTimeout(hideTip, 2500);
});

// ---------------------------------------------------------------------------
// Date field: three <select>s (day / month / year). Native <select> opens the
// wheel picker on iOS and a plain dropdown elsewhere — no library needed.
// ---------------------------------------------------------------------------

function createDateField(host, { placeholder = false, onChange }) {
  const mk = (cls, label) => {
    const s = document.createElement('select');
    s.className = cls;
    s.setAttribute('aria-label', label);
    if (placeholder) {
      const o = new Option(label, '', true, true);
      o.disabled = true; o.hidden = true;
      s.append(o);
      s.required = true;
    }
    return s;
  };
  const day = mk('day', 'Day'), month = mk('month', 'Month'), year = mk('year', 'Year');
  for (let d = 1; d <= 31; d++) day.append(new Option(d, d));
  for (let m = 1; m <= 12; m++) month.append(new Option(fmtMonth.format(Date.UTC(2000, m - 1, 1)), m));
  let yr = [1900, 2100];

  function setYears(min, max) {
    yr = [min, max];
    const cur = year.value;
    year.replaceChildren(...(placeholder ? [year.options[0]] : []));
    for (let y = min; y <= max; y++) year.append(new Option(y, y));
    if (cur) year.value = cur;
  }
  setYears(...yr);

  function get() {
    if (!day.value || !month.value || !year.value) return null;
    const y = +year.value, m = +month.value;
    const d = Math.min(+day.value, daysInMonth(y, m));   // 31 Feb -> 28/29 Feb
    if (+day.value !== d) day.value = d;
    return Date.UTC(y, m - 1, d);
  }

  function set(ts) {
    if (ts === null) { day.value = ''; month.value = ''; year.value = ''; return; }
    const d = new Date(ts);
    const y = d.getUTCFullYear();
    if (y < yr[0] || y > yr[1]) setYears(Math.min(yr[0], y), Math.max(yr[1], y));
    day.value = d.getUTCDate();
    month.value = d.getUTCMonth() + 1;
    year.value = y;
  }

  for (const s of [day, month, year]) {
    s.addEventListener('change', () => onChange(get()));
  }
  host.replaceChildren(day, month, year);
  return { get, set, setYears };
}

// Year range offered for periods and dates: the life span itself, when known.
function lifeYears() {
  const now = new Date().getUTCFullYear();
  if (state.birth === null) return [now - 100, now + 100];
  const b = new Date(state.birth).getUTCFullYear();
  return [b, Math.max(b + state.years, now)];
}

// ---------------------------------------------------------------------------
// Settings panel
// ---------------------------------------------------------------------------

const panel = document.getElementById('panel');
const fab = document.getElementById('fab');
const closeBtn = document.getElementById('close');
const yearsIn = document.getElementById('years');
const totalHint = document.getElementById('total-hint');
const rangesEl = document.getElementById('ranges');
const eventsEl = document.getElementById('events');
const themesEl = document.getElementById('themes');
const rangeTpl = document.getElementById('range-row');
const eventTpl = document.getElementById('event-row');

const birthField = createDateField(document.getElementById('birth'), {
  placeholder: true,
  onChange: (ts) => { state.birth = ts; syncRows(); updateTotalHint(); render(); },
});
{
  const now = new Date().getUTCFullYear();
  birthField.setYears(now - 120, now);
}

function openPanel() {
  syncForm();
  panel.hidden = false;
  fab.setAttribute('aria-expanded', 'true');
  hideTip();
  (state.birth === null ? document.querySelector('#birth select') : closeBtn).focus({ preventScroll: true });
}

function closePanel() {
  panel.hidden = true;
  fab.setAttribute('aria-expanded', 'false');
  fab.focus({ preventScroll: true });
}

function syncForm() {
  birthField.set(state.birth);
  yearsIn.value = state.years;
  updateTotalHint();
  syncRows();
  syncThemes();
}

function syncRows() {
  const [y0, y1] = lifeYears();
  rangesEl.replaceChildren(...state.ranges.map(r => buildRangeRow(r, y0, y1)));
  eventsEl.replaceChildren(...state.events.map(e => buildEventRow(e, y0, y1)));
  if (!state.ranges.length) rangesEl.append(emptyNote('No periods yet.'));
  if (!state.events.length) eventsEl.append(emptyNote('No dates yet.'));
}

function emptyNote(text) {
  const p = document.createElement('p');
  p.className = 'empty';
  p.textContent = text;
  return p;
}

function updateTotalHint() {
  if (state.birth === null) { totalHint.textContent = ''; return; }
  const m = computeModel();
  totalHint.textContent = `${fmtInt.format(m.total)} weeks in total; ${fmtInt.format(m.left)} still ahead.`;
}

function wireHead(li, item, list) {
  const color = li.querySelector('.r-color');
  const label = li.querySelector('.r-label');
  color.value = item.color;
  label.value = item.label;
  color.addEventListener('input', () => { item.color = color.value; render(); });
  label.addEventListener('input', () => { item.label = label.value; render(); });
  li.querySelector('.r-del').addEventListener('click', () => {
    list.splice(list.indexOf(item), 1);
    syncRows();
    render();
  });
}

function buildRangeRow(r, y0, y1) {
  const li = rangeTpl.content.firstElementChild.cloneNode(true);
  wireHead(li, r, state.ranges);

  const start = createDateField(li.querySelector('.r-start'), { onChange: (ts) => { r.start = ts; render(); } });
  const end = createDateField(li.querySelector('.r-end'), { onChange: (ts) => { r.end = ts; render(); } });
  start.setYears(y0, y1);
  end.setYears(y0, y1);
  start.set(r.start ?? todayUTC());

  const endHost = li.querySelector('.r-end');
  const ongoing = li.querySelector('.r-ongoing');
  const showEnd = () => { endHost.hidden = r.end === null; };
  ongoing.checked = r.end === null;
  end.set(r.end ?? todayUTC());
  showEnd();
  ongoing.addEventListener('change', () => {
    r.end = ongoing.checked ? null : Math.max(r.start ?? todayUTC(), todayUTC());
    if (r.end !== null) end.set(r.end);
    showEnd();
    render();
  });
  return li;
}

function buildEventRow(e, y0, y1) {
  const li = eventTpl.content.firstElementChild.cloneNode(true);
  wireHead(li, e, state.events);
  const date = createDateField(li.querySelector('.r-date'), { onChange: (ts) => { e.date = ts; render(); } });
  date.setYears(y0, y1);
  date.set(e.date);
  return li;
}

function syncThemes() {
  themesEl.replaceChildren(...Object.entries(THEMES).map(([key, t]) => {
    const label = document.createElement('label');
    label.className = 'swatch';
    label.innerHTML =
      `<input type="radio" name="theme" value="${key}">` +
      `<span class="sw" style="--sbg:${t.bg};--sink:${t.ink}">` +
      `<span class="dots"><i style="background:${t.past}"></i><i style="background:${t.future}"></i>` +
      `<i style="background:${t.presets[0]}"></i><i style="background:${t.presets[1]}"></i></span>${t.name}</span>`;
    const input = label.querySelector('input');
    input.checked = key === state.theme;
    input.addEventListener('change', () => {
      switchTheme(key);
      syncRows();          // colour inputs may have been remapped
      render();
    });
    return label;
  }));
}

yearsIn.addEventListener('input', () => {
  const v = parseInt(yearsIn.value, 10);
  if (!Number.isFinite(v)) return;
  state.years = clamp(v, 1, 150);
  updateTotalHint();
  render();
});
yearsIn.addEventListener('change', () => { yearsIn.value = state.years; syncRows(); });

function addItem(list, item, host) {
  list.push(item);
  syncRows();
  render();
  const last = host.lastElementChild;
  last.querySelector('.r-label').focus({ preventScroll: true });
  last.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

document.getElementById('add-range').addEventListener('click', () => {
  addItem(state.ranges, { start: addYears(todayUTC(), -1), end: null, color: nextPreset(), label: '' }, rangesEl);
});
document.getElementById('add-event').addEventListener('click', () => {
  addItem(state.events, { date: todayUTC(), color: nextPreset(), label: '' }, eventsEl);
});

document.getElementById('copy').addEventListener('click', async (e) => {
  const btn = e.currentTarget;
  const old = btn.textContent;
  try {
    await navigator.clipboard.writeText(location.href);
    btn.textContent = 'Copied!';
  } catch {
    btn.textContent = 'Copy from the address bar';
  }
  setTimeout(() => { btn.textContent = old; }, 1800);
});

document.getElementById('reset').addEventListener('click', () => {
  state.birth = null;
  state.years = DEFAULT_YEARS;
  state.ranges = [];
  state.events = [];
  syncForm();
  render();
  document.querySelector('#birth select').focus({ preventScroll: true });
});

fab.addEventListener('click', openPanel);
closeBtn.addEventListener('click', closePanel);
document.getElementById('backdrop').addEventListener('click', closePanel);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !panel.hidden) closePanel();
});

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

readURL();
applyTheme();
render();
if (state.birth === null) openPanel();

// If the tab stays open past midnight, "today" moves on.
setInterval(() => {
  if (model && todayUTC() !== model.today) render();
}, 60_000);
