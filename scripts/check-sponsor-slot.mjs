#!/usr/bin/env node
// check-sponsor-slot.mjs — assertions for the public sponsor slot renderer (scripts/lib/sponsor-slot.js).
// Added 2026-10-09 after the sponsor review: every sponsor text field must be HTML-escaped and every
// link must be https, http, tel:+digits or a /site path. Run from the site root:
//   node scripts/check-sponsor-slot.mjs
// Prints "ok" and exits 0, or throws on the first failure.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const S = require('./lib/sponsor-slot');

// Links
for (const bad of ['javascript:alert(1)', 'JAVASCRIPT:alert(1)', ' javascript:alert(1)', 'java\tscript:alert(1)', 'data:text/html,x',
  'vbscript:x', '//evil.example', 'https://user:pw@shop.com', 'mailto:a@b.co', 'ftp://shop.com', 'https://shop.com/"onmouseover="x', '']) {
  assert.equal(S.safeHref(bad), '', 'should refuse ' + JSON.stringify(bad));
}
assert.equal(S.safeHref('https://shop.com/a?utm_source=x&b=1'), 'https://shop.com/a?utm_source=x&b=1');
assert.equal(S.safeHref('http://shop.com'), 'http://shop.com/');
assert.equal(S.safeHref('tel:+17605550100'), 'tel:+17605550100');
assert.equal(S.safeHref('tel:+17605550100', { tel: false }), '');
assert.equal(S.safeHref('/images/sponsors/acme.png', { tel: false }), '/images/sponsors/acme.png');
assert.equal(S.safeHref('/sponsor/', { relative: false }), '');

// A sponsor with a bad link is not active, and a config holding one is refused outright.
const good = { id: 'acme', name: 'Acme', url: 'https://acme.example.com', copy: 'Towing.', cta: 'Call' };
assert.equal(S.isActive(good, '2026-10-09'), true);
assert.equal(S.isActive({ ...good, url: 'javascript:alert(1)' }, '2026-10-09'), false);
assert.throws(() => S.assertSafeLinks({ slots: { 'pass:cajon': { ...good, url: 'javascript:alert(1)' } } }), /Refusing: pass:cajon\.url/);
assert.throws(() => S.assertSafeLinks({ slots: { 'pass:cajon': { ...good, logo: 'data:image/svg+xml,<svg onload=alert(1)>' } } }), /pass:cajon\.logo/);
assert.throws(() => S.assertSafeLinks({ slots: {}, reportSponsorUrl: 'javascript:x' }), /reportSponsorUrl/);
S.assertSafeLinks({ slots: { 'pass:cajon': { ...good, logo: '/images/sponsors/acme.png' } }, house: { url: '/sponsor/', roy: '/images/sponsors/roy-sponsor.png' }, reportSponsorUrl: 'https://buy.stripe.com/abc' });

// Text is escaped everywhere it lands.
const evil = {
  id: 'x', name: '<img src=x onerror=alert(1)>', copy: '"><script>alert(1)</script>', cta: "' onclick='x",
  url: 'https://acme.example.com/?q="><script>', logo: '/images/sponsors/acme.png', logoW: '264"><script>', logoH: 72,
};
const html = S.slotHtml('pass:cajon', evil, {});
assert.ok(!/<script>|<img src=x/i.test(html), 'raw markup leaked: ' + html);
assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;'));
// Attributes are always double-quoted, so a quote in the text can't open one.
assert.ok(!/<[^>]*\sonclick=/i.test(html), 'an attribute leaked: ' + html);
assert.ok(html.includes('href=""'), 'a link with quotes or brackets in it should be dropped: ' + html);
assert.ok(S.slotHtml('pass:cajon', { ...good, url: 'https://acme.example.com/?q=%22x' }, {}).includes('href="https://acme.example.com/?q=%22x"'));
assert.ok(html.includes('width="264"'), 'logo width not numeric');

// A bad sponsor link renders an empty href, never the bad value.
const html2 = S.slotHtml('pass:cajon', { ...good, url: 'javascript:alert(1)' }, {});
assert.ok(!/javascript:/i.test(html2));

// House slot: a bad house link falls back to /sponsor/.
const house = S.slotHtml('pass:cajon', null, { url: 'javascript:alert(1)', cta: 'Ask', title: '<b>x</b>' });
assert.ok(house.includes('href="/sponsor/"') && house.includes('&lt;b&gt;x&lt;/b&gt;'));

// The live config passes.
S.assertSafeLinks(JSON.parse(require('fs').readFileSync(S.CONFIG_PATH, 'utf8')));
console.log('ok');
