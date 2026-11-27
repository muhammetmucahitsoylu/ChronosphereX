// The picture studio's worker: reads the wavelengths and works the pictures out, away from the page, so that the
// page stays smooth while megabytes arrive and arrays are crunched. The page talks to it in small messages:
//   open   { frame, previewMax }        a new frame; forgets the last one
//   read   { planes }                   fetch these wavelengths (those not yet here); answers 'bytes', 'plane', 'read'
//   stop                                give up the reading under way
//   render { doc, target }              the picture as bytes for a canvas ('small' while editing, 'full' for export)
//   words  { doc }                      the full picture as 16-bit numbers
//   lights { doc } / planes             the layers before stretching / the wavelengths as read, for FITS files
//   hist   { layer }                    a layer's brightness count
// Every message carries an id that its answer repeats.
import { makeFrame, makeMap, bytesPerPlane } from './geom.js';
import { readFrame } from './cube.js';
import { Bench } from './render.js';
import { toBytes, toWords } from './process.js';

let frame = null, map = null, bench = null, stopper = null, line = Promise.resolve(), opened = 0;
const say = (m, move) => self.postMessage(m, move || []);

async function read(m, mine) {
  const want = m.planes.filter(z => !bench.has(z));
  if (!want.length) return say({ t: 'read', id: m.id, planes: [] });
  stopper = new AbortController();
  let last = 0;
  try {
    await readFrame(frame, want, {
      map, signal: stopper.signal,
      onBytes: (got, all) => { const now = Date.now(); if (now - last > 120 || got === all) { last = now; say({ t: 'bytes', id: m.id, got, all }); } },
      onPlane: (z, values, done, total) => {
        if (mine !== opened) return;          // another frame was opened meanwhile
        const h = bench.addPlane(z, values);
        say({ t: 'plane', id: m.id, z, done, total, cores: h.cores / values.length, gaps: h.gaps / values.length });
      },
    });
    say({ t: 'read', id: m.id, planes: want });
  } catch (e) {
    say({ t: 'read', id: m.id, failed: true, stopped: !!stopper?.signal.aborted, message: String(e?.message || e) });
  } finally { stopper = null; }
}

self.onmessage = e => {
  const m = e.data;
  try {
    if (m.t === 'open') {
      stopper?.abort(); opened++;
      frame = makeFrame(m.frame); map = makeMap(frame); bench = new Bench(frame.W, frame.H, m.previewMax || 1100);
      return say({ t: 'opened', id: m.id, frame, tiles: map.tiles.length, tileIds: Array.from(map.tiles), bytesPerPlane: bytesPerPlane(map), w: bench.w, h: bench.h, f: bench.f });
    }
    if (!bench) return say({ t: 'error', id: m.id, message: 'no frame' });
    if (m.t === 'stop') { stopper?.abort(); return; }
    if (m.t === 'read') { const mine = opened; line = line.then(() => (mine === opened ? read(m, mine) : null)); return; }
    if (m.t === 'render') {
      const need = bench.missing(m.doc);
      if (need.length) return say({ t: 'picture', id: m.id, missing: need });
      const t0 = performance.now(), p = bench.render(m.doc, m.target === 'full' ? 'full' : 'small');
      const rgba = toBytes(p.rgb, p.W * p.H);
      return say({ t: 'picture', id: m.id, target: m.target, W: p.W, H: p.H, rects: p.rects, layers: p.layers, scale: p.scale, rgba: rgba.buffer, ms: performance.now() - t0 }, [rgba.buffer]);
    }
    if (m.t === 'words') {
      const p = bench.render(m.doc, 'full'), words = toWords(p.rgb, p.W * p.H);
      return say({ t: 'words', id: m.id, W: p.W, H: p.H, rects: p.rects, words: words.buffer }, [words.buffer]);
    }
    if (m.t === 'lights') {
      const out = [];
      for (const L of m.doc.layers.filter(x => x.on)) { const lit = bench.lit(L); if (lit) out.push({ id: L.id, src: L.src, data: Float32Array.from(lit).buffer }); }
      return say({ t: 'lights', id: m.id, W: bench.W, H: bench.H, layers: out }, out.map(o => o.data));
    }
    if (m.t === 'planes') {
      const out = [...bench.full.entries()].sort((a, b) => a[0] - b[0]).map(([z, p]) => {
        const d = Float32Array.from(p.data); for (let i = 0; i < d.length; i++) if (p.mask[i] === 2) d[i] = NaN;          // a survey gap stays without a value
        return { z, data: d.buffer };
      });
      return say({ t: 'planes', id: m.id, W: bench.W, H: bench.H, planes: out }, out.map(o => o.data));
    }
    if (m.t === 'hist') { const h = bench.histogram(m.layer); return say({ t: 'hist', id: m.id, layer: m.layer.id, bars: h ? [...h.bars] : null, lo: h?.lo, hi: h?.hi }); }
  } catch (err) {
    say({ t: 'error', id: m.id, message: String(err?.message || err) });
  }
};
