'use client';
import { useEffect } from 'react';
import { createPointerFollower } from '@/lib/motion/pointer';

/** DEPTH on the first exhibit only. The follower eases toward a mouse pointer
 * in one RAF that stops when it settles (touch, pen and reduced motion never
 * drive it); CSS applies the offsets on the desktop tier only. */
export function GalleryDepth() {
  useEffect(() => {
    const exhibit = document.querySelector<HTMLElement>('[data-gallery-depth]');
    if (!exhibit) return;
    return createPointerFollower(exhibit, (x, y) => {
      exhibit.style.setProperty('--wg-depth-x', x.toFixed(4));
      exhibit.style.setProperty('--wg-depth-y', y.toFixed(4));
    });
  }, []);
  return null;
}
