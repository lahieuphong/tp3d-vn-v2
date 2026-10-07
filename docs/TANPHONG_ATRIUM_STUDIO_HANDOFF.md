# Tân Phong — Atrium Orbit: studio handoff

**For:** the 3D artist / studio rendering the Atrium views.

**What this is:** a working summary of the render commission: what to
build, what to send, in what order, and when to stop and wait for us.

**Authoritative document:** `TANPHONG_ATRIUM_ORBIT_ASSET_SPEC.md` (sent with
this handoff). It holds the full composition detail for every view. If this
summary and the specification ever differ, **the specification wins**; tell
us so we can correct the summary.

---

## 1. What we need

The website shows one circular Atrium. As the visitor scrolls, one camera
travels around its centre and stops at five places:

| # | View | Role |
| --- | --- | --- |
| 00 | **Arrival** | The bridge from the sky and oculus into the rooms. A transitional camera state. |
| 01 | **Living** | First room destination. |
| 02 | **Bedroom** | Second room destination. |
| 03 | **Bathroom** | Third room destination. Mandatory. |
| 04 | **Kitchen** | Fourth and final room destination. |

**These are not five independent interiors.** They are five camera positions
inside the same 3D environment. The movement the visitor should perceive is:

**Sky → Oculus → Arrival → Living → Bedroom → Bathroom → Kitchen.**

Each view is needed twice: a **desktop** frame and a **portrait** (phone)
frame. That makes ten images per phase.

If the five views cannot plausibly support one continuous camera journey,
the camera setup is not approved.

## 2. The three phases

Work in three phases. **After each delivery, stop and wait for our written
approval** before starting the next phase.

| Phase | Purpose | You send | Then |
| --- | --- | --- | --- |
| **1. Geometry / camera blockout** | Approve space and cameras before any time goes into materials. Clay / grey materials are expected. | 5 desktop clay previews, 5 portrait clay previews, 1 top-down camera rig image, preliminary `world-atrium-cameras.json` | **STOP.** Wait for written approval. |
| **2. Material / lighting preview** | Approve materials, light and colour at low resolution. Cameras stay as approved. | 5 desktop previews, 5 portrait previews, updated `world-atrium-cameras.json` | **STOP.** Wait for written approval. |
| **3. Final delivery** | Final lossless masters. | 5 desktop masters, 5 portrait masters, final `world-atrium-cameras.json` | We accept against the specification's checklist (§15). |

Sizes:

| Image | Phase 1 and 2 (previews) | Phase 3 (masters) |
| --- | --- | --- |
| Desktop | about **1280–1600 px** wide, aspect 1.7768 (3344 : 1882) | exactly **3344 × 1882 px** |
| Portrait | about **645–800 px** wide, aspect 9 : 19.5 | **1290 × 2796 px**, or larger at the same aspect |

Do **not** begin final materials before Phase 1 is approved. Do **not**
redesign cameras in Phase 3.

## 3. One scene, no AI

**All renders come from ONE saved 3D scene** with one render setup. Between
views, **only the camera transform and framing may differ**.

Locked, identical in every view:

- **Architecture:** circular plan, ceiling ring, oculus, piers, walnut fascias, room openings, floor.
- **Room geometry:** the four rooms in their fixed order around the circle.
- **Central group:** olive tree, circular planter, reflecting pool, stone / rock, vase, foreground planting.
- **Dressing:** furniture, artwork, lamps, vegetation. Scatter and random seeds stay locked.
- **Materials.**
- **Light:**
  - sun position and intensity, fixed in world space;
  - environment / HDRI;
  - time of day;
  - exposure (manual; no auto-exposure);
  - white balance;
  - interior lights.
- **Colour:** one colour-management pipeline; sRGB output.

**No AI plates.** The views must not be generated independently with
image-generation tools, and must not be extended or re-imagined with
generative fill. Minor post-render cleanup (a firefly, a dust speck) is
allowed only if geometry is unchanged; list it in your delivery notes.
Camera continuity and architectural continuity are mandatory.

## 4. The camera

### 4.1 Rig

