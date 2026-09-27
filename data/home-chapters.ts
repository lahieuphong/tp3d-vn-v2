import { materials } from './materials';
import { spaces } from './spaces';
import { worlds } from './worlds';

export type WorldsChapterOption = {
  id: string;
  title: string;
  href: string;
};

export type SpacesChapterItem = {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  href: string;
  image: string;
  alt: string;
};

export type MaterialChapterCallout = {
  id: string;
  title: string;
  lines: readonly string[];
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

const spaceChapters = [
  ['living', 'OPENNESS / CONNECTION / REST'],
  ['bedroom', 'CALM / COMFORT / RENEWAL'],
  ['workspace', 'FOCUS / CREATIVITY / BALANCE'],
  ['kitchen', 'GATHER / NOURISH / BELONG'],
] as const;

/** Keep chapter-specific captions here and derive room names, images and links
 * from Spaces. Removing a room from the catalogue cannot leave a broken URL. */
export const spacesChapterItems: SpacesChapterItem[] = spaceChapters.flatMap(
  ([slug, subtitle], index) => {
    const space = spaces.find((item) => item.slug === slug);
    if (!space) return [];
    return [
      {
        id: space.slug,
        number: String(index + 1).padStart(2, '0'),
        title: space.title,
        subtitle,
        href: `/spaces/${space.slug}`,
        image: space.image.src,
        alt: space.image.alt,
      },
    ];
  },
);

const materialChapters = [
  { id: 'stone', slug: 'travertine', lines: ['TIME', 'IN TEXTURE'] },
  { id: 'wood', slug: 'walnut', lines: ['WARMTH', 'THAT LASTS'] },
  { id: 'textile', slug: 'linen', lines: ['SOFTER', 'SPACES'] },
  { id: 'ceramic', slug: null, lines: ['EVERYDAY', 'BEAUTY'] },
  { id: 'metal', slug: 'brushed-metal', lines: ['A QUIET', 'BRILLIANCE'] },
] as const;

export const materialChapterCallouts: MaterialChapterCallout[] =
  materialChapters.map(({ id, slug, lines }) => {
    const material = materials.find((item) => item.slug === slug);
    const family = material?.family.toLowerCase() ?? id;
    return {
      id,
      title: family.charAt(0).toUpperCase() + family.slice(1),
      lines: [...lines],
      // Ceramic has no published material/product entry yet. Use the existing
      // objects index instead of manufacturing a ceramic detail destination.
      href: material
        ? `/materials/${material.slug}`
        : id === 'ceramic'
          ? '/products'
          : '/materials',
    };
  });
