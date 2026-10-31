#!/usr/bin/env node
// check-mediavine.mjs — fails (exit 1) if any page carries the wrong Mediavine markup for
// what data/ad-pages.json says. Last step of finish-pages; run before every push.
//   node scripts/check-mediavine.mjs          # every built file
//   node scripts/check-mediavine.mjs --live   # liveSamples plus every 25th page on https://milecheckapp.com
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { markContent, stripContent, countMarks } from './lib/content-container.mjs';
import { loadConfig, classify, scriptTag, blockDiv, pages, hasPrivacyAnchor, needsPrivacy, stripComments,
  TAG_RE, BLOCK_RE, PRIV_RE, OLD_PRIVACY_RE, BLOCK_ID_RE } from './lib/mediavine.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const LIVE = process.argv.includes('--live');
const c = loadConfig(ROOT); // throws if enabled with no siteId
const bad = [];
const count = (s, re) => (s.match(re) || []).length;

async function read(rel, file) {
  if (!LIVE) return readFileSync(file, 'utf8');
  const r = await fetch('https://milecheckapp.com/' + rel.replace(/index\.html$/, ''), { headers: { 'user-agent': 'Mozilla/5.0 MileCheck-ad-check' } });
  return r.ok ? r.text() : null;
}

// Is offset `at` inside an open <header>, <footer>, <nav> or <aside>? (Blocklists must sit in content.)
function inChrome(html, at) {
  const before = stripComments(html.slice(0, at)).toLowerCase();
  return ['header', 'footer', 'nav', 'aside'].some((t) => count(before, new RegExp(`<${t}[\\s>]`, 'g')) > count(before, new RegExp(`</${t}>`, 'g')));
}

const list = pages(ROOT);
const sample = LIVE ? list.filter((p, i) => i % 25 === 0 || (c.liveSamples || []).includes(p.rel)) : list;
for (const { file, rel } of sample) {
  const html = await read(rel, file);
  if (html == null) { bad.push(`${rel}: not reachable`); continue; }
  const adsOff = html.replace(TAG_RE, '').replace(BLOCK_RE, '');
  const bare = stripContent(adsOff.replace(PRIV_RE, ''));
  const scope = classify(rel, bare, c);
  const kind = c.enabled ? scope : 'none';
  const tags = count(html, TAG_RE), raw = count(html, /(?:scripts\.mediavine\.com|scriptwrapper\.com)\/tags\//g);
  const blocks = count(html, BLOCK_ID_RE); BLOCK_ID_RE.lastIndex = 0; // marked or not
  const marks = countMarks(html);

  if (count(html, OLD_PRIVACY_RE)) bad.push(`${rel}: still links the github.io privacy URL`);
  if (needsPrivacy(rel, html, c) && !hasPrivacyAnchor(html)) bad.push(`${rel}: no clickable privacy policy link`);

  if (kind === 'none' || kind === 'all') { if (marks) bad.push(`${rel}: journey-content on a page without in-content ads`); }
  else if (marks > 1) bad.push(`${rel}: journey-content ${marks} times`);
  else if (!LIVE && markContent(bare).html !== adsOff.replace(PRIV_RE, '')) bad.push(`${rel}: journey-content missing or not on the direct parent of the paragraphs`);

  if (kind === 'none') { if (tags || raw || blocks) bad.push(`${rel}: should carry no ad markup (script ${raw}, blocklist ${blocks})`); continue; }
  if (tags !== 1 || raw !== 1 || !html.includes(scriptTag(c.siteId).trim())) bad.push(`${rel}: needs exactly one script tag (has ${raw})`);
  const want = blockDiv(kind, c);
  if (!want) { if (blocks) bad.push(`${rel}: has a blocklist but should show every ad`); continue; }
  if (blocks !== 1 || !html.includes(want)) bad.push(`${rel}: wrong blocklist for '${kind}' (has ${blocks})`);
  else if (inChrome(html, html.indexOf(want))) bad.push(`${rel}: blocklist sits inside a header, footer, nav or sidebar`);
}

// Expected content containers for representative pages, so a scanner change that picks the
// wrong element (a map panel, a live data box) fails here instead of shipping.
if (!LIVE && c.enabled) for (const [rel, cls] of Object.entries(c.contentExpect || {})) {
  if (!existsSync(resolve(ROOT, rel))) { bad.push(`contentExpect: ${rel} missing`); continue; }
  const html = readFileSync(resolve(ROOT, rel), 'utf8');
  const tag = (html.match(/<[a-z][a-z0-9]*\s[^>]*\bjourney-content\b[^>]*>/i) || [''])[0];
  if (cls === null ? tag : !new RegExp(`class="[^"]*\\b${cls}\\b`).test(tag)) bad.push(`contentExpect: ${rel} has journey-content on ${tag || 'nothing'}, expected ${cls ?? 'none'}`);
}

// ads.txt must carry every seller line Journey requires (adsTxtRequired, copied from the
// dashboard at onboarding), parsed record by record. Extra valid lines are allowed.
const records = (t) => new Set(t.split(/\r?\n/).map((l) => l.replace(/#.*/, '').trim()).filter(Boolean)
  .map((l) => l.split(',').slice(0, 3).map((x) => x.trim().toLowerCase()).join(',')));
function checkAdsTxt(text, where) {
  if (/<html/i.test(text)) return bad.push(`${where}: ads.txt is an HTML page`);
  const req = c.adsTxtRequired || [];
  if (!req.length) return bad.push('adsTxtRequired is empty: copy the required seller lines from the Journey dashboard into data/ad-pages.json');
  const have = records(text);
  for (const line of req) { const k = [...records(line)][0]; if (!have.has(k)) bad.push(`${where}: ads.txt missing required line "${line}"`); }
}
if (c.enabled && !LIVE) {
  const p = resolve(ROOT, 'ads.txt');
  checkAdsTxt(existsSync(p) ? readFileSync(p, 'utf8') : '', 'local');
}
if (c.enabled && LIVE) {
  const r = await fetch('https://milecheckapp.com/ads.txt');
  if (!r.ok) bad.push(`live /ads.txt: HTTP ${r.status}`); else checkAdsTxt(await r.text(), 'live');
}
if (bad.length) { console.error(`Mediavine check FAILED (${bad.length}):\n` + bad.slice(0, 40).join('\n')); process.exit(1); }
console.log(`Mediavine check OK: ${sample.length} pages${LIVE ? ' (live sample)' : ''}, ads ${c.enabled ? 'on' : 'off'}.`);
