# TP3D PASS 07 — Gallery exhibit → live 3D experience

PASS 07 makes the step from a Gallery exhibit to its live 3D view deliberate
and reversible. The detail page now knows when the visitor came from Room 01
Gallery, offers an explicit way back to that exhibit, and browses the
curation. Entering the 3D view no longer swaps the poster for a loading frame:
the poster stays while the Sketchfab viewer loads beneath it and yields only
once the viewer has loaded.

Rules come from [TP3D-DESIGN-SYSTEM.md](TP3D-DESIGN-SYSTEM.md); this pass adds
§9 rule 14, "Interactive 3D is explicit and reversible". The previous pass is
[TP3D-PASS-06-GALLERY.md](TP3D-PASS-06-GALLERY.md).

| Item | Value |
| --- | --- |
| Date | 2026-10-04 |
| Starting HEAD | `e6a1023` — feat(world): add Room 01 Gallery exhibition |
| Changed | `/worlds/[slug]` reads a validated `?from=gallery`; `WorldDetail` owns a three-state viewer; `WorldDetailStage` keeps the poster mounted, uses one stable toggle and a live status; `SketchfabViewer` reports `onReady` and is inert until live; detail stage CSS (states, band, tokens, 44px fullscreen); Gallery exhibit links and fragment ids |
| Added | `lib/world-detail-context.ts`, `components/worlds/world-viewer-state.ts`, `yarn check:exhibit` |
| Not changed | Gallery composition and order, Lobby, World chrome, portal, homepage, `/worlds` catalogue and its URLs, the detail page's architecture (context bar, stage, info, rail, editorial block), model information, credits, external links |
| Not introduced | Sketchfab Viewer API or script, postMessage, preloading, a frame loop, a new dependency or state library, a `/world/gallery/[slug]` route, conditional root chrome |

How measurements were taken:

- Headless Chrome 154 on this Windows 11 workstation (RTX 3090), against
  local production builds (`yarn build` + `yarn start`) and the live
  Sketchfab embed over the internet.
- The `e6a1023` baselines (catalogue detail pixels and computed styles,
  Gallery captures, Lobby, catalogue HTML) were captured from its build
  before any change.
- **Network.** Sketchfab requests were counted with site isolation disabled,
  so the cross-origin iframe's requests appear in the page's network log.
- **Emulation.** Focus behaviour used `Emulation.setFocusEmulationEnabled`.
  Cancelling during loading was tested behind 2.5 s of emulated latency,
  because the cached embed often loads in under 60 ms.
- Reduced motion was pinned explicitly (this machine reports `reduce`).
- This is not field data.

---

## 1. Before state

At `e6a1023`:

- Gallery exhibits linked `/worlds/[slug]`, exactly like catalogue cards. The
  detail page could not tell them apart.
- **Return paths.** The breadcrumb ("3D WORLDS") and Escape always led to
  `/worlds#slug`.
- **Browse set.** Previous, next and the rail browsed every world; the count
  was the catalogue count.
- **Viewer.** A local `viewerOpen` boolean in the stage. "ENTER 3D WORLD"
  unmounted the poster and every annotation and mounted the iframe with
  "LOADING 3D VIEW" over a charcoal frame. There was no way back except
  switching worlds or reloading.
- Escape always left the page, even with the viewer open.

## 2. Problem solved

1. **Context.** The detail page now knows the visitor came from the
   Gallery. Without breaking catalogue visits, it gives:
   - a real way back to the exhibit;
   - a curated browse set;
   - URLs that keep the context.
2. **Threshold.** The 2D exhibit becomes spatial without a blank frame. The
   poster holds until the viewer has loaded, the step can be cancelled, and
   the live view can always be exited back to the poster.

## 3. Detail context model

One detail route serves two contexts. `lib/world-detail-context.ts` (pure,
no data imports) defines:

```ts
type WorldDetailContext = {
  kind: 'catalogue' | 'gallery';
  label: string;       // '3D WORLDS' | 'ROOM 01 / GALLERY'
  returnPath: string;  // '/worlds'   | '/world/gallery'
  query: string;       // ''          | '?from=gallery'
};
```

The context changes only the following. Poster, viewer, model information,
credits, fullscreen, switching and the viewer lifecycle are shared.

