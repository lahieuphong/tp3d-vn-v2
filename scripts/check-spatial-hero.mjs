/** Deterministic lifecycle checks; fake browser time tests resource ownership,
 * not browser rendering or memory measurements. Run visual/performance QA too. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const filename = new URL(
  '../components/home/hero/hero-timeline.ts',
  import.meta.url,
);
const { outputText } = ts.transpileModule(readFileSync(filename, 'utf8'), {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
});

function environment({
  reduced = false,
  compact = false,
  imageFailure = false,
} = {}) {
  let clock = 0;
  let sequence = 0;
  const timers = new Map();
  const frames = new Map();
  const liveAnimations = new Set();
  const targets = [];
  const observers = [];
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
    dispatch(type, event = {}) {
      for (const callback of this.listeners.get(type) ?? [])
        callback({ target: this, ...event });
    }
  }
  class Animation {
    saved = 0;
    start = null;
    playState = 'paused';
    constructor(frames) {
      this.frames = frames;
      liveAnimations.add(this);
    }
    get currentTime() {
      return this.playState === 'running' ? clock - this.start : this.saved;
    }
    set currentTime(value) {
      this.saved = value;
      if (this.playState === 'running') this.start = clock - value;
    }
    set startTime(value) {
      this.start = value;
    }
    get startTime() {
      return this.start;
    }
    play() {
      this.start = clock - this.saved;
      this.playState = 'running';
    }
    pause() {
      this.saved = this.currentTime;
      this.playState = 'paused';
    }
    cancel() {
      this.pause();
      this.playState = 'idle';
      liveAnimations.delete(this);
    }
  }
  class Node extends Events {
    dataset = {};
    attrs = new Map();
    style = {
      values: new Map(),
      setProperty(key, value) {
        this.values.set(key, value);
      },
      removeProperty(key) {
        this.values.delete(key);
      },
    };
    children = new Map();
    inert = false;
    isControl = false;
    parent = null;
    setAttribute(key, value) {
      this.attrs.set(key, value);
    }
    getAttribute(key) {
      return this.attrs.get(key) ?? null;
    }
    hasAttribute(key) {
      return this.attrs.has(key);
    }
    querySelector(selector) {
      return this.children.get(selector) ?? null;
    }
    querySelectorAll(selector) {
      return selector === 'img[data-hero-deferred]' ? [secondary] : [];
    }
    append(selector, child = new Node()) {
      this.children.set(selector, child);
      child.parent = this;
      return child;
    }
    contains(node) {
      return Boolean(node && (node === this || this.contains(node.parent)));
    }
    closest() {
      return this.isControl ? this : (this.parent?.closest() ?? null);
    }
    getBoundingClientRect() {
      return { left: 0, top: 0, width: 1440, height: 900 };
    }
    animate(keyframes) {
      return new Animation(keyframes);
    }
  }
  class Image extends Node {
    complete = true;
    naturalWidth = 1600;
    decode() {
      return Promise.resolve();
    }
    set src(value) {
      this.attrs.set('src', value);
      this.complete = false;
    }
  }
  const document = new Events();
  document.hidden = false;
  document.activeElement = null;
  document.timeline = {
    get currentTime() {
      return clock;
    },
  };
  const window = new Events();
  const media = new Map([
    [
      '(prefers-reduced-motion: reduce)',
      Object.assign(new Events(), { matches: reduced }),
    ],
    ['(max-width: 1023px)', Object.assign(new Events(), { matches: compact })],
    [
      '(hover: hover) and (pointer: fine)',
      Object.assign(new Events(), { matches: true }),
    ],
  ]);
  window.matchMedia = (query) => media.get(query);
  window.setTimeout = (callback, delay) => {
    const id = ++sequence;
    timers.set(id, { at: clock + delay, callback });
    return id;
  };
  window.clearTimeout = (id) => timers.delete(id);
  const hero = new Node();
  const header = new Node();
  document.querySelector = () => header;
  const dialog = new Node();
  document.querySelectorAll = () => [dialog];
  const searchInput = dialog.append('input');
  searchInput.isControl = true;
  const primary = new Image();
  primary.attrs.set('src', '/architecture-a.webp');
  const secondary = new Image();
  secondary.complete = false;
  secondary.dataset = {
    src: '/architecture-b.webp',
    srcset: '/architecture-b-small.webp 800w',
    sizes: '100vw',
  };
  hero.append('[data-hero-layer="architecture-a"] img', primary);
  for (const selector of [
    '.sh-monogram',
    '.sh-ribbon',
    '.sh-veil',
    '.sh-leaves',
    '.sh-discovery',
    '.sh-story',
    '.sh-portals',
    '.sh-center-copy',
    '[data-hero-layer="architecture-b"]',
  ])
    hero.append(selector);
  const portal = hero.querySelector('.sh-portals').append('a');
  portal.isControl = true;
  const nav = header.append('a');
  nav.isControl = true;
  const motionControl = hero.append('[data-hero-control]');
  motionControl.isControl = true;
  motionControl.setAttribute('data-hero-control', '');
  const parallax = hero.append('.sh-monogram [data-hero-parallax]');
  const outside = new Node();
  class IntersectionObserver {
    disconnected = false;
    constructor(callback) {
      this.callback = callback;
      observers.push(this);
    }
    observe() {}
    unobserve() {}
    disconnect() {
      this.disconnected = true;
    }
    emit(ratio) {
      if (!this.disconnected)
        this.callback([
          { isIntersecting: ratio > 0, intersectionRatio: ratio },
        ]);
    }
  }
  const loaded = { exports: {} };
  runInNewContext(
    outputText,
    {
      module: loaded,
      exports: loaded.exports,
      window,
      document,
      Element: Node,
      IntersectionObserver,
      requestAnimationFrame: (callback) => {
        const id = ++sequence;
        frames.set(id, callback);
        return id;
      },
      cancelAnimationFrame: (id) => frames.delete(id),
    },
    { filename: filename.pathname },
  );
  const tick = (ms) => {
    const end = clock + ms;
    for (let count = 0; count < 1000; count++) {
      const entry = [...timers.entries()].sort((a, b) => a[1].at - b[1].at)[0];
      if (!entry || entry[1].at > end) {
        clock = end;
        return;
      }
      clock = entry[1].at;
      timers.delete(entry[0]);
      entry[1].callback();
    }
    throw new Error('Unexpected continuous timer loop');
  };
  const frame = () => {
    tick(16);
    const pending = [...frames.values()];
    frames.clear();
    pending.forEach((callback) => callback(clock));
  };
  const flush = async () => {
    await Promise.resolve();
    await Promise.resolve();
  };
  const loadImages = async () => {
    await flush();
    frame();
    assert.equal(
      secondary.getAttribute('src'),
      null,
      'Scene B waits beyond the first paint',
    );
    frame();
    secondary.complete = true;
    secondary.naturalWidth = imageFailure ? 0 : 1600;
    secondary.dispatch(imageFailure ? 'error' : 'load');
    await flush();
  };
  const resources = () => ({
    animations: liveAnimations.size,
    timers: timers.size,
    frames: frames.size,
    listeners: targets.reduce(
      (sum, target) =>
        sum +
        [...target.listeners.values()].reduce(
          (total, set) => total + set.size,
          0,
        ),
      0,
    ),
    observers: observers.filter((observer) => !observer.disconnected).length,
  });
  return {
    ...loaded.exports,
    hero,
    header,
    nav,
    portal,
    motionControl,
    searchInput,
    parallax,
    outside,
    document,
    window,
    media,
    secondary,
    tick,
    frame,
    flush,
    loadImages,
    liveAnimations,
    observers,
    resources,
  };
}

const fixture = environment();
assert.equal(fixture.spatialPhase(0), 'discovery');
assert.equal(fixture.spatialPhase(8000), 'transitioningToStory');
assert.equal(fixture.spatialPhase(10_000), 'story');
assert.equal(fixture.spatialPhase(16_000), 'transitioningToDiscovery');
assert.equal(fixture.spatialPhase(20_000), 'discovery');
for (const compact of [false, true]) {
  for (const track of fixture.spatialTracks(compact, true)) {
    assert.equal(track.frames[0].offset, 0);
    assert.equal(track.frames.at(-1).offset, 1);
    for (let i = 1; i < track.frames.length; i++)
      assert.ok(track.frames[i].offset >= track.frames[i - 1].offset);
    for (const property of ['transform', 'opacity'])
      assert.equal(
        track.frames[0][property],
        track.frames.at(-1)[property],
        `${track.selector} has a seamless loop`,
      );
  }
}
const controller = fixture.mountSpatialHero(fixture.hero);
fixture.observers[0].emit(1);
assert.equal(fixture.hero.dataset.motion, 'static');
await fixture.loadImages();
assert.equal(fixture.secondary.fetchPriority, 'low');
assert.equal(fixture.hero.dataset.motion, 'playing');
assert.equal(
  fixture.resources().timers,
  1,
  'only next scene boundary is scheduled',
);
assert.equal(
  new Set([...fixture.liveAnimations].map((animation) => animation.startTime))
    .size,
  1,
  'all layers have one shared time origin',
);
fixture.tick(10_100);
assert.equal(fixture.hero.dataset.scene, 'story');
assert.equal(fixture.hero.querySelector('.sh-portals').inert, true);
assert.equal(fixture.hero.querySelector('.sh-story').inert, false);
fixture.observers[0].emit(0);
assert.equal(fixture.hero.dataset.motion, 'paused');
const pausedAt = [...fixture.liveAnimations][0].currentTime;
fixture.tick(30_000);
assert.equal(
  [...fixture.liveAnimations][0].currentTime,
  pausedAt,
  'offscreen time must not advance',
);
assert.equal(fixture.resources().timers, 0);
fixture.observers[0].emit(1);
fixture.document.hidden = true;
fixture.document.dispatch('visibilitychange');
fixture.tick(30_000);
assert.equal(
  [...fixture.liveAnimations][0].currentTime,
  pausedAt,
  'background tabs must not advance',
);
fixture.document.hidden = false;
fixture.document.dispatch('visibilitychange');
fixture.window.dispatch('pagehide');
fixture.window.dispatch('pageshow');
assert.equal(
  fixture.hero.dataset.motion,
  'paused',
  'BFCache restore waits for a fresh visibility report',
);
fixture.observers[0].emit(1);
assert.equal(fixture.hero.dataset.motion, 'playing');
controller.showScene('discovery');
assert.equal(fixture.hero.dataset.scene, 'discovery');
assert.equal(fixture.hero.dataset.motion, 'paused');
controller.setPaused(false);
fixture.document.activeElement = fixture.portal;
fixture.document.dispatch('focusin', { target: fixture.portal });
fixture.tick(20_000);
assert.equal(
  fixture.hero.dataset.scene,
  'discovery',
  'focused portals remain stable',
);
assert.equal(
  fixture.hero.querySelector('.sh-portals').getAttribute('aria-hidden'),
  'false',
);
controller.showScene('story');
assert.equal(
  fixture.hero.dataset.scene,
  'discovery',
  'manual scene changes cannot hide the focused portal',
);
fixture.document.activeElement = null;
fixture.document.dispatch('focusout', {
  target: fixture.portal,
  relatedTarget: fixture.outside,
});
fixture.tick(1399);
assert.equal(fixture.hero.dataset.motion, 'paused');
fixture.tick(1);
assert.equal(fixture.hero.dataset.motion, 'playing');
fixture.document.dispatch('pointerover', {
  target: fixture.nav,
  pointerType: 'mouse',
});
assert.equal(
  fixture.hero.dataset.motion,
  'paused',
  'shared header links pause the hero',
);
fixture.document.dispatch('pointerout', {
  target: fixture.nav,
  relatedTarget: fixture.outside,
  pointerType: 'mouse',
});
fixture.tick(1400);
controller.setPaused(true);
fixture.document.activeElement = fixture.motionControl;
fixture.document.dispatch('focusin', { target: fixture.motionControl });
fixture.document.dispatch('pointerover', {
  target: fixture.motionControl,
  pointerType: 'mouse',
});
controller.setPaused(false);
assert.equal(
  fixture.hero.dataset.motion,
  'playing',
  'the stable Play button works while focused/hovered',
);
fixture.document.activeElement = fixture.searchInput;
fixture.document.dispatch('focusin', { target: fixture.searchInput });
assert.equal(
  fixture.hero.dataset.motion,
  'paused',
  'a portalled search input still belongs to header interaction',
);
fixture.document.activeElement = null;
fixture.document.dispatch('focusout', {
  target: fixture.searchInput,
  relatedTarget: fixture.outside,
});
fixture.tick(1400);
fixture.hero.dispatch('pointermove', {
  pointerType: 'mouse',
  clientX: 1440,
  clientY: 0,
});
fixture.hero.dispatch('pointermove', {
  pointerType: 'mouse',
  clientX: 1440,
  clientY: 0,
});
assert.equal(
  fixture.resources().frames,
  1,
  'pointer input is batched into one RAF',
);
fixture.frame();
assert.equal(fixture.parallax.style.values.get('--sh-x'), '5.00px');
assert.equal(fixture.parallax.style.values.get('--sh-rx'), '0.80deg');
assert.equal(fixture.parallax.style.values.get('--sh-ry'), '1.20deg');
assert.equal(fixture.resources().frames, 0, 'no permanent RAF');
fixture.window.dispatch('scroll');
assert.equal(fixture.parallax.style.values.size, 0);
const animationCount = fixture.liveAnimations.size;
fixture.media.get('(max-width: 1023px)').matches = true;
fixture.media.get('(max-width: 1023px)').dispatch('change');
assert.equal(
  fixture.liveAnimations.size,
  animationCount - 1,
  'breakpoint replacement removes the desktop leaf track',
);
fixture.media.get('(prefers-reduced-motion: reduce)').matches = true;
fixture.media.get('(prefers-reduced-motion: reduce)').dispatch('change');
assert.equal(fixture.hero.dataset.motion, 'static');
assert.equal(fixture.hero.dataset.scene, 'discovery');
assert.equal(fixture.liveAnimations.size, 0);
assert.equal(fixture.resources().timers, 0);
controller.showScene('story');
assert.equal(fixture.hero.dataset.scene, 'discovery');
controller.destroy();
controller.destroy();
assert.deepEqual(fixture.resources(), {
  animations: 0,
  timers: 0,
  frames: 0,
  listeners: 0,
  observers: 0,
});

const failed = environment({ imageFailure: true });
const failedController = failed.mountSpatialHero(failed.hero);
failed.observers[0].emit(1);
await failed.loadImages();
assert.equal(failed.hero.dataset.storyImage, 'fallback');
assert.equal(
  failed.hero.dataset.motion,
  'playing',
  'story copy still works over the usable first background',
);
assert.equal(
  failed.liveAnimations.size,
  8,
  'failed background is not animated into view',
);
failedController.destroy();

for (const imageFailure of [false, true]) {
  const early = environment({ imageFailure });
  const earlyController = early.mountSpatialHero(early.hero);
  early.observers[0].emit(1);
  await early.flush();
  earlyController.showScene('story');
  assert.equal(
    early.hero.dataset.scene,
    'discovery',
    'retain the usable discovery fallback during secondary decode',
  );
  assert.equal(early.liveAnimations.size, 0, 'do not flash an unready scene');
  await early.loadImages();
  assert.equal(
    early.hero.dataset.scene,
    'story',
    'an early Our Story choice survives secondary loading or image fallback',
  );
  assert.equal(
    early.hero.dataset.motion,
    'paused',
    'the requested scene keeps its manual pause',
  );
  assert.ok(
    [...early.liveAnimations].every(
      (animation) =>
        animation.currentTime === 12_000 && animation.playState === 'paused',
    ),
    'every first ready frame starts at the same stable story position',
  );
  assert.equal(early.hero.querySelector('.sh-story').inert, false);
  assert.equal(early.hero.querySelector('.sh-portals').inert, true);
  early.tick(20_000);
  assert.equal(early.hero.dataset.scene, 'story');
  earlyController.setPaused(false);
  early.tick(4100);
  assert.equal(
    early.hero.dataset.scene,
    'transitioningToDiscovery',
    'resume continues from the requested scene instead of restarting',
  );
  earlyController.destroy();
}

// This checks ownership repeatedly, not a claimed browser RAM measurement.
for (let cycle = 0; cycle < 30; cycle++) {
  const repeated = environment();
  const mounted = repeated.mountSpatialHero(repeated.hero);
  repeated.observers[0].emit(1);
  await repeated.loadImages();
  repeated.tick(60_000);
  for (let round = 0; round < 10; round++) {
    repeated.observers[0].emit(0);
    repeated.tick(30_000);
    repeated.observers[0].emit(1);
    repeated.tick(20_000);
  }
  mounted.destroy();
  assert.deepEqual(
    repeated.resources(),
    { animations: 0, timers: 0, frames: 0, listeners: 0, observers: 0 },
    `mount ${cycle}: no retained resources`,
  );
}
const immediate = environment();
immediate.mountSpatialHero(immediate.hero).destroy();
await immediate.flush();
assert.deepEqual(
  immediate.resources(),
  { animations: 0, timers: 0, frames: 0, listeners: 0, observers: 0 },
  'unmount before deferred request/decode settles',
);
const still = environment({ reduced: true });
const stillController = still.mountSpatialHero(still.hero);
still.observers[0].emit(1);
await still.flush();
assert.equal(still.hero.dataset.motion, 'static');
assert.equal(
  still.secondary.getAttribute('src'),
  null,
  'reduced motion does not request unused Scene B',
);
stillController.destroy();
console.log(
  'Spatial hero passed: shared 20s clock, seamless loop, visibility/manual/focus/hover pauses, deferred-image fallback, pointer bounds, breakpoint/reduced-motion cleanup, and 30 repeated lifecycles. Browser rendering/RAM/GPU still require separate QA.',
);
