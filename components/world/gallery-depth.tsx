'use client';
import { useEffect } from 'react';
import { createPointerFollower } from '@/lib/motion/pointer';

/** DEPTH on the first exhibit only. The follower eases toward a mouse pointer
 * in one RAF that stops when it settles (touch, pen and reduced motion never
 * drive it); CSS applies the offsets on the desktop tier only. Written for
 * the Gallery (the defaults); since TP3D PASS 10 Room 02 reuses it for its
 * hero specimen with its own target and custom property. */
export function GalleryDepth({
  target = '[data-gallery-depth]',
  property = '--wg-depth',
}: {
  /** The one element that receives depth. */
  target?: string;
  /** Prefix of the `-x` / `-y` custom properties the CSS reads. */
  property?: string;
} = {}) {
  useEffect(() => {
    const exhibit = document.querySelector<HTMLElement>(target);
    if (!exhibit) return;
    return createPointerFollower(exhibit, (x, y) => {
      exhibit.style.setProperty(`${property}-x`, x.toFixed(4));
      exhibit.style.setProperty(`${property}-y`, y.toFixed(4));
    });
  }, [target, property]);
  return null;
}
