# TP3D PASS 00 — Codebase audit

Audit, documentation and preparation only. No visual design changed. The rules
that came out of this audit are in [TP3D-DESIGN-SYSTEM.md](TP3D-DESIGN-SYSTEM.md).

| Item | Value |
| --- | --- |
| Date | 2026-10-03 |
| Starting HEAD | `a25d1ac` — feat(home): give the atmospheric bridge living, scroll-safe air |
| Working tree at start | clean (`main`) |
| Method | Source reading, file-size inventory, and the existing check suites. **No new browser measurements were taken in this pass.** Measured figures quoted below come from `TANPHONG_HOME_MOTION_CONTEXT.md`: headless Chrome 154 on an RTX 3090, which does not represent laptops, phones or Safari |
| Baseline before changes | `oxlint` exit 0, `tsc --noEmit` exit 0, `check:home`, `check:intro`, `check:hero`, `check:content`, `check:assets`, `check:worlds` all exit 0 |

Labels used below:

- **(code)**: read from source.
- **(disk)**: file sizes from `public/`.
- **(measured)**: quoted from earlier measured runs, with that environment.
- **(inference)**: reasoning that was not verified in a browser.

---

## A. Codebase audit

### A1. Stack

| Layer | Actual (code) |
| --- | --- |
| Framework | **vinext 1.0.0-beta.9**: the Next.js App Router API on **Vite 8.0.16**. There is no `next` package; `next/*` imports come from vinext. `next.config.ts` is empty |
| UI | React 19.2.8 + RSC (`@vitejs/plugin-rsc`), TypeScript 5.9.3 strict |
| Styling | Hand-written CSS: `app/globals.css` (2,458 lines) plus one stylesheet per feature. Tailwind 4.3.3 and `tw-animate-css` are loaded. Authored components use only a few utility classes; the generated shadcn primitives in `components/ui` use Tailwind |
| 3D | `three` 0.186.1, dynamically imported by the homepage sky bridge only. React Three Fiber/Drei are not installed |
| Animation libraries | **None.** No GSAP, ScrollTrigger, Lenis, Framer Motion or Motion. Motion is CSS plus custom vanilla controllers |
| Lint / format | oxlint 1.76 (type-aware), oxfmt 0.61 |
| Package manager / runtime | Yarn 4.18.0, Node ≥ 22.13 |
| Deploy | Vercel: `yarn build:vercel` (Nitro preset). The default `yarn build` targets Cloudflare. Vercel does not auto-deploy from GitHub |

### A2. Routing

App Router under `app/` with these route patterns:

- `/`
- `/spaces` + `[slug]`
- `/projects` + `[slug]`
- `/collections` + `[slug]`
- `/products` + `[slug]`
- `/materials` + `[slug]`
- `/journal` + `[slug]`
- `/worlds` + `[slug]`
- `/experience/[slug]`
- `/about`
- `/contact`

Unknown slugs return 404 (`not-found.tsx`), and `error.tsx` is the error
boundary. All content and relationships live in `data/*.ts`; reverse
relationships are derived in `data/relationships.ts`. Homepage links use
`prefetch={false}`.

### A3. Styling system

- **Tokens:** `:root` in `globals.css`:
  - Color: `--background`, `--foreground`, `--muted-foreground`, `--border`,
    `--paper`, `--walnut`
  - Layout: `--gutter`, `--section`, `--radius: 0`
  - Fonts: `--font-body`, `--font-display`
  - Motion (new in PASS 00): `--motion-*`
- **Feature stylesheets:**

  | Stylesheet | Size |
  | --- | --- |
  | `components/home/hero/spatial-hero.css` | 20.5 KB |
  | `home/intro/home-intro.css` | 14.2 KB |
  | `home/experience/worlds-chapter.css` | 11.1 KB |
  | `home-story.css` | 6.1 KB |
  | `home-experience.css` | 3.0 KB |
  | `shared-tp.css` | 1.4 KB |
  | `components/worlds/worlds.css` | 26.3 KB |
  | `product-assets.css` | 3.9 KB |
  | `layout/navigation.css` | 0.4 KB |

