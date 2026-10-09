#!/usr/bin/env node
// Connect the site's JSON-LD into one graph (2026-10-02).
//
//   node scripts/link-jsonld.mjs            # rewrite JSON-LD in every .html in place
//   node scripts/link-jsonld.mjs --check    # report only, write nothing
//   node scripts/link-jsonld.mjs --skip a.html,b/index.html   # leave these files alone
//
// What it does, only inside <script type="application/ld+json"> blocks:
// - The home page defines MileCheck once, with @ids: #org, #website, #app. Clean sameAs.
// - Every other page's "MileCheck" Organization / WebSite becomes a reference to those @ids,
//   so Google sees one company instead of hundreds.
// - Each page's main entity (WebPage, Article, NewsArticle, FAQPage, CollectionPage) gets its own
//   @id (canonical URL + #type) and isPartOf the website. Articles get publisher = #org.
// - App listings (SoftwareApplication / MobileApplication named MileCheck) share the #app @id.
// - Highway Report pages with a data file get Dataset markup read from that file.
// Idempotent. Run LAST, after any generator and after tag-store-links.mjs.
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const BASE = 'https://milecheckapp.com';
const ORG = `${BASE}/#org`, SITE = `${BASE}/#website`, APP = `${BASE}/#app`;
const CHECK = process.argv.includes('--check');
const SKIP = new Set(((() => { const i = process.argv.indexOf('--skip'); return i > -1 ? process.argv[i + 1] : ''; })()).split(',').filter(Boolean));

// Canonical profile URLs, no tracking. Checked 2026-10-02.
const SAME_AS = [
  'https://apps.apple.com/app/id6759212851',
  'https://play.google.com/store/apps/details?id=app.milecheck.mobile',
  'https://www.instagram.com/milecheck_app',
  'https://www.facebook.com/share/1FT9JtkH5D/',
  'https://www.linkedin.com/company/milecheck',
  'https://x.com/milecheckapp',
  'https://www.youtube.com/channel/UCBEZIoTz6LChUKZ8TymdJaw',
  'https://www.reddit.com/user/MileCheckApp/',
];

const OUR_NAMES = new Set(['milecheck', 'milecheck llc', 'milecheck app']);
const isOurs = (x) => x && typeof x.name === 'string' && OUR_NAMES.has(x.name.trim().toLowerCase());
const typesOf = (x) => (Array.isArray(x['@type']) ? x['@type'] : [x['@type']]).filter(Boolean);
const has = (x, t) => typesOf(x).includes(t);
const MAIN = ['WebPage', 'CollectionPage', 'Article', 'NewsArticle', 'BlogPosting', 'FAQPage', 'Dataset'];

function walk(dir, out = []) {
  for (const n of readdirSync(dir)) {
    if (n.startsWith('.') || n === 'node_modules' || n === 'scripts' || n === 'internal' || n === 'design-options') continue;
    const f = join(dir, n); const s = statSync(f);
    if (s.isDirectory()) walk(f, out); else if (n.endsWith('.html')) out.push(f);
  }
  return out;
}

function canonicalOf(src, rel) {
  const m = src.match(/<link rel="canonical" href="([^"]+)"/);
  if (m) return m[1];
  return `${BASE}/${rel.replace(/index\.html$/, '')}`;
}

// Replace our org / website anywhere below the top level with an @id reference.
function refOurs(x, depth = 0) {
  if (Array.isArray(x)) return x.map((v) => refOurs(v, depth + 1));
  if (!x || typeof x !== 'object') return x;
  if (depth > 0 && isOurs(x)) {
    if (has(x, 'Organization')) return { '@id': ORG };
    if (has(x, 'WebSite')) return { '@id': SITE };
  }
  const out = {};
  for (const [k, v] of Object.entries(x)) out[k] = refOurs(v, depth + 1);
  return out;
}

function orgDefinition(existing) {
  const o = { ...existing, '@id': ORG, '@type': 'Organization' };
  o.name = 'MileCheck';
  o.legalName = 'MileCheck LLC';
  o.url = `${BASE}/`;
  o.sameAs = SAME_AS;
  o.contactPoint = [{ '@type': 'ContactPoint', contactType: 'sales', email: 'sales@milecheckapp.com' }, { '@type': 'ContactPoint', contactType: 'customer support', email: 'info@milecheckapp.com' }];
  return o;
}

// Google's Dataset parser wants a typed object for creator/publisher, not a bare @id reference.
const DATASET_ORG = { '@type': 'Organization', '@id': ORG, name: 'MileCheck', url: `${BASE}/` };

