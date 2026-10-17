// Tests for scripts/lib/road-overview.js (with road-status.js). Run: node scripts/lib/road-overview.test.js
// Renders the Overview from fixture snapshots and checks what a driver would read: no "Closed" or
// "partial closure" for a record that reports none, no negative full-closure line from a failed feed,
// receipt time from the fetch and not the clock, remainder counts only when the list holds them,
// sources on every line, and no Cajon-only text in shared code.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ctx = { module: { exports: {} }, console };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, 'road-status.js'), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, 'road-overview.js'), 'utf8'), ctx);

let n = 0, bad = 0;
function ok(name, cond, extra) { n++; if (!cond) { bad++; console.log('FAIL', name, extra ? '\n   ' + extra : ''); } }
const text = (h) => h.replace(/<[^>]+>/g, ' ').replace(/&middot;/g, '·').replace(/&deg;/g, '°').replace(/&hellip;/g, '…').replace(/\s+/g, ' ');

const now = Date.parse('2026-10-09T17:00:00Z'), H = 3600e3, M = 60e3;
const CA = { place: 'Test Summit', radiusMi: 14, tz: ctx.zoneFor('CA'), dot: 'Caltrans', alertSrc: 'Caltrans and CHP', condSrc: 'Caltrans', fireSrc: 'NIFC', lat: 34.34, lon: -117.44,
  lists: { clos: 'Closures and incidents', snow: 'Snow and ice', work: 'Construction', fire: 'Wildfires' } };
const okLog = (at) => ['alerts', 'road weather', 'cameras', 'fires'].map(label => ({ label, cls: 'ok', at, server: at - 2 * M }));
const base = { type: 'CL', route: 'I-15', dir: 'NB', loc: 'Test location', id: 'CA-LCS-1', st: 'CA', desc: '', mp: 12, lat: 34.35, lon: -117.44 };
function snap(alerts, extra) { return Object.assign({ at: now - 30e3, alerts, conds: [], cams: [], fires: [], wx: { at: now - 30e3, alerts: [], period: null }, log: okLog(now - 30e3) }, extra || {}); }
function render(s, cfg, t) { return ctx.overviewHtml(s, cfg || CA, t == null ? now : t); }

