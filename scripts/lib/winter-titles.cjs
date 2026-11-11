// winter-titles.cjs — the winter search titles in one place (2026-11-01).
// The generators read this, and scripts/winter-retitle.mjs applies it to the built pages without regenerating them.
// Source: Search Console, 28 days to 2026-10-30: no query with snow, ice or chain in it earned an impression,
// while "snoqualmie pass webcam / conditions / road conditions / wsdot" earned 26,928 on one page at 0.5% click rate.
'use strict';
// Road-conditions state pages that get the snow, ice and chains wording. Only states where the site really has chain rules.
const SNOW_STATES = new Set(['washington', 'oregon', 'colorado', 'utah', 'idaho', 'montana']);
const snowState = (name, dot) => ({
  title: `${name} road conditions: snow, ice and chains now | MileCheck`,
  desc: `Live ${name} road conditions from ${dot}: snow and ice reports, chain and traction rules, closures and crashes by route and mile marker, cameras and passes. Checked every five minutes.`,
});
// One-off pages, keyed by path from the site root. h1 is optional.
const PAGES = {
  'passes/snoqualmie': {
    // 2026-11-11 (Leah "titles go", ChatGPT copy): aimed at "snoqualmie pass weather", where we had no page-one result.
    title: 'What is the weather at Snoqualmie Pass? | MileCheck',
    h1: 'Snoqualmie Pass weather and road conditions',
    desc: 'Check Snoqualmie Pass weather with the National Weather Service forecast, summit temperature, WSDOT road conditions, chain rules and webcams on I-90.',
  },
  'passes/i80-wyoming': {
    title: 'Is I-80 open at Sherman Hill? Laramie to Cheyenne road conditions today | MileCheck',
    h1: 'Is I-80 open at Sherman Hill, between Laramie and Cheyenne?',
    desc: 'Is I-80 open at Sherman Hill? Today’s I-80 road conditions from WYDOT between Laramie and Cheyenne: closures, wind, snow, and the highest point on I-80.',
  },
  'seasonal/tioga-pass': { title: 'Is Tioga Pass open? Road status today and opening dates | MileCheck' },
  'seasonal/chinook-pass': { title: 'Is Chinook Pass open? Road status today and opening dates | MileCheck' },
  'road-conditions/alberta': { title: 'Alberta road conditions today: closures and highway cameras | MileCheck' },
};
module.exports = { SNOW_STATES, snowState, PAGES };
