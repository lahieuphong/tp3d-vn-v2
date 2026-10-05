# TP3D PASS 16 — Atrium orbit / room-by-room scroll choreography

PASS 16 refines only the end of the homepage, the Atrium, "Enter the worlds".
After the approved arrival has fully settled, more native scroll turns the
view toward each room around the central island: 01 Living, 02 Bedroom,
03 Bathroom, 04 Kitchen. The sequence then returns to the whole Atrium, where
the World copy and ENTER THE WORLD take over again.

Rules come from [TP3D-DESIGN-SYSTEM.md](TP3D-DESIGN-SYSTEM.md). This pass adds
§9 rules 27, "The Atrium orbits a pivot, not a carousel", and 28, "Appended
choreography must not retime approved scenes". The previous pass is
[TP3D-PASS-15-STUDIO.md](TP3D-PASS-15-STUDIO.md).

| Item | Value |
| --- | --- |
| Date | 2026-10-05 / 06 |
| Starting HEAD | `d1a6a78` — feat(world): add Room 05 Studio foundation |
| Added | `components/home/experience/worlds-orbit-frame.ts`, `scripts/check-worlds-orbit.mjs` (`yarn check:worlds-orbit`), this document |
| Changed | `home-story-timeline.ts` (base span and orbit span; orbit painted from the same render), `home-story.tsx` (base-height marker), `home-story.css` (base + orbit heights; caption sizes on phones and short landscape), `worlds-chapter.tsx` (one decorative caption region, the peripheral shade), `worlds-chapter.css` (caption, shade, scroll-owned label emphasis, keyboard override), `room-discovery.ts` (an `orbit` flag), `check-home-chapters.mjs` (module map), `check-lab.mjs` (one deliberate lock update), `package.json`, the design system |
| Not changed | Intro, Arrival, Perspective, Breeze, the atmosphere renderer and shaders, the bridge frames, `home-motion.ts`, `home-production.ts`, the header, the Footer, `WorldGatewayLink`, the portal, `/world` and its five rooms, Lab, Studio, Product routes. `check:worlds-orbit` locks these files to `d1a6a78`. |
| Not introduced | Three.js or other WebGL, a canvas, a GLB, geometry, new images, a second scroll listener, a second RAF loop, timers, scroll correction, React state on scroll, a dependency |

How measurements were taken:

- **Environment.** Headless Chrome 154 on this Windows 11 workstation (RTX
  3090; not representative of phones), against local production builds:
  PASS 16 on :8787 and the exact `d1a6a78` build on :8788.
- Motion was pinned to `prefers-reduced-motion: no-preference` (this machine
  reports `reduce`) except in the reduced-motion runs.
- Browser QA ran serially, one bounded browser per process. Native scrolls are
  `scrollTo({ behavior: 'instant' })` or real wheel input. A document-start
  instrument counted `requestAnimationFrame` calls, long tasks, and every
  change of `data-orbit-room` and `data-home-restoring`.
- Every number below was measured unless it is labelled as an inference.

## 1. Starting HEAD

`d1a6a78d68b656f86fb40e5a848bb8e03b429379`, PASS 15 approved. An interrupted
earlier session had left an uncommitted PASS 16 draft in the tree (the
timeline split, the orbit frame, the caption, the shade, the discovery flag).
This pass reviewed that draft against the brief and kept it with two changes:
camera `will-change` follows the existing mass rule again, and a keyboard
focus override was added. It then wrote the check, the QA and this record.

## 2. User intent

Standing in the Atrium and slowly turning around the central island, looking
toward each room in turn. It should not slide, crossfade or zoom into
doorways. The island is the perceptual anchor; the sequence ends by
returning to the whole architecture.

## 3. Why this is 2.5D, not true 3D

The Atrium is one rendered photographic plate (`worlds-atrium`, 1672×941). It
has no depth, so it cannot produce real viewpoint parallax. PASS 16 builds a
restrained camera illusion on that one plate: a pan and scale about the
island, with exposure and typography emphasis. It is never called 3D
navigation.

## 4. Existing Atrium architecture

