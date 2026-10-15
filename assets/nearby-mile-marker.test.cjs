const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const core=require('./nearby-mile-marker.js');
const point={latitude:44,longitude:-120,accuracy:10};
const post=(changes={})=>({lat:44,lon:-120,mile:0,route:'I-84',code:'OR',...changes});
test('marker decoding accepts flat, wrapped and grouped source files without treating bad responses as empty',()=>{
  const fixture=[{latitude:'44',longitude:'-120',milepost:'0',highway:'I-84'}];
  for(const data of [fixture,{data:fixture},{mileposts:fixture}])assert.deepEqual(core.decode(data,'OR'),[post()]);
  assert.deepEqual(core.decode({data:{'I-84':[{lat:44,lng:-120,mile:'0'}]}},'OR'),[post()]);
  assert.equal(core.decode({PACIFIC:[{lat:44,lon:-120,mile:1}]},'OR',()=> 'I-5 / OR-99')[0].route,'I-5 / OR-99');
  for(const data of [null,{ok:false,data:fixture},{error:'unavailable'},{message:'rate limit'}])assert.throws(()=>core.decode(data,'OR'));
  assert.deepEqual(core.decode([],'OR'),[]);
});
test('missing, malformed and impossible coordinates or mile numbers cannot become a result',()=>{
  for(const changes of [{lat:null},{lat:''},{lon:' '},{lat:91},{lon:-181},{mile:null},{mile:-1},{mile:'12bad'},{route:'unnamed road'}])assert.equal(core.decode([post(changes)],'OR').length,0,JSON.stringify(changes));
});
test('state boundary lookups retain both candidate states and ignore provinces',()=>{
  const states=[{code:'OR'},{code:'WA'}],bounds={OR:{minLat:42,maxLat:46.29,minLon:-124.57,maxLon:-116.46},WA:{minLat:45.54,maxLat:49,minLon:-124.85,maxLon:-116.91},BC:{minLat:48,maxLat:60,minLon:-140,maxLon:-114}};
  assert.deepEqual(core.statesAt(45.7,-122,states,bounds),['OR','WA']);
  assert.deepEqual(core.statesAt(44,-120,states,bounds),['OR']);
  assert.deepEqual(core.statesAt(90,0,states,bounds),[]);
});
test('coarse or invalid position never assigns a marker',()=>{
  assert.equal(core.locate({...point,accuracy:201},[post()]).kind,'imprecise');
  for(const change of [{latitude:null},{longitude:190},{accuracy:null},{accuracy:-1}])assert.equal(core.locate({...point,...change},[post()]).kind,'invalid');
});
test('nearest recorded post preserves zero and decimals, with no interpolation',()=>{
  assert.equal(core.locate(point,[post()]).nearest.post.mile,0);
  assert.equal(core.locate(point,[post({mile:147.03,lat:44.001})]).nearest.post.mile,147.03);
  assert.equal(core.locate(point,[]).kind,'empty');
  assert.equal(core.locate(point,[post({lat:45})]).kind,'distant');
});
test('adjacent posts and duplicate carriageways do not create false highway choices',()=>{
  assert.equal(core.locate(point,[post(),post({lat:44.0005}),post({lat:44.001,mile:.5})]).kind,'found');
  assert.equal(core.locate(point,[post({route:'I-5 / OR-99'}),post({route:'I5',lat:44.0005})]).kind,'found');
});
test('nearby parallel highways, conflicting mile systems and state borders stay ambiguous',()=>{
  for(const other of [post({route:'US-30',lat:44.0005}),post({mile:200,lat:44.0005}),post({code:'WA',lat:44.0005})]){
    const result=core.locate(point,[post(),other]);assert.equal(result.kind,'ambiguous');assert.equal(result.choices.length,2);
  }
  assert.equal(core.locate(point,[post(),post({route:'US-30',lat:44.01})]).kind,'found');
});
function page(options={}){
  const nodes={},events=[],requests=[],timers=new Map();let nextTimer=0,geolocationCall;
  function element(){return {hidden:true,textContent:'',disabled:false,children:[],handlers:{},setAttribute(){},addEventListener(name,fn){this.handlers[name]=fn;},appendChild(c){this.children.push(c);},replaceChildren(){this.children=[];}};}
  const states=[{code:'OR',name:'Oregon',slug:'oregon',cameras:true},{code:'WA',name:'Washington',slug:'washington',cameras:true}];
  const document={getElementById(id){return nodes[id]||(nodes[id]=element());},createElement:element,addEventListener(){}};
  document.getElementById('marker-states').textContent=JSON.stringify(states);
  const pending={};
  const window={document,NearbyMileMarker:core,MCRoutes:{STATE_BOUNDS:{OR:{minLat:42,maxLat:46.29,minLon:-124.57,maxLon:-116.46},WA:{minLat:45.54,maxLat:49,minLon:-124.85,maxLon:-116.91}},formatRouteName:r=>r},isSecureContext:options.insecure?false:true,navigator:options.noGPS?{}:{geolocation:{getCurrentPosition(success,error,settings){geolocationCall={success,error,settings};}}},gtag(...args){events.push(args);},fetch(url,settings){requests.push({url,settings});const code=url.split('=').at(-1);return new Promise((resolve,reject)=>{pending[code]={resolve(data){resolve({ok:true,json:async()=>data});},reject};});}};
  vm.runInNewContext(fs.readFileSync(require.resolve('./where-am-i.js'),'utf8'),{window,URLSearchParams,setTimeout(fn){let id=++nextTimer;timers.set(id,fn);return id;},clearTimeout(id){timers.delete(id);}});
  return {nodes,events,requests,pending,timers,click(){nodes.locate.handlers.click();},get gps(){return geolocationCall;}};
}
const settle=()=>new Promise(r=>setImmediate(r));
test('page requests location only on a click, sends only state codes and immediately renders the recorded answer',async()=>{
  const p=page();assert.equal(p.gps,undefined);assert.equal(p.requests.length,0);
  p.click();assert.equal(p.gps.settings.maximumAge,0);assert.equal(p.gps.settings.timeout,15000);
  p.gps.success({coords:point});assert.equal(p.requests.length,1);
  assert.equal(p.requests[0].url,'https://milepost-proxy.leahgerber93.workers.dev/mileposts?state=OR');
  assert.equal(p.requests[0].settings.referrerPolicy,'no-referrer');
  p.pending.OR.resolve([post({mile:147.03})]);await settle();
  assert.equal(p.nodes['marker-result'].hidden,false);assert.equal(p.nodes['marker-number'].textContent,'147.03');
  assert.match(p.nodes['marker-map'].href,/state=OR&route=I-84&mp=147.03/);
  assert.equal(p.nodes['marker-conditions'].href,'/road-conditions/oregon/');
  assert.equal(p.nodes.locate.disabled,false);assert.equal(p.timers.size,0);
  assert.ok(!JSON.stringify(p.events).includes('-120'));assert.ok(!JSON.stringify(p.events).includes('147.03'));
});
test('permission denial, absent GPS, insecure context and coarse location leave manual navigation available',()=>{
  const denied=page();denied.click();denied.gps.error({code:1});assert.match(denied.nodes['location-status'].textContent,/Location access is off/);assert.equal(denied.nodes.locate.disabled,false);
  for(const opts of [{noGPS:true},{insecure:true}]){const p=page(opts);p.click();assert.equal(p.requests.length,0);assert.ok(p.nodes['location-status'].textContent);}
  const coarse=page();coarse.click();coarse.gps.success({coords:{...point,accuracy:5000}});assert.equal(coarse.requests.length,0);assert.match(coarse.nodes['location-status'].textContent,/too approximate/);
});
test('incomplete data at an overlapping state boundary never asserts a winner',async()=>{
  const p=page();p.click();p.gps.success({coords:{...point,latitude:45.7}});
  p.pending.OR.resolve([post({lat:45.7})]);p.pending.WA.reject(Error('offline'));await settle();
  assert.equal(p.nodes['marker-result'].hidden,true);assert.match(p.nodes['location-status'].textContent,/Some mile marker data did not load/);
});
test('watchdog and retries ignore late location or data responses',async()=>{
  const p=page();p.click();const old=p.gps;
  p.timers.values().next().value();p.click();old.success({coords:point});assert.equal(p.requests.length,0);
  p.gps.success({coords:point});p.timers.values().next().value();p.click();p.pending.OR.resolve([post()]);await settle();assert.equal(p.nodes['marker-result'].hidden,true);
});
test('ambiguous result offers individual map links without showing one marker as the answer',async()=>{
  const p=page();p.click();p.gps.success({coords:point});p.pending.OR.resolve([post(),post({route:'US-30',lat:44.0005})]);await settle();
  assert.equal(p.nodes['marker-result'].hidden,true);assert.equal(p.nodes['marker-choices'].hidden,false);assert.equal(p.nodes['marker-choices'].children.length,2);
  assert.match(p.nodes['marker-choices'].children[1].children[0].href,/route=US-30/);
});

