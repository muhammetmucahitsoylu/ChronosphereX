// The site's colours as the visitor chose them in Settings (top right), kept on this device and put on the page before
// anything is drawn: read in the head of every page. "night" (a blue-black, 27 Nov 2026) is the one the stylesheets
// carry; the others are laid over it as the page's own values. The orange stays the same in all of them: it is the
// site's own colour.
(function () {
  var LOOKS = {
    night: null,
    coffee: { bg: '#0a0908', surface: '#141210', 'surface-2': '#1e1b18', raised: '#1c1916', line: '#2f2a25', 'line-2': '#453d35', track: '#3a332c', ink: '#f3eee6', 'ink-soft': '#e2dbcf', 'ink-2': '#b0a79a', 'ink-3': '#8a8175' },
    graphite: { bg: '#0e0e0f', surface: '#161618', 'surface-2': '#212124', raised: '#1d1d20', line: '#2e2e32', 'line-2': '#4a4a50', track: '#38383d', ink: '#f2f2f3', 'ink-soft': '#e0e0e3', 'ink-2': '#b2b2b8', 'ink-3': '#8b8b92' }
  };
  var NAMES = ['bg', 'surface', 'surface-2', 'raised', 'line', 'line-2', 'track', 'ink', 'ink-soft', 'ink-2', 'ink-3'];
  var KEY = 'chrono-look', h = document.documentElement, BG = '#0a0d13';
  function apply(name) {
    var t = LOOKS.hasOwnProperty(name) ? name : 'night', set = LOOKS[t];
    h.setAttribute('data-look', t);
    for (var i = 0; i < NAMES.length; i++) { if (set) h.style.setProperty('--' + NAMES[i], set[NAMES[i]]); else h.style.removeProperty('--' + NAMES[i]); }
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', set ? set.bg : BG);
  }
  var chosen = 'night';
  try { chosen = localStorage.getItem(KEY) || 'night'; } catch (e) { /* private mode: the default */ }
  apply(chosen);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { apply(h.getAttribute('data-look')); });          // the theme-color tag, if it came after this script
  window.__chronoLook = function (name) {
    if (name === undefined) return h.getAttribute('data-look');
    try { if (name === 'night') localStorage.removeItem(KEY); else localStorage.setItem(KEY, name); } catch (e) { /* private mode: this page only */ }
    apply(name);
    return h.getAttribute('data-look');
  };
})();
