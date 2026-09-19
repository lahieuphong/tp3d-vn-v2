import type { World } from '@/data/types';
import { EditorialImage } from '@/components/shared/editorial-image';

const compositions = ['opening', 'reversed', 'inset', 'panorama'] as const;

export function WorldEntry({ world, index }: { world: World; index: number }) {
  return (
    <article
      id={world.slug}
      className={`world-entry world-entry--${compositions[index % compositions.length]}`}
      aria-labelledby={`${world.slug}-title`}
      data-world={world.slug}
    >
      <p className="world-entry-index eyebrow">
        <span>
          {String(index + 1).padStart(2, '0')} / {world.category.toUpperCase()}
        </span>
        <span>{world.year}</span>
      </p>
      <a
        className="world-entry-image image-link"
        href={world.externalUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Enter ${world.title} on Sketchfab (opens in a new tab)`}
      >
        <EditorialImage
          src={world.image.src}
          alt={world.image.alt}
          sizes="(max-width: 760px) 100vw, (min-width: 1700px) 1440px, 85vw"
        />
      </a>
      <div className="world-entry-copy">
        <h2 id={`${world.slug}-title`}>{world.title}</h2>
        <div className="world-entry-description">
          <p>{world.description}</p>
          <a
            className="text-link world-enter-link"
            href={world.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>
              ENTER WORLD
              <span className="sr-only">
                : {world.title} on Sketchfab (opens in a new tab)
              </span>
            </span>
            <span aria-hidden="true">↗</span>
          </a>
          <p className="world-host-note">Explore on Sketchfab</p>
        </div>
        <p className="world-entry-credit">
          Scene by{' '}
          <a href={world.credit.url} target="_blank" rel="noopener noreferrer">
            {world.credit.name}
            <span className="sr-only"> (opens in a new tab)</span> ↗
          </a>
          <span aria-hidden="true"> · </span>
          <a
            href={world.credit.license.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {world.credit.license.label}
            <span className="sr-only"> (opens in a new tab)</span> ↗
          </a>
        </p>
      </div>
    </article>
  );
}
