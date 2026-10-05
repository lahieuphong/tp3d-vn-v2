# TP3D PASS 14 — Room 04 / Lab foundation

PASS 14 opens the fourth real room of the World, `/world/lab`. It is a
spatial workbench of four studies, each taken from a system TP3D already runs
in production.

- **The question.** The Gallery asks where you can enter, Objects what you
  can inspect, the Archive where things come from. The Lab asks what happens
  when space responds.
- **Opt-in cost.** Real WebGL exists inside the World, but no visitor pays
  for it until they ask: before LOAD LIVE STUDY the room requests no Three.js
  and creates no canvas or context.

Rules come from [TP3D-DESIGN-SYSTEM.md](TP3D-DESIGN-SYSTEM.md). This pass adds
§9 rules 23, "The Lab exposes systems, not diagnostics", and 24,
"Experimental cost is opt-in", and a §14 note on Room 04. The previous pass is
[TP3D-PASS-13-ARCHIVE.md](TP3D-PASS-13-ARCHIVE.md).

| Item | Value |
| --- | --- |
| Date | 2026-10-05 |
| Starting HEAD | `18836be` — feat(world): add Room 03 Archive foundation |
| Added | `app/world/lab/page.tsx`, `components/world/world-lab.tsx`, `components/world/world-lab.css`, `components/world/lab-atmosphere-study.tsx` (the one new island), `components/world/lab-atmosphere-adapter.ts` (lazy), `data/world-lab.ts`, `yarn check:lab` |
| Changed | `data/world-building.ts` (Lab available at `/world/lab`; a truthful description; comments); `world-chrome.css` (shares tokens, links and focus with the room); contract updates in `check-world-gateway`, `check-gallery`, `check-world-shell`, `check-objects-room`, `check-object-study`, `check-product-navigation`, `check-archive`, `check-site`; `package.json` |
| Not changed | every production module the Lab consumes or describes (the atmosphere renderer, frame, shaders and DOM bridge, `home-motion`, Breeze, `hero-depth`, `lib/motion/*`, `GalleryDepth`, the PORTAL and gateway link), the homepage, the Gallery, Room 02, the Archive, both detail shells, the Lobby's composition, `WorldChrome`, every Product file, materials, journal, `/worlds` |
| Not introduced | a renderer, shader, WebGL setup, geometry, pointer engine or portal of the Lab's own; a `three` import; a GLB, Sketchfab or iframe; a remote asset; a dependency; `/world/lab/[slug]`; `/world/studio` |

How measurements were taken:

- **Environment.** Headless Chrome 154 (WebGL 2.0 available) on this Windows
  11 workstation, against local production builds: PASS 14 on :8787 and the
  exact `18836be` tree (a `git archive` export built in the scratchpad) on
  :8788.
- **Browser QA** ran serially: one journey and one viewport per process,
  every step logged and bounded, a watchdog per process. A document-start
  instrument records every WebGL context (release is checked with
  `isContextLost()`) and counts every `requestAnimationFrame` call.
- **First paint.** CPU throttled 4×, 150 ms latency, 1.6 Mbps down, cache
  disabled, each load starting from a page already painted `#1c1712`.
- Reduced motion was pinned explicitly (this machine reports `reduce`).
- Served-HTML comparisons use the PASS 13 build made in the repository: vinext
  derives client-reference ids from the build path, so the scratchpad build
  differs by those ids alone.
- This is not field data.

---

## 1. Starting state

At `18836be` the World had three real rooms (Gallery, Objects, Archive). The
Lab was a planned wing: "Opening later", no route, and `/world/lab` was a
reserved 404 in `check-site`. Its data entry promised "Studies in interactive
space, light and real-time 3D on the web."

## 2. Why Lab opens now

TP3D already runs four spatial systems in production: the atmospheric
crossing, the cloth, pointer depth and the portal into the World. They were
only experienced in passing. The Lab shows them as studies, and it is where
the building first proves that real WebGL can live inside the World without
making every visitor pay for it.

## 3. Gallery vs Objects vs Archive vs Lab

