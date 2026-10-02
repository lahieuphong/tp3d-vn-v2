# Homepage PASS 3B — Three.js atmospheric sky bridge

PASS 3B adds a temporary procedural atmosphere between the approved Scene 2 and Scene 3. Loader, Arrival, SharedTP, Manifesto, the actual Atrium photograph, the existing DOM camera pull-back, room discovery and Footer keep their existing ownership. The earlier PASS 3–5 “zero WebGL” constraint is superseded **only inside this bridge**. Earlier reports remain historical evidence; their performance measurements do not describe this implementation.

This document records the implementation, production checks and local browser measurements. Hardware and measurement limits are stated alongside each result.

## Reference and dependency audit

The user-provided `Ghi Màn hình 2026-10-01 lúc 20.44.20.mov` is a **1.400-second**, 3358×1856 recording. It informs camera depth, overlapping layers, atmospheric occlusion, loss of architectural context, suspension and world reveal. Its artwork, objects, palette, typography and branding are not used. `work/pass3b/reference-contact.jpg` contains review frames; `actual-sky.jpg` documents the existing Tân Phong source sky.

Direct Three.js is used with exact versions **`three: 0.186.1`** and **`@types/three: 0.186.0`**. No React Three Fiber, OGL, controls, model loader or second rendering framework was added. The renderer module has a type-only top-level Three import; its runtime library is requested through `import('three')` on preparation intent. SSR emits a decorative host, not a canvas. The initial view does not construct a WebGL renderer. The final build emits Three as a lazy 736.78 kB chunk (186.89 kB gzip). The manifest lists it under dynamic imports; the matrix’s `initialNetwork` only records images and is not JS-network evidence.

The current homepage does **not** have GSAP timelines or ScrollTriggers. Its existing HomeStory owner calculates native scroll progress and schedules one event-driven RAF. PASS 3B integrates with that actual owner rather than adding a second engine to resemble the brief's conceptual GSAP example. React state does not update per frame.

## Components and scene

`components/home/experience/atmospheric-sky-bridge.tsx` provides the `AtmosphericSkyBridge` host inside the existing sticky stage. `atmospheric-sky-renderer.ts` owns preparation, rendering and disposal. `atmospheric-sky-frame.ts` contains the reversible mapping and quality policy; `atmospheric-sky-shaders.ts` contains the procedural appearance.

The host is absolute, inset to the stage, clipped to its bounds, `aria-hidden` and `pointer-events:none`. Its stack level is 7, above the Scene 3 photograph so atmospheric gaps can reveal the actual sky after the world swap. It is hidden unless the renderer state is `active`. It contains no interaction, semantic text, architecture or oculus drawing.

One renderer owns one camera, one shared plane geometry and four shader materials: distant sky and three cloud banks. Desktop can draw three cloud planes plus sky; the tablet tier draws two cloud planes plus sky, hiding the third cloud mesh. Resource allocation stays fixed across tier changes instead of creating replacement renderers. There are no cloud textures, image clones, model assets, shadow maps, HDRI, render targets, postprocessing, bloom or raymarching.

## Camera, cloud structure and color

The camera is a `PerspectiveCamera` with a 48° field of view and near/far planes of 0.08/80. Scroll moves its Z coordinate from **8 to −2.2**, with restrained X/Y displacement. The sky sits at Z −36. Cloud banks begin at Z −1.25, 1.15 and 3.2, with distinct small depth velocities. Plane dimensions are calculated on resize and remain fixed in world space during scrolling; projected growth comes from camera travel. Banks attenuate as the camera approaches their plane and stop drawing after the lens passes them.

Broad asymmetric banks, low-frequency mass and softened thresholds produce the silhouette. Desktop FBM uses **three octaves**; tablet uses **two**. These are the FBM loop limits, not a claim that the whole fragment shader has only that many noise evaluations: cloud shape also uses two value-noise samples, and sky adds one detail sample plus fixed dithering. Derivative-based relief provides restrained directional shading without lights or shadow passes.

