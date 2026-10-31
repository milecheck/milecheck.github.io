/* map-kit.js: phone behavior for the live map (#comap). Pairs with map-kit.css.
   Leah, 2026-10-03: "the camera maps are clunky on mobile view".
   1. Layers panel pops out from a small icon button in the left control column
      (option C on design-options/map-layers.html, Leah 10-03). The button alone opens
      and closes it; nothing inside the panel closes it (an x read as "taking the
      layers away"). The panel opens level with the button with a pointer to it, and
      on phones, where it starts closed, the button pulses three times so people
      know it opens. The map (on phones) and Esc also close it. Leah, 10-03: the "Map layers" pill "is still
      huge ... we should be able to pop out and/or collapse".
   2. The credit line is one line on phones; tap it to read all of it.
   3. A near-me button under the zoom control, every width. A statewide map is 900
      dots; someone searching "odot cameras" on a phone wants the ones around them.
      The position stays in the browser. Nothing is sent anywhere.
   Each page declares `const map` in its own inline script, which runs before this
   deferred file. If a page has no map, this does nothing. */

/* 0. Every Leaflet map on the page, for the sections that work on any map (full screen).
   Most pages declare `map` where this file can read it. The road-conditions, closures,
   corridor, ferry and Canada pages build theirs inside a function of their own, where no
   other script can see it (Leah, 2026-10-16: full screen was missing there). Leaflet
   answers a window resize by calling invalidateSize on every map it made, so one resize
   names them all (pinned to leaflet@1.9.4, which every page loads). Maps made later, after
   a page's own fetch, are caught as they are created. No page has to change. */
(function () {
  if (typeof L === 'undefined' || !L.Map || window.MCMaps) return;
  var maps = [], subs = [];
  function add(m) {
    if (!m || maps.indexOf(m) >= 0) return;
    maps.push(m);
    subs.forEach(function (f) { try { f(m); } catch (e) {} });
  }
  window.MCMaps = { each: function (f) { subs.push(f); maps.slice().forEach(function (m) { try { f(m); } catch (e) {} }); } };
  try { if (typeof map !== 'undefined' && map instanceof L.Map) add(map); } catch (e) {}
  L.Map.addInitHook(function () { var m = this; setTimeout(function () { add(m); }, 0); });
  var P = L.Map.prototype, size = P.invalidateSize;
  P.invalidateSize = function () { add(this); return size.apply(this, arguments); };
  if (document.querySelectorAll('.leaflet-container').length > maps.length) window.dispatchEvent(new Event('resize'));
})();