| | Gallery (01) | Objects (02) | Archive (03) | Lab (04) |
| --- | --- | --- | --- | --- |
| Question | Where can I enter? | What can I inspect? | Where did it come from? | What happens when space responds? |
| Metaphor | walls, exhibitions | cabinet, plinths | reading room, register | workbench, test fields |
| Content | `World` spaces | `Product` objects | records of materials and articles | production systems |
| Live | pointer depth, reveal | one depth | none | one opt-in WebGL study, one depth field |

## 4. Production experiment audit

| System | Modules | Coupling | Lab use |
| --- | --- | --- | --- |
| Atmosphere | `atmospheric-sky-renderer.ts` (`createAtmosphericSkyBridge`), `-frame.ts`, `-shaders.ts`, `atmospheric-bridge-frame.ts` | Takes a host and a `requestPaint` callback; every frame comes from `update(input)`; owns no RAF, timer or listener | Live, through a thin adapter |
| Breeze | `continuous-breeze.tsx`, `breeze-renderer.ts`, `breeze-geometry.ts`, `breeze-bridge-pose.ts` | Needs the exact homepage markup, `homeStoryFrame` progress and styles in `home-experience.css` / `home-story.css` | Reference, with a still from its real geometry |
| Depth | `lib/motion/pointer.ts` (`createPointerFollower`), `GalleryDepth`, `hero-depth.ts` | `GalleryDepth` takes a target and a custom-property name; `createHeroDepth` reads homepage selectors | Live, by reusing `GalleryDepth` |
| Threshold | `world-portal.ts`, `world-gateway-link.tsx` | Covers the page and routes to `/world` | Reference; never invoked |

## 5. Lab curation

`data/world-lab.ts` curates exactly four studies, in order: Atmosphere,
Breeze, Depth, Threshold. A fifth needs a fifth production system first.

## 6. Experiment registry

`LabExperiment`: `id` (also the fragment), `number` (EX–01…, from order),
`title`, `question`, `medium`, `productionContext`, `mode` (`live` or
`reference`) and `sourceModules`.

| | Question | Medium | In production | Mode |
| --- | --- | --- | --- | --- |
| EX–01 Atmosphere | How can air become a spatial transition? | WebGL / Shader / Controlled progress | Homepage / Atmosphere → World | live |
| EX–02 Breeze | How can one surface carry depth without becoming an effect? | SVG / Geometry / Scroll-driven pose | Homepage / Spatial bridge | reference |
| EX–03 Depth | How little movement is enough to make a surface feel dimensional? | Pointer / Transform / On-demand frame | Homepage / Gallery / Objects | live |
| EX–04 Threshold | How should crossing into another spatial mode feel intentional? | WAAPI / Semantic navigation / Route transition | Home → World | reference |

## 7. Engineering provenance

`sourceModules` names each study's production files. `check-lab` verifies
every path exists and that each study points at the right system. The paths
never reach the room: the visitor reads the number, title, question, medium,
production context and state.

## 8. No-fork architecture

- **Atmosphere.** The island imports nothing heavy. On LOAD it dynamically
  imports `lab-atmosphere-adapter.ts`, which re-exports the production
  `createAtmosphericSkyBridge` and adds three pure functions (progress, ground,
  band). The renderer then imports Three.js itself, as on the homepage.
- **Depth** reuses `GalleryDepth` (already shared by the Gallery and Room
  02): no new client code. The brief's suggested `lab-depth-study.tsx` was
  not needed.
- **Breeze and Threshold** read production modules on the server only
  (`storyBreezeGeometry`, `PORTAL`).
- `check-lab` fails on any Lab copy of WebGL setup, shader source, renderer
  internals, a `three` import, a portal call or a live Breeze, and locks every
  consumed module by digest.

## 9. Visual concept

A workbench, not a dashboard:

- large empty working surfaces on the World ground;
- fine 1px rules and calibration frames;
- the atmosphere's own palette as flat planes;
- Cormorant Spatial for names and questions, Manrope Spatial for facts.

There are no cards, code boxes, glass, glow or charts. The Atmosphere bench
leads and is the largest; Breeze is a wide field; Depth a calibration field;
Threshold a compact protocol; then the index and the note.

## 10. EX–01 Atmosphere

