import {
  preloadHomeCriticalAssets,
  type CriticalAssetProgress,
  type CriticalAssetResult,
} from './critical-assets';
import { markHomeIntroPlayed, type HomeIntroDecision } from './intro-runtime';
import { DURATION } from '@/lib/motion/tokens';

/** The opening is the homepage's single arrival moment (`entrance`); phones
 * keep a shorter `cinematic` opening. Every reveal phase in home-intro.css is a
 * fraction of this duration, so the gate never cuts an animation short. */
export const INTRO_TIMING = {
  minimum: 1800,
  maximum: 4000,
  ready: 150,
  desktop: DURATION.entrance,
  mobile: DURATION.cinematic,
  reduced: 300,
} as const;

/** Owns only the entry gate, resource observation and temporary interaction
 * locks. The HomeStory master owns scroll motion after this gate. */
export function mountHomeIntro(
  decision: HomeIntroDecision,
  callbacks: {
    onProgress: (value: CriticalAssetProgress) => void;
    onComplete: () => void;
  },
): () => void {
  const html = document.documentElement;
  const body = document.body;
  const overlay = document.querySelector<HTMLElement>(
    '[data-home-intro-overlay]',
  );
  const home = document.querySelector<HTMLElement>('.home-experience');
  if (!decision.play || !overlay || !home) {
    html.removeAttribute('data-home-intro');
    if (decision.scrollRestoration !== undefined)
      history.scrollRestoration = decision.scrollRestoration;
    callbacks.onComplete();
    return () => {};
  }
  let disposed = false;
  const startedAt = performance.now();
  const timers = new Set<ReturnType<typeof setTimeout>>();
  const abort = new AbortController();
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const compact = window.matchMedia('(max-width: 767px)');
  const pointer = window.matchMedia(
    '(min-width: 1024px) and (hover: hover) and (pointer: fine)',
  );
  let pointerFrame = 0;
  let pointerX = 0;
  let pointerY = 0;
  let visualReady = motion.matches;
  let resources: CriticalAssetResult | undefined;
  let minimumReached = false;
  let readyScheduled = false;
  const restoration = decision.scrollRestoration ?? history.scrollRestoration;
  const sequence = overlay.getAttribute('data-intro-sequence');
  const savedStyles: {
    node: HTMLElement;
    property: string;
    value: string;
    priority: string;
  }[] = [];
  const ownStyle = (node: HTMLElement, property: string, value: string) => {
    savedStyles.push({
      node,
      property,
      value: node.style.getPropertyValue(property),
      priority: node.style.getPropertyPriority(property),
    });
    node.style.setProperty(property, value);
  };
  const backgrounds = [
    ...document.querySelectorAll<HTMLElement>(
      '.site-header, .home-experience, .site-footer, .skip-link',
    ),
  ].map((node) => ({ node, inert: node.inert }));
  const busy = home.getAttribute('aria-busy');
  backgrounds.forEach(({ node }) => {
    node.inert = true;
  });
  home.setAttribute('aria-busy', 'true');
  history.scrollRestoration = 'manual';
  ownStyle(html, 'scrollbar-gutter', 'stable');
  ownStyle(html, 'overflow-x', 'hidden');
  ownStyle(html, 'overflow-y', 'hidden');
  ownStyle(body, 'overflow-x', 'hidden');
  ownStyle(body, 'overflow-y', 'hidden');
  ownStyle(body, 'overscroll-behavior-x', 'none');
  ownStyle(body, 'overscroll-behavior-y', 'none');
  ownStyle(overlay, '--hi-pointer-x', '0');
  ownStyle(overlay, '--hi-pointer-y', '0');
  const paintPointer = () => {
    pointerFrame = 0;
    overlay.style.setProperty('--hi-pointer-x', String(pointerX));
    overlay.style.setProperty('--hi-pointer-y', String(pointerY));
  };
  const movePointer = (event: PointerEvent) => {
    if (!pointer.matches || motion.matches || event.pointerType === 'touch')
      return;
    if (
      html.dataset.homeIntro !== 'waiting' &&
      html.dataset.homeIntro !== 'ready'
    )
      return;
    pointerX = Math.max(
      -1,
      Math.min(1, (event.clientX / window.innerWidth) * 2 - 1),
    );
    pointerY = Math.max(
      -1,
      Math.min(1, (event.clientY / window.innerHeight) * 2 - 1),
    );
    if (!pointerFrame) pointerFrame = requestAnimationFrame(paintPointer);
  };
  const resetPointer = () => {
    if (pointerFrame) cancelAnimationFrame(pointerFrame);
    pointerFrame = 0;
    pointerX = pointerY = 0;
    paintPointer();
  };
  const updatePointer = () => {
    overlay.removeEventListener('pointermove', movePointer);
    overlay.removeEventListener('pointerleave', resetPointer);
    resetPointer();
    if (pointer.matches && !motion.matches) {
      overlay.addEventListener('pointermove', movePointer, { passive: true });
      overlay.addEventListener('pointerleave', resetPointer);
    }
  };
  updatePointer();
  const resetScroll = () =>
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  resetScroll();
  html.setAttribute('data-home-intro', 'waiting');
  overlay.setAttribute('data-intro-sequence', 'playing');

  const later = (callback: () => void, delay: number) => {
    const timer = setTimeout(
      () => {
        timers.delete(timer);
        if (!disposed) callback();
      },
      Math.max(0, delay),
    );
    timers.add(timer);
  };
  const cleanup = () => {
    if (disposed) return;
    disposed = true;
    abort.abort();
    timers.forEach(clearTimeout);
    timers.clear();
    resetPointer();
    overlay.removeEventListener('pointermove', movePointer);
    overlay.removeEventListener('pointerleave', resetPointer);
    pointer.removeEventListener('change', updatePointer);
    overlay.removeEventListener('animationend', animationEnd);
    window.removeEventListener('pagehide', complete);
    window.removeEventListener('popstate', complete);
    window.removeEventListener('pageshow', resetScroll);
    document.removeEventListener('visibilitychange', visibility);
    motion.removeEventListener('change', preferenceChanged);
    for (const { node, property, value, priority } of savedStyles.reverse()) {
      if (value) node.style.setProperty(property, value, priority);
      else node.style.removeProperty(property);
    }
    savedStyles.length = 0;
    backgrounds.forEach(({ node, inert }) => {
      node.inert = inert;
    });
    backgrounds.length = 0;
    if (busy === null) home.removeAttribute('aria-busy');
    else home.setAttribute('aria-busy', busy);
    if (sequence === null) overlay.removeAttribute('data-intro-sequence');
    else overlay.setAttribute('data-intro-sequence', sequence);
    history.scrollRestoration = restoration;
    html.removeAttribute('data-home-intro');
  };
  const complete = () => {
    if (disposed) return;
    cleanup();
    markHomeIntroPlayed();
    callbacks.onComplete();
  };
  const animationEnd = (event: AnimationEvent) => {
    if (
      event.target === overlay.querySelector('.hi-progress-row') &&
      event.animationName === 'hi-fade-in'
    ) {
      visualReady = true;
      finishPreparation();
    }
    if (
      (html.dataset.homeIntro === 'revealing' &&
        event.target === overlay.querySelector('.hi-panel-bottom') &&
        event.animationName === 'hi-bottom-open') ||
      (html.dataset.homeIntro === 'reduced' &&
        event.target === overlay &&
        event.animationName === 'hi-reduced-exit')
    )
      complete();
  };
  const visibility = () => {
    if (document.hidden) complete();
  };
  const preferenceChanged = () => {
    updatePointer();
    if (motion.matches) {
      visualReady = true;
      finishPreparation();
    }
    if (html.dataset.homeIntro === 'revealing') complete();
  };
  const reveal = () => {
    resetScroll();
    resetPointer();
    const duration = motion.matches
      ? INTRO_TIMING.reduced
      : compact.matches
        ? INTRO_TIMING.mobile
        : INTRO_TIMING.desktop;
    ownStyle(html, '--hi-duration', `${duration}ms`);
    html.setAttribute(
      'data-home-intro',
      motion.matches ? 'reduced' : 'revealing',
    );
    later(complete, duration + 100); // Guard if animationend is unavailable.
  };
  const finishPreparation = () => {
    if (disposed || readyScheduled || !resources || !minimumReached) return;
    if (!visualReady && !resources.timedOut) return;
    readyScheduled = true;
    html.setAttribute('data-home-intro', 'ready');
    later(
      reveal,
      resources.timedOut || motion.matches ? 0 : INTRO_TIMING.ready,
    );
  };
  overlay.addEventListener('animationend', animationEnd);
  window.addEventListener('pagehide', complete);
  window.addEventListener('popstate', complete);
  window.addEventListener('pageshow', resetScroll);
  document.addEventListener('visibilitychange', visibility);
  motion.addEventListener('change', preferenceChanged);
  pointer.addEventListener('change', updatePointer);
  // CSS may start later than hydration (e.g. a newly foregrounded document).
  // Wait for the visible sequence, but still escape missing animation events.
  later(() => {
    visualReady = true;
    finishPreparation();
  }, INTRO_TIMING.maximum);
  const assets = preloadHomeCriticalAssets(home, {
    signal: abort.signal,
    timeoutMs: INTRO_TIMING.maximum,
    onProgress: callbacks.onProgress,
  });
  void assets.promise.then((result) => {
    if (disposed || result.cancelled) return;
    resources = result;
    later(
      () => {
        minimumReached = true;
        finishPreparation();
      },
      INTRO_TIMING.minimum - (performance.now() - startedAt),
    );
  });
  return cleanup;
}
