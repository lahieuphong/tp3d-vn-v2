# Homepage section cleanup

Completed locally on 2026-09-28. Production build validated; no deployment made.

## Result and preserved scope

The Homepage render tree is now:

`HomeIntroLoader → HomeHero (Brand / Discovery → Story / Manifesto) → WorldsChapter → SiteFooter`.

`SpacesChapter` (Rooms as atmospheres) and `MaterialsChapter` (Objects & Materials)
are deleted from the render tree, along with their composition, wrappers and
Home-only data. This is not a visibility override. Worlds is the last child of
the Home owner and the existing footer is its immediate sibling.

The circular atrium, room links, copy, typography and CTA remain. There are no
changes to `components/home/intro/`, `components/home/hero/` or
`components/layout/`. Opening transitions and the loader's readiness gate remain
intact. Only the shared Breeze mapping changes to accommodate the shorter page.

Shared catalogue data, `EditorialImage`, header/footer components and routes
`/spaces`, `/materials`, `/products`, `/projects`, `/worlds` remain. Header links
and the footer Materials link still work. The Scene 1 navigation portals retain
“Sample Spaces” and “Objects & Materials / TOUCH THE DETAILS”, linking to
`/spaces` and `/products`. They are existing Discovery navigation, not the removed
sections or hidden headings; keeping them preserves Scene 1 as requested.

## Deleted files

- `components/home/experience/spaces-chapter.tsx`
- `components/home/experience/materials-chapter.tsx`
- `components/home/experience/material-composition.tsx`
- `components/home/experience/chapter-colophon.tsx`
- `components/home/experience/home-chapters.tsx`
- `components/home/experience/home-chapters.css`
- `data/home-material-groups.json`

Consumers were audited before deletion. No physical image files were deleted.
Original artwork and encoded variants remain archived; catalogue photos remain
available to other routes.

## Integration, styles and runtime cleanup

- `app/page.tsx` directly renders Opening and Worlds inside `HomeExperience`.
- `data/home-chapters.ts` retains only the Worlds room relationships;
  `data/home-chapter-assets.json` retains the atrium and its circular preview.
- Removed the 827-line `home-chapters.css`. The required Worlds typography,
  responsive and focus rules moved into `worlds-chapter.css`; existing Home
  header/footer rules moved into `home-experience.css`. Removed scene selectors,
  material callouts, leader lines, stage depth, portal hover and responsive styles.
- Removed Worlds' outgoing `14svh` margin. No replacement section, pin spacer,
  empty wrapper or fixed five-scene height remains.
- `chapter-motion.ts` now measures and animates only Worlds. Removed the scene
  registry, Materials/Spaces theme targets, depth/parallax updates and callout
  stagger. The controller retains eight Worlds entrance targets and a single
  scroll-scheduled RAF, with no idle loop or pointer tracking.
- Removed its IntersectionObserver and three observed chapter targets. One
  ResizeObserver now observes Home, Worlds and the header (three targets instead
  of five). Scroll, resize, pageshow, media and visibility listeners have explicit
  teardown; lifecycle tests include 30 repeated mounts/unmounts.
- No GSAP/ScrollTrigger integration exists in these sections; there are no
  ScrollTriggers or pin spacers to refresh.
- Removed obsolete buttons from the optional continuity QA harness. Updated
  `check-home-chapters.mjs`, `check-continuous-breeze.mjs` and `check-site.mjs`.

## Breeze and header

`breeze-geometry.ts`, `breeze-renderer.ts` and `continuous-breeze.tsx` use the
measured Opening/Worlds boundary rather than the old five-scene page length.
Opening anchors are tied to the Opening's length. Six control points replace
nine; the last point exits below and to the right of Worlds. The existing single
cloth still uses two depth planes, not two independent animations.

Near the end of Worlds, movement releases gently toward the bottom right and
opacity falls to zero. A final edge mask and the Home owner boundary stop the
cloth painting through the footer. Reverse scrolling restores it. Reduced motion
disables translation and retains the boundary fade.

Opening owns its original header theme, Worlds selects ivory, and Footer selects
dark ink. There are no Spaces/Materials theme observers. At the mobile page end,
the header is over Footer and Breeze opacity is zero. At the desktop page end,
the shorter footer leaves part of Worlds behind the header, so ivory remains
appropriate; the cloth is fading and is clipped at the Worlds/Footer boundary.

## Assets and observed resource changes

Removed runtime references to `spaces-architecture`, `materials-architecture`,
`material-groups` and the removed scene's living/bedroom/workspace/kitchen photos.
There were no dedicated preloads for those scenes in the existing loader gate;
no new preload or model fetch was introduced.

Production SSR comparison, within `main` only:

| Markup measure             | Before | After |
| -------------------------- | -----: | ----: |
| Image elements             |     20 |     8 |
| Unique fallback image URLs |     12 |     5 |
| Chapters after Opening     |      3 |     1 |
| Material callout targets   |      9 |     0 |
| Depth/parallax targets     |     10 |     0 |
| Chapter reveal targets     |     12 |     8 |

Browser reload was checked against the production server. A separate fresh
localhost origin on port 4495 was also used to avoid reusing the previous origin's
cache: its request log showed eight image requests, all HTTP 200, and **zero**
requests for the removed scene images or GLB/GLTF/HDR models. The eight include
loader textures. This is a server-log observation, not a DevTools cache-disabled
HAR or a measured before/after byte saving.

RAM: fewer image elements and animation/observer targets are directly verified.
Browser process memory and image decode memory were not measured; no MB saving is
claimed. GPU: the removed DOM/layer targets no longer exist, and Home contains
zero canvas elements and no viewer integration. Compositor layers/VRAM were not
profiled, so no layer-count or VRAM saving is claimed.

## Verification

- TypeScript (`yarn exec tsc --noEmit`), lint (`yarn lint`) and production
  build (`yarn build`): passed.
- `check:home`, `check:hero`, `check:intro`, `check:content`: passed.
- Production route check: 44 pages, 73 image references passed; eight deliberately
  missing routes returned the expected 404s. The retained catalogue routes are
  included.
- Real browser viewport checks: 375×812, 390×844, 430×932, 768×1024, 1024×768,
  1280×800, 1440×900 and 1920×1080. All had no horizontal overflow, a Worlds/Footer
  boundary gap of exactly 0px, a one-viewport Worlds section, and room/CTA links
  within the viewport with at least 44px height.
- Forward and reverse scroll, Worlds CTA, Home logo return and browser Back were
  exercised. Home logo returned to scroll position 0; Back returned to Worlds
  content with no stale section or blank spacer. One mobile Back sample differed
  by 34.5px from its pre-click reading, so exact pixel restoration is not claimed.
- All remaining Home images loaded. The removed headings, old anchors, callout
  bindings, components and scene asset references are absent from runtime source.
- Console capture showed no hydration/key warning, missing target, null-reference,
  ResizeObserver or unmounted-state warning. The browser also reported
  “Could not establish connection. Receiving end does not exist.” The message
  wasn't found in application source or its built client files; its origin was
  not conclusively identified, so this is not reported as a completely clean
  console. No error was hidden or suppressed.
- `git diff --check`: passed.

Local QA evidence (ignored, not shipped): `work/home-cleanup/viewports.json`,
`markup-comparison.json`, `routes.json`, `navigation.json`,
`cold-origin-network.json`, `console.json`, and desktop/mobile screenshots.

Desktop proof: `work/home-cleanup/worlds-footer-1440.png`.
Mobile proof: `work/home-cleanup/worlds-mobile-final.png`.
