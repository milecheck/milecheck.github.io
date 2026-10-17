// Tests for scripts/lib/road-status.js. Run: node scripts/lib/road-status.test.js
// Groups: the original 20 phrases (ChatGPT reviews 1-3), the 15 adversarial cases from review 4
// (docs/reviews/overview-v4-2026-10-09/review-checks.cjs), the cases review 4 listed as missing,
// the 2026-10-09 reopening correction (same road + direction + feature only), and regressions for
// timing, labels, the county mile rule and time zones.
// Pass a path to test another copy of the library, e.g. one extracted from a generated page.
const path = require('path');
const fs = require('fs');
const vm = require('vm');
function load(file) {
  const src = fs.readFileSync(file, 'utf8');
  const ctx = { module: { exports: {} }, console };
  vm.createContext(ctx); vm.runInContext(src, ctx);
  return ctx.module.exports;
}
const R = load(process.argv[2] || path.join(__dirname, 'road-status.js'));

let n = 0, bad = 0;
function eq(name, got, want) { n++; if (got !== want) { bad++; console.log('FAIL', name, '\n   got ', JSON.stringify(got), '\n   want', JSON.stringify(want)); } }
function kind(s, want, group) { eq((group || 'kind') + ': ' + JSON.stringify(s), R.closureKind(s), want); }

// --- Original 20 (classifier-tests.js, all passed on v4) ---
[["No full closure","none"],["All lanes closed near Exit 10","full"],["Roadway is closed; shoulder also closed","full"],
["Caltrans full closure C15JA Sign Work Mainline Roadway is closed.","full"],["Right lane closed","partial"],["Exit 34 ramp closed","partial"],
["Road closed due to crash","full"],["Closed in both directions","full"],["Reopened to traffic, previously closed","none"],["SR-20 closed for the season","full"],
["off-ramp full closure","partial"],["all lanes closed on the off-ramp","partial"],["closure reported, extent unspecified","unspecified"],
["Caltrans full closure C15XX Off-Ramp Roadway is closed.","partial"],["I-15 closed at Cajon Pass","full"],["Exit 10 closed","partial"],
["Two right lanes closed for paving","partial"],["Connector closure, I-5 to I-405","partial"],["Rest area closed","partial"],["Lane closure","partial"]
].forEach(([s, w]) => kind(s, w, 'original'));

// --- Review 4 adversarial cases (12 of 15 failed on v4) ---
[['I-15 closed, shoulder also closed','full'],
 ['I-15 closed, off-ramp reopened','full'],
 ['I-15 closed, no full closure on the ramp','full'],
 ['Caltrans full closure C15XX. Off-Ramp Roadway is closed.','partial'],
 ['All lanes not closed','none'],
 ['Road is not closed','none'],
 ['No lane closures','none'],
 ['Road closed to trucks','unspecified'],
 ['Road closed except local traffic','unspecified'],
 ['I-15 northbound closed','full'],
 ['All northbound lanes closed','full'],
 ['I-15 closed between Exit 10 and Exit 12','full'],
 ['Closure reported near mile 10.5; off-ramp closed','partial'],
 ['Road closed. Road reopened to traffic.','none'],
 ['Caltrans full closure C15JA Sign Work Mainline Roadway is closed. Roadway reopened.','none'],
].forEach(([s, w]) => kind(s, w, 'review4'));

// --- 2026-10-09 correction: a reopening cancels only the same road, direction and feature ---
[['I-15 closed. I-15 reopened.','none'],                                  // same road, same (all) direction, mainline
 ['I-15 northbound closed. I-15 northbound reopened.','none'],            // same road + direction
 ['I-15 northbound closed. I-15 southbound reopened.','full'],            // same road, different direction
 ['Northbound closed. Southbound reopened.','full'],
 ['Northbound reopened; southbound remains closed','full'],
 ['I-15 closed in both directions. Northbound reopened.','full'],         // southbound still closed
 ['I-15 northbound closed. I-15 reopened in both directions.','none'],
 ['I-15 closed. I-215 reopened.','full'],                                 // different road never cancels
 ['I-15 closed. Off-ramp reopened.','full'],                              // mainline closed + ramp reopened
 ['I-15 closed. Shoulder reopened.','full'],                              // mainline closed + shoulder reopened
 ['I-15 closed, shoulder reopened','full'],
 ['Off-ramp closed. Off-ramp reopened.','none'],                          // same feature
 ['Off-ramp closed. On-ramp reopened.','partial'],                        // different ramp
 ['Right lane closed. Right lane reopened.','none'],
 ['Right lane closed. Left lane reopened.','partial'],
 ['Northbound off-ramp closed. Southbound off-ramp reopened.','partial'],
 ['Off-ramp closed. Reopened.','none'],                                   // bare "reopened" refers to the record's feature
 ['I-15 closed and off-ramp reopened','full'],
 ['I-15 closed. Right lane reopened.','unclear'],                         // a lane open contradicts a full closure; show the words
].forEach(([s, w]) => kind(s, w, 'reopen'));

