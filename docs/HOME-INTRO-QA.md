# Homepage art-directed loader — implementation and QA

Revision: 27 September 2026. The supplied `image 16.jpg` is the visual target. This revision replaces the minimal TP-only composition while retaining the document-lifetime reload fix. Scope is the loader and its handoff. No Scene 1–5 component, route, content, geometry or scroll controller has been redesigned. No deployment was performed.

## Composition and files

The loader is a fixed, full-viewport composition of real layers: warm ivory light/plaster background, presentational brand/navigation/search/edition header, pale stone T and walnut P, rear/front transparent silk, serif tagline, resource progress, and bottom branding. The reference image is not used as a flattened page background.

| File                                                           | Responsibility                                                                         |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `components/home/intro/home-intro-loader.tsx`                  | Layer composition; controller-owning child and all visual layers unmount on completion |
| `components/home/intro/intro-header.tsx`                       | Decorative, inert header using the existing navigation data; mobile mini-header        |
| `components/home/intro/intro-monogram.tsx`                     | Existing brand outlines with stone/walnut material patterns and restrained depth       |
| `components/home/intro/intro-breeze.tsx`                       | Two projections of one responsive alpha asset, with vector failure fallback            |
| `components/home/intro/intro-progress.tsx`                     | Loading copy, accessible status and genuine resource completion                        |
| `components/home/intro/home-intro.css`                         | Responsive composition, staged arrival, light pointer depth and handoff                |
| `components/home/intro/intro-controller.ts`                    | Resource/visual readiness, finite deadlines, interaction locks and cleanup             |
| `public/images/intro-walnut-360.webp`                          | 40,698-byte resize of the existing local wood texture                                  |
| `scripts/check-intro-controller.mjs`, `scripts/check-site.mjs` | Motion/lifecycle and updated SSR composition regressions                               |

`intro-runtime.ts`, the head bootstrap in `app/layout.tsx`, and the critical-resource observer are retained. The original SVG/alpha asset provenance is documented in [HOME-INTRO-BREEZE-ASSET.md](HOME-INTRO-BREEZE-ASSET.md). No font, dependency, video, WebGL, Three.js, canvas or Sketchfab viewer was added.

The loader header has no links/buttons and is hidden from assistive navigation. The actual SiteHeader remains inert and invisible underneath, then takes over during the last portion of the reveal. Both visual and input locks are removed after completion. The duplicated decorative header is part of the unmounted loader.

## Sequence

| Item               | Configuration                                                                  |
| ------------------ | ------------------------------------------------------------------------------ |
| TP arrival         | 80ms delay; 600ms opacity and scale .97 → 1                                    |
| TP rise            | 600ms delay; 800ms transform, scale 1 → .955                                   |
| Final TP center    | 43.5svh desktop/tablet; 37svh mobile, from 50svh initially                     |
| Tagline            | 880ms delay; 550ms fade and 12px rise, using existing regular/italic Cormorant |
| Loading copy       | 1120ms delay; 350ms fade                                                       |
| Progress track     | 1230ms delay; 350ms fade                                                       |
| Progress fill      | 1310ms delay; 250ms appearance, real fraction via scaleX                       |
| Breeze             | One 7-second drift, -1.5% → +1.5%, 4px → -2px, scale 1 → 1.012; no reset loop  |
| Minimum            | 1800ms from controller mount, plus completion of the visible entry sequence    |
| Ready hold         | 150ms; omitted on resource timeout/reduced motion                              |
| Resource deadline  | 4000ms, then proceed on fallbacks                                              |
| Visual-event guard | 4000ms maximum before allowing reveal if animation-end never arrives           |
| Reveal             | 1000ms desktop/tablet; 900ms mobile                                            |
| Reduced motion     | Full composition, static upper TP and fabric, 300ms opacity-only exit          |

The controller observes the final progress-track entrance event as well as resource readiness. This prevents a fast network from cutting off CSS entry animations that began later than hydration. The finite visual-event guard prevents a missing event from trapping the user. Fast normal entries take approximately 2950ms desktop or 2850ms mobile including the reveal; reduced motion approximately 2100ms. The asset deadline excludes the reveal itself.

Fine desktop pointer input is normalized and clamped: background ±1px, TP ±2px, fabric ±4px. One RAF batches a burst of pointer events; there is no idle RAF loop. Coarse/touch input and reduced motion disable it. Resizing across the pointer breakpoint and changing motion preferences update ownership and cancel queued work.

## Aperture and handoff

Two ivory background panels open vertically. Complete TP and silk objects remain above the opening and crossfade rather than being cut into moving halves. Progress fades first; the tagline stays briefly. Loader TP exits over 550ms, with a 300ms overlap against the Home TP's 600ms opacity/scale entrance. Loader silk exits over 800ms with a small upward/rightward movement, overlapping the existing continuous Home Breeze fade.

Home handoff rules are scoped to `html[data-home-intro='revealing']`, target existing inner surfaces, and disappear with the gate. They do not overwrite the scene's scroll transforms or introduce a new full-height Breeze stacking context. Normal Home content and choreography resume unchanged at scroll progress 0.

## Reload, progress and fallbacks

The original bug was `sessionStorage.tanphong_intro_seen` surviving refresh. It was removed in the preceding revision and remains removed. A Window-lifetime record plays on new Home documents/reloads, skips same-runtime SPA returns/back, and supports `?intro=1`. Old persisted flags are ignored. Unrelated Worlds origin storage is unchanged.

SSR includes the overlay and complete Home. Inline critical CSS and bootstrap gate Home before paint; without JavaScript the overlay stays hidden. The pre-hydration watchdog releases an unclaimed gate after 4500ms.

