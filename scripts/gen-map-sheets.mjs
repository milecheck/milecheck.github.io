#!/usr/bin/env node
// gen-map-sheets.mjs — a two-sided printable map for every pass and mountain road page.
//
// Leah, 2026-09-28, after printing the Snoqualmie page and getting eight pages with a
// cropped map: "printing the whole thing isn't ideal... it would be nice if it was like
// those medium sized tourism maps... major roads and POIs... and then a page 2 that has
// some info they'll need (would be printed on back of map flyer)."
//
// Front: the map. Major roads drawn bold over the USGS topo base, the destination as a
// yellow star, town names, and numbered stops a driver would pull into (visitor center,
// rest area, fuel, ski area, sno-park, campground, trailhead, picnic area, viewpoint).
// Where stops pile up, a zoomed inset. Back: the road write-up from the page's own
// config, the chain table where there is one, and a QR code to the live page.
// Letter, landscape, one sheet, two sides.
//
//   node scripts/gen-map-sheets.mjs                 # every pass and area, from cache
//   node scripts/gen-map-sheets.mjs snoqualmie      # one page
//   node scripts/gen-map-sheets.mjs --refresh       # refetch OpenStreetMap
//   node scripts/gen-map-sheets.mjs --offline       # cache only, no requests
//   node scripts/print-map-sheets.mjs               # then render the PDFs the pages link to
//
// Roads, towns and stops come from OpenStreetMap (ODbL, credited on the sheet) through
// the Overpass API and are cached in data/map-sheets/<slug>.json, so a rebuild is offline
// and gives the same sheet. No stop is typed in by hand. The base map is USGS The
// National Map, which is public domain, because this sheet is meant to be handed out.
// Everything on the map is placed here, at build time, in pixels. The page script only draws.
// Writes <page dir>/map/index.html. Run the usual post-processors afterwards.
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { PASSES, AREAS } = require('./gen-pass-pages.js');

const OVERPASS = [
  'https://overpass-api.de/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];
const UA = 'milecheck-map-sheets (mountains@milecheckapp.com)';
const args = process.argv.slice(2);
const refresh = args.includes('--refresh');
const offline = args.includes('--offline');
const only = args.filter((a) => !a.startsWith('--'));
const CACHE = 'data/map-sheets';
const CACHE_V = 3;
const PACE = 6000;   // between requests. The public servers throttle an address that asks faster.

const rad = Math.PI / 180;
const km = (a, b) => {
  const dLat = (b[0] - a[0]) * rad, dLon = (b[1] - a[1]) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
};
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const inWords = (iso) => { const [y, m, d] = iso.split('-').map(Number); return ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][m - 1] + ' ' + d + ', ' + y; };
const localDate = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };

// The main server gives each address two slots and holds a request until one is free,
// so ask it first when that will be. A server that says it is busy (429, 504) gets a wait
// and another try. One that fails goes to the back of the line. Killing this script
// mid-query leaves the query running on their side and uses up a slot, so let it finish.
async function slot(host) {
  if (!/overpass-api\.de/.test(host)) return;
  for (let i = 0; i < 12; i++) {
    try {
      const t = await (await fetch(host.replace('interpreter', 'status'), { headers: { 'User-Agent': UA, Accept: '*/*' }, signal: AbortSignal.timeout(15000) })).text();
      if (/slots? available now/.test(t)) return;
      const waits = [...t.matchAll(/in (\d+) seconds/g)].map((m) => +m[1]);
      if (!waits.length) { if (i >= 2) return; await sleep(10000); continue; }   // an error page, not a status
      await sleep((Math.min(...waits, 60) + 1) * 1000);
    } catch { return; }
  }
}
async function overpass(query, optional = false) {
  let last;
  for (let i = 0; i < (optional ? 3 : 8); i++) {
    const host = OVERPASS[0];
    try {
      await slot(host);
      const res = await fetch(host, { method: 'POST', headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'data=' + encodeURIComponent(query), signal: AbortSignal.timeout(/overpass-api\.de/.test(host) ? 120000 : 45000) });
      if (res.status === 429 || res.status === 504) {
        last = new Error(host + ' ' + res.status);
        console.log('  ' + new URL(host).host + ' is busy (' + res.status + '), waiting ' + (15 + i * 10) + ' s');
        await sleep(15000 + i * 10000);
        continue;
      }
      if (!res.ok) throw new Error(host + ' ' + res.status);
      const j = await res.json();
      if (j.remark && /error|timed out/i.test(j.remark)) throw new Error(host + ' ' + j.remark);
      return j.elements || [];
    } catch (e) {
      last = e;
      console.log('  ' + new URL(host).host + ': ' + e.message);
      OVERPASS.push(OVERPASS.shift());
      await sleep(3000);
    }
  }
  if (optional) return null;
  throw last || new Error('no server answered');
}

// ---- what counts as a stop ----
// sep is how far apart two stops of the same kind must be, as a share of the radius.
const CATS = {
  visitor:   { label: 'Visitor center', color: '#1d4ed8', reachKm: 3,   cap: 2, pri: 1, sep: 1 / 30, has: /visitor|information/i },
  rest:      { label: 'Rest area',      color: '#0f7a4f', reachKm: 1,   cap: 3, pri: 1, sep: 1 / 6,  has: /rest (area|stop)/i },
  services:  { label: 'Service area',   color: '#b45309', reachKm: 1,   cap: 2, pri: 1, sep: 1 / 6,  has: /service area|travel (plaza|center)/i },
  fuel:      { label: 'Fuel',           color: '#b45309', reachKm: 1,   cap: 3, pri: 1, sep: 1 / 6,  has: /fuel|gas\b/i },
  ranger:    { label: 'Ranger station', color: '#1d4ed8', reachKm: 3,   cap: 2, pri: 2, sep: 1 / 30, has: /ranger/i },
  ski:       { label: 'Ski area',       color: '#7c3aed', reachKm: 3,   cap: 3, pri: 2, sep: 1 / 30, has: /ski/i },
  snopark:   { label: 'Sno-park',       color: '#0369a1', reachKm: 3,   cap: 2, pri: 2, sep: 1 / 30, has: /sno-?park/i },
  camp:      { label: 'Campground',     color: '#15803d', reachKm: 1.5, cap: 4, pri: 3, sep: 1 / 15, has: /camp/i },
  trailhead: { label: 'Trailhead',      color: '#92400e', reachKm: 1.5, cap: 5, pri: 3, sep: 1 / 15, has: /trail/i },
  picnic:    { label: 'Picnic area',    color: '#15803d', reachKm: 1.5, cap: 2, pri: 4, sep: 1 / 15, has: /picnic/i },
  view:      { label: 'Viewpoint',      color: '#be123c', reachKm: 1.5, cap: 3, pri: 4, sep: 1 / 15, has: /view|overlook|vista/i },
};
const TOTAL_CAP = 18;
function categorise(t) {
  const name = t.name || '';
  if (/sno-?park/i.test(name)) return 'snopark';
  if (t.tourism === 'information') return /^(office|visitor_centre)$/.test(t.information || '') ? 'visitor' : null;
  if (t.amenity === 'ranger_station') return 'ranger';
  if (t.highway === 'rest_area') return 'rest';
  if (t.highway === 'services') return 'services';
  if (t.amenity === 'fuel') return 'fuel';
  if (t.landuse === 'winter_sports') return name && !/backcountry|training|club/i.test(name) ? 'ski' : null;
  if (t.highway === 'trailhead') return name ? 'trailhead' : null;
  if (t.tourism === 'camp_site') return /campground/i.test(name) && !/walk-in|group/i.test(name) ? 'camp' : null;
  if (t.tourism === 'picnic_site') return name && !/shelter/i.test(name) ? 'picnic' : null;
  if (t.tourism === 'viewpoint') return name ? 'view' : null;
  return null;
}

