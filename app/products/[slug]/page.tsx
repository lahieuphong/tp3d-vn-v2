import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { products } from '@/data/products';
import { objectStudies } from '@/data/world-objects';
import { worldRooms } from '@/data/world-building';
import { resolveProductDetailContext } from '@/lib/product-detail-context';
import { ProductDetail } from '@/components/product/product-detail';
import { ObjectStudyShell } from '@/components/world/object-study-shell';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export const generateStaticParams = () =>
  products.map((p) => ({ slug: p.slug }));

/** TP3D PASS 11: `?from=objects` is honoured only for a study Room 02
 * hangs. The resolution picks the shell, the way back and the related
 * studies; the product itself never changes. */
const detailContext = async (slug: string, searchParams: SearchParams) =>
  resolveProductDetailContext({
    from: (await searchParams).from,
    slug,
    curatedSlugs: objectStudies.map((study) => study.slug),
    objectsRoom: worldRooms.find((room) => room.id === 'objects'),
  });

// Metadata does not depend on the context. A canonical for the Room 02 URL
// is deferred, as for the Gallery's (TP3D PASS 08): this route's metadata
// streams into <body>, where a canonical is not verifiable as a head one.
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
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const p = products.find((x) => x.slug === slug);
  if (!p) notFound();
  const context = await detailContext(slug, searchParams);
  // The validated context, decided here on the server, picks the shell: a
  // study opened from Room 02 stays inside the World; the collection keeps
  // the editorial site exactly as it was.
  return context.kind === 'objects' ? (
    <ObjectStudyShell>
      <ProductDetail product={p} context={context} />
    </ObjectStudyShell>
  ) : (
    <ProductDetail product={p} />
  );
}
