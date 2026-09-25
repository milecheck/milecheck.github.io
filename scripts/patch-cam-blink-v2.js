// Fixes patch-cam-blink.js: this site's Leaflet map uses the CANVAS renderer, not
// SVG, so circleMarkers have no per-shape DOM element — a CSS class + @keyframes
// animation is a silent no-op. Canvas markers must be re-styled via setStyle() on
// an interval instead. Run once, after patch-cam-blink.js.
const fs = require('fs');

const PAGES = [
  'passes/snoqualmie/index.html', 'passes/stevens/index.html', 'passes/siskiyou/index.html',
  'passes/grapevine/index.html', 'passes/donner/index.html', 'passes/cajon/index.html',
  'passes/parleys/index.html', 'passes/eisenhower/index.html', 'passes/vail/index.html',
  'passes/cabbage-hill/index.html',
];

const CSS_OLD = `    @keyframes camBlink{0%,100%{stroke-width:1.5;stroke:#fff;}50%{stroke-width:4;stroke:#FBBF24;}}
    .leaflet-interactive.cam-selected{animation:camBlink 1s ease-in-out infinite;}`;
const CSS_NEW = ``; // dead CSS for the old (wrong) SVG-only approach — remove

const HELPER_OLD = `function selectCamMarker(m){if(selectedMarker&&selectedMarker!==m&&selectedMarker._path)selectedMarker._path.classList.remove('cam-selected');selectedMarker=m||null;if(m&&m._path)m._path.classList.add('cam-selected');}`;
const HELPER_NEW = `let blinkTimer=null,blinkBase=null,blinkOn=false;
function selectCamMarker(m){if(blinkTimer){clearInterval(blinkTimer);blinkTimer=null;}if(selectedMarker&&blinkBase)selectedMarker.setStyle(blinkBase);selectedMarker=m||null;blinkBase=null;if(m){blinkBase={radius:m.options.radius,weight:m.options.weight,color:m.options.color};blinkOn=false;blinkTimer=setInterval(()=>{blinkOn=!blinkOn;m.setStyle(blinkOn?{radius:blinkBase.radius+3,weight:4,color:'#FBBF24'}:blinkBase);},500);}}`;

let filesChanged = 0;
for (const page of PAGES) {
  let html = fs.readFileSync(page, 'utf8');
  let ok = true;
  for (const [label, oldStr, newStr] of [['dead CSS', CSS_OLD, CSS_NEW], ['helper', HELPER_OLD, HELPER_NEW]]) {
    const count = html.split(oldStr).length - 1;
    if (count !== 1) { console.error(`SKIP ${page}: "${label}" matched ${count} times (expected 1)`); ok = false; break; }
    html = html.replace(oldStr, newStr);
  }
  if (!ok) continue;
  fs.writeFileSync(page, html);
  filesChanged++;
  console.log(`patched ${page}`);
}
console.log(`\n${filesChanged}/${PAGES.length} pages patched.`);