// ---- roads ----
const MAJOR = new Set(['motorway', 'trunk', 'primary', 'named']);
const REACH = 1.4;
function roadLabel(t) {
  const ref = (t.ref || '').split(';')[0].trim();
  if (ref) return ref.replace(/^I (\d+)/, 'I-$1').replace(/^WA (\d+)/, 'SR $1').replace(/^AK (\d+)/, 'AK-$1');
  return t.name || '';
}
function thin(pts, stepKm) {
  if (pts.length < 3) return pts;
  const out = [pts[0]]; let acc = 0;
  for (let i = 1; i < pts.length - 1; i++) { acc += km(pts[i - 1], pts[i]); if (acc >= stepKm) { out.push(pts[i]); acc = 0; } }
  out.push(pts[pts.length - 1]);
  return out;
}
function namedRoads(p) {
  const bits = String(p.eyebrow || p.route || '').split(' · ').map((x) => x.trim()).filter(Boolean);
  return bits.filter((b) => /\b(road|highway|hwy|rd|parkway)\b/i.test(b)).map((b) => b.replace(/\s+/g, ' '));
}
// The roads the sheet is about: the page's mapRoads, else every route number and named
// road in its eyebrow. Stops are chosen along these, not along every road in the frame
// (review, 9/30: "Baker includes stops across the Canadian border. Little Cottonwood
// includes Park City stops"). A route number matches however OpenStreetMap spells it.
const isRef = (x) => /^(I|US|SR|WA|OR|CA|UT|CO|AK|NF|FR|FS|BC|CR)[ -]?\d+[A-Z]?$/i.test(x);
function featuredRoads(p) {
  const bits = (p.mapRoads || String(p.eyebrow || p.route || '').split(' · ')).map((x) => String(x).trim()).filter(Boolean);
  return bits.filter((b) => isRef(b) || /\b(road|highway|hwy|rd|parkway)\b/i.test(b));
}
const normRef = (x) => String(x).replace(/[^a-z0-9]/gi, '').toLowerCase().replace(/^(wa|ut|co|or|ca)(?=\d)/, 'sr').replace(/^(fr|fs)(?=\d)/, 'nf');
function refAlternatives(ref) {
  const m = ref.match(/^([A-Z]+)[ -]?(\d+[A-Z]?)$/i);
  if (!m) return [ref];
  const [, pre, num] = [m[0], m[1].toUpperCase(), m[2]];
  const prefixes = { SR: ['SR', 'WA', 'UT', 'OR', 'CA', 'CO'], WA: ['WA', 'SR'], UT: ['UT', 'SR'], OR: ['OR', 'SR'], CA: ['CA', 'SR'], CO: ['CO', 'SR'], FR: ['FR', 'NF', 'FS'], NF: ['NF', 'FR', 'FS'], FS: ['FS', 'NF', 'FR'] }[pre] || [pre];
  return prefixes.flatMap((x) => [x + ' ' + num, x + '-' + num]);
}
function isFeatured(label, cls, names, refs) {
  if (cls === 'named') return true;
  if (names.some((n) => n.toLowerCase() === String(label).toLowerCase())) return true;
  return refs.some((r) => normRef(r) === normRef(label));
}
// One query, the whole far box, any highway class: the road the sheet is about must not
// stop at the radius. Denali Park Road did (review, 9/30), 15 miles short of AK-3.
async function fetchFeatured(p, d) {
  const feat = featuredRoads(p);
  const refs = feat.filter(isRef), names = feat.filter((x) => !isRef(x));
  if (!feat.length) return [];
  const reachKm = d.radiusKm * REACH;
  const far = '(' + [p.lat - reachKm / 111, p.lon - reachKm / (111 * Math.cos(p.lat * rad)), p.lat + reachKm / 111, p.lon + reachKm / (111 * Math.cos(p.lat * rad))].map((x) => x.toFixed(4)).join(',') + ')';
  const esc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const clauses = [];
  if (refs.length) clauses.push(`way["highway"]["ref"~"(^|;)\\s*(${refs.flatMap(refAlternatives).map(esc).join('|')})\\s*(;|$)"]${far};`);
  if (names.length) clauses.push(`way["highway"]["name"~"^(${names.map(esc).join('|')})$",i]${far};`);
  const raw = await overpass(`[out:json][timeout:120];(${clauses.join('')});out geom tags;`);
  const step = d.radiusKm > 60 ? 0.5 : 0.18;
  return raw.filter((w) => w.geometry && !/^(footway|path|track|cycleway|steps|service|proposed|construction)$/.test(w.tags?.highway || '')).map((w) => {
    const t = w.tags || {};
    const cls = /^(motorway|trunk|primary)$/.test(t.highway) ? t.highway : 'named';
    return { label: roadLabel(t), cls, ref: !!t.ref, pts: thin(w.geometry.map((g) => [+g.lat.toFixed(5), +g.lon.toFixed(5)]), step) };
  });
}

