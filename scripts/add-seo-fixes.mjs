#!/usr/bin/env node
// add-seo-fixes.mjs — page-level SEO fixes from the HeyCatch audit (2026-11-06). Runs in finish-pages.mjs
// before add-social-tags, so a regenerated page gets the same result. Idempotent.
//
//   node scripts/add-seo-fixes.mjs [--check]
//
// 1. data/seo-meta.json  {"/path/": {title, desc}}: titles kept to 30-60 characters as rendered and
//    descriptions to 110-160. Replaces <title>, meta description and the og/twitter copies that matched.
//    Generators keep their own templates; this file wins after them (same pattern as winter-titles.cjs).
// 2. <meta name="referrer" content="strict-origin-when-cross-origin"> on every page. GitHub Pages cannot
//    send headers, so CSP and frame-options are not set (a meta CSP would have to list every ad/analytics
//    host; frame-ancestors and X-Frame-Options do not work from a meta tag at all).
// 3. width and height on every local <img>, read from the image file. A zero-specificity
//    :where(img[width][height]){height:auto} rule keeps CSS-sized images in proportion.
// 4. data/article-dates.json {"/path/": {published, modified}} (first commit and last non-sweep commit
//    from git log): a visible "Published / Updated" line under the h1 when the page shows no date,
//    and an Article block on listed pages that have none. link-jsonld.mjs fills the Article dates.
// mountains/** is skipped (the Mountain session generates those pages).
import { readFileSync, writeFileSync, existsSync, openSync, readSync, closeSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');
const BASE = 'https://milecheckapp.com';
const META = JSON.parse(readFileSync(join(ROOT, 'data/seo-meta.json'), 'utf8'));
const DATES = JSON.parse(readFileSync(join(ROOT, 'data/article-dates.json'), 'utf8'));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const unesc = (s) => String(s).replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const IMG_CSS = '<style data-seo-img>:where(img[width][height]){height:auto}</style>';

function head(file, n = 65536) {
  const fd = openSync(file, 'r'); const b = Buffer.alloc(n); const len = readSync(fd, b, 0, n, 0); closeSync(fd); return b.subarray(0, len);
}
function imageSize(file) {
  const b = head(file);
  if (b[0] === 0x89 && b.toString('ascii', 1, 4) === 'PNG') return [b.readUInt32BE(16), b.readUInt32BE(20)];
  if (b.toString('ascii', 0, 3) === 'GIF') return [b.readUInt16LE(6), b.readUInt16LE(8)];
  if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
    const t = b.toString('ascii', 12, 16);
    if (t === 'VP8X') return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
    if (t === 'VP8 ') return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
    if (t === 'VP8L') { const v = b.readUInt32LE(21); return [1 + (v & 0x3fff), 1 + ((v >> 14) & 0x3fff)]; }
  }
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i < b.length - 9) {
      if (b[i] !== 0xff) { i++; continue; }
      const m = b[i + 1];
      if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
      i += 2 + b.readUInt16BE(i + 2);
    }
  }
  const s = b.toString('utf8');
  if (/<svg/i.test(s)) {
    const tag = s.match(/<svg[^>]*>/i)[0];
    const w = tag.match(/\swidth="([\d.]+)(px)?"/), h = tag.match(/\sheight="([\d.]+)(px)?"/);
    if (w && h) return [Math.round(+w[1]), Math.round(+h[1])];
    const vb = tag.match(/viewBox="[\d.\-]+[ ,]+[\d.\-]+[ ,]+([\d.]+)[ ,]+([\d.]+)"/);
    if (vb) return [Math.round(+vb[1]), Math.round(+vb[2])];
  }
  return null;
}
const fmt = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

