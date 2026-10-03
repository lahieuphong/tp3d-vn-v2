# TP3D PASS 05 — Enter the World gateway + Lobby foundation

This pass turns the final, stable Atrium (p 0.915–1.0) into a real gateway.
The primary CTA now reads **ENTER THE WORLD ⟶** and opens a new route,
`/world`, through the PORTAL transition. `/world` is the Lobby: a
production-quality 2.5D shell with one room data model, two navigation modes,
reduced chrome and a clear exit. It has no WebGL.

Rules come from [TP3D-DESIGN-SYSTEM.md](TP3D-DESIGN-SYSTEM.md) (this pass adds
§9 rule 12, "Crossing into the World is intentional"). The previous pass is
[TP3D-PASS-04-ATMOSPHERE-WORLDS.md](TP3D-PASS-04-ATMOSPHERE-WORLDS.md).
Homepage timeline internals are in
[TANPHONG_HOME_MOTION_CONTEXT.md](TANPHONG_HOME_MOTION_CONTEXT.md) §35.

| Item | Value |
| --- | --- |
| Date | 2026-10-04 |
| Starting HEAD | `30bfaf5` — feat(home): refine Atmosphere to Worlds Atrium reveal |
| Changed | Atrium CTA label and target (`/worlds` → `/world`) with portal enhancement; root layout hides the editorial header and footer on `/world`; Spatial `@font-face` rules moved to a shared stylesheet; new `--world-ground` token |
| Added | `/world` route and Lobby; `data/world-building.ts`; `components/world/*`; `EditorialChrome`; `check-world-gateway` (`yarn check:world`); `/` and `/world` blocks in `check-site` |
| Not changed | The homepage timeline, frame functions, camera, atmosphere, shaders, world swap, Atrium image and composition; the four Atrium room shortcuts; `/worlds`, `/worlds/[slug]`, `/experience/[slug]` and every other route |
| Not introduced | Any canvas, WebGL or Three.js on `/world`; RAF loop; animation library; global state library; scroll hijacking; custom cursor; route pages for planned rooms |

How measurements were taken:

- **Environment.** Headless Chrome 154 on this Windows 11 workstation (NVIDIA
  RTX 3090), against local production builds (`yarn build` + `yarn start`).
  For the regression baseline, `30bfaf5` was built from a clean
  `git archive` and served next to the PASS 05 build (ports 8788 and 8787).
  This is not field data. Phone numbers come from desktop emulation.
- **Headless caveats.** A headless page without system focus fires no focus
  events, so focus-intent prefetch was checked with
  `Emulation.setFocusEmulationEnabled`. Touch intent used
  `Input.dispatchTouchEvent`. The OS reports `prefers-reduced-motion: reduce`
  on this machine, so the media feature was pinned explicitly in every run.
- **Crossing timing** comes from screencasts. Times are measured from
  activation and rounded. Luminance is the frame's mean luma (0–255).

---

## 1. Product architecture

| Layer | Meaning | Where it lives |
| --- | --- | --- |
| Website | Editorial gallery and portfolio | `/` and every editorial route, with `SiteHeader` / `SiteFooter` |
| Gateway | An explicit decision to cross | The Atrium CTA "ENTER THE WORLD ⟶" (`WorldGatewayLink`) |
| PORTAL | The crossing itself | `components/world/world-portal.ts`: one fixed cover in `--world-ground` |
| The World | One building | `/world`, the Lobby, with reduced chrome (identity, World map, Exit) |
| Rooms | The building directory | `data/world-building.ts`: 01 Gallery, 02 Objects, 03 Archive, 04 Lab, 05 Studio |
| Catalogue | The working 3D catalogue | `/worlds`, reached today as Room 01 Gallery |
| Exhibits | GLB / 3D scenes | Not yet supplied; `/worlds/[slug]` shows Sketchfab scenes after a click |

The journey is now: editorial homepage → Atrium (featured shortcuts) →
explicit activation → PORTAL → Lobby (building directory) → room.

**Two hierarchies, both intended.** The homepage Atrium's four openings
(Living, Bedroom, Bathroom, Kitchen → `worldsChapterOptions` in
`data/home-chapters.ts`) are *featured shortcuts* into current content. The
Lobby's five rooms are the *building directory*. They do not match and must
not be "corrected" to match. The comment at the top of
`data/world-building.ts` repeats this.

