/** Decode/lifecycle checks, not simulated browser performance measurements. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const source = readFileSync(
  new URL('../components/home/experience/bridge-image.ts', import.meta.url),
  'utf8',
);
const code = ts.transpileModule(source, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.CommonJS,
  },
}).outputText;

function fixture({ io = true, cached = false, decode = true } = {}) {
  const observers = [];
  const events = new Map();
  const attributes = new Map([
    ['loading', 'lazy'],
    ['fetchpriority', 'low'],
  ]);
  const pending = [];
  const calls = { ready: 0, failed: 0, decode: 0 };
  const owner = {};
  const image = {
    complete: cached,
    naturalWidth: cached ? 1280 : 0,
    currentSrc: '/atrium-1280.webp',
    src: '/atrium.webp',
    getAttribute: (name) => attributes.get(name) ?? null,
    setAttribute: (name, value) => attributes.set(name, value),
    removeAttribute: (name) => attributes.delete(name),
    set loading(value) {
      attributes.set('loading', value);
    },
    set fetchPriority(value) {
      attributes.set('fetchpriority', value);
    },
    addEventListener(name, callback) {
      if (!events.has(name)) events.set(name, new Set());
      events.get(name).add(callback);
    },
    removeEventListener(name, callback) {
      events.get(name)?.delete(callback);
    },
    ...(decode
      ? {
          decode() {
            calls.decode++;
            return new Promise((resolve, reject) =>
              pending.push({ resolve, reject }),
            );
          },
        }
      : {}),
  };
  class IntersectionObserver {
    connected = false;
    constructor(callback, options) {
      this.callback = callback;
      this.options = options;
      observers.push(this);
    }
    observe(node) {
      assert.equal(node, owner);
      this.connected = true;
    }
    disconnect() {
      this.connected = false;
    }
  }
  const loaded = { exports: {} };
  runInNewContext(code, {
    module: loaded,
    exports: loaded.exports,
    ...(io ? { IntersectionObserver } : {}),
  });
  const stop = loaded.exports.prepareBridgeImage(owner, image, {
    ready: () => calls.ready++,
    failed: () => calls.failed++,
  });
  return {
    calls,
    pending,
    observers,
    attributes,
    image,
    stop,
    intersect(isIntersecting = true) {
      observers[0].callback([{ target: owner, isIntersecting }]);
    },
    emit(name) {
      for (const callback of events.get(name) ?? []) callback();
    },
    listenerCount: () =>
      [...events.values()].reduce((count, set) => count + set.size, 0),
  };
}

const flush = async () => {
  await Promise.resolve();
  await Promise.resolve();
};
const f = fixture();
assert.equal(f.observers.length, 1);
assert.equal(f.listenerCount(), 2);
assert.equal(f.observers[0].options.rootMargin, '120% 0px');
assert.equal(f.attributes.get('loading'), 'lazy');
f.intersect(false);
assert.equal(f.calls.decode, 0);
assert.equal(f.calls.ready, 0);
f.intersect();
assert.equal(f.attributes.get('loading'), 'eager');
assert.equal(f.attributes.get('fetchpriority'), 'auto');
assert.equal(f.observers[0].connected, false);
assert.equal(f.calls.ready, 0, 'intersection never reveals an undecoded image');
f.image.complete = true;
f.image.naturalWidth = 1280;
f.emit('load');
f.emit('load');
assert.equal(f.calls.decode, 1, 'duplicate load events share pending decode');
assert.equal(f.calls.ready, 0);
f.pending[0].resolve();
await flush();
assert.equal(f.calls.ready, 1);
f.emit('load');
assert.equal(f.calls.decode, 1, 'ready source is not decoded repeatedly');

// The browser may select a different responsive source after a resize.
f.image.currentSrc = '/atrium-720.webp';
f.emit('load');
assert.equal(f.calls.decode, 2);
f.pending[1].resolve();
await flush();
assert.equal(f.calls.ready, 2);
f.stop();
f.stop();
assert.equal(f.listenerCount(), 0);
assert.equal(f.attributes.get('loading'), 'lazy');
assert.equal(f.attributes.get('fetchpriority'), 'low');

const cached = fixture({ cached: true });
assert.equal(cached.calls.decode, 0);
cached.intersect();
assert.equal(cached.calls.decode, 1);
assert.equal(cached.calls.ready, 0);
cached.pending[0].resolve();
await flush();
assert.equal(cached.calls.ready, 1, 'cached image still waits for decode');
cached.stop();

const failure = fixture({ io: false, cached: true });
assert.equal(failure.observers.length, 0);
assert.equal(failure.calls.decode, 1, 'unsupported IO prepares immediately');
failure.pending[0].reject(new Error('decode failed'));
await flush();
assert.equal(failure.calls.failed, 1);
assert.equal(failure.calls.ready, 0);
failure.emit('load');
failure.pending[1].resolve();
await flush();
assert.equal(failure.calls.ready, 1, 'a later successful load can recover');
failure.stop();

const stale = fixture({ io: false, cached: true });
stale.image.currentSrc = '/atrium-720.webp';
stale.emit('load');
stale.pending[0].resolve();
await flush();
assert.equal(
  stale.calls.ready,
  0,
  'old source decode cannot reveal new source',
);
stale.emit('error');
stale.pending[1].resolve();
await flush();
assert.equal(stale.calls.failed, 1);
assert.equal(stale.calls.ready, 0, 'error invalidates the pending decode');
stale.stop();

for (const reject of [false, true]) {
  const late = fixture({ io: false, cached: true });
  late.stop();
  if (reject) late.pending[0].reject(new Error('late failure'));
  else late.pending[0].resolve();
  await flush();
  assert.equal(late.calls.ready, 0);
  assert.equal(late.calls.failed, 0);
  assert.equal(late.listenerCount(), 0);
}
const early = fixture();
early.stop();
early.intersect();
assert.equal(early.calls.decode, 0);
assert.equal(early.observers[0].connected, false);
assert.equal(early.listenerCount(), 0);
const legacy = fixture({ io: false, cached: true, decode: false });
assert.equal(legacy.calls.ready, 1);
assert.equal(legacy.calls.decode, 0);
legacy.stop();
assert.doesNotMatch(
  source,
  /new\s+Image\s*\(|requestAnimationFrame|setInterval/,
);
console.log(
  'Bridge image passed: early preparation, decode gate, responsive retry, cached/error paths, no-IO fallback, and complete late-promise-safe cleanup.',
);
