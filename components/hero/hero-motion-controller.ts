import { heroPlayback, heroTimeline } from './hero-motion-timeline';

export type HeroMotionController = {
  destroy: () => void;
  setPaused: (paused: boolean) => void;
};

/** One owned clock for geometry, typography and theme. Scroll never scrubs it. */
export function mountHeroMotion(element: HTMLElement): HeroMotionController {
  const images = [
    ...element.querySelectorAll<HTMLImageElement>('.emh-image img'),
  ];
  const primary = images[0];
  const fallback = { destroy: () => {}, setPaused: (_paused: boolean) => {} };
  if (
    !primary ||
    typeof element.animate !== 'function' ||
    typeof IntersectionObserver === 'undefined'
  )
    return fallback;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let disposed = false;
  let ready = false;
  let failed = false;
  let pageHidden = false;
  let manualPaused = false;
  let ratio = 0;
  let animations: Animation[] = [];
  let duration = 0;
  let savedPhase = 0;
  let lastSize = '';
  let state = 'static';
  const usable = new Set<HTMLImageElement>();

  const cancel = () => {
    const time = animations[0]?.currentTime;
    if (typeof time === 'number' && duration)
      savedPhase = (time % duration) / duration;
    animations.forEach((animation) => animation.cancel());
    animations = [];
    state = 'static';
    element.dataset.heroMotion = state;
  };
  const create = () => {
    const { width, height } = element.getBoundingClientRect();
    if (!width || !height) return;
    const timeline = heroTimeline(width, height);
    duration = timeline.duration;
    lastSize = `${width}:${height}`;
    try {
      for (const { selector, frames } of timeline.tracks) {
        const target =
          selector === '@header'
            ? document.querySelector<HTMLElement>('.site-header')
            : element.querySelector<HTMLElement>(selector);
        if (!target) continue;
        const animation = target.animate(frames, {
          duration,
          iterations: Infinity,
          easing: 'linear',
        });
        animations.push(animation);
        animation.pause();
        animation.currentTime = savedPhase * duration;
      }
    } catch {
      failed = true;
      cancel();
    }
  };
  const sync = () => {
    if (disposed) return;
    element.dataset.heroReady = String(ready && !failed && !reduced.matches);
    const next = heroPlayback({
      ratio,
      hidden: document.hidden || pageHidden,
      reduced: reduced.matches,
      ready: ready && !failed,
      manualPaused,
    });
    if (next === 'static') {
      cancel();
      return;
    }
    const visibleManualPause =
      manualPaused && ratio > 0 && !document.hidden && !pageHidden;
    if (!animations.length && (next !== 'paused' || visibleManualPause))
      create();
    if (failed) {
      element.dataset.heroReady = 'false';
      return;
    }
    if (!animations.length || next === state) return;
    for (const animation of animations) {
      if (next === 'paused') animation.pause();
      else {
        animation.updatePlaybackRate(next === 'slow' ? 0.25 : 1);
        if (animation.playState !== 'running') animation.play();
      }
    }
    state = next;
    element.dataset.heroMotion = state;
  };
  const intersection = new IntersectionObserver(
    (entries) => {
      const entry = entries[entries.length - 1];
      ratio = entry.isIntersecting ? entry.intersectionRatio : 0;
      sync();
    },
    { threshold: [0, 0.001, 0.25, 1] },
  );
  intersection.observe(element);
  const resize = () => {
    if (disposed || !animations.length) return;
    const { width, height } = element.getBoundingClientRect();
    if (`${width}:${height}` === lastSize) return;
    cancel();
    sync();
  };
  const sizeObserver =
    typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize);
  if (sizeObserver) sizeObserver.observe(element);
  else window.addEventListener('resize', resize, { passive: true });
  const onPageHide = () => {
    pageHidden = true;
    sync();
  };
  const onPageShow = () => {
    pageHidden = false;
    ratio = 0;
    intersection.unobserve(element);
    intersection.observe(element);
    sync();
  };
  const imageListeners: {
    image: HTMLImageElement;
    load: () => Promise<void>;
    error: () => void;
  }[] = [];
  const loadSecondary = () => {
    for (const image of images.slice(1)) {
      if (!image.dataset.src || image.getAttribute('src')) continue;
      image.sizes = image.dataset.sizes ?? '100vw';
      image.srcset = image.dataset.srcset ?? '';
      image.src = image.dataset.src;
    }
  };
  for (const image of images) {
    const load = async () => {
      try {
        await image.decode();
      } catch {
        /* Check actual image usability below. */
      }
      if (disposed) return;
      if (image.complete && image.naturalWidth > 0) usable.add(image);
      else usable.delete(image);
      if (image === primary && usable.has(primary)) loadSecondary();
      ready = usable.size === images.length;
      sync();
    };
    const error = () => {
      usable.delete(image);
      ready = false;
      sync();
    };
    image.addEventListener('load', load);
    image.addEventListener('error', error);
    imageListeners.push({ image, load, error });
    if (image.complete && image.getAttribute('src')) void load();
  }
  reduced.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('pagehide', onPageHide);
  window.addEventListener('pageshow', onPageShow);

  return {
    setPaused(paused) {
      manualPaused = paused;
      sync();
    },
    destroy() {
      disposed = true;
      intersection.disconnect();
      sizeObserver?.disconnect();
      window.removeEventListener('resize', resize);
      reduced.removeEventListener('change', sync);
      document.removeEventListener('visibilitychange', sync);
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('pageshow', onPageShow);
      for (const { image, load, error } of imageListeners) {
        image.removeEventListener('load', load);
        image.removeEventListener('error', error);
      }
      cancel();
      element.dataset.heroReady = 'false';
    },
  };
}
