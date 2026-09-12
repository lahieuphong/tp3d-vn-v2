import type { Article } from './types';
import { images, photo } from './images';
export const journal: Article[] = [
  {
    slug: 'the-art-of-warm-minimalism',
    title: 'The Art of Warm Minimalism',
    category: 'PERSPECTIVES',
    date: '2026-08-18',
    description: 'Finding warmth in the spaces we leave open.',
    image: photo(
      images.quiet,
      'A restrained living room with pale timber and soft textiles',
    ),
    sections: [
      {
        heading: 'Begin with what a room needs.',
        body: 'A place to sit, somewhere to set down a cup, a clear path through the room. These modest requirements can be a useful beginning. When each object has a reason to be there, a space gains a kind of ease that decoration alone cannot provide.',
      },
      {
        heading: 'Let texture bring the depth.',
        body: 'Simplicity does not require smoothness. A woven rug, the grain of a timber table or the slightly irregular surface of plaster introduces variation without adding visual noise. In a restrained palette, these small differences become the things we notice.',
      },
      {
        heading: 'Leave something unfinished.',
        body: 'A home continues after the drawing is complete. Books accumulate, light moves, a chair finds a better place. Leaving room for these ordinary changes is part of the design, and often the source of its warmth.',
      },
    ],
  },
  {
    slug: 'working-with-natural-stone',
    title: 'Working with Natural Stone',
    category: 'MATERIAL STUDY',
    date: '2026-07-24',
    description:
      'On variation, weight and the beauty of an unrepeatable surface.',
    image: photo(
      images.stone,
      'A close study of warm natural stone and its veining',
    ),
    sections: [
      {
        heading: 'A surface with its own history.',
        body: 'No two pieces of stone are quite alike. Veins, pores and shifts in tone give a slab its particular character. Looking at a full sample, rather than a small swatch, is an essential part of understanding how it may sit within a room.',
      },
      {
        heading: 'Balance the weight.',
        body: 'A substantial stone table can anchor a room. Placed beside softer textiles or a slender timber chair, its weight becomes a useful counterpoint. The interest comes from the relationship between materials, not from the stone alone.',
      },
      {
        heading: 'Choose the finish with the light.',
        body: 'A honed surface softens reflections; a polished finish makes them more pronounced. Consider the direction of daylight and the way the object will be used before choosing. Maintenance and sealing should follow advice for the specific stone.',
      },
    ],
  },
  {
    slug: 'creating-a-quiet-living-space',
    title: 'Creating a Quiet Living Space',
    category: 'SPACES',
    date: '2026-07-06',
    description: 'Small decisions that make a room feel at ease.',
    image: photo(
      images.living,
      'Sunlight across curved seating and a softly textured wall',
    ),
    sections: [
      {
        heading: 'Arrange for life, not the photograph.',
        body: 'Comfort begins with the relationships between things. Seating should allow a conversation without leaning forward; a table should be within reach. Begin with how a room will be used, then refine the composition.',
      },
      {
        heading: 'Give the room a centre.',
        body: 'A rug can hold a group of furniture together. A low table or a view towards a window can offer a point of focus. A centre does not need to be dramatic; it simply helps the room feel legible.',
      },
      {
        heading: 'Reduce the competing voices.',
        body: 'A small set of related colours and materials allows the individual details to be seen. Repeat a timber tone, carry a textile into another corner, or leave a wall empty. Quiet is often a question of editing.',
      },
    ],
  },
  {
    slug: 'light-texture-and-material',
    title: 'Light, Texture and Material',
    category: 'DESIGN NOTES',
    date: '2026-06-12',
    description: 'A room changes long after its materials have been chosen.',
    image: photo(
      images.linen,
      'Light filtering through curtains onto a woven textile and soft seating',
    ),
    sections: [
      {
        heading: 'Observe before deciding.',
        body: 'Morning and afternoon can reveal entirely different rooms. Watch where the light falls, which surfaces remain in shade and how the colour shifts. Material samples are most useful when viewed in the place they will eventually belong.',
      },
      {
        heading: 'Build layers of light.',
        body: 'A pendant brings attention to a table. A reading light makes a corner useful. Reflected light gives a wall depth. These separate sources can work together without asking one bright ceiling light to do everything.',
      },
      {
        heading: 'Make room for shadow.',
        body: 'Shadow gives texture its definition. The small relief of woven cloth, timber grain or plaster becomes visible as light passes across it. An evenly lit room can lose some of this depth; a little variation makes the interior feel more natural.',
      },
    ],
  },
];
