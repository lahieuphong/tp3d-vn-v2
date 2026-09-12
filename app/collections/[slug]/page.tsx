import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { collections } from '@/data/collections';
import { getCollectionContext } from '@/data/relationships';
import { PageIntro } from '@/components/shared/page-intro';
import { EditorialImage } from '@/components/shared/editorial-image';
import { ProjectSelection } from '@/components/project/project-selection';
import { ObjectSelection } from '@/components/sections/object-selection';
import { MaterialSelection } from '@/components/sections/material-selection';
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
  const context = getCollectionContext(c);
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
      <ProjectSelection
        projects={context.projects}
        eyebrow="IN DIALOGUE"
        title="Interiors to explore."
        href="/collections"
        link="All collections"
        editorial
      />
      <ObjectSelection
        ids={context.products.map((product) => product.slug)}
        title="Objects in the conversation."
      />
      <MaterialSelection
        ids={context.materials.map((material) => material.slug)}
      />
    </main>
  );
}
