// What the picture studio writes on a picture: the credit line (always), and where asked for a title, a colour key,
// a scale bar and the directions of north and east. Drawn with the page's own faces on a canvas of any size, so the
// same code serves the picture on screen and the file that is saved.
import { WAVES } from './geom.js';

export const CREDIT = 'NASA SPHEREx · chronospherex.com';
const SERIF = '"Instrument Serif", "Iowan Old Style", Georgia, serif', SANS = '"IBM Plex Sans", system-ui, "Segoe UI", sans-serif';

const um = (v, T, n = 2) => v.toFixed(n).replace('.', T.dec);
/** A layer said in words: "dust · 3.29–3.38 µm", "1.20 µm", "2.58–3.67 µm". `bare`: the wavelengths alone. */
export function layerName(L, T, lang, bare = false) {
  if (!L) return '';
  const zs = L.src.kind === 'line' ? L.src.on : L.src.planes, w = zs.map(z => WAVES[z]), lo = Math.min(...w), hi = Math.max(...w);
  const waves = hi - lo < 0.005 ? `${um(lo, T)}` : `${um(lo, T)}–${um(hi, T)}`;
  if (bare) return waves;
  const word = T['k_' + L.id] || (L.feature && T['f_' + L.feature]) || '';
  if (L.feature && T['f_' + L.feature]) return T['f_' + L.feature];
  return word ? `${word} · ${waves} µm` : `${waves} µm`;
}

/**
 * x: a canvas' 2D context of W x H pixels holding the picture. o.rects: where each panel lies in the picture's own
 * pixels (o.picW x o.picH); o.doc: the picture's description; o.name: whose processing it is; o.T: the words.
 */
export function drawMarks(x, W, H, o) {
  const { doc, rects, picW, name, T, lang } = o, k = W / picW, m = doc.marks || {};
  const one = rects[0], paneW = one.w * k, paneH = one.h * k, on = doc.layers.filter(L => L.on), panels = rects.length > 1;
  const unit = Math.max(11, Math.min(paneW, paneH * 1.6) / 62);          // the size of small writing, from the smaller side of a panel
  const pad = Math.round(unit * 1.1);
  const text = (s, px, py, size, opt = {}) => {
    x.font = `${opt.weight || 400} ${Math.round(size)}px ${opt.face || SANS}`; x.textAlign = opt.align || 'left'; x.textBaseline = opt.base || 'alphabetic';
    x.lineJoin = 'round'; x.lineWidth = Math.max(2, size / 6); x.strokeStyle = 'rgba(0,0,0,.55)'; x.strokeText(s, px, py);
    x.fillStyle = opt.fill || 'rgba(235,232,226,.92)'; x.fillText(s, px, py);
  };
  const fit = (s, size, room, opt) => { x.font = `${opt?.weight || 400} ${Math.round(size)}px ${opt?.face || SANS}`; const w = x.measureText(s).width; return w > room ? size * room / w : size; };

  // each panel says its wavelength, top left (the picture is about that)
  if (panels) rects.forEach(r => { const L = on.find(q => q.id === r.id); if (L) text(`${layerName(L, T, lang, true)} µm`, r.x * k + pad, r.y * k + pad + unit * 1.5, unit * 1.7, { weight: 600, fill: '#fff' }); });

  // the credit line, bottom right of the whole picture
  const credit = (name ? `${T.processing.replace('{name}', name)} · ` : '') + CREDIT;
  text(credit, W - pad, H - pad, fit(credit, unit * 1.05, W - 2 * pad), { align: 'right', fill: 'rgba(205,202,196,.9)' });

  // a title, top left (top right where the panels' wavelengths stand on the left)
  if (m.title) { const size = fit(m.title, unit * 3.1, paneW - 2 * pad, { face: SERIF }); text(m.title, panels ? W - pad : pad, pad + size * 0.86, size, { face: SERIF, align: panels ? 'right' : 'left', fill: '#fff' }); }

  // bottom left, upwards: the colour key, then the scale bar
  let y = H - pad;
  if (m.key && !panels) {
    const size = unit * 1.05;
    for (const L of [...on].reverse()) {
      const c = L.color.map(v => Math.round(Math.min(1, 0.25 + 0.9 * v) * 255));
      x.fillStyle = 'rgba(0,0,0,.55)'; x.beginPath(); x.arc(pad + size * 0.45, y - size * 0.34, size * 0.5, 0, 2 * Math.PI); x.fill();
      x.fillStyle = `rgb(${c})`; x.beginPath(); x.arc(pad + size * 0.45, y - size * 0.34, size * 0.4, 0, 2 * Math.PI); x.fill();
      text(layerName(L, T, lang), pad + size * 1.25, y, size); y -= size * 1.45;
    }
    y -= unit * 0.3;
  }
  if (m.scale) {
    const pxPerDeg = 3600 / doc.frame.scale * k, want = paneW * 0.2;
    const steps = [1 / 60, 2 / 60, 5 / 60, 10 / 60, 15 / 60, 0.5, 1, 2, 5, 10], deg = steps.reduce((b, s) => (Math.abs(s * pxPerDeg - want) < Math.abs(b * pxPerDeg - want) ? s : b));
    const len = deg * pxPerDeg, label = deg >= 1 ? `${deg}°` : `${Math.round(deg * 60)}′`, t = Math.max(2, unit / 7);
    x.fillStyle = 'rgba(0,0,0,.55)'; x.fillRect(pad - 1, y - t - 1, len + 2, t + 2); x.fillStyle = 'rgba(235,232,226,.95)'; x.fillRect(pad, y - t, len, t);
    text(label, pad + len + unit * 0.5, y + unit * 0.1, unit * 1.05);
  }
  // north and east, top right (under a title that stands there)
  if (m.compass) {
    const r = (doc.frame.rot || 0) * Math.PI / 180, len = unit * 3.2, cx = W - pad - len * 1.25, cy = pad + len * 1.25 + (panels && m.title ? unit * 3.4 : 0);
    const arrow = (dx, dy, letter) => {
      const ex = cx + dx * len, ey = cy + dy * len;
      for (const [w, c] of [[Math.max(3, unit / 4), 'rgba(0,0,0,.55)'], [Math.max(1.5, unit / 8), 'rgba(235,232,226,.95)']]) {
        x.strokeStyle = c; x.lineWidth = w; x.lineCap = 'round'; x.beginPath(); x.moveTo(cx, cy); x.lineTo(ex, ey);
        const a = Math.atan2(dy, dx), h = len * 0.22; x.moveTo(ex, ey); x.lineTo(ex - h * Math.cos(a - 0.45), ey - h * Math.sin(a - 0.45)); x.moveTo(ex, ey); x.lineTo(ex - h * Math.cos(a + 0.45), ey - h * Math.sin(a + 0.45)); x.stroke();
      }
      text(letter, cx + dx * len * 1.3, cy + dy * len * 1.3, unit, { align: 'center', base: 'middle', weight: 600 });
    };
    arrow(Math.sin(r), -Math.cos(r), T.compassN || 'N'); arrow(-Math.cos(r), -Math.sin(r), T.compassE || 'E');
  }
}