Near-field lighting opens its sample domain as the camera enters a bank, preserving visible structure when perspective crops the large world-space silhouette. The brightest phase retains density variation and warm/cool shading; there is no opaque white HTML overlay. Sky openings follow irregular cloud banks, not a circular wipe or a uniform rectangle fade.

Sky colors were sampled from the existing 1672×941 Atrium plate: upper sky **`#a9bddd`**, lower sky **`#bccee8`**. Atmosphere uses ivory **`#eee8dc`**, daylight **`#f3f1ef`** and subtle blue-gray shadow **`#b5c0cd`**. CSS/hex colors enter through `THREE.Color`; shader output uses the `colorspace_fragment` chunk once, followed by premultiplied-alpha output. The renderer uses sRGB output and no tone mapping. This follows Three's documented linear working space and custom-shader output conversion; the sampled colors are also reviewed against the actual DOM handoff. [Three.js color management](https://threejs.org/manual/pages/color-management.html)

## Scroll mapping and handoffs

Local progress is `clamp((master − 0.50) / 0.245)`. All camera, density, sky, opening and drift values derive from that progress. There is **no wall-clock `uTime`**, idle loop or timer-driven camera. The very small `uDrift` is deterministic (`local × 0.085`), so stopped and reversed positions reproduce the same shader inputs.

| Phase                        | Master progress        | Local bridge progress / behavior                                                 |
| ---------------------------- | ---------------------- | -------------------------------------------------------------------------------- |
| Hidden preparation intent    | 0.30                   | Lazy import, compile and hidden warmup                                           |
| Formal bridge interval       | 0.50–0.745             | Local 0–1                                                                        |
| Visible rendering permitted  | >0.513475 and <0.72295 | Local >0.055 and <0.91                                                           |
| Cloud formation              | 0.5245–0.61025         | Local 0.10–0.45                                                                  |
| Camera depth travel          | 0.53675–0.7156         | Local 0.15–0.88                                                                  |
| DOM Breeze hands off         | 0.575–0.62             | Cloth contribution decreases only for a successfully active atmospheric crossing |
| Enter inside-cloud field     | 0.5931–0.6225          | Local 0.38–0.50                                                                  |
| Strong inside-cloud interval | 0.6225–0.64945         | Local 0.50–0.61                                                                  |
| Existing architecture swap   | **0.64**               | Local ≈0.57143, inside full sky-coverage intent                                  |
| Sky color becomes dominant   | 0.6225–0.6862          | Local 0.50–0.76                                                                  |
| Density clears               | 0.6617–0.7205          | Local 0.66–0.90                                                                  |
| Irregular sky gaps open      | 0.6666–0.7205          | Local 0.68–0.90                                                                  |
| WebGL becomes dormant        | **0.72295 onward**     | Canvas hidden; no ongoing WebGL rendering                                        |
| Formal bridge end            | 0.745                  | DOM camera continues its existing Atrium reveal                                  |
| Final Atrium hold            | Existing 0.92+         | Clean photograph, room links and CTA; no Breeze or atmosphere                    |

The DOM world swap remains exclusive: Scene 2 becomes hidden and the already positioned Scene 3 plate becomes visible at 0.64. Shader coverage is designed to conceal that swap. The real DOM sky sits behind the canvas throughout the exit; cloud banks move past the camera and their irregular openings expose the photograph. No whole-canvas opacity animation crossfades two static blue rectangles.

The existing image's audited sky/oculus crop and camera path are retained. Its actual photographic sky needs the previously measured magnification; the brief's conceptual 1.16–1.24 scale is not substituted for the real framing. Three.js does not reconstruct the oculus. By the time the DOM reveal opens into the Atrium, its atmospheric contribution has ended.

An atmospheric-crossing latch prevents the original cloth from reappearing after WebGL becomes dormant. A ready renderer also primes that latch at master ≥0.84, after the baseline cloth has fully exited. This covers a restored/skipped final scene before reverse scrolling; a late compile below 0.84 still preserves the ongoing DOM fallback crossing. Reverse movement reduces the takeover using the same 0.575–0.62 range. Fallback, reduced motion, mobile mode or return to master ≤0.50 clears the latch and restores the baseline DOM Breeze behavior.

