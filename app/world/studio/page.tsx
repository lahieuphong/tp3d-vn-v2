import type { Metadata } from 'next';
import { WorldStudio } from '@/components/world/world-studio';

export const metadata: Metadata = {
  title: { absolute: 'Studio — TP3D' },
  description:
    'Room 05 of the TP3D World: a place for project framing, spatial direction, material thinking and future collaboration.',
};

/* The wrapper is the page's first DOM node, so the router finds a scroll
   target in the body (not a hoisted stylesheet) and opens the room at its
   top. */
export default function StudioPage() {
  return (
    <div data-world-page="studio">
      <WorldStudio />
    </div>
  );
}
