# TP3D PASS 02 — Arrival → Perspective spatial handoff

This pass covers only the transition from Scene 01 (*A new breeze for
living.*) to Scene 02 (*A new breeze becomes a way of seeing.*).

Rules come from [TP3D-DESIGN-SYSTEM.md](TP3D-DESIGN-SYSTEM.md). The arrival
itself is [TP3D-PASS-01-ARRIVAL.md](TP3D-PASS-01-ARRIVAL.md). Timeline
internals are in [TANPHONG_HOME_MOTION_CONTEXT.md](TANPHONG_HOME_MOTION_CONTEXT.md).

| Item | Value |
| --- | --- |
| Date | 2026-10-03 |
| Starting HEAD | `d0edabe` — feat(home): refine TP3D arrival and spatial first impression |
| Scope kept | The intro, the PASS 01 opening, pointer depth and first scroll; Scene 02's design and its reading composition from p 0.42; the atmospheric bridge, the Atrium, the Footer, navigation and routes (verified, §15) |
| Not introduced | A new progress owner, RAF loop, observer, canvas, request, image, dependency or animation engine. No blur |

How measurements were taken:

- **Environment.** Headless Chrome 154 on this Windows 11 workstation, against
  local production builds (`yarn build` + `yarn start`). This is not field data
  and not a real phone, Mac or Safari.
- **Motion preference.** `prefers-reduced-motion` was pinned explicitly,
  because this machine reports `reduce` at OS level.

---

## 1. Before state

At `d0edabe`, Scene 01 → Scene 02 was a long layered crossfade around the
travelling TP (desktop ranges, master progress `p`):

- Scene 1 content left over 0.14–0.305: metadata, portals, then headlines.
- Plate B faded in over plate A for 0.22–0.375.
- Scene 2 copy rose in over 0.245–0.42, eyebrow first.
- Reduced motion swapped everything on one shared value (`perspective`,
  0.27–0.33).

## 2. Problem identified

Measured in screenshots of the production build at 1440×900, 390×844,
820×1180 and in reduced motion.

1. **Typography in the same place at the same time.** The Scene 2 EN column
   (left 20%, top 18%) enters exactly where the Scene 1 headline (left 19%,
   top 19%) is leaving. Over p 0.26–0.30 the eyebrow and heading appear under
   a still-visible Scene 1 headline.
2. **Two photographs blended.** The 0.155-wide plate crossfade made a long
   "two transparent slides" stretch (strongest at 0.24–0.34). Portals were
   still ghosting over it until 0.295.
3. **Reduced motion was the worst case.** At p 0.30 both headlines sat on
   top of each other at about 50%, over two blended plates and ghost portals.
4. **The TP was already continuous.** It is one element, with one scroll-owned
   transform and a travel from 0.12 to 0.42. It was never part of the problem.

## 3. Choreography phases

| Phase | Desktop `p` | What happens |
| --- | --- | --- |
| 1. Hero hold | 0–0.14 | Unchanged PASS 01 hold. Copy, portals and TP still; the far plane answers the first scroll |
| 2. Depth departure | 0.12–0.23 | The TP starts its existing travel (mid plane). The far plane keeps its dolly. The near plane separates: portals sink 12 px and recede to ×0.982 while metadata lifts away |
| 3. Content departure | 0.14–0.26 | Scene 1 leaves as blocks, in order: metadata → portals → EN headline → VI headline. The TP stays longest |
| 4. Negative space | 0.26–0.31 | No copy at all. The architecture, the travelling TP and the breeze (whose pose exchanges invisibly at 0.30) carry the move |
| 5. TP handoff | 0.12–0.42 | One continuous scroll-owned travel, unchanged; about 80% complete at the breath |
| 6. Scene 2 entry | 0.255–0.42 | Context first: plate B opens behind the TP (0.255–0.325). Then heading (eyebrow + title) 0.31, body 0.345, metadata 0.375 |
| 7. Perspective stillness | 0.42–0.48 | Unchanged reading hold; the complete composition is static |

