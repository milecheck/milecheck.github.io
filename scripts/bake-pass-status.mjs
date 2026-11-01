#!/usr/bin/env node
// bake-pass-status.mjs — puts a dated, plain-HTML status block on every /passes/<slug>/ page (2026-11-01).
// Why: the pass pages draw their data with JavaScript, so Google's copy of the page reads "Loading live data…".
// This reads the same Worker feeds the page uses, and writes what they say into the HTML between
// <!-- passnow:start --> and <!-- passnow:end -->, with the time it was read. The live map under it still updates.
// The wording only says what the DOT feed lists. A pass with no closure listed is "no closure listed", never "open".
// Idempotent: the block is replaced on each run. Run it before a publish, or on the storms-page schedule.
//   node scripts/bake-pass-status.mjs            # all /passes/ pages
//   node scripts/bake-pass-status.mjs snoqualmie  # one page
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const W = 'https://milepost-proxy.leahgerber93.workers.dev';
const UA = 'MileCheck/1.10 CFNetwork pass-status';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// slug -> the question as a reader types it, the agency, and its public pass page.
const META = {
  snoqualmie: { q: 'Snoqualmie Pass', dot: 'WSDOT', url: 'https://wsdot.com/travel/real-time/mountainpasses/snoqualmie' },
  stevens: { q: 'Stevens Pass', dot: 'WSDOT', url: 'https://wsdot.com/travel/real-time/mountainpasses/stevens' },
  white: { q: 'White Pass', dot: 'WSDOT', url: 'https://wsdot.com/travel/real-time/mountainpasses/white' },
  'mt-baker-highway': { q: 'the Mt Baker Highway', dot: 'WSDOT', url: 'https://wsdot.com/travel/real-time/mountainpasses/' },
  'crystal-mountain': { q: 'the road to Crystal Mountain (SR 410)', dot: 'WSDOT', url: 'https://wsdot.com/travel/real-time/mountainpasses/' },
  siskiyou: { q: 'Siskiyou Summit', dot: 'ODOT', url: 'https://tripcheck.com/' },
  santiam: { q: 'Santiam Pass', dot: 'ODOT', url: 'https://tripcheck.com/' },
  willamette: { q: 'Willamette Pass', dot: 'ODOT', url: 'https://tripcheck.com/' },
  'mt-hood': { q: 'US 26 at Mt Hood', dot: 'ODOT', url: 'https://tripcheck.com/' },
  'cabbage-hill': { q: 'Cabbage Hill on I-84', dot: 'ODOT', url: 'https://tripcheck.com/' },
  'anthony-lakes': { q: 'the road to Anthony Lakes', dot: 'ODOT', url: 'https://tripcheck.com/' },
  lookout: { q: 'Lookout Pass', dot: 'ITD and MDT', url: 'https://511.idaho.gov/' },
  grapevine: { q: 'the Grapevine', dot: 'Caltrans', url: 'https://quickmap.dot.ca.gov/' },
  donner: { q: 'Donner Pass', dot: 'Caltrans', url: 'https://quickmap.dot.ca.gov/' },
  cajon: { q: 'Cajon Pass', dot: 'Caltrans', url: 'https://quickmap.dot.ca.gov/' },
  parleys: { q: 'Parleys Summit', dot: 'UDOT', url: 'https://www.udottraffic.utah.gov/' },
  'little-cottonwood': { q: 'Little Cottonwood Canyon', dot: 'UDOT', url: 'https://www.udottraffic.utah.gov/' },
  eisenhower: { q: 'the Eisenhower Tunnel', dot: 'CDOT', url: 'https://www.cotrip.org/' },
  vail: { q: 'Vail Pass', dot: 'CDOT', url: 'https://www.cotrip.org/' },
  'wolf-creek': { q: 'Wolf Creek Pass', dot: 'CDOT', url: 'https://www.cotrip.org/' },
  monarch: { q: 'Monarch Pass', dot: 'CDOT', url: 'https://www.cotrip.org/' },
  loveland: { q: 'Loveland Pass', dot: 'CDOT', url: 'https://www.cotrip.org/' },
  berthoud: { q: 'Berthoud Pass', dot: 'CDOT', url: 'https://www.cotrip.org/' },
  'i80-wyoming': { q: 'I-80 between Laramie and Cheyenne', dot: 'WYDOT', url: 'https://wyoroad.info/' },
  teton: { q: 'Teton Pass', dot: 'WYDOT', url: 'https://wyoroad.info/' },
  togwotee: { q: 'Togwotee Pass', dot: 'WYDOT', url: 'https://wyoroad.info/' },
  'echo-summit': { q: 'Echo Summit', dot: 'Caltrans', url: 'https://quickmap.dot.ca.gov/' },
  blewett: { q: 'Blewett Pass', dot: 'WSDOT', url: 'https://wsdot.com/travel/real-time/mountainpasses/blewett' },
  coquihalla: { q: 'the Coquihalla Highway', dot: 'DriveBC', url: 'https://drivebc.ca/' },
  'sea-to-sky': { q: 'the Sea-to-Sky Highway', dot: 'DriveBC', url: 'https://drivebc.ca/' },
  'rogers-pass': { q: 'Rogers Pass', dot: 'DriveBC', url: 'https://drivebc.ca/' },
  'kootenay-pass': { q: 'Kootenay Pass', dot: 'DriveBC', url: 'https://drivebc.ca/' },
};
// Pages whose JS has no PASS constant (hand-built layout).
const MANUAL = { 'crystal-mountain': { states: ['WA'], lat: 46.9355, lon: -121.4743, radiusKm: 30, only: null } };

