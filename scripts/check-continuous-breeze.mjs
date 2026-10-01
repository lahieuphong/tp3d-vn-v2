/** Verify shared-stage continuity and reversible sampling. These checks do
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
const frame = { exports: {} };
runInNewContext(
  ts.transpileModule(
    readFileSync(
      new URL(
        '../components/home/experience/home-story-frame.ts',
        import.meta.url,
      ),
      'utf8',
    ),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  ).outputText,
  { module: frame, exports: frame.exports },
);
runInNewContext(outputText, {
  module: loaded,
  exports: loaded.exports,
  require(path) {
    assert.equal(path, './home-story-frame');
    return frame.exports;
  },
});
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
const { storyBreezeGeometry } = loaded.exports;
for (const [width, height] of sizes) {
  const positions = [
    0, 0.18, 0.3, 0.45, 0.495, 0.55, 0.575, 0.61, 0.67, 0.75, 0.85, 1,
  ];
  const samples = positions.map((p) => storyBreezeGeometry(width, height, p));
  assert.deepEqual(
    samples,
    positions
      .toReversed()
      .map((p) => storyBreezeGeometry(width, height, p))
      .reverse(),
  );
  for (const g of samples) {
    for (const path of g.threads) strand(path);
    assert(!/NaN|Infinity/.test(g.outline));
  }
  assert.deepEqual(
    storyBreezeGeometry(width, height, 0.34),
    storyBreezeGeometry(width, height, 0.48),
    'reading hold retains the same fabric shape',
  );
  assert.notEqual(
    storyBreezeGeometry(width, height, 0.48).outline,
    storyBreezeGeometry(width, height, 0.575).outline,
    'near-camera approach changes curvature rather than only opacity',
  );
  const final = strand(samples.at(-1).threads[18]);
  assert(
    final.every((segment) => segment[0] > width && segment[6] > width),
    'cloth passes the lens and exits right; no atrium return',
  );
}
console.log(
  'Bridge cloth: single connected spline, reversible camera passage, exits outside atrium.',
);