## Quality tiers and renderer settings

| Capability                                 | Active planes  | FBM octaves | DPR ceiling                      | Drawing-buffer budget |
| ------------------------------------------ | -------------- | ----------- | -------------------------------- | --------------------- |
| Fine pointer, width ≥1200px                | 3 clouds + sky | 3           | 1.5                              | 2,800,000 pixels      |
| Width 768–1199px, or coarse pointer ≥768px | 2 clouds + sky | 2           | 1.25                             | 1,600,000 pixels      |
| Width <768px                               | DOM fallback   | None        | No WebGL buffer on a fresh mount | None                  |
| Reduced motion                             | DOM fallback   | None        | No WebGL buffer on a fresh mount | None                  |

The actual pixel ratio is the minimum of the tier ceiling, device ratio and square-root pixel-budget limit. It may fall below 1 on a sufficiently large viewport; a 2560×1440 screen does not automatically receive a DPR 2–3 cloud buffer. Resize updates drawing-buffer size, camera aspect/projection and shader resolution without installing a separate resize observer. These caps are implementation budgets, not measured GPU memory.

Renderer options are `alpha:true`, `antialias:false`, `depth:false`, `stencil:false`, `premultipliedAlpha:true`, `preserveDrawingBuffer:false`, `powerPreference:'low-power'` and `failIfMajorPerformanceCaveat:true`. Clearing uses transparent black. The selected Three renderer requires WebGL 2; unsupported or rejected creation falls back to DOM. Shader compilation uses `compileAsync` before the visible crossing, then one hidden render and clear. [Three.js WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html)

## Preparation, fallback and lifecycle

The existing Atrium request still starts at master 0.16 and must decode before its visual journey can advance. While its image is pending or failed, the master clamps visual bridge progress to 0.48, retaining readable Scene 2. The sky controller receives this same image-gated progress and cannot obscure that fallback. Under normal loading, Three preparation follows at 0.30, separating image preparation from visible shader work.

If import or compilation finishes after the viewer has already entered the active cloud interval, the controller leaves that entire crossing on the original DOM transition. It arms only after progress exits the interval; a later forward/reverse crossing can use the warm renderer. Async completion samples current progress and never restarts the narrative at zero. A generation token invalidates late import/compile work after failure or destruction. Capability and visibility are checked again before an awaited import creates WebGL.

Import rejection, WebGL initialization failure, partial setup failure, shader error, render failure and context loss opt into DOM fallback. The canvas is hidden and resources are released; the master is scheduled to restore its original Breeze contribution. A lost context is not repeatedly recreated during the same Home mount. A later Home mount may attempt one fresh context. The fallback retains accessible DOM content without an error screen.

Shader link errors may be reported during the first `render()` without throwing, after `compileAsync()` has resolved. Both hidden warmup and visible drawing now check the shader-error flag after rendering returns, before clearing or accepting the frame as ready/active. The callback only records the failure; resource disposal happens outside Three's render call. Regression checks cover warmup, the first visible render after skipped warmup, the first visible render after successful warmup, and an already active crossing, including one-time cleanup and no retries.

`update`, `suspend` and `destroy` belong to the existing HomeStory lifecycle. The bridge adds no RAF, interval, timeout, scroll listener, resize listener, visibility listener or React animation state. Identical progress/size signatures skip rendering. When the document becomes hidden, the existing owner cancels its scheduled frame and calls `suspend`; Footer/out-of-view and final progress hide the canvas without continued draws. There is no idle shader animation even inside the bridge.

Warm resources remain available while HomeStory is mounted, so reverse scrolling avoids a new renderer and first-use compilation. If a warmed viewport later becomes mobile or reduced-motion, the canvas stays hidden and dormant; its one retained context may remain until unmount. A fresh mobile/reduced mount creates none.

