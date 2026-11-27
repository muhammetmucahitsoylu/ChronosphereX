// The picture studio's page (studio.html): choose a frame on the map, read its wavelengths from NASA's archive,
// adjust the picture, take it away. The arithmetic runs in a worker (worker.js); this file is the screen.
import A from 'https://cdn.jsdelivr.net/npm/aladin-lite@3.8.2/dist/aladin.js';
import { STR, LANGS } from './words.js';
import { makeFrame, galacticUp, NATIVE, WAVES, BLANK, planeNear } from './geom.js';
import { cost, SOURCES } from './cube.js';
import { RECIPES, LINES, lineSrc, around, ownRecipe, OWN_MAX, OWN_START } from './recipes.js';
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
const KINDS = ['gas', 'stars', 'dust', 'own'];          // the last one is Pro's: wavelengths of one's own choosing
const SHAPES = [['1:1', 1], ['4:5', 4 / 5], ['3:4', 3 / 4], ['9:16', 9 / 16], ['3:2', 3 / 2], ['16:9', 16 / 9]];
// places whose pictures were looked at before they were listed (spike/studio/batch.mjs): [key, ra, dec, width in degrees, shape, recipe, turn]
const PLACES = [['p_orion', 83.9, -4.2, 4.5, '3:4', 'gas'], ['p_carina', 161.0, -59.7, 4, '1:1', 'gas'], ['p_cygnus', 308.0, 41.5, 6, '3:2', 'gas'], ['p_rosette', 98.0, 4.95, 3, '1:1', 'gas'],
  ['p_rho', 246.7, -23.6, 4, '1:1', 'gas'], ['p_tarantula', 84.7, -69.1, 2.2, '1:1', 'gas'], ['p_m17', 275.2, -16.2, 3, '1:1', 'gas'], ['p_gc', 266.894, -29.196, 4.5, '3:2', 'dust', 'level'], ['p_m31', 10.68, 41.27, 4, '3:2', 'stars']];
const MAPS = [['spherex', 'mapSpherex', 'https://irsa.ipac.caltech.edu/data/hips/SPHEREx/spherex_allsky_cube'], ['wise', 'mapWise', 'https://irsa.ipac.caltech.edu/data/hips/CDS/AllWISE/RGB-W4-W2-W1'], ['dss', 'mapDss', 'https://irsa.ipac.caltech.edu/data/hips/CDS/DSS2/color'], ['2mass', 'map2mass', 'https://irsa.ipac.caltech.edu/data/hips/CDS/2MASS/Color']];
const SET = Prefs.load(phone), MIN_W = 300, maxPx = () => SET.maxMP * 1e6;
const S = {
  mode: 'basic', shape: '1:1', ratio: 1, turn: 'north', recipe: 'gas', quality: 1, al: null,
  own: [...OWN_START],          // Pro's fourth kind of picture: the wavelengths chosen by hand (plane numbers)
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
  for (const [id, key] of [['ttl', 'title'], ['placetitle', 'placeTitle'], ['placehelp', 'placeHelp'], ['h_places', 'places'], ['h_shape', 'shape'], ['l_turn', 'turnLabel'], ['l_map', 'map'], ['h_kind', 'kind'], ['h_kind2', 'kind'], ['h_proframe', 'proFrame'], ['l_ra', 'l_ra'], ['l_dec', 'l_dec'], ['l_w', 'l_w'], ['l_h', 'l_h'], ['l_pa', 'l_pa'], ['prohint', 'proHint'], ['qall', 'qAll'], ['mapnote', 'mapNote'],
    ['h_quality', 'quality'], ['get', 'get'], ['go', 'go'], ['stop', 'stop'], ['another', 'another'], ['openmap', 'openMap'], ['h_edit', 'edit'], ['reset', 'reset'], ['reset2', 'reset'], ['h_layers', 'layers'], ['addband', 'addBand'],
    ['h_combine', 'combine'], ['h_whole', 'whole'], ['h_out', 'out'], ['tobox', 'out'], ['share', 'share'], ['save', 'save'], ['copy', 'copy'], ['link', 'link'], ['neednow', 'readNow'], ['rawnote', 'rawNote']]) set(id, key);
  set('q', 'search', 'placeholder'); set('q', 'search', 'aria-label'); set('zin', 'zoomIn', 'aria-label'); set('zout', 'zoomOut', 'aria-label'); set('mode', 'modeLabel', 'aria-label');
  $('mode').querySelector('[data-m=basic]').textContent = T.basic; $('mode').querySelector('[data-m=pro]').textContent = T.pro;
  $('guideword').textContent = T.guide; $('guidebtn').setAttribute('aria-label', T.guide); $('guidebtn').title = T.guide; $('setbtn').setAttribute('aria-label', T.settings); $('setbtn').title = T.settings;
  $('logo').href = `./?lang=${lang}`;
  $('turn').innerHTML = `<option value="north">${T.north}</option><option value="level">${T.level}</option><option value="free" hidden>${T.free}</option>`;
  $('maplayer').innerHTML = MAPS.map(m => `<option value="${m[0]}">${T[m[1]]}</option>`).join('');
  $('shape').innerHTML = SHAPES.map(s => `<button type="button" data-s="${s[0]}">${s[0]}</button>`).join('') + `<button type="button" class="proonly" data-s="free">${T.free}</button>`;
  $('places').innerHTML = PLACES.map((p, i) => `<button type="button" class="chip" data-p="${i}">${T[p[0]]}</button>`).join('');
  $('kind').innerHTML = KINDS.map(r => `<button type="button" role="radio" data-r="${r}"${r === 'own' ? ' class="proonly"' : ''}><i class="sw ${r}"></i><b>${T['r_' + r]}</b><span>${T['r_' + r + '_d']}</span></button>`).join('');
  $('kind2').innerHTML = KINDS.map(r => `<button type="button" data-r="${r}"${r === 'own' ? ' class="proonly"' : ''}>${T['r_' + r]}</button>`).join('');
  for (const id of ['quality', 'quality2']) $(id).innerHTML = [1, 2, 3].map(n => `<button type="button" data-q="${n}">${T['q' + n]}</button>`).join('');
  $('addline').innerHTML = `<option value="">${T.addLine}</option>` + LINES.map(l => `<option value="${l.id}">${T['f_' + l.id]}</option>`).join('');
}

