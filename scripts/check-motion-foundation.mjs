/** TP3D motion foundation: token sync, curves, tiers, cleanup and RAF
 * settling against browser doubles. No browser metrics are measured here. */
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import ts from 'typescript';
import { loadStoryMath } from './load-story-math.mjs';

const globals = {
  AbortController,
  setTimeout,
  clearTimeout,
};
const context = createContext(globals);
const modules = new Map();
function load(name) {
  if (modules.has(name)) return modules.get(name);
  assert.match(name, /^[a-z-]+$/);
  const loaded = { exports: {} };
  modules.set(name, loaded.exports);
  const source = readFileSync(
    new URL(`../lib/motion/${name}.ts`, import.meta.url),
    'utf8',
  );
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
    },
  });
  // Loading without window/document proves the modules are SSR-safe.
  runInContext(
    `(function (module, exports, require) {${outputText}\n})`,
    context,
  )(loaded, loaded.exports, (specifier) => {
    assert.match(specifier, /^\.\/[a-z-]+$/, `${name}: relative imports only`);
    return load(specifier.slice(2));
  });
  return loaded.exports;
}
const tokens = load('tokens');
const capability = load('capability');
const progress = load('progress');
const disposables = load('disposables');
const pointer = load('pointer');
const close = (a, b, label, tolerance = 1e-6) =>
  assert(Math.abs(a - b) <= tolerance, `${label}: ${a} vs ${b}`);

// The foundation stays dependency-free and never imports a renderer.
for (const file of readdirSync(new URL('../lib/motion/', import.meta.url))) {
  const source = readFileSync(
    new URL(`../lib/motion/${file}`, import.meta.url),
    'utf8',
  );
  assert.doesNotMatch(
    source,
    /from ['"](?!\.\/)/,
    `${file}: no package imports`,
  );
}

// CSS custom properties mirror the TS tokens exactly.
const css = readFileSync(
  new URL('../app/globals.css', import.meta.url),
  'utf8',
);
const root = css.match(/:root\s*\{([^}]*)\}/)?.[1] ?? '';
const cssToken = (name) =>
  root.match(new RegExp(`--${name}:\\s*([^;]+);`))?.[1].trim();
for (const [name, ms] of Object.entries(tokens.DURATION))
  assert.equal(
    cssToken(`motion-duration-${name}`),
    `${ms}ms`,
    `CSS duration ${name}`,
  );
for (const [name, curve] of Object.entries(tokens.EASE))
  assert.equal(
    cssToken(`motion-ease-${name}`),
    `cubic-bezier(${curve.join(', ')})`,
    `CSS easing ${name}`,
  );
assert.equal(tokens.cssEase('primary'), 'cubic-bezier(0.16, 1, 0.3, 1)');
assert.equal(tokens.cssEase('cinematic'), 'cubic-bezier(0.76, 0, 0.24, 1)');
assert.equal(
  tokens.transition('transform', 'fast'),
  'transform 400ms cubic-bezier(0.16, 1, 0.3, 1)',
);
assert.match(
  css,
  /@media \(prefers-reduced-motion: reduce\)\s*\{[^@]*animation: none !important;\s*transition: none !important;/,
  'global reduced-motion switch remains',
);

// CSS cannot read var() inside @keyframes timing functions, so the intro's
// keyframe curves are literals. They must still be token curves.
{
  const intro = readFileSync(
    new URL('../components/home/intro/home-intro.css', import.meta.url),
    'utf8',
  );
  const allowed = Object.values(tokens.EASE).map(
    (curve) => `cubic-bezier(${curve.join(', ')})`,
  );
  const literals = intro.match(/cubic-bezier\([^)]*\)/g) ?? [];
  assert(literals.length > 0, 'intro keyframes declare their curves');
  for (const literal of literals)
    assert(allowed.includes(literal), `${literal} is not a motion token curve`);
}

