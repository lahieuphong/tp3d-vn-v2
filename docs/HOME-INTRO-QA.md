# Homepage minimal loading experience — implementation and QA

Revision: 27 September 2026. This report supersedes the previous cloth-and-slogan loader. Scope is the initial Home loader, refresh behavior and handoff only. Scene 1–5 components, timeline, content and other routes are unchanged. No deployment was performed.

## Reload bug and runtime state

The previous `sessionStorage.tanphong_intro_seen` flag survived document reloads and therefore suppressed the loader on refresh. The intro no longer reads or writes sessionStorage or localStorage. Old stored values are harmless and ignored; unrelated Worlds navigation storage is preserved.

`intro-runtime.ts` owns a record on the current Window. The inline head bootstrap initializes it on every route. New Home documents and reloads play; client navigation reuses the record and skips the intro. Initial navigation to another route does not cause a later SPA visit to Home to replay that document's navigation type. Back/forward entry skips; `?intro=1` explicitly enables replay, including a fresh Home mount in the same runtime. A refresh resets the record naturally.

The overlay and complete Home are both server-rendered. A small inline style plus head bootstrap gates Home/header before first paint, without replacing the SSR tree. Without JavaScript the intro stays hidden. If hydration never claims the gate, a 4500ms watchdog restores normal content and history scroll restoration.

## Changed implementation files

| File                                                                                     | Responsibility                                                                       |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `components/home/intro/intro-runtime.ts`                                                 | Document-lifetime decision, pre-paint gate and watchdog; replaces `intro-session.ts` |
| `components/home/intro/home-intro-loader.tsx`                                            | Minimal presentation; fully unmounts the controller-owning child and overlay         |
| `components/home/intro/intro-monogram.tsx`                                               | Existing TP outlines as two lightweight, flat inline SVG paths                       |
| `components/home/intro/intro-progress.tsx`                                               | Loading copy, real resource progress and accessible status                           |
| `components/home/intro/intro-controller.ts`                                              | Readiness/timing, temporary interaction locks and exact cleanup                      |
| `components/home/intro/home-intro.css`                                                   | Center-to-upper motion, line, split reveal and responsive/reduced motion             |
| `components/home/intro/critical-assets.ts`                                               | Existing resource observer; pending images stay on quiet fallback after timeout      |
| `app/layout.tsx`                                                                         | Inline pre-paint CSS and runtime bootstrap                                           |
| `scripts/check-{intro-runtime,intro-controller,home-preloader,site}.mjs`, `package.json` | Updated behavioral and SSR checks                                                    |

Removed obsolete `intro-session.ts`, `intro-breeze.tsx`, and `check-intro-session.mjs`. Existing raster assets are not requested by this loader. No new dependency, canvas, WebGL, video, Three.js or Sketchfab code is introduced.

## Visual sequence and timings

The initial viewport is warm ivory with only the compact TP. No header, navigation, slogan, architecture, cloth or portals are rendered inside the loader.

| Phase                             | Configured behavior                                                                 |
| --------------------------------- | ----------------------------------------------------------------------------------- |
| TP arrival                        | Starts100ms;550ms opacity0→1 and scale.985→1                                        |
| TP rise                           | Starts600ms;850ms translateY and scale1→.9                                          |
| TP final center                   | 29% viewport height desktop/tablet;32% mobile                                       |
| Loading copy                      | Starts950ms;350ms fade                                                              |
| Progress track                    | Starts1050ms;350ms fade                                                             |
| Progress fill                     | Visible from1200ms; actual settled-resource fraction,180ms scaleX transition        |
| Minimum resource-ready hold point | 1600ms from controller mount, so delayed hydration cannot skip the visible sequence |
| Ready pause                       | 150ms for normal completion; omitted on timeout/reduced motion                      |
| Reveal                            | 1000ms desktop/tablet;900ms below768px                                              |
| Asset deadline                    | 4000ms from resource observation, then reveal immediately                           |
| Reduced motion                    | TP directly upper-center; static status;250ms opacity exit                          |

A fast normal desktop entry therefore takes approximately2750ms after controller mount, including the1000ms reveal; mobile2650ms and reduced motion1850ms. The4000ms deadline limits asset waiting, not the complete waiting-plus-reveal duration. CSS animation-end completes the sequence; a duration+100ms safety timer covers missing events.

