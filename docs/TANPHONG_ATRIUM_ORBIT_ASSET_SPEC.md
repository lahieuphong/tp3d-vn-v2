# Tân Phong — Atrium Orbit: clean plate render specification

**Status:** final asset specification for the render commission. Nothing in
the website changes until the final plates are delivered and accepted. The
homepage stays on its current implementation (`aa9ae55`) in the meantime.

**Locked decisions:**

- **Option A:** Arrival sits one clockwise orbit step *before* Living.
- **One lens:** 32 mm full-frame equivalent for all five views (Arrival exception only if explicitly approved).
- **Same world:** one saved 3D scene; no AI-generated plates.
- **Approval:** a **three-phase** process (§10):
  1. geometry / camera blockout;
  2. material / lighting preview;
  3. final delivery.

**What we are commissioning:** five clean architectural renders of the
**same** circular Atrium, taken by **one camera** that travels clockwise
around the central planter. Each comes in a desktop and a portrait version.

| # | View | Role on the homepage |
| --- | --- | --- |
| 00 | **Arrival** | The bridge from the sky / oculus reveal into the rooms. A transitional camera state. |
| 01 | **Living** | First full room destination (editorial hold). |
| 02 | **Bedroom** | Second room destination. |
| 03 | **Bathroom** | Third room destination. **Mandatory. No valid mock-up exists** (§7.3). |
| 04 | **Kitchen** | Fourth and final room destination. |

The homepage scrolls the visitor through 00 → 01 → 02 → 03 → 04 as **one
continuous clockwise camera journey**. Each change is a short, restrained
move on screen (a few percent of the frame plus a small scale change) with a
brief blend. These are not five unrelated interior renders. They are **five
camera keyframes inside one architectural world**:

*Arrival → turn → Living → turn → Bedroom → turn → Bathroom → turn → Kitchen.*

If the five views cannot plausibly support that continuous camera journey,
the camera setup is not approved.

**Inputs this spec is derived from:**

- **Current Atrium plate:** `assets/home-chapters/worlds-atrium.png` (1672×941). This is today's arrival composition.
- **Three supplied composition mock-ups** (1672×941): Living, Bedroom, Kitchen.

All percentages are fractions of the frame (x from the left, y from the top),
measured on those images. The mock-ups are **composition targets, not a
geometry source**: where they contradict a single orbit, the 3D scene wins
(§14).

---

## 1. One world, one scene

### 1.1 One saved scene

All views are rendered from **one saved 3D scene file** with **one render
setup**. The studio builds the Atrium as one consistent 3D scene: no 3D scene
of it exists today, and today's plate and the mock-ups are flat images.

- **Between views, change only the camera transform.** Framing adjustments (vertical lens shift; portrait sensor / crop) are allowed only where this spec permits them (§2.4, §3, §11), and must be recorded in the camera data (§6).
- **Do not regenerate, re-scatter, swap or re-dress anything between views:**
  - furniture, vegetation, rocks, props;
  - materials;
  - landscape or sky.
- **Scatter / random seeds stay locked.**
- Record the scene file name and revision in the camera data. All views must name the same revision.

### 1.2 AI-generated plates are not acceptable

- Views **must come from the 3D scene**.
- Do **not** generate rooms independently with image-generation tools, and do not extend or re-imagine a render with generative fill.
- Minor post-render cleanup (a firefly, a dust speck, a render artefact) is acceptable **only if it does not alter architecture or geometry**. Disclose it in the delivery notes.
- Geometric continuity between views is mandatory.

### 1.3 What is locked

| Group | Locked items (identical in every view) |
| --- | --- |
| Architecture | Circular plan and radius, ceiling ring, oculus and its glazing bars, travertine piers, walnut fascia bands above the openings, opening sizes, floor levels and the step into each room. |
| Central anchor | Circular planter (stone body, bronze rim ring), reflecting pool and water level, **olive tree** (trunk, branch silhouette, leaf mass), large travertine **stone**, **stone vase**, low planting. Same positions and rotations. |
| Floor | Pattern, bronze inlay rings, polish and reflectivity. |
| Rooms | Room order around the circle (§2), furniture design, colour and placement, artwork, lamps, plants, curtains, window frames. |
| Exterior | One mountain/landscape backdrop fixed in world space; same sky, same clouds. |

### 1.4 Lighting lock (applies from Phase 2)

Lock across all views:

- **sun position** (fixed in world space; never re-aimed per camera);
- **sun intensity** and colour;
- **HDRI / environment**: same map, same rotation, same intensity;
- **exposure**: manual and identical, no auto-exposure or eye adaptation;
- **white balance**: identical;
- **interior practical lights** (lamps, shelf LEDs, pendants): same on/off state, intensity and colour;
- **shadow softness** (sun angular size) and the dappled leaf-shadow pattern;
- **time of day.**

Do not relight or "hero" each room independently. Any exposure, white-balance
or contrast difference between views becomes visible during blending.

### 1.5 Colour management (applies from Phase 2)

- **One colour-management pipeline** for all views: same view transform / tone mapping, same look, same output transform.
- Final masters are in **sRGB** (IEC 61966-2-1) with an embedded profile.
- If the artist works in ACES, linear or another working space, convert every master through the **same** output transform with identical settings.
- **No view may differ** in white balance, tone mapping, LUT or grade.
- Name the pipeline (working space + view transform + look) in the camera data (§6).