// Durations stay inside the PASS 00 bands and keep their order.
const bands = {
  micro: [200, 250],
  fast: [350, 450],
  normal: [600, 750],
  cinematic: [1000, 1300],
  entrance: [1400, 1700],
};
let previous = 0;
for (const [name, [min, max]] of Object.entries(bands)) {
  const value = tokens.DURATION[name];
  assert(
    value >= min && value <= max,
    `${name} ${value}ms outside ${min}–${max}`,
  );
  assert(value > previous, `${name} is longer than the previous token`);
  previous = value;
}

// The JS solver reproduces CSS timing functions.
const linear = tokens.cubicBezier(0, 0, 1, 1);
const easeInOut = tokens.cubicBezier(0.42, 0, 0.58, 1);
for (let i = 0; i <= 20; i++)
  close(linear(i / 20), i / 20, 'linear bezier', 1e-5);
close(easeInOut(0.5), 0.5, 'symmetric ease-in-out midpoint', 1e-5);
for (const [name, fn] of Object.entries(tokens.easing)) {
  assert.equal(fn(0), 0, `${name} starts at 0`);
  assert.equal(fn(1), 1, `${name} ends at 1`);
  for (let i = 1; i <= 400; i++)
    assert(fn(i / 400) >= fn((i - 1) / 400) - 1e-9, `${name} is monotonic`);
}
close(tokens.easing.cinematic(0.5), 0.5, 'cinematic curve is symmetric', 1e-4);
assert(
  tokens.easing.primary(0.3) > 0.8,
  'primary curve front-loads its travel',
);

// Tiers share the home story's breakpoints and depth ratios.
const { MOTION, motionProfile } = loadStoryMath('home-motion');
assert.equal(capability.MOTION_BREAKPOINTS.tablet, MOTION.breakpoints.mobile);
assert.equal(capability.MOTION_BREAKPOINTS.desktop, MOTION.breakpoints.desktop);
for (const [width, tier] of [
  [1440, 'desktop'],
  [1000, 'tablet'],
  [390, 'mobile'],
])
  assert.equal(
    tokens.AMPLITUDE[tier],
    motionProfile(width).depth,
    `${tier} amplitude`,
  );
assert.equal(tokens.AMPLITUDE.reduced, 0);
const { motionTier } = capability;
assert.equal(motionTier(1440, true, false), 'desktop');
assert.equal(motionTier(1440, false, false), 'tablet', 'large touch screen');
assert.equal(motionTier(1199, true, false), 'tablet');
assert.equal(motionTier(768, true, false), 'tablet');
assert.equal(motionTier(767, true, false), 'mobile');
assert.equal(motionTier(1440, true, true), 'reduced');
assert(tokens.MOTION_LIMITS.perspectivePx >= 1200, 'no aggressive perspective');

// Progress helpers match the home story formula.
close(progress.clamp01(-1), 0, 'clamp low');
close(progress.clamp01(2), 1, 'clamp high');
close(progress.progressBetween(5, 0, 10), 0.5, 'span midpoint');
assert.equal(progress.progressBetween(4, 5, 5), 0, 'zero-length span before');
assert.equal(progress.progressBetween(5, 5, 5), 1, 'zero-length span at end');
const story = { top: 120, height: 3240, viewport: 900 };
close(
  progress.scrollProgress(120 + 1170, story, 'sticky'),
  1170 / 2340,
  'sticky progress = (scrollY − top) / (height − viewport)',
);
const block = { top: 2000, height: 600, viewport: 800 };
close(
  progress.scrollProgress(1200, block),
  0,
  'viewport progress starts on entry',
);
close(
  progress.scrollProgress(2600, block),
  1,
  'viewport progress ends on exit',
);
close(progress.scrollProgress(1900, block), 0.5, 'viewport progress midpoint');

// Exponential approach is frame-rate independent and converges.
const { approach } = pointer;
close(
  approach(approach(0, 1, 8, 160), 1, 8, 160),
  approach(0, 1, 16, 160),
  'two 8ms steps equal one 16ms step',
);
close(approach(0, 1, 160, 160), 1 - Math.exp(-1), 'one tau covers 63%');
assert.equal(approach(0.4, 1, 0, 160), 0.4, 'no time, no motion');
assert.equal(approach(0.4, 1, 16, 0), 1, 'zero tau snaps');

