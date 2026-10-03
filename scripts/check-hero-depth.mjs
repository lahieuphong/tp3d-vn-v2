/** Scene 1 pointer depth: tier gating, scroll hand-off, settling and cleanup
 * against browser doubles. No browser frame rates are measured here. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import ts from 'typescript';
import { loadStoryMath } from './load-story-math.mjs';

const context = createContext({});
const libraries = new Map();
function compile(url) {
  return ts.transpileModule(readFileSync(url, 'utf8'), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
    },
  }).outputText;
}
function library(name) {
  if (libraries.has(name)) return libraries.get(name);
  const loaded = { exports: {} };
  libraries.set(name, loaded.exports);
  runInContext(
    `(function (module, exports, require) {${compile(new URL(`../lib/motion/${name}.ts`, import.meta.url))}\n})`,
    context,
  )(loaded, loaded.exports, (specifier) => library(specifier.slice(2)));
  return loaded.exports;
}
const depth = { exports: {} };
runInContext(
  `(function (module, exports, require) {${compile(new URL('../components/home/experience/hero-depth.ts', import.meta.url))}\n})`,
  context,
)(depth, depth.exports, (specifier) => {
  if (specifier.startsWith('@/lib/motion/'))
    return library(specifier.slice('@/lib/motion/'.length));
  assert.equal(specifier, './home-story-frame');
  return loadStoryMath('home-story-frame');
});
const { HERO_DEPTH, heroDepthWeight, heroDepthFrame, createHeroDepth } =
  depth.exports;
const { tpTiming } = loadStoryMath('home-story-frame');
const { MOTION_LIMITS } = library('tokens');

// Limits and the scroll hand-off.
assert(HERO_DEPTH.near.x <= MOTION_LIMITS.parallaxPx, 'near plane ceiling');
assert(HERO_DEPTH.mid.x < HERO_DEPTH.near.x, 'mid plane moves less');
assert.equal(heroDepthWeight(0), 1, 'full depth at rest');
assert.equal(heroDepthWeight(tpTiming.hold), 0, 'none once the TP travels');
for (let p = 0.002; p <= 0.2; p += 0.002)
  assert(heroDepthWeight(p) <= heroDepthWeight(p - 0.002), 'monotonic');
assert.deepEqual({ ...heroDepthFrame(0, 0, 1) }, { mid: '', near: '' });
assert.deepEqual({ ...heroDepthFrame(1, 1, 0) }, { mid: '', near: '' });
assert.deepEqual(
  { ...heroDepthFrame(1, -1, 1) },
  {
    mid: 'translate3d(-3.000px, 2.000px, 0)',
    near: 'translate3d(-6.000px, 3.500px, 0)',
  },
);

class Target {
  listeners = new Map();
  addEventListener(type, listener) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(listener);
  }
  removeEventListener(type, listener) {
    this.listeners.get(type)?.delete(listener);
  }
  emit(type, event = {}) {
    for (const listener of Array.from(this.listeners.get(type) ?? []))
      listener(event);
  }
  get count() {
    let count = 0;
    for (const set of this.listeners.values()) count += set.size;
    return count;
  }
}
class Element {
  style = {
    transform: '',
    removeProperty: (name) => {
      this.style[name] = '';
    },
  };
}
function fixture() {
  const html = new Target();
  const attributes = new Set();
  html.hasAttribute = (name) => attributes.has(name);
  const window = new Target();
  Object.assign(context, { window, document: { documentElement: html } });
  const mid = new Element();
  const portals = [new Element(), new Element(), new Element(), new Element()];
  const stage = {
    querySelector: (selector) => {
      assert.equal(selector, '.sh-monogram > [data-hero-surface]');
      return mid;
    },
    querySelectorAll: (selector) => {
      assert.equal(selector, '.sh-portal');
      return portals;
    },
  };
  let wakes = 0;
  const driver = createHeroDepth(stage, () => wakes++);
  const input = {
    progress: 0,
    width: 1440,
    height: 900,
    fine: true,
    reduced: false,
    visible: true,
  };
  return {
    html,
    attributes,
    window,
    mid,
    portals,
    driver,
    input,
    get wakes() {
      return wakes;
    },
    settle(start = 16) {
      let now = start;
      let steps = 0;
      while (driver.wantsTime() && steps < 400) {
        driver.tick((now += 16));
        steps++;
      }
      return steps;
    },
  };
}

// Desktop: eases on the master clock, settles, and returns home on leave.
{
  const f = fixture();
  f.driver.update(f.input);
  f.window.emit('pointermove', {
    pointerType: 'touch',
    clientX: 1440,
    clientY: 0,
  });
  assert.equal(f.wakes, 0, 'touch never drives depth');
  f.window.emit('pointermove', {
    pointerType: 'mouse',
    clientX: 1440,
    clientY: 0,
  });
  assert.equal(f.wakes, 1, 'pointer input asks the master for one frame');
  assert(f.driver.wantsTime());
  const steps = f.settle();
  assert(steps > 10 && steps < 400, 'interpolated and then idle');
  assert.equal(f.mid.style.transform, 'translate3d(-3.000px, 2.000px, 0)');
  for (const portal of f.portals)
    assert.equal(portal.style.transform, 'translate3d(-6.000px, 3.500px, 0)');
  assert.equal(f.driver.wantsTime(), false, 'no frames once settled');
  // Scroll takes over: the same pointer target weighs less, without easing.
  f.driver.update({ ...f.input, progress: tpTiming.hold / 2 });
  assert.equal(f.mid.style.transform, 'translate3d(-1.500px, 1.000px, 0)');
  f.driver.update({ ...f.input, progress: tpTiming.hold });
  assert.equal(f.mid.style.transform, '', 'scroll-driven dolly owns p ≥ hold');
  assert.equal(f.driver.wantsTime(), false);
  f.driver.update(f.input);
  f.window.emit('pointermove', {
    pointerType: 'mouse',
    clientX: 1440,
    clientY: 900,
  });
  f.settle();
  f.html.emit('pointerleave');
  f.settle();
  assert.equal(f.mid.style.transform, '', 'leaving the window rests');
  f.driver.destroy();
  assert.equal(f.window.count + f.html.count, 0, 'listeners removed');
}

// Tiers without pointer depth: tablet width, coarse pointer, reduced motion.
for (const override of [{ width: 1000 }, { fine: false }, { reduced: true }]) {
  const f = fixture();
  f.driver.update({ ...f.input, ...override });
  f.window.emit('pointermove', {
    pointerType: 'mouse',
    clientX: 1440,
    clientY: 0,
  });
  assert.equal(f.wakes, 0, `${JSON.stringify(override)} has no pointer depth`);
  assert.equal(f.mid.style.transform, '');
  f.driver.destroy();
}

// The intro gate blocks input live; capability loss and hidden tabs rest.
{
  const f = fixture();
  f.attributes.add('data-home-intro');
  f.driver.update(f.input);
  f.window.emit('pointermove', {
    pointerType: 'mouse',
    clientX: 0,
    clientY: 0,
  });
  assert.equal(f.wakes, 0, 'no pointer depth during the intro');
  f.attributes.delete('data-home-intro');
  f.window.emit('pointermove', {
    pointerType: 'mouse',
    clientX: 0,
    clientY: 0,
  });
  assert.equal(f.wakes, 1, 'available as soon as the gate releases');
  f.settle();
  assert.notEqual(f.mid.style.transform, '');
  f.driver.update({ ...f.input, reduced: true });
  assert.equal(f.mid.style.transform, '', 'reduced motion rests at once');
  f.driver.update(f.input);
  f.window.emit('pointermove', {
    pointerType: 'mouse',
    clientX: 0,
    clientY: 0,
  });
  f.settle();
  f.driver.suspend();
  assert.equal(f.mid.style.transform, '', 'hidden tab rests at once');
  assert.equal(f.driver.wantsTime(), false);
  f.window.emit('pointermove', {
    pointerType: 'mouse',
    clientX: 0,
    clientY: 0,
  });
  f.settle();
  f.driver.destroy();
  assert.equal(f.mid.style.transform, '', 'destroy clears inline transforms');
  for (const portal of f.portals) assert.equal(portal.style.transform, '');
}
console.log(
  'Hero depth passed: desktop-only planes, touch/coarse/reduced/intro gates, master-clock settling, scroll hand-off, limits and cleanup.',
);
