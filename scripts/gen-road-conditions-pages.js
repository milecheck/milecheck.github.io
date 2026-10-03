// gen-road-conditions-pages.js — /road-conditions/<state>/ for all 50 states, plus the
// /road-conditions/ index (2026-09-28). The page type the site never had: Search Console
// showed "arizona road conditions" and "arizona road trip" impressions with no page to
// rank, because Arizona only had cameras, a mile-marker post and a Labor Day recap.
//
// Each state page = live closures + crashes from that state's DOT feed (the Worker's
// /incidents?state=XX, same call the /closures/ map makes), a map bounded to the state,
// the state's cameras / passes / corridors / drawbridges / guides wired in, two prose
// sections adapted from the approved mile-marker guide, a road-trip checklist, the
// September archive numbers, and a FAQ. Content per state: scripts/road-conditions/states.cjs.
//
// Run: node scripts/gen-road-conditions-pages.js [state-slug ...]
// Then: node scripts/add-nav-search.mjs && node scripts/build-search-index.mjs && node scripts/build-sitemap.mjs
// A fetch failure on the page is shown as "unavailable", never as an all-clear (the
// /closures/ rule, ChatGPT review 2026-08-21).
'use strict';
const fs = require('fs');
const path = require('path');
const SPON = require('./lib/sponsor-slot');
const STATES = require('./road-conditions/states.cjs');
const SLOT_CSS = SPON.slot({ kind: 'live', slug: 'road-conditions', name: '(css only)' }).css; // one call, reused by every page's <style>

const ROOT = path.resolve(__dirname, '..');
const rel = (p) => path.join(ROOT, p);
const exists = (p) => fs.existsSync(rel(p));
const slugOf = (name) => name.toLowerCase().replace(/[^a-z]+/g, '-');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const only = process.argv.slice(2);

// Site inventory these pages link into. Keep in step with the generators named.
const CORRIDORS = [ // scripts/gen-corridor-pages.js
  ['i-5', 'I-5', ['CA', 'OR', 'WA']], ['i-90', 'I-90', ['WA', 'ID', 'MT', 'WY', 'SD', 'MN', 'WI', 'IL', 'IN', 'OH', 'PA', 'NY', 'MA']],
  ['i-95', 'I-95', ['FL', 'GA', 'SC', 'NC', 'VA', 'MD', 'DE', 'PA', 'NJ', 'NY', 'CT', 'RI', 'MA', 'NH', 'ME']],
  ['i-80', 'I-80', ['CA', 'NV', 'UT', 'WY', 'NE', 'IA', 'IL', 'IN', 'OH', 'PA', 'NJ']], ['i-10', 'I-10', ['CA', 'AZ', 'NM', 'TX', 'LA', 'MS', 'AL', 'FL']],
  ['i-15', 'I-15', ['CA', 'NV', 'AZ', 'UT', 'ID', 'MT']], ['i-4', 'I-4', ['FL']], ['i-75', 'I-75', ['FL', 'GA', 'TN', 'KY', 'OH', 'MI']],
  ['i-94', 'I-94', ['MT', 'ND', 'MN', 'WI', 'IL', 'IN', 'MI']], ['i-70', 'I-70', ['UT', 'CO', 'KS', 'MO', 'IL', 'IN', 'OH', 'WV', 'PA', 'MD']],
  ['i-40', 'I-40', ['CA', 'AZ', 'NM', 'TX', 'OK', 'AR', 'TN', 'NC']], ['i-35', 'I-35', ['TX', 'OK', 'KS', 'MO', 'IA', 'MN']],
  ['i-20', 'I-20', ['TX', 'LA', 'MS', 'AL', 'GA', 'SC']], ['i-65', 'I-65', ['AL', 'TN', 'KY', 'IN']], ['i-81', 'I-81', ['TN', 'VA', 'WV', 'MD', 'PA', 'NY']],
];
const PASSES = [ // scripts/gen-pass-pages.js
  ['snoqualmie', 'Snoqualmie Pass', 'I-90', 'WA'], ['stevens', 'Stevens Pass', 'US-2', 'WA'], ['crystal-mountain', 'Crystal Mountain (SR-410)', 'SR-410', 'WA'],
  ['siskiyou', 'Siskiyou Summit', 'I-5', 'OR'], ['cabbage-hill', 'Cabbage Hill', 'I-84', 'OR'], ['anthony-lakes', 'Anthony Lakes', 'OR-86', 'OR'],
  ['grapevine', 'The Grapevine (Tejon Pass)', 'I-5', 'CA'], ['donner', 'Donner Pass', 'I-80', 'CA'], ['cajon', 'Cajon Pass', 'I-15', 'CA'],
  ['parleys', 'Parleys Summit', 'I-80', 'UT'], ['little-cottonwood', 'Little Cottonwood Canyon', 'SR-210', 'UT'],
  ['eisenhower', 'Eisenhower Tunnel', 'I-70', 'CO'], ['vail', 'Vail Pass', 'I-70', 'CO'],
].filter(([slug]) => exists(`passes/${slug}/index.html`));
const CITY_CAMS = { // scripts/gen-city-camera-pages.js
  atlanta: 'GA', birmingham: 'AL', buffalo: 'NY', cincinnati: 'OH', cleveland: 'OH', columbus: 'OH', detroit: 'MI', 'las-vegas': 'NV', 'los-angeles': 'CA',
  miami: 'FL', milwaukee: 'WI', 'new-orleans': 'LA', 'new-york-city': 'NY', orlando: 'FL', philadelphia: 'PA', phoenix: 'AZ', pittsburgh: 'PA', portland: 'OR',
  sacramento: 'CA', 'salt-lake-city': 'UT', 'san-diego': 'CA', 'san-francisco': 'CA', seattle: 'WA', tampa: 'FL',
};
const cityName = (slug) => slug.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ').replace('New York City', 'New York City').replace('Las Vegas', 'Las Vegas');
const MOUNTAINS = { WA: ['rainier', 'baker', 'sthelens', 'olympics', 'angeles'], OR: ['hood'], AK: ['denali'] }; // /mountains/<slug>/ (Mountain Visibility)
const MOUNTAIN_NAMES = { rainier: 'Mount Rainier', baker: 'Mount Baker', sthelens: 'Mount St. Helens', olympics: 'the Olympics', angeles: 'Mount Angeles', hood: 'Mount Hood', denali: 'Denali' };