Unmount removes context listeners, disposes the shared geometry and all four materials, clears the scene/render lists, disposes the renderer, requests context loss and removes the canvas. Partial construction is disposed too. The owner disconnects its existing observer/listeners and restores owned DOM attributes. Explicit object disposal is required by Three's lifecycle model; requested disposal is not a measurement of when the GPU driver reclaims memory. [Three.js object disposal](https://threejs.org/manual/pages/how-to-dispose-of-objects.html)

## Visual tuning iterations

The implementation has undergone more than two tuning iterations:

1. Removed the nearly uniform peak treatment and retained procedural density/shading through the inside-cloud phase.
2. Shaped asymmetric left/right/upper/lower cloud banks with softer broken edges and an irregular exit aperture.
3. Added restrained near-field contrast and directional relief so projected close-ups retain cloud structure instead of cropping to a featureless center; reused the existing FBM budget.

The final recording supplies all ten critical checkpoints. At 45–55%, broad warm/cool cloud structure remains visible while architecture is obscured; at 65%, irregular blue gaps open; 75–85% reveals the actual sky and foliage; 95–100% has no WebGL contribution. The final Atrium has neither cloth nor cloud. This is local visual evidence, not acceptance across every browser or GPU.

## Automated verification

`scripts/check-atmospheric-sky.mjs` runs the real controller against a deterministic renderer boundary. It checks bounded/reversible camera and uniform mapping, monotonic depth, viewport/pixel budgets, swap coverage intent, one context, hidden preparation, no repeated idle draws, reverse reuse, 20 crossings, responsive/reduced fallback, initialization/partial-setup/render/context failures, delayed import/compile behavior and ten route cleanups. It does not render GLSL or measure browser performance.

`check-home-chapters.mjs` now checks integration ownership, image gating, restoration, atmosphere-to-cloth handoff and cleanup. Existing room discovery, motion, DOM bridge, Breeze and scene-image checks remain in `check:home`. The final post-tuning runs exited successfully. `work/pass3b/home-checks.log`, `typescript.log`, `lint.log`, `build.log` and `routes.log` hold their output. Intro and hero checks also passed after the production browser runs.

| Final validation item                           | Result                                           |
| ----------------------------------------------- | ------------------------------------------------ |
| `yarn check:home`                               | Passed, all seven scripts, final shader revision |
| TypeScript (`tsc --noEmit`)                     | Passed, exit 0, no diagnostics                   |
| Lint (`oxlint`)                                 | Passed, exit 0, no diagnostics                   |
| `yarn build:vercel`                             | Passed, final shader revision                    |
| Existing hero/intro and route regression checks | Passed                                           |
| `git diff --check`                              | Passed                                           |

## Browser QA and measurements

Production preview: `http://127.0.0.1:4520/`. Local QA proxy: `http://127.0.0.1:4519/`. Browser instrumentation, controls and artifacts live only in ignored `work/pass3b`; they are not part of the production page.

The harness records ten local bridge checkpoints (0, 0.15, 0.30, 0.45, 0.55, 0.65, 0.75, 0.85, 0.95 and 1) forward and reverse. Its matrix combines full-story and bridge checks at 14 viewports. Resize/orientation samples include active atmosphere at master 0.60/0.70. Separate controls run 20 reverse cycles, ten actual SPA route cycles, final/Footer idle probes and intentional `WEBGL_lose_context` fallback.

Canvas/context/resource tracking uses weak references. Cumulative created contexts legitimately rise across Home remounts; acceptance concerns at most one live context on Home and no retained live context/resources away from Home. GL API counts include buffers, programs, shaders, textures and explicit deletions/context-loss release. These are allocation/lifecycle observations, not exact VRAM. Compile-call durations cover JavaScript/API submission only, not GPU compilation time. QA does not use `readPixels` or retain framebuffers for measurement.

### Chrome, responsive and lifecycle results

