// Fall cross-country guides, 2026-10-02. Written by ChatGPT from real Reddit questions caught by HeyCatch
// (marketing/social-media/reddit/heycatch-catches-2026-10-02.md). ChatGPT checked the road claims against
// WYDOT, Caltrans, UDOT, WSDOT and Montana DOT. Claude cut two season dates it could not confirm
// (WSDOT "November 1", Montana "November through April") because those pages render their text in scripts.
// Every source link was checked to return 200 on 2026-10-02. Loaded by gen-guide-pages.js.
const a = (url, text) => `<a href="${url}">${text}</a>`;
const WYDOT = a('https://www.wyoroad.info/', 'WYDOT road conditions');
const CALTRANS = a('https://dot.ca.gov/travel/winter-driving-tips/chain-controls', 'Caltrans chain controls');
const QUICKMAP = a('https://quickmap.dot.ca.gov/', 'Caltrans QuickMap');
const UDOT = a('https://udottraffic.utah.gov/', 'UDOT Traffic');
const WSDOT = a('https://wsdot.wa.gov/travel/real-time/mountain-passes', 'WSDOT mountain pass reports');
const MT511 = a('https://www.511mt.net/', 'Montana 511');
const ASPCA = a('https://www.aspca.org/pet-care/general-pet-care/travel-safety-tips', 'ASPCA travel safety tips');

