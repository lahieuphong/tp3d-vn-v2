# Tân Phong — Atrium orbit (Tier B): implementation contract

**Status: PASS 6A, a dormant foundation; its UX and integration decisions
are locked in PASS 6A.5 and the owner decisions of PASS 6A.75 (§0). PASS
6A.75 adds an interaction harness (§15). FINAL VISUAL ORBIT NOT YET
IMPLEMENTED: it waits for the real camera plates. PASS 6A.9 adds the studio
handoff, the delivery intake contract (§16) and the PASS 6B.1 entry criteria
(§17); PASS 6A.95 locks the master storage policy (§16); PASS 6A.96 fixes
three live QA issues of the deployed harness (§15.1): the Arrival backdrop,
the release to the Footer and the readout. PASS 6B.0 draws a first orbit on
comp plates cut from the room design comps (§15.2): provisional, preview
only, and replaced view by view when studio plates are accepted. PASS 6B.1
stops the picture snapping sharper as the pull-back ends and as each move
begins and ends (§15.3). STEP 2B (2026-10-08, owner decision) makes this
orbit, on its comp plates, the homepage's orbit (§15.4). Since 2026-10-09
(owner decision) the rooms stand behind closed doors, and a room is entered
by choosing its door (§15.9). Since 2026-10-10 the Kitchen view ends on the
Living view's planter (§15.10), and the oculus's sky over the wide Atrium is
alive (§15.11).** None of the
approved render plates and no camera data exist yet. Until STEP 2B the
production homepage ran the approved Scene 3 with the portal orbit
(`aa9ae55`) and Tier B code loaded only in development or a preview build,
with `?atriumOrbit=1`; the portal orbit is now the fallback
(`?atriumOrbit=0`, or a failed load). The studio plates still do not exist:
what is live is the comp-plate orbit.

Render contract (what the studio delivers): `docs/TANPHONG_ATRIUM_ORBIT_ASSET_SPEC.md`.

---

## 0. Locked decisions (PASS 6A.5, updated by PASS 6A.75)

"Orbit mode" means the Tier B controller is loaded (preview gate open, §1).
With the gate shut, production keeps today's Scene 3 unchanged, including
"Enter the worlds." and ENTER THE WORLD.

| Decision | In orbit mode |
| --- | --- |
| **Arrival** | Architecture only (sky → oculus → Atrium context → Living), not a fifth room. No editorial UI: no 3D WORLDS / "Enter the worlds.", no room title, no counter, no thumbnail, no EXPLORE THIS ROOM, no indicator, no ENTER THE WORLD. PASS 6A.75: the four room labels (01 Living … 04 Kitchen) are hidden too, and out of the tab order. "ARRIVAL" and "00 / 05" never appear in public UI. |
| **Living** | The first editorial hold and the first public room state: 3D WORLDS, "Enter / the living room.", the body copy, EXPLORE THIS ROOM →, and the indicator (thumbnail + 01 / 04 LIVING). |
| **Bedroom, Bathroom, Kitchen** | The same model: 02 / 04, 03 / 04 and 04 / 04, with the title phrase changing. The body copy is rendered once and shared. The CTA route comes from the single active-room state. |
| **Room labels** | PASS 6A.75: from Living on, the existing four labels show in their existing placement (temporary preview positioning only, not matched to any future plate): the active room at full emphasis, the others quiet. |
| **ENTER THE WORLD** | PASS 6A.75: hidden through Arrival and the room discovery. In the later part of the final Kitchen hold, after Kitchen has been readable alone, the existing `WorldGatewayLink` returns: eased by `roomOrbitProgress` and interactive by the end. It is the same element (one link, `/world`, its portal transition unchanged), still written only by the story timeline. The sequence is Arrival → Living → Bedroom → Bathroom → Kitchen → ENTER THE WORLD. |
| **Bottom-right zone (spec §8 zone I)** | Room holds: the room thumbnail and `0n / 04` plus the room name. As the gateway returns in late Kitchen it takes the zone back: the indicator leaves first, then the gateway enters, so the two never overlap (phones: one column, so the counter keeps its own row above the gateway). |
| **Exposure shade** | PASS 6A.96: the approved Atrium photograph stays in view for the whole harness. The approved shade is drawn in two parts: the zenith band (header readability) follows the bridge's exposure as before; the field that backs the copy shows only with the editorial UI. Arrival and the release therefore show the architecture, never an empty shaded field (§15.1). |
| **Release** | PASS 6A.96: after the useful final state (Kitchen, then Kitchen with the gateway) and before the sticky stage leaves, a short scroll-driven release clears the copy, the CTA, the room labels, the indicator and the baseline, then the gateway. The stage reaches the Footer as a quiet architectural frame. Kitchen stays the active room; reverse scrolling rebuilds Gateway, then Kitchen (§15.1). |
| **Exploration CTA** | Exactly one: EXPLORE THIS ROOM →, in the editorial block. |
| **Runtime image format** | WebP only, the format `scripts/optimize-images.mjs` already writes. AVIF is not advertised and no AVIF tooling is added. Adding it later is one entry in `ATRIUM_ORBIT_ASSETS.formats`; the room model does not change. The spec (§13.3, §16) says the same since PASS 6A.75. |
| **Masters** | The studio's PNG / TIFF masters (spec §13.1) stay source assets and are never served. |
| **Progress** | `baseStoryProgress` and `roomOrbitProgress` are two separate normalised 0 → 1 domains (§6). |
| **Orbit span and weights** | The 160svh span, the hold weights (including the longer Kitchen hold), the move weights and the release weight are PROVISIONAL. PASS 6B retunes them from the real camera angles and motion footage. |

## 1. Feature gate

```ts
// components/home/experience/home-story-timeline.ts
(import.meta.env.DEV || import.meta.env.VITE_ATRIUM_ORBIT_PREVIEW === '1') &&
  new URLSearchParams(window.location.search).get('atriumOrbit') === '1'
```

| Where | How to open it |
| --- | --- |
| Development | `yarn dev`, then `/?atriumOrbit=1`. Add `&storyDebug=1` for the story readout line (development-only, as before); it also shows the Tier B diagnostic panel. |
| Preview build | build with `VITE_ATRIUM_ORBIT_PREVIEW=1`, then `/?atriumOrbit=1`: the clean review URL, with no diagnostic panel and no technical text over the design (PASS 6A.96). |
| Engineering readout | `/?atriumOrbit=1&atriumOrbitDebug=1`, in development and in a preview build. Only this adds the diagnostic panel (§15). `atriumOrbitDebug=1` alone opens nothing. |
| Production | Shut. The gate is a build-time constant, so production builds never request the controller (verified in the built client bundle; see §10). |

The controller is reached only through a dynamic `import()` inside
`createHomeStoryTimeline`. The approved Scene 3 stays if the import fails,
if Home unmounts first, or if the query parameter is absent. While Tier B is
loaded, the portal orbit stands down (`orbitEnabled && !roomOrbit`).

## 2. Files

| File | Role |
| --- | --- |
| `atrium-orbit-model.ts` | Canonical states `arrival → living → bedroom → bathroom → kitchen`, the four transitions, editorial copy ("Enter" + phrase, `01 / 04`). Arrival has no editorial UI and no public count. |
| `atrium-orbit-cameras.ts` | Typed `world-atrium-cameras.json` contract (spec §6) and `validateAtriumOrbitCameras`, which never throws. |
| `atrium-orbit-progress.ts` | Timing config (holds apart from moves), `angleWeights`, `buildOrbitTimeline`, stateless `sampleOrbit`, `planPlates`. |
| `atrium-orbit-manifest.ts` | The only place that names plate files: formats, widths, portrait media, delivery status, thumbnails, fascia anchors, full per-state records. |
| `atrium-orbit-transition.ts` | The transition extension point (`PlateTransition`), occluder hints, and the provisional cut. |
| `atrium-orbit-controller.ts` | The dev / preview shell: plate stage, editorial block, indicator, diagnostic. |
| `atrium-orbit-doors.ts` | The closed doors (§15.9): each doorway's outline on each plate, the one outline the leaves show through, and which door lies under a place. Pure, like the rest, and it knows neither time nor the story position: a door is shut unless the entry raises it. |
| `atrium-orbit-sky.ts` | The oculus's living sky, the still part (§15.11): where the sky is on the wide plate, the box of the foreground picture that lies over it, who gets a living sky, and the numbers of its look and clock. Pure. |
| `atrium-orbit-preview.css` | Shell styles, loaded only with the controller. |

All are in `components/home/experience/`. The only file that loads them is
`home-story-timeline.ts`, through the gated dynamic import and a type-only
reference. `room-door-entry.ts` (§15.9), in the same folder, reads the
doors' outlines and is loaded by the controller alone, so it travels in the
same lazy chunk. It is deliberately not one of these modules: it is the one
part that listens and knows time, which the rules these modules are checked
against forbid. The same holds for `oculus-sky.ts` and
`oculus-sky-shaders.ts` (§15.11): they hold the WebGL canvas of the oculus's
sky, read `atrium-orbit-sky.ts`, and are loaded by the controller alone.

## 3. Component architecture

Imperative, like the rest of Scene 3's runtime, so there is no React state
per frame. The controller builds four parts, all derived from one state per
frame:

| Part | Placement | Content |
| --- | --- | --- |
| `OrbitPlateStage` | child of `.hc-atrium-backdrop`, inside `[data-scene3-camera]` | at most the two plates of a move; others `hidden` (no layer). Since PASS 6B.0 these are comp plates (§15.2). Since §15.9 a plate is a box (`.hc-room-orbit-plate`, which takes the pose and the join) holding its `<picture>` and, over it, the `<picture>` of its closed doors |
| `RoomEditorial` | after the approved `.hc-atrium-copy`, reusing its classes | eyebrow, `<h2>` "Enter" + `<em>` phrase, body copy once, "EXPLORE THIS ROOM ⟶" |
| `RoomIndicator` | after the World gateway (spec §8 zone I) | round 192 px thumbnail (`.hc-atrium-preview` frame), `01 / 04`, room name |
| Diagnostic | inside `.hc-worlds`; created only on explicit request (`diagnostics`, from `?atriumOrbitDebug=1`) | e.g. "Bedroom production plate missing" |

