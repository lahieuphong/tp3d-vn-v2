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

The raster ribbon remains available, but the unified HomeStory renderer audited on 2026-10-01 uses `ContinuousBreeze`, `breeze-geometry.ts` and `breeze-renderer.ts`. One SVG cloth definition contains its silhouette, folds and threads. Two complementary projections place parts of that same cloth behind and in front of the shared TP; mobile paints only the front projection. Geometry and pose derive from the master native-scroll progress, with no independent animation clock or per-frame DOM creation. These projections are not separately authored front/rear fabric assets. The earlier `BreezeRibbon` raster component is no longer the live renderer.

## Authored identity and decorative vectors

- `components/home/experience/shared-tp.tsx` contains the hand-authored overlapping T/P SVG outlines, shallow extruded edges, static mineral lighting gradients and highlight paths. Its internal 360 × 550 coordinate system is independent of a font glyph. PASS 2 moved this existing component from `hero/hero-monogram.tsx` to the shared HomeStory stage; the SVG material and paths are preserved.
- The monogram reuses `/images/stone-720.webp` as a mineral-face texture. That existing photograph is credited to Marina Leonova in [ASSET-SOURCES.md](./ASSET-SOURCES.md), with its original Pexels source retained there. Its mineral type is not inferred from the photograph.
- `components/home/experience/continuous-breeze.tsx` renders the shared SVG cloth described above. The four small `HeroLeaves` outlines are also authored SVG; they are decorative leaves, not a separated layer of the Atrium's central tree.
- Gradients here represent material shading in bounded decorative SVG surfaces. No animated filter, turbulence shader, canvas, WebGL renderer or particle system is used by these authored assets.
- Decorative layers have `aria-hidden="true"` and do not replace textual brand identity, headings or navigation.

## Fonts

The opening reuses Cormorant Garamond and Manrope, with four missing-language/style subsets downloaded from official Google Fonts endpoints. The existing Latin normal binaries are unchanged. Hero-only aliases prevent the new real italic face from changing typography on other routes. Source URLs, byte counts and actual glyph-coverage findings are recorded in [SPATIAL-HERO-QA.md](./SPATIAL-HERO-QA.md#typography-verification-and-assets). Existing OFL texts remain in `assets/licenses`.

## Updating assets

Keep the live text and links in the components. Replace a PNG source with a clean architectural/material plate, regenerate its WebP widths through the existing Sharp tooling, and update source dimensions, `srcset` descriptors and `data/image-dimensions.json` together. Do not rename a raster screenshot to a background asset if it still contains the reference's text or complete UI. Do not add all breakpoint variants as simultaneous full-resolution DOM layers.

Runtime visual, browser, performance and production-build results belong in the QA record and remain separate from this provenance inventory.

## Scene 2 → Scene 3 layer audit — 2026-10-01

The approved Scene 3 is **one opaque photographic plate**, not a layered scene.
`WorldsChapter` renders `ChapterImage asset="worlds-atrium"`; the sky, foliage,
oculus, ceiling, tree, architecture, room openings, floor and reflections are all
baked into that image. The archived `worlds-architecture` corridor is a different
composition and cannot serve as a depth layer for the approved Atrium.

| Requested layer                  | Available source                                                                                                  |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Scene 2 background               | Opaque `assets/spatial-hero/architecture-b.png`, 1586 × 992; 720/1280/native WebP exports                         |
| Transparent TP                   | Existing `SharedTP` inline SVG, 360 × 550 viewBox, with transparent surrounding area and the reused stone texture |
| Breeze rear/front                | Complementary projections of one live SVG cloth; no separately authored front/rear assets                         |
| Photographic fabric alternatives | Alpha `assets/spatial-hero/breeze-ribbon.png`, 1448 × 1086, and `assets/home-intro/intro-breeze.png`, 1536 × 1024 |
| Atrium background                | Opaque `assets/home-chapters/worlds-atrium.png`, 1672 × 941                                                       |
| Separate sky/foliage             | Unavailable                                                                                                       |
| Separate oculus/rim              | Unavailable                                                                                                       |
| Separate central tree            | Unavailable                                                                                                       |
| Separate floor/reflection        | Unavailable                                                                                                       |
| Depth map                        | Unavailable                                                                                                       |

Direct Sharp metadata inspection confirmed genuine alpha on both fabric sources
and their WebP exports. Architecture and Atrium plates are opaque. The intro
fabric exports are 1280 × 853 (115,622 bytes) and 720 × 480 (39,308 bytes); see
[intro fabric provenance](HOME-INTRO-BREEZE-ASSET.md). No new artwork or image
enlargement was produced for this audit.

The Atrium's existing optimized exports are:

| File under `public/images/home-chapters/` | Dimensions |   Bytes |
| ----------------------------------------- | ---------- | ------: |
| `worlds-atrium.webp`                      | 1672 × 941 | 252,504 |
| `worlds-atrium-1280.webp`                 | 1280 × 720 | 168,876 |
| `worlds-atrium-720.webp`                  | 720 × 405  |  67,048 |
| `worlds-atrium-preview.webp`              | 320 × 320  |  25,964 |
| `worlds-atrium-preview-160.webp`          | 160 × 160  |   8,008 |

### Close-up resolution limit

Historical camera audit for future motion work: PASS 1 removes all camera
cropping and sky transitions; the following is not active runtime behavior.

The sky opening contains only about 200 native vertical pixels. The audit
baseline's approximately 5× camera pose samples about 301 × 188 source pixels
for a 1440 × 900 viewport, or 335 × 188 for a 1920 × 1080 viewport. That is
approximately 4.78× or 5.74× enlargement before device pixel ratio. The mobile
720px export contains proportionally less sky detail. These are calculations
from the source dimensions and framing, not browser performance measurements.

Even the final full-width Atrium plate enlarges about 1.53× at 2560px viewport
width. A crop or a larger output file cannot restore missing source detail.
Use a restrained single-plate 2.5D fallback and disclose this limitation; do not
claim independent tree, foliage or reflection parallax. A matching high-resolution
sky/foliage plate and authored oculus/architecture separation would improve the
camera passage. A matching higher-resolution Atrium would also improve the
final large-desktop frame.

Asset dimensions and compressed byte counts above do not establish actual
browser RAM, GPU memory or frame performance. Those require runtime profiling.
