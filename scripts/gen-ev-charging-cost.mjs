// /ev-charging-cost/: home electricity price by state (EIA Electric Power Monthly table 5.6.A, residential,
// public domain) and what 100 miles of charging costs at home for a car rated 30 kWh per 100 miles.
// Archived to data/electricity-prices-history.csv. Rebuilt weekly with gas prices (EIA publishes monthly).
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
const SRC = 'https://www.eia.gov/electricity/monthly/epm_table_grapher.php?t=epmt_5_6_a';
const res = await fetch(SRC, { headers: { 'User-Agent': 'Mozilla/5.0 (MileCheck electricity page; info@milecheckapp.com)' } });
if (!res.ok) throw new Error(`EIA ${res.status}`);
const page = await res.text();
const txt = page.replace(/<[^>]+>/g, '|').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');
const month = (txt.match(/by State, ([A-Z][a-z]+ \d{4}) and \d{4}/) || [])[1];
if (!month) throw new Error('EIA layout changed');
const NAMES = ['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','District of Columbia','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'];
const get = name => { const m = txt.match(new RegExp(`\\|\\s*${name}\\s*\\|[|\\s]*([\\d.]+)[|\\s]*([\\d.]+)`)); return m ? { now: +m[1], prev: +m[2] } : null; };
const states = NAMES.map(n => ({ name: n, ...get(n) })).filter(r => r.now);
const us = get('U.S. Total');
if (states.length < 50 || !us) throw new Error(`EIA layout changed (${states.length} states)`);
const KWH = 30;
const iso = new Date(month + ' 1').toISOString().slice(0, 7);
writeFileSync('data/electricity-prices.json', JSON.stringify({ source: SRC, month, us, states }, null, 1) + '\n');
const H = 'month,state,residential_cents_per_kwh';
const hist = new Map(existsSync('data/electricity-prices-history.csv') ? readFileSync('data/electricity-prices-history.csv', 'utf8').trim().split('\n').slice(1).map(l => [l.split(',').slice(0, 2).join(','), l]) : []);
for (const r of [...states, { name: 'U.S.', ...us }]) hist.set(`${iso},"${r.name}"`, `${iso},"${r.name}",${r.now}`);
writeFileSync('data/electricity-prices-history.csv', H + '\n' + [...hist.values()].sort().join('\n') + '\n');

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const c = v => `${v.toFixed(1)}¢`, per100 = v => `$${(v * KWH / 100).toFixed(2)}`;
const sorted = [...states].sort((a, b) => b.now - a.now);
const td = 'style="padding:9px 6px;border-bottom:1px solid #eee;vertical-align:top"', th = 'style="text-align:left;padding:8px 6px;border-bottom:2px solid #E5E5E5"';
const table = `<div style="overflow-x:auto"><table data-sortable style="width:100%;border-collapse:collapse;font-size:15px;line-height:1.45"><thead><tr><th ${th}>State</th><th ${th}>100 miles at home</th><th ${th}>Price per kWh</th><th ${th}>A year earlier</th></tr></thead><tbody>
${sorted.map(r => `<tr><td ${td}>${esc(r.name)}</td><td ${td}>${per100(r.now)}</td><td ${td}>${c(r.now)}</td><td ${td}>${c(r.prev)}</td></tr>`).join('\n')}
</tbody></table></div>`;
const sortJs = readFileSync('gas-prices/index.html', 'utf8').match(/<script>\ndocument\.querySelectorAll\('table\[data-sortable\]'\)[\s\S]*?<\/script>/)[0];
const lo = sorted.at(-1), hi = sorted[0];
const lede = `Home electricity averaged ${c(us.now)} per kilowatt-hour in the U.S. in ${month}. For a car rated ${KWH} kWh per 100 miles, that is about ${per100(us.now)} to drive 100 miles, from ${per100(lo.now)} in ${lo.name} to ${per100(hi.now)} in ${hi.name}.`;
const body = `    <p style="font-size:14px;color:#5b6670;margin:0 0 12px"><strong>${esc(month)} prices</strong> · U.S. Energy Information Administration</p>
    <p class="lede"><strong>${esc(lede)}</strong></p>
    <h2>How do you figure out what charging costs?</h2>
    <p>Multiply the price per kilowatt-hour by the kilowatt-hours your car uses. Your car's EPA rating is on its window sticker and on fueleconomy.gov, written as kWh per 100 miles. This page uses ${KWH} as an example.</p>
    <p>These are home prices. Public fast chargers usually cost more per kilowatt-hour, and some charge by the minute.</p>
    <h2>How much does it cost to charge an EV in each state?</h2>
    <p>Sorted by price, highest first. Tap a column name to sort by it.</p>
${table}
${sortJs}
    <h2>Source</h2>
    <p><a href="${SRC}" target="_blank" rel="noopener">U.S. Energy Information Administration, Electric Power Monthly, table 5.6.A</a>, average residential price, ${esc(month)}. <a href="https://www.fueleconomy.gov/" target="_blank" rel="noopener">fueleconomy.gov</a> lists each EV's kWh per 100 miles.</p>
    <h2>More</h2>
    <ul><li><a href="/how-to-charge-an-electric-car/">How do you charge an electric car at a public charger?</a></li><li><a href="/ev-chargers/">How many EV chargers are in each state?</a></li><li><a href="/gas-prices/">Gas prices by state this week</a></li></ul>`;
const tpl = readFileSync('what-is-my-mile-marker/index.html', 'utf8');
const headA = tpl.slice(0, tpl.indexOf('  <title>')), headB = tpl.slice(tpl.indexOf('  <link rel="icon"'), tpl.indexOf('  <script type="application/ld+json">')), headC = tpl.slice(tpl.indexOf('  <style>'), tpl.indexOf('  <article class="art">')), tail = tpl.slice(tpl.indexOf('  </article>'));
const h1 = 'How much does it cost to charge an EV in each state?', url = 'https://milecheckapp.com/ev-charging-cost/';
const title = 'How much does it cost to charge an EV in each state? | MileCheck';
const desc = `${lede}`.slice(0, 300);
const ld = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: [{ '@type': 'Question', name: 'How much does it cost to charge an electric car at home?', acceptedAnswer: { '@type': 'Answer', text: lede } }] };
const html = headA + `  <title>${esc(title)}</title>\n  <meta name="description" content="${esc(desc)}">\n  <link rel="canonical" href="${url}">\n  <meta property="og:title" content="${esc(h1)}">\n  <meta property="og:description" content="${esc(desc)}">\n  <meta property="og:url" content="${url}">\n  <meta property="og:type" content="article">\n` +
  headB.replace(/href="\.\.\//g, 'href="/') + `  <script type="application/ld+json">${JSON.stringify(ld)}</script>\n` + headC.replace(/href="\.\.\//g, 'href="/') +
  `  <article class="art">\n<div class="eyebrow">EV charging</div>\n    <h1>${esc(h1)}</h1>\n${body}\n` + tail;
mkdirSync('ev-charging-cost', { recursive: true });
writeFileSync('ev-charging-cost/index.html', html.replace(/href="\.\.\//g, 'href="/').replace(/src="\.\.\//g, 'src="/'));
console.log(`electricity ${month}: US ${c(us.now)}, ${states.length} states`);
