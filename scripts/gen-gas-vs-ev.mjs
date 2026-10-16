// /gas-vs-electric-car/: cost per 100 miles by state, gas vs home charging, from our own data
// (data/gas-prices.json EIA weekly regular gas, data/electricity-prices.json EIA monthly residential),
// plus a pros and cons section from data/explainers/gas-vs-ev-proscons.html (ChatGPT draft, sourced, checked).
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
const G = JSON.parse(readFileSync('data/gas-prices.json', 'utf8')), E = JSON.parse(readFileSync('data/electricity-prices.json', 'utf8'));
const MPG = 30, KWH = 30;
const REGIONS = [['New England (PADD 1A)', ['Connecticut', 'Maine', 'Massachusetts', 'New Hampshire', 'Rhode Island', 'Vermont']], ['Central Atlantic (PADD 1B)', ['Delaware', 'District of Columbia', 'Maryland', 'New Jersey', 'New York', 'Pennsylvania']], ['Lower Atlantic (PADD 1C)', ['Florida', 'Georgia', 'North Carolina', 'South Carolina', 'Virginia', 'West Virginia']], ['Midwest (PADD 2)', ['Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Michigan', 'Minnesota', 'Missouri', 'Nebraska', 'North Dakota', 'South Dakota', 'Ohio', 'Oklahoma', 'Tennessee', 'Wisconsin']], ['Gulf Coast (PADD 3)', ['Alabama', 'Arkansas', 'Louisiana', 'Mississippi', 'New Mexico', 'Texas']], ['Rocky Mountain (PADD 4)', ['Colorado', 'Idaho', 'Montana', 'Utah', 'Wyoming']], ['West Coast less California', ['Alaska', 'Arizona', 'Hawaii', 'Nevada', 'Oregon', 'Washington']], ['California', ['California']]];
const gasFor = name => G.regular.out[name]?.now ?? G.regular.out[REGIONS.find(r => r[1].includes(name))[0]].now;
const rows = E.states.map(s => { const g = gasFor(s.name); return { name: s.name, gas: g, kwh: s.now, gas100: g * 100 / MPG, ev100: s.now * KWH / 100 }; }).sort((a, b) => (b.gas100 - b.ev100) - (a.gas100 - a.ev100));
const usG = G.regular.out['U.S.'].now, usE = E.us.now, usGas100 = usG * 100 / MPG, usEv100 = usE * KWH / 100;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const m = v => `$${v.toFixed(2)}`;
const td = 'style="padding:9px 6px;border-bottom:1px solid #eee;vertical-align:top"', th = 'style="text-align:left;padding:8px 6px;border-bottom:2px solid #E5E5E5"';
const table = `<div style="overflow-x:auto"><table data-sortable style="width:100%;border-collapse:collapse;font-size:15px;line-height:1.45"><thead><tr><th ${th}>State</th><th ${th}>Gas car, 100 miles</th><th ${th}>EV at home, 100 miles</th><th ${th}>You save with the EV</th></tr></thead><tbody>
${rows.map(r => `<tr><td ${td}>${esc(r.name)}</td><td ${td}>${m(r.gas100)}</td><td ${td}>${m(r.ev100)}</td><td ${td}>${m(r.gas100 - r.ev100)}</td></tr>`).join('\n')}
</tbody></table></div>`;
const sortJs = readFileSync('gas-prices/index.html', 'utf8').match(/<script>\ndocument\.querySelectorAll\('table\[data-sortable\]'\)[\s\S]*?<\/script>/)[0];
const week = new Date(G.regular.week.replace(/(\d\d)\/(\d\d)\/(\d\d)/, '20$3-$1-$2') + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const lede = `Driving 100 miles costs about ${m(usGas100)} in gas for a car that gets ${MPG} mpg, and about ${m(usEv100)} in electricity for an EV charged at home that uses ${KWH} kWh per 100 miles. That is U.S. average gas for the week of ${week} and home electricity for ${E.month}.`;
const pc = existsSync('data/explainers/gas-vs-ev-proscons.html') ? readFileSync('data/explainers/gas-vs-ev-proscons.html', 'utf8') : '';
const body = `    <p class="lede"><strong>${esc(lede)}</strong></p>
    <p>Public fast charging usually costs more than charging at home, so a road trip on fast chargers costs more than the home number.</p>
    <h2>Is it cheaper to drive a gas car or an EV in your state?</h2>
    <p>Sorted by how much the EV saves, most first. Tap a column name to sort by it. Your own cost depends on your car's rating, shown on its window sticker and on fueleconomy.gov.</p>
${table}
${sortJs}
    <p>Gas is the EIA weekly average for regular, using the state number where EIA publishes one and the regional average otherwise. Electricity is the EIA average home price. See <a href="/gas-prices/">gas prices by state</a> and <a href="/ev-charging-cost/">EV charging cost by state</a>.</p>
${pc}`;
const tpl = readFileSync('what-is-my-mile-marker/index.html', 'utf8');
const headA = tpl.slice(0, tpl.indexOf('  <title>')), headB = tpl.slice(tpl.indexOf('  <link rel="icon"'), tpl.indexOf('  <script type="application/ld+json">')), headC = tpl.slice(tpl.indexOf('  <style>'), tpl.indexOf('  <article class="art">')), tail = tpl.slice(tpl.indexOf('  </article>'));
const h1 = 'Is a gas car or an electric car cheaper to drive in your state?', url = 'https://milecheckapp.com/gas-vs-electric-car/';
const title = 'Gas car or electric car: which costs less to drive in your state? | MileCheck';
const ld = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: [{ '@type': 'Question', name: 'Is it cheaper to drive an electric car than a gas car?', acceptedAnswer: { '@type': 'Answer', text: lede } }] };
const html = headA + `  <title>${esc(title)}</title>\n  <meta name="description" content="${esc(lede.slice(0, 300))}">\n  <link rel="canonical" href="${url}">\n  <meta property="og:title" content="${esc(h1)}">\n  <meta property="og:url" content="${url}">\n  <meta property="og:type" content="article">\n` +
  headB.replace(/href="\.\.\//g, 'href="/') + `  <script type="application/ld+json">${JSON.stringify(ld)}</script>\n` + headC.replace(/href="\.\.\//g, 'href="/') +
  `  <article class="art">\n<div class="eyebrow">Gas vs EV</div>\n    <h1>${esc(h1)}</h1>\n${body}\n` + tail;
mkdirSync('gas-vs-electric-car', { recursive: true });
writeFileSync('gas-vs-electric-car/index.html', html.replace(/href="\.\.\//g, 'href="/').replace(/src="\.\.\//g, 'src="/'));
console.log(`gas vs ev: US gas ${m(usGas100)} vs EV ${m(usEv100)} per 100 mi`);
