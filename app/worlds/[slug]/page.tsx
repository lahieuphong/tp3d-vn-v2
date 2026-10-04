import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { worlds } from '@/data/worlds';
import { galleryExhibits } from '@/data/world-gallery';
import { worldRooms } from '@/data/world-building';
import { resolveWorldDetailContext } from '@/lib/world-detail-context';
import { WorldDetail } from '@/components/worlds/world-detail';
import '@/components/worlds/worlds.css';

export const generateStaticParams = () =>
  worlds.map((world) => ({ slug: world.slug }));

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const world = worlds.find((item) => item.slug === slug);
  return {
    title: world?.title ?? 'World not found',
    description: world?.description,
  };
}

export default async function WorldDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const world = worlds.find((item) => item.slug === slug);
  if (!world) notFound();
  // TP3D PASS 07: `?from=gallery` is honoured only for a curated exhibit;
  // the Gallery context browses the curation, the catalogue browses all.
  const context = resolveWorldDetailContext({
    from: (await searchParams).from,
    slug,
    curatedSlugs: galleryExhibits.map((exhibit) => exhibit.slug),
    galleryRoom: worldRooms.find((room) => room.id === 'gallery'),
  });
  return (
    <WorldDetail
      initialWorld={world}
      worlds={context.kind === 'gallery' ? galleryExhibits : worlds}
      context={context}
    />
  );
}
