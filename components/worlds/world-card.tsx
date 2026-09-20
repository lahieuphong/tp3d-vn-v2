import type { World } from '@/data/types';
import { WorldCardMedia } from './world-card-media';

export function WorldCard({
  world,
  index,
  featured = false,
  priority = false,
  sizes,
}: {
  world: World;
  index: number;
  featured?: boolean;
  priority?: boolean;
  sizes?: string;
}) {
  const content = (
    <WorldCardMedia
      world={world}
      index={index}
      featured={featured}
      priority={priority}
      sizes={sizes}
    />
  );

  return (
    <article
      className={`world-card${featured ? ' world-card--featured' : ''}`}
      id={featured ? undefined : world.slug}
      data-world={featured ? undefined : world.slug}
      data-layout={world.layout ?? 'landscape'}
      data-world-card
    >
      {world.available ? (
        <a
          className="world-card-link"
          data-tilt-card
          href={`/worlds/${world.slug}`}
          aria-label={`Open ${world.title}`}
          onClick={() => {
            try {
              sessionStorage.setItem('tan-phong-world-origin', world.slug);
            } catch {
              // The native detail link still works when browser storage is unavailable.
            }
          }}
        >
          {content}
        </a>
      ) : (
        <div
          className="world-card-link"
          aria-label={`${world.title} — in preparation`}
        >
          {content}
        </div>
      )}
    </article>
  );
}
