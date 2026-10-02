
## Analytics + attribution (added 2026-09-14)
- `node scripts/tag-store-links.mjs [--pt TOKEN]` — tags every App Store / Play link with the page slug
  (`ct=` for Apple campaigns, `referrer=utm_…` for Play). **Run after any page generator.**
  Apple provider token is `128447811` (App Store Connect → App Analytics → Campaigns). Always run with `--pt 128447811`. GA4 measurement ID is `G-CDMSB5630W`.
- `node scripts/add-nav-search.mjs` — the Search link in every page's nav (2026-09-28). Idempotent. Run after
  any generator; a regenerated page loses the link until this runs.
- `node scripts/link-jsonld.mjs` — connects every page's JSON-LD into one graph (2026-10-02): the home page
  defines MileCheck once with `@id`s `#org`, `#website`, `#app`; every other page references them; page entities
  get their own `@id`; Highway Report pages get Dataset markup from `data/road-report-<month>.json`. Idempotent.
  **Run last, after any generator and after `tag-store-links.mjs`.** `--check` reports without writing.
- `node scripts/build-search-index.mjs` — rebuilds `search-index.json` for `/search/` from every canonical page.
  Run after adding or renaming pages, before `build-sitemap.mjs`.
- `node scripts/gen-road-conditions-pages.js` — `/road-conditions/<state>/` for all 50 states + the index
  (2026-09-28). Per-state prose in `scripts/road-conditions/states.cjs`.
- `node scripts/add-analytics.mjs G-XXXXXXXXXX` — injects the GA4 tag on every page, with `store_click` and
  `outbound_click` events. Idempotent. Run after generators too.
