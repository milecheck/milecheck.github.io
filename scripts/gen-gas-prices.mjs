// /gas-prices/: weekly regular gas and diesel prices from the U.S. Energy Information Administration (public domain).
// EIA publishes the U.S., 7 regions (PADDs), 9 states and 10 cities, not all 50 states. Every other state gets
// its EIA region's average, labeled as a regional average. Rebuilt weekly by .github/workflows/gas-prices.yml.
// Run, then node scripts/finish-pages.mjs --pages-only for the add-on blocks.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { upsert, iso } from './gas-history.mjs';

const SRC = {
  regular: 'https://www.eia.gov/dnav/pet/pet_pri_gnd_a_epmr_pte_dpgal_w.htm',
  diesel: 'https://www.eia.gov/dnav/pet/pet_pri_gnd_a_epd2d_pte_dpgal_w.htm',
};
async function fetchSeries(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'MileCheck gas-prices page (info@milecheckapp.com)' } });
  if (!res.ok) throw new Error(`EIA ${res.status} ${url}`);
  const s = await res.text();
  const dates = [...s.matchAll(/<th class="Series5">(\d\d\/\d\d\/\d\d)<\/th>/g)].map(m => m[1]);
  const out = {};
  for (const part of s.split('<td class="DataStub1">').slice(1)) {
    const name = part.split('</td>')[0].replace(/<[^>]+>/g, '').trim();
    const [cellsPart, histPart = ''] = part.split('class="DataHist"');
    const cells = [...cellsPart.matchAll(/class="(?:DataB|Current2)">([^<]*)</g)].map(m => parseFloat(m[1].trim()));
    const series = (histPart.match(/s=([A-Z0-9_]+)&/) || [])[1];
    const vals = cells.filter(v => !isNaN(v));
    if (vals.length >= 2) out[name] = { now: vals.at(-1), prev: vals.at(-2), series, weeks: Object.fromEntries(cells.map((v, i) => [dates[i], v]).filter(([d, v]) => d && !isNaN(v))) };
  }
  const release = (s.match(/Release Date:\s*([\d/]+)/) || [])[1];
  const next = (s.match(/Next Release Date:\s*([\d/]+)/) || [])[1];
  return { out, week: dates.at(-1), release, next };
}
const reg = await fetchSeries(SRC.regular);
const dsl = await fetchSeries(SRC.diesel);
if (!reg.out['U.S.'] || !dsl.out['U.S.'] || Object.keys(reg.out).length < 20) throw new Error('EIA layout changed; refusing to publish');
const hist = upsert([['regular', reg], ['diesel', dsl]].flatMap(([product, src]) => Object.entries(src.out).filter(([, v]) => v.series)
  .flatMap(([area, v]) => Object.entries(v.weeks).map(([d, price]) => ({ week: iso(d), product, area, series: v.series, price })))));
console.log(`history: ${hist.total} rows (+${hist.added})`);
writeFileSync('data/gas-prices.json', JSON.stringify({ fetched: new Date().toISOString(), regular: reg, diesel: dsl }, null, 1) + '\n');

// EIA region names as published, and the states in each (EIA PADD definitions).
const REGIONS = [
  ['New England (PADD 1A)', 'New England', ['CT', 'ME', 'MA', 'NH', 'RI', 'VT']],
  ['Central Atlantic (PADD 1B)', 'Central Atlantic', ['DE', 'DC', 'MD', 'NJ', 'NY', 'PA']],
  ['Lower Atlantic (PADD 1C)', 'Lower Atlantic', ['FL', 'GA', 'NC', 'SC', 'VA', 'WV']],
  ['Midwest (PADD 2)', 'Midwest', ['IL', 'IN', 'IA', 'KS', 'KY', 'MI', 'MN', 'MO', 'NE', 'ND', 'SD', 'OH', 'OK', 'TN', 'WI']],
  ['Gulf Coast (PADD 3)', 'Gulf Coast', ['AL', 'AR', 'LA', 'MS', 'NM', 'TX']],
  ['Rocky Mountain (PADD 4)', 'Rocky Mountain', ['CO', 'ID', 'MT', 'UT', 'WY']],
  ['West Coast less California', 'West Coast, not California', ['AK', 'AZ', 'HI', 'NV', 'OR', 'WA']],
];
const NAMES = { AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', DC: 'District of Columbia', FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming' };

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const $ = v => (v == null ? '–' : `$${v.toFixed(2)}`);
const chg = v => {
  if (!v) return '–';
  const d = Math.round((v.now - v.prev) * 100);
  return d === 0 ? 'no change' : `${d > 0 ? 'up' : 'down'} ${Math.abs(d)}¢`;
};
const day = mdY => { const [m, d, y] = mdY.split('/'); return new Date(Date.UTC(2000 + +y, m - 1, +d)).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }); };
const week = day(reg.week);

