// Append-only archive of EIA weekly fuel prices: data/gas-prices-history.csv (week,product,area,series,price).
// Rows are keyed by week+product+series and upserted, so re-running never duplicates. EIA revises rarely; a revised
// value overwrites the old one for that week. Keep this file forever: it is the dataset for longitudinal reports.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const FILE = 'data/gas-prices-history.csv';
const HEAD = 'week,product,area,series,price';
export function upsert(rows) {
  const map = new Map();
  if (existsSync(FILE)) for (const line of readFileSync(FILE, 'utf8').trim().split('\n').slice(1)) {
    const [week, product, , series] = line.split(',');
    map.set(`${week}|${product}|${series}`, line);
  }
  const before = map.size;
  for (const r of rows) {
    if (!(r.price > 0) || !/^\d{4}-\d\d-\d\d$/.test(r.week)) continue;
    map.set(`${r.week}|${r.product}|${r.series}`, [r.week, r.product, `"${r.area.replace(/"/g, '')}"`, r.series, r.price.toFixed(3)].join(','));
  }
  const lines = [...map.values()].sort();
  writeFileSync(FILE, HEAD + '\n' + lines.join('\n') + '\n');
  return { total: lines.length, added: lines.length - before };
}
// "10/12/26" -> "2026-10-12"
export const iso = mdY => { const [m, d, y] = mdY.split('/'); return `20${y}-${m}-${d}`; };
