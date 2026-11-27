// The picture studio's guide: it makes pictures with the visitor, who does every step with their own hands.
// Four parts: the picture NASA's APOD showed, other pictures, the Pro panel, and everything in detail.
// A step shows a few sentences, rings the control it is about, and where it asks for something it moves on by
// itself once that has been done (or is skipped). The words are in guidewords.js.
import { GUIDE } from './guidewords.js';

const near = (f, ra, dec, lim = 0.6) => !!f && Math.hypot(((f.ra - ra + 540) % 360 - 180) * Math.cos(dec * Math.PI / 180), f.dec - dec) < lim;
const GC = [266.894, -29.196], ROSETTE = [98.0, 4.95];

/** ctx: { S, $, lang, fill, frameFromMap, backToPlace, place: () => is the map step showing } */
export function makeGuide(ctx) {
  const { S, $ } = ctx, G = GUIDE[ctx.lang] || GUIDE.en, q = sel => document.querySelector(sel);
  const inPlace = () => document.body.classList.contains('place'), ready = () => !!S.pic && !S.busy && !S.working && !(S.need && S.need.length);
  const layerWith = f => S.doc?.layers.find(f);
  // parts three and four need a picture to work on: where there is none, they first ask for one
  const NEEDPIC = { id: 'need_pic', ring: '#get', done: () => !inPlace() && ready(), auto: true, skipIf: () => !inPlace() && !!S.pic };
  // what each step rings, and what counts as having done it; `keep` holds what a step remembers from its start
  const PARTS = {
    apod: [
      { id: 'a1', img: 'img/studio-apod.webp', enter: () => { if (!inPlace()) ctx.backToPlace(); } },
      { id: 'a2', ring: '#places button[data-p="7"]', done: () => near(ctx.frameFromMap(), ...GC) && S.turn === 'level' },
      { id: 'a3', ring: '#frame' },
      { id: 'a4', ring: '#kind button[data-r="dust"]', done: () => S.recipe === 'dust' },
      { id: 'a5', ring: '#act' },
      { id: 'a6', ring: '#get', done: () => !inPlace() },
      { id: 'a7', ring: '#busy', done: ready, auto: true },
      { id: 'a8', ring: '#pic' },
      { id: 'a9', ring: '#basic [data-k="faint"]', enter: k => { k.v = S.doc?.layers[0]?.k; }, done: k => S.doc?.layers[0]?.k !== k.v },
      { id: 'a10', ring: '#out [data-k="title"]', done: () => (S.doc?.marks.title || '').trim().length > 1 },
      { id: 'a11', ring: '#outbox .rowbtns', enter: k => { k.n = S.took || 0; }, done: k => (S.took || 0) > k.n },
      { id: 'a12', end: true },
    ],
    more: [
      { id: 'b1', ring: '#another', done: inPlace },
      { id: 'b2', ring: '#places button[data-p="3"]', done: () => near(ctx.frameFromMap(), ...ROSETTE) },
      { id: 'b3', ring: '#kind button[data-r="gas"]', done: () => S.recipe === 'gas' },
      { id: 'b4', ring: '#get', done: () => !inPlace() },
      { id: 'b5', ring: '#busy', done: ready, auto: true },
      { id: 'b6', ring: '#notes' },
      { id: 'b7', ring: '#out .checks', done: () => !!S.doc?.marks.key },
      { id: 'b8', ring: () => (S.doc?.recipe === 'stars' ? q('#need') : q('#kind2 button[data-r="stars"]')), done: () => S.doc?.recipe === 'stars' && ready() },
      { id: 'b9', ring: '#pic' },
      { id: 'b10', ring: '#link', end: true },
    ],
    pro: [
      NEEDPIC,
      { id: 'c1', ring: '#mode button[data-m="pro"]', done: () => S.mode === 'pro' },
      { id: 'c2', ring: '#layers .layer:first-child button.name', done: () => !!S.openLayer },
      { id: 'c3', ring: '#hist' },
      { id: 'c4', ring: '#layers .layer.open [data-k="black"]', enter: k => { const L = layerWith(x => x.id === S.openLayer); k.v = L && `${L.lo}/${L.loS}`; }, done: k => { const L = layerWith(x => x.id === S.openLayer); return !!L && `${L.lo}/${L.loS}` !== k.v; } },
      { id: 'c5', ring: '#layers .layer.open .strip' },
      { id: 'c6', ring: '#combine', enter: k => { k.v = `${S.doc?.blend}/${S.doc?.layout}`; }, done: k => `${S.doc?.blend}/${S.doc?.layout}` !== k.v },
      { id: 'c7', ring: '#whole' },
      { id: 'c8', ring: '#out [data-k="format"]' },
      // Pro's first step: back to the map, a number typed into the frame, the card for wavelengths of one's own
      { id: 'c10', ring: '#another', done: () => inPlace() },
      { id: 'c11', ring: '#proplace', enter: k => { if (S.mode !== 'pro') ctx.setMode('pro'); k.v = S.typedN || 0; }, done: k => (S.typedN || 0) > k.v },
      { id: 'c12', ring: '#kind [data-r="own"]', done: () => S.recipe === 'own' },
      { id: 'c9', end: true },
    ],
    deep: [
      NEEDPIC,
      // the detailed part works on the gas-and-dust picture, in Pro, its layers added up (so that each has its own curve)
      { id: 'd1', ring: '#pic', enter: () => { if (S.mode !== 'pro') ctx.setMode('pro'); ctx.useRecipe('gas'); } },
      { id: 'd2', ring: () => (layerWith(L => L.feature === 'paa') ? q('#need') : q('#addline')), done: () => !!layerWith(L => L.feature === 'paa') && ready() },
      { id: 'd3', ring: '#layers' },
      { id: 'd4', ring: () => q('#layers .layer.open [data-k="clean"]') || q('#layers .layer:last-child'), enter: k => { k.seen = new Set(); const L = layerWith(x => x.feature === 'paa'); if (L && S.openLayer !== L.id) ctx.open(L.id); }, done: k => { const L = layerWith(x => x.feature === 'paa'); if (L) k.seen.add(L.clean ?? 1); return k.seen.size > 1; } },
      { id: 'd5', ring: '#layers .layer.open' },
      { id: 'd6', ring: () => q('#layers .layer.open [data-k="curve"]') || q('#layers .layer.open'), enter: k => { if (S.doc && S.doc.blend === 'ratio') { S.doc.blend = 'add'; ctx.changed(true); } if (!S.openLayer && S.doc) ctx.open(S.doc.layers[0].id); k.v = S.doc?.layers.map(L => L.curve).join(); }, done: k => S.doc?.layers.map(L => L.curve).join() !== k.v },
      { id: 'd7', ring: '#combine' },
      { id: 'd8', ring: '#pic' },
      { id: 'd9', ring: '#out [data-k="format"]' },
      { id: 'd10', ring: '#setbtn' },
      { id: 'd11', end: true },
    ],
  };
  const ORDER = ['apod', 'more', 'pro', 'deep'];
  let part = null, at = 0, keep = {}, timer = 0, ringed = null, box = null, doneOnce = false, wasDone = false;

  function card() {
    if (box) return box;
    box = document.createElement('aside'); box.id = 'guide'; box.className = 'guide'; box.setAttribute('role', 'region'); box.setAttribute('aria-label', G.name); box.hidden = true;
    box.innerHTML = '<header><b id="g_ch"></b><span id="g_n"></span><button type="button" id="g_x" class="x">×</button></header><div class="gbody"><img id="g_img" alt="" hidden><p id="g_text" aria-live="polite"></p></div><p id="g_task" class="gtask" hidden></p><footer><button type="button" id="g_back" class="ghost small"></button><span class="grow"></span><button type="button" id="g_skip" class="linkbtn"></button><button type="button" id="g_alt" class="ghost small" hidden></button><button type="button" id="g_next" class="cta small"></button></footer>';
    document.body.append(box);
    $('g_x').setAttribute('aria-label', G.close); $('g_x').onclick = stop; $('g_back').textContent = G.back; $('g_skip').textContent = G.skip;
    $('g_back').onclick = () => show(at - 1); $('g_skip').onclick = () => show(at + 1);
    return box;
  }
  function unring() { if (ringed) ringed.classList.remove('gring'); ringed = null; document.body.classList.remove('ringact'); }
  function ring(step) {
    const e = typeof step.ring === 'function' ? step.ring() : step.ring ? q(step.ring) : null;
    if (e === ringed) return;
    unring();
    if (!e || !e.getClientRects().length) return;
    ringed = e; e.classList.add('gring'); document.body.classList.toggle('ringact', !!e.closest('.act'));          // see studio.css: the button's bar
    try { e.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); } catch { /* an old engine */ }
  }
  function size() { document.documentElement.style.setProperty('--guideh', (box && !box.hidden ? box.offsetHeight : 0) + 'px'); }
  function show(i) {
    const steps = PARTS[part], dir = i < at ? -1 : 1; i = Math.max(0, Math.min(steps.length - 1, i));
    while (steps[i].skipIf && steps[i].skipIf() && steps[i + dir]) i += dir;          // a step that has nothing to ask for is passed over
    at = i; const step = steps[at]; keep = {}; doneOnce = false; wasDone = false;
    card().hidden = false; document.body.classList.add('guiding');
    try { step.enter?.(keep); } catch { /* the page is not where the step expects: the visitor can still go on */ }
    try { wasDone = !!step.done?.(keep); } catch { wasDone = false; }          // what the step asks for is already so (a ready place chose it)
    const shown = steps.filter(x => !x.skipIf), n = shown.indexOf(step); $('g_ch').textContent = G['ch_' + part]; $('g_n').textContent = n < 0 ? '' : ctx.fill(G.stepof, { i: n + 1, n: shown.length });
    $('g_text').textContent = ctx.fill(G[step.id], ctx.T);          // the words name the page's controls as the page itself names them box.querySelector('.gmenu')?.remove(); box.querySelector('footer').hidden = false;
    const im = $('g_img'); im.hidden = !step.img; if (step.img) im.src = step.img;
    $('g_back').hidden = at === 0 || (at === 1 && !!steps[0].skipIf); $('g_skip').hidden = !step.done || !!step.auto; $('g_task').hidden = !step.done; $('g_task').classList.remove('did');
    const nextPart = ORDER[ORDER.indexOf(part) + 1], next = $('g_next'), alt = $('g_alt');
    alt.hidden = true;
    if (step.end) {
      if (nextPart) { next.textContent = ctx.fill(G.nextch, { name: G['ch_' + nextPart] }); next.onclick = () => start(nextPart); alt.hidden = false; alt.textContent = G.finish; alt.onclick = stop; }
      else { next.textContent = G.finish; next.onclick = stop; }
      next.disabled = false; try { localStorage.setItem('chrono-studio-guide', part); } catch { /* private mode */ }
    } else { next.textContent = G.next; next.onclick = () => show(at + 1); next.disabled = !!step.done; }
    if (step.done) $('g_task').textContent = step.auto ? G.wait : G.doit;
    ring(step); size(); clearInterval(timer);
    timer = setInterval(() => {
      const s = PARTS[part]?.[at]; if (!s) return;
      if (ringed && !ringed.getClientRects().length) unring();          // what was ringed has left the page (the progress box, once the reading is over)
      ring(s);          // what a step rings may only now have come onto the page
      if (!s.done || doneOnce) return;
      let ok = false; try { ok = !!s.done(keep); } catch { ok = false; }
      if (!ok) return;
      doneOnce = true; $('g_task').textContent = G.did; $('g_task').classList.add('did'); $('g_next').disabled = false; $('g_skip').hidden = true;
      // done by the visitor's own hand: on to the next step. Already done on arrival (a ready place chose it): the words stay until "Next" is pressed
      if (s.auto || !wasDone) setTimeout(() => { if (PARTS[part]?.[at] === s && !box.hidden) show(at + 1); }, s.auto ? 500 : 1100);
    }, 300);
  }
  function start(which = 'apod') {
    part = PARTS[which] ? which : 'apod'; try { localStorage.setItem('chrono-studio-guide-seen', '1'); } catch { /* private mode */ }
    $('guideoffer')?.remove(); show(0);
  }
  /** The four parts, to choose from. */
  function menu() {
    stop(); card().hidden = false; document.body.classList.add('guiding'); part = null;
    $('g_ch').textContent = G.name; $('g_n').textContent = ''; $('g_text').textContent = G.pick; $('g_img').hidden = true; $('g_task').hidden = true;
    box.querySelector('.gmenu')?.remove(); box.querySelector('footer').hidden = true;
    const m = document.createElement('div'); m.className = 'gmenu';
    ORDER.forEach((k, i) => { const b = document.createElement('button'); b.type = 'button'; b.className = i ? 'ghost small' : 'cta small'; b.dataset.part = k; b.textContent = `${i + 1}. ${G['ch_' + k]}`; b.onclick = () => start(k); m.append(b); });
    box.append(m); size();
  }
  function stop() { clearInterval(timer); unring(); if (box) { box.hidden = true; box.querySelector('.gmenu')?.remove(); } document.body.classList.remove('guiding'); size(); part = null; }
  const open = () => !!box && !box.hidden;
  /** A first visit: a small card that offers the guide, once. */
  function offer() {
    let seen = false; try { seen = !!localStorage.getItem('chrono-studio-guide-seen'); } catch { seen = true; }
    if (seen || part) return;
    const o = document.createElement('div'); o.id = 'guideoffer'; o.className = 'guide offer';
    o.innerHTML = '<p></p><footer><button type="button" class="ghost small"></button><span class="grow"></span><button type="button" class="cta small"></button></footer>';
    o.querySelector('p').textContent = G.offer; const [no, go] = o.querySelectorAll('button'); no.textContent = G.offer_no; go.textContent = G.offer_go;
    const gone = () => { try { localStorage.setItem('chrono-studio-guide-seen', '1'); } catch { /* private mode */ } o.remove(); };
    no.onclick = gone; go.onclick = () => start('apod');
    // a desk: over a corner of the map. A phone held upright: in the page, above the title, so that it covers no button
    if (ctx.narrow && $('sideplace')) { o.classList.add('inpage'); $('sideplace').prepend(o); } else document.body.append(o);
  }
  window.addEventListener('resize', size);
  return { start, stop, offer, menu, get on() { return open(); }, get where() { return part ? `${part}:${PARTS[part][at].id}` : ''; }, PARTS };
}
