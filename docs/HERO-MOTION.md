# Tân Phong — editorial motion opening

The first Homepage Hero has been replaced with an ivory editorial motion stage. The existing fonts, palette, brand navigation and two local project photographs are reused. Everything from **THE ART OF FEELING AT HOME** onward is preserved; production HTML below the Hero was compared against the preceding revision and is identical.

## Five-scene master timeline

Desktop uses a 17-second loop, tablet 15 seconds, and mobile 13 seconds. The following times describe desktop; other sizes use the same normalized clock with different geometry.

| Time   | Composition           | Transformation                                                                                                                                                                                   |
| ------ | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0–3s   | Identity / object     | Oversized serif SPACES, staggered SHAPED and italic for living.; a small crop window and walnut sample on ivory.                                                                                 |
| 3–6s   | Architectural opening | The crop window becomes an angled quadrilateral and expands beyond the viewport. Text passes both behind and in front of the image. Mobile retains a rectangular expansion.                      |
| 6–9s   | The Walnut Residence  | Full-room photography with a new project title and location composition. A broad material plane rises into the lower part of the frame.                                                          |
| 9–13s  | Material to space     | The plane contracts into a square, rotates on desktop, and opens into a circular image aperture. The second interior expands to fill the stage.                                                  |
| 13–17s | Quiet House / return  | The room settles to the right of oversized Quiet / space. typography. A walnut band expands into a full material surface, conceals the scene reset, then contracts back into the opening sample. |

The material square uses an aspect-aware size and a computed full-cover scale. Each image track interpolates compatible mask primitives throughout; the walnut mask stays completely closed between its appearances. Every track's first and last values match. Easing is `cubic-bezier(0.76, 0, 0.24, 1)`, without spring or bounce.

## Structure and content

- `components/sections/home-hero.tsx` composes the motion shell and server-rendered stage.
- `components/hero/hero-scenes.ts` derives project titles, location, year and photography from the existing project data, alongside Hero-specific editorial copy.
- `components/hero/hero-stage.tsx` renders the image apertures, typography and two material surfaces.
- `components/hero/hero-motion.tsx` owns the client boundary, stable Explore Spaces link, scroll link and accessible pause/resume control.
- `components/hero/hero-motion-timeline.ts` defines the five-scene choreography and responsive variants.
- `components/hero/hero-motion-controller.ts` coordinates loading, visibility, native Web Animations API tracks and cleanup.
- `components/hero/hero-motion.css` scopes composition styles to the Hero. The header reads an animated color property only while it has its existing `over-hero` class; its scrolled state remains unchanged.
- `scripts/check-hero-motion.mjs` covers geometry and controller lifecycle with deterministic browser/animation doubles.

No animation library was added. No shared header markup, global stylesheet, image asset, data relationship, section below the Hero or deployment configuration was modified.

## Loading, interaction and lifecycle

Scene 01 is the server-rendered and no-JavaScript fallback. Its heading, photograph, navigation and Explore Spaces link are usable before hydration. There is one semantic h1; changing display typography does not generate live announcements.

The first photograph retains priority loading and responsive WebP sources. After hydration and primary-image decode, the controller assigns the second image's responsive source. Both images must be usable before the master timeline starts. A failed secondary request keeps the editorial opening static instead of revealing a missing image. Only two image nodes are used; no cloned full-resolution photography, GLB preload or WebGL work is introduced.

IntersectionObserver plays the shared clock when visible, slows it to one-quarter speed below 25% visibility, and pauses all effects at zero visible area. Scrolling back resumes the same effects and phase. Hidden tabs and `pagehide` pause; `pageshow` refreshes visibility before resuming. The manual pause remains in force across scroll and tab changes.

Resize rebuilds compatible geometry at the saved normalized phase. A visible manual pause preserves the displayed frame when resizing; an offscreen resize does not start work. Reduced motion cancels the master timeline and restores the static ivory opening. Unmount disconnects observers, removes image/media/page listeners and cancels every owned effect, including the header color property. Late image decoding cannot restart an unmounted Hero.

The Hero occupies 100svh in normal document flow. CTA and navigation remain outside the transforming surfaces. There is no scroll pin, wheel interception, timer-driven scene switch, perpetual JavaScript frame callback, carousel, video, canvas or Three.js.

## Validation for this revision

Completed:

- `yarn build:vercel`: production build passed. The existing framework warning about the default global error module's dynamic import remains non-blocking.
- `yarn exec tsc --noEmit`, `yarn lint`, `git diff --check`: passed.
- `node scripts/check-hero-motion.mjs`: passed for 375×812, 390×844, 768×1024, 1024×768, 1440×900 and 1920×1080 timeline geometry, compatible masks, loop boundaries, two-image loading gate, image failure, scroll pause/resume, manual pause, hidden-tab/BFCache races, resize, reduced motion and cleanup.
- Production HTTP checks: 39 content routes, 46 image paths and 7 invalid-route responses passed.
- SSR checks: new static scene, two image nodes, one semantic h1, deferred secondary source, priority primary source, navigation/CTA and absence of the old Hero content layout passed.
- All rendered content between Introduction and the end of the main element is byte-for-byte identical to the preceding Hero revision.
- Hero-specific client JavaScript and CSS total approximately 5 KB with gzip, excluding reused React/runtime chunks.

Still pending in a real browser: screenshots at all six viewports, observed choreography/compositor behavior, measured text/mask clipping and overflow, CTA/menu interaction, orientation changes, actual reduced-motion rendering, and console/hydration warnings. The available browser tool fails to initialize (`CUA_REPL_ENABLED_SURFACES is required`). Permission to use an isolated Playwright headless runner was requested; deterministic checks are not presented as browser QA.

The current request's attachment directory contains the written brief, not a recording. The implementation follows its explicit five-scene motion specification; visual equivalence to the referenced recording has not been verified.
