import type { Project } from '@/data/types';
import Link from 'next/link';
import { EditorialImage } from '@/components/shared/editorial-image';
import { ProjectSelection } from './project-selection';
import { MaterialSelection } from '@/components/sections/material-selection';
import { ObjectSelection } from '@/components/sections/object-selection';
import { ExperienceBanner } from '@/components/sections/experience-banner';
import { getRelatedProjects } from '@/data/relationships';
export function ProjectDetail({ project: p }: { project: Project }) {
  return (
    <main id="main">
      <section className="container detail-title">
        <Link className="back-link" href="/projects">
          ← Selected interiors
        </Link>
        <div className="detail-title-row">
          <div>
            <p className="eyebrow">RESIDENTIAL STUDY / {p.year}</p>
            <h1>{p.title}</h1>
          </div>
          <p className="detail-location">{p.location}, Vietnam</p>
        </div>
      </section>
      <div className="project-hero-image">
        <EditorialImage
          src={p.coverImage.src}
          alt={p.coverImage.alt}
          priority
        />
      </div>
      <div className="container project-facts">
        <dl>
          {[
            ['LOCATION', p.location],
            ['YEAR', p.year],
            ['AREA', p.area],
            ['STYLE', p.style],
          ].map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
        <Link
          prefetch={false}
          className="text-link"
          href={`/experience/${p.slug}`}
        >
          Explore in 3D <span aria-hidden="true">↗</span>
        </Link>
      </div>
      <section className="container section detail-introduction">
        <p className="eyebrow">THE RESIDENCE</p>
        <div>
          <h2>{p.description}</h2>
          <p>{p.introduction}</p>
        </div>
      </section>
      {p.gallery.length > 0 && (
        <section
          className="container project-gallery"
          aria-label={`${p.title} gallery`}
        >
          {p.gallery.map((image, i) => (
            <figure key={image.src}>
              <EditorialImage src={image.src} alt={image.alt} />
              <figcaption>
                <span>
                  0{i + 1} —{' '}
                  {
                    [
                      'A quieter perspective',
                      'Material in conversation',
                      'Room for everyday life',
                    ][i]
                  }
                </span>
                <span>INTERIOR STUDY</span>
              </figcaption>
            </figure>
          ))}
        </section>
      )}
      <section className="container section design-concept">
        <p className="eyebrow">DESIGN CONCEPT</p>
        <h2>
          A dialogue between
          <br />
          <em>material and space.</em>
        </h2>
        <p>{p.concept}</p>
      </section>
      <MaterialSelection ids={p.materials} />
      <ObjectSelection ids={p.products} title="Within this interior." />
      <ExperienceBanner slug={p.slug} image={p.coverImage.src} compact />
      <ProjectSelection
        projects={getRelatedProjects(p)}
        eyebrow="CONTINUE EXPLORING"
        title="Related interiors."
        href="/projects"
        link="All projects"
      >
        <p className="content-note">
          This is a concept study. Project information and object specifications
          are illustrative. Reference photography does not depict a commissioned
          Tân Phong project.
        </p>
      </ProjectSelection>
    </main>
  );
}