- **One camera orbits the centre of the planter, clockwise seen from above.**
- It looks across the planter toward the far wall, with a fixed yaw offset to the right. In every room view the **tree, planter and stone sit in the left third** and the focal room opening sits at the centre.
- Between views the far wall slides **right to left** across the frame while the planter stays roughly in place: *the rooms change, the world stays.*
- **Order:** Arrival → Living → Bedroom → Bathroom → Kitchen.
- **Every step turns the same way.** No reversed first move. No teleporting or arbitrary repositioning.
- The four room cameras share the same orbit centre, radius, eye height, yaw offset and lens. Only the orbit angle changes.
- Steps need not be equal: each follows the real angle between rooms in the model. Bedroom → Bathroom is expected to be the largest.
- **Neighbours:** in each room view the next room is partly visible at the right edge, and the previous room is partly visible behind the left foreground.

### 4.2 Lens, height and horizon

| Setting | Rule |
| --- | --- |
| **Lens** | **One 32 mm full-frame-equivalent lens for all five views, desktop and portrait.** On a 36 × 20.25 mm filmback that is about 58.7° horizontal / 35.0° vertical. Rectilinear only. |
| **Eye height** | **1.60 m** above the Atrium floor (±0.05 m), every camera. |
| **Attitude** | Pitch 0°, roll 0°. Verticals stay vertical. |
| **Horizon placement** | By **vertical lens shift**, never by tilting the camera. |
| **Room views, desktop** | Horizon at **48% ±2%** from the top of the frame. |
| **Arrival, desktop** | Horizon not fixed. It may sit lower, using vertical lens shift, to fit the oculus. |
| **Portrait views** | Horizon at about **36–40%**. Do not force the desktop 48% onto portrait. For Arrival portrait, **oculus framing takes priority**. |

**Do not change focal length casually.** If Arrival needs more oculus, solve
it in this order:

1. camera position;
2. a larger orbit radius;
3. vertical lens shift;
4. framing.

A different focal length for Arrival is possible **only** if the Phase 1 clay
previews show the oculus cannot fit otherwise, **and** we approve it in
writing before it is used.

### 4.3 Arrival

Arrival is **not** a symmetric hero shot of all four rooms. Its job is
continuity: **Sky → Oculus → Atrium → Living.**

- The open-sky oculus is fully in frame near the top centre (centre at about x 50% ±2%), with no branch or glazing bar across the middle of the sky.
- The tree and planter sit at or slightly left of centre, beneath the oculus.
- **Living is already visible right of centre**, in the direction of the next camera move. Bedroom may appear further right. Bathroom and Kitchen need not be visible.
- Arrival sits **one step before Living on the same clockwise orbit**. Its radius may be larger (the camera stands further back); record it.

### 4.4 Room views

Composition per room (focal opening position, interior content, neighbours)
is in the specification, §7. In short, for desktop:

- the focal room opening sits in the centre of the frame (jambs at about x 34–68%, fascia at about y 6–25%, opening down to about y 68%);
- the tree, stone, vase and planter rim occupy the left third;
- the pool and floor fill the lower centre.

**Bathroom has no reference image.** Derive it from the 3D scene and the
orbit, like the others. Do not invent a separate bathroom.

The mock-ups we supplied are composition targets only. Where they
contradict one orbit (for example the Bedroom mock-up's foreground on the
right), the 3D scene wins. Specification §14 lists these cases.

### 4.5 Portrait views

- Use the **same camera position and the same 32 mm lens** as the desktop view, with a portrait sensor / crop and vertical lens shift.
- Do not invent a different camera position for portrait unless strictly necessary. If one is needed, it must show in the camera data and be explained in your notes.
- Room views: focal architecture in the upper region (opening within about y 9–42%, x 8–92%); calm floor, pool and planter below; calm top 9% for the header.

## 5. Continuity and safe areas

**Continuity anchors.** These carry the viewer from one view to the next and
must match between adjacent views:

- olive tree;
- central planter;
- stone / rock;
- foreground planting;
- reflecting pool;
- the circular Atrium geometry.

**Do not rely on far-wall piers to hide the change between two views.** They
move with the rooms, so they sit in different places in adjacent views. Only
the near foreground at the orbit centre holds its position.

