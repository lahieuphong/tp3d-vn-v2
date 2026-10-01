# Homepage atmospheric camera pass

Implementation record for the 2026-10-01 Scene 2 → Scene 3 upgrade. This replaces
previous timing and performance claims in this document. Approved Arrival,
Philosophy, Enter the worlds, navigation and Footer compositions remain the basis
of the page. Verification of this pass is recorded separately below.

The UNESCO reference recording was not available in the supplied attachment.
The implementation follows the motion principles described in the brief; it does
not claim a frame-by-frame study of that recording or reproduce its artwork.

## Selected implementation and ownership

**Mode A: native-scroll DOM/SVG 2.5D.** The audited project has no installed GSAP,
ScrollTrigger, smooth-scroll, Three.js, React Three Fiber or OGL dependency. No
library was installed. The existing scene assets are flat plates, so a canvas
would add resource and lifecycle costs without supplying missing scene geometry.
Main typography, navigation and interactions remain HTML.

`HomeStory` owns one 100svh sticky viewport. Its document height remains 360svh on
desktop, 340svh on tablet and 300svh on mobile; Footer follows in normal flow.
`createHomeStoryTimeline` samples one normalized native-scroll progress, `p`, for
Arrival, shared TP, Philosophy, fabric, camera, light, Worlds content and rail.
The Scene 2 → Scene 3 bridge begins at `p = .34`; its local progress is
`clamp((p - .34) / .66)`. The timeline below uses **master progress**, unless
explicitly marked as bridge-local.

There is one scroll listener and an on-demand RAF, no React state update per
frame, wheel interception or smoothing of browser scroll. Geometry is cached
between layout changes. Unchanged styles are skipped; rail progress properties
are written on the rail rather than inherited throughout the stage. The former
independent Hero and StoryWorldBridge controllers remain removed. Hidden tabs
cancel scheduled work, and unmount removes listeners, observers, pending work
and retained callbacks.

## Audited assets and limits

