import type { World } from '@/data/types';
import { EditorialImage } from '@/components/shared/editorial-image';

export function WorldsHero({
  count,
  edition,
  world,
}: {
  count: number;
  edition: string;
  world: World;
}) {
  return (
    <section className="container worlds-hero" aria-labelledby="worlds-title">
      <div className="worlds-hero-copy">
        <p className="eyebrow">EXPLORE. EXPERIENCE. BELONG.</p>
        <h1 id="worlds-title">
          Curated 3D Worlds
        </h1>
        <p className="worlds-hero-description">
          Step into a collection of immersive interior worlds, shaped by
          material, light and everyday rituals. Explore spaces in three
          dimensions and experience Tân Phong from anywhere.
        </p>
        <p className="worlds-hero-line eyebrow">A MORE TANGIBLE TOMORROW</p>
      </div>
      <div className="worlds-hero-visual">
        <EditorialImage
          src={world.image.src}
          alt={world.image.alt}
          priority
          sizes="(max-width: 820px) 100vw, 62vw"
        />
        <span className="worlds-hero-visual-note eyebrow" aria-hidden="true">
          SPACES<br />THAT<br />BREATHE
        </span>
        <span className="worlds-hero-image-count eyebrow" aria-hidden="true">
          01 / {String(count).padStart(2, '0')}
        </span>
      </div>
      <div className="worlds-hero-edition eyebrow">
        <span>{String(count).padStart(2, '0')} MODELS</span>
        <span>
          CURATED IN {edition} <span aria-hidden="true">/</span> DIGITAL
          INTERIORS &amp; OBJECTS
        </span>
      </div>
    </section>
  );
}