// ------------------------------------------------------------------------------------------------------ step one: the map
const shapeOf = () => (S.shape === 'free' ? S.ratio : SHAPES.find(s => s[0] === S.shape)?.[1]) || 1;
/** A kind of picture as layers: one of the ready ones, or (Pro) the wavelengths chosen by hand. */
const known = r => r === 'own' || r in RECIPES, recipeOf = (r, q) => (r === 'own' ? ownRecipe(S.own) : RECIPES[r](q));
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
  if (!S.al || S.turn === 'free') return; const [ra, dec] = S.al.getRaDec();          // 'free': an angle typed in Pro, or a twist of two fingers: left as it is
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
  const c = cost(f), n = uniquePlanes(S.fromLink?.rest ? { layers: S.fromLink.rest.layers } : recipeOf(S.recipe, S.quality)).length, mb = Math.max(1, Math.round(c.bytesPerPlane * n / 1e6));
  const cell = navigator.connection && (navigator.connection.type === 'cellular' || navigator.connection.saveData);
  $('cost').textContent = big ? '' : fill(T.cost, { mb, n }) + (cell ? ' ' + T.mobile : '');
  $('get').disabled = big || S.busy;
  if (S.fromLink) { $('linkopens').hidden = false; $('linkopens').textContent = fill(T.linkOpens, { W: f.W, H: f.H, mb }); }
  // a twist with two fingers (or a link's own angle) is neither of the two ready turns: the chooser says so
  if (S.turn === 'north' && Math.abs(f.rot || 0) > 0.6) { S.turn = 'free'; $('turn').value = 'free'; }
  tellPro(f, c);
}
/** Pro: the frame as numbers. A field that is being typed in is left alone. */
function sexa(ra, dec) {
  const p = v => String(v).padStart(2, '0'), t = Math.round(ra / 15 * 36000) % 864000, a = Math.round(Math.abs(dec) * 3600);
  return `${p(Math.floor(t / 36000))}h ${p(Math.floor(t % 36000 / 600))}m ${num(t % 600 / 10, 1).padStart(4, '0')}s · ${dec < 0 ? '−' : '+'}${p(Math.floor(a / 3600))}° ${p(Math.floor(a % 3600 / 60))}′ ${p(a % 60)}″`;
}
function tellPro(f, c) {
  if (S.mode !== 'pro') return;
  const put = (id, text) => { const e = $(id); if (document.activeElement !== e) e.value = text; }, rot = Math.abs(f.rot || 0) < 0.05 ? 0 : f.rot;
  put('n_ra', num(f.ra, 4)); put('n_dec', num(f.dec, 4)); put('n_w', num(f.w, 2)); put('n_h', num(f.h, 2)); put('n_pa', num(rot, 1));
  $('prohms').textContent = sexa(f.ra, f.dec);
  $('prosays').textContent = fill(T.proSays, { s: num(f.scale, 1), W: f.W, H: f.H, mb: num(c.bytesPerPlane / 1e6, 1) });
}
/** Pro: a number typed into one of the frame's fields moves the map. */
function typed(which) {
  const f = frameFromMap(), v = parseFloat($('n_' + which).value.trim().replace(',', '.').replace('−', '-'));
  if (!f || !isFinite(v)) { tellNow(); return; }          // not a number: the field shows the map's value again
  let { ra, dec, w, h } = f;
  S.typedN = (S.typedN || 0) + 1; if (S.typedN === 1) count('pro-frame', 'Pro: the frame typed in numbers');          // the guide waits for a typed number
  if (which === 'pa') { S.turn = 'free'; $('turn').value = 'free'; turnMap(((v + 180) % 360 + 360) % 360 - 180); tellNow(); return; }
  if (which === 'ra') ra = ((v % 360) + 360) % 360;
  if (which === 'dec') dec = clamp(v, -90, 90);
  if (which === 'w' || which === 'h') {
    if (which === 'w') w = clamp(v, 0.2, 60); else h = clamp(v, 0.2, 60);
    S.ratio = clamp(w / h, 0.2, 5); S.shape = 'free'; marks('shape', 's', 'free'); layFrame();
    if (which === 'h') w = h * S.ratio;
  }
  showOnMap(ra, dec, w); if (S.turn === 'level') applyTurn(); tellNow();
}
/** Pro's fourth kind: the strip of SPHEREx's wavelengths to press, and what is chosen. Quality (how many neighbouring
 *  wavelengths are averaged) has no say there: exactly the chosen ones are read. */
function buildOwn() {
  const box = $('ownbox'), on = S.recipe === 'own';
  box.hidden = !on; for (const id of ['h_quality', 'quality', 'qsay', 'qall']) $(id).hidden = on;
  if (!on) return;
  box.innerHTML = ''; const L = { src: { kind: 'band', planes: S.own } };
  strip(box, L, { done: () => { S.own = L.src.planes; buildOwn(); tell(); }, max: OWN_MAX, plain: true, key: 'own' });
  const say = document.createElement('p'); say.className = 'fine'; say.id = 'ownsays';
  say.textContent = fill(T.ownSays, { n: S.own.length, max: OWN_MAX, list: S.own.map(z => num(WAVES[z], 2)).join(' · ') }); box.append(say);
}
function marks(group, attr, value) { for (const b of $(group).children) { const on = b.dataset[attr] === String(value); b.setAttribute(group === 'kind' ? 'aria-checked' : 'aria-pressed', on); } }
function pickRecipe(r) { S.recipe = r; marks('kind', 'r', r); marks('kind2', 'r', r); buildOwn(); tell(); }
function pickQuality(n) { S.quality = n; marks('quality', 'q', n); marks('quality2', 'q', n); $('qsay').textContent = T[`q${n}d`]; tell(); }
function pickShape(s) { if (s === 'free') S.ratio = boxH ? boxW / boxH : 1; S.shape = s; marks('shape', 's', s); const f = frameFromMap(); layFrame(); if (f) showOnMap(f.ra, f.dec, Math.max(f.w, f.h) * Math.min(1, shapeOf())); tell(); }

