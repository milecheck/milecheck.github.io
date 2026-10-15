#!/usr/bin/env node
// Canonical public-page header. Run after generators and all other header add-ons.
// --check audits without writing. No generator, body rewrite or analytics changes.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
const { activeSection } = require('../assets/site-nav.js');
const ROOT = fileURLToPath(new URL('../', import.meta.url));
const VERSION = '20261015-1';
export const LINKS = [
  ['home', 'Home', '/'], ['maps', 'Maps', '/maps/'], ['cameras', 'Cameras', '/cameras/'],
  ['states', 'United States', '/states/'], ['canada', 'Canada', '/canada/'], ['story', 'Story', '/#story'],
  ['b2b', 'B2B', '/partners/'], ['pricing', 'Pricing', '/#pricing'], ['blog', 'Blog', '/blog/'],
  ['search', 'Search', '/search/'], ['get', 'Get the app', '/get/'],
];
const I75 = new Set(['florida', 'georgia', 'kentucky', 'michigan', 'ohio', 'tennessee']);
const HEADER = /(?:<!-- site-nav:header -->\s*)?<header\b(?=[^>]*\bclass=["'][^"']*\b(?:site-header|mc-site-header)\b)[^>]*>[\s\S]*?<\/header>(?:\s*<!-- \/site-nav:header -->)?/g;
const ASSETS = /[ \t]*<!-- site-nav:assets -->[\s\S]*?<!-- \/site-nav:assets -->\n?/g;
const LEGACY = [
  "document.querySelector('.nav-toggle').addEventListener('click',function(){document.querySelector('.primary-nav').classList.toggle('open');});",
  "document.querySelector('.nav-toggle').addEventListener('click',()=>document.querySelector('.primary-nav').classList.toggle('open'));",
];

export function exclusion(file, html = '') {
  if (file.split('/').some(p => p.startsWith('.') || /^(?:node_modules|scripts|assets|data|images|video|docs|work|outputs|boards|admin|internal|private|or-family|experimental|experiments|design-options|previews|drafts)$/.test(p))) return 'private or support path';
  if (file.split('/').some(p => /^(?:admin|internal|private)(?:[-_.]|$)/.test(p))) return 'private or support path';
  if (/(?:preview|v1-classic|experimental|experiment|draft)/i.test(file) || /^google[a-f0-9]+\.html$/.test(file)) return 'preview or verification';
  if (/^(?:passes|mountain-roads|enchantments-roads)\//.test(file)) return 'held road-status family';
  if (/^mountains\/[^/]+\/roads\//.test(file) || /^enchantments\/roads\//.test(file)) return 'held road-status family';
  if (file.startsWith('corridors/') && file !== 'corridors/index.html') {
    const m = /^corridors\/i-75\/([^/]+)\/index\.html$/.exec(file);
    if (!m || !I75.has(m[1])) return 'held corridor family';
  }
  if (file === 'what-mile-marker-am-i-at/index.html') return 'focused standalone tool';
  if (file !== 'search/index.html' && file !== '404.html' && /<meta\b[^>]*(?:noindex|content=["']none["'])/i.test(html)) return 'nonindexable page';
  return '';
}

export function headerPartial(file, options = {}) {
  const pathname = '/' + file.replace(/index\.html$/, '');
  const active = activeSection(pathname, '');
  const home = file === 'index.html';
  const links = LINKS.map(([key, label, href]) => {
    const current = active === key ? ' aria-current="page"' : '';
    const tab = home && ['home', 'story', 'pricing'].includes(key) ? ` data-tab="${key === 'story' ? 'story' : 'home'}"${key === 'pricing' ? ' data-goto="pricing"' : ''}` : '';
    const modal = key === 'get' && options.downloadModal ? ' data-dl' : '';
    const cls = key === 'get' ? ' class="mc-nav-cta"' : key === 'search' ? ' class="mc-nav-search"' : '';
    const text = key === 'search' ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4.5 4.5"/></svg><span>Search</span>' : label;
    return `        <a href="${href}" data-nav-link="${key}"${cls}${current}${tab}${modal}>${text}</a>`;
  }).join('\n');
  return `<!-- site-nav:header -->
  <header class="mc-site-header" data-site-nav="${VERSION}">
    <div class="mc-header-inner">
      <a href="/" class="mc-brand"${home ? ' data-tab="home"' : ''}><img src="/assets/app-icon-60.png" width="28" height="28" alt="">MileCheck</a>
      <button class="mc-nav-toggle" type="button" aria-label="Open navigation menu" aria-controls="mc-primary-nav" aria-expanded="false"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18"/></svg></button>
      <nav class="mc-primary-nav" id="mc-primary-nav" aria-label="Main navigation">
${links}
      </nav>
    </div>
  </header>
<!-- /site-nav:header -->`;
}

export function transformPage(html, file) {
  if (exclusion(file, html)) return html;
  const matches = [...html.matchAll(HEADER)];
  if (!matches.length) return html;
  if (matches.length !== 1) throw Error('Expected one site header in ' + file);
  const originalHeader = matches[0][0];
  const downloadModal = /\bdata-dl\b/.test(originalHeader) && /\bid=["']dlModal["']/.test(html);
  let result = html.replace(HEADER, () => headerPartial(file, { downloadModal })).replace(ASSETS, '');
  // These two audited statements dereference a missing old toggle after replacing
  // its header. Remove only that listener, including when it shares a map script.
  for (const listener of LEGACY) result = result.split(listener).join('');
  if (!/<\/head>/i.test(result)) throw Error('Missing head close in ' + file);
  const assets = `  <!-- site-nav:assets -->\n  <link rel="stylesheet" href="/assets/site-nav.css?v=${VERSION}">\n  <script src="/assets/site-nav.js?v=${VERSION}" defer></script>\n  <!-- /site-nav:assets -->\n`;
  return result.replace(/<\/head>/i, () => assets + '</head>');
}

export function processSite({ root = ROOT, write = false } = {}) {
  const report = { checked: 0, changed: [], excluded: [], noHeader: 0, noHeaderFiles: [] };
  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || entry.isSymbolicLink()) continue;
      const absolute = resolve(dir, entry.name), file = relative(root, absolute).split(sep).join('/');
      if (entry.isDirectory()) {
        // Do not open internal files to decide whether to process their headers.
        if (exclusion(file + '/index.html') === 'private or support path') continue;
        walk(absolute); continue;
      }
      if (!entry.name.endsWith('.html')) continue;
      const reason = exclusion(file);
      if (reason) { report.excluded.push({ file, reason }); continue; }
      const html = readFileSync(absolute, 'utf8'), contentReason = exclusion(file, html);
      if (contentReason) { report.excluded.push({ file, reason: contentReason }); continue; }
      if (!HEADER.test(html)) { HEADER.lastIndex = 0; report.noHeader++; report.noHeaderFiles.push(file); continue; } HEADER.lastIndex = 0;
      report.checked++;
      const next = transformPage(html, file);
      if (next !== html) { report.changed.push(file); if (write) writeFileSync(absolute, next); }
    }
  }
  walk(root); return report;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  if (args.some(a => a !== '--check' && a !== '--json')) throw Error('Use --check for an audit or no flag to apply canonical navigation.');
  const report = processSite({ write: !args.includes('--check') });
  if (args.includes('--json')) console.log(JSON.stringify(report, null, 2));
  else console.log(`Site navigation: ${report.changed.length} ${args.includes('--check') ? 'would update' : 'updated'}, ${report.checked} public headers checked; ${report.excluded.length} protected pages excluded, ${report.noHeader} pages have no shared header.`);
}
