import Link from 'next/link';
import {
  LAB_MODE_LABEL,
  labExperiments,
  type LabExperiment,
  type LabExperimentId,
} from '@/data/world-lab';
import { WORLD_PATH, worldRooms } from '@/data/world-building';
import { storyBreezeGeometry } from '@/components/home/experience/breeze-geometry';
import { PORTAL } from './world-portal';
import { GalleryDepth } from './gallery-depth';
import { LabAtmosphereStudy } from './lab-atmosphere-study';
import { WorldChrome } from './world-chrome';
import '@/components/shared/spatial-type.css';
import './world-lab.css';

const room = worldRooms.find(({ id }) => id === 'lab') ?? worldRooms[3];
const pad = (value: number) => String(value).padStart(2, '0');
const experiment = (id: LabExperimentId) =>
  labExperiments.find((e) => e.id === id)!;

/** The Breeze still: the production cloth at rest, as its own geometry draws
 * it for a 1440 × 900 view (server-side; no motion, no client code). The
 * outline and the heavier threads, the ones production draws at 1.1. */
const cloth = storyBreezeGeometry(1440, 900);
const clothThreads = cloth.threads.filter((_, i) => i % 4 === 0);

/** A study's label: its number and mode, then title, question and facts.
 * Every word comes from the curation; source files are never shown. */
function ExperimentLabel({ experiment: e }: { experiment: LabExperiment }) {
  return (
    <div className="wlab-label">
      <p className="wlab-edge">
        <span className="wlab-number">{e.number}</span>
        <span>{LAB_MODE_LABEL[e.mode]}</span>
      </p>
      <h2 id={`${e.id}-title`} className="wlab-title">
        {e.title}
      </h2>
      <p className="wlab-question">{e.question}</p>
      <dl className="wlab-facts">
        <div>
          <dt>Medium</dt>
          <dd>{e.medium}</dd>
        </div>
        <div>
          <dt>In production</dt>
          <dd>{e.productionContext}</dd>
        </div>
      </dl>
    </div>
  );
}

/** TP3D PASS 14 — Room 04, Lab: a spatial workbench inside the World. Four
 * studies of systems TP3D already runs in production — the Atmosphere bench
 * first and largest, then Breeze, Depth and Threshold — an index and a note.
 * Server-rendered; the only islands are the Atmosphere study (explicit,
 * opt-in WebGL through the production renderer), the shared pointer depth
 * and the World map. Nothing heavy loads until a visitor asks for it. */