const MAP_Z = 62;          // the map's frame of the SPHEREx cube: 3.29 µm
/** Tell the map library to show frame MAP_Z of the SPHEREx cube (the main map's own rule, sky.js). */
function mapSlice(h) {
  if (!h?.cubeDepth) return false; if (h.chronoZ === MAP_Z) return true;
  const c = 299792458, fMin = c / h.emMax, fMax = c / h.emMin, f = fMin + (MAP_Z + 0.5) * (fMax - fMin) / h.cubeDepth;
  h.setSliceNumber((c / f - h.emMin) / (h.emMax - h.emMin) * h.cubeDepth); h.chronoZ = MAP_Z; return true;
}
function mapSliceSoon() { const t0 = Date.now(), kick = () => { const h = S.al?.getBaseImageLayer?.(); if (!(h && mapSlice(h)) && Date.now() - t0 < 15000) requestAnimationFrame(kick); }; kick(); }
async function initMap(start) {
  await A.init;
  // SPHEREx's own sky is the first map, its cube shown at 3.3 µm where the clouds that make good pictures glow (the
  // library opens a cube on its middle frame, which is blank in this one: it is sent to that frame at once)
  const layer = id => { const m = MAPS.find(x => x[0] === id) || MAPS[0]; return A.HiPS(m[2], { name: m[0], successCallback: h => { if (m[0] === 'spherex') mapSlice(h); } }); };
  S.al = A.aladin('#map', {
    survey: layer('spherex'), target: `${start.ra} ${start.dec}`, fov: 12, projection: 'TAN', cooFrame: 'ICRS',
    showReticle: false, showLayersControl: false, showProjectionControl: false, showFullscreenControl: false, showFrame: false, showCooGridControl: false,
    showSettingsControl: false, showShareControl: false, showZoomControl: false, showCooLocation: false, showFov: false, showStatusBar: false, showContextMenu: false,
    backgroundColor: 'rgb(5, 7, 12)', log: false,
  });
  try { S.al.contextMenu = null; S.al.on('rightClickMove', () => {}); } catch { /* cosmetic */ }
  layFrame(); showOnMap(start.ra, start.dec, start.w, start.rot ?? 0);
  for (const ev of ['positionChanged', 'zoomChanged']) { try { S.al.on(ev, () => { if (S.turn === 'level' && ev === 'positionChanged') applyTurn(); tell(); }); } catch { /* older builds */ } }
  $('maplayer').onchange = e => { try { S.al.setBaseImageLayer(layer(e.target.value)); } catch { /* the map keeps what it shows */ } if (e.target.value === 'spherex') mapSliceSoon(); $('mapnote').hidden = e.target.value === 'spherex'; };
  mapSliceSoon();
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
  const r = recipeOf(recipe, quality);
  return { v: 1, recipe, quality, frame, ...r, look: { ...r.look }, marks: { title: '', key: false, scale: false, compass: false, ...(keep.marks || {}) } };
}
const baseOf = doc => (known(doc.recipe) ? recipeOf(doc.recipe, doc.quality) : null);

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
  const want = S.fromLink?.rest ? { layers: S.fromLink.rest.layers } : recipeOf(S.recipe, S.quality), bytes = cost(f).bytesPerPlane * uniquePlanes(want).length;
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
/** A slider: its name; its value, which can also be typed in; ↺, which brings it back to where the picture started;
 *  and the bar, coloured from that starting point (a small mark) to the value, so that what was changed, and which way,
 *  shows at a glance. A double click on the bar or on the name also brings it back. def: the starting point (none: the
 *  bar is coloured from its left end and there is nothing to go back to); parse: a number typed in the units the value
 *  is shown in, as the bar's own value (for bars that are not linear, or shown as a percentage). */
function slider(host, label, min, max, step, get, set, fmt = v => num(v, 2), live = true, key = '', def = null, parse = null) {
  const d = document.createElement('div'); d.className = 'ctl sl'; if (key) d.dataset.k = key;
  const id = `c${Math.random().toString(36).slice(2, 9)}`;
  d.innerHTML = `<label for="${id}"></label><input id="${id}" type="range" min="${min}" max="${max}" step="${step}"><input class="val" type="text" inputmode="decimal" autocomplete="off" spellcheck="false"><button type="button" class="reset">↺</button>`;
  const [lb, inp, val, rs] = d.children, frac = v => (clamp(v, min, max) - min) / (max - min || 1);
  lb.textContent = label; val.setAttribute('aria-label', label); rs.title = T.reset; rs.setAttribute('aria-label', `${T.reset}: ${label}`);
  inp.style.setProperty('--d', def == null ? 0 : frac(def));
  const show = () => {
    const v = +inp.value; inp.style.setProperty('--v', frac(v));
    if (document.activeElement !== val) val.value = fmt(v);
    d.classList.toggle('moved', def != null && Math.abs(v - def) > step / 2);
  };
  const put = v => { inp.value = clamp(v, min, max); set(+inp.value); show(); changed(); };
  inp.value = get(); show();
  inp.addEventListener(live ? 'input' : 'change', () => { set(+inp.value); show(); changed(); });
  if (!live) inp.addEventListener('input', show);
  val.onfocus = () => val.select();
  val.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); val.blur(); } else if (e.key === 'Escape') { val.value = fmt(+inp.value); val.blur(); } };
  val.onchange = () => {
    const x = parseFloat(val.value.replace(/\s/g, '').replace(',', '.').replace(/[−–]/g, '-').replace(/[^0-9.eE+-]/g, ''));
    const v = isFinite(x) ? (parse ? parse(x) : x) : NaN;
    if (isFinite(v)) put(v); else show();
  };
  val.onblur = show;
  const back = () => { if (def != null) put(def); };
  rs.onclick = back; inp.ondblclick = back; lb.ondblclick = back;
  if (def == null) rs.hidden = true;
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
  const host = $('basic'), d = S.doc, base = baseOf(d), lk = { ...DEFAULT_LOOK, ...(base?.look || {}) }; host.innerHTML = '';
  slider(host, T.bright, -2, 2, 0.02, () => d.look.bright ?? 0, v => { d.look.bright = v; }, v => (v > 0 ? '+' : '') + num(v, 1), true, '', lk.bright);
  slider(host, T.contrast, -0.6, 0.9, 0.02, () => d.look.contrast ?? 0, v => { d.look.contrast = v; }, v => (v > 0 ? '+' : '') + num(v, 1), true, '', lk.contrast);
  slider(host, T.colour, 0, 2.4, 0.02, () => d.look.sat ?? 1, v => { d.look.sat = v; }, v => num(v, 1), true, '', lk.sat);
  // faint detail: the strength of every layer's curve, as a multiple of the recipe's own
  const k0 = L => base?.layers.find(x => x.id === L.id)?.k ?? 8, s0 = base?.stretch?.k ?? 10;
  const now = () => (d.blend === 'ratio' ? Math.log2((d.stretch?.k ?? s0) / s0) / 2 : (d.layers[0] ? Math.log2(d.layers[0].k / k0(d.layers[0])) / 2 : 0));
  slider(host, T.faint, -1.5, 1.5, 0.02, now, v => { const m = Math.pow(4, v); for (const L of d.layers) L.k = clamp(k0(L) * m, 0.3, 400); if (d.stretch) d.stretch.k = clamp(s0 * m, 0.3, 400); }, v => (v > 0 ? '+' : '') + num(v, 1), true, 'faint', 0);
  slider(host, T.sharp, 0, 1.6, 0.02, () => d.look.sharpen ?? 0, v => { d.look.sharpen = v; }, v => num(v, 1), true, '', lk.sharpen);
  slider(host, T.speckle, 0, 6, 0.1, () => d.look.chroma ?? 0, v => { d.look.chroma = v; }, v => num(v, 1), true, '', lk.chroma);
}

