// finish-pages.mjs — the post-generator steps, in the one order that works (2026-10-08).
// Every generator writes bare pages; these scripts add the shared extras (sponsor slot, map
// kit, store-link tags, email signup, Search link, desktop QR box, footer link, linked
// JSON-LD). Run this after ANY generator instead of remembering the list. Each step is
// idempotent, so on an up-to-date site a run changes nothing.
//
//   node scripts/finish-pages.mjs              # all steps
//   node scripts/finish-pages.mjs --pages-only # skip build-search-index + build-sitemap
//                                              # (site-wide files; build-sitemap needs git history)
//
// link-jsonld runs LAST or the Dataset/@id markup is wiped.
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PAGES_ONLY = process.argv.includes('--pages-only');
const STEPS = [
  'add-sponsor-slots.mjs', 'add-map-kit.mjs', 'tag-store-links.mjs', 'add-signup-band.mjs',
  'add-signup-ctas.mjs', 'add-gear-cards.mjs', 'add-nav-search.mjs', 'add-desktop-qr.mjs', 'add-data-sources-link.mjs',
  ...(PAGES_ONLY ? [] : ['build-search-index.mjs', 'build-sitemap.mjs']),
  'link-jsonld.mjs',
];
for (const step of STEPS) {
  if (!existsSync(resolve(SITE, 'scripts', step))) throw new Error(`missing scripts/${step}`);
  console.log(`— ${step}`);
  execFileSync(process.execPath, [`scripts/${step}`], { cwd: SITE, stdio: 'inherit' });
}
