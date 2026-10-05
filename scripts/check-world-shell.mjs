/** TP3D PASS 08 — a Gallery exhibit inside the World shell. The real detail
 * route is rendered in every context: a validated Gallery visit gets the
 * World chrome and the server shell marker around the very same detail
 * markup; the catalogue and every invalid context get the PASS 07 page,
 * byte for byte. CSS, viewer and source contracts follow. Browser QA (the
 * PASS 08 record) covers first frames, focus, layout and the live viewer.
 * Numbers refer to the PASS 08 brief; 39–44 are the existing commands. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { existsSync, readdirSync } from 'node:fs';
import {
  load,
  read,
  root,
  linkModule,
  render,
} from './lib/render-server-component.mjs';

const require = createRequire(import.meta.url);
const byCodeUnit = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const react = require('react');
const { jsx } = require('react/jsx-runtime');
const { renderToStaticMarkup } = require('react-dom/server');
const json = (path) => JSON.parse(read(path));
const digest = (path) =>
  createHash('sha256')
    .update(read(path).replace(/\r\n/g, '\n'))
    .digest('hex')
    .slice(0, 16);

const context = load('lib/world-detail-context.ts');
const viewer = load('components/worlds/world-viewer-state.ts');
const worldsModule = load('data/worlds.ts');
const galleryModule = load('data/world-gallery.ts', {
  './worlds': worldsModule,
});
const building = load('data/world-building.ts');
const worlds = [...worldsModule.worlds];
const galleryExhibits = [...galleryModule.galleryExhibits];
const worldRooms = [...building.worldRooms];
const galleryRoom = worldRooms.find(({ id }) => id === 'gallery');
const gallery = context.resolveWorldDetailContext({
  from: 'gallery',
  slug: 'modern-kitchen',
  curatedSlugs: galleryExhibits.map(({ slug }) => slug),
  galleryRoom,
});
const catalogue = context.CATALOGUE_CONTEXT;

// The real modules, wired the way the route wires them.
const images = load('data/images.ts', {
  './image-dimensions.json': json('data/image-dimensions.json'),
});
const editorialImage = load('components/shared/editorial-image.tsx', {
  '@/data/images': images,
});
const stageModule = load('components/worlds/world-detail-stage.tsx', {
  react,
  '@/components/shared/editorial-image': editorialImage,
  './sketchfab-viewer': load('components/worlds/sketchfab-viewer.tsx', {
    react,
  }),
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
const shellModule = load('components/world/world-detail-shell.tsx', {
  './world-chrome': load('components/world/world-chrome.tsx', {
    'next/link': linkModule,
    '@/data/world-building': building,
    './world-map-disclosure': load(
      'components/world/world-map-disclosure.tsx',
      {
        react,
        './world-map-escape': load('components/world/world-map-escape.ts'),
      },
    ),
  }),
});
const NOT_FOUND = 'NEXT_NOT_FOUND';
const routeFor = (curation = galleryModule) =>
  load('app/worlds/[slug]/page.tsx', {
    'next/navigation': {
      notFound() {
        throw new Error(NOT_FOUND);
      },
    },
    '@/data/worlds': worldsModule,
    '@/data/world-gallery': curation,
    '@/data/world-building': building,
    '@/lib/world-detail-context': context,
    '@/components/worlds/world-detail': detailModule,
    '@/components/world/world-detail-shell': shellModule,
  });
const route = routeFor();
const visit = async (slug, searchParams = {}, page = route) =>
  renderToStaticMarkup(
    await page.default({
      params: Promise.resolve({ slug }),
      searchParams: Promise.resolve(searchParams),
    }),
  );
const detail = (slug, browse, ctx) =>
  render(detailModule.WorldDetail, {
    initialWorld: worlds.find((world) => world.slug === slug),
    worlds: browse,
    context: ctx,
  });

// React hoists the poster and rail image hints ahead of the markup.
const split = (html) => {
  const hints = html.match(/^(?:<link rel="preload"[^>]*\/>)*/)[0];
  return { hints, body: html.slice(hints.length) };
};
const MARKER = '<div class="world-chamber" data-world-detail-shell="gallery">';
const chromeTag = /<header class="wl-chrome wl-chrome--room">/g;
const anyChrome = /class="wl-chrome\b/;
const tag = (html, className) => {
  const found = html.match(
    new RegExp(`<(?:a|div)\\b[^>]*class="${className}"[^>]*>`, 'g'),
  );
  assert(found, className);
  return found;
};
const href = (t) => t.match(/href="([^"]*)"/)?.[1] ?? null;
const crumb = (html) =>
  html.match(/<p class="world-detail-crumb eyebrow">([\s\S]*?)<\/p>/)[1];
