// Drafted by Claude 2026-09-25 for the Discover Cars Q3 2026 contest entry
// (docs/emails/chatgpt-brief-discovercars-contest-2026-09-25.md, due Oct 9).
// Editorial draft — Leah/ChatGPT review before this counts as the contest submission.
// Loaded by gen-guide-pages.js.
const sources = {
  nhc: ['National Hurricane Center', 'https://www.nhc.noaa.gov/climo/'],
  sunpass: ['SunPass rental-vehicle guidance', 'https://www.sunpass.com/en/tolls/rentalVehicles.shtml'],
  disneyParking: ['Walt Disney World parking', 'https://disneyworld.disney.com/guest-services/parking/'],
  universalParking: ['Universal Orlando parking', 'https://www.universalorlando.com/web/en/us/plan-your-visit/guest-services/parking'],
  mco: ['Orlando International Airport, Ground Transportation', 'https://www.orlandoairports.net/to-from-mco/rental-cars/'],
};
const link = (url, label) => `<a href="${url}">${label}</a>`;
const internal = (path, label) => link(`https://milecheckapp.com/${path}/`, label);
function checked(html, ...keys) {
  return `<!-- Sources checked 2026-09-25: ${keys.map(k => sources[k][1]).join(' | ')} -->\n${html}<p>${keys.map(k => link(sources[k][1], sources[k][0])).join(' · ')}.</p>`;
}

