import type { Metadata } from 'next';
import { PageIntro } from '@/components/shared/page-intro';
import { ProjectPreview } from '@/components/project/project-preview';
import { projects } from '@/data/projects';
export const metadata: Metadata = {
  title: 'Selected interiors',
  description:
    'Explore a collection of contemporary residential studies, from warm city interiors to quiet coastal homes.',
};
export default function ProjectsPage() {
  return (
    <main id="main">
      <PageIntro
        eyebrow="SELECTED INTERIORS / 2025—2026"
        title="A sense of place."
        description="A collection of interior studies. Different places, different ways of living — connected by an attention to material, proportion and the everyday."
      />
      <section className="container section listing-content">
        <div className="listing-projects">
          {projects.map((p, i) => (
            <ProjectPreview project={p} index={i} key={p.id} />
          ))}
        </div>
        <p className="content-note">
          Selected concept studies. Project locations and specifications are
          illustrative; photography is used as a visual reference.
        </p>
      </section>
    </main>
  );
}
