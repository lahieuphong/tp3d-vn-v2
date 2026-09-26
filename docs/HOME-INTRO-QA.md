# Homepage initial entry — implementation and QA

Date: 26 September 2026. This report supersedes the earlier minimal-loader report. Scope: a separate Image01-inspired intro before the existing five-scene Homepage. No deployment performed.

## Composition and architecture

`app/page.tsx` renders `HomeIntroLoader` beside the existing server-rendered Home. The loader is fixed, full-screen, outside normal flow. An inline head bootstrap and global intro CSS hide Home before first paint when entry is eligible. Without JavaScript, the loader stays hidden and Home remains usable. A 4.5-second bootstrap watchdog releases the gate if hydration never claims it.

The intro uses a plain warm-ivory CSS background, a separate inline SVG TP (light mineral T, walnut P), one optimized alpha cloth asset in rear/front layers, serif slogan, actual completion count, thin progress line and centred signature. It does not use the architecture image as its background. `IntroMonogram` and `IntroBreeze` are independent of the existing Hero assets. The header is the existing semantic `SiteHeader`; there is never a second header.

| File                                                                                  | Responsibility                                                           |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `components/home/intro/home-intro-loader.tsx`                                         | Composition, accessible progress, conditional unmount                    |
| `components/home/intro/intro-monogram.tsx`                                            | Independent mineral T / walnut P with inline fallbacks                   |
| `components/home/intro/intro-breeze.tsx`                                              | Responsive alpha cloth and image-error fallback                          |
| `components/home/intro/home-intro.css`                                                | Layout, entry motion, horizon, stagger, mobile and reduced motion        |
| `components/home/intro/critical-assets.ts`                                            | Existing-request observation, decode, real progress, failure and timeout |
| `components/home/intro/intro-controller.ts`                                           | State timing, header swap, pointer events, locks and exact cleanup       |
| `components/home/intro/intro-session.ts`                                              | Pre-paint decision, session ownership and local replay override          |
| `components/home/hero/hero-timeline.ts`                                               | Hold scroll-story progress at zero until intro ends                      |
| `components/home/hero/{hero-monogram,breeze-ribbon,hero-scenes}.tsx`                  | Inner reveal surfaces, isolated from scroll transforms                   |
| `components/layout/site-header.tsx`                                                   | Stable trigger IDs retained from prior hydration fix                     |
| `app/layout.tsx`, `app/page.tsx`                                                      | Bootstrap/CSS integration and server-rendered Home integration           |
| `public/images/intro-breeze-{720,1280}.webp`                                          | 39,308-byte and 115,622-byte cloth exports                               |
| `public/favicon.ico`                                                                  | 339-byte fallback from existing icon; final HTTP200 confirmed            |
| `scripts/check-{home-preloader,intro-session,intro-controller,spatial-hero,site}.mjs` | Lifecycle, asset, timeline and route assertions                          |

Asset prompt, provenance and source/export paths: [HOME-INTRO-BREEZE-ASSET.md](HOME-INTRO-BREEZE-ASSET.md). No new runtime dependency, video, canvas, WebGL, Three.js, Sketchfab or 4K loader background.

## Critical assets and progress

Normal first-view tracking has six completion units: existing architecture-A image; existing first Breeze; first-view portal atlas (deduplicated across four nodes); Cormorant Spatial regular; Cormorant Spatial italic; Manrope Spatial. Font loads target only the necessary face/glyph samples. The Home TP is inline SVG; optional texture images have vector/solid fallback and do not gate entry.

`Promise.allSettled()` observes the existing responsive image requests and decode promises. No duplicate `Image` fetches, later chapter preload, GLB request or world viewer creation is added. The Hero request remains eager/high priority while Home is concealed. The loader cloth and optional mineral/wood samples are nonblocking visual assets.

The percentage is settled resources / total resources, not bytes downloaded and not a timer. Failed resources count as settled; hanging resources retain partial progress on timeout instead of a fabricated100%. Failed critical image nodes are hidden over existing quiet surfaces. Development logs identify failed/pending resources; production continues silently.

## Timing and handoff

| Phase                                          | Duration |
| ---------------------------------------------- | -------- |
| Minimum loading visibility from head bootstrap | 1200ms   |
| Maximum asset wait from head bootstrap         | 4000ms   |
| Ready hold, normal motion                      | 240ms    |
| Desktop / tablet aperture                      | 1400ms   |
| Mobile below640px aperture                     | 1000ms   |
| Reduced-motion fade                            | 300ms    |

The maximum asset wait is followed by ready/reveal; the entire sequence is not claimed to finish within4000ms. Animation-end is primary, with a finite duration+100ms safety timer.

Two half-screen panels open vertically with `cubic-bezier(.76,0,.24,1)`. Architecture appears behind them. Loader TP scales1→.93 and moves up10px while fading; Home TP appears at25% of reveal (23% mobile), with overlapping timing. The departing loader cloth forms a veil while Home Breeze appears at35%; desktop copy follows at45%, portals55%, metadata70%. Mobile simplifies the order to architecture→TP→copy→Breeze→portals. Both cloth layers retain their own starting opacity, preventing a dark flash.

