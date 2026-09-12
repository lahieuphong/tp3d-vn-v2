import generatedImageDimensions from './image-dimensions.json';

export const images = {
  hero: '/images/hero.webp',
  living: '/images/living.webp',
  quiet: '/images/quiet.webp',
  bedroom: '/images/bedroom.webp',
  kitchen: '/images/kitchen.webp',
  linen: '/images/linen.webp',
  stone: '/images/stone.webp',
  wood: '/images/wood.webp',
  classic: '/images/classic.webp',
  chair: '/images/chair.webp',
  pendant: '/images/pendant.webp',
  dining: '/images/dining.webp',
  textile: '/images/textile.webp',
  sofa: '/images/sofa.webp',
  table: '/images/table.webp',
  workspace: '/images/workspace.webp',
};

export const imageDimensions = generatedImageDimensions as Record<
  string,
  { width: number; height: number }
>;

export const photo = (src: string, alt: string) => ({ src, alt });
