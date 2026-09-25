# Homepage opening — native scroll implementation and QA

This record applies to the scroll interaction replacing the previous autoplay opening. Earlier autoplay screenshots, 20-second-loop memory runs and frame-cadence results **do not validate this version**. Existing architecture imagery, fonts, live bilingual copy and portal routes are reused. This document records the opening implementation before the three new chapters. The original Scene 1→2 progress range remains intact. The current Home continues into Worlds → Spaces → Materials; see [HOME-EXPERIENCE-QA.md](HOME-EXPERIENCE-QA.md) for current scope and final build/crawl results. Other route layouts remain unchanged.

## Implementation

- `spatial-hero.tsx`: one `section` with one `.sh-stage` sticky viewport; removed scene switch and Play/Pause controls. A noninteractive `SCROLL TO DISCOVER ↓` label fades during the first 15% of scroll.
- `hero-timeline.ts`: native passive scroll input, cached geometry and one event-batched RAF. No GSAP dependency, WAAPI autoplay, timer, interval, smoothing loop, wheel interception, pointer parallax or React state per frame. Identical scroll positions produce identical frames in either direction.
- One `HeroMonogram`, one `BreezeRibbon` system and the existing shared `SiteHeader`. The same monogram translates, scales and rotates at most 1°; it never crossfades with a duplicate.
- Two responsive architecture plates dissolve through the moving translucent fold. The TP remains above the veil at the midpoint. The ribbon moves in front of the TP and behind it after 64%; unique Discovery and Story content have separate reveals.
- Desktop/tablet wrapper: `max(660px, 100svh) + 110svh` (210svh at the specified desktop sizes). Mobile below 640px: `max(760px, 100svh) + 90svh` (190svh at the specified mobile sizes). The stage is sticky at `top: 0`; no JS scroll lock or pin spacer.
- One transparent header remains above both compositions; its normal solid styling resumes as the opening exits. Header React state only changes when its threshold changes.
- Every mount owns its ResizeObserver, event/media listeners, pending RAFs and secondary-image load/decode callbacks. Cleanup is scoped to this opening. Continued scrolling below the released opening schedules no animation work once its final state and header state are settled.

| Progress  | Composition                                                          |
| --------- | -------------------------------------------------------------------- |
| 0–0.25    | Discovery, gentle shared depth movement; portals remain fully opaque |
| 0.25–0.50 | Portals move down 72–96px and fade; headings move outward            |
| 0.30–0.70 | Ribbon/fold traverses the architecture dissolve                      |
| 0.50      | TP remains visible; A copy gone, B copy still absent                 |
| 0.52–0.82 | Story copy rises 18px into view                                      |
| 0.85–1.00 | Stable Story reading zone; no movement while idle                    |
| Beyond 1  | Sticky release; TP departs over 40vh into the new Worlds chapter     |

## Responsive and accessibility

Desktop uses the existing bilingual split. Portrait tablet uses stacked condensed EN/VI text with a shared TP separator and a story link. Mobile uses 2×2 portals, short story copy, no leaf motion or pointer effects, and a 10% TP scale change. Intentional architecture crops remain breakpoint-specific. `svh` avoids address-bar-driven stage resizing during normal mobile scrolling.

Reduced motion removes sticky and scrubbing. The same Discovery content appears first, followed by the same Story nodes with full bilingual paragraphs in normal flow. Both are exposed to accessibility APIs; no duplicated TP/header/ribbon. The unused Scene B image is not requested in this mode. Changing the preference back initializes scroll behavior at the actual current position.

There is one opening H1, live text with Vietnamese language attributes, decorative SVGs hidden from assistive technology, and real portal links to `/worlds`, `/spaces`, `/products`, `/projects`. Focused links are not forcibly made inert; hidden content otherwise leaves the tab sequence.

## Earlier opening checks (current five-chapter results are in HOME-EXPERIENCE-QA.md)

- `yarn check:hero`: PASS. Pure forward/reverse frame equality, 20 A↔B controller cycles, stable reading zone, architecture fallback, no layout measurement per normal scroll frame, batched input, idle/hidden cancellation, reduced-motion accessibility, preference/restore synchronization and 30 complete mount/unmount cleanups. These are deterministic controller tests, **not Chrome RAM tests**.
- `yarn tsc --noEmit`: PASS.
- `yarn lint`: PASS.
- `yarn check:content`, `yarn check:assets`, `yarn check:worlds`: PASS.
- `yarn build`: PASS (Vinext production build). Its existing route-classification notice is informational.
- Production localhost route/image crawl: PASS — 44 pages, 69 image paths and 8 expected 404s. Asserts one TP, one ribbon, one header, no obsolete controls and all four portal destinations; crawls content links and checks expected 404s.
- Source inspection: no Three.js, WebGL, canvas, Sketchfab iframe or WebGL renderer in opening; no new package dependency, no permanent `will-change`, no autoplay timer. This establishes the implementation path, not a browser-measured context count.

## Browser QA blocked in this session

Computer Use returned `Sky Computer Use native pipe startup failed` when connecting by app name, after a session reset, and by bundle ID. Its final inventory returned `apps: []`, `browsers: []` with the same native startup error. Therefore the new scroll version has **not** been verified with live browser screenshots, console/hydration observation, real scroll/mount stress, DevTools Performance traces or GPU/layer inspection. No RAM, VRAM, FPS or runtime WebGL-context measurements are claimed. No measurements from the obsolete autoplay interaction are carried forward.

The following acceptance work remains when browser access is restored:

1. At each viewport, inspect A, B and progress 0.25/0.50/0.75; check overflow, text/monogram collisions, crop, header stability and sticky release. Matrix: 375×812, 390×844, 430×932, 768×1024, 820×1180, 1024×768, 1280×800, 1366×768, 1440×900, 1728×1117, 1920×1080, 2560×1440.
2. Capture actual screenshots at progress 0/0.5/1 at 1440×900, 1920×1080 and 390×844; compare endpoints with the two supplied references and refine if necessary. Previous autoplay captures are not final screenshots for this change.
3. Exercise portals, menu, search, keyboard focus and reduced motion; reload at a restored intermediate scroll position. Verify no hydration warnings or broken images.
4. Chrome: 20 forward/reverse cycles, leave/return, 10 Home → Worlds → Home navigations, several minutes idle. Record JS heap separately from tab/process RAM; look for sustained growth after cache warm-up and GC.
5. Record slow/fast/reverse scrolling in DevTools Performance, inspect long tasks and frame presentation, and inspect Layers/GPU process across repeated cycles. Do not label RAF cadence as presented-frame FPS or a Layers raster estimate as exact VRAM.
6. Repeat functional checks in Safari and Edge if available. Physical mobile Safari address-bar behavior needs device testing.

## Files

Changed: `components/home/hero/{spatial-hero.tsx,spatial-hero.css,hero-timeline.ts,hero-content.ts,hero-architecture.tsx,hero-monogram.tsx,breeze-ribbon.tsx}`, `components/layout/site-header.tsx`, `scripts/{check-spatial-hero.mjs,check-site.mjs}`, and the three hero documents.

Removed obsolete public QA scripts: `public/spatial-dom-qa.js`, `public/spatial-performance-qa.js`. They targeted autoplay scene controls and should not ship as production assets.

Asset provenance and font coverage remain in [SPATIAL-HERO-ASSETS.md](SPATIAL-HERO-ASSETS.md). No new image or font was generated for this interaction change.
