// ski-resorts.cjs — the resorts behind /ski/<slug>/ (scripts/gen-ski-resort-pages.js), 2026-10-15.
// Leah 2026-10-16: "we should link each ski resort to a plow route."
//
// One record per resort:
//   name, slug, state (code the Worker uses: /plows?state=XX, /cameras?state=XX, /incidents?state=XX)
//   lat/lon      the base area. Source per record in the comment: OpenStreetMap (Nominatim search or
//                reverse geocode, 2026-10-15) unless it says otherwise.
//   routes       the access highways, spelled the way the milepost corpus spells them
//                (assets/data/mileposts_XX.json in the app repo: UT 'SR-210', CO 'SH-9', WA 'SR 410',
//                MT 'MT-64', AK 'Seward Highway', AB 'AB-1'). Plow trucks come from the Worker already
//                snapped to a route in this spelling, so the page matches on it. A route that is NOT
//                in the corpus is still listed when the DOT's cameras or alerts use it (noted per record);
//                those resorts also catch trucks by radius.
//   road         one line for the reader: the road in plain words.
//   radius       miles. The plow and camera search circle around the base. 10 to 25.
//   report       the resort's own snow report (external, new tab). Checked 2026-10-15; see the
//                generator log for any that did not answer.
//   pass         slug under /passes/ for the same road, if one exists. corridor: slug under /corridors/.
//   note         an honest line the page prints when the live data does not cover the last miles.
//
// Order: plow regions first (Colorado, Utah, Alberta, Ontario, Pennsylvania, Minnesota, Michigan,
// Montana, Alaska, West Virginia, Indiana, Iowa, North Dakota, Manitoba), then Washington and Oregon,
// whose DOTs publish no truck positions (the page says so and shows cameras + reports instead).
'use strict';

const R = (o) => o;