// --- Missing cases listed by review 4 ---
// Title and description separately, then in the production combination (recordText).
const rec = (title, desc) => R.closureKindOf({ title, desc });
eq('title alone: generic full heading', R.closureKind('Caltrans full closure C15XX'), 'full');
eq('desc alone: off-ramp', R.closureKind('Off-Ramp Roadway is closed.'), 'partial');
eq('record: generic heading + off-ramp desc', rec('Caltrans full closure C15XX', 'Off-Ramp Roadway is closed.'), 'partial');
eq('record: generic heading + lane desc', rec('Caltrans lane closure C15XX', '2 of 3 lanes closed.'), 'partial');
eq('record: full heading + every lane', rec('Caltrans full closure C15XX', '3 of 3 lanes closed.'), 'full');
eq('record: full heading + one lane is a contradiction', rec('Caltrans full closure C15XX', 'Right lane closed.'), 'unclear');
eq('record: generic heading + reopening desc', rec('Caltrans full closure C15XX', 'Mainline Roadway is closed. Roadway reopened.'), 'none');
eq('record: heading + mainline desc', rec('Caltrans full closure C15JA', 'Sign Work Mainline Roadway is closed.'), 'full');
eq('record: title repeated as first sentence of desc', rec('Road closed.', 'Road closed. Road reopened to traffic.'), 'none');
eq('record: punctuation in title does not matter', rec('Caltrans full closure C15XX.', 'Off-Ramp Roadway is closed.'), 'partial');
eq('record: title without period', rec('Caltrans full closure C15XX', 'Off-Ramp Roadway is closed'), 'partial');
// Newlines, conjunctions, decimals and abbreviations.
kind('I-15 closed\nOff-ramp reopened', 'full', 'format');
kind('Off-ramp closed\nI-15 lanes open', 'partial', 'format');
kind('Right lane and shoulder closed', 'partial', 'format');
kind('I-15 is closed at mile 10.5', 'full', 'format');
kind('Closed at MP 10.5 to MP 12.3', 'unspecified', 'format');
kind('U.S. 50 closed', 'full', 'format');
kind('Hwy. 20 closed for the season', 'full', 'format');
kind('Mt. Hood Hwy closed', 'full', 'format');
kind('No. 2 lane closed', 'partial', 'format');
kind('I-15 closed from exit 10 to exit 12', 'full', 'format');
kind('I-15 northbound: right lane closed', 'partial', 'format');
kind('closed for 2 or 3 hours', 'unspecified', 'format');   // "or 3" is not Oregon route 3
kind('I-15 closed; I-15 closed', 'full', 'format');
// Future, conditional and past wording does not establish a current closure.
kind('Road may be closed', 'unclear', 'future');
kind('Road will be closed tonight', 'unclear', 'future');
kind('Expect intermittent closures up to 20 minutes', 'unclear', 'future');
kind('Road closing at 8 PM', 'unclear', 'future');
kind('I-15 was closed earlier due to a crash', 'none', 'future');
kind('I-15 was closed due to a crash', 'unclear', 'future');
kind('I-15 closed. Expected to reopen at 5 PM.', 'full', 'future');
kind('I-15 closed until it reopens at 5 PM', 'full', 'future');
kind('Road will not be closed', 'none', 'future');
kind('Off-ramp closed. Road may be closed later.', 'partial', 'future');
kind('Road closed. No full closure.', 'unclear', 'conflict');
kind('Right lane closed. No full closure.', 'partial', 'conflict');
kind('I-15 no longer closed', 'none', 'reopen');
kind('Road closed, pilot car', 'unspecified', 'restricted');
kind('Pass closed to vehicles without chains', 'unspecified', 'restricted');
kind('Road closed to through traffic', 'unspecified', 'restricted');
kind('Road closed to traffic', 'full', 'restricted');
// Non-closure text.
kind('Crash on I-15', 'none', 'other');
kind('Crash. All lanes closed.', 'full', 'other');
kind('Rest area open', 'none', 'other');
kind('', 'none', 'other');
kind(null, 'none', 'other');

