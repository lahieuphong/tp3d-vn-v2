import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { projects, getProject } from '@/data/projects';
import { products } from '@/data/products';
import { materials } from '@/data/materials';
import { ExperienceShell } from '@/components/experience/experience-shell';
export const generateStaticParams = () =>
  projects.filter((p) => p.threeScene.enabled).map((p) => ({ slug: p.slug }));
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const p = getProject((await params).slug);
  return {
    title: p ? `${p.title} — Spatial experience` : 'Experience not found',
    description:
      'Get closer to the interior. A dedicated space for exploring rooms, objects and materials in 3D.',
  };
}
export default async function ExperiencePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const p = getProject((await params).slug);
  if (!p || !p.threeScene.enabled) notFound();
  return (
    <ExperienceShell
      project={p}
      products={products.filter((x) => p.products.includes(x.slug))}
      materials={materials.filter((x) => p.materials.includes(x.slug))}
    />
  );
}
