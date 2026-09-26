# Fable handoff — Sept 26, 2026

Nothing in this session was pushed beyond the two early commits (California QuickMap
fix, I-40 corridor page). Everything else below is uncommitted in the working tree,
waiting on Fable's review before anything further goes to `main`.

## Uncommitted right now

- 203 modified files — mostly touched by the site-wide maintenance scripts this session
  ran in sequence (store-link attribution tagging, GA4 injection, coverage-count
  patching, canonical tags, the newsletter signup band). Drift, not intentional edits,
  except where noted below.
- 6 new untracked pages: `corridors/i-20/`, `corridors/i-35/`, `corridors/i-65/`,
  `corridors/i-81/`, `passes/anthony-lakes/`, `passes/little-cottonwood/`.

## Known conflict — reconcile before pushing further

`docs/handoff-site-patches-2026-09/` (26 git-format patches, mostly authored Sept 25-26)
and `docs/handoff-nps-cameras-mountain-pages-2026-09-24.md` (a parallel state-by-state
DOT-feed audit) are a SEPARATE effort touching the same repo the same days as this
session. Three of the 26 patches were tested with `git apply --check` and ALL failed
against the current tree — real conflicts, not tested false alarms. Not reconciled;
Leah's instruction was to leave this for Fable rather than resolve it unilaterally.

## Fixed this session (real fixes, just unreviewed)

- `scripts/add-canonicals.mjs` — no longer overwrites an existing `<link rel="canonical">`
  tag. It was blindly "correcting" redirect stubs that deliberately point elsewhere (e.g.
  `enchantments/index.html`, a cross-domain redirect to a different app) — a real bug,
  now fixed at the source.
- `scripts/gen-state-camera-pages.js` + `scripts/gen-corridor-pages.js` — the FAQ JSON-LD
  block strips all `<...>` tags from its source text, which also strips the
  `<!--cov:-->` coverage-count markers. Any generator with a hardcoded number baked a
  stale count into structured data with no way to ever fix it after the fact. Both
  generators now read `data/coverage-ledger.json` live instead of hardcoding.
- Drawbridge count — fixed stale "38 states" / "seven Seattle drawbridges" confusion
  site-wide → correct "26 states" via the coverage-ledger marker (`pages.bridge_states`),
  across `seattle-drawbridges/` (15 files) and one blog post.
- 5 new corridor pages (I-40 pushed; I-20/I-35/I-65/I-81 uncommitted) and 2 new pass
  pages (Anthony Lakes OR, Little Cottonwood Canyon UT) — all facts verified via
  WebSearch, not assumed.

## TODO: affiliate links (Amazon storefront concept) — not yet built

Flagged by Leah (2026-09-26) to make sure this doesn't get lost. From an early
ChatGPT-drafted idea pasted this session: an Amazon affiliate product grid for
road-trip/driving gear, with storefront ID `trailapps-20`.

**Context to reconcile before building anything:**

- The site already ships ONE affiliate program — Discover Cars, on 8 English
  rental-guide pages (commit `d65b23b`, "Discover Cars affiliate box on 8 English
  rental guides"). That's the existing precedent for tone and placement: a car-rental
  box on car-rental-adjacent content, not a general product push. The new idea is a
  broader Amazon Associates storefront/grid — a different shape than what's shipped.

**Before shipping anything:**

1. **Verify `trailapps-20` is Leah's real, active Amazon Associates tracking ID** —
   same rule as any credential/ID pulled from a dashboard or a pasted draft: confirm it
   really belongs to her before it goes live anywhere. A wrong or stale tag earns no
   commission and can risk the account.
2. Decide which pages would actually carry it, and why. The site's editorial voice is
   deliberately restrained and non-salesy (see the Seattle Drawbridges pages' "this is
   not one of them" tone, and the same restraint point already made about the sponsor
   one-pager — no filler, no over-selling). A generic product grid needs to earn its
   place or it reads as out of tone.
3. Decide scope: one well-placed box per relevant page (matching the Discover Cars
   pattern — proven, already in the codebase) vs. a dedicated storefront page. The
   former fits the site's existing precedent; the latter is a bigger, unproven bet.
4. Check Amazon Associates' current operating agreement before shipping any links —
   required disclosure language, no cookie-stuffing, no incentivized clicks. This is a
   compliance gate, not just a tone one. Confirmed 2026-09-26 (verify again before
   shipping, since Amazon updates this):
   - A clear, conspicuous disclosure is required near each link — Amazon's own examples
     are things like "(paid link)" or "#CommissionsEarned".
   - Separately, the site itself must state, prominently: "As an Amazon Associate I earn
     from qualifying purchases."
   - Amazon's agreement treats any violation as a "material breach" — enforcement is
     account closure, not a warning. Worth building the disclosure in from the first
     page, not adding it after the fact.
   - The agreement changes over time (a April 2026 update added a 180-day shipped/paid
     window for a purchase to still count) — re-read the current terms at
     affiliate-program.amazon.com/help/operating/agreement right before shipping,
     don't rely on this note staying accurate.

This is unscoped and unbuilt. It should stay on the list until someone actually decides
the four points above, not get quietly dropped.