const rgbHex = c => '#' + c.map(v => Math.round(clamp(v, 0, 1) * 255).toString(16).padStart(2, '0')).join('');
const hexRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
const STOPS = [[0.75, [120, 170, 255]], [1.2, [110, 225, 255]], [1.7, [130, 255, 190]], [2.2, [240, 245, 140]], [2.9, [255, 190, 90]], [3.4, [255, 140, 60]], [4.1, [255, 85, 55]], [5.0, [225, 45, 85]]];
const tintOf = um => { let i = 0; while (i < STOPS.length - 2 && um > STOPS[i + 1][0]) i++; const [a, ca] = STOPS[i], [b, cb] = STOPS[i + 1], t = clamp((um - a) / (b - a), 0, 1); return `rgb(${ca.map((v, k) => Math.round(v + (cb[k] - v) * t)).join(',')})`; };

/** The 102 wavelengths as one bar the width of the panel (until 27 Nov 2026 a strip 1,600 px long that scrolled
 *  sideways). Pressing or dragging along it shows the wavelength under the pointer; letting go chooses it, or lets it
 *  go. A line layer: once for the line, again for its continuum, again to let it go. The chosen ones are listed under
 *  the bar, each with × to take it away. Keys: ← → move, Enter or Space choose, Home and End.
 *  o: { done (instead of redrawing the panel), max (how many may be chosen), plain (no marks of what is downloaded), key } */
