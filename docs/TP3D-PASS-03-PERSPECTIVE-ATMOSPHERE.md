# TP3D PASS 03 — Perspective → Atmosphere

This pass covers only the journey from Scene 02 (*A new breeze becomes a way
of seeing.*) through the Breeze, the loss of editorial context, the
atmosphere and the hidden world swap, up to the sky suspension. It ends where
the Atrium camera starts its pull-back (desktop 0.705, tablet 0.701,
mobile 0.686).

Rules come from [TP3D-DESIGN-SYSTEM.md](TP3D-DESIGN-SYSTEM.md). The previous
pass is [TP3D-PASS-02-SPATIAL-HANDOFF.md](TP3D-PASS-02-SPATIAL-HANDOFF.md).
Timeline internals are in
[TANPHONG_HOME_MOTION_CONTEXT.md](TANPHONG_HOME_MOTION_CONTEXT.md) and the
atmosphere engine in [HOME-ATMOSPHERIC-AUTO-MOTION.md](HOME-ATMOSPHERIC-AUTO-MOTION.md).

| Item | Value |
| --- | --- |
| Date | 2026-10-03 |
| Starting HEAD | `fefb910` — feat(home): refine Arrival to Perspective spatial handoff |
| Changed | Scene 02 copy departure ends, a first stir of the cloth, thread resolution near the lens, the reduced-motion swap |
| Not changed | The atmosphere engine (renderer, shaders, tiers, pixel budgets, ambient rates), the cloth→cloud takeover window, the TP and architecture departure, the swap at 0.64, everything before 0.48 and everything from camera start |
| Not introduced | A new progress owner, RAF loop, renderer, canvas, request, texture, dependency, blur, glow or post-processing |

How measurements were taken:

- **Environment.** Headless Chrome 154.0.8037.93 on this Windows 11
  workstation (NVIDIA RTX 3090), against local production builds
  (`yarn build` + `yarn start`). The fefb910 baseline was rebuilt from the
  same sources and measured back to back. This is not field data, and phone
  numbers come from desktop emulation, not a real phone GPU.
- **Modes.** `prefers-reduced-motion` was pinned explicitly (this machine
  reports `reduce` at OS level). Save-Data was emulated with
  `Emulation.setDataSaverOverride` (`navigator.connection.saveData` read
  `true`). The DOM fallback was forced with `--disable-webgl --disable-webgl2`.
- **Scale.** The story is 3.6 viewports tall. At 1440×900, 0.01 of progress is
  23.4 px of scroll and the whole PASS 03 range (0.42–0.705) is 667 px, about
  6.7 wheel steps. At 390×844, 0.01 is 15.2 px.

---

## 1. Before state

At `fefb910` (1440×900, WebGL active; text opacity labels / body / heading):

| p | Copy | TP opacity | Cloth scale | Cloud density | Sky cover | Phase |
| --- | --- | --- | --- | --- | --- | --- |
| 0.42–0.48 | 1 / 1 / 1 | 1 | 1 (static) | 0 | 0 | SCENE2_HOLD |
| 0.50 | .92 / 1 / 1 | .998 | 1 | 0 | 0 | TP_DEPART |
| 0.52 | .65 / .95 / 1 | .966 | 1 | 0 (canvas armed, transparent) | 0 | BREEZE_NEAR_CAMERA |
| 0.54 | .32 / .74 / .95 | .925 | 1.04 | .09 | 0 | |
| 0.556 | .10 / .52 / .80 | .907 | 1.36 | .31 | 0 | takeover starts |
| 0.58 | 0 / .19 / .48 | .866 | 3.12 | .71 | .22 | |
| 0.60 | 0 / .02 / .21 | .766 | 6.02 | .96 | .69 | CONTEXT_LOSS |
| 0.606 | 0 / 0 / .14 | .724 | 7.03 | .99 | .82 | takeover ends |
| 0.62–0.632 | 0 / 0 / .03→0 | .62→.55 | 9.2→10 | 1 | ≈1 | |
| 0.64 | 0 | 0 | 10 | 1 | 1 | swap, SKY_VOID |
| 0.66–0.68 | 0 | 0 | 9.4→7.4 | 1→.77 | 1 | sky opens |
| 0.705 | 0 | 0 | 4.5 | .17 (opening .80) | 1 | OCULUS (camera start) |

Screenshots: baseline stills at all sixteen required progress points for
1440×900, 1180×820, 820×1180 and 390×844 with WebGL, plus the DOM fallback,
reduced motion and Save-Data, and slow/normal/fast scroll recordings.

