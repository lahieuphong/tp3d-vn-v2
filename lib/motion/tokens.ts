/** TP3D motion vocabulary for time-based motion (transitions, keyframes,
 * pointer/ambient interpolation). `app/globals.css` mirrors DURATION and EASE
 * as `--motion-*` custom properties; `yarn check:motion` keeps them in sync.
 * Scroll-mapped choreography stays in its owning timeline as progress ranges
 * (e.g. components/home/experience/home-motion.ts). See docs/TP3D-DESIGN-SYSTEM.md. */

/** Milliseconds. Values reuse durations already present in the site so
 * existing components can migrate without a visible change. */
export const DURATION = {
  /** Buttons, links, label nudges, preview swaps. */
  micro: 220,
  /** Hover/focus feedback on larger elements, underline and arrow travel. */
  fast: 400,
  /** Image reveals, photo hover scale, panel crossfades. */
  normal: 650,
  /** Portal and curtain moves (the intro panels already use this pairing). */
  cinematic: 1000,
  /** A section's single arrival moment. Use once per section at most. */
  entrance: 1500,
} as const;

export type MotionDuration = keyof typeof DURATION;

/** Delay between siblings in a staggered reveal (the Worlds grid uses 70ms per
 * column). Stagger groups of elements, never individual words. */
export const STAGGER = 70;

/** cubic-bezier control points. */
export const EASE = {
  /** Expo-out: arrivals, reveals and micro feedback settle softly. */
  primary: [0.16, 1, 0.3, 1],
  /** Symmetric in-out: portals, curtains and hand-offs between states. */
  cinematic: [0.76, 0, 0.24, 1],
} as const;

export type MotionEase = keyof typeof EASE;

export const cssDuration = (name: MotionDuration) => `${DURATION[name]}ms`;
export const cssEase = (name: MotionEase) =>
  `cubic-bezier(${EASE[name].join(', ')})`;
/** Shorthand for one property, e.g. `transition('transform', 'fast')`. */
export const transition = (
  property: string,
  duration: MotionDuration,
  ease: MotionEase = 'primary',
) => `${property} ${cssDuration(duration)} ${cssEase(ease)}`;

/** Evaluates a CSS cubic-bezier timing function for JS-driven motion, so
 * RAF/WAAPI code shares the CSS curves exactly. */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const ax = 3 * x1 - 3 * x2 + 1;
  const bx = 3 * x2 - 6 * x1;
  const cx = 3 * x1;
  const ay = 3 * y1 - 3 * y2 + 1;
  const by = 3 * y2 - 6 * y1;
  const cy = 3 * y1;
  const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sampleY = (t: number) => ((ay * t + by) * t + cy) * t;
  const slopeX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const error = sampleX(t) - x;
      if (Math.abs(error) < 1e-6) return sampleY(t);
      const slope = slopeX(t);
      if (Math.abs(slope) < 1e-6) break;
      t -= error / slope;
    }
    // Newton can stall on flat segments; bisection always converges.
    let low = 0;
    let high = 1;
    t = x;
    for (let i = 0; i < 32; i++) {
      const value = sampleX(t);
      if (Math.abs(value - x) < 1e-6) break;
      if (value < x) low = t;
      else high = t;
      t = (low + high) / 2;
    }
    return sampleY(t);
  };
}

export const easing = {
  primary: cubicBezier(...EASE.primary),
  cinematic: cubicBezier(...EASE.cinematic),
};

/** Motion amplitude per capability tier, the same ratios the home story uses
 * for depth (components/home/experience/home-motion.ts `motionProfile`). */
export const AMPLITUDE = {
  desktop: 1,
  tablet: 0.75,
  mobile: 0.5,
  reduced: 0,
} as const;

/** Upper bounds for desktop amplitude, taken from the existing system. They are
 * ceilings, not targets: most motion should stay well below them. */
export const MOTION_LIMITS = {
  /** Photo scale on hover/focus (portals 1.02, Worlds cards 1.022, editorial 1.025). */
  imageScale: 1.025,
  /** Small circular/object previews (Atrium CTA 1.035). */
  objectScale: 1.035,
  /** Hover/focus nudge of arrows and labels. */
  nudgePx: 4,
  /** Rise of a revealed text block (Scene 2/3 use 8–9px, departures up to 12px). */
  revealRisePx: 12,
  /** Pointer parallax offset of the nearest plane (Worlds detail stage 7px). */
  parallaxPx: 8,
  /** Pointer tilt (Worlds cards 1.5–2deg). */
  tiltDeg: 2,
  /** Minimum perspective distance; smaller values read as aggressive. */
  perspectivePx: 1200,
} as const;
