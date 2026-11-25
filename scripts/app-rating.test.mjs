// Tests for scripts/app-rating.mjs (Apple lookup parsing) and the app bar's rating line in
// assets/site-nav.js. Run: node scripts/app-rating.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { parseLookup, APP_ID } from './app-rating.mjs';

const hit = (o) => ({ resultCount: 1, results: [{ trackId: Number(APP_ID), ...o }] });
assert.deepEqual(parseLookup(hit({ averageUserRating: 4.53846, userRatingCount: 26 })), { rating: 4.5, count: 26 });
assert.deepEqual(parseLookup(hit({ averageUserRating: 4.96, userRatingCount: 3 })), { rating: 5, count: 3 });
assert.equal(parseLookup({ resultCount: 0, results: [] }), null);
assert.equal(parseLookup(hit({ averageUserRating: 0, userRatingCount: 0 })), null);
assert.equal(parseLookup(hit({ userRatingCount: 5 })), null);
assert.equal(parseLookup({ results: [{ trackId: 1, averageUserRating: 4, userRatingCount: 9 }] }), null);

// Run the app bar in a stub page and return the rating line it ends up showing.
async function barText(json, { ok = true, ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)' } = {}) {
  const src = readFileSync(new URL('../assets/site-nav.js', import.meta.url), 'utf8');
  const span = { textContent: '' };
  const el = () => ({ setAttribute() {}, classList: { add() {}, remove() {} }, querySelector: (q) => q === '.t span' ? span : { set href(v) {}, set onclick(v) {} }, set innerHTML(v) {} });
  let timer;
  const win = {
    matchMedia: () => ({ matches: true }), addEventListener() {}, setTimeout: (f) => { timer = f; },
    fetch: async () => ({ ok, json: async () => json }),
  };
  const ctx = {
    window: win, navigator: { userAgent: ua }, location: { pathname: '/dash-preorder.html' },
    localStorage: { getItem: () => null, setItem() {} }, requestAnimationFrame() {},
    document: { createElement: el, head: { appendChild() {} }, body: { appendChild() {} }, documentElement: {}, readyState: 'complete', querySelector: () => null, querySelectorAll: () => [], addEventListener() {} },
    MutationObserver: undefined, console,
  };
  Object.assign(win, ctx); ctx.setTimeout = win.setTimeout; ctx.fetch = win.fetch;
  vm.runInNewContext(src, ctx);
  timer();
  const fallback = span.textContent;
  await new Promise(r => setImmediate(r));
  return { fallback, shown: span.textContent };
}

let t = await barText({ ios: { rating: 4.6, count: 31 } });
assert.equal(t.fallback, 'App Store 4.5 ★');
assert.equal(t.shown, 'App Store 4.6 ★ (31 ratings)');
t = await barText({ ios: { rating: 5, count: 1 } });
assert.equal(t.shown, 'App Store 5.0 ★ (1 rating)');
t = await barText({ ios: { rating: 4.5, count: null } });
assert.equal(t.shown, 'App Store 4.5 ★');
t = await barText(null, { ok: false });
assert.equal(t.shown, 'App Store 4.5 ★');
t = await barText({ ios: { rating: 'x' } });
assert.equal(t.shown, 'App Store 4.5 ★');
t = await barText({ ios: { rating: 4.6, count: 31 } }, { ua: 'Mozilla/5.0 (Linux; Android 14)' });
assert.equal(t.shown, 'Google Play 5.0 ★ (12 reviews)');
console.log('app-rating tests: all pass');