**Safe areas.** The website lays text over the views. Keep these zones
tonally calm (shaded stone, foliage, floor or wall; no bright windows, sky
or strong highlights). Desktop, room views:

| Zone | x | y | Used for |
| --- | --- | --- | --- |
| Header | 0–100% | 0–11% | Logo and navigation |
| Editorial block | 4–36% | 56–90% | Heading, body copy, link |
| Bottom-left line | 4–16% | 92–97% | Small caption |
| Indicator | 77–97% | 75–89% | Small thumbnail and counter |
| Bottom-right line | 78–97% | 93–97% | Small caption |
| Focal window | 33–77% | 5–70% | No text: the focal opening and its fascia sit here |
| Fascia band | inside the focal window | 8–22% | The room name, drawn by the website. Keep the band clean, continuous and dark enough for light text, with nothing in front of it. |

For Arrival only the header zone applies. Lightness targets for these zones
are in the specification (§8, portrait §11) and are judged in Phase 2.

## 6. Clean pixels

**Architecture and interiors only.** The website draws all interface in
HTML. Renders must contain **none** of:

- the Tân Phong logo, header or navigation;
- room labels or numbers: "01 Living", "02 Bedroom", "03 Bathroom", "04 Kitchen";
- headline, body copy, counter, thumbnail or any button / link text ("ENTER THE WORLD", "SCROLL TO DISCOVER");
- the Breeze ribbon or any other website graphic;
- watermarks or tool stamps.

Also none of:

- vignette, lens flare, chromatic aberration, bloom haloes, film grain;
- motion blur or shallow depth of field;
- people, animals or moving objects.

## 7. Camera data: `world-atrium-cameras.json`

Send this file with **every** phase: preliminary in Phase 1, updated in
Phase 2 if anything changed, final in Phase 3. **Every value is exported
from the real scene.** No invented or rounded-for-show numbers.

**For every camera** (five desktop, five portrait):

| Field | Meaning |
| --- | --- |
| `id` | `arrival`, `living`, `bedroom`, `bathroom`, `kitchen`; portrait: `arrival-portrait`, `living-portrait`, … |
| `angleDeg` | Orbit angle of the camera about the orbit centre |
| `radius` | Horizontal distance from the orbit centre |
| `position` | `[x, y, z]` |
| `target` | Look-at point `[x, y, z]` |
| `eyeHeight` | Height above the Atrium floor |
| `focalLengthMm` | Focal length |
| `sensor` | Filmback: `{ "widthMm", "heightMm", "fit" }` |
| `hFovDeg`, `vFovDeg` | Horizontal and vertical field of view |
| `lensShift` | `{ "x", "y" }` in the renderer's units (0 if unused) |
| `rollDeg` | Camera roll (expected 0) |
| `resolution` | `[width, height]` in px |
| `aspect` | width / height |

**Once per file:**

| Field | Meaning |
| --- | --- |
| `scene` | `{ "file", "revision", "renderer", "rendererVersion" }`: one scene, one revision, for all views |
| `conventions` | `{ "units", "upAxis", "handedness", "angleZero", "angleDirection" }`: how angles are measured |
| `orbitCentre` | `[x, y, z]` of the planter centre used as the orbit pivot |
| `colourPipeline` | `{ "workingSpace", "viewTransform", "look", "output": "sRGB" }` |
| `steps` | The signed angle of each camera step, in order (below) |

**Signed step angles.** The file lists four steps, in this order:

```json
"steps": [
  { "from": "arrival",  "to": "living",   "deltaAngleDeg": null },
  { "from": "living",   "to": "bedroom",  "deltaAngleDeg": null },
  { "from": "bedroom",  "to": "bathroom", "deltaAngleDeg": null },
  { "from": "bathroom", "to": "kitchen",  "deltaAngleDeg": null }
]
```

(`null` marks a value to fill in from the scene.) **All four must have the
same sign** and none may be zero. **Verify this before every delivery.** These
angles drive the motion timing on the website.

The full file layout is in the specification, §6.

## 8. Top-down camera rig image (Phase 1)

One simple image from directly above (viewport capture, clay or technical
render; no final quality needed). It must visibly show:

