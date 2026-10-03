/** Owned lifecycle checks for Home Worlds, without simulating browser metrics. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { loadStoryMath } from './load-story-math.mjs';
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
      if (path === './home-production') return loadStoryMath('home-production');
      if (path === './room-discovery')
        return {
          createRoomDiscovery: () => ({
            update() {},
            suspend() {},
            destroy() {},
          }),
        };
      if (path === './home-motion') return loadStoryMath('home-motion');
      if (path === './home-story-frame') return mathModule.exports;
      if (path === './atmospheric-bridge-frame') return bridgeModule;
      assert.equal(path, './scene-image');
      return { prepareSceneImage };
    },
    window,
    document,
    navigator: {},
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
    readStory,
    secondary,
    discovery,
    portalGroup,
    stage,
    sequenceNode,
    imageCallbacks,
    imageLifecycle,
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
at(0.75);
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
    return `translate3d(${pose.x.toFixed(3)}px, ${pose.y.toFixed(3)}px, 0) scale(${pose.scale.toFixed(7)})`;
  };
  const baseline = b.count();
  for (let cycle = 0; cycle < 20; cycle++) {
    for (const p of [0.78, 0.83, 0.87, 0.76, 0.61, 0.78]) {
      b.scroll(p * 2340);
      b.flush();
      const settledUI = ui();
      const paintedBreeze = b.paints.at(-1)[0];
      const reads = b.operations.filter((op) => op === 'read').length;
      if (p === 0.83)
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
  b.skyLifecycle.alive = true;
  b.skyLifecycle.wake();
  b.flush();
  b.document.hidden = true;
  b.document.emit('visibilitychange');
  const hiddenUpdates = b.skyLifecycle.updates.length;
  assert.equal(b.skyLifecycle.suspended, 1);
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
assert.equal(homeStoryFrame(0.82).chapter, 'worlds');
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
console.log(
  'HomeStory passed: one owner and TP, native/restored progress, reversible poses, inert controls, reduced continuity, atmosphere handoff/gating, ambient air on the master RAF only while alive, idle stillness and 30 complete cleanups.',
);
