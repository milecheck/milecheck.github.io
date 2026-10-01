#!/usr/bin/env node
// Full-month refresh of the September Road Report (2026-10-01). Rewrites every number
// and data-driven block on blog/road-report-september-2026.html from
// data/road-report-september-2026.json (the Sept 1-30 archive pull), and drops the
// "partial month" framing. Region-based (heading to heading), so it can be re-run.
//
//   node scripts/refresh-road-report-sept-full-month.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const D = JSON.parse(readFileSync(resolve(ROOT, 'data/road-report-september-2026.json'), 'utf8'));
const PAGE = resolve(ROOT, 'blog/road-report-september-2026.html');

const NAMES = { AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming', BC: 'British Columbia' };
const n = (x) => Number(x || 0).toLocaleString('en-US');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const title = (s) => {
  // Title-case a highway name ("DALTON HIGHWAY" -> "Dalton Highway"), then re-uppercase
  // any route-code prefix ("Ar-123", "Ri-146", "Us-9" -> "AR-123", "RI-146", "US-9") --
  // route codes use every state's 2-letter abbreviation, not just I-/US-/SR-.
  let t = String(s).replace(/\s+/g, ' ').trim().toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase());
  return t.replace(/\b([A-Za-z]{1,3})([- ])(\d)/g, (m, p, sep, d) => (/^(i|us|sr|[a-z]{2})$/i.test(p) ? p.toUpperCase() : p) + sep + d);
};

// ---------- top-line numbers, all from one snapshot ----------
const T = D.byType, TOTAL = D.totalUniqueEvents;
const K = D.keywordCounts, KS_ = D.keywordSamples, KBS = D.keywordByState, KEX = D.keywordExampleByState, KCLEAN = D.keywordExampleIsClean;
const FIRES = D.wildfires;
const NO_CRASH_FEED = new Set(['AK', 'AR', 'HI', 'KY', 'ME', 'ND', 'NM', 'OK', 'SD', 'WV']);
// Trim a real DOT headline down to one clean clause for a per-state example --
// stop at the first sentence break if there is one nearby, otherwise hard-cut at a
// word boundary. Never fabricates text; only shortens what the DOT actually posted.
function trimExample(h, maxLen = 130) {
  let t = String(h || '').replace(/\s+/g, ' ').trim();
  const dot = t.indexOf('. ');
  if (dot > 10 && dot < maxLen) t = t.slice(0, dot + 1);
  else if (t.length > maxLen) t = t.slice(0, maxLen).replace(/\s+\S*$/, '') + '…';
  // The caller always appends its own closing "." -- strip a trailing one here so
  // real DOT text ending in a period doesn't render as a stray double "..".
  return t.replace(/\.+$/, '');
}
const MENTION_LABEL = { snowice: 'snow or ice', fire: 'fire', flood: 'flooding', fatal: 'fatal-tagged' };

