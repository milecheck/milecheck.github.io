# Mountain road pages and share cards

ChatGPT completed the four new road pages and seven share cards locally. Not committed or published.

Changed the AREAS copy and road template in `scripts/gen-pass-pages.js`. Generated `mountains/{angeles,baker,sthelens,denali}/roads/`, linked them from mountain and region pages, and linked Olympics pages to Hurricane Ridge. Added seven `images/mountains/og-<key>.png` assets and updated all per-mountain image metadata. Updated sitemap, search and sponsor inventory.

Full sources, verification results and rebuild notes are in `../../../mountain-engine/docs/seo-delivery-2026-09-28.md`. Run `node scripts/check-mountain-seo.mjs` from mountain-engine for the static checks.

The incident endpoint rejected automated verification with HTTP 403. The pages' unavailable and partial-feed handling passed fixture tests. Verify live incident coverage in a normal browser before publishing. Do not remove or bypass the API's automation guard.
