'use client';

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  chooseHeroMotion,
  HERO_SESSION_KEY,
  HERO_BOOTSTRAP,
  type HeroMotionMode,
} from './hero-motion-policy';
import './hero-motion.css';

// Keeps client-side return visits short even when sessionStorage is unavailable.
let seenInMemory = false;

export function HeroIntro({ children }: { children: ReactNode }) {
  const hero = useRef<HTMLElement>(null);
  const decision = useRef<HeroMotionMode | null>(null);
  const finish = useRef<(ambient?: boolean) => void>(() => {});
  const [mode, setMode] = useState<HeroMotionMode>('full');
  const [ambient, setAmbient] = useState(false);

  useLayoutEffect(() => {
    const element = hero.current;
    if (!element) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mobile = window.matchMedia('(max-width: 760px)');
    let seen = seenInMemory;
    try {
      seen ||= sessionStorage.getItem(HERO_SESSION_KEY) === '1';
    } catch {
      /* Storage can be disabled. */
    }
    const bootstrapped =
      element.dataset.heroBootstrapped === 'true'
        ? (element.dataset.heroMotion as HeroMotionMode)
        : null;
    const currentPreference = chooseHeroMotion({
      reduced: reduced.matches,
      seen,
      awayFromHero: window.scrollY > 32 || !!location.hash || document.hidden,
    });
    decision.current ??=
      currentPreference === 'settled' || currentPreference === 'reduced'
        ? currentPreference
        : (bootstrapped ?? currentPreference);
    seenInMemory = true;
    try {
      sessionStorage.setItem(HERO_SESSION_KEY, '1');
    } catch {
      /* In-memory fallback above. */
    }
    const initial = decision.current;
    setMode(initial);
    if (initial === 'settled') return;

    let active = true;
    const cleanups: (() => void)[] = [];
    const detach = () => {
      clearTimeout(timeout);
      cleanups.splice(0).forEach((cleanup) => cleanup());
    };
    const settle = (allowAmbient = false) => {
      if (!active) return;
      active = false;
      detach();
      finish.current = () => {};
      setAmbient(
        allowAmbient &&
          initial === 'full' &&
          !reduced.matches &&
          !document.hidden &&
          window.scrollY < 32,
      );
      // Also settle synchronously before focus/click and before a BFCache freeze.
      element.dataset.heroMotion = 'settled';
      setMode('settled');
    };
    finish.current = settle;
    const interrupt = () => settle();
    const listen = (
      target: EventTarget,
      event: string,
      handler: EventListener,
    ) => {
      target.addEventListener(event, handler, { passive: true, capture: true });
      cleanups.push(() => target.removeEventListener(event, handler, true));
    };
    // Reveal before the original interaction proceeds; never prevent scrolling.
    for (const event of [
      'pointerdown',
      'touchstart',
      'wheel',
      'keydown',
      'focusin',
    ]) {
      listen(document, event, interrupt);
    }
    listen(window, 'scroll', interrupt);
    listen(window, 'pagehide', interrupt);
    listen(document, 'visibilitychange', interrupt);
    listen(reduced, 'change', interrupt);
    listen(mobile, 'change', interrupt);
    const image = element.querySelector('img');
    if (image) listen(image, 'error', interrupt);

    // CSS supplies the timeline and normally settles via the last metadata item.
    // This bounded fallback also works when animationend is lost or CSS is disabled.
    const duration =
      initial === 'full'
        ? parseFloat(
            getComputedStyle(element).getPropertyValue('--hero-intro-ms'),
          ) || 3600
        : initial === 'short'
          ? 550
          : 180;
    const started = Number(element.dataset.heroStarted);
    const elapsed = Number.isFinite(started) ? performance.now() - started : 0;
    const timeout = setTimeout(
      () => settle(initial === 'full'),
      Math.max(0, duration - elapsed) + 120,
    );
    return () => {
      active = false;
      detach();
      finish.current = () => {};
    };
  }, []);

  useEffect(() => {
    if (!ambient) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const stop = () => setAmbient(false);
    if (reduced.matches || document.hidden || window.scrollY > 32) {
      stop();
      return;
    }
    const events: [EventTarget, string][] = [
      [window, 'scroll'],
      [window, 'pagehide'],
      [document, 'pointerdown'],
      [document, 'keydown'],
      [document, 'visibilitychange'],
      [reduced, 'change'],
    ];
    for (const [target, event] of events)
      target.addEventListener(event, stop, { passive: true });
    return () => {
      for (const [target, event] of events)
        target.removeEventListener(event, stop);
    };
  }, [ambient]);

  return (
    <section
      ref={hero}
      className="home-hero"
      aria-labelledby="hero-title"
      suppressHydrationWarning
      data-hero-motion={mode}
      data-hero-ambient={ambient ? 'on' : undefined}
      onAnimationEnd={(event) => {
        if (event.animationName === 'tp-hero-breathe') setAmbient(false);
        if (
          event.target instanceof HTMLElement &&
          event.target.hasAttribute('data-hero-finish')
        ) {
          finish.current(true);
        }
      }}
    >
      <script dangerouslySetInnerHTML={{ __html: HERO_BOOTSTRAP }} />
      {children}
      <div className="hero-intro" aria-hidden="true">
        <div className="hero-intro-plane hero-intro-plane-left" />
        <div className="hero-intro-plane hero-intro-plane-right" />
        <div className="hero-intro-plane hero-intro-plane-sill" />
        <div className="hero-intro-brand wordmark">
          tân phong<span>INTERIORS &amp; OBJECTS</span>
        </div>
      </div>
      <noscript>
        <style>{`.home-hero[data-hero-motion] .hero-intro{display:none!important}.home-hero[data-hero-motion] *,.site-header.over-hero{animation:none!important}`}</style>
      </noscript>
    </section>
  );
}
