#!/usr/bin/env node
// winter-retitle.mjs — applies scripts/lib/winter-titles.cjs to the built pages in place (2026-11-01).
// The generators read the same file, so a later regenerate gives the same result. This exists so the change
// does not need a full regenerate plus finish-pages over hundreds of pages. Idempotent.
//   node scripts/winter-retitle.mjs
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const W = require('./lib/winter-titles.cjs');
const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const jsonEsc = (s) => JSON.stringify(String(s)).slice(1, -1);

const jobs = { ...W.PAGES };
for (const slug of W.SNOW_STATES) jobs[`road-conditions/${slug}`] = { state: true };

let changed = 0;
for (const [page, spec] of Object.entries(jobs)) {
  const file = path.join(SITE, page, 'index.html');
  if (!fs.existsSync(file)) { console.log('missing', page); continue; }
  let html = fs.readFileSync(file, 'utf8');
  const get = (re) => (html.match(re) || [])[1];
  const oldTitle = get(/<title>([^<]*)<\/title>/);
  const oldOg = get(/property="og:title" content="([^"]*)"/);
  const oldDesc = get(/name="description" content="([^"]*)"/);
  const oldH1 = get(/<h1>([^<]*)<\/h1>/);
  let { title, desc, h1 } = spec;
  if (spec.state) {
    const name = get(/<h1>([^<]*) road conditions right now<\/h1>/);
    const dot = (oldDesc.match(/road conditions from ([^:]+):/) || [])[1];
    if (!name || !dot) { console.log('cannot read name or agency on', page); continue; }
    ({ title, desc } = W.snowState(name, dot));
  }
  const swap = (from, to, label) => { if (from && to && from !== to) html = html.split(from).join(to); };
  if (title) { const t = esc(title); swap(oldTitle, t); swap(oldOg, t); swap(jsonEsc(oldTitle.replace(/&amp;/g, '&')), jsonEsc(title)); }
  if (desc) { const d = esc(desc); swap(oldDesc, d); }
  if (h1) swap(`<h1>${oldH1}</h1>`, `<h1>${esc(h1)}</h1>`);
  const before = fs.readFileSync(file, 'utf8');
  if (html !== before) { fs.writeFileSync(file, html); changed++; console.log('retitled', page); }
}
console.log(`${changed} pages changed`);
