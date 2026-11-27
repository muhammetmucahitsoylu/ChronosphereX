// The picture studio's bench: keeps the wavelengths read for a frame and turns a picture's description into pixels.
// No page, no network, no worker here: the worker (worker.js) and the tests (spike/studio) both drive this.
//
// What is seen while editing is what is saved: every layer is worked out once on the frame's full grid (its light,
// background, black and white points, the stars' colour balance), and the quick picture shown while editing is that
// same layer made smaller, stretched with the same numbers.
import { mendPlane, shrink, layerLight, layerHoles, backgroundOf, percentiles, noiseOf, lutOf, stretchInto, normInto, blur, compose, composeRatio, starBalance, finish, toBytes, toWords, planesOf, DEFAULT_LOOK } from './process.js';

const keyOf = o => JSON.stringify(o);
const srcKey = L => keyOf([L.src, L.clean ?? null]), litKey = L => keyOf([L.src, L.clean ?? null, L.bg, L.bgPct, L.smooth]);

export class Bench {
  /** W x H: the frame in pixels; previewMax: the longer side of the quick picture shown while editing. */
  constructor(W, H, previewMax = 1100) {
    this.W = W; this.H = H;
    this.f = Math.max(1, Math.ceil(Math.max(W, H) / previewMax));
    this.w = Math.floor(W / this.f); this.h = Math.floor(H / this.f);
    this.full = new Map();                                  // plane -> { data, mask }
    this.cache = new Map();                                 // worked-out layers, by what they were made from
    this.holes = new Map();                                 // plane -> { cores, gaps } (pixels)
  }
  has(z) { return this.full.has(z); }
  /** A wavelength arrives: its star cores are mended and its gaps noted. */
  addPlane(z, data) {
    const { mask, cores, gaps } = mendPlane(data, this.W, this.H);
    this.full.set(z, { data, mask }); this.holes.set(z, { cores, gaps });
    const hit = new RegExp(`[\\[,]${z}[\\],]`);
    for (const k of [...this.cache.keys()]) if (hit.test(k)) this.cache.delete(k);
    return { cores, gaps };
  }
  grid(target) { return target === 'full' ? { W: this.W, H: this.H, scale: 1 } : { W: this.w, H: this.h, scale: this.f }; }
  missing(doc) { const need = new Set(); for (const L of doc.layers) if (L.on) for (const z of planesOf(L.src)) if (!this.full.has(z)) need.add(z); return [...need].sort((a, b) => a - b); }
  memo(key, make) { let v = this.cache.get(key); if (v === undefined) { v = make(); this.cache.set(key, v); } return v; }

  /** A layer's light on the full grid, background taken off and smoothed as asked. */
  lit(L) {
    const raw = this.memo('L' + srcKey(L), () => layerLight(L.src, this.full, this.W, this.H, L.clean ?? (L.src.kind === 'line' ? 1 : 0)));
    if (!raw) return null;
    return this.memo('B' + litKey(L), () => {
      const bg = backgroundOf(raw, this.W, this.H, L.bg, L.bgPct ?? 20), lit = new Float32Array(raw.length);
      for (let j = 0, n = 0; j < this.H; j++) for (let i = 0; i < this.W; i++, n++) lit[n] = raw[n] - bg(i, j);
      if (L.smooth > 0) blur(lit, this.W, this.H, L.smooth, lit);
      return lit;
    });
  }
  /** The same, on the grid asked for. */
  litAt(L, target) {
    const lit = this.lit(L); if (!lit || target === 'full' || this.f === 1) return lit;
    return this.memo('b' + litKey(L), () => shrink(lit, this.W, this.H, this.f).data);
  }
  /**
   * Black and white points of a layer in its own units, [black, white, noise]. Black: the `lo` percentile plus `loS`
   * times the layer's noise. White: the `hi` percentile, but never nearer to black than `hiS` times the noise: where a
   * layer holds nothing but noise (no gas in a patch of empty sky), the noise is not stretched into a picture.
   */
  points(L) {
    return this.memo('P' + keyOf([litKey(L), L.lo, L.hi, L.loS, L.hiS]), () => {
      const lit = this.lit(L), [lo, hi] = percentiles(lit, [L.lo, L.hi]), s = noiseOf(lit, this.W, this.H);
      const black = lo + (L.loS || 0) * s;
      return [black, Math.max(hi, black + (L.hiS || 0) * s, black + 1e-6), s, hi <= black + (L.hiS || 0) * s];
    });
  }
  holesOf(L) { return this.memo('H' + keyOf(L.src), () => layerHoles(L.src, this.full, this.W, this.H)); }