---

## 2. Camera journey (Option A, final)

### 2.1 The rig

One camera orbits the **centre of the planter**, clockwise seen from above. It looks across the planter toward the far wall, its yaw offset to the right by a fixed amount, so that:

- the **planter, tree and stone sit in the left third** of every room view;
- the focal room opening sits at the centre.

Between consecutive views the camera moves to its left around the planter. The far wall slides **right to left** across the frame while the planter stays roughly in place: *the rooms change, the world stays.*

```
                       (room order on the far wall, left → right:
                        Living, Bedroom, Bathroom, Kitchen)
              Bedroom ▭                ▭ Bathroom
      Living ▭                                  ▭ Kitchen
                    ┌──────────────────┐
                    │  planter · tree  │   ← orbit centre
                    │  stone · pool    │
                    └──────────────────┘
          C_K ◉                                ◉ C_A  Arrival
                  C_Ba ◉              ◉ C_L        (one step before Living)
                             ◉ C_B

  Travel: C_A → C_L → C_B → C_Ba → C_K, clockwise from above.
  Each camera looks across the planter at its room on the far side.
  Schematic only: the 3D model defines the real bearings.
```

### 2.2 Rules

1. **One direction.** Every step, *including Arrival → Living*, is a clockwise rotation about the same orbit centre. No reversed first move, no step reverses.
2. **No teleporting, no arbitrary repositioning.** The room cameras (01–04) share the same orbit centre, radius, eye height, yaw offset and lens. Only the orbit angle changes. Arrival's permitted differences are listed in §2.4.
3. **Spacing follows architecture.** Steps need **not** be equal; each equals the angle between the rooms' framing positions in the model. The Bedroom → Bathroom step (across the widest wall) is expected to be the largest.
4. **Signed step angles are recorded and verified.** The camera data (§6) lists the signed angle of every step:
   - Arrival → Living
   - Living → Bedroom
   - Bedroom → Bathroom
   - Bathroom → Kitchen

   All four **must have the same sign** under the documented axis convention. The studio verifies this before every delivery. These angles will drive the web motion timing.
5. **Neighbours.** In every room view, the **next** room is partly visible at the **right edge** (x ≈ 80–100%). The **previous** room, or for Living the bay before it, is partly visible **behind the left foreground** (x ≈ 10–33%).

### 2.3 Arrival: purpose

Arrival's job is **not** to show all four rooms equally. Its job is continuity:

**Sky → Oculus → Atrium context → Living.**

Optimise it for:

1. **The existing sky / oculus reveal.**
   - The open-sky oculus is fully in frame, readable near the top centre, with its centre at about **x 50% ±2%**.
   - The central sky area is free of branches and glazing bars crossing its middle.
   - From Phase 2, the sky is clear blue with soft white cloud, close to today's oculus palette (sky ≈ `#b0c3e0`–`#c2d3e9`, cloud ≈ `#eef0f3`), because the real-time sky shown before this view is tuned to it.
   - The site re-measures the oculus position from the delivered view.
2. **The first move into Living.**
   - **Living is visible right of centre**, toward the next orbit direction. Bedroom may appear further right.
   - **The tree and planter sit at or slightly left of centre**, beneath the oculus.
   - The bay before Living may show on the left.
   - **Bathroom and Kitchen do not need to be visible.**

Arrival needs only enough architecture to establish the Atrium. It may have
**less text-safe negative space** than the room views; only the header zone
(§8, zone H) needs to stay calm.

### 2.4 Arrival: position and framing

- **Orbit:** same centre and direction. Arrival is **one step before Living** (counter-clockwise of C_L), so Arrival → Living is a clockwise step.
- **Radius:** may be **larger** than the room cameras' radius (the camera stands further back) to bring the oculus into frame. Arrival → Living then also dollies in. Record the radius.
- **Eye height:** the same 1.60 m (§3).
- **Framing:** if the oculus still does not fit, use **vertical lens shift (rise)**, not camera tilt. The horizon then sits lower in the Arrival frame than the room views' 48% (§3). Record the shift.
- **Lens:** the **same 32 mm** (§4). A different focal length is used only under §4's exception, after explicit approval.

---

## 3. Camera height, attitude and horizon

- **Eye height: 1.60 m** above the Atrium floor (±0.05 m), identical for every camera, desktop and portrait.
  - *Derived:* in every mock-up and in today's overview, the distant mountain ridge (the true horizon) sits at **46–50%** of frame height.
  - From the furniture: the Living mock-up gives ≈ 1.60 m (sofa back ≈ 0.8 m); the Kitchen mock-up gives ≈ 1.5 m (island top ≈ 0.92 m).
- **Pitch: 0° (level). Roll: 0°.** Verticals stay vertical; no keystoning.
- **Horizon position:** any horizon placement is made by **vertical lens shift**, never by tilting the camera.

| View | Horizon (from the top of the frame) | Rule |
| --- | --- | --- |
| **Room views 01–04, desktop** | **48% ±2%** | Required for Living, Bedroom, Bathroom and Kitchen. |
| **Arrival 00, desktop** | **Not fixed** | May sit lower than 48% (further down the frame) via lens shift, if needed to include the oculus while keeping 32 mm. Priority order: (1) same 32 mm lens, then solve with (2) camera position, (3) orbit radius, (4) vertical lens shift, (5) framing. |
| **Portrait views (all five)** | **≈ 36–40%**, where appropriate | Keeps the room in the upper part of the frame and leaves the lower part for editorial content. **Do not force the desktop 48% onto portrait.** For Arrival portrait the oculus requirement takes precedence. |