- **Breadcrumb:** label and target.
- **Return target:** breadcrumb and Escape.
- **Browse set:** previous, next, rail and count.
- **URLs:** the ones the page writes into history.

## 4. `from=gallery` validation

`app/worlds/[slug]/page.tsx` resolves the context on the server:

- **Gallery** only when `from === 'gallery'` **and** the slug is in
  `galleryExhibits`. The label and return path come from the Gallery entry
  in `worldRooms`.
- **Catalogue** for everything else: no query, `?from=lobby`,
  `?from=GALLERY`, an empty value, a repeated parameter
  (`?from=gallery&from=gallery` arrives as an array), or a world outside the
  curation. An invalid context never produces a 404.
- **Server-side.** The route is dynamic (`ƒ`), so refresh, new tabs and
  shared links render the right context. Correctness never depends on
  `sessionStorage`; the catalogue cards' existing origin key is left as it
  was.
- **Canonical identity.** The content identity stays `/worlds/[slug]`. No
  second route encodes the origin.

## 5. Gallery return path

- Every Gallery exhibit article carries `id={slug}`; the `h2` keeps
  `exhibit-{slug}`, so no id repeats.
- `.wg-exhibit` has `scroll-margin-top: clamp(24px, 6svh, 72px)`, so a
  fragment lands with a margin of wall above the work.
- In Gallery context the breadcrumb is
  `<a href="/world/gallery#slug"><span class="sr-only">Back to </span>ROOM 01 / GALLERY</a>`.
  The accessible name is "Back to ROOM 01 / GALLERY", which contains the
  visible label.
- **Measured.** Back to Gallery and Escape both land on the exhibit
  (`targetTop` 150–154px, visible) at 1440×900 and 390×844, and so does a
  direct load of `/world/gallery#minimalistic-modern-bedroom`.
- **Browser Back** still uses ordinary history restoration. No scroll
  storage was added.

## 6. Browse-set behaviour

| | Catalogue context | Gallery context |
| --- | --- | --- |
| Previous / next | all `worlds`, catalogue order | `galleryExhibits`, curation order |
| Rail | all `worlds` | `galleryExhibits` |
| Count (switcher and stage) | index / catalogue total | index / curation total (`03 / 04`) |

Both sets currently hold the same four worlds in the same order. The
difference is proven with a two-exhibit curation in `check-exhibit`: its
rail and its `01 / 02` count follow the curation.

## 7. URL and history behaviour

| Action | Gallery context | Catalogue context |
| --- | --- | --- |
| Arrive | `/worlds/[slug]?from=gallery` | `/worlds/[slug]` |
| Switch (previous, next, rail, arrows) | `pushState` → `/worlds/[next]?from=gallery` | `pushState` → `/worlds/[next]` |
| Back / forward | the slug from the URL is reselected; the context is kept | same |
| Refresh | the server re-resolves the same context | same |

The URL stays the source of truth for the active slug. Measured in every
lifecycle run: switching from live and from loading kept the query, and
back, forward and refresh reconstructed the right world and context.

## 8. Viewer state model

`components/worlds/world-viewer-state.ts`, owned by `WorldDetail`:

```
poster ──enter──▶ loading ──ready──▶ live
  ▲                  │                 │
  └── close / switch (cancel, exit, Escape, another world) ◀┘
```

- `nextViewerState`:
  - `enter` works only from `poster`;
  - `ready` works only from `loading`, so a late load after a close changes
    nothing;
  - `close` and `switch` always return to `poster`.
- The iframe exists only in `loading` and `live` (`viewerMounted`).
- `detailKeyAction` decides what Escape and the arrows mean (§13).
- One owner means Escape, switching and the stage always agree. There is no
  generic state-machine library.

## 9. Poster → loading

On ENTER 3D WORLD, by pointer or keyboard:

- **The poster stays mounted at full opacity.** It is never unmounted in any
  state, so there is no blank frame.
- **The iframe mounts beneath it.**
  - The viewer layer is at z 0, the poster at z 1.
  - The viewer sits below a 60px control band.
  - It is `inert` with `pointer-events: none` until live.
- **The annotations withdraw** (frame, intro, count, notes; opacity,
  `fast`). The stage veil deepens slightly, from 13% to 30%.
