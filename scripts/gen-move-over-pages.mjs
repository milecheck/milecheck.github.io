#!/usr/bin/env node
// /move-over-laws/<state>/ (Leah "do this now", 11/16, after the ODOT call). The hub is the existing /move-over-laws/ guide.
// Data: data/move-over-laws.json (official statute sources only). Records not marked verified
// say "See the statute" for the penalty rather than guessing. Copy: ChatGPT template, 11/16.
// Chrome (head, header, footer) is taken from the built /chain-laws/oregon/ page.
// Run: node scripts/gen-move-over-pages.mjs, then node scripts/finish-pages.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slug = (n) => n.toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '');
const MEM = JSON.parse(readFileSync('data/move-over-memorials.json', 'utf8'));
const FINES = JSON.parse(readFileSync('data/move-over-fines.json', 'utf8'));
const laws = JSON.parse(readFileSync('data/move-over-laws.json', 'utf8')).sort((a, b) => a.name.localeCompare(b.name));
const tpl = readFileSync('chain-laws/oregon/index.html', 'utf8');
const headEnd = tpl.indexOf('<div class="sc-wrap">');
const footStart = tpl.indexOf('<footer class="site-footer">');
let headTpl = tpl.slice(0, headEnd).replace(/^\s*<script type="application\/ld\+json">\{"@context":"https:\/\/schema\.org","@type":"(WebPage|FAQPage|BreadcrumbList)".*$\n/gm, '');
const footTpl = tpl.slice(footStart);
const lc = (s) => s.charAt(0).toLowerCase() + s.slice(1).replace(/\.$/, '');
const hasRC = (n) => { try { readFileSync(`road-conditions/${slug(n)}/index.html`); return true; } catch { return false; } };

function head(title, desc, url, ld) {
  return headTpl
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)} | MileCheck</title>`)
    .replace(/(<meta name="description" content=")[^"]*"/, `$1${esc(desc)}"`)
    .replace(/(<link rel="canonical" href=")[^"]*"/, `$1${url}"`)
    .replace(/(<meta property="og:title" content=")[^"]*"/, `$1${esc(title)} | MileCheck"`)
    .replace(/(<meta property="og:description" content=")[^"]*"/, `$1${esc(desc)}"`)
    .replace(/(<meta property="og:url" content=")[^"]*"/, `$1${url}"`)
    .replace('</head>', ld.map((o) => `  <script type="application/ld+json">${JSON.stringify(o)}</script>\n`).join('') + '</head>');
}


const CHIPS = [
  ['🚓', 'Police', /police|law enforcement|emergency|blue light/i],
  ['🚑', 'Ambulances', /ems|ambulance|emergency|rescue/i],
  ['🚒', 'Fire trucks', /fire|emergency/i],
  ['🛻', 'Tow trucks', /tow|wrecker|recovery/i],
  ['🚧', 'Road crews and construction', /maintenance|construction|road work|work zone|highway work|dot |department of transportation|survey|amber/i],
  ['❄️', 'Snowplows', /maintenance|snow|plow/i],
  ['⚠️', 'Breakdowns with hazard lights', /disabled|hazard|breakdown|any stopped|any stationary|stalled|distress/i],
  ['🔌', 'Utility crews', /utility/i],
  ['🗑️', 'Garbage trucks', /garbage|waste|sanitation|refuse|recycling/i],
];
const chips = (covers) => { const t = (covers || []).join(' | ') + ' '; const anyLit = /any (stopped|stationary|parked|disabled)?\s*vehicle/i.test(t); return CHIPS.filter(([, l, re]) => re.test(t) || (anyLit && !/Utility|Garbage/.test(l))).map(([, l]) => `<li>${l}</li>`).join(''); };
const FIG = `<figure style="margin:16px 0"><img src="/images/move-over/move-over-or-slow-down.webp" width="1200" height="675" loading="lazy" alt="Two panels. Left, two or more lanes: a car signals and moves into the left lane well before a work truck stopped with flashing lights. Right, one lane each way with oncoming traffic: a car slows down at a SLOW DOWN sign well before a tow truck on the shoulder." style="max-width:100%;height:auto;border-radius:10px"></figure>`;

for (const s of laws) {
  const sl = slug(s.name), url = `https://milecheckapp.com/move-over-laws/${sl}/`;
  const q = `What is ${s.name}'s move over law?`;
  const covers = (s.covers || []).join(', ');
  const pen = s.verified && s.penalty && s.penalty !== 'See statute' ? s.penalty : null;
  const desc = `${s.name}'s move over law, ${s.statute}. What drivers have to do, who it protects and the penalty, with a link to the statute.`;
  const ld = [
    { '@context': 'https://schema.org', '@type': 'WebPage', name: q, url },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: [{ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: `${s.duty} (${s.statute})` } }] },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Move over laws', item: 'https://milecheckapp.com/move-over-laws/' }, { '@type': 'ListItem', position: 2, name: s.name, item: url }] },
  ];
  const rc = hasRC(s.name) ? `/road-conditions/${sl}/` : '/maps/';
  const body = `<div class="sc-wrap">
    <p class="sc-eyebrow">Move over law · ${esc(s.name)}</p>
    <h1>${esc(q)}</h1>
    <p class="sc-lede">The law is <a href="${esc(s.statute_url)}" target="_blank" rel="noopener">${esc(s.statute)}</a>. Here is what it asks of drivers in ${esc(s.name)}.</p>
    ${MEM[s.state] ? `<p style="max-width:78ch;border-left:4px solid #0f7a4f;padding:8px 14px;margin:0 0 16px;font-size:15.5px;line-height:1.55"><strong>In memory of ${esc(MEM[s.state].name)}.</strong> ${esc(MEM[s.state].law)} is named in their honor. ${esc(MEM[s.state].line)} <a href="${esc(MEM[s.state].source)}" target="_blank" rel="noopener">Source</a>.</p>` : ''}
    <div class="sc-body" style="max-width:78ch;font-size:16px;line-height:1.6">
    <h2>What you have to do</h2>
    <ul>${s.duty.split(/;\s*/).map((t) => t.trim().replace(/\.$/, '')).filter(Boolean).map((t) => `<li>${esc(t.charAt(0).toUpperCase() + t.slice(1))}.</li>`).join('')}</ul>
    ${FIG}
    <h2>Who it protects</h2>
    <ul style="columns:2;column-gap:24px;font-size:16px;font-weight:600;padding-left:20px;margin:6px 0 10px">${chips(s.covers)}</ul>
    <p style="color:#5b6670;font-size:14px;margin:6px 0 2px">What the statute says:</p>
    <ul>${(s.covers || []).map((c) => `<li>${esc(c.charAt(0).toUpperCase() + c.slice(1))}</li>`).join('')}</ul>
    <h2>Penalty</h2>
    <p>${(() => { const f = FINES[s.state]; const cls = pen && !/\$/.test(pen) ? ` ${esc(pen.charAt(0).toUpperCase() + pen.slice(1))}${/[.)]$/.test(pen) ? '' : '.'}` : ''; if (f && f.verified && f.fine) return `Fine: <strong style="font-size:18px">${esc(f.fine)}</strong>.${cls} Source: <a href="${esc(f.source)}" target="_blank" rel="noopener">${esc(s.statute)}</a>.`; return pen ? `${esc(pen.charAt(0).toUpperCase() + pen.slice(1))}${/[.)]$/.test(pen) ? '' : '.'} Source: <a href="${esc(s.penalty_source_url || s.statute_url)}" target="_blank" rel="noopener">${esc(s.statute)}</a>.` : `The penalty is set in <a href="${esc(s.statute_url)}" target="_blank" rel="noopener">${esc(s.statute)}</a>. We could not confirm a dollar amount from an official source.`; })()}</p>
    <h2>Why it matters</h2>
    <p>DOT crews and tow operators work beside moving traffic. Police officers respond to incidents on the shoulder. Arrow-board trailers mark work areas and lane closures. These workers, their vehicles and roadside equipment can be struck by passing traffic. Moving over and slowing down helps reduce that risk.</p>
    <h2>Road conditions in ${esc(s.name)}</h2>
    <p><a href="${rc}" target="_blank" rel="noopener">See live state DOT road alerts and find highway mile markers in ${esc(s.name)} on MileCheck</a>.</p>
    <p class="sc-related"><a href="/move-over-laws/" target="_blank" rel="noopener">Move over laws in every state</a> · <a href="/zipper-merge-explained/" target="_blank" rel="noopener">How to zipper merge</a></p>
    <p style="color:#5b6670;font-size:14px">This page is for general information, not legal advice. The text of ${esc(s.statute)} controls.</p>
    </div>
  </div>
`;
  mkdirSync(`move-over-laws/${sl}`, { recursive: true });
  writeFileSync(`move-over-laws/${sl}/index.html`, head(q, desc, url, ld) + body + footTpl);
}

console.log(`move-over-laws: ${laws.length} state pages`);
