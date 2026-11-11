// Generates /mountains/<key>/sunset-glow/index.html: "Is <Mountain> going to glow at sunset tonight?"
// Idea 1 in mountain-engine/docs/seo-photographers-2026-11-11.md (2026-11-11).
// Shell (head styles, header, gear card, footer) is lifted from the live hub page; only the
// middle is new. Copy lives in scripts/photo-copy.json (ChatGPT draft). Viewpoints come from
// mv-b34/mountains/<key>.cjs (which spreads <key>.spots.cjs). Live data is read client-side
// from <key>-is-out data.json; each live block stays hidden if the fetch fails.
// Run: node scripts/gen-photo-pages.js
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const MV = process.env.MV_DIR || path.join(ROOT, '..', 'mv-b34');
const COPY = require('./photo-copy.json');
const KEYS = ['rainier', 'hood', 'baker', 'sthelens', 'denali', 'olympics', 'angeles', 'baldy', 'bachelor', 'southsister'];
const SLUG = 'sunset-glow';

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const mi = (a, b, c, d) => { const R = 3958.8, p = Math.PI / 180; const x = Math.sin((c - a) * p / 2) ** 2 + Math.cos(a * p) * Math.cos(c * p) * Math.sin((d - b) * p / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(x)); };

function build(key) {
  const m = require(path.join(MV, 'mountains', key + '.cjs'));
  const name = m.mountainFull;
  const plural = /^The /.test(name);
  const subj = plural ? name.replace(/^The/, 'the') : name;
  const title = (plural ? 'Are ' : 'Is ') + subj + ' going to glow at sunset tonight?';
  const town = m.regions.find(r => r.key === m.defaultRegion) || m.regions[0];
  const fill = s => s.replace(/\{Mountain\}/g, subj).replace(/\{town\}/g, town.name).replace(/^the /, 'The ');
  // Viewpoints: Sunset-tagged first, in file order (hand-picked list comes first). If none, "Any".
  let spots = m.spots.filter(s => s.best === 'Sunset'), lightWord = 'Sunset';
  if (!spots.length) { spots = m.spots.filter(s => s.best === 'Any'); lightWord = 'Any time of day'; }
  spots = spots.slice(0, 5);
  const desc = fill(COPY.desc);
  const hubFile = path.join(ROOT, 'mountains', key, 'index.html');
  const hub = fs.readFileSync(hubFile, 'utf8');
  const url = `https://milecheckapp.com/mountains/${key}/${SLUG}/`;
  const ios = `https://apps.apple.com/us/app/mountain-visibility-forecast/id6810003955?pt=128447811&amp;ct=photo-${key}&amp;mt=8`;
  const play = (hub.match(/href="(https:\/\/play\.google\.com[^"]*)"/) || [])[1];

  const iHead = hub.indexOf('</head>');
  const iNavEnd = hub.indexOf('<!-- /site-nav:header -->') + '<!-- /site-nav:header -->'.length;
  const iGear = hub.indexOf('<section class="mc-gear"');
  if (iHead < 0 || iNavEnd < 30 || iGear < 0) throw new Error('shell markers missing in ' + hubFile);
  const deeper = s => s.replace(/(href|src)="\.\.\/\.\.\//g, '$1="../../../');
  let head = hub.slice(0, iHead)
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*/, '$1' + esc(desc))
    .replace(/(<link rel="canonical" href=")[^"]*/, '$1' + url)
    .replace(/(<meta property="og:title" content=")[^"]*/, '$1' + esc(title))
    .replace(/(<meta property="og:description" content=")[^"]*/, '$1' + esc(desc))
    .replace(/(<meta property="og:url" content=")[^"]*/, '$1' + url)
    .replace(/\s*<script type="application\/ld\+json">\{"@context":"https:\/\/schema\.org","@type":"FAQPage".*?<\/script>/, '');
  const faq = COPY.faq.map(f => ({ q: fill(f.q), a: fill(f.a) }));
  const ld = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) };
  head += `  <script type="application/ld+json">${JSON.stringify(ld)}</script>
  <style>.pg-live[hidden]{display:none}.pg-big{font-family:var(--display);font-size:24px;font-weight:600;margin:4px 0}.pg-list{list-style:none;padding:0;margin:8px 0}.pg-list li{padding:8px 0;border-bottom:1px solid var(--line)}.pg-list .m{display:block;font-size:13px;color:var(--ink-soft)}</style>\n`;
  const shellTop = deeper(head + hub.slice(iHead, iNavEnd));
  const shellBot = deeper(hub.slice(iGear));

  const spotLis = spots.map(s => `<li>${esc(s.name)}<span class="m">Best light: ${lightWord} · ${Math.round(mi(town.lat, town.lon, s.lat, s.lon))} mi from ${esc(town.name)}</span></li>`).join('');
  const L = { Great: fill(COPY.glowGreat), Decent: fill(COPY.glowDecent), Skip: fill(COPY.glowPoor) };
  const body = `
  <div class="mv-crumbs"><a href="../../../index.html">MileCheck</a> / <a href="../../../mountains/">Mountains</a> / <a href="../">${esc(name)}</a> / Sunset glow</div>
  <div class="mv-hero"><div>
    <div class="mv-stamp">${esc(name)} · sunset glow</div>
    <h1>${esc(title)}</h1>
    <p class="sub">${esc(fill(COPY.intro))}</p>
  </div></div>
  <div class="mv-body">
    <div class="mv-verdict pg-live" id="pgGlow" hidden>
      <div class="mv-stamp">${esc(fill(COPY.glowHead))}</div>
      <div class="pg-big" id="pgGrade"></div>
      <p class="mv-line" id="pgGlowTxt"></p>
      <p class="mv-line" id="pgSunset"></p>
    </div>
    <div class="mv-prose pg-live" id="pgWin" hidden><h2>${esc(fill(COPY.windowsHead))}</h2><ul class="pg-list" id="pgWinList"></ul></div>
    <div class="mv-prose">${spots.length ? `<h2>${esc(fill(COPY.spotsHead))}</h2><p>${esc(fill(COPY.spotsIntro))}</p><ul class="pg-list">${spotLis}</ul>` : `<p><a href="../spots/">Viewpoints for ${esc(subj)}</a></p>`}
    <p>${esc(fill(COPY.forecastNote))}</p></div>
    <div class="mv-get"><div><div class="mv-stamp">The app</div><h3>Mountain Visibility</h3><p>${esc(fill(COPY.ctaText))}</p></div>
      <a href="${ios}" class="btn btn-primary" data-store="ios" rel="noopener">Get the app, $1.99</a>
      ${play ? `<span class="mv-soon" data-store="play">On Android? <a href="${play}" target="_blank" rel="noopener">Get it on Google Play</a>.</span>` : ''}
    </div>
    <p class="mv-back"><a href="../">Is ${esc(subj)} out right now?</a></p>
    <div class="mv-prose"><h2>Questions</h2></div><div class="mv-faq">${faq.map(f => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}</div>
    <div class="mv-notes">Forecast from MET Norway (CC BY 4.0). Observations from NOAA aviation weather. Times are local to ${esc(name)}.</div>
  </div>
  <script>(function(){var L=${JSON.stringify(L)},G={Great:'Great',Decent:'Decent',Skip:'Poor light expected'},TZ=${JSON.stringify(m.tz)},SL=${JSON.stringify(COPY.sunsetLabel)},NONE=${JSON.stringify(fill(COPY.windowsNone))};
  function f(t,o){return new Date(t).toLocaleString('en-US',Object.assign({timeZone:TZ},o));}
  function hm(t){return f(t,{hour:'numeric',minute:'2-digit'});}
  fetch('https://${key}-is-out.leahgerber93.workers.dev/data.json').then(function(r){return r.ok?r.json():null;}).then(function(j){if(!j)return;var now=Date.now();
  var g=(j.alpenglow||[]).filter(function(e){return e.kind==='sunset'&&Date.parse(e.windowEnd||e.when)>now;})[0];
  if(g&&L[g.label]){document.getElementById('pgGrade').textContent=G[g.label]+(f(g.when,{year:'numeric',month:'numeric',day:'numeric'})===f(now,{year:'numeric',month:'numeric',day:'numeric'})?'':' · '+f(g.when,{weekday:'long'}));document.getElementById('pgGlowTxt').textContent=L[g.label];document.getElementById('pgSunset').textContent=SL+' '+hm(g.when);document.getElementById('pgGlow').hidden=false;}
  if(Array.isArray(j.windows)){var w=j.windows.filter(function(x){return x.end>now;}).slice(0,5);document.getElementById('pgWinList').innerHTML=w.length?w.map(function(x){return '<li>'+f(x.start,{weekday:'long'})+', '+hm(x.start)+' to '+hm(x.end)+'</li>';}).join(''):'<li>'+NONE+'</li>';document.getElementById('pgWin').hidden=false;}
  }).catch(function(){});})();</script>
`;
  const out = path.join(ROOT, 'mountains', key, SLUG, 'index.html');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, shellTop + body + shellBot);

  // Hub related link (idempotent).
  if (!hub.includes(`href="${SLUG}/"`)) {
    const nh = hub.replace('<ul class="mv-near">', `<ul class="mv-near"><li><a href="${SLUG}/">${esc(title)}</a></li>`);
    fs.writeFileSync(hubFile, nh);
  }
  return { key, title, tlen: title.length, dlen: desc.length, spots: spots.length, lightWord, url };
}

const res = KEYS.map(build);
// Sitemap (idempotent).
const smFile = path.join(ROOT, 'sitemap.xml');
let sm = fs.readFileSync(smFile, 'utf8');
const today = new Date().toISOString().slice(0, 10);
const add = res.filter(r => !sm.includes(`<loc>${r.url}</loc>`)).map(r => `  <url>\n    <loc>${r.url}</loc>\n    <lastmod>${today}</lastmod>\n  </url>\n`).join('');
if (add) { sm = sm.replace('</urlset>', add + '</urlset>'); fs.writeFileSync(smFile, sm); }
console.table(res.map(({ url, ...r }) => r));