- The homepage stone palette is hard-coded in component CSS, not tokenized.
  See Design System §5.

### A4. Typography implementation

- Cormorant Garamond and Manrope are self-hosted variable WOFF2 (6 files,
  133 KB, disk).
- The global faces are `Cormorant` (normal only) and `Manrope`.
- The homepage-only aliases `'Cormorant Spatial'` (normal + italic, Latin +
  Vietnamese) and `'Manrope Spatial'` are in `spatial-hero.css`.
- The intro loader waits for three specific faces through
  `document.fonts.load`.
- Scales and rules are in Design System §4.

### A5. Image pipeline

- `scripts/optimize-images.mjs` (sharp) converts `assets/reference-images/*.jpg`
  into WebP at 720 and 1280 (q80) plus a full size (q84, max 1600px; 2400px for
  the hero). Dimensions go to `data/image-dimensions.json`.
- Homepage plates have hand-made variant sets: `spatial-*`, `intro-*`,
  `home-chapters/*`, with metadata in `data/home-chapter-assets.json`.
- `<EditorialImage>` reserves the aspect ratio and sets `srcset`/`sizes`. It
  lazy-loads unless `priority`.
- No runtime image optimizer and no video.

### A6. Existing animation implementation

| Type | Where (code) |
| --- | --- |
| Scroll-mapped master timeline | `createHomeStoryTimeline()` in `components/home/experience/home-story-timeline.ts`. This is the only scroll owner of the homepage story: one sticky stage, one event-driven RAF, direct DOM writes with change detection |
| Progress constants and curves | `home-motion.ts` (`MOTION`, `editorial`, `accelerate`, `arrive`, `settleVisual`), `home-story-frame.ts`, `atmospheric-bridge-frame.ts`, `atmospheric-sky-frame.ts`, `home-production.ts` |
| CSS keyframes | Intro loader only (`hi-*` in `home-intro.css`); Worlds detail (`world-detail-in`, `world-rail-in`) |
| CSS transitions | Hover/focus micro-interactions across `globals.css`, `spatial-hero.css`, `worlds-chapter.css`, `worlds.css` |
| Pointer | Intro parallax (`intro-controller.ts`), Worlds card tilt (`use-card-tilt.ts`), Worlds detail stage parallax (`world-detail-stage.tsx`), Atrium room discovery (`room-discovery.ts`, attribute toggles, no RAF) |
| IntersectionObserver | Worlds grid reveal only (`use-world-reveal.ts`) |
| WebGL | Homepage sky bridge (`atmospheric-sky-renderer.ts`), driven by the master timeline. It has no RAF of its own |

### A7. Responsive breakpoints

There are two main systems plus Worlds. See Design System §7.

| System | Breakpoints |
| --- | --- |
| Global | 760/761, 1100, 1700 |
| Homepage + motion | 767/768, 1199/1200, plus portrait/landscape tablet, `min-width:1200 and max-height:820`, 359, and `767 + max-height:740` |
| Worlds | 359, 600, 639/640, 820/821, 960, 1023/1024, 1439/1440, 1908 |
| JS-only | 639 (portal `sizes`), 1024 (intro pointer parallax) |

### A8. Shared layout components

| Component | File | Notes |
| --- | --- | --- |
| `RootLayout` | `app/layout.tsx` | Inline critical intro CSS + bootstrap script; skip link; header; footer |
| `SiteHeader` | `components/layout/site-header.tsx` | Fixed. `spatial-home`/`over-hero`/`solid` classes. Search dialog and mobile sheet (shadcn). Its only React state update on scroll is the `scrollY > 48` flip |
| `SiteFooter` | `components/layout/site-footer.tsx` | Static; normal flow |
| `EditorialImage`, `SectionHeading`, `TextLink`, `PageIntro` | `components/shared/*` | Editorial building blocks used by every non-home route |
| Previews / selections | `components/project/*`, `space/*`, `sections/{material,object}-selection.tsx`, `sections/experience-banner.tsx` | Detail pages |
| `components/sections/home-sections.tsx` | — | **Unused** (dead code). The original homepage sections: Introduction, ExploreSpaces, FeaturedProjects, CollectionsPreview, JournalPreview |

