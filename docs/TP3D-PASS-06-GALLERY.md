# TP3D PASS 06 — Room 01 / Gallery

The first real room inside the TP3D World: `/world/gallery`, a curated
exhibition of digital interiors. It is a production 2.5D room shell made from
existing world data and photographs. It has no Gallery GLB, no WebGL and no
viewer. Exhibits open the existing `/worlds/[slug]` 3D worlds, and the full
`/worlds` catalogue stays the browse-and-search utility, reached from the end
of the room.

Rules come from [TP3D-DESIGN-SYSTEM.md](TP3D-DESIGN-SYSTEM.md); this pass adds
§9 rule 13, "World rooms are experiential; catalogues are utilities". The
previous pass is [TP3D-PASS-05-WORLD-GATEWAY.md](TP3D-PASS-05-WORLD-GATEWAY.md).

| Item | Value |
| --- | --- |
| Date | 2026-10-04 |
| Starting HEAD | `e55565e` — feat(world): add Enter the World gateway and Lobby foundation |
| Added | `/world/gallery` (`app/world/gallery/page.tsx`, `components/world/world-gallery.tsx` + `.css`); `data/world-gallery.ts` (curation: slugs only); `WorldChrome` + `world-chrome.css` (extracted from the Lobby); two client islands, `GalleryReveal` and `GalleryDepth`; `yarn check:gallery`; a small server-component renderer for checks (`scripts/lib/render-server-component.mjs`) |
| Changed | Room 01's `href` `/worlds` → `/world/gallery` (and its description); the Lobby now renders the shared chrome; a wrapper `<div data-world-page>` on both World pages; `check-world-gateway` and `check-site` follow the new contract |
| Not changed | Lobby visuals, portal, typography, room layout, World map design, Exit, arrival animation, plate; `/worlds` and its query/fragment behaviour; `/worlds/[slug]`; `/experience/[slug]`; the homepage source |
| Not introduced | Canvas, WebGL, Three.js, Sketchfab request or iframe on the Gallery; GLB; new font; animation library; global state; sticky scroll stage; carousel; sessionStorage dependency |

How measurements were taken:

- Headless Chrome 154 on this Windows 11 workstation (RTX 3090), against
  local production builds (`yarn build` + `yarn start`).
- The Lobby baseline was captured from the `e55565e` build before any change:
  - screenshots at 7 viewports, reduced and motion, with the World map
    closed and open;
  - every element's computed style and box;
  - the server HTML for `/worlds` (with queries), the detail pages and
    `/world`.
- Reduced motion was pinned explicitly (this machine reports `reduce`).
- Focus behaviour used `Emulation.setFocusEmulationEnabled`, touch used
  `Input.dispatchTouchEvent`.
- This is not field data.

---

## 1. Why Room 01 is built before Lobby 3D

- **No Lobby asset yet.** There is still no approved Lobby GLB or
  environment. PASS 05 ruled that the Lobby gets WebGL only with a real
  asset, never as a procedural placeholder.
- **The Gallery already has its exhibits.** Four curated worlds exist, with
  photographs, labels and working 3D detail routes. Building the room
  improves the journey now with honest material.
- **It fixes the PASS 05 bridge.** "Enter" on Room 01 dropped the visitor
  out of the World into the editorial catalogue. Now the World has a real
  room, and the catalogue is reached deliberately from inside it.
- **It tests the World's structure.** Two pages now share one chrome, and
  room routes sit under `/world/`. A future Lobby environment will rely on
  both.

## 2. Route architecture

| Route | Responsibility |
| --- | --- |
| `/world` | The Lobby: the building directory (PASS 05) |
| `/world/gallery` | **Room 01, Gallery**: a curated exhibition inside the World (new) |
| `/worlds` | The full 3D catalogue: search, categories, sort, fragments (unchanged) |
| `/worlds/[slug]` | One 3D world: poster, depth, ENTER 3D WORLD, Sketchfab after a click (unchanged) |
| `/world/objects`, `/archive`, `/lab`, `/studio`, `/world/gallery/[slug]` | Not built; they return 404 (`check-site` asserts `/world/objects` and `/world/gallery/modern-kitchen`) |

