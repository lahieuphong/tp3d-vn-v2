# TP3D PASS 01 — Arrival / first impression

This pass covers only the first arrival on the homepage:

page load → intro → architectural opening → Scene 01 → first small scroll

Rules come from [TP3D-DESIGN-SYSTEM.md](TP3D-DESIGN-SYSTEM.md). Timeline
internals are in [TANPHONG_HOME_MOTION_CONTEXT.md](TANPHONG_HOME_MOTION_CONTEXT.md).

| Item | Value |
| --- | --- |
| Date | 2026-10-03 |
| Starting HEAD | `27c8c9f` — feat(motion): add the TP3D design system and motion foundation |
| Scope kept | Scene 02, the atmospheric bridge, the Atrium, the Footer, routes, room taxonomy and photography are unchanged (verified by pixel diff, §12) |
| Not introduced | GSAP, ScrollTrigger, Lenis, Framer Motion, a new scroll owner or RAF loop, a new canvas, new images, new requests on the LCP path |

How measurements were taken:

- **Environment.** Headless Chrome 154 on this Windows 11 workstation, against
  local production builds (`yarn build` + `yarn start`). This is not field data
  and not a real phone, Mac or Safari.
- **Motion preference.** This machine reports `prefers-reduced-motion: reduce`
  at OS level. Every motion run therefore pinned `no-preference` explicitly.
  "Throttled" means 4× CPU, about 9 Mbps and 150 ms latency.

---

## 1. Before state

The intro loader (`components/home/intro/*`) at `27c8c9f`.

**First paint**

- Paper panels, the header replica and both silk ribbons appeared together.
- The TP arrived at 80 ms (600 ms, `cubic-bezier(0.22, 1, 0.36, 1)`).
- The TP rose at 600 ms (800 ms, cinematic curve).
- The slogan faded up 12 px at 880 ms.
- The status line `LOADING THE SPACE...` showed a progress hairline plus a
  **percentage numeral**. The percentage was real, but read 100% at once when
  assets were cached.

**Opening (desktop 1000 ms, mobile 900 ms)**

- Two paper halves translated ±100% from frame 0.
- The loader TP, slogan and silk faded out *while* the aperture was opening.
  This double-exposed the loader TP and slogan over Scene 1 (see the PASS 00
  evidence frames).
- The real header crossfaded with the differently laid-out header replica.
- The Scene 1 TP and cloth faded in.
- The scene behind the panels was revealed **flat**: nothing responded to the
  opening.

**First scroll**

`arrivalFrame(0) ≡ arrivalFrame(0.1)`. The first 12–14% of the story
(281–328 px on a 1440×900 desktop) changed nothing on screen, so the first
wheel steps felt like dead input.

**Pointer**

Scene 1 had no pointer depth. Only the loader had a 2–4 px parallax.

## 2. Changes made

| Area | Change |
| --- | --- |
| Composition at rest | **None.** The resting Scene 1 is pixel-identical (§12) |
| Brand presence | The TP arrives after a 240 ms beat with a quieter scale (0.985 → 1) on `normal` + `primary`. Its rise uses `cinematic` + the cinematic curve |
| Slogan | Rises 0.8 em into a fixed line window (`clip-path` mask) as one block. No per-word animation |
| Space preparation | Copy `LOADING THE SPACE...` → `PREPARING THE SPACE`. Visible percentage removed; the hairline (real asset completion) and the screen-reader `<progress>` remain |
| Opening | Objects spanning the joint (TP, slogan, status, silk) clear first. A 4 px hairline seam opens. Then two slabs part on the cinematic curve. Slab edges get a 1 px light edge and a soft contact shadow. The header replica and brand line **ride their slab**, so the two headers never crossfade |
| Depth behind the aperture | Far plane (architecture A) breathes from ×1.035 to rest with the slabs. The TP (mid) and leaves (near) land softly after it. All finish exactly when the panels leave |
| First scroll | The far plane dollies under 1% and the leaves drift from the first wheel step. Copy, portals and TP keep their reading hold. The approach hands off to the existing TP travel, so the Scene 2 endpoints are unchanged |
| Pointer depth (desktop only) | TP ±3/2 px and portals ±6/3.5 px against the pointer. The architecture and typography stay still. Eased on the master timeline's single RAF |
| Tokens | Every touched duration and easing now uses `--motion-*` / `DURATION` / `EASE`. The intro durations now come from tokens (`entrance`, `cinematic`) |

**Files**

- `components/home/intro/home-intro.css` — sequence, opening, depth settle,
  tier amplitudes, reduced-motion rules.
