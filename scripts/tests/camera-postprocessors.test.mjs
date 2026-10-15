import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = fileURLToPath(new URL('../../', import.meta.url));
test('monthly refresh preserves camera map-first layout and the finishing steps converge', () => {
  const fixture = mkdtempSync(join(tmpdir(), 'milecheck-camera-pipeline-'));
  try {
    for (const dir of ['scripts', 'cameras/utah', 'road-conditions', 'data']) mkdirSync(resolve(fixture, dir), { recursive: true });
    for (const script of ['add-month-numbers.mjs', 'add-camera-route-filter.mjs', 'gen-state-camera-pages.js'])
      copyFileSync(resolve(root, 'scripts', script), resolve(fixture, 'scripts', script));
    const target = resolve(fixture, 'cameras/utah/index.html');
    copyFileSync(resolve(root, 'cameras/utah/index.html'), target);
    writeFileSync(resolve(fixture, 'data/road-report-october-2026.json'), JSON.stringify({
      month: '2026-10', jurisdictionSummary: [{ state: 'UT', total: 7, closure: 2, crash: 1, construction: 4, topRoutes: ['I-15'] }],
    }));
    const finish = () => {
      execFileSync(process.execPath, ['scripts/add-month-numbers.mjs'], { cwd: fixture });
      execFileSync(process.execPath, ['scripts/add-camera-route-filter.mjs'], { cwd: fixture });
      return readFileSync(target, 'utf8');
    };
    const first = finish();
    assert.ok(first.indexOf('id="comap"') < first.indexOf('<!-- monthnum:start -->'));
    assert.ok(first.indexOf('<!-- monthnum:start -->') < first.indexOf('<!-- camera-after-map:end -->'));
    assert.match(first, /In October 2026, Utah's DOT feed carried 7 alerts/);
    for (const marker of ['id="statCams"', 'id="statPlows"', '<!-- monthnum:start -->', '<!-- camera-route:start -->'])
      assert.equal(first.split(marker).length - 1, 1, marker);
    assert.equal(finish(), first, 'a second full pass should not move or duplicate content');
  } finally { rmSync(fixture, { recursive: true, force: true }); }
});
