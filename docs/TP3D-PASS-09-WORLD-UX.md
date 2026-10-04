# TP3D PASS 09 — World navigation and viewing-chamber UX

PASS 09 closes the interaction and viewport seams PASS 08 left inside the
existing World. It adds no room and no new technology.

- **Escape.** The World map now owns Escape while it is open.
- **One hierarchy.** Escape always follows map → viewer → context.
- **ENTER on screen.** ENTER 3D WORLD is visible without scrolling at laptop
  heights and in short landscape.
- **Live controls.** The loading and live controls stay on screen, and going
  live no longer scrolls the page.
- **Focus.** Focus over a poster reads whatever the poster's luminance.

Rules come from [TP3D-DESIGN-SYSTEM.md](TP3D-DESIGN-SYSTEM.md). This pass
adds §9 rules 16 and 17 and the §11 focus guidance for controls over
imagery. The previous pass is
[TP3D-PASS-08-WORLD-SHELL.md](TP3D-PASS-08-WORLD-SHELL.md).

| Item | Value |
| --- | --- |
| Date | 2026-10-04 |
| Starting HEAD | `774048d` — feat(worlds): integrate Gallery details into World shell |
| Added | `components/world/world-map-escape.ts`, `components/world/world-map-disclosure.tsx`, `yarn check:world-ux` |
| Changed | `WorldChrome` renders its native `<details>` through the island; `worlds.css` (definite detail height, short-landscape stack, live scroll margin, focus mat, 44px switcher targets); `world-detail-shell.css` (chamber reserve, scroll padding, focus mat, stack media); module maps and locks in `check-gallery`, `check-world-gateway`, `check-world-shell` |
| Not changed | `WorldDetail`, `WorldDetailStage`, `SketchfabViewer`, the viewer state model, `WorldDetailShell`, `?from=gallery`, routes, curation, slugs, Lobby and Gallery composition, homepage |
| Not introduced | a route, redirect, custom modal, global state, observer, frame loop, animation library, Three.js, canvas, Sketchfab API, new asset or dependency |

How measurements were taken:

- **Environment.** Headless Chrome 154 on this Windows 11 workstation,
  against local production builds (`yarn build` + `yarn start`) and the live
  Sketchfab embed.
- **Baselines.** The `774048d` captures were taken from its build before any
  change: geometry, resting states, Gallery, Lobby, focus, network and
  bundle.
- **Geometry.** Read with `getBoundingClientRect` in each state. Loading was
  held behind 2.5 s of emulated latency with the cache disabled.
- **Keys.** Real CDP key events; focus behaviour under
  `Emulation.setFocusEmulationEnabled`.
- **Sketchfab.** Requests counted with site isolation disabled, so the
  cross-origin iframe's requests appear in the page's log.
- Reduced motion was pinned explicitly (this machine reports `reduce`).
- This is not field data.

---

## 1. Starting state

At `774048d` (measured):

- **Escape with the World map open** left the page. The map is a native
  `<details>`, and `WorldDetail`'s window-level key handler returned to
  `/world/gallery#slug` (PASS 08 known issue 1).
- **ENTER 3D WORLD was below the fold** on first paint, in one or both
  contexts, at:
  - 1366×768: catalogue 765–817, Gallery 780–832;
  - 1280×720: 781–833 / 774–826;
  - 1180×820: catalogue 774–826;
  - 844×390: 762–814 / 744–796;
  - 740×360 and 667×375: 547–599 / 513–565.
- **Focus failed the area test everywhere.** Indicator pixels with ≥ 3:1
  contrast against the same pixel unfocused, divided by a 2px perimeter of
  the control (WCAG 2.4.13 style; 1.0 or more passes), worst of the four
  posters:

  | Context | ENTER | Fullscreen | Thumbnail |
  | --- | --- | --- | --- |
  | Catalogue | 0.00 | 0.00 | 0.00 |
  | Gallery chamber | 0.19 | 0.65 | 0.60 |

