/** TP3D PASS 10 — Room 02, Objects. The building directory, the curation
 * (slugs only, resolved against `data/products.ts`), the real room rendered
 * to markup, links and fragments, truthful asset status, the 3D/network
 * contract, CSS for touch, phones, short landscape, reduced motion and
 * depth, and locks on the product system this pass must not touch. Browser
 * QA (the PASS 10 record) covers layout, arrival, journeys and requests.
 * Numbers refer to the PASS 10 brief; 46–56 are the existing commands. */
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

const building = load('data/world-building.ts');
const worldRooms = [...building.worldRooms];
const imagesModule = load('data/images.ts', {
  './image-dimensions.json': json('data/image-dimensions.json'),
});
const productsModule = load('data/products.ts', { './images': imagesModule });
const products = [...productsModule.products];
const curation = load('data/world-objects.ts', {
  './products': productsModule,
});
const objectStudies = [...curation.objectStudies];
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
const editorialImage = load('components/shared/editorial-image.tsx', {
  '@/data/images': imagesModule,
});
const roomFor = (curationModule = curation) =>
  load('components/world/world-objects.tsx', {
    'next/link': linkModule,
    '@/data/world-objects': curationModule,
    '@/data/world-building': building,
    // TP3D PASS 11: the photograph and status labels are shared with the
    // object studies, and studies open in the Objects context.
    '@/lib/product-assets': load('lib/product-assets.ts'),
    '@/lib/product-detail-context': load('lib/product-detail-context.ts'),
    '@/components/shared/editorial-image': editorialImage,
    './world-chrome': chromeFor(building),
    './gallery-depth': { GalleryDepth: nullComponent },
    './gallery-reveal': { GalleryReveal: nullComponent },
  });
const html = render(roomFor().WorldObjects);
const roomSource = read('components/world/world-objects.tsx');
const css = read('components/world/world-objects.css');

