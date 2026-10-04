import type { Metadata } from 'next';
import { WorldGallery } from '@/components/world/world-gallery';

export const metadata: Metadata = {
  title: { absolute: 'Gallery — TP3D' },
  description:
    'Room 01 of the TP3D World: a curated exhibition of digital interiors, each one open to explore in 3D.',
};

/* The wrapper is the page's first DOM node, so the router finds a scroll
   target in the body (not a hoisted stylesheet) and opens the room at its
   top. */
export default function GalleryPage() {
  return (
    <div data-world-page="gallery">
      <WorldGallery />
    </div>
  );
}
