# When someone says yes — how to actually turn the slot on

Confirmed by reading the live markup (`cameras/ohio/index.html` and others): the sponsor
slot is a static `<aside>` block sitting directly in each page's HTML — not driven by
`data/sponsor-pages.json` (that file is just a bookkeeping manifest for other tooling,
not what renders on the page). Turning a slot on means editing that one page's HTML
directly. No script run, no generator, no risk to other pages.

## What's on the page right now (the "house" placeholder)

```html
<aside class="spon spon-house" id="spon" data-slot="cameras:ohio" data-sponsor="house" aria-label="Sponsor">
  <img class="spon-roy" src="/images/sponsors/roy-sponsor.png" width="276" height="235" alt="" loading="lazy" decoding="async">
  <a class="spon-body" href="/sponsor/" data-spon-link>
    <span class="spon-text"><strong>Sponsor this page.</strong></span>
    <span class="spon-cta">Ask about it →</span>
  </a>
</aside>
```

## What it becomes for a real sponsor

```html
<aside class="spon" id="spon" data-slot="cameras:ohio" data-sponsor="<SLUG>" aria-label="Sponsor">
  <span class="spon-tag">Sponsor</span>
  <a class="spon-body" href="<THEIR URL>" data-spon-link target="_blank" rel="noopener sponsored">
    <img class="spon-logo" src="/images/sponsors/<SLUG>.png" alt="<BUSINESS NAME>" width="132" height="36" loading="lazy" decoding="async">
    <span class="spon-text"><strong><BUSINESS NAME></strong> — <ONE LINE, ~60-80 CHARS>.</span>
    <span class="spon-cta"><CTA, ≤30 CHARS> →</span>
  </a>
</aside>
```

Five things to fill in, nothing else changes:
1. **`<SLUG>`** — a short lowercase id (`rustys-towing`) — used twice, in `data-sponsor` and the logo filename. This is what the existing analytics beacon script (already on the page, unchanged) reports against, so it needs to be a real, stable identifier, never "house" or "preview".
2. **`<BUSINESS NAME>`**
3. **`<ONE LINE>`** — what they do, in their own words, real not filler
4. **`<THEIR URL>`** — where the click should go
5. **A logo file** — ask them for one when they say yes (PNG, transparent background if possible, roughly 132×36px @1x / 264×72px @2x). Save it at `/images/sponsors/<slug>.png`. Nothing else works without this — don't ship a placeholder logo box; wait for a real one.

Nothing else on the page needs to change. The impression/click tracking script already
on every page reads `data-slot` and `data-sponsor` live from the DOM — it doesn't care
that the content changed, so no script edit, no rebuild, no risk to any other page.

## Exact file + data-slot for each prospect already in the tracker

| Business | File to edit | `data-slot` value (already correct, don't change) |
|---|---|---|
| Rusty's Towing Service | `cameras/ohio/index.html` | `cameras:ohio` |
| Atlanta Diesel Works | `cameras/atlanta/index.html` | `cameras:atlanta` |
| Hillside Tire & Service | `passes/little-cottonwood/index.html` | `pass:little-cottonwood` |
| ATX Towing | `corridors/i-35/index.html` | `corridor:i-35` |
| A Tow Atlanta | `corridors/i-20/index.html` | `corridor:i-20` |
| Knoxville Towing and Recovery | `corridors/i-40/index.html` | `corridor:i-40` |
| Blue Ridge Wrecker Service LLC | `corridors/i-81/index.html` | `corridor:i-81` |
| Superior Towing Inc. | `passes/anthony-lakes/index.html` | `pass:anthony-lakes` |
| Cade Towing | `corridors/i-65/index.html` | `corridor:i-65` |

Every page listed already has this exact `<aside class="spon spon-house" ...>` block
verified in place — nothing to hunt for when the moment comes.

## When it happens

Tell me who said yes and I'll make the edit — it's the five fields above, on one file,
nothing else touched. Should take under a minute once you have their logo and their
one-line copy.
