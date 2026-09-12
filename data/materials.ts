import type { Material } from './types';
import { images, photo } from './images';
export const materials: Material[] = [
  {
    slug: 'natural-oak',
    title: 'Natural Oak',
    family: 'WOOD',
    description: 'A quiet grain. A natural warmth.',
    detail:
      'Pale timber introduces warmth without weight. This oak study considers the rhythm of the grain, the meeting of boards and the way a natural surface softens with use.',
    finish: 'Matte, open-pore',
    care: 'Wipe with a soft, slightly damp cloth. Keep prolonged moisture and direct heat away from the surface.',
    image: photo(
      images.wood,
      'A close study of timber grain; an illustrative wood reference',
    ),
    color: '#b09a73',
  },
  {
    slug: 'walnut',
    title: 'Walnut',
    family: 'WOOD',
    description: 'Depth, warmth and an expressive grain.',
    detail:
      'Walnut brings a deeper register to a room. Used across joinery or in a single object, its rich tones sit comfortably beside pale stone and woven textiles.',
    finish: 'Oiled, satin',
    care: 'Dust with a soft cloth and protect from standing water. Refresh the finish according to the chosen manufacturer’s guidance.',
    image: photo(
      images.wood,
      'Dark timber grain; an illustrative reference for the walnut material study',
    ),
    color: '#74513a',
  },
  {
    slug: 'travertine',
    title: 'Travertine',
    family: 'STONE',
    description: 'A mineral surface, quietly irregular.',
    detail:
      'The character of travertine lies in its small variations. A honed surface feels soft in changing light, bringing the landscape into the interior at the scale of a table or floor.',
    finish: 'Honed, filled',
    care: 'Use a pH-neutral stone cleaner. Avoid acidic products and wipe spills promptly; sealing depends on the application.',
    image: photo(
      images.stone,
      'Warm veined natural stone; an illustrative reference for the stone study',
    ),
    color: '#c6b699',
  },
  {
    slug: 'linen',
    title: 'Linen',
    family: 'TEXTILE',
    description: 'An open weave that holds the light.',
    detail:
      'Linen gives a room a gentle informality. Its visible fibres and softened colour work across upholstery, curtains and smaller objects, allowing texture to take the place of pattern.',
    finish: 'Natural weave',
    care: 'Follow the textile’s care label. Vacuum upholstery gently and keep removable covers away from high heat.',
    image: photo(images.textile, 'A close view of a natural woven textile'),
    color: '#d7cdb9',
  },
  {
    slug: 'leather',
    title: 'Leather',
    family: 'UPHOLSTERY',
    description: 'A surface that records everyday life.',
    detail:
      'A supple leather detail adds depth to a quiet material palette. The study pairs warm brown upholstery with pale timber and soft mineral tones.',
    finish: 'Soft, matte',
    care: 'Dust gently. Avoid solvents and direct sunlight; use only care products intended for the specific leather finish.',
    image: photo(
      images.chair,
      'An upholstery form reference; final leather sample to be selected',
    ),
    color: '#926d4c',
  },
  {
    slug: 'brushed-metal',
    title: 'Brushed Metal',
    family: 'METAL',
    description: 'A fine reflection. A measured contrast.',
    detail:
      'Brushed metal catches light without a mirror-like shine. Small metal details sharpen an otherwise soft interior, from a pendant shade to the edge of a handle.',
    finish: 'Fine brushed',
    care: 'Clean along the grain with a soft cloth. Avoid abrasive pads and test any cleaner on an inconspicuous area.',
    image: photo(
      images.pendant,
      'A warm metal pendant illustrating the brushed metal palette',
    ),
    color: '#9c8b70',
  },
];
