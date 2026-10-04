import type { World } from './types';
import { worlds } from './worlds';

/** Room 01 — Gallery: which worlds hang in the exhibition, and in what order.
 * Only slugs live here. Every title, image, fact and description comes from
 * `data/worlds.ts`, so the Gallery and the `/worlds` catalogue can never
 * disagree. The catalogue lists everything; the Gallery is a curated subset
 * in authored order. */
export const galleryExhibitSlugs = [
  'modern-kitchen',
  'white-modern-living-room',
  'minimalistic-modern-bedroom',
  'modern-bathroom',
] as const;

/** Resolves curated slugs against the catalogue, keeping curation order.
 * Unknown slugs are dropped here and fail `yarn check:gallery`. */
export const resolveGalleryExhibits = (
  slugs: readonly string[],
  source: readonly World[],
) => slugs.flatMap((slug) => source.filter((world) => world.slug === slug));

export const galleryExhibits = resolveGalleryExhibits(
  galleryExhibitSlugs,
  worlds,
);
