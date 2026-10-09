import type { AtriumOrbitStateId, AtriumRoomId } from './atrium-orbit-model';
import { ATRIUM_ORBIT_COMP } from './atrium-orbit-manifest';
import { ATRIUM_ORBIT_SHOTS } from './atrium-orbit-transition';

/** The Atrium's doors (owner decision, 2026-10-09): the four rooms stand
 * behind closed doors. The doors are shut wherever the Atrium shows, from
 * the first sight of it out of the oculus to the end of the room orbit, and
 * a door opens only when it is chosen, which is how a room is entered
 * (room-door-entry.ts). (The first version let the doors come down as the
 * Atrium arrived, so the rooms were seen open once; the owner asked the
 * same evening that they never be.)
 *
 * A door is a leaf drawn into its doorway on the plate: a screen of vertical
 * walnut battens, the material of the fluted jambs beside it. The leaves of a
 * plate are one transparent picture laid on that plate
 * (`work/atrium-orbit/comp-plates/doors.mjs`, outside Git, draws them from
 * the outlines below), shown through the leaves' outlines. A leaf opens by
 * rising into its lintel: its outline's lower edge is raised, and because
 * the battens are vertical that is exactly a screen sliding up. Nothing here
 * knows time or the story position: only the entry raises a leaf.
 *
 * Outlines are px of the plate (1672 × 941), measured on the comp plates and
 * PROVISIONAL like them. */

export type AtriumDoorPoint = readonly [number, number];

/** What stands in front of a doorway and must stay in front of its leaf:
 * a hand-drawn outline, and with `key: 'leaf'` only what is foliage inside
 * it. Read by the script that draws the leaves; the runtime never needs
 * it. */
export type AtriumDoorFront = {
  outline: readonly AtriumDoorPoint[];
  key?: 'leaf';
};

export type AtriumDoor = {
  /** The room this door opens. */
  room: AtriumRoomId;
  /** The lintel's edge over the leaf, left to right. */
  top: readonly AtriumDoorPoint[];
  /** The sill under it: its left end and its right end. */
  sill: readonly [AtriumDoorPoint, AtriumDoorPoint];
  /** For the drawing only. A leaf borrowed from a neighbouring plate is
   * that plate's own leaf, `shift` px across, never a second drawing. */
  from?: { view: AtriumRoomId; shift: number };
  front?: readonly AtriumDoorFront[];
  /** The stretch the battens are counted across, where that is not the
   * leaf's own width. */
  across?: readonly [number, number];
  /** How bright the leaf is against the fascia above it (1), and how much
   * of the Atrium's dappled sun reaches it (1). */
  shade?: number;
  sun?: number;
};

/** Battens across a leaf. One number for every door: they are one design,
 * and the wide Atrium's Living leaf must lie on the Living view's own when
 * the camera pushes onto it. */
export const ATRIUM_ORBIT_DOOR_BATTENS = 28;

const [WIDTH, HEIGHT] = ATRIUM_ORBIT_COMP.intrinsic;

/** A room's own leaf, on its own plate. */
const OWN: Record<AtriumRoomId, Pick<AtriumDoor, 'top' | 'sill'>> = {
  living: {
    top: [
      [599, 199.5],
      [664, 206.3],
      [729, 212.4],
      [794, 217.9],
      [860, 222.8],
      [925, 227.1],
      [990, 230.7],
      [1055, 233.8],
      [1120, 236.2],
    ],
    sill: [
      [599, 648],
      [1120, 638],
    ],
  },
  bedroom: {
    top: [
      [606, 209.7],
      [665, 217.4],
      [724, 224.7],
      [783, 231.5],
      [843, 237.9],
      [902, 243.8],
      [961, 249.3],
      [1020, 254.4],
      [1079, 259.1],
    ],
    sill: [
      [606, 648],
      [1079, 634],
    ],
  },
  bathroom: {
    top: [
      [737, 228],
      [798, 227.6],
      [859, 226.5],
      [920, 224.8],
      [981, 222.4],
      [1042, 219.4],
      [1103, 215.7],
      [1164, 211.3],
    ],
    sill: [
      [737, 623],
      [1164, 628],
    ],
  },
  kitchen: {
    top: [
      [744, 228.5],
      [802, 224.5],
      [859, 219.8],
      [917, 214.4],
      [975, 208.3],
      [1032, 201.6],
      [1090, 194.2],
      [1147, 186.2],
      [1205, 177.4],
    ],
    sill: [
      [744, 600],
      [1205, 630],
    ],
  },
};

