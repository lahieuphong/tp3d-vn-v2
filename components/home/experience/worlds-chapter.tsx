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
        <ChapterImage asset="worlds-atrium" />
      </div>
      <div className="hc-atrium-copy">
        <p className="hc-eyebrow" data-chapter-reveal>
          3D WORLDS
        </p>
        <h2 id="home-worlds-title" data-chapter-reveal>
          Enter
          <br />
          <em>the worlds.</em>
        </h2>
        <div data-chapter-reveal>
          <p className="hc-body">
            Step inside our interiors and explore them in 3D. Move freely,
            discover details, and experience spaces as if you were really there.
          </p>
          <p className="hc-eyebrow hc-signoff">
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
              data-chapter-reveal
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
        data-chapter-reveal
      >
        <span className="hc-atrium-preview" aria-hidden="true">
          <ChapterImage
            asset="worlds-atrium-preview"
            sizes="(max-width: 1199px) 54px, 96px"
          />
        </span>
        <span className="hc-link">
          EXPLORE 3D WORLDS <span aria-hidden="true">⟶</span>
        </span>
      </Link>
      <div className="hc-atrium-baseline" aria-hidden="true">
        <span>SCROLL TO DISCOVER</span>
        <span>SPACES SHAPED BY A NEW BREEZE</span>
      </div>
    </section>
  );
}
