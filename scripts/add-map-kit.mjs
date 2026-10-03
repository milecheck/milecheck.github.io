#!/usr/bin/env node
// add-map-kit.mjs — link assets/map-kit.css + .js from every built page that
// draws a Leaflet map (the live #comap pages first, every other map since 10-03), and apply the 2026-10-03 pass-page partial-feed fix.
// Leah, 2026-10-03: "the camera maps are clunky on mobile view". The four generators
// (state/city cameras, passes, corridors) emit the tags themselves now; this script
// brings the already-built pages (including es/ and pt/ copies) up to date without a
// full regen. Idempotent: a page that already links the file is skipped.
//   node scripts/add-map-kit.mjs        (--dry lists what would change)
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

const DRY = process.argv.includes("--dry");
const TAGS = "  <!-- Shared map behavior for every Leaflet map: assets/map-kit.css + .js. Change maps there, not per page. -->\n  <link rel=\"stylesheet\" href=\"/assets/map-kit.css\">\n  <script src=\"/assets/map-kit.js\" defer></script>\n</head>";
// Pass pages: same text as scripts/gen-pass-pages.js after the 2026-10-03 change.
const PASS_SWAPS = [
  [
    "// Missing feeds are not zero reports. Keep successful layers when another feed fails.\nconst failedFeeds=new Set();\nasync function feedRows(url,key,label){const d=await fetchJSON(url,3);if(!d||d.unavailable||d.ok===false||d.supported===false||['failed','partial','unavailable','unsupported'].includes(d.source_status)||(Array.isArray(d.errors)&&d.errors.length)||!Array.isArray(d[key]))failedFeeds.add(label);return d&&Array.isArray(d[key])?d[key]:[];}",
    "// Missing feeds are not zero reports. Keep successful layers when another feed fails.\n// A \"partial\" feed that still sent rows is not missing (2026-10-03: one malformed\n// Caltrans weather file in Stockton turned every California pass's alert count into\n// \"?\" while 11,510 rows, 17 of them Cajon closures, arrived fine). Its counts show;\n// its empty lists say they may be incomplete. A partial feed with no rows stays \"?\".\nconst failedFeeds=new Set(),partialFeeds=new Set();\nasync function feedRows(url,key,label){const d=await fetchJSON(url,3);const rows=d&&Array.isArray(d[key])?d[key]:null;const hard=!d||d.unavailable||d.ok===false||d.supported===false||['failed','unavailable','unsupported'].includes(d.source_status)||!rows;const soft=!hard&&(d.source_status==='partial'||(Array.isArray(d.errors)&&d.errors.length));if(hard||(soft&&!rows.length))failedFeeds.add(label);else if(soft)partialFeeds.add(label);return rows||[];}"
  ],
  [
    "  for(const [id,deps] of [['lstCams',['cameras']],['lstSnow',['road weather','alerts']],['lstFire',['fires']],['lstClos',['alerts']],['lstWork',['alerts','road weather']]]){\n    if(!deps.some(x=>failedFeeds.has(x)))continue;\n    const el=document.getElementById(id);if(!el)continue;const ul=el.querySelector('ul'),empty=ul.querySelector('.empty');",
    "  for(const [id,deps] of [['lstCams',['cameras']],['lstSnow',['road weather','alerts']],['lstFire',['fires']],['lstClos',['alerts']],['lstWork',['alerts','road weather']]]){\n    if(!deps.some(x=>failedFeeds.has(x))){\n      const pe=deps.some(x=>partialFeeds.has(x))&&document.querySelector('#'+id+' ul .empty');\n      if(pe)pe.textContent+=' Part of the agency feed did not load, so this list may be incomplete.';\n      continue;\n    }\n    const el=document.getElementById(id);if(!el)continue;const ul=el.querySelector('ul'),empty=ul.querySelector('.empty');"
  ]
];

// Every page that draws a Leaflet map (10-03: "do to all maps"). Mockups and internal
// pages are left alone.
const files = execSync(`grep -rl --include=*.html 'L.map(' . || true`, { encoding: "utf8" })
  .trim().split("\n").filter(f => f && !/^\.\/(node_modules|design-options|internal|docs)\//.test(f));
let tagged = 0, passed = 0, skipped = 0;
for (const f of files) {
  let s = readFileSync(f, "utf8"); const before = s;
  if (!s.includes("map-kit.css")) {
    if ((s.match(/<\/head>/g) || []).length !== 1) { console.warn("skip (head count):", f); skipped++; continue; }
    s = s.replace("</head>", () => TAGS); tagged++;
  }
  if (s.includes("const failedFeeds=new Set();")) {
    if (PASS_SWAPS.every(([a]) => s.split(a).length === 2)) { for (const [a, b] of PASS_SWAPS) s = s.replace(a, () => b); passed++; }
    else console.warn("pass fix did not match:", f);
  }
  if (s !== before) { if (DRY) console.log("would change", f); else writeFileSync(f, s); }
}
console.log(`${files.length} Leaflet pages · tags added to ${tagged} · pass fix on ${passed} · skipped ${skipped}${DRY ? " (dry run)" : ""}`);
