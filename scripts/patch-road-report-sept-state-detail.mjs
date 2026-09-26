#!/usr/bin/env node
// One-off patch: consolidates the September Road Report's three separate per-state
// tables (crashes / wildfires / snow-ice mentions) into one "State activity" table,
// adds a full alphabetical state-by-state <details> accordion below it (Leah asked
// for this expand-by-state list before; the Sept 3 Labor Day build had an inline
// version of it, later replaced there by separate pages -- this report stays inline
// since it's one monthly digest, not 51 pages), and refreshes every number on the
// page from the latest archive pull (data/road-report-september-2026.json) so the
// whole page comes from one consistent snapshot instead of two different pulls.
//
//   node scripts/patch-road-report-sept-state-detail.mjs
//
// Edit this script and re-run for the next correction, don't hand-edit the numbers
// in the HTML -- that's exactly the transcription risk this script exists to remove.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const D = JSON.parse(readFileSync(resolve(ROOT, 'data/road-report-september-2026.json'), 'utf8'));
const PAGE = resolve(ROOT, 'blog/road-report-september-2026.html');

const NAMES = { AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming', BC: 'British Columbia' };
const n = (x) => Number(x || 0).toLocaleString('en-US');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const title = (s) => {
  // Title-case a highway name ("DALTON HIGHWAY" -> "Dalton Highway"), then re-uppercase
  // any route-code prefix ("Ar-123", "Ri-146", "Us-9" -> "AR-123", "RI-146", "US-9") --
  // route codes use every state's 2-letter abbreviation, not just I-/US-/SR-.
  let t = String(s).replace(/\s+/g, ' ').trim().toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase());
  return t.replace(/\b([A-Za-z]{1,3})-(\d)/g, (m, p, d) => p.toUpperCase() + '-' + d);
};

// ---------- top-line numbers, all from one snapshot ----------
const T = D.byType, TOTAL = D.totalUniqueEvents;
const K = D.keywordCounts, KS_ = D.keywordSamples, KBS = D.keywordByState;
const FIRES = D.wildfires;

