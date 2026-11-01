#!/usr/bin/env node
// gen-api-data-quality.mjs — /api/data-quality/ (2026-11-01, Leah "go api page"; plan move 4).
// A buyer's first question is how fresh and how complete the feed is. This page answers it per state from a live read:
// how often we read the agency, how many alerts it holds now, how many carry a DOT mile marker, how old its newest record is,
// and the feed status the Worker reports. It is a snapshot with its time on it, not a promise. No uptime number is offered.
//   node scripts/gen-api-data-quality.mjs      # reads the Worker, writes api/data-quality/index.html
// Then: node scripts/add-social-tags.mjs. Refresh by re-running; the date on the page is the read time.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { STATES, PROVINCES } from './data-sources-data.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const W = 'https://milepost-proxy.leahgerber93.workers.dev';
const UA = 'MileCheck/1.10.44 (iOS)';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const tpl = readFileSync(resolve(ROOT, 'api/plan/index.html'), 'utf8');
// Seconds between our reads of each feed (cacheTtlSeconds in the Worker, read 2026-10-31). Same table as add-api-link-block.mjs.
const READ = { CA: 60, ND: 600, CT: 900, GA: 900, HI: 900, LA: 900, NV: 900, NM: 900, WI: 900 };
const GAPS = {
  NJ: 'Work zones only. No incident feed.', HI: 'Work zones only, and the agency updates weekly.', NM: 'Work zones only. The upstream feed has been intermittent.',
  RI: 'No named incident feed.', MS: 'Read from a copy refreshed about every 30 minutes (the agency blocks our server).',
};
const STATUS_NOTE = { unsupported: 'No live feed yet.', live_empty: 'Feed reachable, with no alerts at the read time.', stale: 'Serving a saved copy because the last read failed.' };
const every = (s) => (s === 60 ? 'every minute' : `every ${s / 60} min`);
const age = (ms) => (ms < 90 * 60e3 ? `${Math.max(1, Math.round(ms / 60e3))} min` : ms < 48 * 3600e3 ? `${Math.round(ms / 3600e3)} h` : `${Math.round(ms / 86400e3)} days`);

const places = [...STATES, ...PROVINCES];
const readNow = Date.now();
const rows = [];
let idx = 0;
async function one([code, name, agency]) {
  try {
    const r = await fetch(`${W}/incidents?state=${code}`, { headers: { 'User-Agent': UA } });
    if (!r.ok) return { code, name, agency, status: `HTTP ${r.status}`, n: null };
    const j = await r.json();
    const list = j['incident-reports'] || [];
    let withMile = 0, newest = 0;
    for (const a of list) {
      const m = a.location && a.location['start-location'] && a.location['start-location']['start-mile-marker'];
      if (m !== '' && m != null && isFinite(+m)) withMile++;
      const t = Date.parse(a['last-updated'] || a['update-time'] || a['start-time'] || '');
      if (isFinite(t) && t > newest) newest = t;
    }
    return { code, name, agency, status: j.source_status || 'live', n: list.length, withMile, newest, errors: (j.errors || []).length };
  } catch (e) { return { code, name, agency, status: 'no answer', n: null }; }
}
async function worker() { while (idx < places.length) { const p = places[idx++]; rows.push(await one(p)); } }
await Promise.all(Array.from({ length: 6 }, worker));
rows.sort((a, b) => a.name.localeCompare(b.name));

const live = rows.filter((r) => r.status === 'live').length;
const total = rows.reduce((s, r) => s + (r.n || 0), 0);
const body = rows.map((r) => {
  const secs = READ[r.code] || 300;
  const pct = r.n ? Math.round((r.withMile / r.n) * 100) + '%' : '—';
  const newest = r.newest ? age(readNow - r.newest) + ' old' : '—';
  const note = [GAPS[r.code], STATUS_NOTE[r.status] ? STATUS_NOTE[r.status] : (r.status !== 'live' ? `Feed status: ${esc(r.status)}.` : ''), r.errors ? `${r.errors} source error${r.errors > 1 ? 's' : ''} on this read.` : ''].filter(Boolean).join(' ');
  return `<tr><td>${esc(r.name)}</td><td>${esc(r.agency)}</td><td>${r.n == null ? '—' : r.n}</td><td>${pct}</td><td>${newest}</td><td>${r.code === 'MS' ? 'about every 30 min (copy), then every 5 min' : (secs === 300 ? 'at least ' : '') + every(secs)}</td><td>${note}</td></tr>`;
}).join('\n');

