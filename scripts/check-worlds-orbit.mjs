/** TP3D PASS 16 — the Atrium orbit. After the approved journey (base
 * progress 0 → 1, its PASS 15 scroll distance unchanged) an appended span of
 * native scroll turns the camera toward each room around the central island.
 * Checked here: the CSS story geometry, the real master timeline in a small
 * owned DOM double (base writes digest-locked to the PASS 15 timeline), the
 * pure orbit frame, the real RoomDiscovery and the source contracts. Browser
 * visual, network and performance QA remain separate (see the PASS 16 doc).
 *
 * To re-derive the base digest from another timeline source:
 *   ORBIT_BASELINE_TIMELINE=<path> node scripts/check-worlds-orbit.mjs */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { loadStoryMath } from './load-story-math.mjs';

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const EXPERIENCE = 'components/home/experience/';
const transpile = (text) =>
  ts.transpileModule(text.replaceAll('import.meta.env.DEV', 'false'), {
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

const { MOTION } = loadStoryMath('home-motion');
const { bridgeTiming, measureAtrium, worldReveal } = loadStoryMath(
  'atmospheric-bridge-frame',
);
const { HOME_PRODUCTION } = loadStoryMath('home-production');
const {
  ATRIUM_SOURCE,
  ORBIT,
  ORBIT_ROOMS,
  ORBIT_TARGETS,
  ORBIT_CAPTIONS,
  measureOrbit,
  worldOrbitFrame,
  orbitTier,
  roomPose,
  orbitPose,
} = loadStoryMath('worlds-orbit-frame');
const ROOMS = ['living', 'bedroom', 'bathroom', 'kitchen'];

const timelineSource = read(`${EXPERIENCE}home-story-timeline.ts`);
const orbitSource = read(`${EXPERIENCE}worlds-orbit-frame.ts`);
const discoverySource = read(`${EXPERIENCE}room-discovery.ts`);
const chapterSource = read(`${EXPERIENCE}worlds-chapter.tsx`);
const chapterCss = read(`${EXPERIENCE}worlds-chapter.css`);
const storySource = read(`${EXPERIENCE}home-story.tsx`);
const storyCss = read(`${EXPERIENCE}home-story.css`);

// ---------------------------------------------------------------------------
// 1–2. Story geometry: the PASS 15 heights are the base journey; the orbit is
// appended as its own span, only when motion is allowed.
// ---------------------------------------------------------------------------
const PASS15_BASE = { desktop: 360, tablet: 320, mobile: 280 };
const storyGeometry = (() => {
  const root = storyCss.match(/\n\.home-story \{([^}]*)\}/);
  assert.ok(root, 'the story root rule exists');
  assert.match(root[1], /--story-base-height: 360svh;/);
  assert.match(root[1], /--story-orbit-height: 0svh;/);
  assert.match(
    root[1],
    /--story-height: calc\(var\(--story-base-height\) \+ var\(--story-orbit-height\)\);/,
  );
  assert.match(root[1], /height: var\(--story-height\);/);
  assert.equal(
    storyCss.match(/--story-height:/g).length,
    1,
    'the total story height is only ever base + orbit',
  );
  const base = { desktop: 360 };
  for (const [, query, value] of storyCss.matchAll(
    /@media \(max-width: (\d+)px\) \{\s*\.home-story \{\s*--story-base-height: (\d+)svh;/g,
  ))
    base[query === '1199' ? 'tablet' : query === '767' ? 'mobile' : query] =
      Number(value);
  same(base, { desktop: 360, tablet: 320, mobile: 280 });
  same(base, PASS15_BASE, 'base heights are the PASS 15 story heights');
  assert.equal(storyCss.match(/--story-base-height: \d+svh/g).length, 3);
  const orbit = {};
  const declarations = [
    ...storyCss.matchAll(
      /@media ([^{]+)\{\s*\.home-story \{\s*--story-orbit-height: (\d+)svh;\s*\}\s*\}/g,
    ),
  ];
  for (const [, query, value] of declarations) {
    assert.match(
      query,
      /^\(prefers-reduced-motion: no-preference\)/,
      'an orbit span exists only when motion is allowed',
    );
    const tier = query.includes('max-height: 540px')
      ? 'landscape'
      : query.includes('max-width: 767px')
        ? 'mobile'
        : query.includes('max-width: 1199px')
          ? 'tablet'
          : 'desktop';
    assert.equal(orbit[tier], undefined, `one ${tier} orbit span`);
    orbit[tier] = Number(value);
  }
  assert.equal(
    storyCss.match(/--story-orbit-height:/g).length,
    declarations.length + 1,
    'the root default (0svh) is the only other orbit declaration',
  );
  assert.ok(orbit.desktop >= 260 && orbit.desktop <= 320, 'desktop orbit');
  assert.ok(orbit.tablet >= 200 && orbit.tablet <= 240, 'tablet orbit');
  assert.ok(orbit.mobile >= 150 && orbit.mobile <= 190, 'mobile orbit');
  assert.ok(orbit.mobile < orbit.tablet && orbit.tablet < orbit.desktop);
  assert.ok(orbit.landscape <= orbit.tablet, 'short landscape stays light');
  assert.doesNotMatch(
    storyCss,
    /prefers-reduced-motion: reduce\)[^@]*--story-orbit-height: [1-9]/,
    'reduced motion never keeps an orbit spacer',
  );
  // The marker measures the base journey from the same custom property.
  const marker = storyCss.match(/\n\.home-story-base \{([^}]*)\}/);
  assert.ok(marker);
  assert.match(marker[1], /position: absolute;/);
  assert.match(marker[1], /height: var\(--story-base-height\);/);
  assert.match(marker[1], /visibility: hidden;/);
  assert.match(marker[1], /pointer-events: none;/);
  assert.match(
    storySource,
    /<\/aside>\s*<\/div>[\s\S]*<div\s+className="home-story-base"\s+data-home-story-base\s+aria-hidden="true"\s*\/>\s*<\/section>/,
    'the base marker sits outside the sticky stage',
  );
  return { base, orbit };
})();
const baseSvh = (w) =>
  w < 768
    ? storyGeometry.base.mobile
    : w < 1200
      ? storyGeometry.base.tablet
      : storyGeometry.base.desktop;
const orbitSvh = (w, h) =>
  w < 1200 && h <= 540 && w > h
    ? storyGeometry.orbit.landscape
    : w < 768
      ? storyGeometry.orbit.mobile
      : w < 1200
        ? storyGeometry.orbit.tablet
        : storyGeometry.orbit.desktop;

// ---------------------------------------------------------------------------
// A small owned DOM double for the real master timeline.
// ---------------------------------------------------------------------------
function story({
  source = timelineSource,
  width = 1440,
  height = 900,
  orbit = true,
  reduced = false,
  initialScroll = 0,
  imageMode = 'sync',
  restoring = false,
} = {}) {
  let vw = width,
    vh = height,
    clock = 0,
    sequenceId = 0,
    rafCalls = 0;
  const frames = new Map(),
    emitters = [],
    observers = [],
    log = [],
    discovery = { updates: [], suspended: 0, destroyed: 0 };
  let motionOff = reduced;
  const heights = () => {
    const base = (baseSvh(vw) / 100) * vh;
    const extra =
      orbit === true && !motionOff ? (orbitSvh(vw, vh) / 100) * vh : 0;
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
    priorities = new Map();
    setProperty(name, value, priority = '') {
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
      this.values.delete(name);
    }
  }
  const camel = (key) =>
    'data-' + String(key).replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());
  class Node extends Events {
    attrs = new Map();
    style = new Style();
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
      log.push([this.name, name, String(value)]);
      this.attrs.set(name, String(value));
    }
    removeAttribute(name) {
      log.push([this.name, name, null]);
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
  const window = Object.assign(new Events(), { scrollY: initialScroll });
  window.scrollTo = window.scrollBy = () =>
    assert.fail('the orbit never corrects native scroll');
  const documentElement = new Node('html');
  if (restoring) documentElement.setAttribute('data-home-restoring', '');
  const document = Object.assign(new Events(), {
    hidden: false,
    readyState: 'complete',
    documentElement,
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
  const caption = new Node('caption');
  const shades = [new Node('shade-left'), new Node('shade-right')];
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
  const links = reveals.filter((node) => node.name.startsWith('room-'));
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
      '.hc-orbit-caption': caption,
      '[data-orbit-shade="left"]': shades[0],
      '[data-orbit-shade="right"]': shades[1],
    })[selector] ?? null;
  worlds.querySelectorAll = (selector) =>
    selector === '[data-chapter-reveal]' ? reveals : [];
  const media = {
    '(prefers-reduced-motion: reduce)': Object.assign(new Events(), {
      matches: reduced,
    }),
    '(hover: hover) and (pointer: fine)': Object.assign(new Events(), {
      matches: true,
    }),
  };
  window.matchMedia = (query) => media[query];
  let imageReady = null;
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
          createRoomDiscovery: (host) => {
            assert.equal(host, worlds);
            return {
              update: (state) => discovery.updates.push({ ...state }),
              suspend: () => discovery.suspended++,
              destroy: () => discovery.destroyed++,
            };
          },
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
                if (imageMode === 'sync') callbacks.ready();
                else imageReady = callbacks.ready;
              },
              destroy() {},
            };
          },
        };
      assert.match(
        path,
        /^\.\/(home-production|home-motion|home-story-frame|atmospheric-bridge-frame|worlds-orbit-frame)$/,
        `unexpected timeline import ${path}`,
      );
      return loadStoryMath(path.slice(2));
    },
    window,
    document,
    navigator: {},
    ResizeObserver: class {
      constructor(fn) {
        this.fn = fn;
        this.targets = [];
        observers.push(this);
      }
      observe(node) {
        this.targets.push(node);
      }
      disconnect() {
        this.targets = [];
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
  const flush = (elapsed = 1000 / 60) => {
    clock += elapsed;
    const tasks = [...frames.values()];
    frames.clear();
    for (const task of tasks) task(clock);
  };
  // Every scroll sample is painted to rest, so samples never depend on the
  // path taken to reach them.
  const settle = () => {
    for (let i = 0; i < 400 && frames.size; i++) flush();
    assert.equal(frames.size, 0, 'the story comes to rest: 0 RAF');
  };
  const scroll = (y) => {
    window.scrollY = y;
    window.emit('scroll');
    settle();
  };
  const span = () => heights().base - vh;
  const orbitSpan = () => heights().total - heights().base;
  const named = [
    root,
    header,
    stage,
    storyNode,
    worlds,
    camera,
    rooms,
    caption,
    ...shades,
    ...reveals,
  ];
  const byKey = ([a], [b]) => (a < b ? -1 : a > b ? 1 : 0);
  // The approved outputs only: orbit-owned values are excluded so a PASS 15
  // timeline and this one can be compared over the base journey.
  const trace = ({ base = false } = {}) =>
    named
      .filter((node) => !base || (node !== caption && !shades.includes(node)))
      .map((node) => [
        node.name,
        [...node.style.values]
          .filter(([key]) => !base || !key.startsWith('--room-orbit-'))
          .sort(byKey),
        [...node.attrs]
          .filter(
            ([key]) =>
              !base ||
              (key !== 'data-world-orbit' && key !== 'data-orbit-room'),
          )
          .sort(byKey),
      ]);
  const dispose = loaded.exports.createHomeStoryTimeline(root);
  return {
    dispose,
    root,
    settle,
    flush,
    scroll,
    trace,
    span,
    orbitSpan,
    frames,
    log,
    discovery,
    window,
    document,
    media,
    observers,
    emitters,
    worlds,
    camera,
    rooms,
    caption,
    shades,
    reveals,
    links,
    gateway,
    header,
    documentElement,
    rafCalls: () => rafCalls,
    readyImage: () => imageReady?.(),
    viewport: () => [vw, vh],
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
    listenerCount: () =>
      emitters.reduce(
        (n, e) => n + [...e.listeners.values()].reduce((a, s) => a + s.size, 0),
        0,
      ),
  };
}

// ---------------------------------------------------------------------------
// 3–9. The base journey keeps its physical scroll distance and every write.
// ---------------------------------------------------------------------------
const BASE_VIEWPORTS = [
  [1440, 900],
  [1180, 820],
  [390, 844],
  [844, 390],
];
function baseJourney(source, orbit) {
  const frames = [];
  for (const [width, height] of BASE_VIEWPORTS)
    for (const reduced of [false, true]) {
      const h = story({ source, width, height, orbit, reduced });
      h.settle();
      const span = h.span();
      const positions = [
        ...steps(0, span, 240),
        ...steps(span, 0, 24).slice(1),
      ].map(Math.round);
      for (const y of positions) {
        h.scroll(y);
        frames.push([width, height, reduced, y, h.trace({ base: true })]);
        // Discovery is asked the same questions over the base journey.
        const { orbit: _orbit, ...state } = h.discovery.updates.at(-1);
        frames.push(state);
      }
      h.dispose();
    }
  return frames;
}
// The PASS 15 HEAD (d1a6a78) timeline, run over the same samples without an
// orbit, produced this digest.
const PASS15_BASE_DIGEST = '11b1a49bdceb01ae';
if (process.env.ORBIT_BASELINE_TIMELINE) {
  const baseline = readFileSync(process.env.ORBIT_BASELINE_TIMELINE, 'utf8');
  console.log(digest(baseJourney(baseline, 'no-marker')));
  process.exit(0);
}
{
  const withOrbit = digest(baseJourney(timelineSource, true));
  assert.equal(
    withOrbit,
    PASS15_BASE_DIGEST,
    'every base-journey write equals the PASS 15 timeline (not stretched)',
  );
  assert.equal(
    digest(baseJourney(timelineSource, 'no-marker')),
    PASS15_BASE_DIGEST,
    'without a base marker the story is exactly PASS 15',
  );
}

// The physical span: base progress reaches 1 at the PASS 15 scroll distance.
{
  for (const [width, height] of [...BASE_VIEWPORTS, [1366, 768], [820, 1180]]) {
    const h = story({ width, height });
    h.settle();
    const expected = (baseSvh(width) / 100) * height - height;
    assert.ok(Math.abs(h.span() - expected) < 1e-6, `${width}×${height} base`);
    const extra = (orbitSvh(width, height) / 100) * height;
    assert.ok(
      Math.abs(h.orbitSpan() - extra) < 1e-6,
      `${width}×${height} orbit`,
    );
    // Base progress is clamped to 1 throughout the appended orbit.
    for (const o of steps(0, 1, 20)) {
      h.scroll(h.span() + o * h.orbitSpan());
      assert.equal(h.root.dataset.storyProgress, '1.00000');
    }
    h.dispose();
  }
}

// 7–9. The orbit starts only after base progress is 1, after the approved
// settle and its final hold.
{
  const h = story();
  h.settle();
  const span = h.span();
  const settled = bridgeTiming.settled;
  assert.equal(settled, HOME_PRODUCTION.discoveryStart);
  assert.ok(1 - settled >= 0.08, 'the approved final hold remains');
  let held = null;
  for (const y of steps(0, span, 400).map(Math.round)) {
    h.scroll(y);
    assert.equal(h.worlds.getAttribute('data-orbit-room'), null);
    assert.equal(h.caption.style.getPropertyValue('opacity'), '0.00000');
    assert.equal(h.discovery.updates.at(-1).orbit, false);
    if (y >= settled * span) {
      // The settled hold: nothing moves until the base journey ends.
      const frame = json(h.trace().filter(([name]) => name !== 'root'));
      held ??= frame;
      assert.equal(frame, held, `the final hold is still at ${y}`);
      assert.equal(h.camera.style.getPropertyValue('transform'), 'none');
    }
  }
  h.scroll(span);
  assert.equal(h.worlds.getAttribute('data-world-orbit'), 'overview');
  // The first frame of orbit motion is strictly after base progress 1.
  let first = null;
  for (let y = span; y <= span + h.orbitSpan(); y += 4) {
    h.scroll(y);
    if (h.camera.style.getPropertyValue('transform') !== 'none') {
      first = y;
      break;
    }
  }
  assert.ok(first > span, 'the orbit camera starts after the base journey');
  assert.ok(
    (first - span) / h.orbitSpan() >= ORBIT.leave,
    'the camera leaves only after the overview has released',
  );
  h.dispose();
}

// ---------------------------------------------------------------------------
// 10–23. The pure orbit model.
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
    /\b(direction|lastScroll|previous(Scroll|Progress)|velocityState)\b/,
    /fetch\(|https?:/,
  ])
    assert.doesNotMatch(orbitSource, banned, `pure orbit frame: ${banned}`);
  assert.deepEqual([...ORBIT_ROOMS], ROOMS, 'four rooms in a fixed order');
  assert.deepEqual(Object.keys(ORBIT_TARGETS), ROOMS);
  assert.deepEqual(Object.keys(ORBIT.holds), ROOMS);
  same(ORBIT_CAPTIONS, {
    living: 'Living Room',
    bedroom: 'Bedroom',
    bathroom: 'Bathroom',
    kitchen: 'Kitchen',
  });
  // The homepage shortcuts the orbit addresses are the same four, in order.
  const data = read('data/home-chapters.ts');
  assert.match(
    data,
    /\[\s*'Living',\s*'Bedroom',\s*'Bathroom',\s*'Kitchen',\s*\]\.map/,
  );
  // Ranges: release, four separated holds, the return, the gateway hold.
  const holds = ROOMS.map((room) => ORBIT.holds[room]);
  assert.ok(ORBIT.release[0] > 0 && ORBIT.release[0] < ORBIT.release[1]);
  assert.ok(ORBIT.leave >= ORBIT.release[0] && ORBIT.leave < holds[0][0]);
  holds.forEach(([start, end], i) => {
    assert.ok(start < end, 'every room has a hold');
    assert.ok(end - start >= 0.06, 'each hold is a meaningful beat');
    if (i) assert.ok(holds[i - 1][1] < start, 'holds do not overlap');
  });
  assert.ok(holds[3][1] < ORBIT.back && ORBIT.back <= ORBIT.restore[1]);
  assert.ok(1 - ORBIT.restore[1] >= 0.1, 'a final gateway hold');
}
const VIEWPORTS = [
  [1440, 900],
  [1366, 768],
  [1280, 720],
  [1728, 1117],
  [1920, 1080],
  [1536, 864],
  [1200, 800],
  [2560, 1440],
  [1440, 1200],
  [1180, 820],
  [1024, 768],
  [820, 1180],
  [768, 1024],
  [430, 932],
  [390, 844],
  [360, 740],
  [844, 390],
  [740, 360],
  [667, 375],
];
const DESKTOP = VIEWPORTS.filter(([w]) => w >= 1200);
const SAMPLES = steps(0, 1, 2000);
{
  // Tiers: desktop ≥1200, tablet, mobile <768, short landscape, reduced.
  same(
    VIEWPORTS.map(([w, h]) => orbitTier(w, h, false)),
    [
      ...Array(9).fill('desktop'),
      'tablet',
      'tablet',
      'tablet',
      'tablet',
      'mobile',
      'mobile',
      'mobile',
      'landscape',
      'landscape',
      'landscape',
    ],
  );
  for (const [w, h] of VIEWPORTS)
    assert.equal(orbitTier(w, h, true), 'reduced');

  const g = measureOrbit(1440, 900);
  const frames = SAMPLES.map((o) => worldOrbitFrame(o, g, 'desktop'));
  // Sequence: overview → Living → Bedroom → Bathroom → Kitchen → overview.
  const order = frames
    .map((f) => f.activeRoom)
    .filter((room, i, all) => i === 0 || room !== all[i - 1]);
  same(order, [null, ...ROOMS, null], 'one pass through the four rooms');
  // Exact endpoints and clamping.
  const start = worldOrbitFrame(0, g, 'desktop');
  const end = worldOrbitFrame(1, g, 'desktop');
  same(worldOrbitFrame(-0.4, g, 'desktop'), start);
  same(worldOrbitFrame(1.7, g, 'desktop'), end);
  for (const f of [start, end]) {
    assert.equal(f.activeRoom, null);
    assert.equal(f.cameraX, 0);
    assert.equal(f.cameraY, 0);
    assert.equal(f.cameraScale, 1);
    assert.equal(f.focusCaptionOpacity, 0);
    assert.equal(f.gatewayOpacity, 1);
    assert.equal(f.overviewOpacity, 1);
    same(Object.values(f.copy), [1, 1, 1, 1]);
    same(Object.values(f.labelOpacity), [1, 1, 1, 1]);
    same(Object.values(f.labelEmphasis), [0, 0, 0, 0]);
    assert.equal(f.shadeLeft + f.shadeRight, 0);
  }
  assert.equal(start.phase, 'overview');
  assert.equal(end.phase, 'gateway', 'the sequence ends on the overview');
  // Same progress, same frame; reverse sampling equals forward sampling.
  same(
    SAMPLES.map((o) => worldOrbitFrame(o, g, 'desktop')),
    frames,
    'deterministic',
  );
  same(
    [...SAMPLES].reverse().map((o) => worldOrbitFrame(o, g, 'desktop')),
    [...frames].reverse(),
    'reverse sampling equals forward sampling',
  );
  // Holds: the camera is exactly at the room pose, still, with its title.
  for (const room of ROOMS) {
    const [a, b] = ORBIT.holds[room];
    const pose = roomPose(room, g, 'desktop');
    for (const o of steps(a, b, 20)) {
      const f = worldOrbitFrame(o, g, 'desktop');
      assert.equal(f.activeRoom, room);
      assert.equal(f.beat, 'hold');
      assert.equal(f.moving, false);
      assert.equal(f.cameraX, pose.x);
      assert.equal(f.cameraY, pose.y);
      assert.equal(f.cameraScale, pose.scale);
      assert.equal(f.focusCaptionOpacity, 1);
      for (const other of ROOMS) {
        assert.equal(f.labelEmphasis[other], other === room ? 1 : 0);
        assert.ok(
          Math.abs(
            f.labelOpacity[other] - (other === room ? 1 : ORBIT.labelRest),
          ) < 1e-12,
        );
      }
    }
  }
  assert.ok(ORBIT.labelRest >= 0.2 && ORBIT.labelRest <= 0.4);
  // One room focus at a time; the gateway is never hidden; copy steps back.
  for (const f of frames) {
    assert.ok(
      Object.values(f.labelEmphasis).reduce((a, b) => a + b, 0) <= 1 + 1e-9,
    );
    assert.ok(
      Object.values(f.labelEmphasis).filter((v) => v > 0.5).length <= 1,
    );
    assert.ok(f.gatewayOpacity >= 0.5 && f.gatewayOpacity <= 1);
    if (f.focusCaptionOpacity > 0) assert.ok(f.activeRoom, 'caption has room');
  }
  // Camera speed: zero at every room stop, and typography only over a slow
  // camera (never over peak motion).
  const speed = (o) => {
    const e = 1e-5;
    const a = worldOrbitFrame(o - e, g, 'desktop');
    const b = worldOrbitFrame(o + e, g, 'desktop');
    return (
      (Math.hypot(b.cameraX - a.cameraX, b.cameraY - a.cameraY) +
        Math.abs(b.cameraScale - a.cameraScale) * 1440) /
      (2 * e)
    );
  };
  const speeds = SAMPLES.slice(1, -1).map(speed);
  const peak = Math.max(...speeds);
  assert.ok(peak > 0);
  for (const room of ROOMS)
    for (const o of ORBIT.holds[room])
      assert.ok(speed(o) <= peak * 0.01, `${room} stops at ${o}`);
  SAMPLES.slice(1, -1).forEach((o, i) => {
    const caption = worldOrbitFrame(o, g, 'desktop').focusCaptionOpacity;
    if (caption >= 0.5)
      assert.ok(
        speeds[i] <= peak * 0.1,
        `readable title over slow camera ${o}`,
      );
    if (caption > 0.01)
      assert.ok(speeds[i] <= peak * 0.45, `no title over peak motion ${o}`);
  });
  // Final overview restores the World's authority before the gateway hold.
  for (const o of steps(ORBIT.restore[1], 1, 20)) {
    const f = worldOrbitFrame(o, g, 'desktop');
    same(f.copy, end.copy);
    assert.equal(f.gatewayOpacity, 1);
    assert.equal(f.cameraScale, 1);
  }
  // Reduced motion never moves.
  for (const o of SAMPLES.filter((_, i) => i % 50 === 0)) {
    const f = worldOrbitFrame(o, g, 'reduced');
    assert.equal(f.activeRoom, null);
    assert.equal(f.cameraScale, 1);
    assert.equal(f.cameraX, 0);
  }
}

