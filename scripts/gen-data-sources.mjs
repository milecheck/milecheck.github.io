#!/usr/bin/env node
// Generates /data-sources/index.html from scripts/data-sources-data.mjs + data/coverage-ledger.json.
//   node scripts/gen-data-sources.mjs
// Then run build-search-index.mjs and build-sitemap.mjs. The WebPage @id/isPartOf are written here,
// so link-jsonld.mjs is not needed for this page.
// Deliberately NOT given a sponsor slot or signup band: this page is the source-attribution
// page Google Play reviewers read, so it stays free of ads.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { STATES, PROVINCES, OTHER } from './data-sources-data.mjs';

const ledger = JSON.parse(readFileSync('data/coverage-ledger.json', 'utf8'));
const camUS = new Set(ledger.feeds.cameras.us_state_codes);
const camCA = new Set(ledger.feeds.cameras.province_codes);
const altUS = new Set(ledger.feeds.alerts.us_state_codes);
const CHECKED = '2026-10-07';
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const host = u => new URL(u).host.replace(/^www\./, '');
const link = u => `<a href="${u}" target="_blank" rel="noopener">${esc(host(u))}</a>`;
const yes = '<span class="y">Yes</span>';
const no = '<span class="n">&ndash;</span>';

const stateRows = STATES.map(([code, name, agency, url, note]) => `
        <tr><td><strong>${name}</strong></td><td>${esc(agency)}<br>${link(url)}${note ? `<br><span class="note">${esc(note)}</span>` : ''}</td><td>${altUS.has(code) ? yes : no}</td><td>${camUS.has(code) ? yes : no}</td></tr>`).join('');
const provRows = PROVINCES.map(([code, name, agency, url, uses]) => `
        <tr><td><strong>${name}</strong></td><td>${esc(agency)}<br>${link(url)}</td><td>${uses.includes('alerts') ? yes : no}</td><td>${camCA.has(code) ? yes : no}</td></tr>`).join('');
const otherRows = OTHER.map(([what, who, url, detail]) => `
        <tr><td><strong>${what}</strong></td><td>${esc(who)}<br>${link(url)}</td><td colspan="2">${esc(detail)}</td></tr>`).join('');