- **Truthful status.** "Opening 3D space" appears centred on the poster, in
  an `<output aria-live="polite">`. There is no percentage and no progress
  bar.
- **The same button now reads "CANCEL OPENING"** and keeps focus.

## 10. Loading → live

- The iframe's `load` event calls `onReady`.
- **The poster yields:** opacity 1 → 0 over `normal` (650 ms), primary
  curve, then `pointer-events: none`.
- **The viewer becomes interactive.** At the stage centre, `elementFromPoint`
  returns the iframe.
- **The status becomes "3D view ready"**, visually hidden and announced once.
- **Controls move into the band.** The toggle ("← EXIT 3D VIEW") and
  fullscreen fade into the band above the viewer, so nothing of ours sits on
  Sketchfab's interface. On this account Sketchfab shows its title bar
  despite `ui_infos=0`, and its controls bottom right.
- **No second step.** The one explicit activation is enough; there is no
  play button.
- **Measured** time from activation to `load`: 319–2,408 ms across the
  matrix, typically about 420 ms.
- What follows is Sketchfab's own real loading screen (a blurred preview and
  progress) while the model streams; see §28.

## 11. Cancel loading

- During loading the toggle reads "CANCEL OPENING". Activating it returns to
  `poster`:
  - the iframe unmounts;
  - the status clears;
  - the annotations return;
  - focus stays on the toggle.
- No timers or listeners are left and there is no navigation.
- **Measured** in all 18 lifecycle runs: loading → poster, 0 iframes, same
  URL.

## 12. Exit live view

- "← EXIT 3D VIEW" (or Escape) returns to `poster`:
  - the iframe unmounts at once;
  - the poster fades back over `fast` from the stage ground;
  - the annotations return;
  - pointer depth is available again;
  - scroll, the world and the context stay.
- The route does not reload, and the poster is not refetched (it never left
  the DOM).

## 13. Escape hierarchy

| State | Escape |
| --- | --- |
| loading | cancels the viewer (no navigation) |
| live | closes the viewer (no navigation) |
| poster | returns to the context: `/world/gallery#slug` or `/worlds#slug` |

- **Measured double Escape:**
  - Gallery: live → poster → `/world/gallery#modern-bathroom`.
  - Catalogue: live → poster → `/worlds#modern-bathroom`.
  - Both at 1440×900 and 390×844.
- While the viewer is open, the arrows no longer switch worlds.
- Keys with a modifier, keys typed into a field and keys already handled are
  ignored.
- Keys pressed inside the cross-origin iframe never reach the page (§28).

## 14. World switching

- Previous, next, the rail, the arrow keys (on the poster) and back/forward
  all send `switch` first, so the current iframe unmounts at once. The next
  world rests on its own poster until its own ENTER 3D WORLD.
- **Measured:**
  - From live and from loading: poster, 0 iframes, 0 new Sketchfab requests
    in the following 3.2 s.
  - There is never more than one iframe.

## 15. Sketchfab lifecycle

- Before activation: no iframe, no Sketchfab URL in the server HTML or the
  DOM, and no request on poster idle (3 s), hover or focus.
- **Activation mounts exactly one iframe**
  (`https://sketchfab.com/models/{uid}/embed?autostart=1&ui_infos=0&ui_stop=0`).
  `autostart=1` applies only because the visitor asked.
- **The iframe unmounts on:** cancel, exit, Escape, a switch, or back/forward
  to another world.
- **Never:** the next model preloaded, the Gallery's models preloaded, or the
  Viewer API, a script tag or postMessage used.

## 16. Fullscreen

- There is one fullscreen implementation, on the stage, in every state.
- **Measured at 1440:**
  - Poster, loading and live all report
    `document.fullscreenElement === .world-detail-stage`.
  - The toggle stays inside the fullscreen element; in live it sits in the
    band at (8, 8), 44px tall.
  - Exiting the viewer inside fullscreen returns the poster, still
    fullscreen.
  - Fullscreen also opens from the live band.
- The fullscreen button grew from 36 to 44px to meet the touch-target rule.
  This is the only visual change to the resting poster (§24).

## 17. Desktop

At 1440×900 and 1366×768:

- **The resting poster is unchanged.**
- **Loading:** the poster dims slightly, with the centred status and
  "CANCEL OPENING" at the bottom centre.
