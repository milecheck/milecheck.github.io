#!/usr/bin/env node
// gen-labor-day-recap-pages.mjs — the Labor Day Weekend Road Recap, national page plus one page per
// jurisdiction, from data/labor-day-recap-2026.json (built by the app repo's recap tally, which mirrors
// scripts/gen-road-report.mjs: one record per incident id, Sept 3–7 snapshots, 51 jurisdictions).
//
//   node scripts/gen-labor-day-recap-pages.mjs
//   then: node scripts/tag-store-links.mjs --pt 128447811 && node scripts/add-analytics.mjs G-CDMSB5630W && node scripts/build-sitemap.mjs
//
// Writes blog/labor-day-weekend-recap-2026.html (national) and blog/labor-day-weekend-recap-2026-states/<state>.html.
// The state folder is NOT named after the national page: a folder and a page with the same name resolve
// ambiguously on extensionless URLs (found 2026-09-22 on the local preview).
// Copy follows marketing/REPORT-VOICE.md in the app repo: label titles, one method box, counts with their scope,
// fires as acres and containment, driver order (crashes, closures, border, bridges, fires, weather).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const D = JSON.parse(readFileSync(resolve(ROOT, 'data/labor-day-recap-2026.json'), 'utf8'));
const OUT_DIR = resolve(ROOT, 'blog/labor-day-weekend-recap-2026-states');
mkdirSync(OUT_DIR, { recursive: true });

