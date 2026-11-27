// A picture's view: quarter turns clockwise, then a mirror (left to right), then a crop given as shares of the turned
// picture (27 Nov 2026, the user: "even a simple crop button is missing"). One description for the screen, the marks,
// every kind of file and the FITS coordinates. Kept in doc.view; a link carries it.

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/** The view of a picture's description, made whole and safe: { turn 0..3, flip, crop: { x, y, w, h } }. */
export function viewOf(doc) {
  const v = doc?.view || {}, c = v.crop || {};
  const x = clamp(+c.x || 0, 0, 0.98), y = clamp(+c.y || 0, 0, 0.98);
  return { turn: (((v.turn | 0) % 4) + 4) % 4, flip: !!v.flip,
    crop: { x, y, w: clamp(c.w == null ? 1 : +c.w, 0.02, 1 - x), h: clamp(c.h == null ? 1 : +c.h, 0.02, 1 - y) } };
}
export const whole = () => ({ turn: 0, flip: false, crop: { x: 0, y: 0, w: 1, h: 1 } });
/** Nothing turned, mirrored or cut. */
export const plain = v => !v.turn && !v.flip && v.crop.x <= 1e-6 && v.crop.y <= 1e-6 && v.crop.w >= 1 - 1e-6 && v.crop.h >= 1 - 1e-6;
/** The size of the picture once turned. */
export const turned = (v, W, H) => (v.turn % 2 ? [H, W] : [W, H]);
/** The crop in pixels of the turned picture (OW × OH): { OW, OH, x, y, w, h }. */
export function cropBox(v, W, H) {
  const [OW, OH] = turned(v, W, H);
  const x = Math.round(v.crop.x * OW), y = Math.round(v.crop.y * OH);
  return { OW, OH, x, y, w: Math.max(1, Math.min(OW - x, Math.round(v.crop.w * OW))), h: Math.max(1, Math.min(OH - y, Math.round(v.crop.h * OH))) };
}
/** The size of what is shown and saved. */
export const outSize = (v, W, H) => { const b = cropBox(v, W, H); return [b.w, b.h]; };

/** Draws src (W × H) on ctx, turned, mirrored and cropped (or whole: turned and mirrored only), filling outW × outH. */
export function draw(ctx, src, W, H, v, outW, outH, all = false) {
  const b = cropBox(v, W, H), cx = all ? 0 : b.x, cy = all ? 0 : b.y, cw = all ? b.OW : b.w, ch = all ? b.OH : b.h;
  ctx.save();
  ctx.scale(outW / cw, outH / ch); ctx.translate(-cx, -cy);
  ctx.translate(b.OW / 2, b.OH / 2); if (v.flip) ctx.scale(-1, 1); ctx.rotate(v.turn * Math.PI / 2);
  ctx.drawImage(src, -W / 2, -H / 2);
  ctx.restore();
}

