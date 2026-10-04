# TP3D PASS 10 — Room 02 / Objects

PASS 10 opens the second real room of the World, `/world/objects`. It is a
cabinet of object studies built from the product data that already exists.

- **A different room.** The Gallery hangs spaces on walls. Objects sets things
  down on plinths and tables, with documentation labels for form, material and
  size.
- **Honest status.** The room is open, but no digital asset is available yet.
  It says so in plain words and offers no viewer, no fake control and no
  marketplace.

Rules come from [TP3D-DESIGN-SYSTEM.md](TP3D-DESIGN-SYSTEM.md). This pass adds
§9 rules 18 and 19. The previous pass is
[TP3D-PASS-09-WORLD-UX.md](TP3D-PASS-09-WORLD-UX.md).

| Item | Value |
| --- | --- |
| Date | 2026-10-04 – 2026-10-05 |
| Starting HEAD | `01f446f` — feat(world): polish World navigation and viewing chamber UX |
| Added | `app/world/objects/page.tsx`, `components/world/world-objects.tsx`, `components/world/world-objects.css`, `data/world-objects.ts`, `yarn check:objects-room` |
| Changed | `data/world-building.ts` (Objects available at `/world/objects`, comments); `world-chrome.css` (shares tokens, links and focus with the room); `gallery-reveal.tsx` / `gallery-depth.tsx` (selector props, Gallery defaults unchanged); contract updates in `check-gallery`, `check-site`, `check-world-gateway`, `check-world-shell` |
| Not changed | `/products`, `/products/[slug]`, every product component, `lib/product-assets.ts`, `data/products.ts`, `data/types.ts`, `/worlds`, the Gallery's composition, the chamber, the homepage, the route model beyond the new room |
| Not introduced | Sketchfab ids, GLB files, model metadata, marketplace links, a viewer, an iframe, canvas, Three.js, a new dependency, `?from=objects` |

How measurements were taken:

- **Environment.** Headless Chrome 154 on this Windows 11 workstation, against
  local production builds (`yarn build` + `yarn start` on :8787).
- **Baseline.** An exact `01f446f` build, from `git archive`, served on :8788
  next to it.
- **Browser QA** ran serially, one journey and one viewport per process, with
  bounded steps (§30).
- Reduced motion was pinned explicitly (this machine reports `reduce`).
- This is not field data.

---

## 1. Starting state

