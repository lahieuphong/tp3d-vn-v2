import type { World } from '@/data/types';
import { EditorialImage } from '@/components/shared/editorial-image';

export function WorldsHero({
  featured,
  count,
  edition,
}: {
  featured?: World;
  count: number;
  edition: string;
}) {
  return (
    <section className="container worlds-hero" aria-labelledby="worlds-title">
      <div className="worlds-hero-copy">
        <p className="eyebrow">3D / SPATIAL STUDIES</p>
        <h1 id="worlds-title">
          <span>WORLDS</span>
          <span>TO STEP</span>
          <em>INSIDE.</em>
        </h1>
        <p className="worlds-hero-description">
          A collection of digital interiors
          <br className="worlds-desktop-break" /> made to be explored from
          within.
        </p>
        <a href="#world-index" className="text-link worlds-index-link">
          Discover the collection <span aria-hidden="true">↓</span>
        </a>
      </div>
      {featured && (
        <figure className="worlds-hero-preview">
          <EditorialImage
            src={featured.image.src}
            alt={featured.image.alt}
            priority
            sizes="(max-width: 760px) 100vw, 48vw"
          />
          <figcaption>
            <span>{featured.category.toUpperCase()} / FROM THE COLLECTION</span>
            <span aria-hidden="true">↙</span>
          </figcaption>
        </figure>
      )}
      <div className="worlds-hero-edition eyebrow">
        <span>
          {String(count).padStart(2, '0')} SPACES / {edition}
        </span>
        <span>A DIGITAL INTERIOR GALLERY</span>
      </div>
    </section>
  );
}
