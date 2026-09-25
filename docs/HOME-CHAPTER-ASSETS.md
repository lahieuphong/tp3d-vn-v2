# Homepage chapter assets

Generated 2026-09-26 with the built-in `image_gen.imagegen` tool, using user-supplied references as edit targets. No external publishing, API fallback, or stock download was used. References were inspected with `view_image` before editing.

The assets contain **no typography, navigation, labels, UI or breeze ribbon**. All page copy, portals, callouts, and the shared breeze remain live application layers. The material group is one coherent transparent tableau; its objects are not claimed to be independently isolated depth layers.

## Files and responsive delivery

Originals are stored under `assets/home-chapters/*.png` outside the public directory. Browser assets are WebP under `public/images/home-chapters/`. Runtime dimensions and `srcSet` strings are in `data/home-chapter-assets.json`. Original checksums, source paths, exact dimensions, file sizes and alpha counts are in `assets/home-chapters/asset-audit.json`.

| Asset                  | Original dimensions | WebP widths     | Full WebP bytes | 720px bytes |
| ---------------------- | ------------------- | --------------- | --------------: | ----------: |
| worlds-architecture    | 1586 × 992          | 720, 1280, 1586 |          165568 |       46012 |
| spaces-architecture    | 1586 × 992          | 720, 1280, 1586 |          143512 |       35434 |
| materials-architecture | 1586 × 992          | 720, 1280, 1586 |          176554 |       43636 |
| material-tableau       | 1254 × 1254         | 720, 1254       |          371294 |      141844 |

The tableau is not enlarged to 1280px and does not have a duplicate 1280px alias. No image is 4096px or larger. No PNG original is shipped from public. Full-size WebP total: 856928 bytes. 720px WebP total: 266926 bytes.

WebP conversion: Sharp `resize({ width, withoutEnlargement: true })`, quality 85 for architecture, quality 90 and alphaQuality 100 for the tableau, effort 6. No image content was redrawn or edited during conversion. Original PNGs are byte-identical copies of built-in generated outputs.

Alpha validation on the original tableau: 766052 fully transparent pixels, 806095 partially transparent pixels, 369 fully opaque pixels, total 1572516. Most visible object interiors have alpha 240–253 (739040 pixels); the output preserves the generator's alpha rather than baking a matte behind it. Delicate edge/contact shadows remain semi-transparent. Background removal was performed by image generation, not heuristic chroma keying.

## Exact prompts and provenance

Built-in output directory: `/Users/lahieuphong/.codex/generated_images/01a0d98d-8972-77d0-a3d6-0463a268dd16/`.

### worlds-architecture

Reference edit target: `/Users/lahieuphong/Downloads/image 12.jpg`.

Generated source: `exec-dee6e0ce-de39-4bc5-b93e-bb5808afcde2.png`.

Final original: `assets/home-chapters/worlds-architecture.png`.

```text
Use case: precise-object-edit.
Asset type: production architectural background plate for a luxury interior website, with live HTML layered later.
Input image: image 12.jpg is the architectural edit target.
Primary request: preserve the extraordinarily deep receding central arches, the warm brown plaster side walls, the distant ivory lounge and mountain lake vista, the olive trees at extreme edges, the low natural stones, and the reflective travertine floor. Remove ALL typography, logo, navigation, menu items, numbering, circles, arrows, labels, leader rules, footer, and the entire translucent flowing fabric ribbon. Reconstruct clean real plaster/architecture in every removed area. The result must be only an immaculate cinematic architectural photograph, not a screenshot or UI.
Composition: landscape 16:10 plate. Central arch corridor stays centered at x 55%, taking roughly 43% of total width; generous quiet dark bronze plaster wall on left 30% for future live heading, quiet dark wall on right 20% for future selector. Keep the immediate foreground gently dark; keep deep sunlit portal and material detail sharp. Avoid overly black shadows, preserve stone color.
Lighting: golden late-afternoon directional sunlight through the arches, warm olive and bronze umber, ivory reflections. Photorealistic European architectural editorial photography.
Constraints: no letters, no words, no logos, no numbers, no ribbon or cloth, no overlays, no frames, no mockup, no watermarks. No new decorative objects. Architecture fills every edge. Keep a single continuous plausible architectural scene.
```

