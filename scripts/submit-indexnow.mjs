#!/usr/bin/env node
// Notify IndexNow about public HTML changed in a deployed git range. Dry-run is the default.
// node scripts/submit-indexnow.mjs --from HEAD^ --to HEAD
// Add --submit only after that range is live. The public key file must already be accessible.
// Protocol: https://www.indexnow.org/documentation and https://www.indexnow.org/faq
// Acceptance means received, not indexed. No credentials, packages, sitemap blasts or retries.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const HOST = 'milecheckapp.com';
export const ENDPOINT = 'https://api.indexnow.org/indexnow';
export const MAX_BATCH = 10000;
const DEFAULT_ROOT = fileURLToPath(new URL('../', import.meta.url));
const SHA = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/;

function git(root, args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'] });
}

export function resolveCommit(root, ref) {
  if (typeof ref !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._/@^~{}-]*$/.test(ref))
    throw new Error('Provide a valid commit ref for --from and --to.');
  let sha;
  try { sha = git(root, ['rev-parse', '--verify', '--end-of-options', `${ref}^{commit}`]).trim(); }
  catch { throw new Error(`Commit ref not found: ${ref}`); }
  if (!SHA.test(sha)) throw new Error(`Invalid commit resolved from ${ref}`);
  return sha;
}

export function readConfig(root = DEFAULT_ROOT) {
  const cname = readFileSync(resolve(root, 'CNAME'), 'utf8').trim();
  const config = JSON.parse(readFileSync(resolve(root, 'data/indexnow.json'), 'utf8'));
  if (cname !== HOST || config.host !== HOST || config.endpoint !== ENDPOINT)
    throw new Error('IndexNow host/endpoint must match milecheckapp.com and the official global endpoint.');
  if (!/^[a-f0-9]{32}$/.test(config.key)) throw new Error('Invalid public IndexNow key.');
  if (config.keyLocation !== `https://${HOST}/${config.key}.txt`)
    throw new Error('IndexNow keyLocation must be the public root key file.');
  if (readFileSync(resolve(root, `${config.key}.txt`), 'utf8').trim() !== config.key)
    throw new Error('The public key verification file does not match data/indexnow.json.');
  return config;
}

