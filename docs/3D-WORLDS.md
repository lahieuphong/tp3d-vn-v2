# 3D Worlds

`/worlds` is a curated editorial gallery of four digital interiors. It is independent of the product asset catalog and project experience architecture. Every **Enter World** link opens the supplied scene on Sketchfab. This release creates no World Detail route, embed, Viewer API client, Three.js renderer or commerce interface.

## Content and images

Edit `data/worlds.ts`. Each `World` contains `id`, `slug`, `title`, `category`, `year`, `description`, `image: { src, alt }`, `sketchfabUid`, `externalUrl`, and author/licence `credit` metadata. The UID is retained for a possible future `/worlds/[slug]` integration. `year` denotes the curation edition, not an assertion about the scene's original publication date.

| World                       | Sketchfab scene                                                                              |
| --------------------------- | -------------------------------------------------------------------------------------------- |
| Modern Kitchen              | https://sketchfab.com/3d-models/modern-kitchen-9843a830b96142a9a53f45f25304d93c              |
| White Modern Living Room    | https://sketchfab.com/3d-models/white-modern-living-room-afb8cb0cbee1488caf61471ef14041e9    |
| Minimalistic Modern Bedroom | https://sketchfab.com/3d-models/minimalistic-modern-bedroom-4f3db3cb57bd4bce886f7b9a13273a2f |
| Modern Bathroom             | https://sketchfab.com/3d-models/modern-bathroom-9ba7e0a094694335bd8f4656611c0676             |

All four public model API responses returned 200 and matched the supplied title, UID and URL. Exact previews were available, so no unrelated reference photography or artificial placeholder was needed. Author/licence information is retained in `assets/world-preview-sources.json` and displayed in the gallery. See [Asset sources](ASSET-SOURCES.md) for provenance.

To replace a preview, add its source JPG under `assets/reference-images`, run `yarn images:optimize`, then update the World's `image.src` and `image.alt`. If the creator or licence changes, update the credit and provenance record too. The shared `EditorialImage` reserves image dimensions and supplies responsive local WebP variants.

## Presentation and integration

- `WorldsHero` uses a quiet typographic opening with a cropped Bedroom preview. Desktop height is approximately 85svh, with a minimum height for short displays. On mobile, content determines its height.
- `WorldEntry` uses one semantic article per scene. Desktop compositions alternate: text left/image right, image left/text right, an inset study, then a wide closing image. Mobile always orders category/number, image, title, description, CTA.
- World imagery and CTA links open externally, with descriptive names, `target="_blank"` and `rel="noopener noreferrer"`. No nested links or click handlers wrapping an entire article are used.
- Hover scales imagery slightly; touch and reduced-motion environments retain a static image. No animation dependency is added.
- The closing section returns to `/spaces`.
- `data/navigation.ts` supplies explicit destinations to the header, mobile menu and footer. The order is Spaces / Projects / Collections / 3D Worlds / Journal / About. At 761–900 px, only the visible label shortens to **Worlds**; its accessible name remains **3D Worlds**. Header height is unchanged.
- Main navigation does not prefetch routes while viewing Worlds; the new Worlds link also opts out of prefetch elsewhere to avoid adding gallery image requests to the Homepage. Existing destination behavior elsewhere is retained.
- Search includes the gallery and individual scenes. Scene results use `/worlds#slug`, not unimplemented detail routes. Fragment navigation is assigned explicitly before the closing dialog can detach its result link; modified clicks retain standard browser behavior.

Homepage sections and Hero, fonts, palette, global spacing, existing editorial pages and scene loaders are unchanged. The four concept products remain `asset.available: false`; these external scenes do not publish or sell those product assets.

## Verification

Checks run on 2026-09-19:

- `yarn lint`, `yarn exec tsc --noEmit`, `yarn check:content`, `yarn check:assets`.
- `yarn build:vercel` and a local production preview.
- Route crawler: 40 pages, 58 image paths, eight expected 404s including `/worlds/modern-kitchen` (no World Detail route).
- Exact four UIDs/URLs, navigation destinations, search anchors, populated articles, safe external-link attributes and no iframe/canvas in Worlds HTML.
- Chrome responsive QA at 375, 390, 768, 1024, 1440 and 1920 px, plus navigation edges at 901 and 1101 px: no horizontal overflow or header overlap; titles fit and Enter World targets are 44 px tall. All four articles preserve the required mobile reading order.
- Chrome keyboard activation of Enter World opens Modern Kitchen in a separate Sketchfab tab; the original gallery remains open. Search and its scene fragment were checked with mouse and keyboard.
- Zero Sketchfab/Fab requests, iframes or canvases on the gallery before external navigation. No application console errors or hydration warnings observed. Vinext may report existing framework dynamic-import build warnings and image-preload warnings when unrelated routes are prefetched; these are not embedded viewer requests.

Preview links depend on the external scenes remaining public. Local previews and credits remain available if an external scene is later removed. No deployment to the public Vercel site is performed by these local checks.

## Files

Created: `app/worlds/page.tsx`, `data/worlds.ts`, `data/navigation.ts`, `components/worlds/worlds-hero.tsx`, `components/worlds/world-entry.tsx`, `components/worlds/worlds.css`, `components/layout/navigation.css`, source/optimized `world-*` images, `assets/world-preview-sources.json`, and this document.

Modified: `components/layout/site-header.tsx`, `components/layout/site-footer.tsx`, `data/types.ts`, `data/search.ts`, `data/image-dimensions.json`, `scripts/check-content.mjs`, `scripts/check-site.mjs`, `README.md`, and `docs/ASSET-SOURCES.md`.
