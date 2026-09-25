// Punjabi (pa) and Brazilian Portuguese (pt) guide pages, parsed from ChatGPT's reviewed-draft
// markdown in ./drafts/ (2026-09-25). Guide-shaped pages only; the Portuguese camera pages are
// built by scripts/gen-pt-camera-pages.mjs from the English camera pages.
// Native-speaker review still required (see "Translation review notes" in each draft).
const fs = require('fs'); const path = require('path');
const md = (s) => s
  .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, t, u) => `<a href="${u.replace(/^https:\/\/milecheckapp\.com/, '')}">${t}</a>`);
function parse(file, lang, only) {
  const src = fs.readFileSync(path.join(__dirname, 'drafts', file), 'utf8');
  const out = [];
  for (const chunk of src.split(/\n## /).slice(1)) {
    const m = chunk.match(/^`\/(pa|pt)\/(.+?)\/`/); if (!m) continue;
    const slug = m[2]; if (only && !only.includes(slug)) continue;
    const field = (k) => ((chunk.match(new RegExp('^' + k + ' `([^`]+)`', 'm')) || [])[1] || '').trim();
    const secs = chunk.split(/\n### /).slice(1);
    const sections = [], faq = [];
    for (const s of secs) {
      const [head, ...rest] = s.split('\n'); const body = rest.join('\n').trim();
      if (/^(FAQ|Perguntas frequentes)$/i.test(head.trim())) {
        for (const line of body.split(/\n\s*\n/)) { const q = line.match(/^\*\*(.+?)\*\*\s*([\s\S]+)$/); if (q) faq.push([q[1].trim(), md(q[2].trim())]); }
      } else sections.push([head.trim(), body.split(/\n\s*\n/).map(p => `<p>${md(p.trim())}</p>`).join('')]);
    }
    const title = field('Title').replace(/\s*\|\s*MileCheck$/, '');
    out.push({ lang, slug, eyebrow: lang === 'pa' ? 'ਹਾਈਵੇ ਗਾਈਡ' : 'Dirigir nos EUA', title, h1: field('H1'), lede: md(field('Lede')),
      desc: field('Meta description'), checked: lang === 'pa' ? 'ਸਤੰਬਰ 2026' : 'setembro de 2026', sections, faq, related: '' });
  }
  return out;
}
module.exports = [
  ...parse('punjabi-driver-pages.md', 'pa'),
  ...parse('portuguese-florida-pages.md', 'pt', ['driving-in-the-us-foreign-visitor-guide']),
];
