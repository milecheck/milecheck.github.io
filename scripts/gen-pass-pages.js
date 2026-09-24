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
    // Snow block (2026-09-24). Nearest SNOTEL to the summit (47.4245,-121.4131) is Olallie Meadows, 3.7 mi, 4,010 ft. Resort URLs verified 2026-09-24.
    snow: { station: '672:WA:SNTL', stationName: 'Olallie Meadows', stationElev: '4,010 ft', stationNote: '3.7 miles from the summit and about 1,000 feet above it', avyCenter: 'NWAC', title: 'Snow at Snoqualmie Pass',
      resort: { name: 'The Summit at Snoqualmie', report: 'https://www.summitatsnoqualmie.com/mountain-report', tickets: 'https://www.summitatsnoqualmie.com/tickets' } },
    faq: [
      ['Is Snoqualmie Pass open right now?', `The <a href="#comap">live map above</a> shows active closures and incidents on I-90 over the pass as red and orange markers, straight from WSDOT. For closures across the whole US, see the <a href="../../closures/">road closures map</a>. The pass shuts for avalanche control and heavy snow several times each winter.`],
      ['Are chains required on Snoqualmie Pass?', `Requirements change with conditions and are set by WSDOT — watch the <a href="#comap">live cameras above</a> for snow and ice on the roadway, and always follow posted signs. They can jump from none to chains-required within an hour during a storm.`],
      ['How high is Snoqualmie Pass?', `The summit is 3,015 feet — the lowest of Washington's major Cascade passes, which is why it's the busiest. See <a href="../../cameras/">every camera in Washington and 24 other states</a> for the rest of your route.`],
      ['How far is Snoqualmie Pass from Seattle?', `About 52 miles east on I-90, roughly an hour in good conditions. Track your exact mile marker over the pass hands-free with the <a href="https://apps.apple.com/us/app/milecheck/id6759212851" target="_blank" rel="noopener">MileCheck app</a> on CarPlay or Android Auto.`],
      ['How much snow is at Snoqualmie Pass right now?', `The snow block above reads the USDA SNOTEL station at Olallie Meadows, 3.7 miles from the summit at 4,010 feet. It shows depth, the change over 24 hours, snow water and temperature, updated hourly. <a href="https://www.summitatsnoqualmie.com/mountain-report" target="_blank" rel="noopener">The Summit at Snoqualmie</a> posts its own mountain report and lift status for Alpental, Summit West, Summit Central and Summit East.`],
    ],
  },
  {
    slug: 'stevens', name: 'Stevens Pass', route: 'US-2', state: 'WA', stateName: 'Washington',
    dot: 'WSDOT', lat: 47.7462, lon: -121.0890, r: 30, elev: '4,061 ft', dist: '~78 mi', distNote: 'northeast of Seattle on US-2',
    range: 'Cascade Range',
    hero: `See the summit before you drive it. Live WSDOT cameras and real-time conditions on US-2 over Stevens Pass — snow, chains, and closures in real time. It's the northern Cascade crossing between the Seattle area and Wenatchee, and home to the Stevens Pass ski area.`,
    closes: `Stevens is higher and snowier than Snoqualmie, and US-2 over the summit closes regularly through the winter for avalanche control and heavy snowfall — sometimes for extended windows when the avalanche danger is high above the highway. Check the cameras before you leave; conditions here turn quickly.`,
    extra: { h: 'Ski traffic and snow', p: `The Stevens Pass ski resort sits right at the summit, so winter weekends stack recreational traffic on top of freight and commuters — on a snowy Saturday the combination of a chain requirement and a full parking lot can crawl the highway. The cameras show you what you're driving into before you're committed to the climb.` },
    // Snow block (2026-09-24). Stevens Pass SNOTEL sits 0.2 mi from the summit at 3,940 ft.
    snow: { station: '791:WA:SNTL', stationName: 'Stevens Pass', stationElev: '3,940 ft', stationNote: 'at the summit', avyCenter: 'NWAC', title: 'Snow at Stevens Pass',
      resort: { name: 'Stevens Pass', report: 'https://www.stevenspass.com/the-mountain/mountain-conditions/snow-and-weather-report.aspx', tickets: 'https://www.stevenspass.com/plan-your-trip/lift-access/tickets.aspx' } },
    faq: [
      ['Is Stevens Pass open right now?', `The <a href="#comap">live map above</a> shows active closures and incidents on US-2 over the pass, straight from WSDOT. See the <a href="../../closures/">US road closures map</a> for the bigger picture. Stevens closes for avalanche control and heavy snow several times each winter.`],
      ['Are chains required on Stevens Pass?', `Traction and chain requirements are set by WSDOT and change fast in a storm. Watch the <a href="#comap">live cameras above</a> for snow and ice, and always follow posted signs at the pass.`],
      ['How high is Stevens Pass?', `The summit is 4,061 feet on US-2 in the Cascades — higher and typically snowier than nearby Snoqualmie Pass on I-90. Compare conditions with <a href="../snoqualmie/">Snoqualmie Pass</a>.`],
      ['How far is Stevens Pass from Seattle?', `About 78 miles northeast on US-2, roughly two hours in good weather. Track your mile marker over the pass hands-free with the <a href="https://apps.apple.com/us/app/milecheck/id6759212851" target="_blank" rel="noopener">MileCheck app</a>.`],
      ['How much snow is at Stevens Pass right now?', `The snow block above reads the USDA SNOTEL station at the summit, 3,940 feet. It shows depth, the change over 24 hours, snow water and temperature, updated hourly. The ski area posts its own <a href="https://www.stevenspass.com/the-mountain/mountain-conditions/snow-and-weather-report.aspx" target="_blank" rel="noopener">snow and weather report</a>.`],
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
    // Snow + plows (2026-09-24). Parleys Summit SNOTEL 0.8 mi from the summit, 7,590 ft. Plows from the Worker /plows?state=UT (UDOT servicevehicles).
    snow: { station: '684:UT:SNTL', stationName: 'Parleys Summit', stationElev: '7,590 ft', stationNote: 'less than a mile from the summit', avyCenter: 'UAC', title: 'Snow at Parleys Summit' },
    plows: { states: ['UT'], agency: 'UDOT' },
    faq: [
      ['Is Parleys Canyon (I-80) open right now?', `The <a href="#comap">live map above</a> shows active closures and incidents on I-80 through Parleys, straight from UDOT. See the whole route on the <a href="../../corridors/i-80/">I-80 corridor page</a> or the <a href="../../closures/">US closures map</a>.`],
      ['Are chains or snow tires required on Parleys Summit?', `UDOT sets traction and chain restrictions in Parleys Canyon through the winter, and they change with each storm. Watch the <a href="#comap">live cameras above</a> for snow on the grade and follow posted restrictions.`],
      ['How high is Parleys Summit?', `About 7,020 feet on I-80 in the Wasatch Range — high enough that the summit can be in a snowstorm while Salt Lake City stays dry.`],
      ['Where is Parleys Summit?', `On I-80 just east of Salt Lake City, at the top of Parleys Canyon toward Park City. Track your mile marker up the canyon with the <a href="https://apps.apple.com/us/app/milecheck/id6759212851" target="_blank" rel="noopener">MileCheck app</a>.`],
      ['Where are the plows?', `The Snowplows list above shows UDOT plow positions within the map radius, updated about every minute. The map draws each one as an arrow pointing the way it is heading. Parked trucks are listed too.`],
    ],
  },
  {
    slug: 'eisenhower', name: 'Eisenhower Tunnel', route: 'I-70', state: 'CO', stateName: 'Colorado',
    dot: 'CDOT', lat: 39.6767, lon: -105.9364, r: 22, elev: '11,158 ft', dist: '~60 mi', distNote: 'west of Denver on I-70',
    range: 'Continental Divide',
    hero: `See the tunnel before you drive it. Live CDOT cameras and real-time conditions on I-70 at the Eisenhower–Johnson Memorial Tunnels — the highest point on the entire U.S. Interstate Highway System, and the main route from Denver to Colorado's ski country.`,
    closes: `The tunnel bores through the Continental Divide, so it doesn't close for snow the way an open summit does — but the approaches on both sides do, for avalanche control, whiteout conditions, and the crashes that pile up on a steep, high-altitude grade in bad weather. Chain law and traction law restrictions on I-70 through this stretch are common all winter, and holiday ski traffic can back the approaches up for miles even in clear weather.`,
    extra: { h: 'The highest point on the Interstate System', p: `At 11,158 feet, the Eisenhower Tunnel isn't just the high point of I-70 — it's the highest elevation reached anywhere on the U.S. Interstate Highway System. Air is noticeably thinner here, grades are steep on both approaches, and the westbound bore (Eisenhower) and eastbound bore (Johnson) are close enough together that an incident in one often slows traffic in both.` },
    // Snow + plows (2026-09-24). Loveland Basin SNOTEL 1.8 mi from the tunnel, 11,410 ft. Plows from /plows?state=CO (COtrip snowPlows).
    snow: { station: '602:CO:SNTL', stationName: 'Loveland Basin', stationElev: '11,410 ft', stationNote: 'about 2 miles from the tunnel', avyCenter: 'CAIC', title: 'Snow at the Eisenhower Tunnel' },
    plows: { states: ['CO'], agency: 'CDOT' },
    faq: [
      ['Is the Eisenhower Tunnel open right now?', `The <a href="#comap">live map above</a> shows active closures and incidents on I-70 through the tunnel and its approaches, straight from CDOT. See the whole route on the <a href="../../corridors/i-70/">I-70 corridor page</a> or the <a href="../../closures/">US closures map</a>. Closures here are usually avalanche control or weather on the approach grades, not the tunnel itself.`],
      ['Are chains required at the Eisenhower Tunnel?', `CDOT sets traction and chain law restrictions on I-70 through this stretch, and they tighten fast in a storm. Watch the <a href="#comap">live cameras above</a> for conditions on the approach grades, and always follow posted signs.`],
      ['How high is the Eisenhower Tunnel?', `11,158 feet — the highest point on the entire U.S. Interstate Highway System, not just I-70. Compare it with <a href="../vail/">Vail Pass</a> further west on the same corridor.`],
      ['How far is the Eisenhower Tunnel from Denver?', `About 60 miles west on I-70. Track your mile marker through the tunnel and over the Divide with the <a href="https://apps.apple.com/us/app/milecheck/id6759212851" target="_blank" rel="noopener">MileCheck app</a> on CarPlay or Android Auto.`],
      ['Where are the plows?', `The Snowplows list above shows CDOT plow positions within the map radius, updated about every minute. The map draws each one as an arrow pointing the way it is heading. Parked trucks are listed too.`],
    ],
  },
  {
    slug: 'vail', name: 'Vail Pass', route: 'I-70', state: 'CO', stateName: 'Colorado',
    dot: 'CDOT', lat: 39.5264, lon: -106.2136, r: 22, elev: '10,662 ft', dist: '~100 mi', distNote: 'west of Denver on I-70',
    range: 'Gore Range',
    hero: `See the summit before you drive it. Live CDOT cameras and real-time conditions on I-70 over Vail Pass — the high, exposed crossing between Copper Mountain and Vail on Colorado's busiest mountain corridor.`,
    closes: `Vail Pass sits well above treeline on both approaches, so it takes the full force of Rocky Mountain storms with little wind protection — heavy snow, whiteouts, and avalanche control work close I-70 here several times most winters, sometimes for hours at a stretch. It's also one of the most crash-prone stretches on the corridor when a storm hits during peak ski traffic.`,
    extra: { h: 'The exposed stretch of I-70', p: `Unlike the tunneled crossing at the <a href="../eisenhower/">Eisenhower Tunnel</a> 40 miles east, Vail Pass is a fully exposed summit — the highway climbs into open alpine terrain with no tree cover to block wind and blowing snow. That's why it's often the first part of the Denver-to-Vail drive to see a chain law or full closure when a storm rolls in.` },
    // Snow + plows (2026-09-24). Copper Mountain SNOTEL 3.4 mi from the summit, 10,500 ft.
    snow: { station: '415:CO:SNTL', stationName: 'Copper Mountain', stationElev: '10,500 ft', stationNote: 'about 3 miles from the summit', avyCenter: 'CAIC', title: 'Snow at Vail Pass' },
    plows: { states: ['CO'], agency: 'CDOT' },
    faq: [
      ['Is Vail Pass open right now?', `The <a href="#comap">live map above</a> shows active closures and incidents on I-70 over the pass, straight from CDOT. See the whole route on the <a href="../../corridors/i-70/">I-70 corridor page</a> or the <a href="../../closures/">US closures map</a>. Vail Pass closes for avalanche control and heavy snow several times most winters.`],
      ['Are chains required on Vail Pass?', `CDOT sets traction and chain law restrictions on I-70 over the summit, and they change fast in a storm — this is one of the more frequently restricted stretches on the whole corridor. Watch the <a href="#comap">live cameras above</a> and follow posted signs.`],
      ['How high is Vail Pass?', `10,662 feet — lower than the <a href="../eisenhower/">Eisenhower Tunnel</a> 40 miles east, but more exposed to wind and blowing snow since it's an open summit, not a tunnel.`],
      ['How far is Vail Pass from Denver?', `About 100 miles west on I-70. Track your mile marker over the summit with the <a href="https://apps.apple.com/us/app/milecheck/id6759212851" target="_blank" rel="noopener">MileCheck app</a> on CarPlay or Android Auto.`],
      ['Where are the plows?', `The Snowplows list above shows CDOT plow positions within the map radius, updated about every minute. The map draws each one as an arrow pointing the way it is heading. Parked trucks are listed too.`],
    ],
  },
];

