/* Canonical site navigation. Homepage data-tab and download handlers keep owning their actions. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.MCSiteNav = factory(); root.MCSiteNav.init(root.document, root); }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  function activeSection(pathname, hash) {
    var path = ('/' + (pathname || '/').replace(/^\/+/, '')).replace(/\/index\.html$/, '/');
    if (path === '/' || path === '/index.html') {
      if (hash === '#pricing') return 'pricing';
      if (hash === '#story') return 'story';
      return 'home';
    }
    if (/^\/(?:es\/|pt\/)?cameras(?:\/|$)/.test(path)) return 'cameras';
    if (/^\/canada(?:\/|$)/.test(path) || /^\/road-conditions\/(?:british-columbia|alberta|manitoba|ontario|quebec|new-brunswick|nova-scotia|newfoundland|yukon|northwest-territories)(?:\/|$)/.test(path)) return 'canada';
    if (/^\/(?:states|road-conditions)(?:\/|$)/.test(path)) return 'states';
    if (/^\/(?:maps|closures|fire|borders|ferries|passes|grades|corridors|bridges|mountains|mountain-roads|enchantments-roads)(?:\/|$)/.test(path)) return 'maps';
    if (/^\/(?:partners|api)(?:\/|$)/.test(path)) return 'b2b';
    if (/^\/blog(?:\/|$)/.test(path)) return 'blog';
    if (/^\/search(?:\/|$)/.test(path)) return 'search';
    if (/^\/get(?:\/|$)/.test(path)) return 'get';
    return '';
  }
  function init(doc, win) {
    if (!doc || !win) return;
    var header = doc.querySelector('[data-site-nav]');
    if (!header || header.getAttribute('data-nav-bound') === 'true') return;
    var button = header.querySelector('.mc-nav-toggle'), nav = header.querySelector('.mc-primary-nav');
    if (!button || !nav) return;
    header.setAttribute('data-nav-bound', 'true');
    // Footer link to the business data page on every page that carries the shared nav.
    try {
      var here = (win.location.pathname || '').replace(/\/index\.html$/, '/');
      var foot = doc.querySelector('.site-footer');
      if (foot && here.indexOf('/api/plan/') !== 0 && !foot.querySelector('a[href="/api/plan/"]')) {
        var lists = foot.querySelectorAll('.footer-list');
        var host = lists.length ? lists[lists.length - 1] : null;
        if (host) {
          var li = doc.createElement('li'), a = doc.createElement('a');
          a.href = '/api/plan/'; a.textContent = 'For businesses: API and data';
          li.appendChild(a); host.insertBefore(li, host.firstChild);
        }
      }
    } catch (e) { /* the footer link is optional */ }
    var links = Array.prototype.slice.call(nav.querySelectorAll('[data-nav-link]'));
    function syncActive() {
      var section = activeSection(win.location.pathname, win.location.hash);
      links.forEach(function (link) {
        if (link.getAttribute('data-nav-link') === section) link.setAttribute('aria-current', section === 'pricing' || section === 'story' ? 'location' : 'page');
        else link.removeAttribute('aria-current');
      });
    }
    function setOpen(open, focus) {
      header.setAttribute('data-nav-open', open ? 'true' : 'false');
      button.setAttribute('aria-expanded', open ? 'true' : 'false');
      button.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
      if (focus) { if (open && links[0]) links[0].focus(); else button.focus(); }
    }
    function isOpen() { return header.getAttribute('data-nav-open') === 'true'; }
    header.setAttribute('data-nav-ready', 'true');
    setOpen(false); syncActive();
    button.addEventListener('click', function () { setOpen(!isOpen(), !isOpen()); });
    button.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowDown') { event.preventDefault(); setOpen(true, true); }
    });
    nav.addEventListener('click', function (event) {
      if (!event.target.closest || !event.target.closest('a[href]')) return;
      setOpen(false);
      // Homepage's delegated data-tab handler may replace the hash later in this click.
      Promise.resolve().then(syncActive);
    });
    doc.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && isOpen()) { event.preventDefault(); setOpen(false, true); }
    });
    doc.addEventListener('pointerdown', function (event) { if (isOpen() && !header.contains(event.target)) setOpen(false); });
    doc.addEventListener('click', function (event) {
      if (isOpen() && !header.contains(event.target)) setOpen(false);
      // The home logo and footer tabs also call replaceState, which emits no hashchange.
      if (event.target.closest && event.target.closest('[data-tab]') && !nav.contains(event.target)) Promise.resolve().then(syncActive);
    });
    doc.addEventListener('focusin', function (event) { if (isOpen() && !header.contains(event.target)) setOpen(false); });
    win.addEventListener('hashchange', syncActive);
    win.addEventListener('popstate', syncActive);
    if (win.matchMedia) {
      var mobile = win.matchMedia('(max-width:1152px)');
      var resize = function () { if (!mobile.matches) setOpen(false); };
      if (mobile.addEventListener) mobile.addEventListener('change', resize);
      else if (mobile.addListener) mobile.addListener(resize);
    }
    return { syncActive: syncActive, close: function () { setOpen(false); } };
  }
  return { activeSection: activeSection, init: init };
});

