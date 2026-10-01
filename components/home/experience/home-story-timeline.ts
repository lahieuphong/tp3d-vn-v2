import type { BreezeDriver } from './breeze-renderer';
import { prepareBridgeImage } from './bridge-image';
import {
  clamp,
  homeStoryFrame,
  homeStoryTiming,
  worldContentReveal,
  settleCamera,
  arrivalFrame,
  portalDeparture,
  type CameraPose,
} from './home-story-frame';

/** One owner, one scroll listener and one RAF for Arrival → Perspective → Worlds.
 * Layout is measured on mount/resize only; every visual samples the same p. */
export function createHomeStoryTimeline(
  root: HTMLElement,
  breeze?: BreezeDriver,
): () => void {
  const sequence = root.querySelector<HTMLElement>('[data-home-story]');
  const stage = root.querySelector<HTMLElement>('[data-home-story-stage]');
  const story = root.querySelector<HTMLElement>('.spatial-hero');
  const worlds = root.querySelector<HTMLElement>('.hc-worlds');
  if (!sequence || !stage || !story || !worlds) {
    breeze?.destroy();
    return () => {};
  }
  const header = document.querySelector<HTMLElement>('.site-header');
  const rail = root.querySelector<HTMLElement>('.story-rail');
  const image = worlds.querySelector<HTMLImageElement>(
    '.hc-atrium-backdrop img',
  );
  const reveals = [
    ...worlds.querySelectorAll<HTMLElement>('[data-chapter-reveal]'),
  ];
  const discovery = story.querySelector<HTMLElement>('.sh-discovery');
  const manifesto = story.querySelector<HTMLElement>('.sh-story');
  const portalGroup = story.querySelector<HTMLElement>('.sh-portals');
  const portals = [...story.querySelectorAll<HTMLElement>('.sh-portal')];
  const secondary = story.querySelector<HTMLImageElement>(
    'img[data-hero-deferred]',
  );
  const secondarySources = [
    ...story.querySelectorAll<HTMLSourceElement>(
      'source[data-hero-deferred-source]',
    ),
  ];
  const openingLayers = Object.keys(arrivalFrame(0, 1440, false)).map(
    (selector) => ({
      selector,
      node: story.querySelector<HTMLElement>(selector),
    }),
  );
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const saved = [
    root,
    story,
    worlds,
    header,
    rail,
    discovery,
    manifesto,
    portalGroup,
    ...portals,
    ...reveals,
    ...openingLayers.map((layer) => layer.node),
  ]
    .filter((n): n is HTMLElement => !!n)
    .map((node) => ({
      node,
      attributes: [
        'style',
        'inert',
        'aria-hidden',
        'data-story-ready',
        'data-scene',
        'data-motion',
        'data-story-image',
        'data-opening',
        'data-story-chapter',
        'data-story-active',
        'data-story-progress',
        'data-camera-progress',
        'data-bridge-image',
        'data-bridge-active',
        'data-story-hero-hidden',
        'data-story-sky-complete',
        'data-chapter-theme',
        'data-world-interactive',
      ].map((name) => [name, node.getAttribute(name)] as const),
    }));
  let geometry = {
    top: 0,
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
  let lastScroll = window.scrollY;
  let focusScroll: number | null = null;
  let bridgeReady = false;
  let bridgeFailed = !image;
  let ready = false,
    secondaryStarted = false,
    initialPaints = 2,
    lastArrivalSignature = '';
  const imageSettled = async () => {
    if (!secondary || disposed) return;
    if (secondary.naturalWidth) {
      try {
        await secondary.decode();
      } catch {
        /* Preserve Scene A if decoding fails. */
      }
    }
    if (disposed) return;
    ready = secondary.complete && secondary.naturalWidth > 0;
    story.dataset.storyImage = ready ? 'ready' : 'fallback';
    schedule();
  };
  const startSecondary = () => {
    if (!secondary || secondaryStarted || reduced.matches) return;
    secondaryStarted = true;
    secondary.addEventListener('load', imageSettled);
    secondary.addEventListener('error', imageSettled);
    for (const source of secondarySources)
      source.srcset = source.dataset.srcset ?? '';
    secondary.sizes = secondary.dataset.sizes ?? '100vw';
    secondary.srcset = secondary.dataset.srcset ?? '';
    secondary.src = secondary.dataset.src ?? '';
    if (secondary.complete) void imageSettled();
  };
  const schedule = () => {
    if (!disposed && !document.hidden && !frame)
      frame = requestAnimationFrame(render);
  };
  const measure = () => {
    camera = null;
    const scroll = window.scrollY;
    const owner = sequence.getBoundingClientRect();
    const stageBounds = stage.getBoundingClientRect();
    const worldBounds = worlds.getBoundingClientRect();
    geometry = {
      top: owner.top + scroll,
      span: Math.max(1, owner.height - stageBounds.height),
      stage: stageBounds.height,
      width: stageBounds.width,
      bottom: owner.bottom + scroll,
      worldTop: worldBounds.top + scroll,
      header: header?.getBoundingClientRect().height ?? 0,
    };
    breeze?.measure(stageBounds.width, stageBounds.height);
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
  // Inline-style reads do not force layout. Quiet phases only update the tiny
  // rail, instead of invalidating inherited custom properties across the stage.
  const property = (node: HTMLElement, name: string, value: string) => {
    if (node.style.getPropertyValue(name) !== value)
      node.style.setProperty(name, value);
  };
  function render() {
    frame = 0;
    if (disposed || document.hidden) return;
    if (needsMeasure) measure();
    if (focusScroll !== null) {
      // Chrome may scroll to an absolute child's unpinned position on focus.
      // Preserve the visible, settled stage for this focus event only. This
      // cancels that automatic scroll without changing wheel/touch behavior.
      if (!reduced.matches)
        window.scrollTo({ top: focusScroll, behavior: 'instant' });
      focusScroll = null;
    }
    const scroll = document.documentElement.hasAttribute('data-home-intro')
      ? 0
      : window.scrollY;
    lastScroll = scroll;
    const still = reduced.matches;
    const nativeProgress = clamp((scroll - geometry.top) / geometry.span);
    // Scroll stays native. If a fast flick beats decoding, retain the complete
    // Philosophy composition until the existing responsive plate is ready.
    const p =
      !still && !bridgeReady && !bridgeFailed
        ? Math.min(nativeProgress, homeStoryTiming.perspectiveEnd)
        : nativeProgress;
    const visualProgress = Math.min(p, homeStoryTiming.settled);
    const state = homeStoryFrame(
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
    if (initialPaints > 0) {
      initialPaints--;
      schedule();
    } else startSecondary();
    breeze?.paint(p, still);
    const arrivalSignature = `${Math.min(p, 0.34).toFixed(6)}/${still}/${geometry.width}/${ready}`;
    if (lastArrivalSignature !== arrivalSignature) {
      lastArrivalSignature = arrivalSignature;
      story!.dataset.motion = still ? 'reduced' : 'scroll';
      story!.dataset.scene =
        still || p <= 0.195 ? 'discovery' : p >= 0.34 ? 'story' : 'transition';
      const values = arrivalFrame(p, geometry.width, ready);
      for (const { node, selector } of openingLayers) {
        if (!node) continue;
        for (const [property, value] of Object.entries(
          values[selector as keyof typeof values],
        )) {
          if (still) node.style.removeProperty(property);
          else if (node.style[property as 'opacity' | 'transform'] !== value)
            Object.assign(node.style, { [property]: value });
        }
      }
      portals.forEach((node, index) => {
        const pose = portalDeparture(p, index, geometry.width);
        if (still) {
          node.style.removeProperty('opacity');
          node.style.removeProperty('transform');
        } else {
          property(node, 'opacity', pose.opacity.toFixed(5));
          property(
            node,
            'transform',
            `translate3d(0, ${pose.y.toFixed(3)}px, 0) scale(${pose.scale.toFixed(5)})`,
          );
        }
        expose(node, still || pose.opacity >= 0.9999);
      });
      if (discovery) expose(discovery, still || p < 0.278);
      if (portalGroup) expose(portalGroup, still || p < 0.312);
      if (manifesto) expose(manifesto, still || p >= 0.3);
    }
    const nativeValue = nativeProgress.toFixed(5);
    if (root.dataset.storyProgress !== nativeValue)
      root.dataset.storyProgress = nativeValue;
    const cameraValue = p.toFixed(5);
    if (root.dataset.cameraProgress !== cameraValue)
      root.dataset.cameraProgress = cameraValue;
    const imageStatus = bridgeFailed
      ? 'failed'
      : bridgeReady
        ? 'ready'
        : 'loading';
    if (root.dataset.bridgeImage !== imageStatus)
      root.dataset.bridgeImage = imageStatus;
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
        else property(root, key, String(value));
      }
    }
    if (settledCamera.moving) schedule();
    // Scroll continues during the final hold, but no visual style keeps moving.
    const signature = `${visualProgress.toFixed(6)}/${still}/${theme}/${geometry.width}/${geometry.stage}`;
    if (lastSignature === signature) return;
    lastSignature = signature;
    toggle('data-story-ready', !still);
    toggle(
      'data-story-active',
      !still &&
        ((p > 0.16 && p < 0.34) || (p > 0.48 && p < homeStoryTiming.skyStart)),
    );
    toggle(
      'data-bridge-active',
      !still &&
        p > homeStoryTiming.breezeApproach &&
        p < homeStoryTiming.pullbackEnd,
    );
    toggle('data-story-hero-hidden', !still && !state.storyVisible);
    toggle('data-story-sky-complete', still || p >= homeStoryTiming.skyStart);
    const interactive = still || p >= homeStoryTiming.interactive;
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
      '--swb-breeze-depth': p > homeStoryTiming.breezeApproach ? 8 : 4,
    };
    for (const [key, value] of Object.entries(properties)) {
      if (still) root.style.removeProperty(key);
      else property(root, key, String(value));
    }
    if (rail) {
      property(rail, '--story-rail-opacity', String(state.railOpacity));
      property(rail, '--story-rail-progress', String(state.railProgress));
    }
    if (header && header.dataset.chapterTheme !== theme)
      header.dataset.chapterTheme = theme;
    const opening = p < 0.34 ? 'active' : 'past';
    if (header && header.dataset.opening !== opening)
      header.dataset.opening = opening;
    if (root.dataset.storyChapter !== state.chapter)
      root.dataset.storyChapter = state.chapter;
    expose(story!, still || p < 0.56);
    expose(worlds!, still || p > homeStoryTiming.uiStart);
    for (const node of reveals) {
      const reveal = still
        ? 1
        : worldContentReveal(
            visualProgress,
            Number(node.dataset.chapterReveal),
          );
      property(node, 'opacity', reveal.toFixed(5));
      if (node.classList.contains('hc-atrium-room-link'))
        property(node, '--room-reveal', String(reveal));
      property(
        node,
        'transform',
        `translate3d(0, ${((1 - reveal) * 8).toFixed(2)}px, 0)`,
      );
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
  const preserveWorldFocus = (event: FocusEvent) => {
    const target = event.target as HTMLElement | null;
    if (
      !reduced.matches &&
      target?.tagName === 'A' &&
      !target.inert &&
      reveals.includes(target) &&
      lastScroll >=
        geometry.top + geometry.span * homeStoryTiming.interactive &&
      lastScroll <= geometry.top + geometry.span
    ) {
      focusScroll = lastScroll;
      schedule();
    }
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
  worlds.addEventListener('focusin', preserveWorldFocus);
  image?.addEventListener('load', resize);
  render();
  const disposeBridge = image
    ? prepareBridgeImage(sequence, image, {
        ready: () => {
          bridgeReady = true;
          bridgeFailed = false;
          lastSignature = '';
          schedule();
        },
        failed: () => {
          bridgeReady = false;
          bridgeFailed = true;
          lastSignature = '';
          schedule();
        },
      })
    : () => {};
  return () => {
    if (disposed) return;
    disposed = true;
    disposeBridge();
    cancelAnimationFrame(frame);
    observer.disconnect();
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', resize);
    window.removeEventListener('pageshow', restore);
    document.removeEventListener('visibilitychange', visibility);
    reduced.removeEventListener('change', resize);
    worlds.removeEventListener('focusin', preserveWorldFocus);
    image?.removeEventListener('load', resize);
    secondary?.removeEventListener('load', imageSettled);
    secondary?.removeEventListener('error', imageSettled);
    for (const { node, attributes } of saved)
      for (const [name, value] of attributes) {
        if (value === null) node.removeAttribute(name);
        else node.setAttribute(name, value);
      }
    breeze?.destroy();
  };
}
