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
};
const FAMILIES = {
  passes: [G.chains, G.kits, G.jump],
  chains: [G.chains, G.kits, G.air],
  cameras: [G.cams, G.kits, G.air],
  closures: [G.kits, G.jump, G.air],
  bridges: [G.cams, G.jump],
};

const START = '<!-- gear-card -->', END = '<!-- /gear-card -->';
const card = (links) => `${START}
<section class="mc-gear" aria-label="Gear guides" style="max-width:760px;margin:28px auto 8px;padding:0 16px;box-sizing:border-box">
  <div style="border:1px solid rgba(127,127,127,.35);border-radius:12px;padding:16px 18px;font-size:15px;line-height:1.5">
    <div style="font-weight:700;font-size:16px;margin-bottom:6px">Gear for this drive</div>
    <ul style="margin:0 0 8px;padding-left:20px;list-style:disc">
${links.map(([href, label]) => `      <li style="margin:2px 0"><a href="${href}" style="color:#0f7a4f;text-decoration:underline;font-weight:600">${label}</a></li>`).join('\n')}
    </ul>
    <div style="font-size:13px;opacity:.75">These guides link to Amazon. MileCheck earns a commission if you buy through them. The price is the same for you.</div>
  </div>
</section>
${END}
`;

function pages(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) { const f = join(p, 'index.html'); if (existsSync(f)) out.push(f); }
    else if (n === 'index.html') out.push(p);
  }
  return out;
}

let added = 0, updated = 0, skipped = 0;
for (const [fam, links] of Object.entries(FAMILIES)) {
  for (const f of pages(fam)) {
    let s = readFileSync(f, 'utf8');
    const block = card(links);
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
