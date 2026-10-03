/** Verify shared-stage continuity and reversible sampling. These checks do
 * not claim to measure visual quality, browser FPS, memory or GPU resources. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { loadStoryMath } from './load-story-math.mjs';

const load = (file, dependencies = {}) => {
  const source = readFileSync(new URL(file, import.meta.url), 'utf8');
  const loaded = { exports: {} };
  runInNewContext(
    ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText,
    {
      module: loaded,
      exports: loaded.exports,
      require: (name) => {
        assert(name in dependencies, `unexpected dependency ${name}`);
        return dependencies[name];
      },
    },
  );
  return loaded.exports;
};
const geometryModule = loadStoryMath('breeze-geometry');
const bridgeModule = loadStoryMath('atmospheric-bridge-frame');
const frameModule = loadStoryMath('home-story-frame');
const poseModule = loadStoryMath('breeze-bridge-pose');
const rendererModule = load(
  '../components/home/experience/breeze-renderer.ts',
  {
    './breeze-geometry': geometryModule,
    './home-story-frame': frameModule,
    './atmospheric-bridge-frame': bridgeModule,
    './breeze-bridge-pose': poseModule,
  },
);
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
const { storyBreezeGeometry } = geometryModule;
const { bridgeBreezePose } = poseModule;
// Sample the actual cubic silhouette, not merely its bounding box. The hard
// world swap requires every viewport probe to lie inside the opaque cloth.
function silhouette(d) {
  let last = [0, 0];
  const polygon = [];
  for (const [, command, part] of d.matchAll(/([MLCZ])([^MLCZ]*)/g)) {
    const values = part.trim().split(/\s+/).filter(Boolean).map(Number);
    if (command === 'M' || command === 'L') {
      last = values;
      polygon.push(last);
    } else if (command === 'C') {
      for (let i = 1; i <= 32; i++) {
        const t = i / 32,
          s = 1 - t;
        polygon.push(
          [0, 1].map(
            (axis) =>
              s ** 3 * last[axis] +
              3 * s * s * t * values[axis] +
              3 * s * t * t * values[axis + 2] +
              t ** 3 * values[axis + 4],
          ),
        );
      }
      last = values.slice(-2);
    }
  }
  return polygon;
}
function inside(x, y, polygon) {
  let hit = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i],
      [xj, yj] = polygon[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
      hit = !hit;
  }
  return hit;
}
for (const [width, height] of sizes) {
  const geometry = storyBreezeGeometry(width, height);
  assert.equal(geometry.threads.length, 37);
  assert.equal(geometry.folds.length, 12);
  for (const path of geometry.threads) strand(path);
  assert(!/NaN|Infinity/.test(geometry.outline));
  assert.deepEqual(
    geometry,
    storyBreezeGeometry(width, height),
    'static geometry is deterministic',
  );
  assert.notEqual(
    geometry.outline,
    storyBreezeGeometry(width, height + 100).outline,
    'resize recalculates stage-relative paths',
  );
  const target = { ...geometry, width, height };
  const forward = Array.from({ length: 401 }, (_, i) =>
    bridgeBreezePose(i / 400, target),
  );
  const reverse = Array.from({ length: 401 }, (_, i) =>
    bridgeBreezePose((400 - i) / 400, target),
  ).reverse();
  assert.deepEqual(
    forward,
    reverse,
    'near-camera poses resolve identically in either scroll direction',
  );
  for (const pose of forward) {
    assert(
      Object.values(pose).every(
        (value) => typeof value !== 'number' || Number.isFinite(value),
      ),
    );
    assert(pose.opacity >= 0 && pose.opacity <= 1);
  }
  for (const p of [0.635, bridgeModule.bridgeTiming.swap, 0.645]) {
    const pose = bridgeBreezePose(p, target);
    assert.equal(pose.opacity, 1);
    assert.equal(
      pose.density,
      1,
      'world replacement happens behind fully dense cloth material',
    );
    assert.equal(pose.transfer, width < 768 ? 0 : 1);
    assert.equal(pose.foreground, true);
    const radians = (pose.rotate * Math.PI) / 180;
    const polygon = silhouette(geometry.outline).map(([x, y]) => {
      const dx = (x - geometry.focus.x) * pose.scale;
      const dy = (y - geometry.focus.y) * pose.scale;
      return [
        geometry.focus.x +
          pose.x +
          dx * Math.cos(radians) -
          dy * Math.sin(radians),
        geometry.focus.y +
          pose.y +
          dx * Math.sin(radians) +
          dy * Math.cos(radians),
      ];
    });
    for (let row = 0; row <= 24; row++)
      for (let column = 0; column <= 40; column++)
        assert(
          inside((width * column) / 40, (height * row) / 24, polygon),
          `${width}×${height} at ${p}: cloth must cover viewport probe ${column},${row} during swap`,
        );
  }
  assert(
    bridgeBreezePose(0.68, target).opacity > 0.3,
    'the same cloth still passes into sky',
  );
  assert(
    bridgeBreezePose(0.715, target).opacity < 0.3,
    'the sky hold is mostly clear',
  );
  assert(bridgeBreezePose(0.8, target).opacity < 0.02);
  assert.equal(bridgeBreezePose(0.84, target).opacity, 0);
}

// Scroll changes only transforms, opacity and the foreground stacking state.
// Geometry is measured once, never morphed or allocated during the pass.
const writes = [];
class Node {
  attributes = new Map();
  constructor(initial = {}) {
    for (const [name, value] of Object.entries(initial))
      this.attributes.set(name, value);
  }
  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }
  setAttribute(name, value) {
    writes.push(name);
    this.attributes.set(name, value);
  }
  removeAttribute(name) {
    writes.push(name);
    this.attributes.delete(name);
  }
}
const outline = new Node({ d: 'original-outline' });
const luminous = new Node({ d: 'original-luminous', opacity: '0' });
const transfer = new Node({ opacity: '0' });
const folds = Array.from(
  { length: 12 },
  (_, i) =>
    new Node({
      d: `fold-${i}`,
      opacity: String(i % 3 === 0 ? 0.085 : 0.07 + (i % 4) * 0.025),
    }),
);
const threads = Array.from(
  { length: 37 },
  (_, i) => new Node({ d: `thread-${i}` }),
);
const poses = [
  new Node({ 'data-breeze-pose': 'back', transform: 'translate(0 990)' }),
  new Node({ 'data-breeze-pose': 'front', transform: 'translate(0 990)' }),
  new Node({ 'data-breeze-pose': 'near', transform: 'translate(0 990)' }),
];
const svgs = [
  new Node({ viewBox: '0 0 1440 900' }),
  new Node({ viewBox: '0 0 1440 900' }),
];
const root = new Node();
root.dataset = new Proxy(
  {},
  {
    get: (_, key) =>
      root.getAttribute(
        `data-${key.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())}`,
      ),
    set: (_, key, value) => {
      root.setAttribute(
        `data-${key.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())}`,
        value,
      );
      return true;
    },
  },
);
root.querySelector = (selector) =>
  ({
    '[data-breeze-outline]': outline,
    '[data-breeze-luminous]': luminous,
    '[data-breeze-transfer]': transfer,
  })[selector] ?? null;
root.querySelectorAll = (selector) =>
  ({
    '[data-breeze-svg]': svgs,
    '[data-breeze-pose]': poses,
    '[data-breeze-fold]': folds,
    '[data-breeze-thread]': threads,
  })[selector] ?? [];
const all = [
  root,
  outline,
  luminous,
  transfer,
  ...folds,
  ...threads,
  ...poses,
  ...svgs,
];
const initial = all.map((node) => [...node.attributes]);
const renderer = rendererModule.createBreezeRenderer(root);
renderer.measure(1440, 900);
assert.equal(root.dataset.breezeFamily, 'desktop');
const approvedFolds = folds.map((node) => node.getAttribute('opacity'));
for (const p of [0, 0.14, 0.27, 0.295, 0.3, 0.305, 0.33, 0.42, 0.48]) {
  renderer.paint(p, false);
  const { perspective } = frameModule.homeStoryFrame(p);
  const expectedTransform =
    perspective < 0.5 ? 'translate(0 990.00)' : 'translate(0 0.00)';
  for (const node of poses.slice(0, 2)) {
    assert.equal(node.getAttribute('transform'), expectedTransform);
    assert.equal(
      node.getAttribute('opacity'),
      Math.abs(1 - 2 * perspective).toFixed(5),
    );
  }
  assert.equal(transfer.getAttribute('opacity'), '0.00000');
  assert.equal(luminous.getAttribute('opacity'), '0.00000');
  assert.deepEqual(
    folds.map((node) => node.getAttribute('opacity')),
    approvedFolds,
    'PASS 3 does not alter the approved opening/reading cloth material',
  );
}
writes.length = 0;
for (let i = 0; i <= 200; i++) renderer.paint(i / 200, false);
assert(
  !writes.includes('d'),
  'native scroll never morphs the static cloth geometry',
);
assert(
  poses.every((node) => node.getAttribute('opacity') === '0.00000'),
  'Scene 3 remains clear of the cloth',
);
writes.length = 0;
for (const p of [0.84, 0.95, 1]) renderer.paint(p, false);
assert.equal(writes.length, 0, 'final Scene 3 holds without repainting');
renderer.paint(0.48, false);
assert(
  poses.every(
    (node) =>
      node.getAttribute('transform') === 'translate(0 0.00)' &&
      node.getAttribute('opacity') === '1.00000',
  ),
);
assert.equal(luminous.getAttribute('opacity'), '0.00000');
assert.equal(transfer.getAttribute('opacity'), '0.00000');
assert.equal(root.getAttribute('data-breeze-foreground'), 'false');
renderer.paint(0, false);
assert(
  poses.every(
    (node) =>
      node.getAttribute('transform') === 'translate(0 990.00)' &&
      node.getAttribute('opacity') === '1.00000',
  ),
);
renderer.paint(0.3, true);
assert(
  poses.every((node) => node.getAttribute('opacity') === '0.00000'),
  'reduced motion has no foreground cloth pass',
);
renderer.paint(0.64, false);
assert.equal(poses[0].getAttribute('opacity'), '0.00000');
assert.equal(poses[1].getAttribute('opacity'), '0.00000');
assert.equal(poses[2].getAttribute('opacity'), '1.00000');
assert.equal(transfer.getAttribute('opacity'), '1.00000');
assert.equal(luminous.getAttribute('opacity'), '1.00000');
writes.length = 0;
renderer.paint(0.64, false);
assert.equal(
  writes.length,
  0,
  'stopping inside the atmospheric pass produces no additional writes',
);
// TP3D PASS 03: the first stir starts with Scene 2's departure, and the fine
// weave resolves out of focus as the cloth nears the lens, in either direction.
renderer.paint(0.48, false);
assert(
  threads.every((node) => node.getAttribute('opacity') === null),
  'the reading weave keeps its authored attributes',
);
renderer.paint(0.5, false);
assert.notEqual(
  poses[0].getAttribute('transform'),
  'translate(0 0.00)',
  'air stirs the cloth before breezeStart',
);
assert(threads.every((node) => node.getAttribute('opacity') === null));
renderer.paint(0.56, false);
const resolving = Number(threads[0].getAttribute('opacity'));
assert(resolving > 0 && resolving < 1, 'threads resolve during the transfer');
renderer.paint(0.64, false);
assert(
  threads.every((node) => node.getAttribute('opacity') === '0.00000'),
  'no hairline threads while the cloth fills the lens',
);
renderer.paint(0.56, false);
assert.equal(Number(threads[0].getAttribute('opacity')), resolving);
renderer.paint(0.3, false);
assert(
  threads.every((node) => node.getAttribute('opacity') === null),
  'reverse restores the authored weave exactly',
);
const checkpoints = [0.48, 0.52, 0.56, 0.6, 0.64, 0.68, 0.75, 0.84, 1];
const state = () => ({
  poses: poses.map((node) => [
    node.getAttribute('transform'),
    node.getAttribute('opacity'),
  ]),
  density: luminous.getAttribute('opacity'),
  transfer: transfer.getAttribute('opacity'),
  foreground: root.getAttribute('data-breeze-foreground'),
  folds: folds.map((node) => node.getAttribute('opacity')),
  threads: threads.map((node) => node.getAttribute('opacity')),
});
const forwardStates = checkpoints.map((p) => {
  renderer.paint(p, false);
  return state();
});
for (let i = checkpoints.length - 1; i >= 0; i--) {
  renderer.paint(checkpoints[i], false);
  assert.deepEqual(
    state(),
    forwardStates[i],
    'reverse scroll restores the exact cloth pose and material',
  );
}
renderer.measure(390, 844);
assert.equal(root.dataset.breezeFamily, 'mobile');
renderer.paint(0.64, false);
assert.equal(
  transfer.getAttribute('opacity'),
  '0.00000',
  'mobile retains one front projection',
);
assert.equal(poses[1].getAttribute('opacity'), '1.00000');
renderer.destroy();
assert.deepEqual(
  all.map((node) => [...node.attributes]),
  initial,
  'renderer restores every owned attribute on unmount',
);
const rendererSource = readFileSync(
  new URL('../components/home/experience/breeze-renderer.ts', import.meta.url),
  'utf8',
);
assert.doesNotMatch(
  rendererSource,
  /requestAnimationFrame|addEventListener|createElement|setInterval/,
  'atmosphere has no independent scroll owner or clock',
);
console.log(
  'Atmosphere PASS 3 passed: approved opening geometry, one reversible cloth, sampled full swap coverage, reduced/mobile projections, no scroll path mutation or independent clock, clean Scene 3 and complete cleanup.',
);