The top/bottom ivory halves move out with `cubic-bezier(.76,0,.24,1)`. Progress fades over200ms with10px translation; TP fades over320ms with a small additional rise. The existing header appears near the end of the reveal. The Home scene is already underneath; no Home scene layout or choreography was rewritten.

## Real progress, fallback and cleanup

Five resource-completion units are observed in the current Scene1: architecture-A, the shared portal atlas (deduplicated across four nodes), and three selected first-view font faces. Home TP and continuous Breeze are inline SVG and need no additional image fetch. Optional TP texture does not block. No later chapter, Journal or Worlds resources are included.

`Promise.allSettled()` handles resource/decode success and failure. The percentage means checked/settled resources, not transferred bytes. Failures count as settled; pending resources retain partial progress on timeout. A timed-out image is marked unavailable and stays hidden on the existing neutral fallback so a late response cannot pop into the revealed scene. Route cancellation only releases observation and does not hide images.

Scroll resets to0 on full entry, pageshow during entry and before reveal. The existing scene controller observes the gate and keeps its timeline at0. Main, header, footer and skip link are temporarily inert. Completion/unmount restores prior inert, aria-busy, overflow, overscroll, scrollbar-gutter and history.scrollRestoration values. Every exit aborts resource callbacks and removes timers, media/page/visibility/animation listeners. No pointer listener or RAF is owned by the loader. The controller-owning React child unmounts, releasing its effect's references as well as the overlay DOM.

## Completed automated verification

- Production `yarn build`: passed.
- TypeScript and lint: passed.
- `yarn check:intro`:20 new/reload document decisions,10 SPA returns per document, modern/legacy navigation type, back/forward, force override, no persistent state access, pre-hydration watchdog, cache/decode/load failures, hanging resources, partial-progress deadline, cancellation and exact style restoration passed.
- Controller suite: desktop/mobile/reduced motion timings, late hydration, restored scroll/hash, StrictMode replay, missing DOM, hidden tab/pagehide/popstate, preference change and120 cleanup cycles passed.
- Existing `check:home` and `check:hero`: passed, including existing14-viewport geometry checks. These are deterministic tests, not visual browser measurements of this new loader.
- Production route crawler:44 pages,78 image URLs,8 expected invalid-slug404 cases passed. Loader SSR exists only on Home and precedes the complete server-rendered Home.
- `git diff --check`: passed.

Pre-commit verification on 27 September also passed `yarn build:vercel`, `yarn check:content`, `yarn check:assets` and `yarn check:worlds`. The production crawl was repeated on port 4484 with the same 44-page, 78-image and 8-invalid-route results; that verification server was then stopped. Changed-file formatting passes. Repository-wide formatting still flags 11 unchanged Worlds files outside this change. This pass did not perform live browser QA or performance profiling.

## Browser QA and measurement limits for this revision

Live visual QA is not yet complete. The Chrome tab-control backend could not start. Native Chrome inspection was then blocked by automatic approval review because the active window could expose unrelated private ChatGPT content. A dedicated localhost window was requested. The isolated in-app browser is unavailable. These restrictions were not bypassed.

A local-only QA proxy/dashboard has been prepared in the ignored `work/intro-qa/` directory. It serves the production build without cache, records actual phase/geometry/console/heap observations, and exposes controls for14 exact iframe viewport sizes,20 actual document reloads,10 SPA round trips and browser Back. It has not been represented as an executed browser test until reports are collected. Production code contains none of this instrumentation.

Still requiring live verification: center/upper/reveal screenshots at all14 requested sizes; native Cmd+R/F5/reload button (Ctrl+R additionally on a platform where it is a reload shortcut); hard reload/cache-disabled behavior; throttled/failed resource rendering; console/hydration after interactive navigation; actual reduced-motion emulation;20-reload and10-round-trip RAM observations; a GPU/frame trace. No RAM plateau, zero-leak guarantee, FPS, VRAM or live mobile result is claimed. Deterministic cleanup checks cannot substitute for those measurements.

The previous [entry performance report](HOME-ENTRY-PERFORMANCE.md) describes a removed loader and is historical only. Its timings, heap figures and screenshots are not measurements of this implementation.