// ---------- long-term closures: drop the NY entry that's really Connecticut's
// Wallingford–Meriden segment riding NY's feed (same issue fixed in the Labor Day
// recap on 2026-09-22 -- same fix applies here, this page just hadn't had it yet) ----------
const LT_WHAT = {
  'WI I-535': 'southbound right shoulder closed at the state-line bridge',
  'OH I-75': 'ramp to Second Street (Exit 1A) closed',
  'VA I-81': 'work zone, mile markers 142.9 to 147.3, Roanoke County',
  'TX US-87': 'alternating lanes closed for construction',
  'WA SR-165': 'closed at the Carbon River/Fairfax Bridge to all traffic, until further notice',
  'NC US-17': 'one left lane closed intermittently, Martin County',
};
const longTerm = D.longTermProjects.filter((p) => !(p.state === 'NY' && p.route === 'I-91')).slice(0, 6);
const dateLong = (iso) => { const [y, mo, d] = iso.split('-').map(Number); return new Date(Date.UTC(y, mo - 1, d)).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long', day: 'numeric', year: 'numeric' }); };

// ---------- consolidated "State activity" table: top 10 by total events ----------
const byTotal = [...D.jurisdictionSummary].sort((a, b) => b.total - a.total).slice(0, 10);
const stateTableRows = byTotal.map((j) => {
  const snowice = (KBS.snowice && KBS.snowice[j.state]) || 0;
  return `        <tr><td>${esc(NAMES[j.state])}</td><td>${n(j.total)}</td><td>${n(j.crash)}</td><td>${j.fires ? `${n(j.fires)} / ${n(j.acres)} ac` : '—'}</td></tr>`;
}).join('\n');

// ---------- full A-Z accordion, all 51 jurisdictions ----------
const CAT_LABEL = {
  crash: ['crash', 'crashes'], closure: ['closure', 'closures'],
  construction: ['construction record', 'construction records'], weather: ['weather record', 'weather records'],
  hazard: ['hazard record', 'hazard records'], other: ['other record', 'other records'],
};
function detailBody(j) {
  const parts = [];
  if (j.total === 0) {
    parts.push(`<p>No events were archived from ${esc(NAMES[j.state])}'s feed in this window. That can mean a live feed issue, not necessarily a quiet month &mdash; see the data limitations above.</p>`);
  } else {
    const cats = ['crash', 'closure', 'construction', 'weather', 'hazard', 'other']
      .filter((c) => j[c] > 0)
      .map((c) => `${n(j[c])} ${CAT_LABEL[c][j[c] === 1 ? 0 : 1]}`);
    parts.push(`<p>${cats.join(', ')}${cats.length > 1 ? ',' : ''} for ${n(j.total)} total events.</p>`);
  }
  if (NO_CRASH_FEED.has(j.state) && !j.crash) parts.push(`<p><em>No live crash feed for this state &mdash; crashes still happen here, MileCheck just can't count them.</em></p>`);
  if (j.fires > 0) parts.push(`<p>${n(j.fires)} ${j.fires === 1 ? 'fire' : 'fires'} reported during the month, ${n(j.acres)} acres combined at each fire's largest reported size.</p>`);
  // One line per keyword category that has any mentions, each with a real example
  // (route + a trimmed excerpt of the actual DOT text) instead of a bare count --
  // Leah, on Arizona's count: "they are going to want to know what road and near
  // what town."
  for (const k of ['fatal']) {
    const count = KBS[k][j.state];
    if (!count) continue;
    const ex = KEX[k][j.state];
    // Only show the worked example when it's confirmed clean of a known place-name
    // collision -- some states' every match is the same real street name (Rufe Snow
    // Dr. in TX, Snow Rd. in OH), and there's nothing to fall back to. A bare count
    // with no misleading example is more honest than a confusing one.
    const where = (ex && KCLEAN[k][j.state]) ? (ex.route ? `${esc(title(ex.route))}: ` : '') + `&ldquo;${esc(trimExample(ex.headline))}&rdquo;` : null;
    parts.push(`<p><b>${n(count)}</b> ${MENTION_LABEL[k]} ${count === 1 ? 'mention' : 'mentions'} on the feed${where ? ` &mdash; e.g. ${where}` : ''}.</p>`);
  }
  if (j.topRoutes && j.topRoutes.length) parts.push(`<p>Most-mentioned routes: ${j.topRoutes.map((r) => esc(title(r))).join(', ')}.</p>`);
  return parts.join('\n          ');
}
const accordionItems = Object.keys(NAMES).sort((a, b) => NAMES[a].localeCompare(NAMES[b])).map((st) => {
  const j = D.jurisdictionSummary.find((x) => x.state === st);
  if (!j) return '';
  return `      <details class="state-acc">
        <summary>${esc(NAMES[st])} &mdash; ${n(j.total)} events</summary>
        <div class="state-detail">
          ${detailBody(j)}
        </div>
      </details>`;
}).join('\n');

let html = readFileSync(PAGE, 'utf8');
const region = (label, re, to) => {
  if (!re.test(html)) throw new Error(`Region not found: ${label}`);
  html = html.replace(re, to);
  console.log(`  replaced ${label}`);
};
const sub0 = (l, re, to) => { if (re.test(html)) html = html.replace(re, to); };
const all = (label, from, to) => {
  const c = html.split(from).length - 1;
  if (!c) { console.log(`  (already done) ${label}`); return; }
  html = html.split(from).join(to);
  console.log(`  replaced ${label} x${c}`);
};

// ---- partial-month framing -> full month ----
all('title', 'September 1&ndash;25, 2026', 'September 2026');
all('og title', 'September 1–25, 2026', 'September 2026');
region('meta description', /<meta name="description" content="[^"]*">/,
  `<meta name="description" content="${n(TOTAL)} road events across all 50 states and British Columbia in September 2026, from daily and two-hourly state DOT feed archives.">`);
