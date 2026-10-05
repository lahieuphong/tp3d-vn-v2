/** TP3D PASS 06 — Room 01, Gallery. Curation, data, route, chrome, markup,
 * CSS and source contracts. The real server components are rendered to
 * static markup; check-site covers the served HTML, and browser QA (the
 * PASS 06 record) covers motion, keyboard and layout. Numbers refer to the
 * PASS 06 brief. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import {
  load,
  read,
  root,
  linkModule,
  nullComponent,
  render,
} from './lib/render-server-component.mjs';

const json = (path) => JSON.parse(read(path));
const building = load('data/world-building.ts');
const worldsModule = load('data/worlds.ts');
const gallery = load('data/world-gallery.ts', { './worlds': worldsModule });
// Arrays built inside the loader's context are re-spread into this realm so
// deepStrictEqual compares values, not Array prototypes. Elements keep their
// identity.
const worlds = [...worldsModule.worlds];
const galleryExhibitSlugs = [...gallery.galleryExhibitSlugs];
const galleryExhibits = [...gallery.galleryExhibits];
const worldRooms = [...building.worldRooms];
const { worldsEdition } = worldsModule;
const { resolveGalleryExhibits } = gallery;
const { isWorldPath, WORLD_PATH } = building;

// 3, 10–11. Inside the World; the Gallery opens its own room. Since TP3D
// PASS 10 Objects opens its own room too, since PASS 13 the Archive and since
// PASS 14 the Lab; Studio stays planned.
assert.equal(isWorldPath('/world/gallery'), true);
assert.deepEqual(
  [...worldRooms].map(({ id, status, href }) => [id, status, href]),
  [
    ['gallery', 'available', '/world/gallery'],
    ['objects', 'available', '/world/objects'],
    ['archive', 'available', '/world/archive'],
    ['lab', 'available', '/world/lab'],
    ['studio', 'planned', null],
  ],
);
assert.equal(worldRooms[0].futurePath, '/world/gallery');

// 12–16. Exhibits come from `worlds`: a curation of slugs, resolved in order.
assert.deepEqual(
  [...galleryExhibitSlugs],
  [
    'modern-kitchen',
    'white-modern-living-room',
    'minimalistic-modern-bedroom',
    'modern-bathroom',
  ],
  'curated in authored catalogue order',
);
assert.equal(
  new Set(galleryExhibitSlugs).size,
  galleryExhibitSlugs.length,
  'no exhibit hangs twice',
);
assert.equal(
  galleryExhibits.length,
  galleryExhibitSlugs.length,
  'every curated slug resolves to a World',
);
galleryExhibits.forEach((exhibit, index) => {
  assert.equal(exhibit.slug, galleryExhibitSlugs[index], 'curation order');
  assert(
    worlds.includes(exhibit),
    `${exhibit.slug}: the catalogue object itself, not a copy`,
  );
});
assert.deepEqual(
  [...new Set(galleryExhibits.map((world) => world.slug))].sort((a, b) =>
    a.localeCompare(b),
  ),
  worlds.map((world) => world.slug).sort((a, b) => a.localeCompare(b)),
  'the four current worlds all hang in the Gallery',
);
assert.deepEqual(
  [...resolveGalleryExhibits(galleryExhibitSlugs, worlds)].map((w) => w.slug),
  [...galleryExhibits].map((w) => w.slug),
  'deterministic',
);
assert.equal(
  resolveGalleryExhibits(['not-a-world'], worlds).length,
  0,
  'an unknown slug never renders (and fails the length check above)',
);
{
  const source = read('data/world-gallery.ts');
  for (const key of ['title', 'description', 'image', 'src', 'category'])
    assert.doesNotMatch(
      source,
      new RegExp(`\\b${key}\\s*:`),
      `13. no duplicated exhibit ${key}`,
    );
  const room = read('components/world/world-gallery.tsx');
  for (const world of worlds)
    assert(!room.includes(world.title), `no hard-coded ${world.title}`);
}

// 1. The route exists, with its own metadata; no exhibit sub-routes.
{
  const page = read('app/world/gallery/page.tsx');
  assert.match(page, /absolute: 'Gallery — TP3D'/);
  assert.match(page, /description:\s*'[^']*curated exhibition of digital/);
  assert.match(page, /<div data-world-page="gallery">\s*<WorldGallery \/>/);
  assert.doesNotMatch(page, /'use client'/, '27–28. server-rendered');
  assert.deepEqual(
    readdirSync(new URL('app/world/gallery/', root)),
    ['page.tsx'],
    'no /world/gallery/[slug] in this pass',
  );
  assert(!existsSync(new URL('app/world/studio', root)), 'no studio page');
  // TP3D PASS 13 and 14: Rooms 03 and 04 are real routes.
  assert(existsSync(new URL('app/world/archive/page.tsx', root)));
  assert(existsSync(new URL('app/world/lab/page.tsx', root)));
}

// Render the real components.
const images = load('data/images.ts', {
  './image-dimensions.json': json('data/image-dimensions.json'),
});
const editorialImage = load('components/shared/editorial-image.tsx', {
  '@/data/images': images,
});
// TP3D PASS 09: the World map's Escape island renders the same native
// <details>, so the chrome's markup (and the Lobby digest) is unchanged.
const worldMapDisclosure = load('components/world/world-map-disclosure.tsx', {
  react: createRequire(import.meta.url)('react'),
  './world-map-escape': load('components/world/world-map-escape.ts'),
});
const chromeFor = (buildingModule) =>
  load('components/world/world-chrome.tsx', {
    'next/link': linkModule,
    '@/data/world-building': buildingModule,
    './world-map-disclosure': worldMapDisclosure,
  });
const chrome = chromeFor(building);
const room = load('components/world/world-gallery.tsx', {
  'next/link': linkModule,
  '@/data/worlds': worldsModule,
  '@/data/world-gallery': gallery,
  '@/data/world-building': building,
  '@/components/shared/editorial-image': editorialImage,
  './world-chrome': chrome,
  './gallery-depth': { GalleryDepth: nullComponent },
  './gallery-reveal': { GalleryReveal: nullComponent },
  '@/lib/world-detail-context': load('lib/world-detail-context.ts'),
});
const html = render(room.WorldGallery);
const attrs = (tag) =>
  Object.fromEntries(
    [...tag.matchAll(/([a-zA-Z-]+)="([^"]*)"/g)].map(([, k, v]) => [k, v]),
  );

// 2, 5–9. One h1; the World chrome with Back to Lobby, World map, Exit.
assert.equal((html.match(/<h1\b/g) ?? []).length, 1, 'one h1');
assert.match(html, /<h1 id="world-gallery-title">Gallery<\/h1>/);
assert.match(html, /<p class="wg-room-number">Room 01<\/p>/);
assert.equal((html.match(/<header\b/g) ?? []).length, 1, 'one chrome');
assert.match(html, /<header class="wl-chrome wl-chrome--room">/);
assert.match(
  html,
  /<main id="main" class="world-gallery" data-world-gallery="">/,
);
const back = html.match(/<a href="([^"]+)" class="wl-back">([\s\S]*?)<\/a>/);
assert(back, '6. Back to Lobby');
assert.equal(back[1], WORLD_PATH);
assert.match(back[2].replace(/<[^>]+>/g, ''), /Back to Lobby/);
assert.match(html, /<a href="\/" class="wl-exit">[\s\S]*?Exit/, '7. Exit');
const map = html.match(/aria-label="World map"[\s\S]*?<\/ol>/)?.[0] ?? '';
const mapRooms = [
  ...map.matchAll(
    /<li data-world-room="([^"]+)" data-status="([^"]+)">([\s\S]*?)<\/li>/g,
  ),
];
assert.deepEqual(
  mapRooms.map(([, id]) => id),
  worldRooms.map((r) => r.id),
  '8. the World map lists worldRooms in order',
);
for (const [, id, status, body] of mapRooms) {
  if (id === 'gallery') {
    assert.match(
      body,
      /<a href="\/world\/gallery" class="wl-map-entry" aria-current="page">/,
      '9',
    );
    assert.match(body, /You are here/);
  } else if (id === 'objects' || id === 'archive' || id === 'lab') {
    // TP3D PASS 10 / 13 / 14: Rooms 02, 03 and 04 are open, plain links
    // here, never current.
    assert.equal(status, 'available');
    assert.match(
      body,
      new RegExp(`^<a href="/world/${id}" class="wl-map-entry">`),
    );
    assert.doesNotMatch(body, /aria-current|You are here/);
  } else {
    assert.equal(status, 'planned');
    assert.doesNotMatch(body, /<a\b|aria-current/, `26. ${id} stays text`);
  }
}

// 17, 22, 29. Real links, in reading order: chrome, exhibits, the way out.
const hrefs = [...html.matchAll(/<a\b[^>]*href="([^"]+)"/g)].map(([, h]) => h);
assert.deepEqual(hrefs, [
  '/',
  '/world',
  '/world/gallery',
  '/world/objects',
  '/world/archive',
  '/world/lab',
  '/',
  // TP3D PASS 07: Gallery exhibits carry the room into the detail page.
  ...galleryExhibits.map((world) => `/worlds/${world.slug}?from=gallery`),
  '/worlds',
  '/world',
]);
assert.doesNotMatch(html, /href="#|tabindex="-?\d/i, 'no fake or hidden links');
const exhibits = [
  ...html.matchAll(/<article\b([^>]*)>([\s\S]*?)<\/article>/g),
].map(([, tag, body]) => ({ ...attrs(tag), body }));
assert.deepEqual(
  exhibits.map((e) => [e['data-gallery-exhibit'], e['data-placement']]),
  [
    ['modern-kitchen', 'field'],
    ['white-modern-living-room', 'wall'],
    ['minimalistic-modern-bedroom', 'pair'],
    ['modern-bathroom', 'pair'],
  ],
  'placement comes from curation order',
);
exhibits.forEach((exhibit, index) => {
  const world = galleryExhibits[index];
  const { body } = exhibit;
  assert.equal(exhibit['aria-labelledby'], `exhibit-${world.slug}`);
  assert.equal(
    exhibit.id,
    world.slug,
    'the fragment the detail page returns to',
  );
  assert.equal(exhibit['data-layout'], world.layout);
  assert.match(body, new RegExp(`<p class="wg-number">0${index + 1} / 04</p>`));
  assert.match(
    body,
    new RegExp(
      `<h2 id="exhibit-${world.slug}" class="wg-title">${world.title}</h2>`,
    ),
  );
  assert(body.includes(`${world.category} · ${world.style} · ${world.year}`));
  assert(body.includes(world.description));
  assert.match(body, /GLB · PBR textures · Real-world scale/);
  assert.match(
    body,
    new RegExp(
      `<a class="wg-enter" href="/worlds/${world.slug}\\?from=gallery"><span>Enter exhibit<span class="wg-hidden">: ${world.title}</span></span>`,
    ),
  );
  // 33. Every photograph carries its alt and intrinsic size.
  const img = attrs(body.match(/<img\b[^>]*>/)[0]);
  assert.equal(img.alt, world.image.alt);
  assert.deepEqual([img.width, img.height], ['1600', '900']);
  assert.equal(img.loading, index === 0 ? 'eager' : 'lazy');
  assert.equal(
    img.fetchpriority ?? img.fetchPriority,
    index === 0 ? 'high' : 'auto',
  );
});
assert.match(html, /<p class="wg-edition">Edition 2026 · 04 interiors<\/p>/);
assert.equal(worldsEdition, '2026');
assert.match(
  html,
  /<a class="wg-catalogue" href="\/worlds"><span>View full 3D catalogue<\/span>/,
  '22. the full catalogue, last and secondary',
);

// 18–21, 34. No iframe, canvas, viewer, model or external request; one
// image preload, for the first exhibit only.
for (const [pattern, what] of [
  [/<iframe\b/i, 'iframe'],
  [/<canvas\b/i, 'canvas'],
  [/sketchfab/i, 'Sketchfab'],
  [/three\.module|three\.js/i, 'Three.js'],
  [/\.(glb|gltf)\b/i, 'model file'],
  [/https?:\/\//, 'absolute or external URL'],
])
  assert(!pattern.test(html), `18–21, 34. no ${what} on the Gallery`);
const preloads = html.match(/<link\b[^>]*>/g) ?? [];
assert.equal(preloads.length, 1, 'exactly one preload');
assert.match(preloads[0], /rel="preload" as="image"/);
assert.match(preloads[0], /world-modern-kitchen/);
for (const file of [
  'components/world/world-gallery.tsx',
  'components/world/gallery-depth.tsx',
  'components/world/gallery-reveal.tsx',
  'app/world/gallery/page.tsx',
  'data/world-gallery.ts',
]) {
  const source = read(file);
  assert.doesNotMatch(source, /from ['"]three['"]|import\(|<canvas|<iframe/);
  assert.doesNotMatch(source, /sketchfab|SketchfabViewer|fetch\(|preload/i);
  assert.doesNotMatch(source, /gsap|lenis|ScrollTrigger|framer-motion/i);
}
const {
  dependencies = {},
  devDependencies = {},
  scripts,
} = json('package.json');
for (const name of ['gsap', 'lenis', '@studio-freight/lenis', 'framer-motion'])
  assert(!(name in dependencies) && !(name in devDependencies), `no ${name}`);
assert.equal(scripts['check:gallery'], 'node scripts/check-gallery.mjs');

// 25. The Lobby is the PASS 05 Lobby: with the Gallery href mapped back to
// its PASS 05 bridge and Objects, the Archive and the Lab back to planned
// wings (they opened in TP3D PASS 10, 13 and 14), the shared chrome renders
// byte-identical markup.
{
  const planned = (r) => ({ ...r, status: 'planned', href: null });
  // The Archive's and the Lab's descriptions became truthful when they
  // opened (PASS 13, 14); the Lobby never renders a room description, so the
  // lineage is unaffected.
  const opened =
    (...ids) =>
    (r) =>
      ids.includes(r.id) ? planned(r) : r;
  const asPass05 = {
    ...building,
    worldRooms: worldRooms.map((r) =>
      r.id === 'gallery'
        ? { ...r, href: '/worlds' }
        : opened('objects', 'archive', 'lab')(r),
    ),
  };
  const lobbyFor = (buildingModule) =>
    load('components/world/world-lobby.tsx', {
      '@/data/home-chapter-assets.json': json('data/home-chapter-assets.json'),
      '@/data/world-building': buildingModule,
      './lobby-arrival': { LobbyArrival: nullComponent },
      './world-chrome': chromeFor(buildingModule),
    });
  const pass05 = render(lobbyFor(asPass05).WorldLobby);
  assert.equal(
    createHash('sha256').update(pass05).digest('hex').slice(0, 16),
    '33b98ff20947d884',
    'Lobby markup equals e55565e (PASS 05)',
  );
  // PASS 06–09: only the Gallery destination changed.
  const asPass09 = {
    ...building,
    worldRooms: worldRooms.map(opened('objects', 'archive', 'lab')),
  };
  const pass09 = render(lobbyFor(asPass09).WorldLobby);
  assert.equal(
    pass09,
    pass05.replaceAll('href="/worlds"', 'href="/world/gallery"'),
    'only the Gallery destination changed',
  );
  // TP3D PASS 10: Objects opens. Only its two entries (spatial directory and
  // World map) and the open-room count change.
  const asPass12 = {
    ...building,
    worldRooms: worldRooms.map(opened('archive', 'lab')),
  };
  const pass12 = render(lobbyFor(asPass12).WorldLobby);
  const without = (room) => (markup) =>
    markup
      .replace(
        new RegExp(`<li\\b[^>]*data-world-room="${room}"[\\s\\S]*?</li>`, 'g'),
        '<li/>',
      )
      .replace(/\d(?:<!-- -->)? of (?:<!-- -->)?\d/, 'n of m');
  assert.equal(
    without('objects')(pass12),
    without('objects')(pass09),
    'only the Objects entries and the count changed',
  );
  assert.match(pass12, /2(?:<!-- -->)? of (?:<!-- -->)?5/);
  // TP3D PASS 13: the Archive opens. Only its two entries and the count
  // change; Gallery and Objects keep theirs.
  const asPass13 = {
    ...building,
    worldRooms: worldRooms.map(opened('lab')),
  };
  const pass13 = render(lobbyFor(asPass13).WorldLobby);
  assert.equal(
    without('archive')(pass13),
    without('archive')(pass12),
    'only the Archive entries and the count changed',
  );
  assert.match(pass13, /3(?:<!-- -->)? of (?:<!-- -->)?5/);
  // TP3D PASS 14: the Lab opens. Only its two entries and the count change.
  const lobby = render(lobbyFor(building).WorldLobby);
  assert.equal(
    without('lab')(lobby),
    without('lab')(pass13),
    'only the Lab entries and the count changed',
  );
  assert.equal((lobby.match(/href="\/world\/gallery"/g) ?? []).length, 2);
  assert.equal((lobby.match(/href="\/world\/objects"/g) ?? []).length, 2);
  assert.equal((lobby.match(/href="\/world\/archive"/g) ?? []).length, 2);
  assert.equal((lobby.match(/href="\/world\/lab"/g) ?? []).length, 2);
  assert.match(
    lobby,
    /4(?:<!-- -->)? of (?:<!-- -->)?5/,
    'four of five rooms open',
  );
  assert.match(
    read('app/world/page.tsx'),
    /<div data-world-page="lobby">\s*<WorldLobby \/>/,
  );
}

// 23–24. The catalogue and detail routes keep their behaviour.
{
  const catalog = load('lib/world-catalog.ts');
  const query = (search) =>
    catalog.readWorldQuery(new URLSearchParams(search), worlds);
  assert.deepEqual(
    { ...query('category=kitchen&q=stone&sort=az') },
    {
      category: 'kitchen',
      q: 'stone',
      sort: 'az',
    },
  );
  assert.deepEqual(
    { ...query('category=unknown') },
    {
      category: '',
      q: '',
      sort: 'newest',
    },
  );
  assert.deepEqual(
    [
      ...catalog.selectWorlds(worlds, { category: '', q: '', sort: 'newest' }),
    ].map((w) => w.slug),
    worlds.map((w) => w.slug),
    'newest keeps authored order within one edition',
  );
  assert.deepEqual(
    [
      ...catalog.selectWorlds(worlds, {
        category: '',
        q: 'minimal',
        sort: 'az',
      }),
    ].map((w) => w.slug),
    ['minimalistic-modern-bedroom'],
  );
  assert.equal(
    catalog
      .writeWorldQuery(new URLSearchParams(), {
        category: 'living',
        q: '',
        sort: 'newest',
      })
      .toString(),
    'category=living',
  );
  const list = read('app/worlds/page.tsx');
  assert.match(list, /title: '3D Worlds'/);
  assert.match(list, /for \(const key of \['category', 'q', 'sort'\]\)/);
  assert.match(list, /<WorldsCatalog\s+worlds=\{worlds\}/);
  const detail = read('app/worlds/[slug]/page.tsx');
  // TP3D PASS 07: one detail route, two contexts; check-exhibit owns the
  // context, browse-set and viewer behaviour.
  assert.match(
    detail,
    /<WorldDetail\s+initialWorld=\{world\}\s+worlds=\{context\.kind === 'gallery' \? galleryExhibits : worlds\}\s+context=\{context\}\s+\/>/,
  );
  assert.match(detail, /generateStaticParams = \(\) =>\s*worlds\.map/);
  assert.match(
    read('components/worlds/world-detail.tsx'),
    /window\.location\.assign\(worldReturnHref\(active\.slug, context\)\)/,
    'Escape on the poster returns to the visitor’s context',
  );
}

// 30–33. CSS: reduced motion has no decorative depth, phones stack, targets
// are 44px, frames reserve their ratio, type stays legible.
{
  const css = read('components/world/world-gallery.css');
  // The rule whose whole selector is `selector` (not a longer list ending
  // with it).
  const block = (selector) => {
    const start = css.search(
      new RegExp(
        `(^|[}/])\\s*${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\{`,
      ),
    );
    assert(start >= 0, `${selector} rule`);
    return css.slice(start, css.indexOf('}', start + 1));
  };
  assert.match(
    css,
    /@media \(min-width: 1200px\) and \(hover: hover\) and \(pointer: fine\) and \(prefers-reduced-motion: no-preference\) \{\s*\[data-gallery-depth\]/,
    '30. pointer depth: desktop tier, fine pointer, motion allowed',
  );
  assert.match(
    css,
    /@supports \(animation-timeline: view\(\)\) \{\s*@media \(prefers-reduced-motion: no-preference\) \{/,
    '30. scroll drift only when motion is allowed',
  );
  assert.equal(
    (css.match(/--wg-depth-[xy]/g) ?? []).length,
    4,
    'depth applies to one exhibit only',
  );
  for (const [, scale] of css.matchAll(/scale\(([\d.]+)\)/g))
    assert(Number(scale) <= 1.025, `image scale ${scale}`);
  for (const [, px] of css.matchAll(/\* (-?\d+)px\)/g))
    assert(Math.abs(Number(px)) <= 6, `pointer offset ${px}px`);
  assert.match(
    read('components/world/gallery-reveal.tsx'),
    /if \(reduced\.matches\) return;/,
  );
  assert.match(
    read('components/world/gallery-depth.tsx'),
    /createPointerFollower/,
  );
  assert.match(block('.world-gallery'), /overflow-x: clip/, '31');
  const phones = css.slice(css.indexOf('@media (max-width: 767px) {'));
  assert.match(phones, /\.wg-entry \{\s*grid-template-columns: 1fr;/);
  assert.match(phones, /\.wg-pair \{\s*grid-template-columns: 1fr;/);
  assert.match(
    block('.wg-enter,\n.wg-catalogue,\n.wg-lobby'),
    /min-height: 44px/,
    '32',
  );
  assert.match(
    read('components/world/world-chrome.css'),
    /\.wl-back \{[^}]*min-height: 44px/,
  );
  for (const layout of ['wide', 'landscape', 'portrait', 'square'])
    assert.match(
      block(`.wg-exhibit[data-layout='${layout}'] .wg-frame`),
      /aspect-ratio:/,
      '33',
    );
  assert.match(
    block('.wg-frame'),
    /background: var\(--wg-mount\)/,
    'stone, never a paper flash',
  );
  // Legibility on the umber ground: no persistent text below 0.78 ivory and
  // no type below 10px. The pending reveal state is transient.
  const rules = css
    .replace(/@keyframes[^{]+\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '')
    .replace(/[^{}]*\[data-reveal='pending'\][^{}]*\{[^{}]*\}/g, '');
  for (const [, value] of rules.matchAll(/[;{\s]opacity:\s*([\d.]+)/g))
    assert(Number(value) >= 0.78, `text opacity ${value}`);
  for (const [, alpha] of rules.matchAll(
    /[;{\s]color:\s*rgb\([^)]*\/\s*(\d+)%\)/g,
  ))
    assert(Number(alpha) >= 78, `text colour alpha ${alpha}%`);
  for (const [, px] of rules.matchAll(
    /font-size:\s*(\d+)px|font:\s*\d+\s+(\d+)px/g,
  ))
    if (px) assert(Number(px) >= 10, `font size ${px}px`);
  for (const [, , px] of rules.matchAll(/font:\s*(\d+)\s+(\d+)px/g))
    assert(Number(px) >= 10, `font ${px}px`);
}

console.log(
  'Gallery passed: Room 01 at /world/gallery inside the World chrome (Back to Lobby, World map with the Gallery current, Exit), four curated exhibits resolved from data/worlds.ts in order with real /worlds/[slug] links, the full catalogue last, no canvas, viewer, Sketchfab or Three.js, one priority image, reduced-motion-safe depth, 44px targets, and a Lobby byte-identical to PASS 05 apart from the Gallery destination.',
);
