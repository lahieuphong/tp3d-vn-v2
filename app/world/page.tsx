import type { Metadata } from 'next';
import { WorldLobby } from '@/components/world/world-lobby';

export const metadata: Metadata = {
  title: { absolute: 'The Lobby — TP3D' },
  description:
    'Enter the TP3D World: a quiet lobby opening onto galleries, objects, an archive, a lab and a studio.',
};

export default function WorldPage() {
  return <WorldLobby />;
}