// --- Found in the real agency corpus (milecheck-deploy/scripts/fixtures/alert-corpus.json, 1,367 incidents) ---
kind('SR 160 is closed between Blackberry Hill Lane SE and Long Lake Road SE through the end of October.', 'full', 'corpus');   // a street named Lane is not a lane
kind('VANCE NECK RD BETWEEN APPLE TREE LN AND MARATHON DR HAS A RIGHT LANE CLOSURE', 'partial', 'corpus');
kind('RABBIT CHASE LN. BETWEEN BRENFORD RD. AND SUNNYSIDE RD. IS CLOSED UNTIL 9/4/26', 'full', 'corpus');   // all-caps abbreviations are not sentence ends
kind('RATLEDGE RD BETWEEN LOREWOOD GROVE RD AND CRYSTAL DR CLOSED FOR CONSTRUCTION', 'full', 'corpus');
kind('RT-133 EB and WB Exit 493 Essex Ave. | Travel Lane(s) Affected: 0 Lane(s) Affected Description: Road closed (both directions)', 'full', 'corpus');
kind('Road Work on I-384 Westbound between Exits 8 and 5 (2.8 miles) in effect today until 3:30 pm. The right and center lanes are closed. Reported Friday, June 26 at 9:30 am.', 'partial', 'corpus');
kind('Bridge construction on ramp from US-395-BR to US-395 Northbound. All lanes blocked - use other routes.', 'partial', 'corpus');   // the lanes are the ramp's
kind('Access to US 101 to and from North Baker Street is closed.', 'partial', 'corpus');
kind('I-90 Exit 154/Adams Rd. overpass: the overpass is closed due to a hole in the bridge deck.', 'partial', 'corpus');
kind('US 49 S crossover closed to Northbound traffic. Left lane closed', 'partial', 'corpus');
kind('Vermont Route 114 at Bridge #38 will remain closed until further notice. The anticipated reopening of Vermont Route 114 is expected within the next two weeks.', 'full', 'corpus');
kind('There is currently no estimated time to reopen. I-90 closed.', 'full', 'corpus');
kind("Don't drive around barricades if roadway is closed.", 'unclear', 'corpus');
kind('Road Reconstruction No Lane Closure.', 'none', 'corpus');
kind('Road construction on SR 1 Northbound at DENTON RD.. 2 right lanes are blocked.', 'partial', 'corpus');
kind('Road construction on SR 38 Eastbound at JAMES E JOHNSON . All lanes closed.', 'full', 'corpus');
kind('Wall maintenance. Alternating traffic. Comment: Speed reduced and up to 20-minute delays.', 'none', 'corpus');
kind('Thursday, June 4 until 4 p.m. there will be a right lane closure for bridge work.', 'unclear', 'corpus');
kind('The US 75 overpass at FM 691, the southbound to northbound U-turn, under the US 75 bridge is closed for construction', 'partial', 'corpus');
eq('corpus: cross street on a numbered-route record', R.closureKindOf({ route: 'I-71', title: 'A bridge project on Kugler Mill Road over I-71. Kugler Mill Road is closed through July 6. Nightly lane closures will be in effect on I-71 North.' }), 'unclear');
eq('corpus: local road record', R.closureKindOf({ route: '', title: 'Roadwork - Local Road Full Closure on Mill Road WB from West Mill Road to N 114th Street.' }), 'full');
eq('corpus: restriction in the description limits the title', R.closureKindOf({ route: 'IN-18', title: 'IN-18 \u2014 closed to traffic', desc: 'Closed to traffic \u00b7 Road maintenance operations \u00b7 Local access only' }), 'unspecified');
eq('corpus: numbered route record', R.closureKindOf({ route: 'KS-156', title: 'KS-156 \u2014 closed', desc: 'Closed \u00b7 Major construction project' }), 'full');

