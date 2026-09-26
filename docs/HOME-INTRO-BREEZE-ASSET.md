# Home intro breeze asset

Generated on 2026-09-26 using the built-in `image_gen.imagegen` tool (no CLI/API fallback). The user reference `image 16.jpg` was inspected for the diagonal ivory fabric direction; the asset is a new independent fabric layer, not a crop of the reference or a complete loader screenshot.

## Files

| File                                   | Dimensions  |     Bytes | Use                                             |
| -------------------------------------- | ----------- | --------: | ----------------------------------------------- |
| `assets/home-intro/intro-breeze.png`   | 1536 × 1024 | 1,781,817 | Selected original, not requested by the browser |
| `public/images/intro-breeze-720.webp`  | 720 × 480   |    39,308 | Mobile responsive source                        |
| `public/images/intro-breeze-1280.webp` | 1280 × 853  |   115,622 | Desktop responsive source                       |

Original generator output: `/Users/lahieuphong/.codex/generated_images/01a0dcb3-bc03-70c0-b771-00e23d7c3f70/exec-462a16e8-5ad2-487d-8d12-ba222100e381.png`.

The PNG has a genuine alpha channel (minimum 0, maximum 254); both WebP outputs retain alpha. The black area in the tool preview is transparent, not a baked background. A flattened inspection on the intended ivory background confirmed a clean isolated fabric silhouette with no text, monogram, architecture, leaves, or baked page composition. The source itself was left unchanged. Only resizing and WebP encoding were applied using the existing Sharp dependency: quality 82, alpha quality 90, effort 6, no enlargement.

The same responsive resource can be reused for rear/main/front layers without separate image requests; use transform, opacity, and a modest crop for layer positioning. Avoid loading the full-size authoring PNG in the page.

## Final prompt

```text
Use case: product-mockup. Asset type: one isolated transparent fabric layer for a refined architectural website opening. Create a photorealistic flowing ivory organza/silk veil, genuinely transparent RGBA background. Broad horizontal ribbon sheet flows diagonally from lower-left edge across the middle to upper-right edge, the long cloth crossing the full composition. Two gentle broad folds, fine soft translucent fibers, realistic light rippling fabric, quiet elegant warm cream palette. Film-like soft natural side light revealing threads and thin semi-transparent edges, not shiny plastic. Wide 1536 by 1024 composition, cloth occupies a broad sweeping diagonal band, airy negative transparent space above and below. Render only the cloth itself, isolated as a compositing cutout. Absolutely no letters, T, P, monogram, logo, text, typography, people, objects, leaves, architecture, wall, ground, floor, shadows on background, color field, grid or checkerboard. Background alpha must be truly transparent. The fabric itself should have partial alpha/translucency so it can overlay an ivory scene with depth.
```
