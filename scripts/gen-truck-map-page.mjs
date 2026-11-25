#!/usr/bin/env node
// gen-truck-map-page.mjs: builds /truck-restrictions/index.html, the trucker map
// (low bridges, weight-posted and closed bridges, weigh stations, truck parking,
// truck stops, rest areas, runaway truck ramps). Data comes from
// scripts/build-truck-map.py (data/restrictions/<layer>/<ST>.geojson + index.json).
// Shell (head links, site header, footer) is borrowed from cameras/washington/ so
// nav and footer stay the same as the rest of the site.
//   node scripts/gen-truck-map-page.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const tpl = readFileSync("cameras/washington/index.html", "utf8");
const cut = (a, b) => { const i = tpl.indexOf(a), j = tpl.indexOf(b, i); if (i < 0 || j < 0) throw new Error("template marker missing: " + a); return tpl.slice(i, j); };
const header = cut("  <!-- site-nav:header -->", "<!-- /site-nav:header -->") + "<!-- /site-nav:header -->\n";
const navAssets = cut("  <!-- site-nav:assets -->", "<!-- /site-nav:assets -->") + "<!-- /site-nav:assets -->\n";
const footer = cut('<footer class="site-footer">', "</footer>") + "</footer>\n";
const ga = cut("<!-- ga4 -->", "\n") + "\n";
const ix = JSON.parse(readFileSync("data/restrictions/index.json", "utf8"));
const NBI_FILE = ix.sources.bridges.file; // e.g. 2025HwyBridgesDelimitedAllStates.txt
const NBI_YEAR = ix.sources.bridges.vintage;

const URL = "https://milecheckapp.com/truck-restrictions/";
const TITLE = "Where are low bridges, weigh stations and truck parking on my route?";
const DESC = "A trucker map by state. Low bridge clearances, weight-posted and closed bridges from the federal bridge inventory, plus weigh stations, truck parking, truck stops, rest areas and runaway truck ramps.";
const STATES = { AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California", CO: "Colorado", CT: "Connecticut", DE: "Delaware", DC: "District of Columbia", FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", PR: "Puerto Rico", RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming" };
const osmLayers = ["weigh", "parking", "stops", "rest", "ramps"].filter(l => ix.layers[l]);
const faq = [
  ["Where does the low clearance data come from?", `The FHWA National Bridge Inventory (${NBI_YEAR} file). Each state DOT reports the vertical clearance under and over every public highway bridge. Railroad bridges over a road, like the 11foot8 bridge in Durham, are not in it, so they do not show here.`],
  ["Is the clearance on the map the same as the sign?", "Not always. The inventory is measured at inspection and rounded down here to the inch. Repaving, snow and posted signs can differ. Read the sign on the bridge."],
  ["What does weight-posted mean?", "The state has posted a load limit on the bridge because it cannot carry full legal loads. The inventory says that a bridge is posted, not the exact tons on the sign."],
];
const ld = [
  { "@context": "https://schema.org", "@type": "FAQPage", "@id": URL + "#faqpage", mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
  { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "MileCheck", item: "https://milecheckapp.com/" }, { "@type": "ListItem", position: 2, name: "Trucker map", item: URL }] },
];
const LAYERS = [
  ["low", "#d32f2f", "Low clearance bridges"],
  ["W", "#ef6c00", "Weight-posted bridges"],
  ["R", "#7b1fa2", "Restricted bridges (not load)"],
  ["C", "#212121", "Closed bridges"],
  ["weigh", "#1565c0", "Weigh stations"],
  ["parking", "#00897b", "Truck parking"],
  ["stops", "#2e7d32", "Truck stops (diesel for trucks)"],
  ["rest", "#8d6e63", "Rest areas"],
  ["ramps", "#c2185b", "Runaway truck ramps"],
].filter(([k]) => ["low", "W", "R", "C"].includes(k) || osmLayers.includes(k));
const defaultOn = new Set(["low", "W", "C", "weigh"]);

