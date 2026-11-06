#!/usr/bin/env node
// gen-highway-report-pages.mjs — the monthly Highway Report: national page plus one page per jurisdiction,
// from data/road-report-<month>-<year>.json (built by the app repo's scripts/gen-road-report.mjs via road-report.yml).
// Adapted 2026-10-01 from gen-labor-day-recap-pages.mjs. Follows marketing/REPORT-VOICE.md in the app repo:
// label title, one method box, counts carry their scope, driver order (crashes, closures, border waits,
// bridges, fires), fires as acres + containment as of the last snapshot, state pages not dropdowns.
// No keyword-derived weather claims (the Oct 1 review showed "snow"/"fire" matches hit street names).
//
//   node scripts/gen-highway-report-pages.mjs 2026-09
//   then: add-sponsor-slots -> tag-store-links -> add-signup-band -> add-signup-ctas -> add-nav-search -> build-search-index -> build-sitemap -> link-jsonld (always LAST)
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MONTH = process.argv[2] || '2026-09';
const [YEAR, MM] = MONTH.split('-').map(Number);
const MONTH_NAME = new Date(Date.UTC(YEAR, MM - 1, 1)).toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' });
const MON_ABBR = ['Jan.', 'Feb.', 'March', 'April', 'May', 'June', 'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.'][MM - 1];
const LAST_DAY = new Date(Date.UTC(YEAR, MM, 0)).getUTCDate();
const KEY = `${MONTH_NAME.toLowerCase()}-${YEAR}`;
const D = JSON.parse(readFileSync(resolve(ROOT, `data/road-report-${KEY}.json`), 'utf8'));
const NATIONAL_FILE = `blog/road-report-${KEY}.html`;
const STATE_DIR_NAME = `highway-report-${KEY}-states`;
const OUT_DIR = resolve(ROOT, 'blog', STATE_DIR_NAME);
mkdirSync(OUT_DIR, { recursive: true });
const PUBLISHED = process.env.PUBLISHED || new Date().toISOString().slice(0, 10);
// UPDATED: the day a published report was corrected (2026-10-13: neighbor-state alerts removed,
// cross-state rankings replaced by each state against its own earlier months).
const UPDATED = process.env.UPDATED || null;
const updLong = UPDATED ? new Date(UPDATED + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : null;
const pubLong = new Date(PUBLISHED + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const H1 = `MileCheck Highway Report, ${MONTH_NAME} ${YEAR}`;
const WINDOW = `${MON_ABBR} 1 through ${MON_ABBR} ${LAST_DAY}`;
const NAMES = { AL:'Alabama', AK:'Alaska', AZ:'Arizona', AR:'Arkansas', CA:'California', CO:'Colorado', CT:'Connecticut', DE:'Delaware', FL:'Florida', GA:'Georgia', HI:'Hawaii', ID:'Idaho', IL:'Illinois', IN:'Indiana', IA:'Iowa', KS:'Kansas', KY:'Kentucky', LA:'Louisiana', ME:'Maine', MD:'Maryland', MA:'Massachusetts', MI:'Michigan', MN:'Minnesota', MS:'Mississippi', MO:'Missouri', MT:'Montana', NE:'Nebraska', NV:'Nevada', NH:'New Hampshire', NJ:'New Jersey', NM:'New Mexico', NY:'New York', NC:'North Carolina', ND:'North Dakota', OH:'Ohio', OK:'Oklahoma', OR:'Oregon', PA:'Pennsylvania', RI:'Rhode Island', SC:'South Carolina', SD:'South Dakota', TN:'Tennessee', TX:'Texas', UT:'Utah', VT:'Vermont', VA:'Virginia', WA:'Washington', WV:'West Virginia', WI:'Wisconsin', WY:'Wyoming', BC:'British Columbia', AB:'Alberta', MB:'Manitoba' };
const slug = (st) => NAMES[st].toLowerCase().replace(/\s+/g, '-');
const n = (x) => Number(x || 0).toLocaleString('en-US');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const title = (s) => { s = String(s).replace(/^\d+\s+/, '').trim(); return s === s.toUpperCase() ? s.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase()).replace(/\bMc([a-z])/g, (m, c) => 'Mc' + c.toUpperCase()) : s; };
const DOT_NAME = { BC: 'DriveBC', AB: '511 Alberta', MB: 'Manitoba 511' };
const CANADA = new Set(['BC', 'AB', 'MB']);
const isProv = (st) => CANADA.has(st);
// Known feed gaps, by report month. A state listed here is shown with a note and kept out of the
// month-to-month comparison (Leah + ChatGPT/Fable review, 2026-11-02).
const FEED_NOTES = {
  '2026-10': {
    NY: '511NY changed its data system at the end of September. MileCheck recorded 3,429 alerts in September and 590 in October. The drop reflects the feed change, so these counts do not show whether New York had fewer road incidents.',
    KY: 'MileCheck added the KYTC 24-hour Combined Incidents feed on Sept. 25. October is the first full month with it. MileCheck recorded 465 alerts in September and 1,056 in October. The jump reflects the added feed, not more incidents on Kentucky roads.',
    VA: 'Virginia alerts came back on Sept. 25 after VDOT moved its 511 service, with five data layers where there had been one. October is the first full month on the new feed. MileCheck recorded 682 alerts in September and 1,683 in October. The jump reflects the feed change, not more incidents on Virginia roads.',
  },
};
const feedNote = (st) => (FEED_NOTES[MONTH] || {})[st] || '';
const plural = (k, one, many) => (k === 1 ? one : many);

// Washington's feed labels every state route "SR n", interstates and US routes included. Show the signed name.
const WA_I = new Set(['5', '82', '90', '182', '205', '405', '705']), WA_US = new Set(['2', '12', '97', '101', '195', '395', '730']);
function route(st, r) {
  if (!r) return '';
  let m = String(r).match(/^SR\s*-?\s*(\d+[A-Z]?)$/i);
  if (m && st === 'WA') return WA_I.has(m[1]) ? `I-${m[1]}` : WA_US.has(m[1]) ? `US-${m[1]}` : `SR-${m[1]}`;
  if (m) return `SR-${m[1]}`;
  return String(r).replace(/\s+/g, ' ');
}
const list = (items) => `<ul class="article-list" style="margin-top:10px;margin-bottom:0;">${items.map((i) => `<li>${i}</li>`).join('')}</ul>`;
const box = (label, items) => `<div class="pull-stat"><strong>${label}</strong>${list(items)}</div>`;
const quote = (h) => { let t = String(h).replace(/\s+/g, ' ').replace(/^[-\u2013\u2014\s]+/, '').trim(); if (t.length >= 219) t = t.replace(/\s+\S*$/, '') + '\u2026'; return t; };
const dateLong = (iso) => { const [y, mo, d] = iso.split('-').map(Number); return new Date(Date.UTC(y, mo - 1, d)).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long', day: 'numeric', year: 'numeric' }); };
const fireLine = (f, st) => `${esc(title(f.name))}${f.county && !CANADA.has(st) ? ` (${esc(f.county)} County)` : ''}, ${n(f.acres)} acres, ${f.containedPct == null ? 'containment not published' : `${f.containedPct}% contained`}`;
const bridgeName = (id) => ({ 'WA-bridge-fremont': 'Fremont Bridge', 'WA-bridge-ballard': 'Ballard Bridge', 'WA-bridge-university': 'University Bridge', 'WA-bridge-montlake': 'Montlake Bridge', 'WA-bridge-south-park': 'South Park Bridge', 'WA-bridge-1st-ave-s': '1st Ave S Bridge', 'WA-bridge-spokane-st': 'Lower Spokane St Bridge' }[id] || id);
const hm = (m) => { m = Math.round(m); const h = Math.floor(m / 60), r = m % 60; return h ? `${h} hr${r ? ` ${r} min` : ''}` : `${r} min`; };
const STATE_TZ = { WA: 'America/Los_Angeles', CA: 'America/Los_Angeles', ID: 'America/Los_Angeles', MT: 'America/Denver', NM: 'America/Denver', AZ: 'America/Phoenix', ND: 'America/Chicago', MN: 'America/Chicago', MI: 'America/Detroit', NY: 'America/New_York', VT: 'America/New_York', NH: 'America/New_York', ME: 'America/New_York', TX: 'America/Chicago' };
const ELPASO_MTN = /El Paso|Fort Hancock|Marcelino Serna|Presidio/;
const dayOf = (iso, p) => { if (!iso) return null; const tz = (p && p.state === 'TX' && ELPASO_MTN.test(p.port)) ? 'America/Denver' : (p && STATE_TZ[p.state]) || 'UTC'; return new Date(iso.replace(/:00Z$/, ':00:00Z')).toLocaleDateString('en-US', { timeZone: tz, month: 'long', day: 'numeric' }); };
const utcToPacific = (iso) => { const d = new Date(iso.replace(/Z$/, ':00Z').replace(':00:00Z', ':00Z')); const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', month: 'numeric', day: 'numeric', hour: 'numeric' }).formatToParts(d).map((x) => [x.type, x.value])); return `${['Jan.', 'Feb.', 'March', 'April', 'May', 'June', 'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.'][p.month - 1]} ${p.day}, ${p.hour} ${p.dayPeriod}`; };
// Alerts the DOT posts for multi-year projects: describe what is actually restricted. Fallback = trimmed headline.
const LT_WHAT = {
  'WI I-535': 'southbound right shoulder closed at the state-line bridge',
  'OH I-75': 'ramp to Second Street (Exit 1A) closed',
  'VA I-81': 'work zone, mile markers 142.9 to 147.3, Roanoke County',
  'TX US-87': 'alternating lanes closed for construction',
  'WA SR-165': 'closed at the Carbon River/Fairfax Bridge to all traffic, until further notice',
  'NC US-17': 'one left lane closed intermittently, Martin County',
};
const ltLine = (p) => `<strong>${NAMES[p.state]}, ${esc(route(p.state, p.route || ''))}</strong> &mdash; ${esc(LT_WHAT[`${p.state} ${p.route}`] || quote(p.headline).slice(0, 110))}. Posted window ${dateLong(p.start)} to ${dateLong(p.end)}.`;
// ---------- shared page chrome ----------
// Line icons for the What's new and Keep up cards (24px grid, stroke drawn in the card's green).
const ICON_PATHS = {
  navigate: '<path d="M3 11 22 2l-9 19-2-8z"/>',
  camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3"/>',
  snowflake: '<path d="M12 2v20M4.9 4.9l14.2 14.2M2 12h20M4.9 19.1 19.1 4.9"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
  layers: '<path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/>',
  mountain: '<path d="m8 3 4 8 5-5 5 15H2z"/>',
  route: '<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  storm: '<path d="M6 16.3A5 5 0 1 1 9.6 7.1 7 7 0 0 1 18 11h.5a3.5 3.5 0 0 1 .5 7"/><path d="m13 11-3 5h4l-3 5"/>',
  rail: '<path d="M5 3l14 14M19 3 5 17M12 10v12"/>',
  signal: '<path d="M2 20h.01M7 20v-4M12 20v-8M17 20V8M22 4v16"/>',
  tv: '<rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>',
  truck: '<path d="M10 17h4V5H2v12h3M20 17h2v-3.3a1 1 0 0 0-.2-.6l-3.5-4.4A1 1 0 0 0 17.5 8H14"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
  code: '<path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
  dash: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h6M7 14h10"/>',
  heart: '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z"/>',
  instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>',
  facebook: '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
  x: '<path d="M4 4l16 16M20 4 4 20"/>',
  youtube: '<rect x="2" y="5" width="20" height="14" rx="4"/><path d="m10 9 5 3-5 3z"/>',
};
const svgIcon = (k, size = 22) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[k] || ''}</svg>`;
const iconTile = (w) => w.img ? `<img src="${esc(w.img)}" width="44" height="44" alt="" loading="lazy" style="flex:none;width:44px;height:44px;object-fit:contain;aspect-ratio:1/1;border-radius:10px;">` : `<span class="wn-ic">${svgIcon(w.icon)}</span>`;
// Call-to-action block at the end of the national report (Leah 2026-11-02): the app, the email report,
// sharing, the dash display, the other apps and social. Replaces the single "live version" box there.
function nextSteps(rel) {
  // List rows like What's new, not tiles (Leah 2026-11-02).
  const card = (title, text, actions, lead = '', big = false) => `<div class="wn-card${big ? ' wn-card--big' : ''}">${lead ? `<span style="flex:none;display:flex;gap:6px;">${lead}</span>` : ''}<div style="min-width:0;flex:1;"><span class="wn-t">${title}</span><p>${text}</p><span style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px;">${actions}</span></div></div>`;
  const btn = (href, label) => `<a href="${href}" style="display:inline-flex;align-items:center;gap:6px;min-height:44px;padding:0 14px;background:#0f7a4f;color:#fff;font-weight:700;font-size:14px;border-radius:8px;text-decoration:none;">${label}</a>`;
  // Share the app itself: system share sheet where it exists, else a text message with the /get/ link, plus Copy link (Leah 2026-11-06).
  const shareApp = `<button type="button" onclick="(async()=>{const u='https://milecheckapp.com/get/';try{if(navigator.share){await navigator.share({title:'MileCheck',text:'Mile markers and live road alerts',url:u});return}}catch(e){return}location.href='sms:?&body='+encodeURIComponent('MileCheck, mile markers and live road alerts: '+u)})()" style="min-height:44px;padding:0 14px;background:#fff;color:#0f7a4f;border:1.5px solid #0f7a4f;font-weight:700;font-size:14px;font-family:inherit;border-radius:8px;cursor:pointer;">Share the app</button><button type="button" onclick="(async()=>{const u='https://milecheckapp.com/get/';try{await navigator.clipboard.writeText(u);this.textContent='Link copied'}catch(e){prompt('Copy this link',u)}})()" style="min-height:44px;padding:0 14px;background:#fff;color:#0f7a4f;border:1.5px solid #0f7a4f;font-weight:700;font-size:14px;font-family:inherit;border-radius:8px;cursor:pointer;">Copy link</button>`;
  const share = `<button type="button" onclick="(async()=>{const u=location.href.split('#')[0];try{if(navigator.share){await navigator.share({title:document.title,url:u});return}}catch(e){return}try{await navigator.clipboard.writeText(u);this.textContent='Link copied'}catch(e){prompt('Copy this link',u)}})()" style="min-height:44px;padding:0 14px;background:#0f7a4f;color:#fff;font-weight:700;font-size:14px;font-family:inherit;border:0;border-radius:8px;cursor:pointer;">Share this report</button>`;
  return `<section style="margin:64px 0 48px;">
        <h2 class="rc" style="margin:0 0 14px;">Keep up with MileCheck</h2>
        <div class="wn-grid">
        ${card('Get the app, or pass it on', 'If the report is useful, we would be glad if you downloaded MileCheck or shared it with a friend who drives. Live state DOT feeds in all 50 states, British Columbia, Alberta and Manitoba, with your nearest mile marker.', btn('https://apps.apple.com/app/apple-store/id6759212851?pt=128447811&amp;ct=highway-report-cta&amp;mt=8', 'App Store') + btn('https://play.google.com/store/apps/details?id=app.milecheck.mobile&amp;referrer=utm_source%3Dmilecheckapp.com%26utm_medium%3Dweb%26utm_campaign%3Dhighway-report-cta', 'Google Play') + shareApp, `<img src="${rel}images/app-icons/milecheck.png" width="44" height="44" alt="" loading="lazy" style="width:44px;height:44px;border-radius:10px;">`)}
        ${card('Get the Highway Report by email', 'Once a month, plus special reports like Thanksgiving travel. No spam.', btn('#subscribe', 'Sign up').replace('<a ', '<a onclick="var c=document.querySelector(\'.mc-cta-line a\');if(c){c.click();return false}" '), `<span class="wn-ic">${svgIcon('mail')}</span>`, true)}
        ${card('Share this report', 'Send it to someone who drives for work so they can sign up for the Highway Report.', share, `<span class="wn-ic">${svgIcon('share')}</span>`)}
        ${card('New: Mountain Visibility', 'Is the mountain out right now? It covers Mount Rainier, Mount Hood, Mount Baker, Mount St. Helens, Denali, the Olympics, Mount Angeles and Mount Baldy. If you live near one of them it is worth having. $1.99 once, no subscription.', btn('https://apps.apple.com/app/apple-store/id6810003955?pt=128447811&amp;ct=highway-report-cta&amp;mt=8', 'App Store') + btn('https://play.google.com/store/apps/details?id=app.milecheck.rainier&amp;referrer=utm_source%3Dmilecheckapp.com%26utm_medium%3Dweb%26utm_campaign%3Dhighway-report-cta', 'Google Play'), `<a href="${rel}get/mountains/" aria-label="Mountain Visibility"><img src="${rel}images/app-icons/mountain-visibility.png" width="44" height="44" alt="Mountain Visibility app icon" loading="lazy" style="width:44px;height:44px;object-fit:contain;aspect-ratio:1/1;border-radius:10px;display:block;"></a>`)}
        ${card('Request a map or a feature', 'Want a map we do not have yet, or something in the app? Tell us. Every note gets read.', btn('mailto:feedback@milecheckapp.com?subject=Request%3A%20a%20map%20or%20a%20feature', 'Email feedback@milecheckapp.com'), `<span class="wn-ic">${svgIcon('mail')}</span>`)}
        ${card('Follow MileCheck', 'Maps, road news and Roy. Instagram is the fun one.', btn('https://www.instagram.com/milecheck_app', `${svgIcon('instagram', 18)}Instagram`) + btn('https://www.facebook.com/share/1FT9JtkH5D/', `${svgIcon('facebook', 18)}Facebook`) + btn('https://x.com/milecheckapp', `${svgIcon('x', 18)}X`) + btn('https://www.youtube.com/@milecheckapp', `${svgIcon('youtube', 18)}YouTube`), `<span class="wn-ic">${svgIcon('heart')}</span>`)}
        </div>
      </section>
`;
}
const newTab = (html) => html.replace(/<a\b(?![^>]*\btarget=)([^>]*?)\bhref="(?!#)([^"]*)"/g, '<a$1href="$2" target="_blank" rel="noopener"');
function page(opts) { return newTab(pageHtml(opts)); }
function pageHtml({ rel, canonical, pageTitle, description, h1, byline, body, jsonld, wide }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta name="apple-itunes-app" content="app-id=6759212851">
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(pageTitle)}</title>
  <meta name="description" content="${esc(description)}">

  <meta property="og:title" content="${esc(h1)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:image" content="https://milecheckapp.com/images/og-banner-light.png">
  <meta property="og:url" content="${canonical}">
  <meta property="og:type" content="article">

  <link rel="icon" type="image/png" href="${rel}images/favicon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&amp;family=JetBrains+Mono:wght@400;500;600;700&amp;display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${rel}style.css">
  <link rel="stylesheet" href="${rel}blog/blog.css">
  <!-- Cloudflare Web Analytics --><script type="module" src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token": "b22dd97eac65485dae41ab1e51f823e9"}'></script><!-- End Cloudflare Web Analytics -->
  <link rel="canonical" href="${canonical}">
  <script type="application/ld+json">${JSON.stringify(jsonld)}</script>
  <style>
    .article-wrap > p, .article-wrap p:not(.roy-card p):not(.roy-signoff p) { margin: 0 0 22px; }
    .article-byline{font-size:14px;color:#5C6670;margin:0 0 26px;}
    .method-box{font-size:14.5px;line-height:1.6;color:#3D454D;background:#F7F8F9;border:1px solid #E4E7EA;border-radius:9px;padding:14px 16px;margin:0 0 30px;}
    .method-box strong{color:#0F1419;}
    .article-note{font-size:14px;color:#5C6670;background:#F7F8F9;border-radius:9px;padding:12px 15px;margin:18px 0;}
    .article-list{margin:18px 0 !important;padding:0 0 0 20px !important;}
    .article-list li{margin:0 0 11px 0 !important;line-height:1.6;padding:0;}
    .pull-stat{margin:26px 0;padding:18px 20px;background:#FFF7ED;border-left:4px solid #F59E0B;border-radius:0 10px 10px 0;}
    .pull-stat strong{display:block;font-size:15px;color:#0F1419;}
    .pull-stat ul.article-list{margin:10px 0 0 !important;}
    .pull-stat ul.article-list li:last-child{margin-bottom:0 !important;}
    .pull-stat li strong{display:inline;}
    .headline-nums{display:grid;grid-template-columns:repeat(auto-fit,minmax(135px,1fr));gap:10px;margin:0 0 20px;}
    .headline-nums div{background:#F7F8F9;border:1px solid #E4E7EA;border-radius:10px;padding:14px 14px 12px;}
    .headline-nums b{display:block;font-family:'JetBrains Mono',monospace;font-size:24px;color:#0F1419;font-variant-numeric:tabular-nums;line-height:1.1;}
    .headline-nums span{display:block;font-size:12.5px;color:#5C6670;margin-top:6px;line-height:1.4;}
    .state-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px 14px;margin:14px 0 30px;padding:0;list-style:none;}
    .state-grid li{margin:0;padding:0;font-size:14.5px;line-height:1.5;}
    .state-grid a{color:#0F1419;text-decoration:none;border-bottom:1px solid #D5DADE;}
    .state-grid a:hover{border-bottom-color:#00A86B;}
    h2.rc{margin-top:44px;}
    .rc-fig{font-size:14px;color:#5C6670;margin:-12px 0 20px;}
    .article-wrap, body.hr-national .article-wrap{max-width:820px;}
    @media (max-width:600px){.article-wrap{padding:0 18px;}}
    .article-wrap img, .article-wrap video{max-width:100%;height:auto;}
    .article-wrap table{display:block;max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;}
    .rc-live{font-size:14px;margin:2px 0 14px !important;}
    .rc-live a{color:#0f7a4f;font-weight:600;}
    .bw-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:18px;}
    .bw-grid .bw-col strong{display:block;}
    .sec-row{display:flex;flex-direction:column;gap:18px;align-items:flex-start;margin:0 0 22px;}
    .sec-text{flex:1 1 auto;min-width:0;max-width:72ch;}
    .sec-fig{flex:1 1 auto;width:100%;max-width:100%;min-width:0;margin:0;}
    .sec-row--pair{flex-direction:row;flex-wrap:wrap;gap:22px;}
    .sec-row--pair .sec-fig{flex:1 1 280px;min-width:0;max-width:420px;}
    .hr-lede{font-size:18px;line-height:1.6;max-width:68ch;}
    .method-fold{margin:0 0 28px;}
    .method-fold summary{cursor:pointer;list-style:none;font-size:14.5px;font-weight:600;color:#0f7a4f;padding:10px 0;}
    .method-fold summary::-webkit-details-marker{display:none;}
    .method-fold summary::before{content:"\\25B8  ";}
    .method-fold[open] summary::before{content:"\\25BE  ";}
    .method-fold .method-box{margin:6px 0 0;}
    .hbar{display:block;height:6px;background:#00C880;border-radius:3px;margin:6px 0 2px;}
    .wn-grid{display:flex;flex-direction:column;margin:6px 0 26px;border-top:1px solid #E4E7EA;}
    .wn-card{display:flex;gap:14px;align-items:flex-start;padding:14px 2px;border-bottom:1px solid #E4E7EA;}
    .wn-card--big{padding:22px 2px;background:#F4F8F6;border-radius:10px;margin:6px 0;}
    .wn-card--big .wn-t{font-size:19px;}
    .wn-card--big p{font-size:15.5px;}
    .wn-ic{flex:none;width:44px;height:44px;border-radius:10px;background:#E8F3EC;color:#0f7a4f;display:flex;align-items:center;justify-content:center;}
    .article-wrap .wn-card a.wn-t,.article-wrap .wn-card span.wn-t{display:block;font-weight:700;font-size:15.5px;line-height:1.35;color:#0F1419;text-decoration:none;}
    .article-wrap .wn-card a.wn-t::after{content:" \\2192";color:#0f7a4f;}
    .article-wrap .wn-card p{margin:4px 0 0 !important;font-size:14px;line-height:1.5;color:#3D454D;}
    .wn-links{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;}
    .article-wrap .wn-links a{display:inline-flex;align-items:center;gap:6px;min-height:36px;padding:0 12px;border:1px solid #9fd3b8;border-radius:999px;color:#0f7a4f;font-weight:600;font-size:13.5px;text-decoration:none;}
    .road-fact{margin:40px 0 8px;padding:20px 22px;background:#F4F8F6;border:1px solid #DCE9E1;border-left:5px solid #00C880;border-radius:12px;}
    .road-fact .rf-k{font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#5C6670;margin:0 0 6px !important;}
    .road-fact .rf-h{font-size:21px;font-weight:800;line-height:1.25;color:#0F1419;margin:0 0 8px !important;}
    .road-fact .rf-t{font-size:16.5px;line-height:1.6;color:#0F1419;margin:0 0 12px !important;}
    .road-fact .rf-s{font-size:13.5px;color:#5C6670;margin:0 !important;display:flex;flex-wrap:wrap;align-items:center;column-gap:14px;}
    .article-wrap .road-fact .rf-s a{display:inline-flex;align-items:center;min-height:44px;}
    .article-wrap p a:not([style]), .article-wrap li a:not([style]){color:#0f7a4f;text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:3px;font-weight:600;}
    .article-wrap .state-grid li a{color:#0F1419;text-decoration:none;font-weight:400;}
  </style>
</head>

<body${wide ? ' class="hr-national"' : ''}>

  <header class="site-header">
    <div class="container header-inner">
      <a href="${rel}index.html" class="brand" style="display:inline-flex;align-items:center;gap:9px;"><img src="${rel}assets/app-icon-60.png" alt="" style="width:28px;height:28px;border-radius:7px;flex-shrink:0;">MileCheck</a>
      <button class="nav-toggle" aria-label="Menu"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0F1419" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg></button>
      <nav class="primary-nav">
        <a href="${rel}index.html">Home</a>
        <a href="${rel}maps/">Maps</a>
        <a href="${rel}cameras/">Cameras</a>
        <a href="${rel}states/">United States</a>
        <a href="${rel}canada/">Canada</a>
        <a href="${rel}index.html#story">Story</a>
        <a href="${rel}index.html#b2b">B2B</a>
        <a href="${rel}blog/" class="active">Blog</a>
        <a href="/get/" class="nav-cta">Get the app</a>
      </nav>
    </div>
  </header>

    <main class="article">
    <div class="article-wrap">
      <a href="${rel}blog/" class="article-back">All articles</a>

      <p class="article-eyebrow">MileCheck Highway Report</p>
      <h1 class="article-title">${esc(h1)}</h1>
      <p class="article-byline">${byline}</p>

${body}

${wide ? nextSteps(rel) : `      <div class="article-cta">
        <h3>The live version is in the app.</h3>
        <p>MileCheck shows state DOT feeds for crashes, closures, and delays in all 50 states, British Columbia, Alberta and Manitoba as they are published, with your nearest mile marker, or kilometre marker in Canada.</p>
        <a href="https://apps.apple.com/app/apple-store/id6759212851?pt=128447811&mt=8" class="btn btn-primary" target="_blank" rel="noopener">App Store</a>
        <a href="https://play.google.com/store/apps/details?id=app.milecheck.mobile" class="btn btn-primary" target="_blank" rel="noopener">Google Play</a>
      </div>`}

      <p class="article-note">Built from MileCheck's archive of state DOT road feeds. A new Highway Report comes out at the start of every month.</p>

    </div>
  </main>

  <section class="mc-signup" id="subscribe">
    <style>
      .mc-signup{background:#F4F8F6;border-top:1px solid #E4EAE6;border-bottom:1px solid #E4EAE6;padding:44px 0;}
      .mc-signup .mc-signup-inner{max-width:560px;margin:0 auto;text-align:center;padding:0 20px;}
      .mc-signup .mc-eyebrow{font-family:'Inter',-apple-system,sans-serif;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#00A86B;margin:0 0 8px;}
      .mc-signup h2{font-family:'Inter',-apple-system,sans-serif;font-size:24px;font-weight:800;letter-spacing:-.01em;color:#0F1419;margin:0 0 8px;}
      .mc-signup .mc-sub{font-family:'Inter',-apple-system,sans-serif;font-size:15px;line-height:1.55;color:#5A6670;margin:0 auto 18px;max-width:44ch;}
      .mc-signup .ml-form-embedContent{display:none !important;}
      .mc-signup .ml-form-embedWrapper{background:transparent !important;box-shadow:none !important;max-width:440px;margin:0 auto;}
      .mc-signup input[type=email]{border-radius:8px !important;}
      .mc-signup button,.mc-signup .primary{background:#00C880 !important;border-radius:8px !important;font-weight:700 !important;}
    </style>
    <div class="mc-signup-inner">
      <p class="mc-eyebrow">The Monthly Highway Report</p>
      <h2>Get your state's monthly road alert report</h2>
      <p class="mc-sub">Your state's reported closures, crashes and roadwork, once a month by email.${canonical && canonical.endsWith(`/blog/road-report-${KEY}.html`) ? '' : ` <a href="/blog/road-report-${KEY}.html">See the ${MONTH_NAME} report</a>.`} No spam.</p>
      <div class="ml-embedded" data-form="LjADY8"></div>
    </div>
  </section>

  <footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-col footer-col-brand">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;"><img src="${rel}assets/app-icon-60.png" alt="MileCheck" style="width:36px;height:36px;border-radius:9px;flex-shrink:0;"><p class="footer-brand" style="margin-bottom:0;">MileCheck</p></div>
          <p class="footer-tagline">Mile markers in all 50 US states.</p>
        </div>
        <div class="footer-col">
          <p class="footer-label">Get the app</p>
          <ul class="footer-list">
            <li><a href="https://apps.apple.com/app/apple-store/id6759212851?pt=128447811&mt=8" target="_blank" rel="noopener">iOS App Store</a></li>
            <li><a href="https://play.google.com/store/apps/details?id=app.milecheck.mobile" target="_blank" rel="noopener">Google Play</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <p class="footer-label">Help &amp; legal</p>
          <ul class="footer-list">
            <li><a href="mailto:feedback@milecheckapp.com">Send feedback</a></li>
            <li><a href="https://milecheckapp.com/milecheck-privacy/">Privacy policy</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <p class="footer-label">B2B Opportunities</p>
          <ul class="footer-list">
            <li><a href="${rel}index.html#b2b">Partner info</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <p class="footer-label">Follow</p>
          <ul class="footer-list">
            <li><a href="https://www.instagram.com/milecheck_app" target="_blank" rel="noopener">Instagram</a></li>
            <li><a href="https://www.facebook.com/share/1FT9JtkH5D/?mibextid=wwXIfr" target="_blank" rel="noopener">Facebook</a></li>
            <li><a href="https://www.linkedin.com/company/milecheck" target="_blank" rel="noopener">LinkedIn</a></li>
            <li><a href="https://www.reddit.com/user/MileCheckApp/" target="_blank" rel="noopener">Reddit</a></li>
          </ul>
        </div>
      </div>
      <p class="footer-fineprint">&copy; 2026 MileCheck LLC. Mile marker positions are approximate and may not reflect actual sign locations. Built for highway travelers &mdash; use responsibly.</p>
    </div>
  </footer>

  <script>(function(){var t=document.querySelector(".nav-toggle"),n=document.querySelector(".primary-nav");if(t&&n){t.addEventListener("click",function(){n.classList.toggle("open");});document.addEventListener("click",function(e){if(!e.target.closest(".header-inner"))n.classList.remove("open");});}})();</script>
  <!-- MailerLite Universal -->
  <script>
  (function(w,d,e,u,f,l,n){w[f]=w[f]||function(){(w[f].q=w[f].q||[]).push(arguments);},l=d.createElement(e),l.async=1,l.src=u,n=d.getElementsByTagName(e)[0],n.parentNode.insertBefore(l,n);})(window,document,'script','https://assets.mailerlite.com/js/universal.js','ml');
  ml('account', '2507175');
  </script>
  <!-- End MailerLite Universal -->
</body>
</html>
`;
}


// A "place" from a DOT feed is often a road name (101-Loop, Pacific Highway, I-70e). Keep real places only.
const realPlace = (p) => p && p.length <= 30 && !/\d/.test(p) && !/\b(highway|hwy|freeway|fwy|loop|interstate|route|pacific|parkway|pkwy|trail|expressway|turnpike|bypass|nb|sb|eb|wb|maint|bdy)\b/i.test(p);
// Feeds that name roads in all caps (Alaska's "GLENN HIGHWAY", New Jersey's "NJ TURNPIKE"): title-case the
// words, leave route tokens (I-95, SR-520) and short codes (GSP, NJ) alone. Labels with any lowercase pass through.
const pretty = (s) => /[a-z]/.test(s) ? s : s.split(' ').map((w) => (/^[A-Z]{3,}$/.test(w) && w !== 'GSP') ? w[0] + w.slice(1).toLowerCase() : w).join(' ');
const realRoute = (r) => r && !/^unknown$/i.test(String(r).trim());
// The method box folds shut under the numbers (editor's pass 2026-11-04): one tap to read how we count, no wall of text first.
const fold = (html, label = 'How we got these numbers') => `<details class="method-fold"><summary>${label}</summary>${html.replace('<strong>How we got these numbers:</strong> ', '')}</details>`;
// Recurring winter closures, researched with an official source per entry (data/seasonal-closures.json,
// refreshed each fall). "In effect" comes from the month's feed archive (D.seasonalClosures).
let SEASONAL = [];
try { SEASONAL = JSON.parse(readFileSync(resolve(ROOT, 'data/seasonal-closures.json'), 'utf8')).filter((e) => !/See prior entry/i.test(e.typicalClose || '')); } catch {}
const seasonalOf = (st) => SEASONAL.filter((e) => e.publicLine).filter((e) => String(e.state).split('/').includes(st));
const winterSection = (st, name) => {
  const live = ((D.seasonalClosures && D.seasonalClosures[st]) || []).filter((c) => !/construct|rebuild|bridge work|rest area/i.test(c.headline));
  const usual = seasonalOf(st);
  if (!live.length && !usual.length) return '';
  const out = [`<h2 class="rc">Winter closures</h2>`, liveLink('../../', 'chains/', 'Live chain and winter road map'), liveLink('../../', `seasonal/`, 'Roads that close for winter, by state')];
  { const sn = snap(st, 'seasonal', `Roads that close for winter in ${name}, as of ${dateLong(D.seasonalAsOf)}`, `Map of ${name} with its seasonal-closure roads drawn: red closed for the season, orange not closed yet`);
    if (sn) {
      const si = (SNAP_INDEX && SNAP_INDEX.seasonal && SNAP_INDEX.seasonal[st]) || { drawn: [], listed: [] };
      out.push(sn);
      out.push(`<p class="rc-fig"><span style="display:inline-block;width:26px;height:6px;background:#FF4D4D;border-radius:3px;vertical-align:middle;"></span> closed for the season &nbsp; <span style="display:inline-block;width:26px;height:6px;background:#FFB547;border-radius:3px;vertical-align:middle;"></span> usually closes for winter, not closed yet. Lines show the road around the seasonal stretch, from OpenStreetMap; the exact gates can differ.</p>`);
      if (si.listed.length) out.push(`<p class="rc-fig">Not drawn (no road line in our data yet): ${si.listed.map((r) => esc(r.name && r.name !== r.route ? `${r.route}, ${r.name}` : r.route) + (r.closed ? ' (closed)' : '')).join(' · ')}.</p>`);
    } }
  if (live.length) out.push(box(`On ${name}'s feed as of ${dateLong(D.seasonalAsOf).replace(/, \d{4}$/, '')}`, live.map((c) => `<strong>${esc(route(st, c.route || ''))}</strong> &mdash; &ldquo;${esc(quote(c.headline).slice(0, 200))}&rdquo;`)));
  if (usual.length) out.push(box('Roads that usually close for winter', usual.map((e) => `<strong>${esc(!e.name || e.name === e.route ? e.route : e.name.startsWith(e.route) ? e.name : `${e.route}, ${e.name}`)}</strong> &mdash; ${esc(e.publicLine || `${e.typicalClose}. ${e.typicalReopen}.`)} <a href="${esc(e.sourceUrl)}" rel="noopener" target="_blank">Source</a>${(e.extraSources || []).map((x) => ` &middot; <a href="${esc(x.url)}" rel="noopener" target="_blank">${esc(x.label)} source</a>`).join('')}`)));
  out.push(`<p class="rc-fig">Timing comes from each agency's own page. Exact dates depend on snow. We update this list each month through winter.</p>`);
  return out.join('\n');
};
// Total shown at the end of each month's drawbridge time-lapse (Pacific-time month; the tiles count by UTC day).
const BRIDGE_TL_TOTAL = { 'october-2026': 708 };
// ---------- data ----------
const T = D.byType, J = D.jurisdictionSummary;
const jOf = (st) => J.find((x) => x.state === st) || { state: st, crash: 0, closure: 0, construction: 0, total: 0, topRoutes: [] };
const crashStates = J.filter((x) => x.crash > 0).sort((a, b) => b.crash - a.crash);
const longTerm = D.longTermProjects.filter((p) => !(p.state === 'NY' && p.route === 'I-91')); // that record is Connecticut's I-91 riding NY's feed
const ltOf = (st) => longTerm.find((p) => p.state === st);
const fatal = (D.keywordSamples && D.keywordSamples.fatal) || [];
const FA = D.firesAsOf || null;            // { snapshot, byState: { WA: { active, acres, largest[] } } }
const BW = D.borderWaits || null;          // { all[], byAvg[], byMax[] }
const BR = D.bridges || null;              // [{ id, openings, medianMin, longestMin }]
const fireAsOf = FA ? `as of ${utcToPacific(FA.snapshot)} Pacific` : '';
const faTotals = FA ? Object.values(FA.byState).reduce((a, s) => ({ active: a.active + s.active, acres: a.acres + s.acres }), { active: 0, acres: 0 }) : null;
const bridgeTotal = BR ? BR.reduce((a, b) => a + b.openings, 0) : 0;
// State names link to that state's report page; border crossings open the live borders page filtered to them (Leah 2026-11-02).
const stLink = (st, rel = '') => `<a href="${rel}${STATE_DIR_NAME}/${slug(st)}.html">${NAMES[st]}</a>`;
const portLink = (p, rel) => `<a href="${rel}borders/?q=${encodeURIComponent(p.port)}">${portLabel(p)}</a>`;
const portLabel = (p) => `${esc(p.port)}${p.crossing && !/Passenger/i.test(p.crossing) ? ' / ' + esc(p.crossing) : ''}`;

const methodBox = (scope, extra) => `<div class="method-box"><strong>How we got these numbers:</strong> These are unique alerts published by ${scope}, from a daily copy taken ${WINDOW}, ${YEAR}. Each alert is counted once. An alert posted and removed between two daily copies is not counted. Not all feeds report the same data, so compare each place with its own earlier months.${extra || ''}</div>`;
// Alerts a feed carried for another state's road, removed by gen-road-report.mjs (D.droppedOffState).
const DROP = D.droppedOffState || [];
const dropTotal = DROP.reduce((a, d) => a + d.count, 0);
const listAnd = (a) => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
const dropFor = (st) => { const rows = DROP.filter((d) => d.state === st); const c = rows.reduce((a, d) => a + d.count, 0);
  const to = [...new Set(rows.sort((a, b) => b.count - a.count).map((d) => d.actual))].map((k) => NAMES[k] || k);
  return c ? { c, to } : null; };
const dropNote = (st) => { const d = dropFor(st); return d ? ` ${n(d.c)} ${plural(d.c, 'alert', 'alerts')} this feed carried for roads in ${listAnd(d.to)} ${plural(d.c, 'was', 'were')} removed. ${d.to.length === 1 ? `${NAMES[d.to[0]] || d.to[0]}'s own feed carries ${plural(d.c, 'it', 'them')}.` : "Those states' own feeds carry them."}` : ''; };
const dropNoteNational = () => { if (!dropTotal) return '';
  const byFeed = {}; DROP.forEach((d) => { byFeed[d.state] = (byFeed[d.state] || 0) + d.count; });
  const [top, topC] = Object.entries(byFeed).sort((a, b) => b[1] - a[1])[0];
  return ` ${n(dropTotal)} alerts a feed carried for another state's road were removed, ${n(topC)} of them from ${NAMES[top]}'s feed, which also carries ${listAnd(dropFor(top).to.slice(0, 2))} roads.`; };
// Each state against its own earlier months (D.stateHistory, built by gen-road-report.mjs).
const MONTH_LONG = (ym) => { const [y, m] = ym.split('-').map(Number); return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' }); };
const histOf = (st) => ((D.stateHistory && D.stateHistory[st]) || []);
const histLine = (h) => `<strong>${MONTH_LONG(h.month)}</strong> &mdash; ${n(h.total)} alerts: ${n(h.crash)} ${h.crash === 1 ? 'crash' : 'crashes'}, ${n(h.closure)} ${h.closure === 1 ? 'closure' : 'closures'}, ${n(h.construction)} roadwork`;
const extras = (opts) => [
  opts.fires && FA ? ` Fire figures are ${fireAsOf}.` : '',
  opts.border && BW ? ' Border waits are from U.S. Customs and Border Protection, saved every hour. Readings over five hours were treated as feed errors.' : '',
].join('');

// Optional hand-checked extras for the top tiles (data/road-report-<month>-<year>-extra.json).
let EX = null; try { EX = JSON.parse(readFileSync(resolve(ROOT, `data/road-report-${KEY}-extra.json`), 'utf8')); } catch {}
let RF = null; try { RF = JSON.parse(readFileSync(resolve(ROOT, 'data/road-facts-50-states.json'), 'utf8')); } catch {}
// ---------- national page ----------
const nums = [
  `<div><b>${n(T.crash)}</b><span>crash alerts</span></div>`,
  `<div><b>${n(T.closure)}</b><span>closure alerts</span></div>`,
  `<div><b>${n(T.construction)}</b><span>roadwork alerts</span></div>`,
  EX && EX.snowIceLower48 != null ? `<div><b>${n(EX.snowIceLower48)}</b><span>snow, ice and chain alerts in the lower 48</span></div>` : '',
].filter(Boolean).join('\n        ');

const national = [];
if (updLong) national.push(`<p class="rc-fig"><strong>Updated ${updLong}.</strong> Alerts a feed carried for another state's road were removed, and each state is now compared with its own earlier months instead of with other states.</p>`);
national.push(`<p class="article-lead">What road feeds published in ${MONTH_NAME} ${YEAR} across all 50 US states, British Columbia, Alberta and Manitoba. ${[BW && 'border waits', FA && 'wildfire records'].filter(Boolean).length ? `The report also covers ${[BW && 'border waits', FA && 'wildfire records'].filter(Boolean).join(', ').replace(/, ([^,]*)$/, ' and $1')}, from separate sources.` : ''}</p>`);
// The month's story in three or four sentences, written by hand (data/highway-report-lede-<month>.json, an array of
// paragraphs). Every number in it goes through check-numbers like the rest of the page. Skipped when the file is missing.
let LEDE = null; try { LEDE = JSON.parse(readFileSync(resolve(ROOT, `data/highway-report-lede-${MONTH}.json`), 'utf8')); } catch {}
if (Array.isArray(LEDE) && LEDE.length) national.push(LEDE.map((p) => `<p class="hr-lede">${esc(p)}</p>`).join('\n'));
// The state and province pickers sit right under the headline numbers; the old 'Find your state' link jumped
// most of the page (Leah 2026-11-06).
const pickerOrder = Object.keys(NAMES).sort((a, b) => NAMES[a].localeCompare(NAMES[b]));
const picker = (id, flag, label, codes) => `<div style="flex:1 1 240px;min-width:0;"><label for="${id}" style="display:block;font-weight:600;margin:0 0 6px;"><span aria-hidden="true">${flag}</span> ${label}</label><div style="display:flex;gap:8px;"><select id="${id}" onchange="var a=document.getElementById('${id}-go');a.href=this.value||'#';a.setAttribute('aria-disabled',this.value?'false':'true');a.style.opacity=this.value?'1':'.5'" style="flex:1 1 auto;min-width:0;min-height:44px;font-size:16px;padding:8px 10px;border:1px solid #C9CED3;border-radius:8px;background:#fff;"><option value="">Choose one</option>${codes.map((st) => `<option value="${STATE_DIR_NAME}/${slug(st)}.html">${NAMES[st]}</option>`).join('')}</select><a id="${id}-go" href="#" target="_blank" rel="noopener" aria-disabled="true" onclick="if(this.getAttribute('href')==='#'){return false}" style="display:inline-flex;align-items:center;min-height:44px;padding:0 16px;background:#0f7a4f;color:#fff;font-weight:700;border-radius:8px;text-decoration:none;opacity:.5;">Open</a></div></div>`;
const PICKERS = `<div id="by-state" style="display:flex;flex-wrap:wrap;gap:14px;margin:4px 0 30px;">${picker('state-jump', '\u{1F1FA}\u{1F1F8}', 'Pick your state', pickerOrder.filter((st) => !CANADA.has(st)))}${picker('province-jump', '\u{1F1E8}\u{1F1E6}', 'Pick your province', pickerOrder.filter((st) => CANADA.has(st)))}</div>`;
national.push(`<div class="headline-nums">\n        ${nums}\n      </div>`);
national.push(`<p style="margin:0 0 8px;">Every state and province has its own ${MONTH_NAME} report, with the routes that had the most crashes, closures and roadwork. Pick yours.</p>`);
national.push(PICKERS);
national.push(fold(methodBox('each state department of transportation (DOT) road feed, DriveBC, 511 Alberta and Manitoba 511', '')));
// Monthly maps (scripts/road-report-maps/build.sh in the app repo), each in its own section beside the text
// (Leah 2026-11-02: crashes under Crashes, closures under Closures, wildfires under Wildfires). Shown when the file exists.
const mapExists = (k) => existsSync(resolve(ROOT, `blog/highway-report-maps/${KEY}/${k === 'bridges' ? 'bridges.mp4' : `${k}.webp`}`));
// Cache tag from the file's mtime: a re-rendered map gets a new URL, so no reader sees last week's image (2026-11-06).
const ver = (rel) => { try { return `${rel}?v=${Math.floor(statSync(resolve(ROOT, rel)).mtimeMs / 1000).toString(36)}`; } catch { return rel; } };
const mapFig = (k, caption, alt) => !mapExists(k) ? '' : k === 'bridges'
  ? `<figure class="sec-fig"><figcaption style="font-size:16px;font-weight:700;color:#0f7a4f;line-height:1.35;margin:0 0 8px;">${caption}</figcaption><video src="${ver(`blog/highway-report-maps/${KEY}/bridges.mp4`).slice(5)}" poster="${ver(`blog/highway-report-maps/${KEY}/bridges-poster.webp`).slice(5)}" width="720" height="900" controls muted playsinline preload="none" style="width:100%;height:auto;border-radius:8px;display:block;background:#0b0e12;"></video></figure>`
  : `<figure class="sec-fig"><a href="${ver(`blog/highway-report-maps/${KEY}/${k}.webp`).slice(5)}"><img src="${ver(`blog/highway-report-maps/${KEY}/${k}.webp`).slice(5)}" width="${k === 'cameras' ? 900 : 1200}" height="${k === 'cameras' ? 1125 : 780}" loading="lazy" alt="${alt}" style="width:100%;height:auto;border-radius:8px;display:block;"></a><figcaption style="font-size:13px;color:#5C6670;margin-top:6px;">${caption}</figcaption></figure>`;
const alertAlt = (t) => `${t} posted on state and provincial road feeds in ${MONTH_NAME} ${YEAR}, one dot per alert`;
const DOTS = 'Each dot is one alert a feed posted. Blank areas can mean a feed does not post that kind of alert.';
const rowOpen = '<div class="sec-row"><div class="sec-text">';
// Per-state snapshot images (app repo scripts/road-report-maps/build-states.sh): crash dots, fires, seasonal roads
// (Leah 2026-11-06). Shown when the file exists; caption above the image like the videos.
let SNAP_INDEX = null; try { SNAP_INDEX = JSON.parse(readFileSync(resolve(ROOT, `blog/highway-report-maps/${KEY}/states/index.json`), 'utf8')); } catch {}
const snap = (st, layer, caption, alt) => {
  const f = `blog/highway-report-maps/${KEY}/states/${st}-${layer}.webp`;
  if (!existsSync(resolve(ROOT, f))) return '';
  return `<figure class="sec-fig" style="margin:0 0 22px;max-width:520px;"><figcaption style="font-size:16px;font-weight:700;color:#0f7a4f;line-height:1.35;margin:0 0 8px;">${caption}</figcaption><a href="../../${ver(f)}"><img src="../../${ver(f)}" width="720" height="720" loading="lazy" alt="${esc(alt)}" style="width:100%;height:auto;border-radius:8px;display:block;"></a></figure>`;
};
// Each section points at its live map (Leah 2026-11-06). Opens in a new tab like every other link on the page.
const liveLink = (rel, path, label) => `<p class="rc-live"><a href="${rel}${path}">${label} &rarr;</a></p>`;
const rowClose = (fig) => `</div>${fig}</div>`;
national.push('<!--sec:crash-->');
national.push(`<h2 class="rc">Crashes</h2>`);
national.push(liveLink('../', 'closures/', 'Live crash and closure alerts on the map'));
national.push(rowOpen);
national.push(`<p>Road feeds in ${crashStates.length} states and provinces posted ${n(T.crash)} crash alerts in ${MONTH_NAME}. Each agency decides which crashes appear on its feed. Your state's page shows which routes had the most crash alerts. </p>`);
// Feeds with no crash alerts this month, listed under the paragraph in italics. Not linked: nothing to click through to (Leah 2026-11-02).
{
  const none = J.filter((x) => !(x.crash > 0)).map((x) => x.state).sort((a, b) => NAMES[a].localeCompare(NAMES[b]));
  const hist = D.stateHistory || {};
  const never = none.filter((st) => (hist[st] || []).length >= 3 && (hist[st] || []).every((m) => !(m.crash > 0)));
  const months = never.length ? (hist[never[0]] || []).map((m) => m.month) : [];
  const since = months.length ? new Date(`${months[0]}-01T12:00:00Z`).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long' }) : '';
  const andList = (a) => a.length < 2 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`;
  if (none.length) national.push(`<p class="rc-fig" style="margin-top:-12px;"><em>${andList(none.map((st) => NAMES[st]))} posted no crash alerts in ${MONTH_NAME}.${never.length ? ` ${andList(never.map((st) => NAMES[st]))} have posted none in any month since our archive began in ${since}.` : ''}</em></p>`);
}
national.push(rowClose(mapFig('crash', `Crash alerts, ${MONTH_NAME}, one dot per alert.`, alertAlt('Crash alerts'))));
// Fatality mentions only on states whose feeds report them (CA Highway Patrol logs, TX). Leah 2026-11-02.
national.push('<!--sec:closure-->');
national.push(`<h2 class="rc">Closures and roadwork</h2>`);
national.push(liveLink('../', 'closures/', 'Live closure and roadwork alerts on the map'));
national.push(rowOpen);
national.push(`<p>Road feeds posted ${n(T.closure)} closure alerts and ${n(T.construction)} roadwork alerts in ${MONTH_NAME}. Your state's page shows which routes had the most. </p>`);
national.push(rowClose(mapFig('closure', `Road closure alerts, ${MONTH_NAME}, one dot per alert.`, alertAlt('Road closure alerts'))));
// The national month-by-month section was cut (Leah 2026-11-02); state pages keep their own history.
// Feed-change notes go on that state's own page only (Leah 2026-11-02).
if (BW && BW.byMax.length) {
  national.push('<!--sec:border-->');
  national.push(`<h2 class="rc">Border waits</h2>`);
  national.push(`<p>Waits to enter the United States in standard passenger lanes, ${MONTH_NAME}, from hourly U.S. Customs and Border Protection readings. Averages use every valid hourly reading. Dates are local to each crossing.</p>`);
  // Three columns (Leah 2026-11-06): into the US from Mexico, into the US from Canada, into Canada from the US.
  // CBP publishes US-bound lanes only, so the Canada-bound column says so. 'Lowest wait' is the lowest average
  // among crossings with at least 300 hourly readings; the feed carries no per-reading minimum.
  const bwCol = (title, rows) => {
    if (!rows.length) return `<div class="bw-col"><strong>${title}</strong><p class="rc-fig" style="margin:8px 0 0;">No data. The feed we read publishes waits into the United States only.</p></div>`;
    const hi = [...rows].sort((x, y) => y.maxMin - x.maxMin || y.avgMin - x.avgMin)[0];
    const lowPool = rows.filter((p) => (p.readings || 0) >= 300);
    const lo = lowPool.length ? [...lowPool].sort((x, y) => x.avgMin - y.avgMin || x.maxMin - y.maxMin)[0] : null;
    return `<div class="bw-col"><strong>${title}</strong><ul class="article-list" style="margin:8px 0 0;"><li>Highest single wait: <strong>${portLink(hi, '../')}</strong>${hi.state ? ` (${stLink(hi.state)})` : ''}, ${hm(hi.maxMin)}, ${dayOf(hi.maxAt, hi)}</li>${lo ? `<li>Lowest wait: <strong>${portLink(lo, '../')}</strong>${lo.state ? ` (${stLink(lo.state)})` : ''}, ${hm(lo.avgMin)} on average over ${n(lo.readings)} hourly readings</li>` : '<li>Lowest wait: no crossing had 300 readings</li>'}</ul></div>`;
  };
  national.push(`<div class="pull-stat bw-grid">${bwCol('Into the US from Mexico', BW.all.filter((p) => /Mexic/i.test(p.border || '')))}${bwCol('Into the US from Canada', BW.all.filter((p) => /Canad/i.test(p.border || '')))}${bwCol('Into Canada from the US', [])}</div>`);
  national.push(box('Longest average wait', BW.byAvg.filter((p) => (p.readings || 0) >= 300).slice(0, 6).map((p) => `<strong>${portLink(p, '../')}</strong>${p.state ? ` (${stLink(p.state)})` : ''} &mdash; ${hm(p.avgMin)} average over ${n(p.readings)} hourly readings`)));
  national.push(`<p>Live waits are at <a href="../borders/">milecheckapp.com/borders</a>.</p>`);
}
// Seattle drawbridges live on the Washington page only, time-lapse included (Leah 2026-11-02, 2026-11-06). The national page shows the camera map.
if (mapExists('cameras')) {
  national.push('<!--sec:cameras-->');
  national.push(`<h2 class="rc">Traffic cameras</h2>`);
  national.push(liveLink('../', 'cameras/', 'Live traffic cameras'));
  national.push(`<div class="sec-row sec-row--pair">${mapFig('cameras', `Every DOT camera on MileCheck as ${MONTH_NAME} closed, one dot per camera.`, 'Every DOT camera on MileCheck, one dot per camera')}</div>`);
}
if (FA) {
  const fireStates = Object.entries(FA.byState).sort((a, b) => b[1].acres - a[1].acres);
  national.push('<!--sec:fire-->');
  national.push(`<h2 class="rc">Wildfires</h2>`);
  national.push(liveLink('../', 'fire/', 'Live wildfire map'));
  national.push(rowOpen);
  national.push(`<p>The national wildfire feed (NIFC, plus the BC Wildfire Service) listed ${n(faTotals.active)} fire records ${fireAsOf} in the states and provinces we track, after prescribed burns were removed.${EX && EX.fires1000Plus != null ? ` ${n(EX.firesUnderOneAcre)} of them were under an acre. ${n(EX.fires1000Plus)} were 1,000 acres or more, and ${n(EX.fires1000PlusNotContained)} of those were not fully contained.` : ' Many are mostly or fully contained.'}</p>`);
  national.push(rowClose(mapFig('fires', `Wildfires on the national feed, ${fireAsOf}. Dot size shows acres.`, 'Wildfires on the national feed, one dot per fire, sized by acres')));
  // Top three shown, the rest behind a dropdown (Leah 2026-11-02: the top three were each over 100,000 acres).
  const bigFires = fireStates.flatMap(([st, s]) => s.largest.filter((f) => Number(f.acres) >= 50).map((f) => ({ st, f }))).sort((x, y) => (y.f.acres || 0) - (x.f.acres || 0)).slice(0, 12).map(({ st, f }) => `<strong>${stLink(st)}</strong> &mdash; ${fireLine(f, st)}`);
  national.push(`<div class="pull-stat"><strong>Largest fires, ${fireAsOf}</strong>${list(bigFires.slice(0, 3))}${bigFires.length > 3 ? `<details style="margin-top:6px;"><summary style="cursor:pointer;font-weight:600;color:#0f7a4f;padding:10px 0;">Show the next ${bigFires.length - 3}</summary>${list(bigFires.slice(3))}</details>` : ''}</div>`);
  national.push(`<p>Thank you to the firefighters and crews who worked these fires all season.</p>`);
  national.push(`<p>Live fire perimeters and the closures near them are at <a href="../fire/">milecheckapp.com/fire</a>.</p>`);
}
{
  const wst = [...new Set(SEASONAL.flatMap((e) => String(e.state).split('/')))].filter((k) => NAMES[k]).sort((x, y) => NAMES[x].localeCompare(NAMES[y]));
  if (wst.length) {
    national.push('<!--sec:winter-->');
    national.push(`<h2 class="rc">Winter closures</h2>`);
    national.push(liveLink('../', 'chains/', 'Live chain and winter road map') + liveLink('../', 'seasonal/', 'Roads that close for winter, by state'));
    national.push(rowOpen);
    national.push(`<p>Some mountain roads close every winter. These are the ones on our list. Tap a state for each road's usual closing and reopening times and the agency source. We update the list each month through winter.</p>`);
    national.push(rowClose(`<div class="sec-row sec-row--pair" style="margin:0;">${mapFig('snow', `Snow, ice and chain alerts, ${MONTH_NAME}. ${DOTS}`, alertAlt('Snow, ice and chain alerts'))}${mapFig('plows', `Where snowplows reported, ${MONTH_NAME}.`, 'Where snowplows reported, one dot per reported position')}</div>`));
    const roadName = (e) => esc(String(e.name).replace(/\s*\(.*?\)\s*/g, ' ').replace(/ closure$/i, '').trim());
    national.push(box('Roads that usually close for winter', wst.map((k) => {
      const roads = [...new Set(SEASONAL.filter((e) => e.publicLine && String(e.state).split('/').includes(k)).map(roadName))];
      return `<a href="${STATE_DIR_NAME}/${slug(k)}.html">${NAMES[k]}</a> &mdash; ${roads.join(' &middot; ')}`;
    })));
  }
}
{
  // Section order (editor's pass 2026-11-04): the season first, then the record. The blocks above are built in their
  // old order and moved here by marker, so each block's own code stays where it was.
  const first = national.indexOf('<!--sec:crash-->');
  const head = national.slice(0, first), secs = {}; let cur = null;
  for (const p of national.slice(first)) { const m = /^<!--sec:(\w+)-->$/.exec(p); if (m) { cur = m[1]; secs[cur] = []; } else if (cur) secs[cur].push(p); }
  national.length = 0; national.push(...head);
  for (const k of ['fire', 'winter', 'crash', 'closure', 'border', 'cameras']) if (secs[k]) national.push(...secs[k]);
}
// The state and province pickers moved up under the headline numbers (Leah 2026-11-06).

// "What's new at MileCheck" (Leah: on every report, at the end). One file per month, written by hand
// from that month's git log; only shipped, live things.
try {
  const WN = JSON.parse(readFileSync(resolve(ROOT, `data/highway-report-whats-new-${MONTH}.json`), 'utf8'));
  national.push(`<h2 class="rc">What's new at MileCheck</h2>`);
  const li = (w) => `<li>${w.href ? `<a href="${esc(w.href)}">${esc(w.text)}</a>` : esc(w.text)}${(w.links || []).map((l) => ` <a href="${esc(l.href)}">${esc(l.text)}</a>`).join(' &middot;')}</li>`;
  // The first two groups (the lead item and "In the app") show in full; the rest fold under one line, so the
  // report page stays a report and not a changelog (editor's pass 2026-11-04).
  const natMain = national, more = [];
  for (const [gi, g] of WN.entries()) {
    const national = natMain; // every group open, no fold (Leah 2026-11-06)
    if (g.items || g.intro) {
      national.push(`<h3 style="font-size:17px;margin:22px 0 4px;">${esc(g.heading)}</h3>`);
      // One image beside the text and the button (Leah 2026-11-02).
      if (g.intro || g.cta) {
        const im = (g.images || [])[0];
        national.push(`<div style="display:flex;flex-wrap:wrap;gap:20px;align-items:center;margin:4px 0 20px;">${im ? `<figure style="margin:0;flex:0 1 300px;min-width:220px;"><img src="${esc(im.src)}" width="${im.width}" height="${im.height}" loading="lazy" alt="${esc(im.alt)}" style="width:100%;height:auto;border-radius:10px;display:block;"><figcaption style="font-size:13px;color:#5C6670;margin-top:6px;">${esc(im.caption)}</figcaption></figure>` : ''}<div style="flex:1 1 320px;min-width:0;">${g.intro ? `<p>${esc(g.intro)}</p>` : ''}${g.cta ? `<p>${esc(g.cta.text)}</p><p style="margin:0;"><a href="${esc(g.cta.href)}" style="display:inline-block;background:#0f7a4f;color:#fff;font-weight:700;padding:11px 18px;border-radius:8px;text-decoration:none;">${esc(g.cta.linkText)} &rarr;</a></p>` : ''}</div></div>`);
      }
      // Cards with an icon, a short title and the line under it (Leah 2026-11-02: no long underlined sentences).
      if (g.items) national.push(`<div class="wn-grid">${g.items.map((w) => `<div class="wn-card">${iconTile(w)}<div style="min-width:0;">${w.href ? `<a class="wn-t" href="${esc(w.href)}">${esc(w.title || '')}</a>` : `<span class="wn-t">${esc(w.title || '')}</span>`}<p>${w.textHtml || esc(w.text)}</p>${(w.links || []).length ? `<span class="wn-links">${w.links.map((l) => `<a href="${esc(l.href)}">${esc(l.text)}</a>`).join('')}</span>` : ''}</div></div>`).join('')}</div>`);
    }
    else national.push(`<ul class="article-list">${li(g)}</ul>`);
  }
  void more;
} catch {}

const NAT_DESC = `${n(D.totalUniqueEvents)} unique alerts published by US state and Canadian provincial road feeds in ${MONTH_NAME} ${YEAR}: ${n(T.crash)} crash, ${n(T.closure)} closure and ${n(T.construction)} roadwork alerts, with a page for each state.`;
const natCanon = `https://milecheckapp.com/${NATIONAL_FILE}`;
writeFileSync(resolve(ROOT, NATIONAL_FILE), page({
  wide: true,
  rel: '../', canonical: natCanon, pageTitle: H1, description: NAT_DESC, h1: H1,
  byline: `by MileCheck &middot; ${pubLong}`,
  body: national.map((p) => '      ' + p).join('\n\n'),
  jsonld: { '@context': 'https://schema.org', '@type': 'NewsArticle', headline: H1, datePublished: PUBLISHED, dateModified: UPDATED || PUBLISHED, author: { '@type': 'Organization', name: 'MileCheck' }, publisher: { '@type': 'Organization', name: 'MileCheck', url: 'https://milecheckapp.com' }, mainEntityOfPage: natCanon, description: NAT_DESC },
}));

// ---------- state pages ----------
let written = 0;
for (const st of Object.keys(NAMES)) {
  const S = jOf(st), name = NAMES[st];
  const feed = DOT_NAME[st] ? `the ${DOT_NAME[st]} feed` : `${name}'s department of transportation (DOT) feed`;
  const fire = FA && FA.byState[st];
  const ports = BW ? BW.all.filter((p) => p.state === st).sort((a, b) => b.maxMin - a.maxMin || b.avgMin - a.avgMin).slice(0, 6) : [];
  const lt = ltOf(st);
  const parts = [];
  // One comparing sentence up top, this state against its own last full month only (editor's pass 2026-11-04).
  const hh = histOf(st), hc = hh.find((x) => x.month === MONTH), hpv = [...hh].reverse().find((x) => x.comparable && x.month < MONTH);
  const trend = hc && hc.comparable && hpv && !feedNote(st) ? ` ${n(hc.total)} alerts in all, ${hc.total === hpv.total ? 'the same as' : hc.total > hpv.total ? 'up from' : 'down from'} ${n(hpv.total)} in ${MONTH_LONG(hpv.month)}.` : '';
  parts.push(`<p class="article-lead">What ${feed} showed in ${MONTH_NAME} ${YEAR}.${trend} Part of the <a href="../road-report-${KEY}.html">national ${H1}</a>.</p>`);
  if (updLong && dropFor(st)) parts.push(`<p class="rc-fig"><strong>Updated ${updLong}.</strong> Alerts this feed carried for another state's road were removed.</p>`);
  const mb = fold(methodBox(DOT_NAME[st] ? `the ${DOT_NAME[st]} feed` : `${name}'s department of transportation (DOT) feed`, dropNote(st) + extras({ fires: !!fire, border: ports.length > 0 })));
  if (feedNote(st)) parts.push(`<p class="rc-fig"><strong>Feed change.</strong> ${feedNote(st)}</p>`);
  const sn = [];
  if (S.crash > 0) sn.push(`<div><b>${n(S.crash)}</b><span>crash alerts in ${MONTH_NAME}</span></div>`);
  sn.push(`<div><b>${n(S.closure)}</b><span>closure alerts</span></div>`);
  sn.push(`<div><b>${n(S.construction)}</b><span>roadwork alerts</span></div>`);
  if (fire) sn.push(`<div><b>${n(fire.active)}</b><span>${plural(fire.active, 'wildfire record', 'wildfire records')}, ${fireAsOf}</span></div>`);
  if (st === 'WA' && BR) sn.push(`<div><b>${n(bridgeTotal)}</b><span>Seattle drawbridge openings</span></div>`);
  parts.push(`<div class="headline-nums">${sn.join('')}</div>`);
  parts.push(mb);
  if (S.total === 0) {
    parts.push(`<h2 class="rc">Crashes, closures and roadwork</h2><p>${name}'s feed returned no records in ${MONTH_NAME}, so this page cannot say what was on the roads.</p>`);
  } else {
    parts.push(`<h2 class="rc">Crashes</h2>`);
    parts.push(liveLink('../../', 'closures/', 'Live crash and closure alerts on the map'));
    parts.push(snap(st, 'crash', `Crash alerts in ${name}, ${MONTH_NAME}, one dot per alert`, `Map of ${name} with one dot per published crash alert in ${MONTH_NAME} ${YEAR}`));
    parts.push(S.crash > 0 ? `<p>${name}'s road feed carried ${n(S.crash)} crash ${plural(S.crash, 'alert', 'alerts')} in ${MONTH_NAME}.</p>` : `<p>No crash alerts were on ${name}'s feed in ${MONTH_NAME}. Not every agency publishes crash reports.</p>`);
    const hs = D.crashHotspots && D.crashHotspots[st];
    if (hs && hs.routes.filter(([r]) => realRoute(r)).length) parts.push(box('Routes with the most crash alerts', hs.routes.filter(([r]) => realRoute(r)).map(([r, c]) => `<strong>${esc(pretty(route(st, r)))}</strong> &mdash; ${n(c)}`)));
    // Oregon's feed puts ODOT highway names (Pacific, Columbia River, Old Oregon Trail) in the place field, not areas.
    const hp = hs && st !== 'OR' ? hs.places.filter((q) => realPlace(q.place)) : [];
    if (hp.length) parts.push(box(st === 'CA' ? 'Highway Patrol dispatch areas named in two or more crash alerts' : 'Areas and routes named in two or more crash alerts', hp.map((p) => `<strong>${esc(title(p.place))}</strong>${p.route ? ` (${esc(route(st, p.route))})` : ''} &mdash; ${n(p.crashes)}`)));
    const fs = fatal.filter((f) => f.state === st);
    if (fs.length && ['CA', 'TX'].includes(st)) parts.push(box('Crash alerts that mentioned a fatality', fs.map((f) => `<strong>${esc(route(st, f.route || ''))}</strong> &mdash; ${dateLong(f.date.slice(0, 10)).replace(/, \d{4}$/, '')}`)));
    parts.push(`<h2 class="rc">Closures and roadwork</h2>`);
    parts.push(liveLink('../../', 'closures/', 'Live closure and roadwork alerts on the map'));
    parts.push(`<p>${n(S.closure)} ${S.closure === 1 ? 'closure' : 'closures'} and ${n(S.construction)} roadwork ${S.construction === 1 ? 'record' : 'records'} were on ${name}'s feed in ${MONTH_NAME}, out of ${n(S.total)} alerts of all types.</p>`);
    const rc = (S.routeCounts || []).filter(([r]) => r);
    if (rc.filter(([r]) => realRoute(r)).length) parts.push(box(`Routes with the most alerts in ${name}`, rc.filter(([r]) => realRoute(r)).map(([r, c]) => `<strong>${esc(pretty(route(st, r)))}</strong> &mdash; ${n(c)}`)));
    else if (S.topRoutes && S.topRoutes.length) parts.push(`<p>The routes with the most alerts were ${S.topRoutes.map((r) => esc(route(st, r))).join(', ').replace(/, ([^,]*)$/, ' and $1')}.</p>`);
  }
  {
    // This state against its own earlier months only.
    const h = histOf(st), comp = h.filter((x) => x.comparable), cur = h.find((x) => x.month === MONTH);
    parts.push(`<h2 class="rc">Compared with earlier months</h2>`);
    if (feedNote(st)) parts.push(`<p>See the feed change note at the top of this page.</p>`);
    if (cur && !cur.comparable) parts.push(`<p>MileCheck has ${n(cur.days)} of ${cur.daysInMonth} days of ${name}'s feed for ${MONTH_NAME}, so these counts are partial.</p>`);
    else if (comp.length >= 2) { const mx = Math.max(...comp.map((y) => y.total)); parts.push(`<p>Unique alerts on ${name}'s feed in each full month MileCheck has.</p>` + box('By month', comp.map((x) => histLine(x) + `<span class="hbar" style="width:${Math.max(2, Math.round(100 * x.total / mx))}%"></span>`))); }
    else parts.push(`<p>${MONTH_NAME} is the first full month of ${name}'s feed in MileCheck's archive. Next month's report compares it with ${MONTH_NAME}.</p>`);
  }
  { const w = winterSection(st, name); if (w) parts.push(w); }
  if (ports.length) {
    parts.push(`<h2 class="rc">Border waits</h2>` + liveLink('../../', 'borders/', 'Live border waits') + `<p>Waits to enter the United States in standard passenger lanes at ${name}'s crossings, ${MONTH_NAME}, from hourly readings. Dates are local.</p>`);
    parts.push(box('By crossing', ports.map((p) => `<strong>${portLink(p, '../../')}</strong> &mdash; ${p.maxMin ? `highest ${hm(p.maxMin)} (${dayOf(p.maxAt, p)}), average ${hm(p.avgMin)}` : `no wait in any of ${n(p.readings)} readings`}`)));
    parts.push(`<p>Live waits are at <a href="../../borders/">milecheckapp.com/borders</a>.</p>`);
  }
  if (st === 'WA' && BR && BR.length) {
    parts.push(`<h2 class="rc" id="drawbridges">Seattle drawbridges</h2>` + liveLink('../../', 'seattle-drawbridges/', 'Seattle drawbridges, live') + `<p>Seattle's drawbridges opened ${n(bridgeTotal)} times in ${MONTH_NAME}.</p>`);
    // List and the month's time-lapse side by side (moved here from the national page, Leah 2026-11-02).
    const tl = existsSync(resolve(ROOT, `blog/highway-report-maps/${KEY}/bridges.mp4`))
      ? `<figure style="margin:0;flex:0 1 260px;min-width:200px;"><figcaption style="font-size:16px;font-weight:700;color:#0f7a4f;line-height:1.35;margin:0 0 8px;">Every opening in ${MONTH_NAME}, sped up.${BRIDGE_TL_TOTAL[KEY] && BRIDGE_TL_TOTAL[KEY] !== bridgeTotal ? ` The video counts by Seattle time, so it ends at ${n(BRIDGE_TL_TOTAL[KEY])}.` : ''}</figcaption><video src="../${ver(`blog/highway-report-maps/${KEY}/bridges.mp4`).slice(5)}" poster="../${ver(`blog/highway-report-maps/${KEY}/bridges-poster.webp`).slice(5)}" width="720" height="900" controls muted playsinline preload="none" style="width:100%;height:auto;border-radius:8px;display:block;background:#0b0e12;"></video></figure>`
      : '';
    parts.push(`<div style="display:flex;flex-wrap:wrap;gap:18px;align-items:flex-start;margin:0 0 22px;"><div style="flex:1 1 360px;min-width:0;">${box(`Openings, ${MONTH_NAME}`, BR.map((b) => `<strong>${bridgeName(b.id)}</strong> &mdash; ${n(b.openings)} openings${b.medianMin != null ? `, typically ${b.medianMin} minutes, longest ${b.longestMin}` : ''}`)).replace('<div class="pull-stat">', '<div class="pull-stat" style="margin:0;">')}</div>${tl}</div>`);
    parts.push(`<p>Live status is on <a href="../../maps/#drawbridges">the drawbridge map</a>. New in ${MONTH_NAME}: Crystal Mountain's summit camera and the Paradise camera at Mount Rainier. See them on the <a href="../../ski/crystal-mountain/">Crystal Mountain page</a> and the <a href="../../mountains/rainier/">Mount Rainier page</a>.</p>`);
  }
  if (fire) {
    parts.push(`<h2 class="rc">Wildfires</h2>` + liveLink('../../', 'fire/', 'Live wildfire map') + snap(st, 'fires', `${MONTH_NAME} ${YEAR} fires in ${name}, ${fireAsOf}`, `Map of ${name} with the month's fire records as dots sized by acres`) + `<p>The national wildfire feed listed ${n(fire.active)} ${plural(fire.active, 'fire record', 'fire records')} in ${name} ${fireAsOf}.${st === 'BC' ? ' The BC Wildfire Service does not publish containment percentages.' : ''}</p>`);
    { const big = fire.largest.filter((f) => Number(f.acres) >= 50); // under 50 acres never lists (Leah 2026-11-06)
      parts.push(big.length ? box(`Largest fires, ${fireAsOf}`, big.map((f) => fireLine(f, st))) : `<p class="rc-fig">No fire on the feed in ${name} had reached 50 acres ${fireAsOf}.</p>`); }
    parts.push(`<p>Thank you to the firefighters and crews who worked these fires all season.</p>`);
    parts.push(`<p>Live fire perimeters are at <a href="../../fire/">milecheckapp.com/fire</a>.</p>`);
  }
  const rf = RF && RF.facts[st];
  if (rf && rf.posted !== false) parts.push(`<aside class="road-fact"><p class="rf-k">${name} road fact</p><p class="rf-h">Did you know?</p><p class="rf-t">${esc(rf.text).replace(/\b((?:I|US|H)-\d+)/g, '<span style="white-space:nowrap">$1</span>')}</p><p class="rf-s"><a href="${RF.instagram}" target="_blank" rel="noopener">More road facts on Instagram</a></p></aside>`);
  parts.push(`<p style="margin-top:34px;">See the <a href="../road-report-${KEY}.html">national report</a> or <a href="index.html">another state or province</a>.</p>`);
  const h1 = `MileCheck Highway Report: ${name}, ${MONTH_NAME} ${YEAR}`;
  const firstMonth = !(histOf(st).filter((x) => x.comparable).length >= 2);
  const desc = `${S.crash > 0 ? `${n(S.crash)} crash, ` : ''}${n(S.closure)} closure and ${n(S.construction)} roadwork alerts published by ${DOT_NAME[st] ? `the ${DOT_NAME[st]} feed` : `${name}'s DOT feed`} in ${MONTH_NAME} ${YEAR}${firstMonth ? `, MileCheck's first full month of ${name}` : ', compared with earlier months'}${ports.length ? ', plus border waits' : ''}${fire ? ', plus wildfires' : ''}.`;
  const canonical = `https://milecheckapp.com/blog/${STATE_DIR_NAME}/${slug(st)}.html`;
  writeFileSync(resolve(OUT_DIR, `${slug(st)}.html`), page({
    rel: '../../', canonical, pageTitle: h1, description: desc, h1,
    byline: `by MileCheck &middot; ${pubLong}`,
    body: parts.map((p) => '      ' + p).join('\n\n'),
    jsonld: { '@context': 'https://schema.org', '@type': 'NewsArticle', headline: h1, datePublished: PUBLISHED, dateModified: UPDATED || PUBLISHED, author: { '@type': 'Organization', name: 'MileCheck' }, publisher: { '@type': 'Organization', name: 'MileCheck', url: 'https://milecheckapp.com' }, mainEntityOfPage: canonical, description: desc, isPartOf: natCanon },
  }));
  written++;
}
const idxCanon = `https://milecheckapp.com/blog/${STATE_DIR_NAME}/`;
writeFileSync(resolve(OUT_DIR, 'index.html'), page({
  rel: '../../', canonical: idxCanon, pageTitle: `${H1}, by State`,
  description: `The ${H1} for every US state, British Columbia, Alberta and Manitoba: crashes, closures and roadwork from each state DOT feed.`,
  h1: `${H1}, by State`, byline: `by MileCheck &middot; ${pubLong}`,
  body: `      <p class="article-lead">One page per state and province, with the same measures. The <a href="../road-report-${KEY}.html">national report</a> has the totals.</p>\n      <ul class="state-grid">\n        ${Object.keys(NAMES).sort((a, b) => NAMES[a].localeCompare(NAMES[b])).map((st) => `<li><a href="${slug(st)}.html">${NAMES[st]}</a></li>`).join('\n        ')}\n      </ul>`,
  jsonld: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: `${H1}, by State`, url: idxCanon, publisher: { '@type': 'Organization', name: 'MileCheck' } },
}));
console.log(`Wrote ${NATIONAL_FILE}, the state index, and ${written} state pages to blog/${STATE_DIR_NAME}/`);
