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

/** A rectangle on a plate: x across its width, y down its height. */
export type PlateBox = {
  x: readonly [number, number];
  y: readonly [number, number];
};

/** How the camera gets from one view to the next. Fractions of a plate
 * (x across its width, y down its height), measured on the comp plates:
 * PROVISIONAL, like them, and replaced by the studio's camera data. */
export type AtriumOrbitShot =
  | {
      /** Wide view → a doorway. The wide plate grows until that doorway's
       * opening lies exactly on the same opening in the next view; the next
       * view then spreads from inside the doorway over the whole frame. */
      kind: 'push';
      /** The doorway's opening (jamb to jamb, lintel to floor) in the wide
       * view, and the same opening in the next view. */
      door: PlateBox;
      goal: PlateBox;
      /** Shares of the move: the wide plate reaches the doorway's size by
       * `zoom`; both plates turn to face it over `turn`; the next view
       * opens out of the doorway over `iris`. */
      zoom: number;
      turn: readonly [number, number];
      iris: readonly [number, number];
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
    // The Living doorway, measured on both pictures (px of 1672 × 941). In
    // the wide Atrium it is seen at an angle: 221 × 262. In the Living view
    // it is seen square on: 520 × 422.
    door: { x: [100 / 1672, 321 / 1672], y: [318 / 941, 580 / 941] },
    goal: { x: [600 / 1672, 1120 / 1672], y: [218 / 941, 640 / 941] },
    zoom: 0.6,
    turn: [0.46, 0.92],
    iris: [0.6, 1],
  },
  { kind: 'pan', shift: 0.461, pier: 0.753 },
  { kind: 'pan', shift: 0.415, pier: 0.725 },
  { kind: 'pan', shift: 0.39, pier: 0.755 },
];

/** The next view opening out of the doorway at the end of a push. It first
 * resolves inside the doorway, in place: an ellipse the size of the opening
 * (`door`, in half-openings) fades in over the first `fade` of the move's
 * iris share. It then grows, keeping the opening's proportions. `whole` is
 * the share of its radius that shows the next view fully (the rest is the
 * soft rim), and `growth` shapes how it opens: slowly near the doorway,
 * where the two pictures agree exactly, then outward. Where the wide plate
 * runs out on the side the camera turns to, the next view shows instead,
 * joined over `join` plate widths just inside the wide plate. */
export const ATRIUM_ORBIT_IRIS = {
  door: 1,
  fade: 0.12,
  whole: 0.62,
  growth: 1.7,
  join: [0.008, 0.05],
} as const;

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
 * centre. `scaleY` is its vertical scale where that differs (a doorway seen
 * at an angle widens faster than it grows as the camera turns to face it).
 * `edge` is a soft vertical edge, in shares of the plate's width: the plate
 * is clear at `edge[0]` and whole at `edge[1]`, in either order. `iris` is a
 * soft ellipse the plate shows through as well: centre and radii in shares
 * of the plate's width and height, whole out to `whole` of the radius.
 * Layers never rotate, skew or take perspective. */