// --- Pass 5 (docs/reviews/overview-v5-2026-10-09/v5-review-checks.cjs): all 17 failed on v5 ---
[['I-15 northbound off-ramp closed. I-215 northbound off-ramp reopened.','partial'],
 ['I-15 Exit 10 off-ramp closed. I-15 Exit 12 off-ramp reopened.','partial'],
 ['I-15 northbound shoulder closed. I-215 northbound shoulder reopened.','partial'],
 ['US-20 closed. SR-20 reopened.','full'],
 ['I-15 northbound closed. I-15 southbound right lane reopened.','full'],
 ['US-50 closed. I-15 right lane reopened.','full'],
 ['I-15 northbound closed. I-15 southbound closed to trucks.','full'],
 ['I-15 closed. Local access only on SR-138.','full'],
 ['I-15 would remain closed if repairs were delayed.','unclear'],
 ['I-15 remains closed after an earlier collision.','full'],
 ['I-15 closed due to a previously reported crash.','full'],
 ['I-15 closed. Reopened to emergency vehicles only.','unspecified'],
 ['I-15 closed at the SR-138 interchange.','full'],
 ['I-15 is closed underneath the Main Street overpass.','full'],
 ['Road closure lifted on I-15.','none'],
 ['I-15 closure canceled.','none'],
 ['I-15 is closed. Update: closure canceled.','none'],
].forEach(([s, w]) => kind(s, w, 'pass5'));
// Regressions around each pass 5 rule: identity (system, number, direction, feature, exit) cuts both ways.
[['US-20 closed. US-20 reopened.','none'],
 ['SR-20 closed. SR 20 reopened.','none'],
 ['CA-18 closed. SR-18 reopened.','none'],                 // a state code and SR name the same state route
 ['I-20 closed. US-20 reopened.','full'],
 ['Hwy 20 closed. SR-20 reopened.','full'],                // "Hwy" does not say which system
 ['I-15 northbound off-ramp closed. I-15 northbound off-ramp reopened.','none'],
 ['I-15 Exit 10 off-ramp closed. I-15 Exit 10 off-ramp reopened.','none'],
 ['I-15 Exit 10 off-ramp closed. Exit 10 off-ramp reopened.','none'],
 ['I-15 shoulder closed. I-15 shoulder reopened.','none'],
 ['I-15 closed. Right lane reopened.','unclear'],          // same road: a reopened lane contradicts a full closure
 ['I-15 northbound closed. I-15 northbound right lane reopened.','unclear'],
 ['I-15 closed in both directions. I-15 southbound right lane reopened.','full'], // northbound still closed
 ['I-15 closed to trucks.','unspecified'],
 ['I-15 northbound closed to trucks. I-15 southbound closed to trucks.','unspecified'],
 ['I-15 closed. Local access only.','unspecified'],        // a bare qualifier applies to the record
 ['I-15 closed. Local access only on I-15.','unspecified'],
 ['I-15 northbound closed. Southbound local access only.','full'],
 ['I-15 closed. Reopened to local traffic only.','unspecified'],
 ['I-15 closed. I-15 reopened to all traffic.','none'],
 ['I-15 is open to one lane.','partial'],     // only one lane open is a lane closure
 ['I-15 closed earlier today due to a crash.','none'],
 ['I-15 was previously closed.','none'],
 ['Following an earlier crash, I-15 is closed.','full'],
 ['I-15 will remain closed until further notice.','full'],
 ['I-15 continues to be closed.','full'],
 ['I-15 may remain closed overnight.','unclear'],
 ['I-15 would be closed if snow falls.','unclear'],
 ['I-15 closure has been lifted.','none'],
 ['Chain restrictions lifted on I-15.','none'],
 ['I-15 closed. Closure canceled for SR-138.','full'],     // a cancellation on another road changes nothing
 ['SR-138 off-ramp closed at the I-15 interchange.','partial'],
 ['Right lane closed near the Main Street overpass.','partial'],
 ['The overpass is closed.','partial'],
 ['Closure of the I-15 off-ramp at Exit 10.','partial'],
].forEach(([s, w]) => kind(s, w, 'pass5-regression'));
eq('detail: truck restriction is restricted', R.closureDetail('Road closed to trucks').restricted, true);
eq('detail: partial feature named', R.closureDetail('Rest area closed').features.join(','), 'rest area');
eq('detail: ramp feature named', R.closureDetail('I-15 Exit 10 off-ramp closed').features.join(','), 'ramp');
// The complete text is classified, not a shortened display field.
const longDesc = 'I-15 closed. ' + 'Crews are removing debris from the pavement. '.repeat(25) + 'I-15 reopened.';
eq('full text: a reopening at the end of a long report counts', R.closureKindOf({ route: 'I-15', title: 'I-15 closed.', desc: longDesc.slice(0, 698), text: R.fullText('I-15 closed.', longDesc, '') }), 'none');
eq('full text: shortened desc alone would have been full', R.closureKindOf({ route: 'I-15', title: 'I-15 closed.', desc: longDesc.slice(0, 698) }), 'full');
eq('fullText keeps impact text not already in the description', R.fullText('Crash', 'Crash on I-15', 'All lanes closed'), 'Crash\nCrash on I-15\nAll lanes closed');
// Feed health: one rule for every page.
eq('feedHealth ok', R.feedHealth({ x: [1] }, 'x').cls, 'ok');
eq('feedHealth ok:false with rows gives no rows', R.feedHealth({ ok: false, x: [1] }, 'x').rows.length, 0);
eq('feedHealth failed status', R.feedHealth({ source_status: 'failed', x: [1] }, 'x').cls, 'failed');
eq('feedHealth partial keeps rows', R.feedHealth({ source_status: 'partial', x: [1] }, 'x').rows.length, 1);
eq('feedHealth partial with no rows is failed', R.feedHealth({ source_status: 'partial', x: [] }, 'x').cls, 'failed');
eq('feedHealth missing payload', R.feedHealth(null, 'x').cls, 'failed');
eq('timingGap none', R.timingGap({ t0: NaN, t1: NaN }), 'none');
eq('timingGap incomplete', R.timingGap({ t0: 1, t1: NaN }), 'incomplete');
eq('timingGap invalid', R.timingGap({ t0: 2, t1: 1 }), 'invalid');
eq('timingGap complete', R.timingGap({ t0: 1, t1: 2 }), '');

