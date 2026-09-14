#!/usr/bin/env node
// Inject the GA4 tag into every page (idempotent). Enhanced measurement in GA4 then
// records outbound clicks, scroll, and sessions per page with US-state geography.
//   node scripts/add-analytics.mjs G-XXXXXXXXXX
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
const ID = process.argv[2];
if (!/^G-[A-Z0-9]+$/.test(ID || '')) { console.error('usage: node scripts/add-analytics.mjs G-XXXXXXXXXX'); process.exit(1); }
const TAG = `<!-- ga4 --><script async src="https://www.googletagmanager.com/gtag/js?id=${ID}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${ID}',{anonymize_ip:true});document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[href]');if(!a)return;var h=a.getAttribute('href')||'';if(/apps\\.apple\\.com|play\\.google\\.com/.test(h)){gtag('event','store_click',{store:/apple/.test(h)?'app_store':'google_play',page_path:location.pathname});}else if(/^https?:/.test(h)&&!h.includes(location.hostname)){gtag('event','outbound_click',{link_url:h,page_path:location.pathname});}},{capture:true});</script><!-- /ga4 -->`;
function walk(d,o=[]){for(const n of readdirSync(d)){if(n.startsWith('.')||n==='node_modules'||n==='scripts')continue;const f=join(d,n);if(statSync(f).isDirectory())walk(f,o);else if(n.endsWith('.html'))o.push(f);}return o;}
let n=0;
for(const f of walk(process.cwd())){let s=readFileSync(f,'utf8');s=s.replace(/<!-- ga4 -->[\s\S]*?<!-- \/ga4 -->/,'');if(!/<head[^>]*>/i.test(s))continue;s=s.replace(/<head[^>]*>/i,m=>m+'\n'+TAG);writeFileSync(f,s);n++;}
console.log('GA4 tag on',n,'pages');