const td = 'style="padding:9px 6px;border-bottom:1px solid #eee;vertical-align:top"';
const th = 'style="text-align:left;padding:8px 6px;border-bottom:2px solid #E5E5E5"';
const table = (head, rows) => `<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:15px;line-height:1.45"><thead><tr>${head.map(h => `<th ${th}>${h}</th>`).join('')}</tr></thead><tbody>
${rows.map(r => `<tr>${r.map(c => `<td ${td}>${c}</td>`).join('')}</tr>`).join('\n')}
</tbody></table></div>`;

const us = reg.out['U.S.'], usD = dsl.out['U.S.'];
const regionRows = [['U.S.', 'U.S. average'], ...REGIONS.map(r => [r[0], r[1]]), ['California', 'California']]
  .map(([k, label]) => [label, $(reg.out[k]?.now), chg(reg.out[k]), $(dsl.out[k]?.now), chg(dsl.out[k])]);
const OWN = ['California', 'Colorado', 'Florida', 'Massachusetts', 'Minnesota', 'New York', 'Ohio', 'Texas', 'Washington'];
const ownRows = OWN.map(n => [n, $(reg.out[n]?.now), chg(reg.out[n])]);
const CITIES = ['Boston', 'Chicago', 'Cleveland', 'Denver', 'Houston', 'Los Angeles', 'Miami', 'New York City', 'San Francisco', 'Seattle'];
const cityRows = CITIES.filter(c => reg.out[c]).map(c => [c, $(reg.out[c].now), chg(reg.out[c])]);

const stateVals = Object.keys(NAMES).sort((a, b) => NAMES[a].localeCompare(NAMES[b])).map(ab => {
  const n = NAMES[ab];
  if (ab === 'CA') return { n, r: reg.out.California?.now, d: dsl.out.California?.now, rOwn: true, dOwn: true, region: 'California' };
  const r = REGIONS.find(x => x[2].includes(ab));
  const own = OWN.includes(n) && reg.out[n];
  return { n, r: own ? reg.out[n].now : reg.out[r[0]]?.now, d: dsl.out[r[0]]?.now, rOwn: !!own, dOwn: false, region: r[1] };
});
const sorted = [...stateVals].sort((a, b) => b.r - a.r || a.n.localeCompare(b.n));
const rankOf = v => 1 + sorted.filter(x => x.r > v).length;
const tied = v => sorted.filter(x => x.r === v).length > 1;
const stateRows = sorted.map(x => [`${tied(x.r) ? 'T-' : ''}${rankOf(x.r)}`, esc(x.n), x.rOwn ? `<strong>${$(x.r)}</strong>` : $(x.r), $(x.d), esc(x.region)]);

const tpl = readFileSync('what-is-my-mile-marker/index.html', 'utf8');
const headA = tpl.slice(0, tpl.indexOf('  <title>'));
const headB = tpl.slice(tpl.indexOf('  <link rel="icon"'), tpl.indexOf('  <script type="application/ld+json">'));
const headC = tpl.slice(tpl.indexOf('  <style>'), tpl.indexOf('  <article class="art">'));
const tail = tpl.slice(tpl.indexOf('  </article>'));