### A9. Asset locations

| Location | Content |
| --- | --- |
| `assets/` | Sources: `reference-images/*.jpg` (Pexels and Sketchfab previews), `spatial-hero/*.png`, `home-chapters/*.png`, `home-intro/intro-breeze.png`, font licenses |
| `public/images/` | 97 optimized WebP files, 13 MB (disk). Homepage files are `spatial-*`, `intro-*`, `stone-720.webp`, `home-chapters/worlds-atrium*` and `home-chapters/room-preview-*` |
| `public/fonts/` | 6 WOFF2 files |
| `work/` (gitignored, local) | Earlier audit evidence and reference frames. Never commit it |

### A10. Three.js / React Three Fiber usage

- **Homepage:** one lazy WebGL atmospheric sky bridge.
  - **Arming.** It dynamically imports 10 named `three` members at story
    progress ≥ 0.12.
  - **Renderer.** One renderer, one context per Home mount, 4 shader planes.
    It is tiered: desktop 3 cloud planes, tablet 2, mobile 1. Reduced motion
    and Save-Data phones fall back to no WebGL.
  - **Lifecycle.** It is hidden but not disposed while Home stays mounted, and
    disposed with `forceContextLoss()` on unmount.
  - **Chunk.** `three.module` is 511 KB raw / 126 KB gzip (measured in the
    earlier PASS 1 build).
  - Details are in `TANPHONG_HOME_MOTION_CONTEXT.md` §13.
- **`/experience/[slug]`:** registry exists, but **no scene is registered**.
  Projects have `threeScene.enabled: false`.
- **`/worlds/[slug]`:** Sketchfab iframe after a click. No Three.js.
- **React Three Fiber:** none.

### A11. Duplicated styles and animation logic (code)

**Styles**

1. **Homepage header styles are declared twice with the same values.**
   `spatial-hero.css` (`.site-header.spatial-home:is(.over-hero,
   [data-opening='active'])`) and `home-experience.css`
   (`.site-header.spatial-home[data-chapter-theme]`) both set height,
   padding, wordmark, nav font, separator and edition.
2. **The header color transition is declared, then disabled.**
   `home-experience.css` sets `transition: color 350ms`, and `home-story.css`
   overrides it with `transition: none` plus a scroll-driven `color-mix`.
3. **Portal hover is declared twice in `spatial-hero.css`.** First as `img`
   `scale` (650ms), then overridden to `scale: 1` and moved to
   `.sh-portal-photo` (`transform`, 650ms). Matching reduced-motion overrides
   exist for both.
4. **Font-size override blocks.** The end of `globals.css` holds blocks that
   restate earlier font sizes ("Editorial metadata stays readable…"), so most
   eyebrow sizes are defined two or three times.
5. **The global reduced-motion kill switch** (`* { transition: none
   !important }`) makes component-level reduced transitions dead. Example:
   `worlds.css` → `.world-card-overlay { transition: opacity 150ms }`.

**Animation logic**

6. **Capability `matchMedia` strings are hand-written in six TS files:**
   `home-story-timeline.ts`, `room-discovery.ts`, `intro-controller.ts`,
   `use-card-tilt.ts`, `use-world-reveal.ts`, `world-detail-stage.tsx`. Two
   pointer variants exist (with and without `min-width: 1024px`).
7. **Pointer normalization to −1…1 is implemented three times:**
   - intro: viewport-relative, smoothed by CSS transitions of 140–180ms
   - card tilt: element-relative, RAF-coalesced
   - detail stage: reads `getBoundingClientRect()` on every `pointermove`, and
     cancels and re-requests the RAF each move
8. **Clamp and span helpers are duplicated:** `unit`/`span` in
   `home-motion.ts`, and `clamp` in `home-story-frame.ts`.
9. **Breakpoint constants are split:** 768/1200 (`MOTION.breakpoints`,
   `hooks/use-mobile.ts` 768) versus 760/1100 (global CSS and
   `EditorialImage` `sizes`).

