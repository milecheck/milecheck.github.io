// road-overview.js begin
// The Overview box under the map: agency reports sorted by fixed rules. No AI writes it. It never says
// a road is safe, open, clear or passable, and never advises whether to drive. Every line names its source.
// Source: scripts/lib/road-overview.js (needs road-status.js). Not on any live page yet: the generator
// embeds it only for pages with `overview: true`. Tests: node scripts/lib/road-overview.test.js
// Repaired after ChatGPT review 4 (MILECHECKAPP/docs/reviews/overview-v4-2026-10-09/), 2026-10-09.
//
// Inputs are one complete snapshot and one clock reading, so every surface agrees:
//   snap = { at, alerts, conds, cams, fires, wx, log }   at = when the last request of this snapshot finished
//   log  = [{ label, cls:'ok'|'partial'|'failed', at, server }]  at = browser receipt time, server = when
//          MileCheck's server retrieved the feed (fetched_at). Neither is an agency update time.
//   cfg  = { place, radiusMi, tz, dot, alertSrc, condSrc, fireSrc, lists:{ clos, snow, work, fire } }
var OV_DIRS={NB:'northbound',SB:'southbound',EB:'eastbound',WB:'westbound'};
var OV_STALE=30*60e3;
var OV_TYPE_LABEL={AC:'Crash',HZ:'Hazard',WE:'Weather report',IN:'Incident',OT:'Report',CL:'Report',RW:'Work zone'};
function ovEsc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function ovWhere(a){return '<b>'+(a.route?ovEsc(a.route):'Road not specified')+(OV_DIRS[a.dir]?' '+OV_DIRS[a.dir]:'')+'</b>'+(a.loc?' &middot; Agency location: '+ovEsc(a.loc):'')+ovEsc(mileText(a));}
// The agency's own words: complete, or shortened with every qualifying sentence kept (road-status.js).
function ovWords(a){return ovEsc(agencyWords(a,300).replace(/[.\s]+$/,''))+'.';}
function ovSrc(s){return ' <span class="ov-src">'+ovEsc(s)+'</span>';}
// Worst status across every request for one source. Times come only from requests that succeeded.
function ovHealth(log,label){var e=(log||[]).filter(function(x){return x.label===label;});if(!e.length)return {st:'failed',at:NaN,server:NaN};
  var bad=e.filter(function(x){return x.cls==='failed';}).length,good=e.filter(function(x){return x.cls!=='failed';});
  var st=bad===e.length?'failed':(bad||e.some(function(x){return x.cls==='partial';}))?'partial':'ok';
  var min=function(k){var v=good.map(function(x){return x[k];}).filter(isFinite);return v.length?Math.min.apply(null,v):NaN;};
  return {st:st,at:min('at'),server:min('server')};}
function ovNote(log,label,what,now,tz){var h=ovHealth(log,label),o=[];
  if(h.st==='partial')o.push(what+' reports are incomplete. Some may be missing.');
  if(isFinite(h.server)&&now-h.server>OV_STALE)o.push('MileCheck\'s server last retrieved '+what+' reports '+whenIn(h.server,tz)+'. They may be outdated.');
  return o.length?'<p class="ov-src">'+o.join(' ')+'</p>':'';}
function ovFetched(log,label,tz){var h=ovHealth(log,label);return h.st==='failed'?'unavailable':isFinite(h.at)?'retrieved '+clockIn(h.at,tz):'retrieval time not recorded';}
// "N more ... in the X list below" appears only when the list below holds them (same snapshot).
function ovMore(n,shown,what,list,src){return n>shown&&list?'<div class="ov-more">'+(n-shown)+' more '+what+' in the '+list+' list below.'+ovSrc(src)+'</div>':'';}
function ovList(items,max,fn,what,list,src){return '<ul>'+items.slice(0,max).map(fn).join('')+'</ul>'+ovMore(items.length,max,what,list,src);}
function ovIsWorkCond(w){return /roadwork|maintenance|construction/i.test(w.cond||'');}