  /**
   * The picture. Returns { W, H, rgb: [R, G, B] (0..1), rects: where each panel lies, layers: per layer what was
   * used (black, white, noise, gaps, cores, floor: the white point was set by the noise, not by light) }, or null
   * while a wavelength it needs has not arrived.
   */
  render(doc, target = 'small') {
    const g = this.grid(target), N = g.W * g.H, on = doc.layers.filter(L => L.on);
    if (!on.length || on.some(L => !this.lit(L))) return null;
    let pts = on.map(L => this.points(L));
    const info = () => on.map((L, i) => { const h = this.holesOf(L); return { id: L.id, black: pts[i][0], white: pts[i][1], noise: pts[i][2], floor: !!this.points(L)[3], gaps: h.gaps, cores: h.cores }; });
    const look = { ...DEFAULT_LOOK, ...(doc.look || {}) }, ref = Math.min(1, on.length - 1);
    const xsFull = () => on.map((L, i) => normInto(this.lit(L), new Float32Array(this.W * this.H), pts[i][0], pts[i][1]));
    const pkey = keyOf(on.map((L, i) => [litKey(L), pts[i][0], pts[i][1]]));
    // how much brighter a typical star is in each layer than in the middle one: worked out once, on the full grid
    const starFactors = () => this.memo('S' + pkey, () => { for (const k of [...this.cache.keys()]) if (k[0] === 'S') this.cache.delete(k); return starBalance(xsFull(), this.W, this.H, 1); });

    if (doc.blend === 'ratio' && doc.layout !== 'panels' && on.length > 1) {
      const bal = starFactors();
      const xs = this.memo('X' + target + pkey, () => {
        for (const k of [...this.cache.keys()]) if (k.startsWith('X' + target)) this.cache.delete(k);
        return on.map((L, i) => { const x = normInto(this.litAt(L, target), new Float32Array(N), pts[i][0], pts[i][1]), f = bal.factors[i]; if (f !== 1 && f > 0) for (let n = 0; n < N; n++) x[n] /= f; return x; });
      });
      const rgb = finish(composeRatio(xs, on, g.W, g.H, { k: doc.stretch?.k ?? 10, depth: doc.stretch?.depth ?? 0.7, blur: doc.stretch?.blur ?? 2.5 }, g.scale), g.W, g.H, look, g.scale);
      return { W: g.W, H: g.H, rgb, rects: [{ id: 'all', x: 0, y: 0, w: g.W, h: g.H }], layers: info().map((o, i) => ({ ...o, star: bal.factors[i] })), scale: g.scale, stars: bal.stars };
    }
    if (doc.balance === 'linked' && on.length > 1) {                    // one black and one white for all: the layers keep their true proportions
      const lo = Math.min(...pts.map(p => p[0])), hi = Math.max(...pts.map(p => p[1])); pts = pts.map(p => [lo, hi, p[2]]);
    } else if (doc.balance === 'stars' && on.length > 1) {              // white points set so that a typical star is equally bright in every layer
      const bal = starFactors(), span = pts[ref][1] - pts[ref][0];
      if (bal.stars >= 12 && span > 0) pts = pts.map((p, i) => [p[0], p[0] + (p[1] - p[0]) * (bal.factors[i] > 0 ? bal.factors[i] : 1), p[2]]);
    }
    const shades = on.map((L, i) => {
      const k = 'T' + target + keyOf([litKey(L), pts[i][0], pts[i][1], L.curve, L.k]);
      return this.memo(k, () => stretchInto(this.litAt(L, target), new Float32Array(N), pts[i][0], pts[i][1], lutOf(L.curve, L.k)));
    });
    // stretched copies are cheap to make again: do not let them pile up while sliders are dragged
    const stretched = [...this.cache.keys()].filter(k => k[0] === 'T'); if (stretched.length > 24) for (const k of stretched.slice(0, stretched.length - 24)) this.cache.delete(k);
    if (doc.layout === 'panels' && on.length > 1) {
      const gap = Math.max(2, Math.round(Math.max(g.W, g.H) / 300)), down = g.W >= g.H, n = on.length;
      const W = down ? g.W : g.W * n + gap * (n - 1), H = down ? g.H * n + gap * (n - 1) : g.H;
      const R = new Float32Array(W * H), G = new Float32Array(W * H), B = new Float32Array(W * H), rects = [];
      on.forEach((L, i) => {
        const one = finish(compose([shades[i]], [L], N, 'add', true), g.W, g.H, look, g.scale);
        const x0 = down ? 0 : i * (g.W + gap), y0 = down ? i * (g.H + gap) : 0;
        for (let j = 0; j < g.H; j++) { const o = (y0 + j) * W + x0; R.set(one[0].subarray(j * g.W, (j + 1) * g.W), o); G.set(one[1].subarray(j * g.W, (j + 1) * g.W), o); B.set(one[2].subarray(j * g.W, (j + 1) * g.W), o); }
        rects.push({ id: L.id, x: x0, y: y0, w: g.W, h: g.H });
      });
      return { W, H, rgb: [R, G, B], rects, layers: info(), scale: g.scale };
    }
    const rgb = finish(compose(shades, on, N, doc.blend === 'screen' ? 'screen' : 'add', on.length === 1), g.W, g.H, look, g.scale);
    return { W: g.W, H: g.H, rgb, rects: [{ id: 'all', x: 0, y: 0, w: g.W, h: g.H }], layers: info(), scale: g.scale };
  }
  bytes(doc, target) { const p = this.render(doc, target); return p && { ...p, rgba: toBytes(p.rgb, p.W * p.H), rgb: undefined }; }
  words(doc) { const p = this.render(doc, 'full'); return p && { ...p, words: toWords(p.rgb, p.W * p.H), rgb: undefined }; }
  /** A layer's brightness count for the Pro panel: 64 bars between the 0.5th and 99.95th percentile of its light. */
  histogram(L) {
    const lit = this.litAt(L, 'small'); if (!lit) return null;
    const [lo, hi] = percentiles(lit, [0.5, 99.95]), bars = new Uint32Array(64), span = hi - lo || 1;
    for (let i = 0; i < lit.length; i++) { const b = Math.floor((lit[i] - lo) / span * 64); if (b >= 0 && b < 64) bars[b]++; }
    const p = this.points(L);
    return { bars, lo, hi, black: p[0], white: p[1] };
  }
}