const REPORT = JSON.parse(fs.readFileSync(rel('data/road-report-september-2026.json'), 'utf8'));
const SEPT = Object.fromEntries((REPORT.jurisdictionSummary || []).map((j) => [j.state, j]));

// Shared chrome, lifted from a page every other generator matches (GA4 tag byte-identical).
const REF = fs.readFileSync(rel('best-portable-jump-starters/index.html'), 'utf8');
const GA4 = (REF.match(/<!-- ga4 -->[\s\S]*?<!-- \/ga4 -->/) || [''])[0];
if (!GA4) throw new Error('GA4 tag not found in reference page');
const SIGNUP_CSS = `.mc-signup{background:#F4F8F6;border-top:1px solid #E4EAE6;border-bottom:1px solid #E4EAE6;padding:44px 0;}
      .mc-signup .mc-signup-inner{max-width:560px;margin:0 auto;text-align:center;padding:0 20px;}
      .mc-signup .mc-eyebrow{font-family:'Inter',-apple-system,sans-serif;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#00A86B;margin:0 0 8px;}
      .mc-signup h2{font-family:'Inter',-apple-system,sans-serif;font-size:24px;font-weight:800;letter-spacing:-.01em;color:#0F1419;margin:0 0 8px;}
      .mc-signup .mc-sub{font-family:'Inter',-apple-system,sans-serif;font-size:15px;line-height:1.55;color:#5A6670;margin:0 auto 18px;max-width:44ch;}
      .mc-signup .mc-sub a{color:#00A86B;font-weight:700;}
      .mc-signup .ml-form-embedContent{display:none !important;}
      .mc-signup .ml-form-embedWrapper{background:transparent !important;box-shadow:none !important;max-width:440px;margin:0 auto;}
      .mc-signup input[type=email]{border-radius:8px !important;}
      .mc-signup button,.mc-signup .primary{background:#00C880 !important;border-radius:8px !important;font-weight:700 !important;}`;
const SIGNUP = `<!-- signup:start -->
  <section class="mc-signup" id="subscribe">
    <style>
      ${SIGNUP_CSS}
    </style>
    <div class="mc-signup-inner">
      <p class="mc-eyebrow">The Monthly Highway Report</p>
      <h2>Closures and crashes on US highways, once a month</h2>
      <p class="mc-sub">The month's numbers from DOT feeds in all 50 states and BC. <a href="/blog/road-report-september-2026.html">See the September report</a>. No spam.</p>
      <div class="ml-embedded" data-form="LjADY8"></div>
    </div>
  </section>
<!-- signup:end -->`;
const ML_LOADER = `<!-- MailerLite Universal -->
  <script>
  (function(w,d,e,u,f,l,n){w[f]=w[f]||function(){(w[f].q=w[f].q||[]).push(arguments);},l=d.createElement(e),l.async=1,l.src=u,n=d.getElementsByTagName(e)[0],n.parentNode.insertBefore(l,n);})(window,document,'script','https://assets.mailerlite.com/js/universal.js','ml');
  ml('account', '2507175');
  </script>
  <!-- End MailerLite Universal -->`;
const NAV_JS = `<script>(function(){var t=document.querySelector(".nav-toggle"),n=document.querySelector(".primary-nav");if(t&&n){t.addEventListener("click",function(){n.classList.toggle("open");});document.addEventListener("click",function(e){if(!e.target.closest(".header-inner"))n.classList.remove("open");})}})();</script>`;
const SEARCH_LINK = `<a href="/search/" class="nav-search"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/></svg><span>Search</span></a>`;