const km = (a, b, c, d) => { const p = Math.PI / 180, x = Math.sin((c - a) * p / 2) ** 2 + Math.cos(a * p) * Math.cos(c * p) * Math.sin((d - b) * p / 2) ** 2; return 12742 * Math.asin(Math.sqrt(x)); };
const feeds = new Map();
async function feed(kind, st) {
  const key = kind + st;
  if (!feeds.has(key)) {
    feeds.set(key, (async () => {
      try {
        const r = await fetch(`${W}/${kind}?state=${st}`, { headers: { 'User-Agent': UA } });
        if (!r.ok) return null;
        const j = await r.json();
        if (j.source_status && j.source_status !== 'live') return null;
        return j;
      } catch { return null; }
    })());
  }
  return feeds.get(key);
}
const PT = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
const stamp = (d) => PT.format(d).replace(',', ',') + ' PT';
const clean = (s, n = 140) => String(s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);

// Same highway if the numbers match (WA reports "090", we hold "I-90"). No route on the alert = keep it.
const routeNum = (r) => { const m = String(r || '').match(/(\d+)/); return m ? String(+m[1]) : ''; };
const sameRoute = (mine, theirs) => !routeNum(theirs) || !routeNum(mine) || routeNum(mine) === routeNum(theirs);
const FRESH_MS = 36 * 3600e3;
const JUNK = /^(unknown|n\/a|no current information available\.?)$/i;
const useful = (x) => { const t = clean(x, 120); return t && !JUNK.test(t) ? t : ''; };

function parsePass(html, slug) {
  if (MANUAL[slug]) return MANUAL[slug];
  const m = html.match(/const PASS=(\{[^}]*\})/);
  if (!m) return null;
  return new Function('return (' + m[1] + ')')();
}
const restrictionText = (r) => {
  const all = [r['restriction-one'], r['restriction-two']].map((x) => clean(x, 120)).filter(Boolean);
  const real = [...new Set(all.filter((x) => !/^no restrict/i.test(x)))];
  return real.length ? real.join(' / ') : (all.length ? 'no restrictions posted' : '');
};

