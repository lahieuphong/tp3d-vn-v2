# Worlds balanced modular mosaic

Only the catalogue packing engine changes in this iteration. The existing card image/overlay, hover and tilt, typography, toolbar, data, detail route and Sketchfab viewer are retained.

## Structure and packing

`WorldsGrid` groups the filtered, paginated results into consecutive groups of up to eight. Each `MosaicBlock` is one explicit CSS Grid rectangle with fixed logical columns/rows and a reserved aspect ratio. `mosaic-tile` wraps the existing `WorldCard`; all transforms remain inside the card.

`lib/world-mosaic.ts` holds the pattern data and assignment functions. Every logical cell is covered exactly once. There is no dense auto-placement, shortest-column balancing, implicit row, invisible tile or bottom padding to disguise gaps. Top, bottom and side boundaries are occupied by real tiles. Gutters are 12px in both directions; blocks are separated by 20px.

There are patterns for every count from 1 through 8 at five responsive profiles: **48 responsive pattern mappings** (41 templates; the two desktop profiles share seven partial patterns). Full eight-item blocks cycle through three compositions on mobile, tablet, desktop and wide desktop; very small screens use one vertical composition. Partial blocks have their own complete rectangle, so a final block of 1–7 items never inherits unused slots from an eight-item template.

## Assignment and responsive behaviour

The existing `layout` values map to preferred aspect ratios: portrait 0.75, square 1, landscape 1.5 and wide 2. A deterministic bitmask assignment minimizes total squared log-aspect error across all slots in a block, including gutters at a representative width. With at most eight items, the search is bounded to 256 states per responsive pattern. Mismatched category counts still fill every slot. Images retain `object-fit: cover`; nothing stretches their pixels.

The DOM and Tab order follow the source/sort order. Only CSS grid placement changes. Load More still focuses the first newly appended record, and the existing page size of 24 is divisible by eight, so previously complete blocks remain stable.

All five placement maps are generated from the same data on server and client. Media queries choose the active map, without browser-width state, resize handlers, measurement passes or hydration differences. The image `sizes` attribute follows each assigned slot's width at the same breakpoints.

| Viewport         | Composition                                            |
| ---------------- | ------------------------------------------------------ |
| Below 360px      | One column, varied heights                             |
| 360–639px        | Two columns, simple balanced subdivisions              |
| 640–1023px       | Two columns with roomier image proportions             |
| 1024–1439px      | Three-column full blocks; simpler partial compositions |
| 1440px and above | 12 underlying columns with cross-column spans          |

Filter/search/sort pass their new visible sequence through the same grouping and assignment. Empty results keep the existing empty state, and no zero-item block is rendered. Adding records requires no manual placement configuration. No dependencies, models, iframe, WebGL or Three.js are added to the catalogue.

## Validation

`yarn check:worlds` validates 120 count/profile/variant combinations, ensuring all cells are inside their rectangle, have exactly one occupant and receive a unique, deterministic model assignment. It covers homogeneous and mixed aspect categories, empty input, invalid counts, and SSR for 1/2/3/4/5/6/7/8/9/13/15/23/25/31/50/100/103 items. It also verifies source DOM order, pagination, search/filter/sort, native detail links and lazy images.

Browser validation used a temporary local fixture route with the actual `WorldsGrid` and existing cards. Nine item counts (3/4/5/7/8/9/15/23/31) were measured at 320/375/390/768/1024/1440/1920px, including live viewport changes. Across 63 cases and 112 blocks, `getBoundingClientRect()` matched every explicit slot, all occupied edge cells met the block top/bottom, no slot escaped its bounds, no cell was empty/overlapped, and no page overflow occurred. Image-plane dimensions matched their slots. All cases were rerun after the mobile composition adjustment.

Load More was checked at 24 → 31 items: 8/8/8/7 blocks, with focus on record 25. Category filtering rebuilt a seven-item block; a combined search with no matches rendered no block; clearing the category while retaining the search rebuilt an eight-item block. Desktop and mobile screenshots confirmed varied card shapes inside a flat rectangular outline.

Production checks passed: TypeScript, lint, catalogue/content/asset checks, `git diff --check` and `yarn build:vercel`. The route crawl verified 44 pages, 58 image paths and eight expected 404s. `/worlds-qa` also returns 404 after removal; production retains the original four records. No JS errors or React hydration warnings were observed in the final production session. Chrome still reports unused image-preload warnings from the existing site navigation/prefetch behaviour (hero/workspace resources); that unrelated behaviour was not changed.

A fine-pointer tilt check measured approximately 1.98° X / 2.48° Y while the outer slot rectangle stayed exactly unchanged. Production cards remain lazy images, with no broken loaded images, iframe, canvas, Sketchfab/GLB/GLTF/Three resource requests in the catalogue. A single mobile tap still opened the existing Modern Kitchen detail and its original Sketchfab link. No public deployment was performed.

Scope note: at the unusually narrow 289px viewport produced by a fully docked DevTools panel, the pre-existing filter strip extends beyond the page. The new grid itself stays inside its bounds. This unrelated toolbar behaviour was preserved; all requested widths and the additional 320px check pass.
