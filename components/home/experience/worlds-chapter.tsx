/* oxlint-disable next/no-img-element -- Tiny local previews, requested only by desktop hover-capable sources. */
import Link from 'next/link';
import { worldsChapterOptions } from '@/data/home-chapters';
import { ChapterImage } from './chapter-image';
import './worlds-chapter.css';

export function WorldsChapter() {
  return (
    <>
      {/* Reduced motion gets a short, static sky detail in normal flow. Sources
        are requested only in that mode and reuse the already prepared plate;
        this is a crop, not a fabricated independent sky/depth layer. */}
      <div className="story-still-sky" data-story-sky aria-hidden="true">
        <picture>
          <source
            media="(prefers-reduced-motion: reduce) and (max-width: 767px)"
            srcSet="/images/home-chapters/worlds-atrium-720.webp"
          />
          <source
            media="(prefers-reduced-motion: reduce) and (max-width: 1199px)"
            srcSet="/images/home-chapters/worlds-atrium-1280.webp"
          />
          <source
            media="(prefers-reduced-motion: reduce)"
            srcSet="/images/home-chapters/worlds-atrium.webp"
          />
          <img
            src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'/%3E"
            width="1672"
            height="941"
            alt=""
            decoding="async"
            loading="lazy"
          />
        </picture>
      </div>
      <section
        className="hc-chapter hc-worlds"
        data-home-chapter="worlds"
        aria-labelledby="home-worlds-title"
        id="home-worlds"
      >
        <div className="hc-atrium-backdrop" aria-hidden="true">
          <ChapterImage
            asset="worlds-atrium"
            sizes="(max-width: 767px) 100vw, (max-aspect-ratio: 1672/941) 178svh, 100vw"
            scenePlate
          />
          <span className="swb-sky-light" />
        </div>
        <div className="hc-atrium-copy">
          <p className="hc-eyebrow" data-chapter-reveal="4">
            3D WORLDS
          </p>
          <h2 id="home-worlds-title">
            <span data-chapter-reveal="5">Enter</span>
            <br />
            <em data-chapter-reveal="6">the worlds.</em>
          </h2>
          <div>
            <p className="hc-body" data-chapter-reveal="7">
              Step inside our interiors and explore them in 3D. Move freely,
              discover details, and experience spaces as if you were really
              there.
            </p>
            <p className="hc-eyebrow hc-signoff" data-chapter-reveal="8">
              <span aria-hidden="true" />
              REAL SPACES. REAL PERSPECTIVE.
            </p>
          </div>
        </div>
        <nav className="hc-atrium-rooms" aria-label="Explore the rooms">
          {worldsChapterOptions.map((room, index) => (
            <div
              className={`hc-atrium-room hc-atrium-${room.id}`}
              key={room.id}
            >
              <Link
                href={room.href}
                prefetch={false}
                className="hc-atrium-room-link"
                data-chapter-reveal={index}
              >
                <small>{String(index + 1).padStart(2, '0')}</small>
                <span>{room.title}</span>
              </Link>
            </div>
          ))}
        </nav>
        <Link
          href="/worlds"
          prefetch={false}
          className="hc-atrium-cta"
          data-chapter-reveal="9"
        >
          <span className="hc-atrium-preview" aria-hidden="true">
            <ChapterImage
              asset="worlds-atrium-preview"
              sizes="(max-width: 1199px) 54px, 96px"
            />
            {worldsChapterOptions.map((room) => (
              <picture
                className={`hc-room-preview hc-room-preview-${room.id}`}
                key={room.id}
              >
                <source
                  media="(min-width: 1200px) and (hover: hover) and (pointer: fine)"
                  srcSet={`/images/home-chapters/room-preview-${room.id}.webp`}
                />
                <img
                  src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'/%3E"
                  width="192"
                  height="192"
                  alt=""
                  loading="lazy"
                  decoding="async"
                  fetchPriority="low"
                />
              </picture>
            ))}
          </span>
          <span className="hc-link">
            EXPLORE 3D WORLDS <span aria-hidden="true">⟶</span>
          </span>
        </Link>
        <div
          className="hc-atrium-baseline"
          aria-hidden="true"
          data-chapter-reveal="9"
        >
          <span>SCROLL TO DISCOVER</span>
          <span>SPACES SHAPED BY A NEW BREEZE</span>
        </div>
      </section>
    </>
  );
}
