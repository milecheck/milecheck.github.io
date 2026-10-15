/* Shared browser client and dependency-free normalization tests for the finite I-75 pilot. */
var map;
(function(root){
 'use strict';
 const WORKER='https://milepost-proxy.leahgerber93.workers.dev';
 function isRoute(value){return /^(?:I[ -]?0*75(?=$|[\s/,;])|0*75$)/i.test(String(value||'').trim());}
 // Bounds are a coarse state rectangle from states.cjs, not an exact state polygon.
 // This rejects distant misassigned records but cannot establish border-side provenance.
 function point(lat,lon,bounds){if(lat===null||lat===undefined||lat===''||lon===null||lon===undefined||lon==='')return null;lat=Number(lat);lon=Number(lon);return Number.isFinite(lat)&&Number.isFinite(lon)&&lat>=bounds[0][0]&&lat<=bounds[1][0]&&lon>=bounds[0][1]&&lon<=bounds[1][1]?[lat,lon]:null;}
 function timestamp(value){if(value===null||value===undefined||value==='')return null;const d=new Date(typeof value==='number'?(value<1e12?value*1000:value):value);return Number.isFinite(d.getTime())?d.toISOString():null;}
 function safeURL(value){try{const url=new URL(value);return /^https?:$/.test(url.protocol)?url.href:null;}catch{return null;}}
 function sourceTime(record){return timestamp(record['last-updated']||record['update-time']||record['date-updated']);}
 function records(payload,key){if(payload&&(payload.unavailable===true||payload.supported===false))throw Error('Source feed unavailable');if(!payload||!Array.isArray(payload[key]))throw Error('Unexpected feed response');return payload[key];}
 function alerts(payload,config,now=Date.now()){
  return records(payload,'incident-reports').flatMap(r=>{
   const loc=r.location||{},start=loc['start-location']||{},p=point(start['start-lat'],start['start-long'],config.bounds);
   const begins=timestamp(r['start-time']),ends=timestamp(r['end-time']);
   if(!isRoute(loc['route-id'])||!p||(ends&&Date.parse(ends)<now))return [];
   return [{point:p,title:String(r.headline||r.description||r['impact-desc']||'DOT report'),description:String(r.description||r['impact-desc']||''),type:String(r['event-type-id']||'Not supplied'),route:String(loc['route-id']),mile:start['start-mile-marker'],direction:String(loc.direction||''),updated:sourceTime(r),begins,ends,scheduled:!!begins&&Date.parse(begins)>now}];
  });
 }
 function cameras(payload,config){return records(payload,'cameras').flatMap(r=>{
  const route=r.route||r.title,p=point(r.lat,r.lon,config.bounds),image=safeURL(r.imageUrl),stream=safeURL(r.streamUrl);
  if(!isRoute(route)||!p||r.isActive===false||(!image&&!stream))return [];
  return [{point:p,title:String(r.title||'DOT camera'),route:String(r.route||'I-75'),mile:r.mile,image,stream,updated:sourceTime(r)}];
 });}
 async function load(fetcher,url,key,config,now,timeoutMs=15000){
  const controller=new AbortController();let timer;
  const deadline=new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('Feed request timed out'));},timeoutMs);});
  try{return await Promise.race([(async()=>{const response=await fetcher(url,{signal:controller.signal,cache:'no-store'});if(!response.ok)throw Error('Feed request failed');const payload=await response.json();return key==='cameras'?cameras(payload,config):alerts(payload,config,now);})(),deadline]);}finally{clearTimeout(timer);}
 }
 const api={isRoute,point,timestamp,safeURL,alerts,cameras,load};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.StateCorridor=api;
 if(typeof document==='undefined')return;
 const configNode=document.getElementById('state-corridor-config');if(!configNode)return;
 const config=JSON.parse(configNode.textContent);
 const el=(tag,text,className)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(className)n.className=className;return n;};
 function timeLine(box,label,value){if(value){const line=el('p',label+' ','sc-meta'),t=el('time',new Date(value).toLocaleString());t.dateTime=value;line.append(t);box.append(line);}}
 function card(record,camera){const box=el('article',undefined,'sc-row');box.append(el('h3',record.title));const details=[record.route,record.mile!==null&&record.mile!==undefined&&record.mile!==''?'Mile '+record.mile:'',record.direction||'',camera?'Camera': 'DOT event type '+record.type].filter(Boolean).join(' · ');box.append(el('p',details,'sc-meta'));
  if(!camera&&record.scheduled)box.append(el('p','Scheduled. The reported start time is in the future.'));
  if(record.description&&record.description!==record.title)box.append(el('p',record.description));
  timeLine(box,'Source updated',record.updated);
  if(!camera){timeLine(box,'Reported start',record.begins);timeLine(box,'Reported end',record.ends);}
  box.append(el('p',config.dot+' via MileCheck','sc-meta'));
  if(camera&&record.image){const a=el('a','Open DOT camera image');a.href=record.image;a.target='_blank';a.rel='noopener';const img=el('img');img.src=record.image;img.alt=record.title;img.loading='lazy';img.addEventListener('error',()=>{img.remove();a.textContent='Camera image unavailable. Open source image';});a.append(img);box.append(a);}
  else if(camera&&record.stream){box.append(el('p','DOT video stream.'));const a=el('a','Watch I-75 streams on the '+config.name+' camera page');a.href='/cameras/'+config.slug+'/?route=I-75';box.append(a);}
  return box;
 }
 const mapStatus=document.getElementById('sc-map-status');let cameraLayer,alertLayer;
 if(root.L){map=root.L.map('comap',{scrollWheelZoom:false}).fitBounds(config.bounds);const tiles=root.L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',{maxZoom:18,attribution:'Esri, USGS · DOT records via MileCheck'}).addTo(map);cameraLayer=root.L.layerGroup().addTo(map);alertLayer=root.L.layerGroup().addTo(map);root.mcMapOptions={layers:[{label:'DOT reports',color:'#b45309',layer:alertLayer},{label:'DOT cameras',color:'#0f7a4f',layer:cameraLayer}]};tiles.on('tileerror',()=>{mapStatus.textContent='Some map tiles are unavailable. Use the report and camera lists below.';});mapStatus.textContent='Amber markers are DOT reports. Green markers are cameras.';}else{document.getElementById('comap').hidden=true;mapStatus.textContent='Map unavailable. DOT reports and cameras are listed below.';}
 const refreshButton=document.getElementById('sc-refresh'),more=document.getElementById('sc-camera-more');
 const states={reports:{items:[],retrieved:null},cameras:{items:[],retrieved:null}};
 let cameraShown=0,requestVersion=0,inflight=null,lastAttempt=0;
 const retrievedText=state=>state.retrieved?' Retrieved '+new Date(state.retrieved).toLocaleString()+'.':'';
 function cameraStatus(){const state=states.cameras;document.getElementById('sc-camera-status').textContent=(state.items.length?state.items.length+' matching I-75 cameras returned. Showing '+cameraShown+' of '+state.items.length+'.':'No matching I-75 cameras returned by '+config.dot+'.')+retrievedText(state);}
 function showMore(){const chunk=states.cameras.items.slice(cameraShown,cameraShown+24);chunk.forEach(record=>document.getElementById('sc-cameras').append(card(record,true)));cameraShown+=chunk.length;cameraStatus();more.hidden=cameraShown>=states.cameras.items.length;}
 // Bind once. Each successful refresh replaces the data and resets this same pagination control.
 more.addEventListener('click',showMore);
 function clear(camera){document.getElementById(camera?'sc-cameras':'sc-alerts').replaceChildren();const layer=camera?cameraLayer:alertLayer;if(layer)layer.clearLayers();if(camera){cameraShown=0;more.hidden=true;}}
 async function populate(camera,version){
  const key=camera?'cameras':'incident-reports',state=states[camera?'cameras':'reports'],status=document.getElementById(camera?'sc-camera-status':'sc-alert-status'),list=document.getElementById(camera?'sc-cameras':'sc-alerts');
  status.className='';status.textContent=state.retrieved?'Refreshing '+(camera?'cameras':'DOT reports')+'. Showing earlier retrieved records.':'Loading '+(camera?'DOT cameras':'DOT reports')+'.';
  try{
   const items=await load(root.fetch.bind(root),WORKER+(camera?'/cameras':'/incidents')+'?state='+config.state,key,config);
   if(version!==requestVersion)return;
   clear(camera);state.items=items;state.retrieved=Date.now();
   if(camera)showMore();
   else {status.textContent=(items.length?items.length+' matching I-75 DOT reports returned.':'No matching I-75 reports returned by '+config.dot+'.')+retrievedText(state);items.forEach(record=>list.append(card(record,false)));}
   if(map)items.forEach(record=>{root.L.circleMarker(record.point,{radius:camera?5:7,color:camera?'#0f7a4f':'#b45309',fillOpacity:.85}).bindPopup(()=>card(record,camera),{maxHeight:300,maxWidth:320}).addTo(camera?cameraLayer:alertLayer);});
  }catch{
   if(version!==requestVersion)return;
   clear(camera);state.items=[];status.className='sc-error';status.textContent=(camera?'Camera feed':'DOT report feed')+' unavailable. '+(state.retrieved?'Refresh failed; earlier records have been removed. Last successful retrieval '+new Date(state.retrieved).toLocaleString()+'. ':'')+'Check '+config.dot+' using the official link above.';
  }
 }
 function refresh(){
  if(inflight)return inflight;
  const version=++requestVersion;lastAttempt=Date.now();refreshButton.disabled=true;
  inflight=Promise.allSettled([populate(false,version),populate(true,version)]).finally(()=>{if(version===requestVersion){inflight=null;refreshButton.disabled=false;}});
  return inflight;
 }
 refreshButton.addEventListener('click',refresh);
 const refreshIfVisible=()=>{if(document.visibilityState==='visible'&&Date.now()-lastAttempt>=300000)refresh();};
 setInterval(refreshIfVisible,300000);
 document.addEventListener('visibilitychange',refreshIfVisible);
 refresh();
 const toggle=document.querySelector('.nav-toggle'),nav=document.querySelector('.primary-nav');if(toggle&&nav)toggle.addEventListener('click',()=>{nav.classList.toggle('open');toggle.setAttribute('aria-expanded',String(nav.classList.contains('open')));});
})(typeof window==='undefined'?globalThis:window);
