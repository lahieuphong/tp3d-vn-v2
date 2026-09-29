/** Owned lifecycle checks for Home Worlds, without simulating browser metrics. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
const source = readFileSync(
  new URL('../components/home/experience/chapter-motion.ts', import.meta.url),
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
        '../components/home/experience/sky-portal-frame.ts',
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
    world = new Node(990, 900),
    root = new Node(0, 2826),
    track = new Node(990, 1836),
    marker = new Node(),
    image = new Node();
  marker.offsetHeight = 720;
  const reveals = Array.from({ length: 9 }, (_, i) => {
    const node = new Node();
    node.dataset.chapterReveal = String(i < 4 ? 0 : i - 3);
    return node;
  });
  root.querySelector = (s) =>
    missing ? null : s === '[data-sky-track]' ? track : world;
  root.querySelectorAll = () => [];
  track.querySelector = () => marker;
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
const dispose = f.mountHomeChapters(f.root, f.breeze);
assert.equal(f.count().frames, 0);
assert.equal(f.resizes[0].targets.length, 4);
assert.equal(f.world.inert, true, 'clipped links are not keyboard targets');
f.scroll(1100);
f.scroll(1200);
assert.equal(f.count().frames, 1);
const reads = f.measurements.length;
f.flush();
assert.equal(f.measurements.length, reads);
f.scroll(1350);
f.flush();
assert(
  f.reveals.every((n) => Number(n.style.opacity) === 0),
  'no UI over small aperture',
);
f.scroll(1710);
f.flush();
assert(f.reveals.every((n) => Number(n.style.opacity) === 1));
assert.equal(f.world.inert, false);
assert.equal(f.header.dataset.chapterTheme, 'dark');
f.scroll(2826);
f.flush();
assert.equal(f.header.dataset.chapterTheme, 'light');
const positions = [0, 990, 1170, 1350, 1530, 1710, 1900, 2826];
const sample = (y) => {
  f.scroll(y);
  f.flush();
  return [f.root.dataset.skyProgress, ...f.reveals.map((n) => n.style.opacity)];
};
assert.deepEqual(
  positions.map(sample),
  positions.toReversed().map(sample).reverse(),
);
f.media.get('(prefers-reduced-motion: reduce)').matches = true;
f.media.get('(prefers-reduced-motion: reduce)').emit('change');
f.flush();
assert(f.reveals.every((n) => Number(n.style.opacity) === 1));
assert.equal(f.world.inert, false);
f.operations.length = 0;
f.window.emit('resize');
f.flush();
const firstWrite = f.operations.indexOf('write');
assert(
  !f.operations.slice(firstWrite).includes('read'),
  'bounds precede style writes',
);
f.document.hidden = true;
f.document.emit('visibilitychange');
f.scroll(1300);
assert.equal(f.count().frames, 0);
f.document.hidden = false;
f.document.emit('visibilitychange');
f.flush();
dispose();
dispose();
assert.deepEqual(f.count(), { frames: 0, listeners: 0, observers: 0 });
for (let i = 0; i < 30; i++) {
  const b = browser({ reduced: i % 2 === 0 });
  const destroy = b.mountHomeChapters(b.root, b.breeze);
  for (const y of positions) {
    b.scroll(y);
    b.flush();
  }
  b.window.emit('resize');
  destroy();
  assert.deepEqual(b.count(), { frames: 0, listeners: 0, observers: 0 });
}
const missing = browser({ missing: true });
missing.mountHomeChapters(missing.root)();
assert.deepEqual(missing.count(), { frames: 0, listeners: 0, observers: 0 });
const { skyPortalFrame, skyContentReveal } = mathModule.exports;
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
  for (let i = 0; i <= 100; i++) {
    const frame = skyPortalFrame(i / 100, w, h);
    for (const value of Object.values(frame))
      if (typeof value === 'number') assert(Number.isFinite(value));
    assert(
      frame.imageY - (frame.scale - 1) * h * 0.115 <=
        Math.max(0, frame.centerY - frame.ry) + 0.001,
      'image covers aperture top',
    );
  }
  assert.equal(skyPortalFrame(0.3, w, h).departure, 0);
  assert.equal(skyPortalFrame(0.6, w, h).departure, 1);
  assert.equal(skyPortalFrame(1, w, h).scale, 1);
  assert.equal(skyPortalFrame(1, w, h).imageY, 0);
  for (let order = 0; order <= 5; order++) {
    assert.equal(skyContentReveal(0.7, order), 0);
    assert.equal(skyContentReveal(1, order), 1);
  }
}
console.log(
  'Sky Portal passed: finite responsive masks, photo coverage, late UI, native/reverse scroll, focus gating, reduced motion, read/write ordering and 30 cleanup cycles. No browser FPS claims.',
);
