# HomeStory — PASS 2 persistent TP

PASS 2 makes the existing narrative TP a persistent object during Arrival →
Manifesto. It uses the PASS 1 native scroll stage and master progress. The Loader,
Header, routes, approved architecture assets, and simple Worlds handoff retain
their existing ownership. No PASS 3 sky, occlusion, camera reveal, WebGL, canvas,
or video runtime was introduced.

## Instance audit and final ownership

The starting Homepage contained one large narrative `SharedTP`, rendered inside
`HomeHero`, and a separate `IntroMonogram` inside the Loader. Scene 2 already
reused the narrative SVG, but PASS 1 faded it to zero while changing its pose.
There were no two independent large narrative TP assets to deduplicate.

The narrative component now lives in
[`shared-tp.tsx`](../components/home/experience/shared-tp.tsx), with its responsive
geometry in [`shared-tp.css`](../components/home/experience/shared-tp.css).
[`HomeStory`](../components/home/experience/home-story.tsx) renders it directly
inside the sticky stage, outside either content scene. Its old location in
`HomeHero`, old `hero-monogram.tsx` source, and scene-local TP positioning rules
were removed. There is one HomeStory narrative TP, with `aria-hidden="true"`
and no pointer interaction. The Loader's independent TP remains unchanged.

```text
HomeIntroLoader
HomeExperience — one client effect and master scroll driver
└── HomeStory — native document scroll range
    └── StickyStage — 100svh
        ├── SharedTP — one decorative SVG, shared stage coordinates
        ├── HomeHero
        │   ├── Architecture A / Architecture B
        │   ├── Existing foreground details
        │   └── Arrival / Manifesto HTML
        ├── WorldsChapter
        ├── Existing shared AtmosphereLayer
        └── Existing chapter rail
Footer — normal document flow
```

TP is at stacking level 3, above the rear atmosphere (2), below its foreground
projection (4), and below the editorial content plane (5). Worlds retains its
existing covering layer (6). The SVG's inner `.hi-monogram-surface` remains in
place so the existing Loader handoff still targets the same surface.

## TP endpoint states

The following are CSS layout boxes, not the tighter painted SVG path bounds.
Percentages resolve against the shared sticky stage. Scene 1 has transform scale
1 and no translation. Scene 2 uses the listed target translation and scale.

| Profile                      | Scene 1 left / top | Width / height | Scene 2 X / Y target | Scale   | Opacity |
| ---------------------------- | ------------------ | -------------- | -------------------- | ------- | ------- |
| Desktop, ≥1200px             | 38.1% / 6.7%       | 25.8% / 49%    | 0 / 13svh            | 1 → .86 | 1       |
| Tablet landscape, 768–1199px | 38% / 8%           | 30% / 37%      | 0 / 8svh             | 1 → .86 | 1       |
| Tablet portrait, 768–1199px  | 38% / 8%           | 30% / 30%      | 0 / 24svh            | 1 → .80 | 1       |
| Mobile, <768px               | 57% / 23%          | 38% / 18%      | −21vw / 19svh        | 1 → .88 | .75     |

The mobile opacity of .75 is the approved starting treatment and stays constant
through travel. Desktop/tablet opacity stays at 1. The implementation does not
fade the object out between Scene 1 and Scene 2. The approved mobile scale change
is 12%, versus 14% on desktop; it is not presented as the brief's approximate
30–50% reduction. Keeping the actual approved endpoint sizes takes precedence
over applying those suggested numbers mechanically.

The transform origin is `52% 46%`, toward the shared visual mass of the T/P.
`tpPose` compensates translation for the change from the previous central origin,
so the approved endpoint bounds remain unchanged. Its small desktop horizontal
offset is this compensation, not a new lateral camera path. Mobile additionally
uses the approved −21vw leftward alignment.

## Master progress and motion

[`home-story-frame.ts`](../components/home/experience/home-story-frame.ts)
centralizes `tpTiming`, `arrivalTiming`, and the existing scene ranges.
`tpPose(progress, target, reduced)` is a pure mapping. It contains no clock,
pointer input, playback state, spring, rotation, or overshoot.

| Progress | TP behavior                                                 |
| -------- | ----------------------------------------------------------- |
| 0–.12    | Approved Scene 1 hold                                       |
| .12–.42  | Continuous spatial recession and alignment                  |
| .42–.59  | Stable Scene 2 reading hold                                 |
| .59–.65  | Same settled TP behind the unchanged basic Worlds crossfade |
| .65–1    | Worlds completely covers the artifact; TP is hidden         |

