#!/usr/bin/env node
// Inserts a short in-article app note into four guide pages (2026-10-08). Copy written by ChatGPT.
//   node scripts/add-article-notes.mjs          # write
//   node scripts/add-article-notes.mjs --check
// Each note goes just before the first <h2> that follows the named section. Idempotent.
import { readFileSync, writeFileSync } from 'node:fs';
const CHECK = process.argv.includes('--check');
const NOTES = [
  { page: 'move-over-laws', after: 'If you need to report your location',
    text: 'Dispatch may ask for your mile marker before you can find the sign. MileCheck shows the marker on your phone.' },
  { page: 'what-is-my-mile-marker', after: 'How to find your mile marker right now',
    text: 'MileCheck shows your nearest mile marker without the sign-finding step. It works when your phone has no signal.' },
  { page: 'mile-markers-vs-exit-numbers', after: 'Which one should you use?',
    text: 'You can read your current mile marker on MileCheck instead of estimating from the last sign. It needs no subscription.' },
  { page: 'report-location', after: 'How to find your mile marker fast',
    text: 'MileCheck shows your nearest mile marker. It works when there is no signal.' },
];
const CSS = '.inote{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin:22px 0;padding:14px 18px;border-left:4px solid #0f7a4f;background:#f4fbf7;border-radius:0 12px 12px 0}.inote p{margin:0;flex:1 1 280px;font-size:15.5px;line-height:1.55;color:#2a333b}.inote a{flex:none;font-weight:700;font-size:14.5px;color:#0f7a4f;text-decoration:none;white-space:nowrap}.inote a:hover{text-decoration:underline}';
let done = 0;
for (const n of NOTES) {
  const p = `${n.page}/index.html`;
  let s = readFileSync(p, 'utf8');
  if (s.includes('<!-- inote:start -->')) { console.log('already', n.page); continue; }
  const m = s.match(new RegExp(`<h2[^>]*>\\s*${n.after.replace(/[?.*+^$()|[\]\\]/g, '\\$&')}\\s*</h2>`));
  if (!m) { console.log('NO ANCHOR', n.page); continue; }
  const from = m.index + m[0].length;
  const next = s.indexOf('<h2', from);
  if (next < 0) { console.log('NO NEXT H2', n.page); continue; }
  const block = `<!-- inote:start --><aside class="inote"><style>${CSS}</style><p>${n.text}</p><a href="/get/?from=note-${n.page}">Get the MileCheck app</a></aside><!-- inote:end -->\n    `;
  if (!CHECK) writeFileSync(p, s.slice(0, next) + block + s.slice(next));
  done++; console.log(CHECK ? 'would add' : 'added', n.page);
}
console.log(done, 'notes');
