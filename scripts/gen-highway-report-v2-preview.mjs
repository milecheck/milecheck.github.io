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
  .spon-strip{margin:0 0 14px;padding:7px 12px;border:1px solid #cfe3d7;border-radius:8px;background:#f3f7f4;font-size:13.5px;line-height:1.35;color:#1f3b2d;}
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
  const tag = { ongoing: ['t-on', 'Ongoing'], started: ['t-new', p.seenBasis ? 'New on the feed in October' : 'Posted to start in October'], finished: ['t-done', p.seenBasis ? 'Came off the feed in October' : 'Posted to end in October'] }[kind];
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
  if (seasonal.length) themes.push('winter closures'); else if (snow) themes.push('first snow');
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
  if (snow) wx.push(`<li><strong>First snow</strong>${snow} alert${snow === 1 ? '' : 's'} in October named snow, ice or chains on the road. Expect more as November goes on.</li>`);
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
  h = newTabs(h);
  writeFileSync(resolve(OUT_DIR, f), finish(h, `/blog/highway-report-october-2026-preview/${f}`)); made++;
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
  const pivot = `<section class="v2-sec"><h2 class="rc">October on the roads</h2><ul class="v2-pivot">
<li><strong>First snow</strong>${X.snowIceLower48} alerts in the lower 48 named snow, ice or chains on the road, most of them in California and Montana. Counting British Columbia, ${D.snowRoadCount}.</li>
<li><strong>Border</strong>The longest wait was ${hm(topWait.maxMin)} at ${esc(topWait.port)}, Texas, on Oct. 13. From U.S. Customs and Border Protection, saved every hour.</li>
<li><strong>Seattle drawbridges</strong>Seattle's five drawbridges opened ${n(br)} times.</li>
</ul></section>`;
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
<div><b>${X.snowIceLower48}</b><span>first snow and ice alerts, lower 48</span></div>
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
  h = setDesc(h, 'MileCheck Highway Report, October 2026: the first snow and ice alerts, winter closures, major roadwork that ended or started, border waits, and a report for every state and province.');
  writeFileSync(resolve(ROOT, 'blog/road-report-october-2026-preview.html'), finish(h, '/blog/road-report-october-2026-preview.html'));
}
console.log(`preview: ${made} state pages + national; majorWork states: ${Object.keys(MW).length}`);
