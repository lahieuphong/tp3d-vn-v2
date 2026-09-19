import type { World } from './types';

export const worldsEdition = '2026';
const credit = {
  name: 'dylanheyes',
  url: 'https://sketchfab.com/dylanheyes',
  license: {
    label: 'CC BY 4.0',
    url: 'https://creativecommons.org/licenses/by/4.0/',
  },
};

/** Curated external scenes. Local previews never initiate a Sketchfab request. */
export const worlds: World[] = [
  {
    id: 'world-modern-kitchen',
    slug: 'modern-kitchen',
    title: 'Modern Kitchen',
    category: 'Kitchen',
    year: worldsEdition,
    description:
      'A contemporary kitchen study shaped around material, light and everyday rituals.',
    image: {
      src: '/images/world-modern-kitchen.webp',
      alt: 'Modern Kitchen scene: a pale stone island, three dark stools and pendant lights beside a tall window',
    },
    sketchfabUid: '9843a830b96142a9a53f45f25304d93c',
    externalUrl:
      'https://sketchfab.com/3d-models/modern-kitchen-9843a830b96142a9a53f45f25304d93c',
    credit,
  },
  {
    id: 'world-white-modern-living-room',
    slug: 'white-modern-living-room',
    title: 'White Modern Living Room',
    category: 'Living',
    year: worldsEdition,
    description:
      'A light-filled living space composed through soft surfaces and restrained geometry.',
    image: {
      src: '/images/world-white-modern-living-room.webp',
      alt: 'White Modern Living Room scene: a curved pale sofa and low table facing a quiet media wall',
    },
    sketchfabUid: 'afb8cb0cbee1488caf61471ef14041e9',
    externalUrl:
      'https://sketchfab.com/3d-models/white-modern-living-room-afb8cb0cbee1488caf61471ef14041e9',
    credit,
  },
  {
    id: 'world-minimalistic-modern-bedroom',
    slug: 'minimalistic-modern-bedroom',
    title: 'Minimalistic Modern Bedroom',
    category: 'Bedroom',
    year: worldsEdition,
    description:
      'A quiet bedroom study defined by proportion, softness and a slower rhythm.',
    image: {
      src: '/images/world-minimalistic-modern-bedroom.webp',
      alt: 'Minimalistic Modern Bedroom scene: a low upholstered bed, timber floor and tall windows framing trees',
    },
    sketchfabUid: '4f3db3cb57bd4bce886f7b9a13273a2f',
    externalUrl:
      'https://sketchfab.com/3d-models/minimalistic-modern-bedroom-4f3db3cb57bd4bce886f7b9a13273a2f',
    credit,
  },
  {
    id: 'world-modern-bathroom',
    slug: 'modern-bathroom',
    title: 'Modern Bathroom',
    category: 'Bathroom',
    year: worldsEdition,
    description:
      'A restrained bathroom environment balancing stone, light and clean architectural lines.',
    image: {
      src: '/images/world-modern-bathroom.webp',
      alt: 'Modern Bathroom scene: a freestanding bath by a frosted window, twin basins and a timber vanity',
    },
    sketchfabUid: '9ba7e0a094694335bd8f4656611c0676',
    externalUrl:
      'https://sketchfab.com/3d-models/modern-bathroom-9ba7e0a094694335bd8f4656611c0676',
    credit,
  },
];
