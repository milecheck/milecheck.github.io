#!/usr/bin/env node
// Daily data-health check. Pages can load fine while one state's cameras or alerts quietly go empty.
// Reads the Worker's /cameras and /incidents per state and compares against data/data-health-baseline.json.
//   node scripts/check-data-health.mjs                 check, exit 1 and list broken states if anything is wrong
//   node scripts/check-data-health.mjs --update-baseline   rewrite the baseline from live data (review the diff before committing)
//   --fake-zero=CA,cameras   test hook: pretend that state's cameras came back empty
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE_FILE = path.join(ROOT, 'data', 'data-health-baseline.json');
const WORKER = 'https://api.milecheckapp.com';
const UA = 'MileCheck-DataHealth/1.0 (+https://milecheckapp.com)';
const CAMERA_DROP = 0.4;          // fail if cameras fall more than 40% below baseline
const ALERT_MIN_BASELINE = 10;    // only fail an empty alert feed when the baseline had at least this many
const STALE_HOURS = 6;            // fetched_at older than this = stale feed
const AVG_DROP = 0.3;             // fail if a count falls more than 30% below its 7-day average (alerts: same-weekday average, two runs in a row)
const AVG_MIN = 20;               // ...only when that average is at least this (small feeds swing too much)
const AVG_MIN_DAYS = 3;           // ...and only once there are this many days of history
const CAP_COUNTS = new Set([100, 500, 1000]); // a count of exactly this is usually a source's page cap (COtrip hid half its data behind 100)
const HISTORY_FILE = process.env.DATA_HEALTH_HISTORY || path.join(ROOT, '.data-health-history.json'); // kept by the workflow's cache, not committed

const STATES = 'AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY'.split(' ');
const PROVINCES = ['BC', 'ON', 'AB'];
const ALL = [...STATES, ...PROVINCES];

const args = process.argv.slice(2);
const update = args.includes('--update-baseline');
const fake = (args.find((a) => a.startsWith('--fake-zero=')) || '').slice(12).split(',');

async function getJson(url) {
  let lastErr;
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(45000) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } catch (e) { lastErr = e; await new Promise((s) => setTimeout(s, 1500 * (i + 1))); }
  }
  throw lastErr;
}

async function probe(st) {
  const out = { cameras: null, cameraSupported: true, cameraUnavailable: false, alerts: null, alertStatus: null, alertErrors: 0, fetchedAt: null, conditions: null, errors: [] };
  try {
    const c = await getJson(`${WORKER}/cameras?state=${st}`);
    out.cameras = Array.isArray(c.cameras) ? c.cameras.length : 0;
    if (c.supported === false) out.cameraSupported = false;
    if (c.supported !== false && c.unavailable) out.cameraUnavailable = true;
    // The Worker serves a saved copy (up to 24 h old) when the DOT feed is down, marked stale + since. Users still
    // see cameras, so that is a warning until the copy is older than STALE_HOURS, not an outage (10/29).
    if (c.stale && out.cameras > 0) { out.cameraStale = true; out.cameraSince = c.since || null; }
  } catch (e) { out.errors.push(`cameras: ${e.message}`); }
  try {
    const a = await getJson(`${WORKER}/incidents?state=${st}`);
    out.alerts = (a['incident-reports'] || []).length;
    out.alertStatus = a.source_status || null;
    out.alertErrors = (a.errors || []).length;
    out.fetchedAt = a.fetched_at || null;
  } catch (e) { out.errors.push(`alerts: ${e.message}`); }
  try {
    const c = await getJson(`${WORKER}/conditions?state=${st}`);
    if (c.source_status !== 'unsupported') out.conditions = (c['road-weather-reports'] || []).length;
  } catch { /* conditions are only checked for a page cap; a failure here is not a data-health failure */ }
  if (fake[0] === st && fake[1] === 'cameras') out.cameras = 0;
  if (fake[0] === st && fake[1] === 'alerts') out.alerts = 0;
  return out;
}

async function pool(items, n, fn) {
  const res = {}; let i = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    while (i < items.length) { const k = items[i++]; res[k] = await fn(k); }
  }));
  return res;
}

const live = await pool(ALL, 6, probe);

if (update) {
  const old = fs.existsSync(BASE_FILE) ? JSON.parse(fs.readFileSync(BASE_FILE, 'utf8')) : {};
  const states = {};
  for (const st of ALL) {
    const p = live[st];
    if (p.errors.length) { console.error(`${st}: skipped (${p.errors.join('; ')})`); if (old.states?.[st]) states[st] = old.states[st]; continue; }
    states[st] = { cameras: p.cameraSupported ? p.cameras : 0, cameraSupported: p.cameraSupported, alerts: p.alerts, alertStatus: p.alertStatus };
  }
  const out = {
    _note: 'Checked daily by scripts/check-data-health.mjs. cameras 0 = state has no camera feed (not checked). allowZeroAlerts = empty alert feed is normal there. Refresh with --update-baseline and review the diff.',
    updated: new Date().toISOString().slice(0, 10),
    allowZeroAlerts: old.allowZeroAlerts || ['UT'],
    knownBroken: old.knownBroken || {},
    states,
  };
  fs.writeFileSync(BASE_FILE, JSON.stringify(out, null, 1) + '\n');
  console.log(`Baseline written for ${Object.keys(states).length} states.`);
  process.exit(0);
}

