// Pulls BLS Occupational Employment and Wage Statistics (OEWS) for road-crew occupations by state into
// data/road-workers.json. Public domain. BLS API v1 (no key): 25 series per request, 25 requests a day,
// so this runs by hand once a year when OEWS publishes (each spring), not on every build.
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
const FIPS = { AL:'01',AK:'02',AZ:'04',AR:'05',CA:'06',CO:'08',CT:'09',DE:'10',DC:'11',FL:'12',GA:'13',HI:'15',ID:'16',IL:'17',IN:'18',IA:'19',KS:'20',KY:'21',LA:'22',ME:'23',MD:'24',MA:'25',MI:'26',MN:'27',MS:'28',MO:'29',MT:'30',NE:'31',NV:'32',NH:'33',NJ:'34',NM:'35',NY:'36',NC:'37',ND:'38',OH:'39',OK:'40',OR:'41',PA:'42',RI:'44',SC:'45',SD:'46',TN:'47',TX:'48',UT:'49',VT:'50',VA:'51',WA:'53',WV:'54',WI:'55',WY:'56' };
const ALL = { '474051': 'Highway maintenance workers', '533032': 'Heavy and tractor-trailer truck drivers', '292042': 'Emergency medical technicians' };
const only = process.argv.slice(2);
const OCC = Object.fromEntries(Object.entries(ALL).filter(([k]) => !only.length || only.includes(k)));
const TYPES = { '01': 'employment', '13': 'median', '04': 'mean' };
const ids = [];
for (const occ of Object.keys(OCC)) {
  for (const t of Object.keys(TYPES)) ids.push(`OEUN0000000000000${occ}${t}`);
  for (const [st, f] of Object.entries(FIPS)) for (const t of Object.keys(TYPES)) ids.push(`OEUS${f}00000000000${occ}${t}`);
}
const prev = existsSync('data/road-workers.json') ? JSON.parse(readFileSync('data/road-workers.json', 'utf8')) : null;
const out = { source: 'U.S. Bureau of Labor Statistics, Occupational Employment and Wage Statistics', fetched: new Date().toISOString(), year: null, occupations: OCC, us: {}, states: {} };
for (let i = 0; i < ids.length; i += 25) {
  const res = await fetch('https://api.bls.gov/publicAPI/v1/timeseries/data/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ seriesid: ids.slice(i, i + 25) }) });
  const d = await res.json();
  if (d.status !== 'REQUEST_SUCCEEDED') throw new Error(JSON.stringify(d.message));
  for (const s of d.Results.series) {
    const v = s.data.find(x => x.latest === 'true') || s.data[0]; if (!v) continue;
    out.year = out.year || v.year;
    const id = s.seriesID, occ = id.slice(17, 23), t = id.slice(23), area = id.slice(4, 6);
    const key = TYPES[t], num = Number(v.value);
    if (id.startsWith('OEUN')) { (out.us[occ] ||= {})[key] = num; continue; }
    const st = Object.keys(FIPS).find(k => FIPS[k] === area);
    ((out.states[st] ||= {})[occ] ||= {})[key] = Number.isFinite(num) ? num : null;
  }
}
if (prev) { out.occupations = { ...prev.occupations, ...OCC }; for (const [k, v] of Object.entries(prev.us)) out.us[k] ??= v; for (const [st, v] of Object.entries(prev.states)) out.states[st] = { ...v, ...(out.states[st] || {}) }; }
writeFileSync('data/road-workers.json', JSON.stringify(out, null, 1) + '\n');
console.log(`OEWS ${out.year}: ${Object.keys(out.states).length} states`, out.us);