const CSS = `    .rc-wrap{max-width:1160px;margin:0 auto;padding:30px 20px 10px;}
    .rc-eyebrow{font-size:13px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:#0f7a4f;margin:0 0 6px;}
    .rc-wrap h1{font-size:clamp(27px,4.4vw,40px);line-height:1.12;letter-spacing:-0.02em;margin:0 0 10px;}
    .rc-lede{font-size:16.5px;line-height:1.6;color:#3a444d;max-width:78ch;margin:0 0 18px;}
    .rc-lede a{color:#0f7a4f;font-weight:700;text-decoration:none;}
    .rc-live{display:grid;grid-template-columns:1.45fr .55fr;gap:16px;}
    @media(max-width:860px){.rc-live{grid-template-columns:1fr;}}
    .rc-mapbox{position:relative;border:1px solid #E5E5E5;border-radius:14px;overflow:hidden;min-height:400px;height:58vh;background:#eef0e9;}
    #rcmap{position:absolute;inset:0;}
    .leaflet-container{font-family:Inter,sans-serif;}
    .rc-status{position:absolute;top:12px;left:56px;right:12px;z-index:800;background:rgba(255,255,255,.95);border:1px solid #E5E5E5;border-radius:10px;padding:8px 12px;font-weight:700;font-size:13.5px;color:#0E1116;line-height:1.35;}
    .rc-status.err{color:#b4231a;}
    .rc-status .rc-upd{color:#5b6670;font-weight:600;}
    .rc-dot{display:block;width:14px;height:14px;border-radius:50%;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.4);}
    .rc-dot.big{width:18px;height:18px;}
    .rc-side{display:flex;flex-direction:column;gap:12px;min-height:0;}
    .rc-list{border:1px solid #E5E5E5;border-radius:14px;background:#fff;overflow:hidden;display:flex;flex-direction:column;max-height:58vh;}
    .rc-list .lh{padding:11px 14px;border-bottom:1px solid #E5E5E5;font-weight:800;font-size:14px;display:flex;justify-content:space-between;align-items:center;gap:8px;}
    .rc-list .lh label{font-size:12px;font-weight:600;color:#5b6670;display:flex;align-items:center;gap:5px;cursor:pointer;}
    .rc-rows{overflow-y:auto;}
    .rc-row{padding:11px 14px;border-bottom:1px solid #F0F0EE;cursor:pointer;}
    .rc-row:hover{background:#F7F5EE;}
    .rc-row .t{display:flex;justify-content:space-between;gap:10px;align-items:baseline;}
    .rc-row .rt{font-weight:800;font-size:14px;}
    .rc-row .kd{font-weight:800;font-size:11px;letter-spacing:.05em;text-transform:uppercase;white-space:nowrap;}
    .rc-row .kd.closure{color:#cf3320;} .rc-row .kd.crash{color:#d9640f;} .rc-row .kd.weather{color:#2563eb;} .rc-row .kd.hazard{color:#7C3AED;} .rc-row .kd.work{color:#a16207;}
    .rc-row .sub{color:#5b6670;font-size:12.5px;margin-top:3px;line-height:1.45;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
    .rc-empty{padding:28px 14px;text-align:center;color:#5b6670;font-size:14px;line-height:1.5;}
    .rc-empty b{color:#0f7a4f;font-size:15px;display:block;margin-bottom:4px;}
    .rc-empty.err b{color:#b4231a;}
    .rc-legend{display:flex;flex-wrap:wrap;gap:6px 14px;font-size:12.5px;color:#5b6670;margin:10px 0 0;}
    .rc-legend span{display:inline-flex;align-items:center;gap:6px;}
    .rc-legend i{display:inline-block;width:10px;height:10px;border-radius:50%;}
    .rc-official{border:1px solid #E5E5E5;border-radius:14px;background:#fff;padding:14px 16px;font-size:14px;line-height:1.55;color:#3a444d;}
    .rc-official a{color:#0f7a4f;font-weight:700;text-decoration:none;}
    .rc-body{max-width:1160px;margin:0 auto;padding:10px 20px 40px;}
    .rc-body h2{font-size:23px;margin:32px 0 10px;letter-spacing:-0.01em;}
    .rc-body p{font-size:16px;line-height:1.7;color:#2a333b;max-width:78ch;margin:0 0 14px;}
    .rc-body a{color:#0f7a4f;font-weight:700;text-decoration:none;}
    .rc-body a:hover{text-decoration:underline;}
    .rc-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px;margin:8px 0 6px;}
    .rc-card{display:block;border:1px solid #E5E5E5;border-radius:12px;background:#fff;padding:14px 16px;text-decoration:none;color:inherit;}
    .rc-card:hover{border-color:#0E1116;}
    .rc-card .k{font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#0f7a4f;}
    .rc-card h3{font-size:15.5px;margin:4px 0 4px;color:#0E1116;}
    .rc-card p{font-size:13.5px;line-height:1.45;color:#5b6670;margin:0;}
    .rc-steps{counter-reset:s;padding:0;margin:0 0 6px;list-style:none;max-width:78ch;}
    .rc-steps li{position:relative;padding:0 0 12px 40px;font-size:16px;line-height:1.6;color:#2a333b;}
    .rc-steps li::before{counter-increment:s;content:counter(s);position:absolute;left:0;top:2px;width:26px;height:26px;border-radius:50%;background:#0f7a4f;color:#fff;font-weight:800;font-size:13px;display:flex;align-items:center;justify-content:center;}
    .rc-sept{border-left:3px solid #E5E5E5;padding:2px 0 2px 14px;color:#5b6670;font-size:14.5px;line-height:1.6;max-width:78ch;margin:0 0 6px;}
    .rc-sept a{color:#0f7a4f;font-weight:700;}
    .faq details{border:1px solid #E5E5E5;border-radius:12px;background:#fff;padding:14px 18px;margin-bottom:10px;}
    .faq summary{font-weight:700;font-size:16px;cursor:pointer;}
    .faq p{margin:10px 0 0;}
    .cta{border:1px solid #E5E5E5;border-radius:16px;background:linear-gradient(135deg,#f4fbf7,#ffffff);padding:24px 22px;margin:30px 0 8px;text-align:center;}
    .cta h3{font-size:21px;margin:0 0 8px;}
    .cta p{font-size:15.5px;color:#3a444d;margin:0 auto 14px;max-width:560px;}
    .cta .btns{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;}
    .cta .btns a{display:inline-block;padding:11px 20px;border-radius:10px;font-weight:700;font-size:14.5px;text-decoration:none;}
    .cta .btns a.primary{background:#0f7a4f;color:#fff;}
    .cta .btns a.ghost{border:1px solid #0F1419;color:#0F1419;}
    .rc-states{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:10px;margin:14px 0 8px;}
    .rc-state{display:flex;justify-content:space-between;align-items:baseline;gap:8px;border:1px solid #E5E5E5;border-radius:12px;background:#fff;padding:12px 14px;text-decoration:none;color:inherit;}
    .rc-state:hover{border-color:#0E1116;}
    .rc-state b{font-size:15px;} .rc-state span{font-size:12px;color:#8A939B;font-weight:700;letter-spacing:.04em;}
    .rc-related{color:#5b6670;font-size:14px;margin-top:26px;}
    .rc-related a{color:#0f7a4f;font-weight:700;text-decoration:none;}
    @media(max-width:760px){.rc-mapbox{height:52vh;} .leaflet-control-zoom{display:none;} .rc-status{left:12px;font-size:12px;padding:6px 10px;} .rc-list{max-height:none;} .rc-rows{max-height:48vh;}}`;