const h1 = 'What are gas prices in my state this week?';
const url = 'https://milecheckapp.com/gas-prices/';
const title = 'What are gas prices in my state this week? Regular and diesel | MileCheck';
const lede = `The U.S. average for regular gas was ${$(us.now)} a gallon for the week of ${week}, ${chg(us)} from the week before. Diesel averaged ${$(usD.now)}, ${chg(usD)}.`;
const desc = `${lede} Regular and diesel averages by state and region from the U.S. Energy Information Administration, updated weekly.`;
const updated = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/Los_Angeles' });
const body = `    <p style="font-size:14px;color:#5b6670;margin:0 0 12px"><strong>Last updated ${updated}</strong> · EIA prices for the week of ${week}</p>
    <p class="lede"><strong>${esc(lede)}</strong></p>
    <p>Prices are averages across stations, including taxes. The station on your exit can be higher or lower.</p>
    <h2>Gas prices by state, ranked</h2>
    <p>Ranked by the price of regular, most expensive first. T means tied: states that share a regional average share a rank. EIA publishes its own weekly number for 9 states, shown in <strong>bold</strong>. Every other price is the average for the EIA region in the last column.</p>
${table(['Rank', 'State', 'Regular', 'Diesel', 'EIA region'], stateRows)}
    <h2>Regions</h2>
${table(['Region', 'Regular', 'vs last week', 'Diesel', 'vs last week'], regionRows)}
    <h2>States with their own weekly number</h2>
${table(['State', 'Regular', 'vs last week'], ownRows)}
    <h2>Cities</h2>
${table(['City', 'Regular', 'vs last week'], cityRows)}
    <h2>Why don't all states have their own number?</h2>
    <p>EIA surveys stations each Monday and publishes the U.S. average, seven regional averages, and nine states it samples separately. The rest of the states are covered inside their regional average. California is broken out because its prices run well above the rest of the West Coast.</p>
    <h2>Source</h2>
    <p><a href="${SRC.regular}" target="_blank" rel="noopener">EIA weekly retail gasoline prices</a> and <a href="${SRC.diesel}" target="_blank" rel="noopener">EIA weekly on-highway diesel prices</a>. Week of ${week}, released ${day(reg.release)}. Next release ${day(reg.next)}. This page updates on its own after each release.</p>
    <h2>More about gas</h2>
    <ul><li><a href="/when-is-gas-cheapest/">When is gas cheapest during the year?</a></li><li><a href="/which-states-pump-your-gas/">Which states pump your gas for you?</a></li><li><a href="/how-to-pump-gas/">How do you pump gas?</a></li></ul>
    <h2>On the road</h2>
    <ul><li><a href="/rest-areas/">Can you sleep at a rest area? Rules by state</a></li><li><a href="/road-conditions/">Road conditions by state</a></li><li><a href="/what-mile-marker-am-i-at/">What mile marker am I at?</a></li></ul>`;
const ld = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: [
  { '@type': 'Question', name: 'What is the average gas price in the U.S. this week?', acceptedAnswer: { '@type': 'Answer', text: lede } },
  { '@type': 'Question', name: 'Why are some states shown with a regional average?', acceptedAnswer: { '@type': 'Answer', text: 'The U.S. Energy Information Administration publishes weekly prices for 9 states. Other states are shown with the average for their EIA region.' } },
] };
const html = headA +
  `  <title>${esc(title)}</title>\n  <meta name="description" content="${esc(desc)}">\n  <link rel="canonical" href="${url}">\n` +
  `  <meta property="og:title" content="${esc(h1)}">\n  <meta property="og:description" content="${esc(desc)}">\n  <meta property="og:url" content="${url}">\n  <meta property="og:type" content="article">\n` +
  headB.replace(/href="\.\.\//g, 'href="/') +
  `  <script type="application/ld+json">${JSON.stringify(ld)}</script>\n` +
  headC.replace(/href="\.\.\//g, 'href="/') +
  `  <article class="art">\n<div class="eyebrow">Fuel</div>\n    <h1>${esc(h1)}</h1>\n${body}\n` + tail;
mkdirSync('gas-prices', { recursive: true });
writeFileSync('gas-prices/index.html', html.replace(/href="\.\.\//g, 'href="/').replace(/src="\.\.\//g, 'src="/'));
console.log(`gas prices: week of ${week}, US regular ${$(us.now)}, diesel ${$(usD.now)}`);
