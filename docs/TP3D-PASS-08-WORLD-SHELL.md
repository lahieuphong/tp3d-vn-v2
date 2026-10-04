# TP3D PASS 08 — Gallery detail World-shell integration

PASS 08 closes the seam between Room 01 Gallery and its exhibits. A visitor
who opens an exhibit from the Gallery now stays inside the World. The detail
page shows the World chrome with the Gallery current, on the World ground
and in the World's type, from the first paint, with no editorial header or
footer. The same URL without that context is still the catalogue's detail
page, unchanged byte for byte.

Rules come from [TP3D-DESIGN-SYSTEM.md](TP3D-DESIGN-SYSTEM.md); this pass adds
§9 rule 15, "Context controls the shell; content identity stays stable". The
previous pass is
[TP3D-PASS-07-EXHIBIT-EXPERIENCE.md](TP3D-PASS-07-EXHIBIT-EXPERIENCE.md).

| Item | Value |
| --- | --- |
| Date | 2026-10-04 |
| Starting HEAD | `b05b003` — feat(worlds): refine Gallery exhibit to live 3D handoff |
| Changed | `/worlds/[slug]` wraps the detail in `WorldDetailShell` when the server-validated context is the Gallery; `world-chrome.css` shares its tokens, link reset and focus with the chamber; `check-site` asserts the shell in served HTML; a comment in `editorial-chrome.tsx` |
| Added | `components/world/world-detail-shell.tsx`, `components/world/world-detail-shell.css`, `yarn check:world-shell` |
| Not changed | `WorldDetail`, `WorldDetailStage`, `SketchfabViewer`, the viewer state model, `WorldDetailInfo`, `WorldThumbnailRail`, `worlds.css`, `lib/world-detail-context.ts`, `WorldChrome`, the root layout, `SiteHeader`, `SiteFooter`, `isWorldPath`, Lobby, Gallery, `/worlds`, homepage, metadata |
| Not introduced | a second detail route, a redirect, middleware, a client effect or observer on the editorial chrome, a canonical link, a new dependency, canvas, Three.js, an animation library, a new asset |

How measurements were taken:

- Headless Chrome 154 on this Windows 11 workstation, against local
  production builds (`yarn build` + `yarn start`) and the live Sketchfab
  embed.
- **Baselines.** The `b05b003` captures (catalogue and Gallery-context
  detail at rest, Gallery, Lobby, network) were taken from its build before
  any change.
- **First paint.** CPU throttled 4×, 150 ms latency, 1.6 Mbps down, cache
  disabled. Each load starts from a page already painted `#1c1712`, so an
  ivory frame could only come from the route.
- **Sketchfab.** Requests were counted with site isolation disabled, so the
  cross-origin iframe's requests show up in the page's network log.
- Reduced motion was pinned explicitly (this machine reports `reduce`).
- This is not field data.

---

## 1. Before state

At `b05b003`, a Gallery exhibit (`/worlds/[slug]?from=gallery`) already knew
its context (PASS 07). It had the breadcrumb ROOM 01 / GALLERY, the curated
browse set and Escape back to `/world/gallery#slug`. But it was rendered in
the editorial site:

- the fixed ivory `SiteHeader` (86px at desktop, 80px on phones) with the
  full site navigation and search;
- the ivory editorial ground (`rgb(247 245 240)`) and the editorial type;
- the editorial `SiteFooter` below the curatorial close;
- no World chrome: no World map, no Back to Lobby, no Exit to website.

## 2. Seam being solved

The Gallery is a dark, composed room in the World chrome. Opening one of its
exhibits threw the visitor out of the building into a bright catalogue page,
and returning meant crossing that boundary again. The exhibit should read as
the next chamber of the same room. The catalogue's detail page is a utility
and must stay exactly as it was (rule 13).

## 3. Dual-mode detail architecture

- **One route, one detail component.** `app/worlds/[slug]/page.tsx` resolves
  the context once. It renders the same `WorldDetail` with the same props
  as PASS 07.
- **The context picks only the wrapper.**
  - `kind === 'gallery'`: `<WorldDetailShell>{detail}</WorldDetailShell>`.
  - Anything else: `detail`, as before.