// --- Review 4 reproductions ---
let o = render(snap([{ ...base, title: 'No full closure', t0: now - H, t1: now + H }]));
ok('none never renders as partial', !/partial closure/i.test(o.html), text(o.html));
ok('none never renders "No full closure (partial closure)"', !/No full closure \(partial/i.test(o.html));
// CHANGED in pass 7: an agency closure record whose words report no closure stays among closure reports, as a neutral Report.
ok('none is listed as a neutral report among closure reports', /Closure reports.*Report: No full closure\./s.test(text(o.html)), text(o.html));
ok('none does not appear as a full closure', !/Full-closure reports/.test(o.html));

o = render(snap([{ ...base, title: 'Roadway is closed', t0: NaN, t1: NaN }]));
// CHANGED in pass 7: no agency times is not an active window, so it is a closure report, not a full closure.
ok('unknown-time closure is a closure report', /Closure reports.*Closure report: Roadway is closed\./s.test(text(o.html)) && !/Full-closure reports/.test(o.html), text(o.html));
ok('unknown-time full closure says timing not supplied', /Timing not supplied by the agency\./.test(o.html));
ok('unknown-time never says Closed', !/\bClosed\b/.test(text(o.html)), text(o.html));
ok('unknown-time not called a scheduled window', !/Scheduled window underway/.test(o.html));

o = render(snap([{ ...base, title: 'Right lane closed', t0: now + 24 * H, t1: now + 25 * H }]));
// CHANGED in pass 7: scheduled agency closure records are labelled by type, with the agency's words, not a parsed extent.
ok('future closure record is a scheduled window', /Scheduled closure windows.*Scheduled closure report: Right lane closed\./s.test(text(o.html)), text(o.html));
ok('future closure record is not current', !/Closure reports I-15/.test(text(o.html)));

o = render(snap([{ ...base, title: 'Caltrans full closure C15XX.', desc: 'Off-Ramp Roadway is closed.', t0: now - H, t1: now + H }]));
ok('generic heading over an off-ramp is not a full closure', !/Full-closure reports/.test(o.html), text(o.html));
// CHANGED in pass 7: a closure report in the agency's words, not a parsed feature label.
ok('off-ramp record is a closure report in the agency words', /Closure report: Caltrans full closure C15XX\. Off-Ramp Roadway is closed\./.test(text(o.html)), text(o.html));

o = render(snap([{ ...base, title: 'I-15 closed, off-ramp reopened', t0: now - H, t1: now + H }]));
ok('mainline closed + ramp reopened is a full closure', /Full-closure reports/.test(o.html));
o = render(snap([{ ...base, title: 'Road closed. Road reopened to traffic.', t0: now - H, t1: now + H }]));
ok('reopened road is not a closure', !/Full-closure reports|Lane, ramp and other closure reports/.test(o.html));
o = render(snap([{ ...base, title: 'Road may be closed', t0: now - H, t1: now + H }]));
// CHANGED in pass 7: same reason.
ok('conditional wording is a closure report in the agency words', /Closure report: Road may be closed\./.test(text(o.html)), text(o.html));
// CHANGED in pass 7: closure reports are counted and listed in the agency's words; no parsed extent is claimed.
ok('closure report count is named in the full-closure section', /1 closure report is listed below in the agency's words\./.test(text(o.html)), text(o.html));

// --- Every kind × timing: no "Closed", none never partial ---
const kinds = ['Roadway is closed', 'Right lane closed', 'Closure reported', 'Road may be closed', 'No full closure', 'Road is not closed'];
const times = [[now - H, now + H], [now - H, NaN], [NaN, NaN], [now + H, now + 2 * H], [now + H, now - H]];
for (const k of kinds) for (const t of times) {
  const h = text(render(snap([{ ...base, title: k, t0: t[0], t1: t[1] }])).html);
  ok('no "Closed" label: ' + k + ' ' + t, !/\bClosed\b/.test(h), h);
  if (/not closed|No full closure/.test(k)) ok('none never partial: ' + k + ' ' + t, !/[Pp]artial closure|Lane, ramp or shoulder closure|Full-closure reports|Lane, ramp and other closure reports|Full closure:/.test(h), h);
}

// --- Failed and partial feeds ---
o = render(snap([{ ...base, title: 'Roadway is closed', t0: now - H, t1: now + H }], { log: okLog(now).map(e => e.label === 'alerts' ? { ...e, cls: 'failed' } : e) }));
ok('failed alerts feed says unavailable', /reports unavailable/.test(o.html));
ok('failed alerts feed gives no negative full-closure line', !/returned no full-closure reports/.test(o.html));
ok('failed alerts feed: retrieval says unavailable', /alerts unavailable/.test(o.html));
o = render(snap([], { log: okLog(now).map(e => e.label === 'alerts' ? { ...e, cls: 'partial' } : e) }));
ok('partial alerts feed warns', /incomplete right now/.test(o.html));
o = render(snap([], { log: [{ label: 'alerts', cls: 'ok', at: now - M, server: now - 2 * H }, { label: 'alerts', cls: 'failed', at: now, server: NaN }] }));
ok('one failed state plus one good state is partial', /incomplete right now/.test(o.html));
ok('stale feed is described as the server retrieval, with its source', /MileCheck's server last retrieved Caltrans and CHP reports Fri, Oct 9, 8:00 AM PDT\. They may be outdated\./.test(text(o.html).replace(/&#39;|\\'/g, "'")), text(o.html));
ok('never calls server retrieval an agency update', !/agency feed was last updated|Agency updated/i.test(o.html));
o = render(snap([], { log: okLog(now).filter(e => e.label !== 'fires') }));
ok('missing fire log means fire unavailable, with its source', /NIFC fire reports unavailable/.test(o.html));
o = render(snap([], { log: okLog(now).map(e => ({ ...e, at: NaN })) }));
ok('missing receipt time is said plainly', /retrieval time not recorded/.test(o.html));

