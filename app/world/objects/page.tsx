import type { Metadata } from 'next';
import { WorldObjects } from '@/components/world/world-objects';

export const metadata: Metadata = {
  title: { absolute: 'Objects — TP3D' },
  description:
    'Room 02 of the TP3D World: object studies of furniture and lighting, documented by form, material and size.',
};

/* The wrapper is the page's first DOM node, so the router finds a scroll
   target in the body (not a hoisted stylesheet) and opens the room at its
   top. */
export default function ObjectsPage() {
  return (
    <div data-world-page="objects">
      <WorldObjects />
    </div>
  );
}