const NAMES = { AL:'Alabama', AK:'Alaska', AZ:'Arizona', AR:'Arkansas', CA:'California', CO:'Colorado', CT:'Connecticut', DE:'Delaware', FL:'Florida', GA:'Georgia', HI:'Hawaii', ID:'Idaho', IL:'Illinois', IN:'Indiana', IA:'Iowa', KS:'Kansas', KY:'Kentucky', LA:'Louisiana', ME:'Maine', MD:'Maryland', MA:'Massachusetts', MI:'Michigan', MN:'Minnesota', MS:'Mississippi', MO:'Missouri', MT:'Montana', NE:'Nebraska', NV:'Nevada', NH:'New Hampshire', NJ:'New Jersey', NM:'New Mexico', NY:'New York', NC:'North Carolina', ND:'North Dakota', OH:'Ohio', OK:'Oklahoma', OR:'Oregon', PA:'Pennsylvania', RI:'Rhode Island', SC:'South Carolina', SD:'South Dakota', TN:'Tennessee', TX:'Texas', UT:'Utah', VT:'Vermont', VA:'Virginia', WA:'Washington', WV:'West Virginia', WI:'Wisconsin', WY:'Wyoming', BC:'British Columbia' };
const slug = (st) => NAMES[st].toLowerCase().replace(/\s+/g, '-');
const n = (x) => Number(x || 0).toLocaleString('en-US');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const title = (s) => { s = String(s).replace(/^\d+\s+/, '').trim(); return s === s.toUpperCase() ? s.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase()).replace(/\bMc([a-z])/g, (m, c) => 'Mc' + c.toUpperCase()) : s; };
const NO_RECORDS = ['RI', 'NM'];           // feeds returned nothing for the five days
const NO_CRASH_FEED = ['NC', 'ID'];        // crash reports not in MileCheck's feed for this window (our gap)
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
const when = (s) => (s ? s.replace(/^(\w+) (.+)$/, '$1 at $2') : '');
const dateLong = (iso) => { const [y, mo, d] = iso.split('-').map(Number); return new Date(Date.UTC(y, mo - 1, d)).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long', day: 'numeric', year: 'numeric' }); };
const fireLine = (f, st) => `${esc(title(f.name))}${f.county && st !== 'BC' ? ` (${esc(f.county)} County)` : ''}, ${n(f.acres)} acres, ${f.contained == null ? 'containment not published' : `${f.contained}% contained`}`;

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

      <p class="article-eyebrow">Highway Report</p>
      <h1 class="article-title">${esc(h1)}</h1>
      <p class="article-byline">${byline}</p>

${body}

      <div class="article-cta">
        <h3>The live version is in the app.</h3>
        <p>MileCheck shows DOT alerts for crashes, closures, and delays in all 50 states, British Columbia, Alberta and Manitoba as they are published, with your nearest mile marker.</p>
        <a href="https://apps.apple.com/app/apple-store/id6759212851?pt=128447811&mt=8" class="btn btn-primary" target="_blank" rel="noopener">App Store</a>
        <a href="https://play.google.com/store/apps/details?id=app.milecheck.mobile" class="btn btn-primary" target="_blank" rel="noopener">Google Play</a>
      </div>

      <p class="article-note">Built from MileCheck's archive of state DOT road feeds. The monthly Highway Report, the same treatment across a full month, starts with September 2026.</p>

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
      <p class="mc-sub">The month's numbers from DOT feeds in all 50 states and BC. <a href="/blog/labor-day-weekend-recap-2026.html">See a sample: the Labor Day weekend report</a>. No spam.</p>
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

const METHOD_NATIONAL = `<div class="method-box"><strong>How we got these numbers:</strong> MileCheck saves every state department of transportation (DOT) road alert as it's published. We counted what was on those feeds from Sept. 3 through Sept. 7. Not all states report the same data. Fire figures are as of Labor Day, Sept. 7, 4:50 PM Pacific; border waits are from U.S. Customs and Border Protection, saved every hour, in each crossing's local time. Rhode Island and New Mexico returned no records for the five days, and North Carolina and Idaho crash reports were not in our feed.</div>`;

const T = D.totals, F = D.fires, B = D.border;
const ldFires = F.byState.filter((s) => s.state !== '??');
const fireSt = (code) => ldFires.find((s) => s.state === code);
const fireCallout = (code) => { const s = fireSt(code); if (!s) return null; return `<strong>${NAMES[code]}</strong>: ${n(s.count)} active fires, ${n(s.acres)} acres. ${s.top.slice(0, code === 'OR' || code === 'WA' ? 4 : 3).map((f) => fireLine(f, code)).join('; ')}.`; };
const longTermRows = D.longTerm.filter((p) => !(p.state === 'NY' && p.route === 'I-91')); // that record describes I-91 in Connecticut and rides New York's feed
const crashTop = D.crashStates.slice(0, 8);

// ---------- national page ----------
const nationalBody = `
      <p class="article-lead">What the state road feeds showed from Thursday, Sept. 3 through Labor Day, Monday, Sept. 7, 2026, in all 50 states and British Columbia. Crashes, closures, border waits, Seattle's drawbridges, wildfires, and the first ice of the season.</p>

      ${METHOD_NATIONAL}

      <div class="headline-nums">
        <div><b>${n(T.crash)}</b><span>crashes reported, in the ${D.statesWithCrashes} states and provinces that publish them</span></div>
        <div><b>${n(T.closure)}</b><span>closures on the feeds, all 51 jurisdictions</span></div>
        <div><b>${n(T.construction)}</b><span>roadwork records on the feeds</span></div>
        <div><b>${D.bridges.total}</b><span>Seattle drawbridge openings, Thursday through Monday</span></div>
        <div><b>${(F.acres / 1e6).toFixed(1)}M</b><span>acres in ${n(F.count)} active wildfires, as of Labor Day</span></div>
      </div>

      <h2 class="rc">Crashes</h2>
      <p>${n(T.crash)} crashes were reported from Sept. 3 through Sept. 7, in the ${D.statesWithCrashes} states and provinces that publish crash data. California reports the most crashes and carries the most traffic, so it leads any national list.</p>
      ${box('Crashes reported by state, Sept. 3 through Sept. 7', crashTop.map(([st, c]) => `<strong>${NAMES[st]}</strong> &mdash; ${n(c)}`))}
      ${box('Corridors with the most crash reports', D.crashCorridors.slice(0, 8).map((r) => `<strong>${esc(r.route)}</strong> &mdash; ${r.crashes}`))}
      <p>Every state's own count is on its page below.</p>

      <h2 class="rc">Closures and roadwork</h2>
      <p>${n(T.closure)} closures and ${n(T.construction)} roadwork records were on the feeds over the five days, across all 51 jurisdictions. Roadwork did not stop for the holiday. The number of roadwork records on the feeds dipped ${Math.round((1 - D.perDay[2].construction / D.perDay[0].construction) * 100)}% on Saturday and was back near Thursday's level by Monday.</p>
      <p>Seven records named Labor Day, and all of them were parades. Keokuk, Iowa closed US-136 and US-218. Malden, Indiana closed IN-49. Hoisington, Kansas closed US-281 for its festival. Pioche, Nevada closed SR-321 and SR-322.</p>
      ${box('Closures scheduled to run for years, one per state', longTermRows.slice(0, 6).map((p) => `<strong>${NAMES[p.state]}, ${esc(p.route || '')}</strong> &mdash; ${n(p.projectDays)} days, ${dateLong(p.start)} through ${dateLong(p.end)}`))}
      <p>Washington's SR-165 has been closed at the Carbon River bridge to all vehicles, bicycles, and pedestrians since April 2025, with reopening posted for July 2030.</p>
      ${box('Corridors with the most records, all types', D.corridors.slice(0, 8).map((r) => `<strong>${esc(r.route)}</strong> &mdash; ${n(r.records)} records across ${r.states} ${r.states === 1 ? 'state' : 'states'}`))}
      <p>I-80 crosses eleven states. See it live on <a href="../corridors/i-80/">the I-80 map</a>, or <a href="../corridors/">any corridor</a>.</p>

      <h2 class="rc">Border waits</h2>
      <p>The longest passenger-lane waits came Sunday evening and Monday, on the way home. Times are local to each crossing.</p>
      ${box('Longest passenger-lane waits, Sept. 3 through Sept. 7', B.top.slice(0, 7).map((p) => `<strong>${esc(p.port)}${p.crossing && !/Passenger/i.test(p.crossing) ? ' / ' + esc(p.crossing) : ''}</strong> (${NAMES[p.state === 'ELP' ? 'TX' : p.state]}) &mdash; ${p.peakMin} min, ${when(p.peakLocal)}`))}
      <p>Blaine's Peace Arch crossing peaked at ${B.pnw[0].peakMin} minutes ${when(B.pnw[0].peakLocal)} and averaged ${Math.round(B.pnw[0].avgMin)} minutes over the five days. On Labor Day the slowest hour there was 1 PM and the fastest was 5 PM. Live waits for all 85 crossings are at <a href="../borders/">milecheckapp.com/borders</a>.</p>

      <h2 class="rc">Seattle drawbridges</h2>
      <p>Seattle's five drawbridges opened ${D.bridges.total} times from Thursday through Monday. Fremont alone opened ${D.bridges.list[0].raises} times, about ${Math.round(D.bridges.list[0].raises / 5)} a day.</p>
      ${box('Openings, Thursday through Monday', D.bridges.list.map((b) => `<strong>${esc(title(b.bridge.replace(/-/g, ' ')).replace('1st Ave S', '1st Ave S'))}</strong> &mdash; ${b.raises} openings, typically ${Math.round(b.medianMin)} minutes, longest ${Math.round(b.longestMin)}`))}
      <p>Live status for all five is on <a href="../maps/#drawbridges">the drawbridge map</a>.</p>

      <h2 class="rc">Wildfires</h2>
      <p>Wildfires are still affecting western states and British Columbia. As of Labor Day, Washington had ${fireSt('WA').count} active fires, including two over 160,000 acres that were not yet contained. Oregon's biggest fires were mostly contained by the weekend. Across every state and province we track, ${n(F.count)} active fires covered ${n(F.acres)} acres.</p>
      ${box('Largest fires by state, as of Labor Day, Sept. 7, 4:50 PM Pacific', ['OR', 'BC', 'WA', 'ID', 'UT', 'CO', 'NV', 'MT'].map(fireCallout).filter(Boolean))}
      <p>Live fire perimeters and the closures near them are at <a href="../fire/">milecheckapp.com/fire</a>.</p>

      <h2 class="rc">Weather</h2>
      <p>Monarch Pass, Colorado was icy on Labor Day weekend. US-50 at milepost 199 eastbound read icy with a road surface between 16°F and 18°F on all five days. I-70 at Silverthorne and near Dumont read icy on single days. Alaska's Dalton Highway reported snow on the roadway at the Sag River and at Chandalar. No other jurisdiction reported ice or snow on a road surface.</p>

      <h2 class="rc">By state</h2>
      <p>Each jurisdiction has its own page with the same measures.</p>
      <ul class="state-grid">
        ${Object.keys(NAMES).sort((a, b) => NAMES[a].localeCompare(NAMES[b])).map((st) => `<li><a href="labor-day-weekend-recap-2026-states/${slug(st)}.html">${NAMES[st]}</a></li>`).join('\n        ')}
      </ul>
`;

const NATIONAL_DESC = `${n(T.crash)} crashes reported in ${D.statesWithCrashes} states, ${n(T.closure)} closures, border waits by crossing, ${D.bridges.total} Seattle drawbridge openings, and wildfires by state, from every state DOT feed, Sept. 3 through Sept. 7, 2026.`;
writeFileSync(resolve(ROOT, 'blog/labor-day-weekend-recap-2026.html'), page({
  rel: '../', canonical: 'https://milecheckapp.com/blog/labor-day-weekend-recap-2026.html',
  pageTitle: 'Labor Day Weekend Road Recap | MileCheck', description: NATIONAL_DESC,
  h1: 'Labor Day Weekend Road Recap', byline: 'by MileCheck &middot; September 8, 2026 &middot; revised September 22, 2026',
  body: nationalBody,
  jsonld: { '@context': 'https://schema.org', '@type': 'NewsArticle', headline: 'Labor Day Weekend Road Recap', datePublished: '2026-09-08', dateModified: '2026-09-22', author: { '@type': 'Organization', name: 'MileCheck' }, publisher: { '@type': 'Organization', name: 'MileCheck', url: 'https://milecheckapp.com' }, mainEntityOfPage: 'https://milecheckapp.com/blog/labor-day-weekend-recap-2026.html', description: NATIONAL_DESC },
}));

// ---------- state pages ----------
let written = 0;
for (const st of Object.keys(NAMES)) {
  const S = D.states[st]; const name = NAMES[st]; const dot = DOT_NAME[st] || `${name}'s department of transportation (DOT)`;
  const ports = [...(B.byState[st] || []), ...(st === 'TX' ? B.byState.ELP || [] : [])].filter((p) => p.peakMin > 0).sort((a, b) => b.peakMin - a.peakMin).slice(0, 6);
  const fire = fireSt(st);
  const parts = [];
  const gapLine = NO_RECORDS.includes(st) ? ` ${name}'s feed returned no records for the five days.`
    : NO_CRASH_FEED.includes(st) ? ` ${name} crash reports were not in MileCheck's feed for this window.` : '';
  parts.push(`<p class="article-lead">What ${st === 'BC' ? 'the DriveBC feed' : `${name}'s department of transportation (DOT) feed`} showed from Thursday, Sept. 3 through Labor Day, Monday, Sept. 7, 2026. Part of the <a href="../labor-day-weekend-recap-2026.html">national Labor Day Weekend Road Recap</a>.</p>`);
  parts.push(`<div class="method-box"><strong>How we got these numbers:</strong> MileCheck saves every state department of transportation (DOT) road alert as it's published. We counted what was on ${st === 'BC' ? "British Columbia's" : `${name}'s`} feed from Sept. 3 through Sept. 7. Not all states report the same data.${fire ? ' Fire figures are as of Labor Day, Sept. 7, 4:50 PM Pacific.' : ''}${ports.length ? ' Border waits are from U.S. Customs and Border Protection, saved every hour, in local time.' : ''}${gapLine}</div>`);

  const nums = [];
  if (!NO_RECORDS.includes(st)) {
    if (!NO_CRASH_FEED.includes(st)) nums.push(`<div><b>${n(S.crash)}</b><span>crashes reported, Sept. 3 through Sept. 7</span></div>`);
    nums.push(`<div><b>${n(S.closure)}</b><span>closures on the feed</span></div>`);
    nums.push(`<div><b>${n(S.construction)}</b><span>roadwork records on the feed</span></div>`);
  }
  if (fire) nums.push(`<div><b>${n(fire.acres)}</b><span>acres in ${n(fire.count)} active ${fire.count === 1 ? 'fire' : 'fires'}, as of Labor Day</span></div>`);
  if (st === 'WA') nums.push(`<div><b>${D.bridges.total}</b><span>Seattle drawbridge openings</span></div>`);
  if (nums.length) parts.push(`<div class="headline-nums">${nums.join('')}</div>`);

  if (NO_RECORDS.includes(st)) {
    parts.push(`<h2 class="rc">Crashes, closures, and roadwork</h2><p>${name}'s feed returned no records from Sept. 3 through Sept. 7, so this page cannot say what was on the roads. The national recap covers the states that did report.</p>`);
  } else {
    // crashes
    parts.push(`<h2 class="rc">Crashes</h2>`);
    if (NO_CRASH_FEED.includes(st)) parts.push(`<p>Crash counts are not available for ${name} in this report. ${name} publishes crash reports, and MileCheck's feed for this window did not carry them.</p>`);
    else if (S.crash > 0) { parts.push(`<p>${n(S.crash)} ${S.crash === 1 ? 'crash was' : 'crashes were'} reported in ${name} from Sept. 3 through Sept. 7.</p>`); if (S.crashRoutes.length) parts.push(box('Routes with the most crash reports', S.crashRoutes.map(([r, c]) => `<strong>${esc(route(st, r))}</strong> &mdash; ${c}`))); }
    else parts.push(`<p>No crashes were on ${name}'s feed from Sept. 3 through Sept. 7. Not all states publish crash reports.</p>`);
    // closures + roadwork
    parts.push(`<h2 class="rc">Closures and roadwork</h2>`);
    parts.push(`<p>${n(S.closure)} ${S.closure === 1 ? 'closure' : 'closures'} and ${n(S.construction)} roadwork ${S.construction === 1 ? 'record' : 'records'} were on ${name}'s feed over the five days.${S.total > 0 && S.closure + S.construction === 0 ? ` The feed carried ${n(S.total)} records of other types.` : ''}</p>`);
    if (S.topRoutes.length) parts.push(box('Routes with the most records, all types', S.topRoutes.map(([r, c]) => `<strong>${esc(route(st, r))}</strong> &mdash; ${n(c)}`)));
    if (S.longest) parts.push(`<p>The longest scheduled project on the feed is ${esc(route(st, S.longest.route || ''))}, ${n(S.longest.projectDays)} days, ${dateLong(S.longest.start)} through ${dateLong(S.longest.end)}. The posted description reads &ldquo;${esc(quote(S.longest.headline))}&rdquo;</p>`);
    if (S.holidayMentions > 0) parts.push(`<p>${S.holidayMentions === 1 ? 'One record' : `${S.holidayMentions} records`} on the feed named Labor Day.</p>` + box('Records that named Labor Day', [...new Set(S.holidayExamples.map((e) => { const m = e.replace(/\*\*/g, '').replace(/\s+/g, ' ').replace(/Public Details: /g, '').match(/^([^:]*): (.*)$/); return m ? `<strong>${esc(route(st, m[1].trim()))}</strong> &mdash; ${esc(m[2])}` : esc(e); }))]));
  }
  // border
  if (ports.length) {
    parts.push(`<h2 class="rc">Border waits</h2><p>Longest passenger-lane waits at ${name}'s crossings, Sept. 3 through Sept. 7, with the five-day average.</p>`);
    parts.push(box('Peak passenger-lane wait by crossing', ports.map((p) => `<strong>${esc(p.port)}${p.crossing && !/Passenger/i.test(p.crossing) ? ' / ' + esc(p.crossing) : ''}</strong> &mdash; ${p.peakMin} min, ${when(p.peakLocal)}; average ${Math.round(p.avgMin)} min`)));
    if (st === 'WA') parts.push(`<p>Blaine's Peace Arch crossing averaged ${Math.round(B.pnw[0].avgMin)} minutes over the five days. On Labor Day the slowest hour there was 1 PM and the fastest was 5 PM.</p>`);
    parts.push(`<p>Live waits for all 85 crossings are at <a href="../../borders/">milecheckapp.com/borders</a>.</p>`);
  }
  // bridges
  if (st === 'WA') {
    parts.push(`<h2 class="rc">Seattle drawbridges</h2><p>Seattle's five drawbridges opened ${D.bridges.total} times from Thursday through Monday.</p>`);
    parts.push(box('Openings, Thursday through Monday', D.bridges.list.map((b) => `<strong>${esc(title(b.bridge.replace(/-/g, ' ')))}</strong> &mdash; ${b.raises} openings, typically ${Math.round(b.medianMin)} minutes, longest ${Math.round(b.longestMin)}`)));
    parts.push(`<p>Live status for all five is on <a href="../../maps/#drawbridges">the drawbridge map</a>.</p>`);
  }
  // fires
  if (fire) {
    parts.push(`<h2 class="rc">Wildfires</h2><p>As of Labor Day, ${name} had ${n(fire.count)} active ${fire.count === 1 ? 'fire' : 'fires'} covering ${n(fire.acres)} acres.${st === 'BC' ? ' The BC Wildfire Service does not publish containment percentages.' : ''}</p>`);
    parts.push(box('Largest fires, as of Labor Day, Sept. 7, 4:50 PM Pacific', fire.top.map((f) => fireLine(f, st))));
    parts.push(`<p>Live fire perimeters and the closures near them are at <a href="../../fire/">milecheckapp.com/fire</a>.</p>`);
  }
  // weather
  if (st === 'CO') parts.push(`<h2 class="rc">Weather</h2><p>Monarch Pass was icy on Labor Day weekend. US-50 at milepost 199 eastbound read icy with a road surface between 16°F and 18°F on all five days. I-70 at Silverthorne and near Dumont read icy on single days.</p>`);
  if (st === 'AK') parts.push(`<h2 class="rc">Weather</h2><p>The Dalton Highway reported snow on the roadway at the Sag River and at Chandalar, with chains recommended.</p>`);

  parts.push(`<p style="margin-top:34px;">See the <a href="../labor-day-weekend-recap-2026.html">national recap</a> or another state: <a href="index.html">all 50 states and British Columbia</a>.</p>`);

  const h1 = `${name} Labor Day Weekend Road Recap`;
  const desc = NO_RECORDS.includes(st) ? `${name}'s road feed returned no records from Sept. 3 through Sept. 7, 2026. What MileCheck could and could not see over Labor Day weekend.`
    : `${NO_CRASH_FEED.includes(st) ? '' : `${n(S.crash)} crashes, `}${n(S.closure)} closures, and ${n(S.construction)} roadwork records on ${name}'s DOT feed, Sept. 3 through Sept. 7, 2026${ports.length ? ', plus border waits by crossing' : ''}${fire ? ', plus wildfires by acres and containment' : ''}.`;
  const canonical = `https://milecheckapp.com/blog/labor-day-weekend-recap-2026-states/${slug(st)}.html`;
  writeFileSync(resolve(OUT_DIR, `${slug(st)}.html`), page({
    rel: '../../', canonical, pageTitle: `${h1} | MileCheck`, description: desc, h1,
    byline: 'by MileCheck &middot; September 22, 2026 &middot; data from Sept. 3 through Sept. 7, 2026',
    body: parts.map((p) => '      ' + p).join('\n\n'),
    jsonld: { '@context': 'https://schema.org', '@type': 'NewsArticle', headline: h1, datePublished: '2026-09-22', dateModified: '2026-09-22', author: { '@type': 'Organization', name: 'MileCheck' }, publisher: { '@type': 'Organization', name: 'MileCheck', url: 'https://milecheckapp.com' }, mainEntityOfPage: canonical, description: desc, isPartOf: 'https://milecheckapp.com/blog/labor-day-weekend-recap-2026.html' },
  }));
  written++;
}

// ---------- state index ----------
const idxBody = `
      <p class="article-lead">One page per state and province, each with the same measures: crashes, closures and roadwork, border waits, drawbridges, wildfires, and weather, from Sept. 3 through Sept. 7, 2026. The <a href="../labor-day-weekend-recap-2026.html">national recap</a> has the totals.</p>
      <ul class="state-grid">
        ${Object.keys(NAMES).sort((a, b) => NAMES[a].localeCompare(NAMES[b])).map((st) => `<li><a href="${slug(st)}.html">${NAMES[st]}</a></li>`).join('\n        ')}
      </ul>
`;
writeFileSync(resolve(OUT_DIR, 'index.html'), page({
  rel: '../../', canonical: 'https://milecheckapp.com/blog/labor-day-weekend-recap-2026-states/',
  pageTitle: 'Labor Day Weekend Road Recap, by State | MileCheck', description: 'The Labor Day Weekend Road Recap for every US state and British Columbia: crashes, closures, roadwork, border waits, drawbridges, and wildfires, Sept. 3 through Sept. 7, 2026.',
  h1: 'Labor Day Weekend Road Recap, by State', byline: 'by MileCheck &middot; September 22, 2026',
  body: idxBody,
  jsonld: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Labor Day Weekend Road Recap, by State', url: 'https://milecheckapp.com/blog/labor-day-weekend-recap-2026-states/', publisher: { '@type': 'Organization', name: 'MileCheck' } },
}));
console.log(`Wrote the national recap, the state index, and ${written} state pages to blog/labor-day-weekend-recap-2026-states/`);