- **Going live scrolled the page.** With the page 40px down, it
  smooth-scrolled back to the top even though EXIT 3D VIEW was already in
  view (found during this pass).
- **Catalogue previous/next** were 30 × 38px targets.

## 2. Problems solved

1. **Escape.** The World map owns Escape while open; it closes and never
   navigates.
2. **One deterministic hierarchy.** Map → viewer → context, in both
   contexts and every viewer state.
3. **ENTER on screen** without scrolling at 1440×900, 1366×768, 1280×720 and
   1180×820, and in short landscape (§7–§10).
4. **Loading and live controls** (CANCEL, EXIT, fullscreen) are on screen at
   every audited viewport. The live iframe is wholly on screen in short
   landscape.
5. **Focus** over imagery is an explicit ring on a mat in both shells (§15).
6. **A doubled scroll clearance** that moved the page on going live
   (§13).
7. **Catalogue previous/next** became 44px targets, with no visual change.

## 3. Escape ownership model

**The topmost layer the visitor opened owns Escape first.**

| State | Escape |
| --- | --- |
| World map open | closes the map (nothing else) |
| Map closed, viewer loading or live | closes the viewer (PASS 07) |
| Map closed, poster | returns to the context: `/world/gallery#slug` or `/worlds#slug` |

- **Why the order is deterministic:**
  - The map listens on `window` in the **capture** phase, so it runs before
    every page handler, wherever focus is.
  - It calls `preventDefault()` and `stopPropagation()`. `WorldDetail`'s
    bubble-phase handler is never reached, and it would ignore the event
    anyway (`handled: event.defaultPrevented`).
- **The catalogue has no World map,** so its order is PASS 07's: viewer,
  then catalogue.
- **The Lobby and the Gallery have no page Escape.** After the map closes, a
  further Escape does nothing there.
- **Arrows are unchanged.** They switch worlds on the poster only (PASS 07).
  With the map open on the poster, ArrowRight still switches (measured); the
  map stays open.

## 4. World Map behaviour

- **Still a native `<details>`/`<summary>`.** The summary and every room
  stay server-rendered in `WorldChrome`. The rendered markup is unchanged:
  the PASS 06 Lobby digest still passes.
- **`WorldMapDisclosure`** (`'use client'`) renders `<details ref>` around
  those server children. Its only behaviour is `bindWorldMapEscape`.
- **`world-map-escape.ts`** has no imports.
  - It adds its keydown listener when the disclosure opens (`toggle`) and
    removes it when it closes.
  - Nothing listens while the map is closed.
  - It binds at once if the map was opened before hydration.
- **Elsewhere:** `/world`, `/world/gallery` and Gallery-context details
  behave the same. Escape closes the map; the URL and scroll stay put.
- **Measured open** at 1440×900, 1366×768, 1180×820, 820×1180, 390×844,
  360×740, 844×390, 740×360 and 667×375. Every time: fully inside the
  viewport, no horizontal overflow, Gallery "You are here", planned rooms as
  text.

## 5. Focus restoration

- **Focus inside the map, or nowhere** (on a room link, the summary, or
  `body` after a pointer open that did not focus): after Escape, focus goes
  to the summary with `focus({ preventScroll: true })`.
  - Measured after closing: `:focus-visible` true, scrollY unchanged.
- **Focus elsewhere on the page** (Tab moved on while the map stayed open):
  the map closes and focus stays where the visitor is. Escape never pulls
  focus back up the page.
- **Closed map links are not focusable** (native `<details>`). The real Tab
  cycle in PASS 08 already skipped them.

## 6. Viewer interaction hierarchy

- **The viewer files are byte-identical to PASS 07:** `WorldDetail`,
  `WorldDetailStage`, `SketchfabViewer`, `world-viewer-state.ts`
  (digest-locked in `check-world-ux` and `check-world-shell`).
