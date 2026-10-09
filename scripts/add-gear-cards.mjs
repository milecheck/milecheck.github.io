#!/usr/bin/env node
// add-gear-cards.mjs — a small "Gear for this drive" card above the footer on the high-intent
// page families (passes, chains, cameras, closures, bridges). The card links to our own gear
// guides, which carry the Amazon links and the disclosure. Idempotent: the card sits between
// marker comments and is rewritten in place on every run. (2026-10-08)
import { readdirSync, readFileSync, writeFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const G = {
  chains: ['/best-tire-chains-for-mountain-passes/', 'Best tire chains for mountain passes'],
  kits: ['/best-winter-car-emergency-kits/', 'Best winter car emergency kits'],
  jump: ['/best-portable-jump-starters/', 'Best portable jump starters'],
  air: ['/best-portable-tire-inflators/', 'Best portable tire inflators'],
  cams: ['/best-dash-cams-for-your-car/', 'Best dash cams for your car'],
  bino: ['/best-binoculars-for-mountain-views/', 'Binoculars for mountain views'],
};
// Direct picks: the same products the gear guides recommend, as Amazon search links
// (the add-amazon-links.mjs form, so a guessed ASIN can't land on the wrong listing).
const TAG = 'trailapps-20';
const amz = (q) => `https://www.amazon.com/s?k=${encodeURIComponent(q).replace(/%20/g, '+')}&tag=${TAG}`;
const P = {
  sz143: ['Security Chain Company SZ143 Super Z6 cable tire chain', 'tight wheel-well clearance'],
  konig: ['König XG-12 Pro', 'the easiest install'],
  vetoos: ['Vetoos roadside emergency car kit', 'a winter emergency kit'],
  viofo: ['Viofo A139 Pro 2CH', 'a front and rear dash cam'],
  noco: ['NOCO Boost Plus GB40', 'a jump starter'],
  vortex: ['Vortex Diamondback HD 10x42', 'binoculars'],
};
const FAMILIES = {
  passes: { picks: [P.sz143, P.vetoos], guides: [G.chains, G.kits, G.jump] },
  chains: { picks: [P.sz143, P.konig], guides: [G.chains, G.kits, G.air] },
  cameras: { picks: [P.viofo], guides: [G.cams, G.kits, G.air] },
  closures: { picks: [P.vetoos, P.noco], guides: [G.kits, G.jump, G.air] },
  bridges: { picks: [P.viofo], guides: [G.cams, G.jump] },
  mountains: { title: 'Gear for the view', picks: [P.vortex], guides: [G.bino], recursive: true, skip: ['android'] },
};

const START = '<!-- gear-card -->', END = '<!-- /gear-card -->';
const card = ({ picks, guides: links, title = 'Gear for this drive' }) => `${START}
<section class="mc-gear" aria-label="Gear guides" style="max-width:760px;margin:28px auto 8px;padding:0 16px;box-sizing:border-box">
  <div style="border:1px solid rgba(127,127,127,.35);border-radius:12px;padding:16px 18px;font-size:15px;line-height:1.5">
    <div style="font-weight:700;font-size:16px;margin-bottom:6px">${title}</div>
${picks.map(([name, what]) => `    <p style="margin:0 0 6px">Our pick for ${what}: <a href="${amz(name)}" target="_blank" rel="sponsored noopener" style="color:#0f7a4f;text-decoration:underline;font-weight:600">${name} on Amazon</a></p>`).join('\n')}
    <div style="font-size:14px;font-weight:700;margin:10px 0 4px">More picks, compared</div>
    <ul style="margin:0 0 8px;padding-left:20px;list-style:disc">
${links.map(([href, label]) => `      <li style="margin:2px 0"><a href="${href}" style="color:#0f7a4f;text-decoration:underline;font-weight:600">${label}</a></li>`).join('\n')}
    </ul>
    <div style="font-size:13px;opacity:.75">Product links go to Amazon. MileCheck earns a commission if you buy through them. The price is the same for you.</div>
  </div>
</section>
${END}
`;

function pages(dir, recursive = false, skip = []) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) {
      if (skip.includes(n)) continue;
      if (recursive) out.push(...pages(p, true, skip));
      else { const f = join(p, 'index.html'); if (existsSync(f)) out.push(f); }
    } else if (n === 'index.html') out.push(p);
  }
  return out;
}

let added = 0, updated = 0, skipped = 0;
for (const [fam, conf] of Object.entries(FAMILIES)) {
  for (const f of pages(fam, conf.recursive, conf.skip || [])) {
    let s = readFileSync(f, 'utf8');
    const block = card(conf);
    const re = new RegExp(`${START}[\\s\\S]*?${END}\\n?`);
    if (re.test(s)) {
      const next = s.replace(re, block);
      if (next !== s) { writeFileSync(f, next); updated++; }
      continue;
    }
    const i = s.search(/<footer[\s>]/);
    if (i < 0) { skipped++; continue; }
    s = s.slice(0, i) + block + '\n' + s.slice(i);
    writeFileSync(f, s); added++;
  }
}
console.log(`gear cards: ${added} added, ${updated} updated, ${skipped} skipped (no footer)`);
