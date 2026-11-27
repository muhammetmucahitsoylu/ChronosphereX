// The picture studio's darkroom: from wavelengths of a frame (values in MJy/sr) to a colour picture.
// Plain arithmetic on arrays, no page and no network: the same code runs in the page's worker and in Node (tests).
//
// A picture is made of layers. A layer takes its light from the cube in one of two ways:
//   band: the mean of some wavelengths (each with its own sky level taken off first)
//   line: some wavelengths minus what their neighbours predict there (a gas or dust feature alone)
// then loses its background, is stretched between a black and a white point along a curve, and is given a colour.
// The layers are added up; brightness, contrast, colour strength and sharpness are then set for the whole picture.
import { WAVES } from './geom.js';

// ---------------------------------------------------------------------------------------------------- small tools
/** Values at the given percentiles (0..100), from a sample of the finite values. */
export function percentiles(a, ps, max = 200000) {
  const step = Math.max(1, Math.floor(a.length / max)), s = new Float32Array(Math.ceil(a.length / step));
  let n = 0;
  for (let i = 0; i < a.length; i += step) { const v = a[i]; if (v === v) s[n++] = v; }
  if (!n) return ps.map(() => 0);
  const t = s.subarray(0, n); t.sort();
  return ps.map(p => { const x = Math.min(n - 1, Math.max(0, p / 100 * (n - 1))), i = Math.floor(x), f = x - i; return i + 1 < n ? t[i] * (1 - f) + t[i + 1] * f : t[i]; });
}

/** The scatter of the fine detail (noise) of a picture: 1.48 x the median absolute difference between neighbours / sqrt 2. */
export function noiseOf(a, W, H) {
  const step = Math.max(1, Math.floor(Math.sqrt(W * H / 60000))), d = [];
  for (let j = 0; j < H; j += step) for (let i = 0; i + 1 < W; i += step) { const v = a[j * W + i] - a[j * W + i + 1]; if (v === v) d.push(Math.abs(v)); }
  if (!d.length) return 0;
  d.sort((x, y) => x - y);
  return 1.4826 * d[d.length >> 1] / Math.SQRT2;
}

/** A blur close to a Gaussian of the given sigma (pixels): three passes of a running mean, rows then columns. */
export function blur(src, W, H, sigma, out = new Float32Array(W * H)) {
  if (!(sigma > 0.05)) { if (out !== src) out.set(src); return out; }
  // widths of three running means whose result has the wanted spread
  const wi = Math.sqrt(12 * sigma * sigma / 3 + 1); let wl = Math.floor(wi); if (wl % 2 === 0) wl--;
  const m = Math.round((12 * sigma * sigma - 3 * wl * wl - 12 * wl - 9) / (-4 * wl - 4));
  const sizes = [0, 1, 2].map(i => (i < m ? wl : wl + 2));
  let a = Float32Array.from(src), b = new Float32Array(W * H);
  const line = new Float32Array(Math.max(W, H));
  for (const size of sizes) {
    const r = (size - 1) >> 1; if (r < 1) continue;
    for (let j = 0; j < H; j++) {                                        // along the rows
      const o = j * W; let acc = 0;
      for (let i = -r; i <= r; i++) acc += a[o + Math.min(W - 1, Math.max(0, i))];
      for (let i = 0; i < W; i++) { line[i] = acc / size; acc += a[o + Math.min(W - 1, i + r + 1)] - a[o + Math.max(0, i - r)]; }
      for (let i = 0; i < W; i++) b[o + i] = line[i];
    }
    for (let i = 0; i < W; i++) {                                        // along the columns
      let acc = 0;
      for (let j = -r; j <= r; j++) acc += b[Math.min(H - 1, Math.max(0, j)) * W + i];
      for (let j = 0; j < H; j++) { line[j] = acc / size; acc += b[Math.min(H - 1, j + r + 1) * W + i] - b[Math.max(0, j - r) * W + i]; }
      for (let j = 0; j < H; j++) a[j * W + i] = line[j];
    }
  }
  out.set(a); return out;
}

