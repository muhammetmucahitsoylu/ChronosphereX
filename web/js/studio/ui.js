// The picture studio's page (studio.html): choose a frame on the map, read its wavelengths from NASA's archive,
// adjust the picture, take it away. The arithmetic runs in a worker (worker.js); this file is the screen.
import A from 'https://cdn.jsdelivr.net/npm/aladin-lite@3.8.2/dist/aladin.js';
import { STR, LANGS } from './words.js';
import { makeFrame, galacticUp, NATIVE, WAVES, BLANK } from './geom.js';
import { cost } from './cube.js';
import { RECIPES, LINES, lineSrc, around } from './recipes.js';
import { planesOf, DEFAULT_LOOK } from './process.js';
import { png16, tiff16, fits, toQuery, fromQuery } from './files.js';
import { drawMarks, layerName, CREDIT } from './marks.js';
import * as Prefs from './settings.js';
import { makeGuide } from './guide.js';

const $ = id => document.getElementById(id), q0 = new URLSearchParams(location.search);
const D2R = Math.PI / 180, clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const inApp = !!window.ChronoApp, narrow = matchMedia('(max-width: 599px), (max-width: 899px) and (min-height: 501px)').matches, phone = narrow || matchMedia('(pointer: coarse)').matches;

// ------------------------------------------------------------------------------------------------------ language
let lang = q0.get('lang');
try { lang = lang || localStorage.getItem('chrono-lang'); } catch { /* private mode */ }
try { if (q0.get('lang') && STR[q0.get('lang')]) localStorage.setItem('chrono-lang', q0.get('lang')); } catch { /* private mode */ }
if (!STR[lang]) lang = (navigator.languages || [navigator.language || 'en']).map(l => l.slice(0, 2).toLowerCase()).find(l => STR[l]) || 'en';
const T = STR[lang], fill = (s, o = {}) => s.replace(/\{(\w+)\}/g, (_, k) => (o[k] ?? ''));
const num = (x, n = 1) => (+x).toFixed(n).replace('.', T.dec);
document.documentElement.lang = lang; document.title = `${T.title} · ChronosphereX`;
const count = (path, title) => { try { window.goatcounter?.count?.({ path: `studio-${path}`, title: title || path, event: true }); } catch { /* blocked: fine */ } };

// ------------------------------------------------------------------------------------------------------ the state
const SHAPES = [['1:1', 1], ['4:5', 4 / 5], ['3:4', 3 / 4], ['9:16', 9 / 16], ['3:2', 3 / 2], ['16:9', 16 / 9]];
// places whose pictures were looked at before they were listed (spike/studio/batch.mjs): [key, ra, dec, width in degrees, shape, recipe, turn]
const PLACES = [['p_orion', 83.9, -4.2, 4.5, '3:4', 'gas'], ['p_carina', 161.0, -59.7, 4, '1:1', 'gas'], ['p_cygnus', 308.0, 41.5, 6, '3:2', 'gas'], ['p_rosette', 98.0, 4.95, 3, '1:1', 'gas'],
  ['p_rho', 246.7, -23.6, 4, '1:1', 'gas'], ['p_tarantula', 84.7, -69.1, 2.2, '1:1', 'gas'], ['p_m17', 275.2, -16.2, 3, '1:1', 'gas'], ['p_gc', 266.894, -29.196, 4.5, '3:2', 'dust', 'level'], ['p_m31', 10.68, 41.27, 4, '3:2', 'stars']];
const MAPS = [['wise', 'mapWise', 'https://irsa.ipac.caltech.edu/data/hips/CDS/AllWISE/RGB-W4-W2-W1'], ['dss', 'mapDss', 'https://irsa.ipac.caltech.edu/data/hips/CDS/DSS2/color'], ['2mass', 'map2mass', 'https://irsa.ipac.caltech.edu/data/hips/CDS/2MASS/Color']];
const SET = Prefs.load(phone), MIN_W = 300, maxPx = () => SET.maxMP * 1e6;
const S = {
  mode: 'basic', shape: '1:1', turn: 'north', recipe: 'gas', quality: 1, al: null,
  frame: null, doc: null, base: null, opened: null, pic: null, full: false, busy: false, openLayer: null,
  name: '', size: 'native', format: 'jpg', jpgQ: 0.92, fromLink: null,
};
try { S.mode = localStorage.getItem('chrono-studio-mode') === 'pro' ? 'pro' : 'basic'; S.name = localStorage.getItem('chrono-studio-name') || ''; } catch { /* private mode */ }