- **Nothing forks.** No new route, redirect, middleware or second viewer.
  The detail markup inside the shell is byte-identical to the PASS 07
  Gallery-context markup; `check-world-shell` asserts that for every
  exhibit.
- `WorldDetailShell` is a server component. It renders the marker element,
  `WorldChrome currentRoom="gallery"`, and the children.

## 4. Server context validation

- **Resolver unchanged.** The PASS 07 resolver decides, on the server, per
  request: `resolveWorldDetailContext({ from, slug, curatedSlugs,
  galleryRoom })`. Only an exact `from=gallery` for a curated slug, with a
  Gallery that has a route, is a Gallery visit.
- **These fall back to the catalogue page, with no shell:**
  - `from=lobby`, `from=GALLERY`, `from=gallery ` (trailing space),
    `from=` (empty);
  - a repeated `from=gallery&from=gallery`;
  - another parameter name;
  - a world outside the curation.
- **One resolution.** The page now resolves through one `detailContext()`
  helper. Metadata does not use it: metadata stays context-free (§23).
- **Measured.**
  - Served HTML: the marker and one `wl-chrome` appear only for
    `?from=gallery`.
  - Rendered markup (`check-world-shell`): every invalid context returns
    the exact PASS 07 catalogue markup.

## 5. Shell marker

```html
<div class="world-chamber" data-world-detail-shell="gallery">
  <header class="wl-chrome wl-chrome--room">…</header>
  <main class="world-detail" id="main">…</main>
</div>
```

- **The single source of truth for the shell.** It is server-rendered in
  the first HTML, so it is present before any script runs.
- **Everything is scoped to it.** Every rule in `world-detail-shell.css`
  starts with `.world-chamber` or
  `:root:has([data-world-detail-shell='gallery'])`. The catalogue page never
  matches one.
- The class is `world-chamber` because `.world-detail-shell` is already the
  inner section class inside `WorldDetail`.

## 6. Editorial chrome suppression

```css
:root:has([data-world-detail-shell='gallery']) .site-header,
:root:has([data-world-detail-shell='gallery']) .site-footer {
  display: none;
}
```

- `SiteHeader` and `SiteFooter` stay mounted by the root layout, exactly as
  on every non-World path. `EditorialChrome` and `isWorldPath` are
  unchanged, and `/worlds` is still not a World path.
- **Hidden by the server marker only.** `display: none` takes them out of
  sight, out of the tab order and out of the accessibility tree. Never
  opacity or visibility.
- **No script involved:**
  - no client effect, `MutationObserver`, polling or `querySelector`;
  - no hydration difference: the React tree is the same on server and
    client.
- **Measured.**
  - At all nine viewports: `siteHeaderVisible: false`,
    `siteFooterVisible: false`, one `banner` landmark (the World chrome).
  - A real Tab cycle never reaches an editorial link (§21).

## 7. First-paint strategy

- **CSS ships in `<head>` with the server HTML.** The shell's stylesheet is
  imported by the server component. vite-rsc emits it as
  `<link data-precedence="vite-rsc/importer-resources">`, render-blocking,
  with the HTML.
- **So the first frame is already the chamber:**
  - the World ground on `html` and `body` (`color-scheme: dark`);
  - the editorial header and footer gone;
  - the World chrome in place.
- **Throttled cold loads, every screencast frame:**

  | Load | Frames | First content | Ivory in header band (first / +50 / +100 / +250 ms / settled / max) | Ivory in frame (max) |
  | --- | --- | --- | --- | --- |
  | Gallery 1440×900 | 52 | 1,286 ms | 0 / 0 / 0 / 0 / 0 / 0 | 0 |
  | Gallery 390×844 | 54 | 961 ms | 0 / 0 / 0 / 0 / 0 / 0 | 0 |
  | Gallery 844×390 | 55 | 1,193 ms | 0 / 0 / 0 / 0 / 0 / 0 | 0 |
  | Catalogue 1440×900 (control) | 53 | 1,225 ms | 0.92 throughout | 0.99 |

  Ivory means every channel above 230. The control shows the method does
  detect the editorial header.
- **Results.** Ivory flash **PASS**. SiteHeader flash **PASS**. SiteFooter
  flash **PASS**. Double header **PASS**.
- **No layout jump.** Contact sheets at first / +50 / +100 / +250 ms /
  settled show the World chrome and breadcrumb in the same place from the
  first frame. The stage and information then fade in with PASS 07's
  existing entrance animation.
