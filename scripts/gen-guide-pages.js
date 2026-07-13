// Generates top-level highway-reference guide pages (/mile-markers-vs-exit-numbers/, etc.)
// Clear, factual "answer" content — the format Google AI Overviews + ChatGPT/Claude cite,
// and that builds topical authority for the whole site. Run: node scripts/gen-guide-pages.js
const fs = require('fs');
const path = require('path');

const APP = 'https://apps.apple.com/us/app/milecheck/id6759212851';
const PLAY = 'https://play.google.com/store/apps/details?id=app.milecheck.mobile';

const GUIDES = [
  {
    slug:'mile-markers-vs-exit-numbers', eyebrow:'Highway basics',
    title:"Mile Markers vs Exit Numbers: What's the Difference?",
    h1:"Mile markers vs exit numbers: what's the difference?",
    lede:`Both count distance along a highway, but they answer different questions. A mile marker tells you your exact position anywhere on the road; an exit number only appears at interchanges. On most modern interstates they line up — but they're not the same thing.`,
    sections:[
      ['Mile markers = your continuous position',`A mile marker (or milepost) is a small green sign along the shoulder, posted roughly every mile, counting up from 0 at the southern or western edge of the state. It tells you exactly where you are at any point — between towns, between exits, in the middle of nowhere. That's why 911 and tow trucks ask for it. <a href="../what-is-my-mile-marker/">More on how mile markers work →</a>`],
      ['Exit numbers = only at interchanges',`An exit number only appears where you can get on or off the highway. On most US interstates, exit numbers are <strong>mile-based</strong>: the exit number matches the nearest mile marker, so Exit 34 sits at about mile 34. That means exit numbers and mile markers climb together — a handy cross-check.`],
      ['Why some highways number exits sequentially',`A few older highways used <strong>sequential</strong> (consecutive) exit numbering — Exit 1, Exit 2, Exit 3 — regardless of mileage. Most have converted to the mile-based system, but you may still see sequential numbering on some toll roads and older state routes, where the exit number won't match a mile marker.`],
      ['Which one should you use?',`For telling someone exactly where you are — a dispatcher, a tow, a friend — the <strong>mile marker</strong> is the better answer, because it works anywhere, not just at an interchange. The MileCheck app shows your exact mile marker in real time as you drive, so you always have that precise number ready.`],
    ],
    faq:[
      ['Do exit numbers match mile markers?',`On most US interstates, yes — exit numbers are mile-based, so Exit 34 is at about mile marker 34. Some older highways use sequential exit numbering that doesn't match mileage.`],
      ['What is the difference between a mile marker and an exit number?',`A mile marker shows your continuous position along the highway, posted every mile. An exit number only appears at interchanges. Where mile-based numbering is used, an exit number roughly equals the nearest mile marker.`],
      ['Why do some highways have sequential exit numbers?',`Older systems numbered exits consecutively (1, 2, 3…) instead of by mileage. Most states have switched to mile-based exit numbers, but some toll roads and older routes still use the sequential style.`],
      ['How do I find my mile marker between exits?',`Watch for the small green mile marker signs on the shoulder, or use a GPS app like <a href="`+APP+`" target="_blank" rel="noopener">MileCheck</a>, which shows your exact mile marker continuously — even with no exit or sign nearby.`],
    ],
    related:`<a href="../what-is-my-mile-marker/">What is my mile marker?</a> · <a href="../how-interstates-are-numbered/">How interstates are numbered</a> · <a href="../report-location/">Report your location</a>`,
  },
  {
    slug:'how-interstates-are-numbered', eyebrow:'Highway basics',
    title:"How Interstate Highways Are Numbered (the System Explained)",
    h1:"How US interstate highways are numbered",
    lede:`The interstate numbering system isn't random — once you know the pattern, you can tell a highway's direction and roughly where it is in the country just from its number.`,
    sections:[
      ['Odd vs even: direction',`<strong>Odd-numbered</strong> interstates run <strong>north–south</strong> (I-5, I-95). <strong>Even-numbered</strong> interstates run <strong>east–west</strong> (I-10, I-90). It's the opposite of the US Highway grid in some regions, but the interstate rule is consistent nationwide.`],
      ['Low to high: location',`Numbers <strong>increase from west to east</strong> and <strong>from south to north</strong>. So I-5 hugs the West Coast and I-95 runs up the East Coast; I-10 crosses the southern states and I-90 crosses the north. A one- or two-digit number tells you roughly which part of the country a route is in.`],
      ['Three-digit interstates: loops and spurs',`A three-digit interstate is an auxiliary route tied to a two-digit "parent." The <strong>first digit</strong> tells you which: an <strong>even</strong> first digit means a <strong>loop or beltway</strong> that connects to the parent at both ends (like I-495 around Washington, DC), while an <strong>odd</strong> first digit means a <strong>spur</strong> that connects at just one end (like I-395). The last two digits are the parent route.`],
      ['Mile markers reset at the state line',`On every interstate, mile markers count up from 0 at the state's southern or western edge and reset at each state line — so the same mile number appears in every state the highway passes through. That's why a location is always given as route plus mile plus state.`],
    ],
    faq:[
      ['Are odd interstates north-south or east-west?',`Odd-numbered interstates run north–south (like I-5 and I-95). Even-numbered interstates run east–west (like I-10 and I-90).`],
      ['What do 3-digit interstate numbers mean?',`Three-digit interstates are auxiliary routes off a two-digit parent. An even first digit is a loop or beltway (connects at both ends); an odd first digit is a spur (connects at one end).`],
      ['Why does I-95 have a high number and I-5 a low one?',`Interstate numbers increase from west to east. I-5 runs up the West Coast (low number) and I-95 up the East Coast (high number). Even numbers work the same south-to-north.`],
      ['What is the difference between a loop and a spur interstate?',`A loop (or beltway) rejoins its parent interstate at both ends and usually circles a city. A spur connects to the parent at only one end and dead-ends into a destination.`],
    ],
    related:`<a href="../mile-markers-vs-exit-numbers/">Mile markers vs exit numbers</a> · <a href="../corridors/">Interstate corridors</a> · <a href="../what-is-my-mile-marker/">What is my mile marker?</a>`,
  },
  {
    slug:'highway-sign-colors', eyebrow:'Highway basics',
    title:"What Highway Sign Colors Mean (Green, Blue, Brown & More)",
    h1:"What highway sign colors mean",
    lede:`Every color on a US highway sign has a specific job, set by the federal Manual on Uniform Traffic Control Devices. Once you know the code, a sign's color tells you what it's for before you even read the words.`,
    sections:[
      ['Green — guide and direction',`Green signs are <strong>guide signs</strong>: directions, distances, exit information, and street names. The small green <strong>mile marker</strong> signs on the shoulder are green for the same reason — they're telling you where you are. <a href="../what-is-my-mile-marker/">More on mile markers →</a>`],
      ['Blue — motorist services',`Blue signs point to <strong>services for travelers</strong> — gas, food, lodging, hospitals, and rest areas, usually near exits.`],
      ['Brown — recreation and culture',`Brown signs mark <strong>parks, campgrounds, historic sites, scenic areas, and cultural points of interest.</strong>`],
      ['Red, yellow, and orange — stop, warn, work',`<strong>Red</strong> signs mean stop or prohibition (stop, yield, wrong way, do not enter). <strong>Yellow</strong> signs are general warnings (curves, merges, animal crossings, slippery when wet). <strong>Orange</strong> signs mean <strong>construction and work zones</strong> — expect crews, lane shifts, and changed conditions ahead.`],
      ['White and yellow-green — rules and people',`<strong>White</strong> signs with black lettering are <strong>regulatory</strong> — speed limits, lane use, turn restrictions. Bright <strong>fluorescent yellow-green</strong> signs warn of <strong>pedestrians, schools, and bike crossings.</strong>`],
    ],
    faq:[
      ['What do green highway signs mean?',`Green signs are guide signs — they show directions, distances, exits, and mile markers. Mile marker signs are green because they tell you your location.`],
      ['What color are mile marker signs?',`Mile marker (milepost) signs are green, the color used for all guide and location signs on US highways.`],
      ['What do blue highway signs mean?',`Blue signs point to motorist services — gas stations, food, lodging, hospitals, and rest areas.`],
      ['What does an orange highway sign mean?',`Orange signs mark construction and work zones. They warn of crews, lane closures, and changed conditions ahead.`],
    ],
    related:`<a href="../what-is-my-mile-marker/">What is my mile marker?</a> · <a href="../how-interstates-are-numbered/">How interstates are numbered</a> · <a href="../cameras/">Live highway cameras</a>`,
  },
  {
    slug:'chains-required-explained', eyebrow:'Winter driving',
    title:"What \"Chains Required\" Means (Traction Laws Explained)",
    h1:"What \"chains required\" means — traction laws explained",
    lede:`When snow and ice hit a mountain pass, state transportation departments post traction and chain requirements that can change within the hour. Here's what the levels mean and how to check before you climb.`,
    sections:[
      ['What "chains required" means',`When a "chains required" restriction is in effect, you must put tire chains — or another approved traction device — on your tires before you continue past the checkpoint. It's not a suggestion; it's enforced, and troopers turn back vehicles without them. The rule kicks in when the roadway is snow-covered or icy enough that ordinary tires can't hold.`],
      ['R1, R2, R3 and other levels',`States use different labels, but the idea is the same — escalating requirements as conditions worsen. California's widely-copied system is a good example: <strong>R1</strong> means chains or snow tires are required; <strong>R2</strong> means chains are required on all vehicles except four-wheel/all-wheel drive with snow tires on all four wheels; <strong>R3</strong> means chains are required on <strong>every</strong> vehicle, no exceptions. Other states post "traction tires advised," "traction tires required," and "chains required" in a similar ladder.`],
      ['It changes fast — check before you go',`Pass conditions can go from bare pavement to chains-required within an hour as a storm moves in. The requirement you saw this morning may not be the one in effect this afternoon. Always follow the posted signs at the pass, and check the live cameras and DOT reports before you leave — see current <a href="../passes/">mountain pass conditions</a> for <a href="../passes/snoqualmie/">Snoqualmie</a>, <a href="../passes/donner/">Donner</a>, and more.`],
      ['Be ready before the pass',`Carry chains that fit your tires whenever you drive a mountain route in winter, and know how to put them on before you need to — the shoulder of a snowy pass in the dark is a bad place to learn. The MileCheck app shows your exact mile marker as you climb, so if you do have to stop, you know precisely where you are.`],
    ],
    faq:[
      ['What does "chains required" mean?',`It means you must install tire chains or an approved traction device before continuing past the checkpoint. It's enforced, and vehicles without chains are turned back.`],
      ['What are R1, R2, and R3 chain controls?',`In California's system: R1 = chains or snow tires required; R2 = chains required except for 4WD/AWD with snow tires on all four wheels; R3 = chains required on all vehicles with no exceptions. Other states use similar escalating levels.`],
      ['Do all-wheel-drive cars need chains?',`Often not at the lower levels (like R1/R2) if they have snow tires on all four wheels — but at the highest level (R3), chains are required on every vehicle. Always follow the posted restriction, which can change with conditions.`],
      ['How do I know if chains are required on a pass?',`Check the posted signs at the pass, the state DOT's pass report, and the live cameras before you go. See current <a href="../passes/">mountain pass conditions</a> for the pass on your route.`],
    ],
    related:`<a href="../passes/">Mountain pass conditions</a> · <a href="../cameras/">Live highway cameras</a> · <a href="../corridors/i-80/">I-80 (Donner Pass)</a>`,
  },
];

