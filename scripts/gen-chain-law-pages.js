// gen-chain-law-pages.js — /chain-laws/<state>/, one combined page for AZ, NM and AK, and
// the /chain-laws/ hub (2026-10-15, item 3 of docs/site-growth-plan-2026-10-13.md).
//
// Source: MILECHECKAPP/docs/chain-laws-research-2026-10-13.md, re-checked 2026-10-15.
// Only items that research marks verified are stated as law, each with its official URL.
// Items marked secondary are either left out or attributed to who said them. Left out on
// purpose: Colorado code numbers 15-18, Colorado commercial fines and SB 24-100 routes,
// the Washington $500 fine and carry-chains window, Wyoming fines and statute, Oregon
// passenger sign wording, Nevada R1/R2/R3 definitions, the BC 11,794 kg threshold, the
// California vehicle code sections, Alaska studded-tire dates, the NM statute.
//
// Each state page has a live block. It reads the same Worker /incidents and /conditions
// feeds as /chains/ and keeps reports that name a chain or traction rule. A fetch failure
// reads as an outage, never as "no chains required". The page states the law and its
// source. It gives no verdict on any road.
//
// Chrome copied from gen-seasonal-closure-pages.js. Does not touch gen-pass-pages.js,
// gen-corridor-pages.js or scripts/lib/road-status*.js. The /chains/ live map is a
// separate page and is not written here.
//
// Run: node scripts/gen-chain-law-pages.js
'use strict';
const fs = require('fs');
const path = require('path');
const SPON = require('./lib/sponsor-slot');
const STATES = require('./road-conditions/states.cjs');
const SLOT_CSS = SPON.slot({ kind: 'live', slug: 'chain-laws', name: '(css only)' }).css;