// ---- Mountain-area pages (2026-09-24, Leah) ---------------------------------
// Same template, `kind:'area'`: every camera, closure, work zone, road report
// and wildfire within one radius of a point, listed under the map. `out` is the
// folder under the site root (the Rainier and Hood pages live under the
// visibility pages in mountains/<key>/, so the two products link each other).
// `rMi` is MILES. The pass entries above hand `r` to a kilometre comparison in
// near(); that is left alone so their pages do not change under them.
// Facts in the copy are cited in comments; nothing here is a guess.
const AREAS = [
  {
    kind: 'area', slug: 'rainier-roads', out: 'mountains/rainier/roads', up: '../../../',
    url: 'https://milecheckapp.com/mountains/rainier/roads/',
    name: 'Mount Rainier', route: 'SR 706', state: 'WA', states: ['WA'], stateName: 'Washington',
    dot: 'WSDOT', credit: 'WSDOT, National Park Service and NIFC via MileCheck',
    // Summit coordinates from side-projects/mountain-engine/mountains (the visibility pages use the same point).
    lat: 46.8523, lon: -121.7603, rMi: 30,
    title: 'Mount Rainier road cameras and conditions right now | MileCheck',
    desc: 'Live cameras on the roads to Mount Rainier from the National Park Service and WSDOT, with closures, construction, pass reports and wildfires within 30 miles of the summit. No account.',
    ogTitle: 'Mount Rainier road cameras and conditions | MileCheck',
    eyebrow: 'SR 706 · SR 410 · SR 123 · US 12 · Washington',
    h1: 'Mount Rainier road cameras and conditions',
    hero: `The cameras on the roads to the park, on one map. Paradise, Longmire and Sunrise from the National Park Service, plus WSDOT cameras on SR 410, on US 12 at Packwood and White Pass, and on SR 7 at Elbe. Closures, construction, pass reports and wildfires within 30 miles of the summit sit under the map.`,
    camLabel: 'live cameras within 30 mi', elev: '5,400 ft', elevLabel: 'Paradise, per the Park Service',
    dist: '30 mi', distNote: 'radius from the summit', nearWord: 'within 30 miles of the summit', bannerWhere: 'on the roads around Mount Rainier',
    aboutH: 'The roads to Mount Rainier',
    lede: `Four state highways reach the park and the National Park Service runs the roads inside it. What each one does in winter, from the agencies that run them.`,
    segs: [
      // NPS Paradise page: 5,400 ft, 640 inches of snow a year, road plowed but closes at night in winter.
      // NPS road status page: all vehicles must carry tire chains November 1 to May 1.
      { h: 'The road to Paradise (SR 706)', p: `SR 706 ends at the Nisqually entrance. Inside the park the road continues to Longmire and then Paradise, at 5,400 feet. The Park Service plows it in winter but closes it at night, and every vehicle must carry tire chains from November 1 to May 1, whatever the weather that day. Paradise averages 640 inches of snow a year.` },
      // Elevations: WSDOT/Wikipedia SR 410 (5,430 ft) and SR 123 (4,675 ft). WSDOT news release 2025-10-24: closed for the season. Reopening late May: WSDOT. Sunrise Road season: NPS Sunrise page.
      { h: 'Chinook Pass and Cayuse Pass close for the winter', p: `SR 410 over Chinook Pass (5,430 feet) and SR 123 over Cayuse Pass (4,675 feet) close every winter for avalanche danger and reopen in late May, depending on the snow. In 2025 WSDOT closed both on October 24. Sunrise Road, which leaves SR 410 at the White River entrance, usually opens in late June or early July and closes in late September or early October.` },
      // White Pass 4,500 ft, year-round: Wikipedia White Pass. Repaving project: WSDOT news 2026 (started July 13).
      { h: 'White Pass stays open', p: `US 12 over White Pass (4,500 feet) is the year-round route along the south side of the park, between Packwood and Naches. WSDOT posts chain requirements there in storms. A two-year project repaving 19 miles of US 12 east and west of the pass started in July 2026, so expect work zones in the list below.` },
      // NPS road status page: Carbon River and Mowich Lake, no public access from SR 165.
      { h: 'SR 165 to Carbon River and Mowich Lake', p: `The Park Service says there is no public access to Carbon River or Mowich Lake from SR 165. The WSDOT closure on SR 165 shows on the map as a red marker.` },
    ],
    driveP: `The cameras and alerts above are the stationary view, the feeds you would check before you leave. In the MileCheck app the nearest camera and your exact mile marker follow you up the road, hands-free on CarPlay and Android Auto, and the mile marker works without a signal.`,
    faq: [
      ['Is the road to Paradise open right now?', `The Park Service posts the status of every park road on its <a href="https://www.nps.gov/mora/planyourvisit/road-status.htm" target="_blank" rel="noopener">road status page</a>. Closures on the state highways around the park show on the <a href="#comap">map above</a> as red markers, from WSDOT, and in the closures list under it.`],
      ['Are chains required to drive to Paradise?', `From November 1 to May 1 every vehicle entering the park must carry tire chains, and rangers can require them on the road above Longmire. The Longmire and Paradise cameras above show the road surface.`],
      ['Which roads to Mount Rainier close in winter?', `SR 410 over Chinook Pass, SR 123 over Cayuse Pass and Sunrise Road close every winter. The road to Longmire and Paradise stays open by day. US 12 over White Pass and SR 7 to Elbe stay open. Check the <a href="../../../closures/">road closures map</a> for the rest of the state.`],
      ['Is Mount Rainier visible right now?', `That is a different question from whether the road is open. The <a href="../">visibility page</a> reads the cloud ceilings between you and the summit and answers it for Seattle, Tacoma and the rest of the region, with a three-day forecast.`],
      ['Where do the cameras come from?', `The Paradise, Longmire and Sunrise cameras are National Park Service webcams and refresh about every minute. The highway cameras are WSDOT. Wildfires come from the national NIFC feed. Tap any camera on the map, or in the list, to see its latest frame. See <a href="../../../cameras/">every highway camera</a> for the rest of your route.`],
    ],
    crumbs: [
      { name: 'MileCheck', item: 'https://milecheckapp.com/' },
      { name: 'Mountains', item: 'https://milecheckapp.com/mountains/' },
      { name: 'Mount Rainier', item: 'https://milecheckapp.com/mountains/rainier/' },
      { name: 'Road cameras and conditions', item: 'https://milecheckapp.com/mountains/rainier/roads/' },
    ],
    vis: { h: 'Is Mount Rainier visible right now?', p: `Whether the road is open and whether you can see the mountain are different questions. The visibility page reads the cloud ceilings between you and the summit and answers the second one for Seattle, Tacoma and the rest of the region, with a three-day forecast.`, href: '../', cta: 'Check visibility now' },
    ctaH: 'Take it with you', ctaP: `MileCheck shows your exact mile marker in real time on SR 706, SR 410 and US 12, plus the nearest camera and any alert on your route. Runs on CarPlay and Android Auto. The mile marker works without a signal.`,
    related: (up) => `<a href="../">Is Mount Rainier visible right now?</a> · <a href="${up}passes/">mountain passes</a> · <a href="${up}cameras/washington/">Washington cameras</a> · <a href="${up}cameras/">all highway cameras</a> · <a href="${up}closures/">road closures</a> · <a href="${up}fire/">wildfire map</a>`,
  },
  {
    kind: 'area', slug: 'hood-roads', out: 'mountains/hood/roads', up: '../../../',
    url: 'https://milecheckapp.com/mountains/hood/roads/',
    name: 'Mount Hood', route: 'US 26', state: 'OR', states: ['OR'], stateName: 'Oregon',
    dot: 'ODOT', credit: 'ODOT and NIFC via MileCheck',
    lat: 45.3736, lon: -121.6960, rMi: 25,
    title: 'Mount Hood road cameras and conditions right now | MileCheck',
    desc: 'Live ODOT cameras on US 26 and OR 35 around Mount Hood, with closures, construction, road reports and wildfires within 25 miles of the summit. No account.',
    ogTitle: 'Mount Hood road cameras and conditions | MileCheck',
    eyebrow: 'US 26 · OR 35 · Oregon',
    h1: 'Mount Hood road cameras and conditions',
    hero: `ODOT cameras on US 26 from Brightwood up to Government Camp and over the summit, and on OR 35 toward Hood River, on one map. Closures, construction, road reports and wildfires within 25 miles of the summit sit under the map.`,
    camLabel: 'live cameras within 25 mi', elev: '3,891 ft', elevLabel: 'Government Camp',
    dist: '25 mi', distNote: 'radius from the summit', nearWord: 'within 25 miles of the summit', bannerWhere: 'on the roads around Mount Hood',
    aboutH: 'The roads over Mount Hood',
    lede: `Two highways cross the mountain. Both stay open through winter, and ODOT posts chain and traction-tire requirements on both when conditions call for it.`,
    segs: [
      // Government Camp 3,891 ft and 232.5 in of snow a year: Wikipedia, Government Camp, Oregon. Passes: Wikipedia, U.S. Route 26 in Oregon (Wapinitia just under 4,000 ft; Blue Box 4,017 ft).
      { h: 'US 26 over the mountain', p: `US 26 climbs from Sandy through Rhododendron to Government Camp, at 3,891 feet, then crosses Wapinitia Pass and Blue Box Pass (4,017 feet) on the way to Madras. Government Camp averages 232 inches of snow a year. Timberline, Mt. Hood Skibowl and Summit Pass all turn off this road, so ski weekends put resort traffic on the grade.` },
      // OR 35: 41.54 mi, Government Camp to Hood River, Bennett Pass 4,647 ft: Wikipedia, Oregon Route 35. Dry side: the visibility page's own season notes.
      { h: 'OR 35 to Hood River', p: `OR 35 leaves US 26 near Government Camp and runs 42 miles over Bennett Pass (4,647 feet) to Hood River. Mt. Hood Meadows is on this side. Hood River sits on the dry side of the Cascades, and the cameras at Meadows Drive and Parkdale are the ones to check for the east side of the mountain.` },
      { h: 'Chains and closures', p: `ODOT posts chain and traction-tire requirements on both highways when conditions call for it, and closes them for storms and avalanche control. Requirements change by the hour in a storm. Check the cameras, then follow the signs at the chain-up areas.` },
    ],
    driveP: `The cameras and alerts above are the stationary view, the ODOT feeds you would check before you leave. In the MileCheck app the nearest camera and your exact mile marker follow you up the grade, hands-free on CarPlay and Android Auto.`,
    faq: [
      ['Is US 26 over Mount Hood open right now?', `Closures and incidents on US 26 and OR 35 show on the <a href="#comap">map above</a> as red and orange markers, from ODOT, and in the closures list under it. <a href="https://tripcheck.com" target="_blank" rel="noopener">TripCheck</a> is ODOT's own page.`],
      ['Are chains required on Mount Hood?', `When ODOT posts them. The signs at the chain-up areas on US 26 and OR 35 carry the current requirement. The Government Camp and Meadows Drive cameras above show the road surface before you commit to the climb.`],
      ['How high is the road over Mount Hood?', `Government Camp on US 26 is 3,891 feet. Bennett Pass on OR 35 is 4,647 feet. Blue Box Pass, on US 26 south of the OR 35 junction, is 4,017 feet.`],
      ['Is Mount Hood visible right now?', `A different question from whether the road is open. The <a href="../">visibility page</a> reads the cloud ceilings between you and the summit and answers it for Portland, Hood River and the rest of the region, with a three-day forecast.`],
      ['Where do the cameras come from?', `All of the cameras on this page come from ODOT's TripCheck feed. Wildfires come from the national NIFC feed. Tap any camera on the map, or in the list, to see its latest frame. See <a href="../../../cameras/">every highway camera</a> for the rest of your route.`],
    ],
    crumbs: [
      { name: 'MileCheck', item: 'https://milecheckapp.com/' },
      { name: 'Mountains', item: 'https://milecheckapp.com/mountains/' },
      { name: 'Mount Hood', item: 'https://milecheckapp.com/mountains/hood/' },
      { name: 'Road cameras and conditions', item: 'https://milecheckapp.com/mountains/hood/roads/' },
    ],
    vis: { h: 'Is Mount Hood visible right now?', p: `Whether the road is open and whether you can see the mountain are different questions. The visibility page reads the cloud ceilings between you and the summit and answers the second one for Portland, Hood River and the rest of the region, with a three-day forecast.`, href: '../', cta: 'Check visibility now' },
    ctaH: 'Take it with you', ctaP: `MileCheck shows your exact mile marker in real time on US 26 and OR 35, plus the nearest camera and any alert on your route. Runs on CarPlay and Android Auto. The mile marker works without a signal.`,
    related: (up) => `<a href="../">Is Mount Hood visible right now?</a> · <a href="${up}passes/">mountain passes</a> · <a href="${up}cameras/oregon/">Oregon cameras</a> · <a href="${up}cameras/">all highway cameras</a> · <a href="${up}closures/">road closures</a> · <a href="${up}fire/">wildfire map</a>`,
  },
  {
    kind: 'area', slug: 'cabbage-hill', out: 'passes/cabbage-hill', up: '../../',
    url: 'https://milecheckapp.com/passes/cabbage-hill/',
    name: 'Cabbage Hill', route: 'I-84', state: 'OR', states: ['OR'], stateName: 'Oregon',
    dot: 'ODOT', credit: 'ODOT and NIFC via MileCheck',
    // Centre = the I-84 milepost 222 point in the bundled Oregon corpus, mid-grade.
    lat: 45.5809, lon: -118.6331, rMi: 15,
    title: 'Cabbage Hill Cameras &amp; Conditions Right Now (I-84) | MileCheck',
    desc: 'Live ODOT cameras on the Cabbage Hill grade of I-84 east of Pendleton, with closures, construction, road reports and wildfires within 15 miles. The runaway ramps, the chain-up area and Deadman Pass on one map. No account.',
    ogTitle: 'Cabbage Hill Right Now: Live Cameras &amp; Conditions (I-84) | MileCheck',
    eyebrow: 'I-84 · Oregon · MP 217 to 227',
    h1: 'Cabbage Hill right now: live cameras &amp; conditions',
    hero: `ODOT cameras on the I-84 grade east of Pendleton, from the Mission interchange up to Deadman Pass and on to Meacham. The chain-up area, the runaway truck ramps and the summit on one map, with closures, construction, road reports and wildfires within 15 miles.`,
    // 3,565 ft: USGS elevation query at the corpus milepost 227 point, 2026-09-24.
    camLabel: 'live cameras within 15 mi', elev: '3,565 ft', elevLabel: 'I-84 at MP 227, per USGS',
    dist: '6%', distNote: 'signed downgrade, MP 227 to 217', nearWord: 'within 15 miles of the hill', bannerWhere: 'on I-84 over Cabbage Hill',
    aboutH: 'About Cabbage Hill',
    // Every figure below is from ODOT's Emigrant Hill brochure for truck drivers (Form 735-9825a): oregon.gov/ODOT/MCT/Documents/emigranthill.pdf
    lede: `Emigrant Hill is the official name. Drivers call it Cabbage Hill, and the summit is Deadman Pass. ODOT's brochure for truck drivers is the best short description of it, and every figure below is from that brochure.`,
    segs: [
      { h: 'The grade', p: `Westbound, the 6 percent downgrade begins at milepost 227 and continues through milepost 217. In ODOT's words, you lose about 2,000 feet of elevation in six miles and twist through a double hairpin turn. There is a brake check area at the weigh station at milepost 227 and runaway truck ramps at mileposts 221 and 220.` },
      { h: 'The weather', p: `ODOT says the hill has some of the most changeable and severe weather conditions in the Northwest. Fog, snow and black ice are common between October and April. Oregon law requires you to carry and use tire chains when conditions warrant or signs are posted, and the eastbound chain-up area is at milepost 217, at the bottom of the hill.` },
      { h: 'The crashes', p: `On average 78 percent of the crashes on Cabbage Hill involve out-of-state motor carriers, and brake problems contribute to 59 percent of them, by ODOT's count. Posted speeds on the descent are maximums for good weather.` },
    ],
    driveP: `The cameras and alerts above are the stationary view, the ODOT feeds you would check before you leave Pendleton or La Grande. In the MileCheck app the nearest camera and your exact mile marker follow you down the grade, hands-free on CarPlay and Android Auto, so you know which ramp is next.`,
    faq: [
      ['Is Cabbage Hill open right now?', `Closures and incidents on I-84 between Pendleton and Meacham show on the <a href="#comap">map above</a> as red and orange markers, from ODOT, and in the closures list under it. See every ODOT camera on the <a href="../../cameras/oregon/">Oregon cameras page</a>, or the whole country on the <a href="../../closures/">US closures map</a>.`],
      ['Are chains required on Cabbage Hill?', `When ODOT posts them. The eastbound chain-up area is at milepost 217. The Cabbage Hill cameras at mileposts 220 to 223 show the road surface on the grade.`],
      ['How steep is Cabbage Hill?', `The signed downgrade is 6 percent, from milepost 227 down to milepost 217, with a double hairpin. ODOT puts the drop at about 2,000 feet in six miles. Runaway truck ramps sit at mileposts 221 and 220.`],
      ['Where is Cabbage Hill?', `On I-84 east of Pendleton, Oregon, between the Mission interchange and Meacham, 35 miles west of La Grande. Track your exact mile marker on the hill with the <a href="https://apps.apple.com/us/app/milecheck/id6759212851" target="_blank" rel="noopener">MileCheck app</a> on CarPlay or Android Auto.`],
    ],
    ctaH: 'Watch the descent, live, hands-free', ctaP: `MileCheck shows your exact mile marker in real time as you drive I-84 over Cabbage Hill, plus the nearest camera and any alert on your route. Runs on CarPlay and Android Auto. The mile marker works without a signal.`,
    related: (up) => `<a href="../">all mountain passes</a> · <a href="${up}cameras/oregon/">Oregon cameras</a> · <a href="${up}cameras/">all highway cameras</a> · <a href="${up}closures/">road closures</a> · <a href="${up}fire/">wildfire map</a>`,
  },
];

