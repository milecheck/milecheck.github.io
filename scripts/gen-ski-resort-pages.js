// gen-ski-resort-pages.js — /ski/<slug>/ for every resort in scripts/ski-resorts.cjs, plus the /ski/ hub
// (2026-10-15). Leah 2026-10-16: "we should link each ski resort to a plow route."
//
// Each page: a live map centred on the resort's access road with the DOT's plow trucks on it (the
// Worker's /plows?state=XX, trucks kept when their route matches one of the resort's access routes or
// they sit inside the search radius), the DOT cameras inside the radius (/cameras), closures and crashes
// on those roads (/incidents, classified by the same functions gen-road-conditions-pages.js writes —
// lifted from that file at build time, not copied), the chain or traction law page, the resort's own
// snow report, the pass or corridor page for the same road, and the app.
//
// Modeled on gen-state-camera-pages.js: same head, header, sponsor slot, footer, Leaflet + Esri tiles,
// map-kit, assets/plows.js. A state with no plow feed (Washington, Oregon) gets the same page with a
// line saying so and the cameras and condition reports in the plows' place.
//
// Wording rules (CLAUDE.md, snowplows family): never "plowed", "cleared" or "plowing"; a pin is a
// position; "Last reported N min ago"; trucks older than 60 min faded and labelled (plows.js does that);
// Alberta, Manitoba and Ontario in km; no superlative without a source; app link says "free trial".
//
// Run: node scripts/gen-ski-resort-pages.js [slug ...]
// Then: node scripts/finish-pages.mjs --pages-only (sponsor inventory, map kit, site nav, JSON-LD links).
'use strict';
const fs = require('fs');
const path = require('path');
const SPON = require('./lib/sponsor-slot');
const RESORTS = require('./ski-resorts.cjs');

const ROOT = path.resolve(__dirname, '..');
const rel = (p) => path.join(ROOT, p);
const exists = (p) => fs.existsSync(rel(p));
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const only = process.argv.slice(2);

// Regions whose DOT publishes truck positions (cloudflare-worker.js PLOW_STATE_FETCHERS; assets/plows.js AGENCY).
const PLOW_FEEDS = new Set(['UT', 'CO', 'DE', 'MT', 'WV', 'MI', 'NE', 'IN', 'IA', 'MN', 'KS', 'MB', 'AK', 'ND', 'AB', 'PA', 'ON']);
const KM = new Set(['AB', 'MB', 'ON']);
const REGION = {
  CO: { name: 'Colorado', slug: 'colorado', dot: 'CDOT', trafficName: 'COtrip', traffic: 'https://www.cotrip.org' },
  UT: { name: 'Utah', slug: 'utah', dot: 'UDOT', trafficName: 'UDOT Traffic', traffic: 'https://udottraffic.utah.gov' },
  AB: { name: 'Alberta', slug: 'alberta', dot: '511 Alberta', trafficName: '511 Alberta', traffic: 'https://511.alberta.ca' },
  ON: { name: 'Ontario', slug: 'ontario', dot: 'Ontario 511', trafficName: 'Ontario 511', traffic: 'https://511on.ca' },
  PA: { name: 'Pennsylvania', slug: 'pennsylvania', dot: 'PennDOT', trafficName: '511PA', traffic: 'https://www.511pa.com' },
  MN: { name: 'Minnesota', slug: 'minnesota', dot: 'MnDOT', trafficName: '511MN', traffic: 'https://511mn.org/' },
  MI: { name: 'Michigan', slug: 'michigan', dot: 'MDOT', trafficName: 'Mi Drive', traffic: 'https://mdotjboss.state.mi.us/MiDrive' },
  MT: { name: 'Montana', slug: 'montana', dot: 'MDT', trafficName: 'MDT 511', traffic: 'https://www.511mt.net' },
  AK: { name: 'Alaska', slug: 'alaska', dot: 'Alaska DOT&PF', trafficName: 'Alaska 511', traffic: 'https://511.alaska.gov' },
  WV: { name: 'West Virginia', slug: 'west-virginia', dot: 'WVDOT', trafficName: 'WV511', traffic: 'https://wv511.org/' },
  IN: { name: 'Indiana', slug: 'indiana', dot: 'INDOT', trafficName: 'INDOT TrafficWise', traffic: 'https://indot.carsprogram.org/' },
  IA: { name: 'Iowa', slug: 'iowa', dot: 'Iowa DOT', trafficName: '511 Iowa', traffic: 'https://511ia.org/' },
  ND: { name: 'North Dakota', slug: 'north-dakota', dot: 'NDDOT', trafficName: 'NDRoads', traffic: 'https://travel.dot.nd.gov/' },
  MB: { name: 'Manitoba', slug: 'manitoba', dot: 'Manitoba 511', trafficName: 'Manitoba 511', traffic: 'https://www.manitoba511.ca' },
  WA: { name: 'Washington', slug: 'washington', dot: 'WSDOT', trafficName: 'WSDOT', traffic: 'https://wsdot.wa.gov/travel/real-time/map' },
  OR: { name: 'Oregon', slug: 'oregon', dot: 'ODOT', trafficName: 'TripCheck', traffic: 'https://tripcheck.com' },
};
// /chain-laws/<page>/ for the states that have one (scripts/gen-chain-law-pages.js); the rest link the hub.
const CHAIN_PAGE = { CO: 'colorado', UT: 'utah', MT: 'montana', WA: 'washington', OR: 'oregon', AK: 'arizona-new-mexico-alaska' };
// Every slug under /passes/ (scripts/gen-pass-pages.js). A resort that names a pass not listed here fails the build
// rather than printing the slug as a title (Anthony Lakes did, 2026-10-16).
const PASS_NAME = { snoqualmie: 'Snoqualmie Pass', stevens: 'Stevens Pass', 'crystal-mountain': 'Crystal Mountain (SR 410)', parleys: 'Parleys Summit', 'little-cottonwood': 'Little Cottonwood Canyon', eisenhower: 'Eisenhower Tunnel', vail: 'Vail Pass', 'anthony-lakes': 'Anthony Lakes (I-84 and OR 237)', siskiyou: 'Siskiyou Summit', 'cabbage-hill': 'Cabbage Hill', grapevine: 'The Grapevine (Tejon Pass)', donner: 'Donner Pass', cajon: 'Cajon Pass' };

for (const r of RESORTS) {
  if (!REGION[r.state]) throw new Error(`ski-resorts.cjs: no REGION entry for ${r.state} (${r.slug})`);
  if (r.pass && !exists(`passes/${r.pass}/index.html`)) throw new Error(`${r.slug}: pass page passes/${r.pass}/ does not exist`);
  if (r.pass && !PASS_NAME[r.pass]) throw new Error(`${r.slug}: add passes/${r.pass}/ to PASS_NAME`);
  if (r.corridor && !exists(`corridors/${r.corridor}/index.html`)) throw new Error(`${r.slug}: corridor page corridors/${r.corridor}/ does not exist`);
  if (!(r.radius >= 10 && r.radius <= 25)) throw new Error(`${r.slug}: radius must be 10..25 mi`);
}

