# Homepage cinematic smoothness pass

Implemented locally on 2026-09-30. Supersedes the earlier bridge timing pass.
Approved scene compositions, navigation and Footer layout are preserved.

## Timeline

One native-scroll progress value drives the existing Story and one atrium image.
The sticky stage remains 100svh. The bridge is 260svh desktop, 230svh tablet,
220svh mobile; the preceding Discovery approach remains 110/110/90svh.

| Bridge progress | Choreography                                                                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0–16%           | Stable Story reading zone.                                                                                                                        |
| 16–52%          | Architecture continues accelerating forward; text recedes from 16%, leaves/text depart completely by 46%.                                         |
| 26–54%          | Cloth grows toward the lens, crosses the camera and travels beyond the right edge. Architecture reveals behind its directional weave over 41–52%. |
| 52–64%          | Full-frame sky hold: 12% of the bridge, with no Story or Worlds copy. Cloth dissolves while exiting and is completely gone at 64%.                |
| 64–84%          | A single camera pull-back opens the skylight into the atrium; mobile reaches rest at 83%.                                                         |
| 74–88%          | Rooms and original Worlds copy reveal in a restrained stagger.                                                                                    |
| 86% onward      | Room links become interactive only after their reveal is complete; CTA waits until its reveal finishes at 88%.                                    |
| 88–100%         | Fully still reading composition: no camera, cloth, light or UI changes.                                                                           |
| 100%            | Sticky releases into the normal-flow Footer.                                                                                                      |

After camera rest there is 25.6svh desktop, 20.8svh tablet and 20.4svh mobile
of scroll before Footer begins entering. The completely still, fully revealed
UI holds for the last 12%: 19.2/15.6/14.4svh respectively. There is no blank spacer.

## Camera and cloth

Story entry uses a power-2.6 acceleration. The atrium uses one logarithmic scale
trajectory with asymmetric arrival `1 - (1 - t)^4 * (1 + 4t)`: velocity is zero
at either end, peaks at 25% of the move, then decelerates over a longer tail.
There is no separate near-final zoom stage or scale snap.

The real oculus is about 20% of the 1672×941 photograph's height. Full-frame sky
therefore needs a bounded ~4.8–5× crop on this same image; 1.24× cannot fill the
viewport with its sky. The camera crosses the restrained 1.24× close-up during
its arrival and ends at exact scale 1 / translation 0. The optical origin follows
the photographed skylight at 11.6% of covered image height; proportional vertical
translation maintains image coverage across aspect ratios. Source resolution
limits close-up sharpness. No alternate sky or second full-size plate is loaded.

Only architecture may trail scroll by a bounded 2px / .25% scale (less on narrow
viewports). The tiny residual decays over roughly 180–200ms; native scroll, text
and hit targets never use this filtered pose. There is no GSAP, Lenis, wheel
interception or permanent RAF loop. Layout is cached on mount/resize; restoration
resamples synchronously. Reverse scroll uses the same reversible functions.

The cloth uses one definition and a connected directional spline. Its near-camera
breadth is narrower, its weave retains texture, and translucent fill is reduced.
The old return curve and unused canopy/rim masks are removed. A 2.5% feathered
architecture reveal follows behind the cloth rather than a white full-screen
veil. Cloth continues translating while dissolving; it is absent throughout the
atrium pull-back and final scene.

## Light, interactions and device complexity

- Small local radial gradients suggest warm Story light (up to .03 opacity) and
  sky light (up to .055); they fade into the existing photographic exposure
  treatment before arrival. No animated full-image brightness/filter or blur.
- Header stays spatially fixed: charcoal → softer charcoal at the sky → warm
  ivory, with 350ms color interpolation. A temporary top shade fades by 84%.
- Settled desktop room hover/focus translates only the title 3px, keeps its number
  still, expands the underline 60→100%, and dims other room labels to .65.
  One small gradient emphasizes the selected opening at .045 opacity.
- The CTA preview crossfades to the selected room over 220ms. Four 192×192 WebP
  thumbnails are generated from existing assets by `scripts/build-room-previews.mjs`.
  They are small preview images, not duplicate background layers.
- CTA hover/focus scales the thumbnail to 1.04, moves the arrow 5px and rotates a
  partial circular line 6°. No looping animation.
- Tablet reduces Story depth and micro inertia by 30%; mobile by 50%. Mobile
  paints one cloth projection, uses the shorter bridge, and does not request room
  hover images. Room/CTA hit targets remain at least 44px tall.
