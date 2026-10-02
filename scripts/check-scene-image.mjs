/** Real image preparation with controlled network/decode completion. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
const source = readFileSync(
  new URL('../components/home/experience/scene-image.ts', import.meta.url),
  'utf8',
);
const code = ts.transpileModule(source, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.CommonJS,
  },
}).outputText;
function fixture({ cached = false, decode = true, priority = 'auto' } = {}) {
  const events = new Map(),
    pending = [],
    calls = { ready: 0, failed: 0, decode: 0 };
  const attributes = new Map([
    ['loading', 'lazy'],
    ['fetchpriority', 'low'],
  ]);
  const sourceAttrs = new Map();
  const pictureSource = {
    dataset: { srcset: '/atrium-1280.webp' },
    getAttribute: (n) => sourceAttrs.get(n) ?? null,
    setAttribute: (n, v) => sourceAttrs.set(n, v),
    removeAttribute: (n) => sourceAttrs.delete(n),
    set srcset(v) {
      sourceAttrs.set('srcset', v);
    },
  };
  const image = {
    complete: cached,
    naturalWidth: cached ? 1280 : 0,
    currentSrc: cached ? '/atrium-1280.webp' : '',
    dataset: { src: '/atrium.webp' },
    parentElement: { querySelectorAll: () => [pictureSource] },
    getAttribute: (n) => attributes.get(n) ?? null,
    setAttribute: (n, v) => attributes.set(n, v),
    removeAttribute: (n) => attributes.delete(n),
    set loading(v) {
      attributes.set('loading', v);
    },
    set fetchPriority(v) {
      attributes.set('fetchpriority', v);
    },
    set src(v) {
      assert.equal(
        sourceAttrs.get('srcset'),
        '/atrium-1280.webp',
        'picture installed before fallback URL',
      );
      attributes.set('src', v);
    },
    get src() {
      return attributes.get('src') ?? '';
    },
    addEventListener(n, fn) {
      if (!events.has(n)) events.set(n, new Set());
      events.get(n).add(fn);
    },
    removeEventListener(n, fn) {
      events.get(n)?.delete(fn);
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
  const loaded = { exports: {} };
  runInNewContext(code, { module: loaded, exports: loaded.exports });
  const controller = loaded.exports.prepareSceneImage(
    image,
    { ready: () => calls.ready++, failed: () => calls.failed++ },
    priority,
  );
  return {
    image,
    pending,
    calls,
    attributes,
    sourceAttrs,
    start: controller.start,
    stop: controller.destroy,
    emit: (n) => {
      for (const f of events.get(n) ?? []) f();
    },
    count: () => [...events.values()].reduce((n, s) => n + s.size, 0),
  };
}
const flush = async () => {
  await Promise.resolve();
  await Promise.resolve();
};
const f = fixture();
assert.equal(
  f.attributes.has('src'),
  false,
  'setup must not request later story assets',
);
assert.equal(f.sourceAttrs.size, 0);
f.emit('load');
assert.equal(f.calls.decode, 0);
f.start();
f.start();
assert.equal(f.attributes.get('loading'), 'eager');
assert.equal(f.calls.ready, 0);
f.image.complete = true;
f.image.naturalWidth = 1280;
f.image.currentSrc = '/atrium-1280.webp';
f.emit('load');
f.emit('load');
assert.equal(f.calls.decode, 1);
f.pending[0].resolve();
await flush();
assert.equal(f.calls.ready, 1);
f.emit('load');
assert.equal(f.calls.decode, 1);
f.image.currentSrc = '/atrium.webp';
f.emit('load');
f.pending[1].resolve();
await flush();
assert.equal(f.calls.ready, 2, 'responsive source decoded without cloning');
f.stop();
f.stop();
assert.equal(f.count(), 0);
assert.equal(f.attributes.get('loading'), 'lazy');
assert.equal(f.attributes.has('src'), false);
assert.equal(f.sourceAttrs.size, 0);
for (const reject of [false, true]) {
  const a = fixture({ cached: true });
  assert.equal(a.calls.decode, 0);
  a.start();
  a.stop();
  if (reject) a.pending[0].reject(Error('late'));
  else a.pending[0].resolve();
  await flush();
  assert.equal(a.calls.ready, 0);
  assert.equal(a.calls.failed, 0);
  assert.equal(a.count(), 0);
}
const failure = fixture({ cached: true, priority: 'low' });
failure.start();
assert.equal(failure.attributes.get('fetchpriority'), 'low');
failure.pending[0].reject(Error('failed'));
await flush();
assert.equal(failure.calls.failed, 1);
failure.emit('load');
failure.pending[1].resolve();
await flush();
assert.equal(failure.calls.ready, 1);
failure.stop();
const stale = fixture({ cached: true });
stale.start();
stale.image.currentSrc = '/atrium.webp';
stale.emit('load');
stale.pending[0].resolve();
await flush();
assert.equal(stale.calls.ready, 0);
stale.emit('error');
stale.pending[1].resolve();
await flush();
assert.equal(stale.calls.failed, 1);
assert.equal(stale.calls.ready, 0);
stale.stop();
const early = fixture();
early.stop();
early.start();
assert.equal(early.attributes.has('src'), false);
assert.equal(early.count(), 0);
const legacy = fixture({ cached: true, decode: false });
legacy.start();
assert.equal(legacy.calls.ready, 1);
legacy.stop();
assert.doesNotMatch(
  source,
  /new\s+Image\s*\(|requestAnimationFrame|setInterval|IntersectionObserver/,
);
console.log(
  'Scene image passed: no initial requests, intent source ordering, cached/failed/responsive decodes, stale completion and idempotent cleanup.',
);
