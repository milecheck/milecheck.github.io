// Generates /corridors/<slug>/index.html for major interstates from one template.
// (I-5 was hand-authored first and shares this exact structure; this generator
// produces the additional corridors.) Each page: live multi-state camera+alert
// map filtered to that interstate, unique guide + FAQ, JSON-LD, app CTA.
// Run: node scripts/gen-corridor-pages.js
const fs = require('fs');
const path = require('path');

const CORRIDORS = [
  {
    slug: 'i-90', name: 'I-90', num: 90, states: ['WA','MT','SD','WI','OH','PA','NY'],
    subtitle: 'Seattle to Boston · the longest interstate', bounds: '[[41.0,-124.5],[49.0,-70.5]]',
    lengthMi: '3,020 mi', highPoint: 'Snoqualmie Pass, 3,015 ft',
    hero: `See I-90 right now — live DOT cameras and real-time conditions along America's longest interstate, from Seattle to Boston, each tagged with its mile marker. Snoqualmie Pass, the northern plains, and the Great Lakes snow belt, all on one map.`,
    segs: [
      ['The longest interstate', `At about 3,020 miles, I-90 is the longest interstate highway in the United States — a continuous route across the northern tier from Seattle to Boston. It climbs the Cascades at Snoqualmie Pass, crosses Montana and the Dakotas, threads the Great Lakes states, and runs the width of New York.`],
      ['Where the weather bites', `Three trouble zones dominate I-90 in winter: Snoqualmie Pass in Washington, where avalanche control and heavy snow close the highway several times a season; the open northern plains of Montana and South Dakota, where ground blizzards and wind drop visibility to nothing; and the Great Lakes snow belt from Wisconsin through Ohio and western New York, where lake-effect bands can bury a stretch of highway in hours.`],
      ['Watch it live while you drive', `The cameras and alerts above are the stationary view — the DOT feeds you'd check before you leave. In the MileCheck app, your exact mile marker and the nearest camera follow you the whole way, hands-free on CarPlay and Android Auto.`],
    ],
    faq: [
      ['Is I-90 open right now?', `The <a href="#comap">live map above</a> shows active closures and incidents along I-90 as red and orange markers, straight from each state DOT. For a full US view, see the <a href="../../closures/">road closures map</a>. The most common winter closures are at <a href="../../passes/snoqualmie/">Snoqualmie Pass</a> and across the northern plains.`],
      ['How long is I-90?', `About 3,020 miles from Seattle to Boston — the longest interstate highway in the country.`],
      ['What mountain passes does I-90 cross?', `The big one is <a href="../../passes/snoqualmie/">Snoqualmie Pass</a> in the Washington Cascades. See all Western <a href="../../passes/">mountain pass conditions</a> for the ones on your route.`],
      ['Where does I-90 get the most snow?', `Snoqualmie Pass, the northern plains of Montana and South Dakota, and the Great Lakes snow belt. Track your exact mile marker through any of it with the <a href="https://apps.apple.com/us/app/milecheck/id6759212851" target="_blank" rel="noopener">MileCheck app</a>.`],
    ],
  },
  {
    slug: 'i-95', name: 'I-95', num: 95, states: ['FL','GA','SC','MD','DE','PA','NY','NH','ME'],
    subtitle: 'Miami to Maine · the East Coast spine', bounds: '[[25.0,-82.5],[47.5,-66.5]]',
    lengthMi: '1,908 mi', highPoint: 'coastal — mostly low elevation',
    hero: `See I-95 right now — live DOT cameras and real-time conditions along the East Coast's main artery, from Miami to the Maine border, each tagged with its mile marker. The busiest interstate in the country, on one map.`,
    segs: [
      ['The busiest interstate', `I-95 runs about 1,908 miles up the entire East Coast and carries more traffic than any other interstate. It links nearly every major city on the seaboard — Miami, Jacksonville, Savannah, the Carolinas, Washington, Baltimore, Philadelphia, New York, Boston, and on into New England.`],
      ['Where it slows down', `Congestion is the everyday story on I-95 — the DC–Baltimore–Philadelphia–New York–Boston stretch is chronically jammed, and a single incident ripples for miles. Weather adds to it: Northeast snow and ice from Pennsylvania to Maine in winter, and Atlantic hurricanes and tropical flooding across the Southeast in late summer, when evacuations can turn the whole corridor northbound.`],
      ['Watch it live while you drive', `The cameras and alerts above are what you'd check before leaving. In the MileCheck app, your exact mile marker and the nearest camera follow you the whole way, hands-free on CarPlay and Android Auto — handy on a road this long and this busy.`],
    ],
    faq: [
      ['Is I-95 open right now?', `The <a href="#comap">live map above</a> shows active closures and incidents along I-95 from the DOT feeds we cover, as red and orange markers. For a full US view, see the <a href="../../closures/">road closures map</a>. (Camera and alert coverage is live in most I-95 states and still filling in along the mid-Atlantic.)`],
      ['How long is I-95?', `About 1,908 miles from Miami, Florida to the Maine–Canada border — and the busiest interstate in the United States.`],
      ['Why is I-95 so congested?', `It's the main route between every major East Coast city, so the DC-to-Boston stretch runs near capacity daily. The <a href="#comap">live cameras above</a> show you which stretches are moving before you commit.`],
      ['Does I-95 close for hurricanes or snow?', `Yes — Atlantic hurricanes and flooding hit the Southeast section, and winter storms ice the Northeast. Track your mile marker through it with the <a href="https://apps.apple.com/us/app/milecheck/id6759212851" target="_blank" rel="noopener">MileCheck app</a>.`],
    ],
  },
  {
    slug: 'i-80', name: 'I-80', num: 80, states: ['CA','NV','UT','IA','OH','PA'],
    subtitle: 'San Francisco to New Jersey · coast to coast', bounds: '[[36.5,-123.0],[42.5,-73.0]]',
    lengthMi: '2,900 mi', highPoint: 'Donner Pass, 7,056 ft',
    hero: `See I-80 right now — live DOT cameras and real-time conditions along the great coast-to-coast route, from San Francisco to the New York area, each tagged with its mile marker. Donner Pass and the Wasatch to the Great Lakes, on one map.`,
    segs: [
      ['Coast to coast', `I-80 runs about 2,900 miles from the San Francisco Bay Area to the edge of New York City, roughly tracing the old transcontinental routes. It crosses the Sierra Nevada, the Nevada and Utah desert, the Wasatch, the Great Plains, and the industrial Midwest.`],
      ['Where the weather bites', `Two mountain crossings define I-80's winter: <a href="../../passes/donner/">Donner Pass</a> in the Sierra Nevada, one of the snowiest stretches of interstate anywhere, and <a href="../../passes/parleys/">Parleys Summit</a> east of Salt Lake City. Beyond the mountains, the open stretches across Nevada, Wyoming, and Nebraska are notorious for wind and ground blizzards that close the road with no mountains in sight.`],
      ['Watch it live while you drive', `The cameras and alerts above are the before-you-leave view. In the MileCheck app, your exact mile marker and the nearest camera follow you over Donner and across the desert, hands-free on CarPlay and Android Auto.`],
    ],
    faq: [
      ['Is I-80 open right now?', `The <a href="#comap">live map above</a> shows active closures and incidents along I-80 as red and orange markers, straight from each state DOT. See the <a href="../../closures/">US closures map</a> for everything. The most common winter closure is <a href="../../passes/donner/">Donner Pass</a>.`],
      ['How long is I-80?', `About 2,900 miles from San Francisco to the New Jersey side of New York City — one of the great coast-to-coast interstates.`],
      ['What is the worst weather spot on I-80?', `<a href="../../passes/donner/">Donner Pass</a> in the Sierra Nevada for snow, and the open high plains of Nevada and Wyoming for wind and ground blizzards. See all <a href="../../passes/">mountain pass conditions</a>.`],
      ['Does Donner Pass close I-80?', `Yes — Caltrans runs chain controls and full closures on I-80 over <a href="../../passes/donner/">Donner Pass</a> throughout the winter. Track your mile marker over the summit with the <a href="https://apps.apple.com/us/app/milecheck/id6759212851" target="_blank" rel="noopener">MileCheck app</a>.`],
    ],
  },
  {
    slug: 'i-10', name: 'I-10', num: 10, states: ['CA','AZ','AL','LA','FL'],
    subtitle: 'Los Angeles to Jacksonville · the southern route', bounds: '[[28.0,-119.0],[35.0,-80.5]]',
    lengthMi: '2,460 mi', highPoint: 'low desert &amp; Gulf Coast',
    hero: `See I-10 right now — live DOT cameras and real-time conditions along the southernmost coast-to-coast interstate, from Los Angeles to Jacksonville, each tagged with its mile marker. Desert dust storms to Gulf Coast hurricanes, on one map.`,
    segs: [
      ['The southern route', `I-10 runs about 2,460 miles across the bottom of the country, from Los Angeles through Phoenix, the West Texas desert, the Gulf Coast, and on to Jacksonville, Florida. It's the warm-weather transcontinental route — but "warm" doesn't mean trouble-free.`],
      ['Where the weather bites', `The desert stretch through Arizona is hit by summer <strong>dust storms</strong> — haboobs that drop visibility to zero in seconds and cause chain-reaction pileups. Along the Gulf Coast, from Louisiana through Alabama to Florida, hurricanes, tropical flooding, and dense fog close or evacuate the highway. The cameras tell you which hazard, if any, is live today.`],
      ['Watch it live while you drive', `The cameras and alerts above are the before-you-leave view. In the MileCheck app, your exact mile marker and the nearest camera follow you across the desert and the coast, hands-free on CarPlay and Android Auto.`],
    ],
    faq: [
      ['Is I-10 open right now?', `The <a href="#comap">live map above</a> shows active closures and incidents along I-10 as red and orange markers, from the state DOT feeds we cover. See the <a href="../../closures/">US closures map</a> for the whole country.`],
      ['How long is I-10?', `About 2,460 miles from Los Angeles to Jacksonville — the southernmost coast-to-coast interstate.`],
      ['Does I-10 close for hurricanes?', `Yes — the Gulf Coast stretch across Louisiana, Alabama, and Florida floods and evacuates for hurricanes. Watch the storms feeding those closures on the <a href="../../weather/">road weather map</a>.`],
      ['What are dust storms on I-10?', `In Arizona, summer "haboobs" can drop visibility to zero on I-10 in seconds — a top cause of desert pileups. The <a href="#comap">live cameras above</a> show current desert visibility; track your mile marker through it with the <a href="https://apps.apple.com/us/app/milecheck/id6759212851" target="_blank" rel="noopener">MileCheck app</a>.`],
    ],
  },
];

