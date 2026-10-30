#!/usr/bin/env node
// add-social-tags.mjs — every sitemap page gets og:image, the X/Twitter card tags and the
// apple-touch-icon link (2026-10-30; /apple-touch-icon.png is the app icon at 180x180).
// Audit (StarTap, 10/30): 684 of 1,118 sitemap pages had no twitter:card and 83 had no og:image, so
// shared links showed as bare text. Generators write pages without them, so this runs in
// finish-pages.mjs after every generator. Idempotent: a page that has the tag is not touched.
//
//   node scripts/add-social-tags.mjs [--check]   # --check lists pages that would change, writes nothing
//
// Rules:
//  - Only pages listed in sitemap.xml (previews, drafts and the other apps' pages under
//    enchantments/ etc. are not in it, so they never get a MileCheck banner).
//  - mountains/** is skipped: the Mountain session generates those pages with its own image per
//    mountain (WORKING.md, no wholesale regen from here).
//  - og:image missing -> the shared MileCheck banner (1200x630) plus width/height.
//  - twitter:card missing -> summary_large_image, with title, description and image copied from the
//    page's own og tags (falling back to <title> and meta description). Existing twitter tags stay.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');
const BANNER = 'https://milecheckapp.com/images/og-banner-light.png';

const sitemap = readFileSync(resolve(ROOT, 'sitemap.xml'), 'utf8');
const files = [];
for (const m of sitemap.matchAll(/<loc>https:\/\/milecheckapp\.com([^<]*)<\/loc>/g)) {
  let p = decodeURIComponent(m[1]);
  if (p.startsWith('/mountains/')) continue;
  const rel = p.endsWith('/') ? p.slice(1) + 'index.html' : p.slice(1);
  if (rel && existsSync(resolve(ROOT, rel)) && rel.endsWith('.html')) files.push(rel);
}

const metaContent = (html, attr, name) => {
  const m = html.match(new RegExp(`<meta\\s+${attr}="${name}"\\s+content="([^"]*)"`, 'i'))
    || html.match(new RegExp(`<meta\\s+content="([^"]*)"\\s+${attr}="${name}"`, 'i'));
  return m ? m[1] : null;
};

let addedImg = 0, addedCard = 0, addedTouch = 0, touched = 0;
for (const rel of files) {
  const abs = resolve(ROOT, rel);
  let html = readFileSync(abs, 'utf8');
  const head = html.slice(0, html.indexOf('</head>'));
  if (!head) continue;
  const lines = [];
  const hasImg = /property="og:image"/.test(head);
  const hasCard = /name="twitter:card"/.test(head);
  const hasTouch = /rel="apple-touch-icon"/.test(head);
  if (hasImg && hasCard && hasTouch) continue;

  const ogImage = metaContent(head, 'property', 'og:image') || BANNER;
  if (!hasImg) {
    lines.push(`<meta property="og:image" content="${BANNER}">`);
    if (!/property="og:image:width"/.test(head)) lines.push('<meta property="og:image:width" content="1200">', '<meta property="og:image:height" content="630">');
    addedImg++;
  }
  if (!hasCard) {
    const title = metaContent(head, 'property', 'og:title') || (head.match(/<title>([\s\S]*?)<\/title>/) || [])[1];
    const desc = metaContent(head, 'property', 'og:description') || metaContent(head, 'name', 'description');
    lines.push('<meta name="twitter:card" content="summary_large_image">');
    if (title && !/name="twitter:title"/.test(head)) lines.push(`<meta name="twitter:title" content="${title.trim()}">`);
    if (desc && !/name="twitter:description"/.test(head)) lines.push(`<meta name="twitter:description" content="${desc}">`);
    if (!/name="twitter:image"/.test(head)) lines.push(`<meta name="twitter:image" content="${ogImage}">`);
    addedCard++;
  }
  if (!hasTouch) { lines.push('<link rel="apple-touch-icon" href="/apple-touch-icon.png">'); addedTouch++; }
  // Insert after the last og: meta (keeps the social block together), else before </head>.
  const ogs = [...head.matchAll(/<meta\s+property="og:[^>]*>/g)];
  const block = lines.map((l) => '  ' + l).join('\n');
  if (ogs.length) {
    const last = ogs[ogs.length - 1];
    const at = last.index + last[0].length;
    html = html.slice(0, at) + '\n' + block + html.slice(at);
  } else {
    const at = html.indexOf('</head>');
    html = html.slice(0, at) + block + '\n' + html.slice(at);
  }
  touched++;
  if (!CHECK) writeFileSync(abs, html);
}
console.log(`social tags: ${touched} pages ${CHECK ? 'would change' : 'changed'} (og:image on ${addedImg}, twitter card on ${addedCard}, touch icon on ${addedTouch}) of ${files.length} sitemap pages checked`);
