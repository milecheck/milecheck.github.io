// Cameras a DOT files under the wrong road (Leah, 2026-10-16: UDOT lists "I-215 W SB @ 450 N" under I-80).
// A camera is flagged only when all three agree: its own name starts with a different road, it sits within
// half a mile of that road's mile markers, and it is at least 0.75 mi from every marker of the road it is
// filed under (markers run about a mile apart, so that is more than half a mile off the road itself), but within
// 5 miles of it. Further away usually means the two roads share pavement and the corpus carries only one of them
// (I-39 and US-51 in Illinois), which is not an error. Names that list two roads ("I-55/64") or mention the filed
// road ("I-55 at I-39", "ramp to 528") are interchange or shared-road cameras and are left alone.
// Output: data/camera-route-notes.json, read by assets/map-kit.js section 10, which puts a note on the card.
// Needs the app repo's milepost corpus (../assets/data). Run: node scripts/check-camera-routes.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const WORKER = 'https://milepost-proxy.leahgerber93.workers.dev';
const HDR = { 'User-Agent': 'MileCheck/1.10.43 (ios)', 'X-MC-Client': 'milecheck-app/1.10.43 (ios)' };
const STATES = 'AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY AB BC MB ON QC NB NS SK YT NT'.split(' ');
const norm = r => String(r || '').toUpperCase().replace(/[\s-]+/g, '');
const SKIP = /^(MP|EXIT|RWIS|CAM|MM|KM)$/;
// "I-215 W SB @ 450 N" -> I-215. Only a road written first, before any @.
const titleRoute = t => { const m = String(t || '').match(/^\s*([A-Z]{1,3})[- ]?(\d{1,4}[A-Z]?)\b/); return m && !SKIP.test(m[1]) ? m[1] + '-' + m[2] : null; };
const mi = (a, b, c, d) => { const p = Math.PI / 180, x = (c - a) * p, y = (d - b) * p, h = Math.sin(x / 2) ** 2 + Math.cos(a * p) * Math.cos(c * p) * Math.sin(y / 2) ** 2; return 2 * 3958.8 * Math.asin(Math.sqrt(h)); };
const notes = {}, summary = [];
for (const st of STATES) {
  const f = `../assets/data/mileposts_${st}.json`;
  if (!existsSync(f)) continue;
  const raw = JSON.parse(readFileSync(f, 'utf8'));
  const posts = (Array.isArray(raw) ? raw : Object.entries(raw).flatMap(([r, a]) => a.map(p => ({ ...p, highway: p.highway || r })))).filter(p => p.lat != null && p.lon != null);
  const byRoute = new Map();
  for (const p of posts) { const k = norm(p.highway || p.route); if (!byRoute.has(k)) byRoute.set(k, []); byRoute.get(k).push(p); }
  const near = (lat, lon, k) => { let b = Infinity; for (const p of byRoute.get(k) || []) { const d = mi(lat, lon, p.lat, p.lon); if (d < b) b = d; } return b; };
  let cams = [];
  try { const r = await fetch(`${WORKER}/cameras?state=${st}`, { headers: HDR }); if (r.ok) { const j = await r.json(); cams = Array.isArray(j) ? j : (j.cameras || []); } } catch (e) {}
  let n = 0;
  for (const c of cams) {
    const listed = c.route, named = titleRoute(c.title);
    if (!named || !listed || norm(named) === norm(listed)) continue;
    if (!byRoute.has(norm(named)) || !byRoute.has(norm(listed)) || c.lat == null) continue;
    if (/^\s*[A-Z]{1,3}[- ]?\d{1,4}[A-Z]?\s*\//.test(c.title)) continue;
    const num = String(listed).match(/(\d{1,4}[A-Z]?)\s*$/);
    const rest = String(c.title).replace(/^\s*[A-Z]{1,3}[- ]?\d{1,4}[A-Z]?/, '').replace(/\b(MP|MM|Mile ?post)\s*[\d.]+/gi, '');
    if (num && new RegExp('(^|[^0-9.])' + num[1] + '([^0-9.]|$)').test(rest)) continue;
    const dNamed = near(c.lat, c.lon, norm(named)), dListed = near(c.lat, c.lon, norm(listed));
    if (dNamed <= 0.5 && dListed >= 0.75 && dListed <= 5) { notes[c.id] = { on: named, listed, title: c.title, mi_named: +dNamed.toFixed(2), mi_listed: +dListed.toFixed(2) }; n++; }
  }
  if (cams.length) summary.push(`${st} ${n}/${cams.length}`);
}
writeFileSync('data/camera-route-notes.json', JSON.stringify({ checked: new Date().toISOString().slice(0, 10), rule: 'name starts with another road and does not mention the listed one, within 0.5 mi of its markers, 0.75 to 5 mi from the nearest marker of the listed road', cameras: notes }, null, 1) + '\n');
console.log(`camera route notes: ${Object.keys(notes).length} flagged. ${summary.join(' · ')}`);
