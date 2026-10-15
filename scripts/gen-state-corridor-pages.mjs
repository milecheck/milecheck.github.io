// Finite I-75 pilot. Context is adapted from approved state mile-marker guides in states.cjs.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(import.meta.url);
const states=require('./road-conditions/states.cjs');
const input=JSON.parse(fs.readFileSync(path.join(root,'data/state-corridors.json'),'utf8'));
const allowed=['FL','GA','TN','KY','OH','MI'];
if(input.length!==6 || input.some((r,i)=>r.state!==allowed[i] || r.slug!==states.find(s=>s.code===r.state)?.name.toLowerCase())) throw Error('Expected the six I-75 states in corridor order');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const parent=fs.readFileSync(path.join(root,'corridors/i-75/index.html'),'utf8');
// Preserve the existing analytics and signup implementations; no new providers or ad slots.
const block=(source,pattern,label)=>{const match=source.match(pattern);if(!match)throw Error('Missing existing '+label);return match[0];};
const analytics=block(parent,/<!-- ga4 -->[\s\S]*?<!-- \/ga4 -->/,'GA4');
const cloudflare=block(fs.readFileSync(path.join(root,'index.html'),'utf8'),/<!-- Cloudflare Web Analytics -->[\s\S]*?<!-- End Cloudflare Web Analytics -->/,'Cloudflare analytics');
// This existing state page carries the approved copy from add-signup-band.mjs.
const signup=block(fs.readFileSync(path.join(root,'road-conditions/florida/index.html'),'utf8'),/<!-- signup:start -->[\s\S]*?<!-- signup:end -->/,'signup');
const mailer=block(parent,/<!-- MailerLite Universal -->[\s\S]*?<!-- End MailerLite Universal -->/,'MailerLite');
const absolute=s=>s.replaceAll('../../','/');
const header=absolute(parent.match(/<header class="site-header">[\s\S]*?<\/header>/)[0]);
const footer=absolute(parent.match(/<footer class="site-footer">[\s\S]*?<\/footer>/)[0]);
for(const [i,r] of input.entries()){
 const s=states.find(s=>s.code===r.state),title=`What are the road conditions on I-75 in ${s.name}?`;
 const url=`https://milecheckapp.com/corridors/i-75/${r.slug}/`;
 const description=`Check I-75 alerts and DOT cameras in ${s.name}. Read reported closures, roadwork and incident details, with source times when provided.`;
 const graph={'@context':'https://schema.org','@graph':[
  {'@type':'WebPage','@id':url+'#webpage',url,name:title,description,isPartOf:{'@id':'https://milecheckapp.com/#website'},publisher:{'@id':'https://milecheckapp.com/#org'},breadcrumb:{'@id':url+'#breadcrumb'}},
  {'@type':'BreadcrumbList','@id':url+'#breadcrumb',itemListElement:[{name:'MileCheck',item:'https://milecheckapp.com/'},{name:'Corridors',item:'https://milecheckapp.com/corridors/'},{name:'I-75',item:'https://milecheckapp.com/corridors/i-75/'},{name:s.name,item:url}].map((v,i)=>({'@type':'ListItem',position:i+1,...v}))}
 ]};
 const config={state:r.state,slug:r.slug,name:s.name,dot:s.dot,bounds:s.bounds,dotUrl:s.dotUrl};
 const adjacent=[input[i-1],input[i+1]].filter(Boolean).map(n=>`<a href="/corridors/i-75/${n.slug}/">I-75 in ${esc(states.find(s=>s.code===n.state).name)}</a>`).join(' · ');
 const cities=r.cities.map(c=>{if(!fs.existsSync(path.join(root,'cameras',c,'index.html')))throw Error('Unknown city camera page');return `<li><a href="/cameras/${c}/?route=I-75">${esc(c[0].toUpperCase()+c.slice(1))} cameras</a></li>`;}).join('');
 const html=`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
${analytics}
<title>${esc(title)} | MileCheck</title><meta name="description" content="${esc(description)}">
<meta property="og:title" content="${esc(title)} | MileCheck"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${url}"><meta property="og:type" content="website">
<script type="application/ld+json">${JSON.stringify(graph).replaceAll('<','\\u003c')}</script>
<link rel="canonical" href="${url}"><link rel="icon" href="/images/favicon.png"><link rel="stylesheet" href="/style.css"><link rel="stylesheet" href="/assets/state-corridor.css"><link rel="stylesheet" href="/assets/map-kit.css">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<link rel="stylesheet" href="https://unpkg.com/leaflet-gesture-handling@1.2.2/dist/leaflet-gesture-handling.min.css">
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" defer></script>
<script src="https://unpkg.com/leaflet-gesture-handling@1.2.2/dist/leaflet-gesture-handling.min.js" defer></script>
<script src="/assets/state-corridor.js" defer></script><script src="/assets/map-kit.js" defer></script>
</head><body>${header}
<main class="state-corridor"><nav aria-label="Breadcrumb"><a href="/corridors/">Corridors</a> / <a href="/corridors/i-75/">I-75</a> / ${esc(s.name)}</nav>
<h1>${esc(title)}</h1><p class="sc-lede">${esc(r.context)}</p>
<p>Check the map and lists below for I-75 reports and cameras from <a href="${esc(s.dotUrl)}" rel="noopener">${esc(s.dot)}, the official DOT traveler source</a>.</p>
<nav class="sc-tools" aria-label="I-75 tools"><a href="/cameras/${r.slug}/?route=I-75">I-75 cameras in ${esc(s.name)}</a><a href="/maps/mile-markers/?state=${r.state}&amp;route=I-75">Find an I-75 mile marker</a><a href="/road-conditions/${r.slug}/">All ${esc(s.name)} road reports</a></nav>
<button id="sc-refresh" class="sc-more" type="button">Refresh reports and cameras</button><p class="sc-meta">Reports and cameras refresh every five minutes while this page is visible. “Retrieved” shows when this page fetched the feed, separate from the DOT’s source update time.</p>
<div id="comap" role="region" aria-label="Map of I-75 reports and cameras in ${esc(s.name)}"></div><p id="sc-map-status" role="status"></p>
<section aria-labelledby="alerts-heading"><h2 id="alerts-heading">What alerts has ${esc(s.dot)} reported on I-75?</h2><p id="sc-alert-status" role="status">Loading DOT reports.</p><div id="sc-alerts"></div></section>
<section aria-labelledby="cameras-heading"><h2 id="cameras-heading">Where can you see I-75 cameras in ${esc(s.name)}?</h2><p id="sc-camera-status" role="status">Loading DOT cameras.</p><div id="sc-cameras" class="sc-cameras"></div><button id="sc-camera-more" class="sc-more" type="button" hidden>Show more cameras</button>${cities?`<ul>${cities}</ul>`:''}</section>
<section><h2>How should you read these reports?</h2><p>These I-75 reports come from ${esc(s.dot)}. Headlines and event type codes are shown as supplied by the feed. Reports missing coordinates may be omitted.</p><p>Future start times are labeled scheduled. Source update times appear only when supplied. An alert does not establish that the whole highway is closed.</p><p>No reports returned does not establish that the road is clear. A failed feed is labeled unavailable. Camera capture times may be unavailable.</p><p>Check <a href="${esc(s.dotUrl)}">${esc(s.dot)}</a> for official updates and follow posted signs. <a href="/data-sources/">Read about the data sources.</a></p></section>
<section><h2>Where does I-75 go next?</h2><p>${adjacent}</p><p><a href="/corridors/i-75/">See the full I-75 corridor</a> · <a href="/blog/mile-markers-${r.slug}.html">${esc(s.name)} mile-marker guide</a></p></section>
<noscript><p>The live map and records need JavaScript. Use the official DOT link above to check current reports.</p></noscript></main>${signup}${footer}${cloudflare}${mailer}
<script id="state-corridor-config" type="application/json">${JSON.stringify(config).replaceAll('<','\\u003c')}</script></body></html>\n`;
 const target=path.join(root,'corridors/i-75',r.slug);fs.mkdirSync(target,{recursive:true});fs.writeFileSync(path.join(target,'index.html'),html);
}
console.log('Generated 6 I-75 state pilot pages.');
