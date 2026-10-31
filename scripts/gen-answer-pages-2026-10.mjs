#!/usr/bin/env node
// Answer pages written 2026-10-31 for search questions people type (research:
// marketing/research/trucker-route-511-and-search-2026-10-31.md in the app repo).
// Each page states what was checked, where, and on what date. No "first" or "only".
//   node scripts/gen-answer-pages-2026-10.mjs
// Shell (head, nav, footer) is taken from can-google-maps-show-mile-markers/index.html.
// That page's title, h1 and opening are also edited here, idempotently.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const CHECKED = 'October 31, 2026';
const tplPath = 'can-google-maps-show-mile-markers/index.html';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const link = (u, t) => `<a href="${u}" target="_blank" rel="noopener">${t}</a>`;
const cta = (slug) => `<div class="cta">
      <h3>See your mile marker and state DOT alerts</h3>
      <p>MileCheck shows your nearest recorded mile marker as you drive and live alerts from state DOT feeds. The mile marker works offline.</p>
      <div class="btns">
        <a class="primary" href="https://apps.apple.com/app/apple-store/id6759212851?pt=128447811&ct=${slug}&mt=8" target="_blank" rel="noopener">iOS App Store</a>
        <a class="ghost" href="https://play.google.com/store/apps/details?id=app.milecheck.mobile&referrer=utm_source%3Dmilecheckapp.com%26utm_medium%3Dweb%26utm_campaign%3D${slug}" target="_blank" rel="noopener">Google Play</a>
      </div>
    </div>`;
const related = (items) => `<p class="g-related">Related: ${items.map(([u, t]) => `<a href="${u}">${t}</a>`).join(' · ')}</p>`;

