#!/usr/bin/env node
// gen-api-docs-pages.mjs — the developer-facing API reference pages (2026-10-30):
//   /api/versioning/  /api/changelog/  /api/errors/  /api/data-accuracy/
// Built from the head, nav, values block and footer of /api/plan/ so they follow the site template.
// Facts come from the Worker (cloudflare-worker.js on branch api-pro) and the coverage ledger. When the API
// changes, add a line to CHANGELOG below and re-run. Then: node scripts/add-social-tags.mjs
//
//   node scripts/gen-api-docs-pages.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const tpl = readFileSync(resolve(ROOT, 'api/plan/index.html'), 'utf8');
const ledger = JSON.parse(readFileSync(resolve(ROOT, 'data/coverage-ledger.json'), 'utf8'));
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ---- the changelog: newest first. One line per change a developer could notice. ----
const CHANGELOG = [
  { date: '2026-10-30', tag: 'Added', items: [
    'Every /v1 response carries <code>X-Request-Id</code>. Quote it when you write to us and we can find the exact call.',
    'Keys with a daily limit also get <code>X-RateLimit-Limit</code>, <code>X-RateLimit-Remaining</code> and <code>X-RateLimit-Reset</code> (epoch seconds, next UTC midnight). A 429 adds <code>Retry-After</code>.',
    'Error bodies keep the <code>error</code> text and add <code>code</code>, <code>message</code>, <code>docs</code> and <code>request_id</code>. See <a href="/api/errors/">errors</a>.',
    '<code>GET /v1/usage</code>: calls today, your daily limit, the reset time, and calls by endpoint for the last 30 days. It does not count against your limit.',
    '<code>POST /v1/keys/rotate</code>: a new key with the same plan and end date. The old key keeps working for 24 hours.',
  ] },
  { date: '2026-10-29', tag: 'Added', items: [
    '<code>GET /v1/borders</code>: live land-border waits. CBP into the US (standard, FAST, NEXUS/SENTRI, Ready lanes) and CBSA into Canada. Filter by state, country, or point and radius.',
  ] },
  { date: '2026-10-25', tag: 'Changed', items: [
    'Daily limits are enforced: a dev key is 100 calls a day and ends 14 days after it starts; Business is 100,000 a day. Over the limit returns 429.',
  ] },
  { date: '2026-09-14', tag: 'Added', items: ['<code>GET /v1/bridges/history</code>: past raises and lowers for the bridges that publish a live status.'] },
  { date: '2026-09-12', tag: 'Added', items: [
    '<code>GET /v1/bridges</code>: USCG-regulated drawbridges with the federal opening rule and live status where an agency publishes one.',
    '<code>POST /v1/bridges/subscribe</code>: bridge-raise push notifications for a device (Seattle).',
  ] },
  { date: '2026-08-31', tag: 'Launched', items: [
    'MileCheck API v1: <code>GET /v1/locate</code>, <code>GET /v1/alerts</code>, <code>GET /v1/fires</code>.',
  ] },
];

