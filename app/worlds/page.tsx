import type { Metadata } from 'next';
import { worlds, worldsEdition } from '@/data/worlds';
import { readWorldQuery } from '@/lib/world-catalog';
import { WorldsHero } from '@/components/worlds/worlds-hero';
import { WorldsCatalog } from '@/components/worlds/worlds-catalog';
import '@/components/worlds/worlds.css';

export const metadata: Metadata = {
  title: '3D Worlds',
  description:
    'A curated catalogue of digital interiors, objects and spatial studies. Find a world to explore.',
};

export default async function WorldsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const key of ['category', 'q', 'sort']) {
    const value = params[key];
    if (typeof value === 'string') query.set(key, value);
  }
  return (
    <main id="main" className="worlds-page">
      <WorldsHero count={worlds.length} edition={worldsEdition} />
      <WorldsCatalog
        worlds={worlds}
        initialQuery={readWorldQuery(query, worlds)}
      />
    </main>
  );
}
