# TP3D PASS 04 — Atmosphere → Worlds / Atrium reveal

This pass covers only the journey from the sky suspension after the hidden
world swap (p 0.64) to the finished, interactive Atrium:

sky → oculus → architectural recognition → Atrium → room openings →
3D WORLDS → *Enter the worlds.* → final stillness.

Rules come from [TP3D-DESIGN-SYSTEM.md](TP3D-DESIGN-SYSTEM.md). The previous
pass is [TP3D-PASS-03-PERSPECTIVE-ATMOSPHERE.md](TP3D-PASS-03-PERSPECTIVE-ATMOSPHERE.md).
Timeline internals are in
[TANPHONG_HOME_MOTION_CONTEXT.md](TANPHONG_HOME_MOTION_CONTEXT.md).

| Item | Value |
| --- | --- |
| Date | 2026-10-04 |
| Starting HEAD | `8baae05` — feat(home): refine Perspective to Atmosphere transition |
| Changed | Atrium camera range per family; recognition and settle landmarks; room, title and CTA reveal windows; exposure and header windows; interaction, rail, chapter and discovery gates; reduced-motion reveal order, exposure and header; a zenith shade on tablet and phone plates; a short-landscape Atrium layout |
| Not changed | Everything up to and including the 0.64 swap; the atmosphere renderer, shaders, tiers, pixel budgets and ambient rates; story height; the Atrium image; the four rooms and their routes; *Enter the worlds.* copy; room discovery behaviour; the reveal order |
| Not introduced | A new renderer, canvas, RAF loop, progress owner, request, image, dependency, effect or time-driven camera |

How measurements were taken:

- **Environment.** Headless Chrome 154.0.8037.93 on this Windows 11
  workstation (NVIDIA RTX 3090), against local production builds
  (`yarn build` + `yarn start`). The `8baae05` baseline was rebuilt from the
  same sources and measured back to back. This is not field data. Phone
  numbers come from desktop emulation, not a real phone GPU.
- **Modes.** `prefers-reduced-motion` was pinned explicitly (this machine
  reports `reduce` at OS level). Save-Data was emulated with
  `Emulation.setDataSaverOverride`. The DOM fallback was forced with
  `--disable-webgl --disable-webgl2`.
- **Header contrast** was measured on the pixels behind the header (with the
  header hidden), as WCAG contrast of ivory `#f3e9d6` and ink `#332b22`
  against the band's mean luminance.
- **Scale.** 0.01 of progress is 23.4 px at 1440×900, 18.0 px at 1180×820,
  26.0 px at 820×1180, 15.2 px at 390×844, 8.6 px at 844×390 and 6.5 px at
  740×360.

---

## 1. Before state

At `8baae05` (1440×900, WebGL):

| Beat | Range |
| --- | --- |
| Parked sky (camera still) | 0.64–0.705 (152 px) |
| Pull-back | 0.705–0.91, `arrive` from 5.88× to 1× |
| Oculus rim enters | ≈0.73 |
| Architecture recognisable | ≈0.81 |
| Plate motion under a fifth of peak | 0.868 |
| Header ink → ivory | 0.72–0.78 |
| Exposure | 0.768–0.92 |
| Rooms / 3D WORLDS / Enter / the worlds. | 0.82–0.89 / 0.846–0.88 / 0.854–0.89 / 0.862–0.90 |
| Body / signoff / CTA + baseline | 0.873–0.907 / 0.883–0.915 / 0.892–0.92 |
| Links interactive / discovery | 0.90 / 0.92 |
| Final hold | 0.92–1.0 (187 px) |
| Reduced UI | all ten groups together, 0.80–0.84 |

Baseline frames were captured at 0.64–1.0 for 1440×900, 1180×820, 820×1180,
390×844, 844×390, 740×360 and 667×375, plus band-luminance sweeps every
0.005 from 0.69 to 0.93.

## 2. Visual problem / opportunity

1. **Typography arrived during the zoom.** The first room label started at
   0.82, when the plate was still at 1.59× and moving at 90% of its peak
   rate. *Enter* started at 1.11× (40% of peak). The title was readable over
   moving geometry.