PASS 00 adds a shared foundation (`lib/motion/*`) but **does not refactor the
existing controllers onto it**. The home modules are loaded by
`scripts/load-story-math.mjs`, which only resolves `./sibling` imports. Moving
them to `@/lib/motion` must happen together with that loader and the
`check:home` assertions, in a pass that also re-verifies visuals.

### A12. Legacy timing literals → token map

Use this table when a pass touches a component. "Exact" means the duration
equals a token. Changing an easing to `--motion-ease-primary` is a visible
(subtle) change, so it belongs in a visual pass.

| File | Literal (code) | Nearest token | Exact? |
| --- | --- | --- | --- |
| `globals.css` `.text-link` arrow, `.caption-arrow` | `transform 0.4s` (ease) | `fast` | duration yes, easing no |
| `globals.css` `.desktop-nav a:after` | `width 0.4s` | `fast` + switch to `scaleX` | duration yes; **layout property** |
| `globals.css` `.editorial-image img` | `transform 0.8s ease` | `normal` / `cinematic` | no |
| `globals.css` `.site-header` | `background, color, height 0.5s` | `fast`/`normal` | no; **height is layout** |
| `spatial-hero.css` portal photo / img | `650ms ease` | `normal` | duration yes |
| `spatial-hero.css` portal h2 / caption arrow | `transform 400ms ease` | `fast` | duration yes |
| `worlds-chapter.css` room labels, underline, preview, room previews | `220ms ease` | `micro` | duration yes |
| `worlds-chapter.css` `.hc-link > span` | `transform 250ms ease` | `micro` | no |
| `worlds-chapter.css` CTA image | `transform 350ms ease` | `fast` | no |
| `home-story.css` `.story-rail` | `color 350ms ease` | `fast` | no |
| `home-intro.css` panels | `var(--hi-duration)` = 1000ms, `cubic-bezier(0.76, 0, 0.24, 1)` | `cinematic` + `EASE.cinematic` | **yes, both** |
| `home-intro.css` TP rise | `800ms cubic-bezier(0.76, 0, 0.24, 1)` | `EASE.cinematic` | easing yes |
| `home-intro.css` TP arrive / slogan / home TP | `600/550/600ms cubic-bezier(0.22, 1, 0.36, 1)` | `normal` + `primary` | no |
| `home-intro.css` fades | `250–650ms ease` | `micro`…`normal` | partly (650) |
| `home-intro.css` pointer smoothing | `140–180ms ease-out/linear` transitions | `createPointerFollower` `tau` | n/a |
| `home-intro.css` breeze drift | `7s ease-in-out` | BREEZE (bounded ambient) | n/a |
| `worlds.css` cards | `--world-ease: cubic-bezier(0.22, 1, 0.36, 1)`, 400–500ms (+35/55ms delays) | `fast`/`normal` + `primary` | no |
| `worlds.css` detail | `700ms` / `650ms cubic-bezier(0.2, 0.7, 0.18, 1)` | `normal` + `primary` | partly (650) |
| `worlds.css` `.world-detail-cta` | `padding 250ms ease` | `micro` + transform | no; **layout property** |
| `use-world-reveal.ts` | 70ms column stagger | `STAGGER` | **yes** |
| `intro-controller.ts` | min 1800 / max 4000 / ready 150 / reveal 1000 (900 mobile, 300 reduced) ms | `cinematic` (reveal) | reveal yes |

Easing families in use today:

- `ease` (default and explicit), `ease-out`, `ease-in-out`, `linear`
- `cubic-bezier(0.22, 1, 0.36, 1)`
- `cubic-bezier(0.2, 0.7, 0.18, 1)`
- `cubic-bezier(0.76, 0, 0.24, 1)`, which equals `EASE.cinematic`

`EASE.primary` (`0.16, 1, 0.3, 1`) is not used anywhere yet.

---

## B. Homepage map (current order)

Composition: `app/page.tsx` → `HomeIntroLoader` + `HomeExperience` →
`HomeStory` (one sticky 100svh stage) → `HomeHero` + `WorldsChapter`. Then
`SiteFooter` follows in normal flow.

Ranges are master story progress `p`. The pixel span at 1440×900 is 2,340px.

