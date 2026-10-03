import { DURATION, cssEase } from '@/lib/motion/tokens';
import { WORLD_PATH } from '@/data/world-building';

/** TP3D PASS 05: the PORTAL into the World. The gateway is a real link; this
 * module only enhances a plain primary activation. One fixed layer (a dim and
 * one circle, both compositor-only: opacity and transform) covers the page in
 * the World ground colour, then the router opens `/world`. The Lobby releases
 * the cover on arrival. No RAF, timer-driven camera, scroll lock or focus
 * trap; every exit path removes the layer and returns to idle. */
export type GatewayState = 'idle' | 'entering' | 'navigating';

export const PORTAL = {
  coverMs: DURATION.cinematic,
  reducedMs: DURATION.micro,
  releaseMs: DURATION.fast,
  /** Above the header (40), below the intro (200). */
  zIndex: 150,
  /** How far the Atrium recedes under the expanding portal. */
  dim: 0.35,
  /** Hand-off safety: release a cover the Lobby did not release itself, and
   * fall back to a document navigation if the client route never arrives. */
  releaseWatchdogMs: 2500,
  navigationWatchdogMs: 4000,
} as const;

type Activation = {
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  defaultPrevented: boolean;
};

/** Only a plain primary activation is enhanced. Modifier clicks, middle
 * clicks and anything already handled keep native link behaviour. Keyboard
 * Enter on a link arrives as a primary click. */
export const isPlainPrimaryActivation = (event: Activation) =>
  !event.defaultPrevented &&
  event.button === 0 &&
  !event.metaKey &&
  !event.ctrlKey &&
  !event.shiftKey &&
  !event.altKey;

/** Radius that covers the viewport from (x, y), with a 2px safety margin. */
export const coverRadius = (x: number, y: number, w: number, h: number) =>
  Math.hypot(Math.max(x, w - x), Math.max(y, h - y)) + 2;

let state: GatewayState = 'idle';
let layer: HTMLElement | null = null;
let animations: Animation[] = [];
let timers: ReturnType<typeof setTimeout>[] = [];
let detach: (() => void) | null = null;
/** Finishes the cover early and crosses (resize, preference change). */
let proceed: (() => void) | null = null;

export const gatewayState = () => state;

const ground = 'var(--world-ground, #1c1712)';

function animate(
  element: HTMLElement,
  keyframes: Keyframe[],
  duration: number,
  easing: string,
) {
  if (typeof element.animate !== 'function') return null;
  const animation = element.animate(keyframes, {
    duration,
    easing,
    fill: 'forwards',
  });
  animations.push(animation);
  return animation;
}

/** Make the cover complete and static (no animation left to finish). */
function cover() {
  if (!layer) return;
  for (const animation of animations) animation.cancel();
  animations = [];
  layer.style.opacity = '1';
  layer.style.background = ground;
  layer.replaceChildren();
}

function cleanup() {
  for (const animation of animations) animation.cancel();
  animations = [];
  for (const timer of timers) clearTimeout(timer);
  timers = [];
  detach?.();
  detach = null;
  proceed = null;
  layer?.remove();
  layer = null;
  state = 'idle';
}

/** Leave the gateway at once: back navigation, pagehide, a failure. */
export function abortWorldPortal() {
  cleanup();
}

/** Called by the Lobby once it has rendered: fade the cover off the matching
 * Lobby ground. A no-op for direct visits. */
export function releaseWorldPortal() {
  if (!layer) {
    state = 'idle';
    return;
  }
  cover();
  // The Lobby opens at its top. The router skips its own scroll reset for a
  // page that begins with a hoisted stylesheet, so the crossing resets it
  // here, under the opaque cover, never visibly.
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  const held = layer;
  for (const timer of timers) clearTimeout(timer);
  timers = [];
  const fade = animate(
    held,
    [{ opacity: 1 }, { opacity: 0 }],
    PORTAL.releaseMs,
    cssEase('primary'),
  );
  if (!fade) return cleanup();
  fade.finished.then(
    () => layer === held && cleanup(),
    () => {},
  );
}

