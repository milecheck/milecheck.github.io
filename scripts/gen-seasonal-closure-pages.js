// gen-seasonal-closure-pages.js — /seasonal/<road>/, /seasonal/<state>/ and the /seasonal/ hub
// (2026-10-13, items 1 and 5 of docs/site-growth-plan-2026-10-13.md in the app repo).
//
// One page per road in data/seasonal-closures.json, titled as the reader's question
// ("Is Tioga Pass open?"), plus one roundup per state ("Which roads close for winter in
// Utah?"). Each road page shows what the state DOT feed is posting for that route right
// now (the Worker's /incidents?state=XX, the same call /road-conditions/ makes) and the
// dates the agency itself publishes, quoted and linked, with the date we read them.
//
// Rules, from the voice file: the page never says a road is open. It says what the feed
// holds and what the agency's page says. A fetch failure reads as unavailable, never as
// an all-clear. No superlatives, no "free".
//
// Two entries in the JSON are second sources for a road already listed (Chinook Pass
// reopen timing, Guardsman Pass as UDOT lists it on SR-224). They are folded into the
// first entry, so 35 records make 33 road pages.
//
// Chrome is copied from gen-road-conditions-pages.js (not held). Does not read or touch
// gen-pass-pages.js or scripts/lib/road-status*.js.
//
// Run: node scripts/gen-seasonal-closure-pages.js
// Then: node scripts/add-nav-search.mjs && node scripts/build-search-index.mjs && node scripts/build-sitemap.mjs
'use strict';
const fs = require('fs');
const path = require('path');
const SPON = require('./lib/sponsor-slot');
const STATES = require('./road-conditions/states.cjs');
const RAW = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'seasonal-closures.json'), 'utf8'));
const SLOT_CSS = SPON.slot({ kind: 'live', slug: 'seasonal', name: '(css only)' }).css;

const ROOT = path.resolve(__dirname, '..');
const rel = (p) => path.join(ROOT, p);
const exists = (p) => fs.existsSync(rel(p));
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const STATE = Object.fromEntries(STATES.map((s) => [s.code, s]));
const stateSlug = (code) => STATE[code].name.toLowerCase().replace(/[^a-z]+/g, '-');
const joinList = (arr) => arr.length <= 1 ? arr.join('') : arr.slice(0, -1).join(', ') + ' and ' + arr[arr.length - 1];
const fmtDate = (iso) => new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