## 2. Existing route responsibilities

| Route | Responsibility | PASS 05 |
| --- | --- | --- |
| `/` | Editorial homepage and the scroll story ending in the Atrium | CTA label and target only |
| `/world` | The Lobby: entry to the World | **New** |
| `/worlds` | Curated 3D Worlds catalogue: filters, search, sort, fragments | Unchanged; now also Room 01 Gallery |
| `/worlds/[slug]` | One world (Sketchfab scene after click) | Unchanged |
| `/experience/[slug]` | Project experiences and the scene registry | Unchanged |
| `/spaces/*`, `/projects/*`, `/collections/*`, `/journal/*`, `/products/*`, `/materials/*`, `/about`, `/contact` | Editorial content | Unchanged |
| `/world/gallery` … `/world/studio` | Reserved addresses (`futurePath`) | Not created; they return 404 |

## 3. Why `/world` is singular and `/worlds` remains the catalogue

- `/worlds` already has a clear job. It is a filterable catalogue with
  shareable query and fragment URLs (`/worlds?category=kitchen`,
  `/worlds#slug`). Turning it into the Lobby would break those URLs or
  overload one page with two jobs.
- "The World" is one building, so its address is singular. Its rooms nest
  under it later (`/world/gallery`, …) without colliding with the catalogue.
- The catalogue stays reachable four ways: Room 01 Gallery, the site
  navigation, global search, and direct URLs. Discoverability is not reduced.
- PASS 06 or later may decide whether the catalogue becomes `/world/gallery`
  internally. PASS 05 does not redirect or rename anything.

## 4. Homepage gateway

| | Before (`30bfaf5`) | After |
| --- | --- | --- |
| Label | EXPLORE 3D WORLDS ⟶ | ENTER THE WORLD ⟶ |
| Target | `/worlds` | `/world` |
| Element | `<Link href="/worlds" prefetch={false}>` | `WorldGatewayLink`: `<a href="/world" data-world-gateway>` (`prefetch={false}`) |
| Preview | circular Atrium preview | unchanged, now marked `data-world-origin` |
| Reveal / interactive | 0.895–0.915 / 0.915 | unchanged |

- **Room shortcuts.** Still `/spaces/living`, `/spaces/bedroom`,
  `/worlds/modern-bathroom` and `/spaces/kitchen`, in that order. This was
  verified in the HTML and in every browser run.
- **Micro state.** The existing hover/focus treatment is kept. There is no
  pulse, breathing ring or idle motion: the portal moves only after
  activation. The final Atrium measured 0 `requestAnimationFrame` callbacks
  in one second at every gateway viewport.
- **Pixel regression** against the exact `30bfaf5` build, at p 0.64, 0.72,
  0.80, 0.86, 0.88, 0.915, 0.95 and 1.0 across eight modes and viewports:
  - Before the CTA appears, frames are identical, apart from scattered
    1–2/255 differences. Two runs of the `30bfaf5` build differ by the same
    amount in the same places, so that is GPU noise.
  - From 0.915, every difference is inside the CTA. On phones only the label
    changes. On desktop, tablet and landscape, where the CTA is right-aligned,
    the shorter label also places the preview circle 12–13px further right.
  - In reduced motion the same CTA-only difference starts at 0.86, because
    the reduced reveal shows the CTA earlier.

## 5. Portal transition

**Sequence** (`enterWorld`, no RAF, no layout reads after activation):

1. A plain primary activation calls `preventDefault()`. The preview's rect is
   measured once.
2. One fixed layer (`div.world-portal`, `data-world-portal`, `aria-hidden`,
   z 150: above the header at 40, below the intro at 200) is appended to
   `body`. It holds a full-viewport dim (opacity 0 → 0.35, the Atrium
   receding) and one circle in `--world-ground`. The circle starts at the
   preview's centre and radius and is scaled by `transform` until it covers
   the farthest corner (`coverRadius`, +2px).
3. Both use `DURATION.cinematic` (1000 ms) and `cssEase('cinematic')` through
   the Web Animations API. They animate only transform and opacity. There is
   no spring, glow or tunnel.
