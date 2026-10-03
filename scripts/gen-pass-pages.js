// Generates /passes/<slug>/index.html for each mountain pass from one template.
// Shared structure = the proven Snoqualmie page; per-pass content below is unique
// (hero, closure story, extra note, FAQ) so each page stands on its own for SEO.
// Run: node scripts/gen-pass-pages.js   (writes files + prints a summary)
const fs = require('fs');
const path = require('path');
const SPON = require('./lib/sponsor-slot'); // one sponsor slot above the eyebrow (2026-09-24)

const PASSES = [
  {
    slug: 'snoqualmie', name: 'Snoqualmie Pass', route: 'I-90', state: 'WA', stateName: 'Washington',
    // Search Console 2026-09-25: "driving conditions snoqualmie pass" = 5,038 impressions, 0 clicks. Title leads with that phrase.
    title: 'Snoqualmie Pass Driving Conditions Now: I-90 Cameras &amp; Chains | MileCheck',
    h1: 'Snoqualmie Pass driving conditions right now',
    desc: 'Snoqualmie Pass driving conditions on I-90: WSDOT restrictions and chain rules for each direction, summit temperature, live cameras, and closures, with the mile marker on every camera.',
    dot: 'WSDOT', lat: 47.3923, lon: -121.4001, r: 30, elev: '3,022 ft', dist: '~52 mi', distNote: 'east of Seattle on I-90',
    range: 'Cascade Range',
    hero: `See the summit before you drive it. Live WSDOT cameras and real-time conditions on I-90 over Snoqualmie Pass. Snow, chains, and closures as they happen. WSDOT reports about 28,000 vehicles a day over the pass, on the main route between Seattle and Eastern Washington.`,
    closes: `The pass stays open most of the year, but heavy Cascade snow and scheduled avalanche control work close I-90 over the summit several times each winter, sometimes for a couple of hours and occasionally longer. Closures can happen with little notice, which is exactly why the live cameras above are worth a look before you leave.`,
    // Reference sections + FAQ additions: ChatGPT draft 2026-09-25, sources rechecked (scripts/passes/).
    segs: [{ h: 'When it closes', p: `The pass stays open most of the year, but heavy Cascade snow and scheduled avalanche control work close I-90 over the summit several times each winter. Closures can happen with little notice, which is why the live cameras above are worth a look before you leave.` }, ...require('./passes/snoqualmie-reference.cjs').segs],
    // Snow block (2026-09-24). Nearest SNOTEL to the summit (47.4245,-121.4131) is Olallie Meadows, 3.7 mi, 4,010 ft. Resort URLs verified 2026-09-24.
    snow: { station: '672:WA:SNTL', stationName: 'Olallie Meadows', stationElev: '4,010 ft', stationNote: '3.7 miles from the summit and about 1,000 feet above it', avyCenter: 'NWAC', title: 'Snow at Snoqualmie Pass',
      resort: { name: 'The Summit at Snoqualmie', report: 'https://www.summitatsnoqualmie.com/mountain-report', tickets: 'https://www.summitatsnoqualmie.com/tickets' } },
    faq: [
      ['Is Snoqualmie Pass open right now?', `The <a href="#comap">live map above</a> shows active closures and incidents on I-90 over the pass as red and orange markers, straight from WSDOT. For closures across the whole US, see the <a href="../../closures/">road closures map</a>. The pass shuts for avalanche control and heavy snow several times each winter.`],
      ['Are chains required on Snoqualmie Pass?', `Requirements change with conditions and are set by WSDOT for each direction. Read the restriction lines above, watch the <a href="#comap">live cameras</a> for snow and ice, and follow the posted signs. See what each restriction line means below.`],
      ['How high is Snoqualmie Pass?', `The summit is 3,022 feet, according to WSDOT. See <a href="../../cameras/">every camera in Washington and 24 other states</a> for the rest of your route.`],
      ['How far is Snoqualmie Pass from Seattle?', `About 52 miles east on I-90, roughly an hour in good conditions. Track your exact mile marker over the pass hands-free with the <a href="https://apps.apple.com/us/app/milecheck/id6759212851" target="_blank" rel="noopener">MileCheck app</a> on CarPlay or Android Auto.`],
      ['How much snow is at Snoqualmie Pass right now?', `The snow block above reads the USDA SNOTEL station at Olallie Meadows, 3.7 miles from the summit at 4,010 feet. It shows depth, the change over 24 hours, snow water and temperature, updated hourly. <a href="https://www.summitatsnoqualmie.com/mountain-report" target="_blank" rel="noopener">The Summit at Snoqualmie</a> posts its own mountain report and lift status for Alpental, Summit West, Summit Central and Summit East.`],
      ...require('./passes/snoqualmie-reference.cjs').faq,
    ],
  },
  {
    slug: 'stevens', name: 'Stevens Pass', route: 'US-2', state: 'WA', stateName: 'Washington',
    dot: 'WSDOT', lat: 47.7462, lon: -121.0890, r: 30, elev: '4,061 ft', dist: '~78 mi', distNote: 'northeast of Seattle on US-2',
    range: 'Cascade Range',
    hero: `See the summit before you drive it. Live WSDOT cameras and real-time conditions on US-2 over Stevens Pass. Snow, chains, and closures in real time. It's the northern Cascade crossing between the Seattle area and Wenatchee, and home to the Stevens Pass ski area.`,
    closes: `Stevens is higher and snowier than Snoqualmie, and US-2 over the summit closes regularly through the winter for avalanche control and heavy snowfall, sometimes for extended windows when the avalanche danger is high above the highway. Check the cameras before you leave. Conditions here turn quickly.`,
    extra: { h: 'Ski traffic and snow', p: `The Stevens Pass ski resort sits right at the summit, so winter weekends stack recreational traffic on top of freight and commuters. On a snowy Saturday the combination of a chain requirement and a full parking lot can crawl the highway. The cameras show you what you're driving into before you're committed to the climb.` },
    // Snow block (2026-09-24). Stevens Pass SNOTEL sits 0.2 mi from the summit at 3,940 ft.
    snow: { station: '791:WA:SNTL', stationName: 'Stevens Pass', stationElev: '3,940 ft', stationNote: 'at the summit', avyCenter: 'NWAC', title: 'Snow at Stevens Pass',
      resort: { name: 'Stevens Pass', report: 'https://www.stevenspass.com/the-mountain/mountain-conditions/snow-and-weather-report.aspx', tickets: 'https://www.stevenspass.com/plan-your-trip/lift-access/tickets.aspx' } },
    faq: [
      ['Is Stevens Pass open right now?', `The <a href="#comap">live map above</a> shows active closures and incidents on US-2 over the pass, straight from WSDOT. See the <a href="../../closures/">US road closures map</a> for the bigger picture. Stevens closes for avalanche control and heavy snow several times each winter.`],
      ['Are chains required on Stevens Pass?', `Traction and chain requirements are set by WSDOT and change fast in a storm. Watch the <a href="#comap">live cameras above</a> for snow and ice, and always follow posted signs at the pass.`],
      ['How high is Stevens Pass?', `The summit is 4,061 feet on US-2 in the Cascades, higher and typically snowier than nearby Snoqualmie Pass on I-90. Compare conditions with <a href="../snoqualmie/">Snoqualmie Pass</a>.`],
      ['How far is Stevens Pass from Seattle?', `About 78 miles northeast on US-2, roughly two hours in good weather. Track your mile marker over the pass hands-free with the <a href="https://apps.apple.com/us/app/milecheck/id6759212851" target="_blank" rel="noopener">MileCheck app</a>.`],
      ['How much snow is at Stevens Pass right now?', `The snow block above reads the USDA SNOTEL station at the summit, 3,940 feet. It shows depth, the change over 24 hours, snow water and temperature, updated hourly. The ski area posts its own <a href="https://www.stevenspass.com/the-mountain/mountain-conditions/snow-and-weather-report.aspx" target="_blank" rel="noopener">snow and weather report</a>.`],
    ],
  },
  {
    slug: 'siskiyou', name: 'Siskiyou Summit', route: 'I-5', state: 'OR', stateName: 'Oregon',
    dot: 'ODOT', lat: 42.0672, lon: -122.5606, r: 30, elev: '4,310 ft', dist: 'just north of', distNote: 'the California line, south of Ashland on I-5',
    range: 'Siskiyou Mountains',
    hero: `See the summit before you drive it. Live ODOT cameras and real-time conditions on I-5 over Siskiyou Summit, the highest point on Interstate 5 and the winter wildcard between Oregon and California.`,
    closes: `If any part of I-5 is going to close in winter, it's usually here. At 4,310 feet, Siskiyou Summit gets snow and ice that shut the interstate or force chain requirements several times a season. Because it's the only I-5 crossing of this range, a closure here backs up traffic for hours in both states.`,
    extra: { h: 'The high point of I-5', p: `Siskiyou Summit is the highest elevation on all 1,381 miles of Interstate 5, from Canada to Mexico. That's why it, and the Grapevine far to the south, are the two spots drivers actually have to plan around in winter. Southbound, it's the last climb before the long drop into California.` },
    faq: [
      ['Is I-5 over Siskiyou Summit open right now?', `The <a href="#comap">live map above</a> shows active closures and incidents on I-5 over the summit, straight from ODOT. See the whole route on the <a href="../../corridors/i-5/">I-5 corridor page</a> or the <a href="../../closures/">US closures map</a>.`],
      ['Are chains required on Siskiyou Summit?', `Chain and traction requirements are set by ODOT and change with the weather. Watch the <a href="#comap">live cameras above</a> for snow and ice on the roadway, and follow posted signs. This pass can go from clear to chains-required quickly.`],
      ['What is the highest point on I-5?', `Siskiyou Summit, at 4,310 feet in southern Oregon, the highest elevation on Interstate 5. The <a href="../grapevine/">Grapevine</a> in California is the other big winter closure spot.`],
      ['Where exactly is Siskiyou Summit?', `On I-5 in southern Oregon, a few miles north of the California border and south of Ashland. Track your exact mile marker over the pass with the <a href="https://apps.apple.com/us/app/milecheck/id6759212851" target="_blank" rel="noopener">MileCheck app</a>.`],
    ],
  },
  {
    slug: 'grapevine', name: 'The Grapevine (Tejon Pass)', route: 'I-5', state: 'CA', stateName: 'California',
    dot: 'Caltrans', lat: 34.7947, lon: -118.8790, r: 35, elev: '4,144 ft', dist: '~40 mi', distNote: 'north of Los Angeles on I-5',
    range: 'Tehachapi Mountains',
    hero: `See the pass before you drive it. Live Caltrans cameras and real-time conditions on I-5 over the Grapevine, the steep climb over Tejon Pass between the San Joaquin Valley and Los Angeles, and the spot most likely to close Southern California's main north–south route.`,
    closes: `"The Grapevine is closed" makes the news in LA for a reason: snow and high wind shut this stretch of I-5 several times each winter, sometimes stranding traffic for hours because there's no easy detour. When a storm drops the snow level to pass elevation, this is the first place it bites.`,
    extra: { h: 'No easy way around', p: `Tejon Pass tops out at 4,144 feet, and I-5 is the only fast route over it. The alternatives add hours. That's why a Grapevine closure ripples across the whole state's freight and holiday traffic. The cameras here are the quickest way to know whether the climb is bare, wet, or white before you leave the valley or the basin.` },
    faq: [
      ['Is the Grapevine closed right now?', `The <a href="#comap">live map above</a> shows active closures and incidents on I-5 over Tejon Pass, straight from Caltrans. See the full route on the <a href="../../corridors/i-5/">I-5 corridor page</a> or the <a href="../../closures/">US closures map</a>. Snow and wind close it several times a winter.`],
      ['Why does the Grapevine close so often?', `At 4,144 feet, Tejon Pass catches snow and fierce wind when storms push through, and there's no quick detour, so Caltrans closes I-5 rather than risk it. Watch the <a href="#comap">live cameras above</a> to see conditions on the climb.`],
      ['How high is the Grapevine?', `Tejon Pass, the summit of the Grapevine, is 4,144 feet, the second big winter closure point on I-5 after <a href="../siskiyou/">Siskiyou Summit</a> in Oregon.`],
      ['Where is the Grapevine on I-5?', `About 40 miles north of Los Angeles, between the San Joaquin Valley and the LA Basin. Track your mile marker over the pass with the <a href="https://apps.apple.com/us/app/milecheck/id6759212851" target="_blank" rel="noopener">MileCheck app</a> on CarPlay or Android Auto.`],
    ],
  },
  {
    slug: 'donner', name: 'Donner Pass', route: 'I-80', state: 'CA', stateName: 'California',
    dot: 'Caltrans', lat: 39.3126, lon: -120.3269, r: 30, elev: '7,056 ft', dist: 'near Truckee,', distNote: 'in the Sierra Nevada on I-80',
    range: 'Sierra Nevada',
    hero: `See the summit before you drive it. Live Caltrans cameras and real-time conditions on I-80 over Donner Pass, one of the snowiest stretches of interstate in America and the main Sierra Nevada crossing between Sacramento and Reno.`,
    closes: `Donner is in a league of its own for snow. Sierra storms can drop feet in a day, and Caltrans runs chain controls and full closures on I-80 over the summit throughout the winter. When a big system lines up on the Sierra crest, this pass can close for a day or more. Check the cameras and chain status before you head up.`,
    extra: { h: 'Chain controls are the norm', p: `At 7,056 feet, Donner sees chain requirements far more often than the lower coastal passes. In a wet winter, R2 (chains required) is a regular weekend condition, not a rare event. The name comes from the Donner Party of 1846, stranded here by exactly the kind of snow the cameras now let you check from your couch.` },
    faq: [
      ['Is Donner Pass open right now?', `The <a href="#comap">live map above</a> shows active closures and incidents on I-80 over the summit, straight from Caltrans. See the whole route on the <a href="../../corridors/i-80/">I-80 corridor page</a> or the <a href="../../closures/">US closures map</a>.`],
      ['Are chains required on Donner Pass?', `Very often in winter. Caltrans sets chain controls (R1/R2/R3) on I-80 that change with each storm. Watch the <a href="#comap">live cameras above</a> for snow on the roadway and always follow the posted control level.`],
      ['How high is Donner Pass?', `The I-80 summit is 7,056 feet in the Sierra Nevada, far higher and snowier than the coastal passes. That is why chain controls here are routine, not rare.`],
      ['Where is Donner Pass?', `On I-80 in the Sierra Nevada near Truckee, between Sacramento and Reno. Track your exact mile marker over the summit with the <a href="https://apps.apple.com/us/app/milecheck/id6759212851" target="_blank" rel="noopener">MileCheck app</a>.`],
    ],
  },
  {
    slug: 'cajon', name: 'Cajon Pass', route: 'I-15', state: 'CA', stateName: 'California',
    dot: 'Caltrans', lat: 34.3419, lon: -117.4436, r: 22, elev: '~4,190 ft', dist: '~55 mi', distNote: 'northeast of Los Angeles on I-15',
    range: 'San Bernardino Mountains',
    hero: `See the pass before you drive it. Live Caltrans cameras and real-time conditions on I-15 over Cajon Pass, the busy gateway between the Los Angeles Basin and the High Desert, and the main route toward Las Vegas.`,
    closes: `Cajon rarely closes for its elevation alone, but it's a wind, snow, and wildfire funnel. Winter storms occasionally drop snow to the summit and force chain controls. Strong Santa Ana and canyon winds flip trucks. In fire season, blazes in the pass have shut I-15 entirely. The cameras tell you which of those, if any, you're dealing with today.`,
    extra: { h: 'The LA–Vegas chokepoint', p: `I-15 through Cajon Pass is one of the most heavily traveled mountain crossings in the country. The whole Los Angeles-to-Las Vegas flow squeezes through here, on top of daily High Desert commuters. That volume means even a minor incident on the grade backs traffic up for miles, so a quick camera check before you commit to the climb pays off.` },
    faq: [
      ['Is Cajon Pass open right now?', `The <a href="#comap">live map above</a> shows active closures and incidents on I-15 over the pass, straight from Caltrans. For the wider picture, see the <a href="../../closures/">US road closures map</a>.`],
      ['Does it snow on Cajon Pass?', `Occasionally. At about 4,190 feet, Cajon Summit catches snow only in colder storms, but when it does, Caltrans runs chain controls on I-15. Wind and wildfire close it more often than snow. Watch the <a href="#comap">live cameras above</a>.`],
      ['How high is Cajon Pass?', `Cajon Summit on I-15 is about 4,190 feet, between the LA Basin and the High Desert around Victorville.`],
      ['Where is Cajon Pass?', `On I-15 about 55 miles northeast of Los Angeles, on the main route to Las Vegas. Track your mile marker over the grade with the <a href="https://apps.apple.com/us/app/milecheck/id6759212851" target="_blank" rel="noopener">MileCheck app</a> on CarPlay or Android Auto.`],
    ],
  },
  {
    slug: 'parleys', name: 'Parleys Summit', route: 'I-80', state: 'UT', stateName: 'Utah',
    dot: 'UDOT', lat: 40.7519, lon: -111.6377, r: 20, elev: '~7,020 ft', dist: 'just east of', distNote: 'Salt Lake City on I-80',
    range: 'Wasatch Range',
    hero: `See the canyon before you drive it. Live UDOT cameras and real-time conditions on I-80 through Parleys Canyon over Parleys Summit, the main route out of Salt Lake City toward Park City and the Wasatch ski country.`,
    closes: `Parleys Canyon funnels every Salt Lake–to–Park City driver up a steep grade into Wasatch snow, and UDOT runs chain and traction restrictions here through the winter. Heavy snow and blowing snow in the canyon can slow it to a crawl or close it, and truck restrictions are common when the grade turns icy. Check the cameras before you head up.`,
    extra: { h: 'Ski-country commute', p: `On a snowy morning, Parleys stacks resort-bound traffic, freight, and commuters onto the same steep grade. That is why a single spun-out truck can back the canyon up for miles. At about 7,020 feet at the summit, conditions here can be completely different from the dry valley floor a few minutes behind you.` },
    // Snow + plows (2026-09-24). Parleys Summit SNOTEL 0.8 mi from the summit, 7,590 ft. Plows from the Worker /plows?state=UT (UDOT servicevehicles).
    snow: { station: '684:UT:SNTL', stationName: 'Parleys Summit', stationElev: '7,590 ft', stationNote: 'less than a mile from the summit', avyCenter: 'UAC', title: 'Snow at Parleys Summit' },
    plows: { states: ['UT'], agency: 'UDOT' },
    faq: [
      ['Is Parleys Canyon (I-80) open right now?', `The <a href="#comap">live map above</a> shows active closures and incidents on I-80 through Parleys, straight from UDOT. See the whole route on the <a href="../../corridors/i-80/">I-80 corridor page</a> or the <a href="../../closures/">US closures map</a>.`],
      ['Are chains or snow tires required on Parleys Summit?', `UDOT sets traction and chain restrictions in Parleys Canyon through the winter, and they change with each storm. Watch the <a href="#comap">live cameras above</a> for snow on the grade and follow posted restrictions.`],
      ['How high is Parleys Summit?', `About 7,020 feet on I-80 in the Wasatch Range, high enough that the summit can be in a snowstorm while Salt Lake City stays dry.`],
      ['Where is Parleys Summit?', `On I-80 just east of Salt Lake City, at the top of Parleys Canyon toward Park City. Track your mile marker up the canyon with the <a href="https://apps.apple.com/us/app/milecheck/id6759212851" target="_blank" rel="noopener">MileCheck app</a>.`],
      ['Where are the plows?', `The Snowplows list above shows UDOT plow positions within the map radius, updated about every minute. The map draws each one as an arrow pointing the way it is heading. Parked trucks are listed too.`],
    ],
  },
  {
    slug: 'eisenhower', name: 'Eisenhower Tunnel', route: 'I-70', state: 'CO', stateName: 'Colorado',
    dot: 'CDOT', lat: 39.6767, lon: -105.9364, r: 22, elev: '11,158 ft', dist: '~60 mi', distNote: 'west of Denver on I-70',
    range: 'Continental Divide',
    hero: `See the tunnel before you drive it. Live CDOT cameras and real-time conditions on I-70 at the Eisenhower–Johnson Memorial Tunnels, the highest point on the U.S. Interstate Highway System and the main route from Denver to Colorado's ski country.`,
    closes: `The tunnel bores through the Continental Divide, so it doesn't close for snow the way an open summit does. The approaches on both sides do, for avalanche control, whiteout conditions, and the crashes that pile up on a steep, high-altitude grade in bad weather. Chain law and traction law restrictions on I-70 through this stretch are common all winter, and holiday ski traffic can back the approaches up for miles even in clear weather.`,
    extra: { h: 'The highest point on the Interstate System', p: `At 11,158 feet, the Eisenhower Tunnel is the highest elevation reached anywhere on the U.S. Interstate Highway System. Air is noticeably thinner here, grades are steep on both approaches, and the westbound bore (Eisenhower) and eastbound bore (Johnson) are close enough together that an incident in one often slows traffic in both.` },
    // Snow + plows (2026-09-24). Loveland Basin SNOTEL 1.8 mi from the tunnel, 11,410 ft. Plows from /plows?state=CO (COtrip snowPlows).
    snow: { station: '602:CO:SNTL', stationName: 'Loveland Basin', stationElev: '11,410 ft', stationNote: 'about 2 miles from the tunnel', avyCenter: 'CAIC', title: 'Snow at the Eisenhower Tunnel' },
    plows: { states: ['CO'], agency: 'CDOT' },
    faq: [
      ['Is the Eisenhower Tunnel open right now?', `The <a href="#comap">live map above</a> shows active closures and incidents on I-70 through the tunnel and its approaches, straight from CDOT. See the whole route on the <a href="../../corridors/i-70/">I-70 corridor page</a> or the <a href="../../closures/">US closures map</a>. Closures here are usually avalanche control or weather on the approach grades, not the tunnel itself.`],
      ['Are chains required at the Eisenhower Tunnel?', `CDOT sets traction and chain law restrictions on I-70 through this stretch, and they tighten fast in a storm. Watch the <a href="#comap">live cameras above</a> for conditions on the approach grades, and always follow posted signs.`],
      ['How high is the Eisenhower Tunnel?', `11,158 feet, the highest point on the U.S. Interstate Highway System. Compare it with <a href="../vail/">Vail Pass</a> further west on the same corridor.`],
      ['How far is the Eisenhower Tunnel from Denver?', `About 60 miles west on I-70. Track your mile marker through the tunnel and over the Divide with the <a href="https://apps.apple.com/us/app/milecheck/id6759212851" target="_blank" rel="noopener">MileCheck app</a> on CarPlay or Android Auto.`],
      ['Where are the plows?', `The Snowplows list above shows CDOT plow positions within the map radius, updated about every minute. The map draws each one as an arrow pointing the way it is heading. Parked trucks are listed too.`],
    ],
  },
  {
    slug: 'vail', name: 'Vail Pass', route: 'I-70', state: 'CO', stateName: 'Colorado',
    dot: 'CDOT', lat: 39.5264, lon: -106.2136, r: 22, elev: '10,662 ft', dist: '~100 mi', distNote: 'west of Denver on I-70',
    range: 'Gore Range',
    hero: `See the summit before you drive it. Live CDOT cameras and real-time conditions on I-70 over Vail Pass, the high, exposed crossing between Copper Mountain and Vail on Colorado's busiest mountain corridor.`,
    closes: `Vail Pass sits well above treeline on both approaches, so it takes the full force of Rocky Mountain storms with little wind protection. Heavy snow, whiteouts, and avalanche control work close I-70 here several times most winters, sometimes for hours at a stretch. It's also one of the most crash-prone stretches on the corridor when a storm hits during peak ski traffic.`,
    extra: { h: 'The exposed stretch of I-70', p: `Unlike the tunneled crossing at the <a href="../eisenhower/">Eisenhower Tunnel</a> 40 miles east, Vail Pass is a fully exposed summit. The highway climbs into open alpine terrain with no tree cover to block wind and blowing snow. That's why it's often the first part of the Denver-to-Vail drive to see a chain law or full closure when a storm rolls in.` },
    // Snow + plows (2026-09-24). Copper Mountain SNOTEL 3.4 mi from the summit, 10,500 ft.
    snow: { station: '415:CO:SNTL', stationName: 'Copper Mountain', stationElev: '10,500 ft', stationNote: 'about 3 miles from the summit', avyCenter: 'CAIC', title: 'Snow at Vail Pass' },
    plows: { states: ['CO'], agency: 'CDOT' },
    faq: [
      ['Is Vail Pass open right now?', `The <a href="#comap">live map above</a> shows active closures and incidents on I-70 over the pass, straight from CDOT. See the whole route on the <a href="../../corridors/i-70/">I-70 corridor page</a> or the <a href="../../closures/">US closures map</a>. Vail Pass closes for avalanche control and heavy snow several times most winters.`],
      ['Are chains required on Vail Pass?', `CDOT sets traction and chain law restrictions on I-70 over the summit, and they change fast in a storm. This is one of the more frequently restricted stretches on the corridor. Watch the <a href="#comap">live cameras above</a> and follow posted signs.`],
      ['How high is Vail Pass?', `10,662 feet, lower than the <a href="../eisenhower/">Eisenhower Tunnel</a> 40 miles east, but more exposed to wind and blowing snow since it's an open summit, not a tunnel.`],
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
    // For the printable map sheet: the state highways plus the park roads they lead to,
    // which are not state highways and would otherwise drop Paradise and Longmire off
    // the map (review, 9/30). Road names and points from OpenStreetMap, 2026-09-30.
    mapRoads: ['SR 706', 'SR 410', 'SR 123', 'US 12', 'SR 165', 'Nisqually Entrance to Longmire Road', 'Longmire-to-Paradise Road', 'Stevens Canyon Road', 'Sunrise Park Road'],
    mapNotes: [
      { label: 'Longmire. The road above it closes at night in winter', lat: 46.74974, lon: -121.81235, snap: 'Longmire-to-Paradise Road' },
      { label: 'Paradise, 5,400 ft. Jackson Visitor Center', lat: 46.78587, lon: -121.73676 },
      { label: 'Sunrise. Road open about July to early October', lat: 46.91445, lon: -121.64345 },
    ],
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
    kind: 'area', slug: 'angeles-roads', out: 'mountains/angeles/roads', up: '../../../',
    url: 'https://milecheckapp.com/mountains/angeles/roads/',
    name: 'Mount Angeles', route: 'Hurricane Ridge Road · US 101', state: 'WA', states: ['WA'], stateName: 'Washington',
    dot: 'WSDOT', credit: 'National Park Service, WSDOT and NIFC via MileCheck',
    // Centre and radius from docs/seo-briefs-2026-09-28.md. Hurricane Ridge Road facts: NPS places page and winter page. US 101 cameras: WSDOT real-time travel data.
    lat: 47.9956, lon: -123.4633, rMi: 25,
    title: 'Mount Angeles road cameras and conditions right now | MileCheck',
    desc: 'Hurricane Ridge road access, NPS ridge webcams and US 101 cameras near Port Angeles and Sequim. Agency reports within 25 miles of Mount Angeles.',
    ogTitle: 'Mount Angeles road cameras and conditions | MileCheck',
    eyebrow: 'Hurricane Ridge Road · US 101 · Washington',
    h1: 'Mount Angeles road cameras and conditions',
    hero: `Check Hurricane Ridge access and US 101 cameras near Port Angeles and Sequim. The map shows agency cameras and reports within 25 miles of Mount Angeles.`,
    coverage: `The NPS webcams show the ridge and parking lot, not the road below. Check <a href="https://www.nps.gov/olym/planyourvisit/conditions.htm">NPS road status</a> before driving into the park.`,
    markerLabel: 'Mount Angeles',
    camLabel: 'live cameras within 25 mi', elev: '5,242 ft', elevLabel: 'Hurricane Ridge, per the National Park Service',
    dist: '25 mi', distNote: 'radius from Mount Angeles', nearWord: 'within 25 miles of Mount Angeles', bannerWhere: 'on the roads around Mount Angeles',
    aboutH: 'The road to Hurricane Ridge',
    lede: `Hurricane Ridge Road climbs from Port Angeles into Olympic National Park. US 101 is the through-road around the north side of the peninsula. The agencies that run each road post different data.`,
    segs: [
      // NPS: https://www.nps.gov/places/000/hurricane-ridge-road.htm and https://www.nps.gov/olym/planyourvisit/hurricane-ridge-in-winter.htm
      { h: 'Hurricane Ridge Road', p: `Hurricane Ridge Road runs 17 miles from Port Angeles to the ridge at 5,242 feet. NPS posts <a href="https://www.nps.gov/olym/planyourvisit/hurricane-ridge-in-winter.htm">winter opening days and chain requirements</a>. Every vehicle must carry tire chains above Heart O' the Hills from November 1 through April 1, including four-wheel drive.` },
      // NPS: https://www.nps.gov/olym/planyourvisit/hurricane-ridge-in-winter.htm and https://www.nps.gov/olym/learn/photosmultimedia/hurricane-ridge-webcam.htm
      { h: 'The ridge facilities', p: `The Hurricane Ridge Day Lodge burned in May 2023. The park now uses temporary trailers for restrooms and a visitor contact station. The webcam shows the ridge and parking lot, but not the 17 miles of road below it.` },
      // WSDOT real-time travel data: https://wsdot.com/travel/real-time/ and the US 101 camera map.
      { h: 'US 101 around the peninsula', p: `US 101 is the road around the Olympic Peninsula. WSDOT cameras near Port Angeles and Sequim show the approach roads outside the park. The map is limited to the feeds that return inside the radius.` },
    ],
    // Product features follow the existing Rainier/Hood entries. No camera is promised on an unmonitored road.
    driveP: `MileCheck shows your mile marker on US 101 as you drive. The mile marker works without a signal. Camera images and alerts need a connection.`,
    faq: [
      ['Is Hurricane Ridge Road open right now?', `The National Park Service posts current conditions on its <a href="https://www.nps.gov/olym/planyourvisit/conditions.htm" target="_blank" rel="noopener">Olympic National Park conditions page</a>. The cameras above show the ridge and the roads near Port Angeles.`,],
      ['Are chains required on Hurricane Ridge Road?', `Yes. The National Park Service requires every vehicle to carry tire chains above Heart O' the Hills from November 1 through April 1, including four-wheel-drive vehicles.`,],
      ['How high is Hurricane Ridge?', `Hurricane Ridge is at 5,242 feet, 17 miles south of Port Angeles.`,],
      ['Is Mount Angeles visible right now?', `Check the <a href="../">Mount Angeles visibility page</a> for views from Port Angeles, Sequim and the surrounding region. For the range seen from Seattle, use the <a href="../../olympics/">Olympics visibility page</a>.`,],
      ['Where do the cameras come from?', `The Hurricane Ridge cameras are from the National Park Service. The US 101 cameras are from WSDOT. Wildfires come from the national NIFC feed. Tap any camera on the map, or in the list, to see its latest frame.`,],
    ],
    crumbs: [
      { name: 'MileCheck', item: 'https://milecheckapp.com/' },
      { name: 'Mountains', item: 'https://milecheckapp.com/mountains/' },
      { name: 'Mount Angeles', item: 'https://milecheckapp.com/mountains/angeles/' },
      { name: 'Road cameras and conditions', item: 'https://milecheckapp.com/mountains/angeles/roads/' },
    ],
    vis: { h: 'Is Mount Angeles visible right now?', p: `Check the visibility estimate from Port Angeles, Sequim and nearby towns. Road access and a clear view are separate questions.`, href: '../', cta: 'Check visibility now' },
    ctaH: 'MileCheck on US 101', ctaP: `See your mile marker and nearby reports in the app. MileCheck also runs on CarPlay and Android Auto.`,
    related: (up) => `<a href="../">Is Mount Angeles visible right now?</a> · <a href="${up}cameras/washington/">Washington cameras</a> · <a href="${up}cameras/">all highway cameras</a> · <a href="${up}closures/">road closures</a> · <a href="${up}fire/">wildfire map</a>`,
  },
  {
    kind: 'area', slug: 'baker-roads', out: 'mountains/baker/roads', up: '../../../',
    url: 'https://milecheckapp.com/mountains/baker/roads/',
    name: 'Mount Baker', route: 'SR 542', state: 'WA', states: ['WA'], stateName: 'Washington',
    dot: 'WSDOT', credit: 'WSDOT and NIFC via MileCheck',
    // Centre and radius from docs/seo-briefs-2026-09-28.md. SR 542 corridor: WSDOT corridor sketch and pass page.
    lat: 48.7767, lon: -121.8144, rMi: 25,
    title: 'Mount Baker road cameras and conditions right now | MileCheck',
    desc: 'SR 542 and Artist Point road access, seasonal closures and agency reports within 25 miles of Mount Baker. Camera coverage is limited.',
    ogTitle: 'Mount Baker road cameras and conditions | MileCheck',
    eyebrow: 'SR 542 · Mount Baker Highway · Washington',
    h1: 'Mount Baker road cameras and conditions',
    hero: `SR 542 runs from Bellingham through Glacier to Artist Point. Check seasonal access below, with agency reports within 25 miles of Mount Baker.`,
    // Live /cameras?state=WA checked 2026-09-28. Only two Mears Field airport cameras returned within 25 mi, no SR 542 camera.
    coverage: `The September 28, 2026 feed check returned airport views near Concrete, but no SR 542 road camera in this radius. Check <a href="https://wsdot.com/travel/real-time/mountainpasses/mt.-baker">WSDOT's Mt. Baker Highway report</a> for road access.`,
    markerLabel: 'Mount Baker',
    camLabel: 'live cameras within 25 mi', elev: '5,140 ft', elevLabel: 'Artist Point',
    dist: '25 mi', distNote: 'radius from the summit', nearWord: 'within 25 miles of the summit', bannerWhere: 'on the roads around Mount Baker',
    aboutH: 'The road to Mount Baker',
    lede: `SR 542 is the Mount Baker Highway. It runs from Bellingham through Glacier to Artist Point. WSDOT reports the state highway data.`,
    segs: [
      // USFS alert posted September 27, 2026, ends October 7: https://www.fs.usda.gov/r06/mbs/alerts/mt-baker-highway-sr-542-closed-winter-prep
      { h: 'Daytime closures September 30 to October 6, 2026', p: `The Forest Service lists closures between Silver Fir Campground at milepost 48 and Picture Lake at milepost 54 on September 30, October 1, October 5 and October 6. Hours are 7:30 a.m. to 4 p.m. Traffic cannot pass in either direction during that work. See the <a href="https://www.fs.usda.gov/r06/mbs/alerts/mt-baker-highway-sr-542-closed-winter-prep">winter-preparation alert</a>.` },
      // Elevation and route: https://www.fs.usda.gov/r06/mbs/recreation/mt-baker-highway-sr-542
      // Seasonal segment: https://wsdot.wa.gov/about/news/2026/sr-542-road-artist-point-mount-baker-reopens-season-wednesday-june-10
      { h: 'SR 542 to Artist Point', p: `The Mount Baker Highway climbs from Bellingham to Artist Point at 5,140 feet. The final 2.7 miles above the ski area close for winter. Snow removal determines the opening date. In 2026, WSDOT reopened that section on June 10.` },
      // WSDOT corridor sketch: https://wsdot.wa.gov/sites/default/files/2021-10/CSS272-SR542-SR9JctDeming-ArtistPoint.pdf
      { h: 'Through Glacier', p: `SR 542 passes through Glacier before the climb to Heather Meadows and Artist Point. The <a href="https://www.fs.usda.gov/r06/mbs/recreation/mt-baker-highway-sr-542">Forest Service highway page</a> lists the Glacier Public Service Center near milepost 34 for forest-road and trail information.` },
      // WSDOT real-time data: https://wsdot.com/travel/real-time/ and NIFC through MileCheck.
      { h: 'What the map covers', p: `This is a 25-mile radius around the summit, not the entire drive from Bellingham. It shows WSDOT reports that fall inside that radius and fires from NIFC.` },
    ],
    driveP: `MileCheck shows your mile marker on SR 542 as you drive. The mile marker works without a signal. Camera images and alerts need a connection.`,
    faq: [
      ['Is the road to Artist Point open right now?', `WSDOT posts the current status on its <a href="https://wsdot.com/travel/real-time/mountainpasses/mt.-baker" target="_blank" rel="noopener">Mt. Baker Highway pass page</a>. The final 2.7 miles close for winter and reopen after crews clear the snow.`,],
      ['How high is Artist Point?', `Artist Point is at about 5,140 feet at the end of SR 542. The WSDOT pass report lists the highway pass elevation separately.`,],
      ['When does the road to Artist Point close?', `WSDOT closes the last 2.7 miles each fall, typically with the first snowfall. The opening date depends on snow removal and road conditions.`,],
      ['Is Mount Baker visible right now?', `A different question from whether SR 542 is open. The <a href="../">visibility page</a> reads the cloud ceilings between Vancouver, Bellingham and the summit and answers it for the region.`,],
      ['Are there live cameras on SR 542 here?', `The September 28, 2026 feed check returned two WSDOT airport cameras near Concrete and no SR 542 road camera within 25 miles of Mount Baker. The camera list updates when the page loads.`,],
    ],
    crumbs: [
      { name: 'MileCheck', item: 'https://milecheckapp.com/' },
      { name: 'Mountains', item: 'https://milecheckapp.com/mountains/' },
      { name: 'Mount Baker', item: 'https://milecheckapp.com/mountains/baker/' },
      { name: 'Road cameras and conditions', item: 'https://milecheckapp.com/mountains/baker/roads/' },
    ],
    vis: { h: 'Is Mount Baker visible right now?', p: `Whether SR 542 is open and whether you can see Mount Baker are different questions. The <a href="../">visibility page</a> reads the cloud ceilings between you and the summit and answers the second one for Vancouver, Bellingham and the rest of the region.`, href: '../', cta: 'Check visibility now' },
    ctaH: 'MileCheck on SR 542', ctaP: `See your mile marker and nearby reports in the app. MileCheck also runs on CarPlay and Android Auto.`,
    related: (up) => `<a href="../">Is Mount Baker visible right now?</a> · <a href="${up}passes/">mountain passes</a> · <a href="${up}cameras/washington/">Washington cameras</a> · <a href="${up}cameras/">all highway cameras</a> · <a href="${up}closures/">road closures</a> · <a href="${up}fire/">wildfire map</a>`,
  },
  {
    kind: 'area', slug: 'sthelens-roads', out: 'mountains/sthelens/roads', up: '../../../',
    url: 'https://milecheckapp.com/mountains/sthelens/roads/',
    name: 'Mount St. Helens', route: 'SR 504 · Forest Roads', state: 'WA', states: ['WA'], stateName: 'Washington',
    dot: 'WSDOT', credit: 'WSDOT and NIFC via MileCheck',
    // Centre and radius from docs/seo-briefs-2026-09-28.md. SR 504 status: WSDOT project page, current 2026 end point is the winter gate at MP 45.2.
    lat: 46.1914, lon: -122.1956, rMi: 25,
    title: 'Mount St. Helens road cameras and conditions right now | MileCheck',
    desc: 'SR 504 closure details, forest-road access and agency reports within 25 miles of Mount St. Helens. Includes the WSDOT camera at milepost 33.',
    ogTitle: 'Mount St. Helens road cameras and conditions | MileCheck',
    eyebrow: 'SR 504 · FR 83 · FR 90 · FR 99 · Washington',
    // For the printable map sheet: the roads the sheet is about, and points to label on the
    // front. The closure point is the South Coldwater slide, at the trailhead of that name.
    mapRoads: ['SR 504', 'FR 83', 'FR 90', 'FR 99', 'Spirit Lake Highway'],
    mapNotes: [
      { label: 'SR 504 closed beyond MP 45.2', lat: 46.28568, lon: -122.25383, snap: 'SR 504' },
    ],
    h1: 'Mount St. Helens road cameras and conditions',
    hero: `Check SR 504 from Castle Rock toward Coldwater Lake and forest-road access on the south and east sides. The map shows agency reports within 25 miles of Mount St. Helens.`,
    coverage: `The SR 504 camera at milepost 33 does not show the closure farther east or the forest roads. Check <a href="https://www.fs.usda.gov/r06/giffordpinchot/conditions">Forest Service conditions</a> for those roads.`,
    markerLabel: 'Mount St. Helens',
    camLabel: 'live cameras within 25 mi', elev: 'MP 45.2', elevLabel: 'SR 504 closure, checked September 28, 2026',
    dist: '25 mi', distNote: 'radius from the summit', nearWord: 'within 25 miles of the summit', bannerWhere: 'on the roads around Mount St. Helens',
    aboutH: 'The roads around Mount St. Helens',
    lede: `SR 504 is the state highway from Castle Rock. The forest roads reach recreation areas on the south and east sides, and their seasonal status can differ from the state highway.`,
    segs: [
      // WSDOT: https://wsdot.wa.gov/construction-planning/search-projects/sr-504-south-coldwater-slide-spirit-lake-outlet-bridge-washout
      { h: 'SR 504 closure at milepost 45.2', p: `SR 504, the Spirit Lake Memorial Highway, runs east from Castle Rock on I-5. As checked September 28, 2026, WSDOT closes it at the winter gate at milepost 45.2. A May 2023 slide destroyed the Spirit Lake Outlet Bridge farther east. WSDOT expects bridge work to finish in spring 2027, followed by Forest Service work at Johnston Ridge Observatory. See the <a href="https://wsdot.wa.gov/construction-planning/search-projects/sr-504-south-coldwater-slide-spirit-lake-outlet-bridge-washout">project update</a>.` },
      // Forest Service: https://www.fs.usda.gov/r06/giffordpinchot/recreation?page=0%2C7 and https://www.fs.usda.gov/sites/nfs/files/legacy-media/giffordpinchot/2023-Visitor%20Guide.pdf
      { h: 'Ape Cave and Lava Canyon', p: `On the south side, Forest Roads 90 and 83 lead toward Ape Cave and Lava Canyon. Ape Cave is on the 8303 spur. Road 83 above Marble Mountain Sno-Park has a winter gate. Check the <a href="https://www.fs.usda.gov/r06/giffordpinchot/conditions">Forest Service conditions page</a> for road and recreation-site closures.` },
      // USFS visitor guide https://www.fs.usda.gov/Internet/FSE_DOCUMENTS/fseprd544862.pdf and current-conditions page linked above.
      { h: 'Windy Ridge', p: `Forest Road 99 reaches Windy Ridge from Road 25 on the east side. Road 99 closes for winter. Check both roads before choosing an approach.` },
      // WSDOT road feeds and Forest Service road pages. The page shows feed data, not a status inferred for an unmonitored forest road.
      { h: 'What the map covers', p: `The September 28, 2026 feed check returned the WSDOT camera on SR 504 at milepost 33. The map also loads agency reports and NIFC fires within 25 miles. An empty alert list does not establish that a road is open.` },
    ],
    driveP: `MileCheck shows your mile marker on SR 504 as you drive. The mile marker works without a signal. Camera images and alerts need a connection.`,
    faq: [
      ['Is SR 504 to Mount St. Helens open right now?', `WSDOT lists the current closure point and construction status on its <a href="https://wsdot.wa.gov/construction-planning/search-projects/sr-504-south-coldwater-slide-spirit-lake-outlet-bridge-washout" target="_blank" rel="noopener">SR 504 South Coldwater Slide project page</a>. The winter gate is at milepost 45.2.`,],
      ['Can I drive to Johnston Ridge Observatory?', `As checked September 28, 2026, no. WSDOT lists the closure at milepost 45.2. Bridge construction is expected to finish in spring 2027, followed by Forest Service work at the observatory.`,],
      ['Are the roads to Ape Cave and Windy Ridge open?', `Use the <a href="https://www.fs.usda.gov/r06/giffordpinchot/conditions">Forest Service conditions page</a>. Winter gates, road damage and recreation-site closures can affect each approach differently.`,],
      ['Is Mount St. Helens visible right now?', `A different question from whether SR 504 is open. The <a href="../">visibility page</a> reads the cloud ceilings between Portland and the summit and answers it for Portland, Vancouver, Woodland and the I-5 towns.`,],
      ['Where do the cameras come from?', `The cameras, closures and road reports come from WSDOT. Wildfires come from the national NIFC feed. Tap any camera on the map, or in the list, to see its latest frame.`,],
    ],
    crumbs: [
      { name: 'MileCheck', item: 'https://milecheckapp.com/' },
      { name: 'Mountains', item: 'https://milecheckapp.com/mountains/' },
      { name: 'Mount St. Helens', item: 'https://milecheckapp.com/mountains/sthelens/' },
      { name: 'Road cameras and conditions', item: 'https://milecheckapp.com/mountains/sthelens/roads/' },
    ],
    vis: { h: 'Is Mount St. Helens visible right now?', p: `Whether SR 504 is open and whether you can see Mount St. Helens are different questions. The <a href="../">visibility page</a> reads the cloud ceilings between you and the summit and answers the second one for Portland, Vancouver, Woodland and the I-5 towns.`, href: '../', cta: 'Check visibility now' },
    ctaH: 'MileCheck on SR 504', ctaP: `See your mile marker and nearby reports in the app. MileCheck also runs on CarPlay and Android Auto.`,
    related: (up) => `<a href="../">Is Mount St. Helens visible right now?</a> · <a href="${up}passes/">mountain passes</a> · <a href="${up}cameras/washington/">Washington cameras</a> · <a href="${up}cameras/">all highway cameras</a> · <a href="${up}closures/">road closures</a> · <a href="${up}fire/">wildfire map</a>`,
  },
  {
    kind: 'area', slug: 'denali-roads', out: 'mountains/denali/roads', up: '../../../',
    url: 'https://milecheckapp.com/mountains/denali/roads/',
    name: 'Denali', route: 'Denali Park Road · AK-3', state: 'AK', states: ['AK'], stateName: 'Alaska',
    dot: 'AK511', credit: 'AK511, National Park Service and NIFC via MileCheck',
    // Centre and radius from docs/seo-briefs-2026-09-28.md. AK511 camera config is in MileCheck's cloudflare-worker.js. NPS Eielson webcam is fixed in NPS_WEBCAMS.
    lat: 63.0692, lon: -151.0070, rMi: 60,
    title: 'Denali road cameras and conditions right now | MileCheck',
    desc: 'Denali Park Road access and Parks Highway camera coverage. Agency reports within 60 miles of Denali, with an NPS mountain webcam from Eielson.',
    ogTitle: 'Denali road cameras and conditions | MileCheck',
    eyebrow: 'Denali Park Road · AK-3 · Alaska',
    // For the printable map sheet (scripts/gen-map-sheets.mjs): the roads the sheet is
    // about, and points to label on the front. Coordinates from OpenStreetMap, 2026-09-30.
    mapRoads: ['Denali Park Road', 'AK-3'],
    mapNotes: [
      { label: 'Park entrance and visitor center, mile 1.5', lat: 63.73088, lon: -148.91721, snap: 'Denali Park Road' },
      { label: 'Savage River, mile 15. Private cars turn around here in summer', lat: 63.74007, lon: -149.29394, snap: 'Denali Park Road' },
      { label: 'Teklanika, mile 30. The fall limit for private cars', lat: 63.65456, lon: -149.56759, snap: 'Denali Park Road' },
    ],
    h1: 'Denali road cameras and conditions',
    hero: `Check Denali Park Road access and nearby Parks Highway reports. The map covers a 60-mile radius around Denali, not the whole drive from Anchorage or Fairbanks.`,
    // /cameras?state=AK checked 2026-09-28: AK-38-175 on Parks Highway and NPS-DENA-air at Eielson within 60 mi.
    coverage: `The September 28, 2026 feed check returned one Parks Highway camera and the NPS Eielson mountain webcam. Eielson is a scenic view, not a Park Road traffic camera. Check <a href="https://www.nps.gov/dena/planyourvisit/conditions.htm">NPS conditions</a> for park access.`,
    markerLabel: 'Denali',
    camLabel: 'cameras within 60 mi', elev: '92 mi', elevLabel: 'full length of Denali Park Road',
    dist: '60 mi', distNote: 'radius from the summit', nearWord: 'within 60 miles of Denali', bannerWhere: 'on the roads around Denali',
    aboutH: 'The roads to Denali',
    lede: `Denali Park Road is inside the national park. AK-3, the Parks Highway, is the approach road from Anchorage and Fairbanks. The two roads have different operators and different access rules.`,
    segs: [
      // NPS: https://www.nps.gov/dena/planyourvisit/basicinfo.htm, https://www.nps.gov/dena/planyourvisit/visiting-denali.htm and https://www.nps.gov/dena/learn/news/pretty-rocks-bridge-complete-090226.htm
      { h: 'Denali Park Road', p: `Denali Park Road runs 92 miles to Kantishna. During summer bus operations, private vehicles can drive to Savage River at mile 15. After buses stop in September, NPS allows private vehicles to Teklanika River at mile 30, weather permitting, through October 15. Snow or ice can close the road earlier at park headquarters. Check the <a href="https://www.nps.gov/dena/planyourvisit/shoulder-season.htm">NPS seasonal access page</a>.` },
      // https://www.nps.gov/dena/learn/news/pretty-rocks-bridge-complete-090226.htm, September 3, 2026. Bridge MP 45 and bus turnaround MP 43 are different places.
      { h: 'Pretty Rocks bridge is complete', p: `NPS announced completion on September 3, 2026. The bridge crosses the landslide near mile 45. Hikers and cyclists could cross from August 27, but buses were limited to East Fork at mile 43 for the 2026 season. Full bus service is expected in 2027. See the <a href="https://www.nps.gov/dena/learn/news/pretty-rocks-bridge-complete-090226.htm">NPS bridge update</a>.` },
      // NPS park brochure: https://www.nps.gov/dena/planyourvisit/park-brochure.htm. Alaska Route 3 is the George Parks Highway.
      // Alaska State Parks lists South at MP 134.8 (often rounded to 135), North at 162.7: https://dnr.alaska.gov/parks/units/campsitelist.htm
      { h: 'AK-3, the Parks Highway', p: `AK-3, the George Parks Highway, is the approach from Anchorage and Fairbanks. Alaska State Parks lists Denali View South at mile 134.8, near mile 135, and Denali View North at mile 162.7. Both are in Denali State Park, outside the national park.` },
      // AK511 via MileCheck and NPS webcam: https://511.alaska.gov/ and https://www.nps.gov/dena/learn/photosmultimedia/webcams.htm
      { h: 'What the map covers', p: `AK511 supplies highway reports. NPS supplies the Eielson mountain view, and NIFC supplies fire locations. The map filters each feed to 60 miles from the summit. It does not establish whether Denali Park Road is open.` },
    ],
    driveP: `MileCheck shows your mile marker on AK-3 as you drive. The mile marker works without a signal. Camera images and alerts need a connection.`,
    faq: [
      ['Is Denali Park Road open right now?', `The National Park Service posts current access and closure information on its <a href="https://www.nps.gov/dena/planyourvisit/basicinfo.htm" target="_blank" rel="noopener">Denali basic information page</a>. During the main summer season, private vehicles go to Savage River at mile 15.`,],
      ['How far can private vehicles drive in Denali?', `During summer bus operations, private vehicles can go to Savage River at mile 15. In fall, after bus service ends, NPS allows travel to Teklanika River at mile 30 through October 15 if weather permits. Check current NPS conditions before leaving.`,],
      ['Is the Pretty Rocks bridge open?', `NPS announced the bridge complete on September 3, 2026. Hikers and cyclists could cross from August 27. Buses were limited to mile 43 for the 2026 season, with full service expected in 2027. This does not extend private-vehicle access.`,],
      ['What is AK-3?', `AK-3 is the George Parks Highway. It connects Anchorage and Fairbanks and runs past the Denali park entrance.`,],
      ['Is Denali visible right now?', `Check the <a href="../">Denali visibility page</a> for the current estimate from Talkeetna and other viewing areas. Road access and a clear view are separate questions.`,],
      ['Where do the cameras come from?', `The road cameras and reports come from AK511. The Eielson webcam comes from the National Park Service. Wildfires come from the national NIFC feed. Tap any camera on the map, or in the list, to see its latest frame.`,],
    ],
    crumbs: [
      { name: 'MileCheck', item: 'https://milecheckapp.com/' },
      { name: 'Mountains', item: 'https://milecheckapp.com/mountains/' },
      { name: 'Denali', item: 'https://milecheckapp.com/mountains/denali/' },
      { name: 'Road cameras and conditions', item: 'https://milecheckapp.com/mountains/denali/roads/' },
    ],
    vis: { h: 'Is Denali visible right now?', p: `Check the visibility estimate from Talkeetna and other viewing areas. Road access and a clear view are separate questions.`, href: '../', cta: 'Check visibility now' },
    ctaH: 'MileCheck on the Parks Highway', ctaP: `See your mile marker and nearby reports in the app. MileCheck also runs on CarPlay and Android Auto.`,
    related: (up) => `<a href="../">Is Denali visible right now?</a> · <a href="${up}cameras/alaska/">Alaska cameras</a> · <a href="${up}cameras/">all highway cameras</a> · <a href="${up}closures/">road closures</a> · <a href="${up}fire/">wildfire map</a>`,
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
  {
    kind: 'area', slug: 'anthony-lakes', out: 'passes/anthony-lakes', up: '../../',
    url: 'https://milecheckapp.com/passes/anthony-lakes/',
    name: 'Anthony Lakes', route: 'I-84 · OR 237', state: 'OR', states: ['OR'], stateName: 'Oregon',
    dot: 'ODOT', credit: 'ODOT via MileCheck',
    // Resort coordinates: Wikipedia, Anthony Lakes (ski area), 44.964N -118.235W.
    lat: 44.964, lon: -118.235, rMi: 20,
    title: 'Anthony Lakes road conditions right now (I-84 &amp; OR 237) | MileCheck',
    desc: 'Getting to Anthony Lakes Mountain Resort: live ODOT cameras and alerts on I-84 and OR 237 near North Powder, Oregon, plus what to know about the final unpatrolled miles up to the resort. No account.',
    ogTitle: 'Anthony Lakes road conditions | MileCheck',
    eyebrow: 'I-84 · OR 237 · Elkhorn Mountains · Oregon',
    // For the printable map sheet: the drive is I-84, OR 237, then the county and forest
    // road to the resort, which is not a state highway.
    mapRoads: ['I-84', 'OR 237', 'Anthony Lakes Highway', 'NF 73'],
    h1: 'Getting to Anthony Lakes',
    hero: `Anthony Lakes Mountain Resort sits at 7,100 feet in the Elkhorn Mountains. This page covers what ODOT actually tracks on the way there: I-84 and OR 237 near North Powder, within 20 miles of the resort. The last stretch of the drive isn't a state highway, and there's no live camera or alert feed for it. See below.`,
    camLabel: 'live cameras within 20 mi', elev: '7,100 ft', elevLabel: 'resort base',
    dist: '35 mi', distNote: 'from Baker City', nearWord: 'within 20 miles of the resort', bannerWhere: 'on I-84 and OR 237 near North Powder',
    aboutH: 'Before you leave',
    lede: `Anthony Lakes is reached by leaving the state highway system. Here's exactly where that happens, and what that means for what MileCheck can and can't show you live.`,
    segs: [
      { h: 'The route', p: `From I-84, take exit 285 at North Powder, 19 miles north of Baker City or 24 miles south of La Grande. From there it's OR 237 for about 4 miles, then the Anthony Lake Highway (county-maintained, becoming national forest Road 73) for roughly 16 more paved miles west to the resort. The road is described by the Forest Service as narrow and winding. It is paved and maintained the whole way to the resort.` },
      { h: 'Where the live data stops', p: `ODOT's cameras and alerts cover I-84 and the short OR 237 stretch near North Powder. That is what the map above shows. The Anthony Lake Highway and Forest Road 73 beyond it aren't state-maintained roads, so there's no DOT camera or incident feed for the resort access road itself. Check the resort's own site for current road and snow conditions before you commit to the drive.` },
      { h: 'Winter access', p: `The resort operates all winter, so the access road is plowed and maintained up to the resort and campground. The road continuing west past the lakes, deeper into the Wallowa-Whitman National Forest, is not maintained for winter travel and effectively closes. Chains or good winter tires are a sensible precaution regardless. It's a narrow, winding two-lane road at elevation.` },
    ],
    driveP: `The cameras and alerts above are the stationary view of I-84 and OR 237 before you leave North Powder. In the MileCheck app, your exact mile marker and the nearest camera follow you on the highway approach, hands-free on CarPlay and Android Auto.`,
    faq: [
      ['Is I-84 near North Powder open right now?', `Closures and incidents on I-84 and OR 237 near North Powder show on the <a href="#comap">map above</a> as red and orange markers, from ODOT. See every ODOT camera on the <a href="../../cameras/oregon/">Oregon cameras page</a>, or the <a href="../../closures/">US closures map</a> for everywhere else.`],
      ['Is the road to Anthony Lakes plowed in winter?', `Yes, up to the resort. It operates all winter and the access road (the Anthony Lake Highway and Forest Road 73) is maintained that far. The road continuing west past the lakes into the national forest is not maintained for winter travel.`],
      ['How high is Anthony Lakes?', `The resort's base is 7,100 feet, with an 8,000-foot summit.`],
      ['How far is Anthony Lakes from Baker City?', `About 35 miles: I-84 north 19 miles to the North Powder exit, then about 20 miles west on OR 237 and the Anthony Lake Highway. From La Grande it's about 45 miles, via I-84 south 24 miles to the same exit.`],
    ],
    ctaH: 'Take it with you', ctaP: `MileCheck shows your exact mile marker in real time on I-84 and OR 237 near North Powder, plus the nearest camera and any alert on your route. Runs on CarPlay and Android Auto. The mile marker works without a signal.`,
    related: (up) => `<a href="../">all mountain passes</a> · <a href="${up}cameras/oregon/">Oregon cameras</a> · <a href="${up}cameras/">all highway cameras</a> · <a href="${up}closures/">road closures</a> · <a href="${up}fire/">wildfire map</a>`,
  },
  {
    // The drive to the Enchantments trailheads. Leah, build-26 review of the Enchantments
    // app, 2026-10-01: "make a dedicated page for the closures and the special map for
    // that", then "maybe even a map like we did for others", "printable". Every fact
    // below is from the Forest Service pages the Enchantments app cites (its
    // access.seed.json, Stuart Lake and Snow Lakes trailhead pages; advisory.json for the
    // orders). The storm-damage order and the alerts list were re-read 2026-10-01.
    kind: 'area', slug: 'enchantments-roads', out: 'enchantments/roads', up: '../../',
    url: 'https://milecheckapp.com/enchantments/roads/',
    name: 'The Enchantments', route: 'Icicle Road', state: 'WA', states: ['WA'], stateName: 'Washington',
    dot: 'WSDOT', credit: 'WSDOT, US Forest Service and NIFC via MileCheck',
    // Centred on Perfection Lake in the core (the app's water.seed, OSM), because the
    // map sheet puts its star at the centre. 14 miles holds Leavenworth, both
    // trailheads and the US 2 / US 97 junction.
    lat: 47.480206, lon: -120.797163, rMi: 14, markerLabel: 'Perfection Lake, the Enchantments core',
    title: 'Enchantments trailhead roads and closures right now | MileCheck',
    desc: 'The drive to the Stuart Lake, Snow Lakes and Eightmile trailheads from Leavenworth: Icicle Road, the storm-damage closure order, live WSDOT cameras on US 2 and US 97, and wildfires nearby. Printable map. No account.',
    ogTitle: 'Enchantments trailhead roads and closures | MileCheck',
    eyebrow: 'Icicle Road · Eightmile Road · US 2 · US 97 · Washington',
    // OSM: FS 7600 is Icicle Road; FS 7601 is tagged "Eight Mile Road".
    mapRoads: ['US 2', 'US 97', 'Icicle Road', 'FS 7600', 'FS 7601'],
    // The turn to two of the three trailheads. Labelled on the printed sheet (review, 10/1).
    mapLabels: { 'FS 7601': 'Eightmile Rd · FSR 7601' },
    // Stuart Lake and Snow Lakes trailheads come in from OSM as numbered stops. Eightmile
    // is a trailhead node the stop query does not return (OSM node 12053857534).
    mapNotes: [
      { label: 'Eightmile Trailhead', lat: 47.53598, lon: -120.8137, snap: 'FS 7601' },
    ],
    h1: 'The roads to the Enchantments',
    hero: `Three trailheads, all off Icicle Road west of Leavenworth. Snow Lakes is 4.3 miles up the road. Stuart Lake and Eightmile are up Eightmile Road, FSR 7601. Closures, WSDOT cameras on US 2 and US 97, and wildfires within 14 miles sit under the map.`,
    camLabel: 'live cameras within 14 mi', elev: '3,400 ft', elevLabel: 'Stuart Lake Trailhead',
    dist: '14 mi', distNote: 'radius from the core lakes', nearWord: 'within 14 miles of the core', bannerWhere: 'on the roads to the Enchantments',
    aboutH: 'The roads to the Enchantments',
    lede: `What the Forest Service says about each road and trailhead, as of the dates given. Road status can change after them. Read the orders themselves before you drive.`,
    segs: [
      { h: 'Icicle Road and the storm-damage order', p: `Forest Order 06-17-07-2026-11 closes Forest Road 7600, Icicle Road, "starting in Sec. 1, T. 24 N., R. 15 E and continues to the end." It runs May 20, 2026 through December 31, 2027. The forest's road table, as of September 3, 2026, describes the damage as beginning near Eightmile and lists Eightmile Road 7601 to the Stuart Lake Trailhead as open. The order names neither trailhead. MileCheck last re-read the order on October 1, 2026. This is not a live feed, so road status can change after that date. <a href="https://www.fs.usda.gov/r06/okanogan-wenatchee/alerts/storm-damaged-roads-closure-wenatchee-river-district" target="_blank" rel="noopener">Read the order</a>.` },
      { h: 'Stuart Lake Trailhead', p: `From Leavenworth, Icicle Road about 8.5 miles, left on Eightmile Road, stay right on FSR 7601 and follow it about 4 miles. The Forest Service says the road is steep and becomes washboarded, recommends high clearance and 4x4 if possible, and closes FSR 7601 to vehicles each winter. Start of the Colchuck Lake and Stuart Lake day hikes and the west end of the traverse.` },
      { h: 'Snow Lakes Trailhead', p: `Icicle Road for 4.3 miles from Leavenworth, below the Eightmile turnoff. Vault toilets. The east end of the traverse.` },
      { h: 'Parking and permits', p: `Parking needs a Northwest Forest Pass, an America the Beautiful pass, or the $5 day pass. From May 15 through October 31 a day-use permit is free and self-issued at the trailhead. Camping in the permit area needs an overnight permit from recreation.gov. The lots fill. Carpool or get dropped off.` },
    ],
    driveP: `The cameras and alerts above are the view before you leave town. In the MileCheck app your exact mile marker on US 2 and the nearest camera follow you to Leavenworth, hands-free on CarPlay and Android Auto, and the mile marker works without a signal. For the trail itself, the <a href="https://enchantmentstraverse.app/" target="_blank" rel="noopener">Enchantments Traverse Planner</a> works with no signal in the core.`,
    faq: [
      ['Is Icicle Road open to the Enchantments trailheads?', `The storm-damage order closes FSR 7600 from a point it gives by section, township and range to the end of the road. The Forest Service road table, as of September 3, 2026, lists Eightmile Road 7601 to the Stuart Lake Trailhead as open, and Snow Lakes Trailhead is at mile 4.3, below the Eightmile turnoff. The order names neither trailhead. Check the <a href="https://www.fs.usda.gov/r06/okanogan-wenatchee/alerts" target="_blank" rel="noopener">forest alerts page</a> before you drive.`],
      ['Do I need high clearance for the Stuart Lake Trailhead?', `The Forest Service recommends it. FSR 7601 is steep and becomes washboarded, and the page says 4x4 if possible.`],
      ['How far is each trailhead from Leavenworth?', `Snow Lakes Trailhead is 4.3 miles up Icicle Road. Stuart Lake Trailhead is about 8.5 miles up Icicle Road, then about 4 miles up FSR 7601.`],
      ['What pass do I need to park?', `A Northwest Forest Pass, an America the Beautiful pass, or the $5 day pass. The day-use wilderness permit is separate, free and self-issued at the trailhead May 15 through October 31.`],
      ['Are there fires near the Enchantments?', `Wildfires within 14 miles show on the <a href="#comap">map above</a>, from the national NIFC feed. Fire closures are separate Forest Service orders. The <a href="../../fire/">wildfire map</a> covers the rest of the state.`],
    ],
    crumbs: [
      { name: 'MileCheck', item: 'https://milecheckapp.com/' },
      { name: 'Mountain Passes', item: 'https://milecheckapp.com/passes/' },
      { name: 'The Enchantments', item: 'https://milecheckapp.com/enchantments/roads/' },
    ],
    ctaH: 'Take it with you', ctaP: `MileCheck shows your exact mile marker in real time on US 2 and US 97, plus the nearest camera and any alert on your route. Runs on CarPlay and Android Auto. The mile marker works without a signal.`,
    related: (up) => `<a href="${up}passes/stevens/">Stevens Pass</a> · <a href="${up}passes/">mountain passes</a> · <a href="${up}cameras/washington/">Washington cameras</a> · <a href="${up}closures/">road closures</a> · <a href="${up}fire/">wildfire map</a> · <a href="https://enchantmentstraverse.app/">Enchantments Traverse Planner</a>`,
  },
  {
    kind: 'area', slug: 'little-cottonwood', out: 'passes/little-cottonwood', up: '../../',
    url: 'https://milecheckapp.com/passes/little-cottonwood/',
    name: 'Little Cottonwood Canyon', route: 'UT-210', state: 'UT', states: ['UT'], stateName: 'Utah',
    dot: 'UDOT', credit: 'UDOT via MileCheck',
    // Centre near Snowbird, mid-canyon: Wikipedia, Snowbird, Utah, 40.582N -111.656W.
    lat: 40.582, lon: -111.656, rMi: 15,
    title: 'Little Cottonwood Canyon road conditions right now (UT-210) | MileCheck',
    desc: 'Getting to Snowbird and Alta: live UDOT cameras and alerts on SR-210 up Little Cottonwood Canyon, avalanche closures, traction-law requirements, and the coming toll and gondola plan. No account.',
    ogTitle: 'Little Cottonwood Canyon road conditions | MileCheck',
    eyebrow: 'UT-210 · Wasatch Mountains · Utah',
    h1: 'Little Cottonwood Canyon right now',
    hero: `SR-210 is the only road to Snowbird and Alta, 13.6 miles from the mouth of the canyon in the Salt Lake Valley, climbing through some of the most avalanche-exposed terrain of any highway in the country. Live UDOT cameras and alerts on the whole climb, below.`,
    camLabel: 'live cameras within 15 mi', elev: '7,760 ft', elevLabel: 'Snowbird base (Alta base: 8,530 ft)',
    dist: '13.6 mi', distNote: 'SR-210, canyon mouth to Alta', nearWord: 'within 15 miles of the canyon', bannerWhere: 'on SR-210 in Little Cottonwood Canyon',
    aboutH: 'Before you drive the canyon',
    lede: `Little Cottonwood is a working highway with real avalanche control, real winter tire law and, starting soon, a real toll. Here's what UDOT enforces.`,
    segs: [
      { h: 'Avalanche closures are routine, not rare', p: `UDOT counts 64 avalanche paths crossing SR-210, and more than half the highway sits under avalanche threat. Closures for avalanche control, sometimes with little notice, are a normal part of a canyon winter, not an emergency exception.` },
      { h: 'Snow tires or chains are the law, November 1 to May 1', p: `Utah requires snow tires or chains in the canyon for that entire window, and UDOT can restrict travel further to snow tires, chains, or 4-wheel drive only when conditions call for it. Follow UDOT Cottonwoods and the signs at the canyon mouth. Restrictions can change within the hour.` },
      { h: 'A toll and more buses are coming', p: `UDOT's Little Cottonwood Canyon plan adds a peak-period toll (proposed around $25 to $30 on busy ski days, not year-round) and more frequent buses, every 10 to 20 minutes instead of every 30, as part of a longer-term plan that also includes a proposed 8-mile gondola. Phase 1 details were still being finalized as of spring 2026. Check UDOT's own Cottonwood Canyons page for what's actually in effect this season.`, },
    ],
    driveP: `The cameras and alerts above are the stationary view, the UDOT feed you would check before you leave the valley. In the MileCheck app, your exact mile marker and the nearest camera follow you up the canyon, hands-free on CarPlay and Android Auto.`,
    faq: [
      ['Is Little Cottonwood Canyon open right now?', `Closures and incidents on SR-210 show on the <a href="#comap">map above</a> as red and orange markers, from UDOT. See every UDOT camera on the <a href="../../cameras/utah/">Utah cameras page</a>, or the <a href="../../closures/">US closures map</a> for everywhere else.`],
      ['Are chains or snow tires required in Little Cottonwood Canyon?', `Yes, by state law, from November 1 to May 1 every year. UDOT can tighten that to chains or 4-wheel drive only when conditions require it. Check the <a href="#comap">live cameras above</a> for the road surface before you commit to the climb.`],
      ['How high are Snowbird and Alta?', `Snowbird's base is 7,760 feet, Alta's is 8,530 feet. Both are up SR-210, 13.6 miles from the canyon mouth in the Salt Lake Valley.`],
      ['Is there a toll for Little Cottonwood Canyon?', `Not yet as a fixed daily charge, but UDOT's approved plan adds a peak-period toll on busy ski days as part of a phased rollout, alongside more frequent bus service. Check UDOT's Cottonwood Canyons page for what's actually running this season.`],
    ],
    ctaH: 'Take it with you', ctaP: `MileCheck shows your exact mile marker in real time on SR-210 up the canyon, plus the nearest camera and any alert on your route. Runs on CarPlay and Android Auto. The mile marker works without a signal.`,
    related: (up) => `<a href="../">all mountain passes</a> · <a href="${up}passes/parleys/">Parleys Summit</a> · <a href="${up}cameras/utah/">Utah cameras</a> · <a href="${up}cameras/">all highway cameras</a> · <a href="${up}closures/">road closures</a>`,
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
  const sp = SPON.slot({ kind: 'pass', slug: p.slug, name: p.name });
  const credit = p.credit || p.dot;
  const mountainKey = (p.out || '').match(/^mountains\/([^/]+)\/roads$/)?.[1];
  const imagePath = mountainKey && `images/mountains/og-${mountainKey}.png`;
  const shareImage = imagePath && fs.existsSync(imagePath) ? `https://milecheckapp.com/${imagePath}` : 'https://milecheckapp.com/images/og-banner-light.png';
  const segs = p.segs || [{ h: 'When it closes', p: p.closes }, p.extra];
  const segsHtml = segs.map(s=>`    <div class="co-seg"><h3>${s.h}</h3>${s.html || `<p>${s.p}</p>`}</div>`).join('\n');
  const relatedHtml = typeof p.related === 'function' ? p.related(up)
    : `More passes &amp; routes: <a href="../">all mountain passes</a> · <a href="${up}cameras/">all highway cameras</a> · <a href="${up}closures/">road closures</a> · <a href="${up}maps/">all maps</a>`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta name="apple-itunes-app" content="app-id=6759212851">
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${p.title || `${p.name} Camera &amp; Conditions Right Now (${p.route}) | MileCheck`}</title>
  <meta name="description" content="${p.desc || `Live ${p.name} cameras and real-time road conditions on ${p.route}. See snow, chains, and closures before you drive it. ${p.dot} cameras, tagged with mile marker.`}">
  <link rel="canonical" href="${url}">
  <meta property="og:title" content="${p.ogTitle || `${p.name} Right Now: Live Camera &amp; Conditions | MileCheck`}">
  <meta property="og:description" content="${p.desc || `Live ${p.route} ${p.name} cameras and conditions. See the pass before you drive it. Snow, chains, and closures in real time.`}">
  <meta property="og:image" content="${shareImage}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="${shareImage}">
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
    .co-layer input:checked+.co-sw.poi{background:#E0A100;}
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
    .co-card .cc-nav{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:10px;}
    .co-card .cc-nav button{border:1px solid #E5E5E5;background:#f7f7f5;border-radius:8px;padding:6px 10px;font-size:12.5px;font-weight:700;color:#0f7a4f;cursor:pointer;}
    .co-card .cc-nav button:hover{background:#eef4ef;}
    .co-card .cc-nav .cc-count{font-size:12.5px;color:#5b6670;font-weight:600;}
    /* Selected-camera blink (Leah, 2026-09-25) is done via setStyle() in JS, not
       CSS — this map uses Leaflet's Canvas renderer, so circleMarkers have no
       per-shape DOM element for a CSS animation to target. See selectCamMarker(). */
    .poi-icon{color:#F5B301;font-size:30px;line-height:1;text-align:center;text-shadow:0 0 2px #3a2a00,0 0 3px #3a2a00,0 0 1px #000;cursor:pointer;font-weight:900;}
    /* Key rows under the layer toggles: the destination star, and purple for park webcams (Leah, 9-28). */
    .co-key{display:flex;align-items:center;gap:8px;font-size:12.5px;color:#4b5a50;margin-top:7px;padding-left:2px;} .co-key .co-star{color:#F5B301;text-shadow:0 0 1px #3a2a00,0 0 2px #3a2a00;font-size:16px;line-height:1;width:14px;text-align:center;}
    .co-print{font:inherit;font-weight:700;border:2px solid #1d2a1f;background:#fff;border-radius:10px;padding:8px 14px;cursor:pointer;}
    @media print{header,nav,footer,.co-layers,.lst-tools,.co-print,.co-faq,.co-cta,.leaflet-control-container,#coCard,.co-bs,[class*="sponsor"],[class*="signup"],[class*="sp-slot"]{display:none!important;}body{background:#fff!important;}#comap{height:420px!important;break-inside:avoid;}.co-list{break-inside:avoid;box-shadow:none!important;}.co-list li button{display:none!important;}}
    .co-guide{max-width:1000px;margin:40px auto 0;padding:0 20px;}
    .co-guide h2{font-size:26px;margin:0 0 6px;}
    .co-guide .lede{color:#3a444d;font-size:16px;line-height:1.6;margin:0 0 22px;}
    .co-seg{border:1px solid #E5E5E5;border-radius:14px;background:#fff;padding:20px 22px;margin-bottom:14px;}
    .co-seg h3{font-size:19px;margin:0 0 4px;}
    .co-seg p{color:#3a444d;font-size:15px;line-height:1.6;margin:8px 0 0;}
    .co-seg .seg-src{font-size:12.5px;color:#5b6670;}
    .co-seg ul,.co-seg ol{margin:8px 0 0 20px;color:#3a444d;font-size:15px;line-height:1.6;}
    .seg-table{overflow-x:auto;margin:10px 0 0;}
    .seg-table table{border-collapse:collapse;width:100%;min-width:560px;font-size:14px;}
    .seg-table th,.seg-table td{border:1px solid #E5E5E5;padding:8px 10px;text-align:left;vertical-align:top;color:#3a444d;}
    .seg-table th{background:#f6f8f7;color:#0E1116;}
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
${sp.css}
  </style>
  <!-- Shared map behavior for every Leaflet map: assets/map-kit.css + .js. Change maps there, not per page. -->
  <link rel="stylesheet" href="/assets/map-kit.css">
  <script src="/assets/map-kit.js" defer></script>
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
${sp.html}
    <div class="eyebrow">${p.eyebrow || `${p.route} · ${p.stateName} · Elevation ${p.elev}`}</div>
    <h1>${p.h1 || `${p.name} right now: live camera &amp; conditions`}</h1>
    <p class="sub">${p.hero}</p>
    ${p.coverage ? `<p class="sub">${p.coverage}</p>` : ''}
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
        <div class="co-key"><span class="co-star">★</span>${p.name}</div>
        <div class="co-key" id="keyPark" hidden><span class="co-dot" style="background:#7C3AED"></span>Park webcam</div>
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
    <div class="co-list" id="lstClos"><h2>Closures and incidents</h2><p class="hint">Closures, crashes and hazards within ${p.rMi} miles, from ${p.dot}. Full closures are marked in red.</p><ul><li class="empty">Loading.</li></ul></div>
    <div class="co-list" id="lstWork"><h2>Construction</h2><p class="hint">Work zones and lane restrictions within ${p.rMi} miles.</p><ul><li class="empty">Loading.</li></ul></div>
    <div class="co-list" id="lstFire"><h2>Wildfires</h2><p class="hint">Active fires within ${p.rMi} miles, from the national NIFC feed, nearest first. Prescribed burns are marked.</p><ul><li class="empty">Loading.</li></ul></div>
  </section>` : `
  <section class="co-lists" aria-label="Cameras near ${p.name}">
    <div class="co-list co-list-cams" id="lstCams"><h2>Cameras</h2><p class="hint">Every camera in the feed on this stretch. Tap one to load its latest frame.</p><div class="lst-tools"><button type="button" id="btnAllCams">Show every camera</button></div><ul><li class="empty">Loading.</li></ul></div>
  </section>`}

  <section class="co-guide">
    <h2>${p.aboutH || `About ${p.name}`}</h2>
    <p><a class="co-print" href="map/" style="display:inline-block;text-decoration:none;color:inherit;">Printable map</a></p>
    <p class="lede">${p.lede || `${p.name} carries ${p.route} over the ${p.range} at ${p.elev}. Here's what to watch, and when it bites.`}</p>
${segsHtml}
    <div class="co-seg"><h3>Watch it live while you drive</h3><p>${p.driveP || `The cameras and alerts above are the stationary view, the ${p.dot} feeds you'd check before you leave. In the MileCheck app, the nearest camera and your exact mile marker follow you up the grade automatically, hands-free on CarPlay and Android Auto, so you're never guessing which stretch you're on.`}</p></div>
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
    <h2>${p.ctaH || 'Watch the climb live, hands-free'}</h2>
    <p>${p.ctaP || `MileCheck shows your exact mile marker in real time as you drive ${p.route} over ${p.name}, plus the nearest camera and any alert on your route. Works offline and runs on CarPlay and Android Auto.`}</p>
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
if(PASS.area){const dy=PASS.radiusKm/111,dx=dy/Math.cos(PASS.lat*Math.PI/180);map.fitBounds([[PASS.lat-dy,PASS.lon-dx],[PASS.lat+dy,PASS.lon+dx]]);}else{map.setView([PASS.lat,PASS.lon],11);}
const camLayer=L.layerGroup().addTo(map);
const alrLayer=L.layerGroup().addTo(map);
const fireLayer=L.layerGroup().addTo(map);
const plowLayer=L.layerGroup().addTo(map);
let CAMS=[], ALERTS=[], CONDS=[], FIRES=[], PLOWLIST=[], showCam=true, showAlr=true, showFire=true, showPlow=true, camMarkers=[];
function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
async function fetchJSON(url,tries){for(let i=0;i<tries;i++){try{const r=await fetch(url);if(r.ok)return await r.json();}catch(e){}if(i<tries-1)await new Promise(res=>setTimeout(res,1000));}return null;}
// Missing feeds are not zero reports. Keep successful layers when another feed fails.
// A "partial" feed that still sent rows is not missing (2026-10-03: one malformed
// Caltrans weather file in Stockton turned every California pass's alert count into
// "?" while 11,510 rows, 17 of them Cajon closures, arrived fine). Its counts show;
// its empty lists say they may be incomplete. A partial feed with no rows stays "?".
const failedFeeds=new Set(),partialFeeds=new Set();
async function feedRows(url,key,label){const d=await fetchJSON(url,3);const rows=d&&Array.isArray(d[key])?d[key]:null;const hard=!d||d.unavailable||d.ok===false||d.supported===false||['failed','unavailable','unsupported'].includes(d.source_status)||!rows;const soft=!hard&&(d.source_status==='partial'||(Array.isArray(d.errors)&&d.errors.length));if(hard||(soft&&!rows.length))failedFeeds.add(label);else if(soft)partialFeeds.add(label);return rows||[];}
function clean(t,n){const x=String(t==null?'':t).replace(/<[^>]+>/g,' ').replace(/\\s+/g,' ').trim();if(x.length<=n)return x;const cut=x.slice(0,n);const sp=cut.lastIndexOf(' ');return (sp>n*0.6?cut.slice(0,sp):cut)+'\u2026';}
// A title for an alert that has no headline of its own: the first sentence, whole,
// or the first clause before a comma. Build 9/30: a 140-character cut of the
// description ended "there will be con" (Leah: "text cuts off on alert").
function alertTitle(a){const h=clean(a.headline||'',140);const d=String(a.description||a['impact-desc']||'').replace(/<[^>]+>/g,' ').replace(/\\s+/g,' ').trim();if(h&&h!==clean(d,140))return h;if(!d)return 'Incident';const first=(d.match(/^.*?[.!?](\\s|$)/)||[d])[0].trim();if(first.length<=110)return first;const cl=first.indexOf(', ');return cl>20&&cl<=110?first.slice(0,cl):clean(first,90);}
async function loadCams(){const out=[];for(const st of PASS.states){for(const c of await feedRows(WORKER+'/cameras?state='+st,'cameras','cameras')){if(c.isActive===false||!c.imageUrl||!near(+c.lat,+c.lon))continue;out.push({lat:+c.lat,lon:+c.lon,title:c.title&&c.title!=='N/A'?c.title:(c.route||'Traffic')+' camera',route:c.route,mp:c.mile,img:c.imageUrl,src:c.source==='NPS'?'NPS':'',park:c.park||''});}}return out;}
async function loadAlerts(){const out=[];for(const st of PASS.states){for(const a of await feedRows(WORKER+'/incidents?state='+st,'incident-reports','alerts')){const sl=a.location&&a.location['start-location'];if(!sl||!near(+sl['start-lat'],+sl['start-long']))continue;out.push({lat:+sl['start-lat'],lon:+sl['start-long'],type:a['event-type-id']||'OT',mp:sl['start-mile-marker'],title:alertTitle(a),desc:clean(a.description||a['impact-desc']||'',700),impact:clean(a['impact-desc']||'',80),route:a.location&&a.location['route-id'],end:alertEnd(a,sl)});}}return out;}
// The feed's end location, when it is somewhere else. Leah, 2026-10-01: "show the
// line between MPs?" The span is drawn along the road (see spanLine).
function alertEnd(a,sl){var el=a.location&&a.location['end-location'];if(!el)return null;var la=+el['end-lat'],lo=+el['end-long'];if(!isFinite(la)||!isFinite(lo))return null;if(Math.abs(la-+sl['start-lat'])<1e-4&&Math.abs(lo-+sl['start-long'])<1e-4)return null;return {lat:la,lon:lo,mp:el['end-mile-marker']};}
// Road geometry for drawing a span along the road, from roads.json next to the page
// (scripts/gen-pass-roads.mjs, OpenStreetMap). Runs that share an endpoint join into
// a graph; the span is the shortest walk between the alert's two ends. If the walk
// is much longer than the straight line, or the file is missing, the straight dashed
// line stays.
var ROADS=null,ROADG=null;
function loadRoads(){if(ROADS!==null)return Promise.resolve(ROADS);return fetch('roads.json').then(function(r){return r.ok?r.json():null;}).then(function(j){ROADS=(j&&j.runs)||[];ROADG=ROADS.length?buildGraph(ROADS):null;return ROADS;}).catch(function(){ROADS=[];ROADG=null;return ROADS;});}
function gkey(p){return p[0].toFixed(5)+','+p[1].toFixed(5);}
function gdist(a,b){var dy=(a[0]-b[0])*111,dx=(a[1]-b[1])*111*Math.cos(a[0]*Math.PI/180);return Math.sqrt(dx*dx+dy*dy);}
function buildGraph(runs){var nodes={},adj={};function add(p){var k=gkey(p);if(!nodes[k]){nodes[k]=p;adj[k]=[];}return k;}runs.forEach(function(r){for(var i=1;i<r.length;i++){var a=add(r[i-1]),b=add(r[i]),w=gdist(r[i-1],r[i]);adj[a].push([b,w]);adj[b].push([a,w]);}});return {nodes:nodes,adj:adj};}
function nearestNode(g,p){var best=null,bd=1e9;for(var k in g.nodes){var d=gdist(g.nodes[k],p);if(d<bd){bd=d;best=k;}}return bd<1.5?best:null;}
function roadPath(g,from,to){var s=nearestNode(g,from),t=nearestNode(g,to);if(!s||!t||s===t)return null;var dist={},prev={},done={},q=[s];dist[s]=0;while(q.length){var u=null,ud=1e9,ui=-1;for(var i=0;i<q.length;i++){if(dist[q[i]]<ud){ud=dist[q[i]];u=q[i];ui=i;}}q.splice(ui,1);if(u===t)break;done[u]=1;g.adj[u].forEach(function(e){var v=e[0],nd=ud+e[1];if(done[v])return;if(dist[v]===undefined||nd<dist[v]){if(dist[v]===undefined)q.push(v);dist[v]=nd;prev[v]=u;}});}if(dist[t]===undefined)return null;if(dist[t]>gdist(from,to)*1.8+3)return null;var path=[],k=t;while(k){path.push(g.nodes[k]);k=prev[k];}return path.reverse();}
function spanLine(a){var cl=a.type==='CL',col=ALERT_COLORS[a.type]||'#6B7280';var line=L.polyline([[a.lat,a.lon],[a.end.lat,a.end.lon]],{color:col,weight:cl?7:5,opacity:.8,dashArray:'6 7'}).on('click',function(){showCard(alrCard(a),cl);}).addTo(alrLayer);L.circleMarker([a.end.lat,a.end.lon],{radius:RS(4),color:'#fff',weight:1.5,fillColor:col,fillOpacity:1}).on('click',function(){showCard(alrCard(a),cl);}).addTo(alrLayer);loadRoads().then(function(){if(!ROADG||!alrLayer.hasLayer(line))return;var p=roadPath(ROADG,[a.lat,a.lon],[a.end.lat,a.end.lon]);if(p&&p.length>1){line.setLatLngs(p);line.setStyle({dashArray:null});}});}
function mpText(a){return a.mp>0?' · MP '+Math.round(a.mp)+(a.end&&a.end.mp>0&&Math.round(a.end.mp)!==Math.round(a.mp)?' to '+Math.round(a.end.mp):''):'';}
async function loadConds(){const out=[];for(const st of PASS.states){for(const r of await feedRows(WORKER+'/conditions?state='+st,'road-weather-reports','road weather')){const sl=r.location&&r.location['start-location'];const lat=+(r.latitude!=null?r.latitude:(sl&&sl['start-lat']));const lon=+(r.longitude!=null?r.longitude:(sl&&sl['start-long']));if(!near(lat,lon))continue;const restr=[r['restriction-one'],r['restriction-two']].filter(x=>x&&!/^no restrict/i.test(String(x))).map(x=>clean(x,80));out.push({lat,lon,name:clean(r['location-name']||(r.location&&r.location['location-name'])||r['route-id']||'Road report',80),cond:clean(r['road-surface-condition'],220),wx:clean(r['weather-condition'],60),temp:(r['air-temperature']!=null&&r['air-temperature']!=='')?String(r['air-temperature']):'',restr,note:clean(r.comments||'',280)});}}return out;}
async function loadFires(){const dLat=PASS.radiusKm/111,dLon=PASS.radiusKm/(111*Math.cos(PASS.lat*Math.PI/180));const bb=[PASS.lon-dLon,PASS.lat-dLat,PASS.lon+dLon,PASS.lat+dLat].map(v=>v.toFixed(4)).join(',');const rows=await feedRows(WORKER+'/fires?bbox='+bb,'fires','fires');return rows.filter(f=>near(+f.lat,+f.lon)).map(f=>({lat:+f.lat,lon:+f.lon,name:clean(f.name||'Fire',80),acres:f.acres,pct:f.containedPct,rx:!!f.isRx,dist:km(PASS.lat,PASS.lon,+f.lat,+f.lon)/1.609344})).sort((a,b)=>a.dist-b.dist);}
const cardEl=document.getElementById('coCard');
let selectedMarker=null;
let blinkTimer=null,blinkBase=null,blinkOn=false;
function selectCamMarker(m){if(blinkTimer){clearInterval(blinkTimer);blinkTimer=null;}if(selectedMarker&&blinkBase)selectedMarker.setStyle(blinkBase);selectedMarker=m||null;blinkBase=null;if(m){blinkBase={radius:m.options.radius,weight:m.options.weight,color:m.options.color};blinkOn=false;blinkTimer=setInterval(()=>{blinkOn=!blinkOn;m.setStyle(blinkOn?{radius:blinkBase.radius+3,weight:4,color:'#FBBF24'}:blinkBase);},500);}}
function showCard(html,isClosure,camIndex){cardEl.className='co-card'+(isClosure?' closure':'');cardEl.innerHTML='<button class="cx" aria-label="Close">×</button>'+html;cardEl.style.display='block';cardEl.querySelector('.cx').onclick=function(){cardEl.style.display='none';selectCamMarker(null);};const p=cardEl.querySelector('.cc-prev'),n=cardEl.querySelector('.cc-next');if(p)p.onclick=()=>showCamAt(camIndex-1);if(n)n.onclick=()=>showCamAt(camIndex+1);}
function bust(u){return u+(u.includes('?')?'&':'?')+'t='+Date.now();}
function camCard(c,i){const nav=(i!=null&&CAMS.length>1)?'<div class="cc-nav"><button type="button" class="cc-prev">&lsaquo; Prev</button><span class="cc-count">'+(i+1)+' / '+CAMS.length+'</span><button type="button" class="cc-next">Next &rsaquo;</button></div>':'';return '<div class="cc-title">'+esc(c.title)+'</div><div class="cc-meta">'+esc(c.route||PASS.route)+(c.mp>0?' · MP '+Math.round(c.mp):'')+' · '+(c.src||'${p.dot}')+(c.park?' · '+esc(c.park):'')+'</div><a href="'+c.img+'" target="_blank" rel="noopener" title="Open full image"><img class="cc-img" src="'+bust(c.img)+'" alt="Live: '+esc(c.title)+'" onerror="this.alt=\\'image unavailable\\'"></a>'+nav;}
function showCamAt(i){const n=((i%CAMS.length)+CAMS.length)%CAMS.length;const c=CAMS[n];showCard(camCard(c,n),false,n);selectCamMarker(camMarkers[n]);map.panTo([c.lat,c.lon]);}
function fireCard(f){return '<div class="cc-title">'+esc(f.name)+(f.rx?' (prescribed burn)':'')+'</div><div class="cc-meta">'+(f.acres!=null?Math.round(f.acres).toLocaleString()+' acres · ':'')+(f.pct!=null?f.pct+'% contained · ':'')+f.dist.toFixed(0)+' mi away'+'</div>';}
function alrCard(a){return '<div class="cc-title">'+esc(a.title)+'</div><div class="cc-meta">'+esc(a.route||PASS.route)+mpText(a)+'</div>'+(a.desc&&a.desc!==a.title?'<div class="cc-desc">'+esc(a.desc)+'</div>':'');}
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
function feedCount(label,n){return failedFeeds.has(label)?'?':n;}
function draw(){camLayer.clearLayers();alrLayer.clearLayers();fireLayer.clearLayers();plowLayer.clearLayers();selectedMarker=null;camMarkers=[];if(PLOWS&&showPlow)PLOWLIST.forEach(t=>L.marker([t.lat,t.lon],{icon:plowIcon(t.bearing)}).on('click',()=>showCard(plowCard(t),false)).addTo(plowLayer));if(showCam)CAMS.forEach((c,i)=>{const m=L.circleMarker([c.lat,c.lon],{radius:RS(c.src?7:6),color:'#fff',weight:1.5,fillColor:c.src?'#7C3AED':'#0f7a4f',fillOpacity:.95}).on('click',()=>{showCard(camCard(c,i),false,i);selectCamMarker(m);}).addTo(camLayer);camMarkers[i]=m;});if(showAlr)ALERTS.forEach(a=>{const cl=a.type==='CL';if(a.end)spanLine(a);L.circleMarker([a.lat,a.lon],{radius:RS(cl?10:7),color:'#fff',weight:cl?2.5:1.5,fillColor:ALERT_COLORS[a.type]||'#6B7280',fillOpacity:1}).on('click',()=>showCard(alrCard(a),cl)).addTo(alrLayer);});if(PASS.area&&showFire)FIRES.forEach(f=>L.circleMarker([f.lat,f.lon],{radius:RS(f.rx?6:9),color:'#fff',weight:1.5,fillColor:f.rx?'#9CA3AF':'#EA580C',fillOpacity:.95}).on('click',()=>showCard(fireCard(f),false)).addTo(fireLayer));const bits=[];if(showCam)bits.push('📷 '+feedCount('cameras',CAMS.length)+' cameras');if(showAlr)bits.push('⚠ '+feedCount('alerts',alertCount())+' alerts');if(PASS.area&&showFire)bits.push('🔥 '+feedCount('fires',FIRES.length)+' fires');if(PLOWS&&showPlow)bits.push('🚜 '+PLOWLIST.length+' plows');document.getElementById('statCams').textContent=feedCount('cameras',CAMS.length);document.getElementById('statAlerts').textContent=feedCount('alerts',alertCount());document.getElementById('coStatus').textContent=(bits.length?bits.join(' · ')+' ${p.nearWord || 'near the pass'}':'Toggle a layer to view ${isArea ? 'the area' : 'pass'} data')+(failedFeeds.size?' · Unavailable or incomplete: '+[...failedFeeds].join(', '):'');}
const TAGS={CL:['cl','Closed'],AC:['ac','Crash'],RW:['rw','Work'],WE:['we','Weather'],HZ:['hz','Hazard'],IN:['ac','Incident'],OT:['ot','Alert']};
function tag(k,label){return '<span class="tag '+k+'">'+label+'</span>';}
function alrLi(a){const t=TAGS[a.type]||TAGS.OT;const full=isFullClosure(a);return '<li>'+tag(full?'cl':t[0],full?'Closed':t[1])+esc(a.title)+'<span class="m">'+esc(a.route||'')+mpText(a)+(a.desc&&a.desc!==a.title?' · '+esc(a.desc):'')+'</span></li>';}
function setList(id,items,empty){const el=document.getElementById(id);if(!el)return;const h=el.querySelector('h2');let c=h.querySelector('.cnt');if(!c){c=document.createElement('span');c.className='cnt';h.appendChild(c);}c.textContent=items.length;el.querySelector('ul').innerHTML=items.length?items.join(''):'<li class="empty">'+empty+'</li>';}
function loadCamImg(li,c){let img=li.querySelector('img');if(!img){img=document.createElement('img');img.alt='Live: '+c.title;img.loading='lazy';li.appendChild(img);}img.src=bust(c.img);li.querySelector('button').textContent='Refresh';}
function isWorkCond(w){return /roadwork|maintenance|construction/i.test(w.cond||'');}
function alertCount(){return ALERTS.length+CONDS.filter(isWorkCond).length;}
function tcase(x){return x===x.toUpperCase()?x.toLowerCase().replace(/(^|[\\s\\-\\/(])([a-z])/g,function(m,a,b){return a+b.toUpperCase();}).replace(/\\bMp\\b/g,'MP').replace(/\\b(Ii|Iii|Iv)\\b/g,function(m){return m.toUpperCase();}):x;}
function condWorkLi(w){const m=/^([^:]{3,90}):\\s*(.+)$/.exec(w.note||'');const t=m?tcase(m[1]):w.name;const d=m?m[2]:(w.note||'');return '<li>'+tag('rw','Work')+esc(t)+'<span class="m">'+esc(w.name)+(d?' · '+esc(d):'')+'</span></li>';}
function renderLists(){
  const camItems=CAMS.map((c,i)=>'<li data-i="'+i+'">'+tag(c.src?'nps':'dot',c.src||'${p.dot}')+esc(c.title)+' <button type="button">Show</button><span class="m">'+esc(c.route||'')+(c.mp>0?' · MP '+Math.round(c.mp):'')+(c.park?' · '+esc(c.park):'')+'</span></li>');
  setList('lstCams',camItems,'No cameras in the feed for this area right now.');
  document.querySelectorAll('#lstCams li[data-i] button').forEach(b=>{b.onclick=()=>{const li=b.closest('li');loadCamImg(li,CAMS[+li.dataset.i]);};});
  const all=document.getElementById('btnAllCams');if(all)all.onclick=()=>{document.querySelectorAll('#lstCams li[data-i]').forEach(li=>loadCamImg(li,CAMS[+li.dataset.i]));all.textContent='Refresh every camera';};
  const snow=CONDS.filter(w=>!isWorkCond(w)).map(w=>'<li>'+tag('we','Report')+esc(w.name)+'<span class="m">'+esc(w.cond||'No surface report')+(w.wx?' · '+esc(w.wx):'')+(w.temp?' · '+esc(w.temp)+'°F':'')+(w.restr.length?' · '+esc(w.restr.join(' · ')):'')+(w.note?' · '+esc(w.note):'')+'</span></li>').concat(ALERTS.filter(a=>a.type==='WE').map(alrLi));
  setList('lstSnow',snow,'No snow, ice or pass reports for this area right now.');
  const fires=FIRES.map(f=>'<li>'+tag(f.rx?'rx':'fire',f.rx?'Prescribed':'Fire')+esc(f.name)+'<span class="m">'+(f.acres!=null?Math.round(f.acres).toLocaleString()+' acres · ':'')+(f.pct!=null?f.pct+'% contained · ':'')+f.dist.toFixed(0)+' mi away</span></li>');
  setList('lstFire',fires,'No active fires within '+Math.round(PASS.radiusKm/1.609344)+' miles in the NIFC feed.');
  const clos=ALERTS.filter(a=>a.type!=='RW'&&a.type!=='WE').sort((a,b)=>(isFullClosure(b)-isFullClosure(a))).map(alrLi);
  setList('lstClos',clos,'No closures, crashes or hazards reported in this area right now.');
  const work=ALERTS.filter(a=>a.type==='RW').map(alrLi).concat(CONDS.filter(isWorkCond).map(condWorkLi));
  setList('lstWork',work,'No work zones reported in this area right now.');
  for(const [id,deps] of [['lstCams',['cameras']],['lstSnow',['road weather','alerts']],['lstFire',['fires']],['lstClos',['alerts']],['lstWork',['alerts','road weather']]]){
    if(!deps.some(x=>failedFeeds.has(x))){
      const pe=deps.some(x=>partialFeeds.has(x))&&document.querySelector('#'+id+' ul .empty');
      if(pe)pe.textContent+=' Part of the agency feed did not load, so this list may be incomplete.';
      continue;
    }
    const el=document.getElementById(id);if(!el)continue;const ul=el.querySelector('ul'),empty=ul.querySelector('.empty');
    if(empty)empty.remove();
    ul.insertAdjacentHTML('beforeend','<li class="empty">Feed unavailable or incomplete. Check the agency links for current conditions.</li>');
    el.querySelector('.cnt').textContent='?';
  }
}
L.marker([PASS.lat,PASS.lon],{icon:L.divIcon({className:'',html:'<div class="poi-icon">★</div>',iconSize:[30,30],iconAnchor:[15,15]}),zIndexOffset:500}).bindTooltip('${p.markerLabel || `${p.name} · ${p.elev}`}',{direction:'top',offset:[0,-12]}).addTo(map);
document.getElementById('tgCam').onchange=e=>{showCam=e.target.checked;draw();};
document.getElementById('tgAlr').onchange=e=>{showAlr=e.target.checked;draw();};
const tgFire=document.getElementById('tgFire');if(tgFire)tgFire.onchange=e=>{showFire=e.target.checked;draw();};
const tgPlow=document.getElementById('tgPlow');if(tgPlow)tgPlow.onchange=e=>{showPlow=e.target.checked;draw();};
function isFullClosure(a){const t=(a.title+' '+(a.desc||'')).toLowerCase();return a.type==='CL'&&/clos/.test(t)&&!/(lane|ramp|exit|rest area|shoulder|on ?ramp|off ?ramp|connector)/.test(t);}
Promise.all([loadCams(),loadAlerts(),PASS.area?loadConds():Promise.resolve([]),PASS.area?loadFires():Promise.resolve([]),PLOWS?loadPlows():Promise.resolve([])]).then(([c,a,w,f,pl])=>{CAMS=c.slice().sort(function(x,y){return (/airport/i.test(x.route||'')?1:0)-(/airport/i.test(y.route||'')?1:0);});ALERTS=a;CONDS=w;FIRES=f;PLOWLIST=pl;const kp=document.getElementById('keyPark');if(kp&&CAMS.some(x=>x.src))kp.hidden=false;document.getElementById('statCams').textContent=CAMS.length;document.getElementById('statAlerts').textContent=alertCount();draw();renderLists();if(PLOWS)renderPlows();const fc=ALERTS.filter(isFullClosure);if(fc.length){const fl=fc[0];const bn=document.getElementById('critBanner');bn.innerHTML=PASS.area?('⚠ '+fc.length+' full closure'+(fc.length>1?'s':'')+' within ${p.rMi || ''} miles: '+fc.slice(0,3).map(x=>esc(x.route||'road')+(x.mp>0?' near MP '+Math.round(x.mp):'')).join(', ')+'. Details in the closures list below.'):('⚠ CRITICAL: the ${p.name} area has '+fc.length+' active full-closure alert'+(fc.length>1?'s':'')+' ${p.bannerWhere || `on ${p.route}`}'+(fl.mp>0?' near MP '+Math.round(fl.mp):'')+'. Tap a red marker for details.');bn.style.display='block';}}).catch(()=>{document.getElementById('coStatus').textContent='Live data is unavailable right now. Try again shortly.';});
if(SNOW){loadSnow().catch(()=>{document.getElementById('snAsOf').textContent='The station did not answer. Try again in a few minutes.';});loadForecast().catch(()=>{});loadAvy().catch(()=>{});}
</script>

${sp.js}
</body>
</html>`;
}

// Optional slugs on the command line write only those pages, e.g.
//   node scripts/gen-pass-pages.js cabbage-hill rainier-roads
// No slugs = every pass and area page, as before.
// The config is shared with scripts/gen-map-sheets.mjs (the printable maps), so the
// pages are only written when this file is run directly.
module.exports={PASSES,AREAS};
if(require.main===module){
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
}