// ------------------------------------------------------------------------------------------------------ the worker
let worker = null, nextId = 1; const waiting = new Map();
function startWorker() {
  try { worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' }); } catch { worker = null; return false; }
  worker.onmessage = e => {
    const m = e.data, w = waiting.get(m.id); if (!w) return;
    if (m.t === 'bytes' || m.t === 'plane') { w.progress?.(m); return; }
    waiting.delete(m.id);
    if (m.t === 'error') w.no(new Error(m.message)); else w.ok(m);
  };
  worker.onerror = () => { for (const w of waiting.values()) w.no(new Error('worker')); waiting.clear(); };
  return true;
}
const ask = (msg, progress) => new Promise((ok, no) => { const id = nextId++; waiting.set(id, { ok, no, progress }); worker.postMessage({ ...msg, id }); });

// ------------------------------------------------------------------------------------------------------ words on the page
function words() {
  const set = (id, key, attr) => { const e = $(id); if (!e) return; if (attr) e.setAttribute(attr, T[key]); else e.textContent = T[key]; };
  for (const [id, key] of [['ttl', 'title'], ['placetitle', 'placeTitle'], ['placehelp', 'placeHelp'], ['h_places', 'places'], ['h_shape', 'shape'], ['l_turn', 'turnLabel'], ['l_map', 'map'], ['h_kind', 'kind'], ['h_kind2', 'kind'],
    ['h_quality', 'quality'], ['get', 'get'], ['go', 'go'], ['stop', 'stop'], ['another', 'another'], ['openmap', 'openMap'], ['h_edit', 'edit'], ['reset', 'reset'], ['reset2', 'reset'], ['h_layers', 'layers'], ['addband', 'addBand'],
    ['h_combine', 'combine'], ['h_whole', 'whole'], ['h_out', 'out'], ['tobox', 'out'], ['share', 'share'], ['save', 'save'], ['copy', 'copy'], ['link', 'link'], ['neednow', 'readNow'], ['rawnote', 'rawNote']]) set(id, key);
  set('q', 'search', 'placeholder'); set('q', 'search', 'aria-label'); set('zin', 'zoomIn', 'aria-label'); set('zout', 'zoomOut', 'aria-label'); set('mode', 'modeLabel', 'aria-label');
  $('mode').querySelector('[data-m=basic]').textContent = T.basic; $('mode').querySelector('[data-m=pro]').textContent = T.pro;
  $('guideword').textContent = T.guide; $('guidebtn').setAttribute('aria-label', T.guide); $('guidebtn').title = T.guide; $('setbtn').setAttribute('aria-label', T.settings); $('setbtn').title = T.settings;
  $('logo').href = `./?lang=${lang}`;
  $('turn').innerHTML = `<option value="north">${T.north}</option><option value="level">${T.level}</option>`;
  $('maplayer').innerHTML = MAPS.map(m => `<option value="${m[0]}">${T[m[1]]}</option>`).join('');
  $('shape').innerHTML = SHAPES.map(s => `<button type="button" data-s="${s[0]}">${s[0]}</button>`).join('');
  $('places').innerHTML = PLACES.map((p, i) => `<button type="button" class="chip" data-p="${i}">${T[p[0]]}</button>`).join('');
  const kinds = ['gas', 'stars', 'dust'];
  $('kind').innerHTML = kinds.map(r => `<button type="button" role="radio" data-r="${r}"><i class="sw ${r}"></i><b>${T['r_' + r]}</b><span>${T['r_' + r + '_d']}</span></button>`).join('');
  $('kind2').innerHTML = kinds.map(r => `<button type="button" data-r="${r}">${T['r_' + r]}</button>`).join('');
  for (const id of ['quality', 'quality2']) $(id).innerHTML = [1, 2, 3].map(n => `<button type="button" data-q="${n}">${T['q' + n]}</button>`).join('');
  $('addline').innerHTML = `<option value="">${T.addLine}</option>` + LINES.map(l => `<option value="${l.id}">${T['f_' + l.id]}</option>`).join('');
}

// ------------------------------------------------------------------------------------------------------ step one: the map
const shapeOf = () => SHAPES.find(s => s[0] === S.shape)?.[1] || 1;
let boxW = 0, boxH = 0;
function layFrame() {
  const st = $('stage').getBoundingClientRect(), a = shapeOf(), roomW = st.width * (narrow ? 0.86 : 0.74), roomH = st.height * (narrow ? 0.6 : st.height < 420 ? 0.66 : 0.72);
  boxW = Math.round(Math.min(roomW, roomH * a)); boxH = Math.round(boxW / a);
  $('frame').style.width = boxW + 'px'; $('frame').style.height = boxH + 'px';
}
/** The frame as the map shows it now: its centre, its size on the sky, which way is up. */
function frameFromMap() {
  if (!S.al) return null;
  const [ra, dec] = S.al.getRaDec(), fov = S.al.getFov()[0], mapW = $('map').clientWidth || 1;
  const w = boxW / mapW * 2 * Math.tan(Math.min(fov, 170) / 2 * D2R) / D2R, h = w * boxH / boxW;
  let rot = 0; try { rot = -(S.al.getRotation?.() || 0); } catch { rot = 0; }
  return makeFrame({ ra, dec, w, h, scale: NATIVE, rot: Math.abs(rot) < 0.01 ? 0 : rot });
}
/** Turns and zooms the map so that the frame holds a given patch. */
function showOnMap(ra, dec, wDeg, rot = null) {
  if (!S.al) return;
  const mapW = $('map').clientWidth || 1, fov = 2 * Math.atan(wDeg * D2R * mapW / (2 * boxW)) / D2R;
  S.al.gotoRaDec(ra, dec); S.al.setFoV(clamp(fov, 0.2, 120));
  if (rot !== null) turnMap(rot);
}
function turnMap(rot) { try { S.al.view.setRotation(-rot); } catch { try { if (rot) S.al.setRotation(-rot); } catch { /* an older build */ } } }
function applyTurn() {
  if (!S.al) return; const [ra, dec] = S.al.getRaDec();
  turnMap(S.turn === 'level' ? galacticUp(ra, dec) : 0);
}
const uniquePlanes = doc => { const s = new Set(); for (const L of doc.layers) if (L.on) for (const z of planesOf(L.src)) s.add(z); return [...s].sort((a, b) => a - b); };
let tellTimer = 0;
function tell() { clearTimeout(tellTimer); tellTimer = setTimeout(tellNow, 120); }
function tellNow() {
  const f = frameFromMap(); if (!f) return;
  $('framesize').textContent = `${num(f.w, f.w < 10 ? 1 : 0)}° × ${num(f.h, f.h < 10 ? 1 : 0)}°`;
  const big = f.W * f.H > maxPx(), small = f.W < MIN_W, says = $('framesays');
  says.classList.toggle('warn', big || small);
  if (big) says.textContent = fill(T.big, { W: Math.floor(Math.sqrt(maxPx() * shapeOf())) });
  else if (small) says.textContent = fill(T.small, { W: f.W });
  else says.textContent = fill(T.frameSays, { w: num(f.w, 1), h: num(f.h, 1), W: f.W, H: f.H });
  const c = cost(f), n = uniquePlanes(S.fromLink?.rest ? { layers: S.fromLink.rest.layers } : RECIPES[S.recipe](S.quality)).length, mb = Math.max(1, Math.round(c.bytesPerPlane * n / 1e6));
  const cell = navigator.connection && (navigator.connection.type === 'cellular' || navigator.connection.saveData);
  $('cost').textContent = big ? '' : fill(T.cost, { mb, n }) + (cell ? ' ' + T.mobile : '');
  $('get').disabled = big || S.busy;
  if (S.fromLink) { $('linkopens').hidden = false; $('linkopens').textContent = fill(T.linkOpens, { W: f.W, H: f.H, mb }); }
}
function marks(group, attr, value) { for (const b of $(group).children) { const on = b.dataset[attr] === String(value); b.setAttribute(group === 'kind' ? 'aria-checked' : 'aria-pressed', on); } }
function pickRecipe(r) { S.recipe = r; marks('kind', 'r', r); marks('kind2', 'r', r); tell(); }
function pickQuality(n) { S.quality = n; marks('quality', 'q', n); marks('quality2', 'q', n); $('qsay').textContent = T[`q${n}d`]; tell(); }
function pickShape(s) { S.shape = s; marks('shape', 's', s); const f = frameFromMap(); layFrame(); if (f) showOnMap(f.ra, f.dec, Math.max(f.w, f.h) * Math.min(1, shapeOf())); tell(); }

async function initMap(start) {
  await A.init;
  const layer = id => { const m = MAPS.find(x => x[0] === id) || MAPS[0]; return A.HiPS(m[2], { name: m[0] }); };
  S.al = A.aladin('#map', {
    survey: layer('wise'), target: `${start.ra} ${start.dec}`, fov: 12, projection: 'TAN', cooFrame: 'ICRS',
    showReticle: false, showLayersControl: false, showProjectionControl: false, showFullscreenControl: false, showFrame: false, showCooGridControl: false,
    showSettingsControl: false, showShareControl: false, showZoomControl: false, showCooLocation: false, showFov: false, showStatusBar: false, showContextMenu: false,
    backgroundColor: 'rgb(5, 7, 12)', log: false,
  });
  try { S.al.contextMenu = null; S.al.on('rightClickMove', () => {}); } catch { /* cosmetic */ }
  layFrame(); showOnMap(start.ra, start.dec, start.w, start.rot ?? 0);
  for (const ev of ['positionChanged', 'zoomChanged']) { try { S.al.on(ev, () => { if (S.turn === 'level' && ev === 'positionChanged') applyTurn(); tell(); }); } catch { /* older builds */ } }
  $('maplayer').onchange = e => { try { S.al.setBaseImageLayer(layer(e.target.value)); } catch { /* the map keeps what it shows */ } };
  setInterval(tell, 1500);          // a twist with two fingers changes nothing the map reports: look again now and then
  tell();
}

// names and coordinates typed into the box
function parseCoords(text) {
  let t = text.trim().replace(/[−–]/g, '-').replace(/,/g, ' ').trim();
  let m = t.match(/^([+-]?\d+(?:\.\d+)?)\s*(?:°|deg|d)?\s+([+-]?\d+(?:\.\d+)?)\s*(?:°|deg|d)?$/i);
  if (m) { const ra = +m[1], dec = +m[2]; return ra >= 0 && ra < 360 && Math.abs(dec) <= 90 ? { ra, dec } : null; }
  const n = '(\\d+(?:\\.\\d+)?)', a = '\\s*[hd:°\\s]\\s*', b = "\\s*[m:'′\\s]\\s*", e = '\\s*(?:s|"|″)?';
  m = t.match(new RegExp(`^${n}${a}${n}${b}${n}${e}\\s+([+-]?)${n}${a}${n}${b}${n}${e}$`, 'i'));
  if (!m) return null;
  const ra = (+m[1] + m[2] / 60 + m[3] / 3600) * 15, dec = (m[4] === '-' ? -1 : 1) * (+m[5] + m[6] / 60 + m[7] / 3600);
  return ra < 360 && Math.abs(dec) <= 90 ? { ra, dec } : null;
}
async function resolveName(name) {
  const one = async base => {
    const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 8000);
    try {
      const r = await fetch(base + encodeURIComponent(name), { signal: ctl.signal }); if (!r.ok) throw new Error('http');
      const x = await r.text(), g = tag => { const m = x.match(new RegExp(`<${tag}>\\s*([-+0-9.eE]+)`)); return m ? +m[1] : null; };
      const ra = g('jradeg'), dec = g('jdedeg'); return ra === null || dec === null ? null : { ra, dec };
    } finally { clearTimeout(timer); }
  };
  return Promise.any(['https://cds.unistra.fr/cgi-bin/nph-sesame/-oxp/SNV?', 'https://vizier.cfa.harvard.edu/viz-bin/nph-sesame/-oxp/SNV?'].map(one));
}
async function find(text) {
  const say = $('findmsg'); say.textContent = ''; text = text.trim(); if (!text) return;
  let at = parseCoords(text);
  if (!at) { try { at = await resolveName(text); if (!at) { say.textContent = T.notFound; return; } } catch { say.textContent = T.unreachable; return; } }
  const f = frameFromMap(); showOnMap(at.ra, at.dec, f ? f.w : 4); if (S.turn === 'level') applyTurn(); tell();
}

