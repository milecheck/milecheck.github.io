#!/usr/bin/env node
// Takes the web-page sponsor offer off every page (Leah, printed list 10/29: "Remove web sponsor. Raptive will just
// do it once approved. Monthly report sponsor stays."). Removes the "Want to advertise with us?" aside, its beacon
// script and its CSS block. Pages of the monthly Highway Report keep their slot: it sells the next report.
//   node scripts/remove-web-sponsor-slots.mjs          # write
//   node scripts/remove-web-sponsor-slots.mjs --check  # count only
// Idempotent. Handles all three shapes the slot had: wrapped in spon markers, bare aside from a generator, and the
// script inside the markers. scripts/lib/sponsor-slot.js now writes nothing for non-report pages (WEB_SPONSORS_ENABLED).
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = fileURLToPath(new URL('../', import.meta.url));
const CHECK = process.argv.includes('--check');
const REPORT = /road-report|highway-report/;
const ASIDE = /[ \t]*<aside class="spon[^"]*" id="spon"[^>]*data-slot="([^"]*)"[\s\S]*?<\/aside>\n?/g;
let changed = 0, keptReport = 0;
function strip(html) {
  let kept = false;
  let out = html.replace(ASIDE, (m, slot) => { if (REPORT.test(slot)) { kept = true; return m; } return ''; });
  if (kept) { keptReport++; return out; }
  // No slot left on this page: remove its beacon script, CSS block and empty marker pairs.
  out = out.replace(/<!-- spon:start -->\s*<script>[\s\S]*?<\/script>\s*<!-- spon:end -->\n?/g, (m) => /sponsor-beacon|data-spon-link/.test(m) ? '' : m);
  out = out.replace(/[ \t]*<script>(?:(?!<\/script>)[\s\S])*?sponsor-beacon(?:(?!<\/script>)[\s\S])*?<\/script>\n?/g, '');
  out = out.replace(/\/\* spon:css \*\/[\s\S]*?\/\* \/spon:css \*\/\n?/g, '');
  out = out.replace(/<!-- spon:start -->\s*<!-- spon:end -->\n?/g, '');
  return out;
}
function walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || e.name === 'node_modules' || e.isSymbolicLink()) continue;
    const abs = resolve(dir, e.name);
    if (e.isDirectory()) { walk(abs); continue; }
    if (!e.name.endsWith('.html')) continue;
    const html = readFileSync(abs, 'utf8');
    if (!/id="spon"|spon:start|sponsor-beacon/.test(html)) continue;
    const next = strip(html);
    if (next !== html) { changed++; if (!CHECK) writeFileSync(abs, next); }
  }
}
walk(ROOT);
console.log(`Web sponsor slots: ${changed} pages ${CHECK ? 'would change' : 'changed'}; ${keptReport} Highway Report pages keep their slot.`);
