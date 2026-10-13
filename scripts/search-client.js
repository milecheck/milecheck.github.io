// search-client.js — the browser half of /search/ and 404.html. Inlined into both pages by
// scripts/gen-search-page.mjs (edit here, then run: node scripts/gen-search-page.mjs).
// No dependencies. Reads /search-index.json ({u,t,h,d,s,l} per page).
//
// How a query is read:
//  1. Normalize: lowercase, strip accents, punctuation to spaces.
//  2. Routes become one token on both sides: "I-90", "i90", "interstate 90" -> i90;
//     "US 2" -> us2; "SR 20", "state route 20" -> sr20.
//  3. Cities and states are found as phrases (longest first) and become place tokens.
//     A city that has its own page stays a plain word; a city with no page of its own
//     turns into its state, so "denver" lands on Colorado.
//  4. Stop words drop out. Soft words (road, conditions) count if present but are never required.
//  5. Every remaining token must match (AND). Intent boosts then add to the score:
//     a route -> its corridor page, "chains" -> /chains/, a state -> its hub pages,
//     "mile marker 147 i-84" -> the mile marker map plus a card.
//  6. Nothing matched everything -> closest partial matches, then the state hubs, then the hubs.
(function () {
var IDX = null, Q = document.getElementById('q'), R = document.getElementById('results'), C = document.getElementById('count'), CH = document.getElementById('chips'), sec = '';
var STOP = {the:1,a:1,an:1,of:1,in:1,on:1,for:1,to:1,and:1,is:1,are:1,my:1,near:1,me:1,now:1,live:1,current:1,open:1,opened:1,closed:1,today:1,right:1,tonight:1,what:1,whats:1,how:1,can:1,do:1,does:1,it:1,there:1,any:1,or:1,at:1,by:1,from:1,with:1,about:1,show:1,find:1,get:1,go:1,going:1,drive:1,driving:1,status:1,update:1,updates:1,latest:1,rn:1};
var SOFT = {road:1,roads:1,conditions:1,condition:1,traffic:1};
var SYN = {cams:'cameras',cam:'cameras',camera:'cameras',webcam:'cameras',webcams:'cameras',closure:'closures',mp:'mile',milepost:'mile',mileposts:'mile',mm:'mile',markers:'marker',hwy:'highway',hwys:'highway',freeway:'highway',passes:'pass',mountain:'pass',snow:'pass',chain:'chains',bridge:'drawbridge',bridges:'drawbridge',borders:'border',crossing:'border'};
// name|code, lowercase. Provinces included because the site has pages for them.
var STATES = 'alabama|al,alaska|ak,arizona|az,arkansas|ar,california|ca,colorado|co,connecticut|ct,delaware|de,florida|fl,georgia|ga,hawaii|hi,idaho|id,illinois|il,indiana|in,iowa|ia,kansas|ks,kentucky|ky,louisiana|la,maine|me,maryland|md,massachusetts|ma,michigan|mi,minnesota|mn,mississippi|ms,missouri|mo,montana|mt,nebraska|ne,nevada|nv,new hampshire|nh,new jersey|nj,new mexico|nm,new york|ny,north carolina|nc,north dakota|nd,ohio|oh,oklahoma|ok,oregon|or,pennsylvania|pa,rhode island|ri,south carolina|sc,south dakota|sd,tennessee|tn,texas|tx,utah|ut,vermont|vt,virginia|va,washington|wa,west virginia|wv,wisconsin|wi,wyoming|wy,british columbia|bc,alberta|ab,manitoba|mb,ontario|on,quebec|qc';
// Codes that are also everyday words: only read as a state when they end the query ("i5 or", "denver, co").
var AMBIG = {or:1,in:1,me:1,hi:1,ok:1,id:1,la:1,de:1,pa:1,al:1,ma:1,oh:1,co:1,on:1,ar:1,mo:1,ne:1};
// city|state code. The biggest US cities plus every city that has its own page on the site
// (checked against the index at load; any /cameras/<city>/ page missing here is added with no state).
var CITIES = 'new york city|NY,los angeles|CA,chicago|IL,houston|TX,phoenix|AZ,philadelphia|PA,san antonio|TX,san diego|CA,dallas|TX,san jose|CA,austin|TX,jacksonville|FL,fort worth|TX,columbus|OH,charlotte|NC,san francisco|CA,indianapolis|IN,seattle|WA,denver|CO,washington dc|DC,boston|MA,el paso|TX,nashville|TN,detroit|MI,oklahoma city|OK,portland|OR,las vegas|NV,memphis|TN,louisville|KY,baltimore|MD,milwaukee|WI,albuquerque|NM,tucson|AZ,fresno|CA,sacramento|CA,kansas city|MO,atlanta|GA,omaha|NE,colorado springs|CO,raleigh|NC,miami|FL,virginia beach|VA,oakland|CA,minneapolis|MN,tulsa|OK,wichita|KS,new orleans|LA,cleveland|OH,tampa|FL,honolulu|HI,orlando|FL,pittsburgh|PA,cincinnati|OH,st louis|MO,saint louis|MO,salt lake city|UT,boise|ID,spokane|WA,tacoma|WA,reno|NV,anchorage|AK,billings|MT,bozeman|MT,missoula|MT,cheyenne|WY,fargo|ND,sioux falls|SD,des moines|IA,little rock|AR,birmingham|AL,buffalo|NY,providence|RI,hartford|CT,newark|NJ,albany|NY,burlington|VT,manchester|NH,richmond|VA,jackson|MS,charleston|SC,savannah|GA,madison|WI,lincoln|NE,bakersfield|CA,vancouver|BC,calgary|AB,edmonton|AB,winnipeg|MB,toronto|ON,ottawa|ON,montreal|QC,quebec city|QC';
// Which states each corridor page runs through (the corridor titles carry no state name).
var CORR = {i4:'FL',i5:'WA OR CA',i10:'CA AZ NM TX LA MS AL FL',i15:'CA NV AZ UT ID MT',i20:'TX LA MS AL GA SC',i35:'TX OK KS MO IA MN',i40:'CA AZ NM TX OK AR TN NC',i65:'AL TN KY IN',i70:'UT CO KS MO IL IN OH WV PA MD',i75:'FL GA TN KY OH MI',i80:'CA NV UT WY NE IA IL IN OH PA NJ',i81:'TN VA WV MD PA NY',i90:'WA ID MT WY SD MN WI IL IN OH PA NY MA',i94:'MT ND MN WI IL IN MI',i95:'FL GA SC NC VA MD DE PA NJ NY CT RI MA NH ME'};
var HUBS = [['/road-conditions/','Road conditions by state','Closures, crashes and cameras for every state.'],['/cameras/','Cameras by state','Live highway cameras, 40+ states and provinces.'],['/maps/mile-markers/','Mile marker map','Browse mileposts in all 50 states.'],['/corridors/','Interstate corridors','Cameras and conditions along I-5, I-90, I-95 and more.']];
var NAME2CODE = {}, CODE2NAME = {}, STATE_LIST = [], CITY2CODE = {}, CITY_LIST = [];
STATES.split(',').forEach(function (x) { var a = x.split('|'); NAME2CODE[a[0]] = a[1]; CODE2NAME[a[1]] = a[0]; STATE_LIST.push(a[0]); });
CITIES.split(',').forEach(function (x) { var a = x.split('|'); CITY2CODE[a[0]] = a[1].toLowerCase(); CITY_LIST.push(a[0]); });
function byLen(a, b) { return b.length - a.length; }
STATE_LIST.sort(byLen); CITY_LIST.sort(byLen);

function norm(s) { return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’'"]/g, '').replace(/[^a-z0-9਀-੿]+/g, ' ').trim(); }
// i90 / us2 / sr20 as single tokens, from "I-90", "i 90", "interstate 90", "US Route 2", "state route 20".
function canonRoutes(s) {
  return s.replace(/\binterstate\s*(\d{1,3}[ew]?)\b/g, ' i$1 ')
    .replace(/\bi\s*(\d{1,3}[ew]?)\b/g, ' i$1 ')
    .replace(/\b(?:us|u s)\s*(?:highway|route|rt)?\s*(\d{1,3}[a-z]?)\b/g, ' us$1 ')
    .replace(/\b(?:sr|state route|state highway|state road)\s*(\d{1,3})\b/g, ' sr$1 ')
    .replace(/\s+/g, ' ').trim();
}
var ROUTE_RE = /^(i|us|sr)\d{1,3}[a-z]?$/;
function isRoute(w) { return ROUTE_RE.test(w); }
function words(s) {
  return canonRoutes(norm(s)).split(' ').filter(function (w) { return w && !STOP[w]; }).map(function (w) { return SYN[w] || w; });
}
// States named in a piece of text (longest names first, so "west virginia" is not also "virginia").
function statesIn(text) {
  var t = ' ' + norm(text) + ' ', out = {}, any = false;
  for (var i = 0; i < STATE_LIST.length; i++) {
    var n = STATE_LIST[i];
    if (n.length < 3) continue;
    var k = ' ' + n + ' ';
    if (t.indexOf(k) >= 0) { out[n] = 1; any = true; t = t.split(k).join(' '); }
  }
  return any ? out : null;
}
function dashed(r) { return r.replace(/^([a-z]+)(\d)/, '$1-$2'); }

// ---- query parsing ----
function parseQuery(raw) {
  var s = canonRoutes(norm(raw)), t = ' ' + s + ' ', toks = [], i, k;
  var mileIntent = /\b(mile ?markers?|mile ?posts?|milepost|mm|mp|mile)\b/.test(s) && (/\b\d{1,4}\b/.test(s) || /\b(i|us|sr)\d/.test(s)) && /\b(mile|mm|mp|milepost|marker|markers|post)/.test(s);
  var mileNum = (s.match(/\b(?:mile ?markers?|mile ?posts?|milepost|mm|mp|mile)\s*(\d{1,4}(?: \d)?)\b/) || [])[1];
  // phrases first: cities, then states
  var marks = {};
  for (i = 0; i < CITY_LIST.length; i++) { k = ' ' + CITY_LIST[i] + ' '; if (t.indexOf(k) >= 0) { t = t.split(k).join(' @c' + CITY_LIST[i].replace(/ /g, '_') + ' '); } }
  for (i = 0; i < STATE_LIST.length; i++) { if (STATE_LIST[i].length < 3) continue; k = ' ' + STATE_LIST[i] + ' '; if (t.indexOf(k) >= 0) { t = t.split(k).join(' @s' + STATE_LIST[i].replace(/ /g, '_') + ' '); } }
  var ws = t.trim().split(/\s+/).filter(Boolean);
  for (i = 0; i < ws.length; i++) {
    var w = ws[i];
    if (w.charAt(0) === '@') {
      if (w.charAt(1) === 'c') { var cn = w.slice(2).replace(/_/g, ' '); toks.push({k: 'c', v: cn, st: CODE2NAME[CITY2CODE[cn]] || ''}); }
      else toks.push({k: 's', v: w.slice(2).replace(/_/g, ' ')});
      continue;
    }
    if (STOP[w] && !(AMBIG[w] && i === ws.length - 1 && ws.length > 1 && CODE2NAME[w])) continue;
    if (CODE2NAME[w] && w.length === 2) {
      if (!AMBIG[w] || (i === ws.length - 1 && ws.length > 1)) { toks.push({k: 's', v: CODE2NAME[w]}); continue; }
    }
    if (isRoute(w)) { toks.push({k: 'r', v: w}); continue; }
    if (mileIntent && /^\d+$/.test(w)) continue;
    w = SYN[w] || w;
    toks.push({k: 'w', v: w, soft: !!SOFT[w] || (mileIntent && (w === 'mile' || w === 'marker'))});
  }
  return {toks: toks, mile: mileIntent, mileNum: mileNum, raw: raw};
}

// A city with a page of its own stays a word. A city with none becomes its state.
function resolveCities(q, asState) {
  var out = [], hasPlace = false;
  q.toks.forEach(function (t) {
    if (t.k === 'c') {
      var ph = ' ' + t.v + ' ';
      var has = IDX.some(function (p) { return p._ft.indexOf(ph) >= 0; });
      if (has && !asState) { t.v.split(' ').forEach(function (w) { out.push({k: 'w', v: w, city: t.st}); }); if (t.st) q.softState = t.st; }
      else if (t.st) { out.push({k: 's', v: t.st, viaCity: true}); }
      else out.push({k: 'w', v: t.v});
    } else out.push(t);
  });
  q.toks = out;
  // soft words that stand alone are not soft
  if (!out.some(function (t) { return !t.soft; })) out.forEach(function (t) { t.soft = false; });
  q.states = {}; q.routes = []; q.wordsSet = {};
  out.forEach(function (t) { if (t.k === 's') q.states[t.v] = 1; else if (t.k === 'r') q.routes.push(t.v); else q.wordsSet[t.v] = 1; });
  q.hasState = Object.keys(q.states).length > 0;
}

// ---- scoring ----
function fieldScore(fw, qw, exact) { var best = 0; for (var i = 0; i < fw.length; i++) { var f = fw[i]; if (f === qw) return 2; if (!exact && f.indexOf(qw) === 0 && qw.length >= 3) best = Math.max(best, 1); } return best; }
function tokScore(p, t) {
  if (t.k === 'w') return fieldScore(p._t, t.v) * 4 + fieldScore(p._h, t.v) * 2.5 + fieldScore(p._u, t.v) * 2 + fieldScore(p._d, t.v);
  if (t.k === 'r') return fieldScore(p._t, t.v, 1) * 4 + fieldScore(p._h, t.v, 1) * 2.5 + fieldScore(p._u, t.v, 1) * 2 + fieldScore(p._d, t.v, 1);
  if (t.k === 's') { if (p._ts[t.v]) return 8; if (p._is[t.v]) return 3; if (p._ds[t.v]) return 2; return 0; }
  return 0;
}
function pageScore(p, q, partial) {
  var total = 0, any = false;
  for (var i = 0; i < q.toks.length; i++) {
    var t = q.toks[i], s = tokScore(p, t);
    if (s) { any = true; total += t.soft ? s * 0.5 : s; }
    else if (!t.soft && !partial) return 0;
  }
  if (!any) return 0;
  if (p.l === 'en') total += 0.5;
  return total;
}
function boost(p, q) {
  var b = 0, u = p.u, i, st;
  for (i = 0; i < q.routes.length; i++) {
    var d = dashed(q.routes[i]);
    if (u === '/corridors/' + d + '/') b += 1000;
    else if (u.indexOf('/corridors/' + d + '/') === 0) b += 40;
  }
  if (q.wordsSet.chains) { if (u === '/chains/') b += 150; else if (u === '/chains-required-explained/') b += 20; }
  if (q.wordsSet.closures && !q.hasState && u === '/closures/') b += 8;
  if (q.mile && u === '/maps/mile-markers/') b += 500;
  if (q.hasState) {
    for (st in q.states) {
      var slug = st.replace(/ /g, '-');
      if (u === '/road-conditions/' + slug + '/') b += 30;
      else if (u === '/cameras/' + slug + '/') b += q.wordsSet.cameras ? 40 : 8;
      else if (u === '/blog/mile-markers-' + slug + '.html' || u === '/blog/km-markers-' + slug + '.html') b += q.wordsSet.mile || q.mile ? 40 : 4;
      else if (u.indexOf('/corridors/') === 0 && p._is[st]) b += 25;
    }
  }
  return b;
}
function relevantToStates(p, q) {
  if (!q.hasState) return true;
  var explicit = Object.keys(p._ts);
  if (!explicit.length) return true;
  for (var st in q.states) if (p._ts[st]) return true;
  return false;
}
function search(q) {
  var hits = [], i, p, base, b, sc;
  for (i = 0; i < IDX.length; i++) {
    p = IDX[i];
    if (sec && p.s !== sec) continue;
    if (!relevantToStates(p, q)) continue;
    base = pageScore(p, q, false); b = boost(p, q);
    if (base && p._nts >= 3 && q.hasState) base *= 0.6;
    sc = base + b;
    if (sc > 0) hits.push([sc, p, base]);
  }
  hits.sort(function (a, c) { return c[0] - a[0] || a[1].u.localeCompare(c[1].u); });
  return hits;
}
function partialSearch(q) {
  var hits = [];
  for (var i = 0; i < IDX.length; i++) {
    var p = IDX[i];
    if (sec && p.s !== sec) continue;
    var s = pageScore(p, q, true);
    if (s > 0) hits.push([s, p]);
  }
  hits.sort(function (a, c) { return c[0] - a[0] || a[1].u.localeCompare(c[1].u); });
  return hits;
}
// Only pages whose own words name the thing count for a single-city query's "related" list.
function relatedForCity(q) {
  var st = q.softState; if (!st || q.toks.length !== q.toks.filter(function (t) { return t.city; }).length) return [];
  var slug = st.replace(/ /g, '-'), out = [];
  IDX.forEach(function (p) { if (p.u === '/road-conditions/' + slug + '/') out.push([6, p]); else if (p.u === '/cameras/' + slug + '/') out.push([5, p]); });
  return out;
}

// ---- rendering ----
function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]; }); }
function hlPatterns(q) {
  var out = [];
  q.toks.forEach(function (t) {
    if (t.soft) return;
    var v = t.v.replace(/[.*+?^$()|[\]\\{}]/g, '\\$&');
    if (t.k === 'r') { var m = /^([a-z]+)(\d.*)$/.exec(t.v); out.push('\\b' + (m[1] === 'i' ? '(?:i|interstate)' : m[1]) + '[- ]?' + m[2] + '(?!\\d)'); }
    else if (t.k === 's') out.push(v);
    else if (t.k === 'w' && t.v.length > 1) out.push(v);
  });
  return out;
}
function hl(s, pats) { var e = esc(s); if (!pats.length) return e; try { return e.replace(new RegExp('(' + pats.join('|') + ')', 'ig'), '<mark>$1</mark>'); } catch (x) { return e; } }
function hitHtml(p, pats) {
  return '<a class="hit" href="' + esc(p.u) + '"><div class="sec">' + esc(p.s) + (p.l !== 'en' ? '<span class="lg">' + esc(p.l.toUpperCase()) + '</span>' : '') + '</div><h2>' + hl(p.t, pats) + '</h2>' + (p.d ? '<p>' + hl(p.d, pats) + '</p>' : '') + '<div class="u">milecheckapp.com' + esc(p.u) + '</div></a>';
}
function mileCard(q) {
  var rt = q.routes.length ? dashed(q.routes[0]).toUpperCase() : '';
  var what = 'Mile marker' + (q.mileNum ? ' ' + esc(q.mileNum) : '') + (rt ? ' on ' + esc(rt) : '');
  return '<a class="card" href="/maps/mile-markers/"><div class="sec">Mile marker map</div><h2>' + what + '</h2><p>Open the 50-state mile marker map' + (rt ? ', find ' + esc(rt) + ' and tap a marker to read its number' : ' and tap a marker to read its number') + '. The map does not take a route or mile in the link yet.</p><div class="u">milecheckapp.com/maps/mile-markers/</div></a>';
}
function stateHubs(q, skip) {
  var out = [];
  for (var st in q.states) {
    var slug = st.replace(/ /g, '-');
    ['/road-conditions/' + slug + '/', '/cameras/' + slug + '/', '/blog/mile-markers-' + slug + '.html'].forEach(function (u) {
      if (skip[u]) return;
      for (var i = 0; i < IDX.length; i++) if (IDX[i].u === u) { out.push(IDX[i]); skip[u] = 1; return; }
    });
  }
  return out;
}
function hubCards() { return HUBS.map(function (h) { return '<a class="hit" href="' + h[0] + '"><div class="sec">Start here</div><h2>' + esc(h[1]) + '</h2><p>' + esc(h[2]) + '</p></a>'; }).join(''); }

