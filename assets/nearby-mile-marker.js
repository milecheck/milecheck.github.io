/* Recorded-post lookup. Coordinates are used in the browser, never in requests or URLs. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.NearbyMileMarker=factory();
})(typeof window!=='undefined'?window:this,function(){
  'use strict';
  var METERS_PER_MILE=1609.344;
  function number(value){
    if(typeof value==='number')return Number.isFinite(value)?value:null;
    if(typeof value!=='string'||!value.trim())return null;
    var n=Number(value);return Number.isFinite(n)?n:null;
  }
  function coordinate(lat,lon){return number(lat)!==null&&number(lon)!==null&&Math.abs(lat)<=90&&Math.abs(lon)<=180;}
  function distance(a,b,c,d){
    var r=Math.PI/180,x=Math.sin((c-a)*r/2),y=Math.sin((d-b)*r/2);
    var h=x*x+Math.cos(a*r)*Math.cos(c*r)*y*y;
    return 2*3958.7613*Math.asin(Math.sqrt(Math.min(1,Math.max(0,h))));
  }
  function statesAt(lat,lon,states,bounds){
    if(!coordinate(lat,lon))return [];
    return states.filter(function(s){var b=bounds[s.code];return b&&lat>=b.minLat-.03&&lat<=b.maxLat+.03&&lon>=b.minLon-.03&&lon<=b.maxLon+.03;}).map(function(s){return s.code;});
  }
  function decode(data,code,formatRoute){
    if(!data||typeof data!=='object'||data.ok===false||data.error)throw Error('Marker data unavailable');
    var out=[],recognized=false;
    function add(p,key){
      if(!p||typeof p!=='object')return;
      var lat=number(p.lat!=null?p.lat:p.latitude),lon=number(p.lon!=null?p.lon:p.lng!=null?p.lng:p.longitude);
      var mile=number(p.milepost!=null?p.milepost:p.mile);
      var raw=p.route||p.highway||p['route-id']||key;
      if(lat===null||lon===null||!coordinate(lat,lon)||mile===null||mile<0||typeof raw!=='string')return;
      var route=formatRoute?formatRoute(raw,code):raw;
      if(typeof route!=='string'||!route.trim()||!/[0-9]/.test(route))return;
      // Internal state road IDs with no signed number (Montana 'Route 81003') are not something a driver can match to a sign.
      if(/^Route \d{4,}$/.test(route.trim()))return;
      var o={lat:lat,lon:lon,mile:mile,route:route.trim(),code:code};
      // County-relative states (GA, CA, KY, WV, TN, AR, FL, MO, SC) restart numbering at county lines;
      // CA also has postmile prefixes/suffixes. Kept so the estimate never pairs across numberings.
      ['county','pmPrefix','pmSuffix','rteSuffix'].forEach(function(f){if(typeof p[f]==='string'&&p[f])o[f]=p[f];});
      out.push(o);
    }
    var body=Array.isArray(data)?data:data.mileposts||data.data||data;
    if(Array.isArray(body)){recognized=true;body.forEach(function(p){add(p);});}
    else if(body&&typeof body==='object')Object.keys(body).forEach(function(k){if(Array.isArray(body[k])){recognized=true;body[k].forEach(function(p){add(p,k);});}});
    if(!recognized)throw Error('Unrecognized marker data');
    return out;
  }
  function routeKey(route){return route.toUpperCase().replace(/\s+/g,'').replace(/[^A-Z0-9/]/g,'');}
  function sameRoad(a,b){
    if(a.code!==b.code)return false;
    var names=routeKey(a.route).split('/');
    return routeKey(b.route).split('/').some(function(n){return names.indexOf(n)!==-1;});
  }
  function locate(position,posts){
    var lat=number(position.latitude),lon=number(position.longitude),accuracy=number(position.accuracy);
    if(lat===null||lon===null||!coordinate(lat,lon)||accuracy===null||accuracy<0)return {kind:'invalid'};
    // A coarse browser position cannot distinguish parallel roads or interchanges.
    if(accuracy>200)return {kind:'imprecise'};
    var ranked=posts.filter(function(p){return coordinate(p.lat,p.lon)&&number(p.mile)!==null;}).map(function(p){return {post:p,distance:distance(lat,lon,p.lat,p.lon)};}).sort(function(a,b){return a.distance-b.distance;});
    if(!ranked.length)return {kind:'empty'};
    if(ranked[0].distance>1)return {kind:'distant'};
    var best=ranked[0],uncertainty=accuracy/METERS_PER_MILE;
    var nearby=ranked.filter(function(x){return x.distance<=1&&x.distance<=best.distance+Math.max(.08,uncertainty*2);});
    var different=nearby.filter(function(x){return !sameRoad(best.post,x.post);});
    // Very different mile systems on the same road also need an explicit choice.
    var conflict=nearby.filter(function(x){return sameRoad(best.post,x.post)&&Math.abs(x.post.mile-best.post.mile)>2;});
    if(different.length||conflict.length){
      var seen={},choices=[best].concat(different,conflict).filter(function(x){var key=x.post.code+'|'+routeKey(x.post.route)+'|'+Math.round(x.post.mile);if(seen[key])return false;seen[key]=true;return true;});
      return {kind:'ambiguous',choices:choices.slice(0,3)};
    }
    return {kind:'found',nearest:best};
  }
  return {decode:decode,statesAt:statesAt,distance:distance,locate:locate};
});
