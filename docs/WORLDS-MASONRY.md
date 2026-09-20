# Worlds visual catalogue — initial card iteration

> The free masonry packing described below has been superseded by [the balanced modular mosaic engine](WORLDS-MOSAIC.md). Card appearance and interaction descriptions remain applicable.

This change is limited to the catalogue grid and its cards. Header, Hero, toolbar/filter/search, palette, fonts, real World records, Sketchfab URLs and the existing `/worlds/[slug]` detail experience are preserved.

## Packing

The gallery uses CSS Grid with `grid-auto-flow: row dense`. `#worlds-results` supplies an inline-size container. Grid row height is calculated from that container's width, column count and gutter; eight units form a square. Layout variants map to stable spans:

| Existing data layout           | Row span | Intended silhouette |
| ------------------------------ | -------- | ------------------- |
| `wide`                         | 5        | approximately 16:10 |
| `landscape` (also the default) | 6        | approximately 4:3   |
| `square`                       | 8        | 1:1                 |
| `portrait`                     | 10       | approximately 4:5   |

The gutter is included in the track calculation, so neighbouring cards pack with equal horizontal/vertical spacing. Nonsquare ratios differ by only a few pixels to accommodate the shared gutter. Every card's full height belongs to its image. There is no caption block below it, no random assignment, JS measurement, ResizeObserver or masonry dependency. New items retain their authored layout after sorting/filtering.

| Viewport         | Columns | Gap  |
| ---------------- | ------- | ---- |
| below 360px      | 1       | 12px |
| 360–820px        | 2       | 12px |
| 821–1120px       | 3       | 14px |
| 1121–1599px      | 4       | 14px |
| 1600px and above | 5       | 14px |

Grid placement fills the next available space while DOM/tab order follows the filtered dataset. Load More retains the existing 24-record page size. No permanent duplicate records were introduced.

## Cards

`WorldCard` remains one native link to `/worlds/${slug}`. Its accessible name is “Open [title]”. All visible content is inside `WorldCardMedia`: image, category/index, title, type/year and View Model arrow. The browser storage hint is optional; a storage exception cannot block native detail navigation.

On desktop idle, only the image is visible. Hover or keyboard focus reveals a localized warm gradient and ivory type over the image, with a small text CTA. The image remains the primary surface; no permanent white button, box shadow, border or outside popup is used. A visible focus outline follows the whole card.

Touch/mobile/tablet cards always show only the small title and arrow inside the image, with the rest of the metadata hidden. A single tap follows the same detail route. Existing detail controls, external Sketchfab CTA and click-to-load viewer are unchanged.

The shared `useCardTilt` keeps one active mouse card and coalesces pointer movement with requestAnimationFrame. Maximum rotation is ±2° X / ±2.5° Y; image moves up to 4px opposite the cursor, text 6px and arrow 8px with it. Scale is 1.025 and transitions are 400–500ms. Leave/scroll/resize/preference changes/unmount reset tracking. No global mousemove or permanent animation loop.

Reduced motion disables tilt, parallax and scale. Hover/focus information remains available. All grid images are lazy, responsive local WebP; no canvas, Three.js, iframe, model download or Sketchfab request is introduced in the grid.

## Verification

- Lint, TypeScript and `check:worlds` cover catalogue SSR, no outside captions, internal detail links, lazy images, search/filter/sort, pagination and unpublished states using 4/12/30/100 records.
- A temporary browser route rendered 30 repeated records using all four authored layouts; it was removed before production build.
- Chrome checked 375, 390, 768, 1024, 1280, 1440 and 1920px. With 30 items, measured vertical gaps were exactly 12px or 14px, matching horizontal gaps. No page overflow; every card height equalled its image height; zero captions outside media.
- Category filtering packed the remaining images correctly. Load More showed 24 → 30 and a filter change reset to 24. Production keeps the original four records.
- Keyboard focus revealed the same overlay. Fine-pointer tracking stayed within the specified rotation/translation limits and activated only one card. Reduced-motion emulation produced no tilt or image transform.

Changed implementation files: `world-card.tsx`, `world-card-media.tsx`, `worlds-grid.tsx`, `worlds.css`, `use-card-tilt.ts`, `use-world-reveal.ts`. Updated validation: `scripts/check-worlds.mjs`, `scripts/check-site.mjs`. No model/detail/data files are changed.

Final production checks: `yarn build:vercel` passed; route crawl passed **44 pages, 58 image paths and eight expected 404s**. The removed fixture route also returns 404. Production has four real cards and query/filter SSR returns the expected counts. All four grid images are lazy; no broken images, outside captions, viewer elements or external Sketchfab/model resource requests were observed in the catalogue. Desktop click and a single mobile tap both opened the existing Modern Kitchen detail route with its original Sketchfab CTA.

No JavaScript errors or React hydration warnings were observed. Chrome reported an existing unused preload for `/images/hero.webp` from the site's navigation/prefetch behaviour; that unrelated Header/Homepage behaviour was left unchanged. No public deployment is performed by these local checks.