Travel uses a slow pickup, weighted middle and zero-velocity settling curve.
The final normal-motion curve is `1 - (1 - t)^3 * (1 + 3t)`, where `t` is the
normalized .12–.42 travel interval. Motion review changed the earlier fourth-power
curve to this third-power curve: the earlier version looked almost settled
before the Manifesto heading appeared. The refinement keeps a small visible
settle through that reveal without changing timing ranges or endpoint geometry.
Scale is reciprocal to interpolated depth; X/Y alignment follows that same
recession. The transform continuously resolves to the current progress, so a fast
flick does not start a delayed one-way animation. Stopping mid-transition leaves
a stable sampled pose. Reverse scroll uses the same function in the opposite
direction.

Existing architecture moves by only a few pixels with at most 1.2% temporary
scale adjustment on desktop. Existing leaves move farther, and TP aligns over
the larger approved vertical path. These different distances support the depth
relationship. The incoming architecture returns to its unchanged transform by
the reading hold. Tablet/mobile content/parallax distances use .7/.5 of the
desktop amount. Breeze geometry and its PASS 1 behavior were not retimed for TP.

## Content choreography

Text remains semantic HTML. Multiple elements matching each choreography
selector are all updated by the single master driver.

| Element                                      | Progress range |
| -------------------------------------------- | -------------- |
| Arrival metadata / secondary labels depart   | .14–.23        |
| Portals recede and fade                      | .17–.295       |
| English Arrival headline departs             | .20–.30        |
| Vietnamese Arrival headline, desktop         | .205–.305      |
| Vietnamese Arrival headline, below 1200px    | .14–.245       |
| Architecture A → B opacity transition        | .22–.375       |
| Manifesto eyebrows enter                     | .245–.305      |
| English Manifesto heading enters             | .285–.345      |
| Vietnamese Manifesto heading enters          | .30–.36        |
| English body / rule enter                    | .335–.395      |
| Vietnamese body / rule enter                 | .35–.41        |
| Signoffs, center labels and story link enter | .36–.42        |

The early narrow-screen Vietnamese departure clears the TP's left/down path.
Incoming editorial labels and the English heading begin before the outgoing
English headline has fully disappeared. Manifesto body copy enters later, after
TP has moved toward its central resting space. By .42, both the artifact and the
content hold still for reading.

Inactive scene groups remain inert and `aria-hidden`. Portals leave interaction
when their remaining opacity falls below .01; the story link remains inert
until its reveal completes. Header ownership and theme boundaries remain at
.30/.62 as in PASS 1. Worlds remains the simple .59–.65 crossfade.

### Responsive composition review

The baseline visual review found inherited collisions at 768×1024 (Manifesto
English body), 768×1024 and 820×1180 (Arrival Vietnamese heading), 1024×768
(Vietnamese Manifesto column and upper center label), and 1280×800 / 1366×768
(upper center label touching or crossing the T). The 1440×900 baseline had no
actual text/TP collision. These observations informed local text-spacing
corrections while retaining the TP's approved endpoint geometry:

| Scope                             | Applied correction                                                                                                                                                       |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Portrait tablet, 768–1199px       | Arrival Vietnamese block moves from left 56% / width 39% to left 60.5% / width 34.5%, keeping the same right edge                                                        |
| Portrait tablet, 768–1199px       | English Manifesto rule margins change from 27px / 23px to 12px / 10px, moving its body clear of the TP's upper edge                                                      |
| Landscape tablet, 768–1199px      | Vietnamese Manifesto block moves from left 61% / width 33% to left 63% / width 31%, keeping the same right edge                                                          |
| Landscape tablet, 768–1199px      | Upper center label line-height becomes 1.5; its decorative rules are hidden                                                                                              |
| Desktop ≥1200px and height ≤820px | First upper-center decorative rule uses `1.8svh` height and an 8px bottom gap, reducing the label's total height; taller desktop compositions retain their original rule |

The changes are present in `spatial-hero.css`. Independent review of all 36 final
Scene 1 / 30% / Scene 2 screenshots found no visible TP clipping, text/TP
collision, or missing/duplicated TP. The corrected tablet and short-desktop cases
were also inspected at full size. See the
[visual review](../work/pass2/final-visual-review.json) and its contact sheets.
The 375px Scene 1 capture was subsequently recaptured without the QA controls.
The existing decorative leaf still crosses the English body at 768/820px;
that non-TP asset interaction remains unchanged. Static checkpoint review does
not establish collision freedom at every possible scroll position.

## Reduced motion, restoration and cleanup

