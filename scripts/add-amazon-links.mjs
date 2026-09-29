#!/usr/bin/env node
// add-amazon-links.mjs — the Amazon Associates links on the gear guides and the three
// explainers that point at them (TODO 2026-09-26, done 2026-09-28). Idempotent.
//
// Link form: Amazon SEARCH links (/s?k=<exact product name>&tag=trailapps-20), not
// /dp/<ASIN>. A search link always lands on the right product family; a guessed ASIN
// can land on the wrong colour, size or a discontinued listing. Swap in /dp/ links
// later if Leah pulls them from SiteStripe. Every link carries rel="sponsored" (Google's
// rule for paid links) and a one-line disclosure under it; the footer of every page
// already carries the Associates Program sentence.
import { readFileSync, writeFileSync } from 'node:fs';

const TAG = 'trailapps-20';
const amz = (q) => `https://www.amazon.com/s?k=${encodeURIComponent(q).replace(/%20/g, '+')}&tag=${TAG}`;
const buy = (q, label = 'See it on Amazon') =>
  `<p class="pick-buy"><a href="${amz(q)}" target="_blank" rel="sponsored noopener">${label} &rarr;</a></p>\n      <p class="aff-note">MileCheck earns a commission if you buy through this link. The price is the same for you.</p>`;

const PICK_CSS = `    .pick .pick-buy{margin:4px 0 6px;}
    .pick .pick-buy a{display:inline-block;padding:9px 16px;border-radius:9px;background:#0f7a4f;color:#fff;font-weight:700;font-size:14px;text-decoration:none;}
    .pick .pick-buy a:hover{background:#0c6340;text-decoration:none;}`;

// 1. The five gear guides: each "BUY LINK: pending" comment sits inside a .pick whose <h3> is the product.
const GUIDES = ['best-tire-chains-for-mountain-passes', 'best-winter-car-emergency-kits', 'best-dash-cams-for-your-car', 'best-portable-jump-starters', 'best-portable-tire-inflators'];
const PENDING_RE = /<!-- BUY LINK: pending\. Paste the Amazon affiliate link here \(see TODO\.md 2026-09-26\)\. -->/g;
let placed = 0;
for (const g of GUIDES) {
  const f = `${g}/index.html`;
  let s = readFileSync(f, 'utf8');
  if (!PENDING_RE.test(s)) { console.log(f, 'already done'); continue; }
  // Resolve each pending comment to the nearest preceding <h3> inside the same .pick.
  s = s.replace(/<div class="pick">([\s\S]*?)<\/div>/g, (block) => {
    const h3 = (block.match(/<h3>([^<]+)<\/h3>/) || [])[1];
    if (!h3) return block;
    const name = h3.replace(/&amp;/g, '&').trim();
    return block.replace(PENDING_RE, () => { placed++; return buy(name); });
  });
  if (!/\.pick \.pick-buy\{/.test(s)) s = s.replace(/(\s*\.pick \.aff-note\{[^\n]*\n)/, `$1${PICK_CSS}\n`);
  writeFileSync(f, s);
  console.log(f, 'ok');
}

// 2. Three explainers get one .aff box each, placed before the app CTA. The CSS (.aff) is already on these pages.
const BOXES = {
  'chains-required-explained': {
    h: 'Chains that fit before you need them',
    p: 'The pick for cars with tight wheel-well clearance is the Security Chain Company SZ143 Super Z6, a low-profile cable chain. Check your tire size on the sidewall before ordering, and practice putting them on once in the driveway.',
    q: 'Security Chain Company SZ143 Super Z6 cable tire chain', label: 'See the SZ143 on Amazon',
    guide: ['../best-tire-chains-for-mountain-passes/', 'All three chain picks, by wheel-well clearance'] },
  'winter-car-prep-checklist': {
    h: 'The two things to put in the trunk this week',
    p: 'A jump starter covers the one breakdown that does not need anyone else to show up. The NOCO Boost Plus GB40 fits most gas engines up to about 6 liters. A roadside kit with a shovel, blanket and warning triangles covers the rest of a cold night at the shoulder.',
    q: 'NOCO Boost Plus GB40 jump starter', label: 'See the GB40 on Amazon',
    q2: 'Vetoos roadside emergency car kit', label2: 'See the Vetoos kit on Amazon',
    guide: ['../best-winter-car-emergency-kits/', 'Winter emergency kits, small to complete'] },
  'hit-a-deer-what-to-do': {
    h: 'Footage settles the claim',
    p: 'A dash cam records the animal, the road and the time. For a collision like this the footage becomes part of the insurance file, so the useful feature is not resolution, it is that the clip survives the impact. The Nexar One uploads clips to the cloud on its own; the Viofo A139 Pro records front and rear.',
    q: 'Nexar One dash cam with rear camera', label: 'See the Nexar One on Amazon',
    q2: 'Viofo A139 Pro 2CH dash cam', label2: 'See the Viofo A139 Pro on Amazon',
    guide: ['../best-dash-cams-for-your-car/', 'Three dash cams, by what matters'] },
};
for (const [slug, b] of Object.entries(BOXES)) {
  const f = `${slug}/index.html`;
  let s = readFileSync(f, 'utf8');
  if (s.includes('<aside class="aff"')) { console.log(f, 'already has box'); continue; }
  const links = [buy(b.q, b.label)].concat(b.q2 ? [buy(b.q2, b.label2).replace(/\n\s*<p class="aff-note">[\s\S]*?<\/p>/, '')] : []).join('\n      ');
  const box = `<aside class="aff" aria-label="Gear">
      <h3>${b.h}</h3>
      <p>${b.p}</p>
      ${links}
      <p class="aff-note">More picks: <a href="${b.guide[0]}">${b.guide[1]}</a>.</p>
    </aside>

    `;
  if (!s.includes('<div class="cta">')) { console.error(f, 'no CTA anchor'); process.exitCode = 1; continue; }
  s = s.replace('<div class="cta">', box + '<div class="cta">');
  if (!/\.aff \.pick-buy a\{/.test(s)) s = s.replace(/(\s*\.aff \.aff-note\{[^\n]*\n)/, `$1    .aff .pick-buy{margin:6px 0 8px;}\n    .aff .pick-buy a{display:inline-block;padding:9px 16px;border-radius:9px;background:#0f7a4f;color:#fff;font-weight:700;font-size:14px;text-decoration:none;}\n    .aff .pick-buy a:hover{background:#0c6340;text-decoration:none;}\n`);
  writeFileSync(f, s);
  placed += b.q2 ? 2 : 1;
  console.log(f, 'box added');
}
console.log('links placed:', placed);