/** A picture made smaller by a whole factor: each new pixel the mean of the measured ones it covers (NaN if under a third are). */
export function shrink(src, W, H, f) {
  if (f <= 1) return { data: src, W, H };
  const w = Math.floor(W / f), h = Math.floor(H / f), out = new Float32Array(w * h), need = f * f / 3;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    let s = 0, n = 0;
    for (let y = 0; y < f; y++) { const o = (j * f + y) * W + i * f; for (let x = 0; x < f; x++) { const v = src[o + x]; if (v === v) { s += v; n++; } } }
    out[j * w + i] = n >= need ? s / n : NaN;
  }
  return { data: out, W: w, H: h };
}
/** The same for a mask of small whole numbers: the largest value under each new pixel. */
export function shrinkMask(src, W, H, f) {
  if (f <= 1) return src;
  const w = Math.floor(W / f), h = Math.floor(H / f), out = new Uint8Array(w * h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    let m = 0;
    for (let y = 0; y < f; y++) { const o = (j * f + y) * W + i * f; for (let x = 0; x < f; x++) if (src[o + x] > m) m = src[o + x]; }
    out[j * w + i] = m;
  }
  return out;
}

// ------------------------------------------------------------------------------------------------- holes and gaps
/**
 * Fills every pixel without a value from the measured ones around it, smoothly however wide the gap: the picture is
 * averaged down level by level until nothing is missing, then brought back up, each level filling only what the finer
 * one lacked. In place.
 */
export function fillSmooth(a, W, H) {
  let any = false; for (let i = 0; i < a.length; i++) if (a[i] !== a[i]) { any = true; break; }
  if (!any) return a;
  const levels = [{ v: a, W, H }];
  for (let cur = levels[0]; ;) {
    const w = Math.max(1, Math.ceil(cur.W / 2)), h = Math.max(1, Math.ceil(cur.H / 2)), v = new Float32Array(w * h); let missing = false;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      let s = 0, n = 0;
      for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) {
        const yy = 2 * j + y, xx = 2 * i + x; if (yy >= cur.H || xx >= cur.W) continue;
        const q = cur.v[yy * cur.W + xx]; if (q === q) { s += q; n++; }
      }
      if (n) v[j * w + i] = s / n; else { v[j * w + i] = NaN; missing = true; }
    }
    cur = { v, W: w, H: h }; levels.push(cur);
    if (!missing || (w === 1 && h === 1)) break;
  }
  const top = levels[levels.length - 1]; for (let i = 0; i < top.v.length; i++) if (top.v[i] !== top.v[i]) top.v[i] = 0;
  for (let l = levels.length - 2; l >= 0; l--) {
    const fine = levels[l], coarse = levels[l + 1];
    for (let j = 0; j < fine.H; j++) for (let i = 0; i < fine.W; i++) {
      const k = j * fine.W + i; if (fine.v[k] === fine.v[k]) continue;
      // between the four coarse pixels around this place
      const x = (i - 0.5) / 2, y = (j - 0.5) / 2, x0 = Math.max(0, Math.min(coarse.W - 1, Math.floor(x))), y0 = Math.max(0, Math.min(coarse.H - 1, Math.floor(y)));
      const x1 = Math.min(coarse.W - 1, x0 + 1), y1 = Math.min(coarse.H - 1, y0 + 1), fx = Math.max(0, Math.min(1, x - x0)), fy = Math.max(0, Math.min(1, y - y0));
      fine.v[k] = (coarse.v[y0 * coarse.W + x0] * (1 - fx) + coarse.v[y0 * coarse.W + x1] * fx) * (1 - fy) + (coarse.v[y1 * coarse.W + x0] * (1 - fx) + coarse.v[y1 * coarse.W + x1] * fx) * fy;
    }
  }
  return a;
}

/**
 * A wavelength as it arrives has two kinds of holes: the cores of bright stars (the detector overflowed there) and
 * strips the survey has not covered yet. A hole whose rim is bright is a star's core: it takes the largest value
 * around it, grown inwards, so the star stays bright. Any other hole is left without a value, for the other
 * wavelengths of the layer to cover. Returns a mask: 1 = star core filled here, 2 = no value. In place.
 */