async function build(p) {
  const centre = [p.lat, p.lon];
  const radiusKm = p.kind === 'area' ? p.rMi * 1.609344 : p.r;
  // Stops and minor roads stay inside the page's own radius. Major roads and towns reach
  // 1.4 times further, so the map can run out to the town at each end of the drive.
  const reachKm = radiusKm * REACH;
  const box = (r) => '(' + [p.lat - r / 111, p.lon - r / (111 * Math.cos(p.lat * rad)), p.lat + r / 111, p.lon + r / (111 * Math.cos(p.lat * rad))].map((x) => x.toFixed(4)).join(',') + ')';
  const near = box(radiusKm), far = box(reachKm);
  const t0 = Date.now();
  const lap = (what) => console.log('  ' + p.slug + ': ' + what + ' at ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s');
  const names = namedRoads(p);
  const nameClause = names.length ? `way["highway"]["name"~"^(${names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '.')).join('|')})$",i]${near};` : '';
  const roadsRaw = await overpass(`[out:json][timeout:120];(way["highway"~"^(motorway|trunk)$"]${far};way["highway"="primary"]${near};${nameClause});out geom tags;`);
  await sleep(PACE);
  // Minor roads are a nicety. Around a city the answer is too big for the public servers,
  // and a city's minor roads would be thrown out below anyway, so a failure here is fine.
  const minorRaw = await overpass(`[out:json][timeout:60];way["highway"~"^(secondary|tertiary)$"]${near};out geom tags;`, true);
  lap(roadsRaw.length + ' major ways, ' + (minorRaw ? minorRaw.length : 'no') + ' minor ways');
  if (minorRaw) roadsRaw.push(...minorRaw); else console.log('  ' + p.slug + ': no answer for minor roads, drawn without them');
  await sleep(PACE);
  const poisRaw = await overpass(`[out:json][timeout:120];(nwr["highway"~"^(rest_area|services|trailhead)$"]${near};nwr["amenity"~"^(fuel|ranger_station)$"]${near};nwr["tourism"~"^(viewpoint|information|camp_site|picnic_site)$"]["name"]${near};nwr["landuse"="winter_sports"]["name"]${near};node["place"~"^(city|town|village)$"]["name"]${far};node["place"="hamlet"]["name"]${near};);out center tags;`);

  lap(poisRaw.length + ' places and stops');
  const step = radiusKm > 60 ? 0.5 : 0.18;
  let roads = [];
  for (const w of roadsRaw) {
    if (!w.geometry) continue;
    const t = w.tags || {};
    const pts = w.geometry.map((g) => [+g.lat.toFixed(5), +g.lon.toFixed(5)]);
    const named = names.some((n) => n.toLowerCase() === String(t.name || '').toLowerCase());
    const cls = named && !/^(motorway|trunk|primary)$/.test(t.highway) ? 'named' : t.highway;
    if (!pts.some((q) => km(centre, q) <= (/^(motorway|trunk)$/.test(cls) ? reachKm : radiusKm * 1.05))) continue;
    roads.push({ label: roadLabel(t), cls, ref: !!t.ref, pts: thin(pts, step) });
  }
  // A town's street grid is not what this map is for. Minor roads are dropped from any
  // 5 km cell that holds more than 25 km of them, and a city's arterials with them.
  const cell = (q) => Math.floor(q[0] * 111 / 5) + ':' + Math.floor(q[1] * 111 * Math.cos(p.lat * rad) / 5);
  const load = new Map();
  const minor = (r) => r.cls === 'secondary' || r.cls === 'tertiary';
  for (const r of roads) if (minor(r)) for (let i = 1; i < r.pts.length; i++) { const k = cell(r.pts[i]); load.set(k, (load.get(k) || 0) + km(r.pts[i - 1], r.pts[i])); }
  roads = roads.filter((r) => !(minor(r) || r.cls === 'primary') || !r.pts.some((q) => (load.get(cell(q)) || 0) > (minor(r) ? 25 : 45)));

  const verts = roads.filter((r) => r.cls !== 'tertiary').flatMap((r) => r.pts);
  const toRoad = (q) => verts.reduce((m, v) => Math.min(m, km(q, v)), Infinity);

  const seen = new Set();
  const pois = [], places = [];
  for (const e of poisRaw) {
    const t = e.tags || {};
    const lat = e.lat ?? e.center?.lat, lon = e.lon ?? e.center?.lon;
    if (lat == null) continue;
    const q = [lat, lon];
    if (t.place) {
      if (km(centre, q) > (t.place === 'hamlet' ? radiusKm : reachKm) || toRoad(q) > 3) continue;
      places.push({ name: t.name, rank: ['city', 'town', 'village', 'hamlet'].indexOf(t.place), pop: +t.population || 0, lat: +lat.toFixed(5), lon: +lon.toFixed(5) });
      continue;
    }
    const cat = categorise(t);
    if (!cat) continue;
    if (km(centre, q) > radiusKm) continue;
    // Reach is judged at page time against the roads the sheet is about (pickStops).
    // A loose cut here only keeps the cache small.
    if (toRoad(q) > 8) continue;
    let given = (t.name || '').replace(/\s+/g, ' ').trim();
    if (/camp host|private|employee/i.test(given)) continue;
    if (/^(water|toilets?|restrooms?|parking|info(rmation)?|kiosk|fuel|gas)$/i.test(given)) given = '';
    const name = given.length > 3 ? given : (t.brand || t.operator || given || CATS[cat].label);
    const key = cat + '|' + name.toLowerCase();
    if (seen.has(key) && name !== CATS[cat].label) continue;
    seen.add(key);
    pois.push({ name, cat, lat: +lat.toFixed(5), lon: +lon.toFixed(5), d: +km(centre, q).toFixed(2) });
  }
  lap('kept ' + roads.length + ' roads, ' + pois.length + ' stops, ' + places.length + ' towns');
  return { v: CACHE_V, fetched: localDate(), centre, radiusKm: +radiusKm.toFixed(1), roads, pois, places, ...(minorRaw ? {} : { minorMissing: true }) };
}

// The featured roads join the cached roads. A way already there under the same label
// with the same ends is the same way.
function mergeFeatured(d) {
  const key = (r) => r.label + '|' + r.pts[0].join(',') + '|' + r.pts[r.pts.length - 1].join(',');
  const have = new Set(d.roads.map(key));
  const roads = d.roads.slice();
  for (const r of d.featured || []) if (!have.has(key(r))) { roads.push(r); have.add(key(r)); }
  return { ...d, roads };
}

// ---- layout, in pixels ----
const TILE = 256;
const mercX = (lon) => (lon + 180) / 360;
const mercY = (lat) => { const s = Math.sin(lat * rad); return 0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI); };
const unY = (y) => Math.atan(Math.sinh(Math.PI * (1 - 2 * y))) / rad;
function boundsOf(pts) { return { s: Math.min(...pts.map((q) => q[0])), n: Math.max(...pts.map((q) => q[0])), w: Math.min(...pts.map((q) => q[1])), e: Math.max(...pts.map((q) => q[1])) }; }
function view(b, w, h, margin, maxZ) {
  const x0 = mercX(b.w), x1 = mercX(b.e), y0 = mercY(b.n), y1 = mercY(b.s);
  const fit = Math.min(Math.log2((w - 2 * margin) / (Math.max(x1 - x0, 1e-9) * TILE)), Math.log2((h - 2 * margin) / (Math.max(y1 - y0, 1e-9) * TILE)));
  const z = Math.min(maxZ, Math.floor(fit * 4) / 4);
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, k = TILE * 2 ** z;
  const lat = unY(cy), lon = cx * 360 - 180;
  return { z, w, h, lat: +lat.toFixed(5), lon: +lon.toFixed(5), px: (la, lo) => [(mercX(lo) - cx) * k + w / 2, (mercY(la) - cy) * k + h / 2], mPerPx: 40075016.686 * Math.cos(lat * rad) / k };
}
function declutter(items, w, h, obstacles, minD = 23) {
  const d = items.map((q) => ({ x: q.x, y: q.y }));
  for (let it = 0; it < 400; it++) {
    let moved = false;
    for (let i = 0; i < d.length; i++) for (let j = i + 1; j < d.length; j++) {
      let vx = d[j].x - d[i].x, vy = d[j].y - d[i].y, dist = Math.hypot(vx, vy);
      if (dist >= minD) continue;
      if (dist < 0.01) { const a = (i + 1) * 2.399963; vx = Math.cos(a); vy = Math.sin(a); dist = 1; }
      const push = (minD - dist) / 2 + 0.5; vx /= dist; vy /= dist;
      d[i].x -= vx * push; d[i].y -= vy * push; d[j].x += vx * push; d[j].y += vy * push; moved = true;
    }
    for (const q of d) {
      for (const o of obstacles) {
        if (o.r) {
          let vx = q.x - o.x, vy = q.y - o.y, dist = Math.hypot(vx, vy);
          if (dist >= o.r) continue;
          if (dist < 0.01) { vx = 0; vy = 1; dist = 1; }
          q.x = o.x + vx / dist * o.r; q.y = o.y + vy / dist * o.r; moved = true;
        } else if (q.x > o.x0 && q.x < o.x1 && q.y > o.y0 && q.y < o.y1) {
          const e = [[q.x - o.x0, 'x', o.x0], [o.x1 - q.x, 'x', o.x1], [q.y - o.y0, 'y', o.y0], [o.y1 - q.y, 'y', o.y1]].sort((a, b) => a[0] - b[0])[0];
          q[e[1]] = e[2]; moved = true;
        }
      }
      q.x = clamp(q.x, 14, w - 14); q.y = clamp(q.y, 14, h - 14);
    }
    if (!moved) break;
  }
  return d;
}
const SHEET_W = 988, SHEET_H = 748;
function niceScale(mPerPx) {
  for (const mi of [0.25, 0.5, 1, 2, 5, 10, 20, 50]) { const px = mi * 1609.344 / mPerPx; if (px >= 70) return { mi, px: Math.round(px) }; }
  return { mi: 50, px: Math.round(50 * 1609.344 / mPerPx) };
}

