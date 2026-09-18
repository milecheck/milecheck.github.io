#!/usr/bin/env node
// add-guide-sponsor-slots.mjs — put the one sponsor slot on the 50 state mile-marker
// guides (blog/mile-markers-<state>.html). Those pages are static files with no
// generator, so this script is the generator step for them: it strips any earlier
// slot and re-inserts from data/sponsors.json, so re-running after a sale is safe.
// Key: guide:<state-slug> (guide:alabama). Leah, 2026-09-17: "all states should."
// Run from the site root after any sponsors.json change, with the other generators.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const SPON = require('./lib/sponsor-slot');

const dir = path.join(process.cwd(), 'blog');
const files = fs.readdirSync(dir).filter(f => /^mile-markers-[a-z-]+\.html$/.test(f) && f !== 'mile-markers-vs-gps.html').sort();
const START = '<!-- spon:start -->', END = '<!-- spon:end -->';
const strip = (html) => html
  .replace(new RegExp(START + '[\\s\\S]*?' + END + '\\n?', 'g'), '')
  .replace(/\n?\s*\/\* spon:css \*\/[\s\S]*?\/\* \/spon:css \*\//g, '');

let n = 0;
for (const f of files) {
  const slug = f.replace(/^mile-markers-/, '').replace(/\.html$/, '');
  const fp = path.join(dir, f);
  let html = strip(fs.readFileSync(fp, 'utf8'));
  const h1 = html.match(/<h1 class="article-title">([^<]+)<\/h1>/);
  const name = h1 ? h1[1].replace(/^Highway Mile Markers in /, '') : slug;
  const sp = SPON.slot({ kind: 'guide', slug, name });
  const anchor = '<p class="article-eyebrow">';
  if (!html.includes(anchor) || !html.includes('</style>') || !html.includes('</body>')) { console.error('skip (shape)', f); continue; }
  html = html.replace(anchor, START + '\n' + sp.html + '\n' + END + '\n      ' + anchor);
  html = html.replace('</style>', '/* spon:css */\n' + sp.css + '\n/* /spon:css */\n  </style>');
  html = html.replace('</body>', START + sp.js + END + '\n</body>');
  fs.writeFileSync(fp, html);
  n++;
}
console.log(`guide slots: ${n} state pages`);
console.log(SPON.summary());
