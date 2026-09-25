# Spatial opening — implementation and QA record

Scope: replace the first Homepage opening only, following the supplied `image 9.jpg` and `image 11.jpg`. The existing sections after the opening, content routes and detail viewers remain outside this change. This record distinguishes checks actually performed from checks still required; a checklist entry is not evidence of a pass.

Asset source paths, measured image dimensions/bytes and generated-versus-authored provenance are tracked in [SPATIAL-HERO-ASSETS.md](./SPATIAL-HERO-ASSETS.md). The original scene PNGs are separate from the runtime responsive WebP derivatives.

## Source audit

- The existing header already exposes `/spaces`, `/projects`, `/collections`, `/worlds`, `/journal` and `/about`, with working search and mobile menu components. Its Homepage-only transparent state needs dark ink over the new pale architecture; shared scrolled and other-route styling should remain intact.
- The four opening portals use existing routes: `/worlds`, `/spaces`, `/products`, `/projects`. `/materials` remains available in navigation and the product/content relationships.
- Existing fonts are Cormorant Garamond (locally named `Cormorant`) and Manrope. Existing source assets contain no TP monogram; `icon.svg` and `favicon.svg` are a small `t.` mark.
- The previous `components/hero` experience is a different, five-part editorial sequence. Its original `check-hero-motion.mjs` assertions about 17 tracks and material apertures do not describe this replacement and must not be reported as validation of the new opening.
- `/about` is an existing normal navigation destination for the studio perspective. The new story must remain accessible without waiting for the automatic scene transition.

## Typography verification and assets

The existing WOFF2 `cmap` tables were inspected using Node's built-in Brotli decompression. Both original Latin subsets lacked Vietnamese characters used by the brief, including `ộ`, `ớ`, `ố`, `Ộ`, `Ấ`, `Ế`, `Ạ`, `Ố`, `ở` and `ề`. Neither existing font binary is italic.

Four same-family subsets were fetched from the official Google Fonts CSS API on 2026-09-23. The current official Latin normal binaries were compared to the existing files: both SHA-256 hashes match exactly, so there is no font-family/version substitution.

