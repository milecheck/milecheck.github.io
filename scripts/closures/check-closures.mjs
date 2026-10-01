// Checks every published closure page against the live state DOT feed (via the MileCheck Worker)
// and updates its status in big-closures.json. Run hourly; then run gen-closure-pages.mjs.
//
// States: scheduled · reported-closed · unconfirmed · reopened.
// Rules (ChatGPT review, 2026-09-30):
//  - A missing record in a healthy feed counts as a miss. Two misses in a row → unconfirmed.
//  - A failed or empty feed is not a miss. Status stays, lastCheckOk does not move, lastCheckFailed is set.
//  - Nothing here ever sets "reopened". A passed end date or a vanished record is not proof the
//    road is open. A person sets reopened (with reopenedOn and a source) by hand.
//  - verifiedAt (shown as "Last checked") moves only when the record was found in a healthy feed.
import fs from 'node:fs';
const FILE = process.env.CLOSURES_FILE || 'scripts/closures/big-closures.json';
const WORKER = 'https://milepost-proxy.leahgerber93.workers.dev';
const items = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const now = new Date();

async function feed(state) {
  try {
    const r = await fetch(`${WORKER}/incidents?state=${state}`, { headers: { 'User-Agent': 'MileCheck-site/1.0', 'X-MC-Client': 'site-closure-check' } });
    if (!r.ok) return { ok: false, why: `HTTP ${r.status}` };
    const j = await r.json();
    const list = Array.isArray(j) ? j : (j['incident-reports'] || []);
    if (!list.length) return { ok: false, why: 'empty feed' };
    return { ok: true, list };
  } catch (e) { return { ok: false, why: String(e.message || e) }; }
}

const states = [...new Set(items.filter(c => c.source).map(c => c.source.state))];
const feeds = Object.fromEntries(await Promise.all(states.map(async s => [s, await feed(s)])));
let changed = 0;
for (const c of items) {
  if (!c.source || c.status?.state === 'reopened') continue;
  const before = JSON.stringify([c.status, c.verifiedAt]);
  const f = feeds[c.source.state];
  const st = c.status;
  if (!f.ok) {
    st.lastCheckFailed ??= now.toISOString(); // first failure only, so a long outage is one commit
    st.failReason = f.why;
  } else {
    delete st.lastCheckFailed; delete st.failReason;
    const fp = c.source.fingerprint;
    // Some feeds (Illinois) mint a new id on every fetch; those entries match on route + start time.
    const rec = f.list.find(i => (i['incident-id'] || i.id) === c.source.recordId)
      || (fp && f.list.find(i => (i.location || {})['route-id'] === fp.route && i['start-time'] === fp.startTime));
    if (rec) {
      st.missedChecks = 0;
      c.verifiedAt = now.toLocaleDateString('en-CA', { timeZone: 'America/Chicago' }); // YYYY-MM-DD, US Central
      const starts = c.schedule?.startsAt ? new Date(c.schedule.startsAt) : null;
      st.state = starts && now < starts ? 'scheduled' : 'reported-closed';
      const ends = c.schedule?.endsAt ? new Date(c.schedule.endsAt) : null;
      st.note = ends && now > ends ? 'past-scheduled-end' : null;
    } else {
      st.missedChecks = (st.missedChecks || 0) + 1;
      if (st.missedChecks >= 2) st.state = 'unconfirmed';
    }
  }
  if (JSON.stringify([st, c.verifiedAt]) !== before) changed++;
  console.log(c.slug.padEnd(40), st.state, st.missedChecks ? `missed ${st.missedChecks}` : '', st.lastCheckFailed ? `FEED FAIL ${st.failReason}` : '', st.note || '');
}
// Write only on a real change so the hourly job doesn't commit every hour.
if (changed) fs.writeFileSync(FILE, JSON.stringify(items, null, 1) + '\n');
console.log(`${changed} status change(s)`);
