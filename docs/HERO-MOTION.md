# Homepage hero motion

The existing hero photo, crop, text, header, CTA, metadata, typography and settled geometry are retained. No section below the hero, global stylesheet, dependency, image or header markup was changed.

## Choreography

- Desktop: 3.6 seconds. The existing wordmark fades in over ivory, three broad material planes intersect, and a central architectural opening expands to expose the original photograph. Navigation precedes the eyebrow, heading, description, CTA and staggered metadata.
- Tablet (761–1100px): 3.2 seconds, two planes.
- Mobile (up to 760px): 2.8 seconds, two planes, no rotation. Existing `svh` sizing and crop remain in force.
- Return visit: 550ms opacity reveal. A small pre-paint script reads the session marker before CSS presents the opening; React adopts that mode. Storage is optional, with an in-memory fallback for client navigation.
- Reduced motion: image and content fade for 180ms, no panels, mask, translation or ambient scale. Preference changes during playback settle the hero.
- Ambient motion: one finite 12-second image breath, peaking at scale 1.018 and returning to the original crop. Scroll, interaction, reduced motion, page hide or tab visibility change cancel it.

CSS keyframes animate transforms, opacity and one synchronized rectangular clip on the existing photograph and its existing shade. React only coordinates session policy, interruptions and cleanup. There is no new animation library, slideshow, duplicate hero photo, video, canvas, WebGL, Three.js, perpetual frame loop or scroll lock.

## Lifecycle

The opening settles before an interaction proceeds, including keyboard focus, pointer input and scrolling. The same photo DOM node stays in place. A bounded timer supplements the animation-end signal using the pre-paint start time, so delayed hydration does not extend the intended sequence. First entry below the hero or through a hash skips it. The no-JavaScript fallback presents the original settled hero immediately.

To replay during development, clear the `tan-phong:hero-seen:v1` session-storage key and reload. This is only a testing action; no replay control is added to the website.

## Validation

- `yarn build:vercel`: passed on the existing deployment configuration.
- `yarn lint`, `yarn exec tsc --noEmit`, `git diff --check`: passed.
- `node scripts/check-hero-motion.mjs`: passed fresh/return session, reduced-motion, restored-scroll, hash, hidden-tab and unavailable-storage decisions. The actual pre-paint script and React policy agree.
- Production HTTP check: one hero image, one page h1, pre-paint bootstrap before the image, dedicated motion CSS in the server-rendered stylesheet links, and the no-JS fallback present.
- Existing route regression: 39 routes, 46 image paths and 7 invalid-route checks passed.
- The motion-specific production JS and CSS are approximately 2.8 KB combined with gzip, excluding reused React/runtime code and transport overhead.
- Visual/motion testing at 375, 390, 768, 1024, 1440 and 1920px, actual paint/layout-shift measurements, and browser interaction/console checks remain pending. The available Chrome control tool fails to initialize (`CUA_REPL_ENABLED_SURFACES is required`); permission to use an isolated Playwright headless runner was requested. No browser QA is claimed for this change yet.
- The reference URL could not be visually inspected in this environment. Choreography follows the explicit stage description supplied with the request; it is not represented as an observed or copied reference sequence.

## Files

- `components/sections/home-hero.tsx`: retain content inside the motion shell.
- `components/hero/hero-intro.tsx`: decorative planes, session adoption, interruptions and cleanup.
- `components/hero/hero-motion.css`: scoped choreography and responsive/reduced-motion variants.
- `components/hero/hero-motion-policy.ts`: shared policy and static pre-paint bootstrap.
- `scripts/check-hero-motion.mjs`: lifecycle-policy regression checks.
- `docs/HERO-MOTION.md`: implementation and validation record.
