import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { LINKS, exclusion, headerPartial, transformPage, processSite } from '../add-site-nav.mjs';
const require = createRequire(import.meta.url);
const { activeSection, init } = require('../../assets/site-nav.js');
const root = fileURLToPath(new URL('../../', import.meta.url));

test('every canonical header has the required absolute link order and one actual active section', () => {
  const expected = [['Home', '/'], ['Maps', '/maps/'], ['Cameras', '/cameras/'], ['United States', '/states/'],
    ['Canada', '/canada/'], ['Story', '/#story'], ['B2B', '/partners/'], ['Pricing', '/#pricing'],
    ['Blog', '/blog/'], ['Search', '/search/'], ['Get the app', '/get/']];
  assert.deepEqual(LINKS.map(([, label, url]) => [label, url]), expected);
  for (const [file, section] of [['index.html', 'home'], ['maps/index.html', 'maps'], ['maps/mile-markers/index.html', 'maps'],
    ['cameras/utah/index.html', 'cameras'], ['states/index.html', 'states'], ['canada/index.html', 'canada'],
    ['partners/index.html', 'b2b'], ['blog/example.html', 'blog'], ['search/index.html', 'search']]) {
    const header = headerPartial(file);
    assert.deepEqual([...header.matchAll(/href="([^"]+)" data-nav-link="([^"]+)"/g)].map(m => [m[2], m[1]]), LINKS.map(([key, , href]) => [key, href]));
    assert.equal((header.match(/aria-current=/g) || []).length, 1, file);
    assert.match(header, new RegExp(`data-nav-link="${section}"[^>]*aria-current="page"`), file);
    assert.doesNotMatch(header, /class="(?:site-header|primary-nav|nav-toggle|header-inner)"/);
    assert.doesNotMatch(header, /<nav[^>]*\bhidden\b/, 'Without JavaScript, links remain available');
  }
  assert.doesNotMatch(headerPartial('best-fall-road-trips/index.html'), /aria-current=/, 'An unrelated page must not pretend to be Pricing or another section');
});

test('home tabs and its download modal retain their existing delegated handlers', () => {
  const original = readFileSync(join(root, 'index.html'), 'utf8');
  const transformed = transformPage(original, 'index.html');
  const header = transformed.match(/<!-- site-nav:header -->[\s\S]*?<!-- \/site-nav:header -->/)[0];
  assert.match(header, /href="\/#story" data-nav-link="story" data-tab="story"/);
  assert.match(header, /href="\/#pricing" data-nav-link="pricing" data-tab="home" data-goto="pricing"/);
  assert.match(header, /href="\/get\/" data-nav-link="get"[^>]*data-dl/);
  const scripts = [...original.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m => m[1]).filter(s => s.includes('function show(tab)') || s.includes('dlModal'));
  assert.equal(scripts.length, 2);
  for (const script of scripts) assert.ok(transformed.includes(script), 'Do not rewrite the homepage tab or download handler');
  assert.ok(!/data-tab=/.test(headerPartial('maps/index.html')), 'Child links navigate to the real home hash');
});

test('migration preserves analytics, body, map handlers and embedded data outside the header', () => {
  const oldMenu = "document.querySelector('.nav-toggle').addEventListener('click',()=>document.querySelector('.primary-nav').classList.toggle('open'));";
  const source = '<html><head><!-- ga4 -->keep-analytics<!-- /ga4 --></head><body><header class="site-header"><nav>Old</nav></header>' +
    '<main><h1>Bridge details</h1></main><script>const bridgeData={unchanged:true};\n' + oldMenu + '\nrenderMap();</script></body></html>';
  const next = transformPage(source, 'bridges/florida/index.html');
  assert.ok(next.includes('<!-- ga4 -->keep-analytics<!-- /ga4 -->'));
  assert.ok(next.includes('<main><h1>Bridge details</h1></main>'));
  assert.ok(next.includes('const bridgeData={unchanged:true};\n\nrenderMap();'));
  assert.ok(!next.includes(oldMenu));
  assert.equal((next.match(/\/assets\/site-nav\.js\?/g) || []).length, 1);
  assert.equal((next.match(/\/assets\/site-nav\.css\?/g) || []).length, 1);
  assert.equal(transformPage(next, 'bridges/florida/index.html'), next);
});