- **Unchanged behaviour:**
  - the one stable toggle (ENTER → CANCEL → EXIT) and its focus;
  - Escape closes the viewer before leaving;
  - arrows on the poster only;
  - switching closes the viewer;
  - fullscreen on the stage.
- **Keyboard matrix** (real keys) at 1440×900, 1366×768, 390×844, 844×390 and
  740×360:

  | Scenario | Escape 1 | Escape 2 | Escape 3 |
  | --- | --- | --- | --- |
  | Gallery, poster, map closed | → `/world/gallery#modern-kitchen` | | |
  | Gallery, poster, map open | map closes, focus on summary | → Gallery | |
  | Gallery, loading, map closed | → poster, iframe gone | | |
  | Gallery, loading, map open | map closes, still loading | → poster | → Gallery |
  | Gallery, live, map closed | → poster, iframe gone | | |
  | Gallery, live, map open | map closes, still live | → poster | → Gallery |
  | Catalogue, loading / live | → poster | → `/worlds#modern-kitchen` | |
  | Lobby / Gallery, map open | map closes, focus on summary | nothing | |

- **In every run:** the URL changes only on the return step, scrollY never
  moves before it, and there are no page errors.

## 7. Desktop viewport audit

**Cause, measured.**

- `.world-detail-layout` had `min-height: min(740px, calc(100svh - 166px))`
  and no height. The grid row therefore grew to the information column's
  content height (clientHeight = scrollHeight in every run):

  | Viewport | Intended | Catalogue row | Chamber row |
  | --- | --- | --- | --- |
  | 1366×768 | 602px | 678px | 717px |
  | 1280×720 | 554px | 694px | 711px |
  | 1180×820 | 654px | 687px | 703px |

- **The chamber also reserved 166px** for the editorial header it does not
  have. Its stage starts at 143px, not 167px.

**Fix:**

```css
.world-detail-layout {
  --detail-top: 166px; /* 102px clearance + 64px context row */
  height: clamp(400px, calc(100svh - var(--detail-top)), 740px);
  grid-template-rows: minmax(0, 1fr);
}
```