export function WorldLab() {
  const atmosphere = experiment('atmosphere');
  const breeze = experiment('breeze');
  const depth = experiment('depth');
  const threshold = experiment('threshold');
  return (
    <>
      <WorldChrome currentRoom={room.id} />
      <main id="main" className="world-lab" data-world-lab="">
        <section className="wlab-entry" aria-labelledby="world-lab-title">
          <p className="wlab-room-number">{`Room ${room.number}`}</p>
          <h1 id="world-lab-title">{room.name}</h1>
          <p className="wlab-statement">
            Experiments in light, <em>movement and spatial response.</em>
          </p>
          <p className="wlab-count">{`${pad(labExperiments.length)} experiments`}</p>
        </section>
        <p className="wlab-wall-text">
          Each study is a system already at work in the TP3D site. Live studies
          start only when you ask.
        </p>

        {/* EX–01: the dominant bench. The island renders the field and its
            controls into this grid (display: contents). */}
        <article
          id={atmosphere.id}
          className="wlab-experiment"
          data-experiment={atmosphere.id}
          data-mode={atmosphere.mode}
          aria-labelledby={`${atmosphere.id}-title`}
        >
          <ExperimentLabel experiment={atmosphere} />
          <LabAtmosphereStudy />
        </article>

        {/* EX–02: a wide reference field. */}
        <article
          id={breeze.id}
          className="wlab-experiment"
          data-experiment={breeze.id}
          data-mode={breeze.mode}
          aria-labelledby={`${breeze.id}-title`}
        >
          <ExperimentLabel experiment={breeze} />
          <figure className="wlab-cloth">
            {/* The whole 1440 × 900 view, framed, centred in the field. */}
            <svg
              className="wlab-cloth-still"
              viewBox="0 0 1440 900"
              preserveAspectRatio="xMidYMid meet"
              aria-hidden="true"
              focusable="false"
            >
              <defs>
                <clipPath id="wlab-cloth-view">
                  <rect width="1440" height="900" />
                </clipPath>
              </defs>
              <rect className="wlab-cloth-view" width="1440" height="900" />
              <g clipPath="url(#wlab-cloth-view)">
                <path className="wlab-cloth-outline" d={cloth.outline} />
                {clothThreads.map((d, i) => (
                  <path key={i} className="wlab-cloth-thread" d={d} />
                ))}
              </g>
            </svg>
            <figcaption>
              The production cloth at rest in a 1440 × 900 view: its outline and
              heavier threads, drawn by its own geometry.
            </figcaption>
          </figure>
          <ol className="wlab-stations">
            <li>
              <span className="wlab-station-name">Surface</span>
              <span>
                One cloth, defined once as geometry: an outline, folds and a
                woven grain.
              </span>
            </li>
            <li>
              <span className="wlab-station-name">Depth</span>
              <span>
                Two projections of the same cloth, masked front and back, give
                it a side toward you and a side turned away.
              </span>
            </li>
            <li>
              <span className="wlab-station-name">Crossing</span>
              <span>
                Story progress alone carries it toward the lens until it fills
                the view and clears into sky. With reduced motion it is left
                out.
              </span>
            </li>
          </ol>
        </article>

        {/* EX–03: a calibration field. The shared pointer follower writes
            the offsets; CSS moves two planes on the desktop tier only. */}
        <article
          id={depth.id}
          className="wlab-experiment"
          data-experiment={depth.id}
          data-mode={depth.mode}
          aria-labelledby={`${depth.id}-title`}
        >
          <ExperimentLabel experiment={depth} />
          <div className="wlab-depth" data-lab-depth="" aria-hidden="true">
            <div className="wlab-plane" data-plane="far">
              <span>Far</span>
            </div>
            <div className="wlab-plane" data-plane="mid">
              <span>Mid</span>
            </div>
            <div className="wlab-plane" data-plane="near">
              <span>Near</span>
            </div>
          </div>
          <p className="wlab-depth-status">
            <span data-capability="pointer">
              Live: move a mouse across the field. The planes ease back and rest
              when it leaves.
            </span>
            <span data-capability="static">
              Static here. Depth answers a fine pointer on a wide screen, never
              touch or reduced motion.
            </span>
          </p>
          <GalleryDepth target="[data-lab-depth]" property="--lab-depth" />
        </article>

        {/* EX–04: the protocol of a real transition, not a replay. */}
        <article
          id={threshold.id}
          className="wlab-experiment"
          data-experiment={threshold.id}
          data-mode={threshold.mode}
          aria-labelledby={`${threshold.id}-title`}
        >
          <ExperimentLabel experiment={threshold} />
          <ol className="wlab-protocol">
            <li>
              <span className="wlab-step">Real link</span>
              <span>
                The gateway is an ordinary link to the Lobby. Modifier and
                middle clicks stay native.
              </span>
            </li>
            <li>
              <span className="wlab-step">Intent</span>
              <span>
                The Lobby is prefetched only after a pointer, focus or touch.
              </span>
            </li>
            <li>
              <span className="wlab-step">Cover</span>
              <span>
                {`One circle in the World's ground colour grows from the gateway over ${PORTAL.coverMs} ms; with reduced motion, a ${PORTAL.reducedMs} ms flat fade.`}
              </span>
            </li>
            <li>
              <span className="wlab-step">Route</span>
              <span>
                The router opens the Lobby beneath the cover. If it never
                arrives, the link opens as a document.
              </span>
            </li>
            <li>
              <span className="wlab-step">Release</span>
              <span>
                {`The Lobby lifts the cover in ${PORTAL.releaseMs} ms, at its top.`}
              </span>
            </li>
          </ol>
          <p className="wlab-aside">
            Not replayed here: the threshold belongs to the way in from the
            homepage.
          </p>
        </article>

        <nav className="wlab-index" aria-labelledby="wlab-index-title">
          <p id="wlab-index-title" className="wlab-section-title">
            Experiment index
          </p>
          <ol>
            {labExperiments.map((e) => (
              <li key={e.id}>
                <a href={`#${e.id}`}>
                  <span className="wlab-index-number">{e.number}</span>
                  <span className="wlab-index-name">{e.title}</span>
                  <span className="wlab-index-mode">
                    {LAB_MODE_LABEL[e.mode]}
                  </span>
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <section className="wlab-note" aria-labelledby="wlab-note-title">
          <p id="wlab-note-title" className="wlab-section-title">
            Lab note
          </p>
          <p className="wlab-note-line">
            Built <em>in production.</em>
          </p>
          <p className="wlab-note-text">
            These studies are not isolated demos. Each began as part of a real
            spatial journey.
          </p>
          <Link className="wlab-lobby" href={WORLD_PATH} prefetch={false}>
            <span aria-hidden="true">←</span>
            <span>Back to Lobby</span>
          </Link>
        </section>
      </main>
    </>
  );
}
