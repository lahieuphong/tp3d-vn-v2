'use client';

import { useRef } from 'react';
import type { World } from '@/data/types';
import { getFeaturedWorlds } from '@/lib/world-catalog';
import { WorldCard } from './world-card';
import { useCardTilt } from './use-card-tilt';
import { useWorldReveal } from './use-world-reveal';

export function FeaturedWorlds({ worlds }: { worlds: World[] }) {
  const featured = getFeaturedWorlds(worlds);
  const ref = useRef<HTMLDivElement>(null);
  useCardTilt(ref);
  useWorldReveal(ref, featured.map((world) => world.id).join(','));
  if (!featured.length) return null;
  return (
    <section
      className="container worlds-featured"
      aria-labelledby="worlds-featured-title"
    >
      <div className="worlds-section-heading">
        <h2 className="eyebrow" id="worlds-featured-title">
          FEATURED WORLDS
        </h2>
        <p>A closer look at the collection.</p>
      </div>
      <div
        className="worlds-featured-grid"
        data-count={featured.length}
        ref={ref}
      >
        {featured.map((world, index) => (
          <WorldCard
            world={world}
            index={worlds.indexOf(world)}
            key={world.id}
            featured
            priority={index === 0}
          />
        ))}
      </div>
    </section>
  );
}