/** How far apart two neighbouring plates lie in a pan (px): where a plate
 * shows the doorway beside its own, that is the neighbour's own doorway,
 * this far across. One number with the pan itself. */
const shift = (transition: number) => {
  const shot = ATRIUM_ORBIT_SHOTS[transition];
  return shot?.kind === 'pan' ? Math.round(shot.shift * WIDTH) : 0;
};
/** The opening the push from the wide Atrium lays on the Living view's
 * (px across the wide plate). One measure with the push itself. */
const pushed = (): readonly [number, number] | undefined => {
  const shot = ATRIUM_ORBIT_SHOTS[0];
  return shot?.kind === 'push'
    ? [shot.door.x[0] * WIDTH, shot.door.x[1] * WIDTH]
    : undefined;
};
const borrowed = (
  room: AtriumRoomId,
  view: AtriumRoomId,
  across: number,
): AtriumDoor => ({
  room,
  top: OWN[view].top.map(([x, y]) => [x + across, y] as const),
  sill: [
    [OWN[view].sill[0][0] + across, OWN[view].sill[0][1]],
    [OWN[view].sill[1][0] + across, OWN[view].sill[1][1]],
  ],
  from: { view, shift: across },
});

/** Every door a view shows, in the order the rooms are numbered. */
export const ATRIUM_ORBIT_DOORS: Record<
  AtriumOrbitStateId,
  readonly AtriumDoor[]
> = {
  // The wide Atrium: all four doorways, each seen at its own angle.
  arrival: [
    {
      room: 'living',
      top: [
        // Out to the column: the fluted jamb ends short of the lintel here,
        // and the room's ceiling would show above it.
        [68, 244.3],
        [100, 255.8],
        [137, 269.1],
        [174, 282],
        [211, 294.3],
        [248, 306],
        [285, 317.3],
        [322, 328],
      ],
      sill: [
        [68, 654.4],
        [322, 580],
      ],
      // The battens are counted across the opening the push matches, so
      // they lie on the Living view's own as the camera arrives.
      across: pushed(),
      // The bush at the foot of the column.
      front: [
        {
          outline: [
            [60, 562],
            [72, 556],
            [84, 552],
            [88, 538],
            [97, 535],
            [101, 546],
            [104, 552],
            [106, 562],
            [114, 572],
            [124, 578],
            [131, 586],
            [137, 598],
            [141, 612],
            [150, 620],
            [158, 618],
            [163, 626],
            [172, 628],
            [178, 624],
            [185, 630],
            [188, 640],
            [190, 668],
            [60, 668],
          ],
        },
      ],
    },
    {
      room: 'bedroom',
      top: [
        [443.5, 354],
        [457, 356.5],
        [496, 363.7],
        [536, 370.1],
        [575, 375.7],
        [615, 380.6],
        [654, 384.7],
      ],
      sill: [
        [443.5, 570.6],
        [654, 561],
      ],
    },
    {
      room: 'bathroom',
      top: [
        [1032, 382.9],
        [1072, 379.1],
        [1113, 374.2],
        [1153, 368.4],
        [1194, 361.6],
        [1234, 353.8],
      ],
      sill: [
        [1032, 562],
        [1234, 572],
      ],
      front: [
        {
          outline: [
            [1026, 335],
            [1048, 335],
            [1048, 465],
            [1026, 465],
          ],
          key: 'leaf',
        },
      ],
    },
    {
      room: 'kitchen',
      top: [
        [1372, 324.1],
        [1412, 313.1],
        [1451, 300.9],
        [1491, 287.5],
        [1531, 272.9],
        [1570, 257],
        [1610, 239.9],
      ],
      sill: [
        [1372, 584],
        [1610, 598],
      ],
      front: [
        {
          outline: [
            [1552, 584],
            [1614, 584],
            [1614, 604],
            [1552, 604],
          ],
          key: 'leaf',
        },
      ],
    },
  ],
  living: [
    { room: 'living', ...OWN.living },
    borrowed('bedroom', 'bedroom', shift(1)),
  ],
  bedroom: [
    borrowed('living', 'living', -shift(1)),
    { room: 'bedroom', ...OWN.bedroom },
  ],
  bathroom: [
    { room: 'bathroom', ...OWN.bathroom },
    borrowed('kitchen', 'kitchen', shift(3)),
  ],
  kitchen: [
    { room: 'kitchen', ...OWN.kitchen },
    // The Atrium is round: past the Kitchen stands the Living doorway again,
    // this plate's own drawing of it.
    {
      room: 'living',
      top: [
        [1518, 212],
        [1557, 201.6],
        [1595, 190.7],
        [1634, 179.5],
        [1672, 167.8],
      ],
      sill: [
        [1518, 606],
        [1672, 633],
      ],
    },
  ],
};

