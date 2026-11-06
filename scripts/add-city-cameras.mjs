#!/usr/bin/env node
// City (municipal) traffic cameras on the metro camera pages (2026-11-05).
// Adds a second camera layer, a count, a short source note and the city's required attribution to the
// pages listed in CITY_LAYERS. Idempotent: everything sits between city-cams markers and is replaced
// on each run. Runs from scripts/finish-pages.mjs, so a regenerated page gets its city layer back.
//
// Images: live layers read /cameras?state=CITY_<ABC> on our Worker, which proxies and caches each image
// (/camera-image), so the city's server is asked at most once a minute per camera. The kill switch
// ("CITY_AUS:cameras" etc., docs/source-kill-switch.md) empties the list and the layer shows nothing.
// Vancouver: the dataset licence covers locations, not the images, so its points link to the City's
// own camera page and no image is shown here. Data: data/vancouver-traffic-cameras.json.
// Terms and quotes: business/city-cameras-research-2026-11-05.md in the app repo.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export const CITY_LAYERS = {
  seattle: {
    code: 'CITY_SEA', city: 'Seattle', roads: ['/road-conditions/washington/', 'Washington road conditions'], agency: 'Seattle Department of Transportation (SDOT)', short: 'SDOT',
    attribution: 'City street camera images: Seattle Department of Transportation.',
    sourceUrl: 'https://web.seattle.gov/Travelers/',
    note: 'SDOT cameras watch city streets and intersections. The highway cameras on this map are WSDOT\'s.',
  },
  austin: {
    code: 'CITY_AUS', city: 'Austin', roads: ['/road-conditions/texas/', 'Texas road conditions'], agency: 'Austin Transportation and Public Works', short: 'City of Austin',
    attribution: 'City street camera images: City of Austin, Austin Transportation and Public Works (data.austintexas.gov).',
    sourceUrl: 'https://data.austintexas.gov/Transportation-and-Mobility/Traffic-Cameras/b4k4-adkb',
    note: 'City of Austin cameras sit at intersections across the city. The City says video is not recorded or kept. The highway cameras on this map are TxDOT\'s.',
  },
  surrey: {
    code: 'CITY_SUR', city: 'Surrey', roads: ['/road-conditions/british-columbia/', 'British Columbia road conditions'], agency: 'City of Surrey', short: 'City of Surrey',
    attribution: 'Contains information licensed under the Open Government License - City of Surrey.',
    sourceUrl: 'https://data.surrey.ca/', marker: 'kilometre marker',
    note: 'City of Surrey cameras sit at intersections across Surrey. The highway cameras on this map are DriveBC\'s.',
  },
  vancouver: {
    linkOut: 'data/vancouver-traffic-cameras.json', city: 'Vancouver', roads: ['/road-conditions/british-columbia/', 'British Columbia road conditions'], agency: 'City of Vancouver', short: 'City of Vancouver',
    attribution: 'Contains information licensed under the Open Government Licence – Vancouver.',
    sourceUrl: 'https://opendata.vancouver.ca/explore/dataset/web-cam-url-links/', marker: 'kilometre marker',
    note: 'City of Vancouver camera locations come from the City\'s open data. The images stay on the City\'s site, so tap a city camera and open its view there. The highway cameras with images on this map are DriveBC\'s.',
  },
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const CITY_COLOR = '#c2410c';

function statBlock(c) {
  return `<!-- city-cams-stat:start --><div class="co-stat"><div class="n" id="statCityCams" style="color:${CITY_COLOR}">—</div><div class="l">${c.linkOut ? 'city camera locations' : 'city street cameras'}</div></div><!-- city-cams-stat:end -->`;
}

