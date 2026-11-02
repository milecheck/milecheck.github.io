#!/usr/bin/env node
// add-new-tab.mjs — every public page opens links in a new tab (Leah's hard rule, 2026-11-02).
// site-nav.js carries the rule; pages that skip the shared header (held pass, corridor and
// road-status pages) get assets/new-tab.js instead. Idempotent.   node scripts/add-new-tab.mjs [--check]
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = fileURLToPath(new URL('../', import.meta.url));
const CHECK = process.argv.includes('--check');
const SKIP = /^(?:\.|node_modules|scripts|assets|data|images|video|docs|boards|internal|admin|private|design-options|geotab)(?:\/|$)/;
const TAG = '<script src="/assets/new-tab.js?v=20261102-1" defer></script><!-- new-tab -->';
let changed = 0, checked = 0;
const walk = (d) => { for (const n of readdirSync(d)) { const p = join(d, n), r = relative(ROOT, p);
  if (SKIP.test(r)) continue; const st = statSync(p);
  if (st.isDirectory()) walk(p); else if (n.endsWith('.html')) fix(p, r); } };
function fix(p, r) {
  let s = readFileSync(p, 'utf8');
  if (!/<\/head>/i.test(s) || /preview|google[0-9a-f]+\.html$/i.test(r)) return;
  checked++;
  if (s.includes('site-nav.js') || s.includes('<!-- new-tab -->')) return;
  changed++; if (!CHECK) writeFileSync(p, s.replace(/<\/head>/i, `  ${TAG}\n</head>`));
}
walk(ROOT);
console.log(`new-tab: ${changed} page(s) ${CHECK ? 'need' : 'got'} assets/new-tab.js, ${checked} checked.`);
if (CHECK && changed) process.exitCode = 1;
