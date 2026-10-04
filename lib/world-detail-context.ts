/** TP3D PASS 07: where a world's detail page was opened from. One detail
 * route (`/worlds/[slug]`) serves the catalogue and the Gallery; the context
 * only changes the way back, the breadcrumb, the browse set and the URLs the
 * page writes. Pure helpers with no data imports, so client code can use them
 * without bundling the catalogue. */
export type WorldDetailContext = {
  kind: 'catalogue' | 'gallery';
  /** The place the visitor came from, as the breadcrumb names it. */
  label: string;
  /** Where the breadcrumb and Escape return to; the slug becomes the fragment. */
  returnPath: string;
  /** The query every detail URL keeps in this context. */
  query: string;
};

/** The one query value Gallery links add: `/worlds/[slug]?from=gallery`. */
export const GALLERY_ORIGIN = 'gallery';
const galleryQuery = `?from=${GALLERY_ORIGIN}`;

export const CATALOGUE_CONTEXT: WorldDetailContext = {
  kind: 'catalogue',
  label: '3D WORLDS',
  returnPath: '/worlds',
  query: '',
};

/** A Gallery exhibit's detail URL. The content identity stays `/worlds/[slug]`. */
export const galleryExhibitHref = (slug: string) =>
  `/worlds/${slug}${galleryQuery}`;

/** Gallery context is honoured only for a slug the Gallery actually hangs;
 * anything else (another value, a repeated parameter, a world outside the
 * curation) falls back to the catalogue, never to a 404. */
export function resolveWorldDetailContext({
  from,
  slug,
  curatedSlugs,
  galleryRoom,
}: {
  from: unknown;
  slug: string;
  curatedSlugs: readonly string[];
  galleryRoom:
    | { number: string; name: string; href: string | null }
    | undefined;
}): WorldDetailContext {
  if (
    from !== GALLERY_ORIGIN ||
    !curatedSlugs.includes(slug) ||
    !galleryRoom?.href
  )
    return CATALOGUE_CONTEXT;
  return {
    kind: 'gallery',
    label: `Room ${galleryRoom.number} / ${galleryRoom.name}`.toUpperCase(),
    returnPath: galleryRoom.href,
    query: galleryQuery,
  };
}

export const worldDetailHref = (slug: string, context: WorldDetailContext) =>
  `/worlds/${slug}${context.query}`;

export const worldReturnHref = (slug: string, context: WorldDetailContext) =>
  `${context.returnPath}#${slug}`;