- `components/home/intro/intro-controller.ts` — `INTRO_TIMING.desktop =
  DURATION.entrance` (1500), `mobile = DURATION.cinematic` (1000).
- `components/home/intro/intro-progress.tsx` — copy, percentage removed.
- `components/home/intro/critical-assets.ts` — font sample text for the new
  copy.
- `components/home/experience/home-story-frame.ts` — `arrivalTiming.approach`
  and the first-scroll dolly.
- `components/home/experience/hero-depth.ts` (new) — Scene 1 pointer depth
  driver.
- `components/home/experience/home-story-timeline.ts` — creates the driver,
  updates it on narrative frames, ticks it on the shared RAF, suspends it on
  hidden tabs, destroys it on unmount.
- Tests: `scripts/check-hero-depth.mjs` (new; added to `check:hero`),
  `check-spatial-hero.mjs`, `check-intro-controller.mjs`,
  `check-home-chapters.mjs`, `check-motion-foundation.mjs`, `check-site.mjs`
  (see §12).

## 3. Exact arrival sequence

**Phase A — Silence** (first paint until 240 ms after the controller mounts)

A composed frame: paper panels with their faint mineral light, the header
replica, the brand line `INTERIORS & OBJECTS` and the silk drifting slowly
(the existing 7 s breeze drift). No TP, no slogan, no status. The frame stays
contentful from the first paint (see §10 for why).

**Phase B — Brand presence** (240 ms onward)

- The TP (stone T, walnut P) and its soft floor shadow appear.
- At 760 ms the TP rises to make room for the slogan.
- At 1000 ms *A new breeze for living* rises into its line window.

**Phase C — Space preparation** (1150–1630 ms)

- `PREPARING THE SPACE` and the progress hairline appear.
- The hairline's fade-in end marks the visible sequence complete.
- The existing gate then waits for a 1800 ms minimum and the real asset
  checks, holds `ready` for 150 ms, then reveals.

**Phase D — Architectural opening** (`revealing`, D = 1500 ms desktop/tablet)

1. **Clear (0–0.18 D):** the TP, slogan, status and shadow dissolve. The silk
   drifts up and right and fades. The surface is left with only its printed
   header and brand line.
2. **Seam (0–0.18 D):** the two panels part by 4 px each (expo-out), showing a
   hairline of the space behind.
3. **Split (0.18–1.0 D):** the slabs travel to ±100% from rest to rest on the
   cinematic curve, carrying the header replica and brand line. The scene
   appears progressively through the aperture. There is no ghost, because the
   TP is gone before the aperture reaches it.

**Phase E — Hero settle** (inside the split, ending at D)

- The architecture settles from ×1.035 to rest in step with the slabs.
- The TP settles from +1.4 svh / ×1.02, and the leaves from +2.4 svh, both
  landing softly.
- The cloth fades in (0.50–0.95 D) and the real header fades in
  (0.65–0.95 D).
- At D the gate completes on `hi-bottom-open`.
- **Stillness follows:** 0 RAF callbacks per second at rest, measured on every
  viewport (§12). Nothing moves until the visitor moves the pointer (desktop)
  or scrolls.

## 4. Motion ranges and timings

**Entry sequence** (`[data-intro-sequence='playing']`, times from controller
mount)

| Element | Start | Duration | Curve | Change |
| --- | --- | --- | --- | --- |
| TP arrival | 240 ms (`--hi-at-brand`) | 650 ms `normal` | `primary` | opacity 0 → 1, scale 0.985 → 1 |
| TP floor shadow | 240 ms | 650 ms `normal` | `primary` | opacity 0 → 1 |
| TP rise | 760 ms (`--hi-at-rise`) | 1000 ms `cinematic` | `cinematic` | translateY −6.5 svh (mobile −13 svh), scale 0.955 |
| Slogan | 1000 ms (`--hi-at-slogan`) | 650 ms `normal` | `primary` | translateY 0.8 em → 0 inside `clip-path: inset(-0.4em 0 -0.28em 0)`; opacity reaches 1 at 40% |
| Status | 1150 ms | 400 ms `fast` | `primary` | opacity |
| Progress row (visual-ready event) | 1230 ms | 400 ms `fast` | `primary` | opacity |
| Progress hairline | 1230 ms | 220 ms `micro` | `primary` | opacity |
| Header replica, brand line, silk | first paint | — | — | static (the silk keeps its 7 s drift) |

**Opening** (`html[data-home-intro='revealing']`, fractions of `--hi-duration`)

