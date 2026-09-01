// Generates top-level highway-reference guide pages (/mile-markers-vs-exit-numbers/, etc.)
// Clear, factual "answer" content — the format Google AI Overviews + ChatGPT/Claude cite,
// and that builds topical authority for the whole site. Run: node scripts/gen-guide-pages.js
const fs = require('fs');
const path = require('path');

const APP = 'https://apps.apple.com/us/app/milecheck/id6759212851';
const PLAY = 'https://play.google.com/store/apps/details?id=app.milecheck.mobile';

// ⚠️ DRIFT NOTE (2026-08-31): the LIVE chains-required-explained page has a hand-added
// "Les Schwab installs chains" paragraph NOT encoded here — regenerating that page would drop it.
// Before rerunning + committing an EXISTING page, git-diff it first. New pages are safe to generate.
const GUIDES = [
  {
    slug:'mile-markers-vs-exit-numbers', eyebrow:'Highway basics',
    title:"Mile Markers vs Exit Numbers: What's the Difference?",
    h1:"Mile markers vs exit numbers: what's the difference?",
    lede:`Both count distance along a highway, but they answer different questions. A mile marker tells you your exact position anywhere on the road; an exit number only appears at interchanges. On most modern interstates they line up — but they're not the same thing.`,
    sections:[
      ['Mile markers = your continuous position',`A mile marker (or milepost) is a small green sign along the shoulder, posted roughly every mile, counting up from 0 at the southern or western edge of the state. It tells you exactly where you are at any point — between towns, between exits, in the middle of nowhere. That's why 911 and tow trucks ask for it. <a href="../what-is-my-mile-marker/">More on how mile markers work →</a>`],
      ['Exit numbers = only at interchanges',`An exit number only appears where you can get on or off the highway. On most US interstates, exit numbers are <strong>mile-based</strong>: the exit number matches the nearest mile marker, so Exit 34 sits at about mile 34. That means exit numbers and mile markers climb together — a handy cross-check.`],
      ['Why some highways number exits sequentially',`A few older highways used <strong>sequential</strong> (consecutive) exit numbering — Exit 1, Exit 2, Exit 3 — regardless of mileage. Most have converted to the mile-based system, but you may still see sequential numbering on some toll roads and older state routes, where the exit number won't match a mile marker.`],
      ['Which one should you use?',`For telling someone exactly where you are — a dispatcher, a tow, a friend — the <strong>mile marker</strong> is the better answer, because it works anywhere, not just at an interchange. The MileCheck app shows your exact mile marker in real time as you drive, so you always have that precise number ready.`],
    ],
    faq:[
      ['Do exit numbers match mile markers?',`On most US interstates, yes — exit numbers are mile-based, so Exit 34 is at about mile marker 34. Some older highways use sequential exit numbering that doesn't match mileage.`],
      ['What is the difference between a mile marker and an exit number?',`A mile marker shows your continuous position along the highway, posted every mile. An exit number only appears at interchanges. Where mile-based numbering is used, an exit number roughly equals the nearest mile marker.`],
      ['Why do some highways have sequential exit numbers?',`Older systems numbered exits consecutively (1, 2, 3…) instead of by mileage. Most states have switched to mile-based exit numbers, but some toll roads and older routes still use the sequential style.`],
      ['How do I find my mile marker between exits?',`Watch for the small green mile marker signs on the shoulder, or use a GPS app like <a href="`+APP+`" target="_blank" rel="noopener">MileCheck</a>, which shows your exact mile marker continuously — even with no exit or sign nearby.`],
    ],
    related:`<a href="../what-is-my-mile-marker/">What is my mile marker?</a> · <a href="../can-google-maps-show-mile-markers/">Can Google Maps show mile markers?</a> · <a href="../how-interstates-are-numbered/">How interstates are numbered</a> · <a href="../report-location/">Report your location</a>`,
  },
  {
    slug:'how-interstates-are-numbered', eyebrow:'Highway basics',
    title:"How Interstate Highways Are Numbered (the System Explained)",
    h1:"How US interstate highways are numbered",
    lede:`The interstate numbering system isn't random — once you know the pattern, you can tell a highway's direction and roughly where it is in the country just from its number.`,
    sections:[
      ['Odd vs even: direction',`<strong>Odd-numbered</strong> interstates run <strong>north–south</strong> (I-5, I-95). <strong>Even-numbered</strong> interstates run <strong>east–west</strong> (I-10, I-90). It's the opposite of the US Highway grid in some regions, but the interstate rule is consistent nationwide.`],
      ['Low to high: location',`Numbers <strong>increase from west to east</strong> and <strong>from south to north</strong>. So I-5 hugs the West Coast and I-95 runs up the East Coast; I-10 crosses the southern states and I-90 crosses the north. A one- or two-digit number tells you roughly which part of the country a route is in.`],
      ['Three-digit interstates: loops and spurs',`A three-digit interstate is an auxiliary route tied to a two-digit "parent." The <strong>first digit</strong> tells you which: an <strong>even</strong> first digit means a <strong>loop or beltway</strong> that connects to the parent at both ends (like I-495 around Washington, DC), while an <strong>odd</strong> first digit means a <strong>spur</strong> that connects at just one end (like I-395). The last two digits are the parent route.`],
      ['Mile markers reset at the state line',`On every interstate, mile markers count up from 0 at the state's southern or western edge and reset at each state line — so the same mile number appears in every state the highway passes through. That's why a location is always given as route plus mile plus state.`],
    ],
    faq:[
      ['Are odd interstates north-south or east-west?',`Odd-numbered interstates run north–south (like I-5 and I-95). Even-numbered interstates run east–west (like I-10 and I-90).`],
      ['What do 3-digit interstate numbers mean?',`Three-digit interstates are auxiliary routes off a two-digit parent. An even first digit is a loop or beltway (connects at both ends); an odd first digit is a spur (connects at one end).`],
      ['Why does I-95 have a high number and I-5 a low one?',`Interstate numbers increase from west to east. I-5 runs up the West Coast (low number) and I-95 up the East Coast (high number). Even numbers work the same south-to-north.`],
      ['What is the difference between a loop and a spur interstate?',`A loop (or beltway) rejoins its parent interstate at both ends and usually circles a city. A spur connects to the parent at only one end and dead-ends into a destination.`],
    ],
    related:`<a href="../mile-markers-vs-exit-numbers/">Mile markers vs exit numbers</a> · <a href="../corridors/">Interstate corridors</a> · <a href="../what-is-my-mile-marker/">What is my mile marker?</a>`,
  },
  {
    slug:'us-highways-vs-interstates', eyebrow:'Highway basics',
    title:"US Highways vs Interstates: What's the Difference?",
    h1:"US highways vs interstates: what's the difference?",
    lede:`They're both numbered highways with shields and mile markers, but they're two separate systems built decades apart — and their numbers run in opposite directions across the map.`,
    sections:[
      ['Two systems, two eras',`The <strong>US Highway system</strong> (US Routes) came first, established in 1926. The <strong>Interstate Highway System</strong> began in 1956 as a network of high-speed, limited-access freeways. Many US routes are older two-lane roads that run right through towns; interstates are built to a uniform freeway standard — divided, grade-separated, no stoplights or cross traffic.`],
      ['How to tell them apart',`An <strong>interstate</strong> uses the red-white-and-blue shield and is written "I-5" or "I-90." A <strong>US route</strong> uses the plain black-and-white shield and is written "US-2" or "US-101." A US route can be anything from a full freeway to a small-town main street with traffic lights; an interstate is always a controlled-access freeway.`],
      ['The numbering runs opposite ways',`Both systems use the same direction rule — <strong>odd numbers run north–south, even numbers run east–west</strong> — but the low-to-high order is <strong>reversed</strong> between them. Interstate numbers increase <strong>west to east and south to north</strong> (I-5 on the West Coast, I-95 on the East Coast). US route numbers do the opposite, increasing <strong>east to west and north to south</strong> (US-1 down the East Coast, US-101 on the West Coast; US-2 near the Canadian border). That's why an interstate and a US route with similar numbers can be on opposite sides of the country. <a href="../how-interstates-are-numbered/">More on how interstates are numbered →</a>`],
      ['Mile markers work the same on both',`Whether you're on an interstate or a US route, mile markers count up from 0 at the state's southern or western edge and reset at each state line. So "US-97 at mile 154 in Oregon" pinpoints you exactly the same way "I-84 at mile 210" does. The MileCheck app reads your mile marker on both systems in real time.`],
    ],
    faq:[
      ["What's the difference between a US highway and an interstate?",`Interstates are limited-access freeways built to a uniform national standard (I-5, I-90), using the red-white-blue shield. US highways are an older system (US-2, US-101) with the black-and-white shield that can be freeways or ordinary roads with intersections and traffic lights.`],
      ['Is US-101 an interstate?',`No. US-101 is a US route, not an interstate — it uses the black-and-white US shield. It runs along the West Coast and is a US highway despite being a major road.`],
      ['Why do US route numbers go the opposite way from interstates?',`Interstate numbers increase west-to-east and south-to-north; US route numbers increase east-to-west and north-to-south. The two systems were numbered in opposite orders, so a US route and an interstate with similar numbers can be on opposite coasts.`],
      ['Do US highways have mile markers?',`Yes. US routes use the same mile-marker system as interstates — markers count up from the state's southern or western edge and reset at each state line.`],
    ],
    related:`<a href="../how-interstates-are-numbered/">How interstates are numbered</a> · <a href="../mile-markers-vs-exit-numbers/">Mile markers vs exit numbers</a> · <a href="../highway-sign-colors/">Highway sign colors</a>`,
  },
  {
    slug:'highway-sign-colors', eyebrow:'Highway basics',
    title:"What Highway Sign Colors Mean (Green, Blue, Brown & More)",
    h1:"What highway sign colors mean",
    lede:`Every color on a US highway sign has a specific job, set by the federal Manual on Uniform Traffic Control Devices. Once you know the code, a sign's color tells you what it's for before you even read the words.`,
    sections:[
      ['Green — guide and direction',`Green signs are <strong>guide signs</strong>: directions, distances, exit information, and street names. The small green <strong>mile marker</strong> signs on the shoulder are green for the same reason — they're telling you where you are. <a href="../what-is-my-mile-marker/">More on mile markers →</a>`],
      ['Blue — motorist services',`Blue signs point to <strong>services for travelers</strong> — gas, food, lodging, hospitals, and rest areas, usually near exits.`],
      ['Brown — recreation and culture',`Brown signs mark <strong>parks, campgrounds, historic sites, scenic areas, and cultural points of interest.</strong>`],
      ['Red, yellow, and orange — stop, warn, work',`<strong>Red</strong> signs mean stop or prohibition (stop, yield, wrong way, do not enter). <strong>Yellow</strong> signs are general warnings (curves, merges, animal crossings, slippery when wet). <strong>Orange</strong> signs mean <strong>construction and work zones</strong> — expect crews, lane shifts, and changed conditions ahead.`],
      ['White and yellow-green — rules and people',`<strong>White</strong> signs with black lettering are <strong>regulatory</strong> — speed limits, lane use, turn restrictions. Bright <strong>fluorescent yellow-green</strong> signs warn of <strong>pedestrians, schools, and bike crossings.</strong>`],
    ],
    faq:[
      ['What do green highway signs mean?',`Green signs are guide signs — they show directions, distances, exits, and mile markers. Mile marker signs are green because they tell you your location.`],
      ['What color are mile marker signs?',`Mile marker (milepost) signs are green, the color used for all guide and location signs on US highways.`],
      ['What do blue highway signs mean?',`Blue signs point to motorist services — gas stations, food, lodging, hospitals, and rest areas.`],
      ['What does an orange highway sign mean?',`Orange signs mark construction and work zones. They warn of crews, lane closures, and changed conditions ahead.`],
    ],
    related:`<a href="../what-is-my-mile-marker/">What is my mile marker?</a> · <a href="../how-interstates-are-numbered/">How interstates are numbered</a> · <a href="../cameras/">Live highway cameras</a>`,
  },
  {
    slug:'chains-required-explained', eyebrow:'Winter driving',
    title:"What \"Chains Required\" Means (Traction Laws Explained)",
    h1:"What \"chains required\" means — traction laws explained",
    lede:`When snow and ice hit a mountain pass, state transportation departments post traction and chain requirements that can change within the hour. Here's what the levels mean and how to check before you climb.`,
    sections:[
      ['What "chains required" means',`When a "chains required" restriction is in effect, you must put tire chains — or another approved traction device — on your tires before you continue past the checkpoint. It's not a suggestion; it's enforced, and troopers turn back vehicles without them. The rule kicks in when the roadway is snow-covered or icy enough that ordinary tires can't hold.`],
      ['R1, R2, R3 and other levels',`States use different labels, but the idea is the same — escalating requirements as conditions worsen. California's widely-copied system is a good example: <strong>R1</strong> means chains or snow tires are required; <strong>R2</strong> means chains are required on all vehicles except four-wheel/all-wheel drive with snow tires on all four wheels; <strong>R3</strong> means chains are required on <strong>every</strong> vehicle, no exceptions. Other states post "traction tires advised," "traction tires required," and "chains required" in a similar ladder.`],
      ['It changes fast — check before you go',`Pass conditions can go from bare pavement to chains-required within an hour as a storm moves in. The requirement you saw this morning may not be the one in effect this afternoon. Always follow the posted signs at the pass, and check the live cameras and DOT reports before you leave — see current <a href="../passes/">mountain pass conditions</a> for <a href="../passes/snoqualmie/">Snoqualmie</a>, <a href="../passes/donner/">Donner</a>, and more.`],
      ['Be ready before the pass',`Carry chains that fit your tires whenever you drive a mountain route in winter, and know how to put them on before you need to — the shoulder of a snowy pass in the dark is a bad place to learn. The MileCheck app shows your exact mile marker as you climb, so if you do have to stop, you know precisely where you are.`],
    ],
    faq:[
      ['What does "chains required" mean?',`It means you must install tire chains or an approved traction device before continuing past the checkpoint. It's enforced, and vehicles without chains are turned back.`],
      ['What are R1, R2, and R3 chain controls?',`In California's system: R1 = chains or snow tires required; R2 = chains required except for 4WD/AWD with snow tires on all four wheels; R3 = chains required on all vehicles with no exceptions. Other states use similar escalating levels.`],
      ['Do all-wheel-drive cars need chains?',`Often not at the lower levels (like R1/R2) if they have snow tires on all four wheels — but at the highest level (R3), chains are required on every vehicle. Always follow the posted restriction, which can change with conditions.`],
      ['How do I know if chains are required on a pass?',`Check the posted signs at the pass, the state DOT's pass report, and the live cameras before you go. See current <a href="../passes/">mountain pass conditions</a> for the pass on your route.`],
    ],
    related:`<a href="../passes/">Mountain pass conditions</a> · <a href="../cameras/">Live highway cameras</a> · <a href="../corridors/i-80/">I-80 (Donner Pass)</a>`,
  },
  {
    slug:'three-digit-interstate-numbers', eyebrow:'Highway basics',
    title:"What 3-Digit Interstate Numbers Mean (Loops vs Spurs)",
    h1:"What do 3-digit interstate numbers mean?",
    lede:`A three-digit interstate like I-405 or I-295 isn't a separate highway — it's a short auxiliary route tied to a two-digit parent. The first digit tells you whether it loops back or dead-ends.`,
    sections:[
      ['The last two digits name the parent',`Every three-digit interstate borrows its last two digits from a two-digit <strong>parent</strong> interstate. I-405, I-205, and I-505 are all auxiliary routes off I-5; I-495 and I-295 branch from I-95. The three-digit number just marks a spur or loop of that parent, almost always in or around a city. <a href="../how-interstates-are-numbered/">More on how interstates are numbered →</a>`],
      ['Even first digit = a loop or beltway',`By convention, an <strong>even</strong> first digit means the route is a <strong>loop</strong> (or beltway): it leaves the parent interstate and rejoins it at the other end, usually circling a metro area. I-495 around Washington, DC and I-405 around Seattle and Los Angeles are classic loops — get on, and it will bring you back to the parent.`],
      ['Odd first digit = a spur',`An <strong>odd</strong> first digit means a <strong>spur</strong>: it connects to the parent at only one end and dead-ends into a destination — a downtown, an airport, a port. I-395 and I-195 are spurs. They take you somewhere and stop, rather than looping back.`],
      ['A strong hint, not an iron rule',`The loop/spur pattern holds for most three-digit interstates, but it isn't enforced everywhere — a few routes break it. And because only the last two digits have to match the parent, the <strong>same three-digit number can be reused</strong> in different states, so there is more than one I-495. Use the first digit as a strong hint, not a guarantee. However you're routed, the MileCheck app reads your exact mile marker on the interstate in real time.`],
    ],
    faq:[
      ['What do the three digits on an interstate mean?',`The last two digits name the two-digit parent interstate; the first digit tells you the type. An even first digit is a loop or beltway that rejoins the parent, and an odd first digit is a spur that connects at one end and dead-ends.`],
      ['Is I-405 a loop or a spur?',`I-405 is a loop. Its even first digit (4) marks it as a bypass that leaves I-5 and rejoins it, routing around the city.`],
      ['Why is there more than one I-495?',`Only the last two digits of a three-digit interstate must match its parent, so the same number can be reused for different auxiliary routes in different states. Several I-495s exist across the country.`],
      ['What is the parent of a 3-digit interstate?',`It's the two-digit interstate formed by the last two digits. I-280's parent is I-80; I-405's parent is I-5.`],
    ],
    related:`<a href="../how-interstates-are-numbered/">How interstates are numbered</a> · <a href="../us-highways-vs-interstates/">US highways vs interstates</a> · <a href="../corridors/">Interstate corridors</a>`,
  },
  {
    slug:'road-street-avenue-difference', eyebrow:'Road basics',
    title:"Road vs Street vs Avenue: What Road Names Mean",
    h1:"Road, street, avenue, drive: what the suffixes mean",
    lede:`Street, avenue, boulevard, lane, court — the word at the end of a road name usually follows a loose convention about what kind of road it is. They're traditions, not strict laws, but the patterns are real.`,
    sections:[
      ['Street vs avenue: the grid',`Traditionally, a <strong>street</strong> and an <strong>avenue</strong> run perpendicular to each other in a city grid — in many cities the streets run one direction and the avenues cross them. Both are public roads with buildings facing them; the pairing is about orientation, not size.`],
      ['Boulevard, drive, lane, way',`A <strong>boulevard</strong> is a wide, multi-lane road, often with a landscaped median. A <strong>drive</strong> tends to be a longer road that winds to follow the natural terrain — a hillside or a shoreline. A <strong>lane</strong> is narrow, historically rural. A <strong>way</strong> is a small side road branching off a larger one.`],
      ['Court, place, terrace: the dead ends',`A <strong>court</strong> (or <strong>cul-de-sac</strong>) ends in a loop with no through traffic. A <strong>place</strong> is usually a short road or dead end with no outlet. A <strong>terrace</strong> follows the top of a slope. These names hint that you won't pass through to somewhere else.`],
      ['Conventions, not rules',`Here's the honest part: none of this is legally binding. Developers and city planners follow the conventions loosely, and plenty of roads break them — you'll find a "Street" that curves and an "Avenue" with no grid at all. The suffix is a helpful hint about a road's character, not a guarantee. Out on the highway the naming is far stricter — and MileCheck reads your exact mile marker on any numbered route in real time. <a href="../how-interstates-are-numbered/">See how highways are numbered →</a>`],
    ],
    faq:[
      ["What's the difference between a street and an avenue?",`By tradition, streets and avenues run perpendicular to each other in a city grid — often streets one direction and avenues crossing them. Both are public roads lined with buildings, so the difference is orientation, not size. It's a convention, not a law.`],
      ['What is the difference between a road, a drive, and a lane?',`"Road" is the generic term for any route between two places. A "drive" usually winds to follow the terrain. A "lane" is a narrow, historically rural road. These are loose naming conventions rather than strict rules.`],
      ['Does a court mean a dead end?',`Usually yes. A court or cul-de-sac ends in a loop or closed end with no through traffic. "Place" and "terrace" often signal a dead end or no-outlet road as well.`],
      ['Are road name suffixes official rules?',`No. Street, avenue, boulevard and the rest follow common conventions that planners apply loosely. Many roads don't match the traditional meaning, so treat the suffix as a hint, not a guarantee.`],
    ],
    related:`<a href="../how-interstates-are-numbered/">How interstates are numbered</a> · <a href="../highway-sign-colors/">Highway sign colors</a> · <a href="../what-is-my-mile-marker/">What is my mile marker?</a>`,
  },
  {
    slug:'runaway-truck-ramps', eyebrow:'Highway basics',
    title:"What Are Runaway Truck Ramps? (How They Work)",
    h1:"What are runaway truck ramps?",
    lede:`On steep mountain downgrades you'll see signs for a "runaway truck ramp" — an emergency escape lane built to stop a truck that has lost its brakes. Here's how they work and why they're there.`,
    sections:[
      ['Why they exist',`A fully loaded truck descending a long, steep grade can overheat and lose its brakes — a failure called brake fade. A runaway truck ramp (or escape ramp) is a dedicated lane, usually branching uphill off the right shoulder, that gives a brakeless truck a safe place to stop instead of hurtling into traffic at the bottom of the grade.`],
      ['How they stop a truck',`Most ramps use an <strong>arrester bed</strong> — a long pit of loose gravel or sand, often on an uphill slope. The deep, loose material grabs the wheels and drags the truck to a halt through rolling resistance, while the incline lets gravity help. Some ramps use a steep uphill grade alone, or a pile of sand as the arrestor.`],
      ["Where you'll find them",`They appear on notorious long descents — mountain passes and grades where the road drops steadily for miles. Signs warn well in advance ("Runaway truck ramp, 1 mile"), so a driver already in trouble knows one is coming and where it is.`],
      ['What it means for every driver',`Even if you never use one, the presence of runaway ramps is a signal: you're on a serious grade. Gear down, keep your speed in check, and give trucks room — a heavy vehicle can't stop the way you can. MileCheck shows your exact mile marker as you descend, so if you ever have to report a problem or a stopped vehicle, you know precisely where you are. <a href="../passes/">See current mountain pass conditions →</a>`],
    ],
    faq:[
      ['What is a runaway truck ramp?',`It's an emergency escape lane on a steep downgrade, built to stop a truck that has lost its brakes. It usually branches off the right side and uses a bed of loose gravel or sand, often uphill, to bring the vehicle safely to a stop.`],
      ['How does a runaway truck ramp stop a truck?',`Most use an arrester bed of deep, loose gravel or sand on an uphill slope. The loose material and the incline together drag the truck to a halt through rolling resistance and gravity.`],
      ['Why do trucks lose their brakes on downgrades?',`Long, steep descents force the brakes to work continuously until they overheat and fade. Truckers gear down to use engine braking, but an escape ramp is the backup if the brakes fail anyway.`],
      ['Can a car use a runaway truck ramp?',`No. They're built and reserved for trucks and heavy vehicles in a genuine brake emergency. A car should never pull onto one to park or turn around — the loose surface can trap a light vehicle, and a real runaway truck may need it.`],
    ],
    related:`<a href="../chains-required-explained/">What "chains required" means</a> · <a href="../passes/">Mountain pass conditions</a> · <a href="../what-is-my-mile-marker/">What is my mile marker?</a>`,
  },
  {
    slug:'left-exit-vs-right-exit', eyebrow:'Highway basics',
    title:"Left Exit vs Right Exit: What the Exit Tab Tells You",
    h1:"Left exit vs right exit: what the exit tab tells you",
    lede:`That little "EXIT" tab on top of a green highway sign does more than number the exit — which side it sits on tells you whether you'll leave from the left lane or the right. Here's how to read it.`,
    sections:[
      ['The exit tab',`The small tab mounted on top of a big green guide sign carries the exit number. It's called the <strong>exit tab</strong>, and where it sits on the sign is a deliberate signal set by the federal sign manual (the MUTCD) — not just decoration.`],
      ['Right side = right exit',`By default the exit tab sits on the <strong>right</strong> of the sign, and the great majority of exits leave from the right lane. If the tab is on the right or centered, plan to be in the right-hand lanes to take the ramp.`],
      ['Left side = left exit',`When the tab is placed on the <strong>left</strong> of the sign — often with the words "LEFT EXIT" — the ramp leaves from the <strong>left</strong> lane instead. Left exits are less common and easy to miss, which is exactly why the tab moves to the left to warn you to get over early.`],
      ['The number is usually your mile marker',`The number on the tab is usually the exit's mile marker, so it also tells you how far along the highway you are. For your continuous position between exits, watch the small green mile markers — or let MileCheck read your exact mile marker in real time as you drive. <a href="../mile-markers-vs-exit-numbers/">Mile markers vs exit numbers →</a>`],
    ],
    faq:[
      ['What does the exit tab on a highway sign mean?',`It shows the exit number, and its position signals the exit side. A tab on the right (the default) means a right-lane exit; a tab on the left means the ramp leaves from the left lane.`],
      ['How do I know if an exit is on the left?',`Look at the exit tab on the sign. If it's placed on the left side, often labeled "LEFT EXIT," the ramp leaves from the left lane. A right or centered tab means a normal right-side exit.`],
      ['Why are some highway exits on the left?',`Left exits usually come from the road's design — older interchanges, express/local lane splits, or geography. Because drivers expect right exits, signs move the exit tab to the left to warn them in advance.`],
      ['Is the exit number the same as the mile marker?',`On most US interstates, yes — exit numbers are mile-based, so the number on the tab is about the same as the nearest mile marker. Some older highways use sequential numbering that doesn't match mileage.`],
    ],
    related:`<a href="../mile-markers-vs-exit-numbers/">Mile markers vs exit numbers</a> · <a href="../highway-sign-colors/">Highway sign colors</a> · <a href="../what-is-my-mile-marker/">What is my mile marker?</a>`,
  },
  {
    slug:'what-is-511', eyebrow:'Road conditions',
    title:"What Is 511? The Free Road-Conditions Number",
    h1:"What is 511? The free travel-info line",
    lede:`Dial 511 in most US states and you reach a free travel-information service — road conditions, closures, construction, and weather for that state's highways. Here's how it works and where the data comes from.`,
    sections:[
      ['What 511 is',`511 is a national, three-digit phone and web service for <strong>traveler information</strong>. The Federal Communications Commission set it aside in 2000 so every state could offer road conditions, crash and construction alerts, weather, and closures through one easy-to-remember number. Most states run their own 511 phone line, website, and app.`],
      ['What you can get from it',`A typical 511 service reports <strong>current road conditions</strong> (dry, wet, snow, ice), <strong>closures and construction</strong>, <strong>crashes and incidents</strong>, <strong>mountain-pass and chain requirements</strong>, and often <strong>live traffic cameras</strong>. Coverage focuses on interstates and major state highways — the roads a DOT actively monitors.`],
      ["The catch: it's split across 50+ systems",`Here's the friction: <strong>every state runs its own 511</strong>, with its own phone tree, website, app, and data format. Cross a state line and you're on a different system. Plan a trip through three states and that's three 511 sites to check — there's no single national feed a driver can just glance at.`],
      ['MileCheck brings it into one place',`MileCheck pulls normalized DOT alerts from all 50 states plus British Columbia into one app — closures, crashes, construction, weather, chain controls, and cameras — on a single map, tied to your exact mile marker as you drive. It's the 511 idea without the 50 different websites. <a href="../cameras/">Browse live highway cameras →</a>`],
    ],
    faq:[
      ['What is 511 used for?',`511 is a free US traveler-information service. It reports road conditions, closures, construction, crashes, weather, mountain-pass status, and often live cameras for a state's highways, by phone or online.`],
      ['Is 511 free to call?',`Yes. 511 is the FCC's national traveler-information number and is free to call in participating states. Standard mobile minutes may apply, but there's no service charge.`],
      ['Does every state have 511?',`Most do, but each state runs its own 511 phone line, website, and app with its own coverage and format. A few states don't operate a full 511 service, and there is no single national system.`],
      ['Is there an app that combines 511 from every state?',`State 511 services are separate. MileCheck combines normalized DOT road alerts and cameras from all 50 states (plus British Columbia) into one app, tied to your live mile marker.`],
    ],
    related:`<a href="../cameras/">Live highway cameras</a> · <a href="../chains-required-explained/">What "chains required" means</a> · <a href="../what-is-my-mile-marker/">What is my mile marker?</a>`,
  },
  {
    slug:'check-road-conditions-before-a-trip', eyebrow:'Road trips',
    title:"How to Check Road Conditions Before a Road Trip",
    h1:"How to check road conditions before a road trip",
    lede:`Before a long drive — especially over mountain passes or in winter — a few minutes checking conditions can save you from a closure, a chain requirement, or a white-knuckle surprise. Here's a simple pre-trip routine.`,
    sections:[
      ['Start with the DOT or 511 for each state',`Your first stop is the state transportation department (DOT) or its 511 service for <strong>every state your route crosses</strong>. They post closures, construction, crashes, and mountain-pass and chain status for the highways you'll actually be on. <a href="../what-is-511/">More on 511 →</a>`],
      ['Look at live traffic cameras',`A road report tells you the status; a <strong>camera</strong> shows you the reality — how much snow is actually on the pass, whether traffic is crawling. Check cameras at the choke points on your route, especially summits and known bottlenecks. <a href="../cameras/">Browse live highway cameras →</a>`],
      ['Check the weather along the route, not just the ends',`Weather at your start and destination can be fine while the pass in the middle is in a storm. Look at the forecast for the <strong>high points and passes</strong> on your route, and watch for wind, ice, and snow level — the details that decide whether a mountain highway stays open.`],
      ["Know your position once you're rolling",`Conditions change mid-drive. Once you're on the road, MileCheck shows your exact mile marker in real time plus live DOT alerts and the nearest camera on your route — so a closure or chain control ahead isn't a surprise, and if you need help you know precisely where you are. Works offline, on CarPlay and Android Auto.`],
    ],
    faq:[
      ['How do I check road conditions for a road trip?',`Check the state DOT or 511 service for every state on your route for closures and pass status, look at live traffic cameras at the summits and bottlenecks, and review the weather forecast for the high points along the way — not just your start and end.`],
      ['How do I know if a mountain pass is open?',`Check the state DOT's pass report and live cameras for that pass. They post current conditions, chain requirements, and any closures, which can change within an hour during a storm.`],
      ["What's the best way to check road conditions while driving?",`Use a hands-free app. MileCheck shows your live mile marker, DOT alerts, and the nearest camera on your route on CarPlay or Android Auto, so you get closures and chain controls ahead without stopping.`],
      ['Should I check road conditions in summer too?',`Yes. Summer brings construction, wildfires and smoke, crashes, and heat-related closures. Roadwork and conditions affect drives year-round, not just in winter.`],
    ],
    related:`<a href="../what-is-511/">What is 511?</a> · <a href="../cameras/">Live highway cameras</a> · <a href="../passes/">Mountain pass conditions</a>`,
  },
  {
    slug:'what-is-black-ice', eyebrow:'Winter driving',
    title:"What Is Black Ice — and How to Drive on It",
    h1:"What is black ice, and how do you drive on it?",
    lede:`Black ice is a thin, nearly invisible layer of ice that looks like harmless wet pavement — which is exactly what makes it so dangerous. Here's how to spot it and what to do if you hit it.`,
    sections:[
      ["Why it's called black ice",`Black ice is a thin, transparent sheet of ice. It isn't actually black — it's clear, so you see the dark pavement right through it and it just looks <strong>wet</strong>. That camouflage is the danger: drivers don't slow down for what looks like a damp patch.`],
      ['Where and when it forms',`It forms when a thin layer of water freezes — after rain or melting snow refreezes, and in the <strong>early morning and overnight</strong> as temperatures drop. Watch for it on <strong>bridges and overpasses</strong> (they lose heat from above and below, so they freeze first), in <strong>shaded spots</strong>, and near the bottom of hills where water collects.`],
      ['How to spot it',`When it's cold enough to freeze, look for pavement that appears <strong>wet or glossy</strong>, especially on bridges and shaded stretches. If the road still looks wet but spray has stopped coming off other cars' tires, that "water" may be ice. Any time it's near or below freezing, treat suspiciously shiny pavement as ice.`],
      ['What to do if you hit it',`Don't panic and don't slam the brakes — hard braking can throw you into a skid. <strong>Ease off the gas, keep the wheel straight, and let the car slow on its own.</strong> If you start to slide, steer gently in the direction you want the front of the car to go. The best defense is prevention: slow down, leave extra following distance, and be especially careful on bridges. MileCheck's live DOT alerts flag icy conditions ahead, and your exact mile marker means that if you do end up stopped, you can report precisely where you are.`],
    ],
    faq:[
      ['What is black ice?',`Black ice is a thin, transparent layer of ice on the road. It's clear rather than black, so the dark pavement shows through and it looks like ordinary wet road — which makes it hard to see and easy to hit at speed.`],
      ['Where does black ice form most often?',`On bridges and overpasses (they freeze first because they lose heat from above and below), in shaded areas, and low spots where water pools. It's most common overnight and in the early morning when temperatures drop.`],
      ['What should you do if you hit black ice?',`Stay calm, ease off the accelerator, and keep the steering wheel straight — don't brake hard. Let the vehicle slow on its own, and if it slides, steer gently in the direction you want to go.`],
      ['How can you tell if the road has black ice?',`When it's near or below freezing, watch for pavement that looks wet or glossy, especially on bridges and in shade. If the road looks wet but no spray is coming off other tires, it may be ice.`],
    ],
    related:`<a href="../chains-required-explained/">What "chains required" means</a> · <a href="../passes/">Mountain pass conditions</a> · <a href="../what-is-my-mile-marker/">What is my mile marker?</a>`,
  },
  {
    slug:'steep-grade-signs-explained', eyebrow:'Highway basics',
    title:"What Steep Grade Signs Mean (6% Grade Ahead)",
    h1:"What steep grade signs mean",
    lede:`A yellow sign warning of a "6% GRADE" and "TRUCKS USE LOWER GEAR" tells you the road ahead drops steeply for a distance. Here's what the percentage means and how to descend safely.`,
    sections:[
      ['What the percentage means',`The number is the road's <strong>grade</strong> — how many feet it rises or falls per 100 feet of distance. A <strong>6% grade</strong> means the road drops 6 feet for every 100 feet you travel. It sounds small, but over several miles it adds up to a long, demanding descent, which is why anything around 5–7% earns a warning sign.`],
      ['Why the signs warn trucks',`A heavy truck descending a long grade builds speed and heats its brakes. Ride the brakes the whole way down and they can overheat and fade — lose their grip entirely. That's why the signs say <strong>"trucks use lower gear"</strong>: gearing down lets the engine do the braking, so the brakes stay cool and ready.`],
      ['How to descend safely',`Whatever you're driving, <strong>shift to a lower gear before you start down</strong>, not partway through. Let engine braking hold your speed, and use the brakes in firm, brief applications rather than riding them continuously. Keep extra distance from the vehicle ahead — a heavy truck can't slow or stop the way a car can.`],
      ['Runaway ramps are the backup',`On the steepest, longest descents you'll also see signs for a <a href="../runaway-truck-ramps/">runaway truck ramp</a> — an emergency escape lane for a vehicle that has lost its brakes. Their presence is a signal you're on a serious grade. MileCheck shows your exact mile marker as you descend, so if you ever need to report a problem, you know precisely where you are.`],
    ],
    faq:[
      ['What does a 6% grade sign mean?',`It means the road descends (or climbs) 6 feet for every 100 feet of horizontal distance. Over several miles that's a long, steep descent, which is why grades around 5–7% get warning signs.`],
      ['Why do steep grade signs say trucks use lower gear?',`Heavy trucks that ride their brakes down a long grade can overheat them until they fade. Shifting to a lower gear lets the engine slow the truck, keeping the brakes cool and effective.`],
      ['How do you drive down a steep grade safely?',`Shift into a lower gear before you start the descent, let engine braking control your speed, apply the brakes in short firm bursts instead of riding them, and leave extra following distance.`],
      ['What is a runaway truck ramp?',`An emergency escape lane on a steep downgrade, filled with loose gravel or sand, that stops a truck whose brakes have failed. Signs warn of them in advance on the steepest descents.`],
    ],
    related:`<a href="../runaway-truck-ramps/">Runaway truck ramps</a> · <a href="../chains-required-explained/">What "chains required" means</a> · <a href="../passes/">Mountain pass conditions</a>`,
  },
  {
    slug:'dragging-trailer-chains-wildfire', eyebrow:'Road safety',
    title:"Can Dragging Trailer Chains Start a Wildfire?",
    h1:"Can dragging trailer chains start a wildfire?",
    lede:`Yes — safety chains left hanging too low scrape the pavement and throw sparks, and on a dry, windy day those sparks start roadside fires. It's one of the most common preventable wildfire causes, and it's easy to avoid.`,
    sections:[
      ['How chains start fires',`Trailer <strong>safety chains</strong> connect the trailer to the tow vehicle as a backup if the hitch fails. If they're too long or hooked so they hang low, they drag on the road as you drive — and steel on pavement throws a shower of <strong>sparks.</strong> Along a dry grassy shoulder in summer, one spark is all it takes. Fire agencies count dragging chains among the top preventable causes of roadside wildfires every year.`],
      ['Cross them and keep them short',`The fix is simple: <strong>cross the safety chains</strong> in an X under the trailer tongue and hook them back to the tow vehicle. Crossing them cradles the tongue if the coupler ever comes loose, and — done right — keeps the chains up off the ground. Leave just enough slack to turn corners, and <strong>no more.</strong> If a chain still drags, shorten it (twist a link or take up length on the hook) so it can't reach the pavement.`],
      ["Chains aren't the only spark source",`Anything metal dragging behind a vehicle can do it — a loose strap with a buckle, a dropped exhaust part, or a <strong>blown tire riding on the bare rim.</strong> A hot catalytic converter or exhaust parked over dry grass can ignite it too. On high fire-danger days, walk around your trailer before you leave and glance back now and then to be sure nothing's dragging. <a href="../roadside-wildfire-causes/">More on what starts roadside fires →</a>`],
      ["Know what's burning on your route",`If a fire does start ahead — from any cause — you want to know before you drive into the smoke. MileCheck shows active wildfires and closures on your route in real time, tied to your exact mile marker, so you can reroute or report a new fire with a precise location. <a href="../fire/">See the live wildfire map →</a>`],
    ],
    faq:[
      ['Can dragging trailer chains really start a fire?',`Yes. Safety chains hanging low enough to scrape the pavement throw sparks, and on dry vegetation those sparks can ignite a wildfire. It's a leading preventable cause of roadside fires in fire-prone states.`],
      ['How should trailer safety chains be attached?',`Cross them in an X under the trailer tongue and connect them to the tow vehicle. Crossing cradles the tongue if the hitch fails and helps keep the chains off the ground. Leave only enough slack to turn corners.`],
      ['How do I keep my trailer chains from dragging?',`Shorten them so they can't reach the road — twist links, take up slack on the hook, or cross them under the tongue. Leave just enough length to turn, and check that nothing drags before you drive off.`],
      ['What should I do if I see a roadside fire start?',`Get to a safe distance and report it with a precise location — your mile marker and route. Apps like MileCheck show your exact mile marker and the active fires on your route so you can give responders an accurate spot.`],
    ],
    related:`<a href="../roadside-wildfire-causes/">What causes roadside wildfires</a> · <a href="../report-location/">Report your location</a> · <a href="../what-is-my-mile-marker/">What is my mile marker?</a>`,
  },
  {
    slug:'roadside-wildfire-causes', eyebrow:'Road safety',
    title:"What Causes Roadside Wildfires (and How to Avoid One)",
    h1:"What causes roadside wildfires — and how to avoid starting one",
    lede:`A surprising share of wildfires start right along the highway, sparked by vehicles and equipment. Most are completely preventable. Here are the common causes and the simple habits that keep you from starting one.`,
    sections:[
      ['Dragging chains and metal parts',`Trailer <strong>safety chains</strong> hung too low scrape the road and throw sparks — a top preventable cause. So does any metal dragging behind a vehicle: a loose tie-down, a dropped exhaust part, or a <strong>blown tire riding on the bare rim.</strong> Cross and shorten trailer chains so they can't reach the pavement, and pull over promptly for a flat. <a href="../dragging-trailer-chains-wildfire/">More on trailer chains and fire →</a>`],
      ['Hot vehicle parts on dry grass',`A car's <strong>catalytic converter and exhaust run hot enough to ignite dry grass</strong> just by parking over it. Don't pull a hot vehicle onto dry vegetation on the shoulder or at a pullout — park on gravel, dirt, or pavement instead.`],
      ['Sparks, loose loads, and cigarettes',`Equipment dragged or run along a dry shoulder throws sparks, an improperly secured load can drop metal that sparks on the road, and a tossed cigarette is a classic roadside ignition. On <strong>red-flag (high fire-danger) days</strong>, take extra care: secure your load, skip spark-throwing roadside work, and never toss anything burning from a vehicle.`],
      ["Know what's burning on your route",`Even when you do everything right, fires start. MileCheck shows active wildfires and closures on your route in real time, tied to your exact mile marker — so you can avoid driving into smoke, reroute around a closure, and report a new fire with a precise location. <a href="../fire/">See the live wildfire map →</a>`],
    ],
    faq:[
      ['What is the most common cause of roadside wildfires?',`Vehicle-related sparks — especially dragging trailer safety chains and blown tires riding on bare rims — plus hot exhaust parts on dry grass and tossed cigarettes. Most are preventable.`],
      ['Can parking on dry grass start a fire?',`Yes. A vehicle's catalytic converter and exhaust get hot enough to ignite dry grass underneath. Park on gravel, dirt, or pavement instead of dry vegetation, especially in fire season.`],
      ['What is a red-flag warning?',`A red-flag warning means weather conditions — often hot, dry, and windy — make wildfires far more likely to start and spread. On those days, take extra care with anything that can throw a spark.`],
      ['How can I see wildfires near a highway?',`MileCheck shows active wildfires and closures along your route in real time, tied to your live mile marker, so you can reroute around smoke or report a new fire with a precise location.`],
    ],
    related:`<a href="../dragging-trailer-chains-wildfire/">Can dragging chains start a wildfire?</a> · <a href="../report-location/">Report your location</a> · <a href="../what-is-my-mile-marker/">What is my mile marker?</a>`,
  },
  {
    slug:'winter-car-prep-checklist', eyebrow:'Winter driving',
    title:"How to Get Your Car Ready for Fall and Winter",
    h1:"How to get your car ready for fall and winter",
    lede:`Before the first cold snap, an hour of prep makes winter driving safer and heads off the breakdowns that always seem to happen in the worst weather. Here's a straightforward checklist.`,
    sections:[
      ['Tires and traction',`Cold weather is hard on tires. Check your <strong>tread depth</strong> and <strong>tire pressure</strong> — pressure drops as temperatures fall, and worn tread loses grip on snow and ice. If you drive mountain or snowy routes, consider <strong>winter (snow) tires</strong>, and carry <strong>chains</strong> for passes that require them. <a href="../chains-required-explained/">What "chains required" means →</a>`],
      ['Battery, fluids, and wipers',`Cold saps battery power, so have a weak <strong>battery</strong> tested before it strands you. Top off <strong>antifreeze/coolant</strong> to the right mix, switch to <strong>winter windshield washer fluid</strong> rated for freezing temperatures, and replace worn <strong>wiper blades</strong> — you'll use them constantly in slush and snow. Keeping the fuel tank fuller than usual reduces condensation and gives you a buffer.`],
      ['Lights, heat, and defrost',`Days are short and storms are dark. Check that all your <strong>lights</strong> work and the lenses are clear, and confirm your <strong>heater, defroster, and rear-window defogger</strong> all work before you need them. Clear snow and ice off the <em>whole</em> car — roof included — before you drive.`],
      ['Pack a winter kit, and know your route',`Keep a cold-weather kit in the car: <strong>ice scraper, blanket, gloves, flashlight, jumper cables, some food and water,</strong> and a phone charger. Before a winter drive, check conditions and passes on your route — and once you're moving, MileCheck shows your exact mile marker plus live DOT alerts and cameras, so a closure or chain control ahead isn't a surprise, and if you're stuck you can report exactly where you are. <a href="../check-road-conditions-before-a-trip/">How to check road conditions →</a>`],
    ],
    faq:[
      ['How do I prepare my car for winter?',`Check tire tread and pressure (and consider snow tires or chains), test a weak battery, top off coolant and switch to winter washer fluid, replace worn wipers, confirm lights and defrosters work, and pack a cold-weather emergency kit.`],
      ['When should I get my car ready for winter?',`In the fall, before the first hard freeze or snow. It's far easier to test a battery, swap tires, and top off fluids on a mild day than after you're already stranded in the cold.`],
      ['Do I need winter tires?',`If you regularly drive in snow, ice, or over mountain passes, winter tires grip noticeably better than all-seasons. If not, good all-season tread plus chains for the passes may be enough — check your route's requirements.`],
      ['What should I keep in my car in winter?',`An ice scraper, a blanket, gloves, a flashlight, jumper cables, some food and water, and a phone charger. Keeping the fuel tank fuller also helps if you're delayed or stuck.`],
    ],
    related:`<a href="../chains-required-explained/">What "chains required" means</a> · <a href="../what-is-black-ice/">What is black ice?</a> · <a href="../check-road-conditions-before-a-trip/">Check road conditions</a>`,
  },
];

