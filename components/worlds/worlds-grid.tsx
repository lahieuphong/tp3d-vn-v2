'use client';

import { useRef, useEffect } from 'react';
import type { World } from '@/data/types';
import { WorldCard } from './world-card';
import { useCardTilt } from './use-card-tilt';
import { useWorldReveal } from './use-world-reveal';

export function WorldsGrid({
  worlds,
  indices,
  focusFrom,
}: {
  worlds: World[];
  indices: Map<string, number>;
  focusFrom: number | null;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useCardTilt(ref);
  useWorldReveal(ref, worlds.map((world) => world.id).join(','));
  useEffect(() => {
    if (focusFrom === null) return;
    const card =
      ref.current?.querySelectorAll<HTMLElement>('.world-card')[focusFrom];
    const link = card?.querySelector<HTMLAnchorElement>('a');
    if (link) {
      link.focus({ preventScroll: true });
      link.scrollIntoView({ block: 'nearest', behavior: 'instant' });
    }
  }, [focusFrom]);
  return (
    <div className="worlds-grid" ref={ref}>
      {worlds.map((world, visibleIndex) => (
        <WorldCard
          key={world.id}
          world={world}
          index={indices.get(world.id) ?? 0}
          priority={visibleIndex < 4}
        />
      ))}
    </div>
  );
}