export function publicHtmlPath(file) {
  if (typeof file !== 'string' || !file.endsWith('.html') || /[\\\x00-\x1f?#%]/.test(file)) return false;
  const parts = file.split('/');
  if (parts.some(p => !p || p === '..' || /^[._]/.test(p) ||
    /^(?:private|internal|design)(?:[-_.]|$)/i.test(p))) return false;
  if (parts.some(p => /^(?:boards|work|outputs|scripts|docs|assets|data|tests|node_modules|or-family|search)$/i.test(p))) return false;
  return !/^(?:404|search|google[a-f0-9]+)\.html$/i.test(file);
}

function blob(root, sha, file) {
  const entry = git(root, ['ls-tree', '-z', sha, '--', file]);
  if (!entry) return null;
  const match = /^(100644|100755) blob ([a-f0-9]{40,64})\t([^\0]+)\0$/.exec(entry);
  if (!match || match[3] !== file) return null; // Do not follow symlinks or directories.
  return git(root, ['cat-file', 'blob', match[2]]);
}

function attributes(tag) {
  const values = {};
  for (const m of tag.matchAll(/([a-z][a-z0-9:-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi))
    values[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4];
  return values;
}

export function isIndexableHtml(html) {
  if (typeof html !== 'string' || !/<(?:!doctype\s+html|html|head|body)\b/i.test(html)) return false;
  const uncommented = html.replace(/<!--[\s\S]*?-->/g, '');
  for (const [tag] of uncommented.matchAll(/<meta\b[^>]*>/gi)) {
    const attr = attributes(tag);
    if (/^(?:robots|googlebot|bingbot)$/i.test(attr.name || '') && /\b(?:noindex|none)\b/i.test(attr.content || '')) return false;
  }
  return true;
}

export function changedUrls({ root = DEFAULT_ROOT, from, to }) {
  const fromSha = resolveCommit(root, from), toSha = resolveCommit(root, to);
  try { git(root, ['merge-base', '--is-ancestor', fromSha, toSha]); }
  catch { throw new Error('--from must be an ancestor of --to.'); }
  const diff = git(root, ['diff', '--name-status', '-z', '--no-renames', '--diff-filter=ADM', fromSha, toSha, '--']);
  const fields = diff.split('\0');
  if (fields.at(-1) === '') fields.pop();
  if (fields.length % 2) throw new Error('Malformed git diff output.');
  const urls = new Set();
  for (let i = 0; i < fields.length; i += 2) {
    const [status, file] = fields.slice(i, i + 2);
    if (!/^[ADM]$/.test(status)) throw new Error('Unexpected git change status.');
    if (!publicHtmlPath(file)) continue;
    const html = blob(root, status === 'D' ? fromSha : toSha, file);
    if (!isIndexableHtml(html)) continue;
    if (status === 'D' && blob(root, toSha, file) !== null) continue;
    const pathname = '/' + file.split('/').map(encodeURIComponent).join('/').replace(/(?:^|\/)index\.html$/, '/').replace(/^\//, '');
    urls.add(`https://${HOST}${pathname}`);
  }
  return { from: fromSha, to: toSha, urls: [...urls].sort() };
}

export function batches(config, urls) {
  const unique = [...new Set(urls)];
  for (const value of unique) {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.host !== HOST || url.username || url.password || url.search || url.hash)
      throw new Error('IndexNow URLs must be public HTTPS pages on milecheckapp.com.');
  }
  const result = [];
  for (let i = 0; i < unique.length; i += MAX_BATCH)
    result.push({ host: config.host, key: config.key, keyLocation: config.keyLocation, urlList: unique.slice(i, i + MAX_BATCH) });
  return result;
}

async function request(fetchImpl, url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, { ...options, redirect: 'error', signal: controller.signal });
    if (!response || !Number.isInteger(response.status) || typeof response.text !== 'function')
      throw new Error('Malformed HTTP response.');
    const text = await response.text();
    if (typeof text !== 'string') throw new Error('Malformed HTTP response body.');
    return { status: response.status, text: text.trim() };
  } catch (error) {
    if (controller.signal.aborted) throw new Error(`IndexNow request timed out after ${timeoutMs} ms.`);
    throw error;
  } finally { clearTimeout(timer); }
}

export async function submitUrls({ config, urls, fetchImpl = globalThis.fetch, timeoutMs = 15000 }) {
  const payloads = batches(config, urls);
  if (!payloads.length) return [];
  // Deploy the verification file first. Never POST if the live key is missing or stale.
  const key = await request(fetchImpl, config.keyLocation, { method: 'GET' }, timeoutMs);
  if (key.status !== 200 || key.text !== config.key) throw new Error(`Live IndexNow key verification failed (HTTP ${key.status}).`);
  const results = [];
  for (const payload of payloads) {
    const response = await request(fetchImpl, ENDPOINT, {
      method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' }, body: JSON.stringify(payload),
    }, timeoutMs);
    if (response.status !== 200 && response.status !== 202)
      throw new Error(`IndexNow returned HTTP ${response.status}: ${response.text.slice(0, 300)}`);
    // The protocol documents HTTP status, not a JSON success schema. Do not treat an
    // HTML error page or arbitrary/malformed JSON behind HTTP 200 as acceptance.
    if (response.text && response.text !== (response.status === 200 ? 'OK' : 'Accepted'))
      throw new Error(`Unexpected IndexNow response body for HTTP ${response.status}.`);
    results.push({ status: response.status, result: response.status === 200 ? 'received' : 'key-validation-pending', urls: payload.urlList.length });
  }
  return results;
}

export function parseArgs(args) {
  const options = { submit: false };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--submit') options.submit = true;
    else if (arg === '--dry-run') options.submit = false;
    else if (arg === '--help') options.help = true;
    else if (arg === '--from' || arg === '--to') {
      if (!args[i + 1] || args[i + 1].startsWith('--')) throw new Error(`${arg} needs a commit ref.`);
      options[arg.slice(2)] = args[++i];
    } else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!options.help && (!options.from || !options.to)) throw new Error('Both --from and --to are required. Default mode is dry-run.');
  return options;
}

export async function run(options, { root = DEFAULT_ROOT, fetchImpl = globalThis.fetch } = {}) {
  const config = readConfig(root), changed = changedUrls({ root, from: options.from, to: options.to });
  const payloads = batches(config, changed.urls);
  const report = { mode: options.submit ? 'submit' : 'dry-run', ...changed, batches: payloads.length,
    keyLocation: config.keyLocation, note: 'Receipt does not guarantee crawling, indexing or search traffic.' };
  if (options.submit) report.responses = await submitUrls({ config, urls: changed.urls, fetchImpl });
  return report;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) console.log('node scripts/submit-indexnow.mjs --from <deployed-parent> --to <deployed-commit> [--submit]\nDefault is dry-run. Use --submit only after the selected range is live.');
    else console.log(JSON.stringify(await run(options), null, 2));
  } catch (error) { console.error(`IndexNow: ${error.message}`); process.exitCode = 1; }
}