test('held families, previews and focused standalone tools stay untouched', () => {
  const source = '<html><head></head><body><header class="site-header">Held</header><main>Keep</main></body></html>';
  for (const file of ['passes/donner/index.html', 'mountain-roads/rainier/index.html', 'enchantments-roads/index.html',
    'mountains/rainier/roads/index.html', 'mountains/hood/roads/index.html', 'mountains/angeles/roads/index.html',
    'mountains/baker/roads/index.html', 'mountains/sthelens/roads/index.html', 'mountains/denali/roads/index.html', 'enchantments/roads/index.html',
    'corridors/i-5/index.html', 'corridors/i-75/index.html', 'corridors/i-75/florida/preview.html',
    'boards/i84-pendleton.html', 'admin/index.html', 'internal/page.html', 'design-options/nav/index.html',
    'index-refresh-preview.html', 'index-v1-classic.html', 'what-mile-marker-am-i-at/index.html']) {
    assert.ok(exclusion(file), file); assert.equal(transformPage(source, file), source, file);
  }
  assert.equal(exclusion('corridors/index.html'), '');
  for (const state of ['florida', 'georgia', 'kentucky', 'michigan', 'ohio', 'tennessee']) assert.equal(exclusion(`corridors/i-75/${state}/index.html`), '');
});

