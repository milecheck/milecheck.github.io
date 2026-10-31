// Finds the element Journey should treat as a page's content: the one whose DIRECT children
// include the most <p> elements. Journey wants `journey-content` on that direct parent, not
// on an outer <main> or <article>, and only once per page:
// https://journeymv.zendesk.com/hc/en-us/articles/54691462571419
//
// No HTML parser is installed in this repo, so this is a small tag scanner: it skips
// comments and script/style bodies, treats void elements as self-closing, and lets a new
// <p> close an open one, which is enough for the site's generated pages. It returns the
// offset of the chosen start tag so the caller can add the class without touching
// anything else in the file.
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
const RAW = new Set(['script', 'style', 'textarea', 'template']);
const CANDIDATE = new Set(['div', 'section', 'article', 'main']);
const SKIP_INSIDE = new Set(['header', 'footer', 'nav', 'aside', 'form', 'button', 'select']);
// Map panels and controls are never the content, however many <p> they hold (ChatGPT round 3).
const UI_RE = /\b(?:class|id)\s*=\s*["']?[^"'>]*\b[\w-]*(?:map|ctrl|control|legend|filter|panel|popup|modal|toolbar)[\w-]*\b/i;
export const MIN_PARAGRAPHS = 3;

export function findContent(html) {
  const tagRe = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g;
  const stack = []; // { name, start, end, p, skip }
  let best = null, m;
  const close = (node) => {
    if (CANDIDATE.has(node.name) && !node.skip && node.p >= MIN_PARAGRAPHS && (!best || node.p > best.p)) best = node;
  };
  while ((m = tagRe.exec(html))) {
    if (!m[2]) continue; // comment
    const name = m[2].toLowerCase(), closing = m[1] === '/';
    if (!closing) {
      if (name === 'p' && stack.length && stack[stack.length - 1].name === 'p') stack.pop();
      const parent = stack[stack.length - 1];
      if (name === 'p' && parent) parent.p++;
      if (RAW.has(name)) {
        const endIdx = html.toLowerCase().indexOf('</' + name, tagRe.lastIndex);
        tagRe.lastIndex = endIdx < 0 ? html.length : endIdx;
        continue;
      }
      if (VOID.has(name) || m[3].trim().endsWith('/')) continue;
      stack.push({ name, start: m.index, end: tagRe.lastIndex, p: 0, skip: SKIP_INSIDE.has(name) || UI_RE.test(m[3]) || !!(parent && parent.skip) });
    } else {
      const i = stack.map((n) => n.name).lastIndexOf(name);
      if (i < 0) continue;
      while (stack.length > i) close(stack.pop());
    }
  }
  while (stack.length) close(stack.pop());
  return best ? { start: best.start, end: best.end, name: best.name, p: best.p } : null;
}

// Marks on real start tags only (not in scripts, styles or text).
export const countMarks = (html) => (html.replace(/<(script|style|template)\b[^>]*>[\s\S]*?<\/\1>/gi, '').replace(/<!--[\s\S]*?-->/g, '').match(/<[a-zA-Z][^>]*\sclass="[^"]*\bjourney-content\b[^"]*"[^>]*>/g) || []).length;

// Undo exactly what markContent adds, and only there: the journey-content token inside a
// class attribute of a real start tag. Script, style and template bodies are left alone, so
// a string or a title that mentions journey-content is never touched.
export function stripContent(html) {
  if (!html.includes('journey-content')) return html;
  const out = [];
  const re = /<(script|style|template)\b[^>]*>[\s\S]*?<\/\1>|<!--[\s\S]*?-->|<[a-zA-Z][a-zA-Z0-9-]*(?:[^>"']|"[^"]*"|'[^']*')*>/gi;
  let last = 0, m;
  while ((m = re.exec(html))) {
    out.push(html.slice(last, m.index));
    let t = m[0];
    if (!m[1] && !t.startsWith('<!--')) t = t.replace(/ class="journey-content"/, '').replace(/(\sclass="[^"]*?) journey-content"/, '$1"');
    out.push(t); last = re.lastIndex;
  }
  out.push(html.slice(last));
  return out.join('');
}

// Strip any earlier mark, then add `journey-content` to the chosen start tag's class.
// A single-quoted or unquoted class is rewritten double-quoted with the same value.
export function markContent(html) {
  const s = stripContent(html);
  const hit = findContent(s);
  if (!hit) return { html: s, hit: null };
  const tag = s.slice(hit.start, hit.end);
  const CLASS_RE = /\sclass\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>"']+))/i;
  const m = tag.match(CLASS_RE);
  const next = m
    ? tag.replace(CLASS_RE, () => { const v = (m[1] ?? m[2] ?? m[3] ?? '').trim(); return ` class="${v ? v + ' ' : ''}journey-content"`; })
    : tag.replace(/^<([a-zA-Z0-9-]+)/, '<$1 class="journey-content"');
  return { html: s.slice(0, hit.start) + next + s.slice(hit.end), hit };
}
