#!/usr/bin/env node
// gen-larch-guides.mjs — two October articles (2026-10-08): the larch guide and the
// October mountain-views guide. Same template as gen-binoculars-guide.mjs.
// Facts are from WTA's larch feature (wta.org/news/magazine/features/the-science-of-larches),
// WTA's fall-color hike list and Maple Pass page (read 2026-10-08), and our own
// /mountains/ best-time pages. Nothing here is a trail condition. Run finish-pages after.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const tpl = readFileSync('best-portable-jump-starters/index.html', 'utf8');

function build({ slug, title, h1, desc, crumb, body }) {
  const URL = `https://milecheckapp.com/${slug}/`;
  const ld = JSON.stringify({ '@context': 'https://schema.org', '@type': 'Article', headline: h1, description: desc, url: URL,
    author: { '@type': 'Organization', name: 'MileCheck' }, publisher: { '@type': 'Organization', name: 'MileCheck' }, datePublished: '2026-10-08', dateModified: '2026-10-08' });
  const bc = JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'MileCheck', item: 'https://milecheckapp.com/' },
    { '@type': 'ListItem', position: 2, name: crumb, item: URL }] });
  const head = tpl.slice(0, tpl.indexOf('<body>'))
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${desc}">`)
    .replace(/https:\/\/milecheckapp\.com\/best-portable-jump-starters\//g, URL)
    .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${title}">`)
    .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${desc}">`)
    .replace(/<meta name="twitter:title" content="[^"]*">/, `<meta name="twitter:title" content="${title}">`)
    .replace(/<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${desc}">`)
    .replace(/<script type="application\/ld\+json">\{"@context":"https:\/\/schema\.org","@type":"FAQPage"[\s\S]*?<\/script>\n?/, '')
    .replace(/<script type="application\/ld\+json">\{"@context":"https:\/\/schema\.org","@type":"Article"[\s\S]*?<\/script>/, `<script type="application/ld+json">${ld}</script>`)
    .replace(/<script type="application\/ld\+json">\{"@context":"https:\/\/schema\.org","@type":"BreadcrumbList"[\s\S]*?<\/script>/, `<script type="application/ld+json">${bc}</script>`);
  const header = tpl.slice(tpl.indexOf('<body>'), tpl.indexOf('<article class="art">'));
  const footer = tpl.slice(tpl.indexOf('<footer class="site-footer">'))
    .replace(/ct=best-portable-jump-starters/g, `ct=${slug}`).replace(/utm_campaign%3Dbest-portable-jump-starters/g, `utm_campaign%3D${slug}`);
  mkdirSync(slug, { recursive: true });
  writeFileSync(`${slug}/index.html`, `${head}${header}<article class="art">\n${body}\n  </article>\n\n  ${footer}`);
  console.log(`${slug}/index.html written`);
}

const WTA = 'https://www.wta.org/news/magazine/features/the-science-of-larches';
const WTA_FALL = 'https://www.wta.org/go-outside/seasonal-hikes/fall-destinations/hi-lo-color-hikes-for-fall';
const WTA_MAPLE = 'https://www.wta.org/go-hiking/hikes/maple-pass';
const SRC = (href, label) => `<a href="${href}" target="_blank" rel="noopener">${label}</a>`;

// 1. The larch guide ---------------------------------------------------------------------
build({
  slug: 'washington-larch-season',
  title: 'When and Where to See Golden Larches in Washington | MileCheck',
  h1: 'Golden larches in Washington: when they turn and where to go',
  desc: 'Larches are the conifers that turn gold and drop their needles. When it happens in Washington, which hikes to start with, and four larches you can see in Seattle.',
  crumb: 'Washington larch season',
  body: `
<div class="eyebrow">October guide</div>
    <h1>Golden larches in Washington: when they turn and where to go</h1>
    <p class="lede">Larches are conifers that lose their needles. In fall the needles turn gold first, and the color lasts a few weeks. Here is when that happens, which hikes to start with, and where to see one without leaving Seattle.</p>

    <h2>What a larch is</h2>
    <p>A larch is a pine-family tree that grows new needles in spring, turns them gold in fall and drops them for winter. Washington has two native kinds, and ${SRC(WTA, 'Washington Trails Association')} describes both.</p>
    <p><strong>Western larch</strong> grows up to 170 feet tall on north-facing slopes at 2,000 to 5,500 feet. <strong>Subalpine larch</strong> tops out around 70 feet and grows higher, at 5,800 to 7,500 feet, in cold, snowy spots on bedrock and talus. Both grow mainly on the east side of the Cascades. The high-elevation color is subalpine larch, which is why most of these trails are long and steep.</p>

    <h2>When they turn</h2>
    <p>WTA puts the gold in late September into early October, and says the color usually lasts only a few weeks. It varies by year and by elevation. Higher trees turn first and lower ones follow. Wind or early snow can end the season early.</p>
    <p>Look at recent trip reports on the hike you pick before you drive. A report from the last two or three days tells you more than any calendar.</p>

    <h2>Hikes to start with</h2>
    <p>These are listed by WTA as larch hikes. Distances are round trip.</p>
    <ul>
      <li><strong>Maple Pass loop</strong>, off Highway 20 at Rainy Pass. 7.2 miles, 2,020 feet of gain, highest point 6,650 feet. WTA describes lakes ringed with golden larches and names Black Peak and the Liberty Bell group in the view. ${SRC(WTA_MAPLE, 'WTA page')}.</li>
      <li><strong>Easy Pass</strong>, Highway 20. 7.0 miles, 2,800 feet of gain.</li>
      <li><strong>Tatie Peak and Grasshopper Pass</strong>, Pasayten. 9.4 miles, 1,200 feet of gain.</li>
      <li><strong>Sullivan Lakeshore</strong>, Selkirk Range in the northeast corner of the state. 8.2 miles, 250 feet of gain. The least climbing of the four.</li>
      <li><strong>Cutthroat Lake and Cutthroat Pass</strong>, Highway 20. WTA's larch feature lists both.</li>
    </ul>
    <p>Source for the numbers: ${SRC(WTA_FALL, 'WTA fall color hikes')}. Maple Pass and the other Highway 20 trailheads need an America the Beautiful Pass or a Northwest Forest Pass. Maple Pass is best before the highway closes for the season.</p>
    <p>Maple Pass is also the busiest of these. If the lot is full, the other Highway 20 trailheads are the same drive.</p>

    <h2>Other east-side larch hikes</h2>
    <p>WTA's feature also lists Carne Mountain near Stevens Pass, Tronsen Ridge near Blewett Pass, Esmeralda Basin and Lake Ann in the Teanaway, and Clara and Marion lakes near Wenatchee. Check each one's recent trip reports first.</p>

    <h2>A larch in Seattle</h2>
    <p>WTA lists larches in the Washington Park Arboretum, Ravenna Park and Woodland Park in Seattle, at Bloedel Reserve on Bainbridge Island and at Silver Lake Park in Everett. These are planted trees, and they turn on their own schedule. If the pass is closed or the day is gray, they are an hour away at most.</p>

    <h2>The mountain behind the larches</h2>
    <p>Gold larches against a summit is the picture most people drive for. Cloud decides whether you get it. See <a href="/october-mountain-views/">where to see the mountains in October</a>, and check <a href="/mountains/">the visibility forecast</a> for the peak you are headed toward.</p>
`,
});

// 2. October mountain views --------------------------------------------------------------
build({
  slug: 'october-mountain-views',
  title: 'Where to See the Mountains in October | MileCheck',
  h1: 'Where to see the mountains in October',
  desc: 'October fog under the mountain, clear cold mornings at Baker, and two hikes with a named peak in the view. What our region pages say for each mountain.',
  crumb: 'October mountain views',
  body: `
<div class="eyebrow">October guide</div>
    <h1>Where to see the mountains in October</h1>
    <p class="lede">October is when the weather changes, and the mountains show it. Fog fills the lowlands, and a gray morning in town can be a clear one a few miles up or across the Sound. Here is what we say for each mountain, and two hikes that put one in the view.</p>

    <h2>Mount Rainier</h2>
    <p>October and November bring inversions. Seattle sits under fog while the mountain stands above it in sun. On those mornings the view can be better from Tacoma or the Eastside than from Seattle. The <a href="/mountains/rainier/from-tacoma/">Tacoma</a> and <a href="/mountains/rainier/from-eastside/">Eastside</a> pages read their own weather stations. The hour after sunrise and the hour before sunset are the two to watch, as in every month. From <a href="/mountains/rainier/from-yakima/">Yakima</a>, on the east side of the crest, the app reads the line of sight from Yakima itself.</p>
    <p>On the hike side, WTA lists Pinnacle Saddle as a Mount Rainier view hike. It is 2.5 miles round trip with 1,000 feet of gain, near Cayuse Pass and Stevens Canyon. ${SRC(WTA_FALL, 'WTA')}.</p>

    <h2>Mount Baker</h2>
    <p>From Vancouver, Baker is most reliable from July into early October. Late September and October often bring a run of clear cold mornings before the winter overcast sets in. Abbotsford and Bellingham are closer and are often clear when the coast is socked in. <a href="/mountains/baker/">Baker's page</a> has each region.</p>
    <p>WTA lists Skyline Divide in the Mount Baker area. It is 9.0 miles round trip with 2,500 feet of gain. When WTA's list was read on October 8, the Deadhorse Creek Road (FR 37) was closed for flood damage, so confirm access before you go.</p>

    <h2>Mount Hood and Mount St. Helens</h2>
    <p>Both are most reliable from Portland in July through September, so October is the shoulder. Autumn inversions can put Portland under fog with St. Helens in sun above it, and the I-5 towns are often clear when Portland is not. Longview and Castle Rock are the classic St. Helens views. See <a href="/mountains/sthelens/">St. Helens</a> and <a href="/mountains/hood/">Hood</a>.</p>

    <h2>Larches and a summit in the same trip</h2>
    <p>The larch trails are on the east side of the Cascades, and most do not look at one of the big volcanoes. The exception in WTA's list is Maple Pass, which names Black Peak and the Liberty Bell group in the view. The full list and timing are in the <a href="/washington-larch-season/">larch guide</a>.</p>

    <h2>Before you drive</h2>
    <p>Cloud and smoke are the two things that hide a mountain on a day that looks fine from home. <a href="/mountains/">The visibility forecast</a> reads the airports along the line of sight and the cloud at the summit, and covers five days. A pair of 10x binoculars helps for a summit that is 60 miles off. See <a href="/best-binoculars-for-mountain-views/">binoculars for mountain views</a>.</p>
`,
});
