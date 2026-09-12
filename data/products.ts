import type { Product } from './types';
import { images, photo } from './images';
export const products: Product[] = [
  {
    slug: 'form-lounge-chair',
    title: 'Form Lounge Chair',
    category: 'SEATING',
    collection: 'The Soft Forms Study',
    description:
      'A sculptural silhouette with a generous seat. Soft upholstery and a grounded profile make room for an unhurried moment.',
    dimensions: 'Concept dimensions · 82 × 86 × 74 cm',
    material: 'Textured upholstery · solid timber structure',
    image: photo(
      images.chair,
      'A timber lounge chair with pale upholstered cushions against a neutral backdrop',
    ),
  },
  {
    slug: 'line-sofa',
    title: 'Line Sofa',
    category: 'SOFAS',
    collection: 'The Living Collection',
    description:
      'A generous modular form that opens towards the room. The low profile invites conversation, while a softly textured surface adds depth to a restrained palette.',
    dimensions: 'Concept dimensions · 240 × 105 × 72 cm',
    material: 'Linen blend upholstery · timber frame',
    image: photo(
      images.sofa,
      'A softly upholstered sofa in a warm contemporary interior',
    ),
  },
  {
    slug: 'round-coffee-table',
    title: 'Round Coffee Table',
    category: 'TABLES',
    collection: 'The Material Study',
    description:
      'A low table with a simple, architectural presence. The grain of its surface becomes the detail, changing quietly with the light.',
    dimensions: 'Concept dimensions · Ø 85 × 34 cm',
    material: 'Natural material study · honed finish',
    image: photo(
      images.table,
      'A low coffee table in a considered living space',
    ),
  },
  {
    slug: 'copper-pendant',
    title: 'Copper Pendant',
    category: 'LIGHTING',
    collection: 'The Light Collection',
    description:
      'A suspended metal shade that holds the light close. A warm finish introduces a subtle point of contrast within a quiet room.',
    dimensions: 'Concept dimensions · Ø 38 × 28 cm',
    material: 'Brushed metal · warm finish',
    image: photo(
      images.pendant,
      'A single warm metal pendant against a charcoal wall',
    ),
  },
];