// --- Timing: one rule for every surface ---
const now = Date.parse('2026-10-09T17:00:00Z'), H = 3600e3;
eq('timing current', R.timingState({ t0: now - H, t1: now + H }, now), 'current');
eq('timing upcoming', R.timingState({ t0: now + H, t1: now + 2 * H }, now), 'upcoming');
eq('timing ended', R.timingState({ t0: now - 2 * H, t1: now - H }, now), 'ended');
eq('timing open (no end)', R.timingState({ t0: now - H, t1: NaN }, now), 'open');
eq('timing unknown (no times)', R.timingState({ t0: NaN, t1: NaN }, now), 'unknown');
eq('timing unknown (reversed)', R.timingState({ t0: now + H, t1: now - H }, now), 'unknown');
eq('timing unknown (end only)', R.timingState({ t0: NaN, t1: now + H }, now), 'unknown');
eq('timing start exactly now is current', R.timingState({ t0: now, t1: now + H }, now), 'current');
eq('timing end exactly now is ended', R.timingState({ t0: now - H, t1: now }, now), 'ended');
eq('current report: unknown counts', R.isCurrentReport({ t0: NaN, t1: NaN }, now), true);
eq('current report: upcoming does not', R.isCurrentReport({ t0: now + H, t1: now + 2 * H }, now), false);
eq('full closure needs full kind', R.isFullClosure({ type: 'CL', title: 'Right lane closed', t0: now - H, t1: now + H }, now), false);
eq('full closure, current', R.isFullClosure({ type: 'CL', title: 'Roadway is closed', t0: now - H, t1: now + H }, now), true);
// CHANGED in pass 7: no agency times is not an active window, so it is a closure report, not a full closure.
eq('full closure, unknown timing is a closure report', R.isFullClosure({ type: 'CL', title: 'Roadway is closed', t0: NaN, t1: NaN }, now), false);
eq('unknown timing still counted by the banner', R.isCountedClosure({ type: 'CL', title: 'Roadway is closed', t0: NaN, t1: NaN }, now), true);
eq('full closure, upcoming is not current', R.isFullClosure({ type: 'CL', title: 'Roadway is closed', t0: now + H, t1: now + 2 * H }, now), false);
// CHANGED in pass 7: the agency typed this a crash, not a closure. Text alone never makes a full closure.
eq('crash text alone is not a full closure', R.isFullClosure({ type: 'AC', title: 'Crash. All lanes closed.', t0: now - H, t1: NaN }, now), false);
eq('start known and no end is an active window', R.isFullClosure({ type: 'CL', title: 'Crash. All lanes closed.', t0: now - H, t1: NaN }, now), true);

