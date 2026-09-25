#!/usr/bin/env node
// add-sponsor-slots.mjs — put the sponsor slot on every static page of the site that
// no generator writes: the home page, the mile-marker map, the state and province
// mile-marker guides, the highway-basics explainers, the blog posts and reports, the
// drawbridge pages, the family hubs, the live-conditions pages, the Mountain
// Visibility hub and the Seattle Drawbridges site. Pages a
// generator writes (corridors, cameras, passes) already carry the slot and are left
// alone. Leah, 2026-09-24: "it needs to be on more website pages."
//
// It strips any earlier slot and re-inserts from data/sponsors.json, so re-running
// after a sale is safe. It also writes data/sponsor-pages.json, the inventory the
// sponsor pages read (every page with a slot, its family, title and current sponsor).
//
// Run from the site root after the generators and after any sponsors.json change:
//   node scripts/add-sponsor-slots.mjs
// Replaces add-guide-sponsor-slots.mjs (2026-09-17), which covered the 50 state guides.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const SPON = require('./lib/sponsor-slot');

const ROOT = process.cwd();
const START = '<!-- spon:start -->', END = '<!-- spon:end -->';
// Not sponsorable: other apps' sites, drafts and previews, sales pages, tooling.
const SKIP_DIRS = new Set(['es', 'fr', 'geotab', 'design-options', 'boards',
  'sponsor', 'partners', 'get', 'api', 'images', 'assets', 'data', 'scripts', 'node_modules', 'or-family', 'enchantments']);
const SKIP_FILES = new Set(['404.html', 'index-v1-classic.html', 'index-v2-preview.html', 'enterprise-preview.html', 'android.html']);
const LIVE = new Set(['borders', 'ferries', 'fire', 'closures', 'weather']);

// Which family and slug a page belongs to. null = not sponsorable.
export function keyFor(rel) {
  const parts = rel.split('/');
  if (parts.length === 1) {
    if (rel === 'index.html') return null; // the front page sells the app, not a sponsor (Leah, 2026-09-24)
    return null; // googlede…html, previews, android.html
  }
  const [dir, ...rest] = parts;
  if (SKIP_DIRS.has(dir)) return null;
  if (dir === 'maps' && rel === 'maps/mile-markers/index.html') return { kind: 'home', slug: 'mile-marker-map' };
  if (dir === 'blog') {
    if (rest.length === 2 && rest[0] === 'labor-day-weekend-recap-2026-states') return { kind: 'article', slug: 'labor-day-2026-' + rest[1].replace(/\.html$/, '') };
    if (rest.length !== 1 || !rest[0].endsWith('.html')) return null;
    const f = rest[0].replace(/\.html$/, '');
    if (f === 'index') return { kind: 'article', slug: 'hub' };
    if (f === 'mile-markers-vs-gps') return { kind: 'article', slug: f };
    if (/^mile-markers-[a-z-]+$/.test(f)) return { kind: 'guide', slug: f.replace(/^mile-markers-/, '') };
    if (/^km-markers-[a-z-]+$/.test(f)) return { kind: 'guide', slug: f };
    return { kind: 'article', slug: f };
  }
  // The other two apps' sites inside this repo (Leah, 2026-09-24: "can go on all websites too").
  if (dir === 'mountains' && rest[rest.length - 1] === 'index.html') {
    if (rest.length === 1) return { kind: 'mountain', slug: 'hub' };
    if (rest.length === 2) return { kind: 'mountain', slug: rest[0] };
    if (rest.length === 3) return { kind: 'mountain', slug: rest[0] + '-' + rest[1] }; // roads/ pages are generator-owned and skipped above
  }
  if (dir === 'seattle-drawbridges' && rest[rest.length - 1] === 'index.html') return { kind: 'drawbridge', slug: rest.length === 1 ? 'hub' : rest[0] };
  if (rest.length === 1 && rest[0] === 'index.html') {
    if (dir === 'bridges' || dir === 'corridors' || dir === 'cameras' || dir === 'passes') return { kind: { bridges: 'bridge', corridors: 'corridor', cameras: 'cameras', passes: 'pass' }[dir], slug: 'hub' };
    if (LIVE.has(dir)) return { kind: 'live', slug: dir };
    if (dir === 'canada' || dir === 'states') return { kind: 'guide', slug: dir };
    return { kind: 'basics', slug: dir };
  }
  if (dir === 'bridges' && rest.length === 2 && rest[1] === 'index.html') return { kind: 'bridge', slug: rest[0] };
  return null; // corridors/<x>, cameras/<x>, passes/<x>: generator-owned, and anything unknown
}

