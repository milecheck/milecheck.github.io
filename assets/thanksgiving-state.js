/* Thanksgiving state pages (/thanksgiving/<state>/): fills the dates table with live NWS alerts
   for this state and the "corridors to watch" list with live DOT alert counts. Needs
   thanksgiving-advisories.js and thanksgiving-corridors.js first. Feed text only via textContent. */
(function () {
  function start() {
    var A = window.TgAdvisories, C = window.TgCorridors;
    var root = document.getElementById('tg-state');
    if (!A || !C || !root) return;
    var state = root.getAttribute('data-state'), tz = A.stateTimeZone(state);
    var TTL = 10 * 60 * 1000, LAST_DAY = '2026-11-30';
    var rows = [].slice.call(document.querySelectorAll('#tg-dates tr[data-date]'));
    var status = document.getElementById('tg-wx-status');
    var features = [], failed = false, loadedAt = 0;

    function weekOver() { return Date.now() >= A.dayRange(LAST_DAY, tz).end; }

    function renderWx() {
      var now = Date.now();
      rows.forEach(function (row) {
        var cell = row.querySelector('.wx-cell');
        if (!cell) return;
        cell.textContent = '';
        if (failed) { cell.textContent = '—'; return; }
        var list = A.alertsForDay(features, row.getAttribute('data-date'), now, tz);
        if (!list.length) {
          var none = document.createElement('span'); none.className = 'wx-none';
          none.textContent = loadedAt ? 'None in effect now' : 'Checking…';
          cell.appendChild(none); return;
        }
        var wrap = document.createElement('div'); wrap.className = 'wx-chips';
        list.forEach(function (x) {
          var c = document.createElement('span'); c.className = 'wx-chip sev-' + String(x.severity).toLowerCase();
          var b = document.createElement('b'); b.textContent = x.event; c.appendChild(b);
          var area = A.truncate(x.areaDesc, 60);
          c.appendChild(document.createTextNode(' · ' + x.severity + (area ? ' · ' + area : '') + ' · ' + A.formatUntil(x.end, tz)));
          c.title = x.headline || (x.event + (x.areaDesc ? ' — ' + x.areaDesc : ''));
          wrap.appendChild(c);
        });
        cell.appendChild(wrap);
      });
    }

    function cacheGet(k) { try { var j = JSON.parse(sessionStorage.getItem(k) || 'null'); if (j && Date.now() - j.t < TTL) return j; } catch (e) {} return null; }
    function cacheSet(k, v) { try { sessionStorage.setItem(k, JSON.stringify({ t: Date.now(), v: v })); } catch (e) {} }

    function loadWx(force) {
      if (weekOver()) { features = []; failed = false; loadedAt = Date.now(); if (status) status.textContent = 'Thanksgiving week has passed.'; renderWx(); return; }
      var key = 'mc-tg-wx-' + state, c = !force && cacheGet(key);
      if (c) { features = c.v; loadedAt = c.t; failed = false; renderWx(); return; }
      fetch('https://api.weather.gov/alerts/active?area=' + encodeURIComponent(state), { cache: 'no-store', headers: { Accept: 'application/geo+json' } })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (d) {
          features = (d && d.features || []).filter(A.isTravelRelevant).map(function (f) {
            var p = f.properties;
            return { properties: { id: p.id, event: p.event, severity: p.severity, status: p.status, messageType: p.messageType,
              areaDesc: p.areaDesc, headline: p.headline, sent: p.sent, effective: p.effective, onset: p.onset, expires: p.expires, ends: p.ends } };
          });
          loadedAt = Date.now(); failed = false; if (status) status.textContent = ''; cacheSet(key, features); renderWx();
        })
        .catch(function () { failed = true; features = []; if (status) status.textContent = "Couldn't load NWS alerts right now."; renderWx(); });
    }

    var live = document.getElementById('tg-live'), liveList = document.getElementById('tg-live-list');
    function renderRoutes(top) {
      if (!live || !liveList) return;
      liveList.textContent = '';
      if (!top.length) {
        var li0 = document.createElement('li'); li0.className = 'tg-live-none';
        li0.textContent = 'No DOT alerts listed right now.'; liveList.appendChild(li0);
      } else {
        top.forEach(function (t) {
          var li = document.createElement('li');
          var b = document.createElement('b'); b.textContent = t.route; li.appendChild(b);
          li.appendChild(document.createTextNode(' · ' + t.count + (t.count === 1 ? ' alert' : ' alerts')));
          liveList.appendChild(li);
        });
      }
      live.hidden = false;
    }
    function loadRoutes(force) {
      var key = 'mc-tg-dot-' + state, c = !force && cacheGet(key);
      if (c) { renderRoutes(c.v); return; }
      fetch('https://milepost-proxy.leahgerber93.workers.dev/incidents?state=' + encodeURIComponent(state), { cache: 'no-store' })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (d) { var top = C.topRoutes(d, state, 5); cacheSet(key, top); renderRoutes(top); })
        .catch(function () { if (live) live.hidden = true; });
    }

    function refresh(force) { loadWx(force); loadRoutes(force); }
    renderWx();
    refresh(false);
    setInterval(renderWx, 60 * 1000);
    setInterval(function () { if (!document.hidden) refresh(true); }, TTL);
    document.addEventListener('visibilitychange', function () { if (!document.hidden && Date.now() - loadedAt >= TTL) refresh(true); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
