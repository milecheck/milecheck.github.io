// Run: node --test assets/thanksgiving-advisories.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const a = require('./thanksgiving-advisories.js');

const LA = 'America/Los_Angeles';
function feat(p) {
  return { properties: Object.assign({ status: 'Actual', messageType: 'Alert', severity: 'Moderate',
    areaDesc: 'Western Whatcom County', event: 'Winter Weather Advisory' }, p) };
}
const NOW = Date.parse('2026-11-23T12:00:00-08:00');

test('day ranges are midnight to midnight in the zone, DST-correct', () => {
  const r = a.dayRange('2026-11-24', LA);
  assert.equal(r.start, Date.parse('2026-11-24T00:00:00-08:00'));
  assert.equal(r.end, Date.parse('2026-11-25T00:00:00-08:00'));
  const spring = a.dayRange('2026-03-08', LA); // 23-hour day
  assert.equal(spring.start, Date.parse('2026-03-08T00:00:00-08:00'));
  assert.equal(spring.end, Date.parse('2026-03-09T00:00:00-07:00'));
  assert.equal(spring.end - spring.start, 23 * 3600e3);
  const fall = a.dayRange('2026-11-01', LA); // 25-hour day
  assert.equal(fall.start, Date.parse('2026-11-01T00:00:00-07:00'));
  assert.equal(fall.end - fall.start, 25 * 3600e3);
  assert.equal(a.dayRange('2026-11-24', 'America/New_York').start, Date.parse('2026-11-24T00:00:00-05:00'));
  assert.equal(a.dayRange('2026-11-30').start, Date.parse('2026-11-30T00:00:00-08:00'), 'defaults to Pacific');
});

test('alert window prefers onset and ends, falls back to effective/sent and expires', () => {
  const w = a.alertWindow({ sent: '2026-11-23T01:00:00-08:00', effective: '2026-11-23T02:00:00-08:00',
    onset: '2026-11-23T10:00:00-08:00', expires: '2026-11-23T16:00:00-08:00', ends: '2026-11-24T10:00:00-08:00' });
  assert.equal(w.start, Date.parse('2026-11-23T10:00:00-08:00'));
  assert.equal(w.end, Date.parse('2026-11-24T10:00:00-08:00'));
  const w2 = a.alertWindow({ sent: '2026-11-23T01:00:00-08:00', expires: '2026-11-23T16:00:00-08:00', ends: null });
  assert.equal(w2.start, Date.parse('2026-11-23T01:00:00-08:00'));
  assert.equal(w2.end, Date.parse('2026-11-23T16:00:00-08:00'));
});

test('an alert spanning two days shows on both; one entirely outside a day does not', () => {
  const span = feat({ onset: '2026-11-24T18:00:00-08:00', ends: '2026-11-25T09:00:00-08:00', expires: '2026-11-24T20:00:00-08:00' });
  assert.equal(a.alertsForDay([span], '2026-11-24', NOW, LA).length, 1);
  assert.equal(a.alertsForDay([span], '2026-11-25', NOW, LA).length, 1, 'uses ends, not the earlier expires');
  assert.equal(a.alertsForDay([span], '2026-11-26', NOW, LA).length, 0);
  const before = feat({ onset: '2026-11-23T08:00:00-08:00', ends: '2026-11-23T23:00:00-08:00' });
  assert.equal(a.alertsForDay([before], '2026-11-24', NOW, LA).length, 0);
  const after = feat({ onset: '2026-11-25T00:00:00-08:00', ends: '2026-11-25T06:00:00-08:00' });
  assert.equal(a.alertsForDay([after], '2026-11-24', NOW, LA).length, 0, 'starting exactly at next midnight is not this day');
});

test('an alert ending exactly at midnight belongs to the earlier day only', () => {
  const f = feat({ onset: '2026-11-24T12:00:00-08:00', ends: '2026-11-25T00:00:00-08:00' });
  assert.equal(a.alertsForDay([f], '2026-11-24', NOW, LA).length, 1);
  assert.equal(a.alertsForDay([f], '2026-11-25', NOW, LA).length, 0);
});

test('expired alerts drop off', () => {
  const f = feat({ onset: '2026-11-24T06:00:00-08:00', ends: '2026-11-24T10:00:00-08:00' });
  const end = Date.parse('2026-11-24T10:00:00-08:00');
  assert.equal(a.alertsForDay([f], '2026-11-24', end - 1, LA).length, 1);
  assert.equal(a.alertsForDay([f], '2026-11-24', end, LA).length, 0, 'end <= now is gone');
  const g = feat({ onset: '2026-11-24T06:00:00-08:00', expires: '2026-11-24T08:00:00-08:00', ends: '2026-11-24T12:00:00-08:00' });
  assert.equal(a.alertsForDay([g], '2026-11-24', Date.parse('2026-11-24T09:00:00-08:00'), LA).length, 1, 'ends wins over expires');
});

