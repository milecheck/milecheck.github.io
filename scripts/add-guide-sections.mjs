// Long-form driver guide sections on the busiest short pages (planner 10/26: Raptive wants long-form content).
// Text lives in data/guide-sections.json ({ "page/path": "<h2>…" }). Placed just above the "Nearby on MileCheck" links.
// Idempotent: strips its own block and re-adds, so page generators can rewrite the rest of the page.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const sections = JSON.parse(readFileSync('data/guide-sections.json', 'utf8'));
const STRIP = /[ \t]*<!-- guide:start -->[\s\S]*?<!-- guide:end -->\n?/g;
const CSS = '<style>.mc-guide{max-width:760px;margin:32px auto;padding:0 16px;font-family:\'Inter\',-apple-system,BlinkMacSystemFont,sans-serif;color:#2a333b;font-size:16px;line-height:1.65}.mc-guide h2{font-size:22px;line-height:1.3;color:#0E1116;margin:28px 0 10px}.mc-guide h3{font-size:18px;color:#0E1116;margin:20px 0 8px}.mc-guide p{margin:0 0 14px}.mc-guide ul{margin:0 0 14px;padding-left:22px}.mc-guide li{margin:0 0 6px}.mc-guide a{color:#0B7A4B;text-decoration:underline}</style>';
let changed = 0;
for (const [p, html] of Object.entries(sections)) {
  const f = `${p}/index.html`;
  if (!existsSync(f)) { console.error('missing', f); continue; }
  const o = readFileSync(f, 'utf8');
  let s = o.replace(STRIP, '');
  let at = -1;
  for (const re of [/[ \t]*<!-- related:start -->/, /[ \t]*<!-- signup:start -->/, /[ \t]*<\/main>/, /[ \t]*<footer/]) { at = s.search(re); if (at >= 0) break; }
  if (at < 0) { console.error('no anchor', f); continue; }
  s = s.slice(0, at) + `<!-- guide:start -->${CSS}<section class="mc-guide">${html}</section><!-- guide:end -->\n` + s.slice(at);
  if (s !== o) { writeFileSync(f, s); changed++; }
}
console.log(`guide sections: ${changed} pages changed of ${Object.keys(sections).length}`);
