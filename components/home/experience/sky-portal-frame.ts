export const clamp = (n: number) => Math.min(1, Math.max(0, n));
export const smooth = (n: number) => {
  const t = clamp(n);
  return t * t * (3 - 2 * t);
};
export const range = (p: number, a: number, b: number) =>
  smooth((p - a) / (b - a));

/** The oculus occupies the upper centre of the existing 1672 × 941 plate.
 * Work in covered-image coordinates, so portrait crops keep the same skylight. */
export function skyPortalFrame(
  progress: number,
  width: number,
  height: number,
) {
  const p = clamp(progress);
  const mobile = width < 768;
  const aperture = range(p, 0.22, 0.52);
  const expansion = range(p, 0.5, 0.88);
  const pullback = range(p, 0.58, 1);
  const centerY = height * (0.54 - 0.39 * range(p, 0.5, 0.9));
  const centerX = width * 0.5;
  const coveredHeight = Math.max(height, width / (1672 / 941));
  const closeupScale =
    1 +
    (mobile ? 0.055 : 0.16) * (1 - pullback) +
    (mobile ? 0.28 : 0.69) * (1 - range(p, 0.55, 0.76));
  // At first appearance, show the actual ring and branches within the small
  // opening, rather than a featureless magnified patch of blue sky.
  const scale = 0.16 + (closeupScale - 0.16) * aperture;
  // Translate the actual oculus into the aperture, then return the entire
  // photograph to its approved object-position as the aperture fills the view.
  const desiredImageY = (centerY - coveredHeight * 0.115) * (1 - pullback);
  const startX = width * (mobile ? 0.09 : 0.055);
  const startY = height * (mobile ? 0.085 : 0.045);
  const rx =
    (startX +
      (width * (mobile ? 0.38 : 0.35) - startX) * aperture +
      width * 1.25 * expansion) *
    range(p, 0.2, 0.28);
  const ry =
    (startY +
      (height * (mobile ? 0.2 : 0.21) - startY) * aperture +
      height * 1.25 * expansion) *
    range(p, 0.2, 0.28);
  // Once the mask reaches the top, the photograph must cover it too. Without
  // this bound a translating photo exposes a horizontal strip of its backing.
  const imageY = Math.min(
    desiredImageY,
    Math.max(0, centerY - ry) + (scale - 1) * height * 0.115,
  );
  return {
    progress: p,
    centerX,
    centerY,
    rx,
    ry,
    scale,
    imageY,
    departure: range(p, 0.35, 0.6),
    tpDeparture: range(p, 0.34, 0.62),
    headerIvory: p >= 0.68,
    clothConverge: range(p, 0.25, 0.54),
    clothEmerge: range(p, 0.55, 0.98),
  };
}

export function skyContentReveal(progress: number, order: number) {
  return range(progress, 0.75 + order * 0.023, 0.865 + order * 0.023);
}
