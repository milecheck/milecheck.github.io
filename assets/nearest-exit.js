/* What exit am I near: nearest recorded exits to the visitor. Data: /data/exits/XX.json */
(function(){var B={"AL":[30.48,34.97,-88.39,-85.19],"AR":[33.08,36.38,-94.44,-89.87],"AZ":[31.33,37.01,-114.61,-109.05],"CO":[37.02,40.97,-109.02,-102.25],"FL":[25.81,30.76,-87.37,-80.07],"GA":[30.64,34.97,-85.26,-81.11],"IA":[40.58,43.44,-96.47,-90.37],"ID":[42.07,47.71,-117,-112.05],"IL":[37.05,42.48,-91.34,-87.53],"IN":[38.16,41.69,-87.92,-84.83],"KS":[37.06,39.37,-102.02,-94.61],"KY":[36.67,39.1,-88.69,-82.61],"LA":[29.92,32.59,-93.98,-89.7],"MA":[41.65,42.87,-73.36,-70.73],"MD":[38.8,39.72,-79.42,-75.8],"MI":[41.76,46.46,-86.73,-82.46],"MN":[43.54,46.85,-96.77,-91.33],"MO":[36.02,40.57,-95.59,-89.32],"MS":[30.32,34.99,-90.9,-88.24],"MT":[44.56,48.99,-115.69,-104.17],"NC":[34.26,36.53,-83.02,-77.59],"ND":[45.94,48.97,-104.01,-96.8],"NE":[40.67,41.35,-103.89,-95.93],"NJ":[39.68,41.11,-75.5,-74.01],"NM":[32.01,36.99,-109,-103.1],"NV":[35.78,41.11,-119.02,-114.06],"OH":[39.06,41.92,-84.81,-80.55],"OK":[33.74,36.94,-99.91,-94.53],"OR":[42.08,45.92,-123.39,-116.94],"PA":[39.72,42.23,-80.5,-74.71],"RI":[41.45,41.95,-71.79,-71.36],"SC":[32.27,35.18,-83.02,-79.37],"SD":[42.5,45.85,-104.01,-96.49],"TN":[35.01,36.63,-90.08,-82.26],"TX":[26.15,35.27,-105.9,-93.74],"UT":[37.03,41.97,-114.04,-109.13],"VA":[36.58,39.29,-82.23,-76.2],"WA":[45.6,49,-123,-117.05],"WI":[42.52,44.96,-92.76,-87.71],"WV":[37.29,40.07,-82.57,-77.87],"WY":[41.04,44.98,-110.98,-104.08]};
function d(a,b,c,e){var r=Math.PI/180,x=(c-a)*r,y=(e-b)*r,h=Math.sin(x/2)*Math.sin(x/2)+Math.cos(a*r)*Math.cos(c*r)*Math.sin(y/2)*Math.sin(y/2);return 3958.8*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h));}
function brg(a,b,c,e){var r=Math.PI/180,y=Math.sin((e-b)*r)*Math.cos(c*r),x=Math.cos(a*r)*Math.sin(c*r)-Math.sin(a*r)*Math.cos(c*r)*Math.cos((e-b)*r);return (Math.atan2(y,x)/r+360)%360;}
function cmp(g){return ["north","northeast","east","southeast","south","southwest","west","northwest"][Math.round(g/45)%8];}
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c];});}
var btn=document.getElementById("exit-locate"),st=document.getElementById("exit-status"),out=document.getElementById("exit-result"),none=document.getElementById("exit-none");
if(!btn)return;
btn.addEventListener("click",function(){
 if(!navigator.geolocation){st.textContent="This browser can’t share a location.";return;}
 st.textContent="Finding your location…";out.hidden=true;none.hidden=true;
 navigator.geolocation.getCurrentPosition(function(p){
  var la=p.coords.latitude,lo=p.coords.longitude,hd=p.coords.heading,sp=p.coords.speed;
  var codes=Object.keys(B).filter(function(k){var b=B[k];return la>=b[0]-.1&&la<=b[1]+.1&&lo>=b[2]-.1&&lo<=b[3]+.1;});
  if(!codes.length){st.textContent="";none.hidden=false;return;}
  Promise.all(codes.map(function(c){return fetch("/data/exits/"+c+".json").then(function(r){return r.json();}).then(function(j){return (j.exits||j).map(function(x){x.st=c;return x;});}).catch(function(){return [];});})).then(function(l){
   var all=[].concat.apply([],l).map(function(x){x.mi=d(la,lo,x.la,x.lo);x.g=brg(la,lo,x.la,x.lo);return x;}).filter(function(x){return x.mi<=10;}).sort(function(a,b){return a.mi-b.mi;}).slice(0,3);
   st.textContent="";
   if(!all.length){none.hidden=false;return;}
   var moving=hd!=null&&!isNaN(hd)&&sp!=null&&sp>2;
   out.innerHTML=all.map(function(x,i){var ahead=moving&&Math.abs(((x.g-hd+540)%360)-180)<90?" · ahead of you":"";
    return "<li"+(i?"":" class=\"exit-top\"")+"><span class=\"exit-sign\">EXIT<b>"+esc(x.x)+"</b></span><span class=\"exit-text\"><b>"+esc(x.r)+(x.n?" · "+esc(x.n):"")+"</b><br>"+(x.mi<0.1?"Right here":x.mi.toFixed(1)+" mi "+cmp(x.g)+" of you")+ahead+"</span></li>";}).join("");
   out.hidden=false;
  });
 },function(){st.textContent="Location was blocked or timed out. Allow location for this site and tap again.";},{enableHighAccuracy:true,timeout:15000,maximumAge:0});
});})();