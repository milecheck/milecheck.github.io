// provinces.cjs — per-province content for /road-conditions/<province>/ and /road-conditions/canada/
// (scripts/gen-province-road-conditions-pages.js). Drafted 2026-10-03; NOT PUBLISHED until ChatGPT review.
// Facts come from MileCheck's own province guides (blog/km-markers-*.html) and camera pages
// (cameras/*). Only provinces whose live feed the Worker serves (/incidents?state=XX) belong here:
// BC (DriveBC), AB (511 Alberta), MB (Manitoba 511). No safety verdicts, no superlatives.
// Canada measures in kilometres. Never write "mile marker" for these pages.
module.exports = [
  { code: 'BC', name: 'British Columbia', slug: 'british-columbia', dot: 'DriveBC', dotUrl: 'https://www.drivebc.ca',
    bounds: [[48.3, -139.1], [60.0, -114.0]], guide: 'km-markers-british-columbia',
    drive: `Highway 1, the Trans-Canada, crosses the Lower Mainland, squeezes through the Fraser Canyon past Yale, Boston Bar and Lytton, then runs east to Kamloops, Revelstoke and Rogers Pass. Highway 5, the Coquihalla, climbs from Hope to Merritt and Kamloops and reaches a summit near 1,240 metres. Highway 97 starts at the US border near Osoyoos and runs through the Okanagan and the Cariboo to Prince George. Highway 99, the Sea-to-Sky, follows Howe Sound from Vancouver to Squamish and Whistler.`,
    season: `BC sets winter tire rules on signed winter routes from October 1. On designated mountain routes such as the Coquihalla they run through April 30, and some other routes end March 31. Commercial chain requirements depend on vehicle weight and equipment, so check BC's requirements for your vehicle and obey posted chain-up signs. DriveBC posts closures for snow, avalanche control and crashes on the mountain highways, and its cameras show the road at places like the Coquihalla Summit.`,
    where: `DriveBC often describes incident locations using named landmarks.` },
  { code: 'AB', name: 'Alberta', slug: 'alberta', dot: '511 Alberta', dotUrl: 'https://511.alberta.ca',
    bounds: [[49.0, -120.0], [60.0, -110.0]], guide: 'km-markers-alberta',
    drive: `Highway 2, the Queen Elizabeth II Highway, runs about 300 kilometres between Calgary and Edmonton with Red Deer near the halfway point. Through Calgary it is Deerfoot Trail. Highway 1, the Trans-Canada, climbs from Calgary through Banff National Park to the BC border at Kicking Horse Pass and runs east through Medicine Hat. Highway 16, the Yellowhead, crosses the province from Saskatchewan through Edmonton to Jasper. Highway 216 is Anthony Henday Drive around Edmonton, and Highway 201 is Stoney Trail around Calgary.`,
    season: `Alberta winter driving is mostly wind, drifting snow and ice at highway speed. Whiteouts on the open prairie sections can close highways with little warning, and freezing rain can glaze long stretches. In the mountains, Highway 93, the Icefields Parkway between Jasper and Lake Louise, has long stretches with no services and no cell coverage, and closes for avalanche control and storms.`,
    where: `On Alberta's QEII and ring-road freeways, exit numbers follow the kilometre count.` },
  { code: 'MB', name: 'Manitoba', slug: 'manitoba', dot: 'Manitoba 511', dotUrl: 'https://www.manitoba511.ca',
    bounds: [[49.0, -102.1], [60.0, -95.1]], guide: null,
    drive: `Highway 1, the Trans-Canada, crosses the prairie east and west of Winnipeg. Highway 75 runs south from Winnipeg to the US border at Emerson. Highways 100 and 101 form Winnipeg's Perimeter Highway. Highways 6 and 10 run north.`,
    season: `Winter is long on the prairie. Manitoba 511 posts road conditions by highway, and its snowplow layer shows the trucks that have reported in during the past two hours. The feed also carries weight and heavy-truck restrictions and bridge closures.`,
    where: `The highways listed here are Provincial Trunk Highways, abbreviated PTH, so an alert may read "PTH 10." Manitoba also has numbered Provincial Roads.` },
];