- **Client navigations.** A per-frame sampler recorded every distinct
  (URL, marker, header visible, footer visible, chromes, background) state
  across:
  - Gallery-detail ↔ Gallery (breadcrumb and history, both ways);
  - Back to Lobby, Exit and history back into the chamber.

  No frame shows the editorial header on a World or Gallery-context URL.
  Exit goes straight from the chamber state to the homepage with its
  header.

## 8. WorldChrome integration

- `WorldChrome currentRoom="gallery"`: the same component, markup and CSS as
  Room 01.
  - Back to Lobby → `/world`.
  - World map from `worldRooms`: Gallery `aria-current="page"`, "You are
    here"; planned rooms plain text.
  - Exit to website → `/`.
  - Wordmark → `/`. Nothing routes through `/worlds`.
- **Rendered once,** at the top of the chamber, never inside fullscreen.
  Fullscreen stays on the stage element, as in PASS 07.
- **World map measured** open at 1440×900, 1366×768, 1180×820, 820×1180,
  390×844, 360×740, 844×390, 740×360 and 667×375. Fully inside the viewport
  every time (e.g. 1440: x 1032–1362, y 77–345; 360: x 22–338, y 70–338),
  with Gallery current.
- **Chrome height** is World chrome's own, mirrored as `--wc-chrome` for the
  detail's top padding:
  - `clamp(78px, 9.2svh, 108px)`;
  - 76px below 768px wide;
  - 68px in short landscape.

## 9. Gallery breadcrumb

- PASS 07 markup, unchanged: `Back to` (screen readers) + ROOM 01 / GALLERY
  → `/world/gallery#slug`, then the exhibit title.
- **New in the chamber:**
  - 10px Manrope Spatial capitals, 0.24em tracking, quiet ivory (78%);
  - the room link in full ivory with an underline rule on hover and focus;
  - the counter (`01 / 04`) never wraps; at 390 and 360 the switcher gap
    tightens to 6px.
- **Catalogue unchanged:** "3D WORLDS" → `/worlds#slug`.

## 10. Gallery detail visual treatment

A dark viewing chamber, not inverted colours.

| Part | Treatment |
| --- | --- |
| Stage | Dominant, on the Gallery's mount tone (`#2a221b`) |
| Information | Museum interpretation: wall text beside the exhibit |
| Rail | Adjacent works in the room |
| Close | A quiet curatorial note |

- **One palette:**
  - the World ground (`--world-ground`, `#1c1712`);
  - ivory `#f3e9d6`, with a 78% quiet ivory;
  - fine 16% ivory rules.
- **The World's type:** Cormorant Spatial for the title and quote, Manrope
  Spatial for everything else.
- **PASS 07 untouched.** Layout, sizes, the grid, the viewer band and every
  state are worlds.css's. The chamber changes only surfaces, ink, type
  families and three small type sizes. `check-world-shell` fails on any
  z-index, pointer-events, fixed or sticky positioning, overflow lock,
  viewport height, transition or animation in the shell CSS.

## 11. Stage treatment

- The stage and the live Sketchfab band sit on the mount tone (`#2a221b`),
  as in the Gallery's frames.
- **ENTER 3D WORLD** is the chamber's one filled control: ivory fill, ground
  text, Manrope Spatial. On hover it becomes a dark translucent fill with
  ivory text.
- **Loading and live states** keep PASS 07's own styles, which are more
  specific: CANCEL OPENING / EXIT 3D VIEW in the 60px band with ivory
  rules.
- The poster, annotations, fullscreen, status and z-order are PASS 07's.

## 12. Info panel treatment

- **Transparent on the World ground,** with a 1px rule to the stage.
- **Text:**
  - kind, year and "MODEL INFORMATION" in 10px quiet capitals;
  - the title in Cormorant Spatial 400, ivory;
  - the description at 14px/1.7 in quiet ivory;
  - model rows ruled at 16% with quiet labels, 11px.
- **External links** (VIEW ON SKETCHFAB, purchase) are ruled rows (50%
  ivory) with an 8% hover fill. They are quieter than ENTER 3D WORLD.
- Every fact, credit and link of PASS 07 is kept. Markup is unchanged.

