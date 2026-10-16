// Pay and jobs by state for road-adjacent occupations (truck drivers, EMTs), same table as /road-workers/.
// Data: data/road-workers.json (BLS OEWS). One config row per page.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const D = JSON.parse(readFileSync('data/road-workers.json', 'utf8'));
const PAGES = [
  { occ: '533032', slug: 'road-workers/truck-drivers', eyebrow: 'Truck drivers', h1: 'How much do truck drivers make in each state?', who: 'Heavy and tractor-trailer truck drivers', blsUrl: 'https://www.bls.gov/oes/current/oes533032.htm', thanks: 'They move the freight on every interstate. Thank you.', note: 'This counts heavy and tractor-trailer drivers, the jobs that need a commercial driver\'s license. Pay is base wages from employers. Owner-operators who run their own business are not included.' },
  { occ: '292042', slug: 'road-workers/emts', eyebrow: 'EMS', h1: 'How much do EMTs make in each state?', who: 'Emergency medical technicians', blsUrl: 'https://www.bls.gov/oes/current/oes292042.htm', thanks: 'They respond to crashes and get the injured to the hospital. Thank you.', note: 'This counts emergency medical technicians (EMTs). Paramedics are a separate job in BLS data and are not included here. Pay is base wages and does not include overtime.' },
];
const NAMES = { AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', DC: 'District of Columbia', FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming' };
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const $ = n => '$' + Math.round(n).toLocaleString('en-US');
const td = 'style="padding:9px 6px;border-bottom:1px solid #eee;vertical-align:top"', th = 'style="text-align:left;padding:8px 6px;border-bottom:2px solid #E5E5E5"';
const sortJs = readFileSync('gas-prices/index.html', 'utf8').match(/<script>\ndocument\.querySelectorAll\('table\[data-sortable\]'\)[\s\S]*?<\/script>/)[0];
const tpl = readFileSync('what-is-my-mile-marker/index.html', 'utf8');
const headA = tpl.slice(0, tpl.indexOf('  <title>')), headB = tpl.slice(tpl.indexOf('  <link rel="icon"'), tpl.indexOf('  <script type="application/ld+json">')), headC = tpl.slice(tpl.indexOf('  <style>'), tpl.indexOf('  <article class="art">')), tail = tpl.slice(tpl.indexOf('  </article>'));
for (const P of PAGES) {
  const us = D.us[P.occ], year = D.year;
  const rows = Object.entries(D.states).filter(([, v]) => v[P.occ]?.median).map(([st, v]) => ({ name: NAMES[st], ...v[P.occ] })).sort((a, b) => b.median - a.median);
  const top = rows[0], bottom = rows.at(-1);
  const people = us.employment >= 1e6 ? `${(us.employment / 1e6).toFixed(1)} million` : (Math.round(us.employment / 100) * 100).toLocaleString('en-US');
  const lede = `${P.who} in the U.S. earned a median of ${$(us.median)} a year in May ${year}, and about ${people} people do the job. Pay runs from a median of ${$(bottom.median)} in ${bottom.name} to ${$(top.median)} in ${top.name}.`;
  const table = `<div style="overflow-x:auto"><table data-sortable style="width:100%;border-collapse:collapse;font-size:15px;line-height:1.45"><thead><tr><th ${th}>State</th><th ${th}>Median pay</th><th ${th}>Average pay</th><th ${th}>Workers</th></tr></thead><tbody>
${rows.map(r => `<tr><td ${td}>${esc(r.name)}</td><td ${td}>${$(r.median)}</td><td ${td}>${r.mean ? $(r.mean) : '–'}</td><td ${td}>${r.employment ? r.employment.toLocaleString('en-US') : '–'}</td></tr>`).join('\n')}
</tbody></table></div>`;
  const body = `    <p class="lede"><strong>${esc(lede)}</strong></p>
    <p>${esc(P.thanks)}</p>
    <h2>${esc(P.h1)}</h2>
    <p>Sorted by median pay, highest first. Tap a column name to sort by it. The median is the middle of the pay range, so half earn more and half earn less.</p>
${table}
${sortJs}
    <h2>Who is counted?</h2>
    <p>${esc(P.note)}</p>
    <h2>Source</h2>
    <p><a href="${P.blsUrl}" target="_blank" rel="noopener">U.S. Bureau of Labor Statistics, Occupational Employment and Wage Statistics</a>, May ${year} estimates. Updated each spring.</p>
    <h2>More road jobs</h2>
    <ul><li><a href="/road-workers/">How much do highway maintenance workers make in each state?</a></li><li><a href="/road-workers/dot-jobs/">How do you get a job at your state DOT?</a></li>${PAGES.filter(x => x !== P).map(x => `<li><a href="/${x.slug}/">${esc(x.h1)}</a></li>`).join('')}</ul>`;
  const url = `https://milecheckapp.com/${P.slug}/`;
  const desc = `${P.who} earn a median of ${$(us.median)} a year. Pay and number of workers in every state, from the Bureau of Labor Statistics.`;
  const ld = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: [{ '@type': 'Question', name: P.h1, acceptedAnswer: { '@type': 'Answer', text: lede } }] };
  const html = headA + `  <title>${esc(P.h1)} (${year}) | MileCheck</title>\n  <meta name="description" content="${esc(desc)}">\n  <link rel="canonical" href="${url}">\n  <meta property="og:title" content="${esc(P.h1)}">\n  <meta property="og:description" content="${esc(desc)}">\n  <meta property="og:url" content="${url}">\n  <meta property="og:type" content="article">\n` +
    headB.replace(/href="\.\.\//g, 'href="/') + `  <script type="application/ld+json">${JSON.stringify(ld)}</script>\n` + headC.replace(/href="\.\.\//g, 'href="/') +
    `  <article class="art">\n<div class="eyebrow">${esc(P.eyebrow)}</div>\n    <h1>${esc(P.h1)}</h1>\n${body}\n` + tail;
  mkdirSync(P.slug, { recursive: true });
  writeFileSync(`${P.slug}/index.html`, html.replace(/href="\.\.\//g, 'href="/').replace(/src="\.\.\//g, 'src="/'));
  console.log(`${P.slug}: ${rows.length} states, median ${$(us.median)}`);
}