A large bench: the label and controls in one column, the field (64svh, at most
640px) in the other. The field's static study is three flat planes (Air,
Cloud, Open sky) in the colours the production renderer draws; `check-lab`
compares each CSS colour with the renderer source.

## 11. Explicit activation

One native button, LOAD LIVE STUDY, is the only path to WebGL. It appears
once the client capability is known (never on the server, never before
hydration), so a visitor without JavaScript sees a complete static study and
no dead control. Mount, scroll, viewport entry, hover, focus and timers
never load anything (`check-lab` 34–39; browser: §37).

## 12. Static fallback

The static study is the complete state that reduced motion, Save-Data and
failure keep. Status is always text:

| State | Status | Control |
| --- | --- | --- |
| before activation | Static study | LOAD LIVE STUDY |
| loading | Preparing live study | STOP LIVE STUDY (cancels) |
| live | Live study | STOP LIVE STUDY + the range |
| reduced motion | Static study / Reduced motion | none |
| Save-Data fallback tier | Static study / Save-Data | none |
| WebGL or shader failure | Static fallback | none |

When the control disappears while it has focus, focus moves to the status.

## 13. Existing renderer reuse

`createAtmosphericSkyBridge(host, requestPaint)` with every input taken from
the browser:

| Input | Value |
| --- | --- |
| `progress` | the range through `labAtmosphereProgress` |
| `width`, `height` | the host's client size |
| `reduced`, `fine`, `saveData` | `readMotionCapability()` |
| `visible` | `document.visibilityState` |
| `sceneReady` | `true` (the study's ground is CSS, ready from the first paint) |
| `now` | a constant (§16) |

The renderer keeps its own tiers, DPR caps, pixel budgets, Save-Data rule,
`failIfMajorPerformanceCaveat`, context-loss handling and disposal. Its tier
follows the canvas width it is given: the bench is 818px wide at 1440×900
(tablet tier: two cloud banks, DPR ≤1.25) and narrower than 768px from
1280×720 down (mobile tier: one bank, DPR 1).

## 14. Progress mapping

- The range (0–100) maps into the production domain:
  `SKY_BRIDGE.start + (end − start) × local`, where `local` runs from just
  inside `SKY_BRIDGE.activeStart` to just inside `activeEnd`.
- Both ends draw. The low end sits before cloud formation and below
  `armBefore`, so a renderer that finishes warming there arms, as the
  production rule requires.
- Under the canvas, the field's ground changes at the homepage's own DOM swap
  (`bridgeTiming.swap`, master 0.64): the air before, the open sky after. At
  that position the atmosphere covers every pixel (`skyCover` 1, `opening` 0),
  so the change is never seen. At the open-sky end the atmosphere's opening
  reveals that ground, as it reveals the Atrium's sky on the homepage.
- The band shown beside the range (Air, Cloud, Open sky) is read from the
  production frame (opening, density, sky cover); the range's `aria-valuetext`
  is the band, never a percentage.

## 15. RAF strategy

- **No loop.** The island owns at most one pending animation frame.
- **Who asks.** A range change, a resize, the tab returning and the renderer's
  own `requestPaint` (after its async warm-up) all ask for one. Requests
  coalesce; the frame calls `update()` once and asks for nothing.
- `tick()` and `wantsTime()` are never called.

## 16. Why ambient tick is disabled

The study is a controlled experiment: the range owns the narrative, and
nothing should move on its own. Every update carries one constant timestamp,
so the renderer integrates no ambient air between frames. The same position
always draws the same frame. Measured at 1440×900, 820×1180 and 390×844:
position 50 reached ascending, descending and after a 60-step fast scrub
produced pixel-identical field captures (0 differing pixels; 818×576 at
1440×900).

This is a deliberate reading of the brief's "accurate `now`": a real clock
would add air drift and make the frame depend on how long the visitor
dragged.

## 17. Cleanup

STOP, leaving the page and a reduced-motion request all call `stop()`:

- advance the ticket;
- cancel the pending frame;
- remove the resize and visibility listeners;
- `destroy()` the production instance (renderer `dispose`, `forceContextLoss`,
  canvas removed, host attributes restored);
- clear the field's ground.

## 18. Race handling

- **Every activation has a ticket.** Stopping or unmounting advances it, and
  a late adapter import finds it stale and creates nothing. The renderer's
  own generation guard covers a late Three.js import or shader compile.
- **One instance.** `activate()` refuses while an instance exists or a load
  is under way, and the single toggle turns a second click into a cancel.
- **Measured** (1440×900 and 390×844):

| Race | Result |
| --- | --- |
| LOAD → STOP immediately | 0 canvases, 0 live contexts (the one created was released) |
| two clicks in one task | 0 contexts ever created |
| LOAD → leave immediately | 0 canvases, 0 live contexts on the Lobby |
| live → leave | 1 live context → 0 |
| live → reduced-motion request | 0 canvases, 0 live contexts, reduced status; the toggle returns when the preference clears |

No console errors in any race.

## 19. Reduced motion

No toggle and no WebGL: "Static study / Reduced motion". The whole room is
composed at once (0 running animations, no element below full opacity);
Depth is static; Breeze and Threshold are static references.

## 20. Save-Data/capability

The production tiers decide. Save-Data falls back only for a canvas under
768px: at 390×844 the study showed "Static study / Save-Data" with 0 canvases
and 0 contexts. At 1440×900 the renderer chose its tablet tier and went live.

QA found that the renderer's fallback tier also reports the fallback state,
which first showed Save-Data as "Static fallback". The island now reads the
tier first, and `check-lab` and a mutation hold it.

## 21. EX–02 Breeze

- A wide dark field shows the production cloth at rest: the whole 1440 × 900
  view the homepage composes, framed and centred, with the outline and the
  ten heavier threads. It is drawn on the server by `storyBreezeGeometry`, a
  still, with no client code.
- Three stations explain it:
  - **Surface** — one cloth defined once as geometry.
  - **Depth** — two masked projections give it a front and a back.
  - **Crossing** — story progress alone carries it toward the lens until it
    clears into sky; it is left out with reduced motion.

## 22. Live/reference decision

Breeze stays reference-only. Its renderer needs the exact `ContinuousBreeze`
markup and the homepage's story progress, and its styles live in the
homepage stylesheets. Running it live would mean importing those wholesale or
copying them, which fails the brief's conditions. Reference-only is the
approved result.

## 23. EX–03 Depth

A calibration field of three planes:

- far: a grid of hairlines, still;
- mid: an aperture of thin frames;
- near: one ivory plane.

`GalleryDepth target="[data-lab-depth]" property="--lab-depth"` writes the
offsets; CSS moves the mid and near planes. Both capability texts are in the
markup; CSS shows the one that applies.

## 24. Pointer primitive reuse

`createPointerFollower` (through `GalleryDepth`) is mouse-only, follows the
fine-pointer, no-reduced-motion query, eases frame-rate-independently, stops
its RAF once settled and rests immediately on a hidden tab. The planes move
only under `(min-width: 1200px) and (hover: hover) and (pointer: fine) and
(prefers-reduced-motion: no-preference)`, the Gallery's gate and design-system
§8 ("pointer parallax on the desktop tier only").

## 25. Motion amplitudes

Mid ×3 / ×2px and near ×6 / ×4px at full deflection; the far plane is still.
That is within `MOTION_LIMITS.parallaxPx` (8). Measured at 1440×900, moving
corner to corner: mid at most 2.88 × 1.92px, near 5.76 × 3.84px.

## 26. EX–04 Threshold

A compact protocol of the real transition:

- **Real link**
- **Intent**
- **Cover** — `PORTAL.coverMs` 1000 ms; a 220 ms flat fade with reduced motion.
- **Route**
- **Release** — `PORTAL.releaseMs` 400 ms.

The durations are read from the production `PORTAL` on the server.

## 27. Why Portal is reference-only

The visitor is already inside the World, and the PORTAL covers the page and
routes to the Lobby; replaying it would be a fake crossing. The Lab never
calls `enterWorld()` and imports only the `PORTAL` constants. "Not replayed
here: the threshold belongs to the way in from the homepage."

## 28. Experiment Index

A labelled `nav` at the end lists EX–01 to EX–04 with each mode, linking to
`#atmosphere`, `#breeze`, `#depth` and `#threshold`. There is no
`/world/lab/[slug]`.

## 29. Lobby change

Only the Lab's two entries and the count changed: "04 Lab — Spatial
experiments — Opening later" became a link with "Enter ↗" in both navigation
modes, and "3 of 5 rooms open" became "4 of 5". Pixels (1440×900, 390×844):
only that card and the count differ.

## 30. World Map change

Available: 01 Gallery, 02 Objects, 03 Archive, 04 Lab; planned: 05 Studio.
Verified in the browser from the Lobby (no current room), Gallery, Objects,
Archive, Lab, the Gallery chamber and the object study: the Lab is current
only in the Lab. Escape closes the map only, and focus returns to its
summary. With a live study running, Escape closes the map and the study stays
live (the Lab adds no Escape handler; rule 16).

## 31. Desktop

The Load toggle is on screen at all four desktop sizes (fixed during QA by
tightening three height-scaled margins). Measured at rest (y in CSS px from
the top of the document; boxes are left, top, right, bottom):

| Viewport | Chrome bottom | Room 04 (y) | Title (y) | EX–01 rule (y) | Atmosphere field | Toggle | Toggle in first view | Smallest target | Smallest text |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1440×900 | 83 | 110 | 145–234 | 355 | 544, 370, 1362, 946 | 78, 727, 256, 771 | yes | 44px | 11px |
| 1366×768 | 78 | 101 | 136–221 | 331 | 516, 346, 1292, 838 | 74, 687, 252, 731 | yes | 44px | 11px |
| 1280×720 | 78 | 100 | 135–215 | 321 | 484, 336, 1211, 797 | 69, 666, 247, 710 | yes | 44px | 11px |
| 1180×820 | 78 | 103 | 141–214 | 328 | 446, 343, 1116, 868 | 64, 697, 242, 741 | yes | 44px | 11px |
| 820×1180 | 108 | 140 | 172–275 | 506 | 44, 824, 776, 1320 | 44, 1382, 223, 1426 | no | 44px | 11px |
| 390×844 | 76 | 104 | 136–201 | 420 | 22, 766, 368, 1186 | 22, 1240, 368, 1284 | no | 44px | 11px |
| 360×740 | 76 | 104 | 136–196 | 440 | 22, 781, 338, 1165 | 22, 1217, 338, 1261 | no | 44px | 11px |
| 844×390 | 68 | 88 | 136–199 | 297 | 379, 312, 798, 606 | 46, 648, 224, 692 | no | 44px | 11px |
| 740×360 | 68 | 88 | 120–176 | 356 | 332, 371, 700, 635 | 40, 701, 303, 745 | no | 44px | 11px |
| 667×375 | 68 | 88 | 120–170 | 350 | 300, 365, 631, 644 | 36, 734, 272, 778 | no | 44px | 11px |

## 32. Tablet

- **1180×820** uses the desktop composition. Depth is static there: the
  tablet tier, under 1200px.
- **820×1180:** every study stacks with the label first, then the field (the
  Atmosphere field 42svh), then its controls.

## 33. Mobile

- **390×844, 360×740:** one column in the brief's order — chrome, Room 04,
  Lab, statement, then Atmosphere (field, then LOAD LIVE STUDY and, once live,
  the range), Breeze, Depth (static on touch), Threshold, the index, the
  note.
- The toggle and the range are full width and 44px tall; text is at least
  11px; there is no horizontal overflow.

## 34. Short landscape

- **844×390, 740×360, 667×375:** the title clears the 68px chrome.
- The Atmosphere bench keeps its two sides, with the controls under the label
  and a field that fits the view (at most `100svh − 96px`, 320px).
- No fixed or giant canvas; normal page scroll; the controls are reachable by
  scrolling.

## 35. Accessibility

- One `main`, one `h1`, four `h2`s; each study is a labelled `article`.
- The Experiment Index is a labelled `nav`. The toggle is a real
  `<button type="button">` that keeps focus through load, cancel and stop.
- The range is a native input with a visible `<label>` and a band as its
  value text. The status is an `<output>`.
- The palette, the cloth still, the depth field and the production canvas
  are `aria-hidden`; the meaning is text.
- **Tab order at rest** (1440×900, 10 stops after the skip link): wordmark →
  Back to Lobby → World map → Exit → LOAD LIVE STUDY → the four index entries
  → Back to Lobby. Once live, Tab reaches the range after the toggle; forty
  ArrowRight presses moved it to 40 ("Cloud"); Enter on the toggle stops the
  study and keeps focus.
- World focus (1px ring) on the toggle and the index at all 10 viewports.

## 36. First paint

Throttled cold loads, every screencast frame (66 per load):

| Load | First content | Header band ivory (first / +50 / +100 / +250 ms / settled / max) | Frame ivory / editorial ground (max) |
| --- | --- | --- | --- |
| 1440×900 | 1,149 ms | 0 / 0 / 0 / 0 / 0 / 0 | 0 / 0 |
| 390×844 | 1,174 ms | 0 / 0 / 0 / 0 / 0 / 0 | 0 / 0 |
| 844×390 | 1,129 ms | 0 / 0 / 0 / 0 / 0 / 0 | 0 / 0 |

- The first frame is the World ground with the chrome; the low arrival
  follows.
- No editorial header or footer, no canvas.
- CLS 0.00018 (1440×900), 0 (390×844, 844×390); the toggle's row is reserved,
  so its appearance shifts nothing.

## 37. Initial network

Cold cache, `/world/lab`, before any activation:

| | 1440×900 | 390×844 |
| --- | --- | --- |
| Load | 30 requests / 339,339 B | 30 / 339,340 B |
| By type | document 12,416 · CSS 5 / 41,398 · JS 20 / 182,890 · fonts 3 / 102,205 · other 430 | the same within 2 B |
| After walking the room, hovering or focusing all 14 controls and tabbing | no further request | no further request |
| Three.js, adapter, shared atmosphere chunk | 0 | 0 |
| Canvases / WebGL contexts | 0 / 0 | 0 / 0 |
| External hosts, Sketchfab, Fab, GLB, iframes | 0 | 0 |
| RAF at rest | 0 | 0 |

All 10 viewports showed 30 requests, 0 Three.js, 0 canvases, 0 contexts and 0
RAF over 2 s.

## 38. Activated network

LOAD LIVE STUDY adds exactly 3 requests, 140,626 B transferred (the same at
1440×900, 820×1180 and 390×844):

| Request | Transferred | Raw |
| --- | --- | --- |
| `lab-atmosphere-adapter` | 570 B | 465 B |
| `atmospheric-bridge-frame` (the shared production atmosphere: renderer, frame, shaders, DOM-bridge timing) | 10,031 B | 24,916 B |
| `three.module` (the existing chunk) | 130,025 B | 524,279 B |

No external host, remote texture, GLB or Sketchfab. A second LOAD in the same
page reuses the cached chunks and went live in 91–93 ms.

## 39. Three lazy-load measurement

- Before activation: 0 requests for `three.module` at every viewport, also
  after hovering, focusing and tabbing through every control.
- After LOAD: exactly 1 (130,025 B transferred). The renderer imports named
  members only, as on the homepage.
- Load to live: 179–187 ms on cold caches (the visual runs at all 10
  viewports and the Atmosphere journeys). This is local and unthrottled.

## 40. JS/CSS delta

Client build output, each file gzipped separately with Node's default zlib
level and summed, against the `18836be` build:

| | `18836be` | PASS 14 |
| --- | --- | --- |
| JS | 41 files, 1,235,293 B raw / 358,875 gzip | 44 files, 1,241,928 / 362,185 (+6,635 / +3,310) |
| CSS | 13 files, 322,344 / 61,475 | 14 files, 336,399 / 64,849 (+14,055 / +3,374) |

- **Initial Lab JS.** The one new initial chunk is the Atmosphere island
  (4,607 B raw, 1,821 gzip); Depth reuses the existing `gallery-depth`
  chunk. The adapter (465 B) loads only on LOAD.
- **The split.** Reusing the production atmosphere moved it out of
  `home-experience` (47,780 → 23,083 B) into the shared chunk (24,916 B):
  +219 B in total.
- **Small shared growth.**
  - `capability` grew by 539 B: the readers the island uses
    (`readMotionCapability`, `subscribeMotionCapability`).
  - `tokens` grew by 61 B.
  - The route manifest grew by 739 B.
- **CSS** is the room's stylesheet plus 50 B of shared selectors in
  `world-chrome.css`.

## 41. RAF measurements

| Moment | RAF calls |
| --- | --- |
| Before activation, 2 s at rest | 0 (all 10 viewports) |
| Live, at rest after settling, 2 s | 0 (1440×900, 820×1180, 390×844) |
| After STOP, 2 s | 0 |
| After leaving with a live study, 1.5 s | 0 |
| Depth while moving across the field | 361 (six corner moves) |
| Depth settled at a corner, 1.5 s | 0 |
| Depth after the pointer leaves, 1.5 s | 0 |
| Static fallback (no WebGL), 1 s | 0 |

## 42. WebGL cleanup

After STOP:

- 0 canvases;
- the context reports `isContextLost()` (released by `forceContextLoss`);
- the host's renderer attributes are gone;
- the palette is visible again.

A new LOAD creates one fresh context (two created in total, one live).
Leaving the route or a reduced-motion request ends the same way.

## 43. Homepage regression

- **Engine.** Every homepage experiment module is digest-locked.
- **Behaviour.** Scrolling the homepage to 16 story positions (1440×900, WebGL)
  on both builds gave identical sky state, tier and canvas visibility at every
  position. Frames differed by at most 2/255 per channel, with 0 pixels above
  the noise floor.
- **Request cost.** Reusing the atmosphere in a second client entry splits it
  into a shared chunk. The homepage now loads it as one more script, with
  one `modulepreload` in its HTML: 40 → 41 requests, +1,471 B (1440×900) and
  +1,469 B (390×844). Its scripts went from 22 / 335,828 B to 23 / 337,281 B.
  This is the cost of consuming rather than forking.
- **HTML.** The homepage HTML is otherwise identical to the PASS 13 build.

## 44. Portal regression

`world-portal.ts` and `world-gateway-link.tsx` are digest-locked, and
`check-world-gateway` (PASS 05) passes. The Lab imports only `PORTAL`,
server-side.

## 45. Gallery regression

Served HTML and rendered markup differ only by the World map's Lab entry (now
a link). Gallery tiles are identical (1440×900, 390×844).