function overviewHtml(snap,cfg,now){
  var tz=cfg.tz,h=[],log=snap.log||[];
  var AR=(snap.alerts||[]).map(function(a){var d=closureDetailOf(a);return {a:a,kind:d.kind,detail:d,tm:timingState(a,now),full:isFullClosure(a,now)};});
  var cur=function(x){return x.tm==='current'||x.tm==='open'||x.tm==='unknown';};
  var meta=ovHealth(log,'alerts'),alertsDown=meta.st==='failed';
  var lists=cfg.lists||{};
  // 1. Feed health
  if(alertsDown)h.push('<div class="ov-stat">'+ovEsc(cfg.alertSrc)+' reports unavailable. Closure reports could not be checked.</div>');
  else if(meta.st==='partial')h.push('<div class="ov-stat warn">'+ovEsc(cfg.alertSrc)+' reports are incomplete right now. Some closures may be missing. The reports that arrived are below.</div>');
  if(!alertsDown&&isFinite(meta.server)&&now-meta.server>OV_STALE)h.push('<div class="ov-stat warn">MileCheck\'s server last retrieved '+ovEsc(cfg.alertSrc)+' reports '+whenIn(meta.server,tz)+'. They may be outdated.</div>');
  // 2. Coverage and sources
  var roads=[];AR.forEach(function(x){if(x.tm!=='ended'&&x.a.route&&roads.indexOf(x.a.route)<0)roads.push(x.a.route);});
  h.push('<p class="ov-area">Area: reports that start within '+cfg.radiusMi+' mi of '+ovEsc(cfg.place)+'. A closure that starts outside this circle can be missed.'+(roads.length?' Roads with reports: '+roads.map(ovEsc).join(', ')+'.':'')+
    '<br>Sources: '+ovEsc(cfg.alertSrc)+' alerts '+ovFetched(log,'alerts',tz)+' &middot; '+ovEsc(cfg.condSrc)+' road reports '+ovFetched(log,'road weather',tz)+' &middot; cameras '+ovFetched(log,'cameras',tz)+' &middot; '+ovEsc(cfg.fireSrc)+' fires '+ovFetched(log,'fires',tz)+'. Agency update times are not available.</p>');
  // 3. Full-closure reports. Only records the agency itself marks as closures (event type CL), in an active
  // window, whose words agree (road-status.js isFullClosure). Parsed text never adds one.
  var full=AR.filter(function(x){return x.full;}).sort(function(x,y){return (x.tm==='current'?0:1)-(y.tm==='current'?0:1);});
  var closures=AR.filter(function(x){return isCountedClosure(x.a,now)&&!x.full;});
  var upClosures=AR.some(function(x){return isClosureRecord(x.a)&&x.tm==='upcoming';}),endedClosures=AR.filter(function(x){return isClosureRecord(x.a)&&x.tm==='ended';}).length;
  if(full.length)h.push('<div class="ov-crit"><h3>Full-closure reports</h3>'+ovList(full,5,function(x){var a=x.a;return '<li>'+ovWhere(a)+'. '+ovWords(a)+' '+ovEsc(timingText(a,now,tz))+ovSrc(sourceOf(a))+'</li>';},'full-closure reports',lists.clos,cfg.alertSrc)+ovNote(log,'alerts',cfg.alertSrc,now,tz)+'<button type="button" id="ovMap">Show on the map</button></div>');
  // The negative line describes what MileCheck identified in the records it retrieved, not what the agency
  // has or has not reported. Closure reports and ended windows are named beside it.
  else if(!alertsDown)h.push('<div class="ov-sec"><h3>Full closures</h3><p>No full-closure reports in an active agency window were identified in the retrieved '+ovEsc(cfg.alertSrc)+' records.'+(closures.length?' '+closures.length+' closure report'+(closures.length>1?'s are':' is')+' listed below in the agency\'s words.':'')+(upClosures?' Scheduled closure windows are listed below.':'')+(endedClosures?' '+endedClosures+' closure report'+(endedClosures>1?'s':'')+' whose agency end time has passed '+(endedClosures>1?'are':'is')+' not counted.':'')+'</p>'+ovNote(log,'alerts',cfg.alertSrc,now,tz)+'</div>');
  // 4. Other agency closure records, in the agency's words. "Report" when the words report no closure.
  if(closures.length)h.push('<div class="ov-sec"><h3>Closure reports</h3>'+ovList(closures,5,function(x){var a=x.a;return '<li>'+ovWhere(a)+'. '+(x.kind==='none'?'Report':'Closure report')+': '+ovWords(a)+' '+ovEsc(timingText(a,now,tz))+ovSrc(sourceOf(a))+'</li>';},'closure reports',lists.clos,cfg.alertSrc)+ovNote(log,'alerts',cfg.alertSrc,now,tz)+'</div>');
  // 5. Restrictions and chain controls. Each remainder points at the list that holds it.
  var cm=ovHealth(log,'road weather'),restr=(snap.conds||[]).filter(function(w){return w.restr&&w.restr.length;});
  var rMore=function(){var rest=restr.slice(5),sn=rest.filter(function(w){return !ovIsWorkCond(w);}).length,wk=rest.length-sn,o='';
    if(sn&&lists.snow)o+='<div class="ov-more">'+sn+' more restriction report'+(sn>1?'s':'')+' in the '+lists.snow+' list below.'+ovSrc(cfg.condSrc)+'</div>';
    if(wk&&lists.work)o+='<div class="ov-more">'+wk+' more restriction report'+(wk>1?'s':'')+' in the '+lists.work+' list below.'+ovSrc(cfg.condSrc)+'</div>';return o;};
  h.push('<div class="ov-sec"><h3>Restrictions and chain controls</h3>'+(cm.st==='failed'?'<p>'+ovEsc(cfg.condSrc)+' restriction reports unavailable. Restrictions could not be checked.</p>':
    restr.length?'<ul>'+restr.slice(0,5).map(function(w){return '<li><b>'+ovEsc(w.name)+'</b>: '+ovEsc(w.restr.join(', '))+'.'+ovSrc(cfg.condSrc)+'</li>';}).join('')+'</ul>'+rMore():
    '<p>'+ovEsc(cfg.condSrc)+' returned no chain controls or restrictions for this area.</p>')+ovNote(log,'road weather',cfg.condSrc,now,tz)+'</div>');
  // 6. Crashes, hazards and other reports, in the agency's words, under the agency's own type.
  var oth=AR.filter(function(x){return x.a.type!=='RW'&&!isClosureRecord(x.a)&&cur(x);});
  h.push('<div class="ov-sec"><h3>Crashes, hazards and other reports</h3>'+(oth.length?ovList(oth,5,function(x){var a=x.a;return '<li>'+ovWhere(a)+'. '+(OV_TYPE_LABEL[a.type]||'Report')+': '+ovWords(a)+' '+ovEsc(timingText(a,now,tz))+ovSrc(sourceOf(a))+'</li>';},'reports',lists.clos,cfg.alertSrc):
    alertsDown?'<p>'+ovEsc(cfg.alertSrc)+' reports unavailable.</p>':'<p>No crash, hazard or other reports with current or incomplete timing were identified in the retrieved '+ovEsc(cfg.alertSrc)+' records.</p>')+ovNote(log,'alerts',cfg.alertSrc,now,tz)+'</div>');
  // 7. Scheduled closure windows: agency closure records whose window starts later. Grouped by record text.
  var groups={};AR.filter(function(x){return x.tm==='upcoming'&&isClosureRecord(x.a);}).forEach(function(x){var a=x.a;var k=[a.title,a.route,a.dir,a.loc,recordText(a)].join('|');var g=groups[k]=groups[k]||{x:x,w:{}};g.w[a.t0+'|'+a.t1]=[a.t0,a.t1];});
  var up=Object.keys(groups).map(function(k){var g=groups[k];g.ws=Object.keys(g.w).map(function(y){return g.w[y];}).sort(function(p,q){return p[0]-q[0];});return g;}).sort(function(p,q){return p.ws[0][0]-q.ws[0][0];});
  var win=function(w){return isFinite(w[1])?whenIn(w[0],tz)+' to '+whenIn(w[1],tz):'Scheduled start '+whenIn(w[0],tz)+'. End time not supplied';};
  if(up.length)h.push('<div class="ov-sec"><h3>Scheduled closure windows</h3>'+ovList(up,5,function(g){var a=g.x.a,w=g.ws;
    return '<li>'+ovWhere(a)+'. Scheduled closure report: '+ovWords(a)+' '+(isFinite(w[0][1])?'Next scheduled window '+win(w[0])+'.':win(w[0])+'.')+(w.length>1?' '+w.length+' scheduled windows listed.<details><summary>View dates</summary>'+w.map(win).join('<br>')+'</details>':'')+ovSrc(sourceOf(a))+'</li>';},'scheduled closures',lists.clos,cfg.alertSrc)+ovNote(log,'alerts',cfg.alertSrc,now,tz)+'</div>');
  // 8. Work zones: distinct reports by timing. A missing time is not an open-ended window.
  var wk={c:{},n:{},i:{},u:{}};AR.filter(function(x){return x.a.type==='RW'&&x.kind!=='full';}).forEach(function(x){var a=x.a;var k=[a.title,a.route,a.dir,a.loc].join('|');if(x.tm==='upcoming')wk.u[k]=1;else if(x.tm==='current')wk.c[k]=1;else if(x.tm!=='ended'){if(timingGap(a)==='none')wk.n[k]=1;else wk.i[k]=1;}});
  var wc=Object.keys(wk.c).length,wn=Object.keys(wk.n).length,wi=Object.keys(wk.i).length,wu=Object.keys(wk.u).length,cw=(snap.conds||[]).filter(ovIsWorkCond).length,bits=[];
  if(wc)bits.push(wc+' with a scheduled window underway');if(wn)bits.push(wn+' with no agency times');if(wi)bits.push(wi+' with incomplete or invalid agency timing');if(wu)bits.push(wu+' scheduled later');
  if(bits.length||cw)h.push('<div class="ov-sec"><h3>Work zones</h3><p>'+(bits.length?'Distinct work reports: '+bits.join(', ')+'.'+ovSrc(cfg.alertSrc):'')+(cw?(bits.length?' ':'')+cw+' road-condition work report'+(cw>1?'s':'')+'.'+ovSrc(cfg.condSrc):'')+'</p>'+ovNote(log,'alerts',cfg.alertSrc,now,tz)+'</div>');
  // 9. Weather: one point, stated as one point
  var wx=snap.wx,wtxt='';
  if(!wx)wtxt='National Weather Service data unavailable.';
  else{
    if(!wx.alerts)wtxt+='National Weather Service alerts unavailable. ';
    else if(!wx.alerts.length)wtxt+='No National Weather Service alerts were returned for this point. ';
    else wtxt+='<ul>'+wx.alerts.map(function(q){var o=q.onset||q.effective;return '<li><b>'+ovEsc(q.event)+'</b>.'+(o?' Starts '+whenIn(Date.parse(o),tz)+'.':'')+(q.ends?' Agency end time '+whenIn(Date.parse(q.ends),tz)+'.':q.expires?' Message expires '+whenIn(Date.parse(q.expires),tz)+'.':'')+ovSrc('National Weather Service')+'</li>';}).join('')+'</ul>';
    var p=wx.period;
    wtxt+=p?'Forecast for the point at '+ovEsc(cfg.place)+', '+ovEsc(p.name)+' ('+whenIn(Date.parse(p.startTime),tz)+' to '+whenIn(Date.parse(p.endTime),tz)+'): '+ovEsc(p.shortForecast)+'. '+(p.isDaytime?'High ':'Low ')+ovEsc(p.temperature)+'&deg;'+ovEsc(p.temperatureUnit)+'.'+(p.windSpeed?' Wind '+ovEsc(p.windSpeed)+' '+ovEsc(p.windDirection||'')+'.':''):'Forecast unavailable.';
    if(isFinite(wx.at))wtxt+=' Retrieved '+clockIn(wx.at,tz)+'.';
  }
  h.push('<div class="ov-sec"><h3>Weather at one point</h3><p>'+wtxt+ovSrc('National Weather Service')+'</p></div>');
  // 10. Cameras: listed by their own source; not verified live
  var cams=snap.cams||[],ch=ovHealth(log,'cameras');
  if(ch.st!=='failed'||cams.length){
    var bySrc={};cams.forEach(function(c){var s=c.src||cfg.dot;bySrc[s]=(bySrc[s]||0)+1;});
    var nearC=cams.slice().sort(function(a,b){return Math.hypot(a.lat-cfg.lat,a.lon-cfg.lon)-Math.hypot(b.lat-cfg.lat,b.lon-cfg.lon);}).slice(0,3);
    h.push('<div class="ov-sec"><h3>Cameras</h3><p>'+(cams.length?Object.keys(bySrc).map(function(s){return bySrc[s]+' camera'+(bySrc[s]>1?'s':'')+' listed by '+ovEsc(s);}).join(', ')+'.':ovEsc(cfg.dot)+' listed no cameras for this area.')+' Image time unavailable here.</p>'+ovNote(log,'cameras',cfg.dot+' camera',now,tz)+
      (nearC.length?'<div class="ov-cams">'+nearC.map(function(c){return '<a href="'+ovEsc(c.img)+'" target="_blank" rel="noopener"><img src="'+ovEsc(c.img)+'" alt="Camera listed by '+ovEsc(c.src||cfg.dot)+': '+ovEsc(c.title)+'" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement(\'span\'),{className:\'ov-noimg\',textContent:\'Image from '+ovEsc(c.src||cfg.dot).replace(/'/g,'')+' did not load\'}))">'+ovEsc(c.title)+' &middot; '+ovEsc(c.src||cfg.dot)+'</a>';}).join('')+'</div>':'')+'</div>');
  }else h.push('<div class="ov-sec"><h3>Cameras</h3><p>'+ovEsc(cfg.dot)+' camera list unavailable.</p></div>');
  // 11. Fire: distance to the reported fire location only, no road-impact claim
  var fh=ovHealth(log,'fires'),fires=snap.fires||[];
  h.push('<div class="ov-sec"><h3>Fire</h3><p>'+(fh.st==='failed'?ovEsc(cfg.fireSrc)+' fire reports unavailable.':fires.length?fires.slice(0,3).map(function(f){return ovEsc(f.name)+(f.acres!=null?', '+Math.round(f.acres).toLocaleString('en-US')+' acres':'')+(f.pct!=null?', '+ovEsc(f.pct)+'% contained':'')+', '+f.dist.toFixed(0)+' mi from '+ovEsc(cfg.place)+' to the reported fire location';}).join('. ')+'.'+(fires.length>3?' '+(fires.length-3)+' more in the '+lists.fire+' list below.':''):'No fire records were returned within '+cfg.radiusMi+' mi of '+ovEsc(cfg.place)+'.')+ovSrc(cfg.fireSrc)+'</p>'+ovNote(log,'fires',cfg.fireSrc+' fire',now,tz)+'</div>');
  // Header: receipt time of the snapshot; a later render only rechecks timing.
  var header=isFinite(snap.at)?'Retrieved '+clockIn(snap.at,tz)+'.'+(now-snap.at>=60e3?' Timing rechecked '+clockIn(now,tz)+'.':''):'Not retrieved yet.';
  return {html:h.join(''),header:header,full:full.map(function(x){return x.a;})};
}
// Weather for one point, fetched with the rest of the snapshot.
async function loadWeather(lat,lon){
  var q=lat.toFixed(4)+','+lon.toFixed(4);
  var al=await fetchJSON('https://api.weather.gov/alerts/active?point='+q,2);
  var pt=await fetchJSON('https://api.weather.gov/points/'+q,2);
  var fc=pt&&pt.properties&&pt.properties.forecast?await fetchJSON(pt.properties.forecast,2):null;
  return {at:Date.now(),alerts:al&&al.features?al.features.map(function(f){return f.properties||{};}):null,period:fc&&fc.properties&&fc.properties.periods&&fc.properties.periods[0]||null};
}
// Page glue. Draws only from the committed snapshot; never fetches.
function renderOverview(now){
  var body=document.getElementById('ovBody');if(!body||typeof SNAP==='undefined'||!SNAP)return;
  var o=overviewHtml(SNAP,OVCFG,now);body.innerHTML=o.html;document.getElementById('ovWhen').textContent=o.header;
  var b=document.getElementById('ovMap');
  if(b)b.onclick=function(){var ll=o.full.map(function(a){return [a.lat,a.lon];});document.getElementById('comap').scrollIntoView({behavior:'smooth',block:'center'});if(ll.length)map.fitBounds(ll,{padding:[30,30],maxZoom:13});};
}
if(typeof module!=='undefined'&&module.exports)module.exports={overviewHtml:overviewHtml,ovHealth:ovHealth,ovWords:ovWords};
// road-overview.js end
