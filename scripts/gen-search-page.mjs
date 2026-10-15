#!/usr/bin/env node
// gen-search-page.mjs — /search/ and 404.html (2026-09-28). The site had no search; the
// only search boxes were the drawbridge filters. This is a client-side search over
// search-index.json (built by build-search-index.mjs). No server, no third party.
// 404.html runs the same search seeded from the words in the missing URL, so a dead link
// lands on the closest real pages instead of a blank GitHub page.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const tpl = readFileSync('best-portable-jump-starters/index.html', 'utf8');
const strip = (html) => html
  .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\n?/g, '')
  .replace(/<meta property="og:type" content="article">/, '<meta property="og:type" content="website">');
const head = strip(tpl.slice(0, tpl.indexOf('<body>')));
const header = tpl.slice(tpl.indexOf('<body>'), tpl.indexOf('<article class="art">')).replace(/\.\.\/index\.html/g, '/').replace(/href="\.\.\//g, 'href="/')
  .replace(/<a\b[^>]*class="nav-search"[^>]*>[\s\S]*?<\/a>\s*/g, '');
const footer = tpl.slice(tpl.indexOf('<footer class="site-footer">')).replace(/href="\.\.\//g, 'href="/').replace(/src="\.\.\//g, 'src="/')
  .replace(/ct=best-portable-jump-starters/g, 'ct=search').replace(/utm_campaign%3Dbest-portable-jump-starters/g, 'utm_campaign%3Dsearch')
  .replace(/<p class="footer-label">Learn more<\/p>\s*<ul class="footer-list">[\s\S]*?<\/ul>/, `<p class="footer-label">Start here</p>\n          <ul class="footer-list">\n            <li><a href="/maps/">All maps</a></li>\n            <li><a href="/cameras/">Cameras</a></li>\n            <li><a href="/road-conditions/">Road conditions by state</a></li>\n            <li><a href="/blog/">Blog</a></li>\n          </ul>`)
  .replace(/<!-- spon:start --><script>[\s\S]*?<!-- spon:end -->\n?/, '');
const CSS = `    .srch{max-width:760px;margin:0 auto;padding:34px 20px 40px;}
    .srch h1{font-size:clamp(26px,5vw,38px);line-height:1.12;margin:0 0 10px;}
    .srch .lede{font-size:16.5px;line-height:1.6;color:#3a444d;margin:0 0 18px;}
    .srch form{display:flex;gap:8px;margin:0 0 14px;}
    .srch input[type=search]{flex:1;font:inherit;font-size:17px;padding:13px 16px;border:1.5px solid #cfd5da;border-radius:12px;background:#fff;color:#0E1116;min-width:0;}
    .srch input[type=search]:focus{outline:none;border-color:#0f7a4f;box-shadow:0 0 0 3px rgba(15,122,79,.15);}
    .srch button{font:inherit;font-weight:700;font-size:15px;padding:0 18px;border:none;border-radius:12px;background:#0f7a4f;color:#fff;cursor:pointer;}
    .srch .chips{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 18px;}
    .srch .chips button{background:#fff;color:#0E1116;border:1px solid #E5E5E5;border-radius:999px;padding:6px 12px;font-size:13px;font-weight:700;}
    .srch .chips button[aria-pressed=true]{background:#0E1116;color:#fff;border-color:#0E1116;}
    .srch .count{color:#5b6670;font-size:13.5px;margin:0 0 10px;}
    .srch .hit{display:block;border:1px solid #E5E5E5;border-radius:12px;background:#fff;padding:14px 16px;margin:0 0 10px;text-decoration:none;color:inherit;}
    .srch .hit:hover{border-color:#0E1116;}
    .srch .hit .sec{font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#0f7a4f;}
    .srch .hit .sec .lg{color:#5b6670;font-weight:700;margin-left:6px;}
    .srch .hit h2{font-size:17px;margin:3px 0 4px;color:#0E1116;}
    .srch .hit p{font-size:14.5px;line-height:1.5;color:#3a444d;margin:0;}
    .srch .hit .u{font-size:12.5px;color:#8A939B;margin-top:5px;word-break:break-all;}
    .srch .card{display:block;border:1.5px solid #0f7a4f;border-radius:12px;background:#f3faf6;padding:14px 16px;margin:0 0 12px;text-decoration:none;color:inherit;}
    .srch .card .sec{font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#0f7a4f;}
    .srch .card h2{font-size:17px;margin:3px 0 4px;color:#0E1116;}
    .srch .card p{font-size:14.5px;line-height:1.5;color:#3a444d;margin:0;}
    .srch .card .u{font-size:12.5px;color:#8A939B;margin-top:5px;}
    .srch .empty{color:#5b6670;font-size:15px;padding:14px 0;}
    .srch mark{background:#fff3b0;color:inherit;padding:0 1px;border-radius:2px;}
    .srch .starts{margin:22px 0 0;}
    .srch .starts h2{font-size:18px;margin:0 0 8px;}
    .srch .starts a{display:inline-block;border:1px solid #E5E5E5;border-radius:999px;padding:7px 13px;margin:0 6px 8px 0;font-size:14px;font-weight:700;color:#0E1116;text-decoration:none;}
    .srch .starts a:hover{border-color:#0E1116;}`;
// The matching logic lives in scripts/search-client.js (route normalization, stop words, city/state
// knowledge, intent boosts, partial-match fallback) and is inlined into both pages here.
const JS = '<script>' + readFileSync(new URL('./search-client.js', import.meta.url), 'utf8') + '</script>';
const SECTIONS = ['Live maps', 'Cameras', 'Passes', 'Corridors', 'State guides', 'Drawbridges', 'Mountains', 'Guides', 'Gear', 'Blog', 'For business', 'Other languages'];
const chips = `<div class="chips" id="chips" aria-label="Narrow by section">${SECTIONS.map((s) => `<button type="button" data-sec="${s}" aria-pressed="false">${s}</button>`).join('')}</div>`;
const starts = `<div class="starts"><h2>Or start from a hub</h2>
      <a href="/maps/">All maps</a><a href="/cameras/">Cameras by state</a><a href="/road-conditions/">Road conditions by state</a><a href="/passes/">Mountain passes</a><a href="/corridors/">Interstate corridors</a><a href="/closures/">Closures map</a><a href="/borders/">Border waits</a><a href="/states/">Mile markers by state</a><a href="/canada/">Canada</a><a href="/gear/">Gear</a><a href="/blog/">Blog</a>
    </div>`;
function page({ title, desc, canonical, h1, lede, seedScript, noindex }) {
  const h = head
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${desc}">`)
    .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${title}">`)
    .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${desc}">`)
    .replace(/https:\/\/milecheckapp\.com\/best-portable-jump-starters\//g, canonical)
    .replace(/<link rel="canonical" href="[^"]*">\n?/, noindex ? '<meta name="robots" content="noindex, follow">\n' : `<link rel="canonical" href="${canonical}">\n`)
    .replace(/href="\.\.\//g, 'href="/')
    .replace(/<style>\n/, `<style>\n${CSS}\n`);
  return h + header.replace('<a href="/get/" class="nav-cta">', '<a href="/search/" class="nav-search" aria-current="page"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/></svg><span>Search</span></a>\n        <a href="/get/" class="nav-cta">') + `<main class="srch">
    <h1>${h1}</h1>
    <p class="lede">${lede}</p>
    <form id="sf" role="search"><input type="search" id="q" name="q" placeholder="Try: Snoqualmie, I-90, Arizona cameras, chains" autocomplete="off" aria-label="Search milecheckapp.com"><button type="submit">Search</button></form>
    ${chips}
    <p class="count" id="count"></p>
    <div id="results" aria-live="polite"></div>
    ${starts}
  </main>
  ${seedScript || ''}${JS}
` + footer;
}
mkdirSync('search', { recursive: true });
writeFileSync('search/index.html', page({
  title: 'Search MileCheck', desc: 'Search every page on milecheckapp.com: live cameras, road conditions, mountain passes, interstate corridors, drawbridges, mile-marker guides and the blog.',
  canonical: 'https://milecheckapp.com/search/', h1: 'Search the site', lede: 'Every page on milecheckapp.com, searched as you type. Cameras, closures, passes, corridors, mile-marker guides, the blog.' }));
// 404: seed the query from the missing path's words. GitHub Pages serves /404.html for any missing URL.
writeFileSync('404.html', page({
  title: 'Page not found | MileCheck', desc: 'That page is not here. Search the site instead.',
  canonical: 'https://milecheckapp.com/404.html', h1: 'That page is not here', lede: 'The address may have changed. The words from it are already in the box below, so the closest pages should be a keystroke away.', noindex: true,
  seedScript: `<script>window.__seedQuery=decodeURIComponent(location.pathname).replace(/\\.html$/,'').replace(/[\\/_-]+/g,' ').replace(/\\b(index|blog|cameras|www)\\b/g,'').trim();</script>\n  ` }));
console.log('search/index.html + 404.html written');