// --- Pass 6 (docs/reviews/overview-v6-2026-10-09/v6-review-checks.cjs): text cases N1-N14 ---
const N = [
 ['N1','I-15 closed. I-15 has not reopened.','full'],
 ['N2','I-15 closed. I-15 is not open to traffic.','full'],
 ['N3','I-15 closed. I-15 will not reopen until noon.','full'],
 ['N4','I-15 closed again after previously reopening.','full'],
 ['N5','I-15 closed. If repairs finish, I-15 reopens.','full'],
 ['N6','I-15 closed. I-15 reopens October 12.','full'],
 ['N7','I-15 Exit 10 off-ramp closed and I-15 Exit 12 off-ramp reopened.','partial'],
 ['N8','I-15 closed. Off-ramp access for local traffic only.','full'],
 ['N10','I-15 northbound: all lanes closed. I-15 northbound reopened.','none'],
 ['N11','I-15 closed only to heavy trucks.','unspecified'],
 ['N12','I-15 closed for trucks over 10 tons.','unspecified'],
 ['N13','I-15 closed if avalanche control is needed.','unclear'],
 ['N14','US-30 closed. US-30A reopened.','full'],
];
N.forEach(([id, s, w]) => eq('pass6 ' + id + ': ' + s, R.closureDetail(s, id === 'N14' ? 'US-30' : 'I-15').kind, w));
eq('pass6 N9: the affected road is I-215', R.closureDetail('I-15 reopened. I-215 closed due to crash.', 'I-15').roads.join(','), 'i215');
eq('pass6 N9: an I-15 record whose text closes I-215 is not an I-15 full closure', R.isFullClosure({ type: 'CL', route: 'I-15', title: 'I-15 reopened. I-215 closed due to crash.', t0: now - H, t1: now + H }, now), false);
eq('pass6 N9: still counted as a closure report', R.isCountedClosure({ type: 'CL', route: 'I-15', title: 'I-15 reopened. I-215 closed due to crash.', t0: now - H, t1: now + H }, now), true);
eq('pass6 N14: US-30A is its own road', R.roadKeyName(R.closureDetail('US-30A closed').roads[0] === 'road' ? '' : 'us30a'), 'US-30A');
// Regressions around each pass 6 rule.
[['I-15 closed. I-15 has not yet reopened.','full'],
 ['I-15 closed. I-15 reopened.','none'],
 ['I-15 closed. I-15 reopens at 5 PM.','full'],
 ['I-15 closed. I-15 reopens Monday.','full'],
 ['I-15 closed. Once crews finish, I-15 reopens.','full'],
 ['I-15 is not yet open.','unspecified'],              // says not open, gives no extent
 ['I-15 Exit 10 off-ramp closed and I-15 Exit 10 off-ramp reopened.','none'],
 ['Off-ramp at Exit 10 closed and off-ramp at Exit 12 closed.','partial'],
 ['I-15 closed. Off-ramp open to local traffic only.','full'],
 ['I-15 closed. Local traffic only.','unspecified'],
 ['US-30A closed. US-30 reopened.','full'],
 ['I-25N closed. I-25 reopened.','none'],              // a trailing N is a direction, not a suffix
 ['I-15 southbound: all lanes closed. I-15 northbound reopened.','full'],
 ['I-15 closed due to an overturned truck.','full'],   // a cause is not a vehicle limit
 ['I-15 closed to vehicles over 10 tons.','unspecified'],
 ['I-15 closed to semis.','unspecified'],
 ['I-15 closed when needed for blasting.','unclear'],
 ['I-15 closed unless conditions improve.','unclear'],
].forEach(([s, w]) => kind(s, w, 'pass6-regression'));
eq('roadKeyName interstate', R.roadKeyName('i215'), 'I-215');
eq('roadKeyName state route', R.roadKeyName('sr138'), 'SR-138');
eq('roadKeyName generic', R.roadKeyName('r20'), 'Route 20');
// The structured-data rule (pass 7 approach).
const CLr = (title, t0, t1, extra) => Object.assign({ type: 'CL', route: 'I-15', title, t0, t1 }, extra || {});
eq('rule: CL + active + full text = full', R.isFullClosure(CLr('I-15 closed', now - H, now + H), now), true);
eq('rule: RW with full text is not full', R.isFullClosure(CLr('I-15 closed for bridge work', now - H, now + H, { type: 'RW' }), now), false);
eq('rule: CL + truck limit is not full', R.isFullClosure(CLr('I-15 closed to trucks', now - H, now + H), now), false);
eq('rule: CL + conditional is not full', R.isFullClosure(CLr('I-15 closed if avalanche control is needed', now - H, now + H), now), false);
eq('rule: CL + upcoming is not full', R.isFullClosure(CLr('I-15 closed', now + H, now + 2 * H), now), false);
eq('rule: CL + reopened text is a neutral report, still counted', [R.reportTag(CLr('I-15 closed. I-15 reopened.', now - H, now + H), now, TAGS0()).join(':'), R.isCountedClosure(CLr('I-15 closed. I-15 reopened.', now - H, now + H), now)].join('|'), 'ot:Report|true');
eq('rule: text never upgrades a crash to a closure tag', R.reportTag({ type: 'AC', route: 'I-15', title: 'Crash. All lanes closed.', t0: now - H, t1: NaN }, now, TAGS0()).join(':'), 'ac:Crash');
eq('rule: record with a named road and no number', R.isFullClosure(CLr('Main Street closed', now - H, now + H, { route: '' }), now), true);
function TAGS0() { return { CL: ['ot', 'Report'], AC: ['ac', 'Crash'], OT: ['ot', 'Alert'] }; }
// Display keeps the complete words, or every qualifying sentence when it must shorten.
const filler = 'Crews continue debris removal and equipment staging near the reported location. '.repeat(18);
const w15 = R.agencyWords({ text: 'I-15 closed. ' + filler + 'I-15 reopened to emergency vehicles only.' }, 300);
eq('agencyWords keeps the decisive qualification when shortened', /I-15 reopened to emergency vehicles only\.$/.test(w15) && w15.length < 420, true);
eq('agencyWords returns short text whole', R.agencyWords({ title: 'I-15 closed.', desc: 'Detour via SR-138.' }, 300), 'I-15 closed. Detour via SR-138.');
eq('fullText drops a headline the description repeats', R.fullText('I-15 closed.', 'I-15 closed. Detour via SR-138.', ''), 'I-15 closed. Detour via SR-138.');

