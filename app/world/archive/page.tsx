import type { Metadata } from 'next';
import { WorldArchive } from '@/components/world/world-archive';

export const metadata: Metadata = {
  title: { absolute: 'Archive — TP3D' },
  description:
    'Room 03 of the TP3D World: a reading room of material and editorial records, each with its source.',
};

/* The wrapper is the page's first DOM node, so the router finds a scroll
   target in the body (not a hoisted stylesheet) and opens the room at its
   top. */
export default function ArchivePage() {
  return (
    <div data-world-page="archive">
      <WorldArchive />
    </div>
  );
}
