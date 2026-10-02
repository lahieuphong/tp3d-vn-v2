# Homepage PASS 5 — final polish and production hardening

PASS 5 preserves the approved Loader → Arrival → Perspective → Breeze → Sky → Oculus → Atrium → Footer composition. `home-motion.ts`, `atmospheric-bridge-frame.ts` and `breeze-bridge-pose.ts` are byte-identical to the PASS 4 copies saved before this work. No new cinematic transition, camera curve, typography or architecture was introduced.

## Interaction

Room discovery activates at master progress **0.92**, with a decoded Atrium and the sticky story still in view. It resets on reverse scrolling, Footer release, visibility suspension and unmount. The photograph and central tree remain still.

- Room number stays fixed; title translates 3px; underline grows from 0.6 to 1; other labels settle at 0.65 opacity. Transitions take 220ms, without bounce.
- Four existing 192×192 WebP thumbnails crossfade inside the approved circular preview. Only decoded images may become active; a failed optional image falls back to the default preview.
- Keyboard `:focus-visible` has the same label/preview response and retains an ivory outline. Keyboard focus takes priority over pointer hover.
- CTA preview scales to 1.035; arrow moves 4px. Navigation uses the existing link immediately, without an exit animation.
- The architecture is a single baked photograph. Per the brief's fallback, local lighting and reflection motion were omitted. Old unused gradient room masks and the rotating preview-ring experiment were removed.

| Target            | Existing route            |
| ----------------- | ------------------------- |
| Living            | `/spaces/living`          |
| Bedroom           | `/spaces/bedroom`         |
| Bathroom          | `/worlds/modern-bathroom` |
| Kitchen           | `/spaces/kitchen`         |
| Explore 3D Worlds | `/worlds`                 |

## Responsive and accessibility behavior

Capability tiers are `full` (fine pointer, ≥1200px), `medium` (fine pointer, 768–1199px), `light` (mobile or coarse pointer), and `minimal` (reduced motion). These use breakpoints/media queries, without device sniffing or benchmarking.

Mobile retains the approved editorial 2×2 room grouping, one default preview and direct one-tap links. No preview step intercepts navigation. Tablet touch uses direct links; a fine pointer enables discovery. Keyboard previews remain available from 768px even when the primary pointer is coarse. Touch pointer enter/leave cannot activate room discovery.

Reduced motion disables the added transforms/transitions and preserves opacity/focus feedback and working links. The existing story's reduced-motion handling is retained. Text stays semantic HTML with one H1 and chapter H2s; decorative image/Breeze layers remain hidden from assistive technology. Inert content does not enter keyboard navigation before its scene is available.

## Asset delivery

The Loader continues observing the existing first-view images/fonts instead of creating image clones or gating network requests. Scene 1 architecture is requested immediately. Scene 2 retains its existing preparation after the first paints.

Atrium markup has no initial `src`/`srcset`. The master starts the existing DOM image at **0.16** progress, installs `<picture>` choices before the fallback source and waits for `decode()` before revealing Scene 3. At **0.30**, the default circular preview warms; fine pointers at ≥768px also warm the four small room thumbnails. Keyboard focus can warm those thumbnails on tablets. Other routes are not prefetched for hover.

| Asset                     | Source size | Compressed bytes |
| ------------------------- | ----------- | ---------------: |
| Scene 1 architecture      | 1586×992    |          143,636 |
| Scene 2 architecture      | 1586×992    |          186,896 |
| Atrium desktop            | 1672×941    |          252,504 |
| Atrium mobile/tablet      | 1280×720    |          168,876 |
| Loader Breeze, alpha WebP | 1280×853    |          115,622 |
| Living preview            | 192×192     |            4,410 |
| Bedroom preview           | 192×192     |            2,292 |
| Bathroom preview          | 192×192     |            2,566 |
| Kitchen preview           | 192×192     |            5,684 |

Mobile/tablet use 1280px instead of the 1672px source. The existing 720px Atrium is deliberately not selected: the approved sky/oculus crop magnifies the photograph considerably, so another resolution cut would sacrifice the core reveal. No 4K asset is delivered. Four room previews total **14,952 bytes** and never use room hero images. The default preview retains its 160/320 responsive candidates. Story Breeze is inline SVG; no additional large alpha raster is introduced.