`.hc-worlds` (sticky inside `.home-story-stage`) holds `[data-scene3-camera]` →
`.hc-atrium-backdrop` → the plate (`object-fit: cover`, `object-position: 50% 0`,
`51% 0` below 768px). The arrival (PASS 04) pulls the camera back from the
oculus about `transform-origin` (the sky point) and settles to the identity at
`bridgeTiming.settled` (0.915). The four room links (`data-room`) are real
links; `RoomDiscovery` (PASS 05) previews rooms on hover/focus after
`discoveryStart`. The master is `createHomeStoryTimeline()`.

## 5. Original timeline preservation

Base progress `p` is still `clamp((scroll − top) / baseSpan)`, and
`baseSpan` is the PASS 15 span. Everything the approved journey drives
samples `p` (or the bridge progress derived from it): `homeStoryFrame`,
`bridgeFrame`, `atriumPose`, Breeze, the atmosphere, the TP, the header and
the rail. Only the orbit samples orbit progress.

**Proof.** `check:worlds-orbit` runs the PASS 15 timeline (`d1a6a78`) and the
PASS 16 timeline in the same DOM double, over 265 scroll positions × 4
viewports × motion/reduced. It hashes every write except the orbit's own
outputs. Both give digest `11b1a49bdceb01ae`: the PASS 16 timeline makes the
same writes as PASS 15 at every base-journey position.

## 6. Base span vs orbit span

```css
.home-story {
  --story-base-height: 360svh;   /* 320svh < 1200px, 280svh < 768px */
  --story-orbit-height: 0svh;    /* only under prefers-reduced-motion: no-preference */
  --story-height: calc(var(--story-base-height) + var(--story-orbit-height));
}
```

`[data-home-story-base]` sits outside the sticky stage with
`height: var(--story-base-height)`. The timeline measures it:
`baseSpan = marker − stage`, `orbitSpan = story − marker`.

| Tier | Base height | Orbit height | Measured at | Base span | Orbit span |
| --- | --- | --- | --- | --- | --- |
| Desktop ≥1200 | 360svh | 280svh | 1440×900 | 2340 px | 2520 px |
| Tablet 768–1199 | 320svh | 220svh | 1180×820 | 1804 px | 1804 px |
| Phone <768 | 280svh | 170svh | 390×844 | 1519 px | 1435 px |
| Short landscape (≤1199w, ≤540h, landscape) | by width | 220svh | 844×390 | 858 px | 858 px |
| Reduced motion | unchanged | 0 | 1440×900 | 2340 px | 0 |

Measured base spans equal the PASS 15 story spans at 1366×768 (1997 px),
1280×720 (1872), 1728×1117 (2904), 1920×1080 (2808), 820×1180 (2596),
360×740 (1332), 740×360 (648) and 667×375 (675).

## 7. Source-image dimensions

`worlds-atrium` master is 1672×941, the same values as
`MOTION.camera.source`. Coordinates were measured on that plate from zoomed,
gridded crops.

## 8. Measured pivot coordinate

**(836, 665).** This is the centre of the pool's outer bronze ring: its
leftmost point is at (346, 663) and its rightmost at (1327, 668). It is the
island's axis on the floor, directly below the oculus centre (836, 110) that
the arrival uses. At 1440×900 it projects to (720.0, 636.0).

## 9. Room target coordinates

These are doorway centres on the source plate: midway between the two jambs
and between lintel and threshold.

| Room | Source | 1440×900 viewport |
| --- | --- | --- |
| Living | (223, 451) | (133.7, 431.4) |
| Bedroom | (557, 461) | (453.2, 440.9) |
| Bathroom | (1120, 460) | (991.6, 440.0) |
| Kitchen | (1488, 462) | (1343.6, 441.9) |

## 10. object-fit: cover geometry

`measureOrbit(width, height)` uses the same mapping as the CSS and the
arrival's `measureAtrium`: `cover = max(w/1672, h/941)`,
`left = (w − 1672·cover) × 0.5` (0.51 below 768px), top-aligned. A source
point maps to `(left + x·cover, y·cover)`. No viewport-only coordinates
exist. The check re-implements the mapping independently and compares it
at 19 viewports.

