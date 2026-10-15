/* State camera map highway filter. Route choices come only from loaded cameras. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.MCCameraRoutes=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  function canonical(value){var s=String(value||'').trim().toUpperCase().replace(/\s+/g,' ').replace(/\s+(?:NB|SB|EB|WB|NORTHBOUND|SOUTHBOUND|EASTBOUND|WESTBOUND)$/,'');s=s.replace(/^INTERSTATE\s*/,'I-').replace(/^US\s+(?:HIGHWAY|ROUTE)\s*/,'US-').replace(/^STATE\s+(?:HIGHWAY|ROUTE)\s*/,'SR-');var m=s.match(/^([A-Z]{1,3})[ -]?(\d+[A-Z]?)$/);return m?m[1]+'-'+m[2]:s;}
  function aliases(route){return String(route||'').split('/').map(canonical).filter(Boolean);}
  function matches(camera,route){return !route||aliases(camera.route).includes(canonical(route));}
  function choices(cameras){var set=new Set();cameras.forEach(function(c){aliases(c.route).forEach(function(r){set.add(r);});});return Array.from(set).sort(function(a,b){return a.localeCompare(b,undefined,{numeric:true});});}
  function filter(cameras,route){return cameras.filter(function(c){return matches(c,route);});}
  function create(config){
    var doc=config.document||document,loc=config.location||location,hist=config.history||history;
    var select=doc.getElementById('camera-route'),note=doc.getElementById('camera-route-note');
    var selected=canonical(new URLSearchParams(loc.search).get('route')),all=[],ready=false;
    function visible(list){return filter(list,selected);}
    function message(){if(!ready)return;var list=visible(all),missing=all.filter(function(c){return !String(c.route||'').trim();}).length;
      note.textContent=selected?(list.length?list.length+' cameras on '+selected+'.':'No cameras labeled '+selected+' in the loaded feed. Choose another highway or all highways.'):(all.length?'Choose a highway to show its cameras.':'No cameras were returned by this feed.');
      if(!selected&&missing)note.textContent+=' '+missing+' cameras have no highway label and appear only under all highways.';
      if(selected&&config.plows)note.textContent+=' The snowplow layer still shows statewide positions.';
    }
    function fit(list){var points=list.filter(function(c){return Number.isFinite(+c.lat)&&Number.isFinite(+c.lon)&&Math.abs(+c.lat)<=90&&Math.abs(+c.lon)<=180;}).map(function(c){return [+c.lat,+c.lon];});if(points.length)config.map.fitBounds(points,{padding:[20,20],maxZoom:13});}
    function populate(){select.replaceChildren();function option(value,text){var o=doc.createElement('option');o.value=value;o.textContent=text;select.appendChild(o);}option('','All highways');var routes=choices(all);if(selected&&!routes.includes(selected))option(selected,selected+' (no cameras found)');routes.forEach(function(route){option(route,route);});select.value=selected;select.disabled=!all.length;}
    function apply(){var url=new URL(loc.href);if(selected)url.searchParams.set('route',selected);else url.searchParams.delete('route');hist.replaceState(null,'',url);if(config.closeCard)config.closeCard();message();fit(visible(all));config.draw();}
    select.addEventListener('change',function(){selected=canonical(select.value);populate();apply();});
    return {filter:visible,loaded:function(cameras){all=cameras;ready=true;populate();message();if(selected)fit(visible(all));},unavailable:function(){select.disabled=true;note.textContent='Camera data is unavailable right now. The highway filter will be available when the feed loads.';}};
  }
  return {canonical:canonical,aliases:aliases,matches:matches,choices:choices,filter:filter,create:create};
});