// The closure / crash classifier, lifted from gen-road-conditions-pages.js liveJs at build time so the
// two page families can never drift. That file writes the block inside a template literal (backslashes
// doubled), so the doubling is undone here. Fails loudly if the block moves.
const RC_SRC = fs.readFileSync(rel('scripts/gen-road-conditions-pages.js'), 'utf8');
const RC_START = RC_SRC.indexOf('function clean(t,n)');
const RC_END = RC_SRC.indexOf('function icon(k)');
if (RC_START < 0 || RC_END < 0 || RC_END < RC_START) throw new Error('gen-road-conditions-pages.js: classifier block (clean … ago) not found');
const CLASSIFIER = RC_SRC.slice(RC_START, RC_END).replace(/\\\\/g, '\\').replace(/\$\{/g, '\\${');
new Function(CLASSIFIER + '\nreturn [clean,partial,fullWords,kind,when,dirN,starts,ago];'); // syntax check at build time

// Shared chrome, same source the other generators use (GA4 tag byte-identical).
const REF = fs.readFileSync(rel('best-portable-jump-starters/index.html'), 'utf8');
const GA4 = (REF.match(/<!-- ga4 -->[\s\S]*?<!-- \/ga4 -->/) || [''])[0];
if (!GA4) throw new Error('GA4 tag not found in reference page');
const SLOT_CSS = SPON.slot({ kind: 'pass', slug: 'ski-css-only', name: '(css only)' }).css;

const CSS = `    .sk-hero{max-width:1160px;margin:0 auto;padding:34px 20px 6px;}
    .sk-hero .spon{margin:0 0 18px;}
    .sk-hero .eyebrow{font-size:13px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:#0f7a4f;margin-bottom:6px;}
    .sk-hero h1{font-size:clamp(28px,4.6vw,42px);line-height:1.1;letter-spacing:-0.01em;margin:0 0 10px;}
    .sk-hero .sub{font-size:17px;line-height:1.55;color:#3a444d;max-width:780px;}
    .sk-hero .sub a{color:#0f7a4f;font-weight:700;text-decoration:none;}
    .sk-stats{display:flex;flex-wrap:wrap;gap:10px;margin:16px 0 0;}
    .sk-stat{border:1px solid #E5E5E5;border-radius:12px;background:#fff;padding:10px 16px;min-width:130px;}
    .sk-stat .n{font-size:24px;font-weight:800;color:#0E1116;line-height:1;}
    .sk-stat .n.live{color:#0f7a4f;} .sk-stat .n.plow{color:#0369A1;}
    .sk-stat .l{font-size:12.5px;color:#5b6670;margin-top:4px;font-weight:600;}
    .sk-wrap{max-width:1160px;margin:16px auto 0;padding:0 20px;}
    #comap{width:100%;height:62vh;min-height:440px;border-radius:16px;border:1px solid #E5E5E5;overflow:hidden;scroll-margin-top:76px;}
    .sk-bs{position:absolute;top:12px;left:56px;right:12px;z-index:800;background:rgba(255,255,255,.95);border:1px solid #E5E5E5;border-radius:10px;padding:8px 12px;font-weight:700;font-size:13.5px;color:#0E1116;line-height:1.35;}
    .sk-bs.err{color:#b4231a;}
    .co-layers{position:absolute;left:12px;top:84px;z-index:850;background:rgba(255,255,255,.96);border:1px solid #E5E5E5;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,.08);padding:10px 12px 6px;min-width:190px;font-size:13.5px;}
    .co-layers .lt{font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#5b6670;margin:0 0 4px;}
    .co-layer{display:flex;align-items:center;gap:9px;padding:6px 0;cursor:pointer;user-select:none;color:#0E1116;font-weight:600;position:relative;}
    .co-layer input{position:absolute;opacity:0;width:0;height:0;}
    .co-sw{flex:none;width:34px;height:20px;border-radius:10px;background:#cfd4da;position:relative;transition:background .15s;}
    .co-sw::after{content:"";position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.25);transition:left .15s;}
    .co-layer input:checked+.co-sw.cam{background:#0f7a4f;} .co-layer input:checked+.co-sw.plow{background:#0369A1;} .co-layer input:checked+.co-sw.alert{background:#cf3320;}
    .co-layer input:checked+.co-sw::after{left:16px;}
    .sk-dot{width:10px;height:10px;border-radius:50%;display:inline-block;}
    .sk-base{width:30px;height:30px;border-radius:50%;background:#0E1116;border:2.5px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;color:#fff;font-size:15px;font-weight:800;line-height:1;}
    .rc-dot{display:block;width:14px;height:14px;border-radius:50%;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.4);}
    .rc-dot.big{width:18px;height:18px;}
    .sk-card{position:absolute;top:12px;right:12px;width:min(300px,44%);max-height:calc(100% - 24px);overflow:auto;z-index:900;background:#fff;border:1px solid #E5E5E5;border-radius:12px;box-shadow:0 8px 28px rgba(0,0,0,.20);padding:12px 14px;display:none;}
    .sk-card .cx{position:absolute;top:8px;right:8px;border:0;background:#f0f0ee;border-radius:50%;width:26px;height:26px;cursor:pointer;font-size:16px;line-height:1;color:#5b6670;}
    .sk-card .cc-title{font-weight:800;font-size:15px;padding-right:26px;line-height:1.3;}
    .sk-card .cc-meta{font-size:12.5px;color:#5b6670;margin-top:3px;}
    .sk-card img.cc-img,.sk-card video.cc-img{width:100%;border-radius:8px;margin-top:8px;display:block;background:#f0f0ee;min-height:40px;}
    .fpop .fp-nm{font-weight:800;font-size:14px;} .fpop .fp-st{font-size:12px;color:#5b6670;margin:2px 0 6px;} .fpop .fp-row{font-size:13px;line-height:1.45;margin-top:4px;}
    .sk-legend{display:flex;flex-wrap:wrap;gap:6px 14px;font-size:12.5px;color:#5b6670;margin:10px 0 0;}
    .sk-legend span{display:inline-flex;align-items:center;gap:6px;}
    .sk-legend i{display:inline-block;width:10px;height:10px;border-radius:50%;}
    .sk-grid{max-width:1160px;margin:26px auto 0;padding:0 20px;display:grid;grid-template-columns:1fr 1fr;gap:16px;}
    @media(max-width:860px){.sk-grid{grid-template-columns:1fr;}}
    .sk-box{border:1px solid #E5E5E5;border-radius:14px;background:#fff;padding:16px 18px;}
    .sk-box h2{font-size:19px;margin:0 0 4px;}
    .sk-box .hint{font-size:13px;color:#5b6670;margin:0 0 10px;line-height:1.5;}
    .sk-box .hint a{color:#0f7a4f;font-weight:700;text-decoration:none;}
    .sk-box ul{list-style:none;padding:0;margin:0;}
    .sk-box li{padding:9px 0;border-top:1px solid #F0F0EE;font-size:14.5px;line-height:1.4;}
    .sk-box li .m{display:block;font-size:12.5px;color:#5b6670;margin-top:2px;}
    .sk-box li.none{color:#5b6670;font-size:14px;}
    .sk-box li.sk-go{cursor:pointer;margin:0 -8px;padding-left:8px;padding-right:8px;border-radius:8px;}
    .sk-box li.sk-go:hover{background:#F7F5EE;}
    .sk-box .kd{font-weight:800;font-size:11px;letter-spacing:.05em;text-transform:uppercase;white-space:nowrap;margin-left:8px;}
    .kd.closure{color:#cf3320;} .kd.crash{color:#d9640f;} .kd.weather{color:#2563eb;} .kd.hazard{color:#7C3AED;} .kd.partial{color:#a16207;}
    .sk-box .pn{font-size:13px;color:#0369A1;font-weight:600;margin:6px 0 0;}
    .sk-box .pnote{font-size:13px;color:#5b6670;margin:8px 0 0;line-height:1.5;font-style:italic;}
    .sk-links{max-width:1160px;margin:22px auto 0;padding:0 20px;}
    .sk-links h2{font-size:23px;margin:0 0 10px;}
    .sk-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px;}
    .sk-cardlink{display:block;border:1px solid #E5E5E5;border-radius:12px;background:#fff;padding:14px 16px;text-decoration:none;color:inherit;}
    .sk-cardlink:hover{border-color:#0E1116;}
    .sk-cardlink .k{font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#0f7a4f;}
    .sk-cardlink h3{font-size:15.5px;margin:4px 0 4px;color:#0E1116;}
    .sk-cardlink p{font-size:13.5px;line-height:1.45;color:#5b6670;margin:0;}
    .sk-guide{max-width:1000px;margin:36px auto 0;padding:0 20px;}
    .sk-guide h2{font-size:24px;margin:0 0 6px;}
    .sk-guide p{color:#3a444d;font-size:16px;line-height:1.65;margin:0 0 14px;}
    .sk-guide a{color:#0f7a4f;font-weight:700;text-decoration:none;}
    .sk-faq{max-width:1000px;margin:24px auto 0;padding:0 20px;}
    .sk-faq h2{font-size:24px;margin:0 0 14px;}
    .sk-faq details{border:1px solid #E5E5E5;border-radius:12px;background:#fff;padding:14px 18px;margin-bottom:10px;}
    .sk-faq summary{font-weight:700;font-size:16px;cursor:pointer;color:#0E1116;}
    .sk-faq p{color:#3a444d;font-size:15px;line-height:1.6;margin:10px 0 0;}
    .sk-faq a{color:#0f7a4f;font-weight:700;text-decoration:none;}
    .co-cta{max-width:1000px;margin:24px auto 40px;padding:26px 22px;border:1px solid #E5E5E5;border-radius:16px;background:linear-gradient(135deg,#f4fbf7,#ffffff);text-align:center;}
    .co-cta h2{font-size:24px;margin:0 0 8px;}
    .co-cta p{color:#3a444d;font-size:15.5px;line-height:1.6;margin:0 auto 16px;max-width:560px;}
    .co-cta .btns{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;}
    .co-cta a{display:inline-block;padding:11px 20px;border-radius:10px;font-weight:700;font-size:14.5px;text-decoration:none;}
    .co-cta a.primary{background:#0f7a4f;color:#fff;} .co-cta a.ghost{border:1px solid #0F1419;color:#0F1419;}
    .sk-related{max-width:1000px;margin:0 auto 40px;padding:0 20px;color:#5b6670;font-size:14px;}
    .sk-related a{color:#0f7a4f;font-weight:700;text-decoration:none;}
    .sk-states{max-width:1160px;margin:20px auto 0;padding:0 20px;}
    .sk-states h2{font-size:22px;margin:26px 0 10px;}
    .sk-rows{border:1px solid #E5E5E5;border-radius:14px;background:#fff;overflow:hidden;}
    .sk-row{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 16px;border-top:1px solid #F0F0EE;text-decoration:none;color:inherit;}
    .sk-row:first-child{border-top:0;} .sk-row:hover{background:#F7F5EE;}
    .sk-row b{font-size:15.5px;} .sk-row .rd{display:block;font-size:13px;color:#5b6670;margin-top:2px;font-weight:400;}
    .sk-row .ct{flex:none;font-size:12.5px;font-weight:700;color:#0369A1;text-align:right;max-width:40%;}
    .sk-row .ct.none{color:#8A939B;font-weight:600;}
    @media(max-width:600px){ #comap{height:56vh;} .sk-bs{left:12px;font-size:12px;padding:6px 10px;} .co-layers{top:auto;bottom:12px;min-width:0;padding:8px 10px 4px;font-size:13px;} .sk-card{width:60%;} .leaflet-control-zoom{display:none;} }`;

const LEAFLET = `  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <link rel="stylesheet" href="https://unpkg.com/leaflet-gesture-handling@1.2.2/dist/leaflet-gesture-handling.min.css">
  <script src="https://unpkg.com/leaflet-gesture-handling@1.2.2/dist/leaflet-gesture-handling.min.js"></script>
  <script src="/assets/plows.js"></script>`;

function head({ title, desc, url, ld, spCss }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
${GA4}
  <meta name="apple-itunes-app" content="app-id=6759212851">
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${esc(desc)}">
  <link rel="canonical" href="${url}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:image" content="https://milecheckapp.com/images/og-banner-light.png">
  <meta property="og:url" content="${url}">
  <meta property="og:type" content="website">
  <link rel="icon" type="image/png" href="/images/favicon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/style.css">
${LEAFLET}
${ld.map((o) => `  <script type="application/ld+json">${JSON.stringify(o)}</script>`).join('\n')}
  <style>
${CSS}
${spCss}
  </style>
  <!-- Shared map behavior for every Leaflet map: assets/map-kit.css + .js. Change maps there, not per page. -->
  <link rel="stylesheet" href="/assets/map-kit.css">
  <script src="/assets/map-kit.js" defer></script>
</head>
<body>

  <header class="site-header">
    <div class="container header-inner">
      <a href="/" class="brand" style="display:inline-flex;align-items:center;gap:9px;"><img src="/assets/app-icon-60.png" alt="" style="width:28px;height:28px;border-radius:7px;flex-shrink:0;">MileCheck</a>
      <button class="nav-toggle" aria-label="Menu"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0F1419" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg></button>
      <nav class="primary-nav">
        <a href="/">Home</a>
        <a href="/maps/" class="active">Maps</a>
        <a href="/cameras/">Cameras</a>
        <a href="/states/">United States</a>
        <a href="/canada/">Canada</a>
        <a href="/#story">Story</a>
        <a href="/partners/">B2B</a>
        <a href="/blog/">Blog</a>
        <a href="/get/" class="nav-cta">Get the app</a>
      </nav>
    </div>
  </header>
`;
}

function footer(fineprint) {
  return `  <footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-col footer-col-brand">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;"><img src="/assets/app-icon-60.png" alt="MileCheck" style="width:36px;height:36px;border-radius:9px;flex-shrink:0;"><p class="footer-brand" style="margin-bottom:0;">MileCheck</p></div>
          <p class="footer-tagline">Mile markers in all 50 US states.</p>
        </div>
        <div class="footer-col">
          <p class="footer-label">Get the app</p>
          <ul class="footer-list">
            <li><a href="https://apps.apple.com/us/app/milecheck/id6759212851" target="_blank" rel="noopener">iOS App Store</a></li>
            <li><a href="https://play.google.com/store/apps/details?id=app.milecheck.mobile" target="_blank" rel="noopener">Google Play</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <p class="footer-label">Live maps</p>
          <ul class="footer-list">
            <li><a href="/snowplows/">Snowplow map</a></li>
            <li><a href="/passes/">Mountain passes</a></li>
            <li><a href="/cameras/">Highway cameras</a></li>
            <li><a href="/maps/">All maps</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <p class="footer-label">Help &amp; legal</p>
          <ul class="footer-list">
            <li><a href="mailto:feedback@milecheckapp.com">Send feedback</a></li>
            <li><a href="https://milecheck.github.io/milecheck-privacy/">Privacy policy</a></li>
          </ul>
        </div>
      </div>
      <p class="footer-fineprint">&copy; 2026 MileCheck LLC. ${fineprint} Always drive to conditions and follow posted signs.</p>
      <p class="footer-fineprint footer-disclosure">MileCheck is a participant in the Amazon Services LLC Associates Program. As an Amazon Associate I earn from qualifying purchases.</p>
    </div>
  </footer>
<script>(function(){var t=document.querySelector(".nav-toggle"),n=document.querySelector(".primary-nav");if(t&&n){t.addEventListener("click",function(){n.classList.toggle("open");});document.addEventListener("click",function(e){if(!e.target.closest(".header-inner"))n.classList.remove("open");})}})();</script>
`;
}

// Route-key normaliser shared by the resort pages and the hub (as page JS). Matches the feeds' own
// spellings against the corpus spelling in ski-resorts.cjs: 'SR-210' = 'SR 210' = 'UT-210' = 'SR210';
// 'I-70' = 'I70'; 'US-2' = 'US 2'. Washington numbers its routes uniquely across I / US / SR, and its
// corpus spells I-90 as 'SR 90', so WA matches on the number alone. Named highways (Alaska) match on
// the name. A route match counts within three radii of the base (I-70 is 450 miles long; a truck east of
// Denver is not on the road to Vail); anything inside one radius counts whatever road it is on.
const MATCH_JS = `function normKey(r,st){var s=String(r||'').toUpperCase().replace(/\\s+/g,' ').trim();if(!s)return '';var m=s.match(/^(I|US|SR|SH|S|M|ROUTE|HWY|PTH|PR|[A-Z]{2})[- ]?(\\d+[A-Z]?)$/);if(!m)return 'N:'+s.replace(/[^A-Z0-9]+/g,' ').trim();var t=m[1],n=m[2];if(st==='WA')return 'W:'+n;return (t==='I'?'I':t==='US'?'U':'S')+n;}
function hav(a,b,c,d){var p=Math.PI/180,x=(c-a)*p,y=(d-b)*p,h=Math.sin(x/2)*Math.sin(x/2)+Math.cos(a*p)*Math.cos(c*p)*Math.sin(y/2)*Math.sin(y/2);return 2*3958.8*Math.asin(Math.sqrt(h));}
function onRoad(res,keys,lat,lon,route){var d=(isFinite(lat)&&isFinite(lon))?hav(res.lat,res.lon,lat,lon):Infinity;if(route&&keys[normKey(route,res.state)])return d<=res.radius*3;return d<=res.radius;}
function keysOf(res){var k={};res.routes.forEach(function(r){k[normKey(r,res.state)]=1;});return k;}`;

function liveJs(r, reg) {
  const plows = PLOW_FEEDS.has(r.state);
  return `<script>
// Page-level \`map\`: assets/map-kit.js (deferred) reads it for the phone layers popout and the near-me button.
const map=L.map('comap',{gestureHandling:('ontouchstart' in window),scrollWheelZoom:true,preferCanvas:true,renderer:L.canvas({tolerance:('ontouchstart' in window)?14:6})});
(function(){
var RES=${JSON.stringify({ slug: r.slug, name: r.name, state: r.state, lat: r.lat, lon: r.lon, radius: r.radius, routes: r.routes })};
var DOT=${JSON.stringify(reg.dot)},TRAFFIC=${JSON.stringify(reg.trafficName)},TRAFFICURL=${JSON.stringify(reg.traffic)},PLOWS=${plows},KM=${KM.has(r.state)};
var WORKER='https://milepost-proxy.leahgerber93.workers.dev';
${MATCH_JS}
var KEYS=keysOf(RES);
var TOUCH=('ontouchstart' in window),RS=function(v){return TOUCH?Math.round(v*1.6):v;};
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',{attribution:'Esri, USGS · '+DOT+' and '+TRAFFIC+' via MileCheck',maxZoom:16}).addTo(map);
// Set the view before adding layers: a circle added to a map with no view has no _map yet, so its getBounds() throws.
map.fitBounds(L.latLng(RES.lat,RES.lon).toBounds(RES.radius*1609.34*2),{padding:[6,6]});
L.circle([RES.lat,RES.lon],{radius:RES.radius*1609.34,color:'#0f7a4f',weight:1.5,dashArray:'4 5',fill:false,interactive:false}).addTo(map);
L.marker([RES.lat,RES.lon],{icon:L.divIcon({className:'',iconSize:[30,30],iconAnchor:[15,15],html:'<div class="sk-base" title="'+esc(RES.name)+' base">⛷</div>'}),zIndexOffset:1200,interactive:false}).addTo(map);
var camLayer=L.layerGroup().addTo(map),alertLayer=L.layerGroup().addTo(map),plowLayer=L.layerGroup().addTo(map);
var CAMS=[],ALERTS=[],PLOWLIST=[],plowErr=false,alertErr=false,camErr=false,plowStatewide=0,plowMarkers=[],alertMarkers=[],GROUPS=[];
var cardEl=document.getElementById('skCard'),status=document.getElementById('skStatus');
function esc(x){return String(x==null?'':x).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function showCard(html){stopStream();cardEl.innerHTML='<button class="cx" aria-label="Close">×</button>'+html;cardEl.style.display='block';cardEl.querySelector('.cx').onclick=function(){cardEl.style.display='none';stopStream();};}
// Camera card + stream playback: the same code gen-state-camera-pages.js writes (image cameras get a
// cache-busted still; stream-only cameras (COtrip, DelDOT) play through hls.js, loaded on first use).
var MKR=KM?'km':'MP';
function camCard(c){var loc=esc(c.route||'')+(c.mp>0?' · '+MKR+' '+Math.round(c.mp):'');if(c.stream){return '<div class="cc-title">'+esc(c.title)+'</div><div class="cc-meta">'+loc+' · live video from '+esc(TRAFFIC)+'</div><video class="cc-img" id="ccVid" controls muted playsinline autoplay preload="none" aria-label="Live video: '+esc(c.title)+'"></video><div class="cc-meta">A live stream, a few seconds behind the road. Tap play if it does not start.</div>';}var bust=c.img+(c.img.indexOf('?')>=0?'&':'?')+'t='+Date.now();return '<div class="cc-title">'+esc(c.title)+'</div><div class="cc-meta">'+loc+' · '+esc(TRAFFIC)+'</div><a href="'+esc(c.img)+'" target="_blank" rel="noopener" title="Open full image"><img class="cc-img" src="'+esc(bust)+'" alt="Live: '+esc(c.title)+'" onload="noFeed(this)" onerror="this.alt=\\'image unavailable\\'"></a>';}
// 511 Alberta answers a camera with no feed with its own 540 x 330 "No live camera feed at this time" card (all three
// Lake Louise TCH views on 2026-10-16). Shown as-is it reads like a picture of the road. Say what it is instead.
window.noFeed=function(img){if(img.naturalWidth===540&&img.naturalHeight===330&&/state=AB/.test(img.src)){var d=document.createElement('div');d.className='cc-meta';d.style.cssText='margin-top:8px;padding:10px 12px;border:1px dashed #cfd4da;border-radius:8px;color:#5b6670;';d.textContent=TRAFFIC+' reports no live feed from this camera right now. Nothing has been shown in its place.';var a=img.closest('a');(a||img).replaceWith(d);}};
// Cameras sharing a pole are one group; groups keep CAMS' nearest-first order, so the arrows walk outward from the base.
function groupCams(){var groups={},order=[];CAMS.forEach(function(c){var k=c.lat.toFixed(4)+','+c.lon.toFixed(4);if(!groups[k]){groups[k]=[];order.push(k);}groups[k].push(c);});return order.map(function(k){return groups[k];});}
// The ‹ › arrows on the card come from assets/map-kit.js (section 5), the one place camera-card behaviour lives.
// This page groups cameras per pole, so it registers the groups' lead cameras through the MCCamMap protocol.
function openCam(gi,pan){var N=GROUPS.length;if(!N)return;gi=((gi%N)+N)%N;var g=GROUPS[gi];showCard(groupCard(g));if(pan)map.panTo([g[0].lat,g[0].lon]);var sc=g.filter(function(c){return c.stream;})[0];if(sc)playStream(sc.stream);}
window.MCCamMap={list:function(){return GROUPS.map(function(g){return g[0];});},open:function(c,pan){for(var i=0;i<GROUPS.length;i++)if(GROUPS[i][0]===c)return openCam(i,pan);}};
// Several cameras on one pole (511 Alberta gives the NW / SE / SW views one coordinate): one card, every view, one dot on the map.
function groupCard(g){if(g.length===1)return camCard(g[0]);var seen=false;return '<div class="cc-title">'+g.length+' cameras at this spot</div><div class="cc-meta">'+esc(g[0].route||'')+(g[0].mp>0?' · '+MKR+' '+Math.round(g[0].mp):'')+' · '+esc(TRAFFIC)+'</div>'+g.map(function(c){if(c.stream){if(seen)return '<div class="cc-meta" style="margin-top:10px"><b>'+esc(c.title)+'</b> · live video, open the '+esc(TRAFFIC)+' site for this view.</div>';seen=true;return '<div class="cc-meta" style="margin-top:10px"><b>'+esc(c.title)+'</b></div><video class="cc-img" id="ccVid" controls muted playsinline autoplay preload="none" aria-label="Live video: '+esc(c.title)+'"></video>';}var bust=c.img+(c.img.indexOf('?')>=0?'&':'?')+'t='+Date.now();return '<div class="cc-meta" style="margin-top:10px"><b>'+esc(c.title)+'</b></div><a href="'+esc(c.img)+'" target="_blank" rel="noopener" title="Open full image"><img class="cc-img" src="'+esc(bust)+'" alt="Live: '+esc(c.title)+'" onload="noFeed(this)" onerror="this.alt=\\'image unavailable\\'"></a>';}).join('');}
var hlsInst=null,hlsLoading=null,streamGeneration=0;function loadHls(){if(window.Hls)return Promise.resolve();if(hlsLoading)return hlsLoading;hlsLoading=new Promise(function(res,rej){var sc=document.createElement('script');sc.src='https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.5.15/hls.min.js';sc.onload=res;sc.onerror=rej;document.head.appendChild(sc);}).catch(function(e){hlsLoading=null;throw e;});return hlsLoading;}
function stopStream(){streamGeneration++;if(hlsInst){try{hlsInst.destroy();}catch(e){}hlsInst=null;}var v=document.getElementById('ccVid');if(v){try{v.pause();v.removeAttribute('src');v.load();}catch(e){}}}
function playStream(url){stopStream();var v=document.getElementById('ccVid');if(!v)return;var generation=streamGeneration;var current=function(){return generation===streamGeneration&&v.isConnected&&document.getElementById('ccVid')===v&&cardEl.style.display!=='none';};var go=function(){if(!current())return;try{var p=v.play();if(p&&p.catch)p.catch(function(){});}catch(e){}};var offline=function(){if(current())streamOffline();};var native=function(){if(!current())return;v.addEventListener('error',offline,{once:true});v.addEventListener('loadedmetadata',go,{once:true});try{v.src=url;go();}catch(e){offline();}};loadHls().then(function(){if(!current())return;if(window.Hls&&Hls.isSupported()){hlsInst=new Hls({liveSyncDurationCount:3});hlsInst.loadSource(url);hlsInst.attachMedia(v);hlsInst.on(Hls.Events.MANIFEST_PARSED,go);hlsInst.on(Hls.Events.ERROR,function(ev,d){if(d&&d.fatal)offline();});}else{native();}}).catch(function(){if(!current())return;if(hlsInst){try{hlsInst.destroy();}catch(e){}hlsInst=null;}native();});}
function streamOffline(){stopStream();var v=document.getElementById('ccVid');if(!v)return;var d=document.createElement('div');d.className='cc-meta';d.textContent='This camera is offline right now. '+TRAFFIC+' switches some streams off for stretches.';v.replaceWith(d);}
// Closure / crash classification: lifted from gen-road-conditions-pages.js at build time (clean, partial, fullWords, kind, when, dirN, starts, ago).
${CLASSIFIER}
var COLOR={closure:'#cf3320',crash:'#f97316',weather:'#3B82F6',hazard:'#7C3AED',partial:'#a16207',work:'#F59E0B',other:'#6B7280'};
var LABEL={closure:'Closed',crash:'Crash',weather:'Weather',hazard:'Hazard',partial:'Ramp / lane',work:'Work zone',other:'Alert'};
var LISTED={closure:1,crash:1,weather:1,hazard:1,partial:1};
function aIcon(k){return L.divIcon({className:'',html:'<span class="rc-dot'+(k==='closure'?' big':'')+'" style="background:'+COLOR[k]+'"></span>',iconSize:[k==='closure'?18:14,k==='closure'?18:14],iconAnchor:[k==='closure'?9:7,k==='closure'?9:7]});}
var showCam=true,showPlow=true,showAlert=true;
function draw(){
  camLayer.clearLayers();alertLayer.clearLayers();plowLayer.clearLayers();plowMarkers=[];alertMarkers=[];
  if(showCam)GROUPS.forEach(function(g,gi){L.circleMarker([g[0].lat,g[0].lon],{radius:RS(g.length>1?6:5),color:'#fff',weight:1.5,fillColor:'#0f7a4f',fillOpacity:.95}).on('click',function(){openCam(gi,false);}).addTo(camLayer);});
  if(showAlert)ALERTS.forEach(function(a,i){if(!isFinite(a.lat)||!isFinite(a.lon)||!a.lat)return;var m=L.marker([a.lat,a.lon],{icon:aIcon(a.k),zIndexOffset:a.k==='closure'?900:a.k==='crash'?800:100,opacity:a.future?0.55:1});m.bindPopup('<div class="fpop"><div class="fp-nm">'+esc(a.route?a.route+(a.mp?' · '+MKR+' '+a.mp:''):LABEL[a.k])+'</div><div class="fp-st">'+LABEL[a.k]+(a.dir?' · '+esc(a.dir):'')+(a.at?' · updated '+ago(a.at):'')+(a.future?' · scheduled':'')+'</div><div class="fp-row">'+esc(a.fh)+'</div>'+(a.fd&&a.fh.indexOf(a.fd)<0&&a.fd.indexOf(a.fh)<0?'<div class="fp-row">'+esc(a.fd)+'</div>':'')+'</div>',{maxHeight:260,maxWidth:320});alertLayer.addLayer(m);alertMarkers[i]=m;});
  if(PLOWS&&showPlow)PLOWLIST.forEach(function(t,i){plowMarkers[i]=L.marker([t.lat,t.lon],{icon:MCPlows.icon(t,L),zIndexOffset:t.stale?400:700}).on('click',function(){showCard(MCPlows.card(t));}).addTo(plowLayer);});
  var bits=[];
  if(PLOWS)bits.push(plowErr?'plow feed unavailable':'\\uD83D\\uDE9A '+MCPlows.summary(PLOWLIST));
  bits.push(camErr?'cameras unavailable':'\\uD83D\\uDCF7 '+CAMS.length+(CAMS.length===1?' camera':' cameras'));
  var cc=ALERTS.filter(function(a){return !a.future&&(a.k==='closure'||a.k==='crash');}).length;
  bits.push(alertErr?'alerts unavailable':(cc?cc+(cc===1?' closure or crash':' closures and crashes'):'no closures or crashes'));
  status.className='sk-bs'+(plowErr&&alertErr?' err':'');status.textContent=bits.join(' · ')+' on the road';
}
var tg=function(id,fn){var el=document.getElementById(id);if(el)el.onchange=function(e){fn(e.target.checked);draw();};};
tg('tgCam',function(v){showCam=v;});tg('tgPlow',function(v){showPlow=v;});tg('tgAlert',function(v){showAlert=v;});
function fetchJSON(url,tries){return new Promise(function(resolve){var i=0;(function go(){fetch(url,{cache:'no-store'}).then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json();}).then(resolve).catch(function(){if(++i<tries)setTimeout(go,1200);else resolve(null);});})();});}
// Every active camera inside the ring is kept, highway or not: near a resort a park-road or town camera still shows the weather.
function loadCams(){fetchJSON(WORKER+'/cameras?state='+RES.state,4).then(function(d){
  if(!d){camErr=true;draw();return;}camErr=false;
  CAMS=(d.cameras||[]).filter(function(c){return c.isActive!==false&&isFinite(+c.lat)&&+c.lat&&(c.imageUrl||c.streamUrl)&&hav(RES.lat,RES.lon,+c.lat,+c.lon)<=RES.radius;}).map(function(c){return {lat:+c.lat,lon:+c.lon,title:c.title||'Traffic camera',route:(c.route||'').trim(),mp:c.mile,img:c.imageUrl||'',stream:c.imageUrl?'':(c.streamUrl||''),d:hav(RES.lat,RES.lon,+c.lat,+c.lon)};}).sort(function(a,b){return a.d-b.d;});
  GROUPS=groupCams();
  var el=document.getElementById('statCams');if(el)el.textContent=CAMS.length;
  var ul=document.getElementById('camList');if(ul)ul.innerHTML=CAMS.length?CAMS.slice(0,12).map(function(c){return '<li>'+esc(c.title)+'<span class="m">'+esc(c.route||'')+(c.mp>0?' · '+MKR+' '+Math.round(c.mp):'')+' · '+(KM?Math.round(c.d*1.609)+' km':c.d.toFixed(1)+' mi')+' from the base</span></li>';}).join('')+(CAMS.length>12?'<li class="none">'+(CAMS.length-12)+' more on the map.</li>':''):'<li class="none">'+esc(TRAFFIC)+' has no camera within '+(KM?Math.round(RES.radius*1.609)+' km':RES.radius+' miles')+' of the base.</li>';
  draw();});}
function loadAlerts(){fetchJSON(WORKER+'/incidents?state='+RES.state,3).then(function(d){
  if(!d||!Array.isArray(d['incident-reports'])){alertErr=true;draw();return;}alertErr=false;
  var list=d['incident-reports'].map(function(r){var loc=r.location||{},sl=loc['start-location']||{};var st=starts(r),future=!!(st&&st.getTime()>Date.now()+3600000);return {k:kind(r),lat:+sl['start-lat'],lon:+sl['start-long'],mp:sl['start-mile-marker']?String(sl['start-mile-marker']).replace(/\\.0+$/,''):'',route:(loc['route-id']||'').trim(),dir:dirN(loc.direction),head:clean(r.headline||r.description||r['impact-desc']||'Alert',180),fh:clean(r.headline||r.description||r['impact-desc']||'Alert',1500),fd:clean(r.description||r['impact-desc']||'',1500),at:when(r),start:st,future:future};})
    .filter(function(a){return LISTED[a.k]&&onRoad(RES,KEYS,a.lat,a.lon,a.route);});
  var order={closure:0,crash:1,weather:2,hazard:3,partial:4};
  list.sort(function(a,b){return (a.future-b.future)||order[a.k]-order[b.k]||((b.at?b.at.getTime():0)-(a.at?a.at.getTime():0));});
  ALERTS=list;
  var ul=document.getElementById('alertList');
  if(ul)ul.innerHTML=list.length?list.slice(0,30).map(function(a,i){return '<li'+(isFinite(a.lat)&&a.lat?' class="sk-go" data-i="'+i+'" title="Show on the map"':'')+'><b>'+esc(a.route||LABEL[a.k])+(a.mp?' · '+MKR+' '+esc(a.mp):'')+(a.dir?' '+esc(a.dir):'')+'</b><span class="kd '+a.k+'">'+(a.future?'Scheduled':LABEL[a.k])+'</span><span class="m">'+(a.future&&a.start?'Starts '+a.start.toLocaleDateString([],{month:'short',day:'numeric'})+'. ':'')+esc(a.head)+(a.at?' · '+ago(a.at):'')+'</span></li>';}).join(''):'<li class="none">No closure, crash, weather or lane report from '+esc(TRAFFIC)+' on these roads right now. A quiet feed is not an all-clear; '+esc(TRAFFIC)+' is the official list.</li>';
  var cc=list.filter(function(a){return !a.future&&(a.k==='closure'||a.k==='crash');}).length;var el=document.getElementById('statAlerts');if(el)el.textContent=cc;
  draw();}).catch(function(){alertErr=true;draw();});}
function loadPlows(){if(!PLOWS)return;fetchJSON(WORKER+'/plows?state='+RES.state,3).then(function(d){
  var el=document.getElementById('statPlows'),ul=document.getElementById('plowList'),sm=document.getElementById('plowSummary'),cn=document.getElementById('plowCamNote');
  if(!d||!Array.isArray(d.plows)){plowErr=true;if(el)el.textContent='—';if(ul)ul.innerHTML='<li class="none">The '+esc(DOT)+' plow feed is not answering right now. That is an outage, not an empty road.</li>';draw();return;}
  plowErr=false;
  var all=d.plows.filter(function(t){return isFinite(+t.lat)&&isFinite(+t.lon);}).map(function(t){return MCPlows.normalize(t,DOT);});
  plowStatewide=all.length;
  PLOWLIST=MCPlows.sort(all.filter(function(t){return onRoad(RES,KEYS,t.lat,t.lon,t.route);}));
  var fresh=PLOWLIST.filter(function(t){return !t.stale;}).length;
  if(el)el.textContent=fresh;
  if(sm)sm.textContent=PLOWLIST.length?MCPlows.summary(PLOWLIST):'';
  if(ul)ul.innerHTML=PLOWLIST.length?PLOWLIST.slice(0,20).map(function(t,i){return MCPlows.listItem(t).replace('<li','<li class="sk-go" data-i="'+i+'" title="Show on the map"');}).join(''):'<li class="none">No '+esc(DOT)+' truck is reporting a position on '+esc(RES.routes.join(', '))+' within '+(KM?Math.round(RES.radius*4.827)+' km':RES.radius*3+' miles')+', or within '+(KM?Math.round(RES.radius*1.609)+' km':RES.radius+' miles')+' of the base, right now'+(plowStatewide?'. '+plowStatewide+(plowStatewide===1?' truck is':' trucks are')+' reporting elsewhere in the '+esc(DOT)+' feed.':'. The '+esc(DOT)+' feed has no trucks reporting anywhere at the moment.')+'</li>';
  if(cn){var txt=MCPlows.cameraNote(PLOWLIST);cn.textContent=txt;cn.style.display=txt?'block':'none';}
  draw();});}
// Leah 2026-10-16: tap a truck or a closure in the list and the map goes to it and opens it.
function jumpTo(m,open){if(!m)return;document.getElementById('comap').scrollIntoView({behavior:'smooth',block:'start'});map.setView(m.getLatLng(),Math.max(map.getZoom(),12),{animate:true});setTimeout(open,350);}
var pl=document.getElementById('plowList');if(pl)pl.addEventListener('click',function(e){var li=e.target.closest('li.sk-go');if(!li)return;var i=+li.getAttribute('data-i');if(!showPlow){showPlow=true;var t=document.getElementById('tgPlow');if(t)t.checked=true;draw();}var t2=PLOWLIST[i];jumpTo(plowMarkers[i],function(){if(t2)showCard(MCPlows.card(t2));});});
var al=document.getElementById('alertList');if(al)al.addEventListener('click',function(e){var li=e.target.closest('li.sk-go');if(!li)return;var i=+li.getAttribute('data-i');if(!showAlert){showAlert=true;var t=document.getElementById('tgAlert');if(t)t.checked=true;draw();}jumpTo(alertMarkers[i],function(){if(alertMarkers[i])alertMarkers[i].openPopup();});});
loadCams();loadAlerts();loadPlows();
setInterval(loadAlerts,300000);setInterval(loadPlows,60000);setInterval(loadCams,600000);
})();</script>`;
}

function resortPage(r) {
  const reg = REGION[r.state];
  const plows = PLOW_FEEDS.has(r.state);
  const km = KM.has(r.state);
  const url = `https://milecheckapp.com/ski/${r.slug}/`;
  const radiusTxt = km ? `${Math.round(r.radius * 1.609)} km` : `${r.radius} miles`;
  const farTxt = km ? `${Math.round(r.radius * 3 * 1.609)} km` : `${r.radius * 3} miles`;
  const routesTxt = r.routes.map((x) => x.replace(/^SR (\d+)$/, (m, n) => (r.state === 'WA' ? ({ 90: 'I-90', 2: 'US 2', 12: 'US 12', 97: 'US 97' }[n] || `SR ${n}`) : m))).join(', ');
  const title = `What is the road to ${r.name} like right now? Plows, cameras and closures | MileCheck`;
  const desc = plows
    ? `Live ${reg.dot} plow truck positions, ${reg.trafficName} cameras and closures on ${routesTxt}, the road to ${r.name}. Updates every minute. No account.`
    : `${reg.trafficName} cameras, closures and crashes on ${routesTxt}, the road to ${r.name}. ${reg.name} publishes no plow positions; this page shows what ${reg.dot} does publish.`;
  const sp = SPON.slot({ kind: 'pass', slug: `ski-${r.slug}`, state: r.state, name: `${r.name} road` });
  const chain = CHAIN_PAGE[r.state] ? [`/chain-laws/${CHAIN_PAGE[r.state]}/`, `${reg.name} chain and traction law`, `When chains or traction tires are required on ${reg.name} highways, and the fines where the law states them.`] : ['/chain-laws/', 'Chain and traction laws by state', `${reg.name} has no page of its own here. The hub covers the states that post a chain law and links each DOT's winter rules.`];
  const cams = exists(`cameras/${reg.slug}/index.html`);
  const roadConds = exists(`road-conditions/${reg.slug}/index.html`);

  const cards = [];
  if (plows) cards.push(['Snowplows', `Where are the ${reg.dot} plows right now?`, `Every ${reg.dot} truck that reports a position, statewide, on one map.`, '/snowplows/']);
  cards.push(['Snow report', r.reportName || `${r.name} snow report`, `The resort's own report: snowfall, lifts and runs. Opens the resort's site.`, r.report, true]);
  if (r.pass) cards.push(['Mountain pass', PASS_NAME[r.pass], `The pass page for the same road: cameras, restrictions and closures, with the summit weather.`, `/passes/${r.pass}/`]);
  if (r.corridor) cards.push(['Corridor', `${r.corridor.toUpperCase()} conditions`, `The whole ${r.corridor.toUpperCase()} corridor, every state it crosses, alerts by mile marker.`, `/corridors/${r.corridor}/`]);
  cards.push(['Chain law', chain[1], chain[2], chain[0]]);
  if (cams) cards.push(['Cameras', `${reg.name} highway cameras`, `Every ${reg.trafficName} camera on one map, with the route and ${km ? 'kilometre' : 'mile'} marker where the DOT gives one.`, `/cameras/${reg.slug}/`]);
  if (roadConds) cards.push(['Road conditions', `${reg.name} road conditions`, `Every closure and crash ${reg.trafficName} is publishing, statewide.`, `/road-conditions/${reg.slug}/`]);
  cards.push(['Official source', reg.trafficName, `${reg.name}'s traveler information site. The list of record for closures, restrictions and detours.`, reg.traffic, true]);
  const cardsHtml = cards.map(([k, h, p, href, ext]) => `      <a class="sk-cardlink" href="${esc(href)}"${ext ? ' target="_blank" rel="noopener"' : ''}><span class="k">${k}</span><h3>${esc(h)}</h3><p>${p}</p></a>`).join('\n');

  const plowBox = plows ? `      <div class="sk-box">
        <h2>Plows on the road right now</h2>
        <p class="hint">${reg.dot} trucks reporting a position on ${esc(routesTxt)} within ${farTxt} of the base, or on any road within ${radiusTxt}. A pin is a position, not proof the road is open or bare. Trucks not heard from in 60 minutes are faded. <span id="plowSummary"></span></p>
        <ul id="plowList"><li class="none">Loading the ${reg.dot} feed&hellip;</li></ul>
        <p class="pn" id="plowCamNote" style="display:none"></p>
        <p class="pnote">Positions come from the trucks' own GPS, through ${reg.dot}, and refresh here every minute. "Last reported" is the truck's time, not ours.</p>
      </div>` : `      <div class="sk-box">
        <h2>Plows on the road right now</h2>
        <p class="hint">${reg.name} publishes no plow positions. ${reg.dot} does not put its trucks on a public feed, so no page can show them. Here is what ${reg.dot} does publish:</p>
        <ul id="camList"><li class="none">Loading ${reg.trafficName} cameras&hellip;</li></ul>
        <p class="pnote">The cameras above are the ones within ${radiusTxt} of the base, nearest first. Closures and crashes are in the next box. For the states and provinces that do publish trucks, see the <a href="/snowplows/">snowplow map</a>.</p>
      </div>`;

  const faq = [
    [`Is the road to ${r.name} open right now?`, `The map shows every closure and crash ${reg.trafficName} is publishing on ${routesTxt} as a red or orange marker, and the list under it says when the DOT last updated each one. No marker means ${reg.trafficName} has not posted a closure, not that the road is open. It reloads every five minutes. For the official word, open <a href="${esc(reg.traffic)}" target="_blank" rel="noopener">${reg.trafficName}</a>${r.note ? `. ${esc(r.note)}` : '.'}`],
    plows
      ? [`Where are the plows on the road to ${r.name}?`, `On the map, as blue truck pins. Each is a ${reg.dot} truck's last reported GPS position, with the route and ${km ? 'kilometre' : 'mile'} the DOT snapped it to, how long ago it reported, and the material it is spreading where the DOT sends that. A pin tells you a truck was there at that moment. It does not tell you the lane behind it is bare. Trucks that have not reported in an hour are faded and say so.`]
      : [`Why are there no plows on this map?`, `${reg.dot} does not publish its trucks' positions. Seventeen states and provinces do, and the <a href="/snowplows/">snowplow map</a> shows them. For ${reg.name}, the cameras and the ${reg.trafficName} reports on this page are what exists.`],
    [`Are chains required on the road to ${r.name}?`, CHAIN_PAGE[r.state]
      ? `Chain and traction requirements are set by ${reg.dot} per road and per storm, and they show up in the ${reg.trafficName} feed as restrictions, which this page lists when they are on ${routesTxt}. <a href="/chain-laws/${CHAIN_PAGE[r.state]}/">${reg.name}'s chain law</a> explains the levels and who they apply to. Always follow the posted signs.`
      : `Winter traction rules in ${reg.name} come from ${reg.dot} and the provincial or state code, not from this page. Restrictions ${reg.trafficName} posts as alerts appear in the list above when they are on ${routesTxt}. <a href="/chain-laws/">Which states have chain laws?</a> covers the states that post one. Always follow the posted signs.`],
    [`How often does this page update?`, `Plow positions every minute, closures and crashes every five minutes, the camera list every ten. MileCheck's server reads the ${reg.dot} and ${reg.trafficName} feeds and converts them to one format. Each truck and each alert carries its own time stamp from the DOT, shown next to it.`],
  ];
  const faqHtml = faq.map(([q, a]) => `    <details><summary>${q}</summary><p>${a}</p></details>`).join('\n');
  const ld = [
    { '@context': 'https://schema.org', '@type': 'WebPage', name: `The road to ${r.name} right now`, url, description: desc, isPartOf: { '@type': 'WebSite', name: 'MileCheck', url: 'https://milecheckapp.com/' }, about: { '@type': 'SkiResort', name: r.name, geo: { '@type': 'GeoCoordinates', latitude: r.lat, longitude: r.lon } } },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a.replace(/<[^>]+>/g, '') } })) },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'MileCheck', item: 'https://milecheckapp.com/' }, { '@type': 'ListItem', position: 2, name: 'Ski resort roads', item: 'https://milecheckapp.com/ski/' }, { '@type': 'ListItem', position: 3, name: r.name, item: url }] },
  ];

  return head({ title, desc, url, ld, spCss: sp.css }) + `
  <div class="sk-hero">
${sp.html}
    <div class="eyebrow">Ski resort roads · ${reg.name} · ${reg.dot}</div>
    <h1>What is the road to ${r.name} like right now?</h1>
    <p class="sub">${esc(r.road.charAt(0).toUpperCase() + r.road.slice(1))}. ${plows ? `This page puts ${reg.dot}'s plow trucks, ${reg.trafficName}'s cameras and its closure and crash reports for that road on one map, refreshed every minute.` : `This page puts ${reg.trafficName}'s cameras and its closure and crash reports for that road on one map. ${reg.name} publishes no plow positions, and the page says so instead of guessing.`} The resort's own <a href="${esc(r.report)}" target="_blank" rel="noopener">${r.reportName ? esc(r.reportName) : 'snow report'}</a> covers the mountain itself.${r.note ? ` ${esc(r.note)}` : ''}</p>
    <div class="sk-stats">${plows ? `
      <div class="sk-stat"><div class="n plow" id="statPlows">—</div><div class="l">${reg.dot} plows reporting on the road</div></div>` : `
      <div class="sk-stat"><div class="n" style="font-size:15px;padding-top:5px">none published</div><div class="l">${reg.dot} plow positions</div></div>`}
      <div class="sk-stat"><div class="n live" id="statCams">—</div><div class="l">cameras within ${radiusTxt}</div></div>
      <div class="sk-stat"><div class="n" id="statAlerts">—</div><div class="l">closures and crashes on the road</div></div>
    </div>
  </div>

  <div class="sk-wrap">
    <div style="position:relative;">
      <div id="comap" role="region" aria-label="Map of the road to ${esc(r.name)}"></div>
      <div class="sk-bs" id="skStatus">Loading ${reg.trafficName} data&hellip;</div>
      <div class="co-layers" role="group" aria-label="Map layers">
        <div class="lt">Map layers</div>${plows ? `
        <label class="co-layer"><input type="checkbox" id="tgPlow" checked><span class="co-sw plow"></span><span class="sk-dot" style="background:#0369A1"></span>Snowplows</label>` : ''}
        <label class="co-layer"><input type="checkbox" id="tgCam" checked><span class="co-sw cam"></span><span class="sk-dot" style="background:#0f7a4f"></span>Cameras</label>
        <label class="co-layer"><input type="checkbox" id="tgAlert" checked><span class="co-sw alert"></span><span class="sk-dot" style="background:#cf3320"></span>Closures and crashes</label>
      </div>
      <div class="sk-card" id="skCard"></div>
    </div>
    <div class="sk-legend"><span><i style="background:#0E1116"></i>Resort base</span>${plows ? `<span><i style="background:#0369A1"></i>Plow truck, last reported position</span>` : ''}<span><i style="background:#0f7a4f"></i>Camera</span><span><i style="background:#cf3320"></i>Full closure</span><span><i style="background:#f97316"></i>Crash</span><span><i style="background:#3B82F6"></i>Weather</span><span><i style="background:#a16207"></i>Ramp or lane</span><span style="color:#8A939B">Dashed ring: the ${radiusTxt} search area</span></div>
  </div>

  <div class="sk-grid">
