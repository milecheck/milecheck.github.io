#!/usr/bin/env node
// Inserts a short in-article app note into four guide pages (2026-10-08). Copy written by ChatGPT.
//   node scripts/add-article-notes.mjs          # write
//   node scripts/add-article-notes.mjs --check
// Each note goes just before the first <h2> that follows the named section. Idempotent.
// 2026-10-08 pass 2: ChatGPT's picks replace the first notes, label is "Get the app", and a
// big .cta box sitting right before a note moves to after the FAQ (ChatGPT's call, cuts the repeat).
import { readFileSync, writeFileSync } from 'node:fs';
const CHECK = process.argv.includes('--check');
const NOTES = [
  { page: 'move-over-laws', after: 'If you need to report your location',
    text: 'You may need your mile marker before you pass another sign. MileCheck shows the nearest one on your phone.' },
  { page: 'what-is-my-mile-marker', after: 'How to find your mile marker right now',
    text: 'MileCheck shows your nearest mile marker between signs. The data is on your phone, so it works with no cell signal.' },
  { page: 'mile-markers-vs-exit-numbers', after: 'Which one should you use?',
    text: 'The last mile marker sign tells you where you were. MileCheck shows your nearest mile marker as you drive, with no subscription.' },
  { page: 'report-location', after: 'How to find your mile marker fast',
    text: 'MileCheck shows your nearest mile marker. You can read it with no cell signal.' },
];
const CSS = '.inote{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin:22px 0;padding:14px 18px;border-left:4px solid #0f7a4f;background:#f4fbf7;border-radius:0 12px 12px 0}.inote p{margin:0;flex:1 1 280px;font-size:15.5px;line-height:1.55;color:#2a333b}.inote a{flex:none;font-weight:700;font-size:14.5px;color:#0f7a4f;text-decoration:none;white-space:nowrap}.inote a:hover{text-decoration:underline}';
let done = 0;
for (const n of NOTES) {
  const p = `${n.page}/index.html`;
  let s = readFileSync(p, 'utf8');
  const before = s;
  s = s.replace(/<!-- inote:start -->[\s\S]*?<!-- inote:end -->\n\s*/, '');
  const cta = s.match(/\n\s*<div class="cta">[\s\S]*?<\/div>\s*<\/div>\n(?=\s*<h2)/);
  if (cta) {
    const next = s.indexOf('<h2', cta.index + cta[0].length);
    const prev = s.lastIndexOf('<h2', cta.index);
    const faq = s.match(/<div class="faq">[\s\S]*?<\/div>\n/);
    const sec = s.slice(prev, next);
    if (faq && faq.index > next && sec.includes(n.after)) {
      s = s.slice(0, cta.index) + '\n' + s.slice(cta.index + cta[0].length, faq.index + faq[0].length) + cta[0].replace(/^\n/, '\n') + s.slice(faq.index + faq[0].length);
      console.log('moved cta', n.page);
    }
  }
  const m = s.match(new RegExp(`<h2[^>]*>\\s*${n.after.replace(/[?.*+^$()|[\]\\]/g, '\\$&')}\\s*</h2>`));
  if (!m) { console.log('NO ANCHOR', n.page); continue; }
  const from = m.index + m[0].length;
  const next = s.indexOf('<h2', from);
  if (next < 0) { console.log('NO NEXT H2', n.page); continue; }
  const block = `<!-- inote:start --><aside class="inote"><style>${CSS}</style><p>${n.text}</p><a href="/get/?from=note-${n.page}">Get the app</a></aside><!-- inote:end -->\n    `;
  const out = s.slice(0, next) + block + s.slice(next);
  if (out === before) { console.log('unchanged', n.page); continue; }
  if (!CHECK) writeFileSync(p, out);
  done++; console.log(CHECK ? 'would write' : 'wrote', n.page);
}
console.log(done, 'notes');
