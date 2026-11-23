/* Thanksgiving state pages: pure logic for counting current DOT alerts by route from a
   MileCheck Worker /incidents payload. No DOM. Browser global: TgCorridors. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.TgCorridors = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Washington's feeds number interstates without a prefix ("005", "SR 5").
  var WA_INTERSTATES = { 5: 1, 82: 1, 90: 1, 182: 1, 205: 1, 405: 1, 705: 1 };

  function reportsOf(payload) {
    if (!payload || typeof payload !== 'object') return [];
    if (Array.isArray(payload)) return payload;
    var r = payload['incident-reports'] ||
      (payload.data && payload.data['incident-reports']) || payload.incidents || [];
    return Array.isArray(r) ? r : [];
  }

  function rawRoute(rep) {
    if (!rep || typeof rep !== 'object') return '';
    var loc = rep.location || {};
    return String(loc['route-id'] || rep['route-id'] || rep.route || '').trim();
  }

  // Display form with a dash between prefix and number: I-5, US-101, SR-99.
  function normalizeRoute(raw, state) {
    var s = String(raw || '').replace(/\s+/g, ' ').trim();
    if (!s) return '';
    var u = s.toUpperCase();
    var m;
    if ((m = /^(?:I|IH|INTERSTATE)[ -]?0*(\d{1,3})([EWNS]?)(?: [NSEW]B)?$/.exec(u))) return 'I-' + m[1] + m[2];
    if ((m = /^(?:US|U\.S\.)[ -]?(?:HWY |HIGHWAY )?0*(\d{1,3}[A-Z]?)$/.exec(u))) return 'US-' + m[1];
    if (state === 'WA') {
      if ((m = /^(?:SR[ -]?)?0*(\d{1,3})$/.exec(u))) return (WA_INTERSTATES[+m[1]] ? 'I-' : 'SR-') + m[1];
    }
    if ((m = /^([A-Z]{1,4})[ -]?0*(\d{1,4}[A-Z]?)$/.exec(u))) return m[1] + '-' + m[2];
    return s;
  }

  // Top n routes by current alert count: [{route, count}], ties broken by route name.
  function topRoutes(payload, state, n) {
    var counts = {};
    reportsOf(payload).forEach(function (rep) {
      var r = normalizeRoute(rawRoute(rep), state);
      if (!r) return;
      counts[r] = (counts[r] || 0) + 1;
    });
    return Object.keys(counts).map(function (k) { return { route: k, count: counts[k] }; })
      .sort(function (a, b) { return (b.count - a.count) || (a.route < b.route ? -1 : a.route > b.route ? 1 : 0); })
      .slice(0, n == null ? 5 : n);
  }

  return { reportsOf: reportsOf, normalizeRoute: normalizeRoute, topRoutes: topRoutes };
});
