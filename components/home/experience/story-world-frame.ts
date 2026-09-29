export const clamp = (n: number) => Math.min(1, Math.max(0, n));
export const smooth = (n: number) => {
  const t = clamp(n);
  return t * t * (3 - 2 * t);
};
export const range = (p: number, a: number, b: number) =>
  smooth((p - a) / (b - a));
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;

export const storyWorldTiming = {
  skyStart: 0.52,
  pullbackStart: 0.64,
  pullbackEnd: 0.84,
  breezeOutStart: 0.52,
  breezeOutEnd: 0.64,
  uiStart: 0.74,
  interactive: 0.86,
  settled: 0.88,
} as const;

/** One asymmetric velocity profile: zero at both ends, peak at 25%.
 * Its long deceleration avoids a second zoom or a 1.05 → 1 landing snap. */
export function cameraArrival(value: number) {
  const t = clamp(value);
  return 1 - (1 - t) ** 4 * (1 + 4 * t);
}

/** The oculus is ~20% of the existing plate height. Its real sky requires a
 * bounded crop above 1.24×; one logarithmic move resolves it into the atrium.
 * No alternate sky, duplicated image or independent camera stages. */
export function storyWorldFrame(
  progress: number,
  width: number,
  height: number,
) {
  const p = clamp(progress);
  const mobile = width < 768;
  const depth = mobile ? 0.5 : width < 1200 ? 0.7 : 1;
  const coveredHeight = Math.max(height, width / (1672 / 941));
  const originY = coveredHeight * 0.116;
  const cropScale = Math.min(
    5.8,
    Math.max(4.8, (height * 0.9) / (coveredHeight * 0.18)),
  );
  const end = mobile ? 0.83 : storyWorldTiming.pullbackEnd;
  const pullback = cameraArrival(
    (p - storyWorldTiming.pullbackStart) /
      (end - storyWorldTiming.pullbackStart),
  );
  const scale = p >= end ? 1 : Math.exp(Math.log(cropScale) * (1 - pullback));
  // Proportional translation keeps every viewport edge covered and preserves
  // the photographed oculus as the optical origin throughout the pull-back.
  const imageY = (height * 0.5 - originY) * ((scale - 1) / (cropScale - 1));
  const push = clamp((p - 0.16) / 0.36) ** 2.6;
  const textDeparture = range(p, 0.16, 0.32);
  const departure = range(p, 0.34, 0.46);
  return {
    progress: p,
    storyScale: 1 + 0.06 * depth * push,
    storyY: -height * 0.014 * depth * push,
    textOpacity: (1 - 0.3 * textDeparture) * (1 - departure),
    textY: -10 * textDeparture,
    tpScale: 1 - 0.06 * textDeparture,
    tpY: 16 * textDeparture,
    tpOpacity: (1 - 0.25 * textDeparture) * (1 - departure),
    storyVisible: p < 0.53,
    skyVisible: p > 0.41,
    skyEdge: mix(-35, 145, range(p, 0.41, storyWorldTiming.skyStart)),
    scale,
    originY,
    imageY,
    exposure: range(p, 0.67, 0.84),
    storyLight: 0.03 * range(p, 0.25, 0.46),
    skyLight: 0.055 * range(p, 0.46, 0.53) * (1 - range(p, 0.66, 0.81)),
    headerIvory: p >= 0.66,
    headerSky: p >= 0.5 && p < 0.66,
    headerShade: range(p, 0.63, 0.67) * (1 - range(p, 0.72, 0.84)),
    occlusion: range(p, 0.26, 0.42) * (1 - range(p, 0.49, 0.58)),
    dissolve: range(
      p,
      storyWorldTiming.breezeOutStart,
      storyWorldTiming.breezeOutEnd,
    ),
    inertia: depth * range(p, 0.16, 0.23) * (1 - range(p, 0.8, 0.84)),
  };
}

export const worldRevealStarts = [
  0.74, 0.755, 0.77, 0.785, 0.8, 0.815, 0.835,
] as const;
export function worldContentReveal(p: number, order: number) {
  const start = worldRevealStarts[order] ?? 0.835;
  return range(p, start, start + 0.045);
}

export type CameraPose = {
  storyScale: number;
  storyY: number;
  scale: number;
  imageY: number;
};

/** Only the last 2px / .25% can trail native scroll. Text and hit targets never
 * use this pose. A 32ms time constant finishes the tiny residual in ~180ms. */
export function settleCamera(
  target: CameraPose,
  previous: CameraPose | null,
  elapsed: number,
  strength: number,
) {
  const pose = { ...target };
  let moving = false;
  if (previous && strength > 0) {
    const decay = Math.exp(-Math.max(1, elapsed) / 32);
    for (const key of ['storyScale', 'storyY', 'scale', 'imageY'] as const) {
      const isScale = key === 'scale' || key === 'storyScale';
      const limit = (isScale ? 0.0025 : 2) * strength;
      const offset =
        Math.max(-limit, Math.min(limit, previous[key] - target[key])) * decay;
      if (Math.abs(offset) > (isScale ? 0.00001 : 0.01)) {
        pose[key] += offset;
        moving = true;
      }
    }
  }
  return { pose, moving };
}
