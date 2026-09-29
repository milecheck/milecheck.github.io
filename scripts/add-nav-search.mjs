#!/usr/bin/env node
// add-nav-search.mjs — the Search link in every page's nav (2026-09-28). The site had no
// search until /search/ existed; this puts the way in on every page, right before the
// "Get the app" button. Run AFTER the generators, like add-signup-band.mjs and
// add-sponsor-slots.mjs: a regenerated page loses the link until this runs again.
// Idempotent. Desktop shows the icon only (the label is visually hidden, still read by
// screen readers); the mobile dropdown shows icon + "Search". CSS lives in style.css.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
const LINK = `<a href="/search/" class="nav-search"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/></svg><span>Search</span></a>`;
const CTA_RE = /^([ \t]*)(<a href="[^"]*"[^>]*class="nav-cta"[^>]*>)/m;
const SKIP = /(^|\/)(boards|design-options|internal|node_modules|scripts|\.git)(\/|$)|-preview\.html$|v1-classic|v2-preview|^google[0-9a-f]+\.html$/;
function walk(d, o = []) {
  for (const n of readdirSync(d)) {
    if (n.startsWith('.') || n === 'node_modules' || n === 'scripts') continue;
    const f = join(d, n);
    if (statSync(f).isDirectory()) walk(f, o); else if (n.endsWith('.html')) o.push(f);
  }
  return o;
}
let added = 0, had = 0, none = 0;
for (const f of walk('.')) {
  const rel = f.replace(/^\.\//, '');
  if (SKIP.test(rel)) continue;
  const s = readFileSync(f, 'utf8');
  if (s.includes('class="nav-search"')) { had++; continue; }
  if (!CTA_RE.test(s)) { none++; continue; }
  writeFileSync(f, s.replace(CTA_RE, (m, ind, cta) => `${ind}${LINK}\n${ind}${cta}`));
  added++;
}
console.log(`nav search: added ${added}, already had ${had}, no nav-cta ${none}`);
