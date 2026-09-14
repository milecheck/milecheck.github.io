
## Analytics + attribution (added 2026-09-14)
- `node scripts/tag-store-links.mjs [--pt TOKEN]` — tags every App Store / Play link with the page slug
  (`ct=` for Apple campaigns, `referrer=utm_…` for Play). **Run after any page generator.**
  Apple provider token is `128447811` (App Store Connect → App Analytics → Campaigns). Always run with `--pt 128447811`. GA4 measurement ID is `G-CDMSB5630W`.
- `node scripts/add-analytics.mjs G-XXXXXXXXXX` — injects the GA4 tag on every page, with `store_click` and
  `outbound_click` events. Idempotent. Run after generators too.
