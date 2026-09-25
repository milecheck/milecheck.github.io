#!/usr/bin/env node
// gen-es-camera-pages.mjs — Spanish versions of camera pages, built from the generated
// English pages: same map, same live data, the words translated (Leah, 2026-09-24:
// "more pages in spanish like florida"). Run AFTER gen-state-camera-pages.js and
// gen-city-camera-pages.js, before the sponsor/analytics injectors.
//   node scripts/gen-es-camera-pages.mjs
// Output: es/cameras/<slug>/index.html, lang="es", self-canonical, hreflang to the
// English page. Internal links become root-relative so the extra path depth is harmless;
// links to pages that have a Spanish version point at it.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const ES = ['florida', 'miami', 'orlando', 'tampa']; // pages with a Spanish version
const PTV = ['orlando', 'florida']; // also have Portuguese versions
const APP = 'https://apps.apple.com/us/app/milecheck/id6759212851';

// [English as generated, Spanish]. Applied in order; each also applied with tags stripped
// so the FAQ JSON-LD (plain text) translates too.
const COMMON = (name, dot, dotShort) => [
  [`${name} Traffic Cameras — Live ${dot} Highway Cams | MileCheck`, `Cámaras de tráfico de ${name} en vivo — ${dot} | MileCheck`],
  [`${name} Traffic Cameras — Live ${dot} Freeway Cams | MileCheck`, `Cámaras de tráfico de ${name} en vivo — ${dot} | MileCheck`],
  [`Watch live ${name} traffic cameras on one map — ${dot} highway and road cameras, each tagged with route and mile marker. See the road before you drive it.`,
   `Mira las cámaras de tráfico de ${name} en vivo en un solo mapa: cámaras de carretera de ${dot}, cada una con su ruta y su marcador de milla. Ve la carretera antes de salir.`],
  [`Watch live ${name} traffic cameras on one map — ${dot} freeway and highway cameras across the metro, each tagged with route and mile marker. See traffic before you leave.`,
   `Mira las cámaras de tráfico de ${name} en vivo en un solo mapa: cámaras de ${dot} en las autopistas del área metropolitana, cada una con su ruta y su marcador de milla. Ve el tráfico antes de salir.`],
  [`${name} Traffic Cameras — Live | MileCheck`, `Cámaras de tráfico de ${name}, en vivo | MileCheck`],
  [`Live ${name} highway cameras on one map, each tagged with route and mile marker.`, `Cámaras de carretera de ${name} en vivo en un solo mapa, cada una con su ruta y marcador de milla.`],
  [`Live ${name} freeway cameras on one map, each tagged with route and mile marker.`, `Cámaras de autopista de ${name} en vivo en un solo mapa, cada una con su ruta y marcador de milla.`],
  [`Live traffic cameras · ${name} · ${dot}`, `Cámaras de tráfico en vivo · ${name} · ${dot}`],
  [`${name} traffic cameras, live`, `Cámaras de tráfico de ${name}, en vivo`],
  [`See the actual road before you drive it. Live ${dot} highway cameras across ${name} on one map, each tagged with its route and mile marker. Tap any camera for the latest image.`,
   `Ve la carretera de verdad antes de manejar por ella. Cámaras de ${dot} en las carreteras de ${name}, en un solo mapa, cada una con su ruta y su marcador de milla. Toca cualquier cámara para ver la imagen más reciente.`],
  [`See ${name} traffic before you leave. Live ${dot} freeway cameras across the metro on one map, each tagged with its route and mile marker. Tap any camera for the latest image.`,
   `Ve el tráfico de ${name} antes de salir. Cámaras de ${dot} en las autopistas del área metropolitana, en un solo mapa, cada una con su ruta y su marcador de milla. Toca cualquier cámara para ver la imagen más reciente.`],
  [`live cameras in ${name}`, `cámaras en vivo en ${name}`],
  [`camera source`, `fuente de las cámaras`],
  [`Loading live ${name} cameras…`, `Cargando las cámaras de ${name}…`],
  [`Live cameras across ${name}`, `Cámaras en vivo por todo ${name}`],
  [`Live traffic cameras across ${name}`, `Cámaras de tráfico en vivo por todo ${name}`],
  [`Every camera on this map comes straight from ${dot} and is tagged with the route and mile marker where the DOT provides it, so you can tell exactly which stretch of road you're looking at. Tap a camera dot to open its latest image; tap the image to see it full-size.`,
   `Cada cámara de este mapa viene directamente de ${dot} y lleva la ruta y el marcador de milla cuando el DOT los publica, así sabes exactamente qué tramo estás viendo. Toca un punto para abrir su imagen más reciente; toca la imagen para verla en grande.`],
  [`${name} camera questions, answered`, `Preguntas sobre las cámaras de ${name}`],
  [`${name} traffic camera questions, answered`, `Preguntas sobre las cámaras de tráfico de ${name}`],
  [`Where can I watch live ${name} traffic cameras?`, `¿Dónde puedo ver las cámaras de tráfico de ${name} en vivo?`],
  [`Are ${name} DOT traffic cameras free?`, `¿Las cámaras de tráfico del DOT de ${name} son gratis?`],
  [`Are ${name} traffic cameras free?`, `¿Las cámaras de tráfico de ${name} son gratis?`],
  [`Which highways have cameras in ${name}?`, `¿Qué carreteras tienen cámaras en ${name}?`],
  [`Which freeways have cameras in ${name}?`, `¿Qué autopistas tienen cámaras en ${name}?`],
  [`How often do ${name} traffic cameras update?`, `¿Cada cuánto se actualizan las cámaras de ${name}?`],
  [`How do I check ${name} traffic before I leave?`, `¿Cómo reviso el tráfico de ${name} antes de salir?`],
  [`Right here — the <a href="#comap">map above</a> shows live ${dot} highway cameras across ${name}, each tagged with its route and mile marker so you know which stretch you're seeing. For cameras beyond ${name}, see <a href="../">every highway camera in `,
   `Aquí mismo: el <a href="#comap">mapa de arriba</a> muestra las cámaras de ${dot} en las carreteras de ${name}, cada una con su ruta y su marcador de milla, para que sepas qué tramo estás viendo. Para el resto del país, mira <a href="../">todas las cámaras de carretera en `],
  [` states</a>.`, ` estados</a>.`],
  [`Right here — the <a href="#comap">map above</a> shows live ${dot} cameras across the ${name} area, each tagged with its route and mile marker. For the whole state, see <a href="../florida/">Florida traffic cameras</a>.`,
   `Aquí mismo: el <a href="#comap">mapa de arriba</a> muestra las cámaras de ${dot} en el área de ${name}, cada una con su ruta y su marcador de milla. Para todo el estado, mira las <a href="../florida/">cámaras de tráfico de Florida</a>.`],
  [`Yes. ${dot} publishes its traffic cameras publicly, and MileCheck puts them on one map, with no account needed. To have the nearest camera follow you as you drive, the <a href="${APP}" target="_blank" rel="noopener">MileCheck app</a> does it hands-free on CarPlay and Android Auto.`,
   `Sí. ${dot} publica sus cámaras de tráfico abiertamente y MileCheck las pone en un solo mapa, sin cuenta ni registro. Para que la cámara más cercana te siga mientras manejas, la <a href="${APP}" target="_blank" rel="noopener">app MileCheck</a> lo hace sin tocar el teléfono, en CarPlay y Android Auto.`],
  [`Yes. ${dot} publishes its traffic cameras publicly, and MileCheck puts the ${name} ones on one map, with no account needed. To have the nearest camera follow you as you drive, the <a href="${APP}" target="_blank" rel="noopener">MileCheck app</a> does it hands-free on CarPlay and Android Auto.`,
   `Sí. ${dot} publica sus cámaras de tráfico abiertamente y MileCheck pone las de ${name} en un solo mapa, sin cuenta. Para que la cámara más cercana te siga mientras manejas, la <a href="${APP}" target="_blank" rel="noopener">app MileCheck</a> lo hace sin tocar el teléfono, en CarPlay y Android Auto.`],
  [`Most ${dot} cameras refresh every minute or two, straight from the DOT. Open the app image full-size by tapping it on the map above. Weather, snow, and traffic can all change between refreshes, so always drive to the conditions you actually see.`,
   `La mayoría de las cámaras de ${dot} se actualizan cada uno o dos minutos, directo del DOT. Toca la imagen en el mapa para verla en grande. El clima y el tráfico cambian entre una actualización y otra, así que maneja siempre según lo que ves de verdad.`],
  [`Open the <a href="#comap">live map above</a> and tap any camera near your route to see the road right now. Conditions change fast in a busy metro, so check just before you go — and in the app, the nearest camera and your mile marker update automatically as you drive.`,
   `Abre el <a href="#comap">mapa en vivo de arriba</a> y toca cualquier cámara cerca de tu ruta para ver la carretera ahora mismo. En una ciudad grande el tráfico cambia rápido, así que revísalo justo antes de salir. En la app, la cámara más cercana y tu marcador de milla se actualizan solos mientras manejas.`],
  [`The nearest ${name} camera, right as you drive`, `La cámara más cercana de ${name}, mientras manejas`],
  [`MileCheck shows the nearest camera and your exact mile marker in real time as you drive ${name}'s highways, plus live DOT alerts on your route. Works offline and runs on CarPlay and Android Auto.`,
   `MileCheck muestra la cámara más cercana y tu marcador de milla exacto en tiempo real mientras manejas por las carreteras de ${name}, más las alertas del DOT en tu ruta. Funciona sin señal y en CarPlay y Android Auto.`],
  [`MileCheck shows the nearest camera and your exact mile marker in real time as you drive around ${name}, plus live DOT alerts on your route. Works offline and runs on CarPlay and Android Auto.`,
   `MileCheck muestra la cámara más cercana y tu marcador de milla exacto en tiempo real mientras manejas por ${name}, más las alertas del DOT en tu ruta. Funciona sin señal y en CarPlay y Android Auto.`],
  [`iOS App Store`, `App Store (iOS)`],
  [`More: <a href="../">all highway cameras</a>`, `Más: <a href="../">todas las cámaras de carretera</a>`],
  [` cameras</a>`, `</a>`],
  [`<a href="../../passes/">mountain passes</a>`, `<a href="../../passes/">puertos de montaña</a>`],
  [`<a href="../../corridors/">interstate corridors</a>`, `<a href="../../corridors/">corredores interestatales</a>`],
  [`drawbridges</a>`, `puentes levadizos</a>`],
  [` live in ${name}`, ` en vivo en ${name}`],
  [`<p>Every camera on this map comes straight from ${dot} and is tagged with the route and mile marker where the agency provides it. Tap a camera dot to open its latest image; tap the image to see it full-size. For cameras beyond the metro, see <a href="../florida/">Florida traffic cameras</a> or <a href="../">every highway camera</a>.</p>`,
   `<p>Las imágenes proceden de ${dot}. Mostramos la carretera y el marcador de milla cuando la agencia los proporciona. Toca una cámara para ver su imagen más reciente y toca la imagen para ampliarla. También puedes consultar las <a href="../florida/">cámaras de Florida</a> y el <a href="../">mapa de cámaras de otras carreteras</a>.</p>`],
  [`Yes. ${dot} publishes its traffic cameras publicly, and MileCheck puts them on one map, with no account needed. To have the nearest camera follow you as you drive, the `,
   `No. Puedes consultar este mapa sin crear una cuenta. Para que la cámara más cercana te siga mientras manejas, la `],
  [`Yes. ${dot} publishes its traffic cameras publicly, and MileCheck puts the ${name} ones on one map, with no account needed. To have the nearest camera follow you as you drive, the `,
   `No. Puedes consultar este mapa sin crear una cuenta. Para que la cámara más cercana te siga mientras manejas, la `],
  [`MileCheck app</a> does it hands-free on CarPlay and Android Auto.`, `app MileCheck</a> lo hace sin tocar el teléfono, en CarPlay y Android Auto.`],
  [`Are ${name} DOT traffic cameras free?`, `¿Hay que pagar para consultar este mapa?`],
  [`Are ${name} traffic cameras free?`, `¿Hay que pagar para consultar este mapa?`],
  [`Right here — the <a href="#comap">map above</a> shows live ${dot} highway cameras across ${name}, each tagged with its route and mile marker so you know which stretch you're seeing. For cameras beyond ${name}, see <a href="../">every highway camera in `,
   `En el mapa de esta página. Toca una cámara para ver su imagen más reciente. Mostramos la carretera y el marcador de milla cuando ${dot} los proporciona. Para el resto del país, mira <a href="../">todas las cámaras de carretera en `],
  [`Right here — the <a href="#comap">map above</a> shows live ${dot} cameras across the ${name} area, each tagged with its route and mile marker. For the whole state, see <a href="../florida/">Florida traffic cameras</a>.`,
   `En el mapa de esta página. Toca una cámara para ver su imagen más reciente. Mostramos la carretera y el marcador de milla cuando ${dot} los proporciona. Para todo el estado, mira las <a href="../florida/">cámaras de tráfico de Florida</a>.`],
  [`How often do ${name} traffic cameras update?`, `¿Cada cuánto se actualizan las imágenes?`],
  [`Most ${dot} cameras refresh every minute or two, straight from the DOT. Open the app image full-size by tapping it on the map above. Weather, snow, and traffic can all change between refreshes, so always drive to the conditions you actually see.`,
   `La frecuencia depende de la cámara y de ${dot}. Una imagen puede estar desactualizada o no estar disponible. Conduce según las condiciones que encuentres y respeta las señales.`],
  [`Open the <a href="#comap">live map above</a> and tap any camera near your route to see the road right now. Conditions change fast in a busy metro, so check just before you go — and in the app, the nearest camera and your mile marker update automatically as you drive.`,
   `Abre el mapa y toca las cámaras que estén cerca de tu ruta. Consulta la imagen más reciente disponible antes de salir. No uses el mapa mientras conduces.`],
  [`Live cameras are busy right now — please refresh in a moment.`, `Las cámaras están ocupadas en este momento. Vuelve a cargar la página en un momento.`],
  [`No cameras loaded — try again shortly.`, `No se cargaron cámaras. Inténtalo de nuevo en un momento.`],
  [`'no cameras loaded'`, `'no se cargaron cámaras'`],
  [`title="Open full image"`, `title="Abrir la imagen completa"`],
  [`' live cameras in ${name}'`, `' cámaras en vivo en ${name}'`],
  [`' live cameras'`, `' cámaras en vivo'`],
  [`${name} cameras: ${dot} via MileCheck`, `cámaras de ${name}: ${dot} vía MileCheck`],
  [`"name":"Cameras","item":"https://milecheckapp.com/cameras/"`, `"name":"Cámaras","item":"https://milecheckapp.com/cameras/"`],
  [`"name":"${name} Cameras","item":"https://milecheckapp.com/cameras/`, `"name":"Cámaras de ${name}","item":"https://milecheckapp.com/es/cameras/`],
  [`Map layers`, `Capas del mapa`],
  [`>Cameras</label>`, `>Cámaras</label>`],
  [`Show every camera`, `Mostrar todas las cámaras`],
];
// Page-specific prose (the blurb, notable/freeways). English exactly as in the generators.
const PROSE = {
  florida: [
    [`Florida DOT's FL511 network is one of the largest on this map — thousands of cameras across the metros, the Turnpike, and the hurricane-prone coasts.`,
     `La red FL511 del Departamento de Transporte de Florida es una de las más grandes de este mapa: miles de cámaras en las áreas metropolitanas, en el Turnpike y en las costas expuestas a huracanes.`],
    [`Watch I-4 through Orlando and Tampa, <a href="../../corridors/i-95/">I-95</a> down the east coast, I-75 and <a href="../../corridors/i-10/">I-10</a>, and Florida's Turnpike.`,
     `Mira la I-4 por Orlando y Tampa, la <a href="../../corridors/i-95/">I-95</a> por la costa este, la I-75 y la <a href="../../corridors/i-10/">I-10</a>, y el Turnpike de Florida.`],
  ],
  orlando: [
    [`Orlando traffic centers on I-4 and the toll roads, all covered by FDOT's FL511 cameras.`, `El tráfico de Orlando gira en torno a la I-4 y las autopistas de peaje, todas cubiertas por las cámaras FL511 de FDOT.`],
    [`Watch <a href="../../corridors/i-4/">I-4</a> through the core and the attractions, plus the 408, 417, and 429 toll roads and Florida's Turnpike.`, `Mira la <a href="../../corridors/i-4/">I-4</a> por el centro y la zona de los parques, más las autopistas de peaje 408, 417 y 429 y el Turnpike de Florida.`],
  ],
  tampa: [
    [`Tampa Bay's FDOT cameras cover the interstates, the bay crossings, and the Selmon Expressway.`, `Las cámaras de FDOT en la bahía de Tampa cubren las interestatales, los puentes sobre la bahía y la Selmon Expressway.`],
    [`Watch <a href="../../corridors/i-4/">I-4</a> east toward Orlando, I-275 across the bay, <a href="../../corridors/i-75/">I-75</a> to the east, and the Selmon Expressway.`, `Mira la <a href="../../corridors/i-4/">I-4</a> hacia Orlando, la I-275 sobre la bahía, la <a href="../../corridors/i-75/">I-75</a> al este y la Selmon Expressway.`],
  ],
  miami: [
    [`South Florida's FDOT cameras cover the Miami metro freeways and expressways, some of the busiest in the state.`, `Las cámaras de FDOT cubren las autopistas y expressways del área de Miami.`],
    [`Watch <a href="../../corridors/i-95/">I-95</a> up the coast, <a href="../../corridors/i-75/">I-75</a> and "Alligator Alley" west, the Palmetto (826), and the Dolphin (836).`, `Mira la <a href="../../corridors/i-95/">I-95</a> por la costa, la <a href="../../corridors/i-75/">I-75</a> y "Alligator Alley" hacia el oeste, el Palmetto (826) y el Dolphin (836).`],
  ],
};
const strip = (t) => t.replace(/<[^>]+>/g, '');
const esc = (t) => t.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
const unesc = (t) => t.replace(/&#39;/g, "'").replace(/&quot;/g, '"');
let done = 0;
for (const slug of ES) {
  const src = readFileSync(`cameras/${slug}/index.html`, 'utf8');
  const m = src.match(/<h1>([^<]+) traffic cameras, live<\/h1>/); if (!m) { console.error('skip', slug); continue; }
  const name = m[1];
  const dot = (src.match(/Live traffic cameras · [^·]+ · ([^<]+)<\/div>/) || [])[1].trim();
  let out = src.replace(/    <p class="lang-switch"[^\n]*\n/g, '').replace(/  <link rel="alternate" hreflang="[a-z-]+" href="[^"]+">\n?/g, '');
  const pairs = [...(PROSE[slug] || []), ...COMMON(name, dot, dot.split('(')[0].trim())];
  for (const [en, es] of pairs) {
    out = out.split(en).join(es);
    const enT = strip(en), esT = strip(es);
    if (enT !== en) out = out.split(enT).join(esT);
    // JSON-LD keeps quotes escaped as \" and apostrophes plain; try the JSON-escaped form too
    const enJ = JSON.stringify(enT).slice(1, -1), esJ = JSON.stringify(esT).slice(1, -1);
    if (enJ !== enT) out = out.split(enJ).join(esJ);
  }
  // language, canonical, hreflang, links
  out = out.replace('<html lang="en">', '<html lang="es">');
  out = out.replace(`<link rel="canonical" href="https://milecheckapp.com/cameras/${slug}/">`,
    `<link rel="canonical" href="https://milecheckapp.com/es/cameras/${slug}/">\n  <link rel="alternate" hreflang="es" href="https://milecheckapp.com/es/cameras/${slug}/">${PTV.includes(slug) ? `\n  <link rel="alternate" hreflang="pt" href="https://milecheckapp.com/pt/cameras/${slug}/">` : ''}\n  <link rel="alternate" hreflang="en" href="https://milecheckapp.com/cameras/${slug}/">\n  <link rel="alternate" hreflang="x-default" href="https://milecheckapp.com/cameras/${slug}/">`);
  out = out.replace(`content="https://milecheckapp.com/cameras/${slug}/"`, `content="https://milecheckapp.com/es/cameras/${slug}/"`);
  out = out.replace(/href="\.\.\/\.\.\//g, 'href="/').replace(/src="\.\.\/\.\.\//g, 'src="/');
  out = out.replace(/href="\.\.\/([a-z-]+)\/"/g, (m2, s2) => ES.includes(s2) ? `href="/es/cameras/${s2}/"` : `href="/cameras/${s2}/"`);
  out = out.replace(/href="\.\.\/"/g, 'href="/cameras/"');
  // language switch above the eyebrow
  out = out.replace('<div class="eyebrow">', `<p class="lang-switch" style="font-size:12.5px;color:#5b6670;margin:0 0 8px"><a href="/cameras/${slug}/" hreflang="en" lang="en">English</a> · <b lang="es">Español</b>${PTV.includes(slug) ? ` · <a href="/pt/cameras/${slug}/" hreflang="pt" lang="pt-BR">Português</a>` : ''}</p>\n    <div class="eyebrow">`);
  // sponsor slot key for the Spanish page
  out = out.replace(`data-slot="cameras:${slug}"`, `data-slot="cameras:es-${slug}"`);
  mkdirSync(`es/cameras/${slug}`, { recursive: true });
  writeFileSync(`es/cameras/${slug}/index.html`, out);
  const left = (out.match(/traffic cameras|Live cameras|camera source|Loading live|tap any camera/g) || []).length;
  console.log(`es/cameras/${slug}/  English phrases left: ${left}`);
  done++;
}
console.log(`${done} Spanish camera pages written`);
