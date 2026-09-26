# Sponsor page catalog & pricing — 2026-09-27

**Source of truth:** `data/sponsor-pages.json` (this file is generated from it — regenerate
rather than hand-editing if the page count changes). All 369 pages currently show
`"sponsor": "house"` — there are zero live sponsors on the site yet.

**Purpose:** send this (or a link to it) directly to a prospect once they've said yes in
principle, so they can browse by category and pick the specific page(s) that fit their
business, instead of the current all-manual "email and say which topic you want" flow on
`/sponsor/`.

## Pricing

**Catalog rate (this list) — volume-tiered, per page, per month:**

| Pages | Price per page / month |
|---|---|
| 1–10 | $75 |
| 11–50 | $60 |
| 50+ | $50 |

**Confirmed 2026-09-27 — how this coexists with the $49/mo single-page "founding rate" in**
**the wave 1/2/3 outreach emails, and the $99/mo "full topic family, nationwide" rate in the**
**outreach README:**

- The **$49 founding rate** is a hand-picked, personal-outreach offer for ONE specific page,
  sent while the program has zero live sponsors — it's never offered from this catalog. A
  sponsor who takes it keeps that $49 rate on that one page for as long as they stay
  subscribed, the same grandfather promise MileCheck already makes its own app subscribers
  when prices rise later.
- **This catalog's $75/$60/$50 volume pricing is the standing rate for everything else**:
  anyone browsing this list and self-selecting page(s), and any additional page a founding
  sponsor wants beyond the one they got at $49. The founding discount is the cost of landing
  sponsor #1 — it doesn't extend into a permanent volume discount.

**Per the existing decision recorded in `sponsor/index.html` and this folder's README:**
pricing stays unpublished on the public site ("email for pricing," on purpose) — this
catalog is for direct use with a prospect, not for publishing openly, unless that decision
changes.

## All 369 pages, by category

### Live data hubs (5)

The five biggest live-data pages on the site — borders, closures, ferries, fire, and weather. Highest-traffic single pages available.

| Page | Path |
|---|---|
| Border Crossing Wait Times — live US/Canada & US/Mexico | `/borders/` |
| Live US Road Closures Map — every state DOT, one map | `/closures/` |
| Live US Wildfire Map — active fires, acres, containment | `/fire/` |
| US Road Weather Map — storms, hurricanes & the closures they cause | `/weather/` |
| Washington Ferries Live — next sailings, space, cameras, boats on the map | `/ferries/` |

### Interstate corridors (12)

One page per major interstate (I-5, I-90, I-95, etc.) with live cameras, alerts, and conditions for that specific highway.

| Page | Path |
|---|---|
| I-10 Live Traffic Cameras & Road Conditions Right Now | `/corridors/i-10/` |
| I-15 Live Traffic Cameras & Road Conditions Right Now | `/corridors/i-15/` |
| I-4 Live Traffic Cameras & Road Conditions Right Now | `/corridors/i-4/` |
| I-40 Live Traffic Cameras & Road Conditions Right Now | `/corridors/i-40/` |
| I-5 Live Traffic Cameras & Road Conditions Right Now | `/corridors/i-5/` |
| I-70 Live Traffic Cameras & Road Conditions Right Now | `/corridors/i-70/` |
| I-75 Live Traffic Cameras & Road Conditions Right Now | `/corridors/i-75/` |
| I-80 Live Traffic Cameras & Road Conditions Right Now | `/corridors/i-80/` |
| I-90 Live Traffic Cameras & Road Conditions Right Now | `/corridors/i-90/` |
| I-94 Live Traffic Cameras & Road Conditions Right Now | `/corridors/i-94/` |
| I-95 Live Traffic Cameras & Road Conditions Right Now | `/corridors/i-95/` |
| Interstate Corridors — Live Cameras & Conditions on I-5, I-90, I-95, I-80, I-10 | `/corridors/` |

### Mountain passes (13)

Camera + live conditions pages for named mountain passes (Donner, Cajon, the Grapevine, Eisenhower Tunnel, etc.) — high-intent traffic right before a storm or closure.

| Page | Path |
|---|---|
| Cabbage Hill Cameras & Conditions Right Now (I-84) | `/passes/cabbage-hill/` |
| Cajon Pass Camera & Conditions Right Now (I-15) | `/passes/cajon/` |
| Donner Pass Camera & Conditions Right Now (I-80) | `/passes/donner/` |
| Eisenhower Tunnel Camera & Conditions Right Now (I-70) | `/passes/eisenhower/` |
| Mount Hood road cameras and conditions right now | `/mountains/hood/roads/` |
| Mount Rainier road cameras and conditions right now | `/mountains/rainier/roads/` |
| Mountain Pass Cameras & Conditions — Snoqualmie, Donner, the Grapevine & more | `/passes/` |
| Parleys Summit Camera & Conditions Right Now (I-80) | `/passes/parleys/` |
| Siskiyou Summit Camera & Conditions Right Now (I-5) | `/passes/siskiyou/` |
| Snoqualmie Pass Driving Conditions Now: I-90 Cameras & Chains | `/passes/snoqualmie/` |
| Stevens Pass Camera & Conditions Right Now (US-2) | `/passes/stevens/` |
| The Grapevine (Tejon Pass) Camera & Conditions Right Now (I-5) | `/passes/grapevine/` |
| Vail Pass Camera & Conditions Right Now (I-70) | `/passes/vail/` |

