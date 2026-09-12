import Link from 'next/link';
import type { Space } from '@/data/types';
import { EditorialImage } from '@/components/shared/editorial-image';
export function SpacePreview({
  space,
  index = 0,
}: {
  space: Space;
  index?: number;
}) {
  return (
    <article className="space-preview">
      <Link href={`/spaces/${space.slug}`} className="image-link">
        <EditorialImage src={space.image.src} alt={space.image.alt} />
        <div className="image-caption">
          <div>
            <p className="eyebrow">
              0{index + 1} — {space.title.toUpperCase()}
            </p>
            <h3>{space.subtitle}</h3>
          </div>
          <span className="caption-arrow" aria-hidden="true">
            ↗
          </span>
        </div>
        <span className="sr-only">Explore {space.title} space</span>
      </Link>
    </article>
  );
}
