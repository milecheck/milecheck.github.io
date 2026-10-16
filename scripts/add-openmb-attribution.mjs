// add-openmb-attribution.mjs: the attribution the Government of Manitoba requires wherever its data is shown.
// Manitoba 511 wrote to API users on 2026-10-16: the data is under the OpenMB Information and Data Use
// License, which requires this statement (OpenMB licence v1.0, "Using Information under this licence").
// Added above the footer of every page that shows live Manitoba 511 data, plus /data-sources/. Idempotent.
// Part of finish-pages.mjs.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
const ROOT = new URL('..', import.meta.url).pathname;
const SKIP = new Set(['node_modules', '.git', 'docs', 'scripts', 'assets', 'data', 'mockups']);
const STRIP = /<!-- openmb:start -->[\s\S]*?<!-- openmb:end -->\n?/g;
const LINE = '<!-- openmb:start --><p class="mc-openmb" style="max-width:760px;margin:18px auto 0;padding:0 20px;font-size:12.5px;line-height:1.5;color:#5b6670">Contains information from the Government of Manitoba, licensed under the <a href="https://www.manitoba.ca/openmb/" target="_blank" rel="noopener">OpenMB Information and Data Use License</a> (Manitoba.ca/OpenMB).</p><!-- openmb:end -->\n';
const pages = [];
(function walk(d) { for (const f of readdirSync(d)) { if (SKIP.has(f)) continue; const p = join(d, f); const s = statSync(p); if (s.isDirectory()) walk(p); else if (f.endsWith('.html')) pages.push(p); } })(ROOT);
let changed = 0, kept = 0;
for (const p of pages) {
  const html = readFileSync(p, 'utf8');
  const rel = p.slice(ROOT.length);
  const live = /Manitoba 511/i.test(html) && /workers\.dev|L\.map\(/.test(html);
  const want = live || rel === 'data-sources/index.html';
  const base = html.replace(STRIP, '');
  const at = base.indexOf('<footer class="site-footer">');
  const out = want && at > 0 ? base.slice(0, at) + LINE + base.slice(at) : base;
  if (out !== html) { writeFileSync(p, out); changed++; } else if (want) kept++;
}
console.log(`OpenMB attribution: ${changed} pages changed, ${kept} already had it`);