const base = JSON.parse(fs.readFileSync(BASE_FILE, 'utf8'));
const allow = new Set(base.allowZeroAlerts || []);
const known = base.knownBroken || {}; // { "NY:cameras": "reason" } failing today, reported as a warning until fixed
const problems = []; const warnings = [];
const flag = (key, msg) => (known[key] ? warnings.push(`${msg} [known: ${known[key]}]`) : problems.push(msg));
const seenBroken = new Set();

for (const st of ALL) {
  const b = base.states[st]; const p = live[st];
  if (!b) { warnings.push(`${st}: not in baseline (run --update-baseline)`); continue; }
  for (const e of p.errors) problems.push(`${st}: Worker request failed, ${e}`);
  if (p.cameraUnavailable && p.cameraStale) {
    const ageH = p.cameraSince ? (Date.now() - new Date(p.cameraSince).getTime()) / 36e5 : null;
    const note = `${st}: cameras are a saved copy from ${p.cameraSince ? `${ageH.toFixed(1)}h ago` : 'an unknown time'} (the DOT feed is not answering; users still see ${p.cameras} cameras)`;
    seenBroken.add(`${st}:cameras`);
    if (ageH == null || ageH > STALE_HOURS) flag(`${st}:cameras`, `${note}, older than ${STALE_HOURS}h`);
    else warnings.push(note);
  } else if (p.cameraUnavailable) { seenBroken.add(`${st}:cameras`); flag(`${st}:cameras`, `${st}: camera feed says unavailable (supported, but the DOT source is not answering)`); }
  else if (p.cameras != null && b.cameras > 0) {
    if (p.cameras === 0) flag(`${st}:cameras`, `${st}: cameras dropped to 0 (baseline ${b.cameras})`);
    else if (p.cameras < b.cameras * (1 - CAMERA_DROP)) flag(`${st}:cameras`, `${st}: cameras fell to ${p.cameras} (baseline ${b.cameras}, over ${CAMERA_DROP * 100}% drop)`);
  }
  if (p.alerts != null) {
    if (p.alertStatus === 'failed') { seenBroken.add(`${st}:alerts`); flag(`${st}:alerts`, `${st}: alert feed status is "failed"`); }
    else if (p.alertStatus === 'stale') warnings.push(`${st}: alert feed is a saved copy (the DOT feed is not answering)`);
    else if (p.alertStatus === 'partial' || p.alertErrors) warnings.push(`${st}: alert feed partial (${p.alertErrors} source error(s))`);
    if (p.alerts === 0 && b.alerts >= ALERT_MIN_BASELINE && !allow.has(st)) problems.push(`${st}: alert feed empty (baseline ${b.alerts})`);
    if (p.fetchedAt) {
      const age = (Date.now() - new Date(p.fetchedAt).getTime()) / 36e5;
      if (age > STALE_HOURS) problems.push(`${st}: alert feed stale, fetched ${age.toFixed(1)}h ago`);
    }
  }
}

// Incident lifecycle (crash log) freshness. The sweep writes each state's open.json about every 16 minutes. IL, MI, NH,
// PA and VT sat frozen from 10/21 to 10/29 with nothing reporting it, so a state whose list is hours old now fails.
// Before the Worker route exists (404) this is skipped, not failed.
const LIFECYCLE_STALE_HOURS = 3;
try {
  const lf = await getJson(`${WORKER}/lifecycle-freshness`);
  for (const [st, at] of Object.entries(lf.states || {})) {
    if (!ALL.includes(st) && st.length !== 2) continue;
    if (!at) { warnings.push(`${st}: no incident-lifecycle list yet`); continue; }
    const ageH = (Date.now() - new Date(at).getTime()) / 36e5;
    if (ageH > LIFECYCLE_STALE_HOURS) flag(`${st}:lifecycle`, `${st}: crash log not written for ${ageH.toFixed(1)}h (last ${at}); its incidents are not being recorded`);
  }
} catch (e) { warnings.push(`lifecycle freshness not checked (${e.message})`); }

