#!/usr/bin/env node
/**
 * Inject the Cloudflare Web Analytics beacon into every .html page.
 * Usage:  node scripts/inject-analytics.js "<TOKEN>"
 *   <TOKEN> = the value inside data-cf-beacon='{"token":"..."}' from the
 *   Cloudflare Web Analytics dashboard (Add a site → milecheckapp.com → copy snippet).
 *
 * Idempotent: skips any file that already has the beacon. Safe to re-run
 * (e.g. after new blog/corridor pages are generated).
 * Privacy-first: Cloudflare Web Analytics uses no cookies — no consent banner needed.
 */
const fs = require('fs');
const path = require('path');

const token = process.argv[2];
if (!token || token.length < 8) {
  console.error('ERROR: pass the Cloudflare beacon token.\n  node scripts/inject-analytics.js "<TOKEN>"');
  process.exit(1);
}

const BEACON = `<!-- Cloudflare Web Analytics --><script type="module" src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token": "${token}"}'></script><!-- End Cloudflare Web Analytics -->`;
const ROOT = path.resolve(__dirname, '..');
const SKIP_DIRS = new Set(['node_modules', '.git', 'scripts']);

let injected = 0, skipped = 0, nohead = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(path.join(dir, entry.name));
    } else if (entry.name.endsWith('.html')) {
      const file = path.join(dir, entry.name);
      let html = fs.readFileSync(file, 'utf8');
      if (html.includes('static.cloudflareinsights.com/beacon.min.js')) { skipped++; continue; }
      const idx = html.lastIndexOf('</head>');
      if (idx === -1) { nohead++; continue; }
      html = html.slice(0, idx) + '  ' + BEACON + '\n' + html.slice(idx);
      fs.writeFileSync(file, html);
      injected++;
    }
  }
}

walk(ROOT);
console.log(`Cloudflare Web Analytics beacon:`);
console.log(`  injected into ${injected} pages`);
console.log(`  skipped ${skipped} (already had it)`);
if (nohead) console.log(`  ${nohead} file(s) had no </head> — check manually`);
