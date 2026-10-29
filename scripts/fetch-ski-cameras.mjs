// fetch-ski-cameras.mjs — saves the DOT cameras inside each resort's radius to data/ski-nearby-cameras.json,
// so /ski/<slug>/ can print them as text a crawler reads (the live list on the page is filled in by script).
// Run: node scripts/fetch-ski-cameras.mjs [slug ...]   (default: the pages in gen-ski-resort-pages.js FACTS_FOR)
// Then: node scripts/gen-ski-resort-pages.js <slug ...> && node scripts/finish-pages.mjs --pages-only
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const RESORTS = require('./ski-resorts.cjs');
const OUT = 'data/ski-nearby-cameras.json';
const DEFAULT = ['copper-mountain', 'telluride', 'discovery', 'mt-bachelor'];
const slugs = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT;
const hav = (a, b, c, d) => { const r = x => x * Math.PI / 180, R = 3958.8, dLat = r(c - a), dLon = r(d - b); const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a)) * Math.cos(r(c)) * Math.sin(dLon / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };
const out = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : {};
const feeds = {};
for (const slug of slugs) {
  const r = RESORTS.find(x => x.slug === slug);
  if (!r) { console.error('no resort', slug); continue; }
  if (!feeds[r.state]) {
    const res = await fetch(`https://api.milecheckapp.com/cameras?state=${r.state}`, { headers: { 'User-Agent': 'MileCheck site build (info@milecheckapp.com)' } });
    if (!res.ok) throw new Error(`${r.state} cameras HTTP ${res.status}`);
    feeds[r.state] = (await res.json()).cameras || [];
  }
  const cams = feeds[r.state].filter(c => c.isActive !== false && isFinite(+c.lat) && +c.lat && (c.imageUrl || c.streamUrl))
    .map(c => ({ title: String(c.title || '').trim(), route: String(c.route || '').trim(), direction: c.direction || '', mile: c.mile ?? null, lat: Math.round(+c.lat * 1e4) / 1e4, lon: Math.round(+c.lon * 1e4) / 1e4, d: hav(r.lat, r.lon, +c.lat, +c.lon) }))
    .filter(c => c.d <= r.radius && c.title).sort((a, b) => a.d - b.d)
    .reduce((acc, c) => { // several views on one pole share a title up to "· Looking North": one row, with the view count
      const base = c.title.replace(/\s*·\s*Looking.*$/i, '').trim();
      const hit = acc.find(o => o.title.toLowerCase() === base.toLowerCase());
      if (hit) hit.views++; else acc.push({ ...c, title: base, views: 1 });
      return acc;
    }, [])
    .slice(0, 10)
    .map(c => ({ ...c, d: Math.round(c.d * 10) / 10 }));
  out[slug] = { read: new Date().toISOString().slice(0, 10), radius: r.radius, count: cams.length, cams };
  console.log(slug, r.state, cams.length, 'cameras within', r.radius, 'mi');
}
writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n');