// ------------------------------------------------------------------------------------------------------ the picture's description
function newDoc(recipe, quality, frame, keep = {}) {
  const r = RECIPES[recipe](quality);
  return { v: 1, recipe, quality, frame, ...r, look: { ...r.look }, marks: { title: '', key: false, scale: false, compass: false, ...(keep.marks || {}) } };
}
const baseOf = doc => (RECIPES[doc.recipe] ? RECIPES[doc.recipe](doc.quality) : null);

// ------------------------------------------------------------------------------------------------------ reading
function busy(on, say = '', sub = '', frac = 0) {
  S.busy = on; $('busy').hidden = !on; $('get').disabled = on; if (on) $('need').hidden = true;
  if (on) { $('busysay').textContent = say; $('busysub').textContent = sub; $('busybar').style.width = `${Math.round(frac * 100)}%`; }
}
/** Reads the wavelengths a description still lacks. True when all are here. */
async function readFor(doc, why = '') {
  const first = await ask({ t: 'render', doc, target: 'small' });
  if (!first.missing) return true;
  const planes = first.missing, per = S.opened.bytesPerPlane, all = planes.length * per;
  busy(true, why || fill(T.reading, { got: 0, all: Math.max(1, Math.round(all / 1e6)) }), fill(T.readingN, { i: 1, n: planes.length }), 0.01);
  let done = 0;
  const r = await ask({ t: 'read', planes }, m => {
    if (m.t === 'plane') { done = m.done; S.have?.add(m.z); render(); }
    if (m.t === 'bytes') busy(true, why || fill(T.reading, { got: Math.round(m.got / 1e6), all: Math.max(1, Math.round(m.all / 1e6)) }), fill(T.readingN, { i: Math.min(planes.length, done + 1), n: planes.length }), m.got / m.all);
  });
  busy(false);
  if (r.failed) { if (!r.stopped) note([{ text: T.failed, warn: true, retry: true }]); return false; }
  return true;
}
/**
 * A band that lacks data over part of the frame at its wavelength gets the wavelength next to it, one at a time, to
 * cover the gap. Where that does not help (the survey has a hole there at every wavelength) it stops: nothing more
 * is fetched for it.
 */
async function heal() {
  if (!SET.heal) return;
  const gave = new Map();          // layer -> gap before its last addition
  for (let round = 0; round < 2; round++) {
    const p = await ask({ t: 'render', doc: S.doc, target: 'small' }); if (p.missing) return;
    let changed = false;
    for (const info of p.layers) {
      const L = S.doc.layers.find(x => x.id === info.id);
      if (!L || L.src.kind !== 'band' || info.gaps < 0.004 || L.src.planes.length >= 3) continue;
      if (gave.has(L.id) && info.gaps > gave.get(L.id) * 0.7) continue;          // the last one added did not help
      const zs = L.src.planes, lo = zs[0] - 1, hi = zs[zs.length - 1] + 1, ok = z => z >= 0 && z < WAVES.length && !BLANK.has(z);
      const mid = zs.reduce((s, z) => s + WAVES[z], 0) / zs.length, pick = [lo, hi].filter(ok).sort((x, y) => Math.abs(WAVES[x] - mid) - Math.abs(WAVES[y] - mid))[0];
      if (pick === undefined) continue;
      gave.set(L.id, info.gaps); L.src = { kind: 'band', planes: [...zs, pick].sort((x, y) => x - y) }; changed = true;
    }
    if (!changed) return;
    if (!await readFor(S.doc, T.healing)) return;
  }
}
async function getPicture() {
  const f = frameFromMap(); if (!f || f.W * f.H > maxPx() || S.busy) return;
  if (!worker && !startWorker()) { $('framesays').textContent = T.noWorker; return; }
  const want = S.fromLink?.rest ? { layers: S.fromLink.rest.layers } : RECIPES[S.recipe](S.quality), bytes = cost(f).bytesPerPlane * uniquePlanes(want).length;
  if (Prefs.mustAsk(SET, bytes) && !await Prefs.askFirst(T, fill, bytes)) return;
  S.frame = f; S.pic = null; S.working = true; S.have = new Set();
  const link = S.fromLink; S.fromLink = null; $('linkopens').hidden = true;
  S.doc = newDoc(S.recipe, S.quality, { ra: f.ra, dec: f.dec, w: f.w, h: f.h, rot: f.rot, scale: f.scale });
  if (link?.rest) Object.assign(S.doc, { layout: link.rest.layout || S.doc.layout, blend: link.rest.blend || S.doc.blend, balance: link.rest.balance || S.doc.balance, layers: link.rest.layers, stretch: link.rest.stretch || S.doc.stretch, look: { ...link.rest.look }, marks: { ...S.doc.marks, ...link.rest.marks } });
  document.body.className = 'studio'; $('picker').hidden = true; $('easel').hidden = false; $('sideplace').hidden = true; $('sidestudio').hidden = false;
  window.scrollTo({ top: 0 }); $('side').scrollTop = 0;
  const cv = $('pic'); cv.width = f.W; cv.height = f.H; cv.getContext('2d').fillRect(0, 0, f.W, f.H); layMarks();
  busy(true, T.working);
  S.opened = await ask({ t: 'open', frame: S.doc.frame, previewMax: SET.preview });
  retry = readNeeded;
  build(); note([]);
  count(`read-${S.recipe}`, `Read: ${S.recipe}`);
  try {
    if (await readFor(S.doc)) await heal();
    await render();          // also after a reading that was stopped or failed: the page then says what is still to be read
  } finally { S.working = false; }
  build();
}
function backToPlace() {
  worker?.postMessage({ t: 'stop' }); busy(false);
  document.body.className = 'place'; $('picker').hidden = false; $('easel').hidden = true; $('sideplace').hidden = false; $('sidestudio').hidden = true;
  setFull(false); window.scrollTo({ top: 0 }); layFrame(); tell();
}