## 2. Visual problem / opportunity

What the audit found, in order of visibility:

1. **Copy half-readable under forming cloud.** The far bank's lobes form at
   the left and right edges, which is exactly where the two Scene 02 text
   columns sit, while the centre (the TP) stays clear. Around 0.55–0.59 the
   heading and body were still at 50–80% opacity under soft cloud patches:
   one line crisp, the next fogged. It read like a rendering fault, not air.
   (PASS 00 had listed it as "patchy fogged text".) Where cloud density first
   reaches 0.5 (p ≈ 0.567), body was 0.35 and heading 0.66. The heading
   lasted to 0.631, well into context loss.
2. **No first sign of air.** The cloth was static until 0.53 (35 px moved by
   0.54). Labels started leaving at 0.484 and body at 0.506. The editorial
   page began to empty with no visible cause.
3. **Graphic stripes.** At 10× magnification the cloth's 37 thread strokes
   became 5.5–11 px hairlines in dozens of parallel arcs. In the DOM fallback
   (Save-Data phones, no WebGL) that was the whole picture from 0.60 to 0.70.
   With WebGL it was visible around 0.57–0.60, stacked over the forming cloud.
4. **Reduced motion double-exposed the swap.** Scene 02 (architecture, TP)
   cross-dissolved into the Atrium sky crop over 0.605–0.64. At 0.62 both
   plates showed at about 60/40. At 0.632 a ghost TP sat over the sky, and it
   popped off at 0.64. That breaks design rule 9.

Evaluated and kept as they were: the takeover window, the TP and
architecture departure, the swap, the sky suspension, the ambient rates, the
colour pipeline, the mobile tier and the camera (§9–§13).

## 3. Choreography phases

| Phase | Desktop `p` | What happens |
| --- | --- | --- |
| 1. Perspective stillness | 0.42–0.48 | Unchanged. Copy, TP, architecture and cloth are still. The renderer may preload, invisibly |
| 2. First sign of air | 0.48–0.53 | The resting cloth starts to swell toward the lens from its upper-right anchor: 1.3% at 0.50, 4.6% at 0.52 |
| 3. Editorial departure | 0.484–0.60 | Labels, then body, then heading leave as blocks with their existing small rise. The TP anticipation starts at 0.494 and the architecture push at 0.55 |
| 4. Breeze foreground | 0.52–0.632 | The cloth accelerates toward the lens and becomes the foreground layer from 0.54. Its fine weave resolves out of focus as it nears (0.525–0.595) |
| 5. Handoff and context loss | 0.556–0.64 | With WebGL, the cloth yields to cloud that has already formed. Copy is gone at 0.60. The TP is the last editorial object and is swallowed by the cloud |
| 6. Hidden world swap | 0.64 | Under complete coverage (WebGL sky cover 1, or fully dense cloth) |
| 7. Sky suspension | 0.64–0.705 | Cloud clears into sky. Camera parked, no text, no UI. Ambient air only |

## 4. Exact progress ranges before / after

| Element | Before | After |
| --- | --- | --- |
| Labels (signoff / columns) | 0.484–0.574 | 0.484–**0.556** |
| Body | 0.506–0.608 | 0.506–**0.58** |
| Heading | 0.526–0.631 | 0.526–**0.60** |
| Cloth approach | `accelerate` 0.52–0.632 | 0.97 × `accelerate` 0.52–0.632 **+ 0.03 × smoothstep 0.48–0.632** (`MOTION.breeze.stir`) |
| Cloth bridge pose used from | > 0.52 | **> 0.48** (`bridge.exitStart`) |
| Thread opacity | 1 throughout | **1 → 0 over 0.525–0.595** (`pose.weave`) |
| Reduced swap | cross-dissolve 0.605–0.64, Scene 3 visible from 0.605 | **cut at 0.64 inside a 0.015 exposure dip**: Scene 2 + TP 1 → 0.65 over 0.625–0.64, Scene 3 0.65 → 1 over 0.64–0.655 |

Unchanged: TP anticipation 0.494–0.556 and departure 0.534–0.64; architecture
0.55–0.64; takeover 0.556–0.606; density 0.558–0.626; transfer 0.525–0.595;
foreground 0.54; crossing 0.612–0.672; exit from 0.646; swap 0.64;
`SKY_BRIDGE` (preload 0.12, active 0.5135–0.723); camera start
0.705 / 0.701 / 0.686; reduced framing cut 0.745.

