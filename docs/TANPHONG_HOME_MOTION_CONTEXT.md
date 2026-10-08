# Tân Phong Homepage — Motion Context (PASS 0 audit + PASS 1)

Technical project memory for future Homepage motion passes. **Factual only**:
every statement below was read from the repository at the commit named here,
measured in a browser, or observed in a supplied recording. Where something is
an inference, it is labelled as such.

| Item | Value |
| --- | --- |
| Audit date | 2026-10-03 |
| Repository HEAD | `2b3232b` — feat(home): add a lazy-loaded Three.js atmospheric sky bridge |
| Working tree at audit start | clean (`main`) |
| Production URL | https://tp3d-vn-v2.vercel.app/ |
| Audit browser | Chrome 154.0.8037.59, headless, Windows 11, ANGLE/D3D11 on **NVIDIA RTX 3090** |
| Supplied recordings | `Ghi Màn hình 2026-10-02 lúc 23.45.05.mov` (UNESCO reference) and `Tân Phong.mov` (current site), analysed in PASS 0/1 and **deleted from the repo root on 2026-10-03** (never committed); extracted frames remain in `work/pass0/reference/` (local, gitignored) |
| Evidence folder | `work/pass0/` (gitignored, local only — see §29) |
| TP3D PASS 06 (2026-10-04) | Room 01 / Gallery at `/world/gallery` (see `docs/TP3D-PASS-06-GALLERY.md`). No homepage source changed. Measured side effect: `lib/motion/capability` and `lib/motion/pointer`, previously inlined into the homepage bundle through `hero-depth`, are now shared with the Gallery, so they load as two small chunks (homepage 46 → 48 requests, +1,567 B cold). |
| TP3D PASS 05 (2026-10-04) | Enter the World gateway: the Atrium CTA reads "ENTER THE WORLD ⟶" and links to the new `/world` Lobby (was "EXPLORE 3D WORLDS" → `/worlds`). A plain primary activation crosses through one fixed `--world-ground` cover (`components/world/world-portal.ts`, z 150, 1000 ms circle from the CTA preview; 220 ms flat fade reduced); modifier/middle clicks and no-JS keep the real link. The homepage timeline, frame functions, Atrium image, room shortcuts and every value in §34 are unchanged; the final Atrium differs from PASS 04 only inside the CTA. The editorial header and footer step aside on `/world`. See §35 and `docs/TP3D-PASS-05-WORLD-GATEWAY.md`. |
| TP3D PASS 04 (2026-10-04) | Atrium reveal retimed so architecture comes before interface: camera 0.72–0.88 desktop / 0.715–0.875 tablet / 0.715–0.87 phone (was 0.705–0.91 / 0.701–0.907 / 0.686–0.895), measured recognition 0.81 and settle 0.85, rooms from 0.845, title from 0.872, all revealed and settled at 0.915 (hold 0.085), header ink 0.82–0.855 and exposure 0.785–0.865 from measured band luminance, ordered reduced reveals, zenith shade on tablet/phone plates, a short-landscape Atrium layout. The §5 rows from 0.64 on, §15's Scene 3 camera row, §16's Scene 3 line and §23's header range are superseded; see §34 and `docs/TP3D-PASS-04-ATMOSPHERE-WORLDS.md`. Everything through the 0.64 swap is unchanged. |
| TP3D PASS 03 (2026-10-03) | Perspective → Atmosphere refined: Scene 2 copy now leaves by 0.60 (labels 0.484–0.556, body 0.506–0.58, heading 0.526–0.60), the cloth first stirs from 0.48 (`MOTION.breeze.stir` 0.03), its threads resolve over 0.525–0.595 (`pose.weave`), and reduced motion cuts at the 0.64 swap inside a 0.015 exposure dip instead of cross-dissolving 0.605–0.64. The §5 Scene 2 exit-text row, the §11 approach start, §12 step 1 and the §16 bridge line are superseded; see §33 and `docs/TP3D-PASS-03-PERSPECTIVE-ATMOSPHERE.md`. Atmosphere engine, takeover, TP, swap, sky hold and everything from camera start unchanged. |
| TP3D PASS 02 (2026-10-03) | Arrival → Perspective handoff retimed with no copy overlap: Scene 1 out by 0.26, copy-free breath to 0.31, plate B opened by a centred aperture (desktop/tablet) or dissolved inside the breath (mobile/reduced), Scene 2 by group to 0.42. The §5 rows for 0.14–0.42 and the §16 Scene 1 → 2 line are superseded; see §32 and `docs/TP3D-PASS-02-SPATIAL-HANDOFF.md`. TP travel, Scene 2 from 0.42, bridge and Atrium unchanged. |
| TP3D PASS 01 (2026-10-03) | Arrival refined: intro opening 1500 ms desktop / 1000 ms mobile (was 1000 / 900), first-scroll approach p 0–0.14, desktop Scene 1 pointer depth on the master RAF. §23 loader timings are superseded; see §31 and `docs/TP3D-PASS-01-ARRIVAL.md`. Scene 2, bridge and Atrium unchanged. |
| TP3D PASS 00 (2026-10-03) | New pass series: design-system source of truth `docs/TP3D-DESIGN-SYSTEM.md`, audit `docs/TP3D-PASS-00-AUDIT.md`, motion tokens/utilities in `lib/motion/` (`yarn check:motion`). No homepage code or timing changed; this document remains the timeline reference. |
| PASS 1 (2026-10-03) | Atmospheric auto-motion bridge — commit `a25d1ac` on `main`, **deployed to production on 2026-10-03** (Vercel deployment `dpl_AwoGMD2xWPoBP3U13nqD7Ey3fBf3`). Sections 4–6, 11–13, 15–18 and 28 describe the repository after PASS 1; §25 stays the PASS 0 live baseline. Details: §30 and `docs/HOME-ATMOSPHERIC-AUTO-MOTION.md`. |

> Measurement caveat: performance figures come from one high-end desktop GPU in
> automated headless Chrome. They are not representative of laptops, phones or
> Safari, and are not field data.

---

## 1. Project stack

| Layer | Actual |
| --- | --- |
| Framework | **vinext 1.0.0-beta.9** — Next.js App Router API on **Vite 8.0.16** (rolldown). There is **no `next` package**; `next/*` imports are provided by vinext. `next.config.ts` is empty. |
| UI | React 19.2.8, React DOM 19.2.8, RSC (`@vitejs/plugin-rsc`) |
| Language | TypeScript 5.9.3 (`strict`) |
| Styling | Hand-written CSS per component + `app/globals.css`; Tailwind 4.3.3 plugin present; shadcn / base-ui primitives in `components/ui` |
| 3D | **three 0.186.1** (+ `@types/three` 0.186.0), lazy-imported by the homepage sky bridge only |
| Lint / format | oxlint 1.76.0 (type-aware via oxlint-tsgolint), oxfmt 0.61.0 |
| Package manager | Yarn 4.18.0, `nodeLinker: node-modules`; Node ≥ 22.13 (audit ran Node 24.19.0) |
| Production deploy | Vercel, `yarn build:vercel` → `NITRO_PRESET=vercel vite build` → `.vercel/output` (Nitro 3 beta). Vercel does **not** auto-deploy from GitHub: deploy with the Vercel CLI (`vercel deploy --prod --project tp3d-vn-v2 --scope la-hieu-phongs-projects`) from a clean `git archive` export, so the local `work/` evidence (~700 MB) and build outputs are not uploaded. |
| Default build | `yarn build` → `vinext build` targeting Cloudflare (`@cloudflare/vite-plugin`, `@openai/sites-vite-plugin`); `yarn start` = `wrangler dev` |
| Image pipeline | Pre-generated local WebP (`scripts/optimize-images.mjs`, sharp); no runtime image service |

## 2. Live production URL

https://tp3d-vn-v2.vercel.app/ — served by Vercel (`Server: Vercel`). The
deployed homepage corresponded to `2b3232b` at the PASS 0 audit (see §19); since
2026-10-03 production runs PASS 1 (`a25d1ac`).

---

## 3. Homepage component tree

```
app/layout.tsx  RootLayout
├─ <head>: inline <style data-home-intro-critical> (HOME_INTRO_CRITICAL_CSS)
│          inline <script> (HOME_INTRO_BOOTSTRAP)          ← intro-runtime.ts
└─ <body id="top">
   ├─ a.skip-link
   ├─ SiteHeader            components/layout/site-header.tsx   (client; position: fixed; z-index 40)
   ├─ {page}
   └─ SiteFooter            components/layout/site-footer.tsx   (normal document flow)

app/page.tsx  Home
├─ HomeIntroLoader          components/home/intro/home-intro-loader.tsx (client)
│  └─ IntroPresentation: hi-panel top/bottom, IntroBreeze (back), IntroMonogram,
│     IntroBreeze (front), slogan, IntroProgress, bottom brand, IntroHeader
└─ HomeExperience  <main#main.home-experience>   components/home/experience/home-experience.tsx (client)
   │  useLayoutEffect → createHomeStoryTimeline(root, createBreezeRenderer(root))
   └─ HomeStory  <section.home-story[data-home-story]>        home-story.tsx (height 640/560/480svh; 360/320/280svh reduced)
      └─ div.home-story-stage[data-home-story-stage]          position: sticky; top 0; 100svh; overflow: clip
         ├─ SharedTP  .sh-monogram[data-shared-tp]            shared-tp.tsx            z 3
         ├─ HomeHero → SpatialHero  section.spatial-hero      components/sections/home-hero.tsx, home/hero/*
         │  ├─ .sh-plane-background  HeroArchitecture (architecture-a, architecture-b)   z 0
         │  ├─ .sh-plane-objects     HeroLeaves (SVG)                                     z 3
         │  └─ .sh-plane-content                                                          z 5
         │     ├─ HeroPortals  nav.sh-portals (4 links)
         │     ├─ HeroSceneA   .sh-discovery  (Scene 1 copy)
         │     ├─ HeroSceneB   .sh-story [inert] (Scene 2 copy) + .sh-center-copy
         │     └─ footer.sh-colophon
         ├─ WorldsChapter  section.hc-worlds#home-worlds      worlds-chapter.tsx       z 6 (starts inert, opacity 0, hidden)
         │  ├─ .hc-atrium-camera[data-scene3-camera] > .hc-atrium-backdrop > ChapterImage (single plate)
         │  ├─ .hc-atrium-copy  (reveal 4–8)   ├─ nav.hc-atrium-rooms (reveal 0–3)
         │  ├─ a.hc-atrium-cta  (reveal 9)     └─ .hc-atrium-baseline (reveal 9)
         ├─ AtmosphericSkyBridge  div.atmospheric-sky-bridge  atmospheric-sky-bridge.tsx  z 7 (canvas appended lazily)
         ├─ ContinuousBreeze  div.continuous-breeze           continuous-breeze.tsx    svg.cb-back z 2, svg.cb-front z 4 (→ 8)
         └─ aside.story-rail                                   z 12, ≥1200px only
```

