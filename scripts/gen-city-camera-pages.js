// Generates /cameras/<city-slug>/index.html for each metro — a live map of that
// city's traffic cameras + SEO content, targeting "[city] traffic cameras / traffic".
// Proximity-filtered around the metro center. Run: node scripts/gen-city-camera-pages.js
const fs = require('fs');
const path = require('path');
const SPON = require('./lib/sponsor-slot');
// Pages that also exist in Spanish (scripts/gen-es-camera-pages.mjs); keep the two lists equal.
const ES_PAGES = new Set(['florida', 'miami', 'orlando', 'tampa']);
const PT_PAGES = new Set(['florida', 'orlando']); // Brazilian Portuguese versions (2026-09-25) // one sponsor slot above the map (2026-09-15)

// state slug map (for cross-linking to the state camera page)
const STATE_SLUG = {WA:'washington',OR:'oregon',CA:'california',UT:'utah',MT:'montana',AZ:'arizona',NV:'nevada',OH:'ohio',WI:'wisconsin',NY:'new-york',PA:'pennsylvania',GA:'georgia',LA:'louisiana',SC:'south-carolina',FL:'florida',MI:'michigan',AL:'alabama',SD:'south-dakota',AK:'alaska',ME:'maine',NH:'new-hampshire',VT:'vermont',TX:'texas',BC:'british-columbia',IL:'illinois',CO:'colorado',MA:'massachusetts',MN:'minnesota',IN:'indiana',NC:'north-carolina',KY:'kentucky',NM:'new-mexico',ID:'idaho',NE:'nebraska',VA:'virginia',CT:'connecticut',RI:'rhode-island',IA:'iowa',KS:'kansas',ON:'ontario',AB:'alberta',HI:'hawaii',OK:'oklahoma',AR:'arkansas',MS:'mississippi',ND:'north-dakota',WY:'wyoming',QC:'quebec',TN:'tennessee',MO:'missouri',MD:'maryland',DE:'delaware',WV:'west-virginia'};
const STATE_NAME = {WA:'Washington',OR:'Oregon',CA:'California',UT:'Utah',MT:'Montana',AZ:'Arizona',NV:'Nevada',OH:'Ohio',WI:'Wisconsin',NY:'New York',PA:'Pennsylvania',GA:'Georgia',LA:'Louisiana',SC:'South Carolina',FL:'Florida',MI:'Michigan',AL:'Alabama',SD:'South Dakota',AK:'Alaska',ME:'Maine',NH:'New Hampshire',VT:'Vermont',TX:'Texas',BC:'British Columbia',IL:'Illinois',CO:'Colorado',MA:'Massachusetts',MN:'Minnesota',IN:'Indiana',NC:'North Carolina',KY:'Kentucky',NM:'New Mexico',ID:'Idaho',NE:'Nebraska',VA:'Virginia',CT:'Connecticut',RI:'Rhode Island',IA:'Iowa',KS:'Kansas',ON:'Ontario',AB:'Alberta',HI:'Hawaii',OK:'Oklahoma',AR:'Arkansas',MS:'Mississippi',ND:'North Dakota',WY:'Wyoming',QC:'Québec',TN:'Tennessee',MO:'Missouri',MD:'Maryland',DE:'Delaware',WV:'West Virginia'};