### spaces-architecture

Reference edit target: `/Users/lahieuphong/Downloads/image 13.jpg`.

Generated source: `exec-955cae91-5565-49aa-85a1-13843b4897cf.png`.

Final original: `assets/home-chapters/spaces-architecture.png`.

```text
Use case: precise-object-edit.
Asset type: minimalist architectural background plate for live HTML portals on an interior design website.
Input image: image 13.jpg is the edit target; its warm light/plaster/edge foliage is the reference.
Primary request: remove ALL typography, navigation, logos, numbered labels, arrows, rules, footer, the entire flowing fabric/ribbon and leaves floating in the air, and all four interior arch window photographs. Replace the four windows with an uninterrupted continuous matte warm ivory plaster wall that extends into a pale stone floor at the bottom. Keep the quiet tonal variation, minute mineral plaster texture, filtered golden leaf shadows and narrow bits of olive foliage at extreme left/right edges. This will be used behind separate real arch-shaped HTML image links and real HTML headings, so the entire middle 90% must be a restrained light ivory wall with excellent negative space, no baked-in architectural openings and no big objects.
Composition: 16:10 landscape. Ivory wall fills top 86%, pale travertine floor at bottom 14%; nearly seamless wall-floor junction. Keep extreme edge foliage and a little small stone at far lower-right, but no repeated arches, no furniture, no materials display.
Lighting: Mediterranean late-afternoon soft light, warm bone/cream/sand, very subtle tree shadows, not overexposed white. Photorealistic detailed limestone/plaster finish, European architectural editorial mood.
Constraints: absolutely no text, logos, words, letters, numbers, UI, ribbon, cloth, portals, frames, watermark. This is an empty architectural plate, not a webpage.
```

### materials-architecture

Reference edit target: `/Users/lahieuphong/Downloads/image 14.jpg`.

Generated source: `exec-39ba502f-b9e4-4787-87b6-88cb6777627f.png`.

Final original: `assets/home-chapters/materials-architecture.png`.

```text
Use case: precise-object-edit.
Asset type: architectural background plate for a luxury material editorial scene; separate live text and transparent material objects will be composited on it later.
Input image: image 14.jpg is the edit target.
Primary request: preserve the warm ivory limestone architecture: a narrow tall open arch at far left with olive tree and mountain lake beyond, a broad flat matte central wall, warm right arch/rounded column and ascending stair at far right, reflective pale stone floor, and filtered afternoon shadows. Remove ALL material display objects (all slabs, walnut boards, stone blocks, rocks, ceramic vase, bowls, folded/draped textiles, metal sphere, vases, plinths and branches from them). Remove ALL typography, logo, nav, labels, rules, numbers, leader lines and footer. Remove entire flowing translucent ribbon and floating leaves. Reconstruct a clean empty warm ivory architectural interior in their place.
Composition: landscape 16:10. Quiet blank ivory wall from x18% through x77% across upper75%, floor bottom25%. Architectural openings and olive plants remain only near edges. Lots of central quiet space for independent material composition. Keep realistic left golden sunlight and right soft shadow.
Style: photorealistic quiet-luxury European architectural editorial photography, warm bone plaster/travertine, no stark white, no contrasty technology effect.
Constraints: no objects in central area, no text at all, no ribbon or fabric, no UI, no logo, no border, no watermark. One continuous environment, no collage.
```

### material-tableau

Reference edit target: `/Users/lahieuphong/Downloads/image 14.jpg`.

Generated source: `exec-4863baf3-a28c-4e99-b2a9-2d3f4173f155.png`.

