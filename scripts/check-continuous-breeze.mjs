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
  const height = viewport * 2.94;
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
      top + (height * tick) / 100,
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
        breezePose(top + (height * tick) / 100, top, height, viewport, width),
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
  const first = breezeGeometry(portrait[0], portrait[1] * 2.94);
  const turned = breezeGeometry(landscape[0], landscape[1] * 2.94);
  assert.notEqual(
    first.outline,
    turned.outline,
    'orientation recomposes geometry',
  );
  assert.equal(
    breezeGeometry(portrait[0], portrait[1] * 2.94).outline,
    first.outline,
    'turning back restores the same composition',
  );
}
const compactPage = breezePose(30, 0, 100, 900, 390);
assert.ok(Object.values(compactPage).every(Number.isFinite));
assert.equal(compactPage.progress, 0.3);
// New scene boundaries drive the end, without stretching the opening when the
// final chapter grows. The first three fiber knots retain the same coordinates.
for (const width of [375, 390, 430, 768, 1024, 1280, 1440, 1920]) {
  const opening = 1800;
  const a = strand(breezeGeometry(width, 2700, opening).threads[18]);
  const b = strand(breezeGeometry(width, 3000, opening).threads[18]);
  assert.deepEqual(
    a.slice(0, 2),
    b.slice(0, 2),
    'opening cloth stays anchored',
  );
  const start = breezePose(1800, 0, 2700, 900, width);
  const release = breezePose(2350, 0, 2700, 900, width);
  const footer = breezePose(2700, 0, 2700, 900, width);
  assert.equal(start.opacity, 1, 'full Worlds frame retains its Breeze');
  assert.ok(
    release.opacity > 0 && release.opacity < 1,
    'release fades within the final scene',
  );
  assert.equal(footer.opacity, 0, 'no fabric runs through the footer');
  assert.ok(
    Math.abs(footer.x - (width < 768 ? 3 : width < 1200 ? 5 : 8)) < 1e-9,
  );
  assert.equal(breezePose(2700, 0, 2700, 900, width, true).opacity, 0);
}
console.log(
  'Continuous Breeze passed: opening anchors, connected single cloth, bounded thickness, actual Worlds endpoint, footer fade, reverse scroll, reduced motion and responsive/orientation geometry. No browser performance measurements claimed.',
);

const { portalBreezeGeometry } = loaded.exports;
for (const [width, stage] of sizes) {
  const top = stage * 1.1,
    span = stage * (width < 768 ? 0.7 : 0.8),
    height = top + span + stage * 1.24;
  const positions = [0, 0.25, 0.4, 0.5, 0.6, 0.75, 1];
  const snapshots = positions.map((p) =>
    portalBreezeGeometry(width, height, top, stage, span, p),
  );
  assert.deepEqual(
    snapshots,
    positions
      .toReversed()
      .map((p) => portalBreezeGeometry(width, height, top, stage, span, p))
      .reverse(),
  );
  for (const g of snapshots) {
    for (const path of g.threads) strand(path);
    assert(!g.outline.includes('NaN'));
  }
  const final = strand(snapshots.at(-1).threads[18]);
  assert(
    Math.abs(final[0][0] - width * 0.5) < 5,
    'origin is the oculus centre',
  );
  assert(
    final.at(-1)[6] > width * 0.9 && final.at(-1)[6] < width * 0.99,
    'tail leads to the CTA side',
  );
  assert(
    final.at(-1)[7] > top + span + stage * 0.8 &&
      final.at(-1)[7] < top + span + stage * 0.9,
    'tail settles above the footer',
  );
}
console.log(
  'Portal cloth: connected A/B/C spline, reversible interpolation, skylight origin and tapered CTA endpoint verified.',
);