test('postprocessor applies only eligible headers and converges without a generator', () => {
  const dir = mkdtempSync(join(tmpdir(), 'milecheck-site-nav-'));
  try {
    const source = '<html><head></head><body><header class="site-header">Old</header><main>Body sentinel</main></body></html>';
    for (const file of ['maps/index.html', 'cameras/florida/index.html', 'passes/donner/index.html', 'boards/demo.html', 'index-preview.html']) {
      mkdirSync(dirname(join(dir, file)), { recursive: true }); writeFileSync(join(dir, file), source);
    }
    const dry = processSite({ root: dir }); assert.equal(dry.changed.length, 2);
    assert.equal(readFileSync(join(dir, 'maps/index.html'), 'utf8'), source, 'Audit must not write');
    const first = processSite({ root: dir, write: true }); assert.equal(first.changed.length, 2);
    assert.deepEqual(processSite({ root: dir, write: true }).changed, []);
    assert.equal(readFileSync(join(dir, 'passes/donner/index.html'), 'utf8'), source);
    assert.equal(readFileSync(join(dir, 'boards/demo.html'), 'utf8'), source);
    assert.ok(readFileSync(join(dir, 'maps/index.html'), 'utf8').includes('Body sentinel'));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

function harness(pathname = '/', hash = '') {
  let focused = null;
  const node = (attributes = {}, parent = null) => ({ attributes: { ...attributes }, parent, listeners: {},
    getAttribute(name) { return this.attributes[name] ?? null; },
    setAttribute(name, value) { this.attributes[name] = value; }, removeAttribute(name) { delete this.attributes[name]; },
    addEventListener(type, callback) { (this.listeners[type] ||= []).push(callback); },
    emit(type, values = {}) {
      const event = { target: this, preventDefault() { this.defaultPrevented = true; }, ...values };
      for (const callback of this.listeners[type] || []) callback(event);
      return event;
    },
    contains(other) { for (let x = other; x; x = x.parent) if (x === this) return true; return false; },
    closest(selector) { return selector === 'a[href]' && this.attributes.href ? this : selector === '[data-tab]' && this.attributes['data-tab'] ? this : null; },
    focus() { focused = this; },
  });
  const header = node({ 'data-site-nav': 'test' }), button = node({}, header), nav = node({}, header);
  const links = LINKS.map(([key, , href]) => node({ 'data-nav-link': key, href }, nav));
  header.querySelector = selector => selector === '.mc-nav-toggle' ? button : selector === '.mc-primary-nav' ? nav : null;
  nav.querySelectorAll = () => links;
  const doc = node(); doc.querySelector = selector => selector === '[data-site-nav]' ? header : null;
  const win = node(); win.location = { pathname, hash };
  const media = node(); media.matches = true; win.matchMedia = () => media;
  const api = init(doc, win);
  return { header, button, nav, links, doc, win, media, api, node,
    get focused() { return focused; },
    active() { return links.filter(l => l.getAttribute('aria-current')).map(l => l.getAttribute('data-nav-link')); },
  };
}

test('Home and Pricing active states follow the actual route/hash, including history and homepage clicks', async () => {
  assert.equal(activeSection('/', ''), 'home'); assert.equal(activeSection('/', '#pricing'), 'pricing');
  assert.equal(activeSection('/index.html', '#story'), 'story'); assert.equal(activeSection('/maps/', '#pricing'), 'maps');
  assert.equal(activeSection('/canada/', ''), 'canada'); assert.equal(activeSection('/road-conditions/british-columbia/', ''), 'canada');
  const page = harness(); assert.deepEqual(page.active(), ['home']);
  const pricing = page.links.find(l => l.getAttribute('data-nav-link') === 'pricing');
  page.nav.emit('click', { target: pricing });
  page.win.location.hash = '#pricing'; // Existing delegated home handler runs later in the same click.
  await Promise.resolve(); assert.deepEqual(page.active(), ['pricing']);
  page.win.location.hash = '#story'; page.win.emit('hashchange'); assert.deepEqual(page.active(), ['story']);
  page.win.location.hash = ''; page.win.emit('popstate'); assert.deepEqual(page.active(), ['home']);
  assert.equal(page.links.find(l => l.getAttribute('data-nav-link') === 'pricing').getAttribute('aria-current'), null);
});

test('mobile controls expose expansion state, focus the links and restore focus on Escape', () => {
  const page = harness('/cameras/florida/');
  assert.equal(page.button.getAttribute('aria-expanded'), 'false');
  page.button.emit('click');
  assert.equal(page.button.getAttribute('aria-expanded'), 'true');
  assert.equal(page.focused, page.links[0]);
  const event = page.doc.emit('keydown', { key: 'Escape' });
  assert.equal(event.defaultPrevented, true); assert.equal(page.focused, page.button);
  assert.equal(page.header.getAttribute('data-nav-open'), 'false');
  page.button.emit('keydown', { key: 'ArrowDown' });
  assert.equal(page.header.getAttribute('data-nav-open'), 'true'); assert.equal(page.focused, page.links[0]);
});

test('home logo and footer panel clicks update the active section after replaceState', async () => {
  const page = harness('/', '#story');
  const logo = page.node({href:'/', 'data-tab':'home'}, page.header);
  page.doc.emit('click', {target:logo});
  page.win.location.hash='';
  await Promise.resolve(); assert.deepEqual(page.active(), ['home']);
  const footerStory=page.node({href:'/#story', 'data-tab':'story'});
  page.doc.emit('click', {target:footerStory});
  page.win.location.hash='#story';
  await Promise.resolve(); assert.deepEqual(page.active(), ['story']);
});

test('outside clicks, focus leaving the header, link activation and desktop resizing close the mobile menu', () => {
  for (const action of ['pointerdown', 'click', 'focusin', 'link', 'resize']) {
    const page = harness(); page.button.emit('click');
    if (action === 'link') page.nav.emit('click', { target: page.links[1] });
    else if (action === 'resize') { page.media.matches = false; page.media.emit('change'); }
    else page.doc.emit(action, { target: page.node() });
    assert.equal(page.header.getAttribute('data-nav-open'), 'false', action);
    assert.equal(page.button.getAttribute('aria-expanded'), 'false', action);
    assert.equal(page.focused, page.links[0], 'Closing without Escape must not steal focus');
  }
});

test('initializing twice does not register competing toggle handlers', () => {
  const page = harness(); init(page.doc, page.win);
  assert.equal(page.button.listeners.click.length, 1);
  page.button.emit('click'); assert.equal(page.header.getAttribute('data-nav-open'), 'true');
  page.button.emit('click'); assert.equal(page.header.getAttribute('data-nav-open'), 'false');
});

test('navigation CSS is scoped and provides touch targets plus a scrollable landscape dropdown', () => {
  const css = readFileSync(join(root, 'assets/site-nav.css'), 'utf8');
  assert.match(css, /\.mc-nav-toggle\{[^}]*width:44px;height:44px;min-width:44px;min-height:44px/);
  assert.match(css, /max-height:calc\(100dvh - 70px\);overflow-y:auto;overscroll-behavior:contain/);
  assert.match(css, /position:fixed;top:66px/, 'Story leaves a short overflow-hidden scene above its body');
  assert.match(css, /:focus-visible/);
  assert.doesNotMatch(css, /(?:^|\n)(?:body|html|button|a|nav|header|\.primary-nav|\.site-header)[\s{.:]/);
});