function head({ title, desc, url, ld, extraHead = '' }) {
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
${extraHead}${ld.map((o) => `  <script type="application/ld+json">${JSON.stringify(o)}</script>`).join('\n')}
  <style>
${CSS}
  /* spon:css */
${SLOT_CSS}
/* /spon:css */
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
        ${SEARCH_LINK}
        <a href="/get/" class="nav-cta">Get the app</a>
      </nav>
    </div>
  </header>
`;
}
function footer(campaign, learn) {
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
            <li><a href="https://apps.apple.com/app/apple-store/id6759212851?pt=128447811&ct=${campaign}&mt=8" target="_blank" rel="noopener">iOS App Store</a></li>
            <li><a href="https://play.google.com/store/apps/details?id=app.milecheck.mobile&referrer=utm_source%3Dmilecheckapp.com%26utm_medium%3Dweb%26utm_campaign%3D${campaign}" target="_blank" rel="noopener">Google Play</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <p class="footer-label">Live maps</p>
          <ul class="footer-list">
${learn.map(([h, t]) => `            <li><a href="${h}">${t}</a></li>`).join('\n')}
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
      <p class="footer-fineprint">&copy; 2026 MileCheck LLC. Road data: state DOTs via MileCheck. Always follow posted signs and official detours.</p>
      <p class="footer-fineprint footer-disclosure">MileCheck is a participant in the Amazon Services LLC Associates Program. As an Amazon Associate I earn from qualifying purchases.</p>
    </div>
  </footer>
${NAV_JS}
  ${ML_LOADER}
`;
}

const LEAFLET = `  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <link rel="stylesheet" href="https://unpkg.com/leaflet-gesture-handling@1.2.2/dist/leaflet-gesture-handling.min.css">
  <script src="https://unpkg.com/leaflet-gesture-handling@1.2.2/dist/leaflet-gesture-handling.min.js"></script>
`;

