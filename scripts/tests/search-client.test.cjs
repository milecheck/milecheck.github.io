const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(root, 'scripts/search-client.js'), 'utf8');
const index = JSON.parse(fs.readFileSync(path.join(root, 'search-index.json'), 'utf8'));

// Run the unchanged browser entry point, fetch the real current index, and submit searches
// through the real form handler. No scoring functions or hand-picked index records are mocked.
async function browser() {
  const elements = {};
  for (const id of ['q', 'results', 'count', 'chips', 'sf']) {
    elements[id] = {
      value: '', innerHTML: '', textContent: '', listeners: {},
      addEventListener(type, fn) { this.listeners[type] = fn; },
      focus() {}, querySelectorAll() { return []; },
    };
  }
  let location = new URL('https://milecheckapp.com/search/');
  const events = [];
  const context = {
    document: { getElementById: id => elements[id] }, window: {}, URL, URLSearchParams,
    get location() { return location; },
    history: { replaceState(_state, _title, url) { location = new URL(url); } },
    fetch: async url => {
      assert.equal(url, '/search-index.json');
      return { json: async () => structuredClone(index) };
    },
    clearTimeout, setTimeout,
    gtag: (...args) => events.push(args),
  };
  context.window.gtag = context.gtag;
  vm.runInNewContext(source, context, { filename: 'search-client.js' });
  await new Promise(setImmediate);
  assert.notEqual(elements.count.textContent, 'The search index did not load. Try the links below.');
  return {
    search(query) {
      elements.q.value = query;
      elements.sf.listeners.submit({ preventDefault() {} });
      assert.equal(location.searchParams.get('q'), query);
      const links = Array.from(elements.results.innerHTML.matchAll(/<a class="(card|hit)" href="([^"]+)"/g),
        m => ({ kind: m[1], href: m[2].replace(/&amp;/g, '&') }));
      for (const { href } of links) {
        const target = new URL(href, location);
        const file = path.join(root, target.pathname, target.pathname.endsWith('/') ? 'index.html' : '');
        assert.ok(fs.existsSync(file), `Search must not invent ${href}`);
      }
      return { links, html: elements.results.innerHTML, count: elements.count.textContent };
    },
    events,
  };
}

