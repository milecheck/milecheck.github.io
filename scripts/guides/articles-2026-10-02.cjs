// Articles from the Codex batch of 2026-10-02 (outputs/batch-9-10-11-14-2026-10-02.zip,
// articles/10-satellite-messenger-milecheck.md). Copy used as written. Headline: the plainest
// of the three options, which is also the draft's own H1. One label fixed: the draft called the
// 911.gov link "FCC 911 guidance", but 911.gov is the National 911 Program, not the FCC.
// Amazon links carry the trailapps-20 tag and rel="sponsored noopener", like /gear/.
// No FAQ in the draft, so the page has none (gen-guide-pages.js skips the block when faq is empty).
// Loaded by gen-guide-pages.js.
const a = (url, text) => `<a href="${url}">${text}</a>`;
const amz = (q, text) => `<a href="https://www.amazon.com/s?k=${q}&amp;tag=trailapps-20" target="_blank" rel="sponsored noopener">${text}</a>`;

module.exports = [
  {
    slug: 'contact-help-no-cell-signal', checked: 'October 2026', eyebrow: 'Road trips',
    title: 'How to Contact Help When Your Phone Has No Signal',
    h1: 'How to contact help when your phone has no signal',
    desc: 'What a satellite messenger or iPhone satellite SOS can send when your phone has no signal on a remote highway. Plan prices checked October 2, 2026.',
    lede: `An ordinary phone call needs a reachable network. Knowing your road and mile marker does not create a connection. Satellite communication gives you another way to send a message when cellular service is unavailable. ${a('https://support.apple.com/en-us/101573', 'Apple')}`,
    sections: [
      ['Check the route before you check the device',
        `<p>Washington’s North Cascades Highway is one place to plan for limited reception. The National Park Service says cell reception in the park is limited and should not be relied on. That is a warning about the area, not a prediction for every carrier at every mile of SR 20. ${a('https://www.nps.gov/noca/faqs.htm', 'North Cascades FAQ')}</p>
    <p>Check your carrier’s coverage map before leaving. Save the route information you need. The FCC map has separate outdoor stationary and in-vehicle mobile views. They are not a promise that a phone inside your car will connect at the shoulder where you stop. ${a('https://help.bdc.fcc.gov/hc/en-us/articles/10467446103579-How-to-Use-the-FCC-s-National-Broadband-Map', 'FCC map guidance')}</p>`],
      ['A roadside membership still needs a way to contact it',
        `<p>A tow request and an emergency SOS do different jobs. Apple’s Roadside Assistance via satellite supports non-emergency vehicle problems on compatible iPhones where the service is available. Its listed US providers include AAA. A roadside membership alone does not add satellite hardware to your phone. ${a('https://support.apple.com/en-us/105098', 'Apple roadside assistance')}</p>
    <p>For an emergency, try 911. Apple says an iPhone may be able to use another available cellular network even when your usual carrier has no service. If the call cannot connect, a compatible iPhone can offer Emergency SOS via satellite. ${a('https://support.apple.com/en-us/101573', 'Apple Emergency SOS')}</p>`],
      ['Two-way messages and distress beacons differ',
        `<p>Garmin inReach and ZOLEO offer two-way satellite messaging. SPOT’s model matters. SPOT X supports two-way messages, while SPOT Gen4 sends alerts and preset messages without the same two-way conversation. Compare the model, not just the brand name. ${a('https://www.garmin.com/en-US/c/outdoor-recreation/satellite-communicators/', 'Garmin')}, ${a('https://www.zoleo.com/en-us/plans', 'ZOLEO')}, ${a('https://www.findmespot.com/en-ca/support', 'SPOT support')}</p>
    <p>A registered 406 MHz personal locator beacon sends a distress alert through the Cospas-Sarsat system. It is not a substitute for text conversations with a tow company. Check the beacon’s registration and battery replacement requirements before buying. ${a('https://www.sarsat.noaa.gov/emergency-406-beacons/', 'NOAA personal locator beacons')}</p>`],
      ['Your iPhone may already support satellite SOS',
        `<p>Apple supports Emergency SOS via satellite on iPhone 14 and later in the US and Canada, subject to its software and purchase-region requirements. It needs an outdoor view of the sky and horizon. Try Apple’s satellite demo before the trip. ${a('https://support.apple.com/en-us/101573', 'Apple')}</p>
    <p>You may need to follow onscreen directions to maintain the connection. Trees and obstructions can slow or prevent a satellite message. Do not count on sending from inside a vehicle. ${a('https://support.apple.com/en-us/105097', 'Apple satellite connection guidance')}</p>
    <p>Apple’s support page, checked October 2, 2026, lists a two-year included service period after activation. Check the current terms for your phone. A compatible phone is an option without buying a separate messenger. ${a('https://support.apple.com/en-us/101573', 'Apple')}</p>`],
      ['Check the service plan too',
        `<p>The hardware price is not the whole cost of a dedicated messenger. ZOLEO’s US page currently lists Prepare at $19.99 a month and Protect at $34.99 a month. Both have a three-month minimum term. Prepare includes 50 satellite messages a month, with extra messages at $0.50 each. Check activation and pause charges before buying. These figures were checked October 2, 2026. ${a('https://www.zoleo.com/en-us/plans', 'ZOLEO plans')}</p>
    <p>Garmin and SPOT have their own service plans. Confirm that the plan is active before travel. Follow the manufacturer’s test procedure. A device stored in the glovebox with a canceled service plan is not the same as an activated messenger. ${a('https://support.garmin.com/en-US/?faq=nVmBNWZg1v3zNcPXlBnlI8', 'Garmin subscription FAQ')}, ${a('https://www.findmespot.com/en-ca/support', 'SPOT')}</p>`],
      ['Be ready to describe where you stopped',
        `<p>Have the road name and direction of travel ready. Add the nearest mile marker or GPS coordinates. Give the operator the information displayed and explain whether it is your position or a nearby marker. ${a('https://www.911.gov/calling-911/frequently-asked-questions/', '911.gov guidance')}</p>
    <p>MileCheck displays mile markers and a location card. It does not send a satellite SOS or contact emergency services for you. See <a href="/report-location/">how to report your location</a>.</p>`],
      ['Comparing the categories',
        `<p>Some links below are Amazon affiliate links. As an Amazon Associate, this site earns from qualifying purchases.</p>
    <p>${amz('satellite+messenger', 'Satellite messengers')}. ${amz('personal+locator+beacon', 'Personal locator beacons')}.</p>
    <p>Compare what the device can send and what the service plan includes. No model is endorsed here.</p>`],
    ],
    faq: [],
    related: `<a href="../report-location/">How to report your location</a> · <a href="../what-is-my-mile-marker/">What is my mile marker?</a> · <a href="../loneliest-road-in-america/">The Loneliest Road in America</a> · <a href="../night-driving-desert-and-passes/">Night driving in the desert and over passes</a> · <a href="../check-road-conditions-before-a-trip/">Check road conditions before a trip</a> · <a href="../gear/">Gear picks</a>`,
  },
];
