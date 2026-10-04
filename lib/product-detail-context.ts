/** TP3D PASS 11: where an object study was opened from. One detail route
 * (`/products/[slug]`) serves the editorial collection and Room 02; the
 * context changes only the shell around it, the way back and which related
 * studies keep the room's URL. Products are not worlds: this is their own
 * small model, not lib/world-detail-context.ts. Pure helpers with no data
 * imports and no browser storage: the URL alone carries the context. */
export type ProductDetailContext =
  | { kind: 'catalogue' }
  | {
      kind: 'objects';
      /** The room the study belongs to, as its plate names it. */
      label: string;
      /** The room's name, for the way back: "Back to Objects". */
      roomName: string;
      /** Room 02's route; the study's slug becomes the fragment. */
      returnPath: string;
      /** The studies the room hangs, in curation order. */
      curatedSlugs: readonly string[];
    };

/** The one query value Room 02 adds: `/products/[slug]?from=objects`. */
export const OBJECTS_ORIGIN = 'objects';
const objectsQuery = `?from=${OBJECTS_ORIGIN}`;

export const CATALOGUE_PRODUCT_CONTEXT: ProductDetailContext = {
  kind: 'catalogue',
};

type ObjectsRoom = { number: string; name: string; href: string | null };

/** Room 02's context for the studies it hangs (no route, no room). */
export function objectsContext(
  room: ObjectsRoom | undefined,
  curatedSlugs: readonly string[],
): ProductDetailContext {
  if (!room?.href) return CATALOGUE_PRODUCT_CONTEXT;
  return {
    kind: 'objects',
    label: `Room ${room.number} / ${room.name}`,
    roomName: room.name,
    returnPath: room.href,
    curatedSlugs,
  };
}

/** Room 02 context is honoured only for a study the room actually hangs;
 * anything else (another value, a repeated parameter, a product outside the
 * curation) falls back to the editorial collection, never to a 404. */
export const resolveProductDetailContext = ({
  from,
  slug,
  curatedSlugs,
  objectsRoom,
}: {
  from: unknown;
  slug: string;
  curatedSlugs: readonly string[];
  objectsRoom: ObjectsRoom | undefined;
}) =>
  from === OBJECTS_ORIGIN && curatedSlugs.includes(slug)
    ? objectsContext(objectsRoom, curatedSlugs)
    : CATALOGUE_PRODUCT_CONTEXT;

/** A product's object-study URL. The content identity stays
 * `/products/[slug]`; Room 02 keeps its query only for studies it hangs. */
export const productDetailHref = (
  slug: string,
  context: ProductDetailContext,
) =>
  context.kind === 'objects' && context.curatedSlugs.includes(slug)
    ? `/products/${slug}${objectsQuery}`
    : `/products/${slug}`;

/** The way back: the collection, or the study's own place in Room 02. */
export const productReturn = (slug: string, context: ProductDetailContext) =>
  context.kind === 'objects'
    ? {
        href: `${context.returnPath}#${slug}`,
        label: `Back to ${context.roomName}`,
      }
    : { href: '/products', label: 'All objects' };

/** Related objects keep the shared relationship ranking. The collection shows
 * its first three; inside Room 02 only the room's studies are candidates, so
 * a related study never leads out of the room. */
export const relatedInContext = <T extends { slug: string }>(
  ranked: readonly T[],
  context: ProductDetailContext,
  limit = 3,
) =>
  ranked
    .filter(
      ({ slug }) =>
        context.kind === 'catalogue' || context.curatedSlugs.includes(slug),
    )
    .slice(0, limit);