2. **The header turned ivory over bright sky.** Over 0.72–0.78 the band
   behind the nav was sky (mean luminance ≈190). At 0.77 the nav was 93%
   ivory, about 1.6:1 against the sky, and nearly illegible.
3. **Phones had no sky beat.** The portrait crop sits 7 source px above the
   oculus rim. The camera started at 0.686, while the cloud was still
   clearing, so the rim appeared at ≈0.70, about 15 px after the photographic
   sky.
4. **The pull-back's last fifth was dead travel.** From 0.868 to 0.91 the
   plate moved by under 1%, while the final hold was only 0.08 of the span.
5. **Landscape phones collided with the header.** At 844×390, "3D WORLDS /
   Enter" sat under the wordmark. At 740×360 and 667×375 the stacked phone
   layout pushed *Enter* above the viewport and *the worlds.* over the
   wordmark.
6. **Phone and tablet portrait headers were weak in the final frame.** The
   portrait crop puts the oculus sky behind the header. Ivory was ≈2.1–2.6:1
   there.
7. **Reduced motion revealed everything at once,** and its exposure faded in
   over a static plate (0.768–0.92) after the framing cut.

## 3. Sky suspension

The camera stays parked on the oculus sky crop until camera start, now
0.72 (desktop) / 0.715 (tablet and phone).

- **Parked:** desktop 152 → 187 px, 820×1180 158 → 195 px, 390×844
  70 → 114 px, 844×390 52 → 64 px.
- **Sky before the rim:** desktop 208 → 231 px, phone 94 → 132 px.
- **Not dead scroll:** the PASS 03 atmosphere still clears during it. Cloud
  at 0.64, shader sky opening over 0.667–0.72, then the photographic sky.
  Every phone now gets a clear photographic sky before the rim; the rim
  enters only after the atmosphere has fully opened (asserted).
- Story height is unchanged.

## 4. Oculus discovery

The camera begins at zero velocity, so the first architectural edge is a
thin glass rim at the bottom of the sky, at ≈0.74 (desktop) / ≈0.73
(phones). The rim, the stone ring and the wood soffit follow. The opening
reads as an opening at ≈0.78. Nothing else changes in the frame: no text, UI
or rail.

## 5. Camera pull-back

- **Ranges:**
  - desktop 0.72–0.88 (was 0.705–0.91);
  - tablet 0.715–0.875 (was 0.701–0.907);
  - phone 0.715–0.87 (was 0.686–0.895).
- **Curve and model:** same `arrive` curve, same transform-origin model,
  same bounded `settleVisual` mass. The perceived zoom rate (log scale) still
  starts at zero, peaks mid-travel (desktop 0.792) and decays with a long
  tail.
- **Heavier, not floating:** the move is 22–26% shorter than before, which
  raises the peak perceived rate by about a quarter. The slow start and the
  long arrival are kept.
- **Bounds:** no overshoot, rebound or spring; scale stays monotonic in
  [1, skyScale]. Identity from camera end.

## 6. Architecture recognition

`MOTION.camera.recognizable` is now a measured milestone, 0.81: from there
the frame shows at least 55% of the plate (oculus, columns, room openings,
tree). It is reached at 0.795–0.803 on every tested viewport, and 0.04
earlier it is still under 55% (asserted at six viewports).

## 7. Camera settle

`MOTION.camera.settleStart`, 0.85, marks plate motion under a fifth of its
peak:

| Viewport | Under a fifth of peak | Visually still (under 2%) |
| --- | --- | --- |
| 1440×900 | 0.847 (was 0.868) | 0.866 (was 0.892) |
| 390×844 | 0.837 (was 0.851) | 0.856 (was 0.876) |
| 820×1180 | 0.841 (was 0.864) | 0.860 (was 0.888) |

The nearly composed Atrium carries the frame without any interface until
0.845, the first room label.

## 8. Room reveal

- **Windows:** rooms 01–04 at 0.845–0.875, 0.851–0.881, 0.857–0.887,
  0.863–0.893. They are shorter (0.03) and tighter (0.006 stagger) than
  before (0.04 / 0.01).
