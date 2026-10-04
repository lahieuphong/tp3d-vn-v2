'use client';

import { useEffect, useRef } from 'react';
import type { World } from '@/data/types';
import { EditorialImage } from '@/components/shared/editorial-image';
import { SketchfabViewer } from './sketchfab-viewer';
import {
  viewerCopy,
  viewerMounted,
  type ViewerState,
} from './world-viewer-state';

/** TP3D PASS 07: the poster is a threshold, not a placeholder. It stays
 * mounted in every state: the live viewer loads beneath it, and the poster
 * yields only once the viewer is ready. One toggle serves all three states,
 * so keyboard focus never has to move. */
export function WorldDetailStage({
  world,
  index,
  total,
  viewer,
  onEnter,
  onClose,
  onReady,
}: {
  world: World;
  index: number;
  total: number;
  viewer: ViewerState;
  onEnter: () => void;
  onClose: () => void;
  onReady: () => void;
}) {
  const stageRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const copy = viewerCopy[viewer];

  useEffect(() => {
    const stage = stageRef.current;
    // Decorative depth belongs to the resting poster only.
    if (!stage || viewer !== 'poster') return;
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
      const x = Math.max(
        -1,
        Math.min(1, ((event.clientX - rect.left) / rect.width) * 2 - 1),
      );
      const y = Math.max(
        -1,
        Math.min(1, ((event.clientY - rect.top) / rect.height) * 2 - 1),
      );
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
  }, [viewer, world.slug]);

  useEffect(() => {
    // Live moves the toggle into the band above the viewer. Whoever just used
    // it (it keeps focus) must still see it, even on a stage taller than the
    // screen; the band's scroll margin clears the fixed site header.
    const toggle = toggleRef.current;
    if (viewer === 'live' && toggle && document.activeElement === toggle)
      toggle.scrollIntoView({ block: 'nearest' });
  }, [viewer]);

  return (
    <section
      className="world-detail-stage"
      ref={stageRef}
      aria-label={`${world.title} preview`}
      data-viewer={viewer}
    >
      <EditorialImage
        src={world.image.src}
        alt={world.image.alt}
        priority
        sizes="(max-width: 960px) 100vw, 70vw"
        className="world-detail-poster"
      />
      <span className="world-detail-stage-frame" aria-hidden="true" />
      <p className="world-detail-stage-intro eyebrow" aria-hidden="true">
        EXPLORE IN THREE
        <br />
        DIMENSIONS
      </p>
      <p className="world-detail-stage-count eyebrow" aria-hidden="true">
        {String(index).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </p>
      <p className="world-detail-stage-notes eyebrow" aria-hidden="true">
        MATERIALS
        <br />
        LIGHT
        <br />
        RITUALS
        <br />A BRIGHTER EVERYDAY
      </p>
      {/* Truthful status (an implicit role="status" live region): no
          progress that does not exist; it changes only with the state. */}
      <output className="world-detail-status eyebrow" aria-live="polite">
        {copy.status}
      </output>
      {world.available && (
        <button
          ref={toggleRef}
          className="world-detail-explore eyebrow"
          type="button"
          onClick={viewer === 'poster' ? onEnter : onClose}
        >
          {viewer === 'live' && <span aria-hidden="true">←</span>}
          <span>{copy.toggle}</span>
          {viewer === 'poster' && <span aria-hidden="true">→</span>}
        </button>
      )}
      {/* Mounted only after an explicit ENTER 3D WORLD; inert until live. */}
      {viewerMounted(viewer) && (
        <SketchfabViewer
          uid={world.sketchfabUid}
          title={world.title}
          interactive={viewer === 'live'}
          onReady={onReady}
        />
      )}
      <button
        type="button"
        className="world-detail-fullscreen"
        aria-label={`View ${world.title} fullscreen`}
        onClick={() => stageRef.current?.requestFullscreen?.()}
      >
        ⛶
      </button>
    </section>
  );
}
