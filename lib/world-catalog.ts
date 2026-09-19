import type { World } from '@/data/types';

export const WORLD_PAGE_SIZE = 12;
export type WorldQuery = { category: string; q: string; sort: 'newest' | 'az' };
export const defaultWorldQuery: WorldQuery = {
  category: '',
  q: '',
  sort: 'newest',
};
const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
export const worldCategoryKey = (category: string) =>
  normalize(category).replace(/\s+/g, '-');

export function getWorldCategories(worlds: World[]) {
  return [
    ...new Map(
      worlds.map((world) => [worldCategoryKey(world.category), world.category]),
    ).entries(),
  ]
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label, 'en'));
}

export function readWorldQuery(
  params: URLSearchParams,
  worlds: World[],
): WorldQuery {
  const category = worldCategoryKey(params.get('category') ?? '');
  return {
    category: getWorldCategories(worlds).some((item) => item.value === category)
      ? category
      : '',
    q: (params.get('q') ?? '').slice(0, 160),
    sort: params.get('sort') === 'az' ? 'az' : 'newest',
  };
}

export function writeWorldQuery(params: URLSearchParams, query: WorldQuery) {
  const result = new URLSearchParams(params);
  for (const key of ['category', 'q', 'sort'] as const) {
    const value =
      key === 'sort' && query.sort === 'newest' ? '' : query[key].trim();
    if (value) result.set(key, value);
    else result.delete(key);
  }
  return result;
}

/** Stable authored order breaks ties within the same curation year. */
export function selectWorlds(worlds: World[], query: WorldQuery) {
  const terms = normalize(query.q).split(/\s+/).filter(Boolean);
  return worlds
    .filter((world) => {
      if (query.category && worldCategoryKey(world.category) !== query.category)
        return false;
      const text = normalize(
        [world.title, world.category, world.style, world.type].join(' '),
      );
      return terms.every((term) => text.includes(term));
    })
    .sort((a, b) =>
      query.sort === 'az'
        ? a.title.localeCompare(b.title, 'en')
        : Number(b.year) - Number(a.year),
    );
}

export const getFeaturedWorlds = (worlds: World[]) =>
  worlds.filter((world) => world.featured).slice(0, 3);
export const getVisibleWorlds = (worlds: World[], page: number) =>
  worlds.slice(0, Math.max(1, page) * WORLD_PAGE_SIZE);
