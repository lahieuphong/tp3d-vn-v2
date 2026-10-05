# TP3D Design System

The source of truth for every TP3D redesign pass, starting with TP3D PASS 00
(2026-10-03). If a later brief conflicts with this document, flag the conflict
before you implement anything. Update this document in the same pass that
changes a rule.

- Point-in-time audit, homepage map and blockers: [TP3D-PASS-00-AUDIT.md](TP3D-PASS-00-AUDIT.md)
- Arrival / first impression record: [TP3D-PASS-01-ARRIVAL.md](TP3D-PASS-01-ARRIVAL.md)
- Arrival → Perspective handoff record: [TP3D-PASS-02-SPATIAL-HANDOFF.md](TP3D-PASS-02-SPATIAL-HANDOFF.md)
- Perspective → Atmosphere record: [TP3D-PASS-03-PERSPECTIVE-ATMOSPHERE.md](TP3D-PASS-03-PERSPECTIVE-ATMOSPHERE.md)
- Atmosphere → Worlds / Atrium record: [TP3D-PASS-04-ATMOSPHERE-WORLDS.md](TP3D-PASS-04-ATMOSPHERE-WORLDS.md)
- Enter the World gateway and Lobby record: [TP3D-PASS-05-WORLD-GATEWAY.md](TP3D-PASS-05-WORLD-GATEWAY.md)
- Room 01 / Gallery record: [TP3D-PASS-06-GALLERY.md](TP3D-PASS-06-GALLERY.md)
- Gallery exhibit → live 3D record: [TP3D-PASS-07-EXHIBIT-EXPERIENCE.md](TP3D-PASS-07-EXHIBIT-EXPERIENCE.md)
- Gallery detail World-shell record: [TP3D-PASS-08-WORLD-SHELL.md](TP3D-PASS-08-WORLD-SHELL.md)
- World navigation and viewing-chamber UX record: [TP3D-PASS-09-WORLD-UX.md](TP3D-PASS-09-WORLD-UX.md)
- Room 02 / Objects record: [TP3D-PASS-10-OBJECTS.md](TP3D-PASS-10-OBJECTS.md)
- Object study World-shell record: [TP3D-PASS-11-OBJECT-STUDY-SHELL.md](TP3D-PASS-11-OBJECT-STUDY-SHELL.md)
- Product navigation and prefetch record: [TP3D-PASS-12-PRODUCT-NAVIGATION.md](TP3D-PASS-12-PRODUCT-NAVIGATION.md)
- Room 03 / Archive record: [TP3D-PASS-13-ARCHIVE.md](TP3D-PASS-13-ARCHIVE.md)
- Room 04 / Lab record: [TP3D-PASS-14-LAB.md](TP3D-PASS-14-LAB.md)
- Room 05 / Studio record: [TP3D-PASS-15-STUDIO.md](TP3D-PASS-15-STUDIO.md)
- Atrium orbit record: [TP3D-PASS-16-ATRIUM-ORBIT.md](TP3D-PASS-16-ATRIUM-ORBIT.md)
- Homepage timeline internals (progress ranges, WebGL tiers, measured
  baselines): [TANPHONG_HOME_MOTION_CONTEXT.md](TANPHONG_HOME_MOTION_CONTEXT.md)
- Motion tokens: `lib/motion/tokens.ts`, mirrored as `--motion-*` in
  `app/globals.css`, checked by `yarn check:motion`

> **Pass naming.** This series is numbered "TP3D PASS 00, 01, …". Older
> documents and code comments use their own numbers: "PASS 0/1" in
> `TANPHONG_HOME_MOTION_CONTEXT.md`, and "PASS 4/5" in some comments in
> `components/home/experience/*`. Those belong to earlier work. Always write the
> "TP3D" prefix.

Every value below was read from the repository unless it is marked as a
proposal.

---

## 1. Product vision

TP3D (Tân Phong — Interiors & Objects) is not a generic interior-design
website.

| Layer | Meaning | Where it lives today |
| --- | --- | --- |
| Website | Editorial gallery / portfolio | All routes; the homepage story |
| Enter The World | Immersive digital building | Atrium CTA "ENTER THE WORLD" → PORTAL → `/world`, the Lobby (TP3D PASS 05) |
| Rooms | Different spatial experiences | The building directory: five Lobby rooms in `data/world-building.ts` (all five open at their own routes since TP3D PASS 15: 01 Gallery `/world/gallery`, 02 Objects `/world/objects`, 03 Archive `/world/archive`, 04 Lab `/world/lab`, 05 Studio `/world/studio`). The Atrium openings (Living, Bedroom, Bathroom, Kitchen → `/spaces/*`, `/worlds/*`) are featured shortcuts, not the directory. Future `/experience/[slug]` |
| GLB models | Exhibits | Not yet supplied. `/worlds/[slug]` shows Sketchfab scenes after a click (click-to-load) |
| Three.js | Exhibition engine | `/experience/[slug]` registry (empty). The homepage sky bridge is the only current use (§14) |

Emotional progression: **2D → subtle depth → spatial feeling → portal →
immersive world.** A visitor should first think "this is a beautiful
gallery", then "there is depth here", and finally "I can enter this world".

The homepage already follows this arc in one persistent viewport:

1. Arrival: an editorial composition
2. Perspective: a calm story
3. Breeze and sky: the portal
4. Atrium: the threshold of the world, with its four room openings

Brand voice:

- Lowercase wordmark "tân phong" with the tagline "INTERIORS & OBJECTS".
- Bilingual EN/VI on the homepage: "A new breeze *for living.*" / "Một làn gió
  mới cho không gian sống."

## 2. Brand experience principles

**QUIET MOTION + CINEMATIC DEPTH + PRECISE TYPOGRAPHY + ONE OR TWO MEMORABLE
MOMENTS.**

- **Feel:** premium, architectural, calm, editorial, spatial, cinematic.
- **Never feel like:** a gaming site, a WebGL demo, an agency animation
  showcase, a futuristic or crypto site, or an over-animated landing page.
- **The two memorable homepage moments are already fixed:** Arrival (intro and
  Scene 1) and the World Approach (breeze, sky, then the Atrium). Everything
  else supports them and stays quieter.
- **Visual thesis**, inherited from `docs/DESIGN-DIRECTION.md`: "a quietly
  expressive architecture journal". That means cinematic interior photography,
  generous ivory margins, fine rules, warm wood and stone tones, and
  restrained serif typography.
- **No glow, heavy shadows, glass effects or decorative gradients.**
  Photographic exposure gradients that keep text legible over images are
  allowed, for example `.hc-atrium-backdrop::after`.
- **Square corners and 1px rules.**

## 3. Layout principles

**Editorial container**

- `.container` = `calc(100% - var(--gutter) * 2)`, max-width 1440px.
- `--gutter`: 64px, then 36px (≤1100), then 22px (≤760). At ≥1700 it becomes
  `max(64px, (100vw - 1500px) / 2)`.
- `DESIGN-DIRECTION.md` says 1480px. The code is authoritative.

**Gallery hanging**

- Asymmetric pairs: 7fr/4fr intro, 1.7fr/1fr project preview, 1.38fr/1fr
  spaces, 1fr/2fr detail introductions.
