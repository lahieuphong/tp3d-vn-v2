/** TP3D PASS 15 — Room 05, Studio: the project table. The completed
 * five-room building, the Studio's truthfulness (no invented clients,
 * prices, bookings, contact channels or commissions), concept studies
 * resolved from `data/projects.ts` with a visible disclosure, the honest
 * enquiry status and the Contact handoff, the room's markup and CSS, its
 * server-only runtime, and locks on everything the pass must not touch.
 * Browser QA (the PASS 15 record) covers layout, first paint, journeys and
 * requests. Numbers refer to the PASS 15 brief. */
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

// The real modules, wired the way the route wires them.
const building = load('data/world-building.ts');
const worldRooms = [...building.worldRooms];
const images = load('data/images.ts', {
  './image-dimensions.json': json('data/image-dimensions.json'),
});
const projectsModule = load('data/projects.ts', { './images': images });
const projects = [...projectsModule.projects];
const studioFor = (source = projectsModule) =>
  load('data/world-studio.ts', { './projects': source });
const studio = studioFor();
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
const roomFor = (buildingModule = building) =>
  load('components/world/world-studio.tsx', {
    'next/link': linkModule,
    '@/data/world-building': buildingModule,
    '@/data/world-studio': studio,
    './world-chrome': chromeFor(buildingModule),
  });
