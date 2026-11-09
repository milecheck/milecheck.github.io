#!/usr/bin/env node
// gen-highway-report-v2-preview.mjs: the new Highway Report layout (Leah, 2026-11-09), as a PREVIEW.
// Reads the live October pages and data/road-report-<month>.json, and writes noindexed copies with the new
// top section: story lede, headline numbers with change from last month, corridor grid, what changed this
// month, and quotes for newsrooms. Every number comes from the data file. Nothing outside our data is claimed.
// Count wording: "MileCheck archived N alerts that <DOT> published", never "the DOT reported N".
//
//   node scripts/gen-highway-report-v2-preview.mjs
//   writes blog/road-report-october-2026-preview.html and blog/highway-report-october-2026-preview/<state>.html
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const D = JSON.parse(readFileSync(resolve(ROOT, 'data/road-report-october-2026.json'), 'utf8'));
const X = JSON.parse(readFileSync(resolve(ROOT, 'data/road-report-october-2026-extra.json'), 'utf8'));
const SRC_DIR = resolve(ROOT, 'blog/highway-report-october-2026-states');
const OUT_DIR = resolve(ROOT, 'blog/highway-report-october-2026-preview');
mkdirSync(OUT_DIR, { recursive: true });

const NAMES = { AL:'Alabama', AK:'Alaska', AZ:'Arizona', AR:'Arkansas', CA:'California', CO:'Colorado', CT:'Connecticut', DE:'Delaware', FL:'Florida', GA:'Georgia', HI:'Hawaii', ID:'Idaho', IL:'Illinois', IN:'Indiana', IA:'Iowa', KS:'Kansas', KY:'Kentucky', LA:'Louisiana', ME:'Maine', MD:'Maryland', MA:'Massachusetts', MI:'Michigan', MN:'Minnesota', MS:'Mississippi', MO:'Missouri', MT:'Montana', NE:'Nebraska', NV:'Nevada', NH:'New Hampshire', NJ:'New Jersey', NM:'New Mexico', NY:'New York', NC:'North Carolina', ND:'North Dakota', OH:'Ohio', OK:'Oklahoma', OR:'Oregon', PA:'Pennsylvania', RI:'Rhode Island', SC:'South Carolina', SD:'South Dakota', TN:'Tennessee', TX:'Texas', UT:'Utah', VT:'Vermont', VA:'Virginia', WA:'Washington', WV:'West Virginia', WI:'Wisconsin', WY:'Wyoming', BC:'British Columbia', AB:'Alberta', MB:'Manitoba' };
const DOT = { BC: 'DriveBC', AB: '511 Alberta', MB: 'Manitoba 511' };
const dotOf = (st) => DOT[st] || `${NAMES[st]}'s department of transportation`;
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
const route = (st, r) => { const m = String(r).match(/^SR\s*-?\s*(\d+[A-Z]?)$/i); if (m && st === 'WA') return WA_I.has(m[1]) ? `I-${m[1]}` : WA_US.has(m[1]) ? `US-${m[1]}` : `SR-${m[1]}`; if (m) return `SR-${m[1]}`; return String(r); };
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
.v2-grid{width:100%;border-collapse:collapse;font-size:14.5px;min-width:520px}
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
@media (max-width:420px){.v2-rank a{grid-template-columns:96px 1fr 56px;font-size:13.5px}}
</style>`;

const mixBar = (c, k, r, o) => { const t = c + k + r + o || 1; return `<div class="v2-mix" role="img" aria-label="${c} crash, ${k} closure, ${r} roadwork, ${o} other"><i class="c" style="flex:${c}"></i><i class="k" style="flex:${k}"></i><i class="r" style="flex:${r}"></i><i class="o" style="flex:${o}"></i></div>`; };
const KEY = `<div class="v2-key"><span><i style="background:#D92D20"></i>crash</span><span><i style="background:#F79009"></i>closure</span><span><i style="background:#2E90FA"></i>roadwork</span><span><i style="background:#98A2B3"></i>other</span></div>`;
const share = (a, b) => (b ? `${Math.round((a / b) * 100)}%` : '');

// ---------- state pages ----------
function stateTop(st) {
  const j = J[st], p = JP[st]; const name = NAMES[st];
  const routes = (j.routeCounts || []).map(([r, c]) => [route(st, r), c]);
  const crashR = Object.fromEntries(((D.crashHotspots[st] || {}).routes || []).map(([r, c]) => [route(st, r), c]));
  const top = routes[0];
  const topShare = top ? Math.round((top[1] / j.total) * 100) : 0;
  const crashTop = ((D.crashHotspots[st] || {}).routes || [])[0];
  const comparable = COMPARE && !!p && !NO_COMPARE.has(st);
  const totP = comparable ? pct(j.total, p.total) : null;
  const rwP = comparable ? pct(roadwork(j), roadwork(p)) : null;
  const crP = comparable ? pct(j.crash, p.crash) : null;
  const snow = snowBy[st] || 0, fire = fireBy[st];
  const seasonal = (D.seasonalClosures[st] || []).length;
  const waits = D.borderWaits.all.filter((w) => w.state === st).sort((a, b) => b.maxMin - a.maxMin);
  const hm = (m) => { const h = Math.floor(m / 60), r = m % 60; return h ? `${h} hr${r ? ` ${r} min` : ''}` : `${r} min`; };

  // Headline: the biggest true change, said plainly.
  let headline;
  if (rwP !== null && rwP <= -10) headline = `Roadwork winds down as ${name} heads into winter`;
  else if (snow > 0) headline = `The first snow and ice alerts arrive in ${name}`;
  else if (crP !== null && crP >= 15) headline = `Crash alerts climb in ${name}`;
  else if (top && topShare >= 25) headline = `${top[0]} carried ${topShare}% of ${name}'s alerts in October`;
  else if (totP !== null && totP <= -10) headline = `A quieter month on ${name}'s roads`;
  else if (totP !== null && totP >= 10) headline = `A busier month on ${name}'s roads`;
  else headline = `Where ${name}'s roads were busiest in October`;

  const lede = [];
  lede.push(`MileCheck archived ${n(j.total)} alerts that ${dotOf(st)} published in October 2026, each counted once${totP === null ? '.' : `, ${totP < 0 ? 'down' : 'up'} ${Math.abs(totP)}% from ${n(p.total)} in September.`}`);
  if (top) lede.push(`${top[0]} had the most, ${n(top[1])} alerts, or ${topShare}% of the ${CANADA.has(st) ? 'province' : 'state'}'s total.`);
  if (rwP !== null && Math.abs(rwP) >= 5) lede.push(`Roadwork alerts went ${rwP < 0 ? 'down' : 'up'} ${Math.abs(rwP)}% from September.`);
  if (snow) lede.push(`${snow} alert${snow === 1 ? '' : 's'} named snow, ice or chains on the road.`);

  const nums = `<div class="v2-nums">
<div><b>${n(j.total)}</b><span>alerts archived</span>${chg(j.total, p && p.total, comparable ? null : (st))}</div>
<div><b>${n(j.crash)}</b><span>crash alerts</span>${chg(j.crash, p && p.crash, comparable ? null : st)}</div>
<div><b>${n(j.closure)}</b><span>closure alerts</span>${chg(j.closure, p && p.closure, comparable ? null : st)}</div>
<div><b>${n(roadwork(j))}</b><span>roadwork alerts</span>${chg(roadwork(j), p && roadwork(p), comparable ? null : st)}</div>
</div>`;

  const grid = routes.length ? `<section class="v2-sec"><h2 class="rc">Corridor grid</h2><p class="v2-sub">The ${routes.length} routes with the most alerts in October, from ${dotOf(st)}'s feed.</p>
<div class="v2-gridwrap"><table class="v2-grid"><thead><tr><th>Route</th><th>Alerts</th><th>Share of ${CANADA.has(st) ? 'province' : 'state'}</th><th>Crash alerts</th></tr></thead><tbody>
${routes.map(([r, c]) => `<tr><td>${esc(r)}</td><td>${n(c)}</td><td>${share(c, j.total)}</td><td>${crashR[r] != null ? n(crashR[r]) : '<span style="color:#98A2B3">not in top 3</span>'}</td></tr>`).join('\n')}
</tbody></table></div>
<p style="margin:12px 0 4px;font-size:14px;color:#3D454D">What October's alerts were, all routes:</p>${mixBar(j.crash, j.closure, roadwork(j), j.total - j.crash - j.closure - roadwork(j))}${KEY}</section>` : '';

  const piv = [];
  piv.push(`<li><strong>Roadwork</strong>${n(roadwork(j))} roadwork alerts, ${share(roadwork(j), j.total)} of the month's total.</li>`);
  piv.push(`<li><strong>Crashes</strong>${n(j.crash)} crash alerts.${crashTop ? ` ${route(st, crashTop[0])} had the most, ${crashTop[1]}.` : ''}</li>`);
  if (rwP !== null) piv.push(`<li><strong>Roadwork</strong>${n(roadwork(j))} roadwork alerts in October, ${rwP < 0 ? 'down' : rwP > 0 ? 'up' : 'level'}${rwP ? ` ${Math.abs(rwP)}%` : ''} from ${n(roadwork(p))} in September.</li>`);
  if (crP !== null) piv.push(`<li><strong>Crashes</strong>${n(j.crash)} crash alerts, ${crP < 0 ? 'down' : crP > 0 ? 'up' : 'level'}${crP ? ` ${Math.abs(crP)}%` : ''} from ${n(p.crash)} in September.${crashTop ? ` ${route(st, crashTop[0])} had the most, ${crashTop[1]}.` : ''}</li>`);
  if (snow) piv.push(`<li><strong>First snow</strong>${snow} alert${snow === 1 ? '' : 's'} in October named snow, ice or chains on the road. The map below the grid shows where.</li>`);
  if (seasonal) piv.push(`<li><strong>Winter closures</strong>${seasonal} seasonal closure${seasonal === 1 ? ' was' : 's were'} on the feed by Oct. 31. The list is further down.</li>`);
  if (waits[0]) piv.push(`<li><strong>Border</strong>The longest wait was ${hm(waits[0].maxMin)} at ${esc(waits[0].port)}${waits[0].crossing && waits[0].crossing !== 'Passenger' ? ` (${esc(waits[0].crossing)})` : ''}. The average there was ${hm(waits[0].avgMin)}. From U.S. Customs and Border Protection, saved every hour.</li>`);
  if (fire && fire.fires) piv.push(`<li><strong>Wildfires</strong>${n(fire.fires)} fires on the national wildfire feed were in ${name} by Oct. 31, covering ${n(fire.acres)} acres.</li>`);
  const pivot = piv.length ? `<section class="v2-sec"><h2 class="rc">What changed in October</h2><ul class="v2-pivot">${piv.join('')}</ul></section>` : '';

  const q = [];
  if (top) q.push(`<div class="v2-quote"><strong>${esc(top[0])} led ${name}</strong>“${top[0]} had more alerts than any other road in ${name} in October: ${n(top[1])} of the ${n(j.total)} MileCheck archived from ${dotOf(st)}'s feed, or ${topShare}%.”</div>`);
  if (crashTop) q.push(`<div class="v2-quote"><strong>Crashes</strong>“${dotOf(st).replace(/^./, (c) => c.toUpperCase())} published ${n(j.crash)} crash alerts in October, by MileCheck's count. ${route(st, crashTop[0])} had the most, ${crashTop[1]}.”</div>`);
  if (false) q.push(`<div class="v2-quote"><strong>Crashes</strong>“${dotOf(st).replace(/^./, (c) => c.toUpperCase())} published ${n(j.crash)} crash alerts in October, ${crP < 0 ? 'down' : 'up'} ${Math.abs(crP)}% from September, by MileCheck's count. ${route(st, crashTop[0])} had the most, ${crashTop[1]}.”</div>`);
  const quotes = q.length ? `<section class="v2-sec"><h2 class="rc">For newsrooms</h2><p class="v2-sub">Free to quote with credit to the MileCheck Highway Report and a link to this page.</p>${q.join('')}</section>` : '';
  return { headline, lede: lede.join(' '), nums, body: grid + pivot + quotes };
}