function faqJsonLd(p){
  return JSON.stringify({ '@context':'https://schema.org','@type':'FAQPage','mainEntity':
    p.faq.map(([q,a])=>({'@type':'Question','name':q,'acceptedAnswer':{'@type':'Answer','text':a.replace(/<[^>]+>/g,'')}})) });
}
function breadcrumbJsonLd(p){
  const items = p.crumbs || [
    {name:'MileCheck',item:'https://milecheckapp.com/'},
    {name:'Mountain Passes',item:'https://milecheckapp.com/passes/'},
    {name:p.name,item:'https://milecheckapp.com/passes/'+p.slug+'/'} ];
  return JSON.stringify({ '@context':'https://schema.org','@type':'BreadcrumbList','itemListElement':
    items.map((c,i)=>({'@type':'ListItem','position':i+1,'name':c.name,'item':c.item})) });
}

function page(p){
  const faqHtml = p.faq.map(([q,a])=>`    <details><summary>${q}</summary><p>${a}</p></details>`).join('\n');
  // Area pages (kind:'area') sit at a different depth and carry their own copy;
  // every default below reproduces the pass page exactly.
  const isArea = p.kind === 'area';
  const up = p.up || '../../';
  const url = p.url || `https://milecheckapp.com/passes/${p.slug}/`;
  const credit = p.credit || p.dot;
  const segs = p.segs || [{ h: 'When it closes', p: p.closes }, p.extra];
  const segsHtml = segs.map(s=>`    <div class="co-seg"><h3>${s.h}</h3><p>${s.p}</p></div>`).join('\n');
  const relatedHtml = typeof p.related === 'function' ? p.related(up)
    : `More passes &amp; routes: <a href="../">all mountain passes</a> · <a href="${up}cameras/">all highway cameras</a> · <a href="${up}closures/">road closures</a> · <a href="${up}maps/">all maps</a>`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta name="apple-itunes-app" content="app-id=6759212851">
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${p.title || `${p.name} Camera &amp; Conditions Right Now (${p.route}) | MileCheck`}</title>
  <meta name="description" content="${p.desc || `Live ${p.name} cameras and real-time road conditions on ${p.route} — see snow, chains, and closures before you drive it. ${p.dot} cameras, tagged with mile marker. Free, no account.`}">
  <link rel="canonical" href="${url}">
  <meta property="og:title" content="${p.ogTitle || `${p.name} Right Now — Live Camera &amp; Conditions | MileCheck`}">
  <meta property="og:description" content="${p.desc || `Live ${p.route} ${p.name} cameras and conditions. See the pass before you drive it — snow, chains, and closures in real time.`}">
  <meta property="og:image" content="https://milecheckapp.com/images/og-banner-light.png">
  <meta property="og:url" content="${url}">
  <meta property="og:type" content="website">
  <link rel="icon" type="image/png" href="${up}images/favicon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${up}style.css">
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
    /* Map layers panel — Leah 9-16: the two pills above the map read as labels, not
       switches ("didn't realize I could click them on/off"). A settings bar on the left
       edge of the map, with real on/off switches, under Leaflet's zoom control. */
    .co-layers{position:absolute;left:12px;top:84px;z-index:850;background:rgba(255,255,255,.96);border:1px solid #E5E5E5;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,.08);padding:10px 12px 6px;min-width:196px;font-size:13.5px;}
    .co-layers .lt{font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#5b6670;margin:0 0 4px;}
    .co-layer{display:flex;align-items:center;gap:9px;padding:6px 0;cursor:pointer;user-select:none;color:#0E1116;font-weight:600;position:relative;}
    .co-layer input{position:absolute;opacity:0;width:0;height:0;}
    .co-sw{flex:none;width:34px;height:20px;border-radius:10px;background:#cfd4da;position:relative;transition:background .15s;}
    .co-sw::after{content:"";position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.25);transition:left .15s;}
    .co-layer input:checked+.co-sw.cam{background:#0f7a4f;}
    .co-layer input:checked+.co-sw.alr{background:#DC2626;}
    .co-layer input:checked+.co-sw.poi{background:#7C3AED;}
    .co-layer input:checked+.co-sw.fire{background:#EA580C;}
    .co-layer input:checked+.co-sw::after{left:16px;}
    .co-layer input:focus-visible+.co-sw{outline:2px solid #0f7a4f;outline-offset:2px;}
    .co-layer .co-dot{margin-left:2px;}
    @media(max-width:600px){ .co-layers{top:auto;bottom:12px;min-width:0;padding:8px 10px 4px;font-size:13px;} }
    .co-dot{width:10px;height:10px;border-radius:50%;display:inline-block;}
    .co-bs{position:absolute;top:12px;left:56px;z-index:800;background:rgba(255,255,255,.94);border:1px solid #E5E5E5;border-radius:10px;padding:8px 14px;font-weight:800;font-size:14px;color:#0f7a4f;}
    .campic{width:100%;border-radius:8px;margin-top:6px;display:block;min-height:40px;background:#f0f0ee;}
    .crit-banner{background:#DC2626;color:#fff;font-weight:800;font-size:15px;line-height:1.4;padding:12px 20px;text-align:center;}
    .crit-banner a{color:#fff;text-decoration:underline;}
    .co-card{position:absolute;top:12px;right:12px;width:min(300px,44%);max-height:calc(100% - 24px);overflow:auto;z-index:900;background:#fff;border:1px solid #E5E5E5;border-radius:12px;box-shadow:0 8px 28px rgba(0,0,0,.20);padding:12px 14px;display:none;}
    .co-card.closure{border:2px solid #DC2626;}
    .co-card .cx{position:absolute;top:8px;right:8px;border:0;background:#f0f0ee;border-radius:50%;width:26px;height:26px;cursor:pointer;font-size:16px;line-height:1;color:#5b6670;}
    .co-card .cc-title{font-weight:800;font-size:15px;padding-right:26px;line-height:1.3;}
    .co-card .cc-meta{font-size:12.5px;color:#5b6670;margin-top:3px;}
    .co-card .cc-desc{font-size:13.5px;color:#3a444d;margin-top:8px;line-height:1.5;}
    .co-card img.cc-img{width:100%;border-radius:8px;margin-top:8px;display:block;background:#f0f0ee;min-height:40px;}
    .poi-icon{color:#7C3AED;font-size:24px;line-height:1;text-align:center;text-shadow:0 0 3px #fff,0 0 4px #fff,0 0 5px #fff;cursor:pointer;font-weight:900;}
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
    .co-vis{background:linear-gradient(135deg,#f2f4ff,#ffffff);margin-bottom:0;}
    .co-lists{max-width:1000px;margin:26px auto 0;padding:0 20px;display:grid;grid-template-columns:1fr;gap:14px;}
    .co-list{border:1px solid #E5E5E5;border-radius:14px;background:#fff;padding:18px 20px;}
    .co-list h2{font-size:20px;margin:0;display:flex;align-items:baseline;gap:10px;}
    .co-list h2 .cnt{font-size:13px;font-weight:700;color:#0f7a4f;background:#eaf7f0;border-radius:999px;padding:2px 9px;}
    .co-list .hint{color:#5b6670;font-size:13.5px;margin:4px 0 6px;line-height:1.5;}
    .co-list ul{list-style:none;margin:0;padding:0;}
    .co-list li{border-top:1px solid #F0F0F0;padding:10px 0;font-size:14.5px;line-height:1.5;color:#0E1116;}
    .co-list li:first-child{border-top:0;}
    .co-list li .m{color:#5b6670;font-size:13px;display:block;}
    .co-list li .tag{display:inline-block;font-size:11px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;border-radius:6px;padding:2px 6px;margin-right:6px;color:#fff;background:#6B7280;vertical-align:1px;}
    .co-list li .tag.cl,.co-list li .tag.ac{background:#DC2626;} .co-list li .tag.rw{background:#B45309;} .co-list li .tag.we{background:#2563EB;} .co-list li .tag.hz{background:#F97316;}
    .co-list li .tag.fire{background:#EA580C;} .co-list li .tag.rx{background:#6B7280;} .co-list li .tag.nps{background:#7C3AED;} .co-list li .tag.dot{background:#0f7a4f;}
    .co-list .empty{color:#5b6670;font-size:14px;}
    .lst-tools{margin:0 0 8px;}
    .lst-tools button,.co-list li button{border:1px solid #0F1419;background:#fff;border-radius:8px;padding:5px 10px;font:inherit;font-size:13px;font-weight:700;cursor:pointer;color:#0F1419;}
    .co-list li img{display:block;width:100%;max-width:640px;border-radius:8px;margin-top:8px;background:#f0f0ee;min-height:40px;}
    .co-layer input:checked+.co-sw.plow{background:#0369A1;}
    .co-list li .tag.plow{background:#0369A1;}
    .plow-icon{color:#0369A1;font-size:20px;line-height:22px;text-align:center;text-shadow:0 0 3px #fff,0 0 4px #fff,0 0 5px #fff;font-weight:900;}
    #snowBox .sn-stats{margin:8px 0 4px;}
    #snowBox h3{font-size:15px;margin:14px 0 4px;}
    #snowBox p.m{color:#5b6670;font-size:13.5px;line-height:1.5;margin:0;}
    #snowBox ul li b{color:#0E1116;}
    @media(max-width:600px){ #comap{height:58vh;} .co-bs{font-size:12.5px;padding:6px 10px;} }
  </style>
</head>
<body>

  <header class="site-header">
    <div class="container header-inner">
      <a href="${up}index.html" class="brand" style="display:inline-flex;align-items:center;gap:9px;"><img src="${up}assets/app-icon-60.png" alt="" style="width:28px;height:28px;border-radius:7px;flex-shrink:0;">MileCheck</a>
      <button class="nav-toggle" aria-label="Menu"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0F1419" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg></button>
      <nav class="primary-nav">
        <a href="${up}index.html">Home</a>
        <a href="${up}maps/" class="active">Maps</a>
        <a href="${up}cameras/">Cameras</a>
        <a href="${up}states/">United States</a>
        <a href="${up}canada/">Canada</a>
        <a href="${up}index.html#story">Story</a>
        <a href="${up}index.html#b2b">B2B</a>
        <a href="${up}blog/">Blog</a>
        <a href="/get/" class="nav-cta">Get the app</a>
      </nav>
    </div>
  </header>

  <div class="crit-banner" id="critBanner" style="display:none"></div>

  <div class="co-hero">
    <div class="eyebrow">${p.eyebrow || `${p.route} · ${p.stateName} · Elevation ${p.elev}`}</div>
    <h1>${p.h1 || `${p.name} right now: live camera &amp; conditions`}</h1>
    <p class="sub">${p.hero}</p>
    <div class="co-stats">
      <div class="co-stat"><div class="n live" id="statCams">—</div><div class="l">${p.camLabel || 'live cameras near the pass'}</div></div>
      <div class="co-stat"><div class="n" id="statAlerts">—</div><div class="l">active alerts nearby</div></div>
      <div class="co-stat"><div class="n">${p.elev}</div><div class="l">${p.elevLabel || 'summit elevation'}</div></div>
      <div class="co-stat"><div class="n">${p.dist}</div><div class="l">${p.distNote}</div></div>
    </div>
  </div>

  <div class="co-wrap">
    <div style="position:relative;">
      <div id="comap"></div>
      <div class="co-layers" role="group" aria-label="Map layers">
        <div class="lt">Map layers</div>
        <label class="co-layer"><input type="checkbox" id="tgCam" checked><span class="co-sw cam"></span><span class="co-dot" style="background:#0f7a4f"></span>Cameras</label>
        <label class="co-layer"><input type="checkbox" id="tgAlr" checked><span class="co-sw alr"></span><span class="co-dot" style="background:#DC2626"></span>Alerts &amp; closures</label>${isArea ? `
        <label class="co-layer"><input type="checkbox" id="tgFire" checked><span class="co-sw fire"></span><span class="co-dot" style="background:#EA580C"></span>Wildfires</label>` : ''}${p.plows ? `
        <label class="co-layer"><input type="checkbox" id="tgPlow" checked><span class="co-sw plow"></span><span class="co-dot" style="background:#0369A1"></span>Snowplows</label>` : ''}
      </div>
      <div class="co-bs" id="coStatus">Loading live ${p.name} data…</div>
      <div class="co-card" id="coCard"></div>
    </div>
  </div>
${p.snow || p.plows ? `
  <section class="co-lists co-winter" aria-label="Snow and plows">${p.snow ? `
    <div class="co-list" id="snowBox"><h2>${p.snow.title || `Snow at ${p.name}`}</h2><p class="hint">USDA SNOTEL station ${p.snow.stationName}, ${p.snow.stationElev}, ${p.snow.stationNote}. Depth and temperature are hourly readings from the station, not the resort's report.</p>
      <div class="co-stats sn-stats"><div class="co-stat"><div class="n" id="snDepth">—</div><div class="l">snow depth now</div></div><div class="co-stat"><div class="n" id="snDelta">—</div><div class="l">change, 24 h</div></div><div class="co-stat"><div class="n" id="snSwe">—</div><div class="l">snow water</div></div><div class="co-stat"><div class="n" id="snTemp">—</div><div class="l">temperature</div></div></div>
      <p class="m sn-asof" id="snAsOf">Reading the station.</p>
      <h3>Forecast at the pass</h3><ul id="snFc"><li class="empty">Loading the NWS forecast.</li></ul>
      <h3>Avalanche danger</h3><p class="m sn-avy" id="snAvy">Loading.</p>${p.snow.resort ? `
      <h3>${p.snow.resort.name}</h3><p class="m sn-resort">${p.snow.resort.report ? `The resort posts its own snow report and lift status. <a href="${p.snow.resort.report}" target="_blank" rel="noopener">Mountain report</a> · <a href="${p.snow.resort.tickets}" target="_blank" rel="noopener">Tickets</a>` : `The resort posts its own conditions and tickets at <a href="${p.snow.resort.site}" target="_blank" rel="noopener">${p.snow.resort.site.replace(/^https?:\/\//,'').replace(/\/$/,'')}</a>.`}</p>` : ''}
    </div>` : ''}${p.plows ? `
    <div class="co-list" id="lstPlows"><h2>Snowplows</h2><p class="hint">${p.plows.agency} plow positions within the map radius, updated about every minute. Parked and idle trucks are listed too.</p><ul><li class="empty">Loading.</li></ul></div>` : ''}
  </section>` : ''}${isArea ? `
  <section class="co-lists" aria-label="Conditions within ${p.rMi} miles">
    <div class="co-list co-list-cams" id="lstCams"><h2>Cameras</h2><p class="hint">Every camera in the feed within ${p.rMi} miles. Tap one to load its latest frame. Park camera frames are large, about 1.5 MB each.</p><div class="lst-tools"><button type="button" id="btnAllCams">Show every camera</button></div><ul><li class="empty">Loading.</li></ul></div>
    <div class="co-list" id="lstSnow"><h2>Snow and ice</h2><p class="hint">Road-surface and pass reports within ${p.rMi} miles, as ${p.dot} posts them, plus weather alerts.</p><ul><li class="empty">Loading.</li></ul></div>
    <div class="co-list" id="lstFire"><h2>Wildfires</h2><p class="hint">Active fires within ${p.rMi} miles, from the national NIFC feed, nearest first. Prescribed burns are marked.</p><ul><li class="empty">Loading.</li></ul></div>
    <div class="co-list" id="lstClos"><h2>Closures and incidents</h2><p class="hint">Closures, crashes and hazards within ${p.rMi} miles, from ${p.dot}. Full closures are marked in red.</p><ul><li class="empty">Loading.</li></ul></div>
    <div class="co-list" id="lstWork"><h2>Construction</h2><p class="hint">Work zones and lane restrictions within ${p.rMi} miles.</p><ul><li class="empty">Loading.</li></ul></div>
  </section>` : ''}

  <section class="co-guide">
    <h2>${p.aboutH || `About ${p.name}`}</h2>
    <p class="lede">${p.lede || `${p.name} carries ${p.route} over the ${p.range} at ${p.elev}. Here's what to watch, and when it bites.`}</p>
${segsHtml}
    <div class="co-seg"><h3>Watch it live while you drive</h3><p>${p.driveP || `The cameras and alerts above are the stationary view — the ${p.dot} feeds you'd check before you leave. In the MileCheck app, the nearest camera and your exact mile marker follow you up the grade automatically, hands-free on CarPlay and Android Auto, so you're never guessing which stretch you're on.`}</p></div>
  </section>

  <section class="co-faq">
    <h2>${p.name} questions, answered</h2>
${faqHtml}
  </section>

${p.vis ? `
  <div class="co-cta co-vis">
    <h2>${p.vis.h}</h2>
    <p>${p.vis.p}</p>
    <div class="btns">
      <a class="primary" href="${p.vis.href}">${p.vis.cta}</a>
      <a class="ghost" href="https://apps.apple.com/us/app/mountain-visibility-forecast/id6810003955" target="_blank" rel="noopener">Mountain Visibility Forecast on the App Store</a>
    </div>
  </div>` : ''}
  <div class="co-cta">
    <h2>${p.ctaH || 'Watch the climb — live, hands-free'}</h2>
    <p>${p.ctaP || `MileCheck shows your exact mile marker in real time as you drive ${p.route} over ${p.name}, plus the nearest camera and any alert on your route. Free to start, works offline, and runs on CarPlay and Android Auto.`}</p>
    <div class="btns">
      <a class="primary" href="https://apps.apple.com/us/app/milecheck/id6759212851" target="_blank" rel="noopener">iOS App Store</a>
      <a class="ghost" href="https://play.google.com/store/apps/details?id=app.milecheck.mobile" target="_blank" rel="noopener">Google Play</a>
    </div>
  </div>

  <p class="co-related">${relatedHtml}</p>

  <footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-col footer-col-brand">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;"><img src="${up}assets/app-icon-60.png" alt="MileCheck" style="width:36px;height:36px;border-radius:9px;flex-shrink:0;"><p class="footer-brand" style="margin-bottom:0;">MileCheck</p></div>
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
            <li><a href="${up}cameras/">Highway cameras</a></li>
            <li><a href="${up}closures/">Road closures map</a></li>
            <li><a href="${up}fire/">Wildfire map</a></li>
            <li><a href="${up}maps/">All maps</a></li>
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
      <p class="footer-fineprint">&copy; 2026 MileCheck LLC. Camera and condition data: ${credit}. Always drive to conditions and follow posted signs.</p>
    </div>
  </footer>

<script>(function(){var t=document.querySelector(".nav-toggle"),n=document.querySelector(".primary-nav");if(t&&n){t.addEventListener("click",function(){n.classList.toggle("open");});document.addEventListener("click",function(e){if(!e.target.closest(".header-inner"))n.classList.remove("open");})}})();</script>

<script>
const WORKER='https://milepost-proxy.leahgerber93.workers.dev';
const PASS={state:'${p.state}',states:${JSON.stringify(p.states||[p.state])},lat:${p.lat},lon:${p.lon},radiusKm:${isArea ? +(p.rMi*1.609344).toFixed(3) : p.r},route:'${p.route}',area:${isArea}};
const SNOW=${p.snow ? JSON.stringify({station:p.snow.station,avyCenter:p.snow.avyCenter}) : 'null'};
const PLOWS=${p.plows ? JSON.stringify({states:p.plows.states}) : 'null'};
function km(a,b,c,d){const R=6371,pi=Math.PI/180;const x=Math.sin((c-a)*pi/2)**2+Math.cos(a*pi)*Math.cos(c*pi)*Math.sin((d-b)*pi/2)**2;return 2*R*Math.asin(Math.sqrt(x));}
function near(lat,lon){return isFinite(lat)&&isFinite(lon)&&km(PASS.lat,PASS.lon,lat,lon)<=PASS.radiusKm;}
const ALERT_COLORS={CL:'#DC2626',AC:'#DC2626',RW:'#F59E0B',WE:'#3B82F6',HZ:'#F97316',IN:'#DC2626',OT:'#6B7280'};
const TOUCH=('ontouchstart' in window);const RS=v=>TOUCH?Math.round(v*1.6):v;const map=L.map('comap',{gestureHandling:('ontouchstart' in window),scrollWheelZoom:true,preferCanvas:true,renderer:L.canvas({tolerance:('ontouchstart' in window)?14:6})});
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',{attribution:'Esri, USGS · ${p.name} cameras &amp; conditions: ${p.dot} via MileCheck',maxZoom:16}).addTo(map);
map.setView([PASS.lat,PASS.lon],11);
const camLayer=L.layerGroup().addTo(map);
const alrLayer=L.layerGroup().addTo(map);
const fireLayer=L.layerGroup().addTo(map);
const plowLayer=L.layerGroup().addTo(map);
let CAMS=[], ALERTS=[], CONDS=[], FIRES=[], PLOWLIST=[], showCam=true, showAlr=true, showFire=true, showPlow=true;
function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
async function fetchJSON(url,tries){for(let i=0;i<tries;i++){try{const r=await fetch(url);if(r.ok)return await r.json();}catch(e){}if(i<tries-1)await new Promise(res=>setTimeout(res,1000));}return null;}
function clean(t,n){return String(t==null?'':t).replace(/<[^>]+>/g,' ').replace(/\\s+/g,' ').trim().slice(0,n);}
async function loadCams(){const out=[];for(const st of PASS.states){const d=await fetchJSON(WORKER+'/cameras?state='+st,3);for(const c of ((d&&d.cameras)||[])){if(c.isActive===false||!c.imageUrl||!near(+c.lat,+c.lon))continue;out.push({lat:+c.lat,lon:+c.lon,title:c.title||'Traffic camera',route:c.route,mp:c.mile,img:c.imageUrl,src:c.source==='NPS'?'NPS':'',park:c.park||''});}}return out;}
async function loadAlerts(){const out=[];for(const st of PASS.states){const d=await fetchJSON(WORKER+'/incidents?state='+st,3);for(const a of ((d&&d['incident-reports'])||[])){const sl=a.location&&a.location['start-location'];if(!sl||!near(+sl['start-lat'],+sl['start-long']))continue;out.push({lat:+sl['start-lat'],lon:+sl['start-long'],type:a['event-type-id']||'OT',mp:sl['start-mile-marker'],title:clean(a.headline||a.description||a['impact-desc']||'Incident',140),desc:clean(a.description||a['impact-desc']||'',240),impact:clean(a['impact-desc']||'',80),route:a.location&&a.location['route-id']});}}return out;}
async function loadConds(){const out=[];for(const st of PASS.states){const d=await fetchJSON(WORKER+'/conditions?state='+st,3);for(const r of ((d&&d['road-weather-reports'])||[])){const sl=r.location&&r.location['start-location'];const lat=+(r.latitude!=null?r.latitude:(sl&&sl['start-lat']));const lon=+(r.longitude!=null?r.longitude:(sl&&sl['start-long']));if(!near(lat,lon))continue;const restr=[r['restriction-one'],r['restriction-two']].filter(x=>x&&!/^no restrict/i.test(String(x))).map(x=>clean(x,80));out.push({lat,lon,name:clean(r['location-name']||(r.location&&r.location['location-name'])||r['route-id']||'Road report',80),cond:clean(r['road-surface-condition'],220),wx:clean(r['weather-condition'],60),temp:(r['air-temperature']!=null&&r['air-temperature']!=='')?String(r['air-temperature']):'',restr});}}return out;}
async function loadFires(){const dLat=PASS.radiusKm/111,dLon=PASS.radiusKm/(111*Math.cos(PASS.lat*Math.PI/180));const bb=[PASS.lon-dLon,PASS.lat-dLat,PASS.lon+dLon,PASS.lat+dLat].map(v=>v.toFixed(4)).join(',');const d=await fetchJSON(WORKER+'/fires?bbox='+bb,3);return ((d&&d.fires)||[]).filter(f=>near(+f.lat,+f.lon)).map(f=>({lat:+f.lat,lon:+f.lon,name:clean(f.name||'Fire',80),acres:f.acres,pct:f.containedPct,rx:!!f.isRx,dist:km(PASS.lat,PASS.lon,+f.lat,+f.lon)/1.609344})).sort((a,b)=>a.dist-b.dist);}
const cardEl=document.getElementById('coCard');
function showCard(html,isClosure){cardEl.className='co-card'+(isClosure?' closure':'');cardEl.innerHTML='<button class="cx" aria-label="Close">×</button>'+html;cardEl.style.display='block';cardEl.querySelector('.cx').onclick=function(){cardEl.style.display='none';};}
function bust(u){return u+(u.includes('?')?'&':'?')+'t='+Date.now();}
function camCard(c){return '<div class="cc-title">'+esc(c.title)+'</div><div class="cc-meta">'+esc(c.route||PASS.route)+(c.mp>0?' · MP '+Math.round(c.mp):'')+' · '+(c.src||'${p.dot}')+(c.park?' · '+esc(c.park):'')+'</div><a href="'+c.img+'" target="_blank" rel="noopener" title="Open full image"><img class="cc-img" src="'+bust(c.img)+'" alt="Live: '+esc(c.title)+'" onerror="this.alt=\\'image unavailable\\'"></a>';}
function fireCard(f){return '<div class="cc-title">'+esc(f.name)+(f.rx?' (prescribed burn)':'')+'</div><div class="cc-meta">'+(f.acres!=null?Math.round(f.acres).toLocaleString()+' acres · ':'')+(f.pct!=null?f.pct+'% contained · ':'')+f.dist.toFixed(0)+' mi away'+'</div>';}
function alrCard(a){return '<div class="cc-title">'+esc(a.title)+'</div><div class="cc-meta">'+esc(a.route||PASS.route)+(a.mp>0?' · MP '+Math.round(a.mp):'')+'</div>'+(a.desc&&a.desc!==a.title?'<div class="cc-desc">'+esc(a.desc)+'</div>':'');}
function fmtIn(v){return (v==null||!isFinite(v))?'—':(Math.round(v*10)/10)+' in';}
function stamp(d){const pad=n=>String(n).padStart(2,'0');return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());}
async function loadSnow(){if(!SNOW)return;const now=new Date();const begin=stamp(new Date(now.getTime()-48*3600e3))+' 00:00',end=stamp(now)+' 23:00';
  const j=await fetchJSON('https://wcc.sc.egov.usda.gov/awdbRestApi/services/v1/data?stationTriplets='+encodeURIComponent(SNOW.station)+'&elements=SNWD,WTEQ,TOBS&duration=HOURLY&beginDate='+encodeURIComponent(begin)+'&endDate='+encodeURIComponent(end),2);
  const st=j&&j[0];const asof=document.getElementById('snAsOf');if(!st){asof.textContent='The station did not answer. Try again in a few minutes.';return;}
  const series=code=>{const el=(st.data||[]).find(x=>x.stationElement&&x.stationElement.elementCode===code);return el?(el.values||[]).filter(v=>v.value!=null&&isFinite(v.value)):[];};
  const sn=series('SNWD'),sw=series('WTEQ'),tb=series('TOBS');const last=a=>a.length?a[a.length-1]:null;const ln=last(sn),lw=last(sw),lt=last(tb);
  const t=s=>Date.parse(String(s).replace(' ','T'));let prev=null;if(ln){const target=t(ln.date)-24*3600e3;prev=sn.filter(v=>t(v.date)<=target).pop()||null;}
  document.getElementById('snDepth').textContent=ln?fmtIn(ln.value):'—';
  document.getElementById('snDelta').textContent=(ln&&prev)?((ln.value-prev.value>=0?'+':'')+(Math.round((ln.value-prev.value)*10)/10)+' in'):'—';
  document.getElementById('snSwe').textContent=lw?fmtIn(lw.value):'—';
  document.getElementById('snTemp').textContent=lt?Math.round(lt.value)+'°F':'—';
  asof.textContent=ln?('As of '+ln.date+', station time. Provisional USDA data.'):'No snow depth reading in the last 48 hours.';}
async function loadForecast(){if(!SNOW)return;const ul=document.getElementById('snFc');const pt=await fetchJSON('https://api.weather.gov/points/'+PASS.lat.toFixed(4)+','+PASS.lon.toFixed(4),2);const url=pt&&pt.properties&&pt.properties.forecast;const fc=url?await fetchJSON(url,2):null;const per=fc&&fc.properties&&fc.properties.periods;
  if(!per||!per.length){ul.innerHTML='<li class="empty">The NWS forecast did not load.</li>';return;}
  ul.innerHTML=per.slice(0,4).map(x=>'<li><b>'+esc(x.name)+'</b> '+esc(x.temperature)+'°'+esc(x.temperatureUnit)+' · '+esc(x.shortForecast)+(x.probabilityOfPrecipitation&&x.probabilityOfPrecipitation.value!=null?' · '+x.probabilityOfPrecipitation.value+'% precip':'')+(x.windSpeed?' · wind '+esc(x.windSpeed)+' '+esc(x.windDirection||''):'')+'</li>').join('');
  const el=fc.properties.elevation;if(el&&isFinite(el.value))ul.insertAdjacentHTML('beforeend','<li class="empty">NWS point forecast for '+Math.round(el.value*3.28084).toLocaleString()+' ft.</li>');}
function pip(pt,poly){let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const xi=poly[i][0],yi=poly[i][1],xj=poly[j][0],yj=poly[j][1];if(((yi>pt[1])!==(yj>pt[1]))&&(pt[0]<(xj-xi)*(pt[1]-yi)/(yj-yi)+xi))inside=!inside;}return inside;}
function inGeom(pt,g){if(!g)return false;if(g.type==='Polygon')return pip(pt,g.coordinates[0]);if(g.type==='MultiPolygon')return g.coordinates.some(p=>pip(pt,p[0]));return false;}
async function loadAvy(){if(!SNOW)return;const el=document.getElementById('snAvy');const j=await fetchJSON('https://api.avalanche.org/v2/public/products/map-layer/'+encodeURIComponent(SNOW.avyCenter),2);const f=(j&&j.features)||[];const z=f.find(x=>inGeom([PASS.lon,PASS.lat],x.geometry))||f[0];
  if(!z){el.textContent='The avalanche center feed did not load.';return;}const pr=z.properties||{};const rating=pr.off_season?'No rating, off season':(typeof pr.danger==='string'&&pr.danger?pr.danger:'See the forecast');
  const zone=/zone$/i.test(String(pr.name||''))?pr.name:(pr.name?pr.name+' zone':'this zone');const cap=rating.charAt(0).toUpperCase()+rating.slice(1);el.innerHTML='<b>'+esc(cap)+'</b> for the '+esc(zone)+', per the '+esc(pr.center||SNOW.avyCenter)+'. '+(pr.link?'<a href="'+pr.link+'" target="_blank" rel="noopener">Read the forecast</a>. ':'')+'This rating is for backcountry terrain, not the ski area.';}
async function loadPlows(){if(!PLOWS)return [];const out=[];for(const st of PLOWS.states){const d=await fetchJSON(WORKER+'/plows?state='+st,2);for(const t of ((d&&d.plows)||[])){if(!near(+t.lat,+t.lon))continue;const age=(Date.now()-Date.parse(t.lastUpdated))/60000;const vin=/^[A-Z0-9]{17}$/.test(t.name||'');const agency=clean(t.status||'',40);out.push({lat:+t.lat,lon:+t.lon,bearing:+t.bearing||0,name:vin?((agency||'DOT')+' plow'):clean(t.name||'Plow',60),status:vin?'':agency,age:isFinite(age)?age:null});}}return out.sort((a,b)=>(a.age==null?9e9:a.age)-(b.age==null?9e9:b.age));}
function plowIcon(b){return L.divIcon({className:'',html:'<div class="plow-icon" style="transform:rotate('+b+'deg)">▲</div>',iconSize:[22,22],iconAnchor:[11,11]});}
function plowCard(t){return '<div class="cc-title">'+esc(t.name)+'</div><div class="cc-meta">'+(t.status?esc(t.status)+' · ':'')+(t.age!=null?'seen '+Math.round(t.age)+' min ago':'no timestamp')+'</div>';}
function renderPlows(){setList('lstPlows',PLOWLIST.map(t=>'<li>'+esc(t.name)+'<span class="m">'+(t.status?esc(t.status)+' · ':'')+(t.age!=null?'seen '+Math.round(t.age)+' min ago':'no timestamp')+'</span></li>'),'No plows within the map radius right now.');}
function draw(){camLayer.clearLayers();alrLayer.clearLayers();fireLayer.clearLayers();plowLayer.clearLayers();if(PLOWS&&showPlow)PLOWLIST.forEach(t=>L.marker([t.lat,t.lon],{icon:plowIcon(t.bearing)}).on('click',()=>showCard(plowCard(t),false)).addTo(plowLayer));if(showCam)CAMS.forEach(c=>L.circleMarker([c.lat,c.lon],{radius:RS(c.src?7:6),color:'#fff',weight:1.5,fillColor:c.src?'#7C3AED':'#0f7a4f',fillOpacity:.95}).on('click',()=>showCard(camCard(c),false)).addTo(camLayer));if(showAlr)ALERTS.forEach(a=>{const cl=a.type==='CL';L.circleMarker([a.lat,a.lon],{radius:RS(cl?10:7),color:'#fff',weight:cl?2.5:1.5,fillColor:ALERT_COLORS[a.type]||'#6B7280',fillOpacity:1}).on('click',()=>showCard(alrCard(a),cl)).addTo(alrLayer);});if(PASS.area&&showFire)FIRES.forEach(f=>L.circleMarker([f.lat,f.lon],{radius:RS(f.rx?6:9),color:'#fff',weight:1.5,fillColor:f.rx?'#9CA3AF':'#EA580C',fillOpacity:.95}).on('click',()=>showCard(fireCard(f),false)).addTo(fireLayer));const bits=[];if(showCam)bits.push('📷 '+CAMS.length+' cameras');if(showAlr)bits.push('⚠ '+ALERTS.length+' alerts');if(PASS.area&&showFire)bits.push('🔥 '+FIRES.length+' fires');if(PLOWS&&showPlow)bits.push('🚜 '+PLOWLIST.length+' plows');document.getElementById('coStatus').textContent=bits.length?bits.join(' · ')+' ${p.nearWord || 'near the pass'}':'Toggle a layer to view ${isArea ? 'the area' : 'pass'} data';}
const TAGS={CL:['cl','Closed'],AC:['ac','Crash'],RW:['rw','Work'],WE:['we','Weather'],HZ:['hz','Hazard'],IN:['ac','Incident'],OT:['ot','Alert']};
function tag(k,label){return '<span class="tag '+k+'">'+label+'</span>';}
function alrLi(a){const t=TAGS[a.type]||TAGS.OT;const full=isFullClosure(a);return '<li>'+tag(full?'cl':t[0],full?'Closed':t[1])+esc(a.title)+'<span class="m">'+esc(a.route||'')+(a.mp>0?' · MP '+Math.round(a.mp):'')+(a.desc&&a.desc!==a.title?' · '+esc(a.desc):'')+'</span></li>';}
function setList(id,items,empty){const el=document.getElementById(id);if(!el)return;const h=el.querySelector('h2');let c=h.querySelector('.cnt');if(!c){c=document.createElement('span');c.className='cnt';h.appendChild(c);}c.textContent=items.length;el.querySelector('ul').innerHTML=items.length?items.join(''):'<li class="empty">'+empty+'</li>';}
function loadCamImg(li,c){let img=li.querySelector('img');if(!img){img=document.createElement('img');img.alt='Live: '+c.title;img.loading='lazy';li.appendChild(img);}img.src=bust(c.img);li.querySelector('button').textContent='Refresh';}
function renderLists(){
  const camItems=CAMS.map((c,i)=>'<li data-i="'+i+'">'+tag(c.src?'nps':'dot',c.src||'${p.dot}')+esc(c.title)+' <button type="button">Show</button><span class="m">'+esc(c.route||'')+(c.mp>0?' · MP '+Math.round(c.mp):'')+(c.park?' · '+esc(c.park):'')+'</span></li>');
  setList('lstCams',camItems,'No cameras in the feed for this area right now.');
  document.querySelectorAll('#lstCams li[data-i] button').forEach(b=>{b.onclick=()=>{const li=b.closest('li');loadCamImg(li,CAMS[+li.dataset.i]);};});
  const all=document.getElementById('btnAllCams');if(all)all.onclick=()=>{document.querySelectorAll('#lstCams li[data-i]').forEach(li=>loadCamImg(li,CAMS[+li.dataset.i]));all.textContent='Refresh every camera';};
  const snow=CONDS.map(w=>'<li>'+tag('we','Report')+esc(w.name)+'<span class="m">'+esc(w.cond||'No surface report')+(w.wx?' · '+esc(w.wx):'')+(w.temp?' · '+esc(w.temp)+'°F':'')+(w.restr.length?' · '+esc(w.restr.join(' · ')):'')+'</span></li>').concat(ALERTS.filter(a=>a.type==='WE').map(alrLi));
  setList('lstSnow',snow,'No snow, ice or pass reports for this area right now.');
  const fires=FIRES.map(f=>'<li>'+tag(f.rx?'rx':'fire',f.rx?'Prescribed':'Fire')+esc(f.name)+'<span class="m">'+(f.acres!=null?Math.round(f.acres).toLocaleString()+' acres · ':'')+(f.pct!=null?f.pct+'% contained · ':'')+f.dist.toFixed(0)+' mi away</span></li>');
  setList('lstFire',fires,'No active fires within '+Math.round(PASS.radiusKm/1.609344)+' miles in the NIFC feed.');
  const clos=ALERTS.filter(a=>a.type!=='RW'&&a.type!=='WE').sort((a,b)=>(isFullClosure(b)-isFullClosure(a))).map(alrLi);
  setList('lstClos',clos,'No closures, crashes or hazards reported in this area right now.');
  const work=ALERTS.filter(a=>a.type==='RW').map(alrLi);
  setList('lstWork',work,'No work zones reported in this area right now.');
}
L.marker([PASS.lat,PASS.lon],{icon:L.divIcon({className:'',html:'<div class="poi-icon">▲</div>',iconSize:[28,28],iconAnchor:[14,14]}),zIndexOffset:500}).bindTooltip('${p.name} · ${p.elev}',{direction:'top',offset:[0,-12]}).addTo(map);
document.getElementById('tgCam').onchange=e=>{showCam=e.target.checked;draw();};
document.getElementById('tgAlr').onchange=e=>{showAlr=e.target.checked;draw();};
const tgFire=document.getElementById('tgFire');if(tgFire)tgFire.onchange=e=>{showFire=e.target.checked;draw();};
const tgPlow=document.getElementById('tgPlow');if(tgPlow)tgPlow.onchange=e=>{showPlow=e.target.checked;draw();};
function isFullClosure(a){const t=(a.title+' '+(a.desc||'')).toLowerCase();return a.type==='CL'&&/clos/.test(t)&&!/(lane|ramp|exit|rest area|shoulder|on ?ramp|off ?ramp|connector)/.test(t);}
Promise.all([loadCams(),loadAlerts(),PASS.area?loadConds():Promise.resolve([]),PASS.area?loadFires():Promise.resolve([]),PLOWS?loadPlows():Promise.resolve([])]).then(([c,a,w,f,pl])=>{CAMS=c;ALERTS=a;CONDS=w;FIRES=f;PLOWLIST=pl;document.getElementById('statCams').textContent=CAMS.length;document.getElementById('statAlerts').textContent=ALERTS.length;draw();if(PASS.area)renderLists();if(PLOWS)renderPlows();const fc=ALERTS.filter(isFullClosure);if(fc.length){const fl=fc[0];const bn=document.getElementById('critBanner');bn.innerHTML=PASS.area?('⚠ '+fc.length+' full closure'+(fc.length>1?'s':'')+' within ${p.rMi || ''} miles: '+fc.slice(0,3).map(x=>esc(x.route||'road')+(x.mp>0?' near MP '+Math.round(x.mp):'')).join(', ')+'. Details in the closures list below.'):('⚠ CRITICAL: the ${p.name} area has '+fc.length+' active full-closure alert'+(fc.length>1?'s':'')+' ${p.bannerWhere || `on ${p.route}`}'+(fl.mp>0?' near MP '+Math.round(fl.mp):'')+'. Tap a red marker for details.');bn.style.display='block';}}).catch(()=>{document.getElementById('coStatus').textContent='Live data unavailable right now — try again shortly.';});
if(SNOW){loadSnow().catch(()=>{document.getElementById('snAsOf').textContent='The station did not answer. Try again in a few minutes.';});loadForecast().catch(()=>{});loadAvy().catch(()=>{});}
</script>

</body>
</html>`;
}

// Optional slugs on the command line write only those pages, e.g.
//   node scripts/gen-pass-pages.js cabbage-hill rainier-roads
// No slugs = every pass and area page, as before.
const only=process.argv.slice(2);
let n=0;
for(const p of [...PASSES, ...AREAS]){
  if(only.length&&!only.includes(p.slug))continue;
  const dir=p.out||path.join('passes',p.slug);
  fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,'index.html'),page(p));
  n++;
  console.log('wrote '+dir+'/index.html  ('+p.name+', '+p.route+')');
}
console.log('\nGenerated '+n+' page'+(n===1?'':'s')+'.');
