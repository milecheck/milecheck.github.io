// Standalone copy of the new-tab rule for pages that don't load site-nav.js (held pass, corridor
// and road-status pages). Keep in step with the block at the end of site-nav.js.
/* Links open in a new tab, sitewide, menu included (Leah 10/21, hard rule 11/2). Skips in-page anchors,
   mail/phone links, and links that already set a target or run page code (data-tab). */
(function () {
  if (typeof document === 'undefined') return;
  function mark(a) {
    if (a.hasAttribute('target') || a.hasAttribute('data-tab') || a.hasAttribute('download')) return;
    var h = a.getAttribute('href') || '';
    if (!h || h.charAt(0) === '#' || /^(mailto:|tel:|sms:|javascript:)/i.test(h)) return;
    a.setAttribute('target', '_blank');
    var r = (a.getAttribute('rel') || '').split(/\s+/);
    if (r.indexOf('noopener') < 0) { r.push('noopener'); a.setAttribute('rel', r.join(' ').trim()); }
  }
  function all(root) { var l = (root || document).querySelectorAll ? (root || document).querySelectorAll('a[href]') : []; for (var i = 0; i < l.length; i++) mark(l[i]); }
  function start() {
    all(document);
    if (window.MutationObserver) new MutationObserver(function (ms) { ms.forEach(function (m) { m.addedNodes.forEach(function (n) { if (n.nodeType === 1) { if (n.matches && n.matches('a[href]')) mark(n); all(n); } }); }); }).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