### Traffic cameras (73)

One page per state/province or metro area, showing that region's live highway camera feeds.

| Page | Path |
|---|---|
| Alabama Traffic Cameras — Live ALDOT (ALGO Traffic) Highway Cams | `/cameras/alabama/` |
| Alaska Traffic Cameras — Live AKDOT (511 Alaska) Highway Cams | `/cameras/alaska/` |
| Alberta Traffic Cameras — Live 511 Alberta Highway Cams | `/cameras/alberta/` |
| Arizona Traffic Cameras — Live ADOT (AZ511) Highway Cams | `/cameras/arizona/` |
| Arkansas Traffic Cameras — Live ARDOT (IDrive Arkansas) Highway Cams | `/cameras/arkansas/` |
| Atlanta Traffic Cameras — Live GDOT Freeway Cams | `/cameras/atlanta/` |
| Birmingham Traffic Cameras — Live ALDOT Freeway Cams | `/cameras/birmingham/` |
| British Columbia Traffic Cameras — Live DriveBC (BC Ministry of Transportation) Highway Cams | `/cameras/british-columbia/` |
| Buffalo Traffic Cameras — Live NYSDOT Freeway Cams | `/cameras/buffalo/` |
| California Traffic Cameras — Live Caltrans Highway Cams | `/cameras/california/` |
| Cincinnati Traffic Cameras — Live ODOT Freeway Cams | `/cameras/cincinnati/` |
| Cleveland Traffic Cameras — Live ODOT Freeway Cams | `/cameras/cleveland/` |
| Columbus Traffic Cameras — Live ODOT Freeway Cams | `/cameras/columbus/` |
| Connecticut Traffic Cameras — Live CTDOT (CTroads) Highway Cams | `/cameras/connecticut/` |
| Câmeras de trânsito em Orlando | `/pt/cameras/orlando/` |
| Câmeras de trânsito na Flórida | `/pt/cameras/florida/` |
| Delaware Traffic Cameras — Live DelDOT Highway Cams | `/cameras/delaware/` |
| Detroit Traffic Cameras — Live MDOT Freeway Cams | `/cameras/detroit/` |
| Florida Traffic Cameras — Live FDOT (FL511) Highway Cams | `/cameras/florida/` |
| Georgia Traffic Cameras — Live GDOT (511GA) Highway Cams | `/cameras/georgia/` |
| Idaho Traffic Cameras — Live ITD (511 Idaho) Highway Cams | `/cameras/idaho/` |
| Illinois Traffic Cameras — Live IDOT (Getting Around Illinois) Highway Cams | `/cameras/illinois/` |
| Indiana Traffic Cameras — Live INDOT Highway Cams | `/cameras/indiana/` |
| Iowa Traffic Cameras — Live Iowa DOT Highway Cams | `/cameras/iowa/` |
| Kansas Traffic Cameras — Live KDOT Highway Cams | `/cameras/kansas/` |
| Kentucky Traffic Cameras — Live KYTC (GoKY) Highway Cams | `/cameras/kentucky/` |
| Las Vegas Traffic Cameras — Live NDOT Freeway Cams | `/cameras/las-vegas/` |
| Live Highway Cameras — 39 US states + 5 Canadian provinces, route + mile marker tagged | `/cameras/` |
| Los Angeles Traffic Cameras — Live Caltrans Freeway Cams | `/cameras/los-angeles/` |
| Louisiana Traffic Cameras — Live DOTD (511LA) Highway Cams | `/cameras/louisiana/` |
| Maine Traffic Cameras — Live MaineDOT (511 Maine) Highway Cams | `/cameras/maine/` |
| Manitoba Traffic Cameras — Live Manitoba 511 Highway Cams | `/cameras/manitoba/` |
| Maryland Traffic Cameras — Live MDOT SHA (CHART) Highway Cams | `/cameras/maryland/` |
| Massachusetts Traffic Cameras — Live MassDOT (Mass511) Highway Cams | `/cameras/massachusetts/` |
| Miami Traffic Cameras — Live FDOT Freeway Cams | `/cameras/miami/` |
| Michigan Traffic Cameras — Live MDOT (Mi Drive) Highway Cams | `/cameras/michigan/` |
| Milwaukee Traffic Cameras — Live WisDOT Freeway Cams | `/cameras/milwaukee/` |
| Minnesota Traffic Cameras — Live MnDOT Highway Cams | `/cameras/minnesota/` |
| Missouri Traffic Cameras — Live MoDOT Highway Cams | `/cameras/missouri/` |
| Montana Traffic Cameras — Live MDT Highway Cams | `/cameras/montana/` |
| Nebraska Traffic Cameras — Live NDOT Highway Cams | `/cameras/nebraska/` |
| Nevada Traffic Cameras — Live NDOT (NVRoads) Highway Cams | `/cameras/nevada/` |
| New Hampshire Traffic Cameras — Live NHDOT (New England 511) Highway Cams | `/cameras/new-hampshire/` |
| New Mexico Traffic Cameras — Live NMDOT (NMRoads) Highway Cams | `/cameras/new-mexico/` |
| New Orleans Traffic Cameras — Live DOTD Freeway Cams | `/cameras/new-orleans/` |
| New York City Traffic Cameras — Live NYSDOT Freeway Cams | `/cameras/new-york-city/` |
| New York Traffic Cameras — Live NYSDOT (511NY) Highway Cams | `/cameras/new-york/` |
| North Carolina Traffic Cameras — Live NCDOT (DriveNC) Highway Cams | `/cameras/north-carolina/` |
| Ohio Traffic Cameras — Live ODOT (OHGO) Highway Cams | `/cameras/ohio/` |
| Ontario Traffic Cameras — Live Ontario 511 Highway Cams | `/cameras/ontario/` |
| Oregon Traffic Cameras — Live ODOT (TripCheck) Highway Cams | `/cameras/oregon/` |
| Orlando Traffic Cameras — Live FDOT Freeway Cams | `/cameras/orlando/` |
| Pennsylvania Traffic Cameras — Live PennDOT (511PA) Highway Cams | `/cameras/pennsylvania/` |
| Philadelphia Traffic Cameras — Live PennDOT Freeway Cams | `/cameras/philadelphia/` |
| Phoenix Traffic Cameras — Live ADOT Freeway Cams | `/cameras/phoenix/` |
| Pittsburgh Traffic Cameras — Live PennDOT Freeway Cams | `/cameras/pittsburgh/` |
| Portland Traffic Cameras — Live ODOT Freeway Cams | `/cameras/portland/` |
| Québec Traffic Cameras — Live Québec 511 (Transports Québec) Highway Cams | `/cameras/quebec/` |
| Sacramento Traffic Cameras — Live Caltrans Freeway Cams | `/cameras/sacramento/` |
| Salt Lake City Traffic Cameras — Live UDOT Freeway Cams | `/cameras/salt-lake-city/` |
| San Diego Traffic Cameras — Live Caltrans Freeway Cams | `/cameras/san-diego/` |
| San Francisco Bay Area Traffic Cameras — Live Caltrans Freeway Cams | `/cameras/san-francisco/` |
| Seattle Traffic Cameras — Live WSDOT Freeway Cams | `/cameras/seattle/` |
| South Carolina Traffic Cameras — Live SCDOT (511SC) Highway Cams | `/cameras/south-carolina/` |
| South Dakota Traffic Cameras — Live SDDOT (SD511) Highway Cams | `/cameras/south-dakota/` |
| Tampa Traffic Cameras — Live FDOT Freeway Cams | `/cameras/tampa/` |
| Texas Traffic Cameras — Live TxDOT Highway Cams | `/cameras/texas/` |
| Utah Traffic Cameras — Live UDOT Highway Cams | `/cameras/utah/` |
| Vermont Traffic Cameras — Live VTrans (New England 511) Highway Cams | `/cameras/vermont/` |
| Virginia Traffic Cameras — Live VDOT (511 Virginia) Highway Cams | `/cameras/virginia/` |
| Washington Traffic Cameras — Live WSDOT Highway Cams | `/cameras/washington/` |
| West Virginia Traffic Cameras — Live WVDOT (WV511) Highway Cams | `/cameras/west-virginia/` |
| Wisconsin Traffic Cameras — Live WisDOT (511WI) Highway Cams | `/cameras/wisconsin/` |

