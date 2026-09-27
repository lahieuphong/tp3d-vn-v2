# Homepage Worlds — circular atrium

Original scope: replace only the Home Worlds chapter. The previous client-side
WorldSelector and its responsive sidebar styles were removed. A subsequent
[Homepage cleanup](HOME-SECTION-CLEANUP.md) removes the Spaces and Materials Home
chapters; Worlds now connects directly to the footer. That report contains the
current browser verification and supersedes the historical QA limitation below.

## Composition and routing

- Full-bleed, one-viewport desktop architectural frame, live serif copy at the
  lower left, four native room links registered to the image's cover coordinates.
- Narrow layouts use the same central atrium crop and a two-column link group.
- Living, Bedroom, Kitchen resolve from the Spaces catalogue. Bathroom resolves
  to `/worlds/modern-bathroom`; there is no published `/spaces/bathroom` entry.
- One circular preview and the main CTA link to `/worlds`.
- The existing header theme remains ivory in this chapter. Its threshold is
  capped to the header height for the new opaque frame on tall desktops.
- The existing document-space ContinuousBreeze remains the only ribbon. No new
  animation loop, canvas, WebGL, viewer import or room-model preload was added.
- Worlds now has no outgoing chapter margin: its complete frame ends directly
  at the footer, with the shared Breeze fading out at the Home boundary.

## Asset provenance

Built-in `image_gen.imagegen` edit, using the user's latest inline circular-atrium
reference (2026-09-27). The reference's architecture, furniture, skylight, central
tree and reflections are retained; the baked text, navigation and ribbon were
removed for live application layers. No stock photo or API/CLI fallback.

Original: `assets/home-chapters/worlds-atrium.png` (1672 × 941). Browser variants:

| WebP width |   Bytes |
| ---------- | ------: |
| 720        |  67,048 |
| 1280       | 168,876 |
| 1672       | 252,504 |

The 160/320px circular-preview sources are small square crops of the same plate.
Sharp was used only for responsive resizing, thumbnail cropping and WebP encoding.
No artificial upscaling. At 2560px the native 1672px image necessarily scales up.
All sources are lazy/low-priority and selected by `srcSet`; no architecture preload.
The former corridor asset remains archived but has no runtime Home reference.

Generated source:
`/Users/lahieuphong/.codex/generated_images/01a09488-0cc1-7a60-8932-b3e44fe8fa8c/exec-02ed2ab3-206f-481f-8ca3-90523ee30c8b.png`.

Exact built-in edit prompt:

```text
Use case: precise-object-edit. Edit target: the most recent user reference image showing a circular architectural atrium and four room openings. Asset type: clean full-bleed architectural background plate for a live website. Preserve the reference architecture and exact wide composition: huge circular skylight at top center, warm walnut ring, beige stone columns, Living opening on far left, Bedroom middle-left, Bathroom middle-right, Kitchen far right, central tree and stone feature with low circular island and reflecting pool, warm sunlight and reflective floor. REMOVE ALL typography, logo, navigation, numbers, room labels, headings, body copy, CTA, circular thumbnail, bottom captions and graphic lines. REMOVE the translucent fabric/Breeze ribbon completely (the website adds a single live ribbon separately). Seamlessly reconstruct the real architecture/floor behind removed UI. No text, no letters, no symbols, no watermark, no ribbon. Preserve the architecture, tree, furniture, lighting, framing and perspective faithfully. Do not zoom or crop, keep all four side rooms and entire skylight opening visible. Deliver high detail photorealistic clean architectural plate in 16:9 landscape, ideally 2560x1440 or higher.
```

## Validation

- `yarn exec tsc --noEmit`: passed.
- `yarn lint`: passed.
- `yarn build`: passed (production vinext/Cloudflare output).
- `yarn check:home`: chapter lifecycle, header thresholds and continuous Breeze
  geometry checks passed. These are programmatic checks, not browser screenshots.
- `yarn check:content`: passed.
- `yarn check:routes http://127.0.0.1:4492`: 44 pages and 82 image references passed;
  eight deliberately missing routes returned the expected 404 responses.
- The built source contains no previous Worlds sidebar/background reference.
- Refinement pass: removed the incoming image mask for a complete skylight frame,
  tuned photographic exposure behind ivory text, kept CTA clear of the following
  chapter, and corrected the ivory-header threshold on tall desktop screens.

Browser QA remains pending: the scoped CUA tab connection failed to start. No
1440×900 or 1920×1080 browser screenshots, actual responsive-layout pass, or browser
console/hydration pass is claimed. A user-operated local-only QA page is available
at `http://127.0.0.1:4493/__worldsqa`; it records geometry, hit targets, image loading,
header theme, console errors and overflow for all 12 requested viewport sizes.
Its runner and results stay in ignored `work/atrium-qa/`, outside production.
