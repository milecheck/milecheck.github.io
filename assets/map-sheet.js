// Draws the printable map sheets. scripts/gen-map-sheets.mjs places every pin and label
// at build time and hands this file the result as window.SHEET. Nothing here decides
// where anything goes. window.sheetReady resolves when the tiles are in and the text
// fits, which is what scripts/print-map-sheets.mjs waits for before it makes the PDF.
(function () {
  var S = window.SHEET;
  if (!S || !window.L) { window.sheetReady = Promise.resolve(); return; }
  // USGS The National Map. Public domain. Drawn at double density so it prints sharp.
  // The PDF build points SHEET_TILES at its own copy of the same tiles, as JPEG, to keep the file small.
  var TILES = window.SHEET_TILES || 'https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}';
  var W = { motorway: 5, trunk: 3.8, primary: 3.8, named: 3.4, secondary: 2.6, tertiary: 1.6 };
  var C = { motorway: '#c2410c', trunk: '#1d2a1f', primary: '#1d2a1f', named: '#1d2a1f', secondary: '#1d2a1f', tertiary: '#5b6b60' };
  var ORDER = ['tertiary', 'secondary', 'named', 'primary', 'trunk', 'motorway'];

  // A numbered stop or a lettered note, pushed off its true spot by dx,dy with a
  // leader line back to it when the declutter moved it.
  function markerIcon(p, cls, text, bg) {
    var dx = p.dx || 0, dy = p.dy || 0, h = '';
    if (Math.abs(dx) + Math.abs(dy) > 3) {
      h += '<i class="ld" style="width:' + Math.hypot(dx, dy).toFixed(1) + 'px;transform:rotate(' + (Math.atan2(dy, dx) * 180 / Math.PI).toFixed(1) + 'deg)"></i><i class="dot"></i>';
    }
    h += '<b class="' + cls + '" style="left:' + dx + 'px;top:' + dy + 'px' + (bg ? ';background:' + bg : '') + '">' + text + '</b>';
    return L.divIcon({ className: 'ms', html: h, iconSize: [0, 0] });
  }
  function pinIcon(p) { return markerIcon(p, 'pin', p.n, p.c); }

  function make(id, v, pins, star, scale, notes) {
    var map = L.map(id, { zoomControl: false, attributionControl: false, dragging: false, scrollWheelZoom: false, doubleClickZoom: false, touchZoom: false, boxZoom: false, keyboard: false, zoomSnap: 0, fadeAnimation: false, zoomAnimation: false }).setView([v.lat, v.lon], v.z);
    var tiles = L.tileLayer(TILES, { tileSize: 128, zoomOffset: 1, maxNativeZoom: 15, maxZoom: 17, opacity: 0.82 });
    var loaded = new Promise(function (done) { tiles.on('load', done); setTimeout(done, 25000); });
    tiles.addTo(map);
    ORDER.forEach(function (cls) { S.roads.forEach(function (r) { if (r.c === cls) L.polyline(r.p, { color: '#fff', weight: W[cls] * scale + 2.6, opacity: 0.95, interactive: false }).addTo(map); }); });
    ORDER.forEach(function (cls) { S.roads.forEach(function (r) { if (r.c === cls) L.polyline(r.p, { color: C[cls], weight: W[cls] * scale, opacity: 1, interactive: false }).addTo(map); }); });
    (notes || []).forEach(function (q) { L.marker(q.ll, { interactive: false, zIndexOffset: 450, icon: markerIcon(q, 'note', q.letter) }).addTo(map); });
    if (star) L.marker(S.star, { interactive: false, zIndexOffset: 300, icon: L.divIcon({ className: 'ms', html: '<span class="star">★</span>', iconSize: [0, 0] }) }).addTo(map);
    pins.forEach(function (p) { L.marker(p.ll, { interactive: false, zIndexOffset: 500, icon: pinIcon(p) }).addTo(map); });
    return loaded;
  }

  // Shrink the text until it fits its box. Past the floor, drop the last section.
  function fit(el) {
    var floor = parseFloat(el.getAttribute('data-fit')), size = parseFloat(getComputedStyle(el).fontSize) * 0.75;
    el.setAttribute('data-top', size.toFixed(1));
    var over = function () { return el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1; };
    while (over() && size > floor) { size -= 0.2; el.style.fontSize = size.toFixed(1) + 'pt'; }
    while (over()) {
      var s = Array.prototype.slice.call(el.querySelectorAll('section'));
      if (s.length < 2) break;
      s.sort(function (a, b) { return (+a.getAttribute('data-pri') - +b.getAttribute('data-pri')) || (b.textContent.length - a.textContent.length); });
      s[0].remove();
    }
    // with sections gone there may be room to read it larger again
    var top = parseFloat(el.getAttribute('data-top') || '8.8');
    while (size < top) { el.style.fontSize = (size + 0.2).toFixed(1) + 'pt'; if (over()) { el.style.fontSize = size.toFixed(1) + 'pt'; break; } size += 0.2; }
  }
  // A short write-up leaves most of the back empty. The text takes the height it needs
  // and the rest becomes ruled lines to write on.
  function notes() {
    var text = document.querySelector('.back .text'), box = document.querySelector('.back .notes');
    if (!text || !box) return;
    var k = text.getBoundingClientRect().width / text.offsetWidth || 1, top = text.getBoundingClientRect().top, used = 0;
    Array.prototype.forEach.call(text.children, function (c) { Array.prototype.forEach.call(c.getClientRects(), function (r) { used = Math.max(used, (r.bottom - top) / k); }); });
    if (text.clientHeight - used < 170) return;
    text.style.flex = 'none'; text.style.height = Math.ceil(used + 4) + 'px';
    box.hidden = false;
    var lines = box.querySelector('div');
    lines.innerHTML = new Array(Math.floor(lines.clientHeight / 27) + 1).join('<i></i>');
  }
  function scaleToScreen() {
    var s = Math.min(1, (document.documentElement.clientWidth - 24) / 988);
    document.querySelectorAll('.fit').forEach(function (f) {
      f.style.width = (988 * s) + 'px'; f.style.height = (748 * s) + 'px';
      f.firstElementChild.style.transform = s < 1 ? 'scale(' + s + ')' : '';
    });
  }

  var waits = [make('map', S.main, S.pins, true, 1, S.notes)];
  if (S.inset) waits.push(make('inset', S.inset, S.insetPins, S.insetStar, 1.25, S.insetNotes));
  var fonts = (document.fonts && document.fonts.ready) || Promise.resolve();
  waits.push(fonts.then(function () { document.querySelectorAll('[data-fit]').forEach(fit); notes(); }));
  scaleToScreen();
  window.addEventListener('resize', scaleToScreen);
  window.sheetReady = Promise.all(waits).then(function () { return new Promise(function (r) { setTimeout(r, 400); }); });
})();
