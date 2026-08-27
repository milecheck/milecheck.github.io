#!/usr/bin/env node
/**
 * build-coverage-ledger.mjs — the ONE source of truth for MileCheck's public
 * coverage counts.
 *
 * Why this exists: camera/state/corridor/pass/border numbers were hand-typed in
 * prose across index.html, maps/, cameras/, states/ and drifted apart (audit
 * 2026-08-21: homepage said 25 camera states, cameras/ said 27, corridors said
 * 9 vs 10 on disk, passes 7 vs 9). Numbers now come from here.
 *
 * BUILD-TIME ONLY. This queries the Worker and writes data/coverage-ledger.json,
 * which is committed. The website never calls the Worker to render a count —
 * apply-coverage-counts.mjs injects the numbers into the HTML at build time.
 *
 *   node scripts/build-coverage-ledger.mjs [--dry]
 *
 * Two kinds of coverage are tracked SEPARATELY and must not be conflated:
 *   feeds — states/provinces whose data we actually serve (the product claim)
 *   pages — dedicated website pages that exist on disk (the SEO surface)
 * A region can have a live feed and no page. That is normal, not a bug.
 *
 * Status vocabulary:
 *   live        — endpoint returned records now
 *   unavailable — integration exists, upstream currently returns nothing
 *                 (e.g. Alberta cameras). NOT counted in public totals.
 *   none        — no integration
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const WORKER = 'https://milepost-proxy.leahgerber93.workers.dev';
const DRY = process.argv.includes('--dry');

// Integrations that exist but whose upstream is known-flaky. Present here so a
// zero-record response reads as "unavailable" rather than silently dropping the
// integration from the ledger entirely.
const KNOWN_INTEGRATIONS = { cameras: ['AB'] };

const CA = new Set(['ON', 'QC', 'BC', 'AB', 'NS', 'NT', 'MB', 'SK', 'NB', 'YT']);

async function getJSON(path) {
  const res = await fetch(`${WORKER}${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${path}`);
  return res.json();
}

const count = (d, keys) => {
  if (Array.isArray(d)) return d.length;
  for (const k of keys) if (Array.isArray(d?.[k])) return d[k].length;
  return 0;
};

/**
 * ⚠️ ALERTS vs CAMERAS differ and must not share one rule.
 *   alerts  are EVENTS — zero is a normal quiet day, NOT a missing integration.
 *           A state in the Worker's supported list that answers 200 is live.
 *           (Verified 2026-08-21: NM and RI both returned 0 while integrated;
 *           NM's Blyncsy feed is documented as intermittent.)
 *   cameras are INFRASTRUCTURE — zero genuinely means no usable feed, so a
 *           zero response demotes to unavailable/none.
 * Counting a quiet alert state as "none" would silently shrink the public
 * number on a quiet day — worse than the drift this ledger exists to fix.
 */
async function probe(kind, code, path, keys) {
  try {
    const n = count(await getJSON(path), keys);
    if (kind === 'alerts') return { code, status: 'live', records: n };
    if (n > 0) return { code, status: 'live', records: n };
    const known = KNOWN_INTEGRATIONS[kind]?.includes(code);
    return { code, status: known ? 'unavailable' : 'none', records: 0 };
  } catch (e) {
    return { code, status: 'error', records: 0, error: String(e.message).slice(0, 80) };
  }
}

/** Count immediate subdirectories that contain an index.html. */
function pageDirs(rel) {
  const dir = join(ROOT, rel);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((n) => {
      const p = join(dir, n);
      return statSync(p).isDirectory() && existsSync(join(p, 'index.html'));
    })
    .sort();
}