Reduced motion now retains the same sticky stage and one persistent TP. Its pose
changes over .28–.32 with a simple smooth interpolation; surrounding content uses
the short PASS 1 opacity transition without stagger or parallax. The decorative
cloth and rail remain hidden. Scene 2 still prepares its architectural image.
Invisible scene content does not become tabbable merely because reduced motion
is enabled.

Browser checks pass at 1440×900 and 390×844 with reduced motion: 96 motion and
46 full-story samples per size, matching forward/reverse poses, one persistent
TP, constant opening opacity, inert inactive controls, no overflow, no runtime
errors and no idle application RAF. The QA harness applies a CSS/JavaScript
preference proxy; it does not change or claim to test the operating system's
accessibility setting. Evidence:
[desktop motion](../work/pass2/reduced-motion-1440.json) /
[desktop story](../work/pass2/reduced-story-1440.json),
[mobile motion](../work/pass2/reduced-motion-390.json) /
[mobile story](../work/pass2/reduced-story-390.json).

The PASS 1 document policy remains: a fresh navigation or document reload plays
the Loader, then starts HomeStory at progress 0. Browser Back/Forward restoration
uses native scroll and initializes the shared TP at the corresponding pose.
`pageshow` samples synchronously; the existing first-paint restoration gate is
removed only after the corresponding scene state and TP pose have been applied.
Image readiness retains the existing fallback behavior. Reload is not
claimed to retain Scene 2 while that Loader policy remains active.

The final browser history check recorded two returns to Home at exactly
`scrollY=1100`, progress `.47009`, with one TP and the same settled transform as
before leaving. Neither return replayed the Intro or left a restoration gate.
Document reload completed the Loader and reset to `scrollY=0`, progress 0 and
the Scene 1 pose, matching the retained policy. See
[`restoration.json`](../work/pass2/restoration.json).

[`createHomeStoryTimeline`](../components/home/experience/home-story-timeline.ts)
still owns one passive scroll listener, one coalesced RAF and one shared
ResizeObserver. TP computed styles are read only during measurement on mount or
resize; scrolling reads the cached geometry. Native scrolling is not corrected
or hijacked. TP uses transform/opacity, with `will-change: transform` only during
normal-motion travel. Quiet holds do not keep an animation loop alive. Cleanup
restores TP styles/state attributes and removes owned listeners/observers.

Repeated navigation exposed an ownership bug in the pre-fix cleanup: HomeStory
had captured the persistent Header's temporary `inert` state while the Loader
was active, then restored that stale lock when HomeStory unmounted. The bounded
fix saves/restores only the Header attributes HomeStory owns,
`data-opening` and `data-chapter-theme`. It leaves Header `inert`, `aria-hidden`
and styles to their actual owners. A regression first reproduced the bug, then
passed for both a Loader lock released after mount and an external lock applied
after mount. This does not change Loader behavior.

## Asset quality

The original narrative SVG is preserved: a `360 × 550` viewBox, hand-authored
T/P outlines, shallow extrusion, mineral gradients and highlight paths. Letter
edges remain vectors. Its existing `/images/stone-720.webp` texture provides the
face detail; this photograph is documented in [ASSET-SOURCES.md](ASSET-SOURCES.md).
No small raster logo was enlarged, no replacement TP material was generated,
and no second full-size TP image was added. The Loader retains its own existing
pale mineral T / walnut P treatment.

## Verification record

Current code checks run for this pass:

| Check                                               | Result / scope                                                                                                                                                                                                                                                                                                       |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `node scripts/check-spatial-hero.mjs`               | Passed: 12 responsive target profiles, exact compensated endpoint bounds, 501 forward/reverse samples per profile/motion mode, constant opacity, monotone scale, non-linear pickup/settle, reading hold and overlapping content order                                                                                |
| `node scripts/check-home-chapters.mjs`              | Passed: shared-stage TP lookup, native/restored progress, synchronous restored poses, all matched content nodes, inert controls, reduced continuity, resize remeasurement, no scroll-time layout/style measurements, final idle hold, 30 complete mount/unmount cycles and Header accessibility ownership regression |
| `node scripts/check-continuous-breeze.mjs`          | Passed: unchanged static cloth geometry, no independent clock, clear Worlds and attribute cleanup                                                                                                                                                                                                                    |
| `node scripts/check-scene-image.mjs`                | Passed: decoded readiness, responsive retry, failure handling and cleanup                                                                                                                                                                                                                                            |
| `yarn check:intro`                                  | Passed: existing asset loader, reload policy, native history behavior and controller cleanup                                                                                                                                                                                                                         |
| `node scripts/check-site.mjs http://127.0.0.1:4500` | Passed: 44 pages, 77 image references, eight expected 404 routes; includes exactly one narrative TP directly owned by the shared stage                                                                                                                                                                               |
| Scoped lint on the changed check scripts            | Passed                                                                                                                                                                                                                                                                                                               |
| `yarn lint`                                         | Passed after the Header ownership fix                                                                                                                                                                                                                                                                                |
| `yarn tsc --noEmit`                                 | Passed after the Header ownership fix                                                                                                                                                                                                                                                                                |
| `yarn build:vercel`                                 | Passed after the final curve/CSS refinement and Header ownership fix                                                                                                                                                                                                                                                 |

