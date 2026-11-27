// The picture studio's data: wavelengths of a frame read straight from NASA's public copy of the SPHEREx all-sky
// cube (the same files the IRSA archive serves, on Amazon's open-data store, which answers several times faster).
//
// Each order-5 tile is one FITS file of 102 planes, 512 x 512 values of 4 bytes each (big-endian, MJy/sr), the
// planes one after another from byte 8640. Only the rows a frame needs of the planes asked for are fetched.
import { TILE, TILE_PX, makeMap, resample, bytesPerPlane } from './geom.js';

export const SOURCES = [
  'https://nasa-irsa-spherex.s3.amazonaws.com/dr1/hips5_cube/hips_20261026',
  'https://irsa.ipac.caltech.edu/data/hips/SPHEREx/spherex_allsky_cube',              // the archive itself, if Amazon's copy does not answer
];
const DATA0 = 8640, PLANE_BYTES = TILE_PX * 4, ROW_BYTES = TILE * 4;
const tileUrl = (base, pix) => `${base}/Norder5/Dir${Math.floor(pix / 10000) * 10000}/Npix${pix}_cube.fits`;
const nap = (ms, signal) => new Promise((ok, no) => { const t = setTimeout(ok, ms); signal?.addEventListener('abort', () => { clearTimeout(t); no(signal.reason); }, { once: true }); });

/** Rows r0..r1 of one plane of one tile, as bytes. Tries again on a failure, then the second source. */
async function rows(pix, z, r0, r1, { signal, fetcher = fetch, sources = SOURCES } = {}) {
  const from = DATA0 + z * PLANE_BYTES + r0 * ROW_BYTES, to = DATA0 + z * PLANE_BYTES + (r1 + 1) * ROW_BYTES - 1, want = to - from + 1;
  let last = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const base = sources[attempt < 3 ? 0 : Math.min(1, sources.length - 1)];
    try {
      const r = await fetcher(tileUrl(base, pix), { headers: { Range: `bytes=${from}-${to}` }, signal });
      if (r.status !== 206) throw new Error(`answer ${r.status}`);
      const buf = await r.arrayBuffer();
      if (buf.byteLength !== want) throw new Error(`short answer: ${buf.byteLength} of ${want}`);
      return buf;
    } catch (e) {
      if (signal?.aborted) throw e;
      last = e; await nap(400 * (attempt + 1) ** 2, signal);
    }
  }
  throw new Error(`tile ${pix}, plane ${z}: ${last?.message || last}`);
}

/** Big-endian 4-byte floats into the machine's own order, written into `out` from `at`. */
function intoFloats(buf, out, at) {
  const src = new Uint8Array(buf), n = src.length >> 2, dst = new Uint8Array(out.buffer, out.byteOffset + at * 4, n * 4);
  for (let i = 0, k = 0; i < n; i++, k += 4) { dst[k] = src[k + 3]; dst[k + 1] = src[k + 2]; dst[k + 2] = src[k + 1]; dst[k + 3] = src[k]; }
}

/**
 * Reads wavelengths of a frame. `planes`: plane numbers; `onPlane(z, values, done, total)` is called as each plane is
 * laid on the frame (values: Float32Array W x H, NaN where the cube has no value); `onBytes(got, all)` as data arrives.
 * At most `lanes` requests run at once. Returns the map used (for its size and tiles).
 */
export async function readFrame(frame, planes, { onPlane, onBytes, signal, lanes = 6, fetcher, sources, map } = {}) {
  map ??= makeMap(frame);
  const S = map.tiles.length, per = bytesPerPlane(map), all = per * planes.length;
  let got = 0, done = 0;
  for (const z of planes) {
    const atlas = new Float32Array(S * TILE_PX).fill(NaN);
    let next = 0;
    const lane = async () => {
      while (next < S) {
        const s = next++, r0 = map.rows[2 * s], r1 = map.rows[2 * s + 1];
        if (r1 < r0) continue;
        const buf = await rows(map.tiles[s], z, r0, r1, { signal, fetcher, sources });
        intoFloats(buf, atlas, s * TILE_PX + r0 * TILE);
        got += buf.byteLength; onBytes?.(got, all);
      }
    };
    await Promise.all(Array.from({ length: Math.min(lanes, S) }, lane));
    if (signal?.aborted) throw signal.reason;
    const values = resample(map, atlas);
    done++; await onPlane?.(z, values, done, planes.length);
  }
  return map;
}

/** What a frame costs before anything is fetched: tiles, bytes per wavelength, pixels. Quick (a coarse table). */
export function cost(frame) {
  const step = Math.max(1, Math.round(Math.min(frame.W, frame.H) / 160)), m = makeMap(frame, step);
  // a coarse table can miss a row or two at a tile's edge: allow for it
  let rows = 0; for (let s = 0; s < m.tiles.length; s++) rows += Math.min(TILE, m.rows[2 * s + 1] - m.rows[2 * s] + 1 + 2 * step);
  return { tiles: m.tiles.length, bytesPerPlane: rows * TILE * 4, W: frame.W, H: frame.H };
}
