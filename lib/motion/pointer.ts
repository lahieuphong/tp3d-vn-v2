import { MOTION_QUERIES } from './capability';

/** Frame-rate independent exponential approach: two 8ms steps land where one
 * 16ms step does. `tau` is the time constant in ms (63% of the gap per tau). */
export function approach(
  current: number,
  target: number,
  elapsed: number,
  tau: number,
) {
  if (tau <= 0 || elapsed <= 0) return elapsed > 0 ? target : current;
  return target + (current - target) * Math.exp(-elapsed / tau);
}

export type PointerFollowerOptions = {
  /** Time constant in ms. Larger is calmer. */
  tau?: number;
  /** Settled when both axes are this close to the target. */
  epsilon?: number;
  /** Longest step after a stalled or throttled frame, in ms. */
  maxStepMs?: number;
};

/** Normalised mouse position over `element` (−1…1 on each axis), eased toward
 * the pointer in one RAF that stops as soon as it settles; there is no
 * permanent loop. Touch and pen never drive it, and it stays at rest for
 * coarse pointers or reduced motion. Leaving the element eases back to 0.
 * `onFrame` should write transforms/custom properties only. Returns cleanup. */
export function createPointerFollower(
  element: HTMLElement,
  onFrame: (x: number, y: number) => void,
  { tau = 160, epsilon = 0.001, maxStepMs = 64 }: PointerFollowerOptions = {},
) {
  const allowed = window.matchMedia(MOTION_QUERIES.pointerMotion);
  let rect: DOMRect | null = null;
  let frame = 0;
  let last = 0;
  let x = 0;
  let y = 0;
  let targetX = 0;
  let targetY = 0;
  const step = (now: number) => {
    const elapsed = Math.min(maxStepMs, last ? now - last : 16);
    last = now;
    x = approach(x, targetX, elapsed, tau);
    y = approach(y, targetY, elapsed, tau);
    if (Math.abs(x - targetX) < epsilon && Math.abs(y - targetY) < epsilon) {
      x = targetX;
      y = targetY;
      frame = 0;
      last = 0;
    } else frame = requestAnimationFrame(step);
    onFrame(x, y);
  };
  const start = () => {
    if (!frame) frame = requestAnimationFrame(step);
  };
  const move = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse' || !allowed.matches) return;
    // Layout is read once per hover, not per pointermove.
    rect ??= element.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    targetX = Math.max(
      -1,
      Math.min(1, ((event.clientX - rect.left) / rect.width) * 2 - 1),
    );
    targetY = Math.max(
      -1,
      Math.min(1, ((event.clientY - rect.top) / rect.height) * 2 - 1),
    );
    start();
  };
  const leave = () => {
    rect = null;
    targetX = targetY = 0;
    start();
  };
  /** Capability lost (or a hidden tab): rest immediately, no easing. */
  const rest = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    last = 0;
    rect = null;
    x = y = targetX = targetY = 0;
    onFrame(0, 0);
  };
  const invalidate = () => {
    rect = null;
  };
  const visibility = () => {
    if (document.hidden) rest();
  };
  element.addEventListener('pointermove', move, { passive: true });
  element.addEventListener('pointerleave', leave);
  element.addEventListener('pointercancel', leave);
  window.addEventListener('scroll', invalidate, {
    passive: true,
    capture: true,
  });
  window.addEventListener('resize', invalidate, { passive: true });
  document.addEventListener('visibilitychange', visibility);
  allowed.addEventListener('change', rest);
  return () => {
    cancelAnimationFrame(frame);
    frame = 0;
    element.removeEventListener('pointermove', move);
    element.removeEventListener('pointerleave', leave);
    element.removeEventListener('pointercancel', leave);
    window.removeEventListener('scroll', invalidate, { capture: true });
    window.removeEventListener('resize', invalidate);
    document.removeEventListener('visibilitychange', visibility);
    allowed.removeEventListener('change', rest);
  };
}