// ---------- long-term closures: drop the NY entry that's really Connecticut's
// Wallingford–Meriden segment riding NY's feed (same issue fixed in the Labor Day
// recap on 2026-09-22 -- same fix applies here, this page just hadn't had it yet) ----------
const longTerm = D.longTermProjects.filter((p) => !(p.state === 'NY' && p.route === 'I-91')).slice(0, 6);
const dateLong = (iso) => { const [y, mo, d] = iso.split('-').map(Number); return new Date(Date.UTC(y, mo - 1, d)).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long', day: 'numeric', year: 'numeric' }); };

// ---------- consolidated "State activity" table: top 10 by total events ----------
const byTotal = [...D.jurisdictionSummary].sort((a, b) => b.total - a.total).slice(0, 10);
const stateTableRows = byTotal.map((j) => {
  const snowice = (KBS.snowice && KBS.snowice[j.state]) || 0;
  return `        <tr><td>${esc(NAMES[j.state])}</td><td>${n(j.total)}</td><td>${n(j.crash)}</td><td>${j.fires ? `${n(j.fires)} / ${n(j.acres)} ac` : '—'}</td><td>${snowice || '—'}</td></tr>`;
}).join('\n');

// ---------- full A-Z accordion, all 51 jurisdictions ----------
const CAT_LABEL = {
  crash: ['crash', 'crashes'], closure: ['closure', 'closures'],
  construction: ['construction record', 'construction records'], weather: ['weather record', 'weather records'],
  hazard: ['hazard record', 'hazard records'], other: ['other record', 'other records'],
};
function detailBody(j) {
  const parts = [];
  if (j.total === 0) {
    parts.push(`<p>No events were archived from ${esc(NAMES[j.state])}'s feed in this window. That can mean a live feed issue, not necessarily a quiet month &mdash; see the data limitations above.</p>`);
  } else {
    const cats = ['crash', 'closure', 'construction', 'weather', 'hazard', 'other']
      .filter((c) => j[c] > 0)
      .map((c) => `${n(j[c])} ${CAT_LABEL[c][j[c] === 1 ? 0 : 1]}`);
    parts.push(`<p>${cats.join(', ')}${cats.length > 1 ? ',' : ''} for ${n(j.total)} total events.</p>`);
  }
  if (j.fires > 0) parts.push(`<p>${n(j.fires)} active ${j.fires === 1 ? 'fire' : 'fires'}, ${n(j.acres)} acres.</p>`);
  const mentions = [];
  if (KBS.snowice[j.state]) mentions.push(`${KBS.snowice[j.state]} snow or ice`);
  if (KBS.fire[j.state]) mentions.push(`${KBS.fire[j.state]} fire`);
  if (KBS.flood[j.state]) mentions.push(`${KBS.flood[j.state]} flooding`);
  if (KBS.fatal[j.state]) mentions.push(`${KBS.fatal[j.state]} fatal-tagged`);
  if (mentions.length) parts.push(`<p>Keyword mentions on the feed: ${mentions.join(', ')}.</p>`);
  if (j.topRoutes && j.topRoutes.length) parts.push(`<p>Most-mentioned routes: ${j.topRoutes.map((r) => esc(title(r))).join(', ')}.</p>`);
  return parts.join('\n          ');
}
const accordionItems = Object.keys(NAMES).sort((a, b) => NAMES[a].localeCompare(NAMES[b])).map((st) => {
  const j = D.jurisdictionSummary.find((x) => x.state === st);
  if (!j) return '';
  return `      <details class="state-acc">
        <summary>${esc(NAMES[st])} &mdash; ${n(j.total)} events</summary>
        <div class="state-detail">
          ${detailBody(j)}
        </div>
      </details>`;
}).join('\n');

// ---------- read + patch the page ----------
let html = readFileSync(PAGE, 'utf8');
const replace = (label, from, to) => {
  // split/join, not a single .replace() -- some anchors (the lead-paragraph number)
  // appear twice on the page (meta description + visible text) and both need the
  // fresh number; a plain .replace() silently patches only the first hit, which is
  // exactly the bug this script exists to prevent.
  const count = html.split(from).length - 1;
  if (count === 0) throw new Error(`Anchor not found for "${label}" -- page may have changed under this script`);
  html = html.split(from).join(to);
  console.log(`  replaced "${label}": ${count} occurrence${count === 1 ? '' : 's'}`);
  return count;
};

// lead paragraph
replace('lead paragraph total', '30,835 road events across all 50 states and British Columbia', `${n(TOTAL)} road events across all 50 states and British Columbia`);

// stat band
replace('stat band', `        <div class="stat-cell"><span class="stat-num">30,835</span><span class="stat-label">total events</span></div>
        <div class="stat-cell"><span class="stat-num">21,399</span><span class="stat-label">construction</span></div>
        <div class="stat-cell"><span class="stat-num">4,519</span><span class="stat-label">closures</span></div>
        <div class="stat-cell"><span class="stat-num">1,927</span><span class="stat-label">crashes posted by DOTs</span></div>`,
  `        <div class="stat-cell"><span class="stat-num">${n(TOTAL)}</span><span class="stat-label">total events</span></div>
        <div class="stat-cell"><span class="stat-num">${n(T.construction)}</span><span class="stat-label">construction</span></div>
        <div class="stat-cell"><span class="stat-num">${n(T.closure)}</span><span class="stat-label">closures</span></div>
        <div class="stat-cell"><span class="stat-num">${n(T.crash)}</span><span class="stat-label">crashes posted by DOTs</span></div>`);

// remove "Crashes by state" section (h2 through its caption), replaced by the
// consolidated table + accordion inserted after "Busiest corridors" below
const crashesByStateBlock = `      <h2 class="rc">Crashes by state</h2>
      <p>1,927 crashes were posted from September 1 through 25, across the 41 states and provinces that publish crash data on their feed. California reports the most crashes and carries the most traffic, so it leads any national list by volume, not necessarily by rate.</p>
      <table class="data-table">
        <tr><th>State</th><th>Crashes</th></tr>
        <tr><td>California</td><td>255</td></tr>
        <tr><td>Alabama</td><td>209</td></tr>
        <tr><td>New York</td><td>189</td></tr>
        <tr><td>Arizona</td><td>134</td></tr>
        <tr><td>Wisconsin</td><td>133</td></tr>
        <tr><td>Oregon</td><td>109</td></tr>
        <tr><td>Georgia</td><td>101</td></tr>
        <tr><td>Utah</td><td>96</td></tr>
        <tr><td>Virginia</td><td>82</td></tr>
        <tr><td>Florida</td><td>64</td></tr>
      </table>
      <p style="font-size:13px;color:#5A6670;margin:-14px 0 20px;">See the crash-data limitations above before comparing states.</p>

      `;
replace('remove crashes-by-state block', crashesByStateBlock, '      ');

// corridors table -- refresh numbers
replace('corridors table', `        <tr><td>I-80</td><td>855</td></tr>
        <tr><td>I-95</td><td>560</td></tr>
        <tr><td>I-10</td><td>502</td></tr>
        <tr><td>I-287</td><td>436</td></tr>
        <tr><td>US-1</td><td>427</td></tr>
        <tr><td>I-70</td><td>402</td></tr>
        <tr><td>I-41</td><td>362</td></tr>
        <tr><td>I-94</td><td>353</td></tr>`,
  D.topCorridors.slice(0, 8).map(([r, c]) => `        <tr><td>${esc(r)}</td><td>${n(c)}</td></tr>`).join('\n'));

// still-closed list -- drop the NY/CT record, refresh to the real top 6
replace('still-closed list', `          <li><strong>Wisconsin, I-535</strong> &mdash; 2,616 days, April 8, 2022 through June 6, 2029</li>
          <li><strong>Virginia, I-81</strong> &mdash; 2,195 days, March 28, 2025 through April 1, 2031</li>
          <li><strong>Texas, US-87</strong> &mdash; 2,070 days, March 2, 2026 through October 31, 2031</li>
          <li><strong>Washington, SR-165</strong> &mdash; 1,902 days, April 16, 2025 through July 1, 2030 &mdash; the Carbon River/Fairfax Bridge, closed to all vehicles, bicyclists, and pedestrians</li>
          <li><strong>North Carolina, US-17</strong> &mdash; 1,859 days, November 28, 2022 through December 31, 2027</li>
          <li><strong>New York, I-91</strong> &mdash; 1,733 days, March 4, 2024 through December 1, 2028</li>`,
  longTerm.map((p) => `          <li><strong>${esc(NAMES[p.state] || p.state)}, ${esc(p.route || '')}</strong> &mdash; ${n(p.projectDays)} days, ${dateLong(p.start)} through ${dateLong(p.end)}${p.state === 'WA' ? ' &mdash; the Carbon River/Fairfax Bridge, closed to all vehicles, bicyclists, and pedestrians' : ''}</li>`).join('\n'));

// remove the "Wildfires" section entirely (h2 + paragraph + table); its national
// total moves into the new consolidated section's intro paragraph below
const wildfiresBlock = `      <h2 class="rc">Wildfires</h2>
      <p>2,326 fires, deduped by fire id and counted at each one's largest reported size, covering 6,301,607 acres across the states and provinces MileCheck tracks.</p>
      <table class="data-table">
        <tr><th>State / province</th><th>Fires</th><th>Acres</th></tr>
        <tr><td>Oregon</td><td>228</td><td>2,942,779</td></tr>
        <tr><td>British Columbia</td><td>117</td><td>1,034,563</td></tr>
        <tr><td>Washington</td><td>118</td><td>681,415</td></tr>
        <tr><td>Utah</td><td>55</td><td>338,368</td></tr>
        <tr><td>Idaho</td><td>67</td><td>210,358</td></tr>
        <tr><td>Colorado</td><td>42</td><td>165,470</td></tr>
        <tr><td>Nevada</td><td>33</td><td>164,794</td></tr>
        <tr><td>Texas</td><td>105</td><td>143,948</td></tr>
        <tr><td>Montana</td><td>162</td><td>133,572</td></tr>
        <tr><td>California</td><td>505</td><td>87,544</td></tr>
      </table>

      `;
const stateActivitySection = `      <h2 class="rc">State activity</h2>
      <p>${n(TOTAL)} events, ${n(T.crash)} crashes, and ${n(FIRES.totalFires)} active wildfires covering ${n(FIRES.totalAcres)} acres, across every jurisdiction MileCheck tracks. The ten most active by total feed volume:</p>
      <table class="data-table">
        <tr><th>State</th><th>Total events</th><th>Crashes</th><th>Fires / acres</th><th>Snow or ice mentions</th></tr>
${stateTableRows}
      </table>
      <p style="font-size:13px;color:#5A6670;margin:-14px 0 20px;">A high total can mean a more detailed feed, not a busier month. Crash counts exclude Alaska, Arkansas, Hawaii, Kentucky, Maine, North Dakota, New Mexico, Oklahoma, South Dakota, and West Virginia &mdash; their live DOT feeds don't carry crashes. Snow-or-ice mentions are a keyword match on the event's own text, not weather-station data.</p>

      <h2 class="rc">Every state and province</h2>
      <p>The same measures for all 51 jurisdictions, alphabetically. Tap a name to expand it.</p>
${accordionItems}

      `;
replace('remove wildfires block, insert state activity + accordion', wildfiresBlock, stateActivitySection);

// remove the "Snow or ice mentions by state" table + its keyword-match caveat
// (both now covered by the consolidated table / accordion above); keep the
// snowplow-states line, which is still new information
const snowIceBlock = `      <table class="data-table">
        <tr><th>State / province</th><th>Snow or ice mentions</th></tr>
        <tr><td>South Dakota</td><td>194</td></tr>
        <tr><td>Washington</td><td>101</td></tr>
        <tr><td>California</td><td>74</td></tr>
        <tr><td>New Jersey</td><td>61</td></tr>
        <tr><td>Colorado</td><td>60</td></tr>
        <tr><td>Delaware</td><td>54</td></tr>
        <tr><td>Montana</td><td>43</td></tr>
        <tr><td>British Columbia</td><td>38</td></tr>
        <tr><td>Texas</td><td>22</td></tr>
        <tr><td>Alabama</td><td>18</td></tr>
      </table>
      <p style="font-size:13px;color:#5A6670;margin:-14px 0 20px;">Counted by keyword match on the event's own text (snow, ice, or chain), not by weather station data. A high count can mean early-season mountain-pass activity (South Dakota, Colorado, Montana) or routine winter road-treatment language a DOT uses even for a light frost.</p>
      `;
replace('remove snow-ice-by-state table', snowIceBlock, '      ');

// winter paragraph -- keep in sync with the same snapshot (values unchanged this pull, but computed, not typed)
replace('winter paragraph', '787 events in this window mentioned snow or ice on the road surface. 192 mentioned fire, 98 mentioned flooding, and 6 were tagged fatal by the reporting DOT.',
  `${n(K.snowice)} events in this window mentioned snow or ice on the road surface. ${n(K.fire)} mentioned fire, ${n(K.flood)} mentioned flooding, and ${n(K.fatal)} were tagged fatal by the reporting DOT.`);

// fatal-crashes intro -- keep in sync too
replace('fatal crashes intro', '6 events in this window were tagged fatal by the reporting DOT &mdash; 5 in California, 1 in New York.',
  `${n(K.fatal)} events in this window were tagged fatal by the reporting DOT &mdash; ${KS_.fatal.filter((f) => f.state === 'CA').length} in California, ${KS_.fatal.filter((f) => f.state === 'NY').length} in New York.`);

writeFileSync(PAGE, html);
console.log('Patched', PAGE);
console.log('State activity table rows:', byTotal.length, '| accordion entries:', Object.keys(NAMES).length);
