#!/usr/bin/env node
// Keep the existing state guides connected to the working map for that state.
// Run after generators. Only known states and existing guides are touched.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const states = require('./road-conditions/states.cjs');
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const strip = /\s*<!-- state-map:start -->[\s\S]*?<!-- state-map:end -->/g;
let changed = 0;
for (const state of states) {
  const slug = state.name.toLowerCase().replace(/\s+/g, '-');
  const file = resolve(ROOT, `blog/mile-markers-${slug}.html`);
  if (!existsSync(file)) continue;
  const original = readFileSync(file, 'utf8');
  const href = `/maps/mile-markers/?state=${state.code}`;
  let html = original.replace(strip, '');
  // Update existing bare map links, including those in related blocks.
  html = html.replace(/href="(?:\.\.\/|\/|https:\/\/milecheckapp\.com\/)maps\/mile-markers\/(?:\?state=[A-Z]{2})?"/g,
    `href="${href}"`);
  const card = `\n<!-- state-map:start -->
      <aside class="mc-state-map" aria-label="${esc(state.name)} mile marker map" style="margin:16px 0 22px;padding:16px;border:1px solid #cfe3d7;border-radius:10px;background:#f3f9f6;">
        <a href="${href}" style="display:inline-block;font-weight:700;color:#006b46;font-size:17px;line-height:1.4;">Find mile markers on your ${esc(state.name)} highway</a>
        <p style="margin:6px 0 0;font-size:14px;line-height:1.5;color:#3a444d;">Open the map in ${esc(state.name)}, then choose your highway. Tap a marker for its road and mile. Positions are approximate.</p>
      </aside>
<!-- state-map:end -->`;
  // Put the tool before the article text, keeping the title and its metadata intact.
  html = html.replace(/(<div class="article-body">)/, `$1${card}`);
  if (html !== original) { writeFileSync(file, html); changed++; }
}
console.log(`state map links: ${changed} guides updated`);

// Searchers asking for their mile marker should reach the working web tool before
// reading a long explanation. This is a link, never an automatic location request.
for (const slug of ['what-is-my-mile-marker', 'can-google-maps-show-mile-markers']) {
  const file = resolve(ROOT, slug, 'index.html');
  if (!existsSync(file)) continue;
  const original = readFileSync(file, 'utf8');
  let html = original.replace(/\s*<!-- mile-map-action:start -->[\s\S]*?<!-- mile-map-action:end -->/g, '');
  const action = `\n<!-- mile-map-action:start -->
    <aside style="margin:16px 0 22px;padding:16px;border:1px solid #cfe3d7;border-radius:10px;background:#f3f9f6;" aria-label="Find a mile marker">
      <a href="/what-mile-marker-am-i-at/" style="display:inline-block;font-weight:700;color:#006b46;font-size:17px;line-height:1.4;">What mile marker am I at?</a>
      <p style="margin:6px 0 0;font-size:14px;line-height:1.5;color:#3a444d;">Use your location to find a nearby recorded marker. Or <a href="/maps/mile-markers/">choose a highway on the map</a>.</p>
    </aside>
<!-- mile-map-action:end -->`;
  html = html.replace(/(<p class="lede">[\s\S]*?<\/p>)/, `$1${action}`);
  if (html !== original) writeFileSync(file, html);
}