// Leah 2026-11-09: the top sign-up link is one short line that opens the sign-up page (/report/) in a new tab,
// instead of scrolling to the form at the bottom.
const SIGNUP = '<p class="mc-cta-line" style="margin:6px 0 22px;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"><a href="/report/" target="_blank" rel="noopener" style="color:#0f7a4f;font-weight:700;text-decoration:none;border-bottom:1px solid #9fd3b8;">&#9993; Sign up for the monthly report &rarr;</a></p>';
const oneLineSignup = (h) => h.replace(/<p class="mc-cta-line"[\s\S]*?<\/p>/, SIGNUP);
let made = 0;
for (const f of readdirSync(SRC_DIR).filter((x) => x.endsWith('.html') && x !== 'index.html')) {
  const st = Object.keys(NAMES).find((k) => slug(k) + '.html' === f); if (!st || !J[st]) continue;
  let h = readFileSync(resolve(SRC_DIR, f), 'utf8');
  const t = stateTop(st);
  h = h.replace('</head>', `<meta name="robots" content="noindex">\n${CSS}\n</head>`);
  h = h.replace(/<h1 class="article-title">[\s\S]*?<\/h1>/, `<h1 class="article-title">${esc(t.headline)}</h1><p style="margin:-6px 0 10px;font-weight:700;color:#5C6670">MileCheck Highway Report: ${NAMES[st]}, October 2026</p>`);
  // Keep any personal line Leah added after the stock lead (e.g. Utah's).
  h = h.replace(/<p class="article-lead">([\s\S]*?)<\/p>/, (m, inner) => { const keep = (inner.match(/national MileCheck Highway Report, October 2026<\/a>\.\s*([\s\S]*)$/) || [])[1] || ''; return `<p class="article-lead">${esc(t.lede)}${keep ? ' ' + keep : ''} Part of the <a href="../road-report-october-2026-preview.html">national report</a>.</p>`; });
  h = h.replace(/<div class="headline-nums">[\s\S]*?<\/div><\/div>/, t.nums);
  h = h.replace(/(<details class="method-fold">[\s\S]*?<\/details>)/, (m) => `${t.body}\n${m.replace('How we got these numbers', 'Where these numbers come from')}`);
  h = h.replace(/\.\.\/road-report-october-2026\.html/g, '../road-report-october-2026-preview.html');
  writeFileSync(resolve(OUT_DIR, f), oneLineSignup(h)); made++;
}