The shared header fades before its typography/geometry switch:350ms desktop,250ms mobile,150ms reduced motion. Geometry switches while invisible. Inherited header transitions are disabled during intro, so height is not animated. Mobile intro shows the wordmark without desktop navigation; normal menu/search return during handoff.

TP arrival is a single1200ms .985→1 movement with4px translation. Cloth drift is a single6500ms pass and unmounts when entry ends. Fine desktop pointer input changes TP by at most3px and cloth by4px through one event-batched frame; mobile and reduced motion disable it. There is no idle perpetual RAF loop.

Reduced motion presents static TP/cloth, progress, then a300ms opacity-only exit. A narrowly scoped rule permits this fade despite the site's global motion ban. No horizon split or pointer movement.

## Session, scroll and cleanup

- `sessionStorage.tanphong_intro_seen` skips subsequent Home entries and same-session hard refreshes.
- Local `?intro=1` forces replay; legacy `?forceIntro=true` also works. No production control is displayed.
- History restoration, nonzero restored scroll and hash targets skip entry even in replay mode.
- Scroll-story progress remains0 while the gate exists. Native scroll resumes after completion.
- Header, Home, footer and skip link are temporarily inert. Previous inert, aria-busy, overflow, overscroll, scrollbar-gutter values and CSS priorities are restored.
- Every exit clears pointer frame/listeners, asset observations, timers, media-query listeners and header-swap attributes. Hidden-tab/pagehide/history interruption is handled. Loader TP, both cloth layers, line, percentage and panels unmount.
- The loading text is a polite live region. Decorative assets are aria-hidden; percentages are not repeatedly announced.

## Browser verification

Chrome localhost checks inspected BOTH waiting intro and completed Home at all requested sizes:

375×812,390×844,430×932,768×1024,820×1180,1024×768,1280×800,1366×768,1440×900,1728×1117,1920×1080,2560×1440.

Observed: no horizontal overflow, readable separated intro regions, one header, Home hidden while waiting, zero canvas, no retained panels/overlay or overflow lock afterwards. Screenshots of waiting, an opening horizon and completed Home were reviewed. These are sampled frames, not a guarantee about every frame on every device. The existing five-scene Home composition is preserved.

Production navigation checks:10 Home→Worlds→Home cycles skipped the full intro;10 forced-entry reloads each mounted one intro, concealed Home, then removed all intro/panel nodes and restored body overflow. All20 completions had zero canvas. Console inspection found only repeated favicon404 requests; an existing-logo ICO fallback was added. Fresh application-console capture showed no React hydration warnings or application errors.

The last two small CSS fixes (header transition suppression and fixed percentage width) were rebuilt and checked by source/TypeScript/lint; native Chrome profiling was interrupted by active user navigation before a second trace. Final production DOM inspection confirmed header transition-property:none and percentage width44px. The mobile menu opened/closed correctly after entry; body and root overflow returned to visible. Actual reduced-motion UI emulation and physical iOS Safari were not completed for this revision; reduced timing and cleanup passed the focused harnesses. No prior-revision Safari or performance result is represented as a current-revision measurement.

A disposable local HTTP proxy then delayed architecture-A by6000ms and returned404 for the portal atlas. Browser inspection observed83% progress with architecture incomplete and four portal nodes marked failed while Home stayed hidden. The intro subsequently unmounted, removed its gate and restored scrolling; failed portals used quiet surfaces while their link labels remained available. This verifies browser failure/slow-resource recovery; the exact4000ms deadline is asserted by the deterministic controller harness, not a stopwatch claim from browser-tool call duration. The proxy was stopped after testing.

## Performance and limits

See [HOME-ENTRY-PERFORMANCE.md](HOME-ENTRY-PERFORMANCE.md) for the actual trace, reproduction, frame/layout/heap observations and final-fix caveat. The compact recording found no main-thread task≥50ms during the aperture and no explicit dropped-frame marker. It also exposed the inherited header-height transition that was subsequently disabled. The recorded LCP candidate is the loader cloth, not proof of Hero LCP performance.

Browser DOM checks and source inspection confirm zero loader canvas/WebGL and no accumulated loader nodes. Exact GPU-process VRAM could not be isolated. Heap readings rose during instrumented cycles then returned to about33.3MB after recording/collection; this does not establish a clean-profile RAM plateau or rule out every leak. No universal60fps claim is made.

## Build and automated verification

PASS: production `yarn build`; TypeScript; lint; intro, hero, home, content, assets and worlds checks; `git diff --check`. Production crawler:44 pages,84 local images,8 expected invalid-slug404 routes. Loader SSR precedes the full Home and is absent from other routes. Existing five-scene content/routes remain intact.

Harness coverage includes cache/source deduplication, load/decode failures, hanging resources, partial timeout progress, cancellation, session/storage denial, reload/back/hash, StrictMode replay, header swap timing/cancellation, pointer bounds, exact lock restoration and120 cleanup/navigation lifecycles.

The build's existing Vinext unknown-route-classification notice is informational. Preview: `http://localhost:4483/?intro=1`. No publish/deploy action was performed.