## 11. Orbit frame architecture

`worldOrbitFrame(progress, geometry, tier)` in `worlds-orbit-frame.ts` is
pure. It has no DOM, no clock, no module state and no direction. It returns
`phase`, `beat`, `activeRoom`, `cameraX/Y/Scale/Roll` (about the pivot),
`pivotX/Y`, `moving`, `roomFocus`, `labelOpacity`, `labelEmphasis`,
`overviewOpacity`, `copy`, `focusCaptionOpacity`, `gatewayOpacity` and
`shadeLeft/Right`.

- `roomPose()` gives each room's rest pose.
- `orbitPose()` re-expresses the pivot transform about the arrival's
  `transform-origin`, so the one camera keeps one origin and one bounded mass.
- The timeline writes only `transform`, `opacity`, custom properties and two
  attributes on `.hc-worlds`: `data-world-orbit` (phase) and
  `data-orbit-room` (room). CSS is state-driven from those.

## 12. Orbit phases

| Orbit progress | Phase | What happens |
| --- | --- | --- |
| 0–0.02 | overview | the exact settled Atrium (the approved hold continues) |
| 0.02–0.08 | release | World copy steps back; discovery yields |
| 0.04–0.15 | room | Living approach (camera leaves at 0.04) |
| 0.15–0.22 | room | **Living hold** |
| 0.22–0.31 | room | toward Bedroom |
| 0.31–0.38 | room | **Bedroom hold** |
| 0.38–0.47 | room | toward Bathroom |
| 0.47–0.54 | room | **Bathroom hold** |
| 0.54–0.63 | room | toward Kitchen |
| 0.63–0.70 | room | **Kitchen hold** |
| 0.70–0.82 | return | camera back to the overview |
| 0.80–0.88 | return | World copy and gateway regain authority |
| 0.88–1.00 | gateway | final overview hold, then the Footer |

Each leg uses `glide = editorial ∘ editorial`, which has zero velocity and
acceleration at both ends. There is no spring, overshoot or inertia. Each
room has four beats:

- **approach**: the camera moves.
- **settle**: the last quarter of the leg, under 40% of the leg's peak
  speed; the caption fades in here.
- **hold**: the camera is exactly at rest.
- **depart**: the first quarter of the next leg; the caption fades out.

At 1440×900 a hold is 176 px of scroll and a full room beat is about 400 px
(about four wheel notches).

## 13–16. The four rooms (1440×900, settled, measured in the browser)

| Stop | Room | Pivot drift x / y (px) | Scale | Roll | Projected pivot | Active doorway | Caption |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | overview | 0 / 0 | 1.0000 | 0 | 720.0, 636.0 | — | 0 |
| 0.11 | Living (approach) | 20.33 / 9.95 | 1.0313 | 0 | 740.3, 646.0 | 135.7, 434.9 | 0 |
| 0.185 | **Living** | 25.99 / 12.72 | 1.0400 | 0 | 746.0, 648.8 | 136.3, 435.9 | 1 |
| 0.27 | Bedroom (approach) | 17.22 / 12.35 | 1.0400 | 0 | 737.2, 648.4 | 459.7, 445.5 | 0 |
| 0.345 | **Bedroom** | 11.83 / 12.13 | 1.0400 | 0 | 731.8, 648.1 | 454.3, 445.2 | 1 |
| 0.43 | Bathroom (approach) | −3.14 / 12.16 | 1.0400 | 0 | 716.9, 648.2 | 999.4, 444.3 | 0 |
| 0.505 | **Bathroom** | −12.04 / 12.19 | 1.0400 | 0 | 708.0, 648.2 | 990.5, 444.3 | 1 |
| 0.59 | Kitchen (approach) | −21.80 / 12.11 | 1.0400 | 0 | 698.2, 648.1 | 1346.7, 446.2 | 0 |
| 0.665 | **Kitchen** | −27.65 / 12.07 | 1.0400 | 0 | 692.4, 648.1 | 1340.9, 446.2 | 1 |
| 0.76 | return | −13.87 / 6.05 | 1.0201 | 0 | 706.1, 642.1 | 1342.2, 444.0 | 0 |
| 0.94 | gateway | 0 / 0 | 1.0000 | 0 | 720.0, 636.0 | — | 0 |