export function mendPlane(a, W, H) {
  const N = W * H, mask = new Uint8Array(N); let holes = 0;
  for (let i = 0; i < N; i++) if (a[i] !== a[i]) { mask[i] = 2; holes++; }
  if (!holes) return { mask, cores: 0, gaps: 0 };
  const [bright] = percentiles(a, [99]);
  const label = new Int32Array(N), stack = new Int32Array(N); let cores = 0, gaps = 0, id = 0;
  for (let s = 0; s < N; s++) {
    if (mask[s] !== 2 || label[s]) continue;
    id++; let top = 0, size = 0; stack[top++] = s; label[s] = id; const members = [], rim = [];
    let touchesEdge = false;
    while (top) {
      const p = stack[--top], x = p % W, y = (p / W) | 0; members.push(p); size++;
      if (x === 0 || y === 0 || x === W - 1 || y === H - 1) touchesEdge = true;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue; const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
        const q = yy * W + xx;
        if (mask[q] === 2) { if (!label[q]) { label[q] = id; stack[top++] = q; } } else if (rim.length < 4000) rim.push(a[q]);
      }
    }
    rim.sort((u, v) => u - v);
    const rimMid = rim.length ? rim[rim.length >> 1] : -Infinity;
    // a star's core: the light around it is among the field's brightest hundredth, and the hole is not a strip running off the frame
    const core = rim.length > 0 && rimMid >= bright && !(touchesEdge && size > 2000);
    if (!core) { gaps += size; continue; }
    cores += size;
    // grow the largest neighbouring value inwards, ring by ring
    let todo = members;
    for (let round = 0; todo.length && round < 400; round++) {
      const vals = new Float32Array(todo.length), rest = [];
      for (let k = 0; k < todo.length; k++) {
        const p = todo[k], x = p % W, y = (p / W) | 0; let m = -Infinity;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
          const v = a[yy * W + xx]; if (v === v && v > m) m = v;
        }
        vals[k] = m;
      }
      for (let k = 0; k < todo.length; k++) { if (vals[k] > -Infinity) { a[todo[k]] = vals[k]; mask[todo[k]] = 1; } else rest.push(todo[k]); }
      if (rest.length === todo.length) break;
      todo = rest;
    }
  }
  return { mask, cores, gaps };
}

/**
 * Takes away what is smaller than a few pixels and brighter or darker than its surroundings, keeps everything wider:
 * the smallest value within `r` pixels, then the largest of those (an "opening"), then the same the other way round. A star leaves a small blot where one
 * wavelength is taken from another (its image is not quite the same in both); clouds of gas and dust are wide and
 * stay as they are. In place.
 */
export function opening(a, W, H, r = 1) {
  if (!(r >= 1)) return a;
  r = Math.round(r);
  const pass = (src, dst, pick) => {
    const tmp = new Float32Array(W * H);
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {          // along the rows
      let m = src[j * W + i];
      for (let d = 1; d <= r; d++) { if (i - d >= 0) m = pick(m, src[j * W + i - d]); if (i + d < W) m = pick(m, src[j * W + i + d]); }
      tmp[j * W + i] = m;
    }
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {          // along the columns
      let m = tmp[j * W + i];
      for (let d = 1; d <= r; d++) { if (j - d >= 0) m = pick(m, tmp[(j - d) * W + i]); if (j + d < H) m = pick(m, tmp[(j + d) * W + i]); }
      dst[j * W + i] = m;
    }
  };
  const low = new Float32Array(W * H);
  pass(a, low, Math.min); pass(low, a, Math.max);          // bright specks go
  pass(a, low, Math.max); pass(low, a, Math.min);          // then dark ones (a star that is fainter in the feature than its neighbours predict)
  return a;
}

// ----------------------------------------------------------------------------------------------------- the layers
/** Planes a layer's source needs. */
export function planesOf(src) {
  if (src.kind === 'line') return [...new Set([...src.on, ...src.off.map(o => o[0])])];
  return [...src.planes];
}