- **Where the camera is:** at the first label the plate is at 1.046 and
  23% of peak rate on desktop (1.013 / 10% on phones). Room labels never
  show over a plate above 1.06× (asserted).
- **Unchanged:** the order, the architectural positions on desktop, the
  grouped 2×2 grid below 1200 px, the treatment (opacity, 9 px rise, line
  scale) and room discovery behaviour.

## 9. 3D WORLDS reveal

0.867–0.893, after the second room has begun, so the space is discovered as
navigable before it is named.

## 10. Enter the worlds reveal

- **Windows:** *Enter* 0.872–0.899, *the worlds.* 0.878–0.905. These are
  still the two existing semantic spans.
- **Where the camera is:** at *Enter* the plate is at 1.0001 and 0.4% of
  peak rate (was 1.106 and 40%). The title lands on a still composition;
  typography never shows over a plate above 1.01× (asserted).
- **Unchanged:** size, copy and effects.

## 11. Body / signoff / CTA reveal

Body 0.885–0.909, signoff 0.89–0.913, CTA + baseline 0.895–0.915 (last).
Everything is revealed at 0.915, which is now `bridge.settled`.

## 12. Header colour choreography

`MOTION.header` 0.72–0.78 → **0.82–0.855**. The band behind the header
crosses the ivory/ink contrast crossover (mean luminance ≈125) at:

| Viewport | Element | Crossover |
| --- | --- | --- |
| 1440×900 | nav | ≈0.838 |
| 1440×900 | wordmark | ≈0.78 |
| 390×844 | wordmark / icons | ≈0.84 / ≈0.86 |

The window is centred there.

| Viewport and moment | Ink and band | Contrast |
| --- | --- | --- |
| 1440×900 at 0.78, before | ivory nav over sky | ≈1.6:1 |
| 1440×900 at 0.78, after | dark ink over sky | ≈7:1 |
| 1440×900 final | ivory nav, band 104 | 4.6:1 |
| 390×844 final, before | ivory over sky | ≈2.6:1 |
| 390×844 final, after (zenith shade) | ivory wordmark / icons | 4.5:1 / 3.8:1 |

The header returns to ink on reverse travel as soon as the frame is mostly
sky again (asserted). Reduced motion changes the header only inside the
0.745 cut's dip.

## 13. Exposure choreography

- **Window:** `MOTION.light` 0.768–0.92 → **0.785–0.865**. It starts as the
  opening becomes architecture and is complete before the first typography
  (0.867). Text never enters over a changing exposure. It reads as
  adaptation inside the camera move, not as a filter fading in over a still
  frame.
- **Zenith shade:** tablet and phone plates gain a zenith shade, `#241a1499`
  fading out by 24% (tablet) and 18% (phone); before it was `#241a1440` and
  `#241a1433`. It is the same photographic device the desktop plate already
  uses (`#241a1480`). Below the header it reads as a deeper zenith, not a
  vignette.

  | Viewport | Ivory nav contrast, before → after |
  | --- | --- |
  | 820×1180 | 2.4 → 4.4:1 |
  | 1180×820 | 2.8 → 4.8:1 |

- **Reduced motion:** exposure switches inside the framing cut's dip, so a
  static plate never visibly darkens.

## 14. Exact progress ranges before / after

