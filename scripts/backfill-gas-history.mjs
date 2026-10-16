// One-time (re-runnable) backfill of data/gas-prices-history.csv from EIA's full weekly history pages.
// Uses the series codes saved in data/gas-prices.json by gen-gas-prices.mjs.
import { readFileSync } from 'node:fs';
import { upsert } from './gas-history.mjs';
const cur = JSON.parse(readFileSync('data/gas-prices.json', 'utf8'));
const rows = [];
for (const product of ['regular', 'diesel']) for (const [area, v] of Object.entries(cur[product].out)) {
  if (!v.series) continue;
  const res = await fetch(`https://www.eia.gov/dnav/pet/hist/LeafHandler.ashx?n=PET&s=${v.series}&f=W`, { headers: { 'User-Agent': 'MileCheck gas-prices archive (info@milecheckapp.com)' } });
  if (!res.ok) { console.error(`skip ${v.series} ${res.status}`); continue; }
  const text = (await res.text()).replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ');
  let n = 0;
  for (const m of text.matchAll(/(\d{4})-[A-Z][a-z]{2}((?:\s+\d\d\/\d\d\s+[\d.]*)+)/g)) {
    for (const p of m[2].matchAll(/(\d\d)\/(\d\d)\s+([\d.]+)/g)) { rows.push({ week: `${m[1]}-${p[1]}-${p[2]}`, product, area, series: v.series, price: +p[3] }); n++; }
  }
  console.log(product, area, n);
  await new Promise(r => setTimeout(r, 400));
}
console.log(upsert(rows));
