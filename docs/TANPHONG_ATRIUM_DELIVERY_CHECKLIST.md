# Tân Phong — Atrium Orbit: delivery checklist (internal)

For **our** review of each studio delivery. The studio's brief is
`docs/TANPHONG_ATRIUM_STUDIO_HANDOFF.md`; the authoritative requirements are
`docs/TANPHONG_ATRIUM_ORBIT_ASSET_SPEC.md` (section numbers below refer to it).

Nothing is approved by a script. A delivery is approved only when a person
has completed the checklist for its phase and replied to the studio in
writing.

---

## 1. Where every file belongs

| What | Path | In git? |
| --- | --- | --- |
| Phase 1 delivery, as received | `work/atrium-orbit/studio/phase-1/` | No (`work/` is ignored) |
| Phase 2 delivery, as received | `work/atrium-orbit/studio/phase-2/` | No |
| Final delivery, as received | `work/atrium-orbit/studio/final/` | No |
| Our review material (overlays, annotated captures, notes) | `work/atrium-orbit/review/` | No |
| Accepted camera data (the revision the site uses) | `data/world-atrium-cameras.json` | **Yes**, once Phase 1 is approved and PASS 6B.1 begins |
| Accepted lossless masters (PNG / TIFF) | The accepted delivery in `work/atrium-orbit/studio/final/`, plus a long-term archive outside the repo | **No, never** |
| Website images made from the masters | `public/images/home-chapters/world-atrium-<view>[-portrait][-<width>].webp` | Yes |

- **Do not rename or edit received files.** Keep each delivery as sent; a corrected delivery replaces the folder's contents.
- **Masters never go under `public/`.** Only the WebP derivatives are served.
- **Today's `worlds-atrium*` images stay** until the new Arrival view is approved.
- None of these folders exists yet; create a folder when its delivery arrives.

### Master storage policy (locked)

The ten 16-bit masters may total several hundred MB.

- **Studio deliveries and accepted lossless masters stay outside normal Git tracking.** They live under `work/atrium-orbit/`, which the existing `/work/` ignore rule covers.
- **The accepted delivery in `work/atrium-orbit/studio/final/` is the working source** for the WebP pipeline.
- **Accepted masters are also archived safely**, in studio delivery storage, project file storage, cloud / object storage or another approved archive. Record the location in the review notes. No storage service is chosen or added here.
- **Masters never go under `public/`** or any other tracked asset folder. The lossless master is a source artifact only; the website serves optimised WebP.
- **Git LFS is not used.** It may be considered later only if the project explicitly decides that lossless masters must be version-controlled.

| May enter Git | Must not enter Git |
| --- | --- |
| The approved `world-atrium-cameras.json` | 16-bit TIFF masters |
| Runtime WebP derivatives | Large lossless PNG masters |
| Manifests, code, documentation | Raw renderer project files |
| Small review metadata, if useful | Large intermediate sequences |

**File names inside a delivery folder** (the same in every phase):

```
world-atrium-{arrival,living,bedroom,bathroom,kitchen}.<ext>             desktop
world-atrium-{arrival,living,bedroom,bathroom,kitchen}-portrait.<ext>    portrait
world-atrium-rig-top.<ext>                                               Phase 1 only
world-atrium-cameras.json
delivery-notes.<txt|md|pdf>
```

Previews (Phase 1–2): PNG, JPEG, TIFF or WebP. Masters (Phase 3): PNG or
TIFF only.

## 2. Intake: run the validator first

```
yarn check:atrium-orbit-assets                      every phase found
yarn check:atrium-orbit-assets --phase 1            one phase
yarn check:atrium-orbit-assets --phase 1 --strict   PASS 6B.1 entry gate
```

It is a manual command. It is not part of the build or of any other check,
and with no delivery it reports `NOT READY` and exits 0.

| Class | Meaning | Examples | What to do |
| --- | --- | --- | --- |
| **ERROR** | Blocks intake. | Missing plate, rig image or camera file; malformed JSON; missing camera; wrong step order; zero step; mixed step signs; room focal lengths differ; a JPEG or wrong-size final master. | Return the delivery. Do not start the visual review. |
| **WARNING** | A person decides. | Arrival focal-length exception; lens not 32 mm equivalent; eye-height or roll deviation; colour output not sRGB; missing portrait camera data; a portrait camera that differs from its desktop camera; a camera changed since Phase 1; preview size or aspect off; no embedded profile; unrecognised file. | Check it against the delivery notes. Accept with a recorded reason, or return. |
| **HUMAN REVIEW** | No script can judge it. | Composition, tree continuity, room framing, lighting quality, whether the orbit feels believable. | Sections 3–6 below. |

Record for each delivery:

