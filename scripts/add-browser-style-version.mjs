// Run after generators so changed tool pages request the current shared stylesheet.
// Keep the list finite. Held pass/corridor pages and unrelated drafts are excluded.
import {readFileSync,writeFileSync,readdirSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const version='20261015-2';
const files=new Set(['maps/mile-markers/index.html','search/index.html','404.html',
  'what-is-my-mile-marker/index.html','can-google-maps-show-mile-markers/index.html']);
for(const state of JSON.parse(readFileSync(resolve(root,'data/state-corridors.json'),'utf8')))
  files.add('corridors/i-75/'+state.slug+'/index.html');
for(const entry of readdirSync(resolve(root,'cameras'),{withFileTypes:true})){
  if(!entry.isDirectory())continue;
  const file='cameras/'+entry.name+'/index.html';
  if(existsSync(resolve(root,file))&&readFileSync(resolve(root,file),'utf8').includes('function playStream(url)'))files.add(file);
}
let changed=0;
for(const file of files){
  const original=readFileSync(resolve(root,file),'utf8');
  const next=original.replace(/href="((?:\.\.\/|\/)*style\.css)(?:\?[^"\s]*)?"/g,`href="$1?v=${version}"`);
  if(next===original&&!next.includes('style.css?v='+version))throw Error('Missing shared stylesheet in '+file);
  if(next!==original){writeFileSync(resolve(root,file),next);changed++;}
}
console.log('Browser styles: '+changed+' updated, '+files.size+' existing pages checked.');