### Final responsive motion matrix

All 12 guarded motion and full-story reports pass. Each contains 96 TP motion
samples, seven boundary probe pairs and 46 full-story samples: 1,152 motion
samples, 84 probe pairs and 552 full-story samples in total. The harness verifies
that the viewport remains the requested size throughout each run. Earlier runs
invalidated by transient viewport changes were replaced and excluded.

Motion reports retain the same TP DOM node, constant opening opacity, finite
transforms, direct stage ownership and matching forward/reverse samples.
Full-story checks pass for one stage/Header/TP, aligned layers, no horizontal
overflow, one Worlds image, no canvas, inert hidden content, one active content
scene, no runtime errors and Footer adjacency. All 12 runs execute zero
application RAF callbacks during the 500ms sampled idle; all final-hold visual
mutation arrays are empty.

| Viewport  | Motion / story evidence                                                           | Idle application RAF callbacks | Final-hold visual mutations |
| --------- | --------------------------------------------------------------------------------- | ------------------------------ | --------------------------- |
| 375×812   | [motion](../work/pass2/motion-375.json) / [story](../work/pass2/story-375.json)   | 0                              | 0                           |
| 390×844   | [motion](../work/pass2/motion-390.json) / [story](../work/pass2/story-390.json)   | 0                              | 0                           |
| 430×932   | [motion](../work/pass2/motion-430.json) / [story](../work/pass2/story-430.json)   | 0                              | 0                           |
| 768×1024  | [motion](../work/pass2/motion-768.json) / [story](../work/pass2/story-768.json)   | 0                              | 0                           |
| 820×1180  | [motion](../work/pass2/motion-820.json) / [story](../work/pass2/story-820.json)   | 0                              | 0                           |
| 1024×768  | [motion](../work/pass2/motion-1024.json) / [story](../work/pass2/story-1024.json) | 0                              | 0                           |
| 1280×800  | [motion](../work/pass2/motion-1280.json) / [story](../work/pass2/story-1280.json) | 0                              | 0                           |
| 1366×768  | [motion](../work/pass2/motion-1366.json) / [story](../work/pass2/story-1366.json) | 0                              | 0                           |
| 1440×900  | [motion](../work/pass2/motion-1440.json) / [story](../work/pass2/story-1440.json) | 0                              | 0                           |
| 1728×1117 | [motion](../work/pass2/motion-1728.json) / [story](../work/pass2/story-1728.json) | 0                              | 0                           |
| 1920×1080 | [motion](../work/pass2/motion-1920.json) / [story](../work/pass2/story-1920.json) | 0                              | 0                           |
| 2560×1440 | [motion](../work/pass2/motion-2560.json) / [story](../work/pass2/story-2560.json) | 0                              | 0                           |

All 12 viewports have Scene 1, 30% and Scene 2 captures. The 390/768/1440px
profiles additionally have 0/10/20/30/40/50/60% captures. Contact sheets are
[Scene 1](../work/pass2/after-contact-scene1.png),
[30%](../work/pass2/after-contact-p30.png) and
[Scene 2](../work/pass2/after-contact-scene2.png).
Collision conclusions come from visual review, not the earlier automated
hit-testing diagnostic: its initial zero-hit result was invalid even for known
baseline collisions. Boundary probe deltas include native-scroll pixel rounding
and are not presented as proof of perceptual continuity.

### Runtime measurements

These reports use a QA-instrumented browser. RAF timing uses the saved native
RAF, excluded from application callback counts. Resource counts include
framework resources and cover window/document listeners, ResizeObservers,
IntersectionObservers and canvas context requests. They are not a census of all
browser allocations. JavaScript heap was sampled without forced garbage
collection; total browser RAM, GPU load and VRAM were not measured.

