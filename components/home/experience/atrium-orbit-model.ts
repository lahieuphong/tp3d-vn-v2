/** TP3D PASS 6A — Tier B room orbit: the canonical model.
 *
 * Dormant infrastructure. Only the development / preview shell
 * (`atrium-orbit-controller.ts`, behind `?atriumOrbit=1`) reads it; the
 * production homepage still runs the approved Scene 3.
 *
 * One Atrium, one camera, five camera states in one fixed clockwise order.
 * Arrival is a transitional state (sky → oculus → Atrium → Living) with no
 * editorial UI and no public room count. The four rooms are the editorial
 * destinations 01–04. See docs/TANPHONG_ATRIUM_ORBIT_ASSET_SPEC.md. */

export const ATRIUM_ORBIT_STATES = [
  'arrival',
  'living',
  'bedroom',
  'bathroom',
  'kitchen',
] as const;
export type AtriumOrbitStateId = (typeof ATRIUM_ORBIT_STATES)[number];
export type AtriumRoomId = Exclude<AtriumOrbitStateId, 'arrival'>;

/** The editorial destinations, in order. These ids are the homepage room
 * links' `data-room` values (`worldsChapterOptions`). */
export const ATRIUM_ROOMS = [
  'living',
  'bedroom',
  'bathroom',
  'kitchen',
] as const satisfies readonly AtriumRoomId[];

/** Camera transitions in travel order (one clockwise orbit). */
export const ATRIUM_ORBIT_TRANSITIONS = [
  { from: 'arrival', to: 'living' },
  { from: 'living', to: 'bedroom' },
  { from: 'bedroom', to: 'bathroom' },
  { from: 'bathroom', to: 'kitchen' },
] as const satisfies readonly {
  from: AtriumOrbitStateId;
  to: AtriumOrbitStateId;
}[];
export type AtriumOrbitTransition = (typeof ATRIUM_ORBIT_TRANSITIONS)[number];

/** The stable first word of every room title; only the phrase changes. */
export const ATRIUM_ORBIT_TITLE_LEAD = 'Enter';

export type AtriumRoomEditorial = {
  /** 1–4, the public room number. */
  number: number;
  /** "01 / 04" */
  counter: string;
  /** The room's name, as on its architectural label. */
  label: string;
  /** The changing part of the title, after "Enter". */
  phrase: string;
};

export type AtriumOrbitState = {
  id: AtriumOrbitStateId;
  /** 0 = Arrival … 4 = Kitchen. */
  index: number;
  /** The room whose link carries the CTA route; null for Arrival. */
  room: AtriumRoomId | null;
  /** null for Arrival: transitional, no editorial UI, no public count. */
  editorial: AtriumRoomEditorial | null;
};

const LABELS: Record<AtriumRoomId, { label: string; phrase: string }> = {
  living: { label: 'Living', phrase: 'the living room.' },
  bedroom: { label: 'Bedroom', phrase: 'the bedroom.' },
  bathroom: { label: 'Bathroom', phrase: 'the bathroom.' },
  kitchen: { label: 'Kitchen', phrase: 'the kitchen.' },
};

const pad = (n: number) => String(n).padStart(2, '0');

export const ATRIUM_ORBIT_STATE_MAP: Record<
  AtriumOrbitStateId,
  AtriumOrbitState
> = Object.fromEntries(
  ATRIUM_ORBIT_STATES.map((id, index) => {
    if (id === 'arrival')
      return [id, { id, index, room: null, editorial: null }];
    const number = ATRIUM_ROOMS.indexOf(id) + 1;
    return [
      id,
      {
        id,
        index,
        room: id,
        editorial: {
          number,
          counter: `${pad(number)} / ${pad(ATRIUM_ROOMS.length)}`,
          ...LABELS[id],
        },
      },
    ];
  }),
) as Record<AtriumOrbitStateId, AtriumOrbitState>;

export const atriumOrbitState = (id: AtriumOrbitStateId) =>
  ATRIUM_ORBIT_STATE_MAP[id];

/** The previous / next state in the canonical order (null at the ends). */
export function atriumOrbitNeighbours(id: AtriumOrbitStateId) {
  const index = ATRIUM_ORBIT_STATES.indexOf(id);
  return {
    previous: index > 0 ? ATRIUM_ORBIT_STATES[index - 1] : null,
    next:
      index < ATRIUM_ORBIT_STATES.length - 1
        ? ATRIUM_ORBIT_STATES[index + 1]
        : null,
  };
}
