#!/usr/bin/env node
// build-storms-page.mjs — writes /storms/index.html (2026-10-30).
// Flag logic copied from ../scripts/storm-check.mjs (app repo): a state is flagged when it has
// an NWS winter warning/watch zone, 2+ NWS winter weather advisory zones in the mountains
// (pass states only), or its closures + weather reports are at least twice its own 7-day
// median (and 10 above it). Reads ../marketing/social-media/storm/storm-history.json for the
// medians and never writes it. Plain HTML out, no client JS.
//   node scripts/build-storms-page.mjs            # fetch live data, write the page
//   node scripts/build-storms-page.mjs --dry      # print flagged states only
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HIST = path.resolve(SITE, '..', 'marketing', 'social-media', 'storm', 'storm-history.json');
const W = 'https://milepost-proxy.leahgerber93.workers.dev';
const UA = 'MileCheck/1.10 CFNetwork storm-check';
const NAMES = { WA:'Washington',OR:'Oregon',ID:'Idaho',MT:'Montana',WY:'Wyoming',UT:'Utah',CO:'Colorado',NV:'Nevada',CA:'California',AZ:'Arizona',NM:'New Mexico',AK:'Alaska',SD:'South Dakota',ND:'North Dakota',NE:'Nebraska',MN:'Minnesota',WI:'Wisconsin',MI:'Michigan',IA:'Iowa',NY:'New York',PA:'Pennsylvania',VT:'Vermont',NH:'New Hampshire',ME:'Maine' };
const PASS_STATES = ['WA','OR','ID','CA','CO','UT','WY'];
const PASS_AREA = /cascade|pass|mountain|sierra|siskiyou|wasatch|uinta|crest|summit|higher elevation|western chelan|western okanogan/i;
// Pass pages by state (US only; Canadian passes are not in the storm check).
const PASSES = {
  WA: [['snoqualmie','Snoqualmie'],['stevens','Stevens'],['white','White'],['mt-baker-highway','Mt Baker Highway'],['crystal-mountain','Crystal Mountain']],
  OR: [['siskiyou','Siskiyou Summit'],['santiam','Santiam'],['willamette','Willamette'],['mt-hood','Mt Hood'],['cabbage-hill','Cabbage Hill'],['anthony-lakes','Anthony Lakes']],
  ID: [['lookout','Lookout']], MT: [['lookout','Lookout']],
  CA: [['donner','Donner'],['grapevine','The Grapevine'],['cajon','Cajon']],
  CO: [['eisenhower','Eisenhower Tunnel'],['vail','Vail'],['monarch','Monarch'],['wolf-creek','Wolf Creek']],
  UT: [['parleys','Parleys Summit'],['little-cottonwood','Little Cottonwood']],
  WY: [['i80-wyoming','I-80 Summit (Laramie)']],
};
const slug = s => NAMES[s].toLowerCase().replace(/ /g, '-');
const has = p => fs.existsSync(path.join(SITE, p));
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const median = a => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };

async function j(url, headers = {}) {
  const r = await fetch(url, { headers: { 'User-Agent': UA, ...headers } });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
}
async function stormCount(st) {
  let n = 0, ok = false;
  try { const inc = await j(`${W}/incidents?state=${st}`); ok = true;
    for (const i of inc['incident-reports'] || []) if (['CL','WE'].includes(i['event-type-id'])) n++; } catch {}
  try { const c = await j(`${W}/conditions?state=${st}`); ok = true;
    for (const x of c['road-weather-reports'] || []) if (Number(x['road-surface-condition-id']) >= 3) n++; } catch {}
  return ok ? n : null;
}
async function nwsZones(events, keep = () => true) {
  const out = {};
  try {
    const d = await j(`https://api.weather.gov/alerts/active?status=actual&event=${encodeURIComponent(events.join(','))}`, { 'User-Agent': 'MileCheck storm-check (info@milecheckapp.com)' });
    for (const f of d.features || []) {
      if (!keep(f.properties)) continue;
      for (const z of f.properties.geocode?.UGC || []) out[z.slice(0, 2)] = (out[z.slice(0, 2)] || 0) + 1;
    }
  } catch {}
  return out;
}
const pl = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

