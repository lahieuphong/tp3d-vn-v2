/** A native-scroll controller. There is no clock, autoplay, smoothing loop or
 * animation library: one requested frame applies the latest scroll position. */
export type SpatialPhase = 'discovery' | 'transition' | 'story';
export type SpatialHeroController = { destroy: () => void };
export const clampProgress = (value: number) => Math.max(0, Math.min(1, value));
const range = (p: number, start: number, end: number) =>
  clampProgress((p - start) / (end - start));
const ease = (value: number) => value * value * (3 - 2 * value);
export function spatialPhase(progress: number): SpatialPhase {
  return progress <= 0.25
    ? 'discovery'
    : progress >= 0.85
      ? 'story'
      : 'transition';
}

/** Pure, reversible samples; the same position always produces the same frame. */
export function spatialFrame(
  progress: number,
  compact: boolean,
  storyReady: boolean,
) {
  const p = clampProgress(progress);
  const departure = ease(range(p, 0.25, 0.5));
  const reveal = ease(range(p, 0.52, 0.82));
  const depth = ease(range(p, 0, 0.85));
  const architecture = storyReady ? ease(range(p, 0.32, 0.7)) : 0;
  const move = (x: number, y: number, scale = 1) =>
    `translate3d(${x.toFixed(3)}px, ${y.toFixed(3)}px, 0) scale(${scale.toFixed(5)})`;
  const opacity = (value: number) => value.toFixed(5);
  return {
    '.sh-welcome-en': {
      opacity: opacity(1 - departure),
      transform: move(-30 * departure, -10 * departure, 1 - 0.015 * departure),
    },
    '.sh-welcome-vi': {
      opacity: opacity(1 - departure),
      transform: move(30 * departure, -10 * departure, 1 - 0.015 * departure),
    },
    '.sh-discovery-axis': {
      opacity: opacity(1 - departure),
      transform: move(0, -12 * depth),
    },
    '.sh-portals': {
      opacity: opacity(1 - departure),
      transform: move(
        0,
        (compact ? 72 : 96) * departure + 8 * Math.min(p, 0.25),
        1 - 0.03 * departure,
      ),
    },
    '.sh-story': {
      opacity: opacity(reveal),
      transform: move(0, 18 * (1 - reveal)),
    },
    '.sh-center-copy': {
      opacity: opacity(reveal),
      transform: move(0, 12 * (1 - reveal)),
    },
    '.sh-monogram': {
      transform: `translate3d(calc(var(--sh-monogram-story-x, 0px) * ${depth}), calc(var(--sh-monogram-story-y) * ${depth}), 0) scale(calc(1 + (var(--sh-monogram-story-scale) - 1) * ${depth})) rotateY(${compact ? 0 : depth}deg)`,
    },
    '.sh-leaves': {
      transform: move(compact ? 0 : 12 * depth, compact ? 0 : -42 * depth),
    },
    '[data-hero-layer="architecture-a"]': {
      opacity: opacity(1 - architecture),
      transform: move(-6 * depth, -4 * depth, 1 + 0.03 * depth),
    },
    '[data-hero-layer="architecture-b"]': {
      opacity: opacity(architecture),
      transform: move(6 * (1 - depth), 4 * (1 - depth), 1.03 - 0.03 * depth),
    },
    '.sh-scroll-indicator': { opacity: opacity(1 - range(p, 0, 0.15)) },
  } satisfies Record<string, Partial<CSSStyleDeclaration>>;
}

