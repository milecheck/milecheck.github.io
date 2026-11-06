#!/usr/bin/env node
// refresh-sponsor-page.mjs — rewrites the traffic numbers on /sponsor/ from Google Analytics (Leah 2026-11-06:
// "this page needs severely updated, it should be updated weekly", and "how long they stay" instead of active users).
// Reads the 28-day window from the app repo's pull-ga4.mjs (service-account key lives there) and replaces the block
// between <!-- stats:start --> and <!-- stats:end --> in sponsor/index.html. Idempotent. Run weekly (tools cron), then push.
//   node scripts/refresh-sponsor-page.mjs            rewrite the block, print the numbers
//   APP_REPO=/path/to/MILECHECKAPP node scripts/refresh-sponsor-page.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const APP = process.env.APP_REPO || '/Users/leahgerber/Developer/MILECHECKAPP';
const PAGE = resolve(ROOT, 'sponsor/index.html');

const raw = execFileSync('node', [resolve(APP, 'scripts/pull-ga4.mjs'), '--json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
const J = JSON.parse(raw.slice(raw.indexOf('{')));
const w = J.windows.d28;
if (!w || !w.views) throw new Error('no 28-day window in pull-ga4 output');
const n = (x) => Number(x).toLocaleString('en-US');
const end = new Date(J.fetchedAt); end.setUTCDate(end.getUTCDate() - 1); // windows end yesterday
const start = new Date(end); start.setUTCDate(start.getUTCDate() - 27);
const fmt = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const span = `${fmt(start)} to ${fmt(end)}`;
const secs = Math.round(w.avgSessionDurationSec || 0);
const stay = secs >= 60 ? `${Math.floor(secs / 60)} min ${secs % 60} sec` : `${secs} sec`;
const tile = (big, label) => `<div style="background:#fff;border:1px solid #e3e0d6;border-radius:12px;padding:14px"><div style="font:800 30px/1.1 var(--serif,Georgia);color:#0f7a4f">${big}</div><div class="sp-note" style="margin:4px 0 0;font-size:14.5px">${label}</div></div>`;
const block = `<!-- stats:start -->
    <div class="sp-statgrid">
      ${tile(n(w.views), `page views in 28 days, ${span}`)}
      ${tile(stay, `average time on the site per visit, ${span}`)}
      ${tile(n(w.sessions), `visits in 28 days, ${span}`)}
    </div>
    <p class="sp-note" style="margin:8px 0 6px">From Google Analytics, refreshed weekly (last on ${fmt(new Date(J.fetchedAt))}). Sitewide totals, not views of one sponsored placement. Time on the site is the average length of a visit.</p>
    <!-- stats:end -->`;
let html = readFileSync(PAGE, 'utf8');
const re = /<!-- stats:start -->[\s\S]*?<!-- stats:end -->/;
if (!re.test(html)) throw new Error('sponsor/index.html has no <!-- stats:start --> block');
const out = html.replace(re, block);
if (out !== html) writeFileSync(PAGE, out);
console.log(`sponsor stats: ${n(w.views)} views, ${stay} per visit, ${n(w.sessions)} visits, ${span}${out !== html ? '' : ' (unchanged)'}`);
