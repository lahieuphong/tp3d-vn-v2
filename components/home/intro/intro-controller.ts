import {
  preloadHomeCriticalAssets,
  type CriticalAssetProgress,
} from './critical-assets';
import { markHomeIntroSeen, type HomeIntroDecision } from './intro-session';

export const INTRO_TIMING = {
  minimum: 1200,
  maximum: 4000,
  ready: 240,
  desktop: 1400,
  mobile: 1000,
  reduced: 300,
} as const;

/** The intro owns no scroll-story transforms. It only gates a short CSS reveal,
 * observes existing assets, and restores every temporary lock on all exits. */
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
  if (
    !decision.play ||
    !overlay ||
    !home ||
    window.scrollY !== 0 ||
    location.hash
  ) {
    html.removeAttribute('data-home-intro');
    html.removeAttribute('data-home-intro-header');
    callbacks.onComplete();
    return () => {};
  }
  let disposed = false;
  let released = false;
  const timers = new Set<ReturnType<typeof setTimeout>>();
  const abort = new AbortController();
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const compact = window.matchMedia('(max-width: 639px)');
  const fineDesktop = window.matchMedia(
    '(min-width: 1024px) and (pointer: fine)',
  );
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
  // A stable root gutter preserves the original layout width. On overlay-
  // scrollbar/mobile browsers it occupies no space. Never fix/transform main.
  ownStyle(html, 'scrollbar-gutter', 'stable');
  ownStyle(html, 'overflow-x', 'hidden');
  ownStyle(html, 'overflow-y', 'hidden');
  ownStyle(body, 'overflow-x', 'hidden');
  ownStyle(body, 'overflow-y', 'hidden');
  ownStyle(body, 'overscroll-behavior-x', 'none');
  ownStyle(body, 'overscroll-behavior-y', 'none');
  html.removeAttribute('data-home-intro-header');
  html.setAttribute('data-home-intro', 'waiting');
  ownStyle(overlay, '--hi-pointer-x', '0');
  ownStyle(overlay, '--hi-pointer-y', '0');

  // Pointer movement changes only two loader variables. One event-batched
  // frame writes the latest coordinates; no RAF is retained while idle.
  let pointerFrame = 0;
  let pointerListening = false;
  let pointerX = 0;
  let pointerY = 0;
  let pointerWidth = 1;
  let pointerHeight = 1;
  const resetPointer = () => {
    cancelAnimationFrame(pointerFrame);
    pointerFrame = 0;
    pointerX = 0;
    pointerY = 0;
    overlay.style.setProperty('--hi-pointer-x', '0');
    overlay.style.setProperty('--hi-pointer-y', '0');
  };
  const paintPointer = () => {
    pointerFrame = 0;
    if (disposed || !pointerListening || document.hidden) return;
    overlay.style.setProperty('--hi-pointer-x', pointerX.toFixed(4));
    overlay.style.setProperty('--hi-pointer-y', pointerY.toFixed(4));
  };
  const pointerMove = (event: PointerEvent) => {
    if (!Number.isFinite(event.clientX) || !Number.isFinite(event.clientY))
      return;
    pointerX = Math.max(
      -1,
      Math.min(1, (event.clientX / pointerWidth) * 2 - 1),
    );
    pointerY = Math.max(
      -1,
      Math.min(1, (event.clientY / pointerHeight) * 2 - 1),
    );
    if (!pointerFrame) pointerFrame = requestAnimationFrame(paintPointer);
  };
  const measurePointer = () => {
    pointerWidth = Math.max(1, window.innerWidth);
    pointerHeight = Math.max(1, window.innerHeight);
    resetPointer();
  };
  const syncPointer = () => {
    const enabled = !disposed && fineDesktop.matches && !motion.matches;
    if (enabled === pointerListening) return;
    pointerListening = enabled;
    if (enabled) {
      measurePointer();
      overlay.addEventListener('pointermove', pointerMove, { passive: true });
      overlay.addEventListener('pointerleave', resetPointer);
      window.addEventListener('resize', measurePointer, { passive: true });
    } else {
      overlay.removeEventListener('pointermove', pointerMove);
      overlay.removeEventListener('pointerleave', resetPointer);
      window.removeEventListener('resize', measurePointer);
      resetPointer();
    }
  };
  syncPointer();

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
  const release = () => {
    if (released) return;
    released = true;
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
    html.removeAttribute('data-home-intro');
    html.removeAttribute('data-home-intro-header');
  };
  const cleanup = () => {
    if (disposed) return;
    disposed = true;
    abort.abort();
    timers.forEach(clearTimeout);
    timers.clear();
    overlay.removeEventListener('animationend', animationEnd);
    window.removeEventListener('pagehide', complete);
    window.removeEventListener('popstate', complete);
    document.removeEventListener('visibilitychange', visibility);
    motion.removeEventListener('change', preferenceChanged);
    fineDesktop.removeEventListener('change', syncPointer);
    syncPointer();
    cancelAnimationFrame(pointerFrame);
    pointerFrame = 0;
    release();
  };
  const complete = () => {
    if (disposed) return;
    cleanup();
    markHomeIntroSeen();
    callbacks.onComplete();
  };
  const animationEnd = (event: AnimationEvent) => {
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
    // A preference change during the split must not strand transparent panels.
    if (html.dataset.homeIntro === 'revealing') complete();
    else syncPointer();
  };
  const reveal = () => {
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
    // The shared header changes geometry only inside its fully transparent
    // handoff interval. Reduced motion uses a short opacity handoff as well.
    later(
      () => {
        html.setAttribute('data-home-intro-header', 'home');
      },
      duration * (motion.matches ? 0.5 : 0.25),
    );
    // CSS animationend is primary; this also exits if animations are disabled.
    later(complete, duration + 100);
  };
  overlay.addEventListener('animationend', animationEnd);
  window.addEventListener('pagehide', complete);
  window.addEventListener('popstate', complete);
  document.addEventListener('visibilitychange', visibility);
  motion.addEventListener('change', preferenceChanged);
  fineDesktop.addEventListener('change', syncPointer);
  const elapsed = () => Math.max(0, performance.now() - decision.startedAt);
  const assets = preloadHomeCriticalAssets(home, {
    signal: abort.signal,
    timeoutMs: Math.max(0, INTRO_TIMING.maximum - elapsed()),
    onProgress: callbacks.onProgress,
  });
  void assets.promise.then((result) => {
    if (disposed || result.cancelled) return;
    later(() => {
      html.setAttribute('data-home-intro', 'ready');
      later(reveal, motion.matches ? 0 : INTRO_TIMING.ready);
    }, INTRO_TIMING.minimum - elapsed());
  });
  return cleanup;
}
