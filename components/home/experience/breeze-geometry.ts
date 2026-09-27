/** One cloth in document coordinates. Width is measured across the curve's
 * normal, never obtained by stretching a landscape image over a tall page. */
export type BreezeFamily = 'mobile' | 'tablet' | 'desktop';
type Point = { x: number; y: number };
export const breezeFamily = (width: number): BreezeFamily =>
  width < 768 ? 'mobile' : width < 1200 ? 'tablet' : 'desktop';
const clamp = (n: number) => Math.min(1, Math.max(0, n));
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
export function breezeGeometry(width: number, height: number) {
  const w = Math.max(1, width),
    h = Math.max(1, height);
  const family = breezeFamily(w);
  const xs =
    family === 'desktop'
      ? [-0.15, 0.75, 0.52, 0.89, 0.27, 0.8, 0.28, 0.84, 1.15]
      : family === 'tablet'
        ? [-0.12, 0.85, 0.6, 0.8, 0.27, 0.82, 0.3, 0.75, 1.12]
        : [1.12, 0.78, 0.84, 0.26, 0.8, 0.24, 0.79, 0.3, -0.14];
  const ys = [-0.015, 0.065, 0.18, 0.3, 0.44, 0.59, 0.74, 0.89, 1.025];
  const spine = xs.map((x, i) => ({ x: x * w, y: ys[i] * h }));
  const breadth = Math.min(w * (family === 'mobile' ? 0.25 : 0.18), 330);
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
/** Bounded, reversible movement sampled by the existing native scroll loop. */
export function breezePose(
  scrollY: number,
  top: number,
  height: number,
  viewport: number,
  width: number,
  reduced = false,
) {
  const progress = clamp((scrollY - top) / Math.max(1, height - viewport));
  const amplitude = width < 768 ? 3 : width < 1200 ? 5 : 8;
  return {
    progress,
    x: reduced ? 0 : Math.sin(progress * Math.PI * 2) * amplitude,
    y: reduced ? 0 : -Math.sin(progress * Math.PI) * amplitude * 1.5,
  };
}
