
## Maps: one shared kit (added 2026-10-03)

Leaflet maps on the site (199 pages: cameras, passes, corridors, mountains, road
conditions, bridges, fire, weather, chains, ferries, borders, Canada, the mile-marker map)
link `/assets/map-kit.css` and `/assets/map-kit.js`. Not yet: the closures pages and
/grades/, which has its own layers control (cameras on grades, chain rules, winter reports). Change how maps look
or behave there, once, and every map gets it. Do not patch map pages one by one.

- What's in it: the phone layout (camera card across the bottom, one-line status and credit
  line), the near-me button, the layers button that opens and closes the layers panel, and
  the overlay type (sentence case, no 800 weights).
- New map page or new generator: put the two tags before `</head>`, or run
  `node scripts/add-map-kit.mjs` after building (idempotent; `--dry` lists any map page
  missing it). The six map generators already emit the tags.
- Map tiles: Esri (`server.arcgisonline.com`). CARTO's free tiles return an "API KEY
  REQUIRED" image since 2026-10-03.
- Before asking to push a map change: share a preview link and let Leah look first.

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
