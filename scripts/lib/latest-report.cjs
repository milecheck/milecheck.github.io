'use strict';
// The newest Monthly Highway Report, by the `month` field inside data/road-report-<month>-<year>.json.
// One place, so a new month takes over without a code change (same rule as add-signup-band.mjs).
// Run from the site root, as every generator here is.
const fs = require('fs');
const path = require('path');

function latestReport(dataDir = 'data') {
  const rows = fs.readdirSync(dataDir)
    .filter((f) => /^road-report-[a-z]+-\d{4}\.json$/.test(f))
    .map((f) => ({ f, m: JSON.parse(fs.readFileSync(path.join(dataDir, f), 'utf8')).month || '' }))
    .sort((a, b) => b.m.localeCompare(a.m));
  if (!rows.length) throw new Error('no data/road-report-<month>-<year>.json found');
  const slug = rows[0].f.replace(/^road-report-|\.json$/g, '');
  const monthName = slug.split('-')[0].replace(/^./, (c) => c.toUpperCase());
  return { slug, monthName, href: `/blog/road-report-${slug}.html` };
}

function signupSub(dataDir = 'data') {
  const r = latestReport(dataDir);
  return `Your state's reported closures, crashes and roadwork, once a month by email. <a href="${r.href}">See the ${r.monthName} report</a>. No spam.`;
}

module.exports = { latestReport, signupSub };
