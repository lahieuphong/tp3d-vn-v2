import type { World } from '@/data/types';
import { WorldCardMedia } from './world-card-media';

export function WorldCard({
  world,
  index,
  featured = false,
  priority = false,
}: {
  world: World;
  index: number;
  featured?: boolean;
  priority?: boolean;
}) {
  const content = (
    <>
      <WorldCardMedia world={world} featured={featured} priority={priority} />
      <div className="world-card-copy">
        <p className="world-card-category eyebrow">
          {String(index + 1).padStart(2, '0')} / {world.category}
        </p>
        <h3>{world.title}</h3>
        <p className="world-card-meta">
          <span>
          {world.type} <span aria-hidden="true">·</span> {world.year}
          </span>
          <span>VIEW MODEL ↗</span>
        </p>
      </div>
    </>
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
            sessionStorage.setItem('tan-phong-world-origin', world.slug);
          }}
        >
          {content}
        </a>
      ) : (
        <div className="world-card-link">{content}</div>
      )}
    </article>
  );
}