const PAGES = [
  {
    slug: 'does-apple-maps-show-mile-markers',
    h1: 'Does Apple Maps show mile markers?',
    title: 'Does Apple Maps Show Mile Markers? | MileCheck',
    desc: `No. Apple's iPhone guide lists four map views and traffic markers for crashes, roadwork and closures. Mile markers are not on the list. Checked ${CHECKED}.`,
    lede: `No. Apple's iPhone guide for Maps describes four map views and traffic markers for crashes, roadwork, hazards and road closures. It does not list mile markers. We checked on ${CHECKED}.`,
    body: `
    <h2>What Apple says Maps shows</h2>
    <p>The guide to Maps on iPhone names these map views: Explore, Driving, Transit and Satellite (${link('https://support.apple.com/guide/iphone/set-up-maps-iph10d7bdf26/ios', 'Apple Support, set up Maps')}).</p>
    <p>In Driving view, yellow marks slowdowns and red marks stop-and-go traffic. Markers can show road closures, accidents, traffic and roadwork. Apple adds hazard and accident markers from user reports once it has enough confidence in them (${link('https://support.apple.com/guide/iphone/check-traffic-conditions-report-incidents-iphb8a99022c/ios', 'Apple Support, check traffic conditions')}).</p>
    <p>Neither page mentions mile markers.</p>
    <h2>What this does not prove</h2>
    <p>This is a check of Apple's own help pages on one date. We did not test every iOS version or every place Apple draws extra detail. Apple can add a feature later. If you find a mile marker layer in Maps, tell us at feedback@milecheckapp.com and we will correct this page.</p>
    <h2>Why people ask</h2>
    <p>A mile marker is a number posted on the highway. It names one spot on one numbered road. Crews and dispatch use it to say where something is, and an address or a pair of coordinates does not do that on an open stretch of road.</p>
    <h2>What MileCheck does</h2>
    <p>MileCheck shows the nearest recorded mile marker to your position, to a tenth of a mile. The mile marker data is stored on your phone, so it works without a signal. It has mile markers for all 50 states. Positions are approximate. Always go by the signs on the road.</p>
    ${'{{CTA}}'}`,
    rel: [['/can-google-maps-show-mile-markers/', 'Does Google Maps show mile markers?'], ['/what-mile-marker-am-i-at/', 'What mile marker am I at?'], ['/mile-markers-vs-exit-numbers/', 'Mile markers vs exit numbers']],
  },
  {
    slug: 'does-trucker-path-show-dot-511-road-alerts',
    h1: 'Does Trucker Path show DOT 511 road alerts?',
    title: 'Does Trucker Path Show DOT 511 Road Alerts? | MileCheck',
    desc: `Trucker Path says it added DOT 511 data in March 2025. What the sources say, what we could not confirm, and how MileCheck reads state feeds. Checked ${CHECKED}.`,
    lede: `Yes, by its own account. Trade press reported on March 13, 2025 that Trucker Path added the DOT 511 Traffic Network, with live traffic, construction and crash information across the U.S. We could not confirm which states are covered or which plan includes it.`,
    body: `
    <h2>What the sources say</h2>
    <p>${link('https://www.trucknews.com/products/trucker-path-adds-real-time-dot-511-traffic-updates', 'Trucknews, March 13, 2025')}: Trucker Path integrated the DOT 511 Traffic Network into its app. The article describes live traffic, construction and crash information. It names no states and does not say whether the feature is free or paid.</p>
    <p>Trucker Path's Google Play release notes, as we read them on September 28, 2026, list "Live Traffic Cams &amp; 511 Data along your route". We have not found a public statement of where its data comes from.</p>
    <h2>What we could not confirm</h2>
    <p>The state list, the plan that includes it, and how often the alerts refresh. Check the app before you rely on it for a specific state.</p>
    <h2>What MileCheck does with 511 data</h2>
    <p>MileCheck reads each state's own traffic feed. It shows each alert against the nearest mile marker, so an alert reads as a spot on a numbered highway. The agency behind every state is listed on ${'<a href="/data-sources/">the data sources page</a>'}.</p>
    <p>Road alerts come from a live state feed in all 50 states. Hawaii's feed lists work zones only. Some states have no incident open at a given moment. Cameras are live in 46 states and 5 Canadian provinces.</p>
    <h2>What MileCheck is not</h2>
    <p>It is not a truck GPS. It has no truck parking, fuel prices or truck restriction checks. If you need those, you need an app built for them. Many drivers will keep both.</p>
    ${'{{CTA}}'}`,
    rel: [['/what-is-511/', 'What is 511?'], ['/data-sources/', 'Where MileCheck gets its road data'], ['/does-waze-have-a-truck-mode/', 'Does Waze have a truck mode?']],
  },
  {
    slug: 'does-waze-have-a-truck-mode',
    h1: 'Does Waze have a truck mode?',
    title: 'Does Waze Have a Truck Mode? | MileCheck',
    desc: `Waze's help page lists three vehicle types: Private, Taxi and Motorcycle. Trucks are not listed. What we checked and when, as of ${CHECKED}.`,
    lede: `Not that we can find. Waze's help page on vehicle type lists three choices, Private, Taxi and Motorcycle. It does not mention trucks. We checked on ${CHECKED}.`,
    body: `
    <h2>What Waze says</h2>
    <p>${link('https://support.google.com/waze/answer/7579259?hl=en', 'Waze Help, select your vehicle type')}: you choose Private, Taxi or Motorcycle under Vehicle details. The page does not mention trucks in the part we could read.</p>
    <h2>What Waze has said before</h2>
    <p>On September 22 and 23, 2013, a Waze staff member wrote on the Waze forum that vehicle types were not supported yet and that a simple "Truck Mode" was being worked on (${link('https://www.waze.com/discuss/t/truck-routes/38574', 'Waze Discuss, Truck Routes')}). That was 13 years ago. We found no later announcement of a truck mode.</p>
    <h2>What this does not prove</h2>
    <p>This is a check of Waze's help page and one old forum thread. Waze may add a vehicle type at any time. Check the app's Vehicle details screen for what it offers today.</p>
    <h2>Where MileCheck fits</h2>
    <p>MileCheck does not route trucks either. It shows your nearest mile marker and live alerts from state DOT feeds, with the agency named for each state. It can sit next to a routing app. It does not replace one.</p>
    ${'{{CTA}}'}`,
    rel: [['/does-trucker-path-show-dot-511-road-alerts/', 'Does Trucker Path show DOT 511 road alerts?'], ['/what-is-511/', 'What is 511?'], ['/data-sources/', 'Where MileCheck gets its road data']],
  },
  {
    slug: 'one-api-for-every-states-511-road-alerts',
    h1: "Is there one API for every state's 511 road alerts?",
    title: "Is There One API for Every State's 511 Road Alerts? | MileCheck",
    desc: `The states do not publish one. Each runs its own 511 and its own developer terms. MileCheck's API returns state DOT alerts for all 50 states in one shape. Checked ${CHECKED}.`,
    lede: `Not from the states. Each runs its own 511 system with its own developer key and its own limits. Wisconsin's developer page, for example, says calls are throttled to ten every 60 seconds. MileCheck's API returns state DOT alerts for all 50 states in one response shape.`,
    body: `
    <h2>What the states publish</h2>
    <p>${link('https://511wi.gov/developers/doc', '511 Wisconsin')} documents a REST API for Wisconsin only. It needs a developer key and says "Ten calls every 60 seconds" (read ${CHECKED}). Other states use other platforms, other formats and other sign-ups. Some give you a map and no feed.</p>
    <h2>What MileCheck's API returns</h2>
    <p>One request for a state returns road conditions and incidents in one shape: closures, crashes, construction and road weather. Each alert names the highway and the location. It carries a mile marker where the state provides one. The response also tells you whether each feed answered, with a <code>source_status</code> field.</p>
    <pre style="overflow-x:auto;background:#f4f7f5;border:1px solid #e0e6e2;border-radius:8px;padding:12px;font-size:13px;line-height:1.5">GET https://api.milecheckapp.com/v1/alerts?state=WA&amp;apikey=YOUR_KEY

{ "state": "WA",
  "counts": { "conditions": 16, "incidents": 184 },
  "conditions": [ ... ],
  "incidents": [ ... ],
  "source_status": { "conditions": "live", "incidents": "live" } }</pre>
    <p>The endpoints, the fields and the error codes are on ${'<a href="/api/">the API page</a>'}.</p>
    <h2>Coverage, with its limits</h2>
    <p>Alerts come from a live state feed in all 50 states. Hawaii's feed lists work zones only. A state can show no open incident at a given moment, and the response says so. Each state's agency and source is listed on ${'<a href="/data-sources/">the data sources page</a>'}. How often a feed refreshes depends on the state.</p>
    <h2>What it costs</h2>
    <p>A test key runs 14 days at 100 calls a day. The Business plan is $299 a month for 100,000 calls. Mile markers are sold separately as a data license. Details are on ${'<a href="/api/plan/">the plans page</a>'}.</p>
    <h2>If you only need one state</h2>
    <p>Go to that state's 511 developer page. It is free for most states, and you will deal with that state's limits and format yourself.</p>
    <div class="cta">
      <h3>Get a test key</h3>
      <p>Email sales@milecheckapp.com for a 14-day test key, or read the endpoint reference first.</p>
      <div class="btns"><a class="primary" href="/api/">API reference</a><a class="ghost" href="/api/plan/">Plans and prices</a></div>
    </div>`,
    rel: [['/api/', 'MileCheck API'], ['/iteris-cleardata-road511-alternative/', 'Is there an alternative to Iteris ClearData or Road511?'], ['/data-sources/', 'Where MileCheck gets its road data'], ['/blog/dot-alerts-api-for-fleets.html', 'A DOT alerts API for fleets'], ['/what-is-511/', 'What is 511?']],
    noApp: true,
  },
  {
    slug: 'iteris-cleardata-road511-alternative',
    h1: 'Is there an alternative to Iteris ClearData or Road511?',
    title: 'Is There an Alternative to Iteris ClearData or Road511? | MileCheck',
    desc: `Iteris ClearData, Road511 and MileCheck compared on public pricing, API access and coverage. Public pages read ${CHECKED}.`,
    lede: `Yes. Which one fits depends on what data you need. All three turn state DOT traffic data into a format software can read. We read each company's public pages on ${CHECKED}. When a page does not say something, we write "not publicly documented". That does not mean the company does not offer it.`,
    body: `
    <h2>Iteris ClearData</h2>
    <p>Iteris sells ClearData as a subscription data feed or API for the US and Canada (${link('https://www.iteris.com/oursolutions/traffic-incident-data/cleardata', 'Iteris ClearData page')}). It covers incident data and speed data.</p>
    <p>Iteris says its incidents come from more than 200 sources, including agencies and verified crowdsourced reports. Its speeds come from GPS probes. MileCheck has no probe speed data.</p>
    <p>The public page does not list a price, API documentation or a free trial. Price, documentation and trial are not publicly documented. The call to action on the page is "Talk to an Expert".</p>
    <h2>Road511</h2>
    <p>Road511 lists a free 14-day trial with no credit card, and a Starter plan at $29 a month with a limit of 50,000 requests a day (${link('https://road511.com', 'road511.com')}). The page also lists a $99 Pro plan and a $279 Enterprise plan.</p>
    <p>Its site lists 64 jurisdictions. It lists events, cameras, truck routing and bridge clearance data. The public page does not mention mile markers.</p>
    <p>Road511's starting price is lower than MileCheck's.</p>
    <h2>MileCheck</h2>
    <p>Alerts come from a live state DOT feed in all 50 states and in British Columbia, Alberta and Manitoba. Hawaii's feed lists work zones only.</p>
    <p>Each alert names the highway. It carries a mile marker when the state provides one. When the state does not, the API can add an estimated mile marker from our own mile marker file, and it marks that value as an estimate.</p>
    <p>Cameras are listed in 46 states and 5 provinces. The mile marker file, for 50 states and 10 provinces and territories, can also be licensed on its own.</p>
    <p>A test key runs 14 days at 100 calls a day, and we issue it by email. The Business plan is $299 a month for 100,000 calls a day. We do not offer an uptime guarantee yet. The endpoints and fields are on ${'<a href="/api/">the API page</a>'}, and the plans are on ${'<a href="/api/plan/">the plans page</a>'}.</p>
    <h2>Which one fits?</h2>
    <p>Iteris ClearData is worth a look if you need GPS probe speed data, or incident reports that include crowdsourced sources, or you buy as an agency.</p>
    <p>Road511 is worth a look if you want a posted price and a self-serve trial, or you need truck routing.</p>
    <p>MileCheck is worth a look if you need mile markers on alerts, where the state gives one or as an estimate, or the mile marker file by itself.</p>
    <p>Prices and features change. Check each company's own page before you buy.</p>
    <div class="cta">
      <h3>Get a MileCheck test key</h3>
      <p>Email sales@milecheckapp.com for a 14-day test key, or read the endpoint reference first.</p>
      <div class="btns"><a class="primary" href="/api/">API reference</a><a class="ghost" href="/api/plan/">Plans and prices</a></div>
    </div>`,
    rel: [['/one-api-for-every-states-511-road-alerts/', "Is there one API for every state's 511 road alerts?"], ['/api/', 'MileCheck API'], ['/data-sources/', 'Where MileCheck gets its road data']],
  },
];

