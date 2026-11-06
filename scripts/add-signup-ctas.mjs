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
// The link opens the page's one form in a small overlay and puts it back on close (Leah 2026-11-06: jumping to
// the bottom made readers miss the whole report). One form per page still holds: the embed node is MOVED, not copied.
const OVERLAY_JS = `(function(a){var b=document.querySelector('.mc-signup');if(!b){location.hash='subscribe';return}var i=b.querySelector('.mc-signup-inner')||b;var ph=document.createElement('div');i.parentNode.insertBefore(ph,i);var o=document.createElement('div');o.setAttribute('role','dialog');o.setAttribute('aria-modal','true');o.setAttribute('aria-label','Get the Highway Report by email');o.style.cssText='position:fixed;inset:0;z-index:10000;background:rgba(15,20,25,.55);display:flex;align-items:center;justify-content:center;padding:16px;';var c=document.createElement('div');c.style.cssText='background:#fff;border-radius:14px;max-width:520px;width:100%;max-height:90vh;overflow:auto;padding:28px 20px 22px;position:relative;box-shadow:0 20px 60px rgba(0,0,0,.3);';var x=document.createElement('button');x.type='button';x.setAttribute('aria-label','Close');x.textContent='\\u00d7';x.style.cssText='position:absolute;top:8px;right:10px;width:44px;height:44px;border:0;background:none;font-size:28px;line-height:1;cursor:pointer;color:#5A6670;';function close(){ph.parentNode.insertBefore(i,ph);ph.remove();o.remove();document.removeEventListener('keydown',k);a.focus()}function k(e){if(e.key==='Escape')close()}x.onclick=close;o.onclick=function(e){if(e.target===o)close()};document.addEventListener('keydown',k);c.appendChild(x);c.appendChild(i);o.appendChild(c);document.body.appendChild(o);var f=i.querySelector('input[type=email]');if(f)f.focus()})(this);return false;`;
const CTA = (extra = '') => `<!-- signupcta:start --><p class="mc-cta-line" style="margin:6px 0 26px;font-size:15px;${extra}"><a href="#subscribe" onclick="${OVERLAY_JS.replace(/"/g, '&quot;')}" style="color:#0f7a4f;font-weight:700;text-decoration:none;border-bottom:1px solid #9fd3b8;">&#9993; Get the MileCheck Highway Report by email, once a month &rarr;</a></p><!-- signupcta:end -->`;
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
