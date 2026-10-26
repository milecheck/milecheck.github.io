(function(root){
  'use strict';
  var doc=root.document,button=doc.getElementById('locate'),status=doc.getElementById('location-status');
  if(!button||!root.NearbyMileMarker)return;
  var core=root.NearbyMileMarker,states=JSON.parse(doc.getElementById('marker-states').textContent);
  var result=doc.getElementById('marker-result'),next=doc.getElementById('marker-next'),choices=doc.getElementById('marker-choices');
  var routes=root.MCRoutes,revision=0,timer=null;
  function event(action){if(typeof root.gtag==='function')root.gtag('event','mile_marker_tool',{action:action});}
  function finish(message,quiet){status.className=quiet?'sr-only':'';button.disabled=false;button.textContent='Try my location again';status.textContent=message;clearTimeout(timer);}
  function routeAlias(p){return p.route.split('/')[0].trim();}
  function mapLink(p){var q=new URLSearchParams({state:p.code,route:routeAlias(p),mp:String(p.mile)});return '/maps/mile-markers/?'+q.toString();}
  function name(p){return p.route+' · '+states.find(function(s){return s.code===p.code;}).name;}
  function away(n){return n<.1?'About '+Math.max(10,Math.round(n*5280/10)*10)+' feet away.':'About '+n.toFixed(1)+' miles away.';}
  function fail(error){finish(error);event('unavailable');var fa=doc.getElementById('marker-fail-app');if(fa)fa.hidden=false;}
  function clear(){var fa=doc.getElementById('marker-fail-app');if(fa)fa.hidden=true;status.className='';result.hidden=true;next.hidden=true;choices.replaceChildren();choices.hidden=true;}
  // One-decimal estimate like the app: place the reader between the nearest recorded post and the next
  // post on the same road, by projecting onto the line between them. Falls back to the post's own number.
  var lastAll=[],lastCoords=null;
  // Same rule as the app (nearestMilepost.ts): never interpolate between posts of different county or
  // CA postmile qualifier. "R 22.0" and "22.0" in one county are different spots.
  function sameNumbering(a,b){return (a.county||'')===(b.county||'')&&(a.pmPrefix||'')===(b.pmPrefix||'')&&(a.pmSuffix||'')===(b.pmSuffix||'')&&(a.rteSuffix||'')===(b.rteSuffix||'');}
  function pm(p,n){return (p.pmPrefix?p.pmPrefix+' ':'')+n;}
  function estimate(p1){
    var c=lastCoords;if(!c)return {mile:p1.mile};
    var k=Math.cos(c.latitude*Math.PI/180),X=function(q){return q.lon*k;},best=null;
    lastAll.forEach(function(p2){
      if(p2.code!==p1.code||p2.route!==p1.route)return;
      if(!sameNumbering(p1,p2))return;
      var dm=Math.abs(p2.mile-p1.mile);if(dm<0.5||dm>2.5)return;
      var dx=X(p2)-X(p1),dy=p2.lat-p1.lat,L=dx*dx+dy*dy;if(!L)return;
      var tt=((c.longitude*k-X(p1))*dx+(c.latitude-p1.lat)*dy)/L;
      var off=Math.abs((c.longitude*k-X(p1))*dy-(c.latitude-p1.lat)*dx)/Math.sqrt(L);
      var score=(tt>=0&&tt<=1?0:1)*10+off*69+Math.abs(dm-1);
      if(!best||score<best.score)best={p2:p2,t:Math.max(0,Math.min(1,tt)),score:score};
    });
    if(!best)return {mile:p1.mile};
    var lo=p1.mile<best.p2.mile?p1:best.p2,hi=lo===p1?best.p2:p1,out={mile:p1.mile+best.t*(best.p2.mile-p1.mile),lo:lo.mile,hi:hi.mile};
    // Direction only from a moving device's GPS course (speed over ~3 mph). A parked phone gets none.
    var h=Number(c.heading),v=Number(c.speed);
    if(c.heading!=null&&isFinite(h)&&isFinite(v)&&v>1.4){
      var by=hi.lat-lo.lat,bx=(hi.lon-lo.lon)*k,inc=(Math.atan2(bx,by)*180/Math.PI+360)%360;
      var d=Math.abs(((h-inc)%360+540)%360-180),up=d<90,ns=Math.abs(by)>=Math.abs(bx);
      var pos=ns?(by>0?'Northbound':'Southbound'):(bx>0?'Eastbound':'Westbound');
      var neg={Northbound:'Southbound',Southbound:'Northbound',Eastbound:'Westbound',Westbound:'Eastbound'}[pos];
      out.dir=up?pos:neg;
    }
    return out;
  }
  // One renderer for a found marker and for a road the reader picked from the close-roads list.
  function show(q,picked){
    var post=q.post;
    var st0=states.find(function(s){return s.code===post.code;})||{},km=!!st0.km;
    // BC posts kilometre markers: the number is already km, only the label changes. Distance goes to metres/km.
    var far=function(mi,who){var d=km?(mi*1.60934<0.15?'About '+Math.max(10,Math.round(mi*1609.34/10)*10)+' metres':'About '+(mi*1.60934).toFixed(1)+' km'):away(mi).replace(' away.','');return d+' from '+who+' reported location.';};
    doc.getElementById('marker-unit').textContent=km?'KM':'MILE';
    doc.getElementById('marker-eyebrow').textContent=km?'Nearest recorded kilometre post':'Nearest recorded milepost';
    doc.getElementById('marker-map').hidden=km;doc.getElementById('marker-copy').textContent=km?'Copy kilometre post':'Copy milepost';
    var est=estimate(post);
    var shown=pm(post,est.lo!=null?Number(est.mile).toFixed(1):String(post.mile));
    doc.getElementById('marker-number').textContent=shown;
    doc.getElementById('marker-road').textContent=name(post)+(est.dir?' · '+est.dir:'');
    doc.getElementById('marker-distance').textContent=(est.lo!=null?'Estimated between recorded '+(km?'kilometre posts ':'mileposts ')+pm(post,est.lo)+' and '+pm(post,est.hi)+'.':(km?'Nearest recorded kilometre post, ':'Nearest recorded milepost, ')+far(q.distance,'your').replace(/^About/,'about'));
    doc.getElementById('marker-map').href=mapLink(post);
    var state=states.find(function(s){return s.code===post.code;});
    var conditions=doc.getElementById('marker-conditions');conditions.hidden=state.conditions===false;conditions.href='/road-conditions/'+state.slug+'/';conditions.textContent=state.name+' road conditions';
    var cameras=doc.getElementById('marker-cameras');cameras.hidden=!state.cameras;
    if(state.cameras){cameras.href='/cameras/'+state.slug+'/?route='+encodeURIComponent(routeAlias(post));cameras.textContent=state.name+' highway cameras';}
    copyText=post.route+(est.dir?' '+est.dir:'')+', '+(km?'kilometre ':'mile ')+shown+', '+state.name+'. '+(est.lo!=null?'Estimated between recorded '+(km?'kilometre posts ':'mileposts ')+pm(post,est.lo)+' and '+pm(post,est.hi)+'.':'Nearest recorded '+(km?'kilometre post':'milepost')+', '+far(q.distance,'my').replace(/^About/,'about'));if(doc.body&&doc.body.classList)doc.body.classList.add('found');
    result.hidden=false;next.hidden=false;if(root.scrollTo)root.scrollTo(0,0);finish('Nearest recorded marker. '+post.route+(km?', kilometre ':', mile ')+pm(post,post.mile)+', '+state.name+'.',true);event(picked?'picked':'result');
  }
  button.addEventListener('click',function(){
    var request=++revision;clear();event('start');
    if(root.isSecureContext===false){fail('Open this page over HTTPS to use your location.');return;}
    if(!root.navigator.geolocation){fail('This browser cannot share your location. You can choose a highway on the map.');return;}
    button.disabled=true;button.textContent='Finding your location…';status.textContent='Allow location access when your browser asks.';
    // Covers browsers that leave a permission request open without invoking either callback.
    timer=setTimeout(function(){if(request!==revision)return;revision++;fail('Your location did not come through. Try again or choose a highway on the map.');},25000);
    function current(){return request===revision;}
    function onPosition(position){
      if(!current())return;
      var p=position.coords,check=core.locate(p,[]);
      if(check.kind==='imprecise'){fail('Your location is too approximate to find a mile marker. Enable precise location for this browser, then try again.');return;}
      if(check.kind==='invalid'){fail('Your browser did not return a usable location. Try again.');return;}
      var codes=core.statesAt(p.latitude,p.longitude,states,routes.STATE_BOUNDS);
      if(!codes.length){fail('No marker data found near this location. You can choose a highway on the map.');return;}
      status.textContent='Finding nearby mile markers…';
      Promise.all(codes.map(function(code){
        // Only a state code leaves the browser. No latitude, longitude or accuracy.
        return root.fetch('https://api.milecheckapp.com/mileposts?state='+code,{credentials:'omit',referrerPolicy:'no-referrer'}).then(function(r){if(!r.ok)throw Error('Unavailable');return r.json();}).then(function(data){return core.decode(data,code,routes.formatRouteName);});
      })).then(function(lists){
        if(!current())return;
        lastAll=[].concat.apply([],lists);lastCoords=p;
        var outcome=core.locate(p,lastAll);
        if(outcome.kind==='empty'||outcome.kind==='distant'){fail('No recorded mile marker found within a mile of you. You can choose a highway on the map.');return;}
        if(outcome.kind==='ambiguous'){
          finish('Which highway are you on?');
          // Each choice keeps its map link (no-JS and long-press), but a tap shows that road's answer here.
          outcome.choices.forEach(function(q){var li=doc.createElement('li'),a=doc.createElement('a');a.href=mapLink(q.post);a.textContent=q.post.route+' · '+states.find(function(s){return s.code===q.post.code;}).name;if(a.addEventListener)a.addEventListener('click',function(e){if(e&&e.preventDefault)e.preventDefault();choices.hidden=true;choices.replaceChildren();show(q,true);});li.appendChild(a);choices.appendChild(li);});
          choices.hidden=false;event('ambiguous');return;
        }
        if(outcome.kind!=='found'){fail('Could not find a mile marker. Try again.');return;}
        show(outcome.nearest,false);
      }).catch(function(){if(current())fail('Some mile marker data did not load. Try again or choose a highway on the map.');});
    }
    function onError(error){
      if(!current())return;
      fail(error&&error.code===1?'Location access is off. Allow it in your browser settings, or choose a highway on the map.':error&&error.code===3?'Your location took too long. Try again or choose a highway on the map.':'Your browser could not find your location. Try again or choose a highway on the map.');
    }
    try{root.navigator.geolocation.getCurrentPosition(onPosition,onError,{enableHighAccuracy:true,timeout:15000,maximumAge:0});}catch(error){onError(error);}
  });
  var copyText='',copyBtn=doc.getElementById('marker-copy'),copied=doc.getElementById('marker-copied');
  if(copyBtn)copyBtn.addEventListener('click',function(){var ok=function(){copied.textContent='Copied: '+copyText;},no=function(){copied.textContent=copyText;};try{root.navigator.clipboard.writeText(copyText).then(ok,no);}catch(e){no();}});
  // Arrived from a 'Find my mile marker' button (?go=1): the reader already tapped once, start now.
  if(root.location&&/[?&]go=1\b/.test(root.location.search||""))button.click();
  doc.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('[data-marker-action]');if(a)event(a.getAttribute('data-marker-action'));});
})(window);
