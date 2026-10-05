import Link from 'next/link';
import { WORLD_PATH, worldRooms } from '@/data/world-building';
import {
  PROJECT_ENQUIRY_STATUS,
  PROJECT_ENQUIRY_STATUS_LABEL,
  studioAreas,
  studioBeginning,
  studioBriefPrompts,
  studioStudies,
} from '@/data/world-studio';
import { WorldChrome } from './world-chrome';
import '@/components/shared/spatial-type.css';
import './world-studio.css';

const room = worldRooms.find(({ id }) => id === 'studio') ?? worldRooms[4];
const pad = (value: number) => String(value + 1).padStart(2, '0');

/** The Studio's own sections, in reading order. Each id is a stable fragment:
 * /world/studio#<id>. */
const SECTIONS = [
  {
    id: 'conversation',
    title: 'The project table',
    label: 'Areas of conversation',
  },
  {
    id: 'begin',
    title: 'How a project can begin',
    label: 'How a project can begin',
  },
  { id: 'studies', title: 'Concept studies', label: 'Concept studies' },
  { id: 'brief', title: 'A useful starting brief', label: 'Starting brief' },
  {
    id: 'contact',
    title: 'Project conversation',
    label: 'Project conversation',
  },
] as const;
const section = (id: (typeof SECTIONS)[number]['id']) =>
  SECTIONS.find((s) => s.id === id)!;

/** TP3D PASS 15 — Room 05, Studio: the project table, a conversation before
 * a project exists. Areas of conversation, how a project can begin, three
 * concept studies (labelled as such, every fact from `data/projects.ts`), a
 * starting brief to read and the honest state of project enquiries, with a
 * way to the Contact page. Server-rendered with no client code of its own
 * (the World map is the shared island); no image, canvas, form or contact
 * channel. Leaving for a project or Contact is a document navigation. */
export function WorldStudio() {
  const status = PROJECT_ENQUIRY_STATUS_LABEL[PROJECT_ENQUIRY_STATUS];
  return (
    <>
      <WorldChrome currentRoom={room.id} />
      <main id="main" className="world-studio" data-world-studio="">
        <section className="wst-entry" aria-labelledby="world-studio-title">
          <p className="wst-room-number">{`Room ${room.number}`}</p>
          <h1 id="world-studio-title">{room.name}</h1>
          <p className="wst-statement">
            From a question <em>to a direction.</em>
          </p>
          <p className="wst-summary">{room.summary}</p>
        </section>

        <div className="wst-lead">
          <p className="wst-wall-text">
            A place to begin with space: how a project might take shape, and
            what is worth bringing to a first conversation.
          </p>
          {/* Fast navigation: every part of the table, one step away. */}
          <nav className="wst-directory" aria-labelledby="wst-directory-title">
            <p id="wst-directory-title" className="wst-section-title">
              Studio directory
            </p>
            <ol>
              {SECTIONS.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`}>
                    <span className="wst-directory-number">{pad(i)}</span>
                    <span>{s.label}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </div>

        <section
          id="conversation"
          className="wst-section wst-table"
          aria-labelledby="conversation-title"
        >
          <div className="wst-section-head">
            <h2 id="conversation-title" className="wst-title">
              {section('conversation').title}
            </h2>
            <p className="wst-section-note">
              Areas of conversation, not packages: the questions a project table
              returns to.
            </p>
          </div>
          {/* One long table: three areas laid side by side, unequal. */}
          <ol className="wst-areas">
            {studioAreas.map((area, i) => (
              <li key={area.title} className="wst-area">
                <p className="wst-number">{pad(i)}</p>
                <h3 className="wst-area-title">{area.title}</h3>
                <p className="wst-question">{area.question}</p>
                <ul className="wst-terms">
                  {area.terms.map((term) => (
                    <li key={term}>{term}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </section>

        <section
          id="begin"
          className="wst-section wst-begin"
          aria-labelledby="begin-title"
        >
          <div className="wst-section-head">
            <h2 id="begin-title" className="wst-title">
              {section('begin').title}
            </h2>
            <p className="wst-section-note">
              One possible beginning, step by step. Every project finds its own
              order.
            </p>
          </div>
          <ol className="wst-steps">
            {studioBeginning.map((step, i) => (
              <li key={step.title} className="wst-step">
                <p className="wst-number">{pad(i)}</p>
                <h3 className="wst-step-title">{step.title}</h3>
                <ul className="wst-prompts">
                  {step.prompts.map((prompt) => (
                    <li key={prompt}>{prompt}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </section>

        <section
          id="studies"
          className="wst-section wst-studies"
          aria-labelledby="studies-title"
        >
          <div className="wst-section-head">
            <h2 id="studies-title" className="wst-title">
              {section('studies').title}
            </h2>
            <p className="wst-disclosure">
              These are concept studies, shown for their design language.
              Locations and specifications are illustrative; reference
              photography does not depict commissioned Tân Phong work.
            </p>
          </div>
          <ol className="wst-ledger">
            {studioStudies.map((project, i) => (
              <li key={project.slug} className="wst-study">
                <p className="wst-number">{pad(i)}</p>
                <div className="wst-study-name">
                  <p className="wst-study-label">Concept study</p>
                  <h3 className="wst-study-title">{project.title}</h3>
                </div>
                <p className="wst-study-facts">
                  {project.location} · {project.style} · {project.year}
                </p>
                <p className="wst-study-description">{project.description}</p>
                {/* Leaves the World for the editorial project page; Back
                    returns to this place at the table. */}
                <a
                  className="wst-study-link"
                  href={`/projects/${project.slug}`}
                >
                  <span>
                    Open concept study
                    <span className="wst-hidden">: {project.title}</span>
                  </span>
                  <span aria-hidden="true">↗</span>
                </a>
              </li>
            ))}
          </ol>
        </section>

        <section
          id="brief"
          className="wst-section wst-brief"
          aria-labelledby="brief-title"
        >
          <div className="wst-section-head">
            <h2 id="brief-title" className="wst-title">
              {section('brief').title}
            </h2>
            <p className="wst-section-note">
              Before the conversation: what helps to know. Notes to keep, not a
              form to fill in.
            </p>
          </div>
          <dl className="wst-prompts-list">
            {studioBriefPrompts.map((item) => (
              <div key={item.label}>
                <dt>{item.label}</dt>
                <dd>{item.prompt}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section
          id="contact"
          className="wst-section wst-conversation"
          aria-labelledby="contact-title"
        >
          <div className="wst-section-head">
            <h2 id="contact-title" className="wst-title">
              {section('contact').title}
            </h2>
            <p
              className="wst-status"
              data-enquiry-status={PROJECT_ENQUIRY_STATUS}
            >
              {status}
            </p>
          </div>
          <div className="wst-conversation-body">
            <p className="wst-conversation-line">
              The Studio is open as a place to understand the work.{' '}
              <em>
                Project enquiries and direct conversations are not yet live on
                the site.
              </em>
            </p>
            <div className="wst-conversation-links">
              {/* The Contact page states the current position; leaving the
                  World for it is a document navigation. */}
              {/* oxlint-disable-next-line next/no-html-link-for-pages */}
              <a className="wst-contact-link" href="/contact">
                <span>Open contact page</span>
                <span aria-hidden="true">↗</span>
              </a>
              <Link className="wst-lobby" href={WORLD_PATH} prefetch={false}>
                <span aria-hidden="true">←</span>
                <span>Back to Lobby</span>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
