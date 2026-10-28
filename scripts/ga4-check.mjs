// ga4-check.mjs: every public page must carry the current GA4 tag (2026-10-28).
// The 10/15 snowplow regeneration dropped the tag from 15 camera pages and the September
// state reports, and nobody saw it for two weeks (no page views, no clicks). This finds
// those pages. It is used by finish-pages.mjs (fails the run) and check-data-health.mjs.
//   node scripts/ga4-check.mjs      # lists pages without the tag, exits 1 if any
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Pages that must NOT carry GA4: TV boards (loops that would count as real traffic; they ping
// the Worker's /metric instead) and partner add-in pages that open inside Geotab.
export const NO_GA_DIRS = ['boards', 'tv', 'geotab'];
const SITE = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function walk(root, d, out) {
  for (const n of readdirSync(d)) {
    if (n.startsWith('.') || n === 'node_modules' || n === 'scripts') continue;
    const f = join(d, n);
    if (statSync(f).isDirectory()) {
      if (d === root && NO_GA_DIRS.includes(n)) continue;
      walk(root, f, out);
    } else if (n.endsWith('.html')) out.push(f);
  }
  return out;
}

// Returns { missing, stale }: pages with no tag, and pages whose tag lacks the current outbound test.
export function checkGa4(root = SITE) {
  const missing = [], stale = [];
  for (const f of walk(root, root, [])) {
    const s = readFileSync(f, 'utf8');
    if (!/<head(?:\s[^>]*)?>/i.test(s)) continue; // fragments and redirects without a head
    if (!s.includes('<!-- ga4 -->')) missing.push(relative(root, f));
    else if (!s.includes('function mcOut(')) stale.push(relative(root, f));
  }
  return { missing, stale };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { missing, stale } = checkGa4();
  for (const f of missing) console.error(`  no GA4 tag  ${f}`);
  for (const f of stale) console.error(`  old GA4 tag ${f}`);
  if (missing.length || stale.length) {
    console.error(`\nGA4 check failed: ${missing.length} page(s) without the tag, ${stale.length} with an old tag. Run: node scripts/add-analytics.mjs`);
    process.exit(1);
  }
  console.log('GA4 check: every public page carries the current tag.');
}