Chrome **154**, at **1680×829**, with a fine pointer and normal motion passed all nine checks in `work/pass3b/sky-stress.json`. The 20 forward/reverse bridge cycles reused one WebGL 2 context and one canvas. Every cycle checkpoint contained **583 DOM elements**, **204 scoped listener registrations**, one ResizeObserver observing three targets, zero pending product RAF callbacks and zero detached live contexts. The action took **29.85 seconds**, including its final/Footer idle probes. It recorded no runtime exception, and all recorded checkpoints reported the document visible.

Both final-scene and Footer idle probes recorded **zero additional draw calls, clear calls or product RAF callbacks**. WebGL totals remained 1367 draws / 483 clears. The final hold retained RAF executed count 1170; the Footer hold retained 1171 after the one scroll update. Each probe used a scheduled **500ms** wait after settling. Snapshot capture timestamps were not saved, so the exact elapsed idle duration is unavailable; these are short inactivity checks, not the earlier PASS 5 five-minute run.

All ten Home→Worlds→Home cycles completed through the same document in **27.51 seconds**, with every lifecycle/link check true in `work/pass3b/navigation.json`. Each returned Home contained **591 DOM elements**, 204 scoped listener registrations, one canvas/context and one ResizeObserver with three targets. Worlds checkpoints contained **351 DOM elements**, 180 scoped registrations, zero canvas/live contexts, zero observed resize targets and no pending product RAF. The initial Home before route cycling contained 585 nodes; the first remount reached 591 and the next nine remounts stayed there. The report does not treat that one-time difference as zero DOM change.

Context creation totals moved from **1 to 11** across ten remounts, while the maximum simultaneously live context count remained **1**. Each unmount removed the bridge context listeners and returned all tracked GL resource live counts to zero. Header and clicked-link interactivity checks passed. No captured runtime exception occurred. The compact derived evidence is `work/pass3b/stress-summary.json`.

#### Responsive matrix and orientation

All **14 viewports passed 43 checks each** in `work/pass3b/matrix.json` (602 true results). Every viewport ran the full story plus ten local sky checkpoints in both directions. Checks covered stable viewport, overflow, one owner/stage/Header/TP, one Atrium image, exclusive architecture, hidden/final link accessibility, decorative canvas coverage, appropriate context tier, reverse reactivation, final Breeze/canvas absence, final stillness and no captured runtime errors. Maximum sampled local-to-master progress error was **0.00046**, within the 0.001 tolerance for native scroll-pixel rounding.

The five fresh viewports below 768px created **no canvas or WebGL context**. The other nine created exactly one scoped canvas/context and kept it dormant at the final hold. All iframe samples inherited a fine pointer and normal motion; these results establish width-responsive behavior, not touch hardware or reduced-motion coverage. Canvas edge checks compare its bounds to the stage; they do not establish cloud opacity or perceptual match-cut quality.

| Actual CSS viewport | Observed tier | Live context | Observed drawing buffer | Effective buffer-width ratio |
| ------------------- | ------------- | -----------: | ----------------------- | ---------------------------: |
| 320×568             | DOM fallback  |            0 | None                    |                            — |
| 360×800             | DOM fallback  |            0 | None                    |                            — |
| 375×812             | DOM fallback  |            0 | None                    |                            — |
| 390×844             | DOM fallback  |            0 | None                    |                            — |
| 430×932             | DOM fallback  |            0 | None                    |                            — |
| 768×1024            | Tablet        |            1 | 960×1280                |                       1.2500 |
| 820×1180            | Tablet        |            1 | 1025×1475               |                       1.2500 |
| 1024×768            | Tablet        |            1 | 1280×960                |                       1.2500 |
| 1280×800            | Desktop       |            1 | 1920×1200               |                       1.5000 |
| 1366×768            | Desktop       |            1 | 2049×1152               |                       1.5000 |
| 1440×900            | Desktop       |            1 | 2116×1322               |                       1.4694 |
| 1728×1117           | Desktop       |            1 | 2081×1345               |                       1.2043 |
| 1920×1080           | Desktop       |            1 | 2231×1254               |                       1.1620 |
| 2560×1440           | Desktop       |            1 | 2231×1254               |                       0.8715 |

