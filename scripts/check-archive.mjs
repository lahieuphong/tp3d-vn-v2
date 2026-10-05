/** TP3D PASS 13 — Room 03, Archive. The building directory (three open
 * rooms), the curation (references only, resolved against
 * `data/materials.ts` and `data/journal.ts`, a broken accession an error),
 * provenance on every record, the real room rendered to markup, its CSS,
 * the runtime contract and locks on everything the pass must not touch.
 * Browser QA (the PASS 13 record) covers layout, first paint, journeys and
 * requests. Numbers refer to the PASS 13 brief. */
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
const code = (path) =>
  read(path)
    .replace(/\r\n/g, '\n')
    .replace(/\{\/\*[\s\S]*?\*\/\}|\/\*[\s\S]*?\*\/|^\s*\/\/[^\n]*/gm, '');

// The real modules, wired the way the route wires them.
const building = load('data/world-building.ts');
const worldRooms = [...building.worldRooms];
const images = load('data/images.ts', {
  './image-dimensions.json': json('data/image-dimensions.json'),
});
const dimensions = json('data/image-dimensions.json');
const materialsModule = load('data/materials.ts', { './images': images });
const journalModule = load('data/journal.ts', { './images': images });
const materials = [...materialsModule.materials];
const journal = [...journalModule.journal];
const archiveFor = (m = materialsModule, j = journalModule) =>
  load('data/world-archive.ts', { './materials': m, './journal': j });
const archive = archiveFor();
const records = [...archive.archiveRecords];
const editorialImage = load('components/shared/editorial-image.tsx', {
  '@/data/images': images,
});
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
const roomFor = (buildingModule = building, archiveModule = archive) =>
  load('components/world/world-archive.tsx', {
    'next/link': linkModule,
    '@/data/world-archive': archiveModule,
    '@/data/world-building': buildingModule,
    '@/components/shared/editorial-image': editorialImage,
    './world-chrome': chromeFor(buildingModule),
  });
const html = render(roomFor().WorldArchive);
const css = read('components/world/world-archive.css');
// Declarations only: the stylesheet's comments may name what it refuses.
const cssCode = css.replace(/\/\*[\s\S]*?\*\//g, '');
const roomSource = read('components/world/world-archive.tsx');
const curationSource = read('data/world-archive.ts');
// The building as it stood before this pass: only the Archive's entries
// may differ from it anywhere else in the World.
const beforeArchive = {
  ...building,
  worldRooms: worldRooms.map((r) =>
    r.id === 'archive' ? { ...r, status: 'planned', href: null } : r,
  ),
};
const withoutArchive = (markup) =>
  markup
    .replace(/<li\b[^>]*data-world-room="archive"[\s\S]*?<\/li>/g, '<li/>')
    .replace(/\d(?:<!-- -->)? of (?:<!-- -->)?\d/, 'n of m');
const articles = [
  ...html.matchAll(/<article\b([^>]*)>([\s\S]*?)<\/article>/g),
].map(([, tag, body]) => ({
  id: tag.match(/\bid="([^"]+)"/)?.[1],
  kind: tag.match(/data-record-kind="([^"]+)"/)?.[1],
  basis: tag.match(/data-publication-basis="([^"]+)"/)?.[1],
  placement: tag.match(/data-placement="([^"]+)"/)?.[1],
  body,
}));
const EXPECTED = [
  'material-natural-oak',
  'material-travertine',
  'material-linen',
  'journal-light-texture-and-material',
];

