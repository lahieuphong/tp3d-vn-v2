/** Deterministic asset-observer checks. These do not measure browser rendering,
 * network timing, memory consumption or perceived animation smoothness. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const source = readFileSync(
  new URL('../components/home/intro/critical-assets.ts', import.meta.url),
  'utf8',
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
});
const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
};
const flush = async () => {
  for (let i = 0; i < 12; i++) await Promise.resolve();
};

function fixture({
  cached = false,
  fontResults,
  noFonts = false,
  development = false,
} = {}) {
  const timers = new Map();
  const callbacks = [];
  const fontCalls = [];
  const warnings = [];
  let timerId = 0;
  class ImageNode {
    constructor(src) {
      this.source = src;
      this.currentSrc = src;
      this.complete = cached;
      this.naturalWidth = cached ? 1440 : 0;
      this.listeners = new Map();
      this.dataset = {};
      this.decodeCalls = 0;
      this.decodeResult = () => Promise.resolve();
    }
    addEventListener(type, callback) {
      const group = this.listeners.get(type) ?? new Set();
      group.add(callback);
      this.listeners.set(type, group);
    }
    removeEventListener(type, callback) {
      this.listeners.get(type)?.delete(callback);
    }
    dispatch(type) {
      for (const callback of this.listeners.get(type) ?? []) callback();
    }
    getAttribute(name) {
      assert.ok(['src', 'srcset', 'sizes'].includes(name));
      return name === 'src' ? this.source : null;
    }
    decode() {
      this.decodeCalls++;
      return this.decodeResult();
    }
    load() {
      this.complete = true;
      this.naturalWidth = 1440;
      this.dispatch('load');
    }
    listenerCount() {
      return [...this.listeners.values()].reduce(
        (sum, set) => sum + set.size,
        0,
      );
    }
  }
  const images = [
    new ImageNode('/architecture.webp'),
    ...Array.from({ length: 4 }, () => new ImageNode('/portal-atlas.webp')),
  ];
  const fonts = noFonts
    ? undefined
    : {
        get ready() {
          throw new Error('Must not wait for every document font');
        },
        load(font, text) {
          const index = fontCalls.length;
          fontCalls.push({ font, text });
          return fontResults?.[index]?.() ?? Promise.resolve([{}]);
        },
      };
  const root = {
    ownerDocument: { fonts },
    querySelectorAll(selector) {
      assert.equal(
        selector,
        '[data-hero-layer="architecture-a"] img, .sh-monogram img, .sh-portals img',
      );
      return images;
    },
  };
  const compiled = { exports: {} };
  runInNewContext(outputText, {
    module: compiled,
    exports: compiled.exports,
    process: { env: { NODE_ENV: development ? 'development' : 'production' } },
    console: { warn: (...args) => warnings.push(args) },
    setTimeout(callback, delay) {
      timers.set(++timerId, { callback, delay });
      return timerId;
    },
    clearTimeout(id) {
      timers.delete(id);
    },
    Image() {
      throw new Error('Must observe existing DOM; never create another Image');
    },
    fetch() {
      throw new Error('Must not create a second network request');
    },
  });
  const start = (options = {}) =>
    compiled.exports.preloadHomeCriticalAssets(root, {
      onProgress: (value) => callbacks.push({ ...value }),
      ...options,
    });
  return {
    images,
    callbacks,
    fontCalls,
    warnings,
    timers,
    root,
    start,
    timeout() {
      for (const [id, { callback }] of timers) {
        timers.delete(id);
        callback();
      }
    },
    assertClean() {
      assert.equal(timers.size, 0, 'maximum-wait timer released');
      for (const image of images) {
        assert.equal(image.listenerCount(), 0, 'image listeners released');
      }
    },
  };
}

// Cached resources still decode before completion, with one task per atlas.
{
  const f = fixture({ cached: true });
  const task = f.start();
  assert.equal(f.callbacks[0].completed, 0);
  assert.equal(f.callbacks[0].total, 5);
  const result = await task.promise;
  assert.equal(result.completed, 5);
  assert.equal(result.total, 5);
  assert.equal(result.failed, 0);
  assert.equal(result.progress, 1);
  assert.equal(result.timedOut, false);
  assert.equal(result.cancelled, false);
  assert.deepEqual(
    f.images.map((image) => image.decodeCalls),
    [1, 1, 0, 0, 0],
  );
  assert.equal(f.fontCalls.length, 3);
  assert.ok(f.fontCalls.every(({ font }) => font.includes('Spatial')));
  assert.ok(f.fontCalls[0].text.includes('tân phong'));
  assert.deepEqual(
    f.callbacks.map(({ completed }) => completed),
    [0, 1, 2, 3, 4, 5],
  );
  f.assertClean();
}

// Pending images are observed in place; load and decode are separate gates.
{
  const f = fixture();
  const decode = deferred();
  f.images[0].decodeResult = () => decode.promise;
  const task = f.start();
  await flush();
  assert.equal(f.callbacks.at(-1).completed, 3, 'fonts only');
  f.images.forEach((image) => image.load());
  await flush();
  assert.equal(
    f.callbacks.at(-1).completed,
    4,
    'background decode still pending',
  );
  decode.resolve();
  assert.equal((await task.promise).completed, 5);
  f.assertClean();
}

// 404, decode rejection and font failure all settle; the shared atlas fallback
// is applied to each of its four rendered portal images.
{
  const f = fixture({
    fontResults: [
      () => Promise.reject(new Error('font unavailable')),
      () => Promise.resolve([]),
      () => Promise.resolve([{}]),
    ],
  });
  f.images[0].decodeResult = () => Promise.reject(new Error('decode failed'));
  const task = f.start();
  f.images[0].load();
  f.images[1].dispatch('error');
  const result = await task.promise;
  assert.equal(result.completed, 5);
  assert.equal(result.failed, 4);
  assert.equal(result.timedOut, false);
  assert.equal(f.images[0].dataset.criticalState, 'failed');
  assert.equal(f.warnings.length, 0, 'production asset failures stay silent');
  assert.ok(
    f.images
      .slice(1)
      .every((image) => image.dataset.criticalState === 'failed'),
  );
  f.assertClean();
}

// Broken cached images and synchronous decode exceptions also cannot hang.
{
  const f = fixture({ cached: true });
  f.images[0].naturalWidth = 0;
  f.images[1].decodeResult = () => {
    throw new Error('unsupported decode');
  };
  const result = await f.start().promise;
  assert.equal(result.failed, 2);
  assert.equal(result.completed, 5);
  assert.equal(f.images[2].dataset.criticalState, 'failed');
  f.assertClean();
}

// A browser without decode() still settles each image after load, without
// adding a raster dependency for the inline shared Breeze.
{
  const f = fixture({ cached: true });
  f.images[0].decode = undefined;
  f.images[1].decode = undefined;
  const result = await f.start().promise;
  assert.equal(result.completed, 5);
  assert.equal(result.failed, 0);
  f.assertClean();
}

// A hanging font and a hanging decode hit one maximum wait. Pending assets
// retain their genuine progress and may continue browser loading afterward.
{
  const font = deferred();
  const image = deferred();
  const f = fixture({ fontResults: [() => font.promise] });
  f.images[0].decodeResult = () => image.promise;
  const task = f.start({ timeoutMs: 4000 });
  f.images[0].load();
  await flush();
  assert.equal([...f.timers.values()][0].delay, 4000);
  f.timeout();
  const result = await task.promise;
  assert.equal(result.timedOut, true);
  assert.equal(result.cancelled, false);
  assert.equal(result.completed, 2);
  assert.equal(result.progress, 2 / 5);
  assert.equal(result.failed, 0);
  f.assertClean();
  const count = f.callbacks.length;
  font.resolve([{}]);
  image.reject(new Error('late decode failure'));
  f.images.forEach((node) => node.dispatch('error'));
  await flush();
  assert.equal(f.callbacks.length, count, 'no late progress after timeout');
  assert.ok(f.images.every((node) => node.dataset.criticalState === undefined));
  assert.equal(f.warnings.length, 0, 'production timeout stays silent');
}

// Development gets one actionable summary, never repeated per frame or after
// cancellation. Resource names distinguish failed files from a hung gate.
{
  const f = fixture({ development: true });
  const task = f.start();
  f.images[0].dispatch('error');
  await flush();
  f.timeout();
  await task.promise;
  assert.equal(f.warnings.length, 1);
  assert.equal(f.warnings[0][1].timedOut, true);
  assert.deepEqual(
    [...f.warnings[0][1].failedResources],
    ['/architecture.webp'],
  );
  assert.deepEqual(
    [...f.warnings[0][1].pendingResources],
    ['/portal-atlas.webp'],
  );
  task.cancel();
  assert.equal(f.warnings.length, 1);
  f.assertClean();
}
{
  const f = fixture({ development: true });
  const task = f.start();
  task.cancel();
  await task.promise;
  assert.equal(
    f.warnings.length,
    0,
    'route cancellation is not an asset error',
  );
  f.assertClean();
}

// Repeated mount/unmount and signal abort release every owned resource.
for (let i = 0; i < 30; i++) {
  const f = fixture();
  const signal = new AbortController();
  const task = f.start({ signal: signal.signal });
  if (i % 2) signal.abort();
  else task.cancel();
  const result = await task.promise;
  assert.equal(result.cancelled, true);
  assert.equal(result.timedOut, false);
  f.assertClean();
  const count = f.callbacks.length;
  f.images.forEach((image) => image.load());
  await flush();
  task.cancel();
  assert.equal(
    f.callbacks.length,
    count,
    'unmounted observer cannot update UI',
  );
}

// A previously aborted request starts no asset/font work.
{
  const f = fixture();
  const signal = new AbortController();
  signal.abort();
  const result = await f.start({ signal: signal.signal }).promise;
  assert.equal(result.cancelled, true);
  assert.equal(f.fontCalls.length, 0);
  assert.equal(f.callbacks.length, 0);
  f.assertClean();
}

// Legacy browsers without FontFaceSet use their normal CSS font fallbacks.
{
  const f = fixture({ cached: true, noFonts: true });
  const result = await f.start().promise;
  assert.equal(result.total, 2);
  assert.equal(result.completed, 2);
  f.assertClean();
}

console.log(
  'Home critical assets: cache, real counts, shared atlas, failed assets, timeout, cancellation and 30 cleanup cycles passed.',
);
