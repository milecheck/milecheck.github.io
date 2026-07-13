// Generates /passes/<slug>/index.html for each mountain pass from one template.
// Shared structure = the proven Snoqualmie page; per-pass content below is unique
// (hero, closure story, extra note, FAQ) so each page stands on its own for SEO.
// Run: node scripts/gen-pass-pages.js   (writes files + prints a summary)
const fs = require('fs');
const path = require('path');

const PASSES = [
  {
    slug: 'snoqualmie', name: 'Snoqualmie Pass', route: 'I-90', state: 'WA', stateName: 'Washington',
    dot: 'WSDOT', lat: 47.3923, lon: -121.4001, r: 30, elev: '3,015 ft', dist: '~52 mi', distNote: 'east of Seattle on I-90',
    range: 'Cascade Range',
    hero: `See the summit before you drive it. Live WSDOT cameras and real-time conditions on I-90 over Snoqualmie Pass — snow, chains, and closures as they happen. It's the busiest mountain pass in Washington and the main link between Seattle and Eastern Washington.`,
    closes: `The pass stays open most of the year, but heavy Cascade snow and scheduled avalanche control work close I-90 over the summit several times each winter — sometimes for a couple of hours, occasionally longer. Closures can happen with little notice, which is exactly why the live cameras above are worth a look before you leave.`,
    extra: { h: 'The busiest crossing', p: `At 3,015 feet, Snoqualmie is the lowest of Washington's major passes, which is part of why it carries the most traffic — it's the everyday route between the Seattle metro and Eastern Washington. Lower doesn't mean easy, though: it still catches heavy, wet Cascade snow.` },
    faq: [
      ['Is Snoqualmie Pass open right now?', `The <a href="#comap">live map above</a> shows active closures and incidents on I-90 over the pass as red and orange markers, straight from WSDOT. For closures across the whole US, see the <a href="../../closures/">road closures map</a>. The pass shuts for avalanche control and heavy snow several times each winter.`],
      ['Are chains required on Snoqualmie Pass?', `Requirements change with conditions and are set by WSDOT — watch the <a href="#comap">live cameras above</a> for snow and ice on the roadway, and always follow posted signs. They can jump from none to chains-required within an hour during a storm.`],
      ['How high is Snoqualmie Pass?', `The summit is 3,015 feet — the lowest of Washington's major Cascade passes, which is why it's the busiest. See <a href="../../cameras/">every camera in Washington and 24 other states</a> for the rest of your route.`],
      ['How far is Snoqualmie Pass from Seattle?', `About 52 miles east on I-90, roughly an hour in good conditions. Track your exact mile marker over the pass hands-free with the <a href="https://apps.apple.com/us/app/milecheck/id6759212851" target="_blank" rel="noopener">MileCheck app</a> on CarPlay or Android Auto.`],
    ],
  },
  {
    slug: 'stevens', name: 'Stevens Pass', route: 'US-2', state: 'WA', stateName: 'Washington',
    dot: 'WSDOT', lat: 47.7462, lon: -121.0890, r: 30, elev: '4,061 ft', dist: '~78 mi', distNote: 'northeast of Seattle on US-2',
    range: 'Cascade Range',
    hero: `See the summit before you drive it. Live WSDOT cameras and real-time conditions on US-2 over Stevens Pass — snow, chains, and closures in real time. It's the northern Cascade crossing between the Seattle area and Wenatchee, and home to the Stevens Pass ski area.`,
    closes: `Stevens is higher and snowier than Snoqualmie, and US-2 over the summit closes regularly through the winter for avalanche control and heavy snowfall — sometimes for extended windows when the avalanche danger is high above the highway. Check the cameras before you leave; conditions here turn quickly.`,
    extra: { h: 'Ski traffic and snow', p: `The Stevens Pass ski resort sits right at the summit, so winter weekends stack recreational traffic on top of freight and commuters — on a snowy Saturday the combination of a chain requirement and a full parking lot can crawl the highway. The cameras show you what you're driving into before you're committed to the climb.` },
    faq: [
      ['Is Stevens Pass open right now?', `The <a href="#comap">live map above</a> shows active closures and incidents on US-2 over the pass, straight from WSDOT. See the <a href="../../closures/">US road closures map</a> for the bigger picture. Stevens closes for avalanche control and heavy snow several times each winter.`],
      ['Are chains required on Stevens Pass?', `Traction and chain requirements are set by WSDOT and change fast in a storm. Watch the <a href="#comap">live cameras above</a> for snow and ice, and always follow posted signs at the pass.`],
      ['How high is Stevens Pass?', `The summit is 4,061 feet on US-2 in the Cascades — higher and typically snowier than nearby Snoqualmie Pass on I-90. Compare conditions with <a href="../snoqualmie/">Snoqualmie Pass</a>.`],
      ['How far is Stevens Pass from Seattle?', `About 78 miles northeast on US-2, roughly two hours in good weather. Track your mile marker over the pass hands-free with the <a href="https://apps.apple.com/us/app/milecheck/id6759212851" target="_blank" rel="noopener">MileCheck app</a>.`],
    ],
  },
  {
    slug: 'siskiyou', name: 'Siskiyou Summit', route: 'I-5', state: 'OR', stateName: 'Oregon',
    dot: 'ODOT', lat: 42.0672, lon: -122.5606, r: 30, elev: '4,310 ft', dist: 'just north of', distNote: 'the California line, south of Ashland on I-5',
    range: 'Siskiyou Mountains',
    hero: `See the summit before you drive it. Live ODOT cameras and real-time conditions on I-5 over Siskiyou Summit — the highest point on the entire Interstate 5, and the winter wildcard between Oregon and California.`,
    closes: `If any part of I-5 is going to close in winter, it's usually here. At 4,310 feet, Siskiyou Summit gets snow and ice that shut the interstate or force chain requirements several times a season — and because it's the only I-5 crossing of this range, a closure here backs up traffic for hours in both states.`,
    extra: { h: 'The high point of I-5', p: `Siskiyou Summit is the highest elevation on all 1,381 miles of Interstate 5, from Canada to Mexico. That's why it, and the Grapevine far to the south, are the two spots drivers actually have to plan around in winter. Southbound, it's the last climb before the long drop into California.` },
    faq: [
      ['Is I-5 over Siskiyou Summit open right now?', `The <a href="#comap">live map above</a> shows active closures and incidents on I-5 over the summit, straight from ODOT. See the whole route on the <a href="../../corridors/i-5/">I-5 corridor page</a> or the <a href="../../closures/">US closures map</a>.`],
      ['Are chains required on Siskiyou Summit?', `Chain and traction requirements are set by ODOT and change with the weather. Watch the <a href="#comap">live cameras above</a> for snow and ice on the roadway, and follow posted signs — this pass can go from clear to chains-required quickly.`],
      ['What is the highest point on I-5?', `Siskiyou Summit, at 4,310 feet in southern Oregon — the highest elevation on the entire Interstate 5. The <a href="../grapevine/">Grapevine</a> in California is the other big winter closure spot.`],
      ['Where exactly is Siskiyou Summit?', `On I-5 in southern Oregon, a few miles north of the California border and south of Ashland. Track your exact mile marker over the pass with the <a href="https://apps.apple.com/us/app/milecheck/id6759212851" target="_blank" rel="noopener">MileCheck app</a>.`],
    ],
  },
  {
    slug: 'grapevine', name: 'The Grapevine (Tejon Pass)', route: 'I-5', state: 'CA', stateName: 'California',
    dot: 'Caltrans', lat: 34.7947, lon: -118.8790, r: 35, elev: '4,144 ft', dist: '~40 mi', distNote: 'north of Los Angeles on I-5',
    range: 'Tehachapi Mountains',
    hero: `See the pass before you drive it. Live Caltrans cameras and real-time conditions on I-5 over the Grapevine — the steep climb over Tejon Pass between the San Joaquin Valley and Los Angeles, and the spot most likely to close Southern California's main north–south route.`,
    closes: `"The Grapevine is closed" makes the news in LA for a reason: snow and high wind shut this stretch of I-5 several times each winter, sometimes stranding traffic for hours because there's no easy detour. When a storm drops the snow level to pass elevation, this is the first place it bites.`,
    extra: { h: 'No easy way around', p: `Tejon Pass tops out at 4,144 feet, and I-5 is the only fast route over it — the alternatives add hours. That's why a Grapevine closure ripples across the whole state's freight and holiday traffic. The cameras here are the quickest way to know whether the climb is bare, wet, or white before you leave the valley or the basin.` },
    faq: [
      ['Is the Grapevine closed right now?', `The <a href="#comap">live map above</a> shows active closures and incidents on I-5 over Tejon Pass, straight from Caltrans. See the full route on the <a href="../../corridors/i-5/">I-5 corridor page</a> or the <a href="../../closures/">US closures map</a>. Snow and wind close it several times a winter.`],
      ['Why does the Grapevine close so often?', `At 4,144 feet, Tejon Pass catches snow and fierce wind when storms push through, and there's no quick detour — so Caltrans closes I-5 rather than risk it. Watch the <a href="#comap">live cameras above</a> to see conditions on the climb.`],
      ['How high is the Grapevine?', `Tejon Pass, the summit of the Grapevine, is 4,144 feet — the second big winter closure point on I-5 after <a href="../siskiyou/">Siskiyou Summit</a> in Oregon.`],
      ['Where is the Grapevine on I-5?', `About 40 miles north of Los Angeles, between the San Joaquin Valley and the LA Basin. Track your mile marker over the pass with the <a href="https://apps.apple.com/us/app/milecheck/id6759212851" target="_blank" rel="noopener">MileCheck app</a> on CarPlay or Android Auto.`],
    ],
  },
  {
    slug: 'donner', name: 'Donner Pass', route: 'I-80', state: 'CA', stateName: 'California',
    dot: 'Caltrans', lat: 39.3126, lon: -120.3269, r: 30, elev: '7,056 ft', dist: 'near Truckee,', distNote: 'in the Sierra Nevada on I-80',
    range: 'Sierra Nevada',
    hero: `See the summit before you drive it. Live Caltrans cameras and real-time conditions on I-80 over Donner Pass — one of the snowiest stretches of interstate in America, and the main Sierra Nevada crossing between Sacramento and Reno.`,
    closes: `Donner is in a league of its own for snow. Sierra storms can drop feet in a day, and Caltrans runs chain controls and full closures on I-80 over the summit throughout the winter. When a big system lines up on the Sierra crest, this pass can close for a day or more — check the cameras and chain status before you head up.`,
    extra: { h: 'Chain controls are the norm', p: `At 7,056 feet, Donner sees chain requirements far more often than the lower coastal passes — in a wet winter, R2 (chains required) is a regular weekend condition, not a rare event. The name comes from the Donner Party of 1846, stranded here by exactly the kind of snow the cameras now let you check from your couch.` },
    faq: [
      ['Is Donner Pass open right now?', `The <a href="#comap">live map above</a> shows active closures and incidents on I-80 over the summit, straight from Caltrans. See the whole route on the <a href="../../corridors/i-80/">I-80 corridor page</a> or the <a href="../../closures/">US closures map</a>.`],
      ['Are chains required on Donner Pass?', `Very often in winter. Caltrans sets chain controls (R1/R2/R3) on I-80 that change with each storm — watch the <a href="#comap">live cameras above</a> for snow on the roadway and always follow the posted control level.`],
      ['How high is Donner Pass?', `The I-80 summit is 7,056 feet in the Sierra Nevada — far higher and snowier than the coastal passes, which is why chain controls here are routine, not rare.`],
      ['Where is Donner Pass?', `On I-80 in the Sierra Nevada near Truckee, between Sacramento and Reno. Track your exact mile marker over the summit with the <a href="https://apps.apple.com/us/app/milecheck/id6759212851" target="_blank" rel="noopener">MileCheck app</a>.`],
    ],
  },
  {
    slug: 'cajon', name: 'Cajon Pass', route: 'I-15', state: 'CA', stateName: 'California',
    dot: 'Caltrans', lat: 34.3419, lon: -117.4436, r: 22, elev: '~4,190 ft', dist: '~55 mi', distNote: 'northeast of Los Angeles on I-15',
    range: 'San Bernardino Mountains',
    hero: `See the pass before you drive it. Live Caltrans cameras and real-time conditions on I-15 over Cajon Pass — the busy gateway between the Los Angeles Basin and the High Desert, and the main route toward Las Vegas.`,
    closes: `Cajon rarely closes for its elevation alone, but it's a wind, snow, and wildfire funnel. Winter storms occasionally drop snow to the summit and force chain controls; strong Santa Ana and canyon winds flip trucks; and in fire season, blazes in the pass have shut I-15 entirely. The cameras tell you which of those, if any, you're dealing with today.`,
    extra: { h: 'The LA–Vegas chokepoint', p: `I-15 through Cajon Pass is one of the most heavily traveled mountain crossings in the country — the whole Los Angeles-to-Las Vegas flow squeezes through here, on top of daily High Desert commuters. That volume means even a minor incident on the grade backs traffic up for miles, so a quick camera check before you commit to the climb pays off.` },
    faq: [
      ['Is Cajon Pass open right now?', `The <a href="#comap">live map above</a> shows active closures and incidents on I-15 over the pass, straight from Caltrans. For the wider picture, see the <a href="../../closures/">US road closures map</a>.`],
      ['Does it snow on Cajon Pass?', `Occasionally. At about 4,190 feet, Cajon Summit catches snow only in colder storms, but when it does, Caltrans runs chain controls on I-15. Wind and wildfire close it more often than snow — watch the <a href="#comap">live cameras above</a>.`],
      ['How high is Cajon Pass?', `Cajon Summit on I-15 is about 4,190 feet, between the LA Basin and the High Desert around Victorville.`],
      ['Where is Cajon Pass?', `On I-15 about 55 miles northeast of Los Angeles, on the main route to Las Vegas. Track your mile marker over the grade with the <a href="https://apps.apple.com/us/app/milecheck/id6759212851" target="_blank" rel="noopener">MileCheck app</a> on CarPlay or Android Auto.`],
    ],
  },
  {
    slug: 'parleys', name: 'Parleys Summit', route: 'I-80', state: 'UT', stateName: 'Utah',
    dot: 'UDOT', lat: 40.7519, lon: -111.6377, r: 20, elev: '~7,020 ft', dist: 'just east of', distNote: 'Salt Lake City on I-80',
    range: 'Wasatch Range',
    hero: `See the canyon before you drive it. Live UDOT cameras and real-time conditions on I-80 through Parleys Canyon over Parleys Summit — the main route out of Salt Lake City toward Park City and the Wasatch ski country.`,
    closes: `Parleys Canyon funnels every Salt Lake–to–Park City driver up a steep grade into Wasatch snow, and UDOT runs chain and traction restrictions here through the winter. Heavy snow and blowing snow in the canyon can slow it to a crawl or close it, and truck restrictions are common when the grade turns icy — check the cameras before you head up.`,
    extra: { h: 'Ski-country commute', p: `On a snowy morning, Parleys stacks resort-bound traffic, freight, and commuters onto the same steep grade — which is why a single spun-out truck can back the canyon up for miles. At about 7,020 feet at the summit, conditions here can be completely different from the dry valley floor a few minutes behind you.` },
    faq: [
      ['Is Parleys Canyon (I-80) open right now?', `The <a href="#comap">live map above</a> shows active closures and incidents on I-80 through Parleys, straight from UDOT. See the whole route on the <a href="../../corridors/i-80/">I-80 corridor page</a> or the <a href="../../closures/">US closures map</a>.`],
      ['Are chains or snow tires required on Parleys Summit?', `UDOT sets traction and chain restrictions in Parleys Canyon through the winter, and they change with each storm. Watch the <a href="#comap">live cameras above</a> for snow on the grade and follow posted restrictions.`],
      ['How high is Parleys Summit?', `About 7,020 feet on I-80 in the Wasatch Range — high enough that the summit can be in a snowstorm while Salt Lake City stays dry.`],
      ['Where is Parleys Summit?', `On I-80 just east of Salt Lake City, at the top of Parleys Canyon toward Park City. Track your mile marker up the canyon with the <a href="https://apps.apple.com/us/app/milecheck/id6759212851" target="_blank" rel="noopener">MileCheck app</a>.`],
    ],
  },
];

