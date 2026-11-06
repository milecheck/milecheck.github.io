#!/usr/bin/env node
// add-question-links.mjs — a "More questions" line on existing pages, pointing at the question
// pages built 2026-11-05 from the 100-questions list. Data: data/question-links.json
// (pages = slug -> question, links = existing page -> slugs). Only pages that exist get a line,
// and only to question pages that exist.
// The line sits between <!-- qlinks:start --> and <!-- qlinks:end -->, placed before the page's
// "Related:" line, else before </article>, else before </main>, else before the footer hub.
// Idempotent: strips its own block and re-inserts it, so a second run writes nothing.
//   node scripts/add-question-links.mjs
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';

const { pages, links: exact, patterns = {} } = JSON.parse(readFileSync('data/question-links.json', 'utf8'));
// Expand "dir/*/index.html" or "dir/prefix-*.html" (one * in one path segment). Exact entries win.
const links = {};
for (const [pat, slugs] of Object.entries(patterns)) {
  const parts = pat.split('/'); const i = parts.findIndex(p => p.includes('*'));
  const dir = parts.slice(0, i).join('/'); const [pre, post] = parts[i].split('*'); const rest = parts.slice(i + 1).join('/');
  if (!existsSync(dir)) continue;
  for (const n of readdirSync(dir).sort()) {
    if (!n.startsWith(pre) || !n.endsWith(post) || n.length < pre.length + post.length + 1) continue;
    const f = [dir, n, rest].filter(Boolean).join('/');
    if (existsSync(f) && f.endsWith('.html')) links[f] = slugs;
  }
}
Object.assign(links, exact);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const RE = /<!-- qlinks:start -->[\s\S]*?<!-- qlinks:end -->\n?/;
let changed = 0, same = 0;
for (const [file, slugs] of Object.entries(links)) {
  if (!existsSync(file)) continue;
  const items = slugs.filter(s => pages[s] && existsSync(`${s}/index.html`));
  if (!items.length) continue;
  const block = `<!-- qlinks:start -->\n<p class="mc-qlinks" style="max-width:760px;margin:22px auto;padding:0 20px;color:#5b6670;font:14px/1.6 Inter,-apple-system,'Segoe UI',sans-serif">More questions: ${items.map(s => `<a href="/${s}/" style="color:#0f7a4f;font-weight:700;text-decoration:none">${esc(pages[s])}</a>`).join(' &middot; ')}</p>\n<!-- qlinks:end -->\n`;
  const orig = readFileSync(file, 'utf8');
  let html = orig.replace(RE, '');
  const anchors = [/<p class="g-related"/, /<!-- related:start -->/, /<\/article>/, /<\/main>/, /<!-- footer-hub:start -->/, /<footer/];
  let at = -1;
  for (const a of anchors) { const m = html.match(a); if (m) { at = m.index; break; } }
  if (at < 0) continue;
  html = html.slice(0, at) + block + html.slice(at);
  if (html !== orig) { writeFileSync(file, html); changed++; } else same++;
}
console.log(`Question links: ${changed} pages changed, ${same} up to date.`);