While the controller is loaded, `.hc-worlds[data-atrium-orbit-preview]`
hides the approved copy, and at Arrival (no `data-atrium-room`) the four
room labels. The World gateway is never styled by Tier B: `update()` returns
its reveal and the timeline writes its opacity and inert state (§0).

The single source of truth is `show(state)`:

- At Arrival it hides the room copy and the indicator and clears their text, so the DOM never depends on the scroll path.
- In a room it sets `.hc-worlds[data-atrium-room]`, the title phrase, counter, label, thumbnail and CTA `href`, and `data-atrium-current` on the matching existing room link (label emphasis).

It writes only when the state changes. There is no live region, so screen
readers are not flooded while scrolling.

The existing four room links remain the semantic room labels. They are not
repositioned until accepted plates are measured
(`ATRIUM_ORBIT_FASCIA`, all `null`).

## 4. Expected assets

**Desktop:** `world-atrium-{arrival,living,bedroom,bathroom,kitchen}`.
**Portrait:** `world-atrium-{…}-portrait`.
**Cameras:** `world-atrium-cameras.json`.

Web variants (`ATRIUM_ORBIT_ASSETS`) live at
`/images/home-chapters/world-atrium-<view>[-portrait][-<width>].webp`:

| | Widths (the largest has no width suffix) |
| --- | --- |
| Desktop | 3344, 2560, 1920, 1280, 720 |
| Portrait | 1290, 860 |
| Formats | `['webp']` only (§0), set in one place: what `scripts/optimize-images.mjs` writes today. |

The studio's lossless PNG / TIFF masters stay outside Git and outside
`public/` (§16) and are never served. The indicator reuses the existing
`room-preview-{living,bedroom,bathroom,kitchen}.webp` (192 px).

**Routes** come from the rendered room links (`worldsChapterOptions`) and
are never invented:

| Room | Route |
| --- | --- |
| Living | `/spaces/living` |
| Bedroom | `/spaces/bedroom` |
| Bathroom | `/worlds/modern-bathroom` |
| Kitchen | `/spaces/kitchen` |

## 5. Camera JSON

Typed as `AtriumOrbitCameraData`; the fields follow spec §6 exactly.
`validateAtriumOrbitCameras(input)` returns one of three statuses:

| Status | When | Effect on the orbit |
| --- | --- | --- |
| `missing` | `null` / `undefined` (today: `ATRIUM_ORBIT_CAMERA_DATA = null`) | provisional equal move weights |
| `invalid` | see the error list below | ignored; provisional weights |
| `valid` | none of the errors | `stepAngles` drive the move weights |

**Errors** (the file is rejected):

- a missing desktop camera, or a camera's `id` that differs from its key;
- a malformed field;
- `steps` not exactly the four transitions in order;
- a zero step, or steps that change sign;
- room cameras that do not share one focal length.

**Warnings** (people decide):

- a missing portrait camera;
- colour output that is not sRGB;
- a step that disagrees with the cameras' `angleDeg` by more than 1°;
- an Arrival focal-length exception;
- an eye height outside 1.55–1.65 m;
- non-zero roll;
- a lens that is not 32 mm full-frame equivalent (an Arrival exception is reported once);
- room cameras that do not share one orbit radius;
- a portrait camera that differs from its desktop camera in position, target or focal length.

The last three were added in PASS 6A.9 for delivery intake. They are spec
rules (§2.2, §4, §6), not camera values.

## 6. Progress model

Two separate normalised domains. No value is a master progress that runs
past 1.

| Domain | Range | Span | Timeline code |
| --- | --- | --- | --- |
| `baseStoryProgress` | 0 → 1, clamped; stays 1 after the journey | the approved journey, `--story-base-height` (paced to 640/560/480svh by STEP 1; shares unchanged) | `p = clamp((scroll - top) / geometry.span)` |
| `roomOrbitProgress` | 0 → 1, clamped; 0 until `baseStoryProgress` = 1 | the appended `--story-orbit-height`: 160svh, PROVISIONAL | `clamp((scroll - top - geometry.span) / geometry.orbit)` |

- The timeline hands both to the controller by name (`update({ baseStoryProgress, roomOrbitProgress, … })`).
- Preload reads `baseStoryProgress`; the sampler reads `roomOrbitProgress`.
- Both come from the one master timeline. No new scroll, wheel or resize listener, observer, timer or RAF is added; decoded plates call the timeline's `schedule` once.
- `check:atrium-orbit` asserts in the DOM double that both stay within 0 → 1 and that the room orbit is non-zero only once the base story is at 1.

The 160svh span is shared with the live portal orbit (`home-story.css`). It
is not the final room-orbit length: PASS 6B may retune the total span, the
hold lengths and the move lengths once the real camera angles exist.

`sampleOrbit(roomOrbitProgress, timeline)` is pure. It returns:

- `roomOrbitProgress`, clamped;
- `phase` (hold / move / release);
- `activeState`, `previousState`, `nextState`;
- `transitionFrom`, `transitionTo`, `transitionIndex`;
- `localTransitionProgress`, `holdProgress` and `releaseProgress` (PASS 6A.96).

Reverse scrolling, reload, back/forward and landing mid-orbit all resolve to
the same state. Only the preload order and `direction` use the previous
sample. The UI switches at `uiSwitchAt` (0.5) of a move.

**Timeline:** hold Arrival → move → hold Living → … → hold Kitchen →
release. `ATRIUM_ORBIT_TIMING` uses relative weights, all PROVISIONAL:

| Segment | Weight | Share of the orbit span (provisional) |
| --- | --- | --- |
| Arrival hold | 0.35 (transitional) | ≈ 3% |
| Living, Bedroom, Bathroom holds | 1 each | ≈ 9% each |
| Kitchen final hold | 1.5 (the longest hold; the number is provisional) | ≈ 13% |
| Four moves | 6 in total since PASS 6B.0 (4 before), split by angle | ≈ 13% each while equal |
| Release (PASS 6A.96) | 0.8 (`release.weight`; 0 = no release) | ≈ 7% |

The release is not a state: Kitchen stays the active room. It takes its
share from the whole span, so every hold and move keeps its proportion.

Since PASS 6B.0 a move is real camera travel, so each one outlasts a room
hold, and with plates the preview plays the orbit over a longer span
(380svh, set in `atrium-orbit-preview.css` for
`[data-atrium-orbit-preview='plates']` with motion allowed; production's
`--story-orbit-height` stays 160svh, and so does reduced motion). At
1440×900 that is ≈ 440 px of scroll per move, ≈ 294 px per room hold,
≈ 440 px for Kitchen and ≈ 235 px for the release.

These are placeholders for PASS 6B, not a design. The Arrival hold is a
short visual settle, not a room; no final move weight is assigned until the
real `world-atrium-cameras.json` arrives.

## 7. Angle weighting

`angleWeights(deltas, minShare)`:

1. Takes the absolute signed step angles and normalises them: `|Δ| / Σ|Δ|`.
2. Lifts any share below `minShare` (0.1 of the movement) to that floor.
3. Takes the difference from the larger shares in proportion, so the order of sizes is kept.

Angles only redistribute movement; hold weights never depend on them. With
no valid camera data, the weights are equal and the timeline reports
`weighting: 'provisional-equal'`.

## 8. Preload and decode

`planPlates` never asks for more than four plates, never every plate, and
never a plate whose status is `missing`:

| When | Required | Warmed |
| --- | --- | --- |
| `baseStoryProgress < 0.16` (`scenePreload`) | nothing | nothing |
| `baseStoryProgress ≥ 0.16` | Arrival | — |
| `baseStoryProgress ≥ 0.3` (`thumbnailPreload`) | Arrival | Living |
| In the orbit: a hold | the active plate | the next in the direction of travel, then the other neighbour |
| In the orbit: a move | both plates | the neighbours |

Plates use the existing `prepareSceneImage` pipeline: `<picture>` with
`data-srcset`, eager load on intent, `decode()` before display. There is no
second image pipeline.

- **Decode before display:** if a wanted plate is not decoded, the last fully drawn plate holds at rest. A missing Arrival is the approved Atrium already under the stage.
- **Failed plate:** never drawn, no broken-image icon.
- **UI follows the drawn plate.** Only while the delivery is incomplete (today) does it follow the scroll sample, so the sync can be previewed.

Since PASS 6B.1 no plate ever sets `will-change`: a promoted plate is drawn
from a texture and resampled, which is softer than the same plate at rest,
so the picture snapped as each move began and ended (§15.3). Plates are
posed by 2D transforms and drawn directly; hidden plates are not rendered.

## 9. Responsive and reduced motion

**Plates.** `<source media="(max-width: 767px) and (orientation: portrait)">`
selects the portrait view; everything else gets the desktop view with
today's `sizes`. The browser chooses; script never swaps on resize. If a
portrait view is missing, its desktop plate's crop is used. A missing
desktop plate means no plate. Per-orientation data (fascia anchors) is kept
apart: desktop coordinates are never assumed for portrait.

**Layout states.** `data-atrium-layout` takes `desktop` (≥ 1200), `tablet`
(768–1199) or `mobile` (< 768). Until the plates arrive, all three reuse
the approved Scene 3 layout.

**Reduced motion.**

- `ATRIUM_ORBIT_TIMING_REDUCED` keeps the holds with zero-width moves.
- `reducedTransition` is a plain change with no transform, kept in 6B.
- Production CSS still has no orbit span under reduced motion (unchanged).
- The preview stylesheet gives reduced motion a provisional 160svh span, only to exercise the path.

## 10. Sky Bridge integration point

The atmospheric sky renderer runs only while
`scroll ≤ top + span + 1`, so it is finished before `roomOrbitProgress`
leaves 0 (at `p = 1`). The two lifecycles are separate objects that the
same timeline creates and destroys.

