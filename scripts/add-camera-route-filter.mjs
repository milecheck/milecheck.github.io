#!/usr/bin/env node
// Add an explicit filter hook to existing US state camera maps. No generator execution.
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const src=readFileSync(resolve(ROOT,'scripts/gen-state-camera-pages.js'),'utf8');
const stateData=src.match(/const STATES = \[([\s\S]*?)\n\];/)[1];
const states=[...stateData.matchAll(/slug:'([^']+)', code:'([A-Z]{2})'/g)].filter(m=>!['BC','AB','MB','ON','QC','NB','NS','PE','NL','YT','NT','NU'].includes(m[2]));
// Migrate only the shared playback block, including province pages. Never run the
// generator to apply this fix: it would overwrite unrelated page finishing work.
const streamPattern=/var hlsInst=null,hlsLoading=null[^\n]*\nfunction stopStream[^\n]*\nfunction playStream[^\n]*\n/;
const streamRuntime=src.match(streamPattern)?.[0];
if(!streamRuntime)throw Error('Missing guarded stream runtime in camera generator');
let streamChanged=0;
for(const entry of readdirSync(resolve(ROOT,'cameras'),{withFileTypes:true})){
 if(!entry.isDirectory())continue;
 const path=resolve(ROOT,'cameras',entry.name,'index.html');if(!existsSync(path))continue;
 const html=readFileSync(path,'utf8');if(!streamPattern.test(html))continue;
 const next=html.replace(streamPattern,()=>streamRuntime);
 if(next!==html){writeFileSync(path,next);streamChanged++;}
}
const control=`<!-- camera-route:start -->
  <div class="co-wrap" style="margin-bottom:12px">
    <label for="camera-route" style="font-weight:600">Highway</label>
    <select id="camera-route" disabled style="font:inherit;padding:9px 12px;border:1px solid #d1d5db;border-radius:8px;background:#fff;color:#0F1419;max-width:100%"><option value="">All highways</option></select>
    <p id="camera-route-note" role="status" style="font-size:14px;margin:8px 0">Highway choices load with the camera feed.</p>
  </div>
<!-- camera-route:end -->
`;
const hook="\n/* camera-route:hook */\nconst cameraRouteFilter=MCCameraRoutes.create({map:map,draw:draw,plows:PLOWS,closeCard:function(){cardEl.style.display='none';stopStream();}});\n/* /camera-route:hook */";
// Move supporting counts below the map. The live map and its filter come first.
function moveSupportingCounts(html,slug){
 if(html.includes('<!-- camera-after-map:start -->'))return html;
 const stats=html.match(/    <div class="co-stats">[\s\S]*?\n    <\/div>/);
 if(!stats)throw Error('Missing camera stats block in '+slug);
 const month=html.match(/<!-- monthnum:start -->[\s\S]*?<!-- monthnum:end -->/);
 const guide='  <section class="co-guide">';
 if(!html.includes(guide))throw Error('Missing guide position in '+slug);
 html=html.replace(stats[0],'');
 if(month)html=html.replace(month[0],'');
 const block='<!-- camera-after-map:start -->\n  <div class="co-wrap" style="max-width:1000px">\n'+stats[0]+'\n  </div>\n'+(month?month[0]+'\n':'')+'<!-- camera-after-map:end -->\n\n';
 return html.replace(guide,block+guide);
}
let changed=0,existing=0,migrated=0;
for(const [,slug] of states){
 const path=resolve(ROOT,'cameras',slug,'index.html');if(!existsSync(path))continue;existing++;
 let html=readFileSync(path,'utf8');const original=html;
 if(!html.includes('<!-- camera-route:start -->')){
 const anchors=['  <div class="co-wrap">','let CAMS=[], PLOWLIST=[], showCam=true, showPlow=true;',"function draw(){camLayer.clearLayers();",'thin(CAMS.filter(c=>b.contains([c.lat,c.lon])),16)',"if(showCam)bits.push(CAMS.length?'📷 '+CAMS.length+' live cameras':'no cameras loaded');","  document.getElementById('statCams').textContent=CAMS.length;","  if(!d){document.getElementById('coStatus')"];
 for(const a of anchors)if(!html.includes(a))throw Error('Missing camera integration anchor in '+slug+': '+a);
 html=html.replace('  <div class="co-wrap">',control+'  <div class="co-wrap">');
 html=html.replace('<script>\nconst WORKER=', '<script src="/assets/camera-route-filter.js"></script>\n<script>\nconst WORKER=');
 html=html.replace('let CAMS=[], PLOWLIST=[], showCam=true, showPlow=true;','let CAMS=[], PLOWLIST=[], showCam=true, showPlow=true;'+hook);
 html=html.replace('function draw(){camLayer.clearLayers();','function draw(){const routeCameras=cameraRouteFilter.filter(CAMS);camLayer.clearLayers();');
 html=html.replace('thin(CAMS.filter(c=>b.contains([c.lat,c.lon])),16)','thin(routeCameras.filter(c=>b.contains([c.lat,c.lon])),16)');
 html=html.replace("if(showCam)bits.push(CAMS.length?'📷 '+CAMS.length+' live cameras':'no cameras loaded');","if(showCam)bits.push(routeCameras.length?'📷 '+routeCameras.length+' live cameras':'no matching cameras loaded');");
 html=html.replace("  document.getElementById('statCams').textContent=CAMS.length;","  document.getElementById('statCams').textContent=CAMS.length;\n  cameraRouteFilter.loaded(CAMS);");
 html=html.replace("  if(!d){document.getElementById('coStatus')","  if(!d){cameraRouteFilter.unavailable();document.getElementById('coStatus')");
 if(!html.includes('<script src="/assets/camera-route-filter.js"></script>'))throw Error('Missing script integration in '+slug);
 }
 const hadMoved=html.includes('<!-- camera-after-map:start -->');
 html=moveSupportingCounts(html,slug).replace(/\n[ \t\n]*(?=<!-- camera-route:start -->)/,'\n\n');if(!hadMoved)migrated++;
 if(html!==original){writeFileSync(path,html);changed++;}
}
console.log('Camera highway filter: '+changed+' updated, '+existing+' existing US state pages checked; '+migrated+' supporting-count blocks moved after the map.');
console.log('Camera stream guard: '+streamChanged+' existing state/province playback runtimes updated.');
