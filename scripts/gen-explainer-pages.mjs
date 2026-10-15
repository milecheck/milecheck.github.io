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
function page({ path, title, desc, h1, body, ld }) {
  const url = `https://milecheckapp.com${path}`;
  const html = headA +
    `  <title>${esc(title)}</title>\n  <meta name="description" content="${esc(desc)}">\n  <link rel="canonical" href="${url}">\n` +
    `  <meta property="og:title" content="${esc(h1)}">\n  <meta property="og:description" content="${esc(desc)}">\n  <meta property="og:url" content="${url}">\n  <meta property="og:type" content="article">\n` +
    headB.replace(/href="\.\.\//g, 'href="/') +
    `  <script type="application/ld+json">${JSON.stringify(ld)}</script>\n` +
    headC.replace(/href="\.\.\//g, 'href="/') +
    `  <article class="art">\n<div class="eyebrow">Highway basics</div>\n    <h1>${esc(h1)}</h1>\n${body}\n` + tail;
  const dir = path.replace(/^\//, '');
  mkdirSync(dir, { recursive: true });
  writeFileSync(dir + 'index.html', html.replace(/href="\.\.\//g, 'href="/').replace(/src="\.\.\//g, 'src="/'));
}
for (const a of list) {
  const html = readFileSync(`data/explainers/${a.slug}.html`, 'utf8');
  const lede = (html.match(/<p class="lede">([\s\S]*?)<\/p>/) || [, a.desc])[1].replace(/<[^>]+>/g, '');
  page({ path: `/${a.slug}/`, title: a.title, desc: a.desc, h1: a.h1, body: html,
    ld: { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: [{ '@type': 'Question', name: a.h1, acceptedAnswer: { '@type': 'Answer', text: lede } }] } });
}
console.log(`explainers: ${list.length} pages`);
