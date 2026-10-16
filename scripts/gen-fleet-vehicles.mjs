// /what-vehicles-do-state-dots-and-police-drive/: what the California Highway Patrol, Caltrans, Seattle Police and
// Seattle's DOT drive, from their public fleet records. Input: data/fleet-vehicles.json (scripts/fetch-fleet-vehicles.mjs).
// No national share is quoted anywhere: no free official count of police or DOT vehicles exists for the U.S.
// Run, then node scripts/finish-pages.mjs.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const d = JSON.parse(readFileSync('data/fleet-vehicles.json', 'utf8'));
const { ca, seattle } = d;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const num = n => n.toLocaleString('en-US');
const pct = (n, of) => `${Math.round(n / of * 100)}%`;
const day = s => new Date(s + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
// California writes "FORD F250"; show "Ford F-250".
const UPPER = new Set(['BMW', 'GMC', 'EV', 'HV', 'LS', 'FLHTP', 'SD']);
const SPECIAL = { PROMASTER: 'ProMaster', 'INTERCEPT': 'Interceptor' };
const caName = m => m.split(' ').map(w => SPECIAL[w] || (UPPER.has(w) || /\d/.test(w) ? w.replace(/^F(\d{3})$/, 'F-$1') : w.split(/([-/])/).map(p => p.length > 1 ? p[0] + p.slice(1).toLowerCase() : p).join(''))).join(' ');
const TYPE = { 'Auto-Fullsize': 'Full-size car', 'Auto-Midsize': 'Midsize car', 'Auto-Compact': 'Compact car', 'Auto-Subcompact': 'Small car', 'SUV-LD': 'SUV', 'SUV-MD': 'SUV', 'Motorcycle': 'Motorcycle', 'Pickup-MD': 'Pickup', 'Pickup-LD': 'Pickup', 'Truck-HD': 'Heavy truck', 'Truck-MD': 'Medium truck', 'Van-LD-Other': 'Van', 'Van-LD-Minivan': 'Minivan', 'Van-MD': 'Van' };
// Seattle uses short codes. Only rows named here are shown; anything else is logged so it can be added.
const SEA = { 'FORD PIUH': 'Ford Police Interceptor Utility Hybrid', 'FORD PIU': 'Ford Police Interceptor Utility', 'FORD FUSIONENERGI': 'Ford Fusion Energi (plug-in hybrid)', 'NISS LEAF': 'Nissan Leaf (electric)', 'HARL FLHTP': 'Harley-Davidson FLHTP motorcycle', 'FORD ESCAPE': 'Ford Escape', 'FORD ESCAPEP': 'Ford Escape (plug-in hybrid)', 'WESW GO4': 'Westward GO-4 parking scooter', 'FORD CMAXENERGI': 'Ford C-Max Energi (plug-in hybrid)', 'FORD CMAX': 'Ford C-Max', 'CHEV EXPRESS': 'Chevrolet Express van', 'TOYT CAMRY': 'Toyota Camry', 'CHEV TAHOE': 'Chevrolet Tahoe', 'FORD TRANSCT': 'Ford Transit Connect van', 'PETE 567': 'Peterbilt 567 truck', 'PETE 348': 'Peterbilt 348 truck', 'FORD F150LIGHTNING': 'Ford F-150 Lightning (electric)', 'TOYT BZ4X': 'Toyota bZ4X (electric)', 'FREI M2': 'Freightliner M2 truck', 'CHEV BOLT': 'Chevrolet Bolt (electric)' };
const seaName = r => SEA[`${r.make} ${r.model}`] || (r.make === 'FORD' && /^F\d{3}$/.test(r.model) ? `Ford ${r.model.replace(/^F/, 'F-')}` : null);
const td = 'style="padding:9px 6px;border-bottom:1px solid #eee;vertical-align:top"', tdn = 'style="padding:9px 6px;border-bottom:1px solid #eee;vertical-align:top;text-align:right;white-space:nowrap"', th = 'style="text-align:left;padding:8px 6px;border-bottom:2px solid #E5E5E5"', thn = 'style="text-align:right;padding:8px 6px;border-bottom:2px solid #E5E5E5"';
const tbl = (head, rows) => `<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:15px;line-height:1.45"><thead><tr>${head.map((h, i) => `<th ${i ? thn : th}>${h}</th>`).join('')}</tr></thead><tbody>\n${rows.map(r => `<tr>${r.map((c, i) => `<td ${i && !/[a-z]/i.test(String(c).replace(/%$/, '')) ? tdn : td}>${c}</td>`).join('')}</tr>`).join('\n')}\n</tbody></table></div>`;

// California Highway Patrol
// Police versions fold into the base model ("FORD EXPLORER POLICE INTERCEPT" counts as Ford Explorer), the same
// way the patrol trend below groups them, so the two never disagree.
const fold = models => { const m = new Map(); for (const r of models) { const k = r.m.replace(/ POLICE( INTERCEPT(OR)?)?$/, '') + '|' + r.t; m.set(k, (m.get(k) || 0) + r.n); } return [...m].map(([k, n]) => ({ m: k.split('|')[0], t: k.split('|')[1], n })).sort((a, b) => b.n - a.n); };
const chp = ca.chp, chpTop = fold(chp.models).slice(0, 10);
const moto = chp.models.filter(r => r.t === 'Motorcycle'), motoN = chp.types.find(t => t.t === 'Motorcycle')?.n || 0;
const chpTable = tbl(['Vehicle', 'Type', 'How many', 'Share of CHP vehicles'], chpTop.map(r => [esc(caName(r.m)), TYPE[r.t] || esc(r.t), num(r.n), pct(r.n, chp.total)]));
// CHP patrol fleet since 2020
const years = Object.keys(ca.chpTrend).sort(), SERIES = [['Dodge Charger', '#2a78d6'], ['Chevrolet Tahoe', '#eb6834'], ['Ford Explorer', '#1baf7a']];
const vmax = Math.ceil(Math.max(...years.flatMap(y => SERIES.map(([s]) => ca.chpTrend[y][s]))) / 500) * 500;
const X = i => 56 + i * (440 / (years.length - 1)), Y = v => 200 - v / vmax * 170;
const grid = Array.from({ length: vmax / 500 + 1 }, (_, i) => i * 500).map(v => `<line x1="56" x2="500" y1="${Y(v)}" y2="${Y(v)}" stroke="#ececec" stroke-width="1"/><text x="48" y="${Y(v) + 4}" text-anchor="end" font-size="11" fill="#5b6670">${num(v)}</text>`).join('');
const xl = years.map((y, i) => `<text x="${X(i)}" y="222" text-anchor="middle" font-size="11" fill="#5b6670">${y}</text>`).join('');
// Direct labels at the line ends, nudged apart so they never overlap.
const ends = SERIES.map(([s, c]) => ({ s, c, y: Y(ca.chpTrend[years.at(-1)][s]) })).sort((a, b) => a.y - b.y);
for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 15) ends[i].y = ends[i - 1].y + 15;
const lines = SERIES.map(([s, c]) => { const pts = years.map((y, i) => [X(i), Y(ca.chpTrend[y][s])]); return `<polyline points="${pts.map(p => p.map(v => v.toFixed(1)).join(',')).join(' ')}" fill="none" stroke="${c}" stroke-width="2" stroke-linejoin="round"/>` + pts.map(([x, yy], i) => `<g><circle cx="${x.toFixed(1)}" cy="${yy.toFixed(1)}" r="5" fill="${c}" stroke="#fff" stroke-width="2"/><circle cx="${x.toFixed(1)}" cy="${yy.toFixed(1)}" r="12" fill="transparent"><title>${s}, ${years[i]}: ${num(ca.chpTrend[years[i]][s])}</title></circle></g>`).join(''); }).join('');
const labels = ends.map(e => `<text x="510" y="${(e.y + 4).toFixed(1)}" font-size="12" fill="#0E1116">${e.s.split(' ')[1]}</text>`).join('');
const legend = `<div style="display:flex;flex-wrap:wrap;gap:6px 16px;font-size:13px;color:#33404a;margin:6px 0 4px">${SERIES.map(([s, c]) => `<span style="display:inline-flex;align-items:center;gap:6px"><span style="width:12px;height:12px;border-radius:3px;background:${c};display:inline-block"></span>${s}</span>`).join('')}</div>`;
const chart = `<figure style="margin:10px 0 18px">${legend}<svg viewBox="0 0 600 236" role="img" aria-label="California Highway Patrol patrol cars and SUVs by model, ${years[0]} to ${years.at(-1)}" style="width:100%;height:auto;display:block">${grid}${xl}${lines}${labels}</svg><figcaption style="font-size:13px;color:#5b6670;margin-top:6px">CHP cars and SUVs by model in each yearly fleet report. Ford Explorer includes the Explorer Police Interceptor.</figcaption></figure>`;
const trendTable = tbl(['Year', ...SERIES.map(([s]) => s)], years.map(y => [y, ...SERIES.map(([s]) => num(ca.chpTrend[y][s]))]));
const t0 = ca.chpTrend[years[0]], t1 = ca.chpTrend[years.at(-1)];
const peakY = years.reduce((b, y) => ca.chpTrend[y]['Dodge Charger'] > ca.chpTrend[b]['Dodge Charger'] ? y : b, years[0]);

