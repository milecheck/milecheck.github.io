import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { HOST, ENDPOINT, MAX_BATCH, readConfig, resolveCommit, publicHtmlPath, isIndexableHtml,
  changedUrls, batches, submitUrls, parseArgs, run } from '../submit-indexnow.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const config = readConfig(root);
const html = (title = 'Example', meta = '') => `<!doctype html><html><head><title>${title}</title>${meta}</head><body>Road details.</body></html>`;

function fixture() {
  const dir = mkdtempSync(join(tmpdir(), 'milecheck-indexnow-'));
  const git = (...args) => execFileSync('git', ['-c', 'user.name=IndexNow test', '-c', 'user.email=indexnow-test@example.invalid', ...args], {
    cwd: dir, encoding: 'utf8', env: { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
  function write(file, content) { mkdirSync(dirname(join(dir, file)), { recursive: true }); writeFileSync(join(dir, file), content); }
  function commit() { git('add', '.'); git('commit', '-qm', 'IndexNow fixture'); return git('rev-parse', 'HEAD'); }
  git('init', '-q');
  write('CNAME', HOST + '\n'); write('data/indexnow.json', JSON.stringify(config)); write(`${config.key}.txt`, config.key + '\n');
  return { dir, git, write, commit, close: () => rmSync(dir, { recursive: true, force: true }) };
}

function response(status = 200, text = '') { return { status, text: async () => text }; }
function keyThen(post) {
  return async (url, options) => url === config.keyLocation ? response(200, config.key) : post(url, options);
}

test('real public key matches the configured host, root filename and official endpoint', () => {
  assert.equal(config.host, 'milecheckapp.com');
  assert.equal(config.endpoint, 'https://api.indexnow.org/indexnow');
  assert.match(config.key, /^[a-f0-9]{32}$/);
  assert.equal(config.keyLocation, `https://${HOST}/${config.key}.txt`);
  assert.equal(readFileSync(join(root, `${config.key}.txt`), 'utf8').trim(), config.key);
});

test('changed public HTML is derived from git blobs, including genuine deletions and renamed URLs', () => {
  const f = fixture();
  try {
    f.write('index.html', html('Old home'));
    f.write('removed.html', html('Old public page'));
    f.write('renamed/index.html', html('Moved public page'));
    f.write('private/deleted.html', html('Private deletion'));
    f.write('previous-noindex.html', html('Noindex deletion', '<meta content="noindex" name="robots">'));
    const from = f.commit();
    f.write('index.html', html('New home'));
    f.write('corridors/i-75/florida/index.html', html('I-75 in Florida'));
    f.write('road conditions/index.html', html('Encoded path'));
    f.git('mv', 'renamed', 'new-name');
    f.git('rm', 'removed.html', 'private/deleted.html', 'previous-noindex.html');
    for (const file of ['private/page.html', 'internal/page.html', 'design/page.html', 'design.html',
      'boards/demo.html', 'scripts/page.html', 'data/page.html', 'docs/page.html', '.draft/index.html',
      'or-family/index.html', 'search/index.html', '404.html', 'googleabcdef.html']) f.write(file, html());
    f.write('noindex.html', html('Noindex', "<meta content='noindex,follow' name='robots'>"));
    f.write('noindex-bing.html', html('Noindex', '<meta name=bingbot content=noindex>'));
    f.write('not-html.html', 'not an HTML page');
    f.write('readme.md', '# Not a page');
    f.write('feed.json', '{}');
    symlinkSync('index.html', join(f.dir, 'symlink.html'));
    const to = f.commit();
    // A file absent from the working copy is still a genuine page in the deployed git tree.
    rmSync(join(f.dir, 'road conditions/index.html'));
    assert.deepEqual(changedUrls({ root: f.dir, from, to }).urls, [
      `https://${HOST}/`, `https://${HOST}/corridors/i-75/florida/`, `https://${HOST}/new-name/`,
      `https://${HOST}/removed.html`, `https://${HOST}/renamed/`, `https://${HOST}/road%20conditions/`,
    ]);
  } finally { f.close(); }
});

test('path and noindex filters exclude internal or invalid targets', () => {
  for (const file of ['a/../page.html', 'private.html', 'internal-only.html', 'design-v2/index.html',
    'boards/index.html', 'search/index.html', '404.html', '_draft/page.html', 'page?x.html', 'page%20.html',
    'page\\name.html', 'page\n.html', '/page.html', 'guide.json']) assert.equal(publicHtmlPath(file), false, file);
  assert.equal(publicHtmlPath('guide/index.html'), true);
  for (const meta of ['<meta name="robots" content="noindex, follow">',
    "<meta content='NOINDEX' name='Googlebot'>", '<meta name=bingbot content=none>'])
    assert.equal(isIndexableHtml(html('Private', meta)), false);
  assert.equal(isIndexableHtml(html('Visible', '<!-- <meta name="robots" content="noindex"> -->')), true);
  assert.equal(isIndexableHtml(null), false);
});

test('commit refs are validated and reversed or unknown ranges fail', () => {
  const f = fixture();
  try {
    f.write('index.html', html()); const first = f.commit();
    f.write('index.html', html('Changed')); const second = f.commit();
    assert.equal(resolveCommit(f.dir, 'HEAD^'), first);
    for (const ref of ['--all', 'HEAD\n', 'HEAD;echo x', 'not-a-real-ref'])
      assert.throws(() => changedUrls({ root: f.dir, from: ref, to: second }));
    assert.throws(() => changedUrls({ root: f.dir, from: second, to: first }), /ancestor/);
    assert.deepEqual(changedUrls({ root: f.dir, from: second, to: second }).urls, []);
  } finally { f.close(); }
});

test('CLI defaults to dry-run and dry-run never makes an HTTP request', async () => {
  assert.deepEqual(parseArgs(['--from', 'HEAD^', '--to', 'HEAD']), { submit: false, from: 'HEAD^', to: 'HEAD' });
  assert.equal(parseArgs(['--from', 'HEAD^', '--to', 'HEAD', '--submit']).submit, true);
  assert.throws(() => parseArgs(['--from', 'HEAD', '--submit']), /Both/);
  assert.throws(() => parseArgs(['--from', '--to', 'HEAD']), /needs/);
  assert.throws(() => parseArgs(['--all']), /Unknown/);
  const f = fixture();
  try {
    f.write('index.html', html()); const from = f.commit();
    f.write('index.html', html('Updated')); const to = f.commit();
    const report = await run({ from, to, submit: false }, { root: f.dir, fetchImpl() { throw Error('No dry-run network'); } });
    assert.equal(report.mode, 'dry-run');
    assert.deepEqual(report.urls, [`https://${HOST}/`]);
    assert.equal(report.batches, 1);
    assert.equal(report.responses, undefined);
  } finally { f.close(); }
});

test('batches contain at most 10000 deduplicated same-host HTTPS URLs', () => {
  const urls = Array.from({ length: 10001 }, (_, i) => `https://${HOST}/page-${i}/`);
  const payloads = batches(config, [...urls, urls[0]]);
  assert.deepEqual(payloads.map(p => p.urlList.length), [MAX_BATCH, 1]);
  for (const payload of payloads) {
    assert.equal(payload.host, HOST); assert.equal(payload.key, config.key); assert.equal(payload.keyLocation, config.keyLocation);
  }
  for (const url of ['http://milecheckapp.com/', 'https://other.example/', 'https://milecheckapp.com/?query=1',
    'https://milecheckapp.com/#fragment', 'https://user:password@milecheckapp.com/']) assert.throws(() => batches(config, [url]));
});

test('explicit submission verifies the public key and sends protocol JSON to one endpoint', async () => {
  const calls = [];
  const result = await submitUrls({ config, urls: [`https://${HOST}/guide/`], fetchImpl: async (url, options) => {
    calls.push({ url, options });
    return url === config.keyLocation ? response(200, config.key + '\n') : response(200);
  } });
  assert.equal(calls.length, 2);
  assert.equal(calls[0].options.method, 'GET');
  assert.equal(calls[1].url, ENDPOINT);
  assert.equal(calls[1].options.method, 'POST');
  assert.equal(calls[1].options.redirect, 'error');
  assert.equal(calls[1].options.headers['Content-Type'], 'application/json; charset=utf-8');
  assert.deepEqual(JSON.parse(calls[1].options.body), {
    host: HOST, key: config.key, keyLocation: config.keyLocation, urlList: [`https://${HOST}/guide/`],
  });
  assert.deepEqual(result, [{ status: 200, result: 'received', urls: 1 }]);
  assert.deepEqual(await submitUrls({ config, urls: [], fetchImpl() { throw Error('No empty submissions'); } }), []);
});

test('HTTP 202 is reported as key validation pending, never indexed', async () => {
  const result = await submitUrls({ config, urls: [`https://${HOST}/`], fetchImpl: keyThen(async () => response(202, 'Accepted')) });
  assert.deepEqual(result, [{ status: 202, result: 'key-validation-pending', urls: 1 }]);
});

test('bad hosted keys, HTTP failures and malformed responses are not success', async () => {
  for (const mock of [async () => response(404), async () => response(200, 'wrong-key')])
    await assert.rejects(submitUrls({ config, urls: [`https://${HOST}/`], fetchImpl: mock }), /key verification failed/);
  for (const status of [301, 400, 403, 422, 429, 500])
    await assert.rejects(submitUrls({ config, urls: [`https://${HOST}/`],
      fetchImpl: keyThen(async () => response(status, 'failure')) }), new RegExp(`HTTP ${status}`));
  for (const body of ['<html>Gateway error</html>', '{bad-json', '{"error":"no"}', '{"unexpected":true}'])
    await assert.rejects(submitUrls({ config, urls: [`https://${HOST}/`],
      fetchImpl: keyThen(async () => response(200, body)) }), /Unexpected IndexNow response/);
  for (const malformed of [undefined, { status: '200', text: async () => '' }, { status: 200 }, response(200, null)])
    await assert.rejects(submitUrls({ config, urls: [`https://${HOST}/`], fetchImpl: keyThen(async () => malformed) }), /Malformed HTTP/);
});

test('network errors and timeout aborts fail the request', async () => {
  await assert.rejects(submitUrls({ config, urls: [`https://${HOST}/`], fetchImpl: async () => { throw Error('offline'); } }), /offline/);
  await assert.rejects(submitUrls({ config, urls: [`https://${HOST}/`], timeoutMs: 5,
    fetchImpl: (_url, options) => new Promise((_resolve, reject) => {
      options.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
    }),
  }), /timed out/);
});

test('automation is restricted to successful Pages builds and checks out the built SHA', () => {
  const workflow = readFileSync(join(root, '.github/workflows/indexnow.yml'), 'utf8');
  assert.match(workflow, /on:\s*\n\s+page_build:/);
  assert.match(workflow, /github\.event\.build\.status == 'built'/);
  assert.match(workflow, /ref: \$\{\{ github\.event\.build\.commit \}\}/);
  assert.match(workflow, /fetch-depth: 2/);
  assert.match(workflow, /contents: read/);
  assert.match(workflow, /persist-credentials: false/);
  assert.match(workflow, /--from "\$\{BUILT_SHA\}\^" --to "\$BUILT_SHA" --submit/);
  assert.doesNotMatch(workflow, /\bschedule:|\bpush:|contents: write|fetch-depth: 0/);
});
