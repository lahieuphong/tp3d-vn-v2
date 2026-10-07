/* oxlint-disable next/no-img-element -- Optimized local previews are decoded on intent by room-discovery. */
import Link from 'next/link';
import { worldsChapterOptions } from '@/data/home-chapters';
import { ChapterImage } from './chapter-image';
import { WorldGatewayLink } from '@/components/world/world-gateway-link';
import './worlds-chapter.css';

export function WorldsChapter() {
  return (
    <section
      className="hc-chapter hc-worlds"
      data-home-chapter="worlds"
      aria-labelledby="home-worlds-title"
      id="home-worlds"
      aria-hidden="true"
      inert
    >
      <div className="hc-atrium-camera" data-scene3-camera>
        <div className="hc-atrium-backdrop" aria-hidden="true">
          <ChapterImage
            asset="worlds-atrium"
            sizes="(max-width: 767px) 100vw, (max-aspect-ratio: 1672/941) 178svh, 100vw"
            scenePlate
            deferred
          />
        </div>
        {/* TP3D PASS — Atrium room orbit: a soft exposure field on the
            focused doorway. It moves with the plate; opacity only. */}
        <span className="hc-room-focus" aria-hidden="true" />
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
            discover details, and experience spaces as if you were really there.
          </p>
          <p className="hc-eyebrow hc-signoff" data-chapter-reveal="8">
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
              data-chapter-reveal={index}
              data-room={room.id}
            >
              {/* The room's own aperture, shown only while the rooms orbit.
                  Decorative (alt=""): the link's name stays "01 Living". */}
              <picture className="hc-room-portal">
                <img
                  data-room-portal={room.id}
                  data-src={`/images/home-chapters/room-preview-${room.id}.webp`}
                  width="192"
                  height="192"
                  alt=""
                  loading="lazy"
                  decoding="async"
                  fetchPriority="low"
                />
              </picture>
              <small>{String(index + 1).padStart(2, '0')}</small>
              <span>{room.title}</span>
            </Link>
          </div>
        ))}
      </nav>
      {/* TP3D PASS 05: the primary gateway crosses into the Lobby (/world).
          The four room links above stay shortcuts into current content. */}
      <WorldGatewayLink className="hc-atrium-cta" data-chapter-reveal="9">
        <span
          className="hc-atrium-preview"
          aria-hidden="true"
          data-world-origin=""
        >
          <ChapterImage
            asset="worlds-atrium-preview"
            sizes="(max-width: 1199px) 54px, 96px"
            deferred
          />
          {worldsChapterOptions.map((room) => (
            <img
              className={`hc-room-preview hc-room-preview-${room.id}`}
              key={room.id}
              data-room-preview={room.id}
              data-src={`/images/home-chapters/room-preview-${room.id}.webp`}
              width="192"
              height="192"
              alt=""
              loading="lazy"
              decoding="async"
              fetchPriority="low"
            />
          ))}
        </span>
        <span className="hc-link">
          ENTER THE WORLD <span aria-hidden="true">⟶</span>
        </span>
      </WorldGatewayLink>
      <div
        className="hc-atrium-baseline"
        aria-hidden="true"
        data-chapter-reveal="9"
      >
        <span>SCROLL TO DISCOVER</span>
        <span>REAL SPACES, REAL PERSPECTIVE.</span>
      </div>
    </section>
  );
}
