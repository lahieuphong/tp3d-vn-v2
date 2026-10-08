/** TP3D PASS — Atrium room orbit. After the approved Atrium has settled, an
 * appended span of native scroll carries the four room portals around the
 * Atrium's central axis. Checked here: the CSS story geometry, the real
 * master timeline in a small owned DOM double (its base-journey writes are
 * digest-locked to the PASS 15 timeline), the pure orbit frame and its
 * fitted layout, and the source contracts. RoomDiscovery's orbit behaviour is
 * in check-room-discovery. Browser visual and layout QA remain separate.
 *
 * To re-derive the base digest from another timeline source:
 *   ORBIT_BASELINE_TIMELINE=<path> node scripts/check-atrium-orbit.mjs */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { loadMotion, loadStoryMath } from './load-story-math.mjs';

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const EXPERIENCE = 'components/home/experience/';
// Production build values: the dormant Tier B gate (PASS 6A) stays shut.
const productionEnv = (text) =>
  text
    .replaceAll('import.meta.env.DEV', 'false')
    .replaceAll('import.meta.env.VITE_ATRIUM_ORBIT_PREVIEW', 'undefined');
const transpile = (text) =>
  ts.transpileModule(productionEnv(text), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
    },
  }).outputText;
// Values from the vm realm compare by JSON (cross-realm prototypes differ).
const json = (value) =>
  JSON.stringify(value, (_, v) =>
    typeof v === 'number' ? Number(v.toFixed(9)) : v,
  );
const same = (a, b, message) => assert.equal(json(a), json(b), message);
const digest = (value) =>
  createHash('sha256').update(json(value)).digest('hex').slice(0, 16);
const steps = (from, to, count) =>
  Array.from({ length: count + 1 }, (_, i) => from + ((to - from) * i) / count);
const byKey = ([a], [b]) => (a < b ? -1 : a > b ? 1 : 0);

const { MOTION, storyPacing } = loadStoryMath('home-motion');
const { bridgeTiming, measureAtrium, worldReveal } = loadStoryMath(
  'atmospheric-bridge-frame',
);
const { HOME_PRODUCTION } = loadStoryMath('home-production');
const orbitModule = loadStoryMath('worlds-orbit');
const {
  ATRIUM_SOURCE,
  ORBIT,
  ORBIT_ROOMS,
  ORBIT_DOORWAYS,
  measureWorldsOrbit,
  worldsOrbitFrame,
  orbitTier,
  orbitFocus,
  orbitPose,
  portalBox,
} = orbitModule;
const ROOMS = ['living', 'bedroom', 'bathroom', 'kitchen'];

const timelineSource = read(`${EXPERIENCE}home-story-timeline.ts`);
const orbitSource = read(`${EXPERIENCE}worlds-orbit.ts`);
const discoverySource = read(`${EXPERIENCE}room-discovery.ts`);
const chapterSource = read(`${EXPERIENCE}worlds-chapter.tsx`);
const chapterCss = read(`${EXPERIENCE}worlds-chapter.css`);
const storySource = read(`${EXPERIENCE}home-story.tsx`);
const storyCss = read(`${EXPERIENCE}home-story.css`);

