import type { Product } from './types';
import { products } from './products';

/** Room 02 — Objects: which object studies the room shows, and in what
 * order. Only slugs live here. Every title, image, category, collection,
 * dimension, material and asset fact comes from `data/products.ts`, so the
 * room and the `/products` collection can never disagree. The collection
 * lists everything; the room is a curated sequence in authored order. */
export const objectStudySlugs = [
  'form-lounge-chair',
  'line-sofa',
  'round-coffee-table',
  'copper-pendant',
] as const;

/** Resolves curated slugs against the products, keeping curation order.
 * Unknown slugs are dropped here and fail `yarn check:objects-room`. */
export const resolveObjectStudies = (
  slugs: readonly string[],
  source: readonly Product[],
) => slugs.flatMap((slug) => source.filter((product) => product.slug === slug));

export const objectStudies = resolveObjectStudies(objectStudySlugs, products);
