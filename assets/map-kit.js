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
  function buildOptions() {
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
      return;
    }
    var layers = (O.layers || []).filter(function (l) { return l && l.layer; });
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
        var html = '<div class="lt">Map options</div>';
        layers.forEach(function (l, i) {
          html += '<label class="cm-opts-row"><input type="checkbox" data-i="' + i + '"' + (gm.hasLayer(l.layer) ? ' checked' : '') + '><span class="cm-sw" style="--on:' + (l.color || '#0f7a4f') + '"></span>' + (l.color ? '<span class="cm-dot" style="background:' + l.color + '"></span>' : '') + l.label + '</label>';
        });
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
        });
        panel.addEventListener('click', function (e) {
          var b = e.target.closest('button[data-b]');
          if (!b) return;
          baseNames.forEach(function (n) { if (gm.hasLayer(bases[n])) gm.removeLayer(bases[n]); });
          gm.addLayer(bases[b.dataset.b]);
          if (bases[b.dataset.b].bringToBack) bases[b.dataset.b].bringToBack();
          panel.querySelectorAll('button[data-b]').forEach(function (x) { x.classList.toggle('cm-on', x === b); });
        });
        var set = function (open) {
          panel.classList.toggle('cm-closed', !open);
          btn.classList.toggle('cm-on', open);
          btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        };
        L.DomEvent.on(btn, 'click', function (e) {
          L.DomEvent.preventDefault(e);
          bar.classList.remove('cm-pulse');
          set(panel.classList.contains('cm-closed'));
        });
        set(!phoneQ.matches);
        if (phoneQ.matches) bar.classList.add('cm-pulse');
        gm.on('click', function () { if (phoneQ.matches) set(false); });
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape') set(false); });
        return wrap;
      }
    });
    gm.addControl(new Opts());
  }
  // Built on window load: some pages add their layers in a load handler of their own.
  if (document.readyState === 'complete') buildOptions(); else window.addEventListener('load', buildOptions);

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
  var lst = document.getElementById('lstCams');
  var lul = lst && lst.querySelector('ul');
  if (lul) {
    var unfolded = false, more = null;
    var fold = function () {
      var items = [].slice.call(lul.querySelectorAll('li[data-i]'));
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
          if (!unfolded && lst.getBoundingClientRect().top < 0) lst.scrollIntoView({ block: 'start' });
        });
        lul.parentNode.insertBefore(more, lul.nextSibling);
      }
      more.hidden = false;
      more.textContent = unfolded ? 'Show fewer cameras' : 'Show all ' + items.length + ' cameras';
      more.setAttribute('aria-expanded', unfolded ? 'true' : 'false');
    };
    new MutationObserver(fold).observe(lul, { childList: true });
    fold();
    var allBtn = document.getElementById('btnAllCams');
    if (allBtn) allBtn.addEventListener('click', function () { unfolded = true; fold(); });
  }

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
      var top = lbtn.getBoundingClientRect().top - panel.offsetParent.getBoundingClientRect().top;
      panel.style.top = Math.round(top - 6) + 'px';
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
    var fit = function () { set(!compact.matches); };
    fit();
    if (compact.matches && lbtn) lbtn.parentNode.classList.add('cm-pulse');
    window.addEventListener('resize', function () { if (!panel.classList.contains('cm-closed')) place(); });
    if (compact.addEventListener) compact.addEventListener('change', fit);
    m.on('click', function () { if (compact.matches) set(false); });
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
