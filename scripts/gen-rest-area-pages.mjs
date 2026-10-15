// Rest-area overnight rule pages: /rest-areas/ hub + one page per state with a CONFIRMED rule.
// Data: data/rest-area-rules.json (only rules read on an official page). Shell borrowed from
// /what-is-my-mile-marker/ so header, nav, footer and styles match the site.
// Run, then node scripts/finish-pages.mjs --pages-only for the add-on blocks.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
const data = JSON.parse(readFileSync('data/rest-area-rules.json', 'utf8'));
const tpl = readFileSync('what-is-my-mile-marker/index.html', 'utf8');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const headA = tpl.slice(0, tpl.indexOf('  <title>'));
const headB = tpl.slice(tpl.indexOf('  <link rel="icon"'), tpl.indexOf('  <script type="application/ld+json">'));
const headC = tpl.slice(tpl.indexOf('  <style>'), tpl.indexOf('  <article class="art">'));
const tail = tpl.slice(tpl.indexOf('  </article>'));
const readDate = 'October 15, 2026';
function page({ path, title, desc, h1, body, ld }) {
  const url = `https://milecheckapp.com${path}`;
  const html = headA +
    `  <title>${esc(title)}</title>\n  <meta name="description" content="${esc(desc)}">\n  <link rel="canonical" href="${url}">\n` +
    `  <meta property="og:title" content="${esc(h1)}">\n  <meta property="og:description" content="${esc(desc)}">\n  <meta property="og:url" content="${url}">\n  <meta property="og:type" content="article">\n` +
    headB.replace(/href="\.\.\//g, 'href="/') +
    `  <script type="application/ld+json">${JSON.stringify(ld)}</script>\n` +
    headC.replace(/href="\.\.\//g, 'href="/') +
    `  <article class="art">\n<div class="eyebrow">Rest areas</div>\n    <h1>${esc(h1)}</h1>\n${body}\n` + tail;
  const dir = path.replace(/^\//, '');
  mkdirSync(dir, { recursive: true });
  writeFileSync(dir + 'index.html', html.replace(/href="\.\.\//g, 'href="/').replace(/src="\.\.\//g, 'src="/'));
}
const links = s => {
  const out = [];
  if (existsSync(`road-conditions/${s.slug}/index.html`)) out.push(`<a href="/road-conditions/${s.slug}/">${esc(s.name)} road conditions</a>`);
  if (existsSync(`cameras/${s.slug}/index.html`)) out.push(`<a href="/cameras/${s.slug}/">${esc(s.name)} highway cameras</a>`);
  out.push(`<a href="/what-mile-marker-am-i-at/">What mile marker am I at?</a>`);
  return out.map(a => `<li>${a}</li>`).join('');
};
for (const s of data.states) {
  const q = `Can you sleep at a rest area in ${s.name}?`;
  const body = `    <p class="lede"><strong>${esc(s.answer)}</strong></p>
    <h2>Cars</h2><p>${esc(s.cars)}</p>
    <h2>Trucks</h2><p>${esc(s.trucks)}</p>
    <h2>Camping and tents</h2><p>${esc(s.camping)}</p>
    <p>Signs at a rest area can set a different limit. Follow the posted sign. Turnpike and toll-road service plazas often have their own rules.</p>
    <h2>Source</h2><p><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.source)}</a>. Read ${readDate}. This page summarizes the rule. It is not legal advice.</p>
    <h2>Before you stop</h2><ul>${links(s)}</ul>
    <p><a href="/rest-areas/">Rest area rules in other states</a></p>`;
  page({ path: `/rest-areas/${s.slug}/`, title: `${q} | MileCheck`, desc: `${s.answer} The official ${s.name} rule for cars, trucks and camping, with its source.`, h1: q, body,
    ld: { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: [{ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: `${s.answer} ${s.cars} Source: ${s.source}.` } }] } });
}
const rows = data.states.map(s => `<tr><td><a href="/rest-areas/${s.slug}/">${esc(s.name)}</a></td><td>${esc(s.answer)}</td></tr>`).join('\n');
page({ path: '/rest-areas/', title: 'Can you sleep at a rest area? Rules by state | MileCheck', desc: 'Official rest area time limits and overnight rules by state, with the source for each.', h1: 'Can you sleep at a rest area? Rules by state',
  body: `    <p class="lede">Each state sets its own rest area rules. Below are the states where we confirmed the rule on an official government page. Signs at a rest area can set a different limit.</p>
    <table style="width:100%;border-collapse:collapse;font-size:15px;line-height:1.5"><thead><tr><th style="text-align:left;padding:8px 6px;border-bottom:2px solid #E5E5E5">State</th><th style="text-align:left;padding:8px 6px;border-bottom:2px solid #E5E5E5">Short answer</th></tr></thead><tbody>
${rows.replace(/<td>/g, '<td style="padding:10px 6px;border-bottom:1px solid #eee;vertical-align:top">')}
</tbody></table>
    <p>States not listed: we haven't confirmed a statewide rule on an official page yet. Read ${readDate}. Not legal advice.</p>`,
  ld: { '@context': 'https://schema.org', '@type': 'WebPage', name: 'Can you sleep at a rest area? Rules by state', url: 'https://milecheckapp.com/rest-areas/' } });
console.log(`rest areas: ${data.states.length} state pages + hub`);