// --- Receipt time vs render time ---
const s1 = snap([]);
const a1 = render(s1, CA, now).header, a2 = render(s1, CA, now + 5 * M).header;
ok('header gives the fetch time', a1 === 'Retrieved 9:59 AM PDT.', a1);
ok('header never advances without a fetch', a2.indexOf('Retrieved 9:59 AM PDT.') === 0 && /Timing rechecked 10:05 AM PDT\./.test(a2), a2);

// --- Remainder counts only when the list below holds them ---
const many = Array.from({ length: 7 }, (_, i) => ({ ...base, id: 'x' + i, title: 'Right lane closed ' + i, t0: now - H, t1: now + H }));
o = render(snap(many));
ok('"2 more" points at the named list', /2 more closure reports in the Closures and incidents list below\./.test(text(o.html)), text(o.html));
ok('remainder line names its source', /list below\. Caltrans and CHP/.test(text(o.html)));
o = render(snap(many), { ...CA, lists: {} });
ok('no remainder line when the page has no such list', !/more closure reports/.test(o.html));

// --- Sources on every line ---
o = render(snap([{ ...base, id: 'CA-chp-1', type: 'AC', title: 'Crash on I-15', t0: now - H, t1: NaN }], { conds: [{ name: 'Cajon summit', restr: ['Chains required'], cond: '' }] }));
ok('crash line names CHP', /Crash: Crash on I-15\..*CHP/.test(text(o.html)), text(o.html));
ok('restriction line names its source', /Cajon summit : Chains required\. Caltrans/.test(text(o.html)), text(o.html));

// --- Work zones: missing time is not an open-ended window ---
o = render(snap([{ ...base, type: 'RW', title: 'Lane closure A', t0: now - H, t1: now + H }, { ...base, type: 'RW', title: 'Lane closure B', t0: NaN, t1: NaN }, { ...base, type: 'RW', title: 'Lane closure C', t0: now + H, t1: now + 2 * H }], { conds: [{ name: 'X', restr: [], cond: 'Roadwork' }] }));
ok('work zones split by timing', /1 with a scheduled window underway, 1 with no agency times, 1 scheduled later/.test(o.html), text(o.html));
ok('road-condition work reports counted', /1 road-condition work report/.test(o.html));
ok('no "open-ended" claim', !/open-ended/.test(o.html));

// --- Cameras by their own source; weather is one point ---
o = render(snap([], { cams: [{ title: 'A', img: 'a.jpg', lat: 34.3, lon: -117.4 }, { title: 'B', img: 'b.jpg', lat: 34.3, lon: -117.4, src: 'NPS' }] }));
ok('cameras counted by source', /1 camera listed by Caltrans, 1 camera listed by NPS/.test(o.html), text(o.html));
o = render(snap([], { wx: { at: now - 30e3, alerts: [{ event: 'Wind Advisory', onset: '2026-10-09T18:00:00Z' }], period: { name: 'Tonight', startTime: '2026-10-09T18:00:00-07:00', endTime: '2026-10-10T06:00:00-07:00', shortForecast: 'Clear', isDaytime: false, temperature: 55, temperatureUnit: 'F', windSpeed: '10 mph', windDirection: 'W' } } }));
ok('weather labelled as one point', /Weather at one point/.test(o.html) && /Forecast for the point at Test Summit/.test(o.html));
ok('weather alert listed with start', /Wind Advisory ?\. Starts Fri, Oct 9, 11:00 AM PDT\./.test(text(o.html)), text(o.html));
ok('weather receipt time', /Retrieved 9:59 AM PDT\./.test(text(o.html)));
o = render(snap([], { wx: null }));
ok('weather unavailable said plainly', /National Weather Service data unavailable/.test(o.html));

// --- Fire: distance to the reported location only ---
o = render(snap([], { fires: [{ name: 'Test Fire', acres: 120, pct: 40, dist: 6.2 }] }));
ok('fire distance wording', /Test Fire, 120 acres, 40% contained, 6 mi from Test Summit to the reported fire location\./.test(text(o.html)), text(o.html));
o = render(snap([]));
ok('no fire records wording', /No fire records were returned within 14 mi of Test Summit\./.test(o.html));