After (1440×900):

| p | Copy L / B / H | Cloth scale | Weave | TP | Reduced (Scene 2 / Scene 3) |
| --- | --- | --- | --- | --- | --- |
| 0.50 | .87 / 1 / 1 | 1.013 | 1 | .998 | 1 / hidden |
| 0.52 | .50 / .91 / 1 | 1.046 | 1 | .966 | 1 / hidden |
| 0.54 | .13 / .56 / .91 | 1.131 | .88 | .925 | 1 / hidden |
| 0.556 | 0 / .25 / .64 | 1.481 | .59 | .907 | 1 / hidden |
| 0.58 | 0 / 0 / .18 | 3.251 | .12 | .866 | 1 / hidden |
| 0.60 | 0 / 0 / 0 | 6.109 | 0 | .766 | 1 / hidden |
| 0.632 | 0 | 10 | 0 | .546 | .84 (TP dips too) / hidden |
| 0.64 | 0 | 10 | 0 | 0 | hidden / .65 |
| 0.655 | 0 | ≈9.7 | 0 | 0 | hidden / 1 |

## 5. Perspective stillness

0.42–0.48 is untouched. A fingerprint of every master-written frame for
p ≤ 0.48 (homeStoryFrame, arrivalFrame, tpPose, bridgeFrame, the sky frame
and the cloth pose, five viewports, both motion modes) equals fefb910
exactly. Screenshots at 0.42, 0.46 and 0.48 differ from the baseline by no
pixel above a level of 8 in any mode.

## 6. Scene 02 departure

The order (labels → body → heading), the block-based fades and the existing
upward amplitudes (6 / 9 / 12 px × depth) are kept. Only the ends moved, to
three landmarks the bridge already had:

- labels end when the cloth starts yielding (`breeze.takeover[0]`, 0.556);
- body ends mid-handoff (0.58);
- heading ends exactly when context loss begins (`bridge.occlusionStart`,
  0.60).

The heading is still the longest-lived block: its 0.074 span ties the body
for longest, and it persists 0.02 after the body. Where cloud density
reaches 0.5 (p ≈ 0.567), body is now 0.08 and heading 0.41 (were 0.35 and
0.66). From
0.596 no copy is above 1%. Text now dissolves into air rather than sitting
half-readable under it.

## 7. TP departure

Unchanged: anticipation 0.494–0.556, departure 0.534–0.64, scale
−(0.04a + 0.155d), y −(4a + 22d) px, opacity ×(1 − 0.09a)(1 − 0.42d).
Review showed it already worked:

- it outlives the heading at every sampled point;
- with WebGL it sits under the canvas and disappears into the near bank
  between 0.58 (crisp, 0.87) and 0.60 (hidden), which reads as being
  swallowed by the cloud;
- in the DOM fallback the foreground cloth covers it.

Reduced motion now dims the TP with its plate during the exposure dip
(§17).

## 8. Breeze approach

- **First stir.** 3% of the approach starts at 0.48 on a smoothstep, so the
  resting cloth begins to swell toward the lens with Scene 02's departure
  instead of at 0.53. At 1440×900 its loose end moves 11 px by 0.50, 41 px by
  0.52 and 115 px by 0.54 (was 0, 0 and 35). Mobile moves 4 / 15 / 43 px.
  The approach still reaches 1 exactly at 0.632 with zero velocity. From 0.58
  on, the pose differs from before by under 5% of scale, so the crossing,
  coverage and exit are as before. Direction, focus, rotation and the
  upper-right exit (agreeing with `AMBIENT.wind`) are unchanged.
- **Weave resolution.** As the cloth transfers into its near-camera
  projection (0.525–0.595), its 37 thread strokes fade to 0. The broad folds
  and the luminous body remain, so magnified fabric reads as silk passing the
  lens, not hairline stripes. Reading poses keep the authored weave: no
  attribute is written while weave is 1, and reverse scroll removes it again.
  Fold material is unchanged.

## 9. DOM → WebGL handoff

The takeover window (0.556–0.606) is unchanged. Measured evidence that it
holds, and that the PASS 03 changes did not break it:

- **Never ahead of the cloud.** The cloth's yield never leads the cloud
  density by more than 0.02 (tested at 1,600 samples up to the swap), and
  density is above 0.99 when the takeover completes.
