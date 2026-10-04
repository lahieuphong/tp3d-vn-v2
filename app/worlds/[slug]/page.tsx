import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { worlds } from '@/data/worlds';
import { galleryExhibits } from '@/data/world-gallery';
import { worldRooms } from '@/data/world-building';
import { resolveWorldDetailContext } from '@/lib/world-detail-context';
import { WorldDetail } from '@/components/worlds/world-detail';
import { WorldDetailShell } from '@/components/world/world-detail-shell';
import '@/components/worlds/worlds.css';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export const generateStaticParams = () =>
  worlds.map((world) => ({ slug: world.slug }));

/** TP3D PASS 07: `?from=gallery` is honoured only for a curated exhibit. The
 * resolution picks the browse set and, since PASS 08, the shell. */
const detailContext = async (slug: string, searchParams: SearchParams) =>
  resolveWorldDetailContext({
    from: (await searchParams).from,
    slug,
    curatedSlugs: galleryExhibits.map((exhibit) => exhibit.slug),
    galleryRoom: worldRooms.find((room) => room.id === 'gallery'),
  });

// TP3D PASS 08: metadata does not depend on the context. A canonical for the
// Gallery URL is deferred: this route's metadata streams into <body>, where a
// canonical link is not verifiable as a head canonical (see the PASS 08 doc).
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
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const world = worlds.find((item) => item.slug === slug);
  if (!world) notFound();
  const context = await detailContext(slug, searchParams);
  const detail = (
    <WorldDetail
      initialWorld={world}
      worlds={context.kind === 'gallery' ? galleryExhibits : worlds}
      context={context}
    />
  );
  // TP3D PASS 08: the validated context, decided here on the server, picks
  // the shell. The Gallery's exhibits stay inside the World; the catalogue
  // keeps the editorial site exactly as it was.
  return context.kind === 'gallery' ? (
    <WorldDetailShell>{detail}</WorldDetailShell>
  ) : (
    detail
  );
}
