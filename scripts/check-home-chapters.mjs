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
  class Node {
    dataset = {};
    style = new Style();
    constructor(top = 0, height = 900) {
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
  const document = Object.assign(new Events(), { hidden: false });
  const header = new Node(0, 80),
    world = new Node(1746, 900),
    root = new Node(0, 2646);
  const reveals = Array.from({ length: 8 }, () => new Node());
  root.querySelector = (selector) => {
    assert.equal(selector, '[data-home-chapter="worlds"]');
    return missing ? null : world;
  };
  world.querySelectorAll = (selector) => {
    assert.equal(selector, '[data-chapter-reveal]');
    return reveals;
  };
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
const geometry = { top: 1746, height: 900 };
assert.equal(f.chapterFrame(geometry, 846, 900, 80).entry, 0);
assert.equal(f.chapterFrame(geometry, 1161, 900, 80).entry, 1);
assert.equal(f.chapterHeaderTheme(geometry, 1700, 80, 900), null);
assert.equal(f.chapterHeaderTheme(geometry, 1746, 108, 1440), 'dark');
assert.equal(f.chapterHeaderTheme(geometry, 2565, 80, 900), 'dark');
assert.equal(f.chapterHeaderTheme(geometry, 2566, 80, 900), 'light');
const destroy = f.mountHomeChapters(f.root, f.breeze);
assert.equal(f.count().frames, 0, 'mount leaves no idle animation');
assert.equal(
  f.resizes[0].targets.length,
  3,
  'only owner, Worlds and header are observed',
);
assert.equal(
  f.measurements[0][2].top,
  1746,
  'Breeze receives the actual Worlds anchor',
);
f.scroll(1200);
f.scroll(1250);
f.scroll(1300);
assert.equal(f.count().frames, 1, 'native events coalesce');
const measured = f.measurements.length;
f.flush();
assert.equal(f.measurements.length, measured, 'scroll reuses cached bounds');
assert(
  f.reveals.every((n) => n.style.opacity === '1.0000'),
  'all eight atrium reveals settle early',
);
f.scroll(1750);
f.flush();
assert.equal(f.header.dataset.chapterTheme, 'dark');
f.scroll(2566);
f.flush();
assert.equal(f.header.dataset.chapterTheme, 'light', 'footer has dark ink');
f.scroll(0);
f.flush();
assert.equal(f.header.dataset.chapterTheme, undefined);
assert.equal(
  f.header.dataset.opening,
  'story',
  'opening theme state stays owned by opening',
);
const positions = [900, 1050, 1200, 1746, 2100, 2646];
const sample = (y) => {
  f.scroll(y);
  f.flush();
  return f.reveals.map((n) => [n.style.transform, n.style.opacity]);
};
assert.deepEqual(
  positions.map(sample),
  positions.toReversed().map(sample).reverse(),
  'scroll is exactly reversible',
);
f.scroll(1746);
f.flush();
f.media.get('(prefers-reduced-motion: reduce)').matches = true;
f.media.get('(prefers-reduced-motion: reduce)').emit('change');
f.flush();
assert(f.reveals.every((n) => !n.style.transform && !n.style.opacity));
f.operations.length = 0;
f.window.emit('resize');
f.resizes[0].fn();
f.flush();
const write = f.operations.indexOf('write');
assert(
  write < 0 || !f.operations.slice(write).includes('read'),
  'all reads precede style writes',
);
f.document.hidden = true;
f.document.emit('visibilitychange');
f.scroll(2000);
f.window.emit('resize');
assert.equal(f.count().frames, 0, 'hidden document does not animate');
f.document.hidden = false;
f.document.emit('visibilitychange');
f.flush();
f.scroll(1900);
destroy();
destroy();
assert.deepEqual(f.count(), { frames: 0, listeners: 0, observers: 0 });
assert.equal(f.header.dataset.chapterTheme, undefined);
for (let cycle = 0; cycle < 30; cycle++) {
  const b = browser({ reduced: cycle % 2 === 0, compact: cycle % 3 === 0 });
  b.reveals[0].style.setProperty('opacity', '.91', 'important');
  const dispose = b.mountHomeChapters(b.root, b.breeze);
  for (const y of [0, 950, 1300, 1746, 2200, 2646, 3000, 1746, 0]) {
    b.scroll(y);
    b.flush();
  }
  b.window.emit('resize');
  dispose();
  assert.deepEqual(
    b.count(),
    { frames: 0, listeners: 0, observers: 0 },
    `navigation cycle ${cycle}`,
  );
  assert.equal(b.reveals[0].style.opacity, '.91');
  assert.equal(b.reveals[0].style.getPropertyPriority('opacity'), 'important');
  assert.equal(b.world.dataset.phase, undefined);
  assert.equal(b.world.dataset.progress, undefined);
}
const missing = browser({ missing: true });
missing.mountHomeChapters(missing.root)();
assert.deepEqual(missing.count(), { frames: 0, listeners: 0, observers: 0 });
console.log(
  'Home Worlds passed: one scene, no removed targets/IntersectionObserver, early reveals, footer theme, reverse scroll, resize, reduced motion, hidden-tab inactivity and 30 navigation cleanup cycles. No browser metrics claimed.',
);
