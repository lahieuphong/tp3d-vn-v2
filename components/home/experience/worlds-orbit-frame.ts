import { MOTION, unit, span, editorial, motionProfile } from './home-motion';

/** TP3D PASS 16 — the Atrium orbit. After the approved arrival has settled,
 * an appended span of native scroll turns attention toward each room around
 * the central island. One photographic plate, so this is a 2.5D camera
 * illusion (a restrained pan and scale), never true viewpoint parallax.
 * Pure: no DOM, no clock, no memory. The same progress gives the same frame. */

/** The scene plate (`worlds-atrium.webp`), measured on the 1672×941 source.
 * The pivot is the centre of the pool's outer bronze ring (its leftmost point
 * is at 346,663 and its rightmost at 1327,668): the island's axis on the
 * floor, directly below the oculus centre (836,110) used by the arrival. */
export const ATRIUM_SOURCE = {
  width: MOTION.camera.source.width,
  height: MOTION.camera.source.height,
  pivot: { x: 836, y: 665 },
} as const;

/** The homepage Atrium shortcuts, in their fixed order. These are not the
 * rooms of /world (Gallery, Objects, Archive, Lab, Studio). */
export const ORBIT_ROOMS = [
  'living',
  'bedroom',
  'bathroom',
  'kitchen',
] as const;
export type OrbitRoom = (typeof ORBIT_ROOMS)[number];

/** Doorway centres on the source plate: the midpoint between the two jambs,
 * and between lintel and threshold, of each room's opening. */
export const ORBIT_TARGETS: Record<OrbitRoom, { x: number; y: number }> = {
  living: { x: 223, y: 451 },
  bedroom: { x: 557, y: 461 },
  bathroom: { x: 1120, y: 460 },
  kitchen: { x: 1488, y: 462 },
};

/** The focus caption's words. The shortcut labels keep their own titles. */
export const ORBIT_CAPTIONS: Record<OrbitRoom, string> = {
  living: 'Living Room',
  bedroom: 'Bedroom',
  bathroom: 'Bathroom',
  kitchen: 'Kitchen',
};

export const ORBIT = {
  // Orbit progress (0–1 of the appended span). The approved hold continues
  // until `release[0]`; the World copy then steps back while the camera
  // leaves the overview. Each room holds still for a beat; the camera is
  // back at the overview before the copy returns, and the gateway hold is
  // the last thing before the Footer.
  release: [0.02, 0.08],
  leave: 0.04,
  holds: {
    living: [0.15, 0.22],
    bedroom: [0.31, 0.38],
    bathroom: [0.47, 0.54],
    kitchen: [0.63, 0.7],
  },
  back: 0.82,
  restore: [0.8, 0.88],
  // A room's caption fades in over the last quarter of its approach (camera
  // under 40% of its peak speed) and out over the first quarter of the
  // departure, so typography never sits over a fast camera.
  caption: 0.25,
  // Camera amplitude by tier. Short landscape uses a light tablet amplitude.
  amplitude: { desktop: 1, tablet: 0.7, mobile: 0.5, landscape: 0.6 },
  // Room-focus scale delta on desktop: DEPTH allows at most 4% on a
  // full-bleed plane (design system §8).
  scale: 0.04,
  // Share of the scale's edge margin the pan may use, and of the margin
  // above the pivot used to lift the view toward the doorway band. The
  // plate never shows an edge.
  fill: 0.96,
  lift: 0.5,
  // Roll was evaluated in browser QA and adds nothing on one plate.
  roll: 0,
  // While the orbit owns focus: other room labels, the World copy, the CTA.
  labelRest: 0.32,
  copy: { eyebrow: 0.6, title: 0, body: 0.22, signoff: 0.22 },
  gatewayRest: 0.5,
  // Peripheral exposure on the side the view turns away from.
  shade: 0.85,
} as const;

export type OrbitTier =
  | 'desktop'
  | 'tablet'
  | 'mobile'
  | 'landscape'
  | 'reduced';
export type OrbitPhase = 'overview' | 'release' | 'room' | 'return' | 'gateway';
export type OrbitBeat = 'approach' | 'settle' | 'hold' | 'depart';
type Point = { x: number; y: number };
export type OrbitGeometry = {
  width: number;
  height: number;
  cover: number;
  left: number;
  pivot: Point;
  targets: Record<OrbitRoom, Point>;
};
type Pose = { scale: number; x: number; y: number };