function faqJsonLd(c){ return JSON.stringify({'@context':'https://schema.org','@type':'FAQPage','mainEntity':c.faq.map(([q,a])=>({'@type':'Question','name':q,'acceptedAnswer':{'@type':'Answer','text':a.replace(/<[^>]+>/g,'')}}))}); }
function crumbJsonLd(c){ return JSON.stringify({'@context':'https://schema.org','@type':'BreadcrumbList','itemListElement':[{'@type':'ListItem','position':1,'name':'MileCheck','item':'https://milecheckapp.com/'},{'@type':'ListItem','position':2,'name':'Corridors','item':'https://milecheckapp.com/corridors/'},{'@type':'ListItem','position':3,'name':c.name,'item':'https://milecheckapp.com/corridors/'+c.slug+'/'}]}); }

function page(c){
  const segHtml=c.segs.map(([h,p])=>`    <div class="co-seg"><h3>${h}</h3><p>${p}</p></div>`).join('\n');
  const faqHtml=c.faq.map(([q,a])=>`    <details><summary>${q}</summary><p>${a}</p></details>`).join('\n');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta name="apple-itunes-app" content="app-id=6759212851">
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${c.name} Live Traffic Cameras &amp; Road Conditions Right Now | MileCheck</title>
  <meta name="description" content="See ${c.name} right now — live DOT traffic cameras and real-time road conditions along the corridor (${c.subtitle}), each tagged with route and mile marker. Free, no account.">
  <link rel="canonical" href="https://milecheckapp.com/corridors/${c.slug}/">
  <meta property="og:title" content="${c.name} Right Now — Live Cameras &amp; Conditions | MileCheck">
  <meta property="og:description" content="Live ${c.name} traffic cameras and road conditions, each tagged with its mile marker. See the road before you drive it.">
  <meta property="og:image" content="https://milecheckapp.com/images/og-banner-light.png">
  <meta property="og:url" content="https://milecheckapp.com/corridors/${c.slug}/">
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
  <script type="application/ld+json">${faqJsonLd(c)}</script>
  <script type="application/ld+json">${crumbJsonLd(c)}</script>
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
    .co-toggle{display:flex;gap:8px;margin:0 0 12px;flex-wrap:wrap;}
    .co-chip{font-family:inherit;font-size:13.5px;font-weight:700;padding:8px 14px;border:1px solid #E5E5E5;border-radius:10px;background:#FAFAF7;color:#5b6670;cursor:pointer;display:flex;align-items:center;gap:7px;}
    .co-chip.on.cam{background:#0f7a4f;border-color:#0f7a4f;color:#fff;}
    .co-chip.on.alr{background:#DC2626;border-color:#DC2626;color:#fff;}
    .co-dot{width:10px;height:10px;border-radius:50%;display:inline-block;}
    .co-bs{position:absolute;top:12px;left:56px;z-index:800;background:rgba(255,255,255,.94);border:1px solid #E5E5E5;border-radius:10px;padding:8px 14px;font-weight:800;font-size:14px;color:#0f7a4f;}
    .campic{width:100%;border-radius:8px;margin-top:6px;display:block;min-height:40px;background:#f0f0ee;}
    .co-guide{max-width:1000px;margin:40px auto 0;padding:0 20px;}
    .co-guide h2{font-size:26px;margin:0 0 6px;}
    .co-guide .lede{color:#3a444d;font-size:16px;line-height:1.6;margin:0 0 22px;}
    .co-seg{border:1px solid #E5E5E5;border-radius:14px;background:#fff;padding:20px 22px;margin-bottom:14px;}
    .co-seg h3{font-size:19px;margin:0 0 4px;}
    .co-seg p{color:#3a444d;font-size:15px;line-height:1.6;margin:8px 0 0;}
    .co-faq{max-width:1000px;margin:34px auto 0;padding:0 20px;}
    .co-faq h2{font-size:24px;margin:0 0 14px;}
    .co-faq details{border:1px solid #E5E5E5;border-radius:12px;background:#fff;padding:14px 18px;margin-bottom:10px;}
    .co-faq summary{font-weight:700;font-size:16px;cursor:pointer;color:#0E1116;}
    .co-faq p{color:#3a444d;font-size:15px;line-height:1.6;margin:10px 0 0;}
    .co-faq a{color:#0f7a4f;font-weight:700;text-decoration:none;}
    .co-faq a:hover{text-decoration:underline;}
    .co-cta{max-width:1000px;margin:34px auto 40px;padding:26px 22px;border:1px solid #E5E5E5;border-radius:16px;background:linear-gradient(135deg,#f4fbf7,#ffffff);text-align:center;}
    .co-cta h2{font-size:24px;margin:0 0 8px;}
    .co-cta p{color:#3a444d;font-size:15.5px;line-height:1.6;margin:0 auto 16px;max-width:560px;}
    .co-cta .btns{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;}
    .co-cta a{display:inline-block;padding:11px 20px;border-radius:10px;font-weight:700;font-size:14.5px;text-decoration:none;}
    .co-cta a.primary{background:#0f7a4f;color:#fff;}
    .co-cta a.ghost{border:1px solid #0F1419;color:#0F1419;}
    .co-related{max-width:1000px;margin:0 auto 40px;padding:0 20px;color:#5b6670;font-size:14px;}
    .co-related a{color:#0f7a4f;font-weight:700;text-decoration:none;}
    @media(max-width:600px){ #comap{height:58vh;} .co-bs{font-size:12.5px;padding:6px 10px;} }
  </style>
</head>
<body>

  <header class="site-header">
    <div class="container header-inner">
      <a href="../../index.html" class="brand" style="display:inline-flex;align-items:center;gap:9px;"><img src="../../assets/app-icon-60.png" alt="" style="width:28px;height:28px;border-radius:7px;flex-shrink:0;">MileCheck</a>
      <button class="nav-toggle" aria-label="Menu"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0F1419" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg></button>
      <nav class="primary-nav">
        <a href="../../index.html">Home</a>
        <a href="../../maps/" class="active">Maps</a>
        <a href="../../cameras/">Cameras</a>
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
    <div class="eyebrow">Interstate ${c.num} · ${c.subtitle}</div>
    <h1>${c.name} right now: live cameras &amp; road conditions</h1>
    <p class="sub">${c.hero}</p>
    <div class="co-stats">
      <div class="co-stat"><div class="n live" id="statCams">—</div><div class="l">live cameras on ${c.name}</div></div>
      <div class="co-stat"><div class="n" id="statAlerts">—</div><div class="l">active alerts on ${c.name}</div></div>
      <div class="co-stat"><div class="n">${c.lengthMi}</div><div class="l">end to end</div></div>
      <div class="co-stat"><div class="n" style="font-size:16px;padding-top:4px">${c.highPoint}</div><div class="l">high point / hazard</div></div>
    </div>
  </div>

  <div class="co-wrap">
    <div class="co-toggle">
      <button class="co-chip cam on" id="tgCam"><span class="co-dot" style="background:#0f7a4f"></span> Cameras</button>
      <button class="co-chip alr on" id="tgAlr"><span class="co-dot" style="background:#DC2626"></span> Alerts &amp; closures</button>
    </div>
    <div style="position:relative;">
      <div id="comap"></div>
      <div class="co-bs" id="coStatus">Loading live ${c.name} data…</div>
    </div>
  </div>

  <section class="co-guide">
    <h2>The ${c.name} corridor</h2>
    <p class="lede">${c.subtitle}. Here's what to watch, and where the weather actually bites.</p>
${segHtml}
  </section>

  <section class="co-faq">
    <h2>${c.name} questions, answered</h2>
${faqHtml}
  </section>

  <div class="co-cta">
    <h2>Know your exact mile marker on ${c.name} — live</h2>
    <p>MileCheck shows your nearest mile marker in real time as you drive ${c.name}, plus live DOT alerts on your route and the nearest camera. Free to start, works offline, and runs on CarPlay and Android Auto.</p>
    <div class="btns">
      <a class="primary" href="https://apps.apple.com/us/app/milecheck/id6759212851" target="_blank" rel="noopener">iOS App Store</a>
      <a class="ghost" href="https://play.google.com/store/apps/details?id=app.milecheck.mobile" target="_blank" rel="noopener">Google Play</a>
    </div>
  </div>

  <p class="co-related">More corridors &amp; maps: <a href="../">all interstate corridors</a> · <a href="../../passes/">mountain passes</a> · <a href="../../cameras/">every highway camera</a> · <a href="../../closures/">road closures</a></p>

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
            <li><a href="../../cameras/">Highway cameras</a></li>
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
      <p class="footer-fineprint">&copy; 2026 MileCheck LLC. Camera and condition data: state DOTs via MileCheck. Always drive to conditions and follow posted signs.</p>
    </div>
  </footer>

<script>(function(){var t=document.querySelector(".nav-toggle"),n=document.querySelector(".primary-nav");if(t&&n){t.addEventListener("click",function(){n.classList.toggle("open");});document.addEventListener("click",function(e){if(!e.target.closest(".header-inner"))n.classList.remove("open");})}})();</script>

<script>
const WORKER='https://milepost-proxy.leahgerber93.workers.dev';
const STATES=${JSON.stringify(c.states)};
const NUM=${c.num};
function isRoute(r){return new RegExp('^(I)?0*'+NUM+'$').test(String(r||'').toUpperCase().replace(/[\\s-]/g,''));}
const ALERT_COLORS={CL:'#DC2626',AC:'#DC2626',RW:'#F59E0B',WE:'#3B82F6',HZ:'#F97316',IN:'#DC2626',OT:'#6B7280'};
const map=L.map('comap',{gestureHandling:('ontouchstart' in window),scrollWheelZoom:true});
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',{attribution:'Esri, USGS · ${c.name} cameras &amp; conditions: state DOTs via MileCheck',maxZoom:14}).addTo(map);
map.fitBounds(${c.bounds});
const camLayer=L.layerGroup().addTo(map);
const alrLayer=L.layerGroup().addTo(map);
let CAMS=[], ALERTS=[], showCam=true, showAlr=true;
function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
async function camsFor(st){try{const d=await fetch(WORKER+'/cameras?state='+st).then(r=>r.json());return (d.cameras||[]).filter(c=>c.isActive!==false&&+c.lat&&c.imageUrl&&isRoute(c.route)).map(c=>({lat:+c.lat,lon:+c.lon,title:c.title||'Traffic camera',route:c.route,mp:c.mile,img:c.imageUrl,st}));}catch(e){return [];}}
async function alertsFor(st){try{const d=await fetch(WORKER+'/incidents?state='+st).then(r=>r.json());return (d['incident-reports']||[]).filter(a=>{const rid=a.location&&a.location['route-id'];const sl=a.location&&a.location['start-location'];return isRoute(rid)&&sl&&+sl['start-lat'];}).map(a=>{const sl=a.location['start-location'];return {lat:+sl['start-lat'],lon:+sl['start-long'],type:a['event-type-id']||'OT',title:(a.headline||a.description||a['impact-desc']||'Incident').replace(/<[^>]+>/g,' ').replace(/\\s+/g,' ').trim().slice(0,140),desc:(a.description||a['impact-desc']||'').replace(/<[^>]+>/g,' ').replace(/\\s+/g,' ').trim().slice(0,220),st};});}catch(e){return [];}}
function camPopupImg(c){const bust=c.img+(c.img.includes('?')?'&':'?')+'t='+Date.now();return '<div style="min-width:200px"><div style="font-weight:800;font-size:14px">'+esc(c.title)+'</div><div style="font-size:12px;color:#5b6670;margin-top:2px">${c.name}'+(c.mp>0?' · MP '+Math.round(c.mp):'')+' · '+c.st+' DOT</div><img class="campic" src="'+bust+'" alt="Live: '+esc(c.title)+'" onerror="this.alt=\\'image unavailable\\'"></div>';}
function alrPopup(a){return '<div style="min-width:200px"><div style="font-weight:800;font-size:14px">'+esc(a.title)+'</div><div style="font-size:12px;color:#5b6670;margin-top:2px">${c.name} · '+a.st+'</div>'+(a.desc&&a.desc!==a.title?'<div style="font-size:13px;color:#3a444d;margin-top:6px;line-height:1.5">'+esc(a.desc)+'</div>':'')+'</div>';}
function thin(items,cellPx){const z=map.getZoom();if(z>=11||items.length<80)return items;const cell=cellPx*360/(256*Math.pow(2,z));const seen=new Set(),out=[];for(const it of items){const k=Math.round(it.lat/cell)+'|'+Math.round(it.lon/cell);if(seen.has(k))continue;seen.add(k);out.push(it);}return out;}
function draw(){camLayer.clearLayers();alrLayer.clearLayers();const b=map.getBounds();if(showCam)thin(CAMS.filter(c=>b.contains([c.lat,c.lon])),16).forEach(c=>L.circleMarker([c.lat,c.lon],{radius:5,color:'#fff',weight:1.5,fillColor:'#0f7a4f',fillOpacity:.95}).bindPopup(()=>camPopupImg(c),{maxWidth:280}).addTo(camLayer));if(showAlr)thin(ALERTS.filter(a=>b.contains([a.lat,a.lon])),18).forEach(a=>L.circleMarker([a.lat,a.lon],{radius:6,color:'#fff',weight:1.5,fillColor:ALERT_COLORS[a.type]||'#6B7280',fillOpacity:.95}).bindPopup(()=>alrPopup(a),{maxWidth:280}).addTo(alrLayer));const bits=[];if(showCam)bits.push('📷 '+CAMS.length+' cameras');if(showAlr)bits.push('⚠ '+ALERTS.length+' alerts');document.getElementById('coStatus').textContent=bits.length?bits.join(' · ')+' on ${c.name}':'Toggle a layer to view ${c.name} data';}
let _t=null;map.on('moveend',()=>{clearTimeout(_t);_t=setTimeout(draw,200);});
document.getElementById('tgCam').onclick=e=>{showCam=!showCam;e.currentTarget.classList.toggle('on',showCam);draw();};
document.getElementById('tgAlr').onclick=e=>{showAlr=!showAlr;e.currentTarget.classList.toggle('on',showAlr);draw();};
Promise.all([Promise.all(STATES.map(camsFor)),Promise.all(STATES.map(alertsFor))]).then(([cams,alerts])=>{CAMS=cams.flat();ALERTS=alerts.flat();document.getElementById('statCams').textContent=CAMS.length;document.getElementById('statAlerts').textContent=ALERTS.length;draw();}).catch(()=>{document.getElementById('coStatus').textContent='Live data unavailable right now — try again shortly.';});
</script>

</body>
</html>`;
}

let n=0;
for(const c of CORRIDORS){
  const dir=path.join('corridors',c.slug);
  fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,'index.html'),page(c));
  n++;
  console.log('wrote corridors/'+c.slug+'/index.html  ('+c.name+', '+c.states.length+' states)');
}
console.log('\nGenerated '+n+' corridor pages.');
