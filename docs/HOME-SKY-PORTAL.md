# Story → Worlds: Sky Portal

Implemented locally, 2026-09-29. Production build passed. No deployment performed.

## Architecture and scope

The approved Story and circular-atrium compositions remain. `SkyPortalTrack`
overlaps their native sticky surfaces for 80svh on desktop/tablet and 70svh on
mobile. It replaces the stacked image boundary with an elliptical opening into
the **existing atrium photograph**, including its sky, branches and architectural
ring. There is no white circle, glow, architectural wall matching or full-scene
crossfade. No new art asset or dependency was added.

The original Discovery → Story distance stays 110svh desktop / 90svh mobile.
An explicit, non-rendering measurement marker preserves that distance while the
Story sticky owner extends through the portal. The original reading composition
is therefore unchanged at transition 0%. After the 70–80svh transition, a 24svh
settling interval lets the cloth dissolve before normal scrolling releases Worlds
to the existing Footer. This is approximately 20svh more total Home height than
the preceding implementation on standard viewports, not another 300vh scene.

## Scroll choreography

| Portal progress | Visible state                                                                                                                           |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| 0–30%           | Story architecture, copy and TP stay readable and stable.                                                                               |
| 20–28%          | The small aperture opens around the actual oculus; roughly 9vw wide at 25% desktop.                                                     |
| 35–60%          | Story copy fades and moves upward by at most 15px. TP fades, shrinks 8% and moves down 32px over 34–62%.                                |
| 50%             | A large sky ellipse, branches and circular rim dominate the centre. The same Breeze converges into it; Worlds UI is still absent.       |
| 50–88%          | The ellipse expands to cover the viewport. The translated photographic crop is bounded to prevent any exposed horizontal backing strip. |
| 58–100%         | The oculus crop returns to the complete, approved atrium frame; its image transform ends exactly at scale 1 / translation 0.            |
| 75–98%          | Room names appear first, then eyebrow, title, body, CTA and baseline, with small stagger and 6–12px maximum movement.                   |

The aperture-only crop reaches 1.85× desktop / 1.335× mobile before handing off
to the restrained full-frame pull-back. It uses the full atrium source, not an
enlarged thumbnail. The original photograph is 1672px wide: very wide 2560px
displays necessarily upscale that existing source. Portrait `sizes` now account
for the image's covered width, preventing an undersized 720px source from being
stretched across a tall mobile scene. No unnecessary 4K asset is requested.

Exposure overlays are held back while the portal shows daylight, then return
to the approved Worlds exposure by 94%. Header text switches from charcoal to
ivory at 68%, when the expanding image covers the header area, using its existing
350ms colour transition. There is still one header.

## One Breeze, with a deliberate destination

`ContinuousBreeze` still contains one `cb-cloth` definition and its two depth
projections. The existing connected spline moves through three coordinated key
states: Story, aperture convergence, and the atrium oculus route. No separate
Story/Portal/Worlds ribbon is mounted.

The Worlds route begins at the upper-centre skylight, bends around the opening,
passes behind a feathered canopy occlusion, then reappears toward the lower-right
floor near the CTA. Width tapers to 1% at the endpoints. The final settling range
stretches the cloth horizontally by up to 12%, flattens it by 18%, translates it
slightly toward reflected light, and fades it to zero before the pinned Worlds
frame releases. It does not continue across the Footer.

On mobile the same system uses a thinner, simpler diagonal route. The back
projection becomes fully transparent after 65%, leaving one visible cloth layer.
Geometry is not rebuilt in the unchanged first quarter of the transition. All
states are sampled from native scroll position and reverse without timers.

## Accessibility, reduced motion and lifecycle

- The portal has no separate semantic content; its photographic layer is
  decorative. Text stays HTML and all catalogue links remain real links.
- Clipped Worlds links stay inert until their UI begins to appear. Focused links
  are never made inert. The header remains outside the masked scene.
- Reduced motion uses normal document flow and a static elliptical skylight
  preview. It removes the pinned tunnel and image zoom, keeps all story text and
  Worlds links visible, and leaves the Breeze static/subtle.
- One scroll-scheduled controller drives mask, scene departure, header, UI and
  the existing Breeze. Bounds are read on resize/mount rather than on each scroll.
  Scroll/resize/pageshow/focus/media/image listeners, RAF and ResizeObserver have
  explicit cleanup. No wheel interception, scroll snap, autoplay or idle RAF.
- The old `--sh-exit` controller and departure gradient were removed. Opacity
  applies to content nodes rather than a full-screen opacity filter.

## Verification and observations

Production build, TypeScript, lint and `git diff --check` passed. `check:home`,
`check:hero`, `check:intro` and `check:content` passed. New checks cover finite mask
geometry, photographic edge coverage, late UI/focus gating, unchanged Opening
timing, connected/reversible cloth, cached bounds, hidden-tab inactivity, reduced
motion and 30 mount/cleanup cycles. The production route check passed 44 pages,
73 image references and eight expected 404s.

Real Chrome layout checks used same-origin test iframes with the following inner
viewport sizes (the QA wrapper is excluded from production): 375×812, 390×844,
430×932, 768×1024, 820×1180, 1024×768, 1280×800, 1366×768, 1440×900,
1728×1117, 1920×1080 and 2560×1440. At 50%, 100% and the settling endpoint:

- No horizontal overflow; Worlds/Footer gap remains exactly 0px.
- Room links and CTA remain within the viewport, with hit height ≥44px.
- No Canvas elements; no Three.js, WebGL, video or model import was introduced.
- Worlds UI is absent over the small aperture and complete at 100%.
- At the sampled settling point, mobile front-cloth opacity is below 0.008;
  desktop/tablet opacity is zero. It reaches zero on mobile before release too.

Desktop 0/25/50/75/100% screenshots were saved and visually reviewed. Mobile
midpoint, complete atrium and settled screenshots were also captured. Native
wheel scrolling reversed the transition from 100% to approximately 60%; reverse
samples restored the same masks and content states through 0%. Reduced-motion
branches were exercised through the local QA proxy's media emulation: no clipping,
no pinned scene, all reveal nodes at opacity 1. OS/browser preferences were not
changed.

On the final production page without QA controls, the sampled console error/warn
log was empty, including after CTA navigation and return Home. Home returned to
scroll 0 / portal progress 0. No hydration warning was observed.

One final **1440×900** visible iframe sample recorded **132 RAF intervals over
2600ms**, median **16.7ms**, p95 **33.5ms**, with **12 intervals above 33ms**. It used
native programmatic scrolling and includes browser/QA overhead; it is not isolated
application render time or a device-independent 60fps guarantee. This sample
includes missed refreshes; a stable 60fps result is not claimed. No RAM/VRAM
figures are claimed. `will-change` is limited to the image during the active
transition; there are no animated blur, shadow or WebGL surfaces.

## Files

Added: `sky-portal-track.tsx`, `sky-portal-frame.ts`, `sky-portal.css` in
`components/home/experience/`.

Updated: `app/page.tsx`; the experience controller, Breeze geometry/renderer/SVG,
Worlds reveal-order attributes and responsive image sizing; the Opening range
marker/timeline and obsolete exit CSS; three Home/Opening verification scripts.
Loader, catalogue routes/data, architecture assets and shared header/footer
components are unchanged.

Local evidence lives in ignored `work/sky-portal/`: `responsive.json`,
`reverse.json`, `reduced.json`, `final-cadence.json`, `production-console.json`,
`routes.log`, `final-desktop-{0,25,50,75,100}.png`, and
`final-mobile-{50,100,settled}.png`. QA controls/proxy are not production code.
