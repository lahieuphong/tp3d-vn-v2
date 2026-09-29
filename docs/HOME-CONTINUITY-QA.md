> Historical implementation record. Current transition: [StoryWorldBridge](HOME-STORY-WORLD-BRIDGE.md).

# Homepage visual continuity — 27 September 2026

Scope: existing Scene 1–5, visual ownership, stacking, clipping, responsive composition and transitions. Copy, font families, content, routes and scene photography are preserved. No deployment was performed.

## Cause and correction

The opening owned `BreezeRibbon` and `BreezeVeil` inside a clipped, isolated sticky stage. `HomeChapters` owned a separate `BreezeConnector`, with its own isolation, top mask and clipping. Both cloth images used `object-fit: fill`, stretching their intrinsic proportions to unrelated viewport/document heights.

`HomeExperience` now owns one `ContinuousBreeze`. Its single `#cb-cloth` definition supplies two depth projections with complementary masks. No scene mounts a cloth component. The former opening ribbon, veil and lower-page connector are removed; the independent initial loading presentation is retained.

`breezeGeometry(width, height)` creates connected cubic contours in actual document pixels. Cloth thickness is measured across the path normal and capped at 330px; increasing page height does not stretch its thickness. The desktop path travels diagonally, tablet uses a gentler S, and mobile uses a narrower vertical/diagonal route. There are no section-local segment joins, raster cloth requests, huge PNGs or SVG filters.

`breezePose` samples overall Home progress through the existing event-batched chapter controller. Both projections receive exactly the same bounded transform. Geometry is recalculated on layout/orientation changes. Scroll does not read layout, update React state, run an idle loop or reset a chapter-local animation. Reduced motion keeps a static continuous cloth.

## Layout and depth

- Full-bleed root: relative, width 100%, no max width, `overflow-x: clip`, warm ivory base.
- Scene roots remain unclipped and do not create separate isolation/transform contexts. Only local image/arch windows clip their own media.
- Opening uses three overlapping sticky grid planes: background 0, objects 3, content 5. All three have the same containing block and leave together.
- Shared cloth back 2 / front 4; chapter foreground 3; copy and navigation 5; header remains above the experience.
- The departing Worlds daylight insert is background depth 0 so it cannot cover the incoming Spaces background fade.
- Scene 2→3 overlap: 16svh. Scene 3→4 and 4→5: 14svh. Only architecture backgrounds receive the edge fade; shared cloth is never masked at a section boundary.
- Desktop >=1200, tablet 768–1199, mobile <768. Mobile Worlds has a dedicated lower architectural window instead of covering a tall text section with a narrow crop of a landscape plate. Architecture uses cover; subjects and captions remain HTML.
- Reduced-motion Story no longer has an opaque content-plane background covering the cloth. Header sampling accounts for overlapping backgrounds in both motion modes.

## Browser checks

Final production build served at `http://127.0.0.1:4483`. Every row below had `scrollWidth === clientWidth`, every scene width equal to the viewport, and the expected responsive cloth family. Geometry updates were checked in the browser, not only in mathematical tests.

| Viewport  | Family  | Overflow | Scene full width |
| --------- | ------- | -------: | ---------------- |
| 320×568   | mobile  |      0px | yes              |
| 360×800   | mobile  |      0px | yes              |
| 375×812   | mobile  |      0px | yes              |
| 390×844   | mobile  |      0px | yes              |
| 430×932   | mobile  |      0px | yes              |
| 768×1024  | tablet  |      0px | yes              |
| 820×1180  | tablet  |      0px | yes              |
| 1024×768  | tablet  |      0px | yes              |
| 1280×800  | desktop |      0px | yes              |
| 1366×768  | desktop |      0px | yes              |
| 1440×900  | desktop |      0px | yes              |
| 1728×1117 | desktop |      0px | yes              |
| 1920×1080 | desktop |      0px | yes              |
| 2560×1440 | desktop |      0px | yes              |

Additional orientation sequence 844×390 → 1180×820 → 390×844: correct family/viewBox recalculation, no horizontal overflow. Visual inspection covered the opening, story and chapter transitions at desktop, narrow mobile and tablet. Desktop forward/reverse scroll was recorded; mobile forward/reverse was also exercised. The same cloth continues through the transitions, with no per-scene restart. Menu opened, Escape closed it and restored body scrolling.