The rhythm runs: MEDIUM (departure), LOW (breath), MEDIUM (entry), LOW
(reading). This is deliberately not a hero moment; the next one remains the
World Approach.

## 4. Exact normalized progress ranges

All values are in `arrivalTiming` (`components/home/experience/home-story-frame.ts`).

| Element | Before | After |
| --- | --- | --- |
| Metadata (signature, mobile eyebrow, axis, scroll indicator) | 0.14–0.23 | 0.14–0.195 |
| Portals | 0.17–0.295 | 0.155–0.23 |
| EN headline | 0.20–0.30 | 0.185–0.25 |
| VI headline (≥1200) | 0.205–0.305 | 0.195–0.26 |
| VI headline (<1200, `narrowHeadline`) | 0.14–0.245 | 0.14–0.215 |
| `.sh-discovery` hidden from | 0.305 | 0.26 |
| Plate B, desktop/tablet | opacity 0.22–0.375 | aperture 0.255–0.325; opacity 0.255–0.275 (`architectureFade`) |
| Plate B, mobile | opacity 0.22–0.375 | dissolve 0.265–0.305 (`mobileArchitecture`) |
| Scene 2 eyebrow | 0.245–0.305 | 0.31–0.36 (with the EN heading) |
| Scene 2 EN / VI heading | 0.285–0.345 / 0.30–0.36 | 0.31–0.36 / 0.32–0.37 |
| Scene 2 EN / VI body + rule | 0.335–0.395 / 0.35–0.41 | 0.345–0.395 / 0.355–0.405 |
| Scene 2 metadata (sign-off, read-story, centre axis copy) | 0.36–0.42 | 0.375–0.42 |

**Reduced motion** (`arrivalTiming.reduced`)

| Element | Before | After |
| --- | --- | --- |
| All Scene 1 copy | 0.27–0.33 (`perspective`) | 0.25–0.28 |
| Plate B | 0.27–0.33 | 0.28–0.30 |
| Scene 2 heading / body / metadata | 0.27–0.33 | 0.30–0.33 / 0.31–0.34 / 0.32–0.35 |

**Unchanged**

- The TP travel 0.12–0.42 and its curve; reduced TP 0.28–0.32.
- The PASS 01 approach 0–0.14 and pointer weight 0–0.12.
- The chapter switch at 0.30.
- The cloth pose exchange 0.27–0.33 and the rail.
- The Scene 2 hold 0.42–0.48 and every bridge range.

**Measured breath** (copy-free progress between the last Scene 1 copy and
the first Scene 2 copy, from the frame model)

| Tier | Window | Length |
| --- | --- | --- |
| Desktop | 0.259 → 0.311 | 0.052 ≈ 122 px at 1440×900 |
| Tablet | 0.249 → 0.311 | 0.062 ≈ 112 px at 1180×820, ≈ 161 px at 820×1180 |
| Mobile | 0.249 → 0.311 | 0.062 ≈ 94 px at 390×844 |
| Reduced | 0.279 → 0.301 | 0.022 ≈ 51 px desktop |

## 5. Element ownership

One property, one clock. Every value here is a pure function of the master's
progress.

| Element | Owner | Writes |
| --- | --- | --- |
| `.sh-monogram` (TP) | master `tpPose` + bridge | `transform`, `opacity`, `visibility` (unchanged) |
| `.sh-monogram > [data-hero-surface]` | `hero-depth.ts` (PASS 01) | `transform` while weight > 0, i.e. p < 0.12 only |
| `.sh-portal` (each) | `hero-depth.ts` | pointer `transform`, 0 by p 0.12, before the departure starts at 0.155 |
| `.sh-portals` | `arrivalFrame` | departure `opacity` + `transform` |
| Scene 1 / Scene 2 copy blocks | `arrivalFrame` (until 0.48), then `storyTextDeparture` (bridge) | `opacity`, `transform` |
| `[data-hero-layer="architecture-a"]` | `arrivalFrame` | dolly `transform` (unchanged). Never faded |
| `[data-hero-layer="architecture-b"]` | `arrivalFrame` | `opacity`, **`clip-path`** (new), settle `transform` |
| `.sh-plane-background` | bridge (mass) | Scene 2 exit push (unchanged) |

