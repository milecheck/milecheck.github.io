// Builds /closures/<slug>/ pages for big multi-day closures listed in big-closures.json.
// Facts come from the state DOT feed via the MileCheck Worker; wording is ours, never copied.
// Entries marked "handwritten" are skipped (their page is edited by hand).
import fs from 'node:fs';
const items = JSON.parse(fs.readFileSync('scripts/closures/big-closures.json', 'utf8'));
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// "Last checked" is the date someone verified the record, never the build date.
const fmt = iso => new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
// JSON inside <script> must not be able to close the tag.
const safeJson = o => JSON.stringify(o).replace(/</g, '\\u003c');
// Status shown on every page and in its title. Only a person sets "reopened".
function statusOf(c) {
  const st = c.status || { state: 'reported-closed' };
  const dot = esc(c.dot);
  if (st.state === 'reopened') return { prefix: 'Reopened: ', color: '#1d7a3a', text: `Reported open by ${dot}${st.reopenedOn ? ` on ${esc(fmt(st.reopenedOn))}` : ''}. This page is kept as a record.` };
  if (st.state === 'unconfirmed') return { prefix: 'Status unconfirmed: ', color: '#8a5a00', text: `This closure no longer appears in ${dot}'s feed. That does not mean the road is open. Check <a href="${esc(c.dotUrl)}">${dot}</a> before you drive.` };
  let text = st.state === 'scheduled' ? `Scheduled. Not closed yet. ${dot} lists it.` : `Reported closed by ${dot}.`;
  if (st.note === 'past-scheduled-end') text += ` The scheduled end has passed, but ${dot} still lists it.`;
  if (st.lastCheckFailed) text += ` Our last update attempt failed. Status as of ${esc(fmt(c.verifiedAt))}.`;
  return { prefix: '', color: '#b3261e', text };
}
const banner = c => { const s = statusOf(c); return `<!-- status:start --><p style="border-left:4px solid ${s.color};padding:8px 12px;background:#f6f4ec;margin:12px 0"><strong>${s.text}</strong> Last checked ${esc(fmt(c.verifiedAt))}.</p><!-- status:end -->`; };

const SITE = 'https://milecheckapp.com';
const stateSlug = s => s.toLowerCase().replace(/ /g, '-');
// Header and footer come from a live road-conditions page so these pages match the site.
const shell = fs.readFileSync('road-conditions/washington/index.html', 'utf8');
const HEADER = shell.match(/<header class="site-header">[\s\S]*?<\/header>/)[0].replace(' class="active"', '');
const FOOTER = shell.match(/<footer class="site-footer">[\s\S]*?<\/footer>\s*<script>[\s\S]*?<\/script>/)[0]
  .replace(/road-conditions-washington/g, 'closures');
const trim = (t, n) => t.length <= n ? t : t.slice(0, n - 1).replace(/\s+\S*$/, '') + '…';

