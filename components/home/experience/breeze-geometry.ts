/** One cloth in shared-stage coordinates. Width is measured across the curve's
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
function drawCloth(
  spine: Point[],
  breadth: number,
  family: BreezeFamily,
  taper?: number[],
) {
  function fiber(fraction: number) {
    return spine.map((point, i) => {
      const previous = spine[Math.max(0, i - 1)],
        next = spine[Math.min(spine.length - 1, i + 1)];
      const dx = next.x - previous.x,
        dy = next.y - previous.y,
        length = Math.hypot(dx, dy) || 1;
      const fold =
        (0.45 + 0.55 * Math.abs(Math.cos(i * 1.31))) *
        breadth *
        (taper?.[i] ?? 1);
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
/** The same cloth goes from Story midground to a camera-close billow, then
 * recedes through the skylight. Coordinates are local to the shared stage. */
export function bridgeBreezeGeometry(
  width: number,
  height: number,
  openingDistance: number,
  progress: number,
) {
  const p = clamp(progress);
  const family = breezeFamily(width);
  const mobile = family === 'mobile';
  const ease = (n: number) => {
    const t = clamp(n);
    return t * t * (3 - 2 * t);
  };
  const mix = (a: number, b: number, t: number) => a + (b - a) * t;
  const approach = ease((p - 0.28) / 0.15);
  const emerge = ease((p - 0.56) / 0.15);
  const sweep = ease((p - 0.425) / 0.105);
  const travel = ease((p - 0.65) / 0.08);
  const legacyHeight = openingDistance + height * (mobile ? 1.94 : 2.04);
  const opening = openingDistance + height * 0.84;
  const oldX =
    family === 'desktop'
      ? [-0.15, 0.75, 0.52, 0.89, 0.27, 1.14]
      : family === 'tablet'
        ? [-0.12, 0.85, 0.6, 0.8, 0.27, 1.14]
        : [1.12, 0.78, 0.84, 0.26, 0.8, 1.14];
  const oldY = [
    -0.039 * opening,
    0.168 * opening,
    0.466 * opening,
    0.776 * opening,
    1.14 * opening,
    legacyHeight + (legacyHeight - opening) * 0.06,
  ];
  // A diagonal, folded sheet passes across the camera, not an opaque panel.
  const veilX = [0.39, 0.32, 0.49, 0.57, 0.67, 0.82].map(
    (x) => x + sweep * 1.45 - 0.55,
  );
  const veilY = [-0.48, -0.08, 0.22, 0.53, 0.88, 1.45];
  const worldX = mobile
    ? [0.5, 0.67, 0.74, 0.79, 0.86, 0.9]
    : [0.5, 0.64, 0.65, 0.57, 0.73, 0.87];
  const worldY = [0.065, 0.17, 0.34, 0.49, 0.66, mobile ? 0.73 : 0.81];
  const spine = oldX.map((x, i) => ({
    x: mix(
      mix(x * width, veilX[i] * width, approach),
      mix(0.5, worldX[i], 0.6 + 0.4 * travel) * width,
      emerge,
    ),
    y: mix(
      mix(oldY[i] - openingDistance, veilY[i] * height, approach),
      mix(0.06, worldY[i], 0.68 + 0.32 * travel) * height,
      emerge,
    ),
  }));
  const originalBreadth = Math.min(width * (mobile ? 0.25 : 0.18), 330);
  const breadth = mix(
    mix(originalBreadth, width * (mobile ? 1.1 : 1.16), approach),
    originalBreadth * (mobile ? 0.6 : 0.7),
    ease((p - 0.52) / 0.14),
  );
  const taper = [1, 1, 1, 1, 1, 1].map((v, i) =>
    mix(
      mix(v, [0.8, 1.08, 1.38, 1.36, 1.24, 0.9][i], approach),
      [0.005, 0.7, 0.8, 0.7, 0.38, 0.005][i],
      emerge,
    ),
  );
  return drawCloth(spine, breadth, family, taper);
}