| Measurement                                                     | Observed result                                                                                                                                                                                                                                                                                                |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [20 forward/reverse cycles](../work/pass2/stress.json)          | 560 DOM nodes throughout; one stage/owner/Header/Worlds image; zero canvas/WebGL; no new listeners or observers                                                                                                                                                                                                |
| Stress heap                                                     | 51,854,106 → 51,511,008 bytes (−343,098); cycle samples ranged 51,717,962–53,903,521 bytes, with eight consecutive-sample decreases                                                                                                                                                                            |
| Stress cadence                                                  | 800 intervals; median 16.7ms, p95 18.1ms, maximum 18.8ms; no interval over 33ms, no observed Long Tasks                                                                                                                                                                                                        |
| Stress idle                                                     | Zero application RAF callbacks                                                                                                                                                                                                                                                                                 |
| [10 client navigation cycles](../work/pass2/navigation.json)    | All ten Home → Worlds → Home cycles remained in the same document; one Home stage/owner/TP, unmounted on Worlds; Header and clicked-link interaction checks all pass (40 link checkpoints), no failure or runtime error                                                                                        |
| Navigation resources                                            | 60 listener additions / 60 removals, 10 ResizeObserver creations / 10 disconnections, 20 IntersectionObserver creations / 20 disconnections; Home retains 168 scoped listeners and one ResizeObserver with three targets, Worlds has 166 and zero ResizeObservers; no pending RAF at sampled route checkpoints |
| Navigation DOM                                                  | 558 initial nodes, then 566 on every returned Home and 330 on every Worlds visit; no per-cycle accumulation                                                                                                                                                                                                    |
| Navigation heap                                                 | 52,942,633 → 56,664,214 bytes (+3,721,581); returned-Home samples ranged 54,814,782–59,138,242 bytes, with five consecutive-sample decreases; the final sample is 807,778 bytes above the first returned-Home sample                                                                                           |
| [Motion profile](../work/pass2/profile.json)                    | Slow forward/reverse, fast flick/reverse flick, pause mid-transition and finish phases; 1,522 intervals, median 16.7ms, p95 18.2ms, maximum 31.7ms; no interval over 33ms, no observed Long Tasks                                                                                                              |
| Profile heap                                                    | 56,191,211 → 53,715,855 bytes (−2,475,356); 566 DOM nodes before/after                                                                                                                                                                                                                                         |
| Final scene / Footer idle                                       | Zero application RAF callbacks in both sampled holds                                                                                                                                                                                                                                                           |
| Image structure                                                 | Profile before/after each records the same three decoded architecture/Worlds image URLs: Architecture A, Architecture B and one Worlds image; one narrative SVG TP                                                                                                                                             |
| [Observed texture requests](../work/pass2/texture-network.json) | The local production access log records one `stone-720.webp` request from the initial normal document through ten SPA navigation cycles and manual Back/Forward, before full reload; the separate approved Loader walnut asset records two requests in that interval                                           |

The scroll stress and navigation samples show no accumulating DOM, listener or
observer instances and contain natural heap decreases. The navigation heap ends
above its fresh-run baseline; these limited runs without forced collection do
not prove the absence of every possible leak. Cadence is the observed interval
distribution, not a claim about achieved display FPS. Image structure verifies
DOM instances. The texture access-log count is scoped to that observed interval;
it does not measure browser texture allocations, GPU copies or every asset.

### Motion recording

The final [MP4](../work/pass2/shared-tp-motion.mp4) and
[WebM](../work/pass2/shared-tp-motion.webm) record the final third-power curve,
native scroll forward through 0/.10/.18/.26/.34/.42/.47, reverse to the opening,
and forward to the still Worlds scene. `ffprobe` verifies 3360×1544 encoded
pixels; the MP4 duration is 20.4 seconds. The recording uses local-tab
MediaRecorder, without a canvas capture pipeline.

The browser's sharing bar reduced the viewport while capture was active. Raw
capture settings and the post-stop viewport in
[`recording.json`](../work/pass2/recording.json) therefore differ from the encoded
height. The file's 2× pixel ratio implies approximately 1680×772 CSS pixels
during recording, consistent with the sampled scroll span and TP transform;
the post-stop viewport is 1680×829. The metadata preserves those raw values and
adds the independently measured file dimensions and duration.

### Measurement limits

Physical trackpad input is not claimed by the scripted native-scroll
measurements. The additional native browser-wheel spot check was not completed:
the browser connection timed out three times, including its state query. No
native-wheel result is claimed. The saved responsive matrix, native-scroll
recording and history results above remain the evidence for this pass.
