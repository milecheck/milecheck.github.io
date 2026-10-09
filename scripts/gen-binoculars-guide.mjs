#!/usr/bin/env node
// gen-binoculars-guide.mjs — /best-binoculars-for-mountain-views/, the gear guide the
// /mountains/ pages point to (TODO 2026-09-26, built 2026-10-08). Built from the jump-starter
// guide's head, header and footer so it matches the other guides. Specs are from retailer
// spec sheets checked 2026-10-08; links are Amazon search links like add-amazon-links.mjs.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const SLUG = 'best-binoculars-for-mountain-views';
const URL = `https://milecheckapp.com/${SLUG}/`;
const TITLE = 'Best Binoculars for Mountain Views | MileCheck';
const H1 = 'Binoculars for mountain views, and a way to hold them still';
const DESC = 'Two 10x42 binoculars for seeing a far summit, one all-around and one budget, plus a tripod adapter for when the view shakes.';
const TAG = 'trailapps-20';
const amz = (q) => `https://www.amazon.com/s?k=${encodeURIComponent(q).replace(/%20/g, '+')}&tag=${TAG}`;
const NOTE = '<p class="aff-note">MileCheck earns a commission if you buy through this link. The price is the same for you.</p>';
const pick = (h2, tag, name, text) => `
    <h2>${h2}</h2>
    <div class="pick">
      <span class="pick-tag">${tag}</span>
      <h3>${name}</h3>
      <p>${text}</p>
      <p class="pick-buy"><a href="${amz(name)}" target="_blank" rel="sponsored noopener">See it on Amazon &rarr;</a></p>
      ${NOTE}
    </div>`;

const body = `
<div class="eyebrow">Gear guide</div>
    <h1>${H1}</h1>
    <p class="lede">At 10x, a summit 60 miles off looks like it sits 6 miles away. The catch is holding 10x still by hand. Two binoculars below, and the adapter that fixes the shake.</p>
${pick('If you want one pair that does it all', 'Best all-around', 'Vortex Diamondback HD 10x42',
  '10x magnification with 42 mm lenses and a 330-foot field of view at 1,000 yards. About 21 ounces. Waterproof, and argon-purged so the lenses don&#39;t fog inside on a cold morning.')}
${pick('If you want to spend less', 'Budget', 'Celestron Nature DX 10x42',
  'The same 10x42 format for less. A 304-foot field of view at 1,000 yards, waterproof and nitrogen-purged. About 22 ounces.')}
${pick('If the view shakes', 'Steady view', 'Vortex Uni-Daptor tripod adapter',
  'At 10x, small hand movements blur the summit. This adapter puts binoculars with a tripod socket on a tripod, and it releases quickly when you want them back in your hands. Check that your binoculars have a tripod socket before you order.')}

    <h2>Clear air matters more than glass</h2>
    <p>Haze, smoke and cloud hide a peak no matter what you look through. <a href="/mountains/">Check the visibility forecast</a> before you go.</p>
`;

const tpl = readFileSync('best-portable-jump-starters/index.html', 'utf8');
const ld = JSON.stringify({ '@context': 'https://schema.org', '@type': 'Article', headline: H1, description: DESC, url: URL,
  author: { '@type': 'Organization', name: 'MileCheck' }, publisher: { '@type': 'Organization', name: 'MileCheck' }, dateModified: '2026-10-08' });
const bc = JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
  { '@type': 'ListItem', position: 1, name: 'MileCheck', item: 'https://milecheckapp.com/' },
  { '@type': 'ListItem', position: 2, name: 'Binoculars for mountain views', item: URL }] });
let head = tpl.slice(0, tpl.indexOf('<body>'))
  .replace(/<title>[^<]*<\/title>/, `<title>${TITLE}</title>`)
  .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${DESC}">`)
  .replace(/https:\/\/milecheckapp\.com\/best-portable-jump-starters\//g, URL)
  .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${TITLE}">`)
  .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${DESC}">`)
  .replace(/<meta name="twitter:title" content="[^"]*">/, `<meta name="twitter:title" content="${TITLE}">`)
  .replace(/<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${DESC}">`)
  .replace(/<script type="application\/ld\+json">\{"@context":"https:\/\/schema\.org","@type":"FAQPage"[\s\S]*?<\/script>\n?/, '')
  .replace(/<script type="application\/ld\+json">\{"@context":"https:\/\/schema\.org","@type":"Article"[\s\S]*?<\/script>/, `<script type="application/ld+json">${ld}</script>`)
  .replace(/<script type="application\/ld\+json">\{"@context":"https:\/\/schema\.org","@type":"BreadcrumbList"[\s\S]*?<\/script>/, `<script type="application/ld+json">${bc}</script>`);
const header = tpl.slice(tpl.indexOf('<body>'), tpl.indexOf('<article class="art">'));
const footer = tpl.slice(tpl.indexOf('<footer class="site-footer">'))
  .replace(/ct=best-portable-jump-starters/g, `ct=${SLUG}`).replace(/utm_campaign%3Dbest-portable-jump-starters/g, `utm_campaign%3D${SLUG}`);
const out = `${head}${header}<article class="art">\n${body}\n  </article>\n\n  ${footer}`;
mkdirSync(SLUG, { recursive: true });
writeFileSync(`${SLUG}/index.html`, out);
console.log(`${SLUG}/index.html written`);