const rail = (html) =>
  [
    ...(
      html.match(/aria-label="Other worlds"[\s\S]*?<\/nav>/)?.[0] ?? ''
    ).matchAll(/aria-label="Open ([^"]+)"/g),
  ].map(([, title]) => title);

// 1, 4, 6–11, 29. A validated Gallery visit: the shell around the exact
// Gallery-context detail, with the room's chrome on top.
for (const exhibit of galleryExhibits) {
  const page = split(await visit(exhibit.slug, { from: 'gallery' }));
  const inner = split(detail(exhibit.slug, galleryExhibits, gallery));
  const html = page.body;
  assert.equal(page.hints, inner.hints, 'the same image hints');
  assert.equal(
    html,
    `${MARKER}${html.slice(MARKER.length, html.indexOf(inner.body))}${inner.body}</div>`,
    `${exhibit.slug}: the marker wraps the World chrome and the unchanged detail`,
  );
  assert.equal((html.match(chromeTag) ?? []).length, 1, '1. one World chrome');
  assert.equal((html.match(/data-world-detail-shell=/g) ?? []).length, 1, '4');
  assert.equal((html.match(/<h1\b/g) ?? []).length, 1, 'one exhibit title');
  assert.match(
    crumb(html),
    new RegExp(
      `^<a href="/world/gallery#${exhibit.slug}"><span class="sr-only">Back to </span>ROOM 01 / GALLERY</a>`,
    ),
    '11',
  );
  assert.deepEqual(
    rail(html),
    galleryExhibits.map(({ title }) => title),
    '29',
  );
}
{
  const { body } = split(await visit('modern-kitchen', { from: 'gallery' }));
  assert(body.startsWith(MARKER));
  const chrome = body.slice(MARKER.length, body.indexOf('<main'));
  // 6. The Gallery is the current room, still a link, "You are here".
  const current = tag(chrome, 'wl-map-entry').filter((t) =>
    /aria-current="page"/.test(t),
  );
  assert.equal(current.length, 1);
  assert.equal(href(current[0]), '/world/gallery');
  assert.match(
    chrome,
    /aria-current="page"><span class="wl-number">01<\/span><span class="wl-map-name">Gallery<\/span><span class="wl-status">You are here<\/span>/,
  );
  // 7–8. Back to the Lobby, out to the website; never through /worlds.
  assert.deepEqual(tag(chrome, 'wl-back').map(href), ['/world']);
  assert.deepEqual(tag(chrome, 'wl-exit').map(href), ['/']);
  assert.deepEqual(tag(chrome, 'wl-wordmark').map(href), ['/']);
  assert.doesNotMatch(chrome, /href="\/worlds/);
  // 9–10. The World map is worldRooms, in order; planned rooms are text.
  assert.deepEqual(
    [
      ...chrome.matchAll(/data-world-room="([a-z]+)" data-status="([a-z]+)"/g),
    ].map(([, id, status]) => `${id}:${status}`),
    worldRooms.map(({ id, status }) => `${id}:${status}`),
  );
  for (const room of worldRooms.filter(({ href: h }) => !h)) {
    const item = chrome.match(
      new RegExp(`data-world-room="${room.id}"[^>]*>([\\s\\S]*?)</li>`),
    )[1];
    assert.match(item, /^<div class="wl-map-entry">/, `10. ${room.id}`);
    assert.doesNotMatch(item, /<a\b|href=/, `10. ${room.id}`);
  }
  assert.equal(
    (chrome.match(/<a\b/g) ?? []).length,
    3 + worldRooms.filter(({ href: h }) => h).length,
    'wordmark, Lobby, Exit and the open rooms are the only links',
  );
}

// 2–3, 5, 12, 30. The catalogue and every invalid context: the PASS 07 page,
// byte for byte — no marker, no World chrome, the plain breadcrumb.
for (const { slug, searchParams } of [
  { slug: 'modern-kitchen', searchParams: {} },
  { slug: 'modern-bathroom', searchParams: {} },
  { slug: 'modern-kitchen', searchParams: { from: 'lobby' } },
  { slug: 'modern-kitchen', searchParams: { from: 'GALLERY' } },
  { slug: 'modern-kitchen', searchParams: { from: 'gallery ' } },
  { slug: 'modern-kitchen', searchParams: { from: '' } },
  { slug: 'modern-kitchen', searchParams: { from: ['gallery', 'gallery'] } },
  { slug: 'modern-kitchen', searchParams: { source: 'gallery' } },
]) {
  const label = `${slug} ${JSON.stringify(searchParams)}`;
  const html = await visit(slug, searchParams);
  assert.equal(html, detail(slug, worlds, catalogue), `${label}: PASS 07 page`);
  assert.doesNotMatch(html, anyChrome, `2–3. ${label}`);
  assert.doesNotMatch(
    html,
    /data-world-detail-shell|world-chamber/,
    `5. ${label}`,
  );
  assert.match(
    crumb(html),
    new RegExp(`^<a href="/worlds#${slug}">3D WORLDS</a>`),
    `12. ${label}`,
  );
  assert.deepEqual(
    rail(html),
    worlds.map(({ title }) => title),
    '30',
  );
}
{
  // 3. A world outside the curation never enters the Gallery shell.
  const smaller = {
    ...galleryModule,
    galleryExhibits: galleryExhibits.slice(0, 3),
  };
  const outside = galleryExhibits[3].slug;
  const html = await visit(outside, { from: 'gallery' }, routeFor(smaller));
  assert.doesNotMatch(html, anyChrome);
  assert.doesNotMatch(html, /data-world-detail-shell/);
  assert.equal(html, detail(outside, worlds, catalogue));
  await assert.rejects(visit('not-a-world', { from: 'gallery' }), {
    message: NOT_FOUND,
  });
}

// 31–32. Next/previous and the rail keep each context's URL.
for (const { slug } of galleryExhibits) {
  assert.equal(
    context.worldDetailHref(slug, gallery),
    `/worlds/${slug}?from=gallery`,
  );
  assert.equal(context.worldDetailHref(slug, catalogue), `/worlds/${slug}`);
}

// Metadata is the PASS 07 metadata in every context (canonical deferred).
for (const { slug, title, description } of worlds) {
  const metadata = await route.generateMetadata({
    params: Promise.resolve({ slug }),
    searchParams: Promise.resolve({ from: 'gallery' }),
  });
  assert.deepEqual({ ...metadata }, { title, description }, slug);
}

// 22–28. The viewer is PASS 07's, unchanged: same files, same state model,
// zero Sketchfab before ENTER, a live viewer that stays interactive inside
// the chamber, Exit 3D View, fullscreen, and Escape closing the viewer first.
// Locked files. PASS 09 deliberately revised two of them (the detail's
// definite height, short-landscape stack, 44px switcher targets and focus
// mat in worlds.css; the World map's Escape island in world-chrome.tsx);
// every other file is still PASS 07's.
const LOCKED = {
  'components/worlds/world-detail.tsx': 'b91f4b1cd4481de0',
  'components/worlds/world-detail-stage.tsx': 'f356d911214f6601',
  'components/worlds/sketchfab-viewer.tsx': '6db839abf80c3b6e',
  'components/worlds/world-viewer-state.ts': 'e5d787ade1dd6ab2',
  'components/worlds/world-detail-info.tsx': 'f7eaf1e43da3db6a',
  'components/worlds/world-thumbnail-rail.tsx': '46501161a369eb47',
  'components/worlds/worlds.css': 'afb4346cb0916ff6',
  'lib/world-detail-context.ts': 'a7f91f21ecd0538a',
  'components/world/world-chrome.tsx': '3a37f3c5c372903f',
  'app/layout.tsx': 'd1f018f9f20b3294',
  'components/layout/site-header.tsx': 'dfcfe66f79f370b1',
  'components/layout/site-footer.tsx': '8e4ed9e15415afcf',
};
for (const [path, hash] of Object.entries(LOCKED))
  assert.equal(digest(path), hash, `${path} is locked`);
{
  const { nextViewerState: next, detailKeyAction } = viewer;
  assert.equal(next('poster', 'enter'), 'loading');
  assert.equal(next('loading', 'ready'), 'live');
  assert.equal(next('live', 'close'), 'poster');
  const key = (k, state) =>
    detailKeyAction({
      key: k,
      viewer: state,
      modified: false,
      editable: false,
      handled: false,
    });
  assert.deepEqual(
    ['poster', 'loading', 'live'].map((state) => key('Escape', state)),
    ['return', 'close-viewer', 'close-viewer'],
    '28',
  );
  for (const html of [
    await visit('modern-kitchen', { from: 'gallery' }),
    await visit('modern-kitchen'),
  ]) {
    assert.match(html, /data-viewer="poster"/);
    assert.doesNotMatch(html, /<iframe|sketchfab\.com\/models/, '23–24');
  }
  const chamber = (state) =>
    render(shellModule.WorldDetailShell, {
      children: jsx(stageModule.WorldDetailStage, {
        world: worlds[0],
        index: 1,
        total: galleryExhibits.length,
        viewer: state,
        onEnter() {},
        onClose() {},
        onReady() {},
      }),
    });
  const live = chamber('live');
  assert.equal((live.match(/<iframe\b/g) ?? []).length, 1, 'one viewer');
  assert.match(live, /<div class="world-sketchfab-viewer"><iframe\b/, '25');
  assert.match(live, /<span>EXIT 3D VIEW<\/span>/, '26');
  assert.match(live, /class="world-detail-fullscreen" aria-label="View /, '27');
  assert.doesNotMatch(chamber('poster'), /<iframe|sketchfab\.com\/models/);
}

// CSS. Every rule of the chamber is scoped to the server marker; the
// editorial chrome is display: none from the first paint; the catalogue's
// stylesheet is PASS 07's.
const rules = (css) =>
  [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .map(([, selectors, body]) => ({
      selectors: selectors
        .trim()
        .split(/,\s*/)
        .map((s) => s.replace(/\s+/g, ' ')),
      body,
    }))
    .filter(({ selectors }) => !selectors[0].startsWith('@'));
const ROOT = ":root:has([data-world-detail-shell='gallery'])";
const shellCss = read('components/world/world-detail-shell.css');
const shellRules = rules(shellCss);
const shellRule = (selector) => {
  const found = shellRules.find(({ selectors }) =>
    selectors.includes(selector),
  );
  assert(found, selector);
  return found.body;
};
for (const { selectors } of shellRules)
  for (const selector of selectors)
    assert(
      selector.startsWith('.world-chamber') || selector.startsWith(ROOT),
      `scoped to the marker: ${selector}`,
    );
{
  // 13–15. Display none: out of sight, the tab order and the a11y tree.
  for (const part of ['site-header', 'site-footer']) {
    const body = shellRule(`${ROOT} .${part}`);
    assert.match(body, /^\s*display: none;\s*$/, `13–15. ${part}`);
  }
  assert.doesNotMatch(shellCss, /opacity: 0;|visibility|aria-hidden/);
  // 16–17. Nowhere else does a stylesheet hide the editorial chrome, and the
  // layout still mounts it on every non-World path, the catalogue included.
  const cssFiles = (dir) =>
    readdirSync(new URL(dir, root), { recursive: true })
      .filter((file) => file.endsWith('.css'))
      .map((file) => `${dir}${file.replace(/\\/g, '/')}`);
  // TP3D PASS 11 adds the one other server marker that may do this: an
  // object study opened from Room 02 (check:object-study covers it).
  const markers = {
    'components/world/world-detail-shell.css': ROOT,
    'components/world/object-study-shell.css':
      ":root:has([data-product-detail-shell='objects'])",
  };
  for (const file of [...cssFiles('app/'), ...cssFiles('components/')])
    for (const { selectors, body } of rules(read(file)))
      if (/display:\s*none/.test(body))
        for (const selector of selectors)
          if (/\.site-(?:header|footer)$/.test(selector))
            assert(
              file in markers && selector.startsWith(markers[file]),
              `${file}: ${selector}`,
            );
  const layout = read('app/layout.tsx');
  assert.match(
    layout,
    /<EditorialChrome>\s*<SiteHeader \/>\s*<\/EditorialChrome>/,
  );
  assert.match(
    layout,
    /<EditorialChrome>\s*<SiteFooter \/>\s*<\/EditorialChrome>/,
  );
  const { isWorldPath } = building;
  for (const path of ['/worlds', '/worlds/modern-kitchen', '/'])
    assert.equal(isWorldPath(path), false, path);
  for (const path of ['/world', '/world/gallery'])
    assert.equal(isWorldPath(path), true, path);
  // No client effect, no observer, no DOM mutation: the marker decides.
  for (const file of [
    'components/layout/editorial-chrome.tsx',
    'components/world/world-detail-shell.tsx',
    'app/worlds/[slug]/page.tsx',
  ])
    assert.doesNotMatch(
      read(file).replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, ''),
      /useEffect|useLayoutEffect|querySelector|MutationObserver|\.style\.|setInterval|requestAnimationFrame/,
      file,
    );
  const shellSource = read('components/world/world-detail-shell.tsx');
  assert.doesNotMatch(
    shellSource,
    /^['"]use client['"]/m,
    'a server component',
  );
  assert.match(shellSource, /import '\.\/world-detail-shell\.css';/);
}
{
  // 18. The World ground behind everything, from the root down.
  assert.match(read('app/globals.css'), /--world-ground: #1c1712;/);
  assert.match(shellRule(ROOT), /background: var\(--world-ground\);/);
  assert.match(shellRule(`${ROOT} body`), /color-scheme: dark;/);
  assert.match(
    shellRule('.world-chamber'),
    /background: var\(--world-ground\);/,
  );
  // 19. The World's spatial type and tokens.
  assert.match(
    read('components/world/world-detail-shell.tsx'),
    /import '@\/components\/shared\/spatial-type\.css';/,
  );
  const chromeCss = read('components/world/world-chrome.css');
  const tokens = rules(chromeCss).find(({ selectors }) =>
    selectors.includes('.world-chamber'),
  );
  assert(tokens, '19. the chamber shares the World tokens');
  assert.match(tokens.body, /--wl-serif: 'Cormorant Spatial'/);
  assert.match(tokens.body, /--wl-sans: 'Manrope Spatial'/);
  assert.match(chromeCss, /\.world-chamber :focus-visible/);
  assert.match(
    read('components/shared/spatial-type.css'),
    /font-family: 'Manrope Spatial';/,
  );
  assert.match(
    shellRule('.world-chamber .world-detail-info h1'),
    /font-family: var\(--wl-serif\);/,
  );
  // 20. The interpretation panel is wall text on the World ground.
  const info = shellRule('.world-chamber .world-detail-info');
  assert.match(info, /background: transparent;/);
  assert.match(info, /border-left: 1px solid var\(--wc-rule\);/);
  assert.match(
    shellRule('.world-chamber .world-detail-info h1'),
    /color: var\(--wl-ivory\);/,
  );
  assert.match(
    shellRule('.world-chamber .world-detail'),
    /color: var\(--wl-ivory\);/,
  );
  // 21. The catalogue's light panel is untouched (worlds.css is locked above).
  assert.match(
    rules(read('components/worlds/worlds.css')).find(({ selectors }) =>
      selectors.includes('.world-detail-info'),
    ).body,
    /background: var\(--background\);/,
  );
  // The chamber changes surfaces and ink only: no stacking, pointer, motion
  // or layout-locking rule that could reach the PASS 07 viewer.
  const declarations = shellCss.replace(/\/\*[\s\S]*?\*\//g, '');
  assert.doesNotMatch(
    declarations,
    /z-index|pointer-events|inert|position: (?:fixed|sticky)|overflow: hidden|(?<!min-)height: 100|transition|animation|@keyframes/,
  );
  assert.equal((declarations.match(/display:/g) ?? []).length, 1);
}

// 33–38. No route, no redirect, no new technology, no new asset.
{
  const pages = readdirSync(new URL('app/', root), { recursive: true })
    .map((file) => file.replace(/\\/g, '/'))
    .filter((file) => /(?:^|\/)(?:page|route)\.(?:tsx?|jsx?)$/.test(file))
    .sort(byCodeUnit);
  assert.deepEqual(
    pages,
    [
      'about/page.tsx',
      'collections/[slug]/page.tsx',
      'collections/page.tsx',
      'contact/page.tsx',
      'experience/[slug]/page.tsx',
      'journal/[slug]/page.tsx',
      'journal/page.tsx',
      'materials/[slug]/page.tsx',
      'materials/page.tsx',
      'page.tsx',
      'products/[slug]/page.tsx',
      'products/page.tsx',
      'projects/[slug]/page.tsx',
      'projects/page.tsx',
      'spaces/[slug]/page.tsx',
      'spaces/page.tsx',
      'world/gallery/page.tsx',
      // TP3D PASS 10: Room 02, the one route added since PASS 08.
      'world/objects/page.tsx',
      'world/page.tsx',
      'worlds/[slug]/page.tsx',
      'worlds/page.tsx',
    ]
      .concat(
        // TP3D PASS 13: Room 03, the second room route added since PASS 08.
        ['world/archive/page.tsx'],
        // TP3D PASS 14: Room 04, the third.
        ['world/lab/page.tsx'],
        // TP3D PASS 15: Room 05, the fourth; the building is complete.
        ['world/studio/page.tsx'],
      )
      .sort(byCodeUnit),
    '33. no route added by the World shell',
  );
  assert(!existsSync(new URL('app/world/gallery/[slug]', root)));
  for (const file of ['middleware.ts', 'middleware.js', 'proxy.ts'])
    assert(!existsSync(new URL(file, root)), `34. no ${file}`);
  const page = read('app/worlds/[slug]/page.tsx');
  assert.doesNotMatch(page, /redirect|NextResponse|location\./i, '34');
  const vercel = json('vercel.json');
  for (const key of ['redirects', 'rewrites', 'routes'])
    assert(!(key in vercel), `34. vercel.json ${key}`);
  assert.doesNotMatch(read('next.config.ts'), /redirects|rewrites/, '34');
  // 35, 37. The dependency set is PASS 07's (Three.js is the homepage sky's,
  // lazy-loaded there and imported nowhere else); no animation library.
  const {
    dependencies = {},
    devDependencies = {},
    scripts,
  } = json('package.json');
  const packages = Object.keys({ ...dependencies, ...devDependencies }).sort(
    byCodeUnit,
  );
  assert.equal(
    createHash('sha256')
      .update(JSON.stringify(packages))
      .digest('hex')
      .slice(0, 16),
    'fe513ca9a824db7d',
    '35, 37. no dependency added or removed',
  );
  for (const name of [
    '@react-three/fiber',
    '@react-three/drei',
    'gsap',
    'framer-motion',
    'motion',
    'lenis',
    '@sketchfab/viewer-api',
  ])
    assert(!packages.includes(name), `35, 37. ${name}`);
  const sources = (dir) =>
    readdirSync(new URL(dir, root), { recursive: true })
      .filter((file) => /\.(?:tsx?|jsx?|mjs)$/.test(file))
      .map((file) => `${dir}${file.replace(/\\/g, '/')}`);
  assert.deepEqual(
    ['app/', 'components/', 'lib/', 'hooks/', 'data/']
      .flatMap(sources)
      .filter((file) =>
        /from ['"]three['"]|import\(['"]three['"]\)/.test(read(file)),
      ),
    ['components/home/experience/atmospheric-sky-renderer.ts'],
    '35. Three.js stays on the homepage',
  );
  for (const file of [
    'components/world/world-detail-shell.tsx',
    'components/world/world-detail-shell.css',
    'app/worlds/[slug]/page.tsx',
  ]) {
    const source = read(file);
    assert.doesNotMatch(
      source,
      /<canvas|getContext|three|webgl/i,
      `35–36. ${file}`,
    );
    assert.doesNotMatch(
      source,
      /https?:|url\(|@import|<img|<link|<script/,
      `38. ${file}`,
    );
  }
  // 39–44 run as their own commands; the gate keeps them wired.
  assert.equal(
    scripts['check:world-shell'],
    'node scripts/check-world-shell.mjs',
  );
  for (const name of [
    'check:world',
    'check:gallery',
    'check:exhibit',
    'check:worlds',
    'check:home',
    'build',
  ])
    assert(scripts[name], name);
}

console.log(
  'World shell passed: a validated Gallery visit renders the World chrome (Gallery current, Back to Lobby → /world, Exit → /, the World map from worldRooms with planned rooms as text) and the server shell marker around the unchanged Gallery-context detail; the catalogue and every invalid context render the PASS 07 page byte for byte; the editorial header and footer are display: none only under the marker; the chamber is scoped to the marker on the World ground in spatial type; the PASS 07 viewer files, state model, Escape hierarchy and zero-Sketchfab first paint are unchanged; metadata is context-free; no route, redirect, canvas, Three.js, animation library or external asset was added.',
);
