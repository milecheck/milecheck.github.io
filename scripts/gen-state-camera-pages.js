// Generates /cameras/<state-slug>/index.html for each camera state — a live map
// of that state's highway cameras + SEO content, targeting "[state] traffic
// cameras / DOT cameras / road cameras". One template, per-state content below.
// Run: node scripts/gen-state-camera-pages.js
const fs = require('fs');
const path = require('path');

// bounds: [[minLat,minLon],[maxLat,maxLon]]  ·  notable = HTML (links to corridors/passes where they exist)
const STATES = [
  { slug:'washington', code:'WA', name:'Washington', dot:'WSDOT', bounds:'[[45.54,-124.85],[49,-116.91]]',
    blurb:`Washington State DOT runs one of the most-watched camera networks in the country, from the Seattle–Tacoma freeways to the mountain passes and the Washington State Ferries terminals.`,
    notable:`The big ones are <a href="../../corridors/i-5/">I-5</a> through the Seattle metro, <a href="../../corridors/i-90/">I-90</a> over <a href="../../passes/snoqualmie/">Snoqualmie Pass</a>, US-2 over <a href="../../passes/stevens/">Stevens Pass</a>, and the ferry-terminal cameras on Puget Sound.` },
  { slug:'oregon', code:'OR', name:'Oregon', dot:'ODOT (TripCheck)', bounds:'[[41.99,-124.57],[46.29,-116.46]]',
    blurb:`Oregon DOT's TripCheck cameras cover the Willamette Valley, the Cascade passes, and the high desert of Eastern Oregon.`,
    notable:`Watch <a href="../../corridors/i-5/">I-5</a> from Portland south over <a href="../../passes/siskiyou/">Siskiyou Summit</a>, plus I-84 through the Columbia Gorge and the mountain passes on US-97 and US-26.` },
  { slug:'california', code:'CA', name:'California', dot:'Caltrans', bounds:'[[32.5,-124.5],[42,-114.1]]',
    blurb:`Caltrans operates thousands of cameras statewide — the most of any state on this map — covering everything from Bay Area and LA freeways to the Sierra Nevada passes.`,
    notable:`See <a href="../../corridors/i-5/">I-5</a> the length of the state including <a href="../../passes/grapevine/">the Grapevine</a>, <a href="../../corridors/i-80/">I-80</a> over <a href="../../passes/donner/">Donner Pass</a>, <a href="../../passes/cajon/">Cajon Pass</a> on I-15, and US-101 up the coast.` },
  { slug:'utah', code:'UT', name:'Utah', dot:'UDOT', bounds:'[[37,-114.05],[42,-109.04]]',
    blurb:`Utah DOT's cameras cover the Wasatch Front, the canyons, and the interstate crossings of the high desert.`,
    notable:`Watch <a href="../../corridors/i-80/">I-80</a> through <a href="../../passes/parleys/">Parleys Canyon</a> toward Park City, I-15 up the Wasatch Front, and the Cottonwood and Provo canyon roads to the ski areas.` },
  { slug:'montana', code:'MT', name:'Montana', dot:'MDT', bounds:'[[44.36,-116.05],[49,-104.04]]',
    blurb:`Montana DOT cameras cover the mountain passes and the long interstate stretches across Big Sky Country, where winter wind and snow are the main story.`,
    notable:`Watch <a href="../../corridors/i-90/">I-90</a> across the western mountains, I-15 north to the Canadian border, and I-94 across the eastern plains.` },
  { slug:'arizona', code:'AZ', name:'Arizona', dot:'ADOT (AZ511)', bounds:'[[31.33,-114.82],[37,-109.04]]',
    blurb:`Arizona DOT's AZ511 cameras cover the Phoenix and Tucson metros, the mountain routes to Flagstaff, and the desert interstates where summer dust storms strike.`,
    notable:`Watch <a href="../../corridors/i-10/">I-10</a> across the southern desert, I-17 up to Flagstaff, I-40 across the north, and the Phoenix-area Loop 101 and Loop 202.` },
  { slug:'nevada', code:'NV', name:'Nevada', dot:'NDOT (NVRoads)', bounds:'[[35,-120.01],[42,-114.04]]',
    blurb:`Nevada DOT's NVRoads cameras cover the Las Vegas and Reno metros and the long desert interstates between them.`,
    notable:`Watch I-15 from Las Vegas toward California, <a href="../../corridors/i-80/">I-80</a> across the north through Reno, and US-95 through the desert.` },
  { slug:'ohio', code:'OH', name:'Ohio', dot:'ODOT (OHGO)', bounds:'[[38.40,-84.82],[42.00,-80.52]]',
    blurb:`Ohio DOT's OHGO network is one of the densest camera systems in the Midwest, covering the Columbus, Cleveland, and Cincinnati metros and the interstates between them.`,
    notable:`Watch <a href="../../corridors/i-90/">I-90</a> and <a href="../../corridors/i-80/">I-80</a> (the Ohio Turnpike) across the north, plus I-70, I-71, I-75, and the I-270 and I-275 beltways.` },
  { slug:'wisconsin', code:'WI', name:'Wisconsin', dot:'WisDOT (511WI)', bounds:'[[42.49,-92.89],[47.08,-86.80]]',
    blurb:`Wisconsin DOT's 511WI cameras cover the Milwaukee and Madison metros and the interstates where lake-effect and winter snow hit hard.`,
    notable:`Watch <a href="../../corridors/i-90/">I-90</a>, I-94, and I-43 through the southern half of the state.` },
  { slug:'new-york', code:'NY', name:'New York', dot:'NYSDOT (511NY)', bounds:'[[40.48,-79.77],[45.02,-71.86]]',
    blurb:`New York State DOT's 511NY cameras cover the New York City metro, the Thruway, and the snowy Great Lakes and Adirondack corridors upstate.`,
    notable:`Watch I-87 (the Thruway) and <a href="../../corridors/i-90/">I-90</a> across the state, plus <a href="../../corridors/i-95/">I-95</a> and the NYC-area crossings.` },
  { slug:'pennsylvania', code:'PA', name:'Pennsylvania', dot:'PennDOT (511PA)', bounds:'[[39.72,-80.52],[42.27,-74.69]]',
    blurb:`PennDOT's 511PA cameras cover the Philadelphia and Pittsburgh metros, the Pennsylvania Turnpike, and the mountain interstates in between — more than 1,300 highway cameras statewide.`,
    notable:`Watch I-76 (the Turnpike), <a href="../../corridors/i-80/">I-80</a> across the north, <a href="../../corridors/i-95/">I-95</a> through Philadelphia, and I-79 and I-81 through the mountains.` },
  { slug:'georgia', code:'GA', name:'Georgia', dot:'GDOT (511GA)', bounds:'[[30.36,-85.61],[35,-80.84]]',
    blurb:`Georgia DOT's 511GA network is heavy around metro Atlanta — one of the most camera-covered metros in the Southeast — plus the interstates statewide.`,
    notable:`Watch I-75, I-85, and the I-285 Perimeter through Atlanta, I-20 east–west, and <a href="../../corridors/i-95/">I-95</a> along the coast.` },
  { slug:'louisiana', code:'LA', name:'Louisiana', dot:'DOTD (511LA)', bounds:'[[28.93,-94.04],[33.02,-88.82]]',
    blurb:`Louisiana DOTD's 511LA cameras cover the New Orleans and Baton Rouge metros and the Gulf Coast interstates prone to hurricanes and flooding.`,
    notable:`Watch <a href="../../corridors/i-10/">I-10</a> and I-12 across the south, and I-49 up the middle of the state.` },
  { slug:'south-carolina', code:'SC', name:'South Carolina', dot:'SCDOT (511SC)', bounds:'[[32.03,-83.35],[35.22,-78.54]]',
    blurb:`South Carolina DOT's 511SC cameras cover the Upstate, the Midlands, and the coast, including the hurricane-evacuation interstates.`,
    notable:`Watch I-26 from the mountains to Charleston, <a href="../../corridors/i-95/">I-95</a> along the coast, and I-85 through the Upstate.` },
  { slug:'florida', code:'FL', name:'Florida', dot:'FDOT (FL511)', bounds:'[[24.40,-87.63],[31.00,-80.03]]',
    blurb:`Florida DOT's FL511 network is one of the largest on this map — thousands of cameras across the metros, the Turnpike, and the hurricane-prone coasts.`,
    notable:`Watch I-4 through Orlando and Tampa, <a href="../../corridors/i-95/">I-95</a> down the east coast, I-75 and <a href="../../corridors/i-10/">I-10</a>, and Florida's Turnpike.` },
  { slug:'michigan', code:'MI', name:'Michigan', dot:'MDOT (Mi Drive)', bounds:'[[41.70,-90.42],[48.30,-82.12]]',
    blurb:`Michigan DOT's Mi Drive cameras cover metro Detroit and the interstates across the Lower Peninsula, where lake-effect snow is the winter hazard.`,
    notable:`Watch I-75, I-94, and I-96 through Detroit, US-23, and the M-59 corridor.` },
  { slug:'alabama', code:'AL', name:'Alabama', dot:'ALDOT (ALGO Traffic)', bounds:'[[30.22,-88.47],[35.01,-84.89]]',
    blurb:`Alabama DOT's ALGO Traffic network covers the Birmingham, Montgomery, Huntsville, and Mobile metros and the interstates statewide.`,
    notable:`Watch I-65 north–south, I-20 and I-59 through Birmingham, I-85 to Montgomery, and <a href="../../corridors/i-10/">I-10</a> on the Gulf Coast.` },
  { slug:'south-dakota', code:'SD', name:'South Dakota', dot:'SDDOT (SD511)', bounds:'[[42.48,-104.06],[45.94,-96.43]]',
    blurb:`South Dakota DOT's SD511 cameras cover the interstate crossings of the plains, where ground blizzards and wind shut roads with no mountains in sight.`,
    notable:`Watch <a href="../../corridors/i-90/">I-90</a> east–west across the state and I-29 north–south.` },
  { slug:'alaska', code:'AK', name:'Alaska', dot:'AKDOT (511 Alaska)', bounds:'[[54.5,-170],[71.5,-129.5]]',
    blurb:`Alaska DOT's cameras cover the highways around Anchorage, Fairbanks, and the mountain routes between — where winter is long and conditions change fast.`,
    notable:`Watch the Glenn Highway, the Parks Highway toward Denali, and the Seward Highway south of Anchorage.` },
  { slug:'maine', code:'ME', name:'Maine', dot:'MaineDOT (511 Maine)', bounds:'[[43.06,-71.08],[47.46,-66.95]]',
    blurb:`Maine DOT's cameras cover the interstates and the coastal routes, where nor'easters and heavy snow are the winter concern.`,
    notable:`Watch <a href="../../corridors/i-95/">I-95</a> and I-295 through Portland and north, plus US-1 along the coast.` },
  { slug:'new-hampshire', code:'NH', name:'New Hampshire', dot:'NHDOT (New England 511)', bounds:'[[42.70,-72.56],[45.31,-70.70]]',
    blurb:`New Hampshire DOT's cameras cover the interstates and the White Mountain routes, some of the snowiest driving in New England.`,
    notable:`Watch I-93 through the state and the mountains, <a href="../../corridors/i-95/">I-95</a> on the seacoast, and I-89.` },
  { slug:'vermont', code:'VT', name:'Vermont', dot:'VTrans (New England 511)', bounds:'[[42.73,-73.43],[45.02,-71.46]]',
    blurb:`Vermont's cameras cover the interstates and the mountain gaps, where Green Mountain snow closes roads through the winter.`,
    notable:`Watch I-89 and I-91 through the state and its mountain passes.` },
];