Journey:

```
/world  →  /world/gallery  →  exhibit  →  /worlds/[slug]
   ↑            │
   └ Back to    └ View full 3D catalogue  →  /worlds
     Lobby
```

There are no redirects. `/worlds?category=…`, `/worlds#slug` and
`/worlds/[slug]` keep their URLs and their metadata.

## 3. Gallery vs catalogue responsibility

| | Gallery (`/world/gallery`) | Catalogue (`/worlds`) |
| --- | --- | --- |
| Purpose | An exhibition: a few works, hung | Everything, found fast |
| Selection | Curated slugs, in curation order | Every world, filtered and sorted |
| Chrome | The World: identity, Back to Lobby, World map, Exit | The editorial site header and footer |
| Composition | Mounted photographs at varied scale, exhibition labels, negative space | A grid of cards, a toolbar, pagination |
| Language | Room 01, exhibit 01 / 04, "Enter exhibit" | Search, categories, "VIEW MODEL" |
| Grows by | Curation decisions | Data |

The page never explains this in a paragraph. The difference shows in the
design: the Gallery is dark, slow, numbered and hung, and its last word is a
quiet "View full 3D catalogue". Rule 13 in the design system keeps it that
way.

## 4. Lobby Gallery href update

| | Before (PASS 05) | After (PASS 06) |
| --- | --- | --- |
| `worldRooms[0].href` | `/worlds` | `/world/gallery` |
| Lobby directory and World map link | `/worlds` | `/world/gallery` |
| Other rooms | planned, `href: null` | unchanged |

The Lobby is otherwise identical, measured four ways:

1. **Computed styles and boxes.** At 7 viewports, reduced and motion, map
   closed and open, every element's computed style and box equals the
   `e55565e` baseline. The only differences are the two Gallery hrefs
   (directory and map) and the new wrapper element.
2. **Pixels.** Identical. A few captures differ by at most 2/255, and so do
   two runs of the same build, so that is photo raster noise.
3. **Markup.** With the Gallery href mapped back to `/worlds`, the Lobby
   component renders byte-identical markup to the PASS 05 component (digest
   `33b98ff20947d884`, locked in `check-gallery`).
4. **CSS.** Every one of the Lobby's 257 declarations survives the
   chrome/Lobby split. The additions are only back-link, current-room and
   Gallery rules.

## 5. Gallery visual concept

A long, dark exhibition room on the World ground (`--world-ground`):

```
[ World chrome ]
ROOM 01                    ┌──────────────────────────── (runs off the edge)
Gallery                    │  EXHIBIT 01 — the opening
Digital interiors,         └────────────────────────────
in exhibition.             01 / 04  Modern Kitchen      a sentence · medium · Enter exhibit
EDITION 2026 · 04 INTERIORS

            STEP INSIDE EACH INTERIOR IN THREE DIMENSIONS.
──────────────────────────────┐
(runs off the edge)  EXHIBIT 02 │   02 / 04  White Modern Living Room …
──────────────────────────────┘
   ┌────────┐
   │ 03     │        ┌───────────┐
   │portrait│        │ 04 square │   (dropped)
   └────────┘        └───────────┘
──────────────────────────────────────────────────────────────
END OF EXHIBITION
Every world, by room and style.      View full 3D catalogue →   ← Back to Lobby
```

- **Exhibit 01 is the room's opening.** It is the dominant photographic
  field, running off the right edge.
- **Exhibit 02 takes a wall** that runs off the left edge.
- **Exhibits 03 and 04 hang as a staggered pair.** The second drops, as in
  the editorial "gallery hanging" rule.
- **Mounting.**
  - The photographs are the existing world images in fixed frames with a
    stone mount (`--wg-mount: #2a221b`), so a frame is never a paper flash
    while decoding.
  - Frame ratios follow each world's authored `layout` (wide 16:9,
    landscape 3:2, portrait 4:5, square 1:1). The opening is 16:10, capped
    at 62svh.