const tpl = readFileSync(tplPath, 'utf8');
const A = tpl.slice(0, tpl.indexOf('  <title>'));
const B = tpl.slice(tpl.indexOf('  <link rel="icon"'), tpl.indexOf('  <script type="application/ld+json">'));
const C = tpl.slice(tpl.indexOf('  <style>'), tpl.indexOf('  <article class="art journey-content">'));
const D = tpl.slice(tpl.indexOf('  </article>'));
const abs = s => s.replace(/href="\.\.\//g, 'href="/').replace(/src="\.\.\//g, 'src="/');

for (const p of PAGES) {
  const url = `https://milecheckapp.com/${p.slug}/`;
  const body = p.body.replace('{{CTA}}', cta(p.slug));
  const ld = [
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: [{ '@type': 'Question', name: p.h1, acceptedAnswer: { '@type': 'Answer', text: p.lede.replace(/<[^>]+>/g, '') } }] },
    { '@context': 'https://schema.org', '@type': 'Article', headline: p.h1, author: { '@id': 'https://milecheckapp.com/#org' }, publisher: { '@id': 'https://milecheckapp.com/#org' }, mainEntityOfPage: url, '@id': `${url}#article`, datePublished: '2026-10-31', dateModified: '2026-10-31', description: p.desc },
  ];
  const html = A +
    `  <title>${esc(p.title)}</title>\n  <meta name="description" content="${esc(p.desc)}">\n  <link rel="canonical" href="${url}">\n` +
    `  <meta property="og:title" content="${esc(p.title)}">\n  <meta property="og:description" content="${esc(p.desc)}">\n  <meta property="og:url" content="${url}">\n  <meta property="og:type" content="article">\n  <meta name="twitter:card" content="summary">\n  <meta name="twitter:title" content="${esc(p.title)}">\n  <meta name="twitter:description" content="${esc(p.desc)}">\n` +
    abs(B) + ld.map(o => `  <script type="application/ld+json">${JSON.stringify(o)}</script>\n`).join('') +
    abs(C) +
    `  <article class="art journey-content">\n    <div class="eyebrow">Road data questions</div>\n    <h1>${esc(p.h1)}</h1>\n    <p class="lede">${p.lede}</p>\n    <p class="g-related" style="margin:0 0 6px">Checked ${CHECKED}.</p>\n${body}\n    ${related(p.rel)}\n` +
    abs(D);
  mkdirSync(p.slug, { recursive: true });
  writeFileSync(`${p.slug}/index.html`, html);
  console.log('wrote', p.slug);
}

