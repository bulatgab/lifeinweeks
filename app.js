// Life in Weeks — one dot per week.
// No build step, no server, no storage: the whole state is the URL query string.

const DAY = 86_400_000;
const WEEK = 7 * DAY;
const DEFAULT_YEARS = 80;
const DEFAULT_THEME = 'dusk';
const WATER_MIX = 0.55;   // water tint: 0 = the dot colour itself, 1 = the background

// Each theme: surfaces, ink, the past/future base dots, the "today" dot, the
// accent used for the FAB / buttons / TODAY flag, the default colours offered
// to new periods and dates (validated all-pairs, with past + future, on that
// background, for colour-vision-deficiency and normal-vision separation) and
// the parameters of the generated swatch ring.
const THEMES = {
  dusk:  { bg: '#1a0b2e', panel: '#24123d', ink: '#f4effa', past: '#5b2fa3', future: '#ff4370', today: '#30f0ff', accent: '#ff4370', onAccent: '#ffffff',
           presets: ['#ffb340', '#22c9a8', '#4f9df9', '#f0f0f5', '#b45309'], ring: { L: 0.8, C: 0.17, hues: 12 } },
  ink:   { bg: '#141418', panel: '#1c1c22', ink: '#ececf0', past: '#2c2c34', future: '#b8b8c4', today: '#ff7a59', accent: '#ff7a59', onAccent: '#141418',
           presets: ['#d4a017', '#5b8def', '#3fa7a0', '#bf616a', '#eceff4'], ring: { L: 0.78, C: 0.12, hues: 12 } },
  slate: { bg: '#2e3440', panel: '#3b4252', ink: '#eceff4', past: '#4c566a', future: '#d8dee9', today: '#88c0d0', accent: '#88c0d0', onAccent: '#2e3440',
           presets: ['#c1666b', '#5b8def', '#e6b450', '#5fb3a1'], ring: { L: 0.78, C: 0.12, hues: 13 } },
  paper: { bg: '#f5f0e6', panel: '#fffdf8', ink: '#2a2a33', past: '#d3c9b8', future: '#3b3946', today: '#d9534f', accent: '#d9534f', onAccent: '#ffffff', light: true,
           presets: ['#2f6b2f', '#a67c00', '#4f74a8', '#b0417a', '#7c3aed'], ring: { L: 0.52, C: 0.13, hues: 12 } },
};

// ---------------------------------------------------------------------------
// Text. Every user-facing string lives here; static HTML carries data-i18n
// hooks, JS-built text calls t().
// ---------------------------------------------------------------------------

