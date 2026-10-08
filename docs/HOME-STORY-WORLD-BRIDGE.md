# HomeStory — PASS 1 architecture

Current TP motion is documented in [PASS 2 — persistent TP](HOME-TP-PERSISTENT-ANCHOR.md); this report records the PASS 1 foundation.

This pass supersedes the cinematic bridge implementation. It preserves the three
approved scene compositions and prepares one persistent viewport for later motion
work. No advanced camera/sky transition is part of this implementation.

## Structure and ownership

```text
HomeIntroLoader (existing lifecycle)
HomeExperience (one client effect)
└── HomeStory (native document scroll range)
    └── StickyStage (100svh, sticky, overflow: clip)
        ├── HomeHero
        │   ├── Architecture A / Architecture B (one image each)
        │   ├── SharedTP (one SVG, existing checkpoint positions)
        │   ├── Leaves
        │   └── Arrival / Manifesto HTML content
        ├── WorldsChapter (one Atrium image + existing HTML content)
        ├── AtmosphereLayer (one static cloth definition)
        └── Existing decorative chapter rail
Footer (existing layout sibling, normal document flow)
```

Hero's background/object/content wrappers preserve its existing stacking and
responsive typography. They and Worlds occupy the same absolute stage space;
there are no nested full-height scroll sections or additional scene copies.
The single site Header remains owned by the application layout.

`createHomeStoryTimeline` owns one passive scroll listener, one coalesced,
on-looping RAF, and one ResizeObserver for stage/range/header measurements.
Resize/orientation changes remeasure geometry; ordinary scrolling only reads
`window.scrollY`. There is no React state per frame. Hidden documents cancel RAF
work; unmount disconnects listeners/observers and restores modified attributes.
Image loading has a separate short-lived IntersectionObserver, disconnected when
preloading starts. It never controls progress or creates another timeline.

Audit: package.json contains no GSAP, ScrollTrigger, Lenis, Locomotive, or other
smooth-scroll engine. The global CSS uses native `scroll-behavior: smooth`;
HomeStory scopes it to `auto` while mounted so history restoration does not
animate through earlier scenes. Other routes retain their existing behavior.
No dependency was added. Native scroll remains the source
of truth: `clamp((scrollY - storyTop) / (storyHeight - stageHeight))`.

## Configuration and temporary visibility

| Viewport width | Story height | Stage  |
| -------------- | ------------ | ------ |
| ≥1200px        | 360svh       | 100svh |
| 768–1199px     | 320svh       | 100svh |
| <768px         | 280svh       | 100svh |

Since STEP 1 these heights apply under reduced motion only; with motion the
same journey is read over 640/560/480svh (`TANPHONG_HOME_MOTION_CONTEXT.md` §40).

Heights and breakpoint rules are centralized in `home-story.css`. Scene ranges
and the temporary crossfade width are centralized in `home-story-frame.ts`:

| Progress | Active content   |
| -------- | ---------------- |
| 0–.30    | Arrival          |
| .30–.62  | Manifesto        |
| .62–1    | Enter the worlds |

Only opacity crossfades run at .27–.33 and .59–.65. Architecture A remains opaque
under B during its fade, so no blank document seam appears. The Atrium fades as
one complete scene over the existing stage. TP/leaves/cloth retain their approved
opening and Manifesto positions: they change static pose only at zero opacity.
There is no continuous camera or TP trajectory. The final scene and rail are
completely still from .65 through the stage release.

Inactive content groups use `inert` and `aria-hidden`; fully hidden scenes also
use visibility. Inert descendants cannot intercept pointer input. All copy stays
HTML, and existing room links, preview interactions and routes remain unchanged.
Reduced motion exposes the same content nodes in normal flow, with no duplicated
sky image or sticky motion.

## Preparation, restoration, cleanup

The existing architecture B request is deferred by two initial paints and decoded
before use. `prepareSceneImage` promotes the existing responsive Atrium image,
without constructing another image/texture. Delayed or failed imagery uses a
readable solid backdrop while content/navigation continue to follow actual
scroll. There is only one normalized progress, including during loading.