- Staggered offsets: the second column drops 100–120px (`.collections-duo`,
  `.all-spaces`, `.all-collections`, `.material-images`).
- Large images. No boxed cards and no carousels.

**Full-bleed photography** is for the homepage stage, page heroes, the
experience banner and the Atrium.

**Homepage stage**

- One `position: sticky` 100svh viewport inside a tall section (360/320/280svh).
- Scenes are absolutely positioned layers in percentage and svh coordinates.
  They are not separate sections.
- Plane order:

  | z-index | Plane |
  | --- | --- |
  | 0 | Architecture |
  | 2 | Cloth (back) |
  | 3 | TP, leaves |
  | 4 | Cloth (front) |
  | 5 | Copy |
  | 6 | Worlds |
  | 7 | WebGL sky |
  | 8 | Cloth (foreground) |
  | 12 | Rail |

- `.spatial-hero` and `.continuous-breeze` must not create stacking contexts.
  Don't put transform, opacity, isolation or containment on them.

**Global layers:** header z 40, skip link z 100, World portal cover z 150,
intro z 200.

**Shape**

- `--radius: 0`.
- Allowed exceptions: arched portals (`50% 50% 0 0`), circular previews, and
  Worlds cards (2px).

**Rules (lines):** 1px `var(--border)` on light grounds. On photographs, use
`currentColor` at 0.5–0.7 opacity.

## 4. Typography

**Families.** All are self-hosted WOFF2 with `font-display: swap`, 6 files,
133 KB in total.

| Role | Family | Token / alias | Files |
| --- | --- | --- | --- |
| Display | Cormorant Garamond (OFL), variable 300–700 | `--font-display` / `--font-heading` | `cormorant.woff2` (normal only) |
| Body, UI, metadata | Manrope (OFL), variable 200–800 | `--font-body` / `--font-sans` | `manrope.woff2` |
| Homepage display | `'Cormorant Spatial'`: normal + **real italic**, Latin + Vietnamese subsets | `--sh-serif`, `--hc-serif` | `cormorant{,-italic}{,-vietnamese}.woff2` |
| Homepage UI | `'Manrope Spatial'`: Latin + Vietnamese | `--sh-sans`, `--hc-sans` | `manrope{,-vietnamese}.woff2` |

The homepage aliases are declared in `components/home/hero/spatial-hero.css`.

**Global scale** (`app/globals.css`)

| Element | Value |
| --- | --- |
| h1 | `clamp(54px, 6.1vw, 94px)` |
| h2 | `clamp(40px, 4.2vw, 64px)` |
| h3 | 32px |
| Headings | weight 400, line-height 1.06, letter-spacing −0.025em |
| Body | Manrope 16px / 1.7, paragraphs max 64ch |
| `.eyebrow` | Manrope 500, 12px, letter-spacing 0.17em, uppercase copy. The override block at the end of `globals.css` restores 12px for editorial metadata; some contexts drop to 10–11px at ≤760 |
| `.wordmark` | Cormorant 39px, −0.045em, lowercase + Manrope 8px tagline at 0.25em |
| `.text-link` | 14px, 1px underline, ↗ arrow, min-height 44px |

**Homepage display scale** (component CSS)

| Element | Value |
| --- | --- |
| Scene 1 h1 | `clamp(42px, 3.75vw, 78px)`, line-height 0.93, −0.045em |
| Scene 2 h2 | `clamp(36px, 3.65vw, 74px)`, 0.91 |
| Scene 2 body | `clamp(15px, 1.19vw, 23px)` / 1.35 |
| Atrium h2 | `clamp(78px, 5.65vw, 145px)`, 0.87, −0.055em |
| Micro-caps (eyebrow, axis, colophon, signatures) | Manrope 500, 6–11px, 0.2–0.32em tracking |

**Rules**

