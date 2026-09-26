# B2B data licensing prospects: who to actually call, beyond Geotab

The partners page already makes the general pitch — milepost dataset, live conditions
API, historical archive, seven audience segments. This is the specific list: real
companies, verified this session, with a real way in where one exists. Geotab is the one
proof point we have (live Add-In in MyGeotab and Geotab Drive, data by license). Everything
below is ranked by how provable the fit is, not by company size.

## Tier 1: other fleet-telematics platforms with a public developer program

These are the direct Geotab comparables — companies that, like Geotab, run a self-serve
or semi-self-serve marketplace a small data vendor can actually apply to.

### Samsara — strongest match, and there's already a precedent partner

Samsara runs the same shape of program Geotab does: a **Technology Partner Program** with
a public application process at developers.samsara.com. Applications are reviewed weekly,
approved partners get a sandbox and a developer portal, and finished apps go through
draft → beta → review → published in the App Marketplace.
([Create and Manage Apps](https://developers.samsara.com/docs/marketplace-apps),
[Technology Partner Program](https://developers.samsara.com/docs/technology-partner-program),
[Application Process](https://developers.samsara.com/docs/application-process))

**Why this specific company fits, not just "more data":** Samsara's own marketplace
already lists two weather/road-risk add-ins — **WeatherOptics** and **Tomorrow.io** — sold
as safety and delay-avoidance layers on top of fleet GPS data.
([Samsara App Marketplace](https://www.samsara.com/resources/marketplace)) WeatherOptics
is the closer comparable: an 11-person company (founded 2016, per Crunchbase/Tracxn) that
sells weather-and-road-risk scores into fleets like Werner, Knight-Swift, and NFI, and is
itself a Trimble partner. ([WeatherOptics on Samsara](https://www.samsara.com/resources/marketplace/weatheroptics),
[Tracxn: WeatherOptics](https://tracxn.com/d/companies/weatheroptics/__i9oqYhZJQkn3cCtZddXFrcY9aIQ0UpmYiLrDYdzfgB8))
That's the exact slot MileCheck's DOT-alert feed would fill, except MileCheck's data is
official state DOT closures/incidents/mile-marker positions, not modeled weather risk —
a genuinely different, complementary layer, not a repeat of what's already there.

**Way in:** developers.samsara.com → Technology Partner Program application (self-serve,
weekly review, requires a company email and a public business presence).

### Motive (formerly KeepTruckin) — also self-serve, also worth applying to directly

Motive runs its own **App Marketplace** off a self-serve Developer Portal. Partners
register their company, pick a partnership type, and submit technical/security/business
details for Marketplace consideration; approved partners get their own Partner Developer
Portal to configure the integration before listing.
([Motive Marketplace](https://marketplace.gomotive.com/),
[Partnerships Overview](https://helpcenter.gomotive.com/hc/en-us/articles/31079400480285-Partnerships-Overview),
[Introduction — Motive API docs](https://developer-docs.gomotive.com/reference/introduction))

**Why it fits:** Motive is a straight Geotab/Samsara competitor serving the same trucking
and field-service fleets MileCheck already targets (DOT crews, EMTs, truckers per the
audience list). No confirmed existing weather/road-conditions add-in was found in Motive's
marketplace in this search, which is worth flagging honestly — the fit is inferred from
category match, not from a comparable already listed there. Apply the same way regardless:
self-serve, no gatekeeping found beyond the standard review.

**Way in:** marketplace.gomotive.com → partner onboarding form (self-serve).

### Platform Science — smaller, but has an explicit application form and already runs a comparable-sized navigation partner

Platform Science operates a **Virtual Vehicle Marketplace** and developer program open to
technology, OEM/integrator, and affiliate partners, gated behind a mandatory review called
**SPEED Certification**.
([For Developers](https://www.platformscience.com/for-developers),
[Developer Portal form](https://www.platformscience.com/developer-portal-form),
[SPEED Certification](https://www.platformscience.com/speed-certification))

**Why it fits:** Trucker Path — a road-conditions/navigation company much closer in shape
to MileCheck than Geotab or Samsara are — is already a listed Platform Science partner for
truck-safe navigation. ([Trucker Path | Platform Science Marketplace](https://www.platformscience.com/marketplace/trucker-path))
That's a direct proof the category ("road intelligence for the driver's screen") already
has a slot on this platform.

**Way in:** platformscience.com/developer-portal-form (self-serve intake form, then SPEED
Certification review).

### Verizon Connect, Fleet Complete (Powerfleet), Omnitracs (Solera) — real platforms, no clean self-serve door

All three run real APIs and real partner ecosystems, but none of them has an open
application a small vendor fills out and hears back from:

- **Verizon Connect**: the Reveal API is customer/partner-gated — you request Integration
  Manager and Reveal REST credentials through the Reveal marketplace rather than
  self-registering, and the public "become a partner" page routes to a sales conversation,
  not a form. ([Become a partner](https://www.verizonconnect.com/services/become-a-partner/),
  [Developer portal overview](https://reveal-help.verizonconnect.com/hc/en-us/articles/10933751995539-Developer-portal-overview))
  Its marketplace does carry weather and safety-scoring add-ins (e.g. SpeedGauge), so the
  category exists there too — you'd just need a warm intro or a partnerships conversation,
  not a form.
- **Fleet Complete / Powerfleet**: API access is described as "provided free of charge for
  clients," with partner questions routed to support@powerfleet.com — a contact address,
  not an application portal. ([Developers API](https://www.fleetcomplete.com/api/))
- **Omnitracs (Solera)**: no open developer portal at all — API credentials are issued to
  contracted customers and integration partners only. ([api-evangelist Omnitracs profile](https://github.com/api-evangelist/omnitracs))

Worth having on the list because they're real, large fleets that overlap MileCheck's
trucking/EMT/DOT audience — but the honest next step for these three is a partnerships
email or a warm intro, not a self-serve application, and they shouldn't be first in line
given two platforms above that do have an open door.

## Tier 2: trucking/logistics companies that already sell mile-marker or road-hazard-adjacent features

### Drivewyze — the strongest single lead in this whole list

Drivewyze runs **Safety+**, an in-cab alerts product that already licenses in third-party
hazard data: it partnered with **HAAS Alert** specifically to integrate hazard-alert data
into its own safety notifications. ([Drivewyze, HAAS Alert partner to integrate hazard
data — CCJ](https://www.ccjdigital.com/technology/article/15297245/drivewayze-haas-alert-partner-to-integrate-hazard-data))
That is a real, verifiable precedent of exactly the deal MileCheck would want: a
weigh-station/safety company buying in a smaller vendor's normalized hazard feed rather
than building its own DOT integrations. Drivewyze also has 40+ existing telematics/ELD
integration partners and a public developer site with OpenAPI docs.
([Partners Overview](https://drivewyze.com/partners/), [developer.drivewyze.com](https://developer.drivewyze.com/docs/vmapi-getting-started))

**Why it fits, specifically:** Drivewyze Safety+ already advertises "real-time weather
alerts... upcoming dangerous curves, low bridges... across 2,600+ High Risk Areas" — that
is functionally the same category as MileCheck's normalized 50-state DOT closure/incident
feed, sourced from official state DOT data instead of (or in addition to) Drivewyze's own
curated hazard-area list. The pitch is coverage and freshness: MileCheck's feed is
already live in 42+ states with sub-hour refresh, pulled directly from each state's own
system.

**Way in:** drivewyze.com/partners/ has a partner-inquiry path; no confirmed self-serve
form was found, so this is a partnerships-email target, but a warm one — they've already
proven they'll buy exactly this kind of data from a vendor MileCheck's size.

### Trucker Path — closer to a peer than a customer, but a real complement play

Trucker Path is bigger than MileCheck and does its own crowd-sourced road conditions,
parking, and weigh-station data, distributed through partnerships with Samsara, Motive,
and Platform Science. ([Partner with Trucker Path](https://truckerpath.com/company/partnerships))

**Why it fits, specifically, and why this is a real distinction, not a knock on Trucker
Path:** Trucker Path's road-condition and closure data is driver-reported/crowd-sourced.
MileCheck's is normalized directly from each state DOT's own system — a different,
authoritative source that would complement rather than duplicate Trucker Path's
crowd-sourced layer (official closures the crowd hasn't reported yet, or mile-marker-precise
positions crowd reports don't carry). This is a real distribution partner, but pitch it as
a data supplier to their existing product, not as a competing app — Trucker Path is not a
company MileCheck can out-market on trucker-app reach.

**Way in:** truckerpath.com/company/partnerships (partnerships contact page, not a
self-serve form).

### Rand McNally / Trimble Maps — a maybe, and the fit is weaker than it looks

Trimble Maps (Rand McNally's routing arm) already runs "Rand Road IQ," described as
drawing on "real-time traffic, weather, and operational data" for truck routing, built on
an 80-year proprietary road-attribute database.
([Rand McNally Introduces Truck-Safe Connected Navigation](https://www.prnewswire.com/news-releases/rand-mcnally-introduces-truck-safe-connected-navigation-powered-by-rand-road-iq-on-platform-science-302594363.html),
[Build on Rand](https://randmcnally.com/build-on-rand/))

**Honest read:** Trimble/Rand McNally is a large, well-resourced data aggregator in the
same space MileCheck is in — they likely already have their own DOT feed integrations
across all 50 states, which is the opposite of a gap MileCheck fills. Their public API
platform (developer.trimblemaps.com, self-serve trial key) is set up for *consuming*
Trimble's mileage/routing data, not for *selling into* Trimble. This is worth one
exploratory email to "Build on Rand" partnerships, but it shouldn't be prioritized — it's
the least provable fit on this list.

### DAT Freight & Analytics — included for completeness, weak fit

DAT has a real, well-documented developer program (developersupport@dat.com, a formal
Developer Portal). ([API Integration - DAT](https://www.dat.com/api-integration)) But DAT's
core product is load-matching and freight-rate data, not road conditions or navigation —
there's no clean seam for a mile-marker/DOT-alert feed in their product. Not recommending
active outreach here; noting it because it came up in research and the honest answer is
"doesn't fit."

## Tier 3: usage-based insurance — real category, but the fit is speculative and the door isn't a direct one

This is the one area where the brief's premise (insurers wanting road-hazard data in their
risk scoring) doesn't map to a clean "call this company" answer, and it's worth being
straight about why.

**What actually exists:** UBI insurers (Root, Progressive Snapshot, Nationwide SmartRide)
don't run public developer programs for outside road-condition data. What they do run is
participation in **data exchanges** that sit between telematics sources and insurers:

- **Verisk Data Exchange** — already has Geotab, Omnitracs, Ford, and Honda feeding
  driving-behavior data in, with insurers like Nationwide consuming it for UBI discounts.
  Notably, the Geotab-Verisk integration is itself a Geotab Marketplace Add-In — meaning
  MileCheck is technically already one hop from this exchange through the existing Geotab
  relationship, without a new deal. ([New Verisk Data Exchange Integration... on the Geotab
  Marketplace](https://www.verisk.com/company/newsroom/new-verisk-data-exchange-integration-for-insurance-telematics-now-available-on-the-geotab-marketplace/))
- **LexisNexis Telematics Exchange** — the same pattern with GM, Nissan, Mitsubishi, and
  Root Insurance as the first adopter of its "Telematics OnDemand" product.
  ([LexisNexis Telematics Exchange](https://risk.lexisnexis.com/products/telematics-exchange))

**Why this is speculative, stated plainly:** both exchanges are built around *driving
behavior* data (speed, braking, mileage) for pricing risk, not *road-condition* data
(closures, hazards, mile-marker position). Whether Verisk or LexisNexis would want a
road-hazard layer added to their risk models is a real question nobody in this research
answered — no public statement from either company expresses demand for this. The provable
fact is only that the exchange pattern exists and that Geotab is already in it. Flagging
this as a warm research lead for someone at Verisk or LexisNexis business development to
ask "would a road-hazard/closure signal improve your risk model," not as a target with a
form to fill out.

**Direct insurer outreach (Root, Progressive, Nationwide) is not recommended** — none of
them run a relevant public partner program, and cold outreach to an insurance carrier's
product team with no existing relationship is a low-odds move compared to the exchanges
above, which already do this exact kind of data aggregation for a living.

## Proof-of-pattern check: has a company MileCheck's size actually pulled this off?

Yes, and it's the WeatherOptics example above, not a hunt for a road-data company
specifically. WeatherOptics is an 11-person weather-risk company that sells into Samsara's
marketplace and directly to large fleets (Werner, Knight-Swift, NFI, Walmart) — the same
"small data vendor, large fleet-platform distribution" shape MileCheck is already running
with Geotab. It's not a road-conditions company, so it's not a perfect analog, but it's the
closest verifiable one found: same buyer type (fleet-telematics platforms and large
carriers), same seller size, same "sell risk-relevant road/weather signal, not raw
telematics" pitch.

The counter-example worth knowing: **Wejo** (UK connected-car data broker, delisted from
Nasdaq and into administration in 2023) and **Otonomo** (acquired for a fraction of its
peak valuation) both failed trying to broker vehicle data at scale — the failure mode was
years of "trillions of data points" reporting with only $15M combined revenue against
$250M+ in combined operating expenses, and stakeholders still fighting over who owns
vehicle data. ([Car data industry still hasn't struck "oil"](https://www.globalfleet.com/en/smart-mobility/global/features/car-data-industry-still-hasnt-struck-oil-two-prominent-market-exits-show))
The lesson for MileCheck isn't "don't do this" — it's that the winning shape is
WeatherOptics' (a specific, licensable signal sold into existing platforms with a real
subscription business under it), not Wejo's (raw data brokerage at massive scale with no
clear buyer paying real money for the specific signal).

## Gut check: is "Geotab Marketplace Add-In" functionally different from "raw API/data licensing," and does it change who to approach first?

Yes, genuinely different, and yes, it changes the order.

A **marketplace Add-In** (Geotab, Samsara, Motive, Platform Science) is a UI integration —
it runs inside the buyer's existing dashboard, the buyer's own customers see MileCheck's
data as a feature of the platform they already pay for, and the deal is closer to a
software listing than a data contract. It's low-commitment for the platform (they're not
buying data, they're approving an app) and has a genuine self-serve door at three of the
four Tier 1 platforms above. This is why it's the right place to start: it's the same
motion that already worked with Geotab, the application processes are public and
low-friction, and approval doesn't require convincing a business-development team to sign
a data contract — it requires passing a technical review, which MileCheck can control.

**Raw API/data licensing** (the Verisk/LexisNexis exchange pattern, or a direct
Drivewyze-style ingest deal) is a data contract — the buyer's own product consumes
MileCheck's feed directly, no MileCheck UI is shown to the end user, and the deal requires
a real commercial negotiation (pricing, SLAs, liability) rather than a marketplace
approval. This is slower and higher-touch, but it's also the only structure that fits
Drivewyze, Verisk, and LexisNexis — none of them have a marketplace-Add-In-shaped door to
walk through.

**What this means for sequencing:** lead with the marketplace-Add-In motion (Samsara,
Motive, Platform Science) because it's the lowest-friction repeat of what already worked,
and treat Drivewyze and the insurance-exchange angle as the slower, higher-value
data-licensing track to run in parallel, not instead.

## Strongest first approaches, ranked

1. **Samsara.** Self-serve application, weekly review, and a directly comparable partner
   (WeatherOptics) already proves the category sells on this exact platform. This is the
   closest one-to-one repeat of the Geotab motion that already worked.
2. **Drivewyze.** Not self-serve, but the single most provable fit on this whole list —
   they've already bought hazard data from a company MileCheck's size (HAAS Alert) for the
   exact same in-cab alerts use case. Worth a direct partnerships email now, in parallel
   with the Samsara application, since it runs on a different (slower) track.
3. **Platform Science.** Self-serve intake form, and Trucker Path's existing listing there
   proves the "road intelligence" category already has a home on this platform. Third
   because it's a smaller platform than Samsara or Motive, but the application friction is
   just as low.

Motive is a close fourth — equally self-serve, equally good category fit — it's ranked
just behind these three only because no comparable weather/road-conditions partner turned
up in its marketplace during this search, so the category fit there is inferred rather than
proven.
