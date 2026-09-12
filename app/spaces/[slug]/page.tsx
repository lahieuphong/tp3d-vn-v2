import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { spaces } from '@/data/spaces';
import { SpaceDetail } from '@/components/space/space-detail';
export const generateStaticParams = () => spaces.map((s) => ({ slug: s.slug }));
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const s = spaces.find((x) => x.slug === slug);
  return { title: s?.title ?? 'Space not found', description: s?.description };
}
export default async function SpacePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const s = spaces.find((x) => x.slug === slug);
  if (!s) notFound();
  return <SpaceDetail space={s} />;
}