| Element | Window | Curve | Change |
| --- | --- | --- | --- |
| Panels | 0–0.18 D seam, 0.18–1.0 D split | `primary` then `cinematic` (keyframe literals) | ±4 px (`--hi-seam`), then ±100% |
| Header replica / brand line | same as panels | same | ride with ∓(50 svh + 1 px) |
| Loader TP | 0–0.18 D | `primary` | opacity → 0, scale 0.985 |
| Slogan, status, shadow | 0–0.12 D | `primary` | opacity → 0 |
| Silk | 0–0.24 D | `primary` | opacity → 0, translate(2%, −3%), scale 1.025 |
| Architecture A surface (far) | 0.18–1.0 D | `cinematic` | scale `--hi-space-scale` → 1 |
| Scene TP surface (mid) | 0.36–1.0 D | `primary` | translateY `--hi-space-object-y`, scale `--hi-space-object-scale` → rest |
| Leaves surface (near) | 0.36–1.0 D | `primary` | translateY `--hi-space-near-y` → 0 |
| Cloth | 0.50–0.95 D | `primary` | opacity 0 → 1 |
| Real header | 0.65–0.95 D | `primary` | opacity 0 → 1 |

**Scroll and pointer** (Scene 1 only)

| Item | Value |
| --- | --- |
| First-scroll approach | `arrivalTiming.approach = [0, 0.14]`, `(1 − (1 − t)²) × (1 − travel)` |
| Far-plane dolly | scale + `0.008 × approach × depth` (on top of the existing `0.012 × travel`) |
| Leaves drift | y − `6 × approach × depth` px (on top of the existing travel) |
| Pointer depth weight | `1 − smoothstep(p / 0.12)`. Full at rest, 0 once the TP leaves its hold |
| Pointer easing | `approach()` with τ = `DURATION.micro` (220 ms; 3τ ≈ `normal`). Stops at ε = 0.015 (≈ 0.1 px on the near plane). Steps capped at 64 ms |

## 5. Desktop behaviour (≥1200 px with a fine pointer)

- Full sequence with D = 1500 ms (`entrance`) and full amplitudes:
  - seam 4 px
  - far plane ×1.035
  - TP +1.4 svh / ×1.02
  - leaves +2.4 svh
- **Pointer depth**, measured at 1440×900 and 1366×768 with the pointer in a
  corner:

  | Plane | Offset |
  | --- | --- |
  | TP surface | −2.996 px / +1.995 px |
  | Portals | −5.991 px / +3.491 px |
  | Architecture, typography | 0 |

  Easing used 19 RAF callbacks in its first 300 ms and 0 after settling.
  Returning the pointer to the centre rests exactly (`transform` cleared).
  Touch and pen are ignored. Leaving the window or a hidden tab rests the
  planes.
- **First scroll**, measured at 1440×900. One 100 px wheel step gave p 0.043:

  | Element | Value |
  | --- | --- |
  | Far plane | ×1.00414 |
  | Leaves | −3.1 px |
  | Headline, portals, TP | unchanged |

  At three steps (p 0.128) the existing TP travel takes over.

## 6. Tablet behaviour (768–1199 px, or any touch-first screen)

- **Opening:** D = 1500 ms with reduced amplitudes (`--hi-space-scale` 1.026,
  object 1.05 svh / ×1.015, leaves 1.8 svh).
- **Pointer depth:** none. `motionTier()` returns `tablet` for this width or a
  coarse pointer. Nothing depends on hover.
- **First scroll:** depth 0.7. Measured at 1180×820 with touch emulation: at
  p 0.033 the far plane was ×1.00235 and the leaves −1.76 px.
- **Orientation:** 820×1180 ↔ 1180×820 changed cleanly. No overflow, no
  errors, poses rest.

## 7. Mobile behaviour (<768 px)

- **Opening:** D = 1000 ms (`cinematic`, was 900 ms). Seam 4 px. Far plane
  ×1.018, TP 0.7 svh / ×1.01. The leaves are hidden on mobile, as before.
- **Pointer:** no mouse-derived motion.
- **First scroll:** depth 0.5. Measured at 390×844: at p 0.039 the far plane
  was ×1.00194. The copy and TP hold.
- **Small mobile:** 360×740 was checked visually. The loader is aligned, the
  slogan sits on two lines, the opening is clean and the composition is
  unchanged.
- **Orientation:** 390×844 ↔ 844×390 changed cleanly.

## 8. Reduced-motion behaviour

