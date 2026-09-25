// Snoqualmie Pass reference sections (ChatGPT draft 2026-09-25, sources checked by Claude).
// Parsed from ./drafts/snoqualmie-pass-reference-copy.md so the draft stays the one source.
const fs = require('fs'); const path = require('path');
const src = fs.readFileSync(path.join(__dirname, 'drafts', 'snoqualmie-pass-reference-copy.md'), 'utf8');
const md = (s) => s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, t, u) => /^https?:\/\/milecheckapp\.com/.test(u)
    ? `<a href="${u.replace(/^https:\/\/milecheckapp\.com/, '')}">${t}</a>`
    : `<a href="${u}" target="_blank" rel="noopener">${t}</a>`);
const cells = (l) => l.trim().replace(/^\||\|$/g, '').split('|').map(c => md(c.trim()));
function table(p) {
  const rows = p.split('\n').filter(l => l.trim().startsWith('|') && !/^\|\s*-/.test(l.trim()));
  const [head, ...body] = rows.map(cells);
  return `<div class="seg-table"><table><thead><tr>${head.map(c => `<th>${c}</th>`).join('')}</tr></thead><tbody>${body.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function list(p) {
  const ordered = /^\d+\. /.test(p);
  const items = p.split('\n').map(l => l.replace(/^(- |\d+\. )/, '').trim()).filter(Boolean);
  return `<${ordered ? 'ol' : 'ul'}>${items.map(i => `<li>${md(i)}</li>`).join('')}</${ordered ? 'ol' : 'ul'}>`;
}
const chunks = src.split(/\n## /).slice(1).map(c => { const [h, ...r] = c.split('\n'); return [h.trim(), r.join('\n').trim()]; });
const segs = [], faq = [];
for (const [h, body] of chunks) {
  if (/^Edits to existing/i.test(h)) continue;
  if (/^FAQ/i.test(h)) {
    for (const b of body.split(/\n\s*\n/)) { const m = b.match(/^\*\*(.+?)\*\*\s*([\s\S]+)$/); if (m) faq.push([m[1].trim(), md(m[2].trim())]); }
    continue;
  }
  const paras = body.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean)
    .map(p => p.startsWith('Sources ') ? `<p class="seg-src">Sources: ${md(p.slice(8))}</p>`
      : p.startsWith('|') ? table(p)
      : /^(- |\d+\. )/.test(p) ? list(p) : `<p>${md(p)}</p>`);
  segs.push({ h, html: paras.join('') });
}
module.exports = { segs, faq };