const sitemap = readFileSync(join(ROOT, 'sitemap.xml'), 'utf8');
const paths = [...sitemap.matchAll(/<loc>https:\/\/milecheckapp\.com([^<]*)<\/loc>/g)].map((m) => decodeURIComponent(m[1]));
let changed = 0; const missingImg = new Set(); const badPages = new Set();
for (const p of paths) {
  if (p.startsWith('/mountains/')) continue;
  const rel = p.endsWith('/') ? `${p.slice(1)}index.html` : p.slice(1);
  const file = join(ROOT, rel);
  if (!existsSync(file)) continue;
  const src = readFileSync(file, 'utf8');
  let html = src;

  // 1. title + description
  const m = META[p];
  if (m && m.title) {
    const old = (html.match(/<title>([^<]*)<\/title>/) || [])[1];
    const t = esc(m.title);
    if (old !== undefined && old !== t) {
      html = html.replace(`<title>${old}</title>`, () => `<title>${t}</title>`);
      for (const a of ['property="og:title"', 'name="twitter:title"']) html = html.split(`${a} content="${old}"`).join(`${a} content="${t}"`);
    }
  }
  if (m && m.desc) {
    const d = esc(m.desc);
    const old = (html.match(/<meta\s+name="description"\s+content="([^"]*)"/) || [])[1];
    if (old === undefined) html = html.replace(/(<title>[^<]*<\/title>)/, (x) => `${x}\n  <meta name="description" content="${d}">`);
    else if (old !== d) {
      html = html.replace(/(<meta\s+name="description"\s+content=")[^"]*"/, (x, a) => `${a}${d}"`);
      for (const a of ['property="og:description"', 'name="twitter:description"']) html = html.split(`${a} content="${old}"`).join(`${a} content="${d}"`);
    }
  }

  // 2. referrer policy
  if (!/<meta\s+name="referrer"/.test(html) && /<head[^>]*>/.test(html)) {
    html = html.replace(/(<meta charset="[^"]*">)|(<head[^>]*>)/, (x) => `${x}\n  <meta name="referrer" content="strict-origin-when-cross-origin">`);
  }

  // 3. image dimensions
  let addedDims = false;
  // only markup outside <script> blocks; image tags built in JS strings are left alone
  html = html.split(/(<script\b[\s\S]*?<\/script>)/).map((part) => part.startsWith('<script') ? part : part.replace(/<img\b[^>]*>/g, (tag) => {
    if (/\swidth=/.test(tag) && /\sheight=/.test(tag)) return tag;
    const s = (tag.match(/\ssrc="([^"]+)"/) || [])[1];
    if (!s || /^(https?:)?\/\//.test(s) || s.startsWith('data:')) return tag;
    const clean = s.split(/[?#]/)[0];
    const f = clean.startsWith('/') ? join(ROOT, clean) : resolve(dirname(file), clean);
    if (!existsSync(f)) { missingImg.add(`${rel}: ${s}`); return tag; }
    const wh = imageSize(f);
    if (!wh || !wh[0] || !wh[1]) { missingImg.add(`${rel}: ${s} (size unreadable)`); return tag; }
    addedDims = true;
    const w0 = +((tag.match(/\swidth="(\d+)"/) || [])[1] || 0), h0 = +((tag.match(/\sheight="(\d+)"/) || [])[1] || 0);
    let [w, h] = wh; // keep a size the page already set and scale the other side to match
    if (w0) { h = Math.round((w0 * wh[1]) / wh[0]); w = w0; } else if (h0) { w = Math.round((h0 * wh[0]) / wh[1]); h = h0; }
    return tag.replace(/\s(width|height)="[^"]*"/g, '').replace(/^<img\b/, `<img width="${w}" height="${h}"`);
  })).join('');
  if (addedDims && !html.includes('data-seo-img') && html.includes('</head>')) html = html.replace('</head>', () => `${IMG_CSS}\n</head>`);

  // 4. dates
  const dt = DATES[p];
  const h1Count = (html.replace(/<script\b[\s\S]*?<\/script>/g, '').match(/<h1\b/g) || []).length;
  if (dt && h1Count > 1) badPages.add(rel); // two page bodies in one file: dates would land on the wrong one
  if (dt && h1Count === 1) {
    const ld = (html.match(/"@type":"(?:Article|NewsArticle|TechArticle|BlogPosting)"[^<]*/) || [''])[0];
    const pub = (ld.match(/"datePublished":"(\d{4}-\d{2}-\d{2})/) || [])[1] || dt.published;
    const mod = (ld.match(/"dateModified":"(\d{4}-\d{2}-\d{2})/) || [])[1] || dt.modified;
    const h1End = html.indexOf('</h1>');
    const after = h1End > -1 ? html.slice(h1End, h1End + 600) : '';
    // No Published line when the page already shows a dated byline (article-byline / 'by MileCheck · <date>'): the October report showed the date twice (Leah 2026-11-06).
    if (h1End > -1 && !html.includes('class="page-dates"') && !/article-meta|article-byline|by MileCheck &middot;|<time\b/.test(after)) {
      const line = `<p class="page-dates" style="font-size:.85em;opacity:.7;margin:.25em 0 1em">Published <time datetime="${pub}">${fmt(pub)}</time>${mod > pub ? ` · Updated <time datetime="${mod}">${fmt(mod)}</time>` : ''}</p>`;
      html = html.slice(0, h1End + 5) + `\n    ${line}` + html.slice(h1End + 5);
    }
    if (!/"@type":\s*"(Article|NewsArticle|TechArticle|BlogPosting)"/.test(html)) {
      const h1 = unesc(((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || '').replace(/<[^>]+>/g, '').trim());
      const canon = (html.match(/<link rel="canonical" href="([^"]+)"/) || [])[1] || `${BASE}${p}`;
      if (h1) {
        const a = { '@context': 'https://schema.org', '@type': 'Article', headline: h1.slice(0, 110), mainEntityOfPage: canon, datePublished: pub, dateModified: mod };
        html = html.replace('</head>', () => `<script type="application/ld+json">${JSON.stringify(a).replace(/<\//g, '<\\/')}</script>\n</head>`);
      }
    }
  }

  // 5. every page names the company in JSON-LD (link-jsonld.mjs turns this into an #org reference)
  if (p !== '/' && html.includes('</head>') && !/"@type":\s*"Organization"/.test(html)) {
    const o = { '@context': 'https://schema.org', '@type': 'Organization', '@id': `${BASE}/#org`, name: 'MileCheck', url: `${BASE}/` };
    html = html.replace('</head>', () => `<script type="application/ld+json">${JSON.stringify(o)}</script>\n</head>`);
  }

  if (html !== src) { changed++; if (!CHECK) writeFileSync(file, html); }
}
console.log(`${CHECK ? '[check] ' : ''}add-seo-fixes: ${changed} pages changed`);
if (badPages.size) console.log(`dates skipped, page has more than one h1: ${[...badPages].join(', ')}`);
if (missingImg.size) console.log(`images left without size (missing or remote-only):\n  ${[...missingImg].slice(0, 20).join('\n  ')}`);