function datasetFor(rel, canon) {
  // National: blog/road-report-<month>-<year>.html ; states: blog/highway-report-<month>-<year>-states/<state>.html
  let m = rel.match(/^blog\/road-report-([a-z]+-\d{4})\.html$/), state = null;
  if (!m) { m = rel.match(/^blog\/highway-report-([a-z]+-\d{4})-states\/([a-z-]+)\.html$/); if (m) state = m[2]; if (state === 'index') return null; }
  if (!m) return null;
  const dataRel = `data/road-report-${m[1]}.json`;
  if (!existsSync(join(ROOT, dataRel))) return null;
  const d = JSON.parse(readFileSync(join(ROOT, dataRel), 'utf8'));
  if (!d.window || !d.month) return null;
  const [start, end] = d.window.split('..');
  const label = new Date(`${d.month}-15T00:00:00Z`).toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const stateName = state ? state.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ') : null;
  const juris = (d.jurisdictionSummary || []).map((j) => j.state);
  const ds = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    '@id': `${canon}#dataset`,
    name: state ? `MileCheck Highway Report, ${label}: ${stateName}` : `MileCheck Highway Report, ${label}`,
    description: state
      ? `Road closures, crashes, roadwork and weather alerts published on ${stateName}'s state DOT feed in ${label}, counted once per incident.`
      : `Road closures, crashes, roadwork and weather alerts published on every US state DOT feed and British Columbia's in ${label}, counted once per incident. ${d.totalUniqueEvents ? d.totalUniqueEvents.toLocaleString('en-US') + ' unique events.' : ''}`.trim(),
    url: canon,
    temporalCoverage: `${start}/${end}`,
    spatialCoverage: state
      ? { '@type': 'Place', name: stateName === 'British Columbia' ? 'British Columbia, Canada' : `${stateName}, United States` }
      : { '@type': 'Place', name: juris.includes('BC') ? 'United States and British Columbia, Canada' : 'United States' },
    measurementTechnique: d.method || undefined,
    creator: DATASET_ORG,
    publisher: DATASET_ORG,
    isPartOf: { '@id': SITE },
    isAccessibleForFree: true,
    distribution: [{ '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: `${BASE}/${dataRel}` }],
  };
  if (!ds.measurementTechnique) delete ds.measurementTechnique;
  return ds;
}

const BLOCK_RE = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
const ser = (d) => JSON.stringify(d).replace(/<\//g, '<\\/');

let scanned = 0, changed = 0, orgRefs = 0, idsAdded = 0, datasets = 0, skipped = 0;
for (const f of walk(ROOT)) {
  const rel = relative(ROOT, f);
  if (SKIP.has(rel)) { skipped++; continue; }
  const src = readFileSync(f, 'utf8');
  if (!src.includes('application/ld+json')) continue;
  scanned++;
  const isHome = rel === 'index.html';
  const canon = canonicalOf(src, rel).split('#')[0];
  let sawDataset = false;
  let out = src.replace(BLOCK_RE, (whole, body) => {
    let d;
    try { d = JSON.parse(body); } catch { return whole; }
    const before = JSON.stringify(d);
    if (Array.isArray(d) || d['@graph']) return whole; // none on the site today; leave alone
    if (has(d, 'Dataset')) sawDataset = true;
    if (isHome && has(d, 'Organization') && isOurs(d)) d = orgDefinition(d);
    else if (has(d, 'Organization') && isOurs(d)) {
      // A standalone org block on an inner page: shrink it to a reference holder.
      d = { '@context': 'https://schema.org', '@type': 'Organization', '@id': ORG, name: 'MileCheck', url: `${BASE}/` };
    } else if ((has(d, 'SoftwareApplication') || has(d, 'MobileApplication')) && isOurs(d)) {
      d = refOurs(d); d['@id'] = APP; d.publisher = { '@id': ORG }; if (d.author && isOurs(d.author)) d.author = { '@id': ORG };
      if (d.sameAs) delete d.sameAs;
    } else if (has(d, 'WebSite') && isOurs(d)) {
      d = { ...refOurs(d), '@id': SITE, url: `${BASE}/`, publisher: { '@id': ORG } };
    } else {
      d = refOurs(d);
      if (has(d, 'Dataset')) { d.creator = DATASET_ORG; d.publisher = DATASET_ORG; }
      if (MAIN.some((t) => has(d, t))) {
        const t = typesOf(d).find((x) => MAIN.includes(x));
        if (!d['@id']) { d['@id'] = `${canon}#${t.toLowerCase()}`; idsAdded++; }
        if (!d.isPartOf) d.isPartOf = { '@id': SITE };
        if (['Article', 'NewsArticle', 'BlogPosting'].includes(t)) {
          if (!d.publisher) d.publisher = { '@id': ORG };
          if (!d.author) d.author = { '@id': ORG };
        }
      }
    }
    const after = JSON.stringify(d);
    if (after === before) return whole;
    orgRefs += (after.match(/"@id":"https:\/\/milecheckapp\.com\/#org"/g) || []).length;
    return `<script type="application/ld+json">${ser(d)}</script>`;
  });
  if (isHome && !/"@id":"https:\/\/milecheckapp\.com\/#website"/.test(out)) {
    const site = { '@context': 'https://schema.org', '@type': 'WebSite', '@id': SITE, name: 'MileCheck', url: `${BASE}/`, publisher: { '@id': ORG }, inLanguage: 'en-US' };
    out = out.replace('</head>', `<script type="application/ld+json">${ser(site)}</script>\n</head>`);
  }
  if (!sawDataset) {
    const ds = datasetFor(rel, canon);
    if (ds) { out = out.replace('</head>', `<script type="application/ld+json">${ser(ds)}</script>\n</head>`); datasets++; }
  }
  if (out !== src) { changed++; if (!CHECK) writeFileSync(f, out); }
}
console.log(`${CHECK ? '[check] ' : ''}scanned ${scanned} pages with JSON-LD, ${changed} changed, ${idsAdded} page @ids added, ${datasets} Dataset blocks added, ${skipped} skipped`);