module.exports = [
  {
    slug: 'driving-i-80-in-november', checked: 'October 2026', eyebrow: 'Road trips',
    title: 'Driving I-80 Cross-Country in November',
    h1: 'Driving I-80 cross-country in November',
    desc: 'Driving I-80 cross-country in November? Plan for Wyoming wind and snow, Donner chain controls, Parleys weather, pets, and daily road checks.',
    lede: `I-80 is a year-round route, but November can bring winter weather to several high sections. The places to watch are southern Wyoming, Parleys Canyon in Utah, and Donner Pass into California. Live cameras and DOT alerts for the whole road are on the ${a('../corridors/i-80/', 'I-80 corridor page')}.`,
    sections: [
      ['The stretches to watch',
        `<p>Between Laramie and Rawlins, Wyoming weather can turn quickly. Snow, blowing snow, strong wind and low visibility can shut parts of I-80. Don't treat a dry forecast in one town as proof the whole stretch is clear. ${WYDOT}</p>
    <p>In Utah, I-80 climbs through Parleys Canyon east of Salt Lake City. UDOT can put traction rules in place during winter storms, which can mean winter tires or traction devices depending on your vehicle. See the ${a('../passes/parleys/', 'Parleys Summit page')}. ${UDOT}</p>
    <p>Farther west, take Donner Pass seriously before you drop into California. Caltrans uses chain controls on I-80 over Donner when conditions call for it, and the rules can change quickly. Some vehicles allowed through without chains still have to carry them. See the ${a('../passes/donner/', 'Donner Pass page')}. ${CALTRANS}</p>`],
      ['Check the road every morning',
        `<p>For a five-day coast-to-coast move, check conditions before you leave the hotel each morning. Don't rely on the general weather forecast alone.</p>
    <p>Open the official 511 or DOT road report for every state you expect to cross that day. Check closures, traction rules, crashes, high-wind warnings and cameras. Check again before a mountain section if weather is moving in. ${QUICKMAP}</p>
    <p>MileCheck puts live state DOT alerts and cameras along I-80 in one place. The state 511 system is still the source for official restrictions.</p>
    <p>If a pass or the Wyoming stretch looks bad, give yourself room to stop early. A five-day plan doesn't leave much room for a long closure. Don't make up lost time by pushing into worse weather.</p>`],
      ['Driving with pets',
        `<p>Pets make long days slower, so build that into the schedule. Stop often enough for water, bathroom breaks and a short walk. Keep dogs leashed at rest areas.</p>
    <p>Bring food, water, bowls, medications, waste bags, a leash, ID tags, vaccination records and a secure crate or car harness. Keep them where you can reach them without unpacking.</p>
    <p>Don't leave pets alone in a parked car. A closed car can get dangerous in heat and in cold. ${ASPCA}. More in ${a('../road-trip-with-a-dog/', 'Road trip with a dog')}.</p>`],
      ['The short version',
        `<p>Check the whole corridor each morning, then check the mountain sections again before you reach them.</p>`],
    ],
    faq: [],
    related: `<a href="../corridors/i-80/">I-80 cameras and conditions</a> · <a href="../passes/donner/">Donner Pass</a> · <a href="../passes/parleys/">Parleys Summit</a> · <a href="../chains-required-explained/">What chains required means</a> · <a href="../road-trip-with-a-dog/">Road trip with a dog</a>`,
  },
  {
    slug: 'driving-i-90-in-october', checked: 'October 2026', eyebrow: 'Road trips',
    title: 'Driving I-90 Cross-Country in October',
    h1: 'Driving I-90 cross-country in October',
    desc: 'Driving I-90 from Seattle to Boston in October? Watch Snoqualmie, Lookout and Bozeman passes, check DOT reports, and stay flexible for snow.',
    lede: `For a Seattle to Boston drive in October, the western part of I-90 needs the most weather attention. Live cameras and DOT alerts for the whole road are on the ${a('../corridors/i-90/', 'I-90 corridor page')}.`,
    sections: [
      ['The western passes matter most',
        `<p>The first big climb is Snoqualmie Pass east of Seattle. October snow is possible, so check the pass before you leave Seattle if the forecast is cold or wet. See the ${a('../passes/snoqualmie/', 'Snoqualmie Pass page')}. ${WSDOT}</p>
    <p>Next is Lookout Pass on the Idaho and Montana line. It's another high section where early snow can affect travel.</p>
    <p>Bozeman Pass is farther east on I-90, between Bozeman and Livingston. It can also see early snow. Check the Montana road report before you leave for the day, and again before the pass if the weather is changing. ${MT511}</p>`],
      ['Check WSDOT and Montana 511',
        `<p>Start with WSDOT for Snoqualmie Pass and the statewide travel map. In Montana, use Montana 511 for Lookout Pass, Bozeman Pass, incidents, cameras and road conditions.</p>
    <p>A normal fall day in one valley doesn't rule out snow at a pass. MileCheck also shows live DOT alerts and cameras along I-90. For any official closure or traction rule, go by the state DOT report.</p>`],
      ['After Montana',
        `<p>The drive generally gets easier after Montana, because the main western passes are behind you.</p>
    <p>Weather still matters. Wind, heavy rain, construction, crashes and early snow can affect the Plains, the Upper Midwest and the Northeast. Keep checking each state's 511 every morning. Past the passes, fatigue and changing weather matter more than grades.</p>
    <p>Leave enough slack that one bad pass day doesn't force a long overnight push.</p>`],
    ],
    faq: [],
    related: `<a href="../corridors/i-90/">I-90 cameras and conditions</a> · <a href="../passes/snoqualmie/">Snoqualmie Pass</a> · <a href="../passes/">All mountain passes</a> · <a href="../road-trip-with-a-dog/">Road trip with a dog</a>`,
  },
  {
    slug: 'road-trip-with-a-dog', checked: 'October 2026', eyebrow: 'Road trips',
    title: 'Road Trip With a Dog: Stops on the Big Interstates',
    h1: 'Road trip with a dog: stops on the big interstates',
    desc: 'Taking a dog on a long interstate road trip? Plan rest stops, water, safe car temperatures, pet gear, and breaks that work for both of you.',
    lede: `A long interstate drive with a dog goes better with a plan for stops, temperature and gear. Here's what works.`,
    sections: [
      ['Use rest areas for short breaks',
        `<p>Interstate rest areas let you get off the highway without driving into town. Many have signed pet areas, but the setup varies by state and location.</p>
    <p>Keep your dog leashed even when the pet area looks empty. Rest areas have traffic, other dogs, wildlife and open ground close to moving cars.</p>
    <p>Use rest areas for quick bathroom and water breaks. If your dog needs real exercise, look for a park near your route instead of counting on a rest area to have much room.</p>`],
      ['Stop often enough for your dog',
        `<p>There's no single schedule that fits every dog. Age, size, health, nerves and normal bathroom habits all matter.</p>
    <p>A practical starting point is a break every two to three hours, then adjust. Puppies, older dogs, nervous travelers and dogs drinking more than usual may need more stops.</p>
    <p>Use each stop for water, a bathroom break and a few minutes of walking. It gives the driver a reset too. Don't push a dog through an unusually long stretch just because the navigation app says you can make the next fuel stop.</p>`],
      ['Watch heat and cold in the car',
        `<p>Don't leave a dog alone in a parked car. Cars heat up quickly in warm weather, even with the windows cracked, and a parked car can get dangerously cold in winter. ${ASPCA}</p>
    <p>If you're traveling alone, plan food and bathroom stops around places where the dog can stay with you.</p>
    <p>While driving, keep the cabin comfortable, make sure your dog has air, and offer water at each break.</p>`],
      ['What to pack',
        `<p>Keep the dog bag easy to reach. Pack food, water, bowls, medications, leash, harness, waste bags, towels and a basic first-aid kit.</p>
    <p>Bring ID tags with a current phone number. If your dog is microchipped, make sure the contact details are current before you go.</p>
    <p>For overnight stays, bring vaccination records and any medications. Check hotel pet rules before you arrive, because weight limits, pet limits and fees vary.</p>`],
      ['Know where you are',
        `<p>On long interstate stretches it helps to know exactly where you are, for a vet call, a breakdown or a lost-pet report. MileCheck shows your nearest highway mile marker and live state DOT road conditions.</p>`],
    ],
    faq: [],
    related: `<a href="../driving-i-80-in-november/">Driving I-80 in November</a> · <a href="../driving-i-90-in-october/">Driving I-90 in October</a> · <a href="../report-location/">How to report your location</a> · <a href="../gear/">Road trip gear</a>`,
  },
];
