// Live cameras on the first phone screen (audit 11/11, Leah "go"): on /cameras/california/ the map and the highway picker
// come right after the h1 and the app card; the related-links chips and the intro line move below the map.
// Idempotent: the block is rebuilt from the markers every run. Runs after add-app-block.mjs.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const PAGES = ['cameras/california/index.html'];
const MF = /<!-- map-first:start -->[\s\S]*?<!-- map-first:end -->\n?/;
let changed = 0;
for (const f of PAGES) {
  if (!existsSync(f)) continue;
  const o = readFileSync(f, 'utf8');
  let s = o;
  const prev = s.match(MF);
  s = s.replace(MF, '');
  const topRe = /<!-- toplinks:start -->[\s\S]*?<!-- toplinks:end -->/;
  const subRe = /[ \t]*<p class="sub">[\s\S]*?<\/p>\n?/;
  const top = s.match(topRe)?.[0] ?? prev?.[0].match(topRe)?.[0];
  const sub = (s.match(/<div class="co-hero">[\s\S]*?\n  <\/div>\n/)?.[0].match(subRe)?.[0]) ?? prev?.[0].match(subRe)?.[0];
  if (!top) continue;
  s = s.replace(topRe, '');
  if (sub) s = s.replace(sub, '');
  const mark = '<!-- camera-after-map:start -->';
  if (!s.includes(mark)) continue;
  s = s.replace(mark, `<!-- map-first:start --><div class="co-wrap" style="margin:12px auto;display:block">${top}${sub ? sub.trim() : ''}</div><!-- map-first:end -->\n` + mark);
  if (s !== o) { writeFileSync(f, s); changed++; }
}
console.log(`map first: ${changed} pages changed`);
