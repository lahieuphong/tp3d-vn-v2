import { AMPLITUDE } from './tokens';

/** The one set of capability queries. New components should not hand-write
 * these strings (the home and Worlds controllers each still carry a copy). */
export const MOTION_QUERIES = {
  reduced: '(prefers-reduced-motion: reduce)',
  finePointer: '(hover: hover) and (pointer: fine)',
  /** Pointer-driven motion: fine hover pointer and no reduced-motion request. */
  pointerMotion:
    '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)',
} as const;

/** Motion tiers share the home story breakpoints (`MOTION.breakpoints` in
 * components/home/experience/home-motion.ts). The global layout CSS still
 * uses 760/1100; see docs/TP3D-DESIGN-SYSTEM.md before adding a breakpoint. */
export const MOTION_BREAKPOINTS = { tablet: 768, desktop: 1200 } as const;

export type MotionTier = keyof typeof AMPLITUDE;

export type MotionCapability = {
  tier: MotionTier;
  reduced: boolean;
  /** Hover and a fine pointer: hover-only effects and pointer motion allowed. */
  finePointer: boolean;
  /** The visitor asked to save data; skip optional heavy media and WebGL. */
  saveData: boolean;
  /** Multiplier for motion distance/scale offsets (AMPLITUDE). */
  amplitude: number;
};

/** Desktop needs both width and a fine pointer, so a large touch screen gets
 * tablet motion, matching the atmospheric sky tiers (`skyTier`). */
export function motionTier(
  width: number,
  finePointer: boolean,
  reduced: boolean,
): MotionTier {
  if (reduced) return 'reduced';
  if (width < MOTION_BREAKPOINTS.tablet) return 'mobile';
  if (width < MOTION_BREAKPOINTS.desktop || !finePointer) return 'tablet';
  return 'desktop';
}

const tierQueries = [
  `(min-width: ${MOTION_BREAKPOINTS.tablet}px)`,
  `(min-width: ${MOTION_BREAKPOINTS.desktop}px)`,
];

let cached: MotionCapability | null = null;
let cachedKey = '';

/** Client-only snapshot. Returns the same object until a value changes, so it
 * can back `useSyncExternalStore` directly. */
export function readMotionCapability(): MotionCapability {
  const reduced = window.matchMedia(MOTION_QUERIES.reduced).matches;
  const finePointer = window.matchMedia(MOTION_QUERIES.finePointer).matches;
  const saveData =
    (navigator as Navigator & { connection?: { saveData?: boolean } })
      .connection?.saveData === true;
  const tier = motionTier(window.innerWidth, finePointer, reduced);
  const key = `${tier}|${reduced}|${finePointer}|${saveData}`;
  if (!cached || key !== cachedKey) {
    cachedKey = key;
    cached = {
      tier,
      reduced,
      finePointer,
      saveData,
      amplitude: AMPLITUDE[tier],
    };
  }
  return cached;
}

/** Calls `listener` when any capability input may have changed. Media-query
 * events only: no resize listener, so it costs nothing while the user scrolls. */
export function subscribeMotionCapability(listener: () => void) {
  const lists = [
    MOTION_QUERIES.reduced,
    MOTION_QUERIES.finePointer,
    ...tierQueries,
  ].map((query) => window.matchMedia(query));
  for (const list of lists) list.addEventListener('change', listener);
  return () => {
    for (const list of lists) list.removeEventListener('change', listener);
  };
}
