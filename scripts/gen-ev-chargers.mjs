// /ev-chargers/: public EV charging locations and ports by state, from the U.S. Department of Energy's
// Alternative Fuels Data Center station counts page (public domain). Archived every run to
// data/ev-chargers-history.csv for longitudinal reports. Rebuilt weekly by .github/workflows/gas-prices.yml.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
const SRC = 'https://afdc.energy.gov/stations/states';
const res = await fetch(SRC, { headers: { 'User-Agent': 'MileCheck ev-chargers page (info@milecheckapp.com)' } });
if (!res.ok) throw new Error(`AFDC ${res.status}`);
const page = await res.text();
const tbl = page.slice(page.indexOf('<tbody'), page.indexOf('Loading data'));
const txt = tbl.replace(/<[^>]+>/g, '|').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');
const updated = (page.match(/last updated:\s*([\d/]+)/i) || [])[1];
const NAMES = ['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','District of Columbia','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'];
const num = s => Number(s.replace(/,/g, ''));
const rows = [];
for (const name of [...NAMES, 'Total']) {
  const re = new RegExp(`\\|\\s*${name}\\s*\\|([^A-Za-z]*)`);
  const m = txt.match(re); if (!m) continue;
  const n = (m[1].match(/[\d,]+/g) || []).map(num);
  // Columns: biodiesel, CNG, E85, EV locations, EV ports, L1, L2, DC fast, ...
  if (n.length < 8) continue;
  rows.push({ name, locations: n[3], ports: n[4], l1: n[5], l2: n[6], dc: n[7] });
}
const us = rows.find(r => r.name === 'Total'), states = rows.filter(r => r.name !== 'Total');
if (!us || states.length < 50 || us.ports < 100000) throw new Error('AFDC layout changed; refusing to publish');
const [m, d, y] = updated.split('/'); const iso = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
writeFileSync('data/ev-chargers.json', JSON.stringify({ source: SRC, updated: iso, us, states }, null, 1) + '\n');
const H = 'date,state,locations,ports,level1,level2,dcfast';
const hist = new Map(existsSync('data/ev-chargers-history.csv') ? readFileSync('data/ev-chargers-history.csv', 'utf8').trim().split('\n').slice(1).map(l => [l.split(',').slice(0, 2).join(','), l]) : []);
for (const r of rows) hist.set(`${iso},"${r.name}"`, `${iso},"${r.name}",${r.locations},${r.ports},${r.l1},${r.l2},${r.dc}`);
writeFileSync('data/ev-chargers-history.csv', H + '\n' + [...hist.values()].sort().join('\n') + '\n');

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const f = n => n.toLocaleString('en-US');
const day = new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const sorted = [...states].sort((a, b) => b.dc - a.dc);
const td = 'style="padding:9px 6px;border-bottom:1px solid #eee;vertical-align:top"', th = 'style="text-align:left;padding:8px 6px;border-bottom:2px solid #E5E5E5"';
const table = `<div style="overflow-x:auto"><table data-sortable style="width:100%;border-collapse:collapse;font-size:15px;line-height:1.45"><thead><tr><th ${th}>State</th><th ${th}>Fast charging ports</th><th ${th}>Level 2 ports</th><th ${th}>All ports</th><th ${th}>Locations</th></tr></thead><tbody>
${sorted.map(r => `<tr><td ${td}>${esc(r.name)}</td><td ${td}>${f(r.dc)}</td><td ${td}>${f(r.l2)}</td><td ${td}>${f(r.ports)}</td><td ${td}>${f(r.locations)}</td></tr>`).join('\n')}
</tbody></table></div>`;
const sortJs = readFileSync('gas-prices/index.html', 'utf8').match(/<script>\ndocument\.querySelectorAll\('table\[data-sortable\]'\)[\s\S]*?<\/script>/)[0];
// What changed since the first archived snapshot (data/ev-chargers-history.csv, one row per state per run).
const histRows = readFileSync('data/ev-chargers-history.csv', 'utf8').trim().split('\n').slice(1).map(l => { const p = l.split(','); return { date: p[0], name: p[1].replace(/"/g, ''), dc: Number(p[6]), ports: Number(p[3]) }; });
const firstDate = histRows.reduce((m, r) => r.date < m ? r.date : m, iso);
const before = Object.fromEntries(histRows.filter(r => r.date === firstDate).map(r => [r.name, r]));
const gain = states.filter(r => before[r.name]).map(r => ({ name: r.name, d: r.dc - before[r.name].dc })).sort((a, b) => b.d - a.d);
const usBefore = before['Total'];
const dayOf = d => new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' });
const share = Math.round(us.dc / us.ports * 100);
const changed = (firstDate < iso && usBefore && gain.length) ? `    <h2>How fast is fast charging growing?</h2>
    <p>${share} percent of U.S. charging ports are DC fast chargers. MileCheck saves the Department of Energy's count every time it updates. Between ${dayOf(firstDate)} and ${dayOf(iso)}, the count of fast charging ports went from ${f(usBefore.dc)} to ${f(us.dc)}, a change of ${us.dc - usBefore.dc >= 0 ? '+' : ''}${f(us.dc - usBefore.dc)}. The states with the biggest gains in that time were ${gain.filter(g => g.d > 0).slice(0, 5).map(g => `${esc(g.name)} (+${f(g.d)})`).join(', ') || 'none; the counts did not rise'}.</p>
    <p>Counts can move because chargers open, close or get re-listed, so a short gap is not a trend. This section grows as more weekly counts are saved.</p>` : '';
const lede = `The U.S. has ${f(us.locations)} EV charging locations with ${f(us.ports)} charging ports. ${f(us.dc)} of those ports are DC fast chargers, the kind you use on a road trip.`;
const body = `    <p style="font-size:14px;color:#5b6670;margin:0 0 12px"><strong>Last updated ${day}</strong> · U.S. Department of Energy station counts</p>
    <p class="lede"><strong>${esc(lede)}</strong></p>
    <h2>What is the difference between Level 2 and fast charging?</h2>
    <ul><li><strong>DC fast charging</strong> is for the highway. It adds about 100 to 200 or more miles of range in 30 minutes.</li><li><strong>Level 2</strong> is the common charger at hotels, stores and workplaces. It adds about 25 miles of range per hour.</li><li><strong>Level 1</strong> is a regular wall outlet. It adds about 5 miles of range per hour.</li></ul>
    <p>Those are the Department of Energy's estimates. Your car, the weather and how full the battery is change the numbers.</p>
    <h2>How many EV chargers are in each state?</h2>
    <p>Sorted by fast charging ports, most first. Tap a column name to sort by it. A location can have many ports.</p>
${table}
${sortJs}
${changed}
    <p>Counts include public and private chargers in the Department of Energy's station locator, including older ones. They do not include chargers at people's homes.</p>
    <h2>Source</h2>
    <p><a href="${SRC}" target="_blank" rel="noopener">U.S. Department of Energy, Alternative Fuels Data Center, station counts by state</a> and <a href="https://afdc.energy.gov/fuels/electricity-stations" target="_blank" rel="noopener">charging levels</a>. Data as of ${day}. This page updates every week.</p>
    <h2>More</h2>
    <ul><li><a href="/how-to-charge-an-electric-car/">How do you charge an electric car at a public charger?</a></li><li><a href="/ev-charging-cost/">How much does it cost to charge an EV in each state?</a></li><li><a href="/gas-prices/">Gas prices by state this week</a></li><li><a href="/road-conditions/">Road conditions by state</a></li></ul>`;
const tpl = readFileSync('what-is-my-mile-marker/index.html', 'utf8');
const headA = tpl.slice(0, tpl.indexOf('  <title>')), headB = tpl.slice(tpl.indexOf('  <link rel="icon"'), tpl.indexOf('  <script type="application/ld+json">')), headC = tpl.slice(tpl.indexOf('  <style>'), tpl.indexOf('  <article class="art">')), tail = tpl.slice(tpl.indexOf('  </article>'));
const h1 = 'How many EV chargers are in each state?', url = 'https://milecheckapp.com/ev-chargers/';
const title = 'How many EV chargers are in each state? Fast and Level 2 | MileCheck';
const desc = `${lede} Every state, updated weekly from the U.S. Department of Energy.`;
const ld = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: [{ '@type': 'Question', name: 'How many EV chargers are there in the U.S.?', acceptedAnswer: { '@type': 'Answer', text: lede } }] };
const html = headA + `  <title>${esc(title)}</title>\n  <meta name="description" content="${esc(desc)}">\n  <link rel="canonical" href="${url}">\n  <meta property="og:title" content="${esc(h1)}">\n  <meta property="og:description" content="${esc(desc)}">\n  <meta property="og:url" content="${url}">\n  <meta property="og:type" content="article">\n` +
  headB.replace(/href="\.\.\//g, 'href="/') + `  <script type="application/ld+json">${JSON.stringify(ld)}</script>\n` + headC.replace(/href="\.\.\//g, 'href="/') +
  `  <article class="art">\n<div class="eyebrow">EV charging</div>\n    <h1>${esc(h1)}</h1>\n${body}\n` + tail;
mkdirSync('ev-chargers', { recursive: true });
writeFileSync('ev-chargers/index.html', html.replace(/href="\.\.\//g, 'href="/').replace(/src="\.\.\//g, 'src="/'));
console.log(`ev chargers ${iso}: US ${f(us.ports)} ports, ${f(us.dc)} DC fast, ${states.length} states`);