### State drawbridge maps (28)

One page per state showing every drawbridge in that state, live status and opening schedules.

| Page | Path |
|---|---|
| Alabama Drawbridge Map — Bayou La Batre, the Black Warrior lifts | `/bridges/alabama/` |
| Arkansas Drawbridge Map — the Arkansas Waterway drawspans | `/bridges/arkansas/` |
| California Drawbridge Map — Delta, Bay Area + bridge phones | `/bridges/california/` |
| Connecticut Drawbridge Map — Mystic, East Haddam + every movable bridge | `/bridges/connecticut/` |
| Delaware Drawbridge Map — Wilmington’s Brandywine bridges, Cedar Beach | `/bridges/delaware/` |
| Florida Drawbridge Map — live status + opening schedules | `/bridges/florida/` |
| Illinois Drawbridge Map — the Chicago River bridge lifts | `/bridges/illinois/` |
| Indiana Drawbridge Map — Michigan City’s Trail Creek bridges | `/bridges/indiana/` |
| Louisiana Drawbridge Map — live DOTD status + schedules | `/bridges/louisiana/` |
| Maine Drawbridge Map — Casco Bay Bridge + coastal swings | `/bridges/maine/` |
| Maryland Drawbridge Map — Knapps Narrows, Kent Narrows, Spa Creek | `/bridges/maryland/` |
| Massachusetts Drawbridge Map — New Bedford, Gloucester, Chelsea + schedules | `/bridges/massachusetts/` |
| Michigan Drawbridge Map — every bridge, every opening schedule | `/bridges/michigan/` |
| Minnesota Drawbridge Map — Duluth’s Aerial Lift Bridge, Stillwater | `/bridges/minnesota/` |
| Mississippi Drawbridge Map — Biloxi’s Back Bay bridges, Popps Ferry | `/bridges/mississippi/` |
| More State Drawbridges — GA, ID, DC, KY, NH, VT, KS, SD, TN, MO, NE | `/bridges/more-states/` |
| New Jersey Drawbridge Map — opening schedules for every bridge | `/bridges/new-jersey/` |
| New York Drawbridge Map — Erie Canal lift bridges + every movable bridge | `/bridges/new-york/` |
| North Carolina Drawbridge Map — every coastal drawbridge + schedules | `/bridges/north-carolina/` |
| Ohio Drawbridge Map — Cleveland’s Cuyahoga River bridges, Ashtabula | `/bridges/ohio/` |
| Oregon Drawbridge Map — Portland bridges, I-5 lifts + schedules | `/bridges/oregon/` |
| Pennsylvania Drawbridge Map — Philadelphia’s Schuylkill River bridges | `/bridges/pennsylvania/` |
| Seattle Drawbridge Status — is the bridge up right now? | `/bridges/` |
| South Carolina Drawbridge Map — Ben Sawyer, Wappoo Cut, Lady’s Island | `/bridges/south-carolina/` |
| Texas Drawbridge Map — Galveston’s Pelican Island Causeway, the bayous | `/bridges/texas/` |
| Virginia Drawbridge Map — Gilmerton, the Norfolk ICW bridges | `/bridges/virginia/` |
| Washington Drawbridge Map — every bridge, schedules + Seattle live | `/bridges/washington/` |
| Wisconsin Drawbridge Map — Green Bay’s Fox River bridges, Duluth-Superior, La Crosse | `/bridges/wisconsin/` |

