#!/usr/bin/env node
// gen-highway-report-v2-preview.mjs: the new Highway Report layout (Leah, 2026-11-09), as a PREVIEW.
// Reads the live October pages and data/road-report-<month>.json, and writes noindexed copies with the new
// top section. Redesign 2026-11-09 (Leah): show what drivers care about, not how much each feed publishes.
// Feeds report very different volumes (New Jersey posts every lane shift), so: no alert totals, no roadwork
// counts, no rankings between states. Instead: crashes and where they were, named major roadwork (ongoing,
// started, finished), closures that matter, agency announcements with a link, and quotes for newsrooms.
// Count wording: "MileCheck archived N alerts that <DOT> published", never "the DOT reported N".
//
//   node scripts/gen-highway-report-v2-preview.mjs
//   writes blog/road-report-october-2026-preview.html and blog/highway-report-october-2026-preview/<state>.html
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
// Site rule: every link opens in a new tab (Leah 11/12: states/provinces too).
function newTab(html) { return html.replace(/<a (?![^>]*\btarget=)([^>]*\bhref="(?!#|mailto:|tel:)[^"]*"[^>]*)>/g, '<a $1 target="_blank" rel="noopener">'); }
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const D = JSON.parse(readFileSync(resolve(ROOT, 'data/road-report-october-2026.json'), 'utf8'));
const MW = (() => { try { return JSON.parse(readFileSync(resolve(ROOT, 'data/road-report-october-2026-majorwork.json'), 'utf8')); } catch { return {}; } })();
const ANN = JSON.parse(readFileSync(resolve(ROOT, 'data/highway-report-announcements-2026-10.json'), 'utf8'));
const X = JSON.parse(readFileSync(resolve(ROOT, 'data/road-report-october-2026-extra.json'), 'utf8'));
const SRC_DIR = resolve(ROOT, 'blog/highway-report-october-2026-states');
const OUT_DIR = resolve(ROOT, 'blog/highway-report-october-2026-preview');
mkdirSync(OUT_DIR, { recursive: true });

const NAMES = { AL:'Alabama', AK:'Alaska', AZ:'Arizona', AR:'Arkansas', CA:'California', CO:'Colorado', CT:'Connecticut', DE:'Delaware', FL:'Florida', GA:'Georgia', HI:'Hawaii', ID:'Idaho', IL:'Illinois', IN:'Indiana', IA:'Iowa', KS:'Kansas', KY:'Kentucky', LA:'Louisiana', ME:'Maine', MD:'Maryland', MA:'Massachusetts', MI:'Michigan', MN:'Minnesota', MS:'Mississippi', MO:'Missouri', MT:'Montana', NE:'Nebraska', NV:'Nevada', NH:'New Hampshire', NJ:'New Jersey', NM:'New Mexico', NY:'New York', NC:'North Carolina', ND:'North Dakota', OH:'Ohio', OK:'Oklahoma', OR:'Oregon', PA:'Pennsylvania', RI:'Rhode Island', SC:'South Carolina', SD:'South Dakota', TN:'Tennessee', TX:'Texas', UT:'Utah', VT:'Vermont', VA:'Virginia', WA:'Washington', WV:'West Virginia', WI:'Wisconsin', WY:'Wyoming', BC:'British Columbia', AB:'Alberta', MB:'Manitoba' };
const DOT = { BC: 'DriveBC', AB: '511 Alberta', MB: 'Manitoba 511' };
const poss = (x) => (x.endsWith('s') ? `${x}'` : `${x}'s`);
const dotOf = (st) => DOT[st] || `${poss(NAMES[st])} department of transportation`;
const CANADA = new Set(['BC', 'AB', 'MB']);
// Feed changes that make September-to-October comparisons meaningless (same list as the live generator).
const NO_COMPARE = new Set(['NY', 'KY', 'VA']);
const REGIONS = {
  'Pacific Northwest': ['WA', 'OR', 'ID', 'AK', 'BC'],
  'California and the Southwest': ['CA', 'NV', 'AZ', 'NM', 'UT', 'HI'],
  'Rockies and Plains': ['MT', 'WY', 'CO', 'ND', 'SD', 'NE', 'KS', 'AB', 'MB'],
  'Texas and the South Central': ['TX', 'OK', 'AR', 'LA', 'MO'],
  'Midwest': ['MN', 'IA', 'WI', 'IL', 'IN', 'MI', 'OH'],
  'Southeast': ['KY', 'TN', 'MS', 'AL', 'GA', 'FL', 'SC', 'NC', 'VA', 'WV'],
  'Northeast': ['PA', 'NY', 'NJ', 'DE', 'MD', 'CT', 'RI', 'MA', 'VT', 'NH', 'ME'],
};
const slug = (st) => NAMES[st].toLowerCase().replace(/\s+/g, '-');
const n = (x) => Number(x || 0).toLocaleString('en-US');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const WA_I = new Set(['5', '82', '90', '182', '205', '405', '705']), WA_US = new Set(['2', '12', '97', '101', '195', '395', '730']);
const route0 = (st, r) => { const m = String(r).match(/^SR\s*-?\s*(\d+[A-Z]?)$/i); if (m && st === 'WA') return WA_I.has(m[1]) ? `I-${m[1]}` : WA_US.has(m[1]) ? `US-${m[1]}` : `SR-${m[1]}`; if (m) return `SR-${m[1]}`; return String(r); };
// Display names: Texas loops/spurs, all-caps highway names, NJ toll roads.
const route = (st, r) => { let x = route0(st, r); let m;
  if ((m = x.match(/^TX-(LOOP|SPUR)-(\w+)$/i))) return `${m[1][0].toUpperCase()}${m[1].slice(1).toLowerCase()} ${m[2]}`;
  if (x === 'NJ TURNPIKE') return 'NJ Turnpike'; if (x === 'GSP') return 'Garden State Parkway';
  if (/^[A-Z][A-Z .'-]+$/.test(x) && /[A-Z]{3,}/.test(x) && !/^(I|US|SR)\b/.test(x)) return x.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase());
  return x; };
const pct = (now, before) => (before ? Math.round(((now - before) / before) * 100) : null);
// Leah 2026-11-09: no month-to-month comparisons. September was not archived cleanly enough to compare against.
const COMPARE = false;
const chg = (now, before, st) => {
  if (!COMPARE) return '';
  if (st) return '<em class="v2-flat">feed changed, not comparable</em>';
  const p = pct(now, before); if (p === null) return '<em class="v2-flat">new this month</em>';
  if (p === 0) return '<em class="v2-flat">same as September</em>';
  return `<em class="${p > 0 ? 'v2-up' : 'v2-down'}">${p > 0 ? '▲' : '▼'} ${Math.abs(p)}% from September</em>`;
};
const J = Object.fromEntries(D.jurisdictionSummary.map((j) => [j.state, j]));
// September from the October file's full-month history (data/road-report-september-2026.json is an older
// partial count). States whose September is not a comparable full month get no comparison.
const JP = {};
for (const [st, h] of Object.entries(D.stateHistory)) { const m = h.find((x) => x.month === '2026-09'); if (m && m.comparable) JP[st] = m; }
const CMP = Object.keys(JP).filter((s) => J[s] && !NO_COMPARE.has(s));
const sumOf = (src, key) => CMP.reduce((a, s) => a + (src[s][key] || 0), 0);
const PT = { total: sumOf(JP, 'total'), crash: sumOf(JP, 'crash'), closure: sumOf(JP, 'closure'), construction: sumOf(JP, 'construction') };
const NT = { total: sumOf(J, 'total'), crash: sumOf(J, 'crash'), closure: sumOf(J, 'closure'), construction: sumOf(J, 'construction') };
const snowBy = {}; for (const p of D.mapPoints.snow) snowBy[p[2]] = (snowBy[p[2]] || 0) + 1;
const fireBy = Object.fromEntries(D.wildfires.byState.map((f) => [f.state, f]));
const roadwork = (j) => (j ? j.construction || 0 : 0);

const CSS = `<style data-v2>
.v2-nums{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:0 0 22px}
.v2-nums div{background:#F7F8F9;border:1px solid #E4E7EA;border-radius:10px;padding:14px}
.v2-nums b{display:block;font-family:'JetBrains Mono',monospace;font-size:26px;color:#0F1419;line-height:1.1;font-variant-numeric:tabular-nums}
.v2-nums span{display:block;font-size:13px;color:#5C6670;margin-top:6px;line-height:1.35}
.v2-nums em,.v2-grid em{font-style:normal;font-size:12.5px;font-weight:700;display:block;margin-top:4px}
.v2-up{color:#B42318}.v2-down{color:#0f7a4f}.v2-flat{color:#5C6670}
.v2-sec{margin:0 0 30px}.v2-sec h2{margin:0 0 6px}.v2-sec>p.v2-sub{margin:0 0 14px;color:#5C6670;font-size:15px}
.v2-gridwrap{overflow-x:auto;-webkit-overflow-scrolling:touch;border:1px solid #E4E7EA;border-radius:10px}
.v2-grid{width:100%!important;border-collapse:collapse;font-size:14.5px;display:table!important}
.v2-grid th{background:#0F1419;color:#fff;text-align:left;padding:10px 12px;font-size:12.5px;letter-spacing:.02em;text-transform:uppercase}
.v2-grid td{padding:11px 12px;border-top:1px solid #E4E7EA;vertical-align:top}
.v2-grid td:first-child{font-weight:700;white-space:nowrap}
.v2-mix{display:flex;height:10px;border-radius:5px;overflow:hidden;min-width:110px;margin-top:4px;background:#EEF0F2}
.v2-mix i{display:block}.v2-mix .c{background:#D92D20}.v2-mix .k{background:#F79009}.v2-mix .r{background:#2E90FA}.v2-mix .o{background:#98A2B3}
.v2-key{display:flex;flex-wrap:wrap;gap:12px;font-size:12.5px;color:#5C6670;margin:10px 0 0}.v2-key i{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:5px;vertical-align:-1px}
.v2-pivot{list-style:none;padding:0;margin:0;display:grid;gap:10px}
.v2-pivot li{background:#F4F8F6;border-left:4px solid #0f7a4f;border-radius:8px;padding:12px 14px;font-size:15.5px;line-height:1.5}
.v2-pivot li strong{display:block;font-size:13px;text-transform:uppercase;letter-spacing:.03em;color:#0f7a4f;margin-bottom:3px}
.v2-quote{margin:0 0 12px;padding:14px 16px;border:1px dashed #C9CED3;border-radius:10px;background:#fff;font-size:15.5px;line-height:1.55}
.v2-quote strong{display:block;margin-bottom:4px}.v2-quote small{display:block;color:#5C6670;margin-top:8px;font-size:12.5px}
.v2-rank{display:grid;gap:6px}.v2-rank a{display:grid;grid-template-columns:130px 1fr 64px;align-items:center;gap:10px;text-decoration:none;color:#0F1419;font-size:14.5px;min-height:32px}
.v2-rank .bar{height:16px;border-radius:4px;background:linear-gradient(90deg,#0f7a4f,#2E90FA)}
.v2-rank b{font-family:'JetBrains Mono',monospace;font-size:13.5px;text-align:right}
.v2-regions{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px}
.v2-region{border:1px solid #E4E7EA;border-radius:10px;padding:14px}.v2-region h3{margin:0 0 6px;font-size:17px}.v2-region p{margin:0;font-size:14.5px;line-height:1.5;color:#3D454D}
.v2-proj{border:1px solid #E4E7EA;border-radius:10px;padding:12px 14px;margin:0 0 10px;background:#fff}
.v2-proj .tag{display:inline-block;font-size:11.5px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;padding:2px 8px;border-radius:999px;margin-right:6px;vertical-align:1px}
.v2-proj .t-on{background:#EFF8FF;color:#175CD3}.v2-proj .t-new{background:#FEF6EE;color:#B93815}.v2-proj .t-done{background:#ECFDF3;color:#067647}.v2-proj .t-cl{background:#FEF3F2;color:#B42318}
.v2-proj b{font-size:15.5px}.v2-proj p{margin:6px 0 0;font-size:14.5px;line-height:1.5;color:#3D454D}.v2-proj small{display:block;margin-top:6px;color:#5C6670;font-size:12.5px}
.v2-ann{border:1px solid #DCE9E1;border-left:4px solid #0f7a4f;border-radius:10px;padding:14px 16px;margin:0 0 12px;background:#F4F8F6}
.v2-ann b{display:block;font-size:16px;margin-bottom:6px}.v2-ann p{margin:0 0 8px;font-size:15px;line-height:1.55}.v2-ann a{font-weight:700;color:#0f7a4f}
.v2-rel{margin:4px 0 22px;font-size:13px;line-height:1.6;color:#5C6670}.v2-rel a{color:#0f7a4f;font-weight:600}
@media (max-width:420px){.v2-rank a{grid-template-columns:96px 1fr 56px;font-size:13.5px}}
  .v2-recap{background:#F4F8F6;border-left:4px solid #0f7a4f;border-radius:8px;padding:14px 16px;margin:18px 0 22px}.v2-recap strong{display:block;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#0f7a4f;margin-bottom:6px}.v2-recap p{margin:0;font-size:17px;line-height:1.6}.spon-strip{margin:0 0 14px;padding:7px 12px;border:1px solid #cfe3d7;border-radius:8px;background:#f3f7f4;font-size:13.5px;line-height:1.35;color:#1f3b2d;}
  .spon-strip a{color:#0f7a4f;font-weight:700;}
</style>`;

const mixBar = (c, k, r, o) => { const t = c + k + r + o || 1; return `<div class="v2-mix" role="img" aria-label="${c} crash, ${k} closure, ${r} roadwork, ${o} other"><i class="c" style="flex:${c}"></i><i class="k" style="flex:${k}"></i><i class="r" style="flex:${r}"></i><i class="o" style="flex:${o}"></i></div>`; };
const KEY = `<div class="v2-key"><span><i style="background:#D92D20"></i>crash</span><span><i style="background:#F79009"></i>closure</span><span><i style="background:#2E90FA"></i>roadwork</span><span><i style="background:#98A2B3"></i>other</span></div>`;
const share = (a, b) => (b ? `${Math.round((a / b) * 100)}%` : '');

// ---------- state pages ----------

const fmtD = (iso) => { const [y, m, d] = iso.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' }); };
// Feed text cleanup: whole-caps text to sentence case, ALL-CAPS words of 4+ letters to Title Case (street
// names like SWEETWATER RD), feed prefixes and stray leading dashes removed.
const SMALL = new Set(['TO', 'OF', 'ON', 'AT', 'IN', 'BY']), WORD3 = new Set(['NEW', 'OFF', 'END', 'AND', 'THE', 'FOR', 'ALL', 'ONE', 'TWO', 'NOW']);
const deCap = (t) => t.replace(/\b[A-Z]{4,}\b/g, (w) => w[0] + w.slice(1).toLowerCase()).replace(/\b[A-Z]{2,3}\b/g, (w) => (SMALL.has(w) ? w.toLowerCase() : WORD3.has(w) ? w[0] + w.slice(1).toLowerCase() : w));
const cutClean = (t) => { t = String(t); if (t.length < 200 || /[.!?)]$/.test(t)) return t; const i = Math.max(t.lastIndexOf('. '), t.lastIndexOf('! ')); return i > 60 ? t.slice(0, i + 1) : t.replace(/\s+\S*$/, '…'); };
const clean = (h) => { let t = cutClean(h).replace(/\s+/g, ' ').replace(/^Caltrans (lane|full) closure\s+C\w+$/i, (m, k) => k[0].toUpperCase() + k.slice(1) + ' closure').replace(/^Scheduled Road Work on /i, 'Roadwork on ').replace(/^(Road ?Work|Construction|Scheduled Road Work|Restrictions)\s*[:-]\s*/i, '').replace(/^[-–—\s]+/, '').trim(); if (t === t.toUpperCase()) t = t.charAt(0) + t.slice(1).toLowerCase(); t = deCap(t); return t.charAt(0).toUpperCase() + t.slice(1); };
// A place is shown only when it is a short place name, not a copy of the headline or the route.
const placeOf = (st, p) => { const x = String(p.place || '').trim(); if (!x || x.length > 40 || /\*\*|^[-–—]/.test(x) || /[A-Z]{2}\d{3,}|\d+\.\d+ miles/i.test(x) || (x === x.toUpperCase() && x.length > 20) || (p.route && x.replace(/\W/g, '').toUpperCase().startsWith(String(p.route).replace(/\W/g, '').toUpperCase()))) return ''; return x === x.toUpperCase() ? x.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase()) : x; };
const projCard = (st, p, kind) => {
  const tag = { ongoing: ['t-on', 'Ongoing'], started: ['t-new', p.seenBasis ? 'New on the feed this month' : 'Roadwork starting this month'], finished: ['t-done', p.seenBasis ? 'Off the feed this month' : 'Roadwork ending this month'] }[kind];
  // Archive-dated projects (feeds with no posted dates): say what we saw, never a posted date (Leah 11/12).
  const when = p.seenBasis
    ? (kind === 'finished' ? `On the feed ${p.startIsFloor ? 'since at least ' : 'from '}${fmtD(p.start)}, last seen ${fmtD(p.end)}`
      : kind === 'started' ? `First seen ${fmtD(p.start)}, still on the feed ${fmtD(p.end)}`
      : `On the feed since ${p.startIsFloor ? 'at least ' : ''}${fmtD(p.start)}`)
    : kind === 'finished' ? `Posted to run ${fmtD(p.start)} to ${fmtD(p.end)}` : kind === 'started' ? `Started ${fmtD(p.start)}, posted to end ${fmtD(p.end)}` : `Since ${fmtD(p.start)}, posted to end ${fmtD(p.end)}`;
  return `<div class="v2-proj"><span class="tag ${tag[0]}">${tag[1]}</span>${p.closure ? '<span class="tag t-cl">Road closed</span>' : ''}<b>${esc(p.route ? route(st, p.route) : 'Roadwork')}${placeOf(st, p) ? `, ${esc(placeOf(st, p))}` : ''}</b><p>${esc(clean(p.headline))}</p><small>${when}. Source: ${esc(dotOf(st))}.</small></div>`;
};
const annCard = (a) => `<div class="v2-ann"><b>${esc(a.title)}</b><p>${esc(a.text)}</p><a href="${a.url}" target="_blank" rel="noopener">Read it from ${esc(a.source.split(',')[0])} &rarr;</a></div>`;


// Leah 2026-11-09: cross-link every report to the articles we have, in small text, always in a new tab.
const A = (href, text) => `<a href="${href}" target="_blank" rel="noopener">${text}</a>`;
const relLine = (links) => (links.length ? `<p class="v2-rel">Related: ${links.join(' · ')}</p>` : '');
const STATE_READS = {
  WA: [['/chains-required-snoqualmie-pass/', 'Chains on Snoqualmie Pass today'], ['/chains-required-stevens-pass/', 'Chains on Stevens Pass today'], ['/why-does-snoqualmie-pass-close/', 'Why Snoqualmie Pass closes'], ['/how-often-are-chains-required-on-washington-passes/', 'How often Washington passes require chains'], ['/snow-tires-wa-or-co/', 'Snow tires in WA, OR or CO']],
  OR: [['/chains-required-mt-hood/', 'Chains to Mt Hood today'], ['/snow-tires-wa-or-co/', 'Snow tires in WA, OR or CO']],
  CO: [['/why-does-i-70-close-in-colorado/', 'Why I-70 closes so often'], ['/snow-tires-wa-or-co/', 'Snow tires in WA, OR or CO']],
  WY: [['/why-does-i-80-close-in-wyoming/', 'Why I-80 closes so often']],
  CA: [['/what-do-r1-r2-r3-chain-controls-mean-on-i-80/', 'What R1, R2 and R3 chain controls mean']],
};
const WINTER_READS = [['/how-do-you-know-if-a-mountain-pass-is-open/', 'Is the pass open?'], ['/how-to-put-on-tire-chains/', 'How to put on tire chains'], ['/what-is-black-ice/', 'Black ice']];
const CRASH_READS = [['/how-long-do-crashes-take-to-clear/', 'How long a crash takes to clear'], ['/how-do-i-tell-911-where-i-am-on-the-highway/', 'How to tell 911 where you are']];
const BORDER_READS = [['/border-wait-times/', 'When the border wait is shortest']];
// Every link in the article opens in a new tab (in-page # links and mailto excepted).
const newTabs = (h) => h.replace(/(<main[\s\S]*?<\/main>)/, (m) => m.replace(/<a (?![^>]*target=)([^>]*href="(?!#|mailto:)[^"]*"[^>]*)>/g, '<a $1 target="_blank" rel="noopener">'));

function stateTop(st) {
  const j = J[st]; const name = NAMES[st];
  const ch = D.crashHotspots[st] || {}; const crashRoutes = (ch.routes || []).map(([r, c]) => [route(st, r), c]);
  const sameAs = (a, b) => String(a).replace(/[^a-z0-9]/gi, '').toLowerCase() === String(b).replace(/[^a-z0-9]/gi, '').toLowerCase();
  const places = (ch.places || []).filter((x) => x.place && x.crashes > 1 && !sameAs(x.place, x.route) && !sameAs(x.place, route(st, x.route)));
  // Not projects, or barely affect drivers: oversize/weight/permit notices, shoulder-only closures, "No Lane Closure".
  const OK_P = (p) => !/oversize|weight limit|permit/i.test(p.headline) && !/no lane closure/i.test(p.headline)
    && !(/shoulder/i.test(p.headline) && !/lanes? (closed|blocked|reduced|disrupted)|reduced to|full closure|road closed|ramp closed|all lanes|detour|alternat/i.test(p.headline));
  const seenP = new Set(); const uniq = (p) => { const k = `${p.route}|${placeOf(st, p) || clean(p.headline).replace(/\b(north|south|east|west)bound\b|\bboth directions\b|\b[NSEW]B\b/gi, '').replace(/\W+/g, ' ').trim().slice(0, 40)}`.toLowerCase(); if (seenP.has(k)) return false; seenP.add(k); return true; };
  const mw0 = MW[st] || { ongoing: [], started: [], finished: [] };
  const mw = { finished: mw0.finished.filter(OK_P).filter(uniq), started: mw0.started.filter(OK_P).filter(uniq), ongoing: mw0.ongoing.filter(OK_P).filter(uniq) };
  const ann = ANN[st] || [];
  const seasonal = D.seasonalClosures[st] || [];
  const snow = snowBy[st] || 0, fire = fireBy[st];
  const waits = D.borderWaits.all.filter((w) => w.state === st).sort((a, b) => b.maxMin - a.maxMin);
  const hm = (m) => { const h = Math.floor(m / 60), r = m % 60; return h ? `${h} hr${r ? ` ${r} min` : ''}` : `${r} min`; };
  const crashTop = crashRoutes[0];

  // Leah 2026-11-09: cover the whole state, not one city. Roadwork cards are picked across the state: the
  // state's extent comes from its own crash/closure points, split into a 3x3 grid, and cards are taken one per
  // area in turn (longest first within an area) before any area gets a second. Up to 8.
  const pts = [...D.mapPoints.crash, ...D.mapPoints.closure].filter((q) => q[2] === st);
  const all = [...mw.finished.map((p) => ({ p, k: 'finished' })), ...mw.started.map((p) => ({ p, k: 'started' })), ...mw.ongoing.map((p) => ({ p, k: 'ongoing' }))];
  let picked = all.slice(0, 8);
  if (pts.length > 10 && all.length > 8) {
    const lats = pts.map((q) => q[0]).sort((x, y) => x - y), lons = pts.map((q) => q[1]).sort((x, y) => x - y);
    const lo = (v) => v[Math.floor(v.length * 0.02)], hi = (v) => v[Math.ceil(v.length * 0.98) - 1];
    const cell = (x) => (x.p.lat == null ? 'x' : `${Math.min(2, Math.max(0, Math.floor(((x.p.lat - lo(lats)) / (hi(lats) - lo(lats) || 1)) * 3)))}${Math.min(2, Math.max(0, Math.floor(((x.p.lon - lo(lons)) / (hi(lons) - lo(lons) || 1)) * 3)))}`);
    const groups = new Map(); for (const x of all) { const c = cell(x); if (!groups.has(c)) groups.set(c, []); groups.get(c).push(x); }
    for (const g of groups.values()) g.sort((x, y) => (x.k === 'ongoing') - (y.k === 'ongoing') || y.p.projectDays - x.p.projectDays);
    picked = []; const qs = [...groups.values()];
    while (picked.length < 8 && qs.some((g) => g.length)) for (const g of qs) { if (g.length && picked.length < 8) picked.push(g.shift()); }
  }
  // Routes for the lede come in the spread-across-the-state order, before the cards are sorted by status.
  const workRoutes = [...new Set(picked.map((x) => x.p.route && route(st, x.p.route)).filter(Boolean))];
  const order = { finished: 0, started: 1, ongoing: 2 };
  picked.sort((x, y) => order[x.k] - order[y.k]);
  const list3 = (a) => (a.length <= 1 ? a.join('') : a.length === 2 ? a.join(' and ') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`);

  const themes = [];
  if (seasonal.length) themes.push('winter closures'); else if (snow) themes.push('snow and ice');
  if (picked.length) themes.push('roadwork');
  if (crashTop && j.crash > 0) themes.push('crashes');
  const headline = themes.length >= 2 ? `${name} in October: ${list3(themes.slice(0, 3))}` : themes[0] === 'roadwork' ? `${name} in October: the major roadwork` : themes[0] === 'winter closures' ? `${name} in October: winter closures` : themes[0] === 'first snow' ? `${name} in October: the first snow` : themes[0] === 'crashes' ? `${name} in October: where the crashes were` : `${name} in October: closures on the map`;

  const lede = [];
  // The generator keeps at most 15 per group, so a count of 15 means "15 or more" and is never stated as exact.
  const cnt = (k) => (k >= 15 ? 'More than a dozen' : String(k));
  if (workRoutes.length) lede.push(`Across ${name} in October, major roadwork ran on ${list3(workRoutes.slice(0, 4))}.`); // Leah 11/9: no roadwork counts
  const crashFirst = !workRoutes.length; const winterLede = [];
  if (seasonal.length) winterLede.push(`${seasonal.length} seasonal closure${seasonal.length === 1 ? ' was' : 's were'} on the feed by Oct. 31.`);
  else if (snow) winterLede.push(snow === 1 ? 'The first snow and ice alert of the season showed up.' : `The first snow and ice alerts of the season showed up, ${snow} of them.`);
  const Dot = dotOf(st).replace(/^./, (c) => c.toUpperCase());
  // A feed with no crash alerts usually doesn't publish crashes at all; never print "0 crash alerts".
  if (j.crash > 0) lede.push(`${Dot} posted ${n(j.crash)} crash alert${j.crash === 1 ? '' : 's'}${crashTop && crashTop[1] >= 2 ? `, ${crashTop[1]} of them on ${crashTop[0]}` : ''}.`);
  lede.push(...winterLede);
  if (!lede.length) lede.push(`${Dot} posted ${n(j.closure)} closure alert${j.closure === 1 ? '' : 's'} in October. The map below shows where.`);

  const nums = `<div class="v2-nums">
${j.crash > 0 ? `<div><b>${n(j.crash)}</b><span>crash alerts</span></div>` : ''}
${crashTop && crashTop[1] >= 2 ? `<div><b>${esc(crashTop[0])}</b><span>most crash alerts, ${crashTop[1]}</span></div>` : ''}
${seasonal.length ? `<div><b>${seasonal.length}</b><span>winter closures by Oct. 31</span></div>` : ''}
</div>`;

  const S = [];
  const cards = picked.map((x) => projCard(st, x.p, x.k));
  // ChatGPT review 11/12: when a feed can't support the section, say so instead of leaving a gap.
  if (!cards.length) S.push(`<section class="v2-sec"><h2 class="rc">Major roadwork</h2><p class="v2-sub">No roadwork item on ${esc(dotOf(st))}'s road feed stayed listed for a month or more in October, so there is no long project to show here. Short lane closures are on the <a href="/closures/" target="_blank" rel="noopener">live closures map</a>.</p></section>`);
  if (cards.length) S.push(`<section class="v2-sec"><h2 class="rc">Major roadwork</h2><p class="v2-sub">Projects that ${esc(dotOf(st))} listed in October that run a month or longer, ${(mw.ongoing.concat(mw.started, mw.finished)).some((p) => p.seenBasis) ? 'dated by when our daily copy of the feed first and last showed them, since this feed posts no start or end dates' : 'with the dates the agency posted'}. Short lane closures are left out. Picked from across the ${CANADA.has(st) ? 'province' : 'state'}, not just the cities.</p>${cards.join('')}</section>`);
  if (ann.length) S.push(`<section class="v2-sec"><h2 class="rc">News from ${esc(dotOf(st))}</h2>${ann.map(annCard).join('')}</section>`);
  // The live pages already have an 'Areas and routes named in two or more crash alerts' box; don't repeat it.
  if (false && places.length) S.push(`<section class="v2-sec"><h2 class="rc">Where the crashes were</h2><ul class="v2-pivot">${places.map((x) => `<li><strong>${esc(route(st, x.route))}</strong>${esc(x.place)}: ${x.crashes} crash alerts</li>`).join('')}</ul></section>`);
  // Leah 2026-11-09: no wildfires (the fire feed lists every fire of the season, most of them contained, and
  // October readers don't care anymore). The report is read in November, so bridge to what's coming: weather.
  const CHAIN = { AZ: 'arizona-new-mexico-alaska', NM: 'arizona-new-mexico-alaska', AK: 'arizona-new-mexico-alaska', BC: 'british-columbia', CA: 'california', CO: 'colorado', ID: 'idaho', MD: 'maryland', MT: 'montana', NV: 'nevada', NY: 'new-york', OR: 'oregon', PA: 'pennsylvania', SD: 'south-dakota', UT: 'utah', VT: 'vermont', WA: 'washington', WY: 'wyoming' };
  const chainLinks = [CHAIN[st] ? [`/chain-laws/${CHAIN[st]}/`, `Chain laws in ${name}`] : null, ...(STATE_READS[st] || [])].filter(Boolean);
  const winterLinks = (CHAIN[st] || seasonal.length || snow) ? [...chainLinks, ...WINTER_READS] : [];
  const hasWinterSec = SRC_HAS_WINTER.has(st);
  const wx = [];
  if (snow) wx.push(`<li><strong>Snow and ice</strong>${snow} alert${snow === 1 ? '' : 's'} in October named snow, ice or chains on the road. Expect more as November goes on.</li>`);
  if (seasonal.length) wx.push(`<li><strong>Winter closures</strong>${seasonal.length} seasonal closure${seasonal.length === 1 ? ' was' : 's were'} already on the feed by Oct. 31.${hasWinterSec ? ' The roads that close every winter, with their usual dates, are listed below.' : ''}</li>`);
  if (!hasWinterSec && CHAIN[st]) wx.push(`<li><strong>Chains</strong>${name} has winter tire and chain rules. ${A(`/chain-laws/${CHAIN[st]}/`, 'What the law requires &rarr;')}</li>`);
  if (!hasWinterSec && wx.length) wx.push(`<li><strong>Before you go</strong>${A('/chains/', 'Live chain and winter road map &rarr;')}</li>`);
  if (wx.length) S.push(`<section class="v2-sec"><h2 class="rc">Heading into November</h2><ul class="v2-pivot">${wx.join('')}</ul>${hasWinterSec ? '' : relLine(winterLinks.map(([h, t]) => A(h, t)))}</section>`);
  const q = [];
  if (crashTop && j.crash > 0) q.push(`<div class="v2-quote"><strong>Crashes</strong>“${esc(dotOf(st).replace(/^./, (c) => c.toUpperCase()))} posted ${n(j.crash)} crash alerts in October, according to the MileCheck Highway Report. ${crashTop[1] >= 2 ? `${esc(crashTop[0])} had the most, ${crashTop[1]}.` : ''}”</div>`);
  const qp = mw.finished[0] || mw.started[0];
  if (qp && qp.route) q.push(`<div class="v2-quote"><strong>Roadwork</strong>“The ${mw.finished[0] ? 'roadwork' : 'new roadwork'} on ${esc(route(st, qp.route))} ${qp.seenBasis ? (mw.finished[0] ? `was last seen on the agency's road feed ${fmtD(qp.end)}` : `first appeared on the agency's road feed ${fmtD(qp.start)}`) : mw.finished[0] ? `had a posted end date of ${fmtD(qp.end)}` : `had a posted start date of ${fmtD(qp.start)} and a posted end date of ${fmtD(qp.end)}`}, according to the MileCheck Highway Report.”</div>`);
  if (q.length) S.push(`<section class="v2-sec"><h2 class="rc">For newsrooms</h2><p class="v2-sub">Free to quote with credit to the MileCheck Highway Report and a link to this page.</p>${q.join('')}</section>`);
  const desc = `${name} in October 2026: ${list3([crashTop ? 'where the crashes were' : null, picked.length ? 'the major roadwork' : null, (seasonal.length || snow) ? 'winter closures' : null].filter(Boolean)) || 'the roads'}, and what to expect heading into November. From the MileCheck Highway Report.`;
  return { headline, lede: lede.join(' '), nums, body: S.join('\n'), desc, winterRel: relLine(winterLinks.map(([h, t]) => A(h, t))) };
}

// Leah 2026-11-09: no sign-up line up high. A small pop-up asks once, after 25 seconds or 40% of the page,
// with "Get the next report" (opens /report/ in a new tab, which has a back link) and "Already subscribed"
// (never asks again on this device). "Not now" hides it for this visit.
// Leah 2026-11-09: after "Get the next report" or "Already subscribed", the same box turns into
// "Share this report with a friend": the phone's share sheet when there is one, Text on phones,
// Email and Copy link everywhere. The link shared is this page, without query strings.
const BTN = 'flex:1 1 120px;text-align:center;padding:11px 12px;min-height:44px;box-sizing:border-box;border-radius:10px;font-weight:700;font-size:15px;text-decoration:none;cursor:pointer;';
const POPUP = (from) => `<div id="mc-pop" role="dialog" aria-label="Get the next Highway Report" hidden style="position:fixed;left:12px;right:12px;bottom:12px;z-index:9999;max-width:420px;margin:0 auto;background:#fff;border:1px solid #DCE9E1;border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,.18);padding:16px 16px 12px;font-family:Inter,-apple-system,sans-serif;">
<button type="button" data-x aria-label="Close" style="position:absolute;top:6px;right:8px;width:36px;height:36px;border:0;background:none;font-size:22px;color:#5C6670;cursor:pointer">&times;</button>
<div data-step="ask"><p style="margin:0 34px 12px 0;font-size:16px;font-weight:700;color:#0F1419;line-height:1.35">Get next month's Highway Report in your inbox.</p>
<div style="display:flex;gap:8px;flex-wrap:wrap"><a href="/report/?from=${encodeURIComponent(from)}" target="_blank" rel="opener" data-go style="${BTN}background:#0f7a4f;color:#fff;border:0">Get the next report</a><button type="button" data-sub style="${BTN}border:1px solid #C9CED3;background:#fff;color:#0F1419;font-weight:600">Already subscribed</button></div></div>
<div data-step="share" hidden><p data-head style="margin:0 34px 4px 0;font-size:16px;font-weight:700;color:#0F1419;line-height:1.35">Thanks!</p><p style="margin:0 0 12px;font-size:14.5px;color:#3D454D">Share this report with a friend.</p>
<div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" data-native hidden style="${BTN}background:#0f7a4f;color:#fff;border:0">Share</button><a data-sms hidden style="${BTN}border:1px solid #C9CED3;background:#fff;color:#0F1419">Text</a><a data-mail style="${BTN}border:1px solid #C9CED3;background:#fff;color:#0F1419">Email</a><button type="button" data-copy style="${BTN}border:1px solid #C9CED3;background:#fff;color:#0F1419">Copy link</button></div></div></div>
<script>(function(){var K='mcHrSub',p=document.getElementById('mc-pop');function g(s,k){try{return s.getItem(k)}catch(e){return null}}function set(s,k){try{s.setItem(k,'1')}catch(e){}}
if(g(localStorage,K)||g(sessionStorage,K+'Seen'))return;var shown=false;function show(){if(shown)return;shown=true;set(sessionStorage,K+'Seen');p.hidden=false;removeEventListener('scroll',sc)}
function sc(){if(scrollY>(document.body.scrollHeight-innerHeight)*0.4)show()}setTimeout(show,25000);addEventListener('scroll',sc,{passive:true});
var url=location.origin+location.pathname,t=(document.querySelector('h1')||{}).textContent||document.title,msg=t.trim()+' (MileCheck Highway Report) '+url,q=function(x){return p.querySelector(x)};
var mobile=/iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
q('[data-mail]').href='mailto:?subject='+encodeURIComponent('MileCheck Highway Report: '+t.trim())+'&body='+encodeURIComponent('Thought you might want this: '+url);
if(mobile){var sm=q('[data-sms]');sm.href='sms:?&body='+encodeURIComponent(msg);sm.hidden=false}
if(navigator.share){var nb=q('[data-native]');nb.hidden=false;nb.onclick=function(){navigator.share({title:'MileCheck Highway Report',text:t.trim(),url:url}).catch(function(){})}}
q('[data-copy]').onclick=function(){var b=this;function ok(){b.textContent='Copied';setTimeout(function(){b.textContent='Copy link'},2000)}if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(url).then(ok,function(){prompt('Copy this link:',url)})}else{prompt('Copy this link:',url)}};
function toShare(head){q('[data-head]').textContent=head;q('[data-step="ask"]').hidden=true;q('[data-step="share"]').hidden=false}
q('[data-x]').onclick=function(){p.hidden=true};q('[data-go]').addEventListener('click',function(){toShare('Finish signing up in the new tab.')});q('[data-sub]').onclick=function(){set(localStorage,K);toShare('Thanks for reading!')}})()</script>`;
const LINK = (from) => `<a href="/report/?from=${encodeURIComponent(from)}" target="_blank" rel="opener">`;
const setTitle = (h, T) => h.replace(/<title>[^<]*<\/title>/, `<title>${esc(T)}</title>`)
  .replace(/(<meta (?:property="og:title"|name="twitter:title") content=")[^"]*"/g, (m, a) => `${a}${esc(T)}"`);
const SPON_STRIP = `<p class="spon-strip" id="spon" data-slot="article:highway-report" data-sponsor="house">Sponsor next month's Highway Report for only $99. <a href="mailto:sales@milecheckapp.com?subject=Sponsor%20the%20next%20Highway%20Report" data-spon-link>Email us</a>.</p>`;
const finish = (h, from) => {
  h = h.replace(/<p class="mc-cta-line"[\s\S]*?<\/p>/, ''); // the old top line
  h = h.replace(/(<p class="mc-cta-sub">)<a href="#subscribe"[^>]*>[^<]*/g, `$1${LINK(from)}Get the next report &rarr;`); // national: link under the state picker
  // Leah 11/9: the month chart goes until the archive has clean earlier months.
  h = h.replace(/<h2 class="rc">Compared with earlier months<\/h2>[\s\S]*?(?=<h2|<section class="v2-sec">)/, '');

  // ChatGPT review 11/12: claims the archive can't support, and internal notes that leaked onto the page.
  h = h.replace(/, the first of the season, according to/g, ', according to')
    .replace(/The first snow and ice alerts of the season showed up, (\d+) of them\./g, 'The feed carried $1 alerts that named snow, ice or chains.')
    .replace(/The first snow and ice alert of the season showed up\./g, 'The feed carried one alert that named snow, ice or chains.')
    .replace(/The first (\d+) snow and ice alerts reached the lower 48, and the longest border wait was ([^,.<]+) at ([^.<]+?)\./, '$1 alerts in the lower 48 named snow, ice or chains, and the highest hourly border-wait reading was $2 at $3.')
    .replace(/, and how the month compares with the state's earlier months\./g, '.')
    .replace(/ Not all feeds report the same data, so compare each place with its own earlier months\./g, ' Feeds publish different kinds of records, so these figures describe what each feed showed, not every event on the road.')
    .replace(/ \((\w[^()<]*?) \((?:no segment text on page|segment not given on page)\)\)/g, ' ($1)').replace(/ \((?:no segment text on page|segment not given on page)\)/g, '')
    .replace(/posted no crash alerts in October\./g, 'had no crash alerts in our October archive.')
    .replace(/Crash alerts that mentioned a fatality<\/strong>/g, 'Crash alerts whose text mentioned a fatality</strong><span style="display:block;font-weight:400;font-size:13px;color:#5C6670;margin-top:4px">From the alert text, not an official fatality count. Two alerts can be the same crash.</span>')
    .replace(/Seattle's drawbridges opened 706 /g, "Seattle's drawbridges opened 708 ")
    .replace(/(\d[\d,]*) live DOT cameras on the map/g, '$1 DOT cameras on the map')
    .replace(/<span>longest border wait, /g, '<span>highest hourly border-wait reading, ')
    .replace(/The longest border wait in October was ([^,]+) at /g, 'The highest hourly border-wait reading in October was $1 at ')
    .replace(/ <span style="color:#5C6670;font-weight:400">\((?:no segment text on page|segment not given on page)\)<\/span>/g, '');
  // Leah 11/12: the sponsor slot was too tall and pushed the headline down. One slim line, no Roy, no Stripe:
  // "Sponsor next month's Highway Report for only $99. Email us." with "Email us" as a mailto (inbound only, 11/9).
  h = h.replace(/<aside class="spon[^"]*" id="spon"[\s\S]*?<\/aside>/, SPON_STRIP);
  return h.replace('</body>', `${POPUP(from)}\n</body>`);
};

// Search/social descriptions follow the page, not the old count-led wording (meta, og, twitter, JSON-LD).
const setDesc = (h, text) => { const a = text.replace(/&/g, '&amp;').replace(/"/g, '&quot;'); const j = JSON.stringify(text).slice(1, -1);
  return h.replace(/(<meta (?:name|property)="(?:description|og:description|twitter:description)" content=")[^"]*(")/g, `$1${a}$2`).replace(/("description":")(?:[^"\\]|\\.)*(")/g, `$1${j}$2`); };
const SRC_HAS_WINTER = new Set(Object.keys(NAMES).filter((k) => { try { return readFileSync(resolve(SRC_DIR, slug(k) + '.html'), 'utf8').includes('<h2 class="rc">Winter closures'); } catch { return false; } }));
let made = 0;
for (const f of readdirSync(SRC_DIR).filter((x) => x.endsWith('.html') && x !== 'index.html')) {
  const st = Object.keys(NAMES).find((k) => slug(k) + '.html' === f); if (!st || !J[st]) continue;
  let h = readFileSync(resolve(SRC_DIR, f), 'utf8');
  const t = stateTop(st);
  h = h.replace('</head>', `<meta name="robots" content="noindex">\n${CSS}\n</head>`);
  h = h.replace(/<h1 class="article-title">[\s\S]*?<\/h1>/, `<h1 class="article-title">${esc(t.headline)}</h1><p style="margin:-6px 0 10px;font-weight:700;color:#5C6670">MileCheck Highway Report: ${NAMES[st]}, October 2026</p>`);
  { const T = `MileCheck Highway Report, October 2026: ${NAMES[st]} road closures, crashes and roadwork`; h = setTitle(h, T); } // Leah 11/9: name first, then what the reader searches for
  // Keep any personal line Leah added after the stock lead (e.g. Utah's).
  h = h.replace(/<p class="article-lead">([\s\S]*?)<\/p>/, (m, inner) => { const keep = (inner.match(/national MileCheck Highway Report, October 2026<\/a>\.\s*([\s\S]*)$/) || [])[1] || ''; return `<p class="article-lead">${esc(t.lede)}${keep ? ' ' + keep : ''} Part of the <a href="../road-report-october-2026-preview.html">national report</a>.</p>`; });
  h = h.replace(/<div class="headline-nums">[\s\S]*?<\/div><\/div>/, t.nums);
  h = h.replace('How we got these numbers', 'Where these numbers come from');
  // No volume lists: the "Routes with the most alerts" box counts roadwork records.
  h = h.replace(/<div class="pull-stat"><strong>Routes with the most alerts in [^<]*<\/strong>[\s\S]*?<\/ul><\/div>/, '');
  h = h.replace(/<h2 class="rc">Closures and roadwork<\/h2>/, '<h2 class="rc">Closures</h2>');
  // New sections go after Leah's maps.
  const anchor = ['<h2 class="rc">Compared with earlier months', '<h2 class="rc">Winter closures', '<h2>More on'].find((a) => h.includes(a));
  h = h.replace(anchor, `${t.body}\n      ${anchor}`);
  h = h.replace(/\.\.\/road-report-october-2026\.html/g, '../road-report-october-2026-preview.html');
  h = setDesc(h, t.desc);
  // Small related-reading lines under the matching sections.
  h = h.replace(/(<p class="rc-fig">Timing comes from each agency[^<]*<\/p>)/, `$1${t.winterRel}`);
  h = h.replace('<h2 class="rc">Closures</h2>', `${relLine(CRASH_READS.map(([u, x]) => A(u, x)))}\n      <h2 class="rc">Closures</h2>`);
  h = h.replace(/(<p>Live waits are at[\s\S]*?<\/p>)/, `$1${relLine(BORDER_READS.map(([u, x]) => A(u, x)))}`);
  // Leah 11/12: the state's winter-closure map sits in the Closures section, not far below it.
  {
    const wm = h.match(/\n\s*<h2 class="rc">Winter closures<\/h2>[\s\S]*?(?=\n\s*<h2 |\n\s*<section |<\/article>)/);
    const cl = h.match(/<h2 class="rc">Closures<\/h2>\s*<p class="rc-live">[\s\S]*?<\/p>/);
    if (wm && cl) {
      h = h.replace(wm[0], '');
      const body = wm[0].replace(/<h2 class="rc">Winter closures<\/h2>/, '<h3 class="rc">Roads that close for winter</h3>');
      h = h.replace(cl[0], cl[0] + body);
    }
  }
  h = h.replace('href="index.html"', 'href="../road-report-october-2026-preview.html#by-state"');
  // State recap paragraph (Leah 11/12: a one-paragraph narrative at the top). 
  const RECAP = {
    "alabama": "Alabama's October crash alerts were bunched around Tuscaloosa and Huntsville, then Dothan and Montgomery. By route, US-231 had the most, followed by I-65 and US-31, with several on US-231 near St. Clair. Closure alerts came mostly from Tuscaloosa, with a few around Birmingham. New roadwork on the feed included AL 181 near Daphne, posted for MP 12.9 to 16.4 through January, and AL 59 near Loxley. Several projects were posted to end in October, among them US-431 in Albertville, AL-24 in Russellville and US-72 near Scottsboro. Still posted at month's end was the I-59 work between Fort Payne and Valley Head.",
    "alaska": "Alaska's feed posted few crash alerts in October, two on the Glenn Highway and one on the Richardson Highway, all near Valdez. It posted one closure alert, in Fairbanks. Most of the month's roadwork news came off the feed. The Parks Highway culvert replacements at MP 111, 119 and 120 and the Railroad Creek Bridge work at MP 128 to 129 came off on October 22, and Elliott Highway work between MP 43 and 51 came off on October 7. Still on the feed at month's end were the Parks Highway reconstruction at MP 319 to 325 and the Dalton Highway flooding repairs between MP 209 and 250.",
    "alberta": "Alberta's feed posted few crash alerts in October, on AB-201 and AB-550 and around Calgary. Closure alerts came mostly from rural areas near Westlock and High Level, plus Cardston, Drumheller and St. Paul. New bridge construction on HWY-2 near Township Road 554 was posted to start October 5 and run for years, and HWY-6 near the Montana border was posted closed for months. Some summer work was posted to end in October, including the HWY-8 bridge construction near the Elbow River and the HWY-2 paving near Menaik Road. HWY-3 construction between HWY-36 and Range Road 121 was still posted at month's end.",
    "arkansas": "Arkansas's feed carried no crash alerts in October. Closure alerts were scattered through the northeast, in Osceola, Marianna, Manila, Piggott and Wynne, with others at Clarksville and Jonesboro. Several bridge and road projects came off the feed during the month, including the US-62 St. Francis River bridge replacement, which Missouri's DOT is handling, daily closures on AR-14 from Marie to Wilson, and the old bridge removal on AR-148. Still on the feed at month's end were the new bridge on AR-77, the bridge removed from service on AR-42, and the Big Piney bridge rehabilitation on AR-123.",
    "british-columbia": "British Columbia's October crash alerts were mostly on Highway 1, the Trans-Canada, followed by Highway 99 and Highway 5, with a few near Revelstoke. Places named most were Strawberry Hill, Pitt Meadows and Surrey. Closure alerts came mostly from Salmon Arm and New Westminster. Snow-related alerts showed up around Dawson Creek, Fort St. John and Mackenzie. New roadwork included Highway 99 maintenance near Whistler, posted from October 13 to December 31, and Highway 1 construction in Abbotsford between Mt. Lehman and Clearbrook. Highway 3 paving from Summit Creek Bridge to Kootenay Pass was posted to end October 26.",
    "california": "California's October crash alerts were spread out, with I-5 getting the most, then US-101 and I-80. San Diego, Los Angeles, San Jose and Glendale were named most, and a few came from Bakersfield, Napa and Temecula. Closure alerts were heaviest around Los Angeles, San Jose, Burbank and San Francisco. New Caltrans closures on the feed included a full closure on US-101, posted from October 1 to December 1, and full and lane closures on SR-1. Several SR-1 lane closures, a full closure on US-101 and I-5 work were posted to end during October. Long-running lane closures on I-80, SR-162 and US-101 were still posted at month's end.",
    "colorado": "Colorado's October crash alerts were mostly on I-25, in both directions, followed by I-70 and I-225. The Denver area was named most, including Aurora, Centennial and Cherry Creek, with a few near the Air Force Academy. Closure alerts were few, around Durango and Monte Vista. Several roadwork projects came off the feed, including I-70 lane closures near Limon and US-50 utility work near Salida on October 29, I-25 work at Lone Tree on October 25, and US-40 construction in Aurora on October 17. Still on the feed at month's end were I-70 work between Flagler and Vona, the bridge on US-6 near Holyoke, and the bridge on SH-86 near Kiowa.",
    "connecticut": "Connecticut posted few crash alerts in October. Most were on I-84, followed by I-91 and CT-15, in East Hartford, Tolland, Farmington and Hartford. Closure alerts were more common and came mostly from Norwalk and Niantic, with others in West Haven, Trumbull and East Hartford. The feed carried no major roadwork that started or came off in October.",
    "delaware": "Delaware posted few crash alerts in October, a couple on US-13 and one each on I-95 and US-202, with several around Bear. Closure alerts came from Nassau and Dover, with a few in Wilmington. Several road work closures came off the feed. DE-1 southbound lost its two-right-lane closure between DE-72 and the Roth Bridge on October 22, and the Christiana Road ramp to DE-4 came off on October 11. Still on the feed at month's end was DE-9, Taylors Bridge Road, closed between Union Church Road and Cedar Swamp Road for road work until July 2028.",
    "florida": "Florida's October crash alerts were spread thin across the state, with I-75, I-95 and I-275 named most. Jacksonville, Ocala and the Orlando area, including Azalea Park and Alafaya, showed up most. Closure alerts came mostly from Miami, with a few at Yulee, Titusville and Tallahassee. New roadwork on the feed included US-301 at Big Bend Road, with a new traffic pattern posted October 22 and 23, and the I-275 southbound exit ramp at 38th Ave N, posted closed from October 5. US-41 at Lake Patience Road and US-98 near County Road 54 were still posted at month's end.",
    "georgia": "Georgia's feed posted few crash alerts in October, one on I-75 near Suwanee and one on I-85 near West Point. Closure and roadwork alerts bunched around Griffin, Newnan, Atlanta and Macon. New roadwork posted in October included construction on I-285 westbound at US 41/Cobb Pkwy, running to the start of next year, and a lane-blocking project on SR 3 northbound at Livingston Rd. A closure of SR 36 eastbound at High Falls Rd was posted to end October 29, and work on I-575 southbound near SR 5 Bus was posted to end October 24. SR 74 eastbound at Dyas Rd was still posted with all lanes closed at month's end.",
    "hawaii": "Hawaii's feed carried no crash alerts in October and posted few closure alerts, in Kalama Valley and near Lihue. Roadwork was the main story. A three-lane closure on H-1 came off the feed on October 29, along with lane closures on HI-63 and H-201. At month's end the feed still showed a two-lane closure on HI-99 and HI-92, a ramp closure on H-3, and lane closures on HI-360, HI-11, HI-378, HI-30 and HI-550.",
    "idaho": "Idaho's October crash alerts were spread out. I-15 and I-84 had the most, and the rest were scattered from Sandpoint and Coeur d'Alene in the north to Pocatello, American Falls and Fruitland in the south. Closures showed up around the Boise valley, including Caldwell, Nampa, Meridian and Star, and in Blackfoot and Post Falls. Roadwork started on SH-46 in late October, with an all-lanes-closed stretch between Spring Creek Rd and US-20 posted to run to December 1. Alternating-lane work started on SH-11 and SH-34, and an I-90 right lane closure between mile markers 24 and 32 was posted through November 20. Long-term I-84 work between the Franklin and Centennial interchanges was still on the feed.",
    "illinois": "Most of Illinois' October crash alerts were in the Chicago area. IL-83 had the most, followed by I-55, with others on US-14, in towns such as Willowbrook, Lisle, Hillside and Des Plaines. Closure alerts bunched around Joliet, Glen Carbon, Galesburg and Freeport. On October 27 the feed posted I-90 closed at Northwest Hwy and a bridge closure on US-6 at Patterson Rd, both listed through the start of next year. In Joliet, the I-80 ramp closures at S Raynor Ave were still on the feed at month's end. Roadwork on I-180 and IL-29 near IL-26 was posted to end October 27.",
    "indiana": "Indiana's feed posted few crash alerts in October, on I-65, I-70 and I-80, in towns including Indianapolis, Jeffersonville, Lake Station and Michigan City. Closure and roadwork alerts were far more common, bunched around Zionsville, Logansport, Monticello, Lebanon and Lafayette. New roadwork started in October on IN-25 for bridge construction, on IN-66 where the road was posted closed, and on I-64 and I-265 with intermittent lane closures. A long list of projects was posted to end in October, including US-20 construction and a US-35 road closure on October 30. Major work on I-69 and I-70 was still on the feed at month's end.",
    "iowa": "Iowa's feed posted few crash alerts in October, one each on I-29 near Shenandoah, I-80 near Altoona and US-30 near Hiawatha. Closure and roadwork alerts bunched around Sioux City and Sergeant Bluff, Clive and West Des Moines, Harlan, Cedar Rapids and North Liberty. Road construction started on I-235 in early October, with the project posted to run to the end of 2029, and on IA-2, IA-78 and IA-21. Night construction on I-80 was posted to end October 30, and a closure of IA-210 was posted to end October 31. A closure on US-67 and work on US-69 were still on the feed at month's end.",
    "kansas": "Kansas' October crash alerts were mostly in the Kansas City and Wichita areas, in Olathe, Shawnee, Mission, Leawood and Spring Hill, with a couple in Wichita. Routes were I-70, I-635 and US-54. Closure alerts bunched around Fort Scott, Wellington, Winfield and Abilene. Roadwork started in October on KS-42, US-283 and KS-14, and alternating lane closures started on I-135 and US-281. Bridge work on I-70 was posted to end October 10, and paving on US-59 was posted to end October 30. Major construction on I-135 and US-54, and a closure on US-69, were still on the feed at month's end.",
    "kentucky": "Most of Kentucky's October crash alerts came from the Louisville area, on I-64, I-264 and I-65, in Louisville, Shively, St. Matthews, Okolona and Lyndon. A smaller group came from Shepherdsville and from Covington in northern Kentucky. Closure alerts were mostly in eastern and western Kentucky, around Hazard and Paintsville, Mayfield, Owensboro and Henderson. Many were blocked county and state roads and bridges, such as KY 80 and US-45 at Jackson Creek, and they were still on the feed at month's end. The Floyd St and Arthur St (Exit 134) ramps on I-65 came off the feed on October 29, and the US-62 Simon Kenton Memorial Bridge closure was still posted.",
    "louisiana": "Most of Louisiana's October crash alerts were on I-10, with a couple on US-90 and one on I-510. Those were centered on Gonzales, Metairie, Breaux Bridge and Gretna. Closure alerts bunched around Lafayette, followed by Baton Rouge, Jonesboro, Houma and Lake Charles. Bridge closures started in October on LA-82 between Bernard Blvd and Vine St and on LA-155 near New Hope Rd, with all lanes closed through spring. Road marking on I-55 northbound between US-51 and LA 1050 started mid-month. A bridge closure on LA-1026 was posted to end October 13, and I-10 westbound lane work near PPG Dr was posted to end October 30.",
    "maine": "Maine's feed carried no crash alerts and no closure alerts in October, so the story there was roadwork. The Babson bridge closure on ME-102 in Mount Desert was posted to end October 6, and Bangor/Brewer maintenance on I-395 was posted to end October 2. Still on the feed at month's end were bridge replacement work at I-95 Exit 185 in Bangor, the Hogan Rd bridge work on I-95 in Bangor, and the Essex Street bridge closure on ME-15 in Dover-Foxcroft. Construction on US-201 in Skowhegan and one-lane work on ME-111 in Biddeford were also still posted.",
    "manitoba": "Manitoba's feed carried no crash alerts in October. Closure alerts were mostly rural, near Swan River, Brandon, Virden and Dauphin, with a few in Headingley and near Morden. Several flood-related bridge and road closures came off the feed on October 25, including PR 530 near the Souris River, HWY-344 at the Souris River at Wawanesa, HWY-334 near the La Salle River and HWY-348 between HWY-349 and HWY-2. Still on the feed at month's end were the bridge closure on PR 247 in Sanford and the closed bridge on PR 246, 2 km east of Highway 75 at the Red River in St. Jean Baptiste.",
    "maryland": "Maryland's October crash alerts were bunched on I-95, with a few each on I-695 and MD-295. By town, Frederick had the most, followed by Canton and Towson, with a few more near Frostburg and Walkersville. Closure alerts were mostly planned closures, around Severn, Halfway, Pasadena, Brunswick and Towson. A planned closure on I-95 northbound and another on US-301 were on the feed from October 1, and the I-95 southbound closure came off the feed on October 29. Planned closures on MD-695 southbound, US-50 eastbound, I-270 southbound and MD-2 northbound were still on the feed at month's end.",
    "massachusetts": "Most of Massachusetts' October crash alerts were on I-95, I-93 and I-90. They clustered in the Boston area, in Saugus and Woburn, with a few more in Reading and Worcester and around Southbridge. Closure alerts were few and scattered, in Chicopee, Marstons Mills and Swansea. Nighttime roadwork on I-90, I-290, I-495 and US 20 came off the feed between October 27 and October 29. Roadwork was still on the feed at month's end on I-495 in both directions, I-95 southbound, RT-9, RT-25, RT-28 and RT-47, and roadwork on US 44 eastbound was on the feed from October 1.",
    "michigan": "Michigan's October crash alerts were spread across I-96, I-75 and I-94, mostly in the Detroit area, in Plymouth, Redford, Highland Park and Detroit itself. Closure alerts were far more common, and most were in Detroit, followed by Grand Rapids, East Lansing and Allen Park. Total closures of the I-75 ramp at Clifford and the M-10 ramps to I-75 were on the feed from October 1. Construction on I-94 in both directions and a closure of westbound US-12 came off the feed on October 29. Still on the feed at month's end were a double-lane closure on westbound I-96, plus single-lane closures on I-94 and northbound I-75.",
    "minnesota": "Minnesota's October crash alerts were spread out, with a few on I-35 and single alerts on MN-65 and MN-200. By town, Richfield had the most, followed by Baxter, Mankato, Waseca and Fridley, with a few more near Park Rapids and Pine City. Closure alerts were mostly in the Twin Cities area, in Saint Paul, Bloomington and Burnsville, and in North Mankato and Albert Lea. Closures on US-75 (a bridge), MN-19 and MN-95 were posted to end between October 28 and October 31. Construction on MN-7 and MN-5 was posted to start in October. MN-55 was posted closed into July 2027, and US-10 into late November.",
    "mississippi": "Mississippi's October crash alerts were mostly on I-55, followed by I-20 and I-10. They bunched in the Jackson area, in Jackson, Flowood, Brandon and Clinton, with a few more around Gulfport on I-10. Closure alerts were mostly in Hattiesburg and Flowood. Crews posted new closures on MS 32 at I-55 from October 27, on MS 16 between MS 3 and Carter Rd from October 22, and on the I-20 west exit ramp to State St, Exit 45B, from October 26. US 90 west between MS 604 and Camp Rd stayed on the feed as a long-running closure.",
    "missouri": "Missouri's feed posted few crash alerts in October, one each on US-36, I-70 and US-61, near Macon, Columbia and Troy. Closure alerts were more common, mostly in St. Louis, East Prairie, Kirksville and Columbia. I-49 was posted closed from October 12 into February 2027, and MO-350 and MO-47 closures were posted from early October into December. Resurfacing on MO-370, pavement construction on I-64 and bridge reconstruction on US-50 were posted to end October 30. Pavement construction on I-70, I-44 and I-270 stayed on the feed, with I-70 posted to run through the end of 2027.",
    "montana": "Most of Montana's October crash alerts were on I-90, with a few on I-15 and MT-49. They were bunched around Butte, Livingston and Shelby, with a few near Helena and Columbia Falls. The feed carried no closure alerts, and posted a few snow alerts near Helena and Butte. Road construction with posted travel delays was on the feed on US-93, MT-24 and MT-81, and a US-89 project came off the feed on October 25. S-482 was posted closed from MP 2.5 to MP 2.7. Construction on I-90 stayed on the feed through the end of the month.",
    "nebraska": "Nebraska's feed posted few crash alerts in October, on I-80 near North Platte, US-6 and NE-71, plus one near Scottsbluff. Closure alerts were mostly in Lincoln and Omaha, with a few near Hastings and in Ralston and Chalco. Maintenance operations on NE-33 were posted from October 21 to November 30, and a one-lane restriction on US-6 was posted to end October 30. Long-running projects stayed on the feed, including bridge construction on US-30, I-180 and NE-50, and long-term road construction on NE-12.",
    "nevada": "Nevada's October crash alerts were mostly on I-80, with a few on US-93 and I-580. By town, Paradise had the most, followed by Las Vegas, Sparks and Reno. Closure alerts were bunched in Reno, Sun Valley and Lemmon Valley. In the Las Vegas area, a right lane was blocked on I-11 southbound from Decatur Blvd to S Valley View Blvd from October 18 into late November. In the Reno area, a ramp closure from I-580 southbound to Meadowood Mall Way was posted to end October 30, and construction on I-11 from MLK Blvd to Lake Mead Blvd was posted to run into December 2027.",
    "new-hampshire": "New Hampshire's feed carried no crash or closure alerts in October, so the month was mostly roadwork. Pavement preservation on NH-101 between Auburn and Candia and between Epping and Exeter was posted to end in early October, as was the I-95 project between North Hampton and Portsmouth from mile 8.0 to 13.2. Still posted at month's end were the I-89 bridge reconstruction and widening between Lebanon and Hartford, Vermont, the I-93 pavement preservation between Exit 6 and Exit 10 in Manchester and Hooksett, and the intersection work at US-202 and NH-124 in Jaffrey. A lane shift on NH-101A at Continental Blvd in Merrimack was also on the feed.",
    "new-jersey": "Most of New Jersey's October crash alerts were on the NJ Turnpike and the Garden State Parkway, with I-295 next. By town, Jersey City had the most, followed by a few near Brick, Shark River Hills, Hackettstown and Leonia. Closures bunched around Newark, Hightstown, Cranford, Paramus and Clifton. Several long roadwork projects stayed on the feed all month, including shoulder work on NJ 208 in Glen Rock and Fair Lawn, work on NJ 18 northbound at Milltown Rd in East Brunswick, work on US 202 southbound south of US 206 in Raritan, and continuous work on I-80 east of Exit 53 in Wayne.",
    "new-mexico": "New Mexico's October crash alerts were few, mostly on I-25, I-40 and US-285, with a couple in the rural area near Roswell and the rest scattered through Albuquerque, Gallup, Hobbs and Las Cruces. Closures showed up around Truth or Consequences, Gallup and Clovis, and one snow alert was posted near Taos. A lane closure on I-25 from mile marker 40 to 42 around Hatch was posted from October 22 to December 5. Roadwork on NM-263 and NM-313 also began in October, and work on NM-528 was posted to end October 2. Roadwork at mile marker 203 on I-25 near Los Lunas was still posted at month's end.",
    "new-york": "New York's October crash alerts were spread thin, with a few each on I-95, I-87 and I-90, from the Bronx and Cortlandt Manor north to Eggertsville near Buffalo. Closures were most common around Dansville and Syracuse, followed by Watertown, Brighton and Queens. The feed listed no roadwork that stayed up for a month or longer, so October's picture comes mostly from the closure alerts.",
    "north-carolina": "North Carolina's October crash alerts were heaviest on I-40, I-85 and I-77. Most of the I-77 and I-85 alerts were in Mecklenburg County around Charlotte and Pineville, and I-540 in Wake County also had a few. Outside Charlotte, Asheville, Waynesville and the Durham and Chapel Hill area each had several. Closures bunched around Lumberton, Asheville and Hillsborough. Roadwork started on US 74 and NC 7 in Gaston County on October 29, on US 264 in Hyde County and on NC 46 near the Virginia border. The I-95 project in Harnett and Johnston counties from mile marker 71 to 81 was posted to end October 28.",
    "north-dakota": "North Dakota's feed carried no crash alerts in October and posted only a few closures, near Minot, Jamestown and Grafton. The main news was roadwork. The westbound Jamestown Rest Area on I-94 was posted closed from October 20 to December 14 for interior renovations and roof repairs. Several one-lane projects were posted to end in October, including road reconstruction on I-94 and I-29, road widening on US-52 and intersection work on ND-297. Construction on ND-41, ND-24 and ND-22 and grading and paving on US-85 were still on the feed at month's end.",
    "ohio": "Ohio's October crash alerts were mostly on I-75, I-71 and I-90. By town, Cincinnati, Columbus and Akron had the most, with a few near Saint Clairsville and Athens. Closures were concentrated in Columbus, with more around Brook Park, Cleveland and Cincinnati. On the roadwork side, the SR 108 on-ramp to US 24 westbound was posted to close for reconstruction starting October 1, and SR 510 near Clyde was reduced to one lane for resurfacing. Ramp work at Easton Way on I-270 also started. Lane closures on I-71 between US 62 and SR 56 were posted to end October 2.",
    "oklahoma": "Oklahoma's feed carried no crash alerts in October and posted only a few closures, near Fort Gibson, Checotah, Sallisaw and Sayre. Roadwork started on a bridge and approaches on US-69, pavement rehabilitation on US-77, resurfacing on OK-59 and bridge painting on I-35. Grade, drain and surface work on OK-6, OK-100 and OK-4 was posted to end in October, along with resurfacing on US-70 and OK-39. Multi-year bridge and surface projects on I-35, I-240 and I-40 were still on the feed at month's end.",
    "oregon": "Most of Oregon's October crash alerts were on I-84, with I-5 and I-205 next. By town, Portland and La Grande had the most, followed by the rural areas near Baker City and Prineville and then Ontario and Hillsboro. Closures bunched in Portland and Astoria. Summer roadwork on I-5, US-30, US-20 and US-101 came off the feed between October 4 and 12. Still on the feed at month's end were a landslide on OR229, lane closures and holds of up to 20 minutes on US-26 on weekdays, and construction on US-101. The rest area on US-395 was posted closed for the season on October 29.",
    "pennsylvania": "Pennsylvania's October crash alerts were most common on I-76 and I-95, with I-81 next. Philadelphia had the most by town, followed by Cheltenham, with several in Erie on I-90. Closures bunched around Erie and Blairsville. Roadwork started on I-80 near mile 78 and 81, on PA-309 near Allentown, on I-79 at Exit 73 in Wexford and on I-376 at Exit 71A. Lane restrictions on US 219 and on I-376 near Monaca were posted to end in late October, and a restriction on US 22 near Cresson was posted to end October 15. Hauler restrictions on I-83 at Lemoyne were still on the feed at month's end.",
    "rhode-island": "Rhode Island posted few crash alerts in October, on I-95 and RI-10 near Cranston. The feed carried no closure alerts and no major roadwork starting or ending during the month.",
    "south-carolina": "South Carolina's October crash alerts were spread across the state rather than bunched in one place. They included I-95 near Manning, I-85 near Duncan, I-26 around Hanahan and Charleston, and a few more near Lake Wylie and Red Hill. The feed carried no closure alerts. The road maintenance operations on I-26 that had been posted since August 20 came off the feed on October 29.",
    "south-dakota": "South Dakota's feed carried no crash alerts in October and one closure alert, near Brandon. Most of the activity was roadwork wrapping up. Gravel surface and construction work on US-85 was posted to end October 30, along with pavement repair and paving on US-281 and pavement repair on US-212. Paving on SD-20 was posted to end October 27. Still posted at month's end were grading on SD-25 and SD-38, both through November 20, and paving on SD-471 through November 7.",
    "tennessee": "Tennessee's October crash alerts were most common on I-40, I-24 and I-65, with a few on I-240 in Shelby County. Towns with alerts included Germantown, Clinton, East Ridge and Franklin. Closures stacked up in Knoxville, Nashville, Chattanooga and Memphis. New roadwork included a bridge closure on TN-127 starting October 12, bridge repair on TN-114, and resurfacing on TN-11, TN-180 and US-41. Resurfacing on TN-22, TN-364 and TN-373 was posted to end October 31, and bridge repair on I-40 stays posted into 2027.",
    "texas": "Texas posted few crash alerts in October, on I-10 near Seguin, I-35 in San Antonio, and TX-25 near Iowa Park and Conroe. Closure alerts were more common, with the most in Dallas, near Kerrville and around Hebbronville. Several long projects started late in the month. Alternating lane closures began October 28 on US-259 and TX-204, the Griffin St exit ramp on I-30 was posted closed for reconstruction from October 26, and ramp work started on US-81. Lane closures on US-67 were posted to end October 30. Work on I-35 in the CapEx North project stays on the feed.",
    "vermont": "Vermont's feed carried no crash alerts and no closure alerts in October, so the month was mostly roadwork. Construction started on US-7 between Pittsford and Brandon on October 21, and work began on I-89 in South Burlington just north of Exit 14 and on bridge maintenance on US-4 in Rutland Town. Several projects were posted to end October 17, including the VT-2A intersection improvements and northbound I-89 paving between mile markers 25 and 36 in Bethel and Brookfield. One lane on I-89 northbound in Royalton stays posted at the White River bridge.",
    "virginia": "Virginia's October crash alerts were most common on I-95, followed by I-64 and I-66. By town, Richmond, Chesapeake, Oakton and Norfolk had the most. Closure alerts bunched near Poquoson and Gloucester Point, with more around Galax and Hampton. New roadwork included US-29 in Fairfax County starting October 26 and VA-5 in James City County. Work on I-81 in Rockingham County at mile markers 247 to 248 was posted to end October 2, and a stretch of US-11 in Pulaski County was posted to end October 30. I-81 work in Roanoke stays posted for years.",
    "west-virginia": "West Virginia's feed carried no crash alerts and no closure alerts in October. Roadwork is the story. Bridge construction started October 12 on WV-106 and US-60, paving began on WV-152, and construction on US-35 started October 26. Construction on I-64 and bridge work on US-33 were posted to end October 30. Still posted at month's end were bridge construction on WV-68, new roadway construction on US-119, bridge deck repairs on US-50, and widening on I-64.",
    "wisconsin": "Wisconsin's October crash alerts were mostly in the Milwaukee area, on I-94, I-41 and I-43, with a few on I-39 near Madison. Closure alerts were heaviest around Appleton, Kimberly and Slinger, and in the Milwaukee suburbs of West Allis and Brookfield. Flagging operations started October 21 on WIS 114 and WIS 55, and lane closures began on I-41 southbound and WIS 181. Full closures on WIS 13 and WIS 55 near Chilton were posted to end October 25 and October 23. The I-94 ramp closures at Hawley Rd stay posted.",
    "wyoming": "Wyoming's October crash alerts were few, on US-85, I-80 and US-30, near South Greeley, Evanston, Green River and Rawlins. Closure alerts were also few, one near Rawlins and one near Cody. The overpass closure at Higley Boulevard, exit 214 on I-80 near Rawlins, was on the feed through October 31 after posting in mid-August.",
    utah: "Utah's October crash alerts were mostly on I-15 through the Salt Lake Valley, from Ogden down through Salt Lake City, Draper and American Fork. I-80 came next, with a few near Park City. Several summer projects came off the feed in late October, including the bridge replacement on SR-32 over the Weber River, two bridge replacements on SR-16 in Rich County, and the SR-50 repaving between the Sevier County line and Scipio. Still on the feed at month's end: one lane each way on US-6 through Thistle Junction, the University Avenue Bridge work on US-189 in Provo, and about 12 miles of new pavement and bridge repairs on US-6 in Emery County.",
    washington: "Washington's October crash alerts were spread across the state. I-5 drew the most, from Bellingham down through Seattle, followed by I-90 across Mercer Island and I-405 near Renton. On the Olympic Peninsula, US-101 had several long-running work zones, with single-lane alternating traffic at the Jefferson-Clallam county line and near Ruby Beach, and closures at the Hoh River Bridge. SR 165 stays closed at the Carbon River/Fairfax Bridge until further notice. In Seattle, the closed Harvard Avenue on-ramp to northbound I-5 was posted to reopen in mid-October, and US-2 paving west of Cashmere came off the feed. SR 504 toward Mount St. Helens remains closed at the winter gate while crews rebuild a bridge.",
    arizona: "Most of Arizona's October crash alerts came from the Phoenix area, on I-10 and the Loop 101 and Loop 202 freeways. Outside Phoenix, I-17 had the most, bunched between Black Canyon City and Cordes Junction, with a few more near Camp Verde and Sedona. Closures stacked up on SR-260 just east of Payson, where a construction zone runs from milepost 256 to 261, and around Chandler. South of Tucson, crews started crack removal on I-10 near Vail and on I-19 near Green Valley, and the I-10 bridge work between Vail and Benson came off the feed in mid-October.",
  };
  if (RECAP[f.replace('.html', '')]) h = h.replace(/(<p class="article-lead">[\s\S]*?<\/p>)/, `$1\n<div class="v2-recap"><strong>October recap</strong><p>${RECAP[f.replace('.html', '')]}</p></div>`);
  h = newTabs(h);
  writeFileSync(resolve(OUT_DIR, f), newTab(finish(h, `/blog/highway-report-october-2026-preview/${f}`))); made++;
}

// ---------- national page ----------
{
  let h = readFileSync(resolve(ROOT, 'blog/road-report-october-2026.html'), 'utf8');
  const br = D.bridges.reduce((a, b) => a + b.openings, 0);
  const topWait = D.borderWaits.byMax[0];
  const hm = (m) => { const hh = Math.floor(m / 60), r = m % 60; return hh ? `${hh} hr${r ? ` ${r} min` : ''}` : `${r} min`; };
  const allAnn = Object.entries(ANN).flatMap(([st, a]) => a.map((x) => ({ ...x, st })));
  const fin = Object.entries(MW).flatMap(([st, m]) => m.finished.map((p) => ({ st, p }))).sort((a, b) => b.p.projectDays - a.p.projectDays).slice(0, 4);
  const sta = Object.entries(MW).flatMap(([st, m]) => m.started.map((p) => ({ st, p }))).sort((a, b) => b.p.projectDays - a.p.projectDays).slice(0, 4);
  const projSec = (fin.length || sta.length) ? `<section class="v2-sec"><h2 class="rc">Major roadwork</h2><p class="v2-sub">The longest projects that finished or started in October. Each state page lists its own.</p>${fin.map(({ st, p }) => projCard(st, p, 'finished').replace('<b>', `<b>${NAMES[st]}: `)).join('')}${sta.map(({ st, p }) => projCard(st, p, 'started').replace('<b>', `<b>${NAMES[st]}: `)).join('')}</section>` : '';
  const annSec = allAnn.length ? `<section class="v2-sec"><h2 class="rc">From the agencies</h2>${allAnn.map(annCard).join('')}</section>` : '';
  const pivot = `<section class="v2-sec"><h2 class="rc">October on the roads</h2><div class="v2-recap"><strong>October recap</strong><p>Winter started to show on the roads in October. Snow, ice and chain alerts turned up in the lower 48, mostly in the mountains of California and Montana, and more came from British Columbia. At the border, the longest hourly wait was 5 hours at Eagle Pass, Texas, building overnight into October 13, the night after Columbus Day. Seattle's five drawbridges opened 708 times. Many summer roadwork projects came off the state feeds during the month. Each state's page below opens with its own recap.</p></div></section>`;
  const quotes = `<section class="v2-sec"><h2 class="rc">For newsrooms</h2><p class="v2-sub">Free to quote with credit to the MileCheck Highway Report and a link to this page. Each state page has its own.</p>
<div class="v2-quote"><strong>Winter arrives</strong>“${X.snowIceLower48} road alerts in the lower 48 named snow, ice or chains in October, the first of the season, according to the MileCheck Highway Report.”</div>
<div class="v2-quote"><strong>Border</strong>“The longest border wait in October was ${hm(topWait.maxMin)} at ${esc(topWait.port)}, Texas, according to the MileCheck Highway Report, from hourly U.S. Customs and Border Protection data.”</div></section>`;
  const lede = `Winter showed up on the roads in October. The first ${X.snowIceLower48} snow and ice alerts reached the lower 48, and the longest border wait was ${hm(topWait.maxMin)} at ${esc(topWait.port)}, Texas. Below: where the crashes were, the big roadwork that finished or started, and a report for every state and province.`;
  h = h.replace('</head>', `<meta name="robots" content="noindex">\n${CSS}\n</head>`);
  h = h.replace(/<h1 class="article-title">[\s\S]*?<\/h1>/, `<h1 class="article-title">Winter reaches the roads</h1><p style="margin:-6px 0 10px;font-weight:700;color:#5C6670">MileCheck Highway Report, October 2026</p>`);
  h = setTitle(h, 'MileCheck Highway Report, October 2026: road closures, crashes and roadwork in every state');
  h = h.replace(/<p class="article-lead">[\s\S]*?<\/p>/, `<p class="article-lead">${lede}</p>`);
  h = h.replace(/<p class="hr-lede">[\s\S]*?<\/p>\s*/g, '');
  h = h.replace(/<div class="headline-nums">[\s\S]*?<\/div>\s*<\/div>/, `<div class="v2-nums">
<div><b>${X.snowIceLower48}</b><span>snow and ice alerts, lower 48</span></div>
<div><b>${hm(topWait.maxMin)}</b><span>longest border wait, ${esc(topWait.port)}</span></div>
<div><b>${n(br)}</b><span>Seattle drawbridge openings</span></div>
<div><b>${n(X.cameras)}</b><span>live DOT cameras on the map</span></div>
</div>`);
  h = h.replace('How we got these numbers', 'Where these numbers come from');
  h = h.replace(/<h2 class="rc">Closures and roadwork<\/h2>/, '<h2 class="rc">Closures</h2>');
  h = h.replace(/<p>Road feeds posted [\d,]+ closure alerts and [\d,]+ roadwork alerts[^<]*<\/p>/, '');
  h = h.replace(/(<details class="method-fold">[\s\S]*?<\/details>)/, (m) => `${m}\n${pivot}`);
  h = h.replace('<h2 class="rc">Border waits', `${projSec}${annSec}${quotes}\n      <h2 class="rc">Border waits`);
  h = h.replace(/highway-report-october-2026-states\//g, 'highway-report-october-2026-preview/');
  h = h.replace('<h2 class="rc">Crashes', `${relLine([['/chain-laws/', 'Chain laws by state'], ...WINTER_READS].map(([u, x]) => A(u, x)))}\n      <h2 class="rc">Crashes`);
  h = h.replace('<h2 class="rc">Traffic cameras', `${relLine(BORDER_READS.map(([u, x]) => A(u, x)))}\n      <h2 class="rc">Traffic cameras`);
  h = h.replace('<h2 class="rc">Closures</h2>', `${relLine(CRASH_READS.map(([u, x]) => A(u, x)))}\n      <h2 class="rc">Closures</h2>`);
  h = newTabs(h);
  h = setDesc(h, 'MileCheck Highway Report, October 2026: snow and ice alerts, winter closures, major roadwork that ended or started, border waits, and a report for every state and province.');
  writeFileSync(resolve(ROOT, 'blog/road-report-october-2026-preview.html'), newTab(finish(h, '/blog/road-report-october-2026-preview.html')));
}
console.log(`preview: ${made} state pages + national; majorWork states: ${Object.keys(MW).length}`);
