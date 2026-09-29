#!/usr/bin/env node
// build-search-index.mjs — the index behind /search/ (2026-09-28). One JSON file of every
// canonical, indexable page: URL, title, description, h1, and a section label. The page
// searches it client-side; nothing runs on a server. Regenerate whenever pages change:
//   node scripts/build-search-index.mjs
// Same inclusion rule as build-sitemap.mjs: a self-referencing canonical.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join, relative } from 'node:path';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'https://milecheckapp.com';
const SKIP = [/-preview\.html$/, /^google[0-9a-f]+\.html$/, /^404\.html$/, /^boards\//, /^internal\//, /^design-options\//, /^search\//];
function htmlFiles(dir, acc = []) {
  for (const n of readdirSync(dir)) {
    if (['.git', 'node_modules', 'scripts', 'data'].includes(n)) continue;
    const p = join(dir, n);
    if (statSync(p).isDirectory()) htmlFiles(p, acc); else if (n.endsWith('.html')) acc.push(p);
  }
  return acc;
}
const urlFor = (rel) => rel === 'index.html' ? `${BASE}/` : rel.endsWith('/index.html') ? `${BASE}/${rel.slice(0, -'index.html'.length)}` : `${BASE}/${rel}`;
const clean = (s) => (s || '').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&mdash;/g, '—').replace(/&rsquo;/g, '’').replace(/&ldquo;|&rdquo;/g, '"').replace(/&nbsp;/g, ' ').replace(/&#\d+;|&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();
const SECTION = [
  [/^cameras\//, 'Cameras'], [/^corridors\//, 'Corridors'], [/^passes\//, 'Passes'], [/^bridges\//, 'Drawbridges'], [/^mountains\//, 'Mountains'],
  [/^blog\/mile-markers-/, 'State guides'], [/^blog\/km-markers-/, 'Province guides'], [/^blog\//, 'Blog'], [/^(es|fr|pa|pt)\//, 'Other languages'],
  [/^(borders|canada|ferries|fire|weather|closures|maps)\//, 'Live maps'], [/^(partners|fleets|api|sponsor|geotab)\//, 'For business'], [/^best-/, 'Gear'], [/^enchantments\//, 'Enchantments'],
];
const LANG = { es: 'es', fr: 'fr', pa: 'pa', pt: 'pt' };
const out = [];
for (const f of htmlFiles(ROOT)) {
  const rel = relative(ROOT, f).replace(/\\/g, '/');
  if (SKIP.some((re) => re.test(rel))) continue;
  const s = readFileSync(f, 'utf8');
  const canon = (s.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
  if (!canon || canon !== urlFor(rel)) continue;
  const title = clean((s.match(/<title>([\s\S]*?)<\/title>/) || [])[1]).replace(/\s*[|—–-]\s*MileCheck\s*$/i, '');
  const desc = clean((s.match(/<meta name="description" content="([^"]*)"/) || [])[1]);
  const h1 = clean((s.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1]);
  const lang = (s.match(/<html[^>]*\blang="([a-z]{2})/) || [])[1] || 'en';
  const section = (SECTION.find(([re]) => re.test(rel)) || [null, 'Guides'])[1];
  out.push({ u: canon.replace(BASE, ''), t: title || h1, d: desc, h: h1 !== title ? h1 : '', s: section, l: LANG[lang] || 'en' });
}
out.sort((a, b) => a.u.localeCompare(b.u));
writeFileSync(join(ROOT, 'search-index.json'), JSON.stringify({ built: new Date().toISOString().slice(0, 10), n: out.length, pages: out }));
console.log('search-index.json', out.length, 'pages,', (statSync(join(ROOT, 'search-index.json')).size / 1024).toFixed(0), 'KB');
