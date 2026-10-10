/** TP3D PASS 14 — Room 04, Lab. The building directory (four open rooms),
 * the experiment registry and its engineering provenance, the real room and
 * the real Atmosphere island rendered to markup, the adapter run against the
 * production atmosphere, the island's lifecycle contract (explicit opt-in,
 * one instance, on-demand frames, full cleanup), Depth bounds, the Breeze and
 * Threshold references, the CSS, and locks on every production system the
 * Lab consumes and every room it must not change. Browser QA (the PASS 14
 * record) covers WebGL, canvases, requests and RAF at runtime. Numbers refer
 * to the PASS 14 brief. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { existsSync, readdirSync } from 'node:fs';
import {
  load,
  read,
  root,
  linkModule,
  nullComponent,
  render,
} from './lib/render-server-component.mjs';

const require = createRequire(import.meta.url);
const react = require('react');
const json = (path) => JSON.parse(read(path));
const byCodeUnit = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const digest = (path) =>
  createHash('sha256')
    .update(read(path).replace(/\r\n/g, '\n'))
    .digest('hex')
    .slice(0, 16);
/** Source without comments: what the code does, not what it documents. */
const code = (path) =>
  read(path)
    .replace(/\r\n/g, '\n')
    .replace(/\{\/\*[\s\S]*?\*\/\}|\/\*[\s\S]*?\*\/|^\s*\/\/[^\n]*/gm, '');
/** The body of `const name = (…) => { … }` or `async (…) => { … }`. */
const fn = (source, name) => {
  const start = source.search(
    new RegExp(`const ${name} = (?:async )?\\([^)]*\\)(?:: [^=]+)? => \\{`),
  );
  assert(start >= 0, `${name} is defined`);
  let depth = 0;
  for (let i = source.indexOf('{', start); i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}' && --depth === 0)
      return source.slice(start, i + 1);
  }
  throw new Error(`${name} is unterminated`);
};

// The real modules, wired the way the route wires them.
const building = load('data/world-building.ts');
const worldRooms = [...building.worldRooms];
const lab = load('data/world-lab.ts');
const experiments = [...lab.labExperiments];
const tokens = load('lib/motion/tokens.ts');
const capability = load('lib/motion/capability.ts', { './tokens': tokens });
const chromeFor = (buildingModule) =>
  load('components/world/world-chrome.tsx', {
    'next/link': linkModule,
    '@/data/world-building': buildingModule,
    './world-map-disclosure': load(
      'components/world/world-map-disclosure.tsx',
      {
        react,
        './world-map-escape': load('components/world/world-map-escape.ts'),
      },
    ),
  });
const breezeGeometry = load('components/home/experience/breeze-geometry.ts');
const portal = load('components/world/world-portal.ts', {
  '@/lib/motion/tokens': tokens,
  '@/data/world-building': building,
});
// The real island, rendered on the server path: the static study only.
const atmosphereIsland = load('components/world/lab-atmosphere-study.tsx', {
  react,
  '@/hooks/use-motion-capability': load('hooks/use-motion-capability.ts', {
    react,
    '@/lib/motion/capability': capability,
  }),
  '@/lib/motion/capability': capability,
});
const roomFor = (buildingModule = building) =>
  load('components/world/world-lab.tsx', {
    'next/link': linkModule,
    '@/data/world-lab': lab,
    '@/data/world-building': buildingModule,
    '@/components/home/experience/breeze-geometry': breezeGeometry,
    './world-portal': portal,
    './gallery-depth': { GalleryDepth: nullComponent },
    './lab-atmosphere-study': atmosphereIsland,
    './world-chrome': chromeFor(buildingModule),
  });
const html = render(roomFor().WorldLab);
// The production atmosphere and the adapter that hands it to the study.
const skyFrame = load('components/home/experience/atmospheric-sky-frame.ts');
const homeMotion = load('components/home/experience/home-motion.ts');
const bridgeFrame = load(
  'components/home/experience/atmospheric-bridge-frame.ts',
  {
    './home-motion': homeMotion,
  },
);
const skyRenderer = load(
  'components/home/experience/atmospheric-sky-renderer.ts',
  {
    './atmospheric-sky-frame': skyFrame,
    './atmospheric-sky-shaders': load(
      'components/home/experience/atmospheric-sky-shaders.ts',
    ),
  },
);
const adapter = load('components/world/lab-atmosphere-adapter.ts', {
  '@/components/home/experience/atmospheric-sky-renderer': skyRenderer,
  '@/components/home/experience/atmospheric-sky-frame': skyFrame,
  '@/components/home/experience/atmospheric-bridge-frame': bridgeFrame,
});
const css = read('components/world/world-lab.css');
// Declarations only: the stylesheet's comments may name what it refuses.
const cssCode = css.replace(/\/\*[\s\S]*?\*\//g, '');
const roomSource = read('components/world/world-lab.tsx');
const islandSource = read('components/world/lab-atmosphere-study.tsx');
const islandCode = code('components/world/lab-atmosphere-study.tsx');
const adapterSource = read('components/world/lab-atmosphere-adapter.ts');
const curationSource = read('data/world-lab.ts');
const LAB_FILES = [
  'app/world/lab/page.tsx',
  'components/world/world-lab.tsx',
  'components/world/world-lab.css',
  'components/world/lab-atmosphere-study.tsx',
  'components/world/lab-atmosphere-adapter.ts',
  'data/world-lab.ts',
];
// The building as it stood before this pass: only the Lab's entries may
// differ from it anywhere else in the World.
const beforeLab = {
  ...building,
  worldRooms: worldRooms.map((r) =>
    r.id === 'lab' ? { ...r, status: 'planned', href: null } : r,
  ),
};
const withoutLab = (markup) =>
  markup
    .replace(/<li\b[^>]*data-world-room="lab"[\s\S]*?<\/li>/g, '<li/>')
    .replace(/\d(?:<!-- -->)? of (?:<!-- -->)?\d/, 'n of m');
const articles = [
  ...html.matchAll(/<article\b([^>]*)>([\s\S]*?)<\/article>/g),
].map(([, tag, body]) => ({
  id: tag.match(/\bid="([^"]+)"/)?.[1],
  mode: tag.match(/data-mode="([^"]+)"/)?.[1],
  body,
}));
const IDS = ['atmosphere', 'breeze', 'depth', 'threshold'];

