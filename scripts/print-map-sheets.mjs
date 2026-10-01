#!/usr/bin/env node
// print-map-sheets.mjs — render each map sheet page to the PDF it links to.
//
//   node scripts/print-map-sheets.mjs               # every sheet
//   node scripts/print-map-sheets.mjs snoqualmie    # one
//
// Safari prints a live map badly, and most people who want a paper map want a file
// they can send to a printer. So the PDF is made here, in Chrome, and committed next
// to the page. Serves the repo on a local port, opens each page in headless Chrome,
// waits for window.sheetReady (tiles loaded, text fitted), and prints two pages.
// Needs Google Chrome installed. No npm packages.
import http from 'node:http';
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdtempSync, mkdirSync, rmSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { PASSES, AREAS } = require('./gen-pass-pages.js');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const only = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json' };

// The base map tiles come down as PNG, about 35 KB each, and a sheet holds 40 of them.
// Served from here as JPEG they are under half of that, and Chrome puts a JPEG into the PDF
// as it is. Kept in the system temp folder so a second run does not fetch them again.
const TILE_DIR = path.join(tmpdir(), 'milecheck-map-tiles');
const TILE_Q = 74;
mkdirSync(TILE_DIR, { recursive: true });
async function tile(z, y, x) {
  const jpg = path.join(TILE_DIR, `${z}-${y}-${x}-q${TILE_Q}.jpg`);
  if (existsSync(jpg)) return readFileSync(jpg);
  const res = await fetch(`https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/${z}/${y}/${x}`, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error('tile ' + res.status);
  const png = path.join(TILE_DIR, `${z}-${y}-${x}.png`);
  writeFileSync(png, Buffer.from(await res.arrayBuffer()));
  execFileSync('python3', ['-c', 'import sys\nfrom PIL import Image\nImage.open(sys.argv[1]).convert("RGB").save(sys.argv[2], "JPEG", quality=int(sys.argv[3]), optimize=True)', png, jpg, String(TILE_Q)]);
  rmSync(png, { force: true });
  return readFileSync(jpg);
}

const server = http.createServer(async (req, res) => {
  let rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const t = rel.match(/^\/__tiles\/(\d+)\/(\d+)\/(\d+)$/);
  if (t) {
    try { const body = await tile(t[1], t[2], t[3]); res.writeHead(200, { 'Content-Type': 'image/jpeg' }); res.end(body); }
    catch { res.writeHead(502); res.end(); }
    return;
  }
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.join(ROOT, rel);
  if (!file.startsWith(ROOT) || !existsSync(file) || statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  res.end(readFileSync(file));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

const profile = mkdtempSync(path.join(tmpdir(), 'map-sheets-'));
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--remote-debugging-port=0', '--user-data-dir=' + profile, '--window-size=1200,900', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
const wsUrl = await new Promise((resolve, reject) => {
  let buf = '';
  chrome.stderr.on('data', (c) => { buf += c; const m = buf.match(/DevTools listening on (ws:\/\/\S+)/); if (m) resolve(m[1]); });
  chrome.on('exit', () => reject(new Error('Chrome exited before it was ready')));
  setTimeout(() => reject(new Error('Chrome did not start in 30 s')), 30000);
});

const ws = new WebSocket(wsUrl);
await new Promise((r, j) => { ws.onopen = r; ws.onerror = () => j(new Error('could not reach Chrome')); });
let seq = 0;
const pending = new Map(), waiters = [];
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { const { resolve, reject } = pending.get(m.id); pending.delete(m.id); m.error ? reject(new Error(m.error.message)) : resolve(m.result); return; }
  for (let i = waiters.length - 1; i >= 0; i--) if (waiters[i].method === m.method && waiters[i].sessionId === m.sessionId) { waiters[i].resolve(m.params); waiters.splice(i, 1); }
};
const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => { const id = ++seq; pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params, sessionId })); });
const once = (method, sessionId, ms = 60000) => new Promise((resolve, reject) => { waiters.push({ method, sessionId, resolve }); setTimeout(() => reject(new Error('timed out waiting for ' + method)), ms); });

let n = 0, failed = 0;
try {
  for (const p of [...PASSES, ...AREAS]) {
    if (only.length && !only.includes(p.slug)) continue;
    const dir = path.join(p.out || path.join('passes', p.slug), 'map');
    if (!existsSync(path.join(ROOT, dir, 'index.html'))) { console.error('skip ' + p.slug + ': no map page. Run gen-map-sheets.mjs first.'); failed++; continue; }
    const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
    try {
      await send('Page.enable', {}, sessionId);
      await send('Page.addScriptToEvaluateOnNewDocument', { source: `window.SHEET_TILES='http://127.0.0.1:${port}/__tiles/{z}/{y}/{x}';` }, sessionId);
      const loaded = once('Page.loadEventFired', sessionId);
      await send('Page.navigate', { url: `http://127.0.0.1:${port}/${dir}/` }, sessionId);
      await loaded;
      const ready = await send('Runtime.evaluate', { expression: 'Promise.resolve(window.sheetReady).then(()=>({tiles:document.querySelectorAll(".leaflet-tile-loaded").length,missing:document.querySelectorAll(".leaflet-tile:not(.leaflet-tile-loaded)").length}))', awaitPromise: true, returnByValue: true }, sessionId);
      const t = ready.result.value || {};
      const { data } = await send('Page.printToPDF', { landscape: true, printBackground: true, preferCSSPageSize: true, marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0 }, sessionId);
      const out = path.join(ROOT, dir, p.slug + '-map.pdf');
      writeFileSync(out, Buffer.from(data, 'base64'));
      n++;
      console.log('wrote ' + path.join(dir, p.slug + '-map.pdf') + '  (' + Math.round(statSync(out).size / 1024) + ' KB, ' + t.tiles + ' tiles' + (t.missing ? ', ' + t.missing + ' MISSING' : '') + ')');
      if (t.missing) failed++;
    } catch (e) { failed++; console.error('FAILED ' + p.slug + ': ' + e.message); }
    await send('Target.closeTarget', { targetId });
  }
} finally {
  ws.close(); chrome.kill(); server.close();
  await new Promise((r) => setTimeout(r, 500));
  try { rmSync(profile, { recursive: true, force: true }); } catch {}
}
console.log('\nPrinted ' + n + ' PDF' + (n === 1 ? '' : 's') + (failed ? ', ' + failed + ' with problems.' : '.'));
process.exit(failed ? 1 : 0);