// Caltrans, grouped by kind of vehicle
const ct = ca.caltrans;
const GROUPS = [['Pickups', ['Pickup-MD', 'Pickup-LD']], ['Heavy trucks', ['Truck-HD']], ['Medium trucks', ['Truck-MD']], ['SUVs', ['SUV-LD', 'SUV-MD']], ['Cars', ['Auto-Compact', 'Auto-Midsize', 'Auto-Subcompact', 'Auto-Fullsize']], ['Vans', ['Van-LD-Other', 'Van-LD-Minivan', 'Van-MD']], ['Loaders, forklifts and other equipment', ['Construction Equipment', 'General Purpose', 'Farm Equipment', 'Riding Lawnmower', 'Low Speed Vehicle (NEV)']]];
const grouped = GROUPS.map(([g, ts]) => ({ g, n: ct.types.filter(t => ts.includes(t.t)).reduce((a, t) => a + t.n, 0), top: ct.models.filter(r => ts.includes(r.t)).slice(0, 3) }));
const otherN = ct.total - grouped.reduce((a, g) => a + g.n, 0);
if (otherN) grouped.push({ g: 'Other', n: otherN, top: [] });
const ctTable = tbl(['Kind of vehicle', 'How many', 'Most common'], grouped.filter(g => g.n).map(g => [g.g, num(g.n), g.top.map(r => `${esc(caName(r.m))} (${num(r.n)})`).join(', ') || '']));
const fuelN = (f, re) => f.filter(x => re.test(x.f)).reduce((a, x) => a + x.n, 0);
const ctEv = fuelN(ct.fuel, /battery/i), ctH2 = fuelN(ct.fuel, /hydrogen/i), ctDiesel = fuelN(ct.fuel, /diesel/i);

