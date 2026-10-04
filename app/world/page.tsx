import type { Metadata } from 'next';
import { WorldLobby } from '@/components/world/world-lobby';

export const metadata: Metadata = {
  title: { absolute: 'The Lobby — TP3D' },
  description:
    'Enter the TP3D World: a quiet lobby opening onto galleries, objects, an archive, a lab and a studio.',
};

/* The wrapper is the page's first DOM node, so the router finds a scroll
   target in the body (not a hoisted stylesheet) and opens rooms at the top. */
export default function WorldPage() {
  return (
    <div data-world-page="lobby">
      <WorldLobby />
    </div>
  );
}