4. When the cover completes, the layer becomes one static ground-coloured
   surface (`cover()`), state becomes `navigating`, and `router.push('/world')`
   runs exactly once.
5. The Lobby's `LobbyArrival` effect calls `releaseWorldPortal()`. It resets
   scroll to the top while the cover is still opaque, then fades the cover
   1 → 0 over `DURATION.fast` (400 ms) and removes it.

**State machine:** `idle → entering → navigating → idle`. A second
activation in any state but `idle` is ignored.

**Measured** (7 viewports, pointer and keyboard):

| Moment | Value |
| --- | --- |
| Viewport fully covered | ≈0.7–0.8 s after activation (the circle reaches the corners before its curve ends) |
| Cover held while the route loads | 290–430 ms (local server) |
| Lobby first visible | ≈1.1–1.2 s after activation |
| Mean luma | Atrium 90–113 → cover 24.0 → settled Lobby 49–52.5 |
| Flash check | no frame brighter than the starting Atrium frame; no luma rise before full cover; after the cover, the only rises are the Lobby's own entrance, ending at its settled level |
| History | +1 entry per crossing, even with a rapid double click |
| After arrival | no portal layer; `html`/`body` overflow `visible`; `body` pointer events `auto`; focus on `body` (document start); `scrollY` 0 |

The cover colour equals the Lobby's first paint (`--world-ground`,
`#1c1712`), so there is no white or black frame between them.

## 6. Progressive-enhancement behaviour

- **No JavaScript.** The gateway is `<a href="/world">ENTER THE WORLD ⟶</a>`.
  `/world` is complete server HTML: heading, five rooms, the Gallery link,
  Exit, and the World map closed in a native `<details>`.
- **Not intercepted:** modifier clicks (meta, ctrl, shift, alt), middle and
  right clicks, and events already `defaultPrevented`
  (`isPlainPrimaryActivation`). In the browser, a ctrl-click and a middle
  click left the homepage on `/` with no portal layer.
- **Keyboard.** Enter on the focused link arrives as a primary click and
  crosses the same way, measured at 1440×900.
- **Prefetch on intent only.** Pointer enter, focus or touch start calls
  `router.prefetch('/world')` once. The link itself has `prefetch={false}`.
  There were 0 `/world` requests before intent in every run. After intent
  there was one RSC request (`/world?_rsc=…`): hover at 1440 and 1366, touch
  start at 390, and focus (emulated) at 1440 and 390. Nothing 3D is
  prefetched.
- **Interruption safety.**

  | Event | Behaviour |
  | --- | --- |
  | Double click / rapid Enter | Ignored while not `idle` |
  | Resize or reduced-motion change mid-cover | The cover completes at once and the crossing continues. This was a real QA bug: the layer was stranded until the fix. |
  | Cancelled or stalled animation | Crosses anyway (safety timer at cover + 400 ms) |
  | Router throws | `location.assign('/world')` |
  | Route never arrives | Document navigation to `/world` after 4 s |
  | Lobby never releases | Cover released after 2.5 s once on `/world` |
  | Back (popstate away from `/world`) | Layer removed, state `idle`, no late navigation |
  | `pagehide` | Layer removed before the page can be cached |
  | `pageshow` (persisted) | Checked again on restore |

  None of these leaves the body locked, the overlay visible, focus trapped or
  pointer events disabled: the portal never locks scroll, never moves focus
  and never sets `pointer-events` outside its own layer.
- **The Lobby assumes nothing.** It does not need the homepage, the portal or
  `sessionStorage`. Typing `/world`, refreshing it, or opening it in a new
  tab renders the same complete page.

## 7. Reduced-motion behaviour

- No circle, no scale and no spatial travel. The layer is a flat
  `--world-ground` fade, opacity 0 → 1 over `DURATION.micro` (220 ms,
  linear). Then the crossing navigates.
- Measured at 1440×900 and 390×844: fully covered ≈0.23–0.25 s after
  activation, Lobby visible ≈0.29 s.
- The Lobby's entrance animations are removed by the global reduced-motion
  rule, so the composed Lobby appears at once.
