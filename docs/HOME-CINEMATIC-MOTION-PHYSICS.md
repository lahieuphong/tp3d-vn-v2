# Homepage PASS 4 — cinematic motion physics

PASS 4 retunes the existing HomeStory. Layout, typography, copy, images, cloth
geometry/material, Loader, navigation and Footer are unchanged. It adds no
library, portal, interaction, particle, video, Canvas or WebGL to the product.

## Audit and scope

The initial audit inspected the actual PASS 3 source and preserved a baseline
under ignored `work/pass4/baseline-source/`. Browser inventory initially timed
out. Native Chrome application control subsequently worked, allowing actual
recording, responsive checks and DevTools profiling. This report distinguishes
that evidence from mathematical checks.

The existing TP journey already had a weighted middle and zero endpoint
velocity. Its approved 0.12–0.42 path was retained. The still reading interval
0.42–0.48 is 17.6% of the 0.30–0.64 Scene 2 interval and was also retained.

Problems found in source:

- The quadratic cloth approach ended with nonzero velocity at 0.632. The cubic
  exit began with nonzero velocity at 0.646. Those joins could feel abrupt.
- A parent opacity/translation made Scene 2 text leave too synchronously.
- The previous camera curve left 8.37% of its distance in its last 30%.
- Large planes had no small post-input response; input stops immediately froze
  the visual target. Temporary camera promotion also persisted at paused frames.

These are source/curve findings, not claims from an unavailable baseline video.

## One motion model

`components/home/experience/home-motion.ts` centralizes bridge timing,
responsive values, departure roles, physical ratios, source framing, light,
UI timing and mass limits. Existing PASS 2 constants remain in its frame module.

There is one native story progress and one existing master RAF owner. Added
scroll scrub is **0**: no browser scroll interception or delayed scroll position.
The master samples asymmetric integrated velocity curves:

- Departure: `t⁴ × (5 − 4t)` — slow pickup, peak speed late, zero endpoint speed.
- Arrival: `1 − (1 − t)⁴ × (1 + 4t)` — gentle initial discovery, earlier speed
  peak, then a long decline. Its final 30% covers 3.078% of total travel.

Architecture, TP and Breeze share those impulses with small phase offsets and
depth gains. Editorial text uses its own short opacity/Y progression directly
from native scroll; it has no time filter. There are no forward-only completion
callbacks. Reversing input samples the same canonical pose.

## Timing and depth

| Layer/phase                       | Master progress and behaviour                                              |
| --------------------------------- | -------------------------------------------------------------------------- |
| Existing opening and reading hold | Unchanged through 0.48                                                     |
| Secondary labels                  | Depart 0.484–0.574, up to 6 px                                             |
| TP anticipation                   | 0.494–0.556; up to 4% smaller and 4 px higher on desktop                   |
| Body text                         | Depart 0.506–0.608, up to 9 px                                             |
| Main headings                     | Depart 0.526–0.631, up to 12 px                                            |
| TP depth                          | Overlapping 0.534–0.64; total scale reduction up to 19.5%, Y −26 px        |
| Architecture departure            | 0.55–0.64, small 0.9× depth response                                       |
| Breeze approach                   | 0.52–0.632, accelerated shared impulse                                     |
| Directional lens crossing         | 0.612–0.672, overlapping both approach and exit                            |
| Hidden world exchange             | 0.64, inside the fully covered 0.632–0.646 interval                        |
| Breeze release                    | From 0.646; faster 1.22× traversal, almost clear by 0.80                   |
| Sky suspension                    | Static sky framing until 0.705 desktop / 0.701 tablet / 0.686 mobile       |
| Oculus / camera                   | Same image framing opens gradually, then resolves to scale 1               |
| Camera endpoint                   | 0.91 desktop / 0.907 tablet / 0.895 mobile                                 |
| Header                            | Existing continuous dark-to-ivory mix 0.72–0.78                            |
| Interior exposure                 | 0.768–0.92, lagging architectural discovery                                |
| Rooms                             | Living 0.82–0.86; Bedroom 0.83–0.87; Bathroom 0.84–0.88; Kitchen 0.85–0.89 |
| Editorial/CTA                     | Eyebrow, title, body, signoff, CTA overlap from 0.846 to 0.92              |
| Final hold                        | 0.92–1.00: camera, cloth, light and UI fully still                         |
| Footer                            | Native sticky release after the hold; no added boundary effect             |

TP opacity assists depth modestly and remains later than departing text; the
foreground cloth conceals its final removal. The one cloth material/path is
unchanged. Its transform, not a growing mask or new image, hides the world swap.
The near-camera crossing remains brief and textured, rather than a blank frame.

Depth ratios in the configuration are architecture 0.90, artifact 1.00 and
Breeze traversal 1.22. No fictitious independently moving sky/cloud/foliage layer
is added: they remain baked into the one approved Atrium photograph.

