// Mountain Visibility app card on WA/OR pass and camera pages (Leah 10/26 via Planner).
// Sits right after the MileCheck app block (or the related links / h1). Tagged per page: ct= for App Store Connect, utm_campaign= for Play.
// Idempotent: strips its own card and re-adds.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const M = {
  rainier: { name: 'Mount Rainier', line: 'Is Mount Rainier visible right now? Mountain Visibility shows current visibility from Seattle and 9 other regions, updated every 10 minutes, plus clear windows over the next five days.' },
  hood: { name: 'Mount Hood', line: 'Is Mount Hood visible right now? Mountain Visibility shows current visibility from Portland and 4 other regions, updated every 10 minutes, plus clear windows over the next five days.' },
};
const pages = {
  rainier: ['cameras/washington', 'cameras/seattle', 'passes/snoqualmie', 'passes/stevens', 'passes/white', 'seasonal/chinook-pass', 'seasonal/cayuse-pass'],
  hood: ['cameras/portland', 'cameras/oregon', 'passes/mt-hood'],
};
const STRIP = /<!-- mountain-card:start -->[\s\S]*?<!-- mountain-card:end -->/g;
const btn = 'background:#0E1116;color:#fff;border-radius:8px;padding:11px 14px;font-size:14px;font-weight:600;text-decoration:none;min-height:44px;box-sizing:border-box;display:inline-flex;align-items:center';
const card = (m, slug) => `<!-- mountain-card:start --><div class="mc-mountain-card" style="display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;margin:0 0 16px;padding:12px 14px;border:1px solid #E4EAE6;border-radius:12px;background:#fff;font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif"><span style="flex:1 1 220px;font-size:14px;line-height:1.4;color:#2a333b">${M[m].line} <a href="/mountains/${m}/" target="_blank" rel="noopener" style="color:#0E1116;font-weight:600">See ${M[m].name} now</a></span><a href="https://apps.apple.com/app/apple-store/id6810003955?pt=128447811&amp;ct=mc-${slug}-mtn&amp;mt=8" target="_blank" rel="noopener" style="${btn}">App Store</a><a href="https://play.google.com/store/apps/details?id=app.milecheck.rainier&amp;referrer=utm_source%3Dmilecheck%26utm_medium%3Dweb%26utm_campaign%3Dmc-${slug}-mtn" target="_blank" rel="noopener" style="${btn}">Google Play</a></div><!-- mountain-card:end -->`;
let changed = 0;
for (const [m, list] of Object.entries(pages)) for (const p of list) {
  const f = `${p}/index.html`;
  if (!existsSync(f)) continue;
  const o = readFileSync(f, 'utf8');
  let s = o.replace(STRIP, '');
  let at = -1;
  for (const k of ['<!-- app-block:end -->', '<!-- toplinks:end -->', '</h1>']) { at = s.indexOf(k); if (at >= 0) { at += k.length; break; } }
  if (at < 0) continue;
  s = s.slice(0, at) + card(m, p.replace(/\//g, '-')) + s.slice(at);
  if (s !== o) { writeFileSync(f, s); changed++; }
}
console.log(`mountain card: ${changed} pages changed`);
