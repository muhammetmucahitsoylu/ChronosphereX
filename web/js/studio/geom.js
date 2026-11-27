// The picture studio's geometry: which pixels of NASA's SPHEREx all-sky cube make up a frame of sky.
//
// The cube is a HEALPix map (nested scheme) cut into tiles of 512 x 512 pixels at order 5, so its pixels are those
// of order 14: 12.88 arcseconds each. A frame is a flat picture (tangent plane) centred on a place, north up unless
// turned. For every pixel of the frame this module finds the four cube pixels around it and their weights; the same
// table then serves every wavelength.
//
// Checked against the Python tools that made the pictures sent to APOD (astropy + astropy-healpix): spike/studio.

const D2R = Math.PI / 180;
export const ORDER = 14, NSIDE = 1 << ORDER, TILE = 512, TILE_PX = TILE * TILE;
export const NATIVE = Math.sqrt(4 * Math.PI / (12 * NSIDE * NSIDE)) / D2R * 3600;      // arcsec a pixel: 12.883
export const BLANK = new Set([50, 51]);                                                 // dichroic channels, empty in the cube
export const WAVES = [0.753, 0.771, 0.790, 0.809, 0.828, 0.848, 0.868, 0.889, 0.910, 0.932, 0.955, 0.978, 1.001, 1.025, 1.050, 1.075, 1.102, 1.113, 1.139, 1.167, 1.195, 1.224, 1.254, 1.284, 1.315, 1.346, 1.378, 1.412, 1.446, 1.481, 1.517, 1.554, 1.592, 1.631, 1.656, 1.695, 1.735, 1.775, 1.818, 1.861, 1.905, 1.949, 1.995, 2.041, 2.089, 2.139, 2.189, 2.240, 2.292, 2.345, 2.399, 2.445, 2.506, 2.575, 2.646, 2.719, 2.794, 2.871, 2.951, 3.033, 3.118, 3.204, 3.293, 3.383, 3.476, 3.570, 3.667, 3.768, 3.833, 3.867, 3.901, 3.935, 3.970, 4.005, 4.040, 4.076, 4.112, 4.148, 4.184, 4.220, 4.257, 4.294, 4.331, 4.368, 4.405, 4.435, 4.467, 4.500, 4.533, 4.566, 4.600, 4.635, 4.669, 4.704, 4.739, 4.773, 4.808, 4.843, 4.879, 4.915, 4.951, 4.988];

const SPREAD5 = new Int32Array(32);
for (let v = 0; v < 32; v++) { let r = 0; for (let i = 0; i < 5; i++) r |= ((v >> i) & 1) << (2 * i); SPREAD5[v] = r; }

/**
 * A direction as a place on one of HEALPix's twelve base faces: [face, x, y], x and y running 0..NSIDE, the centre
 * of pixel (ix, iy) at (ix + 0.5, iy + 0.5). The same arithmetic as ang2pix, kept before the rounding.
 */
export function faceXY(raDeg, decDeg, out = [0, 0, 0]) {
  const z = Math.sin(decDeg * D2R), za = Math.abs(z);
  const tt = (((raDeg / 90) % 4) + 4) % 4;
  if (za <= 2 / 3) {
    const t1 = NSIDE * (0.5 + tt), t2 = NSIDE * z * 0.75;
    const a = t1 - t2, b = t1 + t2, ifp = Math.floor(a / NSIDE), ifm = Math.floor(b / NSIDE);
    out[0] = ifp === ifm ? (ifp & 3) + 4 : ifp < ifm ? (ifp & 3) : (ifm & 3) + 8;
    out[1] = b - ifm * NSIDE; out[2] = NSIDE - (a - ifp * NSIDE);
  } else {
    const ntt = Math.min(3, Math.floor(tt)), tp = tt - ntt;
    // near a pole 1 - |z| loses digits; cos^2(dec) / (1 + |z|) is the same number, kept exact
    const c = Math.cos(decDeg * D2R), tmp = NSIDE * Math.sqrt(3 * c * c / (1 + za));
    const p = Math.min(NSIDE, tp * tmp), m = Math.min(NSIDE, (1 - tp) * tmp);
    if (z >= 0) { out[0] = ntt; out[1] = NSIDE - m; out[2] = NSIDE - p; }
    else { out[0] = ntt + 8; out[1] = p; out[2] = m; }
  }
  return out;
}

/** The order-5 tile that holds pixel (ix, iy) of a face, and where the pixel sits in the tile's 512 x 512 array:
 *  row 511 - (ix mod 512), column iy mod 512 (the rule every one of 180 tiles' own headers gave). */