// 1–12. The route and the building directory.
{
  assert(existsSync(new URL('app/world/archive/page.tsx', root)), '1');
  const page = read('app/world/archive/page.tsx');
  assert.match(page, /absolute: 'Archive — TP3D'/);
  assert.match(page, /<div data-world-page="archive">\s*<WorldArchive \/>/);
  assert.doesNotMatch(
    page,
    /historic|heritage|artwork|artefact|artifact/i,
    'metadata stays truthful',
  );
  assert.equal(building.isWorldPath('/world/archive'), true, '2');
  const byId = Object.fromEntries(worldRooms.map((r) => [r.id, r]));
  assert.deepEqual(
    [byId.archive.status, byId.archive.href, byId.archive.futurePath],
    ['available', '/world/archive', '/world/archive'],
    '3–4',
  );
  assert.deepEqual(
    [byId.archive.number, byId.archive.name, byId.archive.type],
    ['03', 'Archive', 'archive'],
  );
  assert.deepEqual(
    [byId.gallery.status, byId.gallery.href],
    ['available', '/world/gallery'],
    '5',
  );
  assert.deepEqual(
    [byId.objects.status, byId.objects.href],
    ['available', '/world/objects'],
    '6',
  );
  assert.deepEqual([byId.lab.status, byId.lab.href], ['planned', null], '7');
  assert.deepEqual(
    [byId.studio.status, byId.studio.href],
    ['planned', null],
    '8',
  );
  assert.doesNotMatch(
    byId.archive.description,
    /three dimensions|3D/i,
    'the description is truthful',
  );
  // 9–10. The Lobby derives the Archive from the data, never hard-codes it.
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
  const entry = (markup) =>
    markup.match(
      /<nav class="wl-rooms"[\s\S]*?data-world-room="archive"[^>]*>([\s\S]*?)<\/li>/,
    )[1];
  const lobby = lobbyFor(building);
  const lobbyBefore = lobbyFor(beforeArchive);
  assert.match(
    entry(lobby),
    /^<a href="\/world\/archive" class="wl-room-body">/,
    '9',
  );
  assert.match(
    entry(lobbyBefore),
    /^<div class="wl-room-body">/,
    '9. from the data',
  );
  assert.doesNotMatch(
    read('components/world/world-lobby.tsx'),
    /\/world\/archive/,
    '9. not hard-coded',
  );
  assert.match(
    lobby,
    /3(?:<!-- -->)? of (?:<!-- -->)?5/,
    '10. three of five rooms open',
  );
  // 62. Only the Archive's entries and the count changed in the Lobby.
  assert.equal(withoutArchive(lobby), withoutArchive(lobbyBefore), '62');
  // 11. The World map: exactly three open rooms, in order.
  const chrome = html.slice(0, html.indexOf('<main'));
  assert.deepEqual(
    [
      ...chrome.matchAll(/<a href="(\/world\/[a-z]+)" class="wl-map-entry"/g),
    ].map(([, h]) => h),
    ['/world/gallery', '/world/objects', '/world/archive'],
    '11',
  );
  for (const id of ['lab', 'studio'])
    assert.doesNotMatch(
      chrome.match(
        new RegExp(`data-world-room="${id}"[^>]*>([\\s\\S]*?)</li>`),
      )[1],
      /<a\b/,
      `11. ${id} stays text`,
    );
  // 12. The Archive is current only in the Archive.
  const { WorldChrome } = chromeFor(building);
  for (const current of [undefined, 'gallery', 'objects', 'archive']) {
    const markup = render(WorldChrome, { currentRoom: current });
    const archiveEntry = markup.match(
      /data-world-room="archive"[^>]*>([\s\S]*?)<\/li>/,
    )[1];
    assert.equal(
      /aria-current="page"/.test(archiveEntry),
      current === 'archive',
      `12. ${current}`,
    );
    assert.equal(
      (markup.match(/aria-current="page"/g) ?? []).length,
      current ? 1 : 0,
    );
  }
  assert.match(
    chrome,
    /<a href="\/world\/archive" class="wl-map-entry" aria-current="page">[\s\S]*?You are here/,
  );
}

