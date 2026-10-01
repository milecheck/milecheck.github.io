// Daily: lists long full closures in the state DOT feeds that don't have a page yet.
// Output is a review list for a person. Nothing here publishes.
// Usage: node scripts/closures/find-candidates.mjs > candidates.md
import fs from 'node:fs';
const WORKER = 'https://milepost-proxy.leahgerber93.workers.dev';
const STATES = 'AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY'.split(' ');
const have = new Set(JSON.parse(fs.readFileSync('scripts/closures/big-closures.json', 'utf8')).map(c => c.source?.recordId).filter(Boolean));
const CLOSED = /closed to all|close to all traffic|full closure|(?:road|roadway|bridge|highway) (?:is |will be )?closed|around-the-clock closure|is closed|will close/i;
const SKIP = /ramp|exit|\blane|shoulder|turn bay|rest area|restroom|nightly|overnight|sweeping|caltrans full closure/i;
const PLACEHOLDER_YEAR = 2090;
const now = Date.now(), DAY = 864e5;
const strip = s => String(s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const rows = [];
await Promise.all(STATES.map(async st => {
  let list = [];
  try {
    const r = await fetch(`${WORKER}/incidents?state=${st}`, { headers: { 'User-Agent': 'MileCheck-site/1.0', 'X-MC-Client': 'site-closure-candidates' } });
    const j = await r.json(); list = Array.isArray(j) ? j : (j['incident-reports'] || []);
  } catch { return; }
  for (const i of list) {
    const id = i['incident-id'] || i.id;
    if (have.has(id)) continue;
    const text = strip([i.headline, i['impact-desc'], i.description].join(' | '));
    if (!(i['event-type-id'] === 'CL' || CLOSED.test(text)) || SKIP.test(text)) continue;
    const route = (i.location || {})['route-id'] || '';
    if (!/^(I|US|SR|[A-Z]{2})[- ]?\d/.test(route)) continue;
    const s = Date.parse(i['start-time']), e = Date.parse(i['end-time']);
    const placeholder = e && new Date(e).getFullYear() >= PLACEHOLDER_YEAR;
    if (e && !placeholder && e < now) continue;
    if (s && e && !placeholder && e - s < 3 * DAY) continue;
    const big = /^(I|US)[- ]/.test(route) || /bridge|pass/i.test(text);
    rows.push({ st, route, id, big, start: String(i['start-time'] || '').slice(0, 10), end: placeholder ? 'PLACEHOLDER' : String(i['end-time'] || '').slice(0, 10), words: text.split(' ').length, text: text.slice(0, 220) });
  }
}));
// Review order: interstates/US/bridges first, then records with more words (more facts to verify).
rows.sort((a, b) => (b.big - a.big) || (b.words - a.words));
console.log(`# Closure page candidates, ${new Date().toISOString().slice(0, 10)}\n\n${rows.length} long full closures without a page. Verify dates against the DOT notice before adding any to big-closures.json.\n`);
for (const r of rows) console.log(`- **${r.st} ${r.route}** ${r.start} → ${r.end} · \`${r.id}\`${r.end === 'PLACEHOLDER' ? ' · ⚠️ placeholder end date' : ''}\n  ${r.text}`);