- **Breeze is present only as stillness:** the slow, calm reveal of each
  frame. There are no clouds, cloth or atmosphere code.

## 6. World chrome

`components/world/world-chrome.tsx` is the one chrome for every World page.
It was extracted from the PASS 05 Lobby header.

```tsx
<WorldChrome />                      // the Lobby
<WorldChrome currentRoom="gallery" /> // a room
```

- **One prop.** Every room returns to the Lobby, so `currentRoom` alone
  adds "← Back to Lobby" (phones: "← Lobby") and marks the room on the
  World map.
- **The current room** stays a real link with `aria-current="page"`, an
  italic name and the status "You are here". Planned rooms remain text,
  never links.
- **Shared pieces.** The World map still reads `worldRooms`. `RoomEntry` and
  `roomStatus` are shared with the Lobby directory.
- **CSS.** `world-chrome.css` holds the shared World tokens, focus style,
  chrome, map and shared labels. `world-lobby.css` keeps only the Lobby
  place.
- **Narrow phones.** The room chrome carries one more control. Below 768px
  its wordmark scales (`clamp(26px, 8vw, 32px)`) and never wraps, and its
  gaps tighten. These rules apply to `.wl-chrome--room` only, so the Lobby
  is unchanged.
- **Scroll on arrival.** Both World pages wrap their content in a plain
  `<div data-world-page>`. vinext takes the page segment's first DOM node as
  its scroll target and skips scrolling when that node is a stylesheet
  hoisted into `<head>` (PASS 05 known issue 2). With a body element first,
  its own scroll-to-top works.
  - Measured at 360×740: from a Lobby scrolled to 86px, the Gallery opens at
    0.
  - Back to Lobby from deep in the Gallery opens the Lobby at 0.

## 7. Gallery arrival

Arrival is MEDIUM → LOW. There is no portal here: the Lobby → Gallery move
is a plain client navigation.