What each stop reads as: at each hold, the active doorway sits almost at the
transform's fixed point (it moves 2–8 px), while the opposite side of the
Atrium widens outward (up to about 55 px) and takes the peripheral shade. The
island leans toward the room by at most 2 vw. Visually this is a lean of the
whole view toward one doorway with the island still central. It is not a
slide, and the other three doorways stay in frame as context. The effect is
deliberately restrained. DS §8 caps a full-bleed plane at a 4% scale change,
and on one cover-fitted plate the pan can never exceed that scale's own edge
margin.

- **Living**: the left doorway is held while the right half widens under a
  0.8 shade.
- **Bedroom**: a smaller lean left.
- **Bathroom**: a smaller lean right; the bright window stays within the
  readable range under the caption.
- **Kitchen**: the mirror of Living.

Image quality at 1.04 was inspected at full resolution on 1440×900 crops (the
caption region and the Kitchen/Bathroom doorways). Detail holds; the plate is
already upsampled at rest above about 1600 px wide, and 1.04 adds 4% on top.

## 17. Final overview

From 0.82 the camera is exactly the identity. From 0.88 the title, body,
signoff, eyebrow and gateway are at 1, the labels are back to 1 and
discovery is available again. The gateway hold (0.88–1, 302 px at 1440×900)
is the last thing before the sticky stage releases into the Footer.

## 18. Camera scale range

- **Desktop**: 1.000 → 1.040.
- **Tablet**: 1.028.
- **Short landscape**: 1.024.
- **Phone**: 1.020.
- **Reduced**: 1.000.

The scale never drops below 1, and `ORBIT.scale` ≤ 0.04 is a check.

## 19. Translation range

Desktop camera x (= pivot drift x) is +25.99 px (Living) to −27.65 px
(Kitchen) at 1440×900. y is +12.07 to +12.72 px at the holds; the view
lifts toward the doorway band by half of the scale's margin above the pivot.
The pan uses at most 96% (`fill`) of the scale's edge margin on the side it
leans away from, so no plate edge is ever exposed. The tightest measured
margin is the Kitchen right edge, at 1441.15 px of 1440.

## 20. Pivot drift

Measured in the browser (max |drift| over the stops):

| Viewport | x | y |
| --- | --- | --- |
| 1440×900, 1366×768, 1280×720, 1728×1117, 1920×1080 | 1.92 vw | 1.41–1.42 vh |
| 1180×820, 820×1180 | 1.34 vw | 0.99 vh |
| 390×844, 360×740 | 1.01–1.02 vw | 0.71 vh |
| 844×390, 740×360, 667×375 | 1.15 vw | 0.85–1.03 vh |

The documented budget is ≤2.5 vw and ≤2 vh on desktop; `check:worlds-orbit`
asserts it at 9 desktop viewports. Vertical difference between room holds is
≤0.5 vh (measured 0.65 px at 1440×900), so there is no bounce.

## 21. Roll decision

**0° everywhere.** The previous session injected ±0.3° on the settled Living
pose at 1440×900. At −0.3° the top-right corner sample turned ivory
(232, 220, 200), meaning the plate's edge was exposed. A rotation needs extra
scale just to cover the corners, and on one plate it read as a tilted
photograph rather than a turn. The check bounds roll at ±0.35° and requires
0 on phones.

## 22. Copy choreography

While the orbit owns focus (authority 0→1 over 0.02–0.08, back over
0.80–0.88), opacity multiplies the approved reveal:

- eyebrow → 0.6
- title → 0, its slot taken by the caption
- body and signoff → 0.22
- gateway → 0.5

The heading's grid stacks the title and caption in one slot, so there is no
layout shift.

## 23. Room labels

They stay real links with their current `href`s. During the orbit:

- **Active label**: opacity 1, +3px emphasis, rule at full length and full
  opacity (`--room-orbit-focus`).
- **Others**: 0.32.

