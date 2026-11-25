// Camera popups: App Store / Google Play buttons above the DOT image (Leah 11/25, "do the easy fixes").
// 30 days to 11/24: 6,068 outbound clicks (mostly the popup image, which opens the DOT's own file)
// vs 736 store taps on the /cameras/ pages. Same button words as the page's app block. Idempotent.
import fs from 'fs';
import path from 'path';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const MARK = 'cc-app';
const row = (slug) => `<div class="${MARK}" style="display:flex;gap:8px;margin:6px 0"><a href="https://apps.apple.com/app/apple-store/id6759212851?pt=128447811&ct=cameras-${slug}-card&mt=8" target="_blank" rel="noopener" style="flex:1;background:#0E1116;color:#fff;border-radius:8px;min-height:44px;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;text-decoration:none">App Store</a><a href="https://play.google.com/store/apps/details?id=app.milecheck.mobile&referrer=utm_source%3Dsite%26utm_medium%3Dweb%26utm_campaign%3Dcameras-${slug}-card" target="_blank" rel="noopener" style="flex:1;background:#0E1116;color:#fff;border-radius:8px;min-height:44px;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;text-decoration:none">Google Play</a></div>`;
const NEEDLE = `<a href="'+c.img+'" target="_blank" rel="noopener" title="Open full image">`;
let changed = 0, skipped = 0;
for (const slug of fs.readdirSync(path.join(ROOT, 'cameras'))) {
  const f = path.join(ROOT, 'cameras', slug, 'index.html');
  if (!fs.existsSync(f)) continue;
  let s = fs.readFileSync(f, 'utf8');
  if (s.includes(`class="${MARK}"`) || !s.includes('function camCard')) { skipped++; continue; }
  const i = s.indexOf(NEEDLE, s.indexOf('function camCard'));
  if (i < 0) { skipped++; continue; }
  s = s.slice(0, i) + row(slug) + s.slice(i);
  fs.writeFileSync(f, s); changed++;
}
console.log(`add-camera-card-app: ${changed} changed, ${skipped} skipped`);
