#!/usr/bin/env node
// gen-highway-report-pages.mjs — the monthly Highway Report: national page plus one page per jurisdiction,
// from data/road-report-<month>-<year>.json (built by the app repo's scripts/gen-road-report.mjs via road-report.yml).
// Adapted 2026-10-01 from gen-labor-day-recap-pages.mjs. Follows marketing/REPORT-VOICE.md in the app repo:
// label title, one method box, counts carry their scope, driver order (crashes, closures, border waits,
// bridges, fires), fires as acres + containment as of the last snapshot, state pages not dropdowns.
// No keyword-derived weather claims (the Oct 1 review showed "snow"/"fire" matches hit street names).
//
//   node scripts/gen-highway-report-pages.mjs 2026-09
//   then: add-sponsor-slots -> tag-store-links -> add-signup-band -> add-nav-search -> build-search-index -> build-sitemap
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MONTH = process.argv[2] || '2026-09';
const [YEAR, MM] = MONTH.split('-').map(Number);
const MONTH_NAME = new Date(Date.UTC(YEAR, MM - 1, 1)).toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' });
const MON_ABBR = ['Jan.', 'Feb.', 'March', 'April', 'May', 'June', 'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.'][MM - 1];
const LAST_DAY = new Date(Date.UTC(YEAR, MM, 0)).getUTCDate();
const KEY = `${MONTH_NAME.toLowerCase()}-${YEAR}`;
const D = JSON.parse(readFileSync(resolve(ROOT, `data/road-report-${KEY}.json`), 'utf8'));
const NATIONAL_FILE = `blog/road-report-${KEY}.html`;
const STATE_DIR_NAME = `highway-report-${KEY}-states`;
const OUT_DIR = resolve(ROOT, 'blog', STATE_DIR_NAME);
mkdirSync(OUT_DIR, { recursive: true });
const PUBLISHED = process.env.PUBLISHED || new Date().toISOString().slice(0, 10);
const pubLong = new Date(PUBLISHED + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const H1 = `MileCheck Highway Report, ${MONTH_NAME} ${YEAR}`;
const WINDOW = `${MON_ABBR} 1 through ${MON_ABBR} ${LAST_DAY}`;
const NAMES = { AL:'Alabama', AK:'Alaska', AZ:'Arizona', AR:'Arkansas', CA:'California', CO:'Colorado', CT:'Connecticut', DE:'Delaware', FL:'Florida', GA:'Georgia', HI:'Hawaii', ID:'Idaho', IL:'Illinois', IN:'Indiana', IA:'Iowa', KS:'Kansas', KY:'Kentucky', LA:'Louisiana', ME:'Maine', MD:'Maryland', MA:'Massachusetts', MI:'Michigan', MN:'Minnesota', MS:'Mississippi', MO:'Missouri', MT:'Montana', NE:'Nebraska', NV:'Nevada', NH:'New Hampshire', NJ:'New Jersey', NM:'New Mexico', NY:'New York', NC:'North Carolina', ND:'North Dakota', OH:'Ohio', OK:'Oklahoma', OR:'Oregon', PA:'Pennsylvania', RI:'Rhode Island', SC:'South Carolina', SD:'South Dakota', TN:'Tennessee', TX:'Texas', UT:'Utah', VT:'Vermont', VA:'Virginia', WA:'Washington', WV:'West Virginia', WI:'Wisconsin', WY:'Wyoming', BC:'British Columbia' };
const slug = (st) => NAMES[st].toLowerCase().replace(/\s+/g, '-');
const n = (x) => Number(x || 0).toLocaleString('en-US');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const title = (s) => { s = String(s).replace(/^\d+\s+/, '').trim(); return s === s.toUpperCase() ? s.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase()).replace(/\bMc([a-z])/g, (m, c) => 'Mc' + c.toUpperCase()) : s; };
const DOT_NAME = { BC: 'DriveBC' };

