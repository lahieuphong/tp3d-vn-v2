import {
  MOTION,
  unit,
  span,
  editorial,
  accelerate,
  cameraImpulse,
  motionProfile,
} from './home-motion';

/** Native story progress remains the only authority, in either direction. */
export const bridgeTiming = MOTION.bridge;
const clamp = unit;
const range = span;
const smooth = editorial;
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

export type AtriumGeometry = {
  originX: number;
  originY: number;
  skyScale: number;
  skyX: number;
  skyY: number;
  width: number;
  height: number;
};

/** The only scene plate is 1672×941. Its actual sky centre is (836,110).
 * The final object-fit crop (51% on mobile, 50% elsewhere) remains unchanged.
 * A clean crop needs 160–176 source pixels, not an arbitrary 1.2× zoom.
 * See the asset audit: sky softness is a limit of the supplied photograph. */
export function measureAtrium(width: number, height: number): AtriumGeometry {
  const source = MOTION.camera.source;
  const cover = Math.max(width / source.width, height / source.height);
  const mobile = motionProfile(width).family === 'mobile';
  const portrait = height > width;
  const cropHeight =
    MOTION.camera.cropHeight[
      mobile || portrait
        ? 'portrait'
        : motionProfile(width).family === 'tablet'
          ? 'tablet'
          : 'desktop'
    ];
  const originX =
    (width - source.width * cover) * (mobile ? 0.51 : 0.5) +
    source.skyX * cover;
  const originY = source.skyY * cover;
  return {
    width,
    height,
    originX,
    originY,
    skyScale: height / (cover * cropHeight),
    skyX: width / 2 - originX,
    skyY: height / 2 - originY,
  };
}

export function bridgeFrame(progress: number, width: number, reduced = false) {
  const p = clamp(progress);
  const { depth } = motionProfile(width);
  const artifactDepth = depth * MOTION.depthRatios.artifact;
  const impulse = cameraImpulse(p, width);
  const depart = impulse.anticipation;
  const loss = impulse.departure;
  const architecture = accelerate(range(p, ...MOTION.departure.architecture));
  const heading = storyTextDeparture(p, 'heading', width, reduced);
  const d = MOTION.departure;
  const swapped = p >= bridgeTiming.swap;
  const reducedSkyEnd = MOTION.reduced.cut;
  // Reduced motion uses two static framings, without a large animated zoom.
  // A modest exposure dip softens the cut while keeping the plate readable,
  // including when native scrolling stops exactly at the framing boundary.
  const reducedCutOut = smooth(
    range(p, reducedSkyEnd - MOTION.reduced.halfDip, reducedSkyEnd),
  );
  const reducedCutIn = smooth(
    range(p, reducedSkyEnd, reducedSkyEnd + MOTION.reduced.halfDip),
  );
  const phase =
    p < bridgeTiming.exitStart
      ? 'SCENE2_HOLD'
      : p < bridgeTiming.breezeStart
        ? 'TP_DEPART'
        : p < bridgeTiming.occlusionStart
          ? 'BREEZE_NEAR_CAMERA'
          : p < bridgeTiming.swap
            ? 'CONTEXT_LOSS'
            : p < motionProfile(width).cameraStart
              ? 'SKY_VOID'
              : p < 0.75
                ? 'OCULUS'
                : p < bridgeTiming.revealStart
                  ? 'SCENE3_PULLBACK'
                  : p < bridgeTiming.settled
                    ? 'SCENE3_REVEAL'
                    : 'SCENE3_HOLD';
  const scene2Opacity = reduced
    ? 1 - smooth(range(p, ...MOTION.reduced.dissolve))
    : 1 - d.architectureFade * architecture;
  return {
    phase,
    swapped,
    scene2Visible: !swapped,
    scene3Visible: reduced ? p > MOTION.reduced.dissolve[0] : swapped,
    textOpacity: swapped ? 0 : heading.opacity,
    textY: heading.y,
    tpScale: reduced
      ? 1
      : 1 - artifactDepth * (d.tpScale[0] * depart + d.tpScale[1] * loss),
    tpY: reduced ? 0 : -artifactDepth * (d.tpY[0] * depart + d.tpY[1] * loss),
    tpOpacity: swapped
      ? 0
      : (1 - d.tpOpacity[0] * depart) * (1 - d.tpOpacity[1] * loss),
    architectureScale: reduced
      ? 1
      : 1 +
        d.architectureScale *
          depth *
          MOTION.depthRatios.architecture *
          architecture,
    architectureY: reduced
      ? 0
      : d.architectureY *
        depth *
        MOTION.depthRatios.architecture *
        architecture,
    scene2Opacity,
    worldOpacity: reduced
      ? !swapped
        ? smooth(range(p, ...MOTION.reduced.dissolve))
        : p < reducedSkyEnd
          ? 1 - (1 - MOTION.reduced.floor) * reducedCutOut
          : MOTION.reduced.floor + (1 - MOTION.reduced.floor) * reducedCutIn
      : 1,
    staticSky: reduced && p < reducedSkyEnd,
    exposure: smooth(range(p, ...MOTION.light)),
    headerIvory: smooth(range(p, ...MOTION.header)),
    interactive: p >= bridgeTiming.interactive,
    depth,
  };
}

export function atriumPose(
  progress: number,
  geometry: AtriumGeometry,
  reduced = false,
) {
  const p = clamp(progress);
  const profile = motionProfile(geometry.width);
  const travel = range(p, profile.cameraStart, profile.cameraEnd);
  // Gentle departure from the sky hold, then a weighted pull and long arrival.
  // The first derivative is zero at both ends, and there is no overshoot.
  const pull = cameraImpulse(p, geometry.width).arrival;
  const scale = reduced
    ? p < MOTION.reduced.cut
      ? geometry.skyScale
      : 1
    : mix(geometry.skyScale, 1, pull);
  const alignment = (scale - 1) / (geometry.skyScale - 1);
  return {
    scale,
    x: geometry.skyX * alignment,
    y: geometry.skyY * alignment,
    originX: geometry.originX,
    originY: geometry.originY,
    moving: !reduced && travel > 0 && travel < 1,
  };
}

export function worldReveal(progress: number, order: number, reduced = false) {
  // Four room labels precede eyebrow/title/body/signoff/CTA. Even the last
  // interactive control is completely revealed before it enters the tab order.
  const intervals = MOTION.ui;
  const [start, end] = intervals[Math.min(9, Math.max(0, order))];
  const value = smooth(
    range(
      progress,
      reduced ? MOTION.reduced.ui[0] : start,
      reduced ? MOTION.reduced.ui[1] : end,
    ),
  );
  return {
    opacity: value,
    y: reduced ? 0 : 9 * (1 - value),
    interactive: progress >= bridgeTiming.interactive && value >= 0.999,
  };
}

/** Editorial text departs by role, with no temporal inertia. */
export function storyTextDeparture(
  progress: number,
  role: 'labels' | 'body' | 'heading',
  width: number,
  reduced = false,
) {
  const [start, end] = MOTION.departure[role];
  const value = smooth(range(progress, start, end));
  return {
    opacity: 1 - value,
    y: reduced
      ? 0
      : -MOTION.departure.textY[role] * motionProfile(width).depth * value,
  };
}
export function departureRole(
  selector: string,
): 'labels' | 'body' | 'heading' | null {
  if (selector.includes('sh-story-body')) return 'body';
  if (selector.includes('sh-story-') && selector.includes('h2'))
    return 'heading';
  if (
    selector.includes('sh-story-signoff') ||
    selector.includes('sh-story-column')
  )
    return 'labels';
  return null;
}