function faqJsonLd(p){
  return JSON.stringify({ '@context':'https://schema.org','@type':'FAQPage','mainEntity':
    p.faq.map(([q,a])=>({'@type':'Question','name':q,'acceptedAnswer':{'@type':'Answer','text':a.replace(/<[^>]+>/g,'')}})) });
}
function breadcrumbJsonLd(p){
  return JSON.stringify({ '@context':'https://schema.org','@type':'BreadcrumbList','itemListElement':[
    {'@type':'ListItem','position':1,'name':'MileCheck','item':'https://milecheckapp.com/'},
    {'@type':'ListItem','position':2,'name':'Mountain Passes','item':'https://milecheckapp.com/passes/'},
    {'@type':'ListItem','position':3,'name':p.name,'item':'https://milecheckapp.com/passes/'+p.slug+'/'} ] });
}

function page(p){
  const faqHtml = p.faq.map(([q,a])=>`    <details><summary>${q}</summary><p>${a}</p></details>`).join('\n');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta name="apple-itunes-app" content="app-id=6759212851">
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${p.name} Camera &amp; Conditions Right Now (${p.route}) | MileCheck</title>
  <meta name="description" content="Live ${p.name} cameras and real-time road conditions on ${p.route} — see snow, chains, and closures before you drive it. ${p.dot} cameras, tagged with mile marker. Free, no account.">
  <link rel="canonical" href="https://milecheckapp.com/passes/${p.slug}/">
  <meta property="og:title" content="${p.name} Right Now — Live Camera &amp; Conditions | MileCheck">
  <meta property="og:description" content="Live ${p.route} ${p.name} cameras and conditions. See the pass before you drive it — snow, chains, and closures in real time.">
  <meta property="og:image" content="https://milecheckapp.com/images/og-banner-light.png">
  <meta property="og:url" content="https://milecheckapp.com/passes/${p.slug}/">
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
  <script type="application/ld+json">${faqJsonLd(p)}</script>
  <script type="application/ld+json">${breadcrumbJsonLd(p)}</script>
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
    <div class="eyebrow">${p.route} · ${p.stateName} · Elevation ${p.elev}</div>
    <h1>${p.name} right now: live camera &amp; conditions</h1>
    <p class="sub">${p.hero}</p>
    <div class="co-stats">
      <div class="co-stat"><div class="n live" id="statCams">—</div><div class="l">live cameras near the pass</div></div>
      <div class="co-stat"><div class="n" id="statAlerts">—</div><div class="l">active alerts nearby</div></div>
      <div class="co-stat"><div class="n">${p.elev}</div><div class="l">summit elevation</div></div>
      <div class="co-stat"><div class="n">${p.dist}</div><div class="l">${p.distNote}</div></div>
    </div>
  </div>

  <div class="co-wrap">
    <div class="co-toggle">
      <button class="co-chip cam on" id="tgCam"><span class="co-dot" style="background:#0f7a4f"></span> Cameras</button>
      <button class="co-chip alr on" id="tgAlr"><span class="co-dot" style="background:#DC2626"></span> Alerts &amp; closures</button>
    </div>
    <div style="position:relative;">
      <div id="comap"></div>
      <div class="co-bs" id="coStatus">Loading live ${p.name} data…</div>
    </div>
  </div>

  <section class="co-guide">
    <h2>About ${p.name}</h2>
    <p class="lede">${p.name} carries ${p.route} over the ${p.range} at ${p.elev}. Here's what to watch, and when it bites.</p>
    <div class="co-seg"><h3>When it closes</h3><p>${p.closes}</p></div>
    <div class="co-seg"><h3>${p.extra.h}</h3><p>${p.extra.p}</p></div>
    <div class="co-seg"><h3>Watch it live while you drive</h3><p>The cameras and alerts above are the stationary view — the ${p.dot} feeds you'd check before you leave. In the MileCheck app, the nearest camera and your exact mile marker follow you up the grade automatically, hands-free on CarPlay and Android Auto, so you're never guessing which stretch you're on.</p></div>
  </section>

  <section class="co-faq">
    <h2>${p.name} questions, answered</h2>
${faqHtml}
  </section>

  <div class="co-cta">
    <h2>Watch the climb — live, hands-free</h2>
    <p>MileCheck shows your exact mile marker in real time as you drive ${p.route} over ${p.name}, plus the nearest camera and any alert on your route. Free to start, works offline, and runs on CarPlay and Android Auto.</p>
    <div class="btns">
      <a class="primary" href="https://apps.apple.com/us/app/milecheck/id6759212851" target="_blank" rel="noopener">iOS App Store</a>
      <a class="ghost" href="https://play.google.com/store/apps/details?id=app.milecheck.mobile" target="_blank" rel="noopener">Google Play</a>
    </div>
  </div>

  <p class="co-related">More passes &amp; routes: <a href="../">all mountain passes</a> · <a href="../../cameras/">every highway camera</a> · <a href="../../closures/">road closures</a> · <a href="../../maps/">every map</a></p>

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
      <p class="footer-fineprint">&copy; 2026 MileCheck LLC. Camera and condition data: ${p.dot} via MileCheck. Always drive to conditions and follow posted signs.</p>
    </div>
  </footer>

<script>(function(){var t=document.querySelector(".nav-toggle"),n=document.querySelector(".primary-nav");if(t&&n){t.addEventListener("click",function(){n.classList.toggle("open");});document.addEventListener("click",function(e){if(!e.target.closest(".header-inner"))n.classList.remove("open");})}})();</script>

<script>
const WORKER='https://milepost-proxy.leahgerber93.workers.dev';
const PASS={state:'${p.state}',lat:${p.lat},lon:${p.lon},radiusKm:${p.r},route:'${p.route}'};
function km(a,b,c,d){const R=6371,pi=Math.PI/180;const x=Math.sin((c-a)*pi/2)**2+Math.cos(a*pi)*Math.cos(c*pi)*Math.sin((d-b)*pi/2)**2;return 2*R*Math.asin(Math.sqrt(x));}
function near(lat,lon){return isFinite(lat)&&isFinite(lon)&&km(PASS.lat,PASS.lon,lat,lon)<=PASS.radiusKm;}
const ALERT_COLORS={CL:'#DC2626',AC:'#DC2626',RW:'#F59E0B',WE:'#3B82F6',HZ:'#F97316',IN:'#DC2626',OT:'#6B7280'};
const map=L.map('comap',{gestureHandling:('ontouchstart' in window),scrollWheelZoom:true});
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',{attribution:'Esri, USGS · ${p.name} cameras &amp; conditions: ${p.dot} via MileCheck',maxZoom:16}).addTo(map);
map.setView([PASS.lat,PASS.lon],11);
const camLayer=L.layerGroup().addTo(map);
const alrLayer=L.layerGroup().addTo(map);
let CAMS=[], ALERTS=[], showCam=true, showAlr=true;
function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
async function loadCams(){try{const d=await fetch(WORKER+'/cameras?state='+PASS.state).then(r=>r.json());return (d.cameras||[]).filter(c=>c.isActive!==false&&c.imageUrl&&near(+c.lat,+c.lon)).map(c=>({lat:+c.lat,lon:+c.lon,title:c.title||'Traffic camera',route:c.route,mp:c.mile,img:c.imageUrl}));}catch(e){return [];}}
async function loadAlerts(){try{const d=await fetch(WORKER+'/incidents?state='+PASS.state).then(r=>r.json());return (d['incident-reports']||[]).filter(a=>{const sl=a.location&&a.location['start-location'];return sl&&near(+sl['start-lat'],+sl['start-long']);}).map(a=>{const sl=a.location['start-location'];return {lat:+sl['start-lat'],lon:+sl['start-long'],type:a['event-type-id']||'OT',title:(a.headline||a.description||a['impact-desc']||'Incident').replace(/<[^>]+>/g,' ').replace(/\\s+/g,' ').trim().slice(0,140),desc:(a.description||a['impact-desc']||'').replace(/<[^>]+>/g,' ').replace(/\\s+/g,' ').trim().slice(0,220),route:a.location&&a.location['route-id']};});}catch(e){return [];}}
function camPopup(c){const bust=c.img+(c.img.includes('?')?'&':'?')+'t='+Date.now();return '<div style="min-width:200px"><div style="font-weight:800;font-size:14px">'+esc(c.title)+'</div><div style="font-size:12px;color:#5b6670;margin-top:2px">'+esc(c.route||PASS.route)+(c.mp>0?' · MP '+Math.round(c.mp):'')+' · ${p.dot}</div><img class="campic" src="'+bust+'" alt="Live: '+esc(c.title)+'" onerror="this.alt=\\'image unavailable\\'"></div>';}
function alrPopup(a){return '<div style="min-width:200px"><div style="font-weight:800;font-size:14px">'+esc(a.title)+'</div><div style="font-size:12px;color:#5b6670;margin-top:2px">'+esc(a.route||PASS.route)+'</div>'+(a.desc&&a.desc!==a.title?'<div style="font-size:13px;color:#3a444d;margin-top:6px;line-height:1.5">'+esc(a.desc)+'</div>':'')+'</div>';}
function draw(){camLayer.clearLayers();alrLayer.clearLayers();if(showCam)CAMS.forEach(c=>L.circleMarker([c.lat,c.lon],{radius:6,color:'#fff',weight:1.5,fillColor:'#0f7a4f',fillOpacity:.95}).bindPopup(()=>camPopup(c),{maxWidth:280}).addTo(camLayer));if(showAlr)ALERTS.forEach(a=>L.circleMarker([a.lat,a.lon],{radius:7,color:'#fff',weight:1.5,fillColor:ALERT_COLORS[a.type]||'#6B7280',fillOpacity:.95}).bindPopup(()=>alrPopup(a),{maxWidth:280}).addTo(alrLayer));const bits=[];if(showCam)bits.push('📷 '+CAMS.length+' cameras');if(showAlr)bits.push('⚠ '+ALERTS.length+' alerts');document.getElementById('coStatus').textContent=bits.length?bits.join(' · ')+' near the pass':'Toggle a layer to view pass data';}
document.getElementById('tgCam').onclick=e=>{showCam=!showCam;e.currentTarget.classList.toggle('on',showCam);draw();};
document.getElementById('tgAlr').onclick=e=>{showAlr=!showAlr;e.currentTarget.classList.toggle('on',showAlr);draw();};
Promise.all([loadCams(),loadAlerts()]).then(([c,a])=>{CAMS=c;ALERTS=a;document.getElementById('statCams').textContent=CAMS.length;document.getElementById('statAlerts').textContent=ALERTS.length;draw();}).catch(()=>{document.getElementById('coStatus').textContent='Live data unavailable right now — try again shortly.';});
</script>

</body>
</html>`;
}

let n=0;
for(const p of PASSES){
  const dir=path.join('passes',p.slug);
  fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,'index.html'),page(p));
  n++;
  console.log('wrote passes/'+p.slug+'/index.html  ('+p.name+', '+p.route+')');
}
console.log('\nGenerated '+n+' pass pages.');
