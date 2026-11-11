// Link the corridor pages added 2026-11-11 (I-205, I-76, I-17, I-85, I-84, I-26) from the camera pages that sit on
// those roads. A plain list item in the existing "Nearby on MileCheck" list, same pattern as add-i4-camera-links.mjs.
// Runs after add-related-links.mjs, which rebuilds that list. Idempotent.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const LINKS = {
  'i-205': { label: 'I-205 traffic cameras and conditions', pages: ['cameras/portland', 'cameras/oregon', 'cameras/washington'] },
  'i-76': { label: 'I-76 traffic cameras and conditions', pages: ['cameras/philadelphia', 'cameras/pennsylvania', 'cameras/ohio'] },
  'i-17': { label: 'I-17 traffic cameras and conditions', pages: ['cameras/arizona', 'cameras/phoenix', 'road-conditions/arizona'] },
  'i-85': { label: 'I-85 traffic cameras and conditions', pages: ['cameras/atlanta', 'cameras/georgia', 'cameras/south-carolina', 'cameras/north-carolina', 'cameras/charlotte', 'cameras/greenville-sc', 'cameras/alabama'] },
  'i-84': { label: 'I-84 traffic cameras and conditions', pages: ['cameras/oregon', 'cameras/idaho', 'cameras/boise', 'cameras/utah', 'cameras/connecticut'] },
  'i-26': { label: 'I-26 traffic cameras and conditions', pages: ['cameras/south-carolina', 'cameras/north-carolina', 'cameras/greenville-sc', 'cameras/tennessee'] },
};
let changed = 0;
for (const [slug, { label, pages }] of Object.entries(LINKS)) {
  const LI = `<li><a href="/corridors/${slug}/">${label}</a></li>`;
  const re = new RegExp(`<li><a href="/corridors/${slug}/">[^<]*</a></li>`);
  for (const p of pages) {
    const f = `${p}/index.html`;
    if (!existsSync(f)) continue;
    const o = readFileSync(f, 'utf8');
    let s = o;
    if (re.test(s)) s = s.replace(re, LI);
    else {
      const i = s.indexOf('<h2>Nearby on MileCheck</h2>');
      const j = i < 0 ? -1 : s.indexOf('</ul>', i);
      if (j < 0) { console.log(`no Nearby list: ${p}`); continue; }
      s = s.slice(0, j) + '  ' + LI + '\n    ' + s.slice(j);
    }
    if (s !== o) { writeFileSync(f, s); changed++; }
  }
}
console.log(`new corridor links: ${changed} pages changed`);
