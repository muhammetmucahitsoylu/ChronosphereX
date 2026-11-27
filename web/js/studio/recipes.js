// The picture studio's ready-made pictures: which wavelengths, which colours.
//
// Plane numbers count SPHEREx's 102 colours from 0 (0.75 µm) to 101 (4.99 µm); see WAVES in geom.js.
// Colours of the 'gas' picture follow the habit of infrared pictures from Spitzer and WISE (stars blue, dust red);
// its two features are the ones NASA's own "Dust and Gas" all-sky map shows: dust molecules near 3.3 µm and hot
// hydrogen near 4.05 µm (https://spherex.caltech.edu/image/spherex20251218c-spherex-all-sky-map-2025-dust-and-gas).
// The 'stars' picture uses the three wavelengths of NASA's "Stars and Galaxies" map: 0.83, 1.7 and 4.8 µm.
import { planeNear, BLANK, WAVES } from './geom.js';

/** A feature minus its neighbours: the neighbours weighted so that together they stand at the feature's own
 *  wavelength (a straight line through them), which is what makes a plain star cancel out. */
export function lineSrc(on, off) {
  const um = z => WAVES[z], at = on.reduce((s, z) => s + um(z), 0) / on.length;
  const lo = off.filter(z => um(z) < at), hi = off.filter(z => um(z) > at);
  if (!lo.length || !hi.length) return { kind: 'line', on, off: off.map(z => [z, +(1 / off.length).toFixed(4)]) };
  const a = lo.reduce((s, z) => s + um(z), 0) / lo.length, b = hi.reduce((s, z) => s + um(z), 0) / hi.length, wLo = (b - at) / (b - a);
  return { kind: 'line', on, off: [...lo.map(z => [z, +(wLo / lo.length).toFixed(4)]), ...hi.map(z => [z, +((1 - wLo) / hi.length).toFixed(4)])] };
}
const layer = (id, src, color, more = {}) => ({ id, src, color, gain: 1, on: true, bg: 'level', bgPct: 20, lo: 50, loS: 0, hi: 99.8, hiS: 0, curve: 'asinh', k: 8, smooth: 0, ...more });
/** `n` planes around a wavelength (n odd): the nearest one and its neighbours on both sides, blank ones passed over. */
export function around(um, n = 1) {
  const z0 = planeNear(um), out = [z0];
  for (let d = 1; out.length < n && d < 12; d++) for (const z of [z0 - d, z0 + d]) if (z >= 0 && z < WAVES.length && !BLANK.has(z) && out.length < n) out.push(z);
  return out.sort((a, b) => a - b);
}

/** quality: 1 = one wavelength a colour (quick), 2 = three (less noise, gaps of one covered by the others), 3 = five. */
const N_OF = { 1: 1, 2: 3, 3: 5 };

export const RECIPES = {
  // what the sky looks like in infrared: short waves blue, long waves red; stars come out near white, dust glows red,
  // clouds that block the short waves show as dark, reddened patches
  stars: q => ({
    layout: 'one', blend: 'ratio', balance: 'own', stretch: { k: 10, depth: 0.7, blur: 2.5 },
    layers: [
      layer('long', { kind: 'band', planes: around(4.8, N_OF[q]) }, [1, 0, 0], { lo: 50 }),
      layer('mid', { kind: 'band', planes: around(1.7, N_OF[q]) }, [0, 1, 0], { lo: 50 }),
      layer('short', { kind: 'band', planes: around(0.83, N_OF[q]) }, [0, 0, 1], { lo: 50 }),
    ],
    look: {},
  }),
  // glowing gas and dust picked out of the starlight: each is one wavelength minus what its neighbours predict
  gas: q => ({
    layout: 'one', blend: 'add', balance: 'own',
    layers: [
      // the dust feature near 3.3 µm, like hydrogen's line below, is shared between two of SPHEREx's colours differently
      // from strip to strip of the survey: the two together show no stripes (tried on the Pleiades and the Lagoon)
      layer('dust', lineSrc([62, 63], [60, 65]), [1, 0.22, 0.05], { lo: 50, loS: 6, hi: 99.8, hiS: 120, k: 8, smooth: 0.6 }),
      // hydrogen's line (4.052 µm) falls between two of SPHEREx's colours, and how its light is shared between them changes
      // from one strip of the survey to the next: one colour alone shows stripes, the two together do not (tried on Orion)
      layer('hydrogen', lineSrc([74, 75], [72, 77]), [0.10, 1, 0.35], { lo: 50, loS: 6, hi: 99.8, hiS: 120, k: 8, smooth: 0.6 }),
      layer('starlight', { kind: 'band', planes: around(1.2, q >= 2 ? 3 : 1) }, [0.22, 0.42, 1], { lo: 50, loS: 1.5, hi: 99.9, hiS: 40, k: 12 }),
    ],
    look: { sat: 1.1 },
  }),
  // the picture NASA's APOD showed on 25 November 2026: the same patch at three wavelengths, one above the other;
  // the longer the wave, the more of the dust it passes through
  dust: q => ({
    layout: 'panels', blend: 'add', balance: 'own',
    layers: [
      layer('p1', { kind: 'band', planes: around(1.2, N_OF[q]) }, [0.43, 0.88, 1], { lo: 3, hi: 99.8 }),
      layer('p2', { kind: 'band', planes: q === 1 ? around(3.1, 1) : [53, 58, 62, 66] }, [1, 0.66, 0.31], { lo: 3, hi: 99.8 }),
      layer('p3', { kind: 'band', planes: q === 1 ? around(4.74, 1) : [86, 94, 101] }, [0.92, 0.25, 0.33], { lo: 3, hi: 99.8 }),
    ],
    look: {},
  }),
};

/** Features of gas, dust and ice that SPHEREx's colours can pick out; `on`/`off` as plane numbers. For the Pro panel. */
export const LINES = [
  { id: 'pah', um: 3.29, on: [62, 63], off: [60, 65] },             // dust molecules (PAH)
  { id: 'bra', um: 4.05, on: [74, 75], off: [72, 77] },         // hydrogen, Brackett alpha
  { id: 'paa', um: 1.875, on: [39, 40], off: [37, 42] },        // hydrogen, Paschen alpha
  { id: 'he', um: 1.083, on: [15, 16], off: [13, 19] },         // helium
];
