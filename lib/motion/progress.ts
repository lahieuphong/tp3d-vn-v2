/** Normalised scroll progress for sections in normal document flow. The home
 * story stage has its own scroll owner (home-story-timeline.ts); anything
 * inside that sticky stage must sample its progress instead of this module. */

export const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/** 0 at `start`, 1 at `end`, clamped. Same contract as `span` in home-motion.ts. */
export function progressBetween(value: number, start: number, end: number) {
  if (end === start) return value < end ? 0 : 1;
  return clamp01((value - start) / (end - start));
}

export type ScrollGeometry = {
  /** Element top in document coordinates (rect.top + scrollY at measure time). */
  top: number;
  height: number;
  viewport: number;
};

export type ScrollProgressMode = 'sticky' | 'viewport';

/** `sticky`: 0 when the element's top reaches the viewport top, 1 when its
 * bottom reaches the viewport bottom (the home story formula).
 * `viewport`: 0 when its top enters at the bottom edge, 1 when its bottom
 * leaves at the top edge (in-flow reveals and parallax). */
export function scrollProgress(
  scrollY: number,
  { top, height, viewport }: ScrollGeometry,
  mode: ScrollProgressMode = 'viewport',
) {
  return mode === 'sticky'
    ? progressBetween(scrollY, top, top + height - viewport)
    : progressBetween(scrollY, top - viewport, top + height);
}

/** Tracks one element's progress with cached geometry: layout is read only
 * after a resize, never per frame. Scroll events are coalesced into one RAF
 * and `onProgress` runs only when the value changes. Returns its cleanup. */
export function createScrollProgress(
  element: HTMLElement,
  onProgress: (progress: number) => void,
  mode: ScrollProgressMode = 'viewport',
) {
  let geometry: ScrollGeometry | null = null;
  let frame = 0;
  let last = Number.NaN;
  const measure = (): ScrollGeometry => {
    const rect = element.getBoundingClientRect();
    return {
      top: rect.top + window.scrollY,
      height: rect.height,
      viewport: window.innerHeight,
    };
  };
  const update = () => {
    frame = 0;
    geometry ??= measure();
    const progress = scrollProgress(window.scrollY, geometry, mode);
    if (progress !== last) {
      last = progress;
      onProgress(progress);
    }
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  const invalidate = () => {
    geometry = null;
    schedule();
  };
  // Page height changes above the element (late images, fonts) move it too.
  const observer = new ResizeObserver(invalidate);
  observer.observe(element);
  observer.observe(document.documentElement);
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', invalidate, { passive: true });
  update();
  return () => {
    cancelAnimationFrame(frame);
    frame = 0;
    observer.disconnect();
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', invalidate);
  };
}
