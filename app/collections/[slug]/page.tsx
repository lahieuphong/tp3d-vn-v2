import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { collections } from '@/data/collections';
import { projects } from '@/data/projects';
import { PageIntro } from '@/components/shared/page-intro';
import { EditorialImage } from '@/components/shared/editorial-image';
import { ProjectPreview } from '@/components/project/project-preview';
import { SectionHeading } from '@/components/shared/section-heading';
export const generateStaticParams = () =>
  collections.map((c) => ({ slug: c.slug }));
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const c = collections.find((x) => x.slug === slug);
  return {
    title: c?.title ?? 'Collection not found',
    description: c?.description,
  };
}
export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const c = collections.find((x) => x.slug === slug);
  if (!c) notFound();
  return (
    <main id="main">
      <PageIntro
        eyebrow="THE COLLECTION"
        title={c.title}
        description={c.description}
      />
      <div className="container collection-hero">
        <EditorialImage src={c.image.src} alt={c.image.alt} priority />
      </div>
      <section className="container section">
        <SectionHeading
          eyebrow="IN DIALOGUE"
          title="Interiors to explore."
          href="/collections"
          link="All collections"
        />
        <div className="related-projects">
          {projects
            .filter((p) => c.projects.includes(p.slug))
            .map((p) => (
              <ProjectPreview project={p} compact key={p.slug} />
            ))}
        </div>
      </section>
    </main>
  );
}
