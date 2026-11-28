// The guided tour, rebuilt on 27 Nov 2026 after the picture studio's guide (the user: "stüdyodaki gibi, etkileşimli; ana
// sayfada yalnızca gerekli bilgiler"). The visitor does every step with their own hands: moves the map, slides the
// colour bar, taps Barnard's Star, steps through its pictures, opens its 26 years and the data. A step says a sentence
// or two, rings the thing it is about, and moves on by itself once it has been done (or is skipped). It ends with the
// visitor's own turn. The words are in lang.js under rg.*.

/**
 * ctx: { $, T, S, Sky, nameOf, openTarget, closePanel, simpleCard, isNarrow, panelOpen, layer: { get, set } }
 */
export function makeGuide(ctx) {
  const { $, T, S, Sky } = ctx, q = sel => document.querySelector(sel);
  const barnard = () => (S.targets || []).find(t => t.slug === 'barnard');
  const onBarnard = () => ctx.panelOpen() && S.target?.slug === 'barnard';
  const openBarnard = () => { const b = barnard(); if (b && !onBarnard()) ctx.openTarget(b); };
  const near = (ra, dec, t, arcsec) => Math.hypot(((ra - t.ra + 540) % 360 - 180) * Math.cos(t.dec * Math.PI / 180), dec - t.dec) * 3600 < arcsec;
  let taps = 0;
  document.addEventListener('click', e => { if (e.target.closest?.('#prev, #next')) taps++; }, true);
  // `top`: on a phone the card stands at the top while the map is the thing to touch (the colour bar lies along the
  // bottom); `done`: what counts as having done the step; `skip`: what skipping does in the visitor's place
  const STEPS = [
    { id: 'r1', top: true, ring: '#map',
      enter: k => { ctx.closePanel(); if (Sky.isReady()) Sky.flyTo(266.4, -29.0, 100); setTimeout(() => { k.c = Sky.center(); k.f = Sky.fov(); }, 2600); },
      done: k => { if (!k.c) return false; const c = Sky.center(), f = Sky.fov(); return Math.hypot(c[0] - k.c[0], c[1] - k.c[1]) > 2 || f / k.f > 1.3 || k.f / f > 1.3; } },
    { id: 'r2', top: true, ring: '#wavebox', enter: k => { ctx.closePanel(); k.v = $('wave').value; }, done: k => $('wave').value !== k.v },
    { id: 'r3', top: true,
      enter: () => {
        ctx.closePanel(); const b = barnard(); if (!b || !Sky.isReady()) return;
        Sky.flyTo(b.ra, b.dec, 0.45); setTimeout(() => Sky.mark(b.ra, b.dec, b.size, ctx.nameOf(b)), 1800);
        // a press anywhere in the box opens the star: a finger is wider than the star
        S.tapHook = (ra, dec) => { if (!near(ra, dec, b, b.size * 60 * 0.65)) return false; ctx.openTarget(b); return true; };
      },
      leave: () => { S.tapHook = null; },
      // the window of light: Barnard's Star in its square on the map, with its name above it
      spot: () => {
        const b = barnard(), m = $('map')?.getBoundingClientRect(); if (!b || !m || ctx.panelOpen() || !Sky.isReady()) return null;
        const s = Sky.screenOf(b.ra, b.dec); if (!s || !(s[0] >= 0 && s[0] <= m.width && s[1] >= 0 && s[1] <= m.height)) return null;
        const half = Math.max(34, (b.size / 60) * m.width / Math.max(Sky.fov(), 1e-3) / 2 + 12);
        return { left: m.left + s[0] - half, top: m.top + s[1] - half - 24, width: 2 * half, height: 2 * half + 24 };
      },
      done: onBarnard, skip: openBarnard },
    { id: 'r4', ring: '.viewer .transport', enter: k => { openBarnard(); k.n = taps; }, done: k => taps - k.n >= 2 },
    { id: 'r5', ring: '#leadbox', enter: () => openBarnard() },
    { id: 'r6', ring: '[data-years]', enter: () => openBarnard(), done: () => S.mode === 'years', skip: () => q('[data-years]')?.click() },
    { id: 'r7', ring: '.viewer .stage' },
    { id: 'r8', ring: '#taball', done: () => !ctx.simpleCard(), skip: () => $('taball')?.click() },
    { id: 'r9', ring: '#findings' },
    { id: 'r10', end: true, picks: ['rwaur', 'wise0855', 'rdra'] },
  ];
  let at = -1, keep = {}, timer = 0, ringed = null, box = null, doneOnce = false, layerWas, dim = null, dimRaf = 0;

  /** A light shade over the page with a clear window where the step's place is; it follows scrolling and the map. */
  function shade() {
    dimRaf = 0;
    if (at < 0 || !box || box.hidden) { if (dim) dim.hidden = true; return; }
    if (!dim) { dim = document.createElement('div'); dim.id = 'rgdim'; dim.className = 'rgdim'; dim.setAttribute('aria-hidden', 'true'); document.body.append(dim); }
    const step = STEPS[at];
    let r = null;
    try { r = step.spot ? step.spot() : ringed && ringed.getClientRects().length ? ringed.getBoundingClientRect() : null; } catch { r = null; }
    if (!r || r.width < 2 || r.height < 2) dim.hidden = true;
    else {
      const pad = step.ring === '#map' ? 0 : 7;
      Object.assign(dim.style, { left: `${r.left - pad}px`, top: `${r.top - pad}px`, width: `${r.width + 2 * pad}px`, height: `${r.height + 2 * pad}px` });
      dim.hidden = false;
    }
    dimRaf = requestAnimationFrame(shade);
  }

  function card() {
    if (box) return box;
    box = document.createElement('aside'); box.id = 'rg'; box.className = 'rg'; box.setAttribute('role', 'region'); box.hidden = true;
    box.innerHTML = '<header><b id="rg_ch"></b><span id="rg_n"></span><button type="button" id="rg_x" class="x">×</button></header>'
      + '<p id="rg_text" aria-live="polite"></p><p id="rg_task" class="rgtask" hidden></p><div id="rg_picks" class="rgpicks" hidden></div>'
      + '<footer><button type="button" id="rg_back" class="ghost"></button><button type="button" id="rg_skip" class="rglink"></button><span class="grow"></span><button type="button" id="rg_next" class="cta"></button></footer>';
    document.body.append(box);
    $('rg_x').onclick = stop; $('rg_back').onclick = () => show(at - 1); $('rg_skip').onclick = () => { try { STEPS[at].skip?.(); } catch { /* the page moved on */ } show(at + 1); };
    return box;
  }
  function unring() { if (ringed) ringed.classList.remove('rgring'); ringed = null; }
  function ring(step) {
    const e = step.ring ? q(step.ring) : null;
    if (e === ringed) return;
    unring();
    if (!e || !e.getClientRects().length) return;
    ringed = e; e.classList.add('rgring');
    if (step.ring !== '#map' && step.ring !== '#wavebox') bring(e);
  }
  /** Scroll what is ringed into the part of the screen the card leaves free (a phone: above the card at the bottom). */
  function bring(e) {
    const r = e.getBoundingClientRect(), c = box && !box.hidden ? box.getBoundingClientRect() : null;
    const under = c && c.left < r.right && c.right > r.left && c.top > innerHeight / 3;          // the card lies across it, at the bottom
    const top = 56, bottom = (under ? c.top : innerHeight) - 14;
    if (r.top >= top && r.bottom <= bottom) return;
    const dy = r.height > bottom - top || r.top < top ? r.top - top : r.bottom - bottom;
    let sc = e.parentElement;
    while (sc && !(/(auto|scroll)/.test(getComputedStyle(sc).overflowY) && sc.scrollHeight > sc.clientHeight + 2)) sc = sc.parentElement;
    const how = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    (sc || window).scrollBy({ top: dy, behavior: how });
  }
  function size() { document.documentElement.style.setProperty('--rgh', (box && !box.hidden ? box.offsetHeight : 0) + 'px'); }
  function words() {
    if (at < 0 || !box) return;
    const step = STEPS[at];
    $('rg_ch').textContent = T('nav.guide'); $('rg_x').setAttribute('aria-label', T('rg.close')); box.setAttribute('aria-label', T('nav.guide'));
    $('rg_n').textContent = `${at + 1} / ${STEPS.length}`;
    $('rg_text').textContent = T(`rg.${step.id}`);
    $('rg_back').textContent = T('tour.back'); $('rg_skip').textContent = T('rg.skip');
    const task = $('rg_task'); task.hidden = !step.done; if (step.done && !doneOnce) task.textContent = T(`rg.${step.id}.do`);
    $('rg_next').textContent = step.end ? T('tour.finish') : T('tour.next');
  }
  function show(i) {
    const was = STEPS[at]; try { was?.leave?.(); } catch { /* nothing to undo */ }
    if (i >= STEPS.length) return stop();
    at = Math.max(0, i); const step = STEPS[at]; keep = {}; doneOnce = false;
    card().hidden = false; box.classList.toggle('attop', !!step.top); document.body.classList.add('rguiding');
    try { step.enter?.(keep); } catch { /* the page is not where the step expects: the visitor can still go on */ }
    words();
    $('rg_task').classList.remove('did');
    $('rg_back').hidden = at === 0; $('rg_skip').hidden = !step.done;
    const next = $('rg_next'); next.disabled = !!step.done; next.onclick = step.end ? stop : () => show(at + 1);
    const picks = $('rg_picks'); picks.hidden = !step.picks; picks.innerHTML = '';
    for (const slug of step.picks || []) {
      const t = (S.targets || []).find(x => x.slug === slug); if (!t) continue;
      const b = document.createElement('button'); b.type = 'button'; b.className = 'ghost';
      b.innerHTML = `<b></b><small></small>`; b.querySelector('b').textContent = ctx.nameOf(t); b.querySelector('small').textContent = T(`rg.hook.${slug}`);
      b.onclick = () => { stop(); ctx.openTarget(t); };
      picks.append(b);
    }
    unring(); setTimeout(() => { if (STEPS[at] === step) { size(); ring(step); } }, step.top ? 0 : 900);
    if (!dimRaf) dimRaf = requestAnimationFrame(shade);
    size(); clearInterval(timer);
    timer = setInterval(() => {
      const s = STEPS[at]; if (!s || box.hidden) return;
      if (ringed && !ringed.getClientRects().length) unring();
      if (!ringed && s.ring) ring(s);          // what a step rings may only now have come onto the page
      size();
      if (!s.done || doneOnce) return;
      let ok = false; try { ok = !!s.done(keep); } catch { ok = false; }
      if (!ok) return;
      doneOnce = true; const task = $('rg_task'); task.textContent = T('rg.did'); task.classList.add('did'); $('rg_next').disabled = false; $('rg_skip').hidden = true;
      setTimeout(() => { if (STEPS[at] === s && !box.hidden) show(at + 1); }, 1300);          // done by the visitor's own hand: on to the next
    }, 300);
  }
  function start() {
    // the guide goes through the story; whatever layer the visitor had chosen comes back at the end
    layerWas = ctx.layer.get(); ctx.layer.set('story');
    $('welcome') && ($('welcome').hidden = true);
    show(0);
  }
  function stop() {
    try { STEPS[at]?.leave?.(); } catch { /* nothing to undo */ }
    clearInterval(timer); unring(); if (box) box.hidden = true; document.body.classList.remove('rguiding'); size();
    if (dimRaf) cancelAnimationFrame(dimRaf); dimRaf = 0; if (dim) dim.hidden = true;
    if (layerWas !== undefined) { ctx.layer.set(layerWas); layerWas = undefined; }
    at = -1; S.tapHook = null;
  }
  /** Once, the first time the visitor opens the sky: a small card that offers the guide. Returns whether it was shown. */
  function offer() {
    let seen = false; try { seen = !!localStorage.getItem('chrono-guide-offered'); localStorage.setItem('chrono-guide-offered', '1'); } catch { seen = true; }
    if (seen || (box && !box.hidden)) return false;
    const o = document.createElement('aside'); o.id = 'rgoffer'; o.className = 'rg rgoffer'; o.setAttribute('role', 'region'); o.setAttribute('aria-label', T('nav.guide'));
    o.innerHTML = '<p></p><footer><button type="button" class="ghost"></button><span class="grow"></span><button type="button" class="cta"></button></footer>';
    o.querySelector('p').textContent = T('rg.offer'); const [no, go] = o.querySelectorAll('button'); no.textContent = T('rg.offerNo'); go.textContent = T('rg.offerGo');
    no.onclick = () => o.remove(); go.onclick = () => { o.remove(); start(); };
    document.body.append(o); setTimeout(() => o.remove(), 30000);
    return true;
  }
  window.addEventListener('resize', size);
  return { start, stop, words, offer, get on() { return !!box && !box.hidden; }, get step() { return at >= 0 ? STEPS[at].id : ''; }, STEPS };
}