- If the preference changes mid-crossing, the cover completes immediately and
  the crossing continues.

## 8. `/world` route

- `app/world/page.tsx` sets the metadata: title "The Lobby — TP3D"
  (absolute), description "Enter the TP3D World: a quiet lobby opening onto
  galleries, objects, an archive, a lab and a studio."
- `components/world/world-lobby.tsx` is a server component. Its only client
  code is `LobbyArrival` (renders nothing; releases a portal cover if there is
  one) and the portal module it imports.
- **Chrome.** The root layout wraps `SiteHeader` and `SiteFooter` in
  `EditorialChrome`, which renders nothing on `/world` and `/world/*`
  (`isWorldPath`). The Lobby renders its own single `<header>`. The skip link
  still targets `#main`.
- **First paint.** `:root:has(main[data-world-lobby])` and `body` take
  `background: var(--world-ground)` and `color-scheme: dark`, so the first
  frame already matches the portal cover. Measured `html` and `body`
  background: `rgb(28, 23, 18)`.
- **Scroll on arrival.** vinext skips its own scroll reset when the new
  segment's first node is a stylesheet hoisted into `<head>`, which is the
  case for `/world`. The portal therefore resets scroll under the opaque
  cover (see §24).

## 9. Lobby visual architecture

From back to front:

1. **Ground**: `--world-ground` on `html` and `body`.
2. **Plate** (`.wl-plate`, `aria-hidden`): the existing Atrium plate, reframed
   so it does not read as a homepage frame (`object-position: 50% 88%`,
   `scale(1.28)`; phones `52% 72%`), under a calm umber exposure gradient.
   This is the **only layer a future GLB Lobby replaces** (for example a
   `LobbyEnvironment`). Identity, both navigation modes, room IDs and routes
   stay.
3. **Chrome** (`.wl-chrome`): wordmark (→ `/`), World map, Exit to website.
4. **Identity** (`.wl-identity`): "TP3D" eyebrow, one `h1` "The *Lobby.*",
   and one line: "A digital gallery of spaces, objects, art and experiments."
5. **Directory** (`.wl-rooms`): the five rooms.
6. **Meta** (`.wl-meta`): "1 of 5 rooms open" and "Tân Phong · Est. 2026".

**Arrival is MEDIUM, not HIGH** (the homepage has spent its two HIGH
moments). The ground is already there. The plate settles in (opacity, scale
1.02 → 1, `normal` 650 ms from 120 ms), then the identity rises 10px
(`normal` from 380 ms), then the room bodies (`fast` 400 ms, from 620 ms,
staggered by `STAGGER` 70 ms), then the meta line (`fast` from 1000 ms).
After that the Lobby is still. There is no ambient motion, RAF, parallax or
cursor effect. All durations and curves are motion tokens.

**Palette and type:** Cormorant Spatial and Manrope Spatial (the homepage
faces, now shared through `components/shared/spatial-type.css`), ivory
`#f3e9d6` on umber, 1px rules, square geometry. There are no cards, glass,
glow or neon.

## 10. Room data model

`data/world-building.ts` is the single source of truth:

```ts
type WorldRoom = {
  id: 'gallery' | 'objects' | 'archive' | 'lab' | 'studio';
  number: string;          // '01'–'05', also the order everywhere
  name: string;
  summary: string;         // one quiet line
  description: string;     // for future room pages and metadata
  type: 'exhibition' | 'collection' | 'archive' | 'experiment' | 'studio';
  futurePath: `/world/${id}`; // reserved, not routed
} & ({ status: 'available'; href: string } | { status: 'planned'; href: null });
```

- `status` is the availability. `type` is the kind of wing, independent of
  whether it is open.
