#!/usr/bin/env node
// add-related-links.mjs — a small "Nearby on MileCheck" link block on road pages, to raise
// pages per visit (1.36 on 2026-10-13). Derived from data, nothing hand-listed per page:
//   passes/      state + route parsed from scripts/gen-pass-pages.js
//   corridors/   state list parsed from scripts/gen-corridor-pages.js
//   cameras/, road-conditions/, bridges/   state = the directory name
//   blog/mile-markers-<state>.html         state = the file name
//   closures/<slug>/                       state = addressRegion in the page's JSON-LD
//   cameras/<city>/                        state = the city's state in scripts/gen-city-camera-pages.js
//   blog/km-markers-<province>.html        province = the file name
//   blog/highway-report-<month>-states/    each state's page in the newest monthly report
// Same state first, then same route across states. Only pages that exist on disk are linked.
// Block sits between <!-- related:start --> and <!-- related:end -->, just before the signup
// band, else before </main>, else before the footer. Idempotent: strips its own block and
// re-inserts it in the same place, so a second run writes nothing.
// Run before add-signup-band.mjs. Optional: --skip-file=path (list of files to leave alone).
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';

const skipArg = process.argv.find(a => a.startsWith('--skip-file='));
const SKIP = new Set(skipArg ? readFileSync(skipArg.slice(12), 'utf8').split('\n').filter(Boolean) : []);

const ST = { AL:'alabama',AK:'alaska',AZ:'arizona',AR:'arkansas',CA:'california',CO:'colorado',CT:'connecticut',DE:'delaware',FL:'florida',GA:'georgia',HI:'hawaii',ID:'idaho',IL:'illinois',IN:'indiana',IA:'iowa',KS:'kansas',KY:'kentucky',LA:'louisiana',ME:'maine',MD:'maryland',MA:'massachusetts',MI:'michigan',MN:'minnesota',MS:'mississippi',MO:'missouri',MT:'montana',NE:'nebraska',NV:'nevada',NH:'new-hampshire',NJ:'new-jersey',NM:'new-mexico',NY:'new-york',NC:'north-carolina',ND:'north-dakota',OH:'ohio',OK:'oklahoma',OR:'oregon',PA:'pennsylvania',RI:'rhode-island',SC:'south-carolina',SD:'south-dakota',TN:'tennessee',TX:'texas',UT:'utah',VT:'vermont',VA:'virginia',WA:'washington',WV:'west-virginia',WI:'wisconsin',WY:'wyoming' };
// Neighboring states (shared land border), so a driver crossing a line finds the next state.
const NB_RAW = 'WA:OR,ID|OR:WA,ID,CA,NV|CA:OR,NV,AZ|NV:CA,OR,ID,UT,AZ|ID:WA,OR,NV,UT,WY,MT|MT:ID,WY,SD,ND|WY:MT,SD,NE,CO,UT,ID|UT:ID,WY,CO,AZ,NV|AZ:CA,NV,UT,NM|CO:WY,NE,KS,OK,NM,UT|NM:AZ,CO,OK,TX|ND:MT,SD,MN|SD:ND,MN,IA,NE,WY,MT|NE:SD,IA,MO,KS,CO,WY|KS:NE,MO,OK,CO|OK:KS,MO,AR,TX,NM,CO|TX:NM,OK,AR,LA|MN:ND,SD,IA,WI|IA:MN,WI,IL,MO,NE,SD|MO:IA,IL,KY,TN,AR,OK,KS,NE|AR:MO,TN,MS,LA,TX,OK|LA:AR,MS,TX|WI:MN,IA,IL,MI|IL:WI,IA,MO,KY,IN|MI:WI,IN,OH|IN:MI,IL,KY,OH|OH:MI,IN,KY,WV,PA|KY:IL,IN,OH,WV,VA,TN,MO|TN:KY,VA,NC,GA,AL,MS,AR,MO|MS:TN,AL,LA,AR|AL:TN,GA,FL,MS|GA:TN,NC,SC,FL,AL|FL:GA,AL|SC:NC,GA|NC:VA,TN,GA,SC|VA:MD,WV,KY,TN,NC|WV:OH,PA,MD,VA,KY|MD:PA,DE,VA,WV|DE:PA,NJ,MD|PA:NY,NJ,DE,MD,WV,OH|NJ:NY,PA,DE|NY:VT,MA,CT,NJ,PA|CT:NY,MA,RI|RI:CT,MA|MA:NH,VT,NY,CT,RI|VT:NH,MA,NY|NH:ME,VT,MA|ME:NH';
const NB_PROV = 'british-columbia:alberta,washington,idaho,montana|alberta:british-columbia,montana|manitoba:north-dakota,minnesota|ontario:michigan,new-york,minnesota|quebec:new-york,vermont,maine';
const NB = {}; for (const part of NB_RAW.split('|')) { const [k, v] = part.split(':'); NB[ST[k]] = v.split(',').map(x => ST[x]); }
for (const part of NB_PROV.split('|')) { const [k, v] = part.split(':'); NB[k] = v.split(','); }
const slugOfName = n => n.toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '');

