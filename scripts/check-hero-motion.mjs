/** Exercises the real controller with deterministic browser/WAAPI doubles.
 * This is lifecycle regression coverage, not a substitute for visual browser QA. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

function loadModule(name, globals = {}) {
  const { outputText } = ts.transpileModule(
    readFileSync(
      new URL(`../components/hero/${name}.ts`, import.meta.url),
      'utf8',
    ),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  );
  const exports = {};
  runInNewContext(outputText, { exports, ...globals });
  return exports;
}
const timelineModule = loadModule('hero-motion-timeline');
const { heroTimeline, heroPlayback } = timelineModule;
const clone = (value) => JSON.parse(JSON.stringify(value));

for (const [width, height, variant, duration] of [
  [375, 812, 'mobile', 13000],
  [390, 844, 'mobile', 13000],
  [768, 1024, 'tablet', 15000],
  [1024, 768, 'desktop', 17000],
  [1440, 900, 'desktop', 17000],
  [1920, 1080, 'desktop', 17000],
]) {
  const timeline = heroTimeline(width, height);
  assert.equal(timeline.variant, variant);
  assert.equal(timeline.duration, duration);
  assert.equal(timeline.tracks.length, 17);
  for (const { frames, selector } of timeline.tracks) {
    assert.ok(selector.startsWith('.emh-') || selector === '@header');
    if (selector === '@header')
      assert.ok(
        frames.every((frame) => !('color' in frame)),
        'Header solid state must not inherit animated color',
      );
    assert.equal(frames[0].offset, 0);
    assert.equal(frames.at(-1).offset, 1);
    const styles = ({ offset: _offset, easing: _easing, ...rest }) =>
      clone(rest);
    assert.deepEqual(
      styles(frames[0]),
      styles(frames.at(-1)),
      `${selector}: seamless boundary`,
    );
    frames.forEach((frame, index) => {
      if (index) assert.ok(frame.offset >= frames[index - 1].offset);
      for (const key of Object.keys(frame)) {
        assert.ok(
          [
            'offset',
            'easing',
            'transform',
            'opacity',
            'clipPath',
            'color',
            '--tp-hero-ink',
          ].includes(key),
        );
      }
    });
  }
  const aperture = timeline.tracks[0].frames.find(
    (frame) => frame.offset === 10.2 / 17,
  ).clipPath;
  const [left, top, right, _top2, _right2, bottom] = aperture
    .match(/[\d.]+/g)
    .map(Number);
  assert.ok(
    Math.abs((height * (bottom - top)) / 100 - (width * (right - left)) / 100) <
      0.001,
    'Material aperture must remain square at every tested aspect ratio',
  );
  const materialTrack = timeline.tracks.find(
    (item) => item.selector === '.emh-material',
  );
  const cover = materialTrack.frames.find(
    (frame) => frame.offset === 12.8 / 17,
  );
  const coverScale = Number(cover.transform.match(/scale\(([\d.]+)\)/)[1]);
  assert.ok(
    ((width * (right - left)) / 100) * coverScale >= Math.max(width, height),
    'The material surface must cover both viewport dimensions',
  );
  const walnut = timeline.tracks.find(
    (item) => item.selector === '.emh-walnut',
  );
  assert.equal(
    walnut.frames.find((frame) => frame.offset === 5 / 17).clipPath,
    walnut.frames.find((frame) => frame.offset === 14.6 / 17).clipPath,
    'The closed walnut plane must not interpolate into a visible strip',
  );
  if (variant === 'mobile') {
    const material = timeline.tracks.find(
      (item) => item.selector === '.emh-material',
    );
    assert.ok(
      material.frames.every((frame) =>
        frame.transform.includes('rotate(0deg)'),
      ),
    );
  }
  for (const { frames } of timeline.tracks) {
    const masks = frames
      .filter((frame) => frame.clipPath)
      .map((frame) => frame.clipPath.split('(')[0]);
    assert.ok(
      new Set(masks).size <= 1,
      'Mask primitives must remain compatible throughout a track',
    );
  }
}
for (const reduced of [true, false]) {
  for (const ready of [true, false]) {
    for (const hidden of [true, false]) {
      for (const ratio of [0, 0.001, 0.24, 0.25, 1]) {
        assert.equal(
          heroPlayback({ reduced, ready, hidden, ratio }),
          reduced || !ready
            ? 'static'
            : hidden || !ratio
              ? 'paused'
              : ratio < 0.25
                ? 'slow'
                : 'playing',
        );
      }
    }
  }
}

class Events {
  listeners = new Map();
  addEventListener(name, fn) {
    if (!this.listeners.has(name)) this.listeners.set(name, new Set());
    this.listeners.get(name).add(fn);
  }
  removeEventListener(name, fn) {
    this.listeners.get(name)?.delete(fn);
  }
  dispatch(name) {
    for (const fn of this.listeners.get(name) ?? []) fn();
  }
  count() {
    return [...this.listeners.values()].reduce(
      (sum, items) => sum + items.size,
      0,
    );
  }
}
class AnimationDouble {
  currentTime = 0;
  playbackRate = 1;
  playState = 'running';
  constructor(options) {
    this.duration = options.duration;
  }
  pause() {
    this.playState = 'paused';
  }
  play() {
    this.playState = 'running';
  }
  cancel() {
    this.playState = 'idle';
    this.currentTime = null;
  }
  updatePlaybackRate(rate) {
    this.playbackRate = rate;
  }
  tick(ms) {
    if (this.playState === 'running')
      this.currentTime += ms * this.playbackRate;
  }
}
function harness({
  reduced = false,
  complete = true,
  naturalWidth = 1600,
  deferDecode = false,
  supported = true,
  secondaryWidth = 1600,
  autoSecondary = true,
} = {}) {
  const win = new Events();
  const doc = Object.assign(new Events(), { hidden: false });
  const preference = Object.assign(new Events(), { matches: reduced });
  win.matchMedia = () => preference;
  let resolveDecode;
  const image = Object.assign(new Events(), {
    complete,
    naturalWidth,
    getAttribute: () => '/images/hero.webp',
    decode: () =>
      deferDecode
        ? new Promise((resolve) => {
            resolveDecode = resolve;
          })
        : Promise.resolve(),
  });
  const secondary = Object.assign(new Events(), {
    complete: false,
    naturalWidth: secondaryWidth,
    dataset: {
      src: '/images/quiet.webp',
      srcset: '/images/quiet-720.webp 720w',
      sizes: '100vw',
    },
    decode: () => Promise.resolve(),
    getAttribute: () => secondary.source ?? null,
  });
  Object.defineProperty(secondary, 'src', {
    set(value) {
      secondary.source = value;
      if (autoSecondary)
        queueMicrotask(() => {
          secondary.complete = true;
          secondary.dispatch('load');
        });
    },
  });
  const all = [];
  const target = {
    animate: (_frames, options) => {
      const animation = new AnimationDouble(options);
      all.push(animation);
      return animation;
    },
  };
  let size = { width: 1440, height: 900 };
  const host = {
    dataset: { heroMotion: 'static', heroReady: 'false' },
    animate: supported ? target.animate : undefined,
    querySelector: () => target,
    querySelectorAll: () => [image, secondary],
    getBoundingClientRect: () => size,
  };
  doc.querySelector = () => target;
  let io;
  let ro;
  class IntersectionDouble {
    constructor(callback) {
      this.callback = callback;
      io = this;
    }
    observe() {
      this.observing = true;
    }
    unobserve() {
      this.observing = false;
    }
    disconnect() {
      this.observing = false;
      this.disconnected = true;
    }
    report(ratio, isIntersecting = ratio > 0) {
      if (this.observing)
        this.callback([{ intersectionRatio: ratio, isIntersecting }]);
    }
  }
  class ResizeDouble {
    constructor(callback) {
      this.callback = callback;
      ro = this;
    }
    observe() {}
    disconnect() {
      this.disconnected = true;
    }
  }
  const { mountHeroMotion } = loadModule('hero-motion-controller', {
    require: () => timelineModule,
    window: win,
    document: doc,
    IntersectionObserver: IntersectionDouble,
    ResizeObserver: ResizeDouble,
  });
  const controller = mountHeroMotion(host);
  return {
    host,
    win,
    doc,
    image,
    preference,
    all,
    cleanup: controller.destroy,
    setPaused: controller.setPaused,
    secondary,
    get io() {
      return io;
    },
    get ro() {
      return ro;
    },
    active: () => all.filter((animation) => animation.playState !== 'idle'),
    tick: (ms) => all.forEach((animation) => animation.tick(ms)),
    resize: (width, height) => {
      size = { width, height };
      ro.callback();
    },
    decode: () => resolveDecode?.(),
  };
}
const flush = async () => {
  for (let i = 0; i < 8; i++) await Promise.resolve();
};

const h = harness();
await flush();
assert.equal(
  h.all.length,
  0,
  'No animations before a positive visibility observation',
);
h.io.report(1);
assert.equal(h.host.dataset.heroMotion, 'playing');
const original = h.active();
assert.equal(original.length, 17);
h.tick(5300);
h.io.report(0.1);
assert.ok(
  original.every((a) => a.playbackRate === 0.25 && a.currentTime === 5300),
);
h.tick(1000);
h.io.report(0, true); // Edge-adjacent intersection is not visible.
assert.equal(h.host.dataset.heroMotion, 'paused');
h.tick(5000);
assert.ok(original.every((a) => a.currentTime === 5550));
h.io.report(1);
assert.equal(h.all.length, 17, 'Scroll return resumes existing effects');
h.tick(500);
assert.ok(original.every((a) => a.currentTime === 6050));
h.doc.hidden = true;
h.doc.dispatch('visibilitychange');
h.io.report(0.8);
h.tick(3000);
assert.ok(
  original.every((a) => a.playState === 'paused' && a.currentTime === 6050),
);
h.doc.hidden = false;
h.doc.dispatch('visibilitychange');
assert.ok(original.every((a) => a.playState === 'running'));
h.win.dispatch('pagehide');
h.io.report(1);
assert.ok(original.every((a) => a.playState === 'paused'));
h.win.dispatch('pageshow');
assert.ok(
  original.every((a) => a.playState === 'paused'),
  'Wait for a fresh BFCache visibility report',
);
h.io.report(1);
const phase = original[0].currentTime / original[0].duration;
h.io.report(0);
h.resize(768, 1024);
assert.equal(
  h.active().length,
  0,
  'Offscreen resize does not start new effects',
);
h.io.report(1);
assert.ok(
  h.active().every((a) => Math.abs(a.currentTime / a.duration - phase) < 1e-9),
  'Returning after an offscreen resize retains the saved phase',
);
h.resize(390, 844);
assert.equal(h.active().length, 17);
assert.ok(
  h.active().every((a) => Math.abs(a.currentTime / a.duration - phase) < 1e-9),
);
h.preference.matches = true;
h.preference.dispatch('change');
assert.equal(h.active().length, 0);
assert.equal(h.host.dataset.heroMotion, 'static');
h.io.report(1);
assert.equal(h.active().length, 0, 'IO cannot override reduced motion');
h.preference.matches = false;
h.preference.dispatch('change');
assert.equal(h.active().length, 17);
assert.ok(
  h.active().every((a) => Math.abs(a.currentTime / a.duration - phase) < 1e-9),
);
h.setPaused(true);
const pausedPhase = h.active()[0].currentTime / h.active()[0].duration;
h.resize(1440, 900);
assert.equal(h.active().length, 17, 'A visible paused frame survives resize');
assert.ok(
  h
    .active()
    .every(
      (a) =>
        a.playState === 'paused' &&
        Math.abs(a.currentTime / a.duration - pausedPhase) < 1e-9,
    ),
);
const pausedTime = h.active()[0].currentTime;
h.io.report(0);
h.doc.hidden = true;
h.doc.dispatch('visibilitychange');
h.io.report(1);
h.doc.hidden = false;
h.doc.dispatch('visibilitychange');
h.tick(1000);
assert.ok(
  h
    .active()
    .every(
      (animation) =>
        animation.playState === 'paused' &&
        animation.currentTime === pausedTime,
    ),
  'Visibility changes cannot override a manual pause',
);
h.setPaused(false);
assert.ok(h.active().every((animation) => animation.playState === 'running'));
h.cleanup();
assert.equal(h.active().length, 0);
assert.ok(h.io.disconnected && h.ro.disconnected);
assert.equal(
  h.win.count() +
    h.doc.count() +
    h.image.count() +
    h.secondary.count() +
    h.preference.count(),
  0,
);

for (const options of [
  { reduced: true },
  { naturalWidth: 0 },
  { secondaryWidth: 0 },
  { supported: false },
]) {
  const fallback = harness(options);
  await flush();
  fallback.io?.report(1);
  assert.equal(fallback.all.length, 0);
  assert.equal(fallback.host.dataset.heroMotion, 'static');
  fallback.cleanup();
}
const slowImage = harness({ complete: false });
slowImage.io.report(1);
assert.equal(slowImage.all.length, 0);
slowImage.image.complete = true;
slowImage.image.dispatch('load');
await flush();
assert.equal(slowImage.active().length, 17);
slowImage.image.naturalWidth = 0;
slowImage.image.dispatch('error');
assert.equal(slowImage.active().length, 0);
slowImage.cleanup();
const disposedDecode = harness({ deferDecode: true });
disposedDecode.io.report(1);
disposedDecode.cleanup();
disposedDecode.decode();
await flush();
assert.equal(
  disposedDecode.all.length,
  0,
  'Decode resolving after unmount cannot start effects',
);

const waitingSecond = harness({ autoSecondary: false });
waitingSecond.io.report(1);
await flush();
assert.equal(
  waitingSecond.secondary.source,
  '/images/quiet.webp',
  'Second request starts after critical image decode',
);
assert.equal(
  waitingSecond.all.length,
  0,
  'Timeline waits for its second photograph',
);
waitingSecond.secondary.complete = true;
waitingSecond.secondary.dispatch('load');
await flush();
assert.equal(waitingSecond.active().length, 17);
waitingSecond.cleanup();

console.log(
  'Hero checks passed: six responsive timelines, compatible masks, loop boundaries, two-image loading gate/failure fallback, play/slow/pause/resume, manual pause, hidden-tab/BFCache races, resize phase, reduced motion and cleanup.',
);
