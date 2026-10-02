/** Scroll is the only clock. Keeping the bridge mapping pure makes reverse
 * travel, quick flicks and a restored scroll position sample the same frame. */
export const SKY_BRIDGE = {
  preload: 0.3,
  start: 0.5,
  end: 0.745,
  activeStart: 0.055,
  activeEnd: 0.91,
  cameraStart: 8,
  cameraEnd: -2.2,
  pixelBudget: 2_800_000,
  tabletPixelBudget: 1_600_000,
} as const;

const unit = (value: number) => Math.max(0, Math.min(1, value));
const range = (value: number, start: number, end: number) =>
  unit((value - start) / (end - start));
const ease = (value: number) => value * value * (3 - 2 * value);

export type SkyTier = 'fallback' | 'tablet' | 'desktop';

export function skyTier(
  width: number,
  fine: boolean,
  reduced: boolean,
): SkyTier {
  if (reduced || width < 768) return 'fallback';
  return width < 1200 || !fine ? 'tablet' : 'desktop';
}

export function skyPixelRatio(
  width: number,
  height: number,
  deviceRatio: number,
  tier: Exclude<SkyTier, 'fallback'>,
) {
  const cap = tier === 'desktop' ? 1.5 : 1.25;
  const budget =
    tier === 'desktop' ? SKY_BRIDGE.pixelBudget : SKY_BRIDGE.tabletPixelBudget;
  return Math.min(
    cap,
    Math.max(1, deviceRatio),
    Math.sqrt(budget / Math.max(1, width * height)),
  );
}

export function atmosphericSkyFrame(master: number) {
  const progress = range(master, SKY_BRIDGE.start, SKY_BRIDGE.end);
  const travel = ease(range(progress, 0.15, 0.88));
  const formation = ease(range(progress, 0.1, 0.45));
  const clearing = ease(range(progress, 0.66, 0.9));
  return {
    progress,
    active:
      progress > SKY_BRIDGE.activeStart && progress < SKY_BRIDGE.activeEnd,
    cameraZ:
      SKY_BRIDGE.cameraStart +
      (SKY_BRIDGE.cameraEnd - SKY_BRIDGE.cameraStart) * travel,
    cameraX: 0.14 * Math.sin(progress * Math.PI) * travel,
    cameraY: 0.1 * Math.sin(progress * Math.PI),
    density: formation * (1 - clearing),
    inside:
      ease(range(progress, 0.38, 0.5)) *
      (1 - ease(range(progress, 0.61, 0.75))),
    skyMix: ease(range(progress, 0.5, 0.76)),
    // This controls a noisy spatial coverage threshold, not canvas opacity.
    // At the unchanged DOM swap (.64 / local .5714), every pixel is covered.
    skyCover: ease(range(progress, 0.25, 0.5)),
    opening: ease(range(progress, 0.68, 0.9)),
    drift: progress * 0.085,
  };
}

export type AtmosphericSkyFrame = ReturnType<typeof atmosphericSkyFrame>;