const dirs = d => existsSync(d) ? readdirSync(d, { withFileTypes: true }).filter(e => e.isDirectory()).map(e => e.name) : [];
const page = (...parts) => { const p = parts.join('/'); return existsSync(p) ? p : null; };

// ---- nodes: { file, url, type, states:[slug], route }
const nodes = [];
const add = n => { if (n.file && existsSync(n.file)) nodes.push(n); };
const CITY_STATE = {};
if (existsSync('scripts/gen-city-camera-pages.js'))
  for (const m of readFileSync('scripts/gen-city-camera-pages.js', 'utf8').matchAll(/slug:'([^']+)', name:'[^']*', state:'([A-Z]{2})'/g)) CITY_STATE[m[1]] = ST[m[2]];
for (const s of dirs('cameras')) add(CITY_STATE[s]
  ? { file: `cameras/${s}/index.html`, url: `/cameras/${s}/`, type: 'cameras', states: [CITY_STATE[s]], city: true }
  : { file: `cameras/${s}/index.html`, url: `/cameras/${s}/`, type: 'cameras', states: [s] });
for (const s of dirs('road-conditions')) add({ file: `road-conditions/${s}/index.html`, url: `/road-conditions/${s}/`, type: 'conditions', states: [s] });
for (const s of dirs('bridges')) add({ file: `bridges/${s}/index.html`, url: `/bridges/${s}/`, type: 'bridges', states: [s] });
for (const f of readdirSync('blog')) { const m = f.match(/^(?:mile|km)-markers-(.+)\.html$/); if (m) add({ file: `blog/${f}`, url: `/blog/${f}`, type: 'guide', states: [m[1]] }); }
const MONTHS = ['january','february','march','april','may','june','july','august','september','october','november','december'];
const reportDirs = dirs('blog').map(d => d.match(/^highway-report-([a-z]+)-(\d{4})-states$/)).filter(m => m && MONTHS.includes(m[1]))
  .sort((a, b) => (+b[2] - +a[2]) || (MONTHS.indexOf(b[1]) - MONTHS.indexOf(a[1])));
const titleCase = w => w.split('-').map(x => x[0].toUpperCase() + x.slice(1)).join(' ');
if (reportDirs.length) {
  const [dir, mon, yr] = reportDirs[0];
  for (const f of readdirSync(`blog/${dir}`)) {
    const m = f.match(/^([a-z-]+)\.html$/); if (!m || f === 'index.html') continue;
    add({ file: `blog/${dir}/${f}`, url: `/blog/${dir}/${f}`, type: 'report', states: [m[1]], noBlock: true,
      fixedTitle: `${titleCase(m[1])} road report, ${titleCase(mon)} ${yr}` });
  }
}
const passSrc = readFileSync('scripts/gen-pass-pages.js', 'utf8');
for (const m of passSrc.matchAll(/slug: '([^']+)', name: '[^']*', route: '([^']+)', state: '([^']+)'/g))
  add({ file: `passes/${m[1]}/index.html`, url: `/passes/${m[1]}/`, type: 'pass', states: [ST[m[3]]].filter(Boolean), route: m[2] });
const corSrc = readFileSync('scripts/gen-corridor-pages.js', 'utf8');
for (const m of corSrc.matchAll(/slug: '([^']+)', name: '([^']+)', num: \d+, states: \[([^\]]*)\]/g))
  add({ file: `corridors/${m[1]}/index.html`, url: `/corridors/${m[1]}/`, type: 'corridor', route: m[2],
    states: [...m[3].matchAll(/'([A-Z]{2})'/g)].map(x => ST[x[1]]).filter(Boolean) });
