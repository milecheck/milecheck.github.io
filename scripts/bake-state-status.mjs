#!/usr/bin/env node
// bake-state-status.mjs — a dated "right now" block in the HTML of the winter-state /road-conditions/ pages (2026-11-01,
// "go pages", plan move 7). The page's own map fills in by JavaScript, so Google sees "Loading alerts". This writes what
// the Worker held at read time between <!-- statenow:start --> and <!-- statenow:end -->. It says what the agency feed
// lists, never that a road is clear or open. Idempotent.
// 2026-11-24: the box had been baked once (11-01) and sat three weeks stale under a live map. Now it is re-baked every
// 3 hours by .github/workflows/state-status.yml, stamped "Current as of <time, zone>" from the feed's own read time, and
// refreshed in the browser by assets/state-now.js, which shares its wording with this script.
//   node scripts/bake-state-status.mjs
import fs from 'node:fs';
import { createRequire } from 'node:module';
const SN = createRequire(import.meta.url)('../assets/state-now.js');
const SCRIPT_V = '20261124';
const W = 'https://milepost-proxy.leahgerber93.workers.dev';
const UA = 'MileCheck/1.10 CFNetwork state-status';
// [code, name, agency, time zone the stamp is written in]. Idaho: Boise's zone (most of the state's people).
const PT = 'America/Los_Angeles', MT = 'America/Denver';
const STATES = { washington: ['WA', 'Washington', 'WSDOT', PT], oregon: ['OR', 'Oregon', 'ODOT', PT], colorado: ['CO', 'Colorado', 'CDOT', MT], utah: ['UT', 'Utah', 'UDOT', MT], idaho: ['ID', 'Idaho', 'ITD', 'America/Boise'], montana: ['MT', 'Montana', 'MDT', MT], california: ['CA', 'California', 'Caltrans', PT], wyoming: ['WY', 'Wyoming', 'WYDOT', MT], alaska: ['AK', 'Alaska', 'Alaska DOT', 'America/Anchorage'] };
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const RE = /<!-- statenow:start -->[\s\S]*?<!-- statenow:end -->\n?/;
const now = Date.now(); let changed = 0; const skipped = [];
for (const [slug, [code, name, dot, tz]] of Object.entries(STATES)) {
  const file = `road-conditions/${slug}/index.html`;
  if (!fs.existsSync(file)) continue;
  let j;
  try { const r = await fetch(`${W}/incidents?state=${code}`, { headers: { 'User-Agent': UA } }); j = r.ok ? await r.json() : null; } catch { j = null; }
  if (!j || (j.source_status && j.source_status !== 'live')) { skipped.push(`${slug} (feed ${j && j.source_status})`); continue; }
  const at = SN.readTime(j, now);
  const sum = SN.summarize(j, now);
  const stamp = SN.stampHtml({ mode: 'live', at }, dot, tz).replace(' This box refreshes every 5 minutes.', '');
  const block = `<!-- statenow:start -->
<section class="mc-statenow" data-state="${code}" data-name="${esc(name)}" data-dot="${esc(dot)}" data-tz="${tz}" data-read="${new Date(at).toISOString()}" aria-label="${esc(name)} road conditions" aria-live="polite" style="max-width:1000px;margin:12px 0;padding:14px 18px;border:1px solid #dbe5df;border-radius:12px;background:#f7faf8;font:15px/1.55 Inter,-apple-system,'Segoe UI',sans-serif;color:#1b2420">
<h2 class="sn-h" style="font-size:18px;margin:0 0 6px">${esc(name)} at the last read</h2>
<div class="sn-body">${SN.bodyHtml(sum, dot)}</div>
<p style="margin:8px 0 0;font-size:13.5px;color:#5b6670"><span class="sn-stamp">${stamp}</span> Chain and traction rules are on the <a href="/chain-laws/${slug === 'alaska' ? 'arizona-new-mexico-alaska' : slug}/" style="color:#0f7a4f;font-weight:700">${esc(name)} chain law page</a>. A feed with no closure is not a promise a road is open. The map below updates live.</p>
<script src="/assets/state-now.js?v=${SCRIPT_V}" defer></script>
</section>
<!-- statenow:end -->
`;
  const html = fs.readFileSync(file, 'utf8');
  let out;
  if (RE.test(html)) out = html.replace(RE, block);
  else { const m = html.match(/<p class="rc-lede">[\s\S]*?<\/p>\n/); if (!m) { skipped.push(`${slug} (no lede)`); continue; } const k = html.indexOf(m[0]) + m[0].length; out = html.slice(0, k) + block + html.slice(k); }
  if (out !== html) { fs.writeFileSync(file, out); changed++; }
}
console.log(`state status: ${changed} pages changed${skipped.length ? '; skipped ' + skipped.join(', ') : ''}`);
