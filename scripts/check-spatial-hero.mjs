/** Controller ownership and scroll mathematics. These tests do not claim to
 * measure browser rendering, GPU memory, RAM or presented-frame FPS. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
const source = readFileSync(
  new URL('../components/home/hero/hero-timeline.ts', import.meta.url),
  'utf8',
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
});
function environment({ reduced = false, compact = false } = {}) {
  const frames = new Map(),
    targets = [],
    observers = [];
  let sequence = 0,
    reads = 0;
  class Events {
    listeners = new Map();
    constructor() {
      targets.push(this);
    }
    addEventListener(type, callback) {
      if (!this.listeners.has(type)) this.listeners.set(type, new Set());
      this.listeners.get(type).add(callback);
    }
    removeEventListener(type, callback) {
      this.listeners.get(type)?.delete(callback);
    }
    dispatch(type) {
      for (const callback of this.listeners.get(type) ?? []) callback();
    }
  }
  class Node extends Events {
    dataset = {};
    attrs = new Map();
    children = new Map();
    inert = false;
    style = {
      setProperty(property, value) {
        this[property] = value;
      },
      removeProperty(property) {
        if (property.startsWith('--')) {
          delete this[property];
          return;
        }
        delete this[property.replace(/-([a-z])/g, (_, c) => c.toUpperCase())];
      },
    };
    offsetHeight = 900;
    setAttribute(key, value) {
      this.attrs.set(key, value);
    }
    getAttribute(key) {
      return this.attrs.get(key) ?? null;
    }
    querySelector(selector) {
      return this.children.get(selector) ?? null;
    }
    contains(node) {
      return node === this;
    }
    getBoundingClientRect() {
      reads++;
      return { top: -window.scrollY, height: 1890 };
    }
  }
  const document = new Events();
  document.hidden = false;
  document.activeElement = null;
  document.documentElement = new Node();
  const window = new Events();
  window.scrollY = 0;
  const media = new Map([
    [
      '(prefers-reduced-motion: reduce)',
      Object.assign(new Events(), { matches: reduced }),
    ],
    ['(max-width: 1199px)', Object.assign(new Events(), { matches: compact })],
  ]);
  window.matchMedia = (query) => media.get(query);
  const hero = new Node(),
    header = new Node(),
    image = new Node();
  document.querySelector = () => header;
  image.dataset = {
    src: '/b.webp',
    srcset: '/b-720.webp 720w',
    sizes: '100vw',
  };
  image.complete = false;
  image.naturalWidth = 0;
  image.decode = () => Promise.resolve();
  Object.defineProperty(image, 'src', {
    set(value) {
      this.attrs.set('src', value);
    },
  });
  hero.children.set('img[data-hero-deferred]', image);
  hero.children.set('.sh-plane', new Node());
  hero.children.set('.sh-discovery', new Node());
  class ResizeObserver {
    active = true;
    constructor(callback) {
      this.callback = callback;
      observers.push(this);
    }
    observe() {}
    disconnect() {
      this.active = false;
    }
  }
  const loaded = { exports: {} };
  runInNewContext(outputText, {
    module: loaded,
    exports: loaded.exports,
    window,
    document,
    ResizeObserver,
    requestAnimationFrame: (cb) => {
      const id = ++sequence;
      frames.set(id, cb);
      return id;
    },
    cancelAnimationFrame: (id) => frames.delete(id),
  });
  for (const selector of Object.keys(
    loaded.exports.spatialFrame(0, false, false),
  ))
    hero.children.set(selector, new Node());
  const tick = () => {
    const pending = [...frames.values()];
    frames.clear();
    pending.forEach((cb) => cb());
  };
  const flush = () => {
    for (let i = 0; i < 4; i++) tick();
  };
  const resources = () => ({
    frames: frames.size,
    observers: observers.filter((x) => x.active).length,
    listeners: targets.reduce(
      (sum, target) =>
        sum +
        [...target.listeners.values()].reduce((a, set) => a + set.size, 0),
      0,
    ),
  });
  const scroll = (p) => {
    window.scrollY = p * 990;
    window.dispatch('scroll');
    tick();
  };
  return {
    ...loaded.exports,
    hero,
    header,
    image,
    window,
    document,
    media,
    tick,
    flush,
    frames,
    resources,
    scroll,
    reads: () => reads,
  };
}
const f = environment();
assert.equal(f.spatialPhase(0), 'discovery');
assert.equal(f.spatialPhase(0.5), 'transition');
assert.equal(f.spatialPhase(1), 'story');
assert.equal(f.clampProgress(-1), 0);
assert.equal(f.clampProgress(2), 1);
for (const compact of [false, true]) {
  const snapshots = new Map();
  for (let i = 0; i <= 100; i++) {
    const p = i / 100,
      frame = f.spatialFrame(p, compact, true);
    snapshots.set(i, JSON.stringify(frame));
    assert.ok(
      Math.abs(
        Number(frame['[data-hero-layer="architecture-a"]'].opacity) +
          Number(frame['[data-hero-layer="architecture-b"]'].opacity) -
          1,
      ) < 0.0001,
      'no empty architecture gap',
    );
    assert.equal(
      frame['.sh-monogram'].opacity,
      undefined,
      'one persistent TP never crossfades',
    );
  }
  for (let i = 100; i >= 0; i--)
    assert.equal(
      JSON.stringify(f.spatialFrame(i / 100, compact, true)),
      snapshots.get(i),
      'reverse scroll exactly retraces frames',
    );
  assert.equal(
    f.spatialFrame(0.25, compact, true)['.sh-portals'].opacity,
    '1.00000',
  );
  assert.equal(
    f.spatialFrame(0.5, compact, true)['.sh-portals'].opacity,
    '0.00000',
  );
  assert.deepEqual(
    f.spatialFrame(0.85, compact, true)['.sh-story'],
    f.spatialFrame(1, compact, true)['.sh-story'],
    'stable reading range',
  );
  assert.equal(
    f.spatialFrame(1, compact, false)['[data-hero-layer="architecture-a"]']
      .opacity,
    '1.00000',
    'B failure preserves architecture A',
  );
}
// Intro locking is also a scroll-story gate. Programmatic scroll changes
// must not advance either opening progress or the later TP departure.
{
  const entry = environment();
  entry.document.documentElement.setAttribute('data-home-intro', 'waiting');
  const controller = entry.mountSpatialHero(entry.hero);
  entry.flush();
  for (const phase of ['waiting', 'ready', 'revealing', 'reduced']) {
    entry.document.documentElement.setAttribute('data-home-intro', phase);
    entry.scroll(2);
    assert.equal(entry.hero.dataset.progress, '0.0000');
    assert.equal(entry.hero.dataset.scene, 'discovery');
    assert.equal(entry.hero.style['--sh-exit'], '0.00000');
    assert.equal(entry.header.dataset.opening, 'active');
    assert.equal(entry.hero.querySelector('.sh-story').inert, true);
  }
  assert.equal(
    entry.resources().frames,
    0,
    'entry gate creates no polling loop',
  );
  entry.document.documentElement.attrs.delete('data-home-intro');
  entry.scroll(0.75);
  assert.equal(
    entry.hero.dataset.progress,
    '0.7500',
    'native scrolling resumes after entry',
  );
  entry.scroll(1 + 360 / 990);
  assert.equal(
    entry.hero.style['--sh-exit'],
    '1.00000',
    'departure resumes normally',
  );
  controller.destroy();
  assert.equal(entry.resources().frames, 0);
  assert.equal(entry.resources().listeners, 0);
  assert.equal(entry.resources().observers, 0);
}
const mounted = f.mountSpatialHero(f.hero);
f.flush();
assert.equal(f.resources().frames, 0, 'idle has no RAF loop');
assert.equal(f.image.getAttribute('src'), '/b.webp', 'B requested after paint');
const layoutReads = f.reads();
for (let cycle = 0; cycle < 20; cycle++) {
  for (const p of [0, 0.25, 0.5, 0.75, 1, 0.75, 0.5, 0.25, 0]) f.scroll(p);
}
assert.equal(
  f.reads(),
  layoutReads,
  'scroll performs no repeated layout reads',
);
f.scroll(1);
assert.equal(f.hero.dataset.scene, 'story');
assert.equal(
  f.hero.style['--sh-exit'],
  '0.00000',
  'the reading range is intact',
);
f.scroll(1 + 180 / 990);
assert.equal(
  f.hero.style['--sh-exit'],
  '0.50000',
  'TP departure follows the next 40vh',
);
f.scroll(1 + 360 / 990);
assert.equal(f.hero.style['--sh-exit'], '1.00000');
f.scroll(1 + 180 / 990);
assert.equal(
  f.hero.style['--sh-exit'],
  '0.50000',
  'departure reverses without a timer',
);
f.scroll(1);
assert.equal(f.hero.style['--sh-exit'], '0.00000');
assert.equal(f.hero.querySelector('.sh-portals').inert, true);
assert.equal(f.hero.querySelector('.sh-story').inert, false);
f.scroll(0);
assert.equal(f.hero.querySelector('.sh-portals').inert, false);
f.window.scrollY = 100;
f.window.dispatch('scroll');
f.window.dispatch('scroll');
assert.equal(f.frames.size, 1, 'one pending input frame');
f.tick();
assert.equal(f.frames.size, 0);
f.window.scrollY = 495;
f.document.hidden = true;
f.document.dispatch('visibilitychange');
f.window.dispatch('scroll');
assert.equal(f.frames.size, 0, 'hidden document schedules no work');
f.document.hidden = false;
f.document.dispatch('visibilitychange');
f.tick();
assert.equal(
  f.hero.dataset.progress,
  '0.5000',
  'restored tab synchronizes actual position',
);
f.media.get('(prefers-reduced-motion: reduce)').matches = true;
f.media.get('(prefers-reduced-motion: reduce)').dispatch('change');
f.tick();
assert.equal(f.hero.dataset.motion, 'reduced');
assert.equal(
  f.hero.querySelector('.sh-story').inert,
  false,
  'reduced motion exposes both content blocks',
);
assert.equal(f.hero.querySelector('.sh-portals').inert, false);
assert.equal(f.hero.querySelector('.sh-monogram').style.transform, undefined);
f.media.get('(prefers-reduced-motion: reduce)').matches = false;
f.media.get('(prefers-reduced-motion: reduce)').dispatch('change');
f.tick();
assert.equal(
  f.hero.dataset.progress,
  '0.5000',
  'media change preserves scroll position',
);
f.image.complete = true;
f.image.naturalWidth = 1586;
f.image.dispatch('load');
for (let i = 0; i < 6; i++) await Promise.resolve();
f.tick();
assert.equal(f.hero.dataset.storyImage, 'ready');
f.scroll(2);
f.window.scrollY = 2500;
f.window.dispatch('scroll');
assert.equal(
  f.frames.size,
  0,
  'below opening: no animation work for continued page scroll',
);
mounted.destroy();
mounted.destroy();
assert.deepEqual(f.resources(), { frames: 0, observers: 0, listeners: 0 });
assert.equal(f.header.dataset.opening, undefined);
assert.equal(
  f.hero.style['--sh-exit'],
  undefined,
  'departure style is cleaned up',
);
for (let i = 0; i < 30; i++) {
  const e = environment({ reduced: i % 2 === 0, compact: i % 3 === 0 });
  const c = e.mountSpatialHero(e.hero);
  e.flush();
  e.scroll(1);
  c.destroy();
  assert.deepEqual(
    e.resources(),
    { frames: 0, observers: 0, listeners: 0 },
    `mount ${i}: cleanup`,
  );
}
const early = environment();
early.mountSpatialHero(early.hero).destroy();
early.flush();
assert.equal(
  early.image.getAttribute('src'),
  null,
  'early unmount cancels deferred loading',
);
assert.deepEqual(early.resources(), { frames: 0, observers: 0, listeners: 0 });
assert.doesNotMatch(
  source,
  /setTimeout|setInterval|\.animate\(|\.play\(|preventDefault|setState|pointermove/,
  'no autoplay, input hijack or competing pointer clock',
);
console.log(
  'Scroll opening passed: reversible frames, 20 A↔B cycles, reading zone, image fallback, no per-scroll layout reads, idle/hidden work cancellation, reduced motion, resize synchronization, and 30 complete mount cleanups. Browser QA remains separate.',
);
