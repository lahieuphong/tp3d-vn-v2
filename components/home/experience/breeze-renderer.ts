import { bridgeBreezeGeometry } from './breeze-geometry';
import { range, storyWorldFrame } from './story-world-frame';
export type BreezeDriver = {
  measure: (
    width: number,
    height: number,
    opening: number,
    top: number,
  ) => void;
  paint: (scrollY: number, reduced: boolean, progress: number) => void;
  destroy: () => void;
};

/** Two depth projections of one cloth definition. No independent clock and no
 * DOM creation on scroll. Mobile paints only the front projection. */
export function createBreezeRenderer(root: HTMLElement): BreezeDriver {
  const svgs = [...root.querySelectorAll<SVGSVGElement>('[data-breeze-svg]')];
  const poses = [...root.querySelectorAll<SVGUseElement>('[data-breeze-pose]')];
  const outline = root.querySelector<SVGPathElement>('[data-breeze-outline]');
  const folds = [
    ...root.querySelectorAll<SVGPathElement>('[data-breeze-fold]'),
  ];
  const threads = [
    ...root.querySelectorAll<SVGPathElement>('[data-breeze-thread]'),
  ];
  const canopy = root.querySelector<SVGEllipseElement>('[data-breeze-canopy]');
  const rim = root.querySelector<SVGPathElement>('[data-breeze-rim]');
  const silk = [...root.querySelectorAll<SVGStopElement>('#cb-silk stop')];
  const front = [
    ...root.querySelectorAll<SVGStopElement>(
      '[data-breeze-depth="front"] stop',
    ),
  ];
  const back = [
    ...root.querySelectorAll<SVGStopElement>('[data-breeze-depth="back"] stop'),
  ];
  const nodes = [
    ...svgs,
    ...poses,
    ...folds,
    ...threads,
    ...silk,
    ...front,
    ...back,
    ...(outline ? [outline] : []),
    ...(canopy ? [canopy] : []),
    ...(rim ? [rim] : []),
  ];
  const saved = nodes.map((node) => ({
    node,
    attributes: [
      'd',
      'transform',
      'opacity',
      'viewBox',
      'stop-opacity',
      'stop-color',
      'cx',
      'cy',
      'rx',
      'ry',
    ].map((name) => [name, node.getAttribute(name)] as const),
  }));
  const originalSilk = silk.map((stop) =>
    Number(stop.getAttribute('stop-opacity') ?? 1),
  );
  let width = 1,
    height = 1,
    opening = 0,
    top = 0,
    lastGeometry = '',
    lastPose = '';
  return {
    measure(w, h, approach, ownerTop) {
      width = w;
      height = h;
      opening = approach;
      top = ownerTop;
      for (const svg of svgs)
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      lastGeometry = '';
      lastPose = '';
    },
    paint(scroll, reduced, progress) {
      if (reduced) return;
      const p = progress;
      const state = storyWorldFrame(p, width, height);
      const geometryKey =
        p <= 0.28 ? 'story' : p >= 0.92 ? 'settled' : p.toFixed(5);
      if (geometryKey !== lastGeometry) {
        lastGeometry = geometryKey;
        const geometry = bridgeBreezeGeometry(width, height, opening, p);
        root.dataset.breezeFamily = geometry.family;
        outline?.setAttribute('d', geometry.outline);
        folds.forEach((node, i) => node.setAttribute('d', geometry.folds[i]));
        threads.forEach((node, i) =>
          node.setAttribute('d', geometry.threads[i]),
        );
        const depth = range(p, 0.28, 0.4);
        front.forEach((stop, i) => {
          const start = i === 2 || i === 3 ? 0 : 255;
          const value = Math.round(start + (255 - start) * depth);
          stop.setAttribute('stop-color', `rgb(${value} ${value} ${value})`);
          back[i]?.setAttribute(
            'stop-color',
            `rgb(${255 - value} ${255 - value} ${255 - value})`,
          );
        });
        // The fabric becomes optically denser near the lens, retaining its
        // folds and translucent edges instead of using blur or a white overlay.
        silk.forEach((stop, i) =>
          stop.setAttribute(
            'stop-opacity',
            String(
              originalSilk[i] +
                ((i === 0 || i === silk.length - 1 ? 0.5 : 0.96) -
                  originalSilk[i]) *
                  state.occlusion,
            ),
          ),
        );
      }
      const arrival = Math.max(0, opening - Math.max(0, scroll - top));
      const approach = range(p, 0.28, 0.43) * (1 - state.emerge);
      const sx =
        1 + approach * (width < 1200 ? 0.09 : 0.14) + state.dissolve * 0.12;
      const sy = 1 + approach * 0.06 - state.dissolve * 0.22;
      const x = state.dissolve * width * 0.025;
      const y = arrival + state.dissolve * height * 0.025;
      const transform = `translate(${x.toFixed(2)} ${y.toFixed(2)}) translate(${width * 0.55} ${height * 0.5}) rotate(${(-2 * approach).toFixed(3)}) scale(${sx.toFixed(5)} ${sy.toFixed(5)}) translate(${-width * 0.55} ${-height * 0.5})`;
      const opacity = (1 - state.dissolve).toFixed(5);
      const signature = `${transform}/${opacity}/${p}`;
      if (signature === lastPose) return;
      lastPose = signature;
      poses.forEach((node, i) => {
        node.setAttribute('transform', transform);
        node.setAttribute('opacity', i === 0 && p >= 0.4 ? '0' : opacity);
      });
      // A feathered tree silhouette partitions the same cloth: the lower tail
      // reappears over the reflected floor. No extra tree image is mounted.
      const canopyAmount = range(p, 0.69, 0.8);
      canopy?.setAttribute('cx', String(width * 0.505));
      canopy?.setAttribute('cy', String(height * 0.45));
      canopy?.setAttribute('rx', String(width * 0.11 * canopyAmount));
      canopy?.setAttribute('ry', String(height * 0.17 * canopyAmount));
      // Occlude only the cloth where the photographed skylight rim sits. This
      // never clips the Worlds image or acts as a transition aperture.
      if (rim && width >= 768) {
        const imageHeight = Math.max(height, width / (1672 / 941));
        const imageWidth = imageHeight * (1672 / 941);
        const cx = width * 0.5;
        const cy = state.originY + state.imageY;
        const ring = (rx: number, ry: number, dy: number) => {
          const x = imageWidth * rx * state.scale;
          const y = imageHeight * ry * state.scale;
          const center = cy + imageHeight * dy * state.scale;
          return `M${cx - x} ${center}a${x} ${y} 0 1 0 ${x * 2} 0a${x} ${y} 0 1 0 ${-x * 2} 0Z`;
        };
        rim.setAttribute(
          'd',
          ring(0.32, 0.165, 0.055) + ring(0.235, 0.107, 0.005),
        );
        rim.setAttribute(
          'opacity',
          String(range(p, 0.66, 0.71) * (1 - range(p, 0.77, 0.84))),
        );
      }
    },
    destroy() {
      for (const { node, attributes } of saved)
        for (const [name, value] of attributes) {
          if (value === null) node.removeAttribute(name);
          else node.setAttribute(name, value);
        }
      delete root.dataset.breezeFamily;
    },
  };
}