See the [asset audit](SPATIAL-HERO-ASSETS.md#scene-2--scene-3-layer-audit--2026-10-01)
for source provenance and exact export sizes.

| Layer                                                          | Actual available resource                                                                            |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Scene 2 background                                             | Opaque `architecture-b.png`, 1586 × 992; responsive 720/1280/native WebP exports                     |
| Shared TP                                                      | Existing transparent inline SVG, 360 × 550 coordinate system, reused stone texture                   |
| Rear/front Breeze                                              | Two complementary projections of one existing SVG cloth definition; one painted projection on mobile |
| Scene 3                                                        | One opaque `worlds-atrium.png`, 1672 × 941; 720 × 405, 1280 × 720 and native WebP exports            |
| Sky, foliage, oculus/rim, architecture, tree, floor/reflection | Baked into the same Atrium plate; no separately authored layers                                      |
| Depth map                                                      | Not available                                                                                        |
| Alternative photographic fabric                                | Existing alpha ribbon 1448 × 1086 and intro cloth 1536 × 1024; not new transition layers             |

No new scene artwork, upscaled replacement files, separated depth planes or
textures were generated. Runtime camera framing still enlarges the existing
plate: its sky opening contains only about 200 native vertical pixels. A full
sky viewport therefore requires approximately 4.8–5× framing rather than a
1.16–1.24× crop. The former audit framing sampled about 301 × 188 source pixels
at 1440 × 900 and 335 × 188 at 1920 × 1080. The present small sky advance does not
restore that missing detail. At 2560px width, even the final 1672px full plate is
enlarged approximately 1.53×.

This is an explicitly resolution-limited single-plate fallback. A matching
high-resolution sky/foliage plate, authored oculus/architecture separation and a
higher-resolution final Atrium would improve fidelity. Independent sky, foliage,
tree or reflection parallax is not claimed. Mobile and tablet sources stay
bounded to 720px and 1280px respectively; desktop uses the existing responsive
source set.

## Camera choreography

| Master progress          | Behavior                                                                                            |
| ------------------------ | --------------------------------------------------------------------------------------------------- |
| 0–.16                    | Quiet Arrival hold                                                                                  |
| .16–.34                  | Headlines and portals leave with stagger; the same TP settles into Philosophy                       |
| .27–.34                  | Manifesto enters as the approved Scene 2 architecture settles                                       |
| .34–.48                  | Composed Philosophy reading hold; bridge-local progress 0–.212                                      |
| .48–.61                  | Architecture advances gently, text recedes, and TP moves deeper                                     |
| .495–.575                | Breeze broadens and approaches the camera; rear contribution transfers to the front projection      |
| .565–.61                 | Directional sky reveal crosses behind the near-camera cloth; Scene 2 is hidden by .61               |
| .61–.705 desktop/tablet  | Sky void, with no manifesto, main title, room labels, CTA or final Atrium composition               |
| .61–.69 mobile           | Shorter sky void                                                                                    |
| .61–.67                  | Cloth travels out and dissolves; it is gone before the architectural pull-back                      |
| .705–.895 desktop/tablet | Oculus and Atrium reveal through one camera framing trajectory, ending at scale 1 and translation 0 |
| .69–.885 mobile          | Earlier camera reveal/rest with reduced depth                                                       |
| .825–.92                 | Living → Bedroom → Bathroom → Kitchen, then eyebrow, title, body, signoff and CTA                   |
| .92–1                    | Final 8% remains still and clean; native scrolling subsequently releases into Footer                |

The sky void is 9.5% of master progress on desktop/tablet, or approximately
14.4% of the Scene 2 → Scene 3 bridge. Mobile uses 8% of master progress,
approximately 12.1% of the bridge. The end of the cloth passage occupies the early
part of that void; no Worlds UI is introduced there.

The final full-content hold spans 20.8svh desktop, 19.2svh tablet and 16svh mobile.
Room links become available after `.905` and their individual reveals complete;
the CTA completes at `.92`. Hidden or moving links remain inert. Reverse scroll
samples the same functions and restores their eligibility from progress.

### Shared camera and TP

The Scene 2 forward push uses a perspective-like reciprocal scale with depth
factors 1/.7/.5 for desktop/tablet/mobile. SharedTP recedes through the inverse
relationship, while its disappearance derives from the same crossing value as
the sky reveal. It does not use a separately scheduled opacity clock. Main copy
loses emphasis before the occluded architecture change.

The actual Scene 3 sky has a very slow scroll-bound advance: up to 1.8% framing
change and .6% viewport-height translation, reduced by device depth. Sky and
foliage move together because they share one source plate. The optical origin is
at 11.6% of the covered image height. Image translation is clamped to retain
coverage.

Oculus geometry enters from the viewport edges as the existing photograph pulls
back. No circle grows from zero, floating image card or ellipse portal is added.
Camera depth is interpolated logarithmically, with the asymmetric arrival curve
`1 - (1 - t)^4 * (1 + 4t)`. It covers about 97% of its depth progression in the
first 70% of the interval, leaving a slow final tail. The trajectory passes
through the requested restrained 1.16–1.24× framing near arrival; the larger
opening sky crop remains the source-resolution compromise described above.

Only desktop architecture may settle by at most 2px/.25% scale for roughly
180–200ms. Tablet and mobile have **zero camera inertia**. Text, header, links and
native scroll never inherit this delay. The final pose and all bridge exposure
contributions stop changing before the final hold.

### Breeze, light and refinement

The existing cloth silhouette, twelve folds and thirty-seven threads share one
geometry definition. Its width is calculated across the spine's normal. As it
approaches, the cloth broadens, changes curvature, rotates slightly and moves
into the front projection. Local opacity increases within the fabric, retaining
translucent edges and visible weave; no full-screen white panel or animated blur
is introduced.

A directional reveal of the actual sky occurs behind that cloth, rather than
crossfading two fully readable room compositions. Exit combines a continuing
geometric sweep, translation of up to 40% viewport width and a final dissolve.
The rear projection is gone by `.575`; all cloth is gone by `.67`, before the
Atrium pull-back begins. The final Enter the worlds frame contains no Breeze or
transition atmosphere.

The candidate recording prompted a motion refinement: softer cloth-edge opacity,
more visible thread contrast and greater exit translation. The refined renderer
attenuates thread detail by 24% at peak approach, keeping 76% rather than washing
out the weave. Near-lens edge gradient stops are .14/.13 while interior stops
reach .70/.74. This is a bounded SVG material adjustment, not a blur/filter pass.

Local warm light peaks at .035 in Scene 2 and .06 around the sky threshold, then
settles with the interior arrival. Temporary header shading also disappears;
the approved final photographic readability treatment remains. These are
lightweight gradients. No full-image animated brightness, post-processing or
continuous final-scene animation is added.

## Preparation, fallbacks and access

`prepareBridgeImage` observes the HomeStory owner with a `120% 0px` root margin.
It promotes the existing responsive Atrium image to eager/auto priority before
the bridge is reached, then awaits decoding. It does not create another Image
object or duplicate texture. The helper handles cached completion, image errors,
responsive-source races, unavailable IntersectionObserver and cleanup. An absent
IntersectionObserver starts preparation immediately.

If native scrolling outruns decoding, only visual progress is held at `.48`,
preserving the complete Philosophy composition while browser scroll remains
native. Once decoded, the next frame samples the native position. A failed image
is hidden and the Worlds HTML remains available over the static fallback color;
the page is not trapped behind a loader. Delayed decoding and image failure were verified in the browser as described below.

Reduced motion uses normal document flow and fully available content. Between
Philosophy and Worlds, a short static sky strip uses a crop of the **same existing
Atrium plate**, followed by the static Atrium. It is not a separately authored sky
layer. Conditional picture sources request that plate only for reduced motion;
normal mode has no extra scene-image request from this strip. Its readiness
opacity transition is 180ms; there is no large camera travel, cloth, rail or
inertia. The sky crop carries the same resolution limit as the primary plate.

The chapter rail remains decorative and desktop-only (at least 1200px), fades
through the void and stops progressing at final stillness. Approved room and CTA
hover/focus treatments are retained: a small room-label shift and underline,
220ms thumbnail crossfade, CTA image scale 1.035 and arrow movement 4px. Touch
layouts do not gain hover or pointer parallax. Main content stays semantic HTML.

## Current-pass verification and measurements

Verified on the production build in Chrome on 2026-10-01. The recorder/film tab
was closed during cadence, stress and navigation measurements. QA controls and
installed extensions were present. Evidence is in ignored
[work/atmosphere-pass](../work/atmosphere-pass/); its
[harness README](../work/atmosphere-pass/README.md) documents scope.

All twelve requested viewports completed the entire forward/reverse story:
375×812, 390×844, 430×932, 768×1024, 820×1180, 1024×768, 1280×800,
1366×768, 1440×900, 1728×1117, 1920×1080 and 2560×1440. Reports found matching
forward/reverse samples, zero final-hold visual mutations, no horizontal overflow,
zero Footer gap and no runtime errors. Pure geometry tests independently check
image coverage and finite poses for all sizes.

An 8-second delayed Atrium request kept camera progress at `.48` while native
progress advanced through `.58`, `.63`, `.705`, `.84` and `.95`. After decode,
visual progress resumed at `.95`. A failed request hid the unavailable image and
left all five final links usable. These fault tests ran after the Intro had exited.
Desktop and 390×844 reduced-motion checks confirmed relative document flow,
static sky with the correct responsive source, no image transform, hidden cloth,
no overflow and available links. Reload at scrollY 1591 restored `.67991` exactly,
with no Intro/restoration gate remaining. Keyboard focus retained `.95`; native
large scroll gestures moved `.95 → .37308 → .95` normally. Temporary will-change
was `auto` on architecture, Atrium and cloth after arrival.

| Current measured observation        | Result                                                                                                                                                                                   |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Slow/fast/reverse/pause RAF cadence | 1,522 intervals; median 16.7ms, p95 18.6ms, maximum 18.8ms; none above 33ms.                                                                                                             |
| Long tasks in that sequence         | None observed by PerformanceObserver.                                                                                                                                                    |
| Separate 20-cycle stress            | 800 measured intervals; median 16.7ms, p95 18.6ms; none above 33ms and no observed long tasks.                                                                                           |
| Stress JS heap samples              | 54,041,277–55,858,969 bytes, fluctuating rather than monotonically rising.                                                                                                               |
| Stress structure                    | 561 QA-page elements before/after; one owner, stage, TP, header and full-size Worlds image.                                                                                              |
| Ten Home → Worlds → Home cycles     | Real client-side link navigation in the same document; one Home stage/TP after every return and none on Worlds.                                                                          |
| Navigation JS heap samples          | 51,006,222–65,138,455 bytes; final 59,794,096. Natural drops are visible; no forced GC or claim of zero retained allocation.                                                             |
| Navigation resources                | After first route warm-up, 567 QA-page elements and 168 scoped window/document listeners remain constant. One active ResizeObserver on Home, zero on Worlds; zero pending RAF on Worlds. |
| Final scene / Footer idle           | Zero non-QA RAF callbacks during each 500ms idle sample; no continuous HomeStory render loop.                                                                                            |
| Canvas / WebGL                      | Zero canvas elements, context calls and WebGL contexts observed.                                                                                                                         |
| Chrome main-process RSS             | 158,880 KiB before the sequence of checks; 231,056 KiB in the later sample.                                                                                                              |
| Shared Chrome GPU-process RSS       | 44,432 KiB before; 80,512 KiB later. These are process RAM snapshots, not VRAM or per-page allocations.                                                                                  |

The navigation heap follows a sawtooth pattern with natural collection; stable
DOM/listener/observer counts give no evidence of accumulating HomeStory instances
in these ten cycles. This is a bounded local test, not a proof against all leaks.
The harness itself stores reports and framework routing warms caches.

RAF cadence is not a hardware display-FPS guarantee. The fast/flick cases are
controlled scroll inputs plus native browser scroll gestures, not a measured
physical trackpad or weaker-device benchmark. No universal 60fps claim is made.
Browser-wide process RSS includes other tabs, extensions and compositor caches;
it increased during these checks and cannot be attributed solely to this page.
Total Chrome process-tree RAM, GPU utilization, compositor texture count and VRAM
were not measured. The lack of WebGL does not remove DOM raster/compositor costs,
especially for the enlarged sky crop.

Lint, TypeScript, HomeStory/cloth/decode lifecycle checks, Hero checks, Intro
checks, the complete internal-route/image crawl and production Vercel build all
passed. Checks include missing/late image resources, reverse/restoration,
responsive coverage, desktop-only inertia, focus preservation, and repeated
mount/unmount cleanup. No production dependency was added.

A candidate Loader→Footer recording was played at normal speed and reviewed with
intermediate screenshots. Its overly dense cloth edge prompted the material and
exit refinement documented above. The final recording is
[homepage-scroll.mp4](../work/atmosphere-pass/homepage-scroll.mp4); a 39.367-second 1440×662 export (9,057,164 bytes), played back at 1× and
reviewed with its final contact sheet. It includes Loader, Arrival, Philosophy,
cloth passage, the sky void, skylight reveal, settled Worlds and Footer. This is a real Chrome
tab recording driven by controlled native document scroll, not a website video
transition. All QA scripts, instrumentation and recordings stay outside production.