function pickStops(p, d) {
  const picked = [];
  // Within reach of the roads the sheet is about. When the page names none, any road
  // that is not a local road will do.
  const feat = featuredRoads(p), refs = feat.filter(isRef), names = feat.filter((x) => !isRef(x));
  const featuredWays = d.roads.filter((r) => isFeatured(r.label, r.cls, names, refs));
  const verts = (featuredWays.length ? featuredWays : d.roads.filter((r) => r.cls !== 'tertiary')).flatMap((r) => r.pts);
  const toRoad = (q) => verts.reduce((m, v) => Math.min(m, km(q, v)), Infinity);
  for (const cat of Object.keys(CATS).sort((a, b) => CATS[a].pri - CATS[b].pri)) {
    let n = 0;
    const sep = Math.max(1, d.radiusKm * CATS[cat].sep);
    for (const raw of d.pois.filter((x) => x.cat === cat && toRoad([x.lat, x.lon]) <= CATS[x.cat].reachKm).sort((a, b) => a.d - b.d)) {
      if (n >= CATS[cat].cap || picked.length >= TOTAL_CAP) break;
      if (/camp host|private|employee/i.test(raw.name)) continue;
      const c = /^(water|toilets?|restrooms?|parking|info(rmation)?|kiosk|gas)$/i.test(raw.name) ? { ...raw, name: CATS[cat].label } : raw;
      if (picked.some((o) => km([o.lat, o.lon], [c.lat, c.lon]) < (o.cat === c.cat ? sep : 0.12))) continue;
      if (picked.some((o) => o.name.toLowerCase() === c.name.toLowerCase())) continue;
      picked.push(c); n++;
    }
  }
  return picked;
}

// The page's coordinate for a pass is good to a mile or two, which is fine for a camera
// search and wrong for a star on a printed map. OpenStreetMap maps the summit itself as
// a mountain_pass node. The star goes there when one carries the pass's name, and
// otherwise onto the nearest point of the pass's own road.
const SUMMITS_FILE = path.join(CACHE, 'summits.json');
let SUMMITS = existsSync(SUMMITS_FILE) ? JSON.parse(readFileSync(SUMMITS_FILE, 'utf8')) : null;
async function fetchSummits() {
  // a box per pass, 9 km each way: cheaper for the server than a radius
  const boxes = PASSES.map((p) => `node["mountain_pass"="yes"]["name"](${[p.lat - 0.081, p.lon - 0.081 / Math.cos(p.lat * rad), p.lat + 0.081, p.lon + 0.081 / Math.cos(p.lat * rad)].map((x) => x.toFixed(4)).join(',')});`).join('');
  const els = await overpass(`[out:json][timeout:90];(${boxes});out body;`);
  SUMMITS = els.filter((e) => e.lat != null && e.tags && e.tags.name).map((e) => ({ name: e.tags.name, ele: e.tags.ele || '', lat: +e.lat.toFixed(5), lon: +e.lon.toFixed(5) }));
  writeFileSync(SUMMITS_FILE, JSON.stringify(SUMMITS, null, 1) + '\n');
  console.log('summits: ' + SUMMITS.length + ' named pass nodes near the ' + PASSES.length + ' passes');
}
function snapToRoute(p, d) {
  if (p.kind === 'area') return d.centre;
  const words = p.name.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 3 && !/^(pass|summit|tunnel|the)$/.test(w));
  const named = (SUMMITS || []).filter((n) => km(d.centre, [n.lat, n.lon]) < 9 && words.some((w) => n.name.toLowerCase().includes(w)))
    .sort((a, b) => km(d.centre, [a.lat, a.lon]) - km(d.centre, [b.lat, b.lon]))[0];
  if (named) {
    const off = km(d.centre, [named.lat, named.lon]);
    if (off > 0.15) console.log('  ' + p.slug + ': star moved ' + off.toFixed(2) + ' km to OpenStreetMap\'s "' + named.name + '"' + (named.ele ? ' (' + named.ele + ' m)' : '') + ' at ' + named.lat + ',' + named.lon);
    return [named.lat, named.lon];
  }
  const norm = (x) => String(x || '').replace(/[^a-z0-9]/gi, '').toLowerCase();
  const route = norm(String(p.route).split(' · ')[0]);
  const own = d.roads.filter((r) => norm(r.label) === route || norm(r.label) === route.replace(/^sr/, 'wa'));
  const pool = (own.length ? own : d.roads.filter((r) => MAJOR.has(r.cls))).flatMap((r) => r.pts);
  let best = null, bd = Infinity;
  for (const q of pool) { const k = km(d.centre, q); if (k < bd) { bd = k; best = q; } }
  if (!best || bd > 4 || bd < 0.15) return d.centre;
  console.log('  ' + p.slug + ': star moved ' + bd.toFixed(2) + ' km onto ' + p.route + ' at ' + best.join(','));
  return best;
}

