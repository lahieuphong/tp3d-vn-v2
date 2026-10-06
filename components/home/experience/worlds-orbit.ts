import { MOTION, unit, span, editorial, motionProfile } from './home-motion';

/** TP3D PASS — Atrium room orbit. After the approved Atrium has settled, an
 * appended span of native scroll carries the four room portals around the
 * Atrium's central axis (oculus → tree → circular planter). The photograph
 * never rotates: it stays the architectural ground plane and only breathes a
 * little toward the focused doorway. Pure: no DOM, no clock, no memory; the
 * same progress always gives the same frame. */

/** The scene plate (`worlds-atrium`), measured on its 1672×941 source.
 * `pivot` is the centre of the planter's outer bronze ring (leftmost point
 * 346,663, rightmost 1327,668), directly below the oculus centre (836,110).
 * `axis` is the tree and stone mass the orbit circles. Doorway centres are the
 * midpoints between each opening's jambs and between lintel and threshold. */
export const ATRIUM_SOURCE = {
  width: MOTION.camera.source.width,
  height: MOTION.camera.source.height,
  pivot: { x: 836, y: 665 },
  axis: { x: 836, y: 470 },
} as const;

/** The homepage Atrium shortcuts in their fixed order (the ids of
 * `worldsChapterOptions`). Not the rooms of /world. */
export const ORBIT_ROOMS = [
  'living',
  'bedroom',
  'bathroom',
  'kitchen',
] as const;
export type OrbitRoom = (typeof ORBIT_ROOMS)[number];

export const ORBIT_DOORWAYS: Record<OrbitRoom, { x: number; y: number }> = {
  living: { x: 223, y: 451 },
  bedroom: { x: 557, y: 461 },
  bathroom: { x: 1120, y: 460 },
  kitchen: { x: 1488, y: 462 },
};

export type OrbitTier =
  | 'desktop'
  | 'tablet'
  | 'mobile'
  | 'landscape'
  | 'reduced';
type Shape = {
  /** Ellipse centre height (share of viewport height); x follows the axis. */
  centreY: number;
  /** Radii as shares of viewport width and height. */
  radiusX: number;
  radiusY: number;
  /** Portal aperture width (px) at scale 1 (the CSS --portal-size). */
  portal: number;
  /** The aperture's bottom margin and the number line above the title (px),
   * and the title's size: the CSS that lays out a portal's label. */
  label: number;
  title: readonly [number, number, number];
  scale: readonly [number, number];
  opacity: readonly [number, number];
  /** Rear blur (px); the front is always sharp. */
  blur: number;
  /** Share of the desktop camera breath. */
  camera: number;
};

export const ORBIT = {
  // Orbit progress (0–1 of the appended span). 0–0.04 is the approved
  // settled Atrium, untouched. The lintel labels then fade, switch to portal
  // layout while invisible (no jump) and fade back in on the ellipse.
  labelsOut: [0.04, 0.08],
  portalsIn: [0.08, 0.16],
  // Rotations between the four focus holds: focus → rotate → focus …
  // Each hold is a plateau while native scroll continues; nothing snaps.
  turns: [
    [0.22, 0.36],
    [0.44, 0.58],
    [0.66, 0.8],
  ],
  // The camera breath and doorway exposure arrive with the portals.
  presence: [0.08, 0.18],
  // ENTER THE WORLD quietens while rooms are explored and becomes the
  // primary action again once Kitchen, the last room, has settled.
  gatewayQuiet: [0.08, 0.14],
  gatewayReturn: [0.82, 0.92],
  gatewayRest: 0.45,
  // The camera breath (desktop): at most 1.8% scale and 2.5vw / 1.5vh of
  // translation, always inside the plate (no edge ever exposed).
  breath: 0.018,
  pull: 0.05,
  maxShiftX: 0.025,
  maxShiftY: 0.015,
  // Doorway exposure strength (multiplies the CSS field).
  focus: 1,
  shapes: {
    desktop: {
      centreY: 0.5,
      radiusX: 0.3,
      radiusY: 0.18,
      portal: 96,
      label: 28,
      title: [22, 0.0155, 34],
      scale: [0.72, 1.12],
      opacity: [0.4, 1],
      blur: 1.2,
      camera: 1,
    },
    tablet: {
      centreY: 0.44,
      radiusX: 0.27,
      radiusY: 0.12,
      portal: 80,
      label: 28,
      title: [24, 0, 24],
      scale: [0.78, 1.06],
      opacity: [0.45, 1],
      blur: 1,
      camera: 0.7,
    },
    mobile: {
      centreY: 0.215,
      radiusX: 0.3,
      radiusY: 0.045,
      portal: 50,
      label: 18,
      title: [17, 0, 17],
      scale: [0.8, 1.04],
      opacity: [0.5, 1],
      blur: 0.8,
      camera: 0.5,
    },
    landscape: {
      centreY: 0.4,
      radiusX: 0.15,
      radiusY: 0.1,
      portal: 42,
      label: 16,
      title: [16, 0, 16],
      scale: [0.8, 1.04],
      opacity: [0.5, 1],
      blur: 0.8,
      camera: 0.6,
    },
  } satisfies Record<Exclude<OrbitTier, 'reduced'>, Shape>,
} as const;

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

