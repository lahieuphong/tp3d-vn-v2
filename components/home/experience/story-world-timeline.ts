import type { BreezeDriver } from './breeze-renderer';
import {
  clamp,
  storyWorldFrame,
  storyWorldTiming,
  worldContentReveal,
  settleCamera,
  type CameraPose,
} from './story-world-frame';

/** One scoped, reversible Story → Worlds timeline on native scroll. Layout is
 * cached on mount/resize; scroll frames only sample scrollY and write styles. */
export function createStoryWorldTimeline(
  root: HTMLElement,
  breeze?: BreezeDriver,
): () => void {
  const sequence = root.querySelector<HTMLElement>(
    '[data-story-world-sequence]',
  );
  const bridge = root.querySelector<HTMLElement>('[data-story-world-range]');
  const stage = root.querySelector<HTMLElement>('[data-story-world-stage]');
  const story = root.querySelector<HTMLElement>('.spatial-hero');
  const worlds = root.querySelector<HTMLElement>('.hc-worlds');
  if (!sequence || !bridge || !stage || !story || !worlds) {
    breeze?.destroy();
    return () => {};
  }
  const header = document.querySelector<HTMLElement>('.site-header');
  const image = worlds.querySelector<HTMLImageElement>(
    '.hc-atrium-backdrop img',
  );
  const reveals = [
    ...worlds.querySelectorAll<HTMLElement>('[data-chapter-reveal]'),
  ];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const saved = [root, story, worlds, header, ...reveals]
    .filter((n): n is HTMLElement => !!n)
    .map((node) => ({
      node,
      attributes: [
        'style',
        'inert',
        'aria-hidden',
        'data-bridge-ready',
        'data-bridge-active',
        'data-bridge-progress',
        'data-bridge-story-hidden',
        'data-bridge-sky-complete',
        'data-chapter-theme',
        'data-world-interactive',
      ].map((name) => [name, node.getAttribute(name)] as const),
    }));
  let geometry = {
    top: 0,
    opening: 0,
    span: 1,
    stage: 1,
    width: 1,
    bottom: 0,
    worldTop: 0,
    header: 0,
  };
  let frame = 0,
    disposed = false,
    needsMeasure = true,
    lastSignature = '';
  let camera: CameraPose | null = null,
    lastCameraSignature = '',
    lastTime = 0;
  const schedule = () => {
    if (!disposed && !document.hidden && !frame)
      frame = requestAnimationFrame(render);
  };
  const measure = () => {
    camera = null;
    const scroll = window.scrollY;
    const bounds = bridge.getBoundingClientRect();
    const owner = sequence.getBoundingClientRect();
    const stageBounds = stage.getBoundingClientRect();
    const worldBounds = worlds.getBoundingClientRect();
    geometry = {
      top: bounds.top + scroll,
      opening: bounds.top - owner.top,
      span: Math.max(1, bounds.height - stageBounds.height),
      stage: stageBounds.height,
      width: stageBounds.width,
      bottom: owner.bottom + scroll,
      worldTop: worldBounds.top + scroll,
      header: header?.getBoundingClientRect().height ?? 0,
    };
    breeze?.measure(
      stageBounds.width,
      stageBounds.height,
      geometry.opening,
      owner.top + scroll,
    );
    needsMeasure = false;
  };
  const toggle = (name: string, enabled: boolean) => {
    if (root.hasAttribute(name) !== enabled)
      root.toggleAttribute(name, enabled);
  };
  const expose = (node: HTMLElement, visible: boolean) => {
    const hidden = !visible;
    if (node.inert !== hidden) node.inert = hidden;
    if (node.getAttribute('aria-hidden') !== String(hidden))
      node.setAttribute('aria-hidden', String(hidden));
  };
  function render() {
    frame = 0;
    if (disposed || document.hidden) return;
    if (needsMeasure) measure();
    const scroll = document.documentElement.hasAttribute('data-home-intro')
      ? 0
      : window.scrollY;
    const still = reduced.matches;
    const p = clamp((scroll - geometry.top) / geometry.span);
    const visualProgress = Math.min(p, storyWorldTiming.settled);
    const state = storyWorldFrame(
      visualProgress,
      geometry.width,
      geometry.stage,
    );
    // Native restoration runs during document load. Reveal the already sampled
    // frame after load, never flash the default Story/Discovery composition.
    if (
      document.readyState === 'complete' &&
      document.documentElement.hasAttribute('data-home-restoring')
    ) {
      if (window.__tpHomeIntroRuntime?.restoreWatchdog !== undefined) {
        window.clearTimeout(window.__tpHomeIntroRuntime.restoreWatchdog);
        window.__tpHomeIntroRuntime.restoreWatchdog = undefined;
      }
      document.documentElement.removeAttribute('data-home-restoring');
    }
    const past = scroll + geometry.header >= geometry.bottom;
    const ivory = still
      ? scroll + geometry.header >= geometry.worldTop
      : state.headerIvory;
    const theme = past
      ? 'light'
      : !still && state.headerSky
        ? 'sky'
        : ivory
          ? 'dark'
          : 'light';
    breeze?.paint(scroll, still, p);
    root.dataset.bridgeProgress = p.toFixed(5);
    const now = performance.now();
    const target = {
      storyScale: state.storyScale,
      storyY: state.storyY,
      scale: state.scale,
      imageY: state.imageY,
    };
    const settledCamera = settleCamera(
      target,
      camera,
      lastTime ? now - lastTime : 16.7,
      still ? 0 : state.inertia,
    );
    camera = settledCamera.pose;
    camera.imageY = Math.max(
      (geometry.stage - state.originY) * (1 - camera.scale),
      Math.min(state.originY * (camera.scale - 1), camera.imageY),
    );
    lastTime = now;
    const cameraSignature = `${still}/${Object.values(camera)
      .map((n) => n.toFixed(6))
      .join('/')}`;
    if (lastCameraSignature !== cameraSignature) {
      lastCameraSignature = cameraSignature;
      for (const [key, value] of Object.entries({
        '--swb-story-scale': camera.storyScale,
        '--swb-story-y': `${camera.storyY}px`,
        '--swb-image-scale': camera.scale,
        '--swb-image-y': `${camera.imageY}px`,
      })) {
        if (still) root.style.removeProperty(key);
        else root.style.setProperty(key, String(value));
      }
    }
    if (settledCamera.moving) schedule();
    // Scroll continues during the final hold, but no visual style keeps moving.
    const signature = `${visualProgress.toFixed(6)}/${still}/${theme}/${geometry.width}/${geometry.stage}`;
    if (lastSignature === signature) return;
    lastSignature = signature;
    toggle('data-bridge-ready', !still);
    toggle(
      'data-bridge-active',
      !still && p > 0.16 && p < storyWorldTiming.pullbackEnd,
    );
    toggle('data-bridge-story-hidden', !still && !state.storyVisible);
    toggle('data-bridge-sky-complete', still || p >= storyWorldTiming.skyStart);
    const interactive = still || p >= storyWorldTiming.interactive;
    toggle('data-world-interactive', interactive);
    const properties = {
      '--swb-text-opacity': state.textOpacity,
      '--swb-text-y': `${state.textY}px`,
      '--swb-tp-scale': state.tpScale,
      '--swb-tp-y': `${state.tpY}px`,
      '--swb-tp-opacity': state.tpOpacity,
      '--swb-origin-y': `${state.originY}px`,
      '--swb-exposure': state.exposure,
      '--swb-story-light': state.storyLight,
      '--swb-sky-light': state.skyLight,
      '--swb-header-shade': state.headerShade,
      '--swb-sky-edge': `${state.skyEdge}%`,
      '--swb-sky-visible': state.skyVisible ? 'visible' : 'hidden',
      '--swb-breeze-depth': p > 0.26 ? 8 : 4,
    };
    for (const [key, value] of Object.entries(properties)) {
      if (still) root.style.removeProperty(key);
      else root.style.setProperty(key, String(value));
    }
    if (header && header.dataset.chapterTheme !== theme)
      header.dataset.chapterTheme = theme;
    expose(story!, still || p < 0.47);
    expose(worlds!, still || p > storyWorldTiming.uiStart);
    for (const node of reveals) {
      const reveal = still
        ? 1
        : worldContentReveal(
            visualProgress,
            Number(node.dataset.chapterReveal),
          );
      node.style.opacity = reveal.toFixed(5);
      node.style.transform = `translate3d(0, ${((1 - reveal) * (geometry.width < 768 ? 8 : 12)).toFixed(2)}px, 0)`;
      expose(
        node,
        node.tagName === 'A' ? interactive && reveal >= 0.9999 : reveal >= 0.15,
      );
    }
  }
  const resize = () => {
    needsMeasure = true;
    lastSignature = '';
    schedule();
  };
  const visibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else resize();
  };
  // bfcache restoration is sampled synchronously, before the next paint.
  const restore = () => {
    cancelAnimationFrame(frame);
    needsMeasure = true;
    lastSignature = '';
    render();
  };
  const observer = new ResizeObserver(resize);
  for (const node of [sequence, stage, header])
    if (node) observer.observe(node);
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('pageshow', restore);
  document.addEventListener('visibilitychange', visibility);
  reduced.addEventListener('change', resize);
  image?.addEventListener('load', resize);
  render();
  return () => {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame);
    observer.disconnect();
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', resize);
    window.removeEventListener('pageshow', restore);
    document.removeEventListener('visibilitychange', visibility);
    reduced.removeEventListener('change', resize);
    image?.removeEventListener('load', resize);
    for (const { node, attributes } of saved)
      for (const [name, value] of attributes) {
        if (value === null) node.removeAttribute(name);
        else node.setAttribute(name, value);
      }
    breeze?.destroy();
  };
}