| Value | Before | After |
| --- | --- | --- |
| `camera.start` desktop / tablet / mobile | 0.705 / 0.701 / 0.686 | 0.72 / 0.715 / 0.715 |
| `camera.end` desktop / tablet / mobile | 0.91 / 0.907 / 0.895 | 0.88 / 0.875 / 0.87 |
| `camera.recognizable` (label only → measured milestone) | 0.77 | 0.81 |
| `camera.settleStart` (label only → measured milestone) | 0.86 | 0.85 |
| `header` | 0.72–0.78 | 0.82–0.855 |
| `light` (exposure) | 0.768–0.92 | 0.785–0.865 |
| `ui[0..3]` rooms | 0.82–0.86 … 0.85–0.89 | 0.845–0.875 … 0.863–0.893 |
| `ui[4]` 3D WORLDS | 0.846–0.88 | 0.867–0.893 |
| `ui[5]` / `ui[6]` Enter / the worlds. | 0.854–0.89 / 0.862–0.90 | 0.872–0.899 / 0.878–0.905 |
| `ui[7]` / `ui[8]` body / signoff | 0.873–0.907 / 0.883–0.915 | 0.885–0.909 / 0.89–0.913 |
| `ui[9]` CTA + baseline | 0.892–0.92 | 0.895–0.915 |
| `bridge.revealStart` (rail, chapter `worlds`) | 0.82 | 0.845 |
| `bridge.interactive` | 0.90 | 0.895 |
| `bridge.settled` / `discoveryStart` | 0.92 / 0.92 | 0.915 / 0.915 |
| `reduced.ui` | 0.80–0.84 for all | 0.775 + 0.006 × order, 0.02 each (0.775–0.854) |
| Final hold | 0.08 (187 px desktop) | 0.085 (199 px desktop, 129 px phone) |

Unchanged: the swap at 0.64, `reduced.cut` 0.745, `halfDip`, `floor`, crop
heights, the sky origin and every atmosphere value.

## 15. Desktop behaviour (≥1200 px)

Full sequence as above, with the labels on the architecture and moving with
the plate. Checked at 1440×900 and 1366×768.

## 16. Tablet behaviour (768–1199 px)

- **Composition:** the grouped rooms at the right, copy bottom-left.
- **Timing:** the camera finishes 0.005 earlier than desktop.
- **Checked:** 1180×820 and 820×1180. The copy enters after exposure is
  complete, so the foliage behind it is already shaded. The zenith shade
  supports the ivory nav over the oculus.

## 17. Mobile portrait behaviour (<768 px)

- **Composition:** the stacked copy, the 2×2 room grid and the CTA in flow,
  with no pointer dependence.
- **Timing:** the camera starts at 0.715, after the atmosphere has opened,
  so phones finally get sky → rim → oculus → Atrium. The settle is
  complete (1.013×) when the first room appears.
- **Header:** the zenith shade carries the ivory header over the oculus.
- **Checked:** 390×844 and 360×740 (layout unchanged).

## 18. Mobile landscape behaviour (short landscape)

- **New rule:** `@media (max-width: 1199px) and (max-height: 540px) and
  (orientation: landscape)` in `home-story.css`, reusing the tablet's
  grouped composition sized by viewport height:
  - copy absolute bottom-left, `max(24px, 8svh)` up, 47% wide;
  - title `clamp(46px, 15svh, 72px)`;
  - body `clamp(13px, 3.8svh, 16px)`;
  - rooms (2×2) above the CTA at the right;
  - the desktop plate shading.
- **Measured in the final frame:**

  | Viewport | Header bottom | Copy starts at | Title height | Copy–rooms gap |
  | --- | --- | --- | --- | --- |
  | 844×390 | y 78 | y 166 | 102 px | 32 px |
  | 740×360 | y 76 | y 150 | 94 px | 14 px |
  | 667×375 | y 76 | y 140 | 98 px | 14 px |

  No overlap, no clipping and no horizontal overflow at any of them.
- **Unchanged:** the plate crop and the camera geometry.

## 19. Reduced-motion behaviour

- **Framing:** a static sky crop until the 0.745 cut, a 0.015 exposure dip
  with the cut, then the static Atrium. No pull-back (scale is only
  skyScale or 1, asserted), no cloud traversal, no double exposure (one
  world at a time).
- **Header and exposure:** both change only inside the dip.
- **Reveals:** opacity only, in order: rooms, 3D WORLDS, *Enter*, *the
  worlds.*, body, signoff, CTA (0.775–0.854, nothing travels). Links become
  interactive at 0.895, as before.

## 20. Reverse scroll

Every value is a pure function of progress. Walking back from the final
Atrium (slow, normal and fast reverse casts, and 290 master-level steps):