function layout(p, d) {
  d = mergeFeatured(d);
  {
    const feat = featuredRoads(p), refs = feat.filter(isRef), names = feat.filter((x) => !isRef(x));
    d = { ...d, roads: d.roads.map((r) => (isFeatured(r.label, r.cls, names, refs) && !/^(motorway|trunk|primary)$/.test(r.cls) ? { ...r, cls: 'named' } : r)) };
  }
  d = { ...d, centre: snapToRoute(p, d) };
  const picked = pickStops(p, d);
  const pts = picked.map((x) => [x.lat, x.lon]).concat([d.centre]);
  // the nearest town in each quarter of the compass anchors the frame
  const anchors = new Map();
  for (const t of d.places) {
    if (t.rank > 1) continue;
    const q = Math.floor((((Math.atan2((t.lon - p.lon) * Math.cos(p.lat * rad), t.lat - p.lat) / rad) + 405) % 360) / 90);
    const dist = km(d.centre, [t.lat, t.lon]);
    if (!anchors.has(q) || dist < anchors.get(q).dist) anchors.set(q, { dist, t });
  }
  if (picked.length >= 3) for (const a of anchors.values()) pts.push([a.t.lat, a.t.lon]);
  let b = boundsOf(pts);
  if (pts.length < 4) { const dy = d.radiusKm * 0.6 / 111, dx = d.radiusKm * 0.6 / (111 * Math.cos(p.lat * rad)); b = { s: p.lat - dy, n: p.lat + dy, w: p.lon - dx, e: p.lon + dx }; }
  const ratio = (mercX(b.e) - mercX(b.w)) / Math.max(mercY(b.s) - mercY(b.n), 1e-9);
  const wide = ratio >= 1.55;
  const W = wide ? SHEET_W : 700, H = wide ? 486 : SHEET_H;
  const main = view(b, W, H, 46, 13);

  // number the stops the way the road runs
  const span = boundsOf(picked.length ? picked.map((x) => [x.lat, x.lon]) : pts);
  const eastWest = (mercX(span.e) - mercX(span.w)) >= (mercY(span.s) - mercY(span.n));
  picked.sort((a, c) => (eastWest ? a.lon - c.lon : c.lat - a.lat));
  const stops = picked.map((x, i) => { const [px, py] = main.px(x.lat, x.lon); return { n: i + 1, name: x.name, cat: x.cat, lat: x.lat, lon: x.lon, x: px, y: py }; });
  const star = (() => { const [x, y] = main.px(d.centre[0], d.centre[1]); return { x, y }; })();

  // The densest spot on the map gets an inset: the stop with the most stops within
  // 45 px of it, and everything else that falls inside the box that covers them.
  let pile = [];
  for (const c of stops) {
    const near = stops.filter((s) => Math.hypot(s.x - c.x, s.y - c.y) < 45);
    if (near.length > pile.length) pile = near;
  }
  let inset = null;
  if (pile.length >= 4 && main.z <= 12) {
    const iw = wide ? 330 : 290, ih = wide ? 250 : 250;
    const ipts = pile.map((s) => [s.lat, s.lon]);
    if (pile.some((s) => Math.hypot(s.x - star.x, s.y - star.y) < 40)) ipts.push(d.centre);
    const iv = view(boundsOf(ipts), iw, ih, 34, Math.min(15, main.z + 3));
    const inBox = (s) => { const [x, y] = iv.px(s.lat, s.lon); return x > 14 && x < iw - 14 && y > 14 && y < ih - 14; };
    if (iv.z - main.z >= 1 && stops.filter(inBox).length >= 3) {
      const pileBox = { x0: Math.min(...pile.map((s) => s.x)), x1: Math.max(...pile.map((s) => s.x)), y0: Math.min(...pile.map((s) => s.y)), y1: Math.max(...pile.map((s) => s.y)) };
      const majorPx = d.roads.filter((r) => MAJOR.has(r.cls)).flatMap((r) => r.pts.map((q) => main.px(q[0], q[1])));
      const corners = [['tl', 8, 8], ['tr', W - iw - 8, 8], ['bl', 8, H - ih - 8], ['br', W - iw - 8, H - ih - 8]].map(([name, x0, y0]) => {
        const r = { x0: x0 - 12, y0: y0 - 12, x1: x0 + iw + 12, y1: y0 + ih + 12 };
        const inside = (x, y) => x > r.x0 && x < r.x1 && y > r.y0 && y < r.y1;
        let score = majorPx.filter(([x, y]) => inside(x, y)).length;
        score += stops.filter((s) => !pile.includes(s) && inside(s.x, s.y)).length * 40;
        if (inside(star.x, star.y)) score += 200;
        if (!(pileBox.x1 < r.x0 || pileBox.x0 > r.x1 || pileBox.y1 < r.y0 || pileBox.y0 > r.y1)) score += 5000;
        score += Math.hypot((pileBox.x0 + pileBox.x1) / 2 - (x0 + iw / 2), (pileBox.y0 + pileBox.y1) / 2 - (y0 + ih / 2)) / 8;
        return { name, x0, y0, score };
      }).sort((a, c) => a.score - c.score);
      const c = corners[0];
      // the footprint of the inset on the main map
      const half = { x: iw / 2 * iv.mPerPx / main.mPerPx, y: ih / 2 * iv.mPerPx / main.mPerPx };
      const [fx, fy] = main.px(iv.lat, iv.lon);
      const foot = { x0: fx - half.x, y0: fy - half.y, x1: fx + half.x, y1: fy + half.y };
      const members = stops.filter(inBox);
      inset = { view: iv, w: iw, h: ih, corner: c.name, x0: c.x0, y0: c.y0, members, foot };
    }
  }

  // Points the page wants labelled on the front: a letter on the map, the words in the
  // key. They take part in the declutter with the stops, on the main map and in the
  // inset, so a note at a stop (the SR 504 closure, at the South Coldwater trailhead)
  // is not hidden under the stop's pin (review, 9/30).
  const notes = [];
  for (const note of p.mapNotes || []) {
    let ll = [note.lat, note.lon];
    if (note.snap) {
      const way = d.roads.filter((r) => normRef(r.label) === normRef(note.snap) || r.label.toLowerCase() === note.snap.toLowerCase()).flatMap((r) => r.pts);
      let best = null, bd = Infinity;
      for (const q of way) { const k = km(ll, q); if (k < bd) { bd = k; best = q; } }
      if (best && bd < 3) ll = best;
    }
    const [x, y] = main.px(ll[0], ll[1]);
    if (x < 6 || x > W - 6 || y < 6 || y > H - 6) continue;
    notes.push({ label: note.label, ll, x, y, letter: String.fromCharCode(65 + notes.length) });
  }

  const onMain = stops.filter((s) => !inset || !inset.members.includes(s));
  const obstacles = [{ x: star.x, y: star.y, r: 24 }];
  if (inset) { obstacles.push({ x0: inset.x0 - 14, y0: inset.y0 - 14, x1: inset.x0 + inset.w + 14, y1: inset.y0 + inset.h + 14 }); obstacles.push({ x0: inset.foot.x0 - 13, y0: inset.foot.y0 - 13, x1: inset.foot.x1 + 13, y1: inset.foot.y1 + 13 }); }
  // A note inside the inset's footprint stays on the main map too: it marks where the
  // inset is, and the footprint is drawn as a box there, not as pins.
  const mainItems = [...onMain, ...notes];
  declutter(mainItems, W, H, obstacles).forEach((q, i) => { mainItems[i].sx = q.x; mainItems[i].sy = q.y; });
  if (inset) {
    const iv = inset.view;
    const inInset = (ll) => { const [x, y] = iv.px(ll[0], ll[1]); return x > 14 && x < inset.w - 14 && y > 14 && y < inset.h - 14; };
    inset.notes = notes.filter((q) => inInset(q.ll));
    const items = [...inset.members.map((s) => ({ s, ll: [s.lat, s.lon] })), ...inset.notes.map((q) => ({ s: q, ll: q.ll }))].map((it) => { const [x, y] = iv.px(it.ll[0], it.ll[1]); return { s: it.s, x, y }; });
    const [sx, sy] = iv.px(d.centre[0], d.centre[1]);
    inset.star = sx > 0 && sx < inset.w && sy > 0 && sy < inset.h ? { x: sx, y: sy } : null;
    declutter(items, inset.w, inset.h, inset.star ? [{ x: sx, y: sy, r: 26 }] : [], 24).forEach((q, i) => { items[i].s.ix = items[i].x; items[i].s.iy = items[i].y; items[i].s.isx = q.x; items[i].s.isy = q.y; });
  }

  // what is already taken, for placing text
  const taken = [];
  const hit = (r) => r.x0 < 4 || r.y0 < 4 || r.x1 > W - 4 || r.y1 > H - 4 || taken.some((t) => !(r.x1 < t.x0 || r.x0 > t.x1 || r.y1 < t.y0 || r.y0 > t.y1));
  for (const s of mainItems) taken.push({ x0: s.sx - 12, y0: s.sy - 12, x1: s.sx + 12, y1: s.sy + 12 });
  taken.push({ x0: star.x - 16, y0: star.y - 16, x1: star.x + 16, y1: star.y + 16 });
  if (inset) { taken.push({ x0: inset.x0 - 4, y0: inset.y0 - 4, x1: inset.x0 + inset.w + 4, y1: inset.y0 + inset.h + 4 }); taken.push(inset.foot); }
  taken.push({ x0: 0, y0: H - 34, x1: 190, y1: H });   // scale bar
  const northLeft = !!(inset && inset.corner === 'tr');
  taken.push(northLeft ? { x0: 0, y0: 0, x1: 46, y1: 52 } : { x0: W - 46, y0: 0, x1: W, y1: 52 });

  const roadLabels = placeRoadLabels(d, main, W, H, taken, hit, 12, p.mapLabels);
  const towns = placeTowns(p, d, main, W, H, taken, hit, stops, 10);

  if (inset) {
    const iv = inset.view, it = [];
    const ihit = (r) => r.x0 < 4 || r.y0 < 4 || r.x1 > inset.w - 4 || r.y1 > inset.h - 4 || it.some((t) => !(r.x1 < t.x0 || r.x0 > t.x1 || r.y1 < t.y0 || r.y0 > t.y1));
    for (const s of inset.members) { it.push({ x0: s.isx - 12, y0: s.isy - 12, x1: s.isx + 12, y1: s.isy + 12 }); it.push({ x0: s.ix - 4, y0: s.iy - 4, x1: s.ix + 4, y1: s.iy + 4 }); }
    if (inset.star) it.push({ x0: inset.star.x - 16, y0: inset.star.y - 16, x1: inset.star.x + 16, y1: inset.star.y + 16 });
    it.push({ x0: 0, y0: 0, x1: 60 + inset.members.length * 17, y1: 22 });   // the title
    it.push({ x0: 0, y0: inset.h - 32, x1: 170, y1: inset.h });              // the scale bar
    inset.roadLabels = placeRoadLabels(d, iv, inset.w, inset.h, it, ihit, 4);
    inset.towns = placeTowns(p, d, iv, inset.w, inset.h, it, ihit, stops, 3);
  }
  return { wide, W, H, main, stops, onMain, star, inset, roadLabels, towns, notes, northLeft, centre: d.centre, roads: d.roads };
}