/* Phone app bar (Leah 10/20, modeled on thedyrt.com). Phones only, after 8 s or 25% scroll,
   dismiss remembered 14 days. Ratings read from the live listings on 2026-10-20; refresh by hand. */
(function () {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  var w = window, d = document, ua = navigator.userAgent || '';
  var ios = /iphone|ipod/i.test(ua) || (/ipad/i.test(ua)), android = /android/i.test(ua);
  if (!ios && !android) return;
  if (w.matchMedia && !w.matchMedia('(max-width: 768px)').matches) return;
  if (/^\/(sponsor|partners|api|fleets|data-sources|boards|internal|tv|get)(\/|$)/.test(location.pathname)) return;
  var KEY = 'mcAppBarHide';
  try { var t = +localStorage.getItem(KEY); if (t && Date.now() - t < 14 * 864e5) return; } catch (e) {}
  var slug = (location.pathname.replace(/^\/|\/$/g, '').replace(/\.html$/, '').replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'home').slice(0, 40);
  var store = ios ? 'https://apps.apple' + '.com/app/apple-store/id6759212851?pt=128447811&ct=sticky-' + slug + '&mt=8'
                  : 'https://play.google' + '.com/store/apps/details?id=app.milecheck.mobile&referrer=utm_source%3Dsite%26utm_medium%3Dsticky%26utm_campaign%3D' + slug;
  var rating = ios ? 'App Store 4.3 ★ (12 ratings)' : 'Google Play 5.0 ★ (12 reviews)';
  var shown = false;
  function show() {
    if (shown) return; shown = true;
    var css = d.createElement('style');
    css.textContent = '#mc-appbar{position:fixed;left:8px;right:8px;bottom:8px;z-index:9000;display:flex;align-items:center;gap:10px;padding:10px 10px 10px 12px;background:#16181a;color:#fff;border-radius:14px;box-shadow:0 6px 24px rgba(0,0,0,.28);font:14px/1.25 -apple-system,BlinkMacSystemFont,"Inter",sans-serif;transform:translateY(130%);transition:transform .3s ease}#mc-appbar.on{transform:none}#mc-appbar img{width:40px;height:40px;border-radius:9px;flex:none}#mc-appbar .t{flex:1;min-width:0}#mc-appbar .t b{display:block;font-weight:650}#mc-appbar .t span{display:block;font-size:12px;opacity:.8;margin-top:2px}#mc-appbar a.go{flex:none;display:inline-flex;align-items:center;min-height:44px;padding:0 16px;background:#00c880;color:#0e1116;font-weight:700;border-radius:10px;text-decoration:none}#mc-appbar button{flex:none;width:32px;height:44px;background:none;border:0;color:#fff;font-size:20px;opacity:.7;cursor:pointer}';
    d.head.appendChild(css);
    var bar = d.createElement('div'); bar.id = 'mc-appbar'; bar.setAttribute('role', 'complementary'); bar.setAttribute('aria-label', 'Get the MileCheck app');
    bar.innerHTML = '<img src="/images/favicon.png" alt="" width="40" height="40"><div class="t"><b>Mile markers and road alerts on your phone</b><span></span></div><a class="go" rel="noopener">Get the app</a><button type="button" aria-label="Close">×</button>';
    bar.querySelector('.t span').textContent = rating;
    bar.querySelector('a.go').href = store;
    bar.querySelector('button').onclick = function () { bar.classList.remove('on'); try { localStorage.setItem(KEY, String(Date.now())); } catch (e) {} setTimeout(function () { bar.remove(); }, 350); };
    d.body.appendChild(bar);
    requestAnimationFrame(function () { requestAnimationFrame(function () { bar.classList.add('on'); }); });
  }
  setTimeout(show, 8000);
  w.addEventListener('scroll', function onS() { var h = d.documentElement; if (h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight) >= 0.25) { w.removeEventListener('scroll', onS); show(); } }, { passive: true });
})();
