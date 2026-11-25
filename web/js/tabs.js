// Inside the Android app, and nowhere else. The app's window lets the page have the whole glass: it tells the page
// how much of each edge is taken (the camera's notch, the bar of the phone's own buttons), and a phone held upright
// gets the app's bar of places along the bottom: the sky, the phone held up to it, the star of a year, today's star.
// This file is read in the page's head, before anything is drawn, so nothing moves when it has run.
(function () {
  var A = window.ChronoApp, h = document.documentElement;
  if (!A) return;
  h.classList.add('in-app');
  // the edges, in the page's own pixels; the app says them again whenever they change (the phone is turned)
  window.__chronoInsets = function (t, r, b, l) {
    h.style.setProperty('--sat', t + 'px'); h.style.setProperty('--sar', r + 'px'); h.style.setProperty('--sab', b + 'px'); h.style.setProperty('--sal', l + 'px');
  };
  try { if (A.insets) window.__chronoInsets.apply(null, String(A.insets()).split(',').map(Number)); } catch (e) { /* an older app: it keeps the page clear of the edges itself */ }

  var q = new URLSearchParams(location.search), page = /\/star\.html$/.test(location.pathname) ? 'star' : /\/play\.html$/.test(location.pathname) ? 'daily' : 'sky';
  var lang = q.get('lang');
  try { lang = lang || localStorage.getItem('chrono-lang'); } catch (e) { /* private mode */ }
  var WORDS = {
    en: ['Sky', 'Point', 'Your year', 'Today’s star'], tr: ['Gökyüzü', 'Göğe tut', 'Yılın yıldızı', 'Günün yıldızı'], de: ['Himmel', 'Zeigen', 'Dein Jahr', 'Stern des Tages'],
    fr: ['Ciel', 'Viser', 'Votre année', 'Étoile du jour'], pl: ['Niebo', 'Wskaż', 'Twój rok', 'Gwiazda dnia'], es: ['Cielo', 'Apuntar', 'Tu año', 'Estrella de hoy'],
  };
  if (!WORDS[lang]) lang = page === 'sky' ? '' : ((navigator.languages || [navigator.language || 'en']).map(function (l) { return l.slice(0, 2).toLowerCase(); }).filter(function (l) { return WORDS[l]; })[0] || '');
  var W = WORDS[lang] || WORDS.en, to = lang ? 'lang=' + lang : '';
  // a phone that can tell where it looks (the same test as js/point.js)
  var canPoint = window.matchMedia('(pointer: coarse)').matches && ('ondeviceorientationabsolute' in window || (window.DeviceOrientationEvent && typeof window.DeviceOrientationEvent.requestPermission === 'function'));
  var ICON = {
    sky: '<path d="M12 3.2l1.9 5.4 5.4 1.9-5.4 1.9L12 17.8l-1.9-5.4-5.4-1.9 5.4-1.9z"/><path d="M18.6 16.4v3.2M17 18h3.2"/>',
    point: '<circle cx="12" cy="12" r="8.6"/><path d="M15.6 8.4l-2.1 5.1-5.1 2.1 2.1-5.1z"/>',
    star: '<rect x="4" y="5.2" width="16" height="14.6" rx="2.4"/><path d="M8 3.2v3.6M16 3.2v3.6M4 9.8h16"/><path d="M12 12.2l.8 1.7 1.9.2-1.4 1.3.4 1.9-1.7-1-1.7 1 .4-1.9-1.4-1.3 1.9-.2z"/>',
    daily: '<circle cx="12" cy="12" r="8.6"/><circle cx="12" cy="12" r="4.6"/><circle cx="12" cy="12" r="1" fill="currentColor"/>',
  };
  var PLACES = [
    ['sky', W[0], './' + (to ? '?' + to : '')],
    ['point', W[1], './?point=1' + (to ? '&' + to : '')],
    ['star', W[2], 'star.html' + (to ? '?' + to : '')],
    ['daily', W[3], 'play.html?daily=1' + (to ? '&' + to : '')],
  ].filter(function (p) { return p[0] !== 'point' || canPoint; });

  // upright phones and small tablets: the same test as the site's one-column layout
  var UPRIGHT = '(max-width: 599px), (max-width: 900px) and (orientation: portrait), (max-width: 900px) and (min-height: 501px)';
  var ON = 'html.in-app:not(.typing) body:not(.touring)';
  var css = document.createElement('style');
  css.textContent =
    '.placesbar{display:none}' +
    '@media ' + UPRIGHT + '{' +
      ON + '{--tabs:calc(58px + var(--sab,0px));padding-bottom:var(--tabs)}' +
      ON + ' .placesbar{display:flex;position:fixed;z-index:75;left:0;right:0;bottom:0;height:calc(58px + var(--sab,0px));box-sizing:border-box;padding:0 6px var(--sab,0px);background:#0d0b0af2;border-top:1px solid #ffffff1f;-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px)}' +
      '.placesbar a{flex:1 1 0;min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;color:#b0a79a;font:500 11px/1.15 "IBM Plex Sans",system-ui,sans-serif;letter-spacing:.01em;text-decoration:none;white-space:nowrap;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none;touch-action:manipulation}' +
      '.placesbar svg{width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round;transition:transform .12s}' +
      '.placesbar a:active svg{transform:scale(.9)}' +
      '.placesbar a[aria-current]{color:#ff7b39}' +
      // the star's and the game's own pages: the bar says where one is and leads everywhere, so their top line (the name, the language) steps aside
      'html.in-app .wrap>header,html.in-app #tool{display:none}' +
      'html.in-app .wrap{padding-top:calc(18px + var(--sat,0px))}' +
    '}' +
    // from one place to the next the new page fades in over the old one and the bar stays where it is (an engine
    // that does not know this at-rule goes from page to page as before)
    '@view-transition{navigation:auto}.placesbar{view-transition-name:placesbar}::view-transition-old(root),::view-transition-new(root){animation-duration:.16s}' +
    // in the app nothing of the page is picked up by a long press, and a touch leaves no grey flash
    'html.in-app{-webkit-tap-highlight-color:transparent;scroll-padding-top:calc(var(--sat,0px) + 8px)}html.in-app body{-webkit-touch-callout:none}html.in-app a,html.in-app button,html.in-app img{-webkit-user-drag:none;user-select:none;-webkit-user-select:none}';
  h.appendChild(css);

  var bar = document.createElement('nav'); bar.className = 'placesbar'; bar.id = 'placesbar';
  bar.innerHTML = PLACES.map(function (p) { return '<a href="' + p[2] + '" data-place="' + p[0] + '"><svg viewBox="0 0 24 24" aria-hidden="true">' + ICON[p[0]] + '</svg><span>' + p[1] + '</span></a>'; }).join('');
  var mark = function () {
    var now = page === 'sky' && document.body && document.body.classList.contains('pointing') ? 'point' : page;
    Array.prototype.forEach.call(bar.children, function (a) { if (a.dataset.place === now) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  };
  bar.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a') : null; if (!a) return;
    try { if (navigator.vibrate) navigator.vibrate(6); } catch (err) { /* no motor */ }
    if (page !== 'sky') return;          // another page: the link is followed
    var btn = document.getElementById('pointbtn'), pointing = document.body.classList.contains('pointing');
    if (a.dataset.place === 'point') { e.preventDefault(); if (!pointing && btn) btn.click(); return; }
    if (a.dataset.place === 'sky') {
      if (pointing && btn) { e.preventDefault(); btn.click(); return; }          // back from the sky above to the map
      var app = document.getElementById('app'), hero = document.getElementById('welcome');
      if (app && app.dataset.panel === 'closed' && (!hero || !hero.hidden)) { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }          // already at the opening
    }
  });
  var seat = function () {
    if (!document.body) return false;
    document.body.appendChild(bar); mark();
    new MutationObserver(mark).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return true;
  };
  if (!seat()) { var wait = new MutationObserver(function () { if (seat()) wait.disconnect(); }); wait.observe(h, { childList: true }); }
  // while something is being typed the keyboard has the bottom of the screen: the bar steps aside
  var typing = function (e) { return e.target && e.target.matches && e.target.matches('input:not([type=range]):not([type=checkbox]):not([type=radio]), textarea'); };
  document.addEventListener('focusin', function (e) { if (typing(e)) h.classList.add('typing'); });
  document.addEventListener('focusout', function (e) { if (typing(e)) h.classList.remove('typing'); });
})();