## 46. Objects regression

Room 02 differs only by the Lab entry. With the Archive and the Lab
re-planned, the PASS 10 room digest still matches. Tiles are identical.

## 47. Archive regression

The Archive differs only by the Lab entry (markup and tiles), and its
content, records and provenance are unchanged. `check-archive` was updated to
the four-room building and passes.

## 48. Product regression

- **Unchanged.** `/products` and `/products/form-lounge-chair` serve
  identical HTML. The object study (`?from=objects`) differs only by the Lab
  entry.
- **Locked.** `ProductDetail`, the product context, `ObjectSelection` and the
  product routes are digest-locked; `check-product-navigation` passes.

## 49. Automated validation

All of these passed on the final tree:

- `yarn lint`, `yarn tsc --noEmit`;
- `check:motion`, `intro`, `hero`, `home`, `content`, `assets`, `worlds`,
  `world`, `gallery`, `exhibit`, `world-shell`, `world-ux`, `objects-room`,
  `object-study`, `product-navigation`, `archive`, `lab`;
- `check:routes` against the local build (49 pages, 77 images, 13 reserved
  404s);
- `yarn build`, `yarn build:vercel`.

`check:lab` covers the brief's checks 1–106 (runtime counts are browser QA).
Contract updates in eight checks follow the PASS 13 pattern: identities are
checked rather than counts loosened, and older digests are compared against
a building with the new rooms re-planned.