const strip = (html) => html
  .replace(new RegExp(START + '[\\s\\S]*?' + END + '\\n?', 'g'), '')
  .replace(/\n?\s*\/\* spon:css \*\/[\s\S]*?\/\* \/spon:css \*\//g, '')
  .replace(/<style><\/style>\n(?=<\/head>)/g, ''); // the block this script adds to a page with no <style> of its own

const ANCHORS = ['<p class="eyebrow">', '<div class="eyebrow">', '<p class="article-eyebrow">', '<div class="mile-map-head">', '<div class="mv-stamp">', '<div class="sd-stamp">', '<h1'];

function titleOf(html, fallback) {
  const m = html.match(/<title>([^<]*)<\/title>/i);
  const t = (m ? m[1] : fallback).replace(/\s*[|—–-]\s*MileCheck.*$/i, '').replace(/&amp;/g, '&').trim();
  return t || fallback;
}

function walk(d, out = []) {
  for (const n of fs.readdirSync(d)) {
    if (n.startsWith('.')) continue;
    const f = path.join(d, n);
    if (fs.statSync(f).isDirectory()) { if (!SKIP_DIRS.has(n)) walk(f, out); }
    else if (n.endsWith('.html')) out.push(f);
  }
  return out;
}

const inventory = [];
let placed = 0, kept = 0, skippedShape = [];
for (const f of walk(ROOT).sort()) {
  const rel = path.relative(ROOT, f);
  if (SKIP_FILES.has(path.basename(rel))) continue;
  let html = fs.readFileSync(f, 'utf8');
  const key = keyFor(rel);
  const generatorOwned = !html.includes(START) && html.includes('id="spon"');
  if (generatorOwned) {
    // corridors, cameras, passes: the generator placed it; record it for the inventory
    const m = html.match(/id="spon" data-slot="([^"]+)" data-sponsor="([^"]+)"/);
    if (m) { inventory.push({ key: m[1], path: '/' + rel.replace(/index\.html$/, ''), title: titleOf(html, rel), sponsor: m[2] }); kept++; }
    continue;
  }
  if (!key) continue;
  html = strip(html);
  const anchor = ANCHORS.find((a) => html.includes(a));
  const styleClose = html.indexOf('</style>');
  if (!anchor || !html.includes('</body>')) { skippedShape.push(rel); continue; }
  const sp = SPON.slot({ kind: key.kind, slug: key.slug, name: titleOf(html, rel) });
  html = html.replace(anchor, START + '\n' + sp.html + '\n' + END + '\n' + anchor);
  html = styleClose >= 0
    ? html.replace('</style>', '/* spon:css */\n' + sp.css + '\n/* /spon:css */\n  </style>')
    : html.replace('</head>', '<style>/* spon:css */\n' + sp.css + '\n/* /spon:css */</style>\n</head>');
  html = html.replace('</body>', START + sp.js + END + '\n</body>');
  fs.writeFileSync(f, html);
  inventory.push({ key: sp.key, path: '/' + rel.replace(/index\.html$/, ''), title: titleOf(html, rel), sponsor: sp.sponsorId });
  placed++;
}
inventory.sort((a, b) => a.key.localeCompare(b.key));
fs.writeFileSync(path.join(ROOT, 'data', 'sponsor-pages.json'), JSON.stringify({ generated: new Date().toISOString().slice(0, 10), families: SPON.FAMILIES, pages: inventory }, null, 1) + '\n');
console.log(`sponsor slots: ${placed} static pages written, ${kept} generator pages kept, ${inventory.length} in data/sponsor-pages.json`);
if (skippedShape.length) console.log('skipped (no anchor or </body>): ' + skippedShape.join(', '));
console.log(SPON.summary());
