// sponsor-slot.js — the one sponsor slot on the corridor + camera page templates.
// Added 2026-09-15 so a placement exists, and is counted, before the first sale.
//
// Where it sits: at the top of the page, above the eyebrow, on every page
// written by gen-corridor-pages.js, gen-state-camera-pages.js,
// gen-city-camera-pages.js and gen-pass-pages.js, and on every static page
// scripts/add-sponsor-slots.mjs knows (home, guides, articles, bridges, hubs,
// the live-conditions pages). Static HTML plus ~2 KB of inline CSS and JS. No
// third-party script, no cookie, no visitor ID, no extra request until the
// slot has actually been seen.
//
// Config: data/sponsors.json (read its _readme). An unsold slot renders the
// house version ("Sponsor this page" → /partners/#sponsor) and is counted the
// same way, so the numbers exist before anyone buys.
//
// Counting: one beacon per page view once the slot has been at least half
// visible for one second (the IAB viewable-impression rule), and one beacon
// per click on the slot. POST /sponsor-beacon on the Worker → Analytics
// Engine. Report: node scripts/sponsor-report.mjs in the app repo.

'use strict';
const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '..', '..', 'data', 'sponsors.json');
const BEACON_URL = 'https://milepost-proxy.leahgerber93.workers.dev/sponsor-beacon';

let cfgCache = null;
const placed = [];

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// A slot key is <family>:<slug>. Families are what sales sells (2026-09-24, Leah:
// not by state or location): home, cameras, corridor, pass, bridge, guide (state and
// province mile-marker guides), basics (the highway-basics explainers), article
// (blog posts and reports), live (borders, ferries, fires, closures, weather),
// mountain (the Mountain Visibility hub, 2026-09-24: a scenic-flight operator is the
// obvious buyer), drawbridge (the Seattle Drawbridges app site).
// Every page belongs to exactly one family, so families never overlap. The config
// still carries one entry per page; a family sale is one entry per page in it.
// Pricing is not public: the house slot and /sponsor/ point at sales@.
const FAMILIES = ['home', 'cameras', 'corridor', 'pass', 'bridge', 'guide', 'basics', 'article', 'live', 'mountain', 'drawbridge'];
const PAGE_KEY_RE = new RegExp('^(' + FAMILIES.join('|') + '):[a-z0-9-]{1,60}$');
function assertPagesOnly(cfg) {
  const bad = Object.keys(cfg.slots || {}).filter((k) => !PAGE_KEY_RE.test(k));
  if (bad.length) {
    throw new Error(`data/sponsors.json: slot keys are <family>:<slug> with family one of ${FAMILIES.join(', ')}. Refusing: ${bad.join(', ')}`);
  }
}

function loadConfig() {
  if (!cfgCache) {
    cfgCache = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    assertPagesOnly(cfgCache);
  }
  return cfgCache;
}

function today() {
  return process.env.SPONSOR_TODAY || new Date().toISOString().slice(0, 10);
}

// Keys to try for a page, most specific first.
function keysFor(kind, page) {
  // One key per page, <family>:<slug>. No fallbacks: a family sale is one entry per page.
  return [prefixFor(kind) + page.slug];
}

function isActive(s, day) {
  if (!s || typeof s !== 'object' || !s.id || !s.url || !s.name) return false;
  if (s.start && day < s.start) return false;
  if (s.end && day > s.end) return false;
  return true;
}

function resolve(cfg, keys, day) {
  for (const k of keys) {
    const s = cfg.slots && cfg.slots[k];
    if (isActive(s, day)) return { key: k, sponsor: s };
  }
  return { key: null, sponsor: null };
}