// ---------- national page ----------
{
  let h = readFileSync(resolve(ROOT, 'blog/road-report-october-2026.html'), 'utf8');
  const tot = D.totalUniqueEvents, totP = pct(NT.total, PT.total);
  const ranked = D.jurisdictionSummary.filter((j) => !NO_COMPARE.has(j.state)).sort((a, b) => b.total - a.total).slice(0, 10);
  const max = ranked[0].total;
  const rank = `<section class="v2-sec"><h2 class="rc">Where the alerts were</h2><p class="v2-sub">The 10 states and provinces with the most alerts archived in October. Each feed reports differently, so this shows volume, not which roads were most dangerous. New York, Kentucky and Virginia are left out because their feeds changed in late September.</p><div class="v2-rank">${ranked.map((j) => `<a href="highway-report-october-2026-preview/${slug(j.state)}.html"><span>${NAMES[j.state]}</span><span class="bar" style="width:${Math.max(4, Math.round((j.total / max) * 100))}%"></span><b>${n(j.total)}</b></a>`).join('')}</div></section>`;

  const regions = Object.entries(REGIONS).map(([reg, sts]) => {
    const js = sts.map((s) => J[s]).filter(Boolean); const t = js.reduce((a, j) => a + j.total, 0);
    const tp = sts.filter((s) => JP[s] && !NO_COMPARE.has(s)); const nowC = tp.reduce((a, s) => a + J[s].total, 0), befC = tp.reduce((a, s) => a + JP[s].total, 0);
    const lead = js.slice().sort((a, b) => b.total - a.total)[0];
    const crashLead = js.slice().sort((a, b) => b.crash - a.crash)[0];
    const topR = lead.routeCounts && lead.routeCounts[0];
    const p = COMPARE ? pct(nowC, befC) : null;
    return `<div class="v2-region"><h3>${reg}</h3><p><b>${n(t)}</b> alerts${p === null ? '' : `, ${p < 0 ? 'down' : 'up'} ${Math.abs(p)}% from September`}. ${NAMES[lead.state]} had the most${topR ? `, led by ${esc(route(lead.state, topR[0]))} (${n(topR[1])})` : ''}. Most crash alerts: ${NAMES[crashLead.state]}, ${n(crashLead.crash)}.</p></div>`;
  }).join('');
  const regionSec = `<section class="v2-sec"><h2 class="rc">By region</h2><p class="v2-sub">States grouped by region, so you can find yours quickly. Tap the state picker at the end for any one state.</p><div class="v2-regions">${regions}</div></section>`;

  const corr = D.corridorDetail.map((c) => {
    const t = Object.fromEntries(c.types); const k = (x) => t[x] || 0;
    const sts = c.states.slice(0, 3).map(([s, v]) => `${NAMES[s]} ${n(v)}`).join(', ');
    return `<tr><td>${esc(c.route)}</td><td>${n(c.total)}</td><td>${c.states.length}</td><td>${sts}</td><td>${share(k('crash'), c.total)} crash · ${share(k('construction'), c.total)} roadwork${mixBar(k('crash'), k('closure'), k('construction'), k('other') + k('hazard') + k('weather'))}</td></tr>`;
  }).join('\n');
  const corrSec = `<section class="v2-sec"><h2 class="rc">Freight corridor grid</h2><p class="v2-sub">The interstates with the most alerts in October, added up across every state they cross. For fleets and dispatchers planning long hauls.</p><div class="v2-gridwrap"><table class="v2-grid"><thead><tr><th>Interstate</th><th>Alerts</th><th>States</th><th>Most alerts in</th><th>What they were</th></tr></thead><tbody>${corr}</tbody></table></div>${KEY}</section>`;

  const rw = D.byType.construction, rwP = pct(NT.construction, PT.construction);
  const topWait = D.borderWaits.byMax[0];
  const br = D.bridges.reduce((a, b) => a + b.openings, 0);
  const hm = (m) => { const hh = Math.floor(m / 60), r = m % 60; return hh ? `${hh} hr${r ? ` ${r} min` : ''}` : `${r} min`; };
  const pivot = `<section class="v2-sec"><h2 class="rc">What changed in October</h2><ul class="v2-pivot">
<li><strong>First snow</strong>${X.snowIceLower48} alerts in the lower 48 named snow, ice or chains on the road, most of them in California and Montana. Counting British Columbia, ${D.snowRoadCount}.</li>
<li><strong>Roadwork</strong>${n(rw)} roadwork alerts. Roadwork was ${share(rw, tot)} of all alerts.</li>
<li><strong>Border</strong>The longest wait was ${hm(topWait.maxMin)} at ${esc(topWait.port)}, Texas, on Oct. 13. From U.S. Customs and Border Protection, saved every hour.</li>
<li><strong>Seattle drawbridges</strong>Seattle's five drawbridges opened ${n(br)} times.</li>
</ul></section>`;

  const lead48 = D.corridorDetail[0];
  const quotes = `<section class="v2-sec"><h2 class="rc">For newsrooms</h2><p class="v2-sub">Free to quote with credit to the MileCheck Highway Report and a link to this page. Each state page has its own.</p>
<div class="v2-quote"><strong>The month in one number</strong>“MileCheck archived ${n(tot)} road alerts that state and provincial transportation agencies published in October 2026.”</div>
<div class="v2-quote"><strong>The busiest interstate</strong>“${lead48.route} had more alerts than any other interstate in October: ${n(lead48.total)} across ${lead48.states.length} states, most of them in ${NAMES[lead48.states[0][0]]}.”</div>
<div class="v2-quote"><strong>Winter arrives</strong>“${X.snowIceLower48} alerts in the lower 48 named snow, ice or chains on the road in October, the first of the season in MileCheck's archive.”</div></section>`;

  const lede = `Winter showed up on the roads in October, while roadwork kept going. MileCheck archived ${n(tot)} alerts that transportation agencies across all 50 states, British Columbia, Alberta and Manitoba published in October, each counted once. The first ${X.snowIceLower48} snow and ice alerts reached the lower 48, and ${lead48.route} was the busiest interstate.`;
  h = h.replace('</head>', `<meta name="robots" content="noindex">\n${CSS}\n</head>`);
  h = h.replace(/<h1 class="article-title">[\s\S]*?<\/h1>/, `<h1 class="article-title">Winter reaches the roads while roadwork keeps going</h1><p style="margin:-6px 0 10px;font-weight:700;color:#5C6670">MileCheck Highway Report, October 2026</p>`);
  h = h.replace(/<p class="article-lead">[\s\S]*?<\/p>/, `<p class="article-lead">${lede}</p>`);
  h = h.replace(/<p class="hr-lede">[\s\S]*?<\/p>\s*/g, ''); // old lede said "road feeds posted"; the new lede replaces it
  h = h.replace(/<div class="headline-nums">[\s\S]*?<\/div>\s*<\/div>/, `<div class="v2-nums">
<div><b>${n(tot)}</b><span>alerts archived</span>${chg(NT.total, PT.total)}</div>
<div><b>${n(D.byType.crash)}</b><span>crash alerts</span>${chg(NT.crash, PT.crash)}</div>
<div><b>${n(D.byType.closure)}</b><span>closure alerts</span>${chg(NT.closure, PT.closure)}</div>
<div><b>${n(rw)}</b><span>roadwork alerts</span>${chg(NT.construction, PT.construction)}</div>
</div>`);
  h = h.replace(/(<details class="method-fold">[\s\S]*?<\/details>)/, (m) => `${pivot}${rank}${regionSec}${corrSec}${quotes}\n${m.replace('How we got these numbers', 'Where these numbers come from')}`);
  h = h.replace(/highway-report-october-2026-states\//g, 'highway-report-october-2026-preview/');
  writeFileSync(resolve(ROOT, 'blog/road-report-october-2026-preview.html'), oneLineSignup(h));
}
console.log(`preview: ${made} state pages + national`);