export function orbitTier(
  width: number,
  height: number,
  reduced: boolean,
): OrbitTier {
  if (reduced) return 'reduced';
  if (width < MOTION.breakpoints.desktop && height <= 540 && width > height)
    return 'landscape';
  return motionProfile(width).family as OrbitTier;
}

/** The plate's object-fit: cover, top-aligned (51% on phones, as the CSS and
 * the arrival's `measureAtrium`). Source points become viewport points. */
export function measureOrbit(width: number, height: number): OrbitGeometry {
  const { width: sw, height: sh, pivot } = ATRIUM_SOURCE;
  const cover = Math.max(width / sw, height / sh);
  const mobile = motionProfile(width).family === 'mobile';
  const left = (width - sw * cover) * (mobile ? 0.51 : 0.5);
  const place = (point: Point) => ({
    x: left + point.x * cover,
    y: point.y * cover,
  });
  return {
    width,
    height,
    cover,
    left,
    pivot: place(pivot),
    targets: Object.fromEntries(
      ORBIT_ROOMS.map((room) => [room, place(ORBIT_TARGETS[room])]),
    ) as Record<OrbitRoom, Point>,
  };
}

const reach = (g: OrbitGeometry, axis: 'x' | 'y') =>
  Math.max(
    ...ORBIT_ROOMS.map((r) => Math.abs(g.targets[r][axis] - g.pivot[axis])),
  );

/** Where each room's view rests, scaled about the projected pivot. The pan
 * leans away from the doorway's side by its share of the widest doorway
 * offset, inside the scale's own edge margin, so the island drifts only a
 * little and no plate edge is ever exposed. */
export function roomPose(
  room: OrbitRoom,
  g: OrbitGeometry,
  tier: OrbitTier,
): Pose {
  if (tier === 'reduced') return { scale: 1, x: 0, y: 0 };
  const scale = 1 + ORBIT.scale * ORBIT.amplitude[tier];
  const leanX = (g.targets[room].x - g.pivot.x) / reach(g, 'x');
  const leanY = (g.targets[room].y - g.pivot.y) / reach(g, 'y');
  const marginX = (scale - 1) * (leanX < 0 ? g.pivot.x : g.width - g.pivot.x);
  const marginY = (scale - 1) * (leanY < 0 ? g.pivot.y : g.height - g.pivot.y);
  return {
    scale,
    x: -leanX * ORBIT.fill * marginX,
    y: -leanY * ORBIT.lift * marginY,
  };
}

/** Zero velocity and acceleration at both ends: a doubled editorial curve. */
export const glide = (t: number) => editorial(editorial(unit(t)));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const OVERVIEW: Pose = { scale: 1, x: 0, y: 0 };

type Leg = { from: OrbitRoom | null; to: OrbitRoom | null; t: number };
/** The camera's track: overview → four holds → overview. `null` is the
 * overview. Inside a hold `from` and `to` are the same room; on a leg `t` is
 * its share. The overview legs belong to the first and the last room. */
function leg(progress: number): Leg {
  const h = ORBIT.holds;
  const first = ORBIT_ROOMS[0],
    last = ORBIT_ROOMS[ORBIT_ROOMS.length - 1];
  if (progress < h[first][0])
    return {
      from: null,
      to: first,
      t: span(progress, ORBIT.leave, h[first][0]),
    };
  for (let i = 0; i < ORBIT_ROOMS.length; i++) {
    const room = ORBIT_ROOMS[i];
    const [start, end] = h[room];
    if (progress > end) continue;
    if (progress >= start) return { from: room, to: room, t: 1 };
    const previous = ORBIT_ROOMS[i - 1];
    return {
      from: previous,
      to: room,
      t: span(progress, h[previous][1], start),
    };
  }
  return { from: last, to: null, t: span(progress, h[last][1], ORBIT.back) };
}

export type OrbitFrame = {
  progress: number;
  phase: OrbitPhase;
  beat: OrbitBeat | null;
  activeRoom: OrbitRoom | null;
  cameraX: number;
  cameraY: number;
  cameraScale: number;
  cameraRoll: number;
  pivotX: number;
  pivotY: number;
  moving: boolean;
  roomFocus: Record<OrbitRoom, number>;
  labelOpacity: Record<OrbitRoom, number>;
  labelEmphasis: Record<OrbitRoom, number>;
  overviewOpacity: number;
  copy: Record<keyof typeof ORBIT.copy, number>;
  focusCaptionOpacity: number;
  gatewayOpacity: number;
  shadeLeft: number;
  shadeRight: number;
};