const tileOf = (face, ix, iy) => face * 1024 + SPREAD5[ix >> 9] + 2 * SPREAD5[iy >> 9];

/**
 * A frame: centre (degrees, ICRS), width and height on the sky (degrees), pixel size (arcsec), and the angle by
 * which the picture is turned: the direction that points up, measured from north towards east.
 */
export function makeFrame({ ra, dec, w, h, scale = NATIVE, rot = 0 }) {
  const W = Math.max(8, Math.round(w * 3600 / scale)), H = Math.max(8, Math.round(h * 3600 / scale));
  return { ra: ((ra % 360) + 360) % 360, dec: Math.max(-90, Math.min(90, dec)), w, h, scale, rot: rot || 0, W, H };
}

/** Sky position (degrees) of a pixel of the frame; pixel centres at whole numbers, (0, 0) top left. */
export function pixToSky(f, i, j, out = [0, 0]) {
  const s = f.scale / 3600 * D2R, cr = Math.cos(f.rot * D2R), sr = Math.sin(f.rot * D2R);
  const u = ((f.W - 1) / 2 - i) * s, v = ((f.H - 1) / 2 - j) * s;      // to the left and up, in radians on the tangent plane
  const xi = u * cr + v * sr, eta = -u * sr + v * cr;                   // east and north
  const d0 = f.dec * D2R, rho = Math.hypot(xi, eta);
  if (rho === 0) { out[0] = f.ra; out[1] = f.dec; return out; }
  const c = Math.atan(rho), sc = Math.sin(c), cc = Math.cos(c);
  out[1] = Math.asin(Math.max(-1, Math.min(1, cc * Math.sin(d0) + eta * sc * Math.cos(d0) / rho))) / D2R;
  out[0] = (f.ra + Math.atan2(xi * sc, rho * Math.cos(d0) * cc - eta * Math.sin(d0) * sc) / D2R + 360) % 360;
  return out;
}

/** Where a sky position falls in the frame (pixels, may lie outside); null behind the tangent plane. */
export function skyToPix(f, raDeg, decDeg) {
  const d0 = f.dec * D2R, d = decDeg * D2R, da = (raDeg - f.ra) * D2R;
  const cosc = Math.sin(d0) * Math.sin(d) + Math.cos(d0) * Math.cos(d) * Math.cos(da);
  if (cosc <= 0) return null;
  const xi = Math.cos(d) * Math.sin(da) / cosc, eta = (Math.cos(d0) * Math.sin(d) - Math.sin(d0) * Math.cos(d) * Math.cos(da)) / cosc;
  const s = f.scale / 3600 * D2R, cr = Math.cos(f.rot * D2R), sr = Math.sin(f.rot * D2R);
  const u = xi * cr - eta * sr, v = xi * sr + eta * cr;
  return [(f.W - 1) / 2 - u / s, (f.H - 1) / 2 - v / s];
}

/** The angle that puts galactic north up at a place: the direction of the galactic pole there, from north towards east. */
export function galacticUp(raDeg, decDeg) {
  const ap = 192.85948 * D2R, dp = 27.12825 * D2R, a = raDeg * D2R, d = decDeg * D2R;
  return Math.atan2(Math.cos(dp) * Math.sin(ap - a), Math.sin(dp) * Math.cos(d) - Math.cos(dp) * Math.sin(d) * Math.cos(ap - a)) / D2R;
}

/**
 * The table that turns cube pixels into the frame. `step` > 1 samples every step-th pixel only (for a quick count
 * of what a frame will cost). Returns
 *   tiles: order-5 tile numbers the frame touches, ascending; a pixel's tile is told by its slot in this list
 *   addr:  for each frame pixel four addresses, slot * 262144 + place in the tile's array
 *   fx, fy: the weights along the face's two axes (0..1)
 *   rows:  per slot, the first and last array row that is needed (so only those are fetched)
 */