Ratios above are calculated from actual buffer width ÷ CSS viewport width, after integer buffer rounding; height ratios can differ slightly. They are effective rendering resolution, not the display's hardware DPR. All active buffers stayed within their 1.6-million/tablet or 2.8-million/desktop pixel budgets. Large-screen resolution therefore stopped growing automatically with the viewport.

`work/pass3b/resize.json` passed **40 samples** on one mounted iframe at master 0.30, 0.60, 0.70 and 0.95. The sequence covered 1920×1080 → 1440×900 → 1024×768 → 768×1024 → 390×844 → 844×390 → 390×844 → 820×1180 → 1180×820 → 820×1180. Maximum progress error was **0.00023**; no horizontal overflow, exposed canvas bounds or detached live context was reported. One context was created and retained throughout; final camera transforms returned to `none`.

The initial 1920px cold crossing was still `warming` at master 0.60 and `ready` at 0.70, so it intentionally used the DOM fallback for that crossing. Subsequent capable-size crossings recorded `active` WebGL. At each 390px portrait step, the retained warm context/canvas became dormant and draw-call totals stayed unchanged through all four stops (18 for the first visit, 22 for the second). Rotating to 844px landscape activated the tablet tier; later 820↔1180 rotations updated active drawing buffers to 1025×1475 and 1475×1025. This verifies reuse and resize behavior without claiming zero retained contexts after resizing an already warmed desktop into mobile.

The matrix uses actual browser iframe viewport dimensions with a CSS-scaled preview; it is not device emulation, physical-phone memory testing or a Safari orientation test. Detailed derived figures are in `work/pass3b/matrix-summary.json`.

Chrome native Rendering emulation of `prefers-reduced-motion: reduce`, followed by a fresh Home load, passed all 15 bridge checks across 20 forward/reverse checkpoints at 1680×829. It created zero canvases/contexts and made zero GL draws (`reduced-sky-checkpoints.json`). Emulation was reset afterward. Intentional `WEBGL_lose_context` passed all six checks: live context released, master progress preserved, canvas unpainted, final links available, reverse restoring Scene 2, and no added runtime exception (`sky-context-loss.json`). Native touch hardware and restored-history behavior were not retested in this pass; earlier PASS 5 evidence is not substituted.

### FPS and main-thread observations

The native Chrome 154 trace `work/pass3b/pass3b-performance.json` spans **333.244 seconds**, including long waits before/after interaction. Its scripted motion occupies **27.340 seconds**, from trace +64.096s to +91.436s. That narrower window was recovered from six groups of the QA `move` callback; each group's callback count exactly matches the corresponding `profile.json` interval count plus one. The window includes short settling waits between phases and excludes the later room hovers and final/Footer probes. Full-capture idle is not used to dilute active-motion results.

`profile.json` recorded **1489 RAF intervals**: median **16.7ms**, p95 **17.7ms**, maximum **99.5ms**, with **37 intervals above 33ms**. Results by phase are below. These are browser RAF cadence measurements in the instrumented existing Chrome profile, not guaranteed presentation FPS or physical-device certification. Slow forward, fast flick and finish have visible timing outliers; this does not justify a claim of uninterrupted 60 FPS.

| Script phase       | Trace phase duration | Intervals | Median / p95  | Maximum | Intervals >33ms |
| ------------------ | -------------------: | --------: | ------------- | ------: | --------------: |
| Slow forward       |              11.006s |       630 | 16.7 / 17.7ms |  84.3ms |              20 |
| Reverse            |               8.504s |       511 | 16.7 / 17.6ms |  17.8ms |               0 |
| Fast forward flick |               0.558s |        26 | 16.7 / 50.5ms |  99.5ms |               3 |
| Reverse flick      |               0.362s |        22 | 16.7 / 17.6ms |  17.6ms |               0 |
| Stop inside cloud  |               1.005s |        61 | 16.7 / 17.6ms |  17.7ms |               0 |
| Finish             |               4.505s |       239 | 16.7 / 33.3ms |  67.1ms |              14 |