// mapLabels (optional, per page): { 'FS 7601': 'Eightmile Rd · FS 7601' }. Those roads are
// labelled first, with that text, even when short. Added for the Enchantments sheet, where
// the turn readers need to find is a short forest road (review, 10/1).
function placeRoadLabels(d, v, W, H, taken, hit, max, must = {}) {
  const groupsByLabel = new Map();
  for (const r of d.roads) {
    // A route number or a road the page names. A city street's name is noise here.
    if (!r.label || !(r.cls === 'named' || (r.ref && (MAJOR.has(r.cls) || r.cls === 'secondary')))) continue;
    const short = r.ref ? ((r.label.match(/^[A-Z]{1,4}[ -]?\d+[A-Z]?/) || [r.label.slice(0, 8)])[0]) : r.label;
    const label = must[r.label] || must[short] || short;
    const g = groupsByLabel.get(label) || { cls: r.cls, px: [], must: label in Object.fromEntries(Object.values(must).map((x) => [x, 1])) };
    for (const q of r.pts) { const [x, y] = v.px(q[0], q[1]); if (x > 30 && x < W - 30 && y > 20 && y < H - 20) g.px.push([x, y]); }
    groupsByLabel.set(label, g);
  }
  const out = [];
  const rank = { named: 0, motorway: 0, trunk: 1, primary: 1, secondary: 2 };
  for (const [text, g] of [...groupsByLabel.entries()].sort((a, c) => (c[1].must - a[1].must) || rank[a[1].cls] - rank[c[1].cls] || c[1].px.length - a[1].px.length)) {
    if (g.px.length < (g.must ? 2 : 4) || (out.length >= max && !g.must)) continue;
    const xs = g.px.map((q) => q[0]), ys = g.px.map((q) => q[1]);
    const ext = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
    if (ext < (g.must ? 15 : 60)) continue;
    const axis = Math.max(...xs) - Math.min(...xs) >= Math.max(...ys) - Math.min(...ys) ? 0 : 1;
    const sorted = g.px.slice().sort((a, c) => a[axis] - c[axis]);
    const w = text.length * 5.6 + 12;
    const want = ext > 420 ? 2 : 1;
    const placed = [];
    // A must-label road may sit beside the line when every spot on it is taken (a short
    // forest road crowded by its own trailhead markers).
    const nudges = g.must ? [[0, 0], [-(w / 2 + 10), 0], [w / 2 + 10, 0], [0, -16], [0, 16], [-(w / 2 + 10), -16], [w / 2 + 10, 16]] : [[0, 0]];
    for (const f of [0.5, 0.3, 0.7, 0.2, 0.8, 0.4, 0.6, 0.12, 0.88]) {
      if (placed.length >= want) break;
      const [px, py] = sorted[Math.floor(f * (sorted.length - 1))];
      for (const [dx, dy] of nudges) {
        const x = px + dx, y = py + dy;
        const r = { x0: x - w / 2, y0: y - 8, x1: x + w / 2, y1: y + 8 };
        if ((g.must && (r.x0 < 4 || r.x1 > W - 4)) || hit(r) || placed.some((q) => Math.hypot(q.x - x, q.y - y) < 240)) continue;
        placed.push({ x, y }); taken.push(r);
        out.push({ text, x: Math.round(x), y: Math.round(y), kind: /^I-\d/.test(text) ? 'i' : 'h' });
        break;
      }
    }
  }
  return out;
}
// Real towns first, a few hamlets, never the destination's own name.
function placeTowns(p, d, v, W, H, taken, hit, stops, max) {
  const towns = [];
  const own = new Set([p.name, p.markerLabel || ''].map((x) => x.toLowerCase()));
  let hamlets = 0;
  for (const t of d.places.slice().sort((a, c) => a.rank - c.rank || c.pop - a.pop)) {
    if (towns.length >= max) break;
    if (own.has(t.name.toLowerCase())) continue;
    if (t.rank === 3 && (hamlets >= 3 || (t.pop === 0 && !stops.some((s) => s.name.includes(t.name))))) continue;
    const [x, y] = v.px(t.lat, t.lon);
    if (x < 10 || x > W - 10 || y < 10 || y > H - 10) continue;
    if (towns.some((o) => Math.hypot(o.x - x, o.y - y) < 46)) continue;
    const big = t.rank <= 1;
    const w = t.name.length * (big ? 7 : 6.1) + 6;
    const opts = { r: { x0: x + 5, y0: y - 8, x1: x + 5 + w, y1: y + 8 }, l: { x0: x - 5 - w, y0: y - 8, x1: x - 5, y1: y + 8 }, t: { x0: x - w / 2, y0: y - 21, x1: x + w / 2, y1: y - 5 }, b: { x0: x - w / 2, y0: y + 5, x1: x + w / 2, y1: y + 21 } };
    const a = ['r', 'l', 't', 'b'].find((k) => !hit(opts[k]));
    if (!a) continue;
    taken.push(opts[a]);
    if (t.rank === 3) hamlets++;
    towns.push({ name: t.name, x: Math.round(x), y: Math.round(y), a, big });
  }
  return towns;
}