function guideBlock(c) {
  return `<!-- city-cams:start -->
    <h3 style="font-size:19px;margin:18px 0 6px">${esc(c.city)} city cameras</h3>
    <p>${esc(c.note)} City cameras are the <span style="color:${CITY_COLOR};font-weight:700">orange</span> dots. Highway cameras are green.</p>
    <p>These cameras show recent road images and refresh every few minutes. They are traffic cameras, not red-light or speed cameras.</p>
    <p>For closures and crashes on the highways around ${esc(c.city)}, see <a href="${c.roads[0]}" target="_blank" rel="noopener">${esc(c.roads[1])}</a>.</p>
    <p style="font-size:14px;color:#5b6670">Source: <a href="${c.sourceUrl}" target="_blank" rel="noopener">${esc(c.agency)}</a>. ${esc(c.attribution)}</p>
    <p style="font-size:14px;color:#5b6670">City street cameras are on this website only for now. The <a href="/get/" target="_blank" rel="noopener">MileCheck app</a> shows highway cameras and your ${c.marker || 'mile marker'} as you drive.</p>
    <!-- city-cams:end -->`;
}

function scriptBlock(c, linkData) {
  const cfg = { roads: c.roads, marker: c.marker || 'mile marker', code: c.code || null, city: c.city, agency: c.agency, short: c.short, attribution: c.attribution, color: CITY_COLOR };
  return `<!-- city-cams-js:start -->
<script>
(function(){
  if(typeof map==='undefined'||typeof L==='undefined')return;
  var CFG=${JSON.stringify(cfg)};
  var LINKS=${linkData ? JSON.stringify(linkData) : 'null'};
  var layer=L.layerGroup().addTo(map), CITY=[];
  map.attributionControl.addAttribution(CFG.attribution.replace(/</g,'&lt;'));
  function e(x){return String(x==null?'':x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
  var app='<div style="font-size:12.5px;margin-top:8px"><a href="/get/" target="_blank" rel="noopener" style="color:#0f7a4f;font-weight:700">Get MileCheck</a> for highway cameras and your '+e(CFG.marker)+' as you drive.</div>'
    +'<div style="font-size:12.5px;margin-top:4px"><a href="'+e(CFG.roads[0])+'" target="_blank" rel="noopener" style="color:#0f7a4f;font-weight:700">Closures and crashes: '+e(CFG.roads[1])+'</a></div>';
  function card(c){
    if(c.url){return '<div class="cc-title">'+e(c.title)+'</div><div class="cc-meta">'+e(c.area||'')+(c.area?' · ':'')+e(CFG.short)+'</div>'
      +'<p style="font-size:13.5px;margin:8px 0 0"><a href="'+e(c.url)+'" target="_blank" rel="noopener" style="color:#0f7a4f;font-weight:700">Open this camera on the City of Vancouver site</a></p>'
      +'<div class="cc-meta" style="margin-top:6px">'+e(CFG.attribution)+'</div>'+app;}
    var bust=c.img+(c.img.indexOf('?')>=0?'&':'?')+'t='+Date.now();
    return '<div class="cc-title">'+e(c.title)+'</div><div class="cc-meta">City street camera · '+e(CFG.short)+'</div>'
      +'<a href="'+e(c.img)+'" target="_blank" rel="noopener" title="Open full image"><img class="cc-img" src="'+e(bust)+'" alt="Live: '+e(c.title)+'" onerror="this.alt=\\'image unavailable\\'"></a>'
      +'<div class="cc-meta" style="margin-top:6px">'+e(CFG.attribution)+'</div>'+app;
  }
  function drawCity(){
    layer.clearLayers();var b=map.getBounds();
    var vis=CITY.filter(function(c){return b.contains([c.lat,c.lon]);});
    if(typeof thin==='function')vis=thin(vis,16);
    var r=typeof RS==='function'?RS(5):5;
    vis.forEach(function(c){L.circleMarker([c.lat,c.lon],{radius:r,color:'#fff',weight:1.5,fillColor:CFG.color,fillOpacity:.95}).on('click',function(){showCard(card(c));}).addTo(layer);});
  }
  var t=null;map.on('moveend',function(){clearTimeout(t);t=setTimeout(drawCity,220);});
  function done(){var el=document.getElementById('statCityCams');if(el)el.textContent=CITY.length||'—';drawCity();}
  if(LINKS){CITY=LINKS.map(function(c){return {lat:c.lat,lon:c.lon,title:c.name,area:c.area,url:c.url};});done();return;}
  var tries=0;(function go(){
    fetch('https://api.milecheckapp.com/cameras?state='+CFG.code).then(function(r){if(!r.ok)throw 0;return r.json();}).then(function(d){
      CITY=(d.cameras||[]).filter(function(c){return c.isActive!==false&&isFinite(+c.lat)&&+c.lat&&c.imageUrl;}).map(function(c){return {lat:+c.lat,lon:+c.lon,title:c.title||'City camera',img:c.imageUrl};});
      done();
    }).catch(function(){if(++tries<3)setTimeout(go,1500);});
  })();
})();
</script>
<!-- city-cams-js:end -->`;
}

