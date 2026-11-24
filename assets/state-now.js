/* state-now.js — keeps the "<State> right now" box on the winter-state /road-conditions/ pages current (2026-11-24).
   The box is baked into the HTML by scripts/bake-state-status.mjs (for readers without JavaScript and for crawlers).
   On its own a baked box goes stale: the Washington box read "Nov 1" for three weeks while the map under it was live.
   In the browser this script re-reads the same Worker feed the map uses, rewrites the box, and stamps it
   "Current as of <time, zone>" from the feed's own fetch time. If the feed can't be read, the box keeps the last
   baked text and says plainly when that was and that it may be out of date. It never says a road is clear or open.
   Shared with the bake script (summarize, stamp), so the baked text and the live text are built the same way. */
(function(){
var api={};
var CLOSURE='CL',CRASH='AC',WORK='RW';
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function clean(s,n){return String(s||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().slice(0,n);}
function plural(n,w,pl){return n+' '+(n===1?w:(pl||w+'s'));}
// Active right now: not scheduled for later, not already ended. Same rule the bake has used since 11-01.
api.summarize=function(payload,now){
  if(!payload||!Array.isArray(payload['incident-reports']))throw new Error('unexpected payload');
  now=now==null?Date.now():now;
  var active=payload['incident-reports'].filter(function(a){var t0=Date.parse(a['start-time']||''),t1=Date.parse(a['end-time']||'');return !(isFinite(t0)&&t0>now)&&!(isFinite(t1)&&t1<now);});
  var by=function(t){return active.filter(function(a){return a['event-type-id']===t;});};
  var closures=by(CLOSURE).filter(function(a){return !/rest area/i.test((a.headline||'')+' '+(a.description||''));});
  return {closures:closures,crashes:by(CRASH).length,work:by(WORK).length};
};
// The summary paragraph and list, as HTML. dot is the agency name (WSDOT).
api.bodyHtml=function(s,dot){
  var lines=s.closures.slice(0,3).map(function(a){var loc=a.location||{};return '<li>'+esc(((loc['route-id']||'')+' '+(loc.direction||'')+': '+clean(a.description||a.headline||a['impact-desc'],130)).replace(/^\s+/,'').replace(/\s+:/,':'))+'</li>';}).join('');
  return '<p style="margin:0">The '+esc(dot)+' feed lists '+plural(s.closures.length,'closure-type alert')+', '+plural(s.crashes,'crash','crashes')+' and '+plural(s.work,'roadwork alert')+' on numbered highways. Closure-type alerts include lane closures, so read each one.'+(s.closures.length?' Listed:':'')+'</p>'+
    (lines?'<ul style="margin:6px 0 0 18px;padding:0">'+lines+'</ul>'+(s.closures.length>3?'<p style="margin:6px 0 0">And '+(s.closures.length-3)+' more on the map below.</p>':''):'');
};
// "Nov 24, 8:52 AM PST" in the state's own time zone, with the zone named.
api.stamp=function(ms,tz){
  var d=new Date(ms);if(!isFinite(d.getTime()))return '';
  try{
    var p=new Intl.DateTimeFormat('en-US',{timeZone:tz||'America/Los_Angeles',month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZoneName:'short'}).formatToParts(d);
    var g=function(t){for(var i=0;i<p.length;i++)if(p[i].type===t)return p[i].value;return '';};
    return g('month')+' '+g('day')+', '+g('hour')+':'+g('minute')+' '+g('dayPeriod')+' '+g('timeZoneName');
  }catch(e){return d.toUTCString();}
};
// The feed's own read time, never the page's clock: a cached Worker answer can be minutes old.
api.readTime=function(payload,fallback){
  var v=payload&&(payload.source_status==='stale'?(payload.since||payload.fetched_at):payload.fetched_at);var t=Date.parse(v||'');return isFinite(t)?t:fallback;
};
// What the box should say, given the feed answer (or null when it couldn't be read).
// mode: live (fresh read), stale (the Worker served its last good read), failed (nothing usable).
api.view=function(payload,bakedAt,now){
  now=now==null?Date.now():now;
  var status=payload&&payload.source_status;
  if(!payload||status==='failed'||status==='unsupported'||!Array.isArray(payload['incident-reports']))return {mode:'failed',at:bakedAt};
  var at=api.readTime(payload,now);
  return {mode:status==='stale'?'stale':'live',partial:status==='partial',at:at,summary:api.summarize(payload,now)};
};
api.stampHtml=function(v,dot,tz){
  var t=api.stamp(v.at,tz);
  if(v.mode==='live')return '<b>Current as of '+esc(t)+'</b>, from the '+esc(dot)+' feed'+(v.partial?' (part of the feed did not answer)':'')+'. This box refreshes every 5 minutes.';
  if(v.mode==='stale')return '<b>Last updated '+esc(t)+'.</b> The '+esc(dot)+' feed is not answering, so this is its last good read and may be out of date.';
  return '<b>Last updated '+(t?esc(t):'at an unknown time')+'.</b> The live '+esc(dot)+' feed did not load, so this may be out of date. Check '+esc(dot)+' directly.';
};
if(typeof module!=='undefined'&&module.exports){module.exports=api;return;}

var box=document.querySelector('.mc-statenow[data-state]');if(!box)return;
var ST=box.getAttribute('data-state'),DOT=box.getAttribute('data-dot')||'DOT',NAME=box.getAttribute('data-name')||'',TZ=box.getAttribute('data-tz')||'America/Los_Angeles';
var WORKER=box.getAttribute('data-worker')||'https://api.milecheckapp.com';
var bakedAt=Date.parse(box.getAttribute('data-read')||'');
var h=box.querySelector('.sn-h'),body=box.querySelector('.sn-body'),st=box.querySelector('.sn-stamp');
if(!h||!body||!st)return;
function paint(v){
  if(v.mode!=='failed'){body.innerHTML=api.bodyHtml(v.summary,DOT);h.textContent=NAME+(v.mode==='live'?' right now':' at the last read');}
  else h.textContent=NAME+' at the last read';
  st.innerHTML=api.stampHtml(v,DOT,TZ);
  st.style.color=v.mode==='live'?'#5b6670':'#9a3412';
  box.setAttribute('data-mode',v.mode);
}
// A baked box more than 4 hours old is not "current" while the feed is still loading.
if(!isFinite(bakedAt)||Date.now()-bakedAt>4*3600000){st.innerHTML='<b>Last updated '+(isFinite(bakedAt)?api.stamp(bakedAt,TZ):'at an unknown time')+'.</b> Checking the live '+DOT+' feed\u2026';st.style.color='#9a3412';}
var busy=false;
function load(){
  if(busy)return;busy=true;
  var ctl=typeof AbortController!=='undefined'?new AbortController():null,timer=ctl&&setTimeout(function(){ctl.abort();},15000);
  fetch(WORKER+'/incidents?state='+encodeURIComponent(ST),ctl?{signal:ctl.signal}:undefined).then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json();})
    .then(function(d){paint(api.view(d,bakedAt));},function(){paint(api.view(null,bakedAt));})
    .then(function(){busy=false;if(timer)clearTimeout(timer);},function(){busy=false;if(timer)clearTimeout(timer);});
}
load();setInterval(load,300000);
document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible')load();});
})();