Existing Cormorant/Manrope variable faces and Vietnamese unicode subsets are retained, with `font-display: swap`. The Loader requests only the first-view normal/italic serif and normal sans samples, including Vietnamese glyphs; PASS 5 adds no font or weight preload.

## Lifecycle and compositor changes

`room-discovery.ts` owns four delegated element listeners and one capability listener. It has no timer, RAF, pointermove listener, React state update or route interception. Its five thumbnail preparations and the one Atrium preparation clean up load/error listeners and detach callback/reference state on disposal. Late decode resolutions cannot mutate a disposed scene. Source failure retains a readable previous scene and never stalls the Loader.

The story retains one event-driven RAF and one ResizeObserver; there are **zero GSAP timelines/ScrollTriggers** in this implementation. Document hiding cancels pending story work, clears discovery and releases moving-layer `will-change` hints. Scene 3's final camera/reveal transforms become `none`; desktop room coordinates retain only the required 2D translation. Active movement alone receives promotion hints.

When Breeze opacity reaches zero, its root is `display:none`, so the persistent reverse-scroll SVG definition is no longer painted. The final scene has one architectural image, no Canvas/WebGL, no looping background motion and no continuously animated reflection/light/preview ring. QA instrumentation lives only in ignored `work/pass5`, behind a separate local proxy; it is absent from the production app.

## Verification evidence

Evidence and detailed browser limitations are recorded in `work/pass5`. Production preview: `http://127.0.0.1:4516/`. QA proxy: `http://127.0.0.1:4517/`.

Automated checks: room discovery/decode lifecycle, HomeStory motion and cleanup, hero, Loader, TypeScript, lint and production build passed. The route crawler checked 44 pages and 76 images, including the four room routes and `/worlds`; eight intentionally invalid routes returned their expected error behavior.

Browser results and measurement boundaries are recorded below.

### Chrome responsive and lifecycle

All 14 requested viewports passed the real-browser iframe matrix: 320×568, 360×800, 375×812, 390×844, 430×932, 768×1024, 820×1180, 1024×768, 1280×800, 1366×768, 1440×900, 1728×1117, 1920×1080 and 2560×1440. Each ran forward/reverse checkpoints, hidden-link accessibility, single stage/Header/TP, image and Breeze counts, final stillness and Footer alignment. No horizontal overflow or runtime error was recorded. A native screenshot review at 320×568 confirmed readable copy, four links and CTA within the scene. These are browser viewport tests, not physical phone tests.

A single mounted iframe also passed 30 progress samples while resizing 1920→1440→1024→768→390, rotating 390×844↔844×390 and 820×1180↔1180×820. Progress agreed with recomputed geometry within 0.001; no stale final camera transform or document overflow was detected.

Twenty full forward/reverse story cycles kept 568 DOM elements and 185 instrumented listener registrations. Ten same-document Home→Worlds→Home cycles kept the remounted count at 574 elements and 185 listeners. Away from Home, delegated discovery listeners and document visibility handling dropped to zero, pending RAF was zero, and the story ResizeObserver had zero observed targets. Returning created exactly one observer with three targets. The broad listener metric also includes framework/extension registrations; it is not a heap-retainer census.

JS heap across the 20 scroll cycles ranged **45.55–47.48 MB** (decimal bytes), with natural GC drops. Across the ten route cycles it ranged **46.79–51.05 MB**, ending at **48.60 MB**. The subsequent actual **300.315-second** idle test kept the document visible for all ten samples, kept listener count at 185 and executed **zero additional product RAF callbacks**. Sampled heap moved from **47.12 to 47.86 MB** while the QA tool itself allocated/stored/serialized a growing sample array. This does not show a product listener/RAF staircase, but it is not a claim of zero allocation, exact RAM recovery or a complete heap-retainer analysis. No forced GC was used.

### Network and performance trace

An initial no-store QA proxy run produced two portal-atlas entries. This was investigated rather than accepted as a product duplicate: after preserving the real static-asset cache headers, the browser recorded **one request per large source**, including the shared portal atlas and Atrium. The corrected `chrome-loading.json` also verifies no Atrium/room requests at boot, early Scene 1 loading, decode before reveal, and the four dedicated tiny previews. The four existing portal crops share one atlas URL; the Loader groups and observes it once.

