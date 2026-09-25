export type SpatialScene = 'discovery' | 'story';
export type SpatialPhase =
  | SpatialScene
  | 'transitioningToStory'
  | 'transitioningToDiscovery';
export type SpatialHeroController = {
  destroy: () => void;
  setPaused: (paused: boolean) => void;
  showScene: (scene: SpatialScene) => void;
};

export const SPATIAL_HERO_DURATION = 20_000;
const EASE = 'cubic-bezier(.4, 0, .2, 1)';
const BOUNDARIES = [8000, 9000, 10_000, 16_000, 17_800, 20_000];

export function spatialPhase(time: number): SpatialPhase {
  const phase =
    ((time % SPATIAL_HERO_DURATION) + SPATIAL_HERO_DURATION) %
    SPATIAL_HERO_DURATION;
  if (phase < 8000) return 'discovery';
  if (phase < 10_000) return 'transitioningToStory';
  if (phase < 16_000) return 'story';
  return 'transitioningToDiscovery';
}

/** Every visual shares this clock. A background switch only occurs behind the
 * expanded textile veil; the monogram/ribbon never disappear between scenes. */
export function spatialTracks(compact: boolean, hasStoryImage: boolean) {
  const track = (selector: string, entries: [number, Keyframe][]) => ({
    selector,
    frames: entries.map(([milliseconds, values]) => ({
      offset: milliseconds / SPATIAL_HERO_DURATION,
      easing: EASE,
      ...values,
    })),
  });
  const copy = (opacity: number, y = 0, scale = 1): Keyframe => ({
    opacity,
    transform: `translate3d(0, ${y}px, 0) scale(${scale})`,
  });
  const tracks = [
    track('.sh-discovery', [
      [0, copy(1)],
      [8000, copy(1)],
      [8750, copy(0, -8, 0.985)],
      [18_300, copy(0, 8, 0.995)],
      [19_300, copy(1)],
      [20_000, copy(1)],
    ]),
    track('.sh-portals', [
      [0, copy(1)],
      [8000, copy(1)],
      [8550, copy(0, compact ? 12 : 25)],
      [18_350, copy(0, compact ? 12 : 25)],
      [19_650, copy(1)],
      [20_000, copy(1)],
    ]),
    track('.sh-story', [
      [0, copy(0, 10)],
      [9300, copy(0, 10)],
      [10_000, copy(1)],
      [16_000, copy(1)],
      [16_650, copy(0, -8, 0.99)],
      [19_000, copy(0, 10)],
      [20_000, copy(0, 10)],
    ]),
    track('.sh-center-copy', [
      [0, copy(0, 8)],
      [9500, copy(0, 8)],
      [10_350, copy(1)],
      [16_000, copy(1)],
      [17_050, copy(0, 0, 0.94)],
      [19_000, copy(0, 8)],
      [20_000, copy(0, 8)],
    ]),
    track('.sh-monogram', [
      [0, { transform: 'translate3d(0, 0, 0) scale(1) rotateY(0deg)' }],
      [
        8000,
        { transform: 'translate3d(0, -2px, 0) scale(1.008) rotateY(0deg)' },
      ],
      [
        10_000,
        {
          transform: `translate3d(0, var(--sh-monogram-story-y, ${compact ? '4svh' : '15svh'}), 0) scale(var(--sh-monogram-story-scale, ${compact ? '.85' : '.82'})) rotateY(${compact ? 0 : 0.9}deg)`,
        },
      ],
      [
        16_000,
        {
          transform: `translate3d(0, var(--sh-monogram-story-y, ${compact ? '4svh' : '15svh'}), 0) scale(var(--sh-monogram-story-scale, ${compact ? '.85' : '.82'})) rotateY(${compact ? 0 : 0.9}deg)`,
        },
      ],
      [
        17_800,
        {
          transform: `translate3d(0, 0, 0) scale(1.035) rotateY(${compact ? 0 : -0.5}deg)`,
        },
      ],
      [19_700, { transform: 'translate3d(0, 0, 0) scale(1) rotateY(0deg)' }],
      [20_000, { transform: 'translate3d(0, 0, 0) scale(1) rotateY(0deg)' }],
    ]),
    track('.sh-ribbon', [
      [
        0,
        {
          transform: 'translate3d(0, 0, 0) rotate(0deg) scale(1)',
          opacity: 0.86,
        },
      ],
      [
        6500,
        {
          transform: 'translate3d(1%, -1%, 0) rotate(1deg) scale(1.012)',
          opacity: 0.93,
        },
      ],
      [
        9000,
        {
          transform: `translate3d(-3%, 0, 0) rotate(${compact ? 0 : -4}deg) scale(${compact ? 1.07 : 1.16})`,
          opacity: 1,
        },
      ],
      [
        10_600,
        {
          transform: 'translate3d(-1%, 1%, 0) rotate(-1deg) scale(1.02)',
          opacity: 0.86,
        },
      ],
      [
        15_700,
        {
          transform: 'translate3d(0, 0, 0) rotate(0deg) scale(1.01)',
          opacity: 0.94,
        },
      ],
      [
        17_800,
        {
          transform: `translate3d(2%, -2%, 0) rotate(${compact ? 0 : 3}deg) scale(${compact ? 1.06 : 1.12})`,
          opacity: 1,
        },
      ],
      [
        19_700,
        {
          transform: 'translate3d(0, 0, 0) rotate(0deg) scale(1)',
          opacity: 0.86,
        },
      ],
      [
        20_000,
        {
          transform: 'translate3d(0, 0, 0) rotate(0deg) scale(1)',
          opacity: 0.86,
        },
      ],
    ]),
    track('.sh-veil', [
      [0, { opacity: 0, transform: 'translate3d(-12%, 6%, 0) scale(.8)' }],
      [8150, { opacity: 0, transform: 'translate3d(-12%, 6%, 0) scale(.8)' }],
      [8850, { opacity: 1, transform: 'translate3d(0, 0, 0) scale(1.1)' }],
      [9200, { opacity: 1, transform: 'translate3d(1%, -1%, 0) scale(1.1)' }],
      [
        10_050,
        { opacity: 0, transform: 'translate3d(10%, -8%, 0) scale(1.04)' },
      ],
      [16_700, { opacity: 0, transform: 'translate3d(0, 14%, 0) scale(.8)' }],
      [17_650, { opacity: 1, transform: 'translate3d(0, 0, 0) scale(1.1)' }],
      [18_000, { opacity: 1, transform: 'translate3d(2%, -3%, 0) scale(1.1)' }],
      [
        19_000,
        { opacity: 0, transform: 'translate3d(12%, -12%, 0) scale(1.04)' },
      ],
      [20_000, { opacity: 0, transform: 'translate3d(-12%, 6%, 0) scale(.8)' }],
    ]),
  ];
  if (!compact)
    tracks.push(
      track('.sh-leaves', [
        [0, { transform: 'translate3d(0, 0, 0) rotate(0deg)' }],
        [8000, { transform: 'translate3d(3px, -7px, 0) rotate(1.5deg)' }],
        [14_000, { transform: 'translate3d(-2px, 4px, 0) rotate(-1deg)' }],
        [20_000, { transform: 'translate3d(0, 0, 0) rotate(0deg)' }],
      ]),
    );
  if (hasStoryImage)
    tracks.push(
      track('[data-hero-layer="architecture-b"]', [
        [0, { opacity: 0 }],
        [9000, { opacity: 0, easing: 'steps(1, end)' }],
        [9001, { opacity: 1 }],
        [17_800, { opacity: 1, easing: 'steps(1, end)' }],
        [17_801, { opacity: 0 }],
        [20_000, { opacity: 0 }],
      ]),
    );
  return tracks;
}

