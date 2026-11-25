const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');const api=require('./state-now.js');
const now=Date.parse('2026-11-24T17:00:00Z');
const r=(t,o={})=>({'event-type-id':t,headline:'',description:o.d||'Road closed between A and B',location:{'route-id':o.route||'I-90',direction:o.dir||'EB'},...o.x});
const feed=(rows,extra={})=>({'incident-reports':rows,source_status:'live',fetched_at:'2026-11-24T16:58:00Z',...extra});
test('counts only active alerts and drops rest-area closures',()=>{
  const s=api.summarize(feed([r('CL'),r('CL',{d:'Rest area closed'}),r('CL',{x:{'start-time':'2026-11-25T00:00:00Z'}}),r('CL',{x:{'end-time':'2026-11-23T00:00:00Z'}}),r('AC'),r('RW'),r('RW')]),now);
  assert.equal(s.closures.length,1);assert.equal(s.crashes,1);assert.equal(s.work,2);});
test('a missing list is a failure, not an all-clear',()=>{assert.throws(()=>api.summarize({},now));assert.equal(api.view(null,0,now).mode,'failed');assert.equal(api.view({source_status:'failed'},0,now).mode,'failed');});
test('the stamp uses the feed read time and names the zone',()=>{
  const v=api.view(feed([]),0,now);assert.equal(v.mode,'live');assert.equal(v.at,Date.parse('2026-11-24T16:58:00Z'));
  assert.equal(api.stamp(v.at,'America/Los_Angeles'),'Nov 24, 8:58 AM PST');assert.equal(api.stamp(v.at,'America/Denver'),'Nov 24, 9:58 AM MST');
  assert.match(api.stampHtml(v,'WSDOT','America/Los_Angeles'),/^<b>Current as of Nov 24, 8:58 AM PST<\/b>, from the WSDOT feed/);});
test('a stale Worker read is labelled with its own age, never as current',()=>{
  const v=api.view(feed([r('CL')],{source_status:'stale',since:'2026-11-24T09:00:00Z'}),0,now);assert.equal(v.mode,'stale');
  const h=api.stampHtml(v,'WSDOT','America/Los_Angeles');assert.match(h,/Last updated Nov 24, 1:00 AM PST/);assert.doesNotMatch(h,/Current as of/);});
test('a failed load keeps the baked time and says it may be out of date',()=>{
  const h=api.stampHtml(api.view(null,Date.parse('2026-11-01T21:42:00Z'),now),'WSDOT','America/Los_Angeles');
  assert.match(h,/Last updated Nov 1, 1:42 PM PST/);assert.match(h,/may be out of date/);});
test('alert text is escaped',()=>{const h=api.bodyHtml(api.summarize(feed([r('CL',{d:'<img src=x onerror=alert(1)>Closed & more'})]),now),'WSDOT');assert.doesNotMatch(h,/<img/);assert.match(h,/Closed &amp; more/);});
function page(fetchImpl,read){
  const el=()=>({innerHTML:'',textContent:'',style:{}});const h=el(),body=el(),st=el();const attrs={'data-state':'WA','data-dot':'WSDOT','data-name':'Washington','data-tz':'America/Los_Angeles','data-read':read};
  const box={getAttribute:k=>attrs[k],setAttribute(k,v){attrs[k]=v},querySelector:s=>({'.sn-h':h,'.sn-body':body,'.sn-stamp':st})[s]};
  const document={querySelector:()=>box,addEventListener(){},visibilityState:'visible'};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'state-now.js'),'utf8'),{document,fetch:fetchImpl,setInterval(){},setTimeout,clearTimeout,AbortController,Intl,Date});
  return {h,body,st,attrs};}
const settle=()=>new Promise(res=>setTimeout(res,20));
test('in the page: a live read rewrites the box and stamps it current',async()=>{
  const p=page(async()=>({ok:true,json:async()=>feed([r('CL'),r('AC')],{fetched_at:new Date().toISOString()})}),'2026-11-01T21:42:00Z');
  assert.match(p.st.innerHTML,/Checking the live WSDOT feed/);
  await settle();assert.equal(p.h.textContent,'Washington right now');assert.match(p.body.innerHTML,/1 closure-type alert, 1 crash/);assert.match(p.st.innerHTML,/^<b>Current as of /);assert.equal(p.attrs['data-mode'],'live');});
test('in the page: a failed read keeps the baked summary and flags its age',async()=>{
  const p=page(async()=>{throw Error('offline')},'2026-11-01T21:42:00Z');await settle();
  assert.equal(p.h.textContent,'Washington at the last read');assert.equal(p.body.innerHTML,'');assert.match(p.st.innerHTML,/Last updated Nov 1, 1:42 PM PST.*did not load/);assert.equal(p.attrs['data-mode'],'failed');});