- **Live:** a 60px band on the stage ground holds Exit (left) and
  fullscreen (right); the scene fills the rest.
- Pointer depth rests outside the poster state, and the page's idle RAF is 0
  in poster and live.

## 18. Tablet

- **1180×820 and 820×1180:** the same states and the same band. There is no
  hover dependency and no tablet-only effect.
- The existing stage, info and rail stacking is unchanged (the rail moves
  below the stage at ≤820px).

## 19. Mobile

At 390×844 and 360×740:

- The poster state is unchanged; the toggle stays 52px tall.
- **Loading:** the status pill is legible on the poster, and "CANCEL
  OPENING" stays at the bottom centre.
- **Live:** the band holds "← EXIT 3D VIEW" (44px) and fullscreen (44px)
  without overlap. Sketchfab's controls stay clear at the bottom.
- There is no pointer depth (touch never drives it).
- **Short landscape (844×390, 740×360).** The stage is taller than the
  screen, so you scroll down to ENTER 3D WORLD.
  - In live the band is brought into view clear of the fixed site header.
  - Measured: Exit at y 175 (header bottom 86 / 80), fullscreen visible, no
    overlap.

## 20. Reduced motion

- **Removed:** the global kill switch cuts every transition and animation,
  and the existing reduced block removes poster depth and transitions.
- **Kept:** the poster still stays during loading (measured: poster opacity
  1 while loading in reduced runs). At ready it cuts to live.
- There is no spatial handoff, scale, clip travel or decorative depth.

## 21. Accessibility

- **Structure.** Exactly one `h1`. The breadcrumb is a real link whose
  accessible name contains its visible label (§5).