// ------------------------------------------------------------------------------------------------------ drawing
let rendering = false, again = false;
async function render() {
  if (!S.doc || !worker) return;
  if (rendering) { again = true; return; }
  rendering = true;
  try {
    do {
      again = false;
      const p = await ask({ t: 'render', doc: S.doc, target: S.full ? 'full' : 'small' });
      if (p.missing) { needRead(p.missing); break; }
      needRead([]);
      S.pic = p;
      const cv = $('pic'); if (cv.width !== p.W || cv.height !== p.H) { cv.width = p.W; cv.height = p.H; }
      cv.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(p.rgba), p.W, p.H), 0, 0);
      layMarks(); notesFor(p); hist();
    } while (again);
  } catch (e) { note([{ text: String(e.message || e), warn: true }]); } finally { rendering = false; }
}
/** The words drawn over the picture (credit, title, key …), sharp at the size the picture is shown. */
function layMarks() {
  const cv = $('pic'), mk = $('marks'), p = S.pic; if (!S.doc) return;
  const box = cv.getBoundingClientRect(), dpr = Math.min(3, window.devicePixelRatio || 1);
  const W = S.full ? cv.width : Math.max(1, Math.round(box.width * dpr)), H = S.full ? cv.height : Math.max(1, Math.round(box.height * dpr));
  if (mk.width !== W || mk.height !== H) { mk.width = W; mk.height = H; }
  const x = mk.getContext('2d'); x.clearRect(0, 0, W, H);
  if (p) drawMarks(x, W, H, { doc: S.doc, rects: p.rects, picW: p.W, picH: p.H, name: S.name, T, lang });
}
function setFull(on) {
  S.full = on; document.body.classList.toggle('fullsize', on); $('fullbtn').setAttribute('aria-pressed', on); $('fullbtn').textContent = on ? T.fit : T.full; $('fullbtn').title = T.fullHint;
  if (S.doc && !$('easel').hidden) render();
}
function needRead(planes) {
  const box = $('need'); box.hidden = !planes.length || S.busy; S.need = planes;
  if (planes.length && S.opened) $('needsay').textContent = fill(T.needRead, { n: planes.length, mb: Math.max(1, Math.round(planes.length * S.opened.bytesPerPlane / 1e6)) });
}
let retry = null;
function note(list) {
  $('notes').innerHTML = '';
  for (const n of list) {
    const p = document.createElement('p'); p.className = 'note' + (n.warn ? ' warn' : ''); p.textContent = n.text;
    if (n.retry) { const b = document.createElement('button'); b.type = 'button'; b.className = 'ghost small'; b.textContent = T.again; b.style.marginLeft = '8px'; b.onclick = () => retry?.(); p.append(b); }
    $('notes').append(p);
  }
}
function notesFor(p) {
  const list = [];
  // one note for all the layers that lack data: the largest share, and the wavelengths it is about
  const gapped = p.layers.filter(i => i.gaps >= 0.005).map(i => [i.gaps, S.doc.layers.find(x => x.id === i.id)]).filter(g => g[1]);
  if (gapped.length) { const most = Math.max(...gapped.map(g => g[0])); list.push({ text: fill(T.gapNote, { p: num(most * 100, most < 0.1 ? 1 : 0), um: gapped.map(g => layerName(g[1], T, lang, true)).join(', ') }), warn: true }); }
  const lines = p.layers.filter(i => S.doc.layers.find(x => x.id === i.id)?.src.kind === 'line');
  if (lines.length && lines.every(i => i.floor)) list.push({ text: T.emptyNote });
  else if (lines.length) list.push({ text: T.stripeNote });
  note(list);
}

// ------------------------------------------------------------------------------------------------------ controls
function slider(host, label, min, max, step, get, set, fmt = v => num(v, 2), live = true, key = '') {
  const d = document.createElement('div'); d.className = 'ctl'; if (key) d.dataset.k = key;
  const id = `c${Math.random().toString(36).slice(2, 9)}`;
  d.innerHTML = `<label for="${id}"></label><output></output><input id="${id}" type="range" min="${min}" max="${max}" step="${step}">`;
  const [lb, out, inp] = d.children; lb.textContent = label; inp.value = get(); out.textContent = fmt(+inp.value);
  inp.addEventListener(live ? 'input' : 'change', () => { set(+inp.value); out.textContent = fmt(+inp.value); changed(); });
  if (!live) inp.addEventListener('input', () => { out.textContent = fmt(+inp.value); });
  host.append(d); return inp;
}
function chooser(host, label, options, get, set, key = '') {
  const d = document.createElement('div'); d.className = 'ctl inline'; if (key) d.dataset.k = key;
  const id = `c${Math.random().toString(36).slice(2, 9)}`;
  d.innerHTML = `<label for="${id}"></label><select id="${id}">${options.map(([v, t]) => `<option value="${v}">${t}</option>`).join('')}</select>`;
  d.children[0].textContent = label; d.children[1].value = get();
  d.children[1].onchange = e => { set(e.target.value); changed(true); };
  host.append(d);
}
let saveTimer = 0;
function changed(rebuild = false) {
  render();
  if (rebuild) build();
  clearTimeout(saveTimer); saveTimer = setTimeout(() => { try { sessionStorage.setItem('chrono-studio-last', toQuery(S.doc)); } catch { /* private mode */ } }, 600);
}
const log = (lo, hi) => ({ to: v => Math.log(v / lo) / Math.log(hi / lo), from: t => lo * Math.pow(hi / lo, t) });