for (const c of items) {
  if (!/^[a-z0-9-]+$/.test(c.slug) || !/^https:\/\//.test(c.dotUrl) || !c.verifiedAt) throw new Error('bad entry ' + c.slug);
  const s = statusOf(c);
  const url = `${SITE}/closures/${c.slug}/`;
  const sSlug = stateSlug(c.state);
  const h1 = s.prefix + c.title;
  const title = `${h1} | MileCheck`;
  const desc = trim(`${c.title}. ${c.when}. ${c.between}. ${c.around}`, 158);
  const faq = [
    [`When is ${c.road} closed?`, `${c.whenFaq}. Dates come from ${c.dot}, the ${c.state} DOT feed, and can change.`],
    [`Where is the ${c.road} closure?`, `${c.road}, ${c.between}, ${c.state}. ${c.dir}.`],
    [`How do I get around it?`, c.around],
  ];
  const nearby = items.filter(o => o.state === c.state && o.slug !== c.slug);
  const crumbs = [['MileCheck', `${SITE}/`], ['Road closures', `${SITE}/closures/`], [c.state, `${SITE}/road-conditions/${sSlug}/`], [c.road, url]];
  const ld = [
    { '@context': 'https://schema.org', '@type': 'WebPage', '@id': url, url, name: h1, description: desc, inLanguage: 'en-US',
      lastReviewed: c.verifiedAt, dateModified: c.verifiedAt,
      about: { '@type': 'Place', name: `${c.road}, ${c.between}`, address: { '@type': 'PostalAddress', addressRegion: c.state, addressCountry: 'US' }, geo: { '@type': 'GeoCoordinates', latitude: c.lat, longitude: c.lon } },
      isBasedOn: c.dotUrl,
      publisher: { '@type': 'Organization', name: 'MileCheck', url: `${SITE}/`, logo: `${SITE}/assets/app-icon-60.png` } },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: crumbs.map(([name, item], k) => ({ '@type': 'ListItem', position: k + 1, name, item })) },
  ];
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<!-- ga4 --><script async src="https://www.googletagmanager.com/gtag/js?id=G-CDMSB5630W"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-CDMSB5630W',{anonymize_ip:true});</script><!-- /ga4 -->
  <meta name="apple-itunes-app" content="app-id=6759212851">
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <link rel="canonical" href="${url}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="MileCheck">
  <meta property="og:title" content="${esc(h1)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${SITE}/images/og-banner-light.png">
  <meta property="article:modified_time" content="${c.verifiedAt}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(h1)}">
  <meta name="twitter:description" content="${esc(desc)}">
  <meta name="geo.region" content="US">
  <meta name="geo.position" content="${c.lat};${c.lon}">
  <link rel="icon" type="image/png" href="/images/favicon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/style.css">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
  ${ld.map(o => `<script type="application/ld+json">${safeJson(o)}</script>`).join('\n  ')}
  <style>
    .cp{max-width:760px;margin:0 auto;padding:22px 20px 40px;line-height:1.6}
    .cp nav.crumbs{font-size:14px;color:#5b6670;margin-bottom:10px}.cp nav.crumbs a{color:inherit}
    .cp h1{font-size:clamp(26px,4vw,36px);font-weight:800;letter-spacing:-0.02em;line-height:1.15;margin:0 0 6px}
    .cp table{border-collapse:collapse;margin:16px 0;width:100%}.cp td{padding:6px 16px 6px 0;vertical-align:top;border-bottom:1px solid #e6e3d8}
    .cp #map{height:260px;border-radius:10px;margin:16px 0;background:#e9e6dc}
    .cp h2{font-size:21px;margin:26px 0 6px}
  </style>
</head>
<body>
${HEADER}
<main class="cp">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="/closures/">Road closures</a> › <a href="/road-conditions/${sSlug}/">${esc(c.state)}</a> › ${esc(c.road)}</nav>
  <h1>${esc(h1)}</h1>
  ${banner(c)}
  <p><strong>${esc(c.when)}.</strong> ${esc(c.what)}.</p>
  <table>
    <tr><td><b>Road</b></td><td>${esc(c.road)}, ${esc(c.state)}</td></tr>
    <tr><td><b>Where</b></td><td>${esc(c.between)}</td></tr>
    <tr><td><b>Mile markers</b></td><td>${esc(c.miles)}</td></tr>
    <tr><td><b>Direction</b></td><td>${esc(c.dir)}</td></tr>
    <tr><td><b>Source</b></td><td><a href="${esc(c.dotUrl)}" rel="nofollow">${esc(c.dot)}</a>, record ${esc(c.id)}</td></tr>
  </table>
  <div id="map" role="img" aria-label="Map of the ${esc(c.road)} closure"></div>
  <h2>Getting around it</h2>
  <p>${esc(c.around)}</p>
  ${c.extra ? `<p>${esc(c.extra)}</p>` : ''}
  ${faq.map(([q, a]) => `<h2>${esc(q)}</h2>\n  <p>${esc(a)}</p>`).join('\n  ')}
  <h2>Before you drive</h2>
  <p>Dates on long closures move. Check <a href="${esc(c.dotUrl)}" rel="nofollow">${esc(c.dot)}</a> for changes. For everything else on the road today, see <a href="/road-conditions/${sSlug}/">${esc(c.state)} road conditions</a> and the <a href="/closures/">road closures map</a>.</p>
  ${nearby.length ? `<h2>Other long closures in ${esc(c.state)}</h2>\n  <ul>${nearby.map(o => `<li><a href="/closures/${o.slug}/">${esc(statusOf(o).prefix + o.title)}</a> · ${esc(o.when)}</li>`).join('')}</ul>` : ''}
  <p>This page comes from the same state DOT feed the MileCheck app uses. The app shows your mile marker as you drive, so you know how far you are from a closure like this one.</p>
</main>
${FOOTER}
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>(function(){if(!window.L)return;var m=L.map('map',{scrollWheelZoom:false,dragging:!L.Browser.mobile,tap:false}).setView([${c.lat},${c.lon}],11);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'&copy; OpenStreetMap'}).addTo(m);L.circleMarker([${c.lat},${c.lon}],{radius:9,color:'#fff',weight:3,fillColor:'${s.color}',fillOpacity:1}).addTo(m);})();</script>
</body>
</html>
`;
  fs.mkdirSync(`closures/${c.slug}`, { recursive: true });
  fs.writeFileSync(`closures/${c.slug}/index.html`, html);
  console.log('wrote', c.slug);
}

// Long-closure list on /closures/: each item pans the map to the closure and marks it.
// Owned block between markers. The map (const map) is defined later in the page, so wait for load.
{
  const idx = 'closures/index.html';
  let s = fs.readFileSync(idx, 'utf8');
  const data = items.map(c => ({ slug: c.slug, t: statusOf(c).prefix + c.title, w: c.when, lat: c.lat, lon: c.lon, col: statusOf(c).color }));
  const links = items.map((c, k) => `<li><button type="button" class="lc-go" data-k="${k}">${esc(statusOf(c).prefix + c.title)}</button> · ${esc(c.when)} · <a href="/closures/${c.slug}/">details</a></li>`).join('');
  const block = `<!-- big:start --><div style="max-width:1160px;margin:6px auto 0;padding:0 20px"><p style="font-weight:700;margin:0 0 4px">Long closures</p><ul style="margin:0;padding-left:18px;font-size:15px;line-height:1.7">${links}</ul></div>
<style>.lc-go{background:none;border:0;padding:0;font:inherit;color:#1a5fb4;text-decoration:underline;cursor:pointer;text-align:left}</style>
<script>window.addEventListener('load',function(){if(typeof map==='undefined'||!window.L)return;var D=${safeJson(data)};var mk=D.map(function(c){return L.circleMarker([c.lat,c.lon],{radius:8,color:'#fff',weight:3,fillColor:c.col,fillOpacity:1}).bindPopup('<strong>'+c.t.replace(/</g,'&lt;')+'</strong><br>'+c.w.replace(/</g,'&lt;')+'<br><a href="/closures/'+c.slug+'/">Details →</a>').addTo(map);});document.querySelectorAll('.lc-go').forEach(function(b){b.addEventListener('click',function(){var k=+b.dataset.k,c=D[k];var el=document.getElementById('clmap');if(el)el.scrollIntoView({behavior:'smooth',block:'center'});map.flyTo([c.lat,c.lon],10,{duration:.9});setTimeout(function(){mk[k].openPopup();},950);});});});</script><!-- big:end -->`;
  if (s.includes('<!-- big:start -->')) s = s.replace(/<!-- big:start -->[\s\S]*?<!-- big:end -->/, () => block);
  else s = s.replace('\n  <div class="cl-wrap">', `\n  ${block}\n\n  <div class="cl-wrap">`);
  fs.writeFileSync(idx, s);
  console.log('linked', items.length, 'from', idx);
}

// Separate sitemap so these don't wait on the main sitemap.xml.
fs.writeFileSync('closures-sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items.map(c => `  <url><loc>https://milecheckapp.com/closures/${c.slug}/</loc><lastmod>${c.verifiedAt}</lastmod></url>`).join('\n')}
</urlset>
`);
console.log('wrote closures-sitemap.xml');
