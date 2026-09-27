import Link from 'next/link';
import { spacesChapterItems } from '@/data/home-chapters';
import { EditorialImage } from '@/components/shared/editorial-image';
import { ChapterImage } from './chapter-image';
import { ChapterColophon } from './chapter-colophon';

export function SpacesChapter() {
  return (
    <section
      className="hc-chapter hc-spaces"
      data-home-chapter="spaces"
      aria-labelledby="home-spaces-title"
      id="home-spaces"
    >
      <div className="hc-backdrop" aria-hidden="true">
        <div data-chapter-depth="background">
          <ChapterImage asset="spaces-architecture" />
        </div>
      </div>
      <div className="hc-spaces-heading" data-chapter-depth="copy">
        <p className="hc-eyebrow">
          SAMPLE SPACES
          <br />
          CURATED INTERIORS
        </p>
        <h2 id="home-spaces-title" data-chapter-reveal>
          Rooms as
          <br />
          <em>atmospheres.</em>
        </h2>
      </div>
      <p className="hc-spaces-intro hc-body" data-chapter-reveal>
        Curated interior studies that explore how space, material and light
        shape a more thoughtful way of living.
      </p>
      <p className="hc-axis" aria-hidden="true">
        <i />
        SPACES
        <br />
        SHAPED
        <br />
        BY A NEW
        <br />
        BREEZE
        <i />
      </p>
      <nav className="hc-room-portals" aria-label="Explore sample spaces">
        {spacesChapterItems.map((space, index) => (
          <Link
            className="hc-room"
            href={space.href}
            prefetch={false}
            key={space.id}
          >
            <div className="hc-room-arch" data-callout-index={index}>
              <EditorialImage
                src={space.image}
                alt={space.alt}
                sizes="(max-width: 767px) 44vw, (max-width: 1199px) 42vw, 24vw"
              />
            </div>
            <div className="hc-room-caption">
              <span>{space.number}</span>
              <h3>{space.title}</h3>
              <span aria-hidden="true">⟶</span>
            </div>
            <p className="hc-eyebrow">{space.subtitle}</p>
          </Link>
        ))}
      </nav>
      <ChapterColophon />
    </section>
  );
}
