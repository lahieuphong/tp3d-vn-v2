export const clamp = (n: number) => Math.min(1, Math.max(0, n));
export const smooth = (n: number) => {
  const t = clamp(n);
  return t * t * (3 - 2 * t);
};
export const range = (p: number, a: number, b: number) =>
  smooth((p - a) / (b - a));
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** Resolve the camera, then the cloth, then the UI. The remaining scroll
 * belongs to a completely still composition before native sticky release. */
export const storyWorldTiming = {
  pullbackStart: 0.58,
  pullbackEnd: 0.72,
  breezeOutStart: 0.72,
  breezeOutEnd: 0.78,
  uiStart: 0.78,
  settled: 0.86,
} as const;

/** Pure native-scroll samples. The only sky is the top of the atrium plate.
 * Its oculus is 20% of image height: the sky crop necessarily exceeds 1.25×.
 * Resolve that crop first, then complete the restrained 1.24× camera pull-back.
 * No aperture, duplicate photograph, layout animation or accumulated state. */
export function storyWorldFrame(
  progress: number,
  width: number,
  height: number,
) {
  const p = clamp(progress);
  const portrait = width / height < 1;
  const mobile = width < 768;
  const coveredHeight = Math.max(height, width / (1672 / 941));
  const originY = coveredHeight * 0.116;
  const cropScale = Math.min(
    5.8,
    Math.max(4.8, (height * 0.9) / (coveredHeight * 0.18)),
  );
  const cropReturn = range(
    p,
    storyWorldTiming.pullbackStart,
    portrait ? 0.68 : 0.69,
  );
  const pullback = range(
    p,
    storyWorldTiming.pullbackStart,
    storyWorldTiming.pullbackEnd,
  );
  const cameraScale = mobile
    ? 1.08
    : portrait
      ? 1.12
      : width < 1200
        ? 1.18
        : 1.24;
  const scale =
    p >= storyWorldTiming.pullbackEnd
      ? 1
      : mix(cropScale, cameraScale, cropReturn) *
        mix(1, 1 / cameraScale, pullback);
  const push = range(p, 0.18, 0.36);
  const departure = range(p, 0.36, 0.48);
  const occlusion = range(p, 0.28, 0.43) * (1 - range(p, 0.52, 0.6));
  return {
    progress: p,
    storyScale: 1 + 0.055 * push,
    storyY: -height * 0.015 * push,
    textOpacity: (1 - 0.35 * push) * (1 - departure),
    textY: -10 * push,
    tpScale: 1 - 0.06 * push,
    tpY: 16 * push,
    tpOpacity: (1 - 0.25 * push) * (1 - departure),
    storyVisible: p < 0.54,
    skyVisible: p > 0.425,
    // A full-frame diagonal wipe follows the foreground fabric. Its soft edge
    // stays underneath the cloth; it never reveals a floating bounded shape.
    skyEdge: mix(-35, 145, range(p, 0.425, 0.53)),
    scale,
    originY,
    imageY: (height * 0.5 - originY) * (1 - cropReturn),
    exposure: range(p, 0.64, storyWorldTiming.pullbackEnd),
    headerIvory: p >= 0.64,
    headerShade:
      range(p, 0.6, 0.64) * (1 - range(p, 0.66, storyWorldTiming.pullbackEnd)),
    occlusion,
    emerge: range(p, 0.56, 0.71),
    dissolve: range(
      p,
      storyWorldTiming.breezeOutStart,
      storyWorldTiming.breezeOutEnd,
    ),
  };
}

export const worldRevealStarts = [
  0.78, 0.785, 0.79, 0.8, 0.81, 0.82, 0.83,
] as const;
export function worldContentReveal(p: number, order: number) {
  const start = worldRevealStarts[order] ?? 0.83;
  return range(p, start, start + 0.03);
}