// ---- the back of the sheet, from the page's own config ----
const WEB_ONLY = /\b(cameras?|alerts?|feeds?|map|list|block|lines?|markers?|table|report)s? (above|below)\b|\bclosures map\b|\b(above|below) (the|this) (map|list)\b|\b(tap|click)\b|this page|the (live )?map (shows|filters|covers|above)|on the map as|shows on the map|live (map|cameras)|^compare conditions with|^see (every|the|all) /i;
const SKIP_SEG = /what the map covers|where the live data stops/i;
const unlink = (s) => String(s || '').replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, '$1');
const tidy = (s) => String(s).replace(/&mdash;|\s—\s/g, ', ').replace(/\s+/g, ' ').trim();
function paperText(html) {
  // "The map draws each plow as an arrow" is true of the page, not the paper.
  const s = tidy(unlink(html).replace(/<(?!\/?strong\b)[^>]+>/gi, ''))
    .replace(/\b(the) (live )?map (draws|shows|marks|plots|lists)\b/gi, (m, the) => `${the} live page shows`)
    .replace(/\bon the map\b/gi, 'on the live page');
  const kept = s.split(/(?<=[.!?])\s+/).filter((x) => !WEB_ONLY.test(x)).join(' ');
  const open = (kept.match(/<strong>/g) || []).length, close = (kept.match(/<\/strong>/g) || []).length;
  return open === close ? kept.replace(/&(?!amp;|lt;|gt;|quot;|#)/g, '&amp;') : esc(kept.replace(/<[^>]+>/g, ''));
}
function backContent(p) {
  const sources = new Set();
  const sections = [], tables = [];
  const grabSources = (html) => { for (const m of String(html).matchAll(/<p class="seg-src">([\s\S]*?)<\/p>/g)) for (const a of m[1].matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/g)) sources.add(tidy(a[1].replace(/<[^>]+>/g, ''))); };
  const heads = (p.segs || []).map((s) => s.h);
  for (const s of p.segs || []) {
    if (SKIP_SEG.test(s.h)) continue;
    if (s.h === 'When it closes' && heads.some((h) => h !== s.h && /closes/i.test(h))) continue;
    if (s.p) { const body = paperText(s.p); if (body.length > 40) sections.push({ h: s.h, body: [body] }); continue; }
    if (!s.html) continue;
    grabSources(s.html);
    const html = s.html.replace(/<p class="seg-src">[\s\S]*?<\/p>/g, '');
    const table = (html.match(/<table[\s\S]*?<\/table>/) || [])[0];
    const paras = [...html.replace(/<div class="seg-table">[\s\S]*?<\/div>/g, '').matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)].map((m) => paperText(m[1])).filter((x) => x.length > 30);
    if (table) tables.push({ h: s.h, body: paras, table: unlink(table).replace(/\s(class|style)="[^"]*"/g, '') });
    else if (paras.length) sections.push({ h: s.h, body: paras });
  }
  const size = sections.reduce((n, s) => n + s.body.join(' ').length, 0);
  if (size < 1500) {
    if (p.closes && !sections.length) { const c = paperText(p.closes); if (c.length > 40) sections.push({ h: 'When it closes', body: [c] }); }
    for (const [q, a] of p.faq || []) {
      if (/right now|today|\bopen\b|closed\?|camera/i.test(q)) continue;   // a live question has no answer on paper
      const body = paperText(a);
      if (body.length > 60) sections.push({ h: q, body: [body] });
    }
  }
  for (const c of String(p.credit || p.dot || '').replace(/ via MileCheck/, '').split(/,| and /)) if (c.trim()) sources.add(c.trim());
  // one line of sources, not a paragraph: drop a name that another name already contains
  const all = [...sources];
  const short = all.filter((a) => !all.some((o) => o !== a && o.toLowerCase().includes(a.toLowerCase()))).slice(0, 12);
  // what goes first when the page runs out of room
  const pri = (h) => (/clos|alternate|detour|where|route|road|grade|through|access|pass\b/i.test(h) ? 3 : /before you/i.test(h) ? 2 : 1) - (tables.length && /rules|law/i.test(h) ? 2 : 0);
  for (const s of sections) s.pri = pri(s.h);
  return { lede: p.lede ? paperText(p.lede) : '', sections, tables, sources: short };
}
function qrSvg(url) {
  try { return execFileSync('python3', ['-c', 'import segno,sys; sys.stdout.write(segno.make(sys.argv[1], error="m").svg_inline(scale=3, border=1))', url]).toString(); }
  catch { return ''; }
}

function page(p, d) {
  const L = layout(p, d);
  const dir = p.out || path.join('passes', p.slug);
  const live = p.url || `https://milecheckapp.com/${dir}/`;
  const routes = tidy(String(p.eyebrow || [p.route, p.stateName].filter(Boolean).join(' · ')).replace(/<[^>]+>/g, ''));
  const title = p.kind === 'area' && /^The roads? /.test(p.aboutH || '') ? p.aboutH : p.name;
  const starName = p.markerLabel || p.name;
  const facts = [
    p.elev ? [p.elev, p.elevLabel || 'summit elevation'] : null,
    p.dist && !/radius/i.test(p.distNote || '') ? (/^[~\d]/.test(p.dist) ? [p.dist, p.distNote || ''] : ['', tidy(p.dist + ' ' + (p.distNote || ''))]) : null,
  ].filter(Boolean);
  const key = L.stops.map((x) => `<li><b class="n" style="background:${CATS[x.cat].color}">${x.n}</b><span class="t">${esc(x.name)}${CATS[x.cat].has.test(x.name) ? '' : `<small>${CATS[x.cat].label}</small>`}</span></li>`).join('') +
    L.notes.map((q) => `<li class="note"><b class="n nd">${q.letter}</b><span class="t">${esc(q.label)}</span></li>`).join('');
  const cats = [...new Set(L.stops.map((x) => x.cat))];
  const catKey = Object.keys(CATS).filter((c) => cats.includes(c)).filter((c, i, a) => a.findIndex((o) => CATS[o].color === CATS[c].color && CATS[o].label === CATS[c].label) === i)
    .map((c) => `<span><i style="background:${CATS[c].color}"></i>${CATS[c].label}</span>`).join('');
  // the key lists only the kinds of road that are drawn inside the frame
  const inFrame = (r) => r.pts.some((q) => { const [x, y] = L.main.px(q[0], q[1]); return x > 0 && x < L.W && y > 0 && y < L.H; });
  const classes = new Set(L.roads.filter(inFrame).map((r) => r.cls));
  const roadKey = [classes.has('motorway') ? '<span><i class="rd m"></i>Freeway</span>' : '', [...classes].some((c) => c !== 'motorway' && c !== 'tertiary') ? '<span><i class="rd h"></i>Highway</span>' : '', classes.has('tertiary') ? '<span><i class="rd t"></i>Local road</span>' : ''].join('');
  const sc = niceScale(L.main.mPerPx);
  const scaleHtml = (s, extra = '') => `<div class="scale${extra}" style="width:${s.px}px">${s.mi} mi</div>`;
  const pdf = p.slug + '-map.pdf';

  // inset footprint and the line to the inset box
  let over = '';
  if (L.inset) {
    const f = L.inset.foot, bx = { x0: L.inset.x0, y0: L.inset.y0, x1: L.inset.x0 + L.inset.w, y1: L.inset.y0 + L.inset.h };
    const fc = [(f.x0 + f.x1) / 2, (f.y0 + f.y1) / 2];
    const tx = clamp(fc[0], bx.x0, bx.x1), ty = clamp(fc[1], bx.y0, bx.y1);
    const sx = clamp(tx, f.x0, f.x1), sy = clamp(ty, f.y0, f.y1);
    over = `<svg class="over" width="${L.W}" height="${L.H}" viewBox="0 0 ${L.W} ${L.H}"><line x1="${sx.toFixed(1)}" y1="${sy.toFixed(1)}" x2="${tx.toFixed(1)}" y2="${ty.toFixed(1)}"/><rect x="${f.x0.toFixed(1)}" y="${f.y0.toFixed(1)}" width="${(f.x1 - f.x0).toFixed(1)}" height="${(f.y1 - f.y0).toFixed(1)}"/></svg>`;
  }
  const insetHtml = L.inset ? `<div class="inset" style="left:${L.inset.x0}px;top:${L.inset.y0}px;width:${L.inset.w}px;height:${L.inset.h}px"><div id="inset"></div><div class="labels">${L.inset.roadLabels.map((l) => `<span class="rl ${l.kind}" style="left:${l.x}px;top:${l.y}px">${esc(l.text)}</span>`).join('')}${L.inset.towns.map((t) => `<span class="tn ${t.a}" style="left:${t.x}px;top:${t.y}px"><i></i><b>${esc(t.name)}</b></span>`).join('')}</div>${scaleHtml(niceScale(L.inset.view.mPerPx), ' sm')}<span class="inset-t">Stops ${L.inset.members.map((s) => s.n).join(', ')}</span></div>` : '';

  const B = backContent(p);
  const sec = (s) => `<section data-pri="${s.pri}"><h3>${esc(tidy(s.h))}</h3>${s.body.map((x) => `<p>${x}</p>`).join('')}</section>`;
  const tablesHtml = B.tables.slice(0, 1).map((t) => `<div class="tbl"><h3>${esc(tidy(t.h))}</h3>${t.body[0] ? `<p>${t.body[0]}</p>` : ''}${t.table}${t.body.slice(1).map((x) => `<p>${x}</p>`).join('')}</div>`).join('');
  const snow = p.snow ? `<div><h3>Snow and avalanche</h3><p>Snow depth for this road is measured at the ${esc(p.snow.stationName)} SNOTEL station, ${esc(p.snow.stationElev)}, ${esc(p.snow.stationNote)}. The avalanche forecast comes from ${esc(p.snow.avyCenter)}. Both are on the live page.</p></div>` : '';
  const app = p.driveP ? paperText(p.driveP) : 'MileCheck shows your mile marker, the nearest camera and the alerts ahead, on CarPlay and Android Auto. The mile marker works without a signal.';

  const data = {
    main: { lat: L.main.lat, lon: L.main.lon, z: L.main.z },
    inset: L.inset ? { lat: L.inset.view.lat, lon: L.inset.view.lon, z: L.inset.view.z } : null,
    roads: L.roads.map((r) => ({ c: r.cls, p: r.pts })),
    notes: L.notes.map((q) => ({ ll: q.ll, letter: q.letter, dx: Math.round(q.sx - q.x), dy: Math.round(q.sy - q.y) })),
    insetNotes: L.inset ? L.inset.notes.map((q) => ({ ll: q.ll, letter: q.letter, dx: Math.round(q.isx - q.ix), dy: Math.round(q.isy - q.iy) })) : [],
    star: L.centre,
    insetStar: !!(L.inset && L.inset.star),
    pins: L.onMain.map((s) => ({ n: s.n, ll: [s.lat, s.lon], dx: Math.round(s.sx - s.x), dy: Math.round(s.sy - s.y), c: CATS[s.cat].color })),
    insetPins: L.inset ? L.inset.members.map((s) => ({ n: s.n, ll: [s.lat, s.lon], dx: Math.round(s.isx - s.ix), dy: Math.round(s.isy - s.iy), c: CATS[s.cat].color })) : [],
  };
  const labelsHtml = (roads, towns) => roads.map((l) => `<span class="rl ${l.kind}" style="left:${l.x}px;top:${l.y}px">${esc(l.text)}</span>`).join('') +
    towns.map((t) => `<span class="tn ${t.a}${t.big ? ' big' : ''}" style="left:${t.x}px;top:${t.y}px"><i></i><b>${esc(t.name)}</b></span>`).join('');
  const textLabels = labelsHtml(L.roadLabels, L.towns);

  const head = `Printable map of ${title === p.name ? p.name : p.name + ' roads'}: major roads and stops | MileCheck`;
  const desc = `A two-sided printable map of ${title === p.name ? p.name : 'the roads around ' + p.name}. Major roads, ${L.stops.length} numbered stops and town names on the front. What to know about the drive on the back.`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(head)}</title>
  <meta name="description" content="${esc(desc)}">
  <link rel="canonical" href="${live}map/">
  <link rel="icon" type="image/png" href="/images/favicon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
  <link rel="stylesheet" href="/assets/map-sheet.css">
</head>
<body>
  <div class="bar">
    <a class="btn" href="${pdf}" download>Download the PDF</a>
    <button type="button" onclick="window.print()">Print from here</button>
    <span>Letter, landscape, two sides. Flip on the short edge.</span>
    <a href="../">Live conditions for ${esc(p.name)}</a>
  </div>

  <div class="fit"><div class="sheet front ${L.wide ? 'wide' : 'side'}">
    <div class="mapwrap" style="width:${L.W}px;height:${L.H}px">
      <div id="map"></div>
      <div class="labels">${textLabels}</div>
      ${over}
      ${insetHtml}
      ${scaleHtml(sc, L.inset && L.inset.corner === 'bl' ? ' right' : '')}
      <div class="north${L.northLeft ? ' left' : ''}">N</div>
    </div>
    <div class="panel">
      <div class="head">
        <div class="eyebrow">${esc(routes)}</div>
        <h1>${esc(title)}</h1>
        <div class="facts">${facts.map(([b, l]) => `<div class="fact">${b ? `<b>${esc(b)}</b>` : ''}<span>${esc(l)}</span></div>`).join('')}</div>
      </div>
      <ol class="key" data-fit="6.6">${key || '<li><span class="t">OpenStreetMap lists no stops within reach of a major road here.</span></li>'}</ol>
      <div class="legend">
        <div class="lg"><span><b class="star">★</b>${esc(starName)}</span>${roadKey}</div>
        <div class="lg cats">${catKey}</div>
        <div class="foot">Base map USGS The National Map. Roads, towns and stops © OpenStreetMap contributors. Built ${inWords(d.fetched)}. Printed maps go out of date. Live conditions at ${esc(live.replace(/^https:\/\//, ''))}</div>
      </div>
    </div>
  </div></div>

  <div class="fit"><div class="sheet back">
    <div class="main">
      <header>
        <div class="eyebrow">${esc(routes)}</div>
        <h2>${esc(p.kind === 'area' ? (p.aboutH || 'Driving to ' + p.name) : 'Driving ' + p.name.replace(/^The /, 'the '))}</h2>
        ${B.lede ? `<p class="lede">${B.lede}</p>` : ''}
      </header>
      ${tablesHtml}
      <div class="text" data-fit="8">
        ${B.sections.map(sec).join('\n        ')}
      </div>
      <div class="notes" hidden><h3>Notes</h3><div></div></div>
    </div>
    <aside data-fit="6.4">
      <div><h3>Live conditions</h3><div class="qr">${qrSvg(live)}</div><p class="url">${esc(live.replace(/^https:\/\//, '')).replace(/\//g, '/<wbr>')}</p><p>Cameras, closures and road reports from ${esc(String(p.credit || p.dot || 'the state DOT').replace(/ via MileCheck/, ''))}. This sheet was built ${inWords(d.fetched)}. Check the live page before you leave.</p></div>
      ${snow}
      <div><h3>In the car</h3><p>${app}</p></div>
      <div><h3>About this map</h3><p>The numbered stops are a selection from OpenStreetMap along the roads this sheet is about. This map does not show every stop. Gates and seasonal closures are not drawn.</p></div>
      ${B.sources.length ? `<div class="src"><h3>Sources for this side</h3><p>${B.sources.map(esc).join(', ')}.</p></div>` : ''}
    </aside>
  </div></div>

  <script>window.SHEET=${JSON.stringify(data)};</script>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script src="/assets/map-sheet.js"></script>
</body>
</html>
`;
}

mkdirSync(CACHE, { recursive: true });
if ((!SUMMITS || refresh) && !offline) { try { await fetchSummits(); } catch (e) { console.error('summits: not fetched (' + e.message + '). Stars go on the road instead.'); } }
let n = 0;
for (const p of [...PASSES, ...AREAS]) {
  if (only.length && !only.includes(p.slug)) continue;
  const file = path.join(CACHE, p.slug + '.json');
  let d = existsSync(file) && !refresh ? JSON.parse(readFileSync(file, 'utf8')) : null;
  if (d && d.minorMissing && !offline) d = null;   // the minor roads did not come last time, ask again
  if (d && !d.featured && !offline) {
    try { d.featured = await fetchFeatured(p, d); writeFileSync(file, JSON.stringify(d)); console.log('  ' + p.slug + ': ' + d.featured.length + ' featured road ways'); await sleep(PACE); }
    catch (e) { console.error('  ' + p.slug + ': featured roads not fetched (' + e.message + ')'); }
  }
  if ((!d || d.v !== CACHE_V) && offline) { console.log('skip ' + p.slug + ': not in the cache'); continue; }
  if (!d || d.v !== CACHE_V) {
    try { d = await build(p); d.featured = await fetchFeatured(p, d); writeFileSync(file, JSON.stringify(d)); await sleep(PACE); }
    catch (e) { console.error('skip ' + p.slug + ': OpenStreetMap did not answer (' + e.message + ')'); continue; }
  }
  const dir = path.join(p.out || path.join('passes', p.slug), 'map');
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, 'index.html'), page(p, d));
  n++;
  console.log('wrote ' + dir + '/index.html  (' + p.name + ': ' + d.roads.length + ' road segments, ' + d.pois.length + ' candidate stops, ' + d.places.length + ' towns)');
}
console.log('\nGenerated ' + n + ' map sheet' + (n === 1 ? '' : 's') + '.');
