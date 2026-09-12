import Link from 'next/link';
import { TextLink } from '@/components/shared/text-link';
import { SectionHeading } from '@/components/shared/section-heading';
import { EditorialImage } from '@/components/shared/editorial-image';
import { SpacePreview } from '@/components/space/space-preview';
import { ProjectPreview } from '@/components/project/project-preview';
import { spaces } from '@/data/spaces';
import { projects } from '@/data/projects';
import { collections } from '@/data/collections';
import { journal } from '@/data/journal';
export function Introduction() {
  return (
    <section id="introduction" className="container section introduction">
      <p className="eyebrow">THE ART OF FEELING AT HOME</p>
      <div className="intro-grid">
        <h2>
          Designed around space,
          <br />
          material and <em>everyday living.</em>
        </h2>
        <div>
          <p>
            A room is more than the objects within it. It is the light across a
            wall, the grain beneath a hand, and the space we leave for life to
            unfold.
          </p>
          <p>
            We bring together interiors and objects that find beauty in these
            quiet details.
          </p>
          <TextLink href="/about">Our perspective</TextLink>
        </div>
      </div>
    </section>
  );
}
export function ExploreSpaces() {
  return (
    <section className="container section spaces-section">
      <SectionHeading
        eyebrow="ROOM TO DISCOVER"
        title={
          <>
            A place for <em>every day.</em>
          </>
        }
        href="/spaces"
        link="Explore all spaces"
      />
      <div className="spaces-editorial">
        {[spaces[0], spaces[3], spaces[2]].map((s, i) => (
          <SpacePreview space={s} index={i} key={s.slug} />
        ))}
      </div>
      <nav className="space-index" aria-label="Explore by room">
        {spaces.map((s) => (
          <Link href={`/spaces/${s.slug}`} key={s.slug}>
            {s.title}
            <span aria-hidden="true">↗</span>
          </Link>
        ))}
      </nav>
    </section>
  );
}
export function FeaturedProjects() {
  return (
    <section className="selected-section">
      <div className="container section">
        <SectionHeading
          eyebrow="SELECTED INTERIORS / 2025—2026"
          title={
            <>
              Spaces with <em>a story.</em>
            </>
          }
          href="/projects"
          link="View all projects"
        />
        <div className="featured-project-list">
          {projects.slice(0, 2).map((p, i) => (
            <ProjectPreview key={p.id} project={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
export function CollectionsPreview() {
  return (
    <section className="container section collections-section">
      <SectionHeading
        eyebrow="THE COLLECTIONS"
        title={
          <>
            Different expressions.
            <br />A shared <em>sensibility.</em>
          </>
        }
        href="/collections"
        link="View all collections"
      />
      <div className="collections-duo">
        {collections.slice(0, 2).map((c, i) => (
          <Link
            href={`/collections/${c.slug}`}
            className="image-link collection-preview"
            key={c.slug}
          >
            <EditorialImage src={c.image.src} alt={c.image.alt} />
            <div className="image-caption">
              <div>
                <p className="eyebrow">COLLECTION 0{i + 1}</p>
                <h3>{c.title}</h3>
              </div>
              <span className="caption-arrow" aria-hidden="true">
                ↗
              </span>
            </div>
          </Link>
        ))}
      </div>
      <div className="collection-index">
        {collections.slice(2).map((c) => (
          <Link href={`/collections/${c.slug}`} key={c.slug}>
            {c.title}
            <span aria-hidden="true">↗</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
export function JournalPreview() {
  return (
    <section className="journal-section">
      <div className="container section">
        <SectionHeading
          eyebrow="THE JOURNAL"
          title={
            <>
              Notes on <em>living well.</em>
            </>
          }
          href="/journal"
          link="Read the journal"
        />
        <div className="journal-grid">
          {journal.slice(0, 3).map((a) => (
            <article key={a.slug}>
              <Link className="image-link" href={`/journal/${a.slug}`}>
                <EditorialImage src={a.image.src} alt={a.image.alt} />
                <p className="eyebrow">
                  {a.category}{' '}
                  <span>
                    {' '}
                    /{' '}
                    {new Date(a.date).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      timeZone: 'UTC',
                    })}
                  </span>
                </p>
                <h3>{a.title}</h3>
                <span className="journal-read">
                  Read story <span aria-hidden="true">↗</span>
                </span>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