The first native Chrome 154 DevTools trace, before the final SVG clipping correction below, covered approximately **40.46 seconds** at **1149×829**, with screenshots and memory counters. In its page renderer, maximum Layout was **1.598ms**, maximum Paint **2.435ms**, and maximum UpdateLayoutTree **3.255ms**. Its one >50ms task was **174.213ms at profiler startup**, of which **170.317ms** was `CpuProfiler::StartProfiling`. The separate driven-motion PerformanceObserver recorded no long tasks. The DevTools trace showed one document, 1184–1192 nodes and 1183–1219 listeners, with lower final node/listener counts than at capture start. Its JS heap range was **33.86–36.19 MB**; profiler GC and instrumentation make this a separate observation from the earlier stress run.

That pre-correction unthrottled scripted scroll's 1510 measured RAF intervals had median **16.7ms**, p95 **17.7ms**, maximum **51ms**, with **34 intervals above 33ms**. This is RAF cadence in an instrumented existing Chrome profile, not a guaranteed display FPS or a clean hardware benchmark. Final-scene and Footer idle probes each recorded zero product RAF work. Existing browser extensions remained active.

No GPU-memory counters were present in the trace. Layer-created/deleted events lack enough identity information to infer simultaneous layer count or a leak. WebGL/Canvas counts remained zero. Precise VRAM, isolated GPU-process use and total browser RAM are not inferred from JS heap or raster events.

### Compositor defect found and fixed during PASS 5

Native DevTools Layers exposed an important issue that a zero-WebGL count alone did not catch. At progress 0.60, the overflow-visible near-camera SVG expanded its composited bounds to **23,582×42,719 physical pixels** on the 1149×829 CSS viewport at DPR 2. DevTools reported 20 total layers with a **4,166 MB layer-memory estimate**.

The SVG roots now use `overflow:hidden`, matching the story viewport clip that already constrained every visible pixel. Cloth geometry, projection transforms, overlap/sky/camera timing and z-order remain unchanged. The identical checkpoint now reports the front SVG at **2,298×1,658 physical pixels**, 20 total layers and a **151 MB estimate**. After 20 further full forward/reverse cycles, the same checkpoint remained **20 / 151 MB** and the final scene returned to **9 / 84.8 MB**. The QA status overlay adds one extra full-screen layer when visible and was hidden for the matched comparisons.

At the transition checkpoint, five major story layers were visible in the tree: stage, architecture, Breeze container, leaves and front SVG. In the final state, only the story stage remained as a major full-viewport story layer; the Breeze/architecture transition promotions were absent. The total also includes the document, header, QA controls and three existing browser-extension layers. These are **compositor layer estimates**, not measured VRAM or an isolated GPU-process benchmark. They establish a bounded repeatable layer footprint in this run; total GPU-process trend is not measured.

### Final post-correction measurements

A new native DevTools recording on the corrected build lasted **77.23 seconds**, including the scripted motion and additional idle time. Maximum Layout was **1.568ms**, Paint **1.426ms**, UpdateLayoutTree **1.833ms**, and Layerize **0.828ms**. The only >50ms task was at profiler startup (**199.05ms**); the driven-motion observer again reported no long tasks. JS heap ranged **32.93–37.64 MB** and ended at **32.93 MB**. This is an instrumented local run, not field Core Web Vitals.

The final driven scroll recorded **1516 RAF intervals**, median **16.7ms**, p95 **17.6ms**, maximum **50ms**, with **29 intervals above 33ms**. Both final-scene and Footer idle probes still recorded zero product RAF work. The original 4× CPU slowdown probe (before the SVG bound correction) had median 16.7ms / p95 17.6ms, but two observed long tasks of 72ms and 116ms and a 117.2ms maximum interval. It does not justify a claim of steady 60 FPS on a physical mid-range device. Decorative local lights, reflection movement and pointer parallax are already absent, preserving the core story with fewer optional effects.

Native Chrome Rendering emulation for `prefers-reduced-motion: reduce` confirmed the `minimal` tier, no room-title transform, a stationary 0.6 underline, usable links, correct preview/fallback response and hidden final Breeze. A proxy-only reduced-motion attempt was not applied reliably and was discarded; the reported result comes from the browser's native media emulation.