${plowBox}
      <div class="sk-box">
        <h2>Closures and crashes on the road</h2>
        <p class="hint">${reg.trafficName} reports on ${esc(routesTxt)} within ${farTxt} of the base, or on any road inside the ${radiusTxt} ring: full closures, crashes, weather, hazards and lane or ramp closures. Scheduled closures are marked. Nothing listed means nothing posted, not an all-clear.</p>
        <ul id="alertList"><li class="none">Loading the ${reg.trafficName} feed&hellip;</li></ul>
      </div>
  </div>

  <div class="sk-links">
    <h2>Before you go</h2>
    <div class="sk-cards">
${cardsHtml}
    </div>
  </div>

  <section class="sk-guide">
    <h2>What this page can and cannot tell you</h2>
    <p>${plows ? `A plow pin is where a ${reg.dot} truck was when it last reported, with the route and ${km ? 'kilometre' : 'mile'} the DOT attached. It says a truck was there. It does not say the road behind it is bare, and it does not say when the next pass comes. The DOT's camera, where there is one on ${esc(routesTxt)}, shows the surface itself.` : `${reg.dot} publishes its cameras and its closure and crash reports, and that is what this page shows. It does not publish where its trucks are, so no page can show that for ${reg.name}.`} The closure list is ${reg.trafficName}'s own feed, read every five minutes and converted to the format MileCheck uses for every state. A quiet list means ${reg.trafficName} has posted nothing for these roads, which is different from a road being open.</p>
    <p>The ${radiusTxt} ring is the search area for trucks and cameras. A truck reporting on ${esc(routesTxt)} is kept out to ${farTxt} from the base, the stretch a driver is actually on; anything inside the ring is kept whatever road it is on, so a truck on a side road near the base still shows. The resort's own <a href="${esc(r.report)}" target="_blank" rel="noopener">${r.reportName ? esc(r.reportName) : 'snow report'}</a> is the source for snowfall, lifts and the parking lots.${r.note ? ` ${esc(r.note)}` : ''}</p>
  </section>

  <section class="sk-faq">
    <h2>Questions about the road to ${r.name}</h2>
