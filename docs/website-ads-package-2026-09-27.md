# Website & ads reconciliation — 2026-09-27

**Why this file exists:** a "website and ads" session accumulated pasted drafts from a
different AI (a home-page rewrite, partners/B2B page suggestions, a programmatic-SEO
directory architecture) plus outputs from a separate cloud session that did sponsor-outreach
research. Before acting on any of it, it got checked against what's actually live — most of it
turned out to already be built, in better shape than the drafts assumed. This is the one place
that says what's real, what's redundant, and what's an actual gap, so nothing gets rebuilt or
regressed by accident.

## Already live and mature — don't touch, don't rebuild

- **Home page hero** (`index.html`). The pasted rewrite ("Know Exactly Where You Are. Always."
  / "100% Free & Ad-Free") would have been a regression: it hits the hype register and the
  "free" framing MileCheck explicitly avoids (the app has a paywall). The **live** hero already
  reads "Know exactly where you are on the highway." / "Your nearest mile marker, live — plus
  road alerts from all 50 state DOTs. It's the first thing dispatch asks for." — concrete,
  checkable, no hype. It's followed by a stats ledger, an "Inside the app" section, a live-maps
  linklist, a PNW-specific section, pricing, FAQ, the dash-display teaser, the Roy/story
  section, and a newsletter signup. None of this needs the persona-tabs/scenario-matrix layout
  from the pasted draft.
- **Partners page** (`partners/index.html`). Already has three products (milepost dataset,
  live conditions API with a real JSON response sample, historical archive), a "harder than
  building the app" proof section, seven audience segments, four engagement models (API
  access / data licensing / white-label SDK / joint development), and a Geotab CTA section.
  The pasted suggestions (self-service dev hub, segmented Geotab-vs-Enterprise funnel,
  coverage map, structured lead form) are **partially already true** — see the real gap list
  below for what isn't.
- **`sponsor/index.html`** — website-sponsor page, tabs for offering/pricing/traffic, live
  traffic counters, intentionally keeps pricing off the public page.
- **`partners/corridor-boards.html`** — the separate physical-screen/venue pitch (free
  install, sponsor slot second), distinct from website sponsorship.
- **The "programmatic SEO directory architecture"** the pasted draft proposed from scratch
  (an incident-response cluster, an infrastructure-delay cluster, an environmental-threat
  cluster, an absolute-location cluster) is **~90% already built**, just under different
  names: `corridors/` (12 interstate hub pages with live cameras/alerts/conditions),
  `cameras/` (73 state/metro camera pages), `bridges/` + `seattle-drawbridges/` (43 pages
  covering bridge status/schedules), `passes/` (13 named mountain-pass camera pages),
  `fire/`, `closures/`, `weather/`, `borders/`, `ferries/` (the five biggest live-data hubs),
  `states/` (50-state hub), plus 54 driver-education/glossary pages and 58 per-state
  mile-marker guide pages. Full inventory: `docs/sponsor-outreach/08-sponsor-page-catalog-and-pricing.md`.

## Redundant in the pasted drafts — do not build

- The home-page persona-tabs (Professional Drivers / Road Trippers / First Responders) +
  scenario-matrix layout. Superseded by what's live and already voice-compliant; rebuilding it
  would replace a working page with a weaker, hype-heavier one.
- The 4-cluster SEO directory proposal, as a from-scratch architecture. It describes
  `/incidents/[corridor]`, `/status/[bridge]`, `/maps/wildfire-smoke`, `/maps/[state]/[highway]`
  — all of which already exist under `corridors/`, `bridges/`+`seattle-drawbridges/`, `fire/`,
  and `states/`+`cameras/` respectively. Building the proposed structure fresh would just
  duplicate live pages under new paths.

## Genuine, non-redundant gaps — backlog, not built this pass

These are real and worth doing later, but this pass was scoped as a reconciliation doc, not
an implementation pass:

- **No sandbox/API-key self-serve signup** on the partners page — engagement is entirely
  `mailto:info@milecheckapp.com`. A "Request sample data" link works today; a self-serve key
  would need actual backend support to issue and rate-limit dev keys, which doesn't exist yet.
- **No interactive coverage-map visual** on the partners page — the 50-state coverage is
  stated in text/stats, not shown as a map graphic.
- **No structured lead form** — a qualifying form (fleet size, platform, use case) in place of
  a bare `mailto:` would route better-qualified B2B leads, but needs a form backend (Formspree,
  Netlify Forms, or similar) that isn't wired up on this static site yet.

## This session's other outputs — pointers, not duplicates

- **`docs/sponsor-outreach/`** — the full outreach package (tracker, wave 1/2/3 ready-to-send
  emails, activation runbook, corridor-board venue-finding correction, and now the page
  catalog + volume pricing at `08-sponsor-page-catalog-and-pricing.md`). Start with that
  folder's `README.md`. **Pricing is now settled**: the $49 founding rate is a one-page,
  personal-outreach offer only, grandfathered for that sponsor going forward (same promise
  MileCheck makes its own app subscribers); the catalog's $75/$60/$50 volume pricing is the
  standing rate for everything else, including any extra page a founding sponsor adds later.
- **`docs/sponsor-prospect-research-2026-09-27.md`** — the towing/roadside ad-spend research
  (21 prospects across 2 batches + a reserve tier).
- **`docs/fable-handoff-2026-09-26.md`** — the broader open-work handoff (uncommitted
  site-wide changes, a conflict with a parallel patch effort, the affiliate-links TODO).

## Cleanup still open

Two files got written into the **wrong repo** (`milecheck-native` instead of this one,
`milecheck.github.io`) earlier in this session, as a reconstruction attempt before the real
push to this repo was found: `docs/sponsor-prospect-research-2026-09-27.md` and
`marketing/b2b/sponsor-call-sheet.csv` over in `milecheck-native`. They're now stale
duplicates of the real files in this repo. Not deleted yet — confirm before removing.

## Dash-display page fix (unrelated, fixed in passing)

`/dash-preorder.html` had a layout bug flagged mid-session: the hero text was capped at
`max-width:22ch`/`46ch` against a 1040px container (wasted width), and the device photo card's
`margin:-40px` pulled it up to straddle the gradient-to-cream color seam. Both fixed — text
now uses `34ch`/`60ch`, and the card sits with a clean positive margin below the gradient
section instead of overlapping it.
