// /road-workers/: highway maintenance worker pay and jobs by state, from data/road-workers.json
// (BLS OEWS, refreshed yearly by scripts/fetch-road-workers.mjs). Shell borrowed from /what-is-my-mile-marker/.
// Run, then node scripts/finish-pages.mjs --pages-only.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const D = JSON.parse(readFileSync('data/road-workers.json', 'utf8'));
const NAMES = { AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming', HI: 'Hawaii', DC: 'District of Columbia' };
const OCC = '474051';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const $ = n => '$' + Math.round(n).toLocaleString('en-US');
const us = D.us[OCC], year = D.year;
const rows = Object.entries(D.states).map(([st, v]) => ({ st, name: NAMES[st], ...v[OCC] })).sort((a, b) => b.median - a.median);
const top = rows[0], bottom = rows.at(-1);
const td = 'style="padding:9px 6px;border-bottom:1px solid #eee;vertical-align:top"', th = 'style="text-align:left;padding:8px 6px;border-bottom:2px solid #E5E5E5"';
const table = `<div style="overflow-x:auto"><table data-sortable style="width:100%;border-collapse:collapse;font-size:15px;line-height:1.45"><thead><tr><th ${th}>State</th><th ${th}>Median pay</th><th ${th}>Average pay</th><th ${th}>Workers</th></tr></thead><tbody>
${rows.map(r => `<tr><td ${td}>${esc(r.name)}</td><td ${td}>${$(r.median)}</td><td ${td}>${$(r.mean)}</td><td ${td}>${r.employment.toLocaleString('en-US')}</td></tr>`).join('\n')}
</tbody></table></div>`;
const sortJs = readFileSync('gas-prices/index.html', 'utf8').match(/<script>\ndocument\.querySelectorAll\('table\[data-sortable\]'\)[\s\S]*?<\/script>/)[0];
const lede = `Highway maintenance workers in the U.S. earned a median of ${$(us.median)} a year in May ${year}, and about ${(Math.round(us.employment / 100) * 100).toLocaleString('en-US')} people do the job. Pay runs from a median of ${$(bottom.median)} in ${bottom.name} to ${$(top.median)} in ${top.name}.`;
const body = `    <p class="lede"><strong>${esc(lede)}</strong></p>
    <p>These are the crews who plow the snow, patch the potholes, fix the guardrail and clear the road after a crash so the rest of us can drive it. Thank you.</p>
    <h2>What does a highway maintenance worker do?</h2>
    <p>The Bureau of Labor Statistics describes the job as keeping highways, local roads and rights-of-way in working order. That means patching broken pavement, repairing guardrails, signs and snow fences, mowing and clearing brush along the road, and plowing snow.</p>
    <h2>How much do highway maintenance workers make in each state?</h2>
    <p>Sorted by median pay, highest first. Tap a column name to sort by it. The median is the middle of the pay range, so half earn more and half earn less.</p>
${table}
${sortJs}
    <p>Hawaii and the District of Columbia are not shown because BLS does not publish a separate number for them for this job.</p>
    <h2>Who counts as a highway maintenance worker here?</h2>
    <p>Everyone in this job, whoever they work for. That includes state DOT crews, county and city road crews, and private contractors. The pay shown is base wages. BLS does not count overtime, so storm shifts are not in these numbers.</p>
    <h2>Source</h2>
    <p><a href="https://www.bls.gov/oes/current/oes474051.htm" target="_blank" rel="noopener">U.S. Bureau of Labor Statistics, Occupational Employment and Wage Statistics, highway maintenance workers (47-4051)</a>, May ${year} estimates. Updated each spring.</p>
    <h2>On the road</h2>
    <ul><li><a href="/road-conditions/">Road conditions by state</a></li><li><a href="/snowplows/">Where are the snowplows?</a></li><li><a href="/gas-prices/">Gas prices by state this week</a></li></ul>`;
const tpl = readFileSync('what-is-my-mile-marker/index.html', 'utf8');
const headA = tpl.slice(0, tpl.indexOf('  <title>')), headB = tpl.slice(tpl.indexOf('  <link rel="icon"'), tpl.indexOf('  <script type="application/ld+json">')), headC = tpl.slice(tpl.indexOf('  <style>'), tpl.indexOf('  <article class="art">')), tail = tpl.slice(tpl.indexOf('  </article>'));
const h1 = 'How much do highway maintenance workers make in each state?';
const url = 'https://milecheckapp.com/road-workers/';
const title = `How much do highway maintenance workers make in each state? (${year}) | MileCheck`;
const desc = `Median pay for highway maintenance workers is ${$(us.median)} a year. Pay and number of workers in every state, from the Bureau of Labor Statistics.`;
const ld = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: [{ '@type': 'Question', name: 'How much do highway maintenance workers make?', acceptedAnswer: { '@type': 'Answer', text: lede } }] };
const html = headA + `  <title>${esc(title)}</title>\n  <meta name="description" content="${esc(desc)}">\n  <link rel="canonical" href="${url}">\n  <meta property="og:title" content="${esc(h1)}">\n  <meta property="og:description" content="${esc(desc)}">\n  <meta property="og:url" content="${url}">\n  <meta property="og:type" content="article">\n` +
  headB.replace(/href="\.\.\//g, 'href="/') + `  <script type="application/ld+json">${JSON.stringify(ld)}</script>\n` + headC.replace(/href="\.\.\//g, 'href="/') +
  `  <article class="art">\n<div class="eyebrow">Road crews</div>\n    <h1>${esc(h1)}</h1>\n${body}\n` + tail;
mkdirSync('road-workers', { recursive: true });
writeFileSync('road-workers/index.html', html.replace(/href="\.\.\//g, 'href="/').replace(/src="\.\.\//g, 'src="/'));
console.log(`road workers: ${rows.length} states, US median ${$(us.median)}`);