const CITIES = [
  { slug:'seattle', name:'Seattle', state:'WA', dot:'WSDOT', lat:47.606, lon:-122.332, r:45,
    h1:'Seattle area traffic cameras, live',
    desc:'Watch live Seattle area traffic cameras on one map. These are WSDOT freeway and highway cameras within about 28 miles of downtown, each tagged with route and mile marker. See traffic before you leave.',
    title:'Seattle Area Traffic Cameras — Live WSDOT Cams | MileCheck', // 10/29: the page is filtered to a 45 km radius of downtown, not statewide; "Area" says so (Leah, TODO 10/21)
    blurb:`Seattle's freeways are among the most congested in the country, and WSDOT watches them with a dense camera network across the metro and the floating bridges.`,
    freeways:`Watch <a href="../../corridors/i-5/">I-5</a> through downtown, <a href="../../corridors/i-90/">I-90</a> and SR-520 across Lake Washington, and I-405 on the Eastside.` },
  { slug:'portland', name:'Portland', state:'OR', dot:'ODOT', lat:45.52, lon:-122.68, r:40,
    blurb:`Portland's ODOT TripCheck cameras cover the metro freeways and the Columbia River crossings into Washington.`,
    // "odot cameras" splits Oregon and Ohio searchers (GSC 2026-10-08), so point the other way.
    crossLinkHtml:'<p class="sub" style="font-size:14px">Looking for Ohio\'s ODOT cameras? <a href="https://milecheckapp.com/cameras/ohio/">View the Ohio camera map</a>.</p>',
    freeways:`Watch <a href="../../corridors/i-5/">I-5</a> and I-405 through the core, I-84 up the Columbia Gorge, and I-205 on the east side.`,
    // 2026-09-26: splits the ambiguous "odot cameras" query with the Ohio page
    // (Ohio DOT vs Oregon DOT). Title now says "Oregon" explicitly instead of
    // just "ODOT" so Google stops blending the two. Per docs/emails/
    // chatgpt-brief-camera-page-titles-2026-09-26.md, approved by Leah.
    title:'Portland ODOT Cameras | MileCheck',
    desc:'View ODOT cameras around Portland, Oregon, on a traffic map. Browse highway camera locations and available images.',
    sub:'View Oregon Department of Transportation (ODOT) TripCheck cameras around Portland on one map. Each is tagged with its route and mile marker — tap any camera for the latest image.' },
  { slug:'los-angeles', name:'Los Angeles', state:'CA', dot:'Caltrans', lat:34.05, lon:-118.24, r:60,
    blurb:`Los Angeles has the most-watched freeway network in America, and Caltrans covers it with hundreds of live cameras across the basin.`,
    freeways:`Watch <a href="../../corridors/i-5/">I-5</a>, <a href="../../corridors/i-10/">I-10</a>, I-405, US-101, and I-110 — plus <a href="../../passes/grapevine/">the Grapevine</a> on I-5 to the north and <a href="../../passes/cajon/">Cajon Pass</a> on I-15 to the northeast.` },
  { slug:'san-francisco', name:'San Francisco Bay Area', state:'CA', dot:'Caltrans', lat:37.77, lon:-122.24, r:55,
    blurb:`The Bay Area's freeways and bridges are heavily instrumented by Caltrans, from the Bay Bridge to the South Bay.`,
    freeways:`Watch <a href="../../corridors/i-80/">I-80</a> over the Bay Bridge, US-101 and I-280 down the Peninsula, and I-580, I-680, and I-880 in the East Bay.` },
  { slug:'sacramento', name:'Sacramento', state:'CA', dot:'Caltrans', lat:38.58, lon:-121.49, r:45,
    blurb:`Sacramento sits at the crossroads of two major interstates, and Caltrans covers the metro freeways and the causeway across the Yolo Bypass.`,
    freeways:`Watch <a href="../../corridors/i-5/">I-5</a> and <a href="../../corridors/i-80/">I-80</a> through the city, US-50 toward Lake Tahoe, and CA-99 down the valley.` },
  { slug:'san-diego', name:'San Diego', state:'CA', dot:'Caltrans', lat:32.72, lon:-117.16, r:45,
    blurb:`San Diego's Caltrans cameras cover the metro freeways from the border to North County.`,
    freeways:`Watch <a href="../../corridors/i-5/">I-5</a> along the coast, I-8 east toward the mountains, <a href="../../corridors/i-15/">I-15</a> inland, and I-805 through the core.` },
  { slug:'las-vegas', name:'Las Vegas', state:'NV', dot:'NDOT', lat:36.17, lon:-115.14, r:45,
    blurb:`Las Vegas traffic runs on the Spaghetti Bowl and the 215 Beltway, and NDOT's NVRoads cameras cover the valley.`,
    freeways:`Watch <a href="../../corridors/i-15/">I-15</a> through the Strip, US-95 (the "95"), I-11 toward the dam, and the CC-215 Beltway.` },
  { slug:'phoenix', name:'Phoenix', state:'AZ', dot:'ADOT', lat:33.45, lon:-112.07, r:55,
    blurb:`Phoenix's ADOT/AZ511 cameras cover the Valley's freeway system, including the Loop network and the interstate crossings.`,
    freeways:`Watch <a href="../../corridors/i-10/">I-10</a> and I-17 through the core, plus Loop 101 and Loop 202 around the Valley.` },
  { slug:'salt-lake-city', name:'Salt Lake City', state:'UT', dot:'UDOT', lat:40.76, lon:-111.89, r:45,
    blurb:`Salt Lake City's UDOT cameras cover the Wasatch Front freeways and the canyons up to the ski areas.`,
    freeways:`Watch <a href="../../corridors/i-15/">I-15</a> up the Wasatch Front, <a href="../../corridors/i-80/">I-80</a> through <a href="../../passes/parleys/">Parleys Canyon</a>, the I-215 belt, and the Cottonwood canyon roads.` },
  { slug:'atlanta', name:'Atlanta', state:'GA', dot:'GDOT', lat:33.75, lon:-84.39, r:50,
    blurb:`Atlanta has one of the largest camera networks in the Southeast, covering the Connector, the Perimeter, and every metro interstate.`,
    freeways:`Watch <a href="../../corridors/i-75/">I-75</a> and I-85 through the Downtown Connector, the I-285 Perimeter, and I-20 east–west.` },
  { slug:'orlando', name:'Orlando', state:'FL', dot:'FDOT', lat:28.54, lon:-81.38, r:45,
    blurb:`Orlando traffic centers on I-4 and the toll roads, all covered by FDOT's FL511 cameras.`,
    freeways:`Watch <a href="../../corridors/i-4/">I-4</a> through the core and the attractions, plus the 408, 417, and 429 toll roads and Florida's Turnpike.` },
  { slug:'tampa', name:'Tampa', state:'FL', dot:'FDOT', lat:27.95, lon:-82.46, r:45,
    blurb:`Tampa Bay's FDOT cameras cover the interstates, the bay crossings, and the Selmon Expressway.`,
    freeways:`Watch <a href="../../corridors/i-4/">I-4</a> east toward Orlando, I-275 across the bay, <a href="../../corridors/i-75/">I-75</a> to the east, and the Selmon Expressway.` },
  { slug:'miami', name:'Miami', state:'FL', dot:'FDOT', lat:25.77, lon:-80.19, r:50,
    blurb:`South Florida's FDOT cameras cover the Miami metro freeways and expressways, some of the busiest in the state.`,
    freeways:`Watch <a href="../../corridors/i-95/">I-95</a> up the coast, <a href="../../corridors/i-75/">I-75</a> and "Alligator Alley" west, the Palmetto (826), and the Dolphin (836).` },
  { slug:'detroit', name:'Detroit', state:'MI', dot:'MDOT', lat:42.33, lon:-83.05, r:50,
    blurb:`Metro Detroit's MDOT "Mi Drive" cameras cover the freeway network across the region.`,
    freeways:`Watch <a href="../../corridors/i-75/">I-75</a>, <a href="../../corridors/i-94/">I-94</a>, and I-96 through the metro, I-696 across the north, and the Lodge (M-10).` },
  { slug:'columbus', name:'Columbus', state:'OH', dot:'ODOT', lat:39.96, lon:-82.99, r:40,
    blurb:`Columbus traffic runs on the interstates and the Outerbelt, all covered by Ohio DOT's OHGO cameras.`,
    freeways:`Watch I-70 and I-71 through the split downtown, plus the I-270 Outerbelt around the metro.` },
  { slug:'cleveland', name:'Cleveland', state:'OH', dot:'ODOT', lat:41.50, lon:-81.69, r:40,
    blurb:`Cleveland's OHGO cameras cover the lakefront freeways and the interchanges, where lake-effect snow is the winter concern.`,
    freeways:`Watch <a href="../../corridors/i-90/">I-90</a> along the lake, I-71 and I-77 south, and I-480 across the south side.` },
  { slug:'cincinnati', name:'Cincinnati', state:'OH', dot:'ODOT', lat:39.10, lon:-84.51, r:40,
    blurb:`Cincinnati's OHGO cameras cover the Ohio River crossings and the metro interstates.`,
    freeways:`Watch I-71 and <a href="../../corridors/i-75/">I-75</a> through the core and over the river, I-74 to the west, and the I-275 loop.` },
  { slug:'milwaukee', name:'Milwaukee', state:'WI', dot:'WisDOT', lat:43.04, lon:-87.91, r:40,
    blurb:`Milwaukee's WisDOT 511WI cameras cover the metro freeways and the Marquette Interchange.`,
    freeways:`Watch <a href="../../corridors/i-94/">I-94</a> and I-43 through downtown, the Marquette Interchange, and I-894 on the bypass.` },
  { slug:'pittsburgh', name:'Pittsburgh', state:'PA', dot:'PennDOT', lat:40.44, lon:-79.99, r:40,
    blurb:`Pittsburgh's freeways thread the rivers and tunnels, all covered by PennDOT's 511PA cameras.`,
    freeways:`Watch I-376 (the Parkway) and the Fort Pitt Tunnel, I-79 to the west, and I-279 to the north.` },
  { slug:'philadelphia', name:'Philadelphia', state:'PA', dot:'PennDOT', lat:39.95, lon:-75.16, r:45,
    blurb:`Philadelphia's 511PA cameras cover the Schuylkill, I-95, and the metro expressways.`,
    freeways:`Watch <a href="../../corridors/i-95/">I-95</a> along the Delaware, I-76 (the Schuylkill Expressway), and the Vine Street Expressway (I-676).` },
  { slug:'new-york-city', name:'New York City', state:'NY', dot:'NYSDOT', lat:40.71, lon:-74.01, r:45,
    blurb:`New York City's NYSDOT 511NY cameras cover the expressways, bridges, and tunnels across the five boroughs and into the suburbs.`,
    freeways:`Watch <a href="../../corridors/i-95/">I-95</a> (the Cross Bronx), I-495 (the LIE), I-278 (the BQE), and the major bridge and tunnel crossings.` },
  { slug:'new-orleans', name:'New Orleans', state:'LA', dot:'DOTD', lat:29.95, lon:-90.07, r:40,
    blurb:`New Orleans traffic runs on I-10 and the lake crossings, covered by Louisiana DOTD's 511LA cameras.`,
    freeways:`Watch <a href="../../corridors/i-10/">I-10</a> through the metro and over the swamps, I-610 across the city, and US-90 (the "high-rise").` },
  { slug:'birmingham', name:'Birmingham', state:'AL', dot:'ALDOT', lat:33.52, lon:-86.80, r:40,
    blurb:`Birmingham's ALDOT/ALGO Traffic cameras cover the interstate crossings and the metro loop.`,
    freeways:`Watch I-65 north–south, I-20 and I-59 through the core, and the I-459 loop around the south.` },
  { slug:'buffalo', name:'Buffalo', state:'NY', dot:'NYSDOT', lat:42.89, lon:-78.88, r:40,
    blurb:`Buffalo's 511NY cameras cover the metro freeways, where lake-effect snow off Lake Erie is the winter story.`,
    freeways:`Watch <a href="../../corridors/i-90/">I-90</a> (the Thruway), I-190 to the Peace Bridge, I-290, and the Kensington (NY-33).` },
  // City (municipal) camera pages (2026-11-05). The state or provincial feed draws the highway cameras like every
  // other metro; the city's own street cameras are added by scripts/add-city-cameras.mjs (CITY_LAYERS there).
  { slug:'austin', name:'Austin', state:'TX', dot:'TxDOT', lat:30.27, lon:-97.74, r:40,
    title:'Austin Traffic Cameras | MileCheck', h1:'Austin traffic cameras', cityPage:true, cityLayer:true,
    desc:'Austin traffic cameras on one map. City of Austin street cameras at intersections plus TxDOT highway cameras on I-35, MoPac, US-183 and SH-71.',
    sub:'See Austin traffic before you leave. City of Austin intersection cameras and TxDOT highway cameras on one map. Tap any camera for the latest image.',
    blurb:`Austin Transportation and Public Works runs cameras at intersections across the city. TxDOT covers the highways.`,
    freeways:`Watch I-35 through downtown, Loop 1 (MoPac), US-183, US-290, SH-71 and the SH-130 and SH-45 toll roads.` },
  { slug:'surrey', name:'Surrey', state:'BC', dot:'DriveBC', lat:49.15, lon:-122.82, r:18,
    title:'Surrey Traffic Cameras | MileCheck', h1:'Surrey traffic cameras', cityPage:true, cityLayer:true,
    desc:'Surrey traffic cameras on one map. City of Surrey intersection cameras plus DriveBC highway cameras on Highway 1, 99, 10, 15 and 17.',
    sub:'See Surrey traffic before you leave. City of Surrey intersection cameras and DriveBC highway cameras on one map. Tap any camera for the latest image.',
    blurb:`The City of Surrey publishes its intersection cameras as open data. DriveBC covers the provincial highways through the city.`,
    freeways:`Watch Highway 1 and the Port Mann Bridge, Highway 99 to the Peace Arch crossing, Highway 15 to Pacific Highway, and Highways 10 and 17.` },
  { slug:'vancouver', name:'Vancouver', state:'BC', dot:'DriveBC', lat:49.26, lon:-123.10, r:22,
    title:'Vancouver Traffic Cameras | MileCheck', h1:'Vancouver traffic cameras', cityPage:true, cityLayer:true,
    desc:'Vancouver traffic cameras on one map. DriveBC highway camera images, plus City of Vancouver camera locations from the City\'s open data, each with a link to its view.',
    sub:'See Vancouver traffic before you leave. DriveBC highway camera images and City of Vancouver camera locations from the City\'s open data on one map. City cameras open on the City of Vancouver site.',
    blurb:`The City of Vancouver lists its traffic cameras as open data. Its images stay on the City's own site, so each city camera here links to that view. DriveBC covers the highways and bridges.`,
    freeways:`Watch Highway 1 and the Second Narrows (Ironworkers) Bridge, Highway 99 through the Massey crossing and the Lions Gate Bridge, and Highway 91.` },
  // Metro pages from feeds the Worker already serves (2026-11-06, Leah: "LETS PUT MORE CITIES"). Toronto and Calgary
  // also get the city's own cameras (scripts/add-city-cameras.mjs). anyRoute keeps cameras the agency gives no route.
  { slug:'toronto', name:'Toronto', state:'ON', dot:'Ontario 511', lat:43.7, lon:-79.4, r:40, anyRoute:true,
    title:'Toronto Traffic Cameras | MileCheck', h1:'Toronto traffic cameras', cityPage:true, cityLayer:true,
    desc:'Toronto traffic cameras on one map. City of Toronto cameras plus Ontario 511 highway cameras on Highway 401 and more.',
    sub:'See Toronto traffic before you leave. City of Toronto cameras and Ontario 511 highway cameras on one map. Tap any camera for the latest image.',
    blurb:`The City of Toronto publishes its traffic cameras as open data. Ontario 511 covers the highways.`,
    freeways:`Watch Highway 401, the QEW, Highways 400, 404 and 427, the Gardiner Expressway and the Don Valley Parkway.` },
  { slug:'calgary', name:'Calgary', state:'AB', dot:'511 Alberta', lat:51.05, lon:-114.07, r:30, anyRoute:true,
    title:'Calgary Traffic Cameras | MileCheck', h1:'Calgary traffic cameras', cityPage:true, cityLayer:true,
    desc:'Calgary traffic cameras on one map. City of Calgary cameras plus 511 Alberta highway cameras on Deerfoot Trail and more.',
    sub:'See Calgary traffic before you leave. City of Calgary cameras and 511 Alberta highway cameras on one map. Tap any camera for the latest image.',
    blurb:`The City of Calgary publishes its traffic cameras as open data. 511 Alberta covers the highways.`,
    freeways:`Watch Deerfoot Trail, Stoney Trail, Glenmore Trail, Crowchild Trail and Highway 1 (the Trans-Canada).` },
  { slug:'edmonton', name:'Edmonton', state:'AB', dot:'511 Alberta', lat:53.55, lon:-113.49, r:30, anyRoute:true,
    title:'Edmonton Traffic Cameras | MileCheck', h1:'Edmonton traffic cameras', cityPage:true,
    desc:'Edmonton traffic cameras on one map. 511 Alberta highway cameras on Anthony Henday Drive and other main roads, with the latest image from each.',
    sub:'See Edmonton traffic before you leave. 511 Alberta highway cameras around Edmonton on one map. Tap any camera for the latest image.',
    blurb:`511 Alberta runs the highway cameras around Edmonton.`,
    freeways:`Watch Anthony Henday Drive, the Yellowhead (Highway 16), Highway 2 (the QEII) and Whitemud Drive.` },
  { slug:'ottawa', name:'Ottawa', state:'ON', dot:'Ontario 511', lat:45.42, lon:-75.7, r:30,
    title:'Ottawa Traffic Cameras | MileCheck', h1:'Ottawa traffic cameras', cityPage:true,
    desc:'Ottawa traffic cameras on one map. Ontario 511 highway cameras on Highway 417 (the Queensway) and other main roads, with the latest image from each.',
    sub:'See Ottawa traffic before you leave. Ontario 511 highway cameras around Ottawa on one map. Tap any camera for the latest image.',
    blurb:`Ontario 511 runs the highway cameras around Ottawa.`,
    freeways:`Watch Highway 417 (the Queensway) and Highway 416.` },
  { slug:'chicago', name:'Chicago', state:'IL', dot:'IDOT', lat:41.88, lon:-87.63, r:50, anyRoute:true,
    title:'Chicago Traffic Cameras | MileCheck', h1:'Chicago traffic cameras', cityPage:true,
    desc:'Chicago traffic cameras on one map. IDOT cameras on I-90, I-94 and other Chicago-area highways, with the latest image from each.',
    sub:'See Chicago traffic before you leave. IDOT highway cameras around Chicago on one map. Tap any camera for the latest image.',
    blurb:`IDOT runs the highway cameras around Chicago.`,
    freeways:`Watch I-90 and I-94 (the Kennedy, Dan Ryan and Edens), I-290 (the Eisenhower), I-55 (the Stevenson), I-294 (the Tri-State) and I-88.` },
  { slug:'houston', name:'Houston', state:'TX', dot:'TxDOT', lat:29.76, lon:-95.37, r:55, anyRoute:true,
    title:'Houston Traffic Cameras | MileCheck', h1:'Houston traffic cameras', cityPage:true,
    desc:'Houston traffic cameras on one map. TxDOT highway cameras on I-10 (the Katy Freeway) and other main roads, with the latest image from each.',
    sub:'See Houston traffic before you leave. TxDOT highway cameras around Houston on one map. Tap any camera for the latest image.',
    blurb:`TxDOT runs the highway cameras around Houston.`,
    freeways:`Watch I-10 (the Katy Freeway), I-45, I-69 and US-59, the I-610 Loop and Beltway 8.` },
  { slug:'dallas', name:'Dallas', state:'TX', dot:'TxDOT', lat:32.78, lon:-96.8, r:45,
    title:'Dallas Traffic Cameras | MileCheck', h1:'Dallas traffic cameras', cityPage:true,
    desc:'Dallas traffic cameras on one map. TxDOT highway cameras on I-35E and other main roads, with the latest image from each.',
    sub:'See Dallas traffic before you leave. TxDOT highway cameras around Dallas on one map. Tap any camera for the latest image.',
    blurb:`TxDOT runs the highway cameras around Dallas.`,
    freeways:`Watch I-35E, I-30, I-635 (LBJ), I-45, US-75 (Central Expressway) and the President George Bush Turnpike.` },
  { slug:'san-antonio', name:'San Antonio', state:'TX', dot:'TxDOT', lat:29.42, lon:-98.49, r:40,
    title:'San Antonio Traffic Cameras | MileCheck', h1:'San Antonio traffic cameras', cityPage:true,
    desc:'San Antonio traffic cameras on one map. TxDOT highway cameras on I-10 and other main roads, with the latest image from each.',
    sub:'See San Antonio traffic before you leave. TxDOT highway cameras around San Antonio on one map. Tap any camera for the latest image.',
    blurb:`TxDOT runs the highway cameras around San Antonio.`,
    freeways:`Watch I-10, I-35, Loop 410, Loop 1604 and US-281.` },
  { slug:'denver', name:'Denver', state:'CO', dot:'CDOT', lat:39.74, lon:-104.99, r:45,
    title:'Denver Traffic Cameras | MileCheck', h1:'Denver traffic cameras', cityPage:true,
    desc:'Denver traffic cameras on one map. CDOT highway cameras on I-25 and other main roads, with the latest image from each.',
    sub:'See Denver traffic before you leave. CDOT highway cameras around Denver on one map. Tap any camera for the latest image.',
    blurb:`CDOT runs the highway cameras around Denver.`,
    freeways:`Watch I-25, I-70, I-225, I-270, C-470 and E-470.` },
  { slug:'boston', name:'Boston', state:'MA', dot:'MassDOT', lat:42.36, lon:-71.06, r:40,
    title:'Boston Traffic Cameras | MileCheck', h1:'Boston traffic cameras', cityPage:true,
    desc:'Boston traffic cameras on one map. MassDOT highway cameras on I-93 and other main roads, with the latest image from each.',
    sub:'See Boston traffic before you leave. MassDOT highway cameras around Boston on one map. Tap any camera for the latest image.',
    blurb:`MassDOT runs the highway cameras around Boston.`,
    freeways:`Watch I-93, I-90 (the Mass Pike), I-95 and Route 128, and Route 1.` },
  { slug:'minneapolis', name:'Minneapolis', state:'MN', dot:'MnDOT', lat:44.98, lon:-93.27, r:45,
    title:'Minneapolis Traffic Cameras | MileCheck', h1:'Minneapolis traffic cameras', cityPage:true,
    desc:'Minneapolis traffic cameras on one map. MnDOT highway cameras on I-35W and I-35E and other main roads, with the latest image from each.',
    sub:'See Minneapolis traffic before you leave. MnDOT highway cameras around Minneapolis on one map. Tap any camera for the latest image.',
    blurb:`MnDOT runs the highway cameras around Minneapolis.`,
    freeways:`Watch I-35W and I-35E, I-94, I-394, I-494 and I-694.` },
  { slug:'indianapolis', name:'Indianapolis', state:'IN', dot:'INDOT', lat:39.77, lon:-86.16, r:40,
    title:'Indianapolis Traffic Cameras | MileCheck', h1:'Indianapolis traffic cameras', cityPage:true,
    desc:'Indianapolis traffic cameras on one map. INDOT highway cameras on I-65 and other main roads, with the latest image from each.',
    sub:'See Indianapolis traffic before you leave. INDOT highway cameras around Indianapolis on one map. Tap any camera for the latest image.',
    blurb:`INDOT runs the highway cameras around Indianapolis.`,
    freeways:`Watch I-65, I-69, I-70, I-74 and the I-465 loop.` },
  { slug:'charlotte', name:'Charlotte', state:'NC', dot:'NCDOT', lat:35.23, lon:-80.84, r:40,
    title:'Charlotte Traffic Cameras | MileCheck', h1:'Charlotte traffic cameras', cityPage:true,
    desc:'Charlotte traffic cameras on one map. NCDOT highway cameras on I-77 and other main roads, with the latest image from each.',
    sub:'See Charlotte traffic before you leave. NCDOT highway cameras around Charlotte on one map. Tap any camera for the latest image.',
    blurb:`NCDOT runs the highway cameras around Charlotte.`,
    freeways:`Watch I-77, I-85, I-277 and the I-485 loop.` },
  { slug:'raleigh', name:'Raleigh', state:'NC', dot:'NCDOT', lat:35.78, lon:-78.64, r:35,
    title:'Raleigh Traffic Cameras | MileCheck', h1:'Raleigh traffic cameras', cityPage:true,
    desc:'Raleigh traffic cameras on one map. NCDOT highway cameras on I-40 and other main roads, with the latest image from each.',
    sub:'See Raleigh traffic before you leave. NCDOT highway cameras around Raleigh on one map. Tap any camera for the latest image.',
    blurb:`NCDOT runs the highway cameras around Raleigh.`,
    freeways:`Watch I-40, I-440 (the Beltline), I-540, I-87 and US-1.` },
  { slug:'jacksonville', name:'Jacksonville', state:'FL', dot:'FDOT', lat:30.33, lon:-81.66, r:40,
    title:'Jacksonville Traffic Cameras | MileCheck', h1:'Jacksonville traffic cameras', cityPage:true,
    desc:'Jacksonville traffic cameras on one map. FDOT highway cameras on I-95 and other main roads, with the latest image from each.',
    sub:'See Jacksonville traffic before you leave. FDOT highway cameras around Jacksonville on one map. Tap any camera for the latest image.',
    blurb:`FDOT runs the highway cameras around Jacksonville.`,
    freeways:`Watch I-95, I-10 and I-295.` },
  { slug:'fort-lauderdale', name:'Fort Lauderdale', state:'FL', dot:'FDOT', lat:26.12, lon:-80.14, r:30, anyRoute:true,
    title:'Fort Lauderdale Traffic Cameras | MileCheck', h1:'Fort Lauderdale traffic cameras', cityPage:true,
    desc:'Fort Lauderdale traffic cameras on one map. FDOT highway cameras on I-95 and other main roads, with the latest image from each.',
    sub:'See Fort Lauderdale traffic before you leave. FDOT highway cameras around Fort Lauderdale on one map. Tap any camera for the latest image.',
    blurb:`FDOT runs the highway cameras around Fort Lauderdale.`,
    freeways:`Watch I-95, I-595, I-75, Florida's Turnpike and the Sawgrass Expressway.` },
  { slug:'louisville', name:'Louisville', state:'KY', dot:'KYTC', lat:38.25, lon:-85.76, r:35,
    title:'Louisville Traffic Cameras | MileCheck', h1:'Louisville traffic cameras', cityPage:true,
    desc:'Louisville traffic cameras on one map. KYTC highway cameras on I-64 and other main roads, with the latest image from each.',
    sub:'See Louisville traffic before you leave. KYTC highway cameras around Louisville on one map. Tap any camera for the latest image.',
    blurb:`KYTC runs the highway cameras around Louisville.`,
    freeways:`Watch I-64, I-65, I-71, I-264 (the Watterson) and I-265 (the Gene Snyder).` },
  { slug:'albuquerque', name:'Albuquerque', state:'NM', dot:'NMDOT', lat:35.08, lon:-106.65, r:35,
    title:'Albuquerque Traffic Cameras | MileCheck', h1:'Albuquerque traffic cameras', cityPage:true,
    desc:'Albuquerque traffic cameras on one map. NMDOT highway cameras on I-25 and other main roads, with the latest image from each.',
    sub:'See Albuquerque traffic before you leave. NMDOT highway cameras around Albuquerque on one map. Tap any camera for the latest image.',
    blurb:`NMDOT runs the highway cameras around Albuquerque.`,
    freeways:`Watch I-25, I-40 and the Big I interchange where they meet.` },
  { slug:'tucson', name:'Tucson', state:'AZ', dot:'ADOT', lat:32.22, lon:-110.97, r:35,
    title:'Tucson Traffic Cameras | MileCheck', h1:'Tucson traffic cameras', cityPage:true,
    desc:'Tucson traffic cameras on one map. ADOT highway cameras on I-10 and I-19 and other main roads, with the latest image from each.',
    sub:'See Tucson traffic before you leave. ADOT highway cameras around Tucson on one map. Tap any camera for the latest image.',
    blurb:`ADOT runs the highway cameras around Tucson.`,
    freeways:`Watch I-10 and I-19.` },
  { slug:'spokane', name:'Spokane', state:'WA', dot:'WSDOT', lat:47.66, lon:-117.43, r:30,
    title:'Spokane Traffic Cameras | MileCheck', h1:'Spokane traffic cameras', cityPage:true,
    desc:'Spokane traffic cameras on one map. WSDOT highway cameras on I-90 and other main roads, with the latest image from each.',
    sub:'See Spokane traffic before you leave. WSDOT highway cameras around Spokane on one map. Tap any camera for the latest image.',
    blurb:`WSDOT runs the highway cameras around Spokane.`,
    freeways:`Watch I-90, US-395 and US-2.` },
  { slug:'tacoma', name:'Tacoma', state:'WA', dot:'WSDOT', lat:47.25, lon:-122.44, r:20,
    title:'Tacoma Traffic Cameras | MileCheck', h1:'Tacoma traffic cameras', cityPage:true,
    desc:'Tacoma traffic cameras on one map. WSDOT highway cameras on I-5 and other main roads, with the latest image from each.',
    sub:'See Tacoma traffic before you leave. WSDOT highway cameras around Tacoma on one map. Tap any camera for the latest image.',
    blurb:`WSDOT runs the highway cameras around Tacoma.`,
    freeways:`Watch I-5, SR-16 and the Tacoma Narrows Bridge, SR-167 and I-705.` },
  { slug:'boise', name:'Boise', state:'ID', dot:'ITD', lat:43.62, lon:-116.2, r:30, anyRoute:true,
    title:'Boise Traffic Cameras | MileCheck', h1:'Boise traffic cameras', cityPage:true,
    desc:'Boise traffic cameras on one map. ITD highway cameras on I-84 and other main roads, with the latest image from each.',
    sub:'See Boise traffic before you leave. ITD highway cameras around Boise on one map. Tap any camera for the latest image.',
    blurb:`ITD runs the highway cameras around Boise.`,
    freeways:`Watch I-84, I-184 (the Connector) and US-20/26.` },
  { slug:'omaha', name:'Omaha', state:'NE', dot:'Nebraska DOT', lat:41.26, lon:-95.94, r:30,
    title:'Omaha Traffic Cameras | MileCheck', h1:'Omaha traffic cameras', cityPage:true,
    desc:'Omaha traffic cameras on one map. Nebraska DOT highway cameras on I-80 and other main roads, with the latest image from each.',
    sub:'See Omaha traffic before you leave. Nebraska DOT highway cameras around Omaha on one map. Tap any camera for the latest image.',
    blurb:`Nebraska DOT runs the highway cameras around Omaha.`,
    freeways:`Watch I-80, I-480, I-680 and US-75.` },
  { slug:'richmond', name:'Richmond', state:'VA', dot:'VDOT', lat:37.54, lon:-77.44, r:35,
    title:'Richmond Traffic Cameras | MileCheck', h1:'Richmond traffic cameras', cityPage:true,
    desc:'Richmond traffic cameras on one map. VDOT highway cameras on I-95 and other main roads, with the latest image from each.',
    sub:'See Richmond traffic before you leave. VDOT highway cameras around Richmond on one map. Tap any camera for the latest image.',
    blurb:`VDOT runs the highway cameras around Richmond.`,
    freeways:`Watch I-95, I-64, I-195, I-295 and VA-288.` },
  { slug:'hampton-roads', name:'Hampton Roads', state:'VA', dot:'VDOT', lat:36.85, lon:-76.29, r:40,
    title:'Hampton Roads Traffic Cameras | MileCheck', h1:'Hampton Roads traffic cameras', cityPage:true,
    desc:'Hampton Roads traffic cameras on one map. VDOT highway cameras on I-64 and other main roads, with the latest image from each.',
    sub:'See Hampton Roads traffic before you leave. VDOT highway cameras around Hampton Roads on one map. Tap any camera for the latest image.',
    blurb:`VDOT runs the highway cameras around Hampton Roads.`,
    freeways:`Watch I-64, I-264, I-464 and I-664, the Hampton Roads Bridge-Tunnel and the Monitor-Merrimac Bridge-Tunnel.` },
  { slug:'hartford', name:'Hartford', state:'CT', dot:'CTDOT', lat:41.76, lon:-72.68, r:30,
    title:'Hartford Traffic Cameras | MileCheck', h1:'Hartford traffic cameras', cityPage:true,
    desc:'Hartford traffic cameras on one map. CTDOT highway cameras on I-84 and other main roads, with the latest image from each.',
    sub:'See Hartford traffic before you leave. CTDOT highway cameras around Hartford on one map. Tap any camera for the latest image.',
    blurb:`CTDOT runs the highway cameras around Hartford.`,
    freeways:`Watch I-84, I-91, I-291 and I-384.` },
  { slug:'providence', name:'Providence', state:'RI', dot:'RIDOT', lat:41.82, lon:-71.41, r:25, anyRoute:true,
    title:'Providence Traffic Cameras | MileCheck', h1:'Providence traffic cameras', cityPage:true,
    desc:'Providence traffic cameras on one map. RIDOT highway cameras on I-95 and other main roads, with the latest image from each.',
    sub:'See Providence traffic before you leave. RIDOT highway cameras around Providence on one map. Tap any camera for the latest image.',
    blurb:`RIDOT runs the highway cameras around Providence.`,
    freeways:`Watch I-95, I-195, I-295, US-6 and RI-146.` },
  { slug:'reno', name:'Reno', state:'NV', dot:'NDOT', lat:39.53, lon:-119.81, r:30,
    title:'Reno Traffic Cameras | MileCheck', h1:'Reno traffic cameras', cityPage:true,
    desc:'Reno traffic cameras on one map. NDOT highway cameras on I-80 and other main roads, with the latest image from each.',
    sub:'See Reno traffic before you leave. NDOT highway cameras around Reno on one map. Tap any camera for the latest image.',
    blurb:`NDOT runs the highway cameras around Reno.`,
    freeways:`Watch I-80, I-580 and US-395.` },
  { slug:'el-paso', name:'El Paso', state:'TX', dot:'TxDOT', lat:31.76, lon:-106.49, r:35, anyRoute:true,
    title:'El Paso Traffic Cameras | MileCheck', h1:'El Paso traffic cameras', cityPage:true,
    desc:'El Paso traffic cameras on one map. TxDOT highway cameras on I-10 and other main roads, with the latest image from each.',
    sub:'See El Paso traffic before you leave. TxDOT highway cameras around El Paso on one map. Tap any camera for the latest image.',
    blurb:`TxDOT runs the highway cameras around El Paso.`,
    freeways:`Watch I-10, US-54 (the Patriot Freeway) and Loop 375.` },
  { slug:'fresno', name:'Fresno', state:'CA', dot:'Caltrans', lat:36.74, lon:-119.79, r:40,
    title:'Fresno Traffic Cameras | MileCheck', h1:'Fresno traffic cameras', cityPage:true,
    desc:'Fresno traffic cameras on one map. Caltrans highway cameras on CA-99 and other main roads, with the latest image from each.',
    sub:'See Fresno traffic before you leave. Caltrans highway cameras around Fresno on one map. Tap any camera for the latest image.',
    blurb:`Caltrans runs the highway cameras around Fresno.`,
    freeways:`Watch CA-99, CA-41, CA-168 and CA-180.` },
  { slug:'des-moines', name:'Des Moines', state:'IA', dot:'Iowa DOT', lat:41.59, lon:-93.62, r:30,
    title:'Des Moines Traffic Cameras | MileCheck', h1:'Des Moines traffic cameras', cityPage:true,
    desc:'Des Moines traffic cameras on one map. Iowa DOT highway cameras on I-35 and other main roads, with the latest image from each.',
    sub:'See Des Moines traffic before you leave. Iowa DOT highway cameras around Des Moines on one map. Tap any camera for the latest image.',
    blurb:`Iowa DOT runs the highway cameras around Des Moines.`,
    freeways:`Watch I-35, I-80 and I-235.` },
  { slug:'grand-rapids', name:'Grand Rapids', state:'MI', dot:'MDOT', lat:42.96, lon:-85.67, r:30,
    title:'Grand Rapids Traffic Cameras | MileCheck', h1:'Grand Rapids traffic cameras', cityPage:true,
    desc:'Grand Rapids traffic cameras on one map. MDOT highway cameras on I-96 and other main roads, with the latest image from each.',
    sub:'See Grand Rapids traffic before you leave. MDOT highway cameras around Grand Rapids on one map. Tap any camera for the latest image.',
    blurb:`MDOT runs the highway cameras around Grand Rapids.`,
    freeways:`Watch I-96, I-196, US-131 and I-296.` },
  { slug:'wichita', name:'Wichita', state:'KS', dot:'KDOT', lat:37.69, lon:-97.34, r:30,
    title:'Wichita Traffic Cameras | MileCheck', h1:'Wichita traffic cameras', cityPage:true,
    desc:'Wichita traffic cameras on one map. KDOT highway cameras on I-135 and other main roads, with the latest image from each.',
    sub:'See Wichita traffic before you leave. KDOT highway cameras around Wichita on one map. Tap any camera for the latest image.',
    blurb:`KDOT runs the highway cameras around Wichita.`,
    freeways:`Watch I-135, I-235, US-54/400 (Kellogg) and K-96.` },
  { slug:'madison', name:'Madison', state:'WI', dot:'WisDOT', lat:43.07, lon:-89.4, r:30,
    title:'Madison Traffic Cameras | MileCheck', h1:'Madison traffic cameras', cityPage:true,
    desc:'Madison traffic cameras on one map. WisDOT highway cameras on I-39/90 and other main roads, with the latest image from each.',
    sub:'See Madison traffic before you leave. WisDOT highway cameras around Madison on one map. Tap any camera for the latest image.',
    blurb:`WisDOT runs the highway cameras around Madison.`,
    freeways:`Watch I-39/90, I-94, the Beltline (US-12/18) and US-151.` },
  { slug:'honolulu', name:'Honolulu', state:'HI', dot:'HDOT', lat:21.31, lon:-157.86, r:30, anyRoute:true,
    title:'Honolulu Traffic Cameras | MileCheck', h1:'Honolulu traffic cameras', cityPage:true,
    desc:'Honolulu traffic cameras on one map. HDOT highway cameras on H-1 and other main roads, with the latest image from each.',
    sub:'See Honolulu traffic before you leave. HDOT highway cameras around Honolulu on one map. Tap any camera for the latest image.',
    blurb:`HDOT runs the highway cameras around Honolulu.`,
    freeways:`Watch H-1, H-2 and H-3, the Pali Highway and the Likelike Highway.` },
  { slug:'oklahoma-city', name:'Oklahoma City', state:'OK', dot:'ODOT', lat:35.47, lon:-97.52, r:40, anyRoute:true,
    title:'Oklahoma City Traffic Cameras | MileCheck', h1:'Oklahoma City traffic cameras', cityPage:true,
    desc:'Oklahoma City traffic cameras on one map. ODOT highway cameras on I-35 and other main roads, with the latest image from each.',
    sub:'See Oklahoma City traffic before you leave. ODOT highway cameras around Oklahoma City on one map. Tap any camera for the latest image.',
    blurb:`ODOT runs the highway cameras around Oklahoma City.`,
    freeways:`Watch I-35, I-40, I-44, I-235 and I-240.` },
  { slug:'anchorage', name:'Anchorage', state:'AK', dot:'Alaska DOT&PF', lat:61.22, lon:-149.9, r:30, anyRoute:true,
    title:'Anchorage Traffic Cameras | MileCheck', h1:'Anchorage traffic cameras', cityPage:true,
    desc:'Anchorage traffic cameras on one map. Alaska DOT&PF highway cameras on the Glenn Highway and other main roads, with the latest image from each.',
    sub:'See Anchorage traffic before you leave. Alaska DOT&PF highway cameras around Anchorage on one map. Tap any camera for the latest image.',
    blurb:`Alaska DOT&PF runs the highway cameras around Anchorage.`,
    freeways:`Watch the Glenn Highway, the Seward Highway and Minnesota Drive.` },
  // Batch 2 (2026-11-06 night, Leah: "keep doing you"). Road lists are the routes with the most cameras in the feed
  // within the radius (tools: /tmp/cnt2.py at build time), so a named road always has cameras on the page.
  { slug:'fort-worth', name:'Fort Worth', state:'TX', dot:'TxDOT', lat:32.75, lon:-97.33, r:30, anyRoute:true,
    title:'Fort Worth Traffic Cameras | MileCheck', h1:'Fort Worth traffic cameras', cityPage:true,
    desc:'Fort Worth traffic cameras on one map. TxDOT highway cameras on I-30 and other main roads, with the latest image from each.',
    sub:'See Fort Worth traffic before you leave. TxDOT highway cameras around Fort Worth on one map. Tap any camera for the latest image.',
    blurb:`TxDOT runs the highway cameras around Fort Worth.`,
    freeways:`Watch I-30, I-820, I-20, TX-360 and TX-121.` },
  { slug:'washington-dc', name:'Washington DC', state:'VA', dot:'VDOT', extra:'MD', extraDot:'MDOT SHA', video:true, lat:38.9, lon:-77.04, r:35, anyRoute:true,
    title:'Washington DC Traffic Cameras | MileCheck', h1:'Washington DC traffic cameras', cityPage:true,
    desc:'Washington DC area traffic cameras on one map. VDOT cameras on the Virginia side and MDOT SHA live video cameras on the Maryland side, on I-66, I-495, I-95 and I-270.',
    sub:'See traffic around Washington DC before you leave. VDOT and MDOT SHA highway cameras on one map. Tap any camera for its latest image or live video.',
    blurb:`VDOT runs the cameras on the Virginia side and MDOT SHA the live video cameras on the Maryland side. District (DDOT) cameras are not on this map yet.`,
    freeways:`Watch I-66, I-495, I-95, US-1 and VA-7.` },
  { slug:'colorado-springs', name:'Colorado Springs', state:'CO', dot:'CDOT', lat:38.83, lon:-104.82, r:30,
    title:'Colorado Springs Traffic Cameras | MileCheck', h1:'Colorado Springs traffic cameras', cityPage:true,
    desc:'Colorado Springs traffic cameras on one map. CDOT highway cameras on US-24 and other main roads, with the latest image from each.',
    sub:'See Colorado Springs traffic before you leave. CDOT highway cameras around Colorado Springs on one map. Tap any camera for the latest image.',
    blurb:`CDOT runs the highway cameras around Colorado Springs.`,
    freeways:`Watch US-24, I-25, SH-115, SH-21 and SH-24.` },
  { slug:'tulsa', name:'Tulsa', state:'OK', dot:'ODOT', lat:36.15, lon:-95.99, r:30, anyRoute:true,
    title:'Tulsa Traffic Cameras | MileCheck', h1:'Tulsa traffic cameras', cityPage:true,
    desc:'Tulsa traffic cameras on one map. ODOT highway cameras around Tulsa, with the latest image from each.',
    sub:'See Tulsa traffic before you leave. ODOT highway cameras around Tulsa on one map. Tap any camera for the latest image.',
    blurb:`ODOT runs the highway cameras around Tulsa.`,
    freeways:`The map shows the ODOT cameras around Tulsa.` },
  { slug:'little-rock', name:'Little Rock', state:'AR', dot:'ARDOT', lat:34.75, lon:-92.29, r:30,
    title:'Little Rock Traffic Cameras | MileCheck', h1:'Little Rock traffic cameras', cityPage:true,
    desc:'Little Rock traffic cameras on one map. ARDOT highway cameras on I-40 and other main roads, with the latest image from each.',
    sub:'See Little Rock traffic before you leave. ARDOT highway cameras around Little Rock on one map. Tap any camera for the latest image.',
    blurb:`ARDOT runs the highway cameras around Little Rock.`,
    freeways:`Watch I-40, I-430, I-30, I-57 and I-440.` },
  { slug:'jackson-ms', name:'Jackson, MS', state:'MS', dot:'MDOT', lat:32.3, lon:-90.18, r:30,
    title:'Jackson, MS Traffic Cameras | MileCheck', h1:'Jackson, MS traffic cameras', cityPage:true,
    desc:'Jackson, MS traffic cameras on one map. MDOT highway cameras on I-55 and other main roads, with the latest image from each.',
    sub:'See Jackson, MS traffic before you leave. MDOT highway cameras around Jackson, MS on one map. Tap any camera for the latest image.',
    blurb:`MDOT runs the highway cameras around Jackson, MS.`,
    freeways:`Watch I-55, US-49, I-20, MS-463 and I-220.` },
  { slug:'charleston', name:'Charleston, SC', state:'SC', dot:'SCDOT', lat:32.78, lon:-79.94, r:30,
    title:'Charleston, SC Traffic Cameras | MileCheck', h1:'Charleston, SC traffic cameras', cityPage:true,
    desc:'Charleston, SC traffic cameras on one map. SCDOT highway cameras on I-26 and other main roads, with the latest image from each.',
    sub:'See Charleston, SC traffic before you leave. SCDOT highway cameras around Charleston, SC on one map. Tap any camera for the latest image.',
    blurb:`SCDOT runs the highway cameras around Charleston, SC.`,
    freeways:`Watch I-26 and I-526.` },
  { slug:'columbia-sc', name:'Columbia, SC', state:'SC', dot:'SCDOT', lat:34.0, lon:-81.03, r:30,
    title:'Columbia, SC Traffic Cameras | MileCheck', h1:'Columbia, SC traffic cameras', cityPage:true,
    desc:'Columbia, SC traffic cameras on one map. SCDOT highway cameras on I-26 and other main roads, with the latest image from each.',
    sub:'See Columbia, SC traffic before you leave. SCDOT highway cameras around Columbia, SC on one map. Tap any camera for the latest image.',
    blurb:`SCDOT runs the highway cameras around Columbia, SC.`,
    freeways:`Watch I-26, I-20, I-77, I-126 and SC-277.` },
  { slug:'greenville-sc', name:'Greenville, SC', state:'SC', dot:'SCDOT', lat:34.85, lon:-82.4, r:30,
    title:'Greenville, SC Traffic Cameras | MileCheck', h1:'Greenville, SC traffic cameras', cityPage:true,
    desc:'Greenville, SC traffic cameras on one map. SCDOT highway cameras on I-85 and other main roads, with the latest image from each.',
    sub:'See Greenville, SC traffic before you leave. SCDOT highway cameras around Greenville, SC on one map. Tap any camera for the latest image.',
    blurb:`SCDOT runs the highway cameras around Greenville, SC.`,
    freeways:`Watch I-85 and I-385.` },
  { slug:'savannah', name:'Savannah', state:'GA', dot:'GDOT', lat:32.08, lon:-81.09, r:30,
    title:'Savannah Traffic Cameras | MileCheck', h1:'Savannah traffic cameras', cityPage:true,
    desc:'Savannah traffic cameras on one map. GDOT highway cameras on GA-26 and other main roads, with the latest image from each.',
    sub:'See Savannah traffic before you leave. GDOT highway cameras around Savannah on one map. Tap any camera for the latest image.',
    blurb:`GDOT runs the highway cameras around Savannah.`,
    freeways:`Watch GA-26, GA-204, GA-25, I-95 and GA-21.` },
  { slug:'dayton', name:'Dayton', state:'OH', dot:'ODOT', lat:39.76, lon:-84.19, r:30,
    title:'Dayton Traffic Cameras | MileCheck', h1:'Dayton traffic cameras', cityPage:true,
    desc:'Dayton traffic cameras on one map. ODOT highway cameras on I-75 and other main roads, with the latest image from each.',
    sub:'See Dayton traffic before you leave. ODOT highway cameras around Dayton on one map. Tap any camera for the latest image.',
    blurb:`ODOT runs the highway cameras around Dayton.`,
    freeways:`Watch I-75, I-70, US-35, I-675 and US-40.` },
  { slug:'toledo', name:'Toledo', state:'OH', dot:'ODOT', lat:41.65, lon:-83.54, r:30,
    title:'Toledo Traffic Cameras | MileCheck', h1:'Toledo traffic cameras', cityPage:true,
    desc:'Toledo traffic cameras on one map. ODOT highway cameras on I-75 and other main roads, with the latest image from each.',
    sub:'See Toledo traffic before you leave. ODOT highway cameras around Toledo on one map. Tap any camera for the latest image.',
    blurb:`ODOT runs the highway cameras around Toledo.`,
    freeways:`Watch I-75, I-475, I-280, US-23 and US-24.` },
  { slug:'akron', name:'Akron', state:'OH', dot:'ODOT', lat:41.08, lon:-81.52, r:25,
    title:'Akron Traffic Cameras | MileCheck', h1:'Akron traffic cameras', cityPage:true,
    desc:'Akron traffic cameras on one map. ODOT highway cameras on I-77 and other main roads, with the latest image from each.',
    sub:'See Akron traffic before you leave. ODOT highway cameras around Akron on one map. Tap any camera for the latest image.',
    blurb:`ODOT runs the highway cameras around Akron.`,
    freeways:`Watch I-77, I-76, I-277, I-271 and I-71.` },
  { slug:'rochester', name:'Rochester, NY', state:'NY', dot:'NYSDOT', lat:43.16, lon:-77.61, r:30,
    title:'Rochester, NY Traffic Cameras | MileCheck', h1:'Rochester, NY traffic cameras', cityPage:true,
    desc:'Rochester, NY traffic cameras on one map. NYSDOT highway cameras on NY-104 and other main roads, with the latest image from each.',
    sub:'See Rochester, NY traffic before you leave. NYSDOT highway cameras around Rochester, NY on one map. Tap any camera for the latest image.',
    blurb:`NYSDOT runs the highway cameras around Rochester, NY.`,
    freeways:`Watch NY-104, NY-31, I-490, I-390 and NY-96.` },
  { slug:'syracuse', name:'Syracuse', state:'NY', dot:'NYSDOT', lat:43.05, lon:-76.15, r:30,
    title:'Syracuse Traffic Cameras | MileCheck', h1:'Syracuse traffic cameras', cityPage:true,
    desc:'Syracuse traffic cameras on one map. NYSDOT highway cameras on I-81 and other main roads, with the latest image from each.',
    sub:'See Syracuse traffic before you leave. NYSDOT highway cameras around Syracuse on one map. Tap any camera for the latest image.',
    blurb:`NYSDOT runs the highway cameras around Syracuse.`,
    freeways:`Watch I-81, I-690, I-481, I-90 and US-11.` },
  { slug:'albany', name:'Albany', state:'NY', dot:'NYSDOT', lat:42.65, lon:-73.76, r:30,
    title:'Albany Traffic Cameras | MileCheck', h1:'Albany traffic cameras', cityPage:true,
    desc:'Albany traffic cameras on one map. NYSDOT highway cameras on I-90 and other main roads, with the latest image from each.',
    sub:'See Albany traffic before you leave. NYSDOT highway cameras around Albany on one map. Tap any camera for the latest image.',
    blurb:`NYSDOT runs the highway cameras around Albany.`,
    freeways:`Watch I-90, I-87, US-9, NY-787 and NY-7.` },
  { slug:'long-island', name:'Long Island', state:'NY', dot:'NYSDOT', lat:40.8, lon:-73.2, r:40,
    title:'Long Island Traffic Cameras | MileCheck', h1:'Long Island traffic cameras', cityPage:true,
    desc:'Long Island traffic cameras on one map. NYSDOT highway cameras on I-495 and other main roads, with the latest image from each.',
    sub:'See Long Island traffic before you leave. NYSDOT highway cameras around Long Island on one map. Tap any camera for the latest image.',
    blurb:`NYSDOT runs the highway cameras around Long Island.`,
    freeways:`Watch I-495, NY-25 and NY-27.` },
  { slug:'harrisburg', name:'Harrisburg', state:'PA', dot:'PennDOT', lat:40.27, lon:-76.88, r:30,
    title:'Harrisburg Traffic Cameras | MileCheck', h1:'Harrisburg traffic cameras', cityPage:true,
    desc:'Harrisburg traffic cameras on one map. PennDOT highway cameras on I-81 and other main roads, with the latest image from each.',
    sub:'See Harrisburg traffic before you leave. PennDOT highway cameras around Harrisburg on one map. Tap any camera for the latest image.',
    blurb:`PennDOT runs the highway cameras around Harrisburg.`,
    freeways:`Watch I-81, I-83, US-22, US-15 and PA-283.` },
  { slug:'allentown', name:'Allentown', state:'PA', dot:'PennDOT', lat:40.6, lon:-75.47, r:30,
    title:'Allentown Traffic Cameras | MileCheck', h1:'Allentown traffic cameras', cityPage:true,
    desc:'Allentown traffic cameras on one map. PennDOT highway cameras on I-78 and other main roads, with the latest image from each.',
    sub:'See Allentown traffic before you leave. PennDOT highway cameras around Allentown on one map. Tap any camera for the latest image.',
    blurb:`PennDOT runs the highway cameras around Allentown.`,
    freeways:`Watch I-78, US-22 and PA-309.` },
  { slug:'scranton', name:'Scranton', state:'PA', dot:'PennDOT', lat:41.41, lon:-75.66, r:30,
    title:'Scranton Traffic Cameras | MileCheck', h1:'Scranton traffic cameras', cityPage:true,
    desc:'Scranton traffic cameras on one map. PennDOT highway cameras on I-81 and other main roads, with the latest image from each.',
    sub:'See Scranton traffic before you leave. PennDOT highway cameras around Scranton on one map. Tap any camera for the latest image.',
    blurb:`PennDOT runs the highway cameras around Scranton.`,
    freeways:`Watch I-81, I-380, I-84 and PA-309.` },
  { slug:'worcester', name:'Worcester', state:'MA', dot:'MassDOT', lat:42.26, lon:-71.8, r:25,
    title:'Worcester Traffic Cameras | MileCheck', h1:'Worcester traffic cameras', cityPage:true,
    desc:'Worcester traffic cameras on one map. MassDOT highway cameras on I-290 and other main roads, with the latest image from each.',
    sub:'See Worcester traffic before you leave. MassDOT highway cameras around Worcester on one map. Tap any camera for the latest image.',
    blurb:`MassDOT runs the highway cameras around Worcester.`,
    freeways:`Watch I-290, I-90 and I-495.` },
  { slug:'springfield-ma', name:'Springfield, MA', state:'MA', dot:'MassDOT', lat:42.1, lon:-72.59, r:25,
    title:'Springfield, MA Traffic Cameras | MileCheck', h1:'Springfield, MA traffic cameras', cityPage:true,
    desc:'Springfield, MA traffic cameras on one map. MassDOT highway cameras on I-91 and other main roads, with the latest image from each.',
    sub:'See Springfield, MA traffic before you leave. MassDOT highway cameras around Springfield, MA on one map. Tap any camera for the latest image.',
    blurb:`MassDOT runs the highway cameras around Springfield, MA.`,
    freeways:`Watch I-91, I-90 and I-291.` },
  { slug:'manchester-nh', name:'Manchester, NH', state:'NH', dot:'NHDOT', lat:42.99, lon:-71.46, r:30,
    title:'Manchester, NH Traffic Cameras | MileCheck', h1:'Manchester, NH traffic cameras', cityPage:true,
    desc:'Manchester, NH traffic cameras on one map. NHDOT highway cameras on I-93 and other main roads, with the latest image from each.',
    sub:'See Manchester, NH traffic before you leave. NHDOT highway cameras around Manchester, NH on one map. Tap any camera for the latest image.',
    blurb:`NHDOT runs the highway cameras around Manchester, NH.`,
    freeways:`Watch I-93, I-293, NH-101 and NH-106.` },
  { slug:'lincoln', name:'Lincoln', state:'NE', dot:'Nebraska DOT', lat:40.81, lon:-96.7, r:25,
    title:'Lincoln Traffic Cameras | MileCheck', h1:'Lincoln traffic cameras', cityPage:true,
    desc:'Lincoln traffic cameras on one map. Nebraska DOT highway cameras on I-80 and other main roads, with the latest image from each.',
    sub:'See Lincoln traffic before you leave. Nebraska DOT highway cameras around Lincoln on one map. Tap any camera for the latest image.',
    blurb:`Nebraska DOT runs the highway cameras around Lincoln.`,
    freeways:`Watch I-80, US-77 and I-180.` },
  { slug:'sioux-falls', name:'Sioux Falls', state:'SD', dot:'SDDOT', lat:43.55, lon:-96.73, r:25,
    title:'Sioux Falls Traffic Cameras | MileCheck', h1:'Sioux Falls traffic cameras', cityPage:true,
    desc:'Sioux Falls traffic cameras on one map. SDDOT highway cameras on I-90 and other main roads, with the latest image from each.',
    sub:'See Sioux Falls traffic before you leave. SDDOT highway cameras around Sioux Falls on one map. Tap any camera for the latest image.',
    blurb:`SDDOT runs the highway cameras around Sioux Falls.`,
    freeways:`Watch I-90 and I-29.` },
  { slug:'fargo', name:'Fargo', state:'ND', dot:'NDDOT', lat:46.88, lon:-96.79, r:25,
    title:'Fargo Traffic Cameras | MileCheck', h1:'Fargo traffic cameras', cityPage:true,
    desc:'Fargo traffic cameras on one map. NDDOT highway cameras on I-29 and other main roads, with the latest image from each.',
    sub:'See Fargo traffic before you leave. NDDOT highway cameras around Fargo on one map. Tap any camera for the latest image.',
    blurb:`NDDOT runs the highway cameras around Fargo.`,
    freeways:`Watch I-29, I-94 and US-81.` },
  { slug:'eugene', name:'Eugene', state:'OR', dot:'ODOT', lat:44.05, lon:-123.09, r:25,
    title:'Eugene Traffic Cameras | MileCheck', h1:'Eugene traffic cameras', cityPage:true,
    desc:'Eugene traffic cameras on one map. ODOT highway cameras on I-5 and other main roads, with the latest image from each.',
    sub:'See Eugene traffic before you leave. ODOT highway cameras around Eugene on one map. Tap any camera for the latest image.',
    blurb:`ODOT runs the highway cameras around Eugene.`,
    freeways:`Watch I-5, OR-569, OR-126, OR-132 and OR-58.` },
  { slug:'bend', name:'Bend', state:'OR', dot:'ODOT', lat:44.06, lon:-121.31, r:30,
    title:'Bend Traffic Cameras | MileCheck', h1:'Bend traffic cameras', cityPage:true,
    desc:'Bend traffic cameras on one map. ODOT highway cameras on US-97 and other main roads, with the latest image from each.',
    sub:'See Bend traffic before you leave. ODOT highway cameras around Bend on one map. Tap any camera for the latest image.',
    blurb:`ODOT runs the highway cameras around Bend.`,
    freeways:`Watch US-97, US-20 and OR-126.` },
  { slug:'olympia', name:'Olympia', state:'WA', dot:'WSDOT', lat:47.04, lon:-122.9, r:20,
    title:'Olympia Traffic Cameras | MileCheck', h1:'Olympia traffic cameras', cityPage:true,
    desc:'Olympia traffic cameras on one map. WSDOT highway cameras on I-5 and other main roads, with the latest image from each.',
    sub:'See Olympia traffic before you leave. WSDOT highway cameras around Olympia on one map. Tap any camera for the latest image.',
    blurb:`WSDOT runs the highway cameras around Olympia.`,
    freeways:`Watch I-5 and US 101.` },
  { slug:'bellingham', name:'Bellingham', state:'WA', dot:'WSDOT', lat:48.75, lon:-122.48, r:25,
    title:'Bellingham Traffic Cameras | MileCheck', h1:'Bellingham traffic cameras', cityPage:true,
    desc:'Bellingham traffic cameras on one map. WSDOT highway cameras on I-5 and other main roads, with the latest image from each.',
    sub:'See Bellingham traffic before you leave. WSDOT highway cameras around Bellingham on one map. Tap any camera for the latest image.',
    blurb:`WSDOT runs the highway cameras around Bellingham.`,
    freeways:`Watch I-5 and SR 539.` },
  { slug:'vancouver-wa', name:'Vancouver, WA', state:'WA', dot:'WSDOT', lat:45.64, lon:-122.66, r:15,
    title:'Vancouver, WA Traffic Cameras | MileCheck', h1:'Vancouver, WA traffic cameras', cityPage:true,
    desc:'Vancouver, WA traffic cameras on one map. WSDOT highway cameras on I-5 and other main roads, with the latest image from each.',
    sub:'See Vancouver, WA traffic before you leave. WSDOT highway cameras around Vancouver, WA on one map. Tap any camera for the latest image.',
    blurb:`WSDOT runs the highway cameras around Vancouver, WA.`,
    freeways:`Watch I-5, I-205, SR 500, SR 14 and SR 503.` },
  { slug:'everett', name:'Everett', state:'WA', dot:'WSDOT', lat:47.98, lon:-122.2, r:15,
    title:'Everett Traffic Cameras | MileCheck', h1:'Everett traffic cameras', cityPage:true,
    desc:'Everett traffic cameras on one map. WSDOT highway cameras on I-5 and other main roads, with the latest image from each.',
    sub:'See Everett traffic before you leave. WSDOT highway cameras around Everett on one map. Tap any camera for the latest image.',
    blurb:`WSDOT runs the highway cameras around Everett.`,
    freeways:`Watch I-5, SR 9, SR 525, SR 527 and US 2.` },
  { slug:'bellevue', name:'Bellevue', state:'WA', dot:'WSDOT', lat:47.61, lon:-122.2, r:10,
    title:'Bellevue Traffic Cameras | MileCheck', h1:'Bellevue traffic cameras', cityPage:true,
    desc:'Bellevue traffic cameras on one map. WSDOT highway cameras on SR 520 and other main roads, with the latest image from each.',
    sub:'See Bellevue traffic before you leave. WSDOT highway cameras around Bellevue on one map. Tap any camera for the latest image.',
    blurb:`WSDOT runs the highway cameras around Bellevue.`,
    freeways:`Watch SR 520, I-405, I-90, I-5 and SR 202.` },
  { slug:'ogden', name:'Ogden', state:'UT', dot:'UDOT', lat:41.22, lon:-111.97, r:20,
    title:'Ogden Traffic Cameras | MileCheck', h1:'Ogden traffic cameras', cityPage:true,
    desc:'Ogden traffic cameras on one map. UDOT highway cameras on I-15 and other main roads, with the latest image from each.',
    sub:'See Ogden traffic before you leave. UDOT highway cameras around Ogden on one map. Tap any camera for the latest image.',
    blurb:`UDOT runs the highway cameras around Ogden.`,
    freeways:`Watch I-15, US 89, SR 126, I-84 and SR 203.` },
  { slug:'provo', name:'Provo', state:'UT', dot:'UDOT', lat:40.23, lon:-111.66, r:20, anyRoute:true,
    title:'Provo Traffic Cameras | MileCheck', h1:'Provo traffic cameras', cityPage:true,
    desc:'Provo traffic cameras on one map. UDOT highway cameras on US 89 and other main roads, with the latest image from each.',
    sub:'See Provo traffic before you leave. UDOT highway cameras around Provo on one map. Tap any camera for the latest image.',
    blurb:`UDOT runs the highway cameras around Provo.`,
    freeways:`Watch US 89, I-15, US 189 and SR 198.` },
  { slug:'st-george', name:'St. George', state:'UT', dot:'UDOT', lat:37.1, lon:-113.58, r:30,
    title:'St. George Traffic Cameras | MileCheck', h1:'St. George traffic cameras', cityPage:true,
    desc:'St. George traffic cameras on one map. UDOT highway cameras on I-15 and other main roads, with the latest image from each.',
    sub:'See St. George traffic before you leave. UDOT highway cameras around St. George on one map. Tap any camera for the latest image.',
    blurb:`UDOT runs the highway cameras around St. George.`,
    freeways:`Watch I-15, SR 9, SR 7, SR 18 and SR 34.` },
  { slug:'lubbock', name:'Lubbock', state:'TX', dot:'TxDOT', lat:33.58, lon:-101.85, r:30, anyRoute:true,
    title:'Lubbock Traffic Cameras | MileCheck', h1:'Lubbock traffic cameras', cityPage:true,
    desc:'Lubbock traffic cameras on one map. TxDOT highway cameras on I-27 and other main roads, with the latest image from each.',
    sub:'See Lubbock traffic before you leave. TxDOT highway cameras around Lubbock on one map. Tap any camera for the latest image.',
    blurb:`TxDOT runs the highway cameras around Lubbock.`,
    freeways:`Watch I-27, US-62 and US-84.` },
  { slug:'corpus-christi', name:'Corpus Christi', state:'TX', dot:'TxDOT', lat:27.8, lon:-97.4, r:30, anyRoute:true,
    title:'Corpus Christi Traffic Cameras | MileCheck', h1:'Corpus Christi traffic cameras', cityPage:true,
    desc:'Corpus Christi traffic cameras on one map. TxDOT highway cameras on I-37 and other main roads, with the latest image from each.',
    sub:'See Corpus Christi traffic before you leave. TxDOT highway cameras around Corpus Christi on one map. Tap any camera for the latest image.',
    blurb:`TxDOT runs the highway cameras around Corpus Christi.`,
    freeways:`Watch I-37, TX-358, TX-286, US-181 and US-77.` },
  { slug:'mcallen', name:'McAllen', state:'TX', dot:'TxDOT', lat:26.2, lon:-98.23, r:35,
    title:'McAllen Traffic Cameras | MileCheck', h1:'McAllen traffic cameras', cityPage:true,
    desc:'McAllen traffic cameras on one map. TxDOT highway cameras on I-2 and other main roads, with the latest image from each.',
    sub:'See McAllen traffic before you leave. TxDOT highway cameras around McAllen on one map. Tap any camera for the latest image.',
    blurb:`TxDOT runs the highway cameras around McAllen.`,
    freeways:`Watch I-2 and I-69.` },
  { slug:'laredo', name:'Laredo', state:'TX', dot:'TxDOT', lat:27.53, lon:-99.48, r:25, anyRoute:true,
    title:'Laredo Traffic Cameras | MileCheck', h1:'Laredo traffic cameras', cityPage:true,
    desc:'Laredo traffic cameras on one map. TxDOT highway cameras on US-83 and other main roads, with the latest image from each.',
    sub:'See Laredo traffic before you leave. TxDOT highway cameras around Laredo on one map. Tap any camera for the latest image.',
    blurb:`TxDOT runs the highway cameras around Laredo.`,
    freeways:`Watch US-83, TX-Loop-20, I-35, TX-359 and US-59.` },
  { slug:'beaumont', name:'Beaumont', state:'TX', dot:'TxDOT', lat:30.08, lon:-94.13, r:30, anyRoute:true,
    title:'Beaumont Traffic Cameras | MileCheck', h1:'Beaumont traffic cameras', cityPage:true,
    desc:'Beaumont traffic cameras on one map. TxDOT highway cameras on I-10 and other main roads, with the latest image from each.',
    sub:'See Beaumont traffic before you leave. TxDOT highway cameras around Beaumont on one map. Tap any camera for the latest image.',
    blurb:`TxDOT runs the highway cameras around Beaumont.`,
    freeways:`Watch I-10, TX-73, US-69, TX-347 and TX-105.` },
  { slug:'baton-rouge', name:'Baton Rouge', state:'LA', dot:'DOTD', lat:30.45, lon:-91.15, r:30,
    title:'Baton Rouge Traffic Cameras | MileCheck', h1:'Baton Rouge traffic cameras', cityPage:true,
    desc:'Baton Rouge traffic cameras on one map. DOTD highway cameras on I-10 and other main roads, with the latest image from each.',
    sub:'See Baton Rouge traffic before you leave. DOTD highway cameras around Baton Rouge on one map. Tap any camera for the latest image.',
    blurb:`DOTD runs the highway cameras around Baton Rouge.`,
    freeways:`Watch I-10, I-12, US-61, I-110 and US-190.` },
  { slug:'lafayette', name:'Lafayette, LA', state:'LA', dot:'DOTD', lat:30.22, lon:-92.02, r:30,
    title:'Lafayette, LA Traffic Cameras | MileCheck', h1:'Lafayette, LA traffic cameras', cityPage:true,
    desc:'Lafayette, LA traffic cameras on one map. DOTD highway cameras on I-10 and other main roads, with the latest image from each.',
    sub:'See Lafayette, LA traffic before you leave. DOTD highway cameras around Lafayette, LA on one map. Tap any camera for the latest image.',
    blurb:`DOTD runs the highway cameras around Lafayette, LA.`,
    freeways:`Watch I-10.` },
  { slug:'shreveport', name:'Shreveport', state:'LA', dot:'DOTD', lat:32.52, lon:-93.75, r:30,
    title:'Shreveport Traffic Cameras | MileCheck', h1:'Shreveport traffic cameras', cityPage:true,
    desc:'Shreveport traffic cameras on one map. DOTD highway cameras on I-20 and other main roads, with the latest image from each.',
    sub:'See Shreveport traffic before you leave. DOTD highway cameras around Shreveport on one map. Tap any camera for the latest image.',
    blurb:`DOTD runs the highway cameras around Shreveport.`,
    freeways:`Watch I-20, I-220 and LA-3132.` },
  { slug:'mobile', name:'Mobile', state:'AL', dot:'ALDOT', lat:30.69, lon:-88.04, r:30,
    title:'Mobile Traffic Cameras | MileCheck', h1:'Mobile traffic cameras', cityPage:true,
    desc:'Mobile traffic cameras on one map. ALDOT highway cameras on I-10 and other main roads, with the latest image from each.',
    sub:'See Mobile traffic before you leave. ALDOT highway cameras around Mobile on one map. Tap any camera for the latest image.',
    blurb:`ALDOT runs the highway cameras around Mobile.`,
    freeways:`Watch I-10, I-65, US-98, US-90 and I-165.` },
  { slug:'montgomery', name:'Montgomery', state:'AL', dot:'ALDOT', lat:32.37, lon:-86.3, r:30,
    title:'Montgomery Traffic Cameras | MileCheck', h1:'Montgomery traffic cameras', cityPage:true,
    desc:'Montgomery traffic cameras on one map. ALDOT highway cameras on I-85 and other main roads, with the latest image from each.',
    sub:'See Montgomery traffic before you leave. ALDOT highway cameras around Montgomery on one map. Tap any camera for the latest image.',
    blurb:`ALDOT runs the highway cameras around Montgomery.`,
    freeways:`Watch I-85, I-65, US-231, AL-110 and US-82.` },
  { slug:'pensacola', name:'Pensacola', state:'FL', dot:'FDOT', lat:30.42, lon:-87.22, r:30,
    title:'Pensacola Traffic Cameras | MileCheck', h1:'Pensacola traffic cameras', cityPage:true,
    desc:'Pensacola traffic cameras on one map. FDOT highway cameras on I-10 and other main roads, with the latest image from each.',
    sub:'See Pensacola traffic before you leave. FDOT highway cameras around Pensacola on one map. Tap any camera for the latest image.',
    blurb:`FDOT runs the highway cameras around Pensacola.`,
    freeways:`Watch I-10, FL-30, I-110 and US-90.` },
  { slug:'tallahassee', name:'Tallahassee', state:'FL', dot:'FDOT', lat:30.44, lon:-84.28, r:30, anyRoute:true,
    title:'Tallahassee Traffic Cameras | MileCheck', h1:'Tallahassee traffic cameras', cityPage:true,
    desc:'Tallahassee traffic cameras on one map. FDOT highway cameras on I-10 and other main roads, with the latest image from each.',
    sub:'See Tallahassee traffic before you leave. FDOT highway cameras around Tallahassee on one map. Tap any camera for the latest image.',
    blurb:`FDOT runs the highway cameras around Tallahassee.`,
    freeways:`Watch I-10.` },
  { slug:'gainesville', name:'Gainesville', state:'FL', dot:'FDOT', lat:29.65, lon:-82.32, r:30,
    title:'Gainesville Traffic Cameras | MileCheck', h1:'Gainesville traffic cameras', cityPage:true,
    desc:'Gainesville traffic cameras on one map. FDOT highway cameras on I-75 and other main roads, with the latest image from each.',
    sub:'See Gainesville traffic before you leave. FDOT highway cameras around Gainesville on one map. Tap any camera for the latest image.',
    blurb:`FDOT runs the highway cameras around Gainesville.`,
    freeways:`Watch I-75 and US-441.` },
  { slug:'daytona-beach', name:'Daytona Beach', state:'FL', dot:'FDOT', lat:29.21, lon:-81.02, r:30,
    title:'Daytona Beach Traffic Cameras | MileCheck', h1:'Daytona Beach traffic cameras', cityPage:true,
    desc:'Daytona Beach traffic cameras on one map. FDOT highway cameras on I-95 and other main roads, with the latest image from each.',
    sub:'See Daytona Beach traffic before you leave. FDOT highway cameras around Daytona Beach on one map. Tap any camera for the latest image.',
    blurb:`FDOT runs the highway cameras around Daytona Beach.`,
    freeways:`Watch I-95, I-4, US-1, US-92 and FL-40.` },
  { slug:'sarasota', name:'Sarasota', state:'FL', dot:'FDOT', lat:27.34, lon:-82.53, r:30,
    title:'Sarasota Traffic Cameras | MileCheck', h1:'Sarasota traffic cameras', cityPage:true,
    desc:'Sarasota traffic cameras on one map. FDOT highway cameras on I-75 and other main roads, with the latest image from each.',
    sub:'See Sarasota traffic before you leave. FDOT highway cameras around Sarasota on one map. Tap any camera for the latest image.',
    blurb:`FDOT runs the highway cameras around Sarasota.`,
    freeways:`Watch I-75, US-41, I-275 and US-301.` },
  { slug:'fort-myers', name:'Fort Myers', state:'FL', dot:'FDOT', lat:26.64, lon:-81.87, r:30,
    title:'Fort Myers Traffic Cameras | MileCheck', h1:'Fort Myers traffic cameras', cityPage:true,
    desc:'Fort Myers traffic cameras on one map. FDOT highway cameras on I-75 and other main roads, with the latest image from each.',
    sub:'See Fort Myers traffic before you leave. FDOT highway cameras around Fort Myers on one map. Tap any camera for the latest image.',
    blurb:`FDOT runs the highway cameras around Fort Myers.`,
    freeways:`Watch I-75.` },
  { slug:'west-palm-beach', name:'West Palm Beach', state:'FL', dot:'FDOT', lat:26.72, lon:-80.05, r:25,
    title:'West Palm Beach Traffic Cameras | MileCheck', h1:'West Palm Beach traffic cameras', cityPage:true,
    desc:'West Palm Beach traffic cameras on one map. FDOT highway cameras on FL-91 and other main roads, with the latest image from each.',
    sub:'See West Palm Beach traffic before you leave. FDOT highway cameras around West Palm Beach on one map. Tap any camera for the latest image.',
    blurb:`FDOT runs the highway cameras around West Palm Beach.`,
    freeways:`Watch FL-91 and I-95.` },
  { slug:'greensboro', name:'Greensboro', state:'NC', dot:'NCDOT', lat:36.07, lon:-79.79, r:30,
    title:'Greensboro Traffic Cameras | MileCheck', h1:'Greensboro traffic cameras', cityPage:true,
    desc:'Greensboro traffic cameras on one map. NCDOT highway cameras on I-73 and other main roads, with the latest image from each.',
    sub:'See Greensboro traffic before you leave. NCDOT highway cameras around Greensboro on one map. Tap any camera for the latest image.',
    blurb:`NCDOT runs the highway cameras around Greensboro.`,
    freeways:`Watch I-73, I-840, I-40, I-85 and US-421.` },
  { slug:'durham', name:'Durham', state:'NC', dot:'NCDOT', lat:35.99, lon:-78.9, r:20,
    title:'Durham Traffic Cameras | MileCheck', h1:'Durham traffic cameras', cityPage:true,
    desc:'Durham traffic cameras on one map. NCDOT highway cameras on I-40 and other main roads, with the latest image from each.',
    sub:'See Durham traffic before you leave. NCDOT highway cameras around Durham on one map. Tap any camera for the latest image.',
    blurb:`NCDOT runs the highway cameras around Durham.`,
    freeways:`Watch I-40, I-85, I-540 and I-885.` },
  { slug:'asheville', name:'Asheville', state:'NC', dot:'NCDOT', lat:35.6, lon:-82.55, r:30,
    title:'Asheville Traffic Cameras | MileCheck', h1:'Asheville traffic cameras', cityPage:true,
    desc:'Asheville traffic cameras on one map. NCDOT highway cameras on I-26 and other main roads, with the latest image from each.',
    sub:'See Asheville traffic before you leave. NCDOT highway cameras around Asheville on one map. Tap any camera for the latest image.',
    blurb:`NCDOT runs the highway cameras around Asheville.`,
    freeways:`Watch I-26, I-40, I-240 and US-25.` },
  { slug:'wilmington-nc', name:'Wilmington, NC', state:'NC', dot:'NCDOT', lat:34.23, lon:-77.94, r:30,
    title:'Wilmington, NC Traffic Cameras | MileCheck', h1:'Wilmington, NC traffic cameras', cityPage:true,
    desc:'Wilmington, NC traffic cameras on one map. NCDOT highway cameras on US-17 and other main roads, with the latest image from each.',
    sub:'See Wilmington, NC traffic before you leave. NCDOT highway cameras around Wilmington, NC on one map. Tap any camera for the latest image.',
    blurb:`NCDOT runs the highway cameras around Wilmington, NC.`,
    freeways:`Watch US-17, US-421, I-140, US-17B and US-74.` },
  { slug:'roanoke', name:'Roanoke', state:'VA', dot:'VDOT', lat:37.27, lon:-79.94, r:30,
    title:'Roanoke Traffic Cameras | MileCheck', h1:'Roanoke traffic cameras', cityPage:true,
    desc:'Roanoke traffic cameras on one map. VDOT highway cameras on I-81 and other main roads, with the latest image from each.',
    sub:'See Roanoke traffic before you leave. VDOT highway cameras around Roanoke on one map. Tap any camera for the latest image.',
    blurb:`VDOT runs the highway cameras around Roanoke.`,
    freeways:`Watch I-81, US-220, I-581 and US-11.` },
  { slug:'fredericksburg', name:'Fredericksburg', state:'VA', dot:'VDOT', lat:38.3, lon:-77.46, r:25,
    title:'Fredericksburg Traffic Cameras | MileCheck', h1:'Fredericksburg traffic cameras', cityPage:true,
    desc:'Fredericksburg traffic cameras on one map. VDOT highway cameras on I-95 and other main roads, with the latest image from each.',
    sub:'See Fredericksburg traffic before you leave. VDOT highway cameras around Fredericksburg on one map. Tap any camera for the latest image.',
    blurb:`VDOT runs the highway cameras around Fredericksburg.`,
    freeways:`Watch I-95 and US-1.` },
  { slug:'ann-arbor', name:'Ann Arbor', state:'MI', dot:'MDOT', lat:42.28, lon:-83.74, r:20,
    title:'Ann Arbor Traffic Cameras | MileCheck', h1:'Ann Arbor traffic cameras', cityPage:true,
    desc:'Ann Arbor traffic cameras on one map. MDOT highway cameras on US-23 and other main roads, with the latest image from each.',
    sub:'See Ann Arbor traffic before you leave. MDOT highway cameras around Ann Arbor on one map. Tap any camera for the latest image.',
    blurb:`MDOT runs the highway cameras around Ann Arbor.`,
    freeways:`Watch US-23 and I-94.` },
  { slug:'kalamazoo', name:'Kalamazoo', state:'MI', dot:'MDOT', lat:42.29, lon:-85.59, r:25,
    title:'Kalamazoo Traffic Cameras | MileCheck', h1:'Kalamazoo traffic cameras', cityPage:true,
    desc:'Kalamazoo traffic cameras on one map. MDOT highway cameras on I-94 and other main roads, with the latest image from each.',
    sub:'See Kalamazoo traffic before you leave. MDOT highway cameras around Kalamazoo on one map. Tap any camera for the latest image.',
    blurb:`MDOT runs the highway cameras around Kalamazoo.`,
    freeways:`Watch I-94 and US-131.` },
  { slug:'green-bay', name:'Green Bay', state:'WI', dot:'WisDOT', lat:44.51, lon:-88.01, r:25,
    title:'Green Bay Traffic Cameras | MileCheck', h1:'Green Bay traffic cameras', cityPage:true,
    desc:'Green Bay traffic cameras on one map. WisDOT highway cameras on I-41 and other main roads, with the latest image from each.',
    sub:'See Green Bay traffic before you leave. WisDOT highway cameras around Green Bay on one map. Tap any camera for the latest image.',
    blurb:`WisDOT runs the highway cameras around Green Bay.`,
    freeways:`Watch I-41, I-43, WI-172, WI-29 and US-41.` },
  { slug:'peoria', name:'Peoria', state:'IL', dot:'IDOT', lat:40.69, lon:-89.59, r:25,
    title:'Peoria Traffic Cameras | MileCheck', h1:'Peoria traffic cameras', cityPage:true,
    desc:'Peoria traffic cameras on one map. IDOT highway cameras on I-74 and other main roads, with the latest image from each.',
    sub:'See Peoria traffic before you leave. IDOT highway cameras around Peoria on one map. Tap any camera for the latest image.',
    blurb:`IDOT runs the highway cameras around Peoria.`,
    freeways:`Watch I-74, US-24, IL-40, US-150 and IL-29.` },
  { slug:'fort-wayne', name:'Fort Wayne', state:'IN', dot:'INDOT', lat:41.08, lon:-85.14, r:25,
    title:'Fort Wayne Traffic Cameras | MileCheck', h1:'Fort Wayne traffic cameras', cityPage:true,
    desc:'Fort Wayne traffic cameras on one map. INDOT highway cameras on I-69 and other main roads, with the latest image from each.',
    sub:'See Fort Wayne traffic before you leave. INDOT highway cameras around Fort Wayne on one map. Tap any camera for the latest image.',
    blurb:`INDOT runs the highway cameras around Fort Wayne.`,
    freeways:`Watch I-69 and I-469.` },
  { slug:'gary', name:'Gary', state:'IN', dot:'INDOT', lat:41.59, lon:-87.35, r:20,
    title:'Gary Traffic Cameras | MileCheck', h1:'Gary traffic cameras', cityPage:true,
    desc:'Gary traffic cameras on one map. INDOT highway cameras on I-65 and other main roads, with the latest image from each.',
    sub:'See Gary traffic before you leave. INDOT highway cameras around Gary on one map. Tap any camera for the latest image.',
    blurb:`INDOT runs the highway cameras around Gary.`,
    freeways:`Watch I-65, I-94, I-80, US-30 and US-41.` },
  { slug:'cedar-rapids', name:'Cedar Rapids', state:'IA', dot:'Iowa DOT', lat:41.98, lon:-91.67, r:25,
    title:'Cedar Rapids Traffic Cameras | MileCheck', h1:'Cedar Rapids traffic cameras', cityPage:true,
    desc:'Cedar Rapids traffic cameras on one map. Iowa DOT highway cameras on I-380 and other main roads, with the latest image from each.',
    sub:'See Cedar Rapids traffic before you leave. Iowa DOT highway cameras around Cedar Rapids on one map. Tap any camera for the latest image.',
    blurb:`Iowa DOT runs the highway cameras around Cedar Rapids.`,
    freeways:`Watch I-380, US-30, IA-100 and US-151.` },
  { slug:'quad-cities', name:'Quad Cities', state:'IA', dot:'Iowa DOT', lat:41.52, lon:-90.58, r:25,
    title:'Quad Cities Traffic Cameras | MileCheck', h1:'Quad Cities traffic cameras', cityPage:true,
    desc:'Quad Cities traffic cameras on one map. Iowa DOT highway cameras on I-74 and other main roads, with the latest image from each.',
    sub:'See Quad Cities traffic before you leave. Iowa DOT highway cameras around Quad Cities on one map. Tap any camera for the latest image.',
    blurb:`Iowa DOT runs the highway cameras around Quad Cities.`,
    freeways:`Watch I-74, I-80, I-280 and US-67.` },
  { slug:'kansas-city', name:'Kansas City', state:'KS', dot:'KDOT', extra:'MO', extraDot:'MoDOT', video:true, lat:39.11, lon:-94.7, r:25,
    title:'Kansas City Traffic Cameras | MileCheck', h1:'Kansas City traffic cameras', cityPage:true,
    desc:'Kansas City traffic cameras on one map. KDOT cameras on the Kansas side and MoDOT live video cameras on the Missouri side, on I-435, I-35, I-70 and I-29.',
    sub:'See Kansas City traffic before you leave. KDOT and MoDOT highway cameras on one map. Tap any camera for its latest image or live video.',
    blurb:`KDOT runs the cameras on the Kansas side and MoDOT the live video cameras on the Missouri side.`,
    freeways:`Watch I-435, I-35, I-70, US-69 and I-635.` },
  { slug:'saint-paul', name:'Saint Paul', state:'MN', dot:'MnDOT', lat:44.95, lon:-93.09, r:15,
    title:'Saint Paul Traffic Cameras | MileCheck', h1:'Saint Paul traffic cameras', cityPage:true,
    desc:'Saint Paul traffic cameras on one map. MnDOT highway cameras on I-94 and other main roads, with the latest image from each.',
    sub:'See Saint Paul traffic before you leave. MnDOT highway cameras around Saint Paul on one map. Tap any camera for the latest image.',
    blurb:`MnDOT runs the highway cameras around Saint Paul.`,
    freeways:`Watch I-94, I-35W, I-35E, MN-36 and US-61.` },
  { slug:'duluth', name:'Duluth', state:'MN', dot:'MnDOT', lat:46.79, lon:-92.1, r:25,
    title:'Duluth Traffic Cameras | MileCheck', h1:'Duluth traffic cameras', cityPage:true,
    desc:'Duluth traffic cameras on one map. MnDOT highway cameras on I-35 and other main roads, with the latest image from each.',
    sub:'See Duluth traffic before you leave. MnDOT highway cameras around Duluth on one map. Tap any camera for the latest image.',
    blurb:`MnDOT runs the highway cameras around Duluth.`,
    freeways:`Watch I-35, US-53, MN-210, I-535 and MN-194.` },
  { slug:'rochester-mn', name:'Rochester, MN', state:'MN', dot:'MnDOT', lat:44.02, lon:-92.47, r:20,
    title:'Rochester, MN Traffic Cameras | MileCheck', h1:'Rochester, MN traffic cameras', cityPage:true,
    desc:'Rochester, MN traffic cameras on one map. MnDOT highway cameras on US-14 and other main roads, with the latest image from each.',
    sub:'See Rochester, MN traffic before you leave. MnDOT highway cameras around Rochester, MN on one map. Tap any camera for the latest image.',
    blurb:`MnDOT runs the highway cameras around Rochester, MN.`,
    freeways:`Watch US-14, US-52 and US-63.` },
  { slug:'coeur-d-alene', name:'Coeur d’Alene', state:'ID', dot:'ITD', lat:47.68, lon:-116.78, r:25,
    title:'Coeur d’Alene Traffic Cameras | MileCheck', h1:'Coeur d’Alene traffic cameras', cityPage:true,
    desc:'Coeur d’Alene traffic cameras on one map. ITD highway cameras on US-95 and other main roads, with the latest image from each.',
    sub:'See Coeur d’Alene traffic before you leave. ITD highway cameras around Coeur d’Alene on one map. Tap any camera for the latest image.',
    blurb:`ITD runs the highway cameras around Coeur d’Alene.`,
    freeways:`Watch US-95 and I-90.` },
  { slug:'cheyenne', name:'Cheyenne', state:'WY', dot:'WYDOT', lat:41.14, lon:-104.82, r:30,
    title:'Cheyenne Traffic Cameras | MileCheck', h1:'Cheyenne traffic cameras', cityPage:true,
    desc:'Cheyenne traffic cameras on one map. WYDOT highway cameras on I-80 and other main roads, with the latest image from each.',
    sub:'See Cheyenne traffic before you leave. WYDOT highway cameras around Cheyenne on one map. Tap any camera for the latest image.',
    blurb:`WYDOT runs the highway cameras around Cheyenne.`,
    freeways:`Watch I-80 and I-25.` },
  { slug:'bismarck', name:'Bismarck', state:'ND', dot:'NDDOT', lat:46.81, lon:-100.78, r:25,
    title:'Bismarck Traffic Cameras | MileCheck', h1:'Bismarck traffic cameras', cityPage:true,
    desc:'Bismarck traffic cameras on one map. NDDOT highway cameras on I-94 and other main roads, with the latest image from each.',
    sub:'See Bismarck traffic before you leave. NDDOT highway cameras around Bismarck on one map. Tap any camera for the latest image.',
    blurb:`NDDOT runs the highway cameras around Bismarck.`,
    freeways:`Watch I-94 and US-83.` },
  { slug:'fairbanks', name:'Fairbanks', state:'AK', dot:'Alaska DOT&PF', lat:64.84, lon:-147.72, r:40, anyRoute:true,
    title:'Fairbanks Traffic Cameras | MileCheck', h1:'Fairbanks traffic cameras', cityPage:true,
    desc:'Fairbanks traffic cameras on one map. Alaska DOT&PF highway cameras around Fairbanks, with the latest image from each.',
    sub:'See Fairbanks traffic before you leave. Alaska DOT&PF highway cameras around Fairbanks on one map. Tap any camera for the latest image.',
    blurb:`Alaska DOT&PF runs the highway cameras around Fairbanks.`,
    freeways:`The map shows the Alaska DOT&PF cameras around Fairbanks.` },
  { slug:'bakersfield', name:'Bakersfield', state:'CA', dot:'Caltrans', lat:35.37, lon:-119.02, r:35,
    title:'Bakersfield Traffic Cameras | MileCheck', h1:'Bakersfield traffic cameras', cityPage:true,
    desc:'Bakersfield traffic cameras on one map. Caltrans highway cameras on SR-99 and other main roads, with the latest image from each.',
    sub:'See Bakersfield traffic before you leave. Caltrans highway cameras around Bakersfield on one map. Tap any camera for the latest image.',
    blurb:`Caltrans runs the highway cameras around Bakersfield.`,
    freeways:`Watch SR-99, SR-58 and I-5.` },
  { slug:'riverside', name:'Riverside', state:'CA', dot:'Caltrans', lat:33.95, lon:-117.4, r:30,
    title:'Riverside Traffic Cameras | MileCheck', h1:'Riverside traffic cameras', cityPage:true,
    desc:'Riverside traffic cameras on one map. Caltrans highway cameras on I-15 and other main roads, with the latest image from each.',
    sub:'See Riverside traffic before you leave. Caltrans highway cameras around Riverside on one map. Tap any camera for the latest image.',
    blurb:`Caltrans runs the highway cameras around Riverside.`,
    freeways:`Watch I-15, I-215, I-10, SR-60 and I-210.` },
  { slug:'san-jose', name:'San Jose', state:'CA', dot:'Caltrans', lat:37.34, lon:-121.89, r:30,
    title:'San Jose Traffic Cameras | MileCheck', h1:'San Jose traffic cameras', cityPage:true,
    desc:'San Jose traffic cameras on one map. Caltrans highway cameras on US-101 and other main roads, with the latest image from each.',
    sub:'See San Jose traffic before you leave. Caltrans highway cameras around San Jose on one map. Tap any camera for the latest image.',
    blurb:`Caltrans runs the highway cameras around San Jose.`,
    freeways:`Watch US-101, I-880, SR-17, SR-85 and I-680.` },
  { slug:'oakland', name:'Oakland', state:'CA', dot:'Caltrans', lat:37.8, lon:-122.27, r:15,
    title:'Oakland Traffic Cameras | MileCheck', h1:'Oakland traffic cameras', cityPage:true,
    desc:'Oakland traffic cameras on one map. Caltrans highway cameras on I-80 and other main roads, with the latest image from each.',
    sub:'See Oakland traffic before you leave. Caltrans highway cameras around Oakland on one map. Tap any camera for the latest image.',
    blurb:`Caltrans runs the highway cameras around Oakland.`,
    freeways:`Watch I-80, I-880, SR-123, I-580 and US-101.` },
  { slug:'redding', name:'Redding', state:'CA', dot:'Caltrans', lat:40.59, lon:-122.39, r:30,
    title:'Redding Traffic Cameras | MileCheck', h1:'Redding traffic cameras', cityPage:true,
    desc:'Redding traffic cameras on one map. Caltrans highway cameras on I-5 and other main roads, with the latest image from each.',
    sub:'See Redding traffic before you leave. Caltrans highway cameras around Redding on one map. Tap any camera for the latest image.',
    blurb:`Caltrans runs the highway cameras around Redding.`,
    freeways:`Watch I-5, SR-299 and SR-273.` },
  { slug:'stockton', name:'Stockton', state:'CA', dot:'Caltrans', lat:37.96, lon:-121.29, r:25,
    title:'Stockton Traffic Cameras | MileCheck', h1:'Stockton traffic cameras', cityPage:true,
    desc:'Stockton traffic cameras on one map. Caltrans highway cameras on I-5 and other main roads, with the latest image from each.',
    sub:'See Stockton traffic before you leave. Caltrans highway cameras around Stockton on one map. Tap any camera for the latest image.',
    blurb:`Caltrans runs the highway cameras around Stockton.`,
    freeways:`Watch I-5, SR-99, SR-120, SR-4 and I-205.` },
  { slug:'hamilton', name:'Hamilton', state:'ON', dot:'Ontario 511', lat:43.26, lon:-79.87, r:25,
    title:'Hamilton Traffic Cameras | MileCheck', h1:'Hamilton traffic cameras', cityPage:true,
    desc:'Hamilton traffic cameras on one map. Ontario 511 highway cameras on QEW and other main roads, with the latest image from each.',
    sub:'See Hamilton traffic before you leave. Ontario 511 highway cameras around Hamilton on one map. Tap any camera for the latest image.',
    blurb:`Ontario 511 runs the highway cameras around Hamilton.`,
    freeways:`Watch QEW, ON-6 and ON-403.` },
  { slug:'victoria', name:'Victoria', state:'BC', dot:'DriveBC', lat:48.43, lon:-123.37, r:25,
    title:'Victoria Traffic Cameras | MileCheck', h1:'Victoria traffic cameras', cityPage:true,
    desc:'Victoria traffic cameras on one map. DriveBC highway cameras on BC-1 and other main roads, with the latest image from each.',
    sub:'See Victoria traffic before you leave. DriveBC highway cameras around Victoria on one map. Tap any camera for the latest image.',
    blurb:`DriveBC runs the highway cameras around Victoria.`,
    freeways:`Watch BC-1, BC-17 and BC-14.` },
  // Video cities (2026-11-06): these feeds are live video (HLS) only, so the page uses the state pages' player (video:true).
  // Road lists are the routes with the most cameras in the feed. anyRoute: every camera the agency lists in the radius.
  { slug:'montreal', name:'Montreal', state:'QC', dot:'Québec 511', lat:45.5, lon:-73.57, r:30, anyRoute:true, video:true,
    title:'Montreal Traffic Cameras | MileCheck', h1:'Montreal traffic cameras', cityPage:true,
    desc:'Montreal traffic cameras on one map. Québec 511 live video cameras on A-40 and other main roads.',
    sub:'See Montreal traffic before you leave. Québec 511 live video cameras around Montreal on one map. Tap any camera to play it.',
    blurb:`Québec 511 runs these cameras. They are live video streams, a few seconds behind the road.`,
    freeways:`Watch A-40, A-15, A-20, A-13 and R-136.` },
  { slug:'quebec-city', name:'Quebec City', state:'QC', dot:'Québec 511', lat:46.81, lon:-71.21, r:25, anyRoute:true, video:true,
    title:'Quebec City Traffic Cameras | MileCheck', h1:'Quebec City traffic cameras', cityPage:true,
    desc:'Quebec City traffic cameras on one map. Québec 511 live video cameras on A-73 and other main roads.',
    sub:'See Quebec City traffic before you leave. Québec 511 live video cameras around Quebec City on one map. Tap any camera to play it.',
    blurb:`Québec 511 runs these cameras. They are live video streams, a few seconds behind the road.`,
    freeways:`Watch A-73, A-40, A-440, A-20 and A-740.` },
  { slug:'gatineau', name:'Gatineau', state:'QC', dot:'Québec 511', lat:45.48, lon:-75.7, r:15, anyRoute:true, video:true,
    title:'Gatineau Traffic Cameras | MileCheck', h1:'Gatineau traffic cameras', cityPage:true,
    desc:'Gatineau traffic cameras on one map. Québec 511 live video cameras on A-50 and other main roads.',
    sub:'See Gatineau traffic before you leave. Québec 511 live video cameras around Gatineau on one map. Tap any camera to play it.',
    blurb:`Québec 511 runs these cameras. They are live video streams, a few seconds behind the road.`,
    freeways:`Watch A-50, A-5, R-148, R-105 and R-307.` },
  { slug:'nashville', name:'Nashville', state:'TN', dot:'TDOT SmartWay', lat:36.16, lon:-86.78, r:40, anyRoute:true, video:true,
    title:'Nashville Traffic Cameras | MileCheck', h1:'Nashville traffic cameras', cityPage:true,
    desc:'Nashville traffic cameras on one map. TDOT SmartWay live video cameras on I-24 and other main roads.',
    sub:'See Nashville traffic before you leave. TDOT SmartWay live video cameras around Nashville on one map. Tap any camera to play it.',
    blurb:`TDOT SmartWay runs these cameras. They are live video streams, a few seconds behind the road.`,
    freeways:`Watch I-24, I-40, I-65, I-440 and I-840.` },
  { slug:'memphis', name:'Memphis', state:'TN', dot:'TDOT SmartWay', lat:35.15, lon:-90.05, r:35, anyRoute:true, video:true,
    title:'Memphis Traffic Cameras | MileCheck', h1:'Memphis traffic cameras', cityPage:true,
    desc:'Memphis traffic cameras on one map. TDOT SmartWay live video cameras on I-40 and other main roads.',
    sub:'See Memphis traffic before you leave. TDOT SmartWay live video cameras around Memphis on one map. Tap any camera to play it.',
    blurb:`TDOT SmartWay runs these cameras. They are live video streams, a few seconds behind the road.`,
    freeways:`Watch I-40, I-55, I-240 and TN-385.` },
  { slug:'knoxville', name:'Knoxville', state:'TN', dot:'TDOT SmartWay', lat:35.96, lon:-83.92, r:30, anyRoute:true, video:true,
    title:'Knoxville Traffic Cameras | MileCheck', h1:'Knoxville traffic cameras', cityPage:true,
    desc:'Knoxville traffic cameras on one map. TDOT SmartWay live video cameras on I-40 and other main roads.',
    sub:'See Knoxville traffic before you leave. TDOT SmartWay live video cameras around Knoxville on one map. Tap any camera to play it.',
    blurb:`TDOT SmartWay runs these cameras. They are live video streams, a few seconds behind the road.`,
    freeways:`Watch I-40, I-140, I-640, I-75 and I-275.` },
  { slug:'chattanooga', name:'Chattanooga', state:'TN', dot:'TDOT SmartWay', lat:35.05, lon:-85.31, r:30, anyRoute:true, video:true,
    title:'Chattanooga Traffic Cameras | MileCheck', h1:'Chattanooga traffic cameras', cityPage:true,
    desc:'Chattanooga traffic cameras on one map. TDOT SmartWay live video cameras on I-24 and other main roads.',
    sub:'See Chattanooga traffic before you leave. TDOT SmartWay live video cameras around Chattanooga on one map. Tap any camera to play it.',
    blurb:`TDOT SmartWay runs these cameras. They are live video streams, a few seconds behind the road.`,
    freeways:`Watch I-24, I-75, TN-153 and US-27.` },
  { slug:'st-louis', name:'St. Louis', state:'MO', dot:'MoDOT', lat:38.63, lon:-90.2, r:40, anyRoute:true, video:true,
    title:'St. Louis Traffic Cameras | MileCheck', h1:'St. Louis traffic cameras', cityPage:true,
    desc:'St. Louis traffic cameras on one map. MoDOT live video cameras on I-44 and other main roads.',
    sub:'See St. Louis traffic before you leave. MoDOT live video cameras around St. Louis on one map. Tap any camera to play it.',
    blurb:`MoDOT runs these cameras. They are live video streams, a few seconds behind the road.`,
    freeways:`Watch I-44, I-64, I-270, MO-141 and I-70.` },
  { slug:'springfield-mo', name:'Springfield, MO', state:'MO', dot:'MoDOT', lat:37.21, lon:-93.29, r:30, anyRoute:true, video:true,
    title:'Springfield, MO Traffic Cameras | MileCheck', h1:'Springfield, MO traffic cameras', cityPage:true,
    desc:'Springfield, MO traffic cameras on one map. MoDOT live video cameras on US-65 and other main roads.',
    sub:'See Springfield, MO traffic before you leave. MoDOT live video cameras around Springfield, MO on one map. Tap any camera to play it.',
    blurb:`MoDOT runs these cameras. They are live video streams, a few seconds behind the road.`,
    freeways:`Watch US-65, I-44, US-160 and US-60.` },
  { slug:'baltimore', name:'Baltimore', state:'MD', dot:'MDOT SHA', lat:39.29, lon:-76.61, r:35, anyRoute:true, video:true,
    title:'Baltimore Traffic Cameras | MileCheck', h1:'Baltimore traffic cameras', cityPage:true,
    desc:'Baltimore traffic cameras on one map. MDOT SHA live video cameras on I-95 and other main roads.',
    sub:'See Baltimore traffic before you leave. MDOT SHA live video cameras around Baltimore on one map. Tap any camera to play it.',
    blurb:`MDOT SHA runs these cameras. They are live video streams, a few seconds behind the road.`,
    freeways:`Watch I-95, I-695, I-895, US-1 and I-83.` },
  { slug:'annapolis', name:'Annapolis', state:'MD', dot:'MDOT SHA', lat:38.98, lon:-76.49, r:20, anyRoute:true, video:true,
    title:'Annapolis Traffic Cameras | MileCheck', h1:'Annapolis traffic cameras', cityPage:true,
    desc:'Annapolis traffic cameras on one map. MDOT SHA live video cameras on US-50 and other main roads.',
    sub:'See Annapolis traffic before you leave. MDOT SHA live video cameras around Annapolis on one map. Tap any camera to play it.',
    blurb:`MDOT SHA runs these cameras. They are live video streams, a few seconds behind the road.`,
    freeways:`Watch US-50, US-301, I-97 and MD-100.` },
  { slug:'wilmington-de', name:'Wilmington, DE', state:'DE', dot:'DelDOT', lat:39.74, lon:-75.55, r:25, anyRoute:true, video:true,
    title:'Wilmington, DE Traffic Cameras | MileCheck', h1:'Wilmington, DE traffic cameras', cityPage:true,
    desc:'Wilmington, DE traffic cameras on one map. DelDOT live video cameras on I-95 and other main roads.',
    sub:'See Wilmington, DE traffic before you leave. DelDOT live video cameras around Wilmington, DE on one map. Tap any camera to play it.',
    blurb:`DelDOT runs these cameras. They are live video streams, a few seconds behind the road.`,
    freeways:`Watch I-95, US-13, DE-2, DE-1 and DE-273.` },
  { slug:'dover', name:'Dover, DE', state:'DE', dot:'DelDOT', lat:39.16, lon:-75.52, r:25, anyRoute:true, video:true,
    title:'Dover, DE Traffic Cameras | MileCheck', h1:'Dover, DE traffic cameras', cityPage:true,
    desc:'Dover, DE traffic cameras on one map. DelDOT live video cameras on US-13 and other main roads.',
    sub:'See Dover, DE traffic before you leave. DelDOT live video cameras around Dover, DE on one map. Tap any camera to play it.',
    blurb:`DelDOT runs these cameras. They are live video streams, a few seconds behind the road.`,
    freeways:`Watch US-13, DE-1 and DE-8.` },
  { slug:'charleston-wv', name:'Charleston, WV', state:'WV', dot:'WV511', lat:38.35, lon:-81.63, r:30, anyRoute:true, video:true,
    title:'Charleston, WV Traffic Cameras | MileCheck', h1:'Charleston, WV traffic cameras', cityPage:true,
    desc:'Charleston, WV traffic cameras on one map. WV511 live video cameras on I-64 and other main roads.',
    sub:'See Charleston, WV traffic before you leave. WV511 live video cameras around Charleston, WV on one map. Tap any camera to play it.',
    blurb:`WV511 runs these cameras. They are live video streams, a few seconds behind the road.`,
    freeways:`Watch I-64, I-77, US-119 and US-60.` },
];