// Seattle
const seaRows = (dept, k) => { const rows = []; for (const r of seattle[k].models) { const n = seaName(r); if (n) rows.push([esc(n), num(r.n), pct(r.n, seattle[k].total)]); else if (rows.length < 10) console.warn(`unnamed Seattle ${dept} model: ${r.make} ${r.model} (${r.n})`); if (rows.length === 10) break; } return rows; };
const spd = seattle.spd, sdot = seattle.sdot;
const piuh = spd.models.find(r => r.make === 'FORD' && r.model === 'PIUH')?.n || 0, piu = spd.models.find(r => r.make === 'FORD' && r.model === 'PIU')?.n || 0;
const spdTable = tbl(['Vehicle', 'How many', 'Share of SPD vehicles'], seaRows('SPD', 'spd'));
const sdotTable = tbl(['Vehicle', 'How many', 'Share of SDOT vehicles'], seaRows('SDOT', 'sdot'));
const seaEle = k => seattle[k].fuel.filter(f => f.f === 'ELE').reduce((a, f) => a + f.n, 0);

const charger = fold(chp.models).find(r => /CHARGER/.test(r.m));
const ctTop = ct.models.filter(r => /^Pickup/.test(r.t))[0], ctHeavy = ct.models.filter(r => r.t === 'Truck-HD')[0];
const h1 = 'What vehicles do state DOTs and police drive?', url = 'https://milecheckapp.com/what-vehicles-do-state-dots-and-police-drive/';
const lede = `The California Highway Patrol's most common vehicle is the Dodge Charger. It had ${num(charger.n)} of them in ${ca.year}, out of ${num(chp.total)} vehicles. Caltrans, California's DOT, mostly drives pickups and heavy trucks. Its most common are the ${caName(ctTop.m)} pickup and the ${caName(ctHeavy.m)} truck.`;
const body = `    <p class="lede"><strong>${esc(lede)}</strong></p>
    <p>These counts come from public fleet records. California publishes its state agencies' vehicles once a year. Seattle publishes a list of its city fleet. There is no free official count of police or DOT vehicles for the whole country, so this page sticks to fleets that publish their lists.</p>
    <h2>What does the California Highway Patrol drive?</h2>
    <p><strong>Who is counted:</strong> California Highway Patrol vehicles in the state's ${ca.year} fleet report, not counting ones sold or retired that year. Cars, SUVs, pickups, vans, trucks and motorcycles are counted. Trailers, aircraft and boats are not.</p>
${chpTable}
    <p>Police versions are counted with the base model. CHP motorcycle officers mostly ride BMWs. ${num(moto[0]?.n || 0)} of its ${num(motoN)} motorcycles are the ${esc(caName(moto[0]?.m || ''))}.</p>
    <h2>How has the CHP patrol fleet changed since ${years[0]}?</h2>
    <p>The Tahoe count went from ${num(t0['Chevrolet Tahoe'])} in ${years[0]} to ${num(t1['Chevrolet Tahoe'])} in ${years.at(-1)}. Explorers went from ${num(t0['Ford Explorer'])} to ${num(t1['Ford Explorer'])}. Chargers peaked at ${num(ca.chpTrend[peakY]['Dodge Charger'])} in ${peakY}. Reports before ${years[0]} are left out because they are incomplete.</p>
${chart}
${trendTable}
    <h2>What does Caltrans drive?</h2>
    <p><strong>Who is counted:</strong> Caltrans vehicles and equipment in the state's ${ca.year} fleet report, not counting ones sold or retired that year. Trailers, aircraft and boats are not counted.</p>
${ctTable}
    <p>The report lists ${num(ctEv)} Caltrans vehicles as battery electric, ${pct(ctEv, ct.total)} of the fleet. The most common are the ${ct.ev.slice(0, 4).map(r => `${esc(caName(r.m))} (${num(r.n)})`).join(', ').replace(/, ([^,]*)$/, ' and $1')}. ${num(ctDiesel)} run on diesel and ${num(ctH2)} on hydrogen.</p>
    <h2>What do Seattle police drive?</h2>
    <p><strong>Who is counted:</strong> Seattle Police Department vehicles in the city's active fleet list, updated ${day(seattle.updated)}. Trailers are not counted.</p>
${spdTable}
    <p>The Police Interceptor Utility is Ford's police version of the Explorer. Seattle has ${num(piuh)} of the hybrid model and ${num(piu)} of the gas one.</p>
    <h2>What does Seattle's transportation department drive?</h2>
    <p><strong>Who is counted:</strong> Seattle Department of Transportation vehicles and equipment in the same city list. This is a city DOT, not the state one. Trailers are not counted.</p>
${sdotTable}
    <p>${num(seaEle('sdot'))} of SDOT's ${num(sdot.total)} vehicles run on electricity. For Seattle police it is ${num(seaEle('spd'))} of ${num(spd.total)}. The city lists hybrids as gas.</p>
    <h2>Where does this come from?</h2>
    <ul>
      <li><a href="https://data.ca.gov/dataset/california-state-fleet" rel="noopener" target="_blank">California State Fleet</a>, California Department of General Services. ${ca.year} report year, last updated ${day(ca.updated)}.</li>
      <li><a href="https://cos-data.seattle.gov/d/enxu-fgzb" rel="noopener" target="_blank">Active Fleet Complement</a>, City of Seattle. Public domain, updated ${day(seattle.updated)}.</li>
    </ul>
    <p>MileCheck counted these on ${day(d.pulled)}. Models are shown the way each fleet record names them.</p>
    <h2>More</h2>
    <ul><li><a href="/road-workers/">How much do highway maintenance workers make?</a></li><li><a href="/road-workers/dot-jobs/">How do you get a job at a state DOT?</a></li><li><a href="/snowplows/">Where are the snowplows right now?</a></li><li><a href="/how-long-do-crashes-take-to-clear/">How long does it take to clear a highway crash?</a></li></ul>`;