(function () {
  // 2. Credit line, on every Leaflet map on the page (any template): tap to read all of
  // it. Delegated, so maps created after this file runs are covered too.
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('.leaflet-control-attribution');
    if (!a || e.target.closest('a')) return;
    a.classList.toggle('cm-open');
  });


  // ---- Any Leaflet map whose page declares `const map` (all templates) ----------------
  var gm = (typeof map !== 'undefined' && typeof L !== 'undefined' && map instanceof L.Map) ? map : null;
  var phoneQ = window.matchMedia('(max-width:600px)');

  // 4. Popups stay open. Several maps (closures, chains, grades, weather, fire) reload
  // their markers on every map move. A popup's own pan, or the fly-to on tap, counted as
  // a move, and the reload wiped the marker and its popup within half a second (Leah,
  // 10-03: "the flash up of the detail ... is too short"). While a popup is open, the
  // page's own move/zoom handlers wait, and run once when it closes. Leaflet's internal
  // handlers (tiles, renderers, controls) are never held: they carry a context or are
  // L.Map methods. Pinned to leaflet@1.9.4's _events layout, which every page loads.
  if (gm && gm._events && !gm._mcHold) {
    gm._mcHold = true;
    var held = [];
    var internal = function (fn) { for (var k in L.Map.prototype) { if (L.Map.prototype[k] === fn) return true; } return false; };
    var popupOpen = function () { return !!(gm._popup && gm.hasLayer(gm._popup)); };
    var hold = function () {
      ['moveend', 'zoomend'].forEach(function (type) {
        (gm._events[type] || []).forEach(function (h) {
          if (h.ctx || h.fn._mcHeld || internal(h.fn)) return;
          var fn = h.fn;
          h.fn = function (e) { if (popupOpen()) { if (held.indexOf(fn) < 0) held.push(fn); return; } return fn.call(this, e); };
          h.fn._mcHeld = true;
        });
      });
    };
    hold();
    window.addEventListener('load', hold);
    // Holding handlers is not enough on its own (review, 10-03): a reload already queued
    // on a timer, a fetch already in flight, or a refresh interval can still finish and
    // clear the layer. Clearing a layer removes the marker, and Leaflet closes the popup
    // bound to it. So when a popup closes because its marker left the map (not because
    // someone closed it: then the marker is still there), the same popup is reopened on
    // its own at the same spot. Closing that one is the person's choice and sticks.
    gm.on('popupclose', function (e) {
      var p = e.popup, src = p && p._source;
      if (src && !gm.hasLayer(src) && p.getLatLng && p.getLatLng()) {
        var ll = p.getLatLng(), content = p.getContent(), opts = L.extend({}, p.options, { autoPan: false });
        setTimeout(function () {
          if (popupOpen()) return;
          L.popup(opts).setLatLng(ll).setContent(content).openOn(gm);
        }, 0);
        return;
      }
      setTimeout(function () {
        if (popupOpen() || !held.length) return;
        var run = held; held = [];
        run.forEach(function (fn) { fn.call(gm, { type: 'moveend', target: gm }); });
      }, 0);
    });
  }

  // 5. Map options, for maps that declare them before the window load event:
  //   window.mcMapOptions = { position:'bottomright',
  //     layers:[{label:'Road closures', color:'#DC2626', layer:clLayer}],
  //     bases:{'Terrain':baseTerrain, 'Satellite':baseSat} }
  // One button (the layers icon) opens a panel with layer switches and the map style,
  // the same option C as the camera maps: the button alone opens and closes it, a pointer
  // joins them, it starts closed on phones and pulses three times there. It replaces
  // Leaflet's own basemap control (Leah, 10-03: "I don't see a map options. Just the
  // satellite etc options").
  // Shared layers (Leah, 10-30: "every map should have the same filters"). Every map with
  // the Map layers card gets the same tiles: Alerts, Closures and crashes, Road weather,
  // Cameras, Mile markers, Wildfires. Data loads the first time a tile is switched on,
  // for the states and provinces in view (up to four, so a whole-country view asks you to
  // zoom in), and more load as you pan. A page can pin one state and open with its own
  // topic on:  window.mcExtraLayers = { state:'CO', on:['cameras'] }
  // `<name>:false` drops a tile, `window.mcExtraLayers = false` drops them all. A tile the
  // page already has under its own name (its own closures, cameras, roadwork) is left out
  // so nothing shows twice; camera pages leave out Cameras for the same reason.
  var SAME = { alerts: /restriction|roadwork|work zone|alert/i, closures: /closure|crash/i, weather: /road weather|road condition|surface/i,
    cameras: /camera/i, mileposts: /mile ?(marker|post)/i, fires: /fire/i };
  var BOXES = {WA:[45.54,49,-124.85,-116.91],OR:[41.99,46.29,-124.57,-116.46],ID:[42,49,-117.24,-111.04],MT:[44.36,49,-116.05,-104.04],AZ:[31.33,36.999,-114.82,-109.04],UT:[37,42,-114.05,-109.04],CO:[37.001,41,-109.05,-102.04],NM:[31.33,37,-109.05,-103],AK:[54.5,71.5,-165,-129.5],SD:[42.48,45.94,-104.06,-96.43],ND:[45.94,49,-104.05,-96.55],NE:[40,43,-104.05,-95.31],KS:[37,40,-102.05,-94.59],WI:[42.49,47.08,-92.89,-86.8],MN:[43.5,49,-97.21,-89.6],IA:[40.37,43.5,-96.64,-90.14],IL:[36.97,42.51,-91.52,-87.02],WY:[40.99,45.01,-111.06,-104.05],ME:[43.06,47.46,-71.08,-66.95],RI:[41.15,42.02,-71.86,-71.12],MI:[41.7,48.3,-90.42,-82.12],NV:[35,42,-120.01,-114.04],NJ:[38.92,41.36,-75.56,-73.89],DE:[38.45,39.84,-75.79,-75.04],MD:[37.91,39.73,-79.49,-75.04],VA:[36.54,39.47,-83.68,-75.24],WV:[37.2,40.64,-82.65,-77.72],OH:[38.4,42,-84.82,-80.52],PA:[39.72,42.27,-80.52,-74.69],MA:[41.18,42.89,-73.51,-69.93],VT:[42.73,45.02,-73.43,-71.46],NH:[42.7,45.31,-72.56,-70.7],CT:[40.98,42.05,-73.73,-71.79],NY:[40.48,45.02,-79.77,-71.86],FL:[24.4,31,-87.63,-80.03],GA:[30.36,35,-85.61,-80.84],NC:[33.84,36.59,-84.32,-75.46],SC:[32.03,35.22,-83.35,-78.54],MS:[30.17,35,-91.66,-88.1],AL:[30.22,35.01,-88.47,-84.89],AR:[33,36.5,-94.62,-89.64],LA:[28.93,33.02,-94.04,-88.82],OK:[33.62,37,-103,-94.43],TN:[34.98,36.68,-90.31,-81.65],KY:[36.5,39.15,-89.57,-81.96],IN:[37.77,41.76,-88.1,-84.78],MO:[36,40.61,-95.77,-89.1],CA:[32.5,42,-124.5,-114.1],HI:[18.5,22.5,-160.5,-154.5],TX:[25.8,36.5,-106.7,-93.5],ON:[41.66,56.9,-95.16,-74.32],QC:[44.99,62.6,-79.77,-57.1],BC:[48.3,60.02,-139.06,-114.03],AB:[48.99,60,-120.01,-109.95],MB:[48.99,60,-102.11,-88.9]};
  // The agency each state's feed comes from, named and linked in every popup (10-30).
  var DOTS = {"WA":["WSDOT","https://wsdot.wa.gov/travel/real-time/map"],"BC":["DriveBC","https://www.drivebc.ca"],"AB":["511 Alberta","https://511.alberta.ca"],"MB":["Manitoba 511","https://www.manitoba511.ca"],"OR":["TripCheck","https://tripcheck.com"],"AZ":["AZ511","https://az511.gov"],"MT":["MDT","https://www.511mt.net"],"UT":["UDOT","https://udottraffic.utah.gov"],"ID":["ITD 511","https://511.idaho.gov"],"AK":["AK 511","https://511.alaska.gov"],"CO":["COtrip","https://www.cotrip.org"],"ND":["NDRoads","https://travel.dot.nd.gov/"],"SD":["SD511","https://www.sd511.org/"],"WI":["511WI","https://511wi.gov/"],"WY":["WYDOT","https://wyoroad.info"],"ME":["New England 511","https://newengland511.org/"],"RI":["RIDOT","https://www.dot.ri.gov/"],"MI":["Mi Drive","https://mdotjboss.state.mi.us/MiDrive"],"NV":["NVRoads","https://www.nvroads.com"],"PA":["511PA","https://www.511pa.com"],"MA":["MassDOT","https://www.mass511.com"],"VT":["VTrans","https://newengland511.org/"],"NH":["NHDOT","https://newengland511.org/"],"CT":["CTDOT","https://portal.ct.gov/dot"],"NJ":["511NJ","https://www.511nj.org/"],"NY":["511NY","https://511ny.org"],"MN":["511MN","https://511mn.org/"],"OH":["OHGO","https://www.ohgo.com/"],"IA":["511IA","https://511ia.org/"],"NE":["NE 511","https://www.511.nebraska.gov/"],"NM":["NMRoads","https://nmroads.com/"],"VA":["VA 511","https://511.vdot.virginia.gov/"],"WV":["WV 511","https://wv511.org/"],"DE":["DelDOT","https://deldot.gov/traffic"],"MD":["MD 511","https://chart.maryland.gov/"],"IL":["IDOT","https://www.gettingaroundillinois.com/"],"AL":["ALGO","https://algotraffic.com"],"AR":["IDrive","https://www.idrivearkansas.com"],"IN":["INDOT","https://indot.carsprogram.org/"],"KY":["goKY","https://goky.ky.gov/"],"LA":["511LA","https://www.511la.org/"],"OK":["OK 511","https://www.oktraffic.org/"],"TN":["SmartWay","https://smartway.tn.gov/traffic"],"FL":["FL511","https://fl511.com"],"GA":["511GA","https://511ga.org"],"KS":["KanDrive","https://www.kandrive.gov/"],"MO":["MoDOT","https://traveler.modot.org/"],"MS":["MDOTtraffic","https://www.mdottraffic.com/"],"NC":["NCDOT","https://www.ncdot.gov/travel-maps/traffic-travel/Pages/default.aspx"],"SC":["511SC","https://www.511sc.org/"],"CA":["QuickMap","https://quickmap.dot.ca.gov/"],"HI":["HI DOT","https://hidot.hawaii.gov/"],"TX":["DriveTexas","https://drivetexas.org/"]};
  function extraLayers(own) {
    own = own || [];
    var X = window.mcExtraLayers;
    if (X === false || !gm) return [];
    X = X || {};
    var W = 'https://api.milecheckapp.com', pinned = X.state && X.state !== 'ALL' ? X.state : null, all = X.state === 'ALL';
    var e = function (t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
    var src = function (st, what) {
      var a = DOTS[st], name = a ? a[0] : what || 'state DOT';
      return '<br><span style="color:#8A939B">Source: ' + (a ? '<a href="' + e(a[1]) + '" target="_blank" rel="noopener" style="color:inherit">' + e(name) + '</a>' : e(name)) + (what && a ? ' ' + e(what) : '') + '</span>';
    };
    var get = function (path) { return fetch(W + path, { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }); };
    var dot = function (la, lo, fill, r, rend) { return L.circleMarker([la, lo], { renderer: rend, radius: r || 7, color: '#fff', weight: 1.5, fillColor: fill, fillOpacity: .95 }); };
    var ok = function (la, lo) { return isFinite(la) && isFinite(lo) && !(!la && !lo); };
    var clean = function (t) { return String(t || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); };
    var canvas = L.canvas({ padding: 0.3 });
    var G = { alerts: L.layerGroup(), closures: L.layerGroup(), weather: L.layerGroup(), cameras: L.layerGroup(), mileposts: L.layerGroup(), fires: L.layerGroup() };

    // Which states to load: the pinned one, or the ones in view.
    function inView() {
      if (pinned) return [pinned];
      var b = gm.getBounds(), hits = [];
      Object.keys(BOXES).forEach(function (k) {
        var x = BOXES[k];
        var la = Math.min(b.getNorth(), x[1]) - Math.max(b.getSouth(), x[0]), lo = Math.min(b.getEast(), x[3]) - Math.max(b.getWest(), x[2]);
        if (la > 0 && lo > 0) hits.push(k);
      });
      return hits.length > 4 ? null : hits;
    }
    var note = null, noteT = null;
    function zoomNote() {
      if (!note) {
        note = document.createElement('div');
        note.style.cssText = 'position:absolute;left:50%;top:10px;transform:translateX(-50%);z-index:800;background:rgba(14,17,22,.86);color:#fff;border-radius:8px;padding:6px 12px;font:600 12.5px/1.4 system-ui,sans-serif;pointer-events:none;white-space:nowrap';
        note.textContent = 'Zoom in to load this layer';
        gm.getContainer().appendChild(note);
      }
      note.hidden = false;
      clearTimeout(noteT);
      noteT = setTimeout(function () { note.hidden = true; }, 2600);
    }

    // One fetch per state per feed, shared by the tiles that read it.
    var cache = {};
    function feed(path, st) { var k = path + st; if (!cache[k]) cache[k] = get('/' + path + '?state=' + st); return cache[k]; }
    var drawn = {};
    var DRAW = {
      closures: function (st) { return feed('incidents', st).then(function (d) { incidents(d, true, st).forEach(function (x) { place(x, '#DC2626', 7, G.closures, st); }); }); },
      alerts: function (st) { return feed('incidents', st).then(function (d) { incidents(d, false, st).forEach(function (x) { place(x, '#F59E0B', 6, G.alerts, st); }); }); },
      // Road weather: reported road surface conditions. Bare, dry and normal are left out.
      weather: function (st) {
        return feed('conditions', st).then(function (d) {
          ((d && d['road-weather-reports']) || []).forEach(function (r) {
            var loc = r.location || {}, sl = loc['start-location'] || {};
            var la = +(r.latitude || sl['start-lat']), lo = +(r.longitude || sl['start-long']), cond = clean(r['road-surface-condition']);
            if (!ok(la, lo) || !cond || /^(bare|dry|normal|bare\s*\/\s*dry|bare and dry|no report)/i.test(cond)) return;
            var name = clean(r['location-name'] || loc['location-name']);
            dot(la, lo, '#0EA5E9', 6).bindPopup('<b>Road weather' + (r['route-id'] ? ' · ' + e(r['route-id']) : '') + '</b><br>' + (name ? e(name.slice(0, 140)) + '<br>' : '') + e(cond.slice(0, 200)) + src(st)).addTo(G.weather);
          });
        });
      },
      // Cameras: a pin per camera on a canvas (a state can have thousands); the still
      // loads only when its popup opens.
      cameras: function (st) {
        return feed('cameras', st).then(function (d) {
          ((d && d.cameras) || []).forEach(function (c) {
            if (!ok(+c.lat, +c.lon) || c.isActive === false) return;
            dot(+c.lat, +c.lon, '#475569', 5, canvas).bindPopup(function () {
              return '<b>' + e(c.title || 'Camera') + '</b>' + (c.imageUrl ? '<br><a href="' + e(c.imageUrl) + '" target="_blank" rel="noopener"><img src="' + e(c.imageUrl) + '" alt="' + e(c.title || 'Traffic camera') + '" loading="lazy" style="display:block;width:240px;max-width:100%;margin-top:6px;border-radius:6px"></a>' : '') + src(st);
            }, { maxWidth: 260 }).addTo(G.cameras);
          });
        });
      },
      mileposts: function (st) {
        return feed('mileposts', st).then(function (d) {
          var arr = Array.isArray(d) ? d : [];
          if (!arr.length && d && typeof d === 'object') Object.keys(d).forEach(function (k) { if (Array.isArray(d[k])) d[k].forEach(function (p) { arr.push({ highway: p.highway || k, milepost: p.milepost != null ? p.milepost : p.mile, lat: p.lat, lon: p.lon }); }); });
          arr.forEach(function (p) { if (ok(+p.lat, +p.lon)) { p.st = st; posts.push(p); } });
          drawPosts();
        });
      }
    };
    function incidents(d, wantClos, st) {
      var out = [];
      ((d && d['incident-reports']) || []).forEach(function (r) {
        var t = r['event-type-id'], loc = r.location || {}, sl = loc['start-location'] || {}, el = loc['end-location'] || {};
        var txt = clean(r.headline || r.description || r['impact-desc']), la = +sl['start-lat'], lo = +sl['start-long'];
        if (!ok(la, lo)) return;
        var isClos = (t === 'CL' || t === 'AC' || /\b(closed|closure|crash)\b/i.test(txt)) && !/\b(ramp|exit|rest area|shoulder)\b/i.test(txt);
        if (isClos !== wantClos) return;
        var rt = (loc['route-id'] || '').trim(), m1 = parseFloat(sl['start-mile-marker']), m2 = parseFloat(el['end-mile-marker']);
        var kind = isClos ? (t === 'AC' ? 'Crash' : 'Closure') : (t === 'RW' ? 'Work zone' : t === 'WE' ? 'Weather' : t === 'HZ' ? 'Hazard' : 'Alert');
        var span = isFinite(m1) && isFinite(m2) && Math.abs(m2 - m1) >= 0.3 ? 'Mile ' + mpLabel(Math.min(m1, m2)) + ' to ' + mpLabel(Math.max(m1, m2)) : '';
        out.push({ la: la, lo: lo, la2: +el['end-lat'], lo2: +el['end-long'], rt: rt, m1: m1, m2: m2,
          html: '<b>' + e(kind) + (rt ? ' · ' + e(rt) : '') + '</b>' + (span ? '<br><span style="font-weight:600">' + e(span) + '</span>' : '') + '<br>' + e(txt.slice(0, 280)) + src(st) });
      });
      return out;
    }
    // A closure or work zone with a start and end draws as a line along the road from
    // its first mile marker to its last (Leah, 10-30), with a dot at the start. The road
    // shape comes from the state's mile marker posts; without them, a straight line
    // between the two ends if they are close, otherwise just the dot.
    var rkey = function (r) { return String(r || '').toUpperCase().replace(/^(SR|WA|OR|ID|CO|UT|STATE ROUTE)\s*/, 'S').replace(/[^A-Z0-9]/g, ''); };
    function place(x, color, r, group, st) {
      var m = dot(x.la, x.lo, color, r).bindPopup(x.html).addTo(group);
      var hasEnd = ok(x.la2, x.lo2) && (Math.abs(x.la2 - x.la) > 0.002 || Math.abs(x.lo2 - x.lo) > 0.002);
      if (!hasEnd && !(isFinite(x.m1) && isFinite(x.m2) && Math.abs(x.m2 - x.m1) >= 0.3)) return;
      // Long stretches (a whole highway's restriction) stay a dot; a 150-mile line paints
      // the map without saying where the work actually is.
      if (isFinite(x.m1) && isFinite(x.m2) && Math.abs(x.m2 - x.m1) > 30) return;
      if (hasEnd && gm.distance([x.la, x.lo], [x.la2, x.lo2]) > 50000) return;
      var line = function (pts) {
        L.polyline(pts, { color: '#fff', weight: 8, opacity: .9, interactive: false }).addTo(group);
        L.polyline(pts, { color: color, weight: 5, opacity: .9 }).bindPopup(x.html).addTo(group);
        m.bringToFront();
      };
      var straight = function () { if (hasEnd && gm.distance([x.la, x.lo], [x.la2, x.lo2]) < 40000) line([[x.la, x.lo], [x.la2, x.lo2]]); };
      if (!(isFinite(x.m1) && isFinite(x.m2) && x.rt)) return straight();
      feed('mileposts', st).then(function (d) {
        var arr = Array.isArray(d) ? d : [], lo = Math.min(x.m1, x.m2), hi = Math.max(x.m1, x.m2), k = rkey(x.rt), seen = {};
        var pts = arr.filter(function (p) { return rkey(p.highway) === k && +p.milepost >= lo - 0.5 && +p.milepost <= hi + 0.5 && ok(+p.lat, +p.lon); })
          .sort(function (a, b) { return a.milepost - b.milepost; })
          .filter(function (p) { var q = Math.round(+p.milepost * 10); if (seen[q]) return false; seen[q] = 1; return true; });
        // Posts must sit near the reported start, and no gap may be wider than 8 km,
        // or the match is the wrong road and we fall back.
        var good = pts.length >= 2 && gm.distance([x.la, x.lo], [pts[0].lat, pts[0].lon]) < 15000 || pts.length >= 2 && gm.distance([x.la, x.lo], [pts[pts.length - 1].lat, pts[pts.length - 1].lon]) < 15000;
        for (var i = 1; good && i < pts.length; i++) if (gm.distance([pts[i - 1].lat, pts[i - 1].lon], [pts[i].lat, pts[i].lon]) > 8000) good = false;
        if (good) line(pts.map(function (p) { return [+p.lat, +p.lon]; })); else straight();
      });
    }
    function sync(key, fromTap) {
      if (!gm.hasLayer(G[key])) return;
      var sts = inView();
      if (!sts) { if (fromTap) zoomNote(); return; }
      sts.forEach(function (st) { var k = key + st; if (drawn[k]) return; drawn[k] = 1; DRAW[key](st); });
    }
    Object.keys(DRAW).forEach(function (key) { G[key].on('add', function () { sync(key, true); }); });
    if (!pinned) gm.on('moveend', function () { Object.keys(DRAW).forEach(function (k) { sync(k, false); }); });

    // Mile markers: little green signs with the number on them, like the app (Leah, 10-30:
    // plain green dots looked like the page's camera dots). Drawn only for the area in view
    // once zoomed in, and thinned as you zoom out, so a state's 15,000 posts stay fast.
    var posts = [];
    // Signs sit above road lines and just to the right of the post, so they do not hide camera or closure dots.
    function mpPane() { if (!gm.getPane('mcMp')) { var pn = gm.createPane('mcMp'); pn.style.zIndex = 450; } return 'mcMp'; }
    function mpLabel(v) { var n = +v; return Math.abs(n - Math.round(n)) < 0.05 ? String(Math.round(n)) : n.toFixed(1); }
    function drawPosts() {
      var pop = gm._popup;
      if (pop && gm.hasLayer(pop) && pop._source && G.mileposts.hasLayer(pop._source)) return;
      G.mileposts.clearLayers();
      if (!gm.hasLayer(G.mileposts)) return;
      var z = gm.getZoom();
      if (z < 9) return;
      var step = z >= 12 ? 1 : z >= 11 ? 2 : z >= 10 ? 5 : 10, b = gm.getBounds().pad(0.1), n = 0, seen = {};
      for (var i = 0; i < posts.length && n < 400; i++) {
        var p = posts[i], mi = Math.round(+p.milepost);
        if (mi % step || !b.contains([p.lat, p.lon])) continue;
        // One sign per road and number (some feeds list each direction separately).
        var k = p.highway + '|' + mpLabel(p.milepost);
        if (seen[k]) continue;
        seen[k] = 1;
        n++;
        L.marker([p.lat, p.lon], { pane: mpPane(), icon: L.divIcon({ className: 'cm-mp', html: '<span>' + e(mpLabel(p.milepost)) + '</span>', iconSize: [0, 0] }), keyboard: false })
          .bindPopup('<b>' + e(p.highway) + ' · mile ' + e(mpLabel(p.milepost)) + '</b>' + src(p.st, 'mile marker data'))
          .addTo(G.mileposts);
      }
    }
    G.mileposts.on('add', function () { drawPosts(); gm.on('moveend', drawPosts); if (gm.getZoom() < 9) zoomNote(); });
    G.mileposts.on('remove', function () { gm.off('moveend', drawPosts); });

    // Wildfires: one national feed. A pinned state shows only its fires; otherwise all
    // of them, prescribed burns left out.
    G.fires.on('add', function () {
      if (drawn.fires) return;
      drawn.fires = 1;
      get('/fires').then(function (d) {
        ((d && d.fires) || []).forEach(function (x) {
          if ((pinned ? x.state !== 'US-' + pinned : all && !/^US-/.test(x.state || '')) || x.isRx || !isFinite(x.lat)) return;
          L.circleMarker([x.lat, x.lon], { radius: Math.min(14, 5 + Math.log10((x.acres || 1) + 1) * 2), color: '#9a3412', weight: 1, fillColor: '#EA580C', fillOpacity: .8 })
            .bindPopup('<b>' + e(x.name || 'Fire') + '</b><br>' + (x.acres != null ? Math.round(x.acres).toLocaleString() + ' acres' : 'Size not reported') + (x.containedPct != null ? ' · ' + x.containedPct + '% contained' : '') + '<br><span style="color:#8A939B">Source: NIFC</span>')
            .addTo(G.fires);
        });
      });
    });

    var camPage = /^\/(es\/|pt\/)?cameras\//.test(location.pathname);
    var rows = [
      { key: 'alerts', label: 'Alerts', color: '#F59E0B', skip: all },
      { key: 'closures', label: 'Closures and crashes', color: '#DC2626', skip: all },
      { key: 'weather', label: 'Road weather', color: '#0EA5E9', skip: all },
      { key: 'cameras', label: 'Cameras', color: '#475569', skip: all || camPage },
      { key: 'mileposts', label: 'Mile markers', color: '#0f7a4f', skip: all },
      { key: 'fires', label: 'Wildfires', color: '#EA580C' }
    ];
    var on = X.on || [];
    var dup = function (r) { return own.some(function (t) { return SAME[r.key].test(t); }); };
    return rows.filter(function (r) { return !r.skip && X[r.key] !== false && !dup(r); }).map(function (r) {
      r.layer = G[r.key];
      if (on.indexOf(r.key) >= 0) r.layer.addTo(gm);
      return r;
    });
  }

  // One small line icon per layer, picked from its label so a page's own layers
  // (snowplows, drawbridges, chain controls) get one too. Unknown labels get a dot.
  var TILE_ICONS = [
    [/radar/i, 'M12 12m-8 0a8 8 0 1016 0 8 8 0 10-16 0M12 12l6-4'],
    [/closure|crash/i, 'M6 6l12 12M18 6L6 18'],
    [/restriction|roadwork|work zone|construction/i, 'M4 20h16M7 20l3-12h4l3 12M9 13h6'],
    [/road weather|condition|surface/i, 'M7 15a4 4 0 010-8 5 5 0 019.6 1.5A3.5 3.5 0 0117 15zM9 18l-1 2M13 18l-1 2'],
    [/alert/i, 'M12 4l9 16H3zM12 10v4M12 17v.5'],
    [/plow/i, 'M3 15h12v-5h3l3 5v2H3zM7 19a1.5 1.5 0 100-.1M17 19a1.5 1.5 0 100-.1'],
    [/camera/i, 'M4 8h11v8H4zM15 11l5-3v8l-5-3'],
    [/mile ?(marker|post)/i, 'M8 4h8v9H8zM12 13v7'],
    [/fire/i, 'M12 3c3 4 5 6 5 10a5 5 0 01-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-6 1-9z'],
    [/bridge/i, 'M3 16h18M5 16v-4a7 7 0 0114 0v4M9 16v-5M15 16v-5'],
    [/chain/i, 'M9 15l6-6M7 11l-2 2a3 3 0 004 4l2-2M17 13l2-2a3 3 0 00-4-4l-2 2'],
    [/ferr|boat/i, 'M3 17l2 3h14l2-3zM6 17V10h12v7M10 10V6h4v4'],
    [/rail|train/i, 'M7 4h10v11H7zM7 11h10M9 19l-2 2M15 19l2 2M9 15v.5M15 15v.5'],
    [/border|wait/i, 'M12 3v18M5 7h7M12 12h7M5 17h7']
  ];
  function tileIcon(label) {
    var d = 'M12 12m-4 0a4 4 0 108 0 4 4 0 10-8 0';
    for (var i = 0; i < TILE_ICONS.length; i++) if (TILE_ICONS[i][0].test(label)) { d = TILE_ICONS[i][1]; break; }
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + d + '"/></svg>';
  }

  // The pass, ski, corridor and mountain pages build their own layer box (.co-layers)
  // with switch rows. Turn those rows into the same icon tiles as the shared card, so
  // every map looks alike (Leah, 10-30). Each page's own checkboxes stay, so its code
  // that listens to them keeps working.
  var X_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  function tileBox(box) {
    var rows = [].slice.call(box.querySelectorAll('label.co-layer'));
    if (!rows.length || box.querySelector('.cm-tiles')) return;
    var grid = document.createElement('div');
    grid.className = 'cm-tiles';
    var lt = box.querySelector('.lt');
    box.insertBefore(grid, lt ? lt.nextSibling : box.firstChild);
    rows.forEach(function (r) {
      var inp = r.querySelector('input'), dotEl = r.querySelector('.co-dot');
      var text = r.textContent.trim();
      var c = (dotEl && dotEl.style.background) || '#0f7a4f';
      r.innerHTML = '';
      r.className = 'cm-tile' + (inp && inp.checked ? ' cm-on' : '');
      r.style.setProperty('--c', c);
      if (inp) r.appendChild(inp);
      r.insertAdjacentHTML('beforeend', '<span class="cm-ic">' + tileIcon(text) + '</span><span class="cm-tl">' + text.replace(/ and /g, ' & ').replace(/[<>"]/g, '') + '</span>');
      grid.appendChild(r);
    });
    box.classList.add('cm-tiled');
    // Close X, top right (Leah, 10-30). It presses the layers button, which closes the box.
    var x = document.createElement('button');
    x.type = 'button'; x.className = 'cm-x'; x.setAttribute('aria-label', 'Close map layers'); x.innerHTML = X_SVG;
    box.insertBefore(x, box.firstChild);
    x.addEventListener('click', function (ev) {
      ev.preventDefault(); ev.stopPropagation();
      var host = box.parentNode, lb = host && host.querySelector('.cm-layers-btn a');
      if (lb) { lb.click(); if (ev.detail === 0) lb.focus(); } else box.classList.add('cm-closed');
    });
    box.addEventListener('change', function (ev) { var t = ev.target.closest('.cm-tile'); if (t) t.classList.toggle('cm-on', ev.target.checked); });
  }

  function buildOptions() {
    // Pages that build their map inside a function (the closure pages) have no global
    // `map`; take the first map on the page from the registry in section 1 instead.
    if (!gm) {
      if (window.MCMaps) MCMaps.each(function (m) { if (!gm) { gm = m; buildOptions(); } });
      // A resize makes Leaflet re-measure, which registers a map made before this file ran.
      if (!gm && document.querySelector('.leaflet-container')) window.dispatchEvent(new Event('resize'));
      return;
    }
    var O = window.mcMapOptions || {};
    if (!gm || gm._mcOpts) return;
    // A page with Leaflet's own layers control and no options keeps that control alone.
    if (!window.mcMapOptions && gm.getContainer().querySelector('.leaflet-control-layers')) return;
    gm._mcOpts = true;
    // Pages with their own layer box (.co-layers, the pass pages) get radar as one more
    // row in that box, so the map keeps a single layers button (Leah, 10-25).
    // Radar as a loop of the last 50 minutes in 10-minute steps, so you can see which way
    // the weather is moving (Leah, 10-25). Frames load hidden, then play once they are in.
    function radarLayer() {
      var steps = ['-m50m', '-m40m', '-m30m', '-m20m', '-m10m', ''];
      var frames = steps.map(function (st, i) {
        return L.tileLayer('https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913' + st + '/{z}/{x}/{y}.png',
          { opacity: 0, zIndex: 300 + i, maxNativeZoom: 8, updateWhenZooming: false,
            attribution: i === 5 ? 'Radar: NWS NEXRAD via Iowa Environmental Mesonet' : '' });
      });
      var g = L.layerGroup(frames), timer = null, tag = null, k = 5;
      function show(n) {
        frames.forEach(function (f, i) { f.setOpacity(i === n ? 0.55 : 0); });
        if (tag) tag.textContent = n === 5 ? 'Radar now' : 'Radar ' + (50 - n * 10) + ' min ago';
      }
      g.on('add', function () {
        var c = gm.getContainer();
        tag = document.createElement('div');
        tag.style.cssText = 'position:absolute;right:8px;bottom:22px;z-index:800;background:rgba(255,255,255,.92);border-radius:6px;padding:2px 8px;font:600 12px/1.6 system-ui,sans-serif;color:#1d1f1c;pointer-events:none';
        c.appendChild(tag);
        show(5);
        setTimeout(function () {
          if (!tag) return;
          (function tick() { timer = setTimeout(function () { if (!tag) return; k = (k + 1) % 6; show(k); tick(); }, k === 5 ? 1800 : 700); })();
        }, 1500);
      });
      g.on('remove', function () { clearTimeout(timer); clearInterval(timer); if (tag) tag.remove(); tag = null; k = 5; });
      return g;
    }
    var own = !window.mcMapOptions && document.querySelector('.co-layers');
    if (own) {
      var rl = radarLayer();
      var lab = document.createElement('label');
      lab.className = 'co-layer';
      lab.innerHTML = '<input type="checkbox"><span class="co-sw"></span><span class="co-dot" style="background:#2563EB"></span>Weather radar';
      var first = own.querySelector('.co-layer');
      own.insertBefore(lab, first || null);
      lab.querySelector('input').onchange = function (e) { if (e.target.checked) rl.addTo(gm); else gm.removeLayer(rl); };
      var ownLabels = [].map.call(own.querySelectorAll('.co-layer'), function (l) { return l.textContent; });
      extraLayers(ownLabels).forEach(function (x) {
        var l2 = document.createElement('label');
        l2.className = 'co-layer';
        l2.innerHTML = '<input type="checkbox"' + (gm.hasLayer(x.layer) ? ' checked' : '') + '><span class="co-sw"></span><span class="co-dot" style="background:' + x.color + '"></span>' + x.label;
        own.appendChild(l2);
        l2.querySelector('input').onchange = function (e) { if (e.target.checked) x.layer.addTo(gm); else gm.removeLayer(x.layer); };
      });
      tileBox(own);
      return;
    }
    var layers = (O.layers || []).concat(extraLayers((O.layers || []).map(function (l) { return l && l.label || ''; }))).filter(function (l) { return l && l.layer; });
    // Weather radar on every map, off by default (Leah, 10-24). Same NEXRAD composite the
    // app's map uses (Iowa State Mesonet, refreshed about every 5 minutes upstream).
    layers.unshift({ label: 'Weather radar', color: '#2563EB', layer: radarLayer() });
    var bases = O.bases || {};
    var baseNames = Object.keys(bases);
    var Opts = L.Control.extend({
      options: { position: O.position || 'topleft' },
      onAdd: function () {
        var wrap = L.DomUtil.create('div', 'leaflet-control cm-opts');
        var bar = L.DomUtil.create('div', 'leaflet-bar cm-layers-btn', wrap);
        var btn = L.DomUtil.create('a', '', bar);
        btn.href = '#';
        btn.title = 'Map options';
        btn.setAttribute('role', 'button');
        btn.setAttribute('aria-label', 'Map options');
        btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 2 8l10 5 10-5-10-5z"/><path d="M2 13l10 5 10-5"/></svg>';
        var panel = L.DomUtil.create('div', 'cm-opts-panel', wrap);
        panel.setAttribute('role', 'group');
        panel.setAttribute('aria-label', 'Map options');
        var html = '<button type="button" class="cm-x" aria-label="Close map layers">' + X_SVG + '</button><div class="lt">Map layers</div>';
        // Tiles, three across, each with an icon (option B, Leah 10-30). Grey icon = off.
        html += '<div class="cm-tiles">';
        layers.forEach(function (l, i) {
          var on = gm.hasLayer(l.layer);
          html += '<label class="cm-tile' + (on ? ' cm-on' : '') + '" style="--c:' + (l.color || '#0f7a4f') + '"><input type="checkbox" data-i="' + i + '"' + (on ? ' checked' : '') + '><span class="cm-ic">' + tileIcon(l.label) + '</span><span class="cm-tl">' + l.label.replace(/ and /g, ' & ') + '</span></label>';
        });
        html += '</div>';
        if (baseNames.length > 1) {
          html += '<div class="cm-opts-sub">Map style</div><div class="cm-opts-bases">' + baseNames.map(function (n) {
            return '<button type="button" data-b="' + n + '"' + (gm.hasLayer(bases[n]) ? ' class="cm-on"' : '') + '>' + n + '</button>';
          }).join('') + '</div>';
        }
        panel.innerHTML = html;
        L.DomEvent.disableClickPropagation(wrap);
        L.DomEvent.disableScrollPropagation(wrap);
        panel.addEventListener('change', function (e) {
          var l = layers[+e.target.dataset.i];
          if (!l) return;
          if (e.target.checked) gm.addLayer(l.layer); else gm.removeLayer(l.layer);
          var t = e.target.closest('.cm-tile');
          if (t) t.classList.toggle('cm-on', e.target.checked);
        });
        panel.addEventListener('click', function (e) {
          if (e.target.closest('.cm-x')) { set(false); if (e.detail === 0) btn.focus(); return; }
          var b = e.target.closest('button[data-b]');
          if (!b) return;
          baseNames.forEach(function (n) { if (gm.hasLayer(bases[n])) gm.removeLayer(bases[n]); });
          gm.addLayer(bases[b.dataset.b]);
          if (bases[b.dataset.b].bringToBack) bases[b.dataset.b].bringToBack();
          panel.querySelectorAll('button[data-b]').forEach(function (x) { x.classList.toggle('cm-on', x === b); });
        });
        // The panel never runs past the bottom of the map: it gets the room that is left
        // below its top edge and scrolls inside that (Leah, 10-30: "cant scroll it").
        var fit = function () {
          if (panel.classList.contains('cm-closed')) return;
          panel.style.maxHeight = panel.style.top = panel.style.width = '';
          panel.classList.remove('cm-side');
          var bottomCtl = /bottom/.test(O.position || '');
          var mb = gm.getContainer().getBoundingClientRect(), pb = panel.getBoundingClientRect();
          var room = bottomCtl ? pb.bottom - mb.top - 8 : mb.bottom - pb.top - 8;
          // Not enough room below the buttons (a short map, or a phone turned sideways):
          // open beside the layers button instead, from the top of the map, as wide as fits.
          if (!bottomCtl && pb.height > room) {
            var wr = wrap.getBoundingClientRect(), across = mb.right - wr.right - 18;
            if (across >= 220) {
              panel.classList.add('cm-side');
              panel.style.top = Math.round(mb.top - wr.top + 8) + 'px';
              if (across < pb.width) panel.style.width = Math.floor(across) + 'px';
              pb = panel.getBoundingClientRect();
              room = mb.bottom - pb.top - 8;
            }
          }
          if (pb.height > room) panel.style.maxHeight = Math.max(110, room) + 'px';
        };
        gm.on('resize', fit);
        var set = function (open) {
          panel.classList.toggle('cm-closed', !open);
          if (open) setTimeout(fit, 0);
          btn.classList.toggle('cm-on', open);
          btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        };
        L.DomEvent.on(btn, 'click', function (e) {
          L.DomEvent.preventDefault(e);
          bar.classList.remove('cm-pulse');
          set(panel.classList.contains('cm-closed'));
        });
        // Starts closed at every width; the button pulses so people know to tap it
        // (Leah, 10-30: the panel popping open on arrival was "kind of annoying").
        set(false);
        bar.classList.add('cm-pulse');
        gm.on('click', function () { set(false); });
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape') set(false); });
        return wrap;
      }
    });
    gm.addControl(new Opts());
  }
  // Built on window load: some pages add their layers in a load handler of their own.
  if (document.readyState === 'complete') buildOptions(); else window.addEventListener('load', buildOptions);

  // 6. App card after a few camera views (Leah, 10-26): after someone opens a third
  // different camera, a small card offers the app. It never blocks the page, closes
  // with ×, and does not come back for 14 days. Page views are what the site earns
  // on, so this is a nudge, not a wall.
  (function appCard() {
    var KEY = 'mcAppCard', seen = {}, n = 0;
    function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
    var last = +store(KEY) || 0;
    if (Date.now() - last < 14 * 864e5) return;
    function link() {
      var ua = navigator.userAgent || '';
      if (/iPhone|iPad|iPod/.test(ua)) return 'https://apps.apple.com/us/app/milecheck/id6759212851';
      if (/Android/.test(ua)) return 'https://play.google.com/store/apps/details?id=app.milecheck.mobile';
      return '/get/';
    }
    function show() {
      if (document.getElementById('mcAppCard')) return;
      var d = document.createElement('div');
      d.id = 'mcAppCard';
      d.setAttribute('role', 'dialog');
      d.setAttribute('aria-label', 'Get the MileCheck app');
      d.style.cssText = 'position:fixed;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:3000;max-width:420px;margin:0 auto;background:#fff;color:#1d1f1c;border:1px solid #d6ddd8;border-radius:12px;box-shadow:0 6px 24px rgba(0,0,0,.18);padding:14px 44px 14px 16px;font:15px/1.4 system-ui,-apple-system,sans-serif';
      d.innerHTML = '<div style="font-weight:700;margin-bottom:4px">Get these cameras and your mile marker on CarPlay and Android Auto.</div>'
        + '<div style="color:#5b6670;font-size:14px;margin-bottom:10px">MileCheck · free trial</div>'
        + '<a href="' + link() + '" target="_blank" rel="noopener" style="display:inline-block;background:#0f7a4f;color:#fff;font-weight:700;text-decoration:none;border-radius:8px;padding:10px 16px;min-height:24px">Get MileCheck</a>'
        + '<button type="button" aria-label="Close" style="position:absolute;top:6px;right:6px;width:40px;height:40px;border:0;background:none;font-size:24px;line-height:1;color:#5b6670;cursor:pointer">×</button>';
      d.querySelector('button').onclick = function () { d.remove(); };
      d.querySelector('a').onclick = function () { if (window.gtag) gtag('event', 'app_card_click', { page_path: location.pathname }); };
      document.body.appendChild(d);
      store(KEY, String(Date.now()));
      if (window.gtag) gtag('event', 'app_card_shown', { page_path: location.pathname });
    }
    document.addEventListener('load', function (e) {
      var t = e.target;
      if (!t || t.tagName !== 'IMG' || !t.classList || !t.classList.contains('cc-img')) return;
      var base = String(t.currentSrc || t.src || '').replace(/[?&]t=\d+/, '');
      if (!base || seen[base]) return;
      seen[base] = 1;
      if (++n === 3) setTimeout(show, 1500);
    }, true);
  })();


  // 5b. Feedback line under every map. Leah, 10-25.
  function addFeedback() {
    document.querySelectorAll('.leaflet-container').forEach(function (m) {
      var box = m.parentElement && /mapbox|map-wrap|rc-mapbox/.test(m.parentElement.className) ? m.parentElement : m;
      if (box.nextElementSibling && box.nextElementSibling.classList.contains('mc-fb')) return;
      var p = document.createElement('div');
      p.className = 'mc-fb';
      p.style.cssText = 'display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:4px 12px;margin:4px 2px 0;font-size:12px;color:#6b7280';
      var fb = '<span style="font-style:italic;margin-left:auto">See any issues? <a href="mailto:feedback@milecheckapp.com?subject=Map%20issue%3A%20' + encodeURIComponent(location.pathname) + '&body=' + encodeURIComponent('Page: ' + location.href + '\n\nWhat looks wrong:\n') + '" style="color:inherit;text-decoration:underline">Tell us</a></span>';
      p.innerHTML = (gm && m === gm.getContainer() ? stylePicker() : '') + fb;
      box.insertAdjacentElement('afterend', p);
      wirePicker(p);
    });
  }
  // Map style picker under the map, bottom left (Leah, 10-25). Esri tiles need no key.
  var STYLES = {
    map: { label: 'Map', url: null },
    satellite: { label: 'Satellite', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', att: 'Imagery: Esri, Maxar, Earthstar Geographics' },
    terrain: { label: 'Terrain', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', att: 'Esri, USGS' },
    dark: { label: 'Dark', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', att: 'Esri' }
  };
  var baseLayer = null, styleLayer = null;
  function stylePicker() {
    return '<span class="mc-style" role="group" aria-label="Map style">' + Object.keys(STYLES).map(function (k) {
      return '<a href="#" data-style="' + k + '" style="color:inherit;text-decoration:none;padding:6px 4px;display:inline-block;min-height:24px">' + STYLES[k].label + '</a>';
    }).join('<span aria-hidden="true">·</span>') + '</span>';
  }
  function setStyle(k, wrap) {
    if (!STYLES[k]) k = 'map';
    if (!baseLayer) gm.eachLayer(function (l) { if (!baseLayer && l instanceof L.TileLayer && !/nexrad/.test(l._url || '')) baseLayer = l; });
    if (styleLayer) { gm.removeLayer(styleLayer); styleLayer = null; }
    if (STYLES[k].url) {
      styleLayer = L.tileLayer(STYLES[k].url, { maxZoom: 19, maxNativeZoom: k === 'dark' ? 16 : 19, attribution: STYLES[k].att, zIndex: 2 }).addTo(gm);
      if (baseLayer && gm.hasLayer(baseLayer)) gm.removeLayer(baseLayer);
    } else if (baseLayer && !gm.hasLayer(baseLayer)) baseLayer.addTo(gm);
    if (wrap) wrap.querySelectorAll('[data-style]').forEach(function (a) {
      var on = a.getAttribute('data-style') === k;
      a.style.fontWeight = on ? '700' : '400';
      a.style.color = on ? '#0f7a4f' : 'inherit';
      a.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }
  function wirePicker(p) {
    var w = p.querySelector('.mc-style');
    if (!w) return;
    var saved = 'map';
    try { saved = localStorage.getItem('mcMapStyle') || 'map'; } catch (e) {}
    setStyle(saved, w);
    w.addEventListener('click', function (e) {
      var a = e.target.closest('[data-style]');
      if (!a) return;
      e.preventDefault();
      var k = a.getAttribute('data-style');
      setStyle(k, w);
      try { localStorage.setItem('mcMapStyle', k); } catch (e2) {}
    });
  }
  if (document.readyState === 'complete') addFeedback(); else window.addEventListener('load', addFeedback);

  // 6. Long camera lists fold to three. Leah, 10-03: "cameras should collapse to like
  // showing 3 or so bc then you never get to the other info" (Cajon listed 43 before the
  // closures and work zones). The page's own "Show every camera" (load every frame) also
  // unfolds it. Pass, mountain-roads and Enchantments pages (#lstCams).
  // Same fold on the ski pages' camera boxes (#camList, #camStatic), with "See more" and
  // "See less" (Leah, 10-30: show 3 so you can get to the closures).
  function foldList(lul, sel, box) {
    var unfolded = false, more = null;
    var fold = function () {
      var items = [].slice.call(lul.querySelectorAll(sel)).filter(function (li) { return !li.classList.contains('none'); });
      if (items.length <= 4) {
        items.forEach(function (li) { li.hidden = false; });
        if (more) more.hidden = true;
        return;
      }
      items.forEach(function (li, i) { li.hidden = !unfolded && i >= 3; });
      if (!more) {
        more = document.createElement('button');
        more.type = 'button';
        more.className = 'cm-more';
        more.addEventListener('click', function () {
          unfolded = !unfolded;
          fold();
          if (!unfolded && box.getBoundingClientRect().top < 0) box.scrollIntoView({ block: 'start' });
        });
        lul.parentNode.insertBefore(more, lul.nextSibling);
      }
      more.hidden = false;
      more.textContent = unfolded ? 'See less' : 'See more (' + (items.length - 3) + ')';
      more.setAttribute('aria-expanded', unfolded ? 'true' : 'false');
    };
    new MutationObserver(fold).observe(lul, { childList: true });
    fold();
    return function () { unfolded = true; fold(); };
  }
  var lst = document.getElementById('lstCams');
  var lul = lst && lst.querySelector('ul');
  if (lul) {
    var openAll = foldList(lul, 'li[data-i]', lst);
    var allBtn = document.getElementById('btnAllCams');
    if (allBtn) allBtn.addEventListener('click', openAll);
  }
  ['camList', 'camStatic'].forEach(function (id) {
    var ul = document.getElementById(id);
    if (ul && ul.tagName === 'UL') foldList(ul, ':scope > li', ul.closest('.sk-box') || ul.parentNode);
  });

  // ---- The live #comap map (cameras, passes, corridors, mountain roads) --------------
  var el = document.getElementById('comap');
  if (!el) return;
  var phone = window.matchMedia('(max-width:600px)');
  var lang = (document.documentElement.lang || 'en').slice(0, 2);
  var T = {
    en: { layers: 'Map layers', close: 'Hide', here: 'Show where I am', none: 'Nothing on this map is near you.', all: 'All camera maps', denied: 'Location is turned off for this site.', fail: 'Your location did not come through. Try again.' },
    es: { layers: 'Capas del mapa', close: 'Ocultar', here: 'Mostrar dónde estoy', none: 'No hay nada en este mapa cerca de ti.', all: 'Todos los mapas de cámaras', denied: 'La ubicación está desactivada para este sitio.', fail: 'No se pudo obtener tu ubicación. Inténtalo de nuevo.' },
    pt: { layers: 'Camadas do mapa', close: 'Ocultar', here: 'Mostrar onde estou', none: 'Não há nada neste mapa perto de você.', all: 'Todos os mapas de câmeras', denied: 'A localização está desativada para este site.', fail: 'Não foi possível obter sua localização. Tente de novo.' }
  }[lang] || null;
  if (!T) T = { layers: 'Map layers', close: 'Hide', here: 'Show where I am', none: 'Nothing on this map is near you.', all: 'All camera maps', denied: 'Location is turned off for this site.', fail: 'Your location did not come through. Try again.' };

  var m = (typeof map !== 'undefined') ? map : null;
  if (!m || typeof L === 'undefined') return;
  var panel = document.querySelector('.co-layers');

  // On a phone the card covers the bottom of the map, so a pan made while it is open
  // (the pass pages' Prev/Next centre the next camera) aims the point at the strip
  // above the card instead of the middle, where the card would hide it.
  var card = document.getElementById('coCard');
  // Once a frame arrives, drop the reserved 4:3 box (map-kit.css) for the image's
  // own shape. The card only gets shorter, so a dot lifted above it stays visible.
  if (card) card.addEventListener('load', function (e) {
    if (e.target.classList && e.target.classList.contains('cc-img')) e.target.classList.add('cm-loaded');
  }, true);
  var panTo = m.panTo;
  m.panTo = function (ll, opts) {
    if (!phone.matches || !card || card.style.display !== 'block') return panTo.call(m, ll, opts);
    var z = m.getZoom(), p = m.project(L.latLng(ll), z);
    var lift = (card.offsetHeight + 24) / 2; // centre of the strip, not of the map
    return panTo.call(m, m.unproject(p.add([0, lift]), z), opts);
  };

  // 3. Near-me button (added first so it sits right under the zoom control)
  var host = el.parentNode;
  var toastTimer = null;
  function toast(html) {
    var t = host.querySelector('.cm-toast');
    if (!t) { t = document.createElement('div'); t.className = 'cm-toast'; t.setAttribute('role', 'status'); host.appendChild(t); }
    t.innerHTML = html;
    t.style.display = 'block';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.style.display = 'none'; }, 6000);
  }
  var me = null;
  var Locate = L.Control.extend({
    options: { position: 'topleft' },
    onAdd: function () {
      var box = L.DomUtil.create('div', 'leaflet-bar leaflet-control cm-locate');
      var a = L.DomUtil.create('a', '', box);
      a.href = '#';
      a.title = T.here;
      a.setAttribute('role', 'button');
      a.setAttribute('aria-label', T.here);
      a.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>';
      L.DomEvent.disableClickPropagation(box);
      L.DomEvent.on(a, 'click', function (e) {
        L.DomEvent.preventDefault(e);
        if (a.classList.contains('cm-busy')) return;
        a.classList.add('cm-busy');
        navigator.geolocation.getCurrentPosition(function (pos) {
          a.classList.remove('cm-busy');
          var ll = [pos.coords.latitude, pos.coords.longitude];
          if (me) m.removeLayer(me);
          me = L.circleMarker(ll, { radius: 8, color: '#fff', weight: 3, fillColor: '#2563EB', fillOpacity: 1, interactive: false }).addTo(m);
          m.once('moveend', function () {
            // The page redraws its markers ~200 ms after a move. Then look for any
            // marker in view other than the blue dot.
            setTimeout(function () {
              var b = m.getBounds(), hit = false;
              m.eachLayer(function (l) {
                if (hit || l === me || !(l instanceof L.CircleMarker)) return;
                if (b.contains(l.getLatLng())) hit = true;
              });
              if (!hit) toast(T.none + ' <a href="/cameras/">' + T.all + '</a>');
            }, 600);
          });
          m.setView(ll, Math.max(m.getZoom(), 11));
        }, function (err) {
          a.classList.remove('cm-busy');
          toast(err && err.code === 1 ? T.denied : T.fail);
        }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 });
      });
      return box;
    }
  });
  if (navigator.geolocation) m.addControl(new Locate());

  // 1. Layers panel, behind an icon button under the near-me button.
  if (panel) {
    var lbtn = null;
    var place = function () {
      if (!lbtn) return;
      var op = panel.offsetParent.getBoundingClientRect(), mb = m.getContainer().getBoundingClientRect();
      var top = lbtn.getBoundingClientRect().top - op.top - 6;
      panel.style.maxHeight = '';
      // Short map (a phone turned sideways): start the box at the top of the map so the
      // tiles fit beside the buttons, and let it scroll if it still does not (10-30).
      var mapTop = mb.top - op.top + 8, mapBottom = mb.bottom - op.top - 8;
      if (top + panel.offsetHeight > mapBottom) top = Math.max(mapTop, mapBottom - panel.offsetHeight);
      panel.style.top = Math.round(top) + 'px';
      if (top + panel.offsetHeight > mapBottom) panel.style.maxHeight = Math.round(mapBottom - top) + 'px';
    };
    var set = function (open) {
      panel.classList.toggle('cm-closed', !open);
      if (open) place();
      if (lbtn) { lbtn.setAttribute('aria-expanded', open ? 'true' : 'false'); lbtn.classList.toggle('cm-on', open); }
    };
    var Layers = L.Control.extend({
      options: { position: 'topleft' },
      onAdd: function () {
        var box = L.DomUtil.create('div', 'leaflet-bar leaflet-control cm-layers-btn');
        lbtn = L.DomUtil.create('a', '', box);
        lbtn.href = '#';
        lbtn.title = T.layers;
        lbtn.setAttribute('role', 'button');
        lbtn.setAttribute('aria-label', T.layers);
        lbtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 2 8l10 5 10-5-10-5z"/><path d="M2 13l10 5 10-5"/></svg>';
        L.DomEvent.disableClickPropagation(box);
        L.DomEvent.on(lbtn, 'click', function (e) { L.DomEvent.preventDefault(e); box.classList.remove('cm-pulse'); set(panel.classList.contains('cm-closed')); });
        return box;
      }
    });
    m.addControl(new Layers());
    L.DomEvent.disableClickPropagation(panel);
    // A phone turned sideways is wider than 600px but under 520px tall (map-kit.css section 7).
    // There the open panel covered the left third of the map, so it starts closed there too.
    var compact = window.matchMedia('(max-width:600px), (max-height:520px)');
    // Closed on arrival at every width, with a pulsing button (Leah, 10-30).
    var fit = function () { set(false); };
    fit();
    if (lbtn) lbtn.parentNode.classList.add('cm-pulse');
    window.addEventListener('resize', function () { if (!panel.classList.contains('cm-closed')) place(); });
    if (compact.addEventListener) compact.addEventListener('change', fit);
    // A tap on the map closes the box, at every width (Leah, 10-30).
    m.on('click', function () { set(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.classList.contains('cm-closed')) set(false); });
  }
})();

/* 5. Camera card arrows (Leah, 2026-10-16: "want arrows to skip thru cams" and "need this fix on
   many pages if its not right here and make rule in future"). RULE: camera-card behaviour lives
   HERE, once, not in a page generator. Every camera map (state, city, pass, corridor, ski,
   es/pt) loads this file, so a change here reaches all of them without regenerating a page.
   How it finds the cameras: a page may register window.MCCamMap = { list: fn -> cameras,
   open: fn(camera, pan) } (the ski pages do, because they group cameras per pole); otherwise
   the page conventions are used as they are: `let CAMS` (objects with lat, lon, title, route,
   mp, img, stream), `function showCard`, `function camCard`, optional `function playStream`,
   and the page-level `map`. The card is `.co-card` or `.sk-card`.
   Order: the cameras on the same route as the open one, by mile marker (a driver steps along
   the road); a camera with no route or no mile falls back to nearest-first from the open one.
   ‹ › buttons at the top of the card and the keyboard arrows while the card is open. The map
   pans to each camera as you step. */
(function () {
  var card = document.querySelector('.co-card, .sk-card');
  if (!card) return;
  function pageMap() { try { return (typeof map !== 'undefined' && map && map.panTo) ? map : null; } catch (e) { return null; } }
  function api() {
    if (window.MCCamMap && typeof window.MCCamMap.list === 'function' && typeof window.MCCamMap.open === 'function') return window.MCCamMap;
    try {
      if (typeof CAMS !== 'undefined' && Array.isArray(CAMS) && typeof showCard === 'function' && typeof camCard === 'function') {
        return { list: function () { return CAMS; }, open: function (c, pan) { showCard(camCard(c)); if (c.stream && typeof playStream === 'function') playStream(c.stream); var m = pageMap(); if (pan && m) m.panTo([c.lat, c.lon]); } };
      }
    } catch (e) {}
    return null;
  }
  function routeKey(c) { return String(c.route || '').toUpperCase().replace(/\s+/g, ' ').trim(); }
  function dist(a, b) { var p = Math.PI / 180, x = (b.lat - a.lat) * p, y = (b.lon - a.lon) * p, h = Math.sin(x / 2) * Math.sin(x / 2) + Math.cos(a.lat * p) * Math.cos(b.lat * p) * Math.sin(y / 2) * Math.sin(y / 2); return 2 * 6371 * Math.asin(Math.sqrt(h)); }
  // The sequence the arrows walk, and where the open camera sits in it.
  function sequence(all, cur) {
    var r = routeKey(cur), list = [], label;
    if (r && isFinite(+cur.mp) && +cur.mp > 0) {
      list = all.filter(function (c) { return routeKey(c) === r && isFinite(+c.mp) && +c.mp > 0; });
      list.sort(function (a, b) { return (+a.mp - +b.mp) || String(a.title).localeCompare(String(b.title)); });
      label = 'on ' + cur.route + ' by mile';
    }
    if (list.length < 2) {
      list = all.slice().sort(function (a, b) { return dist(cur, a) - dist(cur, b); });
      label = 'nearest first';
    }
    return { list: list, i: list.indexOf(cur), label: label };
  }
  // Which camera is the card showing? Match the image (before the cache-buster), then the title.
  function current(all) {
    var img = card.querySelector('img.cc-img'), title = card.querySelector('.cc-title');
    var src = img ? String(img.getAttribute('src') || '').replace(/[?&]t=\d+$/, '') : '';
    var t = title ? title.textContent.replace(/^\d+ cameras at this spot/, '').trim() : '';
    var hit = null;
    if (src) hit = all.filter(function (c) { return c.img && String(c.img).replace(/[?&]t=\d+$/, '') === src; })[0];
    if (!hit && t) hit = all.filter(function (c) { return String(c.title || '').trim() === t; })[0];
    return hit || null;
  }
  var busy = false, curSeq = null;
  function step(d) {
    if (!curSeq || curSeq.i < 0) return;
    var A = api(); if (!A) return;
    var n = curSeq.list.length, j = ((curSeq.i + d) % n + n) % n;
    busy = true; A.open(curSeq.list[j], true); busy = false;
    decorate();
  }
  function decorate() {
    if (card.style.display === 'none' || card.querySelector('.cm-camnav')) return;
    var A = api(); if (!A) return;
    var all = A.list(); if (!all || all.length < 2) return;
    var cur = current(all); if (!cur) { curSeq = null; return; }
    curSeq = sequence(all, cur); if (curSeq.i < 0) { curSeq = null; return; }
    var nav = document.createElement('div'); nav.className = 'cm-camnav';
    nav.innerHTML = '<button type="button" class="cm-prev" aria-label="Previous camera">‹</button><span title="Camera ' + (curSeq.i + 1) + ' of ' + curSeq.list.length + ', ' + curSeq.label + '">' + (curSeq.i + 1) + ' of ' + curSeq.list.length + ' \u00B7 ' + curSeq.label.replace(/^on /, '') + '</span><button type="button" class="cm-next" aria-label="Next camera">›</button>';
    nav.querySelector('.cm-prev').addEventListener('click', function (e) { e.stopPropagation(); step(-1); });
    nav.querySelector('.cm-next').addEventListener('click', function (e) { e.stopPropagation(); step(1); });
    var title = card.querySelector('.cc-title');
    if (title) card.insertBefore(nav, title); else card.appendChild(nav);
  }
  new MutationObserver(function () { if (!busy) decorate(); }).observe(card, { childList: true });
  document.addEventListener('keydown', function (e) {
    if (card.style.display === 'none' || !card.querySelector('.cm-camnav')) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); } else if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
  });
})();

/* 6. Full screen (Leah, 2026-10-16: "can we pop out or full screen a map?"). One button on every
   map that loads this kit, under the zoom control. Native full screen where the browser offers
   it (desktop, Android); on iPhone Safari, which has no requestFullscreen for a div, the map's
   box is pinned over the page instead. The button, Esc, or the browser's own exit leaves it.
   The box that goes full screen is the map's wrapper when the page has one (the camera card,
   the status pill and the layers panel sit inside it, so they come along), else the map itself.
   Every map section 0 finds gets the button, including maps a page keeps inside a function. */
(function () {
  if (!window.MCMaps) return;
  MCMaps.each(function (m) {
  if (m._mcFs || !m.getContainer) return;
  m._mcFs = true;
  var el = m.getContainer(), wrap = el.parentElement;
  var target = (wrap && wrap !== document.body && getComputedStyle(wrap).position === 'relative') ? wrap : el;
  var native = !!(target.requestFullscreen && document.exitFullscreen);
  var btn = null;
  var ICON_IN = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>';
  var ICON_OUT = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>';
  function isOn() { return document.fullscreenElement === target || target.classList.contains('cm-fs'); }
  function settle() {
    var on = isOn();
    target.classList.toggle('cm-fs-on', on);
    document.documentElement.classList.toggle('cm-fs-doc', on);
    if (btn) { btn.innerHTML = on ? ICON_OUT : ICON_IN; btn.title = on ? 'Exit full screen' : 'Full screen'; btn.setAttribute('aria-label', btn.title); }
    setTimeout(function () { m.invalidateSize(); }, 80);
    setTimeout(function () { m.invalidateSize(); }, 400);
  }
  function pin() { if (!isOn()) { target.classList.add('cm-fs'); settle(); } }
  function enter() {
    if (!native) return pin();
    // Some embedders leave the native request pending with no answer; after 700 ms the pinned mode takes over.
    var t = setTimeout(pin, 700);
    var p; try { p = target.requestFullscreen(); } catch (e) { clearTimeout(t); return pin(); }
    if (p && p.then) p.then(function () { clearTimeout(t); settle(); }, function () { clearTimeout(t); pin(); });
  }
  function exit() {
    if (document.fullscreenElement === target) { document.exitFullscreen().catch(function () {}); }
    target.classList.remove('cm-fs'); settle();
  }
  var Ctl = L.Control.extend({ options: { position: 'topleft' }, onAdd: function () {
    var box = L.DomUtil.create('div', 'leaflet-bar leaflet-control cm-fs-btn');
    btn = L.DomUtil.create('a', '', box); btn.href = '#'; btn.setAttribute('role', 'button');
    L.DomEvent.on(btn, 'click', function (e) { L.DomEvent.stop(e); if (isOn()) exit(); else enter(); });
    L.DomEvent.disableClickPropagation(box);
    settle();
    return box;
  } });
  m.addControl(new Ctl());
  document.addEventListener('fullscreenchange', settle);
  document.addEventListener('fullscreenerror', function () { pin(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && target.classList.contains('cm-fs')) exit(); });
  });
})();

/* 8. The status pill on the map (Leah, 2026-10-16: "you have the live cam count twice. remove from
   map. it clutters it."). The stat cards under the hero already carry the counts, so the pill
   (.co-bs on the camera, pass, corridor and ski maps) is hidden whenever it is showing numbers,
   and shown only for a message with none: "Loading…", "cameras unavailable", "plow feed
   unavailable", "Live cameras are busy right now". Each page keeps writing the pill as before. */
(function () {
  var pills = document.querySelectorAll('.co-bs');
  if (!pills.length) return;
  function apply(p) { var t = (p.textContent || '').trim(); p.classList.toggle('cm-hide', /\d/.test(t)); }
  pills.forEach(function (p) {
    apply(p);
    new MutationObserver(function () { apply(p); }).observe(p, { childList: true, characterData: true, subtree: true });
  });
})();

/* 9. 511 Alberta's "No live camera feed at this time" card (Leah, 2026-10-16). When an Alberta
   camera has no feed, 511 Alberta answers with its own 540 x 330 picture saying so, and a camera
   card showed it as if it were the road. Any camera image on any page that loads as exactly that
   picture is replaced with a line saying what it is. The ski pages found it first. */
(function () {
  document.addEventListener('load', function (e) {
    var img = e.target;
    if (!img || img.tagName !== 'IMG' || !/state=AB/.test(img.src || '')) return;
    if (img.naturalWidth !== 540 || img.naturalHeight !== 330) return;
    var d = document.createElement('div');
    d.className = 'cc-meta cm-nofeed';
    d.textContent = '511 Alberta has no live feed from this camera right now.';
    var a = img.closest('a');
    (a || img).replaceWith(d);
  }, true);
})();

/* 10. A camera the DOT files under the wrong road (Leah, 2026-10-16: UDOT lists "I-215 W SB @ 450 N" under
   I-80). data/camera-route-notes.json holds only cameras whose own name names another road, that sit within
   half a mile of that road and well off the one they are filed under (scripts/check-camera-routes.mjs).
   The open card gets one line saying so. The list loads once, the first time a card opens. */
(function () {
  var card = document.querySelector('.co-card, .sk-card');
  if (!card) return;
  var notes = null, asked = false;
  function idOf() {
    var img = card.querySelector('img.cc-img');
    var m = img && String(img.getAttribute('src') || '').match(/[?&]id=([^&]+)/);
    return m ? decodeURIComponent(m[1]) : null;
  }
  function apply() {
    if (!notes || card.querySelector('.cm-routenote')) return;
    var n = notes[idOf()];
    if (!n) return;
    var d = document.createElement('div');
    d.className = 'cm-routenote';
    d.textContent = 'This camera appears to be on ' + n.on + ', not ' + n.listed + ' as the DOT feed lists it.';
    card.appendChild(d);
  }
  function load() {
    if (asked) return apply();
    asked = true;
    fetch('/data/camera-route-notes.json').then(function (r) { return r.ok ? r.json() : null; }).then(function (j) { notes = (j && j.cameras) || {}; apply(); }).catch(function () { notes = {}; });
  }
  new MutationObserver(function () { if (card.style.display !== 'none' && card.querySelector('img.cc-img')) load(); }).observe(card, { childList: true, subtree: true });
})();

/* 11. Credit line at the top right on phones and short screens (map-kit.css section 11). Safari's
   floating address bar covers the bottom of the screen, where Leaflet puts the credit. A copy of
   the credit goes in the top-right corner; CSS shows it and hides the bottom one at those sizes. */
(function () {
  if (!window.MCMaps) return;
  window.MCMaps.each(function (m) {
    var c = m.getContainer(), src = c.querySelector('.leaflet-control-attribution');
    var tr = c.querySelector('.leaflet-top.leaflet-right');
    if (!src || !tr || tr.querySelector('.cm-attr-top')) return;
    var d = document.createElement('div');
    d.className = 'leaflet-control cm-attr-top';
    function sync() { d.innerHTML = src.innerHTML; }
    sync();
    new MutationObserver(sync).observe(src, { childList: true, subtree: true, characterData: true });
    d.addEventListener('click', function (e) { if (!e.target.closest('a')) d.classList.toggle('cm-open'); });
    L.DomEvent.disableClickPropagation(d);
    tr.appendChild(d);
  });
})();

// ---- Pulse on the open pin (Leah, 10-30: "it doesn't pulse on the dot where the camera is
// that I have pulled up"). Whatever pin you open, by tapping it or with a page's Next/Prev
// or list buttons, gets a green ring that pulses until its card or popup closes.
(function () {
  if (typeof L === 'undefined' || !L.Evented) return;
  var ring = null, ringMap = null, lastPinClick = null;
  function clear() { if (ring && ringMap) ringMap.removeLayer(ring); ring = ringMap = null; }
  function pulseAt(m, ll) {
    if (!m || !ll) return;
    clear();
    if (!m.getPane('mcPulse')) { var p = m.createPane('mcPulse'); p.style.zIndex = 640; p.style.pointerEvents = 'none'; }
    ring = L.marker(ll, { pane: 'mcPulse', interactive: false, keyboard: false, icon: L.divIcon({ className: 'cm-ring', html: '<span></span>', iconSize: [0, 0] }) }).addTo(m);
    ringMap = m;
  }
  // Every marker and dot click, whenever the pin was made.
  var fire = L.Evented.prototype.fire;
  L.Evented.prototype.fire = function (type) {
    if (type === 'click' && this._map && (this instanceof L.CircleMarker || (L.Marker && this instanceof L.Marker)) && this.options && this.options.interactive !== false) {
      try { pulseAt(this._map, this.getLatLng()); lastPinClick = arguments[1] && arguments[1].originalEvent; } catch (e) {}
    }
    return fire.apply(this, arguments);
  };
  // Pages that open a camera from a list or Next/Prev centre the map on it and show
  // #coCard; ring the centre when that happens, clear it when the card hides.
  function cardShown() { var c = document.getElementById('coCard'); return c && c.style.display === 'block' && c.offsetParent !== null; }
  if (window.MCMaps) MCMaps.each(function (m) {
    ['setView', 'panTo', 'flyTo'].forEach(function (fn) {
      var orig = m[fn];
      if (!orig) return;
      m[fn] = function (ll) {
        var r = orig.apply(m, arguments), target = L.latLng(ll);
        setTimeout(function () { if (cardShown() && (!ring || !ring.getLatLng().equals(target, 1e-5))) pulseAt(m, target); }, 60);
        return r;
      };
    });
    // A tap on a dot also reaches the map behind it; clear only on a tap on bare map.
    m.on('click', function (e) { if (!lastPinClick || e.originalEvent !== lastPinClick) clear(); });
    m.on('popupclose', function () { setTimeout(function () { if (!cardShown() && !(m._popup && m.hasLayer(m._popup))) clear(); }, 0); });
  });
  var card = document.getElementById('coCard');
  if (card && window.MutationObserver) new MutationObserver(function () { if (!cardShown() && !(ringMap && ringMap._popup && ringMap.hasLayer(ringMap._popup))) clear(); }).observe(card, { attributes: true, attributeFilter: ['style', 'class'] });
})();

// Popups open clear of the button column on the left of every map (10-30).
if (typeof L !== 'undefined' && L.Popup) L.Popup.prototype.options.autoPanPaddingTopLeft = L.point(60, 12);
