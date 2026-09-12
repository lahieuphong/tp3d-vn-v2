import type { Collection } from './types';
import { images, photo } from './images';
export const collections: Collection[] = [
  {
    slug: 'contemporary',
    title: 'Contemporary',
    description:
      'Sculptural forms, expressive materials and a relaxed clarity. An evolving conversation between the architectural and the personal.',
    image: photo(
      images.hero,
      'A contemporary interior with sculptural furniture',
    ),
    projects: ['the-walnut-residence', 'courtyard-residence'],
  },
  {
    slug: 'japandi',
    title: 'Japandi',
    description:
      'The warmth of Scandinavian living meets the quiet discipline of Japanese space. Natural textures, gentle light and objects with purpose.',
    image: photo(
      images.quiet,
      'A warm minimal room with pale timber and natural textiles',
    ),
    projects: ['quiet-house'],
  },
  {
    slug: 'minimal',
    title: 'Minimal',
    description:
      'Less visual noise. More attention to proportion, light and the way a material feels. Spaces reduced to what makes them welcoming.',
    image: photo(
      images.bedroom,
      'A minimal bedroom with a restrained material palette',
    ),
    projects: ['quiet-house'],
  },
  {
    slug: 'modern',
    title: 'Modern',
    description:
      'Clear lines and thoughtful proportions. A collection that finds its warmth in natural materials and a generous relationship to space.',
    image: photo(
      images.dining,
      'A modern dining room with clear architectural lines',
    ),
    projects: ['courtyard-residence'],
  },
  {
    slug: 'classic',
    title: 'Classic',
    description:
      'Enduring proportions, layered textures and a sense of permanence. A contemporary reading of rooms with architectural character.',
    image: photo(
      images.classic,
      'A classical living room with a stone fireplace and parquet floor',
    ),
    projects: ['courtyard-residence'],
  },
];
