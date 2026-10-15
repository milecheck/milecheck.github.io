const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '../..');
const generator = fs.readFileSync(path.join(root, 'scripts/gen-state-camera-pages.js'), 'utf8');
const florida = fs.readFileSync(path.join(root, 'cameras/florida/index.html'), 'utf8');
const streamPattern = /var hlsInst=null,hlsLoading=null[^\n]*\nfunction stopStream[^\n]*\nfunction playStream[^\n]*\n/;
const runtime = florida.match(streamPattern)[0];
const showCard = florida.match(/^function showCard[^\n]*$/m)[0];
const streamOffline = florida.match(/^function streamOffline[^\n]*$/m)[0];
const filterHook = florida.match(/\/\* camera-route:hook \*\/([\s\S]*?)\/\* \/camera-route:hook \*\//)[1];

// Exercise the shipped playback functions, close button and highway selector. Delay the
// actual loadHls script element's callbacks rather than replacing its promise logic.
function browser() {
  const scripts = [], instances = [], videos = [], offlineMessages = [];
  let context;
  function eventTarget() {
    return { listeners: {}, addEventListener(type, fn, options) {
      (this.listeners[type] ||= []).push({ fn, once: !!options?.once });
    }, emit(type) {
      for (const item of [...(this.listeners[type] || [])]) {
        if (item.once) this.listeners[type].splice(this.listeners[type].indexOf(item), 1);
        item.fn();
      }
    } };
  }
  function video() {
    const v = Object.assign(eventTarget(), { isConnected: true, sources: [], plays: 0, pauses: 0, loads: 0,
      play() { this.plays++; return this.playResult === 'undefined' ? undefined : Promise.resolve(); },
      pause() { this.pauses++; }, removeAttribute(name) { if (name === 'src') this.source = ''; },
      load() { this.loads++; }, replaceWith(node) {
        this.isConnected = false;
        if (card.video === this) card.video = null;
        offlineMessages.push(node.textContent);
      },
    });
    Object.defineProperty(v, 'src', { set(value) { this.sources.push(value); this.source = value; }, get() { return this.source || ''; } });
    videos.push(v); return v;
  }
  const close = {};
  const card = { style: { display: 'none' }, video: null, querySelector: () => close };
  Object.defineProperty(card, 'innerHTML', { set(value) {
    if (this.video) this.video.isConnected = false;
    this.video = value.includes('id="ccVid"') ? video() : null;
  } });
  const select = Object.assign(eventTarget(), { value: '', replaceChildren() {}, appendChild() {} });
  const note = {};
  const document = { getElementById(id) {
    return { coCard: card, ccVid: card.video, 'camera-route': select, 'camera-route-note': note }[id] || null;
  }, createElement: () => ({}), head: { appendChild(script) { scripts.push(script); } } };
  const sandbox = { document, DOT: 'DOT', URL, URLSearchParams, Promise, PLOWS: false,
    location: new URL('https://milecheckapp.com/cameras/florida/'),
    history: { replaceState(_state, _title, url) { sandbox.location = new URL(url); } },
    map: { fitBounds() {} }, draw() {},
  };
  sandbox.window = sandbox;
  context = vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(root, 'assets/camera-route-filter.js'), 'utf8'), context);
  vm.runInContext('const cardEl=document.getElementById("coCard");\n' + showCard + '\n' + runtime + streamOffline + '\n' + filterHook, context);
  vm.runInContext('cameraRouteFilter.loaded([{route:"I-75",lat:28,lon:-82},{route:"I-4",lat:28,lon:-81}]);', context);
  function library(supported = true) {
    class Hls {
      static isSupported() { return supported; }
      static Events = { MANIFEST_PARSED: 'manifest', ERROR: 'error' };
      constructor() { this.handlers = {}; this.destroyed = 0; instances.push(this); }
      loadSource(url) { this.url = url; }
      attachMedia(media) { this.video = media; }
      on(event, handler) { this.handlers[event] = handler; }
      emit(event, data) { this.handlers[event]?.(event, data); }
      destroy() { this.destroyed++; }
    }
    sandbox.Hls = Hls;
  }
  return { scripts, instances, videos, offlineMessages, card,
    open(url) { context.showCard('<video id="ccVid"></video>'); context.playStream(url); return card.video; },
    close() { close.onclick(); },
    filter() { select.value = 'I-75'; select.emit('change'); },
    resolve(supported = true) { library(supported); scripts[0].onload(); },
    reject(index = 0) { scripts[index].onerror(new Error('CDN unavailable')); },
    replaceWithoutStop() { card.innerHTML = '<video id="ccVid"></video>'; },
    flush: () => new Promise(setImmediate),
  };
}

