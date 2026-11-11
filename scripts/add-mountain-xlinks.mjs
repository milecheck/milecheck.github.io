// Related-links line from MileCheck road/pass pages to the matching Mountain Visibility pages (Leah 11/11).
// Hub, sunset glow, and the route road page where one exists. Link text = the target pages' own titles.
// Patches live HTML in place (a full regen of the pass pages drops sponsor blocks, so re-run this after any regen).
// Idempotent: strips its own block and re-adds. Run: node scripts/add-mountain-xlinks.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const NAME = { rainier: 'Mount Rainier', hood: 'Mount Hood', baker: 'Mount Baker', southsister: 'South Sister', baldy: 'Mount Baldy' };
const pages = {
  'passes/mt-hood': ['hood', 'us-26'], 'chains-required-mt-hood': ['hood', 'us-26'],
  'passes/mt-baker-highway': ['baker', 'sr-542'], 'seasonal/artist-point': ['baker', 'sr-542'],
  'passes/white': ['rainier'], 'passes/crystal-mountain': ['rainier', 'sr-410'],
  'seasonal/chinook-pass': ['rainier', 'sr-410'], 'seasonal/cayuse-pass': ['rainier', 'sr-410'],
  'passes/santiam': ['southsister', 'us-20'], 'seasonal/mckenzie-pass': ['southsister'],
  'passes/cajon': ['baldy'],
};
const title = f => readFileSync(f, 'utf8').match(/<title>([^<]*)/)[1].replace(/\s*\|\s*MileCheck\s*$/, '').trim();
const STRIP = /\n?<!-- mvx:start -->[\s\S]*?<!-- mvx:end -->/g;
let changed = 0;
for (const [p, [m, road]] of Object.entries(pages)) {
  const f = `${p}/index.html`;
  const o = readFileSync(f, 'utf8');
  let s = o.replace(STRIP, '');
  const t = [`mountains/${m}/index.html`, `mountains/${m}/sunset-glow/index.html`];
  const u = [`/mountains/${m}/`, `/mountains/${m}/sunset-glow/`];
  if (road && existsSync(`mountains/${m}/roads/${road}/index.html`)) { t.push(`mountains/${m}/roads/${road}/index.html`); u.push(`/mountains/${m}/roads/${road}/`); }
  if (!t.every(existsSync)) { console.log('skip (missing target)', p); continue; }
  const links = t.map((x, i) => `<a href="${u[i]}">${title(x)}</a>`).join(' &middot; ');
  const m1 = s.match(/<p class="(co|sc)-related"[^>]*>[\s\S]*?<\/p>/);
  let at, block;
  if (m1) {
    at = m1.index + m1[0].length;
    block = `\n<!-- mvx:start -->${m1[0].match(/<p class="[a-z-]+"[^>]*>/)[0]}${links}</p><!-- mvx:end -->`;
  } else {
    at = s.lastIndexOf('</ul>\n  </article>');
    if (at < 0) { console.log('no anchor', p); continue; }
    at += 5;
    block = `\n    <!-- mvx:start --><p>${links}</p><!-- mvx:end -->`;
  }
  s = s.slice(0, at) + block + s.slice(at);
  if (s !== o) { writeFileSync(f, s); changed++; }
}
console.log(`mountain xlinks: ${changed} pages changed`);
