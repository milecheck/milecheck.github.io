#!/usr/bin/env node
// Adds a "Data sources" link to the "Help & legal" footer list on every page (2026-10-07).
//   node scripts/add-data-sources-link.mjs          # write
//   node scripts/add-data-sources-link.mjs --check  # count only
// Idempotent. Re-run after any generator that rebuilds footers.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
const CHECK = process.argv.includes('--check');
const SKIP_DIR = new Set(['node_modules', '.git', 'design-options', 'boards', 'internal']);
const LI = '<li><a href="/data-sources/">Data sources</a></li>';
const ANCHOR = /([ \t]*)(<li><a href="mailto:feedback@milecheckapp\.com">Send feedback<\/a><\/li>)/;
let changed = 0, already = 0;
(function walk(d) {
  for (const f of readdirSync(d)) {
    if (SKIP_DIR.has(f)) continue;
    const p = join(d, f);
    if (statSync(p).isDirectory()) { walk(p); continue; }
    if (!f.endsWith('.html')) continue;
    const s = readFileSync(p, 'utf8');
    if (!ANCHOR.test(s)) continue;
    if (s.includes('/data-sources/"')) { already++; continue; }
    changed++;
    if (!CHECK) writeFileSync(p, s.replace(ANCHOR, (m, ws, li) => `${ws}${LI}\n${ws}${li}`));
  }
})('.');
console.log(`${CHECK ? '[check] ' : ''}${changed} pages ${CHECK ? 'would change' : 'changed'}, ${already} already linked`);
