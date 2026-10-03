#!/usr/bin/env node
// add-signup-ctas.mjs — small "Get the Highway Report by email" links that jump to the page's
// one MailerLite form (#subscribe). Leah 10/1: "add email sign up in lots of places, higher up,
// don't spam it." One form per page (two copies of the embed can break MailerLite), so these
// are links, not more forms. Idempotent: everything sits between <!-- signupcta:start/end -->.
//   - every .mc-signup band gets id="subscribe"
//   - blog articles: one link under the opening paragraph
//   - homepage: none (the hero carries a report link; signup is the band below)
// Run after add-signup-band.mjs.
import fs from 'node:fs';
import path from 'node:path';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const CTA = (extra = '') => `<!-- signupcta:start --><p class="mc-cta-line" style="margin:6px 0 26px;font-size:15px;${extra}"><a href="#subscribe" style="color:#0f7a4f;font-weight:700;text-decoration:none;border-bottom:1px solid #9fd3b8;">&#9993; Get the MileCheck Highway Report by email, once a month &rarr;</a></p><!-- signupcta:end -->`;
const strip = (h) => h.replace(/\n[ \t]*<!-- signupcta:start -->[\s\S]*?<!-- signupcta:end -->/g, '');
let n = 0;
function fix(file, fn) {
  const p = path.join(ROOT, file); let h = fs.readFileSync(p, 'utf8'); const before = h;
  h = strip(h).replace(/<section class="mc-signup"(?![^>]*id=)/g, '<section class="mc-signup" id="subscribe"');
  h = fn(h); if (h !== before) { fs.writeFileSync(p, h); n++; }
}
for (const f of fs.readdirSync(path.join(ROOT, 'blog'))) {
  if (!f.endsWith('.html') || f === 'index.html') continue;
  fix(`blog/${f}`, (h) => (h.includes('class="mc-signup"') ? h.replace(/(<p class="article-lead">[\s\S]*?<\/p>)/, `$1\n      ${CTA()}`) : h));
}
for (const d of fs.readdirSync(path.join(ROOT, 'blog'), { withFileTypes: true }).filter((x) => x.isDirectory())) {
  for (const f of fs.readdirSync(path.join(ROOT, 'blog', d.name)).filter((x) => x.endsWith('.html'))) {
    fix(`blog/${d.name}/${f}`, (h) => (h.includes('class="mc-signup"') ? h.replace(/(<p class="article-lead">[\s\S]*?<\/p>)/, `$1\n      ${CTA()}`) : h));
  }
}
// index.html: the hero carries one report link instead (2026-10-03); signup lives in the band below.
fix('blog/index.html', (h) => h.replace(/(<!-- More articles — newest first -->)/, `${CTA('text-align:center;')}\n        $1`));
console.log(`signup CTAs: ${n} pages written`);