| # | Section | Component / file | Visual purpose | Current motion | Target intensity | Proposed pass |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | Intro loader (fresh load / reload only) | `components/home/intro/*` (`home-intro-loader.tsx`, `intro-controller.ts`, `home-intro.css`, inline `intro-runtime.ts`) | Brand threshold: walnut TP, silk ribbon, slogan, progress, curtains opening onto Scene 1 | Time-driven CSS keyframes (≈3.1s measured): TP arrive/rise, slogan, 7s breeze drift, panels open (1000ms cinematic). Desktop pointer parallax. 300ms reduced exit | HIGH (part of Arrival) | TP3D PASS 01 |
| — | Site header (persistent) | `components/layout/site-header.tsx`, `home-experience.css`, `home-story.css` | Navigation, wordmark | Ink → ivory `color-mix` sampled from scroll (p 0.72–0.78). Nav underline hover | LOW | TP3D PASS 06 (global micro) |
| 1 | **Scene 1 — Arrival** "A new breeze for living." | `components/sections/home-hero.tsx` → `home/hero/*` (`HeroSceneA`, `HeroPortals`, `HeroArchitecture` A, `HeroLeaves`), `SharedTP`, `ContinuousBreeze` (reading pose), colophon | Editorial bilingual composition over the terrace plate. Four arched portals to Worlds, Spaces, Objects and Projects | Static at rest (0–0.12). Scroll-mapped departure 0.14–0.305 (copy lift and fade, portals). TP travel 0.12–0.42. Portal hover: photo scale 1.02 (650ms) + caption nudge (400ms) | **HIGH** | TP3D PASS 01 |
| 2 | **Scene 2 — Story / Perspective** "A new breeze becomes a way of seeing." | `HeroSceneB` (`hero-scenes.tsx`), `HeroArchitecture` B, `SharedTP` story pose | Bilingual manifesto columns over the arched gallery plate | Layered crossfade from Scene 1 (0.22–0.42) with 8px rises; hold 0.42–0.48; exit by role 0.484–0.631. **Double exposure** at p ≈ 0.27 (known) | **LOW** (today it inherits motion from both neighbours) | TP3D PASS 02 |
| 3–7 | Spaces · Philosophy · Projects · Materials · Objects | **Not on the homepage.** Spaces and Materials chapters were removed in `d9b265c` (2026-09-28). The legacy editorial sections exist unused in `components/sections/home-sections.tsx`; their CSS is still in `globals.css` | — | — | MEDIUM/HIGH · LOW · MEDIUM · MEDIUM · MEDIUM | TP3D PASS 03–04, **blocked on a structural decision** (see Blockers) |
| 8a | **World Approach — atmospheric bridge** (portal) | `continuous-breeze.tsx`, `breeze-*.ts`, `atmospheric-sky-*.ts`, `atmospheric-bridge-frame.ts`, master timeline | Scene 2 dissolves into atmosphere; hidden world swap at p 0.64 | TP departure 0.494–0.64. Cloth 0.52–0.84. WebGL clouds 0.5135–0.723, with ambient micro-motion while resting. Sky hold 0.64–0.705 | **HIGH** (PORTAL) | TP3D PASS 05 |
| 8b | **World Approach — Atrium** "Enter the worlds." | `components/home/experience/worlds-chapter.tsx/.css`, `chapter-image.tsx`, `room-discovery.ts` | Threshold of the world: oculus, tree, pool, four room openings, CTA to `/worlds` | Camera pull-back 5.88× → 1× (0.705–0.91). UI reveal 0.82–0.92. Room discovery micro-motion (220ms). Stillness 0.92–1.0 (only 187px) | **HIGH**, ending in stillness | TP3D PASS 05 |
| — | Story rail (≥1200 only) | `home-story.tsx` / `home-story.css` | Chapter indicator 01/02/03 | Progress `scaleY`; hidden during the bridge | LOW | TP3D PASS 05 (overlaps Kitchen in Scene 3) |
| 9 | **Footer** | `components/layout/site-footer.tsx` | Brand, links, contact | None (link underline on hover) | **LOW** | TP3D PASS 06 |

