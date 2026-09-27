import { spaces } from './spaces';
import { worlds } from './worlds';

export type WorldsChapterOption = {
  id: string;
  title: string;
  href: string;
};

/** Room labels belong to the atrium openings. Prefer the existing Space;
 * Bathroom currently has a published World but no Space detail. */
export const worldsChapterOptions: WorldsChapterOption[] = [
  'Living',
  'Bedroom',
  'Bathroom',
  'Kitchen',
].map((category) => {
  const categoryWorlds = worlds.filter((world) => world.category === category);
  const world =
    categoryWorlds.find((item) => item.available) ?? categoryWorlds[0];
  const space = spaces.find((item) => item.title === category);
  return {
    id: category.toLowerCase(),
    title: world?.category ?? category,
    href: space
      ? `/spaces/${space.slug}`
      : world?.available
        ? `/worlds/${world.slug}`
        : '/worlds',
  };
});