const ROOT = path.resolve(__dirname, '..');
const rel = (p) => path.join(ROOT, p);
const exists = (p) => fs.existsSync(rel(p));
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const STATE = Object.fromEntries(STATES.map((s) => [s.code, s]));
STATE.BC = { code: 'BC', name: 'British Columbia', dot: 'DriveBC', dotUrl: 'https://www.drivebc.ca' };
const slugOf = (code) => STATE[code].name.toLowerCase().replace(/[^a-z]+/g, '-');
const READ = 'October 15, 2026';
const short = (u) => u.replace(/^https?:\/\/(www\d?\.)?/, '').replace(/[?#].*$/, '').replace(/\/$/, '');

// Official sources, read 2026-10-15.
const U = {
  wsdotCv: 'https://wsdot.wa.gov/commercial-vehicle/permits/chain-requirements',
  wsdotCv10k: 'https://wsdot.wa.gov/travel/commercial-vehicles/route-commercial-vehicle-restrictions/chain-requirements-vehicles-over-10000-pounds',
  wsdotPass: 'https://wsdot.wa.gov/travel/real-time/mountainpasses',
  odotCv: 'https://www.oregon.gov/odot/pages/winter-commercial-vehicles.aspx',
  tripcheckChains: 'https://www.tripcheck.com/Pages/Chain-Requirements',
  ors815: 'https://www.oregonlegislature.gov/bills_laws/ors/ors815.html',
  caltrans: 'https://dot.ca.gov/travel/winter-driving-tips/chain-controls',
  cdot: 'https://www.codot.gov/travel/winter-driving/TractionLaw',
  id49948: 'https://legislature.idaho.gov/statutesrules/idstat/Title49/T49CH9/SECT49-948/',
  mca520: 'https://leg.mt.gov/bills/mca/title_0610/chapter_0090/part_0050/section_0200/0610-0090-0050-0200.html',
  mca406: 'https://leg.mt.gov/bills/mca/title_0610/chapter_0090/part_0040/section_0060/0610-0090-0040-0060.html',
  ut715: 'https://le.utah.gov/xcode/Title41/Chapter6A/41-6a-S715.html',
  mdt: 'https://www.mdt.mt.gov/travinfo/',
  wydot: 'https://dot.state.wy.us/home/travel/winter/chain_law.html',
  wyDefs: 'https://www.wyoroad.info/Highway/definitions.html',
  udotCc: 'https://cottonwoodcanyons.udot.utah.gov/traction-law/',
  nrs484d: 'https://www.leg.state.nv.us/NRS/NRS-484D.html#NRS484DSec520',
  nrs515: 'https://www.leg.state.nv.us/NRS/NRS-484D.html#NRS484DSec515',
  nrs484a: 'https://www.leg.state.nv.us/NRS/NRS-484A.html',
  bcRoutes: 'https://www2.gov.bc.ca/gov/content/transportation/driving-and-cycling/traveller-information/seasonal/winter-driving/winter-tire-and-chain-up-routes',
  bcEnf: 'https://www2.gov.bc.ca/gov/content/transportation/driving-and-cycling/traveller-information/seasonal/winter-driving/enforcement',
  akDps: 'https://dps.alaska.gov/2022-studded-tire-deadline-approaching/',
  rcw47: 'https://app.leg.wa.gov/RCW/default.aspx?cite=47.36.250',
  ors153: 'https://www.oregonlegislature.gov/bills_laws/ors/ors153.html',
};
const cite = (url, label) => ` <span class="cl-src">Source: <a href="${url}" target="_blank" rel="noopener">${esc(label || short(url))}</a></span>`;

// Per state: levels (name, meaning, src), rules (text, src), fines (text, src), notes
// (secondary items, attributed in the text, no link), and the reader's question.
const PAGES = [
  {
    code: 'WA', q: 'Do I need chains in Washington?',
    lede: 'WSDOT posts traction and chain requirements by pass and direction. Posted chain controls depend on conditions. Vehicles over 10,000 lb GVWR must also carry chains on specified routes from November 1 through April 1.',
    levels: [
      ['Traction tires advised', 'Advised, not required. Oversize loads are not allowed.', U.wsdotCv],
      ['Traction tires required', 'Passenger vehicles need approved traction tires.', U.wsdotCv],
      ['Chains required', 'Chains on all vehicles except 4WD and AWD. Those must carry chains and run traction tires.', U.wsdotCv],
      ['Chains required on all vehicles', 'Includes 4WD and AWD.', U.wsdotCv],
    ],
    rules: [
      ['From November 1 through April 1, vehicles over 10,000 lb GVWR must carry chains on specified routes, whatever the road conditions.', U.wsdotCv10k],
      ['When a chain requirement is posted, vehicles and combinations over 10,000 lb chain according to their axle setup. WSDOT\'s page shows the placement.', U.wsdotCv10k],
      ['WSDOT posts the current requirement for each pass and each direction on its mountain pass pages.', U.wsdotPass],
    ],
    fines: [
      ['Not obeying a posted traction or chain requirement is a traffic infraction with a $500 penalty, statutory assessments included.', U.rcw47, 'RCW 47.36.250'],
    ],
  },
  {
    code: 'OR', q: 'Do I need chains in Oregon?',
    lede: 'Oregon posts chain requirements by sign in snow zones. There are no fixed dates. TripCheck lists the current requirement by highway.',
    levels: [
      ['Chains required on vehicles towing or single drive axles over 10,000 GVW', 'Under this posted restriction, vehicles over 10,000 lb GVW with a single drive axle must use chains. Tandem-drive-axle vehicles are not covered by this specific restriction. Other posted chain requirements may apply.', U.odotCv],
      ['Chains required on vehicles towing or over 10,000 GVW', 'Under this restriction, vehicles over 10,000 lb GVW and vehicles towing must use chains. Trailers must also be chained when required.', U.odotCv],
    ],
    rules: [
      ['Vehicles over 10,000 lb GVW must carry chains when road conditions might require them or when Snow Zone signs are posted. ODOT\'s words: "must carry chains whenever road conditions might require their use."', U.odotCv],
      ['TripCheck lists the chain requirements for passenger vehicles and trucks.', U.tripcheckChains],
    ],
    fines: [
      ['Not using required chains or traction tires is a Class C traffic violation. The presumptive fine for a Class C violation is $165.', U.ors153, 'ORS 815.140 and 153.019'],
      ['For vehicles registered under ORS chapter 826, mostly commercial trucks, it is a specific-fine violation with a $880 presumptive fine. Not carrying required chains is a separate Class C violation.', U.ors815, 'ORS 815.140 and 815.142'],
    ],
  },
  {
    code: 'CA', q: 'Do I need chains in California?',
    lede: 'Caltrans posts chain controls in three levels, R1, R2 and R3. Caltrans posts chain controls when snow and road conditions require them. There are no fixed dates.',
    levels: [
      ['R1', 'Chains required. Passenger cars and light trucks under 6,000 lb with snow tires on at least two drive wheels are exempt, but must carry chains. Vehicles towing trailers need chains on one drive axle, and trailers with brakes need chains on at least one axle.', U.caltrans],
      ['R2', 'Chains or traction devices required. 4WD and AWD with snow-tread tires on all four wheels are exempt, but must carry traction devices.', U.caltrans],
      ['R3', 'All vehicles must use chains or approved traction devices. There are no exemptions.', U.caltrans],
    ],
    rules: [
      ['Caltrans says drivers who ignore chain controls "can be cited by the California Highway Patrol and fined."', U.caltrans],
      ['Commercial vehicles over 6,500 lb must chain when chain controls are posted. Vehicles exempt from installing chains must still carry traction devices.', U.caltrans],
    ],
    fines: [],
    noFine: 'Caltrans says drivers who ignore chain controls can be cited and fined. The cited guidance does not specify an amount.',
  },
  {
    code: 'CO', q: 'Do I need chains in Colorado?',
    lede: 'Colorado has a Traction Law and a Passenger Vehicle Chain Law. CDOT can activate traction requirements when conditions warrant. On I-70 between Morrison and Dotsero, the traction requirements also apply from September 1 through May 31.',
    levels: [
      ['Traction Law', 'Passenger vehicles need all-weather or winter tires (mountain-snowflake, M+S or M/S) with at least 3/16-inch tread, or chains or an approved alternative traction device. AWD or 4WD alone does not meet it.', U.cdot],
      ['Passenger Vehicle Chain Law', 'Chains or an approved alternative on every passenger vehicle, 4WD and AWD included. CDOT uses it as the last step before closing the road.', U.cdot],
    ],
    rules: [],
    fines: [
      ['Not meeting the Traction Law or Chain Law: $100 fine plus a $33 surcharge.', U.cdot, 'CDOT Traction Law'],
      ['If it causes a lane to close: $500 fine plus a $157 surcharge.', U.cdot, 'CDOT Traction Law'],
    ],
  },
  {
    code: 'ID', q: 'Do I need chains in Idaho?',
    lede: 'Idaho Code 49-948 requires certain commercial vehicles over 26,000 lb to use chains when the restriction is active. The law lists exemptions. ITD may activate commercial chain requirements on designated routes when roadway conditions meet the law\'s requirements. There are no named levels.',
    levels: [],
    rules: [
      ['The routes named in the statute are I-90 at Lookout Pass, I-90 at Fourth of July Pass, and US-12 at Lolo Pass.', U.id49948, 'Idaho Code 49-948'],
      ['A covered commercial vehicle must chain at least one tire on each side of a drive axle. Each covered towed vehicle must have chains on one tire on each side of an axle at or near the rear. The statute also allows some alternative traction devices and lists exempt vehicle types.', U.id49948, 'Idaho Code 49-948'],
      ['ITD must give advance notice, provide a pull-out area before the zone, and not require chains on bare pavement.', U.id49948, 'Idaho Code 49-948'],
    ],
    fines: [],
    noFine: 'The applicable citation amount has not been verified. Follow posted chain requirements.',
  },
  {
    code: 'MT', q: 'Do I need chains in Montana?',
    lede: 'Montana may require chains or traction devices on signed highway sections. MCA 61-9-406 sets the applicable equipment rules. Montana does not use California\'s R1, R2 and R3 levels. Chain restrictions depend on posted conditions.',
    levels: [],
    rules: [
      ['When a chain requirement is posted, MCA 61-9-406 governs the use of chains or traction devices on the driving wheels of one axle.', U.mca406, 'MCA 61-9-406'],
      ['MDT posts current road conditions and restrictions on its traveler information page.', U.mdt],
    ],
    fines: [
      ['$250 for not following a posted chain or traction requirement. The penalty is $750 when a violation causes all lanes in one or both directions to close. It is a nonmoving violation.', U.mca520, 'MCA 61-9-520'],
    ],
  },
  {
    code: 'WY', q: 'Do I need chains in Wyoming?',
    lede: 'WYDOT uses two chain law levels. They apply to passenger and commercial vehicles, on the routes WYDOT names.',
    levels: [
      ['Level 1', 'Chains, adequate snow tires, or AWD.', U.wydot],
      ['Level 2', 'Chains, or AWD with adequate M+S or all-weather tires. Under Level 2, commercial vehicles must chain at least two drive wheels at opposite ends of the same axle.', U.wydot],
    ],
    rules: [
      ['WYDOT turns on chain restrictions on specific highway sections when conditions call for it. Check the current road report and the posted signs for active locations.', U.wydot],
      ['WYDOT\'s road condition definitions explain each term used on wyoroad.info.', U.wyDefs],
    ],
    fines: [
      ['$250 for violating the travel restriction. $750 for a violation that results in a highway closure.', U.wydot, 'WYDOT chain law'],
    ],
  },
  {
    code: 'UT', q: 'Do I need chains in Utah?',
    lede: 'Utah can require traction devices on designated roads during severe winter conditions. Big and Little Cottonwood Canyons have additional requirements, and flashing beacons at the canyon mouths show when they are in effect.',
    levels: [
      ['Cottonwood Canyon traction requirements', 'AWD and 4WD need M+S or 3-peak mountain snowflake tires on all wheels. 2WD needs 3-peak mountain snowflake tires on all wheels, or chains or socks on the two drive wheels.', U.udotCc],
      ['Class 3', 'Class 3 applies stricter traction requirements on designated Cottonwood Canyon roads. Vehicles must meet the posted Class 3 equipment rules. UDOT can turn on traction requirements up to 24 hours before a predicted storm.', U.udotCc],
    ],
    rules: [
      ['Utah has Class 1, Class 2 and Class 3 traction restrictions. Requirements vary by vehicle and road. Class 3 has stricter rules for the Cottonwood Canyons.', U.udotCc],
      ['In the Cottonwood Canyons, tires need at least 5/32-inch tread.', U.udotCc],
    ],
    fines: [
      ['Violating a posted traction restriction can result in an infraction under Utah Code 41-6a-715(6). A specific standard traction-law ticket amount has not been verified. The amount assessed for a particular violation may differ from the statutory maximum.', U.ut715, 'Utah Code 41-6a-715'],
    ],
  },
  {
    code: 'NV', q: 'Do I need chains in Nevada?',
    lede: 'Nevada\'s chain rules are in NRS 484D.515 and 484D.520. NDOT posts them by sign. There are no fixed dates. NV Roads carries current requirements.',
    levels: [],
    rules: [
      ['Posted signs determine which traction equipment is required. Some restrictions allow snow tires or other traction devices. NRS 484D.520 also sets conditions for a four-wheel-drive exemption.', U.nrs515, 'NRS 484D.515'],
      ['When the highway is posted for traction equipment, vehicles or combinations over 10,000 lb gross weight must use tire chains. Lighter vehicles may use chains, snow tires or permitted traction devices, depending on the sign.', U.nrs484d, 'NRS 484D.520'],
    ],
    fines: [
      ['Failure to comply with a posted chain requirement is generally enforced as a civil traffic infraction. Nevada\'s general civil traffic penalty ceiling is $500, plus applicable assessments. This is not a fixed chain-law fine.', U.nrs484a, 'NRS 484A.900 and 484A.7043'],
    ],
  },
  {
    code: 'BC', q: 'Do I need winter tires or chains in British Columbia?',
    lede: 'British Columbia requires approved winter tires on designated highways from October 1 through March 31 or April 30, depending on the route. Commercial chain requirements also apply to covered vehicles.',
    levels: [],
    rules: [
      ['Dates: October 1 to April 30 on most routes. March 31 on select routes not through mountain passes or high-snowfall areas.', U.bcRoutes, 'BC winter tire and chain-up routes'],
      ['Tires: the 3-peak mountain snowflake or M+S symbol, with at least 3.5 mm of tread.', U.bcRoutes, 'BC winter tire and chain-up routes'],
      ['Designated routes include highways in northern and Interior British Columbia, the Sea to Sky Highway, the Malahat and parts of Vancouver Island. Check the provincial map for the exact sections.', U.bcRoutes, 'BC winter tire and chain-up routes'],
      ['Commercial vehicles covered by British Columbia\'s chain requirements must carry chains on designated routes during the required period. Outside Greater Vancouver and Greater Victoria, obey posted chain-up signs.', U.bcEnf, 'BC enforcement'],
    ],
    fines: [
      ['$121 for no winter tires where they are required (Motor Vehicle Act s. 125).', U.bcEnf, 'BC enforcement'],
      ['Commercial: $196 for not carrying chains (MVA Regulations s. 7.1635). $598 for bypassing an active chain-up area (MVA s. 208(4)).', U.bcEnf, 'BC enforcement'],
    ],
    units: 'km',
  },
];

const COMBINED = {
  codes: ['AZ', 'NM', 'AK'], slug: 'arizona-new-mexico-alaska',
  q: 'Do I need chains in Arizona, New Mexico or Alaska?',
  lede: 'These states do not use the California R1, R2 and R3 labels on this page. Check current road restrictions before driving. Follow posted signs and instructions from state transportation agencies. State 511 sites publish road conditions and some restrictions.',
  blocks: [
    ['AZ', 'Check AZ511 for Arizona road conditions and active restrictions. Follow signs and official road restrictions.'],
    ['NM', 'The applicable chain requirements and penalties have not been independently verified. Check NMRoads and posted restrictions.'],
    ['AK', 'Alaska has seasonal rules for studded tires. Check current road conditions and any posted equipment restrictions separately. Check current Alaska DPS notices for studded-tire deadlines and extensions.'],
  ],
};

// ---------- chrome (copied from gen-seasonal-closure-pages.js) ----------
const REF = fs.readFileSync(rel('best-portable-jump-starters/index.html'), 'utf8');
const GA4 = (REF.match(/<!-- ga4 -->[\s\S]*?<!-- \/ga4 -->/) || [''])[0];
if (!GA4) throw new Error('GA4 tag not found in reference page');
const SIGNUP = `<!-- signup:start -->
  <section class="mc-signup" id="subscribe">
    <style>
      .mc-signup{background:#F4F8F6;border-top:1px solid #E4EAE6;border-bottom:1px solid #E4EAE6;padding:44px 0;}
      .mc-signup .mc-signup-inner{max-width:560px;margin:0 auto;text-align:center;padding:0 20px;}
      .mc-signup .mc-eyebrow{font-family:'Inter',-apple-system,sans-serif;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#00A86B;margin:0 0 8px;}
      .mc-signup h2{font-family:'Inter',-apple-system,sans-serif;font-size:24px;font-weight:800;letter-spacing:-.01em;color:#0F1419;margin:0 0 8px;}
      .mc-signup .mc-sub{font-family:'Inter',-apple-system,sans-serif;font-size:15px;line-height:1.55;color:#5A6670;margin:0 auto 18px;max-width:44ch;}
      .mc-signup .mc-sub a{color:#00A86B;font-weight:700;}
      .mc-signup .ml-form-embedContent{display:none !important;}
      .mc-signup .ml-form-embedWrapper{background:transparent !important;box-shadow:none !important;max-width:440px;margin:0 auto;}
      .mc-signup input[type=email]{border-radius:8px !important;}
      .mc-signup button,.mc-signup .primary{background:#00C880 !important;border-radius:8px !important;font-weight:700 !important;}
    </style>
    <div class="mc-signup-inner">
      <p class="mc-eyebrow">The Monthly Highway Report</p>
      <h2>Get your state's monthly road alert report</h2>
      <p class="mc-sub">Your state's reported closures, crashes and roadwork, once a month by email. <a href="/blog/road-report-september-2026.html">See the September report</a>. No spam.</p>
      <div class="ml-embedded" data-form="LjADY8"></div>
    </div>
  </section>
<!-- signup:end -->`;
const ML_LOADER = `<!-- MailerLite Universal -->
  <script>
  (function(w,d,e,u,f,l,n){w[f]=w[f]||function(){(w[f].q=w[f].q||[]).push(arguments);},l=d.createElement(e),l.async=1,l.src=u,n=d.getElementsByTagName(e)[0],n.parentNode.insertBefore(l,n);})(window,document,'script','https://assets.mailerlite.com/js/universal.js','ml');
  ml('account', '2507175');
  </script>
  <!-- End MailerLite Universal -->`;
const NAV_JS = `<script>(function(){var t=document.querySelector(".nav-toggle"),n=document.querySelector(".primary-nav");if(t&&n){t.addEventListener("click",function(){n.classList.toggle("open");});document.addEventListener("click",function(e){if(!e.target.closest(".header-inner"))n.classList.remove("open");})}})();</script>`;
const SEARCH_LINK = `<a href="/search/" class="nav-search"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/></svg><span>Search</span></a>`;

const CSS = `    .sc-wrap{max-width:1160px;margin:0 auto;padding:30px 20px 10px;}
    .sc-eyebrow{font-size:13px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:#0f7a4f;margin:0 0 6px;}
    .sc-wrap h1{font-size:clamp(27px,4.4vw,40px);line-height:1.12;letter-spacing:-0.02em;margin:0 0 10px;}
    .sc-lede{font-size:16.5px;line-height:1.6;color:#3a444d;max-width:78ch;margin:0 0 18px;}
    .sc-lede a,.sc-body a,.sc-live a{color:#0f7a4f;font-weight:700;text-decoration:none;}
    .sc-lede a:hover,.sc-body a:hover,.sc-live a:hover{text-decoration:underline;}
    .sc-live{border:1px solid #E5E5E5;border-radius:14px;background:#fff;overflow:hidden;max-width:860px;}
    .sc-live .lh{padding:12px 16px;border-bottom:1px solid #E5E5E5;font-weight:800;font-size:14px;display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap;}
    .sc-live .lh span{color:#8A939B;font-weight:600;font-size:12px;}
    .sc-status{padding:12px 16px;font-weight:700;font-size:14.5px;line-height:1.45;color:#0E1116;border-bottom:1px solid #F0F0EE;}
    .sc-status.on{color:#1d4ed8;background:#EFF6FF;}
    .sc-status.err{color:#b4231a;}
    .sc-status small{display:block;color:#5b6670;font-weight:600;font-size:12.5px;margin-top:3px;}
    .sc-row{padding:11px 16px;border-bottom:1px solid #F0F0EE;}
    .sc-row .rt{font-weight:800;font-size:14px;}
    .sc-row .sub{color:#3a444d;font-size:13px;margin-top:3px;line-height:1.45;}
    .sc-note{padding:12px 16px;font-size:13px;line-height:1.5;color:#5b6670;}
    .sc-body{max-width:1160px;margin:0 auto;padding:10px 20px 40px;}
    .sc-body h2{font-size:23px;margin:32px 0 10px;letter-spacing:-0.01em;}
    .sc-body p,.sc-body li{font-size:16px;line-height:1.7;color:#2a333b;max-width:78ch;}
    .sc-body p{margin:0 0 14px;}
    .cl-levels{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px;margin:8px 0 6px;}
    .cl-level{border:1px solid #E5E5E5;border-radius:12px;background:#fff;padding:14px 16px;}
    .cl-level h3{font-size:16px;margin:0 0 6px;color:#0E1116;}
    .cl-level p{font-size:14.5px;line-height:1.5;color:#3a444d;margin:0 0 6px;}
    .cl-list{padding-left:20px;margin:0 0 14px;}
    .cl-list li{margin:0 0 10px;}
    .cl-src{display:block;font-size:12.5px;color:#5b6670;font-weight:600;}
    .cl-src a{font-weight:700;}
    .cl-note{border-left:3px solid #E5E5E5;padding:2px 0 2px 14px;color:#5b6670;font-size:14.5px;line-height:1.6;max-width:78ch;margin:8px 0 12px;}
    .sc-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px;margin:8px 0 6px;}
    .sc-card{display:block;border:1px solid #E5E5E5;border-radius:12px;background:#fff;padding:14px 16px;text-decoration:none;color:inherit;}
    .sc-card:hover{border-color:#0E1116;}
    .sc-card .k{font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#0f7a4f;}
    .sc-card h3{font-size:15.5px;margin:4px 0 4px;color:#0E1116;}
    .sc-card p{font-size:13.5px;line-height:1.45;color:#5b6670;margin:0;}
    .faq details{border:1px solid #E5E5E5;border-radius:12px;background:#fff;padding:14px 18px;margin-bottom:10px;}
    .faq summary{font-weight:700;font-size:16px;cursor:pointer;}
    .faq p{margin:10px 0 0;}
    .cta{border:1px solid #E5E5E5;border-radius:16px;background:linear-gradient(135deg,#f4fbf7,#ffffff);padding:24px 22px;margin:30px 0 8px;text-align:center;}
    .cta h3{font-size:21px;margin:0 0 8px;}
    .cta p{font-size:15.5px;color:#3a444d;margin:0 auto 14px;max-width:560px;}
    .cta .btns{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;}
    .cta .btns a{display:inline-block;padding:11px 20px;border-radius:10px;font-weight:700;font-size:14.5px;text-decoration:none;}
    .cta .btns a.primary{background:#0f7a4f;color:#fff;}
    .cta .btns a.ghost{border:1px solid #0F1419;color:#0F1419;}
    .sc-related{color:#5b6670;font-size:14px;margin-top:26px;}
    .sc-related a{color:#0f7a4f;font-weight:700;text-decoration:none;}`;

function head({ title, desc, url, ld }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
${GA4}
  <meta name="apple-itunes-app" content="app-id=6759212851">
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${esc(desc)}">
  <link rel="canonical" href="${url}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:image" content="https://milecheckapp.com/images/og-banner-light.png">
  <meta property="og:url" content="${url}">
  <meta property="og:type" content="website">
  <link rel="icon" type="image/png" href="/images/favicon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/style.css">
${ld.map((o) => `  <script type="application/ld+json">${JSON.stringify(o)}</script>`).join('\n')}
  <style>
${CSS}
  /* spon:css */
${SLOT_CSS}
/* /spon:css */
  </style>
</head>
<body>

  <header class="site-header">
    <div class="container header-inner">
      <a href="/" class="brand" style="display:inline-flex;align-items:center;gap:9px;"><img src="/assets/app-icon-60.png" alt="" style="width:28px;height:28px;border-radius:7px;flex-shrink:0;">MileCheck</a>
      <button class="nav-toggle" aria-label="Menu"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0F1419" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg></button>
      <nav class="primary-nav">
        <a href="/">Home</a>
        <a href="/maps/" class="active">Maps</a>
        <a href="/cameras/">Cameras</a>
        <a href="/states/">United States</a>
        <a href="/canada/">Canada</a>
        <a href="/#story">Story</a>
        <a href="/partners/">B2B</a>
        <a href="/blog/">Blog</a>
        ${SEARCH_LINK}
        <a href="/get/" class="nav-cta">Get the app</a>
      </nav>
    </div>
  </header>
`;
}
function footer(campaign, learn) {
  return `  <footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-col footer-col-brand">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;"><img src="/assets/app-icon-60.png" alt="MileCheck" style="width:36px;height:36px;border-radius:9px;flex-shrink:0;"><p class="footer-brand" style="margin-bottom:0;">MileCheck</p></div>
          <p class="footer-tagline">Mile markers in all 50 US states.</p>
        </div>
        <div class="footer-col">
          <p class="footer-label">Get the app</p>
          <ul class="footer-list">
            <li><a href="https://apps.apple.com/app/apple-store/id6759212851?pt=128447811&ct=${campaign}&mt=8" target="_blank" rel="noopener">iOS App Store</a></li>
            <li><a href="https://play.google.com/store/apps/details?id=app.milecheck.mobile&referrer=utm_source%3Dmilecheckapp.com%26utm_medium%3Dweb%26utm_campaign%3D${campaign}" target="_blank" rel="noopener">Google Play</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <p class="footer-label">Live maps</p>
          <ul class="footer-list">
${learn.map(([h, t]) => `            <li><a href="${h}">${t}</a></li>`).join('\n')}
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
      <p class="footer-fineprint">&copy; 2026 MileCheck LLC. Road data: state DOTs via MileCheck. Always follow posted signs and official detours.</p>
      <p class="footer-fineprint footer-disclosure">MileCheck is a participant in the Amazon Services LLC Associates Program. As an Amazon Associate I earn from qualifying purchases.</p>
    </div>
  </footer>
${NAV_JS}
  ${ML_LOADER}
`;
}
const CTA = (campaign, dot) => `    <div class="cta">
      <h3>See chain rules on your route</h3>
      <p>Your mile marker shows even offline. ${dot} alerts on your route, chain rules included, are part of MileCheck Premium and need a connection to update. Runs on CarPlay and Android Auto.</p>
      <div class="btns">
        <a class="primary" href="https://apps.apple.com/app/apple-store/id6759212851?pt=128447811&ct=${campaign}&mt=8" target="_blank" rel="noopener">iOS App Store</a>
        <a class="ghost" href="https://play.google.com/store/apps/details?id=app.milecheck.mobile&referrer=utm_source%3Dmilecheckapp.com%26utm_medium%3Dweb%26utm_campaign%3D${campaign}" target="_blank" rel="noopener">Google Play</a>
      </div>
    </div>`;

// Live block: same feeds and the same chain test as /chains/.
function liveJs(code, dot) {
  return `<script>
(function(){
var ST=${JSON.stringify(code)},DOT=${JSON.stringify(dot)},WORKER="https://milepost-proxy.leahgerber93.workers.dev";
var status=document.getElementById('clStatus'),rows=document.getElementById('clRows'),when=document.getElementById('clWhen');
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function clean(t){return String(t||'').replace(/<[^>]+>/g,' ').replace(/&[a-z#0-9]+;/g,' ').replace(/\\s+/g,' ').trim().slice(0,200);}
function isChain(r){var t=((r.headline||'')+' '+(r['impact-desc']||'')+' '+(r.description||'')+' '+(r['road-surface-condition']||'')+' '+(r['location-name']||'')).toLowerCase();
  if(/chain[- ]?link/.test(t))return false;
  return /\\bchains?\\b[^.]{0,40}\\b(required|control|controls|law|in effect)\\b|\\bchain control\\b|traction (law|device|tire|tyre)s?\\b|\\br-[123]\\b/.test(t);}
function get(path,key){return fetch(WORKER+path+'?state='+ST,{cache:'no-store'}).then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json();}).then(function(d){if(!Array.isArray(d[key]))throw new Error('payload');return d[key];});}
function load(){
  Promise.all([get('/incidents','incident-reports'),get('/conditions','road-weather-reports').catch(function(){return [];})]).then(function(res){
    var cond=res[1].map(function(r){return Object.assign({},r,{headline:((r['location-name']||'')+': '+(r['road-surface-condition']||'')).trim(),location:r.location||{'route-id':r['route-id']}});});
    var list=res[0].concat(cond).filter(isChain).map(function(r){var loc=r.location||{},sl=loc['start-location']||{};return {route:(loc['route-id']||'').trim(),mp:sl['start-mile-marker']?String(sl['start-mile-marker']).replace(/\\.0+$/,''):'',head:clean(r.headline||r.description||r['impact-desc']||'Chain rule posted')};});
    if(list.length){status.className='sc-status on';status.innerHTML=list.length+(list.length===1?' chain or traction report':' chain or traction reports')+' in the '+esc(DOT)+' feed right now.<small>The DOT posting and the sign on the road are the record.</small>';}
    else{status.className='sc-status';status.innerHTML='No chain or traction report in the '+esc(DOT)+' feed right now.<small>This is what the feed holds. Some rules are posted only on signs or on the DOT site.</small>';}
    rows.innerHTML=list.slice(0,40).map(function(a){return '<div class="sc-row"><div class="rt">'+esc(a.route||'Report')+(a.mp?' · MP '+esc(a.mp):'')+'</div><div class="sub">'+esc(a.head)+'</div></div>';}).join('');
    when.textContent=new Date().toLocaleTimeString([], {hour:'numeric',minute:'2-digit'});
  }).catch(function(){status.className='sc-status err';status.innerHTML='The '+esc(DOT)+' feed could not be reached. That is an outage, not an all-clear.<small>Check the official links on this page.</small>';rows.innerHTML='';});
}
load();setInterval(load,300000);
})();</script>`;
}

const breadcrumb = (items) => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map(([name, item], i) => ({ '@type': 'ListItem', position: i + 1, name, item })) });
const HUB_URL = 'https://milecheckapp.com/chain-laws/';

function statePage(p) {
  const s = STATE[p.code];
  const slug = slugOf(p.code);
  const url = `${HUB_URL}${slug}/`;
  const campaign = `chain-laws-${slug}`;
  const sp = SPON.slot({ kind: 'live', slug: campaign, state: p.code === 'BC' ? '' : p.code, name: p.q });
  const fineLine = p.fines.length ? p.fines.map((f) => f[0]).join(' ') : (p.noFine || 'The applicable fine amount has not been verified.');
  const desc = `${p.lede.split('. ')[0]}. The rules and fines with links to the official source, and the chain reports ${s.dot} is posting right now.`;
  const title = `${esc(p.q)} Chain and traction law | MileCheck`;
  const hasSeasonal = exists(`seasonal/${slug}/index.html`);
  const hasRc = exists(`road-conditions/${slug}/index.html`);

  const levelsHtml = p.levels.length ? `    <h2>The levels</h2>
    <div class="cl-levels">
${p.levels.map(([n, m, u]) => `      <div class="cl-level"><h3>${esc(n)}</h3><p>${esc(m)}</p>${cite(u)}</div>`).join('\n')}
    </div>
` : '';
  const rulesHtml = p.rules.length ? `    <h2>The rules</h2>
    <ul class="cl-list">
${p.rules.map(([t, u, l]) => `      <li>${esc(t)}${cite(u, l)}</li>`).join('\n')}
    </ul>
` : '';
  const finesHtml = `    <h2>The fines</h2>
${p.fines.length ? `    <ul class="cl-list">
${p.fines.map(([t, u, l]) => `      <li>${esc(t)}${cite(u, l)}</li>`).join('\n')}
    </ul>` : `    <p>${esc(p.noFine || 'The applicable fine amount has not been verified.')}</p>`}
${(p.notes || []).map((n) => `    <p class="cl-note">${esc(n)}</p>`).join('\n')}
`;

  const cards = [];
  cards.push(['Official source', s.dot, `${s.name}'s traveler site. Current chain and traction requirements are posted there.`, s.dotUrl, true]);
  if (hasRc) cards.push(['Road conditions', `${s.name} road conditions`, `Closures and alerts reported through ${s.dot}, on one map.`, `/road-conditions/${slug}/`]);
  if (hasSeasonal) cards.push(['Winter closures', `Which roads close for winter in ${s.name}?`, `Seasonal closures with the dates each agency gives.`, `/seasonal/${slug}/`]);
  cards.push(['Live map', 'Chain control map', 'Chain and traction reports from supported state feeds on one map.', '/chains/']);
  const cardsHtml = cards.map(([k, h, d, href, ext]) => `      <a class="sc-card" href="${href}"${ext ? ' target="_blank" rel="noopener"' : ''}><span class="k">${k}</span><h3>${esc(h)}</h3><p>${esc(d)}</p></a>`).join('\n');

  const faq = [
    [p.q, `${p.lede} Check the official sources linked on this page for the published requirements and penalties. The sign on the road is the rule that applies.`],
    [`What is the fine for ignoring a chain rule in ${s.name}?`, fineLine + ((p.notes || []).length && !p.fines.length ? ' ' + p.notes.join(' ') : '')],
    [`Where do I check the current chain requirement in ${s.name}?`, `${s.dot} posts current requirements. The block at the top of this page reads the ${s.dot} feed every five minutes and lists chain and traction reports. If the feed cannot be reached, the page says so.`],
  ];
  const faqHtml = faq.map(([q, a]) => `      <details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('\n');
  const ld = [
    { '@context': 'https://schema.org', '@type': 'WebPage', name: p.q, url, description: desc, isPartOf: { '@type': 'WebSite', name: 'MileCheck', url: 'https://milecheckapp.com/' }, about: { '@type': 'Place', name: s.name } },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
    breadcrumb([['MileCheck', 'https://milecheckapp.com/'], ['Chain laws', HUB_URL], [s.name, url]]),
  ];

  const others = PAGES.filter((o) => o !== p).map((o) => `<a href="/chain-laws/${slugOf(o.code)}/">${esc(STATE[o.code].name)}</a>`).join(' · ');
  const html = head({ title, desc, url, ld }) + `
  <div class="sc-wrap">
    <!-- spon:start -->
${sp.html}
<!-- spon:end -->
    <p class="sc-eyebrow">Chain and traction law · ${esc(s.name)}</p>
    <h1>${esc(p.q)}</h1>
    <p class="sc-lede">${esc(p.lede)} Current chain and traction reports from <a href="${s.dotUrl}" target="_blank" rel="noopener">${esc(s.dot)}</a> appear below, followed by the rules and their official sources.</p>

    <div class="sc-live">
      <div class="lh"><span style="color:#0E1116;font-size:14px;">Chain and traction reports right now</span><span>${esc(s.dot)} via MileCheck · <span id="clWhen">loading</span></span></div>
      <div class="sc-status" id="clStatus">Reading the ${esc(s.dot)} feed&hellip;</div>
      <div id="clRows"></div>
      <div class="sc-note">Reports whose text names a chain control, chain law or traction rule. Reloads every five minutes.</div>
    </div>
  </div>

  <div class="sc-body">
${levelsHtml}${rulesHtml}${finesHtml}
    <p class="sc-related">Official pages read ${READ}. Fines and rules change, and the official page is the record.</p>

    <h2>Where to look next</h2>
    <div class="sc-cards">
${cardsHtml}
    </div>

    <h2>Questions, answered</h2>
    <div class="faq">
${faqHtml}
    </div>

${CTA(campaign, s.dot)}

    <p class="sc-related">Other chain laws: ${others} · <a href="/chain-laws/${COMBINED.slug}/">Arizona, New Mexico and Alaska</a> · <a href="/chain-laws/">All chain laws</a> · <a href="/how-to-put-on-tire-chains/">How to put on tire chains</a></p>
  </div>

  ${SIGNUP}

` + footer(campaign, [['/chains/', 'Chain control map'], ['/chain-laws/', 'Chain laws by state'], ['/closures/', 'US closures map'], ['/maps/', 'All maps']]) + liveJs(p.code, s.dot) + `
<!-- spon:start -->${sp.js}<!-- spon:end -->
</body>
</html>
`;
  fs.mkdirSync(rel(`chain-laws/${slug}`), { recursive: true });
  fs.writeFileSync(rel(`chain-laws/${slug}/index.html`), html);
  return `chain-laws/${slug}/`;
}

function combinedPage() {
  const c = COMBINED;
  const url = `${HUB_URL}${c.slug}/`;
  const campaign = `chain-laws-${c.slug}`;
  const sp = SPON.slot({ kind: 'live', slug: campaign, state: '', name: c.q });
  const desc = 'What was found on chain rules in Arizona, New Mexico and Alaska, with links to each state\'s 511 site and road conditions.';
  const title = `${esc(c.q)} Chain rules | MileCheck`;
  const blocks = c.blocks.map(([code, text, u, l]) => {
    const s = STATE[code], slug = slugOf(code);
    const links = [`<a href="${s.dotUrl}" target="_blank" rel="noopener">${esc(s.dot)}</a>`];
    if (exists(`road-conditions/${slug}/index.html`)) links.push(`<a href="/road-conditions/${slug}/">${esc(s.name)} road conditions</a>`);
    if (exists(`seasonal/${slug}/index.html`)) links.push(`<a href="/seasonal/${slug}/">Which roads close for winter in ${esc(s.name)}?</a>`);
    return `    <h2>${esc(s.name)}</h2>
    <p>${esc(text)}${u ? cite(u, l) : ''}</p>
    <p>${links.join(' · ')}</p>`;
  }).join('\n');
  const ld = [
    { '@context': 'https://schema.org', '@type': 'WebPage', name: c.q, url, description: desc, isPartOf: { '@type': 'WebSite', name: 'MileCheck', url: 'https://milecheckapp.com/' } },
    breadcrumb([['MileCheck', 'https://milecheckapp.com/'], ['Chain laws', HUB_URL], ['Arizona, New Mexico and Alaska', url]]),
  ];
  const html = head({ title, desc, url, ld }) + `
  <div class="sc-wrap">
    <!-- spon:start -->
${sp.html}
<!-- spon:end -->
    <p class="sc-eyebrow">Chain and traction law · Arizona, New Mexico, Alaska</p>
    <h1>${esc(c.q)}</h1>
    <p class="sc-lede">${esc(c.lede)} The <a href="/chains/">chain control map</a> shows any chain report these states post in their feeds.</p>
  </div>
  <div class="sc-body">
${blocks}
    <p class="sc-related">Official pages read ${READ}.</p>
${CTA(campaign, 'DOT')}
    <p class="sc-related">Other chain law pages: ${PAGES.map((o) => `<a href="/chain-laws/${slugOf(o.code)}/">${esc(STATE[o.code].name)}</a>`).join(' · ')} · <a href="/chain-laws/">All chain laws</a></p>
  </div>

  ${SIGNUP}

` + footer(campaign, [['/chains/', 'Chain control map'], ['/chain-laws/', 'Chain laws by state'], ['/closures/', 'US closures map'], ['/maps/', 'All maps']]) + `<!-- spon:start -->${sp.js}<!-- spon:end -->
</body>
</html>
`;
  fs.mkdirSync(rel(`chain-laws/${c.slug}`), { recursive: true });
  fs.writeFileSync(rel(`chain-laws/${c.slug}/index.html`), html);
  return `chain-laws/${c.slug}/`;
}

function hubPage() {
  const q = 'Which states have chain laws?';
  const desc = `Chain and traction rules for ${PAGES.length - 1} western states and British Columbia, with fines where an official source states them.`;
  const title = `${q} Chain and traction laws by state | MileCheck`;
  const sp = SPON.slot({ kind: 'live', slug: 'chain-laws', state: '', name: q });
  const cards = PAGES.map((p) => {
    const s = STATE[p.code];
    const tag = p.levels.length ? `${p.levels.length} levels` : 'posted by sign';
    return `      <a class="sc-card" href="/chain-laws/${slugOf(p.code)}/"><span class="k">${esc(s.name)} · ${tag}</span><h3>${esc(p.q)}</h3><p>${esc(p.lede.split('. ')[0])}.</p></a>`;
  }).join('\n') + `\n      <a class="sc-card" href="/chain-laws/${COMBINED.slug}/"><span class="k">AZ · NM · AK</span><h3>${esc(COMBINED.q)}</h3><p>Arizona, New Mexico and Alaska do not use the California R1, R2 and R3 system.</p></a>`;
  const ld = [
    { '@context': 'https://schema.org', '@type': 'CollectionPage', name: q, url: HUB_URL, description: desc, isPartOf: { '@type': 'WebSite', name: 'MileCheck', url: 'https://milecheckapp.com/' } },
    breadcrumb([['MileCheck', 'https://milecheckapp.com/'], ['Chain laws', HUB_URL]]),
  ];
  const html = head({ title, desc, url: HUB_URL, ld }) + `
  <div class="sc-wrap">
    <!-- spon:start -->
${sp.html}
<!-- spon:end -->
    <p class="sc-eyebrow">Chain and traction laws</p>
    <h1>${q}</h1>
    <p class="sc-lede">Chain requirements, vehicle rules and published fines by state or province. Each page links to its official sources and shows chain reports from the state feed. Use the <a href="/chains/">chain control map</a> to see restrictions reported by state DOT feeds.</p>
    <div class="sc-cards">
${cards}
    </div>
  </div>
  <div class="sc-body">
    <h2>What these pages do and do not say</h2>
    <p>They state the law and link the source. They do not say whether a road needs chains today. The sign on the road and the DOT posting decide that. Fine amounts are included where an applicable official statute or agency source supports them.</p>
    <p class="sc-related">Official pages read ${READ}. Also: <a href="/how-to-put-on-tire-chains/">How to put on tire chains</a> · <a href="/chains-required-explained/">What chains required means</a> · <a href="/seasonal/">Seasonal closures</a></p>
  </div>

  ${SIGNUP}

` + footer('chain-laws', [['/chains/', 'Chain control map'], ['/seasonal/', 'Seasonal closures'], ['/road-conditions/', 'Road conditions by state'], ['/maps/', 'All maps']]) + `<!-- spon:start -->${sp.js}<!-- spon:end -->
</body>
</html>
`;
  fs.mkdirSync(rel('chain-laws'), { recursive: true });
  fs.writeFileSync(rel('chain-laws/index.html'), html);
  return 'chain-laws/';
}

const written = [hubPage(), ...PAGES.map(statePage), combinedPage()];
console.log(`chain-laws: ${written.length} pages`);
written.forEach((p) => console.log('  ' + p));
console.log(SPON.summary());