// ---------------------------------------------------------------------------
// 1. Story geometry: the PASS 15 heights stay the approved journey under
// reduced motion; with motion STEP 1 paces the same journey over about twice
// the distance, and the room orbit appends 160svh.
// ---------------------------------------------------------------------------
const geometry = (() => {
  const root = storyCss.match(/\n\.home-story \{([^}]*)\}/);
  assert.ok(root, 'the story root rule exists');
  assert.match(root[1], /--story-base-height: 360svh;/);
  assert.match(root[1], /--story-orbit-height: 0svh;/);
  assert.match(
    root[1],
    /--story-height: calc\(var\(--story-base-height\) \+ var\(--story-orbit-height\)\);/,
  );
  assert.match(root[1], /height: var\(--story-height\);/);
  assert.equal(storyCss.match(/--story-height:/g).length, 1);
  const base = { desktop: 360 };
  for (const [, query, value] of storyCss.matchAll(
    /@media \(max-width: (\d+)px\) \{\s*\.home-story \{\s*--story-base-height: (\d+)svh;/g,
  ))
    base[query === '1199' ? 'tablet' : 'mobile'] = Number(value);
  same(base, { desktop: 360, tablet: 320, mobile: 280 }, 'PASS 15 heights');
  // STEP 1 pacing: declared only where motion is allowed, after the
  // breakpoint rules (equal specificity, so the later rule wins).
  const paced = {};
  let last = 0;
  for (const match of storyCss.matchAll(
    /@media \(prefers-reduced-motion: no-preference\)( and \(max-width: (\d+)px\))? \{\s*\.home-story \{\s*--story-base-height: (\d+)svh;\s*\}\s*\}/g,
  )) {
    paced[!match[1] ? 'desktop' : match[2] === '1199' ? 'tablet' : 'mobile'] =
      Number(match[3]);
    assert.ok(match.index > last, 'desktop, then tablet, then mobile');
    last = match.index;
  }
  same(paced, { desktop: 640, tablet: 560, mobile: 480 }, 'STEP 1 pacing');
  assert.ok(
    storyCss.indexOf('--story-base-height: 640svh') >
      storyCss.indexOf('--story-base-height: 280svh'),
    'the paced heights follow the breakpoint heights they replace',
  );
  assert.equal(
    storyCss.match(/--story-base-height: \d+svh;/g).length,
    6,
    'three PASS 15 heights and three paced ones, no other',
  );
  for (const family of ['desktop', 'tablet', 'mobile'])
    assert.ok(
      Math.abs((paced[family] - 100) / (base[family] - 100) - 2.09) < 0.03,
      `${family}: one pace for every breakpoint`,
    );
  const orbit = [
    ...storyCss.matchAll(
      /@media ([^{]+)\{\s*\.home-story \{\s*--story-orbit-height: (\d+)svh;\s*\}\s*\}/g,
    ),
  ];
  assert.equal(orbit.length, 1, 'one appended orbit span');
  assert.equal(orbit[0][1].trim(), '(prefers-reduced-motion: no-preference)');
  assert.equal(Number(orbit[0][2]), 160, 'the orbit appends 160svh');
  assert.equal(storyCss.match(/--story-orbit-height:/g).length, 2);
  const marker = storyCss.match(/\n\.home-story-base \{([^}]*)\}/);
  assert.ok(marker);
  assert.match(marker[1], /position: absolute;/);
  assert.match(marker[1], /height: var\(--story-base-height\);/);
  assert.match(marker[1], /visibility: hidden;/);
  assert.match(
    storySource,
    /<\/aside>\s*<\/div>[\s\S]*<div\s+className="home-story-base"\s+data-home-story-base\s+aria-hidden="true"\s*\/>\s*<\/section>/,
    'the base marker sits outside the sticky stage',
  );
  return { base, paced, orbit: 160 };
})();
const baseSvh = (w, reduced = false) =>
  geometry[reduced ? 'base' : 'paced'][
    w < 768 ? 'mobile' : w < 1200 ? 'tablet' : 'desktop'
  ];

// ---------------------------------------------------------------------------
// A small owned DOM double for the real master timeline.
// ---------------------------------------------------------------------------
function story({
  source = timelineSource,
  width = 1440,
  height = 900,
  orbit = true,
  reduced = false,
  // STEP 1: false lays the story out at the PASS 15 distances even with
  // motion, as the stylesheet did before the pacing.
  paced = true,
  initialScroll = 0,
  // PASS 6A: { search, controller } opens the page as ?atriumOrbit=1 with
  // a stub Tier B controller module (`controller: null` = import fails).
  tierB = null,
} = {}) {
  let vw = width,
    vh = height,
    clock = 0,
    sequenceId = 0,
    rafCalls = 0,
    motionOff = reduced;
  const frames = new Map(),
    emitters = [],
    observers = [],
    discovery = { updates: [], suspended: 0 };
  const heights = () => {
    const base = (baseSvh(vw, motionOff || !paced) / 100) * vh;
    const extra =
      orbit === true && !motionOff ? (geometry.orbit / 100) * vh : 0;
    return { base, total: base + extra };
  };
  class Events {
    listeners = new Map();
    constructor() {
      emitters.push(this);
    }
    addEventListener(name, fn) {
      if (!this.listeners.has(name)) this.listeners.set(name, new Set());
      this.listeners.get(name).add(fn);
    }
    removeEventListener(name, fn) {
      this.listeners.get(name)?.delete(fn);
    }
    emit(name, event = {}) {
      for (const fn of this.listeners.get(name) ?? []) fn(event);
    }
  }
  class Style {
    values = new Map();
    setProperty(name, value) {
      this.values.set(name, value);
    }
    getPropertyValue(name) {
      return this.values.get(name) ?? '';
    }
    getPropertyPriority() {
      return '';
    }
    removeProperty(name) {
      this.values.delete(name);
    }
    get transform() {
      return this.getPropertyValue('transform');
    }
  }
  const camel = (key) =>
    'data-' + String(key).replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());
  class Node extends Events {
    attrs = new Map();
    style = new Style();
    offsetLeft = 0;
    offsetTop = 0;
    offsetWidth = 0;
    offsetHeight = 0;
    offsetParent = null;
    constructor(name, tagName = 'DIV', rect = () => ({ top: 0, height: vh })) {
      super();
      this.name = name;
      this.tagName = tagName;
      this.rect = rect;
      this.dataset = new Proxy(
        {},
        {
          get: (_, key) => this.attrs.get(camel(key)),
          set: (_, key, value) => {
            this.setAttribute(camel(key), value);
            return true;
          },
          deleteProperty: (_, key) => {
            this.removeAttribute(camel(key));
            return true;
          },
        },
      );
    }
    get inert() {
      return this.attrs.has('inert');
    }
    set inert(value) {
      if (value) this.setAttribute('inert', '');
      else this.removeAttribute('inert');
    }
    hasAttribute(name) {
      return this.attrs.has(name);
    }
    getAttribute(name) {
      return this.attrs.get(name) ?? null;
    }
    setAttribute(name, value) {
      this.attrs.set(name, String(value));
    }
    removeAttribute(name) {
      this.attrs.delete(name);
    }
    querySelector() {
      return null;
    }
    querySelectorAll() {
      return [];
    }
    getBoundingClientRect() {
      const { top, height: h } = this.rect();
      return {
        top: top - window.scrollY,
        bottom: top - window.scrollY + h,
        height: h,
        width: vw,
        left: 0,
      };
    }
    click() {
      assert.fail(`scroll never activates ${this.name}`);
    }
  }
  const window = Object.assign(
    new Events(),
    { scrollY: initialScroll },
    tierB ? { location: { search: tierB.search } } : {},
  );
  let tierBRequests = 0;
  window.scrollTo = window.scrollBy = () =>
    assert.fail('the orbit never corrects native scroll');
  const document = Object.assign(new Events(), {
    hidden: false,
    readyState: 'complete',
    documentElement: new Node('html'),
    createRange: () => ({
      selectNodeContents() {},
      getClientRects: () => [],
    }),
  });
  const header = new Node('header', 'HEADER', () => ({ top: 0, height: 80 }));
  document.querySelector = (selector) =>
    selector === '.site-header' ? header : null;
  const root = new Node('root');
  const sequence = new Node('sequence', 'SECTION', () => ({
    top: 0,
    height: heights().total,
  }));
  const marker = new Node('marker', 'DIV', () => ({
    top: 0,
    height: heights().base,
  }));
  const stage = new Node('stage');
  const storyNode = new Node('story');
  const worlds = new Node('worlds', 'SECTION');
  const camera = new Node('camera');
  const rooms = new Node('rooms', 'NAV');
  const image = new Node('image', 'IMG');
  const focus = new Node('focus', 'SPAN');
  // The Atrium's real [data-chapter-reveal] order and roles.
  const reveals = [
    ['eyebrow', 'P', 4],
    ['enter', 'SPAN', 5],
    ['the-worlds', 'EM', 6],
    ['body', 'P', 7],
    ['signoff', 'P', 8],
    ...ROOMS.map((room, i) => [`room-${room}`, 'A', i]),
    ['gateway', 'A', 9],
    ['baseline', 'DIV', 9],
  ].map(([name, tag, order]) => {
    const node = new Node(name, tag);
    node.attrs.set('data-chapter-reveal', String(order));
    if (name.startsWith('room-')) node.attrs.set('data-room', name.slice(5));
    return node;
  });
  const gateway = reveals.find((node) => node.name === 'gateway');
  const baseline = reveals.find((node) => node.name === 'baseline');
  const links = reveals.filter((node) => node.name.startsWith('room-'));
  const copyNodes = reveals.filter((node) =>
    ['eyebrow', 'enter', 'the-worlds', 'body', 'signoff'].includes(node.name),
  );
  const wrappers = links.map((link) => {
    const node = new Node(`wrapper-${link.attrs.get('data-room')}`);
    node.querySelector = (selector) =>
      selector === '[data-room]' ? link : null;
    return node;
  });
  for (const node of [gateway, baseline]) node.offsetParent = worlds;
  root.querySelector = (selector) =>
    ({
      '[data-home-story]': sequence,
      '[data-home-story-stage]': stage,
      '.spatial-hero': storyNode,
      '.hc-worlds': worlds,
    })[selector] ?? null;
  sequence.querySelector = (selector) =>
    selector === '[data-home-story-base]' && orbit !== 'no-marker'
      ? marker
      : null;
  worlds.querySelector = (selector) =>
    ({
      '[data-scene3-camera]': camera,
      '.hc-atrium-rooms': rooms,
      '.hc-atrium-backdrop img': image,
      '.hc-room-focus': focus,
      '.hc-atrium-cta': gateway,
      '.hc-atrium-baseline': baseline,
    })[selector] ?? null;
  worlds.querySelectorAll = (selector) =>
    ({
      '[data-chapter-reveal]': reveals,
      '.hc-atrium-room': wrappers,
      '.hc-atrium-copy [data-chapter-reveal]': copyNodes,
    })[selector] ?? [];
  const media = {
    '(prefers-reduced-motion: reduce)': Object.assign(new Events(), {
      matches: reduced,
    }),
    '(hover: hover) and (pointer: fine)': Object.assign(new Events(), {
      matches: true,
    }),
  };
  window.matchMedia = (query) => media[query];
  const loaded = { exports: {} };
  runInNewContext(transpile(source), {
    module: loaded,
    exports: loaded.exports,
    require(path) {
      if (path === './atmospheric-sky-renderer')
        return {
          createAtmosphericSkyBridge: () => assert.fail('no sky host here'),
        };
      if (path === './hero-depth')
        return {
          createHeroDepth: () => ({
            update() {},
            tick() {},
            wantsTime: () => false,
            suspend() {},
            destroy() {},
          }),
        };
      if (path === './room-discovery')
        return {
          createRoomDiscovery: () => ({
            update: (state) => discovery.updates.push({ ...state }),
            suspend: () => discovery.suspended++,
            destroy() {},
          }),
        };
      if (path === './scene-image')
        return {
          prepareSceneImage(plate, callbacks) {
            assert.equal(plate, image, 'the one Atrium plate is reused');
            let started = false;
            return {
              start() {
                if (started) return;
                started = true;
                callbacks.ready();
              },
              destroy() {},
            };
          },
        };
      if (path === './atrium-orbit-controller') {
        // Counted: a failure inside the import would be swallowed.
        tierBRequests++;
        if (!tierB?.controller) throw new Error('no Tier B module');
        return tierB.controller;
      }
      assert.match(
        path,
        /^\.\/(home-production|home-motion|home-story-frame|atmospheric-bridge-frame|worlds-orbit)$/,
        `unexpected timeline import ${path}`,
      );
      // Unpaced: PASS 15's distances and no pace table (scroll share is
      // story progress), as before STEP 1 and STEP 2.
      if (path === './home-motion') return loadMotion({ pace: paced });
      return loadStoryMath(path.slice(2));
    },
    window,
    document,
    navigator: {},
    URLSearchParams,
    ResizeObserver: class {
      constructor(fn) {
        this.fn = fn;
        observers.push(this);
      }
      observe() {}
      disconnect() {
        this.disconnected = true;
      }
    },
    getComputedStyle: () => assert.fail('no shared TP in this double'),
    performance: { now: () => clock },
    requestAnimationFrame(fn) {
      rafCalls++;
      const id = ++sequenceId;
      frames.set(id, fn);
      return id;
    },
    cancelAnimationFrame(id) {
      frames.delete(id);
    },
    setInterval: () => assert.fail('no interval'),
    setTimeout: () => assert.fail('no timer'),
  });
  const flush = () => {
    clock += 1000 / 60;
    const tasks = [...frames.values()];
    frames.clear();
    for (const task of tasks) task(clock);
  };
  // Every sample is painted to rest: samples never depend on their path.
  const settle = () => {
    for (let i = 0; i < 400 && frames.size; i++) flush();
    assert.equal(frames.size, 0, 'the story comes to rest: 0 RAF');
  };
  const scroll = (y) => {
    window.scrollY = y;
    window.emit('scroll');
    settle();
  };
  const named = [
    root,
    header,
    stage,
    storyNode,
    worlds,
    camera,
    rooms,
    ...reveals,
  ];
  // `base` keeps only the approved outputs, so a PASS 15 timeline and this
  // one can be compared over the base journey.
  const trace = ({ base = false } = {}) =>
    [...named, ...(base ? [] : [...wrappers, focus])].map((node) => [
      node.name,
      [...node.style.values].sort(byKey),
      [...node.attrs]
        .filter(
          ([key]) =>
            !base || (key !== 'data-room-orbit' && key !== 'data-orbit-room'),
        )
        .sort(byKey),
    ]);
  const dispose = loaded.exports.createHomeStoryTimeline(root);
  return {
    dispose,
    settle,
    scroll,
    trace,
    root,
    worlds,
    camera,
    rooms,
    focus,
    wrappers,
    links,
    gateway,
    baseline,
    header,
    window,
    document,
    frames,
    observers,
    discovery,
    span: () => heights().base - vh,
    orbitSpan: () => heights().total - heights().base,
    viewport: () => [vw, vh],
    rafCalls: () => rafCalls,
    resize(w, h) {
      vw = w;
      vh = h;
      window.emit('resize');
      for (const observer of observers) observer.fn([]);
      settle();
    },
    setReduced(value) {
      motionOff = value;
      media['(prefers-reduced-motion: reduce)'].matches = value;
      media['(prefers-reduced-motion: reduce)'].emit('change');
      settle();
    },
    tierBRequests: () => tierBRequests,
    listenerCount: () =>
      emitters.reduce(
        (n, e) => n + [...e.listeners.values()].reduce((a, s) => a + s.size, 0),
        0,
      ),
  };
}

