/** One tunable vocabulary for native-scroll camera motion. Spatial layers
 * share its impulses; text and interaction always sample raw story progress. */
export const MOTION = {
  breakpoints: { mobile: 768, desktop: 1200 },
  scrub: 0,
  bridge: {
    exitStart: 0.48,
    breezeStart: 0.52,
    occlusionStart: 0.6,
    swap: 0.64,
    breezeEnd: 0.84,
    revealStart: 0.82,
    interactive: 0.9,
    settled: 0.92,
  },
  departure: {
    anticipation: [0.494, 0.556],
    depth: [0.534, 0.64],
    architecture: [0.55, 0.64],
    labels: [0.484, 0.574],
    body: [0.506, 0.608],
    heading: [0.526, 0.631],
    tpScale: [0.04, 0.155],
    tpY: [4, 22],
    tpOpacity: [0.09, 0.42],
    architectureScale: 0.035,
    architectureY: -8,
    architectureFade: 0.58,
    textY: { labels: 6, body: 9, heading: 12 },
  },
  depthRatios: { architecture: 0.9, artifact: 1, breeze: 1.22 },
  breeze: {
    peak: 0.632,
    crossingEnd: 0.646,
    crossing: [0.612, 0.672],
    suspension: 0.66,
    density: [0.558, 0.626],
    transfer: [0.525, 0.595],
    // With a painting WebGL atmosphere the cloth yields here, after the far
    // (0.517) and mid (0.544) banks have begun and while the near mass forms,
    // before its magnified folds can read as graphic stripes.
    takeover: [0.556, 0.606],
    foreground: 0.54,
    peakCoverage: 1.8,
    focus: [0.52, 0.48],
    crossingX: 0.045,
    crossingY: -0.055,
    exitX: 0.9,
    exitY: -1.65,
    rotation: [-4, -2, -12],
  },
  camera: {
    source: { width: 1672, height: 941, skyX: 836, skyY: 110 },
    cropHeight: { desktop: 160, tablet: 168, portrait: 176 },
    start: { desktop: 0.705, tablet: 0.701, mobile: 0.686 },
    end: { desktop: 0.91, tablet: 0.907, mobile: 0.895 },
    recognizable: 0.77,
    settleStart: 0.86,
  },
  light: [0.768, 0.92],
  header: [0.72, 0.78],
  ui: [
    [0.82, 0.86],
    [0.83, 0.87],
    [0.84, 0.88],
    [0.85, 0.89],
    [0.846, 0.88],
    [0.854, 0.89],
    [0.862, 0.9],
    [0.873, 0.907],
    [0.883, 0.915],
    [0.892, 0.92],
  ],
  reduced: {
    dissolve: [0.605, 0.64],
    cut: 0.745,
    halfDip: 0.015,
    floor: 0.65,
    ui: [0.8, 0.84],
  },
  mass: {
    desktop: { tau: 44, pixels: 2.4, scale: 0.0025 },
    tablet: { tau: 36, pixels: 1.6, scale: 0.0018 },
    mobile: { tau: 0, pixels: 0, scale: 0 },
    epsilonPixels: 0.04,
    maxFrameMs: 64,
  },
} as const;

export const unit = (n: number) => Math.min(1, Math.max(0, n));
export const span = (p: number, start: number, end: number) =>
  unit((p - start) / (end - start));
export const editorial = (t: number) => t * t * (3 - 2 * t);
// Mirrored, asymmetric integrated velocity curves. Both stop with zero velocity.
export const accelerate = (t: number) => t ** 4 * (5 - 4 * t);
export const arrive = (t: number) => 1 - (1 - t) ** 4 * (1 + 4 * t);

export function motionProfile(width: number) {
  const family =
    width < MOTION.breakpoints.mobile
      ? 'mobile'
      : width < MOTION.breakpoints.desktop
        ? 'tablet'
        : 'desktop';
  return {
    family,
    depth: family === 'mobile' ? 0.5 : family === 'tablet' ? 0.75 : 1,
    breezeDepth: family === 'mobile' ? 0.58 : family === 'tablet' ? 0.75 : 1,
    cameraStart: MOTION.camera.start[family],
    cameraEnd: MOTION.camera.end[family],
    mass: MOTION.mass[family],
  };
}

export function cameraImpulse(progress: number, width: number) {
  const profile = motionProfile(width);
  return {
    anticipation: editorial(span(progress, ...MOTION.departure.anticipation)),
    departure: accelerate(span(progress, ...MOTION.departure.depth)),
    approach: accelerate(
      span(progress, MOTION.bridge.breezeStart, MOTION.breeze.peak),
    ),
    through: arrive(
      unit(
        span(progress, MOTION.breeze.crossingEnd, MOTION.bridge.breezeEnd) *
          MOTION.depthRatios.breeze,
      ),
    ),
    arrival: arrive(span(progress, profile.cameraStart, profile.cameraEnd)),
    phase:
      progress < MOTION.bridge.exitStart
        ? 'REST'
        : progress < MOTION.departure.depth[0]
          ? 'ANTICIPATION'
          : progress < MOTION.breeze.peak
            ? 'ACCELERATION'
            : progress < MOTION.breeze.suspension
              ? 'LENS_CROSSING'
              : progress < profile.cameraStart
                ? 'SUSPENSION'
                : progress < MOTION.camera.recognizable
                  ? 'DISCOVERY'
                  : progress < MOTION.camera.settleStart
                    ? 'DECELERATION'
                    : progress < MOTION.bridge.settled
                      ? 'SETTLE'
                      : 'STILLNESS',
  };
}

export type VisualPose = { x: number; y: number; scale: number };
/** Bounded response of a large plane, not a scroll smoother. No overshoot,
 * accumulated velocity or independent RAF. A stale frame resolves immediately.
 * The conservative edge budget includes scale displacement at the viewport. */
export function settleVisual(
  previous: VisualPose | null,
  target: VisualPose,
  elapsed: number,
  width: number,
  height: number,
  enabled: boolean,
) {
  const { mass } = motionProfile(width);
  if (
    !enabled ||
    !previous ||
    !mass.tau ||
    elapsed <= 0 ||
    elapsed > MOTION.mass.maxFrameMs
  )
    return { pose: target, active: false };
  const decay = Math.exp(-elapsed / mass.tau);
  let x = (previous.x - target.x) * decay;
  let y = (previous.y - target.y) * decay;
  let scale = (previous.scale - target.scale) * decay;
  const edge =
    Math.abs(x) + Math.abs(y) + Math.max(width, height) * Math.abs(scale);
  const budget = Math.min(
    1,
    mass.pixels / (edge || 1),
    scale ? mass.scale / Math.abs(scale) : 1,
  );
  x *= budget;
  y *= budget;
  scale *= budget;
  if (edge * budget <= MOTION.mass.epsilonPixels)
    return { pose: target, active: false };
  return {
    pose: { x: target.x + x, y: target.y + y, scale: target.scale + scale },
    active: true,
  };
}