const html = render(roomFor().WorldStudio);
const main = html.slice(html.indexOf('<main'));
// Visible copy only: text between tags, entities left as written.
const text = main.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const css = read('components/world/world-studio.css');
const cssCode = css.replace(/\/\*[\s\S]*?\*\//g, '');
const roomSource = read('components/world/world-studio.tsx');
const curationSource = read('data/world-studio.ts');
const STUDIO_FILES = [
  'app/world/studio/page.tsx',
  'components/world/world-studio.tsx',
  'components/world/world-studio.css',
  'data/world-studio.ts',
];
// The building as it stood before this pass: only the Studio's entries may
// differ from it anywhere else in the World.
const beforeStudio = {
  ...building,
  worldRooms: worldRooms.map((r) =>
    r.id === 'studio' ? { ...r, status: 'planned', href: null } : r,
  ),
};
const withoutStudio = (markup) =>
  markup
    .replace(/<li\b[^>]*data-world-room="studio"[\s\S]*?<\/li>/g, '<li/>')
    .replace(/\d(?:<!-- -->)? of (?:<!-- -->)?\d/, 'n of m');
const SECTIONS = ['conversation', 'begin', 'studies', 'brief', 'contact'];
const ROOMS = [
  ['01', 'gallery', 'Gallery', 'exhibition', '/world/gallery'],
  ['02', 'objects', 'Objects', 'collection', '/world/objects'],
  ['03', 'archive', 'Archive', 'archive', '/world/archive'],
  ['04', 'lab', 'Lab', 'experiment', '/world/lab'],
  ['05', 'studio', 'Studio', 'studio', '/world/studio'],
];

// 1–18. The completed building.
{
  assert(existsSync(new URL('app/world/studio/page.tsx', root)), '1');
  const page = read('app/world/studio/page.tsx');
  assert.match(page, /absolute: 'Studio — TP3D'/);
  assert.match(
    page,
    /project framing, spatial direction, material thinking and future collaboration/,
  );
  assert.match(page, /<div data-world-page="studio">\s*<WorldStudio \/>/);
  assert.equal(building.isWorldPath('/world/studio'), true, '2');
  // 3–11. Every room open at its own path; ids, order and types fixed.
  assert.deepEqual(
    worldRooms.map((r) => [r.number, r.id, r.name, r.type, r.href]),
    ROOMS,
    '3–11. the five-room taxonomy',
  );
  for (const r of worldRooms) {
    assert.equal(r.status, 'available', `${r.id} available`);
    assert.equal(r.futurePath, `/world/${r.id}`);
  }
  const studioRoom = worldRooms.find((r) => r.id === 'studio');
  assert.equal(studioRoom.href, '/world/studio', '8');
  assert.equal(studioRoom.summary, 'Design & collaboration');
  assert.doesNotMatch(
    studioRoom.description,
    /\bclients?\b|commission|enquir|book|hire/i,
    'a truthful description',
  );
  // 12–13. The Lobby derives five open rooms.
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
  const lobbyBefore = lobbyFor(beforeStudio);
  const rooms = lobby.match(/<nav class="wl-rooms"[\s\S]*?<\/nav>/)[0];
  assert.deepEqual(
    [
      ...rooms.matchAll(/<a href="(\/world\/[a-z]+)" class="wl-room-body">/g),
    ].map(([, h]) => h),
    ROOMS.map((r) => r[4]),
    '12',
  );
  assert.match(
    lobbyBefore.match(
      /<nav class="wl-rooms"[\s\S]*?data-world-room="studio"[^>]*>([\s\S]*?)<\/li>/,
    )[1],
    /^<div class="wl-room-body">/,
    '12. from the data',
  );
  assert.doesNotMatch(
    read('components/world/world-lobby.tsx'),
    /\/world\/studio/,
    '12. not hard-coded',
  );
  assert.match(lobby, /5(?:<!-- -->)? of (?:<!-- -->)?5/, '13. 5 of 5');
  assert.equal(withoutStudio(lobby), withoutStudio(lobbyBefore), 'Lobby');
  // 14–15. The World map: five links, no planned room.
  const chrome = html.slice(0, html.indexOf('<main'));
  assert.deepEqual(
    [
      ...chrome.matchAll(/<a href="(\/world\/[a-z]+)" class="wl-map-entry"/g),
    ].map(([, h]) => h),
    ROOMS.map((r) => r[4]),
    '14',
  );
  assert.doesNotMatch(chrome, /data-status="planned"/, '15');
  assert.doesNotMatch(chrome, new RegExp(building.PLANNED_ROOM_LABEL), '15');
  assert.equal(
    worldRooms.filter((r) => r.status === 'planned').length,
    0,
    '15. no planned room',
  );
  // 16–17. Planned-room support remains in the architecture.
  const buildingSource = read('data/world-building.ts');
  assert.match(
    buildingSource,
    /\| \(WorldRoomBase & \{\s*status: 'planned';[\s\S]*?href: null;\s*\}\);/,
    '16',
  );
  assert.match(
    buildingSource,
    /export const PLANNED_ROOM_LABEL = 'Opening later';/,
    '17',
  );
  assert.match(
    read('components/world/world-chrome.tsx'),
    /PLANNED_ROOM_LABEL/,
    '17. still wired',
  );
  // 18. The Studio is current only in the Studio.
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
    const entry = markup.match(
      /data-world-room="studio"[^>]*>([\s\S]*?)<\/li>/,
    )[1];
    assert.equal(
      /aria-current="page"/.test(entry),
      current === 'studio',
      `18. ${current}`,
    );
    assert.equal(
      (markup.match(/aria-current="page"/g) ?? []).length,
      current ? 1 : 0,
    );
  }
  assert.match(
    chrome,
    /<a href="\/world\/studio" class="wl-map-entry" aria-current="page">[\s\S]*?You are here/,
  );
}

