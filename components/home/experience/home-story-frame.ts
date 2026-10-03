import { bridgeTiming } from './atmospheric-bridge-frame';
/** Every layer samples one native HomeStory progress. */
export const clamp = (n: number) => Math.min(1, Math.max(0, n));
export const range = (p: number, a: number, b: number) =>
  clamp((p - a) / (b - a));
const smooth = (t: number) => t * t * (3 - 2 * t);
const fade = (p: number, start: number, end: number) =>
  smooth(range(p, start, end));

// Arrival / manifesto retain PASS 2 timing. PASS 3 owns the later bridge.
export const homeStoryTiming = {
  scene1: [0, 0.3],
  scene2: [0.3, bridgeTiming.swap],
  scene3: [bridgeTiming.revealStart, 1],
  crossfadeHalfWidth: 0.03,
} as const;
export const tpTiming = {
  hold: 0.12,
  settle: 0.42,
  readingEnd: bridgeTiming.exitStart,
  reducedStart: 0.28,
  reducedEnd: 0.32,
} as const;
export const arrivalTiming = {
  // TP3D PASS 01: the first scroll answers at once. The far plane dollies in
  // under 1% and the near leaves drift; copy, portals and TP keep holding.
  approach: [0, 0.14],
  metadata: [0.14, 0.23],
  portals: [0.17, 0.295],
  headline: [0.2, 0.3],
  secondaryHeadline: [0.205, 0.305],
  narrowHeadline: [0.14, 0.245],
  architecture: [0.22, 0.375],
  eyebrow: [0.245, 0.305],
  headingEn: [0.285, 0.345],
  headingVi: [0.3, 0.36],
  bodyEn: [0.335, 0.395],
  bodyVi: [0.35, 0.41],
  labels: [0.36, 0.42],
} as const;

export function homeStoryFrame(progress: number) {
  const p = clamp(progress);
  const { scene2, scene3, crossfadeHalfWidth: half } = homeStoryTiming;
  return {
    progress: p,
    perspective: range(p, scene2[0] - half, scene2[0] + half),
    worlds: p >= bridgeTiming.swap ? 1 : 0,
    chapter:
      p < scene2[0]
        ? 'arrival'
        : p < bridgeTiming.swap
          ? 'perspective'
          : p < scene3[0]
            ? 'bridge'
            : 'worlds',
  };
}

/** Target pose comes from the shared object's responsive CSS, read on resize.
 * x/y use stage pixels; width/height describe its untransformed layout box. */
export type TPGeometry = {
  x: number;
  y: number;
  scale: number;
  width: number;
  height: number;
  opacity: number;
};
export function tpPose(progress: number, target: TPGeometry, reduced = false) {
  const raw = range(
    progress,
    reduced ? tpTiming.reducedStart : tpTiming.hold,
    reduced ? tpTiming.reducedEnd : tpTiming.settle,
  );
  // Slow pickup, weighted middle, long zero-velocity arrival. No time lag,
  // overshoot or playback state: stopping/reversing input preserves the pose.
  const travel = reduced ? smooth(raw) : 1 - (1 - raw) ** 3 * (1 + 3 * raw);
  const scale = 1 / (1 + (1 / target.scale - 1) * travel);
  const alignment =
    target.scale === 1 ? travel : (1 - scale) / (1 - target.scale);
  return {
    travel,
    // The optical pivot is 52%/46%, toward the T/P's shared material mass.
    // Compensation preserves the exact former center-origin checkpoint bounds.
    x: target.x * alignment - target.width * 0.02 * (1 - scale),
    y: target.y * alignment + target.height * 0.04 * (1 - scale),
    scale,
    opacity: target.opacity,
    phase: raw === 0 ? 'scene1' : raw === 1 ? 'scene2' : 'travel',
  };
}

/** Content departs/reveals around the persistent TP. Transform/opacity only;
 * approved p=0 and reading-hold compositions remain the endpoints. */
