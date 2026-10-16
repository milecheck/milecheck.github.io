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
const rows = Object.entries(D.states).filter(([, v]) => v[OCC]).map(([st, v]) => ({ st, name: NAMES[st], ...v[OCC] })).sort((a, b) => b.median - a.median);
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
    <ul><li><a href="/road-workers/dot-jobs/">How do you get a job at your state DOT?</a></li><li><a href="/road-workers/truck-drivers/">How much do truck drivers make in each state?</a></li><li><a href="/road-workers/emts/">How much do EMTs make in each state?</a></li><li><a href="/road-conditions/">Road conditions by state</a></li><li><a href="/snowplows/">Where are the snowplows?</a></li><li><a href="/gas-prices/">Gas prices by state this week</a></li></ul>`;
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

// ---- /road-workers/dot-jobs/: official careers page for every state DOT (data/dot-careers.json, checked by hand) ----
{
  const C = JSON.parse(readFileSync('data/dot-careers.json', 'utf8'));
  const list = Object.entries(C).map(([st, v]) => ({ st, name: NAMES[st], ...v })).sort((a, b) => a.name.localeCompare(b.name));
  const pay = st => D.states[st]?.[OCC] ? $(D.states[st][OCC].median) : 'Not published';
  const v = st => D.states[st]?.[OCC];
  const rows2 = list.map(r => `<tr><td ${td}>${esc(r.name)}</td><td ${td}><a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.short || r.agency)} careers</a></td><td ${td}>${v(r.st) ? v(r.st).employment.toLocaleString('en-US') : '–'}</td><td ${td}>${pay(r.st)}</td><td ${td}>${v(r.st) ? $(v(r.st).mean) : '–'}</td></tr>`).join('\n');
  const h1b = 'How do you get a job at your state DOT?';
  const body2 = `    <p class="lede"><strong>Every state hires its own road crews. Find your state below and go to its official careers page.</strong></p>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:6px 0 18px">${[[(Math.round(us.employment/100)*100).toLocaleString('en-US'),'highway maintenance workers in the U.S.'],[$(us.median),'median pay a year'],[$(us.mean),'average pay a year'],[rows.reduce((a,r)=>r.employment>a.employment?r:a).name,'has the most highway maintenance workers']].map(([n,l])=>`<div style="background:#fff;border:1px solid #e3e0d6;border-radius:12px;padding:14px"><div style="font:800 24px/1.15 var(--serif,Georgia);color:#0f7a4f">${esc(n)}</div><div style="font-size:13px;color:#5b6670;margin-top:4px">${esc(l)}</div></div>`).join('')}</div>
    <p>State DOTs hire highway maintenance workers, equipment operators, engineers, inspectors and office staff. Many maintenance jobs list a commercial driver's license (CDL), because crews drive plows and dump trucks. Each job posting says what it needs.</p>
    <h2>Where are the job openings for each state DOT?</h2>
    <div style="overflow-x:auto"><table data-sortable style="width:100%;border-collapse:collapse;font-size:15px;line-height:1.45"><thead><tr><th ${th}>State</th><th ${th}>Official careers page</th><th ${th}>Highway maintenance workers</th><th ${th}>Median pay</th><th ${th}>Average pay</th></tr></thead><tbody>
${rows2}
</tbody></table></div>
${sortJs}
    <p>Links checked October 16, 2026. Worker counts and pay are BLS figures for highway maintenance workers for highway maintenance workers in that state, all employers, May ${year}. <a href="/road-workers/">See pay and jobs by state</a>.</p>
    <h2>What does the job look like through the year?</h2>
    <p>In winter, crews plow and treat the roads, often through the night. In spring and summer they patch pavement, fix guardrails and signs, and mow along the road. All year they clear crashes and debris so the road can reopen.</p>
    <p>If you drive past a crew, slow down and give them room.</p>`;
  const ld2 = { '@context': 'https://schema.org', '@type': 'WebPage', name: h1b, url: 'https://milecheckapp.com/road-workers/dot-jobs/' };
  const html2 = headA + `  <title>${esc(h1b)} Careers pages for all 50 states | MileCheck</title>\n  <meta name="description" content="Official careers pages for every state department of transportation, with median pay for highway maintenance workers in each state.">\n  <link rel="canonical" href="https://milecheckapp.com/road-workers/dot-jobs/">\n  <meta property="og:title" content="${esc(h1b)}">\n  <meta property="og:url" content="https://milecheckapp.com/road-workers/dot-jobs/">\n  <meta property="og:type" content="article">\n` +
    headB.replace(/href="\.\.\//g, 'href="/') + `  <script type="application/ld+json">${JSON.stringify(ld2)}</script>\n` + headC.replace(/href="\.\.\//g, 'href="/') +
    `  <article class="art">\n<div class="eyebrow">Road crews</div>\n    <h1>${esc(h1b)}</h1>\n${body2}\n` + tail;
  mkdirSync('road-workers/dot-jobs', { recursive: true });
  writeFileSync('road-workers/dot-jobs/index.html', html2.replace(/href="\.\.\//g, 'href="/').replace(/src="\.\.\//g, 'src="/'));
  console.log(`dot jobs: ${list.length} careers links`);
}
