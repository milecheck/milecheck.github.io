// Drafts for Claude's source review and scripts/gen-guide-pages.js.
// Sources accessed 2026-09-24. Recheck before adding the public Checked stamp.
// Each object uses the generator's fields. Source comments are editorial metadata.
// Drafted by ChatGPT/Codex 2026-09-24 from docs/emails/chatgpt-brief-decision-guides-2026-09-24.md;
// every source re-fetched by Claude 2026-09-24. Loaded by gen-guide-pages.js.
module.exports = [
  {
    slug: 'mexico-car-insurance',
    checked: 'September 2026',
    eyebrow: 'Driving in Mexico',
    title: 'Do I need Mexican car insurance?',
    h1: 'Do I need Mexican car insurance?',
    lede: 'Yes. Arrange Mexican liability insurance before you drive across the border. If you rent in Mexico, confirm that the rental includes that coverage before you leave the counter.',
    sections: [
      ['Your usual policy is not enough to assume you are covered', `<p>A policy that covers you at home is not proof of Mexican liability coverage. Ask your insurer for written confirmation of what applies in Mexico and which insurer provides it.</p><p><a href="https://travel.gc.ca/destinations/mexico">Canada's travel guidance says Canadian automobile insurance is not valid there</a>. Get the Mexico policy before crossing.</p>`],
      // Checked 2026-09-24: GEICO and Government of Canada links above.
      ['Liability and damage to your car are different cover', `<p>Liability pays for injury or damage you cause to other people, subject to the policy's limits. It does not mean your own car is covered.</p><p>Broader cover can include theft and collision damage. Compare the deductible and exclusions as well as the premium. Check whether legal assistance and roadside assistance are included in the policy you select. <a href="https://www.gob.mx/profeco/articulos/seguro-para-auto">Profeco explains the coverage types</a>.</p>`],
      // Checked 2026-09-24: Profeco, Seguro para auto, 2019-07-23.
      ['Buy it before you cross', `<p>You can buy a policy online before the trip. <a href="https://www.sanborns.com/mexico-auto-insurance/">Sanborn's offers policies from one day to a year</a>. Enter your crossing time carefully so coverage has started when you enter Mexico.</p><p>Check the vehicle details and the territory covered. Save the policy and claims number on your phone, and carry a printed copy.</p>`],
      // Checked 2026-09-24: Sanborn's link above supports online purchase, durations and start time.
      ['Compare a week with a year', `<p>Get a quote for your actual dates, then an annual quote with the same cover. Compare the total prices. Multiplying a daily price by 365 will not tell you what an annual policy costs.</p><p>Sanborn's says price depends on the vehicle's value, coverage and trip length, with discounts for longer policies. If you expect another trip, include that trip when comparing the two quotes. <a href="https://www.sanborns.com/mexico-auto-insurance/">Check current policy options</a>.</p>`],
      // Checked 2026-09-24: Sanborn's. No defensible numeric weekly/annual range found.
      // Editorial change from brief: retain quote comparison until a dated, reproducible price sample exists.
      ['At a rental counter, confirm what is included', `<p>Ask the rental company to identify the Mexican liability cover in your contract, including its limit. Ask separately what you would owe if the rental car were damaged or stolen.</p><p>Review optional cover against what you already have. <a href="https://www.gob.mx/profeco/articulos/rentar-un-auto-no-tiene-que-ser-una-pesadilla">Profeco advises checking included insurance and the cost, coverage and exclusions of additional insurance</a>. “Decline everything” and “buy everything” both skip that check.</p>`],
      // Checked 2026-09-24: Profeco rental guidance. Replaces the brief's blanket "decline nothing".
      ['After a crash, call the insurer', `<p>Mexican liability insurance is mandatory, and a crash without it is handled under Mexican law, not your home insurer's. Keep the policy where you can reach it.</p><p>Use the claims number on your Mexican policy. Follow the insurer's reporting instructions and get its adjuster's guidance before agreeing to a private settlement. <a href="https://www.sanborns.com/mexico-auto-insurance/">Sanborn's warns that settling a claim yourself can void coverage</a>.</p>`],
      // Checked 2026-09-24: Sanborn's. State Department page blocks fetching, its claim removed.
      ['For a breakdown, give the road and kilometre', `<p>Call <strong>078</strong> for Ángeles Verdes roadside assistance. Dispatch depends on whether you are within its coverage. <a href="https://www.gob.mx/sectur/angelesverdes/es/articulos/078-el-numero-gratuito-que-te-acompana-auxilia-y-orienta">See the service's guidance</a>.</p><p>Mexican road signs use kilometre and route references. Read the nearest marker and give your direction of travel. For example, “kilómetro 142 de la carretera 15, hacia el norte” means kilometre 142 on Highway 15, heading north. Use the numbers you can actually see. <a href="https://www.sct.gob.mx/fileadmin/DireccionesGrales/DGST/Manuales/NUEVO-SENALAMIENTO/manualSenalamientoVialDispositivosSeguridad.pdf">SCT's road-sign manual includes kilometre and route signs</a>.</p>`],
      // Checked 2026-09-24: Ángeles Verdes and SCT links above. Phrase is an illustrative translation.
    ],
    faq: [
      // Checked 2026-09-24: State Department Mexico page and GEICO link in sections.
      ['Do I need insurance for a one-day drive into Mexico?', 'Yes. Arrange cover for the whole time the vehicle will be in Mexico, even for a day trip.'],
      ['Does my US insurance card prove I am covered in Mexico?', 'No. Ask your insurer for the Mexico policy and its coverage details before you cross.'],
      // Checked 2026-09-24: Profeco coverage definitions linked above.
      ['Does liability insurance pay to repair my own car?', 'Liability covers harm to other people and their property. Check your policy separately for damage to your car.'],
      // Checked 2026-09-24: Sanborn's duration and pricing guidance linked above.
      ['Can I buy Mexican car insurance online?', 'Yes. Set the start time to cover your border crossing and save the policy before leaving.'],
      ['Is an annual policy cheaper than a week?', 'Compare quotes with identical coverage. An annual policy can make more sense for repeat trips, but it is not automatically cheaper for one week.'],
      // Checked 2026-09-24: Profeco rental guidance linked above.
      ['Should I buy every insurance option at the rental counter?', 'Confirm the required liability coverage first. Then compare optional products with your existing cover and the amount you could owe.'],
      // Checked 2026-09-24: Ángeles Verdes link above.
      ['What number do I call for Ángeles Verdes?', 'Call 078. Give the road number, kilometre marker and direction of travel.'],
    ],
    related: `<a href="../report-location/">How to report your location</a> &middot; <a href="../driving-in-the-us-foreign-visitor-guide/">Driving in the US as a visitor</a>`,
  },
  {
    slug: 'rent-a-car-in-nyc',
    checked: 'September 2026',
    eyebrow: 'Driving in New York',
    title: 'Should I rent a car in New York City?',
    h1: 'Should I rent a car in New York City?',
    // Editorial recommendation, scoped to a visitor's city stay.
    lede: 'Usually no, especially if you are staying in Manhattan. Parking adds a daily expense before you drive anywhere, and tolls add more when you do. Rent for the days you need to leave the city, or when your access needs make a car the better choice.',
    sections: [
      ['Start with where you will actually go', `<p>For a city stay, plan around transit and use a taxi when the trip calls for one. For a day outside the city, compare the train to the complete rental cost. If you are arriving in your own car, choose where it will stay before you arrive.</p><p>The subway operates around the clock, although individual routes and stopping patterns vary. Check your actual journey, especially late at night. <a href="https://www.mta.info/document/152001">MTA service standards</a>.</p>`],
      // Checked 2026-09-24: MTA service standards. Trip recommendations are editorial judgment.
      ['Price parking for your exact dates', `<p><a href="https://spothero.com/destination/nyc/manhattan-parking">SpotHero lists Manhattan overnight parking at $34–$48</a> in its average-price table. That is a booking reference, not a quote for your hotel or vehicle.</p><p>Check the entry and exit times before paying. Ask whether the total includes tax, an oversize charge and permission to take the car out and return.</p><p>At an illustrative $40 per night, three nights add $120 before the rental or fuel. Use the garage's actual total in your comparison.</p>`],
      // Checked 2026-09-24: SpotHero. $40 × 3 = $120 is an illustrative calculation, not a market quote.
      ['Street parking comes with a schedule', `<p>An empty curb is not enough. Read every sign that applies to the space. Alternate-side rules reserve periods for street cleaning, and other restrictions can apply at the same location.</p><p>Check <a href="https://portal.311.nyc.gov/article/?kanumber=KA-01011">NYC311's current alternate-side status</a>. A cleaning suspension does not cancel every other parking rule. If you will be away when the car needs moving, include a garage in the trip budget.</p>`],
      // Checked 2026-09-24: NYC311 above and https://www.nyc.gov/html/dot/html/motorist/parking-regulations.shtml
      ['Entering the congestion zone adds a toll', `<p>For a passenger car with a valid E-ZPass, the charge is <strong>$9 at peak times or $2.25 overnight</strong>, at most once per day. Peak hours are 5 a.m.–9 p.m. on weekdays and 9 a.m.–9 p.m. on weekends.</p><p>The zone includes Manhattan streets south of and including 60th Street. The FDR Drive, West Side Highway and specified Hugh L. Carey Tunnel connections are excluded. Leaving an excluded road for local streets can trigger the toll.</p><p>Mail billing costs more. Eligible peak-hour tunnel entries receive a crossing credit. Use the <a href="https://congestionreliefzone.mta.info/tolling">MTA calculator</a> for your route and payment method.</p>`],
      // Checked 2026-09-24: MTA congestion tolling page above. Standard car rates, not exemptions/discount programs.
      ['A bridge toll is a separate charge', `<p>The Brooklyn, Manhattan, Williamsburg and Queensboro bridges have no separate bridge toll. Entering the congestion zone is a different charge. <a href="https://portal.311.nyc.gov/article/?kanumber=KA-01079">NYC311 lists the bridges</a>.</p><p>The Queens Midtown and Hugh L. Carey tunnels are tolled. The standard car rate at either is $7.46 with a properly mounted qualifying New York Customer Service Center E-ZPass tag, or $12.03 by mail. An out-of-state tag does not automatically get the lower rate. <a href="https://www.mta.info/fares-tolls/tolls/vehicle-types">Check MTA rates</a>.</p><p><a href="https://www.mta.info/fares-tolls/tolls">MTA crossings are cashless</a>. Before renting, ask how the company bills tolls and what administration charges it adds.</p>`],
      // Checked 2026-09-24: NYC311, MTA rates effective 2026-01-04, MTA cashless tolling.
      ['Rent when the destination calls for it', `<p>A car can make sense for several stops on Long Island, an upstate stay away from a station, or a Jersey Shore trip with equipment. A place outside New York City does not automatically require one. Check the destination's train connection first.</p><p>Compare pickup locations for the same dates and vehicle. Include the cost of reaching the counter and returning from it. A lower advertised rate outside Manhattan is only useful if the complete trip costs less.</p><p>For the road portion, <a href="../check-road-conditions-before-a-trip/">check conditions before you leave</a>.</p>`],
      // Editorial recommendation. Removed unsupported blanket claim that outside-Manhattan rentals are cheaper.
      ['Wait for green unless a sign allows the turn', `<p>Across New York City, you may not turn right on red unless a sign specifically permits it. Stopping first does not create permission to turn. <a href="https://dmv.ny.gov/new-york-state-drivers-manual-and-practice-tests/chapter-4-traffic-control">New York DMV's rule</a>.</p>`],
      // Checked 2026-09-24: NY DMV above. Includes the exception omitted from the brief.
    ],
    faq: [
      ['Should I rent a car for a weekend in Manhattan?', 'Usually no. Compare your likely transit and taxi spending with the rental plus parking before booking.'],
      ['What if I need a car for one day outside the city?', 'Rent for that day if the destination warrants it. Compare the train first and avoid paying to park a rental through the rest of your stay.'],
      // Checked 2026-09-24: MTA service standards linked above.
      ['Does the subway run all night?', 'Yes, but not every route runs at every hour. Check late-night service for the stations you need.'],
      // Checked 2026-09-24: MTA congestion tolling page linked above.
      ['Is congestion pricing the same as a bridge toll?', 'No. Your route can incur both, with a credit for some tunnel entries.'],
      // Checked 2026-09-24: NYC311 alternate-side guidance above.
      ['Can I leave a car on the street for the whole visit?', 'Only if every posted restriction permits it throughout your stay. Check cleaning times and current suspensions before leaving it.'],
      ['Is renting outside Manhattan always cheaper?', 'No. Compare complete quotes and the cost of reaching each pickup location.'],
      // Checked 2026-09-24: NY DMV above.
      ['Can I turn right on red in Brooklyn or Queens?', 'Only where a sign permits it. The default prohibition applies across New York City.'],
    ],
    related: `<a href="../nyc-airport-taxi-vs-uber/">Taxi, ride share or train from the New York airports</a> &middot; <a href="../driving-in-the-us-foreign-visitor-guide/">Driving in the US as a visitor</a> &middot; <a href="../check-road-conditions-before-a-trip/">Check road conditions before a trip</a>`,
  },
  {
    slug: 'nyc-airport-taxi-vs-uber',
    checked: 'September 2026',
    eyebrow: 'Driving in New York',
    title: 'JFK, LaGuardia or Newark to Manhattan: taxi or train?',
    h1: 'Taxi, ride share or train from the New York airports?',
    // Editorial recommendation for Manhattan-bound passengers, not every NYC destination.
    lede: 'For Manhattan, start with rail from JFK or Newark and the bus connection from LaGuardia. Choose a taxi or ride share when avoiding transfers matters more than the fare. Compare the price for your whole group, including the trip from the station to your door.',
    sections: [
      ['Choose by airport', `<p>Transit fares below are per adult, one way. Taxi amounts are per vehicle before the listed extras. Times describe only the stated portion of the trip, not baggage collection or the journey to your hotel.</p><div class="table-wrap"><table><caption>Getting from the airport to Manhattan</caption><thead><tr><th scope="col">Airport</th><th scope="col">Transit and fare</th><th scope="col">Taxi or ride share</th><th scope="col">Time, bags and late arrivals</th></tr></thead><tbody><tr><th scope="row">JFK</th><td>AirTrain plus subway, $11.75. AirTrain plus LIRR, $14 off-peak or $16 peak.</td><td>Yellow taxi, $70 base fare plus extras. Compare the app's current quote.</td><td>About 20 minutes between Jamaica and Midtown on LIRR, plus AirTrain and waiting. You carry bags through the transfer. Check overnight service.</td></tr><tr><th scope="row">LaGuardia</th><td>Q70 bus plus subway, $3. Q70 plus LIRR at Woodside, $5.25 off-peak or $7.25 peak.</td><td>Metered taxi plus airport charges. Compare the app quote if you want to avoid the bus transfer.</td><td>Allow an hour or more depending on the route and traffic. Q70 has luggage racks. Check the next bus and train after a late arrival.</td></tr><tr><th scope="row">Newark</th><td>AirTrain plus NJ Transit to New York Penn, $17.25 as currently listed by NJ Transit.</td><td>Airport-listed Manhattan base estimates are $60–$80 by destination, plus fees and tolls. Ride share is quoted in the app.</td><td>About 30 minutes for the NJ Transit leg, plus the airport connection and waits. Terminal A needs a walk or shuttle. Check departures before choosing rail late at night.</td></tr></tbody></table></div><p>Sources and current details are in the sections below. Check the road travel estimate when you land rather than treating a fixed driving time as a promise.</p>`],
      // Checked 2026-09-24: https://www.mta.info/guides/airports/jfk
      // https://www.jfkairport.com/transportation/public-transport (20-minute LIRR leg)
      // https://www.mta.info/guides/airports/laguardia
      // https://www.njtransit.com/airport ($17.25 published fare; reconfirm in journey planner)
      // https://www.newarkairport.com/transportation/airtrain (Terminal A connection)
      // https://www.nyc.gov/site/tlc/passengers/taxi-fare.page
      // https://www.newarkairport.com/transportation/taxi-service
      ['The JFK flat fare is not the final bill', `<p>The <a href="https://www.nyc.gov/site/tlc/passengers/taxi-fare.page">$70 yellow-taxi fare applies between JFK and Manhattan</a>. Add the $0.50 state surcharge, $1 improvement surcharge and applicable congestion charges. Pickup at JFK adds $2. Weekday trips from 4–8 p.m., excluding legal holidays, add $5. Tolls and a tip are separate.</p><p>Other JFK destinations use the meter. LaGuardia uses the meter plus a $5 airport surcharge and other applicable charges.</p>`],
      // Checked 2026-09-24: TLC fare page. Congestion components deliberately not presented as one universal total.
      ['Compare ride share after you land', `<p>Enter the exact destination and vehicle size before comparing. Look at the total quote and pickup instructions, then compare them with the taxi fare and queue. A low fare is less useful if reaching the pickup adds a shuttle ride you do not want.</p><p>For a group, divide the vehicle total by the number travelling. For transit, add everyone's tickets and any ride you need after leaving the station. Choose the trip you would actually take.</p>`],
      // Editorial comparison method. No fixed ride-share price or blanket cheapest-provider claim.
      ['Know where the transfer happens', `<p><strong>JFK.</strong> Take AirTrain to Jamaica for LIRR or the subway. Howard Beach connects with the A train. AirTrain costs $8.75 separately from the connecting service. <a href="https://www.mta.info/guides/airports/jfk">MTA's JFK guide</a>.</p><p><strong>LaGuardia.</strong> Q70 serves Terminals B and C and connects with the subway at Jackson Heights and LIRR at Woodside. For Terminal A, check the airport shuttle or M60 bus. <a href="https://www.mta.info/guides/airports/laguardia">MTA's LaGuardia guide</a>.</p><p><strong>Newark.</strong> Take AirTrain to the airport rail station, then NJ Transit toward <em>New York Penn Station</em>. Newark Penn is a different station. Buy a ticket with the airport as its origin so the AirTrain charge is included. <a href="https://www.njtransit.com/airport">NJ Transit airport guide</a>.</p>`],
      // Checked 2026-09-24: linked operator guides. No claim of a direct train at LaGuardia.
      ['Check the last part of the trip', `<p>Find the station exit nearest your hotel. If you need elevators, check their status before choosing a route. A cheaper train journey may still need a taxi at the end.</p><p>At Newark, AirTrain does not reach Terminal A directly. The airport lists a 15-minute walk or a five-minute shuttle from its AirTrain station. Construction can also replace AirTrain service with buses. <a href="https://www.newarkairport.com/transportation/airtrain">Check Newark's current airport connection</a>.</p><p>For a late arrival, check the departure you can realistically reach after collecting bags. Use the current timetable, not the time your flight lands.</p>`],
      // Checked 2026-09-24: Newark airport page and MTA JFK guide's elevator-status advice.
      ['Use the taxi stand or your booked pickup', `<p>Do not take a ride from someone soliciting passengers inside the terminal. Follow signs to the official taxi stand or the pickup point for the vehicle you booked.</p><p>Newark has its own airport taxi fares. Get the dispatcher's receipt and keep it after showing the driver. <a href="https://www.newarkairport.com/transportation/taxi-service">The airport publishes destination rates and extra charges</a>.</p>`],
      // Checked 2026-09-24: Newark taxi guidance and https://www.jfkairport.com/transportation/taxi-service
      ['Skip the rental counter for a Manhattan stay', `<p>A car used only to reach your hotel still needs somewhere to park. Compare the airport transfer with the rental's complete cost, including the nights it sits unused.</p><p>If your road trip starts after your city visit, pick up the rental then. <a href="../rent-a-car-in-nyc/">See when renting in New York makes sense</a>.</p>`],
      // Editorial recommendation.
    ],
    faq: [
      // Checked 2026-09-24: TLC fare page linked above.
      ['Is $70 the whole JFK taxi bill?', 'No. It is the Manhattan base fare before applicable surcharges, tolls and a tip.'],
      ['Does LaGuardia have the JFK flat fare?', 'No. Standard LaGuardia taxi trips use the meter.'],
      // Checked 2026-09-24: MTA LaGuardia guide linked above.
      ['Can I take a train directly from LaGuardia?', 'No. Take a connecting bus to the subway or LIRR.'],
      ['Is Uber always cheaper than a taxi?', 'Compare the live quote for your destination with the taxi total. There is no fixed winner.'],
      // Checked 2026-09-24: MTA JFK guide linked above.
      ['Is JFK AirTrain included in the subway fare?', 'No. The AirTrain and subway are separate charges.'],
      // Checked 2026-09-24: NJ Transit airport guide linked above.
      ['Is Newark Penn Station the Manhattan stop?', 'No. For Midtown Manhattan, choose New York Penn Station.'],
      ['What if we have several large bags?', 'Compare a vehicle that fits everyone with the transfers you would need on transit. Check station elevators before deciding.'],
      ['Should I rent a car just for the airport trip?', 'Usually no for a Manhattan stay. Price a transfer first, then rent when you need to leave the city.'],
    ],
    related: `<a href="../rent-a-car-in-nyc/">Should I rent a car in New York City?</a> &middot; <a href="../driving-in-the-us-foreign-visitor-guide/">Driving in the US as a visitor</a>`,
  },
];
