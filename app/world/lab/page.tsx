import type { Metadata } from 'next';
import { WorldLab } from '@/components/world/world-lab';

export const metadata: Metadata = {
  title: { absolute: 'Lab — TP3D' },
  description:
    'Room 04 of the TP3D World: production experiments in atmosphere, movement, depth and spatial interaction.',
};

/* The wrapper is the page's first DOM node, so the router finds a scroll
   target in the body (not a hoisted stylesheet) and opens the room at its
   top. */
export default function LabPage() {
  return (
    <div data-world-page="lab">
      <WorldLab />
    </div>
  );
}
