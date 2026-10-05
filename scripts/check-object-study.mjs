/** TP3D PASS 11 — an object study opened from Room 02 stays inside the
 * World. The real product route is rendered in every context: a validated
 * Room 02 visit (`/products/[slug]?from=objects` for a curated study) gets
 * the World chrome and the server shell marker around the shared
 * ProductDetail; the collection and every invalid context get the PASS 10
 * editorial page, locked by markup digests rendered from the PASS 10
 * sources. CSS, asset-system, route and regression contracts follow.
 * Browser QA (the PASS 11 record) covers first frames, journeys, focus,
 * layout and requests. Numbers refer to the PASS 11 brief. */
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
  read(path).replace(
    /\/\*[\s\S]*?\*\/|^\s*\/\/[^\n]*|\{\/\*[\s\S]*?\*\/\}/gm,
    '',
  );

// The real modules, wired the way the route wires them.
const images = load('data/images.ts', {
  './image-dimensions.json': json('data/image-dimensions.json'),
});
const productsModule = load('data/products.ts', { './images': images });
const products = [...productsModule.products];
const projectsModule = load('data/projects.ts', { './images': images });
const materialsModule = load('data/materials.ts', { './images': images });
const relationshipsFor = (source) =>
  load('data/relationships.ts', {
    './projects': projectsModule,
    './products': source,
    './materials': materialsModule,
  });
const assets = load('lib/product-assets.ts');
const context = load('lib/product-detail-context.ts');
const building = load('data/world-building.ts');
const worldRooms = [...building.worldRooms];
const curationFor = (source) =>
  load('data/world-objects.ts', { './products': source });
const curation = curationFor(productsModule);
const objectStudies = [...curation.objectStudies];
const curatedSlugs = objectStudies.map(({ slug }) => slug);
const objectsRoom = worldRooms.find(({ id }) => id === 'objects');
const editorialImage = load('components/shared/editorial-image.tsx', {
  '@/data/images': images,
});
const textLink = load('components/shared/text-link.tsx', {
  'next/link': linkModule,
});
const sectionHeading = load('components/shared/section-heading.tsx', {
  './text-link': textLink,
});
const assetAvailability = load('components/product/asset-availability.tsx');
const projectSelection = load('components/project/project-selection.tsx', {
  '@/components/shared/section-heading': sectionHeading,
  './project-preview': load('components/project/project-preview.tsx', {
    'next/link': linkModule,
    '@/components/shared/editorial-image': editorialImage,
    '@/components/shared/text-link': textLink,
  }),
});
const selectionFor = (source) =>
  load('components/sections/object-selection.tsx', {
    'next/link': linkModule,
    '@/data/products': source,
    '@/lib/product-detail-context': context,
    '@/components/shared/editorial-image': editorialImage,
    '@/components/shared/section-heading': sectionHeading,
    '@/components/product/asset-availability': assetAvailability,
  });
const assetSections = load('components/product/product-asset-sections.tsx', {
  '@/lib/product-assets': assets,
  '@/components/shared/editorial-image': editorialImage,
  '@/components/shared/section-heading': sectionHeading,
  './sketchfab-viewer': load('components/product/sketchfab-viewer.tsx', {
    react,
    '@/lib/product-assets': assets,
  }),
  './asset-outbound-link': load('components/product/asset-outbound-link.tsx', {
    '@/lib/asset-analytics': load('lib/asset-analytics.ts'),
    '@/lib/product-assets': assets,
  }),
  './model-information': load('components/product/model-information.tsx', {
    '@/lib/product-assets': assets,
  }),
});
const detailFor = (source) =>
  load('components/product/product-detail.tsx', {
    'next/link': linkModule,
    '@/data/relationships': relationshipsFor(source),
    '@/lib/product-assets': assets,
    '@/lib/product-detail-context': context,
    '@/components/shared/editorial-image': editorialImage,
    '@/components/project/project-selection': projectSelection,
    '@/components/sections/object-selection': selectionFor(source),
    './asset-availability': assetAvailability,
    './product-asset-sections': assetSections,
  });
const detailModule = detailFor(productsModule);
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
const chrome = chromeFor(building);
// The building as it stood before TP3D PASS 13 opened the Archive, PASS 14
// the Lab and PASS 15 the Studio: the markup locks below compare against it,
// and the live map adds only those three rooms' entries.
const beforeOpenedRooms = {
  ...building,
  worldRooms: worldRooms.map((r) =>
    ['archive', 'lab', 'studio'].includes(r.id)
      ? { ...r, status: 'planned', href: null }
      : r,
  ),
};
const shellModule = load('components/world/object-study-shell.tsx', {
  './world-chrome': chrome,
});
const NOT_FOUND = 'NEXT_NOT_FOUND';
const routeFor = ({ source = productsModule, rooms = curation } = {}) =>
  load('app/products/[slug]/page.tsx', {
    'next/navigation': {
      notFound() {
        throw new Error(NOT_FOUND);
      },
    },
    '@/data/products': source,
    '@/data/world-objects': rooms,
    '@/data/world-building': building,
    '@/lib/product-detail-context': context,
    '@/components/product/product-detail': detailFor(source),
    '@/components/world/object-study-shell': shellModule,
  });