module.exports = [
  {
    slug: 'rent-a-car-in-orlando', checked: 'September 2026', eyebrow: 'Rental cars',
    title: 'Renting a Car in Orlando: What to Check Before You Book',
    h1: 'Renting a car in Orlando: what to check before you book',
    lede: `Orlando's rental counters are busy for a reason — the theme parks, the distances between them, and a metro built around I-4 all but assume a car. The decisions that actually cost money happen before you drive off the lot: the toll pass, the insurance, and whether your licence is enough on its own.`,
    sections: [
      ['Picking up at MCO', checked(`<p>Orlando International Airport keeps its rental car counters and garages in one ground transportation complex, separate from baggage claim. Signage inside the airport directs you there; the walk or connector time varies by which terminal you land in.</p><p>Check your airline's terminal and MCO's own rental car page before you land, not after — it tells you exactly how to get from your gate to your counter.</p>`, 'mco')],
      ["The toll roads you'll actually hit", checked(`<p>Central Florida's toll roads &mdash; the 408, 417, 429, and stretches of the Turnpike &mdash; are largely cashless. A plate photographed on one of them does not necessarily mean you personally receive the bill; it depends on the toll operator and whether the rental company has registered your plate in its own program.</p><p>SunPass explains how Florida rental tolls typically route through the rental company's billing program rather than a state account tied to you.</p>`, 'sunpass')],
      ['The rental toll pass, decided before you drive', `Every major rental company sells a convenience-fee toll plan, and the fee structure is not the same as the toll itself. ${internal('rental-car-toll-pass', 'The full toll-pass comparison')} breaks down what Avis, Enterprise, and Hertz each charge, and when bringing your own transponder actually works.`],
      ['Insurance: what the counter sells vs. what you already have', `The counter's collision damage waiver is not the same product as liability insurance, and a credit card's rental benefit is not automatically enough on its own. ${internal('rental-car-insurance-credit-card', 'The insurance-vs-credit-card guide')} walks through what each option actually covers before you buy anything at the counter.`],
      ['Fuel policy and returning the car', `Most Orlando counters offer a prepaid full tank or a "return full" option; returning under-full on either one costs more per gallon than a nearby gas station. There are gas stations within a few minutes of the airport rental return &mdash; the counter agent can point you to the closest one at return time. Check your specific agreement's fuel policy line before you drive off the lot; it is not standard across companies.`],
      ['Driving I-4 through Orlando', `I-4 is the spine of the trip &mdash; it runs through the core of Orlando and the attractions corridor, and it is one of the more congested, crash-prone stretches in the state. ${internal('corridors/i-4', "MileCheck's live I-4 map")} shows current cameras and alerts before you leave, and summer afternoon thunderstorms can cut visibility fast on this stretch, so build in extra time rather than cutting it close.`],
      ['Theme park parking is a separate line item', checked(`<p>Walt Disney World and Universal Orlando both publish their own daily parking rates, and both change them without much notice. Check the specific park's site the week you go rather than relying on a number from an old trip report or a blog post.</p>`, 'disneyParking', 'universalParking')],
      ['Hurricane season and what it does to a booking', checked(`<p>The Atlantic hurricane season runs June 1 through November 30, and a trip planned inside that window can be affected by a storm even if it doesn't hit Orlando directly &mdash; flight cancellations and highway evacuation traffic both happen well outside the immediate storm path.</p><p>Ask the rental company directly what its cancellation or date-change policy is for a named storm before you book, since this varies by company and by how far out you're booking.</p>`, 'nhc')],
      ["If you're driving on a foreign licence", `A foreign licence is often enough to drive in Florida as a visitor, but the counter's own requirements and the state's rules are two separate checks. ${internal('drive-in-us-foreign-license', 'Can you drive in the US on a foreign licence?')} and ${internal('international-driving-permit-usa', 'Do you need an International Driving Permit?')} cover both, including when a translation or IDP is expected alongside the original.`],
      ["Know exactly where you are once you're driving", `Once you're on I-4 or the toll roads, the address on your GPS matters less than the route, direction, and mile marker &mdash; especially if something goes wrong and you need to describe your location. The MileCheck app shows that in real time, works offline, and pulls the same live DOT alerts and cameras used to build ${internal('cameras/orlando', "MileCheck's Orlando camera page")}.`],
    ],
    faq: [
      ['Where do I pick up a rental car at Orlando International Airport?', 'MCO keeps rental counters and garages in a ground transportation complex separate from baggage claim. Check MCO’s rental car page and your airline’s terminal before you land.'],
      ['Do Orlando toll roads charge rental cars automatically?', 'Central Florida’s toll roads are largely cashless. Whether a toll bills you directly or routes through your rental company’s program depends on the toll operator and whether your plate is registered in that program — check before you drive, not after.'],
      ['Should I buy the rental company’s toll pass?', 'Depends on your route and how many toll days you’ll actually have. Compare the published daily/period fee structures across companies before deciding — they are not the same product as the tolls themselves.'],
      ['Does my credit card cover Orlando rental insurance?', 'Some card benefits cover damage to the rental car, but that is not the same as liability coverage for injuries or damage to others. Check the exact benefit guide for your card and rental dates.'],
      ['How do I get from Orlando to the theme parks without getting stuck in traffic?', 'I-4 through the attractions corridor is congested most of the day and prone to summer-afternoon storm slowdowns. Check live conditions before you leave and build in extra time.'],
      ['Do I need an International Driving Permit to rent a car in Orlando?', 'It depends on your home country and licence language — some rental counters accept a valid foreign licence alone, others expect an IDP alongside it. Check the specific counter’s requirement before you travel.'],
      ['What happens to my Orlando rental if a hurricane is forecast?', 'Policies vary by rental company. Ask directly about cancellation or date-change terms for a named storm, especially if your trip falls within the June–November Atlantic hurricane season.'],
    ],
    related: `${internal('rental-car-toll-pass', 'Rental toll passes')} · ${internal('rental-car-insurance-credit-card', 'Rental insurance vs. credit card')} · ${internal('international-driving-permit-usa', 'International Driving Permits')} · ${internal('drive-in-us-foreign-license', 'Driving on a foreign licence')} · ${internal('corridors/i-4', 'I-4 live map')} · ${internal('cameras/orlando', 'Orlando cameras')} · ${internal('cameras/miami', 'Miami cameras')} · ${internal('rent-a-car-in-nyc', 'Renting in New York City')}`,
  },
];
