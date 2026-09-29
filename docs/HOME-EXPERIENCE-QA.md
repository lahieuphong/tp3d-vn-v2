> Historical implementation record. Current transition: [StoryWorldBridge](HOME-STORY-WORLD-BRIDGE.md).

# Home — five architectural chapters

Implemented on 26 September 2026 against the existing scroll-story code. This report supersedes the old Home composition described in earlier opening documents. It does **not** reuse results from the former autoplay version as evidence for this implementation.

## Scope and composition

`app/page.tsx` now renders only:

1. Existing `HomeHero`: Discovery → Story, one shared TP.
2. `WorldsChapter`: dark architectural passage, live title/copy and World selector.
3. `SpacesChapter`: ivory architecture, four arched room links.
4. `MaterialsChapter`: composed material study with six independently positioned depth groups and five live callouts.
5. The existing shared Footer, with scoped Home spacing and background refinement.

The former Introduction, ExploreSpaces, FeaturedProjects, ExperienceBanner, CollectionsPreview, MaterialSelection, ObjectSelection and JournalPreview are removed from the Home import/render tree. Their reusable files and the `/spaces`, `/projects`, `/collections`, `/worlds`, `/products`, `/materials`, `/journal` routes remain available.

## Components and data

New files in `components/home/experience/`:

- `home-chapters.tsx`: owns the three-chapter controller lifecycle.
- `worlds-chapter.tsx`, `world-selector.tsx`: a static architectural scene with real hover/focus-controlled previews. No autoplay. `VIEW WORLD` goes to `/worlds`; individual choices go to available catalogue details.
- `spaces-chapter.tsx`: Living, Bedroom, Workspace and Kitchen portals, with existing local room photography and restrained hover movement.
- `materials-chapter.tsx`, `material-composition.tsx`: real material links around six alpha sprite windows: rear walnut, mid stone slabs, foreground stone, ceramic, textile and metal. Labels use the same coordinate space as the objects so they follow composition scaling.
- `chapter-image.tsx`: lazy, intrinsically sized local WebP plates with responsive sources.
- `breeze-connector.tsx`: one continuous transparent cloth artwork spanning the three chapters; chapter colophons.
- `chapter-motion.ts`: pure scroll geometry plus a scoped native-scroll lifecycle.
- `home-chapters.css`: chapter-specific composition, layering, breakpoints and reduced-motion rules.

`data/home-chapters.ts` derives room names, images and destinations from the existing catalogue. `data/home-chapter-assets.json` describes scene plates; `data/home-material-groups.json` describes the shared sprite and six cells. No new dependencies were added.

World destinations: `/worlds/white-modern-living-room`, `/worlds/minimalistic-modern-bedroom`, `/worlds/modern-bathroom`, `/worlds/modern-kitchen`. An unavailable future record falls back to `/worlds`.

Material destinations: Travertine, Walnut, Linen and Brushed Metal details. Ceramic currently goes to `/products`, because there is no published ceramic detail record. The main CTA goes to `/materials`.

## Scroll and transition strategy

- The original Scene 1→2 `spatialFrame` range, architecture, copy and sticky structure are retained. Desktop remains about 210svh; mobile about 190svh at the specified sizes.
- After the reading range finishes, a separate `--sh-exit` progresses over 40% of the opening stage height. TP moves down 45px, scales to .92 and fades; Story copy moves up 12px; a warm architectural tint and widening cloth lead into Worlds. Scrolling backward restores the same values.
- Worlds, Spaces and Materials are ordinary document-flow sections, not a single giant pin. Desktop heights are 112svh / 112svh / 110svh, with minimum heights for shorter displays. Top overlaps are 12svh / 12svh / 10svh.
- Worlds transitions toward daylight with a separate light architectural layer revealed through a slightly expanding central arch. There is no continuous full-image brightness filter.
- Beyond Story, the breeze is **one** transparent artwork in document coordinates, rather than an identical PNG restarted three times. It passes behind live copy, portals and material objects. It is static relative to the document, follows native scrolling and never loops or receives a giant full-page transform. The opening exit veil blends into its top edge. Exact visual seam matching still requires live browser inspection.
- Materials enter with staggered 40px translation, .98→1 scale and opacity. The six groups retain only bounded ±2–6px scroll depth, reduced to 40% on compact screens. Leader lines and labels settle; nothing moves while idle.
- One shared SiteHeader remains. Cached chapter thresholds switch to warm-white text on Worlds and charcoal on Spaces/Materials, with 350ms color transition. No React state changes on every scroll pixel; theme writes happen only when the value changes. Reduced motion uses the unblended section boundary.

The controller reads layout on mount/resize, caches geometry, then batches writes. Passive scroll input schedules at most one pending frame. IntersectionObserver and cached bounds gate nearby sections. Far-away layers release transforms; hidden pages cancel pending work. Listeners, observers, inline properties and theme attributes are cleaned up on unmount. The controller is independent of the preserved opening controller.

## Responsive and accessibility

- Desktop: editorial left copy / architecture / right World selector; four Space arches on one baseline; material callouts around a composed still-life.
- Tablet: wider World text and selector, two-by-two room portals, larger material composition and shortened leaders.
- Mobile: normal-flow copy, two-column World links and inline preview, two-by-two arches, a large material composition followed by two-column labels. No narrow sidebar, carousel dependency or layered mobile mask transition.
- One Home H1; new chapters use H2 and labelled sections. Navigation uses real links, decorative imagery is hidden, all images have alt attributes and intrinsic dimensions, visible focus outlines are scoped to the chapters, and text CTAs have at least a 44px target.
- Reduced motion: the opening exposes Discovery and Story in normal flow. New chapters stay static and fully readable; parallax, overlap masks, central arch transition and hover movement are removed. The same links and content remain accessible.