const route = routeFor();
const visit = async (slug, searchParams = {}, page = route) =>
  renderToStaticMarkup(
    await page.default({
      params: Promise.resolve({ slug }),
      searchParams: Promise.resolve(searchParams),
    }),
  );
const roomFor = (buildingModule = building) =>
  load('components/world/world-objects.tsx', {
    'next/link': linkModule,
    '@/data/world-objects': curation,
    '@/data/world-building': buildingModule,
    '@/lib/product-assets': assets,
    '@/lib/product-detail-context': context,
    '@/components/shared/editorial-image': editorialImage,
    './world-chrome': chromeFor(buildingModule),
    './gallery-depth': { GalleryDepth: nullComponent },
    './gallery-reveal': { GalleryReveal: nullComponent },
  });
const room = render(roomFor().WorldObjects);

const objects = context.objectsContext(objectsRoom, curatedSlugs);
const catalogue = context.CATALOGUE_PRODUCT_CONTEXT;
const editorial = (product) => render(detailModule.ProductDetail, { product });
const inRoom = (product, ctx = objects) =>
  render(detailModule.ProductDetail, { product, context: ctx });
// React hoists the priority image's preload ahead of the markup.
const split = (html) => {
  const hints = html.match(/^(?:<link rel="preload"[^>]*\/>)*/)[0];
  return { hints, body: html.slice(hints.length) };
};
const MARKER =
  '<div class="world-object-study" data-product-detail-shell="objects">';
const anyChrome = /class="wl-chrome\b/;
// Anchors by class, whatever the attribute order (next/link renders href
// first, plain anchors class first).
const hrefs = (html, className) =>
  (
    html.match(new RegExp(`<a\\b[^>]*class="${className}"[^>]*>`, 'g')) ?? []
  ).map((tag) => tag.match(/href="([^"]*)"/)?.[1] ?? null);
const relatedHrefs = (html) =>
  hrefs(
    html.match(
      /<section class="container section objects-section">[\s\S]*?<\/section>/,
    )?.[0] ?? '',
    'image-link',
  );

// PASS 10 locks: the editorial study, the collection and Room 02 rendered
// from their 92ae111 sources (today's data is unchanged).
const PASS10 = {
  'form-lounge-chair': '02802e95d32c14b3',
  'line-sofa': 'da10113db9ab964b',
  'round-coffee-table': '54f2b9c0e01d6590',
  'copper-pendant': '9e9f53ab57692d25',
  collection: '52480b9d58540eee',
  room: 'ac061a838463446c',
};

