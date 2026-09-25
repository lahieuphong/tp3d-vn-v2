# Layered material groups

Generated 2026-09-26 with one built-in `image_gen.imagegen` call. This transparent sprite sheet provides six independently positioned depth groups for Scene 5 while preserving the previous `material-tableau` as a composed fallback. The six groups share the same lighting, art direction and decoded source texture. No independent full-scene duplicate plates were created.

## Delivery

- Original: `assets/home-chapters/material-groups.png` — 1536 × 1024, 2439221 bytes.
- Full WebP: `public/images/home-chapters/material-groups.webp` — 1536 × 1024, 342022 bytes.
- Tablet WebP: `public/images/home-chapters/material-groups-1280.webp` — 1280 × 853, 263772 bytes.
- Mobile WebP: `public/images/home-chapters/material-groups-720.webp` — 720 × 480, 93998 bytes.
- Layout metadata: `data/home-material-groups.json`.
- Original checksum/export/alpha audit: `assets/home-chapters/material-groups-audit.json`.
- Visual QA: `outputs/home-chapters/material-groups-webp-ivory-qa.jpg`.

Use square CSS windows with `background-size: 300% 200%`, or equivalent clipped image positioning. Full-size cells are exactly 512 × 512. No destructive pixel cutting was performed. Each group has its own original-cell silhouette bounds in the metadata for accurate placement and baselines.

| Group            | Column / row (zero-based) | Background position |
| ---------------- | ------------------------- | ------------------- |
| wood             | 0 / 0                     | 0% 0%               |
| stone-slabs      | 1 / 0                     | 50% 0%              |
| foreground-stone | 2 / 0                     | 100% 0%             |
| ceramic          | 0 / 1                     | 0% 100%             |
| textile          | 1 / 1                     | 50% 100%            |
| metal            | 2 / 1                     | 100% 100%           |

## QA

The native image viewer shows unassociated RGB outside object silhouettes as a dark photographic-looking halo. The PNG **does have actual alpha**: 898548 fully transparent pixels, 674316 partially transparent pixels, zero fully opaque pixels (1572864 total). Both original PNG and delivered WebP were composited over ivory for inspection only. The inspected compositions show clean cutouts with no baked opaque background, no text, and six separate complete groups. Every internal cell boundary has **zero pixels above alpha 128**, so square CSS windows do not cut into visible object silhouettes. The generator did not preserve the requested 12% padding uniformly, but all six groups remain completely isolated within their cells.

Compression: Sharp width-only resize without enlargement, WebP quality 90, alphaQuality 100, effort 6. No heuristic background removal or matte painting was used. Composited JPEGs are QA evidence only; alpha is retained in every browser asset.

Generated source: `/Users/lahieuphong/.codex/generated_images/01a0d98d-8972-77d0-a3d6-0463a268dd16/exec-db841aaa-87e1-442d-8f0a-e5d9c1abad08.png`.

Reference: `/Users/lahieuphong/Downloads/image 14.jpg`, visually inspected before use.

## Exact prompt

```text
Use case: product-mockup / background-extraction.
Asset type: transparent photographic sprite sheet for a layered luxury interior material composition.
Input image: image 14.jpg is a material and lighting reference only. Ignore its typography, UI, architecture, ribbon and arrangement.
Primary request: create a clean 3-COLUMN by 2-ROW sprite sheet on a genuinely transparent alpha background, landscape aspect ratio 3:2, approximately 1536 by 1024 pixels. There are EXACTLY SIX separate object groups, one centered in each equal square cell. Each group must fit completely inside its cell with at least 12% transparent padding on all sides, and broad fully transparent gutters between every cell. NO visible grid lines or frames. Groups must not overlap or touch. No objects outside these six cells.
Cell order must be exact:
TOP LEFT: one tall upright rectangular dark walnut plank/slab, rich straight brown wood grain, subtle 3D thickness visible on right edge.
TOP MIDDLE: two upright cream limestone/travertine slabs grouped together, one tall at rear and a shorter one in front-left, quiet natural veining and chipped tactile edges.
TOP RIGHT: a low wide grouping of two raw irregular warm cream limestone rocks, one medium and one smaller, sculptural porous texture, no platform.
BOTTOM LEFT: one rounded warm-white matte ceramic vase, narrow neck with small circular mouth, clean sculptural silhouette, no plant.
BOTTOM MIDDLE: one folded and softly draped beige coarse woven linen textile, short fold draping down in front, richly tactile fibres, no furniture or support visible.
BOTTOM RIGHT: one dark burnished bronze almost-black round vessel/sphere with small neck, subtle warm patina, no twig, no plant, no flowers.
All groups photographed consistently, eye-level front three-quarter view looking just slightly down, soft golden architectural sunlight from upper left, subtle matching right shadows, believable grounded objects. Fine real wood, stone, ceramic, textile and bronze detail. Quiet luxury European materials editorial, not computer-game icons and not illustrated.
Actual transparency everywhere outside object silhouettes. Object interiors fully opaque; only natural tiny edge antialiasing and minimal soft contact shadows partially transparent. No opaque white/beige/black background, no painted checkerboard. Clean natural object-colored edge pixels, no colored matte halos. Do not include a floor or studio backdrop. Do not connect these groups. No additional objects, no duplication, no labels, words, numbers, symbols, logos, UI, ribbons, borders or watermark. Six distinct isolated groups, exact 3x2 equal-cell arrangement.
```
