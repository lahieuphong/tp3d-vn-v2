import Link from 'next/link';
import {
  archiveRecords,
  PUBLICATION_BASIS_LABEL,
  type ArchiveRecord,
} from '@/data/world-archive';
import { WORLD_PATH, worldRooms } from '@/data/world-building';
import { EditorialImage } from '@/components/shared/editorial-image';
import { WorldChrome } from './world-chrome';
import '@/components/shared/spatial-type.css';
import './world-archive.css';

const room = worldRooms.find(({ id }) => id === 'archive') ?? worldRooms[2];
const pad = (value: number) => String(value).padStart(2, '0');

/** Where a record sits comes from its place in the curation, never from the
 * data: the first lies open on the reading table, the second faces it, the
 * rest are entered in the register. */
type Placement = 'table' | 'facing' | 'register';
const placementOf = (index: number): Placement =>
  index === 0 ? 'table' : index === 1 ? 'facing' : 'register';

const imageSizes: Record<Placement, string> = {
  table:
    '(max-width: 767px) calc(100vw - 44px), (max-width: 1199px) 50vw, 34vw',
  facing:
    '(max-width: 767px) calc(100vw - 44px), (max-width: 1199px) 40vw, 24vw',
  register: '(max-width: 767px) 34vw, 12vw',
};

/** The record's date exactly as its source keeps it; a material study has
 * none, and none is invented. */
function RecordDate({ record }: { record: ArchiveRecord }) {
  return record.date ? (
    <time dateTime={record.date.iso}>{record.date.label}</time>
  ) : (
    <>Undated study</>
  );
}

/** One record, like a catalogue sheet: its accession line, the source's own
 * photograph on a plain mount, and a label that always says where the
 * record comes from. Every fact is the source's. Opening the source leaves
 * the World for the editorial site, so the link says so. */
function ArchiveRecordSheet({
  record,
  index,
}: {
  record: ArchiveRecord;
  index: number;
}) {
  const placement = placementOf(index);
  const titleId = `${record.key}-title`;
  return (
    <article
      // A stable, collision-safe fragment: /world/archive#<kind>-<slug>.
      id={record.key}
      className="wa-record"
      data-placement={placement}
      data-archive-record={record.key}
      data-record-kind={record.kind}
      data-publication-basis={record.source.basis}
      aria-labelledby={titleId}
    >
      <p className="wa-accession">
        <span className="wa-number">{record.accession}</span>
        <span className="wa-type">{record.recordType}</span>
      </p>
      <div className="wa-plate">
        <EditorialImage
          src={record.image.src}
          alt={record.image.alt}
          priority={index === 0}
          sizes={imageSizes[placement]}
          className="wa-image"
        />
      </div>
      <div className="wa-label">
        <h2 id={titleId} className="wa-title">
          {record.title}
        </h2>
        <p className="wa-category">{record.category}</p>
        <p className="wa-summary">{record.summary}</p>
        {placement === 'table' && (
          <p className="wa-excerpt">{record.excerpt}</p>
        )}
        <dl className="wa-facts">
          <div>
            <dt>Source</dt>
            <dd className="wa-source-collection">{record.source.collection}</dd>
          </div>
          <div>
            <dt>Date</dt>
            <dd>
              <RecordDate record={record} />
            </dd>
          </div>
        </dl>
        {/* A document navigation into the editorial site; Back returns to
            this place in the Archive. */}
        <a className="wa-source" href={record.source.href}>
          <span>
            Open source record
            <span className="wa-hidden">
              : {record.title}, in the {record.source.collection}
            </span>
          </span>
          <span aria-hidden="true">↗</span>
        </a>
      </div>
    </article>
  );
}

/** TP3D PASS 13 — Room 03, Archive: a quiet reading room inside the World.
 * Where the Gallery hangs spaces and Objects sets things on plinths, the
 * Archive keeps records: a reading table, an accession register, an index
 * and a note on what may enter. Server-rendered with no client code of its
 * own (the World map is the shared island); no canvas, viewer or depth.
 * Every record names its source and opens it. */
export function WorldArchive() {
  const total = archiveRecords.length;
  const [first, second, ...rest] = archiveRecords;
  const bases = [...new Set(archiveRecords.map((r) => r.source.basis))];
  return (
    <>
      <WorldChrome currentRoom={room.id} />
      <main id="main" className="world-archive" data-world-archive="">
        <section className="wa-entry" aria-labelledby="world-archive-title">
          <p className="wa-room-number">{`Room ${room.number}`}</p>
          <h1 id="world-archive-title">{room.name}</h1>
          <p className="wa-statement">
            Records of material, light <em>and memory.</em>
          </p>
          <p className="wa-count">{`${pad(total)} records`}</p>
        </section>

        <section className="wa-table" aria-labelledby="wa-table-title">
          <div className="wa-table-edge">
            <p id="wa-table-title" className="wa-section-title">
              Reading table
            </p>
            <p className="wa-collection">
              Studio records · Material, surface, light
            </p>
          </div>
          <p className="wa-wall-text">
            The Archive opens with material and editorial studies already
            published within TP3D.
          </p>
          {first && <ArchiveRecordSheet record={first} index={0} />}
          {second && <ArchiveRecordSheet record={second} index={1} />}
        </section>

        {rest.length > 0 && (
          <section className="wa-register" aria-labelledby="wa-register-title">
            <p id="wa-register-title" className="wa-section-title">
              Accession register
            </p>
            {rest.map((record, i) => (
              <ArchiveRecordSheet
                key={record.key}
                record={record}
                index={i + 2}
              />
            ))}
          </section>
        )}

        <nav className="wa-index" aria-labelledby="wa-index-title">
          <p id="wa-index-title" className="wa-section-title">
            Accession index
          </p>
          <ol>
            {archiveRecords.map((record) => (
              <li key={record.key}>
                <a href={`#${record.key}`}>
                  <span className="wa-index-number">{record.accession}</span>
                  <span className="wa-index-name">{record.title}</span>
                  <span className="wa-index-kind">
                    {record.source.collection} · {record.category}
                  </span>
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <section className="wa-note" aria-labelledby="wa-note-title">
          <p id="wa-note-title" className="wa-section-title">
            Archive note
          </p>
          <p className="wa-note-line">
            Source <em>before interpretation.</em>
          </p>
          <dl className="wa-basis">
            <div>
              <dt>Current accession basis</dt>
              <dd>
                {bases
                  .map((basis) => PUBLICATION_BASIS_LABEL[basis])
                  .join('; ')}
                .
              </dd>
            </div>
            <div>
              <dt>External records</dt>
              <dd>
                Cultural records from outside TP3D require a documented source,
                credit and publication basis before inclusion.
              </dd>
            </div>
          </dl>
          <div className="wa-note-links">
            {/* The sources' own collections, in the editorial site. */}
            {/* oxlint-disable-next-line next/no-html-link-for-pages */}
            <a className="wa-collection-link" href="/materials">
              <span>The material library</span>
              <span aria-hidden="true">↗</span>
            </a>
            {/* oxlint-disable-next-line next/no-html-link-for-pages */}
            <a className="wa-collection-link" href="/journal">
              <span>The journal</span>
              <span aria-hidden="true">↗</span>
            </a>
            <Link className="wa-lobby" href={WORLD_PATH} prefetch={false}>
              <span aria-hidden="true">←</span>
              <span>Back to Lobby</span>
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