- [ ] Validator output saved in `work/atrium-orbit/review/` (paste or redirect).
- [ ] Every ERROR resolved (a corrected delivery re-run).
- [ ] Every WARNING has a written decision.

---

## 3. Phase 1 — geometry / camera blockout

Clay materials are expected. No material approval happens here.

### 3.1 Package

*S = the validator reports it. H = a person checks it.*

- [ ] **S** Five desktop clay images present.
- [ ] **S** Five portrait clay images present.
- [ ] **S** Top-down rig image present.
- [ ] **S** `world-atrium-cameras.json` present and well formed.
- [ ] **H** Delivery notes present.
- [ ] **S** Preview sizes about 1280–1600 px (desktop) and 645–800 px (portrait) wide, at the right aspect.

### 3.2 Camera data

- [ ] **S** Correct camera ids: five desktop, five portrait.
- [ ] **S** Correct order: Arrival → Living → Bedroom → Bathroom → Kitchen.
- [ ] **S** All four signed steps non-zero and the same sign.
- [ ] **S** Steps agree with the cameras' own angles (within 1°).
- [ ] **S** One 32 mm full-frame-equivalent lens; room cameras share one focal length.
- [ ] **S** Eye height 1.60 m ±0.05 on every camera.
- [ ] **S** Roll 0.
- [ ] **S** Room cameras share one orbit radius. **H** Arrival radius recorded and sensible.
- [ ] **H** Arrival exception, if any: demonstrated in the clay previews, documented in the notes, and **approved by us in writing** before use (§4).
- [ ] **S** Portrait cameras at their desktop camera's position, target and lens. **H** Any difference explained in the notes.
- [ ] **H** Portrait sensor, lens shift, resolution and aspect recorded.
- [ ] **H** One scene file and one revision (the `scene` block); notes name the same revision.
- [ ] **H** One orbit centre (`orbitCentre`), and it is the planter centre on the rig image.
- [ ] **H** `conventions` state the units, up axis, handedness and how angles are measured.

### 3.3 Top-down rig image

- [ ] Atrium outline visible.
- [ ] Orbit centre and orbit circle / path visible.
- [ ] Arrival, Living, Bedroom, Bathroom and Kitchen cameras, each labelled.
- [ ] Each camera's aim / target line.
- [ ] Clockwise arrow.
- [ ] Angular spacing between consecutive cameras, in degrees, matching `steps`.
- [ ] Camera order obvious; Arrival one step before Living; no reversed first move.

### 3.4 One scene, consistent

- [ ] Tree consistent between adjacent views (trunk, branch silhouette).
- [ ] Planter and pool consistent.
- [ ] Stone / rock and vase consistent.
- [ ] Room geometry consistent: openings, piers, fascias, room order and neighbours.
- [ ] No baked UI: no logo, labels, numbers, text or website graphics. Check at 200%.

### 3.5 Framing

- [ ] **Arrival:** oculus fully in frame near the top centre; tree and planter at or slightly left of centre; Living visible right of centre (§2.3).
- [ ] **Room views:** focal opening in the focal window; foreground anchor in the left third; next room at the right edge, previous behind the left foreground (§7).
- [ ] **Bathroom:** framed from the geometry, the same Atrium's bathroom (§7.3).
- [ ] **Horizon:** room views 48% ±2%; Arrival as needed; portrait about 36–40% (§3).
- [ ] **Portrait framing** of all five views (§11).
- [ ] **Safe-zone geometry** respected (§8). Lightness is judged in Phase 2.

### 3.6 Camera-pair review

Review each adjacent pair by overlaying the two clay images (and flipping
between them). Record what you measure; the "expected" notes are from §9.

**Arrival → Living** — expected shared object: the olive tree and planter mass, with the stone. Expected to be the largest camera change (it also moves in from the larger Arrival radius).

- [ ] Shared foreground object identified: ______
- [ ] Its screen displacement between the two views (% of frame width): ______
- [ ] Architecture continuity: same piers, fascias and openings, only shifted.
- [ ] Camera direction: far wall moves right to left.
- [ ] Estimated blend difficulty (low / medium / high): ______
- [ ] Foreground pass would help (expected: materially, priority 1): ______
- [ ] Depth pass would help: ______
- [ ] The pair is physically plausible as one camera move: yes / no

**Living → Bedroom** — expected: the pier between Living and Bedroom, with the left foreground holding.

- [ ] Shared foreground object identified: ______
- [ ] Its screen displacement (% of frame width): ______
- [ ] Architecture continuity.
- [ ] Camera direction: right to left.
- [ ] Estimated blend difficulty: ______
- [ ] Foreground pass would help (expected: moderately): ______
- [ ] Depth pass would help: ______
- [ ] Physically plausible: yes / no