function faqJsonLd(g){ return JSON.stringify({'@context':'https://schema.org','@type':'FAQPage','mainEntity':g.faq.map(([q,a])=>({'@type':'Question','name':q,'acceptedAnswer':{'@type':'Answer','text':a.replace(/<[^>]+>/g,'')}}))}); }
function articleJsonLd(g){ return JSON.stringify({'@context':'https://schema.org','@type':'Article','headline':g.h1,'author':{'@type':'Organization','name':'MileCheck'},'publisher':{'@type':'Organization','name':'MileCheck'},'mainEntityOfPage':'https://milecheckapp.com/'+g.slug+'/'}); }

function page(g){
  const secHtml=g.sections.map(([h,p])=>`    <h2>${h}</h2>\n    <p>${p}</p>`).join('\n');
  const faqHtml=g.faq.map(([q,a])=>`      <details><summary>${q}</summary><p>${a}</p></details>`).join('\n');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta name="apple-itunes-app" content="app-id=6759212851">
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${g.title} | MileCheck</title>
  <meta name="description" content="${g.lede.replace(/<[^>]+>/g,'').slice(0,155)}">
  <link rel="canonical" href="https://milecheckapp.com/${g.slug}/">
  <meta property="og:title" content="${g.title} | MileCheck">
  <meta property="og:description" content="${g.lede.replace(/<[^>]+>/g,'').slice(0,155)}">
  <meta property="og:image" content="https://milecheckapp.com/images/og-banner-light.png">
  <meta property="og:url" content="https://milecheckapp.com/${g.slug}/">
  <meta property="og:type" content="article">
  <link rel="icon" type="image/png" href="../images/favicon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../style.css">
  <script type="application/ld+json">${faqJsonLd(g)}</script>
  <script type="application/ld+json">${articleJsonLd(g)}</script>
  <style>
    .art{max-width:760px;margin:0 auto;padding:34px 20px 40px;}
    .art .eyebrow{font-size:13px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:#0f7a4f;margin-bottom:6px;}
    .art h1{font-size:clamp(28px,5vw,42px);line-height:1.12;margin:0 0 14px;}
    .art .lede{font-size:18px;line-height:1.6;color:#3a444d;margin:0 0 22px;}
    .art h2{font-size:23px;margin:30px 0 8px;}
    .art p{font-size:16px;line-height:1.7;color:#2a333b;margin:0 0 14px;}
    .art a{color:#0f7a4f;font-weight:700;text-decoration:none;}
    .art a:hover{text-decoration:underline;}
    .art strong{color:#0E1116;}
    .cta{border:1px solid #E5E5E5;border-radius:16px;background:linear-gradient(135deg,#f4fbf7,#ffffff);padding:24px 22px;margin:28px 0;text-align:center;}
    .cta h3{font-size:21px;margin:0 0 8px;}
    .cta p{font-size:15.5px;color:#3a444d;margin:0 auto 14px;max-width:520px;}
    .cta .btns{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;}
    .cta .btns a{display:inline-block;padding:11px 20px;border-radius:10px;font-weight:700;font-size:14.5px;text-decoration:none;}
    .cta .btns a.primary{background:#0f7a4f;color:#fff;}
    .cta .btns a.ghost{border:1px solid #0F1419;color:#0F1419;}
    .faq details{border:1px solid #E5E5E5;border-radius:12px;background:#fff;padding:14px 18px;margin-bottom:10px;}
    .faq summary{font-weight:700;font-size:16px;cursor:pointer;}
    .faq p{margin:10px 0 0;}
    .g-related{color:#5b6670;font-size:14px;margin-top:26px;}
    .g-related a{color:#0f7a4f;font-weight:700;text-decoration:none;}
  </style>
</head>
<body>

  <header class="site-header">
    <div class="container header-inner">
      <a href="../index.html" class="brand" style="display:inline-flex;align-items:center;gap:9px;"><img src="../assets/app-icon-60.png" alt="" style="width:28px;height:28px;border-radius:7px;flex-shrink:0;">MileCheck</a>
      <button class="nav-toggle" aria-label="Menu"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0F1419" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg></button>
      <nav class="primary-nav">
        <a href="../index.html">Home</a>
        <a href="../maps/">Maps</a>
        <a href="../cameras/">Cameras</a>
        <a href="../states/">United States</a>
        <a href="../canada/">Canada</a>
        <a href="../index.html#story">Story</a>
        <a href="../index.html#b2b">B2B</a>
        <a href="../blog/">Blog</a>
        <a href="https://apps.apple.com/us/app/milecheck/id6759212851" class="nav-cta" target="_blank" rel="noopener">Get the app</a>
      </nav>
    </div>
  </header>

  <article class="art">
    <div class="eyebrow">${g.eyebrow}</div>
    <h1>${g.h1}</h1>
    <p class="lede">${g.lede}</p>

${secHtml}

    <div class="cta">
      <h3>Know exactly where you are — live</h3>
      <p>MileCheck shows your nearest mile marker in real time as you drive, plus live DOT alerts and the nearest camera on your route. Free to start, works offline, runs on CarPlay and Android Auto.</p>
      <div class="btns">
        <a class="primary" href="${APP}" target="_blank" rel="noopener">iOS App Store</a>
        <a class="ghost" href="${PLAY}" target="_blank" rel="noopener">Google Play</a>
      </div>
    </div>

    <h2 style="margin-top:34px">Questions, answered</h2>
    <div class="faq">
${faqHtml}
    </div>

    <p class="g-related">Related: ${g.related}</p>
  </article>

  <footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-col footer-col-brand">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;"><img src="../assets/app-icon-60.png" alt="MileCheck" style="width:36px;height:36px;border-radius:9px;flex-shrink:0;"><p class="footer-brand" style="margin-bottom:0;">MileCheck</p></div>
          <p class="footer-tagline">Mile markers in all 50 US states.</p>
        </div>
        <div class="footer-col">
          <p class="footer-label">Get the app</p>
          <ul class="footer-list">
            <li><a href="${APP}" target="_blank" rel="noopener">iOS App Store</a></li>
            <li><a href="${PLAY}" target="_blank" rel="noopener">Google Play</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <p class="footer-label">Learn more</p>
          <ul class="footer-list">
            <li><a href="../what-is-my-mile-marker/">What is my mile marker?</a></li>
            <li><a href="../cameras/">Highway cameras</a></li>
            <li><a href="../passes/">Mountain passes</a></li>
            <li><a href="../maps/">All maps</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <p class="footer-label">Help &amp; legal</p>
          <ul class="footer-list">
            <li><a href="mailto:feedback@milecheckapp.com">Send feedback</a></li>
            <li><a href="https://milecheck.github.io/milecheck-privacy/">Privacy policy</a></li>
          </ul>
        </div>
      </div>
      <p class="footer-fineprint">&copy; 2026 MileCheck LLC. Always drive to conditions and follow posted signs.</p>
    </div>
  </footer>

<script>(function(){var t=document.querySelector(".nav-toggle"),n=document.querySelector(".primary-nav");if(t&&n){t.addEventListener("click",function(){n.classList.toggle("open");});document.addEventListener("click",function(e){if(!e.target.closest(".header-inner"))n.classList.remove("open");})}})();</script>
</body>
</html>`;
}

let n=0;
for(const g of GUIDES){
  const dir=g.slug;
  fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,'index.html'),page(g));
  n++;
  console.log('wrote '+g.slug+'/index.html  ('+g.title+')');
}
console.log('\nGenerated '+n+' guide pages.');
