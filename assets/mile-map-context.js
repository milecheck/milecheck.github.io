/* Shared by the mile-marker map and its Node checks. No network or DOM access. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.MileMapContext=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  function routeKey(value){return String(value||'').toLowerCase().replace(/[^a-z0-9]+/g,'');}
  function matches(post,route,format){var names=String(format(post.route,post.code)||'').split('/');names.push(post.route);return names.some(function(name){return routeKey(name)===routeKey(route);});}
  function routes(posts,format){var found=new Set();posts.forEach(function(post){String(format(post.route,post.code)||'').split('/').forEach(function(name){name=name.trim();if(name&&/\d/.test(name))found.add(name);});});return Array.from(found).sort(function(a,b){return a.localeCompare(b,undefined,{numeric:true});});}
  function filter(posts,route,format){return route?posts.filter(function(post){return matches(post,route,format);}):posts;}
  function parse(search,states){var q=new URLSearchParams(search),state=(q.get('state')||'').trim().toUpperCase(),route=(q.get('route')||'').trim(),raw=q.get('mp'),mile=null;
    if(state&&!states.includes(state))return {error:'That state is not supported. Choose a state below.'};
    if(raw!==null){mile=raw.trim()===''?NaN:Number(raw);if(!Number.isFinite(mile)||mile<0)return {error:'That link needs a valid, nonnegative mile marker.'};if(!route)return {error:'That link needs a highway as well as a mile marker.'};}
    if(route&&!routeKey(route))return {error:'That link needs a highway name.'};
    if(route&&mile===null&&!state)return {error:'Choose a state to browse a highway without a mile marker.'};
    return {state:state,route:route,mile:mile};
  }
  function query(state,route,mile){var q=new URLSearchParams();if(state)q.set('state',state);if(route)q.set('route',route);if(mile!==null&&mile!==undefined)q.set('mp',mile);return q.toString();}
  return {routeKey:routeKey,matches:matches,routes:routes,filter:filter,parse:parse,query:query};
});
