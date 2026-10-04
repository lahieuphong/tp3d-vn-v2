/** TP3D PASS 07 — Gallery exhibit → live 3D. Detail context, browse sets,
 * URLs, the viewer state model, the Escape/arrow hierarchy, and the real
 * detail components rendered in each context and viewer state. Browser QA
 * (the PASS 07 record) covers timing, network, focus and fullscreen. Numbers
 * refer to the PASS 07 brief. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readdirSync } from 'node:fs';
import {
  load,
  read,
  root,
  linkModule,
  render,
} from './lib/render-server-component.mjs';

const require = createRequire(import.meta.url);
const react = require('react');
const json = (path) => JSON.parse(read(path));
const context = load('lib/world-detail-context.ts');
const viewer = load('components/worlds/world-viewer-state.ts');
const worldsModule = load('data/worlds.ts');
const galleryModule = load('data/world-gallery.ts', {
  './worlds': worldsModule,
});
const building = load('data/world-building.ts');
const worlds = [...worldsModule.worlds];
const galleryExhibits = [...galleryModule.galleryExhibits];
const curatedSlugs = galleryExhibits.map((world) => world.slug);
const galleryRoom = [...building.worldRooms].find(({ id }) => id === 'gallery');
const resolve = (from, slug, room = galleryRoom) =>
  context.resolveWorldDetailContext({
    from,
    slug,
    curatedSlugs,
    galleryRoom: room,
  });

// 3–4. Gallery context only for a curated slug; anything else falls back.
for (const slug of curatedSlugs)
  assert.deepEqual(
    { ...resolve('gallery', slug) },
    {
      kind: 'gallery',
      label: 'ROOM 01 / GALLERY',
      returnPath: '/world/gallery',
      query: '?from=gallery',
    },
  );
for (const from of [
  undefined,
  '',
  'lobby',
  'GALLERY',
  'gallery ',
  ['gallery', 'gallery'],
])
  assert.equal(
    resolve(from, 'modern-kitchen').kind,
    'catalogue',
    `from=${JSON.stringify(from)}`,
  );
assert.equal(
  resolve('gallery', 'a-future-catalogue-world').kind,
  'catalogue',
  'a world outside the curation falls back',
);
assert.equal(
  resolve('gallery', 'modern-kitchen', { ...galleryRoom, href: null }).kind,
  'catalogue',
  'a Gallery without a room route falls back',
);
assert.deepEqual(
  { ...context.CATALOGUE_CONTEXT },
  {
    kind: 'catalogue',
    label: '3D WORLDS',
    returnPath: '/worlds',
    query: '',
  },
);

// 1, 5–6, 9–10. URLs: Gallery links and history keep the room; the catalogue
// keeps its plain URL. Returns land on the exhibit or the catalogue card.
const gallery = resolve('gallery', 'modern-kitchen');
const catalogue = context.CATALOGUE_CONTEXT;
assert.equal(
  context.galleryExhibitHref('modern-kitchen'),
  '/worlds/modern-kitchen?from=gallery',
);
assert.equal(
  context.worldDetailHref('modern-bathroom', gallery),
  '/worlds/modern-bathroom?from=gallery',
);
assert.equal(
  context.worldDetailHref('modern-bathroom', catalogue),
  '/worlds/modern-bathroom',
);
assert.equal(
  context.worldReturnHref('modern-bathroom', gallery),
  '/world/gallery#modern-bathroom',
);
assert.equal(
  context.worldReturnHref('modern-bathroom', catalogue),
  '/worlds#modern-bathroom',
);

// 2. Catalogue cards never add the Gallery context.
{
  const card = read('components/worlds/world-card.tsx');
  assert.match(card, /href=\{`\/worlds\/\$\{world\.slug\}`\}/);
  for (const file of readdirSync(new URL('components/worlds/', root)))
    if (!/world-detail|viewer/.test(file))
      assert.doesNotMatch(
        read(`components/worlds/${file}`),
        /from=gallery|galleryExhibitHref/,
        file,
      );
  assert.match(
    read('components/world/world-gallery.tsx'),
    /href=\{galleryExhibitHref\(world\.slug\)\}/,
    'only the Gallery adds it',
  );
}

// 16, 19–22, 25–28, 33–34. The viewer state model.
const {
  nextViewerState: next,
  viewerMounted,
  detailKeyAction,
  viewerCopy,
} = viewer;
assert.equal(next('poster', 'enter'), 'loading');
assert.equal(next('loading', 'ready'), 'live');
assert.equal(next('loading', 'close'), 'poster', '27. cancel');
assert.equal(next('live', 'close'), 'poster', '25. exit');
for (const state of ['poster', 'loading', 'live'])
  assert.equal(
    next(state, 'switch'),
    'poster',
    `33–34. switching from ${state}`,
  );
assert.equal(
  next('poster', 'ready'),
  'poster',
  'a late load after close is ignored',
);
assert.equal(next('live', 'ready'), 'live');
assert.equal(next('loading', 'enter'), 'loading', 'no second iframe');
assert.equal(next('live', 'enter'), 'live');
assert.deepEqual(
  ['poster', 'loading', 'live'].map(viewerMounted),
  [false, true, true],
  '20, 26, 28. the iframe exists only while loading or live',
);
// 29–32. Escape closes the viewer first, then returns to the context; the
// arrows never switch worlds while a viewer is open.
const key = (k, state, extra = {}) =>
  detailKeyAction({
    key: k,
    viewer: state,
    modified: false,
    editable: false,
    handled: false,
    ...extra,
  });
assert.equal(key('Escape', 'loading'), 'close-viewer', '29');
assert.equal(key('Escape', 'live'), 'close-viewer', '30');
assert.equal(key('Escape', 'poster'), 'return', '31–32');
for (const k of ['ArrowRight', 'ArrowDown']) {
  assert.equal(key(k, 'poster'), 'next');
  assert.equal(key(k, 'live'), null);
  assert.equal(key(k, 'loading'), null);
}
for (const k of ['ArrowLeft', 'ArrowUp'])
  assert.equal(key(k, 'poster'), 'previous');
for (const extra of [{ modified: true }, { editable: true }, { handled: true }])
  assert.equal(key('Escape', 'live', extra), null, JSON.stringify(extra));
assert.equal(key('Enter', 'poster'), null);
assert.deepEqual(
  { ...viewerCopy.poster },
  { toggle: 'ENTER 3D WORLD', status: '' },
);
assert.deepEqual(
  { ...viewerCopy.loading },
  { toggle: 'CANCEL OPENING', status: 'Opening 3D space' },
);
assert.deepEqual(
  { ...viewerCopy.live },
  { toggle: 'EXIT 3D VIEW', status: '3D view ready' },
);

// Render the real detail components.
const images = load('data/images.ts', {
  './image-dimensions.json': json('data/image-dimensions.json'),
});
const editorialImage = load('components/shared/editorial-image.tsx', {
  '@/data/images': images,
});
const sketchfab = load('components/worlds/sketchfab-viewer.tsx', { react });
const stageModule = load('components/worlds/world-detail-stage.tsx', {
  react,
  '@/components/shared/editorial-image': editorialImage,
  './sketchfab-viewer': sketchfab,
  './world-viewer-state': viewer,
});
const detailModule = load('components/worlds/world-detail.tsx', {
  react,
  'next/link': linkModule,
  '@/lib/world-detail-context': context,
  './world-detail-stage': stageModule,
  './world-detail-info': load('components/worlds/world-detail-info.tsx'),
  './world-thumbnail-rail': load('components/worlds/world-thumbnail-rail.tsx'),
  './world-viewer-state': viewer,
});
const detail = (initialWorld, browse, ctx) =>
  render(detailModule.WorldDetail, {
    initialWorld,
    worlds: browse,
    context: ctx,
  });
const crumb = (html) =>
  html.match(/<p class="world-detail-crumb eyebrow">([\s\S]*?)<\/p>/)[1];
const rail = (html) =>
  [
    ...(
      html.match(/aria-label="Other worlds"[\s\S]*?<\/nav>/)?.[0] ?? ''
    ).matchAll(/aria-label="Open ([^"]+)"/g),
  ].map(([, t]) => t);
const kitchen = worlds.find(({ slug }) => slug === 'modern-kitchen');
{
  // 5, 7, 11, 13. Gallery context: the room's breadcrumb, its curation, its count.
  const html = detail(kitchen, galleryExhibits, gallery);
  assert.match(
    crumb(html),
    /^<a href="\/world\/gallery#modern-kitchen"><span class="sr-only">Back to <\/span>ROOM 01 \/ GALLERY<\/a>/,
  );
  assert.deepEqual(
    rail(html),
    galleryExhibits.map((w) => w.title),
  );
  assert.match(
    html,
    /<span class="eyebrow">01(?:<!-- -->)? \/ (?:<!-- -->)?04<\/span>/,
  );
  // 6, 8, 12. Catalogue context: unchanged breadcrumb, every world.
  const plain = detail(kitchen, worlds, catalogue);
  assert.match(
    crumb(plain),
    /^<a href="\/worlds#modern-kitchen">3D WORLDS<\/a>/,
  );
  assert.deepEqual(
    rail(plain),
    worlds.map((w) => w.title),
  );
  // 13. A smaller curation counts itself, not the catalogue.
  const subset = galleryExhibits.slice(1, 3);
  const small = detail(subset[0], subset, gallery);
  assert.deepEqual(
    rail(small),
    subset.map((w) => w.title),
  );
  assert.match(
    small,
    /<span class="eyebrow">01(?:<!-- -->)? \/ (?:<!-- -->)?02<\/span>/,
  );
  assert.match(
    small,
    /class="world-detail-stage-count eyebrow" aria-hidden="true">01(?:<!-- -->)? \/ (?:<!-- -->)?02</,
  );
  // 16–18. The first paint is the poster: no iframe, no Sketchfab URL.
  for (const page of [html, plain, small]) {
    assert.equal((page.match(/<h1\b/g) ?? []).length, 1);
    assert.match(page, /data-viewer="poster"/);
    assert.doesNotMatch(page, /<iframe|sketchfab\.com\/models/);
  }
}
{
  // 19–28, 36, 37, 39, 40. The stage in each state.
  const stage = (state) =>
    render(stageModule.WorldDetailStage, {
      world: kitchen,
      index: 1,
      total: 4,
      viewer: state,
      onEnter() {},
      onClose() {},
      onReady() {},
    });
  const states = Object.fromEntries(
    ['poster', 'loading', 'live'].map((s) => [s, stage(s)]),
  );
  for (const [state, html] of Object.entries(states)) {
    assert.match(html, new RegExp(`data-viewer="${state}"`));
    assert.match(
      html,
      /<div class="editorial-image world-detail-poster"><img\b/,
      `21. the poster stays mounted (${state})`,
    );
    assert.equal(
      (
        html.match(
          /<button class="world-detail-explore eyebrow" type="button">/g,
        ) ?? []
      ).length,
      1,
      `39. one stable toggle (${state})`,
    );
    assert.match(html, new RegExp(`<span>${viewerCopy[state].toggle}</span>`));
    assert.match(
      html,
      new RegExp(
        `<output class="world-detail-status eyebrow" aria-live="polite">${viewerCopy[state].status}</output>`,
      ),
      '40',
    );
    assert.match(
      html,
      /<button type="button" class="world-detail-fullscreen" aria-label="View Modern Kitchen fullscreen">/,
      '37',
    );
    assert.ok(
      (html.match(/<iframe\b/g) ?? []).length <= 1,
      '36. at most one iframe',
    );
  }
  assert.doesNotMatch(states.poster, /<iframe|sketchfab/i, '18');
  for (const state of ['loading', 'live']) {
    assert.equal(
      (states[state].match(/<iframe\b/g) ?? []).length,
      1,
      `20. one viewer (${state})`,
    );
    assert.match(
      states[state],
      /<iframe src="https:\/\/sketchfab\.com\/models\/9843a830b96142a9a53f45f25304d93c\/embed\?autostart=1&amp;ui_infos=0&amp;ui_stop=0" title="Modern Kitchen — interactive 3D view"/,
    );
  }
  assert.match(
    states.loading,
    /<div class="world-sketchfab-viewer" inert="">/,
    'inert until live',
  );
  assert.match(
    states.live,
    /<div class="world-sketchfab-viewer">/,
    '23. interactive when live',
  );
  // The toggle precedes the viewer in the DOM: Tab goes from Exit into the scene.
  assert.ok(
    states.live.indexOf('world-detail-explore') <
      states.live.indexOf('<iframe'),
  );
}

// 23–24, 38. CSS: the poster yields only when live; the viewer takes no
// pointer while loading; annotations withdraw; reduced motion cuts.
{
  const css = read('components/worlds/worlds.css');
  const rule = (selector) => {
    const start = css.indexOf(`${selector} {`);
    assert(start >= 0, selector);
    return css.slice(start, css.indexOf('}', start));
  };
  const live = rule(
    ".world-detail-stage[data-viewer='live'] .world-detail-poster",
  );
  assert.match(live, /opacity: 0;/);
  assert.match(live, /pointer-events: none;/);
  assert.match(
    live,
    /transition: opacity var\(--motion-duration-normal\) var\(--motion-ease-primary\);/,
  );
  assert.match(
    rule(".world-detail-stage[data-viewer='loading'] .world-sketchfab-viewer"),
    /pointer-events: none;/,
  );
  assert.match(
    css,
    /\.world-detail-stage:not\(\[data-viewer='poster'\]\) \.world-detail-stage-notes \{\s*opacity: 0;/,
  );
  assert.match(
    rule('.world-sketchfab-viewer'),
    /z-index: 0;[\s\S]*inset: var\(--viewer-band\) 0 0;/,
  );
  assert.match(rule('.world-detail-poster'), /z-index: 1;/);
  assert.match(
    rule(".world-detail-stage[data-viewer='live'] .world-detail-explore"),
    /min-height: 44px;/,
  );
  assert.match(
    css,
    /\.world-detail-fullscreen \{[^}]*width: 44px; height: 44px;/,
  );
  // Touched timings use the motion tokens.
  for (const selector of [
    '.world-detail-poster',
    '.world-detail-stage-frame',
    '.world-detail-status',
    ".world-detail-stage[data-viewer='live'] .world-detail-explore",
  ])
    assert.doesNotMatch(
      rule(selector),
      /\d+ms|[\s:,]ease(?:-in|-out|-in-out)?\b/,
      `${selector}: tokens only`,
    );
  const reduced = css.slice(
    css.lastIndexOf('@media (prefers-reduced-motion: reduce)'),
  );
  assert.match(
    reduced,
    /\.world-detail-poster,[\s\S]*transform: none !important;\s*transition: none !important;/,
    '38',
  );
  assert.match(
    read('app/globals.css'),
    /prefers-reduced-motion: reduce[\s\S]*animation: none !important;[\s\S]*transition: none !important;/,
  );
}

// 33–35, 41. Sources: one owner, switching closes first, history keeps the
// context, no frame loop, fullscreen on the stage, no new dependency.
{
  const page = read('components/worlds/world-detail.tsx');
  assert.match(page, /useState<ViewerState>\('poster'\)/, '16');
  assert.match(
    page,
    /if \(world\.slug === activeSlug\) return;\s*\/\/[^\n]*\n[^\n]*\n\s*send\('switch'\);/,
    '33–35. switching closes the viewer first',
  );
  assert.match(
    page,
    /window\.history\.pushState\(\s*\{ world: world\.slug \},\s*'',\s*worldDetailHref\(world\.slug, context\),?\s*\)/,
    '9–10',
  );
  assert.match(
    page,
    /window\.location\.assign\(worldReturnHref\(active\.slug, context\)\)/,
    '31–32',
  );
  assert.doesNotMatch(
    page,
    /onEnter=\{[^}]*select|autoload|preload/i,
    '35. no automatic load',
  );
  for (const file of [
    'world-detail.tsx',
    'world-viewer-state.ts',
    'sketchfab-viewer.tsx',
  ])
    assert.doesNotMatch(
      read(`components/worlds/${file}`),
      /requestAnimationFrame|setInterval/,
      `41. ${file}`,
    );
  const stage = read('components/worlds/world-detail-stage.tsx');
  assert.equal(
    (stage.match(/requestAnimationFrame\(/g) ?? []).length,
    1,
    '41. only the existing per-move depth frame',
  );
  assert.match(
    stage,
    /if \(!stage \|\| viewer !== 'poster'\) return;/,
    'depth rests while the viewer is open',
  );
  assert.equal((stage.match(/requestFullscreen/g) ?? []).length, 1);
  assert.match(stage, /stageRef\.current\?\.requestFullscreen\?\.\(\)/, '37');
  assert.equal((stage.match(/<SketchfabViewer\b/g) ?? []).length, 1, '36');
  const viewerSource = read('components/worlds/sketchfab-viewer.tsx');
  assert.doesNotMatch(
    viewerSource,
    /postMessage|<script|sketchfab-viewer-[\d.]+\.js/i,
    'no Sketchfab API',
  );
  const {
    dependencies = {},
    devDependencies = {},
    scripts,
  } = json('package.json');
  for (const name of [
    'gsap',
    'lenis',
    'framer-motion',
    '@sketchfab/viewer-api',
    'zustand',
    'xstate',
  ])
    assert(!(name in dependencies) && !(name in devDependencies), `no ${name}`);
  assert.equal(scripts['check:exhibit'], 'node scripts/check-exhibit.mjs');
  const route = read('app/worlds/[slug]/page.tsx');
  assert.match(route, /from: \(await searchParams\)\.from/);
  assert.match(route, /curatedSlugs: galleryExhibits\.map/);
}

console.log(
  'Exhibit passed: Gallery context only for curated slugs (everything else falls back to the catalogue), Gallery and catalogue URLs, returns and browse sets, a poster-first detail with no iframe, one stable toggle and a live status through POSTER → LOADING → LIVE, at most one Sketchfab iframe, Escape closing the viewer before leaving, switching always back to the poster, tokens and a reduced-motion cut, and no frame loop or new dependency.',
);