// ---- page shell ----
function shell({ slug, title, desc, body }) {
  const bodyStart = tpl.indexOf('<!-- /site-nav:header -->') + '<!-- /site-nav:header -->'.length;
  const valuesAt = tpl.indexOf('<section class="mc-values"');
  if (bodyStart < 30 || valuesAt < 0) throw new Error('template markers moved in api/plan/index.html');
  let head = tpl.slice(0, bodyStart);
  const url = `https://milecheckapp.com/api/${slug}/`;
  head = head
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(desc)}">`)
    .replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${url}">`)
    .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${esc(title)}">`)
    .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(desc)}">`)
    .replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${url}">`)
    .replace(/\n\s*<meta name="twitter:[^>]*>/g, '')
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\s*/g, '');
  const nav = `<nav class="mc-crumbs" aria-label="API reference" style="max-width:820px;margin:18px auto 0;padding:0 20px;font-size:14px;display:flex;flex-wrap:wrap;gap:6px 16px"><a href="/api/">API</a><a href="/api/errors/">Errors and limits</a><a href="/api/data-accuracy/">Data and accuracy</a><a href="/api/versioning/">Versioning</a><a href="/api/changelog/">Changelog</a><a href="https://status.milecheckapp.com/" target="_blank" rel="noopener">Status</a></nav>`;
  const ld = `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'TechArticle', headline: title, description: desc, url, publisher: { '@type': 'Organization', name: 'MileCheck', url: 'https://milecheckapp.com/' } })}</script>`;
  return head.replace('</head>', `${ld}\n</head>`) + `\n${nav}\n${body}\n` + tpl.slice(valuesAt);
}
const section = (inner) => `<section class="api-section" style="max-width:820px;margin:0 auto">${inner}</section>`;
const hero = (h1, lead) => `<section class="api-hero" style="max-width:820px;margin:0 auto"><div class="eyebrow"><a href="/api/" style="color:inherit;text-decoration:none">MileCheck API</a> &rsaquo; Reference</div><h1>${h1}</h1><p class="value" style="max-width:62ch">${lead}</p></section>`;
const code = (s) => `<pre class="codeblock">${esc(s)}</pre>`;
const table = (head, rows) => `<div class="tbl"><table><thead><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;

const pages = {};

// ================= errors =================
pages.errors = shell({
  slug: 'errors',
  title: 'What do MileCheck API errors and rate limit headers mean?',
  desc: 'Every error code the MileCheck API returns, what causes it, and what to do. Plus the rate limit headers and the request id to quote when you write to us.',
  body: hero('What do MileCheck API errors and rate limit headers mean?', 'Every /v1 response has a request id. Errors have a code you can match on. Keys with a daily limit get the limit headers on every call.') +
  section(`<h2 id="headers">Headers on every response</h2>` + table(['Header', 'Meaning'], [
    ['<code>X-Request-Id</code>', 'Unique to this call, like <code>req_9f2c…</code>. Error bodies repeat it as <code>request_id</code>. Send it to <a href="mailto:info@milecheckapp.com">info@milecheckapp.com</a> and we can find the call.'],
    ['<code>X-RateLimit-Limit</code>', 'Calls allowed per UTC day on this key. Not sent for keys with no daily limit.'],
    ['<code>X-RateLimit-Remaining</code>', 'Calls left today, after this one.'],
    ['<code>X-RateLimit-Reset</code>', 'When the count resets, in epoch seconds. Always the next UTC midnight.'],
    ['<code>Retry-After</code>', 'On a 429 only: seconds until the reset.'],
  ]) + `<p class="lead" style="margin-top:12px">Browsers can read all of these headers across origins. To check your numbers without spending a call, use <code>GET /v1/usage</code>.</p>`) +
  section(`<h2>Error body</h2><p class="lead">The old <code>error</code> text is still there. New clients should match on <code>code</code>.</p>` + code(`HTTP/1.1 401
X-Request-Id: req_9f2c41d07a3b5e8c1d20

