// App download block on top landing pages (planner 10/15: send site traffic to the app, attributed per page).
// One compact block right after the title row (first phone screen), tagged per page for App Store Connect (ct=) and Play (utm_campaign=).
// Idempotent: strips its own block and re-adds. Held road-status pages are never in the list.
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
const pages = ['closures/index.html', 'maps/mile-markers/index.html', 'rest-areas/index.html', 'gas-prices/index.html', 'road-workers/index.html', 'ev-chargers/index.html', 'ev-charging-cost/index.html', 'when-is-gas-cheapest/index.html', 'which-states-pump-your-gas/index.html', 'how-to-pump-gas/index.html', ...['es', 'fr', 'pt', 'pa', 'zh', 'vi'].map(l => `${l}/how-to-pump-gas/index.html`), 'runaway-truck-ramp/index.html', 'what-is-my-mile-marker/index.html',
  ...readdirSync('cameras').filter(d => existsSync(`cameras/${d}/index.html`)).map(d => `cameras/${d}/index.html`),
  ...(existsSync('rest-areas') ? readdirSync('rest-areas').filter(d => existsSync(`rest-areas/${d}/index.html`)).map(d => `rest-areas/${d}/index.html`) : [])];
const STRIP = /<!-- app-block:start -->[\s\S]*?<!-- app-block:end -->/g;
const block = slug => `<!-- app-block:start --><div class="mc-app-block" style="display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;margin:12px 0 16px;padding:12px 14px;border:1px solid #E4EAE6;border-radius:12px;background:#fff;font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif"><span style="flex:1 1 220px;font-size:14px;line-height:1.4;color:#2a333b"><b style="color:#0E1116">Your mile marker on screen as you drive.</b> Plus live alerts and cameras in the MileCheck app.</span><a href="https://apps.apple.com/app/apple-store/id6759212851?pt=128447811&amp;ct=${slug}-block&amp;mt=8" target="_blank" rel="noopener" style="background:#0E1116;color:#fff;border-radius:8px;padding:9px 14px;font-size:14px;font-weight:600;text-decoration:none">App Store</a><a href="https://play.google.com/store/apps/details?id=app.milecheck.mobile&amp;referrer=utm_source%3Dsite%26utm_medium%3Dweb%26utm_campaign%3D${slug}-block" target="_blank" rel="noopener" style="background:#0E1116;color:#fff;border-radius:8px;padding:9px 14px;font-size:14px;font-weight:600;text-decoration:none">Google Play</a></div><!-- app-block:end -->`;
let changed = 0;
for (const f of pages) {
  if (!existsSync(f)) continue;
  const o = readFileSync(f, 'utf8');
  let s = o.replace(STRIP, '');
  const slug = f.replace(/\/index\.html$/, '').replace(/\//g, '-');
  // after the related-links chips if present, else right after the h1
  let at = s.indexOf('<!-- toplinks:end -->');
  if (at >= 0) at += '<!-- toplinks:end -->'.length; else { at = s.indexOf('</h1>'); if (at < 0) continue; at += 5; }
  s = s.slice(0, at) + block(slug) + s.slice(at);
  if (s !== o) { writeFileSync(f, s); changed++; }
}
console.log(`app block: ${changed} pages changed of ${pages.length}`);