// California (2026-10-02): Caltrans postmiles restart at every county line, so the
// number is a "postmile", not a mile marker, and the app labels it "PM 47.2 (Kern)"
// (src/utils/cameraLabel.ts). The four California metros say the same thing; every
// other city keeps the strings it always had.
const CANADA = new Set(['BC','AB','ON','MB','QC','SK','NS','NB']);
const marker = (c) => c.state === 'CA' ? 'postmile' : CANADA.has(c.state) ? 'kilometre marker' : 'mile marker';

function faq(c){
  const ss=STATE_SLUG[c.state], sn=STATE_NAME[c.state];
  // City pages (2026-11-05, after the ChatGPT copy review): no "free" question, no claim that the app follows the
  // nearest camera, markers only "where the agency provides one", and BC is a province.
  if (c.cityPage) {
    const whole = CANADA.has(c.state) ? 'For cameras across the province' : 'For cameras across the state';
    return [
      [`Where can I see ${c.name} traffic cameras?`,
        `On the <a href="#comap">map above</a>. ${c.cityLayer ? 'Green dots are ' : 'The dots are '}${c.dot} highway cameras, with the route and ${marker(c)} where the agency provides one. ${c.cityLayer ? `Orange dots are City of ${c.name} cameras. ` : ''}${whole}, see <a href="../${ss}/">${sn} traffic cameras</a>.`],
      [`Do I need an account to view the cameras?`,
        `No. You can view the cameras on this website without an account. The <a href="/get/" target="_blank" rel="noopener">MileCheck app</a> is a paid subscription with a free trial. It shows highway cameras and your ${marker(c)} as you drive.${c.cityLayer ? ' City street cameras are on this website only.' : ''}`],
      [`Which highways have cameras in ${c.name}?`, c.freeways],
      [`How do I check ${c.name} traffic before I leave?`,
        `Open the <a href="#comap">map above</a> and tap a camera near your route to see its latest image. Images refresh every few minutes, so check the time on the picture. The app updates your ${marker(c)} as you drive.`],
    ];
  }
  return [
    [`Where can I watch live ${c.name} traffic cameras?`,
      `Right here — the <a href="#comap">map above</a> shows live ${c.dot} cameras across the ${c.name} area, each tagged with its route and ${marker(c)}. For the whole state, see <a href="../${ss}/">${sn} traffic cameras</a>.`],
    [`Are ${c.name} traffic cameras free?`,
      `Yes. ${c.dot} publishes its traffic cameras publicly, and MileCheck puts the ${c.name} ones on one map, with no account needed. To have the nearest camera follow you as you drive, the <a href="https://apps.apple.com/us/app/milecheck/id6759212851" target="_blank" rel="noopener">MileCheck app</a> does it hands-free on CarPlay and Android Auto.`],
    [`Which freeways have cameras in ${c.name}?`, c.freeways],
    [`How do I check ${c.name} traffic before I leave?`,
      `Open the <a href="#comap">live map above</a> and tap any camera near your route to see the road right now. Conditions change fast in a busy metro, so check just before you go — and in the app, the nearest camera and your ${marker(c)} update automatically as you drive.`],
  ];
}
function faqJsonLd(c){ return JSON.stringify({'@context':'https://schema.org','@type':'FAQPage','mainEntity':faq(c).map(([q,a])=>({'@type':'Question','name':q,'acceptedAnswer':{'@type':'Answer','text':a.replace(/<[^>]+>/g,'')}}))}); }
function crumbJsonLd(c){ return JSON.stringify({'@context':'https://schema.org','@type':'BreadcrumbList','itemListElement':[{'@type':'ListItem','position':1,'name':'MileCheck','item':'https://milecheckapp.com/'},{'@type':'ListItem','position':2,'name':'Cameras','item':'https://milecheckapp.com/cameras/'},{'@type':'ListItem','position':3,'name':c.name+' Cameras','item':'https://milecheckapp.com/cameras/'+c.slug+'/'}]}); }