type Point = { x: number; y: number };
/** A viewport box (px): copy, gateway and baseline the portals keep clear of. */
export type Box = { x0: number; y0: number; x1: number; y1: number };
/** The fitted ellipse (viewport px) and how much it had to give way. */
export type OrbitLayout = {
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
  /** Share of the nominal radii kept, and the lift of the centre (share of
   * viewport height). 1 and 0 mean the nominal ellipse fitted as designed. */
  fit: number;
  lift: number;
  fallback: boolean;
};
export type OrbitGeometry = {
  width: number;
  height: number;
  cover: number;
  left: number;
  pivot: Point;
  axis: Point;
  doorways: Record<OrbitRoom, Point>;
  layout: OrbitLayout;
};

const shapeFor = (tier: OrbitTier) =>
  tier === 'reduced' ? ORBIT.shapes.desktop : ORBIT.shapes[tier];

/** The box a portal occupies at one angle on one ellipse: its arched
 * aperture (4:5) with the number and title beneath, at its depth scale. */
export function portalBox(
  layout: Pick<OrbitLayout, 'x' | 'y' | 'radiusX' | 'radiusY'>,
  angle: number,
  width: number,
  tier: OrbitTier,
): Box {
  const shape = shapeFor(tier);
  const depth = (Math.sin(angle) + 1) / 2;
  const scale = shape.scale[0] + (shape.scale[1] - shape.scale[0]) * depth;
  const [low, vw, high] = shape.title;
  const title = Math.min(high, Math.max(low, vw * width));
  const boxWidth = Math.max(shape.portal, 4.6 * title, 62) * scale;
  const x = layout.x + Math.cos(angle) * layout.radiusX;
  const y = layout.y + Math.sin(angle) * layout.radiusY;
  const top = y - 0.625 * shape.portal * scale;
  return {
    x0: x - boxWidth / 2,
    x1: x + boxWidth / 2,
    y0: top,
    y1: top + (1.25 * shape.portal + shape.label + title) * scale,
  };
}

/** The largest ellipse around the axis whose portals, at every angle, stay
 * in the viewport, below the header and clear of the copy and the gateway.
 * The centre lifts first (up to a fifth of the viewport), then the radii
 * shrink (to half). Pure and measured once per layout, never per frame. */