export function arrivalFrame(
  progress: number,
  width: number,
  storyReady: boolean,
  reduced = false,
) {
  const p = clamp(progress);
  const { perspective } = homeStoryFrame(p);
  const depth = width < 768 ? 0.5 : width < 1200 ? 0.7 : 1;
  const read = (interval: readonly [number, number]) => fade(p, ...interval);
  const enter = (interval: readonly [number, number]) =>
    reduced ? perspective : read(interval);
  const leave = (interval: readonly [number, number]) =>
    reduced ? perspective : read(interval);
  const opacity = (n: number) => n.toFixed(5);
  const move = (x: number, y: number, scale = 1) =>
    `translate3d(${x.toFixed(3)}px, ${y.toFixed(3)}px, 0) scale(${scale.toFixed(6)})`;
  const reveal = (interval: readonly [number, number], distance = 8) => {
    const value = enter(interval);
    return {
      opacity: opacity(value),
      transform: move(0, reduced ? 0 : (1 - value) * distance * depth),
    };
  };
  const departure = (interval: readonly [number, number], distance = 8) => {
    const value = leave(interval);
    return {
      opacity: opacity(1 - value),
      transform: move(0, reduced ? 0 : -value * distance * depth),
    };
  };
  const portal = leave(arrivalTiming.portals);
  const architecture = storyReady ? enter(arrivalTiming.architecture) : 0;
  const travel = tpPose(
    p,
    { x: 0, y: 0, scale: 0.86, width: 0, height: 0, opacity: 1 },
    reduced,
  ).travel;
  // Ease-out, so the first wheel step already moves. The TP travel then takes
  // over: (1 - travel) hands the approach off, so the approved Scene 2
  // endpoints are unchanged and the motion never reverses.
  const approach = reduced
    ? 0
    : (1 - (1 - range(p, ...arrivalTiming.approach)) ** 2) * (1 - travel);
  const secondary =
    width < 1200
      ? arrivalTiming.narrowHeadline
      : arrivalTiming.secondaryHeadline;
  return {
    '.sh-discovery': {
      opacity: opacity(
        reduced
          ? 1 - perspective
          : p >= arrivalTiming.secondaryHeadline[1]
            ? 0
            : 1,
      ),
    },
    '.sh-discovery .sh-signature, .sh-mobile-eyebrow, .sh-discovery-axis':
      departure(arrivalTiming.metadata, 5),
    '.sh-welcome-en h1': departure(arrivalTiming.headline, 12),
    '.sh-welcome-title': departure(secondary, 10),
    '.sh-portals': {
      opacity: opacity(1 - portal),
      transform: move(
        0,
        reduced ? 0 : 12 * depth * portal,
        reduced ? 1 : 1 - 0.018 * portal,
      ),
    },
    '.sh-story': { opacity: '1' },
    '.sh-story-column > .sh-eyebrow:first-child': reveal(
      arrivalTiming.eyebrow,
      5,
    ),
    '.sh-story-en h2': reveal(arrivalTiming.headingEn),
    '.sh-story-vi h2': reveal(arrivalTiming.headingVi),
    '.sh-story-en .sh-rule, .sh-story-en .sh-story-body': reveal(
      arrivalTiming.bodyEn,
      6,
    ),
    '.sh-story-vi .sh-rule, .sh-story-vi .sh-story-body': reveal(
      arrivalTiming.bodyVi,
      6,
    ),
    '.sh-story-signoff, .sh-read-story, .sh-center-copy': reveal(
      arrivalTiming.labels,
      5,
    ),
    '.sh-leaves': {
      transform: move(
        reduced ? 0 : 12 * depth * travel,
        reduced ? 0 : -(6 * approach + 42 * travel) * depth,
      ),
    },
    '[data-hero-layer="architecture-a"]': {
      transform: move(
        reduced ? 0 : -3 * depth * travel,
        reduced ? 0 : -2 * depth * travel,
        reduced ? 1 : 1 + depth * (0.008 * approach + 0.012 * travel),
      ),
    },
    '[data-hero-layer="architecture-b"]': {
      opacity: opacity(architecture),
      transform: move(
        reduced ? 0 : 2 * depth * (1 - travel),
        reduced ? 0 : 3 * depth * (1 - travel),
        reduced ? 1 : 1 + 0.012 * depth * (1 - travel),
      ),
    },
    '.sh-scroll-indicator': departure(arrivalTiming.metadata, 0),
  } satisfies Record<string, Partial<CSSStyleDeclaration>>;
}
