# Homepage PASS 1 — Atmospheric auto-motion bridge

Scroll controls the journey; time gives the air life. PASS 1 extends the
existing Three.js sky bridge (PASS 3B) so the atmosphere between Scene 2 and
Scene 3 keeps living while the reader rests, without the camera or narrative
ever moving on its own. No dependency was added.

## Motion model

| System | Owner | Drives |
| --- | --- | --- |
| **Macro (scroll)** | `createHomeStoryTimeline` — native scroll progress, unchanged | WebGL camera Z/X/Y, cloud density and formation, cloth → cloud handoff, hidden world swap (0.64), sky cover / opening, DOM oculus pull-back, Scene 3 UI. Identical scroll → identical narrative frame. |
| **Micro (time)** | Integrated ambient state in `atmospheric-sky-frame.ts` (`advanceAmbient`) fed by the master's RAF timestamps | Cloud advection along the Breeze current, bounded bank wander, slow domain warp (shape re-forming), aperiodic density breathing, drift of small sky windows. Never the camera, never progress. |

Weighting: time is a rate, not a position. Drift is 0.35% / 0.5% / 0.7% of the
viewport height per second for the far / mid / near banks and 0.25% for the sky
field, at full `life`. `life` (0–1) is a pure function of progress: 0 outside
the active window, ramps in through cloud formation, peaks in the suspension
(≈0.60–0.65) and falls as the sky opens (×(1−0.45·skyMix)·(1−0.5·opening)).
Tiers scale it (desktop 1, tablet 0.85, mobile 0.6). Because rates are
integrated, changing progress can never make clouds jump; reversing scroll
reverses the narrative while the air simply continues forward in time.

Measured "life" in the browser, desktop, scroll stopped (mean absolute
difference of 400-px greyscale frames):

| Stop | 1 s apart | 6 s apart | Camera Z / progress after 6 s |
| --- | --- | --- | --- |
| 0.56 | 0.07 | 0.20 | unchanged |
| 0.60 | 0.22 | 0.71 | unchanged |
| 0.62 | 0.21 | 0.89 | unchanged |
| 0.64 | 0.16 | 0.55 | unchanged |
| 0.66 | 0.23 | 1.00 | unchanged |
| 0.68 | 0.20 | 1.19 | unchanged |
| 0.70 | 0.01 | 0.03 | unchanged |
| 0.75 / 0.85 / 1.0 | 0 | 0 | unchanged |

For reference, the UNESCO recording's final still world changes by ≈0.35 per
50 ms on the same metric; its cloud caption hold (3.0–3.6 s) is **completely
frozen** (0.00). Tân Phong's air is therefore subtler than UNESCO's final
ambient drift and livelier than its cloud hold, by request.

## Render loop

There is still one RAF owner (the master). A frame is either a **narrative**
render (scroll / resize / lifecycle, as before) or an **ambient-only** frame
that calls `skyBridge.tick(now)` and nothing else. The master keeps asking for
frames only while `skyBridge.wantsTime()`: the canvas is armed, drawn, visible,
inside the active window (master ≈0.5135–0.723) and `life > 0`. Ambient draws
are throttled per tier (30 fps desktop/tablet, ≈20–24 fps mobile); scroll
frames draw immediately.

Clock safety: each step is clamped to 42 ms; any gap longer than 250 ms
(hidden tab, paused bridge, long task) resumes in place. `document.hidden`
cancels the RAF and suspends the bridge; the clock pauses outside the
atmosphere and resumes from the same ambient state on re-entry.

Measured (production build, headless Chrome 154, RTX 3090):

| Position | RAF/s | WebGL draws/s |
| --- | --- | --- |
| Desktop inside bridge | 60 | 120 / 90 / 60 / 30 (4 → 1 visible planes, 30 fps) |
| Mobile inside bridge | 60 | 40 / 20 (2 → 1 planes, ≈20 fps) |
| Outside bridge, Atrium, Footer, reduced motion | **0** | **0** |

## Atmosphere

- **Planes:** far sky plane + far / mid / near cloud banks (unchanged geometry,
  one shared `PlaneGeometry`, four materials). Desktop 3 banks, tablet 2,
  mobile 1 (mid). No textures, no post-processing, no raymarching.
- **Cloud look:** large Gaussian banks, medium value-noise breakup, desktop-only
  fine breakup in open sky, derivative relief (lit tops, shaded bases). Inside
  a bank: broad volume shading and sharpened billow lighting, so the lens never
  reads as a flat sheet.
- **Inside-atmosphere moment (≈0.60–0.67):** luminous haze behind shaded banks
  plus small soft windows of drawn sky (`patches`), evaluated from one shared
  screen-space field in every layer. Windows change colour/opacity only inside
  the canvas; the sky plane keeps full coverage, so neither DOM world is
  readable at the swap.