## 50. Mutation testing

`check:lab` caught 30 of 30 deliberate breaks:

- **The brief's 14:**
  - Lab planned; wrong Lab href; Studio available;
  - a missing source module; a fifth experiment;
  - a static `three` import; auto-load on mount; a direct WebGL context; no
    single-instance guard;
  - STOP not destroying; Depth over its amplitude; Depth under reduced motion;
  - Threshold calling `enterWorld`; a broken index.
- **Lifecycle:** an ambient `tick()`, a permanent RAF, a late import
  resurrecting, unmount leaving the study alive.
- **Capability:** Save-Data fabricated; reduced motion still loading;
  Save-Data reported as a failure.
- **Honesty:** a percentage; a source path shown to visitors; a wave
  animation; a live Breeze; an invented palette colour.
- **Locks:** the production renderer edited; the portal edited; the Lobby
  hard-coding the Lab; a study route.

## 51. Browser QA

All serial and bounded, on the final build:

- **Initial state, all 10 viewports:** 10 of 10 (the §37 contract).
- **Visual, all 10 viewports:** 10 of 10.
  - Arrival and the settled geometry.
  - Each study and the index and note.
  - A live study at Cloud (the renderer's tier per §13).
  - The World map inside the viewport with the Lab current.
  - Focus on the toggle and an index entry.
  - 0 RAF at rest.
- **Atmosphere (1440×900, 820×1180, 390×844):** 3 of 3.
  - Loading state seen, then one canvas and one context.
  - Activated network per §38.
  - The range from minimum to maximum and back: Air → Cloud → Open sky, with
    the ground swapping at 75.
  - Determinism (§16), 0 RAF at rest, STOP cleanup, and a fresh LOAD.
- **Races (1440×900, 390×844):** 2 of 2 (§18).
- **Capability:**
  - reduced motion (no toggle);
  - Save-Data at 390×844 and 1440×900;
  - no WebGL: Static fallback with the palette intact. Three.js logs its own
    three "could not create a WebGL context" lines there, which are expected
    and recorded.
- **Depth:** live at 1440×900; static at 390×844 (touch), 1180×820 (tablet
  tier) and under reduced motion.
- **World journeys at 1440×900, 390×844, 844×390 — 27 of 27:**
  - Lobby → Lab;
  - direct `/world/lab#…` for all four studies: targets 146–154px below the
    top (1440×900), 143–151 (390×844), 116–124 (844×390), with no layout jump;
  - the index (same document);
  - map navigation from every room and shell;
  - Back to Lobby, Exit, refresh, keyboard, reduced motion, CLS.

No console errors outside the forced no-WebGL run.

## 52. Known issues

1. Atmosphere is the only heavy live study; Breeze and Threshold are
   reference studies (approved results).
2. The renderer's tier follows the bench's canvas width: tablet tier at
   1440×900 and 1366×768, mobile tier (one cloud bank) from 1280×720 down. Its
   desktop tier needs a 1200px-wide canvas and is never reached in this
   layout.
3. The Lab holds ambient time still (§16): the air does not drift between
   frames as it does on the homepage.
4. Reusing the atmosphere made the homepage load it as one more script (+1
   request, +1,471 B; §43). Pages that already load the shared `capability`
   chunk carry +539 B raw for its readers (measured on the homepage only).
5. With WebGL unavailable, Three.js logs its own console errors before the
   study falls back (the production renderer's behaviour).
6. Depth moves only on the desktop tier (1200px and up with a fine pointer),
   following design-system §8 — narrower than the brief's "fine pointer".
7. On tablet portrait, phones and short landscape, LOAD LIVE STUDY sits below
   the field (the brief's mobile order) and is reached by scrolling.
8. No GLB. Measurements come from headless Chrome on this workstation; there
   is no Safari, Firefox, real-device or field data.
9. Carried forward: the Product route renders per request; header search
   results prefetch Product details; canonical metadata streaming.

## 53. PASS 15 boundary

**PASS 14 delivers** Room 04: a workbench of four production studies with one
opt-in live WebGL study, a reused depth field, two honest references, an
index and a note.

**Stable contracts:**

- `/world/lab`; `worldRooms.lab` available;
- `data/world-lab.ts` and its provenance;
- the adapter's mapping (range → production progress, ground at the
  homepage swap);
- one toggle, one instance, frames on demand, full cleanup;
- rules 23–24; `yarn check:lab`.

**Not started:**

- Room 05 Studio, a GLB experiment, a model uploader, a shader editor, a
  performance dashboard, a WebGPU rewrite, React Three Fiber;
- a CMS, Archive ingestion or Archive contextual shells;
- product work or a homepage redesign.

**PASS 15 is to be chosen after review:** Room 05 / Studio foundation,
real-device hardening, or a real 3D environment, when appropriate.