{
  "error": "Invalid API key.",
  "code": "invalid_api_key",
  "message": "Invalid API key.",
  "docs": "https://milecheckapp.com/api/errors/#invalid_api_key",
  "request_id": "req_9f2c41d07a3b5e8c1d20"
}`)) +
  section(`<h2>Error codes</h2>` + table(['Code', 'Status', 'Cause and fix'], [
    ['<code id="missing_api_key">missing_api_key</code>', '401', 'No key sent. Use <code>?apikey=</code>, an <code>x-api-key</code> header, or <code>Authorization: Bearer</code>.'],
    ['<code id="invalid_api_key">invalid_api_key</code>', '401', 'The key is not one we issued. Check for a trailing space or a rotated key.'],
    ['<code id="key_inactive">key_inactive</code>', '402', 'The key was turned off, usually a cancelled subscription. Email sales@milecheckapp.com.'],
    ['<code id="key_expired">key_expired</code>', '403', 'A test key ended (14 days) or a key passed its end date. Email sales@milecheckapp.com to start a plan. <code>GET /v1/usage</code> still works and shows the end date.'],
    ['<code id="state_not_available">state_not_available</code>', '403', 'This source is not available for that state or province. The body names the state and the reason.'],
    ['<code id="forbidden">forbidden</code>', '403', 'The call is not allowed for this key.'],
    ['<code id="unsupported_state">unsupported_state</code>', '404', 'The state or province code is not one we cover. The body lists the supported codes.'],
    ['<code id="not_found">not_found</code>', '404', 'No such endpoint or record.'],
    ['<code id="method_not_allowed">method_not_allowed</code>', '405', 'Wrong HTTP method. The message says which to use.'],
    ['<code id="invalid_parameter">invalid_parameter</code>', '400 or 422', 'A parameter is missing or out of range, such as <code>lat</code> without <code>lon</code>. The message names it.'],
    ['<code id="bad_request">bad_request</code>', '400', 'The request could not be read.'],
    ['<code id="rate_limit_exceeded">rate_limit_exceeded</code>', '429', 'The daily limit for this key is used up. Wait for <code>Retry-After</code> seconds, or ask for a higher limit.'],
    ['<code id="upstream_unavailable">upstream_unavailable</code>', '502 or 503', 'The source feed (a state DOT, CBP and so on) is not answering. Retry in a minute. Feed health is also in <code>source_status</code> on successful responses.'],
    ['<code id="internal_error">internal_error</code>', '500', 'Our side failed. Retry once; if it repeats, send the request id.'],
  ])) +
  section(`<h2>What counts against your limit</h2><p class="lead">Every authenticated call that reaches the limit check counts, including ones that then return a 4xx for a bad parameter. Unauthenticated calls, <code>/v1/health</code> and <code>GET /v1/usage</code> do not. A call refused with 429 is not counted again.</p><p class="lead">Retry on 429 and 5xx with a pause. Do not retry other 4xx errors; they will fail the same way.</p>`),
});

// ================= versioning =================
pages.versioning = shell({
  slug: 'versioning',
  title: 'How does the MileCheck API handle version changes?',
  desc: 'What changes inside v1 without notice, what counts as a breaking change, how much notice you get before anything is removed, and where to watch for it.',
  body: hero('How does the MileCheck API handle version changes?', 'The version is in the URL. Inside a version we add things and do not take them away. If we must remove or change something, you hear first.') +
  section(`<h2>Inside v1 (no notice needed)</h2><ul class="lead"><li>New endpoints.</li><li>New optional request parameters.</li><li>New fields in a response. Code that reads JSON should ignore fields it does not know.</li><li>New values in fields that are open sets, such as event types, source names and error codes. Handle an unknown value as "other".</li><li>Faster or slower feed refresh where a state changes how it publishes.</li><li>Corrections to wrong data. See <a href="/api/data-accuracy/">data and accuracy</a>.</li></ul>`) +
  section(`<h2>Breaking changes (a new version, or notice)</h2><ul class="lead"><li>Removing or renaming an endpoint, parameter or field.</li><li>Changing the type or meaning of a field.</li><li>Making an optional parameter required.</li><li>Changing a status code for the same situation.</li></ul><p class="lead">Breaking changes ship as <code>/v2</code>, not inside <code>/v1</code>.</p>`) +
  section(`<h2>Notice</h2>` + table(['What', 'Notice', 'How you hear'], [
    ['Deprecating a field or endpoint inside v1', '90 days before it is removed', 'Email to the address on the key, a line in the <a href="/api/changelog/">changelog</a>, and <code>Deprecation</code> and <code>Sunset</code> headers on affected responses'],
    ['Retiring a whole version', '12 months after the next version is announced', 'The same three'],
    ['Security or legal removal of a source', 'As much as we can give. A state can withdraw a feed.', 'Email, and <code>state_not_available</code> on the affected state'],
  ]) + `<p class="lead" style="margin-top:12px">A source can also go away because the agency that publishes it withdraws it. We keep a per-source switch for that. When it happens, only that state or source is affected, and the response says so.</p>`) +
  section(`<h2>Where to watch</h2><ul class="lead"><li><a href="/api/changelog/">Changelog</a>, newest first.</li><li><a href="https://status.milecheckapp.com/" target="_blank" rel="noopener">status.milecheckapp.com</a> for outages.</li><li><code>GET /v1/</code> returns the current endpoint list as JSON.</li></ul>`),
});

// ================= changelog =================
pages.changelog = shell({
  slug: 'changelog',
  title: 'What has changed in the MileCheck API?',
  desc: 'Dated list of every addition, change and removal in the MileCheck API, newest first, since the v1 launch on August 31, 2026.',
  body: hero('What has changed in the MileCheck API?', 'Newest first. Deprecations and removals follow the <a href="/api/versioning/">versioning policy</a>.') +
  section(CHANGELOG.map((c) => `<div class="ep-card" style="margin-bottom:12px"><div class="ep-head"><span class="ep-method">${c.tag}</span><span class="ep-path">${c.date}</span></div><ul class="lead" style="margin:6px 0 0">${c.items.map((i) => `<li>${i}</li>`).join('')}</ul></div>`).join('')),
});

// ================= data =================
const L = ledger.feeds || {};
pages['data-accuracy'] = shell({
  slug: 'data-accuracy',
  title: 'What is in the MileCheck API data, and how accurate is it?',
  desc: 'Response fields, how IDs behave, where each state\'s data comes from, how fresh it is, and the known limits of the mile marker and alert data.',
  body: hero('What is in the MileCheck API data, and how accurate is it?', 'What each field is, which IDs you can store, where the data comes from, and where it is wrong or missing. Written for the engineer who has to rely on it.') +
  section(`<h2 id="fields">Alert records</h2><p class="lead"><code>GET /v1/alerts</code> returns <code>conditions</code> (road weather and surface) and <code>incidents</code> (closures, crashes, construction, hazards). Both are the state's own data in one shape. Fields a state does not publish are <code>null</code> or absent, never guessed.</p>` + code(`// incidents[]  (from a live Washington record)
{
  "incident-id": "WA-722671",
  "event-type-id": "RW",            // AC crash, CL closure, RW roadwork, WE weather, HZ hazard, OT other
  "headline": "",
  "impact-desc": "Weekend-long full closure of northbound I-5 ...",
  "priority": "High",              // the DOT's own priority where it gives one
  "event-status": "Open",
  "start-time": "2026-10-29T18:58:00.000Z",   // ISO 8601, UTC
  "end-time":   "2026-10-31T06:59:00.000Z",
  "last-updated": "2026-10-30T16:03:43.363Z",
  "location": {
    "route-id": "SR 5",            // route in the same form as our mile marker data
    "direction": "NB",             // NB SB EB WB, or absent when the DOT gives none or both
    "start-location": { "start-lat": 47.5867, "start-long": -122.3201, "start-mile-marker": 164 },
    "end-location":   { "end-lat": 47.6558,  "end-long": -122.3223,  "end-mile-marker": 169 }
  }
}`) + `<p class="lead" style="margin-top:12px">Field names in <code>conditions[]</code>: <code>location-name</code>, <code>route-id</code>, <code>latitude</code>, <code>longitude</code>, <code>road-surface-condition</code>, <code>road-surface-condition-id</code>, <code>air-temperature</code>, <code>weather-condition</code>, <code>travel-advisory</code>, <code>restriction-one</code>, <code>restriction-two</code>, <code>date-updated</code>. States fill the ones they publish.</p><p class="lead">Every response also has <code>source_status</code> per feed: <code>live</code>, or a reason it is not (for example <code>withdrawn</code> when a source was switched off). An empty list with <code>live</code> means the agency reports nothing active. An empty list with anything else does not mean the road is clear.</p>`) +
  section(`<h2 id="ids">Which IDs can I store?</h2>` + table(['Record', 'ID', 'Stable?'], [
    ['Alert (<code>incident-id</code>)', 'The DOT\'s own event id with the state code in front, such as <code>WA-722671</code>', 'For the life of the event, as long as the DOT keeps its id. Some DOTs reuse or renumber ids. Store the id with the state, and treat a vanished id as "ended or withdrawn".'],
    ['Wildfire (<code>id</code>)', 'The NIFC incident id, such as <code>2026-ORXYZ-000123</code>', 'Stable for the fire.'],
    ['Drawbridge (<code>id</code>)', 'The federal rule citation, such as <code>117.1051-d-2</code>', 'Stable until the rule is rewritten in the Code of Federal Regulations.'],
    ['Border crossing (<code>port_id</code>)', 'The CBP port number, such as <code>300402</code>', 'Stable. CBP numbers are fixed.'],
    ['Mile marker', 'None. A marker is state + route + mile.', 'The route name changes when a state renumbers a highway. We list those in the <a href="/api/changelog/">changelog</a> when we learn of one.'],
  ])) +
  section(`<h2 id="releases">Changes between releases</h2><p class="lead">Live endpoints change every minute and have no releases. The licensed mile marker file does: new roads, renumbered routes and corrected positions. Today there is no fixed monthly schedule and no automatic diff file. A delivery is announced when it ships, and on request we send the list of added, removed and moved markers against your last file. An automatic change list with every delivery is on our list to build.</p>`) +
  section(`<h2 id="coverage">Coverage and source per state</h2><ul class="lead"><li><b>Mile markers:</b> all 50 states, plus 10 Canadian provinces and territories (kilometres in Canada).</li><li><b>Live alerts:</b> ${L.alerts && L.alerts.us_states ? L.alerts.us_states : 50} states plus British Columbia, Alberta and Manitoba.</li><li><b>Source for each state:</b> the state DOT's own feed. The <a href="/data-sources/">data sources page</a> lists the agency, the feed and the format for every state.</li><li>Feeds come in 19 formats. We convert each to the one shape above and keep a record of what each state does not give us.</li></ul>`) +
  section(`<h2 id="fresh">How fresh is it?</h2><p class="lead">We cache most state feeds for 5 minutes. A few are cached longer because the state publishes slowly. <code>generated_at</code> on a response is when we built it, not when the DOT last updated; use <code>last-updated</code> on a record for the DOT's own time. Border waits follow CBP and CBSA; <code>last_updated</code> on each direction is their time.</p>`) +
  section(`<h2 id="accuracy">Accuracy notes</h2><ul class="lead"><li><b>Mile marker positions are approximate.</b> They are the state's own reference posts, not surveyed sign positions. <code>/v1/locate</code> returns the nearest post within 1 mile and says <code>milepost: null</code> beyond that. Between posts the app interpolates to one decimal; the API returns the post.</li><li><b>Some states restart numbering.</b> In California and Georgia, route posts restart at each county line, so a route and number can appear in many places. We keep the county with each post in the data files. Do not treat a bare route and number as a unique place in those states.</li><li><b>Alerts are the DOT's report.</b> We do not confirm them. A crash can be cleared before the DOT updates; a closure can be posted late.</li><li><b>We change some fields.</b> Route names are rewritten into one form, directions into NB/SB/EB/WB, times into UTC, and event types into the codes above. The original text stays in <code>impact-desc</code>.</li><li><b>We drop what we cannot place.</b> Alerts on roads not in our route list, such as Texas farm-to-market roads or local streets, are left out rather than shown with a wrong route. In Texas that is about a quarter of the DOT's events.</li><li><b>Not for emergencies.</b> MileCheck is not an emergency service and does not decide whether a road is safe.</li></ul>`) +
  section(`<h2>Found something wrong?</h2><p class="lead">Send the request id (<code>X-Request-Id</code>) and what you expected to <a href="mailto:info@milecheckapp.com">info@milecheckapp.com</a>. Wrong mile marker data gets fixed in the file and noted in the changelog.</p>`),
});

for (const [slug, html] of Object.entries(pages)) {
  const dir = resolve(ROOT, 'api', slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, 'index.html'), html);
  console.log(`api/${slug}/index.html  ${html.length} bytes`);
}