export function makeMap(f, step = 1) {
  const W = Math.ceil(f.W / step), H = Math.ceil(f.H / step), N = W * H;
  const rawTile = new Int32Array(4 * N), rawIdx = new Int32Array(4 * N), fx = new Float32Array(N), fy = new Float32Array(N);
  const sky = [0, 0], q = [0, 0, 0], seen = new Map();
  let n = 0;
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++, n++) {
    pixToSky(f, Math.min(f.W - 1, i * step), Math.min(f.H - 1, j * step), sky);
    faceXY(sky[0], sky[1], q);
    const face = q[0], u = q[1] - 0.5, v = q[2] - 0.5;
    let i0 = Math.floor(u), j0 = Math.floor(v), a = u - i0, b = v - j0;
    // at the rim of a base face the neighbour belongs to another face: the nearest pixel of this face stands in (a line one pixel wide)
    let i1 = i0 + 1, j1 = j0 + 1;
    if (i0 < 0) { i0 = 0; a = 0; } if (i1 > NSIDE - 1) { i1 = NSIDE - 1; if (i0 > i1) i0 = i1; a = i0 === i1 ? 0 : a; }
    if (j0 < 0) { j0 = 0; b = 0; } if (j1 > NSIDE - 1) { j1 = NSIDE - 1; if (j0 > j1) j0 = j1; b = j0 === j1 ? 0 : b; }
    fx[n] = a; fy[n] = b;
    const k = 4 * n;
    for (let c = 0; c < 4; c++) {
      const ix = c & 1 ? i1 : i0, iy = c & 2 ? j1 : j0, t = tileOf(face, ix, iy);
      rawTile[k + c] = t; rawIdx[k + c] = (511 - (ix & 511)) * TILE + (iy & 511);
      if (!seen.has(t)) seen.set(t, 0);
    }
  }
  const tiles = Int32Array.from([...seen.keys()].sort((x, y) => x - y)), slotOf = new Map();
  tiles.forEach((t, s) => slotOf.set(t, s));
  const rows = new Int32Array(2 * tiles.length); for (let s = 0; s < tiles.length; s++) { rows[2 * s] = TILE; rows[2 * s + 1] = -1; }
  const addr = rawTile;                                                    // rewritten in place: tile number -> address
  let lastT = -1, lastS = 0;
  for (let k = 0; k < 4 * N; k++) {
    const t = rawTile[k]; if (t !== lastT) { lastT = t; lastS = slotOf.get(t); }
    const idx = rawIdx[k], row = idx >> 9;
    if (row < rows[2 * lastS]) rows[2 * lastS] = row; if (row > rows[2 * lastS + 1]) rows[2 * lastS + 1] = row;
    addr[k] = lastS * TILE_PX + idx;
  }
  return { W, H, tiles, addr, fx, fy, rows };
}

/** Bytes one wavelength of a frame takes to fetch, given the rows needed of each tile. */
export function bytesPerPlane(map) {
  let rows = 0;
  for (let s = 0; s < map.tiles.length; s++) rows += map.rows[2 * s + 1] - map.rows[2 * s] + 1;
  return rows * TILE * 4;
}

/**
 * One wavelength laid on the frame. `atlas` holds the tiles' arrays one after another in slot order (NaN where not
 * fetched). A frame pixel is the weighted mean of the cube pixels around it that have a value; with less than half
 * the weight measured it has none (NaN), as in the Python tool.
 */
export function resample(map, atlas, out = new Float32Array(map.W * map.H)) {
  const { addr, fx, fy } = map, N = map.W * map.H;
  for (let n = 0, k = 0; n < N; n++, k += 4) {
    const a = fx[n], b = fy[n];
    const w0 = (1 - a) * (1 - b), w1 = a * (1 - b), w2 = (1 - a) * b, w3 = a * b;
    const v0 = atlas[addr[k]], v1 = atlas[addr[k + 1]], v2 = atlas[addr[k + 2]], v3 = atlas[addr[k + 3]];
    let s = 0, ws = 0;
    if (v0 === v0) { s += w0 * v0; ws += w0; } if (v1 === v1) { s += w1 * v1; ws += w1; }
    if (v2 === v2) { s += w2 * v2; ws += w2; } if (v3 === v3) { s += w3 * v3; ws += w3; }
    out[n] = ws > 0.5 ? s / ws : NaN;
  }
  return out;
}

/** The plane (0..101) whose central wavelength is nearest to a wavelength in microns, blank ones passed over. */
export function planeNear(um) {
  let best = 0, d = Infinity;
  for (let z = 0; z < WAVES.length; z++) { if (BLANK.has(z)) continue; const e = Math.abs(WAVES[z] - um); if (e < d) { d = e; best = z; } }
  return best;
}
/** Planes whose wavelength lies in a range, blank ones left out. */
export const planesIn = (lo, hi) => WAVES.map((w, z) => z).filter(z => !BLANK.has(z) && WAVES[z] >= lo - 1e-9 && WAVES[z] <= hi + 1e-9);