// 19–30. Truthfulness: nothing the repository cannot support. Rendered copy
// and code (comments may name what the Studio refuses).
{
  const sources = [
    text,
    ...STUDIO_FILES.filter((f) => !f.endsWith('.css')).map(code),
  ];
  for (const source of sources) {
    assert.doesNotMatch(
      source,
      /testimonial|“[^”]+” —|said our|\bsays\b [A-Z]/i,
      '19',
    );
    assert.doesNotMatch(source, /client logos?|trusted by|as seen in/i, '20');
    assert.doesNotMatch(
      source,
      /\d+\s*\+\s*(?:projects|clients|years)|\d+\s*(?:projects|clients|countries)\b|% satisf/i,
      '21',
    );
    assert.doesNotMatch(
      source,
      /completed (?:projects?|commissions?)|built projects?|delivered|our clients|client work|our commissions/i,
      '22',
    );
    assert.doesNotMatch(
      source,
      /[$€£₫]\s?\d|\bprice|\bpricing|per m²|from \d/i,
      '24',
    );
    assert.doesNotMatch(source, /quote|estimat/i, '25');
    assert.doesNotMatch(source, /\bbook\b|booking|reserve a/i, '26');
    assert.doesNotMatch(
      source,
      /schedule|consultation|calendar|call us/i,
      '27',
    );
    assert.doesNotMatch(
      source,
      /architect\b|founder|our team|designers?\b|certified|credential|license/i,
      '28',
    );
    assert.doesNotMatch(
      source,
      /award|winner|recognised by|featured in/i,
      '29',
    );
    assert.doesNotMatch(
      source,
      /since (?:19|20)\d\d|established|founded|years of experience|decades/i,
      '30',
    );
  }
  // 23. "Commissioned" only ever appears in the disclosure's denial.
  const commissioned = [...text.matchAll(/commission\w*/gi)];
  assert.equal(commissioned.length, 1, '23. one mention');
  assert.match(
    text,
    /reference photography does not depict commissioned Tân Phong work/,
    '23. and it is a denial',
  );
  // Agency clichés stay out.
  assert.doesNotMatch(
    text,
    /bring your vision|dreams? (?:into|home)|end-to-end|starts here|transform/i,
  );
}

