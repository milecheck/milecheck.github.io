#!/usr/bin/env node
// gen-alert-latency.mjs — how long after the agency's own event time MileCheck first sees an alert, per state.
// (TODO 2026-11-03: "Measure how long each state takes ... show the median per state on /api/data-quality/".)
// Input: .cache/lifecycle/*.jsonl from scripts/pull-incident-lifecycle.sh (one row per incident the Worker has seen
// open and close; `first` = our first read, `dotStart` = the agency's start-time field). Output: data/alert-latency.json
// (aggregates only), which gen-api-data-quality.mjs reads.
//   node scripts/gen-alert-latency.mjs
// What counts: crashes (AC) and hazards (HZ), the unplanned events, where the start time is when it happened or was logged.
// Closures and work zones are left out because their start times are schedules, often in the future.
// What is left out and why is written into the JSON and shown on the page: a state is dropped when fewer than MIN_N rows
// qualify, when its start times run in the future for more than a fifth of rows, or when its median is over MAX_MEDIAN
// minutes (an hours-long gap here means the agency's timestamp does not mean "when it happened", not that the agency is slow).
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
const MIN_N = 30, MAX_MEDIAN = 120, MAX_LAG = 360, ARCHIVE_START = '2026-09-26T00:00:00Z';
const dir = '.cache/lifecycle';
if (!existsSync(dir)) throw new Error('run scripts/pull-incident-lifecycle.sh first');
const rows = readdirSync(dir).filter((f) => f.endsWith('.jsonl')).flatMap((f) => readFileSync(`${dir}/${f}`, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)));
const q = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
const by = {};
for (const r of rows) {
  if (!(r.type === 'AC' || r.type === 'HZ') || !r.dotStart || r.first < ARCHIVE_START) continue; // first < start: open when the archive began, so `first` is not a first sighting
  const d = Date.parse(r.dotStart), f = Date.parse(r.first);
  if (!Number.isFinite(d) || !Number.isFinite(f)) continue;
  const lag = (f - d) / 60000;
  const b = (by[r.state] ||= { all: 0, lags: [], future: 0, old: 0 });
  b.all++;
  if (lag < -5) b.future++; else if (lag > MAX_LAG) b.old++; else b.lags.push(Math.max(0, lag));
}
const kept = [], dropped = [];
for (const [st, b] of Object.entries(by).sort()) {
  const n = b.lags.length;
  const med = n ? q(b.lags, 0.5) : null;
  let why = null;
  if (n < MIN_N) why = `fewer than ${MIN_N} usable crashes and hazards`;
  else if (b.future / b.all > 0.2) why = 'start times often run ahead of the clock';
  else if (med > MAX_MEDIAN) why = 'start time does not track when the event happened';
  if (why) dropped.push({ st, n, why }); else kept.push({ st, n, median: Math.round(med), p75: Math.round(q(b.lags, 0.75)) });
}
const first = rows.reduce((m, r) => (r.first >= ARCHIVE_START && r.first < m ? r.first : m), '9999'), last = rows.reduce((m, r) => (r.last > m ? r.last : m), '0000');
writeFileSync('data/alert-latency.json', JSON.stringify({ from: first, to: last, minN: MIN_N, kept, dropped }, null, 1) + '\n');
console.log(`alert latency: ${kept.length} states shown, ${dropped.length} left out, ${first.slice(0, 10)} to ${last.slice(0, 10)}`);