1. **Display weight.** Serif display is always weight 400. Emphasis is an
   italic `<em>` on the second line ("*for living.*", "*of seeing.*", "*the
   worlds.*"). Never use bold display.
2. **Tracking.** Negative tracking tightens with size: −0.025em (body
   headings) down to −0.055em (Atrium).
3. **Metadata.** Manrope 500, uppercase, wide tracking. Outside the homepage
   stage, use 12px, and never go below the existing 10px mobile minimum. The
   6–8px micro-caps on the homepage stage are an
   existing art-direction choice: don't make them smaller, and don't use them
   for essential information.
4. **Vietnamese.** Vietnamese blocks carry `lang="vi"` and use the Spatial
   aliases, which include Vietnamese subsets.
5. **Never animate typography per letter or per word.** The finest grain is a
   line or a block. The Atrium reveals "Enter" and "*the worlds.*" as two
   spans, and that is the limit.
6. **Wrapping.** Use `text-wrap: balance` for headings in contexts that already
   use it, and `pretty` for Atrium body copy.
7. **Known gap (from code, not visually verified).** The global `Cormorant`
   face has no italic file, so `<em>` outside the homepage stage is
   browser-synthesized. Decide in a typography pass. Don't change it silently.

## 5. Color tokens

**Global tokens** (`:root` in `app/globals.css`)

| Token | Value | Use |
| --- | --- | --- |
| `--background` | `#f7f5f0` | Ivory page ground |
| `--foreground` | `#292823` | Ink |
| `--muted-foreground` | `#706c62` | Secondary copy, eyebrows |
| `--border` | `#d9d5cd` | 1px rules |
| `--paper` | `#eeece5` | Alternate section ground |
| `--walnut` | `#79644e` | Focus outline, accents |

**Other global literals**

- `#e4e0d7`: image placeholder
- `#e8e4da`: material section
- `#eae7df`: footer
- `#cfcbc1`: footer rule
- Photo shades: `#171711` at 31%, `#171b16` at 51%, `#151713` at 24%,
  `#171a16` at 58%
- Overlay: `rgb(29 28 24 / 28%)`

**Homepage stone palette** (component literals; there are no tokens yet)

| Role | Value |
| --- | --- |
| Stage / hero ground | `#e8dcc8` / `#e9ddc8` |
| Hero ink | `#3c352a` |
| Header ink → ivory (scroll-mixed) | `#332b22` → `#f3e9d6` |
| Hairlines | `#83735e`, `#7c6e5c`, `#786c5b` |
| Light wash | `#eee4d1` (alpha) |
| Rail | `#574b38` |
| Atrium copy | `#f5edde` |
| Atrium exposure shade | `#24190d`, `#241a14` (alpha gradients) |
| Atrium loading ground | `#352d23` / `#59432c` |
| Intro paper / ink | `#eee9df` / `#423b31` |
| Home footer | `#e9e1d3` |
| WebGL sky (measured from the Atrium oculus) | `#b0c3e0` → `#c2d3e9`, cloud `#eef0f3`, shade `#cdd6e4`, ivory `#eee8dc` |

**Rules**

- Neutral and warm only. Blue appears only as sky.
- No saturated accent, no pure black, no pure white on ivory grounds. `#fff`
  is used only for copy over photographs.
- The World ground is a token: `--world-ground: #1c1712` (warm umber, not
  black). The portal cover and the Lobby's first paint use it, so the crossing
  never flashes (TP3D PASS 05).
- New colors become tokens in `:root`. Promote the homepage literals to tokens
  when a pass touches them (proposed names: `--stone-ground`, `--stone-ink`,
  `--ivory-light`, `--exposure-shade`). Don't mass-rename in a non-visual pass.

## 6. Spacing

- `--section`: 120px, then 96px (≤1100), then 76px (≤760).
- Documented increments, from `DESIGN-DIRECTION.md`: 4, 8, 12, 16, 24, 32, 48,
  64, 80, 120, 160px.
- Common gaps in code: 18, 22–24, 28–36, 48, 64, 80, 96–120px.
- Touch targets ≥44px (`min-height: 44px`; Atrium room links use 48px).
- Header height:
  - Default: 102px; 86px solid; 80px at ≤760.
  - Homepage: `clamp(78px, 9.2svh, 108px)`; 76px below 768.
- Homepage stage positions are percentages and svh of the stage, not spacing
  tokens. Keep them that way, because the compositions are hand-placed against
  the photographs.
- Use `svh` for viewport heights. This is existing practice and avoids mobile
  toolbar jumps.

## 7. Responsive philosophy

**Two breakpoint systems exist today.** Don't add a third.

| System | Breakpoints | Used by |
| --- | --- | --- |
| Editorial layout | 760/761, 1100, 1700 (+ local 900, 600) | `globals.css`, `navigation.css`, `EditorialImage` sizes |
| Homepage + motion | 767/768, 1199/1200 (+ tablet portrait/landscape, `max-height: 820px` desktop, 359, `767 + max-height 740`, short landscape `1199 + max-height 540 + landscape`) | Home CSS, `MOTION.breakpoints`, `lib/motion/capability.ts` |
| Worlds catalogue | 359, 600, 639/640, 820/821, 960, 1023/1024, 1439/1440, 1908 | `worlds.css`, `mosaic-block.tsx` |

Motion code uses `MOTION_BREAKPOINTS` (768/1200). Existing editorial pages
keep 760/1100 until a pass consolidates them.

**Device tiers** come from `motionTier()` in `lib/motion/capability.ts`. They
match the existing atmospheric sky tiers.

| Tier | Condition | Amplitude | Behaviour |
| --- | --- | --- | --- |
| desktop | ≥1200px **and** hover + fine pointer | 1 | Full motion, hover and pointer effects |
| tablet | 768–1199px, **or** any width with a coarse pointer | 0.75 | Reduced amplitude. No dependence on hover: every hover effect must also exist through focus or tap |
| mobile | <768px | 0.5 | Composition-first: scroll reveals, scale, light, subtle parallax. No mouse-derived motion, one cloth projection, light WebGL tier |
| reduced | `prefers-reduced-motion: reduce` | 0 | §13 |

Homepage specifics:

- Story height is 360/320/280svh.
- Short story copy on mobile and tablet portrait.
- Room labels sit on architectural coordinates only at ≥1200. Below that they
  form a 2×2 grid.
- Mobile Atrium uses a stacked layout. Short landscape screens (below 1200px,
  at most 540px tall) use the grouped tablet composition sized by `svh`, so
  the title clears the fixed header (TP3D PASS 04).

## 8. Motion language

Every motion belongs to exactly one of these six concepts. Anything else does
not ship.

| Concept | Meaning | Existing examples | Allowed techniques | Defaults |
| --- | --- | --- | --- | --- |
| **REVEAL** | Architectural masks, clipping, controlled image reveals | Intro panels opening from a horizontal slit (`hi-top-open`/`hi-bottom-open`, 1000ms cinematic). Scene 2/3 copy revealed by role (opacity + 8–9px rise, scroll-mapped). Scene 2 plate opening as a centred aperture behind the TP (`clip-path: inset()`, scroll-mapped, TP3D PASS 02). Worlds grid reveal (70ms column stagger) | `clip-path: inset()` on a frame, opacity, `translateY` ≤12px, image scale ≤1.025 inside a fixed frame | Text `fast`, images `normal`, curtains `cinematic`; ease `primary` (curtains `cinematic`) |
| **DEPTH** | Small scale differences, translate3d, perspective, layered movement | SharedTP travel (scale → 0.86). Scene 2 architecture push +3.5%. TP departure. Worlds card tilt (≤2°, perspective 1400px) | `translate3d`, scale deltas ≤4% on full-bleed planes, perspective ≥1200px, UI rotation ≤2° | Scroll-mapped, or `normal` when time-based |
| **BREEZE** | Very subtle light or atmospheric movement | Continuous breeze cloth (vector, scroll-mapped). Intro raster breeze drift (7s). WebGL ambient cloud micro-motion (only inside the bridge, 0.35–0.7% of viewport height per second) | Opacity, slow transform drift, shader time | Time-driven only inside an active, visible moment. Never moves the camera or text. Off in reduced motion |
| **PARALLAX** | Planes at slightly different velocities | `MOTION.depthRatios` (architecture 0.9 / artifact 1 / breeze 1.22). Worlds detail stage pointer offsets 4/7px | Up to 3 planes per section. Velocity spread within the existing 0.9–1.22 band. Pointer parallax on the desktop tier only | Scroll-mapped. Pointer through `createPointerFollower` |
| **PORTAL** | From the editorial website into the immersive world | Scene 2 → Atrium bridge. The world swap happens at p 0.64 under full cloud/cloth occlusion | One portal per journey. The swap is hidden under full occlusion. Reversible. Reduced motion gets a cut inside an exposure dip, never a plate blend (rule 9) | Scroll-mapped. Route changes are plain navigations |
| **MICRO MOTION** | Buttons, links, image interaction, feedback | `.text-link` arrow `translate(3px,-3px)`. Portal photo scale 1.02 + caption nudge. Room labels (opacity, `translateX(3px)`). Atrium CTA preview scale 1.035 | transform/opacity only, ≤4px nudges, scale per `MOTION_LIMITS` | `micro` or `fast`; ease `primary` |

**Two clocks, never mixed for one property**

- **Scroll-mapped** choreography is a pure function of progress. Durations are
  progress ranges in the owning timeline (`home-motion.ts`,
  `home-story-frame.ts`, `atmospheric-*-frame.ts`). The scroll position is the
  clock: identical positions give identical frames, forward and backward.
  There is no smoothing library. Curves: `editorial` (smoothstep),
  `accelerate` and `arrive` (zero velocity at both ends).
- **Time-based** motion (CSS transitions, keyframes, pointer interpolation,
  bounded ambient motion) uses the tokens.

**Tokens** (`lib/motion/tokens.ts` ↔ `app/globals.css`)

| Token | Value | CSS | Use |
| --- | --- | --- | --- |
| `DURATION.micro` | 220ms | `--motion-duration-micro` | Links, labels, preview swaps |
| `DURATION.fast` | 400ms | `--motion-duration-fast` | Hover/focus on larger elements, arrows, underlines |
| `DURATION.normal` | 650ms | `--motion-duration-normal` | Image reveals, photo hover scale, crossfades |
| `DURATION.cinematic` | 1000ms | `--motion-duration-cinematic` | Portals, curtains (the intro panels already use exactly this) |
| `DURATION.entrance` | 1500ms | `--motion-duration-entrance` | A section's single arrival moment |
| `EASE.primary` | `cubic-bezier(0.16, 1, 0.3, 1)` | `--motion-ease-primary` | Default for every time-based motion |
| `EASE.cinematic` | `cubic-bezier(0.76, 0, 0.24, 1)` | `--motion-ease-cinematic` | Curtains, portals, state hand-offs (already used by the intro) |
| `STAGGER` | 70ms | — | Between sibling groups, never between words |

The durations reuse values already present in the site (220, 400, 650 and
1000ms), so a component can migrate to tokens without a visible change. The
audit lists every remaining literal and its nearest token.

In CSS, write `transition: transform var(--motion-duration-fast)
var(--motion-ease-primary)`. In TS, write `transition('transform', 'fast')`.
For RAF or WAAPI code, use `easing.primary(t)`, which evaluates the same
cubic-bezier.

CSS ignores `var()` inside a keyframe's `animation-timing-function` (measured
in Chrome, TP3D PASS 01). Per-segment keyframe curves must therefore be the
token curve written literally, with a comment naming the token.
`yarn check:motion` verifies every `cubic-bezier` in `home-intro.css`. Add
each stylesheet to that check when its keyframes migrate.