function buildBasic() {
  const host = $('basic'), d = S.doc, base = baseOf(d); host.innerHTML = '';
  slider(host, T.bright, -2, 2, 0.02, () => d.look.bright ?? 0, v => { d.look.bright = v; }, v => (v > 0 ? '+' : '') + num(v, 1));
  slider(host, T.contrast, -0.6, 0.9, 0.02, () => d.look.contrast ?? 0, v => { d.look.contrast = v; }, v => (v > 0 ? '+' : '') + num(v, 1));
  slider(host, T.colour, 0, 2.4, 0.02, () => d.look.sat ?? 1, v => { d.look.sat = v; }, v => num(v, 1));
  // faint detail: the strength of every layer's curve, as a multiple of the recipe's own
  const k0 = L => base?.layers.find(x => x.id === L.id)?.k ?? 8, s0 = base?.stretch?.k ?? 10;
  const now = () => (d.blend === 'ratio' ? Math.log2((d.stretch?.k ?? s0) / s0) / 2 : (d.layers[0] ? Math.log2(d.layers[0].k / k0(d.layers[0])) / 2 : 0));
  slider(host, T.faint, -1.5, 1.5, 0.02, now, v => { const m = Math.pow(4, v); for (const L of d.layers) L.k = clamp(k0(L) * m, 0.3, 400); if (d.stretch) d.stretch.k = clamp(s0 * m, 0.3, 400); }, v => (v > 0 ? '+' : '') + num(v, 1), true, 'faint');
  slider(host, T.sharp, 0, 1.6, 0.02, () => d.look.sharpen ?? 0, v => { d.look.sharpen = v; }, v => num(v, 1));
  slider(host, T.speckle, 0, 6, 0.1, () => d.look.chroma ?? 0, v => { d.look.chroma = v; }, v => num(v, 1));
}

const rgbHex = c => '#' + c.map(v => Math.round(clamp(v, 0, 1) * 255).toString(16).padStart(2, '0')).join('');
const hexRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
const STOPS = [[0.75, [120, 170, 255]], [1.2, [110, 225, 255]], [1.7, [130, 255, 190]], [2.2, [240, 245, 140]], [2.9, [255, 190, 90]], [3.4, [255, 140, 60]], [4.1, [255, 85, 55]], [5.0, [225, 45, 85]]];
const tintOf = um => { let i = 0; while (i < STOPS.length - 2 && um > STOPS[i + 1][0]) i++; const [a, ca] = STOPS[i], [b, cb] = STOPS[i + 1], t = clamp((um - a) / (b - a), 0, 1); return `rgb(${ca.map((v, k) => Math.round(v + (cb[k] - v) * t)).join(',')})`; };

