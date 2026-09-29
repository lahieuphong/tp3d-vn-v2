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
export function breezeGeometry(
  width: number,
  height: number,
  worldsTop = height * 0.66,
) {
  const w = Math.max(1, width),
    h = Math.max(1, height);
  const family = breezeFamily(w);
  const xs =
    family === 'desktop'
      ? [-0.15, 0.75, 0.52, 0.89, 0.27, 1.14]
      : family === 'tablet'
        ? [-0.12, 0.85, 0.6, 0.8, 0.27, 1.14]
        : [1.12, 0.78, 0.84, 0.26, 0.8, 1.14];
  // Opening control points are anchored to the opening's measured length,
  // not stretched when later content is removed. The final two points belong
  // to Worlds, ending at the lower right before the footer. No old scene slots.
  const opening = Math.min(h * 0.8, Math.max(1, worldsTop));
  const remaining = h - opening;
  const ys = [
    -0.039 * opening,
    0.168 * opening,
    0.466 * opening,
    0.776 * opening,
    opening * 1.14,
    h + remaining * 0.06,
  ];
  const spine = xs.map((x, i) => ({ x: x * w, y: ys[i] }));
  const breadth = Math.min(w * (family === 'mobile' ? 0.25 : 0.18), 330);
  return drawCloth(spine, breadth, family);
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
/** Bounded, reversible movement sampled by the existing native scroll loop. */
export function breezePose(
  scrollY: number,
  top: number,
  height: number,
  viewport: number,
  width: number,
  reduced = false,
) {
  const progress = clamp((scrollY - top) / Math.max(1, height));
  const amplitude = width < 768 ? 3 : width < 1200 ? 5 : 8;
  const release = clamp(
    (scrollY + viewport * 0.25 - (top + height - viewport * 0.28)) /
      Math.max(1, viewport * 0.28),
  );
  const exit = release * release * (3 - 2 * release);
  return {
    progress,
    x: reduced
      ? 0
      : Math.sin(progress * Math.PI * 2) * amplitude + exit * amplitude,
    y: reduced
      ? 0
      : -Math.sin(progress * Math.PI) * amplitude * 1.5 + exit * amplitude,
    opacity: 1 - exit,
  };
}

/** Key states belong to the same spline. The Story path converges into the
 * photographic aperture and becomes an oculus-to-reflection route. */
export function portalBreezeGeometry(
  width: number,
  height: number,
  trackTop: number,
  stage: number,
  span: number,
  progress: number,
) {
  const p = clamp(progress);
  const family = breezeFamily(width);
  const mobile = family === 'mobile';
  const ease = (t: number) => {
    const v = clamp(t);
    return v * v * (3 - 2 * v);
  };
  const converge = ease((p - 0.25) / 0.29),
    emerge = ease((p - 0.55) / 0.43);
  const opening = trackTop + stage * 0.84;
  const yBase = trackTop + span * p;
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
    height + (height - opening) * 0.06,
  ];
  const apertureY = 0.54 - 0.39 * ease((p - 0.5) / 0.4);
  const intoX = [0.94, 0.8, 0.63, 0.46, 0.46, 0.5];
  const intoY = [-0.22, 0.02, 0.22, 0.38, apertureY + 0.035, apertureY];
  const worldX = mobile
    ? [0.5, 0.68, 0.74, 0.86, 0.92, 0.96]
    : [0.5, 0.65, 0.62, 0.56, 0.74, 0.93];
  const worldY = [0.055, 0.15, 0.32, 0.46, 0.65, 0.84];
  const mix = (a: number, b: number, t: number) => a + (b - a) * t;
  const spine = oldX.map((x, i) => ({
    x: mix(
      mix(x * width, intoX[i] * width, converge),
      worldX[i] * width,
      emerge,
    ),
    y: mix(
      mix(oldY[i], yBase + intoY[i] * stage, converge),
      yBase + worldY[i] * stage,
      emerge,
    ),
  }));
  const breadth =
    Math.min(width * (mobile ? 0.25 : 0.18), 330) *
    mix(1, mobile ? 0.57 : 0.68, converge) *
    mix(1, 0.92, emerge);
  const taper = [1, 1, 1, 1, 1, 1].map((v, i) =>
    mix(
      mix(v, [1, 1, 0.9, 0.6, 0.25, 0.01][i], converge),
      [0.01, 0.95, 0.66, 0.7, 0.45, 0.01][i],
      emerge,
    ),
  );
  return drawCloth(spine, breadth, family, taper);
}