// 7-day average: today vs the mean of the previous days kept in the history file.
let history = {};
try { history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8')); } catch { history = {}; }
const today = new Date().toISOString().slice(0, 10);
const allDays = Object.keys(history).filter((d) => d < today).sort();
const pastDays = allDays.slice(-7);
const lowAlerts = new Set();
// Round-number counts: a source that stops at its page size looks healthy but is cut off.
// One day at exactly 100/500/1000 can be chance (WI read 1000, then 1002 a minute later, 10/19),
// so it fails only when yesterday's count for the same feed was the same round number.
const lastDay = pastDays[pastDays.length - 1];
for (const st of ALL) {
  const p = live[st];
  for (const [kind, n] of [['cameras', p.cameras], ['alerts', p.alerts], ['conditions', p.conditions]]) {
    if (!CAP_COUNTS.has(n)) continue;
    const msg = `${st}: ${kind} returned exactly ${n}, which looks like a page cap (data may be cut off)`;
    if (lastDay && history[lastDay]?.[st]?.[kind] === n) flag(`${st}:${kind}`, `${msg}, two days running`);
    else warnings.push(msg);
  }
}
if (pastDays.length >= AVG_MIN_DAYS) {
  // Alerts are mostly roadwork in many states, and roadwork posts drop on weekends and at some
  // hours (MA 59-78 over a weekend vs a 144-178 average, 10/24-10/26; MD, DE, VA, CT the same).
  // So alerts compare against the same weekday when there are 2+ of them in history, and a low
  // count fails only when the previous run was low too. One low run is a warning.
  const dow = new Date(today + 'T12:00:00Z').getUTCDay();
  const sameDow = allDays.filter((d) => new Date(d + 'T12:00:00Z').getUTCDay() === dow);
  for (const st of ALL) {
    const p = live[st];
    for (const kind of ['cameras', 'alerts']) {
      const days = kind === 'alerts' && sameDow.length >= 2 ? sameDow : pastDays;
      const vals = days.map((d) => history[d]?.[st]?.[kind]).filter((v) => typeof v === 'number');
      const minVals = days === sameDow ? 2 : AVG_MIN_DAYS;
      if (vals.length < minVals || p[kind] == null) continue;
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      if (!(avg >= AVG_MIN && p[kind] < avg * (1 - AVG_DROP))) continue;
      const label = days === sameDow ? `${vals.length}-${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dow]} average` : `${vals.length}-day average`;
      const msg = `${st}: ${kind} at ${p[kind]}, over ${AVG_DROP * 100}% below the ${label} of ${Math.round(avg)}`;
      if (kind === 'alerts') {
        lowAlerts.add(st);
        if (lastDay && history[lastDay]?.[st]?.alertsLow) flag(`${st}:alerts`, `${msg}, two runs in a row`);
        else warnings.push(`${msg} (first low run, fails if the next run is low too)`);
      } else flag(`${st}:${kind}`, msg);
    }
  }
} else {
  warnings.push(`7-day average check waits for history (${pastDays.length} of ${AVG_MIN_DAYS} days so far)`);
}
history[today] = Object.fromEntries(ALL.filter((st) => !live[st].errors.length).map((st) => [st, { cameras: live[st].cameras, alerts: live[st].alerts, conditions: live[st].conditions, ...(lowAlerts.has(st) ? { alertsLow: true } : {}) }]));
// 29 days: enough for four same-weekday samples.
for (const d of Object.keys(history).sort().slice(0, -29)) delete history[d];
try { fs.writeFileSync(HISTORY_FILE, JSON.stringify(history)); } catch (e) { warnings.push(`could not save history: ${e.message}`); }

for (const k of Object.keys(known)) if (!seenBroken.has(k)) warnings.push(`${k} is listed in knownBroken but looks healthy now. Remove it and run --update-baseline.`);
// Every public page must carry the current GA4 tag (scripts/ga4-check.mjs).
try {
  const { checkGa4 } = await import('./ga4-check.mjs');
  const ga = checkGa4();
  if (ga.missing.length) flag('site:ga4', `site: ${ga.missing.length} page(s) have no GA4 tag, for example ${ga.missing.slice(0, 3).join(', ')}`);
  if (ga.stale.length) warnings.push(`site: ${ga.stale.length} page(s) carry an old GA4 tag; run node scripts/add-analytics.mjs`);
} catch (e) { warnings.push(`GA4 check could not run: ${e.message}`); }
const cams = ALL.filter((s) => live[s].cameras > 0).length;
console.log(`Checked ${ALL.length} areas. ${cams} with cameras, ${problems.length} problem(s), ${warnings.length} warning(s).`);
for (const w of warnings) console.log(`  warn  ${w}`);
if (problems.length) {
  console.error('\nDATA HEALTH FAILED. Broken areas:');
  for (const x of problems) console.error(`  FAIL  ${x}`);
  console.error('\nPages still load, but the data behind them is wrong. Check the Worker /cameras and /incidents for these states.');
  process.exit(1);
}
console.log('All good.');