// 31–43. Contact capability: navigation only, and the honest status.
{
  for (const source of [html, ...STUDIO_FILES.map(code)]) {
    assert.doesNotMatch(source, /<form\b/i, '31');
    assert.doesNotMatch(source, /<input\b/i, '32');
    assert.doesNotMatch(source, /<textarea\b/i, '33');
    assert.doesNotMatch(source, /<button\b|type="submit"|<select\b/i, '34');
    assert.doesNotMatch(source, /mailto:|@[a-z0-9-]+\.[a-z]{2,}/i, '35');
    assert.doesNotMatch(source, /tel:|\+\d{2}\s?\d|\b0\d{2,3}[ .]\d{3}/i, '36');
    assert.doesNotMatch(source, /whatsapp|wa\.me|messenger|m\.me|zalo/i, '37');
    assert.doesNotMatch(source, /calendly|cal\.com/i, '38');
    assert.doesNotMatch(
      source,
      /hubspot|formspree|resend|emailjs|supabase|typeform|tally\.so|netlify-form/i,
      '39',
    );
    assert.doesNotMatch(
      source,
      /fetch\(|method="post"|action=|XMLHttpRequest|sendBeacon|\/api\//i,
      '40',
    );
    assert.doesNotMatch(source, /https?:\/\//, 'no external URL');
  }
  // 41. The status, visible, from the one constant.
  assert.equal(studio.PROJECT_ENQUIRY_STATUS, 'opening-soon');
  assert.equal(
    studio.PROJECT_ENQUIRY_STATUS_LABEL['opening-soon'],
    'Opening soon',
  );
  assert.match(
    curationSource,
    /export type ProjectEnquiryStatus = 'opening-soon';/,
    '41. one status today',
  );
  assert.match(
    main,
    /<p class="wst-status" data-enquiry-status="opening-soon">Opening soon<\/p>/,
    '41',
  );
  assert.doesNotMatch(
    curationSource,
    /new Date|getFullYear|process\.env/,
    '41',
  );
  // It matches the Contact page, which stays the source of truth.
  assert.match(
    read('app/contact/page.tsx'),
    /Studio enquiries and project conversations will open here soon\./,
  );
  // 42. The Contact action is a real link to /contact, leaving the World.
  assert.match(
    main,
    /<a class="wst-contact-link" href="\/contact"><span>Open contact page<\/span><span aria-hidden="true">↗<\/span><\/a>/,
    '42',
  );
  assert.doesNotMatch(main, /target="_blank"/, 'same tab');
  // 43. Nothing claims enquiries are live.
  assert.match(
    text,
    /Project enquiries and direct conversations are not yet live on the site\./,
    '43',
  );
  assert.doesNotMatch(
    text,
    /enquiries (?:are )?open|open now|send (?:us )?(?:an )?enquir|submit|get in touch today|start (?:your )?project now|contact us now/i,
    '43',
  );
}

// 44–54. Concept studies: references only, resolved, labelled, disclosed.
{
  assert.deepEqual(
    [...studio.studioStudySlugs],
    ['the-walnut-residence', 'quiet-house', 'courtyard-residence'],
  );
  const studies = [...studio.studioStudies];
  assert.equal(studies.length, 3);
  studies.forEach((study, i) => {
    const source = projects.find((p) => p.slug === studio.studioStudySlugs[i]);
    assert.equal(study, source, '44. the same project object');
  });
  // 45–48. The curation never writes a project fact.
  for (const p of projects)
    for (const fact of [
      p.title,
      p.location,
      p.style,
      p.description,
      p.coverImage.src,
      p.coverImage.alt,
      p.area,
    ])
      assert(
        !curationSource.includes(fact),
        `45–48. "${fact}" is not authored in the Studio curation`,
      );
  assert.doesNotMatch(curationSource, /\/images\/|coverImage|\.webp/, '46');
  // 49. A missing slug is an error, never a dropped study.
  assert.throws(
    () =>
      studioFor({
        projects: projects.filter((p) => p.slug !== 'quiet-house'),
      }),
    /Studio: quiet-house has no project in data\/projects\.ts/,
    '49',
  );
  // 50–51. Real links to the editorial project pages; no Studio context.
  const ledger = main.match(/<ol class="wst-ledger">([\s\S]*?)<\/ol>/)[1];
  assert.deepEqual(
    [...ledger.matchAll(/<a class="wst-study-link" href="([^"]+)">/g)].map(
      ([, h]) => h,
    ),
    studies.map((p) => `/projects/${p.slug}`),
    '50',
  );
  for (const p of studies)
    assert(projectsModule.getProject(p.slug), `50. /projects/${p.slug}`);
  for (const source of [html, ...STUDIO_FILES.map(code)])
    assert.doesNotMatch(
      source,
      /[?&](?:from|source|room)=studio/,
      '51. no Studio context',
    );
  // 52. Labelled as concept studies, every row.
  assert.equal(
    (ledger.match(/<p class="wst-study-label">Concept study<\/p>/g) ?? [])
      .length,
    3,
    '52',
  );
  assert.match(
    main,
    /<h2 id="studies-title" class="wst-title">Concept studies<\/h2>/,
  );
  for (const p of studies) {
    assert(ledger.includes(`>${p.title}<`), `${p.slug} title from data`);
    assert(ledger.includes(p.description), `${p.slug} description from data`);
  }
  assert.doesNotMatch(ledger, /<img\b/, 'no portfolio photography');
  // 53–54. The disclosure: beside the studies, in plain sight.
  const head = main.match(
    /<section id="studies"[\s\S]*?<div class="wst-section-head">([\s\S]*?)<\/div>/,
  )[1];
  assert.match(
    head,
    /<p class="wst-disclosure">These are concept studies, shown for their design language\. Locations and specifications are illustrative; reference photography does not depict commissioned Tân Phong work\.<\/p>/,
    '53–54',
  );
  assert.doesNotMatch(
    cssCode.match(/\.wst-disclosure \{[^}]*\}/g)?.join('') ?? '',
    /display: none|visibility: hidden|opacity: 0/,
    '53. never hidden',
  );
}

