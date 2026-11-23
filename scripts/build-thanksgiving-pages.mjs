#!/usr/bin/env node
// build-thanksgiving-pages.mjs — writes /thanksgiving/index.html and /thanksgiving/<state>/index.html
// for the 50 states + DC (2026-11-22). One template; the live parts (NWS alerts per day, DOT alert
// counts by route) are filled in the browser by /assets/thanksgiving-state.js.
// Static corridor facts come from scripts/thanksgiving/corridors.json, which --refresh-data rebuilds
// from the app repo (interstates = distinct I- routes in assets/data/mileposts_XX.json, passes =
// KNOWN_PASSES in constants/passCameras.ts, DOT names = STATE_DOT_URLS in constants/states.ts).
//   node scripts/build-thanksgiving-pages.mjs                  # write pages from the committed data
//   MC_APP=/path/to/app node scripts/build-thanksgiving-pages.mjs --refresh-data
// Header, nav and footer are copied from blog/thanksgiving-2026.html so the pages match the article.
// After a rebuild, run scripts/add-seo-fixes.mjs and scripts/link-jsonld.mjs (Organization JSON-LD) and revert any page
// outside thanksgiving/ that it touches; the other finish steps are already satisfied by this template.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(SITE, 'scripts', 'thanksgiving', 'corridors.json');
const BASE = 'https://milecheckapp.com';
const NAMES = { AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',CO:'Colorado',CT:'Connecticut',DE:'Delaware',DC:'District of Columbia',FL:'Florida',GA:'Georgia',HI:'Hawaii',ID:'Idaho',IL:'Illinois',IN:'Indiana',IA:'Iowa',KS:'Kansas',KY:'Kentucky',LA:'Louisiana',ME:'Maine',MD:'Maryland',MA:'Massachusetts',MI:'Michigan',MN:'Minnesota',MS:'Mississippi',MO:'Missouri',MT:'Montana',NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',NJ:'New Jersey',NM:'New Mexico',NY:'New York',NC:'North Carolina',ND:'North Dakota',OH:'Ohio',OK:'Oklahoma',OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',SD:'South Dakota',TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',VA:'Virginia',WA:'Washington',WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming' };
const CODES = Object.keys(NAMES).sort((a, b) => NAMES[a].localeCompare(NAMES[b]));
const DAYS = [['2026-11-24','Tue. Nov. 24'],['2026-11-25','Wed. Nov. 25'],['2026-11-26','Thu. Nov. 26 (Thanksgiving)'],['2026-11-27','Fri. Nov. 27'],['2026-11-28','Sat. Nov. 28'],['2026-11-29','Sun. Nov. 29'],['2026-11-30','Mon. Nov. 30']];
const slug = c => NAMES[c].toLowerCase().replace(/ /g, '-');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const has = p => fs.existsSync(path.join(SITE, p));
const iNum = r => parseInt(r.replace(/^[IH]-/, ''), 10);

// ---------- corridor data ----------
function refreshData(app) {
  const read = p => fs.readFileSync(path.join(app, p), 'utf8');
  // Washington and Oregon key their milepost files by state route number / route name, so their
  // interstates come from the app's route map instead (src/utils/routes.ts lists the same set).
  const OVERRIDE = { WA: ['I-5','I-82','I-90','I-182','I-205','I-405','I-705'], OR: ['I-5','I-82','I-84','I-105','I-205','I-405'],
    DC: ['I-66','I-295','I-395','I-695'], AK: [] };
  const interstates = {};
  for (const c of Object.keys(NAMES)) {
    if (OVERRIDE[c]) { interstates[c] = OVERRIDE[c]; continue; }
    const f = path.join(app, 'assets', 'data', `mileposts_${c}.json`);
    if (!fs.existsSync(f)) { interstates[c] = []; continue; }
    const j = JSON.parse(fs.readFileSync(f, 'utf8'));
    const names = Array.isArray(j) ? j.map(r => r.highway || r.route || '') : Object.keys(j);
    const set = new Set();
    for (const n of names) {
      const s = String(n).trim();
      let m = /^(?:I|IH|Interstate)[\s-]?0*(\d{1,3})([EWNS]?)$/i.exec(s); // business spurs (I-10B) excluded
      if (m) set.add('I-' + m[1] + m[2].toUpperCase());
      m = /^H-([1-3])$/.exec(s); // Hawaii's interstates are signed H-1, H-2, H-3
      if (m) set.add('H-' + m[1]);
    }
    interstates[c] = [...set].sort((a, b) => iNum(a) - iNum(b) || a.localeCompare(b));
  }
  const passSrc = read('constants/passCameras.ts');
  const passes = {};
  for (const m of passSrc.matchAll(/\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*state:\s*'([A-Z]{2})',\s*route:\s*'([^']+)'[^}]*\}/g)) {
    if (/offHighway:\s*true/.test(m[0])) continue;
    (passes[m[3]] ||= []).push({ id: m[1], name: m[2], route: m[4] });
  }
  const st = read('constants/states.ts');
  const seg = st.slice(st.indexOf('export const STATE_DOT_URLS'));
  const dots = {};
  for (const m of seg.slice(0, seg.indexOf('\n};')).matchAll(/\b([A-Z]{2}): \{ name: '([^']+)', url: '([^']+)'/g)) dots[m[1]] = { name: m[2], url: m[3] };
  const out = {};
  for (const c of CODES) out[c] = { interstates: interstates[c] || [], passes: passes[c] || [], dot: dots[c] || null };
  fs.mkdirSync(path.dirname(DATA), { recursive: true });
  fs.writeFileSync(DATA, JSON.stringify(out, null, 1) + '\n');
  console.log(`refreshed ${path.relative(SITE, DATA)} from ${app}`);
}
if (process.argv.includes('--refresh-data')) refreshData(process.env.MC_APP || path.resolve(SITE, '..'));
const CORR = JSON.parse(fs.readFileSync(DATA, 'utf8'));

// ---------- shared page parts, from the Thanksgiving article ----------
const tpl = fs.readFileSync(path.join(SITE, 'blog', 'thanksgiving-2026.html'), 'utf8');
const pick = (re, what) => { const m = tpl.match(re); if (!m) throw new Error(`template part missing: ${what}`); return m[0]; };
const ga = pick(/<!-- ga4 -->.*\n/, 'ga4');
const mv = pick(/<!-- mv:start -->[\s\S]*?<!-- mv:end -->/, 'mediavine');
const navAssets = pick(/<!-- site-nav:assets -->[\s\S]*?<!-- \/site-nav:assets -->/, 'nav assets');
const newTab = pick(/<script src="\/assets\/new-tab\.js[^"]*" defer><\/script><!-- new-tab -->/, 'new-tab');
const header = pick(/<!-- site-nav:header -->[\s\S]*?<!-- \/site-nav:header -->/, 'header').replace(' aria-current="page"', '');
const tailRaw = tpl.slice(tpl.indexOf('</main>') + '</main>'.length, tpl.indexOf('  <!-- tg-wx:start -->'));
if (!tailRaw.includes('</footer>')) throw new Error('template tail missing footer');
const tail = ct => tailRaw.replace(/ct=blog-thanksgiving-2026/g, `ct=${ct}`);
const GET = 'https://milecheckapp.com/get/?utm_source=site&amp;utm_medium=thanksgiving_page&amp;utm_campaign=thanksgiving-2026';
const appCard = `<aside class="tg-app"><p><strong>Check the mile marker on any road, offline.</strong> Live state DOT alerts and road conditions in the MileCheck app for iPhone and Android.</p><a class="tg-get" href="${GET}">Get the app</a></aside>`;
const V = '20261122-1';

const css = `
    .tg-page{max-width:820px;margin:0 auto;padding:30px 20px 44px;}
    .tg-page h1{font-size:clamp(28px,5vw,40px);line-height:1.12;margin:0 0 10px;}
    .tg-page h2{font-size:22px;line-height:1.25;margin:34px 0 10px;}
    .tg-page p{font-size:16px;line-height:1.6;color:#3D454D;margin:0 0 14px;}
    .tg-page a{color:#0f7a4f;font-weight:600;}
    .tg-back{display:inline-flex;align-items:center;min-height:44px;font-size:14.5px;text-decoration:none;}
    .tg-byline{font-size:14px;color:#5C6670;}
    .tg-wrap{border:1px solid #E4E7EA;border-radius:10px;margin:0 0 10px;overflow:hidden;}
    .tg{width:100%;border-collapse:collapse;font-size:14.5px;table-layout:fixed;}
    .tg th{background:#0F1419;color:#fff;text-align:left;padding:10px 12px;font-size:12.5px;letter-spacing:.02em;text-transform:uppercase;}
    .tg th:first-child{width:32%;}
    .tg td{padding:11px 12px;border-top:1px solid #E4E7EA;vertical-align:top;overflow-wrap:anywhere;}
    .tg td:first-child{font-weight:700;}
    .wx-none{color:#5C6670;font-size:14px;}
    .wx-chips{display:flex;flex-direction:column;gap:6px;}
    .wx-chip{display:block;font-size:14px;line-height:1.4;padding:6px 10px;border-radius:8px;border-left:4px solid #F59E0B;background:#FFF7ED;color:#3D454D;overflow-wrap:anywhere;}
    .wx-chip b{color:#0F1419;}
    .wx-chip.sev-extreme,.wx-chip.sev-severe{border-left-color:#DC2626;background:#FEF2F2;}
    .wx-chip.sev-minor,.wx-chip.sev-unknown{border-left-color:#3B82F6;background:#EFF6FF;}
    .tg-note{font-size:14px !important;color:#5C6670 !important;}
    .tg-live{border:1px solid #E4E7EA;border-radius:10px;padding:12px 16px;margin:0 0 16px;}
    .tg-live[hidden]{display:none;}
    .tg-live h3{font-size:16px;margin:0 0 6px;}
    .tg-live ul{margin:0;padding-left:20px;}
    .tg-live li{font-size:15px;line-height:1.5;margin:4px 0;}
    .tg-live-none{list-style:none;margin-left:-20px !important;color:#5C6670;}
    .tg-list{margin:0 0 14px;padding-left:20px;}
    .tg-list li{font-size:15.5px;line-height:1.5;margin:6px 0;}
    .tg-app{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;border:1px solid #cfe3d7;background:#f3f7f4;border-radius:14px;padding:14px 16px;margin:26px 0;}
    .tg-app p{margin:0;font-size:15px;line-height:1.4;flex:1 1 240px;}
    .tg-get{display:inline-flex;align-items:center;min-height:44px;padding:0 16px;border-radius:10px;background:#0f7a4f;color:#fff !important;font-weight:700;text-decoration:none;}
    .tg-states{list-style:none;padding:0;margin:10px 0 24px;display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:2px 12px;}
    .tg-states a{display:flex;align-items:center;min-height:44px;font-size:15px;text-decoration:none;}
    .tg-credits{font-size:13.5px !important;color:#5C6670 !important;margin-top:24px !important;}
    @media (max-width:600px){.tg-page{padding:22px 16px 36px;}.tg th:first-child{width:36%;}}`;

function head({ title, desc, url, ld, extra = '' }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
${ga}  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="referrer" content="strict-origin-when-cross-origin">
  <meta name="apple-itunes-app" content="app-id=6759212851">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}">
  <meta property="og:title" content="${esc(title.replace(/ \| MileCheck$/, ''))}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:image" content="${BASE}/images/og-banner-light.png">
  <meta property="og:url" content="${url}">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="icon" type="image/png" href="/images/favicon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&amp;family=JetBrains+Mono:wght@400;500;600;700&amp;display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/style.css">
  <link rel="canonical" href="${url}">
  <script type="application/ld+json">${JSON.stringify(ld)}</script>
  <style>${css}
  </style>
  ${newTab}
${mv}
  ${navAssets}
${extra}</head>
<body class="hr-national">

  ${header}
`;
}

function passHref(p) {
  for (const s of [p.id, p.id.replace(/-(pass|summit)$/, '')]) if (has(`passes/${s}/index.html`)) return `/passes/${s}/`;
  return null;
}
function routeHtml(r) {
  const s = r.toLowerCase();
  return has(`corridors/${s}/index.html`) ? `<a href="/corridors/${s}/">${esc(r)}</a>` : esc(r);
}

function statePage(c) {
  const name = NAMES[c], sl = slug(c), url = `${BASE}/thanksgiving/${sl}/`;
  const d = CORR[c] || { interstates: [], passes: [], dot: null };
  const dotName = d.dot ? d.dot.name : `${name} DOT`;
  const title = `${name} Thanksgiving travel 2026: weather alerts and roads to watch | MileCheck`;
  const desc = `${name} Thanksgiving travel, Nov. 24 to 30, 2026: live National Weather Service alerts for each day and the ${name} highways with the most DOT alerts right now.`;
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'WebPage', '@id': `${url}#webpage`, url, name: `${name} Thanksgiving travel 2026`, description: desc, isPartOf: { '@id': `${BASE}/#website` } },
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'MileCheck', item: `${BASE}/` },
      { '@type': 'ListItem', position: 2, name: 'Thanksgiving travel 2026', item: `${BASE}/thanksgiving/` },
      { '@type': 'ListItem', position: 3, name, item: url }] }] };
  const rows = DAYS.map(([iso, label]) => `        <tr data-date="${iso}"><td>${esc(label)}</td><td class="wx-cell"><span class="wx-none">Checking&hellip;</span></td></tr>`).join('\n');
  const inter = d.interstates.length
    ? `<li><strong>Interstates:</strong> ${d.interstates.map(routeHtml).join(', ')}</li>`
    : `<li><strong>Interstates:</strong> ${c === 'AK' ? 'Alaska has no signed interstate highways.' : 'none in MileCheck’s mile marker data.'}</li>`;
  const passes = d.passes.length
    ? `<li><strong>Mountain passes MileCheck tracks:</strong> ${d.passes.map(p => { const h = passHref(p); const n = esc(p.name); return `${h ? `<a href="${h}">${n}</a>` : n} (${esc(p.route)})`; }).join(', ')}</li>`
    : '';
  const more = [
    has(`road-conditions/${sl}/index.html`) ? `<a href="/road-conditions/${sl}/">${esc(name)} road conditions</a>` : '',
    has('chains/index.html') && d.passes.length ? `<a href="/chains/">Chain controls right now</a>` : '',
    `<a href="/closures/">Live road closure map</a>`,
  ].filter(Boolean).join(' &middot; ');
  return head({ title, desc, url, ld }) + `
  <main class="tg-page" id="tg-state" data-state="${c}">
    <a class="tg-back" href="/thanksgiving/">&larr; All states</a>
    <h1>${esc(name)} Thanksgiving travel 2026</h1>
    <p class="tg-byline">MileCheck Thanksgiving travel report &middot; Tue. Nov. 24 to Mon. Nov. 30, 2026</p>
    <p>Weather alerts for each day of Thanksgiving week in ${esc(name)}, straight from the National Weather Service, and the highways with the most state DOT alerts right now. Both update while this page is open. For the national picture, read <a href="/blog/thanksgiving-2026.html">What are the roads like for Thanksgiving 2026?</a></p>

    <h2>Which weather alerts are in effect in ${esc(name)} over Thanksgiving?</h2>
    <p class="tg-note" id="tg-wx-status" role="status" aria-live="polite"></p>
    <div class="tg-wrap"><table class="tg" id="tg-dates">
        <tr><th>Date</th><th>Weather alerts in effect (live)</th></tr>
${rows}
    </table></div>
    <p class="tg-note">Winter, ice, wind, fog, flood and other driving-related alerts for ${esc(name)} from the National Weather Service. An alert shows on every day it covers and drops off when it expires. Days later in the week fill in as forecasters issue watches and warnings. Days and times use ${esc(name)}'s main time zone.</p>

    <h2>Corridors to watch in ${esc(name)}</h2>
    <div class="tg-live" id="tg-live" hidden>
      <h3>Most DOT alerts right now</h3>
      <ul id="tg-live-list"></ul>
      <p class="tg-note" style="margin:8px 0 0">Live from ${esc(dotName)} via MileCheck. Counts are current alerts per route, refreshed every 10 minutes.</p>
    </div>
    <ul class="tg-list">
      ${inter}
      ${passes}
    </ul>
    <p>${more}</p>
${appCard}
    <p class="tg-credits">Weather alerts: National Weather Service (api.weather.gov). Road alerts: ${esc(dotName)} and other state DOT feeds via MileCheck. This page has no traffic forecasts; check your state's 511 service before you leave.</p>
  </main>
${tail(`thanksgiving-${sl}`)}  <script src="/assets/thanksgiving-advisories.js?v=${V}" defer></script>
  <script src="/assets/thanksgiving-corridors.js?v=${V}" defer></script>
  <script src="/assets/thanksgiving-state.js?v=${V}" defer></script>
</body>
</html>
`;
}

