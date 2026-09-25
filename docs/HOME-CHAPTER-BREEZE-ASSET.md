# Continuous journey ribbon asset

Created 2026-09-26 with one built-in `image_gen.imagegen` call as an optional photographic enhancement to the Scene 3–5 breeze connector. The original references were already visually inspected. No API fallback or external publication was used.

The image is **one continuous translucent textile path**, not three restarted copies. It has no text, architecture, leaves or UI. The native output is 724 × 2172 (1:3), below the 1400 × 2800 texture cap. It was not enlarged to create a misleading 1280px source.

- Original PNG: `assets/home-chapters/journey-ribbon.png` (1109119 bytes).
- Full WebP: `public/images/home-chapters/journey-ribbon.webp` (724 × 2172, 227242 bytes).
- 720px WebP: `public/images/home-chapters/journey-ribbon-720.webp` (720 × 2160, 229710 bytes).
- Provenance/checksum/alpha/export metadata: `assets/home-chapters/journey-ribbon-audit.json`.
- QA composite over dark bronze: `outputs/home-chapters/journey-ribbon-dark-qa.jpg`.
- QA composite over ivory: `outputs/home-chapters/journey-ribbon-ivory-qa.jpg`.

This addition did not modify `data/home-chapter-assets.json`; the implementing agent can select the candidate after visual review. Both QA composites were inspected: natural translucent fibres and clean edges, with no visible colored matte contamination. Preview flattening is for inspection only; all delivered PNG/WebP files preserve alpha.

Original alpha counts: 1107988 fully transparent, 464187 partially transparent, 353 opaque pixels (1572528 total). Conversion uses Sharp with width-only resizing, without enlargement, WebP quality 88, alphaQuality 100, effort 6.

Source output: `/Users/lahieuphong/.codex/generated_images/01a0d98d-8972-77d0-a3d6-0463a268dd16/exec-68e896dd-6642-4eb2-9df8-207ec27f0e62.png`.

Reference images: `/Users/lahieuphong/Downloads/image 12.jpg`, `image 13.jpg`, and `image 14.jpg`. The tool used them only as textile appearance references.

## Exact prompt

```text
Use case: background-extraction / stylized-concept.
Asset type: one long transparent textile ribbon for a cinematic architectural scroll website. Output portrait 1:3 aspect ratio, approximately 1024 by 3072 pixels.
Input images: image 12.jpg, image 13.jpg and image 14.jpg are references ONLY for the ivory translucent gossamer textile material, its natural folds and quality. Ignore all their architecture, objects and UI.
Primary request: create ONE graceful continuous long ivory gossamer cloth ribbon travelling down the entire vertical artboard on a genuinely transparent background with alpha. It is one connected sculptural ribbon, not multiple stacked separate ribbons. Natural silk/linen fibres are finely visible; light shines through the nearly transparent fabric; edges are soft and irregular like fine woven gauze. Subtle warm cream highlights, sandy translucent folds, realistic satin-free dry fibres, quiet luxury and airy movement. No hard outlined vector strokes.
Path composition: at the top edge the cloth enters around x75%. In the upper fifth it sweeps left toward x35%, softly rolls over and broadens into a horizontal sweeping fold toward x90% near the first third. It curls gently back toward center around midheight, then follows one long diagonal down toward the right, ending just beyond the bottom-right corner around x95%. The entire path is a gentle elongated flowing S, with an open airy center and smooth connected folds. Maximum cloth-band width about 20–30% of artboard width; surrounding open negative space must remain transparent. Maintain visible continuity along its entire length. Frame the full ribbon with no accidental pieces cut off other than deliberate top/bottom exits.
Lighting: warm soft architectural daylight from upper-left, tactile translucent fibres and organic volume; detailed photorealistic textile.
Constraints: transparent background with genuine alpha, no painted solid white/beige/black, no checkerboard pattern, no architecture, floor, furniture, objects, leaves, letters, logo, typography, UI, shadows detached from the cloth, repeated motifs or extra ribbons. No neon, no glow, no futuristic effect. The cloth itself is semi-transparent; outside it is completely transparent.
```