| Added local file                                 | Official source                                                                                                                                     |  Bytes |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- | -----: |
| `public/fonts/cormorant-vietnamese.woff2`        | [Cormorant Garamond v21 Vietnamese normal](https://fonts.gstatic.com/s/cormorantgaramond/v21/co3bmX5slCNuHLi8bLeY9MK7whWMhyjYpntKky2F7i6C.woff2)    | 11,264 |
| `public/fonts/cormorant-italic.woff2`            | [Cormorant Garamond v21 Latin italic](https://fonts.gstatic.com/s/cormorantgaramond/v21/co3ZmX5slCNuHLi8bLeY9MK7whWMhyjYrEtImSqn7B6D.woff2)         | 39,304 |
| `public/fonts/cormorant-italic-vietnamese.woff2` | [Cormorant Garamond v21 Vietnamese italic](https://fonts.gstatic.com/s/cormorantgaramond/v21/co3ZmX5slCNuHLi8bLeY9MK7whWMhyjYrEtHmSqn7B6DxjY.woff2) | 11,556 |
| `public/fonts/manrope-vietnamese.woff2`          | [Manrope v20 Vietnamese normal](https://fonts.gstatic.com/s/manrope/v20/xn7gYHE41ni1AdIRggixSvfedN62Zw.woff2)                                       |  8,492 |

The total new font payload is 70,616 bytes before HTTP compression. Unicode ranges keep subset requests demand-driven. Hero-only family aliases allow real italic in this opening without changing the synthetic italic appearance elsewhere. Existing normal Latin files are reused. Existing OFL licence texts remain under `assets/licenses`; official project information is available in the [Google Fonts Cormorant Garamond source](https://github.com/google/fonts/tree/main/ofl/cormorantgaramond) and [Google Fonts Manrope source](https://github.com/google/fonts/tree/main/ofl/manrope).

The combined Latin + Vietnamese `cmap` coverage was checked against the complete proposed Vietnamese manifesto and uppercase footer labels: zero missing characters for Cormorant normal, Cormorant italic and Manrope normal. Both new Cormorant italic files have the actual italic flag in their `head` table. This is a binary coverage check; visual line-height and shaping still require browser inspection.

## Reference composition notes

The supplied references are approximately 4:3, while the required desktop screenshots include 16:10 and 16:9. Preserve their relative visual hierarchy while making a deliberate height-fit adjustment; blindly using cover on the flattened references would crop important content and is not an implementation.

- Scene A: header near the top edge; monogram centred at roughly 51% horizontal and 28% vertical, spanning about 22% of width and 42% of height. English title begins near 19% horizontal / 19% vertical; Vietnamese copy near 66% / 27%. Portals occupy approximately the lower third with aligned titles and small captions.
- Scene B: story columns begin near 20% and 64% horizontal, each about 20–22% wide. Main monogram stays on the central axis. Small editorial copy sits above and below it. The architecture is a frame around readable live text, not a photograph behind unrelated UI.
- Mobile: use live text sized for reading, a separate central monogram/ribbon composition and a 2×2 portal layout. Condense the story with a normal story link rather than compressing two full paragraphs into thin columns. Keep the opening near 100–120svh and allow normal scrolling immediately.

Source-level refinements now present in the implementation: the monogram SVG is widened with `scaleX(1.16)`; the story's upper centre caption has a header-aware top limit; mobile Story keeps explicit three-line headings instead of hiding a `<br>`; the mobile monogram shrinks into the separator below the English introduction; portal captions use 8px and opening controls use 9px on mobile. A generated transparent textile replaces the initial fine-line SVG ribbon, with its full asset provenance recorded separately. These are implementation facts, not a completed screenshot-comparison or responsive acceptance result.

## Required validation matrix

Status at document creation: implementation and runtime QA pending. Replace entries below with observations only after running them.

The local browser helper `/tmp/tanphong-spatial-dom-qa.js` was prepared and syntax-checked for the actual Homepage. It records real DOM bounds at the viewport selected by the QA operator, rather than simulating a media-query width. `capture('discovery')` and `capture('story')` use the actual scene/pause controls; `summary()` reports missing combinations across the twelve viewport sizes below. It checks content/heading clipping, text overflow, header and story collisions, square portal atlas planes, image readiness and canvas/iframe counts. Preparing this helper does not mean those viewport checks have run.

- [x] Production build, TypeScript, lint, route/image crawl and content/asset checks (2026-09-25; details below).
- [ ] One meaningful opening h1; English and Vietnamese copy live in DOM; Vietnamese blocks have `lang="vi"`; decorative monogram, ribbon and leaves are hidden from assistive technology.
- [ ] All four portals, header navigation, menu, search, story access and pause/resume work with mouse, touch and keyboard.
- [ ] No canvas, WebGL context or Three.js import in Homepage opening.
- [ ] Scene loop has continuous ribbon/monogram transitions and stable hit areas during interaction.
- [ ] Intersection/visibility pause and resume; reduced motion shows static discovery with usable links; route unmount cancels animations, observers, listeners and queued work.
- [ ] Breakpoint changes reconfigure one timeline without duplicating effects or losing the phase.
- [ ] 375×812, 390×844, 430×932, 768×1024, 820×1180, 1024×768, 1280×800, 1366×768, 1440×900, 1728×1117, 1920×1080, 2560×1440: no horizontal overflow, readable type, suitable crop, no portal overlap or cut-off.
- [ ] Scene A/B screenshots at 1440×900, 1920×1080 and 390×844; manual reference comparison and at least one refinement pass.
- [ ] Chrome, Safari and Edge checks; explicitly state any unavailable browser rather than implying coverage.

## Automated pre-commit verification — 2026-09-25

- `yarn build` and `yarn build:vercel`: passed.
- `yarn tsc --noEmit` and `yarn lint`: passed. The new DOM QA helper uses `Set.size` directly to satisfy lint.
- `yarn check:hero`: passed, including shared-clock boundaries, image fallback, interaction and visibility pauses, reduced motion, and 30 repeated lifecycle cleanups using browser doubles.
- `yarn check:content`, `yarn check:assets` and `yarn check:worlds`: passed.
- `yarn check:routes http://127.0.0.1:3000` against the local production server: passed for 44 pages, 69 image paths and 8 invalid-route responses. The homepage SSR assertions also verify bilingual copy, one opening h1, portal destinations and the absence of canvas/iframe/old hero markup.
- Formatting checks pass for the changed source, scripts and documentation; `git diff --check` passes. Repository-wide formatting still reports 11 unchanged files in the Worlds area, which are outside this commit.

These automated results do not establish browser rendering, screenshot accuracy, hydration behavior, memory use, GPU use or frame pacing. The corresponding browser checks remain pending.

## Memory, GPU and frame pacing protocol

Runtime measurements pending. Do not treat deterministic lifecycle tests as browser memory measurements.

1. Hard reload Home and let it animate for 60 seconds.
2. Scroll below the opening, wait 30 seconds, return; repeat ten times.
3. Navigate Home → Worlds → Home ten times.
4. Leave Home open for five minutes.
5. Observe available Chrome Task Manager / DevTools memory and performance metrics at consistent checkpoints. Report the actual observation, including whether values level off after initial allocation or form a sustained staircase.
6. Inspect available GPU/layer information. Report WebGL/canvas presence separately from compositing memory. Do not provide an exact VRAM figure if the tool does not expose one.
7. Observe frame pacing during desktop transitions and the simplified mobile mode. Do not label a target of 60fps as a measured result without a trace or counter.

| Check                                | Actual result | Evidence / limitations                                     |
| ------------------------------------ | ------------- | ---------------------------------------------------------- |
| Production build                     | Passed        | `yarn build` and `yarn build:vercel`, 2026-09-25.          |
| Browser console/hydration            | Pending       | —                                                          |
| Responsive and screenshot comparison | Pending       | —                                                          |
| Chrome memory stress                 | Pending       | —                                                          |
| GPU/composited layers                | Pending       | Exact VRAM may not be exposed.                             |
| WebGL contexts / canvas              | Pending       | Source inspection and browser runtime are distinct checks. |
| FPS / frame pacing                   | Pending       | 60fps is the design target, not a measurement.             |
| Chrome / Safari / Edge               | Pending       | Record versions and unavailable surfaces.                  |

## Completion report checklist

The delivery report should identify created/modified files and describe Scene A, Scene B, the animation engine, transitions, major composited layers, responsive variants and reduced-motion behavior. It should separately report actual RAM/GPU observations, the observed maximum WebGL context count, frame-pacing evidence, tested browsers and the production build result. Unavailable exact VRAM data, unavailable browsers, partial stress runs and unresolved console/hydration observations must remain explicit; source inspection alone cannot establish browser-level acceptance.