export function fitOrbit(
  base: Omit<OrbitGeometry, 'layout'>,
  tier: OrbitTier,
  avoid: readonly Box[] = [],
  header = 0,
): OrbitLayout {
  const shape = shapeFor(tier);
  const { width, height } = base;
  const pad = 10;
  const clear = (layout: OrbitLayout) => {
    for (let i = 0; i < 72; i++) {
      const box = portalBox(layout, (i / 72) * 2 * Math.PI, width, tier);
      if (box.x0 < 8 || box.x1 > width - 8) return false;
      if (box.y0 < header + 6 || box.y1 > height - 8) return false;
      for (const a of avoid)
        if (
          box.x0 < a.x1 + pad &&
          box.x1 > a.x0 - pad &&
          box.y0 < a.y1 + pad &&
          box.y1 > a.y0 - pad
        )
          return false;
    }
    return true;
  };
  const at = (fit: number, lift: number, fallback = false): OrbitLayout => ({
    x: base.axis.x,
    y: (shape.centreY - lift) * height,
    radiusX: shape.radiusX * width * fit,
    radiusY: shape.radiusY * height * fit,
    fit,
    lift,
    fallback,
  });
  for (let k = 20; k >= 10; k--)
    for (let l = 0; l <= 20; l++) {
      const layout = at(k / 20, l / 100);
      if (clear(layout)) return layout;
    }
  return at(0.5, 0, true);
}

/** The plate's object-fit: cover, top-aligned (51% on phones, as the CSS and
 * the arrival's `measureAtrium`). Source points become viewport points. */
export function measureWorldsOrbit(
  width: number,
  height: number,
  avoid: readonly Box[] = [],
  header = 0,
): OrbitGeometry {
  const { width: sw, height: sh } = ATRIUM_SOURCE;
  const cover = Math.max(width / sw, height / sh);
  const mobile = motionProfile(width).family === 'mobile';
  const left = (width - sw * cover) * (mobile ? 0.51 : 0.5);
  const place = (point: Point) => ({
    x: left + point.x * cover,
    y: point.y * cover,
  });
  const base = {
    width,
    height,
    cover,
    left,
    pivot: place(ATRIUM_SOURCE.pivot),
    axis: place(ATRIUM_SOURCE.axis),
    doorways: Object.fromEntries(
      ORBIT_ROOMS.map((room) => [room, place(ORBIT_DOORWAYS[room])]),
    ) as Record<OrbitRoom, Point>,
  };
  return {
    ...base,
    layout: fitOrbit(base, orbitTier(width, height, false), avoid, header),
  };
}

/** The focus index (0 Living … 3 Kitchen) for one progress: plateaus joined
 * by slow-in, slow-out turns, never a constant spin. */
export function orbitFocus(progress: number) {
  const o = unit(progress);
  return ORBIT.turns.reduce(
    (focus, [start, end]) => focus + editorial(span(o, start, end)),
    0,
  );
}