const html = `<!DOCTYPE html>
<html lang="en">
<head>
${ga}  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="referrer" content="strict-origin-when-cross-origin">
  <meta name="apple-itunes-app" content="app-id=6759212851">
  <title>${TITLE} | MileCheck</title>
  <meta name="description" content="${DESC}">
  <link rel="canonical" href="${URL}">
  <meta property="og:title" content="${TITLE}">
  <meta property="og:description" content="${DESC}">
  <meta property="og:image" content="https://milecheckapp.com/images/og-banner-light.png">
  <meta property="og:url" content="${URL}">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${TITLE}">
  <meta name="twitter:description" content="${DESC}">
  <meta name="twitter:image" content="https://milecheckapp.com/images/og-banner-light.png">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="icon" type="image/png" href="/images/favicon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/style.css?v=20261111-1">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <link rel="stylesheet" href="https://unpkg.com/leaflet-gesture-handling@1.2.2/dist/leaflet-gesture-handling.min.css">
  <script src="https://unpkg.com/leaflet-gesture-handling@1.2.2/dist/leaflet-gesture-handling.min.js"></script>
${ld.map(o => `  <script type="application/ld+json">${JSON.stringify(o)}</script>`).join("\n")}
  <style>
    .tr-wrap{max-width:1160px;margin:0 auto;padding:28px 16px 10px;box-sizing:border-box}
    .tr-wrap h1{overflow-wrap:anywhere;font-size:clamp(26px,5vw,42px);line-height:1.1;margin:0 0 10px}
    .tr-sub{font-size:17px;line-height:1.55;color:#3a444d;margin:0 0 14px}
    .tr-warn{background:#fff6e5;border:1px solid #f0c36d;border-radius:10px;padding:10px 14px;font-size:15px;line-height:1.5;margin:0 0 16px}
    .tr-controls{max-width:100%;display:flex;flex-wrap:wrap;gap:12px 22px;align-items:flex-start;margin:0 0 12px}
    .tr-controls label{font-size:15px}
    .tr-controls select{font-size:16px;padding:8px 10px;border-radius:8px;border:1px solid #c5ccd3;min-height:44px}
    .tr-layers{min-width:0;display:flex;flex-wrap:wrap;gap:6px 16px;margin:0;padding:0;border:0}
    .tr-layers legend{font-weight:700;font-size:15px;margin-bottom:4px;padding:0}
    .tr-layers label{display:inline-flex;align-items:center;gap:6px;min-height:44px;cursor:pointer}
    .tr-sw{display:inline-block;width:13px;height:13px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 1px #9aa4ad}
    .tr-grid{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:14px}
    #trmap{height:620px;border-radius:12px;border:1px solid #d6dbe0}
    .tr-list{border:1px solid #d6dbe0;border-radius:12px;max-height:620px;overflow:auto;background:#fff}
    .tr-list h2{font-size:16px;margin:0;padding:12px 14px;border-bottom:1px solid #e6e9ec;position:sticky;top:0;background:#fff}
    .tr-list ul{list-style:none;margin:0;padding:0}
    .tr-list li{border-bottom:1px solid #eef0f2}
    .tr-list button{all:unset;display:block;box-sizing:border-box;width:100%;padding:10px 14px;cursor:pointer;font-size:14px;line-height:1.4;min-height:44px}
    .tr-list button:hover,.tr-list button:focus{background:#f3f6f8}
    .tr-list b{display:block;font-size:15px}
    .tr-empty{padding:14px;font-size:14px;color:#5a646d}
    .tr-pop{font-size:14px;line-height:1.45;min-width:200px}
    .tr-pop b{font-size:15px}
    .tr-notes{font-size:15px;line-height:1.6}
    .tr-notes h2{font-size:22px;margin:26px 0 8px}
    .tr-notes ul{padding-left:20px}
    #trStatus{font-size:14px;color:#5a646d;margin:0 0 8px;min-height:20px}
    @media (max-width:900px){.tr-grid{grid-template-columns:minmax(0,1fr)}#trmap{height:440px}.tr-list{max-height:420px}}
  </style>
${navAssets}</head>
<body>
${header}
<main>
  <div class="tr-wrap">
    <h1>${TITLE}</h1>
    <p class="tr-sub">Pick a state. The map shows low bridges and weight-posted or closed bridges from the federal bridge inventory, and weigh stations, truck parking, truck stops, rest areas and runaway truck ramps from OpenStreetMap. Tap a marker for the details.</p>
    <p class="tr-warn"><b>Approximate.</b> Bridge clearances and postings come from the FHWA National Bridge Inventory (${NBI_YEAR} file), measured at the last inspection. Weigh stations and truck stops come from OpenStreetMap volunteers. Signs on the road are the rule. Read the posted clearance and weight before you go under or over.</p>
    <div class="tr-controls">
      <label>State<br><select id="trState" aria-label="Choose a state">${Object.entries(STATES).filter(([c]) => ix.layers.bridges[c]).map(([c, n]) => `<option value="${c}">${n}</option>`).join("")}</select></label>
      <label>Low clearance<br><select id="trClr" aria-label="Low clearance filter">
        <option value="186">Under 15' 6"</option><option value="168">Under 14' 0"</option><option value="162" selected>Under 13' 6"</option></select></label>
      <fieldset class="tr-layers"><legend>Show on the map</legend>
${LAYERS.map(([k, c, t]) => `        <label><input type="checkbox" class="tr-layer" value="${k}"${defaultOn.has(k) ? " checked" : ""}><span class="tr-sw" style="background:${c}"></span>${t}</label>`).join("\n")}
      </fieldset>
    </div>
    <p id="trStatus" aria-live="polite"></p>
    <div class="tr-grid">
      <div class="tr-mapcol" style="min-width:0"><div id="trmap" role="region" aria-label="Trucker map"></div></div>
      <div class="tr-list"><h2 id="trListHead">In view on the map</h2><ul id="trList"></ul></div>
    </div>
    <div class="tr-notes">
      <h2>How to read the map</h2>
      <ul>
        <li><b>Low clearance.</b> "Under the bridge" is the clearance for the road that passes beneath it. "On the bridge" is the clearance over the deck, for example a truss over the roadway. Numbers are rounded down to the inch.</li>
        <li><b>Weight-posted.</b> The state posted a load limit. The inventory does not carry the tons on the sign, so the popup shows the inspection load rating and how far below legal loads the bridge rates. Use the sign.</li>
        <li><b>Restricted and closed.</b> Restricted means a limit other than load, like one lane or speed. Closed means closed to all traffic at the last report.</li>
        <li><b>Weigh stations, parking and truck stops</b> are mapped by OpenStreetMap volunteers. Hours and open or closed status are not live. Some are missing.</li>
        <li><b>Railroad bridges over a road are not in the bridge inventory.</b> The 11foot8 bridge on Gregson Street in Durham, NC is one. It does not appear here.</li>
      </ul>
      <h2>Sources</h2>
      <ul>
        <li>Bridges: <a href="https://www.fhwa.dot.gov/bridge/nbi/ascii.cfm" target="_blank" rel="noopener">FHWA National Bridge Inventory</a>, ${NBI_YEAR} delimited file (${NBI_FILE}). Items 10, 53 and 54 (vertical clearance), 41 (open, posted or closed), 64 and 70 (load rating).</li>
        <li>Weigh stations, truck parking, truck stops, rest areas and runaway truck ramps: <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap contributors</a>, ODbL. Tags used: amenity=weigh_station, amenity=parking with hgv=yes or designated, amenity=fuel with hgv=yes or designated, highway=rest_area, highway=escape. Pulled ${new Date().toISOString().slice(0, 10)}.</li>
        <li>Base map: Esri, USGS.</li>
      </ul>
      <h2>Related</h2>
      <ul>
        <li><a href="/runaway-truck-ramps/" target="_blank" rel="noopener">What are runaway truck ramps?</a></li>
        <li><a href="/rest-areas/" target="_blank" rel="noopener">Rest area rules by state</a></li>
        <li><a href="/truck-speed-limits-by-state/" target="_blank" rel="noopener">Truck speed limits by state</a></li>
        <li><a href="/grades/" target="_blank" rel="noopener">Steep grades</a></li>
        <li><a href="/chain-laws/" target="_blank" rel="noopener">Chain laws</a></li>
      </ul>
    </div>
  </div>
</main>
${footer}
<script>
(function(){
const COLORS=${JSON.stringify(Object.fromEntries(LAYERS.map(([k, c]) => [k, c])))};
const NAMES={weigh:'Weigh station',parking:'Truck parking',stops:'Truck stop',rest:'Rest area',ramps:'Runaway truck ramp'};
const OSM=${JSON.stringify(osmLayers)};
const EVAL={'0':'rates 40% or more below legal loads','1':'rates 30-39.9% below legal loads','2':'rates 20-29.9% below legal loads','3':'rates 10-19.9% below legal loads','4':'rates 0.1-9.9% below legal loads'};
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ftin=i=>Math.floor(i/12)+"' "+(i%12)+'"';
const map=L.map('trmap',{gestureHandling:('ontouchstart' in window),preferCanvas:true}).setView([39.5,-98.5],4);
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',{attribution:'Esri, USGS · Bridges: FHWA NBI · POIs: © OpenStreetMap contributors',maxZoom:17}).addTo(map);
const group=L.layerGroup().addTo(map);
const cache={};let items=[];
const $=id=>document.getElementById(id);
const on=()=>new Set([...document.querySelectorAll('.tr-layer:checked')].map(x=>x.value));
function get(layer,st){const k=layer+'/'+st;if(!cache[k])cache[k]=fetch('/data/restrictions/'+layer+'/'+st+'.geojson').then(r=>r.ok?r.json():{features:[]}).catch(()=>({features:[],failed:true}));return cache[k];}
function bridgeKind(p,lim){const lowU=p.u!=null&&p.u<lim,lowO=p.o!=null&&p.o<lim;return {low:lowU||lowO,lowU,lowO};}
function bridgePop(p){const h=[];
  if(p.u!=null)h.push('<div>Under the bridge: <b>'+ftin(p.u)+'</b> on '+esc(p.x)+'</div>');
  if(p.o!=null)h.push('<div>On the bridge: <b>'+ftin(p.o)+'</b> on '+esc(p.on)+'</div>');
  if(p.k.includes('W'))h.push('<div><b>Weight-posted</b>'+(p.e&&EVAL[p.e]?', '+EVAL[p.e]:'')+'. Use the tons on the sign.</div>');
  if(p.k.includes('R'))h.push('<div><b>Restricted</b> (a limit other than load)</div>');
  if(p.k.includes('C'))h.push('<div><b>Closed</b> at the last report</div>');
  if(p.t&&!p.k.includes('L'))h.push('<div>Inspection load rating: '+p.t+' tons</div>');
  return '<div class="tr-pop"><b>'+esc(p.on||'Bridge')+'</b><div>Crosses: '+esc(p.x)+'</div>'+h.join('')+'<div style="color:#5a646d;margin-top:4px">NBI structure '+esc(p.s)+'</div></div>';}
function poiPop(layer,p){const h=['<b>'+esc(p.n||NAMES[layer])+'</b>','<div>'+NAMES[layer]+'</div>'];
  if(p.r)h.push('<div>Ref: '+esc(p.r)+'</div>');if(p.d)h.push('<div>Direction: '+esc(p.d)+'</div>');if(p.cap)h.push('<div>Spaces: '+esc(p.cap)+'</div>');if(p.h)h.push('<div>Hours (OSM): '+esc(p.h)+'</div>');
  h.push('<div style="color:#5a646d;margin-top:4px"><a href="https://www.openstreetmap.org/'+({n:'node',w:'way',r:'relation'}[p.id[0]])+'/'+p.id.slice(1)+'" target="_blank" rel="noopener">OpenStreetMap '+esc(p.id)+'</a></div>');
  return '<div class="tr-pop">'+h.join('')+'</div>';}
async function draw(fit){
  const st=$('trState').value,lim=+$('trClr').value,show=on();
  try{history.replaceState(null,'','#'+st);}catch(e){}
  $('trStatus').textContent='Loading '+$('trState').selectedOptions[0].text+'…';
  const wantB=['low','W','R','C'].some(k=>show.has(k));
  const [b,...pois]=await Promise.all([wantB?get('bridges',st):{features:[]},...OSM.map(l=>show.has(l)?get(l,st):{features:[]})]);
  group.clearLayers();items=[];const failed=[];if(b.failed)failed.push('bridges');
  for(const f of b.features){const p=f.properties,k=bridgeKind(p,lim);
    let c=null;if(show.has('C')&&p.k.includes('C'))c='C';else if(show.has('low')&&k.low)c='low';else if(show.has('W')&&p.k.includes('W'))c='W';else if(show.has('R')&&p.k.includes('R'))c='R';
    if(!c)continue;const [lon,lat]=f.geometry.coordinates;
    const label=c==='low'?(k.lowU?ftin(p.u)+' under':ftin(p.o)+' on deck'):c==='W'?'Weight-posted':c==='R'?'Restricted':'Closed';
    items.push({lat,lon,c,title:label+' · '+(c==='low'&&k.lowU?p.x:p.on),sub:c==='low'&&k.lowU?'Under '+p.on:'Over '+p.x,pop:bridgePop(p),sort:c==='low'?(k.lowU?p.u:p.o):999});}
  OSM.forEach((l,i)=>{if(pois[i].failed)failed.push(NAMES[l].toLowerCase());for(const f of pois[i].features){const p=f.properties,[lon,lat]=f.geometry.coordinates;items.push({lat,lon,c:l,title:p.n||NAMES[l],sub:NAMES[l]+(p.r?' · '+p.r:''),pop:poiPop(l,p),sort:1000});}});
  for(const it of items){it.m=L.circleMarker([it.lat,it.lon],{radius:('ontouchstart' in window)?8:6,color:'#fff',weight:1.5,fillColor:COLORS[it.c],fillOpacity:.95}).bindPopup(it.pop).addTo(group);}
  $('trStatus').textContent=failed.length?('Could not load: '+failed.join(', ')+'. The rest of the map is shown.'):'';
  if(fit&&items.length){map.fitBounds(L.latLngBounds(items.map(i=>[i.lat,i.lon])).pad(.05));}
  list();}
function list(){const bd=map.getBounds(),ul=$('trList');const v=items.filter(i=>bd.contains([i.lat,i.lon])).sort((a,b)=>a.sort-b.sort);
  $('trListHead').textContent=v.length?('In view on the map: '+v.length+(v.length>200?' (lowest clearances first, first 200 listed)':'')):'In view on the map';
  ul.innerHTML='';if(!v.length){ul.innerHTML='<li class="tr-empty">Nothing in this view for the layers you picked. Zoom out or turn on more layers.</li>';return;}
  for(const it of v.slice(0,200)){const li=document.createElement('li'),b=document.createElement('button');b.innerHTML='<span class="tr-sw" style="background:'+COLORS[it.c]+';margin-right:6px"></span><b style="display:inline">'+esc(it.title)+'</b><br>'+esc(it.sub);b.onclick=()=>{map.setView([it.lat,it.lon],Math.max(map.getZoom(),13));it.m.openPopup();};li.appendChild(b);ul.appendChild(li);}}
map.on('moveend',list);
$('trState').onchange=()=>draw(true);$('trClr').onchange=()=>draw(false);document.querySelectorAll('.tr-layer').forEach(x=>x.onchange=()=>draw(false));
const h=(location.hash||'').slice(1).toUpperCase();if([...$('trState').options].some(o=>o.value===h))$('trState').value=h;else $('trState').value='WA';
draw(true);
})();
</script>
</body>
</html>
`;
mkdirSync("truck-restrictions", { recursive: true });
writeFileSync("truck-restrictions/index.html", html);
console.log("wrote truck-restrictions/index.html", html.length, "bytes");
