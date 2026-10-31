#!/usr/bin/env node
// Adds a short "use this data in your own software" block to corridor, pass and road-conditions pages
// (2026-10-31, search build: these pages already show live data and an app link; none pointed to the API).
// Road-conditions pages also say how often MileCheck reads that agency's feed. The numbers are the Worker's
// configured read intervals (cacheTtlSeconds, read 2026-10-31), not measured delay, and the sentence says so.
// Idempotent: the block sits between api-link:start and api-link:end and is replaced on each run.
//   node scripts/add-api-link-block.mjs
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { STATES, PROVINCES } from './data-sources-data.mjs';

// Seconds between our reads of each feed. California 60, North Dakota 600, 900 for the ibi511/WZDx states below.
// Everything else 300. Mississippi is read every 300 s from a copy that is refreshed about every 30 minutes.
const READ_SECONDS = { CA: 60, ND: 600, CT: 900, GA: 900, HI: 900, LA: 900, NV: 900, NM: 900, WI: 900 };
const slug = (n) => n.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const byName = new Map();
for (const [code, name, agency] of [...STATES, ...PROVINCES]) byName.set(slug(name), { code, name, agency });

const minutes = (s) => (s === 60 ? 'every minute' : `every ${s / 60} minutes`);
function block(kind, info) {
  let read = '';
  if (kind === 'state' && info) {
    const s = READ_SECONDS[info.code] || 300;
    const extra = info.code === 'MS' ? ' Mississippi’s feed reaches us through a copy refreshed about every 30 minutes.' : (info.code === 'HI' ? ' Hawaii’s own source updates weekly.' : '');
    read = ` MileCheck reads ${info.agency.replace(/&/g, '&amp;')} ${s === 300 ? 'at least ' : ''}${minutes(s)}. That is how often we check, not how fast the agency posts.${extra}`;
  }
  return `<!-- api-link:start -->
<aside class="mc-api-link" style="max-width:760px;margin:28px auto;padding:16px 20px;border:1px solid #dbe5df;border-radius:12px;background:#f7faf8;font:15px/1.55 Inter,-apple-system,'Segoe UI',sans-serif;color:#1b2420"><h2 style="font-size:17px;margin:0 0 6px">Use this data in your own software</h2><p style="margin:0">The alerts here come from state DOT feeds.${read} MileCheck’s API returns them for all 50 states in one format, with the highway and a mile marker where the state provides one. <a href="/api/" style="color:#0f7a4f;font-weight:700">See the API</a> &middot; <a href="/one-api-for-every-states-511-road-alerts/" style="color:#0f7a4f;font-weight:700">Is there one API for every state&rsquo;s 511 road alerts?</a> &middot; <a href="/data-sources/" style="color:#0f7a4f;font-weight:700">Where the data comes from</a></p></aside>
<!-- api-link:end -->
`;
}

const RE = /<!-- api-link:start -->[\s\S]*?<!-- api-link:end -->\n?/;
let changed = 0, checked = 0, missing = [];
for (const [dir, kind] of [['corridors', 'corridor'], ['passes', 'pass'], ['road-conditions', 'state']]) {
  for (const name of readdirSync(dir)) {
    const f = `${dir}/${name}/index.html`;
    if (!existsSync(f)) continue;
    checked++;
    const src = readFileSync(f, 'utf8');
    const info = kind === 'state' ? byName.get(name) : null;
    if (kind === 'state' && !info) { missing.push(name); }
    const b = block(kind, info);
    let out;
    if (RE.test(src)) out = src.replace(RE, b);
    else if (src.includes('<!-- footer-hub:start -->')) out = src.replace('<!-- footer-hub:start -->', b + '<!-- footer-hub:start -->');
    else if (src.includes('<footer class="site-footer">')) out = src.replace('<footer class="site-footer">', b + '<footer class="site-footer">');
    else { missing.push(`${f} (no insertion point)`); continue; }
    if (out !== src) { writeFileSync(f, out); changed++; }
  }
}
console.log(`api-link block: ${changed} of ${checked} pages changed${missing.length ? '; no match for ' + missing.join(', ') : ''}`);