Final original: `assets/home-chapters/material-tableau.png`.

```text
Use case: background-extraction.
Asset type: transparent PNG photographic material tableau to composite over a live architectural website background.
Input image: image 14.jpg is the source of the MATERIAL OBJECT GROUP ONLY.
Primary request: isolate and recreate ONLY the beautiful central arrangement of natural materials and objects on a genuinely TRANSPARENT background with actual alpha channel. Keep tall warm walnut board in rear center, two tall vein-cut travertine/limestone slabs overlapping to its left, folded beige chunky textile sample over a shorter ribbed board at right, large warm white ceramic rounded vase front-left, one low irregular foreground limestone rock far left, low limestone platform blocks, small stone bowl at front center, small rough stone block, one small muted brushed-brass cylinder, dark bronze round vessel/sphere at front-right with a thin sparse warm olive twig, and short draped linen falling toward front. The arrangement must read as one coherent sculptural material still life, directly closely matching the source object's geometry and quality.
Composition: roughly square 1:1 isolated tableau, all objects fully visible, no cropping, 4% transparent padding around the full silhouette. Rear slabs form the tallest center; foreground stones/vessels make an organic wide base. Eye-level slightly downward editorial product view, perspective and light matching source. Golden diffused upper-left sunlight, tactile detailed real stone grain, natural walnut, linen, ceramic and burnished metal. Shadows are delicate partially transparent contact shadows beneath objects only.
Remove absolutely all architecture, floor surface, sky, trees/background plants, entire ribbon, all text, leader lines, callouts, words on vessels, UI, logos and labels. Do not show a studio backdrop, white background, beige background or checkerboard pattern. Outside the object silhouettes and soft contact shadows must be fully transparent alpha. Do not add a solid rectangle behind the group. No floating decorative ribbons, no unrelated leaves. Preserve believable grounded still-life composition.
```

## Transparency QA and discarded iteration

The native transparent-image preview displayed apparent red/yellow fringes and white blocks. Pixel inspection found that the original's 826 saturated red pixels had alpha at most 2/255 (mean 1.0024/255), so their unassociated RGB values do not represent visible opaque fringes. Both the original PNG and delivered WebP were composited over ivory `#ede3d4` **for QA only** and visually inspected; object edges are clean in the actual composition. Review images are saved in `outputs/home-chapters/`; neither preview is shipped from `public`.

One targeted built-in edit was evaluated for matte cleanup, source `exec-66af2dc1-9b2a-42b1-a6ba-51c0d7e3edd4.png` in the same generated-image directory. It was discarded because the original preserved better stone detail and contact shadows, and the opaque-background inspection showed the original had no visible colored fringe. No algorithmic alpha removal, chroma keying or painted matte was applied to the final PNG/WebP.

Exact discarded-iteration prompt:

```text
Use case: precise-object-edit.
Asset type: final production transparent PNG material still-life cutout.
Input image is the edit target; keep its exact material tableau composition, shapes, object positions, lighting, textures, scale and square artboard.
Change ONLY silhouette matte and edge contamination. Remove every unnatural red/yellow fringe, white halo, square white matte block and ragged cutout artifact around the walnut top/right edge, limestone slab tops, ceramic vase, branches, foreground stones and cloth. Restore clean photorealistic object-colored anti-aliased edges. Genuine transparency must be preserved outside every silhouette. Do NOT replace transparency with white, black, beige, checkerboard or any painted background. The object interiors should be fully opaque; only tiny natural anti-aliasing and delicate contact shadows are partly transparent. Keep the transparent padding and shape. Do not redraw or rearrange the objects; do not add anything, remove objects, crop, add text, labels, floors, environment or ribbon.
This asset will be composited on a warm ivory architectural background, so all edge pixels must be natural stone/walnut/linen/bronze colors with clean alpha and no neon or white matte contamination.
```
