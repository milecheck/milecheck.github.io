#!/usr/bin/env node
// gen-pass-roads.mjs — the road geometry each pass and road page uses to draw an
// alert along the road instead of as one dot.
//
// Leah, 2026-10-01, on the Snoqualmie page: "show the line between MPs?" The DOT feed
// gives an alert a start and an end (milepost 54 to 47). A straight line between
// them crosses Keechelus Lake. This writes <page>/roads.json from the OpenStreetMap
// geometry the map sheets already cache (data/map-sheets/<slug>.json, built by
// gen-map-sheets.mjs): the roads the page is about plus every freeway and highway
// in the frame, as plain [lat, lon] runs. The page joins the runs where they share an
// endpoint and walks the shortest way between the alert's two ends.
//
//   node scripts/gen-pass-roads.mjs            # every page with a cache file
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { PASSES, AREAS } = require('./gen-pass-pages.js');

let n = 0;
for (const p of [...PASSES, ...AREAS]) {
  const file = path.join('data/map-sheets', p.slug + '.json');
  if (!existsSync(file)) { console.log('skip ' + p.slug + ': no map-sheet cache'); continue; }
  const d = JSON.parse(readFileSync(file, 'utf8'));
  const seen = new Set();
  const runs = [];
  // The roads the page is about, plus freeways, inside the page's own radius. City
  // arterials stay out: Little Cottonwood's file was 207 KB with Salt Lake City in it.
  const rad = Math.PI / 180;
  const inside = (q) => { const dy = (q[0] - p.lat) * 111, dx = (q[1] - p.lon) * 111 * Math.cos(p.lat * rad); return Math.sqrt(dx * dx + dy * dy) <= d.radiusKm * 1.1; };
  for (const r of [...(d.featured || []), ...d.roads.filter((x) => /^(motorway|trunk|named)$/.test(x.cls))]) {
    const key = r.pts[0].join(',') + '|' + r.pts[r.pts.length - 1].join(',') + '|' + r.pts.length;
    if (seen.has(key) || r.pts.length < 2 || !r.pts.some(inside)) continue;
    seen.add(key);
    runs.push(r.pts.map(([a, b]) => [+a.toFixed(5), +b.toFixed(5)]));
  }
  const out = path.join(p.out || path.join('passes', p.slug), 'roads.json');
  writeFileSync(out, JSON.stringify({ built: d.fetched, credit: 'OpenStreetMap contributors, ODbL', runs }));
  n++;
  console.log('wrote ' + out + '  (' + runs.length + ' runs, ' + runs.reduce((s, r) => s + r.length, 0) + ' points)');
}
console.log('\n' + n + ' road files.');