const I18N = {
  en: {
    locale: 'en-GB',
    title: 'Life in Weeks',
    // <title> and <meta name="description">: what a search result shows. The
    // English copies also sit in index.html for crawlers that don't run JS.
    pageTitle: 'Life in Weeks — your life calendar, one dot per week',
    description: 'See your whole life as a grid of weeks — one dot per week, past dimmed, future bright. Free, no account, nothing stored: the whole chart lives in the link.',
    panelTitle: 'Your life in weeks',
    openSettings: 'Open settings', closeSettings: 'Close settings', language: 'Language',
    birth: 'Date of birth', lifespan: 'Expected lifespan', years: 'years',
    totalHint: (total, left) => `${total} weeks in total; ${left} still ahead.`,
    periods: 'Periods',
    periodsHint: 'Colour stretches of your life — school, a job, a relationship, a home. Later periods paint over earlier ones. Drag the grip to reorder.',
    noPeriods: 'No periods yet.', addPeriod: '+ Add period',
    dates: 'Dates',
    datesHint: 'Mark a single week with a ring — a wedding, a loss, a move, a deadline. Rings sit on top of periods, so both stay visible.',
    noDates: 'No dates yet.', addDate: '+ Add date',
    theme: 'Theme', themes: { dusk: 'Dusk', ink: 'Ink', slate: 'Slate', paper: 'Paper' },
    connect: 'Connect dots', water0: 'Off', water1: 'Scalloped', water2: 'Straight', water3: 'Filled',
    share: 'Share', openShare: 'Share the chart', close: 'Close',
    copyLink: 'Copy link', copied: 'Copied!', copyFail: 'Copy from the address bar',
    shareLinkHint: 'Anyone with the link sees everything you entered: date of birth, expected lifespan, periods, dates and their labels.',
    shareLinkDemoHint: 'This link opens the app with the example chart — nothing of yours is in it.',
    saveImage: 'Save image',
    resetTitle: 'Reset', reset: 'Reset everything',
    // About / welcome dialog. The English copy is also in index.html for
    // crawlers that don't run JS — keep the two in sync.
    aboutLead: 'Life in Weeks draws your whole life, one dot for every week. Inspired by the essay <a href="https://waitbutwhy.com/2014/05/life-weeks.html" target="_blank" rel="noopener">Your Life in Weeks</a> on Wait But Why and the video <a href="https://www.youtube.com/watch?v=JXeJANDKwDc" target="_blank" rel="noopener">When This Number Hits 5200, You Will Be Dead</a> from Kurzgesagt.',
    aboutPrivacy: '<b>Nothing is stored anywhere. There is no account, no server and nothing kept in your browser: the whole chart is encoded in the page address. Bookmark it or copy the link to keep it, and re-save the bookmark after you change something.</b>',
    aboutHow: 'Enter your date of birth and expected lifespan, then colour the periods that shaped you — school, university, jobs, relationships, the places you have lived — and ring single dates such as a wedding or a move. Share the result as a link or save it as an image.',
    aboutFoot: 'Free and open source. Works on phones and desktops. Supports English and Russian. <a href="https://github.com/bulatgab/lifeinweeks/issues" target="_blank" rel="noopener">Report an issue</a>.',
    continue: 'Continue', aboutOpen: 'About this app',
    labelPeriod: 'Label (e.g. University)', labelDate: 'Label (e.g. Wedding)',
    from: 'From', to: 'To', on: 'On', ongoing: 'Ongoing',
    deletePeriod: 'Delete period', deleteDate: 'Delete date',
    drag: 'Drag to reorder (or use the arrow keys)', colour: 'Colour', customColour: 'Custom colour',
    day: 'Day', month: 'Month', year: 'Year',
    stats: (lived, left, pct, total) => `<b>${lived}</b> weeks lived · <b>${left}</b> left · ${pct}% of ${total}`,
    statsDemo: (lived, left, pct, total) => `<b class="tag">Example</b> ${lived} weeks lived · ${left} left · ${pct}% of ${total}`,
    sample: { school: 'School', uni: 'University', job: 'First job', home: 'Berlin', wedding: 'Wedding' },
    today: 'TODAY',
    weekOf: (n, total) => `Week ${n} of ${total}`,
    lived: 'lived', thisWeek: 'this week', ahead: 'ahead', age: (a) => `age ${a}`,
    untitledPeriod: 'Untitled period', untitledDate: 'Untitled date', now: 'now',
    imageName: 'life-in-weeks.png',
  },
  ru: {
    locale: 'ru-RU',
    title: 'Жизнь в неделях',
    pageTitle: 'Жизнь в неделях — календарь жизни, одна точка на неделю',
    description: 'Вся ваша жизнь на одном экране — одна точка на неделю: прошлое приглушено, будущее яркое. Бесплатно, без аккаунта, ничего не хранится: вся картина живёт в ссылке.',
    panelTitle: 'Ваша жизнь в неделях',
    openSettings: 'Открыть настройки', closeSettings: 'Закрыть настройки', language: 'Язык',
    birth: 'Дата рождения', lifespan: 'Ожидаемая продолжительность жизни', years: 'лет',
    totalHint: (total, left, w) => `Всего ${total} ${w(total)}; впереди ещё ${left}.`,
    periods: 'Периоды',
    periodsHint: 'Раскрасьте отрезки жизни — школу, работу, отношения, дом. Поздние периоды перекрывают ранние. Порядок можно менять перетаскиванием.',
    noPeriods: 'Периодов пока нет.', addPeriod: '+ Добавить период',
    dates: 'Даты',
    datesHint: 'Отметьте одну неделю кольцом — свадьбу, утрату, переезд, дедлайн. Кольца рисуются поверх периодов, так что видно и то и другое.',
    noDates: 'Дат пока нет.', addDate: '+ Добавить дату',
    theme: 'Тема', themes: { dusk: 'Сумерки', ink: 'Чернила', slate: 'Графит', paper: 'Бумага' },
    connect: 'Соединить точки', water0: 'Нет', water1: 'Волной', water2: 'Прямо', water3: 'Заливкой',
    share: 'Поделиться', openShare: 'Поделиться картой', close: 'Закрыть',
    copyLink: 'Скопировать ссылку', copied: 'Скопировано!', copyFail: 'Скопируйте из адресной строки',
    shareLinkHint: 'Любой, у кого есть ссылка, увидит всё, что вы ввели: дату рождения, ожидаемую продолжительность жизни, периоды, даты и подписи.',
    shareLinkDemoHint: 'Эта ссылка открывает приложение с примером — ваших данных в ней нет.',
    saveImage: 'Сохранить картинку',
    resetTitle: 'Сброс', reset: 'Сбросить всё',
    aboutLead: '«Жизнь в неделях» рисует всю вашу жизнь — по точке на каждую неделю. По мотивам эссе <a href="https://waitbutwhy.com/2014/05/life-weeks.html" target="_blank" rel="noopener">Your Life in Weeks</a> (Wait But Why) и видео <a href="https://www.youtube.com/watch?v=JXeJANDKwDc" target="_blank" rel="noopener">When This Number Hits 5200, You Will Be Dead</a> от Kurzgesagt.',
    aboutPrivacy: '<b>Ничего нигде не хранится. Ни аккаунта, ни сервера, ни данных в браузере: вся картина закодирована в адресе страницы. Добавьте его в закладки или скопируйте ссылку, чтобы сохранить, — и после изменений сохраните закладку заново.</b>',
    aboutHow: 'Укажите дату рождения и ожидаемую продолжительность жизни, затем раскрасьте периоды — школу, университет, работу, отношения, города, где жили, — и отметьте кольцом отдельные даты: свадьбу, переезд. Поделитесь результатом ссылкой или сохраните картинкой.',
    aboutFoot: 'Бесплатно, исходный код открыт. Работает на телефоне и компьютере. Поддерживаются русский и английский. <a href="https://github.com/bulatgab/lifeinweeks/issues" target="_blank" rel="noopener">Сообщить об ошибке</a>.',
    continue: 'Продолжить', aboutOpen: 'О приложении',
    labelPeriod: 'Название (например, Университет)', labelDate: 'Название (например, Свадьба)',
    from: 'С', to: 'По', on: 'Когда', ongoing: 'По сей день',
    deletePeriod: 'Удалить период', deleteDate: 'Удалить дату',
    drag: 'Перетащите, чтобы изменить порядок (или используйте стрелки)', colour: 'Цвет', customColour: 'Свой цвет',
    day: 'День', month: 'Месяц', year: 'Год',
    stats: (lived, left, pct, total, w) => `<b>${lived}</b> ${w(lived)} прожито · <b>${left}</b> осталось · ${pct}% из ${total}`,
    statsDemo: (lived, left, pct, total, w) => `<b class="tag">Пример</b> ${lived} ${w(lived)} прожито · ${left} осталось · ${pct}% из ${total}`,
    sample: { school: 'Школа', uni: 'Университет', job: 'Первая работа', home: 'Берлин', wedding: 'Свадьба' },
    today: 'СЕГОДНЯ',
    weekOf: (n, total) => `Неделя ${n} из ${total}`,
    lived: 'прожита', thisWeek: 'текущая', ahead: 'впереди', age: (a) => `возраст ${a}`,
    untitledPeriod: 'Период без названия', untitledDate: 'Дата без названия', now: 'сейчас',
    imageName: 'life-in-weeks.png',
  },
};

const t = (key, ...args) => {
  const v = I18N[state.lang][key];
  return typeof v === 'function' ? v(...args, weeksWord) : v;
};

// "week" / "weeks" — Russian needs one/few/many.
function weeksWord(n) {
  if (state.lang === 'ru') {
    const f = new Intl.PluralRules('ru').select(n);
    return f === 'one' ? 'неделя' : f === 'few' ? 'недели' : 'недель';
  }
  return n === 1 ? 'week' : 'weeks';
}

const detectLang = () => (navigator.language || '').toLowerCase().startsWith('ru') ? 'ru' : 'en';

// Formatters follow the language.
const fmt = { lang: null };
function formatters() {
  if (fmt.lang !== state.lang) {
    const loc = I18N[state.lang].locale;
    fmt.lang = state.lang;
    fmt.date = new Intl.DateTimeFormat(loc, { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
    fmt.month = new Intl.DateTimeFormat(loc, { month: 'short', timeZone: 'UTC' });
    fmt.int = new Intl.NumberFormat(loc);
  }
  return fmt;
}
const fmtDate = (ts) => formatters().date.format(ts);
const fmtInt = (n) => formatters().int.format(n);
const fmtMonth = (m1) => formatters().month.format(Date.UTC(2000, m1 - 1, 1)).replace(/\.$/, '');

// ---------------------------------------------------------------------------
// Colour maths in OKLab (Björn Ottosson's perceptual space). Used to derive the
// recessive "water" tint from any dot colour by mixing it toward the theme's
// background — the same operation design systems use to build tonal scales —
// and to generate the swatch ring at a uniform lightness/chroma.
// ---------------------------------------------------------------------------

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const hexToRgb = (hex) => { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => v / 255); };
const rgbToHex = (rgb) => '#' + rgb.map(v => Math.round(clamp(v, 0, 1) * 255).toString(16).padStart(2, '0')).join('');
const toLin = (c) => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
const fromLin = (c) => c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;

function rgbToOklab(rgb) {
  const [R, G, B] = rgb.map(toLin);
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  return [0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
          1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
          0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s];
}

function oklabToLinear([L, a, b]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3;
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
          -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
          -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s];
}

