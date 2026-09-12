import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { products } from '@/data/products';
import { getProductProjects } from '@/data/relationships';
import { EditorialImage } from '@/components/shared/editorial-image';
import { ProjectSelection } from '@/components/project/project-selection';
export const generateStaticParams = () =>
  products.map((p) => ({ slug: p.slug }));
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = products.find((x) => x.slug === slug);
  return { title: p?.title ?? 'Object not found', description: p?.description };
}
export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = products.find((x) => x.slug === slug);
  if (!p) notFound();
  return (
    <main id="main">
      <section className="container object-detail">
        <EditorialImage src={p.image.src} alt={p.image.alt} priority />
        <div className="object-detail-copy">
          <Link className="back-link" href="/products">
            ← All objects
          </Link>
          <p className="eyebrow">{p.category} / OBJECT STUDY</p>
          <h1>{p.title}</h1>
          <p className="object-collection">{p.collection}</p>
          <p>{p.description}</p>
          <dl className="detail-specs">
            <div>
              <dt>DIMENSIONS</dt>
              <dd>{p.dimensions}</dd>
            </div>
            <div>
              <dt>MATERIAL</dt>
              <dd>{p.material}</dd>
            </div>
          </dl>
          <p className="content-note">
            A concept object with reference photography. Specifications are
            illustrative and are not a manufacturer’s product listing.
          </p>
        </div>
      </section>
      <ProjectSelection
        projects={getProductProjects(slug)}
        eyebrow="IN CONTEXT"
        title="At home in these interiors."
      />
    </main>
  );
}