`.spatial-hero` and `.continuous-breeze` deliberately create **no stacking
context**, so hero planes (0/3/5), TP (3), cloth (2/4/8), Worlds (6), sky (7)
and rail (12) interleave inside the one stage (comment in
`home-experience.css`).

## 4. Current scroll architecture

| Question | Answer (from code) |
| --- | --- |
| Native browser scroll? | **Yes.** No smoothing library, no wheel/touch interception, no `preventDefault`. |
| Lenis? | **No** (not installed, not imported). |
| Smooth scroll CSS? | `globals.css:47` sets `scroll-behavior: smooth`; `home-story.css` overrides it with `html:has([data-home-story]) { scroll-behavior: auto }`. |
| One master timeline? | **Yes** — `createHomeStoryTimeline()` in `home-story-timeline.ts` ("The only scroll owner"). It is a hand-written function, not a GSAP timeline. |
| Sticky / pinned? | **One CSS sticky stage** (`.home-story-stage`, 100svh) inside a tall section (`--story-base-height` 640svh ≥1200 / 560svh 768–1199 / 480svh <768 with motion, 360/320/280svh under reduced motion, plus the 160svh room orbit). No JS pinning, no pin spacers. Scenes are absolutely positioned layers inside the stage, not separate sections. |
| Competing triggers? | **None.** Zero ScrollTriggers / IntersectionObservers in the story. One ResizeObserver (sequence, stage, header). |
| Scroll state in React? | **No** per-frame React state. All writes are direct DOM style/attribute writes with change detection (`property()`), plus a signature cache. Exceptions: `SiteHeader` `setState` only when `scrollY > 48` flips; the loader's progress state during the intro. |
| Progress formula | `p = clamp((scrollY − storyTop) / (storyHeight − stageHeight))`; forced to 0 while `html[data-home-intro]` exists. |
| Image gate | `bridgeProgress = sceneImage === 'ready' ? p : min(p, 0.48)` — the bridge cannot start before the Atrium plate is decoded; a failed plate keeps Scene 2. |
| Render loop | One RAF owner. `schedule()` requests a **narrative** frame only on events (passive `scroll`, `resize`, ResizeObserver, `pageshow`, `visibilitychange`, media-query changes); it re-schedules itself while `settleVisual` mass is active and for 2 initial paints. Since PASS 1 a frame continues as an **ambient-only** frame (`skyBridge.tick(now)`, no narrative work) only while `skyBridge.wantsTime()` — the WebGL atmosphere is drawn and alive (master ≈0.5135–0.723). Hidden tabs cancel it; outside the bridge nothing is scheduled. |
| History | Fresh/reload documents on `/` play the loader (scroll locked, reset to 0, `scrollRestoration='manual'`). Back/forward skips the loader; `html[data-home-restoring]` hides `<main>` until the restored frame paints (4.5 s watchdog). |

Scroll lengths (span = story height − one viewport):

| Viewport | Story | Span | 1% progress |
| --- | --- | --- | --- |
| 1440×900 desktop | 3240 px (3.6 vh) | 2340 px | 23.4 px |
| 820×1180 tablet portrait | 3776 px (3.2 vh) | 2596 px | 26.0 px |
| 390×844 mobile | 2363 px (2.8 vh) | 1519 px | 15.2 px |

## 5. Master timeline architecture

All constants live in `home-motion.ts` (`MOTION`), `home-story-frame.ts`
(`arrivalTiming`, `tpTiming`, `homeStoryTiming`), `atmospheric-sky-frame.ts`
(`SKY_BRIDGE`) and `home-production.ts`. Values are master progress `p`
(desktop unless noted). Pixel figures are for 1440×900.

| Range (p) | px (desktop) | Beat | Implementation |
| --- | --- | --- | --- |
| 0 – 0.12 | 0 – 281 | **Scene 1 hold** | TP at Scene 1 pose (`tpTiming.hold`) |
| 0.14 – 0.305 | 328 – 714 | **Scene 1 departure** | metadata 0.14–0.23, portals 0.17–0.295, EN headline 0.20–0.30, VI headline 0.205–0.305 (0.14–0.245 below 1200px); `.sh-discovery` opacity snaps to 0 at 0.305 |
| 0.12 – 0.42 | 281 – 983 | **SharedTP travel** | `tpPose`: curve `1−(1−t)³(1+3t)`, scale via inverse interpolation, pivot 52%/46% |
| 0.22 – 0.375 | 515 – 878 | Scene 2 architecture B fade-in | only after `architecture-b` decodes |
| 0.245 – 0.42 | 573 – 983 | **Scene 2 reveal** | eyebrow 0.245–0.305, headings 0.285–0.36, body 0.335–0.41, labels 0.36–0.42 (8 px rise × depth) |
| 0.27 – 0.33 | — | `perspective` crossfade value | used by reduced motion, chapter label (`arrival` → `perspective` at 0.30) |
| 0.42 – 0.48 | 983 – 1123 | **Scene 2 hold** (140 px) | everything static |
| 0.484 – 0.631 | 1133 – 1477 | **Scene 2 exit (text)** | labels 0.484–0.574, body 0.506–0.608, heading 0.526–0.631; y −6/−9/−12 px × depth |
| 0.494 – 0.64 | 1156 – 1498 | **TP departure** | anticipation 0.494–0.556 (smoothstep) + departure 0.534–0.64 (`accelerate`): scale −(0.04a+0.155d), y −(4a+22d) px, opacity ×(1−0.09a)(1−0.42d) |
| 0.55 – 0.64 | 1287 – 1498 | Scene 2 architecture push | +3.5% scale, −8 px, opacity → 0.42 (`accelerate`) |
| 0.52 – 0.84 | 1217 – 1966 | **Breeze approach / crossing / exit** | §11 |
| 0.12 → | 281 → | Three.js preparation | `import('three')` (named members) + `compileAsync` (§13) |
| 0.5135 – 0.723 | 1202 – 1692 | **WebGL atmosphere active** — scroll owns the camera; ambient time animates the air only here | §12–13, §30 |
| 0.556 – 0.606 | 1301 – 1418 | Cloth → cloud handoff (WebGL only) | `MOTION.breeze.takeover` |
| **0.64** | 1498 | **Hidden world swap** | `bridge.swapped`: Scene 2 + TP `visibility:hidden`, Scene 3 visible (opacity 1) — under full cloud/cloth coverage |
| 0.64 – 0.705 | 1498 – 1650 | **Sky hold** | Scene 3 camera parked on the oculus sky crop (scale 5.88 at 1440×900) |
| 0.705 – 0.91 | 1650 – 2129 | **Scene 3 camera pull-back** | `atriumPose` + `arrive` (quartic, zero velocity at both ends); tablet 0.701–0.907, mobile 0.686–0.895 |
| 0.72 – 0.78 | 1685 – 1825 | Header ink → ivory | `--home-header-ivory` colour-mix |
| 0.768 – 0.92 | 1797 – 2153 | Scene 3 exposure overlay | `--world-exposure` on `.hc-atrium-backdrop::after` |
| 0.556 – 0.82 | — | Story rail hidden | `opacity: 0` from the cloth handoff until Scene 3 reveal |
| 0.82 – 0.92 | 1919 – 2153 | **Scene 3 content reveal** | rooms 0.82–0.89 (staggered), eyebrow 0.846–0.88, title 0.854–0.90, body 0.873–0.907, sign-off 0.883–0.915, CTA + baseline 0.892–0.92; 9 px rise |
| ≥ 0.90 / ≥ 0.92 | — | Links interactive / room discovery on | `inert` removed per link when fully revealed |
| **0.92 – 1.0** | 2153 – 2340 | **Scene 3 stillness** (187 px ≈ 0.21 vh) | camera `transform: none` |
| > 1.0 | 2340 – 2873 | **Footer release** | sticky stage scrolls away; Footer (533 px) rises in normal flow |

Phase labels written to `main[data-bridge-phase]`: `SCENE2_HOLD` <0.48,
`TP_DEPART` <0.52, `BREEZE_NEAR_CAMERA` <0.60, `CONTEXT_LOSS` <0.64,
`SKY_VOID` < camera start, `OCULUS` <0.75, `SCENE3_PULLBACK` <0.82,
`SCENE3_REVEAL` <0.92, `SCENE3_HOLD`. A dev-only overlay is available with
`?storyDebug=1` on `yarn dev`.

## 6. Animation libraries

| Library | Status |
| --- | --- |
| GSAP / ScrollTrigger | **Not installed, not used.** |
| Lenis / Locomotive | **Not installed.** |
| Three.js | **Installed (0.186.1), used** — homepage sky bridge only, dynamic import. |
| React Three Fiber / Drei | Not installed. |
| OGL | Not installed. |
| Framer Motion / Motion | Not installed. |
| Others | `tw-animate-css` (shadcn utilities, not used by the story), `embla-carousel-react`, `recharts` (not on homepage). |

### Motion implementation types

