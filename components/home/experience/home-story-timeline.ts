import type { BreezeDriver } from './breeze-renderer';
import { createAtmosphericSkyBridge } from './atmospheric-sky-renderer';
import {
  MOTION,
  cameraImpulse,
  motionProfile,
  settleVisual,
  editorial,
  span,
  type VisualPose,
} from './home-motion';
import { prepareSceneImage } from './scene-image';
import { HOME_PRODUCTION } from './home-production';
import { createRoomDiscovery } from './room-discovery';
import { createHeroDepth } from './hero-depth';
import {
  bridgeTiming,
  bridgeFrame,
  measureAtrium,
  atriumPose,
  worldReveal,
  storyTextDeparture,
  departureRole,
} from './atmospheric-bridge-frame';
import {
  clamp,
  homeStoryFrame,
  arrivalFrame,
  arrivalTiming,
  tpTiming,
  tpPose,
  type TPGeometry,
} from './home-story-frame';
import {
  measureWorldsOrbit,
  orbitPose,
  orbitTier,
  worldsOrbitFrame,
  type Box,
  type OrbitRoom,
} from './worlds-orbit';

/** The only scroll owner. All scene layers sample native progress; no camera
 * clock, scroll correction, per-frame React state or independent scene trigger. */
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
  const sharedTP = stage.querySelector<HTMLElement>('[data-shared-tp]');
  const skyHost = stage.querySelector<HTMLElement>(
    '[data-atmospheric-sky-bridge]',
  );
  const camera = worlds.querySelector<HTMLElement>('[data-scene3-camera]');
  const worldReveals = [
    ...worlds.querySelectorAll<HTMLElement>('[data-chapter-reveal]'),
  ];
  const roomLabels = worlds.querySelector<HTMLElement>('.hc-atrium-rooms');
  const architecture = story.querySelector<HTMLElement>('.sh-plane-background');
  const centerCopy = story.querySelector<HTMLElement>('.sh-center-copy');
  const colophon = story.querySelector<HTMLElement>('.sh-colophon');
  const readStory = story.querySelector<HTMLElement>('.sh-read-story');
  const header = document.querySelector<HTMLElement>('.site-header');
  const rail = root.querySelector<HTMLElement>('.story-rail');
  const image = worlds.querySelector<HTMLImageElement>(
    '.hc-atrium-backdrop img',
  );
  const discovery = story.querySelector<HTMLElement>('.sh-discovery');
  const manifesto = story.querySelector<HTMLElement>('.sh-story');
  const portals = story.querySelector<HTMLElement>('.sh-portals');
  const secondary = story.querySelector<HTMLImageElement>(
    'img[data-hero-deferred]',
  );
  const secondarySources = [
    ...story.querySelectorAll<HTMLSourceElement>(
      'source[data-hero-deferred-source]',
    ),
  ];
  // TP3D PASS — Atrium room orbit. The approved journey's height is measured
  // from its own marker; anything the story is taller than that is the
  // appended orbit. The four room wrappers carry the existing room links.
  const baseMarker = sequence.querySelector<HTMLElement>(
    '[data-home-story-base]',
  );
  const roomWrappers = [
    ...worlds.querySelectorAll<HTMLElement>('.hc-atrium-room'),
  ].map((node) => ({
    node,
    room: node.querySelector<HTMLElement>('[data-room]')?.dataset.room as
      | OrbitRoom
      | undefined,
  }));
  const roomFocus = worlds.querySelector<HTMLElement>('.hc-room-focus');
  const openingLayers = Object.keys(arrivalFrame(0, 1440, false)).flatMap(
    (selector) =>
      [...root.querySelectorAll<HTMLElement>(selector)].map((node) => ({
        selector,
        node,
      })),
  );
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const saved = [
    ...new Set([
      root,
      sharedTP,
      camera,
      roomLabels,
      architecture,
      centerCopy,
      colophon,
      ...worldReveals,
      readStory,
      story,
      worlds,
      header,
      rail,
      discovery,
      manifesto,
      portals,
      roomFocus,
      ...roomWrappers.map((wrapper) => wrapper.node),
      ...openingLayers.map((layer) => layer.node),
    ]),
  ]
    .filter((node): node is HTMLElement => !!node)
    .map((node) => ({
      node,
      // The persistent header's interaction gate belongs to the Intro, which
      // may release it after this timeline mounts. Restore only our theme data.
      attributes: (node === header
        ? ['data-opening', 'data-chapter-theme']
        : [
            'style',
            'inert',
            'aria-hidden',
            'data-scene',
            'data-motion',
            'data-story-image',
            'data-opening',
            'data-story-chapter',
            'data-story-progress',
            'data-scene-image',
            'data-chapter-theme',
            'data-tp-state',
            'data-bridge-phase',
            'data-world-interactive',
            'data-room-orbit',
            'data-orbit-room',
          ]
      ).map((name) => [name, node.getAttribute(name)] as const),
    }));
  let geometry = {
    top: 0,
    // The approved journey's own scroll span, never stretched by the orbit.
    span: 1,
    orbit: 0,
    width: 1,
    height: 1,
    bottom: 0,
    worldTop: 0,
    header: 0,
  };
  let tpGeometry: TPGeometry = {
    x: 0,
    y: 0,
    scale: 1,
    width: 0,
    height: 0,
    opacity: 1,
  };
  let atriumGeometry = measureAtrium(1440, 900);
  let orbitGeometry = measureWorldsOrbit(1440, 900);
  const headerMix = header?.style.getPropertyValue('--home-header-ivory') ?? '';
  const headerMixPriority =
    header?.style.getPropertyPriority('--home-header-ivory') ?? '';
  const debug =
    import.meta.env.DEV &&
    new URLSearchParams(window.location.search).get('storyDebug') === '1'
      ? document.createElement('output')
      : null;
  if (debug) {
    debug.className = 'home-story-debug';
    debug.setAttribute('aria-hidden', 'true');
    stage.appendChild(debug);
  }
  // Development-only (?storyDebug=1). The narrative part is refreshed by full
  // renders; the atmosphere part also by ambient-only frames.
  let debugNarrative = '';
  const debugLine = () =>
    `${debugNarrative} · ${skyBridge?.debug() ?? 'DOM atmosphere'}`;
  let frame = 0,
    disposed = false,
    needsMeasure = true,
    // Scroll, resize and lifecycle events need the full narrative render.
    // Otherwise a frame only lets the atmosphere's air live.
    narrative = true;
  let ready = false,
    secondaryStarted = false,
    initialPaints = 2;
  let sceneImage: 'loading' | 'ready' | 'failed' = image ? 'loading' : 'failed';
  let lastSignature = '';
  let cameraMass: VisualPose | null = null;
  let architectureMass: VisualPose | null = null;
  let lastFrameTime = 0;
  let atmosphericCrossing = false;
  const saveData =
    (navigator as Navigator & { connection?: { saveData?: boolean } })
      .connection?.saveData === true;
  const discoveryInteraction = createRoomDiscovery(worlds);
  // TP3D PASS 6A — the dormant Tier B room orbit (development / preview
  // only, see the gate below). Null on the production homepage.
  let roomOrbit: ReturnType<
    typeof import('./atrium-orbit-controller').createAtriumOrbitController
  > | null = null;
  const request = () => {
    if (!disposed && !document.hidden && !frame)
      frame = requestAnimationFrame(step);
  };
  const schedule = () => {
    narrative = true;
    request();
  };
  // The one RAF owner. Ambient frames continue only while the atmosphere is
  // alive on screen or Scene 1 pointer depth is still easing; a resting story
  // schedules nothing.
  function step(now: number) {
    frame = 0;
    if (disposed || document.hidden) return;
    if (narrative) render(now);
    else {
      skyBridge?.tick(now);
      if (debug) debug.textContent = debugLine();
    }
    heroDepth.tick(now);
    if (skyBridge?.wantsTime() || heroDepth.wantsTime()) request();
  }
  const skyBridge = skyHost
    ? createAtmosphericSkyBridge(skyHost, schedule)
    : null;
  // Pointer input only needs an ambient frame, never the narrative render.
  const heroDepth = createHeroDepth(stage, request);
  const imageSettled = async () => {
    if (!secondary || disposed) return;
    let decoded = false;
    if (secondary.naturalWidth) {
      try {
        await secondary.decode();
        decoded = true;
      } catch {
        /* Keep architecture A as fallback. */
      }
    }
    if (disposed) return;
    ready = decoded && secondary.complete && secondary.naturalWidth > 0;
    story.dataset.storyImage = ready ? 'ready' : 'fallback';
    schedule();
  };
  const startSecondary = () => {
    if (!secondary || secondaryStarted) return;
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
  const measure = () => {
    cameraMass = architectureMass = null;
    lastFrameTime = 0;
    const scroll = window.scrollY;
    const owner = sequence.getBoundingClientRect();
    const bounds = stage.getBoundingClientRect();
    const worldBounds = worlds.getBoundingClientRect();
    const baseHeight = baseMarker
      ? baseMarker.getBoundingClientRect().height
      : owner.height;
    geometry = {
      top: owner.top + scroll,
      span: Math.max(1, baseHeight - bounds.height),
      orbit: Math.max(0, owner.height - baseHeight),
      width: bounds.width,
      height: bounds.height,
      bottom: owner.bottom + scroll,
      worldTop: worldBounds.top + scroll,
      header: header?.getBoundingClientRect().height ?? 0,
    };
    if (sharedTP) {
      const style = getComputedStyle(sharedTP);
      const distance = (value: string) => {
        const amount = Number.parseFloat(value) || 0;
        if (value.trim().endsWith('vw')) return (amount * bounds.width) / 100;
        if (value.trim().endsWith('vh')) return (amount * bounds.height) / 100;
        return amount;
      };
      tpGeometry = {
        x: distance(style.getPropertyValue('--sh-monogram-story-x')),
        y: distance(style.getPropertyValue('--sh-monogram-story-y')),
        scale:
          Number.parseFloat(
            style.getPropertyValue('--sh-monogram-story-scale'),
          ) || 1,
        width: Number.parseFloat(style.width),
        height: Number.parseFloat(style.height),
        opacity:
          Number.parseFloat(style.getPropertyValue('--tp-base-opacity')) || 1,
      };
    }
    breeze?.measure(bounds.width, bounds.height);
    atriumGeometry = measureAtrium(bounds.width, bounds.height);
    // The portals keep clear of the copy (each line of glyphs), the gateway
    // and the baseline (their layout boxes), read here once per layout and
    // never per frame. Reveal offsets are taken out, so a layout measured
    // mid-journey matches the settled Atrium the orbit plays over.
    const avoid: Box[] = [];
    const layoutBox = (node: HTMLElement | null) => {
      if (!node) return;
      let x = 0,
        y = 0;
      for (
        let at: HTMLElement | null = node;
        at && at !== worlds;
        at = at.offsetParent as HTMLElement | null
      ) {
        x += at.offsetLeft;
        y += at.offsetTop;
      }
      avoid.push({
        x0: x,
        y0: y,
        x1: x + node.offsetWidth,
        y1: y + node.offsetHeight,
      });
    };
    for (const node of worlds.querySelectorAll<HTMLElement>(
      '.hc-atrium-copy [data-chapter-reveal]',
    )) {
      const lift =
        Number(
          /translate3d\(0, (-?[\d.]+)px/.exec(node.style.transform)?.[1],
        ) || 0;
      const range = document.createRange();
      range.selectNodeContents(node);
      for (const line of range.getClientRects())
        if (line.width > 1)
          avoid.push({
            x0: line.left - bounds.left,
            y0: line.top - bounds.top - lift,
            x1: line.right - bounds.left,
            y1: line.bottom - bounds.top - lift,
          });
    }
    layoutBox(worlds.querySelector<HTMLElement>('.hc-atrium-cta'));
    layoutBox(worlds.querySelector<HTMLElement>('.hc-atrium-baseline'));
    orbitGeometry = measureWorldsOrbit(
      bounds.width,
      bounds.height,
      avoid,
      geometry.header,
    );
    needsMeasure = false;
  };
  const expose = (node: HTMLElement | null, visible: boolean) => {
    if (!node) return;
    if (node.inert !== !visible) node.inert = !visible;
    if (node.getAttribute('aria-hidden') !== String(!visible))
      node.setAttribute('aria-hidden', String(!visible));
  };
  const property = (node: HTMLElement, name: string, value: string) => {
    if (node.style.getPropertyValue(name) !== value)
      node.style.setProperty(name, value);
  };
  const data = (node: HTMLElement, name: string, value: string | null) => {
    if (node.getAttribute(name) === value) return;
    if (value === null) node.removeAttribute(name);
    else node.setAttribute(name, value);
  };
  function render(now = performance.now()) {
    narrative = false;
    if (disposed || document.hidden) return;
    if (needsMeasure) measure();
    const scroll = document.documentElement.hasAttribute('data-home-intro')
      ? 0
      : window.scrollY;
    // baseStoryProgress: 0 → 1 over the approved journey's own span, clamped
    // (it stays 1 through the appended orbit span; it never runs past 1).
    const p = clamp((scroll - geometry.top) / geometry.span);
    if (p >= HOME_PRODUCTION.scenePreload) preparedImage?.start();
    const state = homeStoryFrame(p);
    const still = reduced.matches;
    // A failed plate never exposes an empty sky or interactive labels over the
    // wrong room. Retain the readable manifesto until the one image decodes.
    const bridgeProgress =
      sceneImage === 'ready' ? p : Math.min(p, bridgeTiming.exitStart);
    const bridge = bridgeFrame(bridgeProgress, geometry.width, still);
    const visualChapter = homeStoryFrame(bridgeProgress).chapter;
    const worldPose = atriumPose(bridgeProgress, atriumGeometry, still);
    // The room orbit samples its own appended span, only after the approved
    // journey has ended (p = 1). Reduced motion has no orbit span.
    const tier = orbitTier(geometry.width, geometry.height, still);
    const orbitEnabled = tier !== 'reduced' && geometry.orbit > 0 && !roomOrbit;
    const orbitProgress =
      orbitEnabled && sceneImage === 'ready'
        ? clamp((scroll - geometry.top - geometry.span) / geometry.orbit)
        : 0;
    const orbit = worldsOrbitFrame(orbitProgress, orbitGeometry, tier);
    // One camera, one origin, one bounded mass: the breath is expressed about
    // the arrival's origin, whose pose is the identity from camera end.
    const scenePose =
      orbitProgress > 0
        ? orbitPose(orbit, worldPose.originX, worldPose.originY)
        : worldPose;
    const elapsed = lastFrameTime ? now - lastFrameTime : 0;
    lastFrameTime = now;
    const motion = cameraImpulse(bridgeProgress, geometry.width);
    const profile = motionProfile(geometry.width);
    const massEnabled = !still && bridgeProgress < bridgeTiming.settled;
    const cameraResponse = settleVisual(
      cameraMass,
      scenePose,
      elapsed,
      geometry.width,
      geometry.height,
      orbitProgress > 0 ||
        (massEnabled &&
          bridge.scene3Visible &&
          bridgeProgress >= profile.cameraStart),
    );
    const architectureResponse = settleVisual(
      architectureMass,
      { x: 0, y: bridge.architectureY, scale: bridge.architectureScale },
      elapsed,
      geometry.width,
      geometry.height,
      massEnabled &&
        bridge.scene2Visible &&
        bridgeProgress > MOTION.departure.architecture[0],
    );
    cameraMass = cameraResponse.pose;
    architectureMass = architectureResponse.pose;
    if (cameraResponse.active || architectureResponse.active) schedule();
    const labelDeparture = storyTextDeparture(
      bridgeProgress,
      'labels',
      geometry.width,
      still,
    );
    const past = scroll + geometry.header >= geometry.bottom;
    heroDepth.update({
      progress: p,
      width: geometry.width,
      height: geometry.height,
      fine: finePointer.matches,
      reduced: still,
      visible: scroll <= geometry.top + geometry.span + 1,
    });
    discoveryInteraction.update({
      progress: bridgeProgress,
      width: geometry.width,
      reduced: still,
      visible:
        sceneImage === 'ready' &&
        scroll <= geometry.top + geometry.span + geometry.orbit + 1,
      // While the orbit carries the rooms, the World gateway keeps showing
      // the World: room previews never swap into it.
      orbit: orbit.orbit,
    });
    // Tier B (dormant: null): roomOrbitProgress is a separate 0 → 1 domain
    // over the appended span (geometry.orbit), 0 until p = 1.
    const roomOrbitProgress =
      roomOrbit && geometry.orbit > 0 && sceneImage === 'ready'
        ? clamp((scroll - geometry.top - geometry.span) / geometry.orbit)
        : 0;
    // Tier B returns the World gateway's late-Kitchen reveal; this timeline
    // stays the gateway's only writer.
    const tierB =
      roomOrbit?.update({
        baseStoryProgress: p,
        roomOrbitProgress,
        width: geometry.width,
        height: geometry.height,
        reduced: still,
      }) ?? null;
    const ivory = past ? 0 : bridge.headerIvory;
    const theme = ivory === 1 ? 'dark' : ivory > 0 ? 'bridge' : 'light';
    if (initialPaints > 0) {
      initialPaints--;
      schedule();
    } else startSecondary();
    skyBridge?.update({
      progress: bridgeProgress,
      width: geometry.width,
      height: geometry.height,
      reduced: still,
      fine: finePointer.matches,
      visible: scroll <= geometry.top + geometry.span + 1,
      sceneReady: sceneImage === 'ready',
      saveData,
      now,
    });
    if (skyHost?.dataset.skyState === 'active') atmosphericCrossing = true;
    else if (
      skyHost?.dataset.skyState === 'fallback' ||
      still ||
      bridgeProgress <= 0.5
    )
      atmosphericCrossing = false;
    else if (
      skyHost?.dataset.skyState === 'ready' &&
      bridgeProgress >= bridgeTiming.breezeEnd
    ) {
      // A restored/fast-skipped settled scene can finish warming without ever
      // painting an active cloud frame. Prime its reverse handoff only after
      // the original cloth is fully gone, preserving a late DOM crossing.
      atmosphericCrossing = true;
    }
    // Fabric airflow becomes open atmosphere: the cloth yields while the far,
    // mid and near banks are already forming behind it.
    breeze?.paint(
      bridgeProgress,
      still,
      atmosphericCrossing
        ? editorial(span(bridgeProgress, ...MOTION.breeze.takeover))
        : 0,
    );
    const progress = p.toFixed(5);
    if (root.dataset.storyProgress !== progress)
      root.dataset.storyProgress = progress;
    // Native progress is never corrected. A missing plate retains the readable
    // previous room rather than showing a blank crop or labels over that room.
    if (root.dataset.sceneImage !== sceneImage)
      root.dataset.sceneImage = sceneImage;
    const pose = tpPose(p, tpGeometry, still);
    const visualProgress =
      p <= tpTiming.settle
        ? p
        : p <= bridgeTiming.exitStart
          ? tpTiming.settle
          : Math.min(p, bridgeTiming.settled);
    const signature = `${visualProgress}/${orbitProgress}/${state.chapter}/${still}/${ready}/${sceneImage}/${theme}/${geometry.width}/${geometry.height}${tierB ? `/${tierB.gateway}/${tierB.gatewayInteractive}/${tierB.baseline}` : ''}`;
    if (camera) {
      property(
        camera,
        'transform-origin',
        `${worldPose.originX.toFixed(3)}px ${worldPose.originY.toFixed(3)}px`,
      );
      property(
        camera,
        'transform',
        cameraMass.x === 0 && cameraMass.y === 0 && cameraMass.scale === 1
          ? 'none'
          : `translate3d(${cameraMass.x.toFixed(3)}px, ${cameraMass.y.toFixed(3)}px, 0) scale(${cameraMass.scale.toFixed(7)})`,
      );
      property(
        camera,
        'will-change',
        cameraResponse.active ? 'transform' : 'auto',
      );
    }
    if (architecture) {
      property(
        architecture,
        'transform',
        `translate3d(0, ${architectureMass.y.toFixed(3)}px, 0) scale(${architectureMass.scale.toFixed(6)})`,
      );
      property(
        architecture,
        'will-change',
        architectureResponse.active ? 'transform' : 'auto',
      );
    }
    if (lastSignature !== signature) {
      lastSignature = signature;
      story!.dataset.motion = still ? 'reduced' : 'scroll';
      story!.dataset.scene =
        p <= (still ? tpTiming.reducedStart : tpTiming.hold)
          ? 'discovery'
          : p >= (still ? tpTiming.reducedEnd + 0.01 : tpTiming.settle)
            ? 'story'
            : 'transition';
      root.dataset.storyChapter = visualChapter;
      root.dataset.bridgePhase = bridge.phase;
      property(
        story!,
        'visibility',
        bridge.scene2Visible ? 'visible' : 'hidden',
      );
      property(
        worlds!,
        'visibility',
        bridge.scene3Visible ? 'visible' : 'hidden',
      );
      property(worlds!, 'opacity', bridge.worldOpacity.toFixed(5));
      if (roomLabels) {
        property(
          roomLabels,
          'transform-origin',
          `50% ${worldPose.originY.toFixed(3)}px`,
        );
        property(
          roomLabels,
          'transform',
          // Portal layout places rooms in viewport space (the orbit layer).
          geometry.width >= 1200 && !orbit.orbit
            ? scenePose.scale === 1 && scenePose.x === 0 && scenePose.y === 0
              ? 'translateX(-50%)'
              : `translateX(-50%) translate3d(${scenePose.x.toFixed(3)}px, ${scenePose.y.toFixed(3)}px, 0) scale(${scenePose.scale.toFixed(7)})`
            : 'none',
        );
      }
      property(worlds!, '--world-exposure', bridge.exposure.toFixed(5));
      if (sharedTP) {
        property(
          sharedTP,
          'transform',
          `translate3d(${pose.x.toFixed(4)}px, ${(pose.y + bridge.tpY).toFixed(4)}px, 0) scale(${(pose.scale * bridge.tpScale).toFixed(7)})`,
        );
        property(
          sharedTP,
          'opacity',
          (pose.opacity * bridge.tpOpacity).toFixed(5),
        );
        property(
          sharedTP,
          'visibility',
          bridge.scene2Visible ? 'visible' : 'hidden',
        );
        property(
          sharedTP,
          'will-change',
          !still &&
            (pose.phase === 'travel' ||
              (bridgeProgress > bridgeTiming.exitStart && !bridge.swapped))
            ? 'transform'
            : 'auto',
        );
        if (sharedTP.dataset.tpState !== pose.phase)
          sharedTP.dataset.tpState = pose.phase;
      }
      const values = arrivalFrame(p, geometry.width, ready, still);
      for (const { node, selector } of openingLayers) {
        if (!node) continue;
        for (const [key, value] of Object.entries(
          values[selector as keyof typeof values],
        )) {
          property(node, key, value);
        }
        const role = departureRole(selector);
        if (role && bridgeProgress > bridgeTiming.exitStart) {
          const exit = storyTextDeparture(
            bridgeProgress,
            role,
            geometry.width,
            still,
          );
          property(node, 'opacity', exit.opacity.toFixed(5));
          property(
            node,
            'transform',
            `translate3d(0, ${exit.y.toFixed(3)}px, 0)`,
          );
        }
      }
      if (manifesto) {
        property(manifesto, 'opacity', bridge.swapped ? '0.00000' : '1.00000');
        property(manifesto, 'transform', 'translate3d(0, 0, 0)');
      }
      if (centerCopy && bridgeProgress >= bridgeTiming.exitStart) {
        property(centerCopy, 'opacity', labelDeparture.opacity.toFixed(5));
        property(
          centerCopy,
          'transform',
          `translate3d(0, ${labelDeparture.y.toFixed(3)}px, 0)`,
        );
      }
      if (colophon)
        property(colophon, 'opacity', labelDeparture.opacity.toFixed(5));
      if (architecture)
        property(architecture, 'opacity', bridge.scene2Opacity.toFixed(5));
      for (const node of worldReveals) {
        const gateway = node.tagName === 'A' && !node.dataset.room;
        const reveal = worldReveal(
          bridgeProgress,
          Number(node.dataset.chapterReveal),
          still,
        );
        property(
          node,
          'opacity',
          (
            reveal.opacity *
            // The World gateway quietens while the rooms are explored; under
            // Tier B (dormant) it returns only in late Kitchen, and the
            // baseline leaves with the editorial UI in the final release.
            (gateway
              ? tierB
                ? tierB.gateway
                : orbit.gatewayOpacity
              : tierB && node.tagName !== 'A'
                ? tierB.baseline
                : 1)
          ).toFixed(5),
        );
        property(
          node,
          'transform',
          reveal.y === 0
            ? 'none'
            : `translate3d(0, ${reveal.y.toFixed(3)}px, 0)`,
        );
        property(node, '--room-reveal', reveal.opacity.toFixed(5));
        if (node.tagName === 'A')
          expose(
            node,
            reveal.interactive &&
              (!gateway || !tierB || tierB.gatewayInteractive),
          );
      }
      expose(story!, bridge.scene2Visible);
      expose(discovery, state.chapter === 'arrival');
      expose(
        portals,
        state.chapter === 'arrival' &&
          Number(values['.sh-portals'].opacity) > 0.01,
      );
      expose(
        manifesto,
        bridge.scene2Visible && p >= 0.3 && bridge.textOpacity > 0.05,
      );
      expose(
        readStory,
        bridge.scene2Visible &&
          labelDeparture.opacity > 0.8 &&
          visualChapter === 'perspective' &&
          p >= (still ? arrivalTiming.reduced : arrivalTiming).labels[1],
      );
      expose(worlds!, bridge.interactive);
      // TP3D PASS — Atrium room orbit: one explicit mode; positions, depth
      // and the doorway exposure are custom properties only.
      data(worlds!, 'data-room-orbit', orbit.orbit ? '' : null);
      data(worlds!, 'data-orbit-room', orbit.activeRoom);
      for (const { node, room } of roomWrappers) {
        const portal = room ? orbit.portals[room] : null;
        // Before the switch the lintel labels fade; after it, the portals.
        property(
          node,
          '--orbit-opacity',
          (portal && orbit.orbit ? portal.opacity : orbit.labels).toFixed(5),
        );
        // Positions are pure functions of scroll, written whenever the orbit
        // exists (inert until portal layout), so the DOM never depends on
        // the path that reached a scroll position.
        if (!portal || !orbitEnabled) continue;
        property(node, '--orbit-x', `${portal.x.toFixed(2)}px`);
        property(node, '--orbit-y', `${portal.y.toFixed(2)}px`);
        property(node, '--orbit-scale', portal.scale.toFixed(5));
        property(node, '--orbit-blur', `${portal.blur.toFixed(3)}px`);
        property(node, '--orbit-depth', portal.depth.toFixed(5));
        property(node, '--orbit-z', String(portal.z));
      }
      if (roomFocus) {
        property(roomFocus, '--room-focus-x', `${orbit.focusX.toFixed(2)}px`);
        property(roomFocus, '--room-focus-y', `${orbit.focusY.toFixed(2)}px`);
        property(
          roomFocus,
          '--room-focus-opacity',
          orbit.focusOpacity.toFixed(5),
        );
      }
      if (rail) {
        // Preserve the approved midpoint/end rail positions; no motion in holds.
        const midpoint = 0.47 / 0.92;
        property(
          rail,
          '--story-rail-progress',
          String(
            state.perspective * midpoint +
              Math.max(
                0,
                Math.min(
                  1,
                  (bridgeProgress - bridgeTiming.exitStart) /
                    (bridgeTiming.settled - bridgeTiming.exitStart),
                ),
              ) *
                (1 - midpoint),
          ),
        );
        property(
          rail,
          'opacity',
          // Typography leaves before the atmosphere closes in.
          bridgeProgress >= MOTION.breeze.takeover[0] &&
            bridgeProgress < bridgeTiming.revealStart
            ? '0'
            : '1',
        );
      }
      if (header) {
        property(header, '--home-header-ivory', `${(ivory * 100).toFixed(3)}%`);
        if (header.dataset.chapterTheme !== theme)
          header.dataset.chapterTheme = theme;
        const opening = state.chapter === 'arrival' ? 'active' : 'past';
        if (header.dataset.opening !== opening)
          header.dataset.opening = opening;
      }
    }
    if (debug) {
      debugNarrative = `bridge ${bridgeProgress.toFixed(4)} (native ${progress}) · ${bridge.phase} · ${motion.phase} · TP ${pose.phase} · Breeze ${motion.approach.toFixed(3)}/${motion.through.toFixed(3)} · Scene3 ${worldPose.scale.toFixed(4)} · camera ${cameraMass.scale.toFixed(4)} · mass ${cameraResponse.active || architectureResponse.active ? 'settling' : 'rest'}${roomOrbit ? ` · ${roomOrbit.debug()}` : ''}`;
      debug.textContent = debugLine();
    }
    // Reveal the sampled restored frame, never the default scene first.
    if (
      document.readyState === 'complete' &&
      (sceneImage !== 'loading' || p < bridgeTiming.exitStart) &&
      document.documentElement.hasAttribute('data-home-restoring')
    ) {
      if (window.__tpHomeIntroRuntime?.restoreWatchdog !== undefined) {
        window.clearTimeout(window.__tpHomeIntroRuntime.restoreWatchdog);
        window.__tpHomeIntroRuntime.restoreWatchdog = undefined;
      }
      document.documentElement.removeAttribute('data-home-restoring');
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
      discoveryInteraction.suspend();
      roomOrbit?.suspend();
      skyBridge?.suspend();
      heroDepth.suspend();
      for (const node of [camera, architecture, sharedTP])
        if (node) property(node, 'will-change', 'auto');
    } else resize();
  };
  const restore = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    needsMeasure = true;
    lastSignature = '';
    render();
    if (skyBridge?.wantsTime()) request();
  };
  const observer = new ResizeObserver(resize);
  for (const node of [sequence, stage, header])
    if (node) observer.observe(node);
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('pageshow', restore);
  document.addEventListener('visibilitychange', visibility);
  reduced.addEventListener('change', resize);
  finePointer.addEventListener('change', resize);
  const preparedImage = image
    ? prepareSceneImage(image, {
        ready: () => {
          sceneImage = 'ready';
          schedule();
        },
        failed: () => {
          sceneImage = 'failed';
          schedule();
        },
      })
    : null;
  // TP3D PASS 6A — Tier B gate. Compiled in only for development or a
  // preview build (VITE_ATRIUM_ORBIT_PREVIEW=1) and loaded only with
  // ?atriumOrbit=1, so the production homepage never requests it. Any
  // failure keeps the approved Scene 3. docs/TANPHONG_ATRIUM_ORBIT_IMPLEMENTATION.md
  // PASS 6A.96: that URL is the clean review preview. The engineering
  // readout needs its own explicit &atriumOrbitDebug=1 (in development,
  // ?storyDebug=1 keeps showing it too).
  if (
    (import.meta.env.DEV ||
      import.meta.env.VITE_ATRIUM_ORBIT_PREVIEW === '1') &&
    new URLSearchParams(window.location.search).get('atriumOrbit') === '1'
  )
    void import('./atrium-orbit-controller').then(
      ({ createAtriumOrbitController }) => {
        if (disposed) return;
        roomOrbit = createAtriumOrbitController(worlds, schedule, {
          diagnostics:
            !!debug ||
            new URLSearchParams(window.location.search).get(
              'atriumOrbitDebug',
            ) === '1',
        });
        resize();
      },
      () => {},
    );
  render();
  return () => {
    if (disposed) return;
    disposed = true;
    preparedImage?.destroy();
    discoveryInteraction.destroy();
    roomOrbit?.destroy();
    roomOrbit = null;
    skyBridge?.destroy();
    heroDepth.destroy();
    cancelAnimationFrame(frame);
    observer.disconnect();
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', resize);
    window.removeEventListener('pageshow', restore);
    document.removeEventListener('visibilitychange', visibility);
    reduced.removeEventListener('change', resize);
    finePointer.removeEventListener('change', resize);
    secondary?.removeEventListener('load', imageSettled);
    secondary?.removeEventListener('error', imageSettled);
    debug?.remove();
    if (header) {
      if (headerMix)
        header.style.setProperty(
          '--home-header-ivory',
          headerMix,
          headerMixPriority,
        );
      else header.style.removeProperty('--home-header-ivory');
    }
    for (const { node, attributes } of saved)
      for (const [name, value] of attributes) {
        if (value === null) node.removeAttribute(name);
        else node.setAttribute(name, value);
      }
    breeze?.destroy();
  };
}
