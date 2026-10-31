// Shared by add-mediavine.mjs and check-mediavine.mjs so the writer and the checker can
// never disagree about which page gets what. Config: data/ad-pages.json.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

export const START = '<!-- mv:start -->', END = '<!-- mv:end -->';
export const BSTART = '<!-- mvb:start -->', BEND = '<!-- mvb:end -->';
export const TAG_RE = /<!-- mv:start -->[\s\S]*?<!-- mv:end -->\n?/g;
export const BLOCK_RE = /<!-- mvb:start -->[\s\S]*?<!-- mvb:end -->/g;
export const PRIVACY_URL = 'https://milecheckapp.com/milecheck-privacy/';
export const OLD_PRIVACY_RE = /https:\/\/milecheck\.github\.io\/milecheck-privacy\//g;
// A footer privacy link for pages whose template has none (Journey: linked from every page).
// Kept when ads are rolled back: it is a privacy fix, not ad markup.
export const PSTART = '<!-- mvp:start -->', PEND = '<!-- mvp:end -->';
export const PRIV_RE = /\n?<!-- mvp:start -->[\s\S]*?<!-- mvp:end -->/g;
export const privacyLink = () => `${PSTART}<p style="text-align:center;font-size:14px;margin:16px 0"><a href="${PRIVACY_URL}">Privacy Policy</a></p>${PEND}`;
// A real anchor to the policy, any quote style. A URL in a meta tag or a script does not count.
export const hasPrivacyAnchor = (html) => /<a\s[^>]*\bhref\s*=\s*["']?https:\/\/milecheckapp\.com\/milecheck-privacy\/?["'\s>]/i.test(markupOnly(html));
export const BLOCK_ID_RE = /id\s*=\s*["']?ad-management-config-settings["'\s>]/gi;
const HEAD_CLOSE_RE = /<\/head>/i;

export const stripComments = (html) => html.replace(/<!--[\s\S]*?-->/g, '');
// The page's markup with comments and script/style/template bodies removed: what a reader can click.
export const markupOnly = (html) => stripComments(html).replace(/<(script|style|template|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi, '');

export function loadConfig(root) {
  const c = JSON.parse(readFileSync(join(root, 'data/ad-pages.json'), 'utf8'));
  if (c.enabled && !/^[A-Za-z0-9-]+$/.test(c.siteId || '')) throw new Error('ad-pages.json: enabled is true but siteId is empty or malformed. Set enabled:false until the Journey dashboard gives the site ID.');
  return c;
}

// The tag exactly as the dashboard gives it (Onboarding > Install Your Ads Script, Official program).
export function scriptTag(siteId) {
  return `${START}<script type="text/javascript" async="async" data-noptimize="1" data-cfasync="false" src="//scripts.mediavine.com/tags/${siteId}.js"></script>${END}\n`;
}

// robots noindex in any attribute order, quote style or case.
export function isNoindex(html) {
  for (const m of stripComments(html).matchAll(/<meta\s[^>]*>/gi)) {
    const t = m[0];
    const name = (t.match(/\sname\s*=\s*["']?([^"'\s>]+)/i) || [])[1];
    const content = (t.match(/\scontent\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i) || []);
    if (name && /^(robots|googlebot)$/i.test(name) && (content[1] ?? content[2] ?? content[3] ?? '').split(',').some((d) => d.trim().toLowerCase() === 'noindex')) return true;
  }
  return false;
}

// Full-screen map tools (pass maps, mountain road maps): no ad script, and no inserted
// footer link, which would sit under the map. They are reached from pages that carry both.
export const isFullScreenTool = (p, c) => (c.fullScreenTools || []).some((re) => new RegExp(re).test(p));

// Every public reader page needs a privacy link, ad or no ad. Exempt: displays, redirects,
// admin, fragments, verification files (data/ad-pages.json privacyExempt).
export function needsPrivacy(rel, html, c) {
  const p = rel.split(sep).join('/');
  if ((c.privacyExempt || []).some((x) => p === x || p.startsWith(x))) return false;
  if (isFullScreenTool(p, c)) return false;
  return HEAD_CLOSE_RE.test(html) && /<\/body>/i.test(html);
}

// A page with an interactive map: it loads the shared map kit or Leaflet (comments ignored).
export const isMapPage = (html) => /<script\s[^>]*src\s*=\s*["']?[^"'>]*(map-kit|leaflet)[^"'>]*\.js/i.test(stripComments(html));

// What a page should carry: 'none' | 'all' (script + block every ad) | 'map' | 'full'.
// Ignores c.enabled: callers decide what "off" means.
export function classify(rel, html, c) {
  const p = rel.split(sep).join('/');
  if (c.noScript.some((x) => p === x || p.startsWith(x))) return 'none';
  if (isFullScreenTool(p, c)) return 'none';
  if (!HEAD_CLOSE_RE.test(html)) return 'none';
  if (isNoindex(html)) return 'none';
  if (c.blockAll.some((x) => p === x || p.startsWith(x))) return 'all';
  if (isMapPage(html)) return 'map';
  return 'full';
}

export function blockDiv(kind, c) {
  if (kind === 'all') return `${BSTART}<div id="ad-management-config-settings" data-blocklist-all="1"></div>${BEND}`;
  if (kind === 'map') return `${BSTART}<div id="ad-management-config-settings" ${c.mapBlock.map((u) => `data-blocklist-${u}="1"`).join(' ')}></div>${BEND}`;
  return '';
}

// Where the blocklist goes: first thing inside the page's content (journey-content, else
// <main>, else <article>). Returns the insert offset or -1. Journey wants it in the content
// area, never in a header or footer.
// Fallback when a page has no content element: right after the site's own header block
// (add-site-nav's markers, else the header with the site-header class), never a header
// inside an <aside> or an article.
export function headerEnd(html) {
  const m = /<!-- \/site-nav:header -->/.exec(html) || /<header\b[^>]*\bclass="[^"]*\b(?:site-header|mc-site-header)\b[^"]*"[^>]*>[\s\S]*?<\/header>/i.exec(html);
  return m ? m.index + m[0].length : -1;
}

export function blockAnchor(html) {
  for (const re of [/<[a-z][a-z0-9]*\s[^>]*class="[^"]*\bjourney-content\b[^"]*"[^>]*>/i, /<main(?:\s[^>]*)?>/i, /<article(?:\s[^>]*)?>/i]) {
    const m = re.exec(html);
    if (m) return m.index + m[0].length;
  }
  return -1;
}

export function pages(root) {
  const out = [];
  const walk = (d) => {
    for (const n of readdirSync(d)) {
      if (n.startsWith('.') || n === 'node_modules' || n === 'scripts') continue;
      const f = join(d, n);
      if (statSync(f).isDirectory()) walk(f);
      else if (n.endsWith('.html')) out.push(f);
    }
  };
  walk(root);
  return out.map((f) => ({ file: f, rel: relative(root, f) }));
}