// Disposables: reverse order, once, revert before kill, failures contained.
{
  const order = [];
  const bag = disposables.createDisposables();
  bag.add(() => order.push('first'));
  bag.add({
    kill: () => order.push('kill'),
    revert: () => order.push('revert'),
  });
  bag.add({ disconnect: () => order.push('disconnect') });
  bag.add({ dispose: () => order.push('dispose') });
  bag.add({ destroy: () => order.push('destroy') });
  bag.dispose();
  bag.dispose();
  assert.deepEqual(order, [
    'destroy',
    'dispose',
    'disconnect',
    'revert',
    'first',
  ]);
  assert(bag.signal.aborted && bag.disposed);
  bag.add(() => order.push('late'));
  assert.equal(order.at(-1), 'late', 'late resources are released at once');
}
{
  const order = [];
  const bag = disposables.createDisposables();
  bag.add(() => order.push('ran'));
  bag.add(() => {
    throw new Error('boom');
  });
  assert.throws(() => bag.dispose(), /boom/);
  assert.deepEqual(order, ['ran'], 'one failure does not leak the rest');
}

// Browser doubles for the DOM controllers.
class Target {
  listeners = new Map();
  addEventListener(type, listener) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(listener);
  }
  removeEventListener(type, listener) {
    this.listeners.get(type)?.delete(listener);
  }
  dispatch(type, event = {}) {
    // Copy first: a listener may remove itself while being dispatched.
    for (const listener of Array.from(this.listeners.get(type) ?? []))
      listener(event);
  }
  get count() {
    let count = 0;
    for (const set of this.listeners.values()) count += set.size;
    return count;
  }
}
// Object.assign would freeze getters into values; keep them live.
const extend = (target, source) =>
  Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
function environment({ width = 1440, fine = true, reduced = false } = {}) {
  const state = { width, fine, reduced };
  const lists = new Map();
  const frames = new Map();
  let nextFrame = 1;
  const matches = (query) =>
    query === capability.MOTION_QUERIES.reduced
      ? state.reduced
      : query === capability.MOTION_QUERIES.finePointer
        ? state.fine
        : query === capability.MOTION_QUERIES.pointerMotion
          ? state.fine && !state.reduced
          : state.width >= Number(query.match(/min-width: (\d+)px/)[1]);
  const window = extend(new Target(), {
    scrollY: 0,
    innerHeight: 800,
    get innerWidth() {
      return state.width;
    },
    matchMedia(query) {
      if (!lists.has(query))
        lists.set(
          query,
          extend(new Target(), {
            get matches() {
              return matches(query);
            },
          }),
        );
      return lists.get(query);
    },
  });
  const observers = [];
  Object.assign(globals, {
    window,
    document: Object.assign(new Target(), {
      hidden: false,
      documentElement: {},
    }),
    navigator: { connection: { saveData: false } },
    requestAnimationFrame(callback) {
      frames.set(nextFrame, callback);
      return nextFrame++;
    },
    cancelAnimationFrame(id) {
      frames.delete(id);
    },
    ResizeObserver: class {
      observed = 0;
      constructor(callback) {
        this.callback = callback;
        observers.push(this);
      }
      observe() {
        this.observed++;
      }
      disconnect() {
        this.observed = 0;
      }
    },
  });
  return {
    state,
    window,
    lists,
    observers,
    frames,
    flush(now) {
      const pending = [...frames.entries()];
      frames.clear();
      for (const [, callback] of pending) callback(now);
    },
  };
}

// Capability snapshots are cached until an input changes.
{
  const env = environment({ width: 1440 });
  const first = capability.readMotionCapability();
  assert.equal(first, capability.readMotionCapability(), 'stable snapshot');
  assert.equal(first.tier, 'desktop');
  assert.equal(first.amplitude, 1);
  env.state.width = 1000;
  const tablet = capability.readMotionCapability();
  assert.notEqual(tablet, first);
  assert.equal(tablet.tier, 'tablet');
  assert.equal(tablet.amplitude, 0.75);
  env.state.reduced = true;
  assert.equal(capability.readMotionCapability().amplitude, 0);
  let calls = 0;
  const stop = capability.subscribeMotionCapability(() => calls++);
  for (const list of env.lists.values()) list.dispatch('change');
  assert(calls >= 4, 'tier, pointer and reduced-motion queries notify');
  stop();
  for (const list of env.lists.values())
    assert.equal(list.count, 0, 'unsubscribed');
}