test('closing a pending stream prevents HLS and native attachment after CDN completion', async () => {
  for (const mode of ['hls', 'native', 'rejected']) {
    const page = browser(); const old = page.open('https://example.invalid/a.m3u8');
    page.close();
    if (mode === 'rejected') page.reject(); else page.resolve(mode === 'hls');
    await page.flush();
    assert.equal(page.instances.length, 0, mode);
    assert.deepEqual(old.sources, [], mode);
    assert.equal(old.plays, 0, mode);
    assert.equal(page.card.style.display, 'none', mode);
  }
});

test('a highway change closes and invalidates playback while the library is pending', async () => {
  for (const mode of ['hls', 'rejected']) {
    const page = browser(); const old = page.open('https://example.invalid/a.m3u8');
    page.filter();
    if (mode === 'rejected') page.reject(); else page.resolve();
    await page.flush();
    assert.equal(page.instances.length, 0);
    assert.deepEqual(old.sources, []);
    assert.equal(old.plays, 0);
    assert.equal(page.card.style.display, 'none');
  }
});

test('reopening while the library is pending starts only the current camera', async () => {
  for (const mode of ['hls', 'native', 'rejected']) {
    const page = browser(); const old = page.open('https://example.invalid/a.m3u8');
    page.close(); const current = page.open('https://example.invalid/b.m3u8');
    assert.equal(page.scripts.length, 1, 'The current request reuses the pending library load');
    if (mode === 'rejected') page.reject(); else page.resolve(mode === 'hls');
    await page.flush();
    assert.equal(old.isConnected, false); assert.equal(old.plays, 0); assert.deepEqual(old.sources, []);
    if (mode === 'hls') {
      assert.equal(page.instances.length, 1);
      assert.equal(page.instances[0].video, current);
      assert.equal(page.instances[0].url, 'https://example.invalid/b.m3u8');
      page.instances[0].emit('manifest'); assert.equal(current.plays, 1);
    } else {
      assert.deepEqual(current.sources, ['https://example.invalid/b.m3u8']);
      assert.equal(current.plays, 1);
    }
  }
});

test('detached video is rejected even when removal did not call stopStream', async () => {
  for (const mode of ['hls', 'rejected']) {
    const page = browser(); const old = page.open('https://example.invalid/a.m3u8');
    page.replaceWithoutStop();
    if (mode === 'rejected') page.reject(); else page.resolve();
    await page.flush();
    assert.equal(page.instances.length, 0); assert.equal(old.plays, 0); assert.deepEqual(old.sources, []);
  }
});

test('late HLS callbacks from a destroyed camera cannot play or replace a reopened card', async () => {
  const page = browser(); const old = page.open('https://example.invalid/a.m3u8');
  page.resolve(); await page.flush(); const first = page.instances[0];
  page.close(); assert.equal(first.destroyed, 1);
  const current = page.open('https://example.invalid/b.m3u8'); await page.flush();
  first.emit('manifest'); first.emit('error', { fatal: true });
  assert.equal(old.plays, 0); assert.equal(page.card.video, current); assert.deepEqual(page.offlineMessages, []);
  const second = page.instances[1]; second.emit('manifest'); assert.equal(current.plays, 1);
  second.emit('error', { fatal: true });
  assert.equal(second.destroyed, 1); assert.equal(page.card.video, null);
  assert.equal(page.offlineMessages.length, 1, 'A current fatal failure still displays the offline message');
});