${faqHtml}
  </section>

  <div class="co-cta">
    <h2>The same alerts on your route, as you drive</h2>
    <p>MileCheck shows your mile marker and the ${reg.trafficName} alerts ahead of you on ${esc(routesTxt)}, offline in dead zones, on CarPlay and Android Auto. Premium starts with a free trial.</p>
    <div class="btns">
      <a class="primary" href="https://apps.apple.com/us/app/milecheck/id6759212851" target="_blank" rel="noopener">iOS App Store</a>
      <a class="ghost" href="https://play.google.com/store/apps/details?id=app.milecheck.mobile" target="_blank" rel="noopener">Google Play</a>
    </div>
  </div>

  <p class="sk-related">More: <a href="/ski/">every ski resort road</a> · <a href="/snowplows/">snowplow map</a> · <a href="/passes/">mountain passes</a>${cams ? ` · <a href="/cameras/${reg.slug}/">${reg.name} cameras</a>` : ''}${roadConds ? ` · <a href="/road-conditions/${reg.slug}/">${reg.name} road conditions</a>` : ''} · <a href="/maps/">all maps</a></p>

` + footer(`Plow, camera and alert data: ${reg.dot} and ${reg.trafficName} via MileCheck. A plow pin is a reported position, not a statement about the road surface.`) + sp.js + '\n' + liveJs(r, reg) + `

