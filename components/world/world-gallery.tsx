import Link from 'next/link';
import type { World } from '@/data/types';
import { worldsEdition } from '@/data/worlds';
import { galleryExhibits } from '@/data/world-gallery';
import { WORLD_PATH, worldRooms } from '@/data/world-building';
import { EditorialImage } from '@/components/shared/editorial-image';
import { WorldChrome } from './world-chrome';
import { GalleryDepth } from './gallery-depth';
import { GalleryReveal } from './gallery-reveal';
import '@/components/shared/spatial-type.css';
import './world-gallery.css';

const room = worldRooms.find(({ id }) => id === 'gallery') ?? worldRooms[0];
const pad = (value: number) => String(value).padStart(2, '0');

/** Where an exhibit hangs comes from its place in the curation, never from
 * the data: the first opens the room, the second takes a wall, the rest hang
 * in staggered pairs. */
type Placement = 'field' | 'wall' | 'pair';
const placementOf = (index: number): Placement =>
  index === 0 ? 'field' : index === 1 ? 'wall' : 'pair';

const imageSizes: Record<Placement, string> = {
  field: '(max-width: 767px) 100vw, (max-width: 1199px) 92vw, 64vw',
  wall: '(max-width: 767px) calc(100vw - 44px), (max-width: 1199px) 88vw, 66vw',
  pair: '(max-width: 767px) calc(100vw - 44px), (max-width: 1199px) 78vw, 46vw',
};

/** One exhibit: a mounted image and its label. The label is an exhibition
 * label, not a spec sheet: number, title, room/style/edition, one sentence,
 * the medium, and the way in. Everything comes from `data/worlds.ts`. */
function GalleryExhibit({
  world,
  index,
  total,
}: {
  world: World;
  index: number;
  total: number;
}) {
  const placement = placementOf(index);
  const titleId = `exhibit-${world.slug}`;
  const medium = [
    world.formats?.join(' / '),
    world.textures,
    world.realWorldScale ? 'Real-world scale' : null,
  ].filter(Boolean);
  return (
    <article
      className="wg-exhibit"
      data-placement={placement}
      data-layout={world.layout ?? 'landscape'}
      data-gallery-exhibit={world.slug}
      data-gallery-depth={placement === 'field' ? '' : undefined}
      aria-labelledby={titleId}
    >
      <div className="wg-frame">
        <EditorialImage
          src={world.image.src}
          alt={world.image.alt}
          priority={index === 0}
          sizes={imageSizes[placement]}
          className="wg-image"
        />
      </div>
      <div className="wg-label">
        <div className="wg-label-head">
          <p className="wg-number">{`${pad(index + 1)} / ${pad(total)}`}</p>
          <h2 id={titleId} className="wg-title">
            {world.title}
          </h2>
          <p className="wg-facts">
            {[world.category, world.style, world.year].join(' · ')}
          </p>
        </div>
        <div className="wg-label-body">
          <p className="wg-description">{world.description}</p>
          {medium.length > 0 && (
            <p className="wg-medium">{medium.join(' · ')}</p>
          )}
          {world.available ? (
            // A document navigation, like the catalogue's cards: the 3D world
            // opens at its top, and Back returns to this place in the room.
            <a className="wg-enter" href={`/worlds/${world.slug}`}>
              <span>
                Enter exhibit<span className="wg-hidden">: {world.title}</span>
              </span>
              <span aria-hidden="true">↗</span>
            </a>
          ) : (
            <p className="wg-enter" data-status="planned">
              In preparation
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

/** TP3D PASS 06 — Room 01, Gallery: a curated exhibition inside the World.
 * A 2.5D room shell: the composition, the mounted images and their labels
 * are the room; a future Gallery environment replaces the hanging, not the
 * curation, the labels or the routes. No canvas, no WebGL, no viewer. */
export function WorldGallery() {
  const total = galleryExhibits.length;
  const [first, second, ...rest] = galleryExhibits;
  const pairs = Array.from({ length: Math.ceil(rest.length / 2) }, (_, row) =>
    rest.slice(row * 2, row * 2 + 2),
  );
  return (
    <>
      <WorldChrome currentRoom={room.id} />
      <main id="main" className="world-gallery" data-world-gallery="">
        <section className="wg-entry" aria-labelledby="world-gallery-title">
          <div className="wg-entry-copy">
            <p className="wg-room-number">{`Room ${room.number}`}</p>
            <h1 id="world-gallery-title">{room.name}</h1>
            <p className="wg-statement">
              Digital interiors, <em>in exhibition.</em>
            </p>
            <p className="wg-edition">
              {`Edition ${worldsEdition} · ${pad(total)} interiors`}
            </p>
          </div>
          {first && <GalleryExhibit world={first} index={0} total={total} />}
        </section>
        {second && (
          <section className="wg-sequence" aria-label="Exhibition">
            <p className="wg-wall-text">
              Step inside each interior in three dimensions.
            </p>
            <GalleryExhibit world={second} index={1} total={total} />
            {pairs.map((pair, row) => (
              <div className="wg-pair" key={pair[0].slug}>
                {pair.map((world, column) => (
                  <GalleryExhibit
                    key={world.slug}
                    world={world}
                    index={2 + row * 2 + column}
                    total={total}
                  />
                ))}
              </div>
            ))}
          </section>
        )}
        <nav className="wg-close" aria-label="Leave the Gallery">
          <div className="wg-close-note">
            <p className="wg-close-eyebrow">End of exhibition</p>
            <p className="wg-close-line">
              Every world, <em>by room and style.</em>
            </p>
          </div>
          <div className="wg-close-links">
            {/* The catalogue is a utility: search, categories, sorting. A
                document navigation, so it opens at its top rather than at
                this room's scroll depth (see the PASS 06 record). */}
            {/* oxlint-disable-next-line next/no-html-link-for-pages */}
            <a className="wg-catalogue" href="/worlds">
              <span>View full 3D catalogue</span>
              <span aria-hidden="true">→</span>
            </a>
            <Link className="wg-lobby" href={WORLD_PATH} prefetch={false}>
              <span aria-hidden="true">←</span>
              <span>Back to Lobby</span>
            </Link>
          </div>
        </nav>
        <GalleryReveal />
        <GalleryDepth />
      </main>
    </>
  );
}
