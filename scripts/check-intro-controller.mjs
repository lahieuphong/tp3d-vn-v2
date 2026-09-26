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
const sessionSource = compile('../components/home/intro/intro-session.ts');
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
    home = new Node(),
    header = new Node(),
    footer = new Node(),
    skip = new Node();
  overlay.querySelector = (selector) =>
    selector === '.hi-panel-bottom' ? bottom : null;
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
    matchMedia: (query) =>
      query.includes('reduced-motion')
        ? motion
        : query.includes('max-width')
          ? compact
          : fineDesktop,
  });
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
      value: { completed: 0, total: 6, failed: 0, progress: 0 },
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
      record.value = { completed: 6, total: 6, failed: 0, progress: 1 };
      options.onProgress(record.value);
      finish();
    };
    record.partial = () => {
      record.value = { completed: 2, total: 6, failed: 1, progress: 2 / 6 };
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
    performance,
    sessionStorage,
    URLSearchParams,
    AbortController,
    requestAnimationFrame,
    cancelAnimationFrame,
    setTimeout,
    clearTimeout,
  });
  runInContext(sessionSource, context);
  const session = context.exports;
  context.exports = {};
  context.require = (name) =>
    name === './critical-assets'
      ? { preloadHomeCriticalAssets: assets }
      : name === './intro-session'
        ? session
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
      runInContext(session.HOME_INTRO_BOOTSTRAP, context);
    },
    claim: session.claimHomeIntro,
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
      assert.equal(html.getAttribute('data-home-intro'), null);
      assert.equal(
        html.getAttribute('data-home-intro-header'),
        null,
        'header handoff attribute is always released',
      );
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

// Cached assets respect minimum time measured from the pre-paint bootstrap,
// not a fresh 1200ms after React mounts.
for (const start of [0, 650]) {
  const e = environment({ now: start });
  const cleanup = e.mount();
  assert.equal(e.html.dataset.homeIntro, 'waiting');
  e.overlay.emit('animationend', {
    animationName: 'hi-bottom-open',
    target: e.bottom,
  });
  assert.equal(
    e.completed,
    0,
    'split completion must not end the waiting phase',
  );
  assert.equal(e.home.getAttribute('aria-busy'), 'true');
  assert.equal(e.observations[0].options.timeoutMs, 4000 - start);
  e.observations[0].complete();
  await e.advance(1199 - start);
  assert.equal(e.html.dataset.homeIntro, 'waiting');
  await e.advance(1);
  assert.equal(e.html.dataset.homeIntro, 'ready');
  await e.advance(239);
  assert.equal(e.html.dataset.homeIntro, 'ready');
  await e.advance(1);
  assert.equal(e.html.dataset.homeIntro, 'revealing');
  assert.equal(e.html.style.getPropertyValue('--hi-duration'), '1400ms');
  await e.advance(1400);
  e.overlay.emit('animationend', {
    animationName: 'hi-bottom-open',
    target: e.overlay,
  });
  assert.equal(e.completed, 0, 'only the bottom panel owns split completion');
  e.overlay.emit('animationend', {
    animationName: 'hi-bottom-open',
    target: e.bottom,
  });
  assert.equal(e.completed, 1);
  assert.equal(e.seen, 1);
  e.assertRestored();
  cleanup();
  await e.advance(10000);
  assert.equal(
    e.completed,
    1,
    'cleanup and expired fallbacks cannot complete twice',
  );
}

for (const { config, duration, phase, animation } of [
  {
    config: { mobile: true },
    duration: 1000,
    phase: 'revealing',
    animation: 'hi-bottom-open',
  },
  {
    config: { reduced: true },
    duration: 300,
    phase: 'reduced',
    animation: 'hi-reduced-exit',
  },
]) {
  const e = environment(config);
  e.mount();
  e.observations[0].complete();
  await e.advance(1200 + (config.reduced ? 0 : 240));
  assert.equal(e.html.dataset.homeIntro, phase);
  assert.equal(e.html.style.getPropertyValue('--hi-duration'), `${duration}ms`);
  e.overlay.emit('animationend', { animationName: 'hi-wordmark-enter' });
  assert.equal(e.completed, 0, 'entrance animation must not dismiss overlay');
  await e.advance(duration);
  e.overlay.emit('animationend', {
    animationName: animation,
    target: config.reduced ? e.overlay : e.bottom,
  });
  e.assertRestored();
}