- **One toggle.** A single `<button>` stays mounted through poster, loading
  and live. Its text is its name ("ENTER 3D WORLD", "CANCEL OPENING", "EXIT
  3D VIEW"). Focus stays on it through every state change, as measured in
  all 18 lifecycle runs (keyboard activation, then Escape).
- **Status.** An `<output aria-live="polite">` changes only with the state:
  "Opening 3D space", "3D view ready", then empty.
- **The iframe** keeps its meaningful title ("{title} — interactive 3D
  view"). It is inert (no focus, no pointer) while loading and comes after
  the toggle in DOM order, so Tab goes from Exit into the scene.
- **Fullscreen** has a meaningful label ("View {title} fullscreen") and a
  44px target.
- **Focus safety.**
  - No focus trap, and no auto-focus into the cross-origin iframe.
  - Escape closes the viewer first.
  - Nothing focusable hides under the poster.

## 22. Performance

- **Before activation, PASS 07 adds no Sketchfab cost:** 0 requests, 0
  iframes, 0 model traffic, measured on every run.
- **Assets (raw / gzip):**

  | | PASS 06 | PASS 07 |
  | --- | --- | --- |
  | All JS | 1,231,879 / 357,439 B | 1,233,214 / 358,034 B (+1,335 / +595) |
  | All CSS | 285,175 / 52,920 B | 287,580 / 53,259 B (+2,405 / +339) |
  | `world-detail.js` | 8,349 / 2,952 B | 9,684 / 3,541 B |
  | `worlds.css` | 20,011 / 4,600 B | 22,376 / 4,932 B |

  Every other asset the detail route loads is byte-identical.
- **No frame loop.** No new RAF: the only RAF on the detail page is the
  existing per-pointer-move depth frame, and the page's idle RAF is 0 in
  poster and live. Sketchfab's own rendering inside the iframe is external.

## 23. Network measurements

**Cold cache, at the resting poster:**

| Page | Requests | Transferred | Sketchfab | Three.js |
| --- | --- | --- | --- | --- |
| `/worlds/modern-kitchen` 1440×900 | 49 | 968,987 B | 0 | 0 |
| `/worlds/modern-kitchen?from=gallery` 1440×900 | 52 | 969,896 B | 0 | 0 |
| `/worlds/modern-kitchen` 390×844 | 42 | 533,781 B | 0 | 0 |
| `/worlds/modern-kitchen?from=gallery` 390×844 | 45 | 534,686 B | 0 | 0 |

The Gallery context's three extra requests are vinext's default viewport
prefetch of the breadcrumb target: the room's two stylesheets and one chunk.
The catalogue context prefetches `/worlds` the same way, as before.

**Lifecycle, every run:**

| Phase | Sketchfab requests |
| --- | --- |
| Poster idle 3 s | 0 |
| Hover + focus ENTER | 0 |
| Activation → `load` | 41–43 by the time the iframe reported load |
| Exit, cancel | iframe gone |
| Switch from live or loading | 0 new in 3.2 s |
| Re-enter | a new embed, only on the new explicit ENTER |

The homepage is unchanged: 48 requests, the same as PASS 06.

## 24. Catalogue regression

- **Catalogue-origin detail keeps everything:**
  - the plain URL (no `from`);
  - the full browse set and catalogue order;
  - the "3D WORLDS" return link to `/worlds#slug`;
  - Escape to `/worlds#slug` (after closing any viewer);
  - metadata, external links, credits, fullscreen and switching.
- **Catalogue cards still link `/worlds/[slug]`.** `check-exhibit` fails if
  any catalogue component adds the Gallery context.
- **Resting poster pixels** are identical to `e6a1023` at 1440, 820 and 390
  except the fullscreen button box (36 → 44px). Elsewhere the differences
  are at most 6/255, and two runs of the same build differ by the same
  amount, so that is raster noise.
- **`/worlds` behaviour** (`readWorldQuery`, `selectWorlds`,
  `writeWorldQuery`) is locked by `check:gallery` and `check:worlds`, both
  passing.

## 25. Gallery regression

- The only Gallery changes are the exhibit link (`?from=gallery`) and the
  article `id`, with its scroll margin.
- **Pixels.** Captures at 1440, 820, 390 and 844 (arrival, three scroll
  stops, end, World map) are identical to PASS 06 in 22 of 24 frames; two
  differ by at most 6/255 (raster noise).
- **Unchanged:** composition, curation order, WorldChrome, World map,
  arrival, 2.5D, reduced motion, the full-catalogue link and Back to Lobby.
  `check:gallery` passes with its link assertions updated to the new
  contract.
- **The Lobby** is untouched: its markup digest is locked, and its pixels
  match the PASS 05/06 baseline within 2/255.

## 26. Tests

`yarn check:exhibit` (`scripts/check-exhibit.mjs`) unit-tests the context,
URL, state and key logic. It renders the real `WorldDetail` (both contexts)
and `WorldDetailStage` (all three states) to markup, and checks CSS and
source contracts.

| # | Requirement | Where |
| --- | --- | --- |
| 1–2 | Gallery links carry `?from=gallery`; catalogue cards do not | `check-exhibit`, `check-gallery`, `check-site` |
| 3–4 | Gallery context only for curated slugs; everything else falls back | unit tests (incl. repeated, empty and other values); `check-site` against the server |
| 5–6 | Breadcrumbs `/world/gallery#slug` and `/worlds#slug` | rendered markup + served HTML |
| 7–8, 11–13 | Browse sets, rails and counts per context, including a two-exhibit curation | rendered markup + served HTML |
| 9–10 | Switching keeps or omits the query | source contract + browser |
| 14–15 | Unique fragment ids; direct `/world/gallery#slug` lands on the exhibit | `check-gallery`, `check-site`, browser |
| 16–18 | Initial poster, no iframe, no Sketchfab URL | rendered markup, served HTML, browser network |
| 19–28 | Enter, loading (one iframe, poster mounted), live (interactive, annotations gone), exit and cancel (iframe gone) | state model + rendered stage per state + CSS + browser |
| 29–32 | Escape hierarchy | key-action tests + browser double-Escape journeys |
| 33–36 | Switching from live or loading → poster; never auto-loads; at most one iframe | state model + source + browser network |
| 37 | Fullscreen on the stage | source + browser probe |
| 38 | Reduced motion | CSS + browser reduced runs |
| 39–40 | Stable toggle; accessible status | rendered markup per state + browser focus |
| 41 | No new RAF loop | source scan + browser RAF counts |
| 42–45 | `/worlds`, Gallery, Lobby, homepage | `check:worlds`, `check:gallery`, `check:world`, `check:home`, `check:routes` |
| 46 | Production build | `yarn build`, `yarn build:vercel` |

**Mutation checks.** Twelve deliberate regressions each fail
`check-exhibit`:

- context ignoring the curation;
- switching that keeps the viewer;
- history dropping the context;
- Escape leaving while live;
- arrows switching while live;
- an iframe on the poster;
- a viewer interactive while loading;
- a live poster still taking the pointer;
- the Gallery link losing its context;
- an unannounced status;
- catalogue cards claiming the Gallery;
- a late load reopening a closed viewer.

## 27. Visual QA

**Lifecycle matrix.** 1440×900, 1366×768, 1180×820, 820×1180, 390×844,
360×740 and 844×390, in both contexts, plus reduced motion at 1440 and 390
in both: 18 runs. Each captures poster rest, focus, keyboard activation,
loading, handoff, live, Escape back to poster, cancel, switch from live and
from loading, back, forward, refresh, and Escape to the context. All 18 pass
every check: no errors, no Sketchfab before activation, one iframe while
open, focus kept, the URL and context kept.

**Journeys** at 1440×900 and 390×844:

| Journey | Result |
| --- | --- |
| `/world` → Gallery → Modern Kitchen → ENTER → EXIT → Back to Gallery | live → poster → `/world/gallery#modern-kitchen`, exhibit visible |
| Gallery → Bedroom → next → viewer → Escape → Escape | Bathroom (`?from=gallery`) live → poster → `/world/gallery#modern-bathroom` |
| `/worlds` → Modern Bathroom → viewer → Escape → Escape | live → poster → `/worlds#modern-bathroom` |
| Direct `/worlds/modern-kitchen` and `?from=gallery`; refresh; back/forward | context and world preserved (matrix runs) |

Screenshots stay local (scratchpad) and are not committed.

## 28. Known issues

1. **Iframe load is not model-ready.** The iframe's `load` fires when
   Sketchfab's embed document is ready. Sketchfab then shows its own real
   loading screen (a blurred preview and progress) while the model streams,
   so after the handoff the visitor briefly sees Sketchfab's loader, not the
   model. Knowing when the model is ready needs the Sketchfab Viewer API,
   which this pass rules out.
2. **No reliable error signal.** A cross-origin iframe that fails or is
   blocked still fires `load`, so the handoff then reveals the error inside
   the frame. Exit and Cancel always work, and VIEW ON SKETCHFAB remains in
   model information.
3. **Keys inside the iframe stay there.** While focus is inside the
   cross-origin viewer, Escape and the arrows go to Sketchfab, not to the
   page. Use Tab back out, or EXIT 3D VIEW.
4. **`ui_infos=0` is not honoured on this account.** Sketchfab shows its
   title bar; the control band keeps our controls off it.
5. **The detail page keeps the editorial chrome in Gallery context** (site
   header and footer), by design. Making root chrome conditional on a query
   is a later route-shell decision.
6. **Gallery context costs three prefetch requests** (vinext's default Link
   prefetch of the breadcrumb target).
7. **No canonical link for `?from=gallery` URLs.** The app has no
   `metadataBase`; the content identity is still `/worlds/[slug]`.
8. **Repeat entries re-request the embed** (about 40 requests each,
   mostly cached by the browser). Nothing is kept warm between entries, by
   design.
9. **Measurement scope.** Headless desktop Chrome with emulated phones and
   touch, against the live Sketchfab service. No Safari, Firefox, real
   devices or field data.

## 29. PASS 08 boundary

**PASS 07 delivers** a context-aware detail page and an explicit,
reversible poster → live viewer threshold.

**Stable contracts:**

- `?from=gallery` and `resolveWorldDetailContext`.
- `worldDetailHref` / `worldReturnHref` / `galleryExhibitHref`.
- `ViewerState` `poster | loading | live` and `detailKeyAction`.
- Gallery fragment ids.
- `data-viewer` on the stage.
- Design-system §9 rule 14.
- `yarn check:exhibit`.

**Not started:** Objects, Archive, Lab, Studio, a Lobby or Gallery GLB, a
local GLB viewer, the Sketchfab API, and any marketplace.

**PASS 08 is to be chosen after review**, from:

- **A. Gallery / detail World-shell integration,** if the editorial chrome
  seam on the detail page is too strong.
- **B. Real Lobby or Gallery 3D,** if a proper GLB environment asset
  exists.
- **C. Room 02 Objects foundation,** if the building expands before real
  environments.