| Type | Where |
| --- | --- |
| **Scroll-progress driven (pure functions of p)** | SharedTP pose, Scene 1/2 copy, architecture, leaves, breeze cloth, bridge, WebGL camera/uniforms, Scene 3 camera, Scene 3 UI, header ink, exposure, rail. Identical scroll positions produce identical frames forward and backward. |
| Time driven | Loader (CSS keyframes + `setTimeout`: minimum 1800 ms, maximum 4000 ms, ready 150 ms, reveal 1000 ms desktop / 900 ms mobile / 300 ms reduced). In the story: `settleVisual` (exponential response, τ 44 ms desktop / 36 ms tablet / 0 mobile, capped at 2.4 px / 1.6 px, Scene 3 camera and Scene 2 architecture) and, since PASS 1, **ambient atmospheric micro motion** (integrated cloud advection / morphing / breathing from the master's frame timestamps, only while the WebGL atmosphere is alive; never the camera). |
| CSS animation | Loader `hi-*` keyframes only. |
| CSS transition | Hover/focus micro-interactions (portals 400–650 ms, room labels 220 ms, CTA 250–350 ms). Header colour transition is disabled on home (`transition: none`). |
| GSAP timeline / ScrollTrigger | None. |
| requestAnimationFrame | HomeStory master (event-driven); intro pointer parallax (RAF-coalesced `pointermove`, ≥1024px fine pointer, loader only). |
| Pointer driven | Intro parallax; room discovery (`pointerover`/`focusin` attribute toggles, no RAF). |
| WebGL | Rendered only from the master: `skyBridge.update()` (narrative frames) and `skyBridge.tick(now)` (ambient frames, throttled); **no own RAF, timer, clock or observer**. |

---

## 7. Scene 1 implementation — "A new breeze for living."

- `HeroSceneA` (`.sh-discovery`): EN `h1#spatial-hero-title` "A new breeze / *for living.*" + "SPACES SHAPE PEOPLE"; VI "Một làn gió mới / cho không gian sống." + "NỘI THẤT KIẾN TẠO CUỘC SỐNG"; centre axis "SPACES SHAPED BY A NEW BREEZE".
- `HeroPortals`: 4 arched links (`/worlds`, `/spaces`, `/products`, `/projects`) cropped from one 1254² atlas (`spatial-portals.webp`).
- Background: `architecture-a` plate (1586×992), eager, `fetchpriority=high`.
- `HeroLeaves`: 4 inline SVG leaves (hidden <768).
- Colophon: "tân phong — SCROLL TO DISCOVER ↓ — EST. 2026".
- Typography: "Cormorant Spatial" (serif, incl. real italic + Vietnamese subsets) and "Manrope Spatial" (sans), self-hosted WOFF2, hero-only aliases.

## 8. Scene 2 implementation — "A new breeze becomes a way of seeing."

- `HeroSceneB` (`.sh-story`, `inert` until revealed): two columns (EN left, VI right) with eyebrow, h2, rule, body (full text ≥768 landscape; short text on mobile and tablet portrait), sign-off; `.sh-center-copy` axis lines + side note; "Read our story ↗" (`/about`) shown only on mobile and tablet portrait.
- Background: `architecture-b` plate (1586×992), loaded by the timeline after two initial paints; crossfades over A (0.22–0.375).
- Same viewport, same TP object, same planes — Scene 1 → 2 is a **layered crossfade plus TP travel**, not a camera move.

## 9. Scene 3 implementation — "Enter the worlds." (Atrium)

- **One flat photographic plate**: `worlds-atrium.webp` **1672×941**, opaque. Sky, oculus, tree, planter, pool, floor and the four room openings are all in this single image. **There are no separated depth layers, no alpha cut-outs and no depth map.** No larger master exists (`assets/home-chapters/worlds-atrium.png` is also 1672×941).
- Camera = CSS transform on `.hc-atrium-camera` about the oculus sky centre (source px 836,110). Since PASS 6B.1 the bridge writes it flat (`translate() scale()`, 2D, never promoted), and since STEP 1 the portal orbit's breath is flat too (§18 item 11, §40). `measureAtrium()` derives the sky-crop scale from a 160/168/176 source-px crop height (desktop/tablet/portrait): **5.88× at 1440×900, 5.35× at 820×1180 and 390×844**.
- Desktop (≥1200): room labels are positioned in plate-cover coordinates and receive the same pose transform. <1200: labels become a grouped 2×2 overlay grid (no transform).
- Copy: eyebrow "3D WORLDS", h2 "Enter / *the worlds.*", body, "REAL SPACES. REAL PERSPECTIVE.", CTA "EXPLORE 3D WORLDS ⟶" with circular preview, baseline "SCROLL TO DISCOVER · REAL SPACES, REAL PERSPECTIVE.".
- Room discovery (`room-discovery.ts`): hover/focus sets `data-active-room`; 192 px previews decoded on intent (≥768). No pointer parallax on the photograph.
- Final state verified: no cloud, no cloth, no TP, no portal object in Scene 3 (`breezeActive=false`, sky canvas hidden from p ≥ 0.723).

### Routing from the homepage

| Link | Target (live status) |
| --- | --- |
| Living | `/spaces/living` (200) |
| Bedroom | `/spaces/bedroom` (200) |
| Bathroom | `/worlds/modern-bathroom` (200) — no Bathroom Space exists, so `data/home-chapters.ts` falls back to the available World |
| Kitchen | `/spaces/kitchen` (200) |
| CTA | `/worlds` (200) |
| Scene 1 portals | `/worlds`, `/spaces`, `/products`, `/projects` |
| Read our story | `/about` (200) |

All homepage links use `prefetch={false}`. `/worlds` and `/worlds/[slug]` both exist.

## 10. SharedTP implementation

- `shared-tp.tsx`: one inline SVG (T and P paths), mineral pattern fill using `/images/stone-720.webp` at 40% + gradients and edge strokes; `svg { transform: scaleX(1.16) }`.
- Scene 1 box is responsive CSS (`left/top/width/height` per breakpoint). Scene 2 target comes from CSS custom properties `--sh-monogram-story-x/-y/-scale`, read on measure only.
- One element for Scenes 1–2 (persistent anchor). Departure in the bridge (§5), then `visibility:hidden` at the 0.64 swap. **TP does not continue into Scene 3.**
- The loader TP (`IntroMonogram`, walnut texture `/images/intro-walnut-360.webp`) is a **separate element**; the handoff is a CSS fade (`hi-tp-leave` / `hi-home-tp-in`).
- Mobile base opacity 0.75.

## 11. Breeze implementation

- **Vector, not raster.** `continuous-breeze.tsx`: one cloth `<g id="cb-cloth">` (outline, luminous outline, 12 folds, 37 threads) defined once and drawn through **three `<use>` projections**: back (gradient-masked, `svg.cb-back` z 2), front (gradient-masked, `svg.cb-front` z 4 → z 8 when `data-breeze-foreground`), near (unmasked, opacity = transfer).
- Geometry (`breeze-geometry.ts`) is rebuilt only on resize, from a spine per family (mobile / tablet / desktop). Scroll changes only `transform` / `opacity` attributes (`breeze-renderer.ts`).
- Reading poses (Scenes 1–2): the two poses exchange at the invisible midpoint (cloth opacity `|1−2·perspective|` = 0 at p 0.30).
- Bridge pose (`breeze-bridge-pose.ts`): approach 0.52→0.632 toward the viewport focus, scaling up to `width/breadth × 1.8` coverage (~10× at 1440 px); crossing 0.612–0.672; exit 0.646 → ≈0.805 toward the upper right (`exitX 0.9w`, `exitY −1.65h`), opacity `1 − exit`; density 0.558–0.626; transfer 0.525–0.595; foreground 0.54–0.84.
- When the WebGL sky is actively painting, cloth opacity is multiplied by `1 − smoothstep(0.556 → 0.606)` (`MOTION.breeze.takeover`; was 0.575–0.62 before PASS 1): **WebGL clouds take over from the cloth** after the far (0.517) and mid (0.544) banks have begun. Without WebGL (reduced motion, Save-Data phones, failure, late preparation) the cloth alone performs the occlusion.
- Mobile: single front projection, no mask, no near projection. Reduced motion: hidden.
- `data-breeze-active="false"` sets `display:none` once the cloth has left.
- The loader has its own **raster** ribbon (`intro-breeze-*.webp`, alpha), unrelated to this cloth.

## 12. Current Scene 2 → Scene 3 transition

Actual sequence at 1440×900 (WebGL active):

1. **0.48–0.52** Scene 2 holds; text begins departing by role.
2. **0.494–0.64** TP recedes (scale/Y/opacity); architecture pushes +3.5% and fades to 0.42.
3. **0.52–0.61** Cloth swings in from the right and grows toward the lens; far, mid and near WebGL banks form (formation local 0.10–0.45) and take over from the cloth (0.556–0.606).
4. **0.56–0.6225** WebGL `skyCover` reaches full coverage before the swap. **0.60–0.67** inside the atmosphere: luminous haze, shaded banks and small soft sky windows (`patches`), alive with ambient motion when scroll rests.
5. **0.64** Hidden DOM swap (Scene 2 + TP hidden, Scene 3 visible at the sky crop).
6. **0.62–0.72** WebGL clears through irregular bank-shaped openings onto blue shader sky, then reveals the **photographic** oculus sky underneath (`opening` 0.667–0.72).
7. **0.705–0.91** Scene 3 plate zooms out from 5.88× to 1× (`arrive`), header turns ivory (0.72–0.78), exposure ramps (0.768–0.92).
8. **0.82–0.92** Scene 3 UI reveals; **0.92** stillness.

Three different camera models are stitched together: a small 2D push on
Scene 2 (+3.5%), a WebGL `PerspectiveCamera` moving Z 8 → −2.2 through cloud
planes, and a 2D zoom-out of the Atrium photograph. In screen-scale terms the
motion **reverses direction** at the sky: push in, then pull out. Both
`accelerate` and `arrive` curves start and end at zero velocity.

## 13. WebGL status

**One WebGL context exists**, created only by the homepage sky bridge (one per Home mount, released on unmount).

| Aspect | Implementation (`atmospheric-sky-renderer.ts`, `-frame.ts`, `-shaders.ts`) |
| --- | --- |
| Library use | Plain `three` (no R3F); type-only static import; runtime destructured `await import('three')` of 10 named members |
| Trigger | p ≥ 0.12 (`SKY_BRIDGE.preload`; was 0.30), tier ≠ fallback, story visible |
| Renderer | `WebGLRenderer({ alpha, antialias:false, depth:false, stencil:false, premultipliedAlpha, powerPreference:'low-power', failIfMajorPerformanceCaveat:true })`, sRGB output, no tone mapping |
| Scene | 1 `PerspectiveCamera` (48°, 0.08–80), 1 shared `PlaneGeometry`, 4 `ShaderMaterial`s: sky plane (z −36) + 3 cloud planes (z −1.25 / 1.15 / 3.2, depth velocities 0.12 / 0.2 / 0.3). No textures, no render targets, no models. |
| Shaders | Value-noise FBM (3 octaves desktop / 2 tablet+mobile), Gaussian "bank" masses with bounded time wander, integrated advection (`uFlow`) along the Breeze current, slow domain warp (`uMorph`, desktop/tablet), aperiodic breathing (`uBreath`), shared screen-space sky windows (`uPatches`/`uSkyFlow`), derivative relief, opening thresholds. Palette measured from the Atrium plate's oculus crop: sky `#b0c3e0` → `#c2d3e9`, cloud light `#eef0f3`, shade `#cdd6e4`, early ivory `#eee8dc`. |
| Tiers | `desktop` (≥1200 + fine pointer): 3 clouds, DPR ≤1.5, 2.8 MP, ambient 30 fps. `tablet` (768–1199 or coarse pointer): 2 clouds, DPR ≤1.25, 1.6 MP, 30 fps. `mobile` (<768): 1 cloud (mid), DPR 1, 0.56 MP, no warp, 0.6× life, ~20–24 fps. `fallback` (reduced motion, or a phone with Save-Data): no WebGL; host `display:none` only for reduced motion. |
| Render loop | None of its own. Narrative draws when the master calls `update()` and the scroll/size signature changes; ambient draws from `tick(now)` at the tier's frame interval, only while `wantsTime()` (drawn, armed, visible, active window local 0.055–0.91 → master **0.5135–0.723**, `life > 0`). Time steps are clamped (≤42 ms; gaps >250 ms resume without advancing). |
| Prewarm | `compileAsync` + one draw before visibility. **Arming rule:** WebGL arms outside the active window **or before cloud formation (local < 0.1, master < 0.5245)**, when every plane is still transparent; a later warm-up keeps that crossing on the DOM cloth. |
| Failure | Context loss, shader error or initialisation failure → permanent DOM fallback for that mount; partial resources disposed. |
| Lifecycle | Hidden, not disposed, after the crossing (one context persists while Home is mounted); full dispose + `forceContextLoss()` on unmount. |
| Bundle | `three.module-*.js` **511 KB raw / 126 KB gzip** after PASS 1's named destructuring (was 719 / 180). Still the only >500 kB chunk; lazy. |

**Feasibility of extending Three.js:** no new dependency is needed. The renderer
already lives inside the master's scroll ownership with tiering, fallbacks and
disposal (PASS 1 extended it rather than adding a second system).

## 14. Asset map

| Use | File(s) in `public/images` | Size | Alpha | Variants |
| --- | --- | --- | --- | --- |
| Loader TP texture | `intro-walnut-360.webp` | 360×540 | no | — |
| Loader breeze (raster) | `intro-breeze-1280.webp`, `-720` | 1280×853 | **yes** | 720 / 1280 |
| SharedTP texture (+ loader) | `stone-720.webp` | 720×1080 | no | — |
| Scene 1 plate | `spatial-architecture-a.webp` | 1586×992 | no | 720 / 1280 / 1586 (`<picture>`) |
| Scene 2 plate | `spatial-architecture-b.webp` | 1586×992 | no | 720 / 1280 / 1586 (deferred) |
| Scene 1 portals | `spatial-portals.webp` (2×2 atlas) | 1254×1254 | no | 720 / 1254 |
| Breeze (story) | inline SVG (`continuous-breeze.tsx`) | vector | — | geometry per family |
| **Scene 3 Atrium** (sky, oculus, tree, pool, floor, rooms — all one image) | `home-chapters/worlds-atrium.webp` | **1672×941** (247 KB) | no | 1280 (≤1199 px) / 1672 |
| Scene 3 sky (WebGL) | procedural, no texture | — | — | — |
| CTA preview | `home-chapters/worlds-atrium-preview.webp` | 320×320 | no | 160 / 320 |
| Room previews | `home-chapters/room-preview-{living,bedroom,bathroom,kitchen}.webp` | 192×192 | no | — |

Sources (PNG) live in `assets/` (`home-chapters/worlds-atrium.png` 1672×941,
`spatial-hero/architecture-{a,b}.png` 1586×992, `portal-atlas.png`,
`home-intro/intro-breeze.png`).

**Unreferenced by any source file** (leftovers from removed chapters):
`home-chapters/journey-ribbon*`, `material-groups*`, `material-tableau*`,
`materials-architecture*`, `spaces-architecture*`, `worlds-architecture*`.
`spatial-breeze-ribbon*` is listed only in `data/image-dimensions.json`.

## 15. Responsive strategy

**One timeline function for all sizes**, parameterised by family. Desktop and
tablet do not have separate timelines.

| Concern | Mobile <768 | Tablet 768–1199 | Desktop ≥1200 |
| --- | --- | --- | --- |
| Story height (motion; reduced motion in brackets) | 480svh (280svh) | 560svh (320svh) | 640svh (360svh) |
| Depth multiplier (text/TP/arch) | 0.5 | 0.75 (arrival 0.7) | 1 |
| TP Scene 1 box / Scene 2 target | own box; target −21vw, 19svh, ×0.88; opacity 0.75 | own box (portrait override 24svh, ×0.8) | 38.1%/6.7%, 25.8%×49%; target 13svh, ×0.86 |
| Breeze | 1 unmasked projection, breezeDepth 0.58 | 3 projections, 0.75 | 3 projections, 1 |
| WebGL sky | 1 cloud + sky, DPR 1 (since PASS 1; Save-Data → cloth only) | 2 clouds | 3 clouds |
| Scene 3 camera | 0.686–0.895, crop 176 px | 0.701–0.907, crop 168 (portrait 176) | 0.705–0.91, crop 160 |
| Mass response | off | τ 36 ms, 1.6 px | τ 44 ms, 2.4 px |
| Scene 3 layout | stacked column, 2×2 room grid, plate `object-position 51% 0` | copy bottom-left, 2×2 room grid right | rooms on architectural coordinates |
| Story rail / leaves | hidden / hidden | hidden / shown | shown / shown |
| Plates | 720 | 1280 | full |

Additional rules: tablet portrait/landscape overrides, desktop `max-height:820px`
text tightening, ≤359 px type sizes. Room discovery tier (`complexityTier`):
minimal (reduced) / light (<768 or coarse) / medium (<1200) / full.

## 16. Reduced-motion strategy

Detected via `matchMedia('(prefers-reduced-motion: reduce)')` (live-updating).

- **Loader:** keyframes disabled, final composition shown immediately, 300 ms `hi-reduced-exit` (measured end ≈ 2.3 s after bootstrap vs ≈ 3.1 s normal).
- **Scene 1 → 2:** TP moves over a short 0.28–0.32 interpolation; copy crossfades on the `perspective` value (0.27–0.33) with no Y offset; no leaves/architecture parallax.
- **Bridge:** cloth hidden; **no WebGL and no ambient motion** (0 RAF, 0 draws measured); no TP depth departure; Scene 2 **dissolves** directly to the static Scene 3 sky crop (0.605–0.64); sky crop held to 0.745; then a **cut** with a 0.015-wide exposure dip (floor 0.65) to the full Atrium (no animated zoom).
- **Scene 3:** UI reveals 0.80–0.84 without movement; hover transforms disabled; mass response off; rail hidden.
- **Still animates:** scroll-mapped opacity crossfades/dissolves, the short TP position interpolation, header ink mix, text fades.
- **Completeness:** every chapter, link and the Footer remain reachable (verified by screenshots).

## 17. Asset loading / preload strategy

| Asset | When | Mechanism |
| --- | --- | --- |
| Scene 1 plate | first paint | eager `<img fetchpriority=high>` |
| Portal atlas | first paint | eager; the HTML contains a `<link rel=preload as=image>` for it |
| Fonts | first paint | self-hosted WOFF2; loader waits for 3 specific faces via `document.fonts.load` |
| Loader gate | intro | `preloadHomeCriticalAssets` decodes Scene 1 plate, TP/portal images + fonts; timeout 4000 ms; minimum display 1800 ms |
| Scene 2 plate | after 2 story paints | `data-src` → `src`, `decode()` → `data-story-image="ready"` |
| **Atrium plate** | **p ≥ 0.16** | `prepareSceneImage`: `loading=eager`, `src` installed, `decode()` → `sceneImage='ready'` (gates the bridge) |
| CTA preview | p ≥ 0.30 | low priority |
| Room previews | p ≥ 0.30 (fine pointer ≥768) or on hover/focus | low priority, decoded before use |
| Three.js | p ≥ 0.12 | dynamic import (named members) + `compileAsync` |
| JS | — | `modulepreload` for header, home-experience, intro loader, framework chunks |

Measured on live (clean desktop checkpoint run): requests are **progress-gated,
not time-gated**. The Atrium plate was requested at the first checkpoint past
0.16, and `three.module` + CTA preview at the first checkpoint past 0.30. The
Scene 2 plate was requested ≈1.0 s after navigation start, **during the loader**,
because the story mounts hidden underneath it.

## 18. Known performance risks (mapped, not fixed)

1. **Scene 3 plate raster under large CSS scale.** A 1672×941 image layer is scaled 5.88→1 every frame; `will-change: transform` is set only while the mass response is active. **The user's Mac recording shows flat brown frames and half-painted (tiled) frames during the pull-back** (§25, problem 8). This was not reproduced headless on the RTX 3090 at DPR 1. Pattern consistent with compositor tile checkerboarding; root cause not verified.
2. **Sky-crop upscaling.** ~245 source px stretched to 1440 px wide: visible softness and compression artefacts (0.70–0.74).
3. **Three.js chunk** 511 KB / 126 KB gzip (PASS 1), fetched at p ≥ 0.12. The first-crossing DOM fallback seen in the user's recording was reproduced on the old build with 4× CPU + ~9 Mbps/150 ms (0/3 runs painted WebGL) and is fixed in PASS 1 (3/3 runs, 100% of bridge frames). Very slow networks can still fall back to the cloth.
4. **Full-viewport transparent WebGL canvas**, up to 4 full-screen planes with FBM per fragment on desktop. Bounded by DPR caps and pixel budgets. Since PASS 1 it also draws **while scroll rests** inside 0.5135–0.723 (ambient, 30 fps desktop/tablet, ~20–24 fps mobile) — battery cost on phones is not measured on real hardware. Context persists while Home is mounted.
5. **Near-camera SVG cloth** scaled ≈10× with gradient masks: three `<use>` projections of ~50 paths re-rasterised as transforms change.
6. **Overlapping full-screen rasters** during 0.12–0.42 (plates A and B + portal atlas). Inactive scenes are hidden with `visibility` rules.
7. Per-frame DOM writes across ~20 opening-layer nodes (mitigated by change detection + signature skip).
8. **Not present:** GSAP/ScrollTrigger instances, permanent RAF loops in the story, per-frame React state, `filter`/`blur`/`backdrop-filter` animation (the only `backdrop-filter` is forced to `none` on dialog overlays), blanket `will-change`. Cleanup removes every listener, disconnects the ResizeObserver, disposes WebGL/image preparation and restores attributes.
9. Windows checkouts use CRLF (`core.autocrlf=true`), so local chunk hashes differ from Vercel's Linux build (bytes inside template literals differ).
10. Risk 1 investigation (PASS 1): ~6,100 screencast frames of trackpad-like scrolling through the pull-back at 1680×928 DPR 2 under GPU, CPU-raster and full-software rendering produced **0 backdrop-only frames**, with both the old and a stable-promotion `will-change` policy. Root cause remains unverified; no change was made. Needs investigation on the affected Mac.
11. PASS 6B.1 (2026-10-08), after the owner reported the picture flashing once as the pull-back reaches the full Atrium. Measured at 1680×887 DPR 2 on device-resolution compositor frames: the fine detail of the picture (Laplacian energy) rose from 440 to 699 (+59%) between two frames that were otherwise alike, in the frame the camera's transform became `none`. Cause: a `translate3d` pose makes the browser draw the Atrium once into a texture and resample it as the camera moves, which is softer than the photograph drawn directly (same scale, 3D against 2D: 0.62 of the detail at 1.02×, 0.85 at 1.5×, 0.98 at 2×); with `will-change` the texture also keeps the scale it was drawn at. Change: through the bridge the pose is written in 2D and never promoted, so the photograph is drawn directly at every scale and meets rest without a step (largest step after the change: 4%). Frame pacing is unchanged at DPR 2, at DPR 2 with the CPU slowed four times, and on a DPR 3 phone viewport. Not proven: that this also removes the flat brown and half-drawn frames of item 1. It removes what they need (a promoted texture held at a high scale while the visible area grows), but they were never reproduced here, so only the affected Mac can confirm.

Measured on live (headless, 1440×900, DPR 1, RTX 3090), wheel-driven runs from p 0.40 to the page end and back:

| Run | RAF median / p95 | frames >33 ms | max | long tasks | LoAF >50 ms | layout shifts |
| --- | --- | --- | --- | --- | --- | --- |
| slow fwd / rev | 16.7 / 16.8 ms | 3 / 2 | 50 / 66.9 ms | 0 / 0 | 1 / 1 (65–66 ms, 0 blocking) | 0 |
| normal fwd / rev | 16.7 / 16.8 ms | 0 / 1 | 33.2 / 100 ms | 0 / 0 | 0 / 1 (104 ms, 0 blocking) | 0 |
| fast fwd / rev | 16.7 / 16.8 ms | 0 / 2 | 16.9 / 100.2 ms | 0 / 0 | 0 / 1 (103 ms, 0 blocking) | 0 |

Page load (clean run): 4 layout shifts totalling ≈ 0.0046, 0 long tasks, one
412 ms long animation frame at startup (14 ms blocking). JS heap ≈ 8.6 MB
(`performance.memory`). Time to cross p 0.50 → 0.92: slow wheel ≈ 1.78 s,
normal ≈ 0.62 s, fast ≈ 0.13 s.

## 19. Live-vs-local discrepancies

**No homepage code or asset discrepancy was found. Production = HEAD `2b3232b`.**

- **Client JS/CSS:** all 19 assets referenced by the live homepage (HTML + lazy chunks) match a local `yarn build:vercel`. 13 are byte-identical; 5 differ only by CRLF inside template literals (and the resulting hash cascade); `vinext-*.js` differs only by per-build random IDs.
- **Images/fonts:** 14/14 key homepage files byte-identical to `public/`.
- **Rendering:** 38/38 desktop checkpoints pixel-identical between live and local dev (mean absolute difference 0.00) with identical timeline state, including WebGL frames. Mobile 38/38 identical (max MAD 0.01, at p 0.30).
- **Environment-dependent behaviour (not code drift)**, seen in `Tân Phong.mov` (macOS Chrome, Retina, ≈1680 CSS px wide — inferred from the 3358×1856 capture) but not in headless audits:
  - the first forward crossing showed **no WebGL cloud phase** (cloth stripes only); the reverse crossing **did** show WebGL clouds;
  - **blank/half-painted brown frames** during the Scene 3 pull-back.
- **Documentation vs repository:**
  - `README.md` is stale: it says Three.js is "intentionally not installed" (it is a dependency and used) and that Worlds has no detail route (`app/worlds/[slug]` exists; `/worlds/modern-bathroom` returns 200).
  - `docs/HOME-THREE-ATMOSPHERIC-BRIDGE.md` cites an earlier recording (`…2026-10-01 lúc 20.44.20.mov`, 1.4 s) that is not on this machine. The current reference is the 15.27 s file named in the header.
  - Briefs mentioning GSAP/ScrollTrigger/Lenis do not describe this codebase.

## 20. Baseline lint status

**PASS.** `oxlint` (type-aware): **0 warnings, 0 errors on 142 files, 208 rules**.
`yarn lint` exits 0 but prints nothing through Yarn on this machine; run
`node_modules/.bin/oxlint` to see the summary. `components/ui/**` and
`hooks/use-mobile.ts` are excluded by config.

## 21. Baseline typecheck status

**PASS.** `yarn tsc --noEmit` exits 0 with no diagnostics (≈5 s). There is no
`typecheck` script in `package.json`; the command comes from the README.
Writes the gitignored `tsconfig.tsbuildinfo` (`incremental: true`).

## 22. Baseline production-build status

- `yarn build` (vinext, Cloudflare target): **PASS**, ≈6 s. One warning: "Some chunks are larger than 500 kB" = `three.module` (lazy).
- `yarn build:vercel` (the deployed target): **PASS**, ≈14 s, emits `.vercel/output`.
- `yarn install --immutable`: PASS with no lockfile change. Yarn reports build scripts disabled for `esbuild` and `workerd` (YN0004); dev and both builds still work.
- Project suites, all **PASS**: `check:home`, `check:intro`, `check:hero`, `check:content`, `check:assets`, `check:worlds`.
  - **Important for future passes:** `check:home` (`scripts/check-atmospheric-*.mjs`, `check-home-motion.mjs`, `check-continuous-breeze.mjs`, `check-home-chapters.mjs`, `load-story-math.mjs`) asserts many current timing constants and uses **source-text regexes**, for example forbidding `requestAnimationFrame` / `setInterval` / `Date.now` in specific files. Retiming or a new clock requires deliberate updates to those assertions.
- `yarn dev`: starts in ≈2 s; homepage loads with **0 console errors, 0 warnings, 0 page errors**.

---

## 23. Loader, Header, Footer (reference)

- **Loader:** plays on fresh navigate/reload of `/` (or `?intro=1`). Sequence (measured, desktop live): bootstrap `waiting` → `ready` after ≈1.9 s (1800 ms minimum) → `revealing` +150 ms → removed +1.0 s; ≈3.1 s from bootstrap to removal. Visual: ivory field, walnut TP with raster silk ribbon, slogan "A new breeze *for living*" fades in ≈0.9 s, progress line, then top/bottom panels open from a horizontal slit onto Scene 1. Desktop fine pointer adds a subtle pointer parallax.
- **Header:** `position: fixed`, transparent on home, ink `#332b22` → ivory `#f3e9d6` between 0.72 and 0.78 (`data-chapter-theme` light/bridge/dark). `data-opening` is `active` in Scene 1, `past` afterwards. The "past story" reset to dark ink never triggers at the tested sizes (the page bottom is reached first), so the header stays ivory over the Footer region.
- **Footer:** normal flow after `<main>`; desktop 533 px, mobile 745 px; background `#e9e1d3`.

---

## 24. Transition character (classification)

- **Scene 1 → Scene 2: B (separate states connected by animation)** inside one persistent viewport: layered crossfade (copy, plates, portals) + continuous TP travel. No camera.
- **Scene 2 → Scene 3: hybrid, closer to A.** Persistent viewport, camera-like push, atmospheric occlusion hiding a hard swap at 0.64, then a genuine camera pull-back inside the Atrium photograph. Continuity is broken by three different camera models and a push-in → pull-out direction change. Speed is entirely user-controlled: a fast flick collapses the atmosphere into about one frame.

---

## 25. CURRENT DEPLOYED EXPERIENCE

URL: https://tp3d-vn-v2.vercel.app/ (observed 2026-10-03; baseline screenshots in `work/pass0/live/*/checkpoints/`).

**Loader.** As §23. No errors. Ends by opening onto the already-composed Scene 1.

**Scene 1 (p 0).** Full-bleed warm terrace plate (lake view left, olive tree and stone stairs right). Large stone-textured TP top-centre (≈x 600–890, y 70–480 at 1440×900); translucent silk ribbon sweeping from top-left through the TP to bottom-centre; EN headline left, VI headline right, centre axis copy; four arched portals across the lower third; colophon at the bottom; header dark ink, transparent.

**Scene 1 → 2 (≈0.12–0.42).** TP glides down and shrinks slightly; plate A dissolves into plate B; Scene 1 copy lifts and fades while Scene 2 copy rises in. **Mid-transition (p 0.27) is double-exposed**: "OUR STORY / SPACES SHAPE PEOPLE" overlaps "A new breeze for living.", and ghosted portals remain visible.

**Scene 2 (0.42–0.48).** Arched gallery plate (sofa left, stair and sculpture right); TP centred; EN and VI columns with full body copy; centre axis lines; side note; story rail "02 PERSPECTIVE" at the right edge; colophon line.

**Scene 2 → 3 (0.48–0.92), desktop with WebGL.** Text departs by role; cloth swings in from the right; fog banks creep in from the left/bottom (0.54–0.56) with patchy text legibility; at 0.58–0.62 the cloth fills the viewport as **large concentric stripe arcs**; 0.62–0.64 is a pale ivory/grey cloud field (context loss); blob-like clouds open onto blue shader sky (0.66–0.68); **at ≈0.70 the photographic oculus sky appears, soft from 5.88× upscale**, with dark leaves at the top-left colliding with the header wordmark; the oculus rim enters (0.72–0.74); the camera pulls back through the skylight ring into the Atrium (0.76–0.86); room labels and copy reveal (0.82–0.92).

**Scene 3 final (≥0.92).** Atrium with oculus, warm stone/wood ring, central tree on a stone planter in a circular reflective pool, four room openings labelled Living / Bedroom / Bathroom / Kitchen (perspective-angled on desktop), copy bottom-left, circular CTA bottom-right, ivory header. Clean: no cloud, cloth or TP.

**Footer entry.** After only **0.08 of span of stillness** (187 px desktop, 122 px mobile, 208 px tablet portrait), the sticky stage scrolls up and the ivory Footer rises in normal flow; the fixed ivory header stays over the departing Atrium.

**Responsive observations.**
- Tablet portrait: same sequence with 2 cloud planes; Atrium cropped (oculus partly cut at top), 2×2 room grid.
- Mobile: stacked layouts; **no WebGL** — the vertical cloth bands alone fill the screen (≈0.62) and exit to the upper right over the photographic sky; Scene 3 stacked with a 2×2 room grid; on Footer entry the fixed header wordmark overlaps "Enter the worlds." and later the CTA.
- Reduced motion: as §16; complete experience.

**Known visible problems (observed).**
1. Scene 1→2 double-exposed headlines and ghost portals (p ≈ 0.27).
2. Patchy, partially fogged body text during the Scene 2 exit (≈0.56).
3. Near-camera cloth reads as **graphic stripes** rather than atmosphere (0.58–0.62). On the first crossing in the user's recording it is the only occluder, ≈0.8 s of stripes.
4. Story rail still drawn over the fog at 0.56–0.60.
5. Header stays dark until 0.72; leaves overlap the wordmark at ≈0.70.
6. Style break from procedural blob clouds to photographic cumulus, with brief double exposure near 0.69.
7. Soft, artefacted sky crop (0.70–0.74).
8. **Blank brown / half-painted Atrium frames during pull-back** (user's Mac recording, `work/pass0/reference/tanphong-blank-frames.jpg`).
9. Very short Scene 3 stillness before the Footer moves.
10. Fast scroll collapses the atmosphere into about one frame (no temporal smoothing by design).
11. Desktop rail "03 WORLDS" overlaps the Kitchen counter in Scene 3.
12. First-crossing WebGL inconsistency (cloth only forward, clouds on reverse) in the user's recording.

---

## 26. UNESCO MOTION REFERENCE — PRINCIPLES ONLY

Source: `Ghi Màn hình 2026-10-02 lúc 23.45.05.mov`, 15.27 s, 3358×1856,
analysed through 11 even frames (0–100%) plus 46 frames at ~0.33 s.
**Motion principles only — no UNESCO assets, artwork, colours, typography,
objects, architecture, layout or branding may be used.** Whether its motion is
scroll- or time-driven cannot be determined from the video alone (a cursor is
visible and the timing is uneven).

- **Persistent stage.** One viewport throughout; a small brand mark stays on top except during the final whiteout.
- **Anchor continuity.** One central object stays roughly central for ~10 s while everything changes around it: it sits in clouds, becomes a line-drawn outline in a "loss" caption beat (≈5–6 s), returns, and grows as the camera approaches. It leaves frame only at the moment of acceleration.
- **Foreground atmosphere.** Large, bright cloud masses rise in front of the anchor (≈1 s) and wrap its base later. Occlusion comes from volumes in front of the subject, not overlays.
- **Depth-layer velocity.** Clearly separated speeds: near foreground (forest, cloud masses, a foreground slab passing the lens ≈7.5–8.8 s) fastest and motion-blurred; anchor medium; distant ridge and sky slowest and defocused (depth of field).
- **Occlusion and context loss.** Two information drops: ≈6.1 s (clouds fill, anchor faint) and ≈10.2–10.5 s (complete white).
- **Negative space.** Long, quiet holds with captions over slowly drifting clouds (≈2.0–4.8 s, ≈5.1–5.8 s).
- **Camera acceleration.** Short and decisive (≈9.2–10.0 s): forward/down push, anchor exits the top, foreground streaks.
- **World swap hidden by atmosphere.** The new environment is swapped inside a full white frame (≈0.35–0.7 s). Even the brand mark disappears there.
- **New-world emergence.** It fades up from white as a washed-out, high-key image, gaining contrast over ≈1.4 s (≈10.9 → 12.2 s), already in gentle motion.
- **Long settle.** ≈2–3 s of deceleration with slow drifting elements; the title arrives late (≈13.2 s).
- **Stillness.** ≈2 s of near-stillness with the UI present (subtle ambient drift remains).
- **Asymmetry.** Slow accumulation (~9 s), fast acceleration (<1 s), short blank, long arrival (~4 s).
- **Measured micro motion (PASS 1).** Mean absolute difference of 400-px greyscale frames: the cloud caption hold (3.0–3.6 s) is **completely frozen** (0.00 per 50 ms); the new world's arrival changes ≈5–8 per 50 ms; the final still world keeps subtle drift ≈0.35 per 50 ms.

### Comparison with the current Tân Phong bridge

| Principle | UNESCO | Tân Phong today |
| --- | --- | --- |
| Persistent | viewport, brand mark, central anchor through the push | viewport, fixed header (never fades), TP **until the 0.64 swap only** |
| Fastest layer | near foreground / cloud masses / passing slab | near-camera cloth (≈10× scale), near WebGL cloud plane |
| Slowest layer | far ridge and sky (defocused) | Scene 2 architecture (+3.5%), sky plane |
| Hides the swap | full white frame, brand mark gone | full WebGL coverage at 0.6225–0.64 (or cloth only on mobile / fallback) |
| Information drop | two (≈6.1 s, ≈10.2 s) | one (≈0.58–0.66, ≈190 px desktop) |
| Acceleration | short burst just before the swap | 0.494–0.64 `accelerate` curves |
| Pause / suspension | multi-second caption holds | sky hold 0.64–0.705 (≈150 px) |
| New environment | fades up from white, contrast ramps | cloud gaps open onto the photographic sky, then a 2D zoom-out of one photo plate |
| Camera model | one continuous forward camera | three stitched models; push-in then pull-out |
| Settle | ≈2–3 s deceleration, then UI | `arrive` 0.705–0.91, UI 0.82–0.92 |
| Stillness | ≈2 s | 0.08 of span (187 px), then the Footer moves |
| Duration control | timed / unknown | 100% scroll-mapped: ≈1.8 s slow, ≈0.6 s normal, ≈0.13 s fast flick |

---

## 27. NEXT MOTION TARGET (implemented in PASS 1 — see §30)

Scene 2 → SharedTP recedes → Breeze approaches the lens → atmospheric clouds
take over the foreground → architectural context disappears → sky → the real
Scene 3 skylight → through the oculus → Atrium → stillness.

Constraints inherited from the current architecture: keep the single native
scroll owner (no second clock or library), keep the hidden swap inside full
occlusion, keep the final Atrium clean, keep reduced-motion / mobile / failure
fallbacks complete. Address problems 3, 6, 7, 8, 9, 12 in §25.

## 28. Files likely to be touched in the next motion pass

- `components/home/experience/home-motion.ts` — timing vocabulary
- `components/home/experience/atmospheric-sky-frame.ts`, `atmospheric-sky-renderer.ts`, `atmospheric-sky-shaders.ts` — WebGL atmosphere
- `components/home/experience/atmospheric-bridge-frame.ts` — bridge, `atriumPose`, `worldReveal`
- `components/home/experience/breeze-bridge-pose.ts`, `breeze-renderer.ts` (± `breeze-geometry.ts`, `continuous-breeze.tsx`)
- `components/home/experience/home-story-timeline.ts` — master wiring, takeover, `will-change` policy
- `components/home/experience/home-story-frame.ts` — TP / chapter timing
- `components/home/experience/home-story.css`, `home-experience.css` — layering, story height
- `components/home/experience/home-production.ts` — preload thresholds
- If Scene 3 gains layered or higher-resolution assets: `worlds-chapter.tsx/.css`, `chapter-image.tsx`, `data/home-chapter-assets.json`, `public/images/home-chapters/*`, `assets/home-chapters/*`
- Tests: `scripts/check-atmospheric-sky.mjs`, `check-atmospheric-bridge.mjs`, `check-home-motion.mjs`, `check-continuous-breeze.mjs`, `check-home-chapters.mjs`, `load-story-math.mjs`
- This document

Not expected: Loader, Footer, routes, Scene 1 content.

---

## 29. Evidence index (`work/pass0/`, gitignored, local only)

| Path | Content |
| --- | --- |
| `live/desktop/checkpoints/*.png` | 38 baseline screenshots, 1440×900, p 0→1 + Footer (`report.json` = state per checkpoint) |
| `live/desktop/sheet-bridge-a.jpg`, `sheet-bridge-b.jpg`, `sheet-footer.jpg` | bridge / Footer contact sheets |
| `live/desktop/contact-loader.jpg`, `loader-cast/` | loader screencast |
| `live/desktop/motion/*/`, `motion-report.json`, `contact-*-forward.jpg` | wheel-scroll screencasts + per-frame RAF logs |
| `live/{mobile,tabletPortrait,reduced}/` | checkpoints + `sheet.jpg` + `report.json` |
| `local/{desktop,mobile}/` | same checkpoints on local dev (pixel-identical) |
| `reference/unesco-11*`, `unesco-46*`, `unesco-key.jpg` | UNESCO frames (motion study only) |
| `reference/tanphong-*` | frames from the user's `Tân Phong.mov`, incl. `tanphong-blank-frames.jpg` |

Named regression baselines: Scene 1 `p0.000`, 1→2 `p0.270`, Scene 2 `p0.450`,
2→3 `p0.580` / `p0.600`, sky `p0.680` / `p0.700`, Scene 3 `p0.960`, Footer
`footer-0.50vh`.

---

## 30. PASS 1 — Atmospheric auto-motion bridge (`a25d1ac`, deployed 2026-10-03)

Summary; full notes and QA in `docs/HOME-ATMOSPHERIC-AUTO-MOTION.md`.

- **Macro motion stays scroll-owned:** camera, density, cloth handoff, swap
  (0.64), sky opening, DOM pull-back and UI. **Micro motion is time-driven**
  and only animates the air: integrated advection along the Breeze current
  (upper right), bounded bank wander, slow domain warp, aperiodic breathing,
  drifting sky windows. Drift rates 0.35–0.7% of viewport height/s.
- **One RAF owner:** the master runs ambient-only frames (`skyBridge.tick`)
  while `skyBridge.wantsTime()`; throttled to 30 fps (desktop/tablet) /
  ≈20–24 fps (mobile); 0 RAF and 0 draws outside the bridge, in the Footer,
  in hidden tabs and in reduced motion. Steps clamped to 42 ms; gaps >250 ms
  resume in place.
- **Tiers:** new `mobile` WebGL tier (1 bank + sky, DPR 1, no warp, 0.6× life);
  Save-Data phones and reduced motion keep the DOM bridge.
- **Handoff:** cloth yields over 0.556–0.606; rail hides from 0.556; inside the
  atmosphere a luminous haze, shaded banks and small sky windows.
- **Sky match:** palette measured from the oculus crop; browser difference
  ≤2 RGB levels per band at p 0.68.
- **First crossing:** preparation at p ≥ 0.12 and arming before cloud
  formation; throttled first crossing now WebGL in 3/3 runs (was 0/3).
- **Bundle:** `three.module` 511 KB / 126 KB gzip (was 719 / 180).
- **Lifecycle:** 20 bridge cycles and 5 route round trips — one canvas and one
  context at a time, no RAF on `/worlds`, no listener growth.
- **Open:** the Mac-only blank Atrium frames (§18 risk 1) remain unreproduced
  and untouched.
- **Production check after deploy (2026-10-03):** 0 page errors on desktop,
  mobile (emulated) and reduced motion; narrative held at all 11 stops; ambient
  frames only inside the bridge; 0 RAF / 0 draws in the Atrium and Footer;
  throttled first crossing WebGL in 3/3 runs. Real-phone testing still pending.
- **Evidence:** `work/pass1/` (gitignored).

---

## 31. TP3D PASS 01 — Arrival (summary)

Full record: `docs/TP3D-PASS-01-ARRIVAL.md`.

**Intro**

- The composed first frame (header replica, silk, brand line) appears at
  first paint.
- TP 240 ms, rise 760 ms, slogan 1000 ms, status 1150 ms.
- The opening is `--hi-duration` = `DURATION.entrance` (1500 ms) on desktop
  and tablet, `DURATION.cinematic` (1000 ms) on mobile, 300 ms reduced. Its
  phases are fractions of that duration:
  - clear 0–0.18
  - seam ±4 px 0–0.18
  - slab split 0.18–1.0
  - far-plane settle 0.18–1.0
  - TP and leaves settle 0.36–1.0
  - cloth 0.50–0.95
  - header 0.65–0.95
- Measured desktop intro completion: ≈ 3.7 s (was ≈ 3.2 s).

**First scroll**

- `arrivalTiming.approach = [0, 0.14]`.
- Architecture A: + `0.008 × approach × depth` scale. Leaves: −
  `6 × approach × depth` px.
- `approach` is multiplied by `(1 − travel)`, so every Scene 2 endpoint is
  unchanged.
- The Scene 1 reading hold now applies to content only: copy, portals, TP.

**Pointer depth** (`hero-depth.ts`)

- Desktop tier only. TP surface ±3/2 px, portals ±6/3.5 px.
- Weight `1 − smoothstep(p / 0.12)`. τ 220 ms, ε 0.015.
- Ticked by the master RAF (`step()` → `heroDepth.tick` / `wantsTime`).
  Pointer input calls `request()`, never the narrative render.
- 0 RAF at rest.

---

## 32. TP3D PASS 02 — Arrival → Perspective handoff (summary)

Full record: `docs/TP3D-PASS-02-SPATIAL-HANDOFF.md`.

**Scene 1 out**

| Element | Range |
| --- | --- |
| Metadata | 0.14–0.195 |
| Portals (sink 12 px, ×0.982) | 0.155–0.23 |
| EN headline | 0.185–0.25 |
| VI headline (<1200: 0.14–0.215) | 0.195–0.26 |

`.sh-discovery` is hidden from 0.26.

**Breath** (no copy): 0.26–0.31 desktop, 0.25–0.31 tablet and mobile.

**Plate B**

- Desktop/tablet: aperture `clip-path: inset(0 x% 0 x%)`, 50 → 0% over
  0.255–0.325, with opacity over 0.255–0.275. Then `clip-path: none`.
- Mobile: dissolve over 0.265–0.305.
- Reduced: dissolve over 0.28–0.30.

**Scene 2 in**

| Group | Range |
| --- | --- |
| Heading (eyebrow + h2), EN / VI | 0.31–0.36 / 0.32–0.37 |
| Body, EN / VI | 0.345–0.395 / 0.355–0.405 |
| Metadata | 0.375–0.42 |

**Reduced motion**

| Element | Range |
| --- | --- |
| Scene 1 out | 0.25–0.28 |
| Scene 2 heading / body / metadata | 0.30–0.33 / 0.31–0.34 / 0.32–0.35 |

The read-story link is interactive from the metadata group's end on both
paths.

**Unchanged:** the TP travel 0.12–0.42 (reduced 0.28–0.32), the chapter
switch at 0.30, the cloth pose exchange 0.27–0.33, the Scene 2 hold
0.42–0.48 and every bridge range.

## 33. TP3D PASS 03 — Perspective → Atmosphere (summary)

Full record: `docs/TP3D-PASS-03-PERSPECTIVE-ATMOSPHERE.md`.

**Timing source of truth** (`home-motion.ts` `MOTION`, desktop `p`; tablet and
mobile share these ranges, and camera start is 0.705 / 0.701 / 0.686)

| Beat | Range |
| --- | --- |
| Scene 2 hold | 0.42–0.48 (unchanged) |
| First stir of air | from 0.48: 3% of the cloth approach on a smoothstep 0.48–0.632 (`breeze.stir`); the bridge pose applies from `bridge.exitStart` |
| Copy out, labels / body / heading | 0.484–0.556 / 0.506–0.58 / 0.526–0.60 (was …0.574 / …0.608 / …0.631) |
| TP anticipation / departure | 0.494–0.556 / 0.534–0.64 (unchanged) |
| Architecture push | 0.55–0.64 (unchanged) |
| Cloth approach / foreground / density / transfer | 0.52–0.632 / 0.54 / 0.558–0.626 / 0.525–0.595 (unchanged) |
| Thread weave resolves | 0.525–0.595 (new, every family) |
| Cloth → cloud takeover (WebGL only) | 0.556–0.606 (unchanged) |
| Context loss | from 0.60: no copy remains |
| World swap | 0.64 (unchanged) |
| Sky suspension | 0.64 → camera start (unchanged, camera parked) |
| Reduced swap | Scene 2 + TP 1 → 0.65 over 0.625–0.64, cut, Scene 3 0.65 → 1 over 0.64–0.655 (`reduced.halfDip`, `reduced.floor`); `reduced.dissolve` removed |

**Unchanged:** `SKY_BRIDGE`, tiers, pixel budgets, shaders, ambient rates,
the renderer, the swap rule, the 0.745 reduced framing cut and every Atrium
camera, exposure, header and reveal value from camera start.
`check-perspective-atmosphere` locks the PASS 01/02 frames through 0.48 and
the Atrium range from camera start against `fefb910`.

## 34. TP3D PASS 04 — Atmosphere → Worlds / Atrium reveal (summary)

Full record: `docs/TP3D-PASS-04-ATMOSPHERE-WORLDS.md`.

**Timing source of truth** (`home-motion.ts` `MOTION`, `home-production.ts`;
desktop `p` unless noted)

| Beat | Range |
| --- | --- |
| World swap | 0.64 (unchanged) |
| Parked sky (atmosphere clears to 0.72) | 0.64 → camera start |
| Camera start / end | desktop 0.72 / 0.88, tablet 0.715 / 0.875, phone 0.715 / 0.87 (`arrive`, 5.88× / 5.35× → 1) |
| Oculus rim enters | ≈0.73–0.74 (after the atmosphere has opened) |
| Architecture recognisable (`camera.recognizable`) | 0.81 (≥55% of the plate visible) |
| Plate motion under 1/5 of peak (`camera.settleStart`) | 0.85 |
| Exposure (`light`) | 0.785–0.865; reduced: switches inside the 0.745 cut dip |
| Header ink → ivory (`header`) | 0.82–0.855; reduced: across the cut dip |
| Rooms 01–04 (`ui[0..3]`) | 0.845–0.875, 0.851–0.881, 0.857–0.887, 0.863–0.893 |
| 3D WORLDS / Enter / the worlds. | 0.867–0.893 / 0.872–0.899 / 0.878–0.905 |
| Body / signoff / CTA + baseline | 0.885–0.909 / 0.89–0.913 / 0.895–0.915 |
| Rail + chapter `worlds` (`bridge.revealStart`) | from 0.845 |
| Room links interactive (`bridge.interactive`) | 0.895; CTA at 0.915 |
| Settled, discovery (`bridge.settled`, `discoveryStart`) | 0.915 |
| Final hold | 0.915–1.0 (199 px desktop, 129 px at 390×844) |
| Reduced UI | 0.775 + 0.006 × order, 0.02 each (rooms → CTA, 0.775–0.854) |

**Also:** tablet and phone plates use a `#241a1499` zenith shade under the
header; short landscape screens (`max-width: 1199px`, `max-height: 540px`,
landscape) use the grouped composition sized by `svh`.
`check-atmosphere-worlds` locks PASS 01–03 through the swap against
`8baae05` and the approved Atrium reveal.

## 35. TP3D PASS 05 — Enter the World gateway + Lobby (summary)

Full record: `docs/TP3D-PASS-05-WORLD-GATEWAY.md`.

**Homepage.** Only the Atrium CTA changed: `WorldGatewayLink`
(`components/world/world-gateway-link.tsx`) renders `<a href="/world"
data-world-gateway>` with "ENTER THE WORLD ⟶" and the unchanged circular
preview (now `data-world-origin`). Its reveal window (0.895–0.915) and
interactive gate (0.915) are PASS 04's. The four room shortcuts keep their
routes. No new RAF, listener on scroll, canvas or request before intent;
`/world` is prefetched on pointer enter, focus or touch start only.

**Portal** (`components/world/world-portal.ts`, no RAF)

| Step | Value |
| --- | --- |
| Gate | plain primary activation only (`isPlainPrimaryActivation`); a second activation while crossing is ignored |
| Cover | fixed layer z 150 (above header 40, below intro 200): dim to 0.35 + one circle in `--world-ground` scaled from the preview radius to the viewport, `DURATION.cinematic` 1000 ms, `cssEase('cinematic')`, transform/opacity only |
| Reduced | flat opacity fade, `DURATION.micro` 220 ms, linear |
| Navigate | `router.push('/world')` once, after the cover completes |
| Release | the Lobby's `LobbyArrival` resets scroll under the cover, then fades it 1 → 0 over `DURATION.fast` 400 ms |
| Safety | resize / reduced-motion change completes the cover and crosses; cancelled or stalled animation crosses (cover + 400 ms); release watchdog 2.5 s; document navigation fallback 4 s; popstate away from `/world` and `pageshow` (persisted) remove the layer |

**Lobby.** `/world` (`app/world/page.tsx`, `components/world/world-lobby.tsx`)
is a server-rendered 2.5D shell over the Atrium plate. There is no canvas
or Three.js; rooms come from `data/world-building.ts`. The root layout's
`EditorialChrome` hides `SiteHeader` and `SiteFooter` on `/world` and
`/world/*`. `check-world-gateway` and the `/` and `/world` blocks in
`check-site` lock this.

## 36. TP3D PASS 6A — dormant Tier B room orbit foundation (not deployed)

Full contract: `docs/TANPHONG_ATRIUM_ORBIT_IMPLEMENTATION.md`; render
contract: `docs/TANPHONG_ATRIUM_ORBIT_ASSET_SPEC.md`.

**Production is unchanged.** The deployed homepage still runs the approved
Scene 3 with the portal orbit (`aa9ae55`).

**Gate.** The only production source change is a gated hook in
`home-story-timeline.ts`. The gate is
`(import.meta.env.DEV || import.meta.env.VITE_ATRIUM_ORBIT_PREVIEW === '1')`
and `?atriumOrbit=1`; only then does it dynamically import
`atrium-orbit-controller.ts`. The gate is shut in production builds.
`check:atrium-orbit` keeps the base-journey digest (`11b1a49bdceb01ae`) and
the protected-files digest (`d8922fdb98a3c952`). `check:lab` re-pins the
timeline lock to `0e1c49fea94ce229`.

**Modules.** New, in `components/home/experience/`:

- `atrium-orbit-model` (Arrival → Living → Bedroom → Bathroom → Kitchen);
- `-cameras` (the camera JSON contract and validation);
- `-progress` (holds weighted apart from moves, signed-angle weights, a stateless sampler, preload plan);
- `-manifest` (the only plate naming; every plate `missing`);
- `-transition` (extension point and a provisional cut);
- `-controller` and `-preview.css` (dev / preview shell).

**Behaviour in preview.**

- **One scroll source.** Tier B samples the same appended 160svh span after `p = 1`, and the portal orbit stands down.
- **Nothing new running.** No new listener, observer, timer or RAF.
- **No stand-in imagery.** No plate is requested or substituted; a development diagnostic names the missing plates.

**Not validated.** The orbit's look, the transitions and the timing cannot be
judged until the approved plates exist.

## 37. TP3D PASS 6A.5 — Tier B decisions locked (not deployed)

Recorded in `docs/TANPHONG_ATRIUM_ORBIT_IMPLEMENTATION.md` §0. All apply only
in orbit mode, i.e. while the gated Tier B controller is loaded; production
Scene 3 is unchanged.

- **Arrival** is a visual transition with no editorial UI: no copy, counter, CTA or indicator, and no "ARRIVAL" / "00 / 05".
- **Living** is the first editorial hold; Bedroom, Bathroom and Kitchen use the same model (`0n / 04`).
- **ENTER THE WORLD** is hidden throughout orbit mode, so it never competes with the room indicator in the bottom-right zone. The only exploration CTA is EXPLORE THIS ROOM →.
- **Plates** are WebP only at runtime (AVIF is not advertised); the PNG / TIFF masters are never served.
- **Progress.** `baseStoryProgress` and `roomOrbitProgress` are separate 0 → 1 domains. The 160svh orbit span and every hold and move weight remain provisional.

## 38. TP3D PASS 6A.75 — Tier B interaction harness (not deployed)

Owner decisions are recorded in `docs/TANPHONG_ATRIUM_ORBIT_IMPLEMENTATION.md` §0 and §15. In orbit mode only:

- Arrival also hides the four room labels.
- The existing `WorldGatewayLink` (one link, `/world`) returns in the later part of the Kitchen hold, eased by `roomOrbitProgress` and written only by the story timeline. This replaces the 6A.5 rule that kept it hidden throughout orbit mode.

The asset spec now states WebP only for the runtime. The Atrium photograph stays a static backdrop, and the final visual orbit waits for the approved plates and `world-atrium-cameras.json`.

## 39. TP3D PASS 6A.9 — studio handoff and delivery intake (not deployed)

Documentation and tooling only; no runtime code in the production bundle changed.

- `docs/TANPHONG_ATRIUM_STUDIO_HANDOFF.md` is the brief for the external studio; `docs/TANPHONG_ATRIUM_DELIVERY_CHECKLIST.md` is our review checklist.
- Deliveries land in `work/atrium-orbit/studio/{phase-1,phase-2,final}/` (git-ignored). `yarn check:atrium-orbit-assets` validates them manually and reports NOT READY while none exists.
- PASS 6B.1 (real camera calibration) may begin once the Phase 1 package is complete and validates with no blocking errors (`docs/TANPHONG_ATRIUM_ORBIT_IMPLEMENTATION.md` §17).

## 40. STEP 1 — smooth foundation (2026-10-08, not deployed)

The owner's review: the animation and the 2.5D transitions are not smooth and
do not read as one connected move. This step changes how the journey is
_played_, not what it shows. No scene, curve, timing or asset changed.

**1. The scroll follow.** `MOTION.follow` in `home-motion.ts`, `followScroll()`.

- The stage used to sample `window.scrollY` raw. Scroll input arrives in steps (a wheel notch is 100px in one frame on macOS; frames are uneven), and every layer repeated every step.
- The stage now shows a position that trails the native one by a time constant (150ms with a pointer, 70ms on touch) and comes to rest exactly on it. It is first-order: it stores no velocity, so it cannot overshoot or oscillate.
- Native scroll is not intercepted, delayed or corrected. The page and the sticky stage move natively. There is still one scroll listener, one RAF, no dependency.
- **Every layer samples the one displayed progress**, text and controls included, so they trail and rest together. This replaces the PASS 4 rule that text and interaction sample raw progress, and `scrub: 0`.
- Raw (no trailing) on first paint, history restore (`pageshow`, `data-home-restoring`), the intro's hold, a tab that was hidden, and reduced motion.
- The follow is never further behind than the room left before the stage starts to leave, so the journey is complete when the stage moves. Scrolling below the stage asks for no frames.
- A stalled frame advances as one 34ms frame (slower, never a jump). The tail closes at a steady 90 px/s instead of fading for ever; rest comes 0.5–0.9s after the hand stops.
- A plate that decodes late used to cut the held bridge ahead to the hand in one frame. It now resumes from the hold and eases there.
- Loading follows the hand, not the picture: the Atrium request starts when the native position passes `scenePreload`.

**2. Pacing.** `home-story.css`.

- With motion the base journey is read over 640/560/480svh (scroll reach 540/460/380svh, from 260/220/180svh): about twice the distance, the same pace on every breakpoint.
- Every phase keeps its share of the journey. `check:atrium-orbit` proves that at equal progress the paced story writes exactly what the PASS 15 distance writes.
- Reduced motion keeps 360/320/280svh: its cuts gain nothing from a longer page.
- The lazy atmosphere and the Atrium plate keep their progress thresholds, so they now have twice the distance to load. Measured on a cold first scroll: the atmosphere is ready at p = 0.15 (was 0.22).

**3. The camera is flat on the whole journey.** PASS 6B.1 wrote the camera's pose in 2D through the bridge; the portal orbit's breath kept a 3D pose with `will-change`. Measured over the orbit at 1680×887: the picture's fine detail stepped 12–15% each time that promotion began or ended. The breath is now flat too and the largest step between like frames is 3.5%.

**Measured** (headless Chromium with GPU, per animation frame, px of scroll):

| Input                          | Largest step shown, before → after | Unevenness, before → after |
| ------------------------------ | ---------------------------------- | -------------------------- |
| Notched wheel, 100px per notch | 100 → 18                           | 22.9 → 1.9                 |
| Even drag, 14px per event      | 14 → 7                             | 10.7 → 0.7                 |
| Flick                          | 90 → 23–29                         | 15.7 → 1.2                 |
| Phone drag (touch)             | 14 → 8                             | 8.4 → 1.5                  |

Unevenness is the mean change of the per-frame step from one frame to the
next (0 is perfectly even). One px of scroll is also half the progress it was.

**Not judged.** These are measurements of evenness, not of how it feels in the
hand on the owner's machine; the trail (150ms) and the distance (640svh) are
the two values to tune after review.

**Not done in this step.**

- One virtual camera for the whole journey and real depth layers (STEP 2).
- The cloth still dips to nothing and returns at p ≈ 0.30 instead of travelling.
- The lazy atmosphere chunk still evaluates during the first scroll: one 76ms task at p ≈ 0.12 on a 4× slower CPU (none at full speed).
- In the Tier B preview, the Arrival comp plate can pick a different file than the approved backdrop on phones and tablets.
