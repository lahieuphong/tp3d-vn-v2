import {
  breezeGeometry,
  breezePose,
  portalBreezeGeometry,
} from './breeze-geometry';
import { range } from './sky-portal-frame';
export type BreezeDriver = {
  measure: (
    bounds: DOMRect,
    scrollY: number,
    track: DOMRect,
    stage: number,
    span: number,
  ) => void;
  paint: (
    scrollY: number,
    viewport: number,
    reduced: boolean,
    portalProgress: number,
  ) => void;
  destroy: () => void;
};
/** Reuses the same cloth definition and two projections; no new render loop. */
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
  const frontStops = [
    ...root.querySelectorAll<SVGStopElement>(
      '[data-breeze-depth="front"] stop',
    ),
  ];
  const backStops = [
    ...root.querySelectorAll<SVGStopElement>('[data-breeze-depth="back"] stop'),
  ];
  const saved = [
    ...svgs,
    ...poses,
    ...folds,
    ...threads,
    ...frontStops,
    ...backStops,
    ...(outline ? [outline] : []),
    ...(canopy ? [canopy] : []),
  ].map((node) => ({
    node,
    attributes: [
      'd',
      'transform',
      'opacity',
      'viewBox',
      'stop-color',
      'cx',
      'cy',
      'rx',
      'ry',
    ].map((name) => [name, node.getAttribute(name)] as const),
  }));
  let width = 0,
    height = 0,
    top = 0,
    trackTop = 0,
    stage = 0,
    span = 1,
    settle = 0;
  let lastGeometry = '',
    lastPose = '';
  const draw = (geometry: ReturnType<typeof breezeGeometry>) => {
    root.dataset.breezeFamily = geometry.family;
    outline?.setAttribute('d', geometry.outline);
    folds.forEach((path, i) => path.setAttribute('d', geometry.folds[i]));
    threads.forEach((path, i) => path.setAttribute('d', geometry.threads[i]));
  };
  return {
    measure(bounds, scroll, track, stageHeight, portalSpan) {
      top = bounds.top + scroll;
      width = bounds.width;
      height = bounds.height;
      trackTop = track.top - bounds.top;
      stage = stageHeight;
      span = portalSpan;
      settle = Math.max(0, track.height - stage - span);
      for (const svg of svgs)
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      lastGeometry = '';
      lastPose = '';
    },
    paint(scroll, viewport, reduced, progress) {
      const gated = document.documentElement.hasAttribute('data-home-intro');
      const p = reduced || gated ? 0 : progress;
      const geometryKey = `${p <= 0.25 ? 'opening' : p.toFixed(5)}/${reduced}`;
      if (geometryKey !== lastGeometry) {
        lastGeometry = geometryKey;
        draw(
          p <= 0.25
            ? breezeGeometry(width, height, trackTop + stage * 0.84)
            : portalBreezeGeometry(width, height, trackTop, stage, span, p),
        );
        const depth = range(p, 0.3, 0.65);
        frontStops.forEach((stop, i) => {
          const start = i === 2 || i === 3 ? 0 : 255;
          const v = Math.round(start + (255 - start) * depth);
          stop.setAttribute('stop-color', `rgb(${v} ${v} ${v})`);
          backStops[i]?.setAttribute(
            'stop-color',
            `rgb(${255 - v} ${255 - v} ${255 - v})`,
          );
        });
      }
      const pose = breezePose(
        gated ? top : scroll,
        top,
        height,
        viewport,
        width,
        reduced,
      );
      const end = top + trackTop + span;
      const dissolve = reduced
        ? 0
        : range(
            scroll,
            end + stage * 0.035,
            end + Math.min(settle, stage * 0.22),
          );
      const emerge = range(p, 0.55, 0.98);
      const drift = Math.max(0, Math.min(settle, scroll - end));
      const sx = 1 + dissolve * 0.12,
        sy = 1 - dissolve * 0.18;
      const originX = width * 0.93,
        originY = trackTop + span + stage * 0.84;
      const tx = pose.x * (1 - emerge) + dissolve * width * 0.025;
      const ty = pose.y * (1 - emerge) + drift + dissolve * stage * 0.025;
      const transform = `translate(${tx.toFixed(2)} ${ty.toFixed(2)}) translate(${originX.toFixed(2)} ${originY.toFixed(2)}) scale(${sx.toFixed(4)} ${sy.toFixed(4)}) translate(${(-originX).toFixed(2)} ${(-originY).toFixed(2)})`;
      const opacity = (
        reduced
          ? pose.opacity
          : (1 - 0.3 * range(p, 0.28, 0.54) + 0.08 * emerge) * (1 - dissolve)
      ).toFixed(4);
      const signature = `${transform}/${opacity}/${p}`;
      if (signature === lastPose) return;
      lastPose = signature;
      for (const [index, node] of poses.entries()) {
        node.setAttribute('transform', transform);
        node.setAttribute('opacity', index === 0 && p >= 0.65 ? '0' : opacity);
      }
      // The cloth goes behind the central tree canopy, then returns over the
      // reflected floor. On mobile the back projection is empty after entry.
      canopy?.setAttribute('cx', String(width * 0.505));
      canopy?.setAttribute(
        'cy',
        String(trackTop + span * p + stage * 0.44 + drift),
      );
      canopy?.setAttribute(
        'rx',
        String(width * (width < 768 ? 0.19 : 0.125) * emerge),
      );
      canopy?.setAttribute('ry', String(stage * 0.19 * emerge));
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
