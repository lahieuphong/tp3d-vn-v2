'use client';
import { lazy, Suspense, useCallback, useState } from 'react';
import Link from 'next/link';
import type { Project, Product, Material } from '@/data/types';
import type { SceneSelection } from './scene-registry';
import { ExperienceUI } from './experience-ui';
import { LoadingScreen } from './loading-screen';
import { SceneFallback } from './scene-fallback';
import { ExperienceBoundary } from './experience-boundary';
import { EditorialImage } from '@/components/shared/editorial-image';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
const ThreeSceneLoader = lazy(() => import('./three-scene-loader'));
export function ExperienceShell({
  project,
  products,
  materials,
}: {
  project: Project;
  products: Product[];
  materials: Material[];
}) {
  const [selection, setSelection] = useState<SceneSelection | null>(null);
  const onSelect = useCallback(
    (item: SceneSelection) => setSelection(item),
    [],
  );
  const item =
    selection?.kind === 'product'
      ? products.find((x) => x.slug === selection.slug)
      : materials.find((x) => x.slug === selection?.slug);
  return (
    <main id="main" className="experience-page">
      <h1 className="sr-only">{project.title} — 3D experience</h1>
      <ExperienceUI project={project} />
      <section className="experience-viewport">
        <EditorialImage
          src={project.coverImage.src}
          alt={project.coverImage.alt}
          priority
        />
        <div className="experience-poster-shade" />
        {project.threeScene.enabled ? (
          <ExperienceBoundary key={project.slug} slug={project.slug}>
            <Suspense fallback={<LoadingScreen />}>
              <ThreeSceneLoader
                key={project.threeScene.roomId}
                roomId={project.threeScene.roomId}
                slug={project.slug}
                onSelect={onSelect}
              />
            </Suspense>
          </ExperienceBoundary>
        ) : (
          <SceneFallback slug={project.slug} />
        )}
      </section>
      {(products.length > 0 || materials.length > 0) && (
        <section className="container experience-details">
          <div>
            <p className="eyebrow">WITHIN THIS INTERIOR</p>
            <h2>Get to know the details.</h2>
          </div>
          <div className="experience-item-lists">
            {products.length > 0 && (
              <div>
                <h3>Objects</h3>
                {/* Product details render per request: no speculative
                    prefetch (TP3D PASS 12). */}
                {products.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/products/${p.slug}`}
                    prefetch={false}
                  >
                    {p.title}
                    <span aria-hidden="true">↗</span>
                  </Link>
                ))}
              </div>
            )}
            {materials.length > 0 && (
              <div>
                <h3>Materials</h3>
                {materials.map((m) => (
                  <Link key={m.slug} href={`/materials/${m.slug}`}>
                    {m.title}
                    <span aria-hidden="true">↗</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
      <Sheet
        open={!!item}
        onOpenChange={(open) => {
          if (!open) setSelection(null);
        }}
      >
        <SheetContent className="selection-sheet">
          <SheetTitle>{item?.title}</SheetTitle>
          <SheetDescription>{item?.description}</SheetDescription>
          {item && (
            <>
              <EditorialImage src={item.image.src} alt={item.image.alt} />
              <Link
                className="text-link"
                href={`/${selection?.kind === 'product' ? 'products' : 'materials'}/${item.slug}`}
                prefetch={selection?.kind === 'product' ? false : undefined}
              >
                View details <span aria-hidden="true">↗</span>
              </Link>
            </>
          )}
        </SheetContent>
      </Sheet>
    </main>
  );
}