// 1–14. The route and the building directory.
{
  assert(existsSync(new URL('app/world/lab/page.tsx', root)), '1');
  const page = read('app/world/lab/page.tsx');
  assert.match(page, /absolute: 'Lab — TP3D'/);
  assert.match(
    page,
    /production experiments in atmosphere, movement, depth and spatial interaction/,
  );
  assert.doesNotMatch(page, /\b3D\b|three-dimensional/i, 'not all are 3D');
  assert.match(page, /<div data-world-page="lab">\s*<WorldLab \/>/);
  assert.equal(building.isWorldPath('/world/lab'), true, '2');
  const byId = Object.fromEntries(worldRooms.map((r) => [r.id, r]));
  assert.deepEqual(
    [byId.gallery.status, byId.gallery.href],
    ['available', '/world/gallery'],
    '3',
  );
  assert.deepEqual(
    [byId.objects.status, byId.objects.href],
    ['available', '/world/objects'],
    '4',
  );
  assert.deepEqual(
    [byId.archive.status, byId.archive.href],
    ['available', '/world/archive'],
    '5',
  );
  assert.equal(byId.lab.status, 'available', '6');
  assert.equal(byId.lab.href, '/world/lab', '7');
  // TP3D PASS 15 opened the Studio (check:studio covers it).
  assert.equal(byId.studio.status, 'available', '8');
  assert.equal(byId.studio.href, '/world/studio', '9');
  // Preserved identity.
  assert.deepEqual(
    [
      byId.lab.number,
      byId.lab.name,
      byId.lab.summary,
      byId.lab.type,
      byId.lab.futurePath,
    ],
    ['04', 'Lab', 'Spatial experiments', 'experiment', '/world/lab'],
  );
  assert.doesNotMatch(byId.lab.description, /\b3D\b/, 'truthful description');
  // 10. Room order 01–05.
  assert.deepEqual(
    worldRooms.map((r) => `${r.number} ${r.id}`),
    ['01 gallery', '02 objects', '03 archive', '04 lab', '05 studio'],
    '10',
  );
  // 11–12. The Lobby derives the Lab from the data, never hard-codes it.
  const lobbyFor = (buildingModule) =>
    render(
      load('components/world/world-lobby.tsx', {
        '@/data/home-chapter-assets.json': json(
          'data/home-chapter-assets.json',
        ),
        '@/data/world-building': buildingModule,
        './lobby-arrival': { LobbyArrival: nullComponent },
        './world-chrome': chromeFor(buildingModule),
      }).WorldLobby,
    );
  const lobby = lobbyFor(building);
  const lobbyBefore = lobbyFor(beforeLab);
  const rooms = lobby.match(/<nav class="wl-rooms"[\s\S]*?<\/nav>/)[0];
  assert.deepEqual(
    [
      ...rooms.matchAll(/<a href="(\/world\/[a-z]+)" class="wl-room-body">/g),
    ].map(([, h]) => h),
    [
      '/world/gallery',
      '/world/objects',
      '/world/archive',
      '/world/lab',
      '/world/studio',
    ],
    '11. five open rooms since TP3D PASS 15',
  );
  assert.match(
    lobbyBefore.match(
      /<nav class="wl-rooms"[\s\S]*?data-world-room="lab"[^>]*>([\s\S]*?)<\/li>/,
    )[1],
    /^<div class="wl-room-body">/,
    '11. from the data',
  );
  assert.doesNotMatch(
    read('components/world/world-lobby.tsx'),
    /\/world\/lab/,
    '11. not hard-coded',
  );
  assert.match(
    lobby,
    /5(?:<!-- -->)? of (?:<!-- -->)?5/,
    '12. 5 of 5 since TP3D PASS 15',
  );
  // 62 (PASS 13 numbering) / Lobby: only the Lab's entries and the count.
  assert.equal(withoutLab(lobby), withoutLab(lobbyBefore), 'Lobby');
  // 13. The World map: the open rooms, in order (all five since TP3D
  // PASS 15).
  const chrome = html.slice(0, html.indexOf('<main'));
  assert.deepEqual(
    [
      ...chrome.matchAll(/<a href="(\/world\/[a-z]+)" class="wl-map-entry"/g),
    ].map(([, h]) => h),
    [
      '/world/gallery',
      '/world/objects',
      '/world/archive',
      '/world/lab',
      '/world/studio',
    ],
    '13',
  );
  assert.doesNotMatch(chrome, /data-status="planned"/, '13. no planned wing');
  // 14. The Lab is current only in the Lab.
  const { WorldChrome } = chromeFor(building);
  for (const current of [
    undefined,
    'gallery',
    'objects',
    'archive',
    'lab',
    'studio',
  ]) {
    const markup = render(WorldChrome, { currentRoom: current });
    const labEntry = markup.match(
      /data-world-room="lab"[^>]*>([\s\S]*?)<\/li>/,
    )[1];
    assert.equal(
      /aria-current="page"/.test(labEntry),
      current === 'lab',
      `14. ${current}`,
    );
    assert.equal(
      (markup.match(/aria-current="page"/g) ?? []).length,
      current ? 1 : 0,
    );
  }
  assert.match(
    chrome,
    /<a href="\/world\/lab" class="wl-map-entry" aria-current="page">[\s\S]*?You are here/,
  );
}

// 15–25. The experiment registry and its engineering provenance.
{
  assert.equal(experiments.length, 4, '15');
  assert.deepEqual(
    experiments.map((e) => e.id),
    IDS,
    '16',
  );
  experiments.forEach((e, i) => {
    assert.equal(e.number, `EX–0${i + 1}`, '17. from order');
    assert.equal(e.number, lab.experimentNumber(i));
  });
  assert.equal(new Set(experiments.map((e) => e.id)).size, 4, '18');
  assert.deepEqual(
    articles.map((a) => a.id),
    IDS,
    '19. one fragment per study, in order',
  );
  for (const e of experiments) {
    assert(e.sourceModules.length > 0, `20. ${e.id} names its modules`);
    for (const path of e.sourceModules)
      assert(existsSync(new URL(path, root)), `20. ${path} exists`);
    assert.match(e.question, /\?$/);
    for (const field of ['title', 'question', 'medium', 'productionContext'])
      assert(e[field], `${e.id}.${field}`);
  }
  const modules = Object.fromEntries(
    experiments.map((e) => [e.id, [...e.sourceModules]]),
  );
  for (const m of [
    'components/home/experience/atmospheric-sky-renderer.ts',
    'components/home/experience/atmospheric-sky-frame.ts',
    'components/home/experience/atmospheric-sky-shaders.ts',
    'components/home/experience/atmospheric-bridge-frame.ts',
  ])
    assert(modules.atmosphere.includes(m), `21. ${m}`);
  for (const m of [
    'components/home/experience/continuous-breeze.tsx',
    'components/home/experience/breeze-renderer.ts',
    'components/home/experience/breeze-geometry.ts',
    'components/home/experience/breeze-bridge-pose.ts',
  ])
    assert(modules.breeze.includes(m), `22. ${m}`);
  for (const m of [
    'lib/motion/pointer.ts',
    'components/world/gallery-depth.tsx',
  ])
    assert(modules.depth.includes(m), `23. ${m}`);
  for (const m of [
    'components/world/world-portal.ts',
    'components/world/world-gateway-link.tsx',
  ])
    assert(modules.threshold.includes(m), `24. ${m}`);
  assert.match(
    curationSource,
    /export type LabExperimentId = 'atmosphere' \| 'breeze' \| 'depth' \| 'threshold';/,
    '25. no fifth experiment',
  );
  assert.match(
    curationSource,
    /\] as const satisfies readonly CuratedExperiment\[\];/,
  );
  assert.deepEqual(
    experiments.map((e) => e.mode),
    ['live', 'reference', 'live', 'reference'],
    'Atmosphere and Depth live; Breeze and Threshold reference',
  );
  // Provenance stays in data, tests and docs: never in the visitor UI.
  assert.doesNotMatch(
    html,
    /components\/|lib\/motion|\.tsx?\b|atmospheric-sky|breeze-renderer|world-portal/,
    'no source path in the room',
  );
}