function strip(host, L, o = {}) {
  const isLine = L.src.kind === 'line', onSet = new Set(isLine ? L.src.on : L.src.planes), offSet = new Set(isLine ? L.src.off.map(x => x[0]) : []);
  const N = WAVES.length, uid = `s${Math.random().toString(36).slice(2, 8)}`, fkey = o.key || L.id || 'layer', sorted = s => [...s].sort((a, b) => a - b);
  const wrap = document.createElement('div'); wrap.className = 'strip spec';
  const marks = document.createElement('div'); marks.className = 'specmarks';
  const bar = document.createElement('div'); bar.className = 'specbar'; bar.tabIndex = 0;
  bar.setAttribute('role', 'listbox'); bar.setAttribute('aria-multiselectable', 'true'); bar.setAttribute('aria-label', isLine ? T.pickLine : T.pick);
  const have = document.createElement('div'); have.className = 'spechave';
  const ticks = document.createElement('div'); ticks.className = 'specticks';
  const lens = document.createElement('div'); lens.className = 'speclens'; lens.hidden = true;
  const cells = WAVES.map((um, z) => {
    const c = document.createElement('span'), blank = BLANK.has(z), on = onSet.has(z), off = offSet.has(z);
    c.id = `${uid}-${z}`; c.setAttribute('role', 'option'); c.setAttribute('aria-label', `${num(um, 3)} µm`); c.setAttribute('aria-selected', String(on || off));
    if (blank) { c.className = 'blank'; c.setAttribute('aria-disabled', 'true'); } else { c.style.background = tintOf(um); c.className = on ? 'on' : off ? 'off' : ''; }
    bar.append(c);
    if (on || off) { const m = document.createElement('i'); if (off) m.className = 'off'; m.style.left = `${z / N * 100}%`; marks.append(m); }
    if (!o.plain && S.have?.has(z)) { const h = document.createElement('i'); h.style.left = `${z / N * 100}%`; have.append(h); }
    return c;
  });
  const marksAt = [0.75, 1, 1.5, 2, 3, 4, 5];
  marksAt.forEach((um, i) => {
    const t = document.createElement('span'), z = planeNear(um);
    t.style.left = i === 0 ? '0%' : i === marksAt.length - 1 ? '100%' : `${(z + 0.5) / N * 100}%`;
    t.textContent = i === marksAt.length - 1 ? `${num(um, 0)} µm` : num(um, um % 1 ? (um * 10 % 1 ? 2 : 1) : 0); ticks.append(t);
  });
  wrap.append(marks, bar, have, ticks, lens); host.append(wrap);
  // what is under the pointer, the finger or the keys
  let cur = -1;
  const point = (z, label = true) => {
    if (cur >= 0) cells[cur].classList.remove('cur');
    cur = z;
    if (z < 0) { lens.hidden = true; bar.removeAttribute('aria-activedescendant'); return; }
    cells[z].classList.add('cur'); bar.setAttribute('aria-activedescendant', cells[z].id);
    if (!label) return;
    lens.hidden = false; lens.textContent = `${num(WAVES[z], 2)} µm${BLANK.has(z) ? ' —' : onSet.has(z) ? ' ✓' : offSet.has(z) ? ' ○' : ''}`;
    const w = wrap.clientWidth || 1, half = (lens.offsetWidth || 60) / 2;
    lens.style.left = `${clamp((z + 0.5) / N * w, half, w - half)}px`;
  };
  const apply = () => {
    L.src = isLine ? (offSet.size ? lineSrc(sorted(onSet), sorted(offSet)) : { kind: 'line', on: sorted(onSet), off: [] }) : { kind: 'band', planes: sorted(onSet) };
    if (o.done) o.done(); else changed(true);
  };
  const toggle = (z, byKey = false) => {
    if (z < 0 || BLANK.has(z)) return;
    if (isLine) {
      if (onSet.has(z)) { if (onSet.size < 2) return; onSet.delete(z); offSet.add(z); }          // a line keeps at least one wavelength of its own
      else if (offSet.has(z)) offSet.delete(z); else onSet.add(z);
    } else if (onSet.has(z)) { if (onSet.size < 2) return; onSet.delete(z); }
    else if (!o.max || onSet.size < o.max) onSet.add(z); else return;
    if (byKey) S.focusStrip = { key: fkey, z };          // the panel is drawn again: the keys stay on this bar
    apply();
  };
  const zAt = x => { const r = bar.getBoundingClientRect(); return clamp(Math.floor((x - r.left) / (r.width || 1) * N), 0, N - 1); };
  let drag = null;
  bar.addEventListener('pointerdown', e => { if (e.button > 0) return; drag = { id: e.pointerId, z: zAt(e.clientX) }; try { bar.setPointerCapture(e.pointerId); } catch { /* an old engine */ } point(drag.z); });
  bar.addEventListener('pointermove', e => { if (drag && e.pointerId === drag.id) { drag.z = zAt(e.clientX); point(drag.z); } else if (!drag && e.pointerType === 'mouse') point(zAt(e.clientX)); });
  bar.addEventListener('pointerup', e => { if (!drag || e.pointerId !== drag.id) return; const z = drag.z; drag = null; point(-1); toggle(z); });
  bar.addEventListener('pointercancel', () => { drag = null; point(-1); });          // the browser took the finger for scrolling the page
  bar.addEventListener('pointerleave', e => { if (!drag && e.pointerType === 'mouse') point(-1); });
  bar.addEventListener('keydown', e => {
    let z = cur < 0 ? (sorted(onSet)[0] ?? 0) : cur;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') z = Math.min(N - 1, z + 1);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') z = Math.max(0, z - 1);
    else if (e.key === 'PageUp') z = Math.min(N - 1, z + 10);
    else if (e.key === 'PageDown') z = Math.max(0, z - 10);
    else if (e.key === 'Home') z = 0;
    else if (e.key === 'End') z = N - 1;
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (cur >= 0) toggle(cur, true); return; }
    else return;
    e.preventDefault(); point(z);
  });
  bar.addEventListener('focus', () => { if (cur < 0 && !drag) point(sorted(onSet)[0] ?? 0); });
  bar.addEventListener('blur', () => { if (!drag) point(-1); });
  // the chosen ones, each with × to take it away (not the last one: a layer needs a wavelength)
  const chips = document.createElement('div'); chips.className = 'specchips';
  const chip = (z, off) => {
    const b = document.createElement('button'), dot = document.createElement('i'); b.type = 'button'; if (off) b.className = 'off';
    dot.style.background = tintOf(WAVES[z]); b.append(dot, `${num(WAVES[z], 2)} µm`);
    b.disabled = !off && onSet.size < 2; b.setAttribute('aria-label', `${T.remove}: ${num(WAVES[z], 2)} µm`);
    b.onclick = () => { if (off) offSet.delete(z); else if (onSet.size > 1) onSet.delete(z); else return; apply(); };
    chips.append(b);
  };
  for (const z of sorted(onSet)) chip(z, false);
  for (const z of sorted(offSet)) chip(z, true);
  host.append(chips);
  const hint = document.createElement('p'); hint.className = 'pickhint'; hint.textContent = isLine ? T.pickLine : T.pick; host.append(hint);
  if (S.focusStrip?.key === fkey) { const z = S.focusStrip.z; S.focusStrip = null; requestAnimationFrame(() => { try { bar.focus({ preventScroll: true }); } catch { bar.focus(); } point(z); }); }
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
      // where each slider starts: the recipe's own layer, or what a layer added by hand starts with
      const b0 = baseOf(d)?.layers.find(x => x.id === L.id) || (L.src.kind === 'line' ? { lo: 50, loS: 6, hi: 99.8, k: 8, smooth: 0.6, gain: 1 } : { lo: 50, loS: 0, hi: 99.8, k: 8, smooth: 0, gain: 1 });
      const cv = document.createElement('canvas'); cv.className = 'hist'; cv.id = 'hist'; cv.width = 360; cv.height = 56; body.append(cv);
      chooser(body, T.from, [['band', T.band], ['line', T.line]], () => L.src.kind, v => {
        if (v === L.src.kind) return;
        if (v === 'line') { const z = L.src.planes[Math.floor(L.src.planes.length / 2)]; L.src = lineSrc([z], [Math.max(0, z - 2), Math.min(WAVES.length - 1, z + 2)].filter(k => !BLANK.has(k) && k !== z)); Object.assign(L, { lo: 50, loS: 6, hi: 99.8, hiS: 120, smooth: 0.6 }); }
        else { L.src = { kind: 'band', planes: [...L.src.on] }; Object.assign(L, { loS: 0, hiS: 0, smooth: 0 }); delete L.clean; }
      });
      strip(body, L);
      chooser(body, T.bg, [['level', T.bgLevel], ['slope', T.bgSlope], ['none', T.bgNone]], () => L.bg, v => { L.bg = v; });
      slider(body, T.black, 0, 99.9, 0.1, () => L.lo, v => { L.lo = v; }, v => fill(T.pct, { n: num(v, 1) }), true, 'black', b0.lo);
      slider(body, T.blackS, 0, 12, 0.1, () => L.loS || 0, v => { L.loS = v; }, v => num(v, 1) + ' σ', true, '', b0.loS ?? 0);
      slider(body, T.white, 90, 100, 0.01, () => L.hi, v => { L.hi = v; }, v => fill(T.pct, { n: num(v, 2) }), true, '', b0.hi);
      if (d.blend !== 'ratio' || d.layout === 'panels') {
        chooser(body, T.curve, ['asinh', 'log', 'sqrt', 'linear', 'gamma'].map(c => [c, T['c_' + c]]), () => L.curve, v => { L.curve = v; if (v === 'gamma' && L.k > 5) L.k = 2.2; }, 'curve');
        const sc = log(0.3, 400); slider(body, T.strength, 0, 1, 0.005, () => sc.to(clamp(L.k, 0.3, 400)), v => { L.k = sc.from(v); }, v => num(sc.from(v), sc.from(v) < 10 ? 1 : 0), true, '', sc.to(clamp(b0.k ?? 8, 0.3, 400)), x => sc.to(clamp(x, 0.3, 400)));
      }
      slider(body, T.smooth, 0, 5, 0.1, () => L.smooth || 0, v => { L.smooth = v; }, v => num(v, 1) + ' px', true, '', b0.smooth ?? 0);
      if (L.src.kind === 'line') slider(body, T.clean, 0, 3, 1, () => L.clean ?? 1, v => { L.clean = v; }, v => `${v} px`, false, 'clean', b0.clean ?? 1);
      slider(body, T.weight, 0, 2, 0.01, () => L.gain ?? 1, v => { L.gain = v; }, v => fill(T.pct, { n: Math.round(v * 100) }), true, '', b0.gain ?? 1, x => x / 100);
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
    const sc = log(0.3, 400); slider(c, T.strength, 0, 1, 0.005, () => sc.to(clamp(d.stretch.k, 0.3, 400)), v => { d.stretch.k = sc.from(v); }, v => num(sc.from(v), sc.from(v) < 10 ? 1 : 0), true, '', sc.to(clamp(baseOf(d)?.stretch?.k ?? 10, 0.3, 400)), x => sc.to(clamp(x, 0.3, 400)));
    slider(c, T.depth, 0, 1.5, 0.01, () => d.stretch.depth ?? 0.7, v => { d.stretch.depth = v; }, v => num(v, 2), true, '', baseOf(d)?.stretch?.depth ?? 0.7);
    slider(c, T.speckle, 0, 8, 0.1, () => d.stretch.blur ?? 2.5, v => { d.stretch.blur = v; }, v => num(v, 1) + ' px', true, '', baseOf(d)?.stretch?.blur ?? 2.5);
  } else if (d.layout !== 'panels') chooser(c, T.balance, [['own', T.bal_own], ['stars', T.bal_stars], ['linked', T.bal_linked]], () => d.balance, v => { d.balance = v; });
  // the whole picture's sliders, in three groups split by a thin line: light, colour, detail
  const w = $('whole'), k = d.look, lk = { ...DEFAULT_LOOK, ...(baseOf(d)?.look || {}) }, sep = () => { const hr = document.createElement('hr'); hr.className = 'sep'; w.append(hr); }; w.innerHTML = '';
  const sg = v => (v > 0 ? '+' : '') + num(v, 2);
  slider(w, T.bright, -2, 2, 0.01, () => k.bright ?? 0, v => { k.bright = v; }, sg, true, '', lk.bright);
  slider(w, T.contrast, -0.6, 0.9, 0.01, () => k.contrast ?? 0, v => { k.contrast = v; }, sg, true, '', lk.contrast);
  slider(w, T.blackLevel, -0.1, 0.4, 0.002, () => k.black ?? 0, v => { k.black = v; }, v => num(v, 3), true, '', lk.black);
  slider(w, T.mid, 0.4, 2.5, 0.01, () => k.gamma ?? 1, v => { k.gamma = v; }, undefined, true, '', lk.gamma); sep();
  slider(w, T.colour, 0, 2.4, 0.01, () => k.sat ?? 1, v => { k.sat = v; }, undefined, true, '', lk.sat);
  slider(w, T.scnr, 0, 1, 0.01, () => k.scnr ?? 0, v => { k.scnr = v; }, undefined, true, '', lk.scnr);
  slider(w, T.speckle, 0, 8, 0.1, () => k.chroma ?? 0, v => { k.chroma = v; }, v => num(v, 1) + ' px', true, '', lk.chroma); sep();
  slider(w, T.soften, 0, 4, 0.05, () => k.soften ?? 0, v => { k.soften = v; }, v => num(v, 2) + ' px', true, '', lk.soften);
  slider(w, T.sharp, 0, 2, 0.01, () => k.sharpen ?? 0, v => { k.sharpen = v; }, undefined, true, '', lk.sharpen);
  slider(w, T.sharpR, 0.5, 6, 0.1, () => k.sharpenR ?? 1.5, v => { k.sharpenR = v; }, v => num(v, 1) + ' px', true, '', lk.sharpenR);
  slider(w, T.local, 0, 1.5, 0.01, () => k.local ?? 0, v => { k.local = v; }, undefined, true, '', lk.local);
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

