'use client';

import { useEffect, useRef, useState } from 'react';
import type { World } from '@/data/types';
import { EditorialImage } from '@/components/shared/editorial-image';
import { SketchfabViewer } from './sketchfab-viewer';

export function WorldDetailStage({ world }: { world: World }) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const stageRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || viewerOpen) return;
    const allowed = window.matchMedia(
      '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)',
    );
    let frame = 0;
    const reset = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      stage.style.removeProperty('--stage-x');
      stage.style.removeProperty('--stage-y');
      stage.style.removeProperty('--stage-front-x');
      stage.style.removeProperty('--stage-front-y');
    };
    const move = (event: PointerEvent) => {
      if (!allowed.matches || event.pointerType !== 'mouse') return;
      const rect = stage.getBoundingClientRect();
      const x = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width) * 2 - 1));
      const y = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height) * 2 - 1));
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        stage.style.setProperty('--stage-x', `${x * 4}px`);
        stage.style.setProperty('--stage-y', `${y * 4}px`);
        stage.style.setProperty('--stage-front-x', `${x * 7}px`);
        stage.style.setProperty('--stage-front-y', `${y * 7}px`);
        frame = 0;
      });
    };
    stage.addEventListener('pointermove', move, { passive: true });
    stage.addEventListener('pointerleave', reset);
    return () => {
      reset();
      stage.removeEventListener('pointermove', move);
      stage.removeEventListener('pointerleave', reset);
    };
  }, [viewerOpen, world.slug]);

  return (
    <section className="world-detail-stage" ref={stageRef} aria-label={`${world.title} preview`}>
      {viewerOpen ? (
        <SketchfabViewer uid={world.sketchfabUid} title={world.title} />
      ) : (
        <>
          <EditorialImage
            src={world.image.src}
            alt={world.image.alt}
            priority
            sizes="(max-width: 960px) 100vw, 70vw"
            className="world-detail-poster"
          />
          <span className="world-detail-stage-frame" aria-hidden="true" />
          {world.available && (
            <button
              className="world-detail-explore eyebrow"
              type="button"
              onClick={() => setViewerOpen(true)}
            >
              EXPLORE IN 3D <span aria-hidden="true">→</span>
            </button>
          )}
        </>
      )}
    </section>
  );
}
