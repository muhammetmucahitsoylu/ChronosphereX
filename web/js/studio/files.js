// The picture studio's files: 16-bit PNG and TIFF for people who go on working in their own programs, FITS with the
// frame's place on the sky written in, and a picture's description packed into a link. No page needed: tested in Node
// against Pillow and astropy (spike/studio/test_files.*).
import { WAVES } from './geom.js';

const CRC = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
const crc32 = (bytes, c = -1) => { for (let i = 0; i < bytes.length; i++) c = CRC[(c ^ bytes[i]) & 255] ^ (c >>> 8); return c; };
const ascii = s => Uint8Array.from(String(s).replace(/[^\x20-\x7e]/g, '?'), ch => ch.charCodeAt(0));
async function deflate(bytes) {
  const out = new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate')));
  return new Uint8Array(await out.arrayBuffer());
}
function pngChunk(type, data) {
  const out = new Uint8Array(12 + data.length), v = new DataView(out.buffer), t = ascii(type);
  v.setUint32(0, data.length); out.set(t, 4); out.set(data, 8);
  v.setUint32(8 + data.length, (crc32(data, crc32(t)) ^ -1) >>> 0);
  return out;
}

/** A PNG with 16 bits a colour. `words`: r, g, b, r, g, b … (Uint16Array, 3 W H). `text`: { Software, Description, … } written into the file. */
export async function png16(words, W, H, text = {}) {
  const row = 1 + W * 6, raw = new Uint8Array(row * H);
  for (let j = 0; j < H; j++) {
    const o = j * row; raw[o] = 1;                                      // each row stored as differences from the pixel to its left
    for (let i = 0; i < W * 3; i++) {
      const v = words[j * W * 3 + i], p = i >= 3 ? words[j * W * 3 + i - 3] : 0;
      raw[o + 1 + 2 * i] = ((v >> 8) - (p >> 8)) & 255; raw[o + 2 + 2 * i] = ((v & 255) - (p & 255)) & 255;
    }
  }
  const head = new Uint8Array(13), hv = new DataView(head.buffer); hv.setUint32(0, W); hv.setUint32(4, H); head[8] = 16; head[9] = 2;
  const parts = [Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]), pngChunk('IHDR', head)];
  for (const [k, v] of Object.entries(text)) { const a = ascii(k), b = ascii(v), d = new Uint8Array(a.length + 1 + b.length); d.set(a); d.set(b, a.length + 1); parts.push(pngChunk('tEXt', d)); }
  parts.push(pngChunk('IDAT', await deflate(raw)), pngChunk('IEND', new Uint8Array(0)));
  return new Blob(parts, { type: 'image/png' });
}

/** A TIFF with 16 bits a colour, not compressed (every program reads it). */
export function tiff16(words, W, H, text = {}) {
  const desc = ascii((text.Description || '') + '\0'), soft = ascii((text.Software || 'ChronosphereX') + '\0');
  const tags = 12, ifd = 8, after = ifd + 2 + tags * 12 + 4, bitsAt = after, descAt = bitsAt + 6, softAt = descAt + desc.length + (desc.length & 1);
  const dataAt = softAt + soft.length + (soft.length & 1), bytes = W * H * 6;
  const head = new Uint8Array(dataAt), v = new DataView(head.buffer);
  head.set([73, 73, 42, 0]); v.setUint32(4, ifd, true); v.setUint16(ifd, tags, true);
  let at = ifd + 2;
  const tag = (id, type, count, value) => { v.setUint16(at, id, true); v.setUint16(at + 2, type, true); v.setUint32(at + 4, count, true); if (type === 3 && count === 1) v.setUint16(at + 8, value, true); else v.setUint32(at + 8, value, true); at += 12; };
  tag(256, 4, 1, W); tag(257, 4, 1, H); tag(258, 3, 3, bitsAt); tag(259, 3, 1, 1); tag(262, 3, 1, 2); tag(270, 2, desc.length, descAt);
  tag(273, 4, 1, dataAt); tag(277, 3, 1, 3); tag(278, 4, 1, H); tag(279, 4, 1, bytes); tag(284, 3, 1, 1); tag(305, 2, soft.length, softAt);
  v.setUint32(at, 0, true);
  v.setUint16(bitsAt, 16, true); v.setUint16(bitsAt + 2, 16, true); v.setUint16(bitsAt + 4, 16, true);
  head.set(desc, descAt); head.set(soft, softAt);
  return new Blob([head, new Uint8Array(words.buffer, words.byteOffset, bytes)], { type: 'image/tiff' });
}

const card = (key, value, comment = '') => {
  let v;
  if (typeof value === 'string') v = `'${value.replace(/'/g, "''").padEnd(8)}'`.padEnd(20);
  else if (typeof value === 'boolean') v = (value ? 'T' : 'F').padStart(20);
  else v = (Number.isInteger(value) ? String(value) : value.toPrecision(15).replace(/\.?0+(e|$)/, '$1').replace('e', 'E')).padStart(20);
  return `${key.padEnd(8)}= ${v}${comment ? ' / ' + comment : ''}`.slice(0, 80).padEnd(80);
};
const note = (key, text) => `${key.padEnd(8)} ${text}`.slice(0, 80).padEnd(80);

