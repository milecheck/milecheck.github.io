/* plows.js — shared snowplow pins + cards for every site map (CHANGE 51, 2026-10-15).
   Same rules as the app (src/utils/plows.ts): a pin is a position, never proof the
   road was plowed. "Last reported" is the truck's own GPS time, not our refresh.
   Trucks not heard from in 60 minutes are drawn faded and say so.
   Pages call MCPlows.normalize(rawRecord, dotName), MCPlows.icon(t, L), MCPlows.card(t, ctx). */
(function(){
  var BLUE='#0369A1', STALE_MIN=60;
  var TRUCK='M363 363H64Q46 363 33.5 350.5Q21 338 21 320V85H64Q64 58 82.5 39.5Q101 21 128.0 21.0Q155 21 173.5 39.5Q192 58 192 85H320Q320 58 338.5 39.5Q357 21 384.0 21.0Q411 21 429.5 39.5Q448 58 448 85H491V192L427 277H363ZM218 335H224Q232 333 236.5 326.5Q241 320 239 311L228 269L271 279Q279 281 286.0 276.5Q293 272 294.5 264.5Q296 257 292.0 250.0Q288 243 282 241L239 230L269 201Q275 196 275.0 187.5Q275 179 269.5 172.5Q264 166 255.5 166.0Q247 166 241 173L209 203L198 160Q197 152 190.0 148.0Q183 144 175.0 146.5Q167 149 163.0 156.0Q159 163 162 171L173 213L130 203Q122 201 115.0 205.0Q108 209 106.5 216.0Q105 223 109.0 230.0Q113 237 119 239L162 250L132 284Q127 289 127.0 297.0Q127 305 132.0 310.5Q137 316 145.5 316.0Q154 316 160 311L190 282L201 324Q202 328 207.0 331.5Q212 335 218 335ZM363 245H416L459 192H363ZM128 117Q141 117 150.5 107.5Q160 98 160.0 85.5Q160 73 150.5 63.0Q141 53 128.0 53.0Q115 53 105.5 63.0Q96 73 96.0 85.5Q96 98 105.5 107.5Q115 117 128 117ZM384 117Q397 117 406.5 107.5Q416 98 416.0 85.5Q416 73 406.5 63.0Q397 53 384.0 53.0Q371 53 361.5 63.0Q352 73 352.0 85.5Q352 98 361.5 107.5Q371 117 384 117Z';
  var AGENCY={"UT": "UDOT", "CO": "CDOT", "DE": "DelDOT", "MT": "MDT", "WV": "WVDOT", "MI": "MDOT", "NE": "NDOT", "IN": "INDOT", "IA": "Iowa DOT", "MN": "MnDOT", "KS": "KDOT", "MB": "Manitoba 511", "AK": "Alaska DOT&PF", "ND": "NDDOT", "AB": "511 Alberta", "PA": "PennDOT", "ON": "Ontario 511"};
  var DIRS=['north','northeast','east','southeast','south','southwest','west','northwest'];
  var css=document.createElement('style');
  css.textContent='.mcp-pin{position:relative;width:44px;height:44px}'+
    '.mcp-dot{position:absolute;left:6px;top:6px;width:32px;height:32px;border-radius:50%;background:'+BLUE+';border:2.5px solid #fff;box-sizing:border-box;box-shadow:0 1px 4px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center}'+
    '.mcp-dot svg{width:20px;height:20px;fill:#fff}'+
    '.mcp-nub{position:absolute;left:0;top:0;width:44px;height:44px}'+
    '.mcp-nub:before{content:"";position:absolute;left:16px;top:-1px;border-left:6px solid transparent;border-right:6px solid transparent;border-bottom:8px solid '+BLUE+'}'+
    '.mcp-cam{position:absolute;right:2px;top:2px;width:16px;height:16px;border-radius:50%;background:#3B82F6;border:1.5px solid #fff;box-sizing:border-box;display:flex;align-items:center;justify-content:center}'+
    '.mcp-cam svg{width:9px;height:9px;fill:#fff}'+
    '.mcp-stale{opacity:.45}.mcp-old{color:#92400E;font-weight:600}';
  document.head.appendChild(css);
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function age(min){if(min==null||!isFinite(min))return null;if(min<1)return 'just now';if(min<60)return Math.round(min)+' min ago';var h=Math.floor(min/60);if(h<24)return h+' hr ago';var d=Math.floor(h/24);return d+(d===1?' day':' days')+' ago';}
  function dirWord(b,spd){if(b==null||!isFinite(b))return '';if(+b===0&&!(+spd>0))return '';return DIRS[Math.round((((+b%360)+360)%360)/45)%8];}
  function material(s){s=String(s||'').trim();return (!s||/plow|clear/i.test(s))?'':s;}
  function normalize(t,dot){
    dot=dot||AGENCY[t.state]||'DOT';
    var vin=/^[A-Z0-9]{17}$/.test(t.name||'');
    var mins=(Date.now()-Date.parse(t.lastUpdated))/60000;
    var unit=(t.state==='MB'||t.state==='AB'||t.state==='ON')?'km':'MP';
    var name=String(t.name||'').trim();
    if(vin||/^\d+$/.test(name))name=name?('Truck '+name.slice(-6)):'';
    name=name.replace(/^(\d+)\s*-\s*(6X6\s*)?SNOW PLOW$/i,'Truck $1');
    return {lat:+t.lat,lon:+t.lon,bearing:+t.bearing,speed:+t.speedMph,dot:dot,name:name,
      route:t.route||'',mile:(t.mile!=null&&isFinite(+t.mile))?Math.round(+t.mile):null,unit:unit,
      dir:dirWord(t.bearing,t.speedMph),status:material(t.status),img:t.imageUrl||'',
      age:isFinite(mins)?Math.max(0,mins):null,stale:!(isFinite(mins)&&mins<=STALE_MIN)};
  }
  function icon(t,L){
    var nub=t.dir?'<div class="mcp-nub" style="transform:rotate('+t.bearing+'deg)"></div>':'';
    // Leah 10-15: a truck that sends a photo from its own camera gets a camera badge.
    var cam=t.img?'<div class="mcp-cam" title="This truck sends a photo"><svg viewBox="0 0 24 24"><path d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4z"/></svg></div>':'';
    return L.divIcon({className:'',iconSize:[44,44],iconAnchor:[22,22],
      html:'<div class="mcp-pin'+(t.stale?' mcp-stale':'')+'">'+nub+'<div class="mcp-dot"><svg viewBox="0 -448 512 512"><path transform="scale(1,-1)" d="'+TRUCK+'"/></svg></div>'+cam+'</div>'});
  }
  function card(t){
    var where=t.route?(esc(t.route)+(t.mile!=null?' near '+t.unit+' '+t.mile:'')):esc(t.name||(t.dot+' truck'));
    if(t.dir)where+=' · heading '+t.dir;
    var rep=t.age==null?'Last report time unknown':'Last reported '+age(t.age);
    var h='<div class="cc-title">'+esc(t.dot)+' plow'+(t.route&&t.name?' <span style="font-weight:400;opacity:.7">'+esc(t.name)+'</span>':'')+'</div>'+
      '<div class="cc-meta">'+where+'</div>'+
      '<div class="cc-meta'+(t.stale?' mcp-old':'')+'">'+rep+(t.stale&&t.age!=null?' · older than an hour':'')+'</div>'+
      (t.status?'<div class="cc-meta">'+esc(t.status)+'</div>':'');
    if(t.img)h+='<a href="'+esc(t.img)+'" target="_blank" rel="noopener" title="Open full image"><img class="cc-img" src="'+esc(t.img)+'" alt="Photo from the truck camera" loading="lazy"></a><div class="cc-meta">Photo from the truck\'s own camera, as sent to '+esc(t.dot)+'.</div>';
    return h+'<div class="cc-meta"><i>A position, not proof the road is plowed.</i></div>';
  }
  function listItem(t){
    var where=t.route?(esc(t.route)+(t.mile!=null?' near '+t.unit+' '+t.mile:'')):esc(t.name||'Truck');
    return '<li'+(t.stale?' style="opacity:.6"':'')+'>'+where+'<span class="m">'+(t.status?esc(t.status)+' · ':'')+(t.age==null?'no report time':'last reported '+age(t.age))+'</span></li>';
  }
  // Leah 10-15: a mini notice about the cab cameras, only where a truck actually sends one.
  function cameraNote(list){var n=list.filter(function(t){return t.img;}).length;if(!n)return '';return n+(n===1?' truck':' trucks')+' here send a photo from the cab. Look for the camera badge and tap the truck.';}
  function summary(list){var fresh=list.filter(function(t){return !t.stale;}).length,old=list.length-fresh;
    return fresh+(fresh===1?' plow':' plows')+' reporting'+(old?' · '+old+' older':'');}
  function sort(list){return list.sort(function(a,b){return (a.stale-b.stale)||((a.age==null?9e9:a.age)-(b.age==null?9e9:b.age));});}
  window.MCPlows={AGENCY:AGENCY,cameraNote:cameraNote,normalize:normalize,icon:icon,card:card,listItem:listItem,summary:summary,sort:sort,age:age,BLUE:BLUE};
})();