// 13–26. The curation: references only, resolved against the sources.
{
  assert.deepEqual(
    [...archive.archiveRecordRefs].map((r) => ({ ...r })),
    [
      { kind: 'material', slug: 'natural-oak' },
      { kind: 'material', slug: 'travertine' },
      { kind: 'material', slug: 'linen' },
      { kind: 'journal', slug: 'light-texture-and-material' },
    ],
    '20–21. deliberate order and count',
  );
  assert.equal(records.length, 4, '21');
  assert.deepEqual(
    records.map((r) => r.key),
    EXPECTED,
    '20, 41',
  );
  for (const [index, record] of records.entries()) {
    const source =
      record.kind === 'material'
        ? materials.find((m) => m.slug === record.slug)
        : journal.find((a) => a.slug === record.slug);
    assert(source, `17–18. ${record.key} resolves`);
    // 13. Every fact is the source's.
    assert.equal(record.title, source.title, '13');
    assert.equal(record.summary, source.description, '13');
    assert.equal(record.image, source.image, '13. the same image object');
    assert.equal(
      record.category,
      record.kind === 'material' ? source.family : source.category,
    );
    // 14–16. The curation never writes a source fact itself.
    for (const fact of [
      source.title,
      source.description,
      source.image.alt,
      source.image.src,
    ])
      assert(
        !curationSource.includes(fact),
        `14–16. ${record.key}: "${fact}" is not authored in the curation`,
      );
    // 22. Accession numbers come from curation order.
    assert.equal(
      record.accession,
      `AR–${String(index + 1).padStart(3, '0')}`,
      '22',
    );
    assert.equal(record.accession, archive.accessionNumber(index));
    // 23–24. Source routes.
    assert.equal(
      record.source.href,
      `/${record.kind === 'material' ? 'materials' : 'journal'}/${record.slug}`,
      '23–24',
    );
    // 25–26. Dates: the journal's own, never one for a material.
    if (record.kind === 'journal') {
      assert.equal(record.date.iso, source.date, '25');
      assert.equal(record.date.label, '12 Jun 2026');
    } else assert.equal(record.date, null, '26. no invented date');
  }
  assert.equal(archive.archiveDateLabel('2026-01-05'), '05 Jan 2026');
  assert.match(
    curationSource,
    /as const satisfies readonly ArchiveRecordRef\[\]/,
  );
  assert.doesNotMatch(
    code('data/world-archive.ts'),
    /\b(?:19|20)\d\d\b/,
    '26. no year authored in the curation (code, not comments)',
  );
  // 19. A missing source is an error, never a dropped accession.
  for (const [m, j] of [
    [
      { materials: materials.filter((x) => x.slug !== 'travertine') },
      journalModule,
    ],
    [
      materialsModule,
      {
        journal: journal.filter((x) => x.slug !== 'light-texture-and-material'),
      },
    ],
  ])
    assert.throws(
      () => archiveFor(m, j),
      /Archive: (?:material-travertine|journal-light-texture-and-material) has no source record/,
      '19',
    );
}

