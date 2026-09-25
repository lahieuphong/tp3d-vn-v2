# Spatial opening — asset provenance

This inventory applies only to the new Homepage opening. It separates the user-supplied composition references, generated photographic plates, authored vector layers and existing site assets. The references are not shipped as a flattened website image: navigation, headings, bilingual story, captions, buttons and portal links are HTML.

## User-supplied references

- Discovery frame: `/Users/lahieuphong/Downloads/image 9.jpg`.
- Story frame: `/Users/lahieuphong/Downloads/image 11.jpg`.
- Implementation brief: `/Users/lahieuphong/.codex/attachments/dbcd75ed-ea60-46c1-952b-a3b68d1429a4/Pasted text.txt`.

The user supplied these files as the primary art direction and composition targets. Their paths document this local task; they are not public website URLs. No claim is made that the reference artwork has a separate stock-image licence.

## Generated architecture, portal photography and cloth

The four retained PNG sources below are image-generation outputs created for this opening from the supplied art direction. They are architectural/decorative image assets rather than screenshots containing working UI. The runtime consumes local WebP derivatives; PNG sources remain outside `public/` and are not downloaded by visitors.

| Source file                              | Dimensions  |     Bytes | Runtime purpose                                                                                         |
| ---------------------------------------- | ----------- | --------: | ------------------------------------------------------------------------------------------------------- |
| `assets/spatial-hero/architecture-a.png` | 1586 × 992  | 2,244,214 | Discovery architecture with pale mineral surfaces, warm daylight, landscape and furniture.              |
| `assets/spatial-hero/architecture-b.png` | 1586 × 992  | 2,363,979 | Related architectural story composition with space for live bilingual columns and the central monogram. |
| `assets/spatial-hero/portal-atlas.png`   | 1254 × 1254 | 2,590,958 | Four interior/material images in a 2×2 atlas, used inside four live arch-shaped portal links.           |
| `assets/spatial-hero/breeze-ribbon.png`  | 1448 × 1086 |   645,048 | Transparent flowing ivory textile, composited above architecture and the monogram.                      |

The original generated files are retained under:

`/Users/lahieuphong/.codex/generated_images/01a09488-0cc1-7a60-8932-b3e44fe8fa8c/`

| Retained project source | Original generation output filename             |
| ----------------------- | ----------------------------------------------- |
| `architecture-a.png`    | `exec-76174b4f-b9c3-4ff1-a1f7-244fb0b1aa7c.png` |
| `architecture-b.png`    | `exec-f7f227c2-612a-4f3e-ba74-5d58f9c9d1af.png` |
| `portal-atlas.png`      | `exec-6c67fe2c-f532-451d-8715-c96768cbcc6e.png` |
| `breeze-ribbon.png`     | `exec-94ec8fa5-f0ba-4a27-844f-2ec50e959efb.png` |

All four retained PNGs were read and compared byte-for-byte with those original output files on 2026-09-24: all match. Public WebP assets are optimised derivatives, not renamed PNGs.

Generation intent, rather than a verbatim tool-prompt transcript:

1. Produce a warm ivory/stone architectural environment close to the discovery reference, retaining its depth, natural light and framing while excluding lettering, logos, navigation, captions and portal UI.
2. Produce a companion environment in the same architectural world for the story scene, retaining the reference's side architecture and central breathing room while excluding all website copy and decorative identity layers.
3. Produce four coherent interior/material photographs for Worlds, Spaces, Objects & Materials, and Projects & Stories; use one shared square atlas to avoid four unrelated full-resolution downloads.
4. Isolate a translucent ivory/sand silk ribbon on genuine transparency, with a wide flowing upper sweep and a twisting central tail. Preserve natural fabric folds, fine fibres and soft material lighting so it can float across both architectural scenes; exclude architecture, letters, logos and other website UI.

The intent statements above are reconstructed descriptions, not verbatim generation prompts. The exact tool-call prompt transcript is not included in this record; these summaries must not be presented as exact prompt quotations. Original output paths, source checksums and runtime files are recorded separately so the actual adopted assets remain identifiable.

### Source checksums

| Source               | SHA-256                                                            |
| -------------------- | ------------------------------------------------------------------ |
| `architecture-a.png` | `80c8771f153be64542e2fc58a6297e1f13711b8a34eb0a1db4fc8fd6656ccbef` |
| `architecture-b.png` | `62cb190c609717410c67d7355211eb244991425f75c830b6e97f1cbae228ecfd` |
| `portal-atlas.png`   | `b1859ab342381e3f9524a29ed5713d63918f445e232539e475b1905a1f2c09fc` |
| `breeze-ribbon.png`  | `2a2ea17a4835908c7377d2a92a1825a4234d2a3a7b1d7b66f250e1c09d9f8aa9` |