No bounce or glow. Transitions are off while discovery is suspended
(existing PASS 05 rule), so the values are purely scroll-timed. Desktop
labels stay attached to the architecture through the same pose. The tablet,
phone and short-landscape grouped 2×2 labels are not transformed; only their
emphasis follows the room.

## 24. Focus caption

One `aria-hidden` region holds four structural captions ("01 Living Room",
"02 Bedroom", "03 Bathroom", "04 Kitchen"). CSS shows only the one matching
`[data-orbit-room]`, and the timeline writes one opacity. There is no
per-character animation, no paragraph and no React state. Sizes are 60–112px
on desktop, 64px on tablet, 48–60px on phones (42–54px on narrow phones), and
36–56px (svh-based) on short landscape. Measured inside the viewport and
below the header at every QA viewport.

## 25. World gateway

ENTER THE WORLD stays in place: dimmed to 0.5 during rooms, 1 at the final
overview, and 1 whenever it has keyboard focus. Scroll never activates it:
the check forbids `.click()`, `location`, `router` and `enterWorld` in the
timeline, orbit and discovery. In the browser, wheeling through the whole
orbit and into the Footer left `location.pathname` at `/`.

## 26. Room discovery ownership

`RoomDiscovery.update({ …, orbit })`:

- While `activeRoom !== null` (0.02–0.88), discovery is disabled:
  `data-world-interactive` is removed and hover/focus previews are cleared and
  ignored.
- At the overview and the gateway hold it works as in PASS 05.
- Links are never made inert, removed from the tab order or hidden.

Measured at 1440×900:

- **Living hold**: hovering Kitchen left `data-active-room` unset, the room
  Living, Kitchen at 0.32, no preview.
- **Gateway hold**: the same hover gave `data-active-room=kitchen` and the
  Kitchen preview.

## 27. Forward/reverse determinism

The frame is a pure function of native scroll.

- **DOM double** (7 viewports × 101 stops): forward traces equal reverse
  traces.
- **Browser**: a wheel forward (26 notches) logged rooms
  `null → living → bedroom → bathroom → kitchen → null`, and the reverse
  logged `kitchen → bathroom → bedroom → living → null`.

## 28. Fast-scroll behaviour

A jump samples the destination; nothing is queued. In the browser, Living →
Kitchen in one jump logged one change (`kitchen`). In the double,
Living → Kitchen and gateway → Living equal the forward samples.

## 29. Restoration

- **Back/forward with bfcache**: `pageshow.persisted`; the page returned at
  Kitchen with no room change at all.
- **Back/forward without bfcache** (`--disable-features=BackForwardCache`):
  the page started under `data-home-restoring`, and the first room painted
  was `kitchen`. The page was revealed on Kitchen with no Living or overview
  frame in between.
- **Reload** returns to the top with the Intro. This is the existing Intro
  "restored-scroll reset", and PASS 15 (:8788) behaves the same.

## 30. Resize

Width-only resize at the Bedroom hold (1440→1280 wide, same svh) kept
`scrollY` 3209 and the room Bedroom. A height change (→1366×768) keeps native
`scrollY` (no correction, by rule), so orbit progress becomes 0.564
(Bathroom). The check proves a resized frame equals a fresh load at that
scroll position. Cover geometry is remeasured on every resize.

## 31–34. Tiers

- **Desktop ≥1200**: full amplitude; the labels stay attached to the doorways.
- **Tablet 768–1199**: amplitude 0.7 (scale 1.028, drift 1.34 vw); grouped
  labels reflect the room.
- **Phones <768**: amplitude 0.5 (scale 1.02, drift ~1 vw); no roll; the
  caption carries the room; the 2×2 list stays readable.
- **Short landscape** (844×390, 740×360, 667×375): light amplitude 0.6
  (scale 1.024, drift 1.15 vw); orbit 220svh. Header clear, CTA in view,
  caption not clipped.

Screens were checked at 1440×900, 1366×768, 1280×720, 1728×1117, 1920×1080,
1180×820, 820×1180, 390×844, 360×740, 844×390, 740×360 and 667×375. All
passed the layout probe: caption below the header and inside the viewport,
CTA inside the viewport, plate edges covered, header ivory, `will-change:
auto` at rest.