function between(html, start, end, body, anchorFn) {
  const re = new RegExp(`${start}[\\s\\S]*?${end}`);
  if (re.test(html)) return html.replace(re, () => body);
  return anchorFn(html);
}

let changed = 0;
for (const [slug, c] of Object.entries(CITY_LAYERS)) {
  const path = resolve(ROOT, 'cameras', slug, 'index.html');
  if (!existsSync(path)) { console.warn(`add-city-cameras: no page for ${slug}`); continue; }
  const before = readFileSync(path, 'utf8');
  let html = before;
  const linkData = c.linkOut ? JSON.parse(readFileSync(resolve(ROOT, c.linkOut), 'utf8')).cameras : null;

  html = between(html, '<!-- city-cams-stat:start -->', '<!-- city-cams-stat:end -->', statBlock(c), (h) => {
    const m = h.match(/<div class="co-stat"><div class="n live" id="statCams">[\s\S]*?<\/div><\/div>/);
    if (!m) throw Error(`add-city-cameras: no statCams block in ${slug}`);
    return h.replace(m[0], m[0] + '\n      ' + statBlock(c));
  });
  html = between(html, '<!-- city-cams:start -->', '<!-- city-cams:end -->', guideBlock(c), (h) => {
    const i = h.search(/<section class="co-guide[" ]/);
    if (i < 0) throw Error(`add-city-cameras: no co-guide in ${slug}`);
    const j = h.indexOf('</section>', i);
    return h.slice(0, j) + '  ' + guideBlock(c) + '\n  ' + h.slice(j);
  });
  html = between(html, '<!-- city-cams-js:start -->', '<!-- city-cams-js:end -->', scriptBlock(c, linkData), (h) => {
    const i = h.lastIndexOf('</body>');
    return h.slice(0, i) + scriptBlock(c, linkData) + '\n' + h.slice(i);
  });
  // The page was written for highway cameras only. Say which cameras each line means.
  html = html.replace(/Every camera on this map comes straight from/g, 'Every highway camera on this map comes straight from');
  html = html.replace(/(<div class="l">)(?:live|highway) cameras in ([^<]+)(<\/div>)/, (m, a, city, b) => `${a}highway cameras around ${city}${b}`);
  html = html.replace(/'📷 '\+CAMS\.length\+' (?:live|highway) cameras in /g, "'📷 '+CAMS.length+' highway cameras around ");
  // Footer credit: the city's required line sits next to the state agency's.
  html = html.replace(/(<p class="footer-fineprint">&copy; 2026 MileCheck LLC\. Camera data: [^<]*?)( Always drive)/, (m, a, b) =>
    a.includes(c.attribution) || a.includes(esc(c.attribution)) ? m : `${a} ${esc(c.attribution)}${b}`);
  if (html !== before) { writeFileSync(path, html); changed++; }
}
console.log(`add-city-cameras: ${changed} page(s) changed of ${Object.keys(CITY_LAYERS).length}`);
