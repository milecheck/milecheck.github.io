#!/usr/bin/env node
/**
 * check-coverage-drift.mjs — find coverage counts still hand-typed in prose.
 *
 *   node scripts/check-coverage-drift.mjs [--verbose]
 *
 * Two jobs:
 *   1. FAIL if a marked count disagrees with the ledger (someone hand-edited
 *      inside the markers, or the ledger moved and apply- was never re-run).
 *   2. WARN for unmarked numbers sitting next to coverage words. These are the
 *      ones that drift. Not all are wrong — "50 state DOT feeds" is prose about
 *      the same 50 — so this reports rather than fails, and each should either
 *      get markers or be deliberately left alone.
 *
 * Exit 1 on a real mismatch. Warnings alone exit 0 so this can gate a build
 * without blocking on judgment calls.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join, relative } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const VERBOSE = process.argv.includes('--verbose');
const ledger = JSON.parse(readFileSync(join(ROOT, 'data/coverage-ledger.json'), 'utf8'));

const lookup = (key) =>
  (key.startsWith('pages.') ? key : `feeds.${key}`).split('.')
    .reduce((o, k) => (o == null ? undefined : o[k]), ledger);

function htmlFiles(dir, acc = []) {
  for (const n of readdirSync(dir)) {
    if (n === 'node_modules' || n === '.git' || n === 'scripts') continue;
    const p = join(dir, n);
    if (statSync(p).isDirectory()) htmlFiles(p, acc);
    else if (n.endsWith('.html')) acc.push(p);
  }
  return acc;
}

// Numbers adjacent to coverage nouns are the drift-prone ones.
const NOUNS = '(?:US )?(?:states?|provinces?|cameras?|corridors?|interstates?|passes|crossings?|DOT feeds?|integrations?)';
// (?<![-\\w]) rejects route numbers — "I-66 corridor", "US-2 states" are not counts.
const UNMARKED = new RegExp(`(?<![-\\w])(\\d{1,3}(?:,\\d{3})*)\\s+${NOUNS}\\b`, 'gi');
const MARKED = /<!--cov:([a-z_.]+)-->(.*?)<!--\/cov-->/gs;

/**
 * Phrases that are structurally fixed and cannot drift, so they'd otherwise
 * bury the real findings. "50 states" is the whole country — mile-marker
 * coverage is complete, and there is no 51st. Alert integrations also sit at
 * 50/50, but those ARE marked where they appear as a product claim.
 */
const STABLE = [/^50\s+(US\s+)?states?$/i, /^50\s+state$/i];


let mismatches = [], warnings = [], markedTotal = 0, stableSkipped = 0;

for (const file of htmlFiles(ROOT)) {
  const src = readFileSync(file, 'utf8');
  const rel = relative(ROOT, file);

  for (const m of src.matchAll(MARKED)) {
    markedTotal++;
    const want = lookup(m[1]);
    const wantStr = typeof want === 'number' ? want.toLocaleString('en-US') : String(want);
    if (want === undefined) mismatches.push(`${rel} :: unknown key "${m[1]}"`);
    else if (m[2] !== wantStr) mismatches.push(`${rel} :: ${m[1]} shows "${m[2]}", ledger says "${wantStr}"`);
  }

  // strip marked regions before hunting for unmarked ones
  const stripped = src.replace(MARKED, '');
  for (const m of stripped.matchAll(UNMARKED)) {
    const text = m[0].replace(/\s+/g, ' ');
    if (STABLE.some((re) => re.test(text))) { stableSkipped++; continue; }
    warnings.push({ file: rel, text });
  }
}

console.log(`checked ${markedTotal} marked count(s) against data/coverage-ledger.json`);

if (mismatches.length) {
  console.error(`\n❌ ${mismatches.length} MISMATCH(ES) — run: node scripts/apply-coverage-counts.mjs`);
  mismatches.forEach((m) => console.error('   ' + m));
} else {
  console.log('✅ all marked counts match the ledger');
}

// group warnings so the report is readable
const byText = new Map();
for (const w of warnings) {
  const k = w.text.toLowerCase();
  if (!byText.has(k)) byText.set(k, { text: w.text, files: new Set() });
  byText.get(k).files.add(w.file);
}
if (stableSkipped) console.log(`   (${stableSkipped} "50 states"-class mentions skipped — structurally fixed)`);
if (byText.size) {
  console.log(`\n⚠️  ${warnings.length} unmarked coverage number(s) in ${byText.size} distinct phrase(s):`);
  const rows = [...byText.values()].sort((a, b) => b.files.size - a.files.size);
  for (const r of (VERBOSE ? rows : rows.slice(0, 20))) {
    console.log(`   "${r.text}"  ×${r.files.size} file(s)${r.files.size <= 3 ? '  — ' + [...r.files].join(', ') : ''}`);
  }
  if (!VERBOSE && rows.length > 20) console.log(`   …${rows.length - 20} more (--verbose)`);
  console.log('\n   Wrap the ones that should track the ledger:  <!--cov:KEY-->N<!--/cov-->');
}

process.exit(mismatches.length ? 1 : 0);
