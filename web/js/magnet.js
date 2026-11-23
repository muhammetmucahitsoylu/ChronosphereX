// The compass needle does not point at the pole: it follows the Earth's magnetic field, which is off true north by an
// angle that depends on the place (about 6 degrees east in Turkey, 12 west in New York, more near the poles). A
// phone's compass reports magnetic north; the sky turns about the true one. This is the angle between the two, from
// the World Magnetic Model 2025 of NOAA and the British Geological Survey (public domain; made for 2025 to 2030,
// and drifting only slowly after that). Worked out on the device.

const RAD = Math.PI / 180;
const EPOCH = 2025.0;
// For every degree n = 1..12 and order m = 0..n, in that order: g, h (nanotesla) and their change per year.
const COEF = [-29351.8,0,12,0,-1410.8,4545.4,9.7,-21.5,-2556.6,0,-11.6,0,2951.1,-3133.6,-5.2,-27.7,1649.3,-815.1,-8,-12.1,1361,0,-1.3,0,-2404.1,-56.6,-4.2,4,1243.8,237.5,0.4,-0.3,453.6,-549.5,-15.6,-4.1,895,0,-1.6,0,799.5,278.6,-2.4,-1.1,55.7,-133.9,-6,4.1,-281.1,212,5.6,1.6,12.1,-375.6,-7,-4.4,-233.2,0,0.6,0,368.9,45.4,1.4,-0.5,187.2,220.2,0,2.2,-138.7,-122.9,0.6,0.4,-142,43,2.2,1.7,20.9,106.1,0.9,1.9,64.4,0,-0.2,0,63.8,-18.4,-0.4,0.3,76.9,16.8,0.9,-1.6,-115.7,48.8,1.2,-0.4,-40.9,-59.8,-0.9,0.9,14.9,10.9,0.3,0.7,-60.7,72.7,0.9,0.9,79.5,0,-0,0,-77,-48.9,-0.1,0.6,-8.8,-14.4,-0.1,0.5,59.3,-1,0.5,-0.8,15.8,23.4,-0.1,0,2.5,-7.4,-0.8,-1,-11.1,-25.1,-0.8,0.6,14.2,-2.3,0.8,-0.2,23.2,0,-0.1,0,10.8,7.1,0.2,-0.2,-17.5,-12.6,0,0.5,2,11.4,0.5,-0.4,-21.7,-9.7,-0.1,0.4,16.9,12.7,0.3,-0.5,15,0.7,0.2,-0.6,-16.8,-5.2,-0,0.3,0.9,3.9,0.2,0.2,4.6,0,-0,0,7.8,-24.8,-0.1,-0.3,3,12.2,0.1,0.3,-0.2,8.3,0.3,-0.3,-2.5,-3.3,-0.3,0.3,-13.1,-5.2,0,0.2,2.4,7.2,0.3,-0.1,8.6,-0.6,-0.1,-0.2,-8.7,0.8,0.1,0.4,-12.9,10,-0.1,0.1,-1.3,0,0.1,0,-6.4,3.3,0,0,0.2,0,0.1,-0,2,2.4,0.1,-0.2,-1,5.3,-0,0.1,-0.6,-9.1,-0.3,-0.1,-0.9,0.4,0,0.1,1.5,-4.2,-0.1,0,0.9,-3.8,-0.1,-0.1,-2.7,0.9,-0,0.2,-3.9,-9.1,-0,-0,2.9,0,0,0,-1.5,0,-0,-0,-2.5,2.9,0,0.1,2.4,-0.6,0,-0,-0.6,0.2,0,0.1,-0.1,0.5,-0.1,-0,-0.6,-0.3,0,-0,-0.1,-1.2,-0,0.1,1.1,-1.7,-0.1,-0,-1,-2.9,-0.1,0,-0.2,-1.8,-0.1,0,2.6,-2.3,-0.1,0,-2,0,0,0,-0.2,-1.3,0,-0,0.3,0.7,-0,0,1.2,1,-0,-0.1,-1.3,-1.4,-0,0.1,0.6,-0,-0,-0,0.6,0.6,0.1,-0,0.5,-0.1,-0,-0,-0.1,0.8,0,0,-0.4,0.1,0,-0,-0.2,-1,-0.1,-0,-1.3,0.1,-0,0,-0.7,0.2,-0.1,-0.1];

/**
 * How far east of true north a compass needle points, in degrees (negative: west), at a place given in degrees
 * (north and east positive) and a moment given as a year with its fraction.
 */
export function declination(lat, lon, year) {
  const dt = year - EPOCH, N = 12;
  // from the place on the (flattened) Earth to its distance from the centre and its angle seen from there
  const A = 6378.137, F = 1 / 298.257223563, E2 = F * (2 - F), f = Math.max(-89.999, Math.min(89.999, lat)) * RAD;
  const rc = A / Math.sqrt(1 - E2 * Math.sin(f) ** 2), p = rc * Math.cos(f), z = rc * (1 - E2) * Math.sin(f), r = Math.hypot(p, z);
  const fc = Math.asin(z / r), mu = Math.sin(fc), cosfc = Math.cos(fc);
  // Schmidt semi-normalised associated Legendre functions up to degree N + 1
  const P = [];
  for (let m = 0; m <= N + 1; m++) {
    let pmm = 1; for (let k = 1; k <= m; k++) pmm *= (2 * k - 1) * cosfc;
    let prev = 0, cur = pmm;
    for (let n = m; n <= N + 1; n++) {
      if (n > m) { const next = ((2 * n - 1) * mu * cur - (n + m - 1) * prev) / (n - m); prev = cur; cur = next; }
      let norm = 1;
      if (m > 0) { let ratio = 1; for (let k = n - m + 1; k <= n + m; k++) ratio /= k; norm = Math.sqrt(2 * ratio); }
      (P[n] ||= [])[m] = cur * norm;
    }
  }
  let X = 0, Y = 0, Z = 0, at = 0;
  for (let n = 1; n <= N; n++) {
    const pull = (6371.2 / r) ** (n + 2);
    for (let m = 0; m <= n; m++, at += 4) {
      const g = COEF[at] + dt * COEF[at + 2], h = COEF[at + 1] + dt * COEF[at + 3];
      const cm = Math.cos(m * lon * RAD), sm = Math.sin(m * lon * RAD);
      const dP = (n + 1) * Math.tan(fc) * P[n][m] - Math.sqrt((n + 1) ** 2 - m * m) / cosfc * P[n + 1][m];
      X -= pull * (g * cm + h * sm) * dP;
      Y += pull * m * (g * sm - h * cm) * P[n][m] / cosfc;
      Z -= (n + 1) * pull * (g * cm + h * sm) * P[n][m];
    }
  }
  const turn = fc - f;          // back from the centre's view to the ground's: north there is not quite north here
  return Math.atan2(Y, X * Math.cos(turn) - Z * Math.sin(turn)) / RAD;
}
