/** TP3D PASS 05 — Enter the World gateway and Lobby foundation. The portal
 * state machine runs against a minimal fake DOM with manual timers; route,
 * markup and network behaviour are covered by check-site and browser QA. */
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');
function load(path, context = {}, modules = {}) {
  const loaded = { exports: {} };
  runInNewContext(
    ts.transpileModule(read(path), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText,
    {
      module: loaded,
      exports: loaded.exports,
      require: (name) => {
        assert(name in modules, `unexpected import ${name} in ${path}`);
        return modules[name];
      },
      ...context,
    },
  );
  return loaded.exports;
}

const tokens = load('lib/motion/tokens.ts');
const building = load('data/world-building.ts');
const { worldRooms, WORLD_PATH, isWorldPath, PLANNED_ROOM_LABEL } = building;

// 16–20. One building directory: five rooms, fixed taxonomy and order. The
// Gallery (TP3D PASS 06; it bridged to /worlds in PASS 05), Objects
// (TP3D PASS 10), the Archive (TP3D PASS 13), the Lab (TP3D PASS 14) and the
// Studio (TP3D PASS 15) open onto their own rooms: the building is complete.
// Planned wings stay supported (status and label; check:studio), and a
// planned wing is never a link (the pre-opening fixtures in the room checks).
assert.equal(WORLD_PATH, '/world');
assert.deepEqual(
  [...worldRooms].map((room) => [room.number, room.id, room.name]),
  [
    ['01', 'gallery', 'Gallery'],
    ['02', 'objects', 'Objects'],
    ['03', 'archive', 'Archive'],
    ['04', 'lab', 'Lab'],
    ['05', 'studio', 'Studio'],
  ],
);
for (const room of worldRooms) {
  assert.equal(room.futurePath, `/world/${room.id}`);
  assert(room.summary && room.description && room.type);
  assert.equal(room.status, 'available', `${room.name} is open`);
  assert.equal(
    room.href,
    `/world/${room.id}`,
    `${room.name} opens its own room`,
  );
}
assert.match(PLANNED_ROOM_LABEL, /later/i);
for (const [path, inside] of [
  ['/world', true],
  ['/world/gallery', true],
  ['/world/objects', true],
  ['/world/archive', true],
  ['/world/lab', true],
  ['/world/studio', true],
  ['/worlds', false],
  ['/worlds/modern-bathroom', false],
  ['/', false],
  [null, false],
])
  assert.equal(isWorldPath(path), inside, `isWorldPath(${path})`);

// The Lobby reads both navigation modes from that one source: its spatial
// directory, and the World map in the chrome every World page shares.
{
  const lobby = read('components/world/world-lobby.tsx');
  const chrome = read('components/world/world-chrome.tsx');
  assert.equal(
    (lobby.match(/worldRooms\.map\(/g) ?? []).length,
    1,
    'the spatial directory maps the rooms',
  );
  assert.equal(
    (chrome.match(/worldRooms\.map\(/g) ?? []).length,
    1,
    'the World map maps the same rooms',
  );
  assert.match(lobby, /<WorldChrome \/>/, 'the Lobby uses the shared chrome');
  for (const source of [lobby, chrome]) {
    for (const name of ['Gallery', 'Objects', 'Archive', 'Studio'])
      assert(!source.includes(`>${name}<`), `no hard-coded ${name}`);
    assert.doesNotMatch(source, /href=["']#/, 'no fake anchors');
  }
  assert.match(lobby, /<h1\b/);
  assert.equal((lobby.match(/<h1\b/g) ?? []).length, 1, 'one h1');
  assert.match(chrome, /aria-label="World map"/);
  assert.match(lobby, /aria-label="Lobby rooms"/);
  // TP3D PASS 09: the native <details> is rendered by the World map's Escape
  // island; the summary and every room stay in the server-rendered chrome.
  assert.match(
    chrome,
    /<WorldMapDisclosure>\s*<summary>/,
    'native disclosure, no custom modal',
  );
  const disclosure = read('components/world/world-map-disclosure.tsx');
  assert.match(
    disclosure,
    /return <details ref=\{ref\}>\{children\}<\/details>;/,
  );
  assert.doesNotMatch(disclosure + chrome, /role="dialog"|aria-modal|<dialog/);
  assert.match(chrome, /href="\/"[\s\S]*Exit/, 'Exit to website links home');
  assert.match(lobby, /id="main"/, 'skip link target');
  const page = read('app/world/page.tsx');
  assert.match(page, /absolute: 'The Lobby — TP3D'/);
}

// 23–24. No WebGL in the World: no Three.js, no canvas, no atmosphere code,
// no RAF of its own (pointer depth uses the shared, self-stopping follower).
// One exception since TP3D PASS 14: the Lab's Atmosphere study opens the
// production atmosphere on an explicit request only, through its island and
// a lazy adapter (one instance, frames on demand, full cleanup; check:lab
// holds that contract). Neither imports three, and nothing else may.
const LAB_ATMOSPHERE = new Set([
  'components/world/lab-atmosphere-study.tsx',
  'components/world/lab-atmosphere-adapter.ts',
]);
for (const directory of ['components/world/', 'app/world/'])
  for (const file of readdirSync(new URL(directory, root), { recursive: true })
    .map((name) => name.replaceAll('\\', '/'))
    .filter((name) => /\.(tsx?|css)$/.test(name))) {
    const source = read(directory + file);
    assert.doesNotMatch(source, /from ['"]three['"]|import\(['"]three/);
    if (LAB_ATMOSPHERE.has(directory + file)) continue;
    assert.doesNotMatch(
      source,
      /<canvas|atmospheric-sky|createElement\(['"]canvas/,
    );
    assert.doesNotMatch(source, /requestAnimationFrame|setInterval/);
  }
for (const file of LAB_ATMOSPHERE)
  assert(existsSync(new URL(file, root)), `${file} is the only exception`);

// 4–5, 25. The Atrium's primary gateway is a real link to /world, prefetched
// only after intent; the four room shortcuts are untouched.
{
  const chapter = read('components/home/experience/worlds-chapter.tsx');
  assert.match(
    chapter,
    /<WorldGatewayLink className="hc-atrium-cta" data-chapter-reveal="9">/,
  );
  assert.match(chapter, /ENTER THE WORLD/);
  assert.doesNotMatch(chapter, /EXPLORE 3D WORLDS/);
  assert.match(
    chapter,
    /worldsChapterOptions\.map/,
    'room shortcuts unchanged',
  );
  const link = read('components/world/world-gateway-link.tsx');
  assert.match(link, /href=\{WORLD_PATH\}/);
  assert.match(link, /prefetch=\{false\}/, 'no prefetch on load');
  assert.doesNotMatch(link, /useEffect/, 'nothing runs before intent');
  for (const intent of ['onPointerEnter', 'onFocus', 'onTouchStart'])
    assert.match(link, new RegExp(`${intent}=\\{intent\\}`));
  const layout = read('app/layout.tsx');
  assert.match(
    layout,
    /<EditorialChrome>\s*<SiteHeader \/>\s*<\/EditorialChrome>/,
  );
  assert.match(
    layout,
    /<EditorialChrome>\s*<SiteFooter \/>\s*<\/EditorialChrome>/,
  );
  assert.match(read('app/globals.css'), /--world-ground: #1c1712;/);
  assert.match(
    read('components/world/world-lobby.css'),
    /background: var\(--world-ground\)/,
  );
}

// 22. Touch targets: every interactive Lobby element reserves at least 44px.
{
  const css =
    read('components/world/world-chrome.css') +
    read('components/world/world-lobby.css');
  for (const selector of [
    '.wl-wordmark',
    '.wl-map summary,\n.wl-exit,\n.wl-back',
    '.wl-map-entry',
    '.wl-room-body',
  ]) {
    const start = css.indexOf(`${selector} {`);
    assert(start >= 0, `${selector} rule`);
    const block = css.slice(start, css.indexOf('}', start));
    const minHeight = Number(block.match(/min-height: (\d+)px/)?.[1]);
    assert(minHeight >= 44, `${selector} min-height ${minHeight}`);
  }
  // Legibility over the plate: no text fades below 0.78 of
  // ivory (measured ≥ 4.5:1 on the mean plate behind 9px type), and no type
  // is set below 9px (the wordmark tagline mirrors the site header's clamp).
  // Rules and borders may be fainter.
  const rules = css.replace(
    /@keyframes[^{]+\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g,
    '',
  );
  for (const [, value] of rules.matchAll(/[;{\s]opacity:\s*([\d.]+)/g))
    assert(Number(value) >= 0.78, `text opacity ${value}`);
  for (const [, alpha] of rules.matchAll(
    /[;{\s]color:\s*rgb\([^)]*\/\s*(\d+)%\)/g,
  ))
    assert(Number(alpha) >= 78, `text colour alpha ${alpha}%`);
  for (const [, px] of rules.matchAll(/font-size:\s*(\d+)px/g))
    assert(Number(px) >= 9, `font-size ${px}px`);
  for (const [, px] of rules.matchAll(/font:\s*\d+\s+(\d+)px/g))
    assert(Number(px) >= 9, `font ${px}px`);
  // Both navigation modes share the number/status classes; the list layout's
  // grid areas belong to the spatial directory only (a leak into the World
  // map overlapped its rows in QA).
  for (const [, selector] of css.matchAll(/([^{}]+)\{[^{}]*grid-area:/g))
    for (const part of selector.split(','))
      assert(
        /^\s*(\.wl-rooms\s|\.wl-name\s*$)/.test(part),
        `grid-area outside the directory: ${part.trim()}`,
      );
}

// 6–12. The portal state machine.
function environment({ path = '/', reduced = false, animations = true } = {}) {
  let now = 0;
  const timers = new Map();
  let nextTimer = 1;
  const listeners = new Map();
  const media = { matches: reduced, listeners: new Set() };
  const created = [];
  const assigned = [];
  class FakeAnimation {
    constructor(element, keyframes, options) {
      Object.assign(this, { element, keyframes, options });
      this.finished = new Promise((resolve, reject) => {
        this.resolve = resolve;
        this.reject = reject;
      });
      this.finished.catch(() => {});
      this.cancelled = false;
    }
    cancel() {
      if (this.cancelled || this.done) return;
      this.cancelled = true;
      this.reject(new Error('AbortError'));
    }
    finish() {
      this.done = true;
      this.resolve(this);
    }
  }
  class FakeElement {
    constructor(tag) {
      this.tag = tag;
      this.style = {};
      this.dataset = {};
      this.attributes = {};
      this.children = [];
      this.parent = null;
      this.animations = [];
      created.push(this);
    }
    setAttribute(name, value) {
      this.attributes[name] = value;
    }
    appendChild(child) {
      child.parent = this;
      this.children.push(child);
      return child;
    }
    replaceChildren() {
      for (const child of this.children) child.parent = null;
      this.children = [];
    }
    get childElementCount() {
      return this.children.length;
    }
    remove() {
      if (!this.parent) return;
      this.parent.children = this.parent.children.filter((c) => c !== this);
      this.parent = null;
    }
  }
  if (animations)
    FakeElement.prototype.animate = function (keyframes, options) {
      const animation = new FakeAnimation(this, keyframes, options);
      this.animations.push(animation);
      return animation;
    };
  const body = new FakeElement('body');
  const scrolls = [];
  const window = {
    innerWidth: 1440,
    innerHeight: 900,
    scrollTo: (options) =>
      scrolls.push({ ...options, covered: body.children[0]?.style.opacity }),
    location: {
      pathname: path,
      assign: (url) => assigned.push(url),
    },
    addEventListener: (name, fn) => {
      if (!listeners.has(name)) listeners.set(name, new Set());
      listeners.get(name).add(fn);
    },
    removeEventListener: (name, fn) => listeners.get(name)?.delete(fn),
    matchMedia: () => ({
      get matches() {
        return media.matches;
      },
      addEventListener: (_, fn) => media.listeners.add(fn),
      removeEventListener: (_, fn) => media.listeners.delete(fn),
    }),
  };
  const document = { body, createElement: (tag) => new FakeElement(tag) };
  const context = {
    window,
    document,
    setTimeout: (fn, ms) => {
      const id = nextTimer++;
      timers.set(id, { fn, at: now + ms });
      return id;
    },
    clearTimeout: (id) => timers.delete(id),
  };
  const portal = load('components/world/world-portal.ts', context, {
    '@/lib/motion/tokens': tokens,
    '@/data/world-building': building,
  });
  const advance = async (ms) => {
    const end = now + ms;
    for (;;) {
      const due = [...timers.entries()]
        .filter(([, t]) => t.at <= end)
        .sort((a, b) => a[1].at - b[1].at)[0];
      if (!due) break;
      timers.delete(due[0]);
      now = due[1].at;
      due[1].fn();
      await Promise.resolve();
    }
    now = end;
    await new Promise((r) => setImmediate(r));
  };
  const emit = (name, event = {}) => {
    // A snapshot: handlers may remove listeners while they run.
    for (const fn of Array.from(listeners.get(name) ?? [])) fn(event);
  };
  const listenerCount = () =>
    [...listeners.values()].reduce((n, set) => n + set.size, 0) +
    media.listeners.size;
  const flush = () => new Promise((r) => setImmediate(r));
  const layer = () => body.children.find((c) => 'worldPortal' in c.dataset);
  return {
    portal,
    window,
    body,
    media,
    assigned,
    scrolls,
    advance,
    emit,
    flush,
    layer,
    listenerCount,
    timers,
  };
}
const origin = { left: 1128, top: 713, width: 88, height: 88 };

{
  const { isPlainPrimaryActivation, coverRadius } = environment().portal;
  const plain = {
    button: 0,
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    defaultPrevented: false,
  };
  assert.equal(isPlainPrimaryActivation(plain), true, 'click and Enter');
  for (const change of [
    { metaKey: true },
    { ctrlKey: true },
    { shiftKey: true },
    { altKey: true },
    { button: 1 },
    { button: 2 },
    { defaultPrevented: true },
  ])
    assert.equal(
      isPlainPrimaryActivation({ ...plain, ...change }),
      false,
      `native behaviour kept for ${JSON.stringify(change)}`,
    );
  for (const [x, y, w, h] of [
    [0, 0, 390, 844],
    [1172, 757, 1440, 900],
    [60, 780, 390, 844],
    [420, 195, 844, 390],
  ]) {
    const r = coverRadius(x, y, w, h);
    for (const [cx, cy] of [
      [0, 0],
      [w, 0],
      [0, h],
      [w, h],
    ])
      assert(r >= Math.hypot(cx - x, cy - y), 'the circle covers every corner');
  }
}

{
  // A plain crossing: expand, cover, navigate once, release, idle.
  const env = environment();
  const { portal } = env;
  let navigations = 0;
  assert.equal(portal.gatewayState(), 'idle');
  assert.equal(
    portal.enterWorld({
      origin,
      reduced: false,
      navigate: () => navigations++,
    }),
    true,
  );
  assert.equal(portal.gatewayState(), 'entering');
  const layer = env.layer();
  assert(layer, 'one fixed layer');
  assert.equal(layer.style.position, 'fixed');
  assert.equal(layer.style.zIndex, '150');
  assert.equal(layer.style.pointerEvents, 'auto');
  assert.equal(layer.attributes['aria-hidden'], 'true');
  assert.equal(layer.children.length, 2, 'a dim and one circle');
  const [dim, circle] = layer.children;
  const [expand] = circle.animations;
  assert.equal(expand.options.duration, tokens.DURATION.cinematic);
  assert.equal(expand.options.easing, tokens.cssEase('cinematic'));
  assert.match(expand.keyframes[0].transform, /^scale\(0\.0/);
  assert.equal(expand.keyframes[1].transform, 'scale(1)');
  assert(dim.animations[0].keyframes.every((k) => !('transform' in k)));
  for (const element of [layer, dim, circle])
    for (const animation of element.animations)
      for (const frame of animation.keyframes)
        for (const property of Object.keys(frame))
          assert(['transform', 'opacity'].includes(property), property);
  // 11. Double activation is ignored.
  assert.equal(
    portal.enterWorld({
      origin,
      reduced: false,
      navigate: () => navigations++,
    }),
    false,
  );
  assert.equal(env.body.children.length, 1);
  expand.finish();
  await env.flush();
  assert.equal(portal.gatewayState(), 'navigating');
  assert.equal(navigations, 1, 'navigates exactly once');
  assert.equal(layer.children.length, 0, 'a complete, static cover');
  assert.equal(layer.style.opacity, '1');
  assert.match(layer.style.background, /--world-ground/);
  env.window.location.pathname = '/world';
  assert.equal(env.scrolls.length, 0, 'the homepage scroll is never touched');
  portal.releaseWorldPortal();
  // The Lobby opens at its top, reset instantly under the opaque cover.
  assert.deepEqual(env.scrolls, [
    { top: 0, left: 0, behavior: 'instant', covered: '1' },
  ]);
  const [fade] = layer.animations.slice(-1);
  assert.deepEqual(
    [...fade.keyframes].map((k) => k.opacity),
    [1, 0],
  );
  fade.finish();
  await env.flush();
  assert.equal(env.body.children.length, 0, 'cover removed after arrival');
  assert.equal(portal.gatewayState(), 'idle');
  assert.equal(env.listenerCount(), 0, 'listeners removed');
  assert.equal(env.timers.size, 0, 'timers cleared');
  // 13. A direct visit has nothing to release and keeps its scroll.
  portal.releaseWorldPortal();
  assert.equal(portal.gatewayState(), 'idle');
  assert.equal(env.scrolls.length, 1);
}

{
  // 10. Reduced motion: a short flat cover, no circle, no scale.
  const env = environment({ reduced: true });
  let navigations = 0;
  env.portal.enterWorld({
    origin,
    reduced: true,
    navigate: () => navigations++,
  });
  const layer = env.layer();
  assert.equal(layer.children.length, 0);
  const [fade] = layer.animations;
  assert.equal(fade.options.duration, tokens.DURATION.micro);
  assert.deepEqual(
    [...fade.keyframes].map((k) => Object.keys(k)),
    [['opacity'], ['opacity']],
  );
  fade.finish();
  await env.flush();
  assert.equal(navigations, 1);
}

{
  // A resize or a reduced-motion change mid-crossing completes the cover at
  // once and still crosses (a stranded cover was a real bug found in QA).
  for (const trigger of ['resize', 'media']) {
    const env = environment();
    let navigations = 0;
    env.portal.enterWorld({
      origin,
      reduced: false,
      navigate: () => navigations++,
    });
    if (trigger === 'resize') env.emit('resize');
    else for (const fn of env.media.listeners) fn();
    await env.flush();
    assert.equal(navigations, 1, `${trigger} crosses`);
    assert.equal(env.layer().children.length, 0);
    assert.equal(env.portal.gatewayState(), 'navigating');
  }
  // An externally cancelled or stalled animation cannot strand the cover.
  const cancelled = environment();
  let navigations = 0;
  cancelled.portal.enterWorld({
    origin,
    reduced: false,
    navigate: () => navigations++,
  });
  cancelled.layer().children[1].animations[0].cancel();
  await cancelled.flush();
  assert.equal(navigations, 1, 'cancelled animation still crosses');
  const stalled = environment();
  let stalledNavigations = 0;
  stalled.portal.enterWorld({
    origin,
    reduced: false,
    navigate: () => stalledNavigations++,
  });
  await stalled.advance(tokens.DURATION.cinematic + 400);
  assert.equal(stalledNavigations, 1, 'stalled animation still crosses');
  // No Web Animations support: cover and cross immediately.
  const flat = environment({ animations: false });
  let flatNavigations = 0;
  flat.portal.enterWorld({
    origin,
    reduced: false,
    navigate: () => flatNavigations++,
  });
  assert.equal(flatNavigations, 1);
}

{
  // Watchdogs: the route never arrives → open the real link; the Lobby never
  // releases → reveal it anyway. A throwing router also falls back.
  const lost = environment();
  lost.portal.enterWorld({ origin, reduced: false, navigate: () => {} });
  lost.layer().children[1].animations[0].finish();
  await lost.flush();
  await lost.advance(4000);
  assert.deepEqual(lost.assigned, ['/world'], 'document navigation fallback');
  const silent = environment();
  silent.portal.enterWorld({
    origin,
    reduced: false,
    navigate: () => {
      silent.window.location.pathname = '/world';
    },
  });
  const layer = silent.layer();
  layer.children[1].animations[0].finish();
  await silent.flush();
  await silent.advance(2500);
  const [fade] = layer.animations.slice(-1);
  assert.deepEqual(
    [...fade.keyframes].map((k) => k.opacity),
    [1, 0],
  );
  fade.finish();
  await silent.flush();
  assert.equal(silent.body.children.length, 0, 'unreleased cover lifts');
  const throwing = environment();
  throwing.portal.enterWorld({
    origin,
    reduced: false,
    navigate: () => {
      throw new Error('router unavailable');
    },
  });
  throwing.layer().children[1].animations[0].finish();
  await throwing.flush();
  assert.deepEqual(throwing.assigned, ['/world']);
}

{
  // 12. Back navigation, pagehide and restored pages leave nothing behind.
  const back = environment();
  let navigations = 0;
  back.portal.enterWorld({
    origin,
    reduced: false,
    navigate: () => navigations++,
  });
  back.window.location.pathname = '/spaces';
  back.emit('popstate');
  await back.advance(5000);
  assert.equal(back.body.children.length, 0, 'aborted on back navigation');
  assert.equal(back.portal.gatewayState(), 'idle');
  assert.equal(navigations, 0);
  assert.equal(back.listenerCount(), 0);
  assert.deepEqual(back.assigned, []);
  const hidden = environment();
  let hiddenNavigations = 0;
  hidden.portal.enterWorld({
    origin,
    reduced: false,
    navigate: () => hiddenNavigations++,
  });
  hidden.emit('pagehide', { persisted: true });
  await hidden.advance(5000);
  assert.equal(hidden.body.children.length, 0, 'pagehide removes the cover');
  assert.equal(hidden.portal.gatewayState(), 'idle');
  assert.equal(hidden.listenerCount(), 0);
  assert.equal(hiddenNavigations, 0, 'no late navigation after pagehide');
  assert.deepEqual(hidden.assigned, []);
  const restored = environment();
  restored.portal.enterWorld({ origin, reduced: false, navigate: () => {} });
  restored.emit('pageshow', { persisted: true });
  assert.equal(restored.body.children.length, 0, 'bfcache restore cleans up');
  assert.equal(restored.portal.gatewayState(), 'idle');
  // A new crossing works after an abort.
  assert.equal(
    restored.portal.enterWorld({ origin, reduced: false, navigate: () => {} }),
    true,
  );
}

console.log(
  'World gateway passed: five-room data model from one source, Gallery → /worlds, all five rooms open at their own paths, no Lobby WebGL, real /world link with intent-only prefetch, untouched room shortcuts, 44px targets, and a portal that ignores modifier/middle clicks and double activation, uses compositor-only motion, covers flat in reduced motion, crosses after resize or stalls, falls back to the real link, and cleans up on arrival, back navigation, pagehide and restore.',
);