// 1. Room 02 links every study with ?from=objects, through the one helper.
{
  const studies = hrefs(room, 'wo-study');
  assert.deepEqual(
    studies,
    curatedSlugs.map((slug) => `/products/${slug}?from=objects`),
    '1. Room 02 studies open in the Objects context',
  );
  const source = code('components/world/world-objects.tsx');
  assert.match(
    source,
    /href=\{productDetailHref\(product\.slug, studyContext\)\}/,
  );
  assert.doesNotMatch(
    source,
    /`\/products\/\$\{/,
    '1. no hand-built product URL',
  );
  assert.doesNotMatch(source, /from=objects|source=|room=|world=/);
}

// 2. The collection, the homepage-adjacent sections and every other caller
// keep plain /products/[slug] links: only ProductDetail passes a context.
{
  const collection = render(selectionFor(productsModule).ObjectSelection, {
    title: 'The object collection.',
  });
  assert.equal(hash(collection), PASS10.collection, '2, 44. /products grid');
  assert.deepEqual(
    relatedHrefs(collection),
    products.map(({ slug }) => `/products/${slug}`),
  );
  assert.doesNotMatch(collection, /from=/);
  const callers = [
    'app/products/page.tsx',
    'app/collections/[slug]/page.tsx',
    'components/project/project-detail.tsx',
    'components/space/space-detail.tsx',
  ];
  for (const file of callers)
    assert.doesNotMatch(
      read(file).match(/<ObjectSelection[\s\S]*?\/>/)[0],
      /context=/,
      `2. ${file} stays plain`,
    );
  assert.equal(
    context.productDetailHref('line-sofa', catalogue),
    '/products/line-sofa',
  );
}

// 3–6. Context: curated slugs only, exact `from=objects`, never a 404 for a
// bad context, and no browser state.
{
  for (const slug of curatedSlugs)
    assert.equal(
      context.resolveProductDetailContext({
        from: 'objects',
        slug,
        curatedSlugs,
        objectsRoom,
      }).kind,
      'objects',
      `3. ${slug}`,
    );
  const ctx = context.resolveProductDetailContext({
    from: 'objects',
    slug: 'line-sofa',
    curatedSlugs,
    objectsRoom,
  });
  assert.deepEqual(
    { ...ctx, curatedSlugs: [...ctx.curatedSlugs] },
    {
      kind: 'objects',
      label: 'Room 02 / Objects',
      roomName: 'Objects',
      returnPath: '/world/objects',
      curatedSlugs,
    },
  );
  for (const from of [
    'OBJECTS',
    'gallery',
    'objects ',
    '',
    undefined,
    ['objects', 'foo'],
    ['objects', 'objects'],
  ])
    assert.equal(
      context.resolveProductDetailContext({
        from,
        slug: 'line-sofa',
        curatedSlugs,
        objectsRoom,
      }).kind,
      'catalogue',
      `4. ${JSON.stringify(from)}`,
    );
  // A room without a route never yields a context.
  assert.equal(
    context.objectsContext({ ...objectsRoom, href: null }, curatedSlugs).kind,
    'catalogue',
  );
  // 6. Pure: no data import, no storage, no browser API, no client code.
  const source = code('lib/product-detail-context.ts');
  assert.doesNotMatch(source, /^import\b/m, '6. no imports');
  assert.doesNotMatch(
    source,
    /sessionStorage|localStorage|indexedDB|document\.|window\.|cookie|'use client'/,
    '6',
  );
}

// 3, 7–11, 13, 16, 20–22. Every curated study, both contexts, through the
// real route.
for (const product of products) {
  const { slug } = product;
  const catalogueHtml = await visit(slug);
  // 13, 17, 19, 45. The editorial study is the PASS 10 page, byte for byte.
  assert.equal(catalogueHtml, editorial(product), `${slug}: catalogue page`);
  assert.equal(hash(catalogueHtml), PASS10[slug], `45. ${slug} is PASS 10`);
  assert.doesNotMatch(catalogueHtml, anyChrome, `13. ${slug}`);
  assert.doesNotMatch(
    catalogueHtml,
    /data-product-detail-shell|world-object-study/,
  );
  assert.deepEqual(hrefs(catalogueHtml, 'back-link'), ['/products'], '17');
  assert.match(catalogueHtml, />← All objects</);
  assert.ok(
    relatedHrefs(catalogueHtml).length === 3 &&
      relatedHrefs(catalogueHtml).every((h) => /^\/products\/[a-z-]+$/.test(h)),
    `19. ${slug}: plain related links`,
  );

  const page = split(await visit(slug, { from: 'objects' }));
  const inner = split(inRoom(product));
  const html = page.body;
  assert.equal(page.hints, inner.hints, 'the same image hint');
  assert.equal(
    html,
    `${MARKER}${html.slice(MARKER.length, html.indexOf(inner.body))}${inner.body}</div>`,
    `9. ${slug}: the marker wraps the World chrome and the shared study`,
  );
  assert.equal(
    (html.match(/<header class="wl-chrome wl-chrome--room">/g) ?? []).length,
    1,
    '7. one World chrome',
  );
  assert.equal(
    (html.match(/data-product-detail-shell=/g) ?? []).length,
    1,
    '9',
  );
  assert.equal((html.match(/<h1\b/g) ?? []).length, 1, 'one h1');
  assert.equal((html.match(/<main\b/g) ?? []).length, 1, 'one main');
  assert.match(html, /<main id="main">/, 'the skip link target');
  // 16. Back to Objects: a real link to the study's own place, first.
  assert.deepEqual(
    hrefs(html, 'back-link'),
    [`/world/objects#${slug}`],
    `16. ${slug}`,
  );
  assert.match(
    html,
    new RegExp(
      `<section class="container object-detail"><a href="/world/objects#${slug}" class="back-link">← Back to Objects</a><figure class="object-study-plate">`,
    ),
    '16. the way back comes before the plate',
  );
  // 18. Related studies keep the room's context.
  const related = relatedHrefs(html);
  assert.ok(
    related.length > 0 &&
      related.every((h) => /^\/products\/[a-z-]+\?from=objects$/.test(h)),
    `18. ${slug}: ${related}`,
  );
  assert.match(html, /<h2>Related studies\.<\/h2>/);
  const chromeHtml = html.slice(MARKER.length, html.indexOf('<main'));
  // 8. Objects is the current room, still a link, "You are here".
  assert.match(
    chromeHtml,
    /<a href="\/world\/objects" class="wl-map-entry" aria-current="page"><span class="wl-number">02<\/span><span class="wl-map-name">Objects<\/span><span class="wl-status">You are here<\/span><\/a>/,
    '8',
  );
  assert.equal((chromeHtml.match(/aria-current="page"/g) ?? []).length, 1);
  // 20. The World map is worldRooms, in order; planned rooms are text.
  assert.deepEqual(
    [
      ...chromeHtml.matchAll(
        /data-world-room="([a-z]+)" data-status="([a-z]+)"/g,
      ),
    ].map(([, id, status]) => `${id}:${status}`),
    worldRooms.map(({ id, status }) => `${id}:${status}`),
    '20',
  );
  // 21–22. Back to the Lobby, out to the website.
  assert.deepEqual(hrefs(chromeHtml, 'wl-back'), ['/world'], '21');
  assert.deepEqual(hrefs(chromeHtml, 'wl-exit'), ['/'], '22');
  assert.deepEqual(hrefs(chromeHtml, 'wl-wordmark'), ['/']);
  // 23–28. Every fact from the product, the disclosure from the helper.
  const pick = (re) => html.match(re)?.[1];
  assert.equal(pick(/<h1>([^<]*)<\/h1>/), product.title, '23');
  assert.equal(
    pick(/<div class="object-detail-copy"><p class="eyebrow">([^<]*)<\/p>/),
    `${product.category} / OBJECT STUDY`,
    '24',
  );
  assert.equal(
    pick(/<p class="object-collection">([^<]*)<\/p>/),
    product.collection,
    '25',
  );
  assert.equal(
    pick(/<dt>DIMENSIONS<\/dt><dd>([^<]*)<\/dd>/),
    product.dimensions,
    '26',
  );
  assert.equal(
    pick(/<dt>MATERIAL<\/dt><dd>([^<]*)<\/dd>/),
    product.material,
    '27',
  );
  assert.equal(
    pick(/<p class="content-note">([^<]*)<\/p>/),
    assets.productDisclosure(product),
    '28',
  );
  assert.match(html, new RegExp(`<p>${product.description}</p>`));
  // 29–30. The digital model is plain status, as in Room 02; no action.
  assert.match(
    html,
    /<\/dl><p class="object-study-status" data-asset-status="in-preparation">Digital model · in preparation<\/p><p class="content-note">/,
    '29',
  );
  assert.match(
    html,
    /<figcaption class="object-study-drawer"><span>Room 02 \/ Objects<\/span><span>Reference study<\/span><\/figcaption>/,
    'the photograph is named for what it is',
  );
  assert.doesNotMatch(
    html,
    /<button\b|aria-disabled|<iframe\b|sketchfab|fab\.com|Explore in 3D|View in 3D|Download|Get the 3D asset|\bBuy\b|Marketplace|data-asset-availability/i,
    `30. ${slug}: no asset action`,
  );
  // 31, 49–52. No asset section, viewer, canvas or Three.js today.
  assert.equal(
    render(assetSections.ProductAssetSections, { product }),
    '',
    '31',
  );
  assert.doesNotMatch(
    html,
    /asset-exploration|asset-model-information|asset-acquisition|<canvas|three/i,
    '31, 49–52',
  );
}

