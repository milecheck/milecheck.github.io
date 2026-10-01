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
for (const c of items) {
  if (c.handwritten) continue;
  if (!/^[a-z0-9-]+$/.test(c.slug) || !/^https:\/\//.test(c.dotUrl) || !c.verifiedAt) throw new Error('bad entry ' + c.slug);
  const faq = [
    [`When is ${c.road} closed?`, `${c.whenFaq}. Dates come from ${c.dot}, the ${c.state} DOT feed, and can change.`],
    [`Where is the ${c.road} closure?`, `${c.road}, ${c.between}, ${c.state}. ${c.dir}.`],
    [`How do I get around it?`, c.around],
  ];
  const url = `https://milecheckapp.com/closures/${c.slug}/`;
  const ld = { '@context': 'https://schema.org', '@type': 'WebPage', '@id': url, url, name: c.title, description: `${c.when}. ${c.between}, ${c.state}.`, lastReviewed: c.verifiedAt, publisher: { '@type': 'Organization', name: 'MileCheck', url: 'https://milecheckapp.com/' } };
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<!-- ga4 --><script async src="https://www.googletagmanager.com/gtag/js?id=G-CDMSB5630W"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-CDMSB5630W',{anonymize_ip:true});</script><!-- /ga4 -->
  <meta name="apple-itunes-app" content="app-id=6759212851">
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(c.title)}, ${esc(c.when)} | MileCheck</title>
  <meta name="description" content="${esc(`${c.title}. ${c.when}. ${c.dir}, ${c.between}. ${c.around}`)}">
  <link rel="canonical" href="https://milecheckapp.com/closures/${c.slug}/">
  <meta property="og:title" content="${esc(c.title)}">
  <meta property="og:description" content="${esc(`${c.when}. ${c.between}.`)}">
  <meta property="og:url" content="https://milecheckapp.com/closures/${c.slug}/">
  <link rel="icon" type="image/png" href="../../images/favicon.png">
  <link rel="stylesheet" href="../../style.css">
  <script type="application/ld+json">${safeJson(ld)}</script>
</head>
<body>
<main style="max-width:760px;margin:0 auto;padding:34px 20px;line-height:1.6">
  <p><a href="../">← All live closures</a></p>
  <h1>${esc(c.title)}</h1>
  <p><strong>${esc(c.when)}.</strong> ${esc(c.what)}.</p>
  <table style="border-collapse:collapse;margin:16px 0">
    <tr><td style="padding:4px 16px 4px 0"><b>Road</b></td><td>${esc(c.road)}, ${esc(c.state)}</td></tr>
    <tr><td style="padding:4px 16px 4px 0"><b>Where</b></td><td>${esc(c.between)}</td></tr>
    <tr><td style="padding:4px 16px 4px 0"><b>Mile markers</b></td><td>${esc(c.miles)}</td></tr>
    <tr><td style="padding:4px 16px 4px 0"><b>Direction</b></td><td>${esc(c.dir)}</td></tr>
    <tr><td style="padding:4px 16px 4px 0"><b>Source</b></td><td>${esc(c.dot)}, record ${esc(c.id)}</td></tr>
  </table>
  ${faq.map(([q, a]) => `<h2 style="font-size:19px">${esc(q)}</h2>\n  <p>${esc(a)}</p>`).join('\n  ')}
  <h2>Getting around it</h2>
  <p>${esc(c.around)}</p>
  <p>Dates on long closures move. Check <a href="${esc(c.dotUrl)}">${esc(c.dot)}</a> before you drive.</p>
  <p>This page comes from the same state DOT feed the MileCheck app uses. See the <a href="../">road closures map</a>.</p>
  <p style="color:#666;font-size:14px">Last checked ${fmt(c.verifiedAt)}.</p>
</main>
</body>
</html>
`;
  fs.mkdirSync(`closures/${c.slug}`, { recursive: true });
  fs.writeFileSync(`closures/${c.slug}/index.html`, html);
  console.log('wrote', c.slug);
}

// Link list on /closures/ so crawlers find these pages. Owned block between markers.
{
  const idx = 'closures/index.html';
  let s = fs.readFileSync(idx, 'utf8');
    const links = items.map(c => `<li><a href="/closures/${c.slug}/">${esc(c.title)}</a>${c.when ? ` · ${esc(c.when)}` : ''}</li>`).join('');
  const block = `<!-- big:start --><div style="max-width:1160px;margin:6px auto 0;padding:0 20px"><p style="font-weight:700;margin:0 0 4px">Long closures</p><ul style="margin:0;padding-left:18px;font-size:15px;line-height:1.7">${links}</ul></div><!-- big:end -->`;
  if (s.includes('<!-- big:start -->')) s = s.replace(/<!-- big:start -->[\s\S]*?<!-- big:end -->/, block);
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