const HUB_CAMS = 25; // "25 states" phrasing used across the site

// States that also have a /bridges/<slug>/ page — interlink camera pages to
// bridges (GSC 2026-08-13: /bridges/ converts at 27.4% CTR, 3x the homepage,
// but only 146 impressions site-wide — an indexing/interlink gap, not a
// content problem). Kept in sync manually with the bridges/ directory.
const BRIDGE_STATES = new Set(['washington','oregon','california','ohio','wisconsin',
  'new-york','pennsylvania','louisiana','south-carolina','florida','michigan','alabama','maine']);

function faq(s){
  return [
    [`Where can I watch live ${s.name} traffic cameras?`,
      `Right here — the <a href="#comap">map above</a> shows live ${s.dot} highway cameras across ${s.name}, each tagged with its route and mile marker so you know which stretch you're seeing. For cameras beyond ${s.name}, see <a href="../">every highway camera in ${HUB_CAMS} states</a>.`],
    [`Are ${s.name} DOT traffic cameras free?`,
      `Yes. ${s.dot} publishes its traffic cameras publicly, and MileCheck puts them on one map for free — no account, no sign-up. To have the nearest camera follow you as you drive, the <a href="https://apps.apple.com/us/app/milecheck/id6759212851" target="_blank" rel="noopener">MileCheck app</a> does it hands-free on CarPlay and Android Auto.`],
    [`Which highways have cameras in ${s.name}?`, s.notable],
    [`How often do ${s.name} traffic cameras update?`,
      `Most ${s.dot} cameras refresh every minute or two, straight from the DOT. Open the app image full-size by tapping it on the map above. Weather, snow, and traffic can all change between refreshes, so always drive to the conditions you actually see.`],
  ];
}