// 3, 5. Outside the curation: the editorial page, never the shell, never a
// 404 for the context alone.
{
  const smaller = {
    ...curation,
    objectStudies: objectStudies.slice(0, 3),
  };
  const outside = objectStudies[3];
  const page = routeFor({ rooms: smaller });
  const html = await visit(outside.slug, { from: 'objects' }, page);
  assert.equal(html, editorial(outside), '3. a study the room does not hang');
  // A product in the collection that the room never curated.
  const future = {
    ...products[0],
    slug: 'future-product',
    title: 'Future Product',
  };
  const larger = { products: [...products, future] };
  const futureRoute = routeFor({ source: larger, rooms: curationFor(larger) });
  const futureHtml = await visit(
    'future-product',
    { from: 'objects' },
    futureRoute,
  );
  assert.doesNotMatch(futureHtml, anyChrome, '5');
  assert.doesNotMatch(futureHtml, /data-product-detail-shell/, '5');
  assert.match(futureHtml, /<h1>Future Product<\/h1>/);
  assert.deepEqual(hrefs(futureHtml, 'back-link'), ['/products']);
  // 18. Inside the room, related studies come from the curation only.
  const inside = await visit('form-lounge-chair', { from: 'objects' }, page);
  const related = relatedHrefs(inside);
  assert.ok(
    related.length === 2 &&
      !related.some((h) => h.includes(outside.slug)) &&
      related.every((h) => h.endsWith('?from=objects')),
    `18. related studies respect objectStudies: ${related}`,
  );
  assert.ok(
    relatedHrefs(await visit('form-lounge-chair', {}, page)).includes(
      `/products/${outside.slug}`,
    ),
    '19. the collection keeps its own relationships',
  );
  // 4. Every invalid context is the PASS 10 page, byte for byte.
  for (const searchParams of [
    { from: 'OBJECTS' },
    { from: 'gallery' },
    { from: 'objects ' },
    { from: '' },
    { from: ['objects', 'foo'] },
    { from: ['objects', 'objects'] },
    { source: 'objects' },
    { room: 'objects' },
  ])
    assert.equal(
      await visit('line-sofa', searchParams),
      editorial(products[1]),
      `4. ${JSON.stringify(searchParams)}`,
    );
  // 38. Still a content route: an unknown product is a 404 in any context.
  await assert.rejects(visit('not-a-product', { from: 'objects' }), {
    message: NOT_FOUND,
  });
  await assert.rejects(visit('not-a-product'), { message: NOT_FOUND });
  assert.deepEqual(
    [...route.generateStaticParams()].map(({ slug }) => slug),
    products.map(({ slug }) => slug),
    '38',
  );
}

