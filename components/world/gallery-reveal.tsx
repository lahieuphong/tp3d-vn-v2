'use client';
import { useEffect } from 'react';
import { MOTION_QUERIES } from '@/lib/motion/capability';

/** REVEAL for exhibits below the first view: each frame opens and its label
 * rises once, as it enters. The server HTML shows every exhibit; only script
 * marks the ones still out of view as pending, so nothing is ever hidden
 * without it. Reduced motion, keyboard focus and cleanup reveal at once.
 * Written for the Gallery (the defaults); since TP3D PASS 10 Room 02 reuses
 * the same mechanism with its own room and specimen selectors. */
export function GalleryReveal({
  root = 'main[data-world-gallery]',
  item = '[data-gallery-exhibit]',
}: {
  /** The room's main element. */
  root?: string;
  /** Each revealed piece inside it. */
  item?: string;
} = {}) {
  useEffect(() => {
    const room = document.querySelector<HTMLElement>(root);
    if (!room || typeof IntersectionObserver === 'undefined') return;
    const reduced = window.matchMedia(MOTION_QUERIES.reduced);
    if (reduced.matches) return;
    const exhibits = [...room.querySelectorAll<HTMLElement>(item)];
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) show(entry.target as HTMLElement);
      },
      { threshold: 0.1 },
    );
    function show(exhibit: HTMLElement) {
      exhibit.dataset.reveal = 'visible';
      observer.unobserve(exhibit);
    }
    for (const exhibit of exhibits) {
      if (exhibit.getBoundingClientRect().top < window.innerHeight) continue;
      exhibit.dataset.reveal = 'pending';
      observer.observe(exhibit);
    }
    const focus = (event: FocusEvent) => {
      const exhibit =
        event.target instanceof Element
          ? event.target.closest<HTMLElement>(item)
          : null;
      if (exhibit) show(exhibit);
    };
    const revealAll = () => {
      observer.disconnect();
      for (const exhibit of exhibits)
        if (exhibit.dataset.reveal === 'pending')
          exhibit.dataset.reveal = 'visible';
    };
    room.addEventListener('focusin', focus);
    reduced.addEventListener('change', revealAll);
    return () => {
      revealAll();
      room.removeEventListener('focusin', focus);
      reduced.removeEventListener('change', revealAll);
    };
  }, [root, item]);
  return null;
}