region('og description', /<meta property="og:description" content="[^"]*">/,
  `<meta property="og:description" content="What appeared on state and highway DOT feeds across all 50 states and British Columbia in September 2026.">`);
all('byline', 'by MileCheck &middot; September 25, 2026', 'by MileCheck &middot; October 1, 2026');
sub0('partial note', /\n\s*<p class="article-note"><strong>Partial month\.<\/strong>[^\n]*<\/p>\n/, '\n');
region('lead', /<p class="article-lead">[\d,]+ road events across all 50 states and British Columbia(?:, September 1 through 25,| in September,)/,
  `<p class="article-lead">${n(TOTAL)} road events across all 50 states and British Columbia in September,`);

// ---- stat band ----
region('stat band', /<div class="stat-band">[\s\S]*?\n      <\/div>/, `<div class="stat-band">
        <div class="stat-cell"><span class="stat-num">${n(TOTAL)}</span><span class="stat-label">total events</span></div>
        <div class="stat-cell"><span class="stat-num">${n(T.construction)}</span><span class="stat-label">construction</span></div>
        <div class="stat-cell"><span class="stat-num">${n(T.closure)}</span><span class="stat-label">closures</span></div>
        <div class="stat-cell"><span class="stat-num">${n(T.crash)}</span><span class="stat-label">crashes posted by DOTs</span></div>
      </div>`);

// ---- corridors ----
region('corridors', /(<tr><th>Corridor<\/th><th>Events<\/th><\/tr>\n)[\s\S]*?(\n      <\/table>)/,
  `$1${D.topCorridors.slice(0, 8).map(([r, c]) => `        <tr><td>${esc(r)}</td><td>${n(c)}</td></tr>`).join('\n')}$2`);

// ---- still closed ----
region('still closed', /(<strong>[^<]*one per state<\/strong>\n\s*<ul[^>]*>\n)[\s\S]*?(\n\s*<\/ul>)/,
  `$1${longTerm.map((p) => `          <li><strong>${esc(NAMES[p.state] || p.state)}, ${esc(p.route || '')}</strong> &mdash; ${esc(LT_WHAT[`${p.state} ${p.route}`] || trimExample(p.headline, 90))}. Posted window ${dateLong(p.start)} to ${dateLong(p.end)}.</li>`).join('\n')}$2`);

// ---- state activity intro + table ----
sub0('state activity intro', /<p>[\d,]+ events, [\d,]+ crashes, and [\d,]+ active wildfires covering [\d,]+ acres,/,
  `<p>${n(TOTAL)} events, ${n(T.crash)} crashes, and ${n(FIRES.totalFires)} active wildfires covering ${n(FIRES.totalAcres)} acres,`);
region('state table', /(<tr><th>State<\/th><th>Total events<\/th>[^\n]*\n)[\s\S]*?(\n      <\/table>)/, `$1${stateTableRows}$2`);

// ---- accordion ----
region('accordion', /(Tap a name to expand it\.<\/p>\n)[\s\S]*?(\n\s*<h2 class="rc">(?:Winter|Fatal))/, `$1${accordionItems}$2`);

// ---- winter + fatal ----
sub0('winter para', /<p>[\d,]+ events in (?:this window|September) mentioned snow or ice[^<]*<\/p>/,
  `<p>${n(K.snowice)} events in September mentioned snow or ice on the road surface. ${n(K.fire)} mentioned fire, ${n(K.flood)} mentioned flooding, and ${n(K.fatal)} were tagged fatal by the reporting DOT.</p>`);
const fat = KS_.fatal;
const byState = [...new Set(fat.map((f) => f.state))].map((s) => `${fat.filter((f) => f.state === s).length} in ${NAMES[s]}`);
region('fatal intro', /<p>[\d,]+ events in (?:this window|September) were tagged fatal[^<]*<\/p>/,
  `<p>${n(fat.length)} events in September were tagged fatal by the reporting DOT &mdash; ${byState.join(', ')}.</p>`);
