/** Catalogue behaviour and SSR with 4, 12, 30 and 100 records. No fixture enters production data. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const root = fileURLToPath(new URL('../', import.meta.url));
const nativeRequire = createRequire(import.meta.url);
const modules = new Map();
function load(path) {
  const file = extname(path)
    ? path
    : ['.ts', '.tsx'].map((extension) => path + extension).find(existsSync);
  if (file.endsWith('.json')) return JSON.parse(readFileSync(file, 'utf8'));
  if (modules.has(file)) return modules.get(file).exports;
  const loaded = { exports: {} };
  modules.set(file, loaded);
  const { outputText } = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  });
  const require = (id) =>
    id.startsWith('@/')
      ? load(resolve(root, id.slice(2)))
      : id.startsWith('.')
        ? load(resolve(dirname(file), id))
        : nativeRequire(id);
  runInNewContext(
    outputText,
    { module: loaded, exports: loaded.exports, require, URLSearchParams },
    { filename: file },
  );
  return loaded.exports;
}
const { worlds } = load(resolve(root, 'data/worlds'));
const {
  getMosaicPattern,
  assignItemsToSlots,
  groupMosaicItems,
  getSlotRatio,
  mosaicBreakpoints,
} = load(resolve(root, 'lib/world-mosaic'));
const { WorldsGrid } = load(resolve(root, 'components/worlds/worlds-grid'));
let verifiedPatterns = 0;
for (const breakpoint of mosaicBreakpoints) {
  for (let count = 1; count <= 8; count++) {
    for (let variant = 0; variant < 3; variant++) {
      const pattern = getMosaicPattern(count, breakpoint, variant);
      assert.equal(pattern.slots.length, count);
      const cells = Array.from(
        { length: pattern.columns * pattern.rows },
        () => 0,
      );
      for (const slot of pattern.slots) {
        assert.ok(
          slot.col >= 1 &&
            slot.row >= 1 &&
            slot.colSpan > 0 &&
            slot.rowSpan > 0,
        );
        assert.ok(slot.col + slot.colSpan <= pattern.columns + 1);
        assert.ok(slot.row + slot.rowSpan <= pattern.rows + 1);
        for (let row = slot.row - 1; row < slot.row - 1 + slot.rowSpan; row++) {
          for (let col = slot.col - 1; col < slot.col - 1 + slot.colSpan; col++)
            cells[row * pattern.columns + col]++;
        }
      }
      assert.ok(
        cells.every((coverage) => coverage === 1),
        `${pattern.id}: every cell covered exactly once`,
      );
      for (const layouts of [
        Array.from({ length: count }, (_, index) => worlds[index % 4]),
        ...['portrait', 'landscape', 'square', 'wide'].map((layout) =>
          Array.from({ length: count }, () => ({ layout })),
        ),
      ]) {
        const assignment = assignItemsToSlots(layouts, pattern, breakpoint);
        assert.equal(
          new Set(assignment).size,
          count,
          `${pattern.id}: one item per slot`,
        );
        assert.equal(
          JSON.stringify(assignment),
          JSON.stringify(assignItemsToSlots(layouts, pattern, breakpoint)),
          'deterministic',
        );
      }
      verifiedPatterns++;
    }
  }
}
// A known exact match must beat a locally plausible but globally worse mapping.
const exactPattern = {
  id: 'assignment-check',
  columns: 4,
  rows: 2,
  aspectRatio: 2,
  slots: [
    { col: 1, row: 1, colSpan: 1, rowSpan: 2 },
    { col: 2, row: 1, colSpan: 2, rowSpan: 1 },
    { col: 4, row: 1, colSpan: 1, rowSpan: 2 },
    { col: 2, row: 2, colSpan: 2, rowSpan: 1 },
  ],
};
const assignment = assignItemsToSlots(
  [
    { layout: 'wide' },
    { layout: 'portrait' },
    { layout: 'wide' },
    { layout: 'portrait' },
  ],
  exactPattern,
  'wide',
);
assert.ok(
  getSlotRatio(exactPattern.slots[assignment[0]], exactPattern, 'wide') > 1.8,
);
assert.ok(
  getSlotRatio(exactPattern.slots[assignment[1]], exactPattern, 'wide') < 0.8,
);
assert.throws(() => getMosaicPattern(0, 'wide'));
assert.throws(() => getMosaicPattern(9, 'wide'));
assert.equal(groupMosaicItems([]).length, 0);
for (const count of [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 13, 15, 23, 25, 31, 50, 100, 103,
]) {
  const fixtures = Array.from({ length: count }, (_, index) => ({
    ...worlds[index % worlds.length],
    id: `mosaic-${index}`,
    slug: `mosaic-${index}`,
  }));
  const blocks = groupMosaicItems(fixtures);
  assert.equal(blocks.length, Math.ceil(count / 8));
  assert.equal(blocks.at(-1).length, count % 8 || 8);
  const html = renderToStaticMarkup(
    React.createElement(WorldsGrid, {
      worlds: fixtures,
      indices: new Map(fixtures.map((world, index) => [world.id, index])),
      focusFrom: null,
    }),
  );
  assert.equal(
    (html.match(/class="mosaic-block"/g) ?? []).length,
    Math.ceil(count / 8),
  );
  assert.equal((html.match(/class="mosaic-tile"/g) ?? []).length, count);
  assert.equal((html.match(/data-world="/g) ?? []).length, count);
  assert.deepEqual(
    [...html.matchAll(/data-world="([^"]+)"/g)].map((match) => match[1]),
    fixtures.map((world) => world.slug),
    'DOM/tab order follows filtered source, irrespective of visual slot assignment',
  );
}
console.log(
  `Mosaic passed: ${verifiedPatterns} responsive pattern/variant checks, full cell coverage, unique/deterministic assignments, and 1–103 item SSR.`,
);
const {
  defaultWorldQuery: defaults,
  selectWorlds,
  getWorldCategories,
  getFeaturedWorlds,
  getVisibleWorlds,
  readWorldQuery,
  writeWorldQuery,
} = load(resolve(root, 'lib/world-catalog'));
const { WorldsCatalog } = load(
  resolve(root, 'components/worlds/worlds-catalog'),
);
const { FeaturedWorlds } = load(
  resolve(root, 'components/worlds/featured-worlds'),
);
const render = (Component, props) =>
  renderToStaticMarkup(React.createElement(Component, props));
for (const count of [4, 12, 30, 100]) {
  const fixtures = Array.from({ length: count }, (_, index) => ({
    ...worlds[index % worlds.length],
    id: `fixture-${index}`,
    slug: `fixture-${index}`,
    title: `Study ${String(index).padStart(3, '0')}`,
    year: String(2023 + (index % 4)),
    category:
      index % 5 === 0 ? 'Decor' : worlds[index % worlds.length].category,
    featured: index % 3 === 0,
  }));
  const sorted = selectWorlds(fixtures, defaults);
  assert.equal(sorted.length, count);
  assert.equal(getVisibleWorlds(sorted, 1).length, Math.min(count, 24));
  assert.equal(getVisibleWorlds(sorted, 2).length, Math.min(count, 48));
  assert.equal(getVisibleWorlds(sorted, 3).length, Math.min(count, 72));
  assert.equal(getVisibleWorlds(sorted, 100).length, count);
  assert.equal(
    getFeaturedWorlds(fixtures).length,
    Math.min(3, Math.ceil(count / 3)),
  );
  assert.ok(
    getWorldCategories(fixtures).some((category) => category.value === 'decor'),
  );
  assert.equal(
    selectWorlds(fixtures, { ...defaults, category: 'decor' }).length,
    Math.ceil(count / 5),
  );
  assert.ok(
    sorted.every(
      (world, index) =>
        !index || Number(world.year) <= Number(sorted[index - 1].year),
    ),
  );
  const az = selectWorlds(fixtures, { ...defaults, sort: 'az' });
  assert.equal(az[0].title, 'Study 000');
  assert.equal(
    fixtures[0].title,
    'Study 000',
    'sorting must not mutate the source',
  );
  const html = render(WorldsCatalog, {
    worlds: fixtures,
    initialQuery: defaults,
  });
  const shown = Math.min(24, count);
  assert.equal((html.match(/data-world="/g) ?? []).length, shown);
  assert.equal(html.includes('LOAD MORE'), count > 24);
  assert.equal((html.match(/loading="lazy"/g) ?? []).length, shown);
  assert.doesNotMatch(html, /<iframe|<canvas|world-card-copy/);
  assert.equal((html.match(/class="world-card-overlay"/g) ?? []).length, shown);
  assert.equal((html.match(/href="\/worlds\/fixture-/g) ?? []).length, shown);
  assert.doesNotMatch(html, /<a[^>]+href="https:\/\/sketchfab/);
  assert.ok((html.match(/<link[^>]+rel="preload"/g) ?? []).length === 0);
  assert.ok(
    (
      render(FeaturedWorlds, { worlds: fixtures }).match(/data-world-card/g) ??
      []
    ).length <= 3,
  );
}
for (const [q, expected] of [
  ['minimal', 1],
  ['Contemporary', 1],
  ['INTERIOR', 4],
  ['  modern   kitchen ', 1],
  ['unmatched', 0],
]) {
  assert.equal(selectWorlds(worlds, { ...defaults, q }).length, expected, q);
}
const filtered = { ...defaults, category: 'kitchen', q: 'modern', sort: 'az' };
assert.equal(selectWorlds(worlds, filtered).length, 1);
const params = writeWorldQuery(new URLSearchParams('ref=journal'), filtered);
assert.equal(params.get('ref'), 'journal');
assert.equal(
  JSON.stringify(readWorldQuery(params, worlds)),
  JSON.stringify(filtered),
);
assert.equal(writeWorldQuery(params, defaults).toString(), 'ref=journal');
assert.equal(
  readWorldQuery(new URLSearchParams('category=invalid&sort=invalid'), worlds)
    .category,
  '',
);
assert.equal(
  readWorldQuery(new URLSearchParams('sort=invalid'), worlds).sort,
  'newest',
);
const empty = render(WorldsCatalog, {
  worlds,
  initialQuery: { ...defaults, q: 'no-match' },
});
assert.match(empty, /No worlds found/);
assert.match(empty, /Clear filters/);
assert.doesNotMatch(empty, /data-world="|LOAD MORE/);
assert.equal(render(FeaturedWorlds, { worlds: [] }), '');
assert.equal(
  (
    render(WorldsCatalog, {
      worlds: worlds.map((world) => ({ ...world, available: false })),
      initialQuery: defaults,
    }).match(/target="_blank"/g) ?? []
  ).length,
  0,
);
console.log(
  'Worlds passed: 4/12/30/100-record SSR, 24-item pagination, derived categories/featured, combined search, sorting, URL state, empty and unavailable states.',
);