### Seattle drawbridges (15)

Individual Seattle-area bridge pages (Fremont, Ballard, Montlake, etc.) plus FAQ-style pages (opening rules, night openings, rush hour).

| Page | Path |
|---|---|
| Do Seattle drawbridges open at night? Notice rules by bridge | `/seattle-drawbridges/night-openings/` |
| Do Seattle drawbridges open during rush hour? Hours by bridge | `/seattle-drawbridges/rush-hour/` |
| Duwamish Waterway drawbridges: 1st Ave S, South Park and SW Spokane St status and rules | `/seattle-drawbridges/duwamish/` |
| How long does a Seattle drawbridge stay up? | `/seattle-drawbridges/how-long/` |
| Is the Ballard Bridge up right now? Live status and opening times | `/seattle-drawbridges/ballard-bridge/` |
| Is the First Avenue South Bridge up right now? Live status and opening times | `/seattle-drawbridges/first-avenue-south-bridge/` |
| Is the Fremont Bridge up right now? Live status and opening times | `/seattle-drawbridges/fremont-bridge/` |
| Is the Montlake Bridge up right now? Live status and opening times | `/seattle-drawbridges/montlake-bridge/` |
| Is the South Park Bridge up right now? Live status and opening times | `/seattle-drawbridges/south-park-bridge/` |
| Is the Southwest Spokane Street Bridge up right now? Live status and opening times | `/seattle-drawbridges/spokane-street-bridge/` |
| Is the University Bridge up right now? Live status and opening times | `/seattle-drawbridges/university-bridge/` |
| Seattle Drawbridges — is the bridge up right now? | `/seattle-drawbridges/` |
| Seattle Ship Canal bridges: Ballard, Fremont, University, Montlake status and rules | `/seattle-drawbridges/ship-canal/` |
| Seattle bridge alerts: a notification when the Fremont, Ballard or Montlake Bridge goes up | `/seattle-drawbridges/alerts/` |
| When do Seattle drawbridges open? Every bridge, every rule | `/seattle-drawbridges/opening-rules/` |

### State mile-marker guides (58)

One page per state — "Highway Mile Markers in [State]" — evergreen SEO content.

