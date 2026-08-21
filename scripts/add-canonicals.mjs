#!/usr/bin/env node
/**
 * add-canonicals.mjs — give every public page a self-referencing canonical.
 *
 *   node scripts/add-canonicals.mjs [--dry]
 *
 * Audit 2026-08-21 found 9 of 10 core pages had no canonical tag, so new pages
 * weren't entering the index consistently. A self-referencing canonical is the
 * safe default: it tells Google "this URL is the original", which matters most
 * where a page is reachable by more than one path (with/without trailing slash,
 * query strings from campaigns).
 *
 * Skips non-public files: previews, drafts, Google verification stubs.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join, relative } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'https://milecheckapp.com';
const DRY = process.argv.includes('--dry');

const SKIP = [/-preview\.html$/, /^google[0-9a-f]+\.html$/, /^404\.html$/, /\/drafts?\//];

function htmlFiles(dir, acc = []) {
  for (const n of readdirSync(dir)) {
    if (['.git', 'node_modules', 'scripts', 'data'].includes(n)) continue;
    const p = join(dir, n);
    if (statSync(p).isDirectory()) htmlFiles(p, acc);
    else if (n.endsWith('.html')) acc.push(p);
  }
  return acc;
}

/** /foo/index.html -> https://milecheckapp.com/foo/ ; /bar.html -> .../bar.html */
function urlFor(rel) {
  if (rel === 'index.html') return `${BASE}/`;
  if (rel.endsWith('/index.html')) return `${BASE}/${rel.slice(0, -'index.html'.length)}`;
  return `${BASE}/${rel}`;
}

let added = 0, updated = 0, skipped = 0, noHead = [];

for (const file of htmlFiles(ROOT)) {
  const rel = relative(ROOT, file).split('\\').join('/');
  if (SKIP.some((re) => re.test(rel))) { skipped++; continue; }

  const src = readFileSync(file, 'utf8');
  if (!src.includes('</head>')) { noHead.push(rel); continue; }

  const want = urlFor(rel);
  const tag = `<link rel="canonical" href="${want}">`;
  let out;

  const existing = src.match(/<link\s+rel="canonical"[^>]*>/i);
  if (existing) {
    if (existing[0] === tag) continue;             // already correct
    out = src.replace(existing[0], tag); updated++;
  } else {
    out = src.replace('</head>', `  ${tag}\n</head>`); added++;
  }
  if (!DRY) writeFileSync(file, out);
}

console.log(`canonicals — added ${added}, corrected ${updated}, skipped ${skipped}${DRY ? '  (dry run)' : ''}`);
if (noHead.length) console.log(`  ⚠️  ${noHead.length} file(s) with no </head>, left alone: ${noHead.slice(0, 5).join(', ')}`);