// The live block. Classification mirrors /closures/ (isClosed) and the app's type codes:
// CL closure, AC crash, WE weather, HZ hazard, RW roadwork. Work zones are off by default
// (California alone posts thousands). Nothing here ever reads as "all clear" on a failure.
function liveJs(s) {
  return `<script>
(function(){
var ST=${JSON.stringify(s.code)},DOT=${JSON.stringify(s.dot)},DOTURL=${JSON.stringify(s.dotUrl)},B=${JSON.stringify(s.bounds)};
var WORKER="https://milepost-proxy.leahgerber93.workers.dev";
var map=L.map('rcmap',{gestureHandling:('ontouchstart' in window),scrollWheelZoom:true,attributionControl:true});
var ESRI='https://server.arcgisonline.com/ArcGIS/rest/services/';
L.tileLayer(ESRI+'World_Topo_Map/MapServer/tile/{z}/{y}/{x}',{attribution:'Esri, USGS · alerts: '+DOT+' via MileCheck',maxZoom:14}).addTo(map);
map.fitBounds(B);
var layer=L.layerGroup().addTo(map),workLayer=L.layerGroup();
var status=document.getElementById('rcStatus'),rows=document.getElementById('rcRows'),count=document.getElementById('rcCount'),workToggle=document.getElementById('rcWork');
var COLOR={closure:'#cf3320',crash:'#f97316',weather:'#3B82F6',hazard:'#7C3AED',partial:'#a16207',work:'#F59E0B',other:'#6B7280'};
var LABEL={closure:'Closed',crash:'Crash',weather:'Weather',hazard:'Hazard',partial:'Ramp / lane',work:'Work zone',other:'Alert'};
var ON_TOGGLE={partial:1,work:1,other:1};
function clean(t,n){var x=(t||'').replace(/<[^>]+>/g,' ').replace(/&[a-z#0-9]+;/g,' ').replace(/\\s+/g,' ').replace(/(\\s*\\|)+\\s*(Status:\\s*\\w+)?\\s*$/i,'').trim();n=n||200;if(x.length<=n)return x;var c=x.slice(0,n),sp=c.lastIndexOf(' ');return (sp>n*0.6?c.slice(0,sp):c).replace(/[\\s,;:.|-]+$/,'')+'…';}
function partial(txt){return /\\b(ramp|shoulder|sidewalk|rest area)\\b/.test(txt)||/\\b(right|left|center|middle|one|two|three|hov|express|inside|outside|slow|fast) lanes?\\b/.test(txt)||/\\blane (closed|closure|blocked|restriction)/.test(txt)||/\\blanes? (is|are) (closed|blocked)/.test(txt)||/\\bsingle lane\\b|\\balternating\\b|\\breduced to one lane\\b/.test(txt);}
function fullWords(txt){return /\\b(freeway|roadway|highway|road|route|interstate|bridge|tunnel|pass) (is )?closed\\b|\\bclosed (in )?both directions\\b|\\bfull closure\\b|\\bclosed to (all|thru|through) traffic\\b/.test(txt);}
function kind(r){var t=String(r['event-type-id']||'').toUpperCase(),txt=(clean(r.headline)+' '+clean(r['impact-desc'])+' '+clean(r.description)).toLowerCase();
  var closedText=/\\bclos(ed|ure)\\b/.test(txt);
  if((t==='CL'||closedText)&&(fullWords(txt)||!partial(txt)))return 'closure';
  if((t==='CL'||closedText)&&partial(txt))return 'partial';
  if(t==='AC'||/\\b(crash|collision|accident|overturn|rollover|jackknif)/.test(txt))return 'crash';
  if(t==='WE'||/\\b(snow|ice|icy|flood|fog|high wind|chain|blizzard|slick)/.test(txt))return 'weather';
  if(t==='HZ')return 'hazard';
  if(t==='RW')return 'work';
  return 'other';}
function when(r){var v=r['last-updated']||r['update-time']||r['date-updated']||r['entry-time']||r['start-time'];if(!v)return null;var d=typeof v==='number'?new Date(v<1e12?v*1000:v):new Date(v);return isNaN(d)?null:d;}
function dirN(d){d=String(d||'').trim().toLowerCase();if(!d||/^(both|all|unknown|n\\/a)/.test(d))return '';var m=d.match(/^(north|south|east|west)/);if(m)return m[1][0].toUpperCase()+'B';return /^(nb|sb|eb|wb)$/.test(d)?d.toUpperCase():'';}
function starts(r){var v=r['start-time'];if(!v)return null;var d=typeof v==='number'?new Date(v<1e12?v*1000:v):new Date(v);return isNaN(d)?null:d;}
function ago(d){var m=Math.round((Date.now()-d.getTime())/60000);if(m<1)return 'just now';if(m<60)return m+' min ago';var h=Math.round(m/60);if(h<48)return h+' h ago';return Math.round(h/24)+' d ago';}
function icon(k){return L.divIcon({className:'',html:'<span class="rc-dot'+(k==='closure'?' big':'')+'" style="background:'+COLOR[k]+'"></span>',iconSize:[k==='closure'?18:14,k==='closure'?18:14],iconAnchor:[k==='closure'?9:7,k==='closure'?9:7]});}
var markers={};
function render(list){
  layer.clearLayers();workLayer.clearLayers();markers={};
  var shown=0;
  list.forEach(function(a,i){if(!isFinite(a.lat)||!isFinite(a.lon)||!a.lat)return;if(ON_TOGGLE[a.k]&&shown>500)return;var m=L.marker([a.lat,a.lon],{icon:icon(a.k),zIndexOffset:a.k==='closure'?900:a.k==='crash'?800:100,opacity:a.future?0.55:1});
    m.bindPopup('<div class="fpop"><div class="fp-nm">'+esc(a.route?a.route+(a.mp?' · MP '+a.mp:''):LABEL[a.k])+'</div><div class="fp-st">'+LABEL[a.k]+(a.dir?' · '+esc(a.dir):'')+(a.at?' · updated '+ago(a.at):'')+'</div><div class="fp-row">'+esc(a.fd&&a.fd.indexOf(a.fh)>=0?a.fd:a.fh)+'</div>'+(a.fd&&a.fh.indexOf(a.fd)<0&&a.fd.indexOf(a.fh)<0?'<div class="fp-row">'+esc(a.fd)+'</div>':'')+'</div>',{maxHeight:260,maxWidth:320});
    (ON_TOGGLE[a.k]?workLayer:layer).addLayer(m);markers[i]=m;shown++;});
  var listed=list.filter(function(a){return !ON_TOGGLE[a.k];}).slice(0,80);
  if(!listed.length){rows.innerHTML='<div class="rc-empty"><b>No closures or crashes in the '+esc(DOT)+' feed right now.</b>Ramp, lane and work-zone alerts are on the map when the box above is checked. '+esc(DOT)+' is the official source.</div>';}
  else rows.innerHTML=listed.map(function(a){var i=list.indexOf(a);return '<div class="rc-row" data-i="'+i+'"><div class="t"><span class="rt">'+esc(a.route||LABEL[a.k])+(a.mp?' · MP '+esc(a.mp):'')+(a.dir?' '+esc(a.dir):'')+'</span><span class="kd '+a.k+'">'+(a.future?'Scheduled':LABEL[a.k])+'</span></div><div class="sub">'+(a.future?'<b>Starts '+a.start.toLocaleDateString([], {month:'short',day:'numeric'})+'.</b> ':'')+esc(a.head)+(a.at?' <span style="white-space:nowrap">· '+ago(a.at)+'</span>':'')+'</div></div>';}).join('');
  var n={},sched=0;list.forEach(function(a){if(a.future){if(!ON_TOGGLE[a.k])sched++;return;}n[a.k]=(n[a.k]||0)+1;});
  var parts=[];['closure','crash','weather','hazard'].forEach(function(k){if(n[k])parts.push(n[k]+' '+(k==='closure'?(n[k]===1?'closure':'closures'):k==='crash'?(n[k]===1?'crash':'crashes'):k));});
  if(sched)parts.push(sched+' scheduled');if(n.partial||n.work)parts.push(((n.partial||0)+(n.work||0))+' ramp, lane and work-zone alerts');
  status.className='rc-status';status.innerHTML=(parts.length?parts.join(' · '):'No active alerts')+' <span class="rc-upd">· '+esc(DOT)+' via MileCheck · '+new Date().toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})+'</span>';
  count.textContent=listed.length?listed.length+' listed':'';
}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
rows.addEventListener('click',function(e){var r=e.target.closest('.rc-row');if(!r)return;var m=markers[r.getAttribute('data-i')];if(!m)return;if(!map.hasLayer(workLayer)&&workLayer.hasLayer(m))return;map.setView(m.getLatLng(),Math.max(map.getZoom(),9));m.openPopup();});
workToggle.addEventListener('change',function(){if(workToggle.checked)workLayer.addTo(map);else map.removeLayer(workLayer);});
var last=null;
function load(){
  fetch(WORKER+'/incidents?state='+ST,{cache:'no-store'}).then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json();}).then(function(d){
    if(!Array.isArray(d['incident-reports']))throw new Error('unexpected payload');
    var list=d['incident-reports'].map(function(r){var loc=r.location||{},sl=loc['start-location']||{};var st=starts(r),future=!!(st&&st.getTime()>Date.now()+3600000);return {k:kind(r),lat:+sl['start-lat'],lon:+sl['start-long'],mp:sl['start-mile-marker']?String(sl['start-mile-marker']).replace(/\\.0+$/,''):'',route:(loc['route-id']||'').trim(),dir:dirN(loc.direction),head:clean(r.headline||r.description||r['impact-desc']||'Alert',180),fh:clean(r.headline||r.description||r['impact-desc']||'Alert',1500),fd:clean(r.description||r['impact-desc']||'',1500),at:when(r),start:st,future:future};});
    var order={closure:0,crash:1,weather:2,hazard:3,partial:4,other:5,work:6};
    list.sort(function(a,b){return (a.future-b.future)||order[a.k]-order[b.k]||((b.at?b.at.getTime():0)-(a.at?a.at.getTime():0));});
    last=list;render(list);
  }).catch(function(e){
    status.className='rc-status err';status.textContent='Live data from '+DOT+' is unavailable right now. Check '+DOT+' directly.';
    if(!last)rows.innerHTML='<div class="rc-empty err"><b>Could not load the '+esc(DOT)+' feed.</b>That is an outage, not an all-clear. <a href="'+esc(DOTURL)+'" target="_blank" rel="noopener">Open '+esc(DOT)+'</a> for the official list.</div>';
  });
}
load();setInterval(load,300000);
})();</script>`;
}

