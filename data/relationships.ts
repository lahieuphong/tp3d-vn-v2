import { projects } from './projects';
import { products } from './products';
import { materials } from './materials';
import type { Collection, Project, Product } from './types';

/** Project membership is canonical; reverse relationships are always derived. */
export const getSpaceProjects = (slug: string) =>
  projects.filter((project) => project.spaces.includes(slug));

export const getProductProjects = (slug: string) =>
  projects.filter((project) => project.products.includes(slug));

export const getMaterialProjects = (slug: string) =>
  projects.filter((project) => project.materials.includes(slug));

/** Reuse interior membership instead of maintaining a second asset catalog. */
export function getRelatedProducts(product: Product, limit = 3) {
  const interiors = getProductProjects(product.slug);
  const score = (other: Product) =>
    Number(other.collection === product.collection) * 3 +
    Number(other.category === product.category) * 2 +
    interiors.filter((project) => project.products.includes(other.slug)).length;
  return products
    .filter((other) => other.slug !== product.slug)
    .sort((a, b) => score(b) - score(a))
    .slice(0, Math.max(0, limit));
}

/** Preserve the collection's editorial order, ignoring unresolved references. */
export const getCollectionProjects = (collection: Collection) =>
  collection.projects.flatMap((slug) => {
    const project = projects.find((item) => item.slug === slug);
    return project ? [project] : [];
  });

export function getCollectionContext(collection: Collection) {
  const selected = getCollectionProjects(collection);
  return {
    projects: selected,
    products: products.filter((item) =>
      selected.some((project) => project.products.includes(item.slug)),
    ),
    materials: materials.filter((item) =>
      selected.some((project) => project.materials.includes(item.slug)),
    ),
  };
}

/** Shared rooms, materials and objects rank relevant interiors; stable order breaks ties. */
export function getRelatedProjects(project: Project, limit = 2) {
  const overlap = (a: string[], b: string[]) =>
    a.filter((slug) => b.includes(slug)).length;
  const score = (other: Project) =>
    Number(other.style === project.style) * 4 +
    overlap(other.spaces, project.spaces) * 3 +
    overlap(other.materials, project.materials) * 2 +
    overlap(other.products, project.products);
  return projects
    .filter((other) => other.slug !== project.slug)
    .sort((a, b) => score(b) - score(a))
    .slice(0, Math.max(0, limit));
}