// 39. Metadata is the PASS 10 metadata in every context (canonical deferred).
for (const { slug, title, description } of products)
  for (const searchParams of [{}, { from: 'objects' }])
    assert.deepEqual(
      {
        ...(await route.generateMetadata({
          params: Promise.resolve({ slug }),
          searchParams: Promise.resolve(searchParams),
        })),
      },
      { title, description },
      `39. ${slug}`,
    );
assert.doesNotMatch(
  code('app/products/[slug]/page.tsx'),
  /alternates|canonical/,
);

// 32–35. A fixture with an available asset (never production data): the
// shell keeps the product's own sections, one poster-first viewer, truthful
// status; no iframe before an explicit Explore.
{
  const uid = '0123456789abcdef0123456789abcdef';
  const fixture = {
    ...products[0],
    asset: {
      available: true,
      viewer: {
        provider: 'sketchfab',
        uid,
        url: `https://sketchfab.com/3d-models/test-object-${uid}`,
      },
      marketplace: {
        provider: 'fab',
        url: 'https://www.fab.com/listings/test-only-unpublished',
      },
      formats: ['GLB'],
      version: '1.0',
    },
  };
  const sections = render(assetSections.ProductAssetSections, {
    product: fixture,
  });
  const chamber = render(shellModule.ObjectStudyShell, {
    children: jsx(detailModule.ProductDetail, {
      product: fixture,
      context: objects,
    }),
  });
  const editorialFixture = editorial(fixture);
  for (const html of [chamber, editorialFixture]) {
    assert.ok(html.includes(sections), '32. the same asset sections');
    assert.equal((html.match(/class="asset-viewer"/g) ?? []).length, 1, '34');
    assert.match(html, /data-viewer-state="poster"/, '33');
    assert.doesNotMatch(html, /<iframe\b/, '33. no iframe before Explore');
  }
  assert.match(sections, /asset-exploration/);
  assert.match(sections, /MODEL INFORMATION/);
  assert.match(sections, /Get the 3D asset/);
  assert.match(
    chamber,
    /<p class="object-study-status" data-asset-status="available">3D asset · available<\/p>/,
    '32. truthful status',
  );
  assert.doesNotMatch(
    chamber,
    /data-asset-availability/,
    'one status, not two',
  );
  assert.match(editorialFixture, /data-asset-availability/);
  assert.doesNotMatch(editorialFixture, /object-study-status/);
  assert.match(
    chamber,
    new RegExp(
      assets.productDisclosure(fixture).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
    ),
  );
  // A model render is named as one, here and in the room.
  const render3d = inRoom({ ...products[0], imageRole: 'model-render' });
  assert.match(render3d, /<span>Model render<\/span><\/figcaption>/);
  assert.equal(
    assets.imageRoleLabel({ imageRole: 'model-render' }),
    'Model render',
  );
  assert.equal(
    assets.assetStatusLabel({ available: false }),
    'Digital model · in preparation',
  );
  // 34–35. One product viewer, unchanged; the World viewer stays separate.
  assert.equal(
    digest('components/product/sketchfab-viewer.tsx'),
    '0bda9996a13c3b02',
    '34',
  );
  assert.equal(
    digest('components/worlds/sketchfab-viewer.tsx'),
    '6db839abf80c3b6e',
    '35',
  );
  for (const file of [
    'components/product/product-detail.tsx',
    'components/world/object-study-shell.tsx',
    'app/products/[slug]/page.tsx',
    'lib/product-detail-context.ts',
  ])
    assert.doesNotMatch(
      code(file),
      /components\/worlds\/|world-detail|sketchfab/i,
      `35. ${file}`,
    );
}

