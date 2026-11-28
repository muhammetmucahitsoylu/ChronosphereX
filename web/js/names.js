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

// Names as each language's own books, planetariums and sky apps give them, not word for word. Star names are the IAU's,
// the same in every language. The list's own names (data/sky.json) are the English ones.
// Constellations: Turkish has its own names (the same as star.html); the other languages keep the Latin names there too.
const CON = {
  tr: { 'Andromeda': 'Andromeda', 'Antlia': 'Hava Pompası', 'Apus': 'Cennet Kuşu', 'Aquarius': 'Kova', 'Aquila': 'Kartal', 'Ara': 'Sunak',
    'Aries': 'Koç', 'Auriga': 'Arabacı', 'Boötes': 'Çoban', 'Caelum': 'Oyma Kalemi', 'Camelopardalis': 'Zürafa', 'Cancer': 'Yengeç',
    'Canes Venatici': 'Av Köpekleri', 'Canis Major': 'Büyük Köpek', 'Canis Minor': 'Küçük Köpek', 'Capricornus': 'Oğlak', 'Carina': 'Karina',
    'Cassiopeia': 'Kassiopeia', 'Centaurus': 'Erboğa', 'Cepheus': 'Kral', 'Cetus': 'Balina', 'Chamaleon': 'Bukalemun', 'Chamaeleon': 'Bukalemun',
    'Circinus': 'Pergel', 'Columba': 'Güvercin', 'Coma Berenices': 'Berenis’in Saçı', 'Corona Australis': 'Güney Tacı', 'Corona Borealis': 'Kuzey Tacı',
    'Corvus': 'Karga', 'Crater': 'Kupa', 'Crux': 'Güney Haçı', 'Cygnus': 'Kuğu', 'Delphinus': 'Yunus', 'Dorado': 'Kılıçbalığı', 'Draco': 'Ejderha',
    'Equuleus': 'Tay', 'Eridanus': 'Irmak', 'Fornax': 'Ocak', 'Gemini': 'İkizler', 'Grus': 'Turna', 'Hercules': 'Herkül', 'Horologium': 'Saat',
    'Hydra': 'Suyılanı', 'Hydrus': 'Küçük Suyılanı', 'Indus': 'Hintli', 'Lacerta': 'Kertenkele', 'Leo': 'Aslan', 'Leo Minor': 'Küçük Aslan',
    'Lepus': 'Tavşan', 'Libra': 'Terazi', 'Lupus': 'Kurt', 'Lynx': 'Vaşak', 'Lyra': 'Çalgı', 'Mensa': 'Masa Dağı', 'Microscopium': 'Mikroskop',
    'Monoceros': 'Tekboynuz', 'Musca': 'Sinek', 'Norma': 'Gönye', 'Octans': 'Oktant', 'Ophiuchus': 'Yılancı', 'Orion': 'Orion', 'Pavo': 'Tavus',
    'Pegasus': 'Pegasus', 'Perseus': 'Perseus', 'Phoenix': 'Anka', 'Pictor': 'Ressam Sehpası', 'Pisces': 'Balıklar', 'Pisces Austrinus': 'Güney Balığı',
    'Piscis Austrinus': 'Güney Balığı', 'Puppis': 'Pupa', 'Pyxis': 'Pusula', 'Reticulum': 'Ağ', 'Sagitta': 'Ok', 'Sagittarius': 'Yay', 'Scorpius': 'Akrep',
    'Sculptor': 'Heykeltıraş', 'Scutum': 'Kalkan', 'Serpens': 'Yılan', 'Sextans': 'Sekstant', 'Taurus': 'Boğa', 'Telescopium': 'Teleskop',
    'Triangulum': 'Üçgen', 'Triangulum Australe': 'Güney Üçgeni', 'Tucana': 'Tukan', 'Ursa Major': 'Büyük Ayı', 'Ursa Minor': 'Küçük Ayı',
    'Vela': 'Yelken', 'Virgo': 'Başak', 'Volans': 'Uçan Balık', 'Vulpecula': 'Tilki' },
};
// Clusters, nebulae and galaxies: the list's short English names (e.g. 'North America') in each language's full name.
// A name not given here stays as it is (M13, Omega Centauri, Sgr A*, ...).
const DEEP = {
  tr: { 'M31 Andromeda': 'M31 Andromeda Galaksisi', 'M42 Orion': 'M42 Orion Bulutsusu', 'M45 Pleiades': 'M45 Ülker', 'LMC': 'Büyük Macellan Bulutu',
    'SMC': 'Küçük Macellan Bulutu', 'M1 Crab': 'M1 Yengeç Bulutsusu', 'M8 Lagoon': 'M8 Lagün Bulutsusu', 'M16 Eagle': 'M16 Kartal Bulutsusu',
    'M17 Omega': 'M17 Omega Bulutsusu', 'M20 Trifid': 'M20 Trifid Bulutsusu', 'M57 Ring': 'M57 Halka Bulutsusu', 'M27 Dumbbell': 'M27 Dambıl Bulutsusu',
    'M33 Triangulum': 'M33 Üçgen Galaksisi', 'M51 Whirlpool': 'M51 Girdap Galaksisi', 'M44 Beehive': 'M44 Arı Kovanı Kümesi', 'Carina': 'Karina Bulutsusu',
    'Tarantula': 'Tarantula Bulutsusu', 'Helix': 'Helix Bulutsusu', 'M104 Sombrero': 'M104 Sombrero Galaksisi', 'Rosette': 'Rozet Bulutsusu',
    'North America': 'Kuzey Amerika Bulutsusu', 'Double Cluster': 'Çift Küme' },
  de: { 'M31 Andromeda': 'M31 Andromedagalaxie', 'M42 Orion': 'M42 Orionnebel', 'M45 Pleiades': 'M45 Plejaden', 'LMC': 'Große Magellansche Wolke',
    'SMC': 'Kleine Magellansche Wolke', 'M1 Crab': 'M1 Krebsnebel', 'M8 Lagoon': 'M8 Lagunennebel', 'M16 Eagle': 'M16 Adlernebel',
    'M17 Omega': 'M17 Omeganebel', 'M20 Trifid': 'M20 Trifidnebel', 'M57 Ring': 'M57 Ringnebel', 'M27 Dumbbell': 'M27 Hantelnebel',
    'M33 Triangulum': 'M33 Dreiecksgalaxie', 'M51 Whirlpool': 'M51 Whirlpool-Galaxie', 'M44 Beehive': 'M44 Krippe', 'Carina': 'Carinanebel',
    'Tarantula': 'Tarantelnebel', 'Helix': 'Helixnebel', 'M104 Sombrero': 'M104 Sombrerogalaxie', 'Rosette': 'Rosettennebel',
    'North America': 'Nordamerikanebel', 'Double Cluster': 'h und χ Persei' },
  fr: { 'M31 Andromeda': 'M31 Galaxie d’Andromède', 'M42 Orion': 'M42 Nébuleuse d’Orion', 'M45 Pleiades': 'M45 Pléiades', 'LMC': 'Grand Nuage de Magellan',
    'SMC': 'Petit Nuage de Magellan', 'M1 Crab': 'M1 Nébuleuse du Crabe', 'M8 Lagoon': 'M8 Nébuleuse de la Lagune', 'M16 Eagle': 'M16 Nébuleuse de l’Aigle',
    'M17 Omega': 'M17 Nébuleuse Oméga', 'M20 Trifid': 'M20 Nébuleuse Trifide', 'M57 Ring': 'M57 Nébuleuse de l’Anneau', 'M27 Dumbbell': 'M27 Nébuleuse de l’Haltère',
    'M33 Triangulum': 'M33 Galaxie du Triangle', 'M51 Whirlpool': 'M51 Galaxie du Tourbillon', 'M44 Beehive': 'M44 Amas de la Crèche', 'Carina': 'Nébuleuse de la Carène',
    'Tarantula': 'Nébuleuse de la Tarentule', 'Helix': 'Nébuleuse de l’Hélice', 'M104 Sombrero': 'M104 Galaxie du Sombrero', 'Rosette': 'Nébuleuse de la Rosette',
    'North America': 'Nébuleuse de l’Amérique du Nord', 'Double Cluster': 'Double amas de Persée' },
  pl: { 'M31 Andromeda': 'M31 Galaktyka Andromedy', 'M42 Orion': 'M42 Mgławica Oriona', 'M45 Pleiades': 'M45 Plejady', 'LMC': 'Wielki Obłok Magellana',
    'SMC': 'Mały Obłok Magellana', 'M1 Crab': 'M1 Mgławica Kraba', 'M8 Lagoon': 'M8 Mgławica Laguna', 'M16 Eagle': 'M16 Mgławica Orzeł',
    'M17 Omega': 'M17 Mgławica Omega', 'M20 Trifid': 'M20 Mgławica Trójlistna Koniczyna', 'M57 Ring': 'M57 Mgławica Pierścień', 'M27 Dumbbell': 'M27 Mgławica Hantle',
    'M33 Triangulum': 'M33 Galaktyka Trójkąta', 'M51 Whirlpool': 'M51 Galaktyka Wir', 'M44 Beehive': 'M44 Żłóbek', 'Carina': 'Mgławica Carina',
    'Tarantula': 'Mgławica Tarantula', 'Helix': 'Mgławica Ślimak', 'M104 Sombrero': 'M104 Galaktyka Sombrero', 'Rosette': 'Mgławica Rozeta',
    'North America': 'Mgławica Ameryka Północna', 'Double Cluster': 'Podwójna Gromada Perseusza' },
  es: { 'M31 Andromeda': 'M31 Galaxia de Andrómeda', 'M42 Orion': 'M42 Nebulosa de Orión', 'M45 Pleiades': 'M45 Pléyades', 'LMC': 'Gran Nube de Magallanes',
    'SMC': 'Pequeña Nube de Magallanes', 'M1 Crab': 'M1 Nebulosa del Cangrejo', 'M8 Lagoon': 'M8 Nebulosa de la Laguna', 'M16 Eagle': 'M16 Nebulosa del Águila',
    'M17 Omega': 'M17 Nebulosa Omega', 'M20 Trifid': 'M20 Nebulosa Trífida', 'M57 Ring': 'M57 Nebulosa del Anillo', 'M27 Dumbbell': 'M27 Nebulosa Dumbbell',
    'M33 Triangulum': 'M33 Galaxia del Triángulo', 'M51 Whirlpool': 'M51 Galaxia del Remolino', 'M44 Beehive': 'M44 Cúmulo del Pesebre', 'Carina': 'Nebulosa de Carina',
    'Tarantula': 'Nebulosa de la Tarántula', 'Helix': 'Nebulosa de la Hélice', 'M104 Sombrero': 'M104 Galaxia del Sombrero', 'Rosette': 'Nebulosa Roseta',
    'North America': 'Nebulosa Norteamérica', 'Double Cluster': 'Doble Cúmulo de Perseo' },
};

