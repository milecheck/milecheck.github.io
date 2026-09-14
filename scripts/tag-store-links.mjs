#!/usr/bin/env node
// Tag every App Store / Google Play link with the page it sits on, so installs
// can be attributed per page in Play Console (UTM) and App Store Connect (campaign).
//
//   node scripts/tag-store-links.mjs            # rewrite all .html in place
//   node scripts/tag-store-links.mjs --pt TOKEN # also add Apple's provider token
//
// Idempotent: re-running strips old tags and re-applies. Run after any generator.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const PT = (() => { const i = process.argv.indexOf('--pt'); return i > -1 ? process.argv[i + 1] : ''; })();
const ROOT = process.cwd();
const APPLE_ID = '6759212851';
const PKG = 'app.milecheck.mobile';

function slugFor(file) {
  let p = relative(ROOT, file).replace(/index\.html$/, '').replace(/\.html$/, '').replace(/\/$/, '');
  if (!p) p = 'home';
  return p.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase().slice(0, 80);
}
function walk(dir, out = []) {
  for (const n of readdirSync(dir)) {
    if (n.startsWith('.') || n === 'node_modules' || n === 'scripts') continue;
    const f = join(dir, n); const s = statSync(f);
    if (s.isDirectory()) walk(f, out); else if (n.endsWith('.html')) out.push(f);
  }
  return out;
}
const APPLE_RE = /https:\/\/apps\.apple\.com\/[^"'\s)]*id6759212851[^"'\s)]*/g;
const PLAY_RE = /https:\/\/play\.google\.com\/store\/apps\/details\?id=app\.milecheck\.mobile[^"'\s)]*/g;
let files = 0, apple = 0, play = 0;
for (const f of walk(ROOT)) {
  const src = readFileSync(f, 'utf8');
  const slug = slugFor(f);
  const appleUrl = PT ? `https://apps.apple.com/app/apple-store/id${APPLE_ID}?pt=${PT}&ct=${slug}&mt=8` : `https://apps.apple.com/us/app/milecheck/id${APPLE_ID}?ct=${slug}&mt=8`;
  const ref = encodeURIComponent(`utm_source=milecheckapp.com&utm_medium=web&utm_campaign=${slug}`);
  const playUrl = `https://play.google.com/store/apps/details?id=${PKG}&referrer=${ref}`;
  let out = src.replace(APPLE_RE, () => { apple++; return appleUrl; }).replace(PLAY_RE, () => { play++; return playUrl; });
  if (out !== src) { writeFileSync(f, out); files++; }
}
console.log(`tagged ${apple} App Store + ${play} Play links across ${files} files${PT ? ' (with pt)' : ' (no pt yet)'}`);
