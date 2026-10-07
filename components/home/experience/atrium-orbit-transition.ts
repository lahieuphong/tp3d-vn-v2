import {
  ATRIUM_ORBIT_TRANSITIONS,
  type AtriumOrbitStateId,
} from './atrium-orbit-model';
import {
  plateWindowStart,
  type AtriumOrbitLayout,
  type AtriumOrbitOrientation,
  type AtriumOrbitPlateWindow,
} from './atrium-orbit-manifest';
import {
  ATRIUM_ORBIT_TIMING,
  type AtriumOrbitDirection,
  type AtriumOrbitSample,
} from './atrium-orbit-progress';
import { editorial, span, unit } from './home-motion';

/** TP3D PASS 6A — the plate transition extension point. Deliberately not an
 * animation framework: one pure function from a sampled move to two layer
 * poses.
 *
 * PASS 6B.0 — the orbit, on comp plates. The camera never cuts between
 * views: it pushes in from the wide Atrium onto the first doorway, then
 * travels sideways around the Atrium from doorway to doorway. Each view is a
 * still plate, so the travel is drawn by moving two neighbouring plates
 * together, as one strip, and joining them where both show the same thing:
 * the stone pier between the two doorways. Scroll position alone decides the
 * frame; nothing here knows time or direction. Occlusion passes and real
 * camera angles still wait for the studio plates (PASS 6B). */

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

/** How the camera gets from one view to the next. Fractions of a plate
 * (x across its width, y down its height), measured on the comp plates:
 * PROVISIONAL, like them, and replaced by the studio's camera data. */
export type AtriumOrbitShot =
  | {
      /** Wide view → a doorway: the wide plate grows about that doorway
       * until it is as large as in the next view, and resolves into it. */
      kind: 'push';
      /** The doorway in the wide view, and the same doorway in the next. */
      door: { x: number; y: number };
      goal: { x: number; y: number };
      /** How much larger the doorway is in the next view. */
      zoom: number;
      /** The share of the move over which the wide plate dissolves. */
      dissolve: readonly [number, number];
    }
  | {
      /** Doorway → next doorway, clockwise: both plates travel left as one
       * strip. `shift` is how far the scene moves between the two views;
       * `pier` is where the pier between the two doorways stands in the
       * outgoing plate, which is where the two plates are joined. */
      kind: 'pan';
      shift: number;
      pier: number;
    };

/** One per transition, in ATRIUM_ORBIT_TRANSITIONS order. */
export const ATRIUM_ORBIT_SHOTS: readonly AtriumOrbitShot[] = [
  {
    kind: 'push',
    door: { x: 223 / 1672, y: 451 / 941 },
    goal: { x: 0.514, y: 0.457 },
    zoom: 3.75,
    dissolve: [0.66, 0.98],
  },
  { kind: 'pan', shift: 0.461, pier: 0.753 },
  { kind: 'pan', shift: 0.415, pier: 0.725 },
  { kind: 'pan', shift: 0.39, pier: 0.755 },
];

/** The join between two travelling plates. `feather` is half its soft width
 * (plate widths). It comes in from the edge, rests on the pier for the
 * `dwell` share of the move, and leaves by the other edge; `open` is the
 * share at each end over which it softens from, and back to, a line. */
export const ATRIUM_ORBIT_SEAM = {
  feather: 0.045,
  dwell: [0.28, 0.72],
  open: 0.14,
} as const;

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
  /** The pair's shot; null for a pair without one (a plain change). */
  shot: AtriumOrbitShot | null;
  /** How much of a plate the stage shows, and the layout it is in. */
  window: AtriumOrbitPlateWindow;
  layout: AtriumOrbitLayout;
};

/** A plate layer's pose. A plate is a box of the plate's ratio that covers
 * the stage: x is a share of its width, y of its height, scale about its
 * centre. `edge` is a soft vertical edge, in shares of the plate's width:
 * the plate is clear at `edge[0]` and whole at `edge[1]`. Layers never
 * rotate, skew or take perspective. */
export type PlateLayer = {
  opacity: number;
  x: number;
  y: number;
  scale: number;
  edge: readonly [number, number] | null;
};
/** `over` names the layer drawn on top and `lead` the view the frame mostly
 * shows (the one the UI follows). Neither depends on the travel direction. */
export type PlateTransitionFrame = {
  from: PlateLayer;
  to: PlateLayer;
  over: 'from' | 'to';
  lead: 'from' | 'to';
};

/** Contract: the same `from`, `to` and `localProgress` draw the same frame in
 * either direction (reverse scrolling plays the pair backwards). Direction
 * may change preloading, never the picture at a position. */
export type PlateTransition = (
  input: PlateTransitionInput,
) => PlateTransitionFrame;

export function plateTransitionInput(
  sample: AtriumOrbitSample,
  direction: AtriumOrbitDirection,
  stepAngles: readonly number[] | null,
  orientation: AtriumOrbitOrientation,
  window: AtriumOrbitPlateWindow,
  layout: AtriumOrbitLayout,
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
    shot: ATRIUM_ORBIT_SHOTS[index] ?? null,
    window,
    layout,
  };
}

const HIDDEN: PlateLayer = { opacity: 0, x: 0, y: 0, scale: 1, edge: null };

/** A view at rest: the whole plate, with the stage's window on its subject
 * (the plate itself when the stage is as wide as the plate). */
