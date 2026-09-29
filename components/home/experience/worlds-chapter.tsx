/* oxlint-disable next/no-img-element -- Tiny local previews, requested only by desktop hover-capable sources. */
import Link from 'next/link';
import { worldsChapterOptions } from '@/data/home-chapters';
import { ChapterImage } from './chapter-image';
import './worlds-chapter.css';

export function WorldsChapter() {
  return (
    <section
      className="hc-chapter hc-worlds"
      data-home-chapter="worlds"
      aria-labelledby="home-worlds-title"
      id="home-worlds"
    >
      <div className="hc-atrium-backdrop" aria-hidden="true">
        <ChapterImage
          asset="worlds-atrium"
          sizes="(max-aspect-ratio: 1672/941) 178svh, 100vw"
        />
        <span className="swb-sky-light" />
      </div>
      <div className="hc-atrium-copy">
        <p className="hc-eyebrow" data-chapter-reveal="1">
          3D WORLDS
        </p>
        <h2 id="home-worlds-title">
          <span data-chapter-reveal="2">Enter</span>
          <br />
          <em data-chapter-reveal="3">the worlds.</em>
        </h2>
        <div>
          <p className="hc-body" data-chapter-reveal="4">
            Step inside our interiors and explore them in 3D. Move freely,
            discover details, and experience spaces as if you were really there.
          </p>
          <p className="hc-eyebrow hc-signoff" data-chapter-reveal="5">
            <span aria-hidden="true" />
            REAL SPACES. REAL PERSPECTIVE.
          </p>
        </div>
      </div>
      <nav className="hc-atrium-rooms" aria-label="Explore the rooms">
        {worldsChapterOptions.map((room, index) => (
          <div className={`hc-atrium-room hc-atrium-${room.id}`} key={room.id}>
            <Link
              href={room.href}
              prefetch={false}
              className="hc-atrium-room-link"
              data-chapter-reveal="0"
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
        data-chapter-reveal="6"
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
        data-chapter-reveal="6"
      >
        <span>SCROLL TO DISCOVER</span>
        <span>SPACES SHAPED BY A NEW BREEZE</span>
      </div>
    </section>
  );
}