function strip(host, L) {
  const wrap = document.createElement('div'); wrap.className = 'strip';
  const cells = document.createElement('div'); cells.className = 'cells'; const ticks = document.createElement('div'); ticks.className = 'ticks';
  const isLine = L.src.kind === 'line', onSet = new Set(isLine ? L.src.on : L.src.planes), offSet = new Set(isLine ? L.src.off.map(o => o[0]) : []);
  let lastTick = -9;
  WAVES.forEach((um, z) => {
    const b = document.createElement('button'); b.type = 'button'; b.style.background = BLANK.has(z) ? '#222' : tintOf(um); b.disabled = BLANK.has(z);
    b.title = `${num(um, 3)} µm`; b.setAttribute('aria-label', b.title);
    b.className = (onSet.has(z) ? 'on' : offSet.has(z) ? 'off' : '') + (S.have?.has(z) ? ' have' : '');
    b.onclick = () => {
      if (isLine) { if (onSet.has(z)) { onSet.delete(z); offSet.add(z); } else if (offSet.has(z)) offSet.delete(z); else onSet.add(z); if (!onSet.size) onSet.add(z); L.src = offSet.size ? lineSrc([...onSet].sort((a, c) => a - c), [...offSet].sort((a, c) => a - c)) : { kind: 'line', on: [...onSet].sort((a, c) => a - c), off: [] }; }
      else { if (onSet.has(z)) { if (onSet.size > 1) onSet.delete(z); } else onSet.add(z); L.src = { kind: 'band', planes: [...onSet].sort((a, c) => a - c) }; }
      changed(true);
    };
    cells.append(b);
    const t = document.createElement('span'); if (um - lastTick >= 0.5 || z === 0) { t.textContent = num(um, 1); lastTick = um; } ticks.append(t);
  });
  wrap.append(cells, ticks); host.append(wrap);
  const hint = document.createElement('p'); hint.className = 'pickhint'; hint.textContent = isLine ? T.pickLine : T.pick; host.append(hint);
  const first = [...onSet][0]; if (first !== undefined) requestAnimationFrame(() => { wrap.scrollLeft = Math.max(0, first * 16 - wrap.clientWidth / 2); });
}
function buildLayers() {
  const host = $('layers'), d = S.doc; host.innerHTML = '';
  d.layers.forEach((L, i) => {
    const card = document.createElement('div'); card.className = 'layer' + (S.openLayer === L.id ? ' open' : '');
    const head = document.createElement('header');
    const on = document.createElement('input'); on.type = 'checkbox'; on.checked = L.on; on.title = T.show; on.setAttribute('aria-label', T.show); on.onchange = () => { L.on = on.checked; changed(); };
    const col = document.createElement('input'); col.type = 'color'; col.value = rgbHex(L.color); col.setAttribute('aria-label', T.tint); col.oninput = () => { L.color = hexRgb(col.value); changed(); };
    const name = document.createElement('button'); name.type = 'button'; name.className = 'name'; name.textContent = layerName(L, T, lang); name.onclick = () => { S.openLayer = S.openLayer === L.id ? null : L.id; buildLayers(); hist(); };
    const x = document.createElement('button'); x.type = 'button'; x.className = 'x'; x.textContent = '×'; x.title = T.remove; x.setAttribute('aria-label', T.remove); x.disabled = d.layers.length < 2;
    x.onclick = () => { d.layers.splice(i, 1); changed(true); };
    head.append(on, col, name, x); card.append(head);
    const body = document.createElement('div'); body.className = 'body'; card.append(body);
    if (S.openLayer === L.id) {
      const cv = document.createElement('canvas'); cv.className = 'hist'; cv.id = 'hist'; cv.width = 360; cv.height = 56; body.append(cv);
      chooser(body, T.from, [['band', T.band], ['line', T.line]], () => L.src.kind, v => {
        if (v === L.src.kind) return;
        if (v === 'line') { const z = L.src.planes[Math.floor(L.src.planes.length / 2)]; L.src = lineSrc([z], [Math.max(0, z - 2), Math.min(WAVES.length - 1, z + 2)].filter(k => !BLANK.has(k) && k !== z)); Object.assign(L, { lo: 50, loS: 6, hi: 99.8, hiS: 120, smooth: 0.6 }); }
        else { L.src = { kind: 'band', planes: [...L.src.on] }; Object.assign(L, { loS: 0, hiS: 0, smooth: 0 }); delete L.clean; }
      });
      strip(body, L);
      chooser(body, T.bg, [['level', T.bgLevel], ['slope', T.bgSlope], ['none', T.bgNone]], () => L.bg, v => { L.bg = v; });
      slider(body, T.black, 0, 99.9, 0.1, () => L.lo, v => { L.lo = v; }, v => num(v, 1) + ' %', true, 'black');
      slider(body, T.blackS, 0, 12, 0.1, () => L.loS || 0, v => { L.loS = v; }, v => num(v, 1) + ' σ');
      slider(body, T.white, 90, 100, 0.01, () => L.hi, v => { L.hi = v; }, v => num(v, 2) + ' %');
      if (d.blend !== 'ratio' || d.layout === 'panels') {
        chooser(body, T.curve, ['asinh', 'log', 'sqrt', 'linear', 'gamma'].map(c => [c, T['c_' + c]]), () => L.curve, v => { L.curve = v; if (v === 'gamma' && L.k > 5) L.k = 2.2; }, 'curve');
        const sc = log(0.3, 400); slider(body, T.strength, 0, 1, 0.005, () => sc.to(clamp(L.k, 0.3, 400)), v => { L.k = sc.from(v); }, v => num(sc.from(v), sc.from(v) < 10 ? 1 : 0));
      }
      slider(body, T.smooth, 0, 5, 0.1, () => L.smooth || 0, v => { L.smooth = v; }, v => num(v, 1) + ' px');
      if (L.src.kind === 'line') slider(body, T.clean, 0, 3, 1, () => L.clean ?? 1, v => { L.clean = v; }, v => `${v} px`, false, 'clean');
      slider(body, T.weight, 0, 2, 0.01, () => L.gain ?? 1, v => { L.gain = v; }, v => Math.round(v * 100) + ' %');
    }
    host.append(card);
  });
}
function buildPro() {
  const d = S.doc; buildLayers();
  const c = $('combine'); c.innerHTML = '';
  chooser(c, T.combine, [['add', T.b_add], ['screen', T.b_screen], ['ratio', T.b_ratio]], () => d.blend, v => { d.blend = v; if (v === 'ratio' && !d.stretch) d.stretch = { k: 10, depth: 0.7, blur: 2.5 }; });
  chooser(c, T.layout, [['one', T.l_one], ['panels', T.l_panels]], () => d.layout, v => { d.layout = v; });
  if (d.blend === 'ratio' && d.layout !== 'panels') {
    const sc = log(0.3, 400); slider(c, T.strength, 0, 1, 0.005, () => sc.to(clamp(d.stretch.k, 0.3, 400)), v => { d.stretch.k = sc.from(v); }, v => num(sc.from(v), sc.from(v) < 10 ? 1 : 0));
    slider(c, T.depth, 0, 1.5, 0.01, () => d.stretch.depth ?? 0.7, v => { d.stretch.depth = v; }, v => num(v, 2));
    slider(c, T.speckle, 0, 8, 0.1, () => d.stretch.blur ?? 2.5, v => { d.stretch.blur = v; }, v => num(v, 1) + ' px');
  } else if (d.layout !== 'panels') chooser(c, T.balance, [['own', T.bal_own], ['stars', T.bal_stars], ['linked', T.bal_linked]], () => d.balance, v => { d.balance = v; });
  const w = $('whole'), k = d.look; w.innerHTML = '';
  const sg = v => (v > 0 ? '+' : '') + num(v, 2);
  slider(w, T.bright, -2, 2, 0.01, () => k.bright ?? 0, v => { k.bright = v; }, sg);
  slider(w, T.contrast, -0.6, 0.9, 0.01, () => k.contrast ?? 0, v => { k.contrast = v; }, sg);
  slider(w, T.blackLevel, -0.1, 0.4, 0.002, () => k.black ?? 0, v => { k.black = v; }, v => num(v, 3));
  slider(w, T.mid, 0.4, 2.5, 0.01, () => k.gamma ?? 1, v => { k.gamma = v; });
  slider(w, T.colour, 0, 2.4, 0.01, () => k.sat ?? 1, v => { k.sat = v; });
  slider(w, T.scnr, 0, 1, 0.01, () => k.scnr ?? 0, v => { k.scnr = v; });
  slider(w, T.speckle, 0, 8, 0.1, () => k.chroma ?? 0, v => { k.chroma = v; }, v => num(v, 1) + ' px');
  slider(w, T.soften, 0, 4, 0.05, () => k.soften ?? 0, v => { k.soften = v; }, v => num(v, 2) + ' px');
  slider(w, T.sharp, 0, 2, 0.01, () => k.sharpen ?? 0, v => { k.sharpen = v; });
  slider(w, T.sharpR, 0.5, 6, 0.1, () => k.sharpenR ?? 1.5, v => { k.sharpenR = v; }, v => num(v, 1) + ' px');
  slider(w, T.local, 0, 1.5, 0.01, () => k.local ?? 0, v => { k.local = v; });
}
async function hist() {
  const cv = $('hist'), L = S.doc?.layers.find(x => x.id === S.openLayer); if (!cv || !L || S.mode !== 'pro') return;
  let h; try { h = await ask({ t: 'hist', layer: L }); } catch { return; }
  if (!h.bars || $('hist') !== cv) return;
  const x = cv.getContext('2d'), W = cv.width, H = cv.height, top = Math.log1p(Math.max(...h.bars)); x.clearRect(0, 0, W, H);
  x.fillStyle = rgbHex(L.color.map(v => 0.35 + 0.65 * v));
  h.bars.forEach((n, i) => { const y = top ? Math.log1p(n) / top * (H - 4) : 0; x.fillRect(i * W / 64, H - y, W / 64 - 1, y); });
  const at = v => clamp((v - h.lo) / ((h.hi - h.lo) || 1), 0, 1) * W, pi = S.pic?.layers.find(i => i.id === L.id);
  if (pi) { x.fillStyle = '#fff'; x.fillRect(at(pi.black) - 1, 0, 2, H); x.fillRect(Math.min(W - 2, at(pi.white)) - 1, 0, 2, H); }
}