### Optimised runtime derivatives

| Public file                                | Dimensions  |   Bytes |
| ------------------------------------------ | ----------- | ------: |
| `/images/spatial-architecture-a-720.webp`  | 720 × 450   |  33,022 |
| `/images/spatial-architecture-a-1280.webp` | 1280 × 801  |  99,690 |
| `/images/spatial-architecture-a.webp`      | 1586 × 992  | 143,636 |
| `/images/spatial-architecture-b-720.webp`  | 720 × 450   |  44,822 |
| `/images/spatial-architecture-b-1280.webp` | 1280 × 801  | 129,894 |
| `/images/spatial-architecture-b.webp`      | 1586 × 992  | 186,896 |
| `/images/spatial-portals-720.webp`         | 720 × 720   | 120,492 |
| `/images/spatial-portals.webp`             | 1254 × 1254 | 305,634 |
| `/images/spatial-breeze-ribbon-720.webp`   | 720 × 540   |  31,010 |
| `/images/spatial-breeze-ribbon-1280.webp`  | 1280 × 960  |  83,328 |
| `/images/spatial-breeze-ribbon.webp`       | 1448 × 1086 |  94,972 |

Metadata above was read directly with the existing Sharp dependency. Architecture and atlas images are opaque plates; the ribbon PNG and all three ribbon WebP derivatives retain an alpha channel. None contains the site's live text. The dimensions and byte counts are an asset audit, not a claim about browser memory use or transferred bytes for a particular viewport.

`HeroArchitecture` selects one architecture size per scene through `srcset`/`sizes="100vw"`. Scene A is eager/high priority. Scene B initially has `data-src` and `data-srcset`, and the controller assigns real source attributes after the initial paint at low priority; it is not a second high-priority hero preload. Reduced-motion initialization does not request Scene B. The four portal images share the same atlas URL, which allows the browser to reuse the resource. The square `.sh-portal-photo` plane keeps each atlas quadrant proportional inside its arch crop.

`BreezeRibbon` now uses one responsive alpha WebP image in the shared decorative wrapper, with eager/low-priority loading and async decoding. Its `sizes` is `200vw` below 640px, matching the deliberately wider mobile cloth surface, and `100vw` otherwise. The CSS applies 0.7 image opacity and a −3% horizontal offset, reduced to 0.65 opacity on mobile; native scroll progress samples the outer ribbon surface without an elapsed-time clock. No duplicate full-size ribbon images or continuous rasterisation loop are introduced.

## Authored identity and decorative vectors

- `components/home/hero/hero-monogram.tsx` contains the hand-authored overlapping T/P SVG outlines, shallow extruded edges, static mineral lighting gradients and highlight paths. Its internal 360 × 550 coordinate system is independent of a font glyph.
- The monogram reuses `/images/stone-720.webp` as a mineral-face texture. That existing photograph is credited to Marina Leonova in [ASSET-SOURCES.md](./ASSET-SOURCES.md), with its original Pexels source retained there. Its mineral type is not inferred from the photograph.
- `components/home/hero/breeze-ribbon.tsx` renders the generated transparent cloth image for the main ribbon. The earlier SVG filament representation was replaced. The broad transition veil and four small leaf outlines remain authored SVG; their fixed geometry does not require a render loop.
- Gradients here represent material shading in bounded decorative SVG surfaces. No animated filter, turbulence shader, canvas, WebGL renderer or particle system is used by these authored assets.
- Decorative layers have `aria-hidden="true"` and do not replace textual brand identity, headings or navigation.

## Fonts

The opening reuses Cormorant Garamond and Manrope, with four missing-language/style subsets downloaded from official Google Fonts endpoints. The existing Latin normal binaries are unchanged. Hero-only aliases prevent the new real italic face from changing typography on other routes. Source URLs, byte counts and actual glyph-coverage findings are recorded in [SPATIAL-HERO-QA.md](./SPATIAL-HERO-QA.md#typography-verification-and-assets). Existing OFL texts remain in `assets/licenses`.

## Updating assets

Keep the live text and links in the components. Replace a PNG source with a clean architectural/material plate, regenerate its WebP widths through the existing Sharp tooling, and update source dimensions, `srcset` descriptors and `data/image-dimensions.json` together. Do not rename a raster screenshot to a background asset if it still contains the reference's text or complete UI. Do not add all breakpoint variants as simultaneous full-resolution DOM layers.

Runtime visual, browser, performance and production-build results belong in the QA record and remain separate from this provenance inventory.
