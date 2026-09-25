// coverage-rules.mjs — the ledger-governed numbers that live where a comment marker cannot
// (<title>, <meta content>, JSON-LD). Read by apply-coverage-counts.mjs (writes them) and
// check-coverage-drift.mjs (does not flag them).
// Spots where a comment marker cannot live: <title>, <meta content="…">, JSON-LD. A
// comment there is literal text (2026-09-24: the cameras article title shipped with the
// marker in it for twenty minutes). Each rule is [file regex, text regex, ledger key,
// formatter]; the capture group is the number that gets replaced.
export const fmtInt = (v) => Number(v).toLocaleString('en-US');
export const RAW_RULES = [
  [/^cameras\/index\.html$/, /(\d[\d,]*) US states/g, 'cameras.us_states', fmtInt],
  [/^cameras\/[a-z-]+\/index\.html$/, /highway camera in (\d[\d,]*) states\./g, 'cameras.us_states', fmtInt],
  [/^blog\/live-highway-cameras\.html$/, /(\d[\d,]*)\+ (?:Highway|highway) Cameras|(\d[\d,]*)\+ highway cameras|(\d[\d,]*)\+ state DOT cameras/g, 'cameras.total_cameras_floor', fmtInt],
  [/^blog\/live-highway-cameras\.html$/, /, (\d[\d,]*) (?:States|states)/g, 'cameras.us_states', fmtInt],
  [/^index\.html$/, /(\d[\d,]*) states and counting/g, 'pages.bridge_states', fmtInt],
  [/^corridors\/i-5\/index\.html$/, /cameras in (\d[\d,]*) states/g, 'cameras.us_states', fmtInt],
  [/^blog\/(labor-day-weekend-recap-2026(-states\/[a-z-]+)?|road-report-august-2026)\.html$/, /all (\d[\d,]*) crossings/g, 'borders.crossings', fmtInt],
];