1. title and copy withdraw;
2. then rooms;
3. then the camera starts back toward the oculus;
4. the header returns to ink over the sky;
5. links are inert again before they fade;
6. rim, sky, cloud — then PASS 03.

## 21. Fast scroll

Jumps 0.66 → 0.95 → 0.66 land on the pure frame through the real master,
with and without WebGL. A slow walk from 0.66 to 0.95 ends on exactly the
same DOM state as the jump.

## 22. Interactivity / inert lifecycle

- **Rooms and CTA:** room links become interactive together at 0.895, when
  all four are fully revealed. The CTA becomes interactive at 0.915, its
  reveal end.
- **Section:** the worlds section loses `inert` at 0.895.
- **Discovery:** hover/focus discovery (`data-world-interactive`) opens at
  0.915.
- **Reverse:** every gate closes again on reverse. No control is ever
  focusable while not fully revealed (asserted for every 1/3600 of progress,
  motion and reduced).

## 23. Performance impact

Back to back against an `8baae05` rebuild.

| Measure | `8baae05` | PASS 04 |
| --- | --- | --- |
| `home-experience` JS | 47,780 B (17,553 B gzip) | 47,928 B (17,610 B gzip) |
| Homepage page CSS | 27,531 B | 28,899 B (short-landscape block, zenith shades) |
| `three.module` | `DdUsZgl6`, 524,279 B | identical file |
| Canvases | 1 | 1 |
| Requests while travelling 0.62 → 1.0 | footer prefetches/lazy images only | identical list |
| Atrium plate ready after crossing 0.16, desktop / phone (3 runs) | 62–75 / 61–68 ms | 61–67 / 56–63 ms |
| CLS desktop / phone | 0.0046 / 0 | 0.0046 / 0 |
| Frame interval during pull-back (median / p95, 12 casts) | 16.7 / 16.8–16.9 ms | 16.7 / 16.8 ms |
| Frames > 33 ms (12 casts, desktop + phone) | 0 | 0 |
| RAF stopped at 0.73 / 0.80 / 0.86 / 0.95 / 1.0 | 0 each | 0 each |
| RAF stopped inside the atmosphere (0.66) | ≈60 / s | ≈60 / s |

The camera is still one CSS transform on one image; `will-change` is set
only while the bounded mass response is active.

## 24. Tests added / updated

- **New `scripts/check-atmosphere-worlds.mjs`** (in `yarn check:home`):
  - fingerprint lock of every PASS 01/02/03 frame from 0 to 0.64 against
    `8baae05`;
  - the swap at exactly 0.64;
  - the parked sky with no interface, interaction, exposure or ivory;
  - the rim only after the atmosphere has opened;
  - a monotonic pull-back with no overshoot and an exact identity end;
  - the recognition milestone (≥55% of the plate) before settle before
    interface;
  - zoom-rate gates: first room ≤40% of peak, *Enter* ≤5%, rooms below
    1.06×, typography below 1.01×;
  - semantic order; complete-before-interactive links; the full final state
    and discovery at settle;
  - a still final hold of at least 0.08;
  - reverse identity, and interface → rooms → camera on reverse;
  - header ink over sky and exposure complete before typography;
  - reduced static framings, ordered reveals, and dip-bound exposure and
    header;
  - no renderer input to the Atrium frame;
  - the short-landscape CSS rule;
  - a fingerprint lock of the approved PASS 04 Atrium reveal.

  Ten mutations each fail it: old room start, old header window, old desktop
  camera end, early interaction, simultaneous reduced reveals, hold not
  aligned with the CTA, old phone camera start, old exposure window, reduced
  exposure fading on a static plate, and half-revealed focusable links (the
  last caught by `check-home-chapters`).
- **`check-home-chapters.mjs`**, new PASS 04 master block:
  - fast skips and the endpoint after a slow walk, with active and fallback
    sky;
  - a reverse walk with the order of withdrawal and inert state;
  - no writes or RAF in the hold;
  - resizes and orientation through 1180×820, 820×1180 and 390×844
    mid-pull-back;
  - reduced static, ordered reveals.

  Updated intentionally: the header assertion (ink at 0.78, half-way at the
  window centre); the "UI begins on raw progress" sample moved from 0.83 to
  0.86; the camera helper mirrors the identity `none` write; the chapter
  label is now checked at `revealStart`.
