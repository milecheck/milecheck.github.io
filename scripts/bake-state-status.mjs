#!/usr/bin/env node
// bake-state-status.mjs — a dated "right now" block in the HTML of the winter-state /road-conditions/ pages (2026-11-01,
// "go pages", plan move 7). The page's own map fills in by JavaScript, so Google sees "Loading alerts". This writes what
// the Worker held at read time between <!-- statenow:start --> and <!-- statenow:end -->. It says what the agency feed
// lists, never that a road is clear or open. Idempotent.
//   node scripts/bake-state-status.mjs
import fs from 'node:fs';
const W = 'https://milepost-proxy.leahgerber93.workers.dev';
const UA = 'MileCheck/1.10 CFNetwork state-status';
const STATES = { washington: ['WA', 'Washington', 'WSDOT'], oregon: ['OR', 'Oregon', 'ODOT'], colorado: ['CO', 'Colorado', 'CDOT'], utah: ['UT', 'Utah', 'UDOT'], idaho: ['ID', 'Idaho', 'ITD'], montana: ['MT', 'Montana', 'MDT'], california: ['CA', 'California', 'Caltrans'], wyoming: ['WY', 'Wyoming', 'WYDOT'], alaska: ['AK', 'Alaska', 'Alaska DOT'] };
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const clean = (s, n) => String(s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);
const PT = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
const RE = /<!-- statenow:start -->[\s\S]*?<!-- statenow:end -->\n?/;
const now = Date.now(); let changed = 0; const skipped = [];
for (const [slug, [code, name, dot]] of Object.entries(STATES)) {
  const file = `road-conditions/${slug}/index.html`;
  if (!fs.existsSync(file)) continue;
  let j;
  try { const r = await fetch(`${W}/incidents?state=${code}`, { headers: { 'User-Agent': UA } }); j = r.ok ? await r.json() : null; } catch { j = null; }
  if (!j || (j.source_status && j.source_status !== 'live')) { skipped.push(`${slug} (feed ${j && j.source_status})`); continue; }
  const active = (j['incident-reports'] || []).filter((a) => {
    const t0 = Date.parse(a['start-time'] || ''), t1 = Date.parse(a['end-time'] || '');
    return !(isFinite(t0) && t0 > now) && !(isFinite(t1) && t1 < now);
  });
  const by = (t) => active.filter((a) => a['event-type-id'] === t);
  const closures = by('CL').filter((a) => !/rest area/i.test(`${a.headline} ${a.description}`));
  const crashes = by('AC'), work = by('RW');
  const plural = (n, w, pl) => `${n} ${n === 1 ? w : (pl || w + 's')}`;
  const lines = closures.slice(0, 3).map((a) => `<li>${esc(`${a.location['route-id'] || ''} ${a.location.direction || ''}: ${clean(a.description || a.headline || a['impact-desc'], 130)}`.replace(/^\s+/, '').replace(/\s+:/, ':'))}</li>`).join('');
  const block = `<!-- statenow:start -->
<section class="mc-statenow" aria-label="${esc(name)} road conditions at the last read" style="max-width:1000px;margin:12px 0;padding:14px 18px;border:1px solid #dbe5df;border-radius:12px;background:#f7faf8;font:15px/1.55 Inter,-apple-system,'Segoe UI',sans-serif;color:#1b2420">
<h2 style="font-size:18px;margin:0 0 6px">${esc(name)} at the last read</h2>
<p style="margin:0">The ${esc(dot)} feed lists ${plural(closures.length, 'closure-type alert')}, ${plural(crashes.length, 'crash', 'crashes')} and ${plural(work.length, 'roadwork alert')} on numbered highways right now. Closure-type alerts include lane closures, so read each one.${closures.length ? ' The first ones:' : ''}</p>
${lines ? `<ul style="margin:6px 0 0 18px;padding:0">${lines}</ul>${closures.length > 3 ? `<p style="margin:6px 0 0">And ${closures.length - 3} more on the map below.</p>` : ''}` : ''}
<p style="margin:8px 0 0;font-size:13.5px;color:#5b6670">Read on ${esc(PT.format(new Date(now)))} PT. Chain and traction rules are on the <a href="/chain-laws/${slug === 'alaska' ? 'arizona-new-mexico-alaska' : slug}/" style="color:#0f7a4f;font-weight:700">${esc(name)} chain law page</a>. A feed with no closure is not a promise a road is open. The map below updates live.</p>
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