## 6. Scene 1 exit behaviour

Scene 1 leaves as semantic blocks with the existing amplitudes. Nothing moves
per word or per letter, and nothing rotates.

1. **Metadata** (signatures, mobile eyebrow, centre axis, scroll indicator):
   opacity out with a 5 px lift (0 px for the indicator).
2. **Portals:** opacity out while sinking 12 px × depth and receding to
   ×0.982. This is a depth separation, not a fly-off. They are inert once
   invisible.
3. **Headlines:** EN lifts 12 px × depth, VI 10 px × depth, while fading.
   The two headlines are staggered by 0.01.
4. **Spatial planes:** the far plane keeps its dolly (the PASS 01 approach
   hands into the travel). The leaves keep their existing near-plane drift.

## 7. Shared TP handoff

- The TP is unchanged by this pass. It is still one element whose scroll-owned
  transform travels continuously from the Scene 1 pose to the Scene 2 pose
  (0.12–0.42).
- It is never duplicated, crossfaded or jumped. Its opacity stays 1
  throughout (asserted).
- The rest of the scene is reorganised around it. During the breath it is the
  only object in the frame besides the architecture and the breeze.
- Plate B's aperture opens on the frame's centre line, directly behind the
  TP, so the new room appears "from behind" the anchor.
- The PASS 01 pointer contribution reaches 0 at p 0.12, before any scroll
  departure begins (0.155). The pointer-owned surface and the scroll-owned
  parent are different elements in any case.

## 8. Scene 2 entry behaviour

Scene 2's typography, copy, bilingual columns and art direction are
unchanged. Only when and how it enters changed.

1. **Architecture / context first.**
   - *Desktop and tablet:* plate B opens through a vertical aperture centred
     on the frame, `clip-path: inset(0 x% 0 x%)` with x from 50% to 0. Its
     opacity rises only during the first part of the window, while the band
     is still narrow behind the TP. Plate A stays at full strength around it,
     so two photographs never blend full-frame.
   - *Mobile:* a short dissolve inside the breath. Both mobile crops are
     near-blank walls, so a moving edge would only add seams.
   - At 0.325 the aperture is open and the clip is removed (`clip-path:
     none`).
2. **Heading:** eyebrow + h2 per column (EN 0.31, VI 0.32), rising 8 px
   (eyebrow 5 px).
3. **Body:** rule + body copy per column, rising 6 px.
4. **Metadata:** sign-off, read-story link and centre axis copy, rising 5 px.
   The read-story link becomes interactive only when this group completes,
   on both the motion and reduced paths.

## 9. Desktop behaviour (≥1200 px)

- The full sequence above, at depth 1.
- The aperture edges sit outside both text columns before any Scene 2 copy
  is visible (asserted: inset ≤ 6% whenever Scene 2 copy is > 0).

**Pointer depth:** unchanged (PASS 01).

**Wheel-scroll frame timing:** production build, headless, 1440×900. Slow,
normal and fast wheel passes, forward and reverse, through 0.08 → 0.55.

| Build | Median frame interval | p95 | Frames > 33 ms |
| --- | --- | --- | --- |
| `d0edabe` | 16.7 ms | 16.8–16.9 ms | 0 |
| PASS 02 | 16.6–16.7 ms | 16.8–16.9 ms | 1 frame (33.6 ms) in the first fast run; 0 in all 12 sub-runs of two repeat runs |

## 10. Tablet behaviour (768–1199 px)

