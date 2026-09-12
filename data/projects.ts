import { images, photo } from './images';
import type { Project } from './types';
export const projects: Project[] = [
  {
    id: 'p01',
    slug: 'the-walnut-residence',
    title: 'The Walnut Residence',
    location: 'Ho Chi Minh City',
    year: 2026,
    style: 'Contemporary',
    area: '186 m²',
    description:
      'A warm material palette and a generous sense of space. An urban home composed around the rhythms of everyday life.',
    introduction:
      'A study in balance: the depth of walnut against soft mineral tones, sculptural furniture against the clarity of an open plan. This imagined city residence considers how a home can feel both composed and entirely lived in.',
    concept:
      'The living room is organised around conversation. Low seating preserves long views, while a continuous timber palette brings the separate spaces into dialogue. Texture does the work of decoration: the open weave of linen, a honed stone surface, the quiet irregularity of wood.',
    coverImage: photo(
      images.hero,
      'Cream modular seating, sculptural lighting and natural stone in a contemporary living room',
    ),
    gallery: [
      photo(
        images.living,
        'A curved sofa and low table in warm afternoon light',
      ),
      photo(
        images.kitchen,
        'A contemporary kitchen with a marble island and dark timber accents',
      ),
      photo(
        images.bedroom,
        'A calm bedroom with soft upholstery and full-height curtains',
      ),
    ],
    materials: ['walnut', 'travertine', 'linen', 'brushed-metal'],
    products: ['line-sofa', 'round-coffee-table', 'copper-pendant'],
    spaces: ['living', 'kitchen', 'bedroom'],
    threeScene: { enabled: true, roomId: 'walnut-living', status: 'preview' },
  },
  {
    id: 'p02',
    slug: 'quiet-house',
    title: 'Quiet House',
    location: 'Da Nang',
    year: 2026,
    style: 'Minimal',
    area: '240 m²',
    description:
      'Natural light, pale timber and a deliberate simplicity. A coastal home that leaves room for the day to unfold.',
    introduction:
      'Quiet House explores the intimacy of a pared-back home. Rooms are connected by light rather than decoration, with generous openings and a restrained palette of oak, linen and warm white plaster.',
    concept:
      'Nothing competes for attention. Furniture sits low, curtains filter the daylight, and tactile surfaces bring warmth to the clear architectural lines. A sequence of small places to read, rest and gather gives the open plan its human scale.',
    coverImage: photo(
      images.quiet,
      'A light Scandinavian living room with pale timber and a low cream sofa',
    ),
    gallery: [
      photo(images.bedroom, 'A minimal bedroom filled with diffuse daylight'),
      photo(images.linen, 'Linen seating beside a sheer curtain'),
      photo(
        images.dining,
        'A quiet dining room with a dark table and cream chairs',
      ),
    ],
    materials: ['natural-oak', 'linen', 'travertine'],
    products: ['form-lounge-chair', 'line-sofa', 'round-coffee-table'],
    spaces: ['living', 'dining', 'bedroom'],
    threeScene: { enabled: true, roomId: 'quiet-living', status: 'preview' },
  },
  {
    id: 'p03',
    slug: 'courtyard-residence',
    title: 'Courtyard Residence',
    location: 'Hanoi',
    year: 2025,
    style: 'Modern',
    area: '310 m²',
    description:
      'An inward-looking home, where measured proportions and tactile materials create moments of quiet throughout the day.',
    introduction:
      'This residential study is built around the idea of a sheltered centre. Living and dining spaces share a simple material language, while more private rooms are defined by softer textures and a slower pace.',
    concept:
      'A dialogue between weight and lightness runs through the interior. Stone anchors the gathering spaces. Timber introduces rhythm. Carefully placed objects soften the geometry without obscuring it.',
    coverImage: photo(
      images.dining,
      'Cream upholstered chairs around a dark dining table in a warm architectural interior',
    ),
    gallery: [
      photo(images.kitchen, 'A marble kitchen island with dark accents'),
      photo(images.workspace, 'A considered workspace with natural materials'),
      photo(
        images.classic,
        'A living space with classical architectural proportions',
      ),
    ],
    materials: ['natural-oak', 'leather', 'brushed-metal'],
    products: ['form-lounge-chair', 'copper-pendant', 'round-coffee-table'],
    spaces: ['dining', 'kitchen', 'workspace'],
    threeScene: {
      enabled: true,
      roomId: 'courtyard-dining',
      status: 'preview',
    },
  },
];
export const getProject = (slug: string) =>
  projects.find((p) => p.slug === slug);