for (const s of dirs('closures')) {
  const f = `closures/${s}/index.html`; if (!existsSync(f)) continue;
  const r = readFileSync(f, 'utf8').match(/"addressRegion":"([^"]+)"/);
  add({ file: f, url: `/closures/${s}/`, type: 'closure', states: r ? [slugOfName(r[1])] : [] });
}

// hubs (most of the traffic): link out to the busiest specific pages. The slug lists are the
// one hand-picked input (big, high-traffic states and interstates); anything missing on disk drops out.
const HUBS = { 'closures/index.html': '/closures/', 'maps/mile-markers/index.html': '/maps/mile-markers/', 'maps/index.html': '/maps/', 'cameras/index.html': '/cameras/', 'bridges/index.html': '/bridges/' };
for (const [file, url] of Object.entries(HUBS)) add({ file, url, type: 'hub', states: [] });
const BIG = ['washington', 'california', 'colorado', 'texas', 'oregon', 'montana'];
const BIGC = ['i-90', 'i-80', 'i-5', 'i-70', 'i-95'];

// ---- titles
const unesc = s => s.replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function shortTitle(file) {
  const m = readFileSync(file, 'utf8').match(/<title>([^<]*)<\/title>/); if (!m) return null;
  let t = unesc(m[1]).replace(/\s*\|\s*MileCheck\s*$/, '');
  t = t.split(' | ')[0].split(':')[0].split(' — ')[0].split(' – ')[0].replace(/\s*\([^)]*\)\s*$/, '').trim();
  if (t.length > 58) t = t.slice(0, 57).replace(/\s+\S*$/, '') + '…';
  return t || null;
}
for (const n of nodes) {
  n.title = shortTitle(n.file);
  if (n.type === 'corridor') n.title = `${n.route} cameras and road conditions`;
  if (n.fixedTitle) n.title = n.fixedTitle;
  if (n.title && /unconfirmed/i.test(n.title)) n.title = null; // placeholder title: never a link
}

// ---- relations
const by = (type, pred = () => true) => nodes.filter(n => n.type === type && pred(n));
const first = (type, s) => by(type, n => n.states.includes(s));
function related(n) {
  const out = [], seen = new Set([n.url]);
  const push = (...xs) => { for (const x of xs.flat()) if (x && x.title && !seen.has(x.url)) { seen.add(x.url); out.push(x); } };
  const s = n.states[0];
  const sameState = type => n.states.flatMap(st => first(type, st));
  const sameRoute = by('corridor', c => n.route && c.route === n.route);
  const corridorsHere = by('corridor', c => n.states.some(st => c.states.includes(st)));
  const passesHere = by('pass', p => p !== n && n.states.some(st => p.states.includes(st)));
  const passesRoute = by('pass', p => p !== n && n.route && p.route === n.route);
  if (n.type === 'hub') {
    const h = n.url, byUrl = u => nodes.find(x => x.url === u);
    const rc = BIG.map(b => byUrl(`/road-conditions/${b}/`)), cam = BIG.map(b => byUrl(`/cameras/${b}/`));
    const cor = BIGC.map(c => byUrl(`/corridors/${c}/`)), clo = []; // incident pages: titles assert a closure and go stale, never a link target
    const mm = BIG.map(b => byUrl(`/blog/mile-markers-${b}.html`)), br = byUrl('/bridges/washington/');
    if (h === '/closures/') push(rc.slice(0, 3), cor.slice(0, 2), clo, cam.slice(0, 1));
    else if (h === '/cameras/') push(rc.slice(0, 2), cam.slice(0, 2), cor.slice(0, 2), br, clo.slice(0, 1));
    else if (h === '/bridges/') push(br, cam.slice(0, 2), rc.slice(0, 2), clo.slice(0, 1));
    else push(rc.slice(0, 3), mm.slice(0, 2), cor.slice(0, 2), cam.slice(0, 1));
    return out.slice(0, 6);
  }
  switch (n.type) {
    case 'pass':
      push(first('cameras', s), sameRoute, first('conditions', s), passesHere.slice(0, 2), passesRoute.slice(0, 2), first('bridges', s), first('guide', s)); break;
    case 'cameras': {
      const stateCams = first('cameras', s).filter(c => !c.city), cities = first('cameras', s).filter(c => c.city && c !== n);
      if (n.city) push(stateCams, first('conditions', s), cities.slice(0, 2), corridorsHere.slice(0, 1), first('report', s), first('guide', s));
      else push(first('conditions', s), cities.slice(0, 2), passesHere.slice(0, 2), corridorsHere.slice(0, 2), first('bridges', s), first('report', s), first('guide', s));
      if (out.length < 3) push((NB[s] || []).slice(0, 2).flatMap(x => first('conditions', x)));
      break;
    }
    case 'conditions':
      push(first('cameras', s).filter(c => !c.city), (NB[s] || []).slice(0, 2).flatMap(x => first('conditions', x)), passesHere.slice(0, 2), corridorsHere.slice(0, 2), first('bridges', s), first('report', s), first('guide', s)); break;
    case 'bridges':
      push(first('cameras', s), first('conditions', s), passesHere.slice(0, 1), corridorsHere.slice(0, 2), first('guide', s)); break;
    case 'guide':
      push(first('cameras', s), first('conditions', s), passesHere.slice(0, 2), first('bridges', s), corridorsHere.slice(0, 2)); break;
    case 'corridor': {
      const share = c => c !== n ? c.states.filter(st => n.states.includes(st)).length : 0;
      push(passesRoute.slice(0, 2), n.states.slice(0, 3).map(st => first('cameras', st)),
        by('corridor', c => share(c) > 0).sort((a, b) => share(b) - share(a)).slice(0, 2), n.states.slice(0, 2).map(st => first('conditions', st))); break;
    }
    case 'closure':
      push(first('conditions', s), first('cameras', s), passesHere.slice(0, 1), first('guide', s)); break;
  }
  // Last resort for places with few pages (Hawaii has no camera page): the national maps.
  if (out.length < 3) push(nodes.find(x => x.url === '/maps/mile-markers/'), nodes.find(x => x.url === '/closures/'));
  return out.slice(0, 6);
}

