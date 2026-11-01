#!/usr/bin/env node
// gen-chains-required-pages.mjs — "Are chains required on <pass> today?" pages for Snoqualmie, Stevens and Mt Hood (2026-11-01).
// Why: Search Console showed no chain-required page for these three, and the pass pages only mention chains in an FAQ.
// Shell borrowed from /what-is-my-mile-marker/ like gen-chains-by-pass.mjs. Rules text is the sourced WSDOT and ODOT text already on
// the site (scripts/passes/snoqualmie-reference.cjs, /chain-laws/oregon/). The live reading is baked by scripts/bake-pass-status.mjs.
// Run: node scripts/gen-chains-required-pages.mjs && node scripts/bake-pass-status.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const REF = require('./passes/snoqualmie-reference.cjs');
const D = JSON.parse(readFileSync('data/chains-by-pass.json', 'utf8'));
const tpl = readFileSync('what-is-my-mile-marker/index.html', 'utf8');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const headA = tpl.slice(0, tpl.indexOf('  <title>'));
const headB = tpl.slice(tpl.indexOf('  <link rel="icon"'), tpl.indexOf('  <script type="application/ld+json">'));
const headC = tpl.slice(tpl.indexOf('  <style>'), tpl.indexOf('  <article class="art'));
const tail = tpl.slice(tpl.indexOf('  </article>'));
const TABLE_CSS = `  <style>.seg-table{overflow-x:auto;margin:10px 0}.seg-table table{border-collapse:collapse;width:100%;min-width:560px;font-size:14px}.seg-table th,.seg-table td{border:1px solid #E5E5E5;padding:8px 10px;text-align:left;vertical-align:top;color:#3a444d}.seg-table th{background:#f6f8f7;color:#0E1116}.seg-src{font-size:13px;color:#5b6670}</style>\n`;
const wsLines = REF.segs[0].html;
const wsRules = REF.segs[1].html;
const hoursFor = (name) => D.passes.find(p => p.name === name);
const MON = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const asOfTxt = (() => { const m = D.asOf.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2})/); return `${MON[+m[2]]} ${+m[3]}`; })();
const fromTxt = (() => { const m = D.from.match(/^(\d{4})-(\d{2})-(\d{2})/); return `${MON[+m[2]]} ${+m[3]}`; })();
const SRC_OREGON = '<p class="seg-src">Sources: <a href="https://www.oregon.gov/odot/pages/winter-commercial-vehicles.aspx" target="_blank" rel="noopener">ODOT winter commercial vehicles</a>, <a href="https://tripcheck.com/Pages/Chain-Requirements" target="_blank" rel="noopener">TripCheck chain requirements</a>, ORS 815.140 and 153.019. Official pages read October 15, 2026.</p>';