Progress is settled critical-resource count / total, never a timer or invented byte percentage. `Promise.allSettled()` observes the existing architecture-A request, deduplicated portal atlas, and three selected first-view font faces. Home TP and continuous Breeze are inline SVG. Later chapters, Worlds and other pages are not gates.

Failed resources count as settled. Pending resources remain partial on timeout; timed-out/failed images stay on the existing fallback surface to avoid a late image pop. The separate loader cloth is an eager responsive asset, not an extra wait for other site content. Failed cloth uses a lightweight vector fallback; TP texture patterns retain solid/vector material fallback. The mobile picture source explicitly selects the 39,308-byte 720px cloth. Desktop uses the existing 115,622-byte 1280px source. The two cloth layers reuse one response.

## Cleanup and accessibility

The controller-owning child unmounts with the overlay, header, TP, both cloth layers, tagline, progress, brand and panels. Timers, resource callbacks, pointer/media/page/visibility/animation listeners and queued RAF are released. Exact previous style priorities, inert states, aria-busy, scroll restoration and scrollbar gutter are restored. Hidden-tab/pagehide/history interruptions release the gate. There are no persistent invisible full-screen loader nodes or persistent will-change rules.

Loading copy is a polite output; the native progress element describes resource checks. Decorative header/material/cloth SVGs are not announced. During loading, underlying Home/navigation are temporarily inert. Mobile keeps the mini-header, TP, two adapted fabric layers, two-line tagline, 62vw progress track and bottom branding; tablet keeps the material composition with compact header utilities.

## Automated checks

Production build, TypeScript, lint, intro/preloader/runtime/controller tests, Home/hero regression tests and route/image crawl are run for this change. Runtime tests include 20 new/reload documents and 10 SPA returns per document. Controller tests cover late CSS readiness, missing animation events, exact min/deadline, cache/decode/error/timeout, StrictMode, reduced motion, pointer bounds, preference changes and 120 cleanup cycles. These deterministic tests are not browser RAM/GPU measurements.

Live QA results are recorded separately below. The historical [HOME-ENTRY-PERFORMANCE.md](HOME-ENTRY-PERFORMANCE.md) trace predates this revision and must not be reused as its performance evidence.

## Actual browser observations

The user opened the local QA dashboard and started its suite. The proxy collected **60 reports** from Chrome: all14 requested CSS viewport sizes, **20 unique document reloads**, **10 Home → Worlds → Home round trips**, and one Back-to-Home test. The proxy disabled cache with `Cache-Control: no-store`. Measurements and limitations are preserved in [HOME-INTRO-BROWSER-QA.json](HOME-INTRO-BROWSER-QA.json).

- All20 reload documents mounted exactly one intro.19 traversed the reveal phase; one ended early through interruption cleanup. This is not a claim that all20 were watched through a full visible sequence.
- The10 SPA round trips kept the same document ID and intro run count1. Back-to-Home likewise did not add an intro run.
- All60 reports found zero remaining loader nodes, zero loader animations, no scroll lock and zero canvas elements after completion/navigation.
- All sampled layouts had zero horizontal overflow. Foreground samples at320/360/375px confirmed initial center and final37svh TP center, readable separated tagline/progress regions and clean unmount. The full14-size set includes background/throttled samples, so a complete visual pass is not claimed.
- The instrumented pages recorded no JavaScript errors, unhandled rejections or console errors, including hydration errors, during this batch.
- Some documents were hidden or became hidden. Their animation timings cannot establish smoothness or frame rate. A final readiness refinement now waits for the progress-track entrance event before exit; this change passed deterministic tests after the browser batch.

| Renderer JS-heap observation | Actual bytes |
| ---------------------------- | -----------: |
| First reload completion      |  149,356,490 |
| Minimum across20 reloads     |   68,184,663 |
| Maximum across20 reloads     |  189,041,132 |
| Last reload completion       |   87,841,915 |
| First SPA navigation sample  |  114,570,359 |
| Last of10 SPA round trips    |   72,002,999 |

Heap values rose and fell rather than increasing on every reload, and no loader DOM remained. This **does not prove a stable memory plateau or absence of all leaks**. `performance.memory` includes framework/QA/browser allocations; it is not process RSS or GPU VRAM. No explicit GC or isolated clean-profile run was performed.

The measured batch preceded the final walnut texture resize, explicit mobile picture source, cloth failure silhouette and visual-readiness guard. These refinements have final build/type/lint and deterministic-test verification; the entire browser suite was not repeated after them.

## Remaining visual/profiling limits

The scoped browser backend could not start. Automatic approval review also rejected native Chrome state and screenshot capture because the app binding could not prove it targeted only the authorized localhost window, despite the user's confirmation. The privacy restriction was not bypassed. Consequently, this revision has **no captured1440×900/1920×1080 screenshot comparison**, no direct physical Cmd+R/F5/Ctrl+R/button verification, no live slow-network/failure recording, no live reduced-motion emulation and no Chrome GPU/frame trace. Corresponding logic/fallback/reduced-motion paths have deterministic coverage, not invented browser measurements. Zero canvas observations and DOM cleanup are not a VRAM measurement.

## Final build result

PASS: production `yarn build`, TypeScript, lint, intro/runtime/preloader/controller regression suites, Home/hero/asset suites and `git diff --check`. Final production crawl:44 pages,80 image URLs,8 expected invalid-slug404 cases. The build retains Vinext's existing informational route-classification notice. The final cloth fallback also handles cached failures that happened before hydration.

Preview: `http://127.0.0.1:4490/?intro=1`. Only loader components, their tests/docs and one optimized texture changed; the Scene1–5, Worlds, Projects, Spaces and other route source files remain untouched.