## Bounded visual mass

Only the Scene 2 architectural plane and Scene 3 camera receive temporal mass.
They use an exponential response with a conservative combined translation plus
scale edge-displacement budget. The existing master RAF runs only while that
small residual remains, then sleeps and releases its temporary `will-change`.
Since PASS 6B.1 the Scene 3 camera takes no `will-change` through the bridge:
its pose is written in 2D so the photograph is drawn directly (see
`TANPHONG_HOME_MOTION_CONTEXT.md` §18, item 11). The mass itself is unchanged.

| Profile            | Depth gain | Breeze directional gain | Mass time constant | Maximum residual                |
| ------------------ | ---------- | ----------------------- | ------------------ | ------------------------------- |
| Desktop ≥1200 px   | 1.00       | 1.00                    | 44 ms              | 2.4 CSS px; scale delta ≤0.0025 |
| Tablet 768–1199 px | 0.75       | 0.75                    | 36 ms              | 1.6 CSS px; scale delta ≤0.0018 |
| Mobile <768 px     | 0.50       | 0.58                    | Disabled           | Zero                            |

These are implementation limits, not browser performance measurements. The
response snaps only its final sub-0.04-pixel residual to exact rest. Simulated
30/60/120 Hz input converges inside 220 ms with no overshoot. A frame gap above
64 ms resolves directly to the current target, avoiding a queued catch-up tail.
Resize, restored pages and reduced motion reset old mass before rendering.

Text, Header, room labels, CTA, interaction gates and the occluding cloth always
follow current native progress immediately. Desktop labels track the canonical
camera plane; the architectural residual underneath is limited to the pixel
budget above. Controls keep their existing per-element visibility gates.

## Responsive and reduced motion

The existing 360/320/280svh story heights stay unchanged. Mobile keeps one painted
cloth projection, shorter sky framing and an earlier camera endpoint, with no
inertia. Tablet keeps reduced depth and mass. Final image and room compositions
return to their approved exact transforms at every size.

Reduced motion bypasses physics entirely: short dissolve, static sky, static
Atrium, opacity-only content. The framing cut retains the PASS 3 opacity floor
0.65, so stopping exactly at 0.745 cannot produce an empty viewport.

The full source remains 1672×941, with only 160–176 native sky pixels available
vertically. Clean sky framing still needs roughly 5.35–5.88× camera scale; mobile
cannot halve that zoom while retaining a genuine sky-only crop. No silent asset
replacement or invented parallax masks this limitation. Sky close-up softness
remains visible; the final Atrium uses the original approved framing.

## Refinement and debugging

Two implementation refinement rounds are saved under `work/pass4/`:

1. Asymmetric impulses, staggered text departure, longer arrival tail and
   bounded architecture-only mass, followed by numeric boundary/lifecycle checks.
2. Overlapping the lens crossing with approach/exit, releasing paused camera
   promotion and verifying immediate UI/interaction plus repeated reverse input.

Twenty-two labelled mathematical previews inspect eleven bridge checkpoints
(0–100% in 10% steps) at desktop and mobile dimensions. They verify framing only;
the flattened pre-swap underlay does not prove live text ordering or compositing.
These refinements are not presented as two completed video-review rounds.

The final native Chrome recording was then reviewed through extracted frames.
It covers constant-speed forward and reverse input plus pauses during Breeze,
sky and Atrium arrival. The departure reads in layers, the cloth covers the
exchange, architecture emerges from the sky, and the final destination is clean.
The existing sky crop remains visibly softer than the final interior. No further
product change was justified by this review.

Development `?storyDebug=1` shows native progress, bridge label, easing phase,
TP state, Breeze approach/release, target Scene 3 scale, rendered camera scale
and whether mass is settling. The overlay is compiled out of production.

## Verification

- Lint, TypeScript and production build passed.
- The production crawl passed 44 pages, 75 image URLs and 8 expected invalid
  route cases.
- Pure geometry/physics checks cover 12 viewports, velocity joins, camera edge
  coverage, bounded mass at 30/60/120 Hz, paused frames and reverse equality.
- Actual cloth coverage is sampled over 16 responsive sizes around the swap.
- Lifecycle tests cover 20 forward/reverse cycles on each of three widths,
  immediate interaction/UI, no settle-time layout reads, stalled frames,
  resize/restoration, reduced mode and 30 complete unmounts.
- Native Chrome at 1680×829 passed all HomeStory checks: one stage/header/TP,
  one Atrium image/cloth definition, no Canvas/WebGL, correct hidden controls,
  reverse equality, final stillness, Footer contact and no runtime errors.

The native Chrome iframe matrix also passed all 12 requested viewport sizes
(375×812 through 2560×1440). The iframe presentation is scaled to fit the host
window, but its actual layout viewport has the exact reported dimensions. This
is real browser layout/interaction verification, not mobile hardware testing.

