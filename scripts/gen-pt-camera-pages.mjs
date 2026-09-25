#!/usr/bin/env node
// gen-pt-camera-pages.mjs — Brazilian Portuguese camera pages (Orlando, Florida), built from
// the generated English pages: same map and live data, editorial text from ChatGPT's draft
// (scripts/guides/drafts/portuguese-florida-pages.md), runtime labels translated below.
// Run AFTER the camera generators and gen-es-camera-pages.mjs, before the injectors.
// Runtime-label translations are Claude's (2026-09-25) — flagged for the native-speaker read.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const PT = ['orlando', 'florida'];
const draft = readFileSync('scripts/guides/drafts/portuguese-florida-pages.md', 'utf8');
const md = (s) => s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, t, u) => `<a href="${u.replace(/^https:\/\/milecheckapp\.com/, '')}">${t}</a>`);
const esc = (t) => t.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
const strip = (t) => t.replace(/<[^>]+>/g, '');
function page(slug) {
  const chunk = draft.split(/\n## /).find(c => c.startsWith('`/pt/cameras/' + slug + '/`'));
  const f = (k) => ((chunk.match(new RegExp('^' + k + ' `([^`]+)`', 'm')) || [])[1] || '').trim();
  const secs = chunk.split(/\n### /).slice(1).map(s => { const [h, ...r] = s.split('\n'); return [h.trim(), r.join('\n').trim()]; });
  const faqSec = secs.find(([h]) => /Perguntas frequentes/i.test(h));
  const faq = faqSec[1].split(/\n\s*\n/).map(l => l.match(/^\*\*(.+?)\*\*\s*([\s\S]+)$/)).filter(Boolean).map(m => [m[1].trim(), md(m[2].trim())]);
  const body = secs.filter(s => s !== faqSec);
  return { title: f('Title'), desc: f('Meta description'), h1: f('H1'), lede: md(f('Lede')), body, faq };
}
const paras = (t) => t.split(/\n\s*\n/).map(p => `    <p>${md(p.trim())}</p>`).join('\n');
let done = 0;
for (const slug of PT) {
  const d = page(slug);
  let out = readFileSync(`cameras/${slug}/index.html`, 'utf8');
  const name = out.match(/<h1>([^<]+) traffic cameras, live<\/h1>/)[1];
  const dot = out.match(/Live traffic cameras · [^·]+ · ([^<]+)<\/div>/)[1].trim();
  const nameP = name === 'Florida' ? 'Flórida' : name;
  // strip existing language switches / hreflang (the English page may carry ES ones)
  out = out.replace(/    <p class="lang-switch"[^\n]*\n/g, '').replace(/  <link rel="alternate" hreflang="[a-z-]+" href="[^"]+">\n?/g, '');
  const rep = (re, s) => { if (!re.test(out)) throw new Error(`${slug}: no match ${re}`); out = out.replace(re, s); };
  rep(/<title>[^<]*<\/title>/, `<title>${esc(d.title)}</title>`);
  rep(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(d.desc)}">`);
  rep(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${esc(d.title)}">`);
  rep(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(d.desc)}">`);
  rep(/<div class="eyebrow">[^<]*<\/div>/, `<p class="lang-switch" style="font-size:12.5px;color:#5b6670;margin:0 0 8px"><a href="/cameras/${slug}/" hreflang="en" lang="en">English</a> · <b lang="pt-BR">Português</b></p>\n    <div class="eyebrow">Câmeras de trânsito ao vivo · ${nameP} · ${dot}</div>`);
  rep(/<h1>[^<]*<\/h1>/, `<h1>${d.h1}</h1>`);
  rep(/<p class="sub">[\s\S]*?<\/p>/, `<p class="sub">${d.lede}</p>`);
  rep(/(<section class="co-guide">)[\s\S]*?(<\/section>)/, `$1\n    <h2>${d.body[0][0]}</h2>\n${paras(d.body[0][1])}\n  $2`);
  rep(/(<section class="co-faq">)[\s\S]*?(<\/section>)/, `$1\n    <h2>Perguntas frequentes</h2>\n${d.faq.map(([q, a]) => `    <details><summary>${q}</summary><p>${a}</p></details>`).join('\n')}\n  $2`);
  rep(/(<div class="co-cta">\s*)<h2>[^<]*<\/h2>\s*<p>[\s\S]*?<\/p>/, `$1<h2>${d.body[1][0]}</h2>\n${paras(d.body[1][1])}`);
  rep(/<script type="application\/ld\+json">\{"@context":"https:\/\/schema.org","@type":"FAQPage"[^<]*<\/script>/,
    `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', inLanguage: 'pt-BR', mainEntity: d.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: strip(a) } })) })}</script>`);
  const pairs = [
    [`>live cameras in ${name}<`, `>câmeras ao vivo em ${nameP}<`],
    [`>camera source<`, `>fonte das câmeras<`],
    [`Loading live ${name} cameras…`, `Carregando as câmeras de ${nameP}…`],
    [`Live cameras are busy right now — please refresh in a moment.`, `As câmeras estão ocupadas agora. Recarregue a página em instantes.`],
    [`No cameras loaded — try again shortly.`, `Nenhuma câmera carregada. Tente de novo em instantes.`],
    [`'no cameras loaded'`, `'nenhuma câmera carregada'`],
    [`title="Open full image"`, `title="Abrir imagem completa"`],
    [`' live cameras in ${name}'`, `' câmeras ao vivo em ${nameP}'`],
    [`' live cameras'`, `' câmeras ao vivo'`],
    [`Map layers`, `Camadas do mapa`],
    [`>Cameras</label>`, `>Câmeras</label>`],
    [`Show every camera`, `Mostrar todas as câmeras`],
    [`"name":"Cameras","item":"https://milecheckapp.com/cameras/"`, `"name":"Câmeras","item":"https://milecheckapp.com/cameras/"`],
    [`"name":"${name} Cameras","item":"https://milecheckapp.com/cameras/${slug}/"`, `"name":"Câmeras de ${nameP}","item":"https://milecheckapp.com/pt/cameras/${slug}/"`],
    [`>iOS App Store<`, `>App Store (iOS)<`],
  ];
  for (const [a, b] of pairs) out = out.split(a).join(b);
  out = out.replace(/<p class="co-related">[\s\S]*?<\/p>/, `<p class="co-related">Mais: <a href="/cameras/">todas as câmeras (em inglês)</a> · <a href="/pt/driving-in-the-us-foreign-visitor-guide/">dirigir nos EUA como visitante</a> · <a href="/maps/">mapas (em inglês)</a></p>`);
  out = out.replace('<html lang="en">', '<html lang="pt-BR">');
  out = out.replace(`<link rel="canonical" href="https://milecheckapp.com/cameras/${slug}/">`,
    `<link rel="canonical" href="https://milecheckapp.com/pt/cameras/${slug}/">\n  <link rel="alternate" hreflang="pt" href="https://milecheckapp.com/pt/cameras/${slug}/">\n  <link rel="alternate" hreflang="en" href="https://milecheckapp.com/cameras/${slug}/">\n  <link rel="alternate" hreflang="es" href="https://milecheckapp.com/es/cameras/${slug}/">\n  <link rel="alternate" hreflang="x-default" href="https://milecheckapp.com/cameras/${slug}/">`);
  out = out.replace(`content="https://milecheckapp.com/cameras/${slug}/"`, `content="https://milecheckapp.com/pt/cameras/${slug}/"`);
  out = out.replace(/href="\.\.\/\.\.\//g, 'href="/').replace(/src="\.\.\/\.\.\//g, 'src="/');
  out = out.replace(/href="\.\.\/([a-z-]+)\/"/g, (m, s) => PT.includes(s) ? `href="/pt/cameras/${s}/"` : `href="/cameras/${s}/"`).replace(/href="\.\.\/"/g, 'href="/cameras/"');
  out = out.replace(`data-slot="cameras:${slug}"`, `data-slot="cameras:pt-${slug}"`);
  mkdirSync(`pt/cameras/${slug}`, { recursive: true });
  writeFileSync(`pt/cameras/${slug}/index.html`, out);
  const vis = strip(out.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<header[\s\S]*?<\/header>|<footer[\s\S]*?<\/footer>/g, ''));
  const left = (vis.match(/\b(traffic|cameras|the road|before you|Free|tap any)\b/g) || []);
  console.log(`pt/cameras/${slug}/  English words left in body: ${left.length} ${[...new Set(left)].join(',')}`);
  done++;
}
console.log(`${done} Portuguese camera pages written`);