function faqJsonLd(g){ return JSON.stringify({'@context':'https://schema.org','@type':'FAQPage','mainEntity':g.faq.map(([q,a])=>({'@type':'Question','name':q,'acceptedAnswer':{'@type':'Answer','text':a.replace(/<[^>]+>/g,'')}}))}); }
function articleJsonLd(g){ return JSON.stringify({'@context':'https://schema.org','@type':'Article','headline':g.h1,'author':{'@type':'Organization','name':'MileCheck'},'publisher':{'@type':'Organization','name':'MileCheck'},'mainEntityOfPage':'https://milecheckapp.com/'+g.slug+'/'}); }

function page(g){
  const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const secHtml=g.sections.map(([h,p])=>`    <h2>${h}</h2>\n    <p>${p}</p>`).join('\n');
  const faqHtml=g.faq.map(([q,a])=>`      <details><summary>${q}</summary><p>${a}</p></details>`).join('\n');
  const t=esc(g.title)+' | MileCheck';
  const desc=esc(g.lede.replace(/<[^>]+>/g,'').slice(0,155));
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta name="apple-itunes-app" content="app-id=6759212851">
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t}</title>
  <meta name="description" content="${desc}">
  <link rel="canonical" href="https://milecheckapp.com/${g.slug}/">
  <meta property="og:title" content="${t}">
  <meta property="og:description" content="${desc}">
  <meta property="og:image" content="https://milecheckapp.com/images/og-banner-light.png">
  <meta property="og:url" content="https://milecheckapp.com/${g.slug}/">
  <meta property="og:type" content="article">
  <link rel="icon" type="image/png" href="../images/favicon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../style.css">
  <script type="application/ld+json">${faqJsonLd(g)}</script>
  <script type="application/ld+json">${articleJsonLd(g)}</script>
  <style>
    .art{max-width:760px;margin:0 auto;padding:34px 20px 40px;}
    .art .eyebrow{font-size:13px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:#0f7a4f;margin-bottom:6px;}
    .art h1{font-size:clamp(28px,5vw,42px);line-height:1.12;margin:0 0 14px;}
    .art .lede{font-size:18px;line-height:1.6;color:#3a444d;margin:0 0 22px;}
    .art h2{font-size:23px;margin:30px 0 8px;}
    .art p{font-size:16px;line-height:1.7;color:#2a333b;margin:0 0 14px;}
    .art a{color:#0f7a4f;font-weight:700;text-decoration:none;}
    .art a:hover{text-decoration:underline;}
    .art strong{color:#0E1116;}
    .cta{border:1px solid #E5E5E5;border-radius:16px;background:linear-gradient(135deg,#f4fbf7,#ffffff);padding:24px 22px;margin:28px 0;text-align:center;}
    .cta h3{font-size:21px;margin:0 0 8px;}
    .cta p{font-size:15.5px;color:#3a444d;margin:0 auto 14px;max-width:520px;}
    .cta .btns{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;}
    .cta .btns a{display:inline-block;padding:11px 20px;border-radius:10px;font-weight:700;font-size:14.5px;text-decoration:none;}
    .cta .btns a.primary{background:#0f7a4f;color:#fff;}
    .cta .btns a.ghost{border:1px solid #0F1419;color:#0F1419;}
    .faq details{border:1px solid #E5E5E5;border-radius:12px;background:#fff;padding:14px 18px;margin-bottom:10px;}
    .faq summary{font-weight:700;font-size:16px;cursor:pointer;}
    .faq p{margin:10px 0 0;}
    .g-related{color:#5b6670;font-size:14px;margin-top:26px;}
    .g-related a{color:#0f7a4f;font-weight:700;text-decoration:none;}
  </style>
</head>
<body>

  <header class="site-header">
    <div class="container header-inner">
      <a href="../index.html" class="brand" style="display:inline-flex;align-items:center;gap:9px;"><img src="../assets/app-icon-60.png" alt="" style="width:28px;height:28px;border-radius:7px;flex-shrink:0;">MileCheck</a>
      <button class="nav-toggle" aria-label="Menu"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0F1419" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg></button>
      <nav class="primary-nav">
        <a href="../index.html">Home</a>
        <a href="../maps/">Maps</a>
        <a href="../cameras/">Cameras</a>
        <a href="../states/">United States</a>
        <a href="../canada/">Canada</a>
        <a href="../index.html#story">Story</a>
        <a href="../index.html#b2b">B2B</a>
        <a href="../blog/">Blog</a>
        <a href="/get/" class="nav-cta">Get the app</a>
      </nav>
    </div>
  </header>

  <article class="art">
    <div class="eyebrow">${g.eyebrow}</div>
    <h1>${g.h1}</h1>
    <p class="lede">${g.lede}</p>

${secHtml}

    <div class="cta">
      <h3>Know exactly where you are — live</h3>
      <p>MileCheck shows your nearest mile marker in real time as you drive, plus live DOT alerts and the nearest camera on your route. Free to start, works offline, runs on CarPlay and Android Auto.</p>
      <div class="btns">
        <a class="primary" href="${APP}" target="_blank" rel="noopener">iOS App Store</a>
        <a class="ghost" href="${PLAY}" target="_blank" rel="noopener">Google Play</a>
      </div>
    </div>

    <h2 style="margin-top:34px">Questions, answered</h2>
    <div class="faq">
${faqHtml}
    </div>

    <p class="g-related">Related: ${g.related}</p>
  </article>

  <footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-col footer-col-brand">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;"><img src="../assets/app-icon-60.png" alt="MileCheck" style="width:36px;height:36px;border-radius:9px;flex-shrink:0;"><p class="footer-brand" style="margin-bottom:0;">MileCheck</p></div>
          <p class="footer-tagline">Mile markers in all 50 US states.</p>
        </div>
        <div class="footer-col">
          <p class="footer-label">Get the app</p>
          <ul class="footer-list">
            <li><a href="${APP}" target="_blank" rel="noopener">iOS App Store</a></li>
            <li><a href="${PLAY}" target="_blank" rel="noopener">Google Play</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <p class="footer-label">Learn more</p>
          <ul class="footer-list">
            <li><a href="../what-is-my-mile-marker/">What is my mile marker?</a></li>
            <li><a href="../cameras/">Highway cameras</a></li>
            <li><a href="../passes/">Mountain passes</a></li>
            <li><a href="../maps/">All maps</a></li>
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
      <p class="footer-fineprint">&copy; 2026 MileCheck LLC. Always drive to conditions and follow posted signs.</p>
    </div>
  </footer>

<script>(function(){var t=document.querySelector(".nav-toggle"),n=document.querySelector(".primary-nav");if(t&&n){t.addEventListener("click",function(){n.classList.toggle("open");});document.addEventListener("click",function(e){if(!e.target.closest(".header-inner"))n.classList.remove("open");})}})();</script>
</body>
</html>`;
}

let n=0;
for(const g of GUIDES){
  const dir=g.slug;
  fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,'index.html'),page(g));
  n++;
  console.log('wrote '+g.slug+'/index.html  ('+g.title+')');
}
console.log('\nGenerated '+n+' guide pages.');
