'use client';
/* oxlint-disable next/no-img-element -- The rail intentionally selects the local 720px rendition. */

import type { World } from '@/data/types';

export function WorldThumbnailRail({
  worlds,
  current,
  onSelect,
}: {
  worlds: World[];
  current: string;
  onSelect: (world: World) => void;
}) {
  return (
    <nav className="world-thumbnail-rail" aria-label="Other worlds">
      {worlds.map((world, index) => {
        const selected = world.slug === current;
        return (
          <button
            type="button"
            className="world-thumbnail"
            key={world.id}
            aria-label={`Open ${world.title}`}
            aria-current={selected ? 'true' : undefined}
            onClick={() => onSelect(world)}
          >
            <span className="world-thumbnail-index">
              {String(index + 1).padStart(2, '0')}
            </span>
            <img
              src={world.image.src.replace(/\.webp$/, '-720.webp')}
              alt=""
              loading={selected || index < 6 ? 'eager' : 'lazy'}
              decoding="async"
            />
          </button>
        );
      })}
    </nav>
  );
}
