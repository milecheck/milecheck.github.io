// Own-map Step 1 (2026-11-27): serve every PMTiles source as edge-cached z/x/y tiles from the Worker
// (api.milecheckapp.com/basemap/t/<name>). Rewrites pmtiles:// URLs at setStyle time; unknown files stay on pmtiles://.
(function(){if(window.__tj||!window.maplibregl)return;window.__tj=1;var V='2611';
var M={'wa/base2':'wa-base','water3':'wa-water','poi2':'wa-poi','mp':'wa-mp','or/base2':'or-base','or/water3':'or-water','or/poi2':'or-poi','or/mp':'or-mp','or/lanes':'or-lanes',
'fl/base2':'fl-base','fl/water3':'fl-water','fl/poi2':'fl-poi','fl/mp':'fl-mp','blocks':'blocks','ocean':'ocean','local':'local'};
var R={'streets':'streets','hillshade':'hillshade','wa-lanes-v2':'wa-lanes-v2','fl-lanes':'fl-lanes'};
var T='https://api.milecheckapp.com/basemap/t/';
function name(u){var m=u.match(/\/maptest\/tiles\/(.+)\.pmtiles$/);if(m&&M[m[1]])return M[m[1]]+'-'+V;m=u.match(/\/basemap\/([a-z0-9-]+)\.pmtiles$/);return m&&R[m[1]]||null}
function fix(st){if(!st||typeof st!=='object'||!st.sources)return st;for(var k in st.sources){var s=st.sources[k];if(!s||!s.url||s.url.indexOf('pmtiles://')!==0)continue;var n=name(s.url.slice(10));if(n)s.url=T+n+'.json'}return st}
window.__tjFix=fix;var o=maplibregl.Map.prototype.setStyle;maplibregl.Map.prototype.setStyle=function(st,opt){return o.call(this,fix(st),opt)};var a=maplibregl.Map.prototype.addSource;maplibregl.Map.prototype.addSource=function(id,src){if(src&&src.url)fix({sources:{x:src}});return a.call(this,id,src)};})();
