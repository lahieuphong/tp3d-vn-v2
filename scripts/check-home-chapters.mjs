/** Owned lifecycle checks for Home Worlds, without simulating browser metrics. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
const source = readFileSync(
  new URL(
    '../components/home/experience/story-world-timeline.ts',
    import.meta.url,
  ),
  'utf8',
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.CommonJS,
  },
});

const mathModule = { exports: {} };
runInNewContext(
  ts.transpileModule(
    readFileSync(
      new URL(
        '../components/home/experience/story-world-frame.ts',
        import.meta.url,
      ),
      'utf8',
    ),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  ).outputText,
  { module: mathModule, exports: mathModule.exports },
);
function browser({ reduced = false, compact = false, missing = false } = {}) {
  const events = [],
    frames = new Map(),
    resizes = [],
    operations = [],
    measurements = [],
    paints = [];
  let sequence = 0;
  class Events {
    listeners = new Map();
    constructor() {
      events.push(this);
    }
    addEventListener(name, fn) {
      if (!this.listeners.has(name)) this.listeners.set(name, new Set());
      this.listeners.get(name).add(fn);
    }
    removeEventListener(name, fn) {
      this.listeners.get(name)?.delete(fn);
    }
    emit(name) {
      for (const fn of this.listeners.get(name) ?? []) fn();
    }
  }
  class Style {
    values = new Map();
    priorities = new Map();
    setProperty(name, value, priority = '') {
      operations.push('write');
      this.values.set(name, value);
      this.priorities.set(name, priority);
    }
    getPropertyValue(name) {
      return this.values.get(name) ?? '';
    }
    getPropertyPriority(name) {
      return this.priorities.get(name) ?? '';
    }
    removeProperty(name) {
      operations.push('write');
      this.values.delete(name);
      this.priorities.delete(name);
    }
    set transform(v) {
      this.setProperty('transform', v);
    }
    get transform() {
      return this.getPropertyValue('transform');
    }
    set opacity(v) {
      this.setProperty('opacity', v);
    }
    get opacity() {
      return this.getPropertyValue('opacity');
    }
  }
  class Node extends Events {
    attrs = new Map();
    inert = false;
    hasAttribute(n) {
      return this.attrs.has(n);
    }
    toggleAttribute(n, enabled) {
      if (enabled) this.setAttribute(n, '');
      else this.removeAttribute(n);
    }
    get offsetHeight() {
      return this.height;
    }
    contains() {
      return false;
    }
    getAttribute(n) {
      return this.attrs.get(n) ?? null;
    }
    setAttribute(n, v) {
      this.attrs.set(n, String(v));
    }
    removeAttribute(n) {
      this.attrs.delete(n);
      if (n.startsWith('data-'))
        delete this.dataset[
          n.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())
        ];
    }
    dataset = {};
    style = new Style();
    constructor(top = 0, height = 900) {
      super();
      this.top = top;
      this.height = height;
    }
    getBoundingClientRect() {
      operations.push('read');
      return {
        top: this.top - window.scrollY,
        height: this.height,
        bottom: this.top - window.scrollY + this.height,
        width: 1440,
        left: 0,
      };
    }
  }
  const window = Object.assign(new Events(), { scrollY: 0, innerHeight: 900 });
  const document = Object.assign(new Events(), {
    hidden: false,
    documentElement: { hasAttribute: () => false },
  });
  const header = new Node(0, 80),
    world = new Node(0, 900),
    root = new Node(0, 3240),
    sequenceNode = new Node(0, 3240),
    track = new Node(990, 2250),
    stage = new Node(0, 900),
    story = new Node(0, 900),
    image = new Node();
  const reveals = Array.from({ length: 11 }, (_, i) => {
    const node = new Node();
    node.dataset.chapterReveal = String(i % 7);
    node.tagName = i % 7 === 0 || i % 7 === 6 ? 'A' : 'SPAN';
    return node;
  });
  const nodes = {
    '[data-story-world-sequence]': sequenceNode,
    '[data-story-world-range]': track,
    '[data-story-world-stage]': stage,
    '.spatial-hero': story,
    '.hc-worlds': world,
  };
  root.querySelector = (s) => (missing ? null : nodes[s]);
  root.querySelectorAll = () => [];
  world.querySelector = () => image;
  world.querySelectorAll = () => reveals;
  header.dataset.opening = 'story';
  document.querySelector = () => header;
  const media = new Map([
    [
      '(prefers-reduced-motion: reduce)',
      Object.assign(new Events(), { matches: reduced }),
    ],
    ['(max-width: 767px)', Object.assign(new Events(), { matches: compact })],
  ]);
  window.matchMedia = (query) => media.get(query);
  class ResizeObserver {
    targets = [];
    disconnected = false;
    constructor(fn) {
      this.fn = fn;
      resizes.push(this);
    }
    observe(node) {
      this.targets.push(node);
    }
    disconnect() {
      this.disconnected = true;
      this.targets = [];
    }
  }
  const loaded = { exports: {} };
  runInNewContext(outputText, {
    module: loaded,
    exports: loaded.exports,
    require: () => mathModule.exports,
    window,
    document,
    ResizeObserver,
    performance: { now: () => ++sequence * 16.7 },
    requestAnimationFrame(fn) {
      const id = ++sequence;
      frames.set(id, fn);
      return id;
    },
    cancelAnimationFrame(id) {
      frames.delete(id);
    },
    // Intentionally no IntersectionObserver or removed-scene elements.
  });
  const breeze = {
    measure: (...args) => measurements.push(args),
    paint: (...args) => paints.push(args),
    destroy: () => {},
  };
  const flush = () => {
    const tasks = [...frames.values()];
    frames.clear();
    tasks.forEach((fn) => fn());
  };
  const scroll = (y) => {
    window.scrollY = y;
    window.emit('scroll');
  };
  const count = () => ({
    frames: frames.size,
    listeners: events.reduce(
      (n, e) => n + [...e.listeners.values()].reduce((a, s) => a + s.size, 0),
      0,
    ),
    observers: resizes.filter((o) => !o.disconnected).length,
  });
  return {
    ...loaded.exports,
    root,
    story,
    world,
    header,
    reveals,
    window,
    document,
    media,
    resizes,
    operations,
    measurements,
    paints,
    breeze,
    flush,
    scroll,
    count,
  };
}

const f = browser();
const dispose = f.createStoryWorldTimeline(f.root, f.breeze);
assert.equal(f.count().frames, 0, 'restored position is applied synchronously');
assert.equal(f.resizes[0].targets.length, 3);
assert.equal(f.world.inert, true);
f.scroll(1100);
f.scroll(1200);
assert.equal(f.count().frames, 1, 'one requested frame for a scroll burst');
const reads = f.measurements.length;
f.flush();
assert.equal(f.measurements.length, reads, 'no layout measurements on scroll');
f.scroll(1597.5);
f.flush();
assert(
  f.reveals.every((n) => Number(n.style.opacity) === 0),
  'UI absent during veil / sky',
);
f.scroll(2070);
f.flush();
assert.equal(f.story.inert, true, 'departed Story cannot receive focus');
assert.equal(f.world.inert, false);
assert.equal(f.reveals[6].inert, true, 'CTA stays inert until its own reveal');
f.scroll(2340);
f.flush();
assert(f.reveals.every((n) => Number(n.style.opacity) === 1 && !n.inert));
assert.equal(f.header.dataset.chapterTheme, 'dark');
// Stillness is a real scroll interval, with no repeated visual style writes.
f.scroll(990 + 1350 * 0.88);
f.flush();
f.operations.length = 0;
for (const progress of [0.89, 0.9, 0.95, 1]) {
  f.scroll(990 + 1350 * progress);
  f.flush();
}
assert.equal(
  f.operations.length,
  0,
  'final hold performs no visual writes or layout reads',
);
assert.equal(f.root.hasAttribute('data-bridge-active'), false);
f.scroll(3240);
f.flush();
assert.equal(f.header.dataset.chapterTheme, 'light');
const positions = [0, 990, 1192, 1395, 1597, 1732, 1867, 2002, 2137, 2340];
const sample = (y) => {
  f.scroll(y);
  f.flush();
  return [
    f.root.dataset.bridgeProgress,
    ...f.reveals.map((n) => n.style.opacity),
  ];
};
assert.deepEqual(
  positions.map(sample),
  positions.toReversed().map(sample).reverse(),
);
f.window.scrollY = 2002;
f.window.emit('pageshow');
assert(
  Number(f.root.dataset.bridgeProgress) > 0.74,
  'bfcache restore synchronizes without waiting',
);
f.media.get('(prefers-reduced-motion: reduce)').matches = true;
f.media.get('(prefers-reduced-motion: reduce)').emit('change');
f.flush();
assert(f.reveals.every((n) => Number(n.style.opacity) === 1 && !n.inert));
assert.equal(f.story.inert, false);
assert.equal(f.world.inert, false);
f.operations.length = 0;
f.window.emit('resize');
f.flush();
const firstWrite = f.operations.indexOf('write');
assert(
  !f.operations.slice(firstWrite).includes('read'),
  'layout reads precede writes',
);
f.document.hidden = true;
f.document.emit('visibilitychange');
f.scroll(1500);
assert.equal(f.count().frames, 0);
f.document.hidden = false;
f.document.emit('visibilitychange');
f.flush();
dispose();
dispose();
assert.deepEqual(f.count(), { frames: 0, listeners: 0, observers: 0 });
for (let i = 0; i < 30; i++) {
  const b = browser({ reduced: i % 2 === 0 });
  const destroy = b.createStoryWorldTimeline(b.root, b.breeze);
  for (const y of positions) {
    b.scroll(y);
    b.flush();
  }
  b.window.emit('resize');
  destroy();
  assert.deepEqual(b.count(), { frames: 0, listeners: 0, observers: 0 });
}
const missing = browser({ missing: true });
missing.createStoryWorldTimeline(missing.root)();
assert.deepEqual(missing.count(), { frames: 0, listeners: 0, observers: 0 });
const { storyWorldFrame, worldContentReveal, settleCamera } =
  mathModule.exports;
for (const [w, h] of [
  [320, 568],
  [375, 812],
  [390, 844],
  [430, 932],
  [768, 1024],
  [820, 1180],
  [1024, 768],
  [1440, 900],
  [1728, 1117],
  [1920, 1080],
  [2560, 1440],
]) {
  const samples = [];
  for (let i = 0; i <= 100; i++) {
    const frame = storyWorldFrame(i / 100, w, h);
    samples.push(frame);
    for (const value of Object.values(frame))
      if (typeof value === 'number') assert(Number.isFinite(value));
    // The covered plate must span every viewport edge even while translated.
    const upper = frame.imageY + frame.originY * (1 - frame.scale);
    const lower = upper + h * frame.scale;
    assert(upper <= 0.01 && lower >= h - 0.01, 'full-frame image coverage');
  }
  assert.deepEqual(
    samples,
    Array.from({ length: 101 }, (_, i) =>
      storyWorldFrame((100 - i) / 100, w, h),
    ).reverse(),
  );
  assert.equal(storyWorldFrame(0.16, w, h).textOpacity, 1, 'reading hold');
  assert.equal(
    storyWorldFrame(0.32, w, h).textOpacity,
    0.7,
    'restrained departure',
  );
  assert.equal(storyWorldFrame(0.55, w, h).textOpacity, 0);
  assert.equal(storyWorldFrame(0.55, w, h).skyVisible, true);
  assert.equal(storyWorldFrame(0.84, w, h).scale, 1);
  assert.equal(storyWorldFrame(0.84, w, h).imageY, 0);
  assert.equal(
    storyWorldFrame(0.64, w, h).dissolve,
    1,
    'Breeze finishes before UI appears',
  );
  for (let order = 0; order < 7; order++) {
    assert.equal(worldContentReveal(0.74, order), 0);
    assert.equal(worldContentReveal(0.88, order), 1);
  }
  const { progress: _ignored, ...settled } = storyWorldFrame(0.88, w, h);
  for (const p of [0.88, 0.9, 0.95, 1]) {
    const { progress: _ignored, ...held } = storyWorldFrame(p, w, h);
    assert.deepEqual(
      held,
      settled,
      'camera, exposure and cloth remain completely still',
    );
  }
}
// Only architecture may trail input, with bounded residual and no idle loop.
const cameraTarget = { storyScale: 1.05, storyY: -10, scale: 1.2, imageY: 8 };
let previous = { storyScale: 1, storyY: 0, scale: 4.8, imageY: 300 };
let remaining = true;
for (let i = 0; i < 12; i++) {
  const result = settleCamera(cameraTarget, previous, 16.7, 1);
  assert(Math.abs(result.pose.scale - cameraTarget.scale) <= 0.0025);
  assert(Math.abs(result.pose.imageY - cameraTarget.imageY) <= 2);
  previous = result.pose;
  remaining = result.moving;
}
assert.equal(remaining, false, 'micro inertia finishes within 200ms');
assert.deepEqual(
  { ...settleCamera(cameraTarget, previous, 16.7, 0).pose },
  cameraTarget,
);
const gated = browser();
const clearGated = gated.createStoryWorldTimeline(gated.root, gated.breeze);
for (const p of [0.75, 0.8, 0.85]) {
  gated.scroll(990 + 1350 * p);
  gated.flush();
  assert(
    gated.reveals.filter((n) => n.tagName === 'A').every((n) => n.inert),
    'moving links remain inert',
  );
}
gated.scroll(990 + 1350 * 0.9);
gated.flush();
assert(gated.reveals.every((n) => !n.inert));
clearGated();
assert.doesNotMatch(
  source,
  /preventDefault|setState|wheel|setInterval|pointermove/,
);
console.log(
  'StoryWorldBridge passed: image coverage, read hold, focus gating, reverse scroll, synchronous restore, reduced motion, cached layout, hidden-tab inactivity and 30 cleanups. Browser performance is measured separately.',
);
