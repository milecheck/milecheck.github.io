#!/usr/bin/env node
// Inject the GA4 tag into every page (idempotent). Enhanced measurement in GA4 then
// records outbound clicks, scroll, and sessions per page with US-state geography.
//   node scripts/add-analytics.mjs G-XXXXXXXXXX
//
// The tag is byte-identical to the one the page generators emit
// (side-projects/drawbridges/scripts/build-site.mjs and
// side-projects/mountain-engine/scripts/build-site.mjs): a TestFlight link counts as a
// store click, because the beta apps link there until they are on the App Store.
// Keep the three in step. An older copy of this script carried the tag without
// testflight, and a re-run on 2026-09-22 silently downgraded the 15 Seattle
// Drawbridges pages.
//
// Re-running is a no-op on a page that already carries this exact tag right after
// <head>. The 2026-09-22 run left one extra blank line per pass (258 dirty files by
// 9/24) because the strip kept the newline after the old tag and the insert added
// another. The strip now takes that newline with it.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
const ID = process.argv[2];
if (!/^G-[A-Z0-9]+$/.test(ID || '')) { console.error('usage: node scripts/add-analytics.mjs G-XXXXXXXXXX'); process.exit(1); }
const TAG = `<!-- ga4 --><script async src="https://www.googletagmanager.com/gtag/js?id=${ID}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${ID}',{anonymize_ip:true});document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[href]');if(!a)return;var h=a.getAttribute('href')||'';if(/apps\\.apple\\.com|play\\.google\\.com|testflight\\.apple\\.com/.test(h)){gtag('event','store_click',{store:/apple/.test(h)?'app_store':'google_play',page_path:location.pathname});}else if(/^https?:/.test(h)&&!h.includes(location.hostname)){gtag('event','outbound_click',{link_url:h,page_path:location.pathname});}},{capture:true});</script><!-- /ga4 -->`;
// <head> or <head lang=...>, never <header>. The old /<head[^>]*>/ matched <header>
// on the two board pages that have no <head> at all and put the tag inside it.
const HEAD_RE = /<head(?:\s[^>]*)?>/i;
const OLD_TAG_RE = /<!-- ga4 -->[\s\S]*?<!-- \/ga4 -->\n?/;
function walk(d, o = []) {
  for (const n of readdirSync(d)) {
    if (n.startsWith('.') || n === 'node_modules' || n === 'scripts') continue;
    const f = join(d, n);
    if (statSync(f).isDirectory()) walk(f, o); else if (n.endsWith('.html')) o.push(f);
  }
  return o;
}
let pages = 0, written = 0, skipped = 0;
for (const f of walk(process.cwd())) {
  const before = readFileSync(f, 'utf8');
  let s = before.replace(OLD_TAG_RE, '');
  if (!HEAD_RE.test(s)) { skipped++; continue; }
  s = s.replace(HEAD_RE, (m) => m + '\n' + TAG);
  if (s !== before) { writeFileSync(f, s); written++; }
  pages++;
}
console.log(`GA4 tag on ${pages} pages (${written} written, ${skipped} skipped: no <head>)`);
