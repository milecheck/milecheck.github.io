// Run: node --test assets/thanksgiving-corridors.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const c = require('./thanksgiving-corridors.js');
const a = require('./thanksgiving-advisories.js');

const rep = (route, top) => (top ? { 'route-id': route } : { location: { 'route-id': route } });

test('route names come out dashed', () => {
  assert.equal(c.normalizeRoute('I 5', 'OR'), 'I-5');
  assert.equal(c.normalizeRoute('IH0035E', 'TX'), 'I-35E');
  assert.equal(c.normalizeRoute('Interstate 90', 'MT'), 'I-90');
  assert.equal(c.normalizeRoute('I-84 EB', 'OR'), 'I-84');
  assert.equal(c.normalizeRoute('US 101', 'CA'), 'US-101');
  assert.equal(c.normalizeRoute('US-2', 'WA'), 'US-2');
  assert.equal(c.normalizeRoute('SR 87', 'AZ'), 'SR-87');
  assert.equal(c.normalizeRoute('005', 'WA'), 'I-5');
  assert.equal(c.normalizeRoute('SR 405', 'WA'), 'I-405');
  assert.equal(c.normalizeRoute('099', 'WA'), 'SR-99');
  assert.equal(c.normalizeRoute('OLD OREGON TRAIL', 'OR'), 'OLD OREGON TRAIL');
  assert.equal(c.normalizeRoute('', 'OR'), '');
});

test('top routes counts current alerts per route, highest first, ties by name', () => {
  const payload = { 'incident-reports': [rep('I-5'), rep('I 5', true), rep('US 101'), rep('I-84'), rep('I-84'), rep('I-5'),
    rep('US-26'), rep(''), {}, null, rep('OR-58'), rep('US-20')] };
  assert.deepEqual(c.topRoutes(payload, 'OR', 5), [
    { route: 'I-5', count: 3 }, { route: 'I-84', count: 2 }, { route: 'OR-58', count: 1 }, { route: 'US-101', count: 1 }, { route: 'US-20', count: 1 }]);
  assert.equal(c.topRoutes(payload, 'OR', 2).length, 2);
});

test('payload shapes: top level, nested under data, missing', () => {
  assert.deepEqual(c.topRoutes({ data: { 'incident-reports': [rep('I-90')] } }, 'WA'), [{ route: 'I-90', count: 1 }]);
  assert.deepEqual(c.topRoutes({ incidents: [rep('I-80')] }, 'NV'), [{ route: 'I-80', count: 1 }]);
  assert.deepEqual(c.topRoutes([rep('I-25')], 'CO'), [{ route: 'I-25', count: 1 }]);
  assert.deepEqual(c.topRoutes(null, 'CO'), []);
  assert.deepEqual(c.topRoutes({ error: 'x' }, 'DC'), []);
  assert.deepEqual(c.topRoutes({ 'incident-reports': 'oops' }, 'DC'), []);
});

test('every state page code has a main time zone that drives its day boundaries', () => {
  const codes = 'AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY'.split(' ');
  assert.equal(codes.length, 51);
  for (const s of codes) assert.ok(a.STATE_TZ[s], s);
  assert.equal(a.dayRange('2026-11-26', a.stateTimeZone('HI')).start, Date.parse('2026-11-26T00:00:00-10:00'));
  assert.equal(a.dayRange('2026-11-26', a.stateTimeZone('AZ')).start, Date.parse('2026-11-26T00:00:00-07:00'));
  assert.equal(a.dayRange('2026-11-26', a.stateTimeZone('TX')).start, Date.parse('2026-11-26T00:00:00-06:00'));
});