| Beat | Motion | Timing |
| --- | --- | --- |
| Ground | Already painted (`--world-ground` on `html`/`body`) | — |
| The opening (Exhibit 01's frame) | REVEAL: opacity + `clip-path: inset(0 0 0 6%)` → `inset(0)` | `normal` 650 ms from 80 ms |
| ROOM 01 | rise 10px | `fast` from 260 ms |
| Gallery (h1) | rise 10px | `normal` from 340 ms |
| Statement, edition | rise | `fast` from 520 / 600 ms |
| Exhibit 01 label | rise | `fast` from 760 ms |
| Stillness | — | from ≈1.2 s |

All durations and curves are motion tokens. After arrival nothing moves on
its own: idle RAF measured 0 callbacks per second in every mode.

## 8. Exhibit curation

`data/world-gallery.ts`:

```ts
export const galleryExhibitSlugs = [
  'modern-kitchen',
  'white-modern-living-room',
  'minimalistic-modern-bedroom',
  'modern-bathroom',
] as const;
export const galleryExhibits = resolveGalleryExhibits(galleryExhibitSlugs, worlds);
```

- **Order.** Curation is in authored catalogue order (`data/worlds.ts`), which
  is also its featured-first order. The Gallery starts with the first
  featured world.
- **Only slugs live in the curation.** Every title, image, alt, fact and
  description is the `World` object from `data/worlds.ts` itself; the check
  asserts object identity, not copies.
- **Tests fail** if a slug does not resolve, repeats, or adds a metadata key.
- **The Gallery stays curated.** It does not grow when the catalogue grows.
  Adding a world to the Gallery is a curation edit.
- **Unavailable worlds.** An `available: false` world would hang with "In
  preparation" and no link, never a fake one.

## 9. Exhibit layout

- **Placement comes from curation order, never from data.** Index 0 is
  `field` (the opening), 1 is `wall`, and the rest hang in `pair`s of two.
  An odd last exhibit hangs alone.
- **Exhibit markup.**
  - Each exhibit is an `<article aria-labelledby>`: a frame, then the label
    (`wg-label-head`: number, title, facts; `wg-label-body`: sentence,
    medium, link).
  - **One link per exhibit.** "Enter exhibit" is the only link. A
    pseudo-element extends its hit area over the photograph, so the image is
    clickable without a second link or a hidden duplicate. Focus outlines
    both the link and the frame.
- **Links are document navigations** (`<a href>`), like the catalogue's
  cards, for two reasons:
  - The 3D world opens at its top. `/worlds/[slug]` is a CSS-importing page
    that vinext would otherwise open at the Gallery's scroll depth.
  - Back returns to the same place in the room, as measured.
- "View full 3D catalogue" is a document navigation for the same reason
  (with a justified lint exception).

## 10. Exhibit metadata

An exhibition label, not a spec sheet. All of it comes from `World`:

| Line | Source | Example |
| --- | --- | --- |
| Number | curation index / total | `01 / 04` |
| Title (h2) | `title` | Modern Kitchen |
| Facts | `category · style · year` | Kitchen · Modern · 2026 |
| Sentence | `description` | A contemporary kitchen study shaped around material, light and everyday rituals. |
| Medium | `formats`, `textures`, `realWorldScale` | GLB · PBR textures · Real-world scale |
| Action | `available` → `/worlds/[slug]` | Enter exhibit ↗ (accessible name "Enter exhibit: Modern Kitchen") |

The edition line ("Edition 2026 · 04 interiors") is derived from
`worldsEdition` and the curation length. Model statistics, credits and
external links stay on the detail page.

## 11. 2.5D behaviour

| Concept | Where | Detail |
| --- | --- | --- |
| REVEAL | Arrival; exhibits below the first view | Frame opacity + `clip-path: inset(8% 0 0 0)` → `inset(0)` (`normal`); label rise 10px (`fast`, +70 ms). `GalleryReveal` marks only exhibits below the fold as pending, so server HTML and no-JS show everything |
| DEPTH | Exhibit 01 only, desktop tier only | `createPointerFollower` (its first user): the photograph moves up to 6px away from a mouse pointer and its mount up to 2px toward it. The image is scaled 1.025 for headroom. The follower settles and stops, and returns to rest on leave. Applied only at ≥1200px with a fine pointer and motion allowed |
| PARALLAX | Photographs in the sequence | Scroll-driven CSS (`animation-timeline: view()`, no script): ±1.2% drift inside the 1.025 scale. Only where supported and motion is allowed |
| MICRO | Links | Arrows nudge 3px (`micro`) on hover and focus |

No more than two depth planes are used in any composition (mount and
photograph). Nothing moves on its own after arrival. There is no PORTAL in
the Gallery.

Measured at 1440×900: a mouse at 70% across the opening put the photograph
at −4.3px and its mount at +1.4px; both returned to 0 on leave; 0 RAF
callbacks a second after settling.

## 12. Desktop

1440×900 and 1366×768:

- Entry: name on the left (`h1` at y 356 / 309, below the chrome at 83 /
  78px). The opening fills the right and runs off the edge, with 520 / 476px
  of it visible on arrival.
- Then the wall, the dropped pair and the close.
- Page height is 3,320 / 3,033px. There is no horizontal overflow and no
  target under 44px.
- Normal document scroll: no sticky stage and no pinning.

## 13. Tablet

- **1180×820:** the desktop hanging, tighter. `h1` at 332px, 426px of the
  opening visible; summaries 14px.
- **820×1180 (portrait):**
  - The name sits above the opening.
  - The wall runs off the left edge at 90% width.
  - The pair hangs vertically at 76% on the left and 70% on the right.
  - Asymmetry relaxes, but it never becomes a card grid.
- No hover dependency anywhere. The World map and Back to Lobby are always in
  the chrome.

## 14. Mobile

- **390×844 and 360×740:** a clean vertical exhibition.
  - Name block, then the opening full-bleed (244 / 225px visible on
    arrival), then each exhibit: image, number and title, facts, sentence,
    medium, and "Enter exhibit".
  - Labels are 10px at minimum, the sentence 14px.
- **Chrome.** It reads "tân phong ← Lobby · Map · Exit" on one line at 360.
  The World map panel fits.
- No hover and no pointer depth (touch does not drive the follower). Every
  target is 44px or taller. No horizontal overflow.
- **Short landscape (844×390, 740×360):**
  - The name and the opening sit side by side.
  - `h1` at 114 / 112px, clear of the 68px chrome.
  - The opening is capped at 58svh, so exhibits arrive without a tall hero.

## 15. Reduced motion

- **Removed:** arrival animations (global kill switch), pending reveals
  (`GalleryReveal` does nothing), pointer depth (media query and follower)
  and scroll drift (media query).
- **Measured at 1440 reduced:**
  - No depth transform on the image or mount.
  - No `animation-timeline`, no animation on the `h1`, no pending exhibits.
- **The composed room appears at once.** Links, map and focus behave the
  same.

## 16. Accessibility

- **Structure.**
  - One `<header>` (chrome) and `<main id="main">`, which the skip link
    targets.
  - One `h1` ("Gallery", from `worldRooms`), a labelled entry section and an
    "Exhibition" section.
  - Exhibits are `<article>`s labelled by their `h2`.
  - The close is a labelled `<nav>`.
- **Images.** Each image carries its World alt text and intrinsic size
  (1600×900).
- **Links.** Exhibit links are real anchors with unique names. There are no
  disabled or fake links and no `tabindex` tricks. Planned rooms in the map
  are text.
- **Keyboard order matches the visual order:** skip link, wordmark, Back to
  Lobby, World map, Exit, then exhibits 01–04, View full 3D catalogue, Back
  to Lobby. It was measured by tabbing at all 8 viewports. Focus is visible
  everywhere; an exhibit link also outlines its frame. The map is a native
  `<details>`.
- **Contrast.** All Gallery text sits on the solid World ground, never over a
  photograph. Full ivory measures 14.8:1; the 78% labels measure 9.3:1.
  `check-gallery` fails on text below 0.78 ivory or under 10px.
- No iframe and nothing autoplaying.

## 17. Performance

**`/world/gallery`** (cold cache):

| | 1440×900 | 390×844 |
| --- | --- | --- |
| Requests | 33 | 32 |
| Transferred | 449,826 B | 374,523 B |
| Images | 4, 119,092 B (Exhibit 01 at 1280w: 38,861 B) | 3, 43,790 B |
| JS | 19, 180,262 B | 19, 180,261 B |
| CSS | 5, 40,394 B (Gallery 2,675; shared chrome 1,511) | same |
| Fonts | 3, 102,205 B | same |

- **Lobby → Gallery** (warm, client navigation): 10 requests, 124,524 B at
  1440 and 9 requests, 49,221 B at 390. That is the RSC payload, the Gallery
  stylesheet, 2.8 KB of scripts (reveal, depth, pointer, capability), and
  the photographs.
- **Images.**
  - Only Exhibit 01 is priority-loaded (one image preload, `fetchpriority`
    high, eager). The rest are lazy with srcset 720/1280/1600 and fixed
    frames, so there is no layout shift.
  - No Sketchfab, iframe, model, Three.js or external request was observed
    at any of the 8 viewports.

**Build** (all routes, raw / gzip):

| | PASS 05 | PASS 06 |
| --- | --- | --- |
| JS | 1,227,748 / 355,557 B | 1,231,879 / 357,439 B (+4,131 / +1,882) |
| CSS | 275,191 / 49,929 B | 285,175 / 52,920 B (+9,984 / +2,991) |

**Side effects on other routes** (cold cache):

- `/world`: 28 requests, 580,620 B (+1 request, +1,204 B). The chrome
  stylesheet is now shared.
- Homepage: 48 requests, 1,603,977 B (+2, +1,567 B). `lib/motion/capability`
  and `lib/motion/pointer` were used only by the homepage's `hero-depth`;
  now the Gallery shares them, so the bundler splits them into two shared
  chunks (495 B and 905 B). The homepage source, behaviour and Three.js
  chunk are unchanged.

## 18. Catalogue compatibility

- `/worlds` source, metadata, toolbar, filters, sort, pagination and
  fragments are unchanged. `yarn check:worlds` passes.
- `check-gallery` locks `readWorldQuery`, `selectWorlds` and
  `writeWorldQuery` behaviour, including category, search, sort and unknown
  categories.
- The route crawl passes for `/worlds`.
- The server HTML for `/worlds`, `/worlds?category=kitchen` and
  `/worlds?q=minimal&sort=az` is identical to `e55565e` once build-hashed
  asset names and the per-build deployment ID are normalised.

## 19. Detail route compatibility

- `/worlds/[slug]` is untouched. It keeps the poster, 2.5D pointer depth,
  explicit ENTER 3D WORLD, the Sketchfab iframe only after a click, world
  switching, info and credits. The server HTML of `/worlds/modern-kitchen`
  and `/worlds/modern-bathroom` is identical to `e55565e` under the same
  normalisation.
- From the Gallery, the detail page opens at its top with no iframe. Back
  returns to the Gallery's scroll position (measured at 1440 and 360).
- **No source hint is stored.** The detail page's existing
  `tan-phong-world-origin` key holds a slug from the catalogue cards and is
  cleared on arrival without being used. A Gallery hint would be a write
  nobody reads, so none was added. The detail breadcrumb and Escape still
  lead to `/worlds` (see §22).

## 20. Tests

`yarn check:gallery` (`scripts/check-gallery.mjs`) renders the real server
components, `WorldGallery`, `WorldChrome` and `WorldLobby`, to static markup
with `react-dom/server`. It also checks data, CSS and source contracts.
`check-site` checks the served HTML.

| # | Requirement | Where |
| --- | --- | --- |
| 1 | `/world/gallery` exists, with metadata; no sub-routes | `check-gallery` (route files), `check-site` (200, title, 404 for `/world/gallery/modern-kitchen`) |
| 2 | Exactly one h1 | markup + served HTML |
| 3 | `isWorldPath('/world/gallery')` | `check-gallery`, `check-world-gateway` |
| 4 | No SiteHeader/SiteFooter | served HTML (`check-site`), browser |
| 5–7 | World chrome; Back to Lobby → `/world`; Exit → `/` | markup + served HTML |
| 8–9 | World map from `worldRooms`; Gallery `aria-current="page"` | markup + served HTML |
| 10–11 | Gallery href `/world/gallery`; other rooms planned/null | data |
| 12–16 | Exhibits derive from `worlds` (object identity); no duplicated metadata keys; every slug resolves; order deterministic; all four worlds | data + source |
| 17 | Exhibit links `/worlds/[slug]` | markup + served HTML |
| 18–21 | No iframe, canvas, Three.js, Sketchfab, model or extra preload (exactly one image preload) | markup, source scan, browser network |
| 22 | Full catalogue → `/worlds` | markup + served HTML |
| 23–24 | `/worlds` query/filter behaviour and `/worlds/[slug]` unchanged | catalogue functions, route sources, `check:worlds`, `check-site` |
| 25 | Lobby markup equals PASS 05 apart from the Gallery href | digest lock + browser style/pixel comparison |
| 26 | Planned rooms remain non-links | markup (map) + served HTML |
| 27–28 | Direct load and refresh | browser (both render at scroll 0); server-rendered page |
| 29 | Keyboard navigation | link order in markup; browser tab order at 8 viewports |
| 30 | Reduced motion has no decorative depth | CSS media guards; browser probe |
| 31 | Mobile has no overflow | CSS; browser at 8 viewports |
| 32 | Targets ≥ 44px | CSS; browser scan |
| 33 | Images have dimensions and stable frames | markup (1600×900), CSS aspect ratios |
| 34 | No unexpected external requests | markup (no absolute URLs); browser network |
| 35 | Production build | `yarn build`, `yarn build:vercel` |

`check-world-gateway` was updated for the refactor without weakening it:

- The single-source checks span the Lobby directory and the shared chrome.
- The no-WebGL scan now recurses into `app/world/gallery`; planting a
  `<canvas` in any Gallery file fails it.
- The 44px and legibility checks cover both stylesheets.

**Mutation checks.** Ten deliberate regressions each fail `check-gallery`:
the href reverted, `aria-current` removed, an unknown slug, a duplicated
metadata key, every image prioritised, a Lobby chrome text change, depth
without its reduced-motion guard, an iframe, a target under 44px, and
swapped placements.

## 21. Visual QA

**Gallery** at 1440×900, 1366×768, 1180×820, 820×1180, 390×844, 360×740,
844×390 and 740×360, with motion; reduced motion at 1440, 390 and 844.
Captured: arrival (250 ms and settled), three stops through the room, the
end, the World map open, and keyboard focus.

**Journeys** at 1440×900 and 360×740:

| Journey | Result |
| --- | --- |
| Direct `/world/gallery`, refresh | Renders at 0, no site chrome |
| Lobby → Gallery | `/world/gallery` at 0, also from a scrolled Lobby |
| Gallery → exhibit | `/worlds/<slug>` at 0, no iframe; Back restores the Gallery position |
| Gallery → full catalogue | `/worlds` at 0 with its 4 cards; Back restores the position |
| Gallery → Lobby (end link or chrome) | `/world` at 0 |
| Gallery → Exit | `/`, story progress 0 |

**Defects found and fixed in QA:**

- A paragraph reset outranked every class margin, so the statement touched
  the `h1` descender.
- The room chrome wrapped the wordmark onto two lines at 360px.

Screenshots stay local (scratchpad) and are not committed.

## 22. Known issues

1. **The detail page does not know the Gallery.** Its breadcrumb "3D WORLDS"
   and Escape lead to the catalogue, not back to the Gallery; browser Back
   does return. PASS 07 owns the exhibit relationship.
2. **Leaving the World uses the editorial chrome.** `/worlds` and
   `/worlds/[slug]` carry the editorial header and footer, by design.
3. **Two homepage requests.** Two small shared chunks (+1,567 B) now load on
   the homepage (§17).
4. **Back to the homepage starts at the top.** This applies to Exit from any
   World page, as already noted in PASS 05.
5. **Lazy images inside the loading window.** At 1440×900 all four exhibit
   images load on arrival because the page fits Chrome's lazy-loading
   distance; at 390 three do.
6. **Scroll drift needs scroll-driven animations** (Chromium today).
   Elsewhere the photographs simply hold still.
7. **Measurement scope.** Headless desktop Chrome with emulated phones and
   touch. No Safari, Firefox, real devices or field data.
8. **Placeholder photography.** The exhibit photographs are the existing
   catalogue renders. A dedicated exhibition still set
   (`World.gallery`, unused) would let the room vary its views.

## 23. PASS 07 boundary

**PASS 06 delivers** Room 01 as a working, data-driven exhibition room, the
shared World chrome, and a clear route contract.

**Stable contracts.** PASS 07 must not rename these:

- Routes `/world`, `/world/gallery`, `/worlds`, `/worlds/[slug]`.
- `galleryExhibitSlugs` (slugs only); `WorldChrome({ currentRoom })`.
- Hooks: `data-world-page`, `data-world-gallery`, `data-gallery-exhibit`,
  `data-gallery-depth`, `data-placement`, `data-layout`.
- Design-system §9 rules 12 and 13.
- Checks: `yarn check:gallery`, `yarn check:world`, and the `/world` and
  `/world/gallery` blocks in `yarn check:routes`.

**PASS 07 may take one of:**

- **Gallery exhibit experience.** Improve the move from a 2D exhibit to the
  3D viewer on `/worlds/[slug]`: return path, World context, the poster →
  viewer transition.
- **Real Gallery 3D,** only with an approved GLB environment. Replace the
  hanging (frames and placement), not the curation, labels, routes or
  chrome.

**Not started here:** the Objects, Archive, Lab and Studio rooms; a Gallery
or Lobby GLB; detail-page changes; World chrome on detail pages; any change
to `/worlds`.
