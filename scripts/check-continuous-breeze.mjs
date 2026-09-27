/** Verify document-space continuity and reversible sampling. These checks do
 * not claim to measure visual quality, browser FPS, memory or GPU resources. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const source = readFileSync(
  new URL('../components/home/experience/breeze-geometry.ts', import.meta.url),
  'utf8',
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
});
const loaded = { exports: {} };
runInNewContext(outputText, { module: loaded, exports: loaded.exports });
const { breezeFamily, breezeGeometry, breezePose } = loaded.exports;
const sizes = [
  [320, 568],
  [360, 800],
  [375, 812],
  [390, 844],
  [430, 932],
  [768, 1024],
  [820, 1180],
  [1024, 768],
  [1280, 800],
  [1366, 768],
  [1440, 900],
  [1728, 1117],
  [1920, 1080],
  [2560, 1440],
  [844, 390],
  [1180, 820],
];

// Parse a strand as actual cubic segments. A path must be connected from top
// entry to bottom exit without a second moveto at any section boundary.
function strand(d) {
  assert.equal((d.match(/M/g) ?? []).length, 1);
  assert.ok(!/[LZ]/.test(d));
  const [start, ...curves] = d.slice(1).split('C');
  const numbers = (text) => text.trim().split(/\s+/).map(Number);
  const initial = numbers(start);
  assert.equal(initial.length, 2);
  let last = initial;
  return curves.map((part) => {
    const values = numbers(part);
    assert.equal(values.length, 6);
    assert.ok(values.every(Number.isFinite));
    const curve = [...last, ...values];
    last = values.slice(-2);
    return curve;
  });
}
function sample(curve, t) {
  const s = 1 - t;
  return [0, 1].map(
    (axis) =>
      s ** 3 * curve[axis] +
      3 * s ** 2 * t * curve[axis + 2] +
      3 * s * t ** 2 * curve[axis + 4] +
      t ** 3 * curve[axis + 6],
  );
}
function normalWidth(geometry) {
  const left = strand(geometry.threads[0]);
  const right = strand(geometry.threads.at(-1));
  assert.equal(left.length, right.length);
  return left.flatMap((curve, i) =>
    Array.from({ length: 21 }, (_, tick) => {
      const a = sample(curve, tick / 20),
        b = sample(right[i], tick / 20);
      return Math.hypot(a[0] - b[0], a[1] - b[1]);
    }),
  );
}
for (const [width, viewport] of sizes) {
  const height = viewport * 5.7;
  const geometry = breezeGeometry(width, height);
  assert.equal(geometry.family, breezeFamily(width));
  for (const path of [geometry.outline, ...geometry.folds]) {
    assert.equal((path.match(/M/g) ?? []).length, 1, 'one joined contour');
    assert.ok(path.endsWith('Z'), 'fabric shading has no open section edge');
    assert.doesNotMatch(path, /NaN|Infinity/);
  }
  const center = strand(
    geometry.threads[Math.floor(geometry.threads.length / 2)],
  );
  assert.ok(center[0][1] < 0, 'fabric enters before the first visible pixel');
  assert.ok(center.at(-1)[7] > height, 'fabric exits beyond the last scene');
  let previousY = -Infinity;
  for (const curve of center) {
    for (let tick = 0; tick <= 30; tick++) {
      const [x, y] = sample(curve, tick / 30);
      assert.ok(
        y >= previousY - 0.01,
        'continuous progress through the document',
      );
      assert.ok(
        x > -width * 0.4 && x < width * 1.4,
        'deliberate bounded edge exits',
      );
      previousY = y;
    }
  }
  const breadths = normalWidth(geometry);
  assert.ok(
    Math.min(...breadths) > width * 0.015,
    'no pinched gap within the cloth',
  );
  assert.ok(
    Math.max(...breadths) < Math.min(width * 0.29, 370),
    'ultrawide cloth remains bounded',
  );

  // Arbitrary scroll entry and reversal must not depend on the scene previously
  // visited. A held intro passes top as scrollY and therefore samples zero.
  const top = 125,
    snapshots = [];
  for (let tick = 0; tick <= 100; tick++) {
    const pose = breezePose(
      top + ((height - viewport) * tick) / 100,
      top,
      height,
      viewport,
      width,
    );
    assert.ok(Math.abs(pose.progress - tick / 100) < 1e-12);
    assert.ok(Math.abs(pose.x) <= 8 && Math.abs(pose.y) <= 12);
    snapshots.push(JSON.stringify(pose));
  }
  for (let tick = 100; tick >= 0; tick--) {
    assert.equal(
      JSON.stringify(
        breezePose(
          top + ((height - viewport) * tick) / 100,
          top,
          height,
          viewport,
          width,
        ),
      ),
      snapshots[tick],
    );
  }
  assert.equal(
    breezePose(top - 1000, top, height, viewport, width).progress,
    0,
  );
  assert.equal(
    breezePose(height + top + viewport, top, height, viewport, width).progress,
    1,
  );
  const still = breezePose(height / 2, top, height, viewport, width, true);
  assert.equal(still.x, 0);
  assert.equal(still.y, 0);
}

// More content makes the route longer, never stretches fabric thickness. This
// catches the former object-fit:fill behaviour on unusually tall mobile pages.
for (const width of [390, 820, 1440, 2560]) {
  const short = Math.max(...normalWidth(breezeGeometry(width, 4500)));
  const long = Math.max(...normalWidth(breezeGeometry(width, 14000)));
  assert.ok(long / short > 0.85 && long / short < 1.15);
}
assert.equal(breezeFamily(767), 'mobile');
assert.equal(breezeFamily(768), 'tablet');
assert.equal(breezeFamily(1199), 'tablet');
assert.equal(breezeFamily(1200), 'desktop');
for (const [portrait, landscape] of [
  [
    [390, 844],
    [844, 390],
  ],
  [
    [820, 1180],
    [1180, 820],
  ],
]) {
  const first = breezeGeometry(portrait[0], portrait[1] * 5.7);
  const turned = breezeGeometry(landscape[0], landscape[1] * 5.7);
  assert.notEqual(
    first.outline,
    turned.outline,
    'orientation recomposes geometry',
  );
  assert.equal(
    breezeGeometry(portrait[0], portrait[1] * 5.7).outline,
    first.outline,
    'turning back restores the same composition',
  );
}
const compactPage = breezePose(30, 0, 100, 900, 390);
assert.ok(Object.values(compactPage).every(Number.isFinite));
assert.equal(compactPage.progress, 1);
console.log(
  'Continuous Breeze: 14 requested viewports plus portrait/landscape, connected contours, bounded physical thickness, reversible scroll, reduced motion and orientation recomposition passed. No browser performance measurements are claimed.',
);
