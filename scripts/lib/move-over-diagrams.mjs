// Move-over and zipper-merge diagrams, drawn as inline SVG (11/16, Leah: "ZIPPER MERGE HUNNY").
// Traffic flows up the page. Few cars, one car per idea, short labels.
const car = (x, y, fill, o = 1, rot = 0) => `<g transform="translate(${x} ${y}) rotate(${rot})" opacity="${o}"><rect x="-11" y="-19" width="22" height="38" rx="6" fill="${fill}" stroke="#0E1116" stroke-width="1.5"/><rect x="-8" y="-12" width="16" height="9" rx="2" fill="#cfe3f5"/><rect x="-8" y="6" width="16" height="6" rx="2" fill="#cfe3f5"/></g>`;
const truck = (x, y) => `<g transform="translate(${x} ${y})"><rect x="-13" y="-28" width="26" height="56" rx="4" fill="#F28C28" stroke="#0E1116" stroke-width="1.5"/><rect x="-11" y="-8" width="22" height="16" rx="2" fill="#0E1116"/><path d="M-6 0 l5 -5 v3 h7 v4 h-7 v3 z" fill="#FFD23F"/><circle cx="-9" cy="-30" r="4" fill="#FFD23F"/><circle cx="9" cy="-30" r="4" fill="#FFD23F"/></g>`;
const cone = (x, y) => `<path d="M${x} ${y - 9} l5 12 h-10 z" fill="#F28C28" stroke="#fff" stroke-width="1"/>`;
const arrow = (d, c = '#0f7a4f') => `<path d="${d}" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round" stroke-dasharray="2 9"/>`;
const head = (x, y, c = '#0f7a4f') => `<path d="M${x - 8} ${y + 8} L${x} ${y - 4} L${x + 8} ${y + 8}" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`;
const label = (x, y, t, c = '#0E1116', size = 15, w = 700, anchor = 'start') => `<text x="${x}" y="${y}" font-family="system-ui,-apple-system,sans-serif" font-size="${size}" font-weight="${w}" fill="${c}" text-anchor="${anchor}">${t}</text>`;
const speed = (x, y, n) => `<g transform="translate(${x} ${y})"><rect x="-17" y="-21" width="34" height="42" rx="4" fill="#fff" stroke="#0E1116" stroke-width="2"/>${label(0, -6, 'SPEED', '#0E1116', 7, 800, 'middle')}${label(0, 14, n, '#0E1116', 17, 800, 'middle')}</g>`;
const wrap = (title, sub, body, w = 340, h = 480) => `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${title}. ${sub}" style="width:100%;max-width:${w}px;height:auto;display:block;background:#fff;border:1px solid #E5E5E5;border-radius:12px">${label(16, 32, title, '#0E1116', 22, 800)}${label(16, 54, sub, '#5b6670', 13.5, 500)}${body}</svg>`;

// Panel 1: two lanes, move over early with a clear gap.
export function moveOverSvg() {
  const L = 60, Wd = 150; // road x, width (two lanes of 75)
  const road = `<rect x="${L}" y="70" width="${Wd}" height="410" fill="#3a3f45"/><rect x="${L + Wd}" y="70" width="44" height="410" fill="#9aa1a8"/><line x1="${L + 75}" y1="70" x2="${L + 75}" y2="480" stroke="#fff" stroke-width="3" stroke-dasharray="18 16"/><line x1="${L + Wd}" y1="70" x2="${L + Wd}" y2="480" stroke="#fff" stroke-width="3"/><line x1="${L}" y1="70" x2="${L}" y2="480" stroke="#FFD23F" stroke-width="3"/>`;
  const body = road + truck(L + Wd + 22, 170) +
    `<rect x="${L + 80}" y="125" width="66" height="100" fill="none" stroke="#FFD23F" stroke-width="2" stroke-dasharray="6 5" rx="6"/>` +
    label(L + 113, 245, 'empty lane', '#FFD23F', 11, 800, 'middle') +
    car(L + 112, 440, '#2563EB') +
    arrow(`M${L + 112} 416 C ${L + 112} 370, ${L + 38} 370, ${L + 38} 320 L ${L + 38} 105`) + head(L + 38, 102) +
    `<circle cx="${L + 82}" cy="372" r="13" fill="#0f7a4f"/>` + label(L + 82, 378, '1', '#fff', 15, 800, 'middle') +
    `<circle cx="${L + 16}" cy="190" r="13" fill="#0f7a4f"/>` + label(L + 16, 196, '2', '#fff', 15, 800, 'middle');
  const notes = `<g>${label(262, 360, '1  Signal,', '#0E1116', 13, 700)}${label(262, 377, 'then move', '#0E1116', 13, 700)}${label(262, 394, 'over early.', '#0E1116', 13, 700)}${label(262, 180, '2  Pass with', '#0E1116', 13, 700)}${label(262, 197, 'an empty lane', '#0E1116', 13, 700)}${label(262, 214, 'beside them.', '#0E1116', 13, 700)}</g>`;
  return wrap('Two or more lanes', 'Move over a lane, early, if it is safe.', body + notes, 360, 490);
}