| Page | Path |
|---|---|
| Highway Mile Markers in Alabama | `/blog/mile-markers-alabama.html` |
| Highway Mile Markers in Alaska | `/blog/mile-markers-alaska.html` |
| Highway Mile Markers in Arizona | `/blog/mile-markers-arizona.html` |
| Highway Mile Markers in Arkansas | `/blog/mile-markers-arkansas.html` |
| Highway Mile Markers in California | `/blog/mile-markers-california.html` |
| Highway Mile Markers in Colorado | `/blog/mile-markers-colorado.html` |
| Highway Mile Markers in Connecticut | `/blog/mile-markers-connecticut.html` |
| Highway Mile Markers in Delaware | `/blog/mile-markers-delaware.html` |
| Highway Mile Markers in Florida | `/blog/mile-markers-florida.html` |
| Highway Mile Markers in Georgia | `/blog/mile-markers-georgia.html` |
| Highway Mile Markers in Hawaii | `/blog/mile-markers-hawaii.html` |
| Highway Mile Markers in Idaho | `/blog/mile-markers-idaho.html` |
| Highway Mile Markers in Illinois | `/blog/mile-markers-illinois.html` |
| Highway Mile Markers in Indiana | `/blog/mile-markers-indiana.html` |
| Highway Mile Markers in Iowa | `/blog/mile-markers-iowa.html` |
| Highway Mile Markers in Kansas | `/blog/mile-markers-kansas.html` |
| Highway Mile Markers in Kentucky | `/blog/mile-markers-kentucky.html` |
| Highway Mile Markers in Louisiana | `/blog/mile-markers-louisiana.html` |
| Highway Mile Markers in Maine | `/blog/mile-markers-maine.html` |
| Highway Mile Markers in Maryland | `/blog/mile-markers-maryland.html` |
| Highway Mile Markers in Massachusetts | `/blog/mile-markers-massachusetts.html` |
| Highway Mile Markers in Michigan | `/blog/mile-markers-michigan.html` |
| Highway Mile Markers in Minnesota | `/blog/mile-markers-minnesota.html` |
| Highway Mile Markers in Mississippi | `/blog/mile-markers-mississippi.html` |
| Highway Mile Markers in Missouri | `/blog/mile-markers-missouri.html` |
| Highway Mile Markers in Montana | `/blog/mile-markers-montana.html` |
| Highway Mile Markers in Nebraska | `/blog/mile-markers-nebraska.html` |
| Highway Mile Markers in Nevada | `/blog/mile-markers-nevada.html` |
| Highway Mile Markers in New Hampshire | `/blog/mile-markers-new-hampshire.html` |
| Highway Mile Markers in New Jersey | `/blog/mile-markers-new-jersey.html` |
| Highway Mile Markers in New Mexico | `/blog/mile-markers-new-mexico.html` |
| Highway Mile Markers in New York | `/blog/mile-markers-new-york.html` |
| Highway Mile Markers in North Carolina | `/blog/mile-markers-north-carolina.html` |
| Highway Mile Markers in North Dakota | `/blog/mile-markers-north-dakota.html` |
| Highway Mile Markers in Ohio | `/blog/mile-markers-ohio.html` |
| Highway Mile Markers in Oklahoma | `/blog/mile-markers-oklahoma.html` |
| Highway Mile Markers in Oregon | `/blog/mile-markers-oregon.html` |
| Highway Mile Markers in Pennsylvania | `/blog/mile-markers-pennsylvania.html` |
| Highway Mile Markers in Rhode Island | `/blog/mile-markers-rhode-island.html` |
| Highway Mile Markers in South Carolina | `/blog/mile-markers-south-carolina.html` |
| Highway Mile Markers in South Dakota | `/blog/mile-markers-south-dakota.html` |
| Highway Mile Markers in Tennessee | `/blog/mile-markers-tennessee.html` |
| Highway Mile Markers in Texas | `/blog/mile-markers-texas.html` |
| Highway Mile Markers in Utah | `/blog/mile-markers-utah.html` |
| Highway Mile Markers in Vermont | `/blog/mile-markers-vermont.html` |
| Highway Mile Markers in Virginia | `/blog/mile-markers-virginia.html` |
| Highway Mile Markers in Washington State | `/blog/mile-markers-washington.html` |
| Highway Mile Markers in West Virginia | `/blog/mile-markers-west-virginia.html` |
| Highway Mile Markers in Wisconsin | `/blog/mile-markers-wisconsin.html` |
| Highway Mile Markers in Wyoming | `/blog/mile-markers-wyoming.html` |
| Kilometre Markers in Alberta: A Driver's Guide | `/blog/km-markers-alberta.html` |
| Kilometre Markers in British Columbia: A Driver's Guide | `/blog/km-markers-british-columbia.html` |
| Kilometre Markers in Nova Scotia: A Driver's Guide | `/blog/km-markers-nova-scotia.html` |
| Kilometre Markers in Ontario: A Driver's Guide | `/blog/km-markers-ontario.html` |
| Kilometre Markers in the Northwest Territories: A Driver's Guide | `/blog/km-markers-northwest-territories.html` |
| Kilometre Markers, Province by Province — Canada | `/canada/` |
| Mile Markers State by State — all 50 states | `/states/` |
| Repères Kilométriques in Quebec: A Driver's Guide | `/blog/km-markers-quebec.html` |

### Mountain visibility pages (38)

"Is [mountain] visible right now" pages and city-specific variants (from Seattle, from Bellingham, etc.) — a distinct SEO niche around named peaks.

| Page | Path |
|---|---|
| Best time of year to see Denali | `/mountains/denali/best-time/` |
| Best time of year to see Mount Baker | `/mountains/baker/best-time/` |
| Best time of year to see Mount Hood | `/mountains/hood/best-time/` |
| Best time of year to see Mount Rainier | `/mountains/rainier/best-time/` |
| Best time of year to see Mount St. Helens | `/mountains/sthelens/best-time/` |
| Is Denali visible from Anchorage right now? | `/mountains/denali/from-anchorage/` |
| Is Denali visible from Denali Park right now? | `/mountains/denali/from-denali-park/` |
| Is Denali visible from Fairbanks right now? | `/mountains/denali/from-fairbanks/` |
| Is Denali visible from Talkeetna right now? | `/mountains/denali/from-talkeetna/` |
| Is Denali visible from Wasilla right now? | `/mountains/denali/from-wasilla/` |
| Is Denali visible right now? Live from Talkeetna | `/mountains/denali/` |
| Is Mount Baker visible from Abbotsford right now? | `/mountains/baker/from-abbotsford/` |
| Is Mount Baker visible from Anacortes right now? | `/mountains/baker/from-anacortes/` |
| Is Mount Baker visible from Bellingham right now? | `/mountains/baker/from-bellingham/` |
| Is Mount Baker visible from Richmond right now? | `/mountains/baker/from-richmond/` |
| Is Mount Baker visible from Surrey right now? | `/mountains/baker/from-surrey/` |
| Is Mount Baker visible from Vancouver, BC right now? | `/mountains/baker/from-vancouver-bc/` |
| Is Mount Baker visible right now? Live from Vancouver, BC | `/mountains/baker/` |
| Is Mount Hood visible from Government Camp right now? | `/mountains/hood/from-government-camp/` |
| Is Mount Hood visible from Gresham right now? | `/mountains/hood/from-gresham/` |
| Is Mount Hood visible from Hood River right now? | `/mountains/hood/from-hood-river/` |
| Is Mount Hood visible from Portland right now? | `/mountains/hood/from-portland/` |
| Is Mount Hood visible from Vancouver, WA right now? | `/mountains/hood/from-vancouver-wa/` |
| Is Mount Hood visible right now? Live from Portland | `/mountains/hood/` |
| Is Mount Rainier visible from Everett right now? | `/mountains/rainier/from-everett/` |
| Is Mount Rainier visible from Kitsap right now? | `/mountains/rainier/from-kitsap/` |
| Is Mount Rainier visible from Olympia right now? | `/mountains/rainier/from-olympia/` |
| Is Mount Rainier visible from Seattle right now? | `/mountains/rainier/from-seattle/` |
| Is Mount Rainier visible from Tacoma right now? | `/mountains/rainier/from-tacoma/` |
| Is Mount Rainier visible from the Eastside right now? | `/mountains/rainier/from-eastside/` |
| Is Mount Rainier visible right now? Live from Seattle | `/mountains/rainier/` |
| Is Mount St. Helens visible from Castle Rock right now? | `/mountains/sthelens/from-castle-rock/` |
| Is Mount St. Helens visible from Longview right now? | `/mountains/sthelens/from-longview/` |
| Is Mount St. Helens visible from Portland right now? | `/mountains/sthelens/from-portland/` |
| Is Mount St. Helens visible from Vancouver, WA right now? | `/mountains/sthelens/from-vancouver-wa/` |
| Is Mount St. Helens visible from Woodland right now? | `/mountains/sthelens/from-woodland/` |
| Is Mount St. Helens visible right now? Live from Portland | `/mountains/sthelens/` |
| Mountain Visibility Forecast — is the mountain visible right now? | `/mountains/` |

