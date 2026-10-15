/* Shared by the mile-marker map and its Node checks. No network or DOM access. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.MileMapContext=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  function routeKey(value){return String(value||'').toLowerCase().replace(/[^a-z0-9]+/g,'');}
  function matches(post,route,format){var names=String(format(post.route,post.code)||'').split('/');names.push(post.route);return names.some(function(name){return routeKey(name)===routeKey(route);});}
  function routes(posts,format){var found=new Set();posts.forEach(function(post){String(format(post.route,post.code)||'').split('/').forEach(function(name){name=name.trim();if(name&&/\d/.test(name))found.add(name);});});return Array.from(found).sort(function(a,b){return a.localeCompare(b,undefined,{numeric:true});});}
  function filter(posts,route,format){return route?posts.filter(function(post){return matches(post,route,format);}):posts;}
  function parseMile(value){var raw=String(value===null||value===undefined?'':value).trim();if(!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(raw))return null;var mile=Number(raw);return Number.isFinite(mile)&&mile>=0?mile:null;}
  function lookup(posts,route,mile,format){
    if(!Number.isFinite(mile)||mile<0)return {kind:'invalid-mile'};
    var list=filter(posts,route,format).filter(function(p){return Number.isFinite(p.mile)&&p.mile>=0;});
    if(!list.length)return {kind:'route-missing'};
    var min=Infinity,max=-Infinity,best=null;list.forEach(function(p){min=Math.min(min,p.mile);max=Math.max(max,p.mile);var delta=Math.abs(p.mile-mile);if(!best||delta<best.delta)best={post:p,delta:delta};});
    if(mile<min||mile>max)return {kind:'outside-range',min:min,max:max};
    if(best.delta>1)return {kind:'missing',min:min,max:max};
    return {kind:best.delta===0?'exact':'nearby',post:best.post,delta:best.delta,min:min,max:max};
  }
  function parse(search,states){var q=new URLSearchParams(search),state=(q.get('state')||'').trim().toUpperCase(),route=(q.get('route')||'').trim(),raw=q.get('mp'),mile=null;
    if(state&&!states.includes(state))return {error:'That state is not supported. Choose a state below.'};
    if(raw!==null){mile=parseMile(raw);if(mile===null)return {error:'That link needs a valid, nonnegative mile marker.'};if(!route)return {error:'That link needs a highway as well as a mile marker.'};}
    if(route&&!routeKey(route))return {error:'That link needs a highway name.'};
    if(route&&mile===null&&!state)return {error:'Choose a state to browse a highway without a mile marker.'};
    return {state:state,route:route,mile:mile};
  }
  function query(state,route,mile){var q=new URLSearchParams();if(state)q.set('state',state);if(route)q.set('route',route);if(mile!==null&&mile!==undefined)q.set('mp',mile);return q.toString();}
  return {routeKey:routeKey,matches:matches,routes:routes,filter:filter,parseMile:parseMile,lookup:lookup,parse:parse,query:query};
});