- **`check-atmospheric-bridge.mjs`:** "no UI in the sky" now uses
  `revealStart` (motion) or the end of the cut's dip (reduced); "interactive
  only after settlement" uses `bridge.interactive`; "long camera arrival"
  compares the last 0.01 before each family's camera end.
- **`check-room-discovery.mjs`:** discovery opens at `discoveryStart`, which
  equals `bridge.settled`.
- **`check-perspective-atmosphere.mjs`:** its fefb910 Atrium fingerprint is
  handed to the new suite; it keeps the parked-sky and no-UI-in-suspension
  checks. No PASS 03 atmosphere assertion was weakened.

## 25. Visual QA

Production builds, before and after:

- **Stills** at 0.64, 0.66, 0.68, 0.70, 0.72, 0.73, 0.745, 0.76, 0.78, 0.80,
  0.81, 0.82, 0.84, 0.85, 0.86, 0.87, 0.88, 0.90, 0.915, 0.95 and 1.0 on
  1440×900, 1366×768 (subset), 1180×820, 820×1180, 390×844, 360×740
  (subset), 844×390, 740×360 and 667×375.
- **Modes:** reduced motion (desktop and phone), WebGL off (desktop) and
  Save-Data (phone). Their camera, exposure, header, reveal and tab-order
  states equal the WebGL runs at every stop.
- **Casts:** slow, normal and fast wheel or touch casts, forward and
  reverse, 0.62 → 1.0 (desktop and phone).
- **Header-band luminance sweeps** every 0.005 from 0.69 to 0.93 at five
  viewports.

Stopped frames looked intentional: early pull-back (a sky with a thin rim),
oculus recognition, mid pull-back, near settle (the composed Atrium alone),
first room reveal, title reveal and the final poster frame.

## 26. Known issues deliberately deferred

1. **Sky crop softness.** The 5.9× crop of a 1672×941 plate stays soft. No
   sharpening, upscaling or extra request was added; a higher-resolution
   plate is an asset decision.
2. **One header colour.** Over 0.79–0.82 the desktop wordmark (still dark
   ink) sits over the darker ring at ≈2.4:1, while the nav is over sky. Over
   ≈0.835–0.845, mid-mix nav items over the oculus are briefly low-contrast.
3. **Landscape phones are short.** The whole reveal there is ≈110–140 px of
   scroll (6.5–8.6 px per 0.01), because story height was deliberately
   unchanged.
4. **Reduced-motion interaction gate.** The reduced UI is complete at 0.854,
   but links wait for the shared 0.895 gate (as before PASS 04).
5. **Desktop story rail.** The rail returns with the first room (0.845) and
   still overlaps the Kitchen counter (PASS 0 issue 11).
6. **Mac blank frames.** The Mac-only blank Atrium frames (PASS 0 risk 1)
   remain unreproduced.
7. **Footer release.** The header stays ivory as the stage scrolls away
   (unchanged behaviour).
8. **Devices.** No real phone, tablet, Mac Retina or Safari verification.

## 27. Exact final Atrium state handed to PASS 05

From p 0.915 (`bridge.settled`) to 1.0, on every tier:

| Element | State |
| --- | --- |
| Camera | Identity, `transform: none`, no `will-change` |
| Exposure | 1 |
| Header | Ivory, `data-chapter-theme="dark"` |
| Reveals | All ten at opacity 1, identity transforms |
| Worlds section | Not inert |
| Links | Four room links and the CTA interactive and focusable |
| Room discovery | Enabled (`data-world-interactive`) |
| Desktop rail | Visible at its end position |
| Atmosphere and cloth | Gone |
| Narrative | Nothing writes or schedules a frame until the Footer release |

PASS 05 owns what happens when a visitor enters from here. Taxonomy, routes,
copy and room discovery are unchanged.