The Tier B stage sits inside the approved backdrop, so the bridge's
exposure (`--world-exposure` on the backdrop's `::after`), the camera mass
and the reveal apply unchanged. Room plates are DOM images; there is no
WebGL for plates.

**Production isolation:** in a production build the gate folds to `false`.
No client asset references the controller or its stylesheet (checked after
`yarn build`), and nothing outside the timeline imports these modules
(`check:atrium-orbit-foundation`).

## 11. Lifecycle

- `destroy()` removes the stage, copy, indicator and diagnostic (when one exists), its attributes, `--atrium-editorial`, the room labels' `inert` state it set, and every image handler (`prepareSceneImage.destroy`).
- The timeline calls it on unmount, before restoring its saved attributes.
- A hidden tab calls `suspend()`, which drops promoted layers.
- An import that resolves after unmount is ignored.
- Returning Home creates one fresh instance.

## 12. Checks

| Command | Covers |
| --- | --- |
| `check:atrium-orbit-foundation` | Model (exactly four public rooms, Arrival with no public UI, Living the first public state), camera validation (random rigs, every error and warning, junk never throws), weighting, timeline, sampler (forward = reverse = landing; clamped domain), preload, manifest (WebP only, all missing, no stand-ins in `public/`, no plate path outside the manifest), transition reversibility, orbit-mode CSS scoped to the preview attribute, the two progress domains in the timeline source, source rules (no listener / RAF / timer / observer / second pipeline / live region) |
| `check:atrium-doors` | The closed doors (§15.9): the outlines (inside their plates, never overlapping, a doorway shown by two plates carrying one leaf the pan's shift across, the wide Atrium's Living battens lying on the Living view's under the push), the one clip (exactly the leaves when shut, nothing when risen, a fixed number of points), which door lies under a place, no fall (the door data knows no story position; the controller writes every door shut and only the entry raises one), the door pictures (one for each plate file, the plate's size, clear off the leaves, a borrowed leaf the same pixels as its own), and the real `room-door-entry.ts` in a DOM double: one click listener, plain activations only, what is played, the room link's own route followed once, and every way out (a modified click, a second choice, reduced motion, a door off stage, a document that leaves, a route that never comes). |
| `check:oculus-sky` | The oculus's living sky (§15.11): where it is on the plate (the canvas's box, the opening, the foreground picture's box, the shares it is placed by), who gets one (never reduced motion or Save-Data), its clock (a stalled frame one step, a long gap none) and drawing buffer (the screen's density within a tier's limit and a pixel budget), the foreground picture's two files (clear where the sky was, whole on the ring, ribs and leaves, fading out at their ends, the plate's own picture where they are whole), the shader's source (no texture, bounded loops, two sheets at two speeds), and the real `oculus-sky.ts` against a stand-in for Three.js: one lazy import and one modest context, no clock, timer, observer or frame of its own, time from the frames it is given, paused off stage and in a hidden tab, eased in when ready late, released once, and the painted sky for good on every failure. |
| `check:atrium-orbit-assets` | Manual, never part of the build or of another check: the studio delivery intake (§16). The foundation check exercises it on synthetic deliveries in the OS temp folder. |
| `check:atrium-orbit` | The timeline hook in its DOM double: gate shut in production, `?atriumOrbit=1` required, base journey identical, portal orbit stands down, both progress domains within 0 → 1 with the orbit only after the base story ends, wake, suspend, destroy, late import, failed import |

PASS 6A.75 adds: Arrival hides the room labels; the World gateway returns
only in late Kitchen, eased, pure forward / reverse, interactive by the end, after the indicator has left zone I;
one `WorldGatewayLink` to `/world`, never written by Tier B; no orbiting room
portals or camera pan / zoom; every provisional number in
`ATRIUM_ORBIT_TIMING`; WebP-only wording in the spec.

PASS 6A.96 adds (§15.1): the two shade parts recompose to the approved
shade on every layout, and the copy field shows only with the editorial UI;
nothing in the preview hides, fades or moves the Atrium itself; the release
is pure, eases each part out, holds a quiet frame before
`roomOrbitProgress` = 1 and rebuilds in reverse; Kitchen stays readable
(alone, then with the whole gateway); the readout exists only on explicit
request, in the timeline's DOM double and in a second DOM double that runs
the real controller.

The mutation count for these checks is in §15.

## 13. Missing (blocks PASS 6B)

- 5 desktop + 5 portrait approved plates, as masters and the web variants above (none exist; every status is `missing`);
- the final `world-atrium-cameras.json`;
- per-view crop anchors and fascia label anchors, measured from accepted plates.

## 14. PASS 6B, when the approved plates arrive

1. Accept the plates (spec §15).
2. Produce the WebP variants with the existing optimiser.
3. Flip `ATRIUM_ORBIT_PLATES`.
4. Import the validated camera JSON into `ATRIUM_ORBIT_CAMERA_DATA`.
5. Retune `ATRIUM_ORBIT_TIMING` and the orbit span on the real angles and motion footage.
6. Design the transition that replaces `provisionalCut` (spec §9), and the Living reveal.
7. Measure the crop and fascia anchors.
8. Still open: the reduced-motion span, and whether the shell becomes server-rendered markup.
9. Open the gate for production on `desktopComplete && camera data valid`. Only after the new orbit is approved, remove the superseded production markup ("Enter the worlds." copy and the portal orbit). The ENTER THE WORLD gateway stays: it is the final step after Kitchen.

## 15. PASS 6A.75 — interaction harness

**FINAL VISUAL ORBIT NOT YET IMPLEMENTED. Waiting for real camera plates.**

The harness proves the room *state* progression on the existing master
timeline. It proves nothing about the future spatial composition.

| What it proves | How |
| --- | --- |
| Sequence Arrival → Living → Bedroom → Bathroom → Kitchen → ENTER THE WORLD, forward and reverse | `sampleOrbit(roomOrbitProgress)` (pure) and `atriumGateway(sample, shown)` (pure) |
| Holds and moves | the provisional weights in `ATRIUM_ORBIT_TIMING` (the hold and move weights are unchanged since 6A; PASS 6A.96 appends the release, §15.1) plus `gateway`: within 0.50–0.85 of the Kitchen hold, the indicator eases out over the first half of that window (`handoff` 0.5) and the gateway eases in over the second; the gateway is interactive from half its opacity. All PROVISIONAL. |
| Editorial sync | one shown state drives the title, counter, thumbnail, CTA route, label emphasis, gateway reveal and indicator cross-fade |
| Arrival | architecture only, labels included (§0) |
| Responsive and reduced UI states | the layouts of §9; reduced motion has no moves, so plain state changes, with the same late-Kitchen gateway |
| Feature-gate safety | §1; production builds contain no Tier B code |

**Development diagnostics** (the dashed monospace panel, not production
UI). Since PASS 6A.96 it exists only on explicit request,
`?atriumOrbit=1&atriumOrbitDebug=1` (in development `&storyDebug=1` shows it
too); the review URL `?atriumOrbit=1` has no such node. It reports
`roomOrbitProgress`, the current segment and its bounds, hold, move
(`transitionFrom → transitionTo` with local progress) or release, the shown
state, the gateway reveal, the editorial presence, the direction, and the
missing plates and camera data.

**Checks:** all 64 deliberate breakages of the hook, the modules, the CSS and the spec wording were caught by `check:atrium-orbit-foundation` and `check:atrium-orbit`. 21 of them target the PASS 6A.75 locks. PASS 6A.96: 13 further breakages (a shade stop, the shade without the editorial value, a hidden backdrop image, the readout on by default or always created or opened by the clean URL, the presence not written, the controller touching the backdrop, a gateway or copy that stays through the release, a release fade that runs to the very end, a shade during Arrival, an ignored baseline) were all caught.

**Deliberately not built:**

- the approved Atrium photograph is a static backdrop: never panned, zoomed, rotated or distorted;
- no room imagery moves through space: the `room-preview-*.webp` files appear only in the small indicator;
- no camera positions, doorway focus or transition physics;
- `ATRIUM_ORBIT_CAMERA_DATA` stays `null`; generated rigs exist only in the check script.

**`worlds-orbit.ts` (the live portal orbit), audited:**

- **Generic pure helpers (reused):** none of that file's portal code. The harness uses only `span` and `editorial` from `home-motion.ts`, the shared clamp-and-ease helpers.
- **Reusable later, not needed yet:**
  - the plate cover-crop mapping inside `measureWorldsOrbit` (source point → viewport point, 50% / 51% on phones);
  - `ATRIUM_SOURCE` dimensions.

  PASS 6B may need these for per-plate anchors.
- **Portal-specific, not reused:** `ORBIT` shapes, `portalBox`, `fitOrbit`, `worldsOrbitFrame` (portal placement, depth, scale, blur, z), `orbitFocus` turns, `ORBIT_DOORWAYS` and the exposure field, the camera breath and `orbitPose`, and the gateway quiet / return choreography.

### 15.1 PASS 6A.96 — live harness QA

Three issues seen in a recording of the deployed harness. The state
sequence, the room model, the gateway and the 160svh span are unchanged.

**A. Arrival backdrop.** The brown field was not a missing image or an
unmounted layer: the photograph was decoded and painted throughout. It was
the approved exposure shade (`.hc-atrium-backdrop::after`). That shade backs
the copy: on phones it is up to 93% opaque over the lower two thirds
(`#24190dec`), on tablets 60%. In production it arrives together with the
copy. In orbit mode Arrival has no copy, so the shade reached full strength
with nothing on it, until Living brought the copy in.

| | Zenith band | Copy field |
| --- | --- | --- |
| Element | `::after` (as before) | `::before`, `z-index: 2` (above the plate stage) |
| Purpose | keeps the ivory header readable | backs the copy |
| Opacity | `--world-exposure` (unchanged story rule) | `--world-exposure` × `--atrium-editorial` |
| Gradient | the approved vertical gradient up to its first transparent stop | the rest of it, plus the approved second layer |

Scoped to `[data-atrium-orbit-preview]`, per layout (desktop, tablet, phone,
short landscape). The cuts are at transparent stops, so with both parts
whole every pixel equals the approved shade.

`--atrium-editorial` is the one value the controller writes per frame
(`atriumEditorial`, pure). It also carries the copy, the CTA, the room
labels and the indicator, so none shows without the others:

- Arrival: 0. Architecture only, at full exposure.
- Arrival → Living: 0 until the UI switch, then eased to 1 over the rest of that move. Reduced motion has no move, so a plain change.
- Rooms and room-to-room moves: 1 (the title still changes by a cut).
- Release: eased to 0.

The editorial UI takes focus from half its opacity
(`editorialInteractiveAt`); below that the copy, the indicator and the room
labels are `inert`.

**B. Release to the Footer.** `roomOrbitProgress` reaches 1 exactly where
the sticky stage starts to leave. Until now the final Kitchen state rode the
stage out, so the headline slid under the persistent header, and stayed
there at the end of the page. The release is the last segment of the
timeline (`kind: 'release'`), not a state:

| Share of the release | What happens |
| --- | --- |
| 0 → 0.5 (`editorialOut`) | the copy, CTA, room labels, indicator, baseline and the copy field leave |
| 0.3 → 0.75 (`gatewayOut`) | the World gateway settles out; inert from half its opacity |
| 0.75 → 1 | the quiet architectural frame, held while still sticky |

`atriumRelease(sample)` is pure: no timer, autoplay or RAF. Reverse
scrolling rebuilds Footer → quiet frame → Gateway → Kitchen. The timeline
stays the only writer of the gateway and the baseline; the controller
returns `gateway` and `baseline`. `data-atrium-release` (`leaving` /
`quiet`) names the phase on `.hc-worlds`.

Known and left as it is: while the stage leaves, the persistent header keeps
its ivory ink until the stage has passed it (the approved header rule). Over
the unshaded floor of the quiet frame that ink has less contrast than over
the old shaded field.

**C. Readout.** See *Development diagnostics* above and §1.

**Browser QA** (a production build with the preview flag, Chromium, real
compositor frames): 1440×900, 768×1024 and 390×844, forward and reverse,
normal and reduced motion, plus 844×390. With the flag off, frames of the
deployed build and of this one are identical.

### 15.2 PASS 6B.0 — the orbit on comp plates

The owner supplied four design comps, one per room (1672 × 941, the approved
Atrium plate's own size), and asked for the orbit: from the wide Atrium,
scrolling focuses each doorway in turn, and the views feel as if the camera
travels around the Atrium. This is a first, provisional orbit. The studio
contract (§16, §17) is unchanged: no studio plate is claimed, camera data
stays `null`, and the comps are replaced view by view once studio plates
are accepted (the handoff's rule against AI plates is about those).

**Comp plates.** A comp carries the whole screen UI. The site draws that UI
in HTML, so it is cut out of the picture: wordmark, navigation, title block,
CTA, indicator and baselines. What belongs to the scene stays: the fascia
labels over the doorways and the breeze line.

| | |
| --- | --- |
| Status | `ATRIUM_ORBIT_PLATES[view].desktop = 'comp'` (not `'available'`); no portrait view |
| Files | `public/images/home-chapters/world-atrium-<room>[-1280\|-720].webp` (1672 wide without a suffix), as the approved Atrium plate; `world-atrium-<room>-preview.webp` (192 px, the room's doorway) for the indicator |
| Arrival | the approved Atrium's own files (`worlds-atrium*.webp`), drawn as a plate only while the camera leaves it |
| Sources | outside Git: `work/atrium-orbit/comp-plates/` (`source/` the comps, `clean/` the cut-out PNGs, `clean.py` the OpenCV script that makes them; since §15.7 also `stitch.mjs` and `stitched/`, the plates made to agree, which are what the runtime files are encoded from) |
| Readout | still reports "production plate missing (comp plate shown)" for every view |

**A plate is a box.** Every plate is a box of the plate's ratio that covers
the stage (the stage's height, at least its width), like the approved
Atrium's cover crop. The controller poses it in shares of that box, so a
move is the same share of the picture on every screen. A stage narrower
than the plate is a window onto it (`plateWindow`): rooms centre their
doorway (`ATRIUM_ORBIT_FOCUS`), Arrival repeats the approved crop.

**Shots** (`ATRIUM_ORBIT_SHOTS`, one per transition, measured on the comps
and PROVISIONAL like them):

| Move | Shot | How it is drawn |
| --- | --- | --- |
| Arrival → Living | `push` | The wide plate grows at a steady rate about the Living doorway (to 3.75×, the size that doorway has in the Living view) while the doorway travels to where the Living view holds it. The Living plate lies whole beneath and takes over as the wide plate dissolves (0.66 → 0.98 of the move). |
| Living → Bedroom, Bedroom → Bathroom, Bathroom → Kitchen | `pan` | Both plates travel left as one strip, `shift` apart (0.461, 0.415, 0.39 of a plate), which is how far the scene moves between the two views. The incoming plate lies on top and begins at a soft edge that rests on the stone pier between the two doorways: the one surface both views show alike, so the join is not seen. |

The join (`ATRIUM_ORBIT_SEAM`) comes in from the stage's leading edge, rests
on the pier for the middle of the move and leaves by the other edge. It is
soft (±0.045 of a plate) only where both plates exist and a line again at
either end, so the stage is covered by the two plates alone at every
position. While it crosses a doorway on its way to or from the pier, that
doorway's fascia label can show twice for a moment (two views of it): the
comps are separate pictures, not one scene. Studio plates from one camera
rig remove that.

Both shots were matched later: the push on the doorway (§15.5), the pans
first by fitting one plate to the other under the join (§15.6), then by
making the plates themselves agree (§15.7, which is what runs). The numbers
in this section are PASS 6B.0's.

`orbitTransition` is pure: the same position draws the same frame in either
direction (`over` and `lead` come from the frame, never from the travel
direction). Reduced motion keeps `plainChange`: one plate, then the next,
each at rest. The approved Atrium, its camera and its backdrop are never
written; a resting Arrival is that photograph itself.

**UI.** As in the comps: the CTA leads with a short rule; the indicator
sets the counter over the room name beside a thumbnail of the room's own
doorway. On the desktop layout the HTML room labels are dropped while
plates are drawn (they are placed for the wide Atrium; each plate carries
its own fascia labels in perspective); the grouped lists of the tablet and
phone layouts stay. The right baseline reads REAL SPACES, REAL PERSPECTIVE.
as in the comps (owner decision; it replaced SPACES SHAPED BY A NEW BREEZE).
That element is shared markup (`worlds-chapter.tsx`), so the production
Scene 3 reads the same, next to the copy block's own signoff REAL SPACES.
REAL PERSPECTIVE.

**Known limits.** Comps are 1672 px wide: soft on large or dense screens,
and softer still in the push (the wide plate is enlarged up to 3.75×). The
cut-outs are OpenCV inpainting, good under the HTML that covers them and
visible on close inspection where a letter crossed a hard edge (the ceiling
beam under the wordmark). On phones the copy shade covers most of the
doorway, as it covers the wide Atrium today.

### 15.3 PASS 6B.1 — the picture no longer snaps

The owner reported the picture flashing once as the pull-back from the
oculus reaches the full Atrium. Measured on device-resolution compositor
frames (1680×887, DPR 2), as the fine detail of the picture per frame:

| Where | Before | After |
| --- | --- | --- |
| The pull-back ends (approved bridge) | 440 → 699 in one frame (+59%) | rises smoothly; largest step 4% |
| The push from the wide Atrium begins / ends | 699 → 517 (−26%) / 559 → 640 (+14%) | largest step 4% |
| A pan begins | 679 → 607 (−11%) | largest step 2% |

One cause in all three: an element promoted to its own texture (a 3D
transform, or `will-change`) is resampled by the compositor as it moves and
is softer than the same picture drawn directly, so the picture changes
sharpness in the frame the promotion begins or ends.

- The bridge's camera (`home-story-timeline.ts`) writes its pose in 2D and is never promoted. The pose is PASS 15's, number for number (`check:atrium-orbit` compares it). The portal orbit's breath kept its 3D pose in this pass; STEP 1 made it flat as well (`TANPHONG_HOME_MOTION_CONTEXT.md` §40).
- Plates never set `will-change` (`atrium-orbit-controller.ts`).

Frame pacing is unchanged (60 fps cadence at DPR 2, also with the CPU slowed
four times, and on a DPR 3 phone viewport). The change is in the approved
bridge, so the normal homepage gets it too: the photograph is sharper while
the camera pulls back and identical at rest.

### 15.4 STEP 2B — the room orbit is the homepage's orbit

Owner decision, 2026-10-08, on seeing both: the homepage's orbit is this
one (the camera travels to each room's doorway), as recorded in
`outputs/atrium-orbit-qa/pass-6b0/orbit-desktop-1440x900.mp4`, not the small
portals circling the Atrium. It runs on the comp plates of §15.2. The final
visual orbit still waits for the studio plates, which replace the comps view
by view through the manifest's status alone.

- **Gate.** `home-story-timeline.ts` loads the controller at every URL except `?atriumOrbit=0`. No build flag (`VITE_ATRIUM_ORBIT_PREVIEW` is gone). It is still one dynamic import: its own chunk (8.6 kB gzipped) and stylesheet.
- **Fallback.** `?atriumOrbit=0`, or a failed load, leaves the approved Scene 3 with the portal orbit. While the chunk is on its way the settled Atrium simply holds, so the portal orbit never shows first and then gives way. A position restored inside the Atrium is revealed only once the load has settled.
- **Span.** 380svh with motion, 160svh under reduced motion, declared in `home-story.css` with the story's other distances. The page has its final height before the chunk arrives (measured: 1020 / 940 / 860svh at the first read and after load). The orbit stylesheet no longer sets it.
- **Reduced motion** now has the four rooms too, as plain changes over 160svh (it had no orbit span before).
- **Arrival plate.** It is a second drawing of the approved Atrium, shown in its place from the frame the camera leaves it, so it now picks its file by the approved backdrop's own rule (the 1280 file up to 1199px, the full plate above) instead of a density `srcset`. Before, phones and tablets could draw the 1672 file over a 1280 backdrop and step in sharpness as the push began.
- **Readout.** `?atriumOrbitDebug=1` (and development `?storyDebug=1`), as before.
- **Timing** is the clip's: §15.2, unchanged.

Verified on a build without any flag at 1440×900, 1280×720, 820×1180 and 390×844: mode `plates`, Arrival file equal to the backdrop's, Back into the Bathroom hold restores that frame with the portal orbit never visible, the fallback URL shows the portal orbit, reduced motion steps through the four rooms. No sharpness step above 4% (desktop) / 1.2% (phone) between like frames through the push and the first pan.

### 15.5 The push is matched on the Living doorway

Owner report, 2026-10-08, with three frames of a screen recording: from the
wide Atrium to Living the two pictures did not agree on the doorway, so the
dissolve showed two doorways, displaced.

**Cause.** The push grew the wide plate 3.75× about the doorway and then
dissolved the whole frame over the Living view. Neither number was the
doorway's: measured on the pictures (px of 1672 × 941), its opening is
221 × 262 in the wide Atrium, where it is seen at an angle, and 520 × 422 in
the Living view, where it is seen square on. And the wide picture ends just
left of that doorway, so on a wide stage it could not be brought to the
middle, where the Living view holds it.

**Now** (`atrium-orbit-transition.ts`, `push`):

- The wide plate grows until the opening is exactly the size it has in the Living view: 2.35× across and 1.61× down. It widens more than it grows, as a doorway does when the camera turns to face it. Still a flat 2D scale; no skew, rotation or perspective.
- While it grows it stays over the whole stage. The rest of the way to the middle is travelled by both plates together, as one picture joined on the doorway (the turn). What the turn uncovers beside the wide plate is the Living view itself, joined softly on the pier the two pictures share.
- The Living view lies on top and shows only through a mask. It first resolves inside the doorway, in place, then opens outward until it is the whole frame. It never lies over the wide plate as a second, displaced picture.
- The opening begins only once the two doorways are the same size. From then on they coincide exactly, jamb on jamb, lintel on lintel, floor on floor (`check:atrium-orbit-foundation` asserts it to 1e-9 on nine viewports, with full coverage of the stage and no jump at any point).
- Phones and portrait tablets need no turn: their window is narrow enough for the wide plate to bring the doorway to its place alone.

**Measured** (production-equivalent build): no sharpness step above 2.1% (1680×887, DPR 2) or 4.2% (390×844, DPR 3) between like frames through the push; 60 fps cadence, also with the CPU slowed four times.

**Limits.** The two pictures are different renders: the furniture inside the doorway differs, and the wide view's lintel slopes more than the Living view's. The match is the doorway's opening, not its contents. The three pans are unchanged.

### 15.6 The pans are fitted under the join

**Replaced by §15.7 (2026-10-09).** The fit below made the doorways coincide
under the join, but only by moving the two plates against each other all the
way through a pan. Kept as the record of what was tried and why it failed.

Owner report, 2026-10-08, with four frames: between two rooms the doorways
did not agree either, "one high, one low", and a label showed twice.

**Cause.** The plates are separate drawings of one room. Measured on the
pictures (px of 1672 × 941), the same piece stands at another place in the
two plates of a pan: a doorway's name or number up to 90 px apart across and
up to 41 px apart down, the lintel at the shared pier 13 to 30 px apart down.
A label is also drawn at another size (up to 1.45×) and slant in each. The
pan placed the incoming plate at one distance for the whole move and never
moved it down the picture, so everything the join passed over stepped.

**Now** (`atrium-orbit-transition.ts`, `pan`, `ATRIUM_ORBIT_SHOTS[1..3].ties`):

- Each pan has five ties, in the order the join passes them: the next doorway's name and its number, the pier between the two doorways, the name and the number of the doorway being left. A tie says how the incoming plate lies on the outgoing one for that piece to coincide: how far right (`shift`) and, from two heights of the piece (`high`, `low`), how far down and how much taller.
- Wherever the join is, the two plates are fitted to each other at that spot, with the fit changing smoothly from tie to tie. The piece under the join is drawn once: one place, one height.
- The fit is whole from the first sliver of the incoming plate to the last sliver of the outgoing one. The plate that fills the stage starts (or ends) exactly at rest; the sliver carries the whole fit; through the middle each carries half.
- Across, each plate keeps its own even travel at its own end of the move, so the plate filling the stage is the one moving evenly.
- A plate moved or stretched no longer reaches the stage's top or bottom, so both share a small zoom about the stage's centre: up to 5% on a desktop stage, 6.4% at 2560 × 1080. Down the picture a plate is stretched by 8.5% at most. Still a flat 2D pose; no skew, rotation or perspective.
- The plate on top carries the join: the incoming one for the first half, the outgoing one for the second. With the same join between them the change of order draws the same picture. It is there so that where a sliver stops short of the top or bottom, the other plate shows beneath it.
- The join is narrower, ±0.025 of a plate (was ±0.045): the drawings agree on the join and less and less away from it. It is never wider than its distance from the stage's nearer side, so a plate comes and goes as a soft sliver.

**Measured.** At 1680 × 887, at the moment the join is on each of the 15 tied
pieces: up to 90 px apart across and up to 41 px down before, 0 px after
(`check:atrium-orbit-foundation` asserts under 3 px on nine viewports, under
0.5 px at the pier, and under 0.5 px from the first sliver to the last).
Production-equivalent build, through the three pans: no sharpness step between
like frames (1680 × 887 and 390 × 844, DPR 2), no pop where the order
changes, frames 16.7 ms apart at the median and 17.7 ms at the 95th
percentile (18.4 ms with the CPU slowed four times).

**Limits.**

- While the join is on a label (about a tenth of the move, at each end) the two drawings of that label are blended. They now stand at one place and one height, but their letters differ in size and slant, so the word can look soft for that moment.
- What lies inside a doorway, and the rock and tree in front of the wall between Bedroom and Bathroom, are drawn differently in each plate; the join passes over them as a soft change.
- On a stage as wide as the plate (16:9 and wider), a sliver alone holds the stage's very side and can stop short of the top or bottom: a corner of about 14 × 30 px at most at 2560 × 1080, for a moment, where the approved Atrium behind shows.

Plates rendered from one camera rig remove all three.

### 15.7 The pans are one picture travelling

Owner report, 2026-10-09, with a screen recording: moving to another room
"keeps going sideways, very uncomfortable"; asked for another way to change
room that makes sense and still keeps the doorways matched.

**What the recording showed** (tracked frame by frame, left and right part of
the picture apart, at 60 frames a second):

| | In the recording (§15.6) | Now |
| --- | --- | --- |
| Left and right part of the picture | up to 18 px a frame apart in speed; the right part crept 6 px a frame for 11 frames while the left stood still | the same speed on every frame |
| Up and down | jolts of 6 to 8 px a frame as a pan began | none |
| Size | zoomed in 5% and back, not evenly | none |
| Fastest | 58 px a frame from one flick of the wheel | 10 to 30 px a frame from the same kind of flick |
| Coming to rest | a steady creep, then a dead stop | slower and slower to nothing |

**Cause.** §15.6 matched the doorways by fitting one plate to the other
wherever the join was. The plates are separate drawings, so that fit is
different at every place (five ties a pan, up to 90 px apart), and following
it moved the plates against each other: the awkward sideways slide. It also
could never be exact: the same doorway is drawn with another fascia height,
slant and label in each plate, which no shift or stretch of a whole plate
undoes. Separately, the stage trailed the hand as closely in a pan as
anywhere else, although the picture crosses the stage about two px for each
px of scroll there.

**Now.**

- **The plates agree** (`work/atrium-orbit/comp-plates/stitch.mjs`, outside Git, writes the runtime files). Where a plate shows the doorway beside its own in the clear, that doorway is now the neighbour's own drawing of it, moved across by the pan's shift: the fascia with its label and the opening down to the sill. The host keeps its own ceiling, pier and floor. Living carries the Bedroom doorway, Bedroom the Living doorway, Bathroom the Kitchen doorway. On those doorways the two plates of a pan are the same pixels (difference 0 in the masters, about 2 of 255 in the WebP files; 36 to 45 before).
- **Where a planter stands in front of the neighbouring doorway** (Bedroom's right, Bathroom's left, Kitchen's left) it cannot be the neighbour's drawing. Only its label is taken out there, so a label is never seen twice. Those three plates no longer show that neighbour's name behind the tree.
- **A pan is one picture travelling** (`atrium-orbit-transition.ts`, `pan`). Both plates move together, `shift` apart (772, 690 and 654 px of the 1672-wide picture), and never against each other. Nothing is fitted, stretched or zoomed, and the plate order never changes. The join enters, rests on the pier and leaves as before, and is soft (0.035 of a plate) only where the stage shows both plates.
- **The picture is paced evenly** through a pan (`editorial` instead of the steeper `travel`): no rush through the middle.
- **The stage trails the hand by more in a pan** (`MOTION.follow.travel`: 0.42 s with a pointer, 0.26 s on touch, against 0.15 s and 0.07 s elsewhere), like a camera with mass, and its tail closes slowly and near enough to end unseen. The controller says where a pan is (`travelling`); everywhere else the follow is the journey's own.

**Verified** (production-equivalent build). `check:atrium-orbit-foundation`
asserts on nine viewports that the two plates stay exactly `shift` apart,
are never scaled or moved down, only travel one way, and cover the stage at
every position; and that the plate files agree on the three grafted
doorways and carry no label on the three planter sides. `check:atrium-orbit`
asserts the slower trailing inside a pan and the journey's own outside it.
Real frames of a wheel flick through Living → Bedroom at 1680 × 887: both
parts of the picture move the same distance on every frame, nothing moves up
or down. No sharpness step between like frames and no flash through the
three pans (390 × 844 at device resolution); frames 16.7 ms apart at the
median, 17.8 to 18.2 ms at the 95th percentile, 18.9 ms with the CPU slowed
four times.

**Limits.**

- A pan rested wherever the hand stopped, also halfway between two rooms. Living → Bedroom is one coherent picture at every such place. In Bedroom → Bathroom and Bathroom → Kitchen a planter stands on the other side of the pier in the next plate, so partway through, the join passes over it and shows part of a rock or a tree fading. (§15.8: the page no longer rests there. Those frames are now only seen in motion, or under a finger that holds the page.)
- The ceiling beam above a doorway and the floor below its sill are still each plate's own, so the join is a soft change there while it crosses them.
- The room pictures changed at rest on wide screens: the neighbouring doorway at the edge is now drawn as in its own room (larger, with its own label), and the three labels behind planters are gone.

Plates rendered from one camera rig would make the last two unnecessary.

### 15.8 A room change is carried through

Owner decision, 2026-10-09 (asked after §15.7, answered "I agree"): when the
hand stops between two rooms, the page carries on to the next room by
itself, so the camera never rests halfway.

**What it does.** Once the hand has rested inside a pan for 110 ms, the page
itself is scrolled on, eased, to the room it was heading for: the next room
when scrolling down, the previous one when scrolling up, the nearer one when
that is not known. It is taken to the middle of that room's stretch, so the
next room is as far away going on as the last one is going back. The stage
follows that scroll as it follows any scroll (§15.7), so the camera glides
to the room and stops there.

**What it never does.**

- It never holds the hand back, slows it or prevents anything: there is no wheel listener and no `preventDefault`. The moment the hand moves the page again, the carry is over and the page is the hand's.
- It never moves the page under a finger: while one rests on the glass nothing starts, and one landing during a carry stops it (three passive touch listeners in the timeline only tell it so).
- It does not act in a room, in the push from the wide Atrium (still scrubbed), in the release, under reduced motion, or on the fallback URL (`?atriumOrbit=0`).
- A hand that slips up to 12 px past a room's edge is only put back on that edge.

**Where it lives.**

| | |
| --- | --- |
| The decision | `carryOrbit` in `atrium-orbit-progress.ts`: a pure step from the state it is given, where the page is and whether a finger holds it, to what to write this frame |
| The one write | `atrium-orbit-controller.ts`, `carry`: `window.scrollTo({ top, behavior: 'instant' })`, whole px |
| The facts | `home-story-timeline.ts` hands the controller the page position, the time and the finger on every frame, and keeps frames coming while it asks. The timeline itself never writes the position |
| The setting | `MOTION.carry` in `home-motion.ts`: `rest` 110 ms, `edge` 12 px, `duration` 520 ms + 1.5 ms per px, at most 1300 ms |

This is the one exception to "native scroll is never corrected" (STEP 1). The
source rules say so exactly: one `scrollTo` in the orbit modules, none in the
timeline, no wheel listener, nothing prevented.

**Verified** (production-equivalent build, 1680 × 887 unless said).

- Flicks of four wheel notches from Living: the page rests on Bedroom, Bathroom, Kitchen in turn, one plate drawn each time; flicks back rest on Bathroom, Bedroom, Living.
- One flick, real frames: the picture moves for 1.1 s, 18 px a frame at its fastest (58 in the owner's recording), both parts of it the same on every frame, never back, nothing up or down.
- A wheel the other way during a carry takes the page back at once; it then rests on the room behind.
- Touch (390 × 844 and 820 × 1180): the page does not move under a resting finger for 1.5 s; when it lifts, the page goes on to the room; a flick lands on the room its momentum reached.
- Reduced motion and the fallback URL: the scroll position is never written.
- Frames 16.7 ms apart at the median, 17.5 ms at the 95th percentile (17.9 ms on a phone with the CPU slowed four times); no flash, no sharpness step.
- `check:atrium-orbit-foundation` drives the decision frame by frame on three page sizes (rest, direction, the nearer room, a slip, the hand taking the page back, a finger) and the controller's write; `check:atrium-orbit` asserts what the timeline hands over and that it never writes.

**Limits.**

- Scrolling inside a room's stretch still shows nothing new (as before); the next room starts after about half that stretch from where the carry leaves the page.
- A page restored in the middle of a pan (left mid-glide, then Back) is shown there for a moment and then carried to the nearer room.
- The carry cannot tell fingers resting on a trackpad from a hand that has let go: it starts after 110 ms without movement, and gives way as soon as they move.

### 15.9 The rooms stand behind closed doors

Owner request, 2026-10-09, with three frames of the live site: the four
doors of the Atrium are shut, in the wide view and while scrolling from room
to room, and choosing a door opens it and enters that room, with the whole
change made as one move.

**Corrected the same evening.** The first version (`a4f7cb2`, live for about
an hour) read "the doors come down when the Atrium appears" as a move: the
rooms were open while the camera pulled back out of the oculus, and the
doors fell one after another over story 0.855 to 0.940. The owner, with a
recording of it: the doors must be shut from the very first sight of the
Atrium, and open only when one is chosen. The fall is gone.

**What it does.**

- **The doors are shut wherever the Atrium shows**: from the first frame in which the camera, pulling back out of the oculus, brings a doorway into view, at rest in the wide Atrium, and through the whole orbit (the push onto Living, the four rooms, the three pans, the release). Nothing a scroll does opens one, forward or back. Reduced motion is the same.
- **Choosing a door enters its room.** The leaf rises into its lintel (0.9 s), the camera pushes through the doorway (1.24 s, setting off 0.16 s after the leaf), the last 0.46 s of the push goes to light, and the room's page opens under that light and comes out of it (0.52 s). About 1.4 s from the choice to the room's page.
- **Every way to a room goes through its door**: the door itself (any door on the stage, also the neighbouring one at the edge and all four in the wide Atrium), EXPLORE THIS ROOM, and a room label of the tablet and phone layouts. A label whose door is not on the stage (Kitchen while Living is shown) is entered under a short flat cover.
- **The route is the room link's own.** Nothing new is linked: the entry ends by following the rendered room link (`worldsChapterOptions`), as the router does.

**A door is drawn, not rendered.** No closed-door picture of the Atrium
exists, and a studio render is still the plan (§16, §17). Until then a leaf
is drawn into each doorway of each comp plate
(`work/atrium-orbit/comp-plates/doors.mjs`, outside Git, writes the runtime
files):

- A screen of 28 vertical walnut battens, the material of the fluted jambs beside it. It takes its colour from the fascia above it in the same plate, its light from that fascia's own light, a lintel shadow at the head, the floor's glow at the foot, and the Atrium's dappled sun as on the piers.
- It is drawn into the doorway's own outline, so it lies in the picture's perspective: the lintel edge traced on each plate, the sill, the two jambs.
- What stands in front of a doorway stays in front: the bush before the wide Atrium's Living doorway, the leaves at its Bathroom and Kitchen doorways.
- Where a room view shows the doorway beside its own, that leaf is the neighbour's own leaf, the pan's shift across, as the doorway itself is (§15.7): the two plates of a pan show the same pixels on it.
- The wide Atrium's Living battens are counted across the opening the push matches (§15.5), so each lies on the Living view's own batten as the camera arrives.

**How it is laid on the plates.** A plate is now a box that holds two
pictures: the plate, and over it the leaves of that view, one transparent
picture the plate's own size and from the plate's own choice of file
(`world-atrium-<room>-doors[-1280|-720].webp`, `worlds-atrium-doors[-1280].webp`;
4 to 13 kB each). The box takes the pose and the join, so a plate that comes
in softly comes in with its doors shut. (Two pictures joined one after the
other let the open room show through the join: measured as a ghost of the
room inside the push's opening, which is why the box exists.) The leaves
show through one outline (`clip-path`), and a leaf opens by raising that
outline's lower edge: because the battens are vertical, that is exactly a
screen sliding up into the lintel, and what stands in front of it stays
where it is. The wide Atrium at rest is still the approved photograph with
no plate over it; only its doors are drawn there, where the plate would lie.

**Where it lives.**

| | |
| --- | --- |
| The outlines, the clip | `atrium-orbit-doors.ts`: pure, px of the 1672 × 941 plate, PROVISIONAL like the comps |
| The door pictures' names | `atrium-orbit-manifest.ts`, `plateDoorSources` (the plate's naming with `-doors`) |
| Laying them on the plates | `atrium-orbit-controller.ts`: one more picture in each plate's box, with the one outline of every door shut |
| Entering | `room-door-entry.ts`: one click listener on the Atrium, the Web Animations it starts, a fixed cover above the header |
| The numbers | `ROOM_ENTRY` (the entry) |

**What the entry never does.** It takes only a plain primary activation:
modifier and middle clicks, and a page without JavaScript, keep the link.
It never touches the wheel, a touch or the Atrium's scroll position (the one
position it writes is the room's page, put at its top under the cover). It
never moves the approved photograph or its camera: what the push moves is
the room orbit's own stage, and from the wide Atrium that plate is brought
onto the stage for it, lying exactly on the photograph. While it plays, the
controller stands still (no frame is repainted, no carry runs), and takes
the picture back if the room is not entered: the document leaving, Back, a
page restored from the back-forward cache. A route that never comes is
opened as a document after 2.6 s. Under reduced motion there is no door and
no camera: a 220 ms flat cover, then the room.

**The copy lets the door through.** The copy and the indicator lie over the
doorway (on a phone, over most of it). They take no pointer themselves, so
the door under them can be chosen through them; EXPLORE THIS ROOM keeps its
own.

**Verified** (production-equivalent build, headless Chromium).

- 1440 × 900, 820 × 1180 and 390 × 844: the four doors shut at the wide Atrium, each room view with its doors shut, the door picture always the plate's own choice of file.
- The way in at 1440 × 900: resting frames from the sky to the settled Atrium show every doorway shut as it comes into view; 84 samples taken in flight through the pull-back from wheel flicks never found the Atrium visible without its doors drawn; a cold load taken straight into the pull-back has them in the first frame the Atrium shows.
- Entering by the Living door, the neighbouring Bedroom door at the stage's edge, the Bedroom, Bathroom and Kitchen doors of the wide Atrium, EXPLORE THIS ROOM, a tap on the door through the title on a phone, and the two kinds of room label: each ends on the room's page, at its top, with no cover left, in about 1.4 to 1.6 s.
- Back from the room: the Atrium at the position it was left, that room's door shut, the stage unmoved, no cover.
- A Meta click on EXPLORE THIS ROOM opens the room in a new tab and leaves the Atrium as it is. A second choice during an entry changes nothing.
- Reduced motion: doors shut, the room 0.34 s after the choice, no door or stage animation.
- Frame pacing from wheel flicks at 1440 × 900, DPR 2. Through the pull-back, where the doors are now drawn all the way: 16.7 ms at the median and 17.4 ms at the 95th percentile over three runs (17.6 ms on the deployed first version, which drew no door there; the same two figures at 390 × 844, DPR 3). Through the three pans: 16.7 ms and 17.9 to 18.5 ms, as without doors. The push is 33 ms at the 95th percentile with and without them.
- `check:atrium-doors` and `check:atrium-orbit-foundation` as in §12. Deliberate breakages were each caught: 24 of the outlines, the clip, the controller and the entry on the first version, and 6 of the always-shut rule after the fall was removed (a leaf raised by the scroll position, doors not drawn on the way in, none on the photograph at rest, the entry raising every leaf or starting from a half-open one, a door with no number counting as open).

**Limits.**

- The doors are drawn by a script on flat pictures. They were judged on screen, not against a render; plates and doors from one camera rig replace them.
- In the Kitchen view, the doorway glimpsed through the planter on the left stays open. A leaf cannot be put behind that tree on a flat picture without cutting the tree out of it, and two attempts left a rim of light around every twig.
- The floor still carries the light that fell through the open doorways, and the breeze line still starts at each doorway: it now runs out from the edge of the leaf.
- The thumbnail in the indicator still shows the room through its open doorway.
- Before the Atrium becomes interactive (the base story's own gate, story 0.895) a door cannot be chosen, though the doorways are in view and shut from about 0.77 on. At 1440 × 900 the camera comes to rest (0.88) 64 px of scroll before that gate, and has been moving slowly (from 0.85) for about 250 px before it.
- Not measured: Safari, Firefox, a real phone or tablet. The pictures are drawn at the comp plates' size (1672 px wide), so a leaf is as soft as its plate when the camera closes in.
- No hover response on a door beyond the pointer cursor.

### 15.10 The Kitchen view ends on the Living view's planter

Owner request, 2026-10-10, with four frames of the live site: the Living
view and its left end (the olive tree and the rock, "very OK"); the Kitchen
view, which "has the Living room at its end", and that end close up (the
Living doorway again, beside a bare pier). Asked that this space be the tree
as in the Living view, so that the two agree.

**How it was read.** The request can be read two ways. Built: the right end
of the Kitchen view is the tree, in place of the Living doorway that stood
there. The other reading keeps that doorway in view beside the tree; with
the tree standing where the Living plate has it, the doorway is behind it
either way.

**What changed: one picture.** The Kitchen plate's right end
(`work/atrium-orbit/comp-plates/stitch.mjs`, `planter`; outside Git, writes
the runtime files). No runtime code moves anything differently.

- The Kitchen plate's right end is the Living plate's left end, mirrored: column x of the Kitchen plate is column 1820 − x of the Living plate. That lays the pier left of the Living doorway (375 to 557) on the pier right of the Kitchen doorway (1263 to 1445); they are the same width.
- **Beyond the pier the Kitchen plate is the Living plate**: its fluted jamb, the wall behind the tree, the tree, the rock, the rim. The plate's own drawing of the Living doorway, and its "01 Living" label, are gone from there.
- **The pier stays the Kitchen plate's own**, with its own light. The Living plate's sprays of leaves are keyed off their stone (they are dark and olive, the stone is lit) and laid over it, each leaf with the stone behind it taken out.
- **The bed right of the rock** (shrubs, pebbles, the rim and its end) is drawn at half its width, so the planter ends at about x = 1218: clear of the Kitchen doorway, of its jamb and of the floor that leads to it. At full width it would have reached x = 1012, across the pool's edge.
- **Nothing left of column 1218 changed** in the lossless master: the Kitchen doorway, its label, its jamb and the floor before it are pixel for pixel what they were. (The WebP files differ slightly everywhere, as an encoder's do when part of a picture changes.)
- **The Kitchen view shows one door.** `ATRIUM_ORBIT_DOORS.kitchen` no longer lists a Living leaf, and the view's door picture is redrawn without it. Nothing on the planter can be chosen.

**Why mirrored.** Left to right the Living plate's end reads wall, jamb,
pier, doorway; the Kitchen plate's end reads pier, jamb, doorway. Mirrored,
the two have the same order, so the pier lies on the pier and the tree leans
in from the frame's edge, as it does in the Living view. The rock is then lit
from the left, like the vase in the Kitchen plate.

**Verified** (production-equivalent build, headless Chromium).

- 1680 × 887 at DPR 2 (the owner's screen): the Kitchen hold with its copy, the late hold with the gateway, and the quiet frame of the release. The indicator and the gateway sit on the rock's shaded foot and the rim, and read as before.
- 1440 × 900 and 2560 × 1080: the same end; 820 × 1180: the sprays and the planter's end at the stage's right edge; 390 × 844: unchanged (the window does not reach the plate's end).
- The pan from the Bathroom, frames in flight from a wheel flick: the planter comes on with the Kitchen plate, as one picture.
- Clicks on the tree, the rock and the leaves over the pier do nothing; the Kitchen door still enters `/spaces/kitchen` (1.66 s).
- `check:atrium-orbit-foundation`: beyond the pier the two plate files are one picture, mirrored (2.0 of 255 apart; 41 before), no label ink is left behind the tree, and the pier is not the Living plate's (46 apart). `check:atrium-doors`: the Kitchen view shows one door, and four places on the planter are no door.

**Limits.**

- It is one tree drawn twice: the Living view's left end and the Kitchen view's right end are the same picture, mirrored. The two are never on the stage together (no pan joins Kitchen to Living).
- The Kitchen view no longer shows that Living lies beyond it.
- The bed's shrubs are half as wide as in the Living view. Judged on screen at the sizes above, not measured.
- The planter covers the lower right of the floor, and with it the last sweep of the breeze line, which now runs behind it.
- The leaf shadows that the tree casts on the Living plate's pier are not carried over: the Kitchen pier keeps its own light.
- On desktop the story rail's two inactive labels (01 ARRIVAL, 02 PERSPECTIVE, drawn at 30%) now lie on the rock's lit face and are hard to read there, as they already are over the tree in the Bedroom view. "03 WORLDS" reads.
- Not seen: Safari, Firefox, a real phone or tablet.

### 15.11 The oculus's sky is alive

Owner request, 2026-10-10, with two frames of the live site (the wide
Atrium, and its oculus close up): the clouds in the oculus are a still;
make them a Three.js sky whose clouds are always moving, so that it looks
real and has depth.

**What it does.** Over the wide Atrium the clouds in the oculus drift and
re-form, all the time, behind the branches, the dome's ribs and the rim. It
is the same sky wherever that view shows: in the sky hold and the pull-back
of the base journey (which begin inside the oculus), at rest on the wide
Atrium, and through the push onto Living until the Living view has taken
the frame. The room views show no sky and have none.

**How it is built: three layers in the wide Atrium's box.**

| Layer (bottom to top) | What |
| --- | --- |
| The plate | As before: the approved photograph at rest, its second drawing while it travels. Its painted sky is still in it, underneath. |
| The doors | As before (§15.9). |
| The sky | A canvas over the plate's sky: 760 × 228 px of the 1672 × 941 plate, at its top. One Three.js quad with one shader; no texture, model, light or render target. |
| The foreground | What crosses the sky on the plate, cut out of the plate: the two crowns of leaves, the ribs, the rail, the ring. A small picture (792 × 249) laid over the canvas, so the clouds pass behind the leaves. |

**The clouds** (`oculus-sky-shaders.ts`). The canvas is looked through as
the opening is: a camera pitched up 40°, the canvas's height a few degrees
of sky. The clouds lie on two level sheets above it, so a cloud is smaller
and slower low in the opening and larger and quicker high in it; the far
sheet is thin and slow and the near one, the cumulus, passes under it
nearly twice as fast on screen. That is the depth. A cloud is a broad mass
heaped into rounded tops and frayed at its edge, each part drifting and
changing at its own rate, so it keeps re-forming as it passes and nothing
ever loops. It is lit from the upper left, as the plate is, with its far
side and its heart in its own shade. The four colours are the plate's own
sky, measured in the opening.

**The foreground picture** (`work/atrium-orbit/comp-plates/oculus.mjs`,
outside Git, writes `worlds-atrium-oculus[-1280].webp`, 61 and 55 kB).
Inside the opening's outline a pixel is sky by its colour (sky and cloud are
cool or white and bright; leaves, bronze and stone are warm). A pixel that
is part sky, a leaf's edge, keeps only its own share, with the old sky taken
out of its colour, so no rim of the painted sky is left around a leaf. What
is sky is read on the lossless master; the picture's colours are the served
plate's own, so that laid over the plate it is the plate. It is whole over
the canvas and 6 px more and then fades to nothing over 10 px: two
encodings of one plate still differ by a shade, and a hard end showed as a
line around the box.

**Who draws the frames.** The sky has no clock, timer or animation frame of
its own. The story's one frame owner (`home-story-timeline.ts`) hands the
room orbit each frame's timestamp and keeps frames coming while the orbit
says its sky is on stage; the sky's time is the sum of those gaps. So it
stops by itself in a hidden tab, in a room, before the Atrium and once the
stage has left, and nothing of the story is rendered again for it. At most
30 frames of sky a second (24 on the lighter tier). This is the third
client of that frame owner, beside the atmosphere and the hero's pointer
depth, and the one place where the page is no longer at rest while the
reader is: on the wide Atrium, one small canvas is redrawn.

**Who gets it.**

| | |
| --- | --- |
| Reduced motion, Save-Data | The painted sky. Nothing is made, and Three.js is not asked for. |
| 1200 px and a fine pointer | Full: 30 frames a second, the screen's density up to 2, five octaves. |
| Narrower, or a coarse pointer | Lighter: 24 frames a second, density up to 1.5, four octaves. |
| Any | Never more than 1,000,000 px (1527 × 458 at 1680 × 887, DPR 2). |
| No hardware WebGL, a lost context, a shader that does not link, Three.js not arriving | The painted sky, for good on that visit. The canvas is removed and its context released. |

It is made ready in the reading hold (story 0.42), where nothing on the
stage moves, with the Three.js chunk the atmosphere has already asked for,
and holds one WebGL context of its own (the page's second), released when
Home unmounts. Ready before the Atrium comes into view, it is simply there;
ready only after, it comes in over the painted sky in 0.9 s.

**Why the layers are in that order.** A browser draws what lies over a
canvas apart from the rest of the page. Measured on the first arrangement
(the canvas under the doors, the foreground a picture of the whole plate):
with the camera magnified in the pull-back the door leaves were drawn a
little softer than on the deployed build (their blocks differed, the
photograph's did not), which is the kind of change that showed as a snap at
the end of the pull-back before (§15.3). So the canvas and its foreground
come last in the box, and the foreground is no larger than it must be:
nothing else lies over the canvas.

**Where it lives.**

| | |
| --- | --- |
| Where the sky is, who gets one, its look and clock | `atrium-orbit-sky.ts`: pure, px of the plate, PROVISIONAL like the comps. `ATRIUM_ORBIT_SKY.speed` is the one number for how fast the air moves; `cover` for how clear the sky is |
| The canvas | `oculus-sky.ts` (the Three.js module) and `oculus-sky-shaders.ts` |
| Placing it, and saying when it is on stage | `atrium-orbit-controller.ts` |
| The frames | `home-story-timeline.ts`: `roomOrbit.tick(now)`, `roomOrbit.wantsTime()`, and three facts in `update` (the Atrium in view, a fine pointer, Save-Data) |
| The foreground's file names | `atrium-orbit-manifest.ts`, `plateOculusSources` |

**Verified** (production-equivalent build; headless Chromium with a
hardware WebGL context, Apple M2).

- 1680 × 887 at DPR 2, 1440 × 900, 2560 × 1080, 820 × 1180 and 390 × 844: the sky on, placed on the plate's own sky, the leaves in front of it; frames two and three seconds apart show the clouds moved and changed.
- From the clouds of the crossing to the push, at rest on twelve positions: the atmosphere's clouds give way to this sky, the camera pulls back out of it, and it travels with the plate through the push.
- Frames asked for a second: 60 on the wide Atrium, 0 in a room, 0 back in Scene 1.
- Reduced motion: no sky element and no Three.js request. `?atriumOrbit=0`: none. No hardware WebGL (the default headless shell): the painted sky, no error.
- Drawn the same as before where it should be: at rest and at four camera magnifications inside the pull-back, the photograph and the doors are pixel for pixel what the deployed build draws. The foreground picture differs from the photograph under it by 0.3 to 1.9 of 255 (a second lossy encoding of the same pixels); magnified four times, the two cannot be told apart. Its fine detail is within 4% of the photograph's inside the pull-back, so nothing steps as the camera settles.
- Frame pacing at 1680 × 887, DPR 2, against the deployed build: 16.7 ms at the median and 17.5 ms at the 95th percentile at rest on the wide Atrium, through the pull-back and through the push, on both.
- `check:oculus-sky`, `check:atrium-orbit-foundation` and `check:atrium-orbit` as in §12; 22 deliberate breakages of the controller, the frame owner, the sky module, its data and its shader were each caught.

**Limits.**

- The clouds are drawn by a shader. They were judged on screen against the plate's painted clouds, not against a render; their look, their speed and how much of the sky they cover are three numbers to tune after review.
- Measured on one machine (Apple M2) in headless Chromium. Not seen: Safari, Firefox, a real phone or tablet, an older or integrated graphics card, battery use. A resting reader on the wide Atrium now has a canvas redrawn 30 times a second.
- In the base journey's sky hold and the start of the pull-back the camera is magnified up to six times, and so is this canvas: its clouds are soft there, as the photograph's were.
- Through the push the wide plate is widened more than it is heightened (§15.5), and the sky with it, as the painted one was.
- The light on the floor and the walls does not move with the clouds: the plate's leaf shadows are a still.
- The first frames of the crossing still show the atmosphere's own clouds; where they clear, this sky's clouds are others. No attempt is made to carry one into the other.
- Until the sky is ready, and wherever it is not allowed, the painted clouds show: a different sky from the living one. A sky that is ready late replaces it over 0.9 s.

## 16. Studio handoff and delivery intake (PASS 6A.9)

| Document | For | Content |
| --- | --- | --- |
| `docs/TANPHONG_ATRIUM_STUDIO_HANDOFF.md` | the external 3D studio | What to build and send, phase by phase; it summarises the asset spec and defers to it |
| `docs/TANPHONG_ATRIUM_DELIVERY_CHECKLIST.md` | our review | Intake paths, the validator's three classes, per-phase checkboxes, the four camera-pair reviews |

**Directory contract.** No folder below exists yet and none is created
ahead of a delivery.

| What | Path |
| --- | --- |
| Deliveries as received | `work/atrium-orbit/studio/{phase-1,phase-2,final}/` (`work/` is git-ignored) |
| Our review material | `work/atrium-orbit/review/` |
| Accepted camera data | `data/world-atrium-cameras.json`, wired into `ATRIUM_ORBIT_CAMERA_DATA` in PASS 6B.1 |
| Accepted masters (PNG / TIFF) | the accepted delivery in `work/atrium-orbit/studio/final/`, plus a long-term archive outside the repo; never committed, never under `public/` |
| Runtime WebP | `public/images/home-chapters/world-atrium-<view>[-portrait][-<width>].webp` (the manifest, unchanged) |

The camera file travels inside each phase folder (preliminary, updated,
final), so there is no separate camera folder. Delivery file names are the
manifest's plate names plus `world-atrium-rig-top.*` in Phase 1.

**Master storage policy (PASS 6A.95, locked).**

```
STUDIO MASTER
PNG / TIFF, lossless
        ↓
external / git-ignored source archive
        ↓
approved master
        ↓
WebP optimisation pipeline
        ↓
runtime WebP assets
```

- **Masters stay out of Git.** Studio deliveries and accepted lossless masters live under `work/atrium-orbit/`, covered by the existing `/work/` ignore rule. The ten 16-bit masters may total several hundred MB.
- **Masters are archived safely** as well: studio delivery storage, project file storage, cloud / object storage or another approved archive. No storage service is introduced here.
- **The runtime serves optimised WebP only.** The lossless master is a source artifact. WebP files follow the existing asset pipeline and the manifest's names, unchanged.
- **The camera file is different.** The accepted `world-atrium-cameras.json` is small and part of the implementation contract. It is committed at `data/world-atrium-cameras.json` once Phase 1 is approved and PASS 6B.1 begins.
- **Git LFS is not used:** no `.gitattributes` rule and no migration. It may be considered later only if the project explicitly decides that lossless masters must be version-controlled.

| May enter Git | Must not enter Git |
| --- | --- |
| the approved `world-atrium-cameras.json` | 16-bit TIFF masters |
| runtime WebP derivatives | large lossless PNG masters |
| manifests, code, documentation | raw renderer project files |
| small review metadata, if useful | large intermediate sequences |

**Intake validator:** `yarn check:atrium-orbit-assets` (`--phase 1|2|3`,
`--strict`, `--root`, `--dir`).

- Manual. With no delivery it prints `NOT READY` and exits 0; `--strict` makes a missing delivery fail.
- It reuses `validateAtriumOrbitCameras` for every camera rule and the manifest for plate names and master sizes. It holds no second copy of the rules.
- It reads image dimensions, format and profile with `sharp` (already a dev dependency). It never judges how an image looks.
- It only reads: it never writes, moves or converts a file.
- Its report has three classes, and it never approves:

| Class | Examples |
| --- | --- |
| ERROR (blocks intake) | missing plate, rig or camera file; malformed JSON; missing camera; wrong step order; zero step; mixed step signs; room focal mismatch; a JPEG or wrong-size final master |
| WARNING (a person decides) | Arrival lens exception; lens not 32 mm equivalent; eye height or roll; non-sRGB output; missing portrait camera; portrait camera differs from desktop; a camera changed since Phase 1; preview size or aspect; missing colour profile; unrecognised file |
| HUMAN REVIEW (listed, never checked) | composition, tree continuity, room framing, lighting quality, whether the orbit feels believable |

**Proof.** The foundation check builds synthetic deliveries (flat grey
images and random rigs in the OS temp folder, removed afterwards) and shows
each ERROR and WARNING case is classified as above. It also locks the
handoff's key numbers to the spec. All 85 deliberate breakages of the orbit
code, the intake validator and the documents were caught; 21 target this
pass.

## 17. PASS 6B.1 entry criteria

**PASS 6B.1 — real camera calibration — may begin only when both are true:**

1. The Phase 1 studio package is in `work/atrium-orbit/studio/phase-1/` and contains:
   - 5 desktop clay plates;
   - 5 portrait clay plates;
   - the top-down rig image;
   - the preliminary `world-atrium-cameras.json`.
2. Camera package validation has no blocking errors: `yarn check:atrium-orbit-assets --phase 1 --strict` exits 0.

Final material plates are **not** required to begin camera calibration.
Warnings do not block entry, but each needs a recorded decision
(`docs/TANPHONG_ATRIUM_DELIVERY_CHECKLIST.md`).

Calibration reads the delivered camera file in place. The accepted copy,
`data/world-atrium-cameras.json`, is created only after Phase 1 is approved
in writing.

**PASS 6B.1 will handle:**

- real camera validation;
- real signed-angle timing (replacing the provisional equal move weights);
- plate-to-viewport calibration;
- desktop and portrait anchor measurement;
- occluder analysis;
- real adjacent-plate transitions;
- reverse transition validation.

**Not in PASS 6B.1:** final colour polish. That waits for the Phase 2 and
Phase 3 plates.

Until then nothing provisional changes: the 160svh span, the hold weights,
the move weights, the gateway reveal and the release stay placeholders, and
`ATRIUM_ORBIT_CAMERA_DATA` stays `null`.
