// es-pt-fixes.mjs — native-speaker review fixes (Keith, 2026-09-28..30; docs/translation-reviews/
// keith-es-pt-review-2026-09.md) applied as an idempotent post-pass. The camera generators
// (gen-es-camera-pages.mjs, gen-pt-camera-pages.mjs) call it on their output so a regen keeps the
// fixes; the Spanish guide, Autobahn page and Portuguese guide have no generator and were
// patched with:  node scripts/lib/es-pt-fixes.mjs
// Kinds: es-cam, es-guide, es-autobahn, pt-cam, pt-guide.
import { readFileSync, writeFileSync } from 'node:fs';

const rep = (s, pairs) => { for (const [a, b] of pairs) s = typeof a === 'string' ? s.split(a).join(b) : s.replace(a, b); return s; };
const label = (pairs) => pairs.map(([a, b]) => [`>${a}<`, `>${b}<`]);

// ---- navigation / footer (copied from the translated guides) ----
const ES_CHROME = label([
  ['Home', 'Inicio'], ['Maps', 'Mapas'], ['United States', 'Estados Unidos'], ['Canada', 'Canadá'],
  ['Story', 'Nuestra historia'], ['B2B', 'Para empresas'], ['Get the app', 'Descargar la app'],
  ['Cameras', 'Cámaras de tráfico'],
  ['Live maps', 'Mapas en vivo'], ['Highway', 'Cámaras de carretera (en inglés)'],
  ['Road closures map', 'Mapa de cierres de carreteras (en inglés)'], ['Wildfire map', 'Mapa de incendios forestales (en inglés)'],
  ['All maps', 'Todos los mapas (en inglés)'], ['Help &amp; legal', 'Ayuda y legal'],
  ['Data sources', 'Fuentes de datos (en inglés)'], ['Send feedback', 'Enviar comentarios'],
  ['Privacy policy', 'Política de privacidad (en inglés)'], ['Get the app', 'Descarga la app'],
  ['What is my mile marker?', '¿Cuál es mi marcador de millas? (en inglés)'], ['Highway cameras', 'Cámaras de tráfico (en inglés)'],
  ['Mountain passes', 'Puertos de montaña (en inglés)'],
]);
// "Get the app" is the nav CTA (a) and the footer label (p); handle the footer label separately
const esChrome = (s) => {
  s = s.replace('<p class="footer-label">Get the app</p>', '<p class="footer-label">Descarga la app</p>');
  s = rep(s, ES_CHROME.filter(([a]) => a !== '>Get the app<' || true));
  s = s.replace(/(<a href="[^"]*" class="active">)Cámaras<\/a>/, '$1Cámaras de tráfico</a>');
  s = s.replace('<button class="nav-toggle" aria-label="Menu">', '<button class="nav-toggle" aria-label="Menú">');
  s = s.replace(/Camera data: ([^<]*?) via MileCheck\. Always drive to conditions and follow posted signs\./, 'Datos de las cámaras: $1, a través de MileCheck. Conduce siempre según las condiciones de la vía y respeta las señales.');
  return s;
};
const PT_CHROME = label([
  ['Home', 'Início'], ['Maps', 'Mapas'], ['Cameras', 'Câmeras'], ['United States', 'Estados Unidos'], ['Canada', 'Canadá'],
  ['Story', 'Nossa história'], ['Get the app', 'Baixar o app'],
  ['Live maps', 'Mapas ao vivo'], ['Highway', 'Câmeras nas rodovias (em inglês)'],
  ['Road closures map', 'Mapa de bloqueios de rodovias (em inglês)'], ['Wildfire map', 'Mapa de incêndios florestais (em inglês)'],
  ['All maps', 'Todos os mapas (em inglês)'], ['Help &amp; legal', 'Ajuda e termos'],
  ['Data sources', 'Fontes de dados (em inglês)'], ['Send feedback', 'Fale conosco'],
  ['Privacy policy', 'Política de privacidade (em inglês)'],
]);
const ptChrome = (s) => {
  s = s.replace('<p class="footer-label">Get the app</p>', '<p class="footer-label">Baixar o app</p>');
  s = rep(s, PT_CHROME);
  s = s.replace(/Camera data: ([^<]*?) via MileCheck\. Always drive to conditions and follow posted signs\./, 'Dados das câmeras: $1, por meio do MileCheck. Dirija sempre de acordo com as condições e siga a sinalização.');
  s = s.replace('Mile markers in all 50 US states.', 'Marcos de milha nos 50 estados dos EUA.');
  s = rep(s, [
    [" · live video from '", " · vídeo ao vivo do '"], ['aria-label="Live video: ', 'aria-label="Vídeo ao vivo: '],
    ['A live stream, a few seconds behind the road. Tap play if it does not start.', 'Transmissão ao vivo, com alguns segundos de atraso. Toque em reproduzir se não começar.'],
    ['alt="Live: \'+esc(c.title)+\'"', 'alt="Ao vivo: \'+esc(c.title)+\'"'], ["this.alt=\\'image unavailable\\'", "this.alt=\\'imagem indisponível\\'"],
  ]);
  s = s.replace('<button class="nav-toggle" aria-label="Menu">', '<button class="nav-toggle" aria-label="Menu">');
  s = s.replace('<p class="footer-tagline">Mile markers in all 50 US estados.</p>', '<p class="footer-tagline">Marcos de milha nos 50 estados dos EUA.</p>');
  return s;
};

// ---- Spanish camera pages ----
const esCam = (s) => {
  s = esChrome(s);
  s = s.replace('Mile markers in all 50 US estados.', 'Marcadores de millas en los 50 estados de EE. UU.');
  s = s.replace(/<p>Every camera on this map comes straight from ([^ ]+(?: \([A-Z0-9]+\))?) and is tagged with the route and mile marker where the agency provides it\. Tap a camera dot to open its latest image; tap the image to see it full-size\. For beyond the metro, see <a href="\/es\/cameras\/florida\/">Florida traffic<\/a> or <a href="\/cameras\/">every highway camera<\/a>\.<\/p>/,
    '<p>Cada cámara de este mapa viene directamente de $1 y lleva la ruta y el marcador de millas cuando la agencia los publica. Toca un punto para abrir su imagen más reciente; toca la imagen para verla en grande. Para ver más allá del área metropolitana, consulta el <a href="/es/cameras/florida/">tráfico de Florida</a> o <a href="/cameras/">todas las cámaras de carretera (en inglés)</a>.</p>');
  s = s.replace(/<p>MileCheck shows the nearest camera and your exact mile marker in real time as you drive ([^<]+?)'s freeways, plus live state DOT feeds on your route\. Works offline and runs on CarPlay and Android Auto\.<\/p>/,
    '<p>MileCheck muestra la cámara más cercana y tu marcador de millas exacto en tiempo real mientras manejas por las autopistas de $1, más las alertas del DOT en tu ruta. Funciona sin señal, en CarPlay y en Android Auto.</p>');
  s = s.replace(/<p class="co-related">More: ([\s\S]*?)<\/p>/, (m, body) => `<p class="co-related">Más: ${body}</p>`);
  s = s.replace(/<p class="co-related">[\s\S]*?<\/p>/, (m) => m
    .replace('>all highway<', '>todas las cámaras de carretera<')
    .replace('>all maps<', '>todos los mapas<')
    .replace('>Florida puentes levadizos<', '>Puentes levadizos de Florida<')
    .replace(/(<a href="\/(?:cameras|passes|corridors|maps|bridges\/florida)\/">[^<]*?)(<\/a>)/g, (x, a, b) => /en inglés/.test(a) ? x : `${a} (en inglés)${b}`));
  s = rep(s, [
    ['Ve la carretera', 'Mira la carretera'],
    ['Para que la cámara más cercana te siga mientras manejas, la app MileCheck lo hace sin tocar el teléfono, en CarPlay y Android Auto.',
     'Si quieres que la cámara más cercana te acompañe mientras manejas, la app MileCheck lo hace sin que tengas que tocar el teléfono, en CarPlay y Android Auto.'],
    [/Para que la cámara más cercana te siga mientras manejas, (la <a[^>]*>app MileCheck<\/a>) lo hace sin tocar el teléfono, en CarPlay y Android Auto\./g,
     'Si quieres que la cámara más cercana te acompañe mientras manejas, $1 lo hace sin que tengas que tocar el teléfono, en CarPlay y Android Auto.'],
    ['por todo Florida', 'por toda Florida'],
    ['Florida puentes levadizos', 'Puentes levadizos de Florida'],
    ['Funciona sin señal y en CarPlay y Android Auto', 'Funciona sin señal, en CarPlay y en Android Auto'],
    ['cada uno o dos minutos', 'cada minuto o dos'],
    ['según lo que ves de verdad', 'según lo que realmente ves'],
    ['Las cámaras de FDOT en la bahía de Tampa', 'Las cámaras de FDOT en el área de la bahía de Tampa'],
    [/marcador de milla(?!s)/g, 'marcador de millas'],
    [/(<title>Cámaras de tráfico de [^<,]*?) en vivo —/, '$1, en vivo —'],
    // runtime strings in the page script
    [" · live video from '", " · video en vivo de '"], ['aria-label="Live video: ', 'aria-label="Video en vivo: '],
    ['A live stream, a few seconds behind the road. Tap play if it does not start.', 'Transmisión en vivo, con unos segundos de retraso. Toca reproducir si no empieza.'],
    ["'No loaded — try again shortly.'", "'No se cargó ninguna cámara. Inténtalo de nuevo en un momento.'"],
    ["'Live are busy right now — please refresh in a moment.'", "'Las cámaras están ocupadas ahora. Recarga la página en un momento.'"],
    ['alt="Live: \'+esc(c.title)+\'"', 'alt="En vivo: \'+esc(c.title)+\'"'],
    ["this.alt=\\'image unavailable\\'", "this.alt=\\'imagen no disponible\\'"],
  ]);
  return s;
};

// ---- Portuguese camera pages ----
const ptCam = (s) => {
  s = ptChrome(s);
  s = rep(s, [
    [/em Flórida/g, 'na Flórida'], [/de Flórida/g, 'da Flórida'],
    [/\bda FDOT/g, 'do FDOT'], [/\bpela FDOT/g, 'pelo FDOT'], [/\ba FDOT fornece/g, 'o FDOT fornece'],
    ['e a câmera próxima durante o trajeto', 'e a câmera mais próxima durante o trajeto'],
    ['A estrada pode mudar entre atualizações.', 'As condições da estrada podem mudar entre uma atualização e outra.'],
    ['Confira também as condições que você vê na estrada.', 'Observe também as condições da estrada.'],
    ['da I-4 por Orlando e Tampa', 'da I-4, que passa por Orlando e Tampa'],
    ['um mapa mais focado', 'um mapa mais específico'],
    ['área das atrações', 'área dos parques'],
  ]);
  return s;
};

// ---- Spanish guide (es_419) ----
const esGuide = (s) => {
  s = rep(s, [
    [/arcén/g, 'acotamiento'],
    ['que el operador del 911 puede ver', 'que el operador del 911 pueda ver'],
    ['que el operador puede ver', 'que el operador pueda ver'],
    ['Por eso, el número del marcador por sí solo no basta: indica también la carretera y el estado.', 'Por eso, hay que indicar también la carretera y el estado, además del número del marcador.'],
    ['si tu estado y tu país de origen lo exigen', 'si el estado donde conduces o tu país de origen lo exigen'],
    ['incluido un conductor averiado', 'incluido un vehículo averiado'],
    ['incluido el de un alquiler, incluso sin SIM estadounidense', 'incluso desde un teléfono extranjero sin SIM estadounidense'],
    ['por un tema de tránsito menor', 'por una infracción de tránsito menor'],
    ['lo opuesto de lo que', 'lo opuesto a lo que'],
    ['no tiene manos libres integrado', 'no tiene sistema manos libres integrado'],
    ['no después de necesitarlo', 'no cuando ya lo necesites'],
    ['donde el resto del país lo permite', 'mientras que el resto del país lo permite'],
    ['con 0.05%</strong>, el más estricto del país', 'con 0.05%</strong>, el más estricto'],
    ['"la mayoría de los estados"', '«la mayoría de los estados»'],
    ['«move-over law»', '«Move Over»'],
  ]);
  return esChrome(s).replace('<a href="../../cameras/" >', '<a href="../../cameras/">');
};

// ---- Spanish Autobahn page (Spain Spanish, kept) ----
const esAutobahn = (s) => {
  s = rep(esChrome(s), [
    ['¿Averiado en la Autobahn?', '¿Avería en la Autobahn?'],
    ['Averiado en la Autobahn:', 'Avería en la Autobahn:'],
    ['Un pinchazo en un país cuyo idioma no hablas', 'Una avería en un país cuyo idioma no hablas'],
    ['si me averío en la Autobahn', 'si se me avería el coche en la Autobahn'],
    ['si me averío en Alemania', 'si se me avería el coche en Alemania'],
    ['un pinchazo no es una llamada al 112', 'una avería no justifica llamar al 112'],
    ['No des por hecho que las normas de Alemania te acompañan', 'No des por hecho que las normas de Alemania te acompañen'],
    ['Guárdalo en la cabina', 'Guárdalo en el habitáculo'],
    ['de lo que sientes', 'de lo que crees'],
    ['en carreteras clasificadas', 'en las vías principales'],
    ['cada 50 a 100 metros', 'cada 50 o 100 metros'],
    ['tiene algo más denso', 'tiene algo aún más preciso'],
    ['MileCheck muestra tu mojón kilométrico más cercano', 'MileCheck muestra tu marcador de millas más cercano'],
    ['Mojones kilométricos en los 50 estados de EE. UU.', 'Marcadores de millas en los 50 estados de EE. UU.'],
    ['¿Qué es mi mojón kilométrico?', '¿Cuál es mi marcador de millas? (en inglés)'],
    ['>Cómo reportar tu ubicación en una emergencia<', '>Cómo reportar tu ubicación en una emergencia (en inglés)<'],
    ['<a href="../../driving-in-the-us-foreign-visitor-guide/">Conducir en EE. UU. como visitante extranjero</a>', '<a href="/es/driving-in-the-us-foreign-visitor-guide/">Conducir en EE. UU. como visitante extranjero</a>'],
  ]);
  return s;
};

// ---- Portuguese guide ----
const ptGuide = (s) => {
  s = rep(ptChrome(s), [
    ['salvo quando a sinalização permite', 'salvo quando a sinalização permitir'],
    ['só quando uma placa permite', 'só quando uma placa permitir'],
    ['Regras e preços mudam, confirme no dia da viagem.', 'Regras e preços mudam; confirme no dia da viagem.'],
    ['Nas Interstates, a contagem', 'Nas rodovias interestaduais (Interstates), a contagem'],
    ['posto de combustível', 'posto de gasolina'],
    ['A posição mostrada por GPS', 'A posição mostrada pelo GPS'],
    ['Para uma pane sem emergência', 'Em caso de pane que não seja emergência'],
    ['Informe também a rodovia e o estado.', 'Ao informar o número, diga também a rodovia e o estado.'],
    ['Regras de conversão, celular, álcool e outras condutas podem mudar.', 'As regras sobre conversões, uso de celular, álcool e outros pontos podem variar.'],
    // leaked markdown
    ['O *mile marker* é', 'O <em>mile marker</em> é'], ['encontrar seu mile marker', 'encontrar seu <em>mile marker</em>'],
    [/Uma placa de `70 mph` indica cerca de `113 km\/h`/, 'Uma placa de 70 mph equivale a cerca de 113 km/h'],
    [/`70 mph` equivalem a cerca de `113 km\/h`/, '70 mph equivalem a cerca de 113 km/h'],
  ]);
  return s;
};

export const FIXES = { 'es-cam': esCam, 'pt-cam': ptCam, 'es-guide': esGuide, 'es-autobahn': esAutobahn, 'pt-guide': ptGuide };
export const applyFixes = (kind, html) => FIXES[kind](html);

if (import.meta.url === `file://${process.argv[1]}`) {
  const files = { 'es-guide': ['es/driving-in-the-us-foreign-visitor-guide'], 'es-autobahn': ['es/breakdown-on-the-autobahn'], 'pt-guide': ['pt/driving-in-the-us-foreign-visitor-guide'],
    'es-cam': ['florida', 'miami', 'orlando', 'tampa'].map(c => `es/cameras/${c}`), 'pt-cam': ['florida', 'orlando'].map(c => `pt/cameras/${c}`) };
  for (const [kind, dirs] of Object.entries(files)) for (const d of dirs) {
    const p = `${d}/index.html`, a = readFileSync(p, 'utf8'), b = applyFixes(kind, a);
    if (a !== b) { writeFileSync(p, b); console.log('patched', p); } else console.log('no change', p);
  }
}
