/** Document lifetime / reload policy. Browser navigation is checked separately. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import ts from 'typescript';
const source = readFileSync(
  new URL('../components/home/intro/intro-runtime.ts', import.meta.url),
  'utf8',
);
assert.doesNotMatch(source, /sessionStorage|localStorage|tanphong_intro_seen/);
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
function environment({
  type = 'navigate',
  path = '/',
  hash = '',
  scroll = 0,
  search = '',
  legacy = false,
} = {}) {
  const attributes = new Map(),
    timers = new Map();
  let now = 10,
    id = 0;
  const history = { scrollRestoration: 'auto' };
  const location = { pathname: path, hash, search };
  const window = {
    scrollY: scroll,
    setTimeout(fn) {
      const key = ++id;
      timers.set(key, fn);
      return key;
    },
    clearTimeout(key) {
      timers.delete(key);
    },
    scrollTo({ top }) {
      window.scrollY = top;
    },
  };
  const context = createContext({
    exports: {},
    window,
    history,
    location,
    URLSearchParams,
    performance: {
      now: () => now,
      getEntriesByType: () => (legacy ? [] : [{ type }]),
      navigation: {
        type: type === 'reload' ? 1 : type === 'back_forward' ? 2 : 0,
      },
    },
    document: {
      documentElement: {
        setAttribute: (k, v) => attributes.set(k, v),
        removeAttribute: (k) => attributes.delete(k),
      },
    },
    // Any accidental persistence access fails the regression immediately.
    sessionStorage: {
      getItem() {
        throw Error('Persistence must not be consulted');
      },
      setItem() {
        throw Error('Persistence must not be used');
      },
    },
    localStorage: {
      getItem() {
        throw Error('Persistence must not be consulted');
      },
    },
  });
  runInContext(compiled, context);
  const api = context.exports;
  return {
    ...api,
    window,
    history,
    location,
    attributes,
    timers,
    boot() {
      runInContext(api.HOME_INTRO_BOOTSTRAP, context);
    },
    expire() {
      for (const [key, fn] of timers) {
        timers.delete(key);
        fn();
      }
    },
    advance(ms) {
      now += ms;
    },
  };
}
// Every new document owns a fresh intro, including refresh of a deep scroll/hash.
for (let reload = 0; reload < 20; reload++)
  for (const legacy of [false, true]) {
    const e = environment({
      type: reload ? 'reload' : 'navigate',
      legacy,
      scroll: reload ? 850 : 0,
      hash: reload ? '#home-worlds' : '',
    });
    e.boot();
    assert.equal(e.attributes.get('data-home-intro'), 'waiting');
    assert.equal(e.window.scrollY, 0);
    assert.equal(e.history.scrollRestoration, 'manual');
    const first = e.claimHomeIntro();
    assert.equal(first.play, true);
    assert.equal(first.scrollRestoration, 'auto');
    assert.equal(e.timers.size, 0);
    e.markHomeIntroPlayed();
    assert.equal(e.window.__tpHomeIntroRuntime.played, true);
    for (let nav = 0; nav < 10; nav++) {
      e.location.pathname = '/worlds';
      e.boot();
      e.location.pathname = '/';
      assert.equal(
        e.claimHomeIntro().play,
        false,
        'SPA return must not reuse reload permission',
      );
    }
  }
for (const type of ['navigate', 'reload', 'back_forward']) {
  const e = environment({ path: '/worlds', type });
  e.boot();
  assert.equal(e.attributes.size, 0);
  e.location.pathname = '/';
  assert.equal(
    e.claimHomeIntro().play,
    false,
    'SPA arrival from another document entry route is direct',
  );
  e.location.search = '?intro=1';
  assert.equal(
    e.claimHomeIntro().play,
    true,
    'explicit override works on a later Home mount',
  );
}
for (const legacy of [false, true]) {
  const e = environment({ type: 'back_forward', legacy });
  e.boot();
  assert.equal(
    e.claimHomeIntro().play,
    false,
    'history restoration is preserved',
  );
}
{
  const e = environment();
  e.boot();
  e.expire();
  assert.equal(e.attributes.size, 0);
  assert.equal(e.history.scrollRestoration, 'auto');
  assert.equal(
    e.claimHomeIntro().play,
    false,
    'late hydration cannot replay expired pre-paint gate',
  );
}
{
  const e = environment();
  assert.equal(
    e.claimHomeIntro().play,
    false,
    'without head gate, default to direct SPA entry',
  );
}
{
  const e = environment({ search: '?intro=1', type: 'back_forward' });
  e.boot();
  assert.equal(e.claimHomeIntro().play, true, 'explicit visual QA override');
}
console.log(
  'PASS: 20 new/reload documents, 10 SPA returns per document, no persistent state, restored-scroll reset, history/back, force override and pre-hydration watchdog.',
);