### Driver education / glossary (54)

Evergreen how-to and glossary content (what is black ice, zipper merge explained, chains required, etc.) — broad, steady long-tail traffic.

| Page | Path |
|---|---|
| Broken Down on the Autobahn? What to Do If You Don't Speak German | `/breakdown-on-the-autobahn/` |
| Can Dragging Trailer Chains Start a Wildfire? | `/dragging-trailer-chains-wildfire/` |
| Can Google Maps Show Mile Markers? | `/can-google-maps-show-mile-markers/` |
| Can you drive a rental car into Canada or Mexico? | `/rental-car-canada-mexico/` |
| Can you drive in the US on a foreign licence? | `/drive-in-us-foreign-license/` |
| Do I need Mexican car insurance? | `/mexico-car-insurance/` |
| Do you need an International Driving Permit in the US? | `/international-driving-permit-usa/` |
| Do you need chains or are all-season tires enough? | `/chains-or-all-season-tires/` |
| Do you need snow tires in Washington, Oregon or Colorado? | `/snow-tires-wa-or-co/` |
| Driving a Car vs a Semi-Truck: The Key Differences | `/driving-a-car-vs-a-truck/` |
| Driving in the US as a Foreign Visitor: What Nobody Explains to You | `/driving-in-the-us-foreign-visitor-guide/` |
| Driving into Canada in your own car | `/drive-into-canada/` |
| Driving into the US from Canada in your own car | `/drive-into-us-from-canada/` |
| Highway Driving Tips for New Drivers | `/highway-driving-tips-for-new-drivers/` |
| Highway Tips for New CDL Drivers | `/highway-tips-for-new-cdl-drivers/` |
| Highway Tips for New Snowplow Drivers | `/highway-tips-for-new-snowplow-drivers/` |
| Highway Tips for New Tow Truck Drivers | `/highway-tips-for-new-tow-truck-drivers/` |
| Highway vs Freeway vs Expressway: What's the Difference? | `/highway-vs-freeway-vs-expressway/` |
| How Interstate Highways Are Numbered (the System Explained) | `/how-interstates-are-numbered/` |
| How to Check Road Conditions Before a Road Trip | `/check-road-conditions-before-a-trip/` |
| How to Get Your Car Ready for Fall and Winter | `/winter-car-prep-checklist/` |
| How to Report Your Location on the Highway (to 911, a Tow, or Roadside Assistance) | `/report-location/` |
| JFK, LaGuardia or Newark to Manhattan: taxi or train? | `/nyc-airport-taxi-vs-uber/` |
| Left Exit vs Right Exit: What the Exit Tab Tells You | `/left-exit-vs-right-exit/` |
| Live Maps — wildfires, mile markers, road closures | `/maps/` |
| Mile Markers vs Exit Numbers: What's the Difference? | `/mile-markers-vs-exit-numbers/` |
| Road vs Street vs Avenue: What Road Names Mean | `/road-street-avenue-difference/` |
| Sand vs Salt vs Brine: How Roads Are Treated for Winter | `/sand-vs-salt-vs-brine/` |
| Should I rent a car in New York City? | `/rent-a-car-in-nyc/` |
| Should you buy rental insurance or use your credit card? | `/rental-car-insurance-credit-card/` |
| Should you drive a desert road or mountain pass at night? | `/night-driving-desert-and-passes/` |
| Should you drive or fly from Los Angeles to Las Vegas? | `/drive-or-fly-los-angeles-las-vegas/` |
| Should you drive, fly or take the Orlando–Miami train? | `/drive-or-fly-orlando-miami/` |
| Should you drive, fly or take the Seattle–Portland train? | `/drive-or-fly-seattle-portland/` |
| Should you get the rental car’s toll pass? | `/rental-car-toll-pass/` |
| The Best Fall Road Trips in the US (Foliage Drives) | `/best-fall-road-trips/` |
| The Loneliest Road in America: US-50 Across Nevada | `/loneliest-road-in-america/` |
| US Highways vs Interstates: What's the Difference? | `/us-highways-vs-interstates/` |
| What &quot;Chains Required&quot; Means (Traction Laws Explained) | `/chains-required-explained/` |
| What 3-Digit Interstate Numbers Mean (Loops vs Spurs) | `/three-digit-interstate-numbers/` |
| What Are Rumble Strips For? | `/what-are-rumble-strips/` |
| What Are Runaway Truck Ramps? (How They Work) | `/runaway-truck-ramps/` |
| What Causes Roadside Wildfires (and How to Avoid One) | `/roadside-wildfire-causes/` |
| What Highway Sign Colors Mean (Green, Blue, Brown & More) | `/highway-sign-colors/` |
| What Is 511? The Free Road-Conditions Number | `/what-is-511/` |
| What Is Black Ice — and How to Drive on It | `/what-is-black-ice/` |
| What Is My Mile Marker? How to Find It (and Why It Matters) | `/what-is-my-mile-marker/` |
| What Is a Zipper Merge (and Why You Should Use It) | `/zipper-merge-explained/` |
| What Steep Grade Signs Mean (6% Grade Ahead) | `/steep-grade-signs-explained/` |
| What should you do if you hit a deer? | `/hit-a-deer-what-to-do/` |
| Who Maintains the Roads? Federal, State, County & City | `/who-maintains-the-roads/` |
| Why Is There No Interstate 50 or Interstate 60? | `/why-no-interstate-50-or-60/` |
| Will your Canadian phone work in the US? | `/will-my-phone-work-in-the-us/` |
| Will your US phone work in Canada? | `/will-my-phone-work-in-canada/` |

