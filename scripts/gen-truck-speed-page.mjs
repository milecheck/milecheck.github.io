#!/usr/bin/env node
// gen-truck-speed-page.mjs — /truck-speed-limits-by-state/ (2026-11-01). Source: data/truck-rules-by-state-2026-11-01.json (competitor research
// session, official pages read 2026-11-01). Only states whose truck-speed field is VERIFIED on an official page are stated. Arkansas is secondary only,
// and West Virginia has a statute/DMV conflict, so both go in the "not stated" list. Shell from /what-is-my-mile-marker/ like gen-chains-required-pages.mjs.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const D = JSON.parse(readFileSync('data/truck-rules-by-state-2026-11-01.json', 'utf8'));
const tpl = readFileSync('what-is-my-mile-marker/index.html', 'utf8');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const headA = tpl.slice(0, tpl.indexOf('  <title>'));
const headB = tpl.slice(tpl.indexOf('  <link rel="icon"'), tpl.indexOf('  <script type="application/ld+json">'));
const headC = tpl.slice(tpl.indexOf('  <style>'), tpl.indexOf('  <article class="art'));
const tail = tpl.slice(tpl.indexOf('  </article>'));
const PATH = '/truck-speed-limits-by-state/', URL = `https://milecheckapp.com${PATH}`;
// The research file's differs flag was wrong for Virginia (its own text says trucks 45 vs cars 55 on other highways), so the list is read from the
// text, not the flag. A "same as cars" list is NOT published: one wrong flag would be a false claim about a state.
// WA (RCW 46.61.410) and MI (MCL 257.627) weight thresholds read on the official pages 2026-11-01. Indiana's threshold was not readable (the statute site refused the request), so its row points to the source.
const OVERRIDE = {
  WA: { car: 'Set by the Secretary of Transportation, up to 75 on rural interstates where posted.', truck: '60 for vehicles over 10,000 lb gross weight and for combination vehicles, excluding auto stages.' },
  MI: { car: '70 on limited access freeways (75 on freeway segments raised after engineering and safety studies).', truck: '65 for school buses, trucks of 10,000 lb gross weight or more, truck-tractors and combinations, where the posted limit is above 65.' },
  IN: { car: '70', truck: '65 for heavier trucks. The statute sets a weight threshold, so read the source before you rely on this row.' },
  VA: { car: '70 maximum where posted on interstates. 55 on certain other highways.', truck: '70 on interstates, with no lower truck limit there. 45 for specified trucks and combinations on those other highways.' } };
const lower = D.filter(x => x.truckSpeed.status === 'verified' && (x.truckSpeed.differs === true || OVERRIDE[x.code])).map(x => OVERRIDE[x.code] ? { ...x, truckSpeed: { ...x.truckSpeed, ...OVERRIDE[x.code] } } : x);
const names = a => a.map(x => x.name).join(', ');
const list = a => a.length <= 1 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
const rows = lower.map(x => `<tr><td style="padding:10px 6px;border-bottom:1px solid #eee;vertical-align:top"><strong>${esc(x.name)}</strong></td><td style="padding:10px 6px;border-bottom:1px solid #eee;vertical-align:top">${esc(x.truckSpeed.car)}</td><td style="padding:10px 6px;border-bottom:1px solid #eee;vertical-align:top">${esc(x.truckSpeed.truck)}</td><td style="padding:10px 6px;border-bottom:1px solid #eee;vertical-align:top"><a href="${esc(x.truckSpeed.source)}" target="_blank" rel="noopener">Official source</a></td></tr>`).join('\n');
const h1 = 'Which states have a lower speed limit for trucks?';
const lede = `${list(lower.map(x => x.name))} set a lower speed limit for trucks than for cars on at least some highways, by the official pages in the table. This is not a list of every state. We make no claim about a state that is not on it.`;
const faq = [
  ['Which states have a lower speed limit for trucks?', `${list(lower.map(x => x.name))}, by the official pages in the table. The limits differ by road and vehicle weight, so read the row for your state.`],
  ['Does my state have a lower speed limit for trucks if it is not listed?', 'This page does not say. It lists only states where an official page we read states a lower truck limit. Check your state\'s statute or DOT page.'],
  ['Is the posted sign or this table the rule?', 'The posted sign. This table states statutes and agency pages read on November 1, 2026. Speed limits change, and the official page is the record.'],
];
const ld = [
  { '@context': 'https://schema.org', '@type': 'Article', headline: h1, datePublished: '2026-11-01', dateModified: '2026-11-01', mainEntityOfPage: URL, author: { '@type': 'Organization', name: 'MileCheck' }, publisher: { '@type': 'Organization', name: 'MileCheck' } },
  { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
];
const body = `    <p class="lede"><strong>${esc(lede)}</strong></p>
    <h2>The states with a lower truck limit</h2>
    <div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:15px;line-height:1.5;min-width:640px"><thead><tr><th style="text-align:left;padding:8px 6px;border-bottom:2px solid #E5E5E5">State</th><th style="text-align:left;padding:8px 6px;border-bottom:2px solid #E5E5E5">Cars</th><th style="text-align:left;padding:8px 6px;border-bottom:2px solid #E5E5E5">Trucks</th><th style="text-align:left;padding:8px 6px;border-bottom:2px solid #E5E5E5">Source</th></tr></thead><tbody>
${rows}
</tbody></table></div>
    <p>Each source is a statute, a state agency page or a state driver manual, read on November 1, 2026. Local posted limits can be lower than the numbers here.</p>
    <h2>What this page does not say</h2>
    <p>A state that is not in the table may still set a lower limit for trucks on some roads. We have not verified every state, so we do not say trucks follow the car limit anywhere. Posted signs set the limit on a segment.</p>
    <h2>Questions</h2>
${faq.map(([q, a]) => `    <h3>${esc(q)}</h3>\n    <p>${esc(a)}</p>`).join('\n')}
    <h2>More</h2>
    <ul>
      <li><a href="/move-over-laws/">Move over laws by state</a></li>
      <li><a href="/driving-a-car-vs-a-truck/">Driving a car versus a truck</a></li>
      <li><a href="/chain-laws/">Chain and traction laws by state</a></li>
      <li><a href="/rest-areas/">Rest area rules by state</a></li>
    </ul>`;
const title = `${h1} | MileCheck`;
const desc = `${list(lower.map(x => x.name))} set a lower speed limit for trucks. The limits, and the official page for each, read November 1, 2026.`.slice(0, 300);
const html = headA + `  <title>${esc(title)}</title>\n  <meta name="description" content="${esc(desc)}">\n  <link rel="canonical" href="${URL}">\n` +
  `  <meta property="og:title" content="${esc(h1)}">\n  <meta property="og:description" content="${esc(desc)}">\n  <meta property="og:url" content="${URL}">\n  <meta property="og:type" content="article">\n` +
  headB.replace(/href="\.\.\//g, 'href="/') + `  <script type="application/ld+json">${JSON.stringify(ld[0])}</script>\n  <script type="application/ld+json">${JSON.stringify(ld[1])}</script>\n` +
  headC.replace(/href="\.\.\//g, 'href="/') + `  <article class="art journey-content">\n<div class="eyebrow">Truck rules</div>\n    <h1>${esc(h1)}</h1>\n${body}\n` + tail;
mkdirSync(PATH.slice(1), { recursive: true });
writeFileSync(PATH.slice(1) + 'index.html', html.replace(/href="\.\.\//g, 'href="/').replace(/src="\.\.\//g, 'src="/'));
console.log(`wrote ${PATH}: ${lower.length} states in the table`);
