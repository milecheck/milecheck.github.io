// One-off surgical patch (2026-09-25): add the "selected camera blinks on the map"
// highlight to the live pass-page camera popups. Written as a targeted patch, NOT
// via gen-pass-pages.js, because that generator has drifted behind several rounds
// of hand-patching (Prev/Next nav, GA4, campaign-tagged store links, the Highway
// Report signup band) — regenerating from it strips all of that. Fix the generator
// drift separately; this only touches the exact known-live JS/CSS text below.
const fs = require('fs');

const PAGES = [
  'passes/snoqualmie/index.html', 'passes/stevens/index.html', 'passes/siskiyou/index.html',
  'passes/grapevine/index.html', 'passes/donner/index.html', 'passes/cajon/index.html',
  'passes/parleys/index.html', 'passes/eisenhower/index.html', 'passes/vail/index.html',
  'passes/cabbage-hill/index.html',
];

const CSS_OLD = `    .co-card .cc-count{font-size:11.5px;color:#5b6670;}`;
const CSS_NEW = `    .co-card .cc-count{font-size:11.5px;color:#5b6670;}
    @keyframes camBlink{0%,100%{stroke-width:1.5;stroke:#fff;}50%{stroke-width:4;stroke:#FBBF24;}}
    .leaflet-interactive.cam-selected{animation:camBlink 1s ease-in-out infinite;}`;

const VARS_OLD = `let CAMS=[], ALERTS=[], CONDS=[], FIRES=[], PLOWLIST=[], showCam=true, showAlr=true, showFire=true, showPlow=true;`;
const VARS_NEW = `let CAMS=[], ALERTS=[], CONDS=[], FIRES=[], PLOWLIST=[], showCam=true, showAlr=true, showFire=true, showPlow=true, camMarkers=[], selectedMarker=null;
function selectCamMarker(m){if(selectedMarker&&selectedMarker!==m&&selectedMarker._path)selectedMarker._path.classList.remove('cam-selected');selectedMarker=m||null;if(m&&m._path)m._path.classList.add('cam-selected');}`;

const SHOWCARD_OLD = `cardEl.querySelector('.cx').onclick=function(){cardEl.style.display='none';};const p=cardEl.querySelector('.cc-prev')`;
const SHOWCARD_NEW = `cardEl.querySelector('.cx').onclick=function(){cardEl.style.display='none';selectCamMarker(null);};const p=cardEl.querySelector('.cc-prev')`;

const SHOWCAMAT_OLD = `function showCamAt(i){const n=((i%CAMS.length)+CAMS.length)%CAMS.length;const c=CAMS[n];showCard(camCard(c,n),false,n);map.panTo([c.lat,c.lon]);}`;
const SHOWCAMAT_NEW = `function showCamAt(i){const n=((i%CAMS.length)+CAMS.length)%CAMS.length;const c=CAMS[n];showCard(camCard(c,n),false,n);selectCamMarker(camMarkers[n]);map.panTo([c.lat,c.lon]);}`;

const DRAW_OLD = `function draw(){camLayer.clearLayers();alrLayer.clearLayers();fireLayer.clearLayers();plowLayer.clearLayers();if(PLOWS&&showPlow)PLOWLIST.forEach(t=>L.marker([t.lat,t.lon],{icon:plowIcon(t.bearing)}).on('click',()=>showCard(plowCard(t),false)).addTo(plowLayer));if(showCam)CAMS.forEach((c,i)=>L.circleMarker([c.lat,c.lon],{radius:RS(c.src?7:6),color:'#fff',weight:1.5,fillColor:c.src?'#7C3AED':'#0f7a4f',fillOpacity:.95}).on('click',()=>showCard(camCard(c,i),false,i)).addTo(camLayer));if(showAlr)`;
const DRAW_NEW = `function draw(){camLayer.clearLayers();alrLayer.clearLayers();fireLayer.clearLayers();plowLayer.clearLayers();selectedMarker=null;camMarkers=[];if(PLOWS&&showPlow)PLOWLIST.forEach(t=>L.marker([t.lat,t.lon],{icon:plowIcon(t.bearing)}).on('click',()=>showCard(plowCard(t),false)).addTo(plowLayer));if(showCam)CAMS.forEach((c,i)=>{const m=L.circleMarker([c.lat,c.lon],{radius:RS(c.src?7:6),color:'#fff',weight:1.5,fillColor:c.src?'#7C3AED':'#0f7a4f',fillOpacity:.95}).on('click',()=>{showCard(camCard(c,i),false,i);selectCamMarker(m);}).addTo(camLayer);camMarkers[i]=m;});if(showAlr)`;

const REPLACEMENTS = [
  ['CSS', CSS_OLD, CSS_NEW],
  ['vars+helper', VARS_OLD, VARS_NEW],
  ['showCard close handler', SHOWCARD_OLD, SHOWCARD_NEW],
  ['showCamAt', SHOWCAMAT_OLD, SHOWCAMAT_NEW],
  ['draw()', DRAW_OLD, DRAW_NEW],
];

let filesChanged = 0;
for (const page of PAGES) {
  let html = fs.readFileSync(page, 'utf8');
  let ok = true;
  for (const [label, oldStr, newStr] of REPLACEMENTS) {
    const count = html.split(oldStr).length - 1;
    if (count !== 1) {
      console.error(`SKIP ${page}: "${label}" matched ${count} times (expected 1)`);
      ok = false;
      break;
    }
    html = html.replace(oldStr, newStr);
  }
  if (!ok) continue;
  fs.writeFileSync(page, html);
  filesChanged++;
  console.log(`patched ${page}`);
}
console.log(`\n${filesChanged}/${PAGES.length} pages patched.`);