const PAGES = [
  {
    slug: 'chains-required-snoqualmie-pass', pass: 'snoqualmie', name: 'Snoqualmie Pass', route: 'I-90',
    h1: 'Are chains required on Snoqualmie Pass today?',
    desc: 'WSDOT’s traction tire and chain lines for Snoqualmie Pass on I-90, what each means for a car, an AWD car and a truck, the $500 fine, and the hours chains were advised this fall.',
    lede: 'Only when WSDOT’s restriction line for your direction says so. The line changes through the day, so read it again before you start the climb.',
    stat: hoursFor('Snoqualmie Pass I-90'),
    body: () => `
    <!-- passnow:start --><!-- passnow:end -->
    <h2>What each WSDOT line means</h2>
    ${wsLines}
    <h2>The tire and chain rules in Washington</h2>
    ${wsRules}
    <h2>Where to put chains on</h2>
    ${REF.segs[3].html || '<p>' + REF.segs[3].p + '</p>'}
    <h2>If the pass is closed</h2>
    ${REF.segs[4].html || '<p>' + REF.segs[4].p + '</p>'}`,
    links: [['/passes/snoqualmie/', 'Snoqualmie Pass road conditions and webcams today'], ['/chain-laws/washington/', 'Do I need chains in Washington?'], ['/how-often-are-chains-required-on-washington-passes/', 'How often are chains required on Washington passes?'], ['/road-conditions/washington/', 'Washington road conditions: snow, ice and chains now'], ['/passes/stevens/', 'Stevens Pass'], ['/chains-or-all-season-tires/', 'Chains or all-season tires?']],
    faq: [
      ['Are chains required on Snoqualmie Pass right now?', 'Read the live line at the top of this page, then WSDOT’s own pass report for your direction. The line can change within the hour.'],
      ...REF.faq.filter(f => /Do I need chains|without snow tires/.test(f[0])).map(f => [f[0], f[1].replace(/<[^>]+>/g, '')]),
    ],
  },
  {
    slug: 'chains-required-stevens-pass', pass: 'stevens', name: 'Stevens Pass', route: 'US-2',
    h1: 'Are chains required on Stevens Pass today?',
    desc: 'WSDOT’s traction tire and chain lines for Stevens Pass on US 2, what each means for a car, an AWD car and a truck, the $500 fine, and the hours chains were advised this fall.',
    lede: 'Only when WSDOT’s restriction line for the pass says so. Stevens is higher than Snoqualmie, and the line changes fast in a storm.',
    stat: hoursFor('Stevens Pass US 2'),
    body: () => `
    <!-- passnow:start --><!-- passnow:end -->
    <h2>What each WSDOT line means</h2>
    ${wsLines.replace('Read the eastbound and westbound lines separately. The rule shown for your direction controls.', 'Where WSDOT lists a direction, read yours. The rule shown for your direction controls.')}
    <h2>The tire and chain rules in Washington</h2>
    ${wsRules.replace(/ For vehicles over 10,000 lb GVWR, state rules require sufficient chains[^<]*?The installation pattern depends on the axles and trailer\./, ' Vehicles over 10,000 lb GVWR follow WSDOT’s separate commercial chain requirements.')}
    <h2>Why Stevens needs a second look</h2>
    <p>The summit is 4,061 feet on US 2. US 2 over the summit closes for avalanche control and heavy snow, and the ski area sits at the top, so a chain requirement on a weekend can mean a slow line of traffic. The cameras and closures are on the <a href="/passes/stevens/">Stevens Pass page</a>.</p>`,
    links: [['/passes/stevens/', 'Stevens Pass road conditions today'], ['/chain-laws/washington/', 'Do I need chains in Washington?'], ['/how-often-are-chains-required-on-washington-passes/', 'How often are chains required on Washington passes?'], ['/road-conditions/washington/', 'Washington road conditions: snow, ice and chains now'], ['/passes/snoqualmie/', 'Snoqualmie Pass'], ['/chains-required-snoqualmie-pass/', 'Are chains required on Snoqualmie Pass?']],
    faq: [
      ['Are chains required on Stevens Pass right now?', 'Read the live line at the top of this page, then WSDOT’s own pass report. The line can change within the hour.'],
      ['Does AWD get me out of the chain requirement on Stevens Pass?', 'Only for the line that says chains are required on all vehicles except all-wheel drive, and only if all wheels are engaged, approved traction devices are fitted, and chains for at least one set of drive tires are carried. When the sign says chains are required on all vehicles, AWD must install them too. Source: WAC 204-24-050.'],
    ],
  },
  {
    slug: 'chains-required-mt-hood', pass: 'mt-hood', name: 'Mt Hood', route: 'US-26',
    h1: 'Are chains required to drive to Mt Hood today?',
    desc: 'How Oregon posts chain and traction requirements on US 26 through Government Camp and OR 35 toward Mt Hood, the fines, and where to read the current requirement.',
    lede: 'Only when the sign or TripCheck says so. Oregon posts chain requirements by sign in snow zones and has no fixed dates.',
    stat: null,
    body: () => `
    <!-- passnow:start --><!-- passnow:end -->
    <h2>How Oregon posts it</h2>
    <p>Oregon posts chain requirements by sign in snow zones. There are no fixed dates. TripCheck lists the current requirement by highway, for passenger vehicles and for trucks. The sign on the road is the rule that applies. The route to the mountain runs on US 26 through Government Camp, and OR 35 over Bennett Pass reaches Mt Hood Meadows.</p>
    <h2>The levels</h2>
    <ul>
      <li><strong>Chains required on vehicles towing or over 10,000 GVW.</strong> Vehicles over 10,000 lb GVW and vehicles towing must use chains. Trailers must also be chained when required.</li>
      <li><strong>Chains required on vehicles towing or single drive axles over 10,000 GVW.</strong> Vehicles over 10,000 lb GVW with a single drive axle must use chains. Tandem-drive-axle vehicles are not covered by this specific restriction. Other posted requirements may apply.</li>
    </ul>
    <h2>Carrying chains and the fines</h2>
    <p>Vehicles over 10,000 lb GVW must carry chains whenever road conditions might require their use, or when Snow Zone signs are posted. Not using required chains or traction tires is a Class C traffic violation with a presumptive fine of $165. For vehicles registered under ORS chapter 826, mostly commercial trucks, it is a specific-fine violation with an $880 presumptive fine. Not carrying required chains is a separate Class C violation.</p>
    ${SRC_OREGON}
    <p>Fines and rules change, and the official page is the record.</p>`,
    links: [['/passes/mt-hood/', 'US 26 to Mt Hood: road conditions and cameras today'], ['/chain-laws/oregon/', 'Do I need chains in Oregon?'], ['/road-conditions/oregon/', 'Oregon road conditions: snow, ice and chains now'], ['/mountains/hood/roads/', 'Mount Hood roads'], ['/chains-or-all-season-tires/', 'Chains or all-season tires?']].filter(([h]) => { try { readFileSync(h.slice(1) + 'index.html'); return true; } catch { return false; } }),
    faq: [
      ['Are chains required to drive to Mt Hood right now?', 'Read the sign on US 26 or OR 35 and the TripCheck requirement for your highway. The live line at the top of this page shows what the ODOT feed has, when it has anything.'],
      ['What is the fine for ignoring a chain rule in Oregon?', 'Not using required chains or traction tires is a Class C traffic violation with a presumptive fine of $165. Commercial trucks registered under ORS chapter 826 face a presumptive fine of $880.'],
    ],
  },
];

