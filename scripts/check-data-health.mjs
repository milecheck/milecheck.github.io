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
const WORKER = 'https://milepost-proxy.leahgerber93.workers.dev';
const UA = 'MileCheck-DataHealth/1.0 (+https://milecheckapp.com)';
const CAMERA_DROP = 0.4;          // fail if cameras fall more than 40% below baseline
const ALERT_MIN_BASELINE = 10;    // only fail an empty alert feed when the baseline had at least this many
const STALE_HOURS = 6;            // fetched_at older than this = stale feed

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
  const out = { cameras: null, cameraSupported: true, cameraUnavailable: false, alerts: null, alertStatus: null, alertErrors: 0, fetchedAt: null, errors: [] };
  try {
    const c = await getJson(`${WORKER}/cameras?state=${st}`);
    out.cameras = Array.isArray(c.cameras) ? c.cameras.length : 0;
    if (c.supported === false) out.cameraSupported = false;
    if (c.supported !== false && c.unavailable) out.cameraUnavailable = true;
  } catch (e) { out.errors.push(`cameras: ${e.message}`); }
  try {
    const a = await getJson(`${WORKER}/incidents?state=${st}`);
    out.alerts = (a['incident-reports'] || []).length;
    out.alertStatus = a.source_status || null;
    out.alertErrors = (a.errors || []).length;
    out.fetchedAt = a.fetched_at || null;
  } catch (e) { out.errors.push(`alerts: ${e.message}`); }
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
  if (p.cameraUnavailable) { seenBroken.add(`${st}:cameras`); flag(`${st}:cameras`, `${st}: camera feed says unavailable (supported, but the DOT source is not answering)`); }
  else if (p.cameras != null && b.cameras > 0) {
    if (p.cameras === 0) flag(`${st}:cameras`, `${st}: cameras dropped to 0 (baseline ${b.cameras})`);
    else if (p.cameras < b.cameras * (1 - CAMERA_DROP)) flag(`${st}:cameras`, `${st}: cameras fell to ${p.cameras} (baseline ${b.cameras}, over ${CAMERA_DROP * 100}% drop)`);
  }
  if (p.alerts != null) {
    if (p.alertStatus === 'failed') { seenBroken.add(`${st}:alerts`); flag(`${st}:alerts`, `${st}: alert feed status is "failed"`); }
    else if (p.alertStatus === 'partial' || p.alertErrors) warnings.push(`${st}: alert feed partial (${p.alertErrors} source error(s))`);
    if (p.alerts === 0 && b.alerts >= ALERT_MIN_BASELINE && !allow.has(st)) problems.push(`${st}: alert feed empty (baseline ${b.alerts})`);
    if (p.fetchedAt) {
      const age = (Date.now() - new Date(p.fetchedAt).getTime()) / 36e5;
      if (age > STALE_HOURS) problems.push(`${st}: alert feed stale, fetched ${age.toFixed(1)}h ago`);
    }
  }
}

for (const k of Object.keys(known)) if (!seenBroken.has(k)) warnings.push(`${k} is listed in knownBroken but looks healthy now. Remove it and run --update-baseline.`);
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
