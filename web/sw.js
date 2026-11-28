// What is kept on this device. Always: the site's own pages and code, as one set per version, so that it opens at
// once and never mixes old files with new ones. Only where the visitor asked for it (the tour saved for use without
// a connection, which a desk does by itself and a phone on request): the sky-map tiles and the objects' data, too.
// Without that, those come through the browser's own cache, which has a fixed size and which the device may empty.
// Measured on 25 November 2026 in the Android app: five minutes of ordinary use left 36 MB here and 20 MB more in
// the browser's cache, with no limit in bytes on the tiles; now a phone that asked for nothing keeps about 5 MB.

// VERSION is replaced with the commit id when the site is published, so every release is its own set.
const VERSION = 'dev-263';
const SHELL = `chrono-shell-${VERSION}`, DATA = 'chrono-data-v2', TILES = 'chrono-tiles-v1', LOOKUP = 'chrono-lookup-v1';
const KEPT = 'chrono-keep-v1';          // this cache holds nothing: that it exists says the visitor asked for things to be kept
const KEEP = new Set([SHELL, DATA, TILES, LOOKUP, KEPT, 'chrono-live-v1']);
const SHELL_FILES = ['./', 'opening.jpg', 'hero-barnard.webp', 'hero-barnard.jpg', 'css/style.css', 'css/icons.css', 'css/fonts.css', 'config.js', 'js/look.js', 'https://cdn.jsdelivr.net/npm/aladin-lite@3.8.2/dist/aladin.js', 'data/targets.json', 'data/years.json', 'data/spectra.json',
  'js/app.js', 'js/lang.js', 'js/lang/tr.js', 'js/lang/es.js', 'js/lang/de.js', 'js/lang/fr.js', 'js/lang/pl.js', 'js/core.js', 'js/plot.js', 'js/sky.js', 'js/info.js', 'js/tour.js', 'js/guide.js', 'js/glossary.js', 'js/pages.js', 'js/pages/tr.js', 'js/pages/es.js', 'js/pages/de.js', 'js/pages/fr.js', 'js/pages/pl.js', 'js/archive.js', 'js/movers.js', 'js/bodies.js', 'js/rice.js', 'js/healpix.js', 'js/years.js', 'js/point.js', 'js/names.js', 'js/topics.js', 'js/ephem.js', 'js/magnet.js', 'data/sky.json', 'js/tabs.js', 'star.html', 'play.html', 'tonight.html', 'data/conlines.json',
  'studio.html', 'css/studio.css', 'js/studio/ui.js', 'js/studio/words.js', 'js/studio/guide.js', 'js/studio/guidewords.js', 'js/studio/settings.js', 'js/studio/marks.js', 'js/studio/view.js', 'js/studio/files.js', 'js/studio/recipes.js', 'js/studio/render.js', 'js/studio/process.js', 'js/studio/cube.js', 'js/studio/geom.js', 'js/studio/worker.js', 'img/studio-apod.webp',
  'planet-x.html', 'tr/planet-x.html', 'es/planet-x.html', 'de/planet-x.html', 'fr/planet-x.html', 'pl/planet-x.html', 'img/pluto-blink.gif',
  'fonts/IBMPlexMono-400-latin-ext.woff2', 'fonts/IBMPlexMono-400-latin.woff2', 'fonts/IBMPlexMono-500-latin-ext.woff2', 'fonts/IBMPlexMono-500-latin.woff2', 'fonts/IBMPlexSans-400-latin-ext.woff2', 'fonts/IBMPlexSans-400-latin.woff2', 'fonts/IBMPlexSans-500-latin-ext.woff2', 'fonts/IBMPlexSans-500-latin.woff2', 'fonts/IBMPlexSans-600-latin-ext.woff2', 'fonts/IBMPlexSans-600-latin.woff2', 'fonts/InstrumentSerif-400-latin-ext.woff2', 'fonts/InstrumentSerif-400-latin.woff2', 'fonts/InstrumentSerif-400i-latin-ext.woff2', 'fonts/InstrumentSerif-400i-latin.woff2'];

