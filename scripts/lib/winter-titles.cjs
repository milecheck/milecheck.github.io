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
    title: 'Snoqualmie Pass road conditions, webcams and chains today | MileCheck',
    h1: 'Snoqualmie Pass road conditions and webcams today',
    desc: 'Is Snoqualmie Pass open? Today’s I-90 road and driving conditions from WSDOT, chain and traction rules for each direction, summit temperature, webcams and closures.',
  },
  'seasonal/tioga-pass': { title: 'Is Tioga Pass open? Road status today and opening dates | MileCheck' },
  'seasonal/chinook-pass': { title: 'Is Chinook Pass open? Road status today and opening dates | MileCheck' },
  'road-conditions/alberta': { title: 'Alberta road conditions today: closures and highway cameras | MileCheck' },
};
module.exports = { SNOW_STATES, snowState, PAGES };