module.exports = [
  // ───────── Colorado (CDOT plows) ─────────
  // Vail: base of Gondola One, Vail Village. OSM search 2026-10-15 (39.5995,-106.3395 is the town
  // node; the base at Vail Village is 39.6403,-106.3742 per OSM reverse). Access: I-70 exits 173/176/180,
  // Vail Pass is 10 mi east (vail.com/plan-your-trip/getting-here.aspx).
  R({ name: 'Vail', slug: 'vail', state: 'CO', lat: 39.6403, lon: -106.3742, routes: ['I-70'], road: 'I-70, exits 173 to 180, with Vail Pass 10 miles east', radius: 15, report: 'https://www.vail.com/the-mountain/mountain-conditions/snow-and-weather-report.aspx', pass: 'vail', corridor: 'i-70' }),
  // Breckenridge: Peak 9 base. OSM reverse 2026-10-15. Access: I-70 exit 203 to SH-9 south 9 mi
  // (breckenridge.com/plan-your-trip/getting-here.aspx).
  R({ name: 'Breckenridge', slug: 'breckenridge', state: 'CO', lat: 39.4805, lon: -106.0667, routes: ['SH-9', 'I-70'], road: 'SH-9 south from I-70 exit 203 at Frisco', radius: 15, report: 'https://www.breckenridge.com/the-mountain/mountain-conditions/snow-and-weather-report.aspx', pass: 'eisenhower', corridor: 'i-70' }),
  // Keystone: River Run. OSM search 2026-10-15. Access: I-70 exit 205 to US-6 east 6 mi
  // (keystoneresort.com/plan-your-trip/getting-here.aspx).
  R({ name: 'Keystone', slug: 'keystone', state: 'CO', lat: 39.6046, lon: -105.9538, routes: ['US-6', 'I-70'], road: 'US-6 east from I-70 exit 205 at Silverthorne', radius: 12, report: 'https://www.keystoneresort.com/the-mountain/mountain-conditions/snow-and-weather-report.aspx', pass: 'eisenhower', corridor: 'i-70' }),
  // Arapahoe Basin: OSM search 2026-10-15 ("28194 US 6, Keystone"). Access: US-6 over Loveland Pass
  // from either I-70 exit 205 (west) or exit 216 (east) (arapahoebasin.com/getting-here).
  R({ name: 'Arapahoe Basin', slug: 'arapahoe-basin', state: 'CO', lat: 39.6419, lon: -105.8721, routes: ['US-6', 'I-70'], road: 'US-6 over Loveland Pass, from I-70 exit 205 or exit 216', radius: 12, report: 'https://www.arapahoebasin.com/snow-report/', pass: 'eisenhower', corridor: 'i-70' }),
  // Copper Mountain: OSM search 2026-10-15. Access: I-70 exit 195 at SH-91 (coppercolorado.com/plan-your-trip/getting-here).
  R({ name: 'Copper Mountain', slug: 'copper-mountain', state: 'CO', lat: 39.4994, lon: -106.1563, routes: ['I-70', 'SH-91'], road: 'I-70 exit 195, where SH-91 leaves for Leadville', radius: 12, report: 'https://www.coppercolorado.com/the-mountain/conditions-weather/snow-report', pass: 'vail', corridor: 'i-70' }),
  // Loveland Ski Area: Loveland Basin. OSM search 2026-10-15. Access: I-70 exit 216, the last exit before
  // the Eisenhower Tunnel (skiloveland.com/directions).
  R({ name: 'Loveland Ski Area', slug: 'loveland', state: 'CO', lat: 39.6783, lon: -105.9105, routes: ['I-70', 'US-6'], road: 'I-70 exit 216, just east of the Eisenhower Tunnel', radius: 10, report: 'https://skiloveland.com/snow-report/', pass: 'eisenhower', corridor: 'i-70' }),
  // Winter Park: OSM search 2026-10-15 (resort node 39.8620,-105.7738). Access: US-40 over Berthoud
  // Pass from I-70 exit 232 (winterparkresort.com/plan-your-trip/getting-here).
  R({ name: 'Winter Park', slug: 'winter-park', state: 'CO', lat: 39.8620, lon: -105.7738, routes: ['US-40'], road: 'US-40 over Berthoud Pass, from I-70 exit 232 at Empire', radius: 15, report: 'https://www.winterparkresort.com/the-mountain/mountain-report', corridor: 'i-70' }),
  // Steamboat: OSM search 2026-10-15. Access: US-40 over Rabbit Ears Pass from I-70 at Silverthorne via
  // SH-9, or from Kremmling (steamboat.com/plan-your-trip/getting-here).
  R({ name: 'Steamboat', slug: 'steamboat', state: 'CO', lat: 40.4563, lon: -106.7662, routes: ['US-40', 'SH-131'], road: 'US-40 over Rabbit Ears Pass into Steamboat Springs', radius: 20, report: 'https://www.steamboat.com/the-mountain/mountain-report' }),
  // Aspen Snowmass: Snowmass Village base. OSM search 2026-10-15. Access: SH-82 from I-70 exit 116 at
  // Glenwood Springs, 40 mi (aspensnowmass.com/plan-your-trip/getting-here).
  R({ name: 'Aspen Snowmass', slug: 'aspen-snowmass', state: 'CO', lat: 39.1857, lon: -106.9449, routes: ['SH-82'], road: 'SH-82 up the Roaring Fork Valley from I-70 at Glenwood Springs', radius: 20, report: 'https://www.aspensnowmass.com/four-mountains/snow-report', corridor: 'i-70' }),
  // Beaver Creek: village base. OSM reverse 2026-10-15. Access: I-70 exit 167 at Avon, then US-6 to
  // Village Road (beavercreek.com/plan-your-trip/getting-here.aspx).
  R({ name: 'Beaver Creek', slug: 'beaver-creek', state: 'CO', lat: 39.6042, lon: -106.5165, routes: ['I-70', 'US-6'], road: 'I-70 exit 167 at Avon, then US-6 to Village Road', radius: 12, report: 'https://www.beavercreek.com/the-mountain/mountain-conditions/snow-and-weather-report.aspx', pass: 'vail', corridor: 'i-70' }),
  // Telluride: Mountain Village. OSM search 2026-10-15. Access: SH-145 from Placerville or from SH-62 at
  // Ridgway (tellurideskiresort.com/plan-your-trip/getting-here).
  R({ name: 'Telluride', slug: 'telluride', state: 'CO', lat: 37.9362, lon: -107.8451, routes: ['SH-145', 'SH-62'], road: 'SH-145 into Telluride and Mountain Village', radius: 20, report: 'https://tellurideskiresort.com/snow-report/' }),
  // Crested Butte: Mount Crested Butte base. OSM search 2026-10-15. Access: SH-135 north from US-50 at
  // Gunnison, 28 mi (skicb.com/plan-your-trip/getting-here.aspx).
  R({ name: 'Crested Butte', slug: 'crested-butte', state: 'CO', lat: 38.8970, lon: -106.9447, routes: ['SH-135', 'US-50'], road: 'SH-135 north from US-50 at Gunnison', radius: 20, report: 'https://www.skicb.com/the-mountain/mountain-conditions/snow-and-weather-report.aspx' }),
  // Wolf Creek: OSM search 2026-10-15. The base sits on US-160 at Wolf Creek Pass (wolfcreekski.com/directions).
  R({ name: 'Wolf Creek', slug: 'wolf-creek', state: 'CO', lat: 37.4647, lon: -106.7865, routes: ['US-160'], road: 'US-160 at the top of Wolf Creek Pass, between South Fork and Pagosa Springs', radius: 20, report: 'https://wolfcreekski.com/wcs-snow-report/' }),

  // ───────── Utah (UDOT plows) ─────────
  // Snowbird: OSM search 2026-10-15 (resort node 40.5807,-111.6573). Access: SR-210 up Little Cottonwood
  // Canyon from I-215 exit 6 (snowbird.com/getting-here). Corpus spells it SR-210; UDOT cameras 'SR 210'.
  R({ name: 'Snowbird', slug: 'snowbird', state: 'UT', lat: 40.5807, lon: -111.6573, routes: ['SR-210', 'I-215'], road: 'SR-210 up Little Cottonwood Canyon from I-215 exit 6', radius: 12, report: 'https://www.snowbird.com/the-mountain/mountain-report/current-conditions-weather/', pass: 'little-cottonwood' }),
  // Alta: OSM search 2026-10-15. Access: SR-210, the end of the road past Snowbird (alta.com/getting-here).
  R({ name: 'Alta', slug: 'alta', state: 'UT', lat: 40.5882, lon: -111.6384, routes: ['SR-210', 'I-215'], road: 'SR-210, the end of Little Cottonwood Canyon', radius: 12, report: 'https://www.alta.com/weather', pass: 'little-cottonwood' }),
  // Brighton: OSM search 2026-10-15. Access: SR-190 up Big Cottonwood Canyon from I-215 exit 6 (brightonresort.com/getting-here).
  R({ name: 'Brighton', slug: 'brighton', state: 'UT', lat: 40.5983, lon: -111.5837, routes: ['SR-190', 'I-215'], road: 'SR-190 to the top of Big Cottonwood Canyon', radius: 12, report: 'https://www.brightonresort.com/conditions' }),
  // Solitude: OSM search 2026-10-15. Access: SR-190, Big Cottonwood Canyon (solitudemountain.com/getting-here).
  R({ name: 'Solitude', slug: 'solitude', state: 'UT', lat: 40.6231, lon: -111.5976, routes: ['SR-190', 'I-215'], road: 'SR-190 up Big Cottonwood Canyon', radius: 12, report: 'https://www.solitudemountain.com/mountain-and-village/conditions-and-maps' }),
  // Park City Mountain: Mountain Village base. OSM search 2026-10-15. Access: I-80 exit 145 to SR-224
  // south (parkcitymountain.com/plan-your-trip/getting-here.aspx). Parleys Summit is on I-80 west of the exit.
  R({ name: 'Park City Mountain', slug: 'park-city', state: 'UT', lat: 40.6514, lon: -111.5077, routes: ['SR-224', 'I-80', 'SR-248'], road: 'SR-224 south from I-80 exit 145, after Parleys Summit', radius: 12, report: 'https://www.parkcitymountain.com/the-mountain/mountain-conditions/snow-and-weather-report.aspx', pass: 'parleys', corridor: 'i-80' }),
  // Deer Valley: Snow Park base. OSM search 2026-10-15 (sports_centre node 40.6374,-111.4783). Access:
  // SR-224 from I-80, or SR-248 from US-40 (deervalley.com/plan-your-trip/getting-here).
  R({ name: 'Deer Valley', slug: 'deer-valley', state: 'UT', lat: 40.6374, lon: -111.4783, routes: ['SR-224', 'SR-248', 'I-80', 'US-40'], road: 'SR-224 from I-80, or SR-248 from US-40 at Kimball Junction', radius: 12, report: 'https://www.deervalley.com/explore-the-mountain/mountain-report', pass: 'parleys', corridor: 'i-80' }),
  // Snowbasin: OSM search 2026-10-15. Access: I-84 exit 92 to SR-167 (Trappers Loop), then SR-226
  // (snowbasin.com/plan-your-visit/getting-here).
  R({ name: 'Snowbasin', slug: 'snowbasin', state: 'UT', lat: 41.2004, lon: -111.8653, routes: ['SR-226', 'SR-167', 'I-84'], road: 'SR-167 over Trappers Loop from I-84 exit 92, then SR-226', radius: 15, report: 'https://www.snowbasin.com/the-mountain/mountain-report/' }),
  // Powder Mountain: base at the top of SR-158. OSM reverse 2026-10-15. Access: SR-39 up Ogden Canyon
  // from I-15, then SR-158 through Eden (powdermountain.com/getting-here).
  R({ name: 'Powder Mountain', slug: 'powder-mountain', state: 'UT', lat: 41.3790, lon: -111.7804, routes: ['SR-158', 'SR-39', 'SR-162'], road: 'SR-39 up Ogden Canyon, then SR-158 through Eden to the top', radius: 15, report: 'https://www.powdermountain.com/conditions' }),
  // Sundance: OSM search 2026-10-15. Access: US-189 up Provo Canyon from I-15, then SR-92 (sundanceresort.com/directions).
  R({ name: 'Sundance', slug: 'sundance', state: 'UT', lat: 40.3909, lon: -111.5777, routes: ['SR-92', 'US-189'], road: 'US-189 up Provo Canyon, then SR-92 north', radius: 12, report: 'https://www.sundanceresort.com/mountain-report/' }),

  // ───────── Alberta (511 Alberta plows, km) ─────────
  // Lake Louise: OSM search 2026-10-15. Access: AB-1 (Trans-Canada) to the Lake Louise exit, then
  // Whitehorn Road (skilouise.com/getting-here).
  R({ name: 'Lake Louise', slug: 'lake-louise', state: 'AB', lat: 51.4423, lon: -116.1619, routes: ['AB-1', 'AB-93'], road: 'AB-1, the Trans-Canada, to the Lake Louise exit', radius: 20, report: 'https://www.skilouise.com/snow-conditions/' }),
  // Sunshine Village: gondola base at the end of Sunshine Road (OSM reverse 2026-10-15). Access: AB-1,
  // 8 km west of Banff, then Sunshine Road (skibanff.com/getting-here).
  R({ name: 'Sunshine Village', slug: 'sunshine-village', state: 'AB', lat: 51.1163, lon: -115.7623, routes: ['AB-1'], road: 'AB-1 west of Banff to the Sunshine Road turnoff', radius: 20, report: 'https://www.skibanff.com/the-mountain/mountain-report/current-conditions' }),
  // Mt Norquay: base lodge. OSM reverse 2026-10-15. Access: AB-1 at the Banff west exit, then Mount
  // Norquay Road (banffnorquay.com/getting-here).
  R({ name: 'Mt Norquay', slug: 'mount-norquay', state: 'AB', lat: 51.1996, lon: -115.5941, routes: ['AB-1'], road: 'AB-1 at Banff, then Mount Norquay Road up the switchbacks', radius: 15, report: 'https://banffnorquay.com/conditions/' }),
  // Marmot Basin: OSM search 2026-10-15. Access: AB-16 to Jasper, then AB-93 south and Marmot Basin
  // Road (skimarmot.com/getting-here).
  R({ name: 'Marmot Basin', slug: 'marmot-basin', state: 'AB', lat: 52.7954, lon: -118.1061, routes: ['AB-93', 'AB-16'], road: 'AB-16 to Jasper, then AB-93 south to Marmot Basin Road', radius: 20, report: 'https://www.skimarmot.com/news-snow-report/' }),
  // Nakiska: OSM search 2026-10-15. Access: AB-1 to AB-40 south into Kananaskis (skinakiska.com/getting-here).
  R({ name: 'Nakiska', slug: 'nakiska', state: 'AB', lat: 50.9419, lon: -115.1513, routes: ['AB-40', 'AB-1'], road: 'AB-40 south from AB-1 into Kananaskis Country', radius: 20, report: 'https://skinakiska.com/conditions/snow-report/' }),
  // Castle Mountain: OSM search 2026-10-15. Access: AB-3 to Pincher Creek, AB-507 and AB-774 (skicastle.ca/getting-here).
  R({ name: 'Castle Mountain', slug: 'castle-mountain', state: 'AB', lat: 49.3089, lon: -114.4253, routes: ['AB-774', 'AB-507', 'AB-3'], road: 'AB-3 to Pincher Creek, then AB-507 and AB-774 to the end of the road', radius: 25, report: 'https://www.skicastle.ca/snow-report-conditions-new/' }),

  // ───────── Ontario (Ontario 511 plows, km) ─────────
  // Blue Mountain: village. OSM search 2026-10-15. Access: ON-400 north to Barrie, ON-26 west through
  // Collingwood (bluemountain.ca/plan/getting-here). ON-26 is not in the milepost corpus; Ontario 511
  // cameras use it, so it stays listed.
  R({ name: 'Blue Mountain', slug: 'blue-mountain', state: 'ON', lat: 44.5058, lon: -80.3073, routes: ['ON-26', 'ON-400'], road: 'ON-26 west through Collingwood, after ON-400 to Barrie', radius: 20, report: 'https://www.bluemountain.ca/mountain/mountain-report' }),
  // Mount St. Louis Moonstone: OSM search 2026-10-15. Access: ON-400 exit 131 at Moonstone Road (mountstlouis.com/directions).
  R({ name: 'Mount St. Louis Moonstone', slug: 'mount-st-louis-moonstone', state: 'ON', lat: 44.6236, lon: -79.6667, routes: ['ON-400'], road: 'ON-400 exit 131, Moonstone Road', radius: 15, report: 'https://www.mountstlouis.com/' }),

  // ───────── Pennsylvania (PennDOT plows) ─────────
  // Seven Springs: OSM search 2026-10-15. Access: PA Turnpike (I-76) exit 91 at Donegal, then PA-31 east
  // (7springs.com/plan-your-trip/getting-here.aspx). PA-31 is not in the corpus (PennDOT publishes
  // interstate markers only); PennDOT cameras and alerts use it.
  R({ name: 'Seven Springs', slug: 'seven-springs', state: 'PA', lat: 40.0235, lon: -79.2982, routes: ['I-76', 'PA-31'], road: 'PA Turnpike exit 91 at Donegal, then PA-31 east', radius: 15, report: 'https://www.7springs.com/the-mountain/mountain-conditions/snow-and-weather-report.aspx' }),
  // Camelback: OSM search 2026-10-15. Access: I-80 exit 299 at Tannersville, then PA-715 (camelbackresort.com/directions).
  R({ name: 'Camelback', slug: 'camelback', state: 'PA', lat: 41.0492, lon: -75.3504, routes: ['I-80', 'PA-715'], road: 'I-80 exit 299 at Tannersville, then PA-715 north', radius: 12, report: 'https://www.camelbackresort.com/snow-report-conditions', corridor: 'i-80' }),
  // Elk Mountain: OSM search 2026-10-15. Access: I-81 exit 206 at Lenox, then PA-374 (elkskier.com/directions).
  R({ name: 'Elk Mountain', slug: 'elk-mountain', state: 'PA', lat: 41.7196, lon: -75.5584, routes: ['I-81', 'PA-374'], road: 'I-81 exit 206 at Lenox, then PA-374 east', radius: 12, report: 'https://www.elkskier.com/conditions/', corridor: 'i-81' }),

  // ───────── Minnesota (MnDOT plows) ─────────
  // Lutsen Mountains: OSM search 2026-10-15. Access: MN-61 along the North Shore, 90 mi from Duluth (lutsen.com/directions).
  R({ name: 'Lutsen Mountains', slug: 'lutsen', state: 'MN', lat: 47.6560, lon: -90.7251, routes: ['MN-61'], road: 'MN-61 up the North Shore from Duluth', radius: 20, report: 'https://www.lutsen.com/mountain-info/mountain-report' }),
  // Spirit Mountain: OSM search 2026-10-15. Access: I-35 exit 249 in Duluth (spiritmt.com/directions).
  R({ name: 'Spirit Mountain', slug: 'spirit-mountain', state: 'MN', lat: 46.7176, lon: -92.2124, routes: ['I-35'], road: 'I-35 exit 249 on the west side of Duluth', radius: 12, report: 'https://spiritmt.com/winter/snow-report/', corridor: 'i-35' }),
  // Afton Alps: OSM search 2026-10-15. Access: I-94 east of St. Paul to MN-95 south at Lakeland
  // (aftonalps.com/plan-your-trip/getting-here.aspx).
  R({ name: 'Afton Alps', slug: 'afton-alps', state: 'MN', lat: 44.8576, lon: -92.7879, routes: ['MN-95', 'I-94'], road: 'I-94 east of St. Paul, then MN-95 south at Lakeland', radius: 12, report: 'https://www.aftonalps.com/the-mountain/mountain-conditions/snow-and-weather-report.aspx', corridor: 'i-94' }),

  // ───────── Michigan (MDOT plows) ─────────
  // Boyne Mountain: OSM reverse 2026-10-15. Access: US-131 at Boyne Falls, then Boyne Mountain Road
  // (boynemountain.com/directions).
  R({ name: 'Boyne Mountain', slug: 'boyne-mountain', state: 'MI', lat: 45.1636, lon: -84.9298, routes: ['US-131'], road: 'US-131 at Boyne Falls', radius: 15, report: 'https://www.boynemountain.com/' }),
  // The Highlands at Harbor Springs: OSM reverse 2026-10-15. Access: US-31 to Petoskey, M-119 to Harbor
  // Springs, then Pleasantview Road (highlandsharborsprings.com/directions). M-119 is not in the corpus;
  // Mi Drive cameras and alerts use it.
  R({ name: 'The Highlands', slug: 'the-highlands', state: 'MI', lat: 45.4680, lon: -84.9318, routes: ['US-31', 'M-119'], road: 'US-31 to Petoskey, then M-119 toward Harbor Springs', radius: 15, report: 'https://www.highlandsharborsprings.com/' }),
  // Crystal Mountain, Michigan: OSM search 2026-10-15. Access: M-115 at Thompsonville, between US-31 and
  // US-131 (crystalmountain.com/directions). M-115 is not in the corpus; Mi Drive uses it.
  R({ name: 'Crystal Mountain (Michigan)', slug: 'crystal-mountain-michigan', state: 'MI', lat: 44.5193, lon: -85.9907, routes: ['M-115', 'US-31', 'US-131'], road: 'M-115 at Thompsonville, 28 miles southwest of Traverse City', radius: 20, report: 'https://www.crystalmountain.com/ski/cams-conditions/mountain-report' }),

  // ───────── Montana (MDT plows) ─────────
  // Big Sky: Mountain Village. OSM search 2026-10-15. Access: US-191 through Gallatin Canyon, then MT-64
  // (Lone Mountain Trail) 9 mi (bigskyresort.com/plan-your-trip/getting-here).
  R({ name: 'Big Sky', slug: 'big-sky', state: 'MT', lat: 45.2840, lon: -111.4011, routes: ['MT-64', 'US-191'], road: 'US-191 through Gallatin Canyon, then MT-64 up to Mountain Village', radius: 20, report: 'https://www.bigskyresort.com/current-conditions' }),
  // Whitefish Mountain Resort: base village. OSM reverse 2026-10-15. Access: US-93 to Whitefish, then Big
  // Mountain Road, 8 mi (skiwhitefish.com/plan-your-trip/getting-here).
  R({ name: 'Whitefish Mountain Resort', slug: 'whitefish', state: 'MT', lat: 48.4811, lon: -114.3579, routes: ['US-93'], road: 'US-93 to Whitefish, then Big Mountain Road (a county road) for the last 8 miles', radius: 15, report: 'https://skiwhitefish.com/snow-report/', note: 'MDT trucks and cameras cover US-93. Big Mountain Road is county-maintained and has no DOT feed.' }),
  // Bridger Bowl: OSM search 2026-10-15. Access: MT-86 (Bridger Canyon Road) 16 mi from Bozeman (bridgerbowl.com/getting-here).
  R({ name: 'Bridger Bowl', slug: 'bridger-bowl', state: 'MT', lat: 45.8163, lon: -110.9104, routes: ['MT-86', 'I-90'], road: 'MT-86, Bridger Canyon Road, 16 miles north of Bozeman', radius: 20, report: 'https://bridgerbowl.com/weather/snow-report', corridor: 'i-90' }),
  // Red Lodge Mountain: OSM search 2026-10-15. Access: US-212 to Red Lodge, then Ski Run Road (redlodgemountain.com/getting-here).
  R({ name: 'Red Lodge Mountain', slug: 'red-lodge', state: 'MT', lat: 45.1908, lon: -109.3369, routes: ['US-212'], road: 'US-212 into Red Lodge, then Ski Run Road for the last 6 miles', radius: 15, report: 'https://www.redlodgemountain.com/mountain/snow-report/' }),
  // Discovery Ski Area: OSM search 2026-10-15. Access: MT-1 (Pintler Scenic Route) from I-90 at Drummond
  // or Anaconda, then Discovery Basin Road at Georgetown Lake (skidiscovery.com/directions).
  R({ name: 'Discovery Ski Area', slug: 'discovery', state: 'MT', lat: 46.2637, lon: -113.2424, routes: ['MT-1', 'I-90'], road: 'MT-1 from I-90 at Drummond or from Anaconda, to Georgetown Lake', radius: 20, report: 'https://www.skidiscovery.com/snow-report', corridor: 'i-90' }),

  // ───────── Alaska (DOT&PF plows) ─────────
  // Alyeska: OSM search 2026-10-15. Access: Seward Highway (AK-1) 37 mi south of Anchorage, then Alyeska
  // Highway 3 mi (alyeskaresort.com/plan-your-trip/getting-here). Corpus spells it 'Seward Highway'.
  R({ name: 'Alyeska', slug: 'alyeska', state: 'AK', lat: 60.9703, lon: -149.0987, routes: ['Seward Highway', 'Alyeska Highway'], road: 'the Seward Highway along Turnagain Arm, then the Alyeska Highway into Girdwood', radius: 20, report: 'https://www.alyeskaresort.com/' }),

  // ───────── West Virginia (WVDOT plows) ─────────
  // Snowshoe: OSM search 2026-10-15. Access: US-219 to WV-66 at Slatyfork, then Snowshoe Drive (snowshoemtn.com/plan-your-trip/getting-here).
  R({ name: 'Snowshoe', slug: 'snowshoe', state: 'WV', lat: 38.4109, lon: -79.9908, routes: ['WV-66', 'US-219'], road: 'US-219 to Slatyfork, then WV-66 up the mountain', radius: 20, report: 'https://www.snowshoemtn.com/mountain-info/mountain-report' }),
  // Canaan Valley Resort: ski area. OSM reverse 2026-10-15. Access: WV-32 through Davis (canaanresort.com/directions).
  R({ name: 'Canaan Valley', slug: 'canaan-valley', state: 'WV', lat: 39.0336, lon: -79.4408, routes: ['WV-32', 'US-33'], road: 'WV-32 through Davis into Canaan Valley', radius: 15, report: 'https://www.canaanresort.com/' }),

  // ───────── Indiana (INDOT plows) ─────────
  // Perfect North Slopes: OSM search 2026-10-15. Access: I-275 exit 16 to IN-1 north (perfectnorth.com/directions).
  R({ name: 'Perfect North Slopes', slug: 'perfect-north', state: 'IN', lat: 39.1472, lon: -84.8873, routes: ['IN-1', 'I-275', 'I-74'], road: 'I-275 exit 16 at Lawrenceburg, then IN-1 north', radius: 12, report: 'https://perfectnorth.com/snow-report/' }),
  // Paoli Peaks: OSM search 2026-10-15. Access: US-150 and IN-56 at Paoli (paolipeaks.com/plan-your-trip/getting-here).
  R({ name: 'Paoli Peaks', slug: 'paoli-peaks', state: 'IN', lat: 38.5559, lon: -86.5122, routes: ['US-150', 'IN-56'], road: 'US-150 and IN-56 at Paoli', radius: 15, report: 'https://www.paolipeaks.com/the-mountain/mountain-report' }),

  // ───────── Iowa (Iowa DOT plows) ─────────
  // Sundown Mountain: OSM search 2026-10-15. Access: US-20 west of Dubuque, then Asbury Road (sundownmtn.com/directions).
  R({ name: 'Sundown Mountain', slug: 'sundown', state: 'IA', lat: 42.5165, lon: -90.8226, routes: ['US-20', 'US-52'], road: 'US-20 on the west side of Dubuque, then Asbury Road', radius: 12, report: 'https://sundownmtn.com/the-mountain/snow-report-trail-map/' }),

  // ───────── North Dakota (NDDOT plows) ─────────
  // Huff Hills: the hamlet of Huff on ND-1806 (OSM search 2026-10-15); the ski area is on ND-1806 beside it.
  // Access: ND-1806 south of Mandan, 15 mi (huffhills.com).
  R({ name: 'Huff Hills', slug: 'huff-hills', state: 'ND', lat: 46.6239, lon: -100.6518, routes: ['ND-1806', 'I-94'], road: 'ND-1806 south of Mandan, 15 miles', radius: 20, report: 'https://www.huffhills.com/', corridor: 'i-94' }),

  // ───────── Manitoba (Manitoba 511 plows, km) ─────────
  // Asessippi: OSM search 2026-10-15 ("Provincial Trunk Highway 83, Inglis"). Access: MB-83 north of Russell,
  // then MB-482 (asessippi.com/getting-here).
  R({ name: 'Asessippi', slug: 'asessippi', state: 'MB', lat: 50.9517, lon: -101.3395, routes: ['MB-83', 'MB-482', 'MB-16'], road: 'MB-83 north from Russell and the Yellowhead, then MB-482', radius: 25, report: 'https://asessippi.com/' }),

  // ───────── Washington (WSDOT publishes no truck positions) ─────────
  // WA corpus spells every route 'SR N' (SR 90 for I-90, SR 2 for US-2). WSDOT cameras and alerts use
  // I-90 / US 2 / SR 410, and WA route numbers are unique across types, so the page matches on the number.
  // Crystal Mountain: OSM search 2026-10-15. Access: SR 410 from Enumclaw, then Crystal Mountain
  // Boulevard 6 mi (crystalmountainresort.com/plan-your-trip/getting-here).
  R({ name: 'Crystal Mountain', slug: 'crystal-mountain', state: 'WA', lat: 46.9327, lon: -121.4877, routes: ['SR 410'], road: 'SR 410 from Enumclaw through Greenwater, then Crystal Mountain Boulevard', radius: 25, report: 'https://www.crystalmountainresort.com/the-mountain/mountain-report', pass: 'crystal-mountain', note: 'WSDOT cameras sit on SR 410 well below the resort; the last 6 miles up Crystal Mountain Boulevard have no DOT feed.' }),
  // The Summit at Snoqualmie: Summit West. OSM search 2026-10-15. Access: I-90 exits 52 to 54 (summitatsnoqualmie.com/getting-here).
  R({ name: 'The Summit at Snoqualmie', slug: 'summit-at-snoqualmie', state: 'WA', lat: 47.4208, lon: -121.4222, routes: ['SR 90'], road: 'I-90 at the top of Snoqualmie Pass, exits 52 to 54', radius: 15, report: 'https://www.summitatsnoqualmie.com/mountain-report', pass: 'snoqualmie', corridor: 'i-90' }),
  // Stevens Pass: base at the summit. OSM reverse 2026-10-15. Access: US 2 (stevenspass.com/plan-your-trip/getting-here.aspx).
  R({ name: 'Stevens Pass', slug: 'stevens-pass', state: 'WA', lat: 47.7448, lon: -121.0890, routes: ['SR 2'], road: 'US 2 at the top of Stevens Pass', radius: 15, report: 'https://www.stevenspass.com/the-mountain/mountain-conditions/snow-and-weather-report.aspx', pass: 'stevens' }),
  // Mt. Baker Ski Area: OSM search 2026-10-15. Access: SR 542, the Mt. Baker Highway, 56 mi from
  // Bellingham (mtbaker.us/getting-here).
  R({ name: 'Mt. Baker', slug: 'mt-baker', state: 'WA', lat: 48.8617, lon: -121.6538, routes: ['SR 542'], road: 'SR 542, the Mt. Baker Highway, 56 miles east of Bellingham', radius: 25, report: 'https://www.mtbaker.us/snow-report/' }),
  // White Pass: OSM search 2026-10-15. Access: US 12 at the summit (skiwhitepass.com/getting-here).
  R({ name: 'White Pass', slug: 'white-pass', state: 'WA', lat: 46.6213, lon: -121.3941, routes: ['SR 12'], road: 'US 12 at the top of White Pass, between Packwood and Naches', radius: 25, report: 'https://skiwhitepass.com/the-mountain/snow-report' }),
  // Mission Ridge: base. OSM reverse 2026-10-15. Access: US 2 / US 97 to Wenatchee, then Squilchuck Road
  // 12 mi (missionridge.com/getting-here).
  R({ name: 'Mission Ridge', slug: 'mission-ridge', state: 'WA', lat: 47.2928, lon: -120.3990, routes: ['SR 2', 'SR 97', 'SR 28'], road: 'US 2 or US 97 into Wenatchee, then Squilchuck Road (a county road) for 12 miles', radius: 20, report: 'https://www.missionridge.com/mountain-report/', note: 'WSDOT cameras cover the highways into Wenatchee. Squilchuck Road is county-maintained and has no DOT feed.' }),

  // ───────── Oregon (ODOT publishes no truck positions) ─────────
  // OR corpus uses ODOT highway names (MT HOOD HWY, etc.); TripCheck cameras and alerts use US-26 / OR-35.
  // Mt. Hood Meadows: base. OSM reverse 2026-10-15. Access: OR-35 from Hood River or US-26 to OR-35
  // (skihood.com/plan-your-trip/getting-here).
  R({ name: 'Mt. Hood Meadows', slug: 'mt-hood-meadows', state: 'OR', lat: 45.3317, lon: -121.6647, routes: ['OR-35', 'US-26'], road: 'OR-35, from Hood River or from US-26 at the Government Camp junction', radius: 20, report: 'https://www.skihood.com/mountain-report' }),
  // Timberline: Timberline Lodge. OSM search 2026-10-15. Access: US-26 to Government Camp, then Timberline
  // Road 6 mi (timberlinelodge.com/directions).
  R({ name: 'Timberline', slug: 'timberline', state: 'OR', lat: 45.3311, lon: -121.7118, routes: ['US-26', 'OR-35'], road: 'US-26 to Government Camp, then Timberline Road for the last 6 miles', radius: 20, report: 'https://timberlinelodge.com/conditions/' }),
  // Mt. Bachelor: West Village base. OSM reverse 2026-10-15. Access: US-97 to Bend, then Century Drive
  // (OR-372, Cascade Lakes Highway) 22 mi (mtbachelor.com/plan-your-trip/getting-here).
  R({ name: 'Mt. Bachelor', slug: 'mt-bachelor', state: 'OR', lat: 43.9904, lon: -121.6838, routes: ['OR-372', 'US-97'], road: 'US-97 to Bend, then Century Drive (OR-372) for 22 miles', radius: 25, report: 'https://www.mtbachelor.com/the-mountain/mountain-report/', note: 'TripCheck cameras cover US-97 and one point on Century Drive. The rest of the Cascade Lakes Highway has no DOT feed.' }),
  // Anthony Lakes: OSM search 2026-10-15 (44.9600,-118.2400). Access: I-84 exit 285 at North Powder, OR-237 for 4 mi,
  // then the Anthony Lake Highway / Forest Road 73 for 16 mi (anthonylakes.com; same facts as passes/anthony-lakes/).
  // The pass page for the same road already exists; the resort's report is "Bert's Daily Report".
  R({ name: 'Anthony Lakes', slug: 'anthony-lakes', state: 'OR', lat: 44.9600, lon: -118.2400, routes: ['I-84', 'OR-237'], road: 'I-84 exit 285 at North Powder, OR-237 for 4 miles, then the Anthony Lake Highway for 16', radius: 20, report: 'https://anthonylakes.com/berts-daily-report/', pass: 'anthony-lakes', note: 'ODOT cameras and alerts stop at I-84 and OR-237 near North Powder. The Anthony Lake Highway and Forest Road 73, the last 16 miles, are county and Forest Service roads with no DOT feed.' }),
  // Hoodoo: OSM search 2026-10-15. Access: US-20 at Santiam Pass (skihoodoo.com/directions).
  R({ name: 'Hoodoo', slug: 'hoodoo', state: 'OR', lat: 44.4034, lon: -121.8818, routes: ['US-20', 'OR-22', 'OR-126'], road: 'US-20 at the top of Santiam Pass', radius: 20, report: 'https://hoodoo.com/the-mountain/mountain-conditions/' }),
];