## 13. Thumbnail rail

- A narrow strip of the room's works, separated by a rule:
  - thumbnails at 62% opacity, full on hover and for the current work;
  - the current work outlined in ivory;
  - index numbers in ivory on a dark tab.
- It still browses only the curation (4 exhibits) and keeps `?from=gallery`.
- At 820px and narrower the rail sits above the information, with a
  bottom rule.

## 14. Curatorial close

- The PASS 07 close ("SPACES THAT BELONG", the quote, "A MORE TANGIBLE
  TOMORROW") on the ground:
  - quiet 10px capitals;
  - the quote in Cormorant Spatial ivory, with a real italic;
  - the attribution in quiet Manrope Spatial.
- There is no editorial footer after it; the chamber ends there.

## 15. Catalogue regression strategy

- **Markup.** `check-world-shell` renders the real route. For the catalogue
  and eight invalid contexts it asserts the output equals the PASS 07
  catalogue `WorldDetail` markup, byte for byte, with no marker and no World
  chrome.
- **Files locked to PASS 07** (normalized SHA-256): the detail components,
  viewer state, `worlds.css`, the context resolver, `WorldChrome`, the root
  layout, `SiteHeader` and `SiteFooter`.
- **Pixels.** Resting captures at 1440×900, 1180×820, 820×1180, 390×844 and
  844×390 (top, information, bottom). All 15 have max difference **0/255**
  against `b05b003`. The computed-structure report (header, footer,
  backgrounds, tab order) is identical.
- **Behaviour.** The lifecycle matrix in catalogue context at 1440, 820 and
  390 passes every check (§25).
- **Stylesheets.** vite-rsc emits a page's CSS from its static import
  graph, so the catalogue page now also links `world-chrome.css` and the
  shell CSS (+2 requests, §22). Every rule in them is scoped and matches
  nothing there.

## 16. Desktop

| Viewport | Chrome | Breadcrumb | Stage (top, height) | ENTER (top–bottom) |
| --- | --- | --- | --- | --- |
| 1440×900 | 83px | 107–123 | 148, 732 | 800–852 |
| 1366×768 | 78px | 102–118 | 143, 717 | 780–832 |
| 1180×820 | 78px | 102–118 | 143, 703 | 766–818 |

- **Stage placement.** It starts 19–24px higher than in the catalogue: World
  chrome scrolls with the page instead of a fixed 86px header.
- **ENTER placement.**
  - Above the fold at 1440×900 and 1180×820.
  - At 1366×768 it sits at 780px, below the fold. The catalogue's is at
    765px, also below the fold (§26).

## 17. Tablet

- 820×1180: chrome 108px, stage at 173px (700px tall), ENTER at 793–845.
- The detail stacks as in PASS 07: stage, rail, information.
- Content starts 6px lower than in the catalogue: the World chrome is 108px
  here, the editorial header 86px.

## 18. Mobile

| Viewport | Chrome | Stage (top, height) | ENTER | Overflow |
| --- | --- | --- | --- | --- |
| 390×844 | 76px | 141, 565 | 630–682 | none |
| 360×740 | 76px | 141, 496 | 561–613 | none |

- **Stage primary.** The World chrome (76px) is lighter than the editorial
  header (80px), and the stage starts 26px higher than in the catalogue.
- **Order:** chrome, breadcrumb, stage, rail, information, close.
- **Chrome labels.** The breadcrumb wraps onto a second line at 390 and 360.
  The chrome uses its short labels (LOBBY, MAP, EXIT).
- **Normal document scroll.** Nothing is viewport-locked.

## 19. Short landscape

| Viewport | Chrome | Breadcrumb | Stage top | ENTER | Fullscreen |
| --- | --- | --- | --- | --- | --- |
| 844×390 | 68px | 92–108 | 133 | 744–796 | 753–797 |
| 740×360 | 68px | 92–108 | 133 | 513–565 | 522–566 |
| 667×375 | 68px | 92–108 | 133 | 513–565 | 522–566 |

- **Chrome and breadcrumb** are clear. The stage starts 34px higher than in
  the catalogue.
- **ENTER on first paint.** As in PASS 07, the poster's ENTER is reached by
  scrolling.
- **Once live,** PASS 07's `scrollIntoView` brings EXIT 3D VIEW, fullscreen
  and the iframe into view. At 844×390 the live frame is visible from 193px
  to the bottom edge, with EXIT and fullscreen in the band.
- The lifecycle passes at all three sizes.

## 20. Viewer compatibility

The viewer is PASS 07's: same files (digest-locked), state model and key
handling.

| Check (Gallery shell, 9 viewports; catalogue, 3) | Result |
| --- | --- |
| Sketchfab requests: idle poster 3 s / hover + focus ENTER | 0 / 0, every run |
| ENTER (keyboard) → loading | one iframe, inert, CANCEL OPENING, focus kept |
| Loading → live | 363–2,236 ms; 41–43 Sketchfab requests by `load` |
| Live | one iframe, not inert; poster opacity 0, pointer-events none; EXIT 3D VIEW focused; status "3D view ready"; page RAF 0 |
| Escape while live | back to poster, iframe gone, URL kept |
| Cancel while loading | back to poster, iframe gone |
| Switch from live / from loading | poster, iframe gone, 0 new Sketchfab requests in 3.2 s, context kept |
| Back / forward / refresh | world and `?from=gallery` kept, shell kept, header still `display: none` |
| Escape on the resting poster | `/world/gallery#slug`, exhibit visible |
| Errors | none |

- **Live hit-test.** At the stage centre it is the IFRAME everywhere except
  844×390 and 740×360. There the centre lies below the viewport; the
  screenshot shows the live frame filling the visible stage.
- Fullscreen still targets the stage. `check-world-shell` renders the live
  stage inside the chamber: one interactive iframe, EXIT 3D VIEW and the
  fullscreen button.

## 21. Accessibility

- **One banner landmark** (the World chrome header) and one `main`
  (`#main`, the skip link's target). The editorial header and footer are
  `display: none`, so not in the accessibility tree.
- **Real Tab cycle in the chamber:**

  skip link → wordmark → Back to Lobby → World map → Exit to website →
  breadcrumb → previous → next → ENTER 3D WORLD → fullscreen → VIEW ON
  SKETCHFAB → the four thumbnails.

  No editorial link is reachable. Closed World-map entries are skipped.
- **Focus.** The World's ring, 1px `currentColor` at 6px offset, applies
  inside the chamber. No ring is clipped by a scroll container. On the
  resting ENTER toggle the ring is ground-coloured over the poster; it is
  visible against all four current posters (§26).
- **Contrast** on the ground `#1c1712`:

  | Pair | Ratio |
  | --- | --- |
  | Ivory text | 14.77:1 |
  | Quiet ivory (78%) | 9.33:1 (8.43:1 on the mount) |
  | Ground text on the ivory ENTER fill | 14.77:1 |
  | External-link rules (50%) | 4.56:1 |
  | Hairline rules (16%, decorative) | 1.55:1 |

- **Unchanged from PASS 07:** the status `<output aria-live="polite">`, the
  stable toggle, no focus trap, and Escape closing the viewer first. The
  World map is native `<details>`, with planned rooms as text and the
  current room marked `aria-current="page"`.

## 22. Performance

- **Client JS unchanged:** 1,233,214 B raw, as in PASS 07 (358,041 B
  gzip-9). The shell, the marker and `WorldChrome` are server-rendered.
- **CSS** (raw / gzip):

  | | PASS 07 | PASS 08 |
  | --- | --- | --- |
  | All CSS | 287,580 / 53,259 B | 291,850 / 54,264 B (+4,270 / +1,005) |
  | Shell stylesheet (new) | — | 4,208 / 990 B |
  | `world-chrome.css` | — | 3,306 / 1,283 B (+62 B of selectors) |

- **Cold cache, resting poster:**

  | Page | PASS 07 | PASS 08 |
  | --- | --- | --- |
  | `/worlds/modern-kitchen` 1440×900 | 49 req / 968,987 B | 51 req / 971,910 B |
  | `/worlds/modern-kitchen` 390×844 | 42 / 533,781 | 44 / 536,697 |
  | `?from=gallery` 1440×900 | 52 / 969,896 | 40 / 445,514 |
  | `?from=gallery` 390×844 | 45 / 534,686 | 39 / 406,649 |
  | Homepage 1440×900 (story scroll) | 48 / 1,603,980 | 48 / 1,603,982 |

- **Catalogue: +2 stylesheet requests** (shell 1,253 B and `world-chrome`
  1,525 B transferred).
- **Gallery context is lighter.**
  - The hidden header's links never enter the viewport, so vinext no longer
    prefetches their routes: route fetches drop from 7 to 1. With the header
    visible, those prefetches pull the homepage payload with `living.webp`
    (375 KB) and `spatial-portals-720.webp` (120 KB), the homepage CSS and
    three chunks.
  - What remains is the breadcrumb's prefetch of `/world/gallery`. The
    World chrome's links use `prefetch={false}`.
  - It adds one existing font file, `cormorant-italic.woff2` (39,487 B),
    for the quote's real italic. The Gallery has already loaded it for
    visitors who arrive from there.
- **Same cost elsewhere:** 0 Sketchfab and 0 Three.js requests before ENTER
  in both contexts. No new RAF, timer or observer.

## 23. SEO/canonical decision

**Canonical deferred.**

- **What was tried.** A context-only `alternates.canonical` of
  `/worlds/[slug]` for Gallery visits. It is root-relative, because the app
  has no `metadataBase`.
- **Why it was removed.** vinext streams this dynamic route's async
  metadata into `<body>`, not `<head>`. Title and description were already
  in the body at `b05b003`. The rendered DOM measured:
  - `canonicalInHead: false`;
  - the link present only in the body.

  A canonical outside `<head>` cannot be verified as a head canonical.
- **Result.** Metadata is identical in every context: title and
  description, as in PASS 07. `check-world-shell` asserts it.
- **Content identity** is still the single `/worlds/[slug]` route.
- **Revisit when** vinext hoists streamed metadata into `<head>` (or the
  route's metadata becomes static), together with a `metadataBase`.

## 24. Test coverage

`yarn check:world-shell` (`scripts/check-world-shell.mjs`) renders the real
route module, `WorldDetail`, `WorldDetailShell` and `WorldChrome` to markup.
It then checks CSS, file digests and source contracts.

| # | Requirement | How |
| --- | --- | --- |
| 1, 4 | Valid Gallery detail renders one World chrome and the marker | every curated exhibit; output = marker + chrome + exact PASS 07 Gallery markup; served HTML (`check-site`) |
| 2–3, 5 | Catalogue and invalid contexts: no chrome, no marker | 8 contexts + a world outside the curation; output = exact PASS 07 catalogue markup; served HTML for 5 contexts (`check-site`) |
| 6–10 | Gallery current, Back to Lobby `/world`, Exit `/`, map = `worldRooms` in order, planned rooms are text | rendered chrome |
| 11–12 | Breadcrumbs `/world/gallery#slug`, `/worlds#slug` | rendered markup |
| 13–15 | Header and footer `display: none` only under the marker; no opacity or visibility hiding | parsed shell CSS + a scan of every stylesheet |
| 16–17 | Catalogue keeps header and footer | layout locked; `isWorldPath('/worlds…')` false; no other hiding rule |
| 18–21 | World ground, spatial type, dark info panel; catalogue panel PASS 07 | parsed CSS; `worlds.css` digest |
| 22–28 | Viewer files and state unchanged; zero Sketchfab before ENTER in both contexts; live viewer interactive in the chamber; Exit; fullscreen; Escape hierarchy | digests, state and key tests, rendered markup |
| 29–32 | Curated and full browse sets; next and previous URLs per context | rendered rails, `worldDetailHref` |
| 33–34 | No route, redirect, middleware or `vercel.json` rewrite | route inventory, sources |
| 35–38 | No new dependency (set digest-locked); Three.js imported only by the homepage sky; no canvas, animation library or external asset | package and source scans |
| — | Context-free metadata; no client effect, observer or DOM mutation; shell is a server component | route metadata, source scans |
| 39–44 | Lobby, Gallery, exhibit, catalogue, homepage, build | `check:world`, `check:gallery`, `check:exhibit`, `check:worlds`, `check:home`, `yarn build` / `build:vercel` |

**Mutation checks.** Fifteen deliberate regressions each fail the check:

- wrapping every context;
- wrapping none;
- adding the canonical back;
- hiding the footer with opacity;
- an unscoped rule;
- a renamed marker;
- the chrome without a current room;
- a client effect in `EditorialChrome`;
- a light chamber ground;
- a light info panel;
- a z-index;
- an edited viewer file;
- an edited `worlds.css`;
- a transition;
- a `url()` asset.

## 25. Visual QA

- **Lifecycle matrix.**
  - Gallery context at 1440×900, 1366×768, 1180×820, 820×1180, 390×844,
    360×740, 844×390, 740×360 and 667×375. Catalogue at 1440×900, 820×1180
    and 390×844.
  - Captured per run: poster, focus, keyboard ENTER, loading, handoff,
    live, Escape, cancel, switch from live and from loading, back, forward,
    refresh, and Escape to the context.
  - All 12 runs pass (§20).
- **Resting captures** (top, model information, bottom/close) at all nine
  Gallery viewports. **World map open** at all nine (§8).
- **Early frames:** §7.
- **Journeys** at 1440×900 and 390×844:

  | Journey | Result |
  | --- | --- |
  | Gallery → Modern Kitchen → breadcrumb → back → forward | chamber ↔ `/world/gallery#modern-kitchen` (exhibit at 151px, visible); no header frame |
  | Chamber → World map → Back to Lobby | map in viewport; `/world` Lobby; no header frame |
  | Chamber → Exit to website | `/`, editorial header visible, ivory ground, no marker |
  | Next → previous → back → forward | URLs keep `?from=gallery`, shell kept, titles follow |
  | Cross-context: `?from=gallery` → Gallery → `/worlds` → Modern Kitchen | `/worlds/modern-kitchen` in the catalogue shell (header visible, ivory, crumb `/worlds#modern-kitchen`, no World chrome); back ×3 returns to the chamber |
  | `/worlds` → Modern Bathroom → breadcrumb | catalogue shell throughout; `/worlds#modern-bathroom`, card visible |

- **Regression captures.**
  - **Gallery:** every settled capture (arrival, three scroll stops, end,
    World map, focus) matches `b05b003` within 1/255 at 1440, 820, 390 and
    844. The 250 ms arrival frame differs by 65/255 (1440) and 156/255
    (844). Two runs of the same build differ by exactly the same amounts:
    capture timing during the reveal.
  - **Lobby:** within 6/255 (1440) and 0 (390), PASS 07's raster-noise
    level.

Screenshots stay local (scratchpad) and are not committed.

## 26. Known issues

1. **Escape with the World map open** returns to the Gallery. It does not
   close the map, because PASS 07's detail key handler owns Escape and the
   map is a native `<details>`. The map closes from its own summary.
   Closing the map first would change `WorldDetail` or add client script to
   `WorldChrome`; both were outside this pass.
2. **ENTER 3D WORLD is below the fold** at 1366×768 and in short landscape,
   in both contexts. The chamber improves short landscape by 34px but does
   not change PASS 07's stage proportions.
3. **`:has()` is required.**
   - Supported since Chrome 105, Safari 15.4 and Firefox 121.
   - In a browser without it, the editorial header would stay fixed over
     the World chrome and the footer would show. The chamber's own ground
     still paints.
4. **The catalogue page loads two extra stylesheets** (~2.8 KB transferred)
   because vite-rsc links CSS by static import graph, not by render.
5. **Canonical deferred** (§23).
6. **The resting ENTER focus ring follows `currentColor`.** It is
   ground-coloured over the poster. It is visible on the four current
   posters; a future poster with a dark lower centre would weaken it.
7. **Measurement scope.** Headless desktop Chrome with emulated phones and
   touch, against the live Sketchfab service. No Safari, Firefox, real
   devices or field data.

## 27. PASS 09 boundary

**PASS 08 delivers** Gallery exhibits inside the World shell. The same
route, the same detail and the same viewer serve both contexts; the
validated context controls only the shell.

**Stable contracts:**

- `data-world-detail-shell="gallery"` and `.world-chamber`.
- `WorldDetailShell` (a server component).
- Metadata that does not depend on the context.
- Design-system §9 rule 15.
- `yarn check:world-shell`.

**Not started:** Room 02 Objects, Archive, Lab, Studio, a Lobby GLB, a
Gallery GLB, a local GLB viewer, the Sketchfab Viewer API.

**PASS 09 is to be chosen after review.**