function listen() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  // A changed viewport or preference completes the cover at once and crosses,
  // rather than finishing a circle measured for another layout.
  const settle = () => state === 'entering' && proceed?.();
  const popstate = () => {
    if (window.location.pathname !== WORLD_PATH) cleanup();
  };
  // Leaving the document (the link fallback, a closed tab) removes the cover
  // before the page can be cached; a restored page is checked again.
  const pagehide = () => cleanup();
  const pageshow = (event: PageTransitionEvent) => {
    if (event.persisted) cleanup();
  };
  window.addEventListener('resize', settle);
  window.addEventListener('popstate', popstate);
  window.addEventListener('pagehide', pagehide);
  window.addEventListener('pageshow', pageshow);
  reduced.addEventListener('change', settle);
  return () => {
    window.removeEventListener('resize', settle);
    window.removeEventListener('popstate', popstate);
    window.removeEventListener('pagehide', pagehide);
    window.removeEventListener('pageshow', pageshow);
    reduced.removeEventListener('change', settle);
  };
}

/** Start crossing into the World. Returns false when a crossing is already
 * running (double activation). `origin` is the gateway's visual circle,
 * measured once on activation. */
export function enterWorld({
  origin,
  reduced,
  navigate,
}: {
  origin: { left: number; top: number; width: number; height: number } | null;
  reduced: boolean;
  navigate: () => void;
}) {
  if (state !== 'idle' || typeof document === 'undefined') return false;
  state = 'entering';
  const element = document.createElement('div');
  element.className = 'world-portal';
  element.dataset.worldPortal = '';
  element.setAttribute('aria-hidden', 'true');
  Object.assign(element.style, {
    position: 'fixed',
    inset: '0',
    zIndex: String(PORTAL.zIndex),
    pointerEvents: 'auto',
    overflow: 'hidden',
    contain: 'strict',
  });
  layer = element;
  document.body.appendChild(element);
  detach = listen();

  const cross = () => {
    if (state !== 'entering') return;
    proceed = null;
    cover();
    state = 'navigating';
    // The route never arrived: open the real link. The Lobby never released
    // the cover: reveal it anyway.
    timers.push(
      setTimeout(() => {
        if (window.location.pathname === WORLD_PATH) releaseWorldPortal();
      }, PORTAL.releaseWatchdogMs),
      setTimeout(() => {
        if (window.location.pathname === WORLD_PATH) releaseWorldPortal();
        else window.location.assign(WORLD_PATH);
      }, PORTAL.navigationWatchdogMs),
    );
    try {
      navigate();
    } catch {
      window.location.assign(WORLD_PATH);
    }
  };

  proceed = cross;
  // A cancelled or stalled animation can never strand the cover.
  const crossAnyway = () => state === 'entering' && cross();
  timers.push(setTimeout(crossAnyway, PORTAL.coverMs + 400));

  const width = window.innerWidth;
  const height = window.innerHeight;
  if (reduced || !origin || !origin.width) {
    // Reduced motion: a short, flat cover. No scale, no spatial travel.
    element.style.background = ground;
    element.style.opacity = '0';
    const fade = animate(
      element,
      [{ opacity: 0 }, { opacity: 1 }],
      PORTAL.reducedMs,
      'linear',
    );
    if (!fade) cross();
    else fade.finished.then(cross, crossAnyway);
    return true;
  }

  // The gateway's circular preview expands from its own centre until the
  // viewport is covered; the Atrium recedes slightly beneath it.
  const x = origin.left + origin.width / 2;
  const y = origin.top + origin.height / 2;
  const radius = coverRadius(x, y, width, height);
  const dim = document.createElement('div');
  Object.assign(dim.style, {
    position: 'absolute',
    inset: '0',
    background: ground,
    opacity: '0',
  });
  const circle = document.createElement('div');
  Object.assign(circle.style, {
    position: 'absolute',
    left: `${x - radius}px`,
    top: `${y - radius}px`,
    width: `${radius * 2}px`,
    height: `${radius * 2}px`,
    borderRadius: '50%',
    background: ground,
    transform: `scale(${origin.width / 2 / radius})`,
    willChange: 'transform',
  });
  element.appendChild(dim);
  element.appendChild(circle);
  const easing = cssEase('cinematic');
  animate(
    dim,
    [{ opacity: 0 }, { opacity: PORTAL.dim }],
    PORTAL.coverMs,
    easing,
  );
  const expand = animate(
    circle,
    [
      { transform: `scale(${origin.width / 2 / radius})` },
      { transform: 'scale(1)' },
    ],
    PORTAL.coverMs,
    easing,
  );
  if (!expand) cross();
  else expand.finished.then(cross, crossAnyway);
  return true;
}