/**
 * The light of a layer before any stretching (MJy/sr above its own background), NaN-free.
 * planes: Map z -> { data: Float32Array, mask: Uint8Array } on one grid of W x H.
 * A band is the mean of its wavelengths, each with its sky level (5th percentile) taken off, over those that have a
 * value at a pixel. A line is the mean of the `on` wavelengths minus the weighted `off` ones; where any of them is a
 * mended star core or has no value the result is unknown and is filled from around, so that stars leave no blots.
 * `clean`: radius in pixels of the opening that removes what stars leave behind (0 = none).
 */
export function layerLight(src, planes, W, H, clean = 0) {
  const N = W * H, out = new Float32Array(N);
  if (src.kind === 'line') {
    const on = src.on.map(z => planes.get(z)), off = src.off.map(([z, w]) => [planes.get(z), w]);
    if (on.some(p => !p) || off.some(([p]) => !p)) return null;
    const sky = p => percentiles(p.data, [20])[0], onSky = on.map(sky), offSky = off.map(([p]) => sky(p));
    for (let i = 0; i < N; i++) {
      let bad = false, s = 0;
      for (let k = 0; k < on.length; k++) { if (on[k].mask[i]) { bad = true; break; } s += on[k].data[i] - onSky[k]; }
      if (!bad) { s /= on.length; for (let k = 0; k < off.length; k++) { if (off[k][0].mask[i]) { bad = true; break; } s -= off[k][1] * (off[k][0].data[i] - offSky[k]); } }
      out[i] = bad ? NaN : s;
    }
    fillSmooth(out, W, H);
    if (clean >= 1) opening(out, W, H, clean);
    return out;
  }
  const ps = src.planes.map(z => planes.get(z)); if (ps.some(p => !p)) return null;
  const sky = ps.map(p => percentiles(p.data, [5])[0]);
  for (let i = 0; i < N; i++) {
    let s = 0, n = 0;
    for (let k = 0; k < ps.length; k++) { const v = ps[k].data[i]; if (v === v) { s += v - sky[k]; n++; } }
    out[i] = n ? s / n : NaN;
  }
  fillSmooth(out, W, H);
  if (clean >= 1) opening(out, W, H, clean);
  return out;
}

/** Share of a layer's pixels that no wavelength of it measured (survey gaps), 0..1; and of mended star cores. */
export function layerHoles(src, planes, W, H) {
  const N = W * H, zs = planesOf(src).map(z => planes.get(z)); if (zs.some(p => !p)) return { gaps: 0, cores: 0 };
  let gaps = 0, cores = 0;
  for (let i = 0; i < N; i++) {
    if (src.kind === 'line') { let g = false, c = false; for (const p of zs) { if (p.mask[i] === 2) g = true; else if (p.mask[i] === 1) c = true; } if (g) gaps++; else if (c) cores++; }
    else { let all = true, c = false; for (const p of zs) { if (p.mask[i] !== 2) all = false; if (p.mask[i] === 1) c = true; } if (all) gaps++; else if (c) cores++; }
  }
  return { gaps: gaps / N, cores: cores / N };
}

/**
 * The background of a layer. 'level': one number, the given percentile. 'slope': a tilted plane through the dark
 * parts (the zodiacal light changes across a wide frame): the frame is cut into blocks, each block's low value is
 * taken, and a plane is fitted to the blocks that are not lit by nebulae (the brighter half is left out, twice).
 * Returns a function (i, j) -> background.
 */