- **The chamber's reserve** is its own: `--detail-top: calc(var(--wc-chrome)
  + 64px)`.
- **The information column scrolls,** as it was designed to. Nothing is
  truncated or hidden; e.g. 600 of 678px visible at catalogue 1366×768.
- **The 400px floor** applies only to unusual short desktop windows.

## 8. 1366×768 fix

| | Stage (top, height) | ENTER | Live iframe (height, visible) |
| --- | --- | --- | --- |
| Catalogue before | 167, 678 | 765–817 (below fold) | 618, 541 |
| Catalogue after | 167, 600 | 687–739 | 540, 540 |
| Gallery before | 143, 717 | 780–832 (below fold) | 657, 565 |
| Gallery after | 143, 624 | 687–739 | 564, 564 |

- The stage now ends at the viewport's bottom edge, and so does the live
  iframe: it is wholly on screen.

## 9. 1280×720 behaviour

| | Stage | ENTER | Live iframe |
| --- | --- | --- | --- |
| Catalogue before | 167, 694 | 781–833 (below fold) | 634, 493 |
| Catalogue after | 167, 552 | 639–691 | 492, 492 |
| Gallery before | 143, 711 | 774–826 (below fold) | 651, 517 |
| Gallery after | 143, 576 | 639–691 | 516, 516 |

**1180×820:**

- Catalogue: ENTER 774–826 (below fold) → 739–791.
- Gallery: 766–818 → 739–791.
- The live iframe is wholly on screen (592 and 616px).

**1440×900 loses nothing:**

- The catalogue keeps its 732px stage, pixel-identical.
- The chamber gains 6px (732 → 738).

## 10. Short-landscape strategy

At 1199px wide or less, 540px tall or less, in landscape, short landscape is
interaction-first.

- **Stacked at full width,** as at 820px and below: stage, rail,
  information. At 844×390 the three-column grid had left the stage about
  400px wide.
- **A compact 44px context row.** It is still a 44px target row, and the
  breadcrumb stays.
- **The stage takes exactly the height left** below the header and context:
  `calc(100svh - var(--detail-top) - 1px)`.
  - `--detail-top` is 146px (catalogue) or 68 + 44px (chamber).
  - The floor is 200px.
- **The decorative notes give way.** MATERIALS / LIGHT / RITUALS / A BRIGHTER
  EVERYDAY are `aria-hidden` and set to `display: none`. The intro and count
  stay.
- **ENTER and fullscreen** sit 16px from the stage bottom (28px elsewhere).
- **The live band is 52px** (60px elsewhere), still holding the 44px
  controls.

| Viewport | Context | Stage before → after | ENTER before → after | Live iframe before → after (visible) |
| --- | --- | --- | --- | --- |
| 844×390 | Gallery | 133+691 → 113+277 | 744–796 (below fold) → 322–374 | 631 (197) → 225 (225) |
| 844×390 | Catalogue | 167+675 → 147+243 | 762–814 (below fold) → 322–374 | 615 (163) → 191 (191) |
| 740×360 | Gallery | 133+460 → 113+247 | 513–565 (below fold) → 292–344 | 400 (167) → 195 (195) |
| 740×360 | Catalogue | 167+460 → 147+213 | 547–599 (below fold) → 292–344 | 400 (133) → 161 (161) |
| 667×375 | Gallery | 133+460 → 113+262 | 513–565 (below fold) → 307–359 | 400 (182) → 210 (210) |
| 667×375 | Catalogue | 167+460 → 147+228 | 547–599 (below fold) → 307–359 | 400 (148) → 176 (176) |

- **More of the model on screen.** Before, most of a taller iframe sat below
  the fold. Now the whole iframe is visible, including Sketchfab's own
  bottom bar, and the visible area grows by 28–34px at every short size.
- **Fullscreen** (44px, in the band) is the full-screen path.

## 11. Poster state

- **ENTER 3D WORLD fully on screen** at all 10 audited viewports in both
  contexts (20 of 20).
- **Fullscreen** fully on screen at all 10, both contexts.
- **Phone portrait** is unchanged (§20). The poster's annotations are kept
  except the short-landscape notes.

## 12. Loading state

- **CANCEL OPENING** keeps ENTER's place, fully on screen at all 20
  viewport-context pairs:
  - 1366×768: 687–739;
  - 844×390: 322–374;
  - 740×360: 292–344 in both contexts.
- **The loading status** is centred on the poster and stays readable.
- **Fullscreen** is on screen in every loading capture.

## 13. Live state

- **EXIT 3D VIEW and fullscreen sit in the band** at the stage top, fully on
  screen at all 20 pairs:
  - desktop: EXIT 151–195 (Gallery) / 175–219 (catalogue);
  - short landscape: 117–161 / 151–195.
- **The doubled clearance** (found in this pass):
  - `globals.css` gives the page `scroll-padding-top: 100px`, and PASS 07
    gave the live toggle `scroll-margin-top: 112px`.
  - `scrollIntoView({ block: 'nearest' })` adds the two. EXIT counted as
    hidden unless it sat 212px or more below the viewport top, so going live
    smooth-scrolled the page to the top. Traced at catalogue 1440 from
    scrollY 40 and 300.
- **The fix:**
  - The toggle's margin is now 12px: one 112px clearance with the page's
    padding, as PASS 07 intended.
  - The chamber, which has no fixed header, sets the page's padding to 0
    under its marker.
  - `world-detail-stage.tsx` is untouched. It still scrolls only when EXIT
    is covered or off-screen.
- **Measured from scrollY 40,** after ENTER → live → EXIT → thumbnail →
  fullscreen:
  - The page stays at 40 at 1440×900 and 1366×768 (both contexts), at
    844×390 and 390×844 (Gallery).
  - Catalogue 844×390 moves 1px; EXIT sits at 111px, inside the header
    clearance.
  - A catalogue 390×844 thumbnail switch moves 6px. That is native scroll
    anchoring, unchanged by this pass.
  - From scrollY 0 nothing moves anywhere.

## 14. Control-band measurements

Live state, page at the top: top–bottom (px), all fully on screen.

| Viewport | Gallery EXIT | Gallery fullscreen | Catalogue EXIT | Catalogue fullscreen |
| --- | --- | --- | --- | --- |
| 1440×900 | 156–200 | 156–200 | 175–219 | 175–219 |
| 1366×768 | 151–195 | 151–195 | 175–219 | 175–219 |
| 1280×720 | 151–195 | 151–195 | 175–219 | 175–219 |
| 1180×820 | 151–195 | 151–195 | 175–219 | 175–219 |
| 820×1180 | 181–225 | 181–225 | 175–219 | 175–219 |
| 390×844 | 149–193 | 149–193 | 175–219 | 175–219 |
| 360×740 | 149–193 | 149–193 | 175–219 | 175–219 |
| 844×390 | 117–161 | 117–161 | 151–195 | 151–195 |
| 740×360 | 117–161 | 117–161 | 151–195 | 151–195 |
| 667×375 | 117–161 | 117–161 | 151–195 | 151–195 |

- **Controls stay put.** They keep their PASS 07 positions (bottom centre at
  rest; the band once live) and do not move again within a state.
- **No collision.** The band controls sit above the iframe, clear of
  Sketchfab's own interface.
- **Every target is ≥ 44px:** ENTER 52px; CANCEL / EXIT 44px; fullscreen 44
  × 44.

## 15. Focus-visible strategy

- **An explicit ring on a mat:** one very dark and one very light layer, so
  one of them contrasts whatever the poster's luminance.
  - **Chamber:** 2px `--wl-ivory` ring at 4px offset on a 4px
    `--world-ground` mat, like a hung work's mat and fine frame line.
  - **Catalogue:** 2px `--foreground` ring on a 4px `--background` mat. This
    is the editorial ink, not a World-dark style.
- **Applies to** ENTER / CANCEL / EXIT (one toggle), fullscreen and the rail
  thumbnails.
- **Unchanged rings,** all on flat ground: World map summary, Back to Lobby,
  Exit, breadcrumb, previous/next and the CTAs. That is ivory 1px at 6px in
  the World (14.77:1 on the ground) and walnut 2px at 5px in the catalogue.
- **Why not walnut over imagery:**
  - Walnut on paper leaves a mid-grey gap; both fall under 3:1 against the
    posters' grey floors. Measured at catalogue ENTER on Modern Kitchen: 2%
    of indicator pixels reached 3:1.
  - `check-world-ux` asserts that, for every grey level from 0 to 255, the
    ring or the mat reaches 3:1 in both palettes, and that walnut would not.
- **Measured:** every target passes the area test on all four posters in
  both contexts (table in §25).

## 16. Catalogue behaviour

- **No typography, palette or layout redesign.** Changes are limited to:
  - the definite height at 1366, 1280 and 1180 widths;
  - the short-landscape stack;
  - the focus mat;
  - the 44px switcher targets, drawn in the original 30 × 38 footprint;
  - the 12px live scroll margin.
- **Pixels against `774048d`:**
  - Identical at 1440×900 and 820×1180 (max 0/255) and 390×844 (max 2/255).
  - Changed only where intended: 1366×768, 1280×720, 1180×820 (stage
    height) and 844×390, 740×360 (short-landscape stack).
- **Escape is PASS 07's,** and there is no World map.

## 17. Gallery-detail behaviour

- **Unchanged:** the World shell, WorldChrome, breadcrumb, dark chamber,
  curated rail, curatorial close, viewer and Gallery return.
- **New:** the World map's Escape, the chamber's own height reserve, a 0
  scroll padding and the ivory focus mat.
- **Pixels:** identical at 390×844 and 820×1180, 360×740 within 3/255.
  Changed where intended: the definite height at 1440 (+6px stage), 1366,
  1280 and 1180, and the short-landscape stack.
- **First paint** (throttled, every frame) at 1440×900, 390×844 and 844×390:
  zero ivory pixels in the header band and the frame. No editorial header,
  ivory or footer flash.

## 18. Gallery behaviour

- `/world/gallery`: only the World map's Escape is new.
- **Pixels:** every settled capture at 390×844, 820×1180 and 844×390
  (arrival, three scroll stops, end, World map, focus) is within 12/255 of
  `774048d`. The 250 ms arrival frames differ by capture timing, as in
  PASS 08.
- **1440×900** was re-captured on its own: see §25.

## 19. Lobby behaviour

- `/world`: only the World map's Escape is new.
- **Pixels** at seven viewports, motion and reduced, map open and closed:
  within 8/255 of `774048d`, the raster-noise level recorded since PASS 07.
  The Lobby markup digest is unchanged.

## 20. Mobile portrait

- **Unchanged composition.** The stage is 565px at 390×844 and 496px at
  360×740.
- **ENTER:** 630–682 / 656–708 at 390×844 (Gallery / catalogue), 561–613 /
  587–639 at 360×740. On screen without scrolling. Document flow is kept.

## 21. Reduced motion

- **No motion added.** No new transition, animation or keyframe;
  `check-world-ux` asserts it on every PASS 09 rule.
- **Map, layout, focus:** the map closes instantly and layout changes are
  static. The focus mat is a box-shadow with no transition.
- **Lifecycle:** a reduced-motion run at 390×844 (Gallery) passes every
  step (§25).

## 22. Accessibility

- **The map stays native `<details>`.** The summary is keyboard accessible,
  Escape closes the open map, focus returns to the summary, and closed links
  are not focusable.
- **No focus trap,** no new landmark: one banner (the World chrome) and one
  `main`. One `h1`. The skip link is unchanged.
- **Targets ≥ 44px:** catalogue previous/next are now 44px.
- **The live status** `<output aria-live="polite">` is unchanged.
- **Focus contrast** over imagery is explicit (§15).

## 23. Performance

- **Bundle** (raw / gzip):

  | | `774048d` | PASS 09 |
  | --- | --- | --- |
  | All JS | 1,233,214 / 358,033 B | 1,234,280 / 358,615 B (+1,066 / +582) |
  | `world-map-disclosure` chunk (new) | — | 833 / 491 B |
  | All CSS | 291,850 / 54,264 B | 293,138 / 54,524 B (+1,288 / +260) |
  | `worlds.css` | 22,376 / 4,932 B | 23,125 / 5,075 B |
  | Shell stylesheet | 4,208 / 990 B | 4,725 / 1,102 B |
  | `world-chrome.css` | 3,306 / 1,283 B | unchanged |

- **Cold cache, resting poster:** see §25. The Gallery-context detail gains
  one script request, the island; the catalogue and homepage keep their
  counts.
- **Sketchfab:**
  - 0 requests at the idle poster (3 s) and on hover and focus, in all 20
    lifecycle runs.
  - 41–43 requests by the iframe's `load` after an explicit ENTER.
- **Idle frames:** page RAF is 0 at the idle poster and while live, in every
  run.
- **Nothing persistent:** no observer, timer or frame loop. The Escape
  listener exists only while the map is open.

## 24. Automated tests

`yarn check:world-ux` (`scripts/check-world-ux.mjs`):

| # | Requirement | How |
| --- | --- | --- |
| 1–3 | `<details>` + real `<summary>`; a narrow island (imports only React and its Escape module; no observer, timer or state) | rendered chrome (Lobby and Gallery), source scans |
| 4–9 | Closed map takes no keys; open map closes on Escape, stops propagation, returns focus with `preventScroll`, keeps URL and viewer | event model (window capture → target → bubble, `toggle` queued) driving the real `bindWorldMapEscape` and the real `detailKeyAction` |
| 10–11 | Planned rooms are text; Gallery `aria-current` | rendered chrome |
| 12–18 | Map + live / loading: Escape ×3 → map, viewer, context; catalogue keeps PASS 07 layering | event model |
| 19–21 | ENTER inside the viewport at 1366×768, 1280×720, 1180×820, 1440×900; 1440 keeps 734px | geometry from the shipped CSS values (reserve = padding + context row) |
| 22–29 | Short landscape: stacked, compact context, stage fits, notes hidden, controls ≥ 44px, live area > 150px, information intact | parsed CSS (media-aware) |
| 30–34 | Ring + mat in both shells on ENTER, fullscreen and thumbnails; ≥ 3:1 over every grey for ring or mat; World map ring | parsed CSS + token contrast |
| 35–40 | Viewer files digest-locked to PASS 07; 0 / 1 iframe per state; no new motion | digests, rendered stage, CSS |
| part 6 | One 112px live clearance; the chamber has no page scroll padding | parsed CSS |
| 41–48 | World, Gallery, exhibit, World shell, catalogue, homepage, routes, build | the existing commands, wired in `package.json` |

**Existing tests updated deliberately:**

- **`check-gallery` and `check-world-shell`** map the island into their
  server-component loaders. The markup is unchanged and the Lobby digest
  passes.
- **`check-world-gateway`** still requires the native disclosure; it now
  asserts it in the island.
- **`check-world-shell`** relocks `worlds.css` and `world-chrome.tsx` to
  their PASS 09 digests. Every other PASS 07 lock stands.

**Mutation checks.** Twenty deliberate regressions each fail
`check:world-ux`:

- Escape leaking to the page;
- no focus return;
- focus that scrolls;
- a listener while closed;
- focus stolen from outside the map;
- a dialog role;
- the island importing data;
- the growing row;
- the editorial reserve in the chamber;
- notes left in short landscape;
- a floor that overflows;
- the doubled clearance;
- a `currentColor` chamber ring;
- a 1px chamber ring;
- walnut over imagery;
- no catalogue mat;
- 30 × 38 targets;
- an edited viewer;
- a Lobby Escape handler;
- a band too thin for 44px.

## 25. Visual/browser QA

- **Lifecycle matrix.** 10 viewports × 2 contexts: 1440×900, 1366×768,
  1280×720, 1180×820, 820×1180, 390×844, 360×740, 844×390, 740×360, 667×375.
  - Each run: idle poster, focus, keyboard ENTER, loading, handoff, live,
    Escape, cancel, switch from live and loading, back, forward, refresh,
    Escape to context.
  - **20 of 20 pass**, with no errors.
  - Requests counted after a switch from live (0–11) all precede the
    iframe's removal. The probe traced each: React's commit can wait on
    Sketchfab's main-thread work in this site-isolation-disabled setup.
    None come after removal.
- **Geometry, keyboard and scroll:** §7–§14.
- **World map open:** §4.
- **Focus** over the four posters at 1440×900, keyboard modality. Area ratio
  = pixels with ≥ 3:1 change ÷ (2px × perimeter); 1.0 or more passes. Share =
  part of all changed pixels that reach 3:1. Both columns show the worst
  poster.

  | Context | Target | Area before | Area after | Share before | Share after |
  | --- | --- | --- | --- | --- | --- |
  | Catalogue | ENTER | 0.00 | 1.01 | 0.00 | 0.32 |
  | Catalogue | fullscreen | 0.00 | 2.18 | 0.00 | 0.64 |
  | Catalogue | thumbnail | 0.00 | 2.13 | 0.00 | 1.00 |
  | Gallery | ENTER | 0.19 | 1.65 | 0.32 | 0.52 |
  | Gallery | fullscreen | 0.65 | 1.27 | 1.00 | 0.46 |
  | Gallery | thumbnail | 0.60 | 1.16 | 1.00 | 1.00 |

  - A share under 1 is expected with a mat. The layer that matches the
    poster changes little; the other layer carries the contrast.
  - Every after-area is ≥ 1.0. The closest is catalogue ENTER on the
    mid-grey Modern Kitchen floor, at 1.01.

- **Network, cold cache, resting poster:**

  | Page | `774048d` | PASS 09 |
  | --- | --- | --- |
  | `/worlds/modern-kitchen` 1440×900 | 51 req / 971,911 B | 51 / 972,265 (CSS +354 B) |
  | `?from=gallery` 1440×900 | 40 / 445,509 | 41 / 446,681 (+ the island chunk) |
  | `/worlds/modern-kitchen` 390×844 | 44 / 536,698 | 44 / 537,055 |
  | `?from=gallery` 390×844 | 39 / 406,647 | 40 / 407,823 |
  | Homepage 1440×900 (story scroll) | 48 / 1,603,978 | 48 / 1,604,064 |

  - `/world` now loads 29 requests and `/world/gallery` 34 (PASS 08: 33);
    both include the 833 B island chunk.
  - Neither detail page loads Three.js. The homepage still lazy-loads its
    existing sky bridge after the story scroll, as before.

- **Gallery 1440×900, captured alone:** every settled frame within 5/255
  of `774048d` (no pixel beyond 8/255). A first capture had overlapped
  another browser run, which left a frame mid-reveal.
- **Builds compared.** Resting captures from the batch build and the final
  build (they differ only in focus CSS) agree within 12/255 on at most 19
  pixels per capture.
- **First paint** on the final build (throttled, every frame) at 1440×900,
  390×844 and 844×390: zero ivory pixels at first, +50, +100, +250 ms,
  settled, and over all frames.
- **Lifecycle on the final build:** Gallery 1366×768, catalogue 844×390, and
  Gallery 390×844 with reduced motion. All steps pass.

Screenshots stay local (scratchpad) and are not committed.

## 26. Known issues deferred

1. **Keys inside the Sketchfab iframe stay there** (cross-origin). EXIT 3D
   VIEW stays on screen in the band. No capture hack, no Viewer API.
2. **Arrows with the World map open still switch worlds** on the poster
   (PASS 07's arrow rule, unchanged by request).
3. **Short-landscape live area is 161–225px tall.** It is wholly on screen,
   with fullscreen one 44px tap away. Real phones are untested.
4. **Desktop windows shorter than 566px** (catalogue) hit the 400px floor,
   and ENTER can sit below the fold there.
5. **Carried from PASS 08 and out of scope:**
   - canonical metadata;
   - `:has()` support in legacy browsers;
   - the catalogue's extra stylesheets from the static import graph;
   - iframe `load` ≠ model ready;
   - Sketchfab account UI options;
   - repeat-entry requests.
6. **Measurement scope.** Headless desktop Chrome with emulated phones and
   touch. No Safari, Firefox, real devices or field data.

## 27. PASS 10 boundary

**PASS 09 delivers** one predictable interaction hierarchy and a
discoverable primary action inside the existing World.

**Stable contracts:**

- `WorldMapDisclosure` / `bindWorldMapEscape`.
- `--detail-top`.
- The short-landscape stack.
- The focus ring-on-mat tokens.
- Design-system §9 rules 16–17.
- `yarn check:world-ux`.

**Not started:** Room 02 Objects, Archive, Lab, Studio, a Lobby or Gallery
GLB, a local GLB viewer, the Sketchfab Viewer API, any marketplace.

**PASS 10 is to be chosen after review**, from:

- **A. Room 02 — Objects foundation.**
- **B. Real Lobby / Gallery 3D,** only with an approved GLB environment.
- **C. Final cross-device / performance polish.**
