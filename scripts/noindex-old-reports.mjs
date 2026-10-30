#!/usr/bin/env node
// noindex-old-reports.mjs — adds <meta name="robots" content="noindex,follow"> to the pages listed in
// data/noindex-pages.json (2026-10-30). build-sitemap.mjs already skips noindex pages, so one list keeps
// them out of search and the sitemap. Idempotent. Runs in finish-pages after every generator, so a
// regenerated page gets the tag back.
//   node scripts/noindex-old-reports.mjs [--check]
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');
const cfg = JSON.parse(readFileSync(resolve(ROOT, 'data/noindex-pages.json'), 'utf8'));
const files = [...(cfg.files || [])];
for (const d of cfg.dirs || []) {
  const abs = resolve(ROOT, d);
  if (existsSync(abs)) for (const f of readdirSync(abs)) if (f.endsWith('.html')) files.push(join(d, f));
}
const TAG = '<meta name="robots" content="noindex,follow">';
let changed = 0;
for (const rel of files) {
  const abs = resolve(ROOT, rel);
  if (!existsSync(abs)) continue;
  const html = readFileSync(abs, 'utf8');
  if (/<meta\s+name="robots"/i.test(html)) continue;
  const m = html.match(/<meta name="description"[^>]*>/);
  if (!m) { console.error('no description meta in ' + rel); continue; }
  changed++;
  if (!CHECK) writeFileSync(abs, html.replace(m[0], m[0] + '\n  ' + TAG));
}
console.log(`noindex: ${changed} of ${files.length} pages ${CHECK ? 'would change' : 'changed'}`);
