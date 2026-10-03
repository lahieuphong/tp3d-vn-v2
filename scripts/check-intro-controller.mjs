/** Intro timing, cancellation and style ownership using deterministic browser
 * doubles. This does not measure browser RAM, GPU textures or frame rates. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import ts from 'typescript';

function compile(path) {
  return ts.transpileModule(
    readFileSync(new URL(path, import.meta.url), 'utf8'),
    {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
      },
    },
  ).outputText;
}
const controllerSource = compile(
  '../components/home/intro/intro-controller.ts',
);
const runtimeSource = compile('../components/home/intro/intro-runtime.ts');
const tokens = { exports: {} };
runInContext(
  compile('../lib/motion/tokens.ts'),
  createContext({ module: tokens, exports: tokens.exports }),
);
const flush = async () => {
  for (let i = 0; i < 8; i++) await Promise.resolve();
};

function environment({
  mobile = false,
  reduced = false,
  now = 0,
  scroll = 0,
  hash = '',
  busy = 'false',
  hasOverlay = true,
  hasHome = true,
  fine = true,
  width = mobile ? 390 : 1440,
  height = mobile ? 844 : 900,
} = {}) {
  let clock = now,
    sequence = 0,
    seen = 0,
    completed = 0;
  const frames = new Map();
  const requestAnimationFrame = (callback) => {
    const id = ++sequence;
    frames.set(id, callback);
    return id;
  };
  const cancelAnimationFrame = (id) => frames.delete(id);
  const timers = new Map(),
    eventTargets = [],
    progress = [],
    observations = [];
  const setTimeout = (callback, delay = 0) => {
    const id = ++sequence;
    timers.set(id, { callback, at: clock + Math.max(0, delay) });
    return id;
  };
  const clearTimeout = (id) => timers.delete(id);
  class Events {
    events = new Map();
    constructor() {
      eventTargets.push(this);
    }
    addEventListener(name, callback) {
      if (!this.events.has(name)) this.events.set(name, new Set());
      this.events.get(name).add(callback);
    }
    removeEventListener(name, callback) {
      this.events.get(name)?.delete(callback);
    }
    emit(name, event = {}) {
      for (const callback of this.events.get(name) ?? []) callback(event);
    }
  }
  class Style {
    values = new Map();
    getPropertyValue(name) {
      return this.values.get(name)?.[0] ?? '';
    }
    getPropertyPriority(name) {
      return this.values.get(name)?.[1] ?? '';
    }
    setProperty(name, value, priority = '') {
      this.values.set(name, [value, priority]);
    }
    removeProperty(name) {
      this.values.delete(name);
    }
  }
  class Node extends Events {
    style = new Style();
    attrs = new Map();
    dataset = {};
    inert = false;
    setAttribute(name, value) {
      this.attrs.set(name, value);
      if (name === 'data-home-intro') this.dataset.homeIntro = value;
    }
    getAttribute(name) {
      return this.attrs.get(name) ?? null;
    }
    removeAttribute(name) {
      this.attrs.delete(name);
      if (name === 'data-home-intro') delete this.dataset.homeIntro;
    }
  }
  const html = new Node(),
    body = new Node(),
    overlay = new Node(),
    bottom = new Node(),
    progressRow = new Node(),
    home = new Node(),
    header = new Node(),
    footer = new Node(),
    skip = new Node();
  overlay.querySelector = (selector) =>
    selector === '.hi-panel-bottom'
      ? bottom
      : selector === '.hi-progress-row'
        ? progressRow
        : null;
  const backgrounds = [header, home, footer, skip];
  home.inert = true;
  if (busy !== null) home.setAttribute('aria-busy', busy);
  html.style.setProperty('overflow-x', 'clip', 'important');
  html.style.setProperty('overflow-y', 'scroll');
  html.style.setProperty('scrollbar-gutter', 'stable both-edges');
  html.style.setProperty('--hi-duration', '17ms', 'important');
  body.style.setProperty('overflow-x', 'clip', 'important');
  body.style.setProperty('overflow-y', 'auto');
  body.style.setProperty('overscroll-behavior-x', 'contain', 'important');
  body.style.setProperty('overscroll-behavior-y', 'none');
  body.style.setProperty('padding-right', '23px');
  overlay.style.setProperty('--hi-pointer-x', '.2', 'important');
  overlay.style.setProperty('--hi-pointer-y', '-.3');
  const original = {
    html: [...html.style.values],
    body: [...body.style.values],
    overlay: [...overlay.style.values],
    inert: backgrounds.map((node) => node.inert),
    busy,
  };
  const document = Object.assign(new Events(), {
    documentElement: html,
    body,
    hidden: false,
    querySelector: (selector) =>
      selector === '[data-home-intro-overlay]'
        ? hasOverlay
          ? overlay
          : null
        : selector === '.home-experience'
          ? hasHome
            ? home
            : null
          : null,
    querySelectorAll: () => backgrounds,
  });
  const motion = Object.assign(new Events(), { matches: reduced });
  const compact = Object.assign(new Events(), { matches: mobile });
  const fineDesktop = Object.assign(new Events(), {
    matches: fine && width >= 1024,
  });
  const window = Object.assign(new Events(), {
    scrollY: scroll,
    innerWidth: width,
    innerHeight: height,
    setTimeout,
    clearTimeout,
    scrollTo({ top }) {
      window.scrollY = top;
    },
    matchMedia: (query) =>
      query.includes('reduced-motion')
        ? motion
        : query.includes('max-width')
          ? compact
          : fineDesktop,
  });
  const history = { scrollRestoration: 'auto' };
  const location = { pathname: '/', hostname: 'localhost', hash, search: '' };
  const performance = {
    now: () => clock,
    getEntriesByType: () => [{ type: 'navigate' }],
  };
  const storage = new Map();
  const sessionStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => {
      storage.set(key, value);
      seen++;
    },
  };
  const assets = (root, options) => {
    assert.equal(root, home);
    let resolve;
    const promise = new Promise((settle) => {
      resolve = settle;
    });
    const record = {
      options,
      active: true,
      value: { completed: 0, total: 5, failed: 0, progress: 0 },
    };
    const finish = (flags = {}) => {
      if (!record.active) return;
      record.active = false;
      clearTimeout(timeout);
      options.signal.removeEventListener('abort', abort);
      resolve({ ...record.value, timedOut: false, cancelled: false, ...flags });
    };
    const abort = () => finish({ cancelled: true });
    const timeout = setTimeout(
      () => finish({ timedOut: true }),
      options.timeoutMs,
    );
    options.signal.addEventListener('abort', abort, { once: true });
    options.onProgress(record.value);
    record.complete = () => {
      record.value = { completed: 5, total: 5, failed: 0, progress: 1 };
      options.onProgress(record.value);
      finish();
    };
    record.partial = () => {
      record.value = { completed: 2, total: 5, failed: 1, progress: 2 / 5 };
      options.onProgress(record.value);
    };
    observations.push(record);
    return { promise, cancel: abort };
  };
  const context = createContext({
    exports: {},
    document,
    window,
    location,
    history,
    performance,
    sessionStorage,
    URLSearchParams,
    AbortController,
    requestAnimationFrame,
    cancelAnimationFrame,
    setTimeout,
    clearTimeout,
  });
  runInContext(runtimeSource, context);
  const runtime = context.exports;
  context.exports = {};
  context.require = (name) =>
    name === './critical-assets'
      ? { preloadHomeCriticalAssets: assets }
      : name === '@/lib/motion/tokens'
        ? tokens.exports
        : name === './intro-runtime'
          ? {
              ...runtime,
              markHomeIntroPlayed: () => {
                seen++;
                runtime.markHomeIntroPlayed();
              },
            }
          : null;
  runInContext(controllerSource, context);
  const { mountHomeIntro, INTRO_TIMING } = context.exports;
  const mount = (decision = { play: true, force: false, startedAt: 0 }) =>
    mountHomeIntro(decision, {
      onProgress: (value) => progress.push({ ...value }),
      onComplete: () => completed++,
    });
  const e = {
    html,
    body,
    home,
    overlay,
    bottom,
    window,
    document,
    location,
    motion,
    compact,
    fineDesktop,
    frames,
    finishSequence() {
      overlay.emit('animationend', {
        animationName: 'hi-fade-in',
        target: progressRow,
      });
    },
    flushFrames() {
      const work = [...frames.values()];
      frames.clear();
      work.forEach((callback) => callback(clock));
    },
    progress,
    observations,
    timers,
    INTRO_TIMING,
    mount,
    boot() {
      runInContext(runtime.HOME_INTRO_BOOTSTRAP, context);
    },
    claim: runtime.claimHomeIntro,
    get completed() {
      return completed;
    },
    get seen() {
      return seen;
    },
    get now() {
      return clock;
    },
    get listeners() {
      return eventTargets.reduce(
        (sum, target) =>
          sum +
          [...target.events.values()].reduce((n, values) => n + values.size, 0),
        0,
      );
    },
    async advance(ms) {
      const target = clock + ms;
      for (;;) {
        await flush();
        let earliest;
        for (const entry of timers)
          if (
            entry[1].at <= target &&
            (!earliest || entry[1].at < earliest[1].at)
          )
            earliest = entry;
        if (!earliest) break;
        clock = earliest[1].at;
        timers.delete(earliest[0]);
        earliest[1].callback();
      }
      clock = target;
      await flush();
    },
    assertRestored() {
      const sorted = (values) =>
        [...values].sort(([a], [b]) => a.localeCompare(b));
      assert.deepEqual(
        sorted(html.style.values),
        sorted(original.html),
        'exact original html values and priorities',
      );
      assert.deepEqual(
        sorted(body.style.values),
        sorted(original.body),
        'exact original body values and priorities',
      );
      assert.deepEqual(
        sorted(overlay.style.values),
        sorted(original.overlay),
        'exact original pointer custom properties and priority',
      );
      assert.equal(frames.size, 0, 'no pointer RAF remains');
      assert.deepEqual(
        backgrounds.map((node) => node.inert),
        original.inert,
        'original inert states',
      );
      assert.equal(
        home.getAttribute('aria-busy'),
        original.busy,
        'original aria-busy',
      );
      assert.equal(
        history.scrollRestoration,
        'auto',
        'scroll restoration ownership released',
      );
      assert.equal(overlay.getAttribute('data-intro-sequence'), null);
      assert.equal(html.getAttribute('data-home-intro'), null);
      assert.equal(e.listeners, 0, 'no owned DOM/media listener remains');
      assert.equal(timers.size, 0, 'no timeout remains');
      assert.equal(
        observations.filter((record) => record.active).length,
        0,
        'no asset observation remains',
      );
    },
  };
  return e;
}

// TP3D PASS 01: the opening is the `entrance` token (1500ms desktop) and the
// `cinematic` token (1000ms mobile); reduced motion keeps its 300ms exit. The
// completion guard stays duration + 100ms.
// Min display covers the visible sequence, even if hydration started later.
for (const start of [0, 650, 3000]) {
  const e = environment({ now: start });
  const cleanup = e.mount();
  assert.equal(e.html.dataset.homeIntro, 'waiting');
  assert.equal(e.overlay.getAttribute('data-intro-sequence'), 'playing');
  assert.equal(e.observations[0].options.timeoutMs, 4000);
  e.observations[0].complete();
  e.finishSequence();
  await e.advance(1799);
  assert.equal(e.html.dataset.homeIntro, 'waiting');
  await e.advance(1);
  assert.equal(e.html.dataset.homeIntro, 'ready');
  await e.advance(149);
  assert.equal(e.html.dataset.homeIntro, 'ready');
  await e.advance(1);
  assert.equal(e.html.dataset.homeIntro, 'revealing');
  assert.equal(e.html.style.getPropertyValue('--hi-duration'), '1500ms');
  e.overlay.emit('animationend', {
    animationName: 'hi-bottom-open',
    target: e.overlay,
  });
  assert.equal(e.completed, 0, 'only correct exit event completes loader');
  await e.advance(1500);
  e.overlay.emit('animationend', {
    animationName: 'hi-bottom-open',
    target: e.bottom,
  });
  assert.equal(e.completed, 1);
  assert.equal(e.seen, 1);
  e.assertRestored();
  cleanup();
  await e.advance(10000);
  assert.equal(e.completed, 1);
}
for (const config of [{}, { mobile: true }, { reduced: true }]) {
  const e = environment(config);
  e.mount();
  e.observations[0].complete();
  e.finishSequence();
  const enter = 1800 + (config.reduced ? 0 : 150),
    exit = config.reduced ? 300 : config.mobile ? 1000 : 1500;
  await e.advance(enter);
  assert.equal(
    e.html.dataset.homeIntro,
    config.reduced ? 'reduced' : 'revealing',
  );
  assert.equal(e.html.style.getPropertyValue('--hi-duration'), `${exit}ms`);
  await e.advance(exit + 99);
  assert.equal(e.completed, 0);
  await e.advance(1);
  assert.equal(e.completed, 1);
  e.assertRestored();
}
// The real CSS sequence may start after hydration. A fast network must not
// cut off that visible sequence, while a missing event still cannot trap entry.
for (const animationEvent of [true, false]) {
  const e = environment();
  e.mount();
  e.observations[0].complete();
  await e.advance(2200);
  assert.equal(e.html.dataset.homeIntro, 'waiting');
  if (animationEvent) e.finishSequence();
  else await e.advance(1800);
  assert.equal(e.html.dataset.homeIntro, 'ready');
  await e.advance(150);
  assert.equal(e.html.dataset.homeIntro, 'revealing');
  await e.advance(1600);
  e.assertRestored();
}
// Timeout does not fabricate the missing three completion units or linger at ready.
{
  const e = environment();
  e.mount();
  e.observations[0].partial();
  await e.advance(3999);
  assert.equal(e.html.dataset.homeIntro, 'waiting');
  await e.advance(1);
  assert.equal(e.html.dataset.homeIntro, 'revealing');
  assert.equal(e.progress.at(-1).progress, 2 / 5);
  await e.advance(1600);
  assert.equal(e.progress.at(-1).completed, 2);
  e.assertRestored();
}
for (const reason of ['cleanup', 'pagehide', 'popstate', 'hidden'])
  for (let i = 0; i < 30; i++) {
    const e = environment({ busy: i % 2 ? null : 'false' });
    const cleanup = e.mount();
    if (i % 2) {
      e.observations[0].complete();
      e.finishSequence();
      await e.advance(1950);
    }
    if (reason === 'cleanup') cleanup();
    else if (reason === 'hidden') {
      e.document.hidden = true;
      e.document.emit('visibilitychange');
    } else e.window.emit(reason);
    e.assertRestored();
    assert.equal(e.completed, reason === 'cleanup' ? 0 : 1);
    cleanup();
    await e.advance(15000);
    e.assertRestored();
  }
// StrictMode retains the component decision; real later route mounts skip it.
{
  const e = environment();
  e.boot();
  const decision = e.claim();
  assert.equal(decision.play, true);
  const first = e.mount(decision);
  first();
  e.assertRestored();
  assert.equal(e.seen, 0);
  const second = e.mount(decision);
  e.observations[1].complete();
  e.finishSequence();
  await e.advance(3550);
  assert.equal(e.completed, 1);
  second();
  e.assertRestored();
  assert.equal(e.claim().play, false);
}
// A full document entry resets restored scroll/hash instead of skipping reload.
for (const config of [{ scroll: 850 }, { scroll: 850, hash: '#home-worlds' }]) {
  const e = environment(config);
  const cleanup = e.mount();
  assert.equal(e.completed, 0);
  assert.equal(e.window.scrollY, 0);
  assert.equal(e.observations.length, 1);
  e.window.scrollY = 400;
  e.window.emit('pageshow');
  assert.equal(e.window.scrollY, 0);
  cleanup();
  e.assertRestored();
}
for (const config of [{ hasOverlay: false }, { hasHome: false }]) {
  const e = environment(config);
  e.mount();
  assert.equal(e.completed, 1);
  assert.equal(e.observations.length, 0);
  e.assertRestored();
}
{
  const e = environment();
  e.mount({ play: false, force: false, startedAt: 0 });
  assert.equal(e.completed, 1);
  e.assertRestored();
}
{
  const e = environment();
  e.mount();
  e.observations[0].complete();
  e.finishSequence();
  await e.advance(1950);
  e.motion.matches = true;
  e.motion.emit('change');
  assert.equal(e.completed, 1);
  e.assertRestored();
}
// Pointer input is bounded, event-batched and absent on coarse/touch/reduced.
for (const config of [{ mobile: true }, { reduced: true }, { fine: false }]) {
  const e = environment(config);
  const cleanup = e.mount();
  e.overlay.emit('pointermove', {
    clientX: 5000,
    clientY: 5000,
    pointerType: 'mouse',
  });
  assert.equal(e.frames.size, 0);
  assert.equal(e.overlay.events.get('pointermove')?.size ?? 0, 0);
  cleanup();
  e.assertRestored();
}
{
  const e = environment();
  const cleanup = e.mount();
  for (let i = 0; i < 20; i++)
    e.overlay.emit('pointermove', {
      clientX: 5000,
      clientY: -500,
      pointerType: 'mouse',
    });
  assert.equal(e.frames.size, 1, 'one frame for a burst of pointer input');
  e.flushFrames();
  assert.equal(e.overlay.style.getPropertyValue('--hi-pointer-x'), '1');
  assert.equal(e.overlay.style.getPropertyValue('--hi-pointer-y'), '-1');
  assert.equal(e.frames.size, 0, 'no perpetual pointer loop');
  e.overlay.emit('pointerleave');
  assert.equal(e.overlay.style.getPropertyValue('--hi-pointer-x'), '0');
  e.overlay.emit('pointermove', {
    clientX: 800,
    clientY: 400,
    pointerType: 'touch',
  });
  assert.equal(e.frames.size, 0);
  e.overlay.emit('pointermove', { clientX: 1000, clientY: 400 });
  e.motion.matches = true;
  e.motion.emit('change');
  assert.equal(
    e.frames.size,
    0,
    'preference change cancels pending pointer work',
  );
  assert.equal(e.overlay.events.get('pointermove')?.size ?? 0, 0);
  cleanup();
  e.assertRestored();
}
console.log(
  'PASS: visible sequence minimum, 4s asset deadline, honest timeout, desktop/mobile/reduced exits, restored-scroll reset, StrictMode, 120 cleanup cycles and bounded pointer cleanup.',
);