// Pointer follower: mouse only, settles and stops, eases home, cleans up.
{
  const env = environment();
  const element = Object.assign(new Target(), {
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 200, height: 100 }),
  });
  const painted = [];
  const stop = pointer.createPointerFollower(element, (x, y) =>
    painted.push([x, y]),
  );
  element.dispatch('pointermove', {
    pointerType: 'touch',
    clientX: 200,
    clientY: 100,
  });
  assert.equal(env.frames.size, 0, 'touch never drives pointer motion');
  element.dispatch('pointermove', {
    pointerType: 'mouse',
    clientX: 200,
    clientY: 100,
  });
  assert.equal(env.frames.size, 1, 'one RAF per burst');
  element.dispatch('pointermove', {
    pointerType: 'mouse',
    clientX: 150,
    clientY: 75,
  });
  assert.equal(env.frames.size, 1, 'moves are coalesced');
  let now = 0;
  let steps = 0;
  while (env.frames.size && steps < 500) {
    env.flush((now += 16));
    steps++;
  }
  assert(steps < 500 && env.frames.size === 0, 'RAF stops once settled');
  assert.deepEqual(painted.at(-1), [0.5, 0.5], 'settles exactly on target');
  assert(steps > 10, 'interpolated, not snapped');
  element.dispatch('pointerleave');
  while (env.frames.size) env.flush((now += 16));
  assert.deepEqual(painted.at(-1), [0, 0], 'leaving eases back to rest');
  element.dispatch('pointermove', {
    pointerType: 'mouse',
    clientX: 200,
    clientY: 100,
  });
  env.state.reduced = true;
  env.window
    .matchMedia(capability.MOTION_QUERIES.pointerMotion)
    .dispatch('change');
  assert.equal(env.frames.size, 0, 'reduced motion cancels the frame');
  assert.deepEqual(painted.at(-1), [0, 0], 'reduced motion rests immediately');
  element.dispatch('pointermove', {
    pointerType: 'mouse',
    clientX: 200,
    clientY: 100,
  });
  assert.equal(env.frames.size, 0, 'no pointer motion while reduced');
  stop();
  assert.equal(element.count, 0, 'element listeners removed');
  assert.equal(env.window.count, 0, 'window listeners removed');
  assert.equal(globals.document.count, 0, 'document listeners removed');
  for (const list of env.lists.values())
    assert.equal(list.count, 0, 'media listeners removed');
}

// Scroll progress: cached geometry, change-only callbacks, full cleanup.
{
  const env = environment();
  let measured = 0;
  const element = {
    getBoundingClientRect: () => {
      measured++;
      return { top: 1000 - env.window.scrollY, height: 500 };
    },
  };
  const values = [];
  const stop = progress.createScrollProgress(element, (value) =>
    values.push(value),
  );
  assert.deepEqual(values, [0], 'initial progress is reported');
  env.window.scrollY = 850;
  env.window.dispatch('scroll');
  env.window.dispatch('scroll');
  assert.equal(env.frames.size, 1, 'scroll bursts share one RAF');
  env.flush(16);
  close(values.at(-1), 0.5, 'viewport progress from cached geometry');
  assert.equal(measured, 1, 'no layout read on scroll');
  env.window.dispatch('scroll');
  env.flush(32);
  assert.equal(values.length, 2, 'unchanged progress is not re-reported');
  env.window.dispatch('resize');
  env.flush(48);
  assert.equal(measured, 2, 'resize re-measures once');
  stop();
  assert.equal(env.window.count, 0, 'scroll/resize listeners removed');
  assert.equal(env.frames.size, 0, 'no pending frame after cleanup');
  assert(
    env.observers.every((observer) => observer.observed === 0),
    'observer disconnected',
  );
}

console.log('motion foundation checks passed');