/** No render loop: WAAPI owns interpolation, one timeout observes the next scene
 * boundary, and at most one RAF batches pointer input. Every resource is owned
 * by this mount, including the delayed secondary image request. */
export function mountSpatialHero(element: HTMLElement): SpatialHeroController {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const compact = window.matchMedia('(max-width: 1023px)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const discovery = element.querySelector<HTMLElement>('.sh-discovery');
  const story = element.querySelector<HTMLElement>('.sh-story');
  const portals = element.querySelector<HTMLElement>('.sh-portals');
  const centerCopy = element.querySelector<HTMLElement>('.sh-center-copy');
  const header = document.querySelector<HTMLElement>(
    '.sh-header, .site-header',
  );
  const primary = element.querySelector<HTMLImageElement>(
    '[data-hero-layer="architecture-a"] img',
  );
  const deferred = [
    ...element.querySelectorAll<HTMLImageElement>('img[data-hero-deferred]'),
  ];
  const supportsMotion =
    typeof element.animate === 'function' &&
    typeof IntersectionObserver !== 'undefined';
  const parallaxLayers = [
    ['[data-hero-layer="architecture-a"]', 2],
    ['[data-hero-layer="architecture-b"]', 2],
    ['.sh-monogram', 5],
    ['.sh-ribbon', 7],
    ['.sh-leaves', 8],
  ].flatMap(([selector, amount]) => {
    const node = element.querySelector<HTMLElement>(
      `${selector} [data-hero-parallax]`,
    );
    return node
      ? [{ node, amount: Number(amount), rotate: selector === '.sh-monogram' }]
      : [];
  });

  let disposed = false;
  let primaryReady = !primary;
  let secondaryStarted = false;
  let secondarySettled = deferred.length === 0;
  let secondaryUsable = deferred.length > 0;
  let failed = !supportsMotion;
  let ratio = 0;
  let pageHidden = false;
  let manualPaused = false;
  let requestedScene: SpatialScene | null = null;
  let pointerHeld = false;
  let focusHeld = false;
  let interactionPaused = false;
  let animations: Animation[] = [];
  let savedTime = 0;
  let playing = false;
  let boundaryTimer = 0;
  let interactionTimer = 0;
  let firstPaint = 0;
  let secondPaint = 0;
  let pointerFrame = 0;
  let pointerX = 0;
  let pointerY = 0;
  let bounds: DOMRect | null = null;
  const imageListeners: {
    image: HTMLImageElement;
    load: () => void;
    error: () => void;
  }[] = [];
  const settled = new Set<HTMLImageElement>();

  const time = () => {
    const current = animations[0]?.currentTime;
    return typeof current === 'number'
      ? current % SPATIAL_HERO_DURATION
      : savedTime;
  };
  const expose = (node: HTMLElement | null, visible: boolean) => {
    if (!node) return;
    // Keyboard interaction normally pauses before a boundary. Preserve focus
    // even if the browser delivers a focus event at the same instant as it.
    if (!visible && node.contains(document.activeElement)) return;
    node.inert = !visible;
    node.setAttribute('aria-hidden', String(!visible));
  };
  const markScene = (at: number, staticView = false) => {
    const phase = staticView ? 'discovery' : spatialPhase(at);
    element.dataset.scene = phase;
    // New links enter the accessibility tree only once their fade has finished.
    expose(discovery, phase === 'discovery');
    expose(portals, phase === 'discovery');
    expose(story, phase === 'story');
    expose(centerCopy, phase === 'story');
  };
  const resetPointer = () => {
    if (pointerFrame) cancelAnimationFrame(pointerFrame);
    pointerFrame = 0;
    bounds = null;
    for (const { node } of parallaxLayers) {
      for (const property of ['--sh-x', '--sh-y', '--sh-rx', '--sh-ry'])
        node.style.removeProperty(property);
    }
  };
  const clearBoundary = () => {
    window.clearTimeout(boundaryTimer);
    boundaryTimer = 0;
  };
  const pause = () => {
    savedTime = time();
    for (const animation of animations) {
      animation.pause();
      animation.currentTime = savedTime;
    }
    playing = false;
    clearBoundary();
  };
  const cancel = () => {
    pause();
    animations.forEach((animation) => animation.cancel());
    animations = [];
  };
  const scheduleBoundary = () => {
    clearBoundary();
    if (!playing || disposed) return;
    const at = time();
    markScene(at);
    const next =
      BOUNDARIES.find((boundary) => boundary > at + 1) ?? SPATIAL_HERO_DURATION;
    boundaryTimer = window.setTimeout(
      scheduleBoundary,
      Math.max(12, next - at + 2),
    );
  };
  const create = () => {
    try {
      for (const { selector, frames } of spatialTracks(
        compact.matches,
        secondaryUsable,
      )) {
        const target = element.querySelector<HTMLElement>(selector);
        if (!target) continue;
        const animation = target.animate(frames, {
          duration: SPATIAL_HERO_DURATION,
          iterations: Infinity,
          fill: 'both',
          easing: 'linear',
        });
        animation.pause();
        animation.currentTime = savedTime;
        animations.push(animation);
      }
    } catch {
      failed = true;
      cancel();
    }
  };
  const sync = () => {
    if (disposed) return;
    if (failed || reduced.matches || !primaryReady || !secondarySettled) {
      cancel();
      // Keep the complete discovery fallback on screen while assets decode,
      // but remember a visitor's scene choice for the first ready frame.
      if (failed || reduced.matches) requestedScene = null;
      savedTime =
        requestedScene === 'story'
          ? 12_000
          : requestedScene === 'discovery'
            ? 6000
            : 0;
      element.dataset.motion = 'static';
      markScene(0, true);
      resetPointer();
      return;
    }
    const visible = ratio > 0.01 && !document.hidden && !pageHidden;
    const shouldPlay = visible && !manualPaused && !interactionPaused;
    if (!animations.length && visible) {
      create();
    }
    if (animations.length) requestedScene = null;
    if (failed) {
      element.dataset.motion = 'static';
      markScene(0, true);
      return;
    }
    if (!shouldPlay) {
      pause();
      element.dataset.motion = 'paused';
      markScene(savedTime);
      if (!visible) resetPointer();
      return;
    }
    if (!playing && animations.length) {
      const now = document.timeline?.currentTime;
      for (const animation of animations) {
        animation.currentTime = savedTime;
        animation.play();
        // Set the same start time, avoiding drift between independently created tracks.
        if (typeof now === 'number') animation.startTime = now - savedTime;
      }
      playing = true;
      scheduleBoundary();
    }
    element.dataset.motion = 'playing';
  };
  const observeImage = (image: HTMLImageElement, isPrimary: boolean) => {
    const resolve = async (loaded: boolean) => {
      if (disposed || (!isPrimary && settled.has(image))) return;
      if (loaded) {
        try {
          await image.decode();
        } catch {
          /* Natural dimensions decide whether the image is usable. */
        }
      }
      if (disposed) return;
      const usable = loaded && image.complete && image.naturalWidth > 0;
      if (isPrimary) primaryReady = usable;
      else {
        settled.add(image);
        secondaryUsable &&= usable;
        secondarySettled = settled.size === deferred.length;
        element.dataset.storyImage = secondaryUsable ? 'ready' : 'fallback';
      }
      sync();
    };
    const load = () => {
      void resolve(true);
    };
    const error = () => {
      void resolve(false);
    };
    image.addEventListener('load', load);
    image.addEventListener('error', error);
    imageListeners.push({ image, load, error });
    if (image.complete && image.getAttribute('src'))
      void resolve(image.naturalWidth > 0);
  };
  const startSecondary = () => {
    if (disposed || secondaryStarted || reduced.matches) return;
    secondaryStarted = true;
    for (const image of deferred) {
      observeImage(image, false);
      if (image.getAttribute('src')) continue;
      const source = image.dataset.src;
      if (!source) {
        settled.add(image);
        secondaryUsable = false;
        secondarySettled = settled.size === deferred.length;
        element.dataset.storyImage = 'fallback';
        continue;
      }
      image.fetchPriority = 'low';
      image.loading = 'eager';
      image.sizes = image.dataset.sizes ?? '100vw';
      if (image.dataset.srcset) image.srcset = image.dataset.srcset;
      image.src = source;
    }
    sync();
  };
  const queueSecondary = () => {
    if (
      disposed ||
      secondaryStarted ||
      reduced.matches ||
      firstPaint ||
      secondPaint
    )
      return;
    // Two one-shot frames give the priority architecture a first paint before
    // requesting Scene B. This is not an animation/render loop.
    firstPaint = requestAnimationFrame(() => {
      firstPaint = 0;
      secondPaint = requestAnimationFrame(() => {
        secondPaint = 0;
        startSecondary();
      });
    });
  };
  const interactive = (target: EventTarget | null) => {
    if (!(target instanceof Element)) return false;
    const control = target.closest(
      'a, button, input, select, textarea, summary, [role="button"]',
    );
    if (!control || control.hasAttribute('data-hero-control')) return false;
    if (element.contains(control) || header?.contains(control)) return true;
    // Search and mobile navigation are portalled outside the shared header.
    return [
      ...document.querySelectorAll<HTMLElement>(
        '.search-dialog, .mobile-sheet',
      ),
    ].some((dialog) => dialog.contains(control));
  };
  const updateInteraction = () => {
    window.clearTimeout(interactionTimer);
    interactionTimer = 0;
    if (pointerHeld || focusHeld) {
      interactionPaused = true;
      sync();
    } else if (interactionPaused) {
      interactionTimer = window.setTimeout(() => {
        interactionTimer = 0;
        interactionPaused = false;
        sync();
      }, 1400);
    }
  };
  const pointerOver = (event: PointerEvent) => {
    if (event.pointerType === 'touch') return;
    pointerHeld = interactive(event.target);
    updateInteraction();
  };
  const pointerOut = (event: PointerEvent) => {
    if (event.pointerType === 'touch') return;
    pointerHeld = interactive(event.relatedTarget);
    updateInteraction();
  };
  const focusIn = (event: FocusEvent) => {
    focusHeld = interactive(event.target);
    updateInteraction();
  };
  const focusOut = (event: FocusEvent) => {
    focusHeld = interactive(event.relatedTarget);
    updateInteraction();
  };
  const pointerDown = (event: PointerEvent) => {
    if (!interactive(event.target)) return;
    interactionPaused = true;
    sync();
    updateInteraction();
  };
  const pointerMove = (event: PointerEvent) => {
    if (
      disposed ||
      manualPaused ||
      ratio <= 0.01 ||
      document.hidden ||
      pageHidden ||
      reduced.matches ||
      !finePointer.matches ||
      event.pointerType === 'touch'
    )
      return;
    bounds ??= element.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    pointerX = Math.max(
      -1,
      Math.min(1, ((event.clientX - bounds.left) / bounds.width) * 2 - 1),
    );
    pointerY = Math.max(
      -1,
      Math.min(1, ((event.clientY - bounds.top) / bounds.height) * 2 - 1),
    );
    if (pointerFrame) return;
    pointerFrame = requestAnimationFrame(() => {
      pointerFrame = 0;
      if (disposed) return;
      for (const { node, amount, rotate } of parallaxLayers) {
        node.style.setProperty('--sh-x', `${(pointerX * amount).toFixed(2)}px`);
        node.style.setProperty('--sh-y', `${(pointerY * amount).toFixed(2)}px`);
        if (rotate) {
          node.style.setProperty(
            '--sh-rx',
            `${(-pointerY * 0.8).toFixed(2)}deg`,
          );
          node.style.setProperty(
            '--sh-ry',
            `${(pointerX * 1.2).toFixed(2)}deg`,
          );
        }
      }
    });
  };
  const mediaChange = () => {
    cancel();
    resetPointer();
    queueSecondary();
    sync();
  };
  const pageHide = () => {
    pageHidden = true;
    sync();
  };
  const pageShow = () => {
    pageHidden = false;
    // A BFCache restore may restore a different scroll position. Wait for a
    // fresh intersection report rather than playing against a stale ratio.
    ratio = 0;
    intersection?.unobserve(element);
    intersection?.observe(element);
    sync();
  };
  const visibility = () => {
    sync();
  };
  const intersection = supportsMotion
    ? new IntersectionObserver(
        (entries) => {
          const entry = entries[entries.length - 1];
          ratio = entry?.isIntersecting ? entry.intersectionRatio : 0;
          sync();
        },
        { threshold: [0, 0.01, 0.1] },
      )
    : null;

  markScene(0, true);
  element.dataset.motion = 'static';
  if (primary) observeImage(primary, true);
  queueSecondary();
  intersection?.observe(element);
  reduced.addEventListener('change', mediaChange);
  compact.addEventListener('change', mediaChange);
  finePointer.addEventListener('change', resetPointer);
  document.addEventListener('visibilitychange', visibility);
  document.addEventListener('pointerover', pointerOver, { passive: true });
  document.addEventListener('pointerout', pointerOut, { passive: true });
  document.addEventListener('pointerdown', pointerDown, { passive: true });
  document.addEventListener('focusin', focusIn);
  document.addEventListener('focusout', focusOut);
  element.addEventListener('pointermove', pointerMove, { passive: true });
  element.addEventListener('pointerleave', resetPointer);
  window.addEventListener('scroll', resetPointer, { passive: true });
  window.addEventListener('resize', resetPointer, { passive: true });
  window.addEventListener('pagehide', pageHide);
  window.addEventListener('pageshow', pageShow);
  focusHeld = interactive(document.activeElement);
  if (focusHeld) updateInteraction();

  return {
    setPaused(paused) {
      if (disposed) return;
      manualPaused = paused;
      if (paused) resetPointer();
      sync();
    },
    showScene(scene) {
      if (disposed || reduced.matches) return;
      const leaving =
        scene === 'story' ? [discovery, portals] : [story, centerCopy];
      if (leaving.some((node) => node?.contains(document.activeElement)))
        return;
      pause();
      manualPaused = true;
      requestedScene = scene;
      savedTime = scene === 'discovery' ? 6000 : 12_000;
      for (const animation of animations) animation.currentTime = savedTime;
      sync();
    },
    destroy() {
      if (disposed) return;
      disposed = true;
      cancel();
      resetPointer();
      window.clearTimeout(interactionTimer);
      cancelAnimationFrame(firstPaint);
      cancelAnimationFrame(secondPaint);
      intersection?.disconnect();
      reduced.removeEventListener('change', mediaChange);
      compact.removeEventListener('change', mediaChange);
      finePointer.removeEventListener('change', resetPointer);
      document.removeEventListener('visibilitychange', visibility);
      document.removeEventListener('pointerover', pointerOver);
      document.removeEventListener('pointerout', pointerOut);
      document.removeEventListener('pointerdown', pointerDown);
      document.removeEventListener('focusin', focusIn);
      document.removeEventListener('focusout', focusOut);
      element.removeEventListener('pointermove', pointerMove);
      element.removeEventListener('pointerleave', resetPointer);
      window.removeEventListener('scroll', resetPointer);
      window.removeEventListener('resize', resetPointer);
      window.removeEventListener('pagehide', pageHide);
      window.removeEventListener('pageshow', pageShow);
      for (const { image, load, error } of imageListeners) {
        image.removeEventListener('load', load);
        image.removeEventListener('error', error);
      }
      element.dataset.motion = 'static';
      markScene(0, true);
    },
  };
}
