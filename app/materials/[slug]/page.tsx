import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { materials } from '@/data/materials';
import { projects } from '@/data/projects';
import { EditorialImage } from '@/components/shared/editorial-image';
import { SectionHeading } from '@/components/shared/section-heading';
import { ProjectPreview } from '@/components/project/project-preview';
export const generateStaticParams = () =>
  materials.map((m) => ({ slug: m.slug }));
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const m = materials.find((x) => x.slug === slug);
  return {
    title: m?.title ?? 'Material not found',
    description: m?.description,
  };
}
export default async function MaterialPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const m = materials.find((x) => x.slug === slug);
  if (!m) notFound();
  return (
    <main id="main">
      <section className="container object-detail material-detail">
        <EditorialImage src={m.image.src} alt={m.image.alt} priority />
        <div className="object-detail-copy">
          <Link className="back-link" href="/materials">
            ← Material library
          </Link>
          <p className="eyebrow">{m.family} / MATERIAL STUDY</p>
          <h1>{m.title}</h1>
          <p className="material-standfirst">{m.description}</p>
          <p>{m.detail}</p>
          <dl className="detail-specs">
            <div>
              <dt>FINISH</dt>
              <dd>{m.finish}</dd>
            </div>
            <div>
              <dt>CARE NOTES</dt>
              <dd>{m.care}</dd>
            </div>
          </dl>
          <p className="content-note">
            Photography is an illustrative material reference. Confirm the
            species, sample and finish before specification.
          </p>
        </div>
      </section>
      <section className="container section">
        <SectionHeading
          eyebrow="MATERIAL IN CONTEXT"
          title="A place in the interior."
        />
        <div className="related-projects">
          {projects
            .filter((p) => p.materials.includes(slug))
            .slice(0, 2)
            .map((p) => (
              <ProjectPreview project={p} compact key={p.slug} />
            ))}
        </div>
      </section>
    </main>
  );
}
