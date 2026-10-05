/** TP3D PASS 12 — Product-detail navigation and prefetch discipline.
 * `/products/[slug]` renders per request (PASS 11 reads its shell from the
 * query) and vinext serves it `no-store`: a prefetched payload is thrown
 * away unless the click lands while it is still in flight (measured in the
 * PASS 12 record). So Product-detail links never prefetch automatically,
 * and a real click makes one request for the object actually chosen.
 * This check renders the real components with a Link stand-in that records
 * each link's prefetch policy, then locks the context, shells, markup and
 * routes. Browser network QA (the PASS 12 record) covers the requests.
 * Numbers refer to the PASS 12 brief. */
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
const { jsx } = require('react/jsx-runtime');
const { renderToStaticMarkup } = require('react-dom/server');
const json = (path) => JSON.parse(read(path));
const byCodeUnit = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const hash = (text) =>
  createHash('sha256').update(text).digest('hex').slice(0, 16);
const digest = (path) => hash(read(path).replace(/\r\n/g, '\n'));
const code = (path) =>
  read(path)
    .replace(/\r\n/g, '\n')
    .replace(/\{\/\*[\s\S]*?\*\/\}|\/\*[\s\S]*?\*\/|^\s*\/\/[^\n]*/gm, '');

/** next/link that shows its prefetch policy in the markup:
 * `data-prefetch="false"` for `prefetch={false}`, "auto" when left out. */
const recordingLink = {
  __esModule: true,
  default: ({ href, prefetch, children, ...props }) =>
    jsx('a', {
      href,
      'data-prefetch': prefetch === undefined ? 'auto' : String(prefetch),
      ...props,
      children,
    }),
};

