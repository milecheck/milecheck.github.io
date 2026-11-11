// Link /corridors/i-4/ from the Florida camera pages that sit on I-4 (audit 11/11, Leah "go"). A plain list item in the
// existing "Nearby on MileCheck" list. Runs after add-related-links.mjs, which rebuilds that list. Idempotent.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const PAGES = ['cameras/florida', 'cameras/orlando', 'cameras/tampa', 'cameras/daytona-beach'];
const LI = '<li><a href="/corridors/i-4/">I-4 traffic cameras and conditions</a></li>';
let changed = 0;
for (const p of PAGES) {
  const f = `${p}/index.html`;
  if (!existsSync(f)) continue;
  const o = readFileSync(f, 'utf8');
  let s = o;
  if (/<li><a href="\/corridors\/i-4\/">[^<]*<\/a><\/li>/.test(s)) s = s.replace(/<li><a href="\/corridors\/i-4\/">[^<]*<\/a><\/li>/, LI);
  else {
    const i = s.indexOf('<h2>Nearby on MileCheck</h2>');
    const j = i < 0 ? -1 : s.indexOf('</ul>', i);
    if (j < 0) continue;
    s = s.slice(0, j) + '  ' + LI + '\n    ' + s.slice(j);
  }
  if (s !== o) { writeFileSync(f, s); changed++; }
}
console.log(`i-4 camera links: ${changed} pages changed`);
