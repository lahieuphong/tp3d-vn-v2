/** Validate the authored content graph using the project's existing TypeScript compiler. */
import assert from 'node:assert/strict';
import {
  mkdtempSync,
  readFileSync,
  readdirSync,
  writeFileSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
const output = mkdtempSync(join(tmpdir(), 'tp-content-check-'));
// Compile only pure content modules into an isolated temporary ESM package.
process.on('exit', () => rmSync(output, { recursive: true, force: true }));
writeFileSync(join(output, 'package.json'), '{"type":"module"}');
for (const file of readdirSync(new URL('../data/', import.meta.url)).filter(
  (name) => name.endsWith('.ts'),
)) {
  const { outputText } = ts.transpileModule(
    readFileSync(new URL(`../data/${file}`, import.meta.url), 'utf8'),
    {
      compilerOptions: {
        module: ts.ModuleKind.ES2022,
        target: ts.ScriptTarget.ES2022,
      },
    },
  );
  writeFileSync(
    join(output, file.replace(/\.ts$/, '.js')),
    outputText.replace(/from '(\.\/[^']+)'/g, "from '$1.js'"),
  );
}
for (const file of readdirSync(new URL('../data/', import.meta.url)).filter(
  (name) => name.endsWith('.json'),
)) {
  writeFileSync(
    join(output, `${file}.js`),
    `export default ${readFileSync(new URL(`../data/${file}`, import.meta.url), 'utf8')};`,
  );
}
const load = (name) => import(pathToFileURL(join(output, `${name}.js`)).href);
const [
  { projects },
  { spaces },
  { collections },
  { products },
  { materials },
  relations,
  { worlds },
  { mainNavigation, mobileNavigation, exploreNavigation },
  { searchEntries },
] = await Promise.all(
  [
    'projects',
    'spaces',
    'collections',
    'products',
    'materials',
    'relationships',
    'worlds',
    'navigation',
    'search',
  ].map(load),
);
const checkRefs = (owner, refs, catalog) => {
  assert.equal(
    new Set(refs).size,
    refs.length,
    `${owner}: duplicate references`,
  );
  for (const slug of refs)
    assert(
      catalog.some((item) => item.slug === slug),
      `${owner}: unresolved ${slug}`,
    );
};
for (const [name, catalog] of Object.entries({
  projects,
  spaces,
  collections,
  products,
  materials,
  worlds,
})) {
  assert.equal(
    new Set(catalog.map((item) => item.slug)).size,
    catalog.length,
    `${name}: duplicate slug`,
  );
}
for (const project of projects) {
  for (const [kind, catalog] of Object.entries({ products, materials, spaces }))
    checkRefs(project.slug, project[kind], catalog);
  assert.equal(
    project.threeScene.enabled,
    false,
    `${project.slug}: no actual scene has been registered yet`,
  );
  const related = relations.getRelatedProjects(project);
  assert(
    related.length >= 1 && related.length <= 2,
    `${project.slug}: expected 1–2 related projects`,
  );
  assert(
    !related.some((other) => other.slug === project.slug),
    'Project must not relate to itself',
  );
}
for (const space of spaces) {
  assert(
    relations.getSpaceProjects(space.slug).length,
    `${space.slug}: missing projects`,
  );
  checkRefs(space.slug, space.products, products);
  checkRefs(space.slug, space.materials, materials);
}
for (const collection of collections) {
  checkRefs(collection.slug, collection.projects, projects);
  const context = relations.getCollectionContext(collection);
  assert(
    context.projects.length &&
      context.products.length &&
      context.materials.length,
    `${collection.slug}: incomplete context`,
  );
  assert.deepEqual(
    context.projects.map((p) => p.slug),
    collection.projects,
    'Collection order must be preserved',
  );
}
for (const product of products)
  assert(
    relations.getProductProjects(product.slug).length,
    `${product.slug}: missing project context`,
  );
for (const material of materials)
  assert(
    relations.getMaterialProjects(material.slug).length,
    `${material.slug}: missing project context`,
  );
assert.deepEqual(
  relations.getSpaceProjects('living').map((p) => p.slug),
  ['the-walnut-residence', 'quiet-house'],
);
assert(
  relations
    .getSpaceProjects('kitchen')
    .some((p) => p.slug === 'the-walnut-residence'),
);
assert.deepEqual(
  relations.getMaterialProjects('walnut').map((p) => p.slug),
  ['the-walnut-residence'],
);
assert(
  relations
    .getMaterialProjects('travertine')
    .some((p) => p.slug === 'the-walnut-residence'),
);
assert.deepEqual(relations.getCollectionContext({ projects: [] }), {
  projects: [],
  products: [],
  materials: [],
});
assert.deepEqual(
  relations.getCollectionProjects({ projects: ['unknown'] }),
  [],
);
assert.equal(
  relations.getRelatedProjects(projects[0])[0].slug,
  'quiet-house',
  'Rank shared rooms and materials ahead of less relevant interiors',
);
assert.deepEqual(relations.getSpaceProjects('unknown'), []);
assert.deepEqual(relations.getProductProjects('unknown'), []);
assert.deepEqual(relations.getMaterialProjects('unknown'), []);
const expectedWorlds = {
  'modern-kitchen': '9843a830b96142a9a53f45f25304d93c',
  'white-modern-living-room': 'afb8cb0cbee1488caf61471ef14041e9',
  'minimalistic-modern-bedroom': '4f3db3cb57bd4bce886f7b9a13273a2f',
  'modern-bathroom': '9ba7e0a094694335bd8f4656611c0676',
};
for (const world of worlds) {
  assert.ok(world.style && world.type);
  assert.equal(typeof world.featured, 'boolean');
  assert.equal(typeof world.available, 'boolean');
}
for (const [slug, uid] of Object.entries(expectedWorlds)) {
  const world = worlds.find((entry) => entry.slug === slug);
  assert.ok(world, `Missing curated world: ${slug}`);
  assert.equal(world.sketchfabUid, uid);
  assert.equal(
    world.externalUrl,
    `https://sketchfab.com/3d-models/${slug}-${uid}`,
  );
  assert.ok(world.image.alt && world.description && world.credit.name);
  assert.ok(
    world.image.src.startsWith('/images/'),
    'World previews must be local',
  );
  assert.ok(searchEntries.some((entry) => entry.href === `/worlds#${slug}`));
}
for (const navigation of [
  mainNavigation,
  mobileNavigation,
  exploreNavigation,
]) {
  assert.equal(navigation.filter((item) => item.href === '/worlds').length, 1);
  assert.equal(
    new Set(navigation.map((item) => item.href)).size,
    navigation.length,
  );
}
assert.ok(searchEntries.some((entry) => entry.href === '/worlds'));
console.log(
  'Content graph passed: 3 projects, 5 spaces, 5 collections, 4 objects, 6 materials, 4 worlds; references, scene flags, exact external URLs, navigation and search verified.',
);
