#!/bin/zsh
# Pulls incident-lifecycle month files from R2 (mirror-feeds) into milecheck.github.io/.cache/lifecycle/ for
# gen-clearance-times.mjs. Run from the app repo root with CLOUDFLARE_API_TOKEN set (month-end routine).
cd "${0:A:h}/../.." || exit 1
mkdir -p milecheck.github.io/.cache/lifecycle
for st in AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY BC; do
  for m in "$@"; do
    npx wrangler r2 object get "mirror-feeds/incident-lifecycle/$st/$m.jsonl" --file "milecheck.github.io/.cache/lifecycle/$st-$m.jsonl" --remote >/dev/null 2>&1 || rm -f "milecheck.github.io/.cache/lifecycle/$st-$m.jsonl"
    # Month files roll over at 8 MB (10/29): <m>.2.jsonl, <m>.3.jsonl ... hold the later rows. Stop at the first gap.
    for p in 2 3 4 5 6 7 8 9 10 11 12; do
      npx wrangler r2 object get "mirror-feeds/incident-lifecycle/$st/$m.$p.jsonl" --file "milecheck.github.io/.cache/lifecycle/$st-$m.$p.jsonl" --remote >/dev/null 2>&1 || { rm -f "milecheck.github.io/.cache/lifecycle/$st-$m.$p.jsonl"; break; }
    done
  done
done
ls milecheck.github.io/.cache/lifecycle | wc -l
