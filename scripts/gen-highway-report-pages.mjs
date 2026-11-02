#!/usr/bin/env node
// gen-highway-report-pages.mjs — the monthly Highway Report: national page plus one page per jurisdiction,
// from data/road-report-<month>-<year>.json (built by the app repo's scripts/gen-road-report.mjs via road-report.yml).
// Adapted 2026-10-01 from gen-labor-day-recap-pages.mjs. Follows marketing/REPORT-VOICE.md in the app repo:
// label title, one method box, counts carry their scope, driver order (crashes, closures, border waits,
// bridges, fires), fires as acres + containment as of the last snapshot, state pages not dropdowns.
// No keyword-derived weather claims (the Oct 1 review showed "snow"/"fire" matches hit street names).
//
//   node scripts/gen-highway-report-pages.mjs 2026-09
//   then: add-sponsor-slots -> tag-store-links -> add-signup-band -> add-signup-ctas -> add-nav-search -> build-search-index -> build-sitemap -> link-jsonld (always LAST)
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
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
// UPDATED: the day a published report was corrected (2026-10-13: neighbor-state alerts removed,
// cross-state rankings replaced by each state against its own earlier months).
const UPDATED = process.env.UPDATED || null;
const updLong = UPDATED ? new Date(UPDATED + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : null;
const pubLong = new Date(PUBLISHED + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const H1 = `MileCheck Highway Report, ${MONTH_NAME} ${YEAR}`;
const WINDOW = `${MON_ABBR} 1 through ${MON_ABBR} ${LAST_DAY}`;
const NAMES = { AL:'Alabama', AK:'Alaska', AZ:'Arizona', AR:'Arkansas', CA:'California', CO:'Colorado', CT:'Connecticut', DE:'Delaware', FL:'Florida', GA:'Georgia', HI:'Hawaii', ID:'Idaho', IL:'Illinois', IN:'Indiana', IA:'Iowa', KS:'Kansas', KY:'Kentucky', LA:'Louisiana', ME:'Maine', MD:'Maryland', MA:'Massachusetts', MI:'Michigan', MN:'Minnesota', MS:'Mississippi', MO:'Missouri', MT:'Montana', NE:'Nebraska', NV:'Nevada', NH:'New Hampshire', NJ:'New Jersey', NM:'New Mexico', NY:'New York', NC:'North Carolina', ND:'North Dakota', OH:'Ohio', OK:'Oklahoma', OR:'Oregon', PA:'Pennsylvania', RI:'Rhode Island', SC:'South Carolina', SD:'South Dakota', TN:'Tennessee', TX:'Texas', UT:'Utah', VT:'Vermont', VA:'Virginia', WA:'Washington', WV:'West Virginia', WI:'Wisconsin', WY:'Wyoming', BC:'British Columbia', AB:'Alberta', MB:'Manitoba' };
const slug = (st) => NAMES[st].toLowerCase().replace(/\s+/g, '-');
const n = (x) => Number(x || 0).toLocaleString('en-US');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const title = (s) => { s = String(s).replace(/^\d+\s+/, '').trim(); return s === s.toUpperCase() ? s.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase()).replace(/\bMc([a-z])/g, (m, c) => 'Mc' + c.toUpperCase()) : s; };
const DOT_NAME = { BC: 'DriveBC', AB: '511 Alberta', MB: 'Manitoba 511' };
const CANADA = new Set(['BC', 'AB', 'MB']);
const isProv = (st) => CANADA.has(st);
// Known feed gaps, by report month. A state listed here is shown with a note and kept out of the
// month-to-month comparison (Leah + ChatGPT/Fable review, 2026-11-02).
const FEED_NOTES = {
  '2026-10': { NY: '511NY changed its data system at the end of September. MileCheck recorded 3,429 alerts in September and 590 in October. The drop reflects the feed change, so these counts do not show whether New York had fewer road incidents.' },
};
const feedNote = (st) => (FEED_NOTES[MONTH] || {})[st] || '';
const plural = (k, one, many) => (k === 1 ? one : many);

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
const fireLine = (f, st) => `${esc(title(f.name))}${f.county && !CANADA.has(st) ? ` (${esc(f.county)} County)` : ''}, ${n(f.acres)} acres, ${f.containedPct == null ? 'containment not published' : `${f.containedPct}% contained`}`;
const bridgeName = (id) => ({ 'WA-bridge-fremont': 'Fremont Bridge', 'WA-bridge-ballard': 'Ballard Bridge', 'WA-bridge-university': 'University Bridge', 'WA-bridge-montlake': 'Montlake Bridge', 'WA-bridge-south-park': 'South Park Bridge', 'WA-bridge-1st-ave-s': '1st Ave S Bridge', 'WA-bridge-spokane-st': 'Lower Spokane St Bridge' }[id] || id);
const hm = (m) => { m = Math.round(m); const h = Math.floor(m / 60), r = m % 60; return h ? `${h} hr${r ? ` ${r} min` : ''}` : `${r} min`; };
const STATE_TZ = { WA: 'America/Los_Angeles', CA: 'America/Los_Angeles', ID: 'America/Los_Angeles', MT: 'America/Denver', NM: 'America/Denver', AZ: 'America/Phoenix', ND: 'America/Chicago', MN: 'America/Chicago', MI: 'America/Detroit', NY: 'America/New_York', VT: 'America/New_York', NH: 'America/New_York', ME: 'America/New_York', TX: 'America/Chicago' };
const ELPASO_MTN = /El Paso|Fort Hancock|Marcelino Serna|Presidio/;
const dayOf = (iso, p) => { if (!iso) return null; const tz = (p && p.state === 'TX' && ELPASO_MTN.test(p.port)) ? 'America/Denver' : (p && STATE_TZ[p.state]) || 'UTC'; return new Date(iso.replace(/:00Z$/, ':00:00Z')).toLocaleDateString('en-US', { timeZone: tz, month: 'long', day: 'numeric' }); };
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
        <p>MileCheck shows state DOT feeds for crashes, closures, and delays in all 50 states, British Columbia, Alberta and Manitoba as they are published, with your nearest mile marker, or kilometre marker in Canada.</p>
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
      <h2>Get your state's monthly road alert report</h2>
      <p class="mc-sub">Your state's reported closures, crashes and roadwork, once a month by email. <a href="/blog/road-report-${KEY}.html">See the ${MONTH_NAME} report</a>. No spam.</p>
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
// Recurring winter closures, researched with an official source per entry (data/seasonal-closures.json,
// refreshed each fall). "In effect" comes from the month's feed archive (D.seasonalClosures).
let SEASONAL = [];
try { SEASONAL = JSON.parse(readFileSync(resolve(ROOT, 'data/seasonal-closures.json'), 'utf8')).filter((e) => !/See prior entry/i.test(e.typicalClose || '')); } catch {}
const seasonalOf = (st) => SEASONAL.filter((e) => e.publicLine).filter((e) => String(e.state).split('/').includes(st));
const winterSection = (st, name) => {
  const live = ((D.seasonalClosures && D.seasonalClosures[st]) || []).filter((c) => !/construct|rebuild|bridge work/i.test(c.headline));
  const usual = seasonalOf(st);
  if (!live.length && !usual.length) return '';
  const out = [`<h2 class="rc">Winter closures</h2>`];
  if (live.length) out.push(box(`On ${name}'s feed as of ${dateLong(D.seasonalAsOf).replace(/, \d{4}$/, '')}`, live.map((c) => `<strong>${esc(route(st, c.route || ''))}</strong> &mdash; &ldquo;${esc(quote(c.headline).slice(0, 200))}&rdquo;`)));
  if (usual.length) out.push(box('Roads that usually close for winter', usual.map((e) => `<strong>${esc(e.route)}, ${esc(e.name)}</strong> &mdash; ${esc(e.publicLine || `${e.typicalClose}. ${e.typicalReopen}.`)} <a href="${esc(e.sourceUrl)}" rel="noopener" target="_blank">Source</a>${(e.extraSources || []).map((x) => ` &middot; <a href="${esc(x.url)}" rel="noopener" target="_blank">${esc(x.label)} source</a>`).join('')}`)));
  out.push(`<p class="rc-fig">Timing comes from each agency's own page. Exact dates depend on snow. We update this list each month through winter.</p>`);
  return out.join('\n');
};
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

const methodBox = (scope, extra) => `<div class="method-box"><strong>How we got these numbers:</strong> These are unique alerts published by ${scope}, from a daily copy taken ${WINDOW}, ${YEAR}. Each alert is counted once. An alert posted and removed between two daily copies is not counted. Not all states report the same data, so compare each place with its own earlier months.${extra || ''}</div>`;
// Alerts a feed carried for another state's road, removed by gen-road-report.mjs (D.droppedOffState).
const DROP = D.droppedOffState || [];
const dropTotal = DROP.reduce((a, d) => a + d.count, 0);
const listAnd = (a) => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
const dropFor = (st) => { const rows = DROP.filter((d) => d.state === st); const c = rows.reduce((a, d) => a + d.count, 0);
  const to = [...new Set(rows.sort((a, b) => b.count - a.count).map((d) => d.actual))].map((k) => NAMES[k] || k);
  return c ? { c, to } : null; };
const dropNote = (st) => { const d = dropFor(st); return d ? ` ${n(d.c)} ${plural(d.c, 'alert', 'alerts')} this feed carried for roads in ${listAnd(d.to)} ${plural(d.c, 'was', 'were')} removed. ${d.to.length === 1 ? `${NAMES[d.to[0]] || d.to[0]}'s own feed carries ${plural(d.c, 'it', 'them')}.` : "Those states' own feeds carry them."}` : ''; };
const dropNoteNational = () => { if (!dropTotal) return '';
  const byFeed = {}; DROP.forEach((d) => { byFeed[d.state] = (byFeed[d.state] || 0) + d.count; });
  const [top, topC] = Object.entries(byFeed).sort((a, b) => b[1] - a[1])[0];
  return ` ${n(dropTotal)} alerts a feed carried for another state's road were removed, ${n(topC)} of them from ${NAMES[top]}'s feed, which also carries ${listAnd(dropFor(top).to.slice(0, 2))} roads.`; };
// Each state against its own earlier months (D.stateHistory, built by gen-road-report.mjs).
const MONTH_LONG = (ym) => { const [y, m] = ym.split('-').map(Number); return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' }); };
const histOf = (st) => ((D.stateHistory && D.stateHistory[st]) || []);
const histLine = (h) => `<strong>${MONTH_LONG(h.month)}</strong> &mdash; ${n(h.total)} alerts: ${n(h.crash)} ${h.crash === 1 ? 'crash' : 'crashes'}, ${n(h.closure)} ${h.closure === 1 ? 'closure' : 'closures'}, ${n(h.construction)} roadwork`;
const extras = (opts) => [
  opts.fires && FA ? ` Fire figures are ${fireAsOf}.` : '',
  opts.border && BW ? ' Border waits are from U.S. Customs and Border Protection, saved every hour. Readings over five hours were treated as feed errors.' : '',
].join('');

// Optional hand-checked extras for the top tiles (data/road-report-<month>-<year>-extra.json).
let EX = null; try { EX = JSON.parse(readFileSync(resolve(ROOT, `data/road-report-${KEY}-extra.json`), 'utf8')); } catch {}
// ---------- national page ----------
const nums = [
  `<div><b>${n(T.crash)}</b><span>crash alerts</span></div>`,
  `<div><b>${n(T.closure)}</b><span>closure alerts</span></div>`,
  `<div><b>${n(T.construction)}</b><span>roadwork alerts</span></div>`,
  EX && EX.snowIceLower48 != null ? `<div><b>${n(EX.snowIceLower48)}</b><span>snow, ice and chain alerts in the lower 48</span></div>` : '',
].filter(Boolean).join('\n        ');

const national = [];
if (updLong) national.push(`<p class="rc-fig"><strong>Updated ${updLong}.</strong> Alerts a feed carried for another state's road were removed, and each state is now compared with its own earlier months instead of with other states.</p>`);
national.push(`<p class="article-lead">What road feeds published in ${MONTH_NAME} ${YEAR} across all 50 US states, British Columbia, Alberta and Manitoba. ${[BW && 'border waits', BR && 'Seattle drawbridge openings', FA && 'wildfire records'].filter(Boolean).length ? `The report also covers ${[BW && 'border waits', BR && 'Seattle drawbridge openings', FA && 'wildfire records'].filter(Boolean).join(', ').replace(/, ([^,]*)$/, ' and $1')}, from separate sources.` : ''}</p>`);
national.push(methodBox('each state department of transportation (DOT) road feed, DriveBC, 511 Alberta and Manitoba 511', ''));
const JUMP = `<p style="margin:4px 0 30px;"><a href="#by-state" style="display:inline-block;background:#0F1419;color:#fff;font-weight:700;padding:10px 18px;border-radius:8px;text-decoration:none;">Find your state &darr;</a></p>`;
national.push(`<div class="headline-nums">\n        ${nums}\n      </div>`);
national.push(JUMP);
// Monthly maps (scripts/road-report-maps/build.sh in the app repo). Shown when the images exist.
{
  const MAPS = [['snow', 'Snow, ice and chain alerts'], ['crash', 'Crash alerts'], ['closure', 'Road closure alerts'], ['cameras', 'Every DOT camera on MileCheck, as the month closed']]
    .filter(([k]) => existsSync(resolve(ROOT, `blog/highway-report-maps/${KEY}/${k}.webp`)));
  if (MAPS.length) {
    national.push(`<h2 class="rc">The month on a map</h2>`);
    national.push(`<p>Each dot is one alert a feed posted in ${MONTH_NAME}. Blank areas can mean a feed does not post that kind of alert, so these maps show where alerts were posted, not every crash or closure.</p>`);
    national.push(`<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;margin:0 0 26px;">${MAPS.map(([k, t]) => `<figure style="margin:0;"><a href="highway-report-maps/${KEY}/${k}.webp"><img src="highway-report-maps/${KEY}/${k}.webp" width="900" height="1125" loading="lazy" alt="${t} posted on state and provincial road feeds in ${MONTH_NAME} ${YEAR}, one dot per alert" style="width:100%;height:auto;border-radius:8px;display:block;"></a><figcaption style="font-size:13px;color:#5C6670;margin-top:6px;">${t}</figcaption></figure>`).join('')}</div>`);
  }
}
national.push(`<h2 class="rc">Crashes</h2>`);
national.push(`<p>Road feeds in ${crashStates.length} states and provinces posted ${n(T.crash)} crash alerts in ${MONTH_NAME}. Each agency decides which crashes go on its feed, and some post none. Your state's page shows which routes had the most.</p>`);
// Fatality mentions only on states whose feeds report them (CA Highway Patrol logs, TX). Leah 2026-11-02.
national.push(`<h2 class="rc">Closures and roadwork</h2>`);
national.push(`<p>Road feeds posted ${n(T.closure)} closure alerts and ${n(T.construction)} roadwork alerts in ${MONTH_NAME}. Your state's page shows which routes had the most.</p>`);
// The national month-by-month section was cut (Leah 2026-11-02); state pages keep their own history.
// Feed-change notes go on that state's own page only (Leah 2026-11-02).
if (BW && BW.byMax.length) {
  national.push(`<h2 class="rc">Border waits</h2>`);
  national.push(`<p>Waits to enter the United States in standard passenger lanes, ${MONTH_NAME}, from hourly U.S. Customs and Border Protection readings. Averages use every valid hourly reading. Dates are local to each crossing.</p>`);
  national.push(box('Highest single reading', [...BW.all].sort((x, y) => y.maxMin - x.maxMin || y.avgMin - x.avgMin).slice(0, 6).map((p) => `<strong>${portLabel(p)}</strong>${p.state ? ` (${NAMES[p.state]})` : ''} &mdash; ${hm(p.maxMin)}, ${dayOf(p.maxAt, p)}`)));
  national.push(box('Longest average wait', BW.byAvg.filter((p) => (p.readings || 0) >= 300).slice(0, 6).map((p) => `<strong>${portLabel(p)}</strong>${p.state ? ` (${NAMES[p.state]})` : ''} &mdash; ${hm(p.avgMin)} average`)));
  national.push(`<p>Live waits are at <a href="../borders/">milecheckapp.com/borders</a>.</p>`);
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
  national.push(`<p>The national wildfire feed (NIFC, plus the BC Wildfire Service) listed ${n(faTotals.active)} fire records ${fireAsOf} in the states and provinces we track, after prescribed burns were removed.${EX && EX.fires1000Plus != null ? ` ${n(EX.firesUnderOneAcre)} of them were under an acre. ${n(EX.fires1000Plus)} were 1,000 acres or more, and ${n(EX.fires1000PlusNotContained)} of those were not fully contained.` : ' Many are mostly or fully contained.'}</p>`);
  national.push(box(`Largest fires, ${fireAsOf}`, fireStates.flatMap(([st, s]) => s.largest.map((f) => ({ st, f }))).sort((x, y) => (y.f.acres || 0) - (x.f.acres || 0)).slice(0, 12).map(({ st, f }) => `<strong>${NAMES[st]}</strong> &mdash; ${fireLine(f, st)}`)));
  national.push(`<p>Thank you to the firefighters and crews who worked these fires all season.</p>`);
  national.push(`<p>Live fire perimeters and the closures near them are at <a href="../fire/">milecheckapp.com/fire</a>.</p>`);
}
{
  const wst = [...new Set(SEASONAL.flatMap((e) => String(e.state).split('/')))].filter((k) => NAMES[k]).sort((x, y) => NAMES[x].localeCompare(NAMES[y]));
  if (wst.length) {
    national.push(`<h2 class="rc">Winter closures</h2>`);
    national.push(`<p>Some mountain roads close every winter. These states have them, and each state page lists the roads, their usual closing and reopening times, and the agency source. We update the list each month through winter.</p>`);
    national.push(`<ul class="state-grid">\n        ${wst.map((k) => `<li><a href="${STATE_DIR_NAME}/${slug(k)}.html">${NAMES[k]}</a></li>`).join('\n        ')}\n      </ul>`);
  }
}
national.push(`<p style="margin:30px 0 0;font-size:15px;"><a href="#subscribe" style="color:#0f7a4f;font-weight:700;text-decoration:none;border-bottom:1px solid #9fd3b8;">&#9993; Get next month's report by email &rarr;</a></p>`);
national.push(`<h2 class="rc" id="by-state">By state</h2>`);
national.push(`<p>Each state and province has its own page with the same measures.</p>`);
national.push(`<ul class="state-grid">\n        ${Object.keys(NAMES).sort((a, b) => NAMES[a].localeCompare(NAMES[b])).map((st) => `<li><a href="${STATE_DIR_NAME}/${slug(st)}.html">${NAMES[st]}</a></li>`).join('\n        ')}\n      </ul>`);

// "What's new at MileCheck" (Leah: on every report, at the end). One file per month, written by hand
// from that month's git log; only shipped, live things.
try {
  const WN = JSON.parse(readFileSync(resolve(ROOT, `data/highway-report-whats-new-${MONTH}.json`), 'utf8'));
  national.push(`<h2 class="rc">What's new at MileCheck</h2>`);
  const li = (w) => `<li>${w.href ? `<a href="${esc(w.href)}">${esc(w.text)}</a>` : esc(w.text)}${(w.links || []).map((l) => ` <a href="${esc(l.href)}">${esc(l.text)}</a>`).join(' &middot;')}</li>`;
  for (const g of WN) {
    if (g.items) { national.push(`<h3 style="font-size:17px;margin:22px 0 4px;">${esc(g.heading)}</h3>`); national.push(`<ul class="article-list">${g.items.map(li).join('')}</ul>`); }
    else national.push(`<ul class="article-list">${li(g)}</ul>`);
  }
} catch {}

const NAT_DESC = `${n(D.totalUniqueEvents)} unique alerts published by US state and Canadian provincial road feeds in ${MONTH_NAME} ${YEAR}: ${n(T.crash)} crash, ${n(T.closure)} closure and ${n(T.construction)} roadwork alerts, with a page for each state.`;
const natCanon = `https://milecheckapp.com/${NATIONAL_FILE}`;
writeFileSync(resolve(ROOT, NATIONAL_FILE), page({
  rel: '../', canonical: natCanon, pageTitle: H1, description: NAT_DESC, h1: H1,
  byline: `by MileCheck &middot; ${pubLong}`,
  body: national.map((p) => '      ' + p).join('\n\n'),
  jsonld: { '@context': 'https://schema.org', '@type': 'NewsArticle', headline: H1, datePublished: PUBLISHED, dateModified: UPDATED || PUBLISHED, author: { '@type': 'Organization', name: 'MileCheck' }, publisher: { '@type': 'Organization', name: 'MileCheck', url: 'https://milecheckapp.com' }, mainEntityOfPage: natCanon, description: NAT_DESC },
}));

// ---------- state pages ----------
let written = 0;
for (const st of Object.keys(NAMES)) {
  const S = jOf(st), name = NAMES[st];
  const feed = DOT_NAME[st] ? `the ${DOT_NAME[st]} feed` : `${name}'s department of transportation (DOT) feed`;
  const fire = FA && FA.byState[st];
  const ports = BW ? BW.all.filter((p) => p.state === st).sort((a, b) => b.maxMin - a.maxMin || b.avgMin - a.avgMin).slice(0, 6) : [];
  const lt = ltOf(st);
  const parts = [];
  parts.push(`<p class="article-lead">What ${feed} showed in ${MONTH_NAME} ${YEAR}. Part of the <a href="../road-report-${KEY}.html">national ${H1}</a>.</p>`);
  if (updLong && dropFor(st)) parts.push(`<p class="rc-fig"><strong>Updated ${updLong}.</strong> Alerts this feed carried for another state's road were removed.</p>`);
  parts.push(methodBox(DOT_NAME[st] ? `the ${DOT_NAME[st]} feed` : `${name}'s department of transportation (DOT) feed`, dropNote(st) + extras({ fires: !!fire, border: ports.length > 0 })));
  if (feedNote(st)) parts.push(`<p class="rc-fig"><strong>Feed change.</strong> ${feedNote(st)}</p>`);
  const sn = [];
  if (S.crash > 0) sn.push(`<div><b>${n(S.crash)}</b><span>crash alerts in ${MONTH_NAME}</span></div>`);
  sn.push(`<div><b>${n(S.closure)}</b><span>closure alerts</span></div>`);
  sn.push(`<div><b>${n(S.construction)}</b><span>roadwork alerts</span></div>`);
  if (fire) sn.push(`<div><b>${n(fire.active)}</b><span>${plural(fire.active, 'wildfire record', 'wildfire records')}, ${fireAsOf}</span></div>`);
  if (st === 'WA' && BR) sn.push(`<div><b>${n(bridgeTotal)}</b><span>Seattle drawbridge openings</span></div>`);
  parts.push(`<div class="headline-nums">${sn.join('')}</div>`);
  if (S.total === 0) {
    parts.push(`<h2 class="rc">Crashes, closures and roadwork</h2><p>${name}'s feed returned no records in ${MONTH_NAME}, so this page cannot say what was on the roads.</p>`);
  } else {
    parts.push(`<h2 class="rc">Crashes</h2>`);
    parts.push(S.crash > 0 ? `<p>${name}'s road feed carried ${n(S.crash)} crash ${plural(S.crash, 'alert', 'alerts')} in ${MONTH_NAME}.</p>` : `<p>No crash alerts were on ${name}'s feed in ${MONTH_NAME}. Not every agency publishes crash reports.</p>`);
    const hs = D.crashHotspots && D.crashHotspots[st];
    if (hs && hs.routes.length) parts.push(box('Routes with the most crash alerts', hs.routes.map(([r, c]) => `<strong>${esc(route(st, r))}</strong> &mdash; ${n(c)}`)));
    // Oregon's feed puts ODOT highway names (Pacific, Columbia River, Old Oregon Trail) in the place field, not areas.
    const hp = hs && st !== 'OR' ? hs.places.filter((q) => realPlace(q.place)) : [];
    if (hp.length) parts.push(box(st === 'CA' ? 'Highway Patrol dispatch areas named in two or more crash alerts' : 'Areas named in two or more crash alerts', hp.map((p) => `<strong>${esc(title(p.place))}</strong>${p.route ? ` (${esc(route(st, p.route))})` : ''} &mdash; ${n(p.crashes)}`)));
    const fs = fatal.filter((f) => f.state === st);
    if (fs.length && ['CA', 'TX'].includes(st)) parts.push(box('Crash alerts that mentioned a fatality', fs.map((f) => `<strong>${esc(route(st, f.route || ''))}</strong> &mdash; ${dateLong(f.date.slice(0, 10)).replace(/, \d{4}$/, '')}`)));
    parts.push(`<h2 class="rc">Closures and roadwork</h2>`);
    parts.push(`<p>${n(S.closure)} ${S.closure === 1 ? 'closure' : 'closures'} and ${n(S.construction)} roadwork ${S.construction === 1 ? 'record' : 'records'} were on ${name}'s feed in ${MONTH_NAME}, out of ${n(S.total)} alerts of all types.</p>`);
    const rc = (S.routeCounts || []).filter(([r]) => r);
    if (rc.length) parts.push(box(`Routes with the most alerts in ${name}`, rc.map(([r, c]) => `<strong>${esc(route(st, r))}</strong> &mdash; ${n(c)}`)));
    else if (S.topRoutes && S.topRoutes.length) parts.push(`<p>The routes with the most alerts were ${S.topRoutes.map((r) => esc(route(st, r))).join(', ').replace(/, ([^,]*)$/, ' and $1')}.</p>`);
  }
  {
    // This state against its own earlier months only.
    const h = histOf(st), comp = h.filter((x) => x.comparable), cur = h.find((x) => x.month === MONTH);
    parts.push(`<h2 class="rc">Compared with earlier months</h2>`);
    if (feedNote(st)) parts.push(`<p>See the feed change note at the top of this page.</p>`);
    if (cur && !cur.comparable) parts.push(`<p>MileCheck has ${n(cur.days)} of ${cur.daysInMonth} days of ${name}'s feed for ${MONTH_NAME}, so these counts are partial.</p>`);
    else if (comp.length >= 2) parts.push(`<p>Unique alerts on ${name}'s feed in each full month MileCheck has.</p>` + box('By month', comp.map(histLine)));
    else parts.push(`<p>${MONTH_NAME} is the first full month of ${name}'s feed in MileCheck's archive. Next month's report compares it with ${MONTH_NAME}.</p>`);
  }
  { const w = winterSection(st, name); if (w) parts.push(w); }
  if (ports.length) {
    parts.push(`<h2 class="rc">Border waits</h2><p>Waits to enter the United States in standard passenger lanes at ${name}'s crossings, ${MONTH_NAME}, from hourly readings. Dates are local.</p>`);
    parts.push(box('By crossing', ports.map((p) => `<strong>${portLabel(p)}</strong> &mdash; ${p.maxMin ? `highest ${hm(p.maxMin)} (${dayOf(p.maxAt, p)}), average ${hm(p.avgMin)}` : `no wait in any of ${n(p.readings)} readings`}`)));
    parts.push(`<p>Live waits are at <a href="../../borders/">milecheckapp.com/borders</a>.</p>`);
  }
  if (st === 'WA' && BR && BR.length) {
    parts.push(`<h2 class="rc">Seattle drawbridges</h2><p>Seattle's drawbridges opened ${n(bridgeTotal)} times in ${MONTH_NAME}.</p>`);
    parts.push(box(`Openings, ${MONTH_NAME}`, BR.map((b) => `<strong>${bridgeName(b.id)}</strong> &mdash; ${n(b.openings)} openings${b.medianMin != null ? `, typically ${b.medianMin} minutes, longest ${b.longestMin}` : ''}`)));
  }
  if (fire) {
    parts.push(`<h2 class="rc">Wildfires</h2><p>The national wildfire feed listed ${n(fire.active)} ${plural(fire.active, 'fire record', 'fire records')} in ${name} ${fireAsOf}.${st === 'BC' ? ' The BC Wildfire Service does not publish containment percentages.' : ''}</p>`);
    parts.push(box(`Largest fires, ${fireAsOf}`, fire.largest.map((f) => fireLine(f, st))));
    parts.push(`<p>Thank you to the firefighters and crews who worked these fires all season.</p>`);
    parts.push(`<p>Live fire perimeters are at <a href="../../fire/">milecheckapp.com/fire</a>.</p>`);
  }
  parts.push(`<p style="margin-top:34px;">See the <a href="../road-report-${KEY}.html">national report</a> or <a href="index.html">another state or province</a>.</p>`);
  const h1 = `MileCheck Highway Report: ${name}, ${MONTH_NAME} ${YEAR}`;
  const firstMonth = !(histOf(st).filter((x) => x.comparable).length >= 2);
  const desc = `${S.crash > 0 ? `${n(S.crash)} crash, ` : ''}${n(S.closure)} closure and ${n(S.construction)} roadwork alerts published by ${DOT_NAME[st] ? `the ${DOT_NAME[st]} feed` : `${name}'s DOT feed`} in ${MONTH_NAME} ${YEAR}${firstMonth ? `, MileCheck's first full month of ${name}` : ', compared with earlier months'}${ports.length ? ', plus border waits' : ''}${fire ? ', plus wildfires' : ''}.`;
  const canonical = `https://milecheckapp.com/blog/${STATE_DIR_NAME}/${slug(st)}.html`;
  writeFileSync(resolve(OUT_DIR, `${slug(st)}.html`), page({
    rel: '../../', canonical, pageTitle: h1, description: desc, h1,
    byline: `by MileCheck &middot; ${pubLong}`,
    body: parts.map((p) => '      ' + p).join('\n\n'),
    jsonld: { '@context': 'https://schema.org', '@type': 'NewsArticle', headline: h1, datePublished: PUBLISHED, dateModified: UPDATED || PUBLISHED, author: { '@type': 'Organization', name: 'MileCheck' }, publisher: { '@type': 'Organization', name: 'MileCheck', url: 'https://milecheckapp.com' }, mainEntityOfPage: canonical, description: desc, isPartOf: natCanon },
  }));
  written++;
}
const idxCanon = `https://milecheckapp.com/blog/${STATE_DIR_NAME}/`;
writeFileSync(resolve(OUT_DIR, 'index.html'), page({
  rel: '../../', canonical: idxCanon, pageTitle: `${H1}, by State`,
  description: `The ${H1} for every US state, British Columbia, Alberta and Manitoba: crashes, closures and roadwork from each state DOT feed.`,
  h1: `${H1}, by State`, byline: `by MileCheck &middot; ${pubLong}`,
  body: `      <p class="article-lead">One page per state and province, with the same measures. The <a href="../road-report-${KEY}.html">national report</a> has the totals.</p>\n      <ul class="state-grid">\n        ${Object.keys(NAMES).sort((a, b) => NAMES[a].localeCompare(NAMES[b])).map((st) => `<li><a href="${slug(st)}.html">${NAMES[st]}</a></li>`).join('\n        ')}\n      </ul>`,
  jsonld: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: `${H1}, by State`, url: idxCanon, publisher: { '@type': 'Organization', name: 'MileCheck' } },
}));
console.log(`Wrote ${NATIONAL_FILE}, the state index, and ${written} state pages to blog/${STATE_DIR_NAME}/`);
