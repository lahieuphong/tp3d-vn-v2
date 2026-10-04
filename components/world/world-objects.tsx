import Link from 'next/link';
import type { Product } from '@/data/types';
import { objectStudies } from '@/data/world-objects';
import { WORLD_PATH, worldRooms } from '@/data/world-building';
import { EditorialImage } from '@/components/shared/editorial-image';
import { WorldChrome } from './world-chrome';
import { GalleryDepth } from './gallery-depth';
import { GalleryReveal } from './gallery-reveal';
import '@/components/shared/spatial-type.css';
import './world-objects.css';

const room = worldRooms.find(({ id }) => id === 'objects') ?? worldRooms[1];
const pad = (value: number) => String(value).padStart(2, '0');

/** Where a study rests comes from its place in the curation, never from the
 * data: the first stands alone on the plinth, the second lies along a long
 * table, the rest are set out in staggered pairs. */
type Setting = 'plinth' | 'table' | 'pair';
const settingOf = (index: number): Setting =>
  index === 0 ? 'plinth' : index === 1 ? 'table' : 'pair';

const imageSizes: Record<Setting, string> = {
  plinth:
    '(max-width: 767px) calc(100vw - 44px), (max-width: 1199px) 60vw, 40vw',
  table:
    '(max-width: 767px) calc(100vw - 44px), (max-width: 1199px) 84vw, 58vw',
  pair: '(max-width: 767px) calc(100vw - 44px), (max-width: 1199px) 44vw, 30vw',
};

/** What the photograph is, from the data: reference photography stays
 * named as such until a model render is supplied. */
const plateNote = (product: Product) =>
  product.imageRole === 'model-render' ? 'Model render' : 'Reference study';

/** The digital asset's state, from the data alone. Plain text either way:
 * there is nothing to activate in the room. */
const assetStatus = (product: Product) =>
  product.asset.available
    ? '3D asset · available'
    : 'Digital model · in preparation';

/** One object study, like a drawer of the cabinet: a ruled edge carrying its
 * number and what the photograph is, the plate, and a documentation label.
 * Everything comes from `data/products.ts`. The plate is an image, not a
 * second link: the label holds the one way in, and the alt text is read. */
function ObjectSpecimen({
  product,
  index,
  total,
}: {
  product: Product;
  index: number;
  total: number;
}) {
  const setting = settingOf(index);
  const titleId = `object-${product.slug}`;
  return (
    <article
      // A stable fragment: /world/objects#<slug>.
      id={product.slug}
      className="wo-specimen"
      data-setting={setting}
      data-object-specimen={product.slug}
      data-object-depth={setting === 'plinth' ? '' : undefined}
      aria-labelledby={titleId}
    >
      <p className="wo-drawer">
        <span className="wo-number">{`${pad(index + 1)} / ${pad(total)}`}</span>
        <span className="wo-plate-note">{plateNote(product)}</span>
      </p>
      <div className="wo-plate">
        <EditorialImage
          src={product.image.src}
          alt={product.image.alt}
          priority={index === 0}
          sizes={imageSizes[setting]}
          className="wo-image"
        />
      </div>
      <div className="wo-label">
        <h2 id={titleId} className="wo-title">
          {product.title}
        </h2>
        <p className="wo-kind">
          <span className="wo-category">{product.category}</span>
          <span className="wo-collection">{product.collection}</span>
        </p>
        {setting === 'plinth' && (
          <p className="wo-description">{product.description}</p>
        )}
        <dl className="wo-specs">
          <div>
            <dt>Dimensions</dt>
            <dd>{product.dimensions}</dd>
          </div>
          <div>
            <dt>Material</dt>
            <dd>{product.material}</dd>
          </div>
        </dl>
        <p
          className="wo-asset"
          data-asset-status={
            product.asset.available ? 'available' : 'in-preparation'
          }
        >
          {assetStatus(product)}
        </p>
        {/* A document navigation: the object study opens at its top, and
            Back returns to this place in the room. */}
        <a className="wo-study" href={`/products/${product.slug}`}>
          <span>
            View object study
            <span className="wo-hidden">: {product.title}</span>
          </span>
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </article>
  );
}

/** TP3D PASS 10 — Room 02, Objects: a cabinet of object studies inside the
 * World. Where the Gallery hangs spaces on walls, this room sets things on
 * plinths and tables, with documentation labels for form, material and
 * size. Server-rendered; the only client code is the shared reveal, one
 * specimen's pointer depth and the World map. No canvas, no viewer, no
 * marketplace: digital models are named by their real status. */
export function WorldObjects() {
  const total = objectStudies.length;
  const [first, second, ...rest] = objectStudies;
  const pairs = Array.from({ length: Math.ceil(rest.length / 2) }, (_, row) =>
    rest.slice(row * 2, row * 2 + 2),
  );
  return (
    <>
      <WorldChrome currentRoom={room.id} />
      <main id="main" className="world-objects" data-world-objects="">
        <section className="wo-entry" aria-labelledby="world-objects-title">
          <div className="wo-heading">
            <p className="wo-room-number">{`Room ${room.number}`}</p>
            <h1 id="world-objects-title">{room.name}</h1>
            <p className="wo-statement">
              Form, material <em>and digital potential.</em>
            </p>
            <p className="wo-count">{`${pad(total)} object studies`}</p>
          </div>
          {first && <ObjectSpecimen product={first} index={0} total={total} />}
        </section>
        {second && (
          <section className="wo-sequence" aria-label="Object studies">
            <p className="wo-wall-text">
              Each study is documented by form, material and size. Digital
              models open as they are prepared.
            </p>
            <ObjectSpecimen product={second} index={1} total={total} />
            {pairs.map((pair, row) => (
              <div className="wo-pair" key={pair[0].slug}>
                {pair.map((product, column) => (
                  <ObjectSpecimen
                    key={product.slug}
                    product={product}
                    index={2 + row * 2 + column}
                    total={total}
                  />
                ))}
              </div>
            ))}
          </section>
        )}
        <nav className="wo-index" aria-labelledby="world-objects-index">
          <p id="world-objects-index" className="wo-index-title">
            Object index
          </p>
          <ol>
            {objectStudies.map((product, index) => (
              <li key={product.slug}>
                <a href={`#${product.slug}`}>
                  <span className="wo-index-number">{pad(index + 1)}</span>
                  <span className="wo-index-name">{product.title}</span>
                  <span className="wo-index-category">{product.category}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <nav className="wo-close" aria-label="Leave Objects">
          <div className="wo-close-note">
            <p className="wo-close-eyebrow">End of the room</p>
            <p className="wo-close-line">
              Every object, <em>in the editorial collection.</em>
            </p>
          </div>
          <div className="wo-close-links">
            {/* The collection is editorial content in the site's own shell. A
                document navigation, so it opens at its top. */}
            {/* oxlint-disable-next-line next/no-html-link-for-pages */}
            <a className="wo-collection-link" href="/products">
              <span>View the full object collection</span>
              <span aria-hidden="true">→</span>
            </a>
            <Link className="wo-lobby" href={WORLD_PATH} prefetch={false}>
              <span aria-hidden="true">←</span>
              <span>Back to Lobby</span>
            </Link>
          </div>
        </nav>
        <GalleryReveal
          root="main[data-world-objects]"
          item="[data-object-specimen]"
        />
        <GalleryDepth target="[data-object-depth]" property="--wo-depth" />
      </main>
    </>
  );
}