// Per-road settings keyed by the JSON `name`. `short` is the name a reader types. `the`
// puts "the" in the question ("Is the Denali Highway open?"). `words` are text matches
// in the feed; `routeOnly:false` means the route number alone is too broad (a long
// highway, or a park road the state feed does not carry) and only text matches count.
// `mergeInto` folds a second-source record into the named page as an extra source.
const CFG = {
  'North Cascades Highway': { slug: 'north-cascades-highway', short: 'the North Cascades Highway', q: 'Is the North Cascades Highway (SR 20) open?', words: ['north cascades', 'rainy pass', 'washington pass', 'ross dam', 'silver star', 'newhalem', 'early winters'] },
  'Chinook Pass': { slug: 'chinook-pass', short: 'Chinook Pass', words: ['chinook'] },
  'Chinook Pass (reopen timing)': { mergeInto: 'Chinook Pass' },
  'Cayuse Pass': { slug: 'cayuse-pass', short: 'Cayuse Pass', words: ['cayuse'] },
  'Mount Baker Highway, Road to Artist Point': { slug: 'artist-point', short: 'the Road to Artist Point', q: 'Is the Road to Artist Point (SR 542) open?', words: ['artist point', 'mount baker', 'mt. baker', 'mt baker', 'heather meadows'] },
  'McKenzie Pass Highway (Old McKenzie Highway)': { slug: 'mckenzie-pass', short: 'McKenzie Pass', q: 'Is McKenzie Pass (OR 242) open?', words: ['mckenzie pass', 'old mckenzie'] },
  'Sonora Pass': { slug: 'sonora-pass', short: 'Sonora Pass', words: ['sonora pass', 'sonora'] },
  'Ebbetts Pass': { slug: 'ebbetts-pass', short: 'Ebbetts Pass', words: ['ebbetts'] },
  'Monitor Pass': { slug: 'monitor-pass', short: 'Monitor Pass', words: ['monitor pass'] },
  'Tioga Road / Tioga Pass (SR 120 W at Lee Vining Gate through Yosemite NP)': { slug: 'tioga-pass', short: 'Tioga Pass', words: ['tioga', 'lee vining', 'yosemite'], routeOnly: false, park: 'Yosemite National Park' },
  'Lassen Park Highway (park road, NPS-managed; not a Caltrans closure)': { slug: 'lassen-park-highway', short: 'the Lassen Park Highway', words: ['lassen'], routeOnly: false, park: 'Lassen Volcanic National Park' },
  'Independence Pass': { slug: 'independence-pass', short: 'Independence Pass', words: ['independence pass', 'independence'] },
  'Trail Ridge Road (NPS park road)': { slug: 'trail-ridge-road', short: 'Trail Ridge Road', words: ['trail ridge', 'rocky mountain national park', 'many parks curve'], routeOnly: false, park: 'Rocky Mountain National Park' },
  'Snowy Range Scenic Byway': { slug: 'snowy-range', short: 'the Snowy Range Scenic Byway', q: 'Is the Snowy Range road (WY 130) open?', words: ['snowy range', 'ryan park', 'green rock'] },
  'Battle Pass': { slug: 'battle-pass', short: 'Battle Pass', q: 'Is Battle Pass (WY 70) open?', words: ['battle pass'] },
  'Cooke City to Pilot Creek': { slug: 'cooke-city-pilot-creek', short: 'the road from Pilot Creek to Cooke City', q: 'Is US 212 between Pilot Creek and Cooke City open?', words: ['cooke city', 'pilot creek', 'chief joseph'], states: ['MT', 'WY'], routeOnly: false },
  'Beartooth Highway': { slug: 'beartooth-highway', short: 'the Beartooth Highway', words: ['beartooth'], states: ['MT', 'WY'] },
  'Skalkaho Pass': { slug: 'skalkaho-pass', short: 'Skalkaho Pass', words: ['skalkaho'] },
  'Looking Glass Highway': { slug: 'looking-glass-highway', short: 'the Looking Glass Highway', q: 'Is the Looking Glass Highway (MT 49) open?', words: ['looking glass'] },
  'Thompson Pass': { slug: 'thompson-pass', short: 'Thompson Pass', q: 'Is Thompson Pass (Montana S-471) open?', words: ['thompson pass'] },
  'Going-to-the-Sun Road (NPS park road, not state highway)': { slug: 'going-to-the-sun-road', short: 'Going-to-the-Sun Road', words: ['going-to-the-sun', 'going to the sun', 'logan pass', 'glacier national park'], routeOnly: false, park: 'Glacier National Park' },
  'Monte Cristo': { slug: 'monte-cristo', short: 'Monte Cristo', q: 'Is Monte Cristo (SR 39) open?', words: ['monte cristo'] },
  'East Canyon': { slug: 'east-canyon', short: 'East Canyon', q: 'Is East Canyon (SR 65) open?', words: ['east canyon'] },
  'Guardsman Pass': { slug: 'guardsman-pass', short: 'Guardsman Pass', words: ['guardsman'] },
  'Guardsman Pass (as listed by UDOT)': { mergeInto: 'Guardsman Pass' },
  'American Fork Canyon / Alpine Loop': { slug: 'alpine-loop', short: 'the Alpine Loop', q: 'Is the Alpine Loop (SR 92) open?', words: ['alpine loop', 'american fork canyon'] },
  'Mirror Lake Highway': { slug: 'mirror-lake-highway', short: 'the Mirror Lake Highway', words: ['mirror lake'] },
  'Wolf Creek Summit': { slug: 'wolf-creek-summit', short: 'Wolf Creek Summit', q: 'Is Wolf Creek Summit (SR 35) open?', words: ['wolf creek'] },
  'Mount Holly': { slug: 'mount-holly', short: 'the Mount Holly road', q: 'Is SR 153 to Mount Holly open?', words: ['mount holly', 'mt. holly', 'puffer lake', 'eagle point'] },
  'Cedar Breaks National Monument': { slug: 'cedar-breaks', short: 'the road to Cedar Breaks', q: 'Is SR 148 to Cedar Breaks open?', words: ['cedar breaks'] },
  'Banner Summit closure': { slug: 'banner-summit', short: 'SH-21 over Banner Summit', q: 'Is Idaho 21 over Banner Summit open?', words: ['banner summit', 'grandjean', 'canyon creek'] },
  'Denali Highway': { slug: 'denali-highway', short: 'the Denali Highway', words: ['denali highway'], routeOnly: false },
  'Taylor Highway': { slug: 'taylor-highway', short: 'the Taylor Highway', words: ['taylor highway'], routeOnly: false },
  'McCarthy Road': { slug: 'mccarthy-road', short: 'the McCarthy Road', words: ['mccarthy'], routeOnly: false },
  'Eureka/Rampart Road': { slug: 'eureka-rampart-road', short: 'the Eureka and Rampart roads', q: 'Is the Eureka/Rampart Road open?', words: ['eureka', 'rampart'], routeOnly: false },
};

// Fold the records into pages.
const byName = new Map();
for (const r of RAW) {
  const c = CFG[r.name];
  if (!c) throw new Error(`no CFG entry for "${r.name}"`);
  if (c.mergeInto) {
    const host = byName.get(c.mergeInto);
    if (!host) throw new Error(`mergeInto "${c.mergeInto}" before its host`);
    host.extra.push({ label: r.route !== host.route ? `${r.route}, as UDOT lists it` : 'Reopening', url: r.sourceUrl, quote: r.sourceQuote, retrieved: r.retrieved });
    if (r.route !== host.route) host.routes.push(r.route);
    continue;
  }
  const states = c.states || r.state.split('/');
  byName.set(r.name, {
    ...r, ...c, routes: [r.route], states,
    extra: (r.extraSources || []).map((e) => ({ label: e.label, url: e.url })),
    q: c.q || `Is ${c.short} open?`,
  });
}
const ROADS = [...byName.values()];
const ROAD_STATES = [...new Set(ROADS.flatMap((r) => r.states))];
for (const s of ROAD_STATES) if (!STATE[s]) throw new Error(`unknown state ${s}`);
const slugs = ROADS.map((r) => r.slug);
if (new Set(slugs).size !== slugs.length) throw new Error('duplicate slug');
for (const s of ROAD_STATES) if (slugs.includes(stateSlug(s))) throw new Error(`slug collides with state ${s}`);