## 35. Reduced motion

The orbit height is 0, so the story is exactly the base height: 3240 px at
1440×900 and 2363 px at 390×844, measured. The tier is `reduced`, so the
frame is the overview. No camera, no caption, no orbit attributes. Links and
CTA are at opacity 1. Turning reduced motion on mid-orbit (in the double)
removes the spacer and the state.

## 36. Accessibility

- The room links remain the semantic source; the caption is `aria-hidden`.
- No text is swapped in place.
- Keyboard focus: tabbing to the dimmed Bedroom link during the Living hold
  gave `:focus-visible` with its 1px outline and span opacity 1, with zero
  scroll. The CTA gave opacity 1 (its inline value stays 0.5, outranked by a
  `!important` focus rule).
- The header stays ivory (`dark` theme) through the orbit and never flips
  between rooms.

## 37. First paint

The orbit adds no request, no image and no first-frame dependency.

| Condition | Metric | PASS 15 median (range) | PASS 16 median (range) |
| --- | --- | --- | --- |
| Unthrottled, 6 runs each | FCP | 194 ms (160–236) | 188 ms (172–424, one cold outlier) |
| Unthrottled, 6 runs each | LCP | 434 ms (424–452) | 438 ms (412–724) |
| CPU 4×, 150 ms, 1.6 Mbps, 3 runs each | FCP = LCP | 1388 ms (1368–1404) | 1420 ms (1412–1436) |

Unthrottled there is no difference within noise. Throttled, PASS 16 was
16–48 ms later in each pair. The inference is that this is the extra ~2.2 KB
gzip of render-path JS/CSS plus the caption markup at 1.6 Mbps.

## 38. Network

1440×900, cache disabled, 3 runs each, identical every run. Both builds load
the same 58 resources, only with different hashes. Initial load is 41
requests in both (+2,536 B). Scroll to the Atrium plus the full orbit plus
the Footer is 17 requests in both. In PASS 16 the Footer's link prefetches
and Footer images arrive later, because the Footer appears after the orbit.
Total transfer is +2,534 B. Three.js is the same single
`three.module` (130,025 B) on the way to the Atrium in both. The orbit
itself requests nothing.

## 39. JS/CSS delta

These are the homepage's loaded files, read from `dist`:

- **JS**: +4,271 B raw, +1,757 B gzip (1,158,773 → 1,163,044; 329,894 →
  331,651).
- **CSS**: +3,002 B raw, +468 B gzip (244,432 → 247,434; 41,900 → 42,368).

## 40. RAF/runtime

Wheeling through the whole orbit (26 notches, 2.18 s) used 94 RAF callbacks
on the existing master. The 2 s after stopping had **0** RAF, and there were
no long tasks. There is one scroll listener, one master RAF, one
ResizeObserver and no timers. The camera mass reuses `settleVisual` (desktop
≤2.4 px, tablet ≤1.6 px, none on phones), and destinations stay exact.
`will-change: transform` is set only while that mass is settling. A hidden
tab cancels the pending frame and returns `will-change` to `auto`. The check
proves this in the double; headless Chrome kept `document.hidden` false
behind a foreground tab, so the browser could not confirm it.

## 41–47. Regressions

The Intro, Arrival, Perspective, Breeze, Atmosphere, the Atrium arrival,
the header, the portal, `/world`, the five rooms, the Lab and the Studio are
covered three ways:

1. Their files are byte-identical to `d1a6a78` (`check:worlds-orbit`
   protected digest `d8922fdb98a3c952`).
2. The base-journey write digest is identical (§5).
3. Every existing check passes.

The settled Atrium frame at 1440×900 (base p = 0.95) is pixel-identical to
`d1a6a78`: 0 changed pixels. That was measured by the previous session on
the same draft, and the frame code has not changed since. `check:lab`'s lock
on `home-story-timeline.ts` was updated deliberately, with a note that this
check now proves the bridge writes are unchanged.

## 48. Automated checks

`yarn check:worlds-orbit` (about 3 s) checks:

