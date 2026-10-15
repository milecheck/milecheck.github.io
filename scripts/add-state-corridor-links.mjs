#!/usr/bin/env node
// Connect finite route/state utilities to existing state landing pages. No held
// pass/corridor overview pages are touched. Re-run after generators.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const rows = JSON.parse(readFileSync(resolve(root, 'data/state-corridors.json'), 'utf8'));
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
let changed = 0;
for (const row of rows) {
  const url = `/corridors/i-75/${row.slug}/`;
  if (!existsSync(resolve(root, url.slice(1), 'index.html'))) continue;
  const name = row.slug[0].toUpperCase() + row.slug.slice(1);
  for (const rel of [`road-conditions/${row.slug}/index.html`, `blog/mile-markers-${row.slug}.html`]) {
    const file = resolve(root, rel);
    if (!existsSync(file)) continue;
    const original = readFileSync(file, 'utf8');
    let html = original.replace(/\s*<!-- state-corridor-link:start -->[\s\S]*?<!-- state-corridor-link:end -->/g, '');
    const link = `\n<!-- state-corridor-link:start --><p style="font-size:15px;margin:12px 0 18px;"><a href="${esc(url)}" style="color:#006b46;font-weight:700;">Check I-75 reports and cameras in ${esc(name)}</a></p><!-- state-corridor-link:end -->`;
    // Put the new utility next to existing related links, or beneath the title.
    if (html.includes('<!-- toplinks:end -->')) html = html.replace('<!-- toplinks:end -->', '<!-- toplinks:end -->' + link);
    else html = html.replace(/(<\/h1>)/, '$1' + link);
    if (html !== original) { writeFileSync(file, html); changed++; }
  }
}
console.log(`state corridor links: ${changed} pages updated`);