const hist = fs.existsSync(HIST) ? JSON.parse(fs.readFileSync(HIST, 'utf8')) : {};
const today = new Date().toISOString().slice(0, 10);
const warn = await nwsZones(['Winter Storm Warning', 'Blizzard Warning', 'Ice Storm Warning']);
const watch = await nwsZones(['Winter Storm Watch', 'Blizzard Watch', 'Ice Storm Watch']);
const advRaw = await nwsZones(['Winter Weather Advisory'], p => PASS_AREA.test(p.areaDesc || ''));
const flagged = [];
for (const st of Object.keys(NAMES)) {
  const n = await stormCount(st);
  const past = Object.entries(hist[st] || {}).filter(([d]) => d < today).sort().slice(-7).map(([, v]) => v);
  const base = past.length >= 3 ? median(past) : null;
  const spike = n !== null && base !== null && n >= Math.max(base * 2, base + 10);
  const adv = PASS_STATES.includes(st) && (advRaw[st] || 0) >= 2 ? advRaw[st] : 0;
  const why = [];
  if (warn[st]) why.push(`${pl(warn[st], 'NWS winter storm warning zone')}`);
  if (watch[st]) why.push(`${pl(watch[st], 'NWS winter storm watch zone')}`);
  if (adv) why.push(`${pl(adv, 'NWS winter weather advisory zone')} in the mountains`);
  if (spike) why.push(`${n} closure and weather reports, usual ${base}`);
  if (why.length) flagged.push({ st, why: why.join('; ') });
}
if (process.argv.includes('--dry')) { console.log(flagged.map(f => `${f.st}: ${f.why}`).join('\n') || 'none flagged'); process.exit(0); }

const now = new Date();
const stamp = now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) + ' PT';
const iso = now.toISOString();
const card = ({ st, why }) => {
  const s = slug(st), N = NAMES[st];
  const links = [[`/road-conditions/${s}/`, 'Alerts and conditions', has(`road-conditions/${s}/index.html`)], [`/cameras/${s}/`, 'Cameras', has(`cameras/${s}/index.html`)], [`/blog/mile-markers-${s}.html`, 'Mile marker map', has(`blog/mile-markers-${s}.html`)]]
    .filter(l => l[2]).map(l => `<a class="st-btn" href="${l[0]}">${l[1]}</a>`).join('');
  const passes = (PASSES[st] || []).filter(p => has(`passes/${p[0]}/index.html`)).map(p => `<a href="/passes/${p[0]}/">${esc(p[1])}</a>`).join('');
  return `<article class="st-card" id="${s}"><h2>${N}</h2><p class="st-why">${esc(why)}</p><p class="st-up">Last updated ${stamp}</p><div class="st-links">${links}</div>${passes ? `<p class="st-pass"><strong>By pass:</strong> ${passes}</p>` : ''}</article>`;
};
const listAll = Object.keys(NAMES).sort((a, b) => NAMES[a].localeCompare(NAMES[b])).filter(st => has(`road-conditions/${slug(st)}/index.html`))
  .map(st => `<li><a href="/road-conditions/${slug(st)}/">${NAMES[st]}</a></li>`).join('');
const body = flagged.length
  ? `<div class="st-grid">${flagged.map(card).join('')}</div><h2 class="st-h2">All states</h2><ul class="st-all">${listAll}</ul>`
  : `<p class="st-calm">No states are flagged right now.</p><ul class="st-all">${listAll}</ul>`;