// 55–61. Content.
{
  const areas = main.match(
    /<ol class="wst-areas">([\s\S]*?)<\/ol>\s*<\/section>/,
  )[1];
  assert.deepEqual(
    [...areas.matchAll(/<h3 class="wst-area-title">([^<]+)<\/h3>/g)].map(
      ([, t]) => t,
    ),
    ['Space', 'Material', 'Visualization'],
    '55',
  );
  for (const q of [
    'What should the space make possible?',
    'What should it feel like to live with?',
    'How can an idea become clear before it is built?',
  ])
    assert(areas.includes(q), `55. ${q}`);
  assert.match(text, /Areas of conversation, not packages/, '56');
  assert.doesNotMatch(
    areas,
    /package|basic|premium|deliverable|week|month|guarantee/i,
    '56',
  );
  const steps = main.match(
    /<ol class="wst-steps">([\s\S]*?)<\/ol>\s*<\/section>/,
  )[1];
  assert.deepEqual(
    [...steps.matchAll(/<h3 class="wst-step-title">([^<]+)<\/h3>/g)].map(
      ([, t]) => t,
    ),
    ['Context', 'Direction', 'Study', 'Visualize'],
    '57',
  );
  assert.match(main, />How a project can begin<\/h2>/, '57');
  const brief = main.match(/<dl class="wst-prompts-list">([\s\S]*?)<\/dl>/)[1];
  assert.deepEqual(
    [...brief.matchAll(/<dt>([^<]+)<\/dt>/g)].map(([, t]) => t),
    [
      'Type of space',
      'Location',
      'Scale',
      'Stage',
      'What should change',
      'Priorities',
      'References',
    ],
    '58',
  );
  assert.match(text, /not a form to fill in/, '58. guidance only');
  assert.doesNotMatch(
    text,
    /proven|our (?:four-step |\d-step )?(?:client )?process|guaranteed|step-by-step service/i,
    '59',
  );
  // 60–61, 84–85. The directory: navigation to every section.
  const directory = main.match(
    /<nav class="wst-directory" aria-labelledby="wst-directory-title">([\s\S]*?)<\/nav>/,
  )?.[1];
  assert(directory, '60');
  assert.deepEqual(
    [...directory.matchAll(/<a href="#([^"]+)"/g)].map(([, id]) => id),
    SECTIONS,
    '61',
  );
  for (const id of SECTIONS)
    assert.match(main, new RegExp(`<section id="${id}" `), `61, 85. #${id}`);
  // The directory comes before the sections: Contact is one step away.
  assert(
    main.indexOf('wst-directory') < main.indexOf('id="conversation"'),
    'directory first',
  );
}

