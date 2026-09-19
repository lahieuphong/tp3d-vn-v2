import type { Metadata } from 'next';
import { worlds, worldsEdition } from '@/data/worlds';
import { readWorldQuery } from '@/lib/world-catalog';
import { WorldsHero } from '@/components/worlds/worlds-hero';
import { FeaturedWorlds } from '@/components/worlds/featured-worlds';
import { WorldsCatalog } from '@/components/worlds/worlds-catalog';
import { WorldCredits } from '@/components/worlds/world-credits';
import { TextLink } from '@/components/shared/text-link';
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
      <FeaturedWorlds worlds={worlds} />
      <WorldsCatalog
        worlds={worlds}
        initialQuery={readWorldQuery(query, worlds)}
      />
      <WorldCredits worlds={worlds} />
      <section
        className="container section worlds-closing"
        aria-labelledby="worlds-closing-title"
      >
        <p className="eyebrow">AN OPEN COLLECTION</p>
        <h2 id="worlds-closing-title">
          New perspectives.
          <br />
          <em>More worlds to come.</em>
        </h2>
        <TextLink href="/spaces">Explore our interiors</TextLink>
      </section>
    </main>
  );
}
