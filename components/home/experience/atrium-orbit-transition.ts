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
      /** Doorway → next doorway, clockwise: both plates travel left
       * together, joined where both show the same thing. `pier` is where
       * the pier between the two doorways stands in the outgoing plate,
       * which is where the join rests; `ties` say how the incoming plate
       * lies on the outgoing one, from where the join enters to where it
       * leaves. */
      kind: 'pan';
      pier: number;
      ties: readonly PlateTie[];
    };

/** The same piece of the scene in two plates. The plates are separate
 * drawings: a doorway, its lintel and its label stand at different places,
 * and at different heights, in each. A tie says how the incoming plate must
 * lie on the outgoing one for that piece to coincide. Measured on the
 * pictures, in px of 1672 × 941.
 *   at     where the join is on the outgoing plate (x) when this tie holds;
 *   shift  how far right the incoming plate lies there (x);
 *   high   one height of that piece, on the outgoing plate and on the
 *          incoming one (the label's middle, or the lintel);
 *   low    another, lower one (the floor at the doorway). */
export type PlateTie = {
  at: number;
  shift: number;
  high: readonly [number, number];
  low: readonly [number, number];
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
  {
    // Living → Bedroom. In the order the join passes them: the next
    // doorway's name and number as the outgoing view shows them at its
    // right edge; the pier between the two doorways (the outgoing lintel
    // and floor on its left, the incoming ones on its right); then the name
    // and number of the doorway being left, as the incoming view shows them
    // at its left edge. A label is drawn at another size and slant in each
    // view, so its name and its number are tied one by one.
    kind: 'pan',
    pier: 0.753,
    ties: [
      { at: 1605, shift: 741.4, high: [159, 166.1], low: [649, 662] },
      { at: 1476, shift: 735.7, high: [160, 149.9], low: [649, 662] },
      { at: 1259, shift: 771.5, high: [235, 212], low: [650, 662] },
      { at: 871, shift: 726.5, high: [150, 158.5], low: [650, 627] },
      { at: 742, shift: 680.9, high: [132, 126.7], low: [650, 627] },
    ],
  },
  {
    // Bedroom → Bathroom. The tree stands in front of the wall between
    // them in both views, so only the labels and the doors' own frames tie.
    kind: 'pan',
    pier: 0.725,
    ties: [
      { at: 1613, shift: 661.9, high: [188, 165.6], low: [679, 659] },
      { at: 1509, shift: 672.8, high: [196, 162.7], low: [679, 659] },
      { at: 1212, shift: 690, high: [257, 227], low: [679, 659] },
      { at: 881, shift: 720.6, high: [168, 129.9], low: [679, 644] },
      { at: 739, shift: 695.5, high: [150, 109], low: [679, 644] },
    ],
  },
  {
    // Bathroom → Kitchen.
    kind: 'pan',
    pier: 0.755,
    ties: [
      { at: 1567.5, shift: 607.8, high: [118, 151.4], low: [662, 657] },
      { at: 1449, shift: 612, high: [133, 148.1], low: [662, 657] },
      { at: 1262, shift: 654, high: [213, 226], low: [648, 657] },
      { at: 967.5, shift: 576.9, high: [158, 166.8], low: [648, 657] },
      { at: 837, shift: 568.6, high: [164, 151.8], low: [648, 657] },
    ],
  },
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
 * (plate widths): narrow, because the two drawings agree on the join itself
 * and less and less away from it (a label blended across a wide join shows
 * twice). It is never more than the join's distance from the stage's nearer
 * side, so a plate comes into view, and goes, as a soft sliver. It
 * comes in from the edge, rests on the pier for the `dwell` share of the
 * move, and leaves by the other edge. `settle` is the share at each end over
 * which the plate that fills the stage takes up, or gives back, its half of
 * the fit down the picture, so each view begins and ends exactly at rest. */
export const ATRIUM_ORBIT_SEAM = {
  feather: 0.025,
  dwell: [0.28, 0.72],
  settle: 0.1,
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

const PLATE_PX = { width: 1672, height: 941 } as const;

/** How the incoming plate lies on the outgoing one while the join is at
 * `at` (a share of the outgoing plate's width): shifted right by `shift`
 * plate widths, and down the picture `y → grow · y + drop` (shares of the
 * picture's height). Between two ties it changes smoothly; past the first
 * or the last it stays. */
function tieAt(ties: readonly PlateTie[], at: number) {
  const read = ({ shift, high, low }: PlateTie) => {
    const grow = (low[0] - high[0]) / (low[1] - high[1]);
    return {
      shift: shift / PLATE_PX.width,
      grow,
      drop: (high[0] - grow * high[1]) / PLATE_PX.height,
    };
  };
  const x = at * PLATE_PX.width;
  // Ties run from where the join enters (largest `at`) to where it leaves.
  let i = 0;
  while (i < ties.length - 2 && x < ties[i + 1].at) i++;
  const [a, b] = [ties[i], ties[Math.min(i + 1, ties.length - 1)]];
  const t = a.at === b.at ? 0 : editorial(unit((a.at - x) / (a.at - b.at)));
  const [p, q] = [read(a), read(b)];
  return {
    shift: mix(p.shift, q.shift, t),
    grow: Math.exp(mix(Math.log(p.grow), Math.log(q.grow), t)),
    drop: mix(p.drop, q.drop, t),
  };
}

/** A share `t` of the way along `y → grow · y + drop` (t = 1 is the map
 * itself, t = 0 leaves the plate alone, t < 0 goes the other way). */
function part(grow: number, drop: number, t: number) {
  const scale = grow ** t;
  const step = Math.abs(grow - 1) < 1e-9 ? t : (scale - 1) / (grow - 1);
  return { scale, offset: drop * step };
}

/** The least by which a reversed edge's two ends differ: as a line it is
 * still reversed, so it stays whole on its left. */
const LINE = 1e-7;

/** Doorway → next doorway, matched where the two plates are joined.
 *
 * Both plates travel left together and are joined by a soft edge. That join
 * enters by the edge the camera turns to, rests on the pier the two doorways
 * share, and leaves by the other edge.
 *
 * The plates are separate drawings of one room, so the same doorway, lintel
 * and label stand at different places and heights in each. Wherever the join
 * is, the two plates are therefore fitted to each other at that spot
 * (`ties`): shifted, and stretched down the picture, until the piece under
 * the join coincides. That holds from the first sliver of the incoming plate
 * to the last sliver of the outgoing one: lines run straight through the
 * join, and a label stands at one place and one height (its letters still
 * differ between the two drawings, which blend while the join is on it).
 *
 * Across, the two keep the fitted distance: the outgoing plate begins on
 * its own even travel, the incoming one ends on its own, and in between the
 * pair goes over from one to the other. Down the picture the two always
 * differ by the whole fit, and share it out between them: the outgoing plate
 * starts at rest (the incoming sliver carries it all), each carries half
 * through the middle, and the incoming plate ends at rest. Each view so
 * begins and ends exactly as it is held.
 *
 * A plate moved or shortened no longer reaches the stage's top or bottom, so
 * both share a few percent of zoom about the stage's centre, enough to keep
 * the plate that fills the stage over all of it. The sliver at either end is
 * not zoomed for: it lies on top, and where it stops short the plate beneath
 * it shows. So the incoming plate is on top for the first half and the
 * outgoing one for the second; with the same join between them, the change
 * of order draws the same picture. */
function pan(
  input: PlateTransitionInput,
  shot: Extract<AtriumOrbitShot, { kind: 'pan' }>,
): PlateTransitionFrame {
  const { from, to, localProgress, window, layout } = input;
  const { feather, dwell, settle } = ATRIUM_ORBIT_SEAM;
  const e = travel(localProgress);
  const start = plateWindowStart(from, window, layout);
  const goal = plateWindowStart(to, window, layout);
  // The join, across the outgoing plate: from the window's leading edge,
  // onto the pier, and out where the incoming plate's window begins (which
  // depends on how that plate lies there, so it is found in a few steps).
  const enter = start + window.width;
  let exit = goal + tieAt(shot.ties, goal).shift;
  for (let i = 0; i < 12; i++) exit = goal + tieAt(shot.ties, exit).shift;
  const pier = clamp(shot.pier, Math.min(enter, exit), Math.max(enter, exit));
  const join =
    e < dwell[0]
      ? mix(enter, pier, editorial(e / dwell[0]))
      : e <= dwell[1]
        ? pier
        : mix(pier, exit, editorial((e - dwell[1]) / (1 - dwell[1])));
  const tie = tieAt(shot.ties, join);
  // Across: each plate has an even travel of its own (the outgoing one from
  // its rest, the incoming one to its rest), and the fitted distance between
  // them changes with the join. The pair goes over from the first travel to
  // the second, so the plate that fills the stage is the one moving evenly.
  const first = tieAt(shot.ties, enter).shift;
  const last = tieAt(shot.ties, exit).shift;
  const outgoingX =
    mix(-start, -goal - last, e) + e * (mix(first, last, e) - tie.shift);
  const incomingX = outgoingX + tie.shift;
  // Down: the outgoing plate's share of the fit runs 0 → -½ → -1 and the
  // incoming plate's is always one more, so between them the fit is whole.
  const arrived = editorial(unit(e / settle));
  const staying = editorial(unit((1 - e) / settle));
  const share = -0.5 * arrived - 0.5 * (1 - staying);
  const outgoing = part(tie.grow, tie.drop, share);
  const incoming = part(tie.grow, tie.drop, share + 1);
  // A zoom about the stage's centre, shared by both plates, keeps the plate
  // that fills the stage over its whole height.
  const reach = (down: { scale: number; offset: number }) => {
    const top = down.offset / window.height;
    const bottom = down.scale + top;
    return Math.max(
      1,
      top > 0 ? 0.5 / (0.5 - top) : 1,
      bottom < 1 ? 0.5 / (bottom - 0.5) : 1,
    );
  };
  const zoom =
    1 +
    Math.max((reach(outgoing) - 1) * staying, (reach(incoming) - 1) * arrived);
  const centre = window.width / 2;
  const pose = (x: number, down: { scale: number; offset: number }) => ({
    opacity: 1,
    x: zoom * x + centre * (1 - zoom) - 0.5 + 0.5 * zoom,
    y: zoom * (down.offset / window.height + 0.5 * (down.scale - 1)),
    scale: zoom,
    scaleY: zoom * down.scale,
  });
  // Soft only where both plates exist, and no wider than what the stage
  // shows of either plate beside the join.
  const shownFrom = -outgoingX + (centre * (zoom - 1)) / zoom;
  const shownTo = -outgoingX + (centre * (zoom + 1)) / zoom;
  const soft = Math.max(
    0,
    Math.min(
      feather,
      join - tie.shift,
      1 - join,
      join - shownFrom,
      shownTo - join,
    ),
  );
  // The plate on top carries the join: the incoming one whole on its right,
  // the outgoing one (a reversed edge) whole on its left.
  const early = e < 0.5;
  return {
    from: {
      ...pose(outgoingX, outgoing),
      edge: early ? null : [join + soft + LINE, join - soft],
    },
    to: {
      ...pose(incomingX, incoming),
      edge: early ? [join - soft - tie.shift, join + soft - tie.shift] : null,
    },
    over: early ? 'to' : 'from',
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