/** A leaf's outline on its plate, cut where the plate ends: its two sides
 * (px across), the lintel edge and the sill, each from left to right. */
export type AtriumDoorOutline = {
  left: number;
  right: number;
  top: AtriumDoorPoint[];
  bottom: AtriumDoorPoint[];
};

const heightAt = (points: readonly AtriumDoorPoint[], x: number) => {
  for (let i = 1; i < points.length; i++)
    if (x <= points[i][0] || i === points.length - 1) {
      const [ax, ay] = points[i - 1];
      const [bx, by] = points[i];
      return ay + ((by - ay) * (x - ax)) / (bx - ax);
    }
  return points[0][1];
};

export function doorOutline(door: AtriumDoor): AtriumDoorOutline {
  const left = Math.max(0, door.top[0][0]);
  const right = Math.min(WIDTH, door.top[door.top.length - 1][0]);
  const cut = (points: readonly AtriumDoorPoint[]): AtriumDoorPoint[] => [
    [left, heightAt(points, left)],
    ...points.filter(([x]) => x > left && x < right),
    [right, heightAt(points, right)],
  ];
  return { left, right, top: cut(door.top), bottom: cut(door.sill) };
}

/** The doors a view really shows: a borrowed leaf that the plate's edge cuts
 * off entirely is not one. */
export const atriumDoors = (view: AtriumOrbitStateId) =>
  ATRIUM_ORBIT_DOORS[view].filter((door) => {
    const outline = doorOutline(door);
    return outline.right - outline.left > 1;
  });

/** What a view's leaves show through, as one CSS `polygon()` over the leaf
 * picture's box. `open[room]` is how far that leaf has risen (0 shut, 1
 * gone): the outline's lower edge travels from the sill to the lintel. The
 * leaves are joined into one outline by lines walked there and back, which
 * enclose nothing, and it always has the same number of points, so two of
 * them can be played between. `tall` is the plate window's height: on a
 * stage wider than the plate the picture is taller than its box. */
export function doorsClip(
  view: AtriumOrbitStateId,
  open: Partial<Record<AtriumRoomId, number>>,
  tall = 1,
) {
  const percent = (value: number) => `${(value * 100).toFixed(3)}%`;
  const point = ([x, y]: AtriumDoorPoint) =>
    `${percent(x / WIDTH)} ${percent(y / HEIGHT / tall)}`;
  const leaves = atriumDoors(view).map((door) => {
    const outline = doorOutline(door);
    const risen = Math.min(1, Math.max(0, open[door.room] ?? 0));
    const foot = outline.top.map(
      ([x, y]): AtriumDoorPoint => [
        x,
        y + (heightAt(outline.bottom, x) - y) * (1 - risen),
      ],
    );
    return [...outline.top, ...foot.reverse()];
  });
  if (!leaves.length) return 'none';
  const points = [
    ...leaves.flatMap((leaf) => [...leaf, leaf[0]]),
    // Back along the joins: each is walked twice and encloses nothing.
    ...leaves
      .slice(0, -1)
      .reverse()
      .map((leaf) => leaf[0]),
  ];
  return `polygon(${points.map(point).join(', ')})`;
}

/** The door under a place on a view's picture (shares of its width and
 * height), or null. */
export function doorAt(view: AtriumOrbitStateId, x: number, y: number) {
  const px = x * WIDTH;
  const py = y * HEIGHT;
  for (const door of atriumDoors(view)) {
    const outline = doorOutline(door);
    if (px < outline.left || px > outline.right) continue;
    if (py >= heightAt(outline.top, px) && py <= heightAt(outline.bottom, px))
      return door;
  }
  return null;
}

/** Where a leaf stands on its picture, in shares of the picture: its middle
 * and its size. The entry pushes the camera onto it. */
export function doorFrame(door: AtriumDoor) {
  const outline = doorOutline(door);
  const middle = (outline.left + outline.right) / 2;
  const head = heightAt(outline.top, middle);
  const foot = heightAt(outline.bottom, middle);
  return {
    x: middle / WIDTH,
    y: (head + foot) / 2 / HEIGHT,
    width: (outline.right - outline.left) / WIDTH,
    height: (foot - head) / HEIGHT,
  };
}