// 1, 29. Room 02 and its studies say the same thing from the same helpers.
{
  const source = code('components/world/world-objects.tsx');
  assert.match(source, /\{imageRoleLabel\(product\)\}/);
  assert.match(source, /\{assetStatusLabel\(product\.asset\)\}/);
  assert.match(
    code('components/product/product-detail.tsx'),
    /\{assetStatusLabel\(p\.asset\)\}/,
  );
  assert.equal(
    (room.match(/>Digital model · in preparation</g) ?? []).length,
    4,
  );
}

// 40. Room 02 is PASS 10's room; only the studies' hrefs gained the context
// (and, since TP3D PASS 13, 14 and 15, the World map's Archive, Lab and
// Studio entries, now links).
{
  const roomBefore = render(roomFor(beforeOpenedRooms).WorldObjects);
  assert.equal(
    hash(roomBefore.replaceAll('?from=objects"', '"')),
    PASS10.room,
    '40. Room 02 unchanged apart from ?from=objects',
  );
  const withoutNewRooms = (markup) =>
    markup.replace(
      /<li\b[^>]*data-world-room="(?:archive|lab|studio)"[\s\S]*?<\/li>/g,
      '<li/>',
    );
  assert.equal(
    withoutNewRooms(room),
    withoutNewRooms(roomBefore),
    '40. only the map entries of the Archive, the Lab and the Studio changed',
  );
  assert.match(room, /<a href="\/world\/archive" class="wl-map-entry">/);
  assert.match(room, /<a href="\/world\/lab" class="wl-map-entry">/);
  assert.match(room, /<a href="\/world\/studio" class="wl-map-entry">/);
}
assert.equal(
  (room.match(/\?from=objects"/g) ?? []).length,
  curatedSlugs.length,
);

// CSS. Every rule of the study's shell is scoped to the server marker; the
// editorial chrome is display: none from the first paint, nowhere else.
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
const ROOT = ":root:has([data-product-detail-shell='objects'])";
const shellCss = read('components/world/object-study-shell.css');
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
      selector.startsWith('.world-object-study') || selector.startsWith(ROOT),
      `scoped to the marker: ${selector}`,
    );
{
  // 10–12. Display none: out of sight, the tab order and the a11y tree.
  for (const part of ['site-header', 'site-footer'])
    assert.match(
      shellRule(`${ROOT} .${part}`),
      /^\s*display: none;\s*$/,
      `10–11. ${part}`,
    );
  assert.doesNotMatch(shellCss, /opacity: 0;|visibility|aria-hidden/, '12');
  // 14. Nowhere else does a stylesheet hide the editorial chrome, and the
  // layout still mounts it on every product page.
  const cssFiles = (dir) =>
    readdirSync(new URL(dir, root), { recursive: true })
      .filter((file) => file.endsWith('.css'))
      .map((file) => `${dir}${file.replace(/\\/g, '/')}`);
  const markers = {
    'components/world/world-detail-shell.css':
      ":root:has([data-world-detail-shell='gallery'])",
    'components/world/object-study-shell.css': ROOT,
  };
  for (const file of [...cssFiles('app/'), ...cssFiles('components/')])
    for (const { selectors, body } of rules(read(file)))
      if (/display:\s*none/.test(body))
        for (const selector of selectors)
          if (/\.site-(?:header|footer)$/.test(selector))
            assert(
              markers[file] && selector.startsWith(markers[file]),
              `14. ${file}: ${selector}`,
            );
  const layout = read('app/layout.tsx');
  assert.match(
    layout,
    /<EditorialChrome>\s*<SiteHeader \/>\s*<\/EditorialChrome>/,
    '14',
  );
  assert.match(
    layout,
    /<EditorialChrome>\s*<SiteFooter \/>\s*<\/EditorialChrome>/,
    '14',
  );
  for (const path of ['/products', '/products/form-lounge-chair'])
    assert.equal(
      building.isWorldPath(path),
      false,
      `14. ${path} is not a World path`,
    );
  // 15. First paint: the World ground from the root, stone behind every
  // photograph, the stylesheet imported by a server component.
  assert.match(shellRule(ROOT), /background: var\(--world-ground\);/, '15');
  assert.match(shellRule(`${ROOT} body`), /color-scheme: dark;/, '15');
  const wrapper = shellRule('.world-object-study');
  assert.match(wrapper, /background: var\(--world-ground\);/);
  assert.match(wrapper, /--paper: #2a221b;/);
  assert.match(wrapper, /--background: var\(--world-ground\);/);
  assert.match(
    shellRule('.world-object-study .editorial-image'),
    /background: var\(--paper\);/,
    '15',
  );
  const shellSource = read('components/world/object-study-shell.tsx');
  assert.doesNotMatch(
    shellSource,
    /^['"]use client['"]/m,
    'a server component',
  );
  assert.match(shellSource, /import '\.\/object-study-shell\.css';/);
  assert.match(
    shellSource,
    /import '@\/components\/shared\/spatial-type\.css';/,
  );
  // No client effect, observer or DOM mutation decides the shell (53); the
  // editorial chrome still steps aside on World paths only.
  for (const file of [
    'components/world/object-study-shell.tsx',
    'components/product/product-detail.tsx',
    'components/sections/object-selection.tsx',
    'lib/product-detail-context.ts',
    'app/products/[slug]/page.tsx',
    'components/layout/editorial-chrome.tsx',
  ])
    assert.doesNotMatch(
      code(file),
      /useEffect|useLayoutEffect|querySelector|MutationObserver|IntersectionObserver|ResizeObserver|\.style\.|setInterval|setTimeout|requestAnimationFrame/,
      `15, 53. ${file}`,
    );
  for (const file of [
    'components/world/object-study-shell.tsx',
    'components/product/product-detail.tsx',
    'components/sections/object-selection.tsx',
    'app/products/[slug]/page.tsx',
  ])
    assert.doesNotMatch(
      read(file),
      /^['"]use client['"]/m,
      `server-rendered: ${file}`,
    );
  assert.match(
    code('components/layout/editorial-chrome.tsx'),
    /return isWorldPath\(usePathname\(\)\) \? null : children;/,
  );
  // The World's type and tokens; PASS 09 focus over imagery.
  const chromeCss = read('components/world/world-chrome.css');
  const tokens = rules(chromeCss).find(({ selectors }) =>
    selectors.includes('.world-object-study'),
  );
  assert(tokens, 'the study shares the World tokens');
  assert.match(tokens.body, /--wl-serif: 'Cormorant Spatial'/);
  assert.match(chromeCss, /\.world-object-study :focus-visible/);
  assert.match(wrapper, /--font-display: var\(--wl-serif\);/);
  assert.match(wrapper, /--font-body: var\(--wl-sans\);/);
  assert.match(
    shellRule('.world-object-study .image-link:focus-visible'),
    /outline: 2px solid var\(--wl-ivory\);[\s\S]*box-shadow: 0 0 0 4px var\(--world-ground\);/,
  );
  // The photograph rests whole on its mount: never cropped, tinted or cut out.
  const plate = shellRule(
    '.world-object-study .object-study-plate .editorial-image img',
  );
  assert.match(plate, /object-fit: contain;/);
  assert.doesNotMatch(
    shellCss,
    /filter|mix-blend|drop-shadow|box-shadow: 0 [1-9]|background-image|clip-path/,
    'no treatment of the photograph',
  );
  // Phones, tablet portrait and short landscape follow the reading order.
  assert.match(
    shellCss,
    /@media \(max-width: 767px\) \{[\s\S]*?'return'\s*'plate'\s*'copy'/,
  );
  assert.match(
    shellCss,
    /@media \(min-width: 768px\) and \(max-width: 1199px\) and \(orientation: portrait\) \{[\s\S]*?'return'\s*'plate'\s*'copy'/,
  );
  assert.match(
    shellCss,
    /@media \(max-width: 1199px\) and \(max-height: 540px\) and \(orientation: landscape\) \{[\s\S]*?'plate return'\s*'plate copy'/,
  );
  // Surfaces and ink only: no stacking, pointer, motion or viewport lock.
  const declarations = shellCss.replace(/\/\*[\s\S]*?\*\//g, '');
  assert.doesNotMatch(
    declarations,
    /z-index|pointer-events|inert|position: (?:fixed|sticky)|overflow: hidden|(?<!min-)height: 100|transition|animation|@keyframes|will-change/,
    '53. no motion, no lock',
  );
  assert.equal((declarations.match(/display: none/g) ?? []).length, 1);
}

// 36–37, 41–43, 46–48, 54. No route, no redirect; the rest of the World,
// the collection and the homepage are untouched.
{
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
      // TP3D PASS 14: Room 04.
      'world/lab/page.tsx',
      'world/objects/page.tsx',
      'world/page.tsx',
      // TP3D PASS 15: Room 05.
      'world/studio/page.tsx',
      'worlds/[slug]/page.tsx',
      'worlds/page.tsx',
    ],
    '36. no new route',
  );
  assert(!existsSync(new URL('app/world/objects/[slug]', root)), '36');
  for (const file of ['middleware.ts', 'middleware.js', 'proxy.ts'])
    assert(!existsSync(new URL(file, root)), `37. no ${file}`);
  assert.doesNotMatch(
    code('app/products/[slug]/page.tsx'),
    /redirect|NextResponse|location\./i,
    '37',
  );
  const vercel = json('vercel.json');
  for (const key of ['redirects', 'rewrites', 'routes'])
    assert(!(key in vercel), `37. vercel.json ${key}`);
  assert.doesNotMatch(read('next.config.ts'), /redirects|rewrites/, '37');
  const LOCKED = {
    // 41. The Lobby.
    'components/world/world-lobby.tsx': 'bf0bc493f965b78c',
    'components/world/world-lobby.css': 'e3ef8536f38af67f',
    'app/world/page.tsx': '6102ba56ed1b812a',
    // 42. Room 01 / Gallery.
    'components/world/world-gallery.tsx': 'f1a4d8da704c60d5',
    'components/world/world-gallery.css': '38d790dd070c413d',
    'app/world/gallery/page.tsx': '9a91a103ee931023',
    'data/world-gallery.ts': '320644378c2b4634',
    // 43. The Gallery's viewing chamber.
    'components/world/world-detail-shell.tsx': '3e53405aaff87ab1',
    'components/world/world-detail-shell.css': '59df760b8e04e445',
    'app/worlds/[slug]/page.tsx': '6a120db7565dca00',
    'lib/world-detail-context.ts': 'a7f91f21ecd0538a',
    // 40. Room 02's styles, route, curation and building.
    'components/world/world-objects.css': '038f31c72e212ffb',
    'app/world/objects/page.tsx': 'f5796bf6efe8f086',
    'data/world-objects.ts': '881f4e2816f5def9',
    // TP3D PASS 13 opened the Archive, TP3D PASS 14 the Lab and TP3D PASS 15
    // the Studio (status, href, a truthful description each).
    'data/world-building.ts': '972ff851d301302b',
    'components/world/world-chrome.tsx': '3a37f3c5c372903f',
    // 44, 46–47. The collection, the homepage, the World catalogue.
    'app/products/page.tsx': '2257cc689fdfa941',
    'app/page.tsx': '9b4f5f0e730af60f',
    'app/worlds/page.tsx': '57084f2da546497a',
    // The product system around the study.
    'components/product/product-asset-sections.tsx': '12b733211f966b05',
    'components/product/asset-availability.tsx': '9afabeb2c8683aeb',
    'components/product/model-information.tsx': '5c7dc7ecc01512e2',
    'components/product/product-assets.css': '0d5227758a98f8fe',
    'components/project/project-selection.tsx': '796748c6ff5bae13',
    'data/products.ts': '458f6a1e2163ef89',
    'data/relationships.ts': '0d3ee58a0ec101f3',
    'data/types.ts': 'defd33c83b08986c',
    'app/layout.tsx': 'd1f018f9f20b3294',
    'components/layout/site-header.tsx': 'dfcfe66f79f370b1',
    'components/layout/site-footer.tsx': '8e4ed9e15415afcf',
  };
  for (const [path, value] of Object.entries(LOCKED))
    assert.equal(digest(path), value, `${path} is locked`);
  // 49–53. No canvas, Three.js, network or loop in anything this pass added.
  for (const file of [
    'components/world/object-study-shell.tsx',
    'components/world/object-study-shell.css',
    'lib/product-detail-context.ts',
    'app/products/[slug]/page.tsx',
  ]) {
    const source = code(file);
    assert.doesNotMatch(
      source,
      /<canvas|getContext|three|webgl|requestAnimationFrame/i,
      `49–53. ${file}`,
    );
    assert.doesNotMatch(
      source,
      /https?:|url\(|@import|<img|<link|<script|<iframe/,
      `49–52. ${file}`,
    );
  }
  // 48, 54. The other gates stay wired; they run as their own commands.
  const { scripts } = json('package.json');
  assert.equal(
    scripts['check:object-study'],
    'node scripts/check-object-study.mjs',
  );
  for (const name of [
    'check:objects-room',
    'check:world-shell',
    'check:world-ux',
    'check:gallery',
    'check:exhibit',
    'check:world',
    'check:worlds',
    'check:assets',
    'check:content',
    'check:routes',
    'build',
    'build:vercel',
  ])
    assert(scripts[name], name);
}

console.log(
  'Object study passed: Room 02 opens each curated study at /products/[slug]?from=objects through productDetailHref; a validated Objects visit renders the World chrome (Objects current, Back to Lobby → /world, Exit → /, the World map from worldRooms) and the server shell marker around the shared ProductDetail, with ← Back to Objects → /world/objects#slug first, the photograph named from imageRole, the digital model as plain status from asset.available, every fact from data/products.ts, the productDisclosure copy, and related studies that keep ?from=objects inside the curation; the collection, every invalid context and every uncurated product render the PASS 10 page byte for byte; the editorial header and footer are display: none only under the two shell markers; the study is scoped to its marker on the World ground in spatial type; an available-asset fixture keeps the product sections and one poster-first viewer with no iframe; metadata is context-free; no route, redirect, canvas, Three.js or loop was added, and Room 02, the Lobby, the Gallery, its chamber, /products and the homepage are locked.',
);
