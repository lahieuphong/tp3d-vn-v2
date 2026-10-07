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

/** PASS 6B.0 — comp plates. Until the studio renders exist, each room view
 * is the design comp of that view (1672 × 941, the approved Atrium's own
 * size) with its screen UI cut out: the header, title block, CTA, indicator
 * and baselines are HTML, so they are not in the picture. What belongs to the
 * scene stays (the fascia labels over the doorways, the breeze line).
 * Arrival is the approved Atrium itself, drawn as a plate so the camera can
 * leave it. Same naming and widths as the approved Atrium plate; the comps
 * and the cut-out sources stay outside Git (`work/atrium-orbit/comp-plates`).
 * An accepted studio plate replaces a comp by its status alone. */
export const ATRIUM_ORBIT_COMP = {
  widths: [1672, 1280, 720],
  fallbackWidth: 1280,
  intrinsic: [1672, 941],
  sizes: '(max-aspect-ratio: 1672/941) 178svh, 100vw',
  /** The approved Atrium's files (`worlds-atrium*.webp`). */
  arrival: 'worlds-atrium',
} as const;

export type AtriumOrbitOrientation = keyof typeof ATRIUM_ORBIT_ASSETS.widths;
export type AtriumOrbitFormat = (typeof ATRIUM_ORBIT_ASSETS.formats)[number];
/** 'comp' is provisional (above); 'available' is an accepted studio plate. */
export type AtriumOrbitPlateStatus = 'missing' | 'comp' | 'available';

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

/** Delivery status. No approved studio render exists yet (PASS 6B flips a
 * view to 'available' after acceptance and optimisation). The desktop views
 * are comp plates (PASS 6B.0); there is no portrait view, so a phone sees
 * the desktop plate through its own window (`ATRIUM_ORBIT_FOCUS`). A missing
 * plate is never requested and never substituted. */
export const ATRIUM_ORBIT_PLATES: Record<
  AtriumOrbitStateId,
  Record<AtriumOrbitOrientation, AtriumOrbitPlateStatus>
> = {
  arrival: { desktop: 'comp', portrait: 'missing' },
  living: { desktop: 'comp', portrait: 'missing' },
  bedroom: { desktop: 'comp', portrait: 'missing' },
  bathroom: { desktop: 'comp', portrait: 'missing' },
  kitchen: { desktop: 'comp', portrait: 'missing' },
};

/** Where each view's subject stands across its plate (0 → 1): the middle of
 * its doorway, measured on the comp plates. A stage narrower than the plate
 * is a window onto it, centred here. Arrival keeps the approved Atrium's own
 * crop instead (see `plateWindowStart`). */
export const ATRIUM_ORBIT_FOCUS: Record<AtriumOrbitStateId, number> = {
  arrival: 0.5,
  living: 0.514,
  bedroom: 0.517,
  bathroom: 0.573,
  kitchen: 0.6,
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

/** The small round indicator image: 192px, never a full-size plate. PASS
 * 6B.0: the room's own doorway, cut from its comp plate, as the comps show
 * it (`world-atrium-<room>-preview.webp`). */
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
    src: `${ATRIUM_ORBIT_ASSETS.base}${ATRIUM_ORBIT_ASSETS.stem}-${room}-preview.webp`,
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

/** A comp plate's file: the approved Atrium's naming, widest without a
 * suffix. Arrival is the approved Atrium's own file. */
export function compPlateFile(state: AtriumOrbitStateId, width: number) {
  const { base, stem } = ATRIUM_ORBIT_ASSETS;
  const { widths, arrival } = ATRIUM_ORBIT_COMP;
  const name = state === 'arrival' ? arrival : `${stem}-${state}`;
  return `${base}${name}${width === widths[0] ? '' : `-${width}`}.webp`;
}

function compPlateSources(state: AtriumOrbitStateId): AtriumOrbitPlateSources {
  const { widths, fallbackWidth, intrinsic, sizes } = ATRIUM_ORBIT_COMP;
  return {
    sources: [
      {
        media: null,
        type: 'image/webp',
        srcset: widths
          .map((w) => `${compPlateFile(state, w)} ${w}w`)
          .join(', '),
        sizes,
      },
    ],
    fallback: {
      src: compPlateFile(state, fallbackWidth),
      width: intrinsic[0],
      height: intrinsic[1],
      sizes,
    },
  };
}

/** The <picture> description for one view, or null when its desktop plate
 * is missing (no partial or substituted plate). A missing portrait view
 * falls back to the desktop plate's crop. */
export function plateSources(
  state: AtriumOrbitStateId,
  status = ATRIUM_ORBIT_PLATES,
): AtriumOrbitPlateSources | null {
  if (status[state].desktop === 'comp') return compPlateSources(state);
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

/** What a complete Tier B needs, and what is still missing. `missing` is
 * every view without an accepted studio plate (a comp plate is not one);
 * `desktopComplete` says the orbit can be drawn, from comps or renders. */
export function atriumOrbitReadiness(status = ATRIUM_ORBIT_PLATES) {
  const missing = ATRIUM_ORBIT_STATES.flatMap((id) =>
    (['desktop', 'portrait'] as const)
      .filter((orientation) => status[id][orientation] !== 'available')
      .map((orientation) => ({ id, orientation })),
  );
  return {
    missing,
    desktopComplete: ATRIUM_ORBIT_STATES.every(
      (id) => status[id].desktop !== 'missing',
    ),
  };
}

/** Every plate is a box of this ratio fitted to cover the stage, as the
 * approved Atrium is. */
export const ATRIUM_ORBIT_PLATE_RATIO =
  ATRIUM_ORBIT_COMP.intrinsic[0] / ATRIUM_ORBIT_COMP.intrinsic[1];

/** How much of a plate the stage shows: its width over the plate's (1 when
 * the stage is at least as wide as the plate), and the same for height. */
export type AtriumOrbitPlateWindow = { width: number; height: number };
export function plateWindow(
  stageWidth: number,
  stageHeight: number,
): AtriumOrbitPlateWindow {
  const fit = stageWidth / Math.max(1, stageHeight) / ATRIUM_ORBIT_PLATE_RATIO;
  return { width: Math.min(1, fit), height: Math.min(1, 1 / fit) };
}

/** Where the stage's window starts across a resting plate (0 → 1 − width).
 * Rooms centre their doorway; Arrival repeats the approved Atrium's crop
 * (object-position 50%, 51% on phones), so the plate lies exactly on it. */
export function plateWindowStart(
  state: AtriumOrbitStateId,
  window: AtriumOrbitPlateWindow,
  layout: AtriumOrbitLayout,
) {
  const slack = 1 - window.width;
  if (state === 'arrival') return slack * (layout === 'mobile' ? 0.51 : 0.5);
  return Math.min(
    slack,
    Math.max(0, ATRIUM_ORBIT_FOCUS[state] - window.width / 2),
  );
}