export function backgroundOf(a, W, H, mode = 'level', pct = 20) {
  if (mode === 'none') return () => 0;
  if (mode !== 'slope') { const [b] = percentiles(a, [pct]); return () => b; }
  const nx = Math.max(4, Math.min(16, Math.round(W / 60))), ny = Math.max(4, Math.min(16, Math.round(H / 60))), pts = [];
  for (let by = 0; by < ny; by++) for (let bx = 0; bx < nx; bx++) {
    const x0 = Math.floor(bx * W / nx), x1 = Math.floor((bx + 1) * W / nx), y0 = Math.floor(by * H / ny), y1 = Math.floor((by + 1) * H / ny), v = [];
    const step = Math.max(1, Math.floor(Math.sqrt((x1 - x0) * (y1 - y0) / 900)));
    for (let j = y0; j < y1; j += step) for (let i = x0; i < x1; i += step) { const q = a[j * W + i]; if (q === q) v.push(q); }
    if (v.length < 8) continue; v.sort((p, q) => p - q);
    pts.push([(x0 + x1) / 2, (y0 + y1) / 2, v[Math.floor(v.length * pct / 100)]]);
  }
  let use = pts, fit = null;
  for (let round = 0; round < 3 && use.length >= 6; round++) {
    // least squares for z = c0 + c1 x + c2 y
    let n = 0, sx = 0, sy = 0, sz = 0, sxx = 0, sxy = 0, syy = 0, sxz = 0, syz = 0;
    for (const [x, y, z] of use) { n++; sx += x; sy += y; sz += z; sxx += x * x; sxy += x * y; syy += y * y; sxz += x * z; syz += y * z; }
    const A = [[n, sx, sy], [sx, sxx, sxy], [sy, sxy, syy]], B = [sz, sxz, syz];
    const det = m => m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
    const d = det(A); if (!d) break;
    const c = [0, 1, 2].map(k => det(A.map((row, r) => row.map((q, col) => (col === k ? B[r] : q)))) / d);
    fit = c;
    const res = use.map(([x, y, z]) => z - (c[0] + c[1] * x + c[2] * y)).sort((p, q) => p - q), cut = res[Math.floor(res.length * 0.6)];
    use = use.filter(([x, y, z]) => z - (c[0] + c[1] * x + c[2] * y) <= cut);
  }
  if (!fit) { const [b] = percentiles(a, [pct]); return () => b; }
  return (i, j) => fit[0] + fit[1] * i + fit[2] * j;
}

// ------------------------------------------------------------------------------------------------------ stretching
export const CURVES = ['asinh', 'log', 'sqrt', 'linear', 'gamma'];
/** The curve that turns a value between black (0) and white (1) into a shade. `k` is the strength (how far the faint parts are lifted). */
export function curve(name, k) {
  switch (name) {
    case 'linear': return x => x;
    case 'sqrt': return x => Math.sqrt(x);
    case 'log': { const d = Math.log1p(Math.max(1e-6, k)); return x => Math.log1p(k * x) / d; }
    case 'gamma': { const g = 1 / Math.max(0.05, k); return x => Math.pow(x, g); }
    default: { const d = Math.asinh(Math.max(1e-6, k)); return x => Math.asinh(k * x) / d; }
  }
}
const LUT_N = 4096;
/** A table of the curve at 4097 places between black and white. */
export function lutOf(name, k) {
  const f = curve(name, k), t = new Float32Array(LUT_N + 1);
  for (let i = 0; i <= LUT_N; i++) t[i] = f(i / LUT_N);
  return t;
}
/** value -> shade 0..1, through black point, white point and the curve's table; in between two table entries, a straight line. */
export function stretchInto(src, out, black, white, lut, bg, W) {
  const span = white - black || 1, N = src.length;
  for (let n = 0; n < N; n++) {
    let x = (src[n] - (bg ? bg(n % W, (n / W) | 0) : 0) - black) / span;
    if (!(x > 0)) { out[n] = 0; continue; }
    if (x >= 1) { out[n] = 1; continue; }
    x *= LUT_N; const i = x | 0, f = x - i;
    out[n] = lut[i] + (lut[i + 1] - lut[i]) * f;
  }
  return out;
}

/** A layer's light between its black point (0) and its white point (1), nothing clipped. */
export function normInto(src, out, black, white) {
  const span = white - black || 1;
  for (let n = 0; n < src.length; n++) out[n] = (src[n] - black) / span;
  return out;
}

