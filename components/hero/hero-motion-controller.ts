import { heroPlayback, heroTimeline } from './hero-motion-timeline';

/** Owns only this Hero's effects. No scroll handler, render loop or global styles. */
export function mountHeroMotion(element: HTMLElement) {
  const image = element.querySelector<HTMLImageElement>('.editorial-image img');
  if (
    !image ||
    typeof element.animate !== 'function' ||
    typeof IntersectionObserver === 'undefined'
  ) {
    return () => {};
  }

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let disposed = false;
  let ready = false;
  let failed = false;
  let pageHidden = false;
  let ratio = 0;
  let animations: Animation[] = [];
  let duration = 0;
  let savedPhase = 0;
  let lastSize = '';
  let state = 'static';

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
        const target = element.querySelector<HTMLElement>(selector);
        if (!target) continue;
        const animation = target.animate(frames, {
          duration,
          iterations: Infinity,
          easing: 'linear',
        });
        animation.pause();
        animation.currentTime = savedPhase * duration;
        animations.push(animation);
      }
    } catch {
      // Unsupported animation features leave the original photograph intact.
      failed = true;
      cancel();
    }
  };

  const sync = () => {
    if (disposed) return;
    const next = heroPlayback({
      ratio,
      hidden: document.hidden || pageHidden,
      reduced: reduced.matches,
      ready: ready && !failed,
    });
    if (next === 'static') {
      cancel();
      return;
    }
    // A restored scroll position never starts an invisible loop on first load.
    if (!animations.length && next !== 'paused') create();
    if (!animations.length || next === state) return;
    for (const animation of animations) {
      if (next === 'paused') animation.pause();
      else {
        animation.updatePlaybackRate(next === 'slow' ? 0.25 : 1);
        if (animation.playState !== 'running') animation.play();
      }
    }
    state = next;
    element.dataset.heroMotion = next;
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
    // Only size/preference changes rebuild effects; ordinary scrolling resumes them.
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
    // Refresh visibility before resuming a page restored from the back/forward cache.
    ratio = 0;
    intersection.unobserve(element);
    intersection.observe(element);
    sync();
  };
  const onImageError = () => {
    ready = false;
    sync();
  };
  const onImageLoad = async () => {
    try {
      await image.decode();
    } catch {
      /* An interrupted decode can still leave a usable frame. */
    }
    if (disposed) return;
    ready = image.complete && image.naturalWidth > 0;
    sync();
  };

  reduced.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('pagehide', onPageHide);
  window.addEventListener('pageshow', onPageShow);
  image.addEventListener('load', onImageLoad);
  image.addEventListener('error', onImageError);
  if (image.complete) void onImageLoad();

  return () => {
    disposed = true;
    intersection.disconnect();
    sizeObserver?.disconnect();
    window.removeEventListener('resize', resize);
    reduced.removeEventListener('change', sync);
    document.removeEventListener('visibilitychange', sync);
    window.removeEventListener('pagehide', onPageHide);
    window.removeEventListener('pageshow', onPageShow);
    image.removeEventListener('load', onImageLoad);
    image.removeEventListener('error', onImageError);
    cancel();
  };
}
