import {
  ATRIUM_ORBIT_STATES,
  atriumOrbitNeighbours,
  atriumOrbitState,
  type AtriumOrbitState,
  type AtriumOrbitStateId,
  type AtriumRoomId,
} from './atrium-orbit-model';
import type { AtriumOrbitPortraitCameraId } from './atrium-orbit-cameras';

/** TP3D PASS 6A — the one place that names Tier B files. Components never
 * write a plate path: they ask this manifest.
 *
 * Storage policy (PASS 6A.95, locked). This manifest points only to
 * optimised WebP derivatives, named
 * `world-atrium-<view>[-portrait][-<width>].webp`; the largest width has no
 * width suffix, as today's `worlds-atrium*.webp` plates.
 * - The studio's lossless PNG / TIFF masters are source artifacts. They stay
 *   outside normal Git and outside `public/`: accepted masters live in the
 *   git-ignored studio workflow (`work/atrium-orbit/studio/final/`) and in
 *   a separate archive.
 * - The approved camera file is handled separately: it is committed at
 *   `data/world-atrium-cameras.json` once Phase 1 is approved (see
 *   `ATRIUM_ORBIT_CAMERA_DATA` below).
 *
 * PASS 6A.5 decision: WebP only, the format `scripts/optimize-images.mjs`
 * already writes. AVIF is not advertised until a pipeline produces it;
 * adding it later is one entry in `formats`, not a change to the room model.
 * The asset spec (§13.3) says the same. */
export const ATRIUM_ORBIT_ASSETS = {
  base: '/images/home-chapters/',
  stem: 'world-atrium',
  /** Runtime formats, preferred first; the last is the <img> fallback.
   * Change the delivered formats here only: a format listed for an
   * available plate must exist for every width. */
  formats: ['webp'],
  widths: {
    desktop: [3344, 2560, 1920, 1280, 720],
    portrait: [1290, 860],
  },
  /** The single file a browser without <picture> support receives. */
  fallbackWidth: { desktop: 1920, portrait: 860 },
  /** Master pixel sizes (spec §13.1): intrinsic size for layout. */
  intrinsic: { desktop: [3344, 1882], portrait: [1290, 2796] },
  /** Phones held upright receive the dedicated portrait view (spec §11). */
  portraitMedia: '(max-width: 767px) and (orientation: portrait)',
  sizes: {
    // As today's Atrium plate: cover-cropped to the viewport height when the
    // viewport is narrower than the plate (1672/941 = 3344/1882).
    desktop: '(max-aspect-ratio: 3344/1882) 178svh, 100vw',
    portrait: '100vw',
  },
  cameras: 'world-atrium-cameras.json',
} as const;

export type AtriumOrbitOrientation = keyof typeof ATRIUM_ORBIT_ASSETS.widths;
export type AtriumOrbitFormat = (typeof ATRIUM_ORBIT_ASSETS.formats)[number];
export type AtriumOrbitPlateStatus = 'missing' | 'available';

/** Independent UI layout states, on the homepage's existing breakpoints.
 * Until the plates arrive each reuses the approved Scene 3 layout. */
export type AtriumOrbitLayout = 'desktop' | 'tablet' | 'mobile';
export const atriumOrbitLayout = (width: number): AtriumOrbitLayout =>
  width < 768 ? 'mobile' : width < 1200 ? 'tablet' : 'desktop';

/** Which view the browser's <picture> selects (portraitMedia), for
 * diagnostics and per-orientation data only. The browser chooses the file;
 * script never swaps plates on resize. */
export const plateOrientation = (
  width: number,
  height: number,
): AtriumOrbitOrientation =>
  width <= 767 && height >= width ? 'portrait' : 'desktop';

/** Delivery status. Every plate is MISSING: the approved renders do not
 * exist yet (PASS 6B flips these after acceptance and optimisation). A
 * missing plate is never requested and never substituted. */
export const ATRIUM_ORBIT_PLATES: Record<
  AtriumOrbitStateId,
  Record<AtriumOrbitOrientation, AtriumOrbitPlateStatus>
> = {
  arrival: { desktop: 'missing', portrait: 'missing' },
  living: { desktop: 'missing', portrait: 'missing' },
  bedroom: { desktop: 'missing', portrait: 'missing' },
  bathroom: { desktop: 'missing', portrait: 'missing' },
  kitchen: { desktop: 'missing', portrait: 'missing' },
};

/** The validated contents of `world-atrium-cameras.json`, or null while
 * the studio has not delivered it. PASS 6B imports the delivered file here;
 * `validateAtriumOrbitCameras` decides whether it may drive the orbit. */
export const ATRIUM_ORBIT_CAMERA_DATA: unknown = null;

export type AtriumOrbitThumbnail = {
  src: string;
  width: number;
  height: number;
};

/** The small round indicator image. Reuses today's optimised 192px room
 * previews; never a full-size plate. */
export const ATRIUM_ORBIT_THUMBNAILS: Record<
  AtriumRoomId,
  AtriumOrbitThumbnail
> = {
  living: thumbnail('living'),
  bedroom: thumbnail('bedroom'),
  bathroom: thumbnail('bathroom'),
  kitchen: thumbnail('kitchen'),
};
function thumbnail(room: AtriumRoomId): AtriumOrbitThumbnail {
  return {
    src: `${ATRIUM_ORBIT_ASSETS.base}room-preview-${room}.webp`,
    width: 192,
    height: 192,
  };
}

