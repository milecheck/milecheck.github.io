#!/usr/bin/env node
// Footer link hub (2026-10-29): grouped plain text links to the hubs and the top pages in each group, placed just
// above the footer on every public page. Goal: internal links from every indexed page to the pages Google has
// found but not crawled (road conditions, cameras, chain laws, passes, corridors, closures, rest areas), and a
// way for a driver to jump from any page to the road they are about to take.
//   node scripts/add-footer-hub.mjs          # write
//   node scripts/add-footer-hub.mjs --check  # count only
// Idempotent (marker comments). Skips what add-site-nav.mjs skips: held road-status pages, boards, previews,
// noindex pages. A link to the page it sits on is left out. Only pages that exist on disk are linked.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { exclusion } from './add-site-nav.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const CHECK = process.argv.includes('--check');
const START = '<!-- footer-hub:start -->', END = '<!-- footer-hub:end -->';
const has = (p) => existsSync(resolve(ROOT, p.replace(/^\//, ''), 'index.html'));

const STATES = { washington: 'Washington', oregon: 'Oregon', california: 'California', colorado: 'Colorado', montana: 'Montana', idaho: 'Idaho', utah: 'Utah',
  nevada: 'Nevada', arizona: 'Arizona', wyoming: 'Wyoming', 'new-york': 'New York', minnesota: 'Minnesota', pennsylvania: 'Pennsylvania' };
const st = (list, dir, suffix) => list.map((s) => [`/${dir}/${s}/`, `${STATES[s]} ${suffix}`]);
// Each group: title, hub link, then the top pages. Winter-heavy states first; this is not a ranking.
const GROUPS = [
  { t: 'Road conditions', all: ['/road-conditions/', 'Road conditions in all 50 states'],
    links: st(['washington', 'oregon', 'california', 'colorado', 'montana', 'idaho', 'utah', 'nevada', 'new-york', 'minnesota', 'pennsylvania'], 'road-conditions', 'road conditions') },
  { t: 'Highway cameras', all: ['/cameras/', 'Highway cameras by state and city'],
    links: st(['washington', 'oregon', 'california', 'colorado', 'utah', 'idaho', 'montana', 'nevada', 'arizona', 'new-york'], 'cameras', 'cameras') },
  { t: 'Chain laws', all: ['/chain-laws/', 'Chain and traction laws by state'],
    links: [...st(['washington', 'oregon', 'california', 'colorado', 'idaho', 'montana', 'nevada', 'utah', 'wyoming'], 'chain-laws', 'chain law'), ['/chain-laws/british-columbia/', 'British Columbia chain law']] },
  { t: 'Mountain passes', all: ['/passes/', 'Mountain passes'],
    links: [['/passes/snoqualmie/', 'Snoqualmie Pass'], ['/passes/stevens/', 'Stevens Pass'], ['/passes/donner/', 'Donner Pass'], ['/passes/grapevine/', 'The Grapevine'], ['/passes/cajon/', 'Cajon Pass'],
      ['/passes/eisenhower/', 'Eisenhower Tunnel'], ['/passes/vail/', 'Vail Pass'], ['/passes/siskiyou/', 'Siskiyou Summit'], ['/passes/parleys/', 'Parleys Summit'], ['/passes/little-cottonwood/', 'Little Cottonwood Canyon']] },
  { t: 'Interstate corridors', all: ['/corridors/', 'Interstate corridors'],
    links: ['i-5', 'i-90', 'i-80', 'i-70', 'i-15', 'i-95', 'i-75', 'i-10', 'i-40', 'i-94'].map((c) => [`/corridors/${c}/`, `${c.toUpperCase()} conditions`]) },
  { t: 'Closures, rest areas and help', all: ['/closures/', 'US closures map'],
    links: [['/seasonal/', 'Roads that close for winter'], ['/chains/', 'Chain control map'], ['/snowplows/', 'Snowplow map'], ['/ski/', 'Ski resort roads'], ['/rest-areas/', 'Rest area rules by state'],
      ['/how-long-do-crashes-take-to-clear/', 'How long crashes take to clear'], ['/border-wait-times/', 'Border wait times'], ['/report-location/', 'How to report your location']] },
];

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
export function hubBlock(pathname) {
  const groups = GROUPS.map((g) => {
    const items = [g.all, ...g.links].filter(([href]) => href !== pathname && has(href));
    if (!items.length) return '';
    return `      <details class="mc-hub-g" open>
        <summary>${esc(g.t)}</summary>
        <ul>
${items.map(([href, label]) => `          <li><a href="${href}">${esc(label)}</a></li>`).join('\n')}
        </ul>
      </details>`;
  }).filter(Boolean).join('\n');
  return `${START}
<nav class="mc-hub" aria-label="Browse road conditions, cameras, chain laws and passes">
  <style>
    .mc-hub{background:#F4F8F6;border-top:1px solid #E4EAE6;padding:28px 0 22px;font-family:Inter,-apple-system,"Segoe UI",sans-serif;color:#1b2420;}
    .mc-hub-in{max-width:1160px;margin:0 auto;padding:0 20px;}
    .mc-hub-t{font-size:15px;font-weight:800;margin:0 0 12px;}
    .mc-hub-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:4px 28px;}
    .mc-hub-g summary{cursor:pointer;font-size:12.5px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:#4a5560;padding:10px 0;min-height:44px;display:flex;align-items:center;list-style:none;}
    .mc-hub-g summary::-webkit-details-marker{display:none;}
    .mc-hub-g ul{list-style:none;margin:0 0 14px;padding:0;}
    .mc-hub-g li{margin:0;}
    .mc-hub-g a{display:block;font-size:14.5px;line-height:1.35;padding:7px 0;color:#0f6b3f;text-decoration:none;}
    .mc-hub-g a:hover{text-decoration:underline;}
    @media(max-width:900px){.mc-hub-grid{grid-template-columns:repeat(2,1fr);}}
    @media(max-width:560px){.mc-hub-grid{grid-template-columns:1fr;gap:0;}.mc-hub-g{border-bottom:1px solid #E4EAE6;}.mc-hub-g summary::after{content:"+";margin-left:auto;font-size:18px;}.mc-hub-g[open] summary::after{content:"\\2212";}.mc-hub-g a{padding:11px 0;}}
  </style>
  <div class="mc-hub-in">
    <p class="mc-hub-t">Find your road</p>
    <div class="mc-hub-grid">
${groups}
    </div>
  </div>
  <script>if(window.matchMedia&&matchMedia("(max-width:560px)").matches)document.querySelectorAll(".mc-hub-g").forEach(function(d){d.removeAttribute("open")});</script>
</nav>
${END}
`;
}

let changed = 0, same = 0, skipped = 0, nofooter = 0;
function walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || e.isSymbolicLink()) continue;
    const abs = resolve(dir, e.name), file = relative(ROOT, abs).split(sep).join('/');
    if (e.isDirectory()) { if (exclusion(file + '/index.html') === 'private or support path') continue; walk(abs); continue; }
    if (!e.name.endsWith('.html')) continue;
    if (exclusion(file)) { skipped++; continue; }
    const html = readFileSync(abs, 'utf8');
    if (exclusion(file, html)) { skipped++; continue; }
    if (!/<footer\b/i.test(html)) { nofooter++; continue; }
    const pathname = '/' + file.replace(/index\.html$/, '');
    const block = hubBlock(pathname);
    const rx = new RegExp(`${START}[\\s\\S]*?${END}\\n?`);
    let next = rx.test(html) ? html.replace(rx, () => block) : html.replace(/(\n?)([ \t]*)<footer\b/i, (m, nl, ws) => `${nl}${block}${ws}<footer`);
    if (next === html) { same++; continue; }
    changed++;
    if (!CHECK) writeFileSync(abs, next);
  }
}
walk(ROOT);
console.log(`Footer link hub: ${changed} pages ${CHECK ? 'would change' : 'changed'}, ${same} up to date, ${skipped} protected, ${nofooter} without a footer.`);
