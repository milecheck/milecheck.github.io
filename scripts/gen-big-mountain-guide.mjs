#!/usr/bin/env node
// gen-big-mountain-guide.mjs — /why-rainier-looks-so-big/ (2026-10-08). Same template as
// gen-larch-guides.mjs. Distances, angles and curvature are computed from the engine's own
// region and summit coordinates (default region of each mountain, flat-earth angle,
// curvature drop d^2/2R with R = 3,958.8 mi, no refraction). Prominence and isolation are
// from Wikipedia's Mount Rainier and Washington peaks pages, Denali from listsofjohn.com.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const slug = 'why-rainier-looks-so-big';
const URL = `https://milecheckapp.com/${slug}/`;
const title = 'Why Mount Rainier Looks So Big From Seattle | MileCheck';
const h1 = 'Why Mount Rainier looks so big from Seattle';
const desc = 'Rainier is 60 miles from Seattle and still fills the sky. Height above its base, nothing beside it, and the numbers for Hood, St. Helens, Baker and Denali.';
const WIKI = 'https://en.wikipedia.org/wiki/Mount_Rainier';
const A = (h, l) => `<a href="${h}" target="_blank" rel="noopener">${l}</a>`;

const body = `
<div class="eyebrow">Mountain views</div>
    <h1>${h1}</h1>
    <p class="lede">From downtown Seattle the summit is about 60 miles away. It still looks like a wall. Three things do that, and you can check each one with a number.</p>

    <h2>1. It rises from near sea level</h2>
    <p>The summit is 14,410 feet. Seattle is near sea level, and so is most of the ground between. Almost all of that height is in the view. A peak of the same height standing on a 7,000 foot plateau would show you half as much of itself.</p>
    <p>${A(WIKI, 'Wikipedia')} gives Rainier a topographic prominence of about 13,210 feet. Prominence is how far a summit rises above the lowest saddle that connects it to higher ground. For Rainier that saddle is only about 1,170 feet up, so nearly the whole mountain is a clear rise.</p>

    <h2>2. Nothing beside it is close to its height</h2>
    <p>The same source gives Rainier an isolation of about 731 miles, which is the distance to the nearest point of equal height. Mount Adams, the next most prominent peak in Washington, has a prominence of 8,136 feet and an isolation of about 46 miles. You judge size by comparison. Rainier has nothing next to it to compare with, so the eye reads the whole sky as mountain.</p>

    <h2>3. The angle is bigger than you expect</h2>
    <p>From Seattle the summit sits about 2.6 degrees above flat ground. That is the angle of a 14,410 foot rise over 60 miles. As a rule of thumb, a closed fist at arm's length covers about 10 degrees, so the whole mountain is a bit over a quarter of a fist tall.</p>
    <p>The curve of the Earth takes some of it off. At 60 miles it hides about 2,400 feet of the lower slopes before you count the light bending around it. That is why you see the white upper mountain and not the forest at its base.</p>

    <h2>The same math for the other mountains</h2>
    <p>Each row uses the main viewing town for that mountain. Angle is the rise of the summit over flat ground. Curve is how much the Earth's curve hides at that distance. These are approximate.</p>
    <ul>
      <li><strong>Rainier from Seattle: </strong>14,410 ft · 60 mi · 2.6° · curve 2,400 ft</li>
      <li><strong>Hood from Portland: </strong>11,249 ft · 49 mi · 2.5° · curve 1,600 ft</li>
      <li><strong>St. Helens from Portland: </strong>8,363 ft · 52 mi · 1.8° · curve 1,800 ft</li>
      <li><strong>Baker from Vancouver: </strong>10,781 ft · 69 mi · 1.7° · curve 3,150 ft</li>
      <li><strong>Denali from Talkeetna: </strong>20,310 ft · 59 mi · 3.7° · curve 2,300 ft</li>
    </ul>
    <p>Hood reads nearly as tall as Rainier from Portland because it is closer. St. Helens is the shortest of the five and had a different top before 1980, when the eruption took its summit from about 9,677 feet to 8,363. Baker is the farthest from its main town, so the curve hides the most of it. Denali is the tallest, and listsofjohn.com gives it a prominence of about 20,170 feet.</p>

    <h2>Why it looks bigger some days</h2>
    <p>Haze and smoke wash out the contrast between the white summit and the sky, and the mountain looks smaller or disappears. After a front, dry air gives you the full height. Low sun from the side adds shadow and shape to the slopes. See <a href="/mountains/rainier/best-time/">the best time to see Rainier</a>, and check <a href="/mountains/">the visibility forecast</a> for the day.</p>
    <p>Closer viewpoints change the angle fast. From <a href="/mountains/rainier/from-tacoma/">Tacoma</a>, at about 42 miles, the summit is roughly 3.7 degrees up, and the viewpoints on <a href="/mountains/rainier/">the Rainier page</a> are each measured against the terrain between you and the summit.</p>
`;

const tpl = readFileSync('best-portable-jump-starters/index.html', 'utf8');
const ld = JSON.stringify({ '@context': 'https://schema.org', '@type': 'Article', headline: h1, description: desc, url: URL,
  author: { '@type': 'Organization', name: 'MileCheck' }, publisher: { '@type': 'Organization', name: 'MileCheck' }, datePublished: '2026-10-08', dateModified: '2026-10-08' });
const bc = JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
  { '@type': 'ListItem', position: 1, name: 'MileCheck', item: 'https://milecheckapp.com/' },
  { '@type': 'ListItem', position: 2, name: 'Why Rainier looks so big', item: URL }] });
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