- the Atrium outline;
- the orbit centre;
- the orbit circle / path;
- the **Arrival, Living, Bedroom, Bathroom and Kitchen** cameras, each labelled;
- each camera's aim / target line;
- a **clockwise** direction arrow;
- the angular spacing between consecutive cameras, in degrees.

The camera order must be obvious at a glance.

## 9. What to send, and how to name it

Send each phase as one folder. File names are the same in every phase.

```
phase-1/
    world-atrium-arrival.png             desktop
    world-atrium-living.png
    world-atrium-bedroom.png
    world-atrium-bathroom.png
    world-atrium-kitchen.png
    world-atrium-arrival-portrait.png    portrait
    world-atrium-living-portrait.png
    world-atrium-bedroom-portrait.png
    world-atrium-bathroom-portrait.png
    world-atrium-kitchen-portrait.png
    world-atrium-rig-top.png             top-down rig (Phase 1 only)
    world-atrium-cameras.json
    delivery-notes.txt

phase-2/     the same ten image names + world-atrium-cameras.json + notes
final/       the same ten image names + world-atrium-cameras.json + notes
```

| Phase | Image format |
| --- | --- |
| 1 and 2 (previews) | PNG preferred; high-quality JPEG is acceptable for previews only. |
| 3 (masters) | **Lossless PNG or TIFF** (`.png` or `.tif`), 16-bit preferred, 8-bit accepted. sRGB with an embedded profile, identical for all views. **Do not deliver JPEG as a master.** Not web-optimised: no resizing, sharpening, lossy compression or metadata stripping. |

We make the optimised website images (WebP) ourselves from your masters.
Storage, archiving and version control of the masters after delivery are
handled by Tân Phong; you only need to deliver the files.

**Delivery notes** (a short text file with each phase):

- the scene file and revision used;
- the axis and angle convention, if not obvious from the camera data;
- any post-render cleanup;
- any portrait camera that differs from its desktop camera in position, target or lens, and why;
- any request for an Arrival lens exception, with the clay evidence.

## 10. What we check at each gate

**Phase 1** (space and cameras):

- geometry of the Atrium;
- camera order and clockwise direction;
- lens, eye height, orbit radius and aim;
- oculus framing in Arrival;
- room framing and portrait framing;
- tree, planter and stone continuity between adjacent views;
- whether the shared foreground usefully covers each change of view.

No material approval happens in Phase 1.

**Phase 2** (materials and light), after applying the final stone /
travertine, walnut, vegetation, furniture, landscape, reflections, daylight,
interior lighting, exposure and white balance:

- consistency of materials, lighting, exposure and white balance across all ten views;
- time of day;
- room readability;
- safe areas and their lightness;
- final composition.

Any camera change after Phase 1 must be flagged and goes back for camera
review.

**Phase 3** (final): the specification's acceptance checklist (§15).

## 11. Not now, but keep it possible

These are **not** part of the commission yet:

- foreground alpha passes;
- depth / Z passes;
- intermediate camera frames between two views.

We may request them later, only if the website needs them. **Keep the scene
set up so they can be exported cheaply:** object IDs / cryptomatte for the
tree, planter, stone, vase, planting and near piers, and a depth output. If
they are essentially free during setup, they may be included with Phase 3,
but they are not required.

We will never ask for AI frame interpolation, optical flow or image
morphing. If intermediate frames are ever needed, they are rendered by
moving the real camera along the same orbit.

## 12. Before you send: quick self-check

- [ ] One scene file, one revision, for every view.
- [ ] Ten images present and named as in §9 (plus the rig image in Phase 1).
- [ ] `world-atrium-cameras.json` present, with all ten cameras and four steps.
- [ ] All four step angles non-zero and the same sign.
- [ ] 32 mm on every camera; eye height 1.60 m; roll 0.
- [ ] Room horizons at 48% ±2% (desktop); portrait about 36–40%.
- [ ] No text, labels, logo or interface anywhere in the images.
- [ ] Delivery notes included.
- [ ] Phase 3 only: masters at the exact sizes, lossless PNG / TIFF, sRGB profile embedded.

Then send the folder and **wait for our written reply**.