// 1–6. The route, inside the World, in the World chrome with Objects current.
{
  assert(existsSync(new URL('app/world/objects/page.tsx', root)), '1');
  const page = read('app/world/objects/page.tsx');
  assert.match(page, /absolute: 'Objects — TP3D'/);
  assert.match(page, /<div data-world-page="objects">\s*<WorldObjects \/>/);
  assert.doesNotMatch(page, /'use client'/, 'server-rendered');
  assert.doesNotMatch(
    roomSource,
    /^['"]use client['"]/m,
    'the room is a server component',
  );
  assert.equal((html.match(/<h1\b/g) ?? []).length, 1, '2 / 36. one h1');
  assert.equal(building.isWorldPath('/world/objects'), true, '3');
  // 4. No suppression of its own: the editorial chrome steps aside through
  // the existing World path rule.
  assert.match(
    read('components/layout/editorial-chrome.tsx'),
    /isWorldPath\(usePathname\(\)\) \? null : children/,
  );
  assert.doesNotMatch(css, /site-header|site-footer/, '4');
  assert.equal(
    (html.match(/<header class="wl-chrome wl-chrome--room">/g) ?? []).length,
    1,
    '5. the World chrome, the one header',
  );
  assert.equal((html.match(/<header\b/g) ?? []).length, 1);
  assert.match(
    html,
    /<a href="\/world\/objects" class="wl-map-entry" aria-current="page"><span class="wl-number">02<\/span><span class="wl-map-name">Objects<\/span><span class="wl-status">You are here<\/span><\/a>/,
    '6',
  );
  assert.match(
    html,
    /<main id="main" class="world-objects" data-world-objects="">/,
  );
}

// 7–12. The building directory: two open rooms, three planned wings, and the
// Lobby deriving Objects from it.
{
  const byId = Object.fromEntries(worldRooms.map((r) => [r.id, r]));
  assert.deepEqual(
    [byId.objects.status, byId.objects.href, byId.objects.futurePath],
    ['available', '/world/objects', '/world/objects'],
    '7',
  );
  assert.deepEqual(
    [byId.gallery.status, byId.gallery.href],
    ['available', '/world/gallery'],
    '8',
  );
  for (const id of ['archive', 'lab', 'studio'])
    assert.deepEqual(
      [byId[id].status, byId[id].href],
      ['planned', null],
      `9–11. ${id}`,
    );
  assert(!existsSync(new URL('app/world/archive', root)));
  assert(!existsSync(new URL('app/world/lab', root)));
  assert(!existsSync(new URL('app/world/studio', root)));
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
  const objectsEntry = (markup) =>
    markup.match(
      /<nav class="wl-rooms"[\s\S]*?data-world-room="objects"[^>]*>([\s\S]*?)<\/li>/,
    )[1];
  assert.match(
    objectsEntry(lobbyFor(building)),
    /^<a href="\/world\/objects" class="wl-room-body">/,
    '12',
  );
  const closed = {
    ...building,
    worldRooms: worldRooms.map((r) =>
      r.id === 'objects' ? { ...r, status: 'planned', href: null } : r,
    ),
  };
  assert.match(
    objectsEntry(lobbyFor(closed)),
    /^<div class="wl-room-body">/,
    '12. from the data, not hard-coded',
  );
  assert.doesNotMatch(
    read('components/world/world-lobby.tsx'),
    /world\/objects|Objects/,
    '12',
  );
}

// 13–22. Data: the curation is slugs only, resolved against the products in
// order; every fact on the page comes from the product.
{
  const curationSource = read('data/world-objects.ts');
  assert.match(curationSource, /from '\.\/products'/, '13');
  assert.match(roomSource, /from '@\/data\/world-objects'/, '13');
  assert.doesNotMatch(
    curationSource,
    /\b(?:title|description|category|collection|dimensions|material|image|asset|src|alt)\s*:/,
    '14. no duplicated metadata',
  );
  const slugs = [...curation.objectStudySlugs];
  assert.deepEqual(
    objectStudies.map((p) => p.slug),
    slugs,
    '16. curation order',
  );
  assert.equal(
    objectStudies.length,
    slugs.length,
    '15. every curated slug exists',
  );
  for (const slug of slugs)
    assert(
      products.some((p) => p.slug === slug),
      `15. ${slug}`,
    );
  assert.deepEqual(
    [
      ...curation.resolveObjectStudies(
        ['line-sofa', 'not-an-object', 'copper-pendant'],
        products,
      ),
    ].map((p) => p.slug),
    ['line-sofa', 'copper-pendant'],
    '15. an unknown slug is dropped, so the count check above fails',
  );
  assert.deepEqual(
    [...slugs].sort(byCodeUnit),
    products.map((p) => p.slug).sort(byCodeUnit),
    '17. the four current object studies',
  );
  for (const p of objectStudies) {
    const escape = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
    for (const value of [
      p.title,
      p.category,
      p.collection,
      p.dimensions,
      p.material,
    ])
      assert(html.includes(escape(value)), `18–20. ${p.slug}: ${value}`);
    assert(
      html.includes(`alt="${escape(p.image.alt)}"`),
      `${p.slug}: real alt`,
    );
    assert(html.includes(`src="${p.image.src}"`));
    for (const value of [p.title, p.dimensions, p.material, p.collection])
      assert(!roomSource.includes(value), `${p.slug}: nothing authored twice`);
  }
  // 21. Status comes from asset.available, in both directions.
  const withAvailable = {
    ...curation,
    objectStudies: objectStudies.map((p, i) =>
      i === 1 ? { ...p, asset: { ...p.asset, available: true } } : p,
    ),
  };
  const future = render(roomFor(withAvailable).WorldObjects);
  assert.equal(
    (future.match(/data-asset-status="available"/g) ?? []).length,
    1,
    '21',
  );
  assert.match(future, />3D asset · available</, '21');
  // 22. Today nothing is available, so nothing says so.
  assert(products.every((p) => p.asset.available === false));
  assert.equal(
    (html.match(/data-asset-status="in-preparation"/g) ?? []).length,
    4,
    '22',
  );
  assert.equal(
    (html.match(/>Digital model · in preparation</g) ?? []).length,
    4,
    '22',
  );
  assert.doesNotMatch(
    html,
    /3D asset · available|data-asset-status="available"/,
    '22',
  );
  // The photograph is named for what it is.
  assert.equal((html.match(/>Reference study</g) ?? []).length, 4);
  const asRender = {
    ...curation,
    objectStudies: objectStudies.map((p, i) =>
      i === 0 ? { ...p, imageRole: 'model-render' } : p,
    ),
  };
  assert.match(render(roomFor(asRender).WorldObjects), />Model render</);
}

// 23–28. Links and fragments.
{
  const articles = [
    ...html.matchAll(/<article\b([^>]*)>([\s\S]*?)<\/article>/g),
  ];
  assert.equal(articles.length, 4);
  const ids = articles.map(([, tag]) => tag.match(/\bid="([^"]+)"/)[1]);
  assert.deepEqual(
    ids,
    objectStudies.map((p) => p.slug),
    '25. stable fragment ids',
  );
  assert.equal(new Set(ids).size, ids.length, '25. unique');
  assert.equal(
    (html.match(/\bid="([^"]+)"/g) ?? []).length,
    new Set(html.match(/\bid="([^"]+)"/g)).size,
    'no duplicate id on the page',
  );
  for (const [index, [, , body]] of articles.entries()) {
    const slug = ids[index];
    assert.deepEqual(
      [...body.matchAll(/<a\b[^>]*href="([^"]+)"/g)].map(([, h]) => h),
      // TP3D PASS 11: the study opens in the Objects context, on the same
      // content route.
      [`/products/${slug}?from=objects`],
      `23. ${slug}: one real link to its object study`,
    );
    assert.match(
      body,
      new RegExp(
        `${String(index + 1).padStart(2, '0')}(?:<!-- -->)? / (?:<!-- -->)?04|${String(index + 1).padStart(2, '0')} / 04`,
      ),
    );
    assert.match(body, /<h2 id="object-[^"]+" class="wo-title">/, '37');
  }
  const index = html.match(
    /<nav class="wo-index" aria-labelledby="world-objects-index">([\s\S]*?)<\/nav>/,
  );
  assert(index, '38. the Object Index is navigation');
  assert.match(
    html,
    /<p id="world-objects-index" class="wo-index-title">Object index<\/p>/,
  );
  assert.match(index[1], /^[\s\S]*?<ol>/);
  const anchors = [...index[1].matchAll(/<a href="#([^"]+)">/g)].map(
    ([, s]) => s,
  );
  assert.deepEqual(anchors, ids, '24. every index link lands on a study');
  assert.match(html, /<a class="wo-collection-link" href="\/products">/, '26');
  assert.match(html, /<a href="\/world" class="wl-back">/, '27');
  assert.match(html, /<a href="\/world" class="wo-lobby">/, '27');
  assert.match(html, /<a href="\/" class="wl-exit">/, '28');
  assert.doesNotMatch(
    html,
    /href="#"|javascript:|tabindex="-1"/i,
    'no fake or hidden links',
  );
  assert.equal((html.match(/<h2\b/g) ?? []).length, 4, '37. one h2 per study');
  // Only the first study is priority-loaded; every image keeps its size.
  assert.equal(
    (html.match(/<img\b[^>]*fetchPriority="high"/g) ?? []).length,
    1,
  );
  assert.equal(
    (html.match(/<link rel="preload"/g) ?? []).length,
    1,
    'one preload: the first study',
  );
  assert.equal((html.match(/loading="lazy"/g) ?? []).length, 3);
  assert.equal(
    (html.match(/<img\b(?=[^>]*\bwidth="\d+")(?=[^>]*\bheight="\d+")/g) ?? [])
      .length,
    4,
  );
}

