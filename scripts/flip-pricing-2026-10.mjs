// Flip day: MileCheck Premium becomes $19.99/yr or $4.99/mo with a 2-week free trial
// (prices decided 2026-09-25, trial decided by Leah 2026-10-02: "i like 2 week more").
//
// Run ONLY the day both stores sell the new products (Apple: annual.v3 + monthly.v2 approved;
// Play: annual-v3 + monthly-v2 base plans active, each with a 2-week free trial). A page that
// quotes a price or trial the store does not give is the 9/7 misstatement in reverse.
//
//   node scripts/flip-pricing-2026-10.mjs           dry run: what would change, and what to review
//   node scripts/flip-pricing-2026-10.mjs --apply   write it
//
// Then the post-generator chain (it is idempotent): add-sponsor-slots → tag-store-links →
// add-signup-band → add-signup-ctas → add-nav-search → build-search-index → build-sitemap →
// link-jsonld LAST. Verify the BUILT pages, then commit and push.
//
// Exact MileCheck phrases only. "$1.99, one time" (Seattle Drawbridges), "$9.99 a year or $0.99
// a month" (Mountain Visibility) and competitor prices are other products and never match.
// Generators are edited too (scripts/gen-*.js), so a later regeneration keeps the new copy.
// The staged branch `pricing-19-99` (ede3933b, 10 hand-edited pages) predates this; anything it
// changes that these rules miss shows up in the review list below.

import fs from 'fs';
import path from 'path';

const APPLY = process.argv.includes('--apply');
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SKIP_DIRS = new Set(['node_modules', '.git']);
const EXTS = new Set(['.html', '.js', '.cjs', '.mjs', '.json', '.xml', '.txt']);
const SELF = path.basename(new URL(import.meta.url).pathname);

// Order matters: full price+trial phrases first, then the bare trial phrase.
const RULES = [
  ['$49.99 a year or $9.99 a month after a 7-day free trial', '$19.99 a year or $4.99 a month after a 2-week free trial'],
  ['$49.99 per year or $9.99 per month, with a 7-day free trial', '$19.99 per year or $4.99 per month, with a 2-week free trial'],
  ['$49.99 per year or $9.99 per month', '$19.99 per year or $4.99 per month'],
  ['$49.99/yr or $9.99/mo, with a 7-day free trial', '$19.99/yr or $4.99/mo, with a 2-week free trial'],
  ['$49.99/yr or $9.99/mo, 7-day free trial', '$19.99/yr or $4.99/mo, 2-week free trial'],
  ['$49.99/year or $9.99/month', '$19.99/year or $4.99/month'],
  ['$49.99/yr or $9.99/mo', '$19.99/yr or $4.99/mo'],
  // Pages still quoting the May prices ($9.99/yr, $1.99/mo) — wrong today, fixed on the flip.
  ['$9.99/yr or $1.99/mo, with a 7-day free trial', '$19.99/yr or $4.99/mo, with a 2-week free trial'],
  ['$9.99/yr or $1.99/mo, 7-day free trial', '$19.99/yr or $4.99/mo, 2-week free trial'],
  ['$49.99/yr — 7-day free trial', '$19.99/yr — 2-week free trial'],
  ['$49.99/year — 7-day free trial', '$19.99/year — 2-week free trial'],
  ['$9.99/yr — 7-day free trial', '$19.99/yr — 2-week free trial'],
  ['7-day free trial', '2-week free trial'],
  ['7-Day Free Trial', '2-Week Free Trial'],
  ['7-day trial', '2-week trial'],
  ['seven-day free trial', 'two-week free trial'],
];

// Left after the rules, worth a human look (prices with no trial next to them, schema offers).
const REVIEW = [
  /\$49\.99/g,
  /\$9\.99(?! a year or \$0\.99)/g,
  /\$1\.99\/mo/g,
  /\$1\.99 a month/g,
  /"price"\s*:\s*"(?:49\.99|9\.99|1\.99)"/g,
  /7[- ]day(?! window)/gi,
];

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (EXTS.has(path.extname(e.name)) && e.name !== SELF) yield p;
  }
}

const perRule = RULES.map(() => 0);
const touched = [];
const review = [];
for (const file of walk(ROOT)) {
  const before = fs.readFileSync(file, 'utf8');
  let after = before;
  RULES.forEach(([from, to], i) => {
    const n = after.split(from).length - 1;
    if (n) { perRule[i] += n; after = after.split(from).join(to); }
  });
  if (after !== before) {
    touched.push(path.relative(ROOT, file));
    if (APPLY) fs.writeFileSync(file, after);
  }
  for (const re of REVIEW) {
    for (const m of after.matchAll(re)) {
      const at = m.index ?? 0;
      review.push(`${path.relative(ROOT, file)}: …${after.slice(Math.max(0, at - 50), at + 50).replace(/\s+/g, ' ')}…`);
    }
  }
}

console.log(APPLY ? 'APPLIED' : 'DRY RUN (nothing written; add --apply)');
RULES.forEach(([from], i) => perRule[i] && console.log(`${String(perRule[i]).padStart(5)}  ${from}`));
console.log(`\n${touched.length} files change.`);
console.log(`\nReview (${review.length}) — not changed, check by hand:`);
for (const r of review.slice(0, 80)) console.log('  ' + r);
if (review.length > 80) console.log(`  … ${review.length - 80} more`);
