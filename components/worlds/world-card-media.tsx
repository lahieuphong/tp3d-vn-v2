import type { World } from '@/data/types';
import { EditorialImage } from '@/components/shared/editorial-image';

export function WorldCardMedia({
  world,
  featured,
  priority,
}: {
  world: World;
  featured?: boolean;
  priority?: boolean;
}) {
  return (
    <div className="world-card-visual">
      <span className="world-card-plane" aria-hidden="true" />
      <EditorialImage
        src={world.image.src}
        alt={world.image.alt}
        priority={priority}
        sizes={
          featured
            ? '(max-width: 760px) calc(100vw - 44px), (min-width: 1568px) 840px, 60vw'
            : '(max-width: 760px) calc(100vw - 44px), (max-width: 1100px) 45vw, (min-width: 1568px) 464px, 30vw'
        }
      />
      <span className="world-card-frame" aria-hidden="true" />
      {world.available && (
        <span className="world-card-enter" aria-hidden="true">
          <span>EXPLORE</span>
          <span>↗</span>
        </span>
      )}
    </div>
  );
}