- The same choreography and aperture as desktop, at depth 0.7.
- The VI headline uses the earlier narrow window (0.14–0.215), because the TP
  travels through its position on narrower layouts.
- Nothing depends on hover.
- Orientation changes mid-transition (820×1180 ↔ 1180×820) stay consistent:
  no overflow and no errors. The same pixel scroll maps to a different `p`,
  because the story height differs by breakpoint.

## 11. Mobile behaviour (<768 px)

- **Simpler than desktop:**
  - depth 0.5 for every move;
  - no moving edge; the plates dissolve between two near-blank walls inside
    the copy-free breath;
  - no pointer logic.
- **Text sequencing:** EN headline → (VI already gone) → breath → EN heading
  → VI heading → bodies → metadata. The breath is about 94 px at 390×844, so
  the hold never feels pinned.
- **Small mobile:** 360×740 checked; no clipping or overlap.
- **Orientation:** 390×844 ↔ 844×390 changed cleanly mid-transition.

## 12. Reduced-motion behaviour

- There is no dolly, depth separation, aperture or travel offset; every
  `transform` in the frame is identity.
- Content order is preserved as short opacity changes:
  - Scene 1 out over 0.25–0.28;
  - a breath with a quick plate dissolve over 0.28–0.30;
  - Scene 2 heading 0.30–0.33, body 0.31–0.34, metadata 0.32–0.35.
- The TP keeps its existing short, readable interpolation (0.28–0.32).
- Double exposure is solved here too: no two copy blocks are ever visible
  together (asserted at every 0.001 of progress).

## 13. Reverse-scroll behaviour

- Every value is a pure function of native progress, with no time component
  in the handoff. Scrolling back reproduces exactly the forward frames.
  - This is asserted at 121 dense positions per viewport and per reduced
    state.
  - It is also asserted for the master's DOM writes after fast skips in both
    directions.
- Measured reverse wheel passes show the same frame timing as forward (§9).
- The aperture closes symmetrically on the way back.
- Stopping anywhere leaves a static frame. With the scroll stopped at p 0.29,
  the page fired 0 animation frames per second.

## 14. Performance impact

- No new requests, images, observers, RAF loops or canvases. The changes are
  JS retiming plus one `clip-path` value, and only during 0.255–0.325 on
  desktop and tablet.
- JS (`yarn build:vercel`): only `home-experience` changed, from 47.10 to
  47.56 kB raw and from 17.50 to 17.69 kB gzip (+0.19 kB). `tokens`,
  `home-intro-loader` and `three.module` have byte-identical hashes.
- Frame timing: no measurable change on this machine (§9). This was a desktop
  GPU in headless Chrome; phones, laptops and Safari were not measured.
- At rest and when stopped mid-transition: 0 RAF.
- Not affected: LCP, FCP and CLS paths (no first-paint change).

## 15. Tests added / updated

**`scripts/check-spatial-hero.mjs`**

The PASS 2-era assertions "Scene 1 copy is still present at the overlap" and
"Scene 2 begins before Scene 1 disappears" (p 0.29) encoded the double
exposure. They are replaced, intentionally, by the opposite contract. These
checks run for 12 viewports × motion/reduced, at every 0.001 of progress from
0 to 0.6:

- Scene 1 and Scene 2 copy never share the frame. In particular, the two
  headlines are never readable together.
- Portals never stack over the plate change.
- Plate A never fades: the architecture is present throughout.
- The breath lasts at least 0.049 (motion) or 0.019 (reduced).
- Scene 2 enters in the order heading → body → metadata.
- **Desktop and tablet aperture:**
  - plate B is partially opaque only while the band is narrow (inset ≥ 32%);
  - the edges sit outside the text columns (inset ≤ 6%) whenever Scene 2
    copy is visible;
  - the aperture never closes while scrolling forward.
- **Mobile and reduced:** no moving edge, and the plate dissolve happens
  entirely inside the breath.