/** One orbit frame for one progress. Transforms are about (pivotX, pivotY):
 * the projected pivot drifts by exactly (cameraX, cameraY). */
export function worldOrbitFrame(
  progress: number,
  geometry: OrbitGeometry,
  tier: OrbitTier,
): OrbitFrame {
  const o = tier === 'reduced' ? 0 : unit(progress);
  const { from, to, t } = leg(o);
  const k = glide(t);
  const pose = (room: OrbitRoom | null) =>
    room ? roomPose(room, geometry, tier) : OVERVIEW;
  const a = pose(from),
    b = pose(to);
  // The orbit owns focus from the release until the copy is fully back.
  const authority =
    editorial(span(o, ...ORBIT.release)) *
    (1 - editorial(span(o, ...ORBIT.restore)));
  const focus = Object.fromEntries(ORBIT_ROOMS.map((r) => [r, 0])) as Record<
    OrbitRoom,
    number
  >;
  // The first room holds focus through the release and the last through
  // the return, so no label dips while the camera leaves or comes back.
  if (from && to) {
    focus[from] += 1 - k;
    focus[to] += k;
  } else if (from ?? to) focus[(from ?? to)!] = 1;
  const activeRoom =
    authority > 0 ? (from && to ? (t < 0.5 ? from : to) : (from ?? to)) : null;
  const travelling = from !== to;
  const share = ORBIT.caption;
  const caption = !travelling
    ? to
      ? 1
      : 0
    : t < 0.5
      ? from
        ? 1 - editorial(span(t, 0, share))
        : 0
      : to
        ? editorial(span(t, 1 - share, 1))
        : 0;
  const cameraX = mix(a.x, b.x, k);
  // The side the view turns away from: the camera's own pan, as a share of
  // the widest room pan, so the shade arrives and leaves with the camera.
  const widest = Math.max(
    ...ORBIT_ROOMS.map((r) => Math.abs(pose(r).x)),
    Number.EPSILON,
  );
  const turn = Math.max(-1, Math.min(1, cameraX / widest));
  const phase: OrbitPhase =
    o <= ORBIT.release[0]
      ? 'overview'
      : o < ORBIT.release[1]
        ? 'release'
        : o <= ORBIT.holds.kitchen[1]
          ? 'room'
          : o < ORBIT.restore[1]
            ? 'return'
            : 'gateway';
  const beat: OrbitBeat | null =
    activeRoom === null
      ? null
      : !travelling
        ? 'hold'
        : activeRoom === from
          ? 'depart'
          : t < 1 - share
            ? 'approach'
            : 'settle';
  const copy = Object.fromEntries(
    Object.entries(ORBIT.copy).map(([role, rest]) => [
      role,
      1 - authority * (1 - rest),
    ]),
  ) as OrbitFrame['copy'];
  return {
    progress: o,
    phase,
    beat,
    activeRoom,
    cameraX,
    cameraY: mix(a.y, b.y, k),
    cameraScale: mix(a.scale, b.scale, k),
    cameraRoll: ORBIT.roll,
    pivotX: geometry.pivot.x,
    pivotY: geometry.pivot.y,
    moving: travelling && t > 0 && t < 1,
    roomFocus: focus,
    labelOpacity: Object.fromEntries(
      ORBIT_ROOMS.map((r) => [
        r,
        1 - authority * (1 - ORBIT.labelRest) * (1 - focus[r]),
      ]),
    ) as Record<OrbitRoom, number>,
    labelEmphasis: Object.fromEntries(
      ORBIT_ROOMS.map((r) => [r, authority * focus[r]]),
    ) as Record<OrbitRoom, number>,
    overviewOpacity: copy.title,
    copy,
    focusCaptionOpacity: authority > 0 ? caption : 0,
    gatewayOpacity: 1 - authority * (1 - ORBIT.gatewayRest),
    shadeLeft: ORBIT.shade * Math.max(0, -turn),
    shadeRight: ORBIT.shade * Math.max(0, turn),
  };
}

/** The orbit camera expressed about another transform origin (the arrival's
 * sky point), so the one camera keeps one origin and one bounded mass. */
export function orbitPose(frame: OrbitFrame, originX: number, originY: number) {
  const s = frame.cameraScale;
  return {
    scale: s,
    x: frame.cameraX + (s - 1) * (originX - frame.pivotX),
    y: frame.cameraY + (s - 1) * (originY - frame.pivotY),
  };
}
