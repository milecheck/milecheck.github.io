#!/usr/bin/env node
// add-mediavine.mjs — the Mediavine (Journey) ad script on every page that should carry it,
// Journey's blocklist div where some or all ads stay off, and journey-content on each page's
// content container. Driven by data/ad-pages.json; scripts/lib/mediavine.mjs decides each
// page and check-mediavine.mjs verifies the result. Idempotent: strips its own markers and
// re-inserts.
//
// enabled:false strips all ad markup (the rollback) but keeps the footer privacy links it
// added, and keeps rewriting old github.io privacy links: those are privacy fixes, not ads.
// enabled:true with no siteId is refused (loadConfig throws).
//   node scripts/add-mediavine.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { markContent, stripContent } from './lib/content-container.mjs';
import { loadConfig, classify, scriptTag, blockDiv, blockAnchor, headerEnd, needsPrivacy, pages, hasPrivacyAnchor, privacyLink,
  TAG_RE, BLOCK_RE, PRIV_RE, OLD_PRIVACY_RE, PRIVACY_URL } from './lib/mediavine.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const c = loadConfig(ROOT);
const counts = { none: 0, all: 0, map: 0, full: 0 };
const fallback = [];
let written = 0;
for (const { file, rel } of pages(ROOT)) {
  const before = readFileSync(file, 'utf8');
  // Old github.io privacy links 301 to the same page; Journey wants the site's own domain.
  let s = stripContent(before.replace(TAG_RE, '').replace(BLOCK_RE, '').replace(PRIV_RE, '')).replace(OLD_PRIVACY_RE, PRIVACY_URL);
  const scope = classify(rel, s, c);            // what the page would get with ads on
  const kind = c.enabled ? scope : 'none';
  counts[kind]++;
  // Privacy link on every public reader page, ads on or off, ad script or not.
  if (needsPrivacy(rel, s, c) && !hasPrivacyAnchor(s)) {
    const f = s.lastIndexOf('</footer>'), b = s.search(/<\/body>/i), at = f >= 0 ? f : b;
    if (at < 0) throw new Error(`${rel}: no </footer> or </body> to hold the privacy link`);
    s = s.slice(0, at) + '\n' + privacyLink() + s.slice(at);
  }
  if (kind !== 'none') {
    // journey-content on the direct parent of the page's paragraphs (fewer than 3 paragraphs: none).
    if (kind !== 'all') ({ html: s } = markContent(s));
    // Just before the site-nav assets block, else before </head>. add-site-nav strips and
    // re-adds its block right before </head>; sitting above it keeps the two from swapping
    // places on every finish-pages run.
    const sn = s.search(/[ \t]*<!-- site-nav:assets -->/), at = sn >= 0 ? sn : s.search(/<\/head>/i);
    s = s.slice(0, at) + scriptTag(c.siteId) + s.slice(at);
    const div = blockDiv(kind, c);
    if (div) {
      // First thing inside the page's content. Pages with no content element (some corridor
      // and mountain templates) take it right after the site's own header block instead
      // (never a header inside an aside); Journey reads the div by id, and on a static page
      // it affects only that page.
      let at = blockAnchor(s);
      if (at < 0) {
        at = headerEnd(s);
        if (at < 0) throw new Error(`${rel}: no content element and no site header for the blocklist`);
        fallback.push(rel);
      }
      s = s.slice(0, at) + div + s.slice(at);
    }
  }
  if (s !== before) { writeFileSync(file, s); written++; }
}
if (!c.enabled) console.log(`Mediavine: off (enabled:false), ad markup stripped, privacy links kept; ${written} pages changed.`);
else console.log(`Mediavine: ${counts.full} all ads, ${counts.map} map pages (floating units off), ${counts.all} script with ads blocked, ${counts.none} no script; ${written} pages changed.` + (fallback.length ? ` Blocklist after the header on ${fallback.length} pages with no content element.` : ''));