function statePage(s) {
  const slug = slugOf(s.name);
  const url = `https://milecheckapp.com/road-conditions/${slug}/`;
  const title = `${s.name} Road Conditions Now: Closures &amp; Cameras | MileCheck`;
  const desc = `Live ${s.name} road conditions from ${s.dot}: closures and crashes by route and mile marker, with cameras, passes and corridors. Updates every 5 minutes.`;
  const cams = exists(`cameras/${slug}/index.html`);
  const cities = Object.entries(CITY_CAMS).filter(([, st]) => st === s.code).map(([c]) => c);
  const passes = PASSES.filter((p) => p[3] === s.code);
  const corridors = CORRIDORS.filter((c) => c[2].includes(s.code));
  const bridges = exists(`bridges/${slug}/index.html`);
  const guide = exists(`blog/mile-markers-${slug}.html`);
  const recap = exists(`blog/labor-day-weekend-recap-2026-states/${slug}.html`);
  const mountains = (MOUNTAINS[s.code] || []).filter((m) => exists(`mountains/${m}/index.html`));
  const sept = SEPT[s.code];
  const sp = SPON.slot({ kind: 'live', slug: `road-conditions-${slug}`, state: s.code, name: s.name });

  const cards = [];
  cards.push(['Official source', s.dot, `${s.name}'s DOT traveler site. The list of record for closures, restrictions and detours.`, s.dotUrl, true]);
  if (cams) cards.push(['Cameras', `${s.name} highway cameras`, `Every ${s.dot} camera on one map, with the route and mile marker where the DOT gives one.`, `/cameras/${slug}/`]);
  for (const c of cities) cards.push(['City cameras', `${cityName(c)} cameras`, `Live cameras on the ${cityName(c)} freeways.`, `/cameras/${c}/`]);
  for (const [ps, pn, pr] of passes) cards.push(['Mountain pass', pn, `${pr} over the summit: cameras, restrictions and closures on one page.`, `/passes/${ps}/`]);
  for (const [cs, cn] of corridors) cards.push(['Corridor', `${cn} conditions`, `The whole ${cn} corridor, every state it crosses, alerts by mile marker.`, `/corridors/${cs}/`]);
  if (bridges) cards.push(['Drawbridges', `${s.name} drawbridges`, `Where the movable spans are and the federal opening rule for each.`, `/bridges/${slug}/`]);
  for (const m of mountains) cards.push(['Mountain visibility', `Is ${MOUNTAIN_NAMES[m]} out?`, `Whether the mountain is visible right now, and from where.`, `/mountains/${m}/`]);
  if (guide) cards.push(['Mile markers', `Mile markers in ${s.name}`, `How ${s.name} numbers its highways and where the markers matter most.`, `/blog/mile-markers-${slug}.html`]);
  if (recap) cards.push(['Report', `Labor Day 2026 in ${s.name}`, `What the ${s.dot} feed carried over the holiday weekend.`, `/blog/labor-day-weekend-recap-2026-states/${slug}.html`]);
  const cardsHtml = cards.map(([k, h, p, href, ext]) => `      <a class="rc-card" href="${href}"${ext ? ' target="_blank" rel="noopener"' : ''}><span class="k">${k}</span><h3>${h}</h3><p>${p}</p></a>`).join('\n');

  const corridorLinks = corridors.map(([cs, cn]) => `<a href="/corridors/${cs}/">${cn}</a>`);
  const passLinks = passes.map(([ps, pn]) => `<a href="/passes/${ps}/">${pn}</a>`);
  const joinList = (arr) => arr.length <= 1 ? arr.join('') : arr.slice(0, -1).join(', ') + ' and ' + arr[arr.length - 1];

  let septHtml = '';
  if (sept && sept.total >= 10) {
    const bits = [];
    if (sept.closure) bits.push(`${sept.closure.toLocaleString('en-US')} closure ${sept.closure === 1 ? 'report' : 'reports'}`);
    if (sept.crash) bits.push(`${sept.crash.toLocaleString('en-US')} crash ${sept.crash === 1 ? 'report' : 'reports'}`);
    if (sept.construction) bits.push(`${sept.construction.toLocaleString('en-US')} work-zone ${sept.construction === 1 ? 'report' : 'reports'}`);
    if (sept.weather) bits.push(`${sept.weather.toLocaleString('en-US')} weather ${sept.weather === 1 ? 'report' : 'reports'}`);
    const routes = (sept.topRoutes || []).filter((r) => /^(I|US|SR|[A-Z]{2})-\d/.test(r)).slice(0, 3);
    septHtml = `    <h2>What September looked like</h2>
    <p class="rc-sept">In September 2026, MileCheck's archive of the ${s.dot} feed held ${sept.total.toLocaleString('en-US')} unique ${sept.total === 1 ? 'report' : 'reports'}${bits.length ? `, including ${joinList(bits)}` : ''}.${routes.length ? ` The routes with the most reports were ${joinList(routes)}.` : ''} Counts reflect what the feed publishes, so a state whose DOT posts only closures shows only closures. <a href="/blog/road-report-september-2026.html">Read the September Highway Report</a>.</p>
`;
  }

  const chains = /chain/i.test(s.season);
  const faq = [
    [`Is the highway closed in ${s.name} right now?`, `The map above shows every full closure ${s.dot} is publishing as a red marker, crashes in orange, and weather and hazard alerts in blue and purple. Closures the DOT has posted for a future date are listed as scheduled, and ramp and lane closures sit under the toggle so the list stays readable. It reloads every five minutes. If the feed cannot be reached the page says so instead of showing an empty map. For the official list, open <a href="${s.dotUrl}" target="_blank" rel="noopener">${s.dot}</a>.`],
    [`Where do I check ${s.name} road conditions?`, `<a href="${s.dotUrl}" target="_blank" rel="noopener">${s.dot}</a> is the official source, and dialing 511 in most states reaches the same information by phone. This page reads the same ${s.dot} feed and adds ${cams ? `the <a href="/cameras/${slug}/">${s.name} cameras</a>, ` : ''}the corridor and pass pages, and your own mile marker if you carry the app.`],
    ...(chains ? [[`Are chains required in ${s.name}?`, `Chain and traction rules are set by ${s.dot} per road and per direction, and they change with the storm. Restrictions the DOT publishes as alerts appear on the map above and on ${passLinks.length ? `the ${joinList(passLinks)} ${passLinks.length === 1 ? 'page' : 'pages'}` : 'the corridor pages'}. Always follow the posted signs. <a href="/chains-required-explained/">What "chains required" means</a> explains the levels.`]] : []),
    [`How often does this page update?`, `Every five minutes. MileCheck's server fetches the ${s.dot} feed, converts it to one format shared by all 50 states, and caches it for five minutes. Each alert also carries the time the DOT last updated it, shown in the list.`],
    [`Does the MileCheck app show these alerts?`, `Yes. The app shows the same ${s.dot} alerts on your route, ahead of your position, with the mile marker you are passing. The mile marker works offline in all 50 states. Live alerts are part of MileCheck Premium, $49.99 a year or $9.99 a month after a 7-day free trial.`],
  ];
  const faqHtml = faq.map(([q, a]) => `      <details><summary>${q}</summary><p>${a}</p></details>`).join('\n');
  const ld = [
    { '@context': 'https://schema.org', '@type': 'WebPage', name: `${s.name} road conditions`, url, description: desc, isPartOf: { '@type': 'WebSite', name: 'MileCheck', url: 'https://milecheckapp.com/' }, about: { '@type': 'Place', name: s.name } },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a.replace(/<[^>]+>/g, '') } })) },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'MileCheck', item: 'https://milecheckapp.com/' }, { '@type': 'ListItem', position: 2, name: 'Road conditions', item: 'https://milecheckapp.com/road-conditions/' }, { '@type': 'ListItem', position: 3, name: s.name, item: url }] },
  ];

  const campaign = `road-conditions-${slug}`;
  const html = head({ title, desc, url, ld, extraHead: LEAFLET }) + `
  <div class="rc-wrap">
    <!-- spon:start -->
${sp.html}
<!-- spon:end -->
    <p class="rc-eyebrow">Road conditions</p>
    <h1>${s.name} road conditions right now</h1>
    <p class="rc-lede">Every closure and crash ${s.dot} is publishing, on one map with the route and mile marker. Below it: ${cams ? `the <a href="/cameras/${slug}/">live cameras</a>, ` : ''}${passLinks.length ? `${joinList(passLinks)}, ` : ''}${corridorLinks.length ? `the ${joinList(corridorLinks)} corridor ${corridorLinks.length === 1 ? 'page' : 'pages'}, ` : ''}and what the season does to ${s.name}'s highways. For the whole country, see the <a href="/closures/">US closures map</a>.</p>

    <div class="rc-live">
      <div class="rc-mapbox">
        <span class="rc-status" id="rcStatus">Loading ${s.dot} alerts&hellip;</span>
        <div id="rcmap" role="region" aria-label="${s.name} road alerts map"></div>
      </div>
      <div class="rc-side">
        <div class="rc-list">
          <div class="lh"><span>Closures and crashes <span id="rcCount" style="color:#8A939B;font-weight:600;font-size:12px;"></span></span><label><input type="checkbox" id="rcWork"> Ramps, lanes, work zones</label></div>
          <div class="rc-rows" id="rcRows"><div class="rc-empty">Loading the ${s.dot} feed&hellip;</div></div>
        </div>
        <div class="rc-official">Source: <a href="${s.dotUrl}" target="_blank" rel="noopener">${s.dot}</a>, read every five minutes and converted to the same format MileCheck uses for all 50 states. Ramp, lane and shoulder closures are listed under the toggle, not as full closures. Closures with a future start date are marked scheduled. Positions are the DOT's; mile markers are approximate.</div>
      </div>
    </div>
    <div class="rc-legend"><span><i style="background:#cf3320"></i>Full closure</span><span><i style="background:#f97316"></i>Crash</span><span><i style="background:#3B82F6"></i>Weather</span><span><i style="background:#7C3AED"></i>Hazard</span><span><i style="background:#a16207"></i>Ramp or lane</span><span><i style="background:#F59E0B"></i>Work zone</span><span style="color:#8A939B">Faded markers are scheduled, not active</span></div>
  </div>

  <div class="rc-body">
    <h2>Where to look next</h2>
    <div class="rc-cards">
${cardsHtml}
    </div>

    <h2>Driving across ${s.name}</h2>
    <p>${s.drive}</p>

    <h2>What the season does to ${s.name}'s highways</h2>
    <p>${s.season}</p>

    <h2>Before a ${s.name} road trip</h2>
    <ol class="rc-steps">
      <li>Check the map above for anything red on your route, then open <a href="${s.dotUrl}" target="_blank" rel="noopener">${s.dot}</a> for the DOT's own detour and restriction text.</li>
      ${cams ? `<li>Look at the road. The <a href="/cameras/${slug}/">${s.name} cameras</a> show the pavement itself, and most carry the mile marker.</li>` : `<li>Look at the road where you can. MileCheck's <a href="/cameras/">camera maps</a> cover 27 states; ${s.dot} may carry ${s.name}'s own.</li>`}
      ${passLinks.length ? `<li>If the route crosses ${joinList(passLinks)}, read the pass page for the summit cameras, snow depth and chain rules.</li>` : ''}
      ${corridorLinks.length ? `<li>For the long haul, the ${joinList(corridorLinks)} corridor ${corridorLinks.length === 1 ? 'page carries' : 'pages carry'} alerts for every state the route crosses, not only ${s.name}.</li>` : ''}
      <li>Know how to say where you are. Dispatch, 911 and tow companies ask for the route, the direction and the mile marker. <a href="/report-location/">How to report your location on the highway</a>.</li>
      <li>Carry the app. The mile marker works offline in all 50 states, and the same ${s.dot} alerts show on your route as you drive.</li>
    </ol>

${septHtml}    <h2>Questions, answered</h2>
    <div class="faq">
${faqHtml}
    </div>

    <div class="cta">
      <h3>Know exactly where you are &mdash; live</h3>
      <p>Your mile marker shows even offline. ${s.dot} alerts on your route and the nearest camera are part of MileCheck Premium and need a connection to update. Runs on CarPlay and Android Auto.</p>
      <div class="btns">
        <a class="primary" href="https://apps.apple.com/app/apple-store/id6759212851?pt=128447811&ct=${campaign}&mt=8" target="_blank" rel="noopener">iOS App Store</a>
        <a class="ghost" href="https://play.google.com/store/apps/details?id=app.milecheck.mobile&referrer=utm_source%3Dmilecheckapp.com%26utm_medium%3Dweb%26utm_campaign%3D${campaign}" target="_blank" rel="noopener">Google Play</a>
      </div>
    </div>

    <p class="rc-related">Other states: <a href="/road-conditions/">road conditions by state</a> · <a href="/closures/">US closures map</a> · <a href="/passes/">Mountain passes</a> · <a href="/corridors/">Interstate corridors</a> · <a href="/cameras/">Cameras</a></p>
  </div>

  ${SIGNUP}

` + footer(campaign, [['/closures/', 'US closures map'], ['/road-conditions/', 'Road conditions by state'], ['/cameras/', 'Live cameras'], ['/maps/', 'All maps']]) + liveJs(s) + `
<!-- spon:start -->${sp.js}<!-- spon:end -->
</body>
</html>
`;
  fs.mkdirSync(rel(`road-conditions/${slug}`), { recursive: true });
  fs.writeFileSync(rel(`road-conditions/${slug}/index.html`), html);
  return slug;
}

