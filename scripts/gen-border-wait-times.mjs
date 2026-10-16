// /border-wait-times/: when the wait is usually shortest and longest at each U.S. land border crossing,
// from MileCheck's hourly archive of CBP wait times (data/border-profile.json, built by the app repo's
// border-profile.yml workflow; month-end routine). U.S.-bound passenger cars, standard lanes. Local time.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const B = JSON.parse(readFileSync('data/border-profile.json', 'utf8'));
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const hl = h => `${h % 12 || 12} ${h < 12 ? 'AM' : 'PM'}`;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const mins = m => m === 0 ? 'no wait' : m < 60 ? `${m} min` : `${Math.floor(m / 60)} hr${m % 60 ? ` ${m % 60} min` : ''}`;
const day = s => new Date(s).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const rows = B.ports.map(p => {
  let lo = null, hi = null;
  for (let d = 0; d < 7; d++) for (let h = 6; h <= 21; h++) { const v = p.grid[d][h]; if (v == null) continue; if (!lo || v < lo.v) lo = { d, h, v }; if (!hi || v > hi.v) hi = { d, h, v }; }
  const all = p.grid.flat().filter(v => v != null).sort((a, b) => a - b);
  return { name: [p.port, p.crossing].filter(Boolean).join(': '), state: p.state, border: /mex/i.test(p.border) ? 'Mexico' : 'Canada', lo, hi, typical: all[Math.floor(all.length / 2)] };
}).filter(r => r.lo && r.hi).sort((a, b) => a.state.localeCompare(b.state) || a.name.localeCompare(b.name));
const td = 'style="padding:9px 6px;border-bottom:1px solid #eee;vertical-align:top"', th = 'style="text-align:left;padding:8px 6px;border-bottom:2px solid #E5E5E5"';
const table = list => `<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:15px;line-height:1.45"><thead><tr><th ${th}>Crossing</th><th ${th}>State</th><th ${th}>Usually longest</th><th ${th}>Usually shortest</th></tr></thead><tbody>
${list.map(r => `<tr><td ${td}>${esc(r.name)}</td><td ${td}>${r.state}</td>${r.hi.v <= 5 ? `<td ${td} colspan="2">Usually ${r.hi.v ? 'under 5 min' : 'no wait'} at every hour</td>` : `<td ${td}>${DAYS[r.hi.d]} ${hl(r.hi.h)}, about ${mins(r.hi.v)}</td><td ${td}>${DAYS[r.lo.d]} ${hl(r.lo.h)}, ${mins(r.lo.v)}</td>`}</tr>`).join('\n')}
</tbody></table></div>`;
const worst = [...rows].sort((a, b) => b.hi.v - a.hi.v)[0];
const lede = `Border waits follow a weekly pattern. MileCheck has logged the wait at every U.S. land crossing every hour since ${day(B.from)}. Below is when each crossing is usually busiest and quietest, between 6 AM and 10 PM local time.`;
const body = `    <p class="lede"><strong>${esc(lede)}</strong></p>
    <p><strong>What this counts:</strong> waits to enter the United States in standard passenger lanes, as posted by U.S. Customs and Border Protection. "Usually" means the middle reading for that day and hour across the weeks logged. Holidays and events can be much worse. Check the live wait before you go.</p>
    <h2>When is the wait longest and shortest at each crossing into the U.S. from Canada?</h2>
${table(rows.filter(r => r.border === 'Canada'))}
    <h2>When is the wait longest and shortest at each crossing into the U.S. from Mexico?</h2>
${table(rows.filter(r => r.border === 'Mexico'))}
    <h2>Where can you see the wait right now?</h2>
    <p>Live waits for every crossing, both directions, are at <a href="/borders/">milecheckapp.com/borders</a>.</p>
    <h2>Where does this come from?</h2>
    <p>MileCheck saves the CBP wait for every crossing every hour. CBP shows only the current wait, so this history does not exist anywhere else. Logged ${day(B.from)} to ${day(B.to)}, ${B.snapshots.toLocaleString('en-US')} hourly readings. Updated every month.</p>
    <p>Run a freight, travel or logistics business and want this by crossing and hour? <a href="/api/#dataset">See MileCheck data licensing</a>.</p>`;
const tpl = readFileSync('what-is-my-mile-marker/index.html', 'utf8');
const headA = tpl.slice(0, tpl.indexOf('  <title>')), headB = tpl.slice(tpl.indexOf('  <link rel="icon"'), tpl.indexOf('  <script type="application/ld+json">')), headC = tpl.slice(tpl.indexOf('  <style>'), tpl.indexOf('  <article class="art">')), tail = tpl.slice(tpl.indexOf('  </article>'));
const h1 = 'When is the border wait shortest at each crossing?', url = 'https://milecheckapp.com/border-wait-times/';
const ld = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: [{ '@type': 'Question', name: 'What is the best time to cross the border into the U.S.?', acceptedAnswer: { '@type': 'Answer', text: lede } }] };
const html = headA + `  <title>${esc(h1)} Canada and Mexico, by day and hour | MileCheck</title>\n  <meta name="description" content="${esc(lede)}">\n  <link rel="canonical" href="${url}">\n  <meta property="og:title" content="${esc(h1)}">\n  <meta property="og:url" content="${url}">\n  <meta property="og:type" content="article">\n` +
  headB.replace(/href="\.\.\//g, 'href="/') + `  <script type="application/ld+json">${JSON.stringify(ld)}</script>\n` + headC.replace(/href="\.\.\//g, 'href="/') +
  `  <article class="art">\n<div class="eyebrow">MileCheck data</div>\n    <h1>${esc(h1)}</h1>\n${body}\n` + tail;
mkdirSync('border-wait-times', { recursive: true });
writeFileSync('border-wait-times/index.html', html.replace(/href="\.\.\//g, 'href="/').replace(/src="\.\.\//g, 'src="/'));
console.log(`border wait times: ${rows.length} crossings, ${B.from} .. ${B.to}, worst ${worst.name} ${worst.hi.v}`);
