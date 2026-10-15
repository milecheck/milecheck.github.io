const test=require('node:test');const assert=require('node:assert/strict');const c=require('./mile-map-context.js');
const states=['WA','OR'];const format=(r)=>r==='PACIFIC'?'I-5 / OR-99':r;
const posts=[{route:'PACIFIC',code:'OR',mile:2},{route:'I-84',code:'OR',mile:2},{route:'PACIFIC',code:'OR',mile:3}];
test('state links normalize state codes and preserve mile zero',()=>{assert.deepEqual(c.parse('?state=or',states),{state:'OR',route:'',mile:null});assert.equal(c.parse('?state=OR&route=i84&mp=0',states).mile,0);});
test('invalid link values never broaden a lookup',()=>{for(const q of ['?state=ZZ&route=I-84&mp=2','?state=OR&mp=2','?route=I-84','?route=I-84&mp=12junk','?route=I-84&mp=Infinity','?route=I-84&mp=','?route=I-84&mp=-1'])assert.ok(c.parse(q,states).error,q);});
test('real route options include formatted aliases and remove duplicates',()=>assert.deepEqual(c.routes(posts,format),['I-5','I-84','OR-99']));
test('route filtering handles aliases without substring matches',()=>{assert.equal(c.filter(posts,'i 5',format).length,2);assert.equal(c.filter(posts,'OR99',format).length,2);assert.equal(c.filter(posts,'I-8',format).length,0);assert.deepEqual(c.routes([],format),[]);});
test('share URLs retain state, route and exact mile without unrelated keys',()=>{const q=c.query('OR','I-84',0);assert.deepEqual(c.parse('?'+q,states),{state:'OR',route:'I-84',mile:0});});

const fs=require('node:fs'),vm=require('node:vm');
function page(search=''){
  const nodes={};function element(){return {value:'',children:[],handlers:{},hidden:false,disabled:false,textContent:'',addEventListener(k,fn){this.handlers[k]=fn;},appendChild(v){this.children.push(v);},replaceChildren(){this.children=[];},set innerHTML(v){this.children=[];},get innerHTML(){return '';}};}
  const document={querySelector(){return null;},getElementById(id){return nodes[id]||(nodes[id]=element());},createElement:element,createTextNode:text=>({textContent:text})};
  const pending={};const layer={addTo(){return this;}};const map={addLayer(){},removeLayer(){},setView(){return this;},fitBounds(){}};let rendered=[];
  const cluster={clearLayers(){rendered=[];},addLayers(m){rendered=m;},getBounds(){return {pad(){return this;}};}};
  const L={map:()=>map,tileLayer:()=>layer,layerGroup:()=>layer,control:{layers:()=>layer},markerClusterGroup:()=>cluster,divIcon:x=>x,marker:(coords)=>({coords,bindPopup(){return this;},addTo(){return this;},openPopup(){}})};
  const location={href:'https://milecheckapp.com/maps/mile-markers/'+search,search};
  const history={replaceState(a,b,url){location.href=String(url);}};
  const context={window:{MileMapContext:c,MCRoutes:{formatRouteName:format}},document,L,MCRoutes:{formatRouteName:format},navigator:{},location,history,URL,URLSearchParams,Number,Set,fetch(url){return new Promise((resolve,reject)=>{pending[url.split('=').pop()]={resolve:d=>resolve({ok:true,json:()=>Promise.resolve(d)}),reject};});}};
  const html=fs.readFileSync(require.resolve('../maps/mile-markers/index.html'),'utf8');
  const script=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes("var WORKER="));vm.runInNewContext(script,context);
  return {nodes,pending,location,rendered:()=>rendered};
}
const settle=()=>new Promise(resolve=>setImmediate(resolve));
const sample=[{lat:45,lon:-122,milepost:2,route:'PACIFIC'},{lat:46,lon:-121,milepost:3,route:'I-84'}];
test('state deep link loads only that state, provides real route filtering and shares selection',async()=>{const p=page('?state=OR');assert.deepEqual(Object.keys(p.pending),['OR']);p.pending.OR.resolve(sample);await settle();assert.equal(p.rendered().length,2);p.nodes['mile-map-route'].value='I-5';p.nodes['mile-map-route'].handlers.change();await settle();assert.equal(p.rendered().length,1);assert.match(p.location.href,/state=OR&route=I-5/);assert.ok(p.nodes['mile-map-links'].children.length);});
test('late state response cannot overwrite a newer state selection',async()=>{const p=page();p.nodes['mile-map-state'].value='OR';p.nodes['mile-map-state'].handlers.change();p.pending.OR.resolve(sample);await settle();p.pending.WA.resolve([{lat:48,lon:-120,milepost:8,route:'I-90'}]);await settle();assert.equal(p.rendered().length,2);assert.match(p.nodes['mile-map-status'].textContent,/Oregon/);assert.match(p.location.href,/state=OR/);});
test('unknown route and unavailable feed do not display another route as the answer',async()=>{const p=page('?state=OR&route=I-999');p.pending.OR.resolve(sample);await settle();assert.equal(p.rendered().length,0);assert.match(p.nodes['mile-map-status'].textContent,/No mile markers for I-999/);const q=page('?state=OR');q.pending.OR.reject(new Error('offline'));await settle();assert.match(q.nodes['mile-map-status'].textContent,/unavailable/);});
test('existing route and mile lookup retains mile zero and exact highlight',async()=>{const p=page('?state=OR&route=I-5&mp=0');p.pending.OR.resolve([{lat:45,lon:-122,milepost:0,route:'PACIFIC'}]);await settle();assert.match(p.nodes['mile-map-status'].textContent,/mile 0 in Oregon/);assert.match(p.location.href,/mp=0/);});
