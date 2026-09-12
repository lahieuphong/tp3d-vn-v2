import Link from 'next/link';
import { EditorialImage } from '@/components/shared/editorial-image';
import { images } from '@/data/images';
export function ExperienceBanner({
  slug = 'the-walnut-residence',
  image = images.hero,
  compact = false,
}: {
  slug?: string;
  image?: string;
  compact?: boolean;
}) {
  return (
    <section
      className={`experience-banner ${compact ? 'compact-experience' : ''}`}
    >
      <EditorialImage
        src={image}
        alt="A considered interior, ready to be explored from another perspective"
      />
      <div className="experience-banner-content">
        <p className="eyebrow">STEP INSIDE</p>
        <h2>
          {compact ? (
            <>
              A different perspective.
              <br />
              The same <em>feeling of home.</em>
            </>
          ) : (
            <>
              Explore the interior
              <br />
              <em>from within.</em>
            </>
          )}
        </h2>
        <p>
          {compact ? (
            <>
              Explore interiors in 3D. Move through the space,
              <br className="desktop-break" /> discover the materials, and get
              closer to the details.
            </>
          ) : (
            <>
              Move through the space, study materials and discover
              <br className="desktop-break" /> the objects that shape each room.
            </>
          )}
        </p>
        <Link
          prefetch={false}
          href={`/experience/${slug}`}
          className="text-link"
        >
          {compact ? 'Enter a 3D space' : 'Explore in 3D'}{' '}
          <span aria-hidden="true">↗</span>
        </Link>
        <span className="experience-note">
          Spatial experiences — in preparation
        </span>
      </div>
      <span className="experience-index" aria-hidden="true">
        360°
      </span>
    </section>
  );
}