/**
 * A FITS file of pictures on one grid: `images` are Float32Arrays of W x H (row 0 at the top, as on screen), stacked
 * as a cube when there are several. The header says where the frame is on the sky (tangent plane, ICRS), so any
 * astronomy program can lay catalogues over it. `cards`: extra [key, value, comment] lines; `notes`: HISTORY lines.
 */
export function fits(images, W, H, frame, { cards = [], notes = [], unit = 'MJy/sr' } = {}) {
  const n = images.length, s = frame.scale / 3600, r = (frame.rot || 0) * Math.PI / 180;
  const lines = [card('SIMPLE', true, 'FITS standard'), card('BITPIX', -32, '32-bit floating point'), card('NAXIS', n > 1 ? 3 : 2), card('NAXIS1', W), card('NAXIS2', H)];
  if (n > 1) lines.push(card('NAXIS3', n, 'pictures in this file, see LAYERn'));
  lines.push(card('BUNIT', unit), card('CTYPE1', 'RA---TAN'), card('CTYPE2', 'DEC--TAN'), card('CUNIT1', 'deg'), card('CUNIT2', 'deg'),
    card('CRVAL1', frame.ra, 'RA of the frame centre (deg)'), card('CRVAL2', frame.dec, 'Dec of the frame centre (deg)'),
    card('CRPIX1', (W + 1) / 2), card('CRPIX2', (H + 1) / 2),
    card('CD1_1', -s * Math.cos(r)), card('CD1_2', s * Math.sin(r)), card('CD2_1', s * Math.sin(r)), card('CD2_2', s * Math.cos(r)),
    card('RADESYS', 'ICRS'), card('TELESCOP', 'SPHEREx'), card('ORIGIN', 'chronospherex.com', 'cut from the SPHEREx DR1 all-sky cube'));
  for (const c of cards) lines.push(card(...c));
  for (const t of ['Data: NASA SPHEREx all-sky cube, DR1 (NASA/JPL-Caltech, IPAC).', 'Frame cut and resampled in the browser at chronospherex.com.', ...notes]) lines.push(note('HISTORY', t));
  lines.push('END'.padEnd(80));
  while (lines.length % 36) lines.push(' '.repeat(80));
  const head = ascii(lines.join('')), size = n * W * H * 4, pad = (2880 - (size % 2880)) % 2880;
  const data = new Uint8Array(size + pad), v = new DataView(data.buffer);
  let at = 0;
  for (const im of images) for (let j = H - 1; j >= 0; j--) for (let i = 0; i < W; i++, at += 4) v.setFloat32(at, im[j * W + i]);          // FITS counts rows from the bottom
  return new Blob([head, data], { type: 'application/fits' });
}
/** Header lines that say which wavelengths a layer or a plane is. */
export const layerCards = list => list.flatMap((name, i) => [[`LAYER${i + 1}`, name]]);
export const umOf = z => WAVES[z];

// ------------------------------------------------------------------------------------------------- a picture as a link
const b64 = { to: s => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''), from: s => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/')))) };
const r5 = x => Math.round(x * 1e5) / 1e5;
/** The address part that describes a picture: the place in plain numbers, everything else packed. */
export function toQuery(doc) {
  const f = doc.frame, q = new URLSearchParams();
  q.set('ra', r5(f.ra)); q.set('dec', r5(f.dec)); q.set('w', r5(f.w)); q.set('h', r5(f.h)); if (f.rot) q.set('rot', Math.round(f.rot * 100) / 100);
  q.set('r', doc.recipe || 'custom'); q.set('q', doc.quality || 1);
  q.set('p', b64.to(JSON.stringify({ layout: doc.layout, blend: doc.blend, balance: doc.balance, layers: doc.layers, look: doc.look, marks: { ...doc.marks, name: undefined } })));
  return q.toString();
}
/** What an address says about a picture: { frame, recipe, quality, rest } (rest: the packed part, or null); null if it names no place. */
export function fromQuery(search) {
  const q = new URLSearchParams(search), num = k => (q.has(k) && q.get(k) !== '' && isFinite(+q.get(k)) ? +q.get(k) : null);
  const ra = num('ra'), dec = num('dec'); if (ra === null || dec === null || Math.abs(dec) > 90) return null;
  let rest = null;
  try { if (q.get('p')) rest = JSON.parse(b64.from(q.get('p'))); } catch { rest = null; }
  if (rest && !(Array.isArray(rest.layers) && rest.layers.length && rest.layers.every(L => L && L.src && Array.isArray(L.color)))) rest = null;
  return { frame: { ra: ((ra % 360) + 360) % 360, dec, w: num('w'), h: num('h'), rot: num('rot') || 0, fov: num('fov') }, recipe: q.get('r'), quality: Math.max(1, Math.min(3, num('q') || 1)), rest };
}