// 62–79. Architecture and runtime: a server room, nothing running.
{
  assert.doesNotMatch(roomSource, /^['"]use client['"]/m, '62');
  assert.doesNotMatch(read('app/world/studio/page.tsx'), /'use client'/, '62');
  for (const file of STUDIO_FILES)
    assert.doesNotMatch(read(file), /'use client'/, `63. ${file}`);
  const imports = [...roomSource.matchAll(/from '([^']+)'/g)]
    .map(([, m]) => m)
    .sort(byCodeUnit);
  assert.deepEqual(
    imports,
    [
      './world-chrome',
      '@/data/world-building',
      '@/data/world-studio',
      'next/link',
    ].sort(byCodeUnit),
    '63. no island of its own (the World map is the shared one)',
  );
  assert(!existsSync(new URL('app/world/studio/[slug]', root)), '64');
  assert.deepEqual(
    readdirSync(new URL('app/world/studio/', root)),
    ['page.tsx'],
    '64',
  );
  for (const file of ['middleware.ts', 'middleware.js', 'proxy.ts'])
    assert(!existsSync(new URL(file, root)), `65. no ${file}`);
  assert.doesNotMatch(read('next.config.ts'), /redirects|rewrites/, '66–67');
  for (const file of STUDIO_FILES) {
    const source = code(file);
    assert.doesNotMatch(
      source,
      /from ['"]three['"]|import\(|<canvas|getContext|webgl/i,
      `69–71. ${file}`,
    );
    assert.doesNotMatch(
      source,
      /<iframe|sketchfab|\.glb|\.gltf|fab\.com/i,
      `72–74. ${file}`,
    );
    assert.doesNotMatch(source, /https?:\/\/|url\(|@import/, `75. ${file}`);
    assert.doesNotMatch(
      source,
      /requestAnimationFrame|setInterval|setTimeout|Observer|addEventListener|pointermove|useEffect|useState|GalleryDepth|GalleryReveal/,
      `76–79. ${file}`,
    );
  }
  assert.doesNotMatch(html, /<canvas\b|<iframe\b|<script\b|<img\b/i);
}

// 80–90. Accessibility, markup and CSS.
{
  assert.equal((main.match(/<main\b/g) ?? []).length, 1, '80');
  assert.equal((html.match(/<h1\b/g) ?? []).length, 1, '81');
  assert.match(html, /<h1 id="world-studio-title">Studio<\/h1>/);
  assert.equal((html.match(/<header\b/g) ?? []).length, 1, 'the World chrome');
  // 82. h2 per section, h3 inside; nothing skips a level.
  assert.deepEqual(
    [...main.matchAll(/<h2 id="([a-z]+)-title"/g)].map(([, id]) => id),
    SECTIONS,
    '82',
  );
  assert.equal((main.match(/<h3\b/g) ?? []).length, 3 + 4 + 3, '82. h3s');
  for (const id of SECTIONS)
    assert.match(
      main,
      new RegExp(
        `<section id="${id}" class="[^"]+" aria-labelledby="${id}-title">`,
      ),
      `82. #${id} labelled`,
    );
  // 83. The beginning and the areas are ordered lists; the brief a dl.
  assert.match(main, /<ol class="wst-areas">/, '83');
  assert.match(main, /<ol class="wst-steps">/, '83');
  assert.match(main, /<ol class="wst-ledger">/, '83');
  assert.match(main, /<dl class="wst-prompts-list">/, '83');
  // 86–87. Real anchors with names; Back to Lobby.
  assert.match(
    main,
    /Open concept study<span class="wst-hidden">: The Walnut Residence<\/span>/,
    '86',
  );
  assert.match(main, /<a href="\/world" class="wst-lobby">/, 'Back to Lobby');
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(([, id]) => id);
  assert.equal(new Set(ids).size, ids.length, 'no duplicate id');
  // CSS rules, all scoped to the room.
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
        !selectors[0].startsWith('@') &&
        !/^(?:from|to|\d+%)$/.test(selectors[0]),
    );
  const rule = (selector) =>
    rules
      .filter(({ selectors }) => selectors.includes(selector))
      .map(({ body }) => body)
      .join('\n');
  for (const { selectors } of rules)
    for (const s of selectors)
      assert(
        /^(?:\.world-studio|\.wst-|:root:has\(main\[data-world-studio\]\))/.test(
          s,
        ),
        `scoped: ${s}`,
      );
  // 88. Touch targets.
  for (const selector of ['.wst-study-link', '.wst-contact-link', '.wst-lobby'])
    assert.match(rule(selector), /min-height: 44px/, `88. ${selector}`);
  assert.match(rule('.wst-directory a'), /min-height: 48px/, '88');
  // 89. World focus reaches the room.
  const chromeCss = read('components/world/world-chrome.css');
  assert.match(
    chromeCss,
    /\.world-studio \{\s*--wl-serif: 'Cormorant Spatial'/,
  );
  assert.match(
    chromeCss,
    /\.world-studio :focus-visible \{\s*outline: 1px solid currentColor;/,
    '89',
  );
  assert.match(
    roomSource,
    /import '@\/components\/shared\/spatial-type\.css';/,
  );
  // 90. Nothing hidden until hover; no base rule hides content.
  assert.doesNotMatch(
    rules.map((r) => r.body).join('\n'),
    /(?<![\w-])opacity: 0(?![.\d])|visibility: hidden|display: none/,
    '90',
  );
  assert.doesNotMatch(
    cssCode,
    /:hover[^{]*\{[^}]*(?:display|visibility|opacity)/,
    '90',
  );
  // Motion: tokens only; one arrival keyframe; nothing loops.
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
  assert.deepEqual(
    [...cssCode.matchAll(/@keyframes ([a-z-]+)/g)].map(([, n]) => n),
    ['wst-rise'],
  );
  assert.doesNotMatch(
    cssCode,
    /infinite|filter|backdrop|border-radius|box-shadow: 0 \d|rotate/,
    'no paper cosplay, glass, rounding or loops',
  );
  // First paint: the World ground from the root.
  assert.match(
    rule(':root:has(main[data-world-studio])'),
    /background: var\(--world-ground\);/,
  );
  assert.match(
    rule(':root:has(main[data-world-studio]) body'),
    /color-scheme: dark;/,
  );
  // Short landscape clears the 68px chrome; phones are one column.
  assert.match(
    css,
    /@media \(max-width: 1199px\) and \(max-height: 540px\) and \(orientation: landscape\) \{\s*\.wst-entry \{\s*padding-top: calc\(68px \+ 20px\);/,
  );
  assert.match(
    css,
    /@media \(max-width: 767px\) \{[\s\S]*?\.wst-areas \{\s*grid-template-columns: minmax\(0, 1fr\);/,
  );
}

// 91–106. Everything else stays as it was.
{
  // 96–101. Gallery, Objects, Archive, Lab and both shells render this
  // chrome: for every room it differs only by the Studio entry.
  for (const current of ['gallery', 'objects', 'archive', 'lab']) {
    const live = render(chromeFor(building).WorldChrome, {
      currentRoom: current,
    });
    const before = render(chromeFor(beforeStudio).WorldChrome, {
      currentRoom: current,
    });
    assert.equal(
      withoutStudio(live),
      withoutStudio(before),
      `96–101. ${current}`,
    );
    assert.match(live, /<a href="\/world\/studio" class="wl-map-entry">/);
  }
  const LOCKED = {
    // 91–95. Contact, About, projects and the homepage.
    'app/contact/page.tsx': 'c032839675e22030',
    'app/about/page.tsx': 'f37191ad7520adf3',
    'app/projects/page.tsx': '20ddcdf2a19b353f',
    'app/projects/[slug]/page.tsx': '180ea9d64e0120e4',
    'components/project/project-detail.tsx': '1930b351db670dc9',
    'components/project/project-preview.tsx': 'bcf1c5029a06643d',
    'components/project/project-selection.tsx': '796748c6ff5bae13',
    'data/projects.ts': '25b663629400cb69',
    'data/types.ts': 'defd33c83b08986c',
    'data/relationships.ts': '0d3ee58a0ec101f3',
    'data/images.ts': '5727c7f9f231a8fe',
    'components/layout/site-footer.tsx': '8e4ed9e15415afcf',
    'components/layout/site-header.tsx': 'dfcfe66f79f370b1',
    'app/page.tsx': '9b4f5f0e730af60f',
    'data/home-chapters.ts': '9950e6fb66f92379',
    // 96–101. The rooms, both shells, the Lobby, the chrome, the Lab.
    'components/world/world-gallery.tsx': 'f1a4d8da704c60d5',
    'components/world/world-gallery.css': '38d790dd070c413d',
    'components/world/world-objects.tsx': '4a565398c1e36def',
    'components/world/world-objects.css': '038f31c72e212ffb',
    'components/world/world-archive.tsx': '2bb5f3cfdee5a1c4',
    'components/world/world-archive.css': '28c157c6802aaf5f',
    'components/world/world-lab.tsx': '549d0cf9e05330e4',
    'components/world/world-lab.css': 'e76af54673366690',
    'components/world/lab-atmosphere-study.tsx': '792e36f370e55eb8',
    'components/world/lab-atmosphere-adapter.ts': 'a87fef7879b3853a',
    'data/world-lab.ts': '85049c4f94f0a469',
    'data/world-archive.ts': 'f399b8a0aba82029',
    'components/world/world-detail-shell.tsx': '3e53405aaff87ab1',
    'components/world/world-detail-shell.css': '59df760b8e04e445',
    'components/world/object-study-shell.tsx': '404081ad9d571e7b',
    'components/world/object-study-shell.css': '7743c1aecaa2449a',
    'components/world/world-lobby.tsx': 'bf0bc493f965b78c',
    'components/world/world-lobby.css': 'e3ef8536f38af67f',
    'components/world/world-chrome.tsx': '3a37f3c5c372903f',
    'components/world/world-map-disclosure.tsx': '4707ca1a14337b76',
    'components/world/world-portal.ts': 'ca47a68612c2d21b',
    'components/world/world-gateway-link.tsx': 'a05d4306413948ec',
    // 102. Products.
    'app/products/page.tsx': '2257cc689fdfa941',
    'app/products/[slug]/page.tsx': 'f5515aa35568c5dc',
    'components/product/product-detail.tsx': '785f3fb044d54e96',
    'components/sections/object-selection.tsx': 'a59b00fb9dbc215b',
    'lib/product-detail-context.ts': '2177f57b3e4b5cc9',
    // 103–105. Materials, journal, the catalogue.
    'app/materials/page.tsx': '0ba50fb84afab920',
    'app/materials/[slug]/page.tsx': '127360a92443d16f',
    'app/journal/page.tsx': '1205ae4a7555f526',
    'app/journal/[slug]/page.tsx': '10ad24979646d735',
    'app/worlds/page.tsx': '57084f2da546497a',
    // The editorial chrome steps aside on /world/* already.
    'app/layout.tsx': 'd1f018f9f20b3294',
    'components/layout/editorial-chrome.tsx': '5e1eb2ec9e8c232e',
  };
  for (const [path, value] of Object.entries(LOCKED))
    assert.equal(digest(path), value, `${path} is locked`);
  // The homepage Atrium shortcuts are not the building directory.
  assert.doesNotMatch(read('data/home-chapters.ts'), /studio/i);
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
      'world/studio/page.tsx',
    ],
    'one room route added; nothing below it',
  );
  assert(!pages.some((p) => p.startsWith('api/')), 'no API route');
  const { scripts, dependencies, devDependencies } = json('package.json');
  assert.equal(scripts['check:studio'], 'node scripts/check-studio.mjs');
  for (const name of [
    'check:lab',
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
  // 68. No form, email, booking, CRM or animation dependency.
  const deps = Object.keys({ ...dependencies, ...devDependencies });
  for (const banned of [
    'react-hook-form',
    'formik',
    '@formspree/react',
    'emailjs-com',
    '@emailjs/browser',
    'resend',
    'nodemailer',
    '@hubspot/api-client',
    'react-calendly',
    '@calcom/embed-react',
    '@supabase/supabase-js',
    'gsap',
    'framer-motion',
    'motion',
    'lenis',
    '@react-three/fiber',
  ])
    assert(!deps.includes(banned), `68. no ${banned}`);
}

console.log(
  'Studio passed: /world/studio is Room 05 and the building is complete (Gallery, Objects, Archive, Lab, Studio, all available at their own paths, ids, order and types fixed; the Lobby says 5 of 5 and derives it; five World-map links, no planned room, planned-room support and its label kept; Studio current only in the Studio); no invented testimonials, logos, metrics, commissions, prices, quotes, bookings, team, awards or history; no form, input, button, email, phone, messaging, scheduler or form service, only navigation; the enquiry status says Opening soon from one constant, matching /contact, and the Contact action is a real link; three concept studies resolve from data/projects.ts with no fact authored in the curation and a missing slug an error, labelled Concept study, disclosed beside them and linked to their editorial pages with no Studio context; Space, Material and Visualization as areas of conversation, how a project can begin, a starting brief to read; a directory to every section first; one h1, h2 per section, ordered lists, 44px targets, scoped token CSS; no client code, 3D, network or loop; Contact, About, projects, homepage, every other room, both shells, products, materials, journal and the catalogue are locked.',
);
