# Homepage Hero: continuous architectural motion

Only the first Homepage Hero changes. The original photograph, priority srcset, crop, text, typography, CTA, metadata, header and normal document flow remain. No section below the Hero, global stylesheet, data relationship, image asset, dependency or deployment configuration is modified.

## Timeline

Every track has the same duration and identical first/last visual values:

| Phase | Portion of loop | Composition                                                                                                                |
| ----- | --------------- | -------------------------------------------------------------------------------------------------------------------------- |
| A     | 0–20%           | Full interior; photograph gently scales from 1 to 1.02.                                                                    |
| B     | 14–32%          | Two broad walnut/ivory partitions enter from opposite sides.                                                               |
| C     | 27–61%          | The existing image closes into an aspect-aware central square, rests briefly, then opens to full frame with a closer crop. |
| D     | 64–80%          | Material planes cross into the composition; desktop adds a low charcoal plane.                                             |
| E     | 80–100%         | Planes retreat, the photograph returns to its exact original crop, and the loop continues.                                 |

Desktop (1024px and above) runs a 13-second cycle with one image and three planes. Tablet (761–1023px) runs 11 seconds with two planes. Mobile (760px and below) runs 10 seconds with two narrower planes, a larger central opening and less photo scaling. No variant uses rotation. The cinematic easing is `cubic-bezier(0.76, 0, 0.24, 1)`.

One image DOM node supplies every crop and mask. Only transform, clip-path and opacity animate. The existing solid dark shade stays above all material planes, increasing before ivory enters to protect text contrast. Header, copy, metadata and CTA never receive animation or pointer interception.

## Playback and first paint

- SSR and the no-JavaScript state render the original static Hero immediately. There is no pre-paint script, intro overlay, session marker or delayed text reveal.
- `HeroMotion` mounts the controller after hydration. Motion starts only after the priority image is usable and IntersectionObserver reports positive visibility.
- At least 25% visible: normal playback. Less than 25% visible: all tracks run at one-quarter speed. Zero visible area: every owned animation is paused.
- Scrolling back resumes the same Animation objects and current times. No wheel, touch, focus or scroll handler blocks normal navigation.
- Hidden tabs and `pagehide` pause playback. `pageshow` waits for a fresh visibility observation before resuming a cached page.
- Resizing preserves normalized loop progress when rebuilding the square aperture and responsive variant, including when the Hero was paused offscreen.
- Reduced motion immediately restores the original full-frame static Hero and cancels all effects. Disabling that preference resumes the saved phase when visible.
- Unmount cancels effects, disconnects observers and removes listeners. A late image decode cannot restart a disposed controller. Unsupported APIs keep the static fallback.

There is no animation library, duplicated full-resolution image, video, canvas, Three.js, GLB preload, WebGL renderer, infinite JavaScript frame loop, fixed stage or scroll pinning.

## Validation

Completed for this revision:

- `yarn build:vercel`: production build passed. The existing Vinext default-global-error dynamic-import warning remains in framework code.
- `yarn lint`, `yarn exec tsc --noEmit`, `git diff --check`: passed.
- `node scripts/check-hero-motion.mjs`: passed. It exercises the real timeline/controller with deterministic DOM and WAAPI doubles, including six viewport geometries (375, 390, 768, 1024, 1440, 1920px), square aperture ratios, loop boundaries, slow/pause/resume, hidden-tab/BFCache races, offscreen resize, reduced motion, image failure, API fallback and cleanup.
- Production HTTP regression: 39 routes, 46 image paths and 7 invalid-route checks passed.
- Production SSR: static state, one priority Hero image, one page heading, stable content/links, scoped motion CSS and no old intro/bootstrap verified.
- Hero-specific client assets: approximately 2.3 KB gzipped combined JavaScript and CSS, excluding the existing React/runtime chunks.

Not yet verified in a real browser: visual choreography, compositor synchronization, scroll/menu/CTA interaction, measured layout shift/overflow at all six viewport widths, and console/hydration warnings. The browser tool cannot initialize in this session (`CUA_REPL_ENABLED_SURFACES is required`). Deterministic controller checks are not represented as browser tests.

The reference website returned HTTP 403, and the supplied attachment directory contains the written brief only. The choreography follows the detailed A–E motion specification; it is not represented as a visually observed reference sequence.

## Files

- `components/sections/home-hero.tsx`: original content inside `HeroMotion`.
- `components/hero/hero-motion.tsx`: client shell and decorative surfaces.
- `components/hero/hero-motion-controller.ts`: visibility, image readiness, playback and cleanup.
- `components/hero/hero-motion-timeline.ts`: responsive timelines and playback policy.
- `components/hero/hero-motion.css`: isolated visual layers and static/reduced-motion fallback.
- `scripts/check-hero-motion.mjs`: lifecycle and geometry regression checks.
- `docs/HERO-MOTION.md`: implementation and QA record.

The former `hero-intro.tsx` and `hero-motion-policy.ts` are removed; the one-shot/session behavior is no longer used.
