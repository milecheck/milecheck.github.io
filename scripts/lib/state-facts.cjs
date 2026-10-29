// state-facts.cjs — a short, sourced "facts about this state" block for /road-conditions/<state>/.
// Every line comes from data already on the site: data/clearance-times.json (MileCheck's incident
// archive), data/rest-area-rules.json (rules read on an official page), the chain-law ledes in
// scripts/gen-chain-law-pages.js (each sourced there) and data/seasonal-closures.json. A line is left
// out when the state has no data for it, so nothing is filled in with a guess. No rankings and no
// comparison between states. 2026-10-29.
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const hm = (m) => m < 60 ? `${m} min` : `${Math.floor(m / 60)} hr${m % 60 >= 8 ? ` ${Math.round(m % 60 / 5) * 5} min` : ''}`; // same as gen-clearance-times.mjs
const dateText = (iso) => new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

const CLEAR = readJson('data/clearance-times.json');
const CLEAR_BY = Object.fromEntries(CLEAR.states.map((s) => [s.st, s]));
const REST = readJson('data/rest-area-rules.json');
const REST_BY = Object.fromEntries(REST.states.map((s) => [s.code, s]));
const SEASONAL = readJson('data/seasonal-closures.json').filter((s) => s.name && !/reopen timing|as listed by/i.test(s.name));
const { PAGES: CHAIN, COMBINED } = require('../gen-chain-law-pages.js');
const CHAIN_BY = Object.fromEntries(CHAIN.map((p) => [p.code, p]));

const fileExists = (p) => fs.existsSync(path.join(ROOT, p));

// rc = one entry of road-conditions/states.cjs; slug = its page slug.
function stateFacts(rc, slug) {
  const items = [];
  const c = CLEAR_BY[rc.code];
  if (c && c.n >= 10) {
    items.push(`<li><b>Crash clearance.</b> From ${dateText(CLEAR.from)} to ${dateText(CLEAR.to)}, ${c.n.toLocaleString('en-US')} crashes on the ${esc(rc.dot)} feed were seen on at least two reads. A crash stayed posted a median of ${hm(c.median)}, and for the middle half it was between ${hm(c.p25)} and ${hm(c.p75)}. Each DOT decides when to post and remove a crash, so compare ${esc(rc.name)} with ${esc(rc.name)} over time, not with other states. <a href="/how-long-do-crashes-take-to-clear/">How the numbers are made</a>.</li>`);
  }
  const ch = CHAIN_BY[rc.code];
  if (ch && fileExists(`chain-laws/${slug}/index.html`)) {
    items.push(`<li><b>Chain law.</b> ${esc(ch.lede)} <a href="/chain-laws/${slug}/">${esc(rc.name)} chain law, with sources</a>.</li>`);
  } else if (COMBINED.codes.includes(rc.code) && fileExists(`chain-laws/${COMBINED.slug}/index.html`)) {
    const b = COMBINED.blocks.find((x) => x[0] === rc.code);
    if (b) items.push(`<li><b>Chains.</b> ${esc(b[1])} <a href="/chain-laws/${COMBINED.slug}/">Chain and traction notes for Arizona, New Mexico and Alaska</a>.</li>`);
  }
  const r = REST_BY[rc.code];
  if (r && fileExists(`rest-areas/${slug}/index.html`)) {
    items.push(`<li><b>Sleeping at a rest area.</b> ${esc(r.answer)} Source: <a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.source)}</a>. <a href="/rest-areas/${slug}/">${esc(rc.name)} rest area rules</a>.</li>`);
  }
  const seasonal = SEASONAL.filter((s) => String(s.state).split('/').includes(rc.code));
  if (seasonal.length && fileExists(`seasonal/${slug}/index.html`)) {
    const show = seasonal.slice(0, 3).map((s) => `${esc(s.name.replace(/\s*\(.*$/, ''))}: ${esc((s.publicLine || s.typicalClose || '').replace(/\.$/, ''))}`);
    items.push(`<li><b>Roads that close for winter.</b> ${show.join('. ')}. ${seasonal.length > 3 ? `${seasonal.length - 3} more ${seasonal.length - 3 === 1 ? 'is' : 'are'} listed. ` : ''}<a href="/seasonal/${slug}/">Seasonal closures in ${esc(rc.name)}</a>.</li>`);
  }
  return items;
}
module.exports = { stateFacts };