const dShort = (iso) => { const [y, m, d] = iso.slice(0, 10).split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long', day: 'numeric' }); };
const fatItems = [...fat].sort((a, b) => a.state.localeCompare(b.state) || a.date.localeCompare(b.date)).map((f) => {
  const dir = (f.headline.match(/—\s*\S+\s+([NSEW]B)$/) || [])[1];
  const extra = f.state === 'NY' && f.route === 'NY-9A' ? ', all lanes closed both directions near Greenburgh' : '';
  return `        <li><strong>${NAMES[f.state]}, ${esc(f.route)}${dir ? ' ' + dir : ''}</strong> &mdash; ${dShort(f.date)}${extra}</li>`;
}).join('\n');
region('fatal list', /(<h2 class="rc">Fatal crashes<\/h2>\n\s*<p>[^\n]*\n\s*<ul class="article-list">\n)[\s\S]*?(\n\s*<\/ul>)/, `$1${fatItems}$2`);

// ---- corrections from the Oct 1 review (Codex) ----
const sub = (label, re, to) => { if (re.test(html)) { html = html.replace(re, to); console.log(`  fixed ${label}`); } };
html = html.split('MileCheck Road Report: September 2026').join('MileCheck Highway Report: September 2026');
sub('eyebrow', /Monthly Road Report<\/p>/, 'Monthly Highway Report</p>');
sub('cadence bullet', /<li>MileCheck archives every state DOT and DriveBC feed[^<]*<\/li>/, '<li>Counts come from one archived snapshot per state per day. Each incident is counted once by its id, however many days it stayed on the feed.</li>');
sub('lead', /from MileCheck's archive of every state DOT and DriveBC alert feed\. An event is one closure, crash, or work zone, counted once no matter how many days it stayed on the feed\./,
  "from MileCheck's archive of every state department of transportation (DOT) feed and DriveBC. An event is one alert (a closure, crash, work zone, weather, hazard or other notice), counted once no matter how many days it stayed on the feed.");
const CRASH_NOTE = 'Crashes are counted when the DOT tags an alert as a crash or the alert text says crash. Alaska, Arkansas, Hawaii, Maine, North Dakota, Oklahoma, South Dakota and West Virginia had none on their feeds this month, which usually means the feed does not post crashes. Crashes still happen there.';
sub('crash note', /<strong>Crash count only<\/strong>[^<]*/, `<strong>Crash count only.</strong> ${CRASH_NOTE}`);
sub('crash note 2', /(<p style="font-size:13px;color:#5A6670;margin:-20px 0 20px;"><strong>Crash count only\.<\/strong>) [^<]*/, `$1 ${CRASH_NOTE}`);
sub('table caption', /A high total can mean a more detailed feed, not a busier month\.[^<]*<\/p>/, `A high total can mean a more detailed feed, not a busier month. Fires are every fire reported at any point in September, at each one's largest reported size. They were not all burning at once, and the acres are not acres burned in September.</p>`);
sub('table header', /<th>Fires \/ acres<\/th><th>Snow or ice mentions<\/th>/, '<th>Fires reported / acres</th>');
sub('activity intro', /and ([\d,]+) active wildfires covering ([\d,]+) acres,/, 'and $1 wildfires reported during the month ($2 acres at each fire\'s largest reported size),');
sub('corridors h2', /<h2 class="rc">Busiest corridors<\/h2>/, '<h2 class="rc">Routes with the most recorded alerts</h2>');
sub('corridors th', /<tr><th>Corridor<\/th><th>Events<\/th><\/tr>/, '<tr><th>Route</th><th>Alerts</th></tr>');
sub('long-term h2', /<h2 class="rc">Still closed, years out<\/h2>/, '<h2 class="rc">Long-term roadwork and restrictions</h2>');
sub('long-term strong', /<strong>Closures scheduled to run for years, one per state<\/strong>/, '<strong>Alerts posted with multi-year date windows, one per state. Dates are what the alert lists, not a confirmed reopening.</strong>');
sub('winter section', /\s*<h2 class="rc">Winter is starting early<\/h2>\s*<p>[^<]*<\/p>\s*<p>MileCheck has live snowplow[^<]*<\/p>/, '');
sub('fatal-only para', /<p>[\d,]+ events in September mentioned snow or ice[^<]*<\/p>\s*/, '');

writeFileSync(PAGE, html);
console.log('Done', PAGE);
