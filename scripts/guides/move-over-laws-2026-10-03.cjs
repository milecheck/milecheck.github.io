// Move Over laws guide, 2026-10-03. Copy by ChatGPT from Claude's fact brief
// (MILECHECKAPP/docs/emails/chatgpt-brief-safety-articles-2026-10-03.md). Claude checked
// every number against the brief's source tables. Changes from ChatGPT's draft: its four
// [NEED] notes are gone. Colorado cites the State Patrol page as its source (the brief has
// no checked statute number). Texas says the row reflects the 2023 amendment and to check the
// current statute (a 2025 change is unverified). The Virginia work-zone note and the link to
// the struck-by article (not written yet) were dropped. The coverage table was reworded by Claude
// after Leah found it confusing (10-03): the 19-to-28 change leads, rows are plain labels, any-car row first.
// Leah, 10-03: "add DOT vehicles and plows with lights and explain how dangerous it really is". Claude added
// the roadside-deaths section (AAA 2,100+ for 2019-2023, ERSI 36 for 2025), the DOT/plows section and its FAQ,
// all from the brief's verified tables; "more than one a day" is 2,100 / 5 years / 365.
// Loaded by gen-guide-pages.js.
const a = (url, text) => `<a href="${url}">${text}</a>`;
const AAA = 'https://aaafoundation.org/slow-down-move-over-laws-investigating-factors-influencing-drivers-behavior-and-compliance/';
const TABLE_CSS = `<style>.mo-wrap{overflow-x:auto;margin:6px 0 18px;-webkit-overflow-scrolling:touch}.mo-t{border-collapse:collapse;width:100%;font-size:14.5px;line-height:1.45}.mo-t th,.mo-t td{border:1px solid #E5E5E5;padding:9px 10px;text-align:left;vertical-align:top}.mo-t th{background:#F7F5EE;font-weight:700}.mo-t td.n{text-align:right;white-space:nowrap}.mo-st{min-width:720px}@media(max-width:640px){.mo-st{min-width:0}.mo-st thead{display:none}.mo-st,.mo-st tbody,.mo-st tr,.mo-st td{display:block;width:auto}.mo-st tr{border:1px solid #E5E5E5;border-radius:12px;margin:0 0 12px;background:#fff;overflow:hidden}.mo-st td{border:0;border-top:1px solid #F0F0EE;padding:8px 12px}.mo-st td:first-child{border-top:0;background:#F7F5EE}.mo-st td[data-label]::before{content:attr(data-label);display:block;font-size:12px;font-weight:600;color:#5b6670;margin-bottom:2px}}</style>`;