// Route id as the Worker posts it (WA "SR 20", CA "SR-120"/"CA-120", CO "SH-82", MT "MT-38",
// WY "WY-130", ID "SR-21", OR "OR242", UT "SR-190"). Compare with spaces and dashes removed.
function routeKeys(route, states) {
  const m = route.match(/^([A-Z]+)-(\d+)$/);
  if (!m) return []; // named roads (Going-to-the-Sun, McCarthy Road) match on words only
  const [, pre, num] = m;
  if (pre === 'US' || pre === 'I') return [pre + num];
  return [...new Set(['SR', 'SH', 'S', 'CA', 'WA', 'OR', 'CO', 'UT', 'MT', 'WY', 'ID', 'AK', ...states].map((p) => p + num))];
}
function agencyLabel(url) {
  if (/nps\.gov/.test(url)) return 'the National Park Service';
  if (/wsdot/.test(url)) return 'WSDOT';
  if (/dot\.ca\.gov/.test(url)) return 'Caltrans';
  if (/codot/.test(url)) return 'CDOT';
  if (/dot\.state\.wy/.test(url)) return 'WYDOT';
  if (/mdt\.mt\.gov/.test(url)) return 'MDT';
  if (/udot/.test(url)) return 'UDOT';
  if (/itd\.idaho/.test(url)) return 'ITD';
  if (/dot\.alaska/.test(url)) return 'Alaska DOT&amp;PF';
  if (/ORDOT|govdelivery/.test(url)) return 'ODOT';
  if (/fs\.usda/.test(url)) return 'the Forest Service';
  return 'the agency';
}
// The JSON keeps research notes in the date fields. Show the reader the plain part.
function tidy(s) {
  if (!s) return '';
  if (/see prior entry/i.test(s)) return '';
  if (/^not stated/i.test(s) || /not on fetched page/i.test(s)) return 'The source page gives no date.';
  return s
    .replace(/\s*\(page: [^)]*\)/i, '')
    .replace(/\s*\(no date given\)/i, '. No date given')
    .replace(/\s*\(no fixed date on page\)/i, '')
    .replace(/\s*\(ITD advisory page\)/i, '')
    .replace(/\s*\(not on fetched page\)/i, '')
    .replace(/\s*\(per Caltrans District 10 page listing; segment detail from search summary\)/i, '')
    .replace(/\s*\(no mileposts given\)/i, '')
    .replace(/\s*\(no mileposts on page\)/i, '')
    .replace(/\s*\(no segment text on page\)/i, '')
    .replace(/\.\.$/, '.');
}
const noDates = (s) => /^No 2026-27 dates found/.test(s) ? 'No 2026-27 dates were posted on the source page when it was read.' : s.replace(/^No\. /, '');

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
      <h2>Get your state's monthly road alert report</h2>
      <p class="mc-sub">Your state's reported closures, crashes and roadwork, once a month by email. <a href="/blog/road-report-september-2026.html">See the September report</a>. No spam.</p>
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

const CSS = `    .sc-wrap{max-width:1160px;margin:0 auto;padding:30px 20px 10px;}
    .sc-eyebrow{font-size:13px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:#0f7a4f;margin:0 0 6px;}
    .sc-wrap h1{font-size:clamp(27px,4.4vw,40px);line-height:1.12;letter-spacing:-0.02em;margin:0 0 10px;}
    .sc-lede{font-size:16.5px;line-height:1.6;color:#3a444d;max-width:78ch;margin:0 0 18px;}
    .sc-lede a,.sc-body a,.sc-facts a,.sc-live a{color:#0f7a4f;font-weight:700;text-decoration:none;}
    .sc-lede a:hover,.sc-body a:hover,.sc-facts a:hover,.sc-live a:hover{text-decoration:underline;}
    .sc-grid{display:grid;grid-template-columns:1.1fr .9fr;gap:16px;align-items:start;}
    @media(max-width:860px){.sc-grid{grid-template-columns:1fr;}}
    .sc-live{border:1px solid #E5E5E5;border-radius:14px;background:#fff;overflow:hidden;}
    .sc-live .lh{padding:12px 16px;border-bottom:1px solid #E5E5E5;font-weight:800;font-size:14px;display:flex;justify-content:space-between;align-items:baseline;gap:8px;}
    .sc-live .lh span{color:#8A939B;font-weight:600;font-size:12px;}
    .sc-status{padding:12px 16px;font-weight:700;font-size:14.5px;line-height:1.45;color:#0E1116;border-bottom:1px solid #F0F0EE;}
    .sc-status.closed{color:#b4231a;background:#FEF2F2;}
    .sc-status.err{color:#b4231a;}
    .sc-status small{display:block;color:#5b6670;font-weight:600;font-size:12.5px;margin-top:3px;}
    .sc-row{padding:11px 16px;border-bottom:1px solid #F0F0EE;}
    .sc-row .t{display:flex;justify-content:space-between;gap:10px;align-items:baseline;}
    .sc-row .rt{font-weight:800;font-size:14px;}
    .sc-row .kd{font-weight:800;font-size:11px;letter-spacing:.05em;text-transform:uppercase;white-space:nowrap;}
    .sc-row .kd.closure{color:#cf3320;} .sc-row .kd.weather{color:#2563eb;} .sc-row .kd.partial,.sc-row .kd.work{color:#a16207;} .sc-row .kd.other,.sc-row .kd.crash,.sc-row .kd.hazard{color:#5b6670;}
    .sc-row .sub{color:#3a444d;font-size:13px;margin-top:3px;line-height:1.45;}
    .sc-note{padding:12px 16px;font-size:13px;line-height:1.5;color:#5b6670;}
    .sc-facts{border:1px solid #E5E5E5;border-radius:14px;background:#fff;padding:4px 16px 8px;}
    .sc-facts dl{margin:0;}
    .sc-facts dt{font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#0f7a4f;margin:12px 0 2px;}
    .sc-facts dd{margin:0;font-size:15px;line-height:1.5;color:#0E1116;}
    .sc-quote{border-left:3px solid #E5E5E5;padding:2px 0 2px 14px;color:#3a444d;font-size:14.5px;line-height:1.6;max-width:78ch;margin:8px 0 10px;}
    .sc-src{font-size:13px;color:#5b6670;}
    .sc-body{max-width:1160px;margin:0 auto;padding:10px 20px 40px;}
    .sc-body h2{font-size:23px;margin:32px 0 10px;letter-spacing:-0.01em;}
    .sc-body p{font-size:16px;line-height:1.7;color:#2a333b;max-width:78ch;margin:0 0 14px;}
    .sc-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px;margin:8px 0 6px;}
    .sc-card{display:block;border:1px solid #E5E5E5;border-radius:12px;background:#fff;padding:14px 16px;text-decoration:none;color:inherit;}
    .sc-card:hover{border-color:#0E1116;}
    .sc-card .k{font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#0f7a4f;}
    .sc-card h3{font-size:15.5px;margin:4px 0 4px;color:#0E1116;}
    .sc-card p{font-size:13.5px;line-height:1.45;color:#5b6670;margin:0;}
    .sc-roads{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px;margin:14px 0 8px;}
    .sc-road{display:block;border:1px solid #E5E5E5;border-radius:12px;background:#fff;padding:14px 16px;text-decoration:none;color:inherit;}
    .sc-road:hover{border-color:#0E1116;}
    .sc-road .k{font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#8A939B;}
    .sc-road h3{font-size:16px;margin:3px 0 5px;color:#0E1116;}
    .sc-road p{font-size:13.5px;line-height:1.45;color:#3a444d;margin:0;}
    .sc-states{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:10px;margin:14px 0 8px;}
    .sc-state{display:flex;justify-content:space-between;align-items:baseline;gap:8px;border:1px solid #E5E5E5;border-radius:12px;background:#fff;padding:12px 14px;text-decoration:none;color:inherit;}
    .sc-state:hover{border-color:#0E1116;}
    .sc-state b{font-size:15px;} .sc-state span{font-size:12px;color:#8A939B;font-weight:700;letter-spacing:.04em;}
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
    .sc-related{color:#5b6670;font-size:14px;margin-top:26px;}
    .sc-related a{color:#0f7a4f;font-weight:700;text-decoration:none;}`;

