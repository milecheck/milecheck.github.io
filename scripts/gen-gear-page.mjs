#!/usr/bin/env node
// gen-gear-page.mjs — /gear/: every product the five gear guides recommend, on one page,
// each with its Amazon link and a link back to the guide that explains the pick
// (Leah, 2026-09-28: "the list of our items ... all in one easy spot"). Reads the guides
// so it cannot drift from them. Run after add-amazon-links.mjs.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const GUIDES = [
  ['best-tire-chains-for-mountain-passes', 'Tire chains for mountain passes', 'By wheel-well clearance and how easy they go on.'],
  ['best-winter-car-emergency-kits', 'Winter car emergency kits', 'From the smallest kit that still covers the basics to everything in one box.'],
  ['best-portable-jump-starters', 'Portable jump starters', 'By the size of the engine you actually have.'],
  ['best-portable-tire-inflators', 'Portable tire inflators', 'Cordless, cheap, or tool-brand rugged.'],
  ['best-dash-cams-for-your-car', 'Dash cams', 'Sharpest footage, easiest setup, or footage that survives the camera.'],
  ['best-binoculars-for-mountain-views', 'Binoculars for mountain views', 'One all-around pair, one budget pair, and a tripod adapter.'],
];
const dec = (s) => s.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
const sections = GUIDES.map(([slug, title, sub]) => {
  const s = readFileSync(`${slug}/index.html`, 'utf8');
  const picks = [...s.matchAll(/<div class="pick">([\s\S]*?)<\/div>/g)].map(([, b]) => ({
    tag: (b.match(/<span class="pick-tag">([^<]+)<\/span>/) || [])[1] || '',
    name: (b.match(/<h3>([^<]+)<\/h3>/) || [])[1] || '',
    p: (b.match(/<p>([\s\S]*?)<\/p>/) || [])[1] || '',
    url: (b.match(/<a href="(https:\/\/www\.amazon\.com\/[^"]+)"/) || [])[1] || '',
  })).filter((p) => p.name && p.url);
  if (picks.length !== 3) throw new Error(`${slug}: expected 3 picks, found ${picks.length}`);
  return { slug, title, sub, picks };
});

const rows = sections.map((sec) => `
    <section class="gear-sec" id="${sec.slug}">
      <h2>${sec.title}</h2>
      <p class="gear-sub">${sec.sub} <a href="../${sec.slug}/">Read the guide</a>.</p>
      ${sec.picks.map((p) => `<div class="pick">
        <span class="pick-tag">${p.tag}</span>
        <h3>${p.name}</h3>
        <p>${p.p.replace(/<a href="\.\.\//g, '<a href="../')}</p>
        <p class="pick-buy"><a href="${p.url}" target="_blank" rel="sponsored noopener">See it on Amazon &rarr;</a></p>
      </div>`).join('\n      ')}
    </section>`).join('\n');

const n = sections.reduce((a, s) => a + s.picks.length, 0);
const TITLE = 'Every Gear Pick in One Place | MileCheck';
const DESC = `The ${n} products MileCheck's gear guides recommend, on one page: tire chains, winter kits, jump starters, tire inflators and dash cams, each with a link to the guide that explains the pick.`;
const ld = JSON.stringify({ '@context': 'https://schema.org', '@type': 'ItemList', name: 'MileCheck gear picks', numberOfItems: n,
  itemListElement: sections.flatMap((s) => s.picks).map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: dec(p.name), url: p.url })) });
const bc = JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
  { '@type': 'ListItem', position: 1, name: 'MileCheck', item: 'https://milecheckapp.com/' }, { '@type': 'ListItem', position: 2, name: 'Gear', item: 'https://milecheckapp.com/gear/' }] });