test('real Oregon compound route keeps its complete display name but opens an individual map and camera route',async()=>{
  const ctx={};vm.runInNewContext(fs.readFileSync(require.resolve('./mc-routes.js'),'utf8'),ctx);
  const decoded=core.decode([{route:'COLUMBIA RIVER',lat:44,lon:-120,milepost:147.03}],'OR',ctx.MCRoutes.formatRouteName);
  assert.equal(decoded[0].route,'I-84 / US-30');
  const p=page();p.click();p.gps.success({coords:point});p.pending.OR.resolve(decoded);await settle();
  assert.match(p.nodes['marker-road'].textContent,/I-84 \/ US-30/);
  const url=new URL(p.nodes['marker-map'].href,'https://milecheckapp.com');
  assert.equal(url.searchParams.get('route'),'I-84');
  const map=require('./mile-map-context.js');assert.equal(map.filter(decoded,url.searchParams.get('route'),r=>r).length,1);
  assert.equal(new URL(p.nodes['marker-cameras'].href,'https://milecheckapp.com').searchParams.get('route'),'I-84');
});

test('internal road IDs with no signed number never become a highway choice',()=>{
  const out=core.decode([{route:'Route 81003',lat:47.2,lon:-111.8,milepost:33},{route:'I-15',lat:47.2,lon:-111.8,milepost:249}],'MT');
  assert.deepEqual(out.map(p=>p.route),['I-15']);
});