test('native fallback retries metadata playback but ignores stale media callbacks', async () => {
  const page = browser(); const old = page.open('https://example.invalid/a.m3u8');
  old.playResult = 'undefined'; page.resolve(false); await page.flush();
  assert.equal(old.plays, 1); old.emit('loadedmetadata'); assert.equal(old.plays, 2);
  page.close(); const current = page.open('https://example.invalid/b.m3u8'); await page.flush();
  old.emit('loadedmetadata'); old.emit('error');
  assert.equal(old.plays, 2); assert.equal(page.card.video, current); assert.deepEqual(page.offlineMessages, []);
  assert.deepEqual(current.sources, ['https://example.invalid/b.m3u8']);
  current.emit('error'); assert.equal(page.offlineMessages.length, 1);
});

test('a failed CDN load can be retried after closing without attaching to the old video', async () => {
  const page = browser(); const old = page.open('https://example.invalid/a.m3u8');
  page.close(); page.reject(); await page.flush();
  const current = page.open('https://example.invalid/b.m3u8');
  assert.equal(page.scripts.length, 2, 'A rejected loader must not remain cached forever');
  page.reject(1); await page.flush();
  assert.deepEqual(old.sources, []); assert.deepEqual(current.sources, ['https://example.invalid/b.m3u8']);
});

test('all 47 existing state/province pages use the generator stream runtime and parse', () => {
  const expected = generator.match(streamPattern)[0]; const slugs = [];
  for (const entry of fs.readdirSync(path.join(root, 'cameras'), { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const file = path.join(root, 'cameras', entry.name, 'index.html'); if (!fs.existsSync(file)) continue;
    const html = fs.readFileSync(file, 'utf8'); if (!html.includes('function playStream(url)')) continue;
    assert.equal(html.match(streamPattern)?.[0], expected, entry.name);
    for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
      if (/type=["']application\/ld\+json["']/.test(match[1])) JSON.parse(match[2]);
      else new vm.Script(match[2]);
    }
    slugs.push(entry.name);
  }
  assert.equal(slugs.length, 47);
  for (const province of ['alberta', 'british-columbia', 'manitoba', 'ontario', 'quebec']) assert.ok(slugs.includes(province));
});

test('migration changes only stream runtimes and is idempotent for state/province pages', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'milecheck-camera-stream-'));
  try {
    fs.mkdirSync(path.join(dir, 'scripts'), { recursive: true });
    for (const script of ['gen-state-camera-pages.js', 'add-camera-route-filter.mjs'])
      fs.copyFileSync(path.join(root, 'scripts', script), path.join(dir, 'scripts', script));
    const legacy = 'var hlsInst=null,hlsLoading=null;function loadHls(){}\nfunction stopStream(){}\nfunction playStream(){}\n';
    const originals = {};
    for (const slug of ['florida', 'alberta']) {
      const html = fs.readFileSync(path.join(root, 'cameras', slug, 'index.html'), 'utf8'); originals[slug] = html;
      fs.mkdirSync(path.join(dir, 'cameras', slug), { recursive: true });
      fs.writeFileSync(path.join(dir, 'cameras', slug, 'index.html'), html.replace(streamPattern, () => legacy));
    }
    for (let pass = 0; pass < 2; pass++) {
      execFileSync(process.execPath, ['scripts/add-camera-route-filter.mjs'], { cwd: dir });
      for (const slug of ['florida', 'alberta']) assert.equal(fs.readFileSync(path.join(dir, 'cameras', slug, 'index.html'), 'utf8'), originals[slug]);
    }
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