- Reverse scroll reproduces every frame (121 dense positions).
- **The Scene 2 endpoint at 0.42 is pinned exactly:**
  - every Scene 2 block at opacity 1 and an identity transform;
  - every Scene 1 block at 0;
  - the portals at their full departure;
  - plate B at opacity 1, `clip-path: none` and an identity transform.

  The existing PASS 01 endpoint guards (leaves, plate A) still pass. The EN/VI
  heading stagger is kept (asserted at 0.335).

Mutation checks:

- stretching the Scene 1 headline to 0.32 fails "never share the frame";
- starting the plate change at 0.20 fails "portals never stack";
- fading plate B over the whole window fails "only fades while narrow";
- extending the aperture to 0.37 fails "edges clear the text columns".

**`scripts/check-home-chapters.mjs`** — a new master-level block, comparing
the timeline's DOM writes with the pure frame:

- fast skip 0 → 0.45 and back to 0.05;
- landing in the breath (0.285, all copy at 0);
- a resize to 390 px mid-transition;
- a hidden tab, with scrolling while hidden (no paint) and an exact frame on
  resume;
- a reduced-motion change mid-transition (reduced breath at 0.29).

**Unchanged and still passing:** `check-atmospheric-bridge` (0.42 ≡ 0.48),
`check-home-motion`, `check-hero-depth`, and the intro and motion suites.

**Visual verification** (production builds, the same scripts on `d0edabe` and
on PASS 02)

| State | Desktop 1440×900 | Mobile 390×844 | Tablet 820×1180 |
| --- | --- | --- | --- |
| Scene 1 at rest (p 0) | identical | identical | identical |
| Scene 2 hold (p 0.45) | identical | identical | identical |
| Atrium (p 0.96) | 227 px at ±1 level (the same rasterisation noise recorded in PASS 01) | identical | identical |

Screen captures were reviewed at every 0.01–0.015 of `p` through the
transition on the following viewports:

| Viewport class | Size |
| --- | --- |
| Desktop | 1440×900 |
| Laptop | 1366×768 |
| Tablet landscape | 1180×820, touch |
| Tablet portrait | 820×1180, touch |
| Mobile | 390×844 |
| Small mobile | 360×740 |
| Reduced motion | desktop and mobile |

Also checked:

- slow, normal, fast and reverse wheel screencasts;
- a stop at p 0.29;
- a resize mid-transition (1440 → 1180 → 390 → 1440);
- orientation changes mid-transition;
- no console errors, no horizontal overflow, and the portals and hidden
  Scene 2 inert in the breath.

PASS 01 was re-verified on this build: pointer depth at the corner (TP
−2.996/+1.996 px, portals −5.992/+3.492 px), the first wheel step (×1.00414,
leaves −3.1 px; mobile ×1.00194), reduced motion still, and 0 RAF at rest.

## 16. Known issues deliberately deferred

1. **The aperture is a hard edge.** CSS `clip-path` has no feathering. A soft
   edge would need a `mask-image` repaint per frame. The hard edge reads as an
   architectural reveal on the current plates, but a future multi-layer asset
   pass may prefer a different seam.
2. **The aperture centre is the frame centre (50%), not the TP's exact axis**
   (≈51.5% desktop, ≈54% tablet). This keeps the frame function free of
   layout reads.
3. **Tablet landscape legibility.** At 1180×820, Scene 2's EN heading partly
   sits over plate B's dark foliage. This is the existing Scene 2 composition
   (pixel-identical to before) and needs a composition or asset decision.
4. **Plate B readiness.** If plate B has not decoded, Scene 2 copy still
   enters over plate A (existing fallback). The breath and order are kept, but
   there is no plate change.
5. **The reduced dissolve is short** (0.28–0.30) and passes through one
   blended frame by nature. It carries no text.
6. **Device coverage.** No real-device, Mac Retina or Safari verification.
   Frame timing comes from one desktop GPU.