/** The picture's own size at the data's full resolution, as the worker lays it out (panels one beside or under the other). */
function fullSize() {
  const f = S.opened?.frame, d = S.doc; if (!f || !d) return [0, 0];
  const n = d.layers.filter(l => l.on).length;
  if (d.layout !== 'panels' || n < 2) return [f.W, f.H];
  const gap = Math.max(2, Math.round(Math.max(f.W, f.H) / 300)), down = f.W >= f.H;
  return down ? [f.W, f.H * n + gap * (n - 1)] : [f.W * n + gap * (n - 1), f.H];
}
/** The largest picture this device can draw and save: phones and Safari draw at most 16.7 million pixels. */
const outCap = () => { const ua = navigator.userAgent, apple = /AppleWebKit/.test(ua) && !/Chrome|Chromium|Edg|Firefox|Android/.test(ua); return phone || apple || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ? 16e6 : 60e6; };
/** W x H fitted inside a box of a by b, the box turned the way the picture is. */
const fitIn = (W, H, a, b) => { const [bw, bh] = W >= H ? [Math.max(a, b), Math.min(a, b)] : [Math.min(a, b), Math.max(a, b)], k = Math.min(bw / W, bh / H); return [Math.round(W * k), Math.round(H * k)]; };
/** The size of a saved picture: 'native' (each pixel one pixel of the data), a percentage, a use, or a width of one's own. */
function sizeOf(key, W, H) {
  if (!W || !H || key === 'native') return [W, H];
  const p = /^p(\d+)$/.exec(key); if (p) return [Math.round(W * p[1] / 100), Math.round(H * p[1] / 100)];
  if (key === 'ig') return [1080, Math.round(1080 * H / W)];
  if (key === 'hd') return fitIn(W, H, 1920, 1080);
  if (key === '4k') return fitIn(W, H, 3840, 2160);
  if (key === 'a4') return fitIn(W, H, 3508, 2480);
  if (key === 'a3') return fitIn(W, H, 4961, 3508);
  if (key === 'custom') { const w = clamp(Math.round(S.customW || W), 16, 20000); return [w, Math.round(w * H / W)]; }
  if (/^\d+$/.test(key)) return [+key, Math.round(+key * H / W)];          // an older choice: a width
  return [W, H];
}
const mbOf = bytes => `${num(bytes / 1e6, bytes < 1e7 ? 1 : 0)} ${lang === 'fr' ? 'Mo' : 'MB'}`;
/** Where the picture's data come from, said under the panel: the cube, its makers, when it was observed, the
 *  wavelengths read for this picture and the very files (27 Nov 2026: "are you sure these are SPHEREx pictures?"). */