export function mountSpatialHero(element: HTMLElement): SpatialHeroController {
  const owner =
    element.closest<HTMLElement>('[data-story-world-sequence]') ?? element;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const compact = window.matchMedia('(max-width: 1199px)');
  const stage =
    element.querySelector<HTMLElement>('.sh-plane') ??
    element.querySelector<HTMLElement>('.sh-stage')!;
  const header = document.querySelector<HTMLElement>('.site-header');
  const discovery = element.querySelector<HTMLElement>('.sh-discovery');
  const story = element.querySelector<HTMLElement>('.sh-story');
  const portals = element.querySelector<HTMLElement>('.sh-portals');
  const secondary = element.querySelector<HTMLImageElement>(
    'img[data-hero-deferred]',
  );
  const layers = Object.keys(spatialFrame(0, false, false)).map((selector) => ({
    node: element.querySelector<HTMLElement>(selector),
    selector,
  }));
  let disposed = false;
  let frame = 0;
  let firstPaint = 0;
  let secondPaint = 0;
  let measureNeeded = true;
  let top = 0;
  let distance = 1;
  let stageHeight = 0;
  let ready = false;
  let secondaryStarted = false;
  let lastProgress = -1;
  let lastReduced: boolean | null = null;
  let lastCompact: boolean | null = null;
  let lastReady: boolean | null = null;
  const expose = (node: HTMLElement | null, visible: boolean) => {
    if (!node) return;
    // Never make a focused link inert. Pointer/keyboard activation can complete;
    // focusout updates its accessibility state without trapping the scroll.
    const hidden = !visible && !node.contains(document.activeElement);
    if (node.inert !== hidden) node.inert = hidden;
    if (node.getAttribute('aria-hidden') !== String(hidden))
      node.setAttribute('aria-hidden', String(hidden));
  };
  const update = () => {
    frame = 0;
    if (disposed || document.hidden) return;
    // All layout reads precede writes and occur only on mount/resize, never on
    // normal scroll frames. Native scrollY is the only per-scroll input.
    if (measureNeeded) {
      const bounds = owner.getBoundingClientRect();
      top = bounds.top + window.scrollY;
      stageHeight = stage.offsetHeight;
      // Discovery hands its existing nodes to Story at the end of this range.
      distance = Math.max(
        1,
        element.querySelector<HTMLElement>('[data-opening-range]')
          ?.offsetHeight ?? bounds.height - stageHeight,
      );
      measureNeeded = false;
    }
    // The entry overlay owns the first view until its panels are gone, even
    // if another script changes scrollY while the temporary scroll lock is on.
    const held =
      document.documentElement.getAttribute('data-home-intro') !== null;
    const p = held ? 0 : clampProgress((window.scrollY - top) / distance);
    const still = reduced.matches;
    const overOpening =
      held ||
      window.scrollY <
        top + (still ? stageHeight : distance + stageHeight) - 100;
    if (header && header.dataset.opening !== (overOpening ? 'active' : 'past'))
      header.dataset.opening = overOpening ? 'active' : 'past';
    expose(discovery, still || p < 0.5);
    expose(portals, still || p < 0.48);
    expose(story, still || p >= 0.65);
    if (
      p === lastProgress &&
      still === lastReduced &&
      compact.matches === lastCompact &&
      ready === lastReady
    )
      return;
    lastProgress = p;
    lastReduced = still;
    lastCompact = compact.matches;
    lastReady = ready;
    element.dataset.motion = still ? 'reduced' : 'scroll';
    element.dataset.scene = still ? 'discovery' : spatialPhase(p);
    element.dataset.progress = p.toFixed(4);
    const values = spatialFrame(p, compact.matches, ready);
    for (const { node, selector } of layers) {
      if (!node) continue;
      for (const [property, value] of Object.entries(
        values[selector as keyof typeof values],
      )) {
        if (still)
          node.style.removeProperty(
            property.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`),
          );
        else if (node.style[property as keyof CSSStyleDeclaration] !== value)
          Object.assign(node.style, { [property]: value });
      }
    }
  };
  const schedule = () => {
    if (!disposed && !document.hidden && !frame)
      frame = requestAnimationFrame(update);
  };
  const scroll = () => {
    const held =
      document.documentElement.getAttribute('data-home-intro') !== null;
    const p = held ? 0 : clampProgress((window.scrollY - top) / distance);
    const past =
      !held &&
      window.scrollY >=
        top + (reduced.matches ? stageHeight : distance + stageHeight) - 100;
    // Once released, scrolling the rest of Home does not repaint the opening.
    if (
      !measureNeeded &&
      p === lastProgress &&
      (p === 0 || p === 1) &&
      header?.dataset.opening === (past ? 'past' : 'active')
    )
      return;
    schedule();
  };
  const resize = () => {
    measureNeeded = true;
    lastProgress = -1;
    queueSecondary();
    schedule();
  };
  const visibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else resize();
  };
  const imageSettled = async () => {
    if (!secondary || disposed) return;
    if (secondary.naturalWidth) {
      try {
        await secondary.decode();
      } catch {
        /* Dimensions decide fallback. */
      }
    }
    if (disposed) return;
    ready = secondary.complete && secondary.naturalWidth > 0;
    element.dataset.storyImage = ready ? 'ready' : 'fallback';
    schedule();
  };
  const startSecondary = () => {
    if (!secondary || disposed || secondaryStarted || reduced.matches) return;
    secondaryStarted = true;
    secondary.addEventListener('load', imageSettled);
    secondary.addEventListener('error', imageSettled);
    if (!secondary.getAttribute('src')) {
      secondary.sizes = secondary.dataset.sizes ?? '100vw';
      secondary.srcset = secondary.dataset.srcset ?? '';
      secondary.src = secondary.dataset.src ?? '';
    }
    if (secondary.complete) void imageSettled();
  };
  // Yield the priority Scene A its first paint, then request the appropriate B
  // srcset. This is two one-shot frames, unrelated to motion or scene timing.
  const queueSecondary = () => {
    if (
      disposed ||
      reduced.matches ||
      secondaryStarted ||
      firstPaint ||
      secondPaint
    )
      return;
    firstPaint = requestAnimationFrame(() => {
      firstPaint = 0;
      secondPaint = requestAnimationFrame(() => {
        secondPaint = 0;
        startSecondary();
      });
    });
  };
  queueSecondary();
  const observer = new ResizeObserver(resize);
  observer.observe(element);
  if (owner !== element) observer.observe(owner);
  observer.observe(stage);
  window.addEventListener('scroll', scroll, { passive: true });
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('pageshow', resize);
  document.addEventListener('visibilitychange', visibility);
  element.addEventListener('focusout', schedule);
  reduced.addEventListener('change', resize);
  compact.addEventListener('change', resize);
  update();
  return {
    destroy() {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(frame);
      cancelAnimationFrame(firstPaint);
      cancelAnimationFrame(secondPaint);
      observer.disconnect();
      window.removeEventListener('scroll', scroll);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pageshow', resize);
      document.removeEventListener('visibilitychange', visibility);
      element.removeEventListener('focusout', schedule);
      reduced.removeEventListener('change', resize);
      compact.removeEventListener('change', resize);
      secondary?.removeEventListener('load', imageSettled);
      secondary?.removeEventListener('error', imageSettled);
      if (header) delete header.dataset.opening;
    },
  };
}
