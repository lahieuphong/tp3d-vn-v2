import { bridgeBreezeGeometry } from './breeze-geometry';
import { range, storyWorldFrame, storyWorldTiming } from './story-world-frame';
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
      const p = Math.min(progress, storyWorldTiming.breezeOutEnd);
      const state = storyWorldFrame(p, width, height);
      const geometryKey = p <= 0.26 ? 'story' : p.toFixed(5);
      if (geometryKey !== lastGeometry) {
        lastGeometry = geometryKey;
        const geometry = bridgeBreezeGeometry(width, height, opening, p);
        root.dataset.breezeFamily = geometry.family;
        outline?.setAttribute('d', geometry.outline);
        folds.forEach((node, i) => node.setAttribute('d', geometry.folds[i]));
        threads.forEach((node, i) =>
          node.setAttribute('d', geometry.threads[i]),
        );
        const depth = range(p, 0.26, 0.4);
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
                ([0.18, 0.6, 0.23, 0.68, 0.18][i] - originalSilk[i]) *
                  state.occlusion,
            ),
          ),
        );
      }
      const arrival = Math.max(0, opening - Math.max(0, scroll - top));
      const approach = range(p, 0.26, 0.42);
      const sx =
        1 + approach * (width < 1200 ? 0.09 : 0.14) + state.dissolve * 0.12;
      const sy = 1 + approach * 0.06 - state.dissolve * 0.22;
      const x = state.dissolve * width * 0.28;
      const y = arrival + -state.dissolve * height * 0.035;
      const transform = `translate(${x.toFixed(2)} ${y.toFixed(2)}) translate(${width * 0.55} ${height * 0.5}) rotate(${(-2 * approach).toFixed(3)}) scale(${sx.toFixed(5)} ${sy.toFixed(5)}) translate(${-width * 0.55} ${-height * 0.5})`;
      // Finish the camera veil in the sky. The skylight / atrium stays clear;
      // the cloth must not reappear over the architecture during pull-back.
      const opacity = (1 - state.dissolve).toFixed(5);
      const signature = `${transform}/${opacity}/${p}`;
      if (signature === lastPose) return;
      lastPose = signature;
      poses.forEach((node, i) => {
        node.setAttribute('transform', transform);
        node.setAttribute('opacity', i === 0 && p >= 0.4 ? '0' : opacity);
      });
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
