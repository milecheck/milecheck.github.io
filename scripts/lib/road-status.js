// road-status.js begin
// Shared road-report rules for every pass, area and corridor page. One copy, embedded in each page.
// Source: scripts/lib/road-status.js. After editing, run: node scripts/apply-road-status.mjs
// Tests: node scripts/lib/road-status.test.js && node scripts/test-road-pages.js
// Rules: restate agency reports only. Never say a road is safe, open, clear or passable.
// ChatGPT review 4 (MILECHECKAPP/docs/reviews/overview-v4-2026-10-09/), repaired 2026-10-09.
//
// closureKind(text) says what the agency text reports as closed and how completely:
//   full        the road itself (one direction or both) is reported closed
//   partial     a lane, ramp, exit, connector, shoulder or roadside facility is reported closed
//   unspecified a closure with no stated extent, or a road closed only to some traffic
//   unclear     the text contradicts itself or only says a closure may happen; show the agency's words
//   none        no closure statement, a negated one, or one later reopened
// Statements are bound to road + direction + feature. A later reopening cancels an earlier closure only
// for the same road, the same direction and the same feature. "I-15 closed, off-ramp reopened" stays full.
//
// WHAT A PAGE MAY CLAIM (ChatGPT review 6, 2026-10-09). The text parser never decides on its own that a road
// is fully closed. "Full closure" appears only when (1) the agency's structured data marks the record a
// closure (event type CL), (2) the record is in an active agency window, and (3) the parsed text agrees:
// full, not limited to some traffic, and about the record's own road. The parser can only downgrade. Every
// other closure record is a "Closure report" (or a "Report" when its text reports no closure), shown with
// the agency's own words, and reopening words never remove it from a list or the banner.
var ROADSTAT_CACHE={},ROADSTAT_CACHE_N=0;
var ROADSTAT_STATE_CODES='wa|ca|nv|az|ut|id|mt|nm|ak|tx|wy|sd|nd|ks|ne|mn|ia|mo|ar|wi|il|mi|ky|tn|ms|ga|fl|sc|nc|va|wv|md|nj|ny|ct|ri|vt|nh';
// Road identity keeps the route system: I-20, US-20 and SR-20 are three different roads. "Hwy 20" and
// "Route 20" do not say which system, so they match only each other.
var ROADSTAT_ROUTE_RE=new RegExp('\\b(?:(interstate|i)|(us)|(sr|sh|state route|state highway|m|'+ROADSTAT_STATE_CODES+')|(hwy|highway|rte|route)|(or|in|me|ok|hi|oh|la|ma|pa|de|al|co)(?=-))[\\s-]?(\\d{1,4})([a-z]?)\\b','g');
// A letter suffix is part of the route (US-30A is not US-30); a trailing N, S, E or W is a direction.
function roadstatRoutes(c){var out=[],m;ROADSTAT_ROUTE_RE.lastIndex=0;while((m=ROADSTAT_ROUTE_RE.exec(c))){out.push((m[1]?'i':m[2]?'us':(m[3]||m[5])?'sr':'r')+(+m[6])+(/^[nsew]$/.test(m[7])?'':m[7]));}return out;}
// "i215" -> "I-215", "us30a" -> "US-30A", "sr138" -> "SR-138", "r20" -> "Route 20".
function roadKeyName(k){var m=/^(i|us|sr|r)(\d+)([a-z]?)$/.exec(String(k||''));if(!m)return '';return (m[1]==='r'?'Route ':m[1].toUpperCase()+'-')+m[2]+m[3].toUpperCase();}
function roadstatDir(c){var d=[];if(/\bboth directions\b|\bboth ways\b|\beach direction\b|\ball directions\b/.test(c))return 'all';[['nb',/\bnorth ?bound\b|\bnb\b/],['sb',/\bsouth ?bound\b|\bsb\b/],['eb',/\beast ?bound\b|\beb\b/],['wb',/\bwest ?bound\b|\bwb\b/]].forEach(function(x){if(x[1].test(c))d.push(x[0]);});return d.length===1?d[0]:'all';}
function roadstatHasDir(c){return /\b(north|south|east|west) ?bound\b|\b(nb|sb|eb|wb)\b|\bboth directions\b/.test(c);}
// Who may use a road or lane: "closed to trucks", "local access only". A closure with one of these is
// limited to some traffic, so it is never shown as a full closure.
var ROADSTAT_RESTRICT=/\bclosed to (?:all\s+)?(?:trucks?|commercial|semis?|tractor|trailers?|rvs?|motorhomes?|buses|high[- ]profile|oversized?|over-?width|over-?length|non-?local|through traffic|thru traffic|vehicles? (?:without|over|towing|longer|wider|taller|exceeding|with)|(?:north|south|east|west)bound trucks)|\bexcept\b|\blocal (?:traffic|access|residents?|deliveries)(?: and [\w ]+?)? only\b|\bresidents only\b|\bonly (?:local|residents|emergency)\b|\b(?:open|reopened) (?:only )?to (?:local|emergency|residents|escorted|passenger)\b|\bescorted\b|\bpilot car\b|\bno through traffic\b/;
// Vehicle-class and size limits in the same clause as a closure. Causes ("due to an overturned truck") are
// removed first, so they never limit a closure.
var ROADSTAT_VEHICLE=/\b(?:trucks?|semis?|semi-trucks?|tractor[- ]trailers?|trailers?|commercial vehicles?|commercial traffic|rvs?|motorhomes?|buses|oversized?|overweight|over-?width|over-?length|high[- ]profile|vehicles? (?:over|longer|wider|taller|heavier|exceeding|with|without|towing)|over \d[\d,.]*\s*(?:tons?|lbs?|pounds|feet|ft|')|weight (?:limit|restriction)|height (?:limit|restriction)|width (?:limit|restriction)|chains? required|without chains)\b/;
function roadstatRestricted(c){var x=c.replace(/\b(?:due to|because of|after|following|involving|caused by|from)\b.*$/,' ');return ROADSTAT_RESTRICT.test(x)||(/\bclos|\bblock|\bshut/.test(x)&&ROADSTAT_VEHICLE.test(x));}
var ROADSTAT_LIMITED=/\bonly\b|\bexcept\b|\bescorted\b|\bpilot car\b|\bone lane\b|\bsingle lane\b|\balternating\b|\bto (?:local|emergency|residents|passenger)\b/;
// One clause, its status. Order matters: history and conditions first, then cancellation, then closure.
//   closed | open | negated | possible | limited (reopened or open only to some traffic) | null
function roadstatStatus(c){
  c=c.replace(/\b(?:until|till|before)\b[^,;]*?\bre-?open\w*/g,' ')
    .replace(/\b(?:after|since|following)\s+(?:[\w-]+\s+){0,2}?re-?open\w*/g,' ');
  // "Has not reopened", "is not open to traffic", "will not reopen": the closure stands.
  if(/\b(?:not|n't|never|yet to)\s+(?:been\s+|yet\s+|be\s+)?re-?open(?:ed|s)?\b|\bnot (?:yet )?(?:open|opened)\b|\b(?:remains|is still|are still) closed\b/.test(c))return 'closed';
  // A reopening that depends on a condition, or one dated ahead, has not happened.
  if(/\b(?:if|when|unless|once|in case|should|provided)\b[^.;]*\bre-?open/.test(c))return null;
  if(/\bno longer (?:be )?(?:closed|blocked)\b/.test(c))return 'open';
  // "Closure canceled", "road closure lifted": the stated closure has ended.
  if(/\b(?:closures?|closed|restrictions?)\s+(?:(?:has|have|had|is|was|were|been|now)\s+){0,2}(?:canceled|cancelled|lifted|rescinded|called off|removed|ended|terminated|withdrawn)\b|\b(?:canceled|cancelled|lifted|rescinded|called off|ended)\s+(?:the\s+)?(?:\w+\s+){0,2}?closures?\b/.test(c))return 'open';
  if(/\b(?:no|not|isn'?t|aren'?t|never|none)\b(?:\s+[\w#-]+){0,3}?\s+(?:closures?|closed|blocked|shut)\b/.test(c))return 'negated';
  if(/\b(?:will|would|may|might|could|should|expected to|scheduled to|planned to|plans? to|set to|going to|about to|to)\s+(?:be\s+)?re-?open/.test(c))return null;
  if(/\b(?:anticipated|estimated|expected|scheduled|planned|projected|target)\s+(?:[\w-]+\s+){0,2}?re-?open|\bre-?opens\s+(?:at|on|in|by|after|around|about|tomorrow|tonight|later|next|this|(?:mon|tues|wednes|thurs|fri|satur|sun)day|jan\w*|feb\w*|mar\w*|apr\w*|may|june?|july?|aug\w*|sep\w*|oct\w*|nov\w*|dec\w*|\d)/.test(c))return null;
  // History describes the closure only when it is attached to the closure word. "Remains closed after an
  // earlier collision" is a current closure; "previously closed" and "closed earlier" are not.
  if(/\b(?:previously|earlier|formerly|had been|prior(?:ly)?)\s+(?:[\w-]+\s+){0,2}?(?:closed|blocked|shut)\b|\b(?:closed|blocked)\s+earlier\b|\b(?:earlier|previous|prior)\s+closures?\b/.test(c))return null;
  if(/\bre-?open(?:ed|s)?\b|\bopen(?:ed)? to (?:all |local |emergency |\w+ )?(?:traffic|vehicles|residents)\b|\b(?:is|are|now|remains?|back) open\b|\blanes? (?:are |is )?(?:now )?open\b/.test(c))return ROADSTAT_LIMITED.test(c)?'limited':'open';
  if(/\b(?:will|shall)\s+(?:continue to\s+)?remain\s+(?:fully\s+)?(?:closed|blocked)\b|\bcontinues? to (?:be|remain) (?:closed|blocked)\b/.test(c)&&!/\b(?:if|unless|when|should)\b/.test(c))return 'closed';
  if(/\b(?:will|would|may|might|could|shall|expected to|scheduled to|planned to|plans? to|set to|going to|about to|expect)\s+(?:[\w#-]+\s+){0,5}?(?:clos|shut|block)/.test(c))return 'possible';
  if(/\b(?:if|when|whenever|in case|unless)\b[^,;]*\b(?:clos|block|shut)/.test(c))return 'possible';
  // A condition after the closure word: "closed if avalanche control is needed".
  if(/\b(?:clos|block|shut)\w*\b[^.;]*\b(?:if|unless|in case|in the event|should|whenever|as needed|when needed)\b/.test(c))return 'possible';
  if(/\b(?:possible|potential|intermittent|periodic|occasional|rolling|brief)\s+(?:[\w-]+\s+)?(?:closures?|stops?|holds?)\b|\bclos(?:ing|es)\b|\bto close\b|\bwas (?:closed|blocked)\b|\bup to \d+[- ]?min(?:ute)?s?\s+(?:closures?|stops?|holds?)/.test(c))return 'possible';
  if(/\bclos(?:ed|ure|ures)\b|\bshut\b|\bblocked\b/.test(c))return 'closed';
  return null;
}
// Features named in a clause. A ramp, exit, shoulder, lane or roadside facility is the closed object
// whenever one is named; "all lanes" and the road itself are the mainline. raw is the clause before
// location phrases were removed, so "I-15 Exit 10 off-ramp" keeps its exit number.
function roadstatFeatures(c,raw){
  var f=[],m,re;
  var allLanes=/\ball\s+(?:(?:(?:north|south|east|west) ?bound|[nsew]b|travel|through|thru|traffic|main|mainline)\s+)*lanes\b|\bboth\s+(?:travel\s+)?lanes\b/.test(c);
  re=/(\d+)\s+of\s+(\d+)\s+lanes/g;while((m=re.exec(c))){if(+m[1]>=+m[2]&&+m[2]>0)allLanes=true;}
  var own=c.match(/\bexit\s*#?\s*(\d+[a-z]?)\b/),rawAll=String(raw||'').match(/\bexit\s*#?\s*\d+[a-z]?\b/g)||[];
  var ex=own?own[1]:rawAll.length===1?(rawAll[0].match(/(\d+[a-z]?)$/)||[])[1]:'',xid=ex?'#'+ex:'';
  if(/\bon[\s-]?ramps?\b/.test(c))f.push('ramp:on'+xid);
  if(/\boff[\s-]?ramps?\b/.test(c))f.push('ramp:off'+xid);
  if(/\bconnectors?\b|\bslip road\b/.test(c))f.push('ramp:connector'+xid);
  if(!f.length&&/\bramps?\b|\binterchange\b/.test(c))f.push('ramp:any'+xid);
  if(!f.length&&/\bexit\b/.test(c))f.push('ramp:exit'+xid);
  if(/\bshoulders?\b/.test(c))f.push('shoulder');
  m=c.replace(/\b(?:local|emergency|resident) access\b|\baccess (?:only|is limited)\b/g,' ').match(/\b(rest areas?|vista points?|view ?points?|weigh stations?|scales?|sno-?parks?|parking (?:lot|area)s?|chain(?:-up)? areas?|turnouts?|sidewalks?|crosswalks?|pedestrian|bike lanes?|trails?|trailheads?|campgrounds?|access|intersections?|crossovers?|u-turns?|turnarounds?|overpass(?:es)?|underpass(?:es)?|frontage roads?|service roads?|medians?)\b/);
  if(m)f.push('fac:'+m[1].replace(/(?:es|s)$/,''));
  if(!allLanes&&/\blanes?\b/.test(c.replace(/\bbike lanes?\b/g,''))){var q=(c.split(/\blanes?\b/)[0].match(/\b(left|right|center|middle|inside|outside|hov|carpool|express|turn|slow|truck|passing|#\d+|\d+(?:st|nd|rd|th)?|one|two|three|four)\b/g)||[]).sort().join('+');f.push('lane:'+q);}
  return {subs:f,allLanes:allLanes};
}
// "Kugler Mill Road is closed": a named road with no route number. Kept apart from numbered routes.
function roadstatNamedRoad(c){var m=c.match(/\b((?:[a-z0-9'#-]+\s+){1,3}?)(?:road|rd|street|st|avenue|ave|av|drive|dr|boulevard|blvd|way|pkwy|parkway|pike|trail|trl)\b/);
  if(!m)return '';var w=m[1].trim().split(/\s+/).filter(function(x){return !/^(?:the|a|an|this|that|frontage|service|access|county|local|main|on|at|of|is|and|to|from|in)$/.test(x);});return w.length?w.join(' '):'';}
function roadstatMainSubject(c,routes){return routes.length>0||/\b(?:road|rd|roadway|highway|hwy|freeway|fwy|expressway|interstate|route|rte|pass|mainline|bridge|tunnel|street|st|avenue|ave|av|drive|dr|boulevard|blvd|parkway|pkwy|pike|travel lanes)\b/.test(c)||roadstatHasDir(c);}
var ROADSTAT_LANE_WORDS=/^(?:right|left|center|centre|middle|inside|outside|inner|outer|hov|carpool|express|turn|travel|through|thru|slow|truck|passing|bike|bicycle|bus|one|two|three|four|single|all|both|each|every|the|a|an|curb|median|fast|auxiliary|merge|exit|entrance|acceleration|deceleration|climbing|general|purpose|shoulder|traffic|main|mainline|reversible|managed|toll|northbound|southbound|eastbound|westbound|nb|sb|eb|wb|no|one-way|alternating|open|closed|\d+(?:st|nd|rd|th)?|#\d+)$/i;
var ROADSTAT_AFTER_LANE=/^(?:closed|closures?|is|are|was|were|will|blocked|shifts?|reductions?|restrictions?|open|reopened|remains?|has|have|closing|shut|affected|of|on|in|at|for)$/i;
// "Blackberry Hill Lane" and "Apple Tree Ln" are streets. "Right lane" and "Lane 2" are lanes.
function roadstatStreets(t){
  return String(t||'').replace(/\b([A-Za-z][\w'-]*)\s+(lane|ln)\b\.?(\s+[\w#]+)?/gi,function(all,w,l,nx){
    var next=(nx||'').trim();
    if(ROADSTAT_LANE_WORDS.test(w)||ROADSTAT_AFTER_LANE.test(next)||/^\d/.test(next))return all;
    return w+(w===w.toUpperCase()?' STREET':' street')+(nx||'');
  });
}
// Abbreviation periods are not sentence ends, except before a capital in mixed-case text ("3:30 pm. The").
function roadstatNormalize(t){
  var caps=!/[a-z]/.test(String(t||'')),x=roadstatStreets(t);
  var keep=function(ab,sp,cap){return (cap&&!caps)?ab+'.'+sp:ab+(sp||'');};
  return x.replace(/\r/g,'')
    .replace(/(\d)\.(\d)/g,'$1_$2')
    .replace(/\b[uU]\.\s?[sS]\./g,'us').replace(/\b([nN][oO])\.\s*(\d)/g,'#$2')
    .replace(/\b([aApP])\.[mM]\.(\s+([A-Z]))?/g,function(m,ap,sp,cap){return keep(ap+'m',sp,cap);})
    .replace(/\b(mt|st|ave|av|blvd|rd|hwy|rte|approx|nb|sb|eb|wb|ft|mi|jct|dr|ct|ln|pkwy|mp|pm|am|e\.g|i\.e|etc|vs)\.(\s+([A-Z]))?/gi,function(m,ab,sp,cap){return keep(ab,sp,cap);})
    .toLowerCase();
}
// Location phrases are where something is, not what is closed: "at Exit 10", "between Exit 10 and Exit 12",
// "at the SR-138 interchange", "underneath the Main Street overpass".
function roadstatStripLocations(s){
  return s
    .replace(/\bbetween\s+(?:(?:exits?|mile|mp|milepost|postmile|pm|mm|mile marker|mile point)\s*)?[\w#_-]+\s+and\s+(?:(?:exits?|mile|mp|milepost|postmile|pm|mm|mile marker|mile point)\s*)?[\w#_-]+/g,' at-loc ')
    .replace(/\bbetween\s+(?:(?!(?:closed|closures?|blocked|reopen\w*|open)\b)[\w#_'\/().-]+\s+){1,6}?and\s+(?:(?:[\w#_'\/().-]+\s+){0,4}?(?:rd|road|st|street|dr|drive|ave|av|avenue|blvd|ln|way|pkwy|parkway|hwy|highway|ct|court|pl|place|cir|circle|trl|trail|line|bridge|creek|river|junction|jct|interchange)\b|(?:exits?|mile|mp|milepost|postmile|pm|mm|mile marker|mile point)\s*[\w#_-]+|[\w#_-]+)/g,' at-loc ')
    .replace(/\bfrom\s+(?:exit|mile|mp|milepost|postmile|pm|mm)\s*[\w#_-]+\s+to\s+(?:exit|mile|mp|milepost|postmile|pm|mm)\s*[\w#_-]+/g,' at-loc ')
    .replace(/\b(?:near|at|past|before|after|by|from|to|via|use|take|of|beyond|prior to|approaching|between)\s+(?:the\s+)?exits?\b(\s*\d+[a-z]?)?/g,' at-loc ')
    .replace(/\b(?:at|near|under|underneath|beneath|below|over|above|past|beyond|beside|next to|approaching|across)\s+(?:the\s+)?(?:[\w#'.-]+\s+){0,4}?(?:interchanges?|overpass(?:es)?|underpass(?:es)?|bridges?|viaducts?|junctions?|rest areas?)\b/g,' at-loc ');
}
function roadstatClauses(sentence){
  var out=[];
  var pieces=sentence.split(/,|\u00b7|\s\|\s|:(?!\d)|\s[—–-]\s|\b(?:but|while|however|whereas)\b/),merged=[];
  // "If repairs finish, I-15 reopens": the condition stays with its statement.
  pieces.forEach(function(x){var last=merged[merged.length-1];if(last!=null&&/^\s*(?:if|when|unless|once|in case|should|provided)\b/.test(last)&&!/clos|open|block|shut/.test(last))merged[merged.length-1]=last+' '+x;else merged.push(x);});
  merged.forEach(function(raw){
    var p=roadstatStripLocations(raw),parts=p.split(/\band\b/),acc='';
    var st=/clos|re-?open|\bopen\b|blocked|\bshut\b|cancel|lifted/;
    parts.forEach(function(x,i){if(i===0){acc=x;return;}if(st.test(acc)&&st.test(x)){out.push({c:acc,raw:raw});acc=x;}else acc+=' and '+x;});
    out.push({c:acc,raw:raw});
  });
  return out.map(function(x){return {c:x.c.trim(),raw:x.raw};}).filter(function(x){return x.c;});
}
// Statements in reading order, each tied to a road (system and number), a direction and a feature
// (mainline, a lane, a shoulder, a numbered exit's ramp, a roadside facility). Generic statements
// ("Reopened.", "Closure canceled.") are bound to the record's road or feature at the end.
function closureScope(text,recRoute){
  var t=roadstatNormalize(text);
  var stmts=[],floats=[],allRoutes=roadstatRoutes(t),primary=allRoutes[0]||'road',pos=0,topic=null;
  t.split(/[.;!?\n]+/).forEach(function(sentence){
    roadstatClauses(sentence).forEach(function(cl){
      var c=cl.c,status=roadstatStatus(c),routes=roadstatRoutes(c),F=roadstatFeatures(c,cl.raw),dir=roadstatDir(c);
      // A clause that limits traffic without a closure ("Local access only on SR-138") qualifies the
      // closures on its own road, or every closure when it names no road.
      if(roadstatRestricted(c)&&status!=='closed'&&status!=='limited')floats.push({road:routes[0]||'',dir:dir,feats:F.subs.filter(function(k){return k.indexOf('lane:')!==0;}),pos:pos});
      // "Bridge work on ramp from US-395. All lanes blocked." The lanes are the ramp's.
      var named=F.subs.filter(function(k){return k.indexOf('lane:')!==0;});
      // "KS-156 — closed": a route named on its own is the subject of the next bare statement.
      if(named.length)topic={subs:named,road:routes[0]||primary};else if(routes.length&&!F.allLanes&&!F.subs.length)topic=status?null:{route:routes[0],dir:dir};else if(routes.length)topic=null;
      if(!status)return;
      var topicRoute='',subRoad=routes[0]||'';
      if(!named.length&&topic&&!routes.length&&(F.allLanes||!F.subs.length)&&!roadstatMainSubject(c,[])){if(topic.route){if(!F.subs.length)topicRoute=topic.route;}else{F={subs:topic.subs.slice(),allLanes:false};subRoad=topic.road;}}
      // "I-15 northbound: all lanes closed": the heading's direction belongs to its statement.
      if(topicRoute&&dir==='all'&&topic.dir&&!roadstatHasDir(c))dir=topic.dir;
      var full=/\b(?:full|complete|total|hard)\s+(?:road\s+|roadway\s+|freeway\s+|highway\s+)?closures?\b|\b(?:fully|completely) closed\b|\bclosed completely\b/.test(c);
      var verb=/\bclosed\b|\bshut\b|\bblocked\b/.test(c);
      var limited=status==='limited';if(limited){status='closed';verb=true;}
      var base={status:status,dir:dir,restricted:status==='closed'&&(limited||roadstatRestricted(c)),pos:pos++};
      if(F.subs.length){F.subs.forEach(function(k){stmts.push(Object.assign({key:k+'@'+(subRoad||primary),feat:k,kind:'sub',road:subRoad||primary,full:full},base));});return;}
      var roadName=routes.length?'':roadstatNamedRoad(c),road=routes[0]||(roadName?'named:'+roadName:primary);
      if(topicRoute)road=topicRoute;
      if(F.allLanes||topicRoute&&(verb||full||status!=='closed')||(roadstatMainSubject(c,routes)&&(verb||full||status!=='closed')))stmts.push(Object.assign({key:'main:'+road,kind:'main',road:road,full:true},base));
      else stmts.push(Object.assign({key:'generic',kind:'generic',full:full,verb:verb,road:primary},base));
    });
  });
  var hasMain=stmts.some(function(s){return s.kind==='main';}),subs=stmts.filter(function(s){return s.kind==='sub';});
  var subKeys=[];subs.forEach(function(s){if(subKeys.indexOf(s.key)<0)subKeys.push(s.key);});
  var conflict=false,bound=[];
  stmts.forEach(function(s){
    if(s.kind!=='generic'){bound.push(s);return;}
    if(hasMain){bound.push(Object.assign({},s,{key:'main:'+s.road,kind:'main',full:true,nounOnly:!(s.full||s.verb)}));return;}
    if(subKeys.length){
      // A "full closure" heading over a ramp, exit, shoulder or facility describes that feature.
      // Over a lane that is not every lane, it contradicts the description.
      if(s.full&&s.status==='closed'&&subKeys.some(function(k){return k.indexOf('lane:')===0;}))conflict=true;
      // "Reopened" or "closure canceled" with no road named refers to the feature the record is about.
      // "No full closure" beside a lane or ramp closure agrees with it and changes nothing.
      if(s.status==='open'||(s.status==='closed'&&s.restricted))subKeys.forEach(function(k){bound.push(Object.assign({},s,{key:k,kind:'sub'}));});
      return;
    }
    bound.push(s);
  });
  // Qualifiers that stand alone apply to closures on their road (and direction, when they name one).
  // A limit on a ramp or roadside feature ("off-ramp access for local traffic only") limits that feature only.
  bound.forEach(function(s){if(s.status!=='closed')return;floats.forEach(function(f){
    if(f.feats.length){if(s.kind==='sub'&&f.feats.indexOf(s.feat)>=0&&(!f.road||f.road===s.road))s.restricted=true;return;}
    if((!f.road||f.road===s.road)&&(f.dir==='all'||s.dir==='all'||f.dir===s.dir))s.restricted=true;});});
  // Resolve each road and feature in reading order. Direction 'all' resets every direction; a single
  // direction changes only itself. A reopening never crosses road, direction or feature.
  var keys={};
  bound.forEach(function(s){
    if(s.status==='possible')return;
    var K=keys[s.key]=keys[s.key]||{kind:s.kind,road:s.road,dirs:{},conflict:false};
    var apply=function(d){var prev=K.dirs[d]||(d!=='all'?K.dirs.all:null);if(prev&&((prev.status==='closed'&&s.status==='negated')||(prev.status==='negated'&&s.status==='closed')))K.conflict=true;
      var ext=s.status==='closed'?(s.full&&!s.nounOnly?'full':'unspec'):null;if(prev&&prev.status==='closed'&&s.status==='closed'&&prev.ext==='full')ext='full';
      K.dirs[d]={status:s.status,ext:ext,restricted:s.status==='closed'&&!!s.restricted,pos:s.pos,dir:d};};
    if(s.dir==='all'){var had=Object.keys(K.dirs);had.forEach(function(d){apply(d);});if(had.indexOf('all')<0)apply('all');var keep=K.dirs.all;K.dirs={all:keep};}
    else apply(s.dir);
  });
  // The strongest closure on a feature: unrestricted full, then restricted, then extent not stated.
  var rank=function(v){return v.status!=='closed'?0:(v.ext==='full'&&!v.restricted)?3:v.restricted?2:1;};
  var closedOf=function(K,skip){var out=null;Object.keys(K.dirs).forEach(function(d){if(skip&&skip(d))return;var v=K.dirs[d];if(rank(v)&&(!out||rank(v)>rank(out)))out=v;});return out;};
  var fullRoads=[],mainFull=false,mainRestricted=false,mainUnspec=false,subClosed=[],genericClosed=null,mainConflict=false,crossOnly=null,anyRestricted=false;
  var recNum=roadstatRoutes(String(recRoute||'').toLowerCase())[0]||'';
  Object.keys(keys).forEach(function(k){var K=keys[k],c=closedOf(K);
    if(c&&c.restricted)anyRestricted=true;
    // A named street closed on a record filed under a numbered route is a cross street, not that route.
    if(K.kind==='main'&&c&&c.ext==='full'&&!c.restricted&&k.indexOf('main:named:')===0&&recNum){if(crossOnly===null)crossOnly=true;return;}
    if(K.kind==='main'&&c&&c.ext==='full')crossOnly=false;
    if(K.kind==='main'){
      if(K.conflict)mainConflict=true;
      if(!c)return;
      if(rank(c)===3){
        // A lane on this road reported open later in a direction the road was closed: if no closed
        // direction is left untouched, the agency wording decides.
        var opened=bound.filter(function(s){return s.kind==='sub'&&s.feat.indexOf('lane:')===0&&s.road===K.road&&s.status==='open';});
        var left=closedOf(K,function(d){return opened.some(function(s){return s.pos>K.dirs[d].pos&&(s.dir==='all'||d==='all'&&false||s.dir===d);});});
        var allOpened=opened.some(function(s){return s.dir==='all'&&Object.keys(K.dirs).some(function(d){return s.pos>K.dirs[d].pos;});});
        if(allOpened||!left||rank(left)<3)mainConflict=true;else{mainFull=true;if(fullRoads.indexOf(K.road)<0)fullRoads.push(K.road);}
      }else if(c.restricted)mainRestricted=true;else mainUnspec=true;
    }else if(K.kind==='sub'){if(K.conflict)conflict=true;if(c)subClosed.push(k.split('@')[0]);}
    else if(K.kind==='generic'){if(K.conflict)conflict=true;if(c)genericClosed=c;}
  });
  var possible=bound.some(function(s){return s.status==='possible';});
  var kind;
  if(crossOnly&&!mainFull)mainConflict=true;
  if(mainFull&&!mainConflict)kind='full';
  else if(mainConflict||conflict)kind='unclear';
  else if(mainRestricted)kind='unspecified';
  else if(subClosed.length)kind='partial';
  else if(mainUnspec)kind='unspecified';
  else if(genericClosed)kind=genericClosed.restricted?'unspecified':genericClosed.ext==='full'?'full':'unspecified';
  else if(possible)kind='unclear';
  else kind='none';
  var feats=[];subClosed.forEach(function(f){var x=f.indexOf('lane:')===0?'lane':f.indexOf('ramp:')===0?'ramp':f==='shoulder'?'shoulder':f.replace(/^fac:/,'');if(feats.indexOf(x)<0)feats.push(x);});
  if(kind==='full'&&!fullRoads.length)fullRoads.push('road');
  // roads: the roads the text reports fully closed ('road' = the record's own road, unnamed in the text).
  return {kind:kind,restricted:kind==='unspecified'&&(mainRestricted||anyRestricted||!!(genericClosed&&genericClosed.restricted)),features:kind==='partial'?feats:[],roads:kind==='full'?fullRoads:[],statements:bound};
}
function closureDetail(text,recRoute){
  var t=String(text||''),key=t+'\u0001'+(recRoute||'');if(Object.prototype.hasOwnProperty.call(ROADSTAT_CACHE,key))return ROADSTAT_CACHE[key];
  if(ROADSTAT_CACHE_N>2000){ROADSTAT_CACHE={};ROADSTAT_CACHE_N=0;}
  var s=closureScope(t,recRoute);ROADSTAT_CACHE_N++;return (ROADSTAT_CACHE[key]={kind:s.kind,restricted:s.restricted,features:s.features,roads:s.roads});
}
function closureKind(text,recRoute){return closureDetail(text,recRoute).kind;}
// The complete agency text is classified. Loaders keep it in a.text; title and desc may be shortened for
// display only. Title and description stay separate statements so a generic heading never merges.
function recordText(a){if(a.text)return String(a.text);var t=String(a.title||'').trim(),d=String(a.desc||'').trim();if(!d||d===t)return t;if(!t||d.indexOf(t)===0)return d;return t+'\n'+d;}
function fullText(headline,description,impact){var c=function(x){return String(x==null?'':x).replace(/<[^>]+>/g,' ').replace(/[ \t]+/g,' ').trim();};var h=c(headline),d=c(description),i=c(impact),o=[];if(h&&!(d.indexOf(h)===0&&/[.!?]$/.test(h)))o.push(h);if(d&&d!==h)o.push(d);if(i&&i!==h&&d.indexOf(i)<0)o.push(i);return o.join('\n');}
function closureDetailOf(a){return closureDetail(recordText(a),a.route);}
function closureKindOf(a){return closureDetailOf(a).kind;}

// One timing rule for every surface: map, cards, lists, counts, banner and Overview.
//   current   both agency times known and now is inside the scheduled window
//   open      start known and passed, no end supplied
//   upcoming  start is later
//   ended     the agency end time has passed
//   unknown   no start, or the end is not after the start
function timingState(a,now){var n=now==null?Date.now():now,s=isFinite(a.t0),e=isFinite(a.t1);if(s&&e&&a.t1<=a.t0)return 'unknown';if(e&&a.t1<=n)return 'ended';if(s&&a.t0>n)return 'upcoming';if(s&&e)return 'current';if(s)return 'open';return 'unknown';}
// A report the agency has not scheduled for later and has not ended. Counted as a current report.
function isCurrentReport(a,now){var s=timingState(a,now);return s==='current'||s==='open'||s==='unknown';}
// The agency's structured closure flag. The Worker sets event type CL from each agency's own closure data.
function isClosureRecord(a){return a.type==='CL';}
// An active agency window: the scheduled window is underway, or the start has passed and no end was given.
// A record with no times, or times that do not form a window, is reported but never called a full closure.
function isActiveWindow(a,now){var s=timingState(a,now);return s==='current'||s==='open';}
function recordRouteKey(a){return roadstatRoutes(String(a.route||'').toLowerCase())[0]||'';}
// Full closure: structured closure, active window, and text that agrees about this record's own road.
function isFullClosure(a,now){
  if(!isClosureRecord(a)||!isActiveWindow(a,now))return false;
  var d=closureDetailOf(a);if(d.kind!=='full'||d.restricted)return false;
  var rk=recordRouteKey(a);return !rk||d.roads.indexOf('road')>=0||d.roads.indexOf(rk)>=0;
}
// Closure records the banner counts: every structured closure that is not scheduled later and not ended.
function isCountedClosure(a,now){return isClosureRecord(a)&&isCurrentReport(a,now);}
// The banner, one wording for every page. It counts agency closure records (not distinct closures), names
// each by its own route, direction, mile marker and source, and says which are full closures under the rule
// above. scope is "within 14 miles of <place>" or "on I-15"; tail is the last sentence. Returns HTML.
var ROAD_DIRW={NB:'northbound',SB:'southbound',EB:'eastbound',WB:'westbound'};
function roadEsc(x){return String(x==null?'':x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function closureBanner(records,now,scope,tail){
  var c=(records||[]).filter(function(a){return isCountedClosure(a,now);});if(!c.length)return '';
  var lab=function(a){return isFullClosure(a,now)?'full closure':closureKindOf(a)==='none'?'report':'closure report';};
  c.sort(function(x,y){return (isFullClosure(y,now)?1:0)-(isFullClosure(x,now)?1:0);});
  var n=c.length,g={none:0,bad:0};c.forEach(function(a){var x=timingGap(a);if(x==='none')g.none++;else if(x)g.bad++;});
  var notes=[];if(g.none)notes.push(g.none+' with no agency times');if(g.bad)notes.push(g.bad+' with incomplete or invalid agency timing');
  var item=function(a){return roadEsc(a.route||'Road not specified')+(ROAD_DIRW[a.dir]?' '+ROAD_DIRW[a.dir]:'')+(+a.mp>0?' near MP '+Math.round(+a.mp):'')+' ('+roadEsc(sourceOf(a))+', '+lab(a)+')';};
  return '\u26a0 '+n+' closure report'+(n>1?'s':'')+' '+scope+': '+c.slice(0,3).map(item).join('; ')+(n>3?'; and '+(n-3)+' more':'')+'.'+(notes.length?' '+notes.join(', ')+'.':'')+(tail?' '+tail:'');
}
// The agency's complete words for display. When they must be shortened, every later sentence that qualifies
// the report (reopened, not reopened, except, only, if, unless, may, trucks, weight, detour) stays visible.
var ROADSTAT_QUALIFIER=/re-?open|not open|\bexcept\b|\bonly\b|\bif\b|\bunless\b|\bwould\b|\bmay\b|\bmight\b|\bexpect|cancel|lifted|\btrucks?\b|\btons?\b|\bweight\b|\bheight\b|\bwidth\b|\bchains?\b|\blocal\b|\bdetour|\bclos/i;
function agencyWords(a,max){var t=String(recordText(a)).replace(/\s*\n\s*/g,' ').replace(/\s+/g,' ').trim();max=max||400;if(t.length<=max)return t;
  var head=t.slice(0,max),cut=head.lastIndexOf(' ');head=cut>max*0.6?head.slice(0,cut):head;
  var q=(t.slice(head.length).match(/[^.!?]+[.!?]?/g)||[]).filter(function(x){return ROADSTAT_QUALIFIER.test(x);}).map(function(x){return x.trim();});
  return head+' \u2026'+(q.length?' '+q.join(' '):'');}

// Agencies and time zones come from the record's state, never from one page.
var ROAD_AGENCY={CA:'Caltrans',WA:'WSDOT',OR:'ODOT',NV:'NDOT',UT:'UDOT',CO:'CDOT',ID:'ITD',MT:'MDT',AZ:'ADOT',NM:'NMDOT',AK:'Alaska DOT&PF',WY:'WYDOT',TX:'TxDOT',FL:'FDOT',GA:'GDOT',NY:'NYSDOT',PA:'PennDOT',VA:'VDOT',NC:'NCDOT',SC:'SCDOT',TN:'TDOT',KY:'KYTC',OH:'Ohio DOT',IN:'INDOT',IL:'IDOT',MI:'MDOT',WI:'WisDOT',MN:'MnDOT',IA:'Iowa DOT',MO:'MoDOT',KS:'KDOT',NE:'NDOT (Nebraska)',SD:'SDDOT',ND:'NDDOT',OK:'ODOT (Oklahoma)',AR:'ARDOT',LA:'LADOTD',MS:'MDOT (Mississippi)',AL:'ALDOT',WV:'WVDOT',MD:'MDOT SHA',DE:'DelDOT',NJ:'NJDOT',CT:'CTDOT',RI:'RIDOT',MA:'MassDOT',VT:'VTrans',NH:'NHDOT',ME:'MaineDOT',HI:'HDOT'};
var ROAD_ZONE={WA:'America/Los_Angeles',OR:'America/Los_Angeles',CA:'America/Los_Angeles',NV:'America/Los_Angeles',ID:'America/Boise',MT:'America/Denver',WY:'America/Denver',UT:'America/Denver',CO:'America/Denver',NM:'America/Denver',AZ:'America/Phoenix',AK:'America/Anchorage',HI:'Pacific/Honolulu',TX:'America/Chicago',OK:'America/Chicago',KS:'America/Chicago',NE:'America/Chicago',SD:'America/Chicago',ND:'America/Chicago',MN:'America/Chicago',IA:'America/Chicago',MO:'America/Chicago',AR:'America/Chicago',LA:'America/Chicago',MS:'America/Chicago',AL:'America/Chicago',TN:'America/Chicago',WI:'America/Chicago',IL:'America/Chicago',KY:'America/New_York',IN:'America/Indiana/Indianapolis',MI:'America/Detroit',OH:'America/New_York',WV:'America/New_York',VA:'America/New_York',NC:'America/New_York',SC:'America/New_York',GA:'America/New_York',FL:'America/New_York',PA:'America/New_York',NY:'America/New_York',NJ:'America/New_York',DE:'America/New_York',MD:'America/New_York',CT:'America/New_York',RI:'America/New_York',MA:'America/New_York',VT:'America/New_York',NH:'America/New_York',ME:'America/New_York',DC:'America/New_York'};
function zoneFor(st){return ROAD_ZONE[String(st||'').toUpperCase()]||'America/New_York';}
function agencyFor(st){var s=String(st||'').toUpperCase();return ROAD_AGENCY[s]||(s?s+' DOT':'State DOT');}
// The agency that sent one record. CHP and Caltrans message-sign records carry their own id prefix.
function sourceOf(a){var id=String(a.id||'');if(/-chp-/i.test(id))return 'CHP';if(/-CMS-/i.test(id))return 'Caltrans message sign';return a.src||agencyFor(a.st);}
// Time with its zone name, so a reader in another zone is never misled: "Fri, Oct 9, 10:00 AM PDT".
function whenIn(ms,tz){if(!isFinite(ms))return 'time not supplied';try{return new Date(ms).toLocaleString('en-US',{weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZone:tz,timeZoneName:'short'});}catch(e){return new Date(ms).toLocaleString('en-US');}}
function clockIn(ms,tz){if(!isFinite(ms))return 'time not supplied';try{return new Date(ms).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',timeZone:tz,timeZoneName:'short'});}catch(e){return new Date(ms).toLocaleTimeString('en-US');}}
// The agency's timing in words. Never says a road is open; an ended window is only an ended window.
function timingText(a,now,tz){
  var s=timingState(a,now),w=function(ms){return whenIn(ms,tz||zoneFor(a.st));};
  if(s==='current')return 'Scheduled window underway. Agency end time '+w(a.t1)+'.';
  if(s==='upcoming')return 'Scheduled start '+w(a.t0)+(isFinite(a.t1)?'. Scheduled end '+w(a.t1):'. End time not supplied')+'.';
  if(s==='open')return 'Agency start time '+w(a.t0)+'. End time not supplied.';
  if(s==='ended')return 'Agency end time '+w(a.t1)+' has passed.';
  if(isFinite(a.t0)&&isFinite(a.t1))return 'Agency times do not form a valid window ('+w(a.t0)+' to '+w(a.t1)+').';
  if(isFinite(a.t1))return 'Agency end time '+w(a.t1)+'. Start time not supplied.';
  return 'Timing not supplied by the agency.';
}
// List and card label for one record. Upcoming is planned; a closure label never claims "Closed".
// Returns [cssClass, text]. tags is the page's type table, used for non-closure records.
function reportTag(a,now,tags){
  var s=timingState(a,now),d=closureDetailOf(a),k=d.kind,t=(tags&&(tags[a.type]||tags.OT))||['ot','Alert'];
  if(s==='upcoming')return ['rw','Planned'];
  if(s==='ended')return ['ot','Ended'];
  if(isFullClosure(a,now))return ['cl','Full closure'];
  // Any other agency closure record is a closure report in the agency's words. Its text never upgrades it,
  // and reopening words only make it a neutral "Report"; it stays listed.
  if(isClosureRecord(a))return k==='none'?['ot','Report']:['ot','Closure report'];
  return t;
}
// What is missing from a report's timing: 'none' (no times at all), 'incomplete' (one of the two),
// 'invalid' (the end is not after the start), or '' (both present and in order).
function timingGap(a){var s=isFinite(a.t0),e=isFinite(a.t1);if(!s&&!e)return 'none';if(s&&e)return a.t1<=a.t0?'invalid':'';return 'incomplete';}
// One feed-health rule for every page. A hard failure (no payload, ok:false, failed/unavailable status,
// no rows array) gives no rows: rows inside a failed payload are not shown as current reports.
// A partial payload keeps its rows and is flagged. Returns {cls:'ok'|'partial'|'failed', rows}.
function feedHealth(d,key){var rows=d&&Array.isArray(d[key])?d[key]:null;
  var hard=!d||!!d.unavailable||d.ok===false||d.supported===false||['failed','unavailable','unsupported'].indexOf(d.source_status)>=0||!rows;
  var soft=!hard&&(d.source_status==='partial'||(Array.isArray(d.errors)&&d.errors.length>0));
  return {cls:(hard||(soft&&!rows.length))?'failed':soft?'partial':'ok',rows:hard?[]:rows};}
// California and Nevada mileposts restart at county lines. A range is shown only when both ends carry
// the same verified county. No feed supplies county ids today, so those states show the start only.
var ROAD_COUNTY_MILE_STATES=['CA','NV'];
function mileText(a){var m=+a.mp;if(!(m>0))return '';var s=' · MP '+Math.round(m),e=a.end&&+a.end.mp,st=String(a.st||'').toUpperCase();
  var ok=st&&(ROAD_COUNTY_MILE_STATES.indexOf(st)<0||(a.county&&a.end&&a.end.county&&a.county===a.end.county));
  if(ok&&e>0&&Math.round(e)!==Math.round(m))s+=' to '+Math.round(e);return s;}
if(typeof module!=='undefined'&&module.exports)module.exports={closureBanner:closureBanner,isClosureRecord:isClosureRecord,isActiveWindow:isActiveWindow,isCountedClosure:isCountedClosure,agencyWords:agencyWords,roadKeyName:roadKeyName,recordRouteKey:recordRouteKey,closureKind:closureKind,closureScope:closureScope,closureKindOf:closureKindOf,closureDetail:closureDetail,closureDetailOf:closureDetailOf,fullText:fullText,timingGap:timingGap,feedHealth:feedHealth,recordText:recordText,timingState:timingState,isCurrentReport:isCurrentReport,isFullClosure:isFullClosure,zoneFor:zoneFor,agencyFor:agencyFor,sourceOf:sourceOf,whenIn:whenIn,clockIn:clockIn,timingText:timingText,reportTag:reportTag,mileText:mileText,ROAD_AGENCY:ROAD_AGENCY,ROAD_ZONE:ROAD_ZONE};
// road-status.js end
