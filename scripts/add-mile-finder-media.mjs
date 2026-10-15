// Keep the original web-tool walkthrough on the two existing mile-marker explainers.
// Run after add-state-map-links.mjs. The MP4 is a captioned sequence of actual page captures.
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
for(const asset of ['video/find-a-mile-marker.mp4','video/find-a-mile-marker.vtt','images/guides/mile-marker-finder.webp']){
  if(!existsSync(resolve(root,asset)))throw Error('Missing walkthrough asset '+asset);
}
const image='https://milecheckapp.com/images/guides/mile-marker-finder.webp';
const media=`
<!-- mile-finder-media:start -->
    <section class="mc-mile-demo" aria-labelledby="mile-demo-heading" style="margin:24px 0;padding:18px;border:1px solid #dbe5df;border-radius:12px;background:#fff;">
      <h2 id="mile-demo-heading" style="scroll-margin-top:112px;">How do you find a mile marker?</h2>
      <figure style="margin:16px 0;"><img src="/images/guides/mile-marker-finder.webp" width="1056" height="1180" loading="lazy" decoding="async" alt="MileCheck map with Oregon and I-84 selected, showing the recorded milepost at 147.03." style="display:block;width:100%;max-width:440px;height:auto;border:1px solid #e5e5e5;border-radius:8px;"></figure>
      <details><summary>Watch the walkthrough</summary>
      <video controls playsinline preload="none" width="792" height="884" poster="/images/guides/mile-marker-finder.webp" aria-label="Example of finding a recorded mile marker on MileCheck" style="display:block;width:100%;max-width:440px;height:auto;border:1px solid #e5e5e5;border-radius:8px;margin:12px 0;">
        <source src="/video/find-a-mile-marker.mp4" type="video/mp4">
        <track kind="captions" src="/video/find-a-mile-marker.vtt" srclang="en" label="English" default>
        <a href="/video/find-a-mile-marker.mp4">Watch the mile marker example</a>.
      </video>
      </details>
      <details><summary>What does the pin show?</summary><p>Pins show recorded DOT mileposts. Positions are approximate. If the requested number is missing, the tool may show a nearby recorded post and name its actual mile. It does not calculate a position between posts.</p></details>
      <p><a href="/maps/mile-markers/?state=OR&amp;route=I-84">Try the mile marker finder</a></p>
    </section>
<!-- mile-finder-media:end -->`;
let count=0;
for(const slug of ['what-is-my-mile-marker','can-google-maps-show-mile-markers']){
  const file=resolve(root,slug,'index.html'),original=readFileSync(file,'utf8');
  let html=original.replace(/\s*<!-- mile-finder-media:start -->[\s\S]*?<!-- mile-finder-media:end -->/g,'');
  if(!html.includes('<h2 style="margin-top:34px">'))throw Error('Missing explainer questions section');
  html=html.replace(/[ \t]*<h2 style="margin-top:34px">/,media+'\n    <h2 style="margin-top:34px">')
    .replace(/<meta property="og:image" content="[^"]*">/,`<meta property="og:image" content="${image}">`);
  if(!html.includes('property="og:image:alt"'))html=html.replace(`<meta property="og:image" content="${image}">`,`<meta property="og:image" content="${image}">\n  <meta property="og:image:alt" content="MileCheck map showing the recorded I-84 milepost 147.03 in Oregon.">`);
  if(html!==original){writeFileSync(file,html);count++;}
}
console.log('Mile finder walkthrough: '+count+' explainers updated.');