function tellSource() {
  if (!S.doc) return;
  const zs = uniquePlanes(S.doc), tiles = S.opened?.tileIds || [];
  $('srcline').textContent = fill(T.srcLine, { list: zs.map(z => num(WAVES[z], 2)).join(' · ') });
  $('srcsum').textContent = fill(T.srcFiles, { n: tiles.length });
  $('srcfiles').innerHTML = tiles.map(t => `<li><a href="${SOURCES[0]}/Norder5/Dir${Math.floor(t / 10000) * 10000}/Npix${t}_cube.fits" target="_blank" rel="noopener">Npix${t}_cube.fits</a></li>`).join('');
  $('srcbox').hidden = !zs.length;
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
  const fmts = [['jpg', T.fmt_jpg], ['png', T.fmt_png]];
  if (S.mode === 'pro' && !inApp) fmts.push(['png16', T.fmt_png16], ['tiff16', T.fmt_tiff16], ['fits', T.fmt_fits], ['fitsall', T.fmt_fitsall], ['json', T.fmt_json]);
  if (!fmts.some(f => f[0] === S.format)) S.format = 'jpg';
  chooser(host, T.format, fmts, () => S.format, v => { S.format = v; }, 'format');
  const raw = ['png16', 'tiff16', 'fits', 'fitsall', 'json'].includes(S.format);
  if (!raw) {
    // the size: the data's own (every pixel of the picture one pixel of the cube), enlarged, or made for a use; each with its pixels
    const [W, H] = fullSize(), cap = outCap(), say = (k, name) => { const [w, h] = sizeOf(k, W, H); return k === 'native' || (w * h <= cap && w >= 16) ? [k, `${name} · ${w} × ${h}`] : null; };
    const sizes = [say('native', T.sizeNative), ...[150, 200, 300, 400].map(n => say('p' + n, fill(T.pct, { n }))), say('ig', 'Instagram'), say('hd', 'Full HD'), say('4k', '4K'), say('a4', T.sz_a4), say('a3', T.sz_a3), S.mode === 'pro' ? ['custom', T.sz_custom] : null].filter(Boolean);
    if (!sizes.some(x => x[0] === S.size)) S.size = 'native';
    chooser(host, T.size, sizes, () => S.size, v => { S.size = v; }, 'size');
    if (S.size === 'custom') {
      const wmax = Math.max(16, Math.floor(Math.sqrt(cap * W / Math.max(1, H)))), f = document.createElement('div'), id = `c${Math.random().toString(36).slice(2, 9)}`;
      f.className = 'ctl inline'; f.dataset.k = 'width'; f.innerHTML = `<label for="${id}"></label><input id="${id}" type="text" inputmode="numeric" autocomplete="off">`;
      f.children[0].textContent = T.widthPx; f.children[1].value = String(sizeOf('custom', W, H)[0]);
      f.children[1].onchange = e => { const v = parseFloat(e.target.value.replace(/\s/g, '').replace(',', '.')); if (isFinite(v)) S.customW = clamp(Math.round(v), 16, wmax); buildOut(); };
      host.append(f);
    }
    const [w2, h2] = sizeOf(S.size, W, H);
    if (w2 > W) { const p = document.createElement('p'); p.className = 'fine'; p.textContent = T.upNote; host.append(p); }
    if (S.mode === 'pro' && (w2 !== W || h2 !== H)) chooser(host, T.interp, [['cubic', T.i_cubic], ['linear', T.i_linear], ['none', T.i_none]], () => S.interp || 'cubic', v => { S.interp = v; }, 'interp');
    if (S.mode === 'pro' && S.format === 'jpg') slider(host, T.jpgQ, 0.5, 1, 0.01, () => S.jpgQ, v => { S.jpgQ = v; }, v => fill(T.pct, { n: Math.round(v * 100) }), true, '', 0.92, x => x / 100);
  }
  $('rawnote').hidden = !raw; $('copy').hidden = raw || !(navigator.clipboard && window.ClipboardItem);
  $('share').hidden = !navigator.share;
}
function build() {
  if (!S.doc) return;
  $('basicbox').hidden = S.mode !== 'basic'; $('probox').hidden = S.mode !== 'pro';
  marks('kind2', 'r', S.doc.recipe); marks('quality2', 'q', S.doc.quality); $('quality2').hidden = S.doc.recipe === 'own';
  const f = S.doc.frame; $('openmap').href = `./?ra=${f.ra.toFixed(5)}&dec=${f.dec.toFixed(5)}&fov=${Math.max(f.w, f.h).toFixed(2)}&lang=${lang}`;
  if (S.mode === 'basic') buildBasic(); else buildPro();
  buildOut(); tellSource();
}
function setMode(m) {
  S.mode = m; document.body.dataset.mode = m; for (const b of $('mode').children) b.setAttribute('aria-pressed', b.dataset.m === m);
  try { localStorage.setItem('chrono-studio-mode', m); } catch { /* private mode */ }
  build(); hist(); tellNow();
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
  const [W, H] = sizeOf(S.size, p.W, p.H), how = S.mode === 'pro' ? S.interp || 'cubic' : 'cubic';
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d');
  x.imageSmoothingEnabled = how !== 'none' || W < p.W; x.imageSmoothingQuality = how === 'linear' ? 'low' : 'high'; x.drawImage(src, 0, 0, W, H);
  try { await document.fonts.ready; } catch { /* the fallback faces will do */ }
  drawMarks(x, W, H, { doc: d, rects: p.rects, picW: p.W, picH: p.H, name: S.name, T, lang });
  const type = S.format === 'png' ? 'image/png' : 'image/jpeg', blob = await new Promise(done => cv.toBlob(done, type, S.jpgQ));
  return { blob, name: `${base}.${S.format === 'png' ? 'png' : 'jpg'}`, W, H };
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
    download(f.blob, f.name); outSay(`${fill(T.saved, { name: f.name })} · ${f.W ? `${f.W} × ${f.H} · ` : ''}${mbOf(f.blob.size)}`); count(`save-${S.format}`); S.took = (S.took || 0) + 1;
  } catch (e) { outSay(e?.name === 'AbortError' ? '' : String(e?.message || e)); }
}

