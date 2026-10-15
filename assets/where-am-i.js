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
  function fail(error){finish(error);event('unavailable');}
  function clear(){status.className='';result.hidden=true;next.hidden=true;choices.replaceChildren();choices.hidden=true;}
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
        return root.fetch('https://milepost-proxy.leahgerber93.workers.dev/mileposts?state='+code,{credentials:'omit',referrerPolicy:'no-referrer'}).then(function(r){if(!r.ok)throw Error('Unavailable');return r.json();}).then(function(data){return core.decode(data,code,routes.formatRouteName);});
      })).then(function(lists){
        if(!current())return;
        var outcome=core.locate(p,[].concat.apply([],lists));
        if(outcome.kind==='empty'||outcome.kind==='distant'){fail('No recorded mile marker found within a mile of you. You can choose a highway on the map.');return;}
        if(outcome.kind==='ambiguous'){
          finish('Several mile markers are close. Check the highway on the map.');
          outcome.choices.forEach(function(q){var li=doc.createElement('li'),a=doc.createElement('a');a.href=mapLink(q.post);a.textContent=q.post.route+', mile '+q.post.mile+' · '+states.find(function(s){return s.code===q.post.code;}).name;li.appendChild(a);choices.appendChild(li);});
          choices.hidden=false;event('ambiguous');return;
        }
        if(outcome.kind!=='found'){fail('Could not find a mile marker. Try again.');return;}
        var q=outcome.nearest,post=q.post;
        doc.getElementById('marker-number').textContent=String(post.mile);
        doc.getElementById('marker-road').textContent=name(post);
        doc.getElementById('marker-distance').textContent=away(q.distance).replace(' away.',' from your reported location.');
        doc.getElementById('marker-map').href=mapLink(post);
        var state=states.find(function(s){return s.code===post.code;});
        var conditions=doc.getElementById('marker-conditions');conditions.href='/road-conditions/'+state.slug+'/';conditions.textContent=state.name+' road conditions';
        var cameras=doc.getElementById('marker-cameras');cameras.hidden=!state.cameras;
        if(state.cameras){cameras.href='/cameras/'+state.slug+'/?route='+encodeURIComponent(routeAlias(post));cameras.textContent=state.name+' highway cameras';}
        copyText=post.route+', recorded milepost '+post.mile+', '+state.name+'. '+away(q.distance).replace(' away.',' from my reported location.');if(doc.body&&doc.body.classList)doc.body.classList.add('found');button.textContent='Update my location';
        result.hidden=false;next.hidden=false;if(root.scrollTo)root.scrollTo&&root.scrollTo(0,0);finish('Nearest recorded marker. '+post.route+', mile '+post.mile+', '+state.name+'.',true);event('result');
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