function render() {
  if (!IDX) return;
  var raw = Q.value.trim();
  if (!raw) { C.textContent = ''; R.innerHTML = ''; return; }
  var q = parseQuery(raw); resolveCities(q);
  if (q.softState && q.toks.length > 1 && !search(q).some(function (h) { return h[2] > 0; })) { q = parseQuery(raw); resolveCities(q, true); }
  var pats = hlPatterns(q), html = '', shown = {}, n = 0;
  var card = (q.mile && !sec) ? mileCard(q) : '';
  var hits = q.toks.length ? search(q) : [];
  if (!hits.length && q.toks.length) hits = relatedForCity(q);
  else if (hits.length && q.softState) {
    var seen = {}; hits.forEach(function (h) { seen[h[1].u] = 1; });
    relatedForCity(q).forEach(function (h) { if (!seen[h[1].u]) hits.push(h); });
  }
  if (card) hits = hits.filter(function (h) { return h[1].u !== '/maps/mile-markers/'; });
  if (hits.length) {
    C.textContent = hits.length + (hits.length === 1 ? ' page' : ' pages') + ' for “' + raw + '”' + (sec ? ' in ' + sec : '');
    hits.slice(0, 40).forEach(function (h) { html += hitHtml(h[1], pats); shown[h[1].u] = 1; n++; });
  } else {
    var part = q.toks.length ? partialSearch(q) : [];
    var extra = stateHubs(q, shown);
    if (part.length) {
      C.textContent = 'No page matches every word in “' + raw + '”. Closest pages:';
      part.slice(0, 8).forEach(function (h) { html += hitHtml(h[1], pats); shown[h[1].u] = 1; n++; });
      extra = stateHubs(q, shown);
    } else if (extra.length) C.textContent = 'Nothing matched “' + raw + '” word for word. Here is what we have for ' + Object.keys(q.states).join(', ') + ':';
    else C.textContent = card ? '' : 'Nothing matched “' + raw + '”. Try a state, a city, a highway like I-90, or start from one of these:';
    extra.forEach(function (p) { html += hitHtml(p, pats); n++; });
    if (!n && !card) html += hubCards();
  }
  R.innerHTML = card + html;
  try { if (window.gtag && raw) gtag('event', 'site_search', {search_term: raw, results: n}); } catch (x) {}
}
function go() { var q = Q.value.trim(); var u = new URL(location.href); if (q) u.searchParams.set('q', q); else u.searchParams.delete('q'); history.replaceState(null, '', u); render(); }
var t = null; Q.addEventListener('input', function () { clearTimeout(t); t = setTimeout(go, 120); });
document.getElementById('sf').addEventListener('submit', function (e) { e.preventDefault(); go(); });
if (CH) CH.addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; sec = (sec === b.getAttribute('data-sec')) ? '' : b.getAttribute('data-sec'); Array.prototype.forEach.call(CH.querySelectorAll('button'), function (x) { x.setAttribute('aria-pressed', x.getAttribute('data-sec') === sec ? 'true' : 'false'); }); render(); });
var seed = new URLSearchParams(location.search).get('q') || window.__seedQuery || ''; if (seed) Q.value = seed;
fetch('/search-index.json', {cache: 'no-cache'}).then(function (r) { return r.json(); }).then(function (j) {
  IDX = j.pages.map(function (p) {
    p._t = words(p.t); p._h = words(p.h); p._d = words(p.d);
    p._u = words(p.u.replace(/[\/-]/g, ' ').replace(/\.html$/, ''));
    p._ft = ' ' + norm(p.t + ' ' + p.h + ' ' + p.u.replace(/[\/-]/g, ' ')) + ' ';
    p._ts = statesIn(p.t + ' ' + p.h + ' ' + p.u.replace(/[\/-]/g, ' ')) || {};
    p._ds = statesIn(p.d) || {};
    p._is = {};
    var m = /^\/corridors\/(i-\d+)\/$/.exec(p.u);
    if (m && CORR[m[1].replace('-', '')]) CORR[m[1].replace('-', '')].split(' ').forEach(function (c) { p._is[CODE2NAME[c.toLowerCase()]] = 1; });
    if (p.s === 'Passes') p._t.concat(p._h).forEach(function (w) { if (CORR[w]) CORR[w].split(' ').forEach(function (c) { p._is[CODE2NAME[c.toLowerCase()]] = 1; }); });
    p._nts = Object.keys(p._ts).length;
    return p;
  });
  // cities that have their own camera page but are not in the table above
  IDX.forEach(function (p) { var m = /^\/cameras\/([a-z-]+)\/$/.exec(p.u); if (m) { var n = m[1].replace(/-/g, ' '); if (!NAME2CODE[n] && !CITY2CODE[n]) { CITY2CODE[n] = ''; CITY_LIST.push(n); } } });
  CITY_LIST.sort(byLen);
  render();
}).catch(function () { C.textContent = 'The search index did not load. Try the links below.'; });
Q.focus();
})();