function head({ title, desc, url, ld }) {
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
${ld.map((o) => `  <script type="application/ld+json">${JSON.stringify(o)}</script>`).join('\n')}
  <style>
${CSS}
  /* spon:css */
${SLOT_CSS}
/* /spon:css */
  </style>
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

// The live block. Reads /incidents for each state the road sits in, keeps reports whose
// route id matches the road's route, or whose text names the road, and lists them. The
// closure test mirrors /road-conditions/: CL event type or closure wording, minus ramp,
// lane and shoulder reports and explicit negations. Never reads as an all-clear on failure.
function liveJs(r) {
  const keys = r.routeOnly === false ? [] : r.routes.flatMap((rt) => routeKeys(rt, r.states));
  const dots = r.states.map((s) => STATE[s].dot);
  return `<script>
(function(){
var STATES=${JSON.stringify(r.states)},DOTS=${JSON.stringify(dots)},KEYS=${JSON.stringify(keys)},WORDS=${JSON.stringify(r.words.map((w) => w.toLowerCase()))},ROUTE=${JSON.stringify(r.routes.join(' / '))};
var WORKER="https://milepost-proxy.leahgerber93.workers.dev";
var status=document.getElementById('scStatus'),rows=document.getElementById('scRows'),when=document.getElementById('scWhen');
var LABEL={closure:'Closed',partial:'Ramp / lane',weather:'Weather',work:'Work zone',crash:'Crash',hazard:'Hazard',other:'Report'};
function clean(t,n){var x=(t||'').replace(/<[^>]+>/g,' ').replace(/&[a-z#0-9]+;/g,' ').replace(/\\s+/g,' ').trim();n=n||220;if(x.length<=n)return x;var c=x.slice(0,n),sp=c.lastIndexOf(' ');return (sp>n*0.6?c.slice(0,sp):c).replace(/[\\s,;:.|-]+$/,'')+'…';}
function partial(txt){return /\\b(ramp|shoulder|sidewalk|rest area)\\b/.test(txt)||/\\b(right|left|center|middle|one|two|three|hov|express|inside|outside|slow|fast) lanes?\\b/.test(txt)||/\\blane (closed|closure|blocked|restriction)/.test(txt)||/\\blanes? (is|are) (closed|blocked)/.test(txt)||/\\bsingle lane\\b|\\balternating\\b|\\breduced to one lane\\b/.test(txt);}
function fullWords(txt){return /\\b(freeway|roadway|highway|road|route|pass|gate) (is )?closed\\b|\\bclosed (in )?both directions\\b|\\bfull closure\\b|\\bclosed to (all|thru|through|vehicle|wheeled) (traffic|vehicles)\\b|\\bclosed for the (season|winter)\\b|\\bseasonal(ly)? clos/.test(txt);}
function kind(r,txt){var t=String(r['event-type-id']||'').toUpperCase();
  var neg=/\\b(not|no|without|never)\\s+(?:(?:yet|been|be|longer|full|complete|road|lane|highway|any)\\s+)*clos(?:ed|ure|ures)\\b|\\bopen to traffic\\b|\\breopen(ed|s)?\\b/.test(txt);
  var closedText=!neg&&/\\bclos(ed|ure)\\b/.test(txt);
  if(closedText&&partial(txt))return 'partial';
  if(t==='CL'&&!neg&&!partial(txt))return 'closure';
  if(closedText&&fullWords(txt))return 'closure';
  if(t==='AC')return 'crash';
  if(t==='WE'||/\\b(snow|ice|icy|chain|traction|blizzard|slick|avalanche)/.test(txt))return 'weather';
  if(t==='HZ')return 'hazard';
  if(t==='RW')return 'work';
  return 'other';}
function norm(id){return String(id||'').toUpperCase().replace(/[^A-Z0-9]/g,'');}
function matches(r){var loc=r.location||{},id=norm(loc['route-id']);var txt=(clean(r.headline,2000)+' '+clean(r.description,2000)+' '+clean(r['impact-desc'],2000)+' '+(loc['location-name']||'')).toLowerCase();
  var byRoute=KEYS.indexOf(id)>=0,byWord=WORDS.some(function(w){return txt.indexOf(w)>=0;});return byRoute||byWord?{byWord:byWord,txt:txt}:null;}
function ago(d){var m=Math.round((Date.now()-d.getTime())/60000);if(m<1)return 'just now';if(m<60)return m+' min ago';var h=Math.round(m/60);if(h<48)return h+' h ago';return Math.round(h/24)+' d ago';}
function at(r){var v=r['last-updated']||r['update-time']||r['date-updated'];if(!v)return null;var d=typeof v==='number'?new Date(v<1e12?v*1000:v):new Date(v);return isNaN(d)?null:d;}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function render(list,failed){
  var dot=DOTS.join(' and ');
  var closures=list.filter(function(a){return a.k==='closure';});
  if(closures.length){status.className='sc-status closed';status.innerHTML=closures.length+(closures.length===1?' closure posted':' closures posted')+' for '+esc(ROUTE)+' in the '+esc(dot)+' feed.<small>The agency\\'s own post is the record. Positions and mile markers are the DOT\\'s.</small>';}
  else if(list.length){status.className='sc-status';status.innerHTML='No full closure posted for '+esc(ROUTE)+' in the '+esc(dot)+' feed. '+list.length+(list.length===1?' other report':' other reports')+' listed below.<small>This is what the feed holds, not a verdict on the road. Seasonal gates are sometimes announced on the agency page instead of the feed.</small>';}
  else{status.className='sc-status';status.innerHTML='Nothing posted for '+esc(ROUTE)+' in the '+esc(dot)+' feed right now.<small>This is what the feed holds, not a verdict on the road. Seasonal gates are sometimes announced on the agency page instead of the feed. The dates the agency gives are on this page.</small>';}
  if(failed.length){status.className='sc-status err';status.innerHTML='The '+esc(failed.join(' and '))+' feed could not be reached. That is an outage, not an all-clear.<small>Open the agency page linked under the dates on this page.</small>';}
  rows.innerHTML=list.map(function(a){return '<div class="sc-row"><div class="t"><span class="rt">'+esc(a.route||LABEL[a.k])+(a.mp?' · MP '+esc(a.mp):'')+'</span><span class="kd '+a.k+'">'+LABEL[a.k]+'</span></div><div class="sub">'+esc(a.head)+(a.at?' <span style="white-space:nowrap;color:#5b6670">· updated '+ago(a.at)+'</span>':'')+'</div></div>';}).join('');
  when.textContent=new Date().toLocaleTimeString([], {hour:'numeric',minute:'2-digit'});
}
function load(){
  Promise.all(STATES.map(function(st){return fetch(WORKER+'/incidents?state='+st,{cache:'no-store'}).then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json();}).then(function(d){if(!Array.isArray(d['incident-reports']))throw new Error('payload');return d['incident-reports'];}).catch(function(){return null;});})).then(function(res){
    var failed=[],list=[];
    res.forEach(function(arr,i){if(!arr){failed.push(DOTS[i]);return;}arr.forEach(function(r){var m=matches(r);if(!m)return;var loc=r.location||{},sl=loc['start-location']||{};list.push({k:kind(r,m.txt),byWord:m.byWord,route:(loc['route-id']||'').trim(),mp:sl['start-mile-marker']?String(sl['start-mile-marker']).replace(/\\.0+$/,''):'',head:clean(r.headline||r.description||r['impact-desc']||'Report',220),at:at(r)});});});
    var order={closure:0,weather:1,partial:2,work:3,hazard:4,crash:5,other:6};
    list.sort(function(a,b){return order[a.k]-order[b.k]||(b.byWord-a.byWord)||((b.at?b.at.getTime():0)-(a.at?a.at.getTime():0));});
    render(list.slice(0,40),failed);
  });
}
load();setInterval(load,300000);
})();</script>`;
}

const CTA = (campaign, dots) => `    <div class="cta">
      <h3>Know exactly where you are &mdash; live</h3>
      <p>Your mile marker shows even offline. ${dots} alerts on your route and the nearest camera are part of MileCheck Premium and need a connection to update. Runs on CarPlay and Android Auto.</p>
      <div class="btns">
        <a class="primary" href="https://apps.apple.com/app/apple-store/id6759212851?pt=128447811&ct=${campaign}&mt=8" target="_blank" rel="noopener">iOS App Store</a>
        <a class="ghost" href="https://play.google.com/store/apps/details?id=app.milecheck.mobile&referrer=utm_source%3Dmilecheckapp.com%26utm_medium%3Dweb%26utm_campaign%3D${campaign}" target="_blank" rel="noopener">Google Play</a>
      </div>
    </div>`;

function roadPage(r) {
  const url = `https://milecheckapp.com/seasonal/${r.slug}/`;
  const stNames = r.states.map((s) => STATE[s].name);
  const dots = r.states.map((s) => STATE[s].dot);
  const dotLinks = r.states.map((s) => `<a href="${STATE[s].dotUrl}" target="_blank" rel="noopener">${STATE[s].dot}</a>`);
  const agency = agencyLabel(r.sourceUrl);
  const title = `${esc(r.q)} Seasonal closure dates | MileCheck`;
  const desc = `${r.publicLine} What the ${dots.join(' and ')} feed is posting for ${r.routes.join(' and ')} right now, and the closure and reopening dates ${agency.replace('&amp;', '&')} publishes, with the source.`;
  const campaign = `seasonal-${r.slug}`;
  const sp = SPON.slot({ kind: 'live', slug: `seasonal-${r.slug}`, state: r.states[0], name: r.q });
  const closeTxt = tidy(r.typicalClose), reopenTxt = tidy(r.typicalReopen), segTxt = tidy(r.segment);
  const sameState = ROADS.filter((o) => o !== r && o.states.some((s) => r.states.includes(s)));

  const cards = [];
  for (const s of r.states) cards.push(['Official source', STATE[s].dot, `${STATE[s].name}'s DOT traveler site. The list of record for closures, restrictions and detours.`, STATE[s].dotUrl, true]);
  if (r.park) cards.push(['Park road', r.park, `The Park Service decides when this road closes and reopens. Its page carries the current status.`, r.sourceUrl, true]);
  for (const s of r.states) cards.push(['Winter roundup', `Which roads close for winter in ${STATE[s].name}?`, `Every seasonal closure MileCheck lists for ${STATE[s].name}, with the dates each agency gives.`, `/seasonal/${stateSlug(s)}/`]);
  for (const s of r.states) if (exists(`road-conditions/${stateSlug(s)}/index.html`)) cards.push(['Road conditions', `${STATE[s].name} road conditions`, `Every closure and crash ${STATE[s].dot} is posting, on one map with the mile marker.`, `/road-conditions/${stateSlug(s)}/`]);
  for (const s of r.states) if (exists(`cameras/${stateSlug(s)}/index.html`)) cards.push(['Cameras', `${STATE[s].name} highway cameras`, `Every ${STATE[s].dot} camera on one map, with the route and mile marker where the DOT gives one.`, `/cameras/${stateSlug(s)}/`]);
  const cardsHtml = cards.map(([k, h, p, href, ext]) => `      <a class="sc-card" href="${href}"${ext ? ' target="_blank" rel="noopener"' : ''}><span class="k">${k}</span><h3>${esc(h)}</h3><p>${p}</p></a>`).join('\n');

  const sources = [{ label: 'Source', url: r.sourceUrl, quote: r.sourceQuote, retrieved: r.retrieved }, ...r.extra];
  const sourcesHtml = sources.map((s) => `${s.quote ? `    <p class="sc-quote">&ldquo;${esc(s.quote)}&rdquo;</p>\n` : ''}    <p class="sc-src">${esc(s.label)}: <a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.url.replace(/^https?:\/\//, '').replace(/\/$/, ''))}</a>${s.retrieved ? `, read ${fmtDate(s.retrieved)}` : ''}.</p>`).join('\n');

  const faq = [
    [`When does ${r.short} close for the winter?`, `${closeTxt || 'The source page gives no closing date.'} That is what ${agency} publishes${r.retrieved ? `, read ${fmtDate(r.retrieved)}` : ''}. The gate goes in when the snow does, so the date moves from year to year. ${noDates(r.announced2026)}`],
    [`When does ${r.short} reopen?`, `${reopenTxt || 'The source page gives no reopening date.'} Plowing and avalanche work set the day, and the agency announces it when the road is ready.`],
    [`Where exactly does it close?`, segTxt ? `${segTxt}. The rest of ${r.routes.join(' and ')} is handled like any other road in ${joinList(stNames)}.` : `The source page does not describe the closure points. ${joinList(dotLinks)} posts the closure with its own location text.`],
    [`Where do I check whether ${r.short} is open today?`, `${joinList(dotLinks)} ${r.states.length === 1 ? 'is' : 'are'} the official source for the state highway${r.park ? `, and the Park Service page for ${r.park} carries the park road's status` : ''}. The block at the top of this page reads the same ${dots.join(' and ')} feed every five minutes and lists what is posted for ${r.routes.join(' and ')}. If the feed cannot be reached, the page says so instead of showing an empty list.`],
    [`Does the MileCheck app show this closure?`, `The app shows the same ${dots.join(' and ')} alerts on your route, ahead of your position, with the mile marker you are passing. The mile marker works offline in all 50 states. Live alerts are part of MileCheck Premium.`],
  ];
  const faqHtml = faq.map(([q, a]) => `      <details><summary>${esc(q)}</summary><p>${a}</p></details>`).join('\n');
  const ld = [
    { '@context': 'https://schema.org', '@type': 'WebPage', name: r.q, url, description: desc, isPartOf: { '@type': 'WebSite', name: 'MileCheck', url: 'https://milecheckapp.com/' }, about: { '@type': 'Place', name: r.short.replace(/^the /, ''), address: { '@type': 'PostalAddress', addressRegion: r.states[0], addressCountry: 'US' } } },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a.replace(/<[^>]+>/g, '') } })) },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'MileCheck', item: 'https://milecheckapp.com/' }, { '@type': 'ListItem', position: 2, name: 'Seasonal closures', item: 'https://milecheckapp.com/seasonal/' }, { '@type': 'ListItem', position: 3, name: STATE[r.states[0]].name, item: `https://milecheckapp.com/seasonal/${stateSlug(r.states[0])}/` }, { '@type': 'ListItem', position: 4, name: r.q, item: url }] },
  ];

  const html = head({ title, desc, url, ld }) + `
  <div class="sc-wrap">
    <!-- spon:start -->
${sp.html}
<!-- spon:end -->
    <p class="sc-eyebrow">Seasonal closure · ${esc(r.routes.join(' / '))} · ${esc(stNames.join(' and '))}</p>
    <h1>${esc(r.q)}</h1>
    <p class="sc-lede">${esc(r.publicLine)} Below: what the ${joinList(dotLinks)} feed is posting for ${esc(r.routes.join(' and '))} right now, and the dates ${agency} gives, quoted from its own page.${r.park ? ` This is a park road inside ${esc(r.park)}. The Park Service runs it, and the state feed may not carry its gate.` : ''}</p>

    <div class="sc-grid">
      <div class="sc-live">
        <div class="lh"><span style="color:#0E1116;font-size:14px;">Posted for ${esc(r.routes.join(' / '))} right now</span><span>${esc(dots.join(' and '))} via MileCheck · <span id="scWhen">loading</span></span></div>
        <div class="sc-status" id="scStatus">Reading the ${esc(dots.join(' and '))} feed&hellip;</div>
        <div id="scRows"></div>
        <div class="sc-note">Reports whose route is ${esc(r.routes.join(' or '))}, or whose text names ${esc(r.short)}. Reloads every five minutes. Ramp, lane and shoulder reports are labeled, not counted as closures.</div>
      </div>
      <div class="sc-facts">
        <dl>
          <dt>Usually closes</dt><dd>${esc(closeTxt || 'The source page gives no closing date.')}</dd>
          <dt>Usually reopens</dt><dd>${esc(reopenTxt || 'The source page gives no reopening date.')}</dd>
          <dt>Closure segment</dt><dd>${esc(segTxt || 'Not described on the source page.')}</dd>
          <dt>2026-27 dates</dt><dd>${esc(noDates(r.announced2026))}</dd>
          <dt>Who decides</dt><dd>${agency.charAt(0).toUpperCase() + agency.slice(1)}${r.states.length > 1 ? `, with ${dots.join(' and ')} posting the state highway` : ''}.</dd>
        </dl>
      </div>
    </div>
  </div>

  <div class="sc-body">
    <h2>What ${agency} says</h2>
${sourcesHtml}

    <h2>Where to look next</h2>
    <div class="sc-cards">
${cardsHtml}
    </div>

    <h2>Questions, answered</h2>
    <div class="faq">
${faqHtml}
    </div>

${CTA(campaign, dots.join(' and '))}

    <p class="sc-related">${sameState.length ? `Also in ${esc(stNames.join(' and '))}: ${sameState.map((o) => `<a href="/seasonal/${o.slug}/">${esc(o.short.replace(/^the /, ''))}</a>`).join(' · ')} · ` : ''}<a href="/seasonal/">All seasonal closures</a> · <a href="/passes/">Mountain passes</a> · <a href="/closures/">US closures map</a></p>
  </div>

  ${SIGNUP}

` + footer(campaign, [['/seasonal/', 'Seasonal closures'], ['/closures/', 'US closures map'], ['/passes/', 'Mountain passes'], ['/maps/', 'All maps']]) + liveJs(r) + `
<!-- spon:start -->${sp.js}<!-- spon:end -->
</body>
</html>
`;
  fs.mkdirSync(rel(`seasonal/${r.slug}`), { recursive: true });
  fs.writeFileSync(rel(`seasonal/${r.slug}/index.html`), html);
}