At `01f446f` the World had one real room, the Gallery. Objects was a planned
wing: text in the Lobby and the World map, "Opening later", and no route. The
address `/world/objects` returned 404 (`check-site`'s reserved list).

## 2. Existing Product architecture discovered

- **`data/products.ts`** holds four object studies: Form Lounge Chair, Line
  Sofa, Round Coffee Table and Copper Pendant. Each has a category,
  collection, description, concept dimensions, material and one photograph.
- **The schema is ready for digital assets** (`Product.asset`): viewer,
  marketplace, poster, formats, software, textures, polygon count, vertices,
  UV, real-world scale, file size and version. Every current product has
  `asset.available: false`.
- **`imageRole`** (`'reference' | 'model-render'`) exists; no product sets it
  yet.
- **`/products` and `/products/[slug]`** are the editorial collection and
  object detail. The asset layer (`resolveProductAsset`,
  `ProductAssetSections`, the product `SketchfabViewer`, model information)
  renders only for an available asset, so it renders nothing today.
  `check:assets` covers it.

## 3. Why Room 02 opens without fake 3D

The room opens because the object studies exist. Their digital models do
not, and the room says exactly that.

- **No fabricated data:** no Sketchfab id, GLB, download, marketplace URL or
  model metadata.
- **Status, not a control.** Each study reads "Digital model · in
  preparation" as plain text, from `asset.available`.
- **Ready for real assets.** A future available asset reads "3D asset ·
  available" with no redesign. Viewing and acquisition belong to the object
  detail, never to the room.

## 4. Route architecture

| Route | Role |
| --- | --- |
| `/world` | The Lobby |
| `/world/gallery` | Room 01 — Gallery: spaces |
| `/world/objects` | Room 02 — Objects: object studies (new) |
| `/worlds` | 3D environment catalogue (utility) |
| `/worlds/[slug]` | environment detail; Gallery chamber with `?from=gallery` |
| `/products` | editorial object collection |
| `/products/[slug]` | editorial object detail |

- **One new route:** `world/objects/page.tsx`. No redirect, middleware or
  rewrite.
- **Untouched:** `/products` and its details are neither moved nor
  redirected.

## 5. Objects World-room status change

- **`worldRooms.objects`:** `planned` with `href: null` → `available` with
  `href: '/world/objects'`.
- **The other wings** keep their order and names. 01 Gallery and 02 Objects
  are available; 03 Archive, 04 Lab and 05 Studio stay planned with no route.
- **`data/world-building.ts`** comments now describe both real rooms and the
  three planned wings.

## 6. Curation

`data/world-objects.ts` holds only slugs and their order:
`form-lounge-chair`, `line-sofa`, `round-coffee-table`, `copper-pendant`.

- **Resolution.** `resolveObjectStudies` resolves them against `products` in
  curation order; this is the Gallery's pattern.
- **Missing slugs fail loudly.** An unknown slug is dropped by the resolver,
  and `check:objects-room` then fails on the count, so no object ever goes
  missing silently.

## 7. Product-data reuse

The room renders only what `data/products.ts` holds:

- title, category, collection;
- dimensions, material;
- image and alt text;
- the asset status.

Only the hero study also shows the product's description. The curation file
duplicates no field (`check:objects-room` scans for any). The study number
(`01 / 04`) derives from the curation order and its length.

## 8. Gallery vs Objects distinction

| | Room 01 — Gallery | Room 02 — Objects |
| --- | --- | --- |
| Content | spaces, interiors (`World`) | individual forms (`Product`) |
| Metaphor | walls, mounted works | drawers, plinths, specimen tables |
| Images | run off the edge, openings | inside the margins, plates in their own proportion |
| Label | exhibition label, "Enter exhibit" | documentation label: dimensions and material on rules |
| Way in | the 3D exhibit (`/worlds/[slug]?from=gallery`) | the object study (`/products/[slug]`) |
| Catalogue | `/worlds` | `/products` |

**Shared, not duplicated:** the World chrome, tokens, focus, the reveal
mechanism and the depth mechanism. The two islands now take the room's
selectors (§24). The visual design is not shared.

## 9. Room visual concept

A quiet design archive, in order:

1. **The room's name.** "Room 02" and Objects (Cormorant Spatial). Opposite:
   "04 object studies" and the statement "Form, material *and digital
   potential.*"
2. **The studies.** Each one is a drawer: a ruled edge carrying its number
   and what the photograph is ("Reference study"), then the plate and the
   label.
3. **One line of wall text:** "Each study is documented by form, material and
   size. Digital models open as they are prepared."
4. **The Object Index.**
5. **A quiet close:** "End of the room — Every object, *in the editorial
   collection.*", "View the full object collection →" and "← Back to Lobby".

**Photographs are honest.** They are framed and cropped as studies, never cut
out: no background removal, blend modes, masks or fake shadows.

## 10. Object 01

The Form Lounge Chair stands alone on the plinth.

- **Its photograph is a studio shot on white,** shown as a pale square plate
  on the dark ground rather than turned into a floating cut-out.
- **Placement (desktop):** a field of empty room to the left, the plate in the
  middle column at `min(100%, 56svh)`, and its label beside it on the same
  edge. The label holds the number, title, category and collection,
  description, dimensions and material on rules, the status line and "View
  object study →".
- **Measured at 1440×900:** plate 423–918 × 331–825. The whole first study
  sits in the first view at 1440, 1366, 1280 and 1180 (§18).
- **The only priority image** (`fetchpriority="high"`; the only preload).

## 11. Objects 02–04

- **Line Sofa (02),** a long table: the photograph in its own 16:9 across
  eight columns, the label in four columns beside it, on one edge.
- **Round Coffee Table and Copper Pendant (03, 04),** a staggered pair:
  portrait plates framed 4:5, in unequal columns (5 / 4 of 12), the second
  lowered by `clamp(96px, 16svh, 184px)`.
- **No grid of cards** and no equal tiles. All three images are lazy.

## 12. Object Index

`<nav aria-labelledby="world-objects-index">`, with an `<ol>` of real anchor
links (`#form-lounge-chair` …). Each row shows number, name and category, in
two columns on desktop and one on phones and in short landscape.

- **Targets:** rows are at least 56px tall.
- **Measured** with every anchor activated by keyboard:
  - each study lands at 154px from the top;
  - same document (no reload);
  - `:focus-visible` with a 1px ivory ring;
  - no duplicate id on the page.

## 13. Fragment navigation

Every study is `<article id={slug}>`. With the page's 100px scroll padding
and the study's `clamp(24px, 6svh, 72px)` scroll margin,
`/world/objects#line-sofa` and `#copper-pendant` land the study at 154px from
the top (1440×900).

- **Clear of the chrome:** it has scrolled away with the page.
- **No jump after decode:** the target measured the same at load and after
  2.5 s.
- **On the phone:** 151px at 390×844.

## 14. Asset-status language

| Data | Room text |
| --- | --- |
| `asset.available === false` | "Digital model · in preparation" |
| `asset.available === true` | "3D asset · available" (the product system's existing wording) |
| `imageRole === 'model-render'` | plate note "Model render" |
| otherwise | plate note "Reference study" |

- **Always plain text** (`<p data-asset-status>`): never a button, a disabled
  control or an `aria-disabled` link.
- **No shopping language.** No "Coming soon", "Unavailable", shop, buy or
  marketplace wording appears.

## 15. Editorial Product bridge

- **"View object study →"** goes to `/products/[slug]`, as a document
  navigation. The detail opens at its top in the editorial site, and browser
  Back restores the room at the exact scroll position. Measured for Form
  Lounge Chair (303 → 303) and Copper Pendant (2321 → 2321).
- **No return context.** No `?from=objects` and no history hack.
- **"View the full object collection →"** goes to `/products`.

## 16. Lobby change

The Lobby derives everything from `worldRooms`. The only change:

- the 02 Objects entry becomes a link ("Enter ↗", brighter rule, ivory type);
- the meta line reads "2 of 5 rooms open".

**Measured.** The rendered HTML is identical to `01f446f` apart from the
Objects entries and that count. A crop of the captures shows only those
pixels changed. `check-gallery` proves it on markup: the PASS 05 digest still
holds with Objects mapped back to planned, and today's Lobby differs only in
those entries and the count.

## 17. World Map change

- **Every World map now has two open rooms** (01 Gallery, 02 Objects) and
  three planned entries.
- **The current room is right everywhere:** Objects is "You are here" only in
  Room 02. In the Gallery and the chamber, Objects is a plain link.
- **Measured** on every page with the chrome: the Lobby, the Gallery, Objects
  and the Gallery chamber.
- **PASS 09 Escape holds:** Escape closes the map with focus back on the
  summary, and a second Escape does nothing.

## 18. Desktop

Settled first view: top–bottom px, or left, top, right, bottom for the plate.

| Viewport | Chrome bottom | "Room 02" top | h1 | First plate | Label |
| --- | --- | --- | --- | --- | --- |
| 1440×900 | 83 | 110 | 141–231 | 423, 331, 918, 825 | 413–825 |
| 1366×768 | 78 | 101 | 133–218 | 421, 308, 851, 738 | 329–738 |
| 1280×720 | 78 | 100 | 131–211 | 394, 320, 798, 724 | 297–724 |

- **Clear of the chrome:** the room's title always sits below it.
- **The first study fits** in the first view at all three sizes.
- No horizontal overflow; every target is at least 44px.

## 19. Tablet

| Viewport | Chrome bottom | "Room 02" top | First plate | Label |
| --- | --- | --- | --- | --- |
| 1180×820 | 78 | 103 | 347, 319, 752, 725 | 302–725 |
| 820×1180 | 108 | 140 | 44, 517, 455, 928 | 481–928 |

- **Asymmetry kept.** At 1180 the desktop composition holds. Tablet portrait
  puts the plinth plate and label side by side (7 / 5), stacks the long
  table, and keeps the pair in unequal columns.
- No hover dependency.

## 20. Mobile

| Viewport | First plate | Label |
| --- | --- | --- |
| 390×844 | 22, 397, 368, 743 | 765–1188 |
| 360×740 | 22, 389, 338, 705 | 727–1149 |

- **One column in reading order:** title, study 01 and its label, through
  study 04, then the index and the close.
- **Large images:** each plate is full width (346px at 390).
- 44px targets, no pointer depth, normal document scroll, no horizontal
  overflow.

## 21. Short landscape

| Viewport | Chrome bottom | "Room 02" top | First plate |
| --- | --- | --- | --- |
| 844×390 | 68 | 88 | 46, 264, 347, 566 |
| 740×360 | 68 | 88 | 40, 367, 303, 630 |
| 667×375 | 68 | 88 | 36, 361, 272, 597 |

- **Room for the title:** 68px chrome, then a 20px gap and the title. The
  first study is not forced to fill the screen: the plate leads, its label
  beside it.
- **Stacked and single-column:** the long table stacks; the index is one
  column.
- **Scrolling:** the room scrolls as a page.

## 22. Reduced motion

Measured at 1440×900, 390×844 and 844×390:

- No study is ever marked pending, and the reveal never runs.
- No arrival animation (`animation-name: none` under the global kill switch).
- The image transform stays `none`: no pointer depth.
- Fragments land normally (154px at 1440, 151px at 390), and map Escape works
  unchanged.

**With motion,** a study skipped by a jump (Object Index or a direct
fragment) reveals as soon as it comes into view. Measured at 740×360, 667×375
and 1440×900: no study is ever stranded invisible on screen.

## 23. Accessibility

- **Structure:** one `h1` (Objects), an `h2` per study, `<article
  aria-labelledby>` per study, and one `main`.
- **Landmarks:** one header (the World chrome); the Object Index is `<nav
  aria-labelledby>`; the close is `<nav aria-label="Leave Objects">`.
- **Images:** the real alt text from the product data.
- **Links:** one real link per study; the plate is an image, not a second
  link.
- **Status is text,** never a fake disabled control.
- **Focus:** World rings on flat ground. A focused study link marks its plate
  with the PASS 09 ring on a mat (2px ivory on a 4px ground mat).
- **Order and targets:** the DOM order matches the visual order; targets are
  at least 44px (index rows 56px).

## 24. Performance

- **Bundle** (raw / gzip) against `01f446f`:

  | | `01f446f` | PASS 10 |
  | --- | --- | --- |
  | All JS | 1,234,280 / 358,610 B | 1,234,781 / 358,678 B (+501 / +68) |
  | All CSS | 293,138 / 54,524 B (11 files) | 303,727 / 57,110 B (+10,589 / +2,586; 12 files) |
  | Room 02 stylesheet (new) | — | 10,527 / 2,571 B |
  | `gallery-reveal` chunk | 1,049 / 566 B | 1,051 / 584 B |
  | `gallery-depth` chunk | 400 / 282 B | 430 / 305 B |

- **No new client JS.** Room 02 loads the same 16 JS chunks as the Gallery;
  the room itself is server-rendered.
- **Client code:** the shared reveal (one `IntersectionObserver` that
  unobserves each study once shown), one study's pointer depth, and the World
  map's Escape island.
- **Idle frames:** page RAF is 0 at rest at all ten viewports.
- **Depth on a fine pointer:**
  - 19 frames while the pointer moves, 0 within 1.8 s of leaving;
  - the photograph shifts at most −1.1 / −3.3px, at scale 1.015;
  - label and plate stay still.

## 25. Network results

**Cold cache, resting page:**

| Page | `01f446f` | PASS 10 |
| --- | --- | --- |
| `/world/objects` 1440×900 | (404) | 34 req / 508,064 B: 4 images, 0 external |
| `/world/objects` 390×844 | (404) | 32 req / 363,527 B: 2 images (two lazy, not yet requested), 0 external |
| `/world` 1440×900 | 29 / 581,506 | 29 / 581,549 |
| `/world/gallery` 1440×900 | 34 / 450,786 | 34 / 450,915 |
| `/products` 1440×900 | 51 / 1,739,147 | 51 / 1,739,186 |
| `/products/form-lounge-chair` 1440×900 | 43 / 1,021,842 | 43 / 1,021,882 |

- **Room 02 asks nothing of the 3D stack:** 0 requests to `sketchfab.com`,
  `fab.com`, any GLB/glTF or a Three.js chunk. No iframe, canvas or WebGL
  context.
- **Images:**
  - at 1440: `chair-720`, `sofa-1280`, `table-720`, `pendant-720`, each
    requested once;
  - one `fetchpriority="high"` image and one preload;
  - every image has width and height.

## 26. First-paint results

**Throttled cold loads** (CPU 4×, 150 ms latency, 1.6 Mbps, cache off),
starting from a page already painted `#1c1712`, every screencast frame:

| Viewport | Frames | First content | Ivory in header band (first / +50 / +100 / +250 ms / settled) | Ivory outside the first plate (max) |
| --- | --- | --- | --- | --- |
| 1440×900 | 64 | 1,041 ms | 0 / 0 / 0 / 0 / 0 | 0.0000 |
| 390×844 | 66 | 1,046 ms | 0 / 0 / 0 / 0 / 0 | 0.0106 |
| 844×390 | 64 | 1,053 ms | 0 / 0 / 0 / 0 / 0 | 0.0001 |

- **The only ivory is the chair photograph's white studio ground.** It
  reaches 0.75–0.84 of the plate area. The 0.0106 at 390 is a strip exactly
  the plate's width, below its settled box: the plate during its arrival.
- **No ivory page flash,** no header or footer flash (both are absent on
  World paths).
- **CLS** (layout-shift observer from the first byte, cold): 0 at 1440×900,
  390×844 and 844×390.

## 27. Product regression

**Served HTML is identical to `01f446f`** for `/products` and all four product
details. This holds after normalizing chunk hashes, client-module ids and
the per-build `deploymentVersion`. The pages load the same stylesheets with
identical content.

**Product files digest-locked** by `check:objects-room`:

- `ProductDetail`, `ProductAssetSections`, the product `SketchfabViewer`,
  `AssetAvailability`, `ModelInformation`, `product-assets.css`;
- `lib/product-assets.ts`;
- `data/products.ts`, `data/relationships.ts`, `data/types.ts`;
- both `/products` routes and `ObjectSelection`.

**In the browser:** each object study opens with the editorial header, no
World chrome, no iframe, no "3D ASSET · AVAILABLE", and "← All objects" to
`/products`. `check:assets` and `check:content` pass.

**Pixel captures** of `/products` match wherever both servers had delivered
the images. Two captures of the same build are identical. One cross-server
difference was an image placeholder that the baseline server had not yet
filled.

## 28. World regression

- **`/world`:** only the Objects entry and the count (§16).
- **`/world/gallery`:**
  - every settled capture at 1440, 820, 390 and 844×390 is within 8/255 of
    `01f446f`;
  - only the World-map-open frames differ, in one row: the Objects entry now
    reads "Enter ↗";
  - rendered HTML is identical apart from that entry.
- **The Gallery chamber** (`/worlds/modern-kitchen?from=gallery`): captures
  within 3/255; HTML identical apart from the Objects entry.
- **Unchanged:** `/worlds`, `/worlds/modern-kitchen` and the homepage serve
  identical HTML.

## 29. Automated tests

`yarn check:objects-room` (`scripts/check-objects-room.mjs`) renders the real
room, its chrome and the Lobby to markup.

| # | Requirement | How |
| --- | --- | --- |
| 1–6 | route, one h1, World path, no own suppression, one chrome, Objects current | rendered room, page source |
| 7–12 | building statuses; Lobby derives Objects (open and, when mapped back, text); no hard-coded link | rendered Lobby with both datasets |
| 13–22 | slugs only; every slug resolves, in order; facts from the product; status from `asset.available` both ways; nothing falsely available; plate note from `imageRole` | rendered room with real and modified data |
| 23–28 | one link per study to `/products/[slug]`; index anchors resolve; unique ids; `/products`; Back to Lobby; Exit | rendered room |
| 29–35, 39 | no iframe, canvas, button, disabled state, Sketchfab, Fab, GLB or Three.js; no product-asset code; no shopping language | markup + code scans |
| 36–38 | one h1, h2 per study, index is `<nav>` | rendered room |
| 40–45 | 44px / 56px targets, phones single-column, short-landscape title clearance, reduced motion, depth (one study, desktop fine pointer, image only, ≤4px, ≤1.02), token timings | parsed CSS + sources |
| 46–56 | product files digest-locked; one new route; no middleware or redirect; dependency set unchanged; existing commands wired | digests, route inventory |

**Existing tests updated deliberately, with no assertion removed:**

- **`check-world-gateway`:** two open rooms, and `/world/objects` is a World
  path.
- **`check-gallery`:** the room statuses; the Gallery map links Objects
  without making it current; the PASS 05 Lobby digest holds with Objects
  mapped back; today's Lobby differs only in the Objects entries and the
  count.
- **`check-site`:** a `/world/objects` served-HTML block; `/world/objects`
  retained and crawled; `/world/archive` replaces it among the reserved 404
  addresses.
- **`check-world-shell`:** the route inventory includes Room 02.

**Mutation checks.** Twenty-two deliberate regressions each fail
`check:objects-room`:

- Objects still planned;
- Archive opened;
- an unknown slug;
- duplicated metadata;
- a reordered curation;
- a hard-coded status;
- a fake 3D control;
- a viewer in the room;
- a wrong link;
- an index without anchors;
- no collection bridge;
- every image priority;
- a chrome without the current room;
- two h1s;
- depth on every study;
- strong depth;
- a small target;
- two-column phones;
- raw easing;
- an edited product detail;
- a hard-coded Lobby link;
- changed Gallery reveal defaults.

## 30. Browser/journey QA

**Serial harness.** The `qa10.mjs` harness runs one journey at one viewport
per process.

- Every step is logged before and after (e.g. `[Objects QA] 1440x900
  objectIndex 3/5 index → #line-sofa by keyboard ok (1032 ms)`).
- Every CDP call is capped at 20 s and every navigation at 30 s.
- Every step is capped at 20 s, every journey at 90 s (a watchdog that kills
  the browser and records URL, DOM, console and pending requests), and every
  process at 120 s.

| Journey | 1440×900 | 390×844 | 844×390 |
| --- | --- | --- | --- |
| A. Direct `/world/objects` (ground, no editorial chrome, one chrome, Objects current, h1, top, no overflow) | pass | pass | pass |
| B. Lobby → 02 Objects (Objects open, three planned, map current) | pass | pass | pass |
| C. Object study round trip, Form Lounge Chair and Copper Pendant (editorial detail unchanged; Back restores the exact scroll) | pass | pass | pass |
| D. Fragments `#line-sofa`, `#copper-pendant` (visible, clear of the chrome, no jump after decode) | pass | pass | pass |
| E. Object Index, all four anchors by keyboard (target, focus ring, same document, unique ids) | pass | pass | pass |
| F. World map: Escape closes without navigation, second Escape inert, Objects → Gallery, Gallery → Objects | pass | pass | pass |
| G. Back to Lobby | pass | pass | pass |
| H. Exit to website (editorial header returns) | pass | pass | pass |
| Collection bridge → `/products` | pass | pass | pass |

**Further runs:**

- Visual captures at all ten viewports: arrival 250 ms, settled, studies 02,
  03/04, index, close, map open, keyboard focus, idle RAF.
- Depth: fine pointer, coarse pointer, reduced motion.
- Reduced motion at three viewports.
- Reveal after a jump at three viewports.
- CLS at three viewports.

All pass, with no console errors.

**Four harness bugs were found and fixed** during the rerun; none was an
implementation bug.

1. **A "before" scroll recorded too early.** `tap()` scrolled the link into
   view after the position was read.
2. **A direct fragment load opened as a same-document hash change,** which
   fires no load event. It now starts from `about:blank`.
3. **The arrival's identity matrix read as movement.** It is
   `matrix(1, 0, 0, 1, 0, 0)`, not `none`.
4. **A first-paint probe assumed the editorial header exists.** It doesn't
   on World pages.

**The earlier QA hang.** The old CDP helper had no timeouts: `goto()` waited
for `Page.loadEventFired` forever, and no call had a deadline. The batch's
third journey, `/world/objects#copper-pendant` loaded while the page was
already at `/world/objects`, was a same-document hash change. It never fires
a load event, so the batch waited indefinitely; buffered output hid its
progress.

## 31. Known issues

1. **A white-ground photograph on a dark room.** The hero study's photograph
   is a pale square on the World ground, shown honestly as a plate. A future
   model render could replace it through `imageRole` without changing the
   room.
2. **Reference photography.** Every plate reads "Reference study". The table
   and sofa photographs show their objects in a room, not isolated.
3. **No return context.** Object details keep their editorial "← All objects";
   browser Back is the way back to Room 02. Cross-shell context is PASS 11's
   to decide.
4. **The Lobby summary says "3D objects & models",** the room's long-term
   description. Every study states its real asset status.
5. **Carried forward:**
   - `:has()` support in legacy browsers;
   - the catalogue's extra stylesheets from the static import graph;
   - the deferred canonical metadata.
6. **Measurement scope.** Headless desktop Chrome with emulated phones and
   touch. No Safari, Firefox, real devices or field data.

## 32. PASS 11 boundary

**PASS 10 delivers** Room 02: a real, truthful room of object studies, built
from the product data, linked to the editorial collection.

**Stable contracts:**

- `/world/objects`.
- `worldRooms.objects` available.
- `data/world-objects.ts` (slugs only).
- `data-object-specimen` and fragment ids.
- The asset-status wording.
- Design-system §9 rules 18–19.
- `yarn check:objects-room`.

**Not started:**

- Objects detail World-shell integration;
- a new object viewer, Sketchfab assets or a marketplace;
- Archive, Lab, Studio;
- Lobby, Gallery or Objects GLB.

**PASS 11 is to be chosen after review.** A likely direction is the object
study in the World shell, analogous in principle to PASS 07/08 for the
Gallery and adapted to Product semantics. Not assumed.