// --- Labels: never "Closed"; none never partial ---
const TAGS = { CL: ['cl', 'Closed'], AC: ['ac', 'Crash'], OT: ['ot', 'Alert'] };
const tagOf = (a) => R.reportTag(a, now, TAGS).join(':');
eq('tag full current', tagOf({ type: 'CL', title: 'Roadway is closed', t0: now - H, t1: now + H }), 'cl:Full closure');
// CHANGED in pass 7: unknown timing is a closure report.
eq('tag full text, unknown timing', tagOf({ type: 'CL', title: 'Roadway is closed', t0: NaN, t1: NaN }), 'ot:Closure report');
eq('tag none (CL) is a report', tagOf({ type: 'CL', title: 'No full closure', t0: now - H, t1: now + H }), 'ot:Report');
eq('tag reopened (CL) is a report', tagOf({ type: 'CL', title: 'Road closed. Road reopened to traffic.', t0: NaN, t1: NaN }), 'ot:Report');
// CHANGED in pass 7: no extent label from parsed text; the agency's words carry it.
eq('tag partial text', tagOf({ type: 'CL', title: 'Right lane closed', t0: NaN, t1: NaN }), 'ot:Closure report');
// CHANGED in pass 7: same reason.
eq('tag unspecified text', tagOf({ type: 'CL', title: 'Closure reported', t0: NaN, t1: NaN }), 'ot:Closure report');
eq('tag unclear', tagOf({ type: 'CL', title: 'Road may be closed', t0: NaN, t1: NaN }), 'ot:Closure report');
eq('tag restricted closure is a closure report, not "extent not stated"', tagOf({ type: 'CL', title: 'Road closed to trucks', t0: NaN, t1: NaN }), 'ot:Closure report');
eq('tag upcoming', tagOf({ type: 'CL', title: 'Roadway is closed', t0: now + H, t1: now + 2 * H }), 'rw:Planned');
eq('tag crash keeps its type', tagOf({ type: 'AC', title: 'Crash on I-15', t0: NaN, t1: NaN }), 'ac:Crash');
for (const k of ['No full closure', 'Road is not closed', 'Road closed. Road reopened.', 'Right lane closed', 'Closure reported', 'Road may be closed']) {
  for (const t of [[now - H, now + H], [NaN, NaN], [now - H, NaN], [now + H, now + 2 * H]]) {
    const tag = R.reportTag({ type: 'CL', title: k, t0: t[0], t1: t[1] }, now, TAGS)[1];
    eq('never "Closed": ' + k + ' ' + t, tag === 'Closed', false);
  }
}
eq('never "Closed" anywhere for none', ['No full closure', 'Road is not closed'].some(k => /partial/i.test(tagOf({ type: 'CL', title: k, t0: now - H, t1: now + H }))), false);