- Reduced motion removes the sticky zoom, inertia, cloth and light motion; all
  content flows normally and links remain available. No hover parallax.
- Invisible/moving links are inert and excluded from keyboard interaction. Reverse
  scrolling disables interactions again before camera movement resumes.

The source is one flat photograph, so no fabricated depth cutouts or duplicated
floor were added. Optional reflection lag was skipped; camera, light and cloth
supply the depth without a second full-size image, Canvas, WebGL or video effect.

## Verification

Passed: lint, TypeScript, Home/cloth controller checks, Hero checks, Intro checks,
production Vercel build and `git diff --check`.

Regression checks cover bounded/finite inertia and its 200ms settle, image
coverage, exact final camera pose, cloth exit, interaction locking, reverse
sampling, reduced motion, hidden-tab inactivity, restoration and cleanup.

Chrome production QA at 320×568, 390×844, 768×1024, 1024×768, 1440×900,
1920×1080 and 2560×1440 found no horizontal overflow, no Footer gap, and all final
room/CTA links within the viewport. MutationObserver audits over 89/92/96/100%
plus an idle pause found zero visual style/path changes at every tested size.
Mobile forward/reverse samples matched after the bounded settling interval.

Reload at scrollY 1774 restored progress .64996 exactly, without a restoration
gate remaining. Desktop and mobile reduced-motion QA confirmed a relative stage,
no image transform, hidden cloth/light, all link opacity 1 and no inert links.
Keyboard CTA focus verified scale 1.04, arrow 5px and rotation 6°.

A 31-second, 1680×800 MP4 records the actual Chrome tab through Opening,
Discovery, Story, Breeze, sky, atrium and Footer. QA drives native scroll at a
controlled slow rate with reading pauses; it is not a physical trackpad recording.
The recording is only a local QA artifact, never a website asset. Visual review
also used full-size intermediate screenshots. Refinement reduced the cloth fill
and reveal feather and corrected the departing leaf selector.

## Performance observations and limits

Real Chrome DevTools Performance recording used Screenshots + Memory, without
CPU/network throttling, covering slow/fast/reverse scroll and mid-scene pauses.
Local QA controls and installed browser extensions were present.

| Observation                                | Result                                                                                                        |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| Slow/fast/reverse/pause RAF cadence        | 1,118 intervals; median 16.7ms, p95 17.6ms; 6 above 33ms.                                                     |
| Long tasks during that controlled sequence | None observed by PerformanceObserver.                                                                         |
| Separate 20-cycle stress cadence           | 819 intervals; median 16.7ms, p95 31.3ms; 30 above 33ms; five long tasks of 54–134ms.                         |
| Stress DOM                                 | 537 elements before and after; one full-size Worlds image, one header, one cloth definition, two projections. |
| Stress JS heap samples                     | 49,314,002–62,242,192 bytes; no runtime errors observed.                                                      |
| DevTools renderer JS heap                  | 32,932,020–34,933,780 bytes; final 33,018,068 bytes.                                                          |
| DevTools document/nodes/listeners          | One document; nodes 1084–1085 ending at 1084; listeners 1184 initially, 1173 finally.                         |
| Maximum Layout / Paint / UpdateLayoutTree  | 8.133ms / 8.796ms / 7.612ms in the saved trace.                                                               |
| Canvas / WebGL requests                    | Zero / zero.                                                                                                  |

The full trace includes one 172.885ms main-thread task outside the controlled
sequence. Its 166.369ms FunctionCall belongs to the browser extension's
`content-scripts/codex.js`, not the application. These observations include QA
and browser overhead; they are not a universal 60fps or mid-range-device claim.
The stress run still has dropped-frame intervals.

Compositor layer activation/update and GPU tasks are present. Temporary
`will-change` declarations are removed at camera rest. GPU memory counters were
not exposed, so VRAM is not measured. JS heap is not total Chrome process RAM;
total process RAM was not measured either. The enlarged sky crop still carries
raster/compositor cost despite using one source image.

Evidence is in ignored `work/cinematic-pass/`: screenshots, per-viewport stillness
reports, reverse/stress/motion reports, `chrome-performance.json.gz`,
`trace-summary.json`, `homepage-scroll.mp4` and the video contact sheet.
The local proxy/recording controls and logs are excluded from production.