function buildOut() {
  const host = $('out'), d = S.doc; host.innerHTML = '';
  const text = (label, get, set, max = 60, key = '') => {
    const w = document.createElement('div'); w.className = 'ctl'; const id = `c${Math.random().toString(36).slice(2, 9)}`;
    w.innerHTML = `<label for="${id}"></label><output></output><input id="${id}" type="text" maxlength="${max}" autocomplete="off">`; w.children[0].textContent = label; w.children[2].value = get();
    w.children[2].oninput = e => { set(e.target.value); layMarks(); }; if (key) w.dataset.k = key; host.append(w);
  };
  text(T.yourName, () => S.name, v => { S.name = v.trim(); try { localStorage.setItem('chrono-studio-name', S.name); } catch { /* private mode */ } }, 40);
  text(T.titleOn, () => d.marks.title || '', v => { d.marks.title = v; changed(); }, 60, 'title');
  const ch = document.createElement('div'); ch.className = 'checks';
  for (const [key, label] of [['key', T.key], ['scale', T.scale], ['compass', T.compass]]) {
    const l = document.createElement('label'), c = document.createElement('input'); c.type = 'checkbox'; c.checked = !!d.marks[key]; c.onchange = () => { d.marks[key] = c.checked; layMarks(); changed(); };
    l.append(c, document.createTextNode(label)); ch.append(l);
  }
  host.append(ch);
  const W = S.pic?.W && S.full ? S.pic.W : (S.opened ? (d.layout === 'panels' && S.opened.frame.W < S.opened.frame.H ? S.opened.frame.W * d.layers.filter(l => l.on).length : S.opened.frame.W) : 0);
  const sizes = [['native', `${T.sizeNative}${W ? ` (${W} px)` : ''}`], ['1080', '1080 px'], ['2160', '2160 px'], ['3840', '3840 px (4K)']];
  chooser(host, T.size, sizes, () => S.size, v => { S.size = v; });
  const fmts = [['jpg', T.fmt_jpg], ['png', T.fmt_png]];
  if (S.mode === 'pro' && !inApp) fmts.push(['png16', T.fmt_png16], ['tiff16', T.fmt_tiff16], ['fits', T.fmt_fits], ['fitsall', T.fmt_fitsall], ['json', T.fmt_json]);
  if (!fmts.some(f => f[0] === S.format)) S.format = 'jpg';
  chooser(host, T.format, fmts, () => S.format, v => { S.format = v; }, 'format');
  if (S.mode === 'pro' && S.format === 'jpg') slider(host, T.jpgQ, 0.5, 1, 0.01, () => S.jpgQ, v => { S.jpgQ = v; }, v => Math.round(v * 100) + ' %');
  const raw = ['png16', 'tiff16', 'fits', 'fitsall', 'json'].includes(S.format);
  $('rawnote').hidden = !raw; $('copy').hidden = raw || !(navigator.clipboard && window.ClipboardItem);
  $('share').hidden = !navigator.share;
}
function build() {
  if (!S.doc) return;
  $('basicbox').hidden = S.mode !== 'basic'; $('probox').hidden = S.mode !== 'pro';
  marks('kind2', 'r', S.doc.recipe); marks('quality2', 'q', S.doc.quality);
  const f = S.doc.frame; $('openmap').href = `./?ra=${f.ra.toFixed(5)}&dec=${f.dec.toFixed(5)}&fov=${Math.max(f.w, f.h).toFixed(2)}&lang=${lang}`;
  if (S.mode === 'basic') buildBasic(); else buildPro();
  buildOut();
}
function setMode(m) {
  S.mode = m; for (const b of $('mode').children) b.setAttribute('aria-pressed', b.dataset.m === m);
  try { localStorage.setItem('chrono-studio-mode', m); } catch { /* private mode */ }
  build(); hist();
}
/** Another recipe or quality for the frame already open: what it still needs is read only when the visitor says so. */
function switchRecipe(recipe, quality) {
  if (!S.doc) return;
  S.recipe = recipe; S.quality = quality;
  S.doc = newDoc(recipe, quality, S.doc.frame, { marks: S.doc.marks }); S.openLayer = null;
  build(); render();
}
async function readNeeded() {
  const bytes = (S.need?.length || 0) * (S.opened?.bytesPerPlane || 0);
  if (SET.ask > 0 && bytes > SET.ask * 1e6 && !await Prefs.askFirst(T, fill, bytes)) return;          // the box itself already says the size: asked again only above the limit
  $('need').hidden = true; S.working = true;
  try { if (await readFor(S.doc)) await heal(); await render(); } finally { S.working = false; }
  build();
}
function settings() {
  Prefs.openSettings({ T, fill, lang, LANGS, set: SET, phone,
    onChange: () => { tell(); },
    onLang: code => { const q = new URLSearchParams(location.search); q.set('lang', code); try { localStorage.setItem('chrono-lang', code); } catch { /* private mode */ } location.search = q.toString(); },
    onGuide: () => guide.menu() });
}

// ------------------------------------------------------------------------------------------------------ taking it away
const slug = () => (S.doc.marks.title || '').normalize('NFKD').replace(/[^\x00-\x7f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || `ra${S.doc.frame.ra.toFixed(2)}-dec${S.doc.frame.dec.toFixed(2)}`;
const fileText = () => ({ Software: 'ChronosphereX picture studio (chronospherex.com)', Description: `${S.name ? `Processing: ${S.name}. ` : ''}Data: NASA SPHEREx all-sky cube, DR1. Made at chronospherex.com` });
async function makeFile() {
  const d = S.doc, base = `chronospherex-${slug()}`;
  if (S.format === 'json') return { blob: new Blob([JSON.stringify(d, null, 1)], { type: 'application/json' }), name: `${base}.json` };
  if (S.format === 'png16' || S.format === 'tiff16') {
    const p = await ask({ t: 'words', doc: d }), words = new Uint16Array(p.words);
    return S.format === 'png16' ? { blob: await png16(words, p.W, p.H, fileText()), name: `${base}-16bit.png` } : { blob: tiff16(words, p.W, p.H, fileText()), name: `${base}-16bit.tif` };
  }
  if (S.format === 'fits' || S.format === 'fitsall') {
    const fr = S.opened.frame;
    if (S.format === 'fits') {
      const p = await ask({ t: 'lights', doc: d });
      const plain = t => t.replace(/\s*·\s*/g, ' ').replace(/–/g, '-').replace(/µm/g, 'um').replace(/α/g, 'alpha').replace(/[^\x20-\x7e]/g, '').slice(0, 60);
      const cards = p.layers.map((l, i) => [`LAYER${i + 1}`, plain(layerName(d.layers.find(x => x.id === l.id), STR.en, 'en'))]);
      return { blob: fits(p.layers.map(l => new Float32Array(l.data)), p.W, p.H, fr, { cards, notes: ['Layers as the studio combines them, background taken off, not stretched.', 'Saturated star cores and survey gaps are filled.'] }), name: `${base}-layers.fits` };
    }
    const p = await ask({ t: 'planes' });
    const cards = p.planes.flatMap((pl, i) => [[`WAVE${i + 1}`, WAVES[pl.z], 'micron, plane ' + pl.z]]);
    return { blob: fits(p.planes.map(pl => new Float32Array(pl.data)), p.W, p.H, fr, { cards, notes: ['Planes of the SPHEREx cube as read, resampled to this frame.', 'Saturated star cores are filled with the largest value around them;', 'pixels the survey has not covered are NaN.'] }), name: `${base}-wavelengths.fits` };
  }
  // an 8-bit picture: the full frame, brought to the size asked for, with the words drawn on it
  const p = await ask({ t: 'render', doc: d, target: 'full' }); if (p.missing) throw new Error('missing');
  const src = document.createElement('canvas'); src.width = p.W; src.height = p.H; src.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(p.rgba), p.W, p.H), 0, 0);
  const k = S.size === 'native' ? 1 : +S.size / p.W, W = Math.round(p.W * k), H = Math.round(p.H * k);
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d');
  x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high'; x.drawImage(src, 0, 0, W, H);
  try { await document.fonts.ready; } catch { /* the fallback faces will do */ }
  drawMarks(x, W, H, { doc: d, rects: p.rects, picW: p.W, picH: p.H, name: S.name, T, lang });
  const type = S.format === 'png' ? 'image/png' : 'image/jpeg', blob = await new Promise(done => cv.toBlob(done, type, S.jpgQ));
  return { blob, name: `${base}.${S.format === 'png' ? 'png' : 'jpg'}` };
}
const outSay = t => { $('outsay').textContent = t; };
function download(blob, name) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 8000); }
async function take(how) {
  if (!S.doc || S.busy) return;
  outSay(T.making);
  try {
    if (how === 'link') { await navigator.clipboard.writeText(`${location.origin}${location.pathname}?${toQuery(S.doc)}`); outSay(T.linkCopied); count('link'); return; }
    if (how === 'copy') {
      const keep = S.format; S.format = 'png'; let f; try { f = await makeFile(); } finally { S.format = keep; }
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': f.blob })]); outSay(T.copied); count('copy'); return;
    }
    const f = await makeFile(), file = new File([f.blob], f.name, { type: f.blob.type });
    if (how === 'share') {
      const text = fill(T.shareText, { what: S.doc.marks.title || T.shareWhat });
      if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], text }); outSay(''); count(`share-${S.format}`); S.took = (S.took || 0) + 1; return; }
      if (navigator.share) { await navigator.share({ text, url: `${location.origin}${location.pathname}?${toQuery(S.doc)}` }); outSay(''); count('share-link'); return; }
    }
    download(f.blob, f.name); outSay(fill(T.saved, { name: f.name })); count(`save-${S.format}`); S.took = (S.took || 0) + 1;
  } catch (e) { outSay(e?.name === 'AbortError' ? '' : String(e?.message || e)); }
}

