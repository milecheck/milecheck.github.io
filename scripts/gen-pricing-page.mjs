#!/usr/bin/env node
// gen-pricing-page.mjs — /pricing/ (2026-10-30). One plain page for "how much does MileCheck cost".
// Prices come from here and nowhere else on this page; if a store price changes, change PRICES, run
// scripts/flip-pricing-*.mjs style sweeps for the other pages (see feedback_price_change_sweep).
// Built from the head, nav, values block and footer of /api/plan/ so it follows the site template.
//   node scripts/gen-pricing-page.mjs     then     node scripts/finish-pages.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const tpl = readFileSync(resolve(ROOT, 'api/plan/index.html'), 'utf8');
const PRICES = { annual: 19.99, monthly: 4.99, trial: '2-week' };
const twelveMonthly = +(PRICES.monthly * 12).toFixed(2); // 59.88
const money = (n) => '$' + n.toFixed(2);
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const TITLE = 'How much does MileCheck cost?';
const DESC = `Your mile marker is always free. Premium is ${money(PRICES.annual)} a year or ${money(PRICES.monthly)} a month, with a ${PRICES.trial} free trial. Early subscribers keep their price.`;
const URL = 'https://milecheckapp.com/pricing/';

const faq = [
  ['What do I get without paying?', 'Your current mile marker, offline in all 50 states, and CarPlay and Android Auto. That stays free.'],
  ['What does Premium add?', 'The live map, alerts from state DOT feeds, alerts on your planned route, route planning, cameras, and trip logging with CSV export.'],
  ['How long is the trial?', `${PRICES.trial[0].toUpperCase()}${PRICES.trial.slice(1)}. You can cancel any time before it ends in your App Store or Google Play subscription settings and you are not charged.`],
  ['Do I pay more if I started earlier?', 'No. People who subscribed at an earlier price keep that price.'],
  ['Is there a plan for companies?', 'Yes. Fleet, dispatch and software teams buy the API and data licenses instead. See the plans for businesses.'],
];

const body = `
<section class="api-hero" style="max-width:820px;margin:0 auto">
  <div class="eyebrow">MileCheck</div>
  <h1>${TITLE}</h1>
  <p class="value" style="max-width:62ch">Your mile marker is always free. Premium adds the live map, state DOT feeds on your route, route planning and trip tools.</p>
</section>
<section class="api-section" style="max-width:820px;margin:0 auto">
  <div class="three">
    <div class="ep-card"><p class="ep-label">Free</p><div style="font-size:30px;font-weight:800">$0</div>
      <ul style="margin:8px 0 0;padding-left:20px;list-style:disc;line-height:1.6"><li>Your nearest mile marker, to one decimal</li><li>Works offline in all 50 states</li><li>CarPlay and Android Auto</li><li>Speed, heading and weather</li></ul></div>
    <div class="ep-card" style="border-color:#0f7a4f"><p class="ep-label">Premium, annual</p><div style="font-size:30px;font-weight:800">${money(PRICES.annual)}<small style="font-size:15px;font-weight:600">/yr</small></div>
      <ul style="margin:8px 0 0;padding-left:20px;list-style:disc;line-height:1.6"><li>Everything in Free</li><li>Live map with state DOT alerts</li><li>Alerts on your planned route</li><li>Route planning</li><li>Cameras</li><li>Trip logging with CSV export</li></ul>
      <p style="margin:10px 0 0;font-size:14px">${PRICES.trial[0].toUpperCase()}${PRICES.trial.slice(1)} free trial. Twelve months of the monthly plan is ${money(twelveMonthly)}.</p></div>
    <div class="ep-card"><p class="ep-label">Premium, monthly</p><div style="font-size:30px;font-weight:800">${money(PRICES.monthly)}<small style="font-size:15px;font-weight:600">/mo</small></div>
      <ul style="margin:8px 0 0;padding-left:20px;list-style:disc;line-height:1.6"><li>Same as annual</li><li>Cancel any month</li></ul>
      <p style="margin:10px 0 0;font-size:14px">${PRICES.trial[0].toUpperCase()}${PRICES.trial.slice(1)} free trial.</p></div>
  </div>
  <div class="btns" style="margin-top:18px"><a class="primary" href="/get/" style="display:inline-block;background:#0f7a4f;color:#fff;padding:13px 24px;border-radius:10px;font-weight:700;text-decoration:none;min-height:44px;box-sizing:border-box">Get the app</a></div>
  <p class="lead" style="margin-top:14px">Cancel any time in your App Store or Google Play subscription settings. Early subscribers keep their price. Prices are in US dollars and can vary by country in the stores.</p>
</section>
<section class="api-section faq" style="max-width:820px;margin:0 auto">
  <h2>Questions</h2>
  ${faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${a}</p></details>`).join('\n  ')}
  <p class="lead" style="margin-top:12px">Building on the data? See <a href="/api/plan/">API plans and data licenses</a>.</p>
</section>
`;

const bodyStart = tpl.indexOf('<!-- /site-nav:header -->') + '<!-- /site-nav:header -->'.length;
const valuesAt = tpl.indexOf('<section class="mc-values"');
if (bodyStart < 30 || valuesAt < 0) throw new Error('template markers moved in api/plan/index.html');
const ld = `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) })}</script>`;
const head = tpl.slice(0, bodyStart)
  .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(TITLE)}</title>`)
  .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(DESC)}">`)
  .replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${URL}">`)
  .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${esc(TITLE)}">`)
  .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(DESC)}">`)
  .replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${URL}">`)
  .replace(/\n\s*<meta name="twitter:[^>]*>/g, '')
  .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\s*/g, '')
  .replace('</head>', `${ld}\n</head>`);
mkdirSync(resolve(ROOT, 'pricing'), { recursive: true });
writeFileSync(resolve(ROOT, 'pricing/index.html'), head + body + tpl.slice(valuesAt));
console.log('pricing/index.html written');
