// Static check for a generated page: canonical URL, tag balance, inline scripts parse, ld+json parses, relative links resolve. Usage: node scripts/verify-page.js cameras/<state>/index.html [more pages]
const fs=require('fs'),path=require('path');
for(const f of process.argv.slice(2)){
  const s=fs.readFileSync(f,'utf8');const dir=path.dirname(f);const issues=[];
  const canon=(s.match(/rel="canonical" href="([^"]+)"/)||[])[1];const expect='https://milecheckapp.com/'+path.relative(process.cwd(),dir).replace(/\\/g,'/')+'/';if(canon!==expect)issues.push('canonical '+canon+' != '+expect);
  if(s.includes('${'))issues.push('literal ${ in page');
  for(const t of ['div','section','main','header','footer','aside','ul','li','a','p','script','style','h1','h2','h3','button','label','span']){const o=(s.match(new RegExp('<'+t+'(\\s[^>]*)?>','g'))||[]).length,c=(s.match(new RegExp('</'+t+'>','g'))||[]).length;if(o!==c)issues.push(`tag <${t}> open ${o} close ${c}`);}
  const re=/<script([^>]*)>([\s\S]*?)<\/script>/g;let m,n=0;while((m=re.exec(s))){const attrs=m[1]||'';if(/\bsrc=/.test(attrs))continue;n++;const body=m[2];if(/ld\+json/.test(attrs)){try{JSON.parse(body)}catch(e){issues.push('ld+json: '+e.message)}}else{try{new Function(body)}catch(e){issues.push('script '+n+': '+e.message)}}}
  const links=[...s.matchAll(/(?:href|src)="([^"#?]+)[^"]*"/g)].map(x=>x[1]).filter(h=>!/^(https?:|mailto:|data:|\/\/|javascript:)/.test(h)&&!h.includes("'+"));
  for(const h of new Set(links)){let p=h.startsWith('/')?path.join(process.cwd(),h):path.join(dir,h);if(p.endsWith('/'))p=path.join(p,'index.html');if(!fs.existsSync(p)&&!fs.existsSync(p.replace(/\/index\.html$/,'.html')))issues.push('missing link target '+h);}
  console.log(f,issues.length?('\n  '+issues.join('\n  ')):'OK ('+n+' inline scripts checked)');
}
