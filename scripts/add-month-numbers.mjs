#!/usr/bin/env node
// add-month-numbers.mjs — puts last month's real feed counts on state pages and hubs, from the
// newest data/road-report-<month>-<year>.json (newest by the file's own `month`, so a new month
// takes over without a code change).
//   1. One paragraph on /road-conditions/<state>/ and /cameras/<state>/ (skipped on road-conditions
//      pages that already carry the generator's own .rc-sept paragraph).
//   2. A "Busiest highways in <Month Year>" box on /closures/ and /maps/mile-markers/.
// The report page itself already lists ranked routes, so it is left alone.
// Blocks sit between <!-- monthnum:start --> and <!-- monthnum:end -->. Idempotent: strips its own
// block and re-inserts it in the same place, so a second run writes nothing.
// Run right after add-related-links.mjs. Optional: --skip-file=path (list of files to leave alone).
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';

const skipArg = process.argv.find(a => a.startsWith('--skip-file='));
const SKIP = new Set(skipArg ? readFileSync(skipArg.slice(12), 'utf8').split('\n').filter(Boolean) : []);

const ST = { AL:'alabama',AK:'alaska',AZ:'arizona',AR:'arkansas',CA:'california',CO:'colorado',CT:'connecticut',DE:'delaware',FL:'florida',GA:'georgia',HI:'hawaii',ID:'idaho',IL:'illinois',IN:'indiana',IA:'iowa',KS:'kansas',KY:'kentucky',LA:'louisiana',ME:'maine',MD:'maryland',MA:'massachusetts',MI:'michigan',MN:'minnesota',MS:'mississippi',MO:'missouri',MT:'montana',NE:'nebraska',NV:'nevada',NH:'new-hampshire',NJ:'new-jersey',NM:'new-mexico',NY:'new-york',NC:'north-carolina',ND:'north-dakota',OH:'ohio',OK:'oklahoma',OR:'oregon',PA:'pennsylvania',RI:'rhode-island',SC:'south-carolina',SD:'south-dakota',TN:'tennessee',TX:'texas',UT:'utah',VT:'vermont',VA:'virginia',WA:'washington',WV:'west-virginia',WI:'wisconsin',WY:'wyoming',BC:'british-columbia' };
const SLUG2CODE = Object.fromEntries(Object.entries(ST).map(([k, v]) => [v, k]));
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const titleSlug = s => s.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const num = n => n.toLocaleString('en-US');

// ---- newest report
const files = readdirSync('data').filter(f => /^road-report-[a-z]+-\d{4}\.json$/.test(f));
const reports = files.map(f => { const d = JSON.parse(readFileSync(`data/${f}`, 'utf8')); return { f, d, key: String(d.month || '') }; })
  .filter(r => /^\d{4}-\d{2}$/.test(r.key)).sort((a, b) => b.key.localeCompare(a.key));
if (!reports.length) { console.log('month numbers: no report data'); process.exit(0); }
const { d: R, f: RF } = reports[0];
const [yr, mo] = R.month.split('-'); const mname = MONTHS[+mo - 1], label = `${mname} ${yr}`;
const reportSlug = RF.replace(/\.json$/, '');                       // road-report-september-2026
const reportUrl = `/blog/${reportSlug}.html`;
const statesDir = `blog/highway-report-${mname.toLowerCase()}-${yr}-states`;
const JS = Object.fromEntries(R.jurisdictionSummary.map(j => [j.state, j]));