const oklabToHex = (lab) => rgbToHex(oklabToLinear(lab).map(v => fromLin(clamp(v, 0, 1))));

function mixOklab(hexA, hexB, k) {
  const A = rgbToOklab(hexToRgb(hexA)), B = rgbToOklab(hexToRgb(hexB));
  return oklabToHex(A.map((v, i) => v + (B[i] - v) * k));
}

// OKLCH -> hex, pulling chroma in until the colour fits the sRGB gamut.
function oklchToHex(L, C, h) {
  const rad = (h * Math.PI) / 180;
  for (let c = C; c >= 0; c -= 0.005) {
    const lin = oklabToLinear([L, c * Math.cos(rad), c * Math.sin(rad)]);
    if (lin.every(v => v >= -0.0005 && v <= 1.0005)) return rgbToHex(lin.map(v => fromLin(clamp(v, 0, 1))));
  }
  return oklabToHex([L, 0, 0]);
}

// A ring of hues at one perceptual lightness and chroma, plus two neutrals —
// shown in the picker after the theme's validated presets, tuned per theme.
function extendedColors(th) {
  const n = th.ring.hues;
  const hues = Array.from({ length: n }, (_, i) => 20 + (360 * i) / n);
  return [
    ...hues.map(h => oklchToHex(th.ring.L, th.ring.C, h)),
    oklchToHex(th.light ? 0.35 : 0.93, 0, 0),
    oklchToHex(th.light ? 0.6 : 0.7, 0, 0),
  ];
}

const waterColor = (hex) => mixOklab(hex, theme().bg, WATER_MIX);

// ---------------------------------------------------------------------------
// Dates. Every date is a UTC-midnight timestamp so that day arithmetic is exact
// regardless of the viewer's time zone or daylight-saving transitions.
// ---------------------------------------------------------------------------

function parseISO(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
  if (!m) return null;
  const [y, mo, d] = [+m[1], +m[2], +m[3]];
  const ts = Date.UTC(y, mo - 1, d);
  const back = new Date(ts);
  if (back.getUTCFullYear() !== y || back.getUTCMonth() !== mo - 1 || back.getUTCDate() !== d) return null;
  return ts;
}

const toISO = (ts) => new Date(ts).toISOString().slice(0, 10);

function todayUTC() {
  const d = new Date();
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
}

function addYears(ts, years) {
  const d = new Date(ts);
  return Date.UTC(d.getUTCFullYear() + years, d.getUTCMonth(), d.getUTCDate());
}

const daysInMonth = (y, m1) => new Date(Date.UTC(y, m1, 0)).getUTCDate();

function ageAt(birth, ts) {
  const b = new Date(birth), d = new Date(ts);
  let age = d.getUTCFullYear() - b.getUTCFullYear();
  const beforeBirthday =
    d.getUTCMonth() < b.getUTCMonth() ||
    (d.getUTCMonth() === b.getUTCMonth() && d.getUTCDate() < b.getUTCDate());
  return beforeBirthday ? age - 1 : age;
}

// ---------------------------------------------------------------------------
// State <-> URL
//   ?b=1990-01-01&l=80&t=slate&c=2&lang=ru
//    &r=2008-09-01~2013-06-30~ffb340~University   (period; empty end = ongoing)
//    &d=2015-08-22~22c9a8~Wedding                 (single date, drawn as a ring)
// ---------------------------------------------------------------------------

const state = {
  birth: null,
  years: DEFAULT_YEARS,
  theme: DEFAULT_THEME,
  water: 0,           // 0 off · 1 scalloped · 2 straight · 3 filled
  lang: detectLang(),
  langExplicit: false, // only an explicit choice is written to the URL
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
  state.water = ['1', '2', '3'].includes(p.get('c')) ? +p.get('c') : 0;
  if (I18N[p.get('lang')]) { state.lang = p.get('lang'); state.langExplicit = true; }
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
  const ts = parseISO(date);
  if (ts === null) return null;
  return { date: ts, color: parseColor(color, theme().presets[0]), label: rest.join('~') };
}

const encLabel = (s) => encodeURIComponent(s).replace(/~/g, '%7E');