// The real modules, wired the way the routes wire them.
const images = load('data/images.ts', {
  './image-dimensions.json': json('data/image-dimensions.json'),
});
const productsModule = load('data/products.ts', { './images': images });
const products = [...productsModule.products];
const projectsModule = load('data/projects.ts', { './images': images });
const materialsModule = load('data/materials.ts', { './images': images });
const relationships = load('data/relationships.ts', {
  './projects': projectsModule,
  './products': productsModule,
  './materials': materialsModule,
});
const assets = load('lib/product-assets.ts');
const context = load('lib/product-detail-context.ts');
const building = load('data/world-building.ts');
const worldRooms = [...building.worldRooms];
const curation = load('data/world-objects.ts', { './products': productsModule });
const curatedSlugs = [...curation.objectStudies].map(({ slug }) => slug);
const objectsRoom = worldRooms.find(({ id }) => id === 'objects');
const objects = context.objectsContext(objectsRoom, curatedSlugs);
const editorialImage = load('components/shared/editorial-image.tsx', {
  '@/data/images': images,
});
const wiring = (link, buildingModule = building) => {
  const textLink = load('components/shared/text-link.tsx', {
    'next/link': link,
  });
  const sectionHeading = load('components/shared/section-heading.tsx', {
    './text-link': textLink,
  });
  const assetAvailability = load('components/product/asset-availability.tsx');
  const selection = load('components/sections/object-selection.tsx', {
    'next/link': link,
    '@/data/products': productsModule,
    '@/lib/product-detail-context': context,
    '@/components/shared/editorial-image': editorialImage,
    '@/components/shared/section-heading': sectionHeading,
    '@/components/product/asset-availability': assetAvailability,
  });
  const detail = load('components/product/product-detail.tsx', {
    'next/link': link,
    '@/data/relationships': relationships,
    '@/lib/product-assets': assets,
    '@/lib/product-detail-context': context,
    '@/components/shared/editorial-image': editorialImage,
    '@/components/project/project-selection': load(
      'components/project/project-selection.tsx',
      {
        '@/components/shared/section-heading': sectionHeading,
        './project-preview': load('components/project/project-preview.tsx', {
          'next/link': link,
          '@/components/shared/editorial-image': editorialImage,
          '@/components/shared/text-link': textLink,
        }),
      },
    ),
    '@/components/sections/object-selection': selection,
    './asset-availability': assetAvailability,
    './product-asset-sections': load(
      'components/product/product-asset-sections.tsx',
      {
        '@/lib/product-assets': assets,
        '@/components/shared/editorial-image': editorialImage,
        '@/components/shared/section-heading': sectionHeading,
        './sketchfab-viewer': load('components/product/sketchfab-viewer.tsx', {
          react,
          '@/lib/product-assets': assets,
        }),
        './asset-outbound-link': load(
          'components/product/asset-outbound-link.tsx',
          {
            '@/lib/asset-analytics': load('lib/asset-analytics.ts'),
            '@/lib/product-assets': assets,
          },
        ),
        './model-information': load('components/product/model-information.tsx', {
          '@/lib/product-assets': assets,
        }),
      },
    ),
  });
  const chrome = load('components/world/world-chrome.tsx', {
    'next/link': link,
    '@/data/world-building': buildingModule,
    './world-map-disclosure': load('components/world/world-map-disclosure.tsx', {
      react,
      './world-map-escape': load('components/world/world-map-escape.ts'),
    }),
  });
  const shell = load('components/world/object-study-shell.tsx', {
    './world-chrome': chrome,
  });
  const route = load('app/products/[slug]/page.tsx', {
    'next/navigation': {
      notFound() {
        throw new Error('NEXT_NOT_FOUND');
      },
    },
    '@/data/products': productsModule,
    '@/data/world-objects': curation,
    '@/data/world-building': buildingModule,
    '@/lib/product-detail-context': context,
    '@/components/product/product-detail': detail,
    '@/components/world/object-study-shell': shell,
  });
  const room = load('components/world/world-objects.tsx', {
    'next/link': link,
    '@/data/world-objects': curation,
    '@/data/world-building': buildingModule,
    '@/lib/product-assets': assets,
    '@/lib/product-detail-context': context,
    '@/components/shared/editorial-image': editorialImage,
    './world-chrome': chrome,
    './gallery-depth': { GalleryDepth: nullComponent },
    './gallery-reveal': { GalleryReveal: nullComponent },
  });
  const visit = async (slug, searchParams = {}) =>
    renderToStaticMarkup(
      await route.default({
        params: Promise.resolve({ slug }),
        searchParams: Promise.resolve(searchParams),
      }),
    );
  return { selection, visit, room };
};
const recorded = wiring(recordingLink);
// Markup locks compare with the building as it stood before TP3D PASS 13
// opened the Archive (the World map's only change).
const beforeArchive = {
  ...building,
  worldRooms: worldRooms.map((r) =>
    r.id === 'archive' ? { ...r, status: 'planned', href: null } : r,
  ),
};
const plain = wiring(linkModule, beforeArchive);

