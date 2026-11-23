/* Thanksgiving table weather alerts: pure logic for picking which National Weather Service
   alerts (api.weather.gov /alerts/active) belong on which day row. No DOM here, so Node tests
   can require it; the page script does the fetching and rendering. Browser global: TgAdvisories. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.TgAdvisories = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var DEFAULT_TZ = 'America/Los_Angeles';

  // Primary time zone per state, used to decide where a calendar day starts and ends.
  var STATE_TZ = {
    AL: 'America/Chicago', AK: 'America/Anchorage', AZ: 'America/Phoenix', AR: 'America/Chicago',
    CA: 'America/Los_Angeles', CO: 'America/Denver', CT: 'America/New_York', DE: 'America/New_York',
    DC: 'America/New_York', FL: 'America/New_York', GA: 'America/New_York', HI: 'Pacific/Honolulu',
    ID: 'America/Boise', IL: 'America/Chicago', IN: 'America/Indiana/Indianapolis', IA: 'America/Chicago',
    KS: 'America/Chicago', KY: 'America/New_York', LA: 'America/Chicago', ME: 'America/New_York',
    MD: 'America/New_York', MA: 'America/New_York', MI: 'America/Detroit', MN: 'America/Chicago',
    MS: 'America/Chicago', MO: 'America/Chicago', MT: 'America/Denver', NE: 'America/Chicago',
    NV: 'America/Los_Angeles', NH: 'America/New_York', NJ: 'America/New_York', NM: 'America/Denver',
    NY: 'America/New_York', NC: 'America/New_York', ND: 'America/Chicago', OH: 'America/New_York',
    OK: 'America/Chicago', OR: 'America/Los_Angeles', PA: 'America/New_York', RI: 'America/New_York',
    SC: 'America/New_York', SD: 'America/Chicago', TN: 'America/Chicago', TX: 'America/Chicago',
    UT: 'America/Denver', VT: 'America/New_York', VA: 'America/New_York', WA: 'America/Los_Angeles',
    WV: 'America/New_York', WI: 'America/Chicago', WY: 'America/Denver'
  };

  function stateTimeZone(code) {
    return STATE_TZ[String(code || '').toUpperCase()] || DEFAULT_TZ;
  }

  // Never shown: marine-only, air quality, fire weather, agricultural frost/freeze, statements.
  var EXCLUDE_RE = /small craft|gale|hazardous seas|beach hazard|rip current|marine|brisk wind|hurricane force wind|lake wind|low water|air quality|air stagnation|red flag|fire weather|frost advisory|freeze (warning|watch)|special weather statement|^storm (warning|watch)$/i;
  // Driving-relevant hazards.
  var INCLUDE_RE = /winter|ice storm|blizzard|freezing|snow|wind|fog|flood|avalanche|dust|extreme cold|cold weather|wind chill|tropical|hurricane|typhoon|storm surge/i;

  function isTravelRelevant(feature) {
    var p = feature && feature.properties;
    if (!p || typeof p.event !== 'string') return false;
    if (p.status !== 'Actual') return false;
    if (p.messageType === 'Cancel') return false;
    var ev = p.event.trim();
    if (EXCLUDE_RE.test(ev)) return false;
    return INCLUDE_RE.test(ev);
  }

  function toMs(v) {
    if (!v) return null;
    var t = Date.parse(v);
    return isNaN(t) ? null : t;
  }

  // start = onset || effective || sent; end = ends (hazard ends) || expires (message expires).
  function alertWindow(props) {
    props = props || {};
    var start = toMs(props.onset);
    if (start === null) start = toMs(props.effective);
    if (start === null) start = toMs(props.sent);
    var end = toMs(props.ends);
    if (end === null) end = toMs(props.expires);
    return { start: start === null ? -Infinity : start, end: end === null ? Infinity : end };
  }

  var dtfCache = {};
  function partsIn(ms, tz) {
    var f = dtfCache[tz] || (dtfCache[tz] = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }));
    var o = {};
    f.formatToParts(new Date(ms)).forEach(function (x) { if (x.type !== 'literal') o[x.type] = +x.value; });
    if (o.hour === 24) o.hour = 0;
    return o;
  }

  // Milliseconds to add to UTC to get wall-clock time in tz at instant ms.
  function tzOffset(ms, tz) {
    var p = partsIn(ms, tz);
    var asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
    return asUtc - Math.floor(ms / 1000) * 1000;
  }

  // UTC instant of local midnight for y-m-d in tz (DST-safe two-pass offset trick).
  function localMidnight(y, m, d, tz) {
    var guess = Date.UTC(y, m - 1, d);
    var off1 = tzOffset(guess, tz);
    var t = guess - off1;
    var off2 = tzOffset(t, tz);
    if (off2 !== off1) t = guess - off2;
    return t;
  }

  // Start (inclusive) and end (exclusive) of the calendar day isoDate ('2026-11-24') in tz.
  function dayRange(isoDate, tz) {
    tz = tz || DEFAULT_TZ;
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(isoDate));
    if (!m) throw new Error('bad date: ' + isoDate);
    var y = +m[1], mo = +m[2], d = +m[3];
    var next = new Date(Date.UTC(y, mo - 1, d + 1));
    return {
      start: localMidnight(y, mo, d, tz),
      end: localMidnight(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate(), tz)
    };
  }

  var SEVERITY_RANK = { Extreme: 0, Severe: 1, Moderate: 2, Minor: 3, Unknown: 4 };
  function sevRank(s) { return Object.prototype.hasOwnProperty.call(SEVERITY_RANK, s) ? SEVERITY_RANK[s] : 4; }

  // Travel-relevant alerts still in effect at `now` whose window overlaps the day.
  function alertsForDay(features, isoDate, now, tz) {
    var day = dayRange(isoDate, tz);
    var byKey = {};
    (features || []).forEach(function (f) {
      if (!isTravelRelevant(f)) return;
      var p = f.properties;
      var w = alertWindow(p);
      if (!(w.end > now)) return;
      if (!(w.start < day.end && w.end > day.start)) return;
      var key = p.event + '|' + (p.areaDesc || '');
      var item = { event: p.event, severity: p.severity || 'Unknown', areaDesc: p.areaDesc || '',
        headline: p.headline || '', start: w.start, end: w.end, id: p.id || f.id || key };
      var prev = byKey[key];
      if (!prev || item.end > prev.end) byKey[key] = item;
    });
    return Object.keys(byKey).map(function (k) { return byKey[k]; }).sort(function (a, b) {
      return (sevRank(a.severity) - sevRank(b.severity)) || (a.start - b.start);
    });
  }

  var fmtCache = {};
  function formatUntil(endMs, tz) {
    tz = tz || DEFAULT_TZ;
    if (!isFinite(endMs)) return 'until further notice';
    var f = fmtCache[tz] || (fmtCache[tz] = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short'
    }));
    var o = {};
    f.formatToParts(new Date(endMs)).forEach(function (x) { if (x.type !== 'literal') o[x.type] = x.value; });
    return 'until ' + o.month + ' ' + o.day + ', ' + o.hour + ':' + o.minute + ' ' + (o.dayPeriod || '') +
      (o.timeZoneName ? ' ' + o.timeZoneName : '');
  }

  function truncate(s, n) {
    s = String(s || '');
    return s.length > n ? s.slice(0, n - 1).replace(/[\s;,]+$/, '') + '…' : s;
  }

  return {
    DEFAULT_TZ: DEFAULT_TZ, STATE_TZ: STATE_TZ, stateTimeZone: stateTimeZone,
    isTravelRelevant: isTravelRelevant, alertWindow: alertWindow, dayRange: dayRange,
    alertsForDay: alertsForDay, formatUntil: formatUntil, truncate: truncate
  };
});