## Asset audit

Architecture plates are 1586×992 WebP, with 1280px and 720px sources. The six-group alpha sprite is 1536×1024 (342,022 bytes), with 1280px and 720px sources; all six windows use the same URL/source selection. The continuous alpha ribbon is 724×2172 (227,242 bytes). All are lazy-loaded below the opening. No new asset reaches 4096px in either dimension.

The original one-image material tableau and near-identical 720px ribbon export are retained as unused asset alternatives; neither is rendered by the current Home. Source PNGs remain outside `public`. The three original scene plates plus selected sprite and ribbon total 1,054,898 bytes at their largest selected versions, excluding existing room previews and opening assets; this is a file-size sum, not a browser transfer measurement.

New imagery contains no baked-in UI or headings. Alpha sheets and backgrounds were inspected directly. Generated asset prompts, source/provenance paths, dimensions and inspection notes are in [HOME-CHAPTER-ASSETS.md](HOME-CHAPTER-ASSETS.md), [HOME-CHAPTER-BREEZE-ASSET.md](HOME-CHAPTER-BREEZE-ASSET.md) and [HOME-MATERIAL-GROUPS-ASSET.md](HOME-MATERIAL-GROUPS-ASSET.md).

## Verification

- `yarn tsc --noEmit`: PASS.
- `yarn lint`: PASS.
- `yarn check:hero`: PASS, including the new 40vh departure/reverse and cleanup assertions. The original reading interval remains unchanged.
- `yarn check:home`: PASS. Reversible geometry, early readable reveals, overlap-aware header thresholds, six staggered material groups, bounded depth, cached layout reads, batched writes, far/hidden inactivity, reduced motion, resize and 30 cleanup lifecycles.
- `yarn check:content`, `yarn check:assets`, `yarn check:worlds`: PASS.
- `yarn build`: PASS. Vinext's existing route-classification notice remains informational.
- `yarn build:vercel`: PASS in the 26 September pre-commit verification. This verifies the build output, not a production deployment.
- Production route/image crawl (`http://127.0.0.1:4483`): PASS — 44 pages, 82 local image URLs returning HTTP 200 with image MIME types, and 8 invalid slugs returning expected 404s. Assertions include one H1/header/shared chapter ribbon, three new chapters in order, six material layers, five material callouts, real destinations and absence of all retired Home headings. No server-render error boundary or server-log error was observed during the crawl.
- Initial HTML/static import graph: 15 initial/preloaded modules inspected; no eager Three.js or Sketchfab viewer module, GLB/GLTF preload, canvas/iframe markup or WebGL construction pattern. The app loader retains deferred route-module registrations. This is a build audit, not a browser Network or runtime-context recording.
- Changed-file formatting and `git diff --check`: PASS. Repository-wide formatting still flags 11 unchanged Worlds files outside this change. Evidence copies from implementation: `outputs/home-chapters/production-route-audit.json` and `production-import-audit.json`. The pre-commit crawl was rerun on port 4484 with the same 44-page, 82-image and 8-invalid-route results.
- Source inspection: no Three.js import, WebGL renderer, canvas, Sketchfab embed, GLB preload, autoplay timer, wheel interception or permanent `will-change` was introduced in Home. No runtime WebGL-context count is inferred from this inspection.

## Browser acceptance remains unverified

CUA repeatedly returned `Sky Computer Use native pipe startup failed`. Its inventory contained no apps or browsers; an in-app browser attempt also returned `Browser is not available: iab`. This is a tool availability failure, not an automatic approval rejection. Consequently no actual Chrome/Safari/Edge screenshot, console/hydration trace, viewport screenshot comparison, RAM profile, GPU/VRAM reading or presented-frame FPS has been collected for this implementation.

| Requested viewport                        | Source/breakpoint treatment                 | Live rendering status |
| ----------------------------------------- | ------------------------------------------- | --------------------- |
| 375×812, 390×844, 430×932                 | Mobile flow, 2×2 portals, simplified labels | Not verified          |
| 768×1024, 820×1180                        | Tablet composition and 2×2 portals          | Not verified          |
| 1024×768                                  | Compact laptop spacing/selector             | Not verified          |
| 1280×800, 1366×768                        | Short desktop adjustments                   | Not verified          |
| 1440×900, 1728×1117, 1920×1080, 2560×1440 | Desktop editorial composition               | Not verified          |

The route crawl verifies server HTML and returned image resources; it cannot establish hydration, visual alignment, horizontal overflow, scroll smoothness or reference fidelity. Controller doubles verify owned resources and deterministic behavior, not browser memory stability.

Remaining acceptance when browser tooling is available:

1. Inspect all five scenes and Footer at the twelve viewports; check title wrapping, hit areas, room labels, material leaders, menu, focus, reverse scroll and reduced motion.
2. Capture actual Scenes 3/4/5 at 1440×900 and 1920×1080, compare with references 12/13/14, and tune composition and ribbon boundaries as needed.
3. Chrome: hard reload, ten slow 1→5→1 cycles, ten Home→Worlds→Home navigations, then five minutes idle. Record initial/peak/settled heap and process RAM separately; look for continued growth after warm-up.
4. Inspect runtime WebGL contexts (expected zero by implementation), GPU process and layer/texture trends. Do not represent a raster estimate as exact VRAM.
5. Profile slow/fast trackpad, wheel, PageDown and touch emulation. Observe console/hydration errors and presented frames; repeat functional checks in Safari and Edge.

At implementation handoff, no production deployment or Git commit had been performed, and a local preview was available on port 4483. The separate pre-commit verification server on port 4484 was stopped after the route crawl.
