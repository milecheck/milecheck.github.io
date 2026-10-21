// Cross-links for the monthly state highway reports (Leah 10/21: the Oregon report linked nowhere in Oregon).
// Out: each state report gets a "More on <State>" list (road conditions, cameras, mile marker guide,
// all states, the national report). In: the state's road-conditions page and mile marker guide link
// to the newest state report. Idempotent (marker comments). Runs in finish-pages.mjs.
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const blog = resolve(root, 'blog');
const MONTHS = ['january','february','march','april','may','june','july','august','september','october','november','december'];
const dirs = readdirSync(blog).map((d) => d.match(/^highway-report-([a-z]+)-(\d{4})-states$/)).filter(Boolean)
  .map((m) => ({ dir: m[0], month: m[1], year: +m[2], key: +m[2] * 12 + MONTHS.indexOf(m[1]) })).sort((a, b) => a.key - b.key);
const title = (slug) => slug.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
const cap = (s) => s[0].toUpperCase() + s.slice(1);
const swap = (s, start, end, block, before) => {
  const re = new RegExp(`\\n?[ \\t]*${start}[\\s\\S]*?${end}`);
  if (re.test(s)) return s.replace(re, '\n' + block);
  const i = s.indexOf(before); if (i < 0) return null;
  return s.slice(0, i) + block + '\n' + s.slice(i);
};
let changed = 0;
for (const d of dirs) {
  for (const f of readdirSync(resolve(blog, d.dir))) {
    if (!f.endsWith('.html') || f === 'index.html') continue;
    const slug = f.replace(/\.html$/, ''), name = title(slug), p = resolve(blog, d.dir, f);
    const items = [];
    if (existsSync(resolve(root, 'road-conditions', slug, 'index.html'))) items.push(`<li><a href="/road-conditions/${slug}/">${name} road conditions now</a></li>`);
    if (existsSync(resolve(root, 'cameras', slug, 'index.html'))) items.push(`<li><a href="/cameras/${slug}/">${name} highway cameras</a></li>`);
    if (existsSync(resolve(blog, `mile-markers-${slug}.html`))) items.push(`<li><a href="/blog/mile-markers-${slug}.html">How mile markers work in ${name}</a></li>`);
    const nat = `road-report-${d.month}-${d.year}.html`;
    if (existsSync(resolve(blog, nat))) items.push(`<li><a href="/blog/${nat}">${cap(d.month)} ${d.year} highway report for every state</a></li>`);
    items.push(`<li><a href="/blog/${d.dir}/">${cap(d.month)} reports for the other states</a></li>`);
    const block = `      <!-- report-links:start -->\n      <h2>More on ${name}</h2>\n      <ul class="article-list">${items.join('')}</ul>\n      <!-- report-links:end -->`;
    const s = readFileSync(p, 'utf8');
    const out = swap(s, '<!-- report-links:start -->', '<!-- report-links:end -->', block, '      <div class="article-cta">');
    if (out && out !== s) { writeFileSync(p, out); changed++; }
  }
}
// Inbound, newest month only.
const latest = dirs[dirs.length - 1];
if (latest) for (const f of readdirSync(resolve(blog, latest.dir))) {
  if (!f.endsWith('.html') || f === 'index.html') continue;
  const slug = f.replace(/\.html$/, ''), name = title(slug);
  const href = `/blog/${latest.dir}/${f}`, label = `${name} highway report, ${cap(latest.month)} ${latest.year}`;
  const rc = resolve(root, 'road-conditions', slug, 'index.html');
  if (existsSync(rc)) {
    const s = readFileSync(rc, 'utf8');
    const li = `<li><a href="${href}">${label}</a></li><!-- report-link -->`;
    let out = s.replace(/<li><a href="\/blog\/highway-report-[^"]*">[^<]*<\/a><\/li><!-- report-link -->/, li);
    if (out === s && !s.includes('<!-- report-link -->')) out = s.replace(/(<h2>Nearby on MileCheck<\/h2>\s*<ul>)/, `$1\n      ${li}`);
    if (out !== s) { writeFileSync(rc, out); changed++; }
  }
  const mm = resolve(blog, `mile-markers-${slug}.html`);
  if (existsSync(mm)) {
    const s = readFileSync(mm, 'utf8');
    const block = `        <!-- report-link:start --><p>What happened on ${name}'s highways last month: <a href="${href}">${label}</a>.</p><!-- report-link:end -->`;
    const out = swap(s, '<!-- report-link:start -->', '<!-- report-link:end -->', block, '</div>\n\n      <div class="article-cta">');
    if (out && out !== s) { writeFileSync(mm, out); changed++; }
  }
}
console.log(`add-report-links: ${changed} file(s) changed`);
