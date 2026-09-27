import type { BreezeDriver } from './breeze-renderer';

type Geometry = { top: number; height: number };
const clamp = (value: number) => Math.min(1, Math.max(0, value));
const smooth = (value: number) => {
  const bounded = clamp(value);
  return bounded * bounded * (3 - 2 * bounded);
};

/** Native scroll measurements for the single chapter after the opening. */
export function chapterFrame(
  geometry: Geometry,
  scrollY: number,
  viewportHeight: number,
  headerHeight: number,
) {
  const top = geometry.top - scrollY;
  const bottom = top + geometry.height;
  const viewport = Math.max(1, viewportHeight);
  return {
    entry: clamp((viewport - top) / (viewport * 0.35)),
    progress: clamp((viewport - top) / (viewport + geometry.height)),
    phase:
      bottom <= 0 || top >= viewport
        ? 'far'
        : top > headerHeight
          ? 'entering'
          : bottom < viewport * 0.65
            ? 'leaving'
            : 'active',
  };
}

export function chapterHeaderTheme(
  worlds: Geometry,
  scrollY: number,
  headerHeight: number,
  viewportHeight: number,
): 'dark' | 'light' | null {
  const sample = scrollY + headerHeight;
  if (sample >= worlds.top + worlds.height) return 'light';
  return sample >= worlds.top + Math.min(headerHeight, viewportHeight * 0.08)
    ? 'dark'
    : null;
}

/** One Worlds reveal controller, also driving the shared Breeze. No scene
 * registry, layer parallax, callout stagger, pin spacer or idle animation loop. */
export function mountHomeChapters(
  root: HTMLElement,
  breeze?: BreezeDriver,
): () => void {
  const worldNode = root.querySelector<HTMLElement>(
    '[data-home-chapter="worlds"]',
  );
  if (!worldNode) return () => {};
  const worlds = worldNode;
  const header = document.querySelector<HTMLElement>('.site-header');
  const reveals = [
    ...worlds.querySelectorAll<HTMLElement>('[data-chapter-reveal]'),
  ];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const compact = window.matchMedia('(max-width: 767px)');
  const originals = reveals.map((node) => ({
    node,
    styles: ['transform', 'opacity'].map((property) => ({
      property,
      value: node.style.getPropertyValue(property),
      priority: node.style.getPropertyPriority(property),
    })),
  }));
  const originalAttributes = {
    phase: worlds.dataset.phase,
    progress: worlds.dataset.progress,
  };
  const originalTheme = header?.dataset.chapterTheme;
  let geometry: Geometry = { top: 0, height: 1 };
  let viewport = Math.max(1, window.innerHeight),
    headerHeight = 0;
  let disposed = false,
    frame = 0,
    needsMeasure = true,
    dirty = false;

  const clear = () => {
    if (!dirty) return;
    for (const { node, styles } of originals) {
      for (const { property, value, priority } of styles) {
        if (value) node.style.setProperty(property, value, priority);
        else node.style.removeProperty(property);
      }
    }
    worlds.dataset.phase = 'far';
    delete worlds.dataset.progress;
    dirty = false;
  };
  const schedule = () => {
    if (disposed || document.hidden || frame) return;
    frame = requestAnimationFrame(render);
  };
  const measure = () => {
    const scrollY = window.scrollY;
    viewport = Math.max(1, window.innerHeight);
    // Complete geometry reads before Breeze/theme/reveal writes.
    const headerBounds = header?.getBoundingClientRect();
    const worldBounds = worlds.getBoundingClientRect();
    const homeBounds = breeze ? root.getBoundingClientRect() : null;
    headerHeight = headerBounds?.height ?? 0;
    geometry = { top: worldBounds.top + scrollY, height: worldBounds.height };
    if (homeBounds) breeze?.measure(homeBounds, scrollY, worldBounds);
    needsMeasure = false;
  };
  function render() {
    frame = 0;
    if (disposed || document.hidden) return;
    if (needsMeasure) measure();
    const scrollY = window.scrollY;
    const theme = chapterHeaderTheme(geometry, scrollY, headerHeight, viewport);
    if (header && header.dataset.chapterTheme !== (theme ?? undefined)) {
      if (theme) header.dataset.chapterTheme = theme;
      else delete header.dataset.chapterTheme;
    }
    breeze?.paint(scrollY, viewport, reduced.matches);
    const state = chapterFrame(geometry, scrollY, viewport, headerHeight);
    if (reduced.matches || state.phase === 'far') {
      clear();
      return;
    }
    dirty = true;
    worlds.dataset.phase = state.phase;
    worlds.dataset.progress = state.progress.toFixed(4);
    const amplitude = compact.matches ? 0.4 : 1;
    reveals.forEach((node, index) => {
      // Preserve the atrium's existing restrained entrance exactly.
      const reveal = smooth((state.entry - Math.min(index, 4) * 0.045) / 0.72);
      node.style.transform = `translate3d(0, ${((1 - reveal) * 18 * amplitude).toFixed(2)}px, 0) scale(1.0000)`;
      node.style.opacity = reveal.toFixed(4);
    });
  }
  const resize = () => {
    needsMeasure = true;
    schedule();
  };
  const visibility = () => {
    if (document.hidden) {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    } else resize();
  };
  // The owner and its one chapter are the only scene measurements. Native
  // scroll already gates reveals by cached geometry; no IntersectionObserver
  // or removed-scene targets are necessary.
  const sizes =
    typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize);
  sizes?.observe(root);
  sizes?.observe(worlds);
  if (header) sizes?.observe(header);
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('pageshow', resize);
  document.addEventListener('visibilitychange', visibility);
  reduced.addEventListener('change', schedule);
  compact.addEventListener('change', resize);
  render();

  return () => {
    if (disposed) return;
    disposed = true;
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    sizes?.disconnect();
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', resize);
    window.removeEventListener('pageshow', resize);
    document.removeEventListener('visibilitychange', visibility);
    reduced.removeEventListener('change', schedule);
    compact.removeEventListener('change', resize);
    clear();
    for (const key of ['phase', 'progress'] as const) {
      const value = originalAttributes[key];
      if (value === undefined) delete worlds.dataset[key];
      else worlds.dataset[key] = value;
    }
    if (header) {
      if (originalTheme === undefined) delete header.dataset.chapterTheme;
      else header.dataset.chapterTheme = originalTheme;
    }
  };
}