const when = new Date(readNow).toLocaleString('en-US', { timeZone: 'America/Los_Angeles', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) + ' Pacific';
const title = 'How fresh and complete is the MileCheck road alert data?';
const desc = 'Per state and province: how often MileCheck reads the agency, how many alerts it holds, how many carry a DOT mile marker, how old the newest record is, and where the gaps are. A dated snapshot, not a promise.';
const lead = `Read from the live API on ${when}: ${live} of ${rows.length} states and provinces reporting live, ${total.toLocaleString('en-US')} alerts in all.`;
const section = (inner) => `<section class="api-section" style="max-width:1040px;margin:0 auto">${inner}</section>`;
const bodyHtml = `<section class="api-hero" style="max-width:820px;margin:0 auto"><div class="eyebrow"><a href="/api/" style="color:inherit;text-decoration:none">MileCheck API</a> &rsaquo; Data quality</div><h1>${esc(title)}</h1><p class="sub">${esc(lead)}</p></section>` +
section(`<h2>What each column means</h2>
<ul style="margin:8px 0 0 20px;line-height:1.6">
<li><strong>Alerts now.</strong> Records the API returns for that place at the read time, after we drop records with no numbered highway.</li>
<li><strong>With a DOT mile marker.</strong> The share of those records where the agency itself sent a mile marker. The API adds an <code>estimated-mile-marker</code> field, labeled as ours, where the agency sent none.</li>
<li><strong>Newest record.</strong> How long ago the agency last touched any one record. A quiet road can show an old number while the feed is fine, so read it as a hint, not a delay.</li>
<li><strong>We read the agency.</strong> The interval we have set in the Worker. It is how often we check, not how fast the agency posts.</li>
</ul>`) +
section(`<h2>State and province table</h2><div class="tbl" style="overflow-x:auto"><table style="min-width:900px"><thead><tr><th>Place</th><th>Agency</th><th>Alerts now</th><th>With a DOT mile marker</th><th>Newest record</th><th>We read the agency</th><th>Known gaps</th></tr></thead><tbody>
${body}
</tbody></table></div>`) +
section(`<h2>What this page does not say</h2>
<ul style="margin:8px 0 0 20px;line-height:1.6">
<li>It does not measure the delay between an agency posting a record and our API returning it. We have not measured that.</li>
<li>It does not promise uptime. We do not publish a service level agreement. The <a href="https://status.milecheckapp.com/">status page</a> shows current service.</li>
<li>One read is one moment. Roadwork counts swing by day of the week, and an agency can be down when you look.</li>
</ul><p style="margin-top:14px"><a href="/api/#get-key" style="color:#0f7a4f;font-weight:700">Get a test key</a> and read any state yourself. See also the <a href="/api/data-accuracy/" style="color:#0f7a4f;font-weight:700">data accuracy notes</a> and the <a href="/data-sources/" style="color:#0f7a4f;font-weight:700">data sources</a>.</p>`);

const bodyStart = tpl.indexOf('<!-- /site-nav:header -->') + '<!-- /site-nav:header -->'.length;
const valuesAt = tpl.indexOf('<section class="mc-values"');
if (bodyStart < 30 || valuesAt < 0) throw new Error('template markers moved in api/plan/index.html');
const url = 'https://milecheckapp.com/api/data-quality/';
let head = tpl.slice(0, bodyStart)
  .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`)
  .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(desc)}">`)
  .replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${url}">`)
  .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${esc(title)}">`)
  .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(desc)}">`)
  .replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${url}">`)
  .replace(/\n\s*<meta name="twitter:[^>]*>/g, '')
  .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\s*/g, '');
const ld = `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'TechArticle', headline: title, description: desc, url, dateModified: new Date(readNow).toISOString().slice(0, 10), publisher: { '@type': 'Organization', name: 'MileCheck' } })}</script>`;
const html = head.replace('</head>', `${ld}\n</head>`) + `\n${bodyHtml}\n` + tpl.slice(valuesAt);
mkdirSync(resolve(ROOT, 'api/data-quality'), { recursive: true });
writeFileSync(resolve(ROOT, 'api/data-quality/index.html'), html);
console.log(`api/data-quality/index.html: ${rows.length} places, ${live} live, ${total} alerts`);