// 29–35, 39. No 3D, no viewer, no marketplace, no fake control.
{
  assert.doesNotMatch(
    html,
    /<iframe\b|<canvas\b|<button\b|aria-disabled|disabled/,
    '29, 32, 39',
  );
  assert.doesNotMatch(
    html,
    /sketchfab|fab\.com|\.glb\b|\.gltf\b|three/i,
    '30, 33, 34',
  );
  for (const file of [
    'components/world/world-objects.tsx',
    'components/world/world-objects.css',
    'data/world-objects.ts',
    'app/world/objects/page.tsx',
  ]) {
    // Code only: the comments may say what the room deliberately is not.
    // TP3D PASS 11: the room shares exactly two plain-text labels with its
    // object studies (what the photograph is, the digital model's status);
    // nothing else of the asset system may enter it.
    const labels =
      "import { assetStatusLabel, imageRoleLabel } from '@/lib/product-assets';";
    if (file === 'components/world/world-objects.tsx')
      assert.equal(
        read(file).split(labels).length,
        2,
        '35. the two labels only',
      );
    const source = read(file)
      .replace(labels, '')
      .replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*|\{\/\*[\s\S]*?\*\/\}/g, '');
    assert.doesNotMatch(
      source,
      /from ['"]three['"]|import\(|<canvas|<iframe|getContext|webgl/i,
      `31–32. ${file}`,
    );
    assert.doesNotMatch(
      source,
      /sketchfab|SketchfabViewer|ProductAssetSections|product-assets|resolveProductAsset|marketplace|fab\.com|\.glb/i,
      `35. ${file}`,
    );
    assert.doesNotMatch(
      source,
      /\b(?:shop|buy|marketplace|asset store|download)\b/i,
      `no shopping language in ${file}`,
    );
  }
  assert.match(
    html,
    /<p class="wo-asset" data-asset-status="in-preparation">/,
    '39. status is text',
  );
}