function indexPage() {
  const url = 'https://milecheckapp.com/road-conditions/';
  const title = 'Road Conditions by State: Live Closures &amp; Crashes | MileCheck';
  const desc = 'Current road conditions for all 50 states, one page per state: live closures and crashes from the state DOT, cameras, mountain passes, interstate corridors and what the season does to the roads.';
  const sp = SPON.slot({ kind: 'live', slug: 'road-conditions', state: '', name: 'Road conditions by state' });
  const ld = [
    { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Road conditions by state', url, description: desc, isPartOf: { '@type': 'WebSite', name: 'MileCheck', url: 'https://milecheckapp.com/' } },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'MileCheck', item: 'https://milecheckapp.com/' }, { '@type': 'ListItem', position: 2, name: 'Road conditions', item: url }] },
  ];
  const cards = STATES.map((s) => `      <a class="rc-state" href="/road-conditions/${slugOf(s.name)}/"><b>${s.name}</b><span>${s.dot}</span></a>`).join('\n');
  const html = head({ title, desc, url, ld }) + `
  <div class="rc-wrap">
    <!-- spon:start -->
${sp.html}
<!-- spon:end -->
    <p class="rc-eyebrow">Road conditions</p>
    <h1>Road conditions by state</h1>
    <p class="rc-lede">One page per state. Each one reads that state's DOT feed every five minutes and puts the current closures and crashes on a map with the route and mile marker, then links the state's cameras, mountain passes and interstate corridors, and says what the season does to its highways. For one national view, use the <a href="/closures/">US closures map</a>.</p>
    <div class="rc-states">
${cards}
    </div>
  </div>
  <div class="rc-body">
    <h2>How these pages work</h2>
    <p>Every state DOT publishes road alerts, and no two publish them the same way. MileCheck's server reads each feed and converts it to one format, the same one the app uses. A closure in Washington and a closure in Texas arrive looking identical. These pages show that feed for one state at a time, so the map is the DOT's own list, not a summary of it. <a href="/blog/how-one-app-reads-fifty-dot-systems.html">How one app reads 50 DOT systems</a> explains the plumbing.</p>
    <p>What a page can show depends on what the DOT publishes. Some states post closures and crashes with a mile marker on every one. Some post closures only. A quiet map in Kentucky is normal, and a busy one in California is too. Where a feed cannot be reached the page says so instead of showing an empty map.</p>
    <p class="rc-related">Also: <a href="/passes/">Mountain passes</a> · <a href="/corridors/">Interstate corridors</a> · <a href="/cameras/">Cameras by state and city</a> · <a href="/states/">Mile markers by state</a> · <a href="/canada/">Canada</a></p>
  </div>

  ${SIGNUP}

` + footer('road-conditions', [['/closures/', 'US closures map'], ['/cameras/', 'Live cameras'], ['/passes/', 'Mountain passes'], ['/maps/', 'All maps']]) + `<!-- spon:start -->${sp.js}<!-- spon:end -->
</body>
</html>
`;
  fs.mkdirSync(rel('road-conditions'), { recursive: true });
  fs.writeFileSync(rel('road-conditions/index.html'), html);
}

const wanted = only.length ? STATES.filter((s) => only.includes(slugOf(s.name)) || only.includes(s.code)) : STATES;
if (STATES.length !== 50) throw new Error(`expected 50 states, have ${STATES.length}`);
const done = wanted.map(statePage);
if (!only.length) indexPage();
console.log(`road-conditions: ${done.length} state pages${only.length ? '' : ' + index'} written`);
console.log(SPON.summary());