/** The constellation a place of the sky (degrees, J2000) lies in, in the language given (Latin where it has no table); '' before the list has come. */
export function constellation(ra, dec, lang) {
  if (!data) return '';
  const { rows, names, to1875: M } = data.cons, v = vec(ra, dec);
  // the borders were drawn along the coordinates of 1875: turn the place into those first
  const x = M[0][0] * v[0] + M[0][1] * v[1] + M[0][2] * v[2], y = M[1][0] * v[0] + M[1][1] * v[1] + M[1][2] * v[2], z = M[2][0] * v[0] + M[2][1] * v[1] + M[2][2] * v[2];
  const hours = ((Math.atan2(y, x) / RAD + 360) % 360) / 15, d = Math.asin(Math.max(-1, Math.min(1, z))) / RAD;
  for (const [lo, hi, south, k] of rows) if (d >= south && hours >= lo && hours < hi) return CON[lang]?.[names[k]] || names[k];          // the rows run from north to south: the first that fits
  return '';
}

// A constellation by its name: its middle and how wide it is, from its borders (sampled once over the sphere in the
// coordinates of 1875, where the borders run along the lines of the grid, and turned back to those of 2000).
let middles = null;
const foldName = s => String(s || '').toLocaleLowerCase('tr').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ı/g, 'i').replace(/[^a-z0-9]/g, '');
function conMiddles() {
  if (middles || !data) return middles;
  const { rows, names, to1875: M } = data.cons, n = names.length, sum = Array.from({ length: n }, () => [0, 0, 0, 0]), step = 1.5;
  for (let d = -90 + step / 2; d < 90; d += step) {
    const cd = Math.cos(d * RAD), dh = step / 15 / Math.max(cd, 0.02);
    for (let h = dh / 2; h < 24; h += dh) {
      let k = -1; for (const [lo, hi, south, i] of rows) if (d >= south && h >= lo && h < hi) { k = i; break; }
      if (k < 0) continue;
      const a = h * 15 * RAD, s = sum[k]; s[0] += cd * Math.cos(a); s[1] += cd * Math.sin(a); s[2] += Math.sin(d * RAD); s[3]++;
    }
  }
  const cell = step * step;          // square degrees a sample stands for (equal-area steps)
  middles = sum.map(([x, y, z, c]) => {
    // back from 1875 to 2000: the matrix turns 2000 into 1875, its transpose turns back
    const X = M[0][0] * x + M[1][0] * y + M[2][0] * z, Y = M[0][1] * x + M[1][1] * y + M[2][1] * z, Z = M[0][2] * x + M[1][2] * y + M[2][2] * z, r = Math.hypot(X, Y, Z) || 1;
    return { ra: ((Math.atan2(Y, X) / RAD) + 360) % 360, dec: Math.asin(Z / r) / RAD, radius: Math.sqrt(c * cell / Math.PI) };
  });
  return middles;
}
/** A constellation named in the text (its Latin name, or its name in the language's own table, with or without the word
 *  for constellation): { latin, name, ra, dec, fov } (fov: a width of map that holds it), or null. Null before the list has come. */
