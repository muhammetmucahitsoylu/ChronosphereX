// Point the phone at the sky. From the phone's compass and tilt, its place on Earth and the time: the place in the
// sky its back looks at, and how the top of its screen lies there. Everything here is worked out on the device, and
// nothing of it leaves the device.

const RAD = Math.PI / 180, DEG = 180 / Math.PI;
const unit = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const clamp1 = x => Math.max(-1, Math.min(1, x));

/**
 * Where the phone looks. The angles are those of an orientation event that knows true north: alpha about the
 * vertical, beta front to back, gamma left to right (the W3C's turns Z, X', Y''). `turn` is the turn of what the screen
 * shows (screen.orientation.angle): 0 held upright, 90 with the phone's top to the left.
 * Returns two directions as (east, north, up): where the phone's back looks, and where the top of the picture on
 * its screen points.
 */
export function aim(alpha, beta, gamma, turn = 0) {
  const a = alpha * RAD, b = beta * RAD, g = gamma * RAD, s = turn * RAD;
  const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b), cg = Math.cos(g), sg = Math.sin(g), cs = Math.cos(s), ss = Math.sin(s);
  const x = [ca * cg - sa * sb * sg, sa * cg + ca * sb * sg, -cb * sg];          // the phone's right edge
  const y = [-sa * cb, ca * cb, sb];                                               // its top edge
  const z = [ca * sg + sa * sb * cg, sa * sg - ca * sb * cg, cb * cg];            // out of its screen, towards the eye
  return { back: [-z[0], -z[1], -z[2]], top: [cs * y[0] + ss * x[0], cs * y[1] + ss * x[1], cs * y[2] + ss * x[2]] };
}

/** Greenwich mean sidereal time in degrees, at a moment given in milliseconds since 1970. */
export const gmst = ms => { const d = ms / 86400000 - 10957.5; return ((280.46061837 + 360.98564736629 * d) % 360 + 360) % 360; };          // d: days since 2000 January 1, 12 h

/**
 * A direction as (east, north, up), at a place (degrees; north and east positive) and a moment (ms since 1970):
 * its right ascension and declination, its height above the horizon and its compass bearing, all in degrees.
 */
export function toSky(v, lat, lon, ms) {
  const [e, n, u] = unit(v), f = lat * RAD, sf = Math.sin(f), cf = Math.cos(f);
  const dec = Math.asin(clamp1(u * sf + n * cf));
  const hour = Math.atan2(-e, u * cf - n * sf);          // the hour angle: west of the meridian positive
  return { ra: (((gmst(ms) + lon - hour * DEG) % 360) + 360) % 360, dec: dec * DEG, alt: Math.asin(clamp1(u)) * DEG, az: (Math.atan2(e, n) * DEG + 360) % 360 };
}

/** How the equator's frame of 2000 lies in that of a moment (ms since 1970): v(date) = P v(2000), P by rows. The slow turn of the Earth's axis. */
export function precession(ms) {
  const T = (ms / 86400000 - 10957.5) / 36525, sec = RAD / 3600;
  const zeta = (2306.2181 * T + 0.30188 * T * T + 0.017998 * T * T * T) * sec, z = (2306.2181 * T + 1.09468 * T * T + 0.018203 * T * T * T) * sec,
    theta = (2004.3109 * T - 0.42665 * T * T - 0.041833 * T * T * T) * sec;
  const cz = Math.cos(zeta), sz = Math.sin(zeta), cZ = Math.cos(z), sZ = Math.sin(z), ct = Math.cos(theta), st = Math.sin(theta);
  return [cz * ct * cZ - sz * sZ, -sz * ct * cZ - cz * sZ, -st * cZ, cz * ct * sZ + sz * cZ, -sz * ct * sZ + cz * cZ, -st * sZ, cz * st, -sz * st, ct];
}

/**
 * Where the phone looks, in the map's own coordinates (J2000): from the two directions of aim(), the place on Earth
 * and the moment, the right ascension and declination its back points at, the angle `turn` from the sky's north
 * through east to the top of the picture on the screen, and for the reader the height above the horizon and the
 * compass bearing. All in degrees.
 */
export function sight(back, top, lat, lon, ms) {
  const f = lat * RAD, th = (gmst(ms) + lon) * RAD, cf = Math.cos(f), sf = Math.sin(f), ct = Math.cos(th), st = Math.sin(th), P = precession(ms);
  // from (east, north, up) at the place to the equator's frame of the date, then back to that of 2000
  const sky = ([e, n, u]) => {
    const x = -st * e - sf * ct * n + cf * ct * u, y = ct * e - sf * st * n + cf * st * u, z = cf * n + sf * u;
    return [P[0] * x + P[3] * y + P[6] * z, P[1] * x + P[4] * y + P[7] * z, P[2] * x + P[5] * y + P[8] * z];
  };
  const b = unit(back), v = sky(b), t = sky(unit(top)), l = Math.hypot(v[0], v[1]);
  // at the place looked at: east is (pole x v), north is (v x east)
  const east = l < 1e-6 ? [0, 1, 0] : [-v[1] / l, v[0] / l, 0], north = cross(v, east);
  return { ra: (Math.atan2(v[1], v[0]) * DEG + 360) % 360, dec: Math.asin(clamp1(v[2])) * DEG, turn: l < 1e-6 ? 0 : Math.atan2(dot(t, east), dot(t, north)) * DEG,
    alt: Math.asin(clamp1(b[2])) * DEG, az: (Math.atan2(b[0], b[1]) * DEG + 360) % 360 };
}

