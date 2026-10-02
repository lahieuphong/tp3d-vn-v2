import { storyBreezeGeometry } from './breeze-geometry';
import { homeStoryFrame } from './home-story-frame';
import { bridgeTiming } from './atmospheric-bridge-frame';
import {
  bridgeBreezePose,
  type BreezeBridgeGeometry,
} from './breeze-bridge-pose';

export type BreezeDriver = {
  measure: (width: number, height: number) => void;
  paint: (progress: number, reduced: boolean) => void;
  destroy: () => void;
};

/** One static cloth definition travels from its approved reading pose toward
 * the camera. The master supplies all progress; this renderer owns no clock.
 * Responsive geometry changes only on measurement, never on scroll. */
export function createBreezeRenderer(root: HTMLElement): BreezeDriver {
  const svgs = [...root.querySelectorAll<SVGSVGElement>('[data-breeze-svg]')];
  const poses = [...root.querySelectorAll<SVGUseElement>('[data-breeze-pose]')];
  const outline = root.querySelector<SVGPathElement>('[data-breeze-outline]');
  const luminous = root.querySelector<SVGPathElement>('[data-breeze-luminous]');
  const transfer = root.querySelector<SVGGElement>('[data-breeze-transfer]');
  const folds = [
    ...root.querySelectorAll<SVGPathElement>('[data-breeze-fold]'),
  ];
  const threads = [
    ...root.querySelectorAll<SVGPathElement>('[data-breeze-thread]'),
  ];
  const nodes = [
    ...svgs,
    ...poses,
    ...folds,
    ...threads,
    ...(outline ? [outline] : []),
    ...(luminous ? [luminous] : []),
    ...(transfer ? [transfer] : []),
  ];
  const saved = nodes.map((node) => ({
    node,
    attributes: ['d', 'transform', 'opacity', 'viewBox'].map(
      (name) => [name, node.getAttribute(name)] as const,
    ),
  }));
  const originalFamily = root.getAttribute('data-breeze-family');
  const originalForeground = root.getAttribute('data-breeze-foreground');
  const originalActive = root.getAttribute('data-breeze-active');
  const foldOpacity = folds.map((node) => Number(node.getAttribute('opacity')));
  let geometry: BreezeBridgeGeometry = {
    width: 1,
    height: 1,
    breadth: 1,
    focus: { x: 0, y: 0 },
    family: 'desktop',
  };
  let openingDistance = 0;
  let lastPose = '';
  const attribute = (node: Element | null, name: string, value: string) => {
    if (node && node.getAttribute(name) !== value)
      node.setAttribute(name, value);
  };

  return {
    measure(width, height) {
      const measured = storyBreezeGeometry(width, height);
      geometry = { ...measured, width, height };
      root.dataset.breezeFamily = geometry.family;
      for (const svg of svgs)
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      outline?.setAttribute('d', measured.outline);
      luminous?.setAttribute('d', measured.outline);
      folds.forEach((node, i) => node.setAttribute('d', measured.folds[i]));
      threads.forEach((node, i) => node.setAttribute('d', measured.threads[i]));
      openingDistance = height * (geometry.family === 'mobile' ? 0.9 : 1.1);
      lastPose = '';
    },
    paint(progress, reduced) {
      const { perspective } = homeStoryFrame(progress);
      const pose = bridgeBreezePose(progress, geometry);
      const approaching = progress > bridgeTiming.breezeStart && !reduced;
      // Preserve PASS 2 exactly until the atmospheric approach. The two old
      // reading poses still exchange only at their invisible midpoint.
      const y = perspective < 0.5 ? openingDistance : 0;
      const transform = approaching
        ? `translate(${(geometry.focus.x + pose.x).toFixed(2)} ${(geometry.focus.y + pose.y).toFixed(2)}) rotate(${pose.rotate.toFixed(4)}) scale(${pose.scale.toFixed(6)}) translate(${(-geometry.focus.x).toFixed(2)} ${(-geometry.focus.y).toFixed(2)})`
        : `translate(0 ${y.toFixed(2)})`;
      const opacity = reduced
        ? 0
        : approaching
          ? pose.opacity
          : Math.abs(1 - 2 * perspective);
      // Keep the one reusable definition for reverse scroll, but remove all
      // three SVG projections from rendering once the cloth has left the lens.
      attribute(root, 'data-breeze-active', String(opacity > 0));
      const density = approaching ? pose.density : 0;
      const transferred = approaching ? pose.transfer : 0;
      const foreground = approaching && pose.foreground;
      const signature = `${transform}/${opacity.toFixed(5)}/${density.toFixed(5)}/${transferred.toFixed(5)}/${foreground}`;
      if (signature === lastPose) return;
      lastPose = signature;
      for (const node of poses) {
        const originalProjection =
          node.getAttribute('data-breeze-pose') !== 'near';
        attribute(node, 'transform', transform);
        attribute(
          node,
          'opacity',
          (opacity * (originalProjection ? 1 - transferred : 1)).toFixed(5),
        );
      }
      attribute(transfer, 'opacity', transferred.toFixed(5));
      attribute(luminous, 'opacity', density.toFixed(5));
      folds.forEach((node, i) => {
        // Keep curved folds readable close to the lens without graphic stripes.
        const nearOpacity = i % 3 === 0 ? 0.16 : 0.15 + (i % 4) * 0.06;
        attribute(
          node,
          'opacity',
          String(foldOpacity[i] + (nearOpacity - foldOpacity[i]) * density),
        );
      });
      attribute(root, 'data-breeze-foreground', String(foreground));
    },
    destroy() {
      for (const { node, attributes } of saved)
        for (const [name, value] of attributes) {
          if (value === null) node.removeAttribute(name);
          else node.setAttribute(name, value);
        }
      if (originalFamily === null) root.removeAttribute('data-breeze-family');
      else root.setAttribute('data-breeze-family', originalFamily);
      if (originalForeground === null)
        root.removeAttribute('data-breeze-foreground');
      else root.setAttribute('data-breeze-foreground', originalForeground);
      if (originalActive === null) root.removeAttribute('data-breeze-active');
      else root.setAttribute('data-breeze-active', originalActive);
    },
  };
}