test('state road-condition queries prefer the existing route/state page', async () => {
  const page = await browser();
  for (const [query, expected] of [
    ['I75 Florida road conditions', '/corridors/i-75/florida/'],
    ['I-75 Michigan', '/corridors/i-75/michigan/'],
    ['Interstate 75 Georgia road conditions', '/corridors/i-75/georgia/'],
    ['I75 OH road conditions', '/corridors/i-75/ohio/'],
  ]) {
    const { links } = page.search(query);
    assert.equal(links[0].href, expected, query);
    assert.ok(!links.some(l => /^\/corridors\/i-(?!75\/)/.test(l.href)), query);
    const statePaths = links.filter(l => /^\/corridors\/i-75\/[a-z-]+\//.test(l.href));
    assert.deepEqual(statePaths.map(l => l.href), [expected], query);
  }
});

test('a state without a route/state page falls back to the real complete corridor', async () => {
  const page = await browser();
  const { links } = page.search('I15 Utah road conditions');
  assert.equal(links[0].href, '/corridors/i-15/');
  assert.ok(!links.some(l => l.href === '/corridors/i-15/utah/'));
  assert.ok(!links.some(l => /^\/corridors\/i-(?!15\/)/.test(l.href)));
});

test('route/state camera queries open the existing state map with a highway selected', async () => {
  const page = await browser();
  for (const [query, pathName, route] of [
    ['I75 Florida cameras', '/cameras/florida/', 'I-75'],
    ['I15 Utah cams', '/cameras/utah/', 'I-15'],
    ['I5 OR cameras', '/cameras/oregon/', 'I-5'],
  ]) {
    const { links } = page.search(query);
    assert.equal(links[0].kind, 'card', query);
    const target = new URL(links[0].href, 'https://milecheckapp.com');
    assert.equal(target.pathname, pathName, query);
    assert.equal(target.searchParams.get('route'), route, query);
    assert.ok(!links.some(l => l.href === pathName), 'Do not add an unfiltered duplicate');
    assert.match(fs.readFileSync(path.join(root, pathName, 'index.html'), 'utf8'), /\/assets\/camera-route-filter\.js/);
  }
  assert.ok(!page.search('I75 Utah cameras').links.some(l => l.href.includes('route=I-75')));
  assert.ok(!page.search('US1 Ontario cameras').links.some(l => l.href.includes('/cameras/ontario/?route=')),
    'Province pages have no highway selector');
});

test('mile marker cards preserve state/route, zero and decimal miles', async () => {
  const page = await browser();
  for (const [query, expected] of [
    ['I5 OR mile markers', { route: 'I-5', state: 'OR' }],
    ['Oregon mile markers', { state: 'OR' }],
    ['OR mile markers', { state: 'OR' }],
    ['I84 mile0 OR', { route: 'I-84', mp: '0', state: 'OR' }],
    ['I84 mile 0.25 Oregon', { route: 'I-84', mp: '0.25', state: 'OR' }],
    ['I-84 milepost 147.75 Oregon', { route: 'I-84', mp: '147.75', state: 'OR' }],
    ['I5 mile markers', {}],
    ['I84 mile -1 Oregon', { route: 'I-84', state: 'OR' }],
    ['I84 mile 1e3 Oregon', { route: 'I-84', state: 'OR' }],
    ['I84 mile 1.2.3 Oregon', { route: 'I-84', state: 'OR' }],
    ['I84 mile 1.2e3 Oregon', { route: 'I-84', state: 'OR' }],
  ]) {
    const { links } = page.search(query);
    assert.equal(links[0].kind, 'card', query);
    const target = new URL(links[0].href, 'https://milecheckapp.com');
    assert.equal(target.pathname, '/maps/mile-markers/', query);
    assert.deepEqual(Object.fromEntries(target.searchParams), expected, query);
  }
  assert.match(page.search('I5 mile markers').html, /Choose a state, then select I-5/);
});

test('conjunctions and prepositions do not add a different state', async () => {
  const page = await browser();
  assert.equal(page.search('I75 in Florida road conditions').links[0].href, '/corridors/i-75/florida/');
  const either = page.search('I5 or I90 cameras').links;
  assert.ok(!either.some(l => l.kind === 'card'), 'Do not interpret a highway conjunction as Oregon');
  assert.notEqual(page.search('cameras near me').links[0].href, '/cameras/maine/',
    'An unlocated camera query must not acquire a Maine preference');
});

test('state queries work for all fifty states and the 50-state map stays findable', async () => {
  const page = await browser();
  const states = 'Alabama,Alaska,Arizona,Arkansas,California,Colorado,Connecticut,Delaware,Florida,Georgia,Hawaii,Idaho,Illinois,Indiana,Iowa,Kansas,Kentucky,Louisiana,Maine,Maryland,Massachusetts,Michigan,Minnesota,Mississippi,Missouri,Montana,Nebraska,Nevada,New Hampshire,New Jersey,New Mexico,New York,North Carolina,North Dakota,Ohio,Oklahoma,Oregon,Pennsylvania,Rhode Island,South Carolina,South Dakota,Tennessee,Texas,Utah,Vermont,Virginia,Washington,West Virginia,Wisconsin,Wyoming'.split(',');
  for (const state of states) {
    const expected = '/road-conditions/' + state.toLowerCase().replaceAll(' ', '-') + '/';
    assert.equal(page.search(state + ' road conditions').links[0].href, expected, state);
  }
  const general = page.search('all 50 states');
  assert.ok(general.links.some(l => l.href === '/maps/mile-markers/'));
  assert.ok(page.events.every(e => e[0] === 'event' && e[1] === 'site_search'));
  assert.equal(page.events.at(-1)[2].search_term, 'all 50 states');
});

test('partial matches still exclude a different route and state', async () => {
  const page = await browser();
  const { links } = page.search('I75 Florida inventedword');
  assert.ok(links.length);
  assert.ok(!links.some(l => /^\/corridors\/i-(?!75\/)/.test(l.href)));
  assert.ok(!links.some(l => /^\/corridors\/i-75\/(?!florida\/)[a-z-]+\//.test(l.href)));
});

test('current-location questions open the one-action tool and route or numbered queries keep the map',async()=>{
  const page=await browser();
  for(const query of ['what mile marker am I at','where is my mile marker','find my mile marker'])assert.equal(page.search(query).links[0].href,'/what-mile-marker-am-i-at/',query);
  for(const query of ['Oregon mile markers','I84 mile 147 Oregon','I75 mile markers'])assert.ok(page.search(query).links[0].href.startsWith('/maps/mile-markers/'),query);
});