---

## 4. Lens policy (final)

- **One focal length for all five views, desktop and portrait: 32 mm full-frame equivalent.**
  - On a 36 × 20.25 mm (16:9) filmback that is ≈ **58.7° horizontal / 35.0° vertical** field of view.
  - At this lens the focal room opening (jamb to jamb) spans about **33–36%** of the desktop frame width, and the planter rim enters the lower-left, as in the mock-ups.
- **Arrival uses the same 32 mm.** If it needs more oculus, solve it in this order:
  1. camera position;
  2. a larger orbit radius / greater distance;
  3. vertical lens shift;
  4. framing (§3).
- **Exception:** Arrival may use a different focal length **only if**:
  - the studio demonstrates in the **Phase 1 clay previews** that the oculus cannot fit by those means; **and**
  - we explicitly approve the change **before** it is used.

  If approved, use the smallest change that works and record the exact difference (mm and degrees of field of view) in the camera data and delivery notes.
- **The goal: no visible lens snap between Arrival and Living.**
- Rectilinear projection only: no fisheye, no lens-distortion profile, no anamorphic squeeze.

---

## 5. Central anchor (continuity)

The olive tree, planter, stone, vase, low planting, pool and floor rings carry
the viewer from one view to the next. Because they sit at the orbit centre,
they stay roughly in place while the rooms slide past. **They are the
strongest shared occluders** (§9); preserve them carefully between adjacent
views.

- **Room views (desktop):** the anchor occupies the **left third**, consistently:
  - **tree canopy:** x 0–38%, y 3–62%;
  - **stone:** x 0–25%, y 40–76%;
  - **vase:** x 20–35%, y 60–78% (where visible);
  - **planter rim:** sweeping from the lower-left corner to about x 50%, y 75–100%;
  - **pool water:** lower centre, x 38–72%, y 78–100%.

  These ranges are the Living and Kitchen mock-ups' arrangement. Tolerance between adjacent views: ±5% of frame width.
- The stone and tree show slightly different faces from view to view. That is correct, and it proves the orbit; their **position in the frame** stays close.
- **Arrival:** the anchor sits at or slightly left of centre, beneath the oculus.

---

## 6. Camera data: `world-atrium-cameras.json`

Delivered **preliminary in Phase 1**, **updated in Phase 2** if anything
changed, and **final in Phase 3**. Every value is **exported from the
renderer's actual scene**: no invented or rounded-for-show numbers.

**Per camera** (the five desktop views and the five portrait views):