During that motion window, the page main thread's maximum `RunTask` was **12.796ms**, Layout **1.158ms**, Paint **2.584ms**, UpdateLayoutTree **3.286ms**, and Layerize **0.487ms**. There was no page-main-thread task above 50ms in the motion window; the separate page PerformanceObserver also recorded no long task. The full trace's one page long task was **204.274ms** at profiler startup, including **188.521ms** in `CpuProfiler::StartProfiling`. The full trace's maximum Layout was 9.628ms outside the scripted motion window. Event durations are inclusive and can overlap; these numbers are not sums of DevTools' exclusive category totals.

This recording used an **already initialized renderer**. The saved profile starts at master **0.58133**, with `skyState:'active'`, one context, four prior shader-compilation calls and two prior program links. Compilation/link counts stayed unchanged through the run. This supports warm reuse; it does not measure first-load shader preparation or prove that a cold compile never stalls. No trace evidence attributes the RAF outliers specifically to shader compilation, layout or one other subsystem.

The stopped-cloud phase kept cumulative draws fixed at **3761** despite the QA sampling clock continuing. Final-scene and Footer probes each recorded zero additional WebGL draws/clears and zero product RAF callbacks. This verifies that the shader does not run an independent idle animation in those samples.

For this separate profiled run, `performance.memory.usedJSHeapSize` samples ranged **52.33–53.52 MB**, from 52.46 MB before the action to 52.86 MB afterward. Main-renderer DevTools heap counters ranged **37.41–39.49 MB during motion**, and **36.58–40.31 MB across the full trace**. Those APIs have different scope/sampling and are reported separately. During motion, DevTools counters held at one document, 1223 nodes and 1224 listener registrations; these broader counters include runtime/browser integrations and differ from the scoped lifecycle harness. The derived analysis is in `work/pass3b/trace-summary.json`.

### RAM, context and GPU observations

Across the stress baseline, 20 cycle checkpoints and idle/end samples, `usedJSHeapSize` ranged **66.36–68.83 MB** and ended at **68.64 MB**; the last cycle checkpoint was 68.72 MB. Navigation baseline/cycle/end samples ranged **68.64–78.68 MB**, ending at **77.03 MB**. MB here means decimal bytes. Natural GC drops are visible, but the navigation endpoint remains above baseline. QA itself retains growing arrays of complete state snapshots and cumulative counter snapshots. No forced GC or heap-retainer analysis was performed, so this run establishes stable explicit resources, not zero JavaScript retention or exact RAM recovery.

The warmed context's actual API counts remained fixed through all 20 bridge cycles:

| GL resource                                          | Live on warmed Home | Live after Home unmount | Observed release                                                     |
| ---------------------------------------------------- | ------------------: | ----------------------: | -------------------------------------------------------------------- |
| Buffers                                              |                   4 |                       0 | Four explicit deletes                                                |
| Programs                                             |                   2 |                       0 | Two explicit deletes                                                 |
| Shader objects                                       |                   0 |                       0 | Four created/compiled objects had already been deleted after linking |
| Vertex arrays                                        |                   2 |                       0 | Two explicit deletes                                                 |
| Textures                                             |                   4 |                       0 | Released by context loss                                             |
| Framebuffers                                         |                   3 |                       0 | Released by context loss                                             |
| Renderbuffers, queries, samplers, transform feedback |                   0 |                       0 | None allocated in these observations                                 |

The app loads **zero texture assets**, but Three creates internal fallback textures/framebuffers. It would therefore be incorrect to report zero raw GL textures or framebuffers. One drawing buffer was **2382×1175** pixels (2,798,850 pixels) at the 1680×829 viewport, within the configured 2.8-million-pixel desktop budget. Four material objects share two linked GL programs; geometry/material object counts and GL buffer/program counts describe different levels of the renderer.

At the final navigation snapshot, ten prior contexts had observed context-loss events and zero tracked live resources; five of their JavaScript context objects were still weakly reachable and five had been collected. Only context 11 remained connected as a live, dormant resource. A lost context is excluded from the live count even while its JavaScript object awaits collection. `releasedByLoss` is an API lifecycle accounting result, not a measurement of GPU-driver reclamation. Listener totals similarly record scoped add/remove operations, include framework/browser integrations and do not act as a heap-retainer census or decrement automatically on garbage collection.

