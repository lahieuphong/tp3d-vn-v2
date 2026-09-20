import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { worlds } from '@/data/worlds';
import { WorldDetail } from '@/components/worlds/world-detail';
import '@/components/worlds/worlds.css';

export const generateStaticParams = () => worlds.map((world) => ({ slug: world.slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const world = worlds.find((item) => item.slug === slug);
  return {
    title: world?.title ?? 'World not found',
    description: world?.description,
  };
}

export default async function WorldDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const world = worlds.find((item) => item.slug === slug);
  if (!world) notFound();
  return <WorldDetail initialWorld={world} worlds={worlds} />;
}
