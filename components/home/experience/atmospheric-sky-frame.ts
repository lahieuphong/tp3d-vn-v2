/** Scroll is the only narrative clock. Camera, density, swap coverage and the
 * sky opening stay pure functions of master progress, so reverse travel,
 * quick flicks and a restored position sample the same narrative frame.
 * Time enters only through the separately integrated ambient state below,
 * which evolves the air but never moves the camera. */
export const SKY_BRIDGE = {
  // Scroll intent (the TP starts travelling). Early enough for the lazy chunk
  // and shader prewarm to finish before a quick reader reaches the bridge.
  preload: 0.12,
  start: 0.5,
  end: 0.745,
  activeStart: 0.055,
  activeEnd: 0.91,
  // Before cloud formation every plane is fully transparent, so a warm-up
  // that finishes here may still take over this crossing invisibly.
  armBefore: 0.1,
  cameraStart: 8,
  cameraEnd: -2.2,
} as const;

const unit = (value: number) => Math.max(0, Math.min(1, value));
const range = (value: number, start: number, end: number) =>
  unit((value - start) / (end - start));
const ease = (value: number) => value * value * (3 - 2 * value);

export type SkyTier = 'fallback' | 'mobile' | 'tablet' | 'desktop';
export type SkyProfile = (typeof SKY_TIERS)[Exclude<SkyTier, 'fallback'>];

/** Restrained, capability-hinted modes. No benchmarking: viewport, pointer,
 * reduced motion, Save-Data and successful context creation decide. */
export const SKY_TIERS = {
  desktop: {
    clouds: [0, 1, 2],
    octaves: 3,
    dprCap: 1.5,
    pixelBudget: 2_800_000,
    life: 1,
    morph: 1,
    ambientFrameMs: 1000 / 30,
  },
  tablet: {
    clouds: [0, 1],
    octaves: 2,
    dprCap: 1.25,
    pixelBudget: 1_600_000,
    life: 0.85,
    morph: 1,
    ambientFrameMs: 1000 / 30,
  },
  // One cloud bank plus sky at CSS resolution. No domain warp and slower air.
  mobile: {
    clouds: [1],
    octaves: 2,
    dprCap: 1,
    pixelBudget: 560_000,
    life: 0.6,
    morph: 0,
    ambientFrameMs: 1000 / 24,
  },
} as const;

export function skyTier(
  width: number,
  fine: boolean,
  reduced: boolean,
  saveData = false,
): SkyTier {
  if (reduced) return 'fallback';
  if (width < 768) return saveData ? 'fallback' : 'mobile';
  return width < 1200 || !fine ? 'tablet' : 'desktop';
}

export function skyPixelRatio(
  width: number,
  height: number,
  deviceRatio: number,
  tier: Exclude<SkyTier, 'fallback'>,
) {
  const { dprCap, pixelBudget } = SKY_TIERS[tier];
  return Math.min(
    dprCap,
    Math.max(1, deviceRatio),
    Math.sqrt(pixelBudget / Math.max(1, width * height)),
  );
}

export function atmosphericSkyFrame(master: number) {
  const progress = range(master, SKY_BRIDGE.start, SKY_BRIDGE.end);
  const travel = ease(range(progress, 0.15, 0.88));
  const formation = ease(range(progress, 0.1, 0.45));
  const clearing = ease(range(progress, 0.66, 0.9));
  const opening = ease(range(progress, 0.68, 0.9));
  const active =
    progress > SKY_BRIDGE.activeStart && progress < SKY_BRIDGE.activeEnd;
  return {
    progress,
    active,
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
    // Small windows of drawn sky inside the atmosphere. Colour only: canvas
    // coverage is unchanged, so neither world shows through them.
    patches:
      1 *
      ease(range(progress, 0.42, 0.52)) *
      (1 - ease(range(progress, 0.6, 0.7))),
    opening,
    drift: progress * 0.085,
    // How alive the air is at this narrative position. It peaks in the
    // suspension and settles as banks recede into open sky. It scales
    // integrated rates only, so changing it can never make clouds jump.
    life: active
      ? ease(range(progress, 0.12, 0.46)) *
        (1 - 0.45 * ease(range(progress, 0.5, 0.76))) *
        (1 - 0.5 * opening)
      : 0,
  };
}

export type AtmosphericSkyFrame = ReturnType<typeof atmosphericSkyFrame>;

/** Micro motion: the air keeps living while scroll rests. Rates are apparent
 * screen speeds, integrated per frame, so the narrative frame never moves. */
export const AMBIENT = {
  // The Breeze leaves toward the upper right (≈30° above horizontal). Clouds
  // share that current. A unit vector, so drift rates are exact.
  wind: [Math.cos(0.53), Math.sin(0.53)],
  // Viewport heights per second at full life: far, mid, near cloud banks.
  planeDrift: [0.0035, 0.005, 0.007],
  // The distant sky field drifts slowest.
  skyDrift: 0.0025,
  // A stalled frame advances at most one ~24 fps step.
  maxStepMs: 42,
  // Longer gaps (hidden tab, paused bridge, long task) resume without a jump.
  resumeGapMs: 250,
} as const;

export type AmbientState = {
  time: number;
  sky: readonly [number, number];
  planes: readonly (readonly [number, number])[];
};

export const createAmbient = (): AmbientState => ({
  time: 0,
  sky: [0, 0],
  planes: AMBIENT.planeDrift.map(() => [0, 0] as const),
});

/** Seconds of ambient time for a wall-clock gap. */
export function ambientStep(elapsedMs: number) {
  return elapsedMs > 0 && elapsedMs <= AMBIENT.resumeGapMs
    ? Math.min(elapsedMs, AMBIENT.maxStepMs) / 1000
    : 0;
}

/** `spans` are each cloud plane's visible height in its own noise domain, so
 * a bank the camera is close to does not appear to race across the lens. */
export function advanceAmbient(
  state: AmbientState,
  seconds: number,
  life: number,
  spans: readonly number[],
): AmbientState {
  const rate = seconds * unit(life);
  if (!rate) return state;
  const [wx, wy] = AMBIENT.wind;
  return {
    time: state.time + rate,
    sky: [
      state.sky[0] + wx * AMBIENT.skyDrift * rate,
      state.sky[1] + wy * AMBIENT.skyDrift * rate,
    ],
    planes: state.planes.map(([x, y], index) => {
      const step = AMBIENT.planeDrift[index] * (spans[index] ?? 0) * rate;
      return [x + wx * step, y + wy * step] as const;
    }),
  };
}