// ------------------------------------------------------------------------------------------------------ start
function wire() {
  $('mode').onclick = e => { const b = e.target.closest('button'); if (b) setMode(b.dataset.m); };
  $('shape').onclick = e => { const b = e.target.closest('button'); if (b) pickShape(b.dataset.s); };
  $('kind').onclick = e => { const b = e.target.closest('button'); if (b) pickRecipe(b.dataset.r); };
  $('quality').onclick = e => { const b = e.target.closest('button'); if (b) pickQuality(+b.dataset.q); };
  $('kind2').onclick = e => { const b = e.target.closest('button'); if (b) switchRecipe(b.dataset.r, S.quality); };
  $('quality2').onclick = e => { const b = e.target.closest('button'); if (b) switchRecipe(known(S.doc.recipe) ? S.doc.recipe : S.recipe, +b.dataset.q); };
  $('turn').onchange = e => { S.turn = e.target.value; applyTurn(); tell(); };
  for (const k of ['ra', 'dec', 'w', 'h', 'pa']) { const e = $('n_' + k); e.onchange = () => typed(k); e.onkeydown = ev => { if (ev.key === 'Enter') { ev.preventDefault(); e.blur(); } }; e.onfocus = () => e.select(); }
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
  for (const id of ['reset', 'reset2']) $(id).onclick = () => switchRecipe(known(S.doc.recipe) ? S.doc.recipe : S.recipe, S.doc.quality);
  $('addband').onclick = () => { const id = 'x' + Date.now().toString(36); S.doc.layers.push({ id, src: { kind: 'band', planes: [35] }, color: [1, 1, 1], gain: 1, on: true, bg: 'level', bgPct: 20, lo: 50, loS: 0, hi: 99.8, hiS: 0, curve: 'asinh', k: 8, smooth: 0 }); S.doc.recipe = 'custom'; S.openLayer = id; changed(true); };
  $('addline').onchange = e => {
    const l = LINES.find(x => x.id === e.target.value); e.target.value = ''; if (!l) return; const id = l.id + Date.now().toString(36);
    S.doc.layers.push({ id, src: lineSrc(l.on, l.off), color: [0.3, 0.8, 1], gain: 1, on: true, bg: 'level', bgPct: 20, lo: 50, loS: 6, hi: 99.8, hiS: 120, curve: 'asinh', k: 8, smooth: 0.6, feature: l.id }); S.doc.recipe = 'custom'; S.openLayer = id; changed(true);
  };
  for (const how of ['share', 'save', 'copy', 'link']) $(how).onclick = () => take(how);
  // A phone: the map stands fixed above the panel and the keyboard takes the lower half of the screen, so a field that
  // is being typed in would have no room between them. While one is, the map is lower (studio.css, body.typing).
  if (narrow) {
    const field = e => !!e?.matches?.('#side input[type=text]'), typing = on => { if (document.body.classList.contains('typing') !== on) { document.body.classList.toggle('typing', on); window.dispatchEvent(new Event('resize')); } };
    $('side').addEventListener('focusin', e => { if (field(e.target)) typing(true); });
    $('side').addEventListener('focusout', e => { if (field(e.target)) setTimeout(() => { if (!field(document.activeElement)) typing(false); }, 120); });
  }
  let rt = 0; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if ($('picker').hidden) layMarks(); else { const f = frameFromMap(); layFrame(); if (f) showOnMap(f.ra, f.dec, f.w); tell(); } }, 150); });
}

const guide = makeGuide({ S, $, T, lang, fill, narrow, frameFromMap: () => frameFromMap(), backToPlace: () => backToPlace(), setMode: m => setMode(m),
  changed: r => changed(r), open: id => { S.openLayer = id; build(); hist(); }, useRecipe: r => { if (S.doc && S.doc.recipe !== r) switchRecipe(r, S.doc.quality || 1); } });
words(); wire(); setFull(false);
for (const b of $('mode').children) b.setAttribute('aria-pressed', b.dataset.m === S.mode);
document.body.dataset.mode = S.mode;
let start = { ra: 98.0, dec: 4.95, w: 3, rot: 0 };          // the Rosette Nebula: bright, round, and 48 MB to read (Orion is 119)
const asked = fromQuery(location.search);
let last = null; try { last = !asked && sessionStorage.getItem('chrono-studio-last'); } catch { last = null; }
const from = asked || (last ? fromQuery('?' + last) : null);
if (from) {
  const f = from.frame, w = f.w || (f.fov ? clamp(f.fov * 0.5, 1.5, 8) : 4), h = f.h || w;
  start = { ra: f.ra, dec: f.dec, w, rot: f.rot || 0 };
  if (RECIPES[from.recipe]) S.recipe = from.recipe; S.quality = from.quality || 1;
  if (from.recipe === 'own' && from.rest) { const zs = [...new Set(from.rest.layers.flatMap(L => (L.src.kind === 'band' ? L.src.planes : [])))].slice(0, OWN_MAX); if (zs.length) { S.own = zs.sort((a, b) => a - b); S.recipe = 'own'; } }
  const a = w / h, near = SHAPES.reduce((best, s) => (Math.abs(Math.log(s[1] / a)) < Math.abs(Math.log(best[1] / a)) ? s : best));
  if (Math.abs(Math.log(near[1] / a)) < 0.012) S.shape = near[0]; else { S.shape = 'free'; S.ratio = clamp(a, 0.2, 5); }          // a frame typed in Pro keeps its own proportions
  if (Math.abs((f.rot || 0) - galacticUp(f.ra, f.dec)) < 0.6 && Math.abs(f.rot || 0) > 0.6) S.turn = 'level'; else if (Math.abs(f.rot || 0) > 0.6) S.turn = 'free';
  if (asked && asked.frame.w && (asked.rest || q0.get('r'))) S.fromLink = asked;
}
marks('shape', 's', S.shape); $('turn').value = S.turn; pickRecipe(S.recipe); pickQuality(S.quality);
initMap(start).then(() => { if (q0.has('guide')) guide.start(q0.get('guide') || 'apod'); else if (!S.fromLink) guide.offer(); }).catch(() => { $('findmsg').textContent = T.failed; });
if (new URLSearchParams(location.search).has('debug')) window.__studio = { S, ask, frameFromMap, showOnMap, render, getPicture, take, makeFile, guide, SET };
