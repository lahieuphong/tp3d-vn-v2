/** Deterministic session/pre-paint ownership checks, not a live browser audit. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import ts from 'typescript';

const { outputText } = ts.transpileModule(
  readFileSync(
    new URL('../components/home/intro/intro-session.ts', import.meta.url),
    'utf8',
  ),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  },
);

function environment({
  seen = false,
  blocked = false,
  type = 'navigate',
  path = '/',
  hash = '',
  scroll = 0,
  hostname = 'localhost',
  search = '',
  legacy = false,
} = {}) {
  const attrs = new Map();
  const storage = new Map(seen ? [['tanphong_intro_seen', 'true']] : []);
  const timers = new Map();
  let now = 20,
    timerId = 0;
  const location = { pathname: path, hash, hostname, search };
  const window = {
    scrollY: scroll,
    setTimeout(callback, delay) {
      const id = ++timerId;
      timers.set(id, { callback, time: now + delay });
      return id;
    },
    clearTimeout(id) {
      timers.delete(id);
    },
  };
  const performance = {
    now: () => now,
    getEntriesByType: () => (legacy ? [] : [{ type }]),
    navigation: {
      type: type === 'back_forward' ? 2 : type === 'reload' ? 1 : 0,
    },
  };
  const context = createContext({
    exports: {},
    window,
    location,
    performance,
    URLSearchParams,
    document: {
      documentElement: {
        setAttribute: (name, value) => attrs.set(name, value),
        removeAttribute: (name) => attrs.delete(name),
      },
    },
    sessionStorage: {
      getItem(key) {
        if (blocked) throw Error('blocked');
        return storage.get(key) ?? null;
      },
      setItem(key, value) {
        if (blocked) throw Error('blocked');
        storage.set(key, value);
      },
    },
  });
  runInContext(outputText, context);
  const api = context.exports;
  return {
    ...api,
    window,
    location,
    attrs,
    storage,
    timers,
    boot() {
      runInContext(api.HOME_INTRO_BOOTSTRAP, context);
    },
    advance(ms) {
      now += ms;
      for (const [id, timer] of timers) {
        if (timer.time <= now) {
          timers.delete(id);
          timer.callback();
        }
      }
    },
  };
}

{
  const e = environment();
  e.boot();
  assert.equal(e.attrs.get('data-home-intro'), 'waiting');
  assert.equal(e.timers.size, 1);
  e.advance(400);
  const decision = e.claimHomeIntro();
  assert.equal(decision.play, true);
  assert.equal(decision.startedAt, 20);
  assert.equal(e.timers.size, 0, 'claim releases the pre-hydration watchdog');
  e.markHomeIntroSeen();
  assert.equal(e.storage.get('tanphong_intro_seen'), 'true');
  assert.equal(e.claimHomeIntro().play, false, 'route return cannot replay');
  e.boot();
  assert.equal(
    e.timers.size,
    0,
    'rerunning bootstrap cannot reinstall a loader',
  );
}
for (const config of [
  { seen: true },
  { type: 'reload', seen: true },
  { type: 'reload', legacy: true, seen: true },
  { hash: '#home-worlds' },
  { scroll: 600 },
  { type: 'back_forward' },
  { type: 'back_forward', legacy: true },
  { type: 'back_forward', search: '?forceIntro=true' },
  { type: 'back_forward', search: '?intro=1' },
  { scroll: 50, search: '?intro=1' },
  { hash: '#main', search: '?intro=1' },
  { scroll: 50, search: '?forceIntro=true' },
  { hash: '#main', search: '?forceIntro=true' },
  { seen: true, hostname: 'tp3d-vn-v2.vercel.app', search: '?forceIntro=true' },
  { seen: true, hostname: 'tp3d-vn-v2.vercel.app', search: '?intro=1' },
  { seen: true, search: '?intro=0' },
]) {
  const e = environment(config);
  e.boot();
  assert.equal(e.attrs.has('data-home-intro'), false, JSON.stringify(config));
  assert.equal(e.claimHomeIntro().play, false, JSON.stringify(config));
  assert.equal(e.timers.size, 0);
}
for (const config of [
  { type: 'reload', seen: false },
  { type: 'reload', seen: true, search: '?intro=1' },
  { type: 'reload', legacy: true, seen: true, search: '?intro=1' },
  { seen: true, search: '?intro=1' },
  { seen: true, hostname: '127.0.0.1', search: '?intro=1' },
  { seen: true, hostname: '[::1]', search: '?intro=1' },
  { seen: true, search: '?forceIntro=true' },
  { blocked: true },
]) {
  const e = environment(config);
  e.boot();
  assert.equal(e.claimHomeIntro().play, true, JSON.stringify(config));
  e.markHomeIntroSeen();
  assert.equal(
    e.claimHomeIntro().play,
    false,
    'one claim even when storage fails',
  );
}
{
  const e = environment();
  e.boot();
  e.advance(4499);
  assert.equal(e.attrs.get('data-home-intro'), 'waiting');
  e.advance(1);
  assert.equal(e.attrs.has('data-home-intro'), false);
  assert.equal(e.window.__tpHomeIntroBoot.expired, true);
  assert.equal(e.timers.size, 0);
  assert.equal(
    e.claimHomeIntro().play,
    false,
    'late hydration cannot restart timed-out loader',
  );
}
{
  const e = environment();
  e.boot();
  e.window.scrollY = 500;
  assert.equal(
    e.claimHomeIntro().play,
    false,
    'restoration between head and hydration wins',
  );
  assert.equal(e.attrs.has('data-home-intro'), false);
  assert.equal(e.timers.size, 0);
}
for (const seen of [false, true]) {
  const e = environment({ path: '/worlds', seen, type: 'reload' });
  e.boot();
  assert.equal(
    e.window.__tpHomeIntroBoot,
    undefined,
    'other routes do not mount loader',
  );
  assert.equal(e.timers.size, 0);
  e.location.pathname = '/';
  assert.equal(
    e.claimHomeIntro().play,
    !seen,
    'SPA entry cannot reuse original reload permission',
  );
  assert.equal(e.claimHomeIntro().play, false);
}
for (const legacy of [false, true]) {
  const e = environment({ path: '/worlds', type: 'back_forward', legacy });
  e.boot();
  e.location.pathname = '/';
  assert.equal(
    e.claimHomeIntro().play,
    false,
    'SPA entry preserves history restoration',
  );
}
console.log(
  'PASS: intro first/return/seen-reload-skip, restoration/hash/back, localhost override, blocked storage and watchdog ownership.',
);
