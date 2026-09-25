// Batch 2, drafted by ChatGPT/Codex 2026-09-24 from docs/emails/chatgpt-brief-decision-guides-2-2026-09-24.md;
// sources re-fetched by Claude 2026-09-24 (see the handoff in that folder for what was cut). Loaded by gen-guide-pages.js.
// Editorial drafts, 2026-09-24. Not approved for publication.
// Ten brief headings produce twelve pages. See batch-2-handoff.md for omissions.
// checked() puts the check date and source URLs ABOVE the relevant HTML facts.
// FAQ source comments refer to the same dated source registry. FAQs remain plain text.
const sources = {
  usa: ['USA.gov', 'https://www.usa.gov/non-citizen-driving'],
  aaa: ['AAA IDP guidance', 'https://www.aaa.com/vacation/idpf.html'],
  license: ['Enterprise licence policy', 'https://www.enterprise.com/en/car-rental-faqs/us-renter-requirements/drivers-license-requirements.html'],
  ca: ['California Vehicle Code 12505', 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=VEH&sectionNum=12505.'],
  fl: ['Palm Beach County Tax Collector', 'https://www.pbctax.gov/welcome-guide/'],
  tx: ['Texas DPS reciprocity rules', 'https://www.dps.texas.gov/section/driver-license/driving-privilege-reciprocity'],
  ny: ['New York DMV visitor rules', 'https://dmv.ny.gov/driver-license/drivers-from-other-countries'],
  nyResident: ['New York driver manual', 'https://dmv.ny.gov/book/export/html/1556'],
  caChains: ['Caltrans chain controls', 'https://dot.ca.gov/travel/winter-driving-tips/chain-controls'],
  waChains: ['Washington State Patrol traction rules', 'https://wsp.wa.gov/driver/rules-of-the-road/'],
  orChains: ['Oregon chain law', 'https://www.oregon.gov/odot/mct/pages/chains-and-traction-tires.aspx'],
  orFit: ['ODOT chain-fitting guidance', 'https://www.oregon.gov/odot/Pages/Winter-Chains.aspx'],
  orTires: ['ODOT traction tires', 'https://www.oregon.gov/odot/Pages/Winter-Tires.aspx'],
  co: ['CDOT passenger-vehicle traction law', 'https://www.codot.gov/travel/winter-driving/tractionlaw'],
  avisToll: ['Avis e-Toll terms', 'https://www.avis.com/en/products-and-services/services/avis-e-toll'],
  enterpriseToll: ['Enterprise TollPass regional terms', 'https://www.enterprise.com/en/car-rental-faqs/us-tolls/other-areas-us.html'],
  hertzToll: ['Hertz PlatePass terms', 'https://www.hertz.com/us/en/products-and-services/value-added-services/united-states/plate-pass'],
  sunpass: ['SunPass rental-vehicle guidance', 'https://www.sunpass.com/en/tolls/rentalVehicles.shtml'],
  enterpriseCanada: ['Enterprise Canada policy', 'https://www.enterprise.com/en/car-rental-faqs/us-general/driving-rental-car-to-canada.html'],
  enterpriseMexico: ['Enterprise Mexico policy', 'https://www.enterprise.com/en/car-rental-faqs/us-general/driving-rental-car-to-mexico.html'],
  avisBorder: ['Avis cross-border policy', 'https://www.avis.com/en/help/usa-faqs/driving-to-mexico-canada'],
  nationalBorder: ['National cross-border policy', 'https://www.nationalcar.com/en/support/car-rental-faqs/driving-to-canada-mexico.html'],
  budgetBorder: ['Budget rental policies', 'https://www.budget.com/en/customer-care/faqs/global/rental-policies'],
  hertzBorder: ['Hertz rental terms', 'https://www5.hertz.com/rentacar/emember/join/gold/displayTermsAndConditions.do'],
  cascades: ['Amtrak Cascades', 'https://amtrakcascades.com/'],
  brightline: ['Brightline Orlando station', 'https://www.gobrightline.com/orlando'],
  brightlineFares: ['Brightline tickets', 'https://www.gobrightline.com/train-tickets'],
  turnpike: ['Florida Turnpike toll calculator', 'https://floridasturnpike.com/tolls/toll-calculator/'],
  fatigue: ['NHTSA drowsy-driving guidance', 'https://www.nhtsa.gov/risky-driving/drowsy-driving'],
  deer: ['Washington wildlife agency deer guidance', 'https://wdfw.wa.gov/species-habitats/living/species-facts/deer'],
  ice: ['ODOT ice guidance', 'https://www.oregon.gov/odot/Pages/Winter-Be-Ready-Ice.aspx'],
  kit: ['ADOT trip-preparation guidance', 'https://content.govdelivery.com/accounts/AZDOT/bulletins/364789d'],
  waCrash: ['Washington State Patrol collision reports', 'https://wsp.wa.gov/driver/collision-records/'],
  orCrash: ['Oregon DMV collision reporting', 'https://www.oregon.gov/odot/dmv/pages/driverid/accidentreport.aspx'],
  salvage: ['Oregon wildlife agency salvage rules', 'https://myodfw.com/articles/roadkill-salvage-permits'],
  animalInsurance: ['Triple-I collision and comprehensive coverage', 'https://www.iii.org/article/what-is-covered-by-collision-and-comprehensive-auto-insurance'],
  avoidance: ['Triple-I deer-collision guidance', 'https://www-legacy.iii.org/article/avoid-a-deer-car-collision'],
  insurance: ['Triple-I rental insurance guidance', 'https://www.iii.org/article/rental-car-insurance'],
  chase: ['Chase rental-coverage guidance', 'https://www.chase.com/personal/credit-cards/education/basics/chase-sapphire-rental-car-insurance-guide'],
  chaseGuide: ['Chase Sapphire Preferred benefit guide, effective October 2024', 'https://asset.chase.com/content/services/structured-document/document.en.pdf/card/benefits-center/product-benefits-guide-pdf/BGC11387_v2.pdf'],
};
const link = (url, label) => `<a href="${url}">${label}</a>`;
const internal = (path, label) => link(`https://milecheckapp.com/${path}/`, label);
function checked(html, ...keys) {
  return `<!-- Sources checked 2026-09-24: ${keys.map(k => sources[k][1]).join(' | ')} -->\n${html}<p>${keys.map(k => link(sources[k][1], sources[k][0])).join(' · ')}.</p>`;
}
function related(states, extra = []) {
  const links = states.flatMap(([slug, name]) => [
    link(`https://milecheckapp.com/blog/mile-markers-${slug}.html`, `${name} mile markers`),
    ...(slug === 'new-mexico' ? [] : [internal(`cameras/${slug}`, `${name} cameras`)]),
  ]);
  return `<p>${[...links, ...extra.map(([path, label]) => internal(path, label))].join(' · ')}</p>`;
}
const westernPasses = [['passes/donner','Donner Pass'],['passes/snoqualmie','Snoqualmie Pass'],['passes/siskiyou','Siskiyou Pass'],['passes/vail','Vail Pass']];
const west = [['california','California'],['washington','Washington'],['oregon','Oregon'],['colorado','Colorado']];
const sampleStates = [['california','California'],['florida','Florida'],['texas','Texas'],['new-york','New York']];

module.exports = [
  {
    slug: 'international-driving-permit-usa', checked: 'September 2026', eyebrow: 'Driving abroad',
    title: 'Do you need an International Driving Permit in the US?',
    h1: 'Do you need an International Driving Permit in the US?',
    // Checked 2026-09-24: https://www.usa.gov/non-citizen-driving
    lede: 'There is no single US answer. Check the states you will drive in and your rental company before leaving home. An International Driving Permit does not replace your licence.',
    sections: [
      ['What the permit does', checked('<p>An IDP translates your licence. Carry the valid original with it. It does not restore an expired licence or give you permission to drive a different vehicle class.</p><p>Arrange it through an authorised issuer for the country that issued your licence. AAA issues permits for holders of US licences, not for visitors using foreign licences.</p>', 'aaa')],
      ['The rental counter has its own requirements', checked('<p>Enterprise distinguishes between languages and writing systems. For a non-English licence using Latin letters, it recommends an IDP. For a licence using another script, it requires one, with a professional typewritten translation accepted where an IDP cannot be obtained in the home country.</p><p>The original licence is still required. Check the pickup location for additional identity documents.</p>', 'license')],
      ['Check the state, not a national checklist', checked('<p>USA.gov directs visitors to each state’s licensing agency. New York permits visitors to drive on a valid foreign licence. Texas applies reciprocity conditions and a visitor time limit.</p><p>Do not mistake New York’s translation instructions for taking its road test for a blanket IDP requirement on every visitor.</p>', 'usa', 'ny', 'tx')],
      ['An IDP does not extend a visitor’s driving privilege', checked(`<p>Your licence must remain valid, and moving to a state can trigger a local licensing requirement. Texas describes qualifying foreign driving privileges as lasting up to one year or until residency, whichever comes first.</p><p>Read ${internal('drive-in-us-foreign-license','the visitor and resident licence guide')} before treating a long stay as a holiday.</p>`, 'tx')],
      ['Check the paperwork before you book', '<p>Ask the rental branch to confirm that it accepts your licence, language and vehicle class. Keep the answer with your reservation. Carry the original licence and any required translation, plus the identity documents the branch specifies.</p><p>If your route includes several states, check each one. A counter accepting your documents does not settle every state’s driving rules.</p>'],
    ],
    faq: [
      // Checked 2026-09-24: AAA, USA.gov, Enterprise and state sources in registry above.
      ['Can you drive with just an IDP?', 'No. Carry the valid licence it translates.'],
      ['Does every visitor need one?', 'No single requirement covers every state and rental company. Check both before travelling.'],
      ['Does an English licence guarantee that you can rent?', 'No. The rental company also checks its other driver and document requirements.'],
      ['Can AAA issue one for your foreign licence?', 'AAA’s US permit service is for US licence holders. Use the authorised issuer for your licensing country.'],
      ['Does an IDP extend an expired licence?', 'No. You still need a valid underlying licence.'],
      ['Should you bring a licence photo instead?', 'No. Enterprise requires the original licence, not a photocopy.'],
    ],
    related: related(sampleStates, [['drive-in-us-foreign-license','Driving on a foreign licence'],['cameras/new-york-city','New York City cameras']]),
  },
  {
    slug: 'drive-in-us-foreign-license', checked: 'September 2026', eyebrow: 'Driving abroad',
    title: 'Can you drive in the US on a foreign licence?',
    h1: 'Can you drive in the US on a foreign licence?',
    // Checked 2026-09-24: https://www.usa.gov/non-citizen-driving
    lede: 'Often yes as a visitor, with a valid licence and any required translation. The state sets the conditions. Moving there can start a separate deadline for getting its licence.',
    sections: [
      ['A visit and a move have different rules', checked('<p>Check the licensing agency for every state on your route. These examples concern private driving by adults. They do not cover commercial vehicles or the additional rules for younger drivers.</p><p>Do not use your visa’s expiry date as a state driving deadline.</p>', 'usa')],
      ['When you become a resident', checked('<table><thead><tr><th>State</th><th>New-resident rule</th></tr></thead><tbody><tr><td>California</td><td>The nonresident driving exemption lasts no more than 10 days after establishing residence. Driving for employment requires the California licence first.</td></tr><tr><td>Florida</td><td>Obtain a Florida licence within 30 days of establishing residency.</td></tr><tr><td>Texas</td><td>Apply for a Texas licence within 90 days after establishing residency under the reciprocity guidance.</td></tr><tr><td>New York</td><td>Obtain a New York licence within 30 days of becoming a resident.</td></tr></tbody></table><p>Start before the deadline. These are not promises that an appointment or application lets you keep driving after your existing privilege ends.</p>', 'ca','fl','tx','nyResident')],
      ['Residency is more than a day count', checked('<p>California looks at your permanent home and intent to return there. Its examples include voter registration and resident tuition. A short holiday and moving your home are different situations.</p><p>Ask the state agency if work, study or a split-year stay makes your status unclear.</p>', 'ca')],
      ['Canadian and Mexican licences', checked('<p>A foreign licence’s acceptance for a visit does not mean it can be exchanged without testing after a move. Texas separates reciprocal driving privileges from its new-resident process. Check the issuing country and your circumstances instead of assuming every foreign licence gets identical treatment.</p>', 'tx')],
      ['If you are stopped', `<p>Carry the original licence and any required translation. Keep the rental agreement or vehicle documents and proof of applicable insurance accessible.</p><p>If your licence is expired or your visitor privilege has ended, do not drive while trying to resolve it. An ${internal('international-driving-permit-usa','International Driving Permit')} cannot make an invalid licence valid.</p>`],
    ],
    faq: [
      // Checked 2026-09-24: USA.gov, California 12505, TX DPS, NY DMV and AAA sources above.
      ['Can you drive for your entire US visit?', 'Do not assume so. Check the state’s time limit and keep your licence valid.'],
      ['Is there one US resident deadline?', 'No. The four examples above range from 10 to 90 days and have different conditions.'],
      ['Does booking a licence appointment extend the deadline?', 'Do not assume an extension. Ask the licensing agency before continuing to drive.'],
      ['Is a Canadian licence automatically a US licence?', 'No. Visitor driving and getting a local licence after a move are separate questions.'],
      ['Does an IDP replace the original?', 'No. It translates the licence.'],
      ['Do these rules cover commercial driving?', 'No. Check the commercial-licence rules for your vehicle and work.'],
    ],
    related: related(sampleStates, [['international-driving-permit-usa','International Driving Permits'],['report-location','Reporting your location']]),
  },
  {
    slug: 'chains-or-all-season-tires', checked: 'September 2026', eyebrow: 'Winter driving',
    title: 'Do you need chains or are all-season tires enough?',
    h1: 'Do you need chains or are all-season tires enough?',
    // Checked 2026-09-24: Caltrans, WSP, ODOT and CDOT sources in registry.
    lede: 'Carry compatible chains or an approved alternative when planning a winter pass trip. All-season tires do not give you a blanket exemption. The posted restriction, vehicle and tire markings decide what you must fit.',
    sections: [
      ['California has three chain levels', checked('<p>For passenger cars without trailers, R1 allows a snow-tire exception for qualifying vehicles under 6,000 pounds. R2 exempts AWD or 4WD with snow-tread tires on all four wheels. Both exceptions still require carrying chains. R3 requires chains on every vehicle.</p><p>Follow the posted control and instructions at the checkpoint.</p>', 'caChains')],
      ['Washington and Oregon have conditional exceptions', checked('<p>Washington’s usual AWD exception applies below 10,000 pounds GVWR with all wheels engaged, approved traction tires and chains carried for a drive axle. An all-vehicles chain restriction removes that exception.</p><p>Oregon’s lighter-vehicle traction-tire and four-wheel-drive exceptions have conditions. A conditional closure can require chains even on those vehicles. Check the full rule if towing.</p>', 'waChains','orChains')],
      ['Colorado’s current rule is stricter than older summaries', checked(`<p>CDOT’s fall-2025 update lists AWD or 4WD with qualifying tires and at least 3/16-inch tread, or chains or an approved alternative. Do not assume a two-wheel-drive car with winter tires alone qualifies.</p><p>The Passenger Vehicle Chain Law requires every vehicle to use chains or an approved device. Check conditions on ${internal('corridors/i-70','I-70')} before leaving.</p>`, 'co')],
      ['Read the sidewall', checked('<p>M+S and the three-peak mountain snowflake are different markings. Oregon identifies the mountain-snowflake symbol with severe-snow standards. California’s snow-tread definition can include M+S.</p><p>“All-season” on a sales receipt does not answer the legal question. Read the tire’s markings and check its tread against the state’s rule.</p>', 'orTires','caChains')],
      ['Fit them before the trip', checked(`<p>Use your vehicle manual to choose a compatible device and axle. Practise fitting it in dry weather. Stop in a designated, level chain-up area outside the travel lane.</p><p>If your vehicle cannot take conventional chains, confirm an approved alternative before leaving. Read ${internal('chains-required-explained','what chain restrictions mean')} and check the pass report again before climbing.</p>`, 'orFit')],
    ],
    faq: [
      // Checked 2026-09-24: Caltrans, WSP, ODOT and CDOT sources above.
      ['Does AWD mean you can leave the chains home?', 'No. An exemption from fitting chains can still require carrying them.'],
      ['Do studded tires replace chains?', 'Not under Washington’s chain requirement.'],
      ['Does California R3 exempt winter tires?', 'No. R3 requires chains on every vehicle.'],
      ['Are two-wheel drive and winter tires enough in Colorado?', 'Do not rely on that. CDOT’s current passenger traction options require chains or an approved device for two-wheel-drive vehicles.'],
      ['Can you use any tire sock?', 'Check both state approval and compatibility with your vehicle.'],
      ['Do chains guarantee that the pass stays open?', 'No. Obey closures and current restrictions.'],
    ],
    related: related(west, [...westernPasses,['passes/stevens','Stevens Pass'],['passes/eisenhower','Eisenhower Tunnel approaches'],['chains-required-explained','Chain restrictions']]),
  },
  {
    slug: 'rental-car-toll-pass', checked: 'September 2026', eyebrow: 'Rental cars',
    title: 'Should you get the rental car’s toll pass?',
    h1: 'Should you get the rental car’s toll pass?',
    // Editorial recommendation. Fee basis checked 2026-09-24 at Avis, Enterprise and Hertz URLs above.
    lede: 'Buy the rental toll plan when its convenience is worth the added charge for your route. First check whether your own transponder is accepted. Declining at the counter does not necessarily stop an unpaid toll from entering the rental company’s billing program.',
    sections: [
      ['Find the payment method before driving', checked('<p>Check each toll road’s operator, not just the state. SunPass explains how Florida rental tolls can go through rental-company programs. A plate photographed on a cashless road does not mean you personally receive the bill.</p><p>Do not assume a generic plate-pay account prevents rental fees. Confirm that the road operator accepts rental vehicles and how to register yours.</p>', 'sunpass')],
      ['Compare the fee structure', checked('<table><thead><tr><th>Program</th><th>Published standard charge</th></tr></thead><tbody><tr><td>Avis e-Toll</td><td>$6.95 for each day a toll is incurred, capped at $34.95 for a rental of up to 30 days, plus tolls at the specified nondiscounted rate.</td></tr><tr><td>Enterprise TollPass, linked regional program</td><td>$4.95 per toll-use day, capped at $34.65 per rental period, plus tolls.</td></tr><tr><td>Hertz PlatePass</td><td>Check the applicable rental offer and regional terms. Do not assume one nationwide daily price.</td></tr></tbody></table><p>Flat-rate or inclusive plans are different products. Ask which one appears on your agreement.</p>', 'avisToll','enterpriseToll','hertzToll')],
      ['Two toll days do not mean two tolls', checked('<p>Under the cited Avis standard terms, using toll roads on two separate days adds $13.90 in convenience fees, before tolls. Six toll-use days reach the $34.95 cap. Several tolls on one day do not create several daily convenience fees.</p><p>That calculation uses the published fee. It is not a quote for the road tolls on your trip.</p>', 'avisToll')],
      ['Using your own transponder', checked('<p>SunPass permits use of a personal transponder in a rental vehicle with the account steps it specifies. Follow its instructions for the rental plate and start and end dates.</p><p>Check compatibility with every road on your route. A transponder working at home does not establish coverage elsewhere.</p>', 'sunpass')],
      ['A transponder is already in the car', checked('<p>Ask the branch how to disable or shield its device before using your own. Do not remove rental equipment. Keep the rental agreement and toll receipts until the charges settle.</p><p>Avis describes ways to avoid its standard service, including paying tolls through permitted alternatives. Simply leaving a cashless toll unpaid is not one of them.</p>', 'avisToll','hertzToll')],
    ],
    faq: [
      // Checked 2026-09-24: rental toll-program and SunPass URLs above.
      ['Does saying no at the counter prevent every fee?', 'No. An unpaid toll can still enter the company’s billing program.'],
      ['Is the daily fee the toll itself?', 'Not under the standard Avis and Enterprise programs described here. Tolls are additional.'],
      ['Does every rental company charge on unused days?', 'No. Read whether your plan charges per toll-use day or for the whole rental.'],
      ['Can you bring your own SunPass?', 'Yes, subject to SunPass’s rental-vehicle instructions and road compatibility.'],
      ['Should you remove the rental transponder?', 'No. Ask the branch how to shield or disable it correctly.'],
      ['What if the invoice includes the wrong dates?', 'Compare it with your rental agreement and receipts, then dispute the specific charge with the billing provider.'],
    ],
    related: related(sampleStates, [['cameras/orlando','Orlando cameras'],['cameras/miami','Miami cameras'],['rent-a-car-in-nyc','Renting in New York City']]),
  },
  {
    slug: 'rental-car-canada-mexico', checked: 'September 2026', eyebrow: 'Rental cars',
    title: 'Can you drive a rental car into Canada or Mexico?',
    h1: 'Can you drive a rental car into Canada or Mexico?',
    // Checked 2026-09-24: Enterprise, National, Avis, Budget and Hertz cross-border URLs above.
    lede: 'Canada is often permitted for a US rental, subject to the company’s conditions. Mexico is much more restricted. Get permission and the required insurance documents for the exact rental before crossing.',
    sections: [
      ['Check the company and the pickup branch', checked('<table><thead><tr><th>Company</th><th>Canada from the US</th><th>Mexico from the US</th></tr></thead><tbody><tr><td>Enterprise</td><td>Most vehicles allowed. Specialty classes can be excluded.</td><td>Not allowed.</td></tr><tr><td>National</td><td>Most vehicles allowed, with class restrictions.</td><td>Not allowed.</td></tr><tr><td>Avis</td><td>Arrange in advance and get the required insurance card.</td><td>Restricted corporate-rental exception. See below.</td></tr><tr><td>Budget</td><td>Certain cars for US residents, with advance consent.</td><td>US residents using a Corporate BCD only, with additional restrictions.</td></tr><tr><td>Hertz</td><td>Confirm the specific agreement and documents.</td><td>Its terms prohibit entry unless expressly permitted by the agreement.</td></tr></tbody></table>', 'enterpriseCanada','enterpriseMexico','nationalBorder','avisBorder','budgetBorder','hertzBorder')],
      ['Canada needs advance paperwork', checked('<p>Tell the branch before pickup. Avis identifies a Canadian nonresident insurance card. Budget says this card may be required and can be obtained at the rental location.</p><p>Ask whether written permission is also needed for your rental. Carry your border-entry documents separately. A rental agreement does not establish your right to enter Canada.</p>', 'avisBorder','budgetBorder')],
      ['Mexico is not an ordinary extension of the rental', checked(`<p>Avis limits its exception to US residents using a corporate AWD number at participating locations in California, Arizona, New Mexico and Texas. Advance arrangements and special insurance are required, and the car must return to the US.</p><p>Enterprise and National say no to taking their US rentals into Mexico. Read ${internal('mexico-car-insurance','the Mexican insurance guide')} separately from the rental company’s permission.</p>`, 'avisBorder','enterpriseMexico','nationalBorder')],
      ['Do not cross first and ask later', checked('<p>Get the destination countries written into the agreement where required. Hertz’s terms expressly restrict taking the car into Mexico without permission.</p><p>If the company refuses, change the rental or itinerary. Do not assume buying a separate insurance policy overrides the rental contract.</p>', 'hertzBorder')],
      ['Permission to visit is not permission to leave the car', checked('<p>Avis allows some Canada one-way arrangements at selected locations. Availability must be confirmed when booking. Its Mexico exception requires return to the US.</p><p>Book the actual return location. Do not treat an international one-way return as an ordinary change of branch.</p>', 'avisBorder')],
    ],
    faq: [
      // Checked 2026-09-24: company cross-border URLs above.
      ['Can an Enterprise US rental enter Mexico?', 'Enterprise’s current policy says no.'],
      ['Does National allow it?', 'National’s current US cross-border policy says no.'],
      ['Does buying Mexican insurance create permission?', 'No. The rental company must also permit the trip.'],
      ['Does Avis allow every tourist rental into Mexico?', 'No. Its published exception has corporate-account, residency, location and insurance conditions.'],
      ['Does Canada permission include a one-way return?', 'Not automatically. Book and confirm the international return separately.'],
      ['What should you confirm before pickup?', 'The countries, vehicle class, insurance documents and return branch. Ask for the applicable terms in writing.'],
    ],
    related: related([['washington','Washington'],['new-york','New York'],['california','California'],['arizona','Arizona'],['new-mexico','New Mexico'],['texas','Texas']], [['borders','Border waits'],['mexico-car-insurance','Mexican car insurance']]),
  },
  {
    slug: 'snow-tires-wa-or-co', checked: 'September 2026', eyebrow: 'Winter driving',
    title: 'Do you need snow tires in Washington, Oregon or Colorado?',
    h1: 'Do you need snow tires in Washington, Oregon or Colorado?',
    // Checked 2026-09-24: WSP, ODOT and CDOT passenger-vehicle sources above.
    lede: 'The answer depends on your route, vehicle and the posted restriction. Buying snow tires does not remove every chain requirement. Check the tire markings and carry equipment that fits your car.',
    sections: [
      ['Washington', checked(`<p>Washington recognises approved traction tires with qualifying markings and at least 1/8-inch tread. Its normal AWD chain exception has conditions, including carrying chains. A restriction covering all vehicles removes that exception.</p><p>Before ${internal('passes/snoqualmie','Snoqualmie')} or ${internal('passes/stevens','Stevens Pass')}, read the current pass restriction.</p>`, 'waChains')],
      ['Oregon', checked(`<p>Oregon permits traction tires instead of chains for qualifying lighter vehicles in some conditions. That is not an exemption from every restriction. Read the posted requirement before ${internal('passes/siskiyou','Siskiyou Pass')} or ${internal('passes/cabbage-hill','Cabbage Hill')}.</p><p>Its severe-snow tire symbol is the three-peak mountain with a snowflake. Do not assume M+S alone meets the same definition.</p>`, 'orChains','orTires')],
      ['Colorado', checked(`<p>Under CDOT’s current passenger traction guidance, AWD or 4WD needs qualifying tires with at least 3/16-inch tread. Chains or an approved alternative are the other option. Winter tires alone are not the listed option for two-wheel drive.</p><p>The stricter Passenger Vehicle Chain Law requires devices on all vehicles. Check ${internal('corridors/i-70','I-70')}, including ${internal('passes/vail','Vail Pass')} and the ${internal('passes/eisenhower','Eisenhower Tunnel approaches')}.</p>`, 'co')],
      ['Studded tires have their own calendar', checked('<table><thead><tr><th>State</th><th>Normal permitted studded-tire season</th></tr></thead><tbody><tr><td>Washington</td><td>November 1 through March 31. WSDOT can authorise additional periods.</td></tr><tr><td>Oregon</td><td>November 1 through March 31. Check current ODOT notices before relying on an extension.</td></tr></tbody></table><p>These dates concern metal studs, not every winter tire. They do not determine whether chains are required on your route.</p>', 'waChains','orTires')],
      ['Ask for the actual tires on a rental', `<p>Ask the pickup branch for the tire markings and compatible traction equipment. “SUV” does not answer either question. If the company cannot confirm suitable equipment, change the vehicle or route before pickup.</p><p>Use ${internal('chains-or-all-season-tires','the chains and all-season tire guide')} to compare the restrictions. This page covers passenger travel, not commercial trucks or trailer combinations.</p>`],
    ],
    faq: [
      // Checked 2026-09-24: state traction sources above.
      ['Are snow tires and studded tires the same?', 'No. Studded tires have metal studs. A winter tire need not have them.'],
      ['Do the stud dates tell you when chains are required?', 'No. Read the current road restriction separately.'],
      ['Is M+S the same marking as the mountain snowflake?', 'No. Check the state’s definition rather than treating them as interchangeable.'],
      ['Does a rental SUV settle the question?', 'No. Ask about the drivetrain, tire markings and compatible traction devices.'],
      ['Can Colorado require traction equipment away from I-70?', 'Yes. CDOT can activate traction and chain laws on other state highways.'],
      ['Does this cover a pickup towing a trailer?', 'No. Check the state’s vehicle-weight and towing rules.'],
    ],
    related: related(west.slice(1), westernPasses.slice(1).concat([['passes/stevens','Stevens Pass'],['passes/eisenhower','Eisenhower Tunnel approaches'],['chains-or-all-season-tires','Chains or all-season tires']])),
  },
  {
    slug: 'drive-or-fly-los-angeles-las-vegas', checked: 'September 2026', eyebrow: 'Road trips',
    title: 'Should you drive or fly from Los Angeles to Las Vegas?',
    h1: 'Should you drive or fly from Los Angeles to Las Vegas?',
    // Editorial recommendation, not a statistical cost or travel-time claim.
    lede: 'Start with driving if several of you are travelling together and will use the car in Las Vegas. Compare flying if you are alone and the car would sit in a garage. Price the whole trip before choosing.',
    sections: [
      ['Decide whether you need the car there', '<p>Write down the trips you expect to make after arrival. A car for day trips is different from a car parked throughout a hotel stay. Include the hotel’s parking quote and any destination transport you would buy without it.</p>'],
      ['Check the road before setting a departure time', `<p>For the road option, check ${internal('corridors/i-15','I-15')} and ${internal('passes/cajon','Cajon Pass')}. Use conditions for the actual travel day. Do not build a flight comparison around an unverified four-hour drive.</p><p>Choose the actual starting address and Las Vegas destination. “Los Angeles” covers too much ground for one useful door-to-door estimate.</p>`],
      ['Compare the flight door to door', '<p>Check the day’s fare from the airport you would actually use to Las Vegas. Add getting to the airport, the airline’s check-in allowance, arrival transport and any checked-bag charge.</p><p>For the return, repeat the calculation. A low outward fare is not the total.</p>'],
      ['Divide only the costs you share', '<p>Call the complete driving cost D. Include fuel, parking, and any rental or one-way charge. For your own car, decide whether to include wear as well as immediate spending. Call each person’s complete flight cost F.</p><table><thead><tr><th>Travellers sharing one car</th><th>Driving per person</th><th>Flying per person</th></tr></thead><tbody><tr><td>1</td><td>D</td><td>F</td></tr><tr><td>2</td><td>D ÷ 2</td><td>F</td></tr><tr><td>4</td><td>D ÷ 4</td><td>F</td></tr></tbody></table><p>This is a comparison method, not a fare quote. For different tickets or baggage needs, total the group’s flight costs before dividing.</p>'],
      ['Choose using the return journey too', '<p>If driving leaves you exhausted for the trip home, change the departure or add a night before calling it cheaper. If flying still requires several days of rental and parking, put those costs back into the flight column.</p><p>For a bus, check the exact stops and current timetable. Do not assume it departs from your hotel or follows the same schedule every day.</p>'],
    ],
    faq: [
      ['Is driving always cheaper for four people?', 'No. Divide the full car cost and compare it with four complete flight costs.'],
      ['Should you compare fuel with the airfare?', 'Not by itself. Include parking, transfers and the other costs you would actually pay.'],
      ['What if you already own the car?', 'There is no rental bill, but fuel and parking still count. Decide whether your comparison includes wear.'],
      ['Is a short flight automatically faster?', 'Compare door-to-door totals, including airport time.'],
      ['Should you book around a four-hour drive?', 'Use a current estimate for your addresses and departure time. This guide does not promise that duration.'],
      ['What if you need a rental after flying?', 'Add it, its fuel and its parking to the flight option.'],
    ],
    related: related([['california','California'],['nevada','Nevada']], [['corridors/i-15','I-15'],['passes/cajon','Cajon Pass'],['cameras/los-angeles','Los Angeles cameras'],['cameras/las-vegas','Las Vegas cameras']]),
  },
  {
    slug: 'drive-or-fly-seattle-portland', checked: 'September 2026', eyebrow: 'Road trips',
    title: 'Should you drive, fly or take the Seattle–Portland train?',
    h1: 'Should you drive, fly or take the train from Seattle to Portland?',
    // Recommendation. Rail option checked 2026-09-24: https://amtrakcascades.com/
    lede: 'Compare the train first for a trip between the city centres without a car at either end. Drive if you need the car for the rest of the visit or are sharing its cost. Compare flying door to door, not just by time in the air.',
    sections: [
      ['Start with where you will stay', '<p>Check the distance from your accommodation to the station, airport or parking space you would use. Include those transfers in both directions. A useful train connection for one hotel may be awkward for another.</p>'],
      ['The driving option', `<p>Check ${internal('corridors/i-5','I-5')} for the day you will travel. Include your route through the Seattle and Portland areas rather than assuming one fixed motorway time.</p><p>Get the destination parking price before comparing. For a one-way rental, use the quoted return location and fee.</p>`],
      ['The rail option', checked('<p>Amtrak Cascades serves Seattle and Portland. Use the official booking page for the travel date and check the actual departure, arrival and fare conditions.</p><p>Read the itinerary before paying. Compare station-to-door transfers with the airport transfers you would otherwise need.</p>', 'cascades')],
      ['The flight option', '<p>Check the day’s fare for your airports. Add airport access, check-in time, baggage and travel from the arrival airport. If the flight is part of a longer booked connection, compare that itinerary separately from a city-to-city trip.</p>'],
      ['Cost for one, two or four people', '<p>Let D be the total car cost. Let T be the train ticket plus that person’s share of station transfers, and F the equivalent complete flight cost. Use current quotes for the same dates.</p><table><thead><tr><th>Travellers</th><th>Car per person</th><th>Train per person</th><th>Flight per person</th></tr></thead><tbody><tr><td>1</td><td>D</td><td>T</td><td>F</td></tr><tr><td>2</td><td>D ÷ 2</td><td>T</td><td>F</td></tr><tr><td>4</td><td>D ÷ 4</td><td>T</td><td>F</td></tr></tbody></table><p>Recalculate T and F for each group size if transfers are shared or fares differ. No fare estimate here is being presented as a bookable ticket.</p>'],
    ],
    faq: [
      // Rail service checked 2026-09-24 at Amtrak Cascades URL above. Other answers are comparison advice.
      ['Is there a train between Seattle and Portland?', 'Yes. Check Amtrak Cascades for the date’s service and fare.'],
      ['Should you drive for a city-centre weekend?', 'Compare the train and station transfers with driving and parking before deciding.'],
      ['Does travelling as a group favour the car?', 'It lets you share the car’s cost. Compare the actual total rather than assuming it wins.'],
      ['Should you count airport time?', 'Yes, on both ends and for the return.'],
      ['Can you use one fixed driving time?', 'Use a current route estimate for your addresses and departure.'],
      ['What if you need a car outside Portland?', 'Include a destination rental in the train and flight comparisons.'],
    ],
    related: related([['washington','Washington'],['oregon','Oregon']], [['corridors/i-5','I-5'],['cameras/seattle','Seattle cameras'],['cameras/portland','Portland cameras']]),
  },
  {
    slug: 'drive-or-fly-orlando-miami', checked: 'September 2026', eyebrow: 'Road trips',
    title: 'Should you drive, fly or take the Orlando–Miami train?',
    h1: 'Should you drive, fly or take the train from Orlando to Miami?',
    // Recommendation. Train and toll tools checked 2026-09-24 at Brightline and Turnpike URLs above.
    lede: 'Compare driving if you are sharing a car or need it after arrival. Compare Brightline if you want to avoid driving and parking. Flying needs a door-to-door comparison before you call it quicker.',
    sections: [
      ['Use the actual Orlando starting point', checked('<p>Brightline’s Orlando station is at Orlando International Airport. Include getting there from your hotel or home. Its location matters when comparing a train with simply leaving in your car.</p><p>Do the same for your final Miami address.</p>', 'brightline')],
      ['Price the route you will drive', checked(`<p>Use the Florida Turnpike calculator with your actual entry, exit, vehicle and payment method. Add any rental toll-program charge separately.</p><p>Check ${internal('cameras/florida','Florida cameras')} and your route before leaving. Do not use a rail mileage figure as the driving distance between your addresses.</p>`, 'turnpike')],
      ['Compare Brightline with the full drive', checked('<p>Brightline advertises an Orlando–Miami journey of about 3½ hours. That is station-to-station, not hotel-to-hotel. Use the booked service’s arrival time for your own comparison.</p><p>Check the day’s fare, baggage allowance and change terms. A launch fare or an old promotion is not a current ticket quote.</p>', 'brightline','brightlineFares')],
      ['Put the flight on the same basis', '<p>Check the day’s airfare, then add airport transfers, check-in allowance and baggage charges. Include a destination rental only in the options that need one.</p><p>If you are comparing a larger air itinerary, use its total cost rather than pricing a separate flight you would not buy.</p>'],
      ['Compare one, two and four travellers', '<p>Let D be the full car cost, including road tolls and parking. Let T and F be each person’s complete train and flight costs, including their share of transfers.</p><table><thead><tr><th>Travellers</th><th>Car per person</th><th>Train per person</th><th>Flight per person</th></tr></thead><tbody><tr><td>1</td><td>D</td><td>T</td><td>F</td></tr><tr><td>2</td><td>D ÷ 2</td><td>T</td><td>F</td></tr><tr><td>4</td><td>D ÷ 4</td><td>T</td><td>F</td></tr></tbody></table><p>Use quotes for your group and dates. If transfers or fares change with group size, recalculate them. The table gives arithmetic, not current prices.</p>'],
    ],
    faq: [
      // Checked 2026-09-24: Brightline Orlando, Brightline tickets and Turnpike calculator above.
      ['Where is the Orlando Brightline station?', 'At Orlando International Airport. Include the journey to the station.'],
      ['Does the train’s advertised time include hotel transfers?', 'No. Add your travel to and from the stations.'],
      ['Is the Turnpike toll included in a rental toll fee?', 'Check the program. An administration fee and the road toll may be separate.'],
      ['Is driving cheaper for a family?', 'Compare the full shared car cost with the group’s current train or flight quote.'],
      ['Should you budget using an old Brightline promotion?', 'No. Use the fare available for your date and party.'],
      ['What if you need a car in Miami?', 'Add that rental and its associated costs to the train and flight options.'],
    ],
    related: related([['florida','Florida']], [['cameras/orlando','Orlando cameras'],['cameras/miami','Miami cameras'],['corridors/i-95','I-95'],['rental-car-toll-pass','Rental toll passes']]),
  },
  {
    slug: 'night-driving-desert-and-passes', checked: 'September 2026', eyebrow: 'Road trips',
    title: 'Should you drive a desert road or mountain pass at night?',
    h1: 'Should you drive a desert road or mountain pass at night?',
    // Editorial decision rule informed by NHTSA and ODOT sources below. No safety guarantee.
    lede: 'Postpone if you are tired, the route is closed or you lack the required traction equipment. Darkness also reduces what you can see ahead. An open road is not a guarantee that your planned drive is a good choice.',
    sections: [
      ['Watch for wildlife before and after sunset', checked('<p>Washington’s wildlife agency says deer are most active around dawn and dusk, although they can be active at other times. Do not treat the hours between those periods as animal-free.</p><p>Reduce speed where visibility is limited. If you see a deer, allow for another nearby.</p>', 'deer','avoidance')],
      ['Ice may look like wet pavement', checked(`<p>ODOT warns about black ice, particularly on bridges and overpasses. A clear sky or a dark-looking road surface does not rule it out.</p><p>Read ${internal('what-is-black-ice','the black-ice guide')} and check the actual pass report. For ${internal('passes/snoqualmie','Snoqualmie Pass')}, use the current restriction rather than a camera image alone.</p>`, 'ice')],
      ['Do not plan through fatigue', checked('<p>NHTSA identifies midnight to 6 a.m. and late afternoon as peak sleepiness periods. Adequate sleep is the main protection against drowsy driving.</p><p>If you become sleepy, stop driving and find a safe place to rest. A later arrival is preferable to trying to finish a drive you cannot stay awake for.</p>', 'fatigue')],
      ['Leave a route and a check-in plan', `<p>Tell someone your route, destination and when you expect to check in. Save the route before leaving. Do not make the plan depend on continuous phone service.</p><p>When stopped safely, note the road number, direction and nearest mile marker. ${internal('report-location','Use these details when reporting your location')}. Give observed information rather than a guessed marker.</p>`],
      ['Take supplies before the remote section', checked('<p>ADOT recommends carrying drinking water and food and keeping fuel well above empty. Plan a refuelling stop before a remote stretch instead of relying on the next business being open.</p><p>For a winter pass, also check the weather and required equipment. Delay if you cannot meet the restriction.</p>', 'kit')],
    ],
    faq: [
      // Checked 2026-09-24: NHTSA, ODOT, WDFW and ADOT sources above.
      ['Does less traffic make a night drive safe?', 'Traffic volume alone does not settle visibility, fatigue or road conditions.'],
      ['Are deer active only at dusk?', 'No. They can be active at other times too.'],
      ['Can black ice look like a wet road?', 'Yes. Do not use appearance alone to rule it out.'],
      ['What if you are sleepy before leaving?', 'Rest or change the departure. Do not begin by planning to push through.'],
      ['What location information should you save?', 'The route number, travel direction and a known mile marker or nearby exit.'],
      ['Does a camera prove the whole pass is clear?', 'No. Check current restrictions and road reports as well.'],
    ],
    related: related([['arizona','Arizona'],['california','California'],['washington','Washington'],['oregon','Oregon'],['colorado','Colorado']], [['passes/snoqualmie','Snoqualmie Pass'],['passes/donner','Donner Pass'],['passes/vail','Vail Pass'],['report-location','Report your location'],['closures','Road closures']]),
  },
  {
    slug: 'hit-a-deer-what-to-do', checked: 'September 2026', eyebrow: 'Road trips',
    title: 'What should you do if you hit a deer?',
    h1: 'What should you do if you hit a deer?',
    // Checked 2026-09-24: Oregon DMV, ODFW and Triple-I sources above.
    lede: 'Stop and move out of traffic if you can do so safely. Turn on your hazards and stay away from the animal. Call 911 for injuries or an immediate road hazard, then deal with the report and insurance claim.',
    sections: [
      ['The first few minutes', checked(`<p>Do not approach an injured deer or try to finish it off. Tell the dispatcher if the animal is alive or blocking traffic. Follow instructions about where to wait.</p><p>When safe, photograph the vehicle damage and surroundings without entering traffic. Note the location using ${internal('what-is-my-mile-marker','the road and mile marker')}. Call your insurer before arranging non-emergency repairs.</p>`, 'avoidance','salvage')],
      ['Washington’s reporting threshold', checked(`<p>Washington State Patrol says a collision report is required for injury or at least $1,000 damage to any one unit. If an officer says they will file the police collision report, you do not need the separate civilian report.</p><p>Confirm who is filing before leaving the matter there. Record the location with the ${link('https://milecheckapp.com/blog/mile-markers-washington.html','Washington mile-marker guide')}.</p>`, 'waCrash')],
      ['Oregon’s report is separate from the police report', checked(`<p>Oregon requires a DMV report within 72 hours for injury or death, damage over $2,500 to your vehicle, damage over $2,500 to any vehicle with any vehicle towed, or over $2,500 damage to other property. A police report does not replace it.</p><p>Oregon also requires immediate police notification for reportable collisions. Use the non-emergency number unless there is an emergency. The ${link('https://milecheckapp.com/blog/mile-markers-oregon.html','Oregon mile-marker guide')} helps describe the location.</p>`, 'orCrash')],
      ['Which insurance covers the damage?', checked('<p>Direct contact with a deer generally falls under comprehensive coverage, if you bought it, subject to the deductible and policy terms. Swerving into a tree or another vehicle is generally a collision claim.</p><p>Describe what happened accurately. Liability-only insurance does not provide those coverages for your own car.</p>', 'animalInsurance')],
      ['Do not assume you can keep the deer', checked('<p>Oregon allows qualifying deer and elk salvage with a permit obtained within 24 hours of possession. The head and antlers must go to ODFW within five business days. White-tailed deer have geographic restrictions, and the whole carcass must be removed.</p><p>This is not permission to collect any animal. Check the complete rules and contact the wildlife agency before handling an injured animal. Other states have different rules.</p>', 'salvage')],
      ['If you see a deer before a collision', checked('<p>Brake while keeping control of your lane. Do not swerve into opposing traffic or leave the road to miss the animal. Watch for more than one deer.</p>', 'avoidance')],
    ],
    faq: [
      // Checked 2026-09-24: sources cited in each section above.
      ['Should you call 911 for every deer collision?', 'Use 911 for injuries or an immediate danger, including an animal blocking traffic. Otherwise contact the appropriate non-emergency police line and follow reporting rules.'],
      ['Should you approach an injured deer?', 'No. Keep your distance and tell the dispatcher.'],
      ['Does a police report replace Oregon’s DMV report?', 'No. File the required DMV report too.'],
      ['Does liability-only insurance cover your damaged car?', 'It does not provide comprehensive or collision coverage for your car.'],
      ['Does hitting a deer use comprehensive coverage?', 'Direct animal contact generally does, subject to your policy and deductible.'],
      ['Can you take the deer home?', 'Only if the applicable wildlife rules allow it and you meet their conditions. Do not assume a collision gives you ownership.'],
    ],
    related: related([['washington','Washington'],['oregon','Oregon']], [['what-is-my-mile-marker','Find your mile marker'],['report-location','Report your location'],['night-driving-desert-and-passes','Driving at night']]),
  },
  {
    slug: 'rental-car-insurance-credit-card', checked: 'September 2026', eyebrow: 'Rental cars',
    title: 'Should you buy rental insurance or use your credit card?',
    h1: 'Should you buy rental insurance or use your credit card?',
    // Checked 2026-09-24: Triple-I rental insurance and Chase guidance above.
    lede: 'Check your own auto policy and the exact card benefit before declining cover. A card benefit for damage to the rental is not proof that you have liability cover for injuries or damage to others. Check the country as well as the car.',
    sections: [
      ['What the counter is selling', checked('<p>CDW or LDW waives some responsibility for loss of or damage to the rental, subject to its terms. It is a waiver, not the same thing as liability insurance.</p><p>Supplemental liability cover concerns claims by others. Personal accident insurance concerns specified injuries. Personal effects coverage concerns belongings. Ask which product is being offered instead of treating “insurance” as one purchase.</p>', 'insurance')],
      ['Ask your auto insurer what carries over', checked('<p>A personal policy may extend to a leisure rental, with its limits and deductible. Confirm damage coverage and liability separately. Ask about loss-of-use charges, administrative fees and towing.</p><p>If you dropped comprehensive or collision on your own car, do not assume the policy supplies it for a rental.</p>', 'insurance')],
      ['Primary and secondary describe the order of payment', checked('<p>Primary rental-damage coverage can respond before your personal auto policy for an eligible loss. Secondary coverage generally responds after other applicable insurance.</p><p>One published Sapphire Preferred guide makes US coverage excess for New York residents who have personal auto insurance. Its effective date is October 2024. Get the guide applicable to your account and rental date rather than relying on a product summary.</p>', 'chaseGuide')],
      ['Follow the card’s activation requirements', checked('<p>Chase’s Sapphire guidance requires the full rental charge on the eligible card or qualifying rewards, the cardholder as primary driver, and declining the rental company’s collision damage waiver. Do not apply that instruction to unrelated products such as liability cover.</p><p>Chase also lists excluded vehicle types and rental arrangements. Check the actual benefit guide before renting a moving truck, unusual vehicle or long-duration rental.</p>', 'chase')],
      ['Check the country separately', `<p>Ask both providers whether your exact trip is covered. Then ask the rental company what local cover is compulsory and included in its quote.</p><p>For Mexico, read ${internal('mexico-car-insurance','the Mexican liability-insurance guide')}. A rental-damage benefit does not answer that liability question. For a border crossing, also check ${internal('rental-car-canada-mexico','the rental company’s permission')}.</p>`],
      ['Make the decision before the queue', '<p>Write down who covers damage to the rental, who covers liability, and what remains at your expense. Confirm the deductible, exclusions and claim procedure.</p><p>If a gap remains, price the product that fills it. If the cover duplicates an existing benefit, compare the terms before buying it. Keep the signed agreement and receipt.</p>'],
    ],
    faq: [
      // Checked 2026-09-24: Triple-I and Chase URLs above. No card-specific dollar limit is asserted.
      ['Does your card cover everything?', 'Do not assume that. Check damage, liability and exclusions separately.'],
      ['Is LDW the same as liability insurance?', 'No. They address different responsibilities.'],
      ['Does primary mean there are no exclusions?', 'No. It describes payment order for an eligible claim.'],
      ['Should you decline every counter product for a card benefit?', 'No. Follow the exact collision-waiver requirement and assess the other products separately.'],
      ['Can you use someone else’s card and assume coverage?', 'No. Check the cardholder, payment and rental-agreement requirements.'],
      ['What if the benefit guide does not answer your situation?', 'Ask the benefit administrator before pickup and get the answer in writing.'],
    ],
    related: related([['florida','Florida'],['california','California'],['texas','Texas']], [['mexico-car-insurance','Mexican car insurance'],['rental-car-canada-mexico','Rental cars across borders'],['rental-car-toll-pass','Rental toll passes']]),
  },
];
