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
