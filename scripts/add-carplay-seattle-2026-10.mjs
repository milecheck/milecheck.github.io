// Seattle pages: say what CarPlay shows (WA ferry sailings + space left, Seattle drawbridge status).
// Leah 2026-10-03: "SEATTLE PAGES SHOULD HIGHLIGHT CARPLAY HAVING FERRIES TIMES AND SPOTS AND DRAWBRIDGE STATUS".
//
// RUN ONLY once an App Store build with the CarPlay Nearby screen (CHANGE 54c, src/carplay/nearby.ts) is
// public. On 2026-10-03 that code is in TestFlight builds only; the App Store still serves an older build.
// A page that promises a car screen the store does not give is the 9/7 price misstatement again.
//
// Facts this copy rests on (src/carplay/nearby.ts, CarPlayManager.tsx, carplay.en.ts):
//   - Nearby lists WASHINGTON FERRIES (sailing time and destination, space left, "Ferry space unavailable" when
//     there is no report) and SEATTLE DRAWBRIDGES (Up, Down, raised/lowered N min ago, "Status unavailable").
//   - Free users get the Now screen only; ferries and drawbridges on the car screen are Premium (CHANGE 55).
//   - CarPlay only. Android Auto is not claimed here.
//
//   node scripts/add-carplay-seattle-2026-10.mjs           dry run
//   node scripts/add-carplay-seattle-2026-10.mjs --apply   write
import fs from 'node:fs';
import path from 'node:path';
const APPLY = process.argv.includes('--apply');
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const EDITS = [
  ['ferries/index.html',
   'The MileCheck app shows your nearest mile marker, live road alerts and pass conditions on the way, with CarPlay and Android Auto. <a href="/get/">Get the app</a>.',
   'On CarPlay, the MileCheck app lists the next sailings from terminals near you and the space left on each boat. It also shows your nearest mile marker and road alerts on the way. Premium. <a href="/get/">Get the app</a>.'],
  ['bridges/washington/index.html',
   'MileCheck shows live state DOT feeds, mile markers, and bridges on the road — in all 50 states, with CarPlay and Android Auto.',
   'MileCheck shows live state DOT feeds, mile markers and bridges on the road in all 50 states. On CarPlay, the Nearby screen lists Seattle drawbridges as up or down and Washington ferry sailings with the space left. Premium.'],
];
let n = 0;
for (const [f, a, b] of EDITS) {
  const p = path.join(ROOT, f);
  const s = fs.readFileSync(p, 'utf8');
  if (!s.includes(a)) { console.log(`SKIP ${f}: anchor not found (already applied or page changed)`); continue; }
  console.log(`${APPLY ? 'WRITE' : 'would change'} ${f}`);
  if (APPLY) fs.writeFileSync(p, s.replace(a, b));
  n++;
}
console.log(`${n} page(s) ${APPLY ? 'written' : 'would change'}. Then run the post-generator chain (add-sponsor-slots → tag-store-links → add-signup-band → add-signup-ctas → add-nav-search → build-search-index → build-sitemap → link-jsonld LAST) and verify the built pages.`);