function indexPage() {
  const url = `${BASE}/thanksgiving/`;
  const title = 'Thanksgiving travel 2026 by state: weather alerts and roads to watch | MileCheck';
  const desc = 'Thanksgiving travel report for every state and DC, Nov. 24 to 30, 2026: live National Weather Service alerts for each day and the highways with the most DOT alerts right now.';
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'CollectionPage', '@id': `${url}#webpage`, url, name: 'Thanksgiving travel 2026 by state', description: desc, isPartOf: { '@id': `${BASE}/#website` } },
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'MileCheck', item: `${BASE}/` },
      { '@type': 'ListItem', position: 2, name: 'Thanksgiving travel 2026', item: url }] }] };
  const list = CODES.map(c => `<li><a href="/thanksgiving/${slug(c)}/">${esc(NAMES[c])}</a></li>`).join('');
  return head({ title, desc, url, ld }) + `
  <main class="tg-page">
    <a class="tg-back" href="/blog/thanksgiving-2026.html">&larr; Thanksgiving 2026 road guide</a>
    <h1>Thanksgiving travel 2026 by state</h1>
    <p class="tg-byline">MileCheck Thanksgiving travel report &middot; Tue. Nov. 24 to Mon. Nov. 30, 2026</p>
    <p>Pick a state to see the National Weather Service alerts in effect on each day of Thanksgiving week, the highways with the most state DOT alerts right now, and the interstates and mountain passes to keep an eye on. Everything updates live while the page is open.</p>
    <p>For the worst times to drive, the states pausing lane closures, border waits and ferries, read <a href="/blog/thanksgiving-2026.html">What are the roads like for Thanksgiving 2026?</a></p>
    <h2>Choose a state</h2>
    <ul class="tg-states">${list}</ul>
${appCard}
    <p class="tg-credits">Weather alerts: National Weather Service (api.weather.gov). Road alerts: state DOT feeds via MileCheck.</p>
  </main>
${tail('thanksgiving-index')}</body>
</html>
`;
}

fs.mkdirSync(path.join(SITE, 'thanksgiving'), { recursive: true });
fs.writeFileSync(path.join(SITE, 'thanksgiving', 'index.html'), indexPage());
for (const c of CODES) {
  const dir = path.join(SITE, 'thanksgiving', slug(c));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), statePage(c));
}
console.log(`wrote thanksgiving/index.html + ${CODES.length} state pages`);
