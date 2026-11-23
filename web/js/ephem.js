// Where the Sun, the Moon and the five planets seen without a telescope are in the sky right now, good to a small
// fraction of a degree: enough to put a name on the map while a phone is held up to the sky. Worked out on the
// device; nothing is asked of any service. Places are right ascension and declination in degrees, J2000.
//
// The planets and the Sun: the orbits' mean elements and their rates per century from E. M. Standish, "Keplerian
// Elements for Approximate Positions of the Major Planets" (JPL Solar System Dynamics), valid from 1800 to 2050,
// good to a few arcminutes. The Moon: the low-precision series of the Astronomical Almanac (0.3 degrees), then
// seen from the phone's place on Earth instead of from the Earth's centre (up to a degree of difference).

const RAD = Math.PI / 180, DEG = 180 / Math.PI;
const TILT = 23.43928 * RAD;          // of the Earth's axis to the plane of its orbit, in 2000
const wrap = x => ((x % 360) + 360) % 360;

// semi-major axis (au), eccentricity, inclination, mean longitude, longitude of perihelion, of the ascending node (degrees); below each, the change per century
const ORBITS = {
  mercury: [0.38709927, 0.20563593, 7.00497902, 252.25032350, 77.45779628, 48.33076593, 0.00000037, 0.00001906, -0.00594749, 149472.67411175, 0.16047689, -0.12534081],
  venus: [0.72333566, 0.00677672, 3.39467605, 181.97909950, 131.60246718, 76.67984255, 0.00000390, -0.00004107, -0.00078890, 58517.81538729, 0.00268329, -0.27769418],
  earth: [1.00000261, 0.01671123, -0.00001531, 100.46457166, 102.93768193, 0.0, 0.00000562, -0.00004392, -0.01294668, 35999.37244981, 0.32327364, 0.0],
  mars: [1.52371034, 0.09339410, 1.84969142, -4.55343205, -23.94362959, 49.55953891, 0.00001847, 0.00007882, -0.00813131, 19140.30268499, 0.44441088, -0.29257343],
  jupiter: [5.20288700, 0.04838624, 1.30439695, 34.39644051, 14.72847983, 100.47390909, -0.00011607, -0.00013253, -0.00183714, 3034.74612775, 0.21252668, 0.20469106],
  saturn: [9.53667594, 0.05386179, 2.48599187, 49.95424423, 92.59887831, 113.66242448, -0.00125060, -0.00050991, 0.00193609, 1222.49362201, -0.41897216, -0.28867794],
};

/** Centuries since 2000 January 1, 12 h, for a moment in milliseconds since 1970. */
const centuries = ms => (ms / 86400000 - 10957.5) / 36525;

/** A body's place around the Sun, in the plane of the Earth's orbit of 2000 (au). */
function around(name, T) {
  const o = ORBITS[name], at = k => o[k] + o[k + 6] * T;
  const a = at(0), e = at(1), I = at(2) * RAD, L = at(3), peri = at(4), node = at(5);
  const w = (peri - node) * RAD, N = node * RAD;
  let M = wrap(L - peri); if (M > 180) M -= 360; M *= RAD;
  let E = M + e * Math.sin(M);
  for (let k = 0; k < 8; k++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));          // Kepler's equation
  const x = a * (Math.cos(E) - e), y = a * Math.sqrt(1 - e * e) * Math.sin(E);
  const cw = Math.cos(w), sw = Math.sin(w), cN = Math.cos(N), sN = Math.sin(N), cI = Math.cos(I), sI = Math.sin(I);
  return [(cw * cN - sw * sN * cI) * x + (-sw * cN - cw * sN * cI) * y, (cw * sN + sw * cN * cI) * x + (-sw * sN + cw * cN * cI) * y, sw * sI * x + cw * sI * y];
}
/** From the plane of the Earth's orbit to right ascension and declination. */
function toEquator([x, y, z]) {
  const ye = y * Math.cos(TILT) - z * Math.sin(TILT), ze = y * Math.sin(TILT) + z * Math.cos(TILT);
  return { ra: wrap(Math.atan2(ye, x) * DEG), dec: Math.atan2(ze, Math.hypot(x, ye)) * DEG, far: Math.hypot(x, y, z) };
}

/** The Sun or a planet ('sun', 'mercury', 'venus', 'mars', 'jupiter', 'saturn') as seen from the Earth. `far` is its distance in au. */
export function planet(name, ms) {
  const T = centuries(ms), home = around('earth', T);
  if (name === 'sun') return toEquator(home.map(v => -v));
  const p = around(name, T);
  return toEquator(p.map((v, i) => v - home[i]));
}

/**
 * The Moon as seen from a place on Earth (degrees, north and east positive; without a place, from the Earth's centre).
 * `lit` is the lit part of its disc, 0 to 1.
 */
export function moon(ms, lat = null, lon = null) {
  const T = centuries(ms), s = x => Math.sin(x * RAD), c = x => Math.cos(x * RAD);
  // longitude and latitude along the Earth's orbit, of the date, and the parallax that gives the distance
  let lam = 218.32 + 481267.881 * T + 6.29 * s(135.0 + 477198.87 * T) - 1.27 * s(259.3 - 413335.36 * T) + 0.66 * s(235.7 + 890534.22 * T)
    + 0.21 * s(269.9 + 954397.74 * T) - 0.19 * s(357.5 + 35999.05 * T) - 0.11 * s(186.5 + 966404.03 * T);
  const bet = 5.13 * s(93.3 + 483202.02 * T) + 0.28 * s(228.2 + 960400.89 * T) - 0.28 * s(318.3 + 6003.15 * T) - 0.17 * s(217.6 - 407332.21 * T);
  const par = 0.9508 + 0.0518 * c(135.0 + 477198.87 * T) + 0.0095 * c(259.3 - 413335.36 * T) + 0.0078 * c(235.7 + 890534.22 * T) + 0.0028 * c(269.9 + 954397.74 * T);
  lam -= 1.396971 * T;          // from the equinox of the date back to that of 2000: the precession along the orbit's plane
  const r = 1 / Math.sin(par * RAD);          // in Earth radii
  const v = [r * c(bet) * c(lam), r * c(bet) * s(lam), r * s(bet)];
  let x = v[0], y = v[1] * Math.cos(TILT) - v[2] * Math.sin(TILT), z = v[1] * Math.sin(TILT) + v[2] * Math.cos(TILT);
  if (lat !== null && lon !== null) {          // step from the Earth's centre to the place on its surface
    const turn = (280.46061837 + 360.98564736629 * (ms / 86400000 - 10957.5) + lon) * RAD;          // the local sidereal time
    x -= Math.cos(lat * RAD) * Math.cos(turn); y -= Math.cos(lat * RAD) * Math.sin(turn); z -= Math.sin(lat * RAD);
  }
  const sun = planet('sun', ms), ra = wrap(Math.atan2(y, x) * DEG), dec = Math.atan2(z, Math.hypot(x, y)) * DEG;
  const apart = Math.acos(Math.max(-1, Math.min(1, s(dec) * s(sun.dec) + c(dec) * c(sun.dec) * c(ra - sun.ra))));          // the angle between Moon and Sun in the sky
  return { ra, dec, lit: (1 - Math.cos(apart)) / 2 };
}

/** All seven, for the labels: [{ id, ra, dec }], the Sun first. */
export const wanderers = (ms, lat = null, lon = null) => [
  ...['sun', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'].map(id => ({ id, ...planet(id, ms) })),
  { id: 'moon', ...moon(ms, lat, lon) },
];