// ------------------------------------------------------------------------------------------------------ start
function wire() {
  $('mode').onclick = e => { const b = e.target.closest('button'); if (b) setMode(b.dataset.m); };
  $('shape').onclick = e => { const b = e.target.closest('button'); if (b) pickShape(b.dataset.s); };
  $('kind').onclick = e => { const b = e.target.closest('button'); if (b) pickRecipe(b.dataset.r); };
  $('quality').onclick = e => { const b = e.target.closest('button'); if (b) pickQuality(+b.dataset.q); };
  $('kind2').onclick = e => { const b = e.target.closest('button'); if (b) switchRecipe(b.dataset.r, S.quality); };
  $('quality2').onclick = e => { const b = e.target.closest('button'); if (b) switchRecipe(S.doc.recipe in RECIPES ? S.doc.recipe : S.recipe, +b.dataset.q); };
  $('turn').onchange = e => { S.turn = e.target.value; applyTurn(); tell(); };
  $('places').onclick = e => {
    const b = e.target.closest('button'); if (!b) return; const p = PLACES[+b.dataset.p];
    S.shape = p[4]; marks('shape', 's', S.shape); layFrame(); S.turn = p[6] || 'north'; $('turn').value = S.turn;
    showOnMap(p[1], p[2], p[3], S.turn === 'level' ? galacticUp(p[1], p[2]) : 0); pickRecipe(p[5]); S.placeTitle = T[p[0]];
  };
  $('find').onsubmit = e => { e.preventDefault(); $('q').blur(); find($('q').value); };
  $('zin').onclick = () => { S.al?.setFoV(clamp(S.al.getFov()[0] / 1.5, 0.2, 120)); tell(); };
  $('zout').onclick = () => { S.al?.setFoV(clamp(S.al.getFov()[0] * 1.5, 0.2, 120)); tell(); };
  $('get').onclick = () => { retry = getPicture; getPicture().catch(e => { busy(false); note([{ text: String(e.message || e), warn: true }]); }); };
  $('stop').onclick = () => { worker?.postMessage({ t: 'stop' }); };
  $('another').onclick = backToPlace;
  $('neednow').onclick = () => { retry = readNeeded; readNeeded(); };
  $('fullbtn').onclick = () => setFull(!S.full);
  $('tobox').onclick = () => { $('outbox').scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); };
  $('setbtn').onclick = settings;
  $('guidebtn').onclick = () => (guide.on ? guide.stop() : guide.menu());
  for (const id of ['reset', 'reset2']) $(id).onclick = () => switchRecipe(S.doc.recipe in RECIPES ? S.doc.recipe : S.recipe, S.doc.quality);
  $('addband').onclick = () => { const id = 'x' + Date.now().toString(36); S.doc.layers.push({ id, src: { kind: 'band', planes: [35] }, color: [1, 1, 1], gain: 1, on: true, bg: 'level', bgPct: 20, lo: 50, loS: 0, hi: 99.8, hiS: 0, curve: 'asinh', k: 8, smooth: 0 }); S.doc.recipe = 'custom'; S.openLayer = id; changed(true); };
  $('addline').onchange = e => {
    const l = LINES.find(x => x.id === e.target.value); e.target.value = ''; if (!l) return; const id = l.id + Date.now().toString(36);
    S.doc.layers.push({ id, src: lineSrc(l.on, l.off), color: [0.3, 0.8, 1], gain: 1, on: true, bg: 'level', bgPct: 20, lo: 50, loS: 6, hi: 99.8, hiS: 120, curve: 'asinh', k: 8, smooth: 0.6, feature: l.id }); S.doc.recipe = 'custom'; S.openLayer = id; changed(true);
  };
  for (const how of ['share', 'save', 'copy', 'link']) $(how).onclick = () => take(how);
  let rt = 0; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if ($('picker').hidden) layMarks(); else { const f = frameFromMap(); layFrame(); if (f) showOnMap(f.ra, f.dec, f.w); tell(); } }, 150); });
}

const guide = makeGuide({ S, $, T, lang, fill, narrow, frameFromMap: () => frameFromMap(), backToPlace: () => backToPlace(), setMode: m => setMode(m),
  changed: r => changed(r), open: id => { S.openLayer = id; build(); hist(); }, useRecipe: r => { if (S.doc && S.doc.recipe !== r) switchRecipe(r, S.doc.quality || 1); } });
words(); wire(); setFull(false);
for (const b of $('mode').children) b.setAttribute('aria-pressed', b.dataset.m === S.mode);
let start = { ra: 98.0, dec: 4.95, w: 3, rot: 0 };          // the Rosette Nebula: bright, round, and 48 MB to read (Orion is 119)
const asked = fromQuery(location.search);
let last = null; try { last = !asked && sessionStorage.getItem('chrono-studio-last'); } catch { last = null; }
const from = asked || (last ? fromQuery('?' + last) : null);
if (from) {
  const f = from.frame, w = f.w || (f.fov ? clamp(f.fov * 0.5, 1.5, 8) : 4), h = f.h || w;
  start = { ra: f.ra, dec: f.dec, w, rot: f.rot || 0 };
  if (RECIPES[from.recipe]) S.recipe = from.recipe; S.quality = from.quality || 1;
  const a = w / h; S.shape = SHAPES.reduce((best, s) => (Math.abs(Math.log(s[1] / a)) < Math.abs(Math.log(best[1] / a)) ? s : best))[0];
  if (Math.abs((f.rot || 0) - galacticUp(f.ra, f.dec)) < 0.6 && Math.abs(f.rot || 0) > 0.6) S.turn = 'level';
  if (asked && asked.frame.w && (asked.rest || q0.get('r'))) S.fromLink = asked;
}
marks('shape', 's', S.shape); $('turn').value = S.turn; pickRecipe(S.recipe); pickQuality(S.quality);
initMap(start).then(() => { if (q0.has('guide')) guide.start(q0.get('guide') || 'apod'); else if (!S.fromLink) guide.offer(); }).catch(() => { $('findmsg').textContent = T.failed; });
if (new URLSearchParams(location.search).has('debug')) window.__studio = { S, ask, frameFromMap, showOnMap, render, getPicture, take, makeFile, guide, SET };
