# Story → Worlds: continuous camera bridge

Implemented locally on 2026-09-29. Replaces the floating elliptical transition.

## Architecture

`HomeExperience → StoryWorldBridge → StoryWorldStickyStage` contains the existing
live Hero/Story nodes, **one** full-size atrium image, Worlds HTML and one
`ContinuousBreeze` definition. The small approved CTA thumbnail is retained.
`sky-portal-track.tsx`, `sky-portal-frame.ts`, `sky-portal.css`, the old
`chapter-motion.ts`, aperture image and document-space cloth departure are removed.
The discovery navigation cards are unrelated and remain unchanged.

The native sticky stage is **100svh**. Story → Worlds owns **250svh desktop**,
**230svh tablet**, **210svh mobile**. Its scroll distance is that height minus
one viewport. The existing Discovery approach (110svh desktop/tablet, 90svh mobile)
feeds the same stage before bridge progress zero, avoiding duplicate Story nodes
or a visible handoff. Footer is outside this owner and stays in normal flow.

The project has no GSAP or Lenis. `createStoryWorldTimeline` is a scoped native
scroll controller, with one scheduled RAF per input burst, cached geometry,
synchronous restoration and complete cleanup. It adds no wheel interception,
scroll snap, forced scroll position, pointer camera or animation dependency.

## Choreography

| Progress | Result                                                                                                                                                      |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0–18%    | Approved Story reading composition held.                                                                                                                    |
| 18–36%   | Architecture pushes 1 → 1.055, text recedes 10px / opacity .65, TP shrinks to .94 and moves down 16px.                                                      |
| 28–60%   | One cloth approaches, billows across the lens and recedes. A soft full-frame diagonal reveal follows underneath it over 42.5–53%.                           |
| 53–60%   | Actual atrium sky dominates the viewport; no Worlds UI.                                                                                                     |
| 58–82%   | Same atrium image pulls back from sky to oculus, ceiling, tree and floor; lands at exact scale 1 / translation 0.                                           |
| 72–91.5% | Rooms, eyebrow, Enter, the worlds., body, signoff and CTA appear at 72/76/79/81/83/86/88%, each over 3.5% progress.                                         |
| 74–92%   | Cloth follows a restrained S through the skylight, behind the skylight rim, around a feathered canopy mask, toward the lower-right reflection near the CTA. |
| 90–98.5% | Tail stretches 12% horizontally, narrows vertically and dissolves before the stage releases.                                                                |
| 100%     | Sticky releases directly into Footer, without additional filler or a ribbon restart.                                                                        |

The oculus occupies only about 20% of the existing 1672×941 plate height. A
1.25× zoom cannot yield full-frame sky. The brief sky crop therefore uses a
bounded 4.8–5× transform on that **same image**, resolving first into a restrained
1.24× camera pose (1.18 tablet landscape / 1.12 portrait / 1.08 mobile) and then
scale 1. No substitute sky or duplicate plate is used. The source resolution
limits sharpness during the close-up. Portrait framing resolves the crop earlier.

Header remains one clickable element, changing only colour at 64%. Temporary
photographic top shading maintains contrast and disappears in the final design.
Cloth and imagery have no pointer events. Worlds links are individually inert
until their own reveal; departed Story is inert. Reverse scroll samples exactly
the same functions, including all accessibility states.

On mobile only the front cloth projection paints; there is no canopy mask,
pointer parallax or SVG filter. Short screens use smaller existing type sizes to
keep all links within the stage. Reduced motion removes sticky camera/veil
entirely, exposes all content in normal flow and uses the actual sky at the top
of the atrium image. No additional sky image is mounted.

Reload and browser history preserve native scroll. A short pre-paint restoration
gate prevents the default opening frame flashing before restored geometry is
sampled. The existing intro still runs on a fresh navigation or `?intro=1`.

## Verification

- Lint, TypeScript, Vercel production build, Home/cloth, Hero and Intro checks.
- Controller checks cover viewport image coverage, late focus activation, native
  reverse sampling, bfcache, reduced motion, cached bounds, hidden-tab inactivity
  and 30 mount/cleanup cycles.
- Chrome production screenshots at 0/15/30/45/55/65/75/85/100%.
- Responsive Chrome viewports: 320×568, 375×812, 390×844, 430×932, 768×1024,
  820×1180, 1024×768, 1440×900, 1728×1117, 1920×1080, 2560×1440. No horizontal
  overflow, all final room/CTA links within the viewport with ≥44px hit height,
  exactly 0px gap between Home and Footer, one backdrop image and one header.
- Chrome reload at scrollY 1867.5 preserved bridge progress .65. Native CTA click
  to Worlds and Back restored scrollY 2340 / progress 1 after router restoration.
- Reduced-motion local proxy tested normal flow, no Breeze and all UI opacity 1
  with inert false, without changing the user's OS preferences.
- No console/hydration errors observed on the tested production route.

Local evidence is in ignored `work/story-world-bridge/` (screenshots, per-viewport
JSON, reverse/restoration and performance observations). The QA proxy and controls
are excluded from the production bundle. Performance observations are appended
below; DOM/heap samples are not process RAM or VRAM measurements.

## Performance observations

A real Chrome Performance recording with Screenshots + Memory enabled was saved
as `work/story-world-bridge/chrome-performance.json.gz`. The trace includes 20
forward/reverse cycles on the production preview and the local QA controls.
Renderer counters: JS heap 34,571,552–36,791,620 bytes, one document, nodes
1,086–1,087 ending at 1,086; listener count declined from 1,176 to 1,159. This
supports no accumulating DOM/listener growth in the sampled run; it is not a
measurement of total Chrome process RAM. The trace includes installed extensions.

Raw main-thread trace events: 4,247 Paint events, maximum 2.90ms; 825 Layout
events, maximum 42.50ms; one RunTask above 50ms, maximum 210.24ms. The QA harness
itself reads geometry to drive scroll and audits computed styles between cycles,
so these events cannot all be attributed to application animation. Browser
observations do not establish a universal 60fps guarantee or physical-trackpad
performance on other devices. Native small/large wheel scroll and reverse scroll
were also exercised separately.

The unprofiled production run recorded 819 RAF intervals in 14,979ms, median
16.7ms / p95 33.3ms, 52 intervals over 33ms and five observed long tasks of
51–93ms. DOM remained 519 elements before/after, with one backdrop, one header,
one cloth definition and two depth projections. These cadence values include QA
and browser overhead. Development-run numbers differ and are not substituted
for the production observation.

Canvas elements and WebGL context requests were both zero. The trace contains
compositor layer updates/activation; temporary will-change declarations are absent
at the final hold. Chrome did not expose GPU memory counters in this trace, so no
VRAM number is claimed. The large image sky crop still incurs raster/compositor
cost and is limited by the existing image's resolution.

The saved DevTools trace precedes the final cloth-only rim occlusion mask refinement; the camera transform, reveal timing and image count are unchanged. Final lint, TypeScript, controller checks and production build passed after that refinement.
