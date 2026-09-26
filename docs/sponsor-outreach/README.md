# Sponsor outreach — index (saved 2026-09-26/27)

Everything needed to run the website-sponsor outreach campaign, consolidated here so a
different session can pick it up without re-deriving context. Start with
`sponsor-call-sheet.csv` — it's the live tracker; everything else is reference.

## Files, in the order you'd actually use them

1. **`sponsor-call-sheet.csv`** — the tracker. Every prospect found so far (business,
   contact, page/topic, tier, price quoted, status, corridor-board geography, first-option
   contacted/date). Update `Status` as each email goes out and each reply comes in — this
   is the source of truth, not any of the files below.
2. **`03-wave1-emails-ready-to-send.md`**, **`04-wave2-emails-ready-to-send.md`**,
   **`05-wave3-emails-ready-to-send.md`** — fully drafted, ready-to-paste cold emails for
   the prospects with a verified real email address. Format locked in after review: one
   concrete offer only (no nationwide-tier mention), "planned" corridor-board screens
   (zero installs exist yet — don't overstate), founder framing ("I'm Leah, founder of
   MileCheck"), a business-specific reason for the outreach, $49/month single-page
   founding rate.
3. **`06-activate-sponsor-runbook.md`** — what to actually do the moment someone says
   yes. The sponsor slot is a static HTML block on each page (NOT driven by
   `data/sponsor-pages.json`, which is just a bookkeeping manifest for other tooling).
   Verified exact markup, five fields to fill in, and all 9 prospects already mapped to
   their exact file + `data-slot` value. Should take under a minute once you have the
   sponsor's logo and one-line copy.
4. **`01-wave1-template-and-prospects.md`** — the original outreach template + pricing
   rationale (superseded in structure by the wave files above, kept for the reasoning).
5. **`02-corridor-board-venue-template.md`** — the free-install ask for the OTHER
   monetization lever (physical screens at real-world venues, distinct from website
   sponsorship). Two-step sequence: free venue install first, sponsor pitch on that
   screen second.
6. **`07-corridor-boards-venue-finding.md`** — a real strategic correction: interstate
   truck stops are the wrong target for the venue ask (all corporate chains — Pilot/
   Love's/TA/Petro — need corporate approval, killing the "easy free yes" premise). The
   boards that already exist (Issaquah, Blaine, Ballard) are all at destination
   bottlenecks (a pass, a border crossing), not generic interstate exits. Read this
   before doing more venue outreach.
7. **`one-pager-source/`** — the raw source (`canvas.json` + `Main.dc.html`) behind the
   sponsor media kit. The live, viewable version is the Claude Artifact at
   `https://claude.ai/artifact/1ST56Xqbn4Eo7r2K1KHZKR` (private; share it from the page's
   Share menu if it needs to go to a prospect directly). This folder is a backup of the
   source only — it won't render as a page from the repo; open the artifact link instead.

## Pricing (not published anywhere public — the live `/sponsor/` page stays "email for
pricing" on purpose)

Two tiers, tested prospect-by-prospect rather than fixed: **$49/month single page**
(the one being led with in every cold email — the natural, low-friction offer for a
local business), **$99/month full topic family, nationwide** (mentioned only as a
follow-up after someone says yes to the single-page offer, never in the first email).
Both month-to-month, cancel anytime, explicitly a "founding rate" while the program has
zero sponsors and zero case studies — the goal of sale #1 is proof, not the eventual
market rate.

Every website sponsor also gets first option on MileCheck's *planned* corridor-board
advertising in their area before it's opened publicly — defined internally as first
opportunity to buy, not a guaranteed price or contractual right. Never spell out more
than that to a prospect.

## Related, elsewhere in this repo

- `docs/fable-handoff-2026-09-26.md` — the broader session handoff: what's uncommitted
  site-wide, the known conflict with a parallel patch effort, and the affiliate-links
  TODO. Different scope from this folder (site code/content vs. sales outreach) — read
  both, they don't overlap much.
- `docs/sponsor-prospect-research-2026-09-27.md` — the full 20-prospect research batch
  (Leah's ChatGPT research, preserved verbatim-ish) that fed the newer rows in the call
  sheet above.