/** The angle, in degrees, from celestial north through east to the top of the picture on the screen, at the place looked at. */
export function tilt(back, top, lat) {
  const v = unit(back), f = lat * RAD, pole = [0, Math.cos(f), Math.sin(f)];
  const east = cross(pole, v), l = Math.hypot(east[0], east[1], east[2]);
  if (l < 1e-6) return 0;          // looking at the pole itself: no north to turn to
  const eh = [east[0] / l, east[1] / l, east[2] / l], north = cross(v, eh);
  return Math.atan2(dot(top, eh), dot(top, north)) * DEG;
}

/** Can this device tell the page where it looks? (Whether it has a compass at all only shows when it is asked.) */
export const able = () => window.matchMedia('(pointer: coarse)').matches
  && ('ondeviceorientationabsolute' in window || typeof window.DeviceOrientationEvent?.requestPermission === 'function');

/** Where the browser asks before it lets a page read the phone's motion (iPhones), ask: only a press may. */
export async function allow() {
  const ask = window.DeviceOrientationEvent?.requestPermission;
  if (typeof ask !== 'function') return true;
  try { return (await ask.call(window.DeviceOrientationEvent)) === 'granted'; } catch { return false; }
}

/**
 * The phone's place on Earth, to a tenth of a degree (eleven kilometres: far more than the sky needs). Kept on this
 * device, so that the next time starts at once and works without a connection; it is looked up again meanwhile.
 * Resolves to { lat, lon }, or to null where the place is neither known nor allowed.
 */
export function place() {
  const KEY = 'chrono-place';
  let kept = null;
  try { const k = JSON.parse(localStorage.getItem(KEY)); if (k && Number.isFinite(k.lat) && Number.isFinite(k.lon)) kept = k; } catch { /* private mode */ }
  return new Promise(resolve => {
    if (!navigator.geolocation) return resolve(kept);
    if (kept) resolve(kept);
    navigator.geolocation.getCurrentPosition(p => {
      const here = { lat: Math.round(p.coords.latitude * 10) / 10, lon: Math.round(p.coords.longitude * 10) / 10 };
      try { localStorage.setItem(KEY, JSON.stringify(here)); } catch { /* private mode */ }
      resolve(here);
    }, () => resolve(kept), { enableHighAccuracy: false, maximumAge: 6 * 3600e3, timeout: 9000 });
  });
}

/**
 * Follow where the phone looks. `tell(back, top)` gets the two directions of aim(), smoothed, each time the phone
 * reports; `none()` is called once if no compass has answered after three seconds. Returns the function that stops it.
 * A phone's compass knows magnetic north, not the true one: `east` is how far east of true north the needle points
 * at this place, in degrees (magnet.js), and is taken out here.
 */
export function watch(tell, none, east = 0) {
  let back = null, top = null, sure = false, heard = false;
  const take = (alpha, beta, gamma) => {
    if (alpha == null || beta == null || gamma == null) return;
    heard = true;
    const now = aim(alpha - east, beta, gamma, window.screen?.orientation?.angle ?? window.orientation ?? 0);          // alpha counts anticlockwise: a needle east of north makes it too large
    // A compass shivers: each reading moves the direction a fifth of the way, which calms it within a tenth of a second.
    back = back ? unit(back.map((x, i) => x + 0.2 * (now.back[i] - x))) : now.back;
    top = top ? unit(top.map((x, i) => x + 0.2 * (now.top[i] - x))) : now.top;
    tell(back, top);
  };
  // Android: the event fixed to the Earth (to magnetic north). iPhones: the plain event, with the compass bearing beside it.
  const onTrue = e => { sure = true; take(e.alpha, e.beta, e.gamma); };
  const onPlain = e => {
    if (sure) return;
    if (e.webkitCompassHeading != null) take(360 - e.webkitCompassHeading, e.beta, e.gamma);
    else if (e.absolute) take(e.alpha, e.beta, e.gamma);
  };
  window.addEventListener('deviceorientationabsolute', onTrue);
  window.addEventListener('deviceorientation', onPlain);
  const wait = setTimeout(() => { if (!heard) none?.(); }, 3000);
  return () => { clearTimeout(wait); window.removeEventListener('deviceorientationabsolute', onTrue); window.removeEventListener('deviceorientation', onPlain); };
}
