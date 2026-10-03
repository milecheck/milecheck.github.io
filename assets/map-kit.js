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
    var O = window.mcMapOptions;
    if (!gm || !O || gm._mcOpts) return;
    gm._mcOpts = true;
    var layers = (O.layers || []).filter(function (l) { return l && l.layer; });
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
    var fit = function () { set(!phone.matches); };
    fit();
    if (phone.matches && lbtn) lbtn.parentNode.classList.add('cm-pulse');
    window.addEventListener('resize', function () { if (!panel.classList.contains('cm-closed')) place(); });
    if (phone.addEventListener) phone.addEventListener('change', fit);
    m.on('click', function () { if (phone.matches) set(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.classList.contains('cm-closed')) set(false); });
  }
})();