- **No coverage gap.** Frames every 0.004 from 0.48 to 0.648 were compared
  with the 0.48 frame. The correlation of high-frequency Scene 02 detail
  falls monotonically from 1.00 to about 0 at 0.596, with no step back up,
  in both the WebGL and the fallback paths, before and after.
- **No flash or brightness jump.** Mean luminance rises smoothly from 184.6
  to a peak of 222.6 (at 0.588–0.592), by at most +3.5 per 0.004 step, then
  stays within 220–225 through the swap.
- **No colour-temperature jump.** Mean warmth (R − B) slides gradually from
  34.6 (Scene 02) to 9.6 at 0.608 and 1.2 at 0.648 (cloud toward sky).
- **No double density.** With threads resolved, the cloth at 0.58 is soft
  fold bands over the forming cloud, not a second hard texture.
- **No canvas rectangle.** The canvas becomes visible at 0.5135 while every
  plane is still transparent.
- **No activation mid-crossing.** A renderer that finishes warming
  mid-crossing stays `ready` and the DOM cloth carries the whole crossing
  (existing behaviour, now tested at the master level).

## 10. Atmospheric formation

Unchanged engine: far / mid / near banks enter at local 0.07 / 0.18 / 0.27
(master 0.517 / 0.544 / 0.566), formation local 0.10–0.45, sky cover
complete from about 0.603, sky windows (`patches`) 0.603–0.672, ambient
drift along `AMBIENT.wind`. The shaders, palette (#b0c3e0 / #c2d3e9 /
#eee8dc / #eef0f3 / #cdd6e4, measured from the Atrium oculus) and tiers are
untouched.

## 11. Context loss

From 0.60 no copy is left. The TP fades under the near bank, and the
architecture (pushed +3.5%, faded toward 0.42) is lost in the cloud rather
than flying away. The fully covered interval is about 0.60–0.65 (117 px at
1440×900, roughly one wheel step). In motion it shows the near banks
passing the lens and sky windows opening; it is not a long fog wall.

## 12. Hidden world swap

Unchanged at 0.64 and still decided by scroll alone
(`swapped = p >= 0.64` at every viewport and mode). At the swap:

- **WebGL:** sky cover 1 (every pixel opaque, cover ≥ 0.78 from 0.62 to
  0.65), cloud density 1, opening 0.
- **DOM fallback:** the cloth is at opacity 1 and density 1, and its sampled
  silhouette covers a 41×25 probe grid at 16 viewports (existing test).
- **Both:** exactly one world is visible at every sampled progress, now in
  reduced motion too. TP and text are 0 once swapped. Forward and reverse
  samples around 0.6399 / 0.64 / 0.6401 are identical, and the master writes
  the same states in both directions.

## 13. Sky suspension

Unchanged and verified. After the swap the cloud clears through irregular
bank-shaped openings onto shader sky (0.645–0.67), and the photographic
oculus sky is revealed under it (opening 0.667–0.72). The Atrium camera is
parked: `atriumPose(0.64)` equals `atriumPose(cameraStart)`. No text, UI,
room label or loader appears (every reveal is 0). Stopped at 0.67, the
master RAF runs only for the ambient air, about 60 calls per second with
the renderer drawing at its ~30 fps ambient cap. Camera and story state do
not move. At 0.80 and 0.95 there are 0 RAF calls.

## 14. Desktop behaviour (≥1200 px)

As above. Three cloud banks, DPR cap 1.5, pixel budget 2.8 MP. The canvas
measured 1440×900 at device DPR 1, the same before and after. The cloth
uses back / front / near projections.

## 15. Tablet behaviour (768–1199 px)

Same choreography, two banks, DPR cap 1.25, budget 1.6 MP. Checked at
1180×820 and 820×1180: copy is gone before the cloud, the folds are soft and
the sky opens cleanly. No separate tablet timing.

## 16. Mobile behaviour (<768 px)

Same progress ranges. The mobile tier has one cloud bank, DPR 1, a 0.56 MP
budget and a 24 fps ambient cap (the canvas measured 390×844 = 0.33 MP, as
before). The cloth has no near projection (transfer 0), but the weave still
resolves, by the same curve. Copy at 0.58 is 0.18 heading only. At 15 px per
0.01, the bridge is short (0.42 → 0.686 is 405 px). Checked at 390×844 and
360×740.

## 17. Reduced-motion behaviour

No cloth, no WebGL, no ambient motion, no TP scale or y travel (unchanged).
Narrative:

1. Perspective, still.
2. Copy leaves in place (same ranges, no rise) by 0.60.
3. A copy-free frame of the architecture and TP to 0.625.
4. A short exposure dip: Scene 2 and the TP dim to 0.65 over 0.625–0.64.
5. A cut at 0.64 to the static sky crop at 0.65, which brightens to 1 by
   0.655.
6. The existing static sky, held to the framing cut at 0.745 (unchanged).

No two plates are ever blended, so nothing is double-exposed. A plate is
always at least 0.65 visible (existing invariant). This uses the same dip
vocabulary as the existing 0.745 framing cut. The hidden pre-swap world
keeps opacity 0, so the DOM before 0.64 is unchanged.

## 18. Save-Data / fallback behaviour

Save-Data phones and failed, late or absent WebGL keep the complete DOM
bridge. The cloth crosses with dense material at the swap, and with threads
resolved it reads as close fabric rather than stripes. Tested at the master
level:

- the WebGL failure before activation and mid-bridge (immediate cloth
  restore);
- readiness before the bridge (takeover), during the Breeze, very late and
  after the swap threshold (DOM cloth carries the crossing);
- Save-Data reported to the renderer.

In the browser, `--disable-webgl` and the Save-Data emulation produced no
errors.

## 19. Reverse-scroll behaviour

Every changed value is a pure function of master progress:

- copy ranges;
- the stir;
- the weave (removed again below 0.525);
- the reduced dip.

Reverse casts (slow, normal, fast) show sky → cloud → Breeze → Perspective,
with the cloth swelling back to rest and the threads returning. The
reduced cut also reverses at 0.64.

## 20. Fast-scroll behaviour

Frames are derived from current progress, not from the frames in between.
Jumps 0.45 → 0.70 → 0.45 land on exactly the pure frame, both in the pure
suite and in the master (visibility, opacities, TP hidden over Scene 3). The
fast casts (two large wheel steps across the bridge) showed no stuck canvas,
half-loaded cloud, blank stage or stray TP.

## 21. Performance impact

Back to back against a fefb910 rebuild at 1440×900 (WebGL, fallback,
reduced) and 390×844:

| Measure | fefb910 | PASS 03 |
| --- | --- | --- |
| `home-experience` chunk | 47,565 B (17,489 B gzip) | 47,780 B (17,552 B gzip) |
| `three.module` chunk | 524,279 B, `DdUsZgl6` | identical file |
| Total client JS (gzip) | 352,822 B | ≈352,890 B |
| Requests while travelling 0.42 → 0.76 | 0 | 0 |
| Canvases | 1 | 1 |
| Canvas buffer, 1440×900 / 390×844 | 1,296,000 / 329,160 px | same |
| RAF at rest outside atmosphere (0.45, 0.80, 0.95) | 0 / s | 0 / s |
| RAF stopped inside atmosphere (0.62, 0.67) | ≈61 / s | ≈61 / s |
| Frame interval while scrolling (median / p95) | 16.7 / 16.8–17.1 ms | 16.7 / 16.8–17.1 ms |
| Frames > 33 ms over six desktop WebGL casts | 7 (an earlier run: 21) | 12 (an earlier run: 9) |
| Stopped inside / after atmosphere (p95) | 16.8–16.9 ms | 16.8–17.0 ms |

The >33 ms outliers come from wheel bursts and appear in both builds; their
count varies more between runs than between builds. The DOM fallback casts
had 6 (fefb910) and 11 (PASS 03); mobile and reduced runs had none in either
build. No mobile GPU claim is made.

## 22. Tests added / updated

- **New `scripts/check-perspective-atmosphere.mjs`** (in `yarn check:home`):
  - fingerprint lock of every PASS 01/02 frame through 0.48 against fefb910;
  - Perspective hold;
  - semantic order with the heading last and gone at context loss;
  - atmosphere not too early, and copy largely gone before dense cloud;
  - a restrained, perceivable stir;
  - cloth never yielding ahead of the cloud, and weave resolved before
    magnification;
  - swap coverage, exclusivity in both modes, and determinism;
  - forward/reverse identity around the swap;
  - the reduced dip-cut, with the TP dipping with its plate;
  - fast skips 0.45 ↔ 0.70;
  - narrative frames unchanged by 20 s of ambient time, and a parked,
    monotonic camera;
  - fingerprint lock of the Atrium range from camera start (PASS 04
    boundary).

  Ten mutations (old copy ends, no stir, a dominant stir, reduced overlap,
  a TP pop at the cut, threads never resolving, an early takeover, a moved
  camera start, a swap outside coverage) each fail it.
- **`check-home-chapters.mjs`**, new TP3D PASS 03 block driving the real
  master:
  - fast skips and exact swap reversal;
  - WebGL ready before / during / very late / after the swap threshold;
  - failure before activation and mid-bridge;
  - Save-Data on a phone;
  - the reduced dip-cut;
  - the mobile tier, a hidden tab, resize during the handoff, and
    orientation 820×1180 ↔ 1180×820;
  - 0 frames at rest outside the atmosphere.

  The harness gained a `saveData` option. Three mutations of the master or
  frame each fail it.
- **`check-home-motion.mjs`:** no velocity kick at `exitStart` either.
- **`check-atmospheric-bridge.mjs`:** "one world at a time" now applies to
  reduced motion too.
- **`check-continuous-breeze.mjs`:** stir from `exitStart`, weave
  resolution, exact reverse restoration of the authored weave, and threads
  in the reverse checkpoint state.

No existing atmospheric failure test was weakened or removed.

## 23. Visual QA

Production builds, before and after:

- **Stills** at 0.42, 0.46, 0.48, 0.50, 0.52, 0.54, 0.556, 0.58, 0.60,
  0.606, 0.62, 0.632, 0.64, 0.66, 0.68 and 0.705:
  - 1440×900, 1366×768, 1180×820, 820×1180, 390×844 and 360×740 (WebGL);
  - the 1440×900 DOM fallback;
  - reduced motion at 1440×900 and 390×844;
  - Save-Data at 390×844.
- **Casts:** slow, normal and fast wheel or touch scroll, forward and
  reverse, at 1440×900 (WebGL, fallback, reduced) and 390×844.
- **Stops:** at 0.45, 0.62, 0.67, 0.80 and 0.95, with RAF counts.
- **Back/forward** from `/worlds` at 0.60: restored to 0.60000 with the same
  phase and visibility.
- **Resize mid-handoff** 1440 → 820×1180 → 390×844 → 1180×820 → 1440.
- **Phone orientation** 390×844 ↔ 844×390 inside the atmosphere: coherent
  state for the re-derived progress, no horizontal overflow, no errors.
- **Reload:** the intro plays and the page starts at the top (the PASS 01
  intro policy, unchanged).

## 24. Known issues deliberately deferred

1. On desktop the heading is still about 0.6 at 0.556, when the first
   far-bank patch crosses its last line. It is lighter than before, but the
   bank geometry is engine work.
2. In stills, the fully covered interval (0.60–0.65) looks fairly uniform.
   Its traversal is visible in motion, and it was not retuned because the
   engine is out of scope.
3. The sky suspension is short in pixels: 0.64–0.705 is 152 px at 1440×900
   and 0.64–0.686 is 70 px at 390×844. The story is only 3.6 viewports tall.
   Lengthening it means moving camera start (PASS 04) or the story height,
   which would change PASS 01/02.
4. In the fallback the fold bands keep crisp edges at 10×. A blur filter
   would be expensive at that size and is excluded by the brief.
5. Wheel-burst frames over 33 ms exist in both builds; SVG cloth repaint at
   large scale is suspected but not profiled.
6. On an 844×390 landscape phone, the header overlaps the Atrium title. That
   is the Atrium/header area, which belongs to PASS 04.
7. A reload replays the intro and starts at the top (PASS 01 policy).
8. Mobile GPU behaviour was not measured on real devices.

## 25. Exact boundary handed to PASS 04

PASS 04 starts at camera start: desktop 0.705, tablet 0.701, mobile 0.686.
At that frame:

- **Worlds:** Scene 3 is the only visible world. The Atrium plate is parked
  at the oculus sky crop (5.88× at 1440×900), as it has been since 0.64.
- **Atmosphere:** with WebGL, cloud density is 0.17 and the opening is
  0.80, so the shader sky is giving way to the photographic oculus. Without
  WebGL, the cloth is at 0.39 opacity and still leaving toward the upper
  right, as before.
- **Copy and UI:** no copy, TP, room label, title, CTA or rail.
- **Header:** dark ink; the ivory mix starts at 0.72.

The Atrium pull-back, the oculus reveal, the exposure, the header transition,
the room labels, Enter the worlds, the CTA, room discovery and final
stillness are byte-for-byte the fefb910 functions. The fingerprint lock in
`check-perspective-atmosphere` fails if any of them changes.
