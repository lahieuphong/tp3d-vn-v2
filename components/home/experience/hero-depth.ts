import { motionTier } from '@/lib/motion/capability';
import { approach } from '@/lib/motion/pointer';
import { DURATION } from '@/lib/motion/tokens';
import { range, tpTiming } from './home-story-frame';

/** Scene 1 pointer depth (TP3D PASS 01). Desktop tier only: fine pointer,
 * no reduced motion. The architecture stays put; the TP (mid plane) and the
 * portals (near plane) shift a few pixels against the pointer, so the hero
 * reads deeper rather than moving. Pointer input only sets a target. The
 * HomeStory master owns the one RAF and calls tick() while this wants time. */
export const HERO_DEPTH = {
  /** Pixels at full pointer deflection; the near plane stays under
   * MOTION_LIMITS.parallaxPx (checked by check-hero-depth.mjs). */
  mid: { x: 3, y: 2 },
  near: { x: 6, y: 3.5 },
  /** 3 tau ≈ 660ms: the planes settle within one `normal` duration. */
  tau: DURATION.micro,
  /** Stop once the near plane is within ~0.1px of its target. */
  epsilon: 0.015,
  maxStepMs: 64,
} as const;

/** Scrolling hands depth to the scroll-driven dolly: full pointer depth at
 * rest, none once the TP leaves its Scene 1 hold. Pure function of progress. */
export function heroDepthWeight(progress: number) {
  const t = range(progress, 0, tpTiming.hold);
  return 1 - t * t * (3 - 2 * t);
}

/** Inline transforms for the mid and near planes; '' at rest. */
export function heroDepthFrame(x: number, y: number, weight: number) {
  const plane = ({ x: px, y: py }: { x: number; y: number }) => {
    const dx = -x * px * weight;
    const dy = -y * py * weight;
    return Math.abs(dx) < 0.005 && Math.abs(dy) < 0.005
      ? ''
      : `translate3d(${dx.toFixed(3)}px, ${dy.toFixed(3)}px, 0)`;
  };
  return { mid: plane(HERO_DEPTH.mid), near: plane(HERO_DEPTH.near) };
}

export type HeroDepthInput = {
  progress: number;
  width: number;
  height: number;
  fine: boolean;
  reduced: boolean;
  visible: boolean;
};

export function createHeroDepth(stage: HTMLElement, wake: () => void) {
  const mid = stage.querySelector<HTMLElement>(
    '.sh-monogram > [data-hero-surface]',
  );
  const near = [...stage.querySelectorAll<HTMLElement>('.sh-portal')];
  const html = document.documentElement;
  let capable = false;
  let weight = 0;
  let width = 1;
  let height = 1;
  let x = 0;
  let y = 0;
  let targetX = 0;
  let targetY = 0;
  let last = 0;
  let painted = { mid: '', near: '' };
  // The intro gate releases without a scroll; test it live on input.
  const enabled = () => capable && !html.hasAttribute('data-home-intro');
  const paint = () => {
    const next = heroDepthFrame(x, y, weight);
    if (next.mid !== painted.mid && mid) mid.style.transform = next.mid;
    if (next.near !== painted.near)
      for (const node of near) node.style.transform = next.near;
    painted = next;
  };
  const rest = () => {
    x = y = targetX = targetY = 0;
    last = 0;
    paint();
  };
  const move = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse' || !enabled()) return;
    targetX = Math.max(-1, Math.min(1, (event.clientX / width) * 2 - 1));
    targetY = Math.max(-1, Math.min(1, (event.clientY / height) * 2 - 1));
    wake();
  };
  const leave = () => {
    targetX = targetY = 0;
    wake();
  };
  window.addEventListener('pointermove', move, { passive: true });
  html.addEventListener('pointerleave', leave);
  window.addEventListener('blur', leave);
  return {
    /** Narrative frames: capability, scroll weight and viewport size. */
    update(input: HeroDepthInput) {
      width = Math.max(1, input.width);
      height = Math.max(1, input.height);
      weight = heroDepthWeight(input.progress);
      const next =
        input.visible &&
        weight > 0 &&
        motionTier(input.width, input.fine, input.reduced) === 'desktop';
      if (capable && !next) {
        capable = false;
        rest();
        return;
      }
      capable = next;
      paint();
    },
    /** Pointer frames: ease toward the target on the master's clock. */
    tick(now: number) {
      if (!capable) return;
      const elapsed = Math.min(HERO_DEPTH.maxStepMs, last ? now - last : 16);
      x = approach(x, targetX, elapsed, HERO_DEPTH.tau);
      y = approach(y, targetY, elapsed, HERO_DEPTH.tau);
      const settled =
        Math.abs(x - targetX) < HERO_DEPTH.epsilon &&
        Math.abs(y - targetY) < HERO_DEPTH.epsilon;
      if (settled) {
        x = targetX;
        y = targetY;
        last = 0;
      } else last = now;
      paint();
    },
    wantsTime() {
      return (
        capable &&
        (Math.abs(x - targetX) >= HERO_DEPTH.epsilon ||
          Math.abs(y - targetY) >= HERO_DEPTH.epsilon)
      );
    },
    /** Hidden tab or lost capability: rest at once, no easing. */
    suspend: rest,
    destroy() {
      window.removeEventListener('pointermove', move);
      html.removeEventListener('pointerleave', leave);
      window.removeEventListener('blur', leave);
      if (mid) mid.style.removeProperty('transform');
      for (const node of near) node.style.removeProperty('transform');
      capable = false;
    },
  };
}
