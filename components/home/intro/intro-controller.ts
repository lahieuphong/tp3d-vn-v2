import {
  preloadHomeCriticalAssets,
  type CriticalAssetProgress,
} from './critical-assets';
import { markHomeIntroPlayed, type HomeIntroDecision } from './intro-runtime';

export const INTRO_TIMING = {
  minimum: 1600,
  maximum: 4000,
  ready: 150,
  desktop: 1000,
  mobile: 900,
  reduced: 250,
} as const;

/** Owns only the entry gate, resource observation and temporary interaction
 * locks. The existing Scene 1–5 scroll controllers are not modified. */
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
    if (html.dataset.homeIntro === 'revealing') complete();
  };
  const reveal = () => {
    resetScroll();
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
  overlay.addEventListener('animationend', animationEnd);
  window.addEventListener('pagehide', complete);
  window.addEventListener('popstate', complete);
  window.addEventListener('pageshow', resetScroll);
  document.addEventListener('visibilitychange', visibility);
  motion.addEventListener('change', preferenceChanged);
  const assets = preloadHomeCriticalAssets(home, {
    signal: abort.signal,
    timeoutMs: INTRO_TIMING.maximum,
    onProgress: callbacks.onProgress,
  });
  void assets.promise.then((result) => {
    if (disposed || result.cancelled) return;
    later(
      () => {
        html.setAttribute('data-home-intro', 'ready');
        later(
          reveal,
          result.timedOut || motion.matches ? 0 : INTRO_TIMING.ready,
        );
      },
      INTRO_TIMING.minimum - (performance.now() - startedAt),
    );
  });
  return cleanup;
}
