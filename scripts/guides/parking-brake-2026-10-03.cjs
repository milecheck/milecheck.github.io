// Parking brake guide, 2026-10-03. Copy by ChatGPT. Claude checked each claim against the source page:
// AAA (every time, before Park, cables can freeze), California DMV (wheel direction), Toyota RAV4 2025
// (electronic brake auto/manual, flashing light, buzzer when driven with it on) and Toyota Crown Signia 2025
// (do not set in freezing weather, may freeze). Cut ChatGPT's "overheat brake parts" line because the RAV4 page
// it cited does not say it, and the Washington handbook line because no URL was given. Loaded by gen-guide-pages.js.
const a = (url, text) => `<a href="${url}">${text}</a>`;
const AAA = a('https://cluballiance.aaa.com/the-extra-mile/advice/car/do-you-know-when-to-use-your-emergency-brake', 'AAA');
const DMV = a('https://www.dmv.ca.gov/portal/handbook/california-driver-handbook/navigating-the-roads-cont1/', 'California Driver Handbook');
const RAV4 = a('https://www.toyota.com/owners/warranty-owners-manuals/digital/article/rav4/2025/om0r063u/ch04se020405/', 'Toyota RAV4 owner\'s manual');
const SIGNIA = a('https://www.toyota.com/owners/warranty-owners-manuals/digital/article/crown-signia/2025/om30j82u/ch04se060402/', 'Toyota Crown Signia winter driving tips');
const CDL = a('https://dol.wa.gov/driver-licenses-and-permits/commercial-driver-licenses-cdl/cdl-training-and-testing/commercial-driver-guides/commercial-driver-guide-text-only', 'Washington commercial driver guide');

module.exports = [
  {
    slug: 'how-to-use-your-parking-brake', checked: 'October 2026', eyebrow: 'Winter driving',
    title: 'How to Use Your Parking Brake Correctly',
    h1: 'How to use your parking brake correctly',
    desc: 'When to set the parking brake, the right order with an automatic, which way to turn your wheels on a hill, electronic brakes, and freezing weather.',
    lede: `The parking brake isn't only for steep hills. It keeps a parked car from moving and takes load off an automatic transmission. Use it every time you park, and follow your owner's manual where your car has an electronic brake or its own cold-weather instructions.`,
    sections: [
      ['Set it every time you park',
        `<p>Set the parking brake whenever you park, including on flat ground. AAA recommends using it every time instead of relying only on Park. ${AAA}</p>`],
      ['The right order with an automatic',
        `<p>Stop and keep your foot on the brake pedal. Set the parking brake. Then shift into Park. Once the parking brake is holding the car, release the pedal.</p>
    <p>AAA recommends setting the parking brake before shifting into Park. That keeps the car's weight off the transmission's parking pawl, a small metal part that locks the gears in Park.</p>
    <p>When you leave, keep the brake pedal pressed, shift out of Park, then release the parking brake.</p>`],
      ['Turn your wheels on a hill',
        `<p>Facing downhill, turn the front wheels toward the curb or the side of the road. Facing uphill with a curb, turn them away from the curb and let the car roll back a few inches against it. With no curb, uphill or downhill, turn them toward the side of the road so the car would roll away from traffic if the brakes failed. ${DMV}</p>
    <p>Set the parking brake too. Wheel position is a backup, not a replacement.</p>`],
      ['Electronic parking brakes',
        `<p>Electronic brakes vary by car. Some set automatically when you shift into Park and release when you shift out. Most can also be set by hand with a switch.</p>
    <p>If the parking brake light and switch light flash, the brake may not have finished setting or releasing. Toyota's manual says to operate the switch again. If a warning stays on, follow the message on the display and have the system checked. ${RAV4}</p>`],
      ['Freezing weather',
        `<p>Parking brakes can freeze. AAA notes that cable brakes can lock up below freezing. ${AAA}</p>
    <p>Some carmakers go further. Toyota's winter tips for the Crown Signia say to turn automatic mode off and park in P without setting the parking brake, because it may freeze and not release. ${SIGNIA}</p>
    <p>So there's no single winter rule. Check your owner's manual for your make, model and year.</p>`],
      ['Don\'t drive with it on',
        `<p>Release it fully before you drive. Many cars show a warning light or sound a buzzer if you drive with the parking brake set. ${RAV4}</p>
    <p>Big trucks and buses with air brakes use spring parking brakes, a different system. Drivers should follow the air brake section of their state CDL manual. ${CDL}</p>`],
    ],
    faq: [],
    related: `<a href="../steep-grade-signs-explained/">Steep grade signs explained</a> · <a href="../how-to-put-on-tire-chains/">How to put on tire chains</a> · <a href="../winter-car-prep-checklist/">Winter car prep checklist</a> · <a href="../chains/">Chain controls map</a>`,
  },
];