| Field | Meaning |
| --- | --- |
| `id` | `arrival`, `living`, `bedroom`, `bathroom`, `kitchen`; portrait: `arrival-portrait`, `living-portrait`, … |
| `angleDeg` | Orbit angle of the camera position about the orbit centre, in the documented convention |
| `radius` | Distance of the camera from the orbit centre, in the horizontal plane |
| `position` | Camera position `[x, y, z]` |
| `target` | Look-at point `[x, y, z]` (or the point the camera's forward axis passes through at the far wall) |
| `eyeHeight` | Camera height above the Atrium floor |
| `focalLengthMm` | Focal length |
| `sensor` | Filmback: `{ "widthMm", "heightMm", "fit" }` (`fit`: horizontal / vertical / auto, as the renderer defines it) |
| `hFovDeg`, `vFovDeg` | Horizontal / vertical field of view |
| `lensShift` | `{ "x", "y" }` in the renderer's units (0 if unused) |
| `rollDeg` | Camera roll (expected 0) |
| `resolution` | `[width, height]` in px |
| `aspect` | width / height |

**Once per file:**

| Field | Meaning |
| --- | --- |
| `scene` | `{ "file", "revision", "renderer", "rendererVersion" }`: identical for all views |
| `conventions` | `{ "units", "upAxis", "handedness", "angleZero", "angleDirection" }`: how `angleDeg` and `deltaAngleDeg` are measured |
| `orbitCentre` | `[x, y, z]` of the planter centre used as the orbit pivot |
| `colourPipeline` | `{ "workingSpace", "viewTransform", "look", "output": "sRGB" }` (in Phase 1: the intended pipeline) |
| `steps` | The **signed angular delta** of each transition, in order, computed from the desktop cameras' `angleDeg`. **All four must have the same sign**; the studio verifies this before each delivery. |

Structure (layout only; every value comes from the scene):

```json
{
  "scene": { "file": "…", "revision": "…", "renderer": "…", "rendererVersion": "…" },
  "conventions": { "units": "m", "upAxis": "…", "handedness": "…", "angleZero": "…", "angleDirection": "…" },
  "orbitCentre": [null, null, null],
  "colourPipeline": { "workingSpace": "…", "viewTransform": "…", "look": "…", "output": "sRGB" },
  "cameras": {
    "arrival": {
      "angleDeg": null, "radius": null,
      "position": [null, null, null], "target": [null, null, null],
      "eyeHeight": null, "focalLengthMm": null,
      "sensor": { "widthMm": null, "heightMm": null, "fit": "…" },
      "hFovDeg": null, "vFovDeg": null,
      "lensShift": { "x": null, "y": null }, "rollDeg": null,
      "resolution": [null, null], "aspect": null
    },
    "living": { "…": "same fields" },
    "bedroom": { "…": "same fields" },
    "bathroom": { "…": "same fields" },
    "kitchen": { "…": "same fields" },
    "arrival-portrait": { "…": "same fields" },
    "living-portrait": { "…": "same fields" },
    "bedroom-portrait": { "…": "same fields" },
    "bathroom-portrait": { "…": "same fields" },
    "kitchen-portrait": { "…": "same fields" }
  },
  "steps": [
    { "from": "arrival",  "to": "living",   "deltaAngleDeg": null },
    { "from": "living",   "to": "bedroom",  "deltaAngleDeg": null },
    { "from": "bedroom",  "to": "bathroom", "deltaAngleDeg": null },
    { "from": "bathroom", "to": "kitchen",  "deltaAngleDeg": null }
  ]
}
```

Portrait cameras normally share their desktop camera's `position`, `target`
and `focalLengthMm` and differ only in `sensor`, `lensShift`, `resolution` and
`aspect` (§11). Any other difference must be visible in the data and
explained in the delivery notes.

---

## 7. View-by-view composition

Frame template for the **desktop room views (01–04)**, from the mock-ups:

```
 x: 0%      22%   33%                      70%   80%        100%
    ┌─────────────────────────────────────────────────────────┐ y 0%
    │ ceiling ring / header band (keep calm)                  │
    │          pier │ walnut fascia (focal)   │ pier │ next    │ y 6–25%
    │ tree     ┊    ├─────────────────────────┤      │ room's  │
    │ canopy   ┊    │                         │      │ fascia  │
    │ (prev.   ┊    │   FOCAL ROOM OPENING    │      │ + edge  │ y 25–68%
    │  room    ┊    │   (interior, window,    │      │ of its  │
    │  behind) ┊    │    furniture)           │      │ interior│
    │ stone    ┊    └─────────────────────────┘      │         │ y ≈ 68%
    │ + vase   ·      floor · light · reflections            │
    │ planter rim ╲        pool water          ╲  floor rings │
    └─────────────────────────────────────────────────────────┘ y 100%
```

### 7.0 — 00 Arrival

See §2.3–§2.4. In short:

- oculus with open sky, readable near the top centre;
- tree and planter beneath it, at or slightly left of centre;
- **Living visible right of centre**; Bedroom may appear further right;
- same eye height and lens;
- clockwise one step before Living;
- horizon per §3.

### 7.1 — 01 Living (first full room hold)

- **Reference:** Living mock-up (composition intent only; geometry from the 3D scene).
- **Focal opening (the dominant opening):**
  - jambs at about **x 34–68%** (centre ≈ 51%);
  - walnut fascia **y 6–21%**;
  - opening **y 21–68%**.
- **Interior content:**
  - cream sectional sofa, round low coffee table, two table lamps, side table, indoor olive tree;
  - the large window with the mountain view, ridge at y ≈ 46–50%.
- **Neighbours:**
  - **right edge:** pier at x 70–80%, then the **Bedroom** fascia and interior edge at x 80–100% (bed, lamp, leaf artwork);
  - **left:** pier at x 22–33%, with the bay before Living behind the foreground foliage.
- **Foreground:** left third (§5).
- **Safe areas:** all UI safe-area rules (§8).

### 7.2 — 02 Bedroom

- **Reference:** Bedroom mock-up, **for the room only**: bedroom centred, Living partly visible on the left, the Bathroom fascia at the right edge.
- **Geometry truth overrides the mock-up.** The mock-up's stone, tree and vase on the **right** cannot come from the same clockwise orbit. **Do not reproduce them.** Render the real scene from the Bedroom orbit position, where the foreground falls in the left third like Living and Kitchen (§5).
- **Focal opening:**
  - jambs at about **x 35–66%** (centre ≈ 51%);
  - fascia **y 7–25%**;
  - opening **y 25–68%**.
- **Interior content:**
  - bed with brown throw and ivory linens, two bedside tables with lamps;
  - the large leaf-pattern artwork panel, potted olive trees, sheer curtain, window.
- **Neighbours:**
  - **left:** Living (sofa, lamp, window with mountains), partly behind the foreground foliage, x ≈ 10–33%;
  - **right edge:** pier, then the **Bathroom** fascia and a slice of its interior, x ≈ 80–100%.
- **Safe areas:** full rules (§8).

### 7.3 — 03 Bathroom (mandatory, derived from geometry)

- **There is no valid Bathroom mock-up.** Derive the framing from the **actual 3D scene and the established clockwise orbit**: the Bathroom orbit position with the same rig rules. Bathroom becomes the primary focal opening.
- **The same Atrium's bathroom**, as seen in today's overview. **Do not invent a standalone bathroom environment.** It contains:
  - the freestanding oval stone bathtub, warm wall finish, timber framing;
  - the large window with trees beyond, potted olive tree(s).
- **Focal opening:** the room-view template:
  - jambs at about **x 34–68%** (centre 50–55%);
  - fascia **y 6–25%**;
  - opening **y 21–68%**;
  - the tub reads clearly inside the opening.
- **Neighbours:**
  - **left:** Bedroom, partly behind the foreground foliage;
  - **right edge:** pier, then the **Kitchen** fascia and a hint of its dark marble island or walnut cabinetry.
- **Safe areas:** full rules (§8).

### 7.4 — 04 Kitchen

- **Reference:** Kitchen mock-up (framing intent).
- **Focal opening:**
  - the mock-up places the jambs at about x 44–73%; centre it like the other rooms: **jambs ≈ x 35–69%, centre 50–55%**;
  - fascia **y 10–22%**;
  - opening **y 22–68%**.
- **Interior content:**
  - walnut cabinetry with lit open shelving, dark veined marble island with three stools;
  - linear pendant light, floor-to-ceiling glazing with the mountain view.
- **Neighbours:**
  - **left:** Bathroom, partly behind the tree (x ≈ 15–33%), as in the mock-up;
  - **right edge:** whatever bay follows Kitchen **in the model**. The mock-up's "01 Living" label there is a baked UI error (§14). **Do not alter the Atrium to reproduce it.** All room labels are drawn by the website.
- **Ending:** the last state before the page releases into the Footer. A calm, complete composition.
- **Safe areas:** full rules (§8).

---

## 8. Safe UI areas (desktop)

**Applies in full to the room views 01–04.** For Arrival only zone **H**
applies (§2.3). Portrait safe areas are in §11. Lightness targets can only be
judged with final materials, so they are **approved in Phase 2**; the zone
geometry is already checked in Phase 1.

The website lays its editorial UI over the views in these zones, measured
from the mock-ups. Do not put the focal room's key detail behind them. Keep
them **tonally calm**: shaded stone, foliage, floor or wall, without bright
windows, sky or strong highlights.

| Zone | x | y | Content on the page | View requirement |
| --- | --- | --- | --- | --- |
| **H — Header** | 0–100% | 0–11% | Logo (x 5–17%), navigation (x 48–96%) | Calm ceiling ring / walnut. Average **L\* ≤ 60** behind the text. |
| **E — Editorial block** | 4–36% | 56–90% | "3D WORLDS", "Enter / the living room.", body copy, "EXPLORE THIS ROOM →" | Shaded foreground (stone face, foliage, planter side). Behind the large heading **L\* ≤ 57**; behind the body copy **L\* ≤ 45**. |
| **M1 — Bottom-left metadata** | 4–16% | 92–97% | "SCROLL TO DISCOVER" | Calm floor / planter. |
| **I — Indicator** | 77–97% | 75–89% | Round room thumbnail + "01 / 04 LIVING" | Calm floor, pool rim or wall. No focal detail. |
| **M2 — Bottom-right metadata** | 78–97% | 93–97% | "REAL SPACES. REAL PERSPECTIVE." | Calm floor. |
| **F — Focal window** | 33–77% | 5–70% | (no UI) | The focal opening and its fascia sit **here**. |
| **L — Fascia signage** | inside F | 8–22% | Room number + name, in HTML | The focal fascia band is clean, continuous and dark enough for ivory text, with nothing in front of it. |

*Where the lightness targets come from:* the site's text is ivory `#f5edde`.
WCAG contrast needs L\* ≈ 45 or darker behind body copy (4.5 : 1) and about
L\* 57 or darker behind large display text (3 : 1).

**Tablet:** uses the desktop views. In portrait the viewport shows roughly
the central **39–42% of the view width**, centred on the focal opening; in
landscape about 80%. The focal opening must therefore fit a **40%-wide**
window around its own centre (the template already does). No tablet renders
are needed.

---

## 9. Transition pairs and occluders

**How the site will blend.** Each view shifts only a little (≈ 2–5% of the
screen, up to ≈ 3% scale), and the outgoing and incoming views overlap only
briefly: the scroll-driven equivalent of a **150–300 ms** blend.

**What can and cannot hide the swap.** The **near foreground** (olive tree,
planter, stone, vase, low planting) sits at the orbit centre, so it occupies
nearly the same screen region in both views. **It never double-exposes and
reliably covers its own area.**

**Do not assume far-wall piers will hide transitions.** They move with the
rooms: as the camera angle changes, their screen positions change too, so in
a two-view blend they sit in **different** places.

- **What piers can do:** give the site a strong vertical edge to align a directional soft wipe to.
- **What piers cannot do:** cover the rest of the far wall. That part (roughly the right two-thirds of the frame) dissolves during the blend. Keeping that dissolve short and directional is the web side's job.
- **When to escalate:** if web QA still shows visible transitions, the escalation is optional foreground passes, then rendered in-between frames (§12.2–§12.3).

| Pair | Shared occluder (approved) | Outgoing view location | Incoming view location | Covers a 150–300 ms blend? | Foreground alpha pass would… |
| --- | --- | --- | --- | --- | --- |
| **00 → 01**<br>Arrival → Living | **Olive tree / planter mass** (+ stone) | Tree and planter at or slightly left of centre: x ≈ 30–60%, y ≈ 25–100% | Left third: canopy x 0–38%, stone x 0–25%, planter rim lower-left | **Partly.** The mass hides its own region in both views. The Living opening changes size and position (dolly-in from the larger Arrival radius), so its region dissolves. Acceptable with a short blend placed in the fastest part of the move. | **Materially improve.** The largest camera change of the tour; the tree can move at its own speed and mask the dolly. **Priority 1** if passes are requested later. |
| **01 → 02**<br>Living → Bedroom | **Architectural pier** between Living and Bedroom, with the left foreground holding | Pier x ≈ 70–80% (y 5–70%); foreground x 0–38% | Pier x ≈ 22–33%; foreground x 0–38% | **Partly.** The foreground third stays clean. The pier is an alignment edge for a directional wipe but does not cover the far wall, which dissolves. Likely acceptable at ≤ 200 ms; confirm in web QA. | **Moderately improve** (pier and foreground passes let the near columns sweep across the dissolve). |
| **02 → 03**<br>Bedroom → Bathroom | **Tree canopy + the wide wall mass** between Bedroom and Bathroom | Wide wall x ≈ 68–90%, Bathroom fascia at the right edge; canopy x 0–38% | Wall x ≈ 10–33%, partly behind the canopy; Bathroom centred | **Partly. The hardest pair:** the largest angular step means the largest background shift. The canopy over the wall is the best natural occluder in the set. | **Materially improve.** **Priority 1** together with 00 → 01. |
| **03 → 04**<br>Bathroom → Kitchen | **Architectural pier / planting** between Bathroom and Kitchen (+ vase, low planting) | Pier x ≈ 70–80%; vase and planting x 20–35%, y 60–78% | Pier x ≈ 33–41% (Kitchen mock-up); vase and planting in the same lower-left region | **Partly**, as Living → Bedroom; the planting and vase stay in place. | **Moderately improve.** |

*All locations are expected values from the mock-ups and the rig. **Phase 1**
confirms the real ones.*

**Portrait transitions** rely less on occlusion (the frame is narrow and the
room is centred). They use a shorter blend with a small vertical drift; no
extra bridge features are needed.

**Reverse scroll** plays the same pairs backwards. No extra assets.

---

## 10. Approval process: three phases

The studio does **not** start expensive rendering until the previous phase is
approved in writing. The camera data (§6) travels with every phase.

### Phase 1 — Geometry / camera blockout

**Purpose:** approve spatial continuity **before** any time goes into final
materials, styling or lighting. Simple clay / grey materials are expected;
this phase is not about beauty.

**Phase 1 delivery package:**

| Deliverable | Specification |
| --- | --- |
| **5 desktop clay previews** | Arrival, Living, Bedroom, Bathroom, Kitchen. About **1280–1600 px wide** at the desktop aspect (1.7768). Clay / greybox, at the final camera, lens and framing. |
| **5 portrait clay previews** | The same five views, portrait framing per §11, about **645–800 px wide** at 9 : 19.5. Same camera position and 32 mm lens wherever possible; crop / sensor / lens-shift adjustments as needed and recorded. |
| **1 top-down camera rig preview** | A simple viewport, clay or technical render from directly above (no final quality needed). It must show: the Atrium outline; the orbit centre; the orbit circle / path; the Arrival, Living, Bedroom, Bathroom and Kitchen cameras, labelled; each camera's aim / target vector; a clockwise direction arrow; and the angular spacing between consecutive cameras (in degrees). |
| **Preliminary `world-atrium-cameras.json`** | All fields of §6 for all ten cameras, including `steps`, exported from the scene. |

**Phase 1 review** (we approve or return with notes):

- [ ] **Atrium geometry:** circular plan, ceiling ring, oculus, piers, fascias, room openings; the circular-Atrium logic reads.
- [ ] **Room orientation:** order Living → Bedroom → Bathroom → Kitchen as on today's far wall; correct neighbours in each view.
- [ ] **Orbit direction:** clockwise from above (rig preview); `steps` all the same sign; Arrival one step before Living; no reversed first move.
- [ ] **Camera radius:** room cameras identical; Arrival radius recorded.
- [ ] **Camera height:** 1.60 m on every camera.
- [ ] **Focal length:** 32 mm everywhere, or a demonstrated case for an Arrival exception (§4), awaiting our approval.
- [ ] **Aim / target:** consistent yaw offset; foreground in the left third on room views.
- [ ] **Lens shift:** recorded; room views at horizon 48% ±2%; Arrival and portrait per §3.
- [ ] **Oculus framing** in Arrival (§2.3).
- [ ] **Room framing:** focal opening in the focal window (§8, zone F); Bathroom framed from geometry; safe-zone **geometry** respected.
- [ ] **Tree / planter / stone continuity** between adjacent views (§5).
- [ ] **Shared foreground occluders** at the expected positions (§9).
- [ ] **Portrait framing** (§11).
- [ ] **Camera spacing:** plausible steps; the largest at Bedroom → Bathroom.

No material approval happens in Phase 1.

### Phase 2 — Material / lighting preview

**Only after Phase 1 approval**, apply the final:

- travertine / stone, walnut, furniture, vegetation and landscape;
- reflections, interior practical lights, daylight, exposure, white balance;
- final styling.

The cameras stay as approved in Phase 1. Any camera change must be flagged
and goes back for camera review.

**Phase 2 delivery package:**

| Deliverable | Specification |
| --- | --- |
| **5 desktop low-res previews** | Final materials and lighting, about 1280–1600 px wide; reduced samples are acceptable. |
| **5 portrait low-res previews** | Same, about 645–800 px wide. |
| **Updated `world-atrium-cameras.json`** | Unchanged cameras confirmed; `colourPipeline` final. |

**Phase 2 review:**

- [ ] **Material consistency** across all ten views (§1.3).
- [ ] **Lighting consistency:** sun, HDRI, practicals, shadow softness (§1.4).
- [ ] **Colour pipeline:** one pipeline, sRGB output (§1.5).
- [ ] **Exposure and white balance** identical.
- [ ] **Time of day** identical; Arrival sky close to the oculus palette (§2.3).
- [ ] **Room readability:** each focal room clearly legible.
- [ ] **UI safe areas:** desktop zones and lightness targets (§8); portrait zones (§11).
- [ ] **Final composition** of all ten views.

### Phase 3 — Final delivery

**Only after Phase 2 approval**, render the final lossless masters (§13):

```
/atrium-orbit/
    world-atrium-arrival.png
    world-atrium-living.png
    world-atrium-bedroom.png
    world-atrium-bathroom.png
    world-atrium-kitchen.png

    world-atrium-arrival-portrait.png
    world-atrium-living-portrait.png
    world-atrium-bedroom-portrait.png
    world-atrium-bathroom-portrait.png
    world-atrium-kitchen-portrait.png

    world-atrium-cameras.json          (final)
```

- **Desktop:** 3344 × 1882 for the five views.
- **Portrait:** 1290 × 2796 for the same five views.
- TIFF masters may use the same names with `.tif`.
- We accept the delivery against the checklist in §15.

---

## 11. Portrait (mobile) views

- **Why portrait views exist:** a 16:9 view shown full-height on a 390×844 phone shows only the central **≈ 26% of its width**. The room opening is clipped and the planter disappears. The copy also occupies the lower ~58% of the phone screen. Dedicated portrait views materially improve mobile; they are part of every phase.
- **Camera:** use the **same camera position and the same 32 mm lens** as the desktop view, with a **portrait sensor / crop / framing and vertical lens shift** where the renderer supports it.
  - Do not invent a different camera location for mobile unless strictly necessary; if one is needed, it must be visible in the camera data and explained.
  - The room's spatial identity must match between desktop and mobile.
  - *For reference:* with a portrait filmback whose long side is 36 mm, 32 mm gives ≈ 29° horizontal / 59° vertical field of view; the focal opening then spans most of the width.
- **Framing (room views):**
  - **level camera, horizon ≈ 36–40%** from the top via **vertical lens shift** (not tilt), where appropriate (§3);
  - **focal architecture in the upper region:** opening (fascia to threshold) within about **y 9–42%** and x 8–92%;
  - **lower area, y 42–100%:** calm floor, pool and planter, darker toward the bottom (**L\* ≤ 45** under body copy, judged in Phase 2). This is where the heading, body, room list and CTA sit;
  - **top, y 0–9%:** header; keep it calm.
- **Arrival portrait:** the oculus and tree on the vertical centre line, room openings at the sides of the upper half. The oculus requirement takes precedence over the 36–40% horizon target; same lens policy as §4.

---

## 12. Optional later deliveries (not part of the commission yet)

Do **not** render these now. **Do keep the scene set up so they can be
exported cheaply later:** object IDs / cryptomatte for the occluders, and a
depth AOV. If they are essentially free during setup, they may be included
with Phase 3, but they are not required.

### 12.1 Trigger

Only if **web QA** on the final plates shows that transitions are still
visible.

### 12.2 Foreground and depth passes (first escalation)

```
/foreground/   world-atrium-<view>-fg.png
               alpha matte of the key occluders: tree, planter, stone, vase,
               low planting, near columns / piers
/depth/        world-atrium-<view>-depth.exr
               normalised depth (Z) pass
```

- **Foreground passes:** priority 1 for Arrival → Living and Bedroom → Bathroom (§9).
- **Depth passes** may support very subtle 2.5D movement, depth-aware blending or foreground separation. They will **never** be used to warp architecture heavily.

### 12.3 Intermediate orbit frames (second escalation)

```
/intermediate/  <from>-<to>/0001.png …
```

- **Deferred.** Commission only if the transitions remain visible after §12.2.
- Render them by **moving the actual camera along the same orbit** in the 3D scene.
- **Never** use AI frame interpolation, optical flow or image morphing. Architectural geometry must remain physically correct.
- Frame count and resolution will be specified at that point, from the measured web need.

---

## 13. Master delivery vs web delivery

### 13.1 Artist masters (Phase 3)

| Item | Requirement |
| --- | --- |
| Desktop | **3344 × 1882 px**, exactly 2× today's 1672×941 plate, same aspect 1.7768. |
| Portrait | **1290 × 2796 px** (9 : 19.5) or a higher equivalent at the same aspect. |
| Format | **Lossless PNG or TIFF** (16-bit preferred, 8-bit accepted), sRGB with embedded profile (§1.5). No JPEG, no chroma subsampling. |
| Quality | Fully converged: no fireflies, denoiser smearing or banding. Sharp at 100%. |
| **Not web-optimised** | No resizing, sharpening-for-web, lossy compression or metadata stripping. |

### 13.2 Clean pixels (every phase, every view)

**Architecture and interiors only.** Absolutely none of:

- Tân Phong logo, header, navigation, "EST." or other metadata;
- room numbers or Living / Bedroom / Bathroom / Kitchen labels on the fascias;
- headline, body text, CTA, thumbnail, counter;
- the Breeze ribbon or any website UI or overlay;
- watermarks or tool stamps.

**No baked post effects:**

- no vignette, lens flare, chromatic aberration, bloom haloes or film grain;
- no motion blur;
- **no shallow depth of field**: everything sharp, or the same very mild depth of field on every view;
- no people, animals or moving objects.

### 13.3 Web delivery (our application pipeline, not the studio's)

- From the masters we produce **WebP** responsive variants for the current runtime (desktop widths ≈ 3344 / 2560 / 1920 / 1280 / 720; portrait ≈ 1290 / 860), stored as `public/images/home-chapters/world-atrium-<view>[-portrait][-<width>].webp`. AVIF is not part of the current runtime.
- The lossless masters are archived by Tân Phong, outside the website and outside normal version control. **Large TIFF/PNG masters are never shipped to the website.**
- Today's `worlds-atrium*` images remain until the new Arrival view is approved.

---

## 14. Known problems in the supplied mock-ups (do not reproduce)

The mock-ups are composition targets, not a geometry source. Geometry truth
from the 3D scene overrides them.

1. **Baked UI everywhere:** header, navigation, headline, body, CTA, thumbnail, counter, fascia labels and the Breeze ribbon.
2. Mock-up text errors ("EST. 2028" where the site says 2026; "EXPORE THIS ROOM"). Irrelevant to the renders; they confirm these are not production art.
3. **Bedroom foreground on the right** (stone, tree, vase). It breaks the orbit; render the real scene (§7.2).
4. **"01 Living" to the right of Kitchen.** A baked UI error; do not change the Atrium to reproduce it (§7.4).
5. **No Bathroom mock-up.** The fourth supplied image duplicated Bedroom. Bathroom is derived from the 3D scene and the orbit (§7.3).

---

## 15. Final acceptance checklist (Phase 3)

### Per view

**Same scene**
- [ ] Same scene file and revision as the other views (camera data).
- [ ] Only the camera transform differs (plus recorded shift / sensor / crop).
- [ ] Same olive tree (trunk, branch silhouette).
- [ ] Same planter, bronze rim, pool and water level.
- [ ] Same stone and vase, same placement.
- [ ] Same low planting.
- [ ] Same floor and inlay rings.
- [ ] Same materials: travertine, walnut, marble, bronze.
- [ ] Same furniture, artwork and lamps as seen in the other views' side views.
- [ ] Same mountains and sky.
- [ ] **No AI-generated content.** Any post cleanup disclosed and geometry-neutral.

**Light and colour**
- [ ] Same sun position and intensity, HDRI, exposure, white balance and practical lights.
- [ ] Same shadow softness and time of day.
- [ ] Same colour pipeline; sRGB master with embedded profile.

**Camera** (matches the Phase 1 / Phase 2 approval)
- [ ] Eye height 1.60 m ±0.05.
- [ ] Level camera, roll 0.
- [ ] Horizon per §3: room views 48% ±2%; Arrival as approved; portrait ≈ 36–40%.
- [ ] **32 mm**, or the approved Arrival exception.
- [ ] On the orbit, at the recorded clockwise angle.

**Composition**
- [ ] Correct focal room in the focal window (desktop jambs within x 33–77%, centre 50–55%; portrait per §11).
- [ ] Foreground anchor in the left third (desktop room views).
- [ ] Correct neighbours: next room at the right edge, previous behind the left foliage.
- [ ] Fascia clean and dark.
- [ ] Safe zones within targets: room views §8; portrait §11; Arrival header zone calm and oculus requirements met.

**Clean pixels**
- [ ] No text, labels, numbers, logo, UI, Breeze or watermark. Check at 200% zoom.
- [ ] No vignette, flare, grain, motion blur or shallow depth of field.
- [ ] No render artefacts: fireflies, smearing, banding.

**File**
- [ ] Resolution and aspect: desktop exactly 3344×1882; portrait 1290×2796 or a higher equivalent at the same aspect (§13.1).
- [ ] Lossless PNG/TIFF; not web-optimised.
- [ ] Entry present and complete in the final `world-atrium-cameras.json`.

### Per transition pair

- [ ] Occluder present in both views at the positions confirmed in Phase 1 (§9).
- [ ] Background shift right → left for **every** step, including Arrival → Living.
- [ ] `steps[].deltaAngleDeg` all the same sign under the documented convention.
- [ ] No impossible differences: moved furniture, wrong neighbour, mirrored foreground.

### Set level

- [ ] 5 desktop + 5 portrait masters + final camera JSON.
- [ ] Bathroom included.
- [ ] Phase 1 and Phase 2 approvals on record before this render.

---

## 16. After final delivery (for information; not part of the commission)

1. **Acceptance:** we run §15, overlay adjacent views to check alignment, and measure the safe zones and lightness targets.
2. **Optimisation:** WebP variants; per-view crop anchors and motion timing from the camera data (`steps` → transition lengths).
3. **Tier B implementation** on the existing homepage scroll timeline, with HTML titles, fascia labels, thumbnail, counter and room-specific "EXPLORE THIS ROOM" links.
4. **Escalation, only if web QA shows visible transitions:** §12.2, then §12.3.

Nothing is implemented before the final plates pass acceptance.
