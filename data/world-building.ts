/** TP3D's World: one building entered from the homepage Atrium. This is the
 * single source of truth for the Lobby's spatial directory and the World map
 * every room shares. A future GLB Lobby replaces only the visual layer;
 * routes, room IDs, order and statuses stay here.
 *
 * Rooms open their own route inside the World. Since TP3D PASS 06 the
 * Gallery is a real room (`/world/gallery`, curated in
 * `data/world-gallery.ts`); the full `/worlds` catalogue is reached from
 * inside it and keeps its own URLs.
 *
 * Not the homepage Atrium shortcuts: Living / Bedroom / Bathroom / Kitchen
 * (`data/home-chapters.ts`) are featured shortcuts into current content. The
 * five rooms below are the long-term building directory. Both hierarchies
 * are intended. */

/** The Lobby. Singular on purpose: `/worlds` remains the 3D catalogue. */
export const WORLD_PATH = '/world';

export type WorldRoomId = 'gallery' | 'objects' | 'archive' | 'lab' | 'studio';

/** What kind of wing a room is, independent of whether it is open yet. */
export type WorldRoomType =
  | 'exhibition'
  | 'collection'
  | 'archive'
  | 'experiment'
  | 'studio';

type WorldRoomBase = {
  id: WorldRoomId;
  /** Two-digit position in the building, also its order everywhere. */
  number: string;
  name: string;
  /** One quiet line shown with the name. */
  summary: string;
  /** A sentence for future room pages and metadata. */
  description: string;
  type: WorldRoomType;
  /** Reserved address for a future room page inside the World. */
  futurePath: `/world/${WorldRoomId}`;
};

export type WorldRoom =
  | (WorldRoomBase & {
      status: 'available';
      /** The room's own route inside the World. */
      href: string;
    })
  | (WorldRoomBase & {
      status: 'planned';
      /** Planned wings are never links. */
      href: null;
    });

export const worldRooms: readonly WorldRoom[] = [
  {
    id: 'gallery',
    number: '01',
    name: 'Gallery',
    summary: 'Spatial exhibitions',
    description:
      'A curated exhibition of digital interiors, each one open to explore in 3D.',
    type: 'exhibition',
    status: 'available',
    href: '/world/gallery',
    futurePath: '/world/gallery',
  },
  {
    id: 'objects',
    number: '02',
    name: 'Objects',
    summary: '3D objects & models',
    description:
      'Objects and models to study from every side, and later to collect.',
    type: 'collection',
    status: 'planned',
    href: null,
    futurePath: '/world/objects',
  },
  {
    id: 'archive',
    number: '03',
    name: 'Archive',
    summary: 'Art & cultural memory',
    description: 'Art, craft and cultural memory, kept in three dimensions.',
    type: 'archive',
    status: 'planned',
    href: null,
    futurePath: '/world/archive',
  },
  {
    id: 'lab',
    number: '04',
    name: 'Lab',
    summary: 'Spatial experiments',
    description:
      'Studies in interactive space, light and real-time 3D on the web.',
    type: 'experiment',
    status: 'planned',
    href: null,
    futurePath: '/world/lab',
  },
  {
    id: 'studio',
    number: '05',
    name: 'Studio',
    summary: 'Design & collaboration',
    description: 'Where TP3D works with clients on spaces of their own.',
    type: 'studio',
    status: 'planned',
    href: null,
    futurePath: '/world/studio',
  },
];

/** Quiet status line for a wing that is not open yet. */
export const PLANNED_ROOM_LABEL = 'Opening later';

/** True inside the World, where the editorial header and footer step aside. */
export const isWorldPath = (pathname: string | null) =>
  pathname === WORLD_PATH || !!pathname?.startsWith(`${WORLD_PATH}/`);
