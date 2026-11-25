// What the sky holds where the phone is aimed: the brightest stars under their names, well-known clusters, nebulae and
// galaxies, the site's own showcase objects, the Sun, the Moon and the planets, and the constellation any place lies
// in. The list is data/sky.json (made by spike/skylabels_build.py: places from SIMBAD, star names as approved by the
// International Astronomical Union, constellation borders from Roman 1987); the Sun, Moon and planets are worked out
// for the moment (ephem.js). Everything stays on the device.

import { wanderers } from './ephem.js';

const RAD = Math.PI / 180;
let data = null, loading = null;

/** Fetch the list once. Resolves when it is there; rejects when it cannot be had (the map then shows no names). */
export function load() {
  if (data) return Promise.resolve(data);
  loading ||= fetch('data/sky.json').then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
    .then(d => { data = d; return d; }).catch(e => { loading = null; throw e; });
  return loading;
}

const vec = (ra, dec) => { const a = ra * RAD, d = dec * RAD; return [Math.cos(d) * Math.cos(a), Math.cos(d) * Math.sin(a), Math.sin(d)]; };

/** The constellation a place of the sky (degrees, J2000) lies in, by its Latin name; '' before the list has come. */
export function constellation(ra, dec) {
  if (!data) return '';
  const { rows, names, to1875: M } = data.cons, v = vec(ra, dec);
  // the borders were drawn along the coordinates of 1875: turn the place into those first
  const x = M[0][0] * v[0] + M[0][1] * v[1] + M[0][2] * v[2], y = M[1][0] * v[0] + M[1][1] * v[1] + M[1][2] * v[2], z = M[2][0] * v[0] + M[2][1] * v[1] + M[2][2] * v[2];
  const hours = ((Math.atan2(y, x) / RAD + 360) % 360) / 15, d = Math.asin(Math.max(-1, Math.min(1, z))) / RAD;
  for (const [lo, hi, south, k] of rows) if (d >= south && hours >= lo && hours < hi) return names[k];          // the rows run from north to south: the first that fits
  return '';
}

/**
 * Everything that can carry a name, for a moment (ms since 1970) and a place on Earth (for the Moon):
 * [{ name, ra, dec, kind, rank, v, query | target }], `rank` the lower the more worth showing, `v` the unit vector.
 * kind: 'body' (Sun, Moon, planets: named by `say(id)`), 'target' (the site's showcase), 'star', 'deep'.
 */
export function things(ms, lat, lon, targets, say) {
  if (!data) return [];
  const out = [];
  for (const b of wanderers(ms, lat, lon)) out.push({ name: say(b.id), ra: b.ra, dec: b.dec, kind: 'body', rank: b.id === 'sun' || b.id === 'moon' ? -6 : -5 });
  for (const t of targets) out.push({ name: t.label, ra: t.ra, dec: t.dec, kind: 'target', rank: -3, target: t });
  for (const [name, ra, dec, v, query] of data.stars) out.push({ name, ra, dec, kind: 'star', rank: v, query });          // a star's rank is its brightness
  for (const [name, ra, dec, width, query] of data.deep) out.push({ name, ra, dec, kind: 'deep', rank: 1.2, query, width });          // among the stars of the first magnitude
  for (const o of out) o.v = vec(o.ra, o.dec);
  // a showcase object that is also on the list of stars or of clusters (the Pleiades, say) is named once, as the showcase
  return out.filter(o => o.kind === 'target' || o.kind === 'body' || !out.some(t => t.kind === 'target' && t.v[0] * o.v[0] + t.v[1] * o.v[1] + t.v[2] * o.v[2] > 0.99996));          // within half a degree
}

/** The cosine of the angle between a thing and a place of the sky. */
export const cosTo = (thing, ra, dec) => { const c = vec(ra, dec); return thing.v[0] * c[0] + thing.v[1] * c[1] + thing.v[2] * c[2]; };