The Performance trace contains **3921 `GPUTask` events tagged to this page's renderer**, including 3878 during the 27.340-second motion window. Motion-window task durations had p95 **2.172ms** and maximum **16.808ms**; their inclusive sum was 2493.827ms. These are recorded GPU-process task durations, not GPU timer-query measurements of cloud shader execution. Page raster workers recorded 14,852 RasterTasks during motion, with maximum 10.523ms; worker totals can overlap and cannot be added as elapsed main-thread time.

The same page-tagged GPU events reported a raw `used_bytes` field ranging **109.75–872.40 MB**. Its last reported value was 109.75 MB at trace **+124.119s**, before the 333.244-second recording ended; it is not an end-of-capture reading. The peak is material and should not be replaced by a claim that the 2.8-million-pixel buffer bounds total GPU use. These values cover the page renderer's work, including DOM/compositor activity, and are not established as exact VRAM, total GPU-process memory or cloud-only allocation. No GPU/VRAM counter-track events, isolated GPU benchmark or total-browser-RAM measurement were available. Other renderers/extensions were present, and there is no matched before/after baseline. Explicit context/GL resource counts remain bounded across the separate lifecycle run, but do not quantify total GPU memory reclamation.

### Safari and physical-device observations

Safari was opened through its native UI against the production QA proxy. The page loaded, but the automation session reported `document.hidden:true` at 1440×739 and its RAF-dependent checkpoint runner remained waiting after the window was raised. `work/pass3b/safari-initial.json` records that state, with no initialized bridge context at the snapshot. The test tab was closed afterward. Safari initialization, alpha/color handoff and reverse motion are therefore **unverified**, not passed or diagnosed as product failures. Physical iOS/iPadOS and lower-powered hardware also remain unverified; viewport testing is not device evidence.

### Final video and visual acceptance

`work/pass3b/homepage-pass3b.mp4` is the new 75.217-second H.264 recording (14.93 MB), with Loader, Scene 2 hold, normal forward/reverse, slow checkpoint progression/reverse, fast forward/reverse, final Atrium and Footer. It records actual Chrome output under software-paced native scrolling, not physical trackpad input. All 45 DOM samples retained a 1680×772 viewport. Source VP9 starts with two 3360×1546 capture-negotiation frames then stays 3360×1544; the portable export fits/pads the full image to 1680×772 without cropping. Exported 60fps is media cadence, not an application FPS measurement.

`bridge-contact-sheet.jpg` and `bridge-000.jpg` through `bridge-100.jpg` capture the ten requested local checkpoints; `final-scene3.jpg` shows the clean reading state. Each image selects the held source frame at its recorded checkpoint time minus 150ms. `video-summary.json` records timestamps, dimensions and conversion details. Review confirms architectural occlusion at the warm cloud peak, irregular cloud openings into the sampled blue sky, the DOM foliage/oculus reveal, and no final atmosphere or Breeze. The small cursor highlight belongs to the screen-capture session.

The recording precedes only the final restored/skipped-scene reverse-latch fix, which does not change the ordinary forward/reverse path shown in it. The final build and focused restored/late-compilation regression tests were rerun after that fix. On the final production build, a native UI jump straight to Scene 3, warmup, then reverse to master 0.75 showed all three Breeze pose opacities at 0; reverse to 0.72 reactivated the atmosphere. All 15 bridge checks across 20 checkpoints also passed again at 1680×829.

The browser evidence above predates the shader-error fallback correction. Its regression tests exercise the real controller against a deterministic renderer boundary, not actual GPU shader compilation; the browser performance and visual measurements were not repeated for that correction.

No deployment was performed. The localhost preview runs the final production build. Remaining limits are Safari/physical-device validation, exact VRAM/total browser RAM and heap-retainer analysis; the local measurements above do not imply universal 60fps or zero JavaScript retention.