// --- Other states use their own place, agency and zone ---
const UT = { ...CA, place: 'Snowbird', tz: ctx.zoneFor('UT'), dot: 'UDOT', alertSrc: 'UDOT', condSrc: 'UDOT' };
o = render(snap([{ ...base, st: 'UT', id: 'x', route: 'SR-210', title: 'SR-210 closed for avalanche control', t0: now - H, t1: now + H }]), UT);
ok('Utah times in Mountain time', /MDT/.test(o.html) && !/PDT|PT\b/.test(o.html), text(o.html));
ok('Utah record source is UDOT', /UDOT/.test(o.html) && !/Caltrans|CHP/.test(o.html), text(o.html));
ok('Utah header in Mountain time', /MDT\.$/.test(render(snap([]), UT).header));
const shared = fs.readFileSync(path.join(__dirname, 'road-overview.js'), 'utf8') + fs.readFileSync(path.join(__dirname, 'road-status.js'), 'utf8');
ok('no Cajon text in shared code', !/Cajon/i.test(shared));
ok('no Pacific-only time label in the Overview code', !/' PT'|America\/Los_Angeles/.test(fs.readFileSync(path.join(__dirname, 'road-overview.js'), 'utf8')));
ok('no hard-coded Caltrans or CHP in the Overview code', !/Caltrans|CHP/.test(fs.readFileSync(path.join(__dirname, 'road-overview.js'), 'utf8')));

// --- Pass 5 Overview items ---
o = render(snap([{ ...base, title: 'Roadway is closed', t0: now - 3 * H, t1: now - H }]));
// CHANGED in pass 7: full closures need an active agency window, so the negative names that.
ok('negative line is qualified to what MileCheck identified', /No full-closure reports in an active agency window were identified in the retrieved Caltrans and CHP records\./.test(text(o.html)), text(o.html));
ok('negative line never says the agency returned none', !/returned no full-closure reports/.test(o.html));
// CHANGED in pass 7: ended agency closure records are counted, whatever their words.
ok('ended closure report is counted out loud', /1 closure report whose agency end time has passed is not counted\./.test(o.html), text(o.html));
o = render(snap([{ ...base, title: 'Road closed to trucks', t0: now - H, t1: now + H }]));
ok('restricted closure is a closure report with the agency words', /Closure report: Road closed to trucks\./.test(text(o.html)), text(o.html));
ok('restricted closure is not "extent not stated"', !/extent not stated/.test(o.html));
o = render(snap([{ ...base, title: 'Rest area closed', t0: now - H, t1: now + H }]));
// CHANGED in pass 7: no parsed feature label at all; the agency's words name the rest area.
ok('rest area record keeps the agency words and invents no lane, ramp or shoulder', /Closure report: Rest area closed\./.test(text(o.html)) && !/Lane, ramp or shoulder/.test(o.html), text(o.html));
o = render(snap([{ ...base, title: 'Shoulder closed', t0: now - H, t1: now + H }]));
// CHANGED in pass 7: same reason.
ok('shoulder record in the agency words', /Closure report: Shoulder closed\./.test(text(o.html)), text(o.html));
o = render(snap([{ ...base, type: 'RW', title: 'Work A', t0: now - H, t1: NaN }, { ...base, type: 'RW', title: 'Work B', t0: now + H, t1: now - H }]));
ok('work zone with start only or invalid times is incomplete or invalid, not "not supplied"', /2 with incomplete or invalid agency timing/.test(o.html), text(o.html));
o = render(snap([], { cams: [], log: okLog(now).map(e => e.label === 'cameras' ? { ...e, cls: 'failed' } : e) }));
ok('camera failure names the agency', /Caltrans camera list unavailable\./.test(o.html), text(o.html));
o = render(snap([], { cams: [] }));
ok('empty camera list names the agency', /Caltrans listed no cameras for this area\./.test(o.html), text(o.html));
o = render(snap([], { wx: { at: now, alerts: [{ event: 'Wind Advisory' }], period: null } }));
ok('each weather alert names its source', /Wind Advisory \. National Weather Service/.test(text(o.html)) || /Wind Advisory\.\s*National Weather Service/.test(text(o.html)), text(o.html));
o = render(snap([]));
ok('sources line says agency update times are not available', /Agency update times are not available\./.test(o.html));