// An absent CSS animationend still releases everything after its finite guard.
for (const config of [{}, { mobile: true }, { reduced: true }]) {
  const e = environment(config);
  e.mount();
  e.observations[0].complete();
  const untilFallback =
    1200 +
    (config.reduced ? 0 : 240) +
    (config.reduced ? 300 : config.mobile ? 1000 : 1400) +
    100;
  await e.advance(untilFallback - 1);
  assert.equal(e.completed, 0);
  await e.advance(1);
  assert.equal(e.completed, 1);
  e.assertRestored();
}

// A hanging asset releases at the original max deadline with honest partial
// progress. The reveal never fabricates completion or a 100% update.
{
  const e = environment({ now: 1300 });
  e.mount();
  e.observations[0].partial();
  assert.equal(e.observations[0].options.timeoutMs, 2700);
  await e.advance(2699);
  assert.equal(e.html.dataset.homeIntro, 'waiting');
  await e.advance(1);
  assert.equal(e.html.dataset.homeIntro, 'ready');
  assert.equal(e.progress.at(-1).progress, 2 / 6);
  assert.equal(e.progress.length, 2);
  await e.advance(240 + 1400 + 100);
  assert.equal(e.progress.at(-1).completed, 2);
  e.assertRestored();
}

for (const reason of ['cleanup', 'pagehide', 'popstate', 'hidden']) {
  for (let i = 0; i < 30; i++) {
    const e = environment({ busy: i % 2 ? null : 'false' });
    const cleanup = e.mount();
    if (i % 2) {
      e.observations[0].complete();
      await e.advance(1440);
    }
    if (reason === 'cleanup') cleanup();
    else if (reason === 'hidden') {
      e.document.hidden = true;
      e.document.emit('visibilitychange');
    } else e.window.emit(reason);
    e.assertRestored();
    assert.equal(e.completed, reason === 'cleanup' ? 0 : 1);
    assert.equal(e.seen, reason === 'cleanup' ? 0 : 1);
    cleanup();
    await e.advance(15000);
    e.assertRestored();
  }
}

// StrictMode setup → cleanup → setup retains the component's ref decision.
// Cleanup does not mark seen or set React state; the second setup owns a fresh
// observer/lock. This exercises controller replay, not a React renderer.
{
  const e = environment();
  e.boot();
  const decisionRef = { current: e.claim() };
  assert.equal(decisionRef.current.play, true);
  const first = e.mount(decisionRef.current);
  first();
  e.assertRestored();
  assert.equal(e.completed, 0);
  assert.equal(e.seen, 0);
  const second = e.mount(decisionRef.current);
  assert.equal(e.html.dataset.homeIntro, 'waiting');
  assert.equal(e.observations.length, 2);
  e.observations[1].complete();
  await e.advance(2940);
  assert.equal(e.completed, 1);
  second();
  e.assertRestored();
  assert.equal(
    e.claim().play,
    false,
    'a real later mount cannot replay the document claim',
  );
}