Desktop measured overlaps at 1440×900: 144px / 126px / 126px. Mobile at 390×844: 135.04px / 118.16px / 118.15px.

Production first-entry intro completed, removed its overlay and revealed Home. Exactly one shared cloth owner, two projections, zero legacy ribbon nodes, zero canvas elements, and zero temporary QA panels. Captured browser warning/error logs were empty, including the production hydration pass.

## Memory and compositing: measured limits

The optional localhost harness measured `performance.memory.usedJSHeapSize` around one forward/reverse cycle:

| Local dev run               |    Before |     After |
| --------------------------- | --------: | --------: |
| 1440×900, recording enabled | 59.21 MiB | 59.49 MiB |
| 390×844                     | 61.12 MiB | 60.59 MiB |

These are Chromium JavaScript heap samples, **not total tab/process RAM, decoded image memory, GPU memory or VRAM**. Dev/HMR, recording and garbage collection affect them. The short runs do not show monotonically increasing heap, but do not establish a long-session memory guarantee.

There is no canvas/WebGL, no CSS transform/opacity animation on the full-document cloth parent, and no persistent `will-change` promotion. SVG masks may still require browser raster/compositing surfaces. GPU/VRAM allocation and frame-rate were not measured directly; no claim that GPU memory decreased or reached a measured plateau is made.

## Validation

Passed:

- `yarn lint`
- `yarn tsc --noEmit`
- `yarn check:intro`
- `yarn check:hero`
- `yarn check:home` (includes the new continuous cloth geometry/reversibility checks)
- `yarn build`
- `yarn check:routes http://127.0.0.1:4483`: 44 content routes, 80 referenced images, 8 invalid-route/404 checks.
- `git diff --check`

The continuity tests cover connected paths, finite coordinates, bounded physical thickness, all 14 sizes, orientation, scroll reversibility and reduced motion. Existing lifecycle tests cover observer/listener/frame cleanup and cached-layout reads.

Pre-commit verification on 27 September also passed `yarn check:content`, `yarn check:assets`, `yarn check:worlds` and `yarn build:vercel`. The production crawl was repeated on port 4484 with the same 44-page, 80-image and 8-invalid-route results, then that verification server was stopped. Changed-file formatting passes; repository-wide formatting still flags 11 unchanged Worlds files outside this change. No browser profiling was repeated during this pre-commit pass.

Vinext emits its existing informational route-classification notice; build succeeds. No dependency or second scroll engine was added.

## Files and QA artifacts

Core: `home-experience.tsx/.css`, `continuous-breeze.tsx`, `breeze-geometry.ts`, `breeze-renderer.ts`, `chapter-motion.ts`, `home-chapters.tsx/.css`, `spatial-hero.tsx/.css`, `hero-timeline.ts`, `home-hero.tsx`, `app/page.tsx`.

Removal/split: `breeze-ribbon.tsx` → `hero-leaves.tsx`; `breeze-connector.tsx` → `chapter-colophon.tsx`. Chapter imports updated; no content changes. Preloader and regression checks updated to remove the old cloth image from essential loading (5 resources: architecture, portal atlas, 3 fonts).

Local artifacts (ignored `outputs/` directory):

- `outputs/continuity-qa/continuity-scroll-desktop.webm`
- `outputs/continuity-qa/scroll-contact-sheet.jpg`

The recording documents the integrated desktop scroll pass. Subsequent refinements synchronized the sticky grid planes and lowered the departing daylight insert; the final production DOM/console matrix was rerun afterward. Browser capture included unused viewport-emulation space to the right; the delivered video crops that browser margin and uses the common 772px recorded height without rescaling the interior.

`scripts/continuity-qa-harness.tsx` is an optional localhost-only QA utility, not imported by production. Temporarily import it into HomeExperience and open `?continuityQa=1` to reproduce reports/scroll recording, then remove that import. Its recording control asks the browser to capture only the chosen localhost tab and stops media tracks on completion/cancel/unmount.