// ---------------------------------------------------------------------------
// 24–35. Camera: scale, plate edges, source geometry, pivot drift, roll.
// ---------------------------------------------------------------------------
// The measured source geometry (worlds-atrium, 1672×941 master).
same(ATRIUM_SOURCE, { width: 1672, height: 941, pivot: { x: 836, y: 665 } });
assert.equal(ATRIUM_SOURCE.width, MOTION.camera.source.width);
assert.equal(ATRIUM_SOURCE.height, MOTION.camera.source.height);
same(ORBIT_TARGETS, {
  living: { x: 223, y: 451 },
  bedroom: { x: 557, y: 461 },
  bathroom: { x: 1120, y: 460 },
  kitchen: { x: 1488, y: 462 },
});
// The same cover mapping as the CSS (object-fit: cover; top; 50%, 51% on
// phones), written independently here.
const project = (w, h, point) => {
  const cover = Math.max(w / 1672, h / 941);
  const left = (w - 1672 * cover) * (w < 768 ? 0.51 : 0.5);
  return { x: left + point.x * cover, y: point.y * cover };
};
assert.match(chapterCss, /object-fit: cover;\s*object-position: 50% 0%;/);
assert.match(chapterCss, /object-position: 51% 0;/);
const drift = {};
for (const [w, h] of VIEWPORTS) {
  const tier = orbitTier(w, h, false);
  const g = measureOrbit(w, h);
  const pivot = project(w, h, ATRIUM_SOURCE.pivot);
  assert.ok(Math.abs(g.pivot.x - pivot.x) < 1e-9, `${w}×${h} pivot x`);
  assert.ok(Math.abs(g.pivot.y - pivot.y) < 1e-9, `${w}×${h} pivot y`);
  for (const room of ROOMS) {
    const target = project(w, h, ORBIT_TARGETS[room]);
    assert.ok(Math.abs(g.targets[room].x - target.x) < 1e-9, `${room} x`);
    assert.ok(Math.abs(g.targets[room].y - target.y) < 1e-9, `${room} y`);
  }
  const { originX, originY } = measureAtrium(w, h);
  let maxX = 0,
    maxY = 0,
    maxScale = 1;
  for (const o of SAMPLES) {
    const f = worldOrbitFrame(o, g, tier);
    assert.equal(f.pivotX, g.pivot.x);
    assert.equal(f.pivotY, g.pivot.y);
    assert.ok(f.cameraScale >= 1, 'never below the overview');
    assert.ok(f.cameraScale <= 1 + ORBIT.scale + 1e-12);
    assert.ok(Math.abs(f.cameraRoll) <= 0.35, 'roll bounded');
    if (tier === 'mobile') assert.equal(f.cameraRoll, 0, 'no roll on phones');
    // No plate edge: the scaled, translated viewport-sized plate covers it.
    const s = f.cameraScale;
    const edge = {
      left: f.pivotX * (1 - s) + f.cameraX,
      right: f.pivotX + s * (w - f.pivotX) + f.cameraX,
      top: f.pivotY * (1 - s) + f.cameraY,
      bottom: f.pivotY + s * (h - f.pivotY) + f.cameraY,
    };
    assert.ok(edge.left <= 1e-9 && edge.top <= 1e-9, `${w}×${h} ${o} edge`);
    assert.ok(edge.right >= w - 1e-9 && edge.bottom >= h - 1e-9);
    // The written pose (about the arrival's origin) is the same transform.
    const pose = orbitPose(f, originX, originY);
    for (const [px, py] of [
      [0, 0],
      [w, h],
      [f.pivotX, f.pivotY],
    ]) {
      const a = [
        originX + s * (px - originX) + pose.x,
        originY + s * (py - originY) + pose.y,
      ];
      const b = [
        f.pivotX + s * (px - f.pivotX) + f.cameraX,
        f.pivotY + s * (py - f.pivotY) + f.cameraY,
      ];
      assert.ok(Math.hypot(a[0] - b[0], a[1] - b[1]) < 1e-6);
    }
    // About the pivot, the projected pivot drifts by exactly the pan.
    maxX = Math.max(maxX, Math.abs(f.cameraX));
    maxY = Math.max(maxY, Math.abs(f.cameraY));
    maxScale = Math.max(maxScale, s);
  }
  drift[`${w}×${h}`] = {
    tier,
    x: maxX / w,
    y: maxY / h,
    scale: maxScale,
  };
  // Doorways lean the right way: left rooms pan right, right rooms pan left.
  const x = ROOMS.map((room) => roomPose(room, g, tier).x);
  assert.ok(x[0] > x[1] && x[1] > 0 && 0 > x[2] && x[2] > x[3], `${w}×${h}`);
  // No vertical bounce between rooms.
  const y = ROOMS.map((room) => roomPose(room, g, tier).y);
  assert.ok(Math.max(...y) - Math.min(...y) <= 0.005 * h, 'no vertical bounce');
}
assert.ok(ORBIT.scale <= 0.04, 'DS §8: ≤4% scale on a full-bleed plane');
assert.ok(ORBIT.roll === 0 || Math.abs(ORBIT.roll) <= 0.35);
for (const [w, h] of DESKTOP) {
  const d = drift[`${w}×${h}`];
  assert.ok(d.x <= 0.025, `${w}×${h} pivot drift ${d.x} ≤ 2.5vw`);
  assert.ok(d.y <= 0.02, `${w}×${h} pivot drift ${d.y} ≤ 2vh`);
  assert.ok(Math.abs(d.scale - 1.04) < 1e-9, 'desktop room focus is 1.04');
}
// Amplitude by tier, measured on the room poses themselves.
{
  const lean = (w, h) => {
    const tier = orbitTier(w, h, false);
    const g = measureOrbit(w, h);
    const pose = roomPose('living', g, tier);
    return { scale: pose.scale - 1, x: pose.x / w };
  };
  const desktop = lean(1440, 900);
  const tablet = lean(1180, 820);
  const portrait = lean(820, 1180);
  const mobile = lean(390, 844);
  const landscape = lean(844, 390);
  for (const t of [tablet, portrait]) {
    assert.ok(
      t.scale >= 0.6 * desktop.scale && t.scale <= 0.75 * desktop.scale,
    );
  }
  assert.ok(mobile.scale <= 0.55 * desktop.scale, 'phones: half amplitude');
  assert.ok(mobile.scale >= 0.4 * desktop.scale);
  assert.ok(Math.abs(mobile.x) <= 0.6 * Math.abs(desktop.x));
  assert.ok(landscape.scale <= tablet.scale, 'short landscape stays light');
  assert.ok(Math.abs(landscape.x) <= 0.02);
}
// No fake cutout: one plate, no mask or clip-path in the orbit layer.
assert.equal(chapterSource.match(/asset="worlds-atrium"/g).length, 1);
const orbitCss = chapterCss.slice(chapterCss.indexOf('TP3D PASS 16'));
assert.doesNotMatch(orbitCss, /mask|clip-path|filter|blur|rotate/);
assert.doesNotMatch(timelineSource, /rotate\(|perspective\(/);

// ---------------------------------------------------------------------------
// 36–42. Copy, caption, labels and the gateway.
// ---------------------------------------------------------------------------
assert.match(
  chapterSource,
  /<h2 id="home-worlds-title">\s*<span data-chapter-reveal="5">Enter<\/span>\s*<br \/>\s*<em data-chapter-reveal="6">the worlds\.<\/em>\s*<\/h2>/,
);
assert.match(
  chapterSource,
  /<WorldGatewayLink className="hc-atrium-cta" data-chapter-reveal="9">[\s\S]*ENTER THE WORLD/,
);
assert.match(
  chapterSource,
  /<div className="hc-orbit-caption" aria-hidden="true">\s*\{ORBIT_ROOMS\.map\(/,
  'one decorative caption region; links stay the semantic source',
);
assert.match(chapterSource, /href=\{room\.href\}\s*prefetch=\{false\}/);
assert.match(chapterSource, /data-room=\{room\.id\}/);
for (const room of ROOMS)
  assert.match(
    chapterCss,
    new RegExp(
      `\\.hc-worlds\\[data-orbit-room='${room}'\\] \\[data-orbit-caption='${room}'\\]`,
    ),
  );
assert.equal(
  chapterCss.match(/\[data-orbit-room='(\w+)'\] \[data-orbit-caption='\1'\]/g)
    .length,
  4,
  'each caption is shown only by its own room',
);
assert.doesNotMatch(
  chapterCss,
  /\[data-orbit-room='(\w+)'\] \[data-orbit-caption='(?!\1)\w+'\]/,
);
assert.match(chapterCss, /\.hc-orbit-caption \{[^}]*pointer-events: none;/);
assert.match(
  chapterCss,
  /\.hc-worlds\[data-orbit-room\] \.hc-atrium-room-link:focus-visible \{\s*--room-orbit-opacity: 1 !important;/,
  'keyboard focus outranks the scroll-owned dimming',
);
assert.match(
  chapterCss,
  /\.hc-worlds\[data-orbit-room\] \.hc-atrium-cta:focus-visible \{\s*opacity: 1 !important;/,
);
// Scroll-owned values are never smoothed by a time-based transition.
assert.match(
  chapterCss,
  /\.hc-worlds:not\(\[data-world-interactive\]\)\s*:is\([^)]*\.hc-atrium-room-link > span,\s*\.hc-atrium-room-link > small/,
);
for (const banned of [
  /\.click\(\)/,
  /enterWorld|location\.(assign|href|replace)|history\.push|router/,
  /preventDefault|scrollTo|scrollBy|scrollIntoView/,
])
  for (const [name, text] of [
    ['timeline', timelineSource],
    ['orbit', orbitSource],
    ['discovery', discoverySource],
  ])
    assert.doesNotMatch(text, banned, `${name}: ${banned}`);

// ---------------------------------------------------------------------------
// The real timeline through the orbit: room, caption, labels, copy, gateway,
// header, discovery ownership, determinism, rest.
// ---------------------------------------------------------------------------
const fixed = (n, digits) => n.toFixed(digits);
const cameraString = (pose) =>
  pose.x === 0 && pose.y === 0 && pose.scale === 1
    ? 'none'
    : `translate3d(${fixed(pose.x, 3)}px, ${fixed(pose.y, 3)}px, 0) scale(${fixed(pose.scale, 7)})`;
function expectFrame(h, o) {
  const [w, vh] = h.viewport();
  const tier = orbitTier(w, vh, false);
  const f = worldOrbitFrame(o, measureOrbit(w, vh), tier);
  const { originX, originY } = measureAtrium(w, vh);
  const pose =
    o > 0 ? orbitPose(f, originX, originY) : { x: 0, y: 0, scale: 1 };
  assert.equal(h.worlds.getAttribute('data-orbit-room'), f.activeRoom);
  assert.equal(h.worlds.getAttribute('data-world-orbit'), f.phase);
  assert.equal(
    h.camera.style.getPropertyValue('transform'),
    cameraString(pose),
  );
  assert.equal(h.camera.style.getPropertyValue('will-change'), 'auto');
  assert.equal(
    h.caption.style.getPropertyValue('opacity'),
    fixed(f.focusCaptionOpacity, 5),
  );
  for (const link of h.links) {
    const room = link.getAttribute('data-room');
    assert.equal(
      link.style.getPropertyValue('--room-orbit-opacity'),
      fixed(f.labelOpacity[room], 5),
    );
    assert.equal(
      link.style.getPropertyValue('--room-orbit-focus'),
      fixed(f.labelEmphasis[room], 5),
    );
    assert.equal(link.getAttribute('inert'), null, 'links stay real');
  }
  assert.equal(
    h.gateway.style.getPropertyValue('opacity'),
    fixed(worldReveal(1, 9, false).opacity * f.gatewayOpacity, 5),
  );
  assert.equal(h.gateway.getAttribute('inert'), null, 'the gateway stays real');
  for (const [node, role] of [
    [h.reveals[0], 'eyebrow'],
    [h.reveals[1], 'title'],
    [h.reveals[3], 'body'],
    [h.reveals[4], 'signoff'],
  ])
    assert.equal(
      node.style.getPropertyValue('opacity'),
      fixed(f.copy[role], 5),
      role,
    );
  assert.equal(
    h.shades[0].style.getPropertyValue('opacity'),
    fixed(f.shadeLeft, 5),
  );
  assert.equal(
    h.discovery.updates.at(-1).orbit,
    f.activeRoom !== null,
    'scroll owns the room focus only while the orbit does',
  );
  // Desktop labels stay attached to the architecture; grouped labels don't.
  assert.equal(
    h.rooms.style.getPropertyValue('transform'),
    w >= 1200
      ? pose.scale === 1 && pose.x === 0 && pose.y === 0
        ? 'translateX(-50%)'
        : `translateX(-50%) translate3d(${fixed(pose.x, 3)}px, ${fixed(pose.y, 3)}px, 0) scale(${fixed(pose.scale, 7)})`
      : 'none',
  );
  return f;
}
const ORBIT_STOPS = steps(0, 1, 100);
for (const [width, height] of [
  [1440, 900],
  [1366, 768],
  [1180, 820],
  [820, 1180],
  [390, 844],
  [844, 390],
  [667, 375],
]) {
  const h = story({ width, height });
  h.settle();
  const at = (o) => Math.round(h.span() + o * h.orbitSpan());
  const exact = (o) => (at(o) - h.span()) / h.orbitSpan();
  h.scroll(h.span());
  const theme = h.header.dataset.chapterTheme;
  assert.equal(theme, 'dark', 'the header is ivory over the Atrium');
  const forward = ORBIT_STOPS.map((o) => {
    h.scroll(at(o));
    expectFrame(h, exact(o));
    assert.equal(h.header.dataset.chapterTheme, theme, 'no header flips');
    return json(h.trace());
  });
  const backward = [...ORBIT_STOPS].reverse().map((o) => {
    h.scroll(at(o));
    return json(h.trace());
  });
  assert.deepEqual(backward.reverse(), forward, 'reverse equals forward');
  // Fast scroll: a jump samples the destination, never a queue.
  const living = ORBIT_STOPS.indexOf(0.18),
    kitchen = ORBIT_STOPS.indexOf(0.66);
  h.scroll(at(0.18));
  h.scroll(at(0.66));
  assert.equal(json(h.trace()), forward[kitchen], 'Living → Kitchen jump');
  h.scroll(at(1));
  h.scroll(at(0.18));
  assert.equal(json(h.trace()), forward[living], 'gateway → Living jump');
  // Footer: once released, the header follows the existing footer rule.
  h.scroll(h.span() + h.orbitSpan() + height);
  assert.equal(h.header.dataset.chapterTheme, 'light', 'released to Footer');
  assert.equal(h.worlds.getAttribute('data-orbit-room'), null);
  h.dispose();
}

// Restoration inside the orbit paints the saved room first, never Living or
// the overview, and keeps the page hidden until the plate is decoded.
{
  const probe = story();
  probe.settle();
  const y = Math.round(probe.span() + 0.66 * probe.orbitSpan());
  probe.dispose();
  const h = story({ initialScroll: y, imageMode: 'async', restoring: true });
  h.settle();
  assert.equal(h.documentElement.getAttribute('data-home-restoring'), '');
  assert.ok(
    !h.log.some(
      ([node, name, value]) =>
        node === 'worlds' && name === 'data-orbit-room' && value,
    ),
    'no room is painted before the plate is ready',
  );
  h.readyImage();
  h.settle();
  const writes = h.log.filter(
    ([node, name]) =>
      (node === 'worlds' && name === 'data-orbit-room') ||
      (node === 'html' && name === 'data-home-restoring'),
  );
  same(writes.at(-1), ['html', 'data-home-restoring', null]);
  same(
    writes.filter(([, , value]) => value !== null).map(([, , value]) => value),
    ['', 'kitchen'],
    'Kitchen is the first room painted, before the page is revealed',
  );
  expectFrame(h, (y - h.span()) / h.orbitSpan());
  h.dispose();
}

// Resize and visibility resample the same native scroll, never a default.
{
  const h = story();
  h.settle();
  const y = Math.round(h.span() + 0.34 * h.orbitSpan());
  h.scroll(y);
  assert.equal(h.worlds.getAttribute('data-orbit-room'), 'bedroom');
  const o = (y - h.span()) / h.orbitSpan();
  // Width-only resize: same svh spans, same progress, same room.
  h.resize(1280, 900);
  assert.equal(h.worlds.getAttribute('data-orbit-room'), 'bedroom');
  expectFrame(h, o);
  // Any resize equals a fresh load at that native scroll position.
  h.resize(1366, 768);
  const fresh = story({ width: 1366, height: 768, initialScroll: y });
  fresh.settle();
  assert.equal(json(h.trace()), json(fresh.trace()), 'resize = fresh sample');
  fresh.dispose();
  // Hidden tab: no frame, no promotion; scroll while hidden does no work.
  h.document.hidden = true;
  h.document.emit('visibilitychange');
  assert.equal(h.frames.size, 0);
  assert.equal(h.camera.style.getPropertyValue('will-change'), 'auto');
  assert.equal(h.discovery.suspended, 1);
  const calls = h.rafCalls();
  h.window.scrollY = Math.round(h.span() + 0.5 * h.orbitSpan());
  h.window.emit('scroll');
  assert.equal(h.rafCalls(), calls, 'no background orbit work');
  h.document.hidden = false;
  h.document.emit('visibilitychange');
  h.settle();
  assert.equal(h.worlds.getAttribute('data-orbit-room'), 'bathroom');
  expectFrame(h, (h.window.scrollY - h.span()) / h.orbitSpan());
  // Reduced motion switched on mid-orbit: the spacer goes, nothing moves.
  h.setReduced(true);
  assert.equal(h.orbitSpan(), 0);
  assert.equal(h.worlds.getAttribute('data-world-orbit'), null);
  assert.equal(h.worlds.getAttribute('data-orbit-room'), null);
  assert.equal(h.camera.style.getPropertyValue('transform'), 'none');
  h.dispose();
}

// Reduced motion: no orbit span, no orbit state, the static overview.
{
  for (const tall of [false, true]) {
    // `tall` simulates a stale orbit spacer: the frame still never moves.
    const h = story({ reduced: true, orbit: tall });
    h.settle();
    if (!tall) assert.equal(h.orbitSpan(), 0, 'no extended orbit journey');
    for (const y of steps(0, h.span() + h.orbitSpan(), 60).map(Math.round)) {
      h.scroll(y);
      assert.equal(h.worlds.getAttribute('data-world-orbit'), null);
      assert.equal(h.worlds.getAttribute('data-orbit-room'), null);
      assert.equal(h.caption.style.getPropertyValue('opacity'), '0.00000');
      assert.equal(h.discovery.updates.at(-1).orbit, false);
    }
    assert.equal(h.camera.style.getPropertyValue('transform'), 'none');
    h.dispose();
  }
}

// ---------------------------------------------------------------------------
// 49–58. Runtime ownership.
// ---------------------------------------------------------------------------
{
  const h = story();
  h.settle();
  assert.equal(h.frames.size, 0, '0 RAF at rest');
  assert.equal(h.window.listeners.get('scroll').size, 1, 'one scroll owner');
  assert.equal(h.observers.length, 1, 'one geometry observer');
  h.scroll(Math.round(h.span() + 0.3 * h.orbitSpan()));
  assert.equal(h.frames.size, 0, '0 RAF after the orbit settles');
  // Scrolling requests the existing frame, at most one at a time.
  h.window.scrollY += 40;
  h.window.emit('scroll');
  h.window.emit('scroll');
  assert.equal(h.frames.size, 1);
  h.settle();
  h.dispose();
  assert.equal(h.listenerCount(), 0, 'every listener is removed');
  assert.ok(h.observers.every((o) => o.disconnected));
  assert.equal(h.worlds.getAttribute('data-orbit-room'), null);
  assert.equal(h.worlds.getAttribute('data-world-orbit'), null);
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
  assert.equal(count(/setInterval|setTimeout\(/g), 0, 'no timers');
  assert.equal(count(/<canvas|getContext\(|from 'three'|import\('three'/g), 0);
  assert.equal(
    count(
      /gsap|ScrollTrigger|lenis|framer-motion|from 'motion'|scroll-timeline|animation-timeline/gi,
    ),
    0,
  );
  assert.equal(count(/fetch\(|XMLHttpRequest|new Image\(/g), 0);
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
      './worlds-orbit-frame',
    ],
    'the timeline gains only the pure orbit frame',
  );
  assert.doesNotMatch(timelineSource, /useState|setState/);
  // No React state on scroll: the chapter stays a server component.
  assert.doesNotMatch(chapterSource, /'use client'|useState|useEffect/);
}

// ---------------------------------------------------------------------------
// 43–48. RoomDiscovery: works in the overview, yields to the orbit, returns.
// ---------------------------------------------------------------------------
{
  class Element {
    attrs = new Map();
    listeners = new Map();
    dataset = {};
    focus = false;
    hover = false;
    getAttribute(n) {
      return this.attrs.get(n) ?? null;
    }
    setAttribute(n, v) {
      this.attrs.set(n, v);
    }
    removeAttribute(n) {
      this.attrs.delete(n);
    }
    addEventListener(n, f) {
      if (!this.listeners.has(n)) this.listeners.set(n, new Set());
      this.listeners.get(n).add(f);
    }
    removeEventListener(n, f) {
      this.listeners.get(n)?.delete(f);
    }
    emit(n, e = {}) {
      for (const f of this.listeners.get(n) ?? []) f(e);
    }
    closest() {
      return this.dataset.room ? this : null;
    }
    matches(q) {
      return q === ':focus-visible' ? this.focus : this.hover;
    }
  }
  const worlds = new Element();
  const links = ROOMS.map((room) =>
    Object.assign(new Element(), { dataset: { room } }),
  );
  const previews = links.map((link) =>
    Object.assign(new Element(), {
      dataset: { roomPreview: link.dataset.room },
    }),
  );
  worlds.querySelectorAll = (q) => (q === '[data-room]' ? links : previews);
  worlds.querySelector = () => new Element();
  const fine = Object.assign(new Element(), { matches: true });
  const loaded = { exports: {} };
  runInNewContext(transpile(discoverySource), {
    module: loaded,
    exports: loaded.exports,
    Element,
    window: { matchMedia: () => fine },
    require(spec) {
      if (spec === './home-production') return loadStoryMath('home-production');
      assert.equal(spec, './scene-image');
      return {
        prepareSceneImage: (image, callbacks) => ({
          start: () => callbacks.ready(),
          destroy() {},
        }),
      };
    },
  });
  const discovery = loaded.exports.createRoomDiscovery(worlds);
  const update = (orbit) =>
    discovery.update({
      progress: 1,
      width: 1440,
      reduced: false,
      visible: true,
      orbit,
    });
  const hover = (i, pointerType = 'mouse') =>
    worlds.emit('pointerover', { target: links[i], pointerType });
  // The settled overview: PASS 05 discovery as approved.
  update(false);
  assert.equal(worlds.getAttribute('data-world-interactive'), '');
  hover(1);
  assert.equal(worlds.getAttribute('data-active-room'), 'bedroom');
  // Orbit: decorative hover and focus previews yield to scroll.
  links[1].hover = true;
  update(true);
  assert.equal(worlds.getAttribute('data-world-interactive'), null);
  assert.equal(worlds.getAttribute('data-active-room'), null);
  hover(3);
  assert.equal(worlds.getAttribute('data-active-room'), null, 'no fight');
  links[0].focus = true;
  worlds.emit('focusin', { target: links[0] });
  assert.equal(worlds.getAttribute('data-active-room'), null);
  for (const node of [worlds, ...links])
    for (const name of ['inert', 'tabindex', 'aria-hidden', 'aria-disabled'])
      assert.equal(node.getAttribute(name), null, 'keyboard focus stays valid');
  // Final overview: discovery returns, picking up the live hover/focus.
  links[0].focus = false;
  update(false);
  assert.equal(worlds.getAttribute('data-world-interactive'), '');
  assert.equal(worlds.getAttribute('data-active-room'), 'bedroom');
  // Touch is unchanged: a touch pointer never drives a preview.
  links[1].hover = false;
  worlds.emit('pointerout', {
    target: links[1],
    relatedTarget: null,
    pointerType: 'mouse',
  });
  hover(2, 'touch');
  assert.equal(worlds.getAttribute('data-active-room'), null);
  discovery.destroy();
}

// ---------------------------------------------------------------------------
// 65–80. Everything PASS 16 must not touch is byte-identical to PASS 15
// (d1a6a78): Intro, Arrival, Perspective, Breeze, Atmosphere renderer and
// shaders, the bridge frames, header, footer, gateway, portal, /world and
// its five rooms. Line endings are normalised (core.autocrlf).
// ---------------------------------------------------------------------------
{
  const PASS16 = new Set(
    [
      'home-story-timeline.ts',
      'home-story.css',
      'home-story.tsx',
      'room-discovery.ts',
      'worlds-chapter.css',
      'worlds-chapter.tsx',
      'worlds-orbit-frame.ts',
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
  const protectedFiles = [
    ...walk('components/home/'),
    ...walk('components/world/'),
    ...walk('components/layout/'),
    ...walk('app/world/'),
    'app/page.tsx',
    'data/home-chapters.ts',
    'data/world-building.ts',
  ].filter((path) => !PASS16.has(path));
  const files = protectedFiles.map((path) => [
    path,
    createHash('sha256')
      .update(read(path).replaceAll('\r\n', '\n'))
      .digest('hex')
      .slice(0, 12),
  ]);
  assert.equal(
    digest(files),
    'd8922fdb98a3c952',
    'files outside PASS 16 are unchanged from PASS 15',
  );
}

const desktopDrift = drift['1440×900'];
console.log(
  `Worlds orbit passed: base journey = PASS 15 (${PASS15_BASE_DIGEST}), ` +
    `orbit ${storyGeometry.orbit.desktop}/${storyGeometry.orbit.tablet}/` +
    `${storyGeometry.orbit.mobile}/${storyGeometry.orbit.landscape}svh, ` +
    `rooms ${ROOMS.join(' → ')} → overview, scale ≤ ${1 + ORBIT.scale}, ` +
    `pivot drift ${(desktopDrift.x * 100).toFixed(2)}vw/` +
    `${(desktopDrift.y * 100).toFixed(2)}vh at 1440×900, deterministic both ` +
    `ways, discovery yields to scroll, one owner, 0 RAF at rest.`,
);