async function main() {
  const status = await getJSON('/status');
  const supported = status.supported_states ?? [];
  console.log(`Worker reports ${supported.length} supported regions`);

  // ---- FEEDS ----------------------------------------------------------------
  console.log('probing alert feeds…');
  const alerts = [];
  for (const c of supported) {
    alerts.push(await probe('alerts', c, `/incidents?state=${c}`, ['incident-reports', 'incidents']));
  }
  console.log('probing camera feeds…');
  const cameras = [];
  for (const c of supported) {
    cameras.push(await probe('cameras', c, `/cameras?state=${c}`, ['cameras']));
  }

  let borders = { status: 'error', records: 0 };
  try {
    borders = { status: 'live', records: count(await getJSON('/border-waits'), ['crossings']) };
  } catch (e) {
    borders = { status: 'error', records: 0, error: String(e.message).slice(0, 80) };
  }

  const liveUS = (rows) => rows.filter((r) => r.status === 'live' && !CA.has(r.code)).map((r) => r.code);
  const liveCA = (rows) => rows.filter((r) => r.status === 'live' && CA.has(r.code)).map((r) => r.code);
  const unavail = (rows) => rows.filter((r) => r.status === 'unavailable').map((r) => r.code);

  // ---- PAGES ----------------------------------------------------------------
  // cameras/ mixes state pages and city pages; a state page is one whose slug
  // matches a US state or CA province name.
  const STATE_SLUGS = new Set(
    ('alabama alaska arizona arkansas california colorado connecticut delaware florida georgia hawaii idaho illinois '
   + 'indiana iowa kansas kentucky louisiana maine maryland massachusetts michigan minnesota mississippi missouri '
   + 'montana nebraska nevada new-hampshire new-jersey new-mexico new-york north-carolina north-dakota ohio oklahoma '
   + 'oregon pennsylvania rhode-island south-carolina south-dakota tennessee texas utah vermont virginia washington '
   + 'west-virginia wisconsin wyoming british-columbia ontario quebec alberta').split(' ')
  );
  const camDirs = pageDirs('cameras');
  const cameraStatePages = camDirs.filter((d) => STATE_SLUGS.has(d));
  const cameraCityPages = camDirs.filter((d) => !STATE_SLUGS.has(d));

  const ledger = {
    _comment: 'GENERATED by scripts/build-coverage-ledger.mjs — do not hand-edit. Public counts derive from here.',
    generated: new Date().toISOString().slice(0, 10),
    source: WORKER,
    feeds: {
      alerts: {
        us_states: liveUS(alerts).length,
        provinces: liveCA(alerts).length,
        unavailable: unavail(alerts),
        quiet_now: alerts.filter((r) => r.status === 'live' && r.records === 0).map((r) => r.code),
        us_state_codes: liveUS(alerts),
        province_codes: liveCA(alerts),
      },
      cameras: {
        us_states: liveUS(cameras).length,
        provinces: liveCA(cameras).length,
        unavailable: unavail(cameras),
        us_state_codes: liveUS(cameras),
        province_codes: liveCA(cameras),
        total_cameras: cameras.reduce((a, r) => a + r.records, 0),
      },
      mileposts: { us_states: 50, note: 'bundled offline in-app; not probed per-request' },
      borders: { crossings: borders.records, status: borders.status },
    },
    pages: {
      camera_states: cameraStatePages.length,
      camera_cities: cameraCityPages.length,
      // dedicated per-state drawbridge pages (bridges/<state>/); more-states/ is
      // the bulk page covering the remaining states and is not a state page.
      bridge_states: pageDirs('bridges').filter((d) => d !== 'more-states').length,
      corridors: pageDirs('corridors').length,
      passes: pageDirs('passes').length,
      // state guides are blog FILES (blog/mile-markers-<state>.html), not dirs.
      state_guides: existsSync(join(ROOT, 'blog'))
        ? readdirSync(join(ROOT, 'blog')).filter((f) => /^mile-markers-.*\.html$/.test(f)).length
        : 0,
    },
  };

  console.log('\n--- LEDGER ---');
  console.log(`  alerts   : ${ledger.feeds.alerts.us_states} US + ${ledger.feeds.alerts.provinces} prov`);
  console.log(`  cameras  : ${ledger.feeds.cameras.us_states} US + ${ledger.feeds.cameras.provinces} prov` +
              `  (${ledger.feeds.cameras.total_cameras.toLocaleString()} cams)` +
              (ledger.feeds.cameras.unavailable.length ? `  unavailable: ${ledger.feeds.cameras.unavailable.join(',')}` : ''));
  console.log(`  borders  : ${ledger.feeds.borders.crossings} crossings`);
  console.log(`  pages    : ${ledger.pages.camera_states} camera-state, ${ledger.pages.camera_cities} camera-city, ` +
              `${ledger.pages.bridge_states} bridge-state, ${ledger.pages.corridors} corridors, ${ledger.pages.passes} passes`);

  if (DRY) { console.log('\nDRY RUN — not written.'); return; }
  writeFileSync(join(ROOT, 'data/coverage-ledger.json'), JSON.stringify(ledger, null, 2) + '\n');
  console.log('\nwrote data/coverage-ledger.json');
}

main().catch((e) => { console.error(e); process.exit(1); });