function writeURL() {
  const parts = [];
  if (state.birth !== null) parts.push('b=' + toISO(state.birth));
  if (state.years !== DEFAULT_YEARS) parts.push('l=' + state.years);
  if (state.theme !== DEFAULT_THEME) parts.push('t=' + state.theme);
  if (state.water) parts.push('c=' + state.water);
  if (state.langExplicit) parts.push('lang=' + state.lang);
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
// Theme & language
// ---------------------------------------------------------------------------

function applyTheme() {
  const th = theme();
  const s = document.documentElement.style;
  s.setProperty('--bg', th.bg);
  s.setProperty('--bg-2', th.panel);
  s.setProperty('--ink', th.ink);
  s.setProperty('--accent', th.accent);
  s.setProperty('--on-accent', th.onAccent);
  s.setProperty('--today', th.today);
  s.colorScheme = th.light ? 'light' : 'dark';
  document.querySelector('meta[name="theme-color"]').content = th.bg;
  document.querySelector('meta[name="color-scheme"]').content = th.light ? 'light' : 'dark';
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

function applyLang() {
  document.documentElement.lang = state.lang;
  document.title = t('pageTitle');
  document.querySelector('meta[name="description"]').content = t('description');
  applyCanonical();
  for (const el of document.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
  for (const el of document.querySelectorAll('[data-i18n-html]')) el.innerHTML = t(el.dataset.i18nHtml);
  for (const el of document.querySelectorAll('[data-i18n-aria]')) el.setAttribute('aria-label', t(el.dataset.i18nAria));
  for (const el of document.querySelectorAll('[data-i18n-placeholder]')) el.placeholder = t(el.dataset.i18nPlaceholder);
  for (const tpl of document.querySelectorAll('template')) {
    for (const el of tpl.content.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
    for (const el of tpl.content.querySelectorAll('[data-i18n-aria]')) el.setAttribute('aria-label', t(el.dataset.i18nAria));
    for (const el of tpl.content.querySelectorAll('[data-i18n-placeholder]')) el.placeholder = t(el.dataset.i18nPlaceholder);
  }
  for (const b of document.querySelectorAll('.langlist [data-lang]')) b.setAttribute('aria-checked', String(b.dataset.lang === state.lang));
  for (const el of document.querySelectorAll('[data-i18n-title]')) el.title = t(el.dataset.i18nTitle);
}

// The canonical URL is the bare page (plus ?lang= when a non-default language
// was chosen explicitly), never the personal query string, so search engines
// fold every shared chart into one entry and don't list anyone's dates. It is
// injected here rather than written in index.html on purpose: Google indexes
// the rendered DOM and honours a JS-inserted canonical, whereas link-preview
// scrapers (Facebook, LinkedIn …) don't run JS and would otherwise rewrite a
// shared chart's link to the empty page.
function applyCanonical() {
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.append(link);
  }
  const lang = state.langExplicit && state.lang !== 'en' ? '?lang=' + state.lang : '';
  link.href = location.origin + location.pathname + lang;
}

// ---------------------------------------------------------------------------
// Model: which week is which colour
// ---------------------------------------------------------------------------

// With no date of birth there is nothing of the user's to draw, so the chart
// shows a sample life instead — a 36-year-old, built relative to today so it
// never ages, coloured with the current theme's presets. The sample lives only
// in the model: state (and therefore the URL and the settings form) stays empty.
function sampleState() {
  const th = theme(), p = th.presets, s = t('sample');
  // Four periods take the first presets (Slate has only four); the ring uses
  // the picker's light neutral (dark on Paper) so it reads on any period colour.
  const neutral = extendedColors(th).at(-2);
  const birth = addYears(todayUTC(), -36);
  const at = (y) => addYears(birth, y);
  return {
    birth, years: DEFAULT_YEARS,
    ranges: [
      { start: at(6),  end: at(17), color: p[0], label: s.school },
      { start: at(17), end: at(22), color: p[1], label: s.uni },
      { start: at(22), end: at(28), color: p[2], label: s.job },
      { start: at(28), end: null,   color: p[4] ?? p[3], label: s.home },
    ],
    events: [{ date: at(26), color: neutral, label: s.wedding }],
  };
}

const chartSource = () => state.birth === null ? sampleState() : state;

function computeModel() {
  const src = chartSource();
  const th = theme();
  const birth = src.birth;
  const death = addYears(birth, src.years);
  const total = Math.max(1, Math.floor((death - birth) / WEEK));
  const today = todayUTC();
  const weekOf = (ts) => Math.floor((ts - birth) / WEEK);
  const cur = weekOf(today);

  const colors = new Array(total);
  for (let i = 0; i < total; i++) colors[i] = i < cur ? th.past : th.future;

  const covering = new Array(total);
  for (const r of src.ranges) {
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

  const marks = new Array(total);
  for (const e of src.events) {
    const w = weekOf(e.date);
    if (w >= 0 && w < total) (marks[w] ||= []).push(e);
  }

  const lived = clamp(cur, 0, total);
  return { birth, death, total, today, cur, lived, left: total - lived, colors, covering, marks, weekOf, demo: src !== state };
}

// The densest grid of n square cells that fits a W x H box.
function bestGrid(n, W, H) {
  let best = { cols: 1, rows: n, cell: 0 };
  for (let cols = 1; cols <= n; cols++) {
    const rows = Math.ceil(n / cols);
    const cell = Math.min(W / cols, H / rows);
    if (cell > best.cell) best = { cols, rows, cell };
    if (W / cols < best.cell) break;
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
let geo = null;   // layout of the last on-screen draw, for hit-testing

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
  geo = paintGrid(ctx, w, h);
}

// Paints the whole chart into any 2D context, w x h in CSS pixels. Returns the
// layout so the caller can hit-test. Shared by the screen and the image export.
function paintGrid(c, w, h) {
  const th = theme();

  const pad = 14;
  const top = 30;
  const W = Math.max(1, w - pad * 2);
  const H = Math.max(1, h - pad - top);
  const { cols, rows, cell } = bestGrid(model.total, W, H);
  const ox = pad + (W - cols * cell) / 2;
  const oy = top + (H - rows * cell) / 2;
  const r = cell * 0.36;
  const centre = (i) => [ox + (i % cols) * cell + cell / 2, oy + Math.floor(i / cols) * cell + cell / 2];

  // A dot's region: the period on top of it, or the past/future base.
  const ids = new Array(model.total);
  for (let i = 0; i < model.total; i++) {
    const cv = model.covering[i];
    ids[i] = cv ? cv[cv.length - 1] : (i < model.cur ? 'past' : 'future');
  }
  const groups = new Map();
  for (let i = 0; i < model.total; i++) {
    let g = groups.get(ids[i]);
    if (!g) groups.set(ids[i], (g = { color: model.colors[i], idx: [] }));
    g.idx.push(i);
  }

  // Water: one path per region, filled once.
  //   scalloped — a concave lens between neighbours + a square per 2x2 block
  //   straight  — the region's outline offset inward to run tangent to the
  //               dots, every corner filleted with the dot radius
  //   filled    — the outline of the whole cells, corners filleted, so that
  //               neighbouring regions tile
  if (state.water) {
    const style = state.water;
    const R = cell * 0.4;
    for (const [id, g] of groups) {
      c.fillStyle = waterColor(g.color);
      c.beginPath();
      if (style === 1) {
        for (const i of g.idx) {
          const right = (i + 1) % cols !== 0 && i + 1 < model.total && ids[i + 1] === id;
          const down = i + cols < model.total && ids[i + cols] === id;
          const [cx, cy] = centre(i);
          if (right) bridge(c, cx, cy, cx + cell, cy, r, R);
          if (down) bridge(c, cx, cy, cx, cy + cell, r, R);
          if (right && down && ids[i + cols + 1] === id) c.rect(cx, cy, cell, cell);
        }
      } else {
        const loops = traceRegion(g.idx, (j) => ids[j] === id, cols, model.total);
        const inset = style === 2 ? cell / 2 - r : -0.5;
        const rho = style === 2 ? r : cell * 0.25;
        for (const loop of loops) roundedOutline(c, loop, ox, oy, cell, inset, rho);
      }
      c.fill();
    }
  }

  // Dots, on top of the water in their full colour.
  for (const [, g] of groups) {
    c.fillStyle = g.color;
    c.beginPath();
    for (const i of g.idx) {
      const [cx, cy] = centre(i);
      c.moveTo(cx + r, cy);
      c.arc(cx, cy, r, 0, Math.PI * 2);
    }
    c.fill();
  }

  // Today: a brighter dot with a glow.
  const cur = model.cur;
  if (cur >= 0 && cur < model.total) {
    const [cx, cy] = centre(cur);
    c.save();
    c.shadowColor = th.today;
    c.shadowBlur = Math.max(6, r * 2.5);
    c.fillStyle = th.today;
    c.beginPath();
    c.arc(cx, cy, Math.max(r * 1.15, 2.2), 0, Math.PI * 2);
    c.fill();
    c.restore();
  }

  // Single dates: a ring around the dot.
  const lw = Math.max(2, cell * 0.14);
  const ringR = Math.min(r + lw / 2, cell / 2 - lw / 2);
  c.lineWidth = lw;
  for (let i = 0; i < model.total; i++) {
    const evs = model.marks[i];
    if (!evs) continue;
    const [cx, cy] = centre(i);
    c.strokeStyle = evs[evs.length - 1].color;
    c.beginPath();
    c.arc(cx, cy, ringR, 0, Math.PI * 2);
    c.stroke();
  }

  if (cur >= 0 && cur < model.total) drawFlag(c, ...centre(cur), r, w);
  return { ox, oy, cols, rows, cell, r };
}

// The boundary of a set of grid cells as closed loops of grid-corner vertices
// (in cell units), each traced with the region on its right: outer loops run
// clockwise and holes anticlockwise, so the nonzero rule leaves holes empty.
// Collinear vertices are merged, so consecutive edges are always perpendicular.
function traceRegion(cells, inRegion, cols, total) {
  const W = cols + 1;
  const key = (cc, rr) => rr * W + cc;
  const edges = new Map();
  const add = (c0, r0, c1, r1, dir) => {
    const k = key(c0, r0);
    let a = edges.get(k);
    if (!a) edges.set(k, (a = []));
    a.push({ to: key(c1, r1), dir });
  };
  for (const i of cells) {
    const cc = i % cols, rr = (i - cc) / cols;
    if (!(rr > 0 && inRegion(i - cols))) add(cc, rr, cc + 1, rr, 0);
    if (!(cc + 1 < cols && i + 1 < total && inRegion(i + 1))) add(cc + 1, rr, cc + 1, rr + 1, 1);
    if (!(i + cols < total && inRegion(i + cols))) add(cc + 1, rr + 1, cc, rr + 1, 2);
    if (!(cc > 0 && inRegion(i - 1))) add(cc, rr + 1, cc, rr, 3);
  }
  const loops = [];
  for (const [start, list] of edges) {
    while (list.length) {
      const loop = [];
      let k = start, dir = -1;
      for (;;) {
        const out = edges.get(k);
        if (!out || !out.length) break;
        let pick = 0;
        if (dir >= 0 && out.length > 1) {
          for (const want of [(dir + 1) % 4, dir, (dir + 3) % 4]) {
            const j = out.findIndex(e => e.dir === want);
            if (j >= 0) { pick = j; break; }
          }
        }
        const e = out.splice(pick, 1)[0];
        if (e.dir !== dir) loop.push([k % W, (k - (k % W)) / W]);
        dir = e.dir;
        k = e.to;
        if (k === start) break;
      }
      if (loop.length >= 4) {
        const [a, b, z] = [loop[0], loop[1], loop[loop.length - 1]];
        if ((a[0] === b[0] && a[0] === z[0]) || (a[1] === b[1] && a[1] === z[1])) loop.shift();
      }
      if (loop.length >= 4) loops.push(loop);
    }
  }
  return loops;
}

// Add one traced loop to the path: vertices converted to pixels, each edge
// pushed `inset` toward the region (negative grows it), and every corner —
// convex or concave — replaced by an arc of radius rho.
function roundedOutline(c, loop, x0, y0, cell, inset, rho) {
  const n = loop.length;
  const pts = new Array(n);
  for (let i = 0; i < n; i++) {
    const [cc, rr] = loop[i];
    const [pc, pr] = loop[(i + n - 1) % n];
    const [nc, nr] = loop[(i + 1) % n];
    let x = x0 + cc * cell, y = y0 + rr * cell;
    if (pr === rr) y += (cc > pc ? 1 : -1) * inset; else x += (rr > pr ? -1 : 1) * inset;
    if (nr === rr) y += (nc > cc ? 1 : -1) * inset; else x += (nr > rr ? -1 : 1) * inset;
    pts[i] = [x, y];
  }
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  c.moveTo((pts[0][0] + pts[1][0]) / 2, (pts[0][1] + pts[1][1]) / 2);
  for (let k = 1; k <= n; k++) {
    const prev = pts[(k - 1) % n], a = pts[k % n], b = pts[(k + 1) % n];
    c.arcTo(a[0], a[1], b[0], b[1], Math.min(rho, dist(prev, a) / 2, dist(a, b) / 2));
  }
  c.closePath();
}

// The region between two neighbouring dots bounded by their own circles and two
// concave arcs of radius R tangent to both — the shape a water bridge makes.
// Traced clockwise so it can share a path with rect() squares.
function bridge(c, x1, y1, x2, y2, r, R) {
  const dx = x2 - x1, dy = y2 - y1;
  const d = Math.hypot(dx, dy);
  const half = d / 2;
  const hh = (r + R) ** 2 - half ** 2;
  if (hh <= 0) return;
  const h = Math.sqrt(hh);
  const ux = dx / d, uy = dy / d;
  const nx = -uy, ny = ux;
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const th = Math.atan2(uy, ux);
  const a = Math.atan2(h, half);
  const c1x = mx + h * nx, c1y = my + h * ny;
  const c2x = mx - h * nx, c2y = my - h * ny;
  const k = r / (r + R);
  c.moveTo(x2 + (c1x - x2) * k, y2 + (c1y - y2) * k);
  c.arc(c1x, c1y, R, th - a, th - Math.PI + a, true);
  c.arc(x1, y1, r, th + a, th - a, true);
  c.arc(c2x, c2y, R, th + Math.PI - a, th + a, true);
  c.arc(x2, y2, r, th + Math.PI + a, th + Math.PI - a, true);
  c.closePath();
}

function drawFlag(c, cx, cy, r, w) {
  const th = theme();
  const label = t('today');
  c.font = '700 11px system-ui, -apple-system, sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  const tw = c.measureText(label).width;
  const bw = tw + 16, bh = 20, tri = 5, gap = 4;
  const above = cy - r - gap - tri - bh >= 2;
  const by = above ? cy - r - gap - tri - bh : cy + r + gap + tri;
  const bx = clamp(cx - bw / 2, 4, w - bw - 4);
  c.fillStyle = th.bg;
  c.strokeStyle = th.accent;
  c.lineWidth = 1.5;
  c.beginPath();
  c.roundRect(bx, by, bw, bh, 4);
  c.fill();
  c.stroke();
  c.beginPath();
  if (above) { c.moveTo(cx - tri, by + bh); c.lineTo(cx + tri, by + bh); c.lineTo(cx, by + bh + tri); }
  else { c.moveTo(cx - tri, by); c.lineTo(cx + tri, by); c.lineTo(cx, by - tri); }
  c.closePath();
  c.fillStyle = th.accent;
  c.fill();
  c.fillStyle = th.ink;
  c.fillText(label, bx + bw / 2, by + bh / 2 + 0.5);
}

// Legend entries: periods, then dates.
function legendEntries() {
  const src = chartSource();
  return [
    ...src.ranges.filter(r => r.start !== null).map(r => ({
      color: r.color, text: r.label || `${fmtDate(r.start)} – ${r.end === null ? t('now') : fmtDate(r.end)}` })),
    ...src.events.map(e => ({ color: e.color, text: e.label || fmtDate(e.date), ring: true })),
  ];
}

function renderStats() {
  const pct = Math.round((model.lived / model.total) * 100);
  statsEl.innerHTML = t(model.demo ? 'statsDemo' : 'stats', fmtInt(model.lived), fmtInt(model.left), pct, fmtInt(model.total));
  legendEl.replaceChildren(...legendEntries().map(en => {
    const li = document.createElement('li');
    li.style.setProperty('--c', en.color);
    if (en.ring) li.className = 'ev';
    li.textContent = en.text;
    return li;
  }));
}

function render() {
  model = computeModel();
  renderStats();
  writeURL();
  requestAnimationFrame(draw);
}

let raf = 0;
new ResizeObserver(() => {
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(draw);
}).observe(canvas);

// ---------------------------------------------------------------------------
// Image export: the chart plus a footer with the stats and legend, rendered
// off-screen at 2–3x. On touch devices it goes to the share sheet (which on
// iOS offers "Save Image"); elsewhere it downloads.
// ---------------------------------------------------------------------------

function exportImage() {
  const th = theme();
  const rect = canvas.getBoundingClientRect();
  const w = Math.round(rect.width), gh = Math.round(rect.height);
  const scale = clamp(window.devicePixelRatio || 1, 2, 3);
  const pad = 16, line = 20;
  const entries = legendEntries();

  // measure the legend wrap first
  const off = document.createElement('canvas');
  const oc = off.getContext('2d');
  oc.font = '500 12px system-ui, -apple-system, sans-serif';
  const rowsOf = [];
  let cur = [], x = 0;
  for (const en of entries) {
    const wdt = 14 + oc.measureText(en.text).width + 16;
    if (x + wdt > w - pad * 2 && cur.length) { rowsOf.push(cur); cur = []; x = 0; }
    cur.push(en); x += wdt;
  }
  if (cur.length) rowsOf.push(cur);
  const footer = pad + line + rowsOf.length * line + pad;
  const h = gh + footer;

  off.width = Math.round(w * scale);
  off.height = Math.round(h * scale);
  oc.setTransform(scale, 0, 0, scale, 0, 0);
  oc.fillStyle = th.bg;
  oc.fillRect(0, 0, w, h);
  paintGrid(oc, w, gh);

  // footer: stats line, legend rows, site credit on the right
  const inkDim = mixOklab(th.ink, th.bg, 0.4);
  const pct = Math.round((model.lived / model.total) * 100);
  const stats = t(model.demo ? 'statsDemo' : 'stats', fmtInt(model.lived), fmtInt(model.left), pct, fmtInt(model.total)).replace(/<[^>]+>/g, '');
  let y = gh + pad + line / 2;
  oc.textBaseline = 'middle';
  oc.textAlign = 'left';
  oc.font = '600 13px system-ui, -apple-system, sans-serif';
  oc.fillStyle = th.ink;
  oc.fillText(stats, pad, y);
  oc.font = '500 11px system-ui, -apple-system, sans-serif';
  oc.fillStyle = inkDim;
  oc.textAlign = 'right';
  oc.fillText('bulatgab.github.io/lifeinweeks', w - pad, y);
  oc.textAlign = 'left';
  oc.font = '500 12px system-ui, -apple-system, sans-serif';
  for (const row of rowsOf) {
    y += line;
    let xx = pad;
    for (const en of row) {
      oc.beginPath();
      if (en.ring) { oc.lineWidth = 2; oc.strokeStyle = en.color; oc.arc(xx + 5, y, 4, 0, Math.PI * 2); oc.stroke(); }
      else { oc.fillStyle = en.color; oc.arc(xx + 5, y, 4.5, 0, Math.PI * 2); oc.fill(); }
      oc.fillStyle = inkDim;
      oc.fillText(en.text, xx + 14, y);
      xx += 14 + oc.measureText(en.text).width + 16;
    }
  }

  // Build the blob synchronously so the share call stays inside the user gesture.
  const dataURL = off.toDataURL('image/png');
  const bin = atob(dataURL.split(',')[1]);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const file = new File([bytes], t('imageName'), { type: 'image/png' });

  const coarse = matchMedia('(pointer: coarse)').matches;
  if (coarse && navigator.canShare && navigator.canShare({ files: [file] })) {
    navigator.share({ files: [file], title: t('title') }).catch(() => {});
    return;
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

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

const escapeHTML = (s) => s.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

function showTip(i, clientX, clientY) {
  const start = model.birth + i * WEEK;
  const end = start + 6 * DAY;
  const status = i < model.cur ? t('lived') : i === model.cur ? t('thisWeek') : t('ahead');
  const tags = [
    ...(model.covering[i] || []).map(r => `<span style="--c:${r.color}">${escapeHTML(r.label || t('untitledPeriod'))}</span>`),
    ...(model.marks[i] || []).map(e => `<span class="ev" style="--c:${e.color}">${escapeHTML(e.label || t('untitledDate'))} · ${fmtDate(e.date)}</span>`),
  ].join('');
  tipEl.innerHTML =
    `<b>${t('weekOf', fmtInt(i + 1), fmtInt(model.total))}</b> · ${status}<br>` +
    `${fmtDate(start)} – ${fmtDate(end)} · ${t('age', ageAt(model.birth, start))}` +
    (tags ? `<div class="tags">${tags}</div>` : '');
  tipEl.hidden = false;
  const tw = tipEl.offsetWidth, thh = tipEl.offsetHeight;
  const x = clamp(clientX + 14, 8, window.innerWidth - tw - 8);
  const y = clientY + 18 + thh > window.innerHeight - 8 ? clientY - thh - 12 : clientY + 18;
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
  const mk = (cls) => {
    const s = document.createElement('select');
    s.className = cls;
    if (placeholder) {
      const o = new Option('', '', true, true);
      o.disabled = true; o.hidden = true;
      s.append(o);
      s.required = true;
    }
    return s;
  };
  const day = mk('day'), month = mk('month'), year = mk('year');
  for (let d = 1; d <= 31; d++) day.append(new Option(d, d));
  for (let m = 1; m <= 12; m++) month.append(new Option('', m));
  let yr = [1900, 2100];

  function relabel() {
    day.setAttribute('aria-label', t('day'));
    month.setAttribute('aria-label', t('month'));
    year.setAttribute('aria-label', t('year'));
    if (placeholder) { day.options[0].text = t('day'); month.options[0].text = t('month'); year.options[0].text = t('year'); }
    for (let m = 1; m <= 12; m++) month.options[m - (placeholder ? 0 : 1)].text = fmtMonth(m);
  }

  function setYears(min, max) {
    yr = [min, max];
    const cur = year.value;
    year.replaceChildren(...(placeholder ? [year.options[0]] : []));
    for (let y = min; y <= max; y++) year.append(new Option(y, y));
    if (cur) year.value = cur;
  }
  setYears(...yr);
  relabel();

  function get() {
    if (!day.value || !month.value || !year.value) return null;
    const y = +year.value, m = +month.value;
    const d = Math.min(+day.value, daysInMonth(y, m));
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

  for (const s of [day, month, year]) s.addEventListener('change', () => onChange(get()));
  host.replaceChildren(day, month, year);
  return { get, set, setYears, relabel };
}

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
const sheet = document.getElementById('sheet');
const fab = document.getElementById('fab');
const closeBtn = document.getElementById('close');
const yearsIn = document.getElementById('years');
const totalHint = document.getElementById('total-hint');
const rangesEl = document.getElementById('ranges');
const eventsEl = document.getElementById('events');
const themesEl = document.getElementById('themes');
const waterEl = document.getElementById('water');
const shareFab = document.getElementById('share-fab');
const sharePop = document.getElementById('sharepop');
const welcome = document.getElementById('welcome');
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
  closeColorPop();
  closeLangMenus();
  panel.hidden = true;
  fab.setAttribute('aria-expanded', 'false');
  fab.focus({ preventScroll: true });
}

function syncForm() {
  birthField.set(state.birth);
  yearsIn.value = state.years;
  waterEl.querySelector(`input[value="${state.water}"]`).checked = true;
  updateTotalHint();
  syncRows();
  syncThemes();
}

function syncRows() {
  closeColorPop();
  const [y0, y1] = lifeYears();
  rangesEl.replaceChildren(...state.ranges.map(r => buildRangeRow(r, y0, y1)));
  eventsEl.replaceChildren(...state.events.map(e => buildEventRow(e, y0, y1)));
  if (!state.ranges.length) rangesEl.append(emptyNote(t('noPeriods')));
  if (!state.events.length) eventsEl.append(emptyNote(t('noDates')));
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
  totalHint.textContent = t('totalHint', fmtInt(m.total), fmtInt(m.left));
}

function wireHead(li, item, list) {
  const color = li.querySelector('.r-color');
  const label = li.querySelector('.r-label');
  li.item = item;
  enableReorder(li.querySelector('.r-grip'), li, item, list);
  color.style.setProperty('--c', item.color);
  label.value = item.label;
  color.addEventListener('click', () => openColorPop(color, item));
  label.addEventListener('input', () => { item.label = label.value; render(); });
  li.querySelector('.r-del').addEventListener('click', () => {
    list.splice(list.indexOf(item), 1);
    syncRows();
    render();
  });
}

// Reorder rows by dragging the grip (pointer events, so mouse and touch behave
// the same) or with the arrow keys while the grip is focused. Order is paint
// order and legend order.
const dragScroll = { dir: 0, raf: 0, y: 0 };

function enableReorder(grip, li, item, list) {
  grip.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    const rowsHost = li.parentElement;
    li.classList.add('dragging');
    document.body.classList.add('no-select');
    closeColorPop();

    const place = (y) => {
      const rows = [...rowsHost.querySelectorAll('.row')].filter(el => el !== li);
      const next = rows.find(el => { const b = el.getBoundingClientRect(); return y < b.top + b.height / 2; });
      if (next) { if (next !== li.nextElementSibling) rowsHost.insertBefore(li, next); }
      else if (rowsHost.lastElementChild !== li) rowsHost.append(li);
    };
    // Listen on the document rather than capturing the pointer: moving the row
    // in the DOM would release capture, and the pointerup would go astray.
    const move = (ev) => {
      if (ev.pointerId !== e.pointerId) return;
      dragScroll.y = ev.clientY;
      place(ev.clientY);
      const b = sheet.getBoundingClientRect();
      dragScroll.dir = ev.clientY < b.top + 64 ? -1 : ev.clientY > b.bottom - 64 ? 1 : 0;
      if (dragScroll.dir && !dragScroll.raf) tick();
    };
    const tick = () => {
      if (!dragScroll.dir) { dragScroll.raf = 0; return; }
      sheet.scrollTop += dragScroll.dir * 8;
      place(dragScroll.y);
      dragScroll.raf = requestAnimationFrame(tick);
    };
    const up = (ev) => {
      if (ev.pointerId !== e.pointerId) return;
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
      document.removeEventListener('pointercancel', up);
      li.classList.remove('dragging');
      document.body.classList.remove('no-select');
      dragScroll.dir = 0;
      const order = [...rowsHost.querySelectorAll('.row')].map(el => el.item);
      list.splice(0, list.length, ...order);
      render();
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
    document.addEventListener('pointercancel', up);
  });

  grip.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    e.preventDefault();
    const from = list.indexOf(item);
    const to = e.key === 'ArrowUp' ? from - 1 : from + 1;
    if (to < 0 || to >= list.length) return;
    list.splice(from, 1);
    list.splice(to, 0, item);
    syncRows();
    render();
    (list === state.ranges ? rangesEl : eventsEl).querySelectorAll('.r-grip')[to].focus({ preventScroll: true });
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
  ongoing.checked = r.end === null;
  end.set(r.end ?? todayUTC());
  endHost.hidden = r.end === null;
  ongoing.addEventListener('change', () => {
    r.end = ongoing.checked ? null : Math.max(r.start ?? todayUTC(), todayUTC());
    if (r.end !== null) end.set(r.end);
    endHost.hidden = r.end === null;
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

// One popover shared by every colour button: the theme's presets, the
// generated ring, and a custom picker as the last swatch.
const colorPop = document.getElementById('colorpop');
const colorPresets = colorPop.querySelector('.presets');
let popTarget = null;

function openColorPop(btn, item) {
  if (popTarget && popTarget.btn === btn) return closeColorPop();
  popTarget = { btn, item };
  const swatch = (c) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pc' + (c === item.color ? ' on' : '');
    b.style.setProperty('--c', c);
    b.setAttribute('aria-label', c);
    b.addEventListener('click', () => { setItemColor(c); closeColorPop(); });
    return b;
  };
  const custom = document.createElement('label');
  custom.className = 'pc custom';
  custom.title = t('customColour');
  const input = document.createElement('input');
  input.type = 'color';
  input.value = item.color;
  input.setAttribute('aria-label', t('customColour'));
  input.addEventListener('input', () => setItemColor(input.value));
  custom.append(input);
  colorPresets.replaceChildren(...[...theme().presets, ...extendedColors(theme())].map(swatch), custom);
  colorPop.hidden = false;
  const br = btn.getBoundingClientRect(), sr = sheet.getBoundingClientRect();
  const left = Math.min(br.left - sr.left, sr.width - colorPop.offsetWidth - 12);
  colorPop.style.left = Math.max(12, left) + 'px';
  colorPop.style.top = (br.bottom - sr.top + sheet.scrollTop + 6) + 'px';
  colorPresets.querySelector('.on, .pc')?.focus({ preventScroll: true });
}

function setItemColor(c) {
  if (!popTarget) return;
  popTarget.item.color = c;
  popTarget.btn.style.setProperty('--c', c);
  for (const b of colorPop.querySelectorAll('button.pc')) b.classList.toggle('on', b.style.getPropertyValue('--c') === c);
  render();
}

function closeColorPop() {
  colorPop.hidden = true;
  popTarget = null;
}

document.addEventListener('pointerdown', (e) => {
  if (popTarget && !colorPop.contains(e.target) && !popTarget.btn.contains(e.target)) closeColorPop();
});
sheet.addEventListener('scroll', () => { if (popTarget) closeColorPop(); }, { passive: true });

function syncThemes() {
  themesEl.replaceChildren(...Object.entries(THEMES).map(([key, th]) => {
    const label = document.createElement('label');
    label.className = 'swatch';
    label.innerHTML =
      `<input type="radio" name="theme" value="${key}">` +
      `<span class="sw" style="--sbg:${th.bg};--sink:${th.ink}">` +
      `<span class="dots"><i style="background:${th.past}"></i><i style="background:${th.future}"></i>` +
      `<i style="background:${th.presets[0]}"></i><i style="background:${th.presets[1]}"></i></span>${t('themes')[key]}</span>`;
    const input = label.querySelector('input');
    input.checked = key === state.theme;
    input.addEventListener('change', () => {
      switchTheme(key);
      syncRows();
      render();
    });
    return label;
  }));
}

waterEl.addEventListener('change', (e) => {
  if (e.target.name === 'water') { state.water = +e.target.value; render(); }
});

function setLang(lang) {
  state.lang = lang;
  state.langExplicit = true;
  applyLang();
  birthField.relabel();
  syncForm();
  render();
}

// Language menus (welcome dialog and settings sheet): a button that drops a
// small list; the current language is marked with a dot.
function closeLangMenus() {
  for (const m of document.querySelectorAll('.langmenu')) {
    m.querySelector('.langlist').hidden = true;
    m.querySelector('.langbtn').setAttribute('aria-expanded', 'false');
  }
}
const langMenuOpen = () => [...document.querySelectorAll('.langlist')].some(l => !l.hidden);
for (const m of document.querySelectorAll('.langmenu')) {
  const btn = m.querySelector('.langbtn'), list = m.querySelector('.langlist');
  btn.addEventListener('click', () => {
    const open = list.hidden;
    closeLangMenus();
    if (open) {
      list.hidden = false;
      btn.setAttribute('aria-expanded', 'true');
      list.querySelector('[aria-checked="true"]').focus({ preventScroll: true });
    }
  });
  list.addEventListener('click', (e) => {
    const b = e.target.closest('[data-lang]');
    if (!b) return;
    setLang(b.dataset.lang);
    closeLangMenus();
    btn.focus({ preventScroll: true });
  });
}
document.addEventListener('pointerdown', (e) => { if (!e.target.closest('.langmenu')) closeLangMenus(); });

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

document.getElementById('share-link').addEventListener('click', async (e) => {
  const btn = e.currentTarget;
  const old = btn.textContent;
  try {
    await navigator.clipboard.writeText(location.href);
    btn.textContent = t('copied');
  } catch {
    btn.textContent = t('copyFail');
  }
  setTimeout(() => { btn.textContent = old; }, 1800);
});

document.getElementById('share-image').addEventListener('click', exportImage);

function openShare() {
  // the bare link carries no data, so the warning would be wrong for the sample
  document.getElementById('share-link-hint').textContent = t(model.demo ? 'shareLinkDemoHint' : 'shareLinkHint');
  sharePop.hidden = false;
  shareFab.setAttribute('aria-expanded', 'true');
  hideTip();
  document.getElementById('share-link').focus({ preventScroll: true });
}
function closeShare() {
  sharePop.hidden = true;
  shareFab.setAttribute('aria-expanded', 'false');
  shareFab.focus({ preventScroll: true });
}
shareFab.addEventListener('click', openShare);
document.getElementById('share-close').addEventListener('click', closeShare);
sharePop.querySelector('.backdrop').addEventListener('click', closeShare);

// Welcome / About dialog: shown on first open (no date of birth in the URL)
// over the sample chart, and again on demand from the sheet's "About" link.
function openWelcome(asAbout = false) {
  document.getElementById('continue').textContent = t(asAbout ? 'close' : 'continue');
  welcome.hidden = false;
  hideTip();
  welcome.querySelector('.card').focus({ preventScroll: true });
}
function closeWelcome() {
  closeLangMenus();
  welcome.hidden = true;
  fab.focus({ preventScroll: true });
}
document.getElementById('continue').addEventListener('click', closeWelcome);
welcome.querySelector('.backdrop').addEventListener('click', closeWelcome);
document.getElementById('about-open').addEventListener('click', () => openWelcome(true));

document.getElementById('reset').addEventListener('click', () => {
  state.birth = null;
  state.years = DEFAULT_YEARS;
  state.ranges = [];
  state.events = [];
  state.water = 0;
  syncForm();
  render();
  document.querySelector('#birth select').focus({ preventScroll: true });
});

fab.addEventListener('click', openPanel);
closeBtn.addEventListener('click', closePanel);
document.getElementById('backdrop').addEventListener('click', closePanel);
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (langMenuOpen()) closeLangMenus();
  else if (!welcome.hidden) closeWelcome();
  else if (!sharePop.hidden) closeShare();
  else if (!panel.hidden) popTarget ? closeColorPop() : closePanel();
});

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

readURL();
applyTheme();
applyLang();
birthField.relabel();
render();
if (state.birth === null) openWelcome();

setInterval(() => {
  if (model && todayUTC() !== model.today) render();
}, 60_000);