// 26–31. Architecture: a server room with two small islands.
{
  assert.doesNotMatch(roomSource, /^['"]use client['"]/m, '26');
  assert.doesNotMatch(read('app/world/lab/page.tsx'), /'use client'/, '27');
  assert.match(islandSource, /^'use client';/, '28. the Atmosphere island');
  assert.doesNotMatch(adapterSource, /'use client'/, '28. a lazy module');
  assert.doesNotMatch(curationSource, /'use client'/);
  const imports = [...roomSource.matchAll(/from '([^']+)'/g)]
    .map(([, m]) => m)
    .sort(byCodeUnit);
  assert.deepEqual(
    imports,
    [
      './gallery-depth',
      './lab-atmosphere-study',
      './world-chrome',
      './world-portal',
      '@/components/home/experience/breeze-geometry',
      '@/data/world-building',
      '@/data/world-lab',
      'next/link',
    ].sort(byCodeUnit),
    '28. islands: the Atmosphere study and the shared depth',
  );
  // The shared depth island predates the Lab (Gallery, Room 02).
  assert.match(read('components/world/gallery-depth.tsx'), /^'use client';/);
  assert(!existsSync(new URL('app/world/lab/[slug]', root)), '29');
  for (const file of ['middleware.ts', 'middleware.js', 'proxy.ts'])
    assert(!existsSync(new URL(file, root)), `31. no ${file}`);
  assert.doesNotMatch(read('next.config.ts'), /redirects|rewrites/, '30–31');
}

// 32–39. Atmosphere before activation: nothing heavy, nothing automatic.
{
  for (const file of LAB_FILES) {
    const source = code(file);
    assert.doesNotMatch(
      source,
      /from ['"]three['"]|import\(['"]three['"]\)|require\(['"]three['"]\)/,
      `32. ${file}`,
    );
  }
  assert.doesNotMatch(html, /<canvas\b/i, '33');
  assert.doesNotMatch(html, /<iframe\b|<script\b/i);
  // 34. The mount effect subscribes and cleans up; it never activates.
  const effect = islandCode.match(
    /useEffect\(\(\) => \{([\s\S]*?)\n {2}\}, \[\]\);/,
  );
  assert(effect, 'one mount effect');
  assert.doesNotMatch(
    effect[1],
    /activate\(|import\(|createAtmosphericSkyBridge|toggle\(/,
    '34. no load on mount',
  );
  assert.equal(
    (islandCode.match(/useEffect\(/g) ?? []).length,
    1,
    '34. one effect',
  );
  // 35–38. No scroll, viewport, hover, focus or timer trigger.
  assert.doesNotMatch(
    islandCode,
    /onScroll|onMouse(?:Enter|Over|Move)|onPointer(?:Enter|Over|Move)|onFocus|onTouch|IntersectionObserver|ResizeObserver|setTimeout|setInterval|requestIdleCallback|addEventListener\(['"](?:scroll|pointer|mouse|focus)/,
    '35–38',
  );
  // 39. The only import of the adapter is inside activate(), which only the
  // toggle calls, which only a click calls.
  assert.equal(
    (
      islandCode.match(
        /(?<!typeof )import\(['"]\.\/lab-atmosphere-adapter['"]\)/g,
      ) ?? []
    ).length,
    1,
    '39. one runtime import (the other is a type)',
  );
  assert.match(
    fn(islandCode, 'activate'),
    /await import\('\.\/lab-atmosphere-adapter'\)/,
    '39. inside activate',
  );
  assert.deepEqual(
    [...islandCode.matchAll(/(?<![\w-])activate(?![\w-])/g)].length,
    2,
    '39. defined once, called once',
  );
  assert.match(fn(islandCode, 'toggle'), /void activate\(\)/, '39');
  assert.deepEqual(
    [...islandCode.matchAll(/(?<![\w-])toggle(?![\w-])/g)].length,
    2,
    '39. the toggle is only a click handler',
  );
  assert.match(islandCode, /onClick=\{toggle\}/, '39');
  assert.match(
    islandSource,
    /import type \{ LabAtmosphereBand \} from '\.\/lab-atmosphere-adapter';/,
    'the only static reference to the adapter is a type',
  );
  // The static study, complete before any activation (55).
  assert.match(
    html,
    /<div class="wlab-field" data-lab-atmosphere="" data-phase="static">/,
  );
  for (const tone of ['air', 'cloud', 'sky'])
    assert.match(html, new RegExp(`data-tone="${tone}"`), `palette ${tone}`);
  assert.match(
    html,
    /<span>Air<\/span>[\s\S]*<span>Cloud<\/span>[\s\S]*<span>Open sky<\/span>/,
  );
  assert.match(
    html,
    /<output class="wlab-status" tabindex="-1" data-lab-status="static">Static study<\/output>/,
  );
  assert.doesNotMatch(
    html,
    /<button\b/,
    'no toggle before the capability is known (server and hydration)',
  );
  assert.match(html, /<div class="wlab-host" aria-hidden="true"><\/div>/);
}

// 40–49. The production atmosphere, reused and never forked.
{
  assert.match(
    adapterSource,
    /import \{ createAtmosphericSkyBridge \} from '@\/components\/home\/experience\/atmospheric-sky-renderer';/,
    '40',
  );
  assert.equal(
    adapter.createAtmosphericSkyBridge,
    skyRenderer.createAtmosphericSkyBridge,
  );
  assert.match(
    fn(islandCode, 'activate'),
    /adapter\.createAtmosphericSkyBridge\(host, \(\) => schedule\(study\)\)/,
    '40',
  );
  for (const file of LAB_FILES) {
    const source = code(file);
    assert.doesNotMatch(
      source,
      /WebGLRenderer|WebGL2?RenderingContext|getContext\(|ShaderMaterial|PerspectiveCamera|PlaneGeometry|compileAsync|forceContextLoss|renderLists/,
      `41, 43. ${file}`,
    );
    assert.doesNotMatch(
      source,
      /gl_FragColor|gl_Position|varying |uniform (?:float|vec)|fbm\(|#include|\/\* glsl \*\//,
      `42. ${file}`,
    );
  }
  // 44. One live instance.
  assert.match(
    fn(islandCode, 'activate'),
    /^const activate = async \(\) => \{\s*if \(studyRef\.current \|\| phaseRef\.current !== 'static'\) return;/,
    '44',
  );
  // 45. STOP destroys the production instance.
  const stop = fn(islandCode, 'stop');
  assert.match(
    stop,
    /ticketRef\.current\+\+;/,
    '47. stopping retires the ticket',
  );
  assert.match(stop, /cancelAnimationFrame\(study\.frame\);/);
  assert.match(stop, /study\.detach\(\);/);
  assert.match(stop, /study\.bridge\.destroy\(\);/, '45');
  assert.match(fn(islandCode, 'toggle'), /else \{\s*stop\(\);/, '45');
  // 46. Leaving the page destroys it.
  assert.match(
    islandCode,
    /return \(\) => \{\s*unsubscribe\(\);\s*stop\(\);\s*\};\s*\}, \[\]\);/,
    '46',
  );
  // 47. A late import never resurrects a stopped or unmounted study (the
  // renderer's own generation guard covers a late compile).
  assert.match(
    fn(islandCode, 'activate'),
    /await import\('\.\/lab-atmosphere-adapter'\);[\s\S]*?if \(ticket !== ticketRef\.current \|\| !host \|\| !field\) return;/,
    '47',
  );
  assert.match(
    read('components/home/experience/atmospheric-sky-renderer.ts'),
    /if \(disposed \|\| failed \|\| ticket !== generation\) return;/,
  );
  // 48. The native range drives the production progress domain.
  assert.match(
    islandCode,
    /study\.value = Number\(event\.currentTarget\.value\) \/ 100;\s*schedule\(study\);/,
    '48',
  );
  assert.match(
    fn(islandCode, 'paint'),
    /const progress = adapter\.labAtmosphereProgress\(study\.value\);\s*bridge\.update\(\{\s*progress,/,
    '48',
  );
  const { SKY_BRIDGE, atmosphericSkyFrame } = skyFrame;
  const at = (t) => atmosphericSkyFrame(adapter.labAtmosphereProgress(t));
  assert(at(0).active && at(1).active, '48. both ends draw');
  assert(
    at(0).progress < SKY_BRIDGE.armBefore,
    '48. warm-up arms at the start',
  );
  assert(at(0).density === 0 && at(0).skyCover === 0, 'the air is clear');
  assert(at(1).opening > 0.99, 'the open sky');
  let previous = -1;
  for (let i = 0; i <= 1000; i++) {
    const progress = adapter.labAtmosphereProgress(i / 1000);
    assert(progress > previous, '48. monotonic');
    assert(
      progress >= SKY_BRIDGE.start && progress <= SKY_BRIDGE.end,
      'inside the production bridge',
    );
    previous = progress;
  }
  // Determinism: pure functions of the range position, however it got there.
  const path = [0, 1, 0.25, 0.75, 0.5, 0, 0.5, 1, 0.5];
  const samples = path.map((t) => JSON.stringify(at(t)));
  assert.equal(samples[4], samples[6]);
  assert.equal(samples[4], samples[8]);
  assert.equal(
    adapter.labAtmosphereProgress(-1),
    adapter.labAtmosphereProgress(0),
  );
  assert.equal(
    adapter.labAtmosphereProgress(2),
    adapter.labAtmosphereProgress(1),
  );
  // The ground under the canvas follows the homepage's own swap.
  const swap = bridgeFrame.bridgeTiming.swap;
  assert.equal(adapter.labAtmosphereGround(swap - 1e-9), 'air');
  assert.equal(adapter.labAtmosphereGround(swap), 'sky');
  assert(
    at(0).progress <
      (swap - SKY_BRIDGE.start) / (SKY_BRIDGE.end - SKY_BRIDGE.start),
  );
  // Where the ground changes, the atmosphere covers every pixel.
  const atSwap = atmosphericSkyFrame(swap);
  assert.equal(atSwap.skyCover, 1, 'full cover at the swap');
  assert.equal(atSwap.opening, 0, 'nothing open at the swap');
  // Plain-language bands, in order across the range.
  const bands = [];
  for (let i = 0; i <= 100; i++) {
    const band = adapter.labAtmosphereBand(
      adapter.labAtmosphereProgress(i / 100),
    );
    if (bands.at(-1) !== band) bands.push(band);
  }
  assert.deepEqual(bands, ['Air', 'Cloud', 'Open sky']);
  // 49. No fake progress percentage: the range speaks in bands.
  assert.match(islandCode, /aria-valuetext=\{band\}/, '49');
  assert.doesNotMatch(islandCode, /%|percent/i, '49');
  assert.doesNotMatch(html, /\d\s?%/, '49');
}

// 50–53. Frames on demand only: nothing runs at rest.
{
  for (const file of LAB_FILES)
    assert.doesNotMatch(code(file), /\.tick\(|wantsTime\(/, `50. ${file}`);
  assert.equal(
    (islandCode.match(/requestAnimationFrame\(/g) ?? []).length,
    1,
    '51. one place asks for a frame',
  );
  const schedule = fn(islandCode, 'schedule');
  assert.match(
    schedule,
    /if \(study\.frame \|\| studyRef\.current !== study\) return;/,
    '52. requests coalesce into one pending frame',
  );
  assert.match(
    schedule,
    /requestAnimationFrame\(\(\) => \{\s*study\.frame = 0;\s*if \(studyRef\.current === study\) paint\(study\);\s*\}\);/,
    '51, 53. the frame paints once and asks for nothing',
  );
  assert.doesNotMatch(
    fn(islandCode, 'paint'),
    /schedule\(|requestAnimationFrame/,
    '53. a paint never schedules another',
  );
  // Ambient time is held still: one constant timestamp, no clock.
  assert.match(islandCode, /const LAB_CLOCK = 0;/);
  assert.match(fn(islandCode, 'paint'), /now: LAB_CLOCK,/);
  assert.doesNotMatch(islandCode, /performance\.now|Date\.now/, '53');
}

// 54–57. Capability: reduced motion, Save-Data and failure keep the field.
{
  assert.match(
    fn(islandCode, 'activate'),
    /const capability = readMotionCapability\(\);\s*if \(capability\.reduced\) return;/,
    '54. reduced motion never loads',
  );
  assert.match(
    islandCode,
    /if \(next\.reduced\) \{\s*stop\(\);/,
    '54. a reduced-motion request ends a live study',
  );
  assert.match(
    islandCode,
    /capability\?\.reduced && phase !== 'fallback' \? 'reduced' : phase/,
  );
  assert.match(islandCode, /reduced: 'Static study \/ Reduced motion',/);
  // 55. The fallback is the complete static study (asserted above); 56. a
  // failure returns to it and the palette hides only while live.
  assert.match(
    fn(islandCode, 'paint'),
    /const tierFallback = host\.dataset\.skyTier === 'fallback';\s*if \(tierFallback \|\| state === 'fallback'\) \{\s*stop\(\);/,
    '56',
  );
  // The renderer's tier is read before its state: a fallback tier also
  // reports the fallback state, and Save-Data must not read as a failure.
  assert.match(
    fn(islandCode, 'paint'),
    /settle\(\s*!tierFallback\s*\? 'fallback'\s*: capability\.reduced\s*\? 'static'\s*: 'save-data',\s*\);/,
    '57. Save-Data is named as such',
  );
  assert.match(islandCode, /fallback: 'Static fallback',/);
  assert.doesNotMatch(islandCode, /retry|setTimeout/i, '56. no retry loop');
  assert.match(
    fn(islandCode, 'activate'),
    /catch \{\s*if \(ticket === ticketRef\.current\) settle\('fallback'\);/,
  );
  // 57. Capability values come from the browser, never literals.
  const update = fn(islandCode, 'paint').match(
    /bridge\.update\(\{([\s\S]*?)\}\);/,
  )[1];
  assert.match(update, /reduced: capability\.reduced,/, '57');
  assert.match(update, /fine: capability\.finePointer,/, '57');
  assert.match(update, /saveData: capability\.saveData,/, '57');
  assert.match(update, /visible: document\.visibilityState === 'visible',/);
  assert.match(
    update,
    /width: host\.clientWidth,\s*height: host\.clientHeight,/,
  );
  assert.doesNotMatch(
    update,
    /(?:reduced|fine|saveData): (?:true|false)/,
    '57',
  );
  assert.match(
    read('lib/motion/capability.ts'),
    /\.connection\?\.saveData === true/,
    'Save-Data from the browser',
  );
}

// CSS: scoped, tokens only, the palette is the atmosphere's own.
const rules = [...cssCode.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
  .map(([, s, body]) => ({
    selectors: s
      .trim()
      .split(/,(?![^(]*\))\s*/)
      .map((x) => x.replace(/\s+/g, ' ')),
    body,
  }))
  .filter(
    ({ selectors }) =>
      !selectors[0].startsWith('@') && !/^(?:from|to|\d+%)$/.test(selectors[0]),
  );
const rule = (selector) =>
  rules
    .filter(({ selectors }) => selectors.includes(selector))
    .map(({ body }) => body)
    .join('\n');
{
  for (const { selectors } of rules)
    for (const s of selectors)
      assert(
        /^(?:\.world-lab|\.wlab-|:root:has\(main\[data-world-lab\]\))/.test(s),
        `scoped: ${s}`,
      );
  assert.doesNotMatch(
    cssCode,
    /cubic-bezier|[\s:,]ease(?:-in|-out|-in-out)?\b/,
    'tokens only',
  );
  for (const [, value] of css.matchAll(/(?:animation|transition):\s*([^;]+);/g))
    if (value.trim() !== 'none')
      for (const part of value.split(','))
        assert.match(
          part,
          /var\(--motion-duration-[a-z]+\) var\(--motion-ease-[a-z]+\)/,
          `token timing: ${part.trim()}`,
        );
  // One arrival keyframe; nothing loops, nothing waves.
  assert.deepEqual(
    [...cssCode.matchAll(/@keyframes ([a-z-]+)/g)].map(([, n]) => n),
    ['wlab-rise'],
  );
  assert.doesNotMatch(
    cssCode,
    /infinite|alternate|wave|backdrop-filter|filter:/,
  );
  // Reduced motion: no base rule hides content; the static palette steps
  // aside only for a live study.
  const hiding = rules.filter(({ body }) =>
    /(?<![\w-])opacity: 0(?![.\d])|visibility: hidden|display: none/.test(body),
  );
  assert.deepEqual(
    hiding.map(({ selectors }) => selectors.join(', ')),
    [
      ".wlab-field[data-phase='live'] .wlab-palette",
      ".wlab-depth-status [data-capability='pointer']",
      ".wlab-depth-status [data-capability='static']",
    ],
    'only state and capability rules hide anything',
  );
  // The palette is the colours the production atmosphere draws.
  const renderer = read(
    'components/home/experience/atmospheric-sky-renderer.ts',
  );
  for (const name of ['air', 'cloud', 'daylight', 'sky', 'sky-low']) {
    const value = rule('.world-lab').match(
      new RegExp(`--wlab-${name}: (#[0-9a-f]{6});`),
    )?.[1];
    assert(value, `--wlab-${name}`);
    assert(
      renderer.includes(`'${value}'`),
      `${value} is the renderer's colour`,
    );
  }
  // First paint: the World ground from the root.
  assert.match(
    rule(':root:has(main[data-world-lab])'),
    /background: var\(--world-ground\);/,
  );
  assert.match(
    rule(':root:has(main[data-world-lab]) body'),
    /color-scheme: dark;/,
  );
  const chromeCss = read('components/world/world-chrome.css');
  // The Lab's place in the shared lists (rooms opened later follow it).
  assert.match(
    chromeCss,
    /\.world-lab(?:,\n\.world-[a-z-]+)* \{\s*--wl-serif: 'Cormorant Spatial'/,
  );
  assert.match(chromeCss, /\.world-lab a(?:,\n\.world-[a-z-]+ a)* \{/);
  assert.match(
    roomSource,
    /import '@\/components\/shared\/spatial-type\.css';/,
  );
}

// 58–64. Depth: the shared pointer follower, bounded, desktop tier only.
{
  assert.match(
    roomSource,
    /<GalleryDepth target="\[data-lab-depth\]" property="--lab-depth" \/>/,
    '58',
  );
  assert.match(
    read('components/world/gallery-depth.tsx'),
    /return createPointerFollower\(exhibit, \(x, y\) => \{/,
    '58. createPointerFollower',
  );
  assert.match(
    html,
    /<div class="wlab-depth" data-lab-depth="" aria-hidden="true">/,
  );
  const media = cssCode.match(
    /@media \(min-width: 1200px\) and \(hover: hover\) and \(pointer: fine\) and \(prefers-reduced-motion: no-preference\) \{([\s\S]*?)\n\}/,
  );
  assert(media, '60–62. one gated block');
  const offsets = [
    ...media[1].matchAll(
      /data-plane='(mid|near)'\] \{\s*transform: translate3d\(\s*calc\(var\(--lab-depth-x, 0\) \* -([\d.]+)px\),\s*calc\(var\(--lab-depth-y, 0\) \* -([\d.]+)px\),/g,
    ),
  ].map(([, plane, x, y]) => ({ plane, x: Number(x), y: Number(y) }));
  assert.deepEqual(
    offsets.map((o) => o.plane),
    ['mid', 'near'],
    'two moving planes, the far plane still',
  );
  const limit = { mid: { x: 3, y: 2 }, near: { x: 6, y: 4 } };
  for (const o of offsets) {
    assert(
      o.x <= limit[o.plane].x && o.y <= limit[o.plane].y,
      `59. ${o.plane}`,
    );
    assert(o.x <= tokens.MOTION_LIMITS.parallaxPx, '59. MOTION_LIMITS');
  }
  // 61–62. No plane moves outside that block.
  const outside = cssCode.replace(media[0], '');
  assert.doesNotMatch(outside, /--lab-depth/, '61–62');
  assert.doesNotMatch(
    [
      ...outside.matchAll(
        /\.wlab-plane\[data-plane='(?:mid|near)'\] \{([^}]*)\}/g,
      ),
    ]
      .map(([, body]) => body)
      .join('\n'),
    /transform/,
    '61–62. static base planes',
  );
  // 60. The follower itself: mouse only, fine pointer, no reduced motion.
  const pointer = read('lib/motion/pointer.ts');
  assert.match(
    pointer,
    /if \(event\.pointerType !== 'mouse' \|\| !allowed\.matches\) return;/,
  );
  assert.match(
    capability.MOTION_QUERIES.pointerMotion,
    /\(hover: hover\) and \(pointer: fine\) and \(prefers-reduced-motion: no-preference\)/,
  );
  // 63. No gyroscope or touch-follow.
  for (const file of LAB_FILES)
    assert.doesNotMatch(
      code(file),
      /deviceorientation|devicemotion|Gyroscope|Accelerometer|touchmove/i,
      `63. ${file}`,
    );
  // 64. 0 RAF after settling: the follower stops its frame once settled.
  assert.match(pointer, /x = targetX;\s*y = targetY;\s*frame = 0;/, '64');
  // Both capability texts are in the markup; CSS shows the one that applies.
  assert.match(
    html,
    /<span data-capability="pointer">Live: move a mouse across the field\./,
  );
  assert.match(html, /<span data-capability="static">Static here\./);
}

// 65–67. Breeze: a reference study drawn from the real geometry.
{
  const breeze = articles.find((a) => a.id === 'breeze');
  assert.equal(breeze.mode, 'reference', '65');
  assert.doesNotMatch(
    roomSource,
    /continuous-breeze|breeze-renderer|createBreezeRenderer|ContinuousBreeze/,
    '65. the live system stays on the homepage',
  );
  const cloth = breezeGeometry.storyBreezeGeometry(1440, 900);
  assert(
    breeze.body.includes(`d="${cloth.outline}"`),
    '66. the production outline',
  );
  const threads = [
    ...breeze.body.matchAll(/class="wlab-cloth-thread" d="([^"]+)"/g),
  ].map(([, d]) => d);
  assert.deepEqual(
    threads,
    [...cloth.threads].filter((_, i) => i % 4 === 0),
    '66. the production threads',
  );
  assert.doesNotMatch(breeze.body, /<animate|class="[^"]*wave/, '66. still');
  assert.match(breeze.body, /Surface[\s\S]*Depth[\s\S]*Crossing/);
}

// 68–70. Threshold: the real portal, described, never replayed.
{
  const threshold = articles.find((a) => a.id === 'threshold');
  assert.equal(threshold.mode, 'reference');
  assert.deepEqual(
    [
      ...threshold.body.matchAll(/<span class="wlab-step">([^<]+)<\/span>/g),
    ].map(([, s]) => s),
    ['Real link', 'Intent', 'Cover', 'Route', 'Release'],
    '68',
  );
  for (const value of [
    portal.PORTAL.coverMs,
    portal.PORTAL.reducedMs,
    portal.PORTAL.releaseMs,
  ])
    assert.match(threshold.body, new RegExp(`${value} ms`), '68. from PORTAL');
  for (const file of LAB_FILES)
    assert.doesNotMatch(
      code(file),
      /enterWorld|releaseWorldPortal|abortWorldPortal|WorldGatewayLink|from '\.\/world-gateway-link'/,
      `69. ${file}`,
    );
  assert.match(roomSource, /import \{ PORTAL \} from '\.\/world-portal';/);
}

// 71–77. Nothing external, no viewer, no model.
for (const source of [...LAB_FILES.map(code), html]) {
  assert.doesNotMatch(
    source,
    /<iframe|sketchfab|\.glb|\.gltf|fab\.com/i,
    '74–76',
  );
  // `url(#…)` is a same-document reference (the cloth's clip), never a fetch.
  assert.doesNotMatch(source, /https?:\/\/|url\((?!#)|@import/, '77');
}

// 84–93. Accessibility.
{
  assert.equal((html.match(/<h1\b/g) ?? []).length, 1, '84');
  assert.match(html, /<h1 id="world-lab-title">Lab<\/h1>/);
  assert.equal((html.match(/<h2\b/g) ?? []).length, 4, '85');
  assert.equal((html.match(/<main\b/g) ?? []).length, 1);
  assert.equal((html.match(/<header\b/g) ?? []).length, 1, 'the World chrome');
  for (const a of articles)
    assert.match(
      a.body,
      new RegExp(`<h2 id="${a.id}-title" class="wlab-title">`),
    );
  const index = html.match(
    /<nav class="wlab-index" aria-labelledby="wlab-index-title">([\s\S]*?)<\/nav>/,
  )?.[1];
  assert(index, '86');
  assert.deepEqual(
    [...index.matchAll(/<a href="#([^"]+)"/g)].map(([, id]) => id),
    IDS,
    '87',
  );
  assert.match(index, /EX–01[\s\S]*Atmosphere[\s\S]*EX–04[\s\S]*Threshold/);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(([, id]) => id);
  assert.equal(new Set(ids).size, ids.length, 'no duplicate id');
  // 88–90. Real controls.
  assert.match(
    islandCode,
    /<button\s+ref=\{buttonRef\}\s+type="button"\s+className="wlab-toggle"\s+onClick=\{toggle\}\s*>\s*\{shown === 'static' \? 'Load live study' : 'Stop live study'\}/,
    '88–89. one toggle button',
  );
  assert.match(
    islandCode,
    /<label htmlFor="wlab-atmosphere-range">Threshold progress<\/label>/,
    '90',
  );
  assert.match(islandCode, /id="wlab-atmosphere-range"\s+type="range"/, '90');
  // 91. Touch targets.
  assert.match(rule('.wlab-toggle'), /min-height: 44px/, '91');
  assert.match(rule('.wlab-range input'), /min-height: 44px/, '91');
  assert.match(rule('.wlab-index a'), /min-height: 56px/, '91');
  assert.match(rule('.wlab-lobby'), /min-height: 44px/, '91');
  // 92. Visible focus from the World.
  assert.match(
    read('components/world/world-chrome.css'),
    /\.world-lab :focus-visible(?:,\n\.world-[a-z-]+ :focus-visible)* \{\s*outline: 1px solid currentColor;/,
    '92',
  );
  // 93. Decorative fields are hidden from assistive tech; meaning is text.
  assert.match(html, /<div class="wlab-palette" aria-hidden="true">/);
  assert.match(html, /<svg class="wlab-cloth-still"[^>]*aria-hidden="true"/);
  assert.match(
    read('components/home/experience/atmospheric-sky-renderer.ts'),
    /canvas\.setAttribute\('aria-hidden', 'true'\);/,
    'the production canvas is decorative',
  );
  for (const e of experiments) {
    assert(html.includes(`>${e.question}<`), `93. ${e.id} question`);
    assert(html.includes(`<dd>${e.medium}</dd>`), `93. ${e.id} medium`);
  }
  assert.doesNotMatch(
    html,
    /FPS|draw calls|uniform|DPR|pixel budget|debug|dev mode|tech demo|beta|feature flag/i,
    'no diagnostics in the room',
  );
  assert.match(html, /Built <em>in production\.<\/em>/);
}

// 94–106. Production systems and every other room are untouched.
{
  // 96–100. Gallery, Objects, Archive, both shells: only the Lab entry.
  const images = load('data/images.ts', {
    './image-dimensions.json': json('data/image-dimensions.json'),
  });
  const editorialImage = load('components/shared/editorial-image.tsx', {
    '@/data/images': images,
  });
  const worldsModule = load('data/worlds.ts');
  const galleryFor = (buildingModule) =>
    render(
      load('components/world/world-gallery.tsx', {
        'next/link': linkModule,
        '@/data/worlds': worldsModule,
        '@/data/world-gallery': load('data/world-gallery.ts', {
          './worlds': worldsModule,
        }),
        '@/data/world-building': buildingModule,
        '@/components/shared/editorial-image': editorialImage,
        '@/lib/world-detail-context': load('lib/world-detail-context.ts'),
        './world-chrome': chromeFor(buildingModule),
        './gallery-depth': { GalleryDepth: nullComponent },
        './gallery-reveal': { GalleryReveal: nullComponent },
      }).WorldGallery,
    );
  const gallery = galleryFor(building);
  assert.equal(withoutLab(gallery), withoutLab(galleryFor(beforeLab)), '96');
  assert.match(gallery, /<a href="\/world\/lab" class="wl-map-entry">/);
  const materialsModule = load('data/materials.ts', { './images': images });
  const journalModule = load('data/journal.ts', { './images': images });
  const archiveFor = (buildingModule) =>
    render(
      load('components/world/world-archive.tsx', {
        'next/link': linkModule,
        '@/data/world-archive': load('data/world-archive.ts', {
          './materials': materialsModule,
          './journal': journalModule,
        }),
        '@/data/world-building': buildingModule,
        '@/components/shared/editorial-image': editorialImage,
        './world-chrome': chromeFor(buildingModule),
      }).WorldArchive,
    );
  const archive = archiveFor(building);
  assert.equal(withoutLab(archive), withoutLab(archiveFor(beforeLab)), '98');
  assert.match(archive, /<a href="\/world\/lab" class="wl-map-entry">/);
  // 97, 99–100. Room 02 and both shells render this chrome: for every room
  // it differs only by the Lab entry.
  for (const current of ['gallery', 'objects', 'archive']) {
    const live = render(chromeFor(building).WorldChrome, {
      currentRoom: current,
    });
    const before = render(chromeFor(beforeLab).WorldChrome, {
      currentRoom: current,
    });
    assert.equal(
      withoutLab(live),
      withoutLab(before),
      `97, 99–100. ${current}`,
    );
  }
  const LOCKED = {
    // 94. The homepage's production systems the Lab consumes or describes.
    'components/home/experience/atmospheric-sky-bridge.tsx': '614d935f487c6f3b',
    'components/home/experience/atmospheric-sky-renderer.ts':
      '2c45dfbf7dfa0bb1',
    'components/home/experience/atmospheric-sky-frame.ts': '773f616856b3127d',
    'components/home/experience/atmospheric-sky-shaders.ts': 'b72b1855824ca04c',
    'components/home/experience/atmospheric-bridge-frame.ts':
      '6e8ec43efe204f08',
    // TP3D STEP 1 replaces `scrub: 0` with the scroll follow (`follow`,
    // followScroll): what the pinned stage shows trails the hand and rests
    // on it. Every curve, timing and mass value the Lab reads is unchanged
    // (check:home). STEP 2 adds the pace table (`pace`, storyPacing: how
    // much of the scroll distance each stretch of the story gets) and starts
    // the Atrium pull-back while the last cloud clears (`camera.start` 0.695,
    // from 0.72 / 0.715); check:home locks what else stayed PASS 04. The
    // follow gains a second, heavier setting (`follow.travel`) for where the
    // room orbit's camera travels between two rooms; the journey's own
    // follow, and every value the Lab reads, are unchanged (check:home).
    // `carry` is the setting of the room orbit's carry (owner decision,
    // 2026-10-09: a hand that stops between two rooms is taken on to the
    // room); only the room orbit reads it (check:atrium-orbit-foundation).
    'components/home/experience/home-motion.ts': 'f47424e681d934cf',
    // TP3D PASS — Atrium room orbit appends its own span after the approved
    // journey; the bridge writes the Lab maps are unchanged (check:atrium-orbit).
    // TP3D PASS 6A adds only the dormant Tier B hook (development / preview
    // gate, shut in production builds); PASS 6A.5 names its two progress
    // domains; PASS 6A.75 lets that hook supply the World gateway's
    // late-Kitchen reveal (no-op without Tier B); PASS 6A.96 lets it also
    // supply what the final release leaves of the baseline, and passes it
    // the explicit readout request (?atriumOrbitDebug=1), both no-ops
    // without Tier B. PASS 6B.1 writes the Atrium camera's pose flat (2D,
    // never promoted) through the bridge, so the photograph is drawn directly
    // and does not snap sharper in the frame the pull-back ends; the pose
    // itself is still PASS 15's (check:atrium-orbit compares it). STEP 1
    // samples every layer from the followed scroll position instead of the
    // raw one and writes the portal orbit's breath flat as well; at rest
    // each scroll position writes what it wrote before (check:home,
    // check:atrium-orbit). STEP 2 turns the share of the distance scrolled
    // into story progress through the pace table (one to one under reduced
    // motion); the frame a story position rests on is unchanged.
    // STEP 2B: the room orbit (the Tier B controller, a lazy chunk) is the
    // homepage's orbit at every URL but ?atriumOrbit=0, no longer a preview
    // behind a build flag; the settled Atrium holds while it loads
    // (check:atrium-orbit). Where that orbit's camera travels between two
    // rooms the timeline asks the follow for its heavier setting; it trails
    // as before everywhere else (check:atrium-orbit). It also hands that
    // orbit where the page is on every frame, and whether a finger holds it
    // (three passive touch listeners), so the orbit can carry a room change
    // through; the timeline itself still never writes the scroll position.
    // The oculus's living sky (owner request, 2026-10-10) is that orbit's:
    // the one frame owner hands the orbit each frame's timestamp and keeps
    // frames coming while the orbit says its sky is on stage, and the orbit
    // is told whether the Atrium is in view, the pointer fine and Save-Data
    // on. Nothing of the story is rendered on such a frame, and the base
    // journey writes what it wrote before (check:atrium-orbit).
    'components/home/experience/home-story-timeline.ts': '6a85b57c4eafc075',
    'components/home/experience/continuous-breeze.tsx': '80f5ac52eee64916',
    // STEP 2: the cloth travels between its two reading poses instead of
    // fading out and returning in the other; both poses are unchanged.
    'components/home/experience/breeze-renderer.ts': 'aef51b0e0194914e',
    'components/home/experience/breeze-geometry.ts': '8e8d627818928972',
    'components/home/experience/breeze-bridge-pose.ts': '5ec6cdae815ea919',
    'components/home/experience/hero-depth.ts': '3774b47e015aaf49',
    'lib/motion/pointer.ts': '6de2aede33dc4774',
    'lib/motion/capability.ts': '2e4f82e4bc7fbb12',
    'lib/motion/tokens.ts': '5019cf361c425fba',
    'hooks/use-motion-capability.ts': '1a039892f7757e23',
    'components/world/gallery-depth.tsx': 'f320119f57b2a020',
    // 95. The PORTAL.
    'components/world/world-portal.ts': 'ca47a68612c2d21b',
    'components/world/world-gateway-link.tsx': 'a05d4306413948ec',
    // 96–100. The rooms, both detail shells, the Lobby, the chrome.
    'components/world/world-gallery.tsx': 'f1a4d8da704c60d5',
    'components/world/world-gallery.css': '38d790dd070c413d',
    'components/world/world-objects.tsx': '4a565398c1e36def',
    'components/world/world-objects.css': '038f31c72e212ffb',
    'components/world/world-archive.tsx': '2bb5f3cfdee5a1c4',
    'components/world/world-archive.css': '28c157c6802aaf5f',
    'data/world-archive.ts': 'f399b8a0aba82029',
    'components/world/world-detail-shell.tsx': '3e53405aaff87ab1',
    'components/world/world-detail-shell.css': '59df760b8e04e445',
    'components/world/object-study-shell.tsx': '404081ad9d571e7b',
    'components/world/object-study-shell.css': '7743c1aecaa2449a',
    'components/world/world-lobby.tsx': 'bf0bc493f965b78c',
    'components/world/world-lobby.css': 'e3ef8536f38af67f',
    'components/world/world-chrome.tsx': '3a37f3c5c372903f',
    'components/world/world-map-disclosure.tsx': '4707ca1a14337b76',
    'components/world/world-map-escape.ts': '0427f41c9165fe0c',
    // 101–102. Products and their navigation (PASS 11–12).
    'app/products/page.tsx': '2257cc689fdfa941',
    'app/products/[slug]/page.tsx': 'f5515aa35568c5dc',
    'components/product/product-detail.tsx': '785f3fb044d54e96',
    'components/sections/object-selection.tsx': 'a59b00fb9dbc215b',
    'lib/product-detail-context.ts': '2177f57b3e4b5cc9',
    // 103. Materials and Journal.
    'app/materials/page.tsx': '0ba50fb84afab920',
    'app/materials/[slug]/page.tsx': '127360a92443d16f',
    'app/journal/page.tsx': '1205ae4a7555f526',
    'app/journal/[slug]/page.tsx': '10ad24979646d735',
    'data/materials.ts': '7fe5807f0e40218b',
    'data/journal.ts': '120b850c2b5c18ed',
    // 104–105. The homepage and the catalogue.
    'app/page.tsx': '9b4f5f0e730af60f',
    'app/worlds/page.tsx': '57084f2da546497a',
    // The editorial chrome steps aside on /world/* already.
    'app/layout.tsx': 'd1f018f9f20b3294',
    'components/layout/editorial-chrome.tsx': '5e1eb2ec9e8c232e',
  };
  for (const [path, value] of Object.entries(LOCKED))
    assert.equal(digest(path), value, `${path} is locked`);
  const pages = readdirSync(new URL('app/', root), { recursive: true })
    .map((file) => file.replace(/\\/g, '/'))
    .filter((file) => /(?:^|\/)(?:page|route)\.(?:tsx?|jsx?)$/.test(file))
    .sort(byCodeUnit);
  assert.deepEqual(
    pages.filter((p) => p.startsWith('world/')),
    [
      'world/archive/page.tsx',
      'world/gallery/page.tsx',
      'world/lab/page.tsx',
      'world/objects/page.tsx',
      'world/page.tsx',
      // TP3D PASS 15: Room 05.
      'world/studio/page.tsx',
    ],
    'the Lab route (and since PASS 15 the Studio)',
  );
  const { scripts, dependencies, devDependencies } = json('package.json');
  assert.equal(scripts['check:lab'], 'node scripts/check-lab.mjs');
  for (const name of [
    'check:archive',
    'check:product-navigation',
    'check:object-study',
    'check:objects-room',
    'check:gallery',
    'check:world',
    'check:routes',
    'build',
    'build:vercel',
  ])
    assert(scripts[name], `106. ${name}`);
  // No new dependency.
  const deps = Object.keys({ ...dependencies, ...devDependencies });
  for (const banned of [
    '@react-three/fiber',
    '@react-three/drei',
    'babylonjs',
    '@babylonjs/core',
    'playcanvas',
    'gsap',
    'framer-motion',
    'motion',
    'lenis',
    '@studio-freight/lenis',
  ])
    assert(!deps.includes(banned), `no ${banned}`);
}

console.log(
  'Lab passed: /world/lab is Room 04 inside the World (the Lobby and World map derive it from worldRooms, current only in the Lab; since PASS 15 all five rooms are open); four experiments in order (EX–01…EX–04) whose engineering provenance names real production modules and never reaches the room; a server room whose islands are the Atmosphere study and the shared depth; the static study is complete before any activation, and only the toggle loads the production atmosphere through one lazy adapter (no three import, renderer, shader or WebGL code of its own); one instance, destroyed on stop and unmount, a late import never resurrects it; the native range maps into the production progress domain (pure, monotonic, both ends inside the active window, the ground swapping at the homepage swap) with frames on demand, coalesced, and no tick, clock or loop; reduced motion, Save-Data and failure keep the static study; Depth reuses the shared pointer follower, mid 3×2px and near 6×4px on the desktop tier only; Breeze is a still of the real cloth geometry and Threshold the real portal protocol, never replayed; one h1, four h2s, a navigable index, a labelled range and one toggle; scoped token CSS; the homepage systems, the portal, every other room, both shells, products, sources and the catalogue are locked.',
);
