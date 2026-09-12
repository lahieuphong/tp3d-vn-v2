import { projects } from './projects';
import { spaces } from './spaces';
import { collections } from './collections';
import { products } from './products';
import { materials } from './materials';
import { journal } from './journal';
export const searchEntries = [
  ...projects.map((x) => ({
    title: x.title,
    category: 'Project',
    href: `/projects/${x.slug}`,
  })),
  ...spaces.map((x) => ({
    title: x.title,
    category: 'Space',
    href: `/spaces/${x.slug}`,
  })),
  ...collections.map((x) => ({
    title: x.title,
    category: 'Collection',
    href: `/collections/${x.slug}`,
  })),
  ...products.map((x) => ({
    title: x.title,
    category: 'Object',
    href: `/products/${x.slug}`,
  })),
  ...materials.map((x) => ({
    title: x.title,
    category: 'Material',
    href: `/materials/${x.slug}`,
  })),
  ...journal.map((x) => ({
    title: x.title,
    category: 'Journal',
    href: `/journal/${x.slug}`,
  })),
];
