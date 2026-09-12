import { EditorialImage } from '@/components/shared/editorial-image';
import { TextLink } from '@/components/shared/text-link';
import { images } from '@/data/images';
export function HomeHero() {
  return (
    <section className="home-hero" aria-labelledby="hero-title">
      <EditorialImage
        src={images.hero}
        alt="A sunlit contemporary living room with sculptural furniture, cream upholstery and warm walnut details"
        priority
      />
      <div className="hero-shade" />
      <div className="hero-content">
        <p className="eyebrow">A CONSIDERED WAY OF LIVING</p>
        <h1 id="hero-title">
          Spaces shaped
          <br />
          for <em>living.</em>
        </h1>
        <p className="hero-description">
          Interiors, materials and objects.
          <br />A quiet dialogue, a personal perspective.
        </p>
        <div className="hero-links">
          <TextLink href="/spaces">Explore spaces</TextLink>
          <TextLink href="/projects">View projects</TextLink>
        </div>
      </div>
      <div className="hero-bottom">
        <span>THE WALNUT RESIDENCE — 2026</span>
        <a href="#introduction">
          SCROLL TO DISCOVER <span aria-hidden="true">↓</span>
        </a>
        <span>INTERIOR / 2026</span>
      </div>
    </section>
  );
}