function statePage(code) {
  const s = STATE[code];
  const slug = stateSlug(code);
  const roads = ROADS.filter((r) => r.states.includes(code));
  const url = `https://milecheckapp.com/seasonal/${slug}/`;
  const q = `Which roads close for winter in ${s.name}?`;
  const title = `${esc(q)} Seasonal closures and dates | MileCheck`;
  const desc = `${roads.length} ${s.name} roads that close for the winter, with the closing and reopening dates each agency publishes and what ${s.dot} is posting for each one right now.`;
  const campaign = `seasonal-${slug}`;
  const sp = SPON.slot({ kind: 'live', slug: `seasonal-${slug}`, state: code, name: q });
  const parks = roads.filter((r) => r.park);
  const cards = roads.map((r) => `      <a class="sc-road" href="/seasonal/${r.slug}/"><span class="k">${esc(r.routes.join(' / '))}${r.park ? ' · park road' : ''}</span><h3>${esc(r.q)}</h3><p>${esc(r.publicLine)}</p></a>`).join('\n');
  const ld = [
    { '@context': 'https://schema.org', '@type': 'CollectionPage', name: q, url, description: desc, isPartOf: { '@type': 'WebSite', name: 'MileCheck', url: 'https://milecheckapp.com/' }, about: { '@type': 'Place', name: s.name } },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'MileCheck', item: 'https://milecheckapp.com/' }, { '@type': 'ListItem', position: 2, name: 'Seasonal closures', item: 'https://milecheckapp.com/seasonal/' }, { '@type': 'ListItem', position: 3, name: s.name, item: url }] },
  ];
  const html = head({ title, desc, url, ld }) + `
  <div class="sc-wrap">
    <!-- spon:start -->
${sp.html}
<!-- spon:end -->
    <p class="sc-eyebrow">Seasonal closures · ${esc(s.name)}</p>
    <h1>${esc(q)}</h1>
    <p class="sc-lede">${roads.length} ${roads.length === 1 ? 'road' : 'roads'} in ${esc(s.name)} ${roads.length === 1 ? 'closes' : 'close'} for the winter on a schedule the agency publishes${parks.length ? `, ${parks.length === 1 ? 'one of them a park road run by the National Park Service' : `${parks.length} of them park roads run by the National Park Service`}` : ''}. Each page below shows what the <a href="${s.dotUrl}" target="_blank" rel="noopener">${s.dot}</a> feed is posting for that route right now and quotes the closing and reopening dates from the agency's own page. The dates move with the snow. Storm closures on roads that stay open all winter are on the <a href="/road-conditions/${slug}/">${esc(s.name)} road conditions</a> page.</p>
    <div class="sc-roads">
${cards}
    </div>
  </div>

  <div class="sc-body">
    <h2>How to read these pages</h2>
    <p>A seasonal closure is a gate the agency locks for the winter, not a storm closure. ${s.dot} posts storm closures and chain rules in its feed, and those show on the <a href="/road-conditions/${slug}/">${esc(s.name)} road conditions</a> page. A seasonal gate is announced on the agency's page and sometimes in the feed too. Each road page reads the feed for its route and lists whatever is posted, and says plainly when nothing is.</p>
    <p>Closing dates in these pages are the ones the agency gives, with the date MileCheck read them. None of them is a prediction. When an agency has not posted dates for the 2026-27 winter, the page says that.</p>

${CTA(campaign, s.dot)}

    <p class="sc-related">Other states: ${ROAD_STATES.filter((c) => c !== code).map((c) => `<a href="/seasonal/${stateSlug(c)}/">${esc(STATE[c].name)}</a>`).join(' · ')} · <a href="/seasonal/">All seasonal closures</a>${exists(`cameras/${slug}/index.html`) ? ` · <a href="/cameras/${slug}/">${esc(s.name)} cameras</a>` : ''}</p>
  </div>

  ${SIGNUP}

` + footer(campaign, [['/seasonal/', 'Seasonal closures'], [`/road-conditions/${slug}/`, `${s.name} road conditions`], ['/closures/', 'US closures map'], ['/maps/', 'All maps']]) + `<!-- spon:start -->${sp.js}<!-- spon:end -->
</body>
</html>
`;
  fs.mkdirSync(rel(`seasonal/${slug}`), { recursive: true });
  fs.writeFileSync(rel(`seasonal/${slug}/index.html`), html);
}