// 27–35. Provenance: every record names its source; nothing claims rights.
{
  for (const record of records) {
    assert.equal(
      record.recordType,
      record.kind === 'material' ? 'Material study' : 'Editorial record',
      '27',
    );
    assert.equal(
      record.source.collection,
      record.kind === 'material' ? 'Material Library' : 'Journal',
      '28',
    );
    assert.equal(record.source.basis, 'existing-project-content', '30');
  }
  assert.equal(
    archive.PUBLICATION_BASIS_LABEL['existing-project-content'],
    'Existing TP3D project content',
  );
  for (const a of articles) {
    const record = records.find((r) => r.key === a.id);
    assert.equal(a.basis, 'existing-project-content', '30');
    assert.match(
      a.body,
      new RegExp(
        `<dt>Source</dt><dd class="wa-source-collection">${record.source.collection}</dd>`,
      ),
      '28. visible, never on hover',
    );
    assert.match(
      a.body,
      new RegExp(`<a class="wa-source" href="${record.source.href}">`),
      '29, 43. a real link',
    );
    assert.match(
      a.body,
      /Open source record<span class="wa-hidden">: [^<]+, in the (?:Material Library|Journal)<\/span>/,
    );
  }
  // Code and rendered copy, not comments: the curation's documentation may
  // state the future policy (which names public-domain evidence).
  for (const source of [
    code('data/world-archive.ts'),
    code('components/world/world-archive.tsx'),
    code('app/world/archive/page.tsx'),
    html,
  ]) {
    assert.doesNotMatch(
      source,
      /public domain|public-domain|CC0|creative commons/i,
      '31',
    );
    assert.doesNotMatch(
      source,
      /©|all rights reserved|owned by|licen[cs]ed to|copyright TP3D/i,
      '32',
    );
    assert.doesNotMatch(source, /https?:\/\//, '33. no external URL');
  }
  for (const record of records) {
    assert.match(
      record.image.src,
      /^\/images\/[a-z-]+\.webp$/,
      '34. a project image',
    );
    assert(
      dimensions[record.image.src],
      `34. ${record.image.src} is in the manifest`,
    );
  }
  // 35. The note.
  assert.match(
    html,
    /Current accession basis<\/dt><dd>Existing TP3D project content\.<\/dd>/,
    '30',
  );
  assert.match(
    html,
    /Cultural records from outside TP3D require a documented source, credit and publication basis before inclusion\./,
    '35',
  );
  assert.match(html, /Source <em>before interpretation\.<\/em>/);
  assert.match(
    curationSource,
    /export type PublicationBasis = 'existing-project-content';/,
    'one basis today',
  );
}

// 36–47. The room's markup and CSS.
{
  assert.equal((html.match(/<h1\b/g) ?? []).length, 1, '36');
  assert.match(html, /<h1 id="world-archive-title">Archive<\/h1>/);
  assert.equal(
    (html.match(/<h2\b/g) ?? []).length,
    records.length,
    '37. one h2 per record',
  );
  assert.equal((html.match(/<main\b/g) ?? []).length, 1, '38');
  assert.match(
    html,
    /<main id="main" class="world-archive" data-world-archive="">/,
  );
  assert.equal(
    (html.match(/<header\b/g) ?? []).length,
    1,
    'one header, the World chrome',
  );
  assert.deepEqual(
    articles.map((a) => a.id),
    EXPECTED,
    'records in the order of the room',
  );
  assert.deepEqual(
    articles.map((a) => a.placement),
    ['table', 'facing', 'register', 'register'],
    'unequal weight',
  );
  // 39–41. The index is navigation; every fragment resolves; ids are unique.
  const index = html.match(
    /<nav class="wa-index" aria-labelledby="wa-index-title">([\s\S]*?)<\/nav>/,
  )?.[1];
  assert(index, '39');
  const fragments = [...index.matchAll(/<a href="#([^"]+)"/g)].map(
    ([, id]) => id,
  );
  assert.deepEqual(fragments, EXPECTED, '40');
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(([, id]) => id);
  assert.equal(new Set(ids).size, ids.length, '41. no duplicate id');
  for (const id of EXPECTED)
    assert.match(id, /^(?:material|journal)-[a-z-]+$/, '41. kind-prefixed');
  // 42. Alt text from the source; only the first plate is priority.
  const imgs = [...html.matchAll(/<img\b[^>]*>/g)].map(([tag]) => tag);
  assert.equal(imgs.length, records.length, 'one image per record');
  imgs.forEach((tag, i) => {
    assert(
      tag.includes(`alt="${records[i].image.alt}"`),
      `42. ${records[i].key}`,
    );
    assert.equal(
      /loading="eager"/.test(tag),
      i === 0,
      'only the first plate is eager',
    );
    assert.match(tag, /width="\d+" height="\d+"/, 'intrinsic size reserved');
  });
  // Dates: <time> for the journal only; materials say so.
  assert.match(
    articles[3].body,
    /<time dateTime="2026-06-12">12 Jun 2026<\/time>/,
  );
  for (const a of articles.slice(0, 3)) {
    assert.doesNotMatch(a.body, /<time\b/, 'materials have no date');
    assert.match(a.body, /<dd>Undated study<\/dd>/);
  }
  // Honest labels: studies and records, never artefacts.
  assert.doesNotMatch(
    html,
    /artifact|artefact|heritage object|museum object|view artwork/i,
  );
  assert.equal((html.match(/>Material study</g) ?? []).length, 3);
  assert.equal((html.match(/>Editorial record</g) ?? []).length, 1);
  // Source links leave the World as document navigations (native anchors).
  assert.match(
    roomSource,
    /<a className="wa-source" href=\{record\.source\.href\}>/,
  );
  // CSS rules, all scoped to the room.
  const rules = [
    ...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g),
  ]
    .map(([, s, body]) => ({
      // Split on top-level commas only: `:where(p, dl)` stays one selector.
      selectors: s
        .trim()
        .split(/,(?![^(]*\))\s*/)
        .map((x) => x.replace(/\s+/g, ' ')),
      body,
    }))
    .filter(
      ({ selectors }) =>
        !selectors[0].startsWith('@') &&
        !/^(?:from|to|\d+%)$/.test(selectors[0]),
    );
  for (const { selectors } of rules)
    for (const s of selectors)
      assert(
        /^(?:\.world-archive|\.wa-|:root:has\(main\[data-world-archive\]\))/.test(
          s,
        ),
        `scoped: ${s}`,
      );
  // Every declaration block that lists the selector, in source order.
  const rule = (selector) =>
    rules
      .filter(({ selectors }) => selectors.includes(selector))
      .map(({ body }) => body)
      .join('\n');
  // 44. Touch targets.
  assert.match(rule('.wa-lobby'), /min-height: 44px/, '44');
  assert.match(rule('.wa-index a'), /min-height: 56px/, '44');
  assert.match(
    read('components/world/world-chrome.css'),
    /\.wl-map summary,\n\.wl-exit,\n\.wl-back \{[^}]*min-height: 44px/,
    '44',
  );
  // 45–46. Phones one column; short landscape clears the 68px chrome.
  assert.match(
    css,
    /@media \(max-width: 767px\) \{[\s\S]*?\.wa-record\[data-placement='table'\],\n\s*\.wa-record\[data-placement='facing'\] \{\s*grid-template-columns: minmax\(0, 1fr\);/,
    '45',
  );
  assert.match(
    css,
    /@media \(max-width: 1199px\) and \(max-height: 540px\) and \(orientation: landscape\) \{\s*\.wa-entry \{\s*padding-top: calc\(68px \+ 20px\);/,
    '46',
  );
  // 47. Reduced motion: the global kill switch leaves every element at its
  // final state — no base rule hides content; keyframes only start hidden.
  assert.doesNotMatch(
    rules.map((r) => r.body).join('\n'),
    /opacity: 0|visibility: hidden/,
    '47',
  );
  assert.match(
    read('app/globals.css'),
    /prefers-reduced-motion: reduce\) \{[\s\S]*?animation: none !important;/,
  );
  // Motion tokens only; low arrival.
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
  // The photographs stay what they are: no ageing, grain, stamps or masks.
  assert.doesNotMatch(
    cssCode,
    /filter|sepia|grayscale|mix-blend|noise|grain|clip-path: polygon|mask/,
    'no visual cosplay',
  );
  // The World's tokens and focus reach the room.
  const chromeCss = read('components/world/world-chrome.css');
  assert.match(
    chromeCss,
    /\.world-archive \{\s*--wl-serif: 'Cormorant Spatial'/,
  );
  assert.match(chromeCss, /\.world-archive :focus-visible \{/);
  assert.match(
    roomSource,
    /import '@\/components\/shared\/spatial-type\.css';/,
  );
  // First paint: the World ground from the root, stone behind images.
  assert.match(
    rule(':root:has(main[data-world-archive])'),
    /background: var\(--world-ground\);/,
  );
  assert.match(
    rule(':root:has(main[data-world-archive]) body'),
    /color-scheme: dark;/,
  );
  assert.match(
    rule('.wa-plate .editorial-image'),
    /background: var\(--wa-mount\);/,
  );
}

// 48–57. Runtime: server-rendered, no 3D, no network, no loop.
{
  for (const file of [
    'components/world/world-archive.tsx',
    'components/world/world-archive.css',
    'data/world-archive.ts',
    'app/world/archive/page.tsx',
  ]) {
    const source = code(file);
    assert.doesNotMatch(
      source,
      /from ['"]three['"]|import\(|<canvas|getContext|webgl/i,
      `48–50. ${file}`,
    );
    assert.doesNotMatch(
      source,
      /<iframe|sketchfab|\.glb|\.gltf|fab\.com/i,
      `51–53. ${file}`,
    );
    assert.doesNotMatch(source, /https?:\/\/|url\(|@import/, `54. ${file}`);
    assert.doesNotMatch(
      source,
      /requestAnimationFrame|setInterval|setTimeout|Observer|addEventListener|useEffect|useState/,
      `55–56. ${file}`,
    );
  }
  assert.doesNotMatch(
    roomSource,
    /^['"]use client['"]/m,
    '57. a server component',
  );
  assert.doesNotMatch(read('app/world/archive/page.tsx'), /'use client'/, '57');
  assert.doesNotMatch(
    roomSource,
    /GalleryDepth|GalleryReveal|gallery-depth|gallery-reveal/,
    'no depth, no reveal',
  );
  assert.doesNotMatch(html, /<canvas\b|<iframe\b|<script\b/i);
  // The only client code on the page is the shared World map island.
  const imports = [...roomSource.matchAll(/from '([^']+)'/g)]
    .map(([, m]) => m)
    .sort(byCodeUnit);
  assert.deepEqual(
    imports,
    [
      './world-chrome',
      '@/components/shared/editorial-image',
      '@/data/world-archive',
      '@/data/world-building',
      'next/link',
    ].sort(byCodeUnit),
  );
}

// 58–61. The other rooms and shells: only the World map's Archive entry
// changed (everything else is locked by their own checks and below).
{
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
  assert.equal(
    withoutArchive(gallery),
    withoutArchive(galleryFor(beforeArchive)),
    '58',
  );
  assert.match(gallery, /<a href="\/world\/archive" class="wl-map-entry">/);
  for (const current of ['gallery', 'objects']) {
    const { WorldChrome } = chromeFor(building);
    const live = render(WorldChrome, { currentRoom: current });
    const before = render(chromeFor(beforeArchive).WorldChrome, {
      currentRoom: current,
    });
    assert.equal(
      withoutArchive(live),
      withoutArchive(before),
      `59–61. ${current} chrome`,
    );
  }
}

// 63–72. Source routes, products, the homepage and the catalogue are
// untouched; no route, redirect or dependency beyond the room.
{
  const LOCKED = {
    // 63–66. The sources the Archive points to.
    'app/materials/page.tsx': '0ba50fb84afab920',
    'app/materials/[slug]/page.tsx': '127360a92443d16f',
    'app/journal/page.tsx': '1205ae4a7555f526',
    'app/journal/[slug]/page.tsx': '10ad24979646d735',
    'data/materials.ts': '7fe5807f0e40218b',
    'data/journal.ts': '120b850c2b5c18ed',
    'data/images.ts': '5727c7f9f231a8fe',
    'data/image-dimensions.json': 'cf7a3275f2f0b88c',
    // 67–68. Products (PASS 11–12).
    'app/products/page.tsx': '2257cc689fdfa941',
    'app/products/[slug]/page.tsx': 'f5515aa35568c5dc',
    'components/product/product-detail.tsx': '785f3fb044d54e96',
    'components/sections/object-selection.tsx': 'a59b00fb9dbc215b',
    'lib/product-detail-context.ts': '2177f57b3e4b5cc9',
    // 69–70.
    'app/page.tsx': '9b4f5f0e730af60f',
    'app/worlds/page.tsx': '57084f2da546497a',
    // 58–62. The Gallery, Room 02, both detail shells, the Lobby, the chrome.
    'components/world/world-gallery.tsx': 'f1a4d8da704c60d5',
    'components/world/world-gallery.css': '38d790dd070c413d',
    'components/world/world-objects.tsx': '4a565398c1e36def',
    'components/world/world-objects.css': '038f31c72e212ffb',
    'components/world/world-detail-shell.tsx': '3e53405aaff87ab1',
    'components/world/world-detail-shell.css': '59df760b8e04e445',
    'components/world/object-study-shell.tsx': '404081ad9d571e7b',
    'components/world/object-study-shell.css': '7743c1aecaa2449a',
    'components/world/world-lobby.tsx': 'bf0bc493f965b78c',
    'components/world/world-lobby.css': 'e3ef8536f38af67f',
    'components/world/world-chrome.tsx': '3a37f3c5c372903f',
    'components/world/gallery-depth.tsx': 'f320119f57b2a020',
    'components/world/gallery-reveal.tsx': '528fdb16697d8e4f',
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
      'world/objects/page.tsx',
      'world/page.tsx',
    ],
    'one room route added',
  );
  assert(
    !existsSync(new URL('app/world/archive/[slug]', root)),
    'no record route',
  );
  for (const file of ['middleware.ts', 'middleware.js', 'proxy.ts'])
    assert(!existsSync(new URL(file, root)), `no ${file}`);
  assert.doesNotMatch(read('next.config.ts'), /redirects|rewrites/);
  assert.doesNotMatch(
    roomSource + curationSource,
    /from=archive/,
    'no Archive context on the sources',
  );
  const { scripts } = json('package.json');
  assert.equal(scripts['check:archive'], 'node scripts/check-archive.mjs');
  for (const name of [
    'check:product-navigation',
    'check:object-study',
    'check:objects-room',
    'check:gallery',
    'check:world',
    'check:routes',
    'build',
    'build:vercel',
  ])
    assert(scripts[name], `71–72. ${name}`);
}

console.log(
  'Archive passed: /world/archive is Room 03 inside the World (three of five rooms open, the Lobby and World map derive it from worldRooms, current only in the Archive, Lab and Studio planned); four records in accession order (AR–001…AR–004) resolve from data/materials.ts and data/journal.ts with no source fact authored in the curation and a broken reference an error; every record names its source collection, opens its source route and rests on existing project content, with journal dates from the journal and no invented material date; no external URL, rights claim or cultural asset; one h1, one h2 per record, a navigable accession index on collision-safe fragments, source alt text, 44px targets; scoped CSS with token motion, no photographic treatment and a reduced-motion-safe arrival; no client code, 3D, network or loop; Gallery, Objects, both detail shells and the Lobby differ only by the Archive entry, and sources, products, homepage and catalogue are locked.',
);
