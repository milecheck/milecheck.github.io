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
@media (max-width:420px){.v2-rank a{grid-template-columns:96px 1fr 56px;font-size:13.5px}}
</style>`;

const mixBar = (c, k, r, o) => { const t = c + k + r + o || 1; return `<div class="v2-mix" role="img" aria-label="${c} crash, ${k} closure, ${r} roadwork, ${o} other"><i class="c" style="flex:${c}"></i><i class="k" style="flex:${k}"></i><i class="r" style="flex:${r}"></i><i class="o" style="flex:${o}"></i></div>`; };
const KEY = `<div class="v2-key"><span><i style="background:#D92D20"></i>crash</span><span><i style="background:#F79009"></i>closure</span><span><i style="background:#2E90FA"></i>roadwork</span><span><i style="background:#98A2B3"></i>other</span></div>`;
const share = (a, b) => (b ? `${Math.round((a / b) * 100)}%` : '');

// ---------- state pages ----------

const fmtD = (iso) => { const [y, m, d] = iso.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' }); };
const clean = (h) => String(h).replace(/\s+/g, ' ').replace(/^(Road ?Work|Construction)\s*:\s*/i, '').trim();
const projCard = (st, p, kind) => {
  const tag = { ongoing: ['t-on', 'Ongoing'], started: ['t-new', 'Started in October'], finished: ['t-done', 'Finished'] }[kind];
  const when = kind === 'finished' ? `Posted ${fmtD(p.start)} to ${fmtD(p.end)}` : kind === 'started' ? `Started ${fmtD(p.start)}, posted to end ${fmtD(p.end)}` : `Since ${fmtD(p.start)}, posted to end ${fmtD(p.end)}`;
  return `<div class="v2-proj"><span class="tag ${tag[0]}">${tag[1]}</span>${p.closure ? '<span class="tag t-cl">Road closed</span>' : ''}<b>${esc(p.route ? route(st, p.route) : 'Roadwork')}${p.place ? `, ${esc(p.place)}` : ''}</b><p>${esc(clean(p.headline))}</p><small>${when}. From ${esc(dotOf(st))}'s feed.</small></div>`;
};
const annCard = (a) => `<div class="v2-ann"><b>${esc(a.title)}</b><p>${esc(a.text)}</p><a href="${a.url}" target="_blank" rel="noopener">Read it from ${esc(a.source.split(',')[0])} &rarr;</a></div>`;

