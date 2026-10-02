/** One cloth in shared-stage coordinates. Width is measured across the curve's
 * normal, never obtained by stretching a landscape image over a tall page. */
export type BreezeFamily = 'mobile' | 'tablet' | 'desktop';
type Point = { x: number; y: number };
export const breezeFamily = (width: number): BreezeFamily =>
  width < 768 ? 'mobile' : width < 1200 ? 'tablet' : 'desktop';
const num = (n: number) => n.toFixed(2);
function curve(points: Point[], move = true) {
  let d = `${move ? 'M' : 'L'}${num(points[0].x)} ${num(points[0].y)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[Math.max(0, i - 1)],
      b = points[i],
      c = points[i + 1],
      e = points[Math.min(points.length - 1, i + 2)];
    d += `C${num(b.x + (c.x - a.x) / 6)} ${num(b.y + (c.y - a.y) / 6)} ${num(c.x - (e.x - b.x) / 6)} ${num(c.y - (e.y - b.y) / 6)} ${num(c.x)} ${num(c.y)}`;
  }
  return d;
}
function drawCloth(spine: Point[], breadth: number, family: BreezeFamily) {
  function fiber(fraction: number) {
    return spine.map((point, i) => {
      const previous = spine[Math.max(0, i - 1)],
        next = spine[Math.min(spine.length - 1, i + 1)];
      const dx = next.x - previous.x,
        dy = next.y - previous.y,
        length = Math.hypot(dx, dy) || 1;
      const fold = (0.45 + 0.55 * Math.abs(Math.cos(i * 1.31))) * breadth;
      const ripple =
        Math.sin(i * 2.3 + fraction * 4.4) *
        breadth *
        0.035 *
        Math.sin(fraction * Math.PI);
      const offset = (fraction - 0.5) * fold + ripple;
      return {
        x: point.x + (dy / length) * offset,
        y: point.y - (dx / length) * offset,
      };
    });
  }
  const outline = curve(fiber(0)) + curve(fiber(1).reverse(), false) + 'Z';
  const folds = Array.from(
    { length: 12 },
    (_, i) =>
      curve(fiber(i / 12)) + curve(fiber((i + 1) / 12).reverse(), false) + 'Z',
  );
  const threads = Array.from({ length: 37 }, (_, i) => curve(fiber(i / 36)));
  return { family, outline, folds, threads };
}
/** Approved static cloth in shared-stage coordinates. Geometry changes only
 * when the viewport is measured; scroll never morphs or stretches its paths. */
export function storyBreezeGeometry(width: number, height: number) {
  const family = breezeFamily(width);
  const mobile = family === 'mobile';
  const openingDistance = height * (mobile ? 0.9 : 1.1);
  const identityHeight = openingDistance + height * (mobile ? 1.94 : 2.04);
  const opening = openingDistance + height * 0.84;
  const identityX =
    family === 'desktop'
      ? [-0.15, 0.75, 0.52, 0.89, 0.27, 1.14]
      : family === 'tablet'
        ? [-0.12, 0.85, 0.6, 0.8, 0.27, 1.14]
        : [1.12, 0.78, 0.84, 0.26, 0.8, 1.14];
  const identityY = [
    -0.039 * opening,
    0.168 * opening,
    0.466 * opening,
    0.776 * opening,
    1.14 * opening,
    identityHeight + (identityHeight - opening) * 0.06,
  ];
  const spine = identityX.map((x, i) => ({
    x: x * width,
    y: identityY[i] - openingDistance,
  }));
  const breadth = Math.min(width * (mobile ? 0.25 : 0.18), 330);
  return {
    ...drawCloth(spine, breadth, family),
    // The same bend becomes the near-camera anchor; no second cloth geometry.
    focus: spine[3],
    breadth,
  };
}
