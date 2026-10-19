#!/usr/bin/env node
// add-rental-cards.mjs — a "Renting a car for this drive?" card on high-traffic corridor and
// pass pages where a rental is a real scenario (airport hubs on the corridor). Links to our two
// rental guides and one Discover Cars search link, with the commission line on the same card.
// Idempotent: the card sits between marker comments and is rewritten in place. (2026-10-19)
// Click tracking: each affiliate link fires a GA4 `affiliate_click` event with the partner,
// placement and page path, so clicks can be read per page. Pages are edited by this script only;
// do not hand-edit the block.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const DISCOVER_CARS = 'https://www.discovercars.com/?a_aid=milecheck';
const PAGES = [
  'corridors/i-4', 'corridors/i-15', 'corridors/i-95', 'corridors/i-75', 'corridors/i-5',
  'corridors/i-10', 'corridors/i-40', 'corridors/i-70',
  'passes/cajon', 'passes/grapevine',
];
const START = '<!-- rental-card -->', END = '<!-- /rental-card -->';
const track = (partner, placement) =>
  `onclick="window.gtag&&gtag('event','affiliate_click',{partner:'${partner}',placement:'${placement}',page_path:location.pathname})"`;
const link = 'style="color:#0f7a4f;text-decoration:underline;font-weight:600"';

const card = `${START}
<section class="mc-rental" aria-label="Renting a car" style="max-width:760px;margin:28px auto 8px;padding:0 16px;box-sizing:border-box">
  <div style="border:1px solid rgba(127,127,127,.35);border-radius:12px;padding:16px 18px;font-size:15px;line-height:1.5">
    <div style="font-weight:700;font-size:16px;margin-bottom:6px">Renting a car for this drive?</div>
    <p style="margin:0 0 6px">Rental companies charge different fees for toll passes and for coverage. Check both before you book.</p>
    <ul style="margin:0 0 8px;padding-left:20px;list-style:disc">
      <li style="margin:2px 0"><a href="/rental-car-toll-pass/" ${link}>Should you get the rental car’s toll pass?</a></li>
      <li style="margin:2px 0"><a href="/rental-car-insurance-credit-card/" ${link}>Should you buy rental insurance or use your credit card?</a></li>
      <li style="margin:2px 0"><a href="${DISCOVER_CARS}" target="_blank" rel="sponsored nofollow noopener" ${track('discovercars', 'rental-card')} ${link}>Search rentals on Discover Cars</a></li>
    </ul>
    <div style="font-size:13px;opacity:.75">MileCheck earns a commission if you book through the Discover Cars link.</div>
  </div>
</section>
${END}
`;

let added = 0, updated = 0, missing = 0;
for (const p of PAGES) {
  const f = `${p}/index.html`;
  if (!existsSync(f)) { missing++; continue; }
  let s = readFileSync(f, 'utf8');
  const re = new RegExp(`${START}[\\s\\S]*?${END}\\n?`);
  if (re.test(s)) { const n = s.replace(re, card); if (n !== s) { writeFileSync(f, n); updated++; } continue; }
  const i = s.includes('<!-- gear-card -->') ? s.indexOf('<!-- gear-card -->') : s.search(/<footer[\s>]/);
  if (i < 0) { missing++; continue; }
  writeFileSync(f, s.slice(0, i) + card + '\n' + s.slice(i)); added++;
}
console.log(`rental cards: ${added} added, ${updated} updated, ${missing} skipped`);