// ---- block
const CSS = `.mc-related{max-width:760px;margin:32px auto;padding:0 16px;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;}
      .mc-related h2{font-size:13px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#00A86B;margin:0 0 10px;}
      .mc-related ul{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:8px;}
      .mc-related a{display:block;background:#fff;border:1px solid #E4EAE6;border-radius:10px;padding:11px 13px;font-size:14px;font-weight:600;line-height:1.35;color:#0F1419;text-decoration:none;overflow-wrap:anywhere;}
      .mc-related a:hover{border-color:#00A86B;color:#00A86B;}
      @media (max-width:520px){.mc-related ul{grid-template-columns:1fr;}}`;
const block = links => `<!-- related:start -->
  <section class="mc-related" aria-label="Nearby on MileCheck">
    <style>
      ${CSS}
    </style>
    <h2>Nearby on MileCheck</h2>
    <ul>
${links.map(l => `      <li><a href="${l.url}">${esc(l.title)}</a></li>`).join('\n')}
    </ul>
  </section>
<!-- related:end -->
`;
const STRIP = /[ \t]*<!-- related:start -->[\s\S]*?<!-- related:end -->\n?/;

let changed = 0, skipped = [], checked = 0;
for (const n of nodes) {
  if (n.noBlock) continue;
  if (SKIP.has(n.file)) { if (SKIP.has(n.file)) skipped.push(n.file); continue; }
  checked++;
  const o = readFileSync(n.file, 'utf8');
  let s = o.replace(STRIP, '');
  const links = related(n);
  if (links.length >= 3) {
    let at = s.search(/[ \t]*<!-- signup:start -->/);
    if (at < 0) at = s.search(/[ \t]*<\/main>/);
    if (at < 0) at = s.search(/[ \t]*<footer class="site-footer">/);
    if (at < 0) { console.error('no anchor:', n.file); continue; }
    s = s.slice(0, at) + '  ' + block(links) + s.slice(at);
  }
  if (s !== o) { writeFileSync(n.file, s); changed++; }
}
console.log(`related links: ${changed} changed, ${checked} pages checked${skipped.length ? `, ${skipped.length} skipped` : ''}`);