// ---------------------------------------------------------------------------
// Regression 1. The existing narrative is unchanged before the room orbit:
// every base-journey write equals the PASS 15 timeline (d1a6a78).
//
// PASS 6B.1 changes how one thing is spelled, not what is drawn. Through the
// bridge the camera's pose is written as a 2D transform and is never
// promoted, so the photograph is drawn directly: no texture to resample (the
// one-frame snap as the pull-back ends) and none to starve of tiles. The
// lock is therefore on the pose: it is compared in the PASS 15 spelling,
// without the promotion hint. The spelling rule itself is asserted below.
// STEP 1 extends it to the portal orbit's breath, whose 3D pose stepped the
// picture's detail whenever its promotion began or ended inside the orbit.
// ---------------------------------------------------------------------------
{
  const cameraWrites = timelineSource.slice(
    timelineSource.indexOf('if (camera) {'),
    timelineSource.indexOf('if (architecture) {'),
  );
  assert.ok(cameraWrites.length > 400, 'the camera block is found');
  assert.doesNotMatch(
    cameraWrites,
    /translate3d|translateZ|matrix3d|perspective\(|rotate[XY3]/,
    'the camera pose is flat on the whole journey, orbit included',
  );
  assert.match(
    cameraWrites,
    /property\(camera, 'will-change', 'auto'\);/,
    'and it is never promoted',
  );
  assert.equal(cameraWrites.match(/'will-change'/g).length, 1);
}
const cameraPose = (transform) => {
  if (transform === 'none' || transform === '')
    return { kind: 'none', x: 0, y: 0, scale: 1 };
  const match =
    /^(translate3d|translate)\((-?[\d.]+)px, (-?[\d.]+)px(?:, 0)?\) scale\((-?[\d.]+)\)$/.exec(
      transform,
    );
  assert.ok(match, `camera transform: ${transform}`);
  return {
    kind: match[1] === 'translate3d' ? '3d' : '2d',
    x: match[2],
    y: match[3],
    scale: match[4],
  };
};
// The same trace with the camera's pose in the PASS 15 spelling.
const canonical = (trace) =>
  trace.map(([name, style, attrs]) => {
    if (name !== 'camera') return [name, style, attrs];
    const pose = cameraPose(
      style.find(([key]) => key === 'transform')?.[1] ?? '',
    );
    return [
      name,
      style
        .filter(([key]) => key !== 'will-change')
        .map(([key, value]) =>
          key === 'transform' && pose.kind !== 'none'
            ? [
                key,
                `translate3d(${pose.x}px, ${pose.y}px, 0) scale(${pose.scale})`,
              ]
            : [key, value],
        ),
      attrs,
    ];
  });
const BASE_VIEWPORTS = [
  [1440, 900],
  [1180, 820],
  [390, 844],
  [844, 390],
];
function baseJourney(source, orbit, onCamera = null) {
  const frames = [];
  for (const [width, height] of BASE_VIEWPORTS)
    for (const reduced of [false, true]) {
      // At the PASS 15 distances: the timeline itself is not retimed.
      const h = story({ source, width, height, orbit, reduced, paced: false });
      h.settle();
      const span = h.span();
      const positions = [
        ...steps(0, span, 240),
        ...steps(span, 0, 24).slice(1),
      ].map(Math.round);
      for (const y of positions) {
        h.scroll(y);
        const trace = h.trace({ base: true });
        frames.push([width, height, reduced, y, canonical(trace)]);
        const { orbit: _orbit, ...state } = h.discovery.updates.at(-1);
        frames.push(state);
        if (onCamera) {
          const style = trace.find(([name]) => name === 'camera')[1];
          onCamera(Object.fromEntries(style), [width, height, reduced, y]);
        }
      }
      h.dispose();
    }
  return frames;
}
// The PASS 15 timeline (d1a6a78) through the same pose-canonical trace:
//   git show d1a6a78:components/home/experience/home-story-timeline.ts > t.ts
//   ORBIT_BASELINE_TIMELINE=t.ts node scripts/check-atrium-orbit.mjs
// STEP 2 moved the start of the Atrium pull-back (MOTION.camera.start, in
// the motion vocabulary both timelines read), so the PASS 15 timeline now
// digests as f0cef627ba63b614. With the previous start it still gives
// 2ab28df0c254bba1, the value locked until then: the timeline is unchanged.
const PASS15_BASE_DIGEST = 'f0cef627ba63b614';
if (process.env.ORBIT_BASELINE_TIMELINE) {
  const baseline = readFileSync(process.env.ORBIT_BASELINE_TIMELINE, 'utf8');
  console.log(digest(baseJourney(baseline, 'no-marker')));
  process.exit(0);
}
// The spelling rule, on every base-journey frame: no transform at rest, a
// flat pose otherwise, never promoted, at every scale of the pull-back.
const spellings = { none: 0, '2d': 0, '3d': 0 };
let largest = 1;
assert.equal(
  digest(
    baseJourney(timelineSource, true, (style, where) => {
      const pose = cameraPose(style.transform ?? '');
      spellings[pose.kind]++;
      largest = Math.max(largest, Number(pose.scale));
      assert.notEqual(pose.kind, '3d', `a 3D pose in the bridge (${where})`);
      assert.equal(style['will-change'], 'auto', `promoted (${where})`);
    }),
  ),
  PASS15_BASE_DIGEST,
  'every base-journey write equals the PASS 15 timeline (not stretched)',
);
// Pacing (STEP 1 distances, STEP 2 pace table) changes how far the hand
// travels and nothing else: at equal story progress the paced story writes
// exactly what the PASS 15 distance writes.
{
  const pacing = storyPacing(MOTION.pace);
  for (const [width, height] of BASE_VIEWPORTS) {
    const short = story({ width, height, paced: false });
    const long = story({ width, height });
    short.settle();
    long.settle();
    assert.ok(long.span() > 2 * short.span(), 'about twice the distance');
    for (const share of [...steps(0, 1, 240), ...steps(1, 0, 24).slice(1)]) {
      long.scroll(share * long.span());
      const progress = pacing.story((share * long.span()) / long.span());
      assert.equal(long.root.dataset.storyProgress, progress.toFixed(5));
      short.scroll(progress * short.span());
      same(
        long.trace({ base: true }),
        short.trace({ base: true }),
        `${width}×${height} @${share}: the paced journey is the same journey`,
      );
    }
    short.dispose();
    long.dispose();
  }
}
assert.ok(
  spellings.none > 100 && spellings['2d'] > 100 && largest > 5,
  `rest and the whole pull-back are exercised: ${JSON.stringify(spellings)}, up to ${largest}×`,
);
assert.equal(
  digest(baseJourney(timelineSource, 'no-marker')),
  PASS15_BASE_DIGEST,
  'without a base marker the story is exactly PASS 15',
);
// The physical spans: base progress reaches 1 at the paced distance
// (540/460/380svh; PASS 15's 260/220/180svh under reduced motion) and the
// orbit is 160svh more.
for (const [width, height] of [...BASE_VIEWPORTS, [1366, 768], [768, 1024]]) {
  const h = story({ width, height });
  h.settle();
  const span = (baseSvh(width) / 100) * height - height;
  assert.ok(Math.abs(h.span() - span) < 1e-6, `${width}×${height} base`);
  assert.ok(Math.abs(h.orbitSpan() - 1.6 * height) < 1e-6, 'orbit 160svh');
  for (const o of steps(0, 1, 10)) {
    h.scroll(h.span() + o * h.orbitSpan());
    assert.equal(h.root.dataset.storyProgress, '1.00000');
  }
  h.dispose();
  const still = story({ width, height, reduced: true });
  still.settle();
  assert.ok(
    Math.abs(still.span() - ((baseSvh(width, true) / 100) * height - height)) <
      1e-6,
    `${width}×${height} reduced motion keeps the PASS 15 distance`,
  );
  assert.equal(still.orbitSpan(), 0, 'and has no orbit span');
  still.dispose();
}

// ---------------------------------------------------------------------------
// Regression 2. The orbit starts only after the Atrium has fully settled
// and its approved final hold has been seen.
// ---------------------------------------------------------------------------
{
  const h = story();
  h.settle();
  const span = h.span();
  assert.equal(bridgeTiming.settled, HOME_PRODUCTION.discoveryStart);
  assert.ok(1 - bridgeTiming.settled >= 0.08, 'the approved final hold');
  let held = null,
    holds = 0;
  for (const y of steps(0, span, 400).map(Math.round)) {
    h.scroll(y);
    assert.equal(h.worlds.getAttribute('data-room-orbit'), null);
    assert.equal(h.worlds.getAttribute('data-orbit-room'), null);
    assert.equal(h.discovery.updates.at(-1).orbit, false);
    for (const node of h.wrappers)
      assert.equal(node.style.getPropertyValue('--orbit-opacity'), '1.00000');
    // The hold is a stretch of the story; pacing decides where it falls.
    if (Number(h.root.dataset.storyProgress) >= bridgeTiming.settled) {
      const frame = json(h.trace().filter(([name]) => name !== 'root'));
      held ??= frame;
      holds++;
      assert.equal(frame, held, `the settled hold is still at ${y}`);
      assert.equal(h.camera.style.getPropertyValue('transform'), 'none');
    }
  }
  assert.ok(holds >= 12, `the paced hold is still seen (${holds} samples)`);
  // The approved settled hold continues into the orbit span until 0.04.
  for (let y = span; y <= span + ORBIT.labelsOut[0] * h.orbitSpan(); y += 8) {
    h.scroll(y);
    assert.equal(h.camera.style.getPropertyValue('transform'), 'none');
    for (const node of h.wrappers)
      assert.equal(node.style.getPropertyValue('--orbit-opacity'), '1.00000');
  }
  assert.ok(
    ORBIT.labelsOut[0] > 0 && ORBIT.labelsOut[1] === ORBIT.portalsIn[0],
  );
  h.dispose();
}

// ---------------------------------------------------------------------------
// Regressions 3–5. The pure frame: four focus states in order, reverse
// order, deterministic endpoints, holds that are real plateaus.
// ---------------------------------------------------------------------------
{
  for (const banned of [
    /\bdocument\b/,
    /\bwindow\b/,
    /globalThis/,
    /getBoundingClientRect|getComputedStyle|matchMedia/,
    /addEventListener|requestAnimationFrame|setTimeout|setInterval/,
    /performance|Date\b|Math\.random/,
    /^(let|var) /m,
    /\b(direction|lastScroll|previous(Scroll|Progress)|velocity)\b/,
    /fetch\(|https?:/,
  ])
    assert.doesNotMatch(orbitSource, banned, `pure orbit frame: ${banned}`);
  assert.deepEqual([...ORBIT_ROOMS], ROOMS, 'four rooms in a fixed order');
  assert.deepEqual(Object.keys(ORBIT_DOORWAYS), ROOMS);
  same(ATRIUM_SOURCE.pivot, { x: 836, y: 665 });
  assert.equal(ATRIUM_SOURCE.width, MOTION.camera.source.width);
  // The homepage shortcuts are the same four, in order.
  assert.match(
    read('data/home-chapters.ts'),
    /\[\s*'Living',\s*'Bedroom',\s*'Bathroom',\s*'Kitchen',\s*\]\.map/,
  );
  const samples = steps(0, 1, 2000);
  for (const [width, height] of [
    [1440, 900],
    [1180, 820],
    [390, 844],
    [844, 390],
  ]) {
    const tier = orbitTier(width, height, false);
    const g = measureWorldsOrbit(width, height);
    const frames = samples.map((o) => worldsOrbitFrame(o, g, tier));
    const order = frames
      .map((f) => f.activeRoom)
      .filter((room, i, all) => i === 0 || room !== all[i - 1]);
    same(order, [null, ...ROOMS], `${width}×${height}: four focus states`);
    // Reverse scroll is the same function sampled backwards.
    same(
      [...samples].reverse().map((o) => worldsOrbitFrame(o, g, tier)),
      [...frames].reverse(),
      'reverse sampling equals forward sampling',
    );
    const reverse = [...frames]
      .reverse()
      .map((f) => f.activeRoom)
      .filter((room, i, all) => i === 0 || room !== all[i - 1]);
    same(reverse, [...ROOMS].reverse().concat(null), 'reverse order');
    // Deterministic endpoints and clamping.
    const start = worldsOrbitFrame(0, g, tier);
    const end = worldsOrbitFrame(1, g, tier);
    same(worldsOrbitFrame(-1, g, tier), start);
    same(worldsOrbitFrame(2, g, tier), end);
    assert.equal(start.orbit, false);
    assert.equal(start.labels, 1, 'the settled Atrium, untouched');
    assert.equal(start.cameraScale, 1);
    assert.equal(start.cameraX, 0);
    assert.equal(start.focusOpacity, 0);
    assert.equal(start.gatewayOpacity, 1);
    assert.equal(end.activeRoom, 'kitchen');
    assert.equal(end.focus, 3);
    assert.equal(end.portals.kitchen.depth, 1, 'Kitchen settles in front');
    assert.equal(end.gatewayOpacity, 1, 'ENTER THE WORLD is primary again');
    // Holds: the focus plateaus at 0, 1, 2, 3; turns slow in and out.
    const holds = [
      [ORBIT.portalsIn[0], ORBIT.turns[0][0]],
      [ORBIT.turns[0][1], ORBIT.turns[1][0]],
      [ORBIT.turns[1][1], ORBIT.turns[2][0]],
      [ORBIT.turns[2][1], 1],
    ];
    holds.forEach(([a, b], index) => {
      assert.ok(b - a >= 0.08, 'each room has a visible hold');
      for (const o of steps(a, b, 10)) {
        assert.ok(Math.abs(orbitFocus(o) - index) < 1e-9, 'plateau');
        const f = worldsOrbitFrame(o, g, tier);
        assert.equal(f.activeRoom, ROOMS[index]);
        if (o >= ORBIT.portalsIn[1])
          assert.ok(
            f.portals[ROOMS[index]].depth > 1 - 1e-9,
            'focused in front',
          );
      }
    });
    for (const [a, b] of ORBIT.turns) {
      const e = 1e-5;
      const speed = (o) => (orbitFocus(o + e) - orbitFocus(o - e)) / (2 * e);
      assert.ok(speed(a) < 0.01 && speed(b) < 0.01, 'turns start/end at rest');
      assert.ok(speed((a + b) / 2) > 1, 'and move between');
    }
  }
}

// ---------------------------------------------------------------------------
// Depth, camera breath, doorway focus and tiers.
// ---------------------------------------------------------------------------
const VIEWPORTS = [
  [1440, 900],
  [1366, 768],
  [1280, 720],
  [1920, 1080],
  [1180, 820],
  [768, 1024],
  [820, 1180],
  [390, 844],
  [360, 740],
  [844, 390],
  [740, 360],
  [667, 375],
];
for (const [width, height] of VIEWPORTS) {
  const tier = orbitTier(width, height, false);
  const g = measureWorldsOrbit(width, height);
  for (const o of steps(ORBIT.portalsIn[1], 1, 200)) {
    const f = worldsOrbitFrame(o, g, tier);
    const portals = ROOMS.map((room) => f.portals[room]);
    // Depth: front larger, brighter, sharper and higher than the rear.
    const sorted = [...portals].sort((a, b) => a.depth - b.depth);
    for (let i = 1; i < sorted.length; i++) {
      assert.ok(sorted[i].scale >= sorted[i - 1].scale);
      assert.ok(sorted[i].opacity >= sorted[i - 1].opacity);
      assert.ok(sorted[i].z >= sorted[i - 1].z);
      assert.ok(sorted[i].blur <= sorted[i - 1].blur);
    }
    for (const p of portals) {
      assert.ok(p.scale >= 0.72 - 1e-9 && p.scale <= 1.14 + 1e-9, 'scale');
      assert.ok(p.opacity >= 0.35 - 1e-9 && p.opacity <= 1, 'opacity');
      assert.ok(p.blur >= 0 && p.blur <= 1.5, 'very small blur only');
      if (p.depth >= 0.85) assert.equal(p.blur, 0, 'the front is sharp');
    }
    // Camera breath: ≤ 2% scale, ≤ 2.5vw / 1.5vh, never an exposed edge.
    assert.ok(f.cameraScale >= 1 && f.cameraScale <= 1.02 + 1e-12);
    assert.ok(Math.abs(f.cameraX) <= 0.025 * width + 1e-9);
    assert.ok(Math.abs(f.cameraY) <= 0.015 * height + 1e-9);
    const s = f.cameraScale;
    assert.ok(f.pivotX * (1 - s) + f.cameraX <= 1e-9, 'left edge covered');
    assert.ok(f.pivotX + s * (width - f.pivotX) + f.cameraX >= width - 1e-9);
    assert.ok(f.pivotY * (1 - s) + f.cameraY <= 1e-9, 'top edge covered');
    assert.ok(f.pivotY + s * (height - f.pivotY) + f.cameraY >= height - 1e-9);
    // The doorway exposure sits on the focused room's measured doorway.
    const room = ROOMS[Math.round(f.focus)];
    if (Number.isInteger(f.focus)) {
      assert.ok(Math.abs(f.focusX - g.doorways[room].x) < 1e-9);
      assert.ok(Math.abs(f.focusY - g.doorways[room].y) < 1e-9);
    }
  }
  // The ellipse is centred on the projected world axis.
  const cover = Math.max(width / 1672, height / 941);
  const left = (width - 1672 * cover) * (width < 768 ? 0.51 : 0.5);
  assert.ok(
    Math.abs(g.layout.x - (left + ATRIUM_SOURCE.axis.x * cover)) < 1e-9,
  );
  assert.ok(g.layout.radiusX > g.layout.radiusY, `${width}×${height} ellipse`);
}
// TP3D STEP 2 — the portal entry. Each portal appears in its own doorway
// (as the breathing camera shows it) and flies to its place on the ellipse;
// it no longer fades in on the ellipse with nothing joining it to its room.
for (const [width, height] of VIEWPORTS) {
  const tier = orbitTier(width, height, false);
  const g = measureWorldsOrbit(width, height);
  const [from, to] = ORBIT.portalsIn;
  assert.ok(to - from >= 0.1, 'the flight has room to be read');
  assert.ok(to <= ORBIT.turns[0][0] - 0.03, 'and Living still holds after it');
  const overhang = ORBIT.entryOverhang * width;
  const before = worldsOrbitFrame(from - 1e-6, g, tier);
  const start = worldsOrbitFrame(from, g, tier);
  const end = worldsOrbitFrame(to, g, tier);
  assert.equal(before.orbit, false, 'lintel layout until the labels have left');
  assert.ok(before.labels < 1e-6, 'the labels are gone at the switch');
  assert.equal(start.orbit, true);
  let onScreen = 0;
  for (const room of ROOMS) {
    const a = start.portals[room];
    const z = end.portals[room];
    // Leaves from the doorway: the camera has not started to breathe yet.
    const door = g.doorways[room];
    assert.ok(Math.abs(a.y - door.y) < 1e-9, `${room} at its doorway's height`);
    assert.ok(
      Math.abs(a.x - Math.min(width + overhang, Math.max(-overhang, door.x))) <
        1e-9,
      `${room} in its doorway, or just outside the edge the crop hides it at`,
    );
    if (door.x >= 0 && door.x <= width) onScreen++;
    assert.equal(a.opacity, 0, 'invisible at the switch: no pop');
    assert.ok(Math.abs(a.scale / z.scale - ORBIT.entryScale) < 1e-9);
    // Arrives exactly on the ellipse, as every later frame expects.
    const angle = Math.PI / 2 + ROOMS.indexOf(room) * (Math.PI / 2);
    const centreX =
      end.pivotX + end.cameraScale * (g.layout.x - end.pivotX) + end.cameraX;
    assert.ok(
      Math.abs(z.x - (centreX + Math.cos(angle) * g.layout.radiusX)) < 1e-9,
    );
    assert.ok(
      Math.abs(
        z.y - (g.layout.y + end.cameraY + Math.sin(angle) * g.layout.radiusY),
      ) < 1e-9,
    );
    // One flight: each frame is a point on the line from the doorway to the
    // portal's place, both as the camera shows them in that frame, at a
    // share that only grows, quick off the door and slow in.
    let share = 0,
      opacity = 0,
      scale = a.scale;
    const samples = steps(from, to, 240).map((o) =>
      worldsOrbitFrame(o, g, tier),
    );
    for (const f of samples) {
      const q = f.portals[room];
      assert.ok(f.portal >= share - 1e-12, 'the flight only advances');
      const doorX = Math.min(
        width + overhang,
        Math.max(
          -overhang,
          f.pivotX + f.cameraScale * (door.x - f.pivotX) + f.cameraX,
        ),
      );
      const doorY = f.pivotY + f.cameraScale * (door.y - f.pivotY) + f.cameraY;
      const placeX =
        f.pivotX +
        f.cameraScale * (g.layout.x - f.pivotX) +
        f.cameraX +
        Math.cos(angle) * g.layout.radiusX;
      const placeY =
        g.layout.y + f.cameraY + Math.sin(angle) * g.layout.radiusY;
      assert.ok(Math.abs(q.x - (doorX + (placeX - doorX) * f.portal)) < 1e-9);
      assert.ok(Math.abs(q.y - (doorY + (placeY - doorY) * f.portal)) < 1e-9);
      assert.ok(q.opacity >= opacity - 1e-12 && q.scale >= scale - 1e-12);
      assert.ok(
        q.x >= -overhang - 1e-9 && q.x <= width + overhang + 1e-9,
        'never further out than the overhang',
      );
      share = f.portal;
      opacity = q.opacity;
      scale = q.scale;
    }
    assert.equal(share, 1, 'and lands');
    assert.ok(
      samples[80].portal > 0.5,
      'over half the way in the first third, then a long glide',
    );
    // Fully visible well before it lands.
    const visible = samples[Math.ceil(240 * ORBIT.entryFade)].portals[room];
    assert.ok(Math.abs(visible.opacity - z.opacity) < 1e-9);
  }
  if (tier === 'desktop')
    assert.equal(onScreen, 4, 'on desktop every doorway is on screen');
}
{
  // Tiers: tablet and phones are smaller and shallower than desktop.
  const s = ORBIT.shapes;
  for (const tier of ['tablet', 'mobile', 'landscape']) {
    assert.ok(s[tier].radiusY < s.desktop.radiusY);
    assert.ok(s[tier].portal < s.desktop.portal);
    assert.ok(
      s[tier].scale[1] - s[tier].scale[0] <
        s.desktop.scale[1] - s.desktop.scale[0],
      `${tier} has reduced depth`,
    );
    assert.ok(s[tier].camera < s.desktop.camera);
  }
  // CSS lays a portal out with the sizes the fit assumes.
  const block = chapterCss.slice(chapterCss.indexOf('Atrium room orbit'));
  const cssPortal = (pattern) => Number(block.match(pattern)?.[1]);
  assert.equal(
    cssPortal(/\.hc-worlds\[data-room-orbit\] \{\s*--portal-size: (\d+)px;/),
    s.desktop.portal,
  );
  assert.equal(
    cssPortal(
      /max-width: 1199px\) \{\s*\.hc-worlds\[data-room-orbit\] \{\s*--portal-size: (\d+)px;/,
    ),
    s.tablet.portal,
  );
  assert.equal(
    cssPortal(
      /max-width: 767px\) \{[\s\S]*?\.hc-worlds\[data-room-orbit\] \{\s*--portal-size: (\d+)px;/,
    ),
    s.mobile.portal,
  );
  assert.equal(
    cssPortal(
      /max-height: 540px\) and \(orientation: landscape\) \{\s*\.hc-worlds\[data-room-orbit\] \{\s*--portal-size: (\d+)px;/,
    ),
    s.landscape.portal,
  );
}

// ---------------------------------------------------------------------------
// Regression 10. Portals stay in bounds (and clear of the copy) — mobile
// included — wherever the fit finds room, at every angle of the orbit.
// ---------------------------------------------------------------------------
{
  const inside = (box, w, h, header) =>
    box.x0 >= 8 - 1e-9 &&
    box.x1 <= w - 8 + 1e-9 &&
    box.y0 >= header + 6 - 1e-9 &&
    box.y1 <= h - 8 + 1e-9;
  // The copy's glyph lines and the gateway, as measured in Chrome on the
  // settled Atrium (headless Chrome 154, PASS 15 layout), with the header.
  const MEASURED = {
    '1440x900': {
      header: 83,
      avoid: [
        [75, 567, 230, 639],
        [75, 638, 341, 710],
        [75, 729, 470, 751],
        [75, 752, 491, 774],
        [75, 800, 111, 802],
        [125, 795, 294, 806],
        [75, 542, 146, 555],
        [1128, 713, 1376, 801],
      ],
    },
    '1366x768': {
      header: 78,
      avoid: [
        [71, 432, 219, 501],
        [71, 500, 326, 569],
        [71, 588, 424, 610],
        [71, 611, 451, 633],
        [71, 635, 147, 656],
        [71, 682, 107, 684],
        [121, 677, 282, 688],
        [71, 407, 139, 419],
        [1062, 600, 1305, 684],
      ],
    },
    '1280x720': {
      header: 78,
      avoid: [
        [67, 389, 215, 458],
        [67, 457, 321, 526],
        [67, 545, 420, 567],
        [67, 568, 412, 590],
        [67, 592, 177, 614],
        [67, 639, 103, 641],
        [117, 634, 275, 644],
        [67, 365, 132, 377],
        [985, 562, 1223, 641],
      ],
    },
    '1180x820': {
      header: 78,
      avoid: [
        [61, 380, 240, 463],
        [61, 462, 368, 544],
        [61, 563, 338, 588],
        [61, 591, 371, 616],
        [61, 619, 334, 643],
        [61, 646, 150, 671],
        [61, 697, 97, 699],
        [111, 693, 270, 703],
        [61, 356, 126, 368],
        [901, 643, 1110, 697],
      ],
    },
    '768x1024': {
      header: 95,
      avoid: [
        [40, 590, 181, 655],
        [40, 654, 282, 720],
        [40, 739, 317, 764],
        [40, 766, 349, 791],
        [40, 794, 312, 819],
        [40, 822, 129, 846],
        [40, 873, 76, 875],
        [90, 868, 248, 878],
        [40, 566, 105, 578],
        [513, 816, 722, 871],
      ],
    },
    '390x844': {
      header: 76,
      avoid: [
        [27, 376, 159, 437],
        [27, 436, 254, 497],
        [27, 511, 333, 534],
        [27, 535, 354, 558],
        [27, 559, 249, 582],
        [27, 605, 52, 607],
        [63, 601, 210, 611],
        [27, 353, 88, 364],
        [27, 744, 239, 792],
      ],
    },
    '844x390': {
      header: 78,
      avoid: [
        [44, 185, 155, 237],
        [44, 236, 235, 288],
        [44, 297, 438, 316],
        [44, 317, 357, 336],
        [44, 351, 80, 353],
        [94, 346, 252, 356],
        [44, 167, 109, 179],
        [593, 310, 794, 359],
      ],
    },
    '667x375': {
      header: 76,
      avoid: [
        [46, 159, 153, 209],
        [46, 208, 230, 258],
        [46, 267, 342, 285],
        [46, 286, 336, 304],
        [46, 305, 139, 323],
        [46, 338, 71, 339],
        [82, 334, 229, 343],
        [46, 141, 108, 153],
        [420, 297, 627, 345],
      ],
    },
  };
  const copy = Object.fromEntries(
    Object.entries(MEASURED).map(([key, { avoid }]) => [
      key,
      avoid.map(([x0, y0, x1, y1]) => ({ x0, y0, x1, y1 })),
    ]),
  );
  for (const [width, height] of VIEWPORTS) {
    const tier = orbitTier(width, height, false);
    const avoid = copy[`${width}x${height}`] ?? [];
    const header = MEASURED[`${width}x${height}`]?.header ?? 90;
    const g = measureWorldsOrbit(width, height, avoid, header);
    assert.equal(g.layout.fallback, false, `${width}×${height} fits`);
    for (let i = 0; i < 360; i++) {
      const box = portalBox(g.layout, (i / 360) * 2 * Math.PI, width, tier);
      assert.ok(inside(box, width, height, header), `${width}×${height} in`);
      for (const a of avoid)
        assert.ok(
          box.x1 <= a.x0 || box.x0 >= a.x1 || box.y1 <= a.y0 || box.y0 >= a.y1,
          `${width}×${height} clear of the copy`,
        );
    }
  }
  // Phones: a compact orbit in the plate's upper free area.
  const phone = measureWorldsOrbit(390, 844, copy['390x844'], 76);
  assert.ok(phone.layout.radiusX <= 0.3 * 390 + 1e-9);
  assert.ok(
    phone.layout.y < Math.min(...copy['390x844'].map((b) => b.y0)),
    'above the copy column',
  );
}

// ---------------------------------------------------------------------------
// The real timeline through the orbit (regressions 3–6 end to end).
// ---------------------------------------------------------------------------
const fixed = (n, digits) => n.toFixed(digits);
const cameraString = (pose) =>
  pose.x === 0 && pose.y === 0 && pose.scale === 1
    ? 'none'
    : `translate(${fixed(pose.x, 3)}px, ${fixed(pose.y, 3)}px) scale(${fixed(pose.scale, 7)})`;
const zero = { x0: 0, y0: 0, x1: 0, y1: 0 };
function expectFrame(h, o) {
  const [w, vh] = h.viewport();
  const tier = orbitTier(w, vh, false);
  const g = measureWorldsOrbit(w, vh, [zero, zero], 80);
  const f = worldsOrbitFrame(o, g, tier);
  const { originX, originY } = measureAtrium(w, vh);
  const pose =
    o > 0 ? orbitPose(f, originX, originY) : { x: 0, y: 0, scale: 1 };
  assert.equal(h.worlds.getAttribute('data-room-orbit'), f.orbit ? '' : null);
  assert.equal(h.worlds.getAttribute('data-orbit-room'), f.activeRoom);
  assert.equal(
    h.camera.style.getPropertyValue('transform'),
    cameraString(pose),
  );
  assert.equal(h.camera.style.getPropertyValue('will-change'), 'auto');
  for (const node of h.wrappers) {
    const room = node.name.slice('wrapper-'.length);
    const p = f.portals[room];
    if (!f.orbit) {
      assert.equal(
        node.style.getPropertyValue('--orbit-opacity'),
        fixed(f.labels, 5),
      );
      continue;
    }
    assert.equal(
      node.style.getPropertyValue('--orbit-x'),
      `${fixed(p.x, 2)}px`,
    );
    assert.equal(
      node.style.getPropertyValue('--orbit-y'),
      `${fixed(p.y, 2)}px`,
    );
    assert.equal(
      node.style.getPropertyValue('--orbit-scale'),
      fixed(p.scale, 5),
    );
    assert.equal(
      node.style.getPropertyValue('--orbit-opacity'),
      fixed(p.opacity, 5),
    );
    assert.equal(
      node.style.getPropertyValue('--orbit-blur'),
      `${fixed(p.blur, 3)}px`,
    );
    assert.equal(node.style.getPropertyValue('--orbit-z'), String(p.z));
  }
  assert.equal(
    h.focus.style.getPropertyValue('--room-focus-opacity'),
    fixed(f.focusOpacity, 5),
  );
  assert.equal(
    h.gateway.style.getPropertyValue('opacity'),
    fixed(worldReveal(1, 9, false).opacity * f.gatewayOpacity, 5),
  );
  for (const link of [...h.links, h.gateway])
    assert.equal(link.getAttribute('inert'), null, 'links stay real');
  assert.equal(h.discovery.updates.at(-1).orbit, f.orbit);
  // Desktop labels follow the architecture until the portals take over.
  assert.equal(
    h.rooms.style.getPropertyValue('transform'),
    w >= 1200 && !f.orbit
      ? pose.scale === 1 && pose.x === 0 && pose.y === 0
        ? 'translateX(-50%)'
        : `translateX(-50%) translate3d(${fixed(pose.x, 3)}px, ${fixed(pose.y, 3)}px, 0) scale(${fixed(pose.scale, 7)})`
      : 'none',
  );
  return f;
}
const STOPS = steps(0, 1, 100);
for (const [width, height] of [
  [1440, 900],
  [1366, 768],
  [1180, 820],
  [768, 1024],
  [390, 844],
  [844, 390],
]) {
  const h = story({ width, height });
  h.settle();
  const at = (o) => Math.round(h.span() + o * h.orbitSpan());
  const exact = (o) => (at(o) - h.span()) / h.orbitSpan();
  h.scroll(h.span());
  const theme = h.header.dataset.chapterTheme;
  const rooms = [];
  const forward = STOPS.map((o) => {
    h.scroll(at(o));
    const f = expectFrame(h, exact(o));
    if (f.activeRoom !== rooms.at(-1)) rooms.push(f.activeRoom);
    assert.equal(h.header.dataset.chapterTheme, theme, 'header unchanged');
    return json(h.trace());
  });
  same(rooms, [null, ...ROOMS], 'the real timeline: four focus states');
  const backRooms = [];
  const backward = [...STOPS].reverse().map((o) => {
    h.scroll(at(o));
    const room = h.worlds.getAttribute('data-orbit-room');
    if (room !== backRooms.at(-1)) backRooms.push(room);
    return json(h.trace());
  });
  same(backRooms, [...ROOMS].reverse().concat(null), 'reverse order');
  assert.deepEqual(backward.reverse(), forward, 'reverse equals forward');
  // A jump samples its destination; nothing is queued.
  h.scroll(at(0.2));
  h.scroll(at(0.88));
  assert.equal(json(h.trace()), forward[STOPS.indexOf(0.88)], 'jump');
  // Released into the Footer: no navigation, the orbit stays at Kitchen.
  h.scroll(h.span() + h.orbitSpan() + height);
  assert.equal(h.worlds.getAttribute('data-orbit-room'), 'kitchen');
  h.dispose();
}

// ---------------------------------------------------------------------------
// Regression 6. Reduced motion never rotates the rooms: the pure frame (on
// its own) and the real timeline.
// ---------------------------------------------------------------------------
for (const [width, height] of VIEWPORTS) {
  const g = measureWorldsOrbit(width, height);
  for (const o of steps(0, 1, 50)) {
    const f = worldsOrbitFrame(o, g, 'reduced');
    assert.equal(f.orbit, false, 'reduced motion never orbits');
    assert.equal(f.activeRoom, null);
    assert.equal(f.labels, 1);
    assert.equal(f.cameraScale, 1);
    assert.equal(f.cameraX, 0);
    assert.equal(f.focusOpacity, 0);
    assert.equal(f.gatewayOpacity, 1);
  }
}
for (const tall of [false, true]) {
  // `tall` simulates a stale orbit spacer: the rooms still never orbit.
  const h = story({ reduced: true, orbit: tall });
  h.settle();
  if (!tall) assert.equal(h.orbitSpan(), 0, 'no extended orbit journey');
  for (const y of steps(0, h.span() + h.orbitSpan(), 80).map(Math.round)) {
    h.scroll(y);
    assert.equal(h.worlds.getAttribute('data-room-orbit'), null);
    assert.equal(h.worlds.getAttribute('data-orbit-room'), null);
    assert.equal(h.discovery.updates.at(-1).orbit, false);
    for (const node of h.wrappers) {
      assert.equal(node.style.getPropertyValue('--orbit-opacity'), '1.00000');
      assert.equal(node.style.getPropertyValue('--orbit-x'), '');
    }
  }
  assert.equal(h.camera.style.getPropertyValue('transform'), 'none');
  h.dispose();
}
{
  // Switching to reduced motion mid-orbit restores the static rooms.
  const h = story();
  h.settle();
  h.scroll(Math.round(h.span() + 0.5 * h.orbitSpan()));
  assert.equal(h.worlds.getAttribute('data-room-orbit'), '');
  h.setReduced(true);
  assert.equal(h.orbitSpan(), 0);
  assert.equal(h.worlds.getAttribute('data-room-orbit'), null);
  assert.equal(h.camera.style.getPropertyValue('transform'), 'none');
  h.dispose();
}

// ---------------------------------------------------------------------------
// Regression 7. No additional RAF loop, scroll owner or timer.
// ---------------------------------------------------------------------------
{
  const h = story();
  h.settle();
  assert.equal(h.frames.size, 0, '0 RAF at rest');
  assert.equal(h.window.listeners.get('scroll').size, 1, 'one scroll owner');
  assert.equal(h.observers.length, 1, 'one geometry observer');
  h.scroll(Math.round(h.span() + 0.3 * h.orbitSpan()));
  assert.equal(h.frames.size, 0, '0 RAF once the orbit stops');
  h.window.scrollY += 40;
  h.window.emit('scroll');
  h.window.emit('scroll');
  assert.equal(h.frames.size, 1, 'scroll requests the one existing frame');
  h.settle();
  // A hidden tab does no orbit work.
  h.document.hidden = true;
  h.document.emit('visibilitychange');
  const calls = h.rafCalls();
  h.window.scrollY += 200;
  h.window.emit('scroll');
  assert.equal(h.rafCalls(), calls, 'no background work');
  h.document.hidden = false;
  h.document.emit('visibilitychange');
  h.settle();
  h.dispose();
  assert.equal(h.listenerCount(), 0, 'every listener is removed');
  assert.equal(h.worlds.getAttribute('data-room-orbit'), null);
}
{
  const files = [
    timelineSource,
    orbitSource,
    discoverySource,
    chapterSource,
    storySource,
  ];
  const count = (pattern) =>
    files.reduce((n, text) => n + (text.match(pattern) ?? []).length, 0);
  assert.equal(count(/addEventListener\('scroll'/g), 1, 'one scroll listener');
  assert.equal(count(/requestAnimationFrame\(/g), 1, 'one master RAF');
  assert.equal(count(/setInterval|setTimeout\(/g), 0, 'no timers, no autoplay');
  assert.equal(count(/<canvas|getContext\(|from 'three'|import\('three'/g), 0);
  assert.equal(
    count(
      /gsap|ScrollTrigger|lenis|locomotive|framer-motion|from 'motion'|animation-timeline|scroll-snap/gi,
    ),
    0,
  );
  assert.equal(
    count(/preventDefault|scrollTo\(|scrollBy\(|scrollIntoView/g),
    0,
  );
  same(
    [...timelineSource.matchAll(/from '([^']+)'/g)].map((m) => m[1]),
    [
      './breeze-renderer',
      './atmospheric-sky-renderer',
      './home-motion',
      './scene-image',
      './home-production',
      './room-discovery',
      './hero-depth',
      './atmospheric-bridge-frame',
      './home-story-frame',
      './worlds-orbit',
    ],
    'the timeline gains only the pure orbit module',
  );
  assert.doesNotMatch(chapterSource, /'use client'|useState|useEffect/);
  assert.match(
    discoverySource,
    /!state\.orbit/,
    'discovery yields to the orbit',
  );
}

// ---------------------------------------------------------------------------
// Regressions 8–9. Room hrefs and the /world gateway are unchanged; one
// semantic link per room; the portals are decorative parts of those links.
// ---------------------------------------------------------------------------
{
  assert.equal(chapterSource.match(/<Link\b/g).length, 1, 'one link per room');
  assert.match(
    chapterSource,
    /\{worldsChapterOptions\.map\(\(room, index\) => \([\s\S]*?<Link\s+href=\{room\.href\}\s+prefetch=\{false\}\s+className="hc-atrium-room-link"\s+data-chapter-reveal=\{index\}\s+data-room=\{room\.id\}\s*>\s*\{\/\*[\s\S]*?\*\/\}\s*<picture className="hc-room-portal">\s*<img\s+data-room-portal=\{room\.id\}\s+data-src=\{`\/images\/home-chapters\/room-preview-\$\{room\.id\}\.webp`\}\s+width="192"\s+height="192"\s+alt=""\s+loading="lazy"\s+decoding="async"\s+fetchPriority="low"\s*\/>\s*<\/picture>\s*<small>/,
    'the portal is a decorative part of the one room link',
  );
  assert.match(
    chapterSource,
    /<WorldGatewayLink className="hc-atrium-cta" data-chapter-reveal="9">[\s\S]*ENTER THE WORLD/,
  );
  assert.equal(chapterSource.match(/asset="worlds-atrium"/g).length, 1);
  assert.match(
    chapterSource,
    /<span className="hc-room-focus" aria-hidden="true" \/>/,
  );
  // The portal never borrows the gateway's circle, and the gateway keeps
  // showing the World while the rooms orbit.
  assert.match(
    chapterCss,
    /\.hc-worlds\[data-room-orbit\] \.hc-atrium-cta:focus-visible \{\s*opacity: 1 !important;/,
    'keyboard focus outranks the quieter gateway',
  );
  assert.ok(
    ORBIT.gatewayQuiet[0] >= ORBIT.labelsOut[1],
    'quiet only in orbit mode',
  );
  // Phones keep the room grid's slot at its natural height (two 44px rows
  // plus the row gap) while its links orbit: no layout shift in the column.
  assert.match(
    chapterCss,
    /\.hc-worlds\[data-room-orbit\] \.hc-atrium-rooms \{\s*position: static;\s*min-height: 96px;/,
  );
  assert.match(
    storyCss,
    /\.hc-atrium-rooms \{\s*gap: 0 18px;\s*\}[\s\S]*?\.hc-worlds\[data-room-orbit\] \.hc-atrium-rooms \{\s*min-height: 88px;/,
  );
  const orbitCss = chapterCss
    .slice(chapterCss.indexOf('/* TP3D PASS — Atrium room orbit'))
    .replace(/\/\*[\s\S]*?\*\//g, '');
  assert.doesNotMatch(orbitCss, /border-radius: 50%/);
  // The photograph never rotates or distorts; portals never tilt.
  assert.doesNotMatch(orbitCss, /rotate|perspective|skew|matrix3d/);
  assert.doesNotMatch(timelineSource, /rotate\(|perspective\(|skew\(/);
}
// ---------------------------------------------------------------------------
// PASS 6A. The dormant Tier B hook. Production builds keep the gate shut
// (the module is never requested; every write above is unchanged). With
// the preview gate open and ?atriumOrbit=1, the one timeline feeds the
// controller from the same appended span and the portal orbit stands down.
// ---------------------------------------------------------------------------
{
  const microtasks = () => new Promise((resolve) => setImmediate(resolve));
  const previewSource = timelineSource.replaceAll(
    'import.meta.env.VITE_ATRIUM_ORBIT_PREVIEW',
    "'1'",
  );
  // The stub answers with the real pure gateway reveal (PASS 6A.75) and the
  // real pure release (PASS 6A.96): the timeline stays the only writer of
  // the World gateway and of the baseline.
  const tierB = loadStoryMath('atrium-orbit-progress');
  const tierBTimeline = tierB.buildOrbitTimeline(
    tierB.ATRIUM_ORBIT_TIMING,
    null,
  );
  const tierBFrame = (roomOrbitProgress) => {
    const sample = tierB.sampleOrbit(roomOrbitProgress, tierBTimeline);
    const { reveal, interactive } = tierB.atriumGateway(
      sample,
      sample.activeState,
    );
    return {
      gateway: reveal,
      gatewayInteractive: interactive,
      baseline: tierB.atriumRelease(sample).editorial,
    };
  };
  const stub = () => {
    const record = { created: [], updates: [], suspended: 0, destroyed: 0 };
    record.module = {
      createAtriumOrbitController(worlds, wake, options) {
        record.created.push({ worlds, wake, options });
        return {
          update: (input) => {
            record.updates.push({ ...input });
            return tierBFrame(input.roomOrbitProgress);
          },
          suspend: () => record.suspended++,
          debug: () => 'stub',
          destroy: () => record.destroyed++,
        };
      },
    };
    return record;
  };
  // Production: the gate is shut before the URL is even read.
  for (const search of ['?atriumOrbit=1', '']) {
    const h = story({ tierB: { search, controller: stub().module } });
    await microtasks();
    h.settle();
    h.scroll(Math.round(h.span() + 0.5 * h.orbitSpan()));
    assert.equal(h.tierBRequests(), 0, 'production never requests Tier B');
    assert.equal(h.worlds.getAttribute('data-room-orbit'), '');
    h.dispose();
  }
  // Preview without the query parameter: the approved Scene 3 only.
  {
    const record = stub();
    const h = story({
      source: previewSource,
      tierB: { search: '?storyDebug=1', controller: record.module },
    });
    await microtasks();
    assert.equal(h.tierBRequests(), 0, 'only ?atriumOrbit=1 loads Tier B');
    h.dispose();
  }
  // PASS 6A.96: ?atriumOrbit=1 is the clean review URL. The engineering
  // readout needs its own explicit parameter, which never opens the harness
  // by itself; the development-only ?storyDebug=1 does not open it in a
  // preview build either.
  for (const [search, requests, diagnostics] of [
    ['?atriumOrbit=1', 1, false],
    ['?atriumOrbit=1&atriumOrbitDebug=1', 1, true],
    ['?atriumOrbitDebug=1&atriumOrbit=1', 1, true],
    ['?atriumOrbit=1&atriumOrbitDebug=0', 1, false],
    ['?atriumOrbit=1&atriumOrbitDebug', 1, false],
    ['?atriumOrbit=1&storyDebug=1', 1, false],
    ['?atriumOrbitDebug=1', 0, null],
    ['?atriumOrbit=0&atriumOrbitDebug=1', 0, null],
  ]) {
    const record = stub();
    const h = story({
      source: previewSource,
      tierB: { search, controller: record.module },
    });
    await microtasks();
    assert.equal(h.tierBRequests(), requests, search);
    assert.equal(record.created.length, requests, search);
    if (requests)
      same(record.created[0].options, { diagnostics }, `readout: ${search}`);
    h.dispose();
  }
  // A production build has no readout at any URL: the gate never opens.
  {
    const record = stub();
    const h = story({
      tierB: {
        search: '?atriumOrbit=1&atriumOrbitDebug=1',
        controller: record.module,
      },
    });
    await microtasks();
    assert.equal(h.tierBRequests(), 0, 'production never loads the readout');
    h.dispose();
  }
  assert.match(
    timelineSource,
    /const debug =\s*import\.meta\.env\.DEV &&\s*new URLSearchParams\(window\.location\.search\)\.get\('storyDebug'\) === '1'/,
    'storyDebug stays development-only',
  );
  assert.match(
    timelineSource,
    /createAtriumOrbitController\(worlds, schedule, \{\s*diagnostics:\s*!!debug \|\|\s*new URLSearchParams\(window\.location\.search\)\.get\(\s*'atriumOrbitDebug',\s*\) === '1',\s*\}\)/,
    'the readout: explicit ?atriumOrbitDebug=1, or development storyDebug',
  );
  // Preview with ?atriumOrbit=1.
  {
    const record = stub();
    const shut = story();
    const h = story({
      source: previewSource,
      tierB: { search: '?atriumOrbit=1', controller: record.module },
    });
    await microtasks();
    h.settle();
    shut.settle();
    assert.equal(h.tierBRequests(), 1);
    assert.equal(record.created.length, 1, 'one controller');
    assert.equal(record.created[0].worlds, h.worlds);
    same(record.created[0].options, { diagnostics: false }, 'clean preview');
    const span = h.span();
    const orbitSpan = h.orbitSpan();
    // The approved journey is untouched up to p = 1, except the World
    // gateway: orbit mode keeps it hidden through Arrival (PASS 6A.75).
    const withoutGateway = (trace) =>
      trace.filter(([name]) => name !== 'gateway');
    for (const y of steps(0, span, 24).map(Math.round)) {
      h.scroll(y);
      shut.scroll(y);
      same(
        withoutGateway(h.trace({ base: true })),
        withoutGateway(shut.trace({ base: true })),
        `base ${y}`,
      );
      assert.equal(h.gateway.style.getPropertyValue('opacity'), '0.00000');
      assert.ok(h.gateway.inert, 'no ENTER THE WORLD during Arrival');
      const last = record.updates.at(-1);
      assert.equal(last.roomOrbitProgress, 0, 'no room progress before p = 1');
      assert.equal(
        last.baseStoryProgress.toFixed(5),
        h.root.dataset.storyProgress,
      );
    }
    // The appended span drives Tier B; the portals stand down.
    const at = (o) => {
      h.scroll(Math.round(span + o * orbitSpan));
      return record.updates.at(-1);
    };
    const forward = steps(0, 1, 40).map((o) => at(o).roomOrbitProgress);
    const reverse = steps(1, 0, 40).map((o) => at(o).roomOrbitProgress);
    same(forward, [...reverse].reverse(), 'progress is a pure function');
    // PASS 6A.5: two separate normalised domains. The base story progress
    // never runs past 1; the room orbit starts only once it has reached 1.
    for (const update of record.updates) {
      assert.ok(update.baseStoryProgress >= 0 && update.baseStoryProgress <= 1);
      assert.ok(update.roomOrbitProgress >= 0 && update.roomOrbitProgress <= 1);
      if (update.roomOrbitProgress > 0)
        assert.equal(update.baseStoryProgress, 1, 'orbit only after p = 1');
    }
    assert.equal(forward[0], 0);
    assert.equal(forward.at(-1), 1);
    assert.ok(forward.every((v, i) => i === 0 || v >= forward[i - 1]));
    // Portal positions are no longer driven (a value written before the
    // import resolved is inert: CSS reads it only in [data-room-orbit]).
    const portals = () =>
      h.wrappers.map((node) => [
        node.style.getPropertyValue('--orbit-x'),
        node.style.getPropertyValue('--orbit-y'),
        node.style.getPropertyValue('--orbit-scale'),
      ]);
    at(0.2);
    const early = portals();
    at(0.8);
    same(portals(), early, 'the portals stand down under Tier B');
    assert.equal(h.worlds.getAttribute('data-room-orbit'), null);
    assert.equal(h.worlds.getAttribute('data-orbit-room'), null);
    same(
      Object.keys(record.updates.at(-1)).sort(),
      ['baseStoryProgress', 'height', 'reduced', 'roomOrbitProgress', 'width'],
      'the controller receives sampled values only',
    );
    // PASS 6A.75: ENTER THE WORLD returns only in the later part of the
    // Kitchen hold, eased by roomOrbitProgress, and is interactive once
    // whole. PASS 6A.96: it then settles out in the final release, together
    // with the baseline, so the stage reaches the Footer as a quiet frame.
    // Reverse scrolling rebuilds every step (pure, no timer).
    {
      const release = tierBTimeline.segments.at(-1);
      const kitchen = tierBTimeline.segments.at(-2);
      assert.equal(release.kind, 'release');
      same([kitchen.kind, kitchen.state], ['hold', 'kitchen']);
      assert.equal(release.end, 1, 'the release ends where the stage leaves');
      const revealFrom =
        kitchen.start +
        tierB.ATRIUM_ORBIT_TIMING.gateway.revealFrom *
          (kitchen.end - kitchen.start);
      const gatewayAt = (o) => {
        const update = at(o);
        const expected = tierBFrame(update.roomOrbitProgress);
        return {
          o,
          opacity: h.gateway.style.getPropertyValue('opacity'),
          inert: h.gateway.inert,
          baseline: h.baseline.style.getPropertyValue('opacity'),
          expected,
          roomOrbitProgress: update.roomOrbitProgress,
        };
      };
      const positions = [
        ...steps(0, 1, 60),
        ...steps(kitchen.start, 1, 240),
        kitchen.end,
      ].sort((a, b) => a - b);
      const forward = positions.map(gatewayAt);
      const reverse = [...positions].reverse().map(gatewayAt).reverse();
      same(forward, reverse, 'gateway and release are pure functions');
      for (const g of forward) {
        assert.equal(g.opacity, g.expected.gateway.toFixed(5));
        assert.equal(g.inert, !g.expected.gatewayInteractive);
        assert.equal(g.baseline, g.expected.baseline.toFixed(5));
        if (g.roomOrbitProgress < revealFrom)
          assert.equal(g.opacity, '0.00000', `hidden at ${g.o}`);
        if (g.roomOrbitProgress <= release.start)
          assert.equal(g.baseline, '1.00000', `baseline whole at ${g.o}`);
      }
      const before = forward.filter(
        (g) => g.roomOrbitProgress <= release.start,
      );
      const during = forward.filter(
        (g) => g.roomOrbitProgress >= release.start,
      );
      assert.ok(
        before.every(
          (g, i) => !i || Number(g.opacity) >= Number(before[i - 1].opacity),
        ),
        'never pops back while scrolling forward to the release',
      );
      // The useful final state: Kitchen with the whole, interactive gateway.
      // (Scroll positions are whole pixels: within a few of the boundary.)
      const whole = before.at(-1);
      assert.ok(release.start - whole.roomOrbitProgress < 3 / orbitSpan);
      assert.equal(whole.opacity, '1.00000', 'whole before the release');
      assert.equal(whole.inert, false, 'interactive before the release');
      assert.ok(during.length > 60, 'the release is sampled finely');
      for (const key of ['opacity', 'baseline']) {
        assert.ok(
          during.every(
            (g, i) => !i || Number(g[key]) <= Number(during[i - 1][key]),
          ),
          `${key} only leaves in the release`,
        );
        assert.ok(
          during.every(
            (g, i) => !i || Number(during[i - 1][key]) - Number(g[key]) < 0.12,
          ),
          `${key} eases out, never a cut`,
        );
      }
      // Before the sticky stage leaves (roomOrbitProgress = 1) nothing is
      // left: no gateway, no baseline, and the gateway takes no focus.
      const end = forward.at(-1);
      assert.equal(end.roomOrbitProgress, 1);
      same(
        [end.opacity, end.baseline, end.inert],
        ['0.00000', '0.00000', true],
      );
      const quiet = during.filter(
        (g) => g.opacity === '0.00000' && g.baseline === '0.00000',
      );
      assert.ok(
        quiet.length > 20 && quiet[0].roomOrbitProgress < 0.99,
        'the quiet frame is held before the stage leaves',
      );
      at(release.start);
      assert.equal(h.gateway.getAttribute('aria-hidden'), 'false');
      at(1);
      assert.equal(h.gateway.getAttribute('aria-hidden'), 'true');
      at(0);
      assert.equal(h.gateway.getAttribute('aria-hidden'), 'true');
      assert.ok(revealFrom > kitchen.start, 'Kitchen is readable alone first');
      // Past the orbit (the stage is leaving) the quiet frame holds: no
      // editorial element returns while it slides under the header.
      for (const beyond of [1.02, 1.2, 1.6]) {
        h.scroll(Math.round(span + beyond * orbitSpan));
        assert.equal(record.updates.at(-1).roomOrbitProgress, 1);
        assert.equal(h.gateway.style.getPropertyValue('opacity'), '0.00000');
        assert.equal(h.baseline.style.getPropertyValue('opacity'), '0.00000');
        assert.ok(h.gateway.inert);
      }
    }
    // A decoded plate wakes the one RAF once; the story comes back to rest.
    const before = h.rafCalls();
    record.created[0].wake();
    assert.equal(h.rafCalls(), before + 1);
    h.settle();
    h.document.hidden = true;
    h.document.emit('visibilitychange');
    assert.equal(record.suspended, 1, 'a hidden tab suspends Tier B');
    h.document.hidden = false;
    h.document.emit('visibilitychange');
    h.settle();
    h.dispose();
    shut.dispose();
    assert.equal(record.destroyed, 1, 'destroyed with the story');
    assert.equal(h.listenerCount(), 0, 'every listener is removed');
  }
  // A late import never resurrects Tier B after Home unmounts.
  {
    const record = stub();
    const h = story({
      source: previewSource,
      tierB: { search: '?atriumOrbit=1', controller: record.module },
    });
    h.dispose();
    await microtasks();
    assert.equal(record.created.length, 0, 'disposed before the import');
  }
  // A failed import keeps the approved Scene 3 and its portal orbit.
  {
    const h = story({
      source: previewSource,
      tierB: { search: '?atriumOrbit=1', controller: null },
    });
    await microtasks();
    h.settle();
    h.scroll(Math.round(h.span() + 0.5 * h.orbitSpan()));
    assert.equal(h.tierBRequests(), 1);
    assert.equal(h.worlds.getAttribute('data-room-orbit'), '');
    h.dispose();
  }
}
{
  // Everything the PASS must not touch is byte-identical to PASS 15
  // (d1a6a78): Intro, Arrival, Perspective, Breeze, Atmosphere renderer and
  // shaders, bridge frames, header, footer, WorldGatewayLink, the portal,
  // /world and its rooms, room data. Line endings are normalised.
  const PASS = new Set(
    [
      // STEP 1 (the scroll follow) replaces `scrub: 0` in the motion
      // vocabulary; its curves and timings are locked by check:home.
      'home-motion.ts',
      // STEP 2: the cloth travels between its two reading poses
      // (check:home, check-continuous-breeze).
      'breeze-renderer.ts',
      'home-story-timeline.ts',
      'home-story.css',
      'home-story.tsx',
      'room-discovery.ts',
      'worlds-chapter.css',
      'worlds-chapter.tsx',
      'worlds-orbit.ts',
    ].map((name) => `${EXPERIENCE}${name}`),
  );
  const walk = (dir) =>
    readdirSync(new URL(`../${dir}`, import.meta.url))
      .sort()
      .flatMap((name) => {
        const path = `${dir}${name}`;
        return statSync(new URL(`../${path}`, import.meta.url)).isDirectory()
          ? walk(`${path}/`)
          : [path];
      });
  const files = [
    ...walk('components/home/'),
    ...walk('components/world/'),
    ...walk('components/layout/'),
    ...walk('app/world/'),
    'app/page.tsx',
    'data/home-chapters.ts',
    'data/world-building.ts',
  ]
    // PASS 6A's dormant Tier B modules are new files, checked by
    // check:atrium-orbit-foundation; everything else stays byte-identical.
    .filter(
      (path) =>
        !PASS.has(path) && !path.startsWith(`${EXPERIENCE}atrium-orbit-`),
    )
    .map((path) => [
      path,
      createHash('sha256')
        .update(read(path).replaceAll('\r\n', '\n'))
        .digest('hex')
        .slice(0, 12),
    ]);
  // d8922fdb98a3c952 until STEP 1 took home-motion.ts out of the list, then
  // a0457b72548e0e98 until STEP 2 took breeze-renderer.ts out (each time no
  // other listed file had changed: the working tree showed only PASS files).
  assert.equal(
    digest(files),
    '31c6ef69310765f3',
    'files outside this PASS are unchanged from PASS 15',
  );
}

const g = measureWorldsOrbit(1440, 900);
console.log(
  `Atrium room orbit passed: base journey = PASS 15 (${PASS15_BASE_DIGEST}), ` +
    `orbit +${geometry.orbit}svh after p = 1 (none reduced), Living → ` +
    `Bedroom → Bathroom → Kitchen with holds and exact reverse, depth ` +
    `${ORBIT.shapes.desktop.scale.join('–')}, breath ≤ ${1 + ORBIT.breath}, ` +
    `ellipse ${Math.round(g.layout.radiusX)}×${Math.round(g.layout.radiusY)}px ` +
    `at 1440×900, portals fitted in bounds on 12 viewports, one owner, ` +
    `0 RAF at rest, hrefs and gateway unchanged; the Tier B hook is shut ` +
    `in production and drives one dormant controller in preview.`,
);