export function findConstellation(text, lang) {
  if (!data) return null;
  const q = foldName(text).replace(/takimyildizi|takimyildiz|constellation|sternbild|gwiazdozbior|constelacion/g, '');
  if (q.length < 3) return null;
  const { names } = data.cons;
  const k = names.findIndex(n => foldName(n) === q || Object.values(CON).some(t => t[n] && foldName(t[n]) === q));
  if (k < 0) return null;
  const m = conMiddles()[k], latin = names[k];
  return { latin, name: CON[lang]?.[latin] || latin, ra: m.ra, dec: m.dec, fov: Math.min(80, Math.max(14, 2.8 * m.radius)) };
}

/**
 * Everything that can carry a name, for a moment (ms since 1970) and a place on Earth (for the Moon):
 * [{ name, ra, dec, kind, rank, v, query | target, also }], `rank` the lower the more worth showing, `v` the unit vector,
 * `also` the list's English name of a cluster, nebula or galaxy named otherwise in `lang` (so that it can still be searched for).
 * kind: 'body' (Sun, Moon, planets: named by `say(id)`), 'target' (the site's showcase), 'star', 'deep'.
 */
export function things(ms, lat, lon, targets, say, lang) {
  if (!data) return [];
  const out = [];
  for (const b of wanderers(ms, lat, lon)) out.push({ name: say(b.id), ra: b.ra, dec: b.dec, kind: 'body', rank: b.id === 'sun' || b.id === 'moon' ? -6 : -5 });
  for (const t of targets) out.push({ name: t.label, ra: t.ra, dec: t.dec, kind: 'target', rank: -3, target: t });
  for (const [name, ra, dec, v, query] of data.stars) out.push({ name, ra, dec, kind: 'star', rank: v, query });          // a star's rank is its brightness
  for (const [name, ra, dec, width, query] of data.deep) {          // among the stars of the first magnitude
    const own = DEEP[lang]?.[name];
    out.push({ name: own || name, ra, dec, kind: 'deep', rank: 1.2, query, width, ...(own ? { also: name } : {}) });
  }
  for (const o of out) o.v = vec(o.ra, o.dec);
  // a showcase object that is also on the list of stars or of clusters (the Pleiades, say) is named once, as the showcase
  return out.filter(o => o.kind === 'target' || o.kind === 'body' || !out.some(t => t.kind === 'target' && t.v[0] * o.v[0] + t.v[1] * o.v[1] + t.v[2] * o.v[2] > 0.99996));          // within half a degree
}

/** The cosine of the angle between a thing and a place of the sky. */
export const cosTo = (thing, ra, dec) => { const c = vec(ra, dec); return thing.v[0] * c[0] + thing.v[1] * c[1] + thing.v[2] * c[2]; };