/** Local peaks far above their surroundings and not overflowing: the stars a colour balance is taken from. Returns pixel indices. */
export function findStars(a, W, H, scale = 1) {
  const bg = blur(a, W, H, 12 / scale), hi = new Float32Array(W * H);
  for (let i = 0; i < hi.length; i++) hi[i] = a[i] - bg[i];
  const noise = noiseOf(hi, W, H) || 1e-9, [cap] = percentiles(a, [99.95]), out = [];
  for (let j = 2; j < H - 2; j++) for (let i = 2; i < W - 2; i++) {
    const k = j * W + i, v = a[k]; if (hi[k] < 8 * noise || v >= cap) continue;
    let peak = true;
    for (let dy = -2; dy <= 2 && peak; dy++) for (let dx = -2; dx <= 2; dx++) if (a[k + dy * W + dx] > v) { peak = false; break; }
    if (peak) out.push(k);
  }
  return out;
}

// -------------------------------------------------------------------------------------------------- putting together
export const DEFAULT_LOOK = { bright: 0, contrast: 0, sat: 1, black: 0, gamma: 1, scnr: 0, chroma: 0, soften: 0, sharpen: 0, sharpenR: 1.5, local: 0 };

/**
 * Shades of the layers into one colour picture. `shades`: per layer a Float32Array 0..1; `layers`: per layer colour
 * [r, g, b] 0..1, `gain` and `on`; `blend`: 'add' or 'screen'. A layer alone, or `whiten`, lets its brightest parts
 * turn white as a bright star does on film. Returns three arrays (r, g, b), values 0..1.
 */
export function compose(shades, layers, N, blend = 'add', whiten = false) {
  const R = new Float32Array(N), G = new Float32Array(N), B = new Float32Array(N);
  if (blend === 'screen') { R.fill(1); G.fill(1); B.fill(1); }
  for (let l = 0; l < layers.length; l++) {
    const L = layers[l], s = shades[l]; if (!L.on || !s) continue;
    const g = L.gain ?? 1, cr = L.color[0] * g, cg = L.color[1] * g, cb = L.color[2] * g;
    if (whiten) {
      for (let i = 0; i < N; i++) { const v = s[i], w = v * v * v * v; R[i] += v * cr + w * (1 - L.color[0]); G[i] += v * cg + w * (1 - L.color[1]); B[i] += v * cb + w * (1 - L.color[2]); }
    } else if (blend === 'screen') {
      for (let i = 0; i < N; i++) { const v = s[i]; R[i] *= 1 - Math.min(1, v * cr); G[i] *= 1 - Math.min(1, v * cg); B[i] *= 1 - Math.min(1, v * cb); }
    } else {
      for (let i = 0; i < N; i++) { const v = s[i]; R[i] += v * cr; G[i] += v * cg; B[i] += v * cb; }
    }
  }
  if (blend === 'screen' && !whiten) for (let i = 0; i < N; i++) { R[i] = 1 - R[i]; G[i] = 1 - G[i]; B[i] = 1 - B[i]; }
  return [R, G, B];
}

/**
 * The whole picture's look, applied to r, g, b in place. `scale`: how many native pixels one pixel of this picture
 * stands for (a preview is smaller), so that blurs and sharpening look the same in the preview and in the export.
 *   chroma   blur of the colour alone (pixels): calms colour speckle in the dark sky without softening detail
 *   soften   blur of the brightness (pixels)
 *   sharpen  unsharp mask, amount 0..2 at radius sharpenR;  local: the same at a wide radius (local contrast)
 *   black    black point lift (-) or cut (+), gamma: midtones, bright: brightness in stops, contrast: -1..1
 *   sat      colour strength (1 = as composed), scnr: how much green above the mean of red and blue is taken away
 */