/** Every anchor whose href is a Product detail, with its recorded policy. */
const productDetailAnchors = (html) =>
  (html.match(/<a\b[^>]*>/g) ?? [])
    .map((tag) => ({
      href: tag.match(/href="([^"]*)"/)?.[1] ?? '',
      prefetch: tag.match(/data-prefetch="([^"]*)"/)?.[1] ?? null,
      className: tag.match(/class="([^"]*)"/)?.[1] ?? '',
    }))
    .filter(({ href }) => /^\/products\/[^/?#]+/.test(href));
const linkTo = (html, href) =>
  (html.match(/<a\b[^>]*>/g) ?? [])
    .filter((tag) => tag.includes(`href="${href}"`))
    .map((tag) => tag.match(/data-prefetch="([^"]*)"/)?.[1] ?? null);

// PASS 11 markup, rendered from the 486e1cb sources (today's data is
// unchanged); the editorial digests are also PASS 10's.
const PASS11 = {
  'editorial:form-lounge-chair': '02802e95d32c14b3',
  'objects:form-lounge-chair': '84b36ea89ebedbce',
  'editorial:line-sofa': 'da10113db9ab964b',
  'objects:line-sofa': '51caab633ca62852',
  'editorial:round-coffee-table': '54f2b9c0e01d6590',
  'objects:round-coffee-table': 'b7c49a49d5bb3713',
  'editorial:copper-pendant': '9e9f53ab57692d25',
  'objects:copper-pendant': 'd6cfb0f08b4b7802',
  collection: '52480b9d58540eee',
  'project:quiet-house': '05e21b72b65509de',
  'space:living': '147dbd8458244943',
  room: '352daa7cae272dbc',
};

// 1–4, 6, 19–22. ObjectSelection owns the card policy; every caller inherits
// it, in every context, with its href from productDetailHref.
{
  const source = code('components/sections/object-selection.tsx');
  assert.match(
    source,
    /<Link\s+className="image-link"\s+href=\{productDetailHref\(p\.slug, context\)\}\s+prefetch=\{false\}\s*>/,
    '1–2. the card link: productDetailHref, explicitly no prefetch',
  );
  assert.equal((source.match(/<Link\b/g) ?? []).length, 1, 'one card link');
  assert.doesNotMatch(source, /prefetch\?:|prefetch[,}]/, '19. no prefetch prop');
  const cases = [
    // 3, 12. The collection (/products) and the callers outside the room.
    { name: 'collection', props: { title: 'The object collection.' }, query: '' },
    { name: 'project', props: { ids: ['form-lounge-chair', 'round-coffee-table'], title: 'x' }, query: '' },
    { name: 'space', props: { ids: ['line-sofa', 'copper-pendant'], title: 'x' }, query: '' },
    // 4. Room 02's studies.
    { name: 'objects', props: { ids: curatedSlugs, title: 'x', context: objects }, query: '?from=objects' },
  ];
  for (const { name, props, query } of cases) {
    const html = render(recorded.selection.ObjectSelection, props);
    const anchors = productDetailAnchors(html);
    assert(anchors.length > 0, name);
    for (const a of anchors) {
      assert.equal(a.prefetch, 'false', `1, 20. ${name}: ${a.href} never prefetches`);
      assert.match(a.href, new RegExp(`^/products/[a-z-]+${query.replace('?', '\\?')}$`), `3–4. ${name}: ${a.href}`);
    }
    // 6. The section's "Discover the objects" link to the collection keeps
    // its default policy: /products is not a Product detail.
    assert.deepEqual(linkTo(html, '/products'), ['auto'], `6. ${name}: /products`);
  }
  // 20. Callers pass no policy of their own and hold no Product-detail link.
  for (const file of [
    'app/products/page.tsx',
    'app/collections/[slug]/page.tsx',
    'components/project/project-detail.tsx',
    'components/space/space-detail.tsx',
    'components/product/product-detail.tsx',
  ]) {
    const source = code(file);
    const call = source.match(/<ObjectSelection[\s\S]*?\/>/)?.[0];
    assert(call, `${file} renders ObjectSelection`);
    assert.doesNotMatch(call, /prefetch/, `20. ${file}: no policy of its own`);
    assert.doesNotMatch(source, /href=\{`\/products\/\$\{/, `20. ${file}: no direct link`);
  }
}

// 21–22, 15–18, 13–14. Through the real route: related objects (editorial)
// and related studies (Room 02) inherit the policy; the shells, the way back
// and the hrefs are PASS 11's.
for (const { slug } of products) {
  const editorial = await recorded.visit(slug);
  const room = await recorded.visit(slug, { from: 'objects' });
  const related = (html) =>
    productDetailAnchors(html).filter(({ className }) => className === 'image-link');
  assert.ok(related(editorial).length === 3, `21. ${slug}`);
  for (const a of related(editorial)) {
    assert.equal(a.prefetch, 'false', `21. related object ${a.href}`);
    assert.match(a.href, /^\/products\/[a-z-]+$/, '3, 21. plain');
  }
  assert.ok(related(room).length > 0, `22. ${slug}`);
  for (const a of related(room)) {
    assert.equal(a.prefetch, 'false', `22. related study ${a.href}`);
    assert.match(a.href, /^\/products\/[a-z-]+\?from=objects$/, '4, 22. in the room');
  }
  // 15–17. The Objects shell from the server marker; the editorial study
  // without it.
  assert.ok(room.startsWith('<link rel="preload"') || room.startsWith('<div'));
  assert.match(room, /<div class="world-object-study" data-product-detail-shell="objects"><header class="wl-chrome wl-chrome--room">/, '15, 17');
  assert.doesNotMatch(editorial, /data-product-detail-shell|wl-chrome/, '16');
  // 13–14. The ways back are unchanged.
  assert.match(room, new RegExp(`<a href="/world/objects#${slug}" data-prefetch="auto" class="back-link">← Back to Objects</a>`), '13');
  assert.match(editorial, /<a href="\/products" data-prefetch="auto" class="back-link">← All objects<\/a>/, '14');
}

// 5. Room 02 keeps its document navigation: real anchors, never next/link.
{
  const html = render(recorded.room.WorldObjects);
  const studies = productDetailAnchors(html);
  assert.equal(studies.length, curatedSlugs.length, '5. four studies');
  for (const a of studies) {
    assert.equal(a.className, 'wo-study');
    assert.equal(a.prefetch, null, `5. ${a.href}: a native anchor`);
    assert.match(a.href, /\?from=objects$/);
  }
  assert.match(code('components/world/world-objects.tsx'), /<a\s+className="wo-study"\s+href=\{productDetailHref\(product\.slug, studyContext\)\}\s*>/);
}

// Other Product-detail sources (the PASS 12 inventory): the experience
// page's object list and selection sheet follow the policy; the header's
// search results are the documented exception (shared editorial chrome,
// links only after an explicit query) and stay PASS 08's.
{
  const source = code('components/experience/experience-shell.tsx');
  assert.match(source, /<Link\s+key=\{p\.slug\}\s+href=\{`\/products\/\$\{p\.slug\}`\}\s+prefetch=\{false\}\s*>/, 'experience object list');
  assert.match(source, /prefetch=\{selection\?\.kind === 'product' \? false : undefined\}/, 'experience selection sheet');
  assert.equal(digest('components/layout/site-header.tsx'), 'dfcfe66f79f370b1', 'header unchanged');
  // Every other source of a Product-detail URL in the app is accounted for.
  const sources = (dir) =>
    readdirSync(new URL(dir, root), { recursive: true })
      .filter((file) => /\.(?:tsx?|jsx?)$/.test(file))
      .map((file) => `${dir}${file.replace(/\\/g, '/')}`);
  const emitters = ['app/', 'components/', 'lib/', 'data/', 'hooks/']
    .flatMap(sources)
    .filter((file) => /\/products\/\$\{|productDetailHref\(/.test(code(file)))
    .sort(byCodeUnit);
  assert.deepEqual(
    emitters,
    [
      'components/experience/experience-shell.tsx',
      'components/sections/object-selection.tsx',
      'components/world/world-objects.tsx',
      'data/search.ts',
      'lib/product-detail-context.ts',
    ],
    'Product-detail link inventory',
  );
}

// 7–9, 31–34. Declarative only: no global Link wrapper, no manual prefetch,
// no listener, observer, timer or RAF in anything this pass touched.
{
  for (const file of ['next.config.ts', 'vite.config.ts'])
    assert.doesNotMatch(read(file), /next\/link|prefetch/, `7. ${file}`);
  const components = readdirSync(new URL('components/', root), { recursive: true }).map((f) => f.replace(/\\/g, '/'));
  assert(!components.some((f) => /(?:^|\/)(?:link|prefetch-link|smart-link)\.tsx$/.test(f)), '7. no Link wrapper');
  const all = ['app/', 'components/', 'lib/', 'hooks/']
    .flatMap((dir) =>
      readdirSync(new URL(dir, root), { recursive: true })
        .filter((file) => /\.(?:tsx?|jsx?)$/.test(file))
        .map((file) => `${dir}${file.replace(/\\/g, '/')}`),
    );
  // The one manual prefetch is PASS 05's: the gateway warms /world on intent.
  assert.deepEqual(
    all.filter((file) => /router\.prefetch|\.prefetch\(/.test(code(file))).sort(byCodeUnit),
    ['components/world/world-gateway-link.tsx'],
    '8. no router.prefetch added',
  );
  assert.doesNotMatch(code('components/world/world-gateway-link.tsx'), /products/, '8');
  const selection = code('components/sections/object-selection.tsx');
  assert.doesNotMatch(read('components/sections/object-selection.tsx'), /^['"]use client['"]/m, 'a server component');
  assert.doesNotMatch(selection, /on[A-Z][a-zA-Z]+=|useEffect|useState|addEventListener|Observer|setTimeout|setInterval|requestAnimationFrame|fetch\(/, '9, 31–34');
  // The experience shell gained two props and nothing else.
  const experience = code('components/experience/experience-shell.tsx');
  const counts = (re) => (experience.match(re) ?? []).length;
  assert.deepEqual(
    {
      useEffect: counts(/useEffect/g),
      listeners: counts(/addEventListener|onMouseEnter|onPointerEnter|onFocus/g),
      observers: counts(/Observer/g),
      timers: counts(/setTimeout|setInterval|requestAnimationFrame/g),
      dynamicImports: counts(/import\(/g),
      prefetch: counts(/prefetch=/g),
    },
    { useEffect: 0, listeners: 0, observers: 0, timers: 0, dynamicImports: 1, prefetch: 2 },
    '9, 31–34. experience shell',
  );
}

// 10–12. The context is PASS 11's, file and behaviour.
{
  assert.equal(digest('lib/product-detail-context.ts'), '2177f57b3e4b5cc9', '10–12. context locked');
  const resolve = (from, slug = 'line-sofa') =>
    context.resolveProductDetailContext({ from, slug, curatedSlugs, objectsRoom }).kind;
  assert.equal(resolve('objects'), 'objects', '10');
  for (const from of ['OBJECTS', 'gallery', 'objects ', '', undefined, ['objects', 'foo']])
    assert.equal(resolve(from), 'catalogue', `11. ${JSON.stringify(from)}`);
  const ranked = [{ slug: 'a' }, { slug: 'line-sofa' }, { slug: 'b' }, { slug: 'copper-pendant' }];
  assert.deepEqual(
    [...context.relatedInContext(ranked, objects)].map(({ slug }) => slug),
    ['line-sofa', 'copper-pendant'],
    '12',
  );
  assert.deepEqual(
    [...context.relatedInContext(ranked, context.CATALOGUE_PRODUCT_CONTEXT)].map(({ slug }) => slug),
    ['a', 'line-sofa', 'b'],
    '12',
  );
}

// 23–30. Visible markup is PASS 11's everywhere (the policy is a prop, not
// markup); the shells, Room 02, the Lobby, the Gallery, its chamber and the
// homepage are untouched.
{
  for (const { slug } of products) {
    assert.equal(hash(await plain.visit(slug)), PASS11[`editorial:${slug}`], `24. ${slug}`);
    assert.equal(hash(await plain.visit(slug, { from: 'objects' })), PASS11[`objects:${slug}`], `25. ${slug}`);
  }
  assert.equal(hash(render(plain.selection.ObjectSelection, { title: 'The object collection.' })), PASS11.collection, '23. /products');
  assert.equal(hash(render(plain.selection.ObjectSelection, { ids: ['form-lounge-chair', 'round-coffee-table'], title: 'x' })), PASS11['project:quiet-house']);
  assert.equal(hash(render(plain.selection.ObjectSelection, { ids: ['line-sofa', 'copper-pendant'], title: 'x' })), PASS11['space:living']);
  assert.equal(hash(render(plain.room.WorldObjects)), PASS11.room, '26. Room 02');
  const LOCKED = {
    'components/product/product-detail.tsx': '785f3fb044d54e96',
    'app/products/[slug]/page.tsx': 'f5515aa35568c5dc',
    'app/products/page.tsx': '2257cc689fdfa941',
    'components/world/object-study-shell.tsx': '404081ad9d571e7b',
    'components/world/object-study-shell.css': '7743c1aecaa2449a',
    'components/world/world-objects.tsx': '4a565398c1e36def',
    'components/world/world-chrome.tsx': '3a37f3c5c372903f',
    // TP3D PASS 13 shares the World tokens with the Archive.
    'components/world/world-chrome.css': '1b8b7848e86a9684',
    'lib/product-assets.ts': 'dd5606b65228a9e8',
    'components/shared/section-heading.tsx': '983439f27e3defa5',
    'components/shared/text-link.tsx': '837e8edb721aa951',
    'components/project/project-detail.tsx': '1930b351db670dc9',
    'components/space/space-detail.tsx': '4c6be42b09c5220a',
    'app/collections/[slug]/page.tsx': 'ec5cd3487c401ae8',
    // 27–30.
    'components/world/world-lobby.tsx': 'bf0bc493f965b78c',
    'components/world/world-gallery.tsx': 'f1a4d8da704c60d5',
    'components/world/world-detail-shell.tsx': '3e53405aaff87ab1',
    'components/world/world-detail-shell.css': '59df760b8e04e445',
    'app/worlds/[slug]/page.tsx': '6a120db7565dca00',
    'app/page.tsx': '9b4f5f0e730af60f',
    // 36–37. Neither viewer is touched.
    'components/product/sketchfab-viewer.tsx': '0bda9996a13c3b02',
    'components/worlds/sketchfab-viewer.tsx': '6db839abf80c3b6e',
  };
  for (const [path, value] of Object.entries(LOCKED))
    assert.equal(digest(path), value, `${path} is locked`);
}

// 35–39. No new request, 3D or route.
{
  for (const file of [
    'components/sections/object-selection.tsx',
    'components/experience/experience-shell.tsx',
  ])
    assert.doesNotMatch(code(file), /https?:|sketchfab|fab\.com|\.glb|from ['"]three['"]|<canvas|getContext/i, `35–37. ${file}`);
  const pages = readdirSync(new URL('app/', root), { recursive: true })
    .map((file) => file.replace(/\\/g, '/'))
    .filter((file) => /(?:^|\/)(?:page|route)\.(?:tsx?|jsx?)$/.test(file))
    .sort(byCodeUnit);
  assert.deepEqual(
    pages.filter((p) => /^(?:world|worlds|products)\//.test(p)),
    [
      'products/[slug]/page.tsx',
      'products/page.tsx',
      // TP3D PASS 13: Room 03.
      'world/archive/page.tsx',
      'world/gallery/page.tsx',
      'world/objects/page.tsx',
      'world/page.tsx',
      'worlds/[slug]/page.tsx',
      'worlds/page.tsx',
    ],
    '38. no new route',
  );
  for (const file of ['middleware.ts', 'middleware.js', 'proxy.ts'])
    assert(!existsSync(new URL(file, root)), `39. no ${file}`);
  assert.doesNotMatch(read('next.config.ts'), /redirects|rewrites/, '39');
  const vercel = json('vercel.json');
  for (const key of ['redirects', 'rewrites', 'routes'])
    assert(!(key in vercel), `39. vercel.json ${key}`);
  // 40. The gates stay wired; build runs as its own command.
  const { scripts } = json('package.json');
  assert.equal(scripts['check:product-navigation'], 'node scripts/check-product-navigation.mjs');
  for (const name of ['check:object-study', 'check:objects-room', 'check:routes', 'build', 'build:vercel'])
    assert(scripts[name], name);
}

console.log(
  'Product navigation passed: every Product-detail card (the /products collection, related objects, Room 02 related studies, projects, spaces, collections) comes from ObjectSelection with prefetch={false} and its href from productDetailHref (plain in the catalogue, ?from=objects in the room), and the experience page follows the same policy; the /products section link, the ways back and every static link keep their default; Room 02 keeps native anchors; no Link wrapper, manual prefetch, listener, observer, timer or RAF; the context, both shells, the visible markup of /products, both study shells and Room 02, the Lobby, the Gallery, its chamber, the homepage and both viewers are PASS 11’s; no route, redirect or 3D change.',
);