- **Intro:** the loader shows its composed final frame at once: header, TP
  in its raised position, silk, slogan, status and brand line. There is no
  seam, slab or depth settle. The existing 300 ms `hi-reduced-exit` fade then
  reveals Scene 1 (captured; unchanged from before).
- **Scroll and pointer:** no first-scroll dolly (the transforms stay
  identity; `check:hero` asserts it) and no pointer depth.
- **Global rules:** the CSS kill switch still applies. JavaScript reads the
  preference live, so changing it mid-session rests every plane at once.

## 9. Assets used

Existing production assets only. There are no new images and no new image
requests.

- `intro-breeze-{720,1280}.webp`
- `stone-720.webp`
- `spatial-architecture-a{,-720,-1280}.webp`
- `spatial-portals{,-720}.webp`
- the inline TP SVGs
- the self-hosted fonts

The Scene 2 plate, the Atrium and Three.js keep their existing progress-gated
thresholds (0.16 / 0.12), which were not touched. No multi-layer hero assets
and no segmentation masks were made.

## 10. Performance impact

Production builds, cold cache, headless Chrome on this machine. Medians of
3 runs (all runs are in the PASS evidence).

| Metric | Before (`27c8c9f`) | PASS 01 |
| --- | --- | --- |
| Desktop 1440×900 LCP, unthrottled | 392 ms (Scene 1 plate) | 432 ms (same element; runs 412 / 432 / 544) |
| Desktop LCP, throttled | 1672 ms | 1708 ms |
| Desktop FCP, throttled | 780 ms | 776 ms |
| Mobile 390×844 LCP, throttled | 1256 ms (silk image) | 1272 ms (same element) |
| Mobile FCP, throttled | 796 ms | 792 ms |
| CLS (desktop / mobile) | 0.0044 / 0 | 0.0045 / 0 |
| Intro complete, desktop unthrottled | ≈ 3.20 s | ≈ 3.70 s (deliberate: opening 1000 → 1500 ms) |
| Intro complete, desktop throttled | ≈ 4.45 s | ≈ 4.98 s |
| Intro complete, mobile throttled | ≈ 4.37 s | ≈ 4.46 s (opening 900 → 1000 ms) |
| Requests on load | 32 | 33 (+ `tokens-*.js`, 0.36 kB gzip, shared by intro and story) |
| JS (gzip) | — | `home-experience` +0.74 kB, `home-intro-loader` −0.01 kB, `tokens` +0.36 kB; `three.module` byte-identical |
| RAF at rest | 0 | 0 |

**A deliberate correction during the pass.** A first draft hid the header
replica and silk until 420–1100 ms after hydration, to make Phase A pure
paper. That pushed throttled FCP from about 780 to about 1120 ms. It also took
the silk out of LCP candidacy (Chrome ignores `opacity: 0` elements), so
mobile LCP moved from about 1256 to about 1596 ms. The composed frame was
restored and both metrics returned to baseline. This is now a durable rule in
the design system.

**Runtime cost**

- The opening adds three compositor-only transform animations (far, mid, near
  surfaces) plus the panels' static edge shadows.
- Pointer depth writes `transform` on 1 + 4 elements only while easing.
- Nothing runs at rest.

## 11. Known issues deliberately deferred

1. **Windows scrollbar gutter.** During the intro, `scrollbar-gutter: stable`
   reserves a 15 px strip at the right edge. On classic (non-overlay)
   scrollbars it shows as a light strip beside the aperture during the
   opening. This predates PASS 01 and is visible in the before frames.
2. **Header swap.** The header replica and the real home header still use
   different layouts. They no longer crossfade (the replica leaves with its
   slab), but the real header still fades in at a different layout.
3. **Untouched legacy timings.** The loader's pointer parallax (140/180 ms
   `ease-out`), the progress hairline transition (180 ms `linear`) and the
   300 ms reduced exit were not part of the touched implementation. They are
   listed in the PASS 00 audit's migration table.
4. **Intro amplitude tiers are width-based.** Tablet amplitudes apply at
   768–1199 px. A large touch-first screen, such as an iPad Pro in landscape,
   gets desktop *intro* amplitudes, while `motionTier()` gives it `tablet`
   for pointer and scroll motion.
5. **Device coverage.** No real-device, Mac Retina, Safari or field
   measurement was done. The Mac-only blank Atrium frames (PASS 1) are
   unrelated and still open.
6. **Scene 1 → 2 double exposure** at p ≈ 0.27 belongs to TP3D PASS 02.
7. **Asset weight.** The `stone-720.webp` texture (160 KB) and the portal atlas
   weight (PASS 00 audit, F1) are unchanged.