// The sky maps describe themselves in a small "properties" file that the map asks for before anything
// else, on the very first visit, before this worker is in charge. Fetch them here so the map can start
// without a connection, and quickly with one.
const HIPS = 'https://irsa.ipac.caltech.edu/data/hips';
const MAPS = [`${HIPS}/SPHEREx/spherex_allsky_cube`, `${HIPS}/CDS/2MASS/Color`, `${HIPS}/CDS/AllWISE/RGB-W4-W2-W1`, `${HIPS}/CDS/DSS2/color`];
const MAP_FILES = [...MAPS.map(m => `${m}/properties`), `${MAPS[0]}/Moc.fits`];

let askedFor = 0;          // when this version began to arrive: a moment after the page that asked for it was opened
self.addEventListener('install', e => {
  askedFor = Date.now();
  // Only the site's own files hold up a new version; they come from one place and arrive together. Each is checked
  // with the server ("no-cache"), so a file the page has just fetched itself is confirmed, not downloaded twice.
  e.waitUntil(caches.open(SHELL).then(c => Promise.all(SHELL_FILES.map(f => c.add(new Request(f, { cache: 'no-cache' })).catch(() => null))))
    .then(() => self.skipWaiting()));
});
/** A page that was opened under the older version runs that version's code until it is loaded again. Such a page reloads
 *  itself when the new version turns up within its first seconds and nothing has been pressed; one that was pressed
 *  stayed on the old site for the whole visit (26 Nov 2026: someone told "it is changed now" who presses the star's card
 *  at once would have seen the old words). So the map's page, where it is the one being looked at and still the old
 *  one a moment after this version took over, is loaded again from here, once: what it shows is in its address. Not
 *  the game or the other pages (a level under way would be lost), not a tab in the background, and not where this
 *  version took long to arrive (a visit well under way is left alone, as before). */
async function loadAgain(ids, tool) {
  await new Promise(done => setTimeout(done, 1500));          // the page's own reload comes first where it applies
  const now = await self.clients.matchAll({ type: 'window' }).catch(() => []);
  await Promise.all(now.filter(c => ids.has(c.id) && c.visibilityState === 'visible' && tool(c.url)).map(c => c.navigate(c.url).catch(() => null)));
}
self.addEventListener('activate', e => {
  let again = null;
  const tool = u => /\/(index\.html)?$/.test(new URL(u).pathname);          // the map's page itself
  e.waitUntil((async () => {
    const ks = await caches.keys(), older = ks.some(k => k.startsWith('chrono-shell-') && k !== SHELL);
    const before = new Set((await self.clients.matchAll({ type: 'window', includeUncontrolled: true }).catch(() => [])).map(c => c.id));
    await Promise.all(ks.filter(k => k.startsWith('chrono-') && !KEEP.has(k)).map(k => caches.delete(k)));
    await self.clients.claim();
    if (older && askedFor && Date.now() - askedFor < 15000) again = before;
    // The archive can be slow to answer, so its small map files are fetched after taking over, not before.
    const c = await caches.open(LOOKUP);
    await Promise.all(MAP_FILES.map(f => c.match(f).then(hit => hit || c.add(f)).catch(() => null)));
  })().then(() => {
    // Not waited for: a page asked to load again asks this worker for its files, and a worker still taking over keeps
    // such requests waiting, so the two would wait for each other (tried on 26 Nov 2026: the page stood empty for five minutes).
    if (again) loadAgain(again, tool).catch(() => null);
  }));
});

const storable = r => r && r.ok && r.status === 200 && (r.type === 'basic' || r.type === 'cors');

/** A slow or failing archive should not leave holes in the map: give up after a while and try once more. */
async function patientFetch(req, tries, timeoutMs) {
  let last;
  for (let i = 0; i < tries; i++) {
    const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), timeoutMs);
    try {
      const r = await fetch(req, { signal: ctl.signal });
      clearTimeout(timer);
      if (r.status < 500) return r;
      last = r;
    } catch (err) { clearTimeout(timer); last = err; if (!self.navigator.onLine) break; }
  }
  if (last instanceof Response) return last;
  throw last;
}