// --- Timing text names the zone and never claims open or closed ---
const pt = R.timingText({ st: 'CA', t0: now - H, t1: now + H }, now);
eq('timing text current', pt, 'Scheduled window underway. Agency end time Fri, Oct 9, 11:00 AM PDT.');
eq('timing text unknown', R.timingText({ st: 'CA', t0: NaN, t1: NaN }, now), 'Timing not supplied by the agency.');
eq('timing text open', R.timingText({ st: 'UT', t0: now - H, t1: NaN }, now), 'Agency start time Fri, Oct 9, 10:00 AM MDT. End time not supplied.');
eq('timing text upcoming', R.timingText({ st: 'WA', t0: now + H, t1: now + 2 * H }, now), 'Scheduled start Fri, Oct 9, 11:00 AM PDT. Scheduled end Fri, Oct 9, 12:00 PM PDT.');
eq('timing text reversed', /do not form a valid window/.test(R.timingText({ st: 'CA', t0: now + H, t1: now - H }, now)), true);
eq('zone UT', R.zoneFor('UT'), 'America/Denver');
eq('zone CO', R.zoneFor('co'), 'America/Denver');
eq('zone AK', R.zoneFor('AK'), 'America/Anchorage');
eq('zone FL', R.zoneFor('FL'), 'America/New_York');
eq('clock UT says MDT', R.clockIn(now, R.zoneFor('UT')), '11:00 AM MDT');
eq('clock CA says PDT', R.clockIn(now, R.zoneFor('CA')), '10:00 AM PDT');

// --- Sources come from the record ---
eq('source CHP', R.sourceOf({ id: 'CA-chp-260926SA0379', st: 'CA' }), 'CHP');
eq('source CMS', R.sourceOf({ id: 'CA-CMS-12', st: 'CA' }), 'Caltrans message sign');
eq('source Caltrans', R.sourceOf({ id: 'CA-LCS-1', st: 'CA' }), 'Caltrans');
eq('source UDOT', R.sourceOf({ id: 'x', st: 'UT' }), 'UDOT');
eq('source unknown state', R.sourceOf({ id: 'x', st: 'ZZ' }), 'ZZ DOT');
eq('source non-California record is never Caltrans', R.sourceOf({ id: '', st: 'WA' }) === 'Caltrans', false);

// --- County rule: no California or Nevada mile range without matching counties ---
eq('CA range suppressed', R.mileText({ st: 'CA', mp: 12.2, end: { mp: 15.9 } }), ' · MP 12');
eq('NV range suppressed', R.mileText({ st: 'NV', mp: 3, end: { mp: 8 } }), ' · MP 3');
eq('CA range with matching counties', R.mileText({ st: 'CA', mp: 12, end: { mp: 15, county: 'SBD' }, county: 'SBD' }), ' · MP 12 to 15');
eq('CA range with different counties', R.mileText({ st: 'CA', mp: 12, end: { mp: 15, county: 'LA' }, county: 'SBD' }), ' · MP 12');
eq('WA range shown', R.mileText({ st: 'WA', mp: 52, end: { mp: 55 } }), ' · MP 52 to 55');
eq('unknown state: no range', R.mileText({ mp: 52, end: { mp: 55 } }), ' · MP 52');
eq('no mile', R.mileText({ st: 'WA', mp: '' }), '');

console.log(n + ' checks, ' + bad + ' failed');
process.exit(bad ? 1 : 0);