for (const P of PAGES) {
  const PATH = `/${P.slug}/`, URL = `https://milecheckapp.com${PATH}`;
  const stat = P.stat ? `<h2>How often this fall</h2>
    <p>From ${esc(fromTxt)} through ${esc(asOfTxt)}, MileCheck saved WSDOT’s ${esc(P.name)} report every hour. Traction tires were advised for ${P.stat.advised} hours, required for ${P.stat.required} hours and the pass was listed closed for ${P.stat.closed} hours. This is a count of past hours and one early storm. See <a href="/how-often-are-chains-required-on-washington-passes/">all Washington passes</a>.</p>` : '';
  const faq = P.faq;
  const ld = [
    { '@context': 'https://schema.org', '@type': 'Article', headline: P.h1, datePublished: '2026-11-01', dateModified: '2026-11-01', mainEntityOfPage: URL, author: { '@type': 'Organization', name: 'MileCheck' }, publisher: { '@type': 'Organization', name: 'MileCheck' } },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
  ];
  const title = `${P.h1} | MileCheck`;
  const body = `    <p class="lede"><strong>${esc(P.lede)}</strong></p>${P.body()}
    ${stat}
    <h2>Questions</h2>
${faq.map(([q, a]) => `    <h3>${esc(q)}</h3>\n    <p>${esc(a)}</p>`).join('\n')}
    <h2>More</h2>
    <ul>
${P.links.map(([h, t]) => `      <li><a href="${h}">${esc(t)}</a></li>`).join('\n')}
    </ul>`;
  const html = headA + `  <title>${esc(title)}</title>\n  <meta name="description" content="${esc(P.desc)}">\n  <link rel="canonical" href="${URL}">\n` +
    `  <meta property="og:title" content="${esc(P.h1)}">\n  <meta property="og:description" content="${esc(P.desc)}">\n  <meta property="og:url" content="${URL}">\n  <meta property="og:type" content="article">\n` +
    headB.replace(/href="\.\.\//g, 'href="/') + `  <script type="application/ld+json">${JSON.stringify(ld[0])}</script>\n  <script type="application/ld+json">${JSON.stringify(ld[1])}</script>\n` + TABLE_CSS +
    headC.replace(/href="\.\.\//g, 'href="/') + `  <article class="art journey-content">\n<div class="eyebrow">Chain laws</div>\n    <h1>${esc(P.h1)}</h1>\n${body}\n` + tail;
  mkdirSync(PATH.slice(1), { recursive: true });
  writeFileSync(PATH.slice(1) + 'index.html', html.replace(/href="\.\.\//g, 'href="/').replace(/src="\.\.\//g, 'src="/'));
  console.log(`wrote ${PATH}`);
}