async function status(slug, P) {
  const meta = META[slug];
  const rMi = Math.round(P.radiusKm / 1.609344);
  const sources = []; let anyFeed = false;
  const reports = []; const closures = []; let other = 0;
  for (const st of P.states) {
    const [c, i] = await Promise.all([P.conds === false ? null : feed('conditions', st), feed('incidents', st)]);
    if (c) { anyFeed = true; for (const r of c['road-weather-reports'] || []) {
      const sl = r.location && r.location['start-location'];
      const lat = +(r.latitude != null ? r.latitude : sl && sl['start-lat']); const lon = +(r.longitude != null ? r.longitude : sl && sl['start-long']);
      if (!isFinite(lat) || !isFinite(lon)) continue;
      // Stale reports are dropped, except a "closed for the season" notice, which stands until the DOT lifts it (the report's own date is shown).
      // An undated report counts only if it carries a live air-temperature reading.
      const upd = Date.parse(r['date-updated'] || '');
      const closedText = /\bclosed\b|\bclosure\b/i.test(`${r['road-surface-condition']} ${r['weather-condition']} ${r['restriction-one']} ${r['restriction-two']}`) && !/\bno (road )?closure/i.test(String(r['road-surface-condition']));
      const hasTemp = r['air-temperature'] != null && r['air-temperature'] !== '' && isFinite(+r['air-temperature']);
      const fresh = isFinite(upd) ? Date.now() - upd <= FRESH_MS : hasTemp;
      if (!fresh && !closedText) continue;
      const d = km(P.lat, P.lon, lat, lon); if (d <= P.radiusKm) reports.push({ r, d, closedText });
    } }
    if (i) { anyFeed = true; for (const a of i['incident-reports'] || []) {
      const sl = a.location && a.location['start-location']; if (!sl) continue;
      const lat = +sl['start-lat'], lon = +sl['start-long']; if (!isFinite(lat) || !isFinite(lon)) continue;
      if (km(P.lat, P.lon, lat, lon) > P.radiusKm) continue;
      if (P.only && P.only.length && !P.only.includes(a.location['route-id'])) continue;
      if (!P.only && !sameRoute(P.route, a.location['route-id'])) continue;
      const t0 = Date.parse(a['start-time'] || ''); if (isFinite(t0) && t0 > Date.now()) continue; // scheduled for later, not closed now
      const end = Date.parse(a['end-time'] || ''); if (isFinite(end) && end < Date.now()) continue;
      if (a['event-type-id'] === 'CL' && !/rest area/i.test(`${a.headline} ${a.description}`)) closures.push(a); else other++;
    } }
  }
  if (!anyFeed) return null;
  reports.sort((a, b) => a.d - b.d);
  return { meta, rMi, reports, closures, other };
}