for (const config of [
  { scroll: 100 },
  { hash: '#home-worlds' },
  { hasOverlay: false },
  { hasHome: false },
]) {
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
  assert.equal(e.observations.length, 0);
  e.assertRestored();
}
{
  const e = environment();
  e.mount();
  e.observations[0].complete();
  await e.advance(1440);
  e.motion.matches = true;
  e.motion.emit('change');
  assert.equal(e.completed, 1);
  e.assertRestored();
}
// Keep the shared header's original geometry until its opacity is zero,
// then perform one discrete swap. Every early exit cancels the delayed swap.
for (const config of [{}, { mobile: true }, { reduced: true }]) {
  const e = environment(config);
  const cleanup = e.mount();
  e.observations[0].complete();
  await e.advance(1200 + (config.reduced ? 0 : 240));
  const switchAfter = config.reduced ? 150 : config.mobile ? 250 : 350;
  assert.equal(e.html.getAttribute('data-home-intro-header'), null);
  await e.advance(switchAfter - 1);
  assert.equal(e.html.getAttribute('data-home-intro-header'), null);
  await e.advance(1);
  assert.equal(e.html.getAttribute('data-home-intro-header'), 'home');
  cleanup();
  e.assertRestored();
  await e.advance(3000);
  e.assertRestored();
}
{
  const e = environment();
  const cleanup = e.mount();
  e.observations[0].complete();
  await e.advance(1440 + 349);
  cleanup();
  await e.advance(3000);
  e.assertRestored();
}
{
  const e = environment();
  e.html.setAttribute('data-home-intro-header', 'home');
  e.mount({ play: false, force: false, startedAt: 0 });
  e.assertRestored();
}
// Pointer interaction is bounded to eligible loader instances. A burst writes
// its latest coordinates once, and an idle pointer schedules no further work.
{
  const e = environment();
  const cleanup = e.mount();
  assert.equal(e.frames.size, 0, 'mount starts no permanent animation loop');
  for (let i = 0; i < 20; i++)
    e.overlay.emit('pointermove', { clientX: i * 72, clientY: i * 45 });
  e.overlay.emit('pointermove', { clientX: 1440, clientY: 900 });
  assert.equal(e.frames.size, 1, 'pointer bursts share one pending frame');
  e.flushFrames();
  assert.equal(e.overlay.style.getPropertyValue('--hi-pointer-x'), '1.0000');
  assert.equal(e.overlay.style.getPropertyValue('--hi-pointer-y'), '1.0000');
  assert.equal(e.frames.size, 0, 'one write never schedules another frame');
  e.overlay.emit('pointermove', { clientX: -100, clientY: -100 });
  e.flushFrames();
  assert.equal(e.overlay.style.getPropertyValue('--hi-pointer-x'), '-1.0000');
  e.window.innerWidth = 1200;
  e.window.innerHeight = 800;
  e.window.emit('resize');
  e.overlay.emit('pointermove', { clientX: 600, clientY: 400 });
  e.flushFrames();
  assert.equal(e.overlay.style.getPropertyValue('--hi-pointer-x'), '0.0000');
  assert.equal(e.overlay.style.getPropertyValue('--hi-pointer-y'), '0.0000');
  e.overlay.emit('pointermove', { clientX: 500, clientY: 500 });
  e.overlay.emit('pointerleave');
  assert.equal(e.frames.size, 0, 'leaving cancels pending work');
  assert.equal(e.overlay.style.getPropertyValue('--hi-pointer-x'), '0');
  e.overlay.emit('pointermove', { clientX: NaN, clientY: 1 });
  assert.equal(e.frames.size, 0, 'invalid coordinates are ignored');
  e.overlay.emit('pointermove', { clientX: 700, clientY: 100 });
  cleanup();
  e.assertRestored();
}
for (const config of [
  { mobile: true },
  { width: 820 },
  { fine: false },
  { reduced: true },
]) {
  const e = environment(config);
  const cleanup = e.mount();
  assert.equal(e.overlay.events.get('pointermove')?.size ?? 0, 0);
  e.overlay.emit('pointermove', { clientX: 200, clientY: 300 });
  assert.equal(
    e.frames.size,
    0,
    'mobile, tablet, coarse pointer and reduced motion stay static',
  );
  cleanup();
  e.assertRestored();
}
{
  const e = environment();
  const cleanup = e.mount();
  e.overlay.emit('pointermove', { clientX: 300, clientY: 300 });
  e.motion.matches = true;
  e.motion.emit('change');
  assert.equal(
    e.frames.size,
    0,
    'reduced-motion change cancels pending pointer work',
  );
  assert.equal(e.overlay.events.get('pointermove').size, 0);
  e.motion.matches = false;
  e.motion.emit('change');
  assert.equal(e.overlay.events.get('pointermove').size, 1);
  e.fineDesktop.matches = false;
  e.fineDesktop.emit('change');
  assert.equal(e.overlay.events.get('pointermove').size, 0);
  cleanup();
  e.assertRestored();
}
console.log(
  'PASS: intro min/max deadlines, desktop/mobile/reduced exit timing, honest timeout progress, exact style/inert/aria restoration, StrictMode decision replay, discrete header handoff, bounded desktop pointer frames and 120 cleanup/navigation lifecycles.',
);
