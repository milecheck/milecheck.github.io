// Reads MileCheck's current App Store rating from Apple's public lookup API (US store) and writes
// data/app-rating.json, which the phone "Get the app" bar (assets/site-nav.js) shows.
// Run: node scripts/app-rating.mjs        (live, used by .github/workflows/app-rating.yml)
//      node scripts/app-rating.mjs --file lookup.json   (from a saved lookup response, for testing)
// If Apple's answer is missing or odd, the file is left as it is and the run fails, so the site
// keeps the last good number instead of showing a blank or a zero.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const APP_ID = '6759212851';
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data', 'app-rating.json');

// Pure: Apple lookup JSON -> { rating, count } or null when it can't be trusted.
export function parseLookup(json) {
  const r = json && Array.isArray(json.results) ? json.results.find(x => String(x.trackId) === APP_ID) : null;
  if (!r) return null;
  const avg = Number(r.averageUserRating), count = Number(r.userRatingCount);
  if (!Number.isFinite(avg) || !Number.isFinite(count) || count < 1 || avg < 1 || avg > 5) return null;
  return { rating: Math.round(avg * 10) / 10, count: Math.round(count) };
}

async function main() {
  const i = process.argv.indexOf('--file');
  let json;
  if (i > 0) json = JSON.parse(readFileSync(process.argv[i + 1], 'utf8'));
  else {
    const res = await fetch(`https://itunes.apple.com/lookup?id=${APP_ID}&country=us`, { headers: { 'cache-control': 'no-cache' } });
    if (!res.ok) throw new Error(`Apple lookup HTTP ${res.status}`);
    json = await res.json();
  }
  const got = parseLookup(json);
  if (!got) throw new Error('Apple lookup had no usable rating; data/app-rating.json left as is');
  let prev = {};
  try { prev = JSON.parse(readFileSync(OUT, 'utf8')); } catch (e) {}
  const ios = { rating: got.rating, count: got.count, store: 'us', checked: new Date().toISOString().slice(0, 10) };
  // Only rewrite when the shown numbers change, so the daily job doesn't commit every day.
  if (prev.ios && prev.ios.rating === ios.rating && prev.ios.count === ios.count) {
    console.log(`App Store ${ios.rating} (${ios.count} ratings), unchanged`);
    return;
  }
  writeFileSync(OUT, JSON.stringify({ ...prev, ios }, null, 2) + '\n');
  console.log(`App Store ${ios.rating} (${ios.count} ratings), written`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch(e => { console.error(e.message); process.exit(1); });
}