// Panel 2: one lane each way, slow down well before.
export function slowDownSvg() {
  const L = 60;
  const road = `<rect x="${L}" y="70" width="150" height="410" fill="#3a3f45"/><rect x="${L + 150}" y="70" width="44" height="410" fill="#9aa1a8"/><line x1="${L + 73}" y1="70" x2="${L + 73}" y2="480" stroke="#FFD23F" stroke-width="3"/><line x1="${L + 79}" y1="70" x2="${L + 79}" y2="480" stroke="#FFD23F" stroke-width="3"/><line x1="${L + 150}" y1="70" x2="${L + 150}" y2="480" stroke="#fff" stroke-width="3"/>`;
  const oncoming = car(L + 37, 160, '#9CA3AF', 1, 180) + car(L + 37, 300, '#9CA3AF', 1, 180) + car(L + 37, 430, '#9CA3AF', 1, 180);
  const body = road + oncoming + truck(L + 172, 130) + car(L + 114, 440, '#2563EB') +
    arrow(`M${L + 114} 418 L ${L + 114} 160`) + head(L + 114, 160) +
    speed(L + 230, 440, '55') + speed(L + 230, 300, '40') +
    `<line x1="${L + 82}" y1="320" x2="${L + 150}" y2="320" stroke="#F28C28" stroke-width="4"/>` +
    label(L + 225, 345, 'Start slowing', '#F28C28', 12.5, 800, 'middle') + label(L + 225, 361, 'here', '#F28C28', 12.5, 800, 'middle');
  return wrap('Can’t move over?', 'Oncoming traffic? Slow down well before.', body, 360, 490);
}

// Zipper merge: DO (both lanes to the merge point, take turns) vs DON'T (early merge, empty lane).
export function zipperSvg() {
  const lanePanel = (x0, zipper) => {
    const L = x0 + 20;
    let s = `<rect x="${L}" y="120" width="120" height="350" fill="#3a3f45"/><line x1="${L + 60}" y1="220" x2="${L + 60}" y2="470" stroke="#fff" stroke-width="3" stroke-dasharray="16 14"/>`;
    s += `<polygon points="${L + 120},225 ${L + 62},150 ${L + 62},120 ${L + 120},120" fill="#9aa1a8"/>`;
    for (let i = 0; i < 6; i++) s += cone(L + 116 - i * 11, 228 - i * 15);
    if (zipper) {
      s += car(L + 30, 140, '#2563EB') + car(L + 58, 178, '#16A34A', 1, -32) + car(L + 30, 250, '#2563EB');
      s += car(L + 90, 290, '#16A34A') + car(L + 30, 350, '#2563EB') + car(L + 90, 395, '#16A34A') + car(L + 30, 440, '#2563EB');
    } else {
      for (let i = 0; i < 6; i++) s += car(L + 30, 145 + i * 60, '#2563EB');
      s += `<path d="M${L + 105} 250 v200" stroke="#DC2626" stroke-width="3"/><path d="M${L + 99} 250 h12 M${L + 99} 450 h12" stroke="#DC2626" stroke-width="3"/>` + label(L + 88, 355, 'empty', '#fff', 12, 800, 'middle');
    }
    return s;
  };
  const body = label(20, 92, 'DO', '#0f7a4f', 22, 800) + label(20, 110, 'Take turns at the merge', '#0E1116', 12.5, 700) +
    lanePanel(0, true) +
    label(200, 92, 'DON\u2019T', '#DC2626', 22, 800) + label(200, 110, 'Merge early', '#0E1116', 12.5, 700) +
    lanePanel(180, false) +
    label(20, 500, 'Use both lanes up to the merge point, then take turns.', '#0E1116', 13.5, 700) +
    label(20, 520, 'Lines are shorter and traffic keeps moving.', '#5b6670', 13, 500);
  return wrap('Zipper merge', 'When a lane closes ahead', body, 360, 535);
}