const title = 'Where MileCheck Gets Its Road Data | MileCheck';
const desc = 'MileCheck is not a government app. Every state DOT, province, federal agency and weather source it reads, with a link to each one.';
const url = 'https://milecheckapp.com/data-sources/';
const ld = [
  { '@context': 'https://schema.org', '@type': 'WebPage', '@id': url + '#webpage', isPartOf: { '@id': 'https://milecheckapp.com/#website' }, name: 'Data sources', url, description: desc, inLanguage: 'en',
    publisher: { '@id': 'https://milecheckapp.com/#org' }, dateModified: CHECKED },
  { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'MileCheck', item: 'https://milecheckapp.com/' },
    { '@type': 'ListItem', position: 2, name: 'Data sources', item: url } ] },
].map(o => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join('\n  ');

// Header, footer and GA block are lifted from an existing page so they stay identical.
const ref = readFileSync('who-maintains-the-roads/index.html', 'utf8');
const ga = ref.match(/<!-- ga4 -->[\s\S]*?<!-- \/ga4 -->/)[0];
const header = ref.match(/<header class="site-header">[\s\S]*?<\/header>/)[0];
let footer = ref.match(/<footer class="site-footer">[\s\S]*?<\/footer>/)[0]
  .replace(/who-maintains-the-roads/g, 'data-sources')
  .replace('<li><a href="mailto:feedback@milecheckapp.com">', '<li><a href="/data-sources/">Data sources</a></li>\n            <li><a href="mailto:feedback@milecheckapp.com">');
const tail = ref.match(/<script>\(function\(\)\{var t=document\.querySelector\("\.nav-toggle"\)[\s\S]*?<\/script>/)[0];

const html = `<!DOCTYPE html>
<html lang="en">
<head>
${ga}
  <meta name="apple-itunes-app" content="app-id=6759212851">
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}">
  <link rel="canonical" href="${url}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:image" content="https://milecheckapp.com/images/og-banner-light.png">
  <meta property="og:url" content="${url}">
  <meta property="og:type" content="website">
  <link rel="icon" type="image/png" href="../images/favicon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../style.css">
  ${ld}
  <style>
    .art{max-width:900px;margin:0 auto;padding:34px 20px 40px;}
    .art .eyebrow{font-size:13px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:#0f7a4f;margin-bottom:6px;}
    .art h1{font-size:clamp(28px,5vw,42px);line-height:1.12;margin:0 0 14px;}
    .art .lede{font-size:18px;line-height:1.6;color:#3a444d;margin:0 0 16px;max-width:760px;}
    .art h2{font-size:23px;margin:34px 0 8px;}
    .art p{font-size:16px;line-height:1.7;color:#2a333b;margin:0 0 14px;max-width:760px;}
    .art a{color:#0f7a4f;font-weight:700;text-decoration:none;}
    .art a:hover{text-decoration:underline;}
    .art .disclaimer{border-left:4px solid #0f7a4f;background:#f4fbf7;padding:12px 16px;border-radius:0 10px 10px 0;}
    .tbl{overflow-x:auto;-webkit-overflow-scrolling:touch;margin:10px 0 6px;border:1px solid #E5E5E5;border-radius:12px;}
    .tbl table{border-collapse:collapse;width:100%;min-width:560px;font-size:14.5px;line-height:1.45;}
    .tbl th{text-align:left;background:#f6f7f8;padding:9px 12px;font-size:12.5px;letter-spacing:.03em;text-transform:uppercase;color:#5b6670;border-bottom:1px solid #E5E5E5;}
    .tbl td{padding:10px 12px;border-bottom:1px solid #EEF0F1;vertical-align:top;color:#2a333b;}
    .tbl tr:last-child td{border-bottom:0;}
    .tbl td:nth-child(3),.tbl td:nth-child(4),.tbl th:nth-child(3),.tbl th:nth-child(4){text-align:center;white-space:nowrap;}
    .tbl .y{color:#0f7a4f;font-weight:800;} .tbl .n{color:#9aa3ab;}
    .tbl .note{font-size:13px;color:#5b6670;}
    .checked{font-size:13px;color:#5b6670;margin-top:24px;}
  </style>
</head>
<body>

  ${header}

  <article class="art">
    <div class="eyebrow">Data sources</div>
    <h1>Where MileCheck gets its road data</h1>
    <p class="lede">MileCheck is not a government app and does not speak for any agency. It reads public feeds from the agencies below and shows them by mile marker.</p>
    <p class="disclaimer">For anything official, such as a closure order or a legal restriction, use the agency&rsquo;s own site, linked in each row. If MileCheck and the agency disagree, the agency is right.</p>

    <h2>How the data gets to you</h2>
    <p>Each agency publishes in its own format. MileCheck reads the feed, converts it to one format, and refreshes it every 5 to 15 minutes depending on the source. We sort alerts into types such as crash, closure and construction. We do not write alerts of our own. An alert appears in MileCheck after the agency posts it, so it is never ahead of the source.</p>
    <p>Mile marker positions come from each state&rsquo;s published highway location data. Where a state publishes none for a road, the federal HPMS road dataset fills the gap. Mile markers are stored in the app and work with no signal. Alerts and cameras need a connection.</p>

    <h2>United States: state transportation agencies</h2>
    <p>Alerts are live for all 50 states. Cameras are live for ${camUS.size} states.</p>
    <div class="tbl"><table>
      <thead><tr><th>State</th><th>Agency and public site</th><th>Alerts</th><th>Cameras</th></tr></thead>
      <tbody>${stateRows}
      </tbody></table></div>

    <h2>Canada: provincial agencies</h2>
    <p>Kilometre markers cover ten provinces. Live alerts and cameras are listed below.</p>
    <div class="tbl"><table>
      <thead><tr><th>Province</th><th>Agency and public site</th><th>Alerts</th><th>Cameras</th></tr></thead>
      <tbody>${provRows}
      </tbody></table></div>

    <h2>Federal and other sources</h2>
    <div class="tbl"><table>
      <thead><tr><th>Data</th><th>Source</th><th colspan="2">What MileCheck uses it for</th></tr></thead>
      <tbody>${otherRows}
      </tbody></table></div>

    <h2>Found an error?</h2>
    <p>Email <a href="mailto:feedback@milecheckapp.com">feedback@milecheckapp.com</a> with the page or alert and what is wrong. Fixes to an agency&rsquo;s own data have to come from the agency.</p>
    <p class="checked">Links last checked ${CHECKED}.</p>
  </article>

  ${footer}

${tail}
</body>
</html>
`;
mkdirSync('data-sources', { recursive: true });
writeFileSync('data-sources/index.html', html);
console.log('wrote data-sources/index.html', html.length, 'bytes;', STATES.length, 'states,', PROVINCES.length, 'provinces');
