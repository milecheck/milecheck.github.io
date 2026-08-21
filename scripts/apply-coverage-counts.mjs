#!/usr/bin/env node
/**
 * apply-coverage-counts.mjs — inject ledger numbers into the HTML.
 *
 * BUILD-TIME. The browser never fetches a count; this rewrites the committed
 * HTML so the served pages are plain static files with the numbers already in
 * them. No runtime Worker dependency.
 *
 *   node scripts/apply-coverage-counts.mjs [--dry]
 *
 * Mark a count in HTML with an invisible comment pair — no markup change, so
 * layout and styling are untouched:
 *
 *     <!--cov:cameras.us_states-->27<!--/cov-->
 *
 * The key is a dotted path into data/coverage-ledger.json, minus the top-level
 * section, e.g.  cameras.us_states -> feeds.cameras.us_states
 *                pages.corridors   -> pages.corridors
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join, relative } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DRY = process.argv.includes('--dry');
const ledger = JSON.parse(readFileSync(join(ROOT, 'data/coverage-ledger.json'), 'utf8'));

function lookup(key) {
  const path = key.startsWith('pages.') ? key : `feeds.${key}`;
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), ledger);
}

function htmlFiles(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git') continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) htmlFiles(p, acc);
    else if (name.endsWith('.html')) acc.push(p);
  }
  return acc;
}

const RE = /<!--cov:([a-z_.]+)-->(.*?)<!--\/cov-->/gs;
let changed = 0, marks = 0, missing = [];

for (const file of htmlFiles(ROOT)) {
  const src = readFileSync(file, 'utf8');
  if (!src.includes('<!--cov:')) continue;
  const out = src.replace(RE, (full, key, current) => {
    marks++;
    const val = lookup(key);
    if (val === undefined) { missing.push(`${relative(ROOT, file)} :: ${key}`); return full; }
    const next = typeof val === 'number' ? val.toLocaleString('en-US') : String(val);
    if (next !== current) changed++;
    return `<!--cov:${key}-->${next}<!--/cov-->`;
  });
  if (out !== src && !DRY) writeFileSync(file, out);
}

console.log(`${marks} marked count(s) across the site; ${changed} updated${DRY ? ' (dry run)' : ''}`);
if (missing.length) {
  console.error('\n⚠️  unknown ledger keys:');
  missing.forEach((m) => console.error('   ' + m));
  process.exit(1);
}
