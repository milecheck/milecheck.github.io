#!/usr/bin/env node
// link-new-passes-2026-11.mjs — links the six pass pages added 2026-11-01 (Loveland, Berthoud, Teton, Togwotee,
// Echo Summit, Blewett) from the pages a reader would be on before looking for them. Idempotent: a link is added once.
//   node scripts/link-new-passes-2026-11.mjs
import fs from 'node:fs';
const NEW = {
  loveland: ['Loveland Pass', 'US 6 over the Divide: closures, snow, plows. Hazmat trucks use it.', 'US-6 · Colorado', '11,990 ft · ~60 mi W of Denver', 'The Continental Divide crossing on US 6, where hazmat trucks go instead of the tunnel.'],
  berthoud: ['Berthoud Pass', 'US 40 to Winter Park: closures, snow, plows, avalanche control.', 'US-40 · Colorado', '11,307 ft · ~52 mi W of Denver', 'The US 40 climb to Winter Park, closed for avalanche control.'],
  teton: ['Teton Pass', 'WY 22 between Jackson and Victor: closures, snow, 10 percent grade.', 'WY-22 · Wyoming / Idaho', '8,431 ft · ~12 mi W of Jackson', 'The steep link between Jackson, Wyoming and Victor, Idaho.'],
  togwotee: ['Togwotee Pass', 'US 26 and US 287 between Dubois and Moran: closures and snow.', 'US-26 · Wyoming', '9,658 ft · ~25 mi E of Moran Junction', 'The Continental Divide crossing between Dubois and Grand Teton National Park.'],
  'echo-summit': ['Echo Summit', 'US 50 near South Lake Tahoe: closures, chain controls, snow.', 'US-50 · California', '7,382 ft · SW of South Lake Tahoe', 'The Sierra crossing on US 50 between Placerville and South Lake Tahoe.'],
  blewett: ['Blewett Pass', 'US 97 between Cle Elum and Wenatchee: closures, chains, snow.', 'US-97 · Washington', '4,124 ft · Cle Elum to Wenatchee', 'The US 97 crossing used when I-90 or US 2 is bad.'],
};
let changed = 0;
const edit = (file, fn) => { if (!fs.existsSync(file)) { console.log('missing', file); return; } const a = fs.readFileSync(file, 'utf8'); const b = fn(a); if (a !== b) { fs.writeFileSync(file, b); changed++; } };

// 1. "More passes" line on sibling pass pages.
const SIBLINGS = { CO: ['eisenhower', 'vail', 'wolf-creek', 'monarch'], WA: ['snoqualmie', 'stevens', 'white', 'mt-baker-highway', 'crystal-mountain'], CA: ['donner', 'grapevine', 'cajon'], WY: ['i80-wyoming'] };
const NEWBY = { CO: ['loveland', 'berthoud'], WA: ['blewett'], CA: ['echo-summit'], WY: ['teton', 'togwotee'] };
for (const st of Object.keys(SIBLINGS)) for (const s of SIBLINGS[st]) edit(`passes/${s}/index.html`, (h) => h.replace(/(<p class="co-related">)([\s\S]*?)(<\/p>)/, (m, a, body, c) => {
  const add = NEWBY[st].filter((n) => !body.includes(`/${n}/`)).map((n) => `<a href="../${n}/">${NEW[n][0]}</a>`);
  if (!add.length) return m;
  const mark = ' · <a href="../">all mountain passes</a>';
  return body.includes(mark) ? a + body.replace(mark, ' · ' + add.join(' · ') + mark) + c : a + body + ' · ' + add.join(' · ') + c;
}));

// 2. Pass cards on the state road-conditions pages.
const card = (n) => `      <a class="rc-card" href="/passes/${n}/"><span class="k">Mountain pass</span><h3>${NEW[n][0]}</h3><p>${NEW[n][1]}</p></a>\n`;
const CARDS = { colorado: ['loveland', 'berthoud'], wyoming: ['teton', 'togwotee'], california: ['echo-summit'], washington: ['blewett'] };
for (const [st, list] of Object.entries(CARDS)) edit(`road-conditions/${st}/index.html`, (h) => {
  const add = list.filter((n) => !h.includes(`class="rc-card" href="/passes/${n}/"`)).map(card).join('');
  if (!add) return h;
  const i = h.search(/      <a class="rc-card" href="\/corridors\//);
  return i < 0 ? h : h.slice(0, i) + add + h.slice(i);
});

// 3. I-70 corridor page list.
edit('corridors/i-70/index.html', (h) => {
  if (h.includes('/passes/loveland/')) return h;
  return h.replace(/(      <li><a href="\/passes\/vail\/">[^<]*<\/a><\/li>\n)/, `$1      <li><a href="/passes/loveland/">Loveland Pass road conditions, chains and closures today</a></li>\n      <li><a href="/passes/berthoud/">Berthoud Pass road conditions, chains and closures today</a></li>\n`);
});

// 4. /passes/ index cards.
edit('passes/index.html', (h) => {
  const add = Object.keys(NEW).filter((n) => !h.includes(`href="${n}/"`)).map((n) => `    <a class="passcard" href="${n}/"><span class="tag">${NEW[n][2]}</span><h2>${NEW[n][0]}</h2><div class="meta">${NEW[n][3]}</div><p>${NEW[n][4]}</p><span class="go">See conditions →</span></a>\n`).join('');
  return add ? h.replace(/(  <\/div>\n\n  <p class="ph-note">)/, add + '$1') : h;
});

// 5. llms.txt
edit('llms.txt', (h) => {
  const add = Object.keys(NEW).filter((n) => !h.includes(`/passes/${n}/`)).map((n) => `  - ${NEW[n][0]} Road Conditions Today — https://milecheckapp.com/passes/${n}/\n`).join('');
  return add ? h.replace(/(  - Wolf Creek Pass Road Conditions Right Now \(US-160\) — https:\/\/milecheckapp\.com\/passes\/wolf-creek\/\n)/, '$1' + add) : h;
});
console.log(`${changed} files changed`);