export const plateRest = (
  state: AtriumOrbitStateId,
  window: AtriumOrbitPlateWindow,
  layout: AtriumOrbitLayout,
): PlateLayer => ({
  opacity: 1,
  x: -plateWindowStart(state, window, layout),
  y: 0,
  scale: 1,
  edge: null,
});

/** A camera move's own ease: no velocity or acceleration at either end. */
const travel = (t: number) => t * t * t * (t * (6 * t - 15) + 10);
const clamp = (value: number, low: number, high: number) =>
  Math.min(high, Math.max(low, value));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

function ends(
  input: PlateTransitionInput,
): Pick<PlateTransitionFrame, 'from' | 'to'> | null {
  const { from, to, localProgress, window, layout } = input;
  if (localProgress <= 0)
    return { from: plateRest(from, window, layout), to: HIDDEN };
  if (localProgress >= 1)
    return { from: HIDDEN, to: plateRest(to, window, layout) };
  return null;
}

const leadAt = (localProgress: number) =>
  localProgress < ATRIUM_ORBIT_TIMING.uiSwitchAt ? 'from' : 'to';

/** No shot, and reduced motion: one view, then the other, each at rest. */
export const plainChange: PlateTransition = (input) => {
  const { from, to, localProgress, window, layout } = input;
  const lead = leadAt(localProgress);
  return {
    from: lead === 'from' ? plateRest(from, window, layout) : HIDDEN,
    to: lead === 'to' ? plateRest(to, window, layout) : HIDDEN,
    over: 'to',
    lead,
  };
};

/** Wide view → doorway. The wide plate grows at a steady rate about the
 * doorway, which travels to where the next view holds it; the next view
 * lies under it at rest and takes over as the wide plate dissolves. The
 * wide plate covers the stage at every scale. */
function push(
  input: PlateTransitionInput,
  shot: Extract<AtriumOrbitShot, { kind: 'push' }>,
): PlateTransitionFrame {
  const { from, to, localProgress, window, layout } = input;
  const e = travel(localProgress);
  const start = plateWindowStart(from, window, layout);
  const goal = plateWindowStart(to, window, layout);
  const scale = Math.exp(Math.log(shot.zoom) * e);
  const reach = (scale - 1) / (shot.zoom - 1);
  const room = 0.5 * (shot.zoom - 1);
  // Where the plate must stand at full zoom for the two doorways to meet,
  // kept inside what still covers the stage.
  const x = clamp(
    shot.goal.x - goal - 0.5 - (shot.door.x - 0.5) * shot.zoom,
    window.width - 1 - room,
    room,
  );
  const y = clamp(
    shot.goal.y / window.height -
      0.5 -
      (shot.door.y / window.height - 0.5) * shot.zoom,
    -room,
    room,
  );
  return {
    from: {
      opacity: 1 - editorial(span(e, shot.dissolve[0], shot.dissolve[1])),
      x: mix(-start, x, reach),
      y: y * reach,
      scale,
      edge: null,
    },
    to: plateRest(to, window, layout),
    over: 'from',
    lead: leadAt(localProgress),
  };
}

/** Doorway → next doorway. Both plates travel as one strip, `shift` apart,
 * so the pier they share stays in one piece; the incoming plate lies on top
 * and begins at a soft edge that rests on that pier. Wherever the edge is,
 * the plate beneath it is there, so the stage is always covered. */
function pan(
  input: PlateTransitionInput,
  shot: Extract<AtriumOrbitShot, { kind: 'pan' }>,
): PlateTransitionFrame {
  const { from, to, localProgress, window, layout } = input;
  const { feather, dwell, open } = ATRIUM_ORBIT_SEAM;
  const e = travel(localProgress);
  const start = plateWindowStart(from, window, layout);
  const goal = plateWindowStart(to, window, layout);
  const distance = shot.shift + goal - start;
  // The join, across the outgoing plate: from the window's leading edge,
  // onto the pier, and out at the edge the window ends on.
  const enter = start + window.width;
  const exit = goal + shot.shift;
  const pier = clamp(shot.pier, Math.min(enter, exit), Math.max(enter, exit));
  const join =
    e < dwell[0]
      ? mix(enter, pier, editorial(e / dwell[0]))
      : e <= dwell[1]
        ? pier
        : mix(pier, exit, editorial((e - dwell[1]) / (1 - dwell[1])));
  // Soft only where both plates exist, and a line again at either end.
  const soft =
    Math.max(0, Math.min(feather, join - shot.shift, 1 - join)) *
    unit(Math.min(e, 1 - e) / open);
  return {
    from: { opacity: 1, x: -start - distance * e, y: 0, scale: 1, edge: null },
    to: {
      opacity: 1,
      x: -goal + distance * (1 - e),
      y: 0,
      scale: 1,
      edge: [join - soft - shot.shift, join + soft - shot.shift],
    },
    over: 'to',
    lead: leadAt(localProgress),
  };
}

/** PASS 6B.0 — the orbit: each pair plays its shot. */
export const orbitTransition: PlateTransition = (input) => {
  const rest = ends(input);
  if (rest) return { ...rest, over: 'to', lead: leadAt(input.localProgress) };
  if (!input.shot) return plainChange(input);
  return input.shot.kind === 'push'
    ? push(input, input.shot)
    : pan(input, input.shot);
};

/** Reduced motion keeps a plain plate change with no camera move. */
export const reducedTransition: PlateTransition = plainChange;

export const selectPlateTransition = (reduced: boolean): PlateTransition =>
  reduced ? reducedTransition : orbitTransition;