module.exports = [
  {
    slug: 'move-over-laws', dated: ['2026-10-03', 'October 3, 2026'], eyebrow: 'Road safety',
    title: 'Do You Have to Move Over for a Car With Hazard Lights On?',
    h1: 'Do you have to move over for a car with hazard lights on?',
    desc: 'Do you have to move over for a stopped car? Compare state coverage, speed rules and dated penalties, including tow trucks and road crews.',
    lede: `Move over a lane when you can do so safely, and slow down if you cannot. All 50 states have a Move Over law as of 2026, but the vehicles covered and your duties vary by state.</p>
    <p class="lede">A police car with flashing lights and a disabled car with hazards on may fall under different parts of the law. A tow truck may carry a different penalty from an emergency vehicle.</p>
    <p class="lede">This is not legal advice. The summaries below have dates because coverage and penalties change.`,
    sections: [
      ['How often people are killed at the roadside',
        `<p>From 2019 through 2023, more than 2,100 people were struck and killed while stranded or working at the roadside, according to the ${a('https://aaafoundation.org/wp-content/uploads/2026/03/202603-AAAFTS-SDMO-Survey.pdf', 'AAA Foundation’s analysis of NHTSA crash data')}. That is more than 400 deaths a year, more than one a day. Nearly 1,900 of them were stranded drivers and people who stopped to help.</p>
    <p>In 2025, 36 roadside responders were struck and killed: 16 police officers, 11 tow operators, 3 firefighters and EMS workers, 3 road service technicians, and 3 DOT and safety service patrol workers. In 2024 it was 46. Those counts come from the ${a('https://www.respondersafety.com/news/articles/struck-by-incidents/yearly-fatality-reports/', 'Emergency Responder Safety Institute')}, as of December 31, 2025.</p>`],
      ['Which stopped vehicles does the law cover?',
        `<p>More states now cover every stopped car. In late 2023, 19 states required you to move over for any stopped or disabled vehicle, including an ordinary car with its hazards on. By August 2025 it was 28, according to the ${a(AAA, 'AAA Foundation for Traffic Safety')}.</p>
    <p>The rest of the states protect a shorter list of vehicles. AAA sorts them like this.</p>
    ${TABLE_CSS}<div class="mo-wrap"><table class="mo-t"><thead><tr><th>Who your state’s law protects</th><th>States, late 2023</th><th>States, August 2025</th></tr></thead><tbody>
    <tr><td>Any stopped or disabled vehicle, including a regular car with hazards on</td><td class="n">19</td><td class="n">28</td></tr>
    <tr><td>Police, fire, EMS and roadside help, plus other vehicles named in the law</td><td class="n">24</td><td class="n">17</td></tr>
    <tr><td>Only police, fire, EMS and roadside help</td><td class="n">7</td><td class="n">5</td></tr>
    </tbody></table></div>
    <p>You cannot assume that a law covering police cars also covers an ordinary car with a flat tire. In a state that protects disabled vehicles, the law may specify hazard lights or other visible signs that the vehicle is stopped.</p>
    <p>AAA’s August 2025 scan checked vehicle coverage. It did not recheck driver duties or penalties. Those newer coverage counts do not make the report’s older fine figures current.</p>`],
      ['Do you move over, slow down, or both?',
        `<p>In AAA’s 2023 review, 13 states required you to slow down even when you changed lanes. Another 36 states in the 2023 review required a lane change when possible, with slowing required when you could not move over.</p>
    <p>New York and the District of Columbia had no explicit speed reduction in that 2023 review. Their wording required moving over when possible and otherwise exercising due care.</p>
    <p>The ${a('https://www.nhtsa.gov/move-over-its-law', 'NHTSA guidance')} tells you to enter a lane that is not immediately beside the stopped vehicle. If you cannot change lanes safely, slow to a reasonable speed.</p>
    <p>Your state may specify an exact reduction. Do not apply another state’s speed rule wherever you drive.</p>`],
      ['What can a violation cost?',
        `<p>AAA’s 2023 review found base first-offense fines ranging from $30 in Florida to $2,500 in Virginia. That is a dated comparison. It is not a quote for what you would pay today.</p>
    <p>Virginia’s $2,500 figure in the 2023 review concerned violations involving law enforcement, fire or EMS vehicles. AAA’s 2023 review listed a fine of no more than $250 for tow trucks and other protected vehicles.</p>
    <p>The vehicle type matters. So does the conduct involved. Courts add costs, and a violation involving injury can carry a different penalty.</p>
    <p>These examples show how the rules differ.</p>
    <div class="mo-wrap"><table class="mo-t mo-st"><thead><tr><th>State and source</th><th>Vehicles covered</th><th>What you must do</th><th>Penalty and date</th></tr></thead><tbody>
    <tr><td><strong>Florida</strong>. ${a('http://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&amp;URL=0300-0399/0316/Sections/0316.126.html', 'Section 316.126')}, checked October 3, 2026</td><td data-label="Vehicles covered">Emergency vehicles and specified service vehicles, including wreckers and road crews. Disabled vehicles qualify when warning or hazard lights, flares, signage, or people are visibly present.</td><td data-label="What you must do">Under the text checked in 2026, leave the nearest lane when safe on roads with at least two lanes in your direction. Otherwise, including on a two-lane road, drive 20 mph below a posted limit of 25 mph or more. Drive 5 mph where the limit is 20 mph or less.</td><td data-label="Penalty and date">Noncriminal moving violation under the text checked in 2026. AAA’s $30 base fine comes from its 2023 review.</td></tr>
    <tr><td><strong>Colorado</strong>. ${a('https://csp.colorado.gov/index.php/slow-down-move-over', 'Colorado State Patrol')}, read October 3, 2026</td><td data-label="Vehicles covered">Stopped vehicles with hazards on, plus emergency, tow and maintenance vehicles.</td><td data-label="What you must do">The page read in 2026 says to move over at least one lane. If you cannot, drive 25 mph or less in a 40 mph zone, or at least 20 mph below the limit in a 45 mph or higher zone.</td><td data-label="Penalty and date">The page read in 2026 lists a Class 2 misdemeanor traffic offense, a $150 fine and 3 license points.</td></tr>
    <tr><td><strong>Virginia</strong>. ${a('https://law.lis.virginia.gov/vacode/title46.2/chapter8/section46.2-861.1/', 'Section 46.2-861.1')}, checked October 3, 2026</td><td data-label="Vehicles covered">Separate provisions cover specified flashing lights and vehicles displaying hazards, caution signs or lit flares.</td><td data-label="What you must do">Under the text checked in 2026, change to a non-adjacent lane when reasonable on highways with at least four lanes, including at least two in your direction. Otherwise proceed with due caution at a safe speed.</td><td data-label="Penalty and date">The text checked in 2026 distinguishes reckless driving, a Class 1 misdemeanor, from a traffic infraction. The provision involved determines the classification.</td></tr>
    <tr><td><strong>Texas</strong>. ${a('https://capitol.texas.gov/tlodocs/88R/billtext/html/HB00898F.htm', 'Transportation Code section 545.157 amendment, HB 898')}, effective September 1, 2023</td><td data-label="Vehicles covered">The 2023 bill analysis lists emergency vehicles and law enforcement, plus tow, utility and specified construction or maintenance vehicles.</td><td data-label="What you must do">Move over a lane or slow to 20 mph below the limit, per the 2023 amendment.</td><td data-label="Penalty and date">The 2023 amendment sets a $500 to $1,250 fine, rising to $1,000 to $2,000 for a repeat within five years. Bodily injury carries a Class A misdemeanor, with a state jail felony for a repeat of that offense. This row reflects the 2023 amendment. Check the current statute.</td></tr>
    <tr><td><strong>Missouri</strong>. ${a('https://revisor.mo.gov/main/OneSection.aspx?section=304.022', 'RSMo 304.022')}, checked October 3, 2026</td><td data-label="Vehicles covered">Specified red or amber light combinations. The emergency vehicle list includes tow trucks and MoDOT emergency response and motorist assistance vehicles. No hazard-light clause covers ordinary disabled cars in this section.</td><td data-label="What you must do">Under the text checked in 2026, change to a non-adjacent lane when safe on roads with at least four lanes, including at least two in your direction. Otherwise slow with due caution.</td><td data-label="Penalty and date">Class A misdemeanor under the text checked in 2026.</td></tr>
    </tbody></table></div>`],
      ['DOT trucks, road crews and plows',
        `<p>Many states name DOT and road maintenance vehicles in the law itself. Florida’s covers road and bridge crews with warning lights. Colorado’s covers maintenance vehicles. Texas’s 2023 amendment covers TxDOT vehicles and other construction or maintenance vehicles with flashing lights. ${a('https://www.revisor.mn.gov/statutes/cite/169.18', 'Minnesota’s')} names road maintenance vehicles with their lights on. In the 28 states that cover any stopped vehicle, a stopped DOT truck or plow counts too.</p>
    <p>${a('https://ops.fhwa.dot.gov/publications/fhwahop19027/index.htm', 'FHWA’s work-zone guidance')} says most state Move Over laws apply when you pass work crews and official vehicles parked on the shoulder with flashing lights.</p>
    <p>These laws are about vehicles that are stopped. A plow clearing the road while it moves is a different situation, so check your state’s rules for working plows.</p>
    <p>Crews get hit. Missouri DOT’s protective trucks with truck-mounted attenuators were struck 50 times in 2025 while protecting crews, up from 34 in 2024, ${a('https://www.modot.org/work-zone-awareness', 'according to MoDOT')}.</p>
    <p>Missouri’s section includes MoDOT emergency response and motorist assistance vehicles. It does not extend ordinary hazard-light coverage to every disabled car.</p>
    <p>Virginia requires a separate work-zone check. Its Move Over section expressly does not apply in highway work zones, which it directs to section 46.2-878.1. Do not use the general Move Over summary to decide the rule inside a Virginia work zone.</p>`],
      ['What drivers actually do',
        `<p>In AAA’s 2025 report, video observations found that 64% of drivers changed lanes or slowed when passing an incident scene. The remaining 36% in that 2025 report did neither.</p>
    <p>That measured behavior at the observed scenes. It does not establish compliance with every state’s exact requirements.</p>`],
      ['How to check the rule where you drive',
        `<p>Open your state’s statute. Check which vehicles qualify and which lights or signals trigger the duty. Then read the lane-change requirement and the speed wording.</p>
    <p>Check the penalty separately. A base fine does not include every court cost. A rule for an emergency vehicle may differ from the rule for a disabled car.</p>
    <p>Keep the source date with any summary you save. Coverage and fines change, and an older summary can describe a law that has since been amended.</p>`],
      ['If you need to report your location',
        `<p>MileCheck shows your nearest mile marker, the first thing dispatch asks for. It works offline.</p>`],
    ],
    faq: [
      ['Do you have to move over for a car with hazard lights on?', 'It depends on your state. AAA Foundation counted 28 states covering all stopped or disabled vehicles in August 2025, but you still need to check the signals and conditions specified in your state’s statute.'],
      ['Do you have to slow down if you already moved over?', 'Some states require both actions. AAA Foundation’s 2023 review found 13 states required slowing even after a lane change, while 36 states required slowing when you could not change lanes.'],
      ['How much is a Move Over ticket?', 'AAA Foundation’s 2023 review found base first-offense fines from $30 in Florida to $2,500 in Virginia. That dated range is not a current ticket estimate, and your vehicle category and court costs matter.'],
      ['Do Move Over laws cover DOT trucks and snowplows?', 'Many do when the vehicle is stopped with its lights on. Florida, Colorado, Texas and Minnesota name road crews or maintenance vehicles in the law, and the 28 states that cover any stopped vehicle include a stopped plow. A plow working while it moves is a different situation, so check your state’s rules.'],
      ['Does Missouri’s Move Over law cover a disabled car with hazards on?', 'The Missouri section checked October 3, 2026, has no hazard-light clause for ordinary disabled cars. It covers specified light combinations and includes tow trucks and MoDOT emergency response and motorist assistance vehicles.'],
    ],
    related: `<a href="../report-location/">How to report your location on the highway</a> · <a href="../blog/what-to-tell-911-highway-breakdown.html">What to tell 911</a> · <a href="../highway-tips-for-new-tow-truck-drivers/">Highway tips for tow operators</a> · <a href="../zipper-merge-explained/">Zipper merge explained</a>`,
  },
];