// ---- text helpers
const niceRoute = r => /\d/.test(r) ? r : r.split(' ').map(w => w.length > 3 && w === w.toUpperCase() ? w[0] + w.slice(1).toLowerCase() : w).join(' ');
const list = a => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
const plural = (n, one, many) => `${num(n)} ${n === 1 ? one : many}`;
function statePara(code, slug) {
  const j = JS[code]; if (!j || !(j.total > 0)) return null;
  const name = titleSlug(slug);
  const parts = [];
  if (j.closure > 0) parts.push(plural(j.closure, 'closure', 'closures'));
  if (j.crash > 0) parts.push(plural(j.crash, 'crash', 'crashes'));
  if (j.construction > 0) parts.push(plural(j.construction, 'construction report', 'construction reports'));
  if (j.weather > 0) parts.push(plural(j.weather, 'weather report', 'weather reports'));
  let t = `In ${label}, ${name}'s DOT feed carried ${num(j.total)} ${j.total === 1 ? 'alert' : 'alerts'}`;
  t += parts.length ? `: ${list(parts)}.` : '.';
  const routes = (j.topRoutes || []).slice(0, 3).map(niceRoute);
  if (routes.length) t += ` The busiest routes were ${list(routes)}.`;
  if (existsSync(`${statesDir}/${slug}.html`)) t += ` <a href="/${statesDir}/${slug}.html">See the full ${name} report</a>.`;
  return t;
}
const CSS_P = `.mc-monthnum{max-width:760px;margin:12px auto;padding:0 16px;font:15px/1.55 'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#3a444d;}.mc-monthnum p{margin:0;}.mc-monthnum a{color:#00A86B;font-weight:700;}`;
const paraBlock = t => `<!-- monthnum:start -->
  <div class="mc-monthnum"><style>${CSS_P}</style><p>${t}</p></div>
<!-- monthnum:end -->
`;
const CSS_B = `.mc-busy{max-width:760px;margin:20px auto;padding:0 16px;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;}.mc-busy h2{font-size:13px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#00A86B;margin:0 0 10px;}.mc-busy ol{list-style:none;margin:0 0 8px;padding:0;display:grid;gap:6px;}.mc-busy li{background:#fff;border:1px solid #E4EAE6;border-radius:10px;padding:10px 13px;font-size:15px;color:#0F1419;}.mc-busy li a{font-weight:700;color:#0F1419;text-decoration:none;}.mc-busy li a:hover{color:#00A86B;}.mc-busy p{margin:0;font-size:13px;line-height:1.5;color:#5A6670;}.mc-busy p a{color:#00A86B;font-weight:700;}`;
const top5 = (R.topCorridors || []).slice(0, 5);
const boxBlock = `<!-- monthnum:start -->
  <section class="mc-busy" aria-label="Busiest highways in ${label}">
    <style>${CSS_B}</style>
    <h2>Busiest highways in ${label}</h2>
    <ol>
${top5.map(([r, c], i) => { const s = r.toLowerCase(); const lbl = existsSync(`corridors/${s}/index.html`) ? `<a href="/corridors/${s}/">${esc(r)}</a>` : esc(r); return `      <li>${i + 1}. ${lbl}: ${num(c)} alerts</li>`; }).join('\n')}
    </ol>
    <p>Alerts in state DOT feeds, all states combined. Source: the <a href="${reportUrl}">MileCheck Highway Report</a>.</p>
  </section>
<!-- monthnum:end -->
`;

// ---- targets: [file, block, anchor regexes in priority order (insert before first match)]
const STRIP = /[ \t]*<!-- monthnum:start -->[\s\S]*?<!-- monthnum:end -->\n?/;
const targets = [];
for (const dir of ['cameras', 'road-conditions']) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (!e.isDirectory() || !SLUG2CODE[e.name]) continue;
    const file = `${dir}/${e.name}/index.html`; if (!existsSync(file)) continue;
    const t = statePara(SLUG2CODE[e.name], e.name);
    const anchors = dir === 'cameras' ? [/[ \t]*<div class="co-wrap">/, /[ \t]*<!-- related:start -->/]
      : [/[ \t]*<div class="rc-live">/, /[ \t]*<!-- related:start -->/];
    targets.push({ file, block: t ? paraBlock(t) : null, anchors, rc: dir === 'road-conditions' });
  }
}
targets.push({ file: 'closures/index.html', block: top5.length ? boxBlock : null, anchors: [/[ \t]*<!-- big:start -->/, /[ \t]*<div class="cl-wrap">/, /[ \t]*<!-- related:start -->/] });
targets.push({ file: 'maps/mile-markers/index.html', block: top5.length ? boxBlock : null, anchors: [/[ \t]*<!-- related:start -->/] });

let changed = 0, checked = 0; const skipped = [], noAnchor = [], dupes = [];
for (const t of targets) {
  if (!existsSync(t.file)) continue;
  if (SKIP.has(t.file)) { skipped.push(t.file); continue; }
  checked++;
  const o = readFileSync(t.file, 'utf8');
  let s = o.replace(STRIP, '');
  if (t.rc && /class="rc-sept"/.test(s)) { dupes.push(t.file); if (s !== o) { writeFileSync(t.file, s); changed++; } continue; }
  if (t.block) {
    let at = -1;
    for (const a of t.anchors) { at = s.search(a); if (at >= 0) break; }
    if (at < 0) { noAnchor.push(t.file); continue; }
    s = s.slice(0, at) + '  ' + t.block + s.slice(at);
  }
  if (s !== o) { writeFileSync(t.file, s); changed++; }
}
console.log(`month numbers (${label}): ${changed} changed, ${checked} pages checked${skipped.length ? `, ${skipped.length} skipped` : ''}${dupes.length ? `, ${dupes.length} already have .rc-sept` : ''}${noAnchor.length ? `, no anchor: ${noAnchor.join(' ')}` : ''}`);
