/*
 * Sliders under a finger (28 Nov 2026). On a phone the browser's own slider jumps to wherever a finger lands on it, so
 * a page scrolled with the thumb resting on a slider (the studio's panel holds thirty of them) changed the picture.
 * Here, on a touch screen, a slider moves only for a sideways drag, and by how far the finger went, not to where it
 * landed: an upward or downward swipe scrolls the page and leaves every value as it was; a tap does nothing; a double
 * tap does what a double click does (the studio puts the slider back). The mouse, the keyboard and screen readers keep
 * the browser's own slider. The page hears the same 'input' and 'change' events as before.
 */
(function () {
  if (window.__touchRange) return; window.__touchRange = true;
  var root = document.documentElement;
  var css = document.createElement('style');
  css.textContent =
    // the finger reaches the slider through this file only; the page scrolls up and down from on top of it
    'html.touch-range input[type=range]{pointer-events:none}' +
    'html.touch-range :has(> input[type=range]){touch-action:pan-y}' +
    'html.touch-range input[type=range].dragging::-webkit-slider-thumb{transform:scale(1.18)}';
  (document.head || root).appendChild(css);
  var coarse = window.matchMedia && matchMedia('(pointer: coarse)');
  function setMode() { root.classList.toggle('touch-range', !!(coarse && coarse.matches)); }
  setMode();
  if (coarse && coarse.addEventListener) coarse.addEventListener('change', setMode);

  var SLOP = 10;            // px the finger may wander before it counts as a drag or a scroll
  var REACH = 12;           // px above and below the slider that still count as on it
  var g = null, lastTap = null;

  function sliderAt(x, y) {
    var all = document.querySelectorAll('input[type=range]');
    for (var i = 0; i < all.length; i++) {
      var s = all[i];
      if (s.disabled || !s.offsetParent) continue;
      var r = s.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top - REACH && y <= r.bottom + REACH) return s;
    }
    return null;
  }
  function fire(s, type) { s.dispatchEvent(new Event(type, { bubbles: true })); }

  document.addEventListener('pointerdown', function (e) {
    if (e.pointerType !== 'touch' || !root.classList.contains('touch-range') || !e.isPrimary) return;
    var s = sliderAt(e.clientX, e.clientY);
    if (!s) return;
    var r = s.getBoundingClientRect();
    g = { s: s, id: e.pointerId, x0: e.clientX, y0: e.clientY, v0: parseFloat(s.value), w: Math.max(40, r.width - 16),
          min: parseFloat(s.min || 0), max: parseFloat(s.max || 100), step: s.step === 'any' ? 0 : parseFloat(s.step || 1),
          state: 'wait', el: e.target };
  }, true);

  document.addEventListener('pointermove', function (e) {
    if (!g || e.pointerId !== g.id) return;
    var dx = e.clientX - g.x0, dy = e.clientY - g.y0;
    if (g.state === 'wait') {
      if (Math.abs(dy) > SLOP && Math.abs(dy) >= Math.abs(dx)) { g = null; return; }      // a scroll: the page has it
      if (Math.abs(dx) > SLOP && Math.abs(dx) > 1.2 * Math.abs(dy)) {
        g.state = 'drag'; g.s.classList.add('dragging');
        try { g.el.setPointerCapture(g.id); } catch (err) { /* the element went away */ }
      } else return;
    }
    e.preventDefault();
    var span = g.max - g.min, v = g.v0 + (dx / g.w) * span;
    if (g.step > 0) v = g.min + Math.round((v - g.min) / g.step) * g.step;
    v = Math.min(g.max, Math.max(g.min, v));
    var before = g.s.value;
    g.s.value = String(+v.toFixed(10));
    if (g.s.value !== before) fire(g.s, 'input');
  }, { capture: true, passive: false });

  function end(e) {
    if (!g || e.pointerId !== g.id) return;
    var s = g.s;
    if (g.state === 'drag') {
      s.classList.remove('dragging');
      if (s.value !== String(g.v0) && parseFloat(s.value) !== g.v0) fire(s, 'change');
      lastTap = null;
    } else if (e.type === 'pointerup') {
      var now = Date.now();
      if (lastTap && lastTap.s === s && now - lastTap.t < 350) {                           // a double tap
        s.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
        lastTap = null;
      } else lastTap = { s: s, t: now };
    }
    g = null;
  }
  document.addEventListener('pointerup', end, true);
  document.addEventListener('pointercancel', function (e) {
    if (!g || e.pointerId !== g.id) return;
    if (g.state === 'drag') { g.s.classList.remove('dragging'); }
    g = null;
  }, true);
})();