const tpl = readFileSync('what-is-my-mile-marker/index.html', 'utf8');
const headA = tpl.slice(0, tpl.indexOf('  <title>')), headB = tpl.slice(tpl.indexOf('  <link rel="icon"'), tpl.indexOf('  <script type="application/ld+json">')), headC = tpl.slice(tpl.indexOf('  <style>'), tpl.indexOf('  <article class="art">')), tail = tpl.slice(tpl.indexOf('  </article>'));
const desc = `The CHP's most common vehicle is the Dodge Charger, ${num(charger.n)} of ${num(chp.total)}. Caltrans mostly drives pickups and heavy trucks. Counts from California and Seattle fleet records.`;
const ld = { '@context': 'https://schema.org', '@type': 'Article', headline: h1, url, dateModified: d.pulled, author: { '@type': 'Organization', name: 'MileCheck' }, isBasedOn: ['https://data.ca.gov/dataset/california-state-fleet', 'https://cos-data.seattle.gov/d/enxu-fgzb'] };
const html = headA + `  <title>${esc(h1)} | MileCheck</title>\n  <meta name="description" content="${esc(desc)}">\n  <link rel="canonical" href="${url}">\n  <meta property="og:title" content="${esc(h1)}">\n  <meta property="og:url" content="${url}">\n  <meta property="og:type" content="article">\n` +
  headB.replace(/href="\.\.\//g, 'href="/') + `  <script type="application/ld+json">${JSON.stringify(ld)}</script>\n` + headC.replace(/href="\.\.\//g, 'href="/') +
  `  <article class="art">\n<div class="eyebrow">Road crews</div>\n    <h1>${esc(h1)}</h1>\n${body}\n` + tail;
mkdirSync('what-vehicles-do-state-dots-and-police-drive', { recursive: true });
writeFileSync('what-vehicles-do-state-dots-and-police-drive/index.html', html.replace(/href="\.\.\//g, 'href="/').replace(/src="\.\.\//g, 'src="/'));
console.log(`fleet page: CHP ${chp.total}, Caltrans ${ct.total}, SPD ${spd.total}, SDOT ${sdot.total}`);