**Bedroom → Bathroom** — expected: the tree canopy over the wide wall between the two rooms. Expected to be the hardest pair (the largest angular step).

- [ ] Shared foreground object identified: ______
- [ ] Its screen displacement (% of frame width): ______
- [ ] Architecture continuity.
- [ ] Camera direction: right to left.
- [ ] Estimated blend difficulty: ______
- [ ] Foreground pass would help (expected: materially, priority 1): ______
- [ ] Depth pass would help: ______
- [ ] Physically plausible: yes / no

**Bathroom → Kitchen** — expected: the pier and planting between the two rooms, with the vase and low planting.

- [ ] Shared foreground object identified: ______
- [ ] Its screen displacement (% of frame width): ______
- [ ] Architecture continuity.
- [ ] Camera direction: right to left.
- [ ] Estimated blend difficulty: ______
- [ ] Foreground pass would help (expected: moderately): ______
- [ ] Depth pass would help: ______
- [ ] Physically plausible: yes / no

Across the four pairs:

- [ ] Far-wall piers are **not** being relied on to hide a change of view.
- [ ] Camera spacing plausible; the largest step is Bedroom → Bathroom.

### 3.7 Phase 1 decision

- [ ] Approved in writing, or returned with notes. Date: ______ By: ______
- [ ] The studio has been told to stop until that reply.
- [ ] Camera JSON copied to the accepted data path (`data/world-atrium-cameras.json`) **only after this approval**, and committed when PASS 6B.1 begins.

**PASS 6B.1 (camera calibration) entry** needs the complete Phase 1 package
with no blocking errors:

- [ ] `yarn check:atrium-orbit-assets --phase 1 --strict` exits 0.

Calibration can then start on the clay images, reading the delivered camera
file in place; its findings feed this review. Final material plates are not
required for it.

---

## 4. Phase 2 — material / lighting preview

### 4.1 Package

- [ ] **S** Five desktop and five portrait previews present.
- [ ] **S** Updated `world-atrium-cameras.json` present and valid.
- [ ] **S** Cameras unchanged since Phase 1. **H** Any flagged change goes back for camera review.
- [ ] **H** `colourPipeline` final; output sRGB.

### 4.2 Review

- [ ] Material consistency across all ten views (§1.3).
- [ ] Lighting consistency: sun, environment, interior lights, shadow softness (§1.4).
- [ ] Exposure and white balance identical.
- [ ] Time of day identical; Arrival sky close to the oculus palette (§2.3).
- [ ] Room readability: each focal room clearly legible.
- [ ] UI safe areas: desktop zones and lightness targets (§8); portrait zones (§11).
- [ ] Final composition of all ten views.
- [ ] No baked UI, post effects, people or moving objects.

### 4.3 Phase 2 decision

- [ ] Approved in writing, or returned with notes. Date: ______ By: ______

---

## 5. Phase 3 — final delivery

### 5.1 Package

- [ ] **S** Five desktop masters, exactly 3344 × 1882.
- [ ] **S** Five portrait masters, 1290 × 2796 or larger at the same aspect.
- [ ] **S** Lossless PNG or TIFF; no JPEG master.
- [ ] **S** Embedded colour profile. **H** sRGB, the same for all views.
- [ ] **S** Final `world-atrium-cameras.json` present and valid; cameras unchanged since Phase 1.
- [ ] **H** Not web-optimised: no resizing, sharpening, lossy compression or metadata stripping.
- [ ] **H** Phase 1 and Phase 2 approvals are on record.

### 5.2 Acceptance

- [ ] §15 "Per view", for each of the ten masters: same scene, light and colour, camera, composition, clean pixels, file.
- [ ] §15 "Per transition pair", for each of the four pairs.
- [ ] §15 "Set level": ten masters, final camera data, Bathroom included.
- [ ] Sharp at 100%; no fireflies, smearing or banding.
- [ ] The five views plausibly form one continuous clockwise camera journey.

### 5.3 After acceptance

- [ ] Lossless masters archived. Archive location: ______
- [ ] Lossless masters **not** added to normal Git: nothing under `work/` is staged, and no master sits under `public/` or `assets/`.
- [ ] Camera JSON copied to the accepted data path only after approval (the final revision replaces the Phase 1 one).
- [ ] Runtime WebP generated from the accepted masters, at the manifest's names.
- [ ] Runtime WebP dimensions verified (desktop 3344 / 2560 / 1920 / 1280 / 720 px wide; portrait 1290 / 860).
- [ ] Studio originals retained separately: the delivery as received, unedited.
- [ ] Plate statuses set to available only for files that exist.
- [ ] Decision on optional passes (foreground, depth, intermediate frames) left until web QA shows a need (§12).

### 5.4 Phase 3 decision

- [ ] Accepted in writing, or returned with notes. Date: ______ By: ______