// Video (HLS) cameras: the same player the state pages use (copied from the built Tennessee page at generation time).
const STREAM_RUNTIME=(()=>{try{const t=fs.readFileSync(path.join('cameras','tennessee','index.html'),'utf8');const a=t.indexOf('var hlsInst=null');const m=t.indexOf('function streamOffline');const b=t.indexOf('\n',m);return a>0&&m>a?t.slice(a,b+1):'';}catch(e){return '';}})();
function videoRuntime(c){
  if(!STREAM_RUNTIME)throw new Error('stream runtime not found in cameras/tennessee/index.html');
  const lbl=CANADA.has(c.state)?'KM':'MP';
  return `const _imgCard=camCard;camCard=function(c){if(!c.stream)return _imgCard(c);return '<div class="cc-title">'+esc(c.title)+'</div><div class="cc-meta">'+esc(c.route||'')+(c.mp>0?' · ${lbl} '+Math.round(c.mp):'')+' · live video from '+(c.dot||DOT)+'</div><video class="cc-img" id="ccVid" controls muted playsinline autoplay preload="none" aria-label="Live video: '+esc(c.title)+'"></video><div class="cc-meta">A live stream, a few seconds behind the road. Tap play if it does not start.</div>';};\n`+STREAM_RUNTIME;
}
function page(c){
  const sp = SPON.slot({ kind: 'cameras', slug: c.slug, state: c.state, name: c.name });
  const faqHtml=faq(c).map(([q,a])=>`    <details><summary>${q}</summary><p>${a}</p></details>`).join('\n');
  const ss=STATE_SLUG[c.state], sn=STATE_NAME[c.state];
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta name="apple-itunes-app" content="app-id=6759212851">
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${c.title || `${c.name} Traffic Cameras — Live ${c.dot} Freeway Cams | MileCheck`}</title>
  <meta name="description" content="${c.desc || `Watch live ${c.name} traffic cameras on one map — ${c.dot} freeway and highway cameras across the metro, each tagged with route and ${marker(c)}. See traffic before you leave.`}">
  <link rel="canonical" href="https://milecheckapp.com/cameras/${c.slug}/">
${ES_PAGES.has(c.slug) ? `  <link rel="alternate" hreflang="en" href="https://milecheckapp.com/cameras/${c.slug}/">\n  <link rel="alternate" hreflang="es" href="https://milecheckapp.com/es/cameras/${c.slug}/">\n${PT_PAGES.has(c.slug) ? `  <link rel="alternate" hreflang="pt" href="https://milecheckapp.com/pt/cameras/${c.slug}/">\n` : ''}  <link rel="alternate" hreflang="x-default" href="https://milecheckapp.com/cameras/${c.slug}/">` : ''}
  <meta property="og:title" content="${c.title || `${c.name} Traffic Cameras — Live | MileCheck`}">
  <meta property="og:description" content="${c.desc || `Live ${c.name} freeway cameras on one map, each tagged with route and ${marker(c)}.`}">
  <meta property="og:image" content="https://milecheckapp.com/images/og-banner-light.png">
  <meta property="og:url" content="https://milecheckapp.com/cameras/${c.slug}/">
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
    .co-hero .spon{margin:0 0 18px;}
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
${sp.css}
  </style>
  <!-- Shared map behavior for every Leaflet map: assets/map-kit.css + .js. Change maps there, not per page. -->
  <link rel="stylesheet" href="/assets/map-kit.css">
  <script src="/assets/map-kit.js" defer></script>
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
        <a href="/get/" class="nav-cta">Get the app</a>
      </nav>
    </div>
  </header>

  <div class="co-hero">
${sp.html}
${ES_PAGES.has(c.slug) ? `    <p class="lang-switch" style="font-size:12.5px;color:#5b6670;margin:0 0 8px"><b lang="en">English</b> · <a href="/es/cameras/${c.slug}/" hreflang="es" lang="es">Español</a>${PT_PAGES.has(c.slug) ? ` · <a href="/pt/cameras/${c.slug}/" hreflang="pt" lang="pt-BR">Português</a>` : ''}</p>\n` : ''}    <div class="eyebrow">Live traffic cameras · ${c.name} · ${c.dot}</div>
    <h1>${c.h1 || `${c.name} traffic cameras, live`}</h1>
    <p class="sub">${c.sub || `See ${c.name} traffic before you leave. Live ${c.dot} freeway cameras across the metro on one map, each tagged with its route and ${marker(c)}. Tap any camera for the latest image.`}</p>
${c.crossLinkHtml || ''}
    <div class="co-stats">
      <div class="co-stat"><div class="n live" id="statCams">—</div><div class="l">live cameras in ${c.name}</div></div>
      <div class="co-stat"><div class="n" style="font-size:16px;padding-top:4px">${c.dot}</div><div class="l">camera source</div></div>
    </div>
  </div>

  <div class="co-wrap">
    <div style="position:relative;">
      <div id="comap"></div>
      <div class="co-bs" id="coStatus">Loading live ${c.name} cameras…</div>
      <div class="co-card" id="coCard"></div>
    </div>
  </div>

  <section class="co-guide">
    <h2>${c.cityPage ? 'Traffic cameras' : 'Live traffic cameras'} across ${c.name}</h2>
    <p>${c.blurb}</p>
    <p>${c.freeways}</p>
    <p>Every camera on this map comes straight from ${c.dot} and is tagged with the route and ${marker(c)} where the agency provides it.${c.state === 'CA' ? ' Caltrans postmiles restart at each county line, so every label carries the county.' : ''} Tap a camera dot to open its latest image; tap the image to see it full-size. For cameras beyond the metro, see <a href="../${ss}/">${sn} traffic cameras</a> or <a href="../">every highway camera</a>.</p>
  </section>

  <section class="co-faq">
    <h2>${c.name} traffic camera questions, answered</h2>
${faqHtml}
  </section>

  <div class="co-cta">
    <h2>${c.cityPage ? `MileCheck for driving in and around ${c.name}` : `Check the nearest ${c.name} camera before you go`}</h2>
    <p>${c.cityPage ? `The MileCheck app shows your ${marker(c)} as you drive, highway cameras, and live road alerts on your route. It runs on CarPlay and Android Auto.${c.cityLayer ? ' City street cameras are on this website only.' : ''}` : `In the MileCheck app, the nearest camera and your exact ${marker(c)} follow you hands-free on ${c.name}'s freeways, plus live state DOT feeds on your route. Works offline and runs on CarPlay and Android Auto.`}</p>
    <div class="btns">
      <a class="primary" href="https://apps.apple.com/us/app/milecheck/id6759212851" target="_blank" rel="noopener">iOS App Store</a>
      <a class="ghost" href="https://play.google.com/store/apps/details?id=app.milecheck.mobile" target="_blank" rel="noopener">Google Play</a>
    </div>
  </div>

  <p class="co-related">More: <a href="../${ss}/">${sn} cameras</a> · <a href="../">all highway cameras</a> · <a href="../../corridors/">interstate corridors</a> · <a href="../../maps/">all maps</a></p>

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
            <li><a href="https://milecheckapp.com/milecheck-privacy/">Privacy policy</a></li>
          </ul>
        </div>
      </div>
      <p class="footer-fineprint">&copy; 2026 MileCheck LLC. Camera data: ${c.dot} via MileCheck. Always drive to conditions and follow posted signs.</p>
      <p class="footer-fineprint footer-disclosure">MileCheck is a participant in the Amazon Services LLC Associates Program. As an Amazon Associate I earn from qualifying purchases.</p>
    </div>
  </footer>

${sp.js}
<script>(function(){var t=document.querySelector(".nav-toggle"),n=document.querySelector(".primary-nav");if(t&&n){t.addEventListener("click",function(){n.classList.toggle("open");});document.addEventListener("click",function(e){if(!e.target.closest(".header-inner"))n.classList.remove("open");})}})();</script>

<script>
const WORKER='https://api.milecheckapp.com';
const CODE=${JSON.stringify(c.state)};window.mcExtraLayers={state:CODE,fires:false};
const DOT=${JSON.stringify(c.dot)};
const CTR=[${c.lat},${c.lon}], RKM=${c.r};
const ROAD_RE=/^(I|US|SR|SH|WA|OR|UT|MT|AZ|AL|NV|WI|NY|LA|GA|SC|CA|SD|FL|MI|VT|NH|ME|PA|CT|QEW|BC|ON|AB|M|Loop|\\d)[- ]?\\d*/i;
const FERRY_RE=/ferr/i;
function km(a,b,c,d){const R=6371,p=Math.PI/180;const x=Math.sin((c-a)*p/2)**2+Math.cos(a*p)*Math.cos(c*p)*Math.sin((d-b)*p/2)**2;return 2*R*Math.asin(Math.sqrt(x));}
const TOUCH=('ontouchstart' in window);const RS=v=>TOUCH?Math.round(v*1.6):v;const map=L.map('comap',{gestureHandling:('ontouchstart' in window),scrollWheelZoom:true,preferCanvas:true,renderer:L.canvas({tolerance:('ontouchstart' in window)?14:6})});
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',{attribution:'Esri, USGS · ${c.name} cameras: ${c.dot} via MileCheck',maxZoom:17}).addTo(map);
map.setView(CTR,11);
const camLayer=L.layerGroup().addTo(map);
let CAMS=[];
function esc(x){return String(x==null?'':x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
const cardEl=document.getElementById('coCard');
${c.video ? `function showCard(html){if(window.stopStream)stopStream();cardEl.innerHTML='<button class="cx" aria-label="Close">×</button>'+html;cardEl.style.display='block';cardEl.querySelector('.cx').onclick=function(){cardEl.style.display='none';if(window.stopStream)stopStream();};}` : `function showCard(html){cardEl.innerHTML='<button class="cx" aria-label="Close">×</button>'+html;cardEl.style.display='block';cardEl.querySelector('.cx').onclick=function(){cardEl.style.display='none';};}`}
${c.state === 'CA' ? `// CA postmiles are county-relative, so the label is the app's: "SR-99 · PM 21.1 (Kern)" (src/utils/cameraLabel.ts, 2026-10-02).
function fmtMile(m){var r=Math.round(m*10)/10;return r%1===0?String(r):r.toFixed(1);}
function camCard(c){const bust=c.img+(c.img.includes('?')?'&':'?')+'t='+Date.now();return '<div class="cc-title">'+esc(c.title)+'</div><div class="cc-meta">'+esc(c.route||'')+(c.mp>0?' · PM '+fmtMile(c.mp)+(c.county?' ('+esc(c.county)+')':''):'')+' · '+DOT+'</div>` : `function camCard(c){const bust=c.img+(c.img.includes('?')?'&':'?')+'t='+Date.now();return '<div class="cc-title">'+esc(c.title)+'</div><div class="cc-meta">'+esc(c.route||'')+(c.mp>0?' · ${c.state === 'BC' ? 'KM' : 'MP'} '+Math.round(c.mp):'')+' · '+DOT+'</div>`}<a href="'+c.img+'" target="_blank" rel="noopener" title="Open full image"><img class="cc-img" src="'+bust+'" alt="Live: '+esc(c.title)+'" onerror="this.alt=\\'image unavailable\\'"></a>';}
${c.video ? videoRuntime(c) : ''}function thin(items,cellPx){const z=map.getZoom();if(z>=12||items.length<80)return items;const cell=cellPx*360/(256*Math.pow(2,z));const seen=new Set(),out=[];for(const it of items){const k=Math.round(it.lat/cell)+'|'+Math.round(it.lon/cell);if(seen.has(k))continue;seen.add(k);out.push(it);}return out;}
function draw(){camLayer.clearLayers();const b=map.getBounds();thin(CAMS.filter(c=>b.contains([c.lat,c.lon])),16).forEach(c=>L.circleMarker([c.lat,c.lon],{radius:RS(5),color:'#fff',weight:1.5,fillColor:FERRY_RE.test(c.route)?'#1d6fd1':'#0f7a4f',fillOpacity:.95}).on('click',()=>{showCard(camCard(c));${c.video ? 'if(c.stream)playStream(c.stream);' : ''}}).addTo(camLayer));document.getElementById('coStatus').textContent=CAMS.length?('📷 '+CAMS.length+' live cameras in ${c.name}'):'No cameras loaded — try again shortly.';}
let _t=null;map.on('moveend',()=>{clearTimeout(_t);_t=setTimeout(draw,200);});
async function fetchJSON(url,tries){for(let i=0;i<tries;i++){try{const r=await fetch(url);if(r.ok)return await r.json();}catch(e){}if(i<tries-1)await new Promise(res=>setTimeout(res,1200));}return null;}
${c.extra ? `Promise.all([fetchJSON(WORKER+'/cameras?state='+CODE,4),fetchJSON(WORKER+'/cameras?state=${c.extra}',4)]).then(([a,b])=>{
  // Two feeds (a metro that spans a state line). Each camera keeps its own agency name.
  const d=(a||b)?{cameras:((a&&a.cameras)||[]).map(x=>Object.assign({},x,{_dot:DOT})).concat(((b&&b.cameras)||[]).map(x=>Object.assign({},x,{_dot:${JSON.stringify(c.extraDot||'')}})))}:null;` : `fetchJSON(WORKER+'/cameras?state='+CODE,4).then(d=>{`}
  if(!d){document.getElementById('coStatus').textContent='Live cameras are busy right now — please refresh in a moment.';return;}
  CAMS=(d.cameras||[]).filter(c=>c.isActive!==false&&isFinite(+c.lat)&&+c.lat&&${c.video ? '(c.imageUrl||c.streamUrl)' : 'c.imageUrl'}&&(${c.anyRoute ? 'true' : `(ROAD_RE.test((c.route||'').trim())||FERRY_RE.test(c.route||''))`})&&km(CTR[0],CTR[1],+c.lat,+c.lon)<=RKM).map(c=>({lat:+c.lat,lon:+c.lon,title:c.title||'Traffic camera',route:(c.route||'').trim(),mp:c.mile,${c.state === 'CA' ? "county:(c.county||'').trim()," : ''}${c.video ? "img:c.imageUrl||'',stream:c.imageUrl?'':(c.streamUrl||'')," : 'img:c.imageUrl,'}${c.extra ? 'dot:c._dot||DOT,' : ''}}));
  document.getElementById('statCams').textContent=CAMS.length;
  draw();
});
</script>

</body>
</html>`;
}

// ONLY=austin,surrey node scripts/gen-city-camera-pages.js writes just those pages. The older metro pages have been
// finished by later scripts, so regenerating them all undoes that work; generate only what you changed.
const ONLY=(process.env.ONLY||'').split(',').map(x=>x.trim()).filter(Boolean);
let n=0;
for(const c of CITIES){
  if(ONLY.length&&!ONLY.includes(c.slug))continue;
  const dir=path.join('cameras',c.slug);
  fs.mkdirSync(dir,{recursive:true});
  let html=page(c);
  // Some states have no camera page of their own (Colorado, Rhode Island, Hawaii, Oklahoma on 2026-11-06): link the hub.
  const ss=STATE_SLUG[c.state], sn=STATE_NAME[c.state];
  if(!fs.existsSync(path.join('cameras',ss,'index.html'))){
    html=html.split(`<a href="../${ss}/">${sn} traffic cameras</a>`).join('<a href="../">highway cameras by state</a>')
             .split(`<a href="../${ss}/">${sn} cameras</a>`).join('<a href="../">highway cameras by state</a>');
  }
  fs.writeFileSync(path.join(dir,'index.html'),html);
  n++;
  console.log('wrote cameras/'+c.slug+'/index.html  ('+c.name+', '+c.dot+')');
}
console.log(SPON.summary());
console.log('\nGenerated '+n+' city camera pages.');
