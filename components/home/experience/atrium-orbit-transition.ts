import {
  ATRIUM_ORBIT_TRANSITIONS,
  type AtriumOrbitStateId,
} from './atrium-orbit-model';
import type { AtriumOrbitOrientation } from './atrium-orbit-manifest';
import {
  ATRIUM_ORBIT_TIMING,
  type AtriumOrbitDirection,
  type AtriumOrbitSample,
} from './atrium-orbit-progress';

/** TP3D PASS 6A — the plate transition extension point. Deliberately not an
 * animation framework: one pure function from a sampled move to two layer
 * poses. PASS 6A ships only a provisional cut. Directional movement, scale
 * differential, occlusion, blend length and camera settle wait for the
 * approved plates (PASS 6B), where they replace `provisionalCut` here. */

/** Spec §9: the shared occluder expected to hide each swap. Screen regions
 * are expected values from the mock-ups until Phase 1 confirms them, so
 * none are encoded yet. */
export type OccluderHint = {
  occluder: string;
  /** 1 = a foreground alpha pass would materially improve this pair. */
  alphaPassPriority: 1 | 2;
  regions: null;
};

/** One per transition, in ATRIUM_ORBIT_TRANSITIONS order. */
export const ATRIUM_ORBIT_OCCLUDERS: readonly OccluderHint[] = [
  {
    occluder: 'olive tree and planter mass, with the stone',
    alphaPassPriority: 1,
    regions: null,
  },
  {
    occluder: 'pier between Living and Bedroom; left foreground holds',
    alphaPassPriority: 2,
    regions: null,
  },
  {
    occluder: 'tree canopy over the wall between Bedroom and Bathroom',
    alphaPassPriority: 1,
    regions: null,
  },
  {
    occluder: 'pier and planting between Bathroom and Kitchen, with the vase',
    alphaPassPriority: 2,
    regions: null,
  },
];

export type PlateTransitionInput = {
  /** The pair in canonical (forward) order. */
  from: AtriumOrbitStateId;
  to: AtriumOrbitStateId;
  /** 0 → 1 across this move, from `from` to `to` (the sample's
   * localTransitionProgress; scroll position alone). */
  localProgress: number;
  /** Explicit travel direction; `outgoing` / `incoming` follow from it. */
  direction: AtriumOrbitDirection;
  outgoing: AtriumOrbitStateId;
  incoming: AtriumOrbitStateId;
  /** The pair's signed camera step; null until the camera data exists. */
  deltaAngleDeg: number | null;
  occluder: OccluderHint | null;
  orientation: AtriumOrbitOrientation;
};

/** A plate layer's pose: x / y as fractions of the stage, scale about its
 * centre. Layers never rotate, skew or take perspective. */
export type PlateLayer = {
  opacity: number;
  x: number;
  y: number;
  scale: number;
};
export type PlateTransitionFrame = { from: PlateLayer; to: PlateLayer };

/** Contract: the same `from`, `to` and `localProgress` draw the same frame in
 * either direction (reverse scrolling plays the pair backwards). Direction
 * may change z-order or preloading, never the picture at a position. */
export type PlateTransition = (
  input: PlateTransitionInput,
) => PlateTransitionFrame;

export function plateTransitionInput(
  sample: AtriumOrbitSample,
  direction: AtriumOrbitDirection,
  stepAngles: readonly number[] | null,
  orientation: AtriumOrbitOrientation,
): PlateTransitionInput | null {
  const index = sample.transitionIndex;
  if (sample.phase !== 'move' || index === null) return null;
  const { from, to } = ATRIUM_ORBIT_TRANSITIONS[index];
  return {
    from,
    to,
    localProgress: sample.localTransitionProgress,
    direction,
    outgoing: direction === 'forward' ? from : to,
    incoming: direction === 'forward' ? to : from,
    deltaAngleDeg: stepAngles?.[index] ?? null,
    occluder: ATRIUM_ORBIT_OCCLUDERS[index] ?? null,
    orientation,
  };
}

export const PLATE_REST: PlateLayer = { opacity: 1, x: 0, y: 0, scale: 1 };
const HIDDEN: PlateLayer = { ...PLATE_REST, opacity: 0 };

/** PROVISIONAL, not a design: a hard cut where the UI switches, with no
 * movement. It lets the stage, the decode gate and the UI sync run before
 * the plates exist. */
export const provisionalCut: PlateTransition = ({ localProgress }) =>
  localProgress < ATRIUM_ORBIT_TIMING.uiSwitchAt
    ? { from: PLATE_REST, to: HIDDEN }
    : { from: HIDDEN, to: PLATE_REST };

/** Reduced motion keeps a plain plate change with no transform, in 6B too. */
export const reducedTransition: PlateTransition = (input) =>
  provisionalCut(input);

export const selectPlateTransition = (reduced: boolean): PlateTransition =>
  reduced ? reducedTransition : provisionalCut;
