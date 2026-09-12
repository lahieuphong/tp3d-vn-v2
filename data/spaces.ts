import type { Space } from './types';
import { images, photo } from './images';
export const spaces: Space[] = [
  {
    slug: 'living',
    title: 'Living',
    subtitle: 'The space between moments.',
    description:
      'Rooms for conversation, a good book, or simply being. Explore living spaces composed around comfort, proportion and the changing light.',
    image: photo(
      images.living,
      'Curved contemporary seating with sunlight falling across a textured wall',
    ),
    projects: ['the-walnut-residence', 'quiet-house'],
    products: ['line-sofa', 'form-lounge-chair', 'round-coffee-table'],
    materials: ['walnut', 'linen', 'travertine'],
  },
  {
    slug: 'dining',
    title: 'Dining',
    subtitle: 'A place to come together.',
    description:
      'A table becomes a centre. These dining spaces consider the simple pleasure of gathering, with materials and light chosen for the hours spent together.',
    image: photo(
      images.dining,
      'A contemporary dining space with cream chairs and a dark timber table',
    ),
    projects: ['courtyard-residence', 'quiet-house'],
    products: ['copper-pendant', 'form-lounge-chair'],
    materials: ['natural-oak', 'leather', 'brushed-metal'],
  },
  {
    slug: 'kitchen',
    title: 'Kitchen',
    subtitle: 'Everyday rituals, thoughtfully framed.',
    description:
      'Working surfaces, thoughtful storage and a clear sense of flow. Kitchens where practical decisions find a natural architectural expression.',
    image: photo(
      images.kitchen,
      'A marble kitchen island and warm timber stools',
    ),
    projects: ['the-walnut-residence', 'courtyard-residence'],
    products: ['copper-pendant'],
    materials: ['walnut', 'travertine', 'brushed-metal'],
  },
  {
    slug: 'bedroom',
    title: 'Bedroom',
    subtitle: 'Room for a slower pace.',
    description:
      'Gentle light, tactile textiles and fewer distractions. Private spaces that find their character in the relationship between softness and simplicity.',
    image: photo(
      images.bedroom,
      'A serene bedroom with a cream upholstered bed and sheer curtains',
    ),
    projects: ['quiet-house', 'the-walnut-residence'],
    products: ['form-lounge-chair', 'copper-pendant'],
    materials: ['natural-oak', 'linen'],
  },
  {
    slug: 'workspace',
    title: 'Workspace',
    subtitle: 'A clear space for thought.',
    description:
      'Considered places to work, read and make. Natural materials and an uncluttered outlook bring a domestic warmth to the working day.',
    image: photo(
      images.workspace,
      'A warm minimal workspace with an uncluttered surface',
    ),
    projects: ['courtyard-residence'],
    products: ['form-lounge-chair', 'copper-pendant'],
    materials: ['walnut', 'leather', 'brushed-metal'],
  },
];
