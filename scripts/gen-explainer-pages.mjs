// Explainer pages for curiosity searches (docs/curiosity-searches-2026-10-15.md). Bodies in data/explainers/<slug>.html,
// written by ChatGPT 10/15 with sources and checked by Claude. Same shell as gen-rest-area-pages.mjs.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
const list = JSON.parse(readFileSync('data/explainers/index.json', 'utf8'));
const tpl = readFileSync('what-is-my-mile-marker/index.html', 'utf8');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const headA = tpl.slice(0, tpl.indexOf('  <title>'));
const headB = tpl.slice(tpl.indexOf('  <link rel="icon"'), tpl.indexOf('  <script type="application/ld+json">'));
const headC = tpl.slice(tpl.indexOf('  <style>'), tpl.indexOf('  <article class="art">'));
const tail = tpl.slice(tpl.indexOf('  </article>'));
const readDate = 'October 15, 2026';
function page({ path, title, desc, h1, body, ld, eyebrow }) {
  const url = `https://milecheckapp.com${path}`;
  const html = headA +
    `  <title>${esc(title)}</title>\n  <meta name="description" content="${esc(desc)}">\n  <link rel="canonical" href="${url}">\n` +
    `  <meta property="og:title" content="${esc(h1)}">\n  <meta property="og:description" content="${esc(desc)}">\n  <meta property="og:url" content="${url}">\n  <meta property="og:type" content="article">\n` +
    headB.replace(/href="\.\.\//g, 'href="/') +
    `  <script type="application/ld+json">${JSON.stringify(ld)}</script>\n` +
    headC.replace(/href="\.\.\//g, 'href="/') +
    `  <article class="art">\n<div class="eyebrow">${esc(eyebrow || 'Highway basics')}</div>\n    <h1>${esc(h1)}</h1>\n${body}\n` + tail;
  const dir = path.replace(/^\//, '');
  mkdirSync(dir, { recursive: true });
  writeFileSync(dir + 'index.html', html.replace(/href="\.\.\//g, 'href="/').replace(/src="\.\.\//g, 'src="/'));
}
// Bar chart for /when-is-gas-cheapest/: each week's U.S. regular price vs its year's average, median by month,
// 2005-2025, from data/gas-prices-history.csv (EIA). Recomputed on every build.
function gasSeasonChart() {
  const rows = readFileSync('data/gas-prices-history.csv', 'utf8').trim().split('\n').slice(1)
    .filter(l => l.includes(',EMM_EPMR_PTE_NUS_DPG,')).map(l => { const c = l.split(','); return { w: c[0], p: +c.at(-1) }; });
  const byYear = {};
  for (const r of rows) { const y = r.w.slice(0, 4); if (y >= '2005' && y <= '2025') (byYear[y] ||= []).push(r); }
  const dev = Array.from({ length: 12 }, () => []);
  for (const ws of Object.values(byYear)) { if (ws.length < 50) continue; const avg = ws.reduce((a, r) => a + r.p, 0) / ws.length; for (const r of ws) dev[+r.w.slice(5, 7) - 1].push((r.p / avg - 1) * 100); }
  const med = a => { const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
  const v = dev.map(med), M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const W = 640, H = 260, top = 24, mid = 130, scale = 100 / 8, bw = 40, gap = (W - 40 - 12 * bw) / 11;
  const bars = v.map((d, i) => { const x = 20 + i * (bw + gap), h = Math.abs(d) * scale, y = d >= 0 ? mid - h : mid;
    const lab = `${d > 0 ? '+' : ''}${d.toFixed(1)}%`, ly = d >= 0 ? y - 6 : y + h + 14;
    return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw}" height="${h.toFixed(1)}" rx="3" fill="${d >= 0 ? '#C2410C' : '#0F766E'}"><title>${M[i]} ${lab}</title></rect><text x="${(x + bw / 2).toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle" font-size="11" fill="#33414d">${lab}</text><text x="${(x + bw / 2).toFixed(1)}" y="${H - 6}" text-anchor="middle" font-size="12" fill="#5b6670">${M[i]}</text>`; }).join('');
  return `<figure style="margin:18px 0 22px"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Typical U.S. regular gas price by month compared with the year's average, 2005 to 2025" style="width:100%;height:auto;display:block"><line x1="10" x2="${W - 10}" y1="${mid}" y2="${mid}" stroke="#c9d1d8"/>${bars}</svg><figcaption style="font-size:13px;color:#5b6670;margin-top:6px">Typical price each month compared with that year's average, U.S. regular gas, 2005 to 2025 (median). Green is below average, orange above. Source: EIA weekly prices, MileCheck analysis.</figcaption></figure>`;
}
for (const a of list) {
  const html = readFileSync(`data/explainers/${a.slug}.html`, 'utf8');
  const lede = (html.match(/<p class="lede">([\s\S]*?)<\/p>/) || [, a.desc])[1].replace(/<[^>]+>/g, '');
  page({ path: `/${a.slug}/`, title: a.title, desc: a.desc, h1: a.h1, eyebrow: a.eyebrow, body: html.replace('<div class="chart" data-chart="gas-seasonality"></div>', gasSeasonChart()),
    ld: { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: [{ '@type': 'Question', name: a.h1, acceptedAnswer: { '@type': 'Answer', text: lede } }] } });
}
console.log(`explainers: ${list.length} pages`);
