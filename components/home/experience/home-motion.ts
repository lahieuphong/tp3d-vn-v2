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
    // TP3D PASS 04: interface waits for the settling architecture. The rail
    // and the worlds chapter return with the first room label; the four room
    // links are interactive once all are revealed; the hold starts with the
    // last reveal.
    revealStart: 0.845,
    interactive: 0.895,
    settled: 0.915,
  },
  departure: {
    anticipation: [0.494, 0.556],
    depth: [0.534, 0.64],
    architecture: [0.55, 0.64],
    // Copy leaves by role before the cloud banks form over its columns: labels
    // as the cloth starts yielding (breeze.takeover[0]), body mid-handoff, and
    // the heading last, gone exactly when context loss begins (occlusionStart).
    labels: [0.484, 0.556],
    body: [0.506, 0.58],
    heading: [0.526, 0.6],
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
    // The first sign of air: this share of the approach starts with Scene 2's
    // departure (bridge.exitStart) as a restrained swell of the resting cloth.
    stir: 0.03,
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
    // TP3D PASS 04: a clear sky beat after the atmosphere has opened (0.72),
    // then the oculus rim, the opening and the Atrium. The pull-back is
    // shorter (0.155–0.16 of progress) because its old last fifth moved the
    // plate by under 1%. Portrait crops sit closer to the rim, so phones and
    // tablets start a little earlier and still show the sky first.
    start: { desktop: 0.72, tablet: 0.715, mobile: 0.715 },
    end: { desktop: 0.88, tablet: 0.875, mobile: 0.87 },
    // Visual milestones: the frame reads as architecture (oculus, columns,
    // openings, tree) from `recognizable`; plate motion is under a fifth of
    // its peak rate (log scale) from `settleStart`.
    recognizable: 0.81,
    settleStart: 0.85,
  },
  // Exposure adapts as architecture replaces sky and is complete before the
  // title; the header ink follows the darkened band behind it.
  light: [0.785, 0.865],
  header: [0.82, 0.855],
  // Rooms (0–3) begin as the camera settles, then 3D WORLDS, Enter, the
  // worlds., body, signoff and the CTA, all complete by `bridge.settled`.
  ui: [
    [0.845, 0.875],
    [0.851, 0.881],
    [0.857, 0.887],
    [0.863, 0.893],
    [0.867, 0.893],
    [0.872, 0.899],
    [0.878, 0.905],
    [0.885, 0.909],
    [0.89, 0.913],
    [0.895, 0.915],
  ],
  // Reduced motion never blends two plates: the world swap and the framing
  // cut are each a cut inside a halfDip-wide exposure dip to the floor. After
  // the cut the static Atrium shows rooms, title and content in order.
  reduced: {
    cut: 0.745,
    halfDip: 0.015,
    floor: 0.65,
    ui: { start: 0.775, step: 0.006, length: 0.02 },
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
    approach:
      (1 - MOTION.breeze.stir) *
        accelerate(
          span(progress, MOTION.bridge.breezeStart, MOTION.breeze.peak),
        ) +
      MOTION.breeze.stir *
        editorial(span(progress, MOTION.bridge.exitStart, MOTION.breeze.peak)),
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
