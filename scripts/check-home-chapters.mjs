/** Owned lifecycle checks for Home Worlds, without simulating browser metrics. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
const source = readFileSync(
  new URL(
    '../components/home/experience/home-story-timeline.ts',
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
        '../components/home/experience/home-story-frame.ts',
        import.meta.url,
      ),
      'utf8',
    ),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  ).outputText,
  { module: mathModule, exports: mathModule.exports },
);
function browser({
  reduced = false,
  width = 1440,
  missing = false,
  bridge = 'ready',
} = {}) {
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
    emit(name, event) {
      for (const fn of this.listeners.get(name) ?? []) fn(event);
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
    classList = {
      contains: (name) =>
        name === 'hc-atrium-room-link' && this.tagName === 'A',
    };
    querySelector() {
      return null;
    }
    querySelectorAll() {
      return [];
    }
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
        width,
        left: 0,
      };
    }
  }
  const window = Object.assign(new Events(), { scrollY: 0, innerHeight: 900 });
  window.scrollTo = ({ top }) => {
    window.scrollY = top;
  };
  const document = Object.assign(new Events(), {
    hidden: false,
    documentElement: new Node(),
    readyState: 'complete',
  });
  const header = new Node(0, 80),
    world = new Node(0, 900),
    root = new Node(0, 3240),
    sequenceNode = new Node(0, 3240),
    stage = new Node(0, 900),
    story = new Node(0, 900),
    image = new Node();
  const reveals = Array.from({ length: 11 }, (_, i) => {
    const node = new Node();
    node.dataset.chapterReveal = String(Math.min(i, 9));
    node.tagName = i < 4 || i === 9 ? 'A' : 'SPAN';
    return node;
  });
  const nodes = {
    '[data-home-story]': sequenceNode,
    '[data-home-story-stage]': stage,
    '.spatial-hero': story,
    '.hc-worlds': world,
  };
  root.querySelector = (s) => (missing ? null : nodes[s]);
  root.querySelectorAll = () => [];
  const openingNodes = Object.fromEntries(
    Object.keys(mathModule.exports.arrivalFrame(0, width, true)).map((k) => [
      k,
      new Node(),
    ]),
  );
  const discovery = new Node(),
    portalGroup = new Node(),
    portals = Array.from({ length: 4 }, () => new Node());
  const secondary = new Node();
  secondary.dataset = {
    src: '/b.webp',
    srcset: '/b-720.webp 720w',
    sizes: '100vw',
  };
  secondary.complete = false;
  secondary.naturalWidth = 0;
  secondary.decode = () => Promise.resolve();
  story.querySelector = (s) =>
    s === '.sh-discovery'
      ? discovery
      : s === '.sh-portals'
        ? portalGroup
        : s === 'img[data-hero-deferred]'
          ? secondary
          : (openingNodes[s] ?? null);
  story.querySelectorAll = (s) => (s === '.sh-portal' ? portals : []);

  world.querySelector = () => image;
  world.querySelectorAll = () => reveals;
  header.dataset.opening = 'story';
  document.querySelector = () => header;
  const media = new Map([
    [
      '(prefers-reduced-motion: reduce)',
      Object.assign(new Events(), { matches: reduced }),
    ],
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
  const bridgeCallbacks = {};
  const bridgeLifecycle = { prepared: 0, disposed: 0 };
  const prepareBridgeImage = (owner, plate, callbacks) => {
    assert.equal(owner, sequenceNode, 'preload observes the story owner');
    assert.equal(plate, image, 'preload reuses the existing responsive image');
    bridgeLifecycle.prepared++;
    Object.assign(bridgeCallbacks, callbacks);
    if (bridge === 'ready') callbacks.ready();
    if (bridge === 'failed') callbacks.failed();
    let disposed = false;
    return () => {
      if (!disposed) bridgeLifecycle.disposed++;
      disposed = true;
    };
  };
  const loaded = { exports: {} };
  runInNewContext(outputText, {
    module: loaded,
    exports: loaded.exports,
    require(path) {
      if (path === './home-story-frame') return mathModule.exports;
      assert.equal(path, './bridge-image');
      return { prepareBridgeImage };
    },
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
    // The image preparation lifecycle is isolated in check-bridge-image.mjs.
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
    portals,
    openingNodes,
    secondary,
    bridgeCallbacks,
    bridgeLifecycle,
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
const dispose = f.createHomeStoryTimeline(f.root, f.breeze);
// The master applies restoration immediately; two one-shot paints defer Scene B.
assert.equal(f.root.dataset.storyProgress, '0.00000');
f.flush();
f.flush();
assert.equal(f.secondary.src, '/b.webp');
assert.equal(f.count().frames, 0);
assert.equal(f.window.listeners.get('scroll').size, 1, 'one scroll owner');
assert.equal(f.resizes.length, 1, 'one geometry observer');
assert.equal(f.world.inert, true);
const at = (p) => {
  f.scroll(p * 2340);
  f.flush();
};
f.scroll(500);
f.scroll(600);
assert.equal(f.count().frames, 1, 'coalesce input bursts');
const reads = f.measurements.length;
f.flush();
assert.equal(f.measurements.length, reads, 'no per-scroll geometry reads');
at(0.63);
assert(
  f.reveals.every((n) => Number(n.style.opacity) === 0),
  'sky has no Worlds UI',
);
assert.equal(f.story.inert, true);
at(0.84);
assert.equal(f.world.inert, false);
assert(
  f.reveals.filter((n) => n.tagName === 'A').every((n) => n.inert),
  'moving targets remain inert',
);
at(0.925);
assert(f.reveals.every((n) => Number(n.style.opacity) === 1 && !n.inert));
assert.equal(f.header.dataset.chapterTheme, 'dark');
f.operations.length = 0;
for (const p of [0.92, 0.95, 1]) at(p);
assert.equal(
  f.operations.length,
  0,
  'final 8% performs no visual writes or reads',
);
assert.equal(f.root.hasAttribute('data-story-active'), false);
at(0.95);
f.world.emit('focusin', { target: f.reveals[1] });
// Native focus can scroll toward an absolute child's unpinned layout position.
f.scroll(2340 * 0.878);
f.flush();
assert.equal(f.root.dataset.storyProgress, '0.95000');
assert.equal(
  f.reveals[1].inert,
  false,
  'Tab focus keeps the visible link usable',
);
at(0.63);
assert.equal(
  f.root.dataset.storyProgress,
  '0.63000',
  'subsequent native scroll is unchanged',
);
f.scroll(3240);
f.flush();
assert.equal(f.header.dataset.chapterTheme, 'light');
const positions = [
  0, 0.16, 0.23, 0.3, 0.34, 0.45, 0.52, 0.58, 0.63, 0.69, 0.8, 0.9, 1,
];
const sample = (p) => {
  at(p);
  return [
    f.root.dataset.storyProgress,
    ...f.reveals.map((n) => n.style.opacity),
    ...f.portals.map((n) => n.style.opacity),
  ];
};
assert.deepEqual(
  positions.map(sample),
  positions.toReversed().map(sample).reverse(),
);
at(0.1);
assert(f.portals.every((n) => !n.inert));
at(0.245);
assert(
  f.portals.every((n) => n.inert),
  'departing portals leave tab order',
);
at(0.4);
assert.equal(f.openingNodes['.sh-story'].inert, false);
f.window.scrollY = 2340 * 0.63;
f.window.emit('pageshow');
assert.equal(
  f.root.dataset.storyProgress,
  '0.63000',
  'synchronous history restoration',
);
f.document.documentElement.setAttribute('data-home-intro', 'waiting');
at(0.8);
assert.equal(
  f.root.dataset.storyProgress,
  '0.00000',
  'intro gates the entire narrative',
);
f.document.documentElement.removeAttribute('data-home-intro');
at(0.8);
assert.equal(f.root.dataset.storyProgress, '0.80000');
f.media.get('(prefers-reduced-motion: reduce)').matches = true;
f.media.get('(prefers-reduced-motion: reduce)').emit('change');
f.flush();
assert(f.reveals.every((n) => Number(n.style.opacity) === 1 && !n.inert));
assert(f.portals.every((n) => !n.inert));
assert.equal(f.story.inert, false);
assert.equal(f.world.inert, false);
assert.equal(f.openingNodes['.sh-monogram'].style.transform, '');
f.operations.length = 0;
f.window.emit('resize');
f.flush();
const firstWrite = f.operations.indexOf('write');
assert(
  !f.operations.slice(firstWrite).includes('read'),
  'measure before paint',
);
f.document.hidden = true;
f.document.emit('visibilitychange');
f.scroll(1500);
assert.equal(f.count().frames, 0, 'hidden tab sleeps');
f.document.hidden = false;
f.document.emit('visibilitychange');
f.flush();
dispose();
dispose();
assert.deepEqual(f.count(), { frames: 0, listeners: 0, observers: 0 });
assert.deepEqual(f.bridgeLifecycle, { prepared: 1, disposed: 1 });
for (let i = 0; i < 30; i++) {
  const b = browser({ reduced: i % 2 === 0, width: i % 3 === 0 ? 390 : 1440 });
  const stop = b.createHomeStoryTimeline(b.root, b.breeze);
  b.flush();
  b.flush();
  for (const p of positions) {
    b.scroll(p * 2340);
    b.flush();
  }
  b.window.emit('resize');
  stop();
  assert.deepEqual(b.count(), { frames: 0, listeners: 0, observers: 0 });
  assert.deepEqual(b.bridgeLifecycle, { prepared: 1, disposed: 1 });
}
const missing = browser({ missing: true });
missing.createHomeStoryTimeline(missing.root)();
assert.deepEqual(missing.count(), { frames: 0, listeners: 0, observers: 0 });
const early = browser();
early.createHomeStoryTimeline(early.root, early.breeze)();
early.flush();
assert.equal(
  early.secondary.src,
  undefined,
  'unmount cancels deferred image request',
);
const pending = browser({ bridge: 'pending' });
const stopPending = pending.createHomeStoryTimeline(
  pending.root,
  pending.breeze,
);
pending.flush();
pending.flush();
pending.scroll(2340 * 0.4);
pending.flush();
assert.equal(
  pending.root.dataset.cameraProgress,
  '0.40000',
  'pending bridge imagery never delays the opening chapters',
);
pending.scroll(2340 * 0.75);
pending.flush();
assert.equal(
  pending.root.dataset.storyProgress,
  '0.75000',
  'asset preparation does not hijack native scroll',
);
assert.equal(
  pending.root.dataset.cameraProgress,
  '0.48000',
  'camera waits at the reading hold for the decoded plate',
);
assert.equal(
  pending.story.inert,
  false,
  'readable Scene 2 remains accessible while the image is pending',
);
assert(
  pending.reveals.every(
    (node) => Number(node.style.opacity) === 0 && node.inert,
  ),
);
assert.equal(
  pending.paints.at(-1)[0],
  0.48,
  'Breeze waits with the same camera progress',
);
pending.window.emit('pageshow');
assert.equal(
  pending.root.dataset.cameraProgress,
  '0.48000',
  'restoration respects image readiness before the next paint',
);
pending.bridgeCallbacks.ready();
pending.flush();
assert.equal(pending.root.dataset.bridgeImage, 'ready');
assert.equal(
  pending.root.dataset.cameraProgress,
  '0.75000',
  'decoded plate resumes at the actual scroll position',
);
pending.scroll(2340 * 0.95);
pending.flush();
assert(pending.reveals.every((node) => !node.inert));
stopPending();
assert.deepEqual(pending.count(), { frames: 0, listeners: 0, observers: 0 });
assert.deepEqual(pending.bridgeLifecycle, { prepared: 1, disposed: 1 });

const failed = browser({ bridge: 'failed' });
const stopFailed = failed.createHomeStoryTimeline(failed.root, failed.breeze);
failed.flush();
failed.flush();
failed.scroll(2340 * 0.95);
failed.flush();
assert.equal(
  failed.root.dataset.bridgeImage,
  'failed',
  'failed image selects the honest non-image fallback',
);
assert.equal(failed.root.dataset.cameraProgress, '0.95000');
assert(
  failed.reveals.every(
    (node) => Number(node.style.opacity) === 1 && !node.inert,
  ),
  'failed imagery never blocks final navigation',
);
stopFailed();
assert.deepEqual(failed.count(), { frames: 0, listeners: 0, observers: 0 });

const pendingReduced = browser({ bridge: 'pending', reduced: true });
const stopReduced = pendingReduced.createHomeStoryTimeline(
  pendingReduced.root,
  pendingReduced.breeze,
);
pendingReduced.scroll(2340 * 0.95);
pendingReduced.flush();
assert(
  pendingReduced.reveals.every((node) => !node.inert),
  'reduced motion content remains usable while an image loads',
);
stopReduced();
const { homeStoryFrame, worldContentReveal, settleCamera } = mathModule.exports;
for (const [w, h] of [
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
]) {
  const frames = [];
  for (let i = 0; i <= 200; i++) {
    const frame = homeStoryFrame(i / 200, w, h);
    frames.push(frame);
    for (const value of Object.values(frame))
      if (typeof value === 'number') assert(Number.isFinite(value));
    const upper = frame.imageY + frame.originY * (1 - frame.scale);
    assert(
      upper <= 0.01 && upper + h * frame.scale >= h - 0.01,
      'viewport remains covered',
    );
    if (w < 1200) assert.equal(frame.inertia, 0, 'no mobile or tablet inertia');
  }
  assert.deepEqual(
    frames,
    Array.from({ length: 201 }, (_, i) =>
      homeStoryFrame((200 - i) / 200, w, h),
    ).reverse(),
  );
  assert.equal(
    homeStoryFrame(0.48, w, h).textOpacity,
    1,
    'Philosophy reading hold',
  );
  assert.equal(homeStoryFrame(0.6, w, h).textOpacity, 0);
  assert.equal(homeStoryFrame(0.67, w, h).dissolve, 1);
  const voidEnd = w < 768 ? 0.69 : 0.705;
  const skyStart = homeStoryFrame(0.61, w, h);
  const skyEnd = homeStoryFrame(voidEnd, w, h);
  assert(skyStart.scale > skyEnd.scale, 'sky has a slow scroll-driven advance');
  assert(
    skyStart.scale / skyEnd.scale <= 1.019,
    'void drift remains restrained',
  );
  for (const p of [0.61, 0.65, 0.67, voidEnd]) {
    const sky = homeStoryFrame(p, w, h);
    assert.equal(sky.textOpacity, 0);
    assert.equal(sky.tpOpacity, 0);
    assert.equal(sky.storyVisible, false);
    assert.equal(sky.skyVisible, true);
    assert.equal(sky.railOpacity, 0);
    assert.equal(sky.skyEdge, 145, 'full sky has no visible reveal edge');
    for (let order = 0; order < 10; order++)
      assert.equal(
        worldContentReveal(p, order),
        0,
        'void has no large copy or controls',
      );
  }
  assert.equal(homeStoryFrame(w < 768 ? 0.885 : 0.895, w, h).scale, 1);
  for (let order = 0; order < 10; order++) {
    assert.equal(worldContentReveal(0.825, order), 0);
    assert.equal(worldContentReveal(0.92, order), 1);
  }
  assert(worldContentReveal(0.846, 0) > worldContentReveal(0.846, 1));
  assert(worldContentReveal(0.846, 1) > worldContentReveal(0.846, 2));
  assert.equal(
    worldContentReveal(0.846, 3),
    0,
    'rooms follow architectural order',
  );
  const { progress: _ignored, ...end } = homeStoryFrame(0.92, w, h);
  for (const p of [0.92, 0.95, 1]) {
    const { progress: _ignored, ...held } = homeStoryFrame(p, w, h);
    assert.deepEqual(held, end);
  }
}
const target = { storyScale: 1.05, storyY: -10, scale: 1.2, imageY: 8 };
let previous = { storyScale: 1, storyY: 0, scale: 4.8, imageY: 300 },
  moving = true;
for (let i = 0; i < 12; i++) {
  const result = settleCamera(target, previous, 16.7, 1);
  assert(Math.abs(result.pose.scale - target.scale) <= 0.0025);
  assert(Math.abs(result.pose.imageY - target.imageY) <= 2);
  previous = result.pose;
  moving = result.moving;
}
assert.equal(moving, false, 'bounded inertia settles within 200ms');
assert.doesNotMatch(
  source,
  /preventDefault\s*\(|setState\s*\(|setInterval\s*\(|addEventListener\(\s*['"](?:wheel|pointermove)['"]/,
);
console.log(
  'HomeStory passed: one owner, reverse story, decoded-image gate/fallback, responsive sky coverage, void/UI order, focus/restoration, stillness, reduced motion, desktop-only inertia and 30 cleanups.',
);