function hubPage() {
  const url = 'https://milecheckapp.com/seasonal/';
  const q = 'Which mountain roads close for the winter?';
  const title = `${q} Seasonal closures by state | MileCheck`;
  const desc = `${ROADS.length} roads in ${ROAD_STATES.length} western states that close every winter, with the closing and reopening dates each agency publishes and what the state DOT feed is posting right now.`;
  const sp = SPON.slot({ kind: 'live', slug: 'seasonal', state: '', name: q });
  const ld = [
    { '@context': 'https://schema.org', '@type': 'CollectionPage', name: q, url, description: desc, isPartOf: { '@type': 'WebSite', name: 'MileCheck', url: 'https://milecheckapp.com/' } },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'MileCheck', item: 'https://milecheckapp.com/' }, { '@type': 'ListItem', position: 2, name: 'Seasonal closures', item: url }] },
  ];
  const states = ROAD_STATES.map((c) => `      <a class="sc-state" href="/seasonal/${stateSlug(c)}/"><b>${esc(STATE[c].name)}</b><span>${ROADS.filter((r) => r.states.includes(c)).length} roads</span></a>`).join('\n');
  const cards = ROADS.map((r) => `      <a class="sc-road" href="/seasonal/${r.slug}/"><span class="k">${esc(r.routes.join(' / '))} · ${esc(r.states.map((s) => STATE[s].name).join(' and '))}</span><h3>${esc(r.q)}</h3><p>${esc(r.publicLine)}</p></a>`).join('\n');
  const html = head({ title, desc, url, ld }) + `
  <div class="sc-wrap">
    <!-- spon:start -->
${sp.html}
<!-- spon:end -->
    <p class="sc-eyebrow">Seasonal closures</p>
    <h1>${esc(q)}</h1>
    <p class="sc-lede">${ROADS.length} roads in ${ROAD_STATES.length} states that close for the winter on a schedule the agency publishes. One page per road: what the state DOT feed is posting for it right now, and the closing and reopening dates quoted from the agency's own page with the date they were read. Storm closures on roads that stay open all winter are on the <a href="/road-conditions/">road conditions</a> pages and the <a href="/closures/">US closures map</a>.</p>
    <div class="sc-states">
${states}
    </div>
    <h2 style="font-size:23px;margin:28px 0 6px;">Every road</h2>
    <div class="sc-roads">
${cards}
    </div>
  </div>

  <div class="sc-body">
    <h2>What these pages do and do not say</h2>
    <p>They do not say a road is open. They show the reports the DOT feed holds for the route, and they quote the dates the agency gives. A quiet feed means nothing is posted, and the page says that in those words. Agencies sometimes announce a seasonal gate on their own site and not in the feed, so the agency link on each page is the one to open before a drive.</p>
    <p class="sc-related">Also: <a href="/passes/">Mountain passes that stay open</a> · <a href="/chains/">Chain rules</a> · <a href="/cameras/">Cameras by state</a></p>
  </div>

  ${SIGNUP}

` + footer('seasonal', [['/closures/', 'US closures map'], ['/road-conditions/', 'Road conditions by state'], ['/passes/', 'Mountain passes'], ['/maps/', 'All maps']]) + `<!-- spon:start -->${sp.js}<!-- spon:end -->
</body>
</html>
`;
  fs.mkdirSync(rel('seasonal'), { recursive: true });
  fs.writeFileSync(rel('seasonal/index.html'), html);
}

ROADS.forEach(roadPage);
ROAD_STATES.forEach(statePage);
hubPage();
console.log(`seasonal: ${ROADS.length} road pages (${RAW.length} records, ${RAW.length - ROADS.length} folded as extra sources) + ${ROAD_STATES.length} state roundups + hub`);
console.log(SPON.summary());
