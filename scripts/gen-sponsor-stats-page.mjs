// DISABLED 2026-10-29: the web sponsor offer is off (Leah, printed list 10/29) and /sponsor/stats/ was removed. Delete this file if it stays off.
console.log('gen-sponsor-stats-page: web sponsor offer is off, nothing written');process.exit(0);
// Live sponsor-slot stats page (/sponsor/stats/), read from the Worker /sponsor-stats endpoint in the browser.
// Explainer pages for curiosity searches (docs/curiosity-searches-2026-10-15.md). Bodies in data/explainers/<slug>.html,
// written by ChatGPT 10/15 with sources and checked by Claude. Same shell as gen-rest-area-pages.mjs.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
const tpl = readFileSync('what-is-my-mile-marker/index.html', 'utf8');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const headA = tpl.slice(0, tpl.indexOf('  <title>'));
const headB = tpl.slice(tpl.indexOf('  <link rel="icon"'), tpl.indexOf('  <script type="application/ld+json">'));
const headC = tpl.slice(tpl.indexOf('  <style>'), tpl.indexOf('  <article class="art">'));
const tail = tpl.slice(tpl.indexOf('  </article>'));
const readDate = 'October 15, 2026';
function page({ path, title, desc, h1, body, ld }) {
  const url = `https://milecheckapp.com${path}`;
  const html = headA +
    `  <title>${esc(title)}</title>\n  <meta name="description" content="${esc(desc)}">\n  <link rel="canonical" href="${url}">\n` +
    `  <meta property="og:title" content="${esc(h1)}">\n  <meta property="og:description" content="${esc(desc)}">\n  <meta property="og:url" content="${url}">\n  <meta property="og:type" content="article">\n` +
    headB.replace(/href="\.\.\//g, 'href="/') +
    `  <script type="application/ld+json">${JSON.stringify(ld)}</script>\n` +
    headC.replace(/href="\.\.\//g, 'href="/') +
    `  <article class="art">\n<div class="eyebrow">For sponsors</div>\n    <h1>${esc(h1)}</h1>\n${body}\n` + tail;
  const dir = path.replace(/^\//, '');
  mkdirSync(dir, { recursive: true });
  writeFileSync(dir + 'index.html', html.replace(/href="\.\.\//g, 'href="/').replace(/src="\.\.\//g, 'src="/'));
}
const BODY = `    <p class="lede">How often the sponsor slot at the top of MileCheck pages is on screen, counted by MileCheck. Updated live.</p>
    <div id="ss-total" style="display:flex;gap:28px;flex-wrap:wrap;margin:18px 0 8px"></div>
    <p id="ss-range" style="font-size:13px;color:#5b6670"></p>
    <h2>Views per day</h2>
    <div id="ss-days" style="display:flex;align-items:flex-end;gap:3px;height:130px;margin:8px 0 4px"></div>
    <h2>By package</h2>
    <table style="width:100%;border-collapse:collapse;font-size:15px"><thead><tr><th style="text-align:left;padding:8px 6px;border-bottom:2px solid #E5E5E5">Pages</th><th style="text-align:right;padding:8px 6px;border-bottom:2px solid #E5E5E5">Slot views</th><th style="text-align:right;padding:8px 6px;border-bottom:2px solid #E5E5E5">Clicks</th></tr></thead><tbody id="ss-groups"></tbody></table>
    <p style="font-size:13px;color:#5b6670;margin-top:14px">A view is counted when the slot is shown on a page. Want your name in the slot? Email <a href="mailto:sales@milecheckapp.com?subject=MileCheck%20sponsorship">sales@milecheckapp.com</a>.</p>
    <script>
    (function(){
      var G=[['All camera pages',/^cameras:/],['California, Nevada and Utah',/california|los-angeles|san-diego|san-francisco|sacramento|cajon|donner|grapevine|tejon|nevada|las-vegas|reno|utah|salt-lake|parleys|cottonwood/],['Washington',/washington|seattle|snoqualmie|stevens|bridge/],['Oregon',/oregon|portland|gorge|hood/],['Mountain passes',/^pass:/],['Corridors (interstates)',/^corridor:/]];
      var fmt=function(n){return Number(n).toLocaleString('en-US')};
      fetch('https://api.milecheckapp.com/sponsor-stats').then(function(r){return r.json()}).then(function(d){
        var big=function(n,l){return '<div><div style="font-size:34px;font-weight:800;line-height:1">'+n+'</div><div style="font-size:13px;color:#5b6670;margin-top:4px">'+l+'</div></div>'};
        document.getElementById('ss-total').innerHTML=big(fmt(d.total.impressions),'sponsor slot views, last '+d.days+' days')+big(fmt(d.total.clicks),'clicks');
        document.getElementById('ss-range').textContent='Since '+d.since+'. Updated '+new Date(d.generatedAt||Date.now()).toLocaleString('en-US')+'.';
        var today=new Date().toISOString().slice(0,10); d.byDay=d.byDay.filter(function(x){return x.day!==today}); var mx=Math.max.apply(null,d.byDay.map(function(x){return x.impressions}))||1;
        document.getElementById('ss-days').innerHTML=d.byDay.map(function(x){return '<div title="'+x.day+': '+fmt(x.impressions)+'" style="flex:1;background:#0f7a4f;border-radius:3px 3px 0 0;height:'+Math.max(2,Math.round(x.impressions/mx*100))+'%"></div>'}).join('');
        document.getElementById('ss-groups').innerHTML=G.map(function(g){var u=d.bySlot.filter(function(x){return g[1].test(x.slot)});var i=u.reduce(function(a,x){return a+x.impressions},0),c=u.reduce(function(a,x){return a+x.clicks},0);return '<tr><td style="padding:9px 6px;border-bottom:1px solid #eee">'+g[0]+'</td><td style="text-align:right;padding:9px 6px;border-bottom:1px solid #eee">'+fmt(i)+'</td><td style="text-align:right;padding:9px 6px;border-bottom:1px solid #eee">'+fmt(c)+'</td></tr>'}).join('');
      }).catch(function(){document.getElementById('ss-range').textContent='Stats could not load. Try again in a minute.'});
    })();
    </script>`;
page({ path: '/sponsor/stats/', title: 'Sponsor slot stats | MileCheck', desc: 'How often the MileCheck sponsor slot is seen, live, by day and by page group.', h1: 'How often is the MileCheck sponsor slot seen?', body: BODY,
  ld: { '@context': 'https://schema.org', '@type': 'WebPage', name: 'Sponsor slot stats', url: 'https://milecheckapp.com/sponsor/stats/' } });
// Sponsor-facing, not a search page: noindex.
{ const f = 'sponsor/stats/index.html'; writeFileSync(f, readFileSync(f, 'utf8').replace('<link rel="canonical" href="https://milecheckapp.com/sponsor/stats/">', '<link rel="canonical" href="https://milecheckapp.com/sponsor/stats/">\n  <meta name="robots" content="noindex">')); }
console.log('sponsor stats page written');