**Proposed pass plan.** This is a proposal only. Confirm or renumber when each
brief arrives.

| Pass | Scope |
| --- | --- |
| 01 | Arrival: intro → Scene 1. REVEAL, DEPTH, MICRO; tokens in touched CSS |
| 02 | Story: calm Scene 2 down; fix the p ≈ 0.27 double exposure |
| 03 | Homepage structure + Spaces/Philosophy |
| 04 | Projects/Materials/Objects |
| 05 | World Approach: bridge, Atrium, stillness, rail |
| 06 | Footer, global micro-motion and token migration, cross-device QA |

---

## F. Performance safety review

### F1. Image weight (disk)

**Requested at homepage first paint**

| Asset | Sizes |
| --- | --- |
| `spatial-architecture-a` | 143.6 KB full / 99.7 KB 1280 / 33.0 KB 720 |
| `spatial-portals` | 305.6 KB full / 120.5 KB 720 |
| `stone-720` | 160.1 KB |
| `intro-walnut-360` | 40.7 KB |
| `intro-breeze` | 115.6 KB 1280 / 39.3 KB 720 |
| Fonts | 133 KB |

- `stone-720.webp` (160 KB) is only a texture. It is shown at 40% inside the
  TP pattern and at 2.7% opacity in the loader panels. **(inference)** A
  lighter variant would likely look the same. Needs a visual check.
- `spatial-portals.webp` (1254², 306 KB) is selected whenever `48vw × DPR` >
  720px, which covers most desktop and Retina screens. Each arch shows one
  quarter of it.

**Gated by story progress**

| Asset | Sizes |
| --- | --- |
| `spatial-architecture-b` | 186.9 / 129.9 / 44.8 KB |
| `worlds-atrium` | 252.5 / 168.9 KB. Mobile deliberately uses the 1280 variant for the 5.35× sky crop |
| CTA preview | 26 / 8 KB |
| Room previews | 2–6 KB each |
| `three.module` | 126 KB gzip (measured) |

**Other routes**

| Asset | Size |
| --- | --- |
| `textile.webp` | 851 KB |
| `textile-1280.webp` | 664 KB (heavier than most full-size files; a noise texture at q80) |
| `wood.webp` | 515 KB |
| `stone.webp` | 445 KB |
| `living.webp` | 375 KB |
| `table.webp` | 311 KB |

**Unreferenced**

- 23 files, **2.84 MB**: `home-chapters/{journey-ribbon,material-groups,
  material-tableau,materials-architecture,spaces-architecture,
  worlds-architecture}*` and `spatial-breeze-ribbon*`. They are never
  requested and add only deploy weight.
- `d9b265c` kept them on purpose as "archived image assets". Deleting them is
  the user's decision. They may serve re-introduced sections.

### F2. Unoptimized media / eager loading