let keeping = null, askedAt = 0;
/** Did the visitor ask for things to be kept on this device? Asked of the storage at most every few seconds. */
async function keeps() {
  if (keeping === null || Date.now() - askedAt > 4000) { askedAt = Date.now(); keeping = await caches.has(KEPT).catch(() => false); }
  return keeping;
}
/** From this device if it is here; otherwise fetched, and kept: always, or only where the visitor asked for that. */
async function cacheFirst(req, name, limit, always) {
  const hit = await caches.match(req, { ignoreVary: true });          // any of our caches
  if (hit) return hit;
  const r = limit ? await patientFetch(req, 2, 15000) : await fetch(req);
  if (storable(r) && (always || await keeps())) {
    const c = await caches.open(name);
    c.put(req, r.clone());
    if (limit && Math.random() < 0.02) c.keys().then(ks => ks.slice(0, Math.max(0, ks.length - limit)).forEach(k => c.delete(k)));
  }
  return r;
}
/** The page and its code are stored as one set per version, so a slow connection can never mix
 *  new files with old ones. A new version is fetched whole, then takes over. */
async function shell(req) {
  const c = await caches.open(SHELL);
  const hit = await c.match(req, { ignoreSearch: req.mode === 'navigate', ignoreVary: true });
  if (hit) return hit;
  const r = await fetch(req);
  if (storable(r)) c.put(req, r.clone());
  return r;
}
async function networkFirst(req, name, timeoutMs) {
  const c = await caches.open(name);
  try {
    const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), timeoutMs);
    const r = await fetch(req, { signal: ctl.signal });
    clearTimeout(timer);
    if (storable(r)) c.put(req, r.clone());
    return r;
  } catch (err) {
    const hit = await caches.match(req, { ignoreVary: true, ignoreSearch: req.mode === 'navigate' });
    if (hit) return hit;
    throw err;
  }
}

/** Answer from storage straight away and refresh the stored copy in the background.
 *  When a sky map announces a new release, its stored tiles are dropped so the new ones are fetched. */
async function freshLater(req) {
  const c = await caches.open(LOOKUP), hit = await c.match(req.url);
  const refresh = fetch(req.url).then(async r => {
    if (!storable(r)) return r;
    if (hit && req.url.endsWith('/properties')) {
      const date = t => (t.match(/hips_release_date\s*=\s*(\S+)/) || [])[1];
      const [was, now] = await Promise.all([hit.clone().text(), r.clone().text()]);
      if (date(was) && date(now) && date(was) !== date(now)) await caches.delete(TILES);
    }
    await c.put(req.url, r.clone());
    return r;
  });
  if (hit) { refresh.catch(() => null); return hit.clone(); }
  return refresh;
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || req.headers.has('range')) return;        // partial reads of FITS files go straight to the network
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    if (url.pathname.includes('/__live/')) return;
    if (/\/index\/manifest\.json$/.test(url.pathname)) e.respondWith(networkFirst(req, LOOKUP, 4000));        // says whether the sky index was rebuilt
    else if (/\/(stars|game)\//.test(url.pathname)) return;                // pictures of the star pages and of the game: the browser's own cache is enough
    else if (/\/(fonts|vendor)\//.test(url.pathname)) e.respondWith(cacheFirst(req, DATA, 0, true));
    else if (/\/(data\/[^/]+\/|index\/c\/)/.test(url.pathname)) e.respondWith(cacheFirst(req, DATA));   // big, versioned by their address: kept where asked
    else e.respondWith(shell(req));                                    // the page and its code: one consistent set
    return;
  }
  if (url.hostname === 'cdn.jsdelivr.net' && url.pathname.startsWith('/npm/aladin-lite@')) {
    e.respondWith(cacheFirst(req, DATA, 0, true));                     // the map library, at a fixed version: never changes
    return;
  }
  if (url.hostname === 'irsa.ipac.caltech.edu' && url.pathname.startsWith('/data/hips/')) {
    if (/\/(properties|Moc\.fits)$/.test(url.pathname)) e.respondWith(freshLater(req));     // answer at once, refresh behind the scenes
    else e.respondWith(cacheFirst(req, TILES, 1500));                   // tiles of one release never change: kept where asked (the tour is some 700)
    return;
  }
  if (/simbad|wikipedia\.org|wikimedia\.org|cds\.unistra\.fr|cfa\.harvard\.edu|imcce\.fr/.test(url.hostname)) {
    e.respondWith(networkFirst(req, LOOKUP, 7000));                     // names, types, encyclopedia cards
  }
});