const desc = 'Which states have winter storms right now, based on National Weather Service winter alerts and unusual closure counts from live state DOT feeds. Links to each state.';
const intro = 'These states have an active National Weather Service winter alert, or far more closure and weather reports than usual from their live state DOT feeds. Each card links to that state\'s alerts, cameras, mile marker map and mountain passes.';
const graph = { '@context': 'https://schema.org', '@graph': [
  { '@type': 'WebPage', '@id': 'https://milecheckapp.com/storms/#webpage', url: 'https://milecheckapp.com/storms/', name: 'Where are the winter storms right now?', description: desc, dateModified: iso, isPartOf: { '@id': 'https://milecheckapp.com/#website' }, breadcrumb: { '@id': 'https://milecheckapp.com/storms/#breadcrumb' } },
  { '@type': 'BreadcrumbList', '@id': 'https://milecheckapp.com/storms/#breadcrumb', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'MileCheck', item: 'https://milecheckapp.com/' }, { '@type': 'ListItem', position: 2, name: 'Current storms', item: 'https://milecheckapp.com/storms/' }] },
] };
const GET = 'https://milecheckapp.com/get/?utm_source=site&utm_medium=storms_page&utm_campaign=storms';
const tpl = fs.readFileSync(path.join(SITE, 'passes', 'index.html'), 'utf8');
const ga = (tpl.match(/<!-- ga4 -->.*\n/) || [''])[0];
const header = tpl.match(/<header class="site-header">[\s\S]*?<\/header>/)[0].replace(/(href|src)="\.\.\//g, '$1="/').replace(/href="\/get\/"/g, `href="${GET}"`);
const footer = tpl.match(/<footer class="site-footer">[\s\S]*?<\/footer>/)[0].replace(/(href|src)="\.\.\//g, '$1="/').replace(/href="\/get\/"/g, `href="${GET}"`).replace(/ct=passes/g, 'ct=storms').replace(/campaign%3Dpasses/g, 'campaign%3Dstorms');
const appCard = `<aside class="st-app"><p><strong>Check the mile marker on any road, offline.</strong> Live state DOT feeds and alerts in the MileCheck app.</p><a class="st-btn st-get" href="${GET}">Get the app</a></aside>`;
const navJs = (tpl.match(/<script>\(function\(\)\{var t=document\.querySelector\("\.nav-toggle"\)[\s\S]*?<\/script>/) || [''])[0];
const html = `<!DOCTYPE html>
<html lang="en">
<head>
${ga}  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Where Are the Winter Storms Right Now? | MileCheck</title>
  <meta name="description" content="${esc(desc)}">
  <link rel="canonical" href="https://milecheckapp.com/storms/">
  <meta property="og:title" content="Where Are the Winter Storms Right Now? | MileCheck">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:image" content="https://milecheckapp.com/images/og-banner-light.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:url" content="https://milecheckapp.com/storms/">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="https://milecheckapp.com/images/og-banner-light.png">
  <link rel="icon" type="image/png" href="/images/favicon.png">
  <link rel="stylesheet" href="/style.css">
  <script type="application/ld+json">${JSON.stringify(graph)}</script>
  <style>
    .st-wrap{max-width:1000px;margin:0 auto;padding:34px 20px 48px;}
    .st-wrap h1{font-size:clamp(28px,5vw,42px);line-height:1.1;margin:0 0 10px;}
    .st-intro{font-size:17px;line-height:1.55;color:#3a444d;margin:0 0 22px;}
    .st-check{font-size:14.5px;color:#5b6670;margin:-12px 0 18px;}
    .st-stale{font-size:15px;line-height:1.45;border:1px solid #e3c98a;background:#fff8e6;border-radius:10px;padding:12px 14px;margin:0 0 18px;}
    .st-stale[hidden]{display:none;}
    .st-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px;}
    .st-card{border:1px solid #E5E5E5;border-radius:14px;background:#fff;padding:16px;}
    .st-card h2{font-size:22px;margin:0 0 6px;}
    .st-why{font-size:15px;line-height:1.45;color:#0E1116;margin:0 0 4px;font-weight:600;}
    .st-up{font-size:13px;color:#5b6670;margin:0 0 12px;}
    .st-links{display:flex;flex-wrap:wrap;gap:8px;}
    .st-btn{display:inline-flex;align-items:center;min-height:44px;padding:0 14px;border:1px solid #cfe3d7;border-radius:10px;background:#f3f7f4;color:#0f7a4f;font-weight:700;font-size:14.5px;text-decoration:none;}
    .st-pass{font-size:14.5px;line-height:1.4;margin:12px 0 0;color:#3a444d;}
    .st-pass a{display:inline-flex;align-items:center;min-height:44px;margin-right:12px;color:#0f7a4f;font-weight:700;text-decoration:none;}
    .st-h2{font-size:20px;margin:30px 0 8px;}
    .st-calm{font-size:18px;font-weight:700;margin:0 0 14px;}
    .st-all{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:2px 12px;}
    .st-all a{display:flex;align-items:center;min-height:44px;color:#0f7a4f;font-weight:600;text-decoration:none;font-size:15px;}
    .st-app{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;border:1px solid #cfe3d7;background:#f3f7f4;border-radius:14px;padding:14px 16px;margin:0 0 22px;}
    .st-app p{margin:0;font-size:15px;line-height:1.4;flex:1 1 240px;}
    .st-get{background:#0f7a4f;color:#fff;border-color:#0f7a4f;}
    .st-report{margin:26px 0 14px;font-size:15px;}
    .st-report a{display:inline-flex;align-items:center;min-height:44px;color:#0f7a4f;font-weight:700;}
    .st-note{font-size:13.5px;color:#5b6670;margin-top:26px;line-height:1.55;}
  </style>
</head>
<body>
  ${header}
  <main class="st-wrap" id="st-main" data-generated="${iso}">
    <h1>Where are the winter storms right now?</h1>
    <p class="st-intro">${esc(intro)}</p>
    <p class="st-check">Checked about twice a day, morning and mid-afternoon Pacific. The time on each card is when it was last checked.</p>
    <p class="st-stale" id="st-stale" hidden>This page has not refreshed recently. The state pages linked below show live DOT feeds.</p>
    ${appCard}
    ${body}
    <p class="st-report"><em><a href="/#subscribe">Sign up to receive the monthly Highway Report</a></em></p>
    ${appCard}
    <p class="st-note">A state is listed when the National Weather Service has an active winter storm warning or watch for it, mountain zones are under a winter weather advisory, or its closures and weather reports are at least twice its own usual count. Counts come from live state DOT feeds and are only compared with the same state's past week. Last reported data only; always follow posted signs.</p>
  </main>
  ${footer}
  ${navJs}
  <script>try{var m=document.getElementById('st-main'),g=Date.parse(m.getAttribute('data-generated'));if(g&&Date.now()-g>20*3600000){document.getElementById('st-stale').hidden=false;}}catch(e){}</script>
</body>
</html>
`;
fs.mkdirSync(path.join(SITE, 'storms'), { recursive: true });
fs.writeFileSync(path.join(SITE, 'storms', 'index.html'), html);
console.log(`wrote storms/index.html; flagged: ${flagged.map(f => f.st).join(', ') || 'none'}`);