// --- Pass 6 Overview items, under the pass 7 rule (structured closure + active window + agreeing words) ---
o = render(snap([{ ...base, title: 'I-15 reopened. I-215 closed due to crash.', t0: now - H, t1: now + H }]));
ok('N9: an I-15 record whose words close I-215 is not an I-15 full closure', !/Full-closure reports/.test(o.html) && /Closure report: I-15 reopened\. I-215 closed due to crash\./.test(text(o.html)), text(o.html));
o = render(snap([{ ...base, type: 'RW', title: 'I-15 closed for bridge work', t0: now - H, t1: now + H }]));
ok('N16: a work record is never a full closure from its words', !/Full-closure reports/.test(o.html), text(o.html));
for (const t of ['I-15 closed only to heavy trucks.', 'I-15 closed for trucks over 10 tons.', 'I-15 closed if avalanche control is needed.']) {
  o = render(snap([{ ...base, title: t, t0: now - H, t1: now + H }]));
  ok('N11-N13: never a full closure: ' + t, !/Full-closure reports/.test(o.html) && /Closure report: /.test(text(o.html)), text(o.html));
}
for (const t of ['I-15 closed. I-15 has not reopened.', 'I-15 closed. If repairs finish, I-15 reopens.', 'I-15 closed. I-15 reopens October 12.']) {
  o = render(snap([{ ...base, title: t, t0: now - H, t1: now + H }]));
  ok('N1-N6: still a full closure: ' + t, /Full-closure reports/.test(o.html), text(o.html));
}
o = render(snap([{ ...base, title: 'I-15 closed. I-15 reopened.', t0: now - H, t1: now + H }]));
ok('reopened words never remove an agency closure record', /Closure reports.*Report: I-15 closed\. I-15 reopened\./s.test(text(o.html)), text(o.html));
const filler15 = 'Crews continue debris removal and equipment staging near the reported location. '.repeat(18);
o = render(snap([{ ...base, title: 'I-15 closed.', text: 'I-15 closed. ' + filler15 + 'I-15 reopened to emergency vehicles only.', desc: 'shortened', t0: now - H, t1: now + H }]));
ok('N15: the decisive qualification is visible', /I-15 reopened to emergency vehicles only\./.test(text(o.html)), text(o.html));
const cw = Array.from({ length: 6 }, (_, i) => ({ name: 'Work site ' + (i + 1), cond: 'Construction', restr: ['Vehicles over ' + (i + 10) + ' tons prohibited'] }));
o = render(snap([], { conds: cw }));
ok('N17: a construction restriction remainder points at the Construction list', /1 more restriction report in the Construction list below\./.test(text(o.html)) && !/in the Snow and ice list/.test(o.html), text(o.html));
o = render(snap([], { log: okLog(now).map(e => e.label === 'alerts' ? { ...e, cls: 'failed' } : e) }));
ok('#10: unavailable line names its source', /Caltrans and CHP reports unavailable\./.test(text(o.html).split('Crashes, hazards')[1] || ''), text(o.html));
o = render(snap([], { cams: [{ title: 'A', img: 'a.jpg', lat: 34.3, lon: -117.4 }] }));
ok('#10: camera caption and image failure name the source', /A &middot; Caltrans<\/a>/.test(o.html) && /Image from Caltrans did not load/.test(o.html), o.html);

// --- Never a safety verdict ---
for (const t of [[], many, [{ ...base, title: 'Road closed. Road reopened to traffic.', t0: now - H, t1: now + H }]]) {
  const h = text(render(snap(t)).html);
  ok('no safety or open verdict', !/\b(safe|is open|are open|clear to|passable|you can drive|do not drive)\b/i.test(h), h);
}

console.log(n + ' checks, ' + bad + ' failed');
process.exit(bad ? 1 : 0);