function faqJsonLd(s){ return JSON.stringify({'@context':'https://schema.org','@type':'FAQPage','mainEntity':faq(s).map(([q,a])=>({'@type':'Question','name':q,'acceptedAnswer':{'@type':'Answer','text':a.replace(/<[^>]+>/g,'')}}))}); }
function crumbJsonLd(s){ return JSON.stringify({'@context':'https://schema.org','@type':'BreadcrumbList','itemListElement':[{'@type':'ListItem','position':1,'name':'MileCheck','item':'https://milecheckapp.com/'},{'@type':'ListItem','position':2,'name':'Cameras','item':'https://milecheckapp.com/cameras/'},{'@type':'ListItem','position':3,'name':s.name+' Cameras','item':'https://milecheckapp.com/cameras/'+s.slug+'/'}]}); }

function page(s){
  const faqHtml=faq(s).map(([q,a])=>`    <details><summary>${q}</summary><p>${a}</p></details>`).join('\n');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta name="apple-itunes-app" content="app-id=6759212851">
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${s.name} Traffic Cameras — Live ${s.dot} Highway Cams | MileCheck</title>
  <meta name="description" content="Watch live ${s.name} traffic cameras on one map — ${s.dot} highway and road cameras, each tagged with route and mile marker. See the road before you drive it. Free, no account.">
  <link rel="canonical" href="https://milecheckapp.com/cameras/${s.slug}/">
  <meta property="og:title" content="${s.name} Traffic Cameras — Live | MileCheck">
  <meta property="og:description" content="Live ${s.name} highway cameras on one map, each tagged with route and mile marker.">
  <meta property="og:image" content="https://milecheckapp.com/images/og-banner-light.png">
  <meta property="og:url" content="https://milecheckapp.com/cameras/${s.slug}/">
  <meta property="og:type" content="website">
  <link rel="icon" type="image/png" href="../../images/favicon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../../style.css">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <link rel="stylesheet" href="https://unpkg.com/leaflet-gesture-handling@1.2.2/dist/leaflet-gesture-handling.min.css">
  <script src="https://unpkg.com/leaflet-gesture-handling@1.2.2/dist/leaflet-gesture-handling.min.js"></script>
  <script type="application/ld+json">${faqJsonLd(s)}</script>
  <script type="application/ld+json">${crumbJsonLd(s)}</script>
  <style>
    .co-hero{max-width:1160px;margin:0 auto;padding:34px 20px 6px;}
    .co-hero .eyebrow{font-size:13px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:#0f7a4f;margin-bottom:6px;}
    .co-hero h1{font-size:clamp(30px,5vw,46px);line-height:1.08;margin:0 0 10px;}
    .co-hero .sub{font-size:17px;line-height:1.55;color:#3a444d;max-width:760px;}
    .co-stats{display:flex;flex-wrap:wrap;gap:10px;margin:16px 0 0;}
    .co-stat{border:1px solid #E5E5E5;border-radius:12px;background:#fff;padding:10px 16px;min-width:120px;}
    .co-stat .n{font-size:24px;font-weight:800;color:#0E1116;line-height:1;}
    .co-stat .n.live{color:#0f7a4f;}
    .co-stat .l{font-size:12.5px;color:#5b6670;margin-top:4px;font-weight:600;}
    .co-wrap{max-width:1160px;margin:16px auto 0;padding:0 20px;}
    #comap{width:100%;height:66vh;min-height:460px;border-radius:16px;border:1px solid #E5E5E5;overflow:hidden;scroll-margin-top:76px;}
    .co-bs{position:absolute;top:12px;left:56px;z-index:800;background:rgba(255,255,255,.94);border:1px solid #E5E5E5;border-radius:10px;padding:8px 14px;font-weight:800;font-size:14px;color:#0f7a4f;}
    .co-card{position:absolute;top:12px;right:12px;width:min(300px,44%);max-height:calc(100% - 24px);overflow:auto;z-index:900;background:#fff;border:1px solid #E5E5E5;border-radius:12px;box-shadow:0 8px 28px rgba(0,0,0,.20);padding:12px 14px;display:none;}
    .co-card .cx{position:absolute;top:8px;right:8px;border:0;background:#f0f0ee;border-radius:50%;width:26px;height:26px;cursor:pointer;font-size:16px;line-height:1;color:#5b6670;}
    .co-card .cc-title{font-weight:800;font-size:15px;padding-right:26px;line-height:1.3;}
    .co-card .cc-meta{font-size:12.5px;color:#5b6670;margin-top:3px;}
    .co-card img.cc-img{width:100%;border-radius:8px;margin-top:8px;display:block;background:#f0f0ee;min-height:40px;}
    .co-guide{max-width:1000px;margin:40px auto 0;padding:0 20px;}
    .co-guide h2{font-size:26px;margin:0 0 6px;}
    .co-guide p{color:#3a444d;font-size:16px;line-height:1.65;margin:0 0 14px;}
    .co-guide a{color:#0f7a4f;font-weight:700;text-decoration:none;}
    .co-faq{max-width:1000px;margin:24px auto 0;padding:0 20px;}
    .co-faq h2{font-size:24px;margin:0 0 14px;}
    .co-faq details{border:1px solid #E5E5E5;border-radius:12px;background:#fff;padding:14px 18px;margin-bottom:10px;}
    .co-faq summary{font-weight:700;font-size:16px;cursor:pointer;color:#0E1116;}
    .co-faq p{color:#3a444d;font-size:15px;line-height:1.6;margin:10px 0 0;}
    .co-faq a{color:#0f7a4f;font-weight:700;text-decoration:none;}
    .co-cta{max-width:1000px;margin:24px auto 40px;padding:26px 22px;border:1px solid #E5E5E5;border-radius:16px;background:linear-gradient(135deg,#f4fbf7,#ffffff);text-align:center;}
    .co-cta h2{font-size:24px;margin:0 0 8px;}
    .co-cta p{color:#3a444d;font-size:15.5px;line-height:1.6;margin:0 auto 16px;max-width:560px;}
    .co-cta .btns{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;}
    .co-cta a{display:inline-block;padding:11px 20px;border-radius:10px;font-weight:700;font-size:14.5px;text-decoration:none;}
    .co-cta a.primary{background:#0f7a4f;color:#fff;}
    .co-cta a.ghost{border:1px solid #0F1419;color:#0F1419;}
    .co-related{max-width:1000px;margin:0 auto 40px;padding:0 20px;color:#5b6670;font-size:14px;}
    .co-related a{color:#0f7a4f;font-weight:700;text-decoration:none;}
    @media(max-width:600px){ #comap{height:58vh;} .co-bs{font-size:12.5px;padding:6px 10px;} .co-card{width:60%;} }
  </style>
</head>
<body>

  <header class="site-header">
    <div class="container header-inner">
      <a href="../../index.html" class="brand" style="display:inline-flex;align-items:center;gap:9px;"><img src="../../assets/app-icon-60.png" alt="" style="width:28px;height:28px;border-radius:7px;flex-shrink:0;">MileCheck</a>
      <button class="nav-toggle" aria-label="Menu"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0F1419" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg></button>
      <nav class="primary-nav">
        <a href="../../index.html">Home</a>
        <a href="../../maps/">Maps</a>
        <a href="../../cameras/" class="active">Cameras</a>
        <a href="../../states/">United States</a>
        <a href="../../canada/">Canada</a>
        <a href="../../index.html#story">Story</a>
        <a href="../../index.html#b2b">B2B</a>
        <a href="../../blog/">Blog</a>
        <a href="https://apps.apple.com/us/app/milecheck/id6759212851" class="nav-cta" target="_blank" rel="noopener">Get the app</a>
      </nav>
    </div>
  </header>

  <div class="co-hero">
    <div class="eyebrow">Live traffic cameras · ${s.name} · ${s.dot}</div>
    <h1>${s.name} traffic cameras, live</h1>
    <p class="sub">See the actual road before you drive it. Live ${s.dot} highway cameras across ${s.name} on one map, each tagged with its route and mile marker. Free, no account — tap any camera for the latest image.</p>
    <div class="co-stats">
      <div class="co-stat"><div class="n live" id="statCams">—</div><div class="l">live cameras in ${s.name}</div></div>
      <div class="co-stat"><div class="n" style="font-size:16px;padding-top:4px">${s.dot.split('(')[0].trim()}</div><div class="l">camera source</div></div>
    </div>
  </div>

  <div class="co-wrap">
    <div style="position:relative;">
      <div id="comap"></div>
      <div class="co-bs" id="coStatus">Loading live ${s.name} cameras…</div>
      <div class="co-card" id="coCard"></div>
    </div>
  </div>

  <section class="co-guide">
    <h2>Live cameras across ${s.name}</h2>
    <p>${s.blurb}</p>
    <p>${s.notable}</p>
    <p>Every camera on this map comes straight from ${s.dot} and is tagged with the route and mile marker where the DOT provides it, so you can tell exactly which stretch of road you're looking at. Tap a camera dot to open its latest image; tap the image to see it full-size.</p>
  </section>

  <section class="co-faq">
    <h2>${s.name} camera questions, answered</h2>
${faqHtml}
  </section>

  <div class="co-cta">
    <h2>The nearest ${s.name} camera, right as you drive</h2>
    <p>MileCheck shows the nearest camera and your exact mile marker in real time as you drive ${s.name}'s highways, plus live DOT alerts on your route. Free to start, works offline, runs on CarPlay and Android Auto.</p>
    <div class="btns">
      <a class="primary" href="https://apps.apple.com/us/app/milecheck/id6759212851" target="_blank" rel="noopener">iOS App Store</a>
      <a class="ghost" href="https://play.google.com/store/apps/details?id=app.milecheck.mobile" target="_blank" rel="noopener">Google Play</a>
    </div>
  </div>

  <p class="co-related">More: <a href="../">all highway cameras</a> · <a href="../../passes/">mountain passes</a> · <a href="../../corridors/">interstate corridors</a>${BRIDGE_STATES.has(s.slug) ? ` · <a href="../../bridges/${s.slug}/">${s.name} drawbridges</a>` : ''} · <a href="../../maps/">all maps</a></p>

  <footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-col footer-col-brand">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;"><img src="../../assets/app-icon-60.png" alt="MileCheck" style="width:36px;height:36px;border-radius:9px;flex-shrink:0;"><p class="footer-brand" style="margin-bottom:0;">MileCheck</p></div>
          <p class="footer-tagline">Mile markers in all 50 US states.</p>
        </div>
        <div class="footer-col">
          <p class="footer-label">Get the app</p>
          <ul class="footer-list">
            <li><a href="https://apps.apple.com/us/app/milecheck/id6759212851" target="_blank" rel="noopener">iOS App Store</a></li>
            <li><a href="https://play.google.com/store/apps/details?id=app.milecheck.mobile" target="_blank" rel="noopener">Google Play</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <p class="footer-label">Live maps</p>
          <ul class="footer-list">
            <li><a href="../">Highway cameras</a></li>
            <li><a href="../../closures/">Road closures map</a></li>
            <li><a href="../../fire/">Wildfire map</a></li>
            <li><a href="../../maps/">All maps</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <p class="footer-label">Help &amp; legal</p>
          <ul class="footer-list">
            <li><a href="mailto:feedback@milecheckapp.com">Send feedback</a></li>
            <li><a href="https://milecheck.github.io/milecheck-privacy/">Privacy policy</a></li>
          </ul>
        </div>
      </div>
      <p class="footer-fineprint">&copy; 2026 MileCheck LLC. Camera data: ${s.dot} via MileCheck. Always drive to conditions and follow posted signs.</p>
    </div>
  </footer>

<script>(function(){var t=document.querySelector(".nav-toggle"),n=document.querySelector(".primary-nav");if(t&&n){t.addEventListener("click",function(){n.classList.toggle("open");});document.addEventListener("click",function(e){if(!e.target.closest(".header-inner"))n.classList.remove("open");})}})();</script>

<script>
const WORKER='https://milepost-proxy.leahgerber93.workers.dev';
const CODE=${JSON.stringify(s.code)};
const DOT=${JSON.stringify(s.dot.split('(')[0].trim())};
// Keep highway + ferry cameras; drop city-street cams (matches the main cameras page).
const ROAD_RE=/^(I|US|SR|SH|WA|OR|UT|MT|AZ|AL|NV|WI|NY|LA|GA|SC|CA|SD|FL|MI|VT|NH|ME|PA|M|Loop|\\d)[- ]?\\d*/i;
const AK_HWY_RE=/highway|cutoff|expressway/i;
const FERRY_RE=/ferr/i;
const map=L.map('comap',{gestureHandling:('ontouchstart' in window),scrollWheelZoom:true});
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',{attribution:'Esri, USGS · ${s.name} cameras: ${s.dot} via MileCheck',maxZoom:16}).addTo(map);
map.fitBounds(${s.bounds});
const camLayer=L.layerGroup().addTo(map);
let CAMS=[];
function esc(x){return String(x==null?'':x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
const cardEl=document.getElementById('coCard');
function showCard(html){cardEl.innerHTML='<button class="cx" aria-label="Close">×</button>'+html;cardEl.style.display='block';cardEl.querySelector('.cx').onclick=function(){cardEl.style.display='none';};}
function camCard(c){const bust=c.img+(c.img.includes('?')?'&':'?')+'t='+Date.now();return '<div class="cc-title">'+esc(c.title)+'</div><div class="cc-meta">'+esc(c.route||'')+(c.mp>0?' · MP '+Math.round(c.mp):'')+' · '+DOT+'</div><a href="'+c.img+'" target="_blank" rel="noopener" title="Open full image"><img class="cc-img" src="'+bust+'" alt="Live: '+esc(c.title)+'" onerror="this.alt=\\'image unavailable\\'"></a>';}
function thin(items,cellPx){const z=map.getZoom();if(z>=11||items.length<80)return items;const cell=cellPx*360/(256*Math.pow(2,z));const seen=new Set(),out=[];for(const it of items){const k=Math.round(it.lat/cell)+'|'+Math.round(it.lon/cell);if(seen.has(k))continue;seen.add(k);out.push(it);}return out;}
function draw(){camLayer.clearLayers();const b=map.getBounds();const cferry=(r)=>FERRY_RE.test(r);thin(CAMS.filter(c=>b.contains([c.lat,c.lon])),16).forEach(c=>L.circleMarker([c.lat,c.lon],{radius:5,color:'#fff',weight:1.5,fillColor:cferry(c.route)?'#1d6fd1':'#0f7a4f',fillOpacity:.95}).on('click',()=>showCard(camCard(c))).addTo(camLayer));document.getElementById('coStatus').textContent=CAMS.length?('📷 '+CAMS.length+' live cameras in ${s.name}'):'No cameras loaded — try again shortly.';}
let _t=null;map.on('moveend',()=>{clearTimeout(_t);_t=setTimeout(draw,200);});
// The Worker occasionally 503s on the biggest camera states (cold cache); retry a few times.
async function fetchJSON(url,tries){for(let i=0;i<tries;i++){try{const r=await fetch(url);if(r.ok)return await r.json();}catch(e){}if(i<tries-1)await new Promise(res=>setTimeout(res,1200));}return null;}
fetchJSON(WORKER+'/cameras?state='+CODE,4).then(d=>{
  if(!d){document.getElementById('coStatus').textContent='Live cameras are busy right now — please refresh in a moment.';return;}
  CAMS=(d.cameras||[]).filter(c=>c.isActive!==false&&isFinite(+c.lat)&&+c.lat&&c.imageUrl&&(ROAD_RE.test((c.route||'').trim())||FERRY_RE.test(c.route||'')||(CODE==='AK'&&AK_HWY_RE.test(c.route||'')))).map(c=>({lat:+c.lat,lon:+c.lon,title:c.title||'Traffic camera',route:(c.route||'').trim(),mp:c.mile,img:c.imageUrl}));
  document.getElementById('statCams').textContent=CAMS.length;
  draw();
});
</script>

</body>
</html>`;
}

let n=0;
for(const s of STATES){
  const dir=path.join('cameras',s.slug);
  fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,'index.html'),page(s));
  n++;
  console.log('wrote cameras/'+s.slug+'/index.html  ('+s.name+', '+s.dot+')');
}
console.log('\nGenerated '+n+' state camera pages.');