/** Where each view's HTML fascia label sits (fractions of the view), per
 * orientation. Unknown until accepted plates are measured (spec §8 zone L):
 * labels are not positioned before then. */
export type AtriumOrbitAnchor = { x: number; y: number };
export const ATRIUM_ORBIT_FASCIA: Record<
  AtriumOrbitStateId,
  Record<AtriumOrbitOrientation, AtriumOrbitAnchor | null>
> = {
  arrival: { desktop: null, portrait: null },
  living: { desktop: null, portrait: null },
  bedroom: { desktop: null, portrait: null },
  bathroom: { desktop: null, portrait: null },
  kitchen: { desktop: null, portrait: null },
};

export function plateFile(
  state: AtriumOrbitStateId,
  orientation: AtriumOrbitOrientation,
  width: number,
  format: AtriumOrbitFormat,
) {
  const { base, stem, widths } = ATRIUM_ORBIT_ASSETS;
  const view = orientation === 'portrait' ? `${state}-portrait` : state;
  const size = width === widths[orientation][0] ? '' : `-${width}`;
  return `${base}${stem}-${view}${size}.${format}`;
}

export type AtriumOrbitPlateSource = {
  media: string | null;
  type: string;
  srcset: string;
  sizes: string;
};
export type AtriumOrbitPlateSources = {
  /** <source> elements in document order: portrait first, then desktop. */
  sources: AtriumOrbitPlateSource[];
  fallback: { src: string; width: number; height: number; sizes: string };
};

/** The <picture> description for one view, or null when its desktop plate
 * is missing (no partial or substituted plate). A missing portrait view
 * falls back to the desktop plate's crop. */
export function plateSources(
  state: AtriumOrbitStateId,
  status = ATRIUM_ORBIT_PLATES,
): AtriumOrbitPlateSources | null {
  if (status[state].desktop !== 'available') return null;
  const { formats, widths, portraitMedia, sizes, fallbackWidth, intrinsic } =
    ATRIUM_ORBIT_ASSETS;
  const orientations: AtriumOrbitOrientation[] =
    status[state].portrait === 'available'
      ? ['portrait', 'desktop']
      : ['desktop'];
  const sources = orientations.flatMap((orientation) =>
    formats.map((format) => ({
      media: orientation === 'portrait' ? portraitMedia : null,
      type: `image/${format}`,
      srcset: widths[orientation]
        .map((w) => `${plateFile(state, orientation, w, format)} ${w}w`)
        .join(', '),
      sizes: sizes[orientation],
    })),
  );
  return {
    sources,
    fallback: {
      src: plateFile(
        state,
        'desktop',
        fallbackWidth.desktop,
        formats[formats.length - 1],
      ),
      width: intrinsic.desktop[0],
      height: intrinsic.desktop[1],
      sizes: sizes.desktop,
    },
  };
}

/** Every file a complete delivery consists of (for acceptance checks). */
export function plateFiles(state: AtriumOrbitStateId) {
  return (['desktop', 'portrait'] as const).flatMap((orientation) =>
    ATRIUM_ORBIT_ASSETS.widths[orientation].flatMap((w) =>
      ATRIUM_ORBIT_ASSETS.formats.map((format) =>
        plateFile(state, orientation, w, format),
      ),
    ),
  );
}

/** The complete record of one camera state: identity and editorial copy
 * (model), plate and camera references, thumbnail, route and neighbours.
 * Routes are never invented: they come from the rendered room links
 * (`worldsChapterOptions`), and a room without one has no CTA. */
export type AtriumOrbitRecord = AtriumOrbitState & {
  previous: AtriumOrbitStateId | null;
  next: AtriumOrbitStateId | null;
  plate: { desktop: string; portrait: string };
  camera: {
    desktop: AtriumOrbitStateId;
    portrait: AtriumOrbitPortraitCameraId;
  };
  thumbnail: AtriumOrbitThumbnail | null;
  route: string | null;
};

export function atriumOrbitRecord(
  id: AtriumOrbitStateId,
  routes: Partial<Record<AtriumRoomId, string>> = {},
): AtriumOrbitRecord {
  const state = atriumOrbitState(id);
  const { previous, next } = atriumOrbitNeighbours(id);
  const { stem } = ATRIUM_ORBIT_ASSETS;
  return {
    ...state,
    previous,
    next,
    plate: { desktop: `${stem}-${id}`, portrait: `${stem}-${id}-portrait` },
    camera: { desktop: id, portrait: `${id}-portrait` },
    thumbnail: state.room ? ATRIUM_ORBIT_THUMBNAILS[state.room] : null,
    route: state.room ? (routes[state.room] ?? null) : null,
  };
}

/** What a complete Tier B needs, and what is still missing. */
export function atriumOrbitReadiness(status = ATRIUM_ORBIT_PLATES) {
  const missing = ATRIUM_ORBIT_STATES.flatMap((id) =>
    (['desktop', 'portrait'] as const)
      .filter((orientation) => status[id][orientation] !== 'available')
      .map((orientation) => ({ id, orientation })),
  );
  return {
    missing,
    desktopComplete: ATRIUM_ORBIT_STATES.every(
      (id) => status[id].desktop === 'available',
    ),
  };
}