## 9. Motion intensity rules

| Level | Allowed | Not allowed |
| --- | --- | --- |
| **CALM** (LOW) | Micro feedback. One fade or reveal per block (`fast`/`normal`). Stillness | Parallax, depth moves, ambient motion, staggering more than one group |
| **MEDIUM** | One REVEAL per section. One PARALLAX or DEPTH layer pair. Staggered groups (≤6 items) | PORTAL, time-driven ambient motion, more than 2 moving planes |
| **HIGH** | One memorable moment: up to 3 planes, DEPTH + PARALLAX + BREEZE, `cinematic`/`entrance` | Using PORTAL outside the World Approach. More than 2 HIGH sections on a page |

**Homepage rhythm (target)**

The "In the current homepage" column describes the code today. The audit has
the full map.

| # | Section | Target | In the current homepage |
| --- | --- | --- | --- |
| 1 | Arrival / Hero | HIGH | Intro loader + Scene 1 (`HomeIntroLoader`, `HeroSceneA`, portals, SharedTP) |
| 2 | Story | LOW | Scene 2 "Perspective" (`HeroSceneB`) |
| 3 | Spaces | MEDIUM/HIGH | **Absent.** Removed from Home in `d9b265c` |
| 4 | Philosophy | LOW | **Absent** |
| 5 | Projects | MEDIUM | **Absent** |
| 6 | Materials | MEDIUM | **Absent.** Removed in `d9b265c` |
| 7 | Objects | MEDIUM | **Absent** |
| 8 | World Approach | HIGH | Breeze/sky bridge + Atrium (`WorldsChapter`) |
| 9 | Footer | LOW | `SiteFooter` |

**Rules**

1. A HIGH moment is followed by a CALM section. Spaces may reach HIGH only if
   Philosophy after it is fully calm, and it never uses PORTAL.
2. Not everything moves. In any viewport there is at most one primary moving
   group, plus micro feedback.
3. Every HIGH moment ends in stillness: a hold where nothing moves before the
   next section takes over. The Atrium's hold is 0.085 of the story span
   (0.915–1.0: 199px on desktop, 129px on a 390×844 phone; TP3D PASS 04). It
   is still short, and is bounded by the unchanged story height. Since TP3D
   PASS 16 that span is the base journey: the Atrium orbit appends its own
   span after it (rule 28) and ends on its own overview hold.
4. Amplitudes scale by tier (`AMPLITUDE`: desktop 1, tablet 0.75, mobile 0.5,
   reduced 0). Durations do not scale.
5. Upper bounds (`MOTION_LIMITS`, taken from the existing system):

   | Limit | Value |
   | --- | --- |
   | Image scale | 1.025 |
   | Object or preview scale | 1.035 |
   | Nudge | 4px |
   | Reveal rise | 12px |
   | Pointer parallax | 8px |
   | Tilt | 2° |
   | Perspective | ≥1200px |

6. **Scroll answers from the first step.** A reading hold applies to content
   (copy, links, the TP), not to the space. A spatial plane may answer the
   first wheel step with a sub-1% move that hands off into the next
   choreography without changing its approved endpoints. This is the Scene 1
   approach, `arrivalTiming.approach`.
7. **The arrival's first paint is a composed, contentful frame.** Never hide
   first-frame content behind `opacity: 0` until hydration. In TP3D PASS 01
   doing so cost about 340 ms of throttled FCP and mobile LCP. Silence comes
   from what arrives later, not from an empty first frame.
8. **Gate-bound reveals finish with their gate.** Time-driven reveal
   animations on scene elements during the intro (`revealing`) are fractions
   of `--hi-duration` and end at or before it. The gate completes on the
   panels' `animationend` and removes every reveal animation at that moment.
9. **Scene handoffs never double-expose.** This applies between two scenes on
   the one stage.
   - The outgoing copy leaves completely, in order (metadata, peripheral,
     headline), before any incoming copy appears.
   - A copy-free breath sits between them, carried by the architecture and
     the persistent object. It lasts at least 0.05 of progress with motion,
     0.02 reduced.
   - Photographic plates change by occlusion, never by a full-frame blend:
     an aperture `clip-path` on desktop/tablet, fully composed before the
     incoming copy appears. On phones and in reduced motion, a short dissolve
     happens entirely inside the breath.
   - The incoming scene enters as at most three groups: heading, body,
     metadata.
   - The Scene 1 → 2 handoff (`arrivalTiming`, TP3D PASS 02) is the
     reference, and `check-spatial-hero` enforces it.
   - The portal (Scene 2 → Atrium) keeps exactly one world visible. Reduced
     motion cuts at the swap inside a `MOTION.reduced.halfDip` exposure dip
     to the 0.65 floor (TP3D PASS 03), like the 0.745 framing cut. It never
     cross-dissolves the two plates.
