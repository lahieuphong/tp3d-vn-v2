import type { World } from '@/data/types';
import { EditorialImage } from '@/components/shared/editorial-image';

export function WorldCardMedia({
  world,
  featured,
  priority,
  sizes,
}: {
  world: World;
  featured?: boolean;
  priority?: boolean;
  sizes?: string;
}) {
  return (
    <div className="world-card-visual">
      <EditorialImage
        src={world.image.src}
        alt={world.image.alt}
        priority={priority}
        sizes={
          sizes ??
          (featured
            ? '(max-width: 760px) calc(100vw - 44px), 60vw'
            : '(max-width: 760px) 100vw, 50vw')
        }
      />
      <div className="world-card-overlay">
        <div className="world-card-information">
          <p className="world-card-category">
            {world.category}
          </p>
          <h3>{world.title}</h3>
          <p className="world-card-meta">
            {world.shortDescription ?? world.description}
          </p>
        </div>
        <span className="world-card-enter" aria-hidden="true">
          <span>{world.available ? 'VIEW MODEL' : 'IN PREPARATION'}</span>
          {world.available && <span className="world-card-arrow">↗</span>}
        </span>
      </div>
    </div>
  );
}