/** The source pixel (x, y) that shows at pixel (ox, oy) of the turned and mirrored picture. */
function back(v, W, H, ox, oy) {
  const [OW] = turned(v, W, H);
  if (v.flip) ox = OW - 1 - ox;
  if (v.turn === 1) return [oy, H - 1 - ox];
  if (v.turn === 2) return [W - 1 - ox, H - 1 - oy];
  if (v.turn === 3) return [W - 1 - oy, ox];
  return [ox, oy];
}
/** A point of the source (continuous, edges included) on the turned, mirrored and cropped picture. */
export function forward(v, W, H, x, y) {
  const b = cropBox(v, W, H);
  let ox = x, oy = y;
  if (v.turn === 1) [ox, oy] = [H - y, x]; else if (v.turn === 2) [ox, oy] = [W - x, H - y]; else if (v.turn === 3) [ox, oy] = [y, W - x];
  if (v.flip) ox = b.OW - ox;
  return [ox - b.x, oy - b.y];
}
/** A direction on the source (dx right, dy down) as it points on the turned and mirrored picture. */
export function direction(v, dx, dy) {
  for (let k = 0; k < v.turn; k++) [dx, dy] = [-dy, dx];
  return v.flip ? [-dx, dy] : [dx, dy];
}
/** A rectangle of the source on the cropped picture, cut to it; null when it lies outside. */
export function rectOn(v, W, H, r) {
  const b = cropBox(v, W, H), a = forward(v, W, H, r.x, r.y), c = forward(v, W, H, r.x + r.w, r.y + r.h);
  const x0 = Math.max(0, Math.min(a[0], c[0])), y0 = Math.max(0, Math.min(a[1], c[1])), x1 = Math.min(b.w, Math.max(a[0], c[0])), y1 = Math.min(b.h, Math.max(a[1], c[1]));
  return x1 - x0 < 2 || y1 - y0 < 2 ? null : { ...r, x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

/** A row-major array of W × H × channels, turned, mirrored and cropped: { data, W, H }. */
export function orientArray(a, W, H, v, channels = 1) {
  const b = cropBox(v, W, H), out = new a.constructor(b.w * b.h * channels);
  for (let j = 0; j < b.h; j++) for (let i = 0; i < b.w; i++) {
    const [sx, sy] = back(v, W, H, i + b.x, j + b.y), s = (sy * W + sx) * channels, d = (j * b.w + i) * channels;
    for (let c = 0; c < channels; c++) out[d + c] = a[s + c];
  }
  return { data: out, W: b.w, H: b.h };
}

/** The FITS coordinates (TAN) of the turned, mirrored and cropped picture of a frame: { crval, crpix, cd }. */
export function wcsOf(frame, W, H, v) {
  const s = frame.scale / 3600, r = (frame.rot || 0) * Math.PI / 180;
  const CD = [[-s * Math.cos(r), s * Math.sin(r)], [s * Math.sin(r), s * Math.cos(r)]], CRPIX = [(W + 1) / 2, (H + 1) / 2], b = cropBox(v, W, H);
  // FITS counts pixels from 1, rows from the bottom; the new picture's pixel (i, j) shows the source pixel back(...)
  const P = (i, j) => { const [sx, sy] = back(v, W, H, i + b.x, j + b.y); return [sx + 1, H - sy]; };
  const p0 = P(0, 0), p1 = P(1, 0), p2 = P(0, 1);
  // old = A · new + c, where new = (i + 1, h - j)
  const A = [[p1[0] - p0[0], -(p2[0] - p0[0])], [p1[1] - p0[1], -(p2[1] - p0[1])]], q0 = [1, b.h];
  const c = [p0[0] - (A[0][0] * q0[0] + A[0][1] * q0[1]), p0[1] - (A[1][0] * q0[0] + A[1][1] * q0[1])];
  const cd = [[CD[0][0] * A[0][0] + CD[0][1] * A[1][0], CD[0][0] * A[0][1] + CD[0][1] * A[1][1]], [CD[1][0] * A[0][0] + CD[1][1] * A[1][0], CD[1][0] * A[0][1] + CD[1][1] * A[1][1]]];
  const det = A[0][0] * A[1][1] - A[0][1] * A[1][0], d = [CRPIX[0] - c[0], CRPIX[1] - c[1]];
  return { crval: [frame.ra, frame.dec], crpix: [(A[1][1] * d[0] - A[0][1] * d[1]) / det, (-A[1][0] * d[0] + A[0][0] * d[1]) / det], cd };
}

/** The crop turned with the picture: a quarter turn clockwise, or a mirror. */
export const turnCrop = c => ({ x: 1 - c.y - c.h, y: c.x, w: c.h, h: c.w });
export const flipCrop = c => ({ ...c, x: 1 - c.x - c.w });
/** The largest crop of a shape (width / height in pixels) around the middle of another, inside the turned picture. */
export function fitShape(c, OW, OH, ratio) {
  if (!ratio) return c;
  const mx = (c.x + c.w / 2) * OW, my = (c.y + c.h / 2) * OH;
  const w = Math.min(OW, OH * ratio), h = w / ratio;          // the shape at its largest; the visitor makes it smaller
  const x = clamp(mx - w / 2, 0, OW - w), y = clamp(my - h / 2, 0, OH - h);
  return { x: x / OW, y: y / OH, w: w / OW, h: h / OH };
}