// Washington's feed labels every state route "SR n", interstates and US routes included. Show the signed name.
const WA_I = new Set(['5', '82', '90', '182', '205', '405', '705']), WA_US = new Set(['2', '12', '97', '101', '195', '395', '730']);
function route(st, r) {
  if (!r) return '';
  let m = String(r).match(/^SR\s*-?\s*(\d+[A-Z]?)$/i);
  if (m && st === 'WA') return WA_I.has(m[1]) ? `I-${m[1]}` : WA_US.has(m[1]) ? `US-${m[1]}` : `SR-${m[1]}`;
  if (m) return `SR-${m[1]}`;
  return String(r).replace(/\s+/g, ' ');
}
const list = (items) => `<ul class="article-list" style="margin-top:10px;margin-bottom:0;">${items.map((i) => `<li>${i}</li>`).join('')}</ul>`;
const box = (label, items) => `<div class="pull-stat"><strong>${label}</strong>${list(items)}</div>`;
const quote = (h) => { let t = String(h).replace(/\s+/g, ' ').replace(/^[-\u2013\u2014\s]+/, '').trim(); if (t.length >= 219) t = t.replace(/\s+\S*$/, '') + '\u2026'; return t; };
const dateLong = (iso) => { const [y, mo, d] = iso.split('-').map(Number); return new Date(Date.UTC(y, mo - 1, d)).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long', day: 'numeric', year: 'numeric' }); };
const fireLine = (f, st) => `${esc(title(f.name))}${f.county && st !== 'BC' ? ` (${esc(f.county)} County)` : ''}, ${n(f.acres)} acres, ${f.containedPct == null ? 'containment not published' : `${f.containedPct}% contained`}`;
const bridgeName = (id) => ({ 'WA-bridge-fremont': 'Fremont Bridge', 'WA-bridge-ballard': 'Ballard Bridge', 'WA-bridge-university': 'University Bridge', 'WA-bridge-montlake': 'Montlake Bridge', 'WA-bridge-south-park': 'South Park Bridge', 'WA-bridge-1st-ave-s': '1st Ave S Bridge', 'WA-bridge-spokane-st': 'Lower Spokane St Bridge' }[id] || id);
const hm = (m) => { m = Math.round(m); const h = Math.floor(m / 60), r = m % 60; return h ? `${h} hr${r ? ` ${r} min` : ''}` : `${r} min`; };
const dayOf = (iso) => !iso ? 'no wait recorded' : dateLong(iso.slice(0, 10)).replace(/, \d{4}$/, '');
const utcToPacific = (iso) => { const d = new Date(iso.replace(/Z$/, ':00Z').replace(':00:00Z', ':00Z')); const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', month: 'numeric', day: 'numeric', hour: 'numeric' }).formatToParts(d).map((x) => [x.type, x.value])); return `${['Jan.', 'Feb.', 'March', 'April', 'May', 'June', 'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.'][p.month - 1]} ${p.day}, ${p.hour} ${p.dayPeriod}`; };
// Alerts the DOT posts for multi-year projects: describe what is actually restricted. Fallback = trimmed headline.
const LT_WHAT = {
  'WI I-535': 'southbound right shoulder closed at the state-line bridge',
  'OH I-75': 'ramp to Second Street (Exit 1A) closed',
  'VA I-81': 'work zone, mile markers 142.9 to 147.3, Roanoke County',
  'TX US-87': 'alternating lanes closed for construction',
  'WA SR-165': 'closed at the Carbon River/Fairfax Bridge to all traffic, until further notice',
  'NC US-17': 'one left lane closed intermittently, Martin County',
};
const ltLine = (p) => `<strong>${NAMES[p.state]}, ${esc(route(p.state, p.route || ''))}</strong> &mdash; ${esc(LT_WHAT[`${p.state} ${p.route}`] || quote(p.headline).slice(0, 110))}. Posted window ${dateLong(p.start)} to ${dateLong(p.end)}.`;
// ---------- shared page chrome ----------
function page({ rel, canonical, pageTitle, description, h1, byline, body, jsonld }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta name="apple-itunes-app" content="app-id=6759212851">
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(pageTitle)}</title>
  <meta name="description" content="${esc(description)}">

  <meta property="og:title" content="${esc(h1)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:image" content="https://milecheckapp.com/images/og-banner-light.png">
  <meta property="og:url" content="${canonical}">
  <meta property="og:type" content="article">

  <link rel="icon" type="image/png" href="${rel}images/favicon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&amp;family=JetBrains+Mono:wght@400;500;600;700&amp;display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${rel}style.css">
  <link rel="stylesheet" href="${rel}blog/blog.css">
  <!-- Cloudflare Web Analytics --><script type="module" src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token": "b22dd97eac65485dae41ab1e51f823e9"}'></script><!-- End Cloudflare Web Analytics -->
  <link rel="canonical" href="${canonical}">
  <script type="application/ld+json">${JSON.stringify(jsonld)}</script>
  <style>
    .article-wrap > p, .article-wrap p:not(.roy-card p):not(.roy-signoff p) { margin: 0 0 22px; }
    .article-byline{font-size:14px;color:#5C6670;margin:0 0 26px;}
    .method-box{font-size:14.5px;line-height:1.6;color:#3D454D;background:#F7F8F9;border:1px solid #E4E7EA;border-radius:9px;padding:14px 16px;margin:0 0 30px;}
    .method-box strong{color:#0F1419;}
    .article-note{font-size:14px;color:#5C6670;background:#F7F8F9;border-radius:9px;padding:12px 15px;margin:18px 0;}
    .article-list{margin:18px 0 !important;padding:0 0 0 20px !important;}
    .article-list li{margin:0 0 11px 0 !important;line-height:1.6;padding:0;}
    .pull-stat{margin:26px 0;padding:18px 20px;background:#FFF7ED;border-left:4px solid #F59E0B;border-radius:0 10px 10px 0;}
    .pull-stat strong{display:block;font-size:15px;color:#0F1419;}
    .pull-stat ul.article-list{margin:10px 0 0 !important;}
    .pull-stat ul.article-list li:last-child{margin-bottom:0 !important;}
    .pull-stat li strong{display:inline;}
    .headline-nums{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin:0 0 34px;}
    .headline-nums div{background:#F7F8F9;border:1px solid #E4E7EA;border-radius:10px;padding:14px 14px 12px;}
    .headline-nums b{display:block;font-family:'JetBrains Mono',monospace;font-size:24px;color:#0F1419;font-variant-numeric:tabular-nums;line-height:1.1;}
    .headline-nums span{display:block;font-size:12.5px;color:#5C6670;margin-top:6px;line-height:1.4;}
    .state-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px 14px;margin:14px 0 30px;padding:0;list-style:none;}
    .state-grid li{margin:0;padding:0;font-size:14.5px;line-height:1.5;}
    .state-grid a{color:#0F1419;text-decoration:none;border-bottom:1px solid #D5DADE;}
    .state-grid a:hover{border-bottom-color:#00A86B;}
    h2.rc{margin-top:44px;}
    .rc-fig{font-size:14px;color:#5C6670;margin:-12px 0 20px;}
  </style>
</head>

<body>

  <header class="site-header">
    <div class="container header-inner">
      <a href="${rel}index.html" class="brand" style="display:inline-flex;align-items:center;gap:9px;"><img src="${rel}assets/app-icon-60.png" alt="" style="width:28px;height:28px;border-radius:7px;flex-shrink:0;">MileCheck</a>
      <button class="nav-toggle" aria-label="Menu"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0F1419" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg></button>
      <nav class="primary-nav">
        <a href="${rel}index.html">Home</a>
        <a href="${rel}maps/">Maps</a>
        <a href="${rel}cameras/">Cameras</a>
        <a href="${rel}states/">United States</a>
        <a href="${rel}canada/">Canada</a>
        <a href="${rel}index.html#story">Story</a>
        <a href="${rel}index.html#b2b">B2B</a>
        <a href="${rel}blog/" class="active">Blog</a>
        <a href="/get/" class="nav-cta">Get the app</a>
      </nav>
    </div>
  </header>

    <main class="article">
    <div class="article-wrap">
      <a href="${rel}blog/" class="article-back">All articles</a>

      <p class="article-eyebrow">MileCheck Highway Report</p>
      <h1 class="article-title">${esc(h1)}</h1>
      <p class="article-byline">${byline}</p>

${body}

      <div class="article-cta">
        <h3>The live version is in the app.</h3>
        <p>MileCheck shows state DOT feeds for crashes, closures, and delays in all 50 states, British Columbia, Alberta and Manitoba as they are published, with your nearest mile marker.</p>
        <a href="https://apps.apple.com/app/apple-store/id6759212851?pt=128447811&mt=8" class="btn btn-primary" target="_blank" rel="noopener">App Store</a>
        <a href="https://play.google.com/store/apps/details?id=app.milecheck.mobile" class="btn btn-primary" target="_blank" rel="noopener">Google Play</a>
      </div>

      <p class="article-note">Built from MileCheck's archive of state DOT road feeds. A new Highway Report comes out at the start of every month.</p>

    </div>
  </main>

  <section class="mc-signup" id="subscribe">
    <style>
      .mc-signup{background:#F4F8F6;border-top:1px solid #E4EAE6;border-bottom:1px solid #E4EAE6;padding:44px 0;}
      .mc-signup .mc-signup-inner{max-width:560px;margin:0 auto;text-align:center;padding:0 20px;}
      .mc-signup .mc-eyebrow{font-family:'Inter',-apple-system,sans-serif;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#00A86B;margin:0 0 8px;}
      .mc-signup h2{font-family:'Inter',-apple-system,sans-serif;font-size:24px;font-weight:800;letter-spacing:-.01em;color:#0F1419;margin:0 0 8px;}
      .mc-signup .mc-sub{font-family:'Inter',-apple-system,sans-serif;font-size:15px;line-height:1.55;color:#5A6670;margin:0 auto 18px;max-width:44ch;}
      .mc-signup .ml-form-embedContent{display:none !important;}
      .mc-signup .ml-form-embedWrapper{background:transparent !important;box-shadow:none !important;max-width:440px;margin:0 auto;}
      .mc-signup input[type=email]{border-radius:8px !important;}
      .mc-signup button,.mc-signup .primary{background:#00C880 !important;border-radius:8px !important;font-weight:700 !important;}
    </style>
    <div class="mc-signup-inner">
      <p class="mc-eyebrow">The Monthly Highway Report</p>
      <h2>Closures and crashes on US highways, once a month</h2>
      <p class="mc-sub">The month's numbers from DOT feeds in all 50 states and BC. <a href="/blog/road-report-${KEY}.html">See the ${MONTH_NAME} report</a>. No spam.</p>
      <div class="ml-embedded" data-form="LjADY8"></div>
    </div>
  </section>

  <footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-col footer-col-brand">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;"><img src="${rel}assets/app-icon-60.png" alt="MileCheck" style="width:36px;height:36px;border-radius:9px;flex-shrink:0;"><p class="footer-brand" style="margin-bottom:0;">MileCheck</p></div>
          <p class="footer-tagline">Mile markers in all 50 US states.</p>
        </div>
        <div class="footer-col">
          <p class="footer-label">Get the app</p>
          <ul class="footer-list">
            <li><a href="https://apps.apple.com/app/apple-store/id6759212851?pt=128447811&mt=8" target="_blank" rel="noopener">iOS App Store</a></li>
            <li><a href="https://play.google.com/store/apps/details?id=app.milecheck.mobile" target="_blank" rel="noopener">Google Play</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <p class="footer-label">Help &amp; legal</p>
          <ul class="footer-list">
            <li><a href="mailto:feedback@milecheckapp.com">Send feedback</a></li>
            <li><a href="https://milecheckapp.com/milecheck-privacy/">Privacy policy</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <p class="footer-label">B2B Opportunities</p>
          <ul class="footer-list">
            <li><a href="${rel}index.html#b2b">Partner info</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <p class="footer-label">Follow</p>
          <ul class="footer-list">
            <li><a href="https://www.instagram.com/milecheck_app" target="_blank" rel="noopener">Instagram</a></li>
            <li><a href="https://www.facebook.com/share/1FT9JtkH5D/?mibextid=wwXIfr" target="_blank" rel="noopener">Facebook</a></li>
            <li><a href="https://www.linkedin.com/company/milecheck" target="_blank" rel="noopener">LinkedIn</a></li>
            <li><a href="https://www.reddit.com/user/MileCheckApp/" target="_blank" rel="noopener">Reddit</a></li>
          </ul>
        </div>
      </div>
      <p class="footer-fineprint">&copy; 2026 MileCheck LLC. Mile marker positions are approximate and may not reflect actual sign locations. Built for highway travelers &mdash; use responsibly.</p>
    </div>
  </footer>

  <script>(function(){var t=document.querySelector(".nav-toggle"),n=document.querySelector(".primary-nav");if(t&&n){t.addEventListener("click",function(){n.classList.toggle("open");});document.addEventListener("click",function(e){if(!e.target.closest(".header-inner"))n.classList.remove("open");});}})();</script>
  <!-- MailerLite Universal -->
  <script>
  (function(w,d,e,u,f,l,n){w[f]=w[f]||function(){(w[f].q=w[f].q||[]).push(arguments);},l=d.createElement(e),l.async=1,l.src=u,n=d.getElementsByTagName(e)[0],n.parentNode.insertBefore(l,n);})(window,document,'script','https://assets.mailerlite.com/js/universal.js','ml');
  ml('account', '2507175');
  </script>
  <!-- End MailerLite Universal -->
</body>
</html>
`;
}


// A "place" from a DOT feed is often a road name (101-Loop, Pacific Highway, I-70e). Keep real places only.
const realPlace = (p) => p && p.length <= 30 && !/\d/.test(p) && !/\b(highway|hwy|freeway|fwy|loop|interstate|route|pacific|parkway|pkwy|trail|expressway|turnpike|bypass|nb|sb|eb|wb)\b/i.test(p);
// ---------- data ----------
const T = D.byType, J = D.jurisdictionSummary;
const jOf = (st) => J.find((x) => x.state === st) || { state: st, crash: 0, closure: 0, construction: 0, total: 0, topRoutes: [] };
const crashStates = J.filter((x) => x.crash > 0).sort((a, b) => b.crash - a.crash);
const longTerm = D.longTermProjects.filter((p) => !(p.state === 'NY' && p.route === 'I-91')); // that record is Connecticut's I-91 riding NY's feed
const ltOf = (st) => longTerm.find((p) => p.state === st);
const fatal = (D.keywordSamples && D.keywordSamples.fatal) || [];
const FA = D.firesAsOf || null;            // { snapshot, byState: { WA: { active, acres, largest[] } } }
const BW = D.borderWaits || null;          // { all[], byAvg[], byMax[] }
const BR = D.bridges || null;              // [{ id, openings, medianMin, longestMin }]
const fireAsOf = FA ? `as of ${utcToPacific(FA.snapshot)} Pacific` : '';
const faTotals = FA ? Object.values(FA.byState).reduce((a, s) => ({ active: a.active + s.active, acres: a.acres + s.acres }), { active: 0, acres: 0 }) : null;
const bridgeTotal = BR ? BR.reduce((a, b) => a + b.openings, 0) : 0;
const portLabel = (p) => `${esc(p.port)}${p.crossing && !/Passenger/i.test(p.crossing) ? ' / ' + esc(p.crossing) : ''}`;

const methodBox = (scope, extra) => `<div class="method-box"><strong>How we got these numbers:</strong> MileCheck saves every state department of transportation (DOT) road alert as it's published. We counted what was on ${scope} from ${WINDOW}, ${YEAR}, each alert once. Not all states report the same data.${extra || ''}</div>`;
const extras = (opts) => [
  opts.fires && FA ? ` Fire figures are ${fireAsOf}.` : '',
  opts.border && BW ? ' Border waits are from U.S. Customs and Border Protection, saved every hour. Readings over five hours were treated as feed errors.' : '',
].join('');

// ---------- national page ----------
const nums = [
  `<div><b>${n(T.crash)}</b><span>crashes reported, in the ${crashStates.length} states and provinces that publish them</span></div>`,
  `<div><b>${n(T.closure)}</b><span>closures on the feeds, all 51 jurisdictions</span></div>`,
  `<div><b>${n(T.construction)}</b><span>roadwork records on the feeds</span></div>`,
  BR ? `<div><b>${n(bridgeTotal)}</b><span>Seattle drawbridge openings in ${MONTH_NAME}</span></div>` : '',
  FA ? `<div><b>${n(faTotals.active)}</b><span>wildfires on the national list, ${fireAsOf}</span></div>` : '',
].filter(Boolean).join('\n        ');

const national = [];
national.push(`<p class="article-lead">What the state road feeds showed in ${MONTH_NAME} ${YEAR}, in all 50 states and British Columbia. ${[ 'Crashes', 'closures', 'roadwork', BW && 'border waits', BR && "Seattle's drawbridges", FA && 'wildfires'].filter(Boolean).join(', ').replace(/, ([^,]*)$/, ' and $1')}.</p>`);
national.push(methodBox('those feeds', extras({ fires: true, border: true })));
const JUMP = `<p style="margin:4px 0 30px;"><a href="#by-state" style="display:inline-block;background:#0F1419;color:#fff;font-weight:700;padding:10px 18px;border-radius:8px;text-decoration:none;">Find your state &darr;</a></p>`;
national.push(`<div class="headline-nums">\n        ${nums}\n      </div>`);
national.push(JUMP);
national.push(`<h2 class="rc">Crashes</h2>`);
national.push(`<p>${n(T.crash)} crashes were reported in ${MONTH_NAME}, in the ${crashStates.length} states and provinces that publish crash data. California reports the most crashes and carries the most traffic, so it leads any national list.</p>`);
national.push(box(`Crashes reported by state, ${MONTH_NAME}`, crashStates.slice(0, 10).map((x) => `<strong>${NAMES[x.state]}</strong> &mdash; ${n(x.crash)}`)));
const CH = D.crashHotspots || null;
if (CH) {
  const rows = crashStates.slice(0, 8).filter((x) => CH[x.state] && CH[x.state].routes.length).map((x) => {
    const h = CH[x.state]; const [r, c] = h.routes[0]; const pl = h.places.find((q) => realPlace(q.place));
    return `<strong>${NAMES[x.state]}, ${esc(route(x.state, r))}</strong> &mdash; ${n(c)} of the state's ${n(x.crash)} crashes${pl ? `. Statewide, the most-named area was ${esc(title(pl.place))} (${pl.crashes})` : ''}`;
  });
  if (rows.length) national.push(box('Route with the most crash alerts, by state', rows));
}
if (fatal.length) national.push(`<p>${fatal.length} crashes were marked fatal by the reporting DOT.</p>` + box('Crashes marked fatal', [...fatal].sort((a, b) => a.date.localeCompare(b.date)).map((f) => `<strong>${NAMES[f.state]}, ${esc(route(f.state, f.route || ''))}</strong> &mdash; ${dateLong(f.date.slice(0, 10)).replace(/, \d{4}$/, '')}`)));
national.push(JUMP);
national.push(`<h2 class="rc">Closures and roadwork</h2>`);
national.push(`<p>${n(T.closure)} closures and ${n(T.construction)} roadwork records were on the feeds in ${MONTH_NAME}, across all 51 jurisdictions.</p>`);
const TYPE_WORD = { construction: 'roadwork', closure: 'closures', crash: 'crashes', weather: 'weather', hazard: 'hazards', other: 'other notices' };
const corridorLine = (c) => {
  const st = c.states.slice(0, 3).map(([k, v]) => `${NAMES[k] || k} ${n(v)}`).join(', ');
  const more = c.states.length > 3 ? ` and ${c.states.length - 3} more ${c.states.length - 3 === 1 ? 'state' : 'states'}` : '';
  const tp = (c.topPlaces || []).filter(([p]) => realPlace(p));
  const t = c.types[0] ? ` Mostly ${TYPE_WORD[c.types[0][0]] || c.types[0][0]} (${Math.round(c.types[0][1] / c.total * 100)}%).` : '';
  const pl = tp.length ? ` Most-named spot in ${NAMES[c.states[0][0]]} is ${esc(title(tp[0][0]))}.` : '';
  return `<strong>${esc(c.route)}</strong> &mdash; ${n(c.total)} alerts. ${st}${more}.${t}${pl}`;
};
national.push(D.corridorDetail
  ? box('Routes with the most alerts, all types. States are the feed the alert came from.', D.corridorDetail.map(corridorLine)) + `<p class="rc-fig">Some state feeds also carry a neighbor's roads. New York's feed covers northern New Jersey, which is why I-80 shows up under New York.</p>`
  : box('Routes with the most alerts, all types', D.topCorridors.slice(0, 8).map(([r, c]) => `<strong>${esc(r)}</strong> &mdash; ${n(c)}`)));
national.push(`<p>See any of these live on <a href="../corridors/">the corridor maps</a>.</p>`);
if (BW && BW.byMax.length) {
  national.push(`<h2 class="rc">Border waits</h2>`);
  national.push(`<p>Passenger-lane waits at U.S. land crossings in ${MONTH_NAME}, from hourly readings.</p>`);
  national.push(box('Highest single reading', [...BW.all].sort((x, y) => y.maxMin - x.maxMin || y.avgMin - x.avgMin).slice(0, 6).map((p) => `<strong>${portLabel(p)}</strong>${p.state ? ` (${NAMES[p.state]})` : ''} &mdash; ${hm(p.maxMin)}, ${dayOf(p.maxAt)}`)));
  national.push(box('Longest average wait', BW.byAvg.slice(0, 6).map((p) => `<strong>${portLabel(p)}</strong>${p.state ? ` (${NAMES[p.state]})` : ''} &mdash; ${hm(p.avgMin)} average`)));
  national.push(`<p>Live waits for all 85 crossings are at <a href="../borders/">milecheckapp.com/borders</a>.</p>`);
}
if (BR && BR.length) {
  national.push(`<h2 class="rc">Seattle drawbridges</h2>`);
  national.push(`<p>Seattle's drawbridges opened ${n(bridgeTotal)} times in ${MONTH_NAME}.</p>`);
  national.push(box(`Openings, ${MONTH_NAME}`, BR.map((b) => `<strong>${bridgeName(b.id)}</strong> &mdash; ${n(b.openings)} openings${b.medianMin != null ? `, typically ${b.medianMin} minutes, longest ${b.longestMin}` : ''}`)));
  national.push(`<p>Live status is on <a href="../maps/#drawbridges">the drawbridge map</a>.</p>`);
}
if (FA) {
  const fireStates = Object.entries(FA.byState).sort((a, b) => b[1].acres - a[1].acres);
  national.push(`<h2 class="rc">Wildfires</h2>`);
  national.push(`<p>${n(faTotals.active)} wildfires were on the national wildfire list ${fireAsOf}, in the states and provinces we track. Many are mostly or fully contained.</p>`);
  national.push(box(`Largest fires by state, ${fireAsOf}`, fireStates.slice(0, 8).map(([st, s]) => `<strong>${NAMES[st]}</strong>: ${n(s.active)} listed. ${s.largest.slice(0, 3).map((f) => fireLine(f, st)).join('; ')}.`)));
  national.push(`<p>Thank you to the firefighters and crews who worked these fires all season.</p>`);
  national.push(`<p>Live fire perimeters and the closures near them are at <a href="../fire/">milecheckapp.com/fire</a>.</p>`);
}
national.push(`<h2 class="rc" id="by-state">By state</h2>`);
national.push(`<p>Each state and province has its own page with the same measures.</p>`);
national.push(`<ul class="state-grid">\n        ${Object.keys(NAMES).sort((a, b) => NAMES[a].localeCompare(NAMES[b])).map((st) => `<li><a href="${STATE_DIR_NAME}/${slug(st)}.html">${NAMES[st]}</a></li>`).join('\n        ')}\n      </ul>`);

const NAT_DESC = `${n(T.crash)} crashes reported in ${crashStates.length} states, ${n(T.closure)} closures and ${n(T.construction)} roadwork records on every state DOT feed in ${MONTH_NAME} ${YEAR}, with a page for each state.`;
const natCanon = `https://milecheckapp.com/${NATIONAL_FILE}`;
writeFileSync(resolve(ROOT, NATIONAL_FILE), page({
  rel: '../', canonical: natCanon, pageTitle: H1, description: NAT_DESC, h1: H1,
  byline: `by MileCheck &middot; ${pubLong}`,
  body: national.map((p) => '      ' + p).join('\n\n'),
  jsonld: { '@context': 'https://schema.org', '@type': 'NewsArticle', headline: H1, datePublished: PUBLISHED, dateModified: PUBLISHED, author: { '@type': 'Organization', name: 'MileCheck' }, publisher: { '@type': 'Organization', name: 'MileCheck', url: 'https://milecheckapp.com' }, mainEntityOfPage: natCanon, description: NAT_DESC },
}));

// ---------- state pages ----------
let written = 0;
for (const st of Object.keys(NAMES)) {
  const S = jOf(st), name = NAMES[st];
  const feed = st === 'BC' ? 'the DriveBC feed' : `${name}'s department of transportation (DOT) feed`;
  const fire = FA && FA.byState[st];
  const ports = BW ? BW.all.filter((p) => p.state === st).sort((a, b) => b.maxMin - a.maxMin || b.avgMin - a.avgMin).slice(0, 6) : [];
  const lt = ltOf(st);
  const parts = [];
  parts.push(`<p class="article-lead">What ${feed} showed in ${MONTH_NAME} ${YEAR}. Part of the <a href="../road-report-${KEY}.html">national ${H1}</a>.</p>`);
  parts.push(methodBox(st === 'BC' ? "British Columbia's feed" : `${name}'s feed`, extras({ fires: !!fire, border: ports.length > 0 })));
  const sn = [];
  if (S.crash > 0) sn.push(`<div><b>${n(S.crash)}</b><span>crashes reported in ${MONTH_NAME}</span></div>`);
  sn.push(`<div><b>${n(S.closure)}</b><span>closures on the feed</span></div>`);
  sn.push(`<div><b>${n(S.construction)}</b><span>roadwork records on the feed</span></div>`);
  if (fire) sn.push(`<div><b>${n(fire.active)}</b><span>wildfires on the national list, ${fireAsOf}</span></div>`);
  if (st === 'WA' && BR) sn.push(`<div><b>${n(bridgeTotal)}</b><span>Seattle drawbridge openings</span></div>`);
  parts.push(`<div class="headline-nums">${sn.join('')}</div>`);
  if (S.total === 0) {
    parts.push(`<h2 class="rc">Crashes, closures and roadwork</h2><p>${name}'s feed returned no records in ${MONTH_NAME}, so this page cannot say what was on the roads.</p>`);
  } else {
    parts.push(`<h2 class="rc">Crashes</h2>`);
    parts.push(S.crash > 0 ? `<p>${n(S.crash)} ${S.crash === 1 ? 'crash was' : 'crashes were'} reported in ${name} in ${MONTH_NAME}.</p>` : `<p>No crashes were on ${name}'s feed in ${MONTH_NAME}. Not all states publish crash reports.</p>`);
    const hs = D.crashHotspots && D.crashHotspots[st];
    if (hs && hs.routes.length) parts.push(box('Routes with the most crash alerts', hs.routes.map(([r, c]) => `<strong>${esc(route(st, r))}</strong> &mdash; ${n(c)}`)));
    const hp = hs ? hs.places.filter((q) => realPlace(q.place)) : [];
    if (hp.length) parts.push(box('Areas named in two or more crash alerts', hp.map((p) => `<strong>${esc(title(p.place))}</strong>${p.route ? ` (${esc(route(st, p.route))})` : ''} &mdash; ${n(p.crashes)}`)));
    const fs = fatal.filter((f) => f.state === st);
    if (fs.length) parts.push(box('Crashes marked fatal by the DOT', fs.map((f) => `<strong>${esc(route(st, f.route || ''))}</strong> &mdash; ${dateLong(f.date.slice(0, 10)).replace(/, \d{4}$/, '')}`)));
    parts.push(`<h2 class="rc">Closures and roadwork</h2>`);
    parts.push(`<p>${n(S.closure)} ${S.closure === 1 ? 'closure' : 'closures'} and ${n(S.construction)} roadwork ${S.construction === 1 ? 'record' : 'records'} were on ${name}'s feed in ${MONTH_NAME}, out of ${n(S.total)} alerts of all types.</p>`);
    if (S.topRoutes && S.topRoutes.length) parts.push(`<p>The routes with the most alerts were ${S.topRoutes.map((r) => esc(route(st, r))).join(', ').replace(/, ([^,]*)$/, ' and $1')}.</p>`);
  }
  if (ports.length) {
    parts.push(`<h2 class="rc">Border waits</h2><p>Passenger-lane waits at ${name}'s crossings in ${MONTH_NAME}, from hourly readings.</p>`);
    parts.push(box('By crossing', ports.map((p) => `<strong>${portLabel(p)}</strong> &mdash; highest ${hm(p.maxMin)} (${dayOf(p.maxAt)}), average ${hm(p.avgMin)}`)));
    parts.push(`<p>Live waits are at <a href="../../borders/">milecheckapp.com/borders</a>.</p>`);
  }
  if (st === 'WA' && BR && BR.length) {
    parts.push(`<h2 class="rc">Seattle drawbridges</h2><p>Seattle's drawbridges opened ${n(bridgeTotal)} times in ${MONTH_NAME}.</p>`);
    parts.push(box(`Openings, ${MONTH_NAME}`, BR.map((b) => `<strong>${bridgeName(b.id)}</strong> &mdash; ${n(b.openings)} openings${b.medianMin != null ? `, typically ${b.medianMin} minutes, longest ${b.longestMin}` : ''}`)));
  }
  if (fire) {
    parts.push(`<h2 class="rc">Wildfires</h2><p>${name} had ${n(fire.active)} ${fire.active === 1 ? 'fire' : 'fires'} on the national wildfire list ${fireAsOf}.${st === 'BC' ? ' The BC Wildfire Service does not publish containment percentages.' : ''}</p>`);
    parts.push(box(`Largest fires, ${fireAsOf}`, fire.largest.map((f) => fireLine(f, st))));
    parts.push(`<p>Thank you to the firefighters and crews who worked these fires all season.</p>`);
    parts.push(`<p>Live fire perimeters are at <a href="../../fire/">milecheckapp.com/fire</a>.</p>`);
  }
  parts.push(`<p style="margin-top:34px;">See the <a href="../road-report-${KEY}.html">national report</a> or <a href="index.html">another state</a>.</p>`);
  const h1 = `MileCheck Highway Report: ${name}, ${MONTH_NAME} ${YEAR}`;
  const desc = `${S.crash > 0 ? `${n(S.crash)} crashes, ` : ''}${n(S.closure)} closures and ${n(S.construction)} roadwork records on ${name}'s DOT feed in ${MONTH_NAME} ${YEAR}${ports.length ? ', plus border waits' : ''}${fire ? ', plus wildfires' : ''}.`;
  const canonical = `https://milecheckapp.com/blog/${STATE_DIR_NAME}/${slug(st)}.html`;
  writeFileSync(resolve(OUT_DIR, `${slug(st)}.html`), page({
    rel: '../../', canonical, pageTitle: h1, description: desc, h1,
    byline: `by MileCheck &middot; ${pubLong}`,
    body: parts.map((p) => '      ' + p).join('\n\n'),
    jsonld: { '@context': 'https://schema.org', '@type': 'NewsArticle', headline: h1, datePublished: PUBLISHED, dateModified: PUBLISHED, author: { '@type': 'Organization', name: 'MileCheck' }, publisher: { '@type': 'Organization', name: 'MileCheck', url: 'https://milecheckapp.com' }, mainEntityOfPage: canonical, description: desc, isPartOf: natCanon },
  }));
  written++;
}
const idxCanon = `https://milecheckapp.com/blog/${STATE_DIR_NAME}/`;
writeFileSync(resolve(OUT_DIR, 'index.html'), page({
  rel: '../../', canonical: idxCanon, pageTitle: `${H1}, by State`,
  description: `The ${H1} for every US state and British Columbia: crashes, closures and roadwork from each state DOT feed.`,
  h1: `${H1}, by State`, byline: `by MileCheck &middot; ${pubLong}`,
  body: `      <p class="article-lead">One page per state and province, with the same measures. The <a href="../road-report-${KEY}.html">national report</a> has the totals.</p>\n      <ul class="state-grid">\n        ${Object.keys(NAMES).sort((a, b) => NAMES[a].localeCompare(NAMES[b])).map((st) => `<li><a href="${slug(st)}.html">${NAMES[st]}</a></li>`).join('\n        ')}\n      </ul>`,
  jsonld: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: `${H1}, by State`, url: idxCanon, publisher: { '@type': 'Organization', name: 'MileCheck' } },
}));
console.log(`Wrote ${NATIONAL_FILE}, the state index, and ${written} state pages to blog/${STATE_DIR_NAME}/`);
