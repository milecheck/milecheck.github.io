#!/usr/bin/env node
// "Look up your highway" box for a monthly road report page (2026-10-13).
// Reads highwayTable from the report JSON (scripts/gen-road-report.mjs in the app repo)
// and writes one self-contained section above the "By state" heading. Re-runnable: it
// replaces everything between the two markers.
//
//   node scripts/add-highway-lookup.mjs blog/road-report-october-2026.html data/road-report-october-2026.json October
//
// Counts are per highway across every state it runs through, from the same deduped
// events as the rest of the report. No mileposts: about half the states publish them.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const [pageArg, jsonArg, monthName = 'this month'] = process.argv.slice(2);
if (!pageArg || !jsonArg) { console.error('usage: add-highway-lookup.mjs <page.html> <report.json> [MonthName]'); process.exit(1); }
const PAGE = resolve(ROOT, pageArg);
const D = JSON.parse(readFileSync(resolve(ROOT, jsonArg), 'utf8'));
const table = Array.isArray(D.highwayTable) ? D.highwayTable : [];
if (!table.length) { console.error('No highwayTable in ' + jsonArg + '. Regenerate the report JSON with the current gen-road-report.mjs.'); process.exit(1); }

const START = '<!--hwy-lookup:start-->';
const END = '<!--hwy-lookup:end-->';
// Compact rows: [route, total, crash, closure, construction, weather, "WA:34,OR:23"].
// One-off records are left out to keep the page small; the box says so.
const rows = table.filter((h) => h.total >= 2).map((h) => [
  h.route, h.total, h.crash || 0, h.closure || 0, h.construction || 0, h.weather || 0,
  Object.entries(h.states).sort((a, b) => b[1] - a[1]).map(([s, c]) => s + ':' + c).join(','),
]);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const section = `${START}
<section class="hwy-lookup" id="your-highway" aria-labelledby="hwy-h">
<h2 class="rc" id="hwy-h">Look up your highway</h2>
<p>Type a highway to see its ${esc(monthName)} reports from every state it runs through.</p>
<label for="hwy-q" class="hwy-label">Highway</label>
<input id="hwy-q" class="hwy-input" list="hwy-list" placeholder="I-90, US-101, CA-1" autocomplete="off" inputmode="text">
<datalist id="hwy-list">${rows.map((r) => `<option value="${esc(r[0])}">`).join('')}</datalist>
<div id="hwy-out" class="hwy-out" aria-live="polite"></div>
<p class="hwy-note">Counts are DOT reports, each counted once however many days it stayed up. Highways with a single report this month are not listed.</p>
</section>
<style>
.hwy-lookup{margin:2rem 0}.hwy-label{display:block;font-weight:600;margin:.5rem 0 .25rem}
.hwy-input{width:100%;max-width:22rem;font:inherit;padding:.6rem .75rem;border:1px solid currentColor;border-radius:8px;background:transparent;color:inherit}
.hwy-out{margin-top:1rem}.hwy-out table{border-collapse:collapse;width:100%;max-width:32rem}
.hwy-out td,.hwy-out th{padding:.35rem .5rem;border-bottom:1px solid rgba(127,127,127,.3);text-align:left}
.hwy-out td.n,.hwy-out th.n{text-align:right}.hwy-note{font-size:.85rem;opacity:.75}
</style>
<script>
(function(){
var R=${JSON.stringify(rows)};
var by={};R.forEach(function(r){by[r[0].toUpperCase().replace(/\\s+/g,'')]=r;});
var q=document.getElementById('hwy-q'),out=document.getElementById('hwy-out');
function key(v){v=String(v||'').toUpperCase().replace(/\\s+/g,'');var m=v.match(/^(I|US)-?(\\d+[A-Z]?)$/);return m?m[1]+'-'+m[2]:v;}
function n(x){return Number(x).toLocaleString('en-US');}
function show(){
  var v=q.value.trim();if(!v){out.innerHTML='';return;}
  var r=by[key(v)];
  if(!r){out.textContent='No reports on '+v+' this month, or it was not in the DOT feeds we read.';return;}
  var st=r[6].split(',').map(function(p){var a=p.split(':');return '<tr><td>'+a[0]+'</td><td class="n">'+n(a[1])+'</td></tr>';}).join('');
  out.innerHTML='<p><strong>'+r[0]+'</strong> had <strong>'+n(r[1])+'</strong> reports: '+n(r[2])+' crashes, '+n(r[3])+' closures, '+n(r[4])+' construction, '+n(r[5])+' weather.</p>'
    +'<table><thead><tr><th>State</th><th class="n">Reports</th></tr></thead><tbody>'+st+'</tbody></table>';
}
q.addEventListener('input',show);q.addEventListener('change',show);
})();
</script>
${END}`;

let html = readFileSync(PAGE, 'utf8');
if (html.includes(START)) {
  html = html.slice(0, html.indexOf(START)) + section + html.slice(html.indexOf(END) + END.length);
} else {
  const anchor = html.search(/<h2[^>]*id="by-state"/);
  if (anchor < 0) { console.error('No <h2 id="by-state"> on ' + pageArg + ' to place the lookup above.'); process.exit(1); }
  html = html.slice(0, anchor) + section + '\n' + html.slice(anchor);
}
writeFileSync(PAGE, html);
console.log(`Highway lookup: ${rows.length} highways written to ${pageArg}`);