function slotHtml(slotKey, sponsor, house) {
  if (!sponsor) {
    // House version: Roy on the left, pointing at the message (Leah, 2026-09-24).
    // The placeholder is a crop of roy-crew.png until the pointing Roy arrives.
    return `  <aside class="spon spon-house" id="spon" data-slot="${esc(slotKey)}" data-sponsor="house" aria-label="Sponsor">
    <img class="spon-roy" src="${esc(house.roy || '/images/sponsors/roy-sponsor.png')}" width="276" height="235" alt="" loading="lazy" decoding="async">
    <a class="spon-body" href="${esc(house.url)}" data-spon-link>
      <span class="spon-text"><strong>${esc(house.title || 'Sponsor this page.')}</strong>${house.copy ? ' ' + esc(house.copy) : ''}</span>
      <span class="spon-cta">${esc(house.cta)} →</span>
    </a>
  </aside>`;
  }
  const logo = sponsor.logo
    ? `\n      <img class="spon-logo" src="${esc(sponsor.logo)}" width="${+sponsor.logoW || 264}" height="${+sponsor.logoH || 72}" alt="" loading="lazy" decoding="async">`
    : '';
  return `  <aside class="spon" id="spon" data-slot="${esc(slotKey)}" data-sponsor="${esc(sponsor.id)}" aria-label="Sponsor">
    <span class="spon-tag">Sponsor</span>
    <a class="spon-body" href="${esc(sponsor.url)}" rel="sponsored noopener" target="_blank" data-spon-link>${logo}
      <span class="spon-text"><strong>${esc(sponsor.name)}</strong> ${esc(sponsor.copy || '')}</span>
      <span class="spon-cta">${esc(sponsor.cta || 'Learn more')} →</span>
    </a>
  </aside>`;
}

// Matches the page's own inline styles (white card, 1px #E5E5E5, 12px radius).
// min-height reserves the strip's box before fonts load, so nothing below it moves.
const CSS = `    .spon{display:flex;align-items:center;gap:12px;min-height:58px;margin:0 0 12px;padding:9px 14px;border:1px solid #E5E5E5;border-radius:12px;background:#fff;box-sizing:border-box;}
    .spon-tag{flex:none;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#5b6670;border:1px solid #E5E5E5;border-radius:6px;padding:3px 7px;line-height:1.3;}
    .spon-body{display:flex;align-items:center;gap:12px;flex:1;min-width:0;text-decoration:none;color:#0E1116;}
    .spon-logo{flex:none;height:36px;width:auto;max-width:132px;object-fit:contain;}
    .spon-text{flex:1;min-width:0;font-size:14.5px;line-height:1.35;color:#3a444d;}
    .spon-text strong{color:#0E1116;font-weight:800;}
    .spon-house{background:linear-gradient(90deg,#f3f7f4,#fff 45%);border-color:#cfe3d7;}
    .spon.spon-house{min-height:76px;padding:6px 14px 6px 10px;}
    .spon-roy{flex:none;height:64px;width:auto;margin:0;align-self:center;}
    .spon-house .spon-text{color:#1f3b2d;}
    .spon-house .spon-text strong{color:#0f7a4f;}
    .spon-logo-ph{display:inline-flex;align-items:center;justify-content:center;width:96px;height:36px;border:1px dashed #b9c0c7;border-radius:6px;font-size:11px;color:#5b6670;background:#f6f7f8;}
    .spon-preview{flex:none;font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#fff;background:#0f7a4f;border-radius:6px;padding:3px 7px;}
    .spon-cta{flex:none;font-size:13.5px;font-weight:700;color:#0f7a4f;white-space:nowrap;}
    .spon-body:hover .spon-cta{text-decoration:underline;}
    @media(max-width:600px){ .spon.spon-house{flex-wrap:nowrap;align-items:center;gap:10px;padding:8px 10px;min-height:0;} .spon-roy{height:50px;margin:0;align-self:center;} .spon.spon-house .spon-body{flex:1 1 auto;flex-basis:auto;flex-direction:column;align-items:flex-start;gap:3px;flex-wrap:nowrap;} .spon-house .spon-text{font-size:13.5px;} .spon-house .spon-cta{margin-left:0;} .spon{flex-wrap:wrap;gap:8px 12px;padding:10px 12px;min-height:44px;} .spon-body{flex-basis:100%;flex-wrap:wrap;} .spon-text{flex:1 1 60%;} .spon-cta{margin-left:auto;} }`;