</body>
</html>`;
}

function hubPage() {
  const url = 'https://milecheckapp.com/ski/';
  const byState = [];
  for (const r of RESORTS) { let g = byState.find((x) => x.code === r.state); if (!g) { g = { code: r.state, reg: REGION[r.state], list: [] }; byState.push(g); } g.list.push(r); }
  const plowStates = byState.filter((g) => PLOW_FEEDS.has(g.code));
  const noPlow = byState.filter((g) => !PLOW_FEEDS.has(g.code));
  const title = `What is the road to your ski resort like right now? ${RESORTS.length} resorts, live plows and cameras | MileCheck`;
  const desc = `One page per ski resort: the DOT's plow trucks on the access road, the cameras within reach of the base, and closures and crashes on the road. ${RESORTS.length} resorts in ${byState.length} states and provinces.`;
  const sp = SPON.slot({ kind: 'pass', slug: 'ski-hub', name: 'Ski resort roads' });
  const sections = byState.map((g) => `    <h2>${g.reg.name} <span style="font-size:13px;color:#5b6670;font-weight:600">· ${PLOW_FEEDS.has(g.code) ? `${g.reg.dot} publishes truck positions` : `${g.reg.dot} publishes no truck positions`}</span></h2>
    <div class="sk-rows">
${g.list.map((r) => `      <a class="sk-row" href="/ski/${r.slug}/"><span><b>${esc(r.name)}</b><span class="rd">${esc(r.road.charAt(0).toUpperCase() + r.road.slice(1))}</span></span><span class="ct${PLOW_FEEDS.has(g.code) ? '' : ' none'}" id="c-${r.slug}">${PLOW_FEEDS.has(g.code) ? 'loading' : 'no truck positions published'}</span></a>`).join('\n')}
    </div>`).join('\n');
  const list = (arr) => arr.length <= 1 ? arr.join('') : arr.slice(0, -1).join(', ') + ' and ' + arr[arr.length - 1];
  const faq = [
    ['What does the count next to each resort mean?', `The number of DOT plow trucks whose last reported position is on that resort's access road within three search radii of the base, or inside the ring around the base, right now. It comes from each state's or province's own truck feed and refreshes when you load the page. A count of zero means no truck is reporting there at the moment, not that the road has been neglected.`],
    ['Why do the Washington and Oregon resorts say no truck positions?', `WSDOT and ODOT do not put their plows on a public feed. Their resort pages show the cameras within reach of the base and the closure and crash reports instead, and say so plainly.`],
    ['Is a plow on the road the same as the road being open?', `No. A pin is a position a truck reported. The closure list on each page is the DOT's own word on whether the road is open, and the resort's snow report covers the mountain and the parking. The three together are the picture; none of them alone is.`],
  ];
  const faqHtml = faq.map(([q, a]) => `    <details><summary>${q}</summary><p>${a}</p></details>`).join('\n');
  const ld = [
    { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Ski resort roads, live', url, description: desc, isPartOf: { '@type': 'WebSite', name: 'MileCheck', url: 'https://milecheckapp.com/' } },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a.replace(/<[^>]+>/g, '') } })) },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'MileCheck', item: 'https://milecheckapp.com/' }, { '@type': 'ListItem', position: 2, name: 'Ski resort roads', item: url }] },
  ];
  const hubData = RESORTS.filter((r) => PLOW_FEEDS.has(r.state)).map((r) => ({ slug: r.slug, state: r.state, lat: r.lat, lon: r.lon, radius: r.radius, routes: r.routes }));
  return head({ title, desc, url, ld, spCss: sp.css }) + `
  <div class="sk-hero">
${sp.html}
    <div class="eyebrow">Ski resort roads · ${RESORTS.length} resorts · ${byState.length} states and provinces</div>
    <h1>What is the road to your ski resort like right now?</h1>
    <p class="sub">One page per resort. Each one puts the DOT's plow trucks on the access road, the cameras within reach of the base, and the closures and crashes on that road on one map, with the chain law and the resort's own snow report beside it. ${list(plowStates.map((g) => g.reg.name))} publish truck positions. ${list(noPlow.map((g) => g.reg.name))} do not, and those pages say so and show the cameras instead. The count beside each resort is the trucks reporting on its road now; it refreshes when you load the page.</p>
  </div>

  <div class="sk-states">
${sections}
  </div>

  <section class="sk-guide">
    <h2>How to read a resort page</h2>
    <p>A plow pin is where a truck was when it last reported, with the route and mile the DOT snapped it to and the time of that report. It is a position, not a statement about the lane behind it. Trucks that have not reported in an hour are faded and labelled. The camera dots show the surface itself where the DOT has one on the road. The closure list is the DOT's own feed; nothing listed means nothing posted, which is not the same as open. The resort's snow report, linked on every page, covers the mountain and the lots.</p>
    <p>Statewide, the same trucks are on the <a href="/snowplows/">snowplow map</a>. The summit pages for <a href="/passes/">the mountain passes</a> add the summit weather, and the <a href="/chain-laws/">chain law pages</a> explain the restriction levels before a storm puts them on a sign.</p>
  </section>

  <section class="sk-faq">
    <h2>Questions</h2>
${faqHtml}
  </section>

  <div class="co-cta">
    <h2>The same alerts on your route, as you drive</h2>
    <p>MileCheck shows your mile marker and the DOT alerts ahead of you, offline in dead zones, on CarPlay and Android Auto. Premium starts with a free trial.</p>
    <div class="btns">
      <a class="primary" href="https://apps.apple.com/us/app/milecheck/id6759212851" target="_blank" rel="noopener">iOS App Store</a>
      <a class="ghost" href="https://play.google.com/store/apps/details?id=app.milecheck.mobile" target="_blank" rel="noopener">Google Play</a>
    </div>
  </div>

  <p class="sk-related">More: <a href="/snowplows/">snowplow map</a> · <a href="/passes/">mountain passes</a> · <a href="/chain-laws/">chain laws</a> · <a href="/cameras/">highway cameras</a> · <a href="/maps/">all maps</a></p>

` + footer('Plow positions: state and provincial DOTs via MileCheck. A plow pin is a reported position, not a statement about the road surface.') + sp.js + `
<script>
(function(){
var WORKER='https://milepost-proxy.leahgerber93.workers.dev',AGENCY=window.MCPlows?MCPlows.AGENCY:{};
var RES=${JSON.stringify(hubData)};
${MATCH_JS}
var byState={};RES.forEach(function(r){(byState[r.state]=byState[r.state]||[]).push(r);});
Object.keys(byState).forEach(function(st){
  fetch(WORKER+'/plows?state='+st,{cache:'no-store'}).then(function(r){if(!r.ok)throw new Error(r.status);return r.json();}).then(function(d){
    var all=((d&&d.plows)||[]).filter(function(t){return isFinite(+t.lat)&&isFinite(+t.lon);}).map(function(t){return MCPlows.normalize(t,AGENCY[st]);});
    byState[st].forEach(function(res){var keys=keysOf(res);var hit=all.filter(function(t){return onRoad(res,keys,t.lat,t.lon,t.route);});var fresh=hit.filter(function(t){return !t.stale;}).length,old=hit.length-fresh;var el=document.getElementById('c-'+res.slug);if(!el)return;var mx=!!(MCPlows.MIXED&&MCPlows.MIXED[st]);if(!hit.length){el.textContent=mx?'no trucks reporting now':'no plows reporting now';el.className='ct none';}else if(!fresh){el.textContent=old+(old===1?' older report only':' older reports only');el.className='ct none';}else{el.textContent=fresh+(fresh===1?(mx?' truck':' plow'):(mx?' trucks':' plows'))+' reporting'+(old?' · '+old+' older':'');el.className='ct';}});
  }).catch(function(){byState[st].forEach(function(res){var el=document.getElementById('c-'+res.slug);if(el){el.textContent='feed unavailable';el.className='ct none';}});});
});
})();</script>

</body>
</html>`;
}

let n = 0;
for (const r of RESORTS) {
  if (only.length && !only.includes(r.slug)) continue;
  const dir = rel(`ski/${r.slug}`);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), resortPage(r));
  n++;
  console.log(`wrote ski/${r.slug}/index.html  (${r.name}, ${r.state}${PLOW_FEEDS.has(r.state) ? '' : ', no plow feed'})`);
}
if (!only.length) { fs.writeFileSync(rel('ski/index.html'), hubPage()); console.log('wrote ski/index.html'); }
console.log(SPON.summary());
const byState = {};
for (const r of RESORTS) byState[r.state] = (byState[r.state] || 0) + 1;
console.log(`\nGenerated ${n} resort pages. By region: ${Object.entries(byState).map(([k, v]) => `${k} ${v}`).join(', ')}`);