- **Lighting:** warm ivory `#eee8dc` near Scene 2 → daylight `#eef0f3` → cool
  shade `#cdd6e4`; no pure white, no storm greys.

## Breeze → cloud handoff

Far bank appears from 0.517, mid from 0.544, near from 0.566 (master
progress). With WebGL painting, the DOM cloth yields over
`MOTION.breeze.takeover` = **0.556–0.606** (was 0.575–0.62), before its
magnified folds can read as stripes. Without WebGL the cloth keeps the full
crossing. The story rail now hides from 0.556 so typography leaves before the
atmosphere closes in.

## World swap and sky handoff

The DOM swap stays at **0.64** under full sky coverage (`skyCover` = 1 from
0.6225). The DOM camera is already parked on the Atrium's oculus crop. The
WebGL sky palette was measured from that crop (`#b0c3e0` overhead → `#c2d3e9`
toward the rim). In the browser at p 0.68 the drawn sky and the real
photograph differ by ≤2 RGB levels per band (old palette: up to 8). Openings
follow cloud banks; Three.js never draws the oculus or architecture. Clouds are
gone by 0.723, before the Atrium becomes recognisable (≈0.77).

## First crossing

Three.js preparation now starts at p ≥ 0.12 (was 0.30), and a warm-up that
completes before cloud formation (local < 0.1, master < 0.5245) arms the
current crossing invisibly. With 4× CPU throttling and ≈9 Mbps / 150 ms, a
≈1.2 s scroll from Scene 1 into the cloud painted WebGL in 0/3 runs on the
previous build (cloth only, as in the user's recording) and 3/3 runs (100% of
bridge frames) on PASS 1.

The lazy chunk uses named destructuring: `three.module` 719 KB → **511 KB raw**,
180 KB → **126 KB gzip**.

## Tiers

| Tier | Selection | Banks | DPR cap / budget | Octaves | Warp | Life | Ambient fps |
| --- | --- | --- | --- | --- | --- | --- | --- |
| desktop | ≥1200 px + fine pointer | 3 | 1.5 / 2.8 MP | 3 | yes | 1 | 30 |
| tablet | 768–1199 px or coarse pointer | 2 | 1.25 / 1.6 MP | 2 | yes | 0.85 | 30 |
| mobile | <768 px | 1 | 1 / 0.56 MP | 2 | no | 0.6 | ≈20–24 |
| fallback | reduced motion, or Save-Data phone, or WebGL failure | DOM cloth / dissolve | — | — | — | — | none |

Capability hints only (viewport, pointer, `prefers-reduced-motion`,
`navigator.connection.saveData`, `failIfMajorPerformanceCaveat` context
creation). No benchmarking.

## Lifecycle QA (production build)

- 20 enter / leave / reverse cycles: 1 canvas, 1 context, 1 geometry, 0
  textures; listener counts unchanged.
- 5 × Home → `/worlds` → Home (client navigation): on `/worlds` 0 canvases and
  0 pending RAFs; each Home mount creates one context and releases the previous
  one; window/document listener counts do not grow.
- Frame pacing (RAF median / p99): 16.7 / 16.8 ms while scrolling through,
  resting in the cloud and resting in the Atrium, desktop and mobile tier, with
  1×, 4× and 6× CPU throttling. GPU is still an RTX 3090 — phone GPU fragment
  cost and battery use are **not** measured.

## Not changed / still open

- The blank brown Atrium frames in the user's Mac recording (PASS 0 risk 1)
  could not be reproduced (0 of ≈6,100 frames under GPU, CPU-raster and software
  rendering, old and alternative `will-change` policies). The camera
  promotion policy was left as it was.
- The sky crop's softness (5.9× upscale of a 1672 px plate) is unchanged.
- Scene 3 framing, Loader, Header, Footer, routes and Scene 1 content are
  unchanged.

## Tests

`check:home` now covers: tiers and pixel budgets including mobile and
Save-Data; ambient integration (exact per-plane speeds, shared wind, clamped
steps, no jump after a 10-minute gap); "stop inside the cloud" (camera and
narrative uniforms fixed, `uTime` advancing, ambient draws throttled to
≈30 fps, resume from the exact position); no ambient work over the Atrium or
Footer; arming before formation; and master behaviour (one RAF while the air
lives, no narrative re-render on ambient frames, no loop once the air is done,
hidden tabs suspend). The renderer still contains no `requestAnimationFrame`,
timer, `Date.now` or `performance.now`.

Evidence (local, gitignored): `work/pass1/` — QA rounds, `final/`,
`final-recording/{desktop,mobile}/bridge-qa.webm`.
