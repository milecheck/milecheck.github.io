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

/** The page's real last change: its last git commit date. A page that is not in git yet
 *  (just generated) gets today. Before 2026-09-24 every URL got today's date on every
 *  rebuild, which told Google all 324 pages changed each time the sitemap was rebuilt. */
import { execSync } from 'node:child_process';
function lastChanged(rel) {
  try {
    const d = execSync(`git log -1 --format=%cs -- "${rel}"`, { cwd: ROOT, encoding: 'utf8' }).trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : TODAY;
  } catch { return TODAY; }
}

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
  // A page that asks not to be indexed does not belong in the sitemap either (2026-09-24: /sponsor/pages/).
  if (/<meta\s+name="robots"\s+content="[^"]*noindex/i.test(src)) { skippedNoCanonical++; continue; }
  urls.push({ loc: want, priority: priority(rel), lastmod: lastChanged(rel) });
}

urls.sort((a, b) => (b.priority.localeCompare(a.priority)) || a.loc.localeCompare(b.loc));

const xml =
`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;

console.log(`sitemap: ${urls.length} URL(s); ${skippedNoCanonical} page(s) skipped (no self-canonical)`);
if (DRY) { console.log('(dry run — not written)'); process.exit(0); }
writeFileSync(join(ROOT, 'sitemap.xml'), xml);
console.log('wrote sitemap.xml');