10. **Copy leaves before atmosphere forms over it.** Editorial copy finishes
    its departure, in order, by the context-loss threshold
    (`bridge.occlusionStart`). Cloud, fog or cloth never sits over
    half-readable text. Decorative detail that the camera magnifies past its
    reading scale (the cloth's hairline threads) resolves out of focus, so
    it never becomes graphic stripes. Air starts to move before the copy
    visibly leaves. `check-perspective-atmosphere` enforces this (TP3D
    PASS 03).
11. **Architecture is revealed before interface.** In a world reveal the
    camera tells the story first: sky, the first architectural edge, the
    opening, then the recognisable space. Interface waits for the plate to
    settle: room labels begin when plate motion is under 40% of its peak
    rate and never over a plate scaled more than 1.06×, while
    titles and copy enter only over a still plate (under 1.01×). Exposure is
    complete before the first typography, and header ink changes where the
    image behind it crosses the ivory/ink contrast crossover, not at a
    chapter number. `check-atmosphere-worlds` enforces this (TP3D PASS 04).
12. **Crossing into the World is intentional.** Editorial browsing never
    launches immersive mode by itself: no scroll position, timer, hover or
    autoplay starts it. The crossing begins only from an explicit activation
    of the gateway. The gateway is a real link that works without JavaScript
    and keeps native modifier and middle clicks; script only adds the PORTAL
    to a plain primary activation. Inside, the World always offers a fast
    route to every room (the World map) and a clear exit back to the website.
    Every interrupted crossing (back, restore, resize, a stalled route)
    removes the cover and leaves nothing locked. `check-world-gateway`
    enforces this (TP3D PASS 05).
13. **World rooms are experiential; catalogues are utilities.**
    - **A room** inside `/world` is a composed place. It hangs a chosen
      selection in the World chrome (Back to Lobby, World map, Exit), with
      numbered exhibits and exhibition labels. It grows by curation, never
      automatically with the data.
    - **A catalogue** (`/worlds`) is the tool for finding everything:
      search, filters, sorting, pagination and stable URLs, in the
      editorial chrome.
    - A room ends with a quiet, secondary way to its catalogue. A catalogue
      never restyles into a room, and a room never grows filters.
    - Both read the same data. A room's curation stores only IDs and order
      (`data/world-gallery.ts`), so the two can never disagree.
    - `check-gallery` enforces the Gallery's side (TP3D PASS 06).
14. **Interactive 3D is explicit and reversible.**
    - No viewer or model network before an intentional activation. Load,
      hover, focus, scroll and idle time never start it.
    - The poster stays until the live space has loaded. Loading copy is
      truthful, with no invented progress. The live viewer takes the
      pointer only after the poster yields.
    - Every live viewer has one clear way back to its poster: one
      toggle that keeps focus through enter, cancel and exit. Escape
      closes the viewer before it ever leaves the page.
    - Entering one exhibit never preloads or opens the next. Switching
      always returns to the poster, and there is at most one live viewer.
    - `check-exhibit` enforces this (TP3D PASS 07).
15. **Context controls the shell; content identity stays stable.**
    - One piece of content has one content route. It may be entered from a
      room or from its catalogue. The visitor's server-validated context
      picks the shell around it; never a second route or a redirect.
    - It holds for both rooms:
      - Gallery → World details: `/worlds/[slug]?from=gallery` (TP3D
        PASS 08);
      - Objects → Product studies: `/products/[slug]?from=objects` (TP3D
        PASS 11).
    - A context is one exact query value, validated against the room's
      curation. Inside the World it renders `WorldChrome` with the room
      current, the World ground and type from the first paint, and the
      editorial header and footer `display: none` under a server-rendered
      marker. Every other visit, invalid contexts and uncurated content
      included, keeps the catalogue page exactly as it was.
    - The shell is decided on the server, scoped by its marker and right
      from the first paint: no client effect, observer or post-mount DOM
      mutation, and nothing hidden yet focusable.
    - What is inside stays the same in both shells: the detail markup, any
      viewer, model information, credits, disclosures and metadata. The
      context may change only the way back (to the room, at the content's
      own fragment), the room's own labels, and which links keep the
      context (only to content the room curates).
    - Reading the query makes the route render per request: vinext cannot
      prerender a page that reads it. Add a context only where a room needs
      it.
    - `check-world-shell` (TP3D PASS 08) and `check-object-study` (TP3D
      PASS 11) enforce this.
16. **Escape closes the nearest open interaction.**
    - The order is: an open disclosure (the World map), then a local
      immersive state (a loading or live viewer), then navigation (the
      return to the room or the catalogue).
    - The topmost layer the visitor opened takes Escape before any page
      handler, listens only while it is open, and never navigates. Closing
      it returns focus to its own control when focus was inside it, without
      scrolling.
    - With nothing open, a page without its own Escape does nothing (the
      Lobby and the Gallery).
    - Disclosures stay native `<details>`; no custom modal.
    - Keys inside a cross-origin viewer belong to that viewer. The page's
      own EXIT control stays on screen.
    - `check-world-ux` enforces this (TP3D PASS 09).
17. **The primary immersive action stays discoverable.**
    - At rest, ENTER 3D WORLD is on screen without scrolling at laptop
      heights (720px and up) and in short landscape. Once the viewer opens,
      so are CANCEL OPENING / EXIT 3D VIEW and fullscreen.
    - Detail heights are definite and derived from the viewport left below
      what actually sits above them. Secondary columns scroll; they never
      grow the stage.
    - In short landscape the stage stacks at full width, and decorative
      notes give way first. Controls never shrink below 44px.
    - Bringing a control into view never moves the page when the control
      is already visible.
    - `check-world-ux` enforces this (TP3D PASS 09).
18. **Availability is truthful.**
    - A room may open before every digital asset inside it is available.
      Room 02 opened with four object studies and no available model.
    - An unavailable 3D asset is a status in plain text, never a control:
      no disabled button, no `aria-disabled` link, no viewer placeholder.
    - Content and digital-asset availability are independent. The status
      comes from the data alone (`asset.available`), and a photograph is
      named for what it is (`imageRole`: reference study or model render).
    - Never fabricate a viewer id, a model file, model metadata, a download
      or a marketplace action to make a room look complete.
    - `check-objects-room` enforces this (TP3D PASS 10).
19. **Spaces and objects remain distinct content types.**
    - A `World` is an environment or interior (Gallery, `/worlds`). A
      `Product` is an individual object and its future asset (Objects,
      `/products`).
    - Both may come to use 3D, each through its own viewer and schema. Do
      not merge them for that reason.
    - Each room curates its own type by slugs only and reads every fact
      from that type's single source.
    - `check-objects-room` and `check-gallery` enforce this (TP3D PASS 10).
20. **World rooms contextualize existing content; they do not duplicate it.**
    - A room links to the content's own route with its context. There is no
      room-only copy of a detail page (no `/world/objects/[slug]`) and no
      second detail component.
    - Whatever a room says about an item comes from the same source as
      the catalogue: the facts from the data, the relationships derived
      from shared data and filtered to the room's curation, and the room's
      labels from one shared helper (`imageRoleLabel`, `assetStatusLabel`).
    - `check-object-study` enforces this (TP3D PASS 11).
21. **Prefetch according to cacheability, not habit.**
    - A destination that is static or usefully cacheable may prefetch, as
      each link already decides.
    - A destination that renders per request does not prefetch
      automatically. Today that is every Product detail
      (`/products/[slug]`, either context), served `no-store`. vinext
      discards a completed `no-store` prefetch; a click only gains when it
      lands while that prefetch is still in flight (measured: a ~300 ms
      window on production).
    - Viewport entry, hover and focus never create throwaway navigation
      work. A prefetched page also fetches its priority image, so a wasted
      prefetch costs more than its payload.
    - The link stays a real link. A click makes one request for the
      destination actually chosen. No manual prefetch replaces the
      automatic one.
    - `check-product-navigation` enforces this (TP3D PASS 12).
22. **The Archive begins with provenance.**
    - Every Archive record names its source collection and opens its source
      record, in plain sight, never behind hover.
    - The Archive curates sources by reference; each source collection stays
      the canonical owner of its records. Presentation never outruns the
      source: no invented date, no ageing or scan treatment, no label the
      source does not support ("material study", not "artefact").
    - An external cultural record enters only with a named source, a stable
      source reference, a credit line and a documented publication basis
      for the specific reproduction. Rights are never inferred from age,
      aesthetics or availability online, and the underlying work and its
      digital reproduction are not assumed to share a rights status.
    - `check-archive` enforces this (TP3D PASS 13).
23. **The Lab exposes systems, not diagnostics.**
    - Every Lab study corresponds to a system already running in production,
      and its curation names the production modules (engineering
      provenance, kept in data, tests and records — never in the room).
    - The Lab adapts systems; it never forks them. A live study consumes the
      production module through a thin adapter; a reference study describes
      the real system and leaves it where it works. No copied renderer,
      shader, geometry, pointer interpolation or portal.
    - Visitors read behaviour: the question, the medium, where it runs in
      production and the study's state in plain text. Never FPS, draw
      calls, uniforms, DPR, budgets, file names or debug state.
    - `check-lab` enforces this (TP3D PASS 14).
24. **Experimental cost is opt-in.**
    - A heavy study (WebGL, Three.js) loads only on an explicit control.
      Mount, scroll, viewport entry, hover, focus and timers never start
      it; before that the room requests no Three.js and creates no canvas
      or context.
    - The static study is complete on its own, and it is what reduced
      motion, Save-Data (as the production tiers decide) and any failure
      keep. There is no error copy, empty rectangle or retry loop.
    - A live study draws on demand, one coalesced frame at a time, with no
      ambient clock; at rest it schedules nothing. Stopping it or leaving
      the page destroys it: canvas removed, resources disposed, context
      released. At most one live instance.
    - `check-lab` enforces this (TP3D PASS 14).
25. **Commercial claims must match operational reality.**
    - Present only a contact mechanism that exists. No form, address,
      phone number, booking link or scheduler until there is a real
      destination behind it; the only interaction is navigation.
    - Future intent is separated from live capability: what TP3D wants to
      do (areas of conversation, how a project can begin) never reads as a
      service that can be bought today (no prices, packages, timelines or
      guarantees).
    - Status is visible, not implied: one truthful status (today "Opening
      soon"), matching `/contact`, which stays its source of truth.
    - `check-studio` enforces this (TP3D PASS 15).
26. **Concept studies are not client portfolio.**
    - Reference photography and illustrative projects stay labelled as
      concept studies wherever they appear, with the disclosure beside
      them, never behind hover or in a footer.
    - World presentation never converts concept work into commissions,
      clients, testimonials, metrics or team claims.
    - `check-studio` enforces this (TP3D PASS 15).

27. **The Atrium orbits a pivot, not a carousel.**
    - Room focus is derived from one architectural plate: a pan and a scale
      of at most 4% about the central island's measured source point, mapped
      through the plate's own `object-fit: cover` geometry, never viewport
      percentages, crossfades or enlarged thumbnails.
    - The island remains the perceptual anchor: its projected drift stays
      within 2.5 vw / 2 vh on desktop, no plate edge is ever exposed, and
      roll is 0 unless measured QA proves otherwise.
    - Scroll position owns the camera deterministically: one pure frame per
      progress, no direction, no queue, no timers; reverse equals forward.
      While it owns room focus, decorative hover yields; keyboard focus never
      does.
    - Each room settles before its typography takes authority (title only
      over a camera below 40% of its leg's peak speed, fully readable in the
      hold).
    - The sequence ends by returning the whole architecture to view, where
      the World copy and the gateway regain full authority. Scroll never
      enters the World.
    - `check-worlds-orbit` enforces this (TP3D PASS 16).

28. **Appended choreography must not retime approved scenes.**
    - A new scroll chapter appends its own physical span after the approved
      one (`--story-base-height` + `--story-orbit-height`) and samples its own
      progress; it never stretches an existing progress 0 → 1.
    - The approved journey keeps its measured span, and its writes stay
      provably identical (a digest against the approved timeline).
    - Reduced motion gets no appended spacer.
    - `check-worlds-orbit` enforces this (TP3D PASS 16).

## 10. Image behavior

**Pipeline**

- Sources live in `assets/` (JPG/PNG).
- `scripts/optimize-images.mjs` (sharp) writes WebP into `public/images`:
  720 and 1280 variants at q80, and a full size at q84 (max 1600px, 2400px for
  the hero).
- Dimensions go to `data/image-dimensions.json`.
- There is no runtime image service.

**`<EditorialImage>`** (`components/shared/editorial-image.tsx`)

- Aspect ratio is reserved by layout CSS plus width/height attributes.
- `srcset` + `sizes`, lazy by default.
- `priority` (eager + `fetchpriority=high`) is for the LCP image only.

**Homepage plates** (`<picture>` with ≤767 → 720 and ≤1199 → 1280 sources)

- Scene 1 is eager and high priority.
- Scene 2 and the Atrium are deferred (`data-src`) and installed by the
  timeline. The Atrium loads at p ≥ 0.16, and its `decode()` gates the bridge.

**Aspect ratios in use**

| Image | Ratio |
| --- | --- |
| Editorial default | 1.45 |
| Project preview | 1.25 |
| Spaces | 1.8 (feature fills its column) |
| Collections | 1.13 / 0.95 |
| Materials strip | 0.6 |
| Objects | 0.86 |
| Journal | 1.38 |
| Project, collection and article heroes | 2 |
| About | 2.1 |
| Homepage plates | 1586×992 |
| Atrium | 1672×941 |
| Portal atlas | 1254² (2×2) |

**Behaviour rules**

- Images sit in an `overflow: hidden` frame. Hover scale ≤1.025 at `normal`.
- Reveal with clip, mask or opacity. Never animate `filter` or blur. No Ken
  Burns loops. No autoplaying video on the homepage.
- Every new image gets explicit dimensions, an optimized variant set and real
  alt text, or `alt=""` when decorative.
- The Atrium is one flat opaque photograph, with no depth layers or alpha.
  Layered depth needs new assets, not CSS tricks.
- Photography is placeholder Pexels material (`docs/ASSET-SOURCES.md`).
  Replace it before public launch.

## 11. Interaction rules

**Hover and focus**

- Hover effects live inside `@media (hover: hover) and (pointer: fine)`.
- Every hover effect has a `:focus-visible` equivalent. The Atrium CTA and
  portals already do this.
- Touch navigates on the first tap. No two-tap reveals (the rule already
  stated in `worlds.css`).

**Pointer**

- No custom cursors, cursor followers or magnetic buttons.
- Pointer-driven motion runs on the desktop tier only, for `pointerType ===
  'mouse'`. It eases back to rest when the pointer leaves and reads layout
  once per hover.
  - **Outside the homepage story:** use `createPointerFollower`.
  - **Inside the sticky story:** pointer input only sets a target, and a
    driver with `update` / `tick` / `wantsTime` is ticked by the master RAF.
    The pattern is `components/home/experience/hero-depth.ts`, which mirrors
    the sky bridge.

**Focus outlines**

- Global: 2px solid `--walnut`, offset 5px.
- Homepage photo contexts use `#514332`, or 1px `currentColor` at offset 7px.
- The World: 1px `currentColor` (ivory on the ground), offset 6px.
- Controls over imagery or a dark rail use an explicit ring on a mat, never
  `currentColor` alone (TP3D PASS 09):
  - the editorial site: 2px `--foreground` on a 4px `--background` mat
    (walnut is too mid-toned: under 3:1 against the posters' grey floors);
  - the World: 2px `--wl-ivory` on a 4px `--world-ground` mat.

  One very dark and one very light layer: whatever the poster's luminance,
  one of them contrasts by 3:1 or more.

**Touch targets:** at least 44px.

**Hidden scenes**

- Hidden scenes are `inert` + `aria-hidden`.
- Links become interactive only once fully revealed (Atrium room links at
  p ≥ 0.895, the CTA at 0.915; TP3D PASS 04).

**Prefetch:** homepage links use `prefetch={false}` so bandwidth stays with the
story. The World gateway prefetches the `/world` route only on intent
(pointer enter, focus, touch start), and never anything 3D. Product-detail
links never prefetch: the route renders per request (rule 21, TP3D PASS 12).

**Scroll**

- Scroll stays native: no smoothing, snapping, wheel or touch interception,
  scroll-jacking or artificial slow scrolling.
- `scroll-behavior: auto` while the story is mounted.

**Header:** the header is persistent and never hides. Only its ink changes,
mixed by scroll where the image behind it changes from light to dark
(Atrium: 0.82–0.855, measured from band luminance in TP3D PASS 04).

## 12. Performance rules

**Animation**

1. Animate `transform` and `opacity`. Use `clip-path` where reasonable. Never
   animate `top`, `left`, `width`, `height`, `padding` or `margin`. The audit
   lists the legacy exceptions.
2. One RAF owner per controller; inside the homepage story the master
   timeline is the only one. It is event-driven and stops when idle: no
   permanent loops. Time-driven ambient motion runs only while its moment is
   active and visible.
3. No per-frame React state. Write styles and attributes directly, with
   change detection (see `property()` in `home-story-timeline.ts`).
4. Cache geometry on resize (`ResizeObserver`). Don't read layout in
   scroll or pointer handlers per frame (`createScrollProgress` and
   `createPointerFollower` follow this).
5. Scroll, touch and pointer listeners are `passive`.
6. Set `will-change` only while an element is actually moving, and remove it
   afterwards. Never set it as a blanket rule.
7. No `filter` or `backdrop-filter` animation and no blur transitions. The
   only `backdrop-filter` in authored CSS forces the shadcn overlay blur to
   `none`.

**Loading**

8. Load images per §10. Load heavy scene assets by story progress, not on
   timers.
9. Keep the existing 6 font files. Don't add families.
10. Import Three.js dynamically only (§14).

**Dependencies**

11. No new animation dependency without a pass that justifies it.

**GSAP policy.** GSAP is not installed. If a pass adds it:

- Use it only for in-flow sections outside the sticky story.
- Never pin or scrub inside `HomeStory`.
- Never use ScrollSmoother.
- Create it inside `gsap.context()` and register it with `createDisposables()`
  (it calls `revert()`).
- Branch on reduced motion with `gsap.matchMedia()`.

**Baselines.** Measured numbers live in `TANPHONG_HOME_MOTION_CONTEXT.md` §18.
They come from headless Chrome on an RTX 3090 and do not represent laptops,
phones or Safari. Report only measured values, with their environment.

**Required checks:**

- `yarn lint` (or `node_modules/.bin/oxlint`)
- `yarn tsc --noEmit`
- `yarn check:motion`, `check:home`, `check:intro`, `check:hero`,
  `check:content`, `check:assets`, `check:worlds`
- `yarn build:vercel`

`check:home` asserts many timing constants and source patterns. Retiming
requires deliberate updates to those assertions.

## 13. Accessibility and `prefers-reduced-motion`

1. **Global CSS kill switch.** `app/globals.css` sets `animation: none
   !important; transition: none !important` on every element under `reduce`.
   Component rules add to it and never fight it. Because of the switch, the
   150ms reduced-motion opacity transition declared in `worlds.css` never
   runs.
2. **Scroll-mapped choreography branches on reduced motion.**
   - Removed: spatial movement, parallax, staggered rises, WebGL, ambient
     motion and the cloth.
   - Allowed: crossfades, dissolves and cuts.
   - Every chapter, link and the Footer stay reachable. The current homepage
     implementation is described in `TANPHONG_HOME_MOTION_CONTEXT.md` §16.
3. **JS reads the preference live** through `readMotionCapability()` /
   `subscribeMotionCapability()`, or `useMotionCapability()` /
   `useReducedMotion()` in React. Before hydration, `useReducedMotion()`
   returns `true`: render the static composition first.
4. **Pointer and time-driven ambient motion are off** under reduced motion.
   The loader exits in 300ms.
5. **Auto-moving content.** Motion that starts on its own and runs longer than
   5s next to content falls under WCAG 2.2.2 (Pause, Stop, Hide). The current
   ambient sky runs only while the visitor rests inside the bridge, where
   almost no text is shown. Review any new ambient motion against 2.2.2.
6. **Structure.**
   - Hidden content is `inert`/`aria-hidden`.
   - The skip link targets `#main`.
   - Vietnamese copy has `lang="vi"`.
   - Copy over photographs relies on exposure masks for contrast.
   - Focus is always visible.
   - Nothing flashes.

## 14. Rules for future 3D integration

**Where Three.js belongs**

- Enter The World, `/experience/[slug]`, 3D viewers and individual rooms.
  The `/world` Lobby gets WebGL only with a real GLB environment, never as a
  procedural placeholder; until then it is a photographic 2.5D shell.
- **The homepage gets no new canvas.** The existing homepage atmospheric sky
  bridge (lazy `import('three')`, tiered, one context per Home mount) stays
  until the user decides its future. See the audit's blockers. It is the only
  WebGL allowed on the homepage, and it must not grow.

**How to add a scene**

1. Register a module in `components/experience/scene-registry.ts` behind a
   dynamic import: `'room-id': () => import('./scenes/room-id')`.
2. Export a `createScene({ host, signal, onSelect })` that returns a
   `SceneHandle` with an idempotent `dispose()` and optionally `setPaused()`.
3. `ThreeSceneLoader` already handles visibility pause, `pagehide`, context
   loss, retries and fallbacks.

**Poster first**

- `threeScene.enabled: false` renders the static preview immediately.
- Load the viewer only on the experience route or on explicit intent. This is
  the same click-to-load pattern as the Sketchfab viewer.
- On `/worlds/[slug]` the poster stays mounted while the Sketchfab embed
  loads beneath it, then yields (rule 14, TP3D PASS 07).

**Budgets**

- Use the sky bridge's proven defaults: DPR caps (≤1.5 desktop, ≤1.25 tablet,
  1 mobile), render on demand, pause hidden tabs, `failIfMajorPerformanceCaveat`,
  and full `dispose()` + `forceContextLoss()` on unmount.
- For GLBs, compress geometry (Draco or Meshopt) and textures (KTX2). These are
  recommendations. Set numeric budgets with the first real GLB, measured on
  real devices.

**Libraries:** plain `three` (0.186.1). React Three Fiber/Drei are not
installed, and adding them is a dependency decision for a pass.

**Exhibits:** a GLB is an exhibit. Selecting it opens the existing detail
sheet (`.selection-sheet`, `onSelect({ kind, slug })`), limited to that
project's catalogue.

**Portal hand-off**

- The homepage portal ends at the Atrium. Entering a room is a route
  navigation.
- Enter the World is a route navigation to `/world` behind one fixed cover in
  `--world-ground` (`components/world/world-portal.ts`, TP3D PASS 05). The
  Lobby is a 2.5D shell with no canvas. Its plate layer is what a future GLB
  Lobby replaces; room IDs, routes and both navigation modes stay.
- Rooms are routes under `/world/`, and every World page shares
  `WorldChrome`. Room 01, `/world/gallery` (TP3D PASS 06), is a 2.5D
  exhibition with no canvas. A future Gallery environment replaces its
  hanging (frames and placement), not its curation, labels, routes or
  chrome. Exhibits open the existing `/worlds/[slug]` viewer pages, which
  render inside the World shell for a validated Gallery visit (rule 15,
  TP3D PASS 08).
- Room 02, `/world/objects` (TP3D PASS 10), is a cabinet of object studies
  with no canvas and no viewer. Its studies open the `/products/[slug]`
  details, where any future object viewer lives. They render inside the
  World shell for a validated Room 02 visit (rule 15, TP3D PASS 11).
- Room 03, `/world/archive` (TP3D PASS 13), is a reading room of records
  with no canvas and no client code of its own. Each record opens its
  editorial source (Material Library, Journal) as a document navigation;
  the sources keep their own shell.
- Room 04, `/world/lab` (TP3D PASS 14), is the one room that may create
  WebGL, and only on request: LOAD LIVE STUDY lazily loads the production
  atmospheric renderer (`createAtmosphericSkyBridge`) through
  `components/world/lab-atmosphere-adapter.ts`, with its own tiers, DPR
  caps, budgets, Save-Data and context-loss handling (rules 23–24). The
  canvas is decorative; the study's keyboard control is a native range, not
  the canvas. Its other studies add no canvas.
- Room 05, `/world/studio` (TP3D PASS 15), the project table, completes the
  building. It has no canvas, image or client code of its own and no form or
  contact channel (rules 25–26); concept studies open their editorial
  `/projects/[slug]` pages and the conversation hands off to `/contact`, as
  document navigations. The `planned` status and its label stay supported
  for future wings.
- The homepage Atrium orbit (TP3D PASS 16) is a 2.5D illusion on one plate
  (rule 27). When a real Atrium environment exists, its room order, pivot,
  holds and pacing may become the camera blueprint; the photographic
  transforms are then replaced, not stacked under the real camera.
- No canvas persists across routes.
- The homepage must not preload room scenes.

**Reduced motion:** no camera autopilot or intro flythrough. Show a static
poster, then explicit controls.

**Accessibility**

- The canvas is focusable and has keyboard controls.
- The exhibits are also listed in HTML.
- Credits are shown with every scene (Sketchfab CC BY).

## 15. DO NOT

**Design**

- Redesign or replace the visual identity, wordmark, palette, fonts or
  editorial grid without a brief that asks for it.
- Introduce random UI components, glow, glass, heavy shadows, decorative
  gradients or rounded cards. The generated shadcn primitives in
  `components/ui` are used only for the header search dialog and the sheets
  (mobile menu, experience selection). Don't spread them into editorial
  layouts.
- Add a new font family, a saturated accent or a new breakpoint.
- Use the UNESCO reference's assets, artwork, colors, typography, objects or
  layout. It is a motion study only.

**Motion**

- Invent motion outside the six concepts.
- Hard-code new durations or easings. Use the tokens.
- Use excessive fade-ups, per-word or per-letter animation, large custom
  cursors, constant floating elements, blur transitions, large rotations,
  aggressive perspective (<1200px), scroll hijacking, artificial slow
  scrolling, scroll snapping, or decorative particles without narrative
  purpose.
- Add Lenis, Locomotive, ScrollSmoother or any scroll smoothing.
- Add a second scroll owner, ScrollTrigger pin or independent RAF inside the
  homepage sticky story. Sample the master timeline.

**Performance**

- Add a persistent Three.js canvas, React Three Fiber or a new WebGL context to
  the homepage.
- Import `three` at module scope anywhere.
- Animate layout properties.
- Use per-frame React state.
- Use blanket `will-change`.
- Use permanent RAF loops.
- Read layout per frame.

**Process**

- Ship motion without a reduced-motion path, a mobile path, and focus parity
  for hover.
- Commit screen recordings or `work/` evidence (both are gitignored or local).
- Report FPS, RAM or GPU numbers that were not measured, or omit the device
  and browser they came from.

---

## Appendix A — Motion foundation API

Framework-agnostic `create*` controllers return their cleanup function. This is
the same idiom as `createHomeStoryTimeline`, `createRoomDiscovery` and
`createBreezeRenderer`. React components call them inside `useEffect` or
`useLayoutEffect`. No visual effect uses them yet; PASS 00 only prepares them.

| File | Exports | Purpose |
| --- | --- | --- |
| `lib/motion/tokens.ts` | `DURATION`, `EASE`, `STAGGER`, `AMPLITUDE`, `MOTION_LIMITS`, `cssDuration`, `cssEase`, `transition`, `cubicBezier`, `easing` | The vocabulary |
| `lib/motion/capability.ts` | `MOTION_QUERIES`, `MOTION_BREAKPOINTS`, `motionTier`, `readMotionCapability`, `subscribeMotionCapability` | Reduced motion, pointer capability, desktop/tablet/mobile tier, save-data |
| `hooks/use-motion-capability.ts` | `useMotionCapability`, `useReducedMotion` | React access (`useSyncExternalStore`, SSR-safe `null`) |
| `lib/motion/progress.ts` | `clamp01`, `progressBetween`, `scrollProgress`, `createScrollProgress` | Normalized scroll progress for in-flow sections, with cached geometry |
| `lib/motion/disposables.ts` | `createDisposables` | Cleanup of listeners, frames, timers, observers, GSAP contexts/timelines, Three.js resources |
| `lib/motion/pointer.ts` | `approach`, `createPointerFollower` | RAF pointer interpolation that settles and stops |

```tsx
const capability = useMotionCapability();
useEffect(() => {
  const element = ref.current;
  // Static composition until the capability is known; desktop tier only.
  if (!element || capability?.tier !== 'desktop') return;
  const bag = createDisposables();
  bag.add(
    createPointerFollower(element, (x, y) => {
      element.style.setProperty('--front-x', `${x * 6}px`);
      element.style.setProperty('--front-y', `${y * 6}px`);
    }),
  );
  return () => bag.dispose();
}, [capability]);
```

`createScrollProgress` is for sections in normal document flow only. Anything
inside the homepage sticky stage must read the master timeline's progress.