Intro presentation/controller remain unchanged. A minimal bootstrap decision
fix restores the requested policy: document reload plays Intro and resets to
the initial scene; back/forward keeps native restoration.
The story driver itself never calls scrollTo, prevents wheel defaults, snaps, or
corrects focus scrolling. Native history restoration is sampled synchronously on
mount/pageshow before the restoration cover is released.

Removed: camera crop/pull-back/inertia, lens occlusion geometry, dynamic cloth
masks/density, sky reveal mask, sky/light overlays, reduced-mode duplicate sky,
per-element stagger/reveals, visual-progress loading gate and focus scroll
correction. `bridge-image.ts` became `scene-image.ts`; obsolete animation math and
its tests were replaced with PASS 1 progress/lifecycle checks. Static SVG masks
remain only to preserve the approved cloth's original layer composition.

## Verification

- Passed `yarn lint`, `yarn tsc --noEmit`, `yarn check:home`,
  `yarn check:hero`, `yarn check:intro`, and `yarn build:vercel`.
- Production route crawl passed: 44 pages, 77 image references, plus eight
  intentionally invalid routes verified as failures.
- Browser checks passed at 390×844, 768×1024, 1024×768, 1366×768, 1440×900
  and 1920×1080. All had one stage/header/TP/Atrium, no horizontal overflow,
  aligned scene bounds, no gap before Footer, no hidden interactive content,
  deterministic reverse states and zero final-stage style/geometry mutations.
- Native wheel traversed Arrival → Manifesto → Worlds, then released the stage
  into Footer. Keyboard Tab reached the room links without making them inert.
- Actual Back navigation restored Scene 3 at progress 1 on all six viewports,
  with sampled progress matching native scroll. Forward returned to Worlds;
  Back returned to the final Home composition without Intro. Reload was
  separately observed showing Intro with progress 0.
- Reduced-motion proxy checks at mobile and desktop showed relative/normal-flow
  content, no hidden scene groups, no cloth, no sky copy and no overflow.

### Screenshot comparison

Captured 18 before and 18 after checkpoint images (three scenes × six sizes).
Visual review found no relocated/missing content, changed line wrapping, TP pose,
room/CTA layout or architectural framing. Scene 2 mean channel differences were
0.019–0.127 on a 0–255 scale. Other differences were concentrated at rasterized
image/text edges and the scrollbar. Tablet Scene 3 comparison indicates roughly
a half-pixel edge shift; the inferred cause is fractional sticky placement and
removed identity transforms, not a demonstrated composition change. These are
visual-equivalence checks, not a claim of bit-identical screenshots.

Local artifacts are under `work/pass1/` (ignored QA tooling/artifacts):
`before/after-WIDTH-sceneN.png`, `comparison-WIDTH.png`,
`pixel-comparison.json`, `story-WIDTH.json`, `restoration.json`,
`stress.json`, and `navigation.json`.

### Resource checks

In the instrumented Chromium tab, 20 complete scroll cycles retained 553 DOM
nodes, 168 tracked window/document listeners, one active ResizeObserver and
one framework IntersectionObserver. The scene image preloader observer had
disconnected. No app RAF remained pending at sampled endpoints; a 500ms resting
sample executed zero app RAF callbacks. JS heap fluctuated between 91,107,675
and 93,272,281 bytes with natural GC drops, rather than growing each cycle.

Ten client navigation cycles retained 559 Home DOM nodes after the first cycle,
with 168 tracked listeners and one
Home ResizeObserver. That observer count returned to zero on Worlds; pending
RAF was zero there. Home heap samples ranged 90,977,738–94,000,146 bytes.
No duplicate stage, TP or image appeared. The checked story used zero canvas
and zero WebGL contexts.

Counts include framework resources and QA instrumentation overhead; JS heap is
not total browser/GPU memory. No forced GC, GPU/VRAM measurement or physical
mobile-device performance claim is made. Old pass performance numbers were not
carried forward.