8. **Shared tokens chunk.** The tokens module is a separate 0.36 kB request.
   Inlining it would need bundler configuration, which is out of scope.

## 12. Validation results

All run on 2026-10-03 against the final tree.

| Command | Result |
| --- | --- |
| `yarn lint` (`node_modules/.bin/oxlint`) | exit 0 |
| `yarn tsc --noEmit` | exit 0 |
| `yarn check:motion` | pass, now including "every intro keyframe curve is a token curve" |
| `yarn check:intro` | pass |
| `yarn check:hero` | pass (`check-spatial-hero` + new `check-hero-depth`) |
| `yarn check:home` | pass |
| `yarn check:content`, `check:assets`, `check:worlds` | pass |
| `yarn build` / `yarn build:vercel` | pass (only the existing `three.module` chunk-size warning) |
| `yarn check:routes http://localhost:8787` | pass: 44 pages, 76 images, 8 expected invalid routes |
| oxfmt on changed files, `git diff --check` | clean |

### Test expectations changed intentionally

**`check-intro-controller.mjs`**

The desktop opening expectation changed from 1000 to 1500 ms, mobile from 900
to 1000 ms, and the waits derived from them (`duration + 100` guard; the
StrictMode total). The opening now contains the clear and seam phases before
the slabs part. Desktop uses the `entrance` token, which the design system
reserves for a section's single arrival moment. Mobile uses `cinematic`
instead of an untokenized 900 ms. Every behavioural assertion is unchanged.
The test now resolves `@/lib/motion/tokens` for the controller.

**`check-spatial-hero.mjs`**

`arrivalFrame(0) ≡ arrivalFrame(0.1)` became "the *content* is identical"
(copy, portals, TP) plus "reduced motion keeps the whole frame identical".
The brief requires the first scroll to answer. New assertions:

- a sub-1% far-plane dolly that answers within the first 2% of progress;
- motion that never reverses;
- Scene 2 leaves and architecture A that equal the pre-PASS endpoints
  exactly.

A mutation check removed the hand-off; the Scene 2 assertion failed, as it
should.

**`check-home-chapters.mjs`**

- A stub for the new `./hero-depth` import.
- New assertions: one driver per mount, destroyed on unmount, ticked on the
  master RAF only while it wants time, no narrative re-render for pointer
  frames, and suspended on hidden tabs.

**`check-site.mjs`**

The loader copy assertion changed to `PREPARING THE SPACE`.

**`check-motion-foundation.mjs`**

Added an assertion that every `cubic-bezier` literal in `home-intro.css` is a
token curve. CSS ignores `var()` inside keyframe timing functions; this was
measured in Chrome during this pass.

### Visual QA

Production builds, pixel diffs against `27c8c9f` built the same way. A
fingerprint (`LOADING THE SPACE...` vs `PREPARING THE SPACE`) confirmed which
code each server ran.

| State | Desktop 1440×900 | Tablet 820×1180 | Mobile 390×844 |
| --- | --- | --- | --- |
| Scene 1 at rest (p 0) | 154 px at ±1 level | 177 px at ±1 level | identical |
| Scene 2 hold (p 0.45) | 11 px at ±1 level | identical | identical |
| Atrium (p 0.96) | 227 px at ±1 level | identical | identical |
| First scroll (p 0.20) | differs, intended (dolly) | differs, intended | differs, intended |

The ±1-level pixels are rasterisation noise. No pixel differs by more than one
level outside the intended first-scroll range.

**Screencasts** reviewed frame by frame:

| Viewport class | Size |
| --- | --- |
| Desktop wide | 1920×1080 |
| Desktop | 1440×900 |
| Laptop | 1366×768 |
| Tablet landscape | 1180×820, touch |
| Tablet portrait | 820×1180, touch |
| Mobile | 390×844 |
| Small mobile | 360×740 |
| Reduced motion | 1440×900 |

Checked in each: loader alignment, logo stability, the seam and slab split,
hero typography, portal visibility, no clipping, no overlapping nav, and the
resting state with the pointer stationary.

**Interaction QA** at 1440, 1366, 1180 (touch), 390 and reduced motion:

- pointer depth limits and settling;
- the first scroll, then a return to p 0 resting exactly;
- no horizontal overflow;
- no console errors or warnings.

**Orientation** changes on phone and tablet sizes were clean.

**Evidence** lives in the session scratchpad only (screencasts, sheets,
reports). It is not committed.
