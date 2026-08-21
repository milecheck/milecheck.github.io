#!/usr/bin/env node
/**
 * build-sitemap.mjs — regenerate sitemap.xml from the pages that actually exist.
 *
 *   node scripts/build-sitemap.mjs [--dry]
 *
 * The old sitemap was hand-maintained, so /canada/ went live without ever being
 * listed (audit 2026-08-21). Generating from disk means a new page is indexed
 * because it exists, not because someone remembered.
 *
 * Only lists canonical, indexable pages: anything with a self-referencing
 * canonical that points at its own URL. Previews, drafts, verification stubs,
 * and the board concepts (no <head>) are excluded automatically.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join, relative } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'https://milecheckapp.com';
const DRY = process.argv.includes('--dry');
const TODAY = new Date().toISOString().slice(0, 10);

const SKIP = [/-preview\.html$/, /^google[0-9a-f]+\.html$/, /^404\.html$/, /^boards\//];

function htmlFiles(dir, acc = []) {
  for (const n of readdirSync(dir)) {
    if (['.git', 'node_modules', 'scripts', 'data'].includes(n)) continue;
    const p = join(dir, n);
    if (statSync(p).isDirectory()) htmlFiles(p, acc);
    else if (n.endsWith('.html')) acc.push(p);
  }
  return acc;
}

const urlFor = (rel) =>
  rel === 'index.html' ? `${BASE}/`
  : rel.endsWith('/index.html') ? `${BASE}/${rel.slice(0, -'index.html'.length)}`
  : `${BASE}/${rel}`;

/** Priority by depth: home > section hub > leaf. */
function priority(rel) {
  if (rel === 'index.html') return '1.0';
  if (rel === 'partners/index.html') return '0.9';
  const depth = rel.split('/').length;
  return depth <= 2 ? '0.8' : '0.6';
}

const urls = [];
let skippedNoCanonical = 0;

for (const file of htmlFiles(ROOT)) {
  const rel = relative(ROOT, file).split('\\').join('/');
  if (SKIP.some((re) => re.test(rel))) continue;

  const src = readFileSync(file, 'utf8');
  const want = urlFor(rel);
  const m = src.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i);
  // Only index pages that claim themselves as canonical.
  if (!m || m[1] !== want) { skippedNoCanonical++; continue; }
  urls.push({ loc: want, priority: priority(rel) });
}

urls.sort((a, b) => (b.priority.localeCompare(a.priority)) || a.loc.localeCompare(b.loc));

const xml =
`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${TODAY}</lastmod>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;

console.log(`sitemap: ${urls.length} URL(s); ${skippedNoCanonical} page(s) skipped (no self-canonical)`);
if (DRY) { console.log('(dry run — not written)'); process.exit(0); }
writeFileSync(join(ROOT, 'sitemap.xml'), xml);
console.log('wrote sitemap.xml');