### Blog (72)

Individual blog posts, including the Labor Day weekend recap series (50-state + BC).

| Page | Path |
|---|---|
| 44,000+ Highway Cameras, 39 States, One Map | `/blog/live-highway-cameras.html` |
| Alabama Labor Day Weekend Road Recap | `/blog/labor-day-weekend-recap-2026-states/alabama.html` |
| Alaska Labor Day Weekend Road Recap | `/blog/labor-day-weekend-recap-2026-states/alaska.html` |
| Arizona Labor Day Weekend Road Recap | `/blog/labor-day-weekend-recap-2026-states/arizona.html` |
| Arkansas Labor Day Weekend Road Recap | `/blog/labor-day-weekend-recap-2026-states/arkansas.html` |
| Blog | `/blog/` |
| British Columbia Labor Day Weekend Road Recap | `/blog/labor-day-weekend-recap-2026-states/british-columbia.html` |
| California Labor Day Weekend Road Recap | `/blog/labor-day-weekend-recap-2026-states/california.html` |
| Chain Control Alerts for Trucking Fleets | `/blog/chain-control-alerts-for-fleets.html` |
| Colorado Labor Day Weekend Road Recap | `/blog/labor-day-weekend-recap-2026-states/colorado.html` |
| Connecticut Labor Day Weekend Road Recap | `/blog/labor-day-weekend-recap-2026-states/connecticut.html` |
| Delaware Labor Day Weekend Road Recap | `/blog/labor-day-weekend-recap-2026-states/delaware.html` |
| Every Drawbridge in America Has a Rulebook. We Mapped It. | `/blog/drawbridge-maps.html` |
| Florida Labor Day Weekend Road Recap | `/blog/labor-day-weekend-recap-2026-states/florida.html` |
| Georgia Labor Day Weekend Road Recap | `/blog/labor-day-weekend-recap-2026-states/georgia.html` |
| Hawaii Labor Day Weekend Road Recap | `/blog/labor-day-weekend-recap-2026-states/hawaii.html` |
| Here is what we know for Labor Day weekend | `/blog/labor-day-weekend-2026.html` |
| How MileCheck Finds Your Mile Marker With No Cell Service | `/blog/how-milecheck-finds-your-mile-marker-offline.html` |
| How One App Reads 50 Different State DOT Systems | `/blog/how-one-app-reads-fifty-dot-systems.html` |
| How to Find Your Mile Marker on the Highway | `/blog/how-to-find-your-mile-marker.html` |
| Idaho Labor Day Weekend Road Recap | `/blog/labor-day-weekend-recap-2026-states/idaho.html` |
| Illinois Labor Day Weekend Road Recap | `/blog/labor-day-weekend-recap-2026-states/illinois.html` |
| Indiana Labor Day Weekend Road Recap | `/blog/labor-day-weekend-recap-2026-states/indiana.html` |
| Iowa Labor Day Weekend Road Recap | `/blog/labor-day-weekend-recap-2026-states/iowa.html` |
| Kansas Labor Day Weekend Road Recap | `/blog/labor-day-weekend-recap-2026-states/kansas.html` |
| Kentucky Labor Day Weekend Road Recap | `/blog/labor-day-weekend-recap-2026-states/kentucky.html` |
| Labor Day Weekend Road Recap | `/blog/labor-day-weekend-recap-2026.html` |
| Labor Day Weekend Road Recap, by State | `/blog/labor-day-weekend-recap-2026-states/` |
| Louisiana Labor Day Weekend Road Recap | `/blog/labor-day-weekend-recap-2026-states/louisiana.html` |
| Maine Labor Day Weekend Road Recap | `/blog/labor-day-weekend-recap-2026-states/maine.html` |
| Maryland Labor Day Weekend Road Recap | `/blog/labor-day-weekend-recap-2026-states/maryland.html` |
| Massachusetts Labor Day Weekend Road Recap | `/blog/labor-day-weekend-recap-2026-states/massachusetts.html` |
| Michigan Labor Day Weekend Road Recap | `/blog/labor-day-weekend-recap-2026-states/michigan.html` |
| Mile Markers vs. GPS: Why Both Still Matter on the Highway | `/blog/mile-markers-vs-gps.html` |
| MileCheck Road Report: August 14&ndash;31, 2026 | `/blog/road-report-august-2026.html` |
| MileCheck is live on CarPlay — and why Driving Task approval is rare | `/blog/carplay-approved.html` |
| MileCheck is now on the Geotab Marketplace | `/blog/geotab-marketplace.html` |
| Minnesota Labor Day Weekend Road Recap | `/blog/labor-day-weekend-recap-2026-states/minnesota.html` |
| Mississippi Labor Day Weekend Road Recap | `/blog/labor-day-weekend-recap-2026-states/mississippi.html` |
| Missouri Labor Day Weekend Road Recap | `/blog/labor-day-weekend-recap-2026-states/missouri.html` |
| Montana Labor Day Weekend Road Recap | `/blog/labor-day-weekend-recap-2026-states/montana.html` |
| Nebraska Labor Day Weekend Road Recap | `/blog/labor-day-weekend-recap-2026-states/nebraska.html` |
| Nevada Labor Day Weekend Road Recap | `/blog/labor-day-weekend-recap-2026-states/nevada.html` |
| New Hampshire Labor Day Weekend Road Recap | `/blog/labor-day-weekend-recap-2026-states/new-hampshire.html` |
| New Jersey Labor Day Weekend Road Recap | `/blog/labor-day-weekend-recap-2026-states/new-jersey.html` |
| New Mexico Labor Day Weekend Road Recap | `/blog/labor-day-weekend-recap-2026-states/new-mexico.html` |
| New York Labor Day Weekend Road Recap | `/blog/labor-day-weekend-recap-2026-states/new-york.html` |
| North Carolina Labor Day Weekend Road Recap | `/blog/labor-day-weekend-recap-2026-states/north-carolina.html` |
| North Dakota Labor Day Weekend Road Recap | `/blog/labor-day-weekend-recap-2026-states/north-dakota.html` |
| Ohio Labor Day Weekend Road Recap | `/blog/labor-day-weekend-recap-2026-states/ohio.html` |
| Oklahoma Labor Day Weekend Road Recap | `/blog/labor-day-weekend-recap-2026-states/oklahoma.html` |
| Oregon Labor Day Weekend Road Recap | `/blog/labor-day-weekend-recap-2026-states/oregon.html` |
| Pennsylvania Labor Day Weekend Road Recap | `/blog/labor-day-weekend-recap-2026-states/pennsylvania.html` |
| Rhode Island Labor Day Weekend Road Recap | `/blog/labor-day-weekend-recap-2026-states/rhode-island.html` |
| Seattle Drawbridges Opened 430 Times From August 19&ndash;31 | `/blog/seattle-drawbridges-august-2026.html` |
| South Carolina Labor Day Weekend Road Recap | `/blog/labor-day-weekend-recap-2026-states/south-carolina.html` |
| South Dakota Labor Day Weekend Road Recap | `/blog/labor-day-weekend-recap-2026-states/south-dakota.html` |
| Tennessee Labor Day Weekend Road Recap | `/blog/labor-day-weekend-recap-2026-states/tennessee.html` |
| Texas Labor Day Weekend Road Recap | `/blog/labor-day-weekend-recap-2026-states/texas.html` |
| The DOT Alerts API: What It Takes to Get Live Closures From 50 States | `/blog/dot-alerts-api-for-fleets.html` |
| Utah Labor Day Weekend Road Recap | `/blog/labor-day-weekend-recap-2026-states/utah.html` |
| Vermont Labor Day Weekend Road Recap | `/blog/labor-day-weekend-recap-2026-states/vermont.html` |
| Virginia Labor Day Weekend Road Recap | `/blog/labor-day-weekend-recap-2026-states/virginia.html` |
| Washington Labor Day Weekend Road Recap | `/blog/labor-day-weekend-recap-2026-states/washington.html` |
| West Virginia Labor Day Weekend Road Recap | `/blog/labor-day-weekend-recap-2026-states/west-virginia.html` |
| What Happens When You Cross a State Line, Mid-Drive | `/blog/what-happens-when-you-cross-a-state-line.html` |
| What to Tell 911 When You Break Down on the Highway | `/blog/what-to-tell-911-highway-breakdown.html` |
| When a Wildfire Closes the Highway: How to Know Before You're Stuck | `/blog/wildfire-road-closures.html` |
| Why Fleet Dispatch Still Runs on Mile Markers, Not GPS Pins | `/blog/fleet-dispatch-mile-markers.html` |
| Why Google Maps can't tell you a lane is closed at MP 142 | `/blog/lane-closed-mp142.html` |
| Wisconsin Labor Day Weekend Road Recap | `/blog/labor-day-weekend-recap-2026-states/wisconsin.html` |
| Wyoming Labor Day Weekend Road Recap | `/blog/labor-day-weekend-recap-2026-states/wyoming.html` |

### Home / flagship (1)

The Mile Marker Map — the single flagship live-data page.

| Page | Path |
|---|---|
| Mile Marker Map — browse mileposts in all 50 states | `/maps/mile-markers/` |