export type PlateLayer = {
  opacity: number;
  x: number;
  y: number;
  scale: number;
  scaleY?: number;
  edge: readonly [number, number] | null;
  iris?: PlateIris | null;
};
export type PlateIris = {
  x: number;
  y: number;
  rx: number;
  ry: number;
  whole: number;
  /** How much of the plate the ellipse shows at its centre (0 → 1). */
  alpha: number;
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

/** Wide view → doorway, matched on the doorway itself.
 *
 * The wide plate grows until the doorway's opening is exactly the size it
 * has in the next view: more across than down, because the wide view sees
 * that doorway at an angle and the next view sees it square on. While it
 * grows it stays over the whole stage. The doorway is then where the wide
 * picture allows, which on a wide stage is short of where the next view
 * holds it (the wide picture ends just beside that doorway). So both plates
 * travel the rest together, as one picture joined on the doorway: the camera
 * turning to face it. What the turn uncovers beside the wide plate is the
 * next view itself, joined on the pier they share.
 *
 * The next view lies on top and opens out of the doorway, where the two
 * pictures agree, until it is the whole frame. It never dissolves over the
 * wide plate as a second, displaced picture. */
function push(
  input: PlateTransitionInput,
  shot: Extract<AtriumOrbitShot, { kind: 'push' }>,
): PlateTransitionFrame {
  const { from, to, localProgress, window, layout } = input;
  const e = travel(localProgress);
  const start = plateWindowStart(from, window, layout);
  const goal = plateWindowStart(to, window, layout);
  // A picture's own height is taller than the plate's box on a stage wider
  // than the plate (cover, top-aligned): box share = picture share / height.
  const tall = (y: number) => y / window.height;
  const mid = (range: readonly [number, number]) => (range[0] + range[1]) / 2;
  const zoomX =
    (shot.goal.x[1] - shot.goal.x[0]) / (shot.door.x[1] - shot.door.x[0]);
  const zoomY =
    (shot.goal.y[1] - shot.goal.y[0]) / (shot.door.y[1] - shot.door.y[0]);
  const grown = editorial(unit(e / shot.zoom));
  const scale = Math.exp(Math.log(zoomX) * grown);
  const scaleY = Math.exp(Math.log(zoomY) * grown);
  const roomX = 0.5 * (zoomX - 1);
  const roomY = 0.5 * (zoomY - 1);
  // Where the wide plate must stand, fully grown, for the two openings to
  // coincide; and the nearest place to it that still covers the stage.
  const matchX =
    mid(shot.goal.x) - goal - 0.5 - (mid(shot.door.x) - 0.5) * zoomX;
  const coverX = clamp(matchX, window.width - 1 - roomX, roomX);
  const y = clamp(
    tall(mid(shot.goal.y)) - 0.5 - (tall(mid(shot.door.y)) - 0.5) * zoomY,
    -roomY,
    roomY,
  );
  // The rest of the way is travelled by both plates together.
  const turn = (matchX - coverX) * (1 - editorial(span(e, ...shot.turn)));
  const wide: PlateLayer = {
    opacity: 1,
    x:
      mix(-start, coverX, (scale - 1) / (zoomX - 1)) + (matchX - coverX) - turn,
    y: y * ((scaleY - 1) / (zoomY - 1)),
    scale,
    scaleY,
    edge: null,
  };
  const next: PlateLayer = {
    ...plateRest(to, window, layout),
    x: -goal - turn,
  };
  // The next view opens out of the doorway. Its ellipse keeps the opening's
  // proportions and ends by holding the whole stage inside its solid part.
  const { door, fade, whole, growth, join } = ATRIUM_ORBIT_IRIS;
  const centre = { x: mid(shot.goal.x), y: tall(mid(shot.goal.y)) };
  const half = {
    x: (shot.goal.x[1] - shot.goal.x[0]) / 2,
    y: tall(shot.goal.y[1] - shot.goal.y[0]) / 2,
  };
  const stageLeft = -next.x;
  const stageRight = stageLeft + window.width;
  const corner = Math.max(
    ...[stageLeft, stageRight].flatMap((cx) =>
      [0, 1].map((cy) =>
        Math.hypot((cx - centre.x) / half.x, (cy - centre.y) / half.y),
      ),
    ),
  );
  // While the plates turn, the ellipse grows only as far as fits inside the
  // next plate, whose own edge may still be on stage; once the turn has
  // brought that plate over the whole stage, it opens to the corners.
  const full = (corner * 1.02) / whole;
  const fits = Math.max(
    door,
    Math.min(full, (1 - centre.x) / half.x, centre.x / half.x),
  );
  const resolved = shot.iris[0] + fade;
  const alpha = editorial(span(e, shot.iris[0], resolved));
  const reach =
    alpha > 0
      ? door +
        (fits - door) * span(e, resolved, shot.turn[1]) ** growth +
        (full - fits) * editorial(span(e, shot.turn[1], shot.iris[1]))
      : 0;
  // What the turn uncovers beside the wide plate: where that plate ends on
  // stage. There the next view shows instead, joined softly just inside the
  // wide plate. The join opens from nothing as the plate's end comes on
  // stage, so it never appears at once.
  const end = 0.5 - 0.5 * scale + wide.x;
  const soft = unit(end / join[1]);
  const edge: PlateLayer['edge'] =
    end > 0
      ? [end - next.x + join[1] * soft, end - next.x + join[0] * soft]
      : null;
  const shown = reach > 0 || edge !== null;
  return {
    from: wide,
    to: shown
      ? {
          ...next,
          edge,
          iris:
            reach > 0
              ? {
                  x: centre.x,
                  y: centre.y,
                  rx: half.x * reach,
                  ry: half.y * reach,
                  whole,
                  alpha,
                }
              : null,
        }
      : HIDDEN,
    over: 'to',
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