- The discriminated union makes "planned with a link" a type error.
- Also exported: `WORLD_PATH` (`'/world'`), `PLANNED_ROOM_LABEL` ("Opening
  later") and `isWorldPath()`.
- The Lobby maps `worldRooms` exactly twice (directory and World map) and
  hard-codes no room names. `check-world-gateway` enforces both.

## 11. Room taxonomy

| # | Room | Summary | Type | Role |
| --- | --- | --- | --- | --- |
| 01 | Gallery | Spatial exhibitions | exhibition | Interiors to walk through in 3D; today the `/worlds` catalogue |
| 02 | Objects | 3D objects & models | collection | Objects and models to study from every side, later to collect |
| 03 | Archive | Art & cultural memory | archive | Art, craft and cultural memory, kept in three dimensions |
| 04 | Lab | Spatial experiments | experiment | Studies in interactive space, light and real-time 3D on the web |
| 05 | Studio | Design & collaboration | studio | Where TP3D works with clients on spaces of their own |

Names, numbers and order are fixed for this pass.

## 12. Room availability

- **01 Gallery is available.** It is a real `<a href="/worlds">` with
  "Enter ↗", in both navigation modes.
- **02–05 are planned.** They render as a `<div>`, not a link and not
  focusable, with "Opening later". There is no `href="#"`, disabled button
  or tooltip.
- **Planned rooms read like a museum wing not yet open:** a fainter rule and
  a quieter status line. Their type stays at 78% ivory, which is legible
  (§19). The open room has the strong rule and full ivory.
- The meta line states the count from the data: "1 of 5 rooms open".

## 13. Spatial navigation

The directory (`nav aria-label="Lobby rooms"`, an ordered list) is laid into
the composition.

- **Desktop and tablet landscape:** five stations along a shallow arc across
  the base of the plate. The ends sit 5svh higher, 02 and 04 1.6svh higher,
  03 lowest, echoing the Atrium's circular plan.
- **Phones and tablet portrait:** a single readable list.
- **Short landscape:** a compact list beside the identity.
- DOM order equals visual order, 01 → 05, so keyboard order matches.

## 14. Fast navigation

- **World map** (`nav aria-label="World map"`) is a native
  `<details>/<summary>` in the chrome. It lists the same five rooms in the
  same order, with the same statuses and the same Gallery link, from the same
  data. It works without JavaScript, opens with Enter or Space, and closes
  the same way. It has no modal, focus trap or scroll lock.
- The panel is anchored to the chrome and fits every viewport (330px max,
  inset by the gutter). It was checked open at all six Lobby viewports.
- Phones label it "Map". The word "World" is visually hidden but still read
  by assistive technology.
- This is the permanent rule for the future 3D Lobby: nobody has to walk to
  find a room.

## 15. Exit behaviour

- **Exit to website** (phones: "Exit") is a real link to `/`, always in the
  chrome. The wordmark also links to `/`. Browser Back is never the only way
  out.
- Exiting is an ordinary navigation, with no reverse portal. The editorial
  header and footer return with the route.
- The homepage is not restored to the Atrium position, as the brief
  specifies. It opens at the top, like any homepage visit. Back from `/world`
  behaves the same (§24).

## 16. Desktop

Measured at 1440×900, 1366×768 and 1180×820 (1440: chrome 83px, identity
box 392×195 centred at y 281, directory 1285×138 at y 657).

- A centred identity sits over the plate. The arc directory spans the base,
  with the meta line at the foot and the World map panel top right.
- Page height equals the viewport (no scroll). There is no horizontal
  overflow and no interactive target under 44px.
- Hover affordance (the status arrow nudges 3px) lives inside
  `(hover: hover) and (pointer: fine)` and is mirrored by `:focus-visible`.

## 17. Tablet

- **1180×820 (landscape):** the desktop arc with tighter stations. Room names
  use `clamp(24px, 3.1vw, 34px)`; summaries stay at 9px.
- **820×1180 (portrait):** the identity sits centred over the plate and the
  directory becomes a centred list (600px max) with 36px names. The plate
  keeps more of the space visible than on phones.
- Nothing depends on hover. The World map stays available.

## 18. Mobile

- **390×844 and 360×740:** the chrome is 76px with "Map" and "Exit". The
  identity is left-aligned. The directory is a list of 64px rows (number,
  name, summary, status). The plate is framed lower (`52% 72%`) under a
  stronger exposure.
- 390×844 fits the viewport. 360×740 scrolls by 86px (the meta line), and
  the Lobby still opens at the top after a crossing.
- **844×390 (short landscape, shared with the Atrium's media rule):** the
  identity is on the left with the directory as a compact list on the right
  (rows of at least 44px) and the chrome at 68px.
- There is no hover, pointer parallax or 3D navigation requirement on any
  phone layout. Every target is at least 44px; a measured scan found none
  smaller at any viewport.

## 19. Accessibility

- **Landmarks:** one `<header>` (chrome), `<main id="main">`, two labelled
  `<nav>`s ("World map", "Lobby rooms") and a labelled identity `<section>`.
  There is exactly one `h1`.
- Open rooms are real anchors. Planned rooms are not focusable and are not
  links.
- The plate and the portal layer are `aria-hidden`. The Lobby has no canvas
  and needs no WebGL.
- **Focus.**
  - Visible focus: 1px `currentColor` at offset 6px on Lobby links and the
    summary. The homepage CTA keeps its existing focus treatment.
  - Nothing auto-focuses. After a crossing, focus starts at the document,
    like a page load, so the skip link is the first Tab stop.
  - There is no focus trap anywhere.
- **Contrast**, measured against the actual pixels behind each text box (text
  hidden), after this pass raised planned rooms and meta to 78% ivory:

  | Text | Against the mean background | Against the brightest pixel in the box |
  | --- | --- | --- |
  | Open room name / summary | 9.4–11.6:1 | 5.2–10.0:1 |
  | Planned room name / summary / status (9px) | 5.3–8.5:1 | 4.0–6.6:1 |
  | Lede, eyebrow, meta (9–10px) | 6.1–8.7:1 | 3.8–7.9:1 |
  | Exit | 12.1–13.1:1 | 9.6–11.8:1 |

  Every Lobby text group is at least 4.5:1 against its mean background at
  1440, 820, 390 and 844. `check-world-gateway` fails the build if Lobby text
  alpha drops below 0.78 or a fixed size drops below 9px. The wordmark
  tagline keeps the site header's `clamp(6px, 0.5vw, 8px)`.
- Reduced motion: see §7.

## 20. Performance

**Homepage** (cold cache, scrolled to the final Atrium, before any gateway
intent):

| | `30bfaf5` | PASS 05 |
| --- | --- | --- |
| Requests at 1440×900 / 390×844 | 41 / 37 | 46 / 42 |
| Transferred at 1440×900 | 1,598,076 B | 1,602,410 B (+4,334) |
| Transferred at 390×844 | 1,169,764 B | 1,174,097 B (+4,333) |
| `/world` route/RSC requests | — | 0 |
| Three.js chunk | `three.module-DdUsZgl6.js` | same file, unchanged |

The five extra requests are the gateway controller (`world-portal`,
`world-gateway-link`, `world-building`), `editorial-chrome`, and a 597 B
shared font-face stylesheet. The controller is loaded eagerly on purpose, so
the first activation never waits on the network.

**Build output** (all routes; raw / gzip):

| | `30bfaf5` | PASS 05 |
| --- | --- | --- |
| JS | 1,221,945 / 352,820 B | 1,227,748 / 355,557 B (+5,803 / +2,737) |
| CSS | 267,425 / 47,522 B | 275,191 / 49,929 B (+7,766 / +2,407) |
| New chunks | — | `world-portal` 3,279 B, `world-gateway-link` 831, `lobby-arrival` 237, `editorial-chrome` 165, `world-building` 83 |

**`/world` direct visit** (cold cache): 27 requests. At 1440×900 that is
579,416 B: 252,688 image, 102,205 fonts (3), 179,441 JS, 38,801 CSS, 5,851
document. At 390×844 it is 393,961 B (the plate is the 720w variant,
67,231 B).

- No Three.js, no canvas, no `atmospheric-sky` code.
- The portal is one layer with two children (none in reduced motion), and
  animates only transform and opacity.
- No layout is read after activation. Idle RAF on the final Atrium is 0
  callbacks per second.

## 21. Route compatibility

- `git diff 30bfaf5` shows 0 changed lines in `app/worlds`, `app/experience`,
  `components/worlds`, `components/experience`, `data/worlds.ts`,
  `lib/world-catalog.ts` and `data/home-chapters.ts`.
- **Route crawl** (`yarn check:routes` against the production build): 45
  pages, 77 image paths and 8 expected 404s all pass. That covers `/worlds`,
  `/worlds/[slug]` (modern-kitchen, white-modern-living-room,
  minimalistic-modern-bedroom, modern-bathroom), the three
  `/experience/[slug]` routes, and the new `/` gateway and `/world` Lobby
  assertions.
- `/world/gallery` and `/world/objects` return 404. Their addresses are
  reserved, not built.
- `yarn check:worlds` passes unchanged.

## 22. Tests

`yarn check:world` (`scripts/check-world-gateway.mjs`) loads the real
TypeScript modules into a fake DOM with a fake clock and fake Web Animations.
Numbers refer to the brief's list.

| # | Requirement | Where |
| --- | --- | --- |
| 1–2 | PASS 01–04 choreography and static final Atrium unchanged | `check-atmosphere-worlds` (locked digests, unchanged), `check:home`, pixel regression (§4) |
| 3 | No portal RAF while idle | no `requestAnimationFrame` in `components/world`; 0 idle callbacks in browser |
| 4–5 | Real `/world` link; four shortcut hrefs unchanged | `check-world-gateway` (gateway source; room links still map `worldsChapterOptions`), `check-site` (the four hrefs in order in rendered HTML; the `/` gateway block) |
| 6–8 | Primary activation enhanced; modifier and middle clicks not | `isPlainPrimaryActivation` unit tests; browser ctrl-click and middle click |
| 9 | Keyboard Enter | browser run at 1440×900 |
| 10 | Reduced motion: short flat cover | unit test (220 ms, opacity only, no circle); browser 1440 and 390 |
| 11 | Double activation ignored | unit test; browser double click (+1 history entry) |
| 12 | Cleanup on navigation, back, pagehide, restore | unit tests (popstate, `pagehide`, `pageshow` persisted, re-entry after abort) |
| 13–14 | Direct entry and refresh render | `check-site` `/world` block (server HTML); browser direct loads at 6 viewports |
| 15 | One `h1` | `check-world-gateway`, `check-site` |
| 16 | One room data source | exactly two `worldRooms.map(`, no hard-coded names |
| 17–18 | Gallery available, links to `/worlds` | data and HTML assertions |
| 19 | Planned rooms are not fake anchors | no `href="#"`; planned items contain no `<a` in server HTML |
| 20 | World map and directory expose the same rooms in order | `check-site` compares both navs |
| 21 | Exit to website works | Exit is a link to `/` (source and HTML) |
| 22 | Touch targets of at least 44px | CSS `min-height` checks; browser scan at 6 viewports |
| 23–24 | No Lobby Three.js; no canvas | source scan of `components/world` and `app/world`; HTML and browser checks; no `three` request |
| 25 | No heavy homepage request before intent | source checks (`prefetch={false}`, intent handlers only); browser network runs |
| 26 | Fallback works if JS navigation fails | unit tests: router throws → `location.assign`; route stalls → assign at 4 s |
| 27 | Sensible focus after Lobby navigation | browser: focus on `body`, no trap, no auto-focus |
| 28–29 | `/worlds`, `/worlds/[slug]`, `/experience/[slug]` | `check-site`, `check:worlds`, unchanged sources |
| 30 | Production build | `yarn build` and `yarn build:vercel` |

The unit tests also cover:

- `coverRadius` reaches every corner.
- Keyframes are transform/opacity only.
- A resize or preference change mid-crossing still arrives (regression for
  the QA bug).
- A cancelled or stalled animation crosses.
- With no Web Animations support, the crossing happens immediately.
- The release watchdog fires at 2.5 s.
- Release resets scroll only under the opaque cover; a direct visit's scroll
  is untouched.
- No room grid area leaks into the World map.
- The legibility floor (alpha 0.78, 9px) holds.

Mutation checks confirmed the new assertions fail when the behaviour is
removed: scroll reset, pagehide cleanup, grid-area scope, alpha and size
floors, plus the earlier portal mutants.

## 23. Visual QA

**Homepage gateway** at 1440×900, 1366×768, 1180×820, 820×1180, 390×844,
360×740 and 844×390, plus keyboard at 1440 and reduced motion at 1440 and
390. Captured: idle, hover (pointer viewports), focus, and a 3.2 s
screencast through activation, partial cover, full cover, first Lobby paint
and the settled Lobby. Then Back.

- No white flash or bright frame (§5).
- No layout jump: the Atrium does not move under the cover.
- No accidental scroll: `scrollY` 0 on arrival at all seven viewports. At
  360×740 this needed the release-time reset (§8).
- No duplicated header: one `header`, no `.site-header` on `/world`.
- Focus outline visible on the CTA before activation.
- Nothing left locked after arrival or Back.

**Lobby** direct at 1440×900, 1180×820, 820×1180, 390×844, 844×390 and
360×740: settled and with the World map open, plus a no-JS capture at
390×844.

**Defects found and fixed in this pass:**

- The portal could strand its cover on resize mid-crossing.
- The Lobby arrived scrolled at 360×740.
- The phone/tablet list's grid areas leaked into the World map rows,
  overlapping number and status.
- Planned-room summaries measured 3.1–3.4:1.

Screenshots and casts were kept local (scratchpad) and are not committed.

## 24. Known issues

1. **Back to the homepage starts at the top.** SPA Back from `/world`, or from
   any route, re-mounts the homepage story at progress 0. The same happens
   for the Atrium room shortcuts, and at `30bfaf5`. The brief rules out
   reconstructing the position in PASS 05.
2. **vinext scroll reset.** vinext skips its scroll-to-top for a segment
   whose first node is a stylesheet hoisted into `<head>`. A server
   component that imports CSS, like `/world`, produces exactly that. The
   gateway works around it under its cover. A future client link into
   `/world` from elsewhere would need the same care, or an upstream fix.
3. **Cover hold depends on the network.** The cover holds 290–430 ms
   locally. On a slow connection it can hold up to 4 s, then falls back to a
   document navigation. There is no progress indicator.
4. **The CTA preview shifts 12–13px** on right-aligned layouts because the
   new label is shorter (§4).
5. **Homepage cost.** The homepage gained four small JS chunks and one 597 B
   stylesheet (+4.3 KB transferred).
6. **Plate variant.** At 390×844 the Lobby requests the 720w plate (67 KB)
   while the homepage used the 1280w file, so a phone crossing fetches one
   more image. The 1440 file is shared.
7. **360×740 scrolls by 86px** to reach the meta line.
8. **Measurement scope.** Headless desktop Chrome with emulated phones and
   touch. No Safari, Firefox, real devices or field data. Focus intent
   needed focus emulation in headless.
9. **Small tagline.** The wordmark tagline mirrors the editorial header's
   6–8px clamp.

## 25. Exact boundary handed to PASS 06

**PASS 05 delivers** a working gateway and a production-quality Lobby shell.

**Stable contracts.** PASS 06 builds on these and must not rename them:

- `WORLD_PATH = '/world'`; room IDs, numbers, order, statuses and
  `futurePath` values in `data/world-building.ts`.
- Portal API: `enterWorld`, `releaseWorldPortal`, `abortWorldPortal`,
  `gatewayState`, `isPlainPrimaryActivation`, `PORTAL`.
- Token `--world-ground`; layer z 150.
- Hooks: `data-world-gateway`, `data-world-origin`, `data-world-portal`,
  `data-world-lobby`, `data-world-room`, `data-status`.
- Design-system §9 rule 12.
- Checks: `yarn check:world`, the `/` and `/world` blocks in
  `yarn check:routes`, and `check-atmosphere-worlds`.

**PASS 06 may do exactly one of:**

- **A. Real Lobby 3D environment**, only with an approved GLB or environment
  asset. Replace the `.wl-plate` layer with a lazily loaded
  `LobbyEnvironment` behind the existing poster-first and budget rules
  (§14). Identity, World map, Exit, the directory and the no-WebGL fallback
  stay.
- **B. Room 01 Gallery.** Build on the `/worlds` catalogue, or an immersive
  Gallery at the reserved `/world/gallery`. Decide then whether `/worlds`
  stays the catalogue address. Never break its existing URLs.

**Not started here:** any `/world/<room>` page, any canvas or Three.js on
`/world`, changes to `/worlds`, Objects, Archive, Lab or Studio content, a
reverse portal, and homepage scroll restoration.