// Retitle the Google Maps page as the question people type. URL stays.
{
  let s = readFileSync(tplPath, 'utf8');
  s = s.replaceAll('Can Google Maps Show Mile Markers?', 'Does Google Maps Show Mile Markers?')
       .replaceAll('Can Google Maps show mile markers?', 'Does Google Maps show mile markers?');
  const desc = `No. Google's map layer list has no mile marker layer. What Google Maps shows instead, and what shows your mile marker. Checked ${CHECKED}.`;
  s = s.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(desc)}">`)
       .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(desc)}">`)
       .replace(/<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${esc(desc)}">`);
  const lede = `<p class="lede">No. Google's help page for map layers lists map, satellite, terrain, traffic, transit, biking, Street View, globe view, air quality, travel time and wildfires. Mile markers are not on the list (${link('https://support.google.com/maps/answer/3092439', 'Google Maps Help')}, checked ${CHECKED}).</p>`;
  s = s.replace(/<p class="lede">[\s\S]*?<\/p>/, lede);
  if (!s.includes('/does-apple-maps-show-mile-markers/')) s = s.replace('<p class="g-related">Related: <a href="../mile-markers-vs-exit-numbers/">',
    '<p class="g-related">Related: <a href="/does-apple-maps-show-mile-markers/">Does Apple Maps show mile markers?</a> · <a href="../mile-markers-vs-exit-numbers/">');
  s = s.replace('<meta property="og:title" content="Does Google Maps Show Mile Markers? | MileCheck">', '<meta property="og:title" content="Does Google Maps Show Mile Markers? | MileCheck">');
  writeFileSync(tplPath, s);
  console.log('retitled', tplPath);
}