// 40–45. CSS: targets, phones, short landscape, reduced motion, depth.
{
  // A rule whose whole selector list is `selector` (not the tail of another).
  const rule = (selector) => {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const found = css.match(
      new RegExp(`(?:\\}|\\*/)\\n${escaped} \\{([^}]*)\\}`),
    );
    assert(found, selector);
    return found[1];
  };
  assert.match(
    rule('.wo-study,\n.wo-collection-link,\n.wo-lobby'),
    /min-height: 44px;/,
    '40',
  );
  assert.match(rule('.wo-index a'), /min-height: 56px;/, '40');
  assert.match(rule('.world-objects'), /overflow-x: clip;/, '41–42');
  const phones = css.slice(css.indexOf('@media (max-width: 767px) {'));
  assert.match(
    phones,
    /\.wo-specimen\[data-setting\] \{\s*grid-template-columns: 1fr;/,
    '41–42. one column',
  );
  assert.match(phones, /\.wo-pair \{\s*grid-template-columns: 1fr;/);
  assert.match(phones, /\.wo-index ol \{\s*grid-template-columns: 1fr;/);
  const short = css.slice(
    css.indexOf(
      '@media (max-width: 1199px) and (max-height: 540px) and (orientation: landscape) {',
    ),
  );
  assert.match(
    short,
    /\.wo-entry \{\s*padding-top: calc\(68px \+ 20px\);/,
    '43. the title clears the 68px chrome',
  );
  assert.match(
    read('components/world/world-chrome.css'),
    /@media \(max-width: 1199px\) and \(max-height: 540px\) and \(orientation: landscape\) \{\s*\.wl-chrome \{\s*height: 68px;/,
  );
  // 44–45. Depth: one study, desktop fine pointer, no reduced motion, the
  // photograph only, at most 4px and a 1.015 scale.
  assert.equal(
    (html.match(/data-object-depth=""/g) ?? []).length,
    1,
    '45. one study',
  );
  assert.match(
    html,
    /<article id="form-lounge-chair"[^>]*data-object-depth=""/,
  );
  const depth = css.slice(
    css.indexOf(
      '@media (min-width: 1200px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference) {',
    ),
  );
  assert.match(
    depth,
    /^@media[^{]+\{\s*\[data-object-depth\] \.wo-plate \.editorial-image img \{/,
    '45. the photograph only',
  );
  for (const [, scale] of css.matchAll(/scale\(([\d.]+)\)/g))
    assert(Number(scale) <= 1.02, `scale ${scale}`);
  for (const [, px] of css.matchAll(/\* (-?\d+)px\)/g))
    assert(Math.abs(Number(px)) <= 4, `offset ${px}px`);
  assert.match(
    roomSource,
    /<GalleryDepth target="\[data-object-depth\]" property="--wo-depth" \/>/,
  );
  assert.match(
    roomSource,
    /<GalleryReveal\s+root="main\[data-world-objects\]"\s+item="\[data-object-specimen\]"\s+\/>/,
  );
  assert.match(
    read('components/world/gallery-reveal.tsx'),
    /if \(reduced\.matches\) return;/,
    '44',
  );
  assert.match(
    read('lib/motion/pointer.ts'),
    /MOTION_QUERIES\.pointerMotion/,
    '44–45. coarse pointer and reduced motion never drive depth',
  );
  assert.match(
    read('app/globals.css'),
    /prefers-reduced-motion: reduce[\s\S]*animation: none !important;/,
    '44. the arrival is a cut',
  );
  // The Gallery keeps its own defaults.
  assert.match(
    read('components/world/world-gallery.tsx'),
    /<GalleryReveal \/>\s*<GalleryDepth \/>/,
  );
  assert.match(
    read('components/world/gallery-reveal.tsx'),
    /root = 'main\[data-world-gallery\]',\s*item = '\[data-gallery-exhibit\]'/,
  );
  assert.match(
    read('components/world/gallery-depth.tsx'),
    /target = '\[data-gallery-depth\]',\s*property = '--wg-depth'/,
  );
  // World focus over imagery: ring and mat (PASS 09).
  assert.match(
    rule('.wo-specimen:has(.wo-study:focus-visible) .wo-plate'),
    /outline: 2px solid var\(--wl-ivory\);[\s\S]*box-shadow: 0 0 0 4px var\(--world-ground\);/,
  );
  assert.match(
    read('components/world/world-chrome.css'),
    /\.world-objects :focus-visible/,
  );
  // Motion tokens only: no raw curve, and every timing is a token duration
  // (a plain ms value may only be a delay).
  assert.doesNotMatch(
    css,
    /cubic-bezier|[\s:,]ease(?:-in|-out|-in-out)?\b/,
    'motion tokens only',
  );
  for (const [, value] of css.matchAll(/(?:animation|transition):\s*([^;]+);/g))
    if (value.trim() !== 'none')
      for (const part of value.split(','))
        assert.match(
          part,
          /var\(--motion-duration-[a-z]+\) var\(--motion-ease-[a-z]+\)/,
          `token timing: ${part.trim()}`,
        );
}

// 46–56. The product system is untouched; no route, redirect or dependency
// beyond the room; the existing commands stay wired.
{
  // TP3D PASS 11 deliberately revised four of them for the Objects context:
  // the study's context prop (product-detail.tsx), context-aware related
  // links (object-selection.tsx), the shared photograph and status labels
  // (product-assets.ts) and the server-validated shell (the [slug] page).
  // Every other file is still PASS 10's; check:object-study locks the
  // editorial markup itself.
  const PRODUCT = {
    'components/product/product-detail.tsx': '785f3fb044d54e96',
    'components/product/product-asset-sections.tsx': '12b733211f966b05',
    'components/product/sketchfab-viewer.tsx': '0bda9996a13c3b02',
    'components/product/asset-availability.tsx': '9afabeb2c8683aeb',
    'components/product/model-information.tsx': '5c7dc7ecc01512e2',
    'components/product/product-assets.css': '0d5227758a98f8fe',
    'lib/product-assets.ts': 'dd5606b65228a9e8',
    'data/products.ts': '458f6a1e2163ef89',
    'data/relationships.ts': '0d3ee58a0ec101f3',
    'data/types.ts': 'defd33c83b08986c',
    'app/products/page.tsx': '2257cc689fdfa941',
    'app/products/[slug]/page.tsx': 'f5515aa35568c5dc',
    'components/sections/object-selection.tsx': '5b25053501b24a75',
  };
  for (const [path, hash] of Object.entries(PRODUCT))
    assert.equal(digest(path), hash, `51–52. ${path} is locked`);
  const pages = readdirSync(new URL('app/', root), { recursive: true })
    .map((file) => file.replace(/\\/g, '/'))
    .filter((file) => /(?:^|\/)(?:page|route)\.(?:tsx?|jsx?)$/.test(file));
  assert(pages.includes('world/objects/page.tsx'));
  assert.deepEqual(
    pages.filter((p) => p.startsWith('world/')).sort(byCodeUnit),
    ['world/gallery/page.tsx', 'world/objects/page.tsx', 'world/page.tsx'],
    'one new room route, nothing else under /world',
  );
  for (const file of ['middleware.ts', 'middleware.js', 'proxy.ts'])
    assert(!existsSync(new URL(file, root)), `no ${file}`);
  assert.doesNotMatch(read('next.config.ts'), /redirects|rewrites/);
  const {
    dependencies = {},
    devDependencies = {},
    scripts,
  } = json('package.json');
  const packages = Object.keys({ ...dependencies, ...devDependencies }).sort(
    (a, b) => (a < b ? -1 : a > b ? 1 : 0),
  );
  assert.equal(
    createHash('sha256')
      .update(JSON.stringify(packages))
      .digest('hex')
      .slice(0, 16),
    'fe513ca9a824db7d',
    'no dependency added or removed',
  );
  assert.equal(
    scripts['check:objects-room'],
    'node scripts/check-objects-room.mjs',
  );
  for (const name of [
    'check:world',
    'check:gallery',
    'check:exhibit',
    'check:world-shell',
    'check:world-ux',
    'check:worlds',
    'check:assets',
    'check:content',
    'check:home',
    'check:routes',
    'build',
  ])
    assert(scripts[name], name);
}

console.log(
  'Objects room passed: /world/objects inside the World chrome with Objects current; the building has two open rooms (Gallery, Objects) and three planned wings, and the Lobby opens Objects from the data; the curation is four slugs resolved against data/products.ts in order, with every title, category, collection, dimension, material, image and asset fact from the product; each study links its /products/[slug]?from=objects object study, the Object Index lands on stable fragments, and the room leads to /products; digital models read as plain status from asset.available (none available today); no viewer, iframe, canvas, Three.js, model file or marketplace; 44px targets, one-column phones, a clear short-landscape title, a reduced-motion cut and one desktop-only depth; the product system and routes are otherwise untouched.',
);
