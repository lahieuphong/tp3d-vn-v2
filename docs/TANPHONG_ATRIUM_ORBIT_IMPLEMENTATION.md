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
orbit, on its comp plates, the homepage's orbit (§15.4).** None of the
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
| `atrium-orbit-preview.css` | Shell styles, loaded only with the controller. |

All are in `components/home/experience/`. The only file that references
them is `home-story-timeline.ts`, through the gated dynamic import and a
type-only reference.

## 3. Component architecture

Imperative, like the rest of Scene 3's runtime, so there is no React state
per frame. The controller builds four parts, all derived from one state per
frame:

| Part | Placement | Content |
| --- | --- | --- |
| `OrbitPlateStage` | child of `.hc-atrium-backdrop`, inside `[data-scene3-camera]` | at most the two `<picture>` plates of a move; others `hidden` (no layer). Since PASS 6B.0 these are comp plates (§15.2) |
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
| Sources | outside Git: `work/atrium-orbit/comp-plates/` (`source/` the comps, `clean/` the cut-out PNGs, `clean.py` the OpenCV script that makes them) |
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