export type OrbitPortal = {
  room: OrbitRoom;
  /** Aperture centre in viewport px. */
  x: number;
  y: number;
  /** 0 rear … 1 front. */
  depth: number;
  scale: number;
  opacity: number;
  blur: number;
  z: number;
};
export type WorldsOrbitFrame = {
  progress: number;
  phase: 'overview' | 'leaving' | 'orbit';
  /** Portal layout is on (the lintel labels have left). */
  orbit: boolean;
  focus: number;
  activeRoom: OrbitRoom | null;
  /** Opacity of the lintel labels before the switch. */
  labels: number;
  portal: number;
  portals: Record<OrbitRoom, OrbitPortal>;
  /** Camera about the pivot; the projected pivot drifts by (cameraX, cameraY). */
  cameraScale: number;
  cameraX: number;
  cameraY: number;
  pivotX: number;
  pivotY: number;
  /** The doorway exposure field, in rest (camera-local) px. */
  focusX: number;
  focusY: number;
  focusOpacity: number;
  gatewayOpacity: number;
};

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** One orbit frame for one progress. */
export function worldsOrbitFrame(
  progress: number,
  g: OrbitGeometry,
  tier: OrbitTier,
): WorldsOrbitFrame {
  const o = tier === 'reduced' ? 0 : unit(progress);
  const shape = shapeFor(tier);
  const labels = 1 - editorial(span(o, ...ORBIT.labelsOut));
  const orbit = tier !== 'reduced' && o >= ORBIT.labelsOut[1];
  const appear = orbit ? editorial(span(o, ...ORBIT.portalsIn)) : 0;
  const presence = editorial(span(o, ...ORBIT.presence));
  const focus = orbitFocus(o);
  const activeIndex = Math.round(focus);
  // The focused doorway: between two rooms it travels with the turn.
  const from = Math.floor(focus),
    to = Math.min(ORBIT_ROOMS.length - 1, from + 1),
    share = focus - from;
  const door = {
    x: mix(
      g.doorways[ORBIT_ROOMS[from]].x,
      g.doorways[ORBIT_ROOMS[to]].x,
      share,
    ),
    y: mix(
      g.doorways[ORBIT_ROOMS[from]].y,
      g.doorways[ORBIT_ROOMS[to]].y,
      share,
    ),
  };
  // Camera breath: a tiny scale about the pivot and a lean toward the door,
  // bounded by the scale's own edge margin so the plate always covers.
  const amount = presence * shape.camera;
  const scale = 1 + ORBIT.breath * amount;
  const bound = (value: number, low: number, high: number) =>
    Math.min(high, Math.max(low, value));
  const cameraX = bound(
    (g.width / 2 - door.x) * ORBIT.pull * amount,
    Math.max(
      -ORBIT.maxShiftX * g.width,
      -0.9 * (scale - 1) * (g.width - g.pivot.x),
    ),
    Math.min(ORBIT.maxShiftX * g.width, 0.9 * (scale - 1) * g.pivot.x),
  );
  const cameraY = bound(
    (g.height / 2 - door.y) * ORBIT.pull * amount,
    Math.max(
      -ORBIT.maxShiftY * g.height,
      -0.9 * (scale - 1) * (g.height - g.pivot.y),
    ),
    Math.min(ORBIT.maxShiftY * g.height, 0.9 * (scale - 1) * g.pivot.y),
  );
  // The fitted ellipse is centred on the projected axis, through the same
  // camera breath.
  const centre = {
    x: g.pivot.x + scale * (g.layout.x - g.pivot.x) + cameraX,
    y: g.layout.y + cameraY,
  };
  const portals = Object.fromEntries(
    ORBIT_ROOMS.map((room, index) => {
      // Front is the bottom of the ellipse (angle π/2); each step is 90°.
      const angle = Math.PI / 2 + (index - focus) * (Math.PI / 2);
      const depth = (Math.sin(angle) + 1) / 2;
      return [
        room,
        {
          room,
          x: centre.x + Math.cos(angle) * g.layout.radiusX,
          y: centre.y + Math.sin(angle) * g.layout.radiusY,
          depth,
          scale:
            mix(shape.scale[0], shape.scale[1], depth) * mix(0.94, 1, appear),
          opacity: mix(shape.opacity[0], shape.opacity[1], depth) * appear,
          blur: depth >= 0.85 ? 0 : shape.blur * (1 - depth),
          z: 1 + Math.round(depth * 10),
        } satisfies OrbitPortal,
      ];
    }),
  ) as Record<OrbitRoom, OrbitPortal>;
  const gatewayOpacity =
    1 -
    (1 - ORBIT.gatewayRest) *
      editorial(span(o, ...ORBIT.gatewayQuiet)) *
      (1 - editorial(span(o, ...ORBIT.gatewayReturn)));
  return {
    progress: o,
    phase: o <= ORBIT.labelsOut[0] ? 'overview' : orbit ? 'orbit' : 'leaving',
    orbit,
    focus,
    activeRoom: orbit ? ORBIT_ROOMS[activeIndex] : null,
    labels,
    portal: appear,
    portals,
    cameraScale: scale,
    cameraX,
    cameraY,
    pivotX: g.pivot.x,
    pivotY: g.pivot.y,
    focusX: door.x,
    focusY: door.y,
    focusOpacity: presence * ORBIT.focus,
    gatewayOpacity,
  };
}

/** The orbit camera expressed about another transform origin (the arrival's
 * sky point), so the one camera keeps one origin and one bounded mass. */
export function orbitPose(
  frame: WorldsOrbitFrame,
  originX: number,
  originY: number,
) {
  const s = frame.cameraScale;
  return {
    scale: s,
    x: frame.cameraX + (s - 1) * (originX - frame.pivotX),
    y: frame.cameraY + (s - 1) * (originY - frame.pivotY),
  };
}
