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
            {world.type} <span aria-hidden="true">·</span> {world.style}{' '}
            <span aria-hidden="true">·</span> {world.year}
          </span>
          <span>{world.available ? '3D WORLD' : 'IN PREPARATION'}</span>
        </p>
      </div>
    </>
  );

  return (
    <article
      className={`world-card${featured ? ' world-card--featured' : ''}`}
      id={featured ? undefined : world.slug}
      data-world={featured ? undefined : world.slug}
      data-world-card
    >
      {world.available ? (
        <a
          className="world-card-link"
          data-tilt-card
          href={world.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Explore ${world.title} on Sketchfab (opens in a new tab)`}
        >
          {content}
        </a>
      ) : (
        <div className="world-card-link">{content}</div>
      )}
    </article>
  );
}
