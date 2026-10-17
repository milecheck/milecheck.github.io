#!/bin/zsh
# Runs on Leah's Mac every 6 hours (launchd, com.milecheck.dot-jobs). Workday blocks GitHub's runner IPs,
# so Oregon is fetched here. Pushes only data/dot-jobs.json and dot-jobs/index.html.
cd "$HOME/Developer/site-dot-jobs-wt" || exit 1
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
git pull -q --rebase origin main || exit 1
node scripts/gen-dot-jobs.mjs || echo "gen reported a source failure"
node scripts/finish-pages.mjs --pages-only >/dev/null 2>&1
git add data/dot-jobs.json dot-jobs/index.html
git diff --cached --quiet && exit 0
git -c user.name="milecheck-bot" -c user.email="info@milecheckapp.com" commit -q -m "DOT jobs refresh (Mac) $(date -u +%Y-%m-%dT%H:%MZ)"
git push -q origin HEAD:main