Native Chrome Mobile emulation at **390×844** reported a coarse pointer and `light` tier. Synthetic pointer entries did not activate any room response. A single native UI click on Living navigated immediately to `/spaces/living`; native Back returned to master progress **0.94984**, Scene 3, with no Loader/restoration marker left active and no runtime errors. The desktop keyboard check used native Tab: Bedroom had `:focus-visible`, the 3px title response, full underline and its decoded preview. Evidence: `discovery-touch.json`, `touch-back-restored.json`, and `interaction-focus.json`.

The full story also passed all 21 structural/motion/accessibility checks under native reduced-motion emulation (`story-reduced.json`). Native device emulation and reduced-motion override were reset after testing. The smallest viewport screenshot and desktop keyboard screenshot were visually reviewed through native Chrome.

Chrome Console contained nonfatal unused-preload warnings. The deliberately broken optional-thumbnail test also produced its expected 404 while confirming the default-preview fallback. No captured product runtime exception or hydration error occurred; this is not a claim that Console was entirely empty.

### Browser coverage and remaining release checks

- **Chrome 154:** final production build, 14 viewport matrix (rerun after SVG clipping fix), resize/orientation, normal/reduced story, native keyboard, native touch emulation and Back restoration, room/CTA route coverage, repeated navigation, five-minute foreground idle, DevTools Performance and Layers, and full tab recording.
- **Safari 18.6 installed:** Loader/initial HTML/fonts rendered, with no captured runtime exception. The native automation window continued reporting `document.hidden:true`, even after Window→Bring All to Front; story RAF correctly remained paused. Therefore full Safari scrolling/rendering is **not signed off**. The earlier harness timeout is recorded as an environment/visibility limitation, not silently counted as a pass. No Safari-specific visual fallback was added without evidence of a rendering defect.
- **Edge:** not installed in the available Applications locations; no Edge pass claimed.
- **Physical phones/tablets, Mobile Safari address-bar collapse/expand, and isolated GPU-process/total-RAM measurements:** not available in this run. Chrome viewport/device emulation is explicitly not a replacement for these checks.

Before external production release, verify foreground Safari, Edge, and a physical iOS device; this work does not claim universal device or GPU-process certification. No deployment was performed.

## Final recording and review

`work/pass5/homepage-pass5.mp4` is the portable 1680×772 export of the actual local Chrome tab capture. `atmospheric-bridge.webm` preserves the original variable-resolution browser capture. The tab viewport stayed 1680×772 throughout all recorded story checkpoints; initial capture-surface negotiation happened before the Loader completed. The MP4 fits frames into a fixed canvas without cropping and is encoded at 60 fps; that encoding rate is **not** a measured application FPS.

The approximately 51-second recording includes Loader, Arrival, Perspective, near-camera Breeze, sky/oculus, Atrium, four room previews, CTA, Footer, and reverse travel back to Arrival. Movement was driven through native scroll positions at a human-paced constant rate, with real rendered DOM; room events were synthetic PointerEvents. It is not a hardware-trackpad recording. Fourteen extracted actual-video checkpoints were visually reviewed for continuity, complete cover, clean final architecture, preview switching, Footer flow and reverse restoration. They are in `final-contact-sheet.jpg` and `final-frame-*.jpg`.

No extra light/reflection/ambient trick was added after the review. Final stillness, core camera timing and approved art direction remain intact.

## Files and verification commands

Primary implementation: `home-production.ts`, `room-discovery.ts`, `scene-image.ts`, `home-story-timeline.ts`, `chapter-image.tsx`, `worlds-chapter.tsx`, `worlds-chapter.css`, `home-story.css`, `breeze-renderer.ts`, and `home-experience.css`, under `components/home/experience/`.

Validation commands (Yarn): `yarn check:home`, `yarn check:hero`, `yarn check:intro`, `yarn tsc --noEmit`, `yarn lint`, `yarn build:vercel`, `yarn check:routes http://127.0.0.1:4516`, and `git diff --check`. Home checks/build/TypeScript/lint were repeated after the final compositor change. No test runner or browser instrumentation is shipped in production.

Review artifacts: `matrix.json`, `resize.json`, `chrome-loading.json`, `discovery-reduced.json`, `story-reduced.json`, `discovery-touch.json`, `touch-back-restored.json`, `interaction-focus.json`, `stress.json`, `navigation.json`, `idle-5min.json`, `compositor-before.json`, `compositor-after.json`, `trace-summary.json`, `chrome-performance.json.gz`, `recording.json`, and the video files in `work/pass5`.