function render(slug, name, s, now) {
  const { meta, rMi, reports, closures, other } = s;
  const when = stamp(now);
  const repClosed = reports.filter((x) => x.closedText).slice(0, 1);
  const closeLine = closures.length === 0 && repClosed.length
    ? `The road report below says the highway is closed. The ${meta.dot} incident list shows no separate closure.`
    : closures.length === 0
    ? `The ${meta.dot} feed lists none within ${rMi} mi of ${meta.q}.`
    : `${closures.length} closure${closures.length > 1 ? 's are' : ' is'} listed within ${rMi} mi: ${closures.slice(0, 2).map((a) => esc(`${a.location['route-id'] || ''} ${a.location.direction || ''}: ${clean(a.description || a.headline, 110)}`.replace(/^\s*:?\s*/, '').replace(/\s+:/, ':'))).join('; ')}.`;
  const lead = closures.length ? `<strong>Closure listed.</strong>` : repClosed.length ? `<strong>Closure noted in a road report.</strong>` : `<strong>No closure listed.</strong>`;
  let repLine = '';
  const rows = reports.filter(({ r }) => useful(r['road-surface-condition']) || useful(r['weather-condition'])).sort((a, b) => (b.closedText ? 1 : 0) - (a.closedText ? 1 : 0)).slice(0, 4).map(({ r }) => {
    const nm = clean(r['location-name'] || (r.location && r.location['location-name']) || 'Road report', 70);
    const surf = useful(r['road-surface-condition']).replace(/\.$/, ''), wx = useful(r['weather-condition']).replace(/\.$/, '');
    const t = r['air-temperature'] != null && r['air-temperature'] !== '' ? `${Math.round(+r['air-temperature'])}°F` : '';
    const rs = restrictionText(r);
    const upd = Date.parse(r['date-updated'] || ''); const u = isFinite(upd) ? `reported ${stamp(new Date(upd))}` : '';
    return `<li><strong>${esc(nm)}</strong>: ${[surf, wx, t].filter(Boolean).map(esc).join(', ') || 'no surface reading'}${rs ? `. Chains and traction: ${esc(rs)}` : ''}${u ? ` <span style="color:#5b6670">(${u})</span>` : ''}</li>`;
  });
  if (rows.length) repLine = `<ul style="margin:8px 0 0 18px;padding:0">${rows.join('')}</ul>`;
  else repLine = `<p style="margin:8px 0 0">The ${meta.dot} feed has no current road-weather report within ${rMi} mi of the pass, so there is no surface or chain reading here. Check the ${meta.dot} page linked below.</p>`;
  const otherLine = other ? ` ${other} other alert${other > 1 ? 's' : ''} (crashes, roadwork or hazards) ${other > 1 ? 'are' : 'is'} listed in the same area.` : '';
  return `<!-- passnow:start -->
<section class="mc-passnow" aria-label="Is ${esc(meta.q)} open" style="max-width:1000px;margin:18px auto;padding:16px 20px;border:1px solid #dbe5df;border-radius:12px;background:#f7faf8;font:15px/1.55 Inter,-apple-system,'Segoe UI',sans-serif;color:#1b2420">
<h2 style="font-size:19px;margin:0 0 6px">Is ${esc(meta.q)} open today?</h2>
<p style="margin:0">${lead} ${closeLine}${otherLine}</p>
${repLine}
<p style="margin:10px 0 0;font-size:13.5px;color:#5b6670">Read from the ${esc(meta.dot)} feed on ${esc(when)}. A pass with no closure listed is not a promise it is open, and a camera picture does not show the gates. Confirm on the <a href="${esc(meta.url)}" target="_blank" rel="noopener" style="color:#0f7a4f;font-weight:700">${esc(meta.dot)} page</a> before you leave. The map below updates live.</p>
</section>
<!-- passnow:end -->`;
}

const RE = /<!-- passnow:start -->[\s\S]*?<!-- passnow:end -->/;
const only = process.argv.slice(2);
const dirs = fs.readdirSync(path.join(SITE, 'passes')).filter((d) => fs.existsSync(path.join(SITE, 'passes', d, 'index.html')) && (!only.length || only.includes(d)));
const now = new Date(); let changed = 0; const skipped = [];
for (const slug of dirs) {
  const file = path.join(SITE, 'passes', slug, 'index.html');
  let html = fs.readFileSync(file, 'utf8');
  if (!META[slug]) { skipped.push(`${slug} (no META)`); continue; }
  const P = parsePass(html, slug);
  if (!P) { skipped.push(`${slug} (no PASS)`); continue; }
  const s = await status(slug, P);
  if (!s) { skipped.push(`${slug} (feed not live)`); continue; }
  const block = render(slug, META[slug].q, s, now);
  let out;
  if (RE.test(html)) out = html.replace(RE, block);
  else {
    const m = html.match(/<p class="sub">[\s\S]*?<\/p>/);
    if (!m) { skipped.push(`${slug} (no hero paragraph)`); continue; }
    const i = html.indexOf(m[0]) + m[0].length;
    out = html.slice(0, i) + '\n' + block + html.slice(i);
  }
  // The map's loading text is what a crawler sees first. Say what the map is.
  out = out.replace(/(<div class="co-bs" id="coStatus">)Loading live [^<]*?…(<\/div>)/, '$1Live cameras and alerts$2');
  if (out !== html) { fs.writeFileSync(file, out); changed++; }
}
console.log(`pass status: ${changed} of ${dirs.length} pages changed${skipped.length ? '; skipped ' + skipped.join(', ') : ''}`);