test('filtering keeps driving hazards and drops marine, air quality, fire, frost and cancels', () => {
  const keep = ['Winter Storm Warning', 'Winter Weather Advisory', 'Ice Storm Warning', 'Blizzard Warning',
    'Freezing Rain Advisory', 'Freezing Fog Advisory', 'Snow Squall Warning', 'High Wind Warning', 'Wind Advisory',
    'Dense Fog Advisory', 'Flood Watch', 'Flash Flood Warning', 'Avalanche Warning', 'Dust Storm Warning',
    'Extreme Cold Warning', 'Wind Chill Advisory', 'Lake Effect Snow Warning', 'Tropical Storm Warning', 'Hurricane Watch'];
  for (const ev of keep) assert.equal(a.isTravelRelevant(feat({ event: ev })), true, ev);
  const drop = ['Small Craft Advisory', 'Gale Warning', 'Hazardous Seas Warning', 'Beach Hazards Statement',
    'Rip Current Statement', 'Air Quality Alert', 'Red Flag Warning', 'Frost Advisory', 'Freeze Warning',
    'Hard Freeze Warning', 'Special Weather Statement', 'Storm Warning', 'Hurricane Force Wind Warning'];
  for (const ev of drop) assert.equal(a.isTravelRelevant(feat({ event: ev })), false, ev);
  assert.equal(a.isTravelRelevant(feat({ messageType: 'Cancel' })), false);
  assert.equal(a.isTravelRelevant(feat({ status: 'Test' })), false);
  assert.equal(a.isTravelRelevant(feat({ status: 'Exercise' })), false);
  assert.equal(a.isTravelRelevant({}), false);
});

test('duplicates collapse to the latest end, sorted by severity then start', () => {
  const day = '2026-11-24';
  const list = [
    feat({ event: 'Wind Advisory', severity: 'Minor', areaDesc: 'Coast', onset: '2026-11-24T01:00:00-08:00', ends: '2026-11-24T05:00:00-08:00' }),
    feat({ event: 'Winter Weather Advisory', severity: 'Moderate', onset: '2026-11-24T08:00:00-08:00', ends: '2026-11-24T12:00:00-08:00' }),
    feat({ event: 'Winter Weather Advisory', severity: 'Moderate', onset: '2026-11-24T08:00:00-08:00', ends: '2026-11-24T18:00:00-08:00' }),
    feat({ event: 'Winter Storm Warning', severity: 'Severe', areaDesc: 'Cascades', onset: '2026-11-24T09:00:00-08:00', ends: '2026-11-25T09:00:00-08:00' }),
    feat({ event: 'Dense Fog Advisory', severity: 'Moderate', areaDesc: 'Valley', onset: '2026-11-24T03:00:00-08:00', ends: '2026-11-24T11:00:00-08:00' }),
  ];
  const got = a.alertsForDay(list, day, NOW, LA);
  assert.deepEqual(got.map(x => x.event), ['Winter Storm Warning', 'Dense Fog Advisory', 'Winter Weather Advisory', 'Wind Advisory']);
  const wwa = got.find(x => x.event === 'Winter Weather Advisory');
  assert.equal(wwa.end, Date.parse('2026-11-24T18:00:00-08:00'));
});

test('formatUntil reads like the NWS headline', () => {
  // "Winter Weather Advisory until November 23 at 4:00PM PST"
  assert.equal(a.formatUntil(Date.parse('2026-11-23T16:00:00-08:00'), LA), 'until Nov 23, 4:00 PM PST');
  assert.equal(a.formatUntil(Date.parse('2026-11-25T09:30:00-05:00'), 'America/New_York'), 'until Nov 25, 9:30 AM EST');
  assert.equal(a.formatUntil(Infinity, LA), 'until further notice');
});

test('state time zones and truncation helpers', () => {
  assert.equal(a.stateTimeZone('wa'), LA);
  assert.equal(a.stateTimeZone('NY'), 'America/New_York');
  assert.equal(a.stateTimeZone('ZZ'), LA);
  assert.equal(Object.keys(a.STATE_TZ).length, 51);
  assert.equal(a.truncate('short', 60), 'short');
  const long = 'A; '.repeat(40);
  assert.ok(a.truncate(long, 60).length <= 60);
  assert.ok(a.truncate(long, 60).endsWith('…'));
});
