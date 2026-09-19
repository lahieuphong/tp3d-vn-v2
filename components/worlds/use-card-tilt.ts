'use client';

import { useEffect, type RefObject } from 'react';

/** One delegated listener per grid; only the active card owns pointer tracking. */
export function useCardTilt(root: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const allowed = window.matchMedia(
      '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)',
    );
    let active: HTMLElement | null = null;
    let rect: DOMRect | null = null;
    let frame = 0;
    let x = 0;
    let y = 0;
    const paint = () => {
      frame = 0;
      if (!active) return;
      active.style.setProperty('--tilt-x', `${-y * 3}deg`);
      active.style.setProperty('--tilt-y', `${x * 4}deg`);
      active.style.setProperty('--image-x', `${-x * 6}px`);
      active.style.setProperty('--image-y', `${-y * 6}px`);
      active.style.setProperty('--plane-x', `${x * 3}px`);
      active.style.setProperty('--plane-y', `${y * 3}px`);
      active.style.setProperty('--front-x', `${x * 12}px`);
      active.style.setProperty('--front-y', `${y * 12}px`);
    };
    const move = (event: PointerEvent) => {
      if (!rect || event.pointerType !== 'mouse') return;
      x = Math.max(
        -1,
        Math.min(1, ((event.clientX - rect.left) / rect.width) * 2 - 1),
      );
      y = Math.max(
        -1,
        Math.min(1, ((event.clientY - rect.top) / rect.height) * 2 - 1),
      );
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const reset = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      if (active) {
        active.removeEventListener('pointermove', move);
        active.removeEventListener('pointerleave', reset);
        active.removeEventListener('pointercancel', reset);
        delete active.dataset.tilting;
        for (const name of [
          'tilt-x',
          'tilt-y',
          'image-x',
          'image-y',
          'plane-x',
          'plane-y',
          'front-x',
          'front-y',
        ])
          active.style.removeProperty(`--${name}`);
      }
      active = null;
      rect = null;
      window.removeEventListener('scroll', reset, true);
      window.removeEventListener('resize', reset);
    };
    const enter = (event: PointerEvent) => {
      if (!allowed.matches || event.pointerType !== 'mouse') return;
      const card =
        event.target instanceof Element
          ? event.target.closest<HTMLElement>('[data-tilt-card]')
          : null;
      if (!card || !element.contains(card) || card === active) return;
      reset();
      active = card;
      rect = card.getBoundingClientRect();
      card.dataset.tilting = 'true';
      card.addEventListener('pointermove', move, { passive: true });
      card.addEventListener('pointerleave', reset);
      card.addEventListener('pointercancel', reset);
      window.addEventListener('scroll', reset, {
        capture: true,
        passive: true,
      });
      window.addEventListener('resize', reset);
      move(event);
    };
    element.addEventListener('pointerover', enter, { passive: true });
    allowed.addEventListener('change', reset);
    return () => {
      reset();
      element.removeEventListener('pointerover', enter);
      allowed.removeEventListener('change', reset);
    };
  }, [root]);
}