export function finish(rgb, W, H, look, scale = 1) {
  const [R, G, B] = rgb, N = W * H, k = { ...DEFAULT_LOOK, ...look };
  const lum = new Float32Array(N);
  const setLum = () => { for (let i = 0; i < N; i++) lum[i] = (R[i] + G[i] + B[i]) / 3; };
  if (k.chroma > 0 || k.soften > 0 || k.sharpen > 0 || k.local > 0) {
    setLum();
    if (k.chroma > 0) {                                                   // colour = channel minus brightness, blurred; brightness untouched
      const tmp = new Float32Array(N);
      for (const C of [R, G, B]) { for (let i = 0; i < N; i++) tmp[i] = C[i] - lum[i]; blur(tmp, W, H, k.chroma / scale, tmp); for (let i = 0; i < N; i++) C[i] = lum[i] + tmp[i]; }
    }
    if (k.soften > 0 || k.sharpen > 0 || k.local > 0) {
      const L2 = Float32Array.from(lum);
      if (k.soften > 0) blur(L2, W, H, k.soften / scale, L2);
      if (k.sharpen > 0) { const b = blur(L2, W, H, Math.max(0.4, k.sharpenR / scale)); for (let i = 0; i < N; i++) L2[i] += k.sharpen * (L2[i] - b[i]); }
      if (k.local > 0) { const b = blur(L2, W, H, Math.max(2, 40 / scale)); for (let i = 0; i < N; i++) L2[i] += k.local * 0.6 * (L2[i] - b[i]); }
      for (let i = 0; i < N; i++) { const d = L2[i] - lum[i]; R[i] += d; G[i] += d; B[i] += d; }
    }
  }
  const gain = Math.pow(2, k.bright), g = 1 / Math.max(0.1, k.gamma), c = k.contrast, black = k.black, sat = k.sat, scnr = k.scnr;
  for (let i = 0; i < N; i++) {
    let r = R[i], gg = G[i], b = B[i];
    if (scnr > 0) { const m = (r + b) / 2; if (gg > m) gg = gg - scnr * (gg - m); }
    if (sat !== 1) { const l = (r + gg + b) / 3; r = l + sat * (r - l); gg = l + sat * (gg - l); b = l + sat * (b - l); }
    r = (r - black) / (1 - black) * gain; gg = (gg - black) / (1 - black) * gain; b = (b - black) / (1 - black) * gain;
    r = r > 0 ? (r < 1 ? r : 1) : 0; gg = gg > 0 ? (gg < 1 ? gg : 1) : 0; b = b > 0 ? (b < 1 ? b : 1) : 0;
    if (g !== 1) { r = Math.pow(r, g); gg = Math.pow(gg, g); b = Math.pow(b, g); }
    if (c !== 0) {                                                        // an S for more contrast, its mirror for less; black and white stay put
      r += c * (r * r * (3 - 2 * r) - r); gg += c * (gg * gg * (3 - 2 * gg) - gg); b += c * (b * b * (3 - 2 * b) - b);
    }
    R[i] = r; G[i] = gg; B[i] = b;
  }
  return rgb;
}

/**
 * How much brighter the stars are in each layer than in the reference layer (the middle one): the median, over the
 * stars found in the reference, of the layers' fine detail there. Dividing each layer by its number makes a typical
 * star white, so that only light unlike starlight (dust, gas, reddening) is coloured.
 */
export function starBalance(xs, W, H, scale = 1) {
  const ref = xs[Math.min(1, xs.length - 1)], stars = findStars(ref, W, H, scale);
  if (stars.length < 12) return { factors: xs.map(() => 1), stars: stars.length };
  const fine = x => { const a = blur(x, W, H, 2.5 / scale), b = blur(x, W, H, 12 / scale); for (let i = 0; i < a.length; i++) a[i] -= b[i]; return a; };
  const fr = fine(ref);
  const factors = xs.map(x => {
    if (x === ref) return 1;
    const f = fine(x), r = [];
    for (const k of stars) if (fr[k] > 0 && f[k] > 0) r.push(f[k] / fr[k]);
    if (r.length < 12) return 1; r.sort((u, v) => u - v);
    return r[r.length >> 1];
  });
  return { factors, stars: stars.length };
}

