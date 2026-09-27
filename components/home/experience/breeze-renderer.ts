import { breezeGeometry, breezePose } from './breeze-geometry';
export type BreezeDriver = {
  measure: (bounds: DOMRect, scrollY: number, worlds: DOMRect) => void;
  paint: (scrollY: number, viewport: number, reduced: boolean) => void;
};
/** Owned by mountHomeChapters: no extra listeners, observer or RAF loop. */
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
  let width = 0,
    height = 0,
    worldsTop = 0,
    top = 0,
    lastPose = '';
  return {
    measure(bounds, scrollY, worlds) {
      top = bounds.top + scrollY;
      const opening = worlds.top - bounds.top;
      if (
        width === bounds.width &&
        height === bounds.height &&
        worldsTop === opening
      )
        return;
      width = bounds.width;
      height = bounds.height;
      worldsTop = opening;
      const geometry = breezeGeometry(width, height, worldsTop);
      root.dataset.breezeFamily = geometry.family;
      for (const svg of svgs)
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      outline?.setAttribute('d', geometry.outline);
      folds.forEach((path, i) => path.setAttribute('d', geometry.folds[i]));
      threads.forEach((path, i) => path.setAttribute('d', geometry.threads[i]));
    },
    paint(scrollY, viewport, reduced) {
      const gated = document.documentElement.hasAttribute('data-home-intro');
      const pose = breezePose(
        gated ? top : scrollY,
        top,
        height,
        viewport,
        width,
        reduced,
      );
      const transform = `translate(${pose.x.toFixed(2)} ${pose.y.toFixed(2)})`;
      const opacity = pose.opacity.toFixed(4);
      const signature = `${transform}/${opacity}`;
      if (signature === lastPose) return;
      lastPose = signature;
      // SVG coordinates, not a CSS transform of a several-screen raster layer.
      for (const node of poses) {
        node.setAttribute('transform', transform);
        node.setAttribute('opacity', opacity);
      }
    },
  };
}