const tpl = readFileSync('best-portable-jump-starters/index.html', 'utf8');
const head = tpl.slice(0, tpl.indexOf('<body>'));
const headOut = head
  .replace(/<title>[^<]*<\/title>/, `<title>${TITLE}</title>`)
  .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${DESC}">`)
  .replace(/https:\/\/milecheckapp\.com\/best-portable-jump-starters\//g, 'https://milecheckapp.com/gear/')
  .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${TITLE}">`)
  .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${DESC}">`)
  .replace(/<script type="application\/ld\+json">\{"@context":"https:\/\/schema\.org","@type":"FAQPage"[\s\S]*?<\/script>\n/, '')
  .replace(/<script type="application\/ld\+json">\{"@context":"https:\/\/schema\.org","@type":"Article"[\s\S]*?<\/script>/, `<script type="application/ld+json">${ld}</script>`)
  .replace(/<script type="application\/ld\+json">\{"@context":"https:\/\/schema\.org","@type":"BreadcrumbList"[\s\S]*?<\/script>/, `<script type="application/ld+json">${bc}</script>`)
  .replace('  <style>', `  <style>\n    .gear-sec{margin-top:34px;}\n    .gear-sub{color:#5b6670;font-size:15px;margin:0 0 12px;}\n    .gear-toc{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 6px;}\n    .gear-toc a{display:inline-block;border:1px solid #E5E5E5;border-radius:999px;padding:6px 12px;font-size:13.5px;font-weight:700;color:#0E1116;text-decoration:none;}\n    .gear-toc a:hover{border-color:#0E1116;}`);
const header = tpl.slice(tpl.indexOf('<body>'), tpl.indexOf('<article class="art">'));
const footer = tpl.slice(tpl.indexOf('<footer class="site-footer">')).replace(/ct=best-portable-jump-starters/g, 'ct=gear').replace(/utm_campaign%3Dbest-portable-jump-starters/g, 'utm_campaign%3Dgear')
  .replace(/<p class="footer-label">Learn more<\/p>\s*<ul class="footer-list">[\s\S]*?<\/ul>/, `<p class="footer-label">Gear guides</p>\n          <ul class="footer-list">\n${GUIDES.map(([s, t]) => `            <li><a href="../${s}/">${t}</a></li>`).join('\n')}\n          </ul>`);
const spon = tpl.slice(tpl.indexOf('<!-- spon:start -->'), tpl.indexOf('<!-- spon:end -->') + '<!-- spon:end -->'.length).replace('basics:best-portable-jump-starters', 'basics:gear');
const body = `<article class="art">
    ${spon}
<div class="eyebrow">Gear</div>
    <h1>Every gear pick, on one page</h1>
    <p class="lede">The ${n} products our guides recommend for the trunk, the glovebox and the windshield. Each one links to the guide that explains why it made the list, and to Amazon. Nothing here is required to use MileCheck.</p>
    <nav class="gear-toc" aria-label="Sections">${sections.map((s) => `<a href="#${s.slug}">${s.title}</a>`).join('')}</nav>
${rows}

    <div class="cta">
      <h3>Know exactly where you are &mdash; live</h3>
      <p>Your mile marker shows even offline. Live state DOT feeds and the nearest camera on your route are part of MileCheck Premium and need a connection to update. Runs on CarPlay and Android Auto.</p>
      <div class="btns">
        <a class="primary" href="https://apps.apple.com/app/apple-store/id6759212851?pt=128447811&ct=gear&mt=8" target="_blank" rel="noopener">iOS App Store</a>
        <a class="ghost" href="https://play.google.com/store/apps/details?id=app.milecheck.mobile&referrer=utm_source%3Dmilecheckapp.com%26utm_medium%3Dweb%26utm_campaign%3Dgear" target="_blank" rel="noopener">Google Play</a>
      </div>
    </div>

    <p class="g-related">How the links work: MileCheck is an Amazon Associate. If you buy through a link on this page, Amazon pays MileCheck a commission. Your price does not change. Picks are chosen for the guide first and the link second.</p>
    <p class="g-related">Related: <a href="../winter-car-prep-checklist/">Winter car prep checklist</a> · <a href="../chains-required-explained/">What "chains required" means</a> · <a href="../hit-a-deer-what-to-do/">If you hit a deer</a></p>
  </article>

  `;
mkdirSync('gear', { recursive: true });
writeFileSync('gear/index.html', headOut + header + body + footer);
console.log('gear/index.html', n, 'picks');
