/** Owned lifecycle checks for Home Worlds, without simulating browser metrics. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { loadMotion, loadStoryMath } from './load-story-math.mjs';
const source = readFileSync(
  new URL(
    '../components/home/experience/home-story-timeline.ts',
    import.meta.url,
  ),
  'utf8',
);
const { outputText } = ts.transpileModule(
  source.replaceAll('import.meta.env.DEV', 'false'),
  {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
    },
  },
);

const mathModule = { exports: loadStoryMath('home-story-frame') };
const bridgeModule = loadStoryMath('atmospheric-bridge-frame');
function browser({
  reduced = false,
  width = 1440,
  missing = false,
  sceneImage = 'ready',
  initialScroll = 0,
  sky = false,
  fine = true,
  saveData = false,
  // TP3D STEP 1: off, a frame shows the position it was scrolled to (what
  // every state assertion below samples); on, the real MOTION.follow.
  follow = false,
  // TP3D STEP 2: off, the share of the distance scrolled is story progress;
  // on, the real MOTION.pace.
  pace = false,
} = {}) {
  const events = [],
    frames = new Map(),
    resizes = [],
    operations = [],
    measurements = [],
    paints = [];
  let sequence = 0;
  let clock = 0;
  class Events {
    listeners = new Map();
    constructor() {
      events.push(this);
    }
    addEventListener(name, fn) {
      if (!this.listeners.has(name)) this.listeners.set(name, new Set());
      this.listeners.get(name).add(fn);
    }
    removeEventListener(name, fn) {
      this.listeners.get(name)?.delete(fn);
    }
    emit(name, event) {
      for (const fn of this.listeners.get(name) ?? []) fn(event);
    }
  }
  class Style {
    values = new Map();
    priorities = new Map();
    setProperty(name, value, priority = '') {
      operations.push('write');
      this.values.set(name, value);
      this.priorities.set(name, priority);
    }
    getPropertyValue(name) {
      return this.values.get(name) ?? '';
    }
    getPropertyPriority(name) {
      return this.priorities.get(name) ?? '';
    }
    removeProperty(name) {
      operations.push('write');
      this.values.delete(name);
      this.priorities.delete(name);
    }
    set transform(v) {
      this.setProperty('transform', v);
    }
    get transform() {
      return this.getPropertyValue('transform');
    }
    set opacity(v) {
      this.setProperty('opacity', v);
    }
    get opacity() {
      return this.getPropertyValue('opacity');
    }
  }
  class Node extends Events {
    attrs = new Map();
    get inert() {
      return this.hasAttribute('inert');
    }
    set inert(value) {
      this.toggleAttribute('inert', value);
    }
    classList = {
      contains: (name) =>
        name === 'hc-atrium-room-link' && this.tagName === 'A',
    };
    querySelector() {
      return null;
    }
    querySelectorAll() {
      return [];
    }
    hasAttribute(n) {
      return this.attrs.has(n);
    }
    toggleAttribute(n, enabled) {
      if (enabled) this.setAttribute(n, '');
      else this.removeAttribute(n);
    }
    get offsetHeight() {
      return this.height;
    }
    contains() {
      return false;
    }
    getAttribute(n) {
      return this.attrs.get(n) ?? null;
    }
    setAttribute(n, v) {
      this.attrs.set(n, String(v));
    }
    removeAttribute(n) {
      this.attrs.delete(n);
      if (n.startsWith('data-'))
        delete this.dataset[
          n.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())
        ];
    }
    dataset = new Proxy(
      {},
      {
        get: (_, key) =>
          this.attrs.get(
            'data-' +
              String(key).replace(/[A-Z]/g, (c) => '-' + c.toLowerCase()),
          ),
        set: (_, key, value) => {
          this.setAttribute(
            'data-' +
              String(key).replace(/[A-Z]/g, (c) => '-' + c.toLowerCase()),
            value,
          );
          return true;
        },
        deleteProperty: (_, key) => {
          this.attrs.delete(
            'data-' +
              String(key).replace(/[A-Z]/g, (c) => '-' + c.toLowerCase()),
          );
          return true;
        },
      },
    );
    style = new Style();
    constructor(top = 0, height = 900) {
      super();
      this.top = top;
      this.height = height;
    }
    getBoundingClientRect() {
      operations.push('read');
      return {
        top: this.top - window.scrollY,
        height: this.height,
        bottom: this.top - window.scrollY + this.height,
        width,
        left: 0,
      };
    }
  }
  const window = Object.assign(new Events(), {
    scrollY: initialScroll,
    innerHeight: 900,
    // This double is the story without the room orbit (its own checks are
    // check:atrium-orbit and check:atrium-orbit-foundation).
    location: { search: '?atriumOrbit=0' },
  });
  window.scrollTo = () =>
    assert.fail('HomeStory must never force native scroll');
  const document = Object.assign(new Events(), {
    hidden: false,
    documentElement: new Node(),
    readyState: 'complete',
  });
  const header = new Node(0, 80),
    world = new Node(0, 900),
    root = new Node(0, 3240),
    sequenceNode = new Node(0, 3240),
    stage = new Node(0, 900),
    story = new Node(0, 900),
    image = new Node(),
    camera = new Node(),
    rooms = new Node(),
    architecture = new Node(),
    centerCopy = new Node(),
    colophon = new Node();
  const reveals = Array.from({ length: 11 }, (_, i) => {
    const node = new Node();
    node.dataset.chapterReveal = String(Math.min(i, 9));
    node.tagName = i < 4 || i === 9 ? 'A' : 'SPAN';
    return node;
  });
  const nodes = {
    '[data-home-story]': sequenceNode,
    '[data-home-story-stage]': stage,
    '.spatial-hero': story,
    '.hc-worlds': world,
  };
  root.querySelector = (s) => (missing ? null : nodes[s]);
  const openingNodes = Object.fromEntries(
    Object.keys(mathModule.exports.arrivalFrame(0, width, true)).map((k) => [
      k,
      new Node(),
    ]),
  );
  const openingGroups = Object.fromEntries(
    Object.entries(openingNodes).map(([selector, node]) => [
      selector,
      selector.includes(',') || selector.includes(':first-child')
        ? [node, new Node()]
        : [node],
    ]),
  );
  const sharedTP = new Node();
  const skyHost = sky ? new Node() : null;
  const heroLifecycle = {
    created: 0,
    suspended: 0,
    destroyed: 0,
    updates: [],
    ticks: [],
    alive: false,
    wake: null,
  };
  const skyLifecycle = {
    created: 0,
    suspended: 0,
    destroyed: 0,
    updates: [],
    ticks: [],
    mode: 'dormant',
    alive: false,
    wake: null,
  };
  const readStory = new Node();
  sharedTP.setAttribute('aria-hidden', 'true');
  stage.querySelector = (selector) =>
    selector === '[data-shared-tp]'
      ? sharedTP
      : selector === '[data-atmospheric-sky-bridge]'
        ? skyHost
        : null;
  openingGroups['.sh-story-signoff, .sh-read-story, .sh-center-copy'].push(
    readStory,
  );
  root.querySelectorAll = (selector) => openingGroups[selector] ?? [];
  const discovery = openingNodes['.sh-discovery'],
    portalGroup = openingNodes['.sh-portals'],
    portals = Array.from({ length: 4 }, () => new Node());
  const secondary = new Node();
  secondary.dataset = {
    src: '/b.webp',
    srcset: '/b-720.webp 720w',
    sizes: '100vw',
  };
  secondary.complete = false;
  secondary.naturalWidth = 0;
  secondary.decode = () => Promise.resolve();
  const bridgeNodes = {
    '.sh-plane-background': architecture,
    '.sh-center-copy': centerCopy,
    '.sh-colophon': colophon,
  };
  story.querySelector = (s) =>
    bridgeNodes[s] ??
    (s === '.sh-read-story'
      ? readStory
      : s === '.sh-discovery'
        ? discovery
        : s === '.sh-portals'
          ? portalGroup
          : s === 'img[data-hero-deferred]'
            ? secondary
            : (openingNodes[s] ?? null));
  story.querySelectorAll = (s) => (s === '.sh-portal' ? portals : []);

  world.querySelector = (selector) =>
    ({
      '[data-scene3-camera]': camera,
      '.hc-atrium-rooms': rooms,
      '.hc-atrium-backdrop img': image,
    })[selector] ?? null;
  world.querySelectorAll = (selector) =>
    selector === '[data-chapter-reveal]' ? reveals : [];
  header.dataset.opening = 'story';
  document.querySelector = () => header;
  const media = new Map([
    [
      '(hover: hover) and (pointer: fine)',
      Object.assign(new Events(), { matches: fine }),
    ],
    [
      '(prefers-reduced-motion: reduce)',
      Object.assign(new Events(), { matches: reduced }),
    ],
  ]);
  window.matchMedia = (query) => media.get(query);
  class ResizeObserver {
    targets = [];
    disconnected = false;
    constructor(fn) {
      this.fn = fn;
      resizes.push(this);
    }
    observe(node) {
      this.targets.push(node);
    }
    disconnect() {
      this.disconnected = true;
      this.targets = [];
    }
  }
  const imageCallbacks = {};
  const imageLifecycle = { prepared: 0, disposed: 0 };
  const imageStarts = { count: 0 };
  const prepareSceneImage = (plate, callbacks) => {
    assert.equal(plate, image, 'preload reuses the existing responsive image');
    imageLifecycle.prepared++;
    Object.assign(imageCallbacks, callbacks);
    let disposed = false,
      started = false;
    return {
      start() {
        if (started || disposed) return;
        started = true;
        imageStarts.count++;
        if (sceneImage === 'ready') callbacks.ready();
        if (sceneImage === 'failed') callbacks.failed();
      },
      destroy() {
        if (!disposed) imageLifecycle.disposed++;
        disposed = true;
      },
    };
  };
  const loaded = { exports: {} };
  runInNewContext(outputText, {
    module: loaded,
    exports: loaded.exports,
    require(path) {
      if (path === './atmospheric-sky-renderer')
        return {
          createAtmosphericSkyBridge(host, wake) {
            assert.equal(host, skyHost);
            skyLifecycle.created++;
            skyLifecycle.wake = wake;
            return {
              update(input) {
                skyLifecycle.updates.push({ ...input });
                host.dataset.skyState = skyLifecycle.mode;
              },
              tick(now) {
                skyLifecycle.ticks.push(now);
              },
              wantsTime: () => skyLifecycle.alive,
              suspend() {
                skyLifecycle.suspended++;
                skyLifecycle.alive = false;
              },
              destroy() {
                skyLifecycle.destroyed++;
                host.removeAttribute('data-sky-state');
              },
              debug: () => 'stub atmosphere',
            };
          },
        };
      if (path === './hero-depth')
        return {
          createHeroDepth(host, wake) {
            assert.equal(host, stage, 'pointer depth belongs to the stage');
            heroLifecycle.created++;
            heroLifecycle.wake = wake;
            return {
              update(input) {
                heroLifecycle.updates.push({ ...input });
              },
              tick(now) {
                heroLifecycle.ticks.push(now);
              },
              wantsTime: () => heroLifecycle.alive,
              suspend() {
                heroLifecycle.suspended++;
                heroLifecycle.alive = false;
              },
              destroy() {
                heroLifecycle.destroyed++;
              },
            };
          },
        };
      if (path === './home-production') return loadStoryMath('home-production');
      if (path === './room-discovery')
        return {
          createRoomDiscovery: () => ({
            update() {},
            suspend() {},
            destroy() {},
          }),
        };
      if (path === './home-motion') return loadMotion({ follow, pace });
      if (path === './home-story-frame') return mathModule.exports;
      if (path === './atmospheric-bridge-frame') return bridgeModule;
      // TP3D PASS — Atrium room orbit: the pure orbit frame (no base marker
      // in this double, so no orbit span).
      if (path === './worlds-orbit') return loadStoryMath('worlds-orbit');
      assert.equal(path, './scene-image');
      return { prepareSceneImage };
    },
    window,
    document,
    URLSearchParams,
    navigator: saveData ? { connection: { saveData: true } } : {},
    ResizeObserver,
    getComputedStyle(node) {
      assert.equal(
        node,
        sharedTP,
        'TP responsive geometry is read from the shared stage object',
      );
      operations.push('read');
      const mobile = width < 768;
      const tablet = width >= 768 && width < 1200;
      const portrait = tablet && stage.height > width;
      return {
        width: `${width * (mobile ? 0.38 : tablet ? 0.3 : 0.258)}px`,
        height: `${stage.height * (mobile ? 0.18 : portrait ? 0.3 : tablet ? 0.37 : 0.49)}px`,
        getPropertyValue: (name) =>
          ({
            '--sh-monogram-story-x': mobile ? '-21vw' : '0px',
            '--sh-monogram-story-y': mobile
              ? '19svh'
              : portrait
                ? '24svh'
                : tablet
                  ? '8svh'
                  : '13svh',
            '--sh-monogram-story-scale': mobile
              ? '.88'
              : portrait
                ? '.8'
                : '.86',
            '--tp-base-opacity': mobile ? '.75' : '1',
          })[name] ?? '',
      };
    },
    performance: { now: () => clock },
    requestAnimationFrame(fn) {
      const id = ++sequence;
      frames.set(id, fn);
      return id;
    },
    cancelAnimationFrame(id) {
      frames.delete(id);
    },
    // The image preparation lifecycle is isolated in check-scene-image.mjs.
  });
  const breeze = {
    measure: (...args) => measurements.push(args),
    paint: (...args) => paints.push(args),
    destroy: () => {},
  };
  const flush = (elapsed = 1000 / 60) => {
    clock += elapsed;
    const tasks = [...frames.values()];
    frames.clear();
    tasks.forEach((fn) => fn(clock));
  };
  const scroll = (y) => {
    window.scrollY = y;
    window.emit('scroll');
  };
  const count = () => ({
    frames: frames.size,
    listeners: events.reduce(
      (n, e) => n + [...e.listeners.values()].reduce((a, s) => a + s.size, 0),
      0,
    ),
    observers: resizes.filter((o) => !o.disconnected).length,
  });
  return {
    ...loaded.exports,
    root,
    story,
    world,
    camera,
    rooms,
    architecture,
    centerCopy,
    colophon,
    header,
    reveals,
    portals,
    openingNodes,
    openingGroups,
    sharedTP,
    skyHost,
    skyLifecycle,
    heroLifecycle,
    readStory,
    secondary,
    discovery,
    portalGroup,
    stage,
    sequenceNode,
    imageCallbacks,
    imageLifecycle,
    imageStarts,
    window,
    document,
    media,
    resizes,
    operations,
    measurements,
    paints,
    breeze,
    flush,
    scroll,
    setWidth: (nextWidth) => {
      width = nextWidth;
    },
    count,
  };
}

const f = browser();
const dispose = f.createHomeStoryTimeline(f.root, f.breeze);
assert.equal(f.root.dataset.storyProgress, '0.00000');
f.flush();
f.flush();
assert.equal(
  f.secondary.src,
  '/b.webp',
  'Scene B still loads after initial paint',
);
assert.equal(f.count().frames, 0, 'no continuous idle animation loop');
assert.equal(
  f.window.listeners.get('scroll').size,
  1,
  'one native scroll owner',
);
assert.equal(f.resizes.length, 1, 'one shared geometry observer');
assert.equal(f.world.inert, true);
const at = (p) => {
  f.scroll(p * 2340);
  f.flush();
};
const visible = (node, expected) => {
  assert.equal(node.inert, !expected);
  assert.equal(node.getAttribute('aria-hidden'), String(!expected));
};
f.scroll(500);
f.scroll(600);
assert.equal(f.count().frames, 1, 'coalesce input bursts into one paint');
const reads = f.operations.filter((op) => op === 'read').length;
f.flush();
assert.equal(
  f.operations.filter((op) => op === 'read').length,
  reads,
  'scroll reads neither layout nor computed TP styles',
);
at(0);
visible(f.discovery, true);
visible(f.portalGroup, true);
visible(f.openingNodes['.sh-story'], false);
visible(f.world, false);
assert.equal(f.sharedTP.dataset.tpState, 'scene1');
assert.equal(f.sharedTP.style.opacity, '1.00000');
at(0.26);
assert.equal(f.sharedTP.dataset.tpState, 'travel');
assert.equal(
  f.sharedTP.style.opacity,
  '1.00000',
  'content cannot fade the shared artifact',
);
assert.equal(f.sharedTP.style.getPropertyValue('will-change'), 'transform');
for (const nodes of Object.values(f.openingGroups))
  for (const node of nodes)
    assert(
      node.style.opacity !== '' || node.style.transform !== '',
      'all matching content nodes receive the master frame',
    );
at(0.299);
visible(f.portalGroup, false);
at(0.34);
visible(f.readStory, false);
at(0.46);
visible(f.discovery, false);
visible(f.portalGroup, false);
visible(f.openingNodes['.sh-story'], true);
visible(f.world, false);
visible(f.readStory, true);
assert.equal(f.sharedTP.dataset.tpState, 'scene2');
assert.equal(f.sharedTP.style.getPropertyValue('will-change'), 'auto');
const settledTP = f.sharedTP.style.transform;
for (const progress of [0.47, 0.48]) {
  at(progress);
  assert.equal(f.sharedTP.style.transform, settledTP);
  assert.equal(f.sharedTP.style.opacity, '1.00000');
  assert.equal(f.sharedTP.style.getPropertyValue('visibility'), 'visible');
}
at(0.55);
assert.notEqual(
  f.sharedTP.style.transform,
  settledTP,
  'TP recedes before world swap',
);
assert(
  Number(f.sharedTP.style.opacity) > 0.8,
  'early TP departure preserves object continuity',
);
visible(f.readStory, false);
for (const p of [0.64, 0.65, 0.75, 0.85]) {
  at(p);
  visible(f.story, false);
  visible(f.world, false);
  assert.equal(
    f.world.style.getPropertyValue('visibility'),
    'visible',
    'architecture precedes interactive content',
  );
  assert.equal(f.sharedTP.style.getPropertyValue('visibility'), 'hidden');
  for (const node of f.reveals.filter((n) => n.tagName === 'A'))
    visible(node, false);
}
at(0.65);
for (const node of f.reveals)
  assert.equal(
    node.style.opacity,
    '0.00000',
    'sky has no room labels/title/CTA',
  );
// TP3D PASS 04: dark ink while sky dominates the band behind the header,
// half-way exactly at the centre of the measured luminance crossover.
at(0.78);
assert.equal(f.header.dataset.chapterTheme, 'light');
const headerWindow = loadStoryMath('home-motion').MOTION.header;
at((headerWindow[0] + headerWindow[1]) / 2);
assert.equal(f.header.dataset.chapterTheme, 'bridge');
assert.equal(f.header.style.getPropertyValue('--home-header-ivory'), '50.000%');
at(0.905);
visible(f.world, true);
for (const node of f.reveals.slice(0, 4)) visible(node, true);
visible(f.reveals[9], false);
at(0.92);
for (const node of f.reveals.filter((n) => n.tagName === 'A'))
  visible(node, true);
assert.equal(f.header.dataset.chapterTheme, 'dark');
assert.equal(f.camera.style.transform, 'none');
assert.equal(f.camera.style.getPropertyValue('will-change'), 'auto');
f.operations.length = 0;
for (const p of [0.95, 1]) at(p);
assert.equal(
  f.operations.length,
  0,
  'settled Scene3 performs no visual writes or reads',
);
assert.equal(f.count().frames, 0);
// Native focus may adjust scroll to an absolute child's layout position.
// The driver must follow that position; it must not scroll the browser back.
at(0.95);
f.world.emit('focusin', { target: f.reveals[1] });
at(0.878);
assert.equal(f.root.dataset.storyProgress, '0.87800');
visible(f.world, false);
assert.equal(f.world.style.getPropertyValue('visibility'), 'visible');
f.scroll(3240);
f.flush();
assert.equal(
  f.header.dataset.chapterTheme,
  'light',
  'Footer returns the header theme',
);

const positions = [
  0, 0.16, 0.27, 0.3, 0.33, 0.46, 0.48, 0.55, 0.59, 0.62, 0.65, 0.75, 0.8,
  0.905, 0.92, 1,
];
const sample = (p) => {
  at(p);
  for (let i = 0; i < 20 && f.count().frames; i++) f.flush();
  assert.equal(f.count().frames, 0, 'bounded visual mass must come to rest');
  return [
    f.root.dataset.storyProgress,
    f.root.dataset.storyChapter,
    f.story.inert,
    f.world.inert,
    f.sharedTP.style.transform,
    f.sharedTP.style.opacity,
    f.sharedTP.dataset.tpState,
    f.camera.style.transform,
    f.world.style.getPropertyValue('visibility'),
    f.architecture.style.opacity,
    f.header.style.getPropertyValue('--home-header-ivory'),
    ...f.reveals.map((n) => [n.style.opacity, n.style.transform, n.inert]),
    ...Object.values(f.openingNodes).map((n) => [
      n.style.opacity,
      n.style.transform,
    ]),
  ];
};
assert.deepEqual(
  positions.map(sample),
  positions.toReversed().map(sample).reverse(),
  'reverse scroll has the same scene state',
);

f.window.scrollY = 2340 * 0.72;
f.window.emit('pageshow');
assert.equal(
  f.root.dataset.storyProgress,
  '0.72000',
  'history restoration applies before the next paint',
);
visible(f.world, false);
assert.equal(f.world.style.getPropertyValue('visibility'), 'visible');
f.document.documentElement.setAttribute('data-home-intro', 'waiting');
at(0.8);
assert.equal(
  f.root.dataset.storyProgress,
  '0.00000',
  'reload intro holds the initial composition',
);
f.document.documentElement.removeAttribute('data-home-intro');
at(0.8);
assert.equal(f.root.dataset.storyProgress, '0.80000');

f.media.get('(prefers-reduced-motion: reduce)').matches = true;
f.media.get('(prefers-reduced-motion: reduce)').emit('change');
f.flush();
visible(f.world, false);
visible(f.story, false);
assert.equal(
  f.camera.style.transform,
  'none',
  'reduced final framing is static',
);
at(0.47);
visible(f.story, true);
visible(f.openingNodes['.sh-story'], true);
visible(f.discovery, false);
visible(f.world, false);
assert.equal(f.sharedTP.dataset.tpState, 'scene2');
assert.equal(f.sharedTP.style.opacity, '1.00000');
assert.equal(
  f.sharedTP.style.getPropertyValue('visibility'),
  'visible',
  'reduced motion retains the one TP in Scene 2',
);
assert.equal(f.sharedTP.style.getPropertyValue('will-change'), 'auto');
f.operations.length = 0;
f.window.emit('resize');
f.flush();
const firstWrite = f.operations.indexOf('write');
if (firstWrite !== -1)
  assert(
    !f.operations.slice(firstWrite).includes('read'),
    'resize measures before painting',
  );
f.document.hidden = true;
f.document.emit('visibilitychange');
f.scroll(1500);
assert.equal(f.count().frames, 0, 'hidden tab sleeps');
f.document.hidden = false;
f.document.emit('visibilitychange');
f.flush();
dispose();
dispose();
assert.deepEqual(f.count(), { frames: 0, listeners: 0, observers: 0 });
assert.deepEqual(f.imageLifecycle, { prepared: 1, disposed: 1 });
assert.equal(
  f.header.dataset.opening,
  'story',
  'owned header attributes are restored',
);
assert.equal(f.root.hasAttribute('data-story-progress'), false);
assert.equal(f.root.hasAttribute('data-bridge-phase'), false);
assert.equal(f.header.style.getPropertyValue('--home-header-ivory'), '');
assert.equal(f.world.hasAttribute('inert'), false);
assert.equal(f.world.hasAttribute('aria-hidden'), false);
assert.equal(f.sharedTP.hasAttribute('data-tp-state'), false);
assert.equal(f.sharedTP.getAttribute('aria-hidden'), 'true');

// Only large visual planes retain a bounded response after input stops.
// Text, links, header and Breeze must already equal the native-progress frame.
for (const width of [390, 820, 1440]) {
  const b = browser({ width, initialScroll: 2340 * 0.75 });
  const stop = b.createHomeStoryTimeline(b.root, b.breeze);
  b.flush();
  b.flush();
  const ui = () =>
    JSON.stringify([
      b.header.style.getPropertyValue('--home-header-ivory'),
      b.world.inert,
      b.rooms.style.transform,
      b.sharedTP.style.transform,
      b.sharedTP.style.opacity,
      ...b.reveals.map((n) => [n.style.opacity, n.style.transform, n.inert]),
    ]);
  const targetAt = (p) => {
    const pose = bridgeModule.atriumPose(
      p,
      bridgeModule.measureAtrium(width, 900),
    );
    // The master clears the transform at the exact identity pose; through
    // the bridge it writes every other pose flat, in 2D (PASS 6B.1).
    if (pose.x === 0 && pose.y === 0 && pose.scale === 1) return 'none';
    return `translate(${pose.x.toFixed(3)}px, ${pose.y.toFixed(3)}px) scale(${pose.scale.toFixed(7)})`;
  };
  const baseline = b.count();
  for (let cycle = 0; cycle < 20; cycle++) {
    // TP3D PASS 04: the first room label begins at 0.845, during the last
    // few percent of plate settling.
    for (const p of [0.78, 0.86, 0.87, 0.76, 0.61, 0.78]) {
      b.scroll(p * 2340);
      b.flush();
      const settledUI = ui();
      const paintedBreeze = b.paints.at(-1)[0];
      const reads = b.operations.filter((op) => op === 'read').length;
      if (p === 0.86)
        assert(
          Number(b.reveals[0].style.opacity) > 0,
          'UI begins on raw progress immediately',
        );
      if (p === 0.61) visible(b.world, false);
      if (width < 768)
        assert.equal(b.count().frames, 0, 'touch has no post-input mass');
      for (let frame = 0; frame < 14; frame++) {
        b.flush();
        assert.equal(ui(), settledUI, 'only architecture moves during settle');
        assert.equal(
          b.paints.at(-1)[0],
          paintedBreeze,
          'mass never delays the occluding cloth',
        );
      }
      assert.equal(
        b.operations.filter((op) => op === 'read').length,
        reads,
        'settle never reads layout',
      );
      assert.equal(
        b.count().frames,
        0,
        'one master loop sleeps after bounded settle',
      );
      assert.equal(
        b.camera.style.transform,
        targetAt(p),
        'settled camera equals reversible canonical pose',
      );
      assert.equal(
        b.camera.style.getPropertyValue('will-change'),
        'auto',
        'release temporary camera promotion on pause',
      );
    }
    assert.deepEqual(
      b.count(),
      baseline,
      '20 cycles retain one owner without accumulating resources',
    );
  }
  b.scroll(0.82 * 2340);
  b.flush();
  b.window.emit('resize');
  b.flush();
  assert.equal(
    b.camera.style.transform,
    targetAt(0.82),
    'resize resets old mass before painting',
  );
  b.scroll(0.86 * 2340);
  b.flush(100);
  assert.equal(b.count().frames, 0, 'stalled frames resolve without a backlog');
  b.scroll(0.79 * 2340);
  b.flush();
  stop();
  assert.deepEqual(
    b.count(),
    { frames: 0, listeners: 0, observers: 0 },
    'unmount cancels an active physical response',
  );
}

// The reduced static-camera cut used to hide both architectural plates at
// exactly .745. It must remain visible even when scrolling stops at that value.
for (const width of [390, 820, 1440]) {
  const b = browser({ reduced: true, width, initialScroll: 2340 * 0.72 });
  const stop = b.createHomeStoryTimeline(b.root, b.breeze);
  b.flush();
  b.flush();
  const cutStates = [];
  for (const p of [0.73, 0.744, 0.745, 0.746, 0.76, 0.746, 0.745, 0.744]) {
    b.scroll(2340 * p);
    b.flush();
    assert.equal(b.story.style.getPropertyValue('visibility'), 'hidden');
    assert.equal(b.world.style.getPropertyValue('visibility'), 'visible');
    assert(
      Number(b.world.style.opacity) >= 0.65,
      'reduced framing transition retains the image while Scene2 is hidden',
    );
    assert.equal(b.camera.style.getPropertyValue('will-change'), 'auto');
    visible(b.world, false);
    for (const node of b.reveals)
      assert.equal(node.style.opacity, '0.00000', 'cut does not reveal UI');
    if (p === 0.745) {
      assert.equal(b.root.dataset.storyProgress, '0.74500');
      assert.equal(
        b.camera.style.transform,
        'none',
        'exact cut uses the static final pose without animated zoom',
      );
      const snapshot = [
        b.world.style.opacity,
        b.world.style.getPropertyValue('visibility'),
        b.camera.style.transform,
      ];
      cutStates.push(snapshot);
      b.operations.length = 0;
      b.flush();
      b.flush();
      assert.equal(b.count().frames, 0, 'paused reduced cut has no idle loop');
      assert.equal(b.operations.length, 0, 'paused reduced cut stays still');
      assert.deepEqual(
        [
          b.world.style.opacity,
          b.world.style.getPropertyValue('visibility'),
          b.camera.style.transform,
        ],
        snapshot,
        'pausing on the cut keeps the architectural plate visible',
      );
    }
  }
  assert.deepEqual(cutStates[0], cutStates[1], 'cut is identical in reverse');
  stop();
  assert.deepEqual(b.count(), { frames: 0, listeners: 0, observers: 0 });
}

for (const initiallyLocked of [true, false]) {
  const b = browser();
  // The Intro controller owns header accessibility. It can release its gate
  // after HomeStory mounts, or another owner can lock the header later.
  b.header.inert = initiallyLocked;
  b.header.setAttribute('aria-hidden', String(initiallyLocked));
  b.header.style.setProperty('opacity', initiallyLocked ? '0' : '1');
  const stop = b.createHomeStoryTimeline(b.root, b.breeze);
  b.header.inert = !initiallyLocked;
  b.header.setAttribute('aria-hidden', String(!initiallyLocked));
  b.header.style.setProperty('opacity', initiallyLocked ? '1' : '0');
  stop();
  assert.equal(
    b.header.inert,
    !initiallyLocked,
    'HomeStory cleanup must not restore a stale header interaction gate',
  );
  assert.equal(b.header.getAttribute('aria-hidden'), String(!initiallyLocked));
  assert.equal(b.header.style.opacity, initiallyLocked ? '1' : '0');
  assert.equal(b.header.dataset.opening, 'story');
  assert.equal(b.header.hasAttribute('data-chapter-theme'), false);
  assert.deepEqual(b.count(), { frames: 0, listeners: 0, observers: 0 });
}

for (let i = 0; i < 30; i++) {
  const b = browser({
    reduced: i % 2 === 0,
    width: i % 3 === 0 ? 390 : 1440,
    sky: true,
  });
  const stop = b.createHomeStoryTimeline(b.root, b.breeze);
  b.flush();
  b.flush();
  for (const p of positions) {
    b.scroll(p * 2340);
    b.flush();
  }
  b.window.emit('resize');
  stop();
  assert.deepEqual(b.count(), { frames: 0, listeners: 0, observers: 0 });
  assert.deepEqual(b.imageLifecycle, { prepared: 1, disposed: 1 });
  assert.equal(
    b.skyLifecycle.created,
    1,
    'one atmosphere controller per mount',
  );
  assert.equal(b.skyLifecycle.destroyed, 1, 'unmount owns atmosphere disposal');
  assert.equal(b.heroLifecycle.created, 1, 'one pointer depth per mount');
  assert.equal(b.heroLifecycle.destroyed, 1, 'unmount owns pointer depth');
}
const missing = browser({ missing: true });
missing.createHomeStoryTimeline(missing.root)();
assert.deepEqual(missing.count(), { frames: 0, listeners: 0, observers: 0 });
const early = browser();
early.createHomeStoryTimeline(early.root, early.breeze)();
early.flush();
assert.equal(
  early.secondary.src,
  undefined,
  'unmount cancels deferred image assignment',
);

for (const reduced of [false, true]) {
  for (const p of [0.26, 0.3, 0.47]) {
    const b = browser({ reduced, initialScroll: 2340 * p });
    const stop = b.createHomeStoryTimeline(b.root, b.breeze);
    assert.equal(b.root.dataset.storyProgress, p.toFixed(5));
    assert.equal(b.sharedTP.style.opacity, '1.00000');
    assert.equal(b.sharedTP.style.getPropertyValue('visibility'), 'visible');
    if (p === 0.47)
      assert.equal(
        b.sharedTP.dataset.tpState,
        'scene2',
        'restored Scene 2 initializes its TP before the first animation frame',
      );
    b.flush();
    b.flush();
    assert.equal(
      b.secondary.src,
      '/b.webp',
      'the reduced sticky story also prepares its Scene 2 architecture',
    );
    stop();
    assert.deepEqual(b.count(), { frames: 0, listeners: 0, observers: 0 });
  }
}

{
  const b = browser({ initialScroll: 2340 * 0.47 });
  const stop = b.createHomeStoryTimeline(b.root, b.breeze);
  b.flush();
  b.flush();
  const oldTransform = b.sharedTP.style.transform;
  b.stage.height = 768;
  b.sequenceNode.height = 768 * 3.6;
  b.window.scrollY = (b.sequenceNode.height - b.stage.height) * 0.47;
  b.window.emit('resize');
  b.window.emit('resize');
  assert.equal(b.count().frames, 1, 'resize bursts share the master frame');
  b.flush();
  assert.equal(b.root.dataset.storyProgress, '0.47000');
  assert.equal(b.sharedTP.dataset.tpState, 'scene2');
  assert.notEqual(
    b.sharedTP.style.transform,
    oldTransform,
    'resize remeasures TP target dimensions instead of using stale stage coordinates',
  );
  stop();
}

for (const sceneImage of ['ready', 'pending', 'failed']) {
  const b = browser({ sceneImage, initialScroll: 2340 * 0.75 });
  const stop = b.createHomeStoryTimeline(b.root, b.breeze);
  assert.equal(
    b.root.dataset.storyProgress,
    '0.75000',
    'initial mount samples restored scroll synchronously',
  );
  b.flush();
  b.flush();
  assert.equal(
    b.root.dataset.storyChapter,
    sceneImage === 'ready' ? 'bridge' : 'perspective',
    'chapter accessibility follows the readable scene while image decoding is pending',
  );
  visible(b.world, false);
  assert.equal(
    b.paints.at(-1)[0],
    sceneImage === 'ready' ? 0.75 : 0.48,
    'unready image retains the readable Scene2 pose without changing native progress',
  );
  assert.equal(
    b.world.style.getPropertyValue('visibility'),
    sceneImage === 'ready' ? 'visible' : 'hidden',
  );
  visible(b.story, sceneImage !== 'ready');
  b.scroll(2340 * 0.95);
  b.flush();
  assert.equal(b.root.dataset.storyProgress, '0.95000');
  visible(b.world, sceneImage === 'ready');
  if (sceneImage !== 'ready') {
    assert.equal(
      b.openingNodes['.sh-story'].style.opacity,
      '1.00000',
      'failed/slow image keeps complete readable manifesto',
    );
    assert.equal(b.sharedTP.style.opacity, '1.00000');
    assert.equal(b.camera.style.getPropertyValue('will-change'), 'auto');
  }
  b.window.emit('pageshow');
  assert.equal(b.root.dataset.storyProgress, '0.95000');
  if (sceneImage === 'pending') {
    b.imageCallbacks.ready();
    b.flush();
    assert.equal(
      b.root.dataset.storyProgress,
      '0.95000',
      'decoding cannot rewrite native progress',
    );
    visible(b.world, true);
    visible(b.story, false);
    assert.equal(
      b.camera.style.transform,
      'none',
      'late decode resolves directly to current frame',
    );
  }
  stop();
  assert.deepEqual(b.count(), { frames: 0, listeners: 0, observers: 0 });
}

// Header style ownership is narrower than the Intro's accessibility state.
{
  const b = browser();
  b.header.style.setProperty('--home-header-ivory', '17%', 'important');
  const stop = b.createHomeStoryTimeline(b.root, b.breeze);
  b.flush();
  b.scroll(2340 * 0.95);
  b.flush();
  assert.equal(
    b.header.style.getPropertyValue('--home-header-ivory'),
    '100.000%',
  );
  stop();
  assert.equal(b.header.style.getPropertyValue('--home-header-ivory'), '17%');
  assert.equal(
    b.header.style.getPropertyPriority('--home-header-ivory'),
    'important',
  );
}

// The optional WebGL renderer consumes the same master frame. It never owns a
// second scroll/resize/visibility loop or changes content accessibility.
{
  const b = browser({ sky: true, initialScroll: 2340 * 0.47 });
  const stop = b.createHomeStoryTimeline(b.root, b.breeze);
  b.flush();
  b.flush();
  const sampleSky = (p, mode = 'active') => {
    b.skyLifecycle.mode = mode;
    b.scroll(p * 2340);
    b.flush();
    return b.skyLifecycle.updates.at(-1);
  };
  assert.equal(b.skyLifecycle.created, 1);
  assert.equal(b.window.listeners.get('scroll').size, 1);
  assert.equal(b.resizes.length, 1);
  assert.equal(
    b.paints.at(-1)[2],
    0,
    'DOM Breeze remains intact before takeover',
  );
  const [takeoverStart, takeoverEnd] =
    loadStoryMath('home-motion').MOTION.breeze.takeover;
  sampleSky(takeoverStart);
  assert.equal(
    b.paints.at(-1)[2],
    0,
    'handoff starts with the complete Breeze',
  );
  const handoffMidpoint = (takeoverStart + takeoverEnd) / 2;
  const skyFrame = sampleSky(handoffMidpoint);
  assert.equal(
    skyFrame.progress,
    handoffMidpoint,
    'cloud camera follows canonical progress',
  );
  assert.equal(skyFrame.width, 1440);
  assert.equal(skyFrame.height, 900);
  assert.equal(skyFrame.reduced, false);
  assert.equal(skyFrame.fine, true);
  assert.equal(skyFrame.visible, true);
  assert.equal(skyFrame.sceneReady, true);
  assert.equal(skyFrame.saveData, false);
  assert.equal(
    typeof skyFrame.now,
    'number',
    'the master supplies its frame timestamp',
  );
  assert(b.paints.at(-1)[2] > 0 && b.paints.at(-1)[2] < 1);
  sampleSky(takeoverEnd);
  assert.equal(
    b.paints.at(-1)[2],
    1,
    'Breeze yields once atmosphere takes over',
  );
  sampleSky(0.76, 'ready');
  assert.equal(
    b.paints.at(-1)[2],
    1,
    'completed atmospheric crossing cannot bring the cloth back over sky',
  );
  sampleSky(0.62, 'fallback');
  assert.equal(
    b.paints.at(-1)[2],
    0,
    'context fallback immediately restores DOM Breeze',
  );
  sampleSky(0.66);
  sampleSky(0.49, 'ready');
  assert.equal(
    b.paints.at(-1)[2],
    0,
    'reverse restores the original Scene2 cloth',
  );
  b.skyLifecycle.wake();
  b.skyLifecycle.wake();
  assert.equal(
    b.count().frames,
    1,
    'shader readiness coalesces on the master RAF',
  );
  b.flush();
  b.media.get('(hover: hover) and (pointer: fine)').matches = false;
  b.media.get('(hover: hover) and (pointer: fine)').emit('change');
  b.flush();
  assert.equal(
    b.skyLifecycle.updates.at(-1).fine,
    false,
    'pointer changes recalculate the tier',
  );
  sampleSky(0.66);
  b.skyLifecycle.mode = 'fallback';
  b.setWidth(390);
  b.window.emit('resize');
  b.flush();
  assert.equal(b.skyLifecycle.updates.at(-1).width, 390);
  assert.equal(
    b.paints.at(-1)[2],
    0,
    'resizing into mobile fallback clears an active takeover',
  );
  b.skyLifecycle.mode = 'active';
  b.setWidth(1440);
  b.window.emit('resize');
  b.flush();
  assert.equal(
    b.paints.at(-1)[2],
    1,
    'eligible resize can resume the current atmospheric frame',
  );
  b.skyLifecycle.mode = 'fallback';
  b.media.get('(prefers-reduced-motion: reduce)').matches = true;
  b.media.get('(prefers-reduced-motion: reduce)').emit('change');
  b.flush();
  assert.equal(
    b.paints.at(-1)[2],
    0,
    'enabling reduced motion clears a previous takeover',
  );
  b.skyLifecycle.mode = 'active';
  b.media.get('(prefers-reduced-motion: reduce)').matches = false;
  b.media.get('(prefers-reduced-motion: reduce)').emit('change');
  b.flush();
  assert.equal(b.paints.at(-1)[2], 1);
  // Stop scrolling inside the cloud: the master keeps one frame alive for the
  // air, runs no narrative work for it, and stops when the air is done.
  sampleSky(0.62);
  for (let i = 0; i < 30 && b.count().frames; i++) b.flush();
  assert.equal(b.count().frames, 0, 'bounded architecture mass rests first');
  b.skyLifecycle.alive = true;
  b.skyLifecycle.wake();
  b.flush();
  const narrativeUpdates = b.skyLifecycle.updates.length;
  const paintsBefore = b.paints.length;
  const progressBefore = b.root.dataset.storyProgress;
  const ticksBefore = b.skyLifecycle.ticks.length;
  for (let i = 0; i < 60; i++) {
    assert.equal(b.count().frames, 1, 'one master RAF while the air lives');
    b.flush();
  }
  assert.equal(b.skyLifecycle.ticks.length - ticksBefore, 60);
  assert.equal(
    b.skyLifecycle.updates.length,
    narrativeUpdates,
    'ambient frames do not re-run the narrative render',
  );
  assert.equal(b.paints.length, paintsBefore, 'cloth and story stay put');
  assert.equal(b.root.dataset.storyProgress, progressBefore);
  b.scroll(2340 * 0.625);
  assert.equal(b.count().frames, 1, 'scroll shares the same RAF');
  b.flush();
  assert.equal(b.skyLifecycle.updates.at(-1).progress, 0.625);
  b.skyLifecycle.alive = false;
  b.flush();
  assert.equal(b.count().frames, 0, 'no loop once the air is done');
  // Scene 1 pointer depth eases on the same master RAF and stops when settled.
  b.heroLifecycle.alive = true;
  b.heroLifecycle.wake();
  const heroTicks = b.heroLifecycle.ticks.length;
  const heroUpdates = b.heroLifecycle.updates.length;
  for (let i = 0; i < 10; i++) {
    assert.equal(b.count().frames, 1, 'one master RAF while depth eases');
    b.flush();
  }
  assert.equal(b.heroLifecycle.ticks.length - heroTicks, 10);
  assert.equal(
    b.heroLifecycle.updates.length,
    heroUpdates,
    'pointer frames do not re-run the narrative render',
  );
  b.heroLifecycle.alive = false;
  b.flush();
  assert.equal(b.count().frames, 0, 'no loop once pointer depth settles');
  b.skyLifecycle.alive = true;
  b.skyLifecycle.wake();
  b.flush();
  b.document.hidden = true;
  b.document.emit('visibilitychange');
  const hiddenUpdates = b.skyLifecycle.updates.length;
  assert.equal(b.skyLifecycle.suspended, 1);
  assert.equal(b.heroLifecycle.suspended, 1, 'hidden tab rests pointer depth');
  b.skyLifecycle.wake();
  b.scroll(2340 * 0.66);
  b.flush();
  assert.equal(
    b.skyLifecycle.updates.length,
    hiddenUpdates,
    'hidden tabs do no WebGL frame work',
  );
  assert.equal(b.count().frames, 0);
  assert.equal(b.skyLifecycle.alive, false, 'hidden tab suspends the air');
  b.document.hidden = false;
  b.document.emit('visibilitychange');
  b.flush();
  assert.equal(b.skyLifecycle.updates.at(-1).progress, 0.66);
  assert.equal(
    b.paints.at(-1)[2],
    1,
    'visibility resume preserves takeover at the same native frame',
  );
  sampleSky(1.1, 'ready');
  assert.equal(
    b.skyLifecycle.updates.at(-1).visible,
    false,
    'Footer suspends decorative rendering',
  );
  stop();
  stop();
  assert.equal(b.skyLifecycle.destroyed, 1);
  b.skyLifecycle.wake();
  assert.deepEqual(b.count(), { frames: 0, listeners: 0, observers: 0 });
}

// A restored/fast-skipped Scene 3 has no forward active-cloud frame to set the
// latch. Warming after the original cloth exit must still prepare its reverse.
for (const initialProgress of [0.95, 0.47]) {
  const b = browser({ sky: true, initialScroll: 2340 * initialProgress });
  const stop = b.createHomeStoryTimeline(b.root, b.breeze);
  b.flush();
  b.skyLifecycle.mode = 'warming';
  b.scroll(2340 * 0.95);
  b.flush();
  assert.equal(
    b.paints.at(-1)[2],
    0,
    'an unready bridge keeps the DOM fallback',
  );
  b.skyLifecycle.mode = 'ready';
  b.skyLifecycle.wake();
  b.flush();
  assert.equal(
    b.paints.at(-1)[2],
    1,
    'ready settled Scene3 primes reverse handoff',
  );
  b.scroll(2340 * 0.75);
  b.flush();
  assert.equal(
    b.paints.at(-1)[2],
    1,
    'reverse sky cannot briefly resurrect DOM cloth',
  );
  b.skyLifecycle.mode = 'active';
  b.scroll(2340 * 0.72);
  b.flush();
  assert.equal(
    b.paints.at(-1)[2],
    1,
    'cloud re-entry preserves the same cloth takeover',
  );
  stop();
}

{
  const b = browser({ sky: true, initialScroll: 2340 * 0.74 });
  const stop = b.createHomeStoryTimeline(b.root, b.breeze);
  b.flush();
  b.skyLifecycle.mode = 'ready';
  for (const progress of [0.74, 0.8, 0.839]) {
    b.scroll(2340 * progress);
    b.flush();
    assert.equal(
      b.paints.at(-1)[2],
      0,
      'late warm-up cannot switch a still-visible DOM crossing',
    );
  }
  b.scroll(2340 * 0.85);
  b.flush();
  assert.equal(
    b.paints.at(-1)[2],
    1,
    'reverse handoff may prime once the old cloth has exited',
  );
  stop();
}

for (const sceneImage of ['pending', 'failed']) {
  const b = browser({ sky: true, sceneImage, initialScroll: 2340 * 0.68 });
  const stop = b.createHomeStoryTimeline(b.root, b.breeze);
  b.flush();
  assert.equal(b.root.dataset.storyProgress, '0.68000');
  assert.equal(b.skyLifecycle.updates.at(-1).progress, 0.48);
  assert.equal(b.skyLifecycle.updates.at(-1).sceneReady, false);
  assert.equal(
    b.paints.at(-1)[2],
    0,
    'undecoded Scene3 never starts cloud takeover',
  );
  stop();
}

for (const options of [{ reduced: true, width: 1440 }, { width: 390 }]) {
  const b = browser({ sky: true, ...options });
  const stop = b.createHomeStoryTimeline(b.root, b.breeze);
  b.skyLifecycle.mode = options.reduced ? 'fallback' : 'dormant';
  b.scroll(2340 * 0.66);
  b.flush();
  assert.equal(
    b.paints.at(-1)[2],
    0,
    'reduced motion, or an unprepared phone atmosphere, keeps the DOM bridge',
  );
  assert.equal(b.skyLifecycle.updates.at(-1).reduced, !!options.reduced);
  stop();
}

const { homeStoryFrame } = mathModule.exports;
const samples = Array.from({ length: 201 }, (_, i) => homeStoryFrame(i / 200));
assert.deepEqual(
  samples,
  Array.from({ length: 201 }, (_, i) =>
    homeStoryFrame((200 - i) / 200),
  ).reverse(),
);
for (const frame of samples)
  for (const value of Object.values(frame))
    if (typeof value === 'number') assert(Number.isFinite(value));
assert.equal(homeStoryFrame(-1).progress, 0);
assert.equal(homeStoryFrame(2).progress, 1);
assert.equal(homeStoryFrame(0).chapter, 'arrival');
assert.equal(homeStoryFrame(0.3).chapter, 'perspective');
assert.equal(homeStoryFrame(0.62).chapter, 'perspective');
assert.equal(homeStoryFrame(0.65).chapter, 'bridge');
// TP3D PASS 04: the worlds chapter (and the rail) return with the first room.
assert.equal(
  homeStoryFrame(bridgeModule.bridgeTiming.revealStart - 0.001).chapter,
  'bridge',
);
assert.equal(
  homeStoryFrame(bridgeModule.bridgeTiming.revealStart).chapter,
  'worlds',
);
const { progress: _progress, ...settled } = homeStoryFrame(0.92);
for (const p of [0.92, 0.95, 1]) {
  const { progress: _current, ...state } = homeStoryFrame(p);
  assert.deepEqual(
    state,
    settled,
    'final scene has no camera drift or long settle',
  );
}
assert.doesNotMatch(
  source,
  /preventDefault\s*\(|scrollTo\s*\(|setState\s*\(|setInterval\s*\(|addEventListener\(\s*['"](?:wheel|pointermove)['"]/,
  'driver reads native scroll without hijacking input',
);
// TP3D PASS 02: the Arrival → Perspective handoff as the master writes it.
// Fast skips, a mid-transition resize, a hidden tab and a reduced-motion
// change must all land on exactly the pure frame for that progress.
{
  const b = browser();
  const stop = b.createHomeStoryTimeline(b.root, b.breeze);
  b.flush();
  b.flush();
  const textKeys = Object.keys(b.openingGroups).filter(
    (key) =>
      !key.includes('architecture') &&
      key !== '.sh-leaves' &&
      key !== '.sh-story' &&
      key !== '.sh-discovery',
  );
  const scene1 = textKeys.filter(
    (key) =>
      key.includes('sh-welcome') ||
      key.includes('sh-discovery') ||
      key.includes('sh-portals') ||
      key.includes('sh-scroll-indicator'),
  );
  const scene2 = textKeys.filter((key) => !scene1.includes(key));
  const expectFrame = (p, width, reduced, label) => {
    const frame = mathModule.exports.arrivalFrame(p, width, true, reduced);
    for (const key of textKeys)
      for (const node of b.openingGroups[key])
        assert.equal(
          node.style.opacity,
          frame[key].opacity,
          `${label}: ${key} opacity`,
        );
  };
  const breath = (label) => {
    for (const key of [...scene1, ...scene2])
      for (const node of b.openingGroups[key])
        assert.equal(node.style.opacity, '0.00000', `${label}: ${key} clear`);
  };
  const jump = (p) => {
    b.scroll(p * 2340);
    b.flush();
  };
  jump(0.45);
  expectFrame(0.45, 1440, false, 'fast skip forward across the handoff');
  jump(0.05);
  expectFrame(0.05, 1440, false, 'fast skip back to Arrival');
  jump(0.285);
  breath('negative space');
  expectFrame(0.285, 1440, false, 'negative space');
  b.setWidth(390);
  b.window.emit('resize');
  b.flush();
  expectFrame(0.285, 390, false, 'resize to mobile mid-transition');
  breath('mobile negative space');
  b.setWidth(1440);
  b.window.emit('resize');
  b.flush();
  jump(0.33);
  b.document.hidden = true;
  b.document.emit('visibilitychange');
  b.scroll(0.36 * 2340);
  b.flush();
  expectFrame(0.33, 1440, false, 'hidden tab paints nothing');
  b.document.hidden = false;
  b.document.emit('visibilitychange');
  b.flush();
  expectFrame(0.36, 1440, false, 'resume lands on the current frame');
  jump(0.29);
  b.media.get('(prefers-reduced-motion: reduce)').matches = true;
  b.media.get('(prefers-reduced-motion: reduce)').emit('change');
  b.flush();
  expectFrame(0.29, 1440, true, 'reduced motion mid-transition');
  breath('reduced negative space');
  stop();
}
// TP3D PASS 03: Perspective → Atmosphere as the master writes it. Every
// written state equals the pure frame for the current progress, whatever the
// WebGL lifecycle, input path, viewport or motion preference.
{
  const { MOTION } = loadStoryMath('home-motion');
  const { bridgeFrame, storyTextDeparture, departureRole, bridgeTiming } =
    bridgeModule;
  const editorial = (t) => t * t * (3 - 2 * t);
  const takeover = (p) =>
    editorial(
      Math.min(
        1,
        Math.max(
          0,
          (p - MOTION.breeze.takeover[0]) /
            (MOTION.breeze.takeover[1] - MOTION.breeze.takeover[0]),
        ),
      ),
    );
  const expectBridge = (b, p, width, reduced, label) => {
    const frame = bridgeFrame(p, width, reduced);
    const visibility = (on) => (on ? 'visible' : 'hidden');
    assert.equal(
      b.story.style.getPropertyValue('visibility'),
      visibility(frame.scene2Visible),
      `${label}: Scene 2 visibility`,
    );
    assert.equal(
      b.world.style.getPropertyValue('visibility'),
      visibility(frame.scene3Visible),
      `${label}: Scene 3 visibility`,
    );
    assert.notEqual(
      b.story.style.getPropertyValue('visibility'),
      b.world.style.getPropertyValue('visibility'),
      `${label}: one world at a time`,
    );
    assert.equal(b.world.style.opacity, frame.worldOpacity.toFixed(5));
    assert.equal(b.architecture.style.opacity, frame.scene2Opacity.toFixed(5));
    assert.equal(
      b.sharedTP.style.getPropertyValue('visibility'),
      visibility(frame.scene2Visible),
      `${label}: TP belongs to Scene 2`,
    );
    if (frame.swapped) assert.equal(b.sharedTP.style.opacity, '0.00000');
    if (p > bridgeTiming.exitStart)
      for (const [selector, nodes] of Object.entries(b.openingGroups)) {
        const role = departureRole(selector);
        if (!role) continue;
        for (const node of nodes)
          assert.equal(
            node.style.opacity,
            storyTextDeparture(p, role, width, reduced).opacity.toFixed(5),
            `${label}: ${selector}`,
          );
      }
  };
  const settle = (b) => {
    for (let i = 0; i < 30 && b.count().frames; i++) b.flush();
  };
  // Fast skips and exact swap reversal, with an active atmosphere.
  {
    const b = browser({ sky: true, initialScroll: 2340 * 0.45 });
    const stop = b.createHomeStoryTimeline(b.root, b.breeze);
    b.skyLifecycle.mode = 'active';
    const jump = (p) => {
      b.scroll(2340 * p);
      b.flush();
    };
    jump(0.45);
    for (const p of [0.7, 0.45, 0.7, 0.45]) {
      jump(p);
      expectBridge(b, p, 1440, false, `fast skip to ${p}`);
    }
    assert.equal(b.paints.at(-1)[2], 0, 'Perspective keeps the whole cloth');
    for (const p of [0.6399, 0.64, 0.6401, 0.64, 0.6399, 0.63, 0.64]) {
      jump(p);
      expectBridge(b, p, 1440, false, `swap ${p}`);
      assert.equal(b.paints.at(-1)[0], p, 'cloth samples native progress');
    }
    stop();
  }
  // WebGL readiness: ready before the bridge, it takes over; once the
  // crossing has begun (during the Breeze, very late or after the swap
  // threshold) the renderer stays 'ready' and the DOM cloth carries the whole
  // crossing. A failure restores the cloth at once.
  for (const [readyAt, expectTakeover] of [
    [0.47, true],
    [0.56, false],
    [0.63, false],
    [0.66, false],
  ]) {
    const b = browser({ sky: true, initialScroll: 2340 * 0.45 });
    const stop = b.createHomeStoryTimeline(b.root, b.breeze);
    b.skyLifecycle.mode = 'warming';
    for (const p of [0.45, 0.5, 0.54, 0.56, 0.58, 0.6, 0.62, 0.64, 0.66]) {
      if (p >= readyAt)
        b.skyLifecycle.mode = readyAt < 0.5 && p > 0.5135 ? 'active' : 'ready';
      b.scroll(2340 * p);
      b.flush();
      expectBridge(b, p, 1440, false, `ready at ${readyAt}, p ${p}`);
      assert.equal(
        b.paints.at(-1)[2],
        expectTakeover && p > 0.5135 ? takeover(p) : 0,
        `ready at ${readyAt}: takeover @${p}`,
      );
    }
    if (expectTakeover) {
      b.skyLifecycle.mode = 'fallback';
      b.scroll(2340 * 0.6);
      b.flush();
      assert.equal(b.paints.at(-1)[2], 0, 'failure mid-bridge restores cloth');
      expectBridge(b, 0.6, 1440, false, 'failure mid-bridge');
    }
    stop();
  }
  {
    // Failure before activation: the complete DOM bridge, swap unchanged.
    const b = browser({ sky: true, initialScroll: 2340 * 0.45 });
    const stop = b.createHomeStoryTimeline(b.root, b.breeze);
    b.skyLifecycle.mode = 'fallback';
    for (const p of [0.5, 0.58, 0.6399, 0.64, 0.66]) {
      b.scroll(2340 * p);
      b.flush();
      assert.equal(b.paints.at(-1)[2], 0);
      expectBridge(b, p, 1440, false, `fallback ${p}`);
    }
    stop();
  }
  // Save-Data phones keep the DOM fallback; the master reports the hint.
  {
    const b = browser({ sky: true, width: 390, saveData: true });
    const stop = b.createHomeStoryTimeline(b.root, b.breeze);
    b.skyLifecycle.mode = 'fallback';
    for (const p of [0.58, 0.64, 0.66]) {
      b.scroll(2340 * p);
      b.flush();
      assert.equal(b.skyLifecycle.updates.at(-1).saveData, true);
      assert.equal(b.paints.at(-1)[2], 0, 'Save-Data keeps the DOM cloth');
      expectBridge(b, p, 390, false, `Save-Data ${p}`);
    }
    stop();
  }
  // Reduced motion: no cloth pass, no atmosphere, a dip-cut at the swap.
  {
    const b = browser({ sky: true, reduced: true });
    const stop = b.createHomeStoryTimeline(b.root, b.breeze);
    b.skyLifecycle.mode = 'fallback';
    for (const p of [
      0.6, 0.625, 0.635, 0.6399, 0.64, 0.645, 0.655, 0.64, 0.6399,
    ]) {
      b.scroll(2340 * p);
      b.flush();
      assert.equal(b.paints.at(-1)[1], true, 'reduced paints no cloth pass');
      assert.equal(b.paints.at(-1)[2], 0);
      expectBridge(b, p, 1440, true, `reduced ${p}`);
      const plate = Number(
        bridgeFrame(p, 1440, true).swapped
          ? b.world.style.opacity
          : b.architecture.style.opacity,
      );
      assert(plate >= MOTION.reduced.floor - 1e-5, 'a plate is always shown');
    }
    stop();
  }
  // Mobile tier, hidden tab, resize and orientation change mid-bridge.
  {
    const b = browser({ sky: true, width: 390, initialScroll: 2340 * 0.45 });
    const stop = b.createHomeStoryTimeline(b.root, b.breeze);
    b.skyLifecycle.mode = 'ready';
    b.flush();
    b.skyLifecycle.mode = 'active';
    b.scroll(2340 * 0.58);
    b.flush();
    assert.equal(b.skyLifecycle.updates.at(-1).width, 390);
    assert.equal(b.paints.at(-1)[2], takeover(0.58), 'mobile tier takes over');
    expectBridge(b, 0.58, 390, false, 'mobile handoff');
    b.document.hidden = true;
    b.document.emit('visibilitychange');
    b.scroll(2340 * 0.62);
    b.flush();
    assert.equal(b.count().frames, 0, 'hidden tab schedules nothing');
    b.document.hidden = false;
    b.document.emit('visibilitychange');
    b.flush();
    expectBridge(b, 0.62, 390, false, 'resume inside atmosphere');
    assert.equal(b.paints.at(-1)[2], takeover(0.62));
    b.setWidth(1440);
    b.window.emit('resize');
    b.flush();
    expectBridge(b, 0.62, 1440, false, 'resize during handoff');
    for (const [width, height] of [
      [820, 1180],
      [1180, 820],
    ]) {
      b.setWidth(width);
      b.stage.height = height;
      b.sequenceNode.height = height * 3.6;
      b.window.scrollY = height * 2.6 * 0.6;
      b.window.emit('resize');
      b.flush();
      assert.equal(b.root.dataset.storyProgress, '0.60000');
      assert.equal(b.skyLifecycle.updates.at(-1).height, height);
      expectBridge(b, 0.6, width, false, `orientation ${width}×${height}`);
    }
    stop();
  }
  // Outside the living atmosphere the master schedules no frames at all.
  {
    const b = browser({ sky: true, initialScroll: 2340 * 0.45 });
    const stop = b.createHomeStoryTimeline(b.root, b.breeze);
    b.skyLifecycle.mode = 'ready';
    for (const p of [0.45, 0.8, 0.95]) {
      b.scroll(2340 * p);
      settle(b);
      assert.equal(b.count().frames, 0, `no RAF at rest @${p}`);
    }
    stop();
  }
}
const steps = (from, to, count) =>
  Array.from({ length: count + 1 }, (_, i) => from + ((to - from) * i) / count);
// TP3D PASS 04: the Atrium reveal as the master writes it. Camera, header,
// exposure, reveals and inert state equal the pure frame for the current
// progress, in either direction, after jumps, resizes, orientation changes
// and with or without WebGL.
{
  const { MOTION } = loadStoryMath('home-motion');
  const { atriumPose, measureAtrium, worldReveal, bridgeFrame, bridgeTiming } =
    bridgeModule;
  const cameraAt = (p, width, height) => {
    const pose = atriumPose(p, measureAtrium(width, height));
    // PASS 6B.1: through the bridge the pose is flat (2D) at every scale.
    return pose.x === 0 && pose.y === 0 && pose.scale === 1
      ? 'none'
      : `translate(${pose.x.toFixed(3)}px, ${pose.y.toFixed(3)}px) scale(${pose.scale.toFixed(7)})`;
  };
  const settle = (b) => {
    for (let i = 0; i < 40 && b.count().frames; i++) b.flush();
  };
  const expectAtrium = (b, p, width, height, label) => {
    const frame = bridgeFrame(p, width);
    assert.equal(b.camera.style.transform, cameraAt(p, width, height), label);
    assert.equal(
      b.world.style.getPropertyValue('--world-exposure'),
      frame.exposure.toFixed(5),
      `${label}: exposure`,
    );
    assert.equal(
      b.header.style.getPropertyValue('--home-header-ivory'),
      `${(frame.headerIvory * 100).toFixed(3)}%`,
      `${label}: header ink`,
    );
    for (const node of b.reveals) {
      const reveal = worldReveal(p, Number(node.dataset.chapterReveal));
      assert.equal(node.style.opacity, reveal.opacity.toFixed(5), label);
      if (node.tagName === 'A')
        assert.equal(node.inert, !reveal.interactive, `${label}: link inert`);
    }
    assert.equal(b.world.inert, !frame.interactive, `${label}: world inert`);
  };
  // Fast skips, the exact endpoint and a full reverse walk.
  for (const sky of ['active', 'fallback']) {
    const b = browser({ sky: true, initialScroll: 2340 * 0.66 });
    const stop = b.createHomeStoryTimeline(b.root, b.breeze);
    b.skyLifecycle.mode = sky;
    const at = (p) => {
      b.scroll(2340 * p);
      settle(b);
    };
    at(0.66);
    expectAtrium(b, 0.66, 1440, 900, `${sky} sky suspension`);
    at(0.95);
    expectAtrium(b, 0.95, 1440, 900, `${sky} fast skip to the hold`);
    const endpoint = JSON.stringify([
      b.camera.style.transform,
      b.reveals.map((n) => [n.style.opacity, n.inert]),
      b.header.dataset.chapterTheme,
    ]);
    at(0.66);
    expectAtrium(b, 0.66, 1440, 900, `${sky} fast skip back to the sky`);
    assert.equal(b.header.dataset.chapterTheme, 'light', 'ink over the sky');
    // A slow walk forward lands on exactly the fast-skip endpoint.
    for (const p of steps(0.66, 0.95, 58)) at(p);
    assert.equal(
      JSON.stringify([
        b.camera.style.transform,
        b.reveals.map((n) => [n.style.opacity, n.inert]),
        b.header.dataset.chapterTheme,
      ]),
      endpoint,
      'the Atrium endpoint does not depend on the frames before it',
    );
    // Reverse: interface, then rooms, then camera, then sky; the header
    // returns to ink and every link is inert again before it fades.
    let roomsGone = null,
      typeGone = null,
      cameraMoved = null;
    for (const p of steps(0.95, 0.66, 290)) {
      at(p);
      expectAtrium(b, p, 1440, 900, `${sky} reverse @${p.toFixed(3)}`);
      const type = b.reveals.filter((n) => Number(n.dataset.chapterReveal) > 3);
      const rooms = b.reveals.filter(
        (n) => Number(n.dataset.chapterReveal) <= 3,
      );
      if (typeGone === null && type.every((n) => n.style.opacity === '0.00000'))
        typeGone = p;
      if (
        roomsGone === null &&
        rooms.every((n) => n.style.opacity === '0.00000')
      )
        roomsGone = p;
      if (cameraMoved === null && b.camera.style.transform !== 'none')
        cameraMoved = p;
    }
    assert(typeGone >= roomsGone, 'typography withdraws before rooms');
    assert(
      roomsGone >= cameraMoved - 0.06,
      'rooms clear as the camera departs',
    );
    assert.equal(b.header.dataset.chapterTheme, 'light');
    // Final stillness: nothing is scheduled or written in the hold.
    at(0.95);
    b.operations.length = 0;
    for (const p of [0.96, 0.98, 1]) {
      b.scroll(2340 * p);
      b.flush();
    }
    assert.equal(b.count().frames, 0, 'no narrative RAF in the final hold');
    assert.equal(
      b.operations.filter((op) => op === 'write').length,
      0,
      'the hold writes nothing',
    );
    stop();
  }
  // Resize during the pull-back, tablet orientation and phone portrait.
  {
    const b = browser({ sky: true, initialScroll: 2340 * 0.8 });
    const stop = b.createHomeStoryTimeline(b.root, b.breeze);
    b.skyLifecycle.mode = 'fallback';
    b.flush();
    settle(b);
    expectAtrium(b, 0.8, 1440, 900, 'mid pull-back');
    for (const [width, height] of [
      [1180, 820],
      [820, 1180],
      [1180, 820],
      [390, 844],
      [1440, 900],
    ]) {
      b.setWidth(width);
      b.stage.height = height;
      b.sequenceNode.height = height * 3.6;
      b.window.scrollY = height * 2.6 * 0.8;
      b.window.emit('resize');
      settle(b);
      assert.equal(b.root.dataset.storyProgress, '0.80000');
      expectAtrium(b, 0.8, width, height, `resize to ${width}×${height}`);
    }
    stop();
  }
  // Reduced motion: static framings and ordered, motionless reveals.
  {
    const b = browser({ sky: true, reduced: true, initialScroll: 2340 * 0.7 });
    const stop = b.createHomeStoryTimeline(b.root, b.breeze);
    b.skyLifecycle.mode = 'fallback';
    for (const p of [0.7, 0.744, 0.746, 0.78, 0.8, 0.86, 0.95, 0.8, 0.7]) {
      b.scroll(2340 * p);
      settle(b);
      const pose = atriumPose(p, measureAtrium(1440, 900), true);
      assert(pose.scale === 1 || pose.scale > 5, 'no animated zoom');
      for (const node of b.reveals) {
        const reveal = worldReveal(p, Number(node.dataset.chapterReveal), true);
        assert.equal(node.style.opacity, reveal.opacity.toFixed(5));
        assert.equal(node.style.transform, 'none', 'reduced UI never travels');
      }
    }
    stop();
  }
  assert(MOTION.bridge.settled === bridgeTiming.settled);
}
// ---------------------------------------------------------------------------
// TP3D STEP 1 — the scroll follow, in the real timeline. Every assertion
// above samples the frame a scroll position rests on (follow off in the
// double). These turn the real MOTION.follow on and prove that the stage
// reaches that same frame, by an even glide, and then asks for nothing.
// ---------------------------------------------------------------------------
{
  const SPAN = 2340;
  const byKey = (a, b) => a[0].localeCompare(b[0]);
  const snapshot = (b) =>
    [
      b.root,
      b.story,
      b.world,
      b.camera,
      b.rooms,
      b.architecture,
      b.centerCopy,
      b.colophon,
      b.header,
      b.sharedTP,
      b.readStory,
      b.discovery,
      b.portalGroup,
      ...b.reveals,
      ...Object.values(b.openingNodes),
    ]
      .filter(Boolean)
      .map((node) => [
        [...node.style.values].toSorted(byKey),
        [...node.attrs].toSorted(byKey),
      ]);
  const shown = (b) => Number(b.root.dataset.storyProgress);
  const mount = (options) => {
    const b = browser(options);
    const stop = b.createHomeStoryTimeline(b.root, b.breeze);
    b.flush();
    b.flush();
    return { b, stop };
  };
  // Frames until the stage is at rest, with the progress each one showed.
  const glide = (b, limit = 240) => {
    const path = [];
    while (b.count().frames && path.length < limit) {
      b.flush();
      path.push(shown(b));
    }
    assert.equal(b.count().frames, 0, 'the follow comes to rest: 0 RAF');
    return path;
  };
  const { MOTION } = loadStoryMath('home-motion');
  const { tau, frameMs } = MOTION.follow;

  // 1. The same frames at rest, reached by a glide, in both directions.
  for (const width of [1440, 1024, 390]) {
    const raw = mount({ width });
    const eased = mount({ width, follow: true });
    let from = 0;
    for (const p of [0.2, 0.47, 0.6, 0.75, 0.9, 1, 0.5, 0.05, 0]) {
      raw.b.scroll(SPAN * p);
      for (let i = 0; i < 40 && raw.b.count().frames; i++) raw.b.flush();
      eased.b.scroll(SPAN * p);
      const path = glide(eased.b);
      const label = `${width}px ${from}→${p}`;
      const sign = Math.sign(p - from);
      // p = 1 is where this stage starts to leave (the double has no orbit
      // span): the journey must be complete there, so nothing trails.
      if (p === 1) assert.deepEqual(path, [1], `${label}: complete at exit`);
      else {
        assert.ok(path.length > 12, `${label}: a glide, not a cut`);
        assert.ok(
          (path[0] - from) * sign > 0 && (p - path[0]) * sign > 0,
          `${label}: the first frame is part of the way`,
        );
      }
      assert.ok(
        path.length * frameMs <= 1500,
        `${label}: at rest in ${Math.round(path.length * frameMs)}ms`,
      );
      for (let i = 1; i < path.length; i++)
        assert.ok(
          (path[i] - path[i - 1]) * sign >= 0,
          `${label}: never back toward where it came from`,
        );
      assert.equal(eased.b.root.dataset.storyProgress, p.toFixed(5));
      assert.deepEqual(
        snapshot(eased.b),
        snapshot(raw.b),
        `${label}: the resting frame is the one raw scroll shows`,
      );
      assert.deepEqual(
        eased.b.paints.at(-1),
        raw.b.paints.at(-1),
        `${label}: the cloth rests on the same frame`,
      );
      from = p;
    }
    raw.stop();
    eased.stop();
    assert.deepEqual(eased.b.count(), {
      frames: 0,
      listeners: 0,
      observers: 0,
    });
  }

  // 2. A notched wheel reaches the stage as an even glide.
  {
    const { b, stop } = mount({ follow: true });
    const raw = mount({});
    let native = SPAN * 0.2,
      before = 0.2,
      worst = 0,
      worstRaw = 0,
      beforeRaw = 0.2;
    b.scroll(native);
    raw.b.scroll(native);
    glide(b);
    raw.b.flush();
    for (let i = 0; i < 96; i++) {
      if (i % 8 === 0) {
        native += 100;
        b.scroll(native);
        raw.b.scroll(native);
      }
      if (b.count().frames) b.flush();
      if (raw.b.count().frames) raw.b.flush();
      worst = Math.max(worst, (shown(b) - before) * SPAN);
      worstRaw = Math.max(worstRaw, (shown(raw.b) - beforeRaw) * SPAN);
      before = shown(b);
      beforeRaw = shown(raw.b);
    }
    assert.ok(worstRaw > 99, 'raw: every notch is one 100px step');
    assert.ok(worst < 20, `followed: at most ${worst.toFixed(1)}px a frame`);
    glide(b);
    assert.equal(b.root.dataset.storyProgress, (native / SPAN).toFixed(5));
    stop();
    raw.stop();
  }

  // 3. Touch trails less; reduced motion does not trail at all.
  {
    const frames = (options) => {
      const { b, stop } = mount({ follow: true, ...options });
      b.scroll(SPAN * 0.3);
      const count = glide(b).length;
      assert.equal(b.root.dataset.storyProgress, '0.30000');
      stop();
      return count;
    };
    const fine = frames({});
    const coarse = frames({ fine: false });
    assert.ok(
      coarse < fine * 0.7,
      `touch rests sooner (${coarse} vs ${fine} frames)`,
    );
    assert.ok(tau.coarse < tau.fine);
    const { b, stop } = mount({ follow: true, reduced: true });
    b.scroll(SPAN * 0.3);
    b.flush();
    assert.equal(b.root.dataset.storyProgress, '0.30000', 'reduced: raw');
    // One more frame may follow: the Atrium request this scroll started.
    assert.deepEqual(glide(b, 2), [0.3].slice(0, 1), 'reduced: no trailing');
    b.scroll(SPAN * 0.4);
    b.flush();
    assert.equal(b.root.dataset.storyProgress, '0.40000');
    assert.equal(b.count().frames, 0, 'reduced: one frame per scroll');
    stop();
  }

  // 4. Positions the visitor did not scroll to are shown as they are:
  // history restore, a tab that was hidden, the intro's hold at the top.
  {
    const { b, stop } = mount({ follow: true });
    b.scroll(SPAN * 0.2);
    b.flush();
    assert.ok(shown(b) > 0 && shown(b) < 0.2, 'mid-glide');
    b.window.scrollY = SPAN * 0.9;
    b.window.emit('pageshow');
    assert.equal(b.root.dataset.storyProgress, '0.90000', 'restore: no replay');
    assert.equal(b.count().frames, 0, 'restore: at rest at once');
    b.scroll(SPAN * 0.7);
    b.flush();
    assert.ok(shown(b) < 0.9 && shown(b) > 0.7, 'gliding again');
    b.document.hidden = true;
    b.document.emit('visibilitychange');
    assert.equal(b.count().frames, 0, 'hidden: the glide is dropped');
    b.window.scrollY = SPAN * 0.3;
    b.document.hidden = false;
    b.document.emit('visibilitychange');
    b.flush();
    assert.equal(b.root.dataset.storyProgress, '0.30000', 'shown: no replay');
    glide(b);
    b.document.documentElement.setAttribute('data-home-intro', 'waiting');
    b.scroll(SPAN * 0.3);
    b.flush();
    assert.equal(b.root.dataset.storyProgress, '0.00000', 'intro holds 0');
    assert.equal(b.count().frames, 0, 'intro: nothing to follow');
    b.document.documentElement.removeAttribute('data-home-intro');
    b.window.scrollY = 0;
    b.scroll(0);
    b.flush();
    assert.equal(b.root.dataset.storyProgress, '0.00000');
    assert.equal(b.count().frames, 0);
    b.document.documentElement.setAttribute('data-home-restoring', '');
    b.scroll(SPAN * 0.4);
    b.flush();
    assert.equal(
      b.root.dataset.storyProgress,
      '0.40000',
      'a restore in progress is sampled, not eased',
    );
    stop();
  }

  // 5. The pinned stage: complete when it starts to leave, and no frames
  // for scrolling that happens below it.
  {
    const { b, stop } = mount({ follow: true });
    b.scroll(SPAN * 0.8);
    glide(b);
    b.scroll(SPAN - 60);
    b.flush();
    assert.ok(
      shown(b) * SPAN >= SPAN - 120 - 1e-6,
      'never further behind than the room left before the exit',
    );
    b.scroll(SPAN);
    b.flush();
    assert.equal(b.root.dataset.storyProgress, '1.00000', 'complete at exit');
    glide(b);
    for (const y of [SPAN + 300, SPAN + 2000, SPAN + 900]) {
      b.scroll(y);
      b.flush();
      assert.equal(b.root.dataset.storyProgress, '1.00000');
      assert.equal(b.count().frames, 0, 'no follow frames below the stage');
    }
    b.scroll(SPAN - 300);
    b.flush();
    assert.ok(shown(b) < 1 && shown(b) * SPAN > SPAN - 300, 'back in: eased');
    glide(b);
    stop();
  }

  // 6. A plate that decodes late resumes the held bridge and eases to the
  // hand, where raw scroll cut ahead in one frame. (At 0.7 the exit of this
  // double, which has no orbit span after the journey, is still far enough
  // not to bound the follow.)
  {
    const bridge = (b) => b.paints.at(-1)[0];
    const raw = mount({ sceneImage: 'pending' });
    const eased = mount({ sceneImage: 'pending', follow: true });
    for (const { b } of [raw, eased]) {
      b.scroll(SPAN * 0.7);
      glide(b);
      assert.equal(b.root.dataset.storyProgress, '0.70000');
      assert.equal(bridge(b), 0.48, 'the bridge waits at the manifesto');
      b.imageCallbacks.ready();
    }
    raw.b.flush();
    assert.equal(bridge(raw.b), 0.7, 'raw: one frame, 0.48 → 0.7');
    glide(raw.b);
    const path = [];
    while (eased.b.count().frames && path.length < 240) {
      eased.b.flush();
      path.push(bridge(eased.b));
    }
    assert.equal(eased.b.count().frames, 0);
    assert.ok(
      path[0] > 0.48 && path[0] < 0.53,
      `resumes from the hold: ${path[0]}`,
    );
    for (let i = 1; i < path.length; i++) {
      assert.ok(path[i] >= path[i - 1], 'forward only');
      assert.ok(path[i] - path[i - 1] < 0.04, 'no frame cuts ahead');
    }
    assert.equal(path.at(-1), 0.7);
    assert.deepEqual(
      snapshot(eased.b),
      snapshot(raw.b),
      'the same frame at rest',
    );
    // A later re-decode (another srcset candidate) must not replay it.
    eased.b.imageCallbacks.ready();
    eased.b.flush();
    assert.equal(eased.b.root.dataset.storyProgress, '0.70000');
    assert.equal(eased.b.count().frames, 0, 're-decode: nothing replays');
    raw.stop();
    eased.stop();
  }

  // 7. Loading follows the hand, not the picture: a fast scroll starts the
  // Atrium request on its first frame.
  {
    const { b, stop } = mount({ follow: true, sceneImage: 'pending' });
    assert.equal(b.imageStarts.count, 0);
    b.scroll(SPAN * 0.5);
    b.flush();
    assert.ok(
      shown(b) < loadStoryMath('home-production').HOME_PRODUCTION.scenePreload,
      'the picture is still behind the preload point',
    );
    assert.equal(b.imageStarts.count, 1, 'the request has started');
    glide(b);
    stop();
  }
}
// ---------------------------------------------------------------------------
// TP3D STEP 2 — pacing, in the real timeline. The share of the distance
// scrolled becomes story progress through MOTION.pace; the frame a story
// position rests on is the one asserted everywhere above.
// ---------------------------------------------------------------------------
{
  const SPAN = 2340;
  const { MOTION, storyPacing } = loadStoryMath('home-motion');
  const pacing = storyPacing(MOTION.pace);
  const byKey = (a, b) => a[0].localeCompare(b[0]);
  const snapshot = (b) =>
    [
      b.story,
      b.world,
      b.camera,
      b.rooms,
      b.architecture,
      b.centerCopy,
      b.colophon,
      b.header,
      b.sharedTP,
      b.readStory,
      b.discovery,
      b.portalGroup,
      ...b.reveals,
      ...Object.values(b.openingNodes),
    ]
      .filter(Boolean)
      .map((node) => [
        [...node.style.values].toSorted(byKey),
        [...node.attrs].toSorted(byKey),
      ]);
  const settle = (b) => {
    for (let i = 0; i < 300 && b.count().frames; i++) b.flush();
    assert.equal(b.count().frames, 0);
  };
  const mount = (options) => {
    const b = browser(options);
    const stop = b.createHomeStoryTimeline(b.root, b.breeze);
    b.flush();
    b.flush();
    return { b, stop };
  };
  // 1. Paced and unpaced show the same frame at the same story position.
  for (const width of [1440, 1024, 390]) {
    const even = mount({ width });
    const paced = mount({ width, pace: true });
    for (const share of [
      0, 0.05, 0.2, 0.35, 0.5, 0.6, 0.7, 0.8, 0.9, 0.97, 1, 0.4,
    ]) {
      paced.b.scroll(SPAN * share);
      settle(paced.b);
      const story = pacing.story((SPAN * share) / SPAN);
      assert.equal(paced.b.root.dataset.storyProgress, story.toFixed(5));
      even.b.scroll(SPAN * story);
      settle(even.b);
      assert.deepEqual(
        snapshot(paced.b),
        snapshot(even.b),
        `${width}px: share ${share} shows story ${story.toFixed(4)}`,
      );
      // The cloth is handed the same progress (to the last float digit or
      // one beside it: the unpaced double divides its way back to it).
      const [clothAt, ...cloth] = paced.b.paints.at(-1);
      const [evenAt, ...evenCloth] = even.b.paints.at(-1);
      assert.ok(Math.abs(clothAt - evenAt) < 1e-12);
      assert.deepEqual(cloth, evenCloth);
    }
    even.stop();
    paced.stop();
  }
  // 2. Reduced motion is not paced: its cuts stay where they were.
  {
    const { b, stop } = mount({ pace: true, reduced: true });
    for (const share of [0.1, 0.3, 0.745, 0.9]) {
      b.scroll(SPAN * share);
      settle(b);
      assert.equal(b.root.dataset.storyProgress, share.toFixed(5));
    }
    stop();
  }
  // 3. With the follow as well: the same story frame, by a glide; and a
  // plate that decodes late resumes from the hold, wherever pacing put it.
  {
    const even = mount({ sceneImage: 'pending' });
    const live = mount({ sceneImage: 'pending', pace: true, follow: true });
    const share = 0.6,
      story = pacing.story(share);
    assert.ok(story > 0.64 && story < 0.72, 'in the sky, before the pull-back');
    live.b.scroll(SPAN * share);
    settle(live.b);
    even.b.scroll(SPAN * story);
    settle(even.b);
    assert.equal(live.b.paints.at(-1)[0], 0.48, 'held at the manifesto');
    live.b.imageCallbacks.ready();
    even.b.imageCallbacks.ready();
    live.b.flush();
    // One follow frame from the hold; the reading hold it crosses first is
    // a short stretch of the page, so the story moves quickly through it.
    const first = live.b.paints.at(-1)[0];
    assert.ok(first > 0.48 && first < 0.53, `resumes from the hold: ${first}`);
    let previous = first;
    for (let i = 0; i < 300 && live.b.count().frames; i++) {
      live.b.flush();
      const now = live.b.paints.at(-1)[0];
      assert.ok(now >= previous && now - previous < 0.04, 'an even resume');
      previous = now;
    }
    settle(even.b);
    assert.equal(live.b.root.dataset.storyProgress, story.toFixed(5));
    assert.deepEqual(snapshot(live.b), snapshot(even.b));
    even.stop();
    live.stop();
  }
  // 4. Loading is asked for at the story position, not the scroll share.
  {
    const { b, stop } = mount({ pace: true, sceneImage: 'pending' });
    const { scenePreload } = loadStoryMath('home-production').HOME_PRODUCTION;
    b.scroll(SPAN * (pacing.share(scenePreload) - 0.004));
    settle(b);
    assert.equal(b.imageStarts.count, 0);
    b.scroll(SPAN * (pacing.share(scenePreload) + 0.004));
    settle(b);
    assert.equal(b.imageStarts.count, 1);
    assert.ok(pacing.share(scenePreload) < scenePreload, 'sooner on the page');
    stop();
  }
}
console.log(
  'HomeStory passed: one owner and TP, native/restored progress, reversible poses, inert controls, reduced continuity, atmosphere handoff/gating, ambient air on the master RAF only while alive, idle stillness and 30 complete cleanups; STEP 1 follow: same resting frames by an even glide, raw for restore/intro/reduced, complete at the stage exit; STEP 2 pacing: same story frames at paced positions, none under reduced motion.',
);
