#!/usr/bin/env node
// add-signup-band.mjs — the Highway Report email signup (MailerLite form LjADY8) on the
// pages that carry the traffic, plus one offer everywhere (Leah, 2026-09-25: the form had
// 6,148 views and 1 signup, so the offer now links a real sample report).
// Run after the generators, alongside add-sponsor-slots.mjs. Idempotent.
//   - pages that already have a band: eyebrow/h2/sub rewritten to the current copy
//   - camera, pass, corridor and guide pages (English, from data/sponsor-pages.json): band
//     inserted above the footer between <!-- signup:start/end --> markers
//   - MailerLite loader added once per page if missing
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const EYEBROW = 'The Monthly Highway Report';
const H2 = 'Closures and crashes on US highways, once a month';
const SUB = `The month's numbers from DOT feeds in all 50 states and BC. <a href="/blog/labor-day-weekend-recap-2026.html">See a sample: the Labor Day weekend report</a>. No spam.`;
const FAMILIES = new Set(['cameras', 'pass', 'corridor', 'guide']);

const CSS = `.mc-signup{background:#F4F8F6;border-top:1px solid #E4EAE6;border-bottom:1px solid #E4EAE6;padding:44px 0;}
      .mc-signup .mc-signup-inner{max-width:560px;margin:0 auto;text-align:center;padding:0 20px;}
      .mc-signup .mc-eyebrow{font-family:'Inter',-apple-system,sans-serif;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#00A86B;margin:0 0 8px;}
      .mc-signup h2{font-family:'Inter',-apple-system,sans-serif;font-size:24px;font-weight:800;letter-spacing:-.01em;color:#0F1419;margin:0 0 8px;}
      .mc-signup .mc-sub{font-family:'Inter',-apple-system,sans-serif;font-size:15px;line-height:1.55;color:#5A6670;margin:0 auto 18px;max-width:44ch;}
      .mc-signup .mc-sub a{color:#00A86B;font-weight:700;}
      .mc-signup .ml-form-embedContent{display:none !important;}
      .mc-signup .ml-form-embedWrapper{background:transparent !important;box-shadow:none !important;max-width:440px;margin:0 auto;}
      .mc-signup input[type=email]{border-radius:8px !important;}
      .mc-signup button,.mc-signup .primary{background:#00C880 !important;border-radius:8px !important;font-weight:700 !important;}`;
const inner = `<p class="mc-eyebrow">${EYEBROW}</p>
      <h2>${H2}</h2>
      <p class="mc-sub">${SUB}</p>`;
const BAND = `<!-- signup:start -->
  <section class="mc-signup" id="subscribe">
    <style>
      ${CSS}
    </style>
    <div class="mc-signup-inner">
      ${inner}
      <div class="ml-embedded" data-form="LjADY8"></div>
    </div>
  </section>
<!-- signup:end -->
`;
const LOADER = `<!-- MailerLite Universal -->
  <script>
  (function(w,d,e,u,f,l,n){w[f]=w[f]||function(){(w[f].q=w[f].q||[]).push(arguments);},l=d.createElement(e),l.async=1,l.src=u,n=d.getElementsByTagName(e)[0],n.parentNode.insertBefore(l,n);})(window,document,'script','https://assets.mailerlite.com/js/universal.js','ml');
  ml('account', '2507175');
  </script>
  <!-- End MailerLite Universal -->
`;

const inv = JSON.parse(readFileSync('data/sponsor-pages.json', 'utf8')).pages;
const targets = new Set(inv.filter(p => FAMILIES.has(p.key.split(':')[0]))
  .map(p => p.path.replace(/^\//, '').replace(/\/$/, '/index.html'))
  .filter(f => !/^(es|fr|pa|pt)\//.test(f) && existsSync(f)));
// plus every page that already has a band (blog, homepage)
import { execSync } from 'node:child_process';
for (const f of execSync(`grep -rl 'data-form="LjADY8"' --include='*.html' . || true`).toString().split('\n').filter(Boolean))
  if (!/preview|design-options|v1-classic/.test(f)) targets.add(f.replace(/^\.\//, ''));

let updated = 0, added = 0;
for (const f of targets) {
  let s = readFileSync(f, 'utf8'); const o = s;
  s = s.replace(/<!-- signup:start -->[\s\S]*?<!-- signup:end -->\n?/, '');
  if (/data-form="LjADY8"/.test(s)) {
    s = s.replace(/<p class="mc-eyebrow">[\s\S]*?<\/p>\s*<h2>[\s\S]*?<\/h2>\s*<p class="mc-sub">[\s\S]*?<\/p>/, inner);
    if (!s.includes('.mc-signup .mc-sub a')) s = s.replace('.mc-signup .ml-form-embedContent{', '.mc-signup .mc-sub a{color:#00A86B;font-weight:700;}\n      .mc-signup .ml-form-embedContent{');
    if (s !== o) updated++;
  } else {
    const anchor = s.indexOf('<footer class="site-footer">');
    if (anchor < 0) { console.error('no footer:', f); continue; }
    const lineStart = s.lastIndexOf('\n', anchor) + 1;
    s = s.slice(0, lineStart) + '  ' + BAND + s.slice(lineStart);
    if (!o.includes('<!-- signup:start -->')) added++;
  }
  if (!s.includes('assets.mailerlite.com/js/universal.js')) s = s.replace('</body>', '  ' + LOADER + '</body>');
  if (s !== o) writeFileSync(f, s);
}
console.log(`signup band: ${updated} updated, ${added} added, ${targets.size} pages checked`);
