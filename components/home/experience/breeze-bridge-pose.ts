import {
  MOTION,
  span,
  editorial,
  cameraImpulse,
  motionProfile,
} from './home-motion';
const bridgeTiming = MOTION.bridge;
import type { BreezeFamily } from './breeze-geometry';

export type BreezeBridgeGeometry = {
  width: number;
  height: number;
  breadth: number;
  focus: { x: number; y: number };
  family: BreezeFamily;
};
/** A pure pose of the existing cloth. The very short lens crossing fills the
 * viewport with its folded material, then clears rapidly into the sky hold. */
export function bridgeBreezePose(p: number, geometry: BreezeBridgeGeometry) {
  const { width, height, breadth, focus, family } = geometry;
  const mobile = family === 'mobile';
  const amount = motionProfile(width).breezeDepth;
  const impulse = cameraImpulse(p, width);
  const toward = impulse.approach;
  const crossing = editorial(span(p, ...MOTION.breeze.crossing));
  const exit = impulse.through;
  // Coverage, rather than an arbitrary uniform breakpoint scale, determines
  // the closest pose. The original breadth is capped on wide desktop screens.
  const peak = Math.max(1, (width / breadth) * MOTION.breeze.peakCoverage);
  const scale = 1 + (peak - 1) * toward * (1 - exit);
  const targetX = width * MOTION.breeze.focus[0];
  const targetY = height * MOTION.breeze.focus[1];
  return {
    x:
      (targetX - focus.x) * toward +
      width *
        amount *
        (MOTION.breeze.crossingX * crossing + MOTION.breeze.exitX * exit),
    y:
      (targetY - focus.y) * toward +
      height *
        amount *
        (MOTION.breeze.crossingY * crossing + MOTION.breeze.exitY * exit),
    scale,
    rotate:
      (MOTION.breeze.rotation[0] * toward +
        MOTION.breeze.rotation[1] * crossing +
        MOTION.breeze.rotation[2] * exit) *
      amount,
    opacity: 1 - exit,
    density: editorial(span(p, ...MOTION.breeze.density)),
    transfer: mobile ? 0 : editorial(span(p, ...MOTION.breeze.transfer)),
    foreground: p >= MOTION.breeze.foreground && p < bridgeTiming.breezeEnd,
  };
}
