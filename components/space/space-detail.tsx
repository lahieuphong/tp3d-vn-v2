import type { Space } from '@/data/types';
import Link from 'next/link';
import { EditorialImage } from '@/components/shared/editorial-image';
import { SectionHeading } from '@/components/shared/section-heading';
import { ObjectSelection } from '@/components/sections/object-selection';
import { MaterialSelection } from '@/components/sections/material-selection';
import { ExperienceBanner } from '@/components/sections/experience-banner';
import { ProjectPreview } from '@/components/project/project-preview';
import { projects } from '@/data/projects';
import { spaces } from '@/data/spaces';
export function SpaceDetail({ space: s }: { space: Space }) {
  const selected = projects.filter((p) => s.projects.includes(p.slug));
  return (
    <main id="main">
      <section className="space-detail-hero">
        <EditorialImage src={s.image.src} alt={s.image.alt} priority />
        <div className="space-detail-title">
          <Link href="/spaces" className="back-link">
            ← All spaces
          </Link>
          <p className="eyebrow">THE SPACES</p>
          <h1>{s.title}</h1>
        </div>
      </section>
      <section className="container section space-introduction">
        <p className="eyebrow">ROOM FOR {s.title.toUpperCase()}</p>
        <div>
          <h2>{s.subtitle}</h2>
          <p>{s.description}</p>
        </div>
      </section>
      <section className="container section space-selected">
        <SectionHeading
          eyebrow="SELECTED INTERIORS"
          title={`A considered approach to ${s.title.toLowerCase()}.`}
        />
        <div className="related-projects">
          {selected.map((p) => (
            <ProjectPreview project={p} key={p.slug} compact />
          ))}
        </div>
      </section>
      <ObjectSelection ids={s.products} title="Objects for the room." />
      <MaterialSelection ids={s.materials} />
      {selected[0] && (
        <ExperienceBanner slug={selected[0].slug} image={s.image.src} compact />
      )}
      <section className="container section">
        <SectionHeading
          eyebrow="BEYOND THIS ROOM"
          title="Continue exploring."
          href="/spaces"
          link="All spaces"
        />
        <nav className="related-spaces" aria-label="Related spaces">
          {spaces
            .filter((x) => x.slug !== s.slug)
            .map((x) => (
              <Link href={`/spaces/${x.slug}`} key={x.slug}>
                {x.title}
                <span aria-hidden="true">↗</span>
              </Link>
            ))}
        </nav>
      </section>
    </main>
  );
}
