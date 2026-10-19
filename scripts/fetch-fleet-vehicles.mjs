// Pulls the public fleet records behind /what-vehicles-do-state-dots-and-police-drive/ and writes aggregates only
// to data/fleet-vehicles.json. Sources (see data/fleet-datasets.json for the full survey, checked 2026-10-16):
//  - California State Fleet, Dept of General Services, data.ca.gov. One row per asset per report year. We count
//    the latest report year, assets not disposed, self-propelled ground vehicles only (no trailers, aircraft, boats).
//    License field is "not specified"; the state open-data program's Conditions of Use say information is public
//    domain unless marked otherwise (handbook.data.ca.gov/conditions-of-use/). We publish counts, not rows.
//  - Seattle Active Fleet Complement, City of Seattle, Public Domain. Trailers left out.
// Run: node scripts/fetch-fleet-vehicles.mjs && node scripts/gen-fleet-vehicles.mjs
import { writeFileSync } from 'node:fs';
const CA = '065249ff-32c0-424f-b960-78c3fdbf7244';
const caSql = async sql => { const r = await fetch('https://data.ca.gov/api/3/action/datastore_search_sql?' + new URLSearchParams({ sql })); const j = await r.json(); if (!j.success) throw new Error('data.ca.gov: ' + JSON.stringify(j.error)); return j.result.records; };
const sea = async query => { const r = await fetch('https://cos-data.seattle.gov/resource/enxu-fgzb.json?' + new URLSearchParams({ $query: query })); if (!r.ok) throw new Error('Seattle ' + r.status); return r.json(); };
const AGENCY = { chp: "\"Agency\" LIKE 'California Highway Patrol%'", caltrans: "\"Agency\" LIKE 'Transportation, Department of%'", calfire: "\"Agency\" LIKE 'Forestry and Fire Protection%'" };
const [{ y: year }] = await caSql(`SELECT max("Report_Year") y FROM "${CA}"`);
const ground = `FROM "${CA}" WHERE "Report_Year"=${year} AND "Disposed"='No' AND "Asset_Category"='Ground' AND "Asset_Type" NOT IN ('Non-Self Propelled','Not Applicable') AND "Make_Model"<>'Not Applicable'`;
const ca = {};
for (const [k, where] of Object.entries(AGENCY)) {
  const [{ n }] = await caSql(`SELECT count(*) n ${ground} AND ${where}`);
  const models = await caSql(`SELECT upper("Make_Model") m, "Asset_Type" t, count(*) n ${ground} AND ${where} GROUP BY 1,2 ORDER BY n DESC LIMIT 300`);
  const types = await caSql(`SELECT "Asset_Type" t, count(*) n ${ground} AND ${where} GROUP BY 1 ORDER BY n DESC`);
  const fuel = await caSql(`SELECT "Fuel_Type" f, count(*) n ${ground} AND ${where} GROUP BY 1 ORDER BY n DESC`);
  const ev = await caSql(`SELECT upper("Make_Model") m, count(*) n ${ground} AND ${where} AND "Fuel_Type"='Electricity (battery powered)' GROUP BY 1 ORDER BY n DESC LIMIT 5`);
  ca[k] = { total: Number(n), ev: ev.map(r => ({ m: r.m, n: Number(r.n) })), models: models.map(r => ({ m: r.m, t: r.t, n: Number(r.n) })), types: types.map(r => ({ t: r.t, n: Number(r.n) })), fuel: fuel.map(r => ({ f: r.f, n: Number(r.n) })) };
}
// CHP patrol cars and SUVs by report year. Years before 2020 are left out: the patrol total jumps from 1,403 (2019)
// to 3,634 (2020) and several models repeat the same count four years running, so earlier reports were incomplete.
const trend = await caSql(`SELECT "Report_Year" y, upper("Make_Model") m, count(*) n FROM "${CA}" WHERE "Report_Year">=2020 AND "Disposed"='No' AND ${AGENCY.chp} AND "Asset_Type" IN ('Auto-Fullsize','SUV-LD') GROUP BY 1,2`);
const fam = m => /CHARGER/.test(m) ? 'Dodge Charger' : /TAHOE/.test(m) ? 'Chevrolet Tahoe' : /FORD EXPLORER/.test(m) ? 'Ford Explorer' : 'Other';
const chpTrend = {};
for (const r of trend) { const y = String(r.y); (chpTrend[y] ||= { 'Dodge Charger': 0, 'Chevrolet Tahoe': 0, 'Ford Explorer': 0, Other: 0 })[fam(r.m)] += Number(r.n); }
const NOT_TRAILER = "equipment_type not like 'TRAILER%'";
const seattle = {};
for (const [k, dept] of Object.entries({ spd: 'SPD', sdot: 'SDOT', sfd: 'SFD' })) {
  const [{ n }] = await sea(`SELECT count(*) AS n WHERE dept='${dept}' AND ${NOT_TRAILER}`);
  const models = await sea(`SELECT make, model, count(*) AS n WHERE dept='${dept}' AND ${NOT_TRAILER} GROUP BY make, model ORDER BY n DESC LIMIT 25`);
  const makeTypes = await sea(`SELECT make, equipment_type, count(*) AS n WHERE dept='${dept}' AND ${NOT_TRAILER} GROUP BY make, equipment_type ORDER BY n DESC LIMIT 200`);
  const fuel = await sea(`SELECT fuel_type, count(*) AS n WHERE dept='${dept}' AND ${NOT_TRAILER} GROUP BY fuel_type ORDER BY n DESC`);
  seattle[k] = { total: Number(n), models: models.map(r => ({ make: r.make, model: r.model, n: Number(r.n) })), makeTypes: makeTypes.map(r => ({ make: r.make, t: r.equipment_type, n: Number(r.n) })), fuel: fuel.map(r => ({ f: r.fuel_type || '', n: Number(r.n) })) };
}
const caPkg = (await (await fetch('https://data.ca.gov/api/3/action/package_show?id=california-state-fleet')).json()).result;
const meta = await (await fetch('https://cos-data.seattle.gov/api/views/enxu-fgzb.json')).json();
const out = { pulled: new Date().toISOString().slice(0, 10), ca: { year: Number(year), updated: caPkg.metadata_modified.slice(0, 10), ...ca, chpTrend }, seattle: { updated: new Date(meta.rowsUpdatedAt * 1000).toISOString().slice(0, 10), ...seattle } };
writeFileSync('data/fleet-vehicles.json', JSON.stringify(out, null, 1) + '\n');
console.log(`fleet: CA ${year} CHP ${ca.chp.total}, Caltrans ${ca.caltrans.total}; Seattle (updated ${out.seattle.updated}) SPD ${seattle.spd.total}, SDOT ${seattle.sdot.total}`);
