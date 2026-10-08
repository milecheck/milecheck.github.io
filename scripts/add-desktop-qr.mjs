#!/usr/bin/env node
// Adds a desktop-only "scan to get MileCheck on your phone" block above the footer (2026-10-08).
// 32% of site traffic is desktop and a desktop visitor cannot tap an app store badge.
//   node scripts/add-desktop-qr.mjs          # write
//   node scripts/add-desktop-qr.mjs --check  # count only
// QR images are static SVGs in assets/qr/get-<section>.svg pointing at /get/?from=<section>
// (made with python segno; /get/ sends iPhone and Android to the right store). Idempotent.
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
const CHECK = process.argv.includes('--check');
const SECTIONS = ['cameras','corridors','maps','closures','passes','road-conditions','bridges','borders','fire','ferries','chains','grades','seattle-drawbridges','states'];
const FOOT = '<footer class="site-footer">';
const block = sec => `<!-- dq:start -->
<aside class="dq" aria-label="Get MileCheck on your phone"><style>.dq{display:none}@media (min-width:900px) and (hover:hover) and (pointer:fine){.dq{display:flex;align-items:center;gap:18px;max-width:760px;margin:8px auto 28px;padding:16px 20px;border:1px solid #E5E5E5;border-radius:14px;background:#fff}.dq img{width:112px;height:112px;flex:none}.dq b{display:block;font-size:17px;margin-bottom:4px;color:#0E1116}.dq span{font-size:14.5px;line-height:1.5;color:#3a444d}}</style><img src="/assets/qr/get-${sec}.svg" width="112" height="112" alt="QR code to get MileCheck" loading="lazy"><div><b>On a computer? Scan to get MileCheck on your phone.</b><span>Your mile marker works with no signal. Live DOT alerts and cameras need a connection. iPhone and Android.</span></div></aside>
<!-- dq:end -->
`;
let changed = 0, already = 0, noFooter = 0;
for (const sec of SECTIONS) {
  if (!existsSync(sec)) continue;
  (function walk(d) {
    for (const f of readdirSync(d)) {
      const p = join(d, f);
      if (statSync(p).isDirectory()) { walk(p); continue; }
      if (!f.endsWith('.html')) continue;
      const s = readFileSync(p, 'utf8');
      if (s.includes('<!-- dq:start -->')) { already++; continue; }
      const i = s.indexOf(FOOT);
      if (i < 0) { noFooter++; continue; }
      changed++;
      if (!CHECK) writeFileSync(p, s.slice(0, i) + block(sec) + s.slice(i));
    }
  })(sec);
}
console.log(`${CHECK ? '[check] ' : ''}${changed} pages ${CHECK ? 'would change' : 'changed'}, ${already} already done, ${noFooter} skipped (no footer)`);