/**
 * The colour picture that keeps the proportions between the layers (the way the Orion picture sent to APOD was made,
 * and close to the "Lupton" pictures of the big sky surveys): brightness comes from all layers together and is
 * stretched once; colour comes from each layer's share of that brightness, smoothed a little and faded out towards
 * the dark sky, so that the background stays neutral instead of speckled.
 * xs: per layer its light between black (0) and white (1), not clipped. opts: k (strength of the stretch),
 * depth (how strongly shares become colour, 0..1.5), blur (pixels of the frame's own grid).
 */
export function composeRatio(xs, layers, W, H, opts = {}, scale = 1) {
  const N = W * H, k = opts.k ?? 10, depth = opts.depth ?? 0.7, sigma = (opts.blur ?? 2.5) / scale, n = xs.length;
  const L = new Float32Array(N);
  for (let l = 0; l < n; l++) { const x = xs[l], g = (layers[l].gain ?? 1) / n; for (let i = 0; i < N; i++) L[i] += x[i] * g; }
  const [top] = percentiles(L, [99.9]), d = Math.asinh(k), Ls = new Float32Array(N);
  for (let i = 0; i < N; i++) { const v = L[i] > 0 ? L[i] / (top || 1) : 0; const s = Math.asinh(k * v) / d; Ls[i] = s < 1 ? s : 1; }
  const Lb = blur(L, W, H, sigma); for (let i = 0; i < N; i++) Lb[i] += 1e-3;
  const R = new Float32Array(N), G = new Float32Array(N), B = new Float32Array(N);
  let sr = 0, sg = 0, sb = 0; for (const Y of layers) { sr += Y.color[0]; sg += Y.color[1]; sb += Y.color[2]; }
  sr = sr || 1; sg = sg || 1; sb = sb || 1;
  for (let l = 0; l < n; l++) {
    const xb = blur(xs[l], W, H, sigma), c = layers[l].color, g = layers[l].gain ?? 1, cr = c[0] / sr, cg = c[1] / sg, cb = c[2] / sb;
    for (let i = 0; i < N; i++) {
      let r = xb[i] * g / Lb[i]; r = r > 0 ? (r < 3 ? r : 3) : 0;
      const ls = Ls[i], fade = ls < 0.25 ? ls / 0.25 : 1, m = 1 + depth * fade * (1 - 0.45 * ls) * (r - 1);
      R[i] += cr * m; G[i] += cg * m; B[i] += cb * m;
    }
  }
  for (let i = 0; i < N; i++) {
    let r = Ls[i] * R[i], g = Ls[i] * G[i], b = Ls[i] * B[i];
    r = r > 0 ? r : 0; g = g > 0 ? g : 0; b = b > 0 ? b : 0;
    const over = Math.max(r, g, b, 1); R[i] = r / over; G[i] = g / over; B[i] = b / over;
  }
  return [R, G, B];
}

/** r, g, b (0..1) as bytes for a canvas (RGBA). */
export function toBytes(rgb, N, out = new Uint8ClampedArray(4 * N)) {
  const [R, G, B] = rgb;
  for (let i = 0, k = 0; i < N; i++, k += 4) { out[k] = R[i] * 255 + 0.5; out[k + 1] = G[i] * 255 + 0.5; out[k + 2] = B[i] * 255 + 0.5; out[k + 3] = 255; }
  return out;
}
/** r, g, b (0..1) as 16-bit numbers, interleaved. */
export function toWords(rgb, N, out = new Uint16Array(3 * N)) {
  const [R, G, B] = rgb;
  for (let i = 0, k = 0; i < N; i++, k += 3) { out[k] = Math.round(R[i] * 65535); out[k + 1] = Math.round(G[i] * 65535); out[k + 2] = Math.round(B[i] * 65535); }
  return out;
}

/** How a layer is named by its light: "1.20 µm", "3.0–5.0 µm", "4.04 µm line". Numbers only: words come from the page. */
export function wavesOf(src) {
  const f = z => WAVES[z];
  if (src.kind === 'line') return { line: src.on.map(f), lo: Math.min(...src.on.map(f)), hi: Math.max(...src.on.map(f)) };
  const w = src.planes.map(f); return { lo: Math.min(...w), hi: Math.max(...w) };
}