- All images are WebP with variants. There is no video.
- **(code + inference)** `EditorialImage`'s default `sizes` is `(max-width:
  760px) 100vw, 66vw`. Narrow grid tiles that don't override it are
  over-fetched on desktop:
  - `object-selection.tsx` (4 columns)
  - `material-selection.tsx` (3-column strip)
  - listing grids

  At 1440px and DPR 1, a ~300px tile resolves to the 1280w variant (664 KB for
  textile). This is not measured; verify in DevTools.
- **(measured, earlier run)** The Scene 2 plate is requested about 1.0s after
  navigation, during the loader, because the story mounts underneath it. This
  is deliberate for the 0.22 crossfade. **(inference)** It competes with
  loader-critical requests on slow connections.
- The four portal `<img>` elements share one URL, so it is a single request.

### F3. Layout shifts

- **(measured, earlier run)** Live homepage load: 4 layout shifts, CLS ≈
  0.0046. Zero shifts during the scroll runs.
- **(code)** All homepage images carry dimensions.
- **(code)** `font-display: swap` can reflow text on non-home routes. The
  homepage hides behind the loader until its fonts are ready.

### F4. Animations on layout properties (code)

- `globals.css` `.site-header`: `height 0.5s` (102 → 86px when scrolling past
  48px, on non-home routes).
- `globals.css` `.desktop-nav a:after`: `width 0.4s` underline. Replace with
  `transform: scaleX()`.
- `worlds.css` `.world-detail-cta`: `padding 250ms`.
- Homepage header ink is a per-frame `color-mix`. That is paint only, text
  only, and acceptable.
- Not found anywhere: animated `top`, `left` or `margin`; animated `filter` or
  `backdrop-filter`; blanket `will-change`.

### F5. Likely future bottlenecks (inference unless noted)

1. **Master timeline frame cost.** Every new layer inside the sticky story adds
   DOM writes to the same frame. About 20 opening-layer nodes plus the Atrium
   today (code). Prefer new sections in normal flow.
2. **Atrium plate under CSS scale 5.88 → 1.** It is linked to the unresolved
   **Mac-only blank or half-painted brown frames** seen in the user's
   recording. Not reproduced headless.
3. **Near-camera SVG cloth.** About 10× scale, ~50 paths, three `<use>`
   projections with gradient masks.
4. **WebGL ambient frames on phones.** Battery cost has not been measured on
   real hardware.
5. **`world-detail-stage.tsx`.** It reads layout on every `pointermove` (code).
   `createPointerFollower` reads layout once per hover.
6. **Re-introducing sections.** Story scroll lengths (360/320/280svh) and many
   `check:home` assertions would need re-tuning (code).

---

## Design elements to preserve

- **Typography**
  - Cormorant display at weight 400 with italic second lines.
  - Tight negative tracking.
  - Manrope tracked micro-caps.
  - Bilingual EN/VI pairing with real Vietnamese subsets.
- **Logo usage**
  - Lowercase "tân phong" wordmark with the tracked "INTERIORS & OBJECTS" line.
  - The stone-textured TP monogram as the persistent narrative object.
  - The walnut TP in the loader.
  - "EST. 2026" edition marks.
- **Palette**
  - Ivory/ink/walnut on editorial routes.
  - Warm stone on the homepage.
  - Ink → ivory header shift in the Atrium.
  - Blue only as sky.
- **Editorial spacing**
  - Generous `--section` rhythm (120/96/76).
  - Asymmetric two-column grids with staggered hanging.
  - 1px rules and square corners.
- **Image proportions**
  - Wide architectural plates (1.6, 1.78).
  - Tall material strips (0.6).
  - Arched portal crops.
  - Circular previews.
- **Navigation**
  - Persistent fixed header that never hides.
  - Restrained nav in the serif on the homepage.
  - Search dialog and mobile sheet.
  - Footer link columns.
- **Content hierarchy**
  - One idea per scene: welcome → story → enter the worlds.
  - Room openings as real links.
  - No carousels.
- **Gallery feeling**
  - One persistent stage.
  - Hand-placed compositions against photographs.
  - Stillness at rest.
- **Engineering qualities worth keeping**
  - Native scroll with a single scroll owner.
  - Deterministic, reversible scroll mapping.
  - A complete reduced-motion path.
  - Progress-gated loading.
  - Tiered WebGL with DOM fallback and disposal.
  - `inert` hidden scenes.

---

## Technical issues discovered

| # | Issue | Evidence | Severity |
| --- | --- | --- | --- |
| 1 | **The brief's homepage structure doesn't match the code.** Spaces, Philosophy, Projects, Materials and Objects are not on the homepage; Spaces and Materials were deliberately removed in `d9b265c` | code, git | Blocks PASS 03–04 |
| 2 | **Three.js is already on the homepage** (lazy sky bridge; the context persists while Home is mounted). The PASS 00 brief says "no Three.js / no persistent canvas on the homepage" | code | Decision needed (see Blockers) |
| 3 | **GSAP is assumed by the brief but not installed.** The homepage uses a custom native-scroll master; a ScrollTrigger inside the story would be a competing scroll owner | code | Policy in Design System §12 |
| 4 | **Pass-number collision** with earlier "PASS 0/1/4/5" labels in docs and comments | code, docs | Use the "TP3D PASS nn" prefix |
| 5 | Mac-only blank or half-painted Atrium frames during the pull-back. Root cause unverified | user recording (earlier) | Risk for PASS 05 |
| 6 | Scene 1→2 double exposure at p ≈ 0.27 | earlier screenshots | PASS 02 |
| 7 | Short Atrium stillness (187px desktop) before the Footer moves | measured geometry | PASS 05 |
| 8 | Desktop rail "03 WORLDS" overlaps the Kitchen opening | earlier screenshots | PASS 05 |
| 9 | Layout-property transitions: header height, nav underline width, Worlds CTA padding | code | PASS 06 |
| 10 | Probable desktop image over-fetch from the default `EditorialImage` `sizes` | code (inference) | Later perf pass |
| 11 | Global `<em>` uses synthesized italic outside the homepage (no italic `Cormorant` face) | code (not visually verified) | Typography decision |
| 12 | Duplicated header/portal CSS, matchMedia strings, pointer and clamp helpers; two breakpoint systems | code | Migrate when touched |
| 13 | 2.84 MB of unreferenced images; unused `home-sections.tsx` | disk, code | User decision |
| 14 | `README.md` described Three.js as "intentionally not installed" and Worlds as having no detail route | docs | **Corrected in PASS 00** |
| 15 | The CSS reduced-motion kill switch makes component-level reduced transitions dead (Worlds 150ms opacity) | code | Note only |

---

## Blockers and decisions before the next passes

**PASS 01 (Arrival) can start.** Scene 1 and the intro do not depend on the
open structural questions. Two caveats:

- **`check:home` / `check:intro` / `check:hero` assert current timing
  constants and source patterns.** Any retiming must update those assertions
  in the same pass.
- **Confirm PASS 01's exact scope.** The plan in §B is a proposal.

Decisions needed from the user:

1. **Homepage structure.** Where do Spaces, Philosophy, Projects, Materials and
   Objects go?
   - **Option (a):** split the sticky story after Scene 2. Arrival + Story stay
     in the sticky stage, the editorial sections follow in normal flow, then a
     new World Approach stage holds the bridge + Atrium. This requires
     re-anchoring the bridge, which today starts from Scene 2.
   - **Option (b):** keep the current short homepage.

   This reverses the 2026-09-28 removal, so it needs explicit confirmation.
2. **Sky bridge policy.** Keep the existing lazy Three.js atmosphere
   (grandfathered, no growth), or replace it with a DOM/CSS atmosphere in
   PASS 05?
3. **GSAP.** Adopt it for in-flow sections, under the Design System §12
   policy, or stay library-free.
4. **Archived assets.** Delete or keep the 2.84 MB of unreferenced images and
   `home-sections.tsx`.

---

## Changes made in PASS 00

**Created**

| File | Purpose |
| --- | --- |
| `docs/TP3D-DESIGN-SYSTEM.md` | Source of truth |
| `docs/TP3D-PASS-00-AUDIT.md` | This audit |
| `lib/motion/tokens.ts` | Durations, easings, stagger, amplitude, limits, CSS helpers, cubic-bezier solver |
| `lib/motion/capability.ts` | Queries, breakpoints, tiers, cached snapshot + subscription |
| `lib/motion/progress.ts` | Normalized scroll progress + in-flow controller |
| `lib/motion/disposables.ts` | Cleanup owner (GSAP-compatible by method shape) |
| `lib/motion/pointer.ts` | Settling RAF pointer interpolation |
| `hooks/use-motion-capability.ts` | React hooks |
| `scripts/check-motion-foundation.mjs` | Token sync, curves, tiers, cleanup, RAF settling |

**Modified**

| File | Change |
| --- | --- |
| `app/globals.css` | 7 `--motion-*` custom properties added to `:root`. Nothing references them yet, so rendering is unchanged |
| `package.json` | `check:motion` script |
| `README.md` | Corrected stale Three.js/Worlds statements; links to the design system |
| `docs/TANPHONG_HOME_MOTION_CONTEXT.md` | One header row pointing to this pass |

**Not changed:** no component, layout, timeline, asset, dependency or
lockfile. No Three.js canvas was added. No existing controller was refactored.

**Verification:** see the final report of this pass, also summarised in the
commit message.