// Impression = slot at least 50% visible, in a visible tab, for 1 second, once
// (a browser without IntersectionObserver counts nothing, so every recorded
// impression met the test; fixed 2026-09-17 after the media-kit review)
// per page view. Click = any click or middle-click on the slot's link. Both go
// out as a single POST with no body via sendBeacon (survives navigation, no
// preflight). Automation (navigator.webdriver) sends nothing.
const JS = `<script>(function(){var el=document.getElementById('spon');if(!el)return;var q=new URLSearchParams(location.search);if(q.get('sponsor')==='preview'){var nm=(q.get('name')||'Your company').slice(0,60),cp=(q.get('copy')||'One sentence about what you do for the drivers on this page.').slice(0,120),ct=(q.get('cta')||'Your link').slice(0,30);el.setAttribute('data-sponsor','preview');el.innerHTML='';var tg=document.createElement('span');tg.className='spon-tag';tg.textContent='Sponsor';var a=document.createElement('a');a.className='spon-body';a.href='#';a.addEventListener('click',function(ev){ev.preventDefault();});var lg=document.createElement('span');lg.className='spon-logo spon-logo-ph';lg.textContent='Your logo';var tx=document.createElement('span');tx.className='spon-text';var st=document.createElement('strong');st.textContent=nm;tx.appendChild(st);tx.appendChild(document.createTextNode(' '+cp));var c=document.createElement('span');c.className='spon-cta';c.textContent=ct+' \u2192';a.appendChild(lg);a.appendChild(tx);a.appendChild(c);el.appendChild(tg);el.appendChild(a);var pv=document.createElement('span');pv.className='spon-preview';pv.textContent='Preview';el.appendChild(pv);return;}if(navigator.webdriver)return;var B=${JSON.stringify(BEACON_URL)},S=el.getAttribute('data-slot'),A=el.getAttribute('data-sponsor'),P=location.pathname;function send(e){var u=B+'?e='+e+'&s='+encodeURIComponent(S)+'&a='+encodeURIComponent(A)+'&p='+encodeURIComponent(P);try{if(navigator.sendBeacon)navigator.sendBeacon(u);else fetch(u,{method:'POST',keepalive:true}).catch(function(){});}catch(x){}}var done=false,t=null,inView=false,io=null;function arm(){if(done||t||!inView||document.visibilityState!=='visible')return;t=setTimeout(function(){t=null;if(done||!inView||document.visibilityState!=='visible')return;done=true;if(io)io.disconnect();send('imp');},1000);}function disarm(){if(t){clearTimeout(t);t=null;}}if('IntersectionObserver' in window){io=new IntersectionObserver(function(en){en.forEach(function(x){inView=x.isIntersecting&&x.intersectionRatio>=0.5;if(inView)arm();else disarm();});},{threshold:[0,0.5,1]});io.observe(el);document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible')arm();else disarm();});}var a=el.querySelector('[data-spon-link]');if(a){a.addEventListener('click',function(){send('click');});a.addEventListener('auxclick',function(ev){if(ev.button===1)send('click');});}})();</script>`;

// kind = the family (see FAMILIES). 'cameras' and 'corridor' keep their 2026-09-15 spellings.
function prefixFor(kind) { if (!FAMILIES.includes(kind)) throw new Error('sponsor-slot: unknown family ' + kind); return kind + ':'; }

// Called once per generated page.
// page: { slug, name, state? } — state is the 2-letter code for camera pages.
function slot({ kind, slug, state, name }) {
  const cfg = loadConfig();
  const day = today();
  const slotKey = prefixFor(kind) + slug;
  const { key, sponsor } = resolve(cfg, keysFor(kind, { slug, state }), day);
  const house = Object.assign({ url: '/sponsor/', cta: 'Ask about it', title: 'Sponsor this page.', copy: '' }, cfg.house || {});
  placed.push({ slotKey, name, via: key, sponsorId: sponsor ? sponsor.id : 'house' });
  return {
    key: slotKey,
    sponsorId: sponsor ? sponsor.id : 'house',
    html: slotHtml(slotKey, sponsor, house),
    css: CSS,
    js: JS,
  };
}

// One line per page for the generator's console output.
function summary() {
  const sold = placed.filter(p => p.sponsorId !== 'house');
  const lines = [`Sponsor slots: ${placed.length} pages, ${sold.length} sold, ${placed.length - sold.length} house.`];
  for (const p of sold) lines.push(`  ${p.slotKey} → ${p.sponsorId} (via ${p.via})`);
  return lines.join('\n');
}

module.exports = { slot, summary, keysFor, resolve, isActive, slotHtml, assertPagesOnly, PAGE_KEY_RE, FAMILIES, BEACON_URL, CONFIG_PATH };