- **Story geometry**: CSS base and orbit heights by tier; nothing under
  reduced motion; the marker outside the stage.
- **Base journey**: the PASS 15 digest, the physical span, the orbit starting
  after p = 1 and after the camera leaves at 0.04, the approved settled hold.
- **The pure frame**: purity, room order, endpoints, determinism, reverse
  sampling, exact holds, zero speed at stops, the caption only over a slow
  camera, the final overview, reduced.
- **Camera**: scale bounds, plate coverage at 19 viewports, source pivot and
  targets through an independent cover mapping, lean signs, pivot drift, no
  vertical bounce, roll, tier amplitudes, no cutout.
- **Copy**: the title, the gateway, the caption markup and CSS pairs, the
  keyboard override, no scroll-triggered navigation.
- **The real timeline** across 7 viewports: room, caption, labels, copy,
  gateway, header, discovery ownership, reverse = forward, jumps, Footer
  release.
- **Lifecycle**: restoration ordering, resize, hidden tab, reduced-motion
  switch.
- **Runtime ownership**: listeners, RAF, timers, imports, cleanup.
- **The real `RoomDiscovery`**: overview, orbit, return, touch, focusability.
- **The protected-file digest.**

All other checks pass: lint, `tsc`, `check:motion`, `intro`, `hero`, `home`,
`content`, `assets`, `worlds`, `world`, `gallery`, `exhibit`, `world-shell`,
`world-ux`, `objects-room`, `object-study`, `product-navigation`, `archive`,
`lab`, `studio`, and `routes` against the preview.

## 49. Mutation tests

29 of 29 were caught. Each was applied to the source, then the check was run
and the file was restored byte-for-byte.

1. orbit starting before the old journey ends
2. base span = whole story
3. base CSS height 400svh
4. Living/Bedroom swapped
5. Kitchen missing
6. final overview removed
7. scale 0.08
8. pivot at viewport centre
9. targets as viewport percentages
10. direction state in the timeline
11. direction state in the frame
12. second scroll listener
13. second RAF
14. discovery ignoring the orbit
15. timeline never yielding discovery
16. Enter World auto-click
17. reduced root spacer
18. unconditional desktop spacer
19. mobile desktop amplitude
20. linear camera with no stops
21. caption over peak motion
22. 2° roll
23. camera promoted at rest
24. keyboard focus dimmed
25. header flip during orbit
26. copy never returning
27. marker inside the stage
28. portal file touched
29. caption shown for the wrong room

## 50. Browser journeys

The 1440×900 stops (§13–16), the twelve-viewport sweep (§31–34), wheel
forward and reverse, fast jump, hover vs scroll, keyboard, resize,
restoration (bfcache and full), reduced motion, network, first paint, RAF and
long tasks. All ran on the local production builds described above.

## 51. Known limitations

- **Single plate, no parallax.** A single perspective plate cannot produce
  physically correct viewpoint parallax around the central island. PASS 16
  is a restrained orbital-camera illusion. The island drifts up to 1.92 vw
  because a pan on one plate moves everything together; a stationary cut-out
  island was not used, as it would risk visible seams.
- **Amplitude.** Amplitude is bounded by DS §8 (≤4% scale) and by the
  cover-cropped plate. A stronger turn would need more source image or a
  real environment.
- **Height resize.** A height resize resamples the same native `scrollY`,
  not the same orbit progress. Scroll correction is forbidden.
- **Failed plate.** If the plate fails to decode, the orbit span remains as
  a static overview hold of the readable Atrium fallback, by the existing
  failure rule.
- **Hidden tab.** It was verified in the DOM double only (headless kept the
  tab visible).

## 52. Real-GLB future boundary

When a real Atrium environment exists, these may become the real camera's
blueprint:

- the semantic room order
- the pivot concept (the island's axis)
- the holds and their beats
- the caption and label contract
- the orbit pacing (appended span, 0.07 holds, ending on the overview)

The photographic transform system (`roomPose`, `orbitPose`, the shade)
should then be **replaced**, not stacked under the real camera. No Atrium
GLB, geometry or Three.js camera was started in this pass.