Reduced-motion Chrome verification also passed all 21 HomeStory checks at
1680×829, including reverse equality, hidden controls, a Breeze-free final scene,
stillness and no runtime errors. This uses the QA proxy's reduced-motion media
override; the operating system preference is not changed.

The saved recording is approximately 38 seconds at a stable 1680×772 CSS-pixel
viewport (3360×1544 encoded pixels). The browser's capture indicator accounts for
the height difference from the unrecorded viewport. Eleven additional native
video frames cover local bridge progress 0–100% in 10% steps. The recording uses
scripted native scroll at constant speed, without changing the product runtime.
Small native OS scroll inputs and a reversal were also inspected through the
cloth crossing. A physical trackpad, discrete wheel hardware and mobile touch
hardware were not separately tested.

### Performance observations

Chrome DevTools recorded slow forward travel, reverse travel, fast flicks,
stop/start, final hold and Footer idle. Docking DevTools produced a 1149×829
layout viewport. CPU/network throttling were disabled. Existing extensions and
the QA instrumentation were present, so these are local observations rather
than an isolated benchmark. The full trace lasts approximately 41.39 seconds.

| Measurement                       | Observed result                                                                     |
| --------------------------------- | ----------------------------------------------------------------------------------- |
| QA rAF cadence during the profile | Median 16.7 ms; p95 17.7 ms; 32 of 1,511 intervals above 33 ms; maximum 50.8 ms     |
| Page main-thread Layout           | 778 events; 36.63 ms total; maximum 1.763 ms                                        |
| Page main-thread Paint            | 2,197 events; 142.54 ms total; maximum 3.749 ms                                     |
| Page main-thread UpdateLayoutTree | 1,189 events; 362.66 ms total; maximum 2.428 ms                                     |
| Page main-thread Layerize         | 1,420 events; 132.48 ms total; maximum 1.377 ms                                     |
| Main-thread tasks above 50 ms     | One 161.672 ms task at trace start; 155.540 ms inside `CpuProfiler::StartProfiling` |
| DevTools displayed local CLS      | 0 in this recording                                                                 |
| DevTools displayed local INP      | 69 ms for the measured interaction, not a field metric                              |

The trace attributes its sole long task to profiler startup. The separate
PerformanceObserver recorded no long tasks during the driven motion sequence.
Cadence is not a measured display FPS guarantee. Layout and painting still occur;
this is not a claim that the existing SVG cloth and all content are compositor
only. There is no matched PASS 3 trace, so a numerical performance improvement or
regression percentage cannot be established.

### Memory and compositing observations

Twenty complete Scene 2 → Scene 3 → Scene 2 cycles completed in Chrome at
1680×829. From cycle 1 through cycle 20, DOM nodes stayed at 572, window/document
listeners at 155, ResizeObserver targets at 3 and IntersectionObserver targets
at 12. One stage, TP, cloth definition and Atrium image remained. No Canvas or
WebGL contexts were created. There were zero pending animation frames at each
settled checkpoint and zero product RAF callbacks during final idle.

The instrumented stress run's reported JS heap was 78.74 MB before, 80.00 MB at
cycle 1, 81.03 MB at cycle 20 and 81.44 MB after. The QA itself retains checkpoint
objects; this does not prove absence of every possible memory leak. Counts did
not grow over the repeated cycles. Its cadence median/p95 was 16.7/17.7 ms, with
8 of 800 intervals above 33 ms and no observed long tasks.

The separate DevTools trace reports a 31.9–34.1 MB JS heap range after profiler
startup/collection, two documents, 1,185–1,186 renderer nodes and a listener
count declining from 1,182 to 1,165. These renderer counters have a different
scope from the page-global QA counters and must not be compared as equal metrics.

The source promotion audit confirms that added camera/architecture `will-change`
is limited to active settling and is released at rest. The trace contains
compositor activation, raster and layer creation/deletion work. Its layer events
do not identify a reliable simultaneous layer count. GPU-memory counters are
absent, and the GPU process is shared with other tabs; isolated GPU load, VRAM and
total browser RAM are **not measured**. No GPU-memory or physical-device claim is
made from these results.

### Saved evidence

All detailed QA artifacts are local and ignored by Git under `work/pass4/`:

- `atmospheric-bridge.webm`, `recording.json` and `recording-contact.png`.
- `browser-bridge-000.jpg` through `browser-bridge-100.jpg` with timestamps in
  `browser-checkpoints.json`.
- `matrix.json`, `story-*.json` and `reduced-story-1680.json`.
- `profile.json`, `stress.json`, `chrome-performance.json.gz` and
  `trace-summary.json`.
- `verification-summary.json`, source check logs and both refinement records.

Production preview: `http://127.0.0.1:4510/`.
Ignored QA controls/recorder: `http://127.0.0.1:4515/`.
