/** Native chapter geometry and lifecycle regression checks. Browser doubles
 * verify owned work; these are not browser RAM, GPU or frame-rate measurements. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const filename = new URL(
  '../components/home/experience/chapter-motion.ts',
  import.meta.url,
);
const { outputText } = ts.transpileModule(readFileSync(filename, 'utf8'), {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.CommonJS,
  },
});

function browser({
  reduced = false,
  compact = false,
  materialGroups = false,
} = {}) {
  let sequence = 0;
  let reads = 0;
  let writes = 0;
  const operations = [];
  const frames = new Map();
  const events = [];
  const intersections = [];
  const resizes = [];
  class Events {
    listeners = new Map();
    constructor() {
      events.push(this);
    }
    addEventListener(name, callback) {
      if (!this.listeners.has(name)) this.listeners.set(name, new Set());
      this.listeners.get(name).add(callback);
    }
    removeEventListener(name, callback) {
      this.listeners.get(name)?.delete(callback);
    }
    emit(name, value = {}) {
      for (const callback of this.listeners.get(name) ?? []) callback(value);
    }
  }
  class Style {
    values = new Map();
    priorities = new Map();
    setProperty(key, value, priority = '') {
      writes++;
      operations.push('write');
      this.values.set(key, value);
      this.priorities.set(key, priority);
    }
    getPropertyValue(key) {
      return this.values.get(key) ?? '';
    }
    getPropertyPriority(key) {
      return this.priorities.get(key) ?? '';
    }
    removeProperty(key) {
      writes++;
      operations.push('write');
      this.values.delete(key);
      this.priorities.delete(key);
    }
    set transform(value) {
      this.setProperty('transform', value);
    }
    get transform() {
      return this.getPropertyValue('transform');
    }
    set opacity(value) {
      this.setProperty('opacity', value);
    }
    get opacity() {
      return this.getPropertyValue('opacity');
    }
  }
  class Node {
    dataset = {};
    style = new Style();
    selectors = new Map();
    top = 0;
    height = 1000;
    querySelectorAll(selector) {
      return this.selectors.get(selector) ?? [];
    }
    getBoundingClientRect() {
      reads++;
      operations.push('read');
      return {
        top: this.top - window.scrollY,
        bottom: this.top - window.scrollY + this.height,
        height: this.height,
        width: 1440,
        left: 0,
      };
    }
  }
  const window = Object.assign(new Events(), { scrollY: 0, innerHeight: 900 });
  const document = Object.assign(new Events(), { hidden: false });
  const root = new Node();
  const header = new Node();
  header.height = 80;
  header.dataset.opening = 'story';
  document.querySelector = () => header;
  const media = new Map([
    [
      '(prefers-reduced-motion: reduce)',
      Object.assign(new Events(), { matches: reduced }),
    ],
    ['(max-width: 767px)', Object.assign(new Events(), { matches: compact })],
  ]);
  window.matchMedia = (query) => media.get(query);
  const chapters = ['worlds', 'spaces', 'materials'].map((name, index) => {
    const node = new Node();
    node.dataset.homeChapter = name;
    node.top = 3000 + index * 880;
    const layers = ['background', 'foreground', 'breeze', 'copy'].flatMap(
      (depth) => {
        if (name === 'materials' && depth === 'foreground' && materialGroups) {
          return ['rear', 'mid', 'stone', 'ceramic', 'textile', 'metal'].map(
            (materialDepth, order) => {
              const group = new Node();
              group.dataset.chapterDepth = depth;
              group.dataset.materialDepth = materialDepth;
              group.dataset.materialOrder = String(order);
              return group;
            },
          );
        }
        const layer = new Node();
        layer.dataset.chapterDepth = depth;
        return layer;
      },
    );
    const reveal = new Node();
    const callouts =
      name === 'materials'
        ? Array.from({ length: 5 }, (_, ordinal) => {
            const callout = new Node();
            callout.dataset.calloutIndex = String(ordinal);
            return callout;
          })
        : [];
    node.selectors.set('[data-chapter-depth]', layers);
    node.selectors.set('[data-chapter-reveal]', [reveal]);
    node.selectors.set('[data-callout-index]', callouts);
    return { node, layers, reveal, callouts };
  });
  root.selectors.set(
    '[data-home-chapter]',
    chapters.map((chapter) => chapter.node),
  );
  class IntersectionObserver {
    disconnected = false;
    constructor(callback, options) {
      this.callback = callback;
      this.options = options;
      intersections.push(this);
    }
    observe() {}
    disconnect() {
      this.disconnected = true;
    }
    emit(entries) {
      if (!this.disconnected) this.callback(entries);
    }
  }
  class ResizeObserver {
    disconnected = false;
    constructor(callback) {
      this.callback = callback;
      resizes.push(this);
    }
    observe() {}
    disconnect() {
      this.disconnected = true;
    }
    emit() {
      if (!this.disconnected) this.callback();
    }
  }
  const loaded = { exports: {} };
  runInNewContext(
    outputText,
    {
      module: loaded,
      exports: loaded.exports,
      window,
      document,
      IntersectionObserver,
      ResizeObserver,
      requestAnimationFrame: (callback) => {
        const id = ++sequence;
        frames.set(id, callback);
        return id;
      },
      cancelAnimationFrame: (id) => frames.delete(id),
    },
    { filename: filename.pathname },
  );
  const flush = () => {
    const pending = [...frames.values()];
    frames.clear();
    pending.forEach((callback) => callback());
  };
  const scroll = (position) => {
    window.scrollY = position;
    window.emit('scroll');
  };
  const counts = () => ({
    frames: frames.size,
    listeners: events.reduce(
      (sum, target) =>
        sum +
        [...target.listeners.values()].reduce(
          (total, set) => total + set.size,
          0,
        ),
      0,
    ),
    intersections: intersections.filter((observer) => !observer.disconnected)
      .length,
    resizes: resizes.filter((observer) => !observer.disconnected).length,
    reads,
    writes,
  });
  return {
    ...loaded.exports,
    root,
    header,
    chapters,
    window,
    document,
    media,
    intersections,
    resizes,
    frames,
    operations,
    flush,
    scroll,
    counts,
  };
}

const fixture = browser();
const { chapterFrame, chapterHeaderTheme } = fixture;
for (const viewport of [812, 900, 1440]) {
  const geometry = { top: 3000, height: viewport * 1.12 };
  assert.equal(chapterFrame(geometry, 3000 - viewport, viewport, 80).entry, 0);
  assert.equal(
    chapterFrame(geometry, 3000 - viewport * 0.65 + 0.01, viewport, 80).entry,
    1,
  );
  assert.equal(chapterFrame(geometry, 3000, viewport, 80).phase, 'active');
  assert.equal(
    chapterFrame(geometry, 3000 + geometry.height + 0.01, viewport, 80).phase,
    'far',
  );
  assert.equal(
    chapterFrame(geometry, 3000 + geometry.height - viewport, viewport, 80)
      .exit,
    0,
  );
  assert.equal(
    chapterFrame(
      geometry,
      3000 + geometry.height - viewport * 0.45 + 0.01,
      viewport,
      80,
    ).exit,
    1,
  );
  const checkpoints = Array.from(
    { length: 25 },
    (_, index) => 2000 + index * 120,
  );
  const forward = checkpoints.map((position) =>
    chapterFrame(geometry, position, viewport, 80),
  );
  const backward = checkpoints
    .toReversed()
    .map((position) => chapterFrame(geometry, position, viewport, 80))
    .reverse();
  assert.equal(
    JSON.stringify(forward),
    JSON.stringify(backward),
    'native progress is exactly reversible',
  );
}
const geometry = fixture.chapters.map(({ node }) => ({
  name: node.dataset.homeChapter,
  geometry: { top: node.top, height: node.height },
}));
assert.equal(
  chapterHeaderTheme(geometry, 2991, 80, 900),
  null,
  'keep opening ink through the first 8vh blend',
);
assert.equal(chapterHeaderTheme(geometry, 2992, 80, 900), 'dark');
assert.equal(
  chapterHeaderTheme(geometry, 3872, 80, 900),
  'light',
  'later overlapping light chapter wins',
);
assert.equal(chapterHeaderTheme(geometry, 5800, 80, 900), null);
const destroy = fixture.mountHomeChapters(fixture.root);
assert.equal(fixture.counts().frames, 0, 'mount has no perpetual frame');
assert.equal(fixture.header.dataset.chapterTheme, undefined);
assert.equal(
  fixture.header.dataset.opening,
  'story',
  'opening owns its separate theme state',
);
const firstReads = fixture.counts().reads;
fixture.scroll(2400);
fixture.scroll(2450);
fixture.scroll(2500);
assert.equal(
  fixture.counts().frames,
  1,
  'scroll inputs share one queued frame',
);
const writesBefore = fixture.counts().writes;
fixture.scroll(2501);
assert.equal(
  fixture.counts().writes,
  writesBefore,
  'scroll handlers do not write styles',
);
fixture.flush();
assert.equal(
  fixture.counts().reads,
  firstReads,
  'scroll uses cached geometry without layout reads',
);
assert.equal(
  fixture.chapters[0].reveal.style.opacity,
  '1.0000',
  'copy settles before the chapter reaches the header',
);
assert.equal(
  fixture.chapters[0].layers[2].style.opacity,
  '',
  'scroll depth preserves the breeze translucency authored in CSS',
);
assert.equal(
  fixture.chapters[0].layers[3].style.opacity,
  '',
  'copy depth does not override unrelated CSS opacity',
);
const firstPose = fixture.chapters[0].layers[0].style.transform;
fixture.scroll(3200);
fixture.flush();
assert.equal(fixture.header.dataset.chapterTheme, 'dark');
fixture.scroll(2501);
fixture.flush();
assert.equal(
  fixture.chapters[0].layers[0].style.transform,
  firstPose,
  'reverse scroll restores the same pose',
);
fixture.scroll(4000);
fixture.flush();
assert.equal(fixture.header.dataset.chapterTheme, 'light');
fixture.scroll(4100);
fixture.flush();
const calls = fixture.chapters[2].callouts.map((node) =>
  Number(node.style.opacity),
);
assert.ok(
  calls.every((opacity, index) => !index || calls[index - 1] >= opacity),
  'callouts stagger by scroll distance',
);
fixture.scroll(4760);
fixture.flush();
assert.ok(
  fixture.chapters[2].callouts.every(
    (node) =>
      node.style.opacity === '1.0000' &&
      node.style.getPropertyValue('--callout-reveal') === '1.0000',
  ),
  'material labels and leader lines finish revealing',
);
assert.equal(
  fixture.chapters[2].layers[1].style.transform,
  'translate3d(0, 0.00px, 0) scale(1.0000)',
  'material objects settle without floating',
);
fixture.scroll(5200);
fixture.flush();
assert.equal(
  fixture.chapters[2].layers[1].style.transform,
  'translate3d(0, 0.00px, 0) scale(1.0000)',
);
fixture.scroll(6500);
assert.equal(
  fixture.counts().frames,
  1,
  'departing chapters get one cleanup frame',
);
fixture.flush();
assert.equal(
  fixture.header.dataset.chapterTheme,
  undefined,
  'footer restores shared header behavior',
);
assert.ok(
  fixture.chapters.every(({ layers }) =>
    layers.every((node) => node.style.transform === ''),
  ),
  'far layers release their transforms',
);
fixture.scroll(6600);
fixture.scroll(6700);
assert.equal(
  fixture.counts().frames,
  0,
  'far-away scroll does not schedule animation work',
);
fixture.scroll(3100);
fixture.flush();
fixture.operations.length = 0;
fixture.window.innerHeight = 1024;
fixture.window.emit('resize');
fixture.resizes[0].emit();
assert.equal(
  fixture.counts().frames,
  1,
  'window and observed resizes coalesce',
);
fixture.flush();
const firstWrite = fixture.operations.indexOf('write');
assert.ok(
  firstWrite >= 0 && !fixture.operations.slice(firstWrite).includes('read'),
  'resize completes all layout reads before writes',
);
assert.equal(
  fixture.counts().intersections,
  1,
  'resizing replaces rather than stacks IO',
);
fixture.media.get('(prefers-reduced-motion: reduce)').matches = true;
fixture.media.get('(prefers-reduced-motion: reduce)').emit('change');
fixture.flush();
assert.ok(
  fixture.chapters.every(({ layers, reveal, callouts }) =>
    [...layers, reveal, ...callouts].every(
      (node) => !node.style.transform && !node.style.opacity,
    ),
  ),
  'reduced motion exposes the static CSS composition',
);
assert.equal(
  fixture.header.dataset.chapterTheme,
  'dark',
  'static scenes still choose readable header ink',
);
fixture.scroll(2920);
fixture.flush();
assert.equal(
  fixture.header.dataset.chapterTheme,
  undefined,
  'reduced motion keeps the shared overlap, so dark-scene ink waits for the blended background',
);
fixture.scroll(3003);
fixture.flush();
assert.equal(
  fixture.header.dataset.chapterTheme,
  'dark',
  'static composition changes ink once dark architecture has arrived',
);
const reducedWrites = fixture.counts().writes;
fixture.scroll(3004);
fixture.flush();
assert.equal(
  fixture.counts().writes,
  reducedWrites,
  'settled reduced-motion scroll does not repeatedly rewrite static chapter styles',
);
fixture.document.hidden = true;
fixture.document.emit('visibilitychange');
fixture.window.emit('resize');
fixture.scroll(5000);
assert.equal(fixture.counts().frames, 0, 'hidden pages cannot queue work');
fixture.document.hidden = false;
fixture.document.emit('visibilitychange');
fixture.flush();
assert.equal(fixture.header.dataset.chapterTheme, 'light');
destroy();
destroy();
assert.equal(
  fixture.counts().frames +
    fixture.counts().listeners +
    fixture.counts().intersections +
    fixture.counts().resizes,
  0,
  'all owned resources cleaned',
);
assert.equal(fixture.header.dataset.chapterTheme, undefined);
assert.equal(fixture.header.dataset.opening, 'story');
assert.ok(
  fixture.chapters.every(
    ({ node }) =>
      node.dataset.phase === undefined && node.dataset.progress === undefined,
  ),
);

for (let cycle = 0; cycle < 30; cycle++) {
  const repeated = browser({
    reduced: cycle % 2 === 0,
    compact: cycle % 3 === 0,
  });
  repeated.chapters[0].layers[0].style.setProperty(
    'opacity',
    '.91',
    'important',
  );
  const cleanup = repeated.mountHomeChapters(repeated.root);
  for (const position of [0, 2400, 3200, 3900, 4760, 6000, 4760, 3000, 0]) {
    repeated.scroll(position);
    repeated.flush();
  }
  repeated.window.emit('resize');
  cleanup();
  assert.equal(
    repeated.counts().frames +
      repeated.counts().listeners +
      repeated.counts().intersections +
      repeated.counts().resizes,
    0,
    `cycle ${cycle} has no orphan resources`,
  );
  assert.equal(
    repeated.chapters[0].layers[0].style.opacity,
    '.91',
    'cleanup restores pre-existing inline styles',
  );
  assert.equal(
    repeated.chapters[0].layers[0].style.getPropertyPriority('opacity'),
    'important',
  );
}
for (const compact of [false, true]) {
  const grouped = browser({ compact, materialGroups: true });
  const cleanup = grouped.mountHomeChapters(grouped.root);
  const groups = grouped.chapters[2].layers.filter(
    (node) => node.dataset.materialDepth,
  );
  assert.equal(groups.length, 6);
  grouped.scroll(4049);
  grouped.flush();
  const opacities = groups.map((node) => Number(node.style.opacity));
  assert.ok(
    opacities[0] > opacities[5],
    'six material cut-outs have a scroll-distance entrance stagger',
  );
  assert.ok(
    opacities.every(
      (opacity, index) =>
        opacity > 0 &&
        opacity < 1 &&
        (!index || opacity <= opacities[index - 1]),
    ),
  );
  for (const position of [4176, 4760, 5200, 5740]) {
    grouped.scroll(position);
    grouped.flush();
    for (const node of groups) {
      assert.equal(
        node.style.opacity,
        '1.0000',
        'all cut-outs finish revealing before section top reaches the header',
      );
      assert.match(
        node.style.transform,
        /scale\(1\.0000\)/,
        'entry scale settles at 1',
      );
      const displacement = Number(
        node.style.transform.match(/translate3d\(0, ([-\d.]+)px/)[1],
      );
      assert.ok(
        Math.abs(displacement) <= 6 * (compact ? 0.4 : 1) + 0.01,
        'settled depth stays within the 6px desktop / 2.4px compact budget',
      );
    }
  }
  const positions = [4049, 4176, 4800, 5200, 5740];
  const sample = (position) => {
    grouped.scroll(position);
    grouped.flush();
    return groups.map((node) => [node.style.transform, node.style.opacity]);
  };
  const forward = positions.map(sample);
  const backward = positions.toReversed().map(sample).reverse();
  assert.equal(
    JSON.stringify(forward),
    JSON.stringify(backward),
    'six depth groups are exactly reversible with native scroll',
  );
  assert.equal(
    grouped.counts().frames,
    0,
    'material groups never schedule an idle motion loop',
  );
  grouped.media.get('(prefers-reduced-motion: reduce)').matches = true;
  grouped.media.get('(prefers-reduced-motion: reduce)').emit('change');
  grouped.flush();
  assert.ok(
    groups.every((node) => !node.style.transform && !node.style.opacity),
    'reduced motion exposes the untransformed six-group composition',
  );
  cleanup();
  assert.ok(
    groups.every((node) => node.style.values.size === 0),
    'unmount removes all six cut-out poses',
  );
  assert.equal(
    grouped.counts().frames +
      grouped.counts().listeners +
      grouped.counts().intersections +
      grouped.counts().resizes,
    0,
  );
}
console.log(
  'Home chapters passed: reversible native geometry, early readable reveals, overlap-aware header thresholds, settled callouts, six material depth groups, cached reads, batched writes, far/hidden inactivity, reduced motion, resize and 30 cleanup lifecycles. No browser performance measurements are claimed.',
);