function stateTop(st) {
  const j = J[st]; const name = NAMES[st];
  const ch = D.crashHotspots[st] || {}; const crashRoutes = (ch.routes || []).map(([r, c]) => [route(st, r), c]);
  const sameAs = (a, b) => String(a).replace(/[^a-z0-9]/gi, '').toLowerCase() === String(b).replace(/[^a-z0-9]/gi, '').toLowerCase();
  const places = (ch.places || []).filter((x) => x.place && x.crashes > 1 && !sameAs(x.place, x.route) && !sameAs(x.place, route(st, x.route)));
  const mw = MW[st] || { ongoing: [], started: [], finished: [] };
  const ann = ANN[st] || [];
  const seasonal = D.seasonalClosures[st] || [];
  const snow = snowBy[st] || 0, fire = fireBy[st];
  const waits = D.borderWaits.all.filter((w) => w.state === st).sort((a, b) => b.maxMin - a.maxMin);
  const hm = (m) => { const h = Math.floor(m / 60), r = m % 60; return h ? `${h} hr${r ? ` ${r} min` : ''}` : `${r} min`; };
  const crashTop = crashRoutes[0];

  let headline;
  if (ann[0]) headline = ann[0].title;
  else if (mw.finished[0] && mw.finished[0].route) headline = `${route(st, mw.finished[0].route)} work wraps up, and where ${name}'s crashes were`;
  else if (snow) headline = `Snow and ice reach ${name}'s roads`;
  else if (crashTop) headline = `${name} in October: crashes, closures and the big roadwork`;
  else headline = `${name}'s roads in October`;

  const lede = [];
  if (crashTop) lede.push(`${dotOf(st).replace(/^./, (c) => c.toUpperCase())} posted ${n(j.crash)} crash alert${j.crash === 1 ? '' : 's'} in October. ${crashTop[0]} had the most, ${crashTop[1]}.`);
  else lede.push(`${dotOf(st).replace(/^./, (c) => c.toUpperCase())} posted ${n(j.crash)} crash alerts in October.`);
  const big = mw.started[0] || mw.ongoing[0];
  if (mw.finished.length) lede.push(`${mw.finished.length} major roadwork project${mw.finished.length === 1 ? '' : 's'} wrapped up${mw.started.length ? ` and ${mw.started.length} started` : ''}.`);
  else if (big && big.route) lede.push(`The biggest roadwork on the feed was on ${route(st, big.route)}.`);
  if (snow) lede.push(`The first snow and ice alerts showed up, ${snow} of them.`);

  const nums = `<div class="v2-nums">
<div><b>${n(j.crash)}</b><span>crash alerts</span></div>
${crashTop ? `<div><b>${esc(crashTop[0])}</b><span>most crash alerts, ${crashTop[1]}</span></div>` : ''}
<div><b>${mw.ongoing.length + mw.started.length}</b><span>major roadwork projects on the feed</span></div>
${mw.finished.length ? `<div><b>${mw.finished.length}</b><span>major projects finished</span></div>` : seasonal.length ? `<div><b>${seasonal.length}</b><span>winter closures by Oct. 31</span></div>` : ''}
</div>`;

  const S = [];
  if (ann.length) S.push(`<section class="v2-sec"><h2 class="rc">News from ${esc(dotOf(st))}</h2>${ann.map(annCard).join('')}</section>`);
  const cards = [...mw.finished.map((p) => projCard(st, p, 'finished')), ...mw.started.map((p) => projCard(st, p, 'started')), ...mw.ongoing.map((p) => projCard(st, p, 'ongoing'))];
  if (cards.length) S.push(`<section class="v2-sec"><h2 class="rc">Major roadwork</h2><p class="v2-sub">Projects on ${esc(dotOf(st))}'s feed in October that run a month or longer, with the dates the agency posted. Short lane closures are left out.</p>${cards.join('')}</section>`);
  if (places.length) S.push(`<section class="v2-sec"><h2 class="rc">Where the crashes were</h2><ul class="v2-pivot">${places.map((x) => `<li><strong>${esc(route(st, x.route))}</strong>${esc(x.place)}: ${x.crashes} crash alerts</li>`).join('')}</ul></section>`);
  const piv = [];
  if (snow) piv.push(`<li><strong>First snow</strong>${snow} alert${snow === 1 ? '' : 's'} named snow, ice or chains on the road.</li>`);
  if (seasonal.length) piv.push(`<li><strong>Winter closures</strong>${seasonal.length} seasonal closure${seasonal.length === 1 ? ' was' : 's were'} on the feed by Oct. 31. The list is further down.</li>`);
  if (waits[0]) piv.push(`<li><strong>Border</strong>The longest wait was ${hm(waits[0].maxMin)} at ${esc(waits[0].port)}${waits[0].crossing && waits[0].crossing !== 'Passenger' ? ` (${esc(waits[0].crossing)})` : ''}. The average there was ${hm(waits[0].avgMin)}. From U.S. Customs and Border Protection.</li>`);
  if (fire && fire.fires) piv.push(`<li><strong>Wildfires</strong>${n(fire.fires)} fires on the national wildfire feed were in ${name} by Oct. 31, covering ${n(fire.acres)} acres.</li>`);
  if (piv.length) S.push(`<section class="v2-sec"><h2 class="rc">Also in October</h2><ul class="v2-pivot">${piv.join('')}</ul></section>`);
  const q = [];
  if (crashTop) q.push(`<div class="v2-quote"><strong>Crashes</strong>“${esc(dotOf(st).replace(/^./, (c) => c.toUpperCase()))} posted ${n(j.crash)} crash alerts in October, according to the MileCheck Highway Report. ${esc(crashTop[0])} had the most, ${crashTop[1]}.”</div>`);
  const qp = mw.finished[0] || mw.started[0];
  if (qp && qp.route) q.push(`<div class="v2-quote"><strong>Roadwork</strong>“The ${mw.finished[0] ? 'roadwork' : 'new roadwork'} on ${esc(route(st, qp.route))} ${mw.finished[0] ? `was posted to end ${fmtD(qp.end)}` : `started ${fmtD(qp.start)} and is posted to run until ${fmtD(qp.end)}`}, according to the MileCheck Highway Report.”</div>`);
  if (q.length) S.push(`<section class="v2-sec"><h2 class="rc">For newsrooms</h2><p class="v2-sub">Free to quote with credit to the MileCheck Highway Report and a link to this page.</p>${q.join('')}</section>`);
  return { headline, lede: lede.join(' '), nums, body: S.join('\n') };
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
const finish = (h, from) => {
  h = h.replace(/<p class="mc-cta-line"[\s\S]*?<\/p>/, ''); // the old top line
  h = h.replace(/(<p class="mc-cta-sub">)<a href="#subscribe"[^>]*>[^<]*/g, `$1${LINK(from)}Get the next report &rarr;`); // national: link under the state picker
  // Leah 11/9: the month chart goes until the archive has clean earlier months.
  h = h.replace(/<h2 class="rc">Compared with earlier months<\/h2>[\s\S]*?(?=<h2|<section class="v2-sec">)/, '');
  return h.replace('</body>', `${POPUP(from)}\n</body>`);
};
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
  h = h.replace('How we got these numbers', 'Where these numbers come from');
  // No volume lists: the "Routes with the most alerts" box counts roadwork records.
  h = h.replace(/<div class="pull-stat"><strong>Routes with the most alerts in [^<]*<\/strong>[\s\S]*?<\/ul><\/div>/, '');
  h = h.replace(/<h2 class="rc">Closures and roadwork<\/h2>/, '<h2 class="rc">Closures</h2>');
  // New sections go after Leah's maps.
  const anchor = ['<h2 class="rc">Compared with earlier months', '<h2 class="rc">Winter closures', '<h2>More on'].find((a) => h.includes(a));
  h = h.replace(anchor, `${t.body}\n      ${anchor}`);
  h = h.replace(/\.\.\/road-report-october-2026\.html/g, '../road-report-october-2026-preview.html');
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
  const lede = `Winter showed up on the roads in October. The first ${X.snowIceLower48} snow and ice alerts reached the lower 48, ${allAnn[0] ? `${allAnn[0].title.replace(/:.*/, '')} reopened its lanes for the year, ` : ''}and the longest border wait was ${hm(topWait.maxMin)} at ${esc(topWait.port)}, Texas. Below: where the crashes were, the big roadwork that finished or started, and a report for every state and province.`;
  h = h.replace('</head>', `<meta name="robots" content="noindex">\n${CSS}\n</head>`);
  h = h.replace(/<h1 class="article-title">[\s\S]*?<\/h1>/, `<h1 class="article-title">Winter reaches the roads</h1><p style="margin:-6px 0 10px;font-weight:700;color:#5C6670">MileCheck Highway Report, October 2026</p>`);
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
  h = h.replace(/(<details class="method-fold">[\s\S]*?<\/details>)/, (m) => `${m}\n${pivot}${annSec}`);
  h = h.replace('<h2 class="rc">Border waits', `${projSec}${quotes}\n      <h2 class="rc">Border waits`);
  h = h.replace(/highway-report-october-2026-states\//g, 'highway-report-october-2026-preview/');
  writeFileSync(resolve(ROOT, 'blog/road-report-october-2026-preview.html'), finish(h, '/blog/road-report-october-2026-preview.html'));
}
console.log(`preview: ${made} state pages + national; majorWork states: ${Object.keys(MW).length}`);
